# 外部ライブラリのインポート
from flask import (
    Flask,Blueprint,
    redirect,render_template,jsonify,url_for,make_response,request,flash,send_file
)
from flask_wtf.csrf import CSRFProtect
from flask_socketio import SocketIO, emit, send,join_room,leave_room,close_room,rooms,disconnect,ConnectionRefusedError
from flask_migrate import Migrate
from flask_login import (
    LoginManager, UserMixin, current_user,
    login_required, login_user, logout_user
)

# 標準モジュールのインポート
import importlib,mimetypes,asyncio,os

# モデルのインポート
from db.model import *
# スケジュールのインポート
from job.task import * 
from common.utils import *
from common.logger import *
from common.file import *
from common.flask_wrapper import SingletonFlask

settings = ddd(JsonData("etc/config/settings.json").data)
constant = ddd(JsonData("etc/config/constant.json").data)
messages = ddd(JsonData("etc/config/messages.json").data)

sf = SingletonFlask(__name__,async_mode=settings.app.async_mode)
socketio = sf.socketio
migrate = sf.migrate
csrf = sf.csrf
app = sf.app

app.config["SECRET_KEY"] = settings.app.secretkey
app.config['JSON_AS_ASCII'] = False
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = settings.db.client
app.config["SQLALCHEMY_BINDS"] = {
    "server": settings.db.server,
}

login_manager = sf.login_manager
login_manager.login_view = "auth.login"
login_manager.login_message = ""
@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(id=user_id).first()

@app.context_processor
def inject_const():
    return {"settings":settings,"constant":constant,"messages":messages, "endpoints":endpoints()}

@socketio.event
def connect():
    print(current_user.name, "connect websocket.")
    room = f"user-{current_user.id}"
    join_room(room)
    print("join_room",room)
    # socketio.emit("connect", {"message":f"connect:{current_user.id}:{current_user.email}"}, to=room)
    # socketio.emit("message", {"message":f"connect:{current_user.id}:{current_user.email}"}, to=room)
    emit("message", {"message":f"connect:{current_user.id}:{current_user.email}"}, to=room)

def create_app():
    global socketio, app, aps

    # 各機能を初期化
    db.init_app(app)
    # login_manager.init_app(app)
    dd = DirData("src")
    for m in dd.files.keys():
        if "bp.py" in m:
            module = importlib.import_module(m.replace("/",".").replace(".py",""))
            if hasattr(module,"bp"):
                app.register_blueprint(module.bp)

    # URL Route
    for rule in app.url_map.iter_rules():
        print(rule,rule.endpoint)

    # Socket Route
    print(socketio.server.handlers)
    print(socketio)

    aps.init_app(app)
    aps.start()

    print(endpoints())

    return app

def endpoints():
    endpoint_dict = {}
    for rule in app.url_map.iter_rules():
        endpoint_dict[rule.endpoint] = rule.rule

    return endpoint_dict

def main():
    # PIDの書き出し
    pid = os.getpid()
    pidf = FileData("etc/pid",first_read=False)
    pidf.data = str(pid)
    pidf.write()
    print("pid:", pid)
        
    # アプリケーションの初期化
    app = create_app()
    t = sf.run(settings.app.host, settings.app.port)
    t.join()


if __name__ == "__main__":
    # create_app().run(host=settings.app.host,port=settings.app.port)
    main()
