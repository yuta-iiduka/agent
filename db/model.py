from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# 標準ライブラリのインポート
from functools import wraps
import datetime, inspect, sys, json, ast, uuid, decimal, enum

db = SQLAlchemy()

# デコレータの初期化
def transaction(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            db.session.begin(True)
            result = func(*args, **kwargs)
            db.session.commit()
            return result
            
        except Exception as e:
            db.session.rollback()
            raise e
    return wrapper

class BaseColumn(object):
    id         = db.Column(db.Integer,  primary_key=True)
    status     = db.Column(db.Integer,  default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    deleted_at = db.Column(db.DateTime, default=None)

    @classmethod
    def to_dict_list(cls, model_list):
        return [obj.to_dict() for obj in model_list]

    def to_dict(
        self,
        include_relationships=False,
        backref=False,
        exclude_none=False,
    ):
        def serialize(value):
            """あらゆる型をJSON化可能な形に変換する"""

            if value is None:
                return None

            # datetime系
            if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
                return value.isoformat()

            # Decimal
            if isinstance(value, decimal.Decimal):
                return float(value)

            # UUID
            if isinstance(value, uuid.UUID):
                return str(value)

            # Enum
            if isinstance(value, enum.Enum):
                return value.value

            # list / tuple / set
            if isinstance(value, (list, tuple, set)):
                return [serialize(v) for v in value]

            # dict (JSONカラム含む)
            if isinstance(value, dict):
                return {k: serialize(v) for k, v in value.items()}

            # SQLAlchemyモデル（リレーション用）
            if isinstance(value.__class__, db.Model.__class__):
                return value.to_dict(include_relationships=backref)

            return value

        result = {}

        # カラム
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            serialized = serialize(value)

            if exclude_none and serialized is None:
                continue

            result[column.name] = serialized

        # リレーション
        if include_relationships:
            for relation in self.__mapper__.relationships:
                value = getattr(self, relation.key)

                if value is None:
                    result[relation.key] = None
                elif relation.uselist:
                    result[relation.key] = [
                        item.to_dict(backref=True)
                        for item in value
                    ]
                else:
                    result[relation.key] = value.to_dict(backref=True)

        return result

class User(db.Model,UserMixin,BaseColumn):
    """ userテーブル
    """
    __tablename__ = "user"
    __bind_key__  = "server"
    name      = db.Column(db.String(64), nullable=True)
    email     = db.Column(db.String(64), nullable=False)
    password_ = db.Column("password", db.String(64), nullable=False ,default="")
    role      = db.Column(db.Integer, default=0)
    group     = db.Column(db.Integer, default=0)
    auth      = db.Column(db.Integer, default=0)

    @property
    def password(self):
        raise AttributeError("読み取り不可")
    
    @password.setter
    def password(self,password):
        self.password_ = generate_password_hash(password)
        
    def verify_password(self, password):
        return check_password_hash(self.password_, password)
        
    def is_duplicate_name(self):
        return User.query.filter_by(name=self.name).first() is not None

    def is_duplicate_email(self):
        return User.query.filter_by(name=self.email).first() is not None


class Memo(db.Model,UserMixin,BaseColumn):
    """ Memoテーブル
    """
    __tablename__ = "memo"
    text       = db.Column(db.Text, nullable=False, default="")
    creator_id = db.Column(db.Integer, nullable=False)
    updater_id = db.Column(db.Integer, nullable=False)


if __name__ == "__main__":
    pass