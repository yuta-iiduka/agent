""" Flaskのラッパークラスを提供するモジュール
    ### Outlines
    このシステムにおいてFlaskのHTTP(S)サーバが唯一であることを保証する
    インポートによって、何度もFlaskが初期化されたり、それに関わる機能が複数生成されないようにする
    ### Note
        Redisサーバを利用して、バックエンドタスクの管理をする場合、redis,celeryをインストールする
    ```
    # 外部ライブラリのインストールが必要
    pip install redis
    pip install celery
    ```
    ``` 
    # タスク管理サーバの起動
    # Windows Redisの起動
    Get-Service *memurai*
    Start-Service Memurai
    # Linux Redisの起動
    systemctl restart redis.service
    # Celeryの起動
    celery -A server:celery_app worker -l info
    ```
"""
# 標準ライブラリ
import threading,functools,importlib
# 外部ライブラリ
from flask import Flask
from flask_login import LoginManager, current_user
from flask_socketio import SocketIO
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect

is_enable_redis = False
redis_error = ""
try:
    import redis, celery
    from celery.result import AsyncResult
    is_enable_redis = True
except Exception as e:
    redis_error = e
    is_enable_redis = False

# 自製ライブラリ
from db.model import db

class SingletonFlask:
    """ シングルトンパターンで実装したFlaskのラッパークラス
    ### Outlines
        このWEBアプリケーションにおいて必ずFlaskとその拡張機能、Flaskと連携する機能をただ一つとして保証するクラス
    ### Note
        WEBSocketや通信用のオブジェクトが複数生成されると、ルーティングが適用されないなどの不具合がでるため、シングルトンパターンによる実装が必須。
        ワーカーを複数作る場合WEBSocketのコネクション管理ができなくなるケースがある。そのため、Redisにメッセージ管理を行うようにする。
        また、処理が重いものがある場合CeleryをRedisへバックエンドタスク登録のブローカーとして活用することも可能
    ### Examples
    ```
        fs = SingletonFlask(__name__)
        app = fs.app
        app.config["SECRET_KEY"] = "secret_key"

        @fs.celery.task
        def heavy_task():
            # 重い処理
            pass 
    ```
    """

    _instance = None
    _initialized = False
    redis_host = "127.0.0.1"
    redis_port = 6379
    task_index_ws = 0
    task_index_broker = 1
    task_index_backend = 2
    timeout = 10
    result_expires=3600

    @property
    def redis_url(self):
        return f"redis://{SingletonFlask.redis_host}:{SingletonFlask.redis_port}/"

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self,name=None,async_mode="threading"):
        self.name = name
        if SingletonFlask._initialized:
            return
        else:
            if name is None:
                raise Exception("Flaskの初期化に失敗しました。")
            self.app           = Flask(name)
            self.login_manager = LoginManager(self.app)
            self.migrate       = Migrate(self.app, db)
            self.csrf          = CSRFProtect(self.app)                
            self.celery        = None
            self.redis         = None
            self.socketio      = None

            option = {"cors_allowed_origins":"*"}

            if async_mode == "gevent":
                from gevent import monkey
                monkey.patch_all()
                
            global is_enable_redis
            if is_enable_redis:

                self.celery = celery.Celery(
                    "tasks",
                    broker  = f"{self.redis_url}{self.task_index_broker}",
                    backend = f"{self.redis_url}{self.task_index_backend}",
                )
                self.celery.conf.update(
                    result_expires=self.result_expires,
                    redis_backend_expires=self.result_expires,
                )
                self.redis = redis.Redis(
                    host                   = self.redis_host,
                    port                   = self.redis_port,
                    db                     = self.task_index_backend,
                    socket_connect_timeout = self.timeout,
                    socket_timeout         = self.timeout,
                )
                if self.ping_redis():
                    option["message_queue"] = f"{self.redis_url}{self.task_index_ws}"
                else:
                    print("Redisサーバへのpingが失敗しました。設定やサービスが起動していることを確認してください。")
                    # モジュールなどの準備ができていてもping()が有効でない場合は、フラグをFlaseに戻して、無効化する。
                    is_enable_redis = False

            self.socketio = SocketIO(self.app, async_mode=async_mode, **option)


            SingletonFlask._instance = self
            SingletonFlask._initialized = True
        
    def run(self,*args):
        t = threading.Thread(target=self.socketio.run, args=(self.app,*args), daemon=True)
        t.start()
        return t
    
    def ping_redis(self):
        """ Redisサーバとの疎通
        ### Args
            db (int): 接続する DB 番号
            timeout (int): タイムアウト(秒)
        ### Returns
            result(bool)
        """
        global is_enable_redis
        result = False
        if is_enable_redis:
            try:
                
                if self.redis and self.redis.ping():
                    result = True

            except Exception as e:
                print(e)
                result = False
        return result
    
    def send_task(self,import_path,*args,**kwargs):
        """
        ### Args
        import_path(str):登録する関数までのインポートルートパス 
        ex) "src._api.bp.heavy"
        """
        user_id = current_user.id
        kwargs["__user_id"] = user_id
        task = self.celery.send_task(import_path,args=args,kwargs=kwargs)
        return task
    
    def heavy_task(self,func):
        if self.celery is not None:
            return self.celery.task(bind=True)(func)
        else:
            return func

    def context(self, func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with self.app.app_context():
                return func(*args, **kwargs)
        return wrapper
        
    def alert(self, event="progress"):
        def dec(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                task = celery.current_task
                user_id = kwargs.pop("__user_id","")
                room = f"{user_id}-redis"
                try:
                    meta = {"message":"start","status":"RUNNING","id":task.request.id}
                    task.update_state(state="STARTED",meta=meta)
                    self.socketio.emit(event, meta, to=room)

                    result = func(*args, **kwargs)
                    meta = {"message":"end","status":"RUNNING","id":task.request.id}
                    task.update_state(state="SUCCESS",meta=meta)
                    self.socketio.emit(event, meta, to=room)

                except Exception as e:
                    result = str(e)
                    meta = {"error":str(e),"status":"END","id":task.request.id}
                    task.update_state(state="FAILURE",meta=meta)
                    self.socketio.emit(event, meta, to=room)

                meta =  {"result":result,"status":"RESULT","id":task.request.id}
                self.socketio.emit(event, meta, to=room)
                return result
            return wrapper
        return dec

    def dynamic_task(self, import_path:str, *args, **kwargs):
        import_elm  = import_path.split(".")
        module_name = ".".join(import_elm[:-1])
        func_name   = import_elm[-1]
        module = importlib.import_module(module_name)
        func = getattr(module, func_name)
        try:
            # TODO: 必要な引数だけを渡すにはどうすればいいか
            result = {"result":func(*args, **kwargs),"error":False}
        except Exception as e:
            print(e)
            result = {"result":str(e),"error":True}
        return result

if __name__ == "__main__":
    print("redis_error:", redis_error)
    print("is_enable_redis:", is_enable_redis)