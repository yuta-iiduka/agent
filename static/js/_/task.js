const taskio = io(window.location.origin,{transports:["websocket"], withCredentials: true});
const taskrj = new RequestJSON();
taskio.on("progress", (data)=>{
    console.log(data);
});
taskio.on("message", (data)=>{
    console.log(data);
})
taskio.on("error", (data)=>{
    console.error(data);
})


function ping_redis(){
    taskio.emit(ws_url_for("ping_redis"));
}

class Task{
    constructor(import_path,args=[],kwargs={}){
        this.import_path = import_path
        this._args   = args;
        this._kwargs = kwargs;
    }

    get args(){
        return this._args;
    }

    set args(list){
        this._args = list 
    }

    get kwargs(){
        return this._kwargs;
    }

    set kwargs(dict){
        this._kwargs = dict;
    }

    get data(){
        return {
            "function":this.import_path,
            "args":this.args,
            "kwargs":this.kwargs,
        }
    }
}

async function append_normal_task(import_path,args,kwargs){
    const task = new Task(import_path)
    task.args = args
    task.kwargs = kwargs
    const api = url_for("api.task_normal_append");
    const result = await taskrj.fetchPOST(api,task.data);
    console.log(result);
    return result;
}

async function append_dynamic_task(import_path,args,kwargs){
    const task = new Task("src._.bp.dynamic_task")
    task.args = [import_path, ...args];
    task.kwargs = kwargs
    const api = url_for("api.task_dynamic_append");
    const result = await taskrj.fetchPOST(api,task.data);
    console.log(result);
    return result;
}