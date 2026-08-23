

class HTMXManager{

    static handlers = {} // {event:[{"id":callback}]}
    static events = [
        "htmx:beforeRequest",
        "htmx:before-request",
        "htmx:afterRequest",
        "htmx:after-request",
        "htmx:beforeSwap",
        "htmx:afterSwap",
        "htmx:load",          // HTMXによるDOM追加が行われた際のイベント
        "htmx:confirm",       // 確認タイミングイベント
    ];

    constructor(htmx){
        this.htmx = htmx;
    }

    process(selector){
        const dom = document.getElementById(selector);
        this.htmx.process(dom);
    }

    init_event(){
        const events = HTMXManager.events;
        for(let name of events){
            this.htmx.on(name, (e)=>{
                const handlers = HTMXManager.handlers;
                const handler_dict = handlers[name] || [];
                for(let handler of handler_dict){
                    const func = handler[e.detail.elt.id];
                    if(func){
                        func(e);
                        console.log("event.target:", event.target);
                        console.log("detail.elt:", event.detail?.elt);
                        console.log("detail.target:", event.detail?.target);
                        console.log("detail:", event.detail);
                        break;
                    }
                }
            });
        }
    }

    appendEvent(event, id, callback){
        if(HTMXManager.handlers[event] == undefined){
            HTMXManager.handlers[event] = [];
        }
        let target = id;
        if(typeof(id) != "string"){
            target = id.id;
        }
        const tmp = {}
        tmp[target] = callback
        HTMXManager.handlers[event].push(tmp);
    }

    /**
     * appendEventの別名
     * @param {*} event 
     * @param {*} id 
     * @param {*} callback 
     * @returns 
     */
    on(event, id , callback){
        return this.appendEvent(event, id , callback)
    }

    removeEvent(event, id){
        if(HTMXManager.handlers[event] == undefined){
            HTMXManager.handlers[event] = [];
        }
        let target = id;
        if(typeof(id) != "string"){
            target = id.id;
        }
        HTMXManager.handlers[event] = HTMXManager.handlers[event].filter((d)=>d.id != target);
    }

    /**
     * removeEventの別名
     * @param {*} event 
     * @param {*} id 
     * @returns 
     */
    rm(event, id){
        return this.removeEvent(event, id, callback);
    }

}