

class HTMXManager{

    static handlers = {} // {event:[{"id":callback}]}
    static events = [
        "htmx:beforeRequest",
        "htmx:afterRequest",
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
                for(let i of Object.keys(handler_dict)){
                    if(i == e.detail.elt.id){
                        handler_dict[i](e);
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
        if(typeof(HTMXManager.handlers[event]) == undefined){
            HTMXManager.handlers[event] = []
        }
        const tmp = {}
        tmp[id] = callback
        HTMXManager.handlers[event].push(tmp);
    }

    removeEvent(event, id){
        if(typeof(HTMXManager.handlers[event]) == undefined){
            HTMXManager.handlers[event] = [];
        }
        HTMXManager.handlers[event] = HTMXManager.handlers[event].filter((d)=>d.id!=id);
    }
}