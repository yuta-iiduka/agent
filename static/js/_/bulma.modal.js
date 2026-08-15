
const tmplate_modal = `
    <div class="modal middle">
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">Modal title</p>
                <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                <!-- Content ... -->

            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <!-- <button class="button is-success">Save changes</button> -->
                    <!-- <button class="button">Cancel</button> -->
                </div>
            </footer>
        </div>
    </div>
`;

const template_style = `
    .small .modal-card{
        width: 50%;
        min-width: 320px;
        max-width: 640px;
    }

    .middle .modal-card{
        width: 70%;
        max-width: 960px;
    }

    .large .modal-card{
        width: 90%;
        max-width: 1480px;
    }
`;

class BulmaModal{

    static id = 0;
    static style = document.createElement("style");

    static{
        document.querySelector("head").appendChild(this.style);
    }

    static css(str){
        this.style.innerHTML = str;
        return this.style;
    }

    constructor(selector="body"){
        this.id = BulmaModal.id++;
        this.name = `--bulma-modal${this.id}`;
        this.selector = selector;
        this.parent = document.querySelector(this.selector);
        this.html = "";
        this.fragment = null;
        this.dom = null;
        this.head = null;
        this.body = null;
        this.foot = null;
        this.back = null;
        this.opener = [];
        this.closer = [];
        this.event  = {};
    }

    /**
     * hide,showのイベント登録関数
     * @param {String} event 
     * @param {Function} callback 
     */
    addEventListener(event, callback){
        this.event[event] = callback;
    }

    get template(){
        return this.html;
    }

    set template(str){
        this.html = str;
        this.fragment = document.createRange().createContextualFragment(this.html);
        this.fragment.querySelector(".modal").id = this.name;
        this.parent.appendChild(this.fragment);
        this.dom = this.parent.querySelector(`#${this.name}`);
        this.back = this.dom.querySelector(`.modal-background`);
        this.head = this.dom.querySelector(`.modal-card-head`);
        this.body = this.dom.querySelector(`.modal-card-body`);
        this.foot = this.dom.querySelector(`.modal-card-foot`);
        this.closer.push(this.back);
        this.closer.push(this.head.querySelector(".delete"));

        for(let cls of this.closer){
            cls.addEventListener("click",()=>{
                this.hide();
            });
        }
    }

    get title(){
        this.dom.querySelector(`.modal-card-title`).textContent;
    }

    set title(str="Modal Title"){
        this.dom.querySelector(`.modal-card-title`).textContent = str;
    }

    trigger(selector){
        const doms = [...document.querySelectorAll(selector)];
        for(let dom of doms){
            this.opener.push(dom);
            dom.addEventListener("click",()=>{
                this.show();
            });
        }
        return this;
    }

    show(){
        if(typeof(this.event.show)=="function"){
            this.event.show();
        }
        this.dom.classList.add("is-active");
    }

    hide(){
        this.dom.classList.remove("is-active");
        if(typeof(this.event.hide)=="function"){
            this.event.hide();
        }
    }

    button(btn){
        if(typeof(btn) == "string"){
            this.foot.querySelector(".buttons").innerHTML = btn;    
        }else{
            this.foot.querySelector(".buttons").appendChild(btn);
        }
    }

    message(msg="",title="通知"){
        if(msg){
            alert_modal.title = title;
            alert_modal.body.innerHTML = `<p style="display:flex; justify-content:center;">${msg}</p>`;
            alert_modal.show();
        }
    }


}


class BulmaConfirmModal extends BulmaModal{

    constructor(selector="body"){
        super(selector);
        this.template = tmplate_modal;
        this.ok = document.createElement("button");
        this.ok.classList.add("button");
        this.ok.classList.add("is-success");
        this.ok.textContent = "OK";
        this.ok.addEventListener("click",()=>{
            this.result = true;
            this.hide();
        });
        this.cancel = document.createElement("button");
        this.cancel.classList.add("button");
        this.cancel.textContent = "Cancel";
        this.cancel.addEventListener("click",()=>{
            this.result = false;
            this.hide();
        });

        this.button(this.ok);
        this.button(this.cancel);

        this.result = false;
        this.resolve = null;

        for(let cls of this.closer){
            cls.addEventListener("click",()=>{
                this.result = false;
            });
        }
    }

    confirm(message="",callback=null){
        return new Promise((resolve)=>{
            this.show();
            this.resolve = resolve;
            this.body.innerHTML = `<p style="display:flex; justify-content:center;">${message}</p>`
        }).then((result)=>{
            console.log(result);
            if( result == true && (typeof(this.event.confirm) == "function" || typeof(callback) == "function") ){
                if(this.event.confirm){
                    return this.event.confirm(result);
                }else{
                    return callback(result);
                }
            }
            return false;
        });
    }

    show(){
        this.resolve = null;
        super.show();
        this.result = false;
    }

    hide(){
        if(typeof(this.resolve) == "function"){
            this.resolve(this.result);
        }
        super.hide();
    }


}

BulmaModal.css(template_style);
const alert_modal = new BulmaModal();
alert_modal.template = tmplate_modal;

const confirm_modal = new BulmaConfirmModal();
