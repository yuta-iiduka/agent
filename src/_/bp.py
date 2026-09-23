from server import *
import time

NAME = "api"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")

t = Tracer()
@t.reporter
def tmp(data):
    print(f"{data}%")


@bp.route("/task/normal",methods=["POST"])
@login_required
def task_normal_append():
    data = request.get_json()
    function = data.get("function",None)
    args     = data.get("args",[])
    kwargs   = data.get("kwargs",{})
    res = {}
    try:
        task = sf.send_task(function,*args,**kwargs)
        res  = {"message":"タスク登録に成功しました。","id":task.id}
        socketio.emit("message", res, to=f"{current_user.id}-redis")
    except Exception as e:
        res = {"error":"タスク登録に失敗しました。","id":task.id}
        socketio.emit("message", res, to=f"{current_user.id}-redis")
        print(e)
    return jsonify(res)

@bp.route("/task/dynamic",methods=["POST"])
@login_required
def task_dynamic_append():
    data = request.get_json()
    function = data.get("function",None)
    args     = data.get("args",[])
    kwargs   = data.get("kwargs",{})
    res = {}
    try:
        if ".." not in function and not function.startswith("src"):
            raise Exception("モジュールの指定が不適です。")

        task = sf.send_task(function,*args,**kwargs)
        res  = {"message":"タスク登録に成功しました。","id":task.id}
        socketio.emit("message", res, to=f"{current_user.id}-redis")
    except Exception as e:
        res = {"error":"タスク登録に失敗しました。","id":task.id}
        socketio.emit("message", res, to=f"{current_user.id}-redis")
        print(e)

    return jsonify(res)
    
@bp.route("/task/status/<task_id>",methods=["GET"])
@login_required
def task_status(task_id):
    result = AsyncResult(task_id, app=sf.celery)
    data = {"state": result.state,"info":result.info}
    if result.successful():
        data["result"] = result.result
    else:
        data["error"] = result.result
    return jsonify(data)

@bp.route("/redis/ping",methods=["POST"])
@login_required
def api_ping_redis():
    join_room(f"{current_user.id}-redis")
    print("join_room",f"{current_user.id}-redis")

@sf.socketio.event
@login_required
def ping_redis():
    join_room(f"{current_user.id}-redis")
    print("join_room",f"{current_user.id}-redis")    

@sf.heavy_task
@sf.alert("progress")
@sf.context
def heavy_task(self, *args, **kwargs):
    time.sleep(4)
    return "タスク終了"

@sf.heavy_task
@sf.alert("progress")
@sf.context
def dynamic_task(self, func, *args, **kwargs):
    print(func, args, kwargs)
    return sf.dynamic_task(func, *args, **kwargs)

@t.monitor
def heavy_wait(wait:int=4):
    time.sleep(wait)
    return "タスク終了"
