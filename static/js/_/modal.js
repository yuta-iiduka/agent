console.log("modal.js is called.")
// NOTE: Modalessの実装
/**
 * 優先的に表示されるモーダル画面を自動生成するクラス。
 * 複数のモーダルが生成されている場合、表示順序が決定され、後から表示されるモーダルを優先的に映す。
 * また、同時に２つ以上のモーダルを列挙することはできないため、モーダルは重なって表示されることになる。
 */
class Modal{
    static list = [];
    static cnt = 0;
    static zIndex = 1; //各画面で利用するzIndexのうち、Modalを表示するための最小のzIndexを設定する

    static SIZE = {LARGE:"large",MIDDLE:"middle",SMALL:"small",XSMALL:"x-small"};
    static BTN = {YES:"OK",NO:"キャンセル"}
    static active_modal = null; // 表示・非表示を切り替えた後、最終的に表示されているModalが格納される ※特定のモーダルを取得する場合は、変数に格納しておくか、Modal.listからindexを指定して取得する

    /**
     * Modalを自動生成するクラス。
     * 各設定のセッターをメソッドーチェーンで呼び出すことが可能。
     * デザインに関してはCSSで定義する。
     * @param {String} size large,middle,smallのいずれかから選びModalのサイズを指定する。省略すると自動的にmiddleサイズになる。
     */
    constructor(size=Modal.SIZE.MIDDLE){
        // Modalの連番を振る
        this.id = Modal.cnt;

        // Modalのサイズ
        this.size = size;
        // Modalが多重で起動した場合の優先順位格納変数
        this.zIndex = 1;

        // Modalの部品に対応するDOM
        this.head = null;
        this.body = null;
        this.foot = null;
        this.background = null;
        this.symbol = null;
        this.symbol_message = null;
        this.title = "";
        this.close_btn = null;
        this.yes_btn = null;
        this.no_btn = null;
        this.foot_custom = null;
        this.foot_btns = null;
        this.visible = false;
        this.result = false;
        this.resolver = null;

        // ModalのHTMLDOM（実態）を作成
        this.dom = this.create();
        // Bodyに実態を追加
        document.body.appendChild(this.dom);

        // Modalの起動トリガー群
        this.triggers = [];

        // Modal起動・終了時の処理関数格納用変数
        this.show_event = null; //function
        this.hide_event = null; //function

        // そのほかModalオブジェクトごとにデータを保持したい場合の格納場所
        this.data = null;
        
        Modal.list.push(this);
        Modal.cnt++;
    }

    create(){
        const self = this;
        // ---Modalの基盤
        const modal = document.createElement("div");
        modal.id = `modal${this.id}`;
        modal.classList.add("modal");

        const modal_frame = document.createElement("div");
        modal_frame.id = `modal_frame${this.id}`;
        modal_frame.classList.add("modal_frame",this.size);
        modal.appendChild(modal_frame);
        this.frame = modal_frame;

        // --Modalのヘッダー
        const modal_head = document.createElement("div");
        modal_head.id = `modal_head${this.id}`;
        modal_head.classList.add("modal_head");
        modal_frame.appendChild(modal_head);
        this.head = modal_head;

        // -Modalのタイトル
        const modal_title = document.createElement("div");
        modal_title.id = `modal_title${this.id}`;
        modal_title.classList.add("modal_title");
        modal_head.appendChild(modal_title);
        this.title = modal_title;

        // -Modalの閉じるボタン
        const modal_close_btn = document.createElement("div");
        modal_close_btn.id = `modal_close_btn${this.id}`;
        modal_close_btn.classList.add("modal_close_btn");
        modal_close_btn.textContent = "×";
        modal_close_btn.addEventListener("click",function(){
            self.hide();
        });
        modal_head.appendChild(modal_close_btn);
        this.close_btn = modal_close_btn;

        // --Modalのボディ
        const modal_body = document.createElement("div");
        modal_body.id = `modal_body${this.id}`;
        modal_body.classList.add("modal_body");
        modal_frame.appendChild(modal_body);
        this.body = modal_body;

        // --Modalのフッター
        const modal_foot = document.createElement("div");
        modal_foot.id = `modal_foot${this.id}`;
        modal_foot.classList.add("modal_foot");
        modal_frame.appendChild(modal_foot);
        this.foot = modal_foot;

        // ---Modalのフッターカスタムエリア
        const modal_foot_custom = document.createElement("div");
        modal_foot_custom.id = `modal_foot_custom${this.id}`;
        modal_foot_custom.classList.add("modal_foot_custom");
        modal_foot.appendChild(modal_foot_custom);
        this.foot_custom = modal_foot_custom;
        
        // ---Modalのフッターボタンエリア
        const modal_foot_btns = document.createElement("div");
        modal_foot_btns.id = `modal_foot_btns${this.id}`;
        modal_foot_btns.classList.add("modal_foot_btns");
        modal_foot.appendChild(modal_foot_btns);
        this.foot_btns = modal_foot_btns;

        // --Modalの背景（起動時に背景を暗くするため）
        const modal_background = document.createElement("div");
        modal_background.id = `modal_background${this.id}`;
        modal_background.classList.add("modal_background");
        modal_background.addEventListener("click",function(){
            self.hide();
        })
        modal.appendChild(modal_background);
        this.background = modal_background;

        return modal;
    }

    /**
     * モーダルを隠ぺいする関数
     * @returns {Modal} this
     */
    hide(){
        this.visible = false;
        this.zIndex = 1;
        Modal.zIndex--;
        this.background.style.zIndex = 1;
        this.frame.style.zIndex = 1;
        this.dom.style.zIndex = 1;
        Modal.set_active_modal();
        if(typeof(this.hide_event) === "function"){this.hide_event();}
        this.resolve();
        this.dom.classList.remove("active");
        return this;
    }

    /**
     * モーダルを表示する関数
     * @returns {Modal} this
     */
    show(){
        this.visible = true;
        this.result = null;
        ++Modal.zIndex;
        this.zIndex = Modal.zIndex;
        this.background.style.zIndex = this.zIndex;
        this.frame.style.zIndex = this.zIndex + 1;
        this.dom.style.zIndex = this.zIndex;
        Modal.set_active_modal();
        if(typeof(this.show_event) === "function"){this.show_event();}
        this.dom.classList.add("active");
        return this;
    }


    /**
     * モーダレス化する関数
     * @returns {Modal} this
     */
    pickable(){
        this.moving = false;
        this.c = {x:0,y:0};
        this.p = {x:0,y:0};
        // this.dom.style.opacity = "0";
        this.dom.style.position = "absolute";
        this.dom.style.pointerEvents = "none";
        this.frame.style.position = "absolute";
        this.frame.style.pointerEvents = "auto";
        this.background.style.opacity = "0";
        this.background.style.pointerEvents = "none";

        this.head.addEventListener("mousedown",(e)=>{
            this.moving = true;
            this.c.x = e.clientX;
            this.c.y = e.clientY;
            const clientRect = this.frame.getClientRects()[0];
            this.p.x = clientRect.left;
            this.p.y = clientRect.top;
        });

        this.head.addEventListener("mouseup",(e)=>{
            this.moving = false;
        });

        document.addEventListener("mousemove",(e)=>{
            if(this.moving){
                // console.log(e.clientX,e.clientY);
                this.frame.style.left = `${this.p.x - this.c.x + e.clientX}px`;
                this.frame.style.top = `${this.p.y - this.c.y + e.clientY}px`;
            }
        });

        document.addEventListener("mouseup",(e)=>{
            this.moving = false;
        });

        return this;
    }

    /**
     * 非同期処理でモーダルのボタンを押下するまで待機する関数
     * @param {Function} func コールバック関数 
     * @returns {any} funcの戻り値
     */
    confirm(func){
        return new Promise((resolve)=>{
            this.resolver = resolve;
            this.show();
        }).then(()=>{
            if(typeof(func)==="function" && this.result===true){
                return func();
            }
            return null;
        });
    }

    /**
     * Promiseで非同期処理を行う場合に呼び出す関数
     * Promiseが登録されていない場合は、特に何もしない。
     * 同期、非同期でModalのメソッドを呼び出す可能性がある場合は呼び出しておく。
     */
    resolve(){
        if(typeof(this.resolver)==="function"){
            this.resolver();
            this.resolver = null;
        }
    }

    /**
     * モーダルを表示するためのトリガー（ボタンなど）を登録する関数
     * @param {String} trigger_id DOMのID属性
     * @returns {Modal} this
     */
    set_trigger(trigger_id){
        const self = this;
        const trigger = typeof(trigger_id)==="string" ? document.querySelector(`#${trigger_id}`): trigger_id;
        if (trigger !== null){
            trigger.addEventListener("click",function(){
                self.show();
            })
        }
        return this;
    }

    make_trigger(trigger_id){
        return this.set_trigger(trigger_id);
    }

    /**
     * モーダルを表示するためのトリガー（ボタンなど）を登録する関数
     * @param {*} trigger_class DOMのクラス属性 
     * @returns {Modal} this
     */
    set_triggers(trigger_class){
        const self = this;
        const triggers = typeof(trigger_class)==="" ? document.querySelector(`.${trigger_class}`) : trigger_class;
        if (triggers !== null){
            for(let i=0; i<triggers.length; i++){
                const trigger = triggers[i];
                trigger.addEventListener("click",function(){
                    self.show();
                })
            }
        }
        return this;
    }

    make_triggers(trigger_class){
        return this.set_triggers(trigger_class);
    }

    /**
     * シンボルマークを登録する関数
     * @param {String} url シンボルの画像URL
     * @returns {Modal} this
     */
    set_symbol(url){
        // Modalのシンボルマークを追加
        const modal_symbol = document.createElement("img");
        modal_symbol.id = `modal_symbol${this.id}`;
        modal_symbol.src = url;
        modal_symbol.classList.add("modal_symbol");
        
        const modal_symbol_message = document.createElement("div");
        modal_symbol_message.id = `modal_symbol_message${this.id}`;
        modal_symbol_message.classList.add("modal_symbol_message");

        const frame = document.createElement("div");
        frame.id = `modal_symbol_frame${this.id}`;
        frame.classList.add("modal_symbol_frame");
        frame.appendChild(modal_symbol);
        frame.appendChild(modal_symbol_message);

        this.symbol = frame;
        this.symbol_message = modal_symbol_message;
        if(this.body === null){
            console.warn("モーダルのボディが設定されていません。");
            return this;
        }
        this.body.prepend(frame);

        return this;
    }

    /**
     * モーダルのタイトルのセッター。
     * @param {String} text モーダルのタイトルテキスト
     * @returns {Modal} this
     */
    set_title(text){
        this.title.textContent = text;
        return this;
    }

    /**
     * モーダルのヘッダーのセッター
     * @param {String} html 
     * @returns {Modal} this
     */
    set_head(html=""){
        if(typeof(html)!=="string"){
            this.head.innerHTML = "";
            this.head.appendChild(this.title);
            this.head.appendChild(html);
            this.head.appendChild(this.close_btn);
        }else{
            this.head.innerHTML = this.title.innerHTML + html + this.close_btn.innerHTML;
            this.close_btn = document.querySelector(`modal_close_btn${this.id}`);
            this.close_btn.addEventListener("click",()=>{
                this.hide();
            });

        }
        return this;
    }

    /**
     * モーダルのボディのセッター
     * @param {String} html 
     * @returns {Modal} this
     */
    set_body(html=""){
        if(typeof(html)!=="string"){
            this.body.appendChild(html);
        }else{
            this.body.innerHTML = html;
        }
        return this;
    }

    reset_body(){
        this.body.innerHTML = "";
        return this;
    }

    /**
     * モーダルのボディのセッター
     * @param {String} html 
     * @returns {Modal} this
     */    
    add_body(html=""){
        this.add(this.body,html);
        return this;
    }

    /**
     * モーダルのメッセージのセッター
     * @param {String} html 
     * @returns {Modal} this
     */
    set_message(html=""){
        if(this.symbol_message !== null){
            this.symbol_message.innerHTML = html;
        }
        return this;
    }

    /**
     * モーダルのフッターのセッター
     * @param {String} html 
     * @returns {Modal} this
     */
    set_foot(html=""){
        if(typeof(html)!=="string"){
            this.foot_btns.appendChild(html);
        }else{
            this.foot_btns.innerHTML = html;
        }
        return this;
    }

    set_custom_foot(html=""){
        if(typeof(html)!=="string"){
            this.foot_custom.appendChild(html);
        }else{
            this.foot_custom.innerHTML = html;
        }
        return this;
    }

    /**
     * フッターに肯定ボタンを配置し、イベント登録する関数
     * @param {Function} func ボタン押下時のイベント関数
     * @param {String} name ボタンのラベル名 
     * @returns {Modal} this
     */
    set_yes_button(func,name=Modal.BTN.YES){
        const yes_btn = document.createElement("div");
        yes_btn.id = `modal_yes_button${this.id}`;
        yes_btn.classList.add("modal_yes_btn");
        yes_btn.textContent = name;
        const self = this;
        yes_btn.addEventListener("click",function(){
            if(typeof(func) === "function"){
                self.result = true;
                func();
            }
            self.hide();
        });

        if(this.foot === null){
            console.warn("モーダルのフッターが設定されていません。");
            return this;
        }

        this.foot_btns.appendChild(yes_btn);
        this.yes_btn = yes_btn;
        return this;
    }

    /**
     * フッターに否定ボタンを配置し、イベント登録する関数
     * @param {Function} func ボタン押下時のイベント関数
     * @param {String} name ボタンのラベル名 
     * @returns {Modal} this
     */
    set_no_button(func,name=Modal.BTN.NO){
        const no_btn = document.createElement("div");
        no_btn.id = `modal_no_button${this.id}`;
        no_btn.classList.add("modal_no_btn");
        no_btn.textContent = name;
        const self = this;
        no_btn.addEventListener("click",function(){
            if(typeof(func) === "function"){
                self.result = false;
                func();
            }
            self.hide();
        });

        if(this.foot === null){
            console.warn("モーダルのフッターが設定されていません。");
            return this;
        }

        this.foot_btns.appendChild(no_btn);
        this.no_btn = no_btn;
        return this;
    }

    /**
     * モーダルが表示されるタイミングで実行する関数を登録する関数
     * @param {*} func 表示イベント関数
     * @returns {Modal} this
     */
    set_show_event(func){
        if(typeof(func) === "function"){
            this.show_event = func;
        }
        return this;
    }

    /**
     * モーダルが表示されるタイミングで実行する関数を登録する関数
     * @param {*} func 表示イベント関数
     * @returns {Modal} this
     */
    set_hide_event(func){
        if(typeof(func) === "function"){
            this.hide_event = func;
        }
        return this;
    }


    add(dom,content){
        typeof(content) === "string" ? dom.innerHTML += content : dom.appendChild(content);
    }

    static copy_node(dom){
        let clone_node = dom.cloneNode(true);
        clone_node.style.display = "inline-block";
        return clone_node;
    }

    static set_active_modal(){
        let m = null;
        let zIndex = 1
        for(let modal of Modal.list){
            if( modal.zIndex > zIndex){
                zIndex = modal.zIndex;
                m = modal;
            }
        }
        Modal.active_modal = m;
        return m;
    }

}

/**
 * エラーメッセージ表示用のモーダル
 * 通常のModalと同じように呼び出し可能
 */
class ErrorModal extends Modal{
    static ERROR_TITLE = "エラー"
    static OK = "OK";
    constructor(size=Modal.SIZE.XSMALL){
        super(size);
        this.message_area = null;


        this
        .set_title(ErrorModal.ERROR_TITLE)
        .set_message_area()
        .set_ok_btn()

        this.body.classList.add("error");

    }

    set_message_area(){
        if(this.body !== null){
            const message_area = document.createElement("div");
            message_area.id = `modal_message_area${this.id}`;
            this.message_area = message_area;
            this.add(this.body,this.message_area);
        }
        return this;
    }

    set_ok_btn(name=ErrorModal.OK){
        if(this.message_area!== null){
            const ok = document.createElement("div");
            const self = this;
            ok.id = `modal_ok_btn${this.id}`;
            ok.classList.add("modal_ok_btn");
            ok.textContent = name;
            ok.addEventListener("click",function(){
                self.hide();
            })
            this.add(this.body,ok);
        }
        return this;
    }

    show(message=""){
        if (this.message_area !== null){
            this.message_area.innerHTML = `<p>${message}</p>`;
        }
        return super.show();
    }
}

class AlertModal extends ErrorModal{
    constructor(size=Modal.SIZE.XSMALL){
        super(size);
        this.set_title("通知");
    }
}


/**
 * 確認画面表示用のモーダル
 * 通常のModalと同じように呼び出し可能
 */
class ConfirmModal extends Modal{
    static CONFIRM = "確認";
    static OK = "OK";
    static CANCEL ="キャンセル"
    constructor(size=Modal.SIZE.XSMALL){
        super(size);
        this.message_area = null;
        this.btn_area = null;
        this.ok_btn = null;
        this.event = null;
        this.cancel_event = null;


        this
        .set_title(ConfirmModal.CONFIRM)
        .set_message_area()
        .set_btn_area()
        .set_ok_btn()
        .set_cancel_btn()

        this.body.classList.add("confirm");

        this.result = false;

    }

    set_message_area(){
        if(this.body !== null){
            const message_area = document.createElement("div");
            message_area.id = `modal_message_area${this.id}`;
            message_area.classList.add("modal_message_area");
            this.message_area = message_area;
            this.add(this.body,this.message_area);
        }
        return this;
    }

    set_btn_area(){
        if(this.body !== null){
            const btn_area = document.createElement("div");
            btn_area.id = `modal_btn_area${this.id}`;
            btn_area.classList.add("modal_btn_area");
            this.btn_area = btn_area;
            this.add(this.body,this.btn_area);
        }
        return this;
    }

    set_ok_btn(name=ConfirmModal.OK){
        if(this.message_area!== null){
            const ok = document.createElement("div");
            const self = this;
            ok.id = `modal_ok_btn${this.id}`;
            ok.classList.add("modal_ok_btn");
            ok.textContent = name;
            ok.addEventListener("click",function(){
                self.result = true;
                if(typeof(self.event) === "function"){
                    self.event(self.result);
                }
                self.hide();
            })
            this.add(this.btn_area,ok);
            this.ok_btn = ok;
        }
        return this;
    }

    set_cancel_btn(name=ConfirmModal.CANCEL){
        if(this.message_area!== null){
            const cancel = document.createElement("div");
            const self = this;
            cancel.id = `modal_cancel_btn${this.id}`;
            cancel.classList.add("modal_cancel_btn");
            cancel.textContent = name;
            cancel.addEventListener("click",function(){
                self.result = false;
                if(typeof(self.event) === "function"){
                    self.event(self.result);
                }
                self.hide();
            })
            this.add(this.btn_area,cancel);
            this.cancel_btn = cancel;
        }
        return this;
    }

    show(message=""){
        if (this.message_area !== null && message !== ""){
            this.message_area.innerHTML = `<p>${message}</p>`;
        }
        return super.show();
    }

    set_message(message=""){
        if (this.message_area !== null && message !== ""){
            this.message_area.innerHTML = `<p>${message}</p>`;
        }
        return this;
    }

    set_event(func=function(result){console.log(result)}){
        if(typeof(func) !== "function"){return this;}
        this.event = func;
        return this;
    }
}


class Modaless extends Modal{
    constructor(size=Modal.SIZE.MIDDLE){
        super(size);
        this.pickable();
    }
}

/**
 * エラー表示表のモーダル
 */
let emdl = new ErrorModal();
emdl.set_hide_event(function(){
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.delete("error");
    url.search = params.toString();
    window.history.pushState([],"",url);
    return url;
})

/**
 * 通知表示表のモーダル
 */
let amdl = new AlertModal();
window.addEventListener("DOMContentLoaded",function(){
    const key = "error";
    let e = "";
    // URLにパラメータの指定があれば取得する
    let params = new URLSearchParams(window.location.search);
    try{
        e =  JSON.parse(params.get(key));
    }catch{
        e =  params.get(key);
    }
    if (e !== null && e !== "" ){
        emdl.show(e)
    }
});
