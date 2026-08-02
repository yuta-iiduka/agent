console.log("util.js is called.");
// NOTE:Factory,Injectorクラスの定義、メソッドの動的生成、メソッドの介入についての検討
class Platform{

    static isMobile(){
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|windows phone|mobile/i.test(userAgent);
        return isMobile;
    }

    static isPC(){
        return !this.isMobile();
    }
}
class Style{
    constructor(css=""){
        this.head = document.querySelector("head");
        this.css = css;
        this.dom = document.createElement("style");
        this.build();
        this.head.appendChild(this.dom);
    }

    build(){
        this.dom.innerHTML = this.css;
        return this;
    }

    update(){
        this.dom.innerHTML = this.css;
    }
}

// class Factory{

//     constructor(class_prefix="xxx"){
//         this.class = [];
//         this.messages = [];
//     }

//     register(cls){
//         if(this.analize(cls)){
//             this.class.push(cls);
//         }else{
//             console.error(this.messages);
//         }
//         return this;
//     }

//     unregister(cls){
//         this.class = this.class.filter((c)=>cls.name!==c.name);
//         return this;
//     }

//     analize(cls){
//         this.messages = [];
//         let result = true;
//         // インスタンスの解析

//         // const protoChain = [];
//         // let p = cls.prototype;
//         // while ( p && p !== Object.prototype){
//         //     protoChain.push(p);
//         //     p = Object.getPrototypeOf(p);
//         // }

//         // const instanceMethods = new Set();
//         // const instanceAccessors = new Set();
//         // const instanceSymbols = new Set();

//         // for (let proto of protoChain){

//         // }

//         return result;
//     }

// }

class Spiner{

    static default = "|";
    static style = new Style(`
        .spiner{
            position:fixed;
            top:0;
            left:0;
            display:flex;
            justify-content:center;
            align-items:center;
            height:100%;
            width:100%;
            // pointer-events:none;
            opacity:0.7;
            background-color:black;
            z-index:9999;
            visibility:hidden;
        }

        .spiner.active{
            visibility:visible;
        }
        .spiner-frame{
            display:flex;
            flex-direction:row;
            align-items:center;
            justify-content:center;
            height:36px;
            width:100%;
            font-size:24px;
            pointer-events:none;
        }
        .spiner-img{
            margin-left:36px;
            height:36px;
            width:36px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin{
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

    `).build();
    
    constructor(selector="body",message="読み込み中...",src=""){
        this.message = message;
        this.src = src;
        this.parent = document.querySelector(selector);
        this.frame = document.createElement("div");
        this.frame.classList.add("spiner");
        this.dom = document.createElement("div");
        this.dom.classList.add("spiner-frame");
        this.message_frame = document.createTextNode(message);
        if(this.src == ""){
            this.img = document.createElement("div");
            this.img.textContent = Spiner.default;
        }else{
            this.img = document.createElement("img");
        }
        this.img.classList.add("spiner-img");
        this.img.src = src;

        this.dom.appendChild(this.message_frame);
        this.dom.appendChild(this.img);
        this.frame.appendChild(this.dom)
        this.parent.prepend(this.frame);

        window.addEventListener("resize",()=>{
            this.resize();
        });

    }

    resize(){
        this.fit();
    }

    fit(){
        const [rect] = this.parent.getClientRects();
        this.frame.style.height = `${rect.height}px`;
        this.frame.style.width  = `${rect.width}px`;
        this.frame.style.top    = `${rect.top}px`;
        this.frame.style.left   = `${rect.left}px`;
    }

    show(){
        this.fit();
        this.frame.classList.add("active");
    }

    hide(){
        this.frame.classList.remove("active");
    }

    event(func){
        return new Promise((resolve)=>{
            this.show();
            setTimeout(()=>{
                if(typeof(func)=="function"){
                    func();
                }
                resolve();
            },100);
        }).then(()=>{
            this.hide();
        })
    }

    timer(s=3){
        this.show();
        setTimeout(()=>{
            this.hide();
        },s*1000);
    }

}

class Parser{
    /* デフォルトのパース文字列を定義しておく */
    static startKeys = ["[:","]"]; //開始タグ[始点,終点] [:tagname]
    static endKeys   = ["[/","]"]; //終了タグ[始点,終点] [/tagname]
    static enable_languatge_format = "[a-zA-Z0-9_]+";
    static natural_language = {
        root :{tag:"main"  ,attr:{class:"class",id:"id"} },
        bold :{tag:"b"     ,attr:{title:"title",class:"class",id:"id"}},
        info :{tag:"div"   ,attr:{title:"title",class:"class",id:"id"}},
        link :{tag:"a"     ,attr:{url:"href",title:"title",class:"class",id:"id"}},
        font :{tag:"span"  ,attr:{color:"color",size:"size",class:"class",id:"id"}},
        mark :{tag:"span"  ,attr:{color:"color",size:"size",class:"class",id:"id"}},
        imag :{tag:"img"   ,attr:{src:"src",title:"title",size:"size",class:"class",id:"id"}},
        text :{tag:"div"   ,attr:{editable:"contenteditable",class:"class",id:"id"}},
        prev :{tag:"pre"   ,attr:{editable:"contenteditable",class:"class",id:"id"}},
        inpt :{tag:"input" ,attr:{type:"type",placeholder:"placeholder",value:"value",min:"min",max:"max",class:"class",id:"id"}},
        form :{tag:"form"  ,attr:{action:"action",method:"method",class:"class",id:"id"}},
        titl :{tag:"h1"    ,attr:{title:"title",class:"class",id:"id"}},
        head :{tag:"h2"    ,attr:{title:"title",class:"class",id:"id"}},
        canv :{tag:"canvas",attr:{width:"width",height:"height",class:"class",id:"id"}},
        br   :{tag:"br"    ,attr:{class:"class",id:"id"}},
        hr   :{tag:"hr"    ,attr:{class:"class",id:"id"}},
        grid :{tag:"div"   ,attr:{class:"class",id:"id"}},
        cell :{tag:"div"   ,attr:{class:"class",id:"id"}},
    };

    /**
     * 特殊文字と改行コードまでの間を対象とする
     */
    static get special_language(){
        return {
            // "\n"  :`${this.startKeys[0]}br${this.startKeys[1]}${this.endKeys[0]}br${this.endKeys[1]}`,
            "----":[`${this.startKeys[0]}hr${this.startKeys[1]}`,`${this.endKeys[0]}hr${this.endKeys[1]}`],
            "## " :[`${this.startKeys[0]}head${this.startKeys[1]}`,`${this.endKeys[0]}head${this.endKeys[1]}`],
            "# "  :[`${this.startKeys[0]}titl${this.startKeys[1]}`,`${this.endKeys[0]}titl${this.endKeys[1]}`],
        }
    }

    /**
     * 単純置換により実装するマークダウンの情報
     */
    static get markdown(){
        return [
            {type:"symbol",target:":|",marks:`${this.endKeys[0]}grid${this.endKeys[1]}`},
            {type:"symbol",target:"|:",marks:`${this.startKeys[0]}grid${this.startKeys[1]}`},
            {type:"nest",target:["\\|","\\|"],marks:[`${this.startKeys[0]}cell${this.startKeys[1]}`,`${this.endKeys[0]}cell${this.endKeys[1]}`],},
            {type:"symbol",target:"sample",marks:"SAMPLE",},
        ];
    }

    static style = null;
    static CONST = {
        COLOR:["black","white","red","blue","yellow","green","pink","brown","purple","orange"],
        SIZE:{xsmall:"8px",small:"16px",normal:"24px",large:"32px",xlarge:"40px",full:"100%",quater:"25%",half:"50%",three_quater:"75%"},
    };

    /** static initializer:2015年以前のブラウザでは利用不可 */
    static{
        this.init();
    }

    static init(){
        // CSSを定義
        let css_txt = "";
        const color_pallet = this.CONST.COLOR;
        for(let c of color_pallet){
            css_txt += `
                .markup-font[color=${c}]{
                    color:${c};
                }
                .markup-mark[color=${c}]{
                    background-color:${c};
                }
            `;
        }
        const size_scale = this.CONST.SIZE;
        for(let s of Object.keys(size_scale)){
            css_txt += `
                .markup-font[size=${s}]{
                    font-size:${size_scale[s]};
                }
                .markup-imag[size=${s}]{
                    width :${size_scale[s]};
                    height:${size_scale[s]};
                }
            `;
        }

        css_txt += `
            .markup-grid{
                width: 100%;
                display:flex;
                flex-direction:row;
                justify-content:center;
                aligin-items:start;
            }

            .markup-cell{
                margin:  2px;
                padding: 2px;
                border: 1px solid grey;
            }
        `;


        this.style = new Style(css_txt).build();


        // TODO:自分自身のDOMに関してのみ範囲を絞りたいが
        // フォーカスイベント
        document.addEventListener("focusin",(e)=>{
            const elm = e.target.closest("[data-tag]");
            if(!elm){return;}
            console.log(elm.dataset.tag,elm.dataset.tagindex,elm.dataset.markup);
        });
        document.addEventListener("click",(e)=>{
            const elm = e.target.closest("[data-tag]");
            if(!elm){return;}
            console.log(elm.dataset.tag,elm.dataset.tagindex,elm.dataset.markup);
        });
    }

    constructor(){
        this.startKeys = Parser.startKeys;
        this.endKeys   = Parser.endKeys;
        this.enable_languatge_format = Parser.enable_languatge_format;
        this.natural_language = Parser.natural_language;
        this.special_language = Parser.special_language;
        this.markdown = Parser.markdown;
        this.errors = [];
        this.root = null;
        this.stack = null;
        this.parts = [];
        this.tree  = [];
        this.list  = [];
        this.tagid = 0;
    }

    check(){
        return true;
    }

    parse(parts=[]){
        this.parts = [];
        this.root = document.createDocumentFragment();
        this.stack = [this.root];
        if(this.check() === false){
            console.error(this.errors);
            return
        }
        this.tagNames = Object.keys(this.natural_language);
        this.openTagReg  = this.tag_StartRegex(this.startKeys[0],this.startKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);
        this.closeTagReg = this.tag_EndRegex(this.endKeys[0],this.endKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);
        this.openSpecialTagReg
        this.closeSpecialTagReg

        for(let token of parts){
            let open_token  = token.match(this.openTagReg);
            let close_token = token.match(this.closeTagReg);
            if(open_token){
                // タグの属性情報を付与する
                const {tag, attrs} = this.parse_attributes(token);
                console.log(tag,attrs);
                const elm = document.createElement(this.natural_language[tag]?.tag || "span");
                for(const [k,v] of Object.entries(attrs)){
                    if(this.natural_language[tag]?.attr && this.natural_language[tag].attr[k]){
                        elm.setAttribute(this.natural_language[tag].attr[k],v);
                    }else{
                        elm.setAttribute(k,v);
                    }
                }
                elm.classList.add(`markup-${tag}`);
                elm.dataset.tag = tag;
                elm.dataset.tagindex = this.tagid++;
                elm.dataset.markup = token;
                this.stack[this.stack.length - 1].appendChild(elm);
                this.stack.push(elm);
            }else if (close_token){
                const tag = close_token[1];
                while(this.stack.length > 1){
                    const top = this.stack.pop();
                    const htmlTag = this.natural_language[tag]?.tag || "span";
                    console.log(tag,top.tagName.toLowerCase(),htmlTag);
                    if(top.tagName.toLowerCase() === htmlTag){
                        break;
                    }
                }
                continue;
            }else{
                this.stack[this.stack.length - 1].appendChild(document.createTextNode(token));
            }
        }
        return this.root;
    }

    parse_attributes(part="[:a]"){
        const inside = part.slice(this.startKeys[0].length,-1 * this.startKeys[1].length).trim(); //"[...]を除外"
        const info = inside.match(/^\w+/); // 空白分割
        const tag = info[0];               // タグ名
        const attrs = {};
        let match;
        const attrRe = /(\w+)=("(?:[^"]*)"|'(?:[^']*)'|\S+)/g;
        while((match = attrRe.exec(inside)) !== null){
            let [, name, value] = match;
            if((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))){
                value = value.slice(1,-1);
            }
            attrs[name] = value;
        }
        return {tag, attrs};
    }

    tag_StartRegex(start,end,tagNamePattern){
        let str = `^\\${start}(?:(${tagNamePattern})(?:\\s+\\w+=(\".*?\"|'.*?'|\\S+(?:\\s+\\S+)*))*)\\${end}$`;
        return new RegExp(str);
    }

    tag_EndRegex(start,end,tagNamePattern){
        let str = `^\\${start}(${tagNamePattern})\\${end}$`;
        return new RegExp(str);
    }

    parse_tree(parts=[]){
        // console.log(parts);
        let root_tree = {name:"root",type:"root",attr:{},value:"",data:{tag:"root",tagindex:this.tagid++,markup:"",parentindex:-1},children:[]};
        let target_tree = root_tree;
        let target_list = [];
        
        this.tagNames = Object.keys(this.natural_language);
        this.specialLanguages = Object.keys(this.special_language);

        this.openTagReg  = this.tag_StartRegex(this.startKeys[0],this.startKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);
        this.closeTagReg = this.tag_EndRegex(this.endKeys[0],this.endKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);


        for(let token of parts){
            let open_token  = token.match(this.openTagReg);
            let close_token = token.match(this.closeTagReg);
            if(open_token){
                // タグの属性情報を付与する
                const {tag, attrs} = this.parse_attributes(token);
                // console.log(tag,attrs);
                const info = {tag:tag,name:this.natural_language[tag]?.tag || "span",type:"nest",value:"",attr:{},data:{},children:[]};
                for(const [k,v] of Object.entries(attrs)){
                    if(this.natural_language[tag]?.attr && this.natural_language[tag].attr[k]){
                        info.attr[this.natural_language[tag].attr[k]] = v;
                    }else{
                        info.attr[k] = v;
                    }
                }

                info.data.tag = tag;
                info.data.tagindex = this.tagid++;
                info.data.markup = token;
                // console.log("target",target_tree,"info",info);
                info.data.parentindex = target_tree.data.tagindex;
                target_tree.children.push(info);
                target_list.push(info);
                // この追加トークンを次のターゲットとする
                target_tree = info;

            }else if(close_token){
                // このトークンの親をターゲットに戻す。
                // console.log(target_tree);
                target_tree = target_list.find((n)=>n.data.tagindex==target_tree.data.parentindex);
                if(!target_tree){
                    // 見つからなかったらrootにする
                    target_tree = root_tree;
                }
            }else{
                // 現在のトークンの子要素として追加。
                // console.log(target_tree);
                const textnode = {tag:"span",name:"text",type:"text",attr:{value:token},value:token,data:{tag:"text",tagindex:this.tagid++,markup:token,parentindex:target_tree.data.tagindex},children:[]};
                target_tree.children.push(textnode);
                target_list.push(textnode);
            }
        }

        this.tree = root_tree;
        this.list = target_list;
        return this.tree;
    }

    parse_document(tree={},is_root=true){
        if(is_root){
            this.parts = [];
            this.root = document.createElement("div");
            this.root.dataset.parentindex = -1;
            this.target = this.root;
            this.target_list = [this.root];
        }
        if(this.check() === false){
            console.error(this.errors);
            return
        }
        this.tagNames = Object.keys(this.natural_language);
        this.openTagReg  = this.tag_StartRegex(this.startKeys[0],this.startKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);
        this.closeTagReg = this.tag_EndRegex(this.endKeys[0],this.endKeys[1],this.tagNames.join("|") ?? this.enable_languatge_format);

        for(let token of tree.children){
            // console.log(token);
            const tmp_parent = this.target_list.find((p)=>p.dataset.tagindex == token.data.parentindex) || this.root;
            if(token.type=="text"){
                const elm = document.createElement("span");
                elm.textContent = token.data.markup;
                elm.classList.add(`markup-text`);
                elm.dataset.tag = "text";
                elm.dataset.tagindex = token.data.tagindex;
                elm.dataset.markup = token.data.markup;
                elm.dataset.parentindex = token.data.parentindex;
                this.target.appendChild(elm);
                this.target_list.push(elm);
            }else{
                // タグの属性情報を付与する
                const tag = token.tag;
                const attrs = token.attr;
                // console.log("tag",tag,"attrs",attrs);
                const elm = document.createElement(this.natural_language[tag]?.tag || "span");
                for(const [k,v] of Object.entries(attrs)){
                    if(this.natural_language[tag]?.attr && this.natural_language[tag].attr[k]){
                        elm.setAttribute(this.natural_language[tag].attr[k],v);
                    }else{
                        elm.setAttribute(k,v);
                    }
                }
                elm.classList.add(`markup-${tag}`);
                elm.dataset.tag = tag;
                elm.dataset.tagindex = token.data.tagindex;
                elm.dataset.markup   = token.data.markup;
                elm.dataset.parentindex = token.data.parentindex; 
                this.target.appendChild(elm);
                this.target = elm;
                this.target_list.push(elm);
            }
            this.parse_document(token,false);
            this.target = tmp_parent;
        }
        return this.root;
    }

}

class Token{
    static parser = new Parser();
    static startKeys = this.parser.startKeys; //開始タグ[始点,終点] [:tagname]
    static endKeys   = this.parser.endKeys;   //終了タグ[始点,終点] [/tagname]
    static natural_language = this.parser.natural_language;
    static special_language = this.parser.special_language;
    static markdown = this.parser.markdown;
    static ERROR = {
        SAME_TAGNAME:"token生成には区切り文字が異なる必要があります。",
        UNDEFINED_START_TAG:"開始タグの始点と終点が定義されていません。",
        UNDEFINED_END_TAG:"終了タグの始点と終点が定義されていません。",
        NOT_FOUND_START_TAGNAME:"開始タグ名が見つかりません。",
        NOT_FOUND_END_TAGNAME:"終了タグ名が見つかりません。",
        NOT_SAME_TAG:"開始タグと終了タグが一致しません。",
    };

    constructor(src="",fast_analize=true){
        this.src = src;
        this.target = src;
        this.parser = Token.parser;
        this.parts  = [];
        this.tree   = [];
        this.htmls  = [];
        this.object = null;
        this.startKeys = [...Token.startKeys];
        this.endKeys   = [...Token.endKeys];
        this.natural_language = Token.natural_language;
        this.special_language = Token.special_language;
        this.markdown = Token.markdown;
        this.info = [];
        this.errors = [];
        if(fast_analize){this.analize();}
    }

    analize(){
        // 前処理チェック
        if(this.before_check()){
            // トークン文字列情報を配列に変換
            let list = [];
            // 単純マークダウンの置換
            for(let m of this.markdown){
                let s = m.target;
                console.log(s);
                if(m.type == "nest"){
                    const reg = new RegExp(`${s[0]}([^${s[1]}]*)${s[1]}`,"g");
                    // this.target = this.target.replace(reg,`${m.marks[0]}$1${m.marks[1]}`);
                    this.target = this.target.replace(reg,(x,inner)=>`${m.marks[0]}${inner}${m.marks[1]}`);
                    console.log(this.target);
                }else{
                    this.target = this.target.replace(s,m.marks);
                }
            }

            // 特殊文字の変換
            for(let s of Object.keys(this.special_language)){
                const reg = new RegExp(`${s}([^\\r\\n]*)(?:\\r\\n|\\r|\\n)`,"g");
                this.target = this.target.replace(reg,`${this.special_language[s][0]}$1${this.special_language[s][1]}\n`);
            }
            let tmp1 = this.target.split(this.startKeys[0]);
            tmp1 = tmp1.map((t)=>t==="" ? t : `${this.startKeys[0]}${t}`);
            tmp1[0] = tmp1[0].replace(this.startKeys[0],"");
            for(let t1 of tmp1){
                let tmp2 = t1.split(this.endKeys[0]);
                tmp2 = tmp2.map((t)=>t.startsWith(this.startKeys[0]) ? t : `${this.endKeys[0]}${t}`);
                for(let t2 of tmp2){
                    list.push(t2);
                }
            }
            list[0] = list[0].replace(this.endKeys[0],"");

            let tmp3 = [];
            for(let t3 of list.filter((t)=>t!=="")){
                t3 = t3.split(this.startKeys[1]);
                t3[0] = t3.length>1 ? `${t3[0]}${this.startKeys[1]}` : t3[0];
                // console.log(t3);
                tmp3.push(t3);
            }

            let tmp4 = [];
            for(let t4 of tmp3.flat().filter((t)=>t!=="")){
                t4 = t4.split(this.endKeys[1]);
                t4[0] = t4.length>1 ? `${t4[0]}${this.endKeys[1]}` : t4[0];
                // console.log(t4);
                tmp4.push(t4);
            }

            for(let t5 of tmp4.flat().filter((t)=>t!=="")){
                this.parts.push(t5);
            }

            // 後処理チェック
            this.after_check();
        }
        return this;
    }

    before_check(){
        let result = true;
        if(this.startKeys[0] === this.endKeys[0]){
            console.error(Token.ERROR.SAME_TAGNAME);
            this.errors.push(Token.ERROR.SAME_TAGNAME);
            result = false;
        }
        if(this.startKeys.length != 2){
            console.error(Token.ERROR.UNDEFINED_START_TAG);
            this.errors.push(Token.ERROR.UNDEFINED_START_TAG);
            result = false;
        }
        if(this.endKeys.length != 2){
            console.error(Token.ERROR.UNDEFINED_END_TAG);
            this.errors.push(Token.ERROR.UNDEFINED_END_TAG);
            result = false;
        }
        return result;
    }

    after_check(){
        let result = true;
        // 開始タグ、終了タグの数が一致しているか
        return result;
    }

    parse(){
        this.object = this.parser.parse(this.parts);
        return this.object;
    }

    parse_tree(){
        this.tree = this.parser.parse_tree(this.parts);
        return this.tree;
    }

    /**
     * parse_treeでtreeを生成してから実行されるべき関数
    */
    parse_document(){
        console.log(this.tree);
        this.object = this.parser.parse_document(this.tree);
        return this.object;
    }
}

class Tokenizer{
    constructor(){
        this.class = Token;
        this.result = [];
        this.history = [];
        this._cursor = 0;
    }

    build(src){
        this.src = src;
        let result = new this.class(src);
        this._cursor = this.history.length;
        this.history.push(result);
        this.result = result;
        return result;
    }

    reset(){
        this.result = [];
    }
    
    back(){
        if(this._cursor < 0){this._cursor = 0}
        this.result = this.history[--this._cursor] ?? [];
    }

    next(){
        if(this._cursor >= this.history.length){this._cursor = this.history.length - 1}
        this.result = this.history[++this._cursor] ?? [];
    }

    parse(token=[]){
        return this.result.parse(token);
    }

    parse_tree(token=[]){
        return this.result.parse_tree(token);
    }

    parse_document(tree=[]){
        return this.result.parse_document(tree);
    }
}

class MarkUp{
    static tokenizer = new Tokenizer();

    static tokenize(src=""){
        let result = null;
        if(typeof(MarkUp.tokenizer.build)==="function"){
            result = MarkUp.tokenizer.build(src);
        }
        return result;
    }

    static parse(token=[]){
        let result = null;
        if(typeof(MarkUp.tokenizer.parse)==="function"){
            result = MarkUp.tokenizer.parse(token);
        }
        return result;
    }

    static parse_tree(token=[]){
        let result = null;
        if(typeof(MarkUp.tokenizer.parse_tree)==="function"){
            result = MarkUp.tokenizer.parse_tree(token);
        }
        return result;
    }

    static parse_document(tree=[]){
        let result = null;
        if(typeof(MarkUp.tokenizer.parse_document)==="function"){
            result = MarkUp.tokenizer.parse_document(tree);
        }
        return result;
    }

    constructor(src=""){
        this.src = src;
        this.token  = this.tokenize();
        this.tree   = this.parse_tree();
        this.result = this.parse_document(); // this.parse();
        this.frame  = this.build();
    }

    tokenize(){
        let result = MarkUp.tokenize(this.src);
        return result;
    }

    parse(){
        let result = MarkUp.parse(this.token);
        return result;
    }

    parse_tree(){
        let result = MarkUp.parse_tree(this.token);
        return result;
    }

    parse_document(){
        let result =MarkUp.parse_document(this.tree);
        return result;
    }

    build(){
        const frame = document.createElement("div");
        frame.style.overflow = "auto";
        frame.style.width  = "100%";
        frame.style.height = "100%";
        frame.appendChild(this.result ?? document.createTextNode(this.src));
        return frame;
    }

    update(src=null){
        if(src || src===""){this.src = src}
        this.token  = this.tokenize();
        this.tree   = this.parse_tree();
        this.result = this.parse_document(); //this.parse();
        this.frame  = this.build();
    }

    view(selector){
        if(selector){document.querySelector(selector).appendChild(this.result);}
        return this.result;
    }

    down(selector){
        if(selector){document.querySelector(selector).appendChild(this.src);}
        return this.src
    }
}

class DOM{
    static counter = {};
    static dict = {};
    static cnt = 0;
    static focus = null;
    static style = null;
    static CONST ={
        MIN_ZINDEX:1,
        MAX_ZINDEX:2,
    }
    static width = window.innerWidth;
    static height = window.innerHeight;
    static id = 0;
    static is_pc = Platform.isPC();
    static is_mobile = Platform.isMobile();

    static get windowRatio(){
        return {
            w: window.innerWidth / this.width ,
            h:  window.innerHeight / this.height,
        }
    }

    static{
        window.addEventListener("resize",function(e){
            const objects_dict = Object.values(DOM.dict);
            for(let objects of objects_dict){
                const objects_list = Object.values(objects);
                for(let o of objects_list){
                    o.resize();
                }
            }
        });
        // TODO:zIndexの管理はどうするか？
        document.addEventListener("mousedown",(e)=>{
            for(let k of Object.keys(DOM.dict)){
                for(let o of Object.values(DOM.dict[k])){
                    o.frame.style.zIndex = o.zIndex?.min || DOM.CONST.MIN_ZINDEX;
                    o.z = o.zIndex?.min || DOM.CONST.MIN_ZINDEX;
                }
            }
            
            for(let k of Object.keys(DOM.dict)){
                for(let o of Object.values(DOM.dict[k])){
                    if(o === DOM.focus){
                        o.frame.style.zIndex = o.zIndex?.max || DOM.CONST.MAX_ZINDEX;
                        o.z = o.zIndex?.max || DOM.CONST.MAX_ZINDEX;
                        return;
                    }
                }
            }  
        });
    }

    static get list(){
        return Object.values(DOM.dict[this.name.toLowerCase()] || {}) || [];
    }

    /**
     * DOM作成関数
     * @param {*} elm_name 
     * @param {*} option {class:class,id:id}
     * @returns 
     */
    static create(elm_name="div",option={}){
        const elm = document.createElement(elm_name);
        if(option.class){
            if(option.class.includes(" ")){
                for(let c of option.class.split(" ")){
                    elm.classList.add(c);
                }
            }else{
                elm.classList.add(option.class);
            }
        }
        if(option.id){
            elm.id = option.id;
        }
        return elm;
    }

    /**
     * 複数のNodeを追加する関数
     * @param {*} elm 
     * @param {*} childs 
     * @returns 
     */
    static append(elm,childs=[]){
        for(let c of childs){
            elm.appendChild(c);
        }
        return elm
    }

    constructor(selector="body"){
        if (typeof(selector) === "string" ){
            this.parent = document.querySelector(selector);
        }else{
            this.parent = selector;
        }
        this.frame = null;
        this.contents = null;
        this.is_moving = false;
        this.is_sizing = false;
        this.movableX = false;
        this.movableY = false;
        this.sizableX = false;
        this.sizableY = false;
        this.id = DOM.cnt++;
        this.zIndex = {min:1,max:2};
    }

    get p(){
        let rect = {x:0,y:0,z:0,w:0,h:0};
        if(this.frame){
            // const [rec] = this.frame.getClientRects();
            const rec = getComputedStyle(this.frame);
            let z = this.frame.style.zIndex ?? 0;
            if(z==""){z=0}
            rect = {
                x:isNaN(parseFloat(rec.left)) ? rec.left : parseFloat(rec.left),
                y:isNaN(parseFloat(rec.top)) ? rec.top : parseFloat(rec.top),
                z:parseFloat(z),
                w:parseFloat(rec.width),
                h:parseFloat(rec.height),
            }
        }
        return rect;
    }

    list(){
        return DOM.dict[this.type()] ?? [];
    }

    type(){
        return this.constructor.name.toLowerCase();
    }

    /** 採番対象(監視対象)である場合は呼び出す */
    append(){
        return this.index();
    }

    /** 採番対象である場合は呼び出す */
    index(){
        let id = 0;
        const t = this.type();
        if(DOM.dict[t]){
            id = DOM.counter[t];
            DOM.dict[t][id] = this;
            DOM.counter[t]++;
        }else{
            DOM.dict[t] = {};
            DOM.dict[t][0] = this;
            DOM.counter[t] = 0;
            DOM.counter[t]++;
        }
        return id;Z
    }

    remove(){
        const d = DOM.dict[this.type()];
        const keys = Object.keys(d);
        for(let k of keys){
            const target = d[k];
            if(target.id == this.id){
                delete d[k];
                break;
            }
        }
        DOM.counter[this.type()]--;

        if(this.frame.remove){this.frame.remove();}
    }

    resize(){
        return;
    }

    /**
     * オーバーライド用
     * @returns HTMLElement
     */
    make(){
        const elm = document.createElement("div");
        return elm;
    }

    /**
     * 実際にDOMを画面に追加する関数
     * @returns 
     */
    build(){
        this.frame = DOM.create("div",{class:`frame-${this.type()}`});
        this.contents = this.make();
        this.frame.appendChild(this.contents);
        this.parent.appendChild(this.frame);
        this.b = {...this.p};
        return this.frame;
    }

    get cssClassFrame(){
        return `frame-${this.type()}`;
    }

    get cssPosition(){
        return this.frame.style.position;
    }

    set cssPosition(position){
        this.frame.style.position = position;
    }

    movable(callback=(e)=>{console.log(e.offsetX,e.offsetY)}){
        this.parent.style.position = "relative";
        this.frame.style.position = "absolute";
        this.bp = {x:0,y:0}; //base point
        this.rp = {x:0,y:0}; //rect point
        this.frame.addEventListener("mousedown",(e)=>{
            DOM.focus = this;
            this.bp.x = e.clientX;
            this.bp.y = e.clientY;
            // const [rect] = this.frame.getClientRects();
            const rect = getComputedStyle(this.frame);
            this.rp = {x:parseFloat(rect.left),y:parseFloat(rect.top)};
            this.is_moving = true; 
        });

        document.addEventListener("mousemove",(e)=>{
            if(this.is_moving){
                e.preventDefault();
                const moveX = e.clientX - this.bp.x;
                const moveY = e.clientY - this.bp.y;
                if(this.movableX){this.frame.style.left = `${this.rp.x + moveX}px`;}
                if(this.movableY){this.frame.style.top  = `${this.rp.y + moveY}px`;}
                this.save();
            }
        });

        document.addEventListener("mouseup",(e)=>{
            // DOM.focus = null;
            this.is_moving = false;
            // callback;
            callback(e);
        });

        return this;
    }

    sizable(callback=(e)=>{console.log(e.offsetX,e.offsetY)}){
        this.parent.style.position = "relative";
        this.frame.classList.add("resizable");
        this.frame.style.position = "absolute";
        // make resizer
        const resizer_top_left = DOM.create("div",{class:"resizer top-left"});
        resizer_top_left.dataset.dir = "top-left";
        const resizer_top_right = DOM.create("div",{class:"resizer top-right"});
        resizer_top_right.dataset.dir = "top-right";
        const resizer_bottom_left = DOM.create("div",{class:"resizer bottom-left"});
        resizer_bottom_left.dataset.dir = "bottom-left";
        const resizer_bottom_right = DOM.create("div",{class:"resizer bottom-right"});
        resizer_bottom_right.dataset.dir = "bottom-right";
        const resizer_top = DOM.create("div",{class:"resizer top"});
        resizer_top.dataset.dir = "top";
        const resizer_right = DOM.create("div",{class:"resizer right"});
        resizer_right.dataset.dir = "right";
        const resizer_bottom = DOM.create("div",{class:"resizer bottom"});
        resizer_bottom.dataset.dir = "bottom";
        const resizer_left = DOM.create("div",{class:"resizer left"});
        resizer_left.dataset.dir = "left";

        const mousedown_handler = (e)=>{
            DOM.focus = this;
            this.is_sizing = true;
            this.is_moving = false;
            // this.frame.style.zIndex = this.zIndex.max;
            e.preventDefault();
            const dir = e.target.dataset.dir;
            const org = {
                width  : parseFloat(getComputedStyle(this.frame).width),
                height : parseFloat(getComputedStyle(this.frame).height),
                x : this.frame.offsetLeft,
                y : this.frame.offsetTop,
                mouseX : e.clientX,
                mouseY : e.clientY,
            };

            const mousemove_handler = (e)=>{
                this.is_moving = false;
                if(this.is_sizing){
                    e.stopPropagation();
                    const dx = e.clientX - org.mouseX;
                    const dy = e.clientY - org.mouseY;
                    switch(dir){
                        case "right":
                            if(this.sizableX === false){break}
                            this.frame.style.width = `${org.width + dx}px`;
                            break;
                        case "left":
                            if(this.sizableX === false){break}
                            this.frame.style.width  = `${org.width - dx}px`;
                            this.frame.style.left   = `${org.x + dx}px`;
                            break;
                        case "bottom":
                            if(this.sizableY === false){break}
                            this.frame.style.height = `${org.height + dy}px`;
                            break;
                        case "top":
                            if(this.sizableY === false){break}
                            this.frame.style.height = `${org.height - dy}px`;
                            this.frame.style.top    = `${org.y + dy}px`;
                            break;
                        case "top-left":
                            if(this.sizableX){
                                this.frame.style.width  = `${org.width - dx}px`;
                                this.frame.style.left   = `${org.x + dx}px`;
                            }
                            if(this.sizableY){
                                this.frame.style.height = `${org.height - dy}px`;
                                this.frame.style.top    = `${org.y + dy}px`;
                            }
                            break;
                        case "top-right":
                            if(this.sizableX){
                                this.frame.style.width  = `${org.width + dx}px`;
                            }
                            if(this.sizableY){
                                this.frame.style.height = `${org.height - dy}px`;
                                this.frame.style.top    = `${org.y + dy}px`;
                            }
                            break;
                        case "bottom-left":
                            if(this.sizableX){
                                this.frame.style.width  = `${org.width - dx}px`;
                                this.frame.style.left   = `${org.x + dx}px`;
                            }
                            if(this.sizableY){
                                this.frame.style.height = `${org.height + dy}px`;
                            }
                            break;
                        case "bottom-right":
                            if(this.sizableX){
                                this.frame.style.width  = `${org.width + dx}px`;
                            }
                            if(this.sizableY){
                                this.frame.style.height = `${org.height + dy}px`;
                            }
                            break;
                    }
                    this.save();
                    window.getSelection().removeAllRanges();
                }
            };

            const mouseup_handler = (e)=>{
                this.is_sizing = false;
                window.removeEventListener("mousemove",mousemove_handler);
                window.removeEventListener("mouseup",mouseup_handler);
                callback(e);
                // DOM.focus = null;
                // this.frame.style.zIndex = this.zIndex.min;

            }

            window.addEventListener("mousemove",mousemove_handler);
            window.addEventListener("mouseup",mouseup_handler);
        }

        // add resizer
        const resizers = [
            resizer_top_left,resizer_top_right,resizer_bottom_left,resizer_bottom_right,
            resizer_top,resizer_bottom,resizer_left,resizer_right
        ];
        this.resizers = resizers;
        for(let r of resizers){
            this.frame.appendChild(r);
            r.addEventListener("mousedown",mousedown_handler);
        }

        // css が未定義であれば追加
        DOM.style = DOM.style ?? new Style(`
            .resizable{
                width:  calc(100% - 2px);
                height: calc(100% - 2px);
                border: 1px solid rgb(100,100,100);
                border-radius: 3px;
                overflow: auto;
                position: absolute;
                // position: fixed;
                box-sizing: border-box;
                z-index: 1;
            }

            .resizable.disable{
                border: 1px solid rgb(100,100,100,0.1);
            }

            .resizer{
                position: absolute;
                background: transparent;
                z-index:1;
            }

            .resizer.top-left,
            .resizer.top-right,
            .resizer.bottom-left,
            .resizer.bottom-right{
                width:  16px;
                height: 16px;
                // background: #666;
            }

            .resizer.top,
            .resizer.bottom{
                height: 6px;
                width: 100%;
                cursor: ns-resize;
            }

            .resizer.left,
            .resizer.right{
                width: 6px;
                height: 100%;
                cursor: ew-resize;
            }

            // .top-left{ top:-2px; left: -2px; cursor: nwse-resize;}
            // .top-right{ top:-2px; right: -2px; cursor: nesw-resize;}
            // .bottom-left{ bottom:-2px; left: -2px; cursor: nesw-resize;}
            // .bottom-right{ bottom:-2px; right: -2px; cursor: nwse-resize;}
        
            // .top{ top: -3px; left:0;}
            // .right{ top: 0; right:-3px;}
            // .bottom{ bottom: -3px; left:0;}
            // .left{ top: 0; left:-3px;}

            .top-left{ top:0; left: 0; cursor: nwse-resize;}
            .top-right{ top:0; right: 0; cursor: nesw-resize;}
            .bottom-left{ bottom:0; left: 0; cursor: nesw-resize;}
            .bottom-right{ bottom:0; right: 0; cursor: nwse-resize;}
        
            .top{ top: 0; left:0;}
            .right{ top: 0; right:0;}
            .bottom{ bottom: 0; left:0;}
            .left{ top: 0; left:0;}

        `).build();

        return this;
    }

    setable(btn_info=[{innerHTML:"×",callback:(e)=>{console.log("click.")}}]){
        this.frame.style.position = "absolute";
        const tool_frame  = DOM.create("div", {id:`tool-frame${this.id}`  ,class:`tool-frame`});
        tool_frame.style.position = "absolute";
        tool_frame.style.top = 0;
        tool_frame.style.right = 0;
        tool_frame.style.zIndex = 1;
        for(let bi of btn_info){
            const btn = DOM.create("span",{class:`dom-setting-btn`});
            btn.innerHTML = bi.innerHTML;
            btn.style.cursor = "pointer";
            btn.addEventListener("click",(e)=>{
                bi.callback(e);
            });
            tool_frame.appendChild(btn);
        }
        this.frame.appendChild(tool_frame);
        this.tool_frame = tool_frame;
        return this;
    }

    save(){
        const info = getComputedStyle(this.frame);
        let z = this.frame.style.zIndex ?? 0;
        if(z=="" || isNaN(z)){z = 0}
        // const w = this.is_fixed ? 1 : DOM.windowRatio.w;
        // const h = this.is_fixed ? 1 : DOM.windowRatio.h;
        // this.x = parseFloat(info.left)   / w;
        // this.y = parseFloat(info.top)    / h;
        // this.w = parseFloat(info.width)  / w;
        // this.h = parseFloat(info.height) / h;
        this.x = parseFloat(info.left)  ;
        this.y = parseFloat(info.top)   ;
        this.w = parseFloat(info.width) ;
        this.h = parseFloat(info.height);
        this.z = parseFloat(z);
    }
}

class Note extends DOM{
    static style = null;
    constructor(selector="body",src=""){
        super(selector);
        this.index();
        this.src = src;
        this.pre = null;
        this.pro = null;
        this.mode = "black";
        this.is_editing = false;
        this.markup = new MarkUp(this.src);
    }
    
    make(){
        const elm = super.make();
        elm.style.display = "flex";
        elm.style.flexDirection = "row";
        elm.style.width = "100%";
        elm.style.height = "100%";
        
        const pre = DOM.create("textarea",{class:"note"});
        pre.classList.add(this.mode);
        pre.value = this.src;
        // pre.contentEditable = true;
        this.pre = pre;
        
        const pro = DOM.create("pre",{class:"note"});
        pro.classList.add(this.mode);
        pro.innerHTML = this.draw(this.src);
        this.pro = pro;

        elm.appendChild(pre);
        elm.appendChild(pro);

        this.end_edit();
        return elm;
    }

    start_edit(){
        this.is_editing = true;
        this.pro.style.display = "none";
        this.pre.style.display = "inline-block";
    }

    end_edit(){
        this.is_editing = false;
        this.pro.style.display = "inline-block";
        this.pre.style.display = "none";
        this.save();
    }

    save(){
        // this.src = this.pre.textContent;
        this.src = this.pre.value;
        this.pro.innerHTML = this.draw(this.src); 
    }

    draw(src=null){
        // console.log(src ?? this.src);
        this.markup.update(src ?? this.src);
        let result = this.markup.frame.innerHTML;
        return result;
    }

    style(){
        return Note.style ?? new Style(`
            .${this.cssClassFrame}{
                opacity:0.8;
                height:100%;
                width:100%;
            }
            .${this.cssClassFrame}:hover{
                opacity:1.0;
            }
            .${this.cssClassFrame}.active{
                opacity:1.0;
            }
            .note{
                display:inline-block;
                margin:4px;
                padding:4px;
                width: calc(100% - 16px);
                height:calc(100% - 16px);
                text-wrap:wrap;
                word-break:break-word;
                resize:none;
            }
            .note.black{
                background-color:black;
                color:white;
            }
        `).build();
    }

    build(src=""){
        if(src!=""){this.src = src};
        Note.style = this.style();
        super.build();
        this.contextmenu = new ContextMenu(this.frame);
        this.contextmenu.append("編集",()=>{this.start_edit()});
        this.contextmenu.append("保存",()=>{this.end_edit()});

        this.contextmenu.build();
        return this.frame;

    }

    activate(){
        for(let i of Note.list){
            i.deactivate();
        }
        this.frame.classList.add("active");
    }

    deactivate(){
        this.frame.classList.remove("active");
    }
}

class ICON extends DOM{
    static CST = {
        SIZE:{SMALL:16,MIDDLE:32,LARGE:48,XLARGE:64,XXLARGE:90},
        COLOR:{WHITE:"white",Black:"black",NONE:"none"}
    }
    static style = null;

    constructor(selector="body",src="",size=ICON.CST.SIZE.MIDDLE){
        super(selector);
        this.size = size;
        this.img = null;
        this._click = null;
        this._src = src;
        this._backgroundColor = ICON.CST.COLOR.NONE;
        this._color = ICON.CST.COLOR.WHITE;
        this._title = "";
        this.active = false;

        this.index();
    }

    get title(){
        return this._title;
    }

    set title(t){
        this._title = t;
        if(this.img){this.img.title = t}
    }

    get src(){
        return this._src;
    }

    set src(url){
        this._src = url;
        if(this.img){this.img.src = url}
    }

    get backgroundColor(){
        return this._backgroundColor;
    }

    set backgroundColor(c){
        this._backgroundColor = c;
        if(this.img){this.img.style.backgroundColor = c}
    }

    get color(){
        return this._color;
    }

    set color(c){
        this._color = c;
        if(this.img){this.img.style.color = c}
    }

    get click(){
        return this._click;
    }

    set click(f){
        if(typeof(f)==="function"){
            this._click = f;
        }else{
            console.error("click property is function");
        }
    }

    make(){
        const elm = super.make();
        const img = DOM.create("img",{class:"icon-dom"});
        img.src = this.src;
        img.style.width  = `${this.size}px`;
        img.style.height = `${this.size}px`;
        img.style.backgroundColor = this.backgroundColor;
        img.style.color = this.color;
        img.title = this.title;
        img.addEventListener("click",()=>{
            if(typeof(this._click)==="function"){
                this.activate();
                this._click();
            }
        });
        this.img = img;
        elm.appendChild(img);
        return elm;
    }

    style(){
        return ICON.style ?? new Style(`
            .${this.cssClassFrame}{
                display:flex;
                justify-content:center;
                aligin-items:center;
                opacity:0.5;
            }
            .${this.cssClassFrame}:hover{
                opacity:1.0;
            }
            .${this.cssClassFrame}.active{
                opacity:1.0;
            }
        `).build();
    }

    build(src=""){
        if(src!=""){this.src = src};
        ICON.style = this.style();
        return super.build();
    }

    activate(){
        for(let i of ICON.list){
            i.deactivate();
        }
        this.frame.classList.add("active");
    }

    deactivate(){
        this.frame.classList.remove("active");
    }
}

class ToolBar extends DOM{
    constructor(selector="body"){
        super(selector);
        this.tools = [];
        this.tframe = null;
        this.zIndex={min:3,max:4};
        this.index();
    }

    make(){
        const frame = DOM.create("div",{class:"toolbar-frame"});
        this.tframe = frame;
        const pickarea = DOM.create("div",{class:"toolbar-pickarea"});
        pickarea.textContent = "::";
        pickarea.addEventListener("mousedown",(e)=>{
            pickarea.classList.add("active");
        });
        
        document.addEventListener("mouseup",(e)=>{
            pickarea.classList.remove("active");
        });

        this.tframe.appendChild(pickarea);

        return frame;
    }

    append(dom="<div>sample</div>",callback=()=>{}){
        const toolclass = "toolbar-item";
        let d = null;
        if(typeof(dom)==="string"){
            d = DOM.create("span",{class:toolclass});
            d.innerHTML = dom;
        }else{
            dom.classList.add(toolclass);
            d = dom;
        }
        if(d){
            d.id = `toolbar-item${this.tools.length}`;
            d.addEventListener("click",()=>{callback();});
            this.tools.push(d);
            this.tframe.appendChild(d);
        }
        return d;
    }

    delete(index=0){
        const i = this.tools.findIndex((t)=>t.id==`toolbar-item${index}`);
        let result = false;
        if(i>=0){
            const target = this.tools[i];
            this.tools = this.tools.filter((t)=>t===target);
            target.remove();
            result = true;
        }else{
            console.error("削除対象がありません",index,this.tools);
        }
        return result;
    }

    style(){
        return ToolBar.style ?? new Style(`
            .${this.cssClassFrame}{
                z-index:3;
                background-color:black;
                border:1px solid grey;
                border-radius: 3px;
            }
            .toolbar-frame{
                display:flex;
                flex-direction:row;
                justify-content:center;
                align-items:center;
                width:auto;
                height:24px;
                font-size:16px;
            }
            .toolbar-item{
                display:flex;
                justify-content:center;
                align-items:center;
                width:auto;
                height:16px;
                padding:4px;
                cursor:pointer;
            }
            .toolbar-pickarea{
                display:flex;
                justify-content:center;
                align-items:center;
                width:auto;
                height:16px;
                padding:4px;
                cursor:grab;
            }
            .toolbar-pickarea.active{
                cursor:grabbing;
            }
        `);
    }

    build(){
        ToolBar.style = this.style();
        super.build();
        this.movable();
        this.movableX = true;
        this.movableY = true;
        return this.frame;
    }
}

class IFrame extends DOM{

    static style = null;

    constructor(selector="body",src=""){
        super(selector);
        this._src = src;
        this.append();
    }

    get src(){
        return this._src;
    }

    set src(url){
        this._src = url;
        if(this.iframe){this.iframe.src = url}
    }

    make(){
        const iframe = DOM.create("iframe",{class:"iframe-dom"});
        iframe.src = this.src;
        iframe.frameborder = 0;
        iframe.scrolling = "no";
        return iframe;
    }

    style(){
        return IFrame.style ?? new Style(`
            .${this.cssClassFrame}{
                width:100%;
                height:100%;
            }
            .iframe-dom{
                width:calc(100% - 2px);
                height:calc(100% - 2px);
                border:none;
                box-shadow: none;
                outline: none;
            }
        `);
    }

    build(src=""){
        if(src!=""){this.src = src;}
        IFrame.style = this.style();
        return super.build();
    }
}

class NumForm extends DOM{
    constructor(selector="body"){
        super(selector);
        this._change = null;
        this.build();
    }

    get change(){
        return this._change;
    }

    set change(func){
        if(typeof(func)==="function"){
            this._change = func;
        }
    }

    make(){
        // <input type="number" min="1" max="99" step="1" value="1" />
        const elm = document.createElement("input");
        elm.type = "number";
        elm.min = 1;
        elm.max = 99;
        elm.step = 1;
        elm.value=1;
        elm.addEventListener("change",()=>{
            if(elm.value<1){elm.value=1}
            if(elm.value>99){elm.value=99}
            if(typeof(this.change)==="function"){
                this.change(elm.value);
            }
        })
        return elm;
    }
}

class FileForm extends DOM{

    constructor(selector="body"){
        super(selector);
        const self = this;
        this.append(this);
        this.files = {};
        this.input = null;
        this.list = null;
        this.select = null;
        this.cancel = null;
        this.pre = document.createElement("pre");

        /** modal.jsに依存 */
        this.cm = new ConfirmModal()
            .set_body("重複したファイルが存在します。上書きしてよろしいですか？")
            .set_yes_button(()=>{"OK"},"上書き")
            .set_no_button(()=>{"Cancel"},"キャンセル");

        this.modal = new Modal()
            .set_body(this.pre)
            .set_no_button(()=>{this.pre.innerHTML=""},"閉じる");

        this.build();
    }

    get multiple(){
        return this.input.multiple;
    }

    set multiple(bool){
        this.input.multiple = bool;
    }

    get filenames(){
        return Object.keys(this.files)
    }

    get fileobjects(){
        return Object.values(this.files);
    }

    get frames(){
        return document.querySelectorAll(`.ff${this.id}`);
    }

    get checkbox_list(){
        return document.querySelectorAll(`.ff${this.id} input[type=checkbox]`);
    }

    make(){
        const self = this;
        const elm = super.make();
        const select = document.createElement("button");
        select.type = "button";
        select.textContent = "ファイル選択";
        const cancel = document.createElement("button");
        cancel.type="button";
        cancel.textContent = "削除";
        cancel.addEventListener("click",function(){
            const ff_input = self.checkbox_list;
            for(let chk of ff_input){
                if(chk.checked === true){
                    self.delete(chk.name);
                }
            }
        });
    
        const input = document.createElement("input");
        input.type="file";
        input.multiple = true; // 複数選択を許可するかどうか
        input.style.display = "none";

        const list = document.createElement("div");
        list.id = `ff-body-frame${this.id}`;
        list.classList.add(`ff-body-frame`);

        // ファイルフォームをクリックしたことにする
        select.addEventListener("click",function(){
            input.click();
        });

        // ファイルフォームのファイルロードが終了した、ファイルを取得
        input.addEventListener("change", async function(e){
            e.preventDefault();
            const file_list = e.target.files;
            let duplicate = false;
            for(let file of file_list){
                // 重複する場合はモーダルでチェック
                if(self.filenames.includes(file.name)){
                    await self.cm.confirm(function(){
                        for(let file of file_list){
                            self.add(file);    
                        }
                    });
                    duplicate = true;
                    break;
                }
            }

            // 重複しない場合はそのまま登録
            if(duplicate === false){
                for(let file of file_list){
                    self.add(file);    
                }
            }
        });

        const head_frame = document.createElement("div");
        head_frame.id = `ff-head-frame${this.id}`;
        head_frame.classList.add("ff-head-frame");
        
        const allcheck_btn = document.createElement("input");
        allcheck_btn.type = "checkbox";
        allcheck_btn.id = `allcheck${this.id}`;
        allcheck_btn.addEventListener("click",function(){
            const checked = allcheck_btn.checked;
            const ff_input = self.checkbox_list;
            for(let chk of ff_input){
                chk.checked = checked;
            }
        });

        const allcheck_label = document.createElement("label");
        allcheck_label.setAttribute("for",allcheck_btn.id);
        allcheck_label.appendChild(allcheck_btn);
        allcheck_label.appendChild(document.createTextNode("選択中のファイル名"));

        head_frame.appendChild(allcheck_label);

        this.input = input;
        this.select = select;
        this.cancel = cancel;
        this.list = list;
        this.allcheck_btn = allcheck_btn;

        elm.appendChild(select);
        elm.appendChild(input);
        elm.appendChild(head_frame);
        elm.appendChild(list);
        elm.appendChild(cancel);

        return elm;
    }

    add(file){

        if(document.getElementById(`ff${this.id}-${file.name}`) !== null){
            this.delete(file);
        }
         
        const f = document.createElement("div");
        f.id = `ff${this.id}-${file.name}`;
        f.classList.add(`ff${this.id}`);
        f.name = file.name;

        const c = document.createElement("input");
        c.id = `ffcheckbox${this.id}-${file.name}`;
        c.name = `${file.name}`;
        c.type="checkbox";

        const label = document.createElement("label");
        label.setAttribute("for",c.id);
        label.appendChild(document.createTextNode(file.name));

        f.appendChild(c);
        f.appendChild(label);

        this.files[file.name] = file;
        this.list.appendChild(f);
    }

    delete(file){
        let filename = "";
        if(typeof(file) === "string"){
            filename = file;
        }else{
            filename = file.name;
        }
        const f = document.getElementById(`ff${this.id}-${filename}`);
        f.remove();
        delete this.files[filename];
    }

    read(file){
        let filename = "";
        let f = null;
        if(typeof(file) === "string"){
            filename = file;
            f = this.files[filename];
        }else if(typeof(file) === "object"){
            filename = file.name;
            f = file;
        }

        return new Promise((resolve, reject)=>{
            this.pre.innerHTML = "読み込み中...";
            this.modal.show();
            setTimeout(()=>{
                try{
                    const reader = new FileReader();
                    reader.onload = function(e){resolve(e.target.result);};
                    reader.onerror = function(e){reject(e);};
                    reader.readAsText(f);
                }catch(e){
                    this.pre.appendChild(document.createTextNode("読み込みに失敗しました"));
                    this.modal.show();
                }
            },1000);
        }).then((t)=>{
            this.pre.innerHTML = "";
            this.pre.appendChild(document.createTextNode(t));
            this.modal.show();
        }).catch((e)=>{
            this.pre.appendChild(document.createTextNode("読み込みに失敗しました"));
            this.modal.show();
        });
    }

}

console.log("grid.js is called.")

window.addEventListener("resize",function(){
    for(let g of Grid.list){
        g.resize();
    }
});
class Grid{
    static width = window.innerWidth;
    static height = window.innerHeight;
    static list = [];
    static id = 0;
    static is_pc = Platform.isPC();
    static is_mobile = Platform.isMobile();

    static get windowRatio(){
        return {
            w: window.innerWidth / this.width ,
            h:  window.innerHeight / this.height,
        }
    }

    constructor(x=64,y=64,selector="body",labelX="none",labelY="none"){
        this.id = Grid.id++;
        this.x = x;
        this.y = y;
        this.baseFontSize = 12; //Platform.isPC() ? Grid.width / 100 : Grid.width / 50;
        this.dom = this.make(selector);
        this.adjust();
        this.fontSize = this.baseFontSize;
        this.fontResize = false;
        this._objects = {};
        this.lineColor = "#444444";
        this.lineSubColor = "#aaaaaa";
        this._width  = this.dom.offsetWidth;
        this._height = this.dom.offsetHeight;
        this._fit_event = null;
        this.finalize = function(){
            /* 敷き詰め後の最終処理を実装する */
            // for(let b of Block.list){
            //     b.search_laps();
            //     b.draw();
            // }
        }

        this.draw();
        this.label = {x:null,y:null};
        this.label_strong_color = "lightgreen";
        this.label_light_color  = "lightblue";
        this.labelX_mode = labelX; // "none","num", "date", "time"
        this.labelY_mode = labelY; 
        this.labelsX = this.labelingX();
        this.labelsY = this.labelingY();
        this.dom.parentElement.style.position = "relative";
        Grid.list.push(this);
    }


    /**
     * サイズ調整用のメソッド
     */
    adjust(){
        this.dom.style.width = `${this.dom.parentElement.offsetWidth}px`;
        this.dom.style.height = `${this.dom.parentElement.offsetHeight}px`;
    }

    /**
     * {x,y,z,w,h,resize,draw}
     */
    get objects(){
        return Object.values(this._objects);
    }

    get objectsID(){
        return Object.keys(this._objects);
    }

    get w(){
        return this.x > 0 ? Math.round(((this.dom.parentElement.offsetWidth || Grid.width) / this.x)) : 0;
        // return this.x > 0 ? Math.round(((this.dom.parentElement.offsetWidth || Grid.width) / this.x) * Grid.windowRatio.w) : 0;
    }

    get h(){
        return this.y > 0 ? Math.round(((this.dom.parentElement.offsetHeight || Grid.height) / this.y)) : 0;
        // return this.y > 0 ? Math.round(((this.dom.parentElement.offsetHeight || Grid.height) / this.y) * Grid.windowRatio.h) : 0;
    }

    get width(){
        /**
         * Grid全体の横幅
         */
        return this.dom.offsetWidth;
    }

    get height(){
        /**
         * Grid全体の立幅
         */
        return this.dom.offsetHeight;
    }

    get fontSize(){
        return parseFloat(this.dom.style.fontSize.split("px").join(""));
    }

    set fontSize(size){
        this.dom.style.fontSize = `${size}px`;
    }

    get position(){
        /**
         * fixed or absolute
         */
        return this.dom.style.position
    }

    set position(posi){
        /**
         * fixed or absolute
         */
        this.dom.style.position = posi;
    }

    get map(){
        const lst = [];
        for(let r=0; r<this.y; r++){
            lst[r] = [];
            for(let c=0; c<this.x; c++){
                lst[r][c]=[];
            }
        }
        for(let o of this.objects){
            const wid = o.resizable === true ? Math.round(this.w / Grid.windowRatio.w) : this.w;
            const hit = o.resizable === true ? Math.round(this.h / Grid.windowRatio.h) : this.h;
            let x = o.p.x ?? Math.round(o.x/wid);
            let y = o.p.y ?? Math.round(o.y/hit);
            let w = o.p.w ?? Math.round(o.w/wid);
            let h = o.p.h ?? Math.round(o.h/hit);
            // lst[y][x].push(o);
            for(let r=0; r<h; r++){
                // lst[y+r][x].push(o);
                for(let c=0; c<w; c++){
                    lst[y+r][x+c].push(o);
                }
            }
        }
        return lst;
    }

    cell(r,c){
        let result = null;
        if( r<this.map.length){
            result = this.map[r][c];
        }
    }

    /**
     * X軸方向へのラベリング
     * @returns {Array} tmp
     */
    labelingX(){
        const tmp = [];
        const lbl  = DOM.create("div",{class:"grid-labelX"});
        const lbls = DOM.create("div",{class:"grid-labelsX"});
        lbls.style.display = "flex";
        lbls.style.position = "sticky";
        lbls.style.zIndex = 2;
        lbls.style.top = 0;
        lbls.style.pointerEvents = "none";
        lbl.style.display = "block";
        lbl.style.flex = 1;
        lbl.style.textAlign = "center";
        lbl.style.fontWeight = "bold";
        lbl.style.pointerEvents = "none";
        lbl.style.opacity = "0.5";
        const dt = new DateTime();
        const lst = dt.list(this.x,this.labelX_mode);
        for(let i=0; i<this.x; i++){
            const l = lbl.cloneNode(true);
            l.style.color = i % 5 == 0 ? this.label_strong_color : this.label_light_color;
            let t = lst[i] ?? "";
            l.textContent = t;
            tmp.push(l);
            lbls.appendChild(l);
        }
        this.dom.appendChild(lbls);
        this.label.x = lbls;
        return tmp;
    }

    labelingY(){
        const tmp = [];
        const lbl  = DOM.create("div",{class:"grid-labelY"});
        const lbls = DOM.create("div",{class:"grid-labelsY"});
        lbls.style.display = "flex";
        // lbls.style.flexWrap = "wrap";
        lbls.style.flexDirection = "column";
        lbls.style.position = "sticky";
        lbls.style.zIndex = 2;
        lbls.style.left = 0;
        lbls.style.width = "12px";
        lbls.style.height = "100%";
        lbls.style.pointerEvents = "none";
        lbl.style.display = "block";
        lbl.style.flex = 1;
        lbl.style.textAlign = "center";
        lbl.style.fontWeight = "bold";
        lbl.style.pointerEvents = "none";
        lbl.style.opacity = "0.5";
        const dt = new DateTime();
        const lst = dt.list(this.x,this.labelY_mode);
        for(let i=0; i<this.y; i++){
            const l = lbl.cloneNode(true);
            l.style.color = i % 5 == 0 ? this.label_light_color : this.label_light_color;
            let t = lst[i] ?? "";
            l.textContent = t;
            tmp.push(l);
            lbls.appendChild(l);
        }
        this.dom.appendChild(lbls);
        this.label.y = lbls;
        return tmp;
    }

    make(selector){
        const self = this;
        const dom = document.querySelector(selector);
        dom.style.margin = "0px";
        dom.style.padding = "0px";
        dom.style.position = "fixed";
        dom.addEventListener("mouseup",function(){
            self.draw();
        });
        return dom;
    }
    
    draw(){
        // 背景の描画
        const dom = this.dom;
        const w = this.w;
        const h = this.h;
        dom.style.backgroundSize = `${w * this.x}px ${h * this.y}px`;
        dom.style.backgroundPosition = `0% 0%`;
        dom.style.backgroundImage = `repeating-linear-gradient(90deg,${this.lineColor} 0px,${this.lineColor} 1px,transparent 1px,transparent ${w}px,${this.lineColor} ${w}px,${this.lineColor} ${w+1}px,transparent ${w+1}px, transparent ${w*2}px),repeating-linear-gradient(0deg,${this.lineColor},${this.lineColor} 1px,transparent 1px,transparent ${h}px)`;
        // dom.style.background = `repeating-linear-gradient(90deg,${this.lineSubColor} 0px,${this.lineColor} 1px,transparent 1px,transparent ${w}px,${this.lineColor} ${w}px,${this.lineColor} ${w+1}px,transparent ${w+1}px,transparent ${w*2}px,${this.lineColor} ${w*2}px,${this.lineColor} ${w*2+1}px,transparent ${w*2+1}px,transparent ${w*3}px,${this.lineColor} ${w*3}px,${this.lineColor} ${w*3+1}px,transparent ${w*3+1}px,transparent ${w*4}px,${this.lineColor} ${w*4}px,${this.lineColor} ${w*4+1}px,transparent ${w*4+1}px,transparent ${w*5}px),repeating-linear-gradient(0deg,${this.lineColor},${this.lineColor} 1px,transparent 1px,transparent ${h}px)`;
        
        // オブジェクトの描画
        for(let o of this.objects){
            // 座標の調整
            this.fit(o);
            // 描画
            o.draw();
            // fit後のイベント
            if(typeof(this._fit_event) === "function"){
                this._fit_event(this.objects);
            }
        }

        // 全体の後処理
        if(typeof(this.finalize) === "function"){
            this.finalize();
        }
    }

    globalize(){
        this.position = "fixed";
        this.draw();
    }

    localize(){
        this.position = "absolute";
        this.draw();
    }

    fit(o){
        if(o.filtable === false){return;}
        const w = o.resizable === true ? Math.round(this.w / Grid.windowRatio.w) : this.w; // 不変良
        const h = o.resizable === true ? Math.round(this.h / Grid.windowRatio.h) : this.h; // 不変良
        
        console.log("-----------");
        if(o.x % w > w / 2){
            o.x = Math.floor((o.x / w) + 1) * w;
        }else{
            o.x = Math.floor(o.x / w) * w;
        }

        console.log(o.y % h , h / 2, o.y % h > h / 2);
        if(o.y % h > h / 2){
            o.y = Math.floor((o.y / h) + 1) * h;
        }else{
            o.y = Math.floor(o.y / h) * h;
        }

        // console.log(o.w % w > w / 2, o.w % w , o.w, w, w/2);
        if(o.w % w > w / 2){
            o.w = Math.floor((o.w / w) + 1) * w;
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }else{
            o.w = Math.floor(o.w /w) * w;
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }

        if(o.h % h > h / 2){
            o.h = Math.floor((o.h / h) + 1) * h;
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }else{
            o.h = Math.floor(o.h / h) * h;
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }

        // はみ出した場合の処理
        if(o.x < 0){
            o.x = 0;
        }

        if(o.x + o.width > this.width){
            // console.log(o.x , w, this.width);
            o.x = this.width - o.width;
        }

        if(o.y < 0){
            o.y = 0;
        }

        if(o.y + o.height > this.height){
            // console.log(o.y , h, this.height);
            o.y = this.height - o.height;
        }

        o.p = {
            x:Math.round(o.x/w),
            y:Math.round(o.y/h),
            z:o.z,
            w:Math.round(o.w/w),
            h:Math.round(o.h/h),
        };


        if(typeof(o.fit) === "function"){
            o.fit(o.p);
        }
    }

    check(obj){
        let message = "";
        if(obj.x === undefined || obj.y === undefined || obj.z === undefined || obj.h === undefined || obj.w === undefined){
            message = "座標指定かサイズ指定が未定義です\n";
        }

        if(typeof(obj.draw) !== "function" || typeof(obj.resize) !== "function"){
            message = "描画関数、リサイズ関数が未定義です\n";
        }

        return message;
    }

    append(id,obj){
        const msg = this.check(obj);
        if(msg.length === 0){
            obj.x = obj.x * this.w;
            obj.y = obj.y * this.h;
            obj.h = obj.h * this.h;
            obj.w = obj.w * this.w;
            this._objects[id] = obj;
            this.dom.appendChild(obj.pack);
        }else{
            console.warn(msg);
        }
        return this._objects;
    }

    move(o,x=1,y=1){
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        o.move(
            o.x + (w * x),
            o.y + (h * y)
        )
        this.draw();
    }

    size(o,x=1,y=1){
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        o.size(
            o.w + (w * x),
            o.h + (h * y)
        )
        this.draw();
    }

    point(o,x=1,y=1){
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        o.x = x * w;
        o.y = y * h;
        this.draw();
        return o;
    }

    remove(id){
        this._objects[id].remove();
        delete this._objects[id];
        return this._objects;
    }

    resize(){
        this.adjust();
        const ratio = Grid.windowRatio;
        // 各オブジェクトのリサイズ
        for(let o of this.objects){
            o.resize(ratio);
        }

        // フォントサイズを変更
        if(this.fontResize === true){
            this.fontSize = Grid.windowRatio.w * this.baseFontSize;
        }

        // グリッドの再描画
        this.draw();
    }
}

class GridFix extends Grid{
    static defaultW = Grid.width / 32;
    static defaultH = Grid.height / 32;
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body",labelX="none",labelY="none"){
        super(x,y,selector,labelX,labelY);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
    }

    adjust(){
        // 固定サイズのため、サイズ調整しない
    }

    append(id,obj){
        obj.resizable = false;
        return super.append(id,obj);
    }

    get w(){
        return this._w;
    }

    get h(){
        return this._h;
    }

    fit(o){
        if(o.filtable === false){return;}
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w; // 不変良
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h; // 不変良
        

        if(o.x % w > w / 2){
            o.x = Math.floor((Math.floor(o.x / w) + 1) * w);
        }else{
            o.x = Math.floor(Math.floor(o.x / w) * w);
        }

        console.log(o.y % h , h / 2, o.y % h > h / 2);
        if(o.y % h > h / 2){
            o.y = Math.round((Math.floor(o.y / h) + 1) * h);
        }else{
            o.y = Math.round(Math.floor(o.y / h) * h);
        }

        // console.log(o.w % w > w / 2, o.w % w , o.w, w, w/2);
        if(o.w % w > w / 2){
            o.w = Math.floor((Math.floor(o.w / w) + 1) * w);
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }else{
            o.w = Math.floor(Math.floor(o.w /w) * w);
            if( 2 * o.borderWidth < w / 2){
                o.w -= o.borderWidth;
            }
        }

        if(o.h % h > h / 2){
            o.h = Math.floor((Math.floor(o.h / h) + 1) * h);
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }else{
            o.h = Math.floor(Math.floor(o.h / h) * h);
            if( 2 * o.borderWidth < h / 2){
                o.h -= o.borderWidth;
            }
        }

        // はみ出した場合の処理
        if(o.x < 0){
            o.x = 0;
        }

        if(o.x + o.width > this.width){
            // console.log(o.x , w, this.width);
            o.x = this.width - o.width;
        }

        if(o.y < 0){
            o.y = 0;
        }

        if(o.y + o.height > this.height){
            // console.log(o.y , h, this.height);
            o.y = this.height - o.height;
        }

        o.p = {
            x:Math.round(o.x/w),
            y:Math.round(o.y/h),
            z:o.z,
            w:Math.round(o.w/w),
            h:Math.round(o.h/h),
        };


        if(typeof(o.fit) === "function"){
            o.fit(o.p);
        }
    }
}

class GridFixGlobal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body"){
        super(x,y,w,h,selector);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.globalize();
        this.dom.parentElement.style.position = "relative";
    }
}

class GridFixLocal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body",labelX="none",labelY="none"){
        super(x,y,w,h,selector,labelX,labelY);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.localize();
        this.dom.parentElement.style.position = "relative";
        this.dom.parentElement.style.overflow = "auto";
    }
}

class GridObject extends DOM{
    static style = null;
    static CONST = {
        COLOR:{
            UNFOCUS:{NONE:"none",WHITE:"#ffffffbb",GREY:"#888888bb",BLACK:"#111111bb",RED:"#ff0000bb",Blue:"#00ff00bb",GREEN:"#00fa25bb",YELLOW:"#fafa00bb",PURPLE:"#6000fabb",PINK:"#f200fabb",ORANGE:"#faab00bb",BROWN:"#fa7500bb"},
            FOCUS  :{NONE:"none",WHITE:"#ffffffff",GREY:"#888888ff",BLACK:"#111111ff",RED:"#ff0000ff",Blue:"#00ff00ff",GREEN:"#00fa25ff",YELLOW:"#fafa00ff",PURPLE:"#6000faff",PINK:"#f200faff",ORANGE:"#faab00ff",BROWN:"#fa7500ff"},
        }
    }
    constructor(selector="body",x=1,y=1,z=1,w=1,h=1,bc=null,fc=null){
        super(selector);
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.zIndex={min:1,max:2};
        this.color = GridObject.CONST.COLOR.UNFOCUS[bc] ?? GridObject.CONST.COLOR.UNFOCUS.WHITE;
        this.backgroundColor = GridObject.CONST.COLOR.UNFOCUS[fc] ?? GridObject.CONST.COLOR.UNFOCUS.BLACK;
        this.focusColor = GridObject.CONST.COLOR.FOCUS[bc] ?? GridObject.CONST.COLOR.FOCUS.WHITE;
        this.focusBackgroundColor = GridObject.CONST.COLOR.FOCUS[fc] ?? GridObject.CONST.COLOR.FOCUS.BLACK;  

        // そのほか情報
        this.data = {};

        // 監視対象かつDOMとして追加
        this.index();
    }

    build(){
        super.build();
        // Grid対応化
        this.pack = this.frame;

        // コンテキストメニュー
        this.contextmenu = new ContextMenu(this.frame);
        this.contextmenu.zIndex.min = 4;
        this.contextmenu.build();
        this.menu();

        // 各機能のフラグ
        this.fitable   = true;
        this.resizable = true;
        this.visible   = true;
        this.movableX  = true;
        this.movableY  = true;
        this.sizableX  = true;
        this.sizableY  = true;

        this.ratio = {w:1,h:1};
        this.gap = {x:0,y:0,z:0,w:0,h:0};
        this.p = {x:this.x,y:this.y,z:this.z,w:this.w,h:this.h};
        this.fix();
        this.decorate();
        this.b = {...this.p};
    }

    get p(){
        return this._p;
    }

    set p(positionset){
        this._p = positionset;
        this.frame.dataset.x = positionset.x;
        this.frame.dataset.y = positionset.y;
        this.frame.dataset.z = positionset.z;
        this.frame.dataset.w = positionset.w;
        this.frame.dataset.h = positionset.h;
    }

    menu(){
        this.contextmenu.append("固定する",()=>{this.fix()});
        this.contextmenu.append("固定解除",()=>{this.unfix()});
    }

    decorate(){
        if(DOM.focus == this){
            this.frame.style.backgroundColor = this.focusBackgroundColor;
            this.frame.style.color = this.focusColor;
        }else{
            this.frame.style.backgroundColor = this.backgroundColor;
            this.frame.style.color = this.color;
        }
    }

    unfix(){
        this.movableX  = true;
        this.movableY  = true;
        this.sizableX  = true;
        this.sizableY  = true;
        this.frame.classList.remove("disable");
    }

    fix(){
        this.movableX  = false;
        this.movableY  = false;
        this.sizableX  = false;
        this.sizableY  = false;
        this.frame.classList.add("disable");
    }

    /**
     * GridObject継承先のcontentsのDOMオブジェクト生成に相当する
     * オーバーライドしてDOMを返却することを前提とする
     * @returns 
     */
    make(){
        const elm = super.make();
        elm.style.overflow = "auto";
        elm.style.width  = "auto";
        elm.style.height = "auto";
        return elm;
    }

    /**
     * オーバーフロー：自動スクロールの切り替え設定がされたDOMを追加する
     * @param {*} o 
     */
    append(o){
        o.style.overflow = "auto";
        this.frame.appendChild(o);
    }

    movable(callback=(e)=>{console.log(e.clientX,e.clientY)}){
        return super.movable((e)=>{
            callback(e);
        });
    }

    sizable(callback=(e)=>{console.log(e.clientX,e.clientY)}){
        return super.sizable((e)=>{
            callback(e);
        });
    }

    draw(){
        this.frame.style.display = "inline-block";
        this.frame.style.zIndex = `${this.z}`;
        this.frame.style.left   = `${this.rect_info.left}px`;
        this.frame.style.top    = `${this.rect_info.top}px`;
        this.frame.style.width  = `${this.rect_info.width}px`;
        this.frame.style.height = `${this.rect_info.height}px`;
        
        this.decorate();

        if(this.visible === false){
            this.frame.style.display = "none";
        }

        return this.frame;
    }

    fit(p){
        // console.log(p);
        return this;
    }

    save(){
        const info = getComputedStyle(this.frame);
        let z = this.frame.style.zIndex ?? 0;
        if(z=="" || isNaN(z)){z = 0}
        const w = this.resizable ? DOM.windowRatio.w : 1;
        const h = this.resizable ? DOM.windowRatio.h : 1;
        this.x = parseFloat(info.left)   / w;
        this.y = parseFloat(info.top)    / h;
        this.w = parseFloat(info.width)  / w;
        this.h = parseFloat(info.height) / h;
        this.z = parseFloat(z);
    }

    move(x,y){
        if(this.movableX === true){
            this.gap.x = x - this.x;
            this.x = x;
        }else{
            this.gap.x = 0;
        };
        if(this.movableY === true){
            this.gap.y = y - this.y;
            this.y = y;
        }else{
            this.gap.y = 0;
        };
    }

    size(w,h){
        if(this.sizableX === true){
            this.gap.w = w - this.w;
            this.w = w
        }else{
            this.gap.w = 0;
        };
        if(this.sizableY === true){
            this.gap.h = h - this.h;
            this.h = h
        }else{
            this.gap.h = 0;
        };
    }

    resize(ratio){
        if(this.resizable === false){return;}
        this.ratio = ratio;
        return super.resize();
    }

    remove(){
        return super.remove();
    }

    get rect_info(){
        return {
            left:this.x * this.ratio.w,
            top:this.y * this.ratio.h,
            right:(this.x + this.w) * this.ratio.w,
            bottom:(this.y + this.h) * this.ratio.h,
            width:this.w * this.ratio.w,
            height:this.h * this.ratio.h,
        }
    }
}


// TODO touch
document.body.addEventListener("mousedown",function(e){
        Block.mouseX = e.pageX;
        Block.mouseY = e.pageY;
});
class Block{
    static cnt = 0;
    static list = [];
    // static focused = null;
    static mouseX = 0;
    static mouseY = 0;
    static MAX_ZINDEX = 1;
    static MIN_ZINDEX = 0;

    static focus(){
        window.getSelection().removeAllRanges();
        for(let b of Block.list){
            if(b.focused === true){
                b.z = Block.MAX_ZINDEX;
                // b.dom.style.borderColor = "yellow";
                b.pack.style.borderColor = b.storongBorderColor;
            }else{
                b.z = Block.MIN_ZINDEX;
                // b.dom.style.borderColor = b.dom.style.backgroundColor;
                b.pack.style.borderColor = b.baseBorderColor;
            }
            b.draw();
        }
    }

    static unfocus(){
        window.getSelection().removeAllRanges();
        for(let b of Block.list){
            b.focused = false;
            b.z = Block.MIN_ZINDEX;
            // b.dom.style.borderColor = b.dom.style.backgroundColor;
            b.pack.style.borderColor = b.baseBorderColor;
            b.draw();
        }
    }

    static get focused(){
        return Block.list.filter((b)=>b.focused===true);
    }

    static get copied(){
        return Block.list.filter((b)=>b.copied===true);
    }

    static get s (){
        return this.list.filter((b)=>b.type.toLowerCase() === this.name.toLowerCase());
    }

    static syncronize_move(block){
        const bf = Block.focused;
        for(let b of bf){
            if(b !== block){
                b.move(b.x + block.gap.x,b.y + block.gap.y);
                b.draw();
            }
        }
    }

    static syncronize_size(block){
        const bf = Block.focused;
        for(let b of bf){
            if(b !== block){
                b.size(b.w + block.gap.w,b.h + block.gap.h);
                b.draw();
            }
        }
    }

    static isOverlapping(b1, b2) {
        const rect1 = b1.dom.getBoundingClientRect();
        const rect2 = b2.dom.getBoundingClientRect();
      
        // return !(
        //   rect1.right - 2 < rect2.left ||   // rect1がrect2の左にある
        //   rect1.left + 2 > rect2.right ||   // rect1がrect2の右にある
        //   rect1.bottom + 2 < rect2.top ||   // rect1がrect2の上にある
        //   rect1.top - 2 > rect2.bottom      // rect1がrect2の下にある
        // );

        return !(
            rect1.right  < rect2.left ||   // rect1がrect2の左にある
            rect1.left  > rect2.right ||   // rect1がrect2の右にある
            rect1.bottom  < rect2.top ||   // rect1がrect2の上にある
            rect1.top  > rect2.bottom      // rect1がrect2の下にある
        );
    }

    static cut(){
        for(let b of Block.focused){
            b.visible = false;
            b.copied = true;
            b.draw();
        }

        return Block.copied;
    }

    static paste(){
        // 起点となる最も距離が上のBlockを取得する。
        const base = Block.copied.reduce((min,item)=>item.y < min.y ? item : min);
        const baseX = base.x; // ここで定数化しないと、forの中で起点がずれる可能性がある
        const baseY = base.y;
        console.log(base,base.x,base.y);
        const tmp = [];
        for(let b of Block.copied){
            b.visible = true;
            b.copied = false;
            b.move(Block.offsetX - baseX + b.x, Block.offsetY -  baseY + b.y);
            b.draw();
            tmp.push(b);
        }
        return tmp;
    }

    static _copy(x=1,y=1){
        // 起点となる最も距離が上のBlockを取得する。
        // const base = Block.focused.reduce((min,item)=>item.y < min.y ? item : min);
        // const baseX = base.x; // ここで定数化しないと、forの中で起点がずれる可能性がある
        // const baseY = base.y;
        const tmp = []
        for(let b of Block.focused){
            b.focused = false;
            const cp = new Block(b.p.x + x, b.p.y + y, b.p.z, b.p.w, b.p.h).make(b.dom.innerHTML + "のコピー");
            cp.focused = true;
            tmp.push(cp);
            cp.draw();
        }

        Block.focus();

        return tmp;
    }

    static copy(x=1,y=1){
        // 起点となる最も距離が上のBlockを取得する。
        const targets = this.focused.filter((b)=>b.type == this.name.toLowerCase());
        // const base = targets.reduce((min,item)=>item.y < min.y ? item : min);
        // const baseX = base.x; // ここで定数化しないと、forの中で起点がずれる可能性がある
        // const baseY = base.y;
        const tmp = []
        console.log(targets);
        for(let b of targets){
            b.focused = false;
            const cp = new this(b.p.x + x, b.p.y + y, b.p.z, b.p.w, b.p.h).make(b.dom.innerHTML + "のコピー");
            cp.data = b.data;
            cp.focused = true;
            tmp.push(cp);
            cp.draw();
        }

        this.focus();

        return tmp;
    }

    static remove(){
        for(let b of Block.focused){
            b.visible = false;
            b.remove();
            Block.list = Block.list.filter((o)=> b !== o);
        }
    }

    /**
     * Block検索関数 検索条件を引数にする
     * @param {Dict} condition 
     * @returns 
     */
    static find(condition={text:"text",id:0}){
        let result = [...Block.list];
        for(let k of Object.keys(condition)){
            const v = condition[k];
            if(k === "text"){
                result = result.filter((r)=>r.pack.textContent.includes(v));
            }else if(k === "id"){
                result = result.filter((r)=>r.id == v);
            }else{
                result = result.filter((r)=>r.data[k] == v);
            }
        }
        return result
    }

    constructor(x=10,y=10,z=1,w=5,h=5){
        this.id = Block.cnt++;
        // 座標情報
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.ratio = {w:1,h:1};
        this._p = {x:this.x,y:this.y,z:this.z,w:this.w,h:this.h};
        this.gap = {x:0,y:0,z:0,w:0,h:0}
        this.laps = [];
        
        // そのほか情報
        this.data = {};
        
        // DOM情報
        this.dom = null;
        this.head = null;
        this.foot = null;
        this.menu = null;
        this.body = null;
        this.frame = null;
        this.pack = null;
        this.style = {
            backgroundColor: "red",
            color: "white",
        };

        this.focused = false;
        this.moved = false;
        this.active = false;
        this.relations = {};

        // 機能の有効化・無効化
        this.movable = false;
        this.resizable = true;
        this.visible = true;
        this.hidden = false;
        this.fitable = true;
        this.movableX = true;
        this.movableY = true;
        this.sizableX = true;
        this.sizableY = true;

        // this.vertical = true;
        // this.horizontal = true;

        this.baseBorderColor = "";
        this.storongBorderColor = "yellow";
        this.baseBackgroundColor = this.style.backgroundColor;
        this.storongBackgroundColor = "blue";

        this._contextmenu = function(e){console.log(`${this.id}:contextmenu`)};
        this._dblclick = function(e){console.log(`${this.id}:dblclick`)};
        this._keydown = function(e){console.log(`${this.id}:keydown ${e.key}`)};
        this._fit = (p)=>{
            // let lap = false;
            // for(let b of Block.list){
            //     if(b.visible === true && b !== this && this.overlap(b)){
            //         this.style.backgroundColor = this.storongBackgroundColor;
            //         lap = true;
            //     }
            // }
            // if(lap === false){
            //     this.style.backgroundColor = this.baseBackgroundColor;
            // }
            if(Block.list.some((b)=>b.visible === true && b !== this && this.overlap(b))){
                this.style.backgroundColor = this.storongBackgroundColor;
            }else{
                this.style.backgroundColor = this.baseBackgroundColor;
                this.laps = [];
            }
            this.draw();
        };
        this._collide = function(b){
            // console.log(b);
            b.style.backgroundColor = b.storongBackgroundColor;
            b.draw();
        }
        this._mousemove = null;
        this._resize = null;
        this._size = null;
        this._move = null;

        Block.list.push(this);
    }

    get clone(){
        return eval(`new ${this.constructor.name}(${this.p.x},${this.p.y},${this.p.z},${this.p.w},${this.p.h})`).make(this.dom.innerHTML + "のコピー");
    }

    get type(){
        return this.constructor.name.toLowerCase(); 
    }

    get borderWidth(){
        return this.pack ? this.pack.style.borderWidth.split("px").join("") : 0;
    }

    set borderWidth(w){
        if(this.pack){
            this.pack.style.borderWidth = `${w}px`;
        }
    }

    get borderColor(){
        return this.pack ? this.pack.style.borderColor : "";
    }

    set borderColor(c){
        if(this.pack){
            this.pack.style.borderColor = c;
        }
    }

    get color(){
        return this.pack ? this.pack.style.color : "";
    }

    set color(c){
        if(this.pack){
            this.pack.style.color = c;
        }
    }

    get name(){
        return this.constructor.name.toLowerCase();
    }

    get p(){
        return this._p;
    }

    set p(positionset){
        this._p = positionset;
        this.dom.dataset.x = positionset.x;
        this.dom.dataset.y = positionset.y;
        this.dom.dataset.z = positionset.z;
        this.dom.dataset.w = positionset.w;
        this.dom.dataset.h = positionset.h;        
    }

    get size_event(){
        return this._size;
    }

    set size_event(func){
        this._size = func;
    }

    get move_event(){
        return this._move;
    }

    set move_event(func){
        this._move = func;
    }

    move(x,y){
        if(typeof(this.move_event) === "function"){
            this.move_event(x,y);
        }
        if(this.movableX === true){
            this.gap.x = x - this.x;
            this.x = x;
        }else{
            this.gap.x = 0;
        };
        if(this.movableY === true){
            this.gap.y = y - this.y;
            this.y = y
        }else{
            this.gap.y = 0;
        };
    }

    size(w,h){
        if(typeof(this.size_event) === "function"){
            this.size_event(x,y);
        }
        if(this.sizableX === true){
            this.gap.w = w - this.w;
            this.w = w
        }else{
            this.gap.w = 0;
        };
        if(this.sizableY === true){
            this.gap.h = h - this.h;
            this.h = h
        }else{
            this.gap.h = 0;
        };
    }

    make(html="", editable=false){
        // 仮想DOMから生成
        this.dom = document.createElement("div");
        if (typeof(html) === "string"){
            this.dom.innerHTML = html;
        }else{
            this.dom.appendChild(html);
        }
        this.pickable(this.dom,editable);
        this.dom.dataset.x = this.x;
        this.dom.dataset.y = this.y;
        this.dom.dataset.z = this.z;
        this.dom.dataset.h = this.h;
        this.dom.dataset.w = this.w;
        return this;
    }

    wrap(selector, editable=false){
        if(typeof(selector) === "string"){
            // 既存DOMから生成
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        
        if(this.dom === null){ console.error("セレクタの指定を間違えています。"); }
        const x = this.dom.dataset.x;
        const y = this.dom.dataset.y;
        const z = this.dom.dataset.z;
        const w = this.dom.dataset.w;
        const h = this.dom.dataset.h;

        this.x = x === undefined ? this.x : x;
        this.y = y === undefined ? this.y : y;
        this.z = z === undefined ? this.z : z;
        this.w = w === undefined ? this.w : w;
        this.h = h === undefined ? this.h : h;
        this.pickable(this.dom, editable);
        return this;
    }

    relative(sticky){
        this.relations[sticky.id] = sticky;
        return this;
    }

    unrelative(sticky){
        delete this.relations[sticky.id];
        return this;
    }

    pickable(dom=document.createElement("div"),editable=true){
        const self = this;
        dom.setAttribute("contenteditable",editable);
        dom.style.height = "calc(100% - 2px)";
        dom.style.width = "calc(100% - 2px )";
        dom.style.border = `1px solid ${this.borderColor}`;
        const pack = document.createElement("div");
        pack.style.position = "absolute";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "2px";
        pack.style.borderRadius = "4px";
        const frame = document.createElement("div");
        frame.style.overflow = "hidden";
        frame.style.height = "100%";
        frame.style.width  = "100%";
        const head = document.createElement("div");
        head.style.height = "0px";
        head.style.display = "flex";
        head.style.justifyContent = "space-between";

        const foot = document.createElement("div");
        foot.style.height = "0px";
        foot.style.display = "flex";
        foot.style.justifyContent = "space-between";

        const body = document.createElement("div");
        // body.style.overflowY = "auto";
        body.style.overflow = "hidden";
        body.style.textWrap = "wrap";
        body.style.overflowWrap = "break-word";
        body.style.height = "100%";

        body.appendChild(dom);
        frame.appendChild(head);
        frame.appendChild(body);
        frame.appendChild(foot);
        pack.appendChild(frame);

        // head
        this.head = head;

        // body
        this.body = body;

        // foot
        this.foot = foot;

        // frame
        this.frame = frame;
        this.pack = pack;

        // TODO PC スマホ版での対応
        this.event();

        return pack;
    }

    event(){
        const self = this;

        // 前処理
        // マウスによる物体の移動
        let baseL = 0;
        let baseT = 0;
        this.frame.addEventListener("mousedown",function(e){
            self.movable = true;
            baseL = self.pack.offsetLeft;
            baseT = self.pack.offsetTop;
            Block.clicked = self;
        });

        // マウスによるリサイズ
        let is_pack = false;
        let is_frame = false;
        let hold = "";
        let baseW = 0;
        let baseH = 0;
        this.pack.addEventListener("mouseover",function(e){
            is_pack = true;
            // Block.focused = self;
        });

        this.pack.addEventListener("mouseout",function(e){
            is_pack = false;
        });

        this.pack.addEventListener("mousedown",function(e){ 
            if(e.shiftKey === false){
                for(let b of Block.list){
                    b.focused = false;
                }
            } 
            self.moved   = true;
            self.focused = true;
            Block.focus();

            const base = self.pack.getClientRects()[0];
            baseL = base.left   - self.borderWidth;   
            baseT = base.top    - self.borderWidth;
            baseW = base.width  - self.borderWidth;
            baseH = base.height - self.borderWidth;

            // リサイズ方向
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left){
                    hold = "left";
                }else if( rect.right <= e.pageX){
                    hold = "right";
                }else if(e.pageY <= rect.top){
                    hold = "top";
                }else if( rect.bottom <= e.pageY){
                    hold = "bottom";
                }
            }
        });

        this.frame.addEventListener("mouseover",function(e){
            is_frame = true;
        });
        this.frame.addEventListener("mouseout",function(e){
            is_frame = false;
        });

        const _mousemove = function(e){
            if(self.moved === false){
                return;
            }
            const now = Date.now();
            if (now - self.lastExecutionTime < self.interval) {
                return;
            }else{
                self.lastExecutionTime = now;
            }
            const offset = self.pack.parentElement.getClientRects()[0];
            
            // glovalかlocalで調整
            let offsetL = offset.left;
            let offsetT = offset.top;

            if (self.position === "fixed"){
                offsetL = 0;
                offsetT = 0;
            }

            // カーソル変更
            if(is_frame === false && is_pack === true){
                const rect = self.frame.getClientRects()[0];
                if(e.pageX <= rect.left || rect.right <= e.pageX){
                    self.pack.style.cursor = "ew-resize";
                    
                }
                if( e.pageY <= rect.top || rect.bottom <= e.pageY){
                    self.pack.style.cursor = "ns-resize";
                }
            }else{
                self.pack.style.cursor = "auto";
            }

            // リサイズ
            if(hold === "right"){
                self.size(
                    (e.pageX - Block.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_size(self);

            }else if(hold === "left"){
                self.move(
                    (e.pageX - offsetL - Block.mouseX + baseL) / self.ratio.w,
                    self.y
                )
                self.size(
                    (-e.pageX + Block.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
                Block.syncronize_size(self);

            }else if(hold === "top"){
                self.move(
                    self.x,
                    (e.pageY - offsetT - Block.mouseY + baseT) / self.ratio.h,
                )
                self.size(
                    self.w,
                    (-e.pageY + Block.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
                Block.syncronize_size(self);

            }else if(hold === "bottom"){
                self.size(
                    self.w,
                    (e.pageY - Block.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_size(self);

            }


            // 位置変更
            if(self.movable){
                self.move(
                    (e.pageX - offsetL - (Block.mouseX - baseL)) / self.ratio.w,
                    (e.pageY - offsetT  - (Block.mouseY - baseT)) / self.ratio.h
                );
                self.draw();
                window.getSelection().removeAllRanges();
                Block.syncronize_move(self);
            }

            // 重なり判定
            // let lap = false;
            // for(let b of Block.list){
            //     if(b.visible === true && b !== self && self.overlap(b)){
            //         self.style.backgroundColor = self.storongBackgroundColor;
            //         lap = true;
            //     }
            // }            
            // if(lap === false){
            //     self.style.backgroundColor = self.baseBackgroundColor;
            // }

            if(Block.list.some((b)=>b.visible === true && b !== self && self.overlap(b))){
                self.style.backgroundColor = self.storongBackgroundColor;
            }else{
                self.style.backgroundColor = self.baseBackgroundColor;
                self.laps = [];
            }

        }

        this._mousemove = _mousemove;

        // 中処理
        document.body.addEventListener("mousemove", _mousemove);
        
        // 後処理
        document.addEventListener("mouseup",function(e){
            self.movable = false;
            hold = "";
        });

        // コンテキストメニュー
        this.pack.addEventListener("contextmenu",function(e){
            e.preventDefault();
            self._contextmenu(e);
        });

        // ダブルクリック
        this.pack.addEventListener("dblclick",function(e){
            self._dblclick(e);
        });

        // キー入力イベント
        this.pack.addEventListener("keydown",function(e){
            if(e.ctrlKey === true & e.shiftKey === true){
                e.preventDefault();
                self._keydown(e);
            }
        });
    }

    remove(){
        console.log("remove",this);
        this.pack.remove();
        Block.list = Block.list.filter((b)=>{return b.id !==this.id});
        const mousemove = this._mousemove;
        document.body.removeEventListener("mousemove",mousemove);
        delete this;
    }

    draw(){
        const ratio = this.ratio;
        this.pack.style.display = "inline-block";
        this.pack.style.zIndex = `${this.z}`;
        this.pack.style.left   = `${this.left}px`;
        this.pack.style.top    = `${this.top}px`;
        this.pack.style.width  = `${this.width}px`;
        this.pack.style.height = `${this.height}px`;
        this.pack.style.borderWidth = `${this.borderWidth}px`;
        this.frame = this.decorate(this.frame);

        if(this.visible === false){
            this.pack.style.display = "none";
        }

        return this.pack;
    }

    search_laps(){
        let lap = false;
        for(let b of Block.list){
            if(b.visible === true && b !== this && this.overlap(b)){
                this.style.backgroundColor = this.storongBackgroundColor;
                lap = true;
            }else{
                if(this.laps.includes(b) === true){this.laps = this.laps.filter((x)=>{return x.id !== b.id})}
            }
        }
        if(lap === false){
            this.style.backgroundColor = this.baseBackgroundColor;
            this.laps = [];
        }
    }

    resize(ratio){
        if(this.resizable === false){return;}
        this.ratio = ratio;
    }

    decorate(frame){
        for(const prop in this.style){
            frame.style[prop] = this.style[prop];
        }
        return frame;
    }

    show(){
        this.visible = true;
        return this.draw();
    }

    hide(){
        this.visible = false;
        return this.draw();
    }

    overlap(b){
        let result = false;
        if(this.visible === true && b.visible === true && this !== b){
            result = Block.isOverlapping(this,b);
            if(result){
                if(this.laps.includes(b) === false){this.laps.push(b)}
                new Promise((resolve)=>{this.collide(b);resolve();})
                    .then(()=>{b.collide(this);});
            }
            // else{
            //     if(this.laps.includes(b) === true){this.laps = this.laps.filter((x)=>x.id !== b.id)}
            // }
        }
        return result 
    }

    editable(){
        this.dom.setAttribute("contenteditable",true);
        return this.draw();
    }

    uneditable(){
        this.dom.setAttribute("contenteditable",false);
        return this.draw();
    }

    get left(){
        return this.x * this.ratio.w;
    }

    get top(){
        return this.y * this.ratio.h;
    }

    get right(){
        return (this.x + this.w) * this.ratio.w;
    }

    get bottom(){
        return (this.y + this.h) * this.ratio.h; 
    }

    get width(){
        return this.w * this.ratio.w;
    }

    get height(){
        return this.h * this.ratio.h;
    }

    get message(){
        return this.messages.innerHTML;
    }

    set message(html){
        if(typeof(html) === "string"){
            this.messages.innerHTML = html;
        }else{
            this.messages.appendChild(html);
        }
    }

    get name(){
        return this.title.innerHTML
    }

    set name(html){
        if(typeof(html) === "string"){
            this.title.innerHTML = html;
        }else{
            this.title.appendChild(html);
        }
    }

    get position(){
        return this.pack.style.position;
    }

    set position(posi){
        return this.pack.style.position = posi;
    }

    get contextmenu(){
        return this._contextmenu;
    }

    glovalize(){
        this.position = "fixed";
    }

    localize(){
        this.position = "absolute";
    }

    set contextmenu(func){
        if(typeof(func) === "function"){
            this._contextmenu = func;
        }
    }

    get dblclick(){
        return this._dblclick;
    }

    set dblclick(func){
        if(typeof(func) === "function"){
            this._dblclick = func;
        }
    }

    get keydown(){
        return this._keydown;
    }

    set keydown(func){
        if(typeof(func) === "function"){
            this._keydown = func;
        }
    }

    get fit(){
        return this._fit;
    }

    set fit(func){
        if(typeof(func) === "function"){
            this._fit = func;
        }
    }

    get collide(){
        return this._collide;
    }

    set collide(func){
        if(typeof(func) === "function"){
            this._collide = func;
        }
    }

    get resize_event(){
        return this._resize === null ? function(){return} : this._resize;
    }

    set resize_event(func){
        if(typeof(func) === "function"){
            this._resize = func;
        }
    }
}


console.log("filter.js is called.")

class Filter{
    static cnt = 0;
    static list = [];
    static WORD = {OR:"OR",AND:"AND",DUMMYID:"_dummy_id"};
    static COMPARISION = {
        EQUAL:"equal",NOT_EQUAL:"not_equal",
        BIGGER:"bigger",SMALLER:"smaller",
        EQUAL_BIGGER:"equal_bigger",EQUAL_SMALLER:"equal_smaller",
        BEFORE:"before",AFTER:"after",
        EQUAL_BEFORE:"equal_before",EQUAL_AFTER:"equal_after",
        INCLUDE:"include",NOT_INCLUDE:"not_include",
        CHECK:"check",NOT_CHECK:"not_check",
    };
    static COMPARISION_NAME = {
        EQUAL:"等しい",NOT_EQUAL:"等しくない",
        BIGGER:"大なり",SMALLER:"小なり",
        EQUAL_BIGGER:"以上",EQUAL_SMALLER:"以下",
        BEFORE:"よりも前",AFTER:"よりも後",
        EQUAL_BEFORE:"以前",EQUAL_AFTER:"以後",
        INCLUDE:"含む",NOT_INCLUDE:"含まない",
        CHECK:"チェックされている",NOT_CHECK:"チェックされていない",
    };

    static COMPARISIONLIST = {
        datetime:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"before",name:"以前"},{comparision:"after",name:"以後"}],
        str:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"include",name:"含む"},{comparision:"not_include",name:"含まない"}],
        int:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"equal_bigger",name:"以上"},{comparision:"equal_smaller",name:"以下"}],
        num:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"equal_bigger",name:"以上"},{comparision:"equal_smaller",name:"以下"}],
        check:[{comparision:"check",name:"☑"},{comparision:"not_check",name:"☐"}],
        input:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"include",name:"含む"},{comparision:"not_include",name:"含まない"}],
        select:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"include",name:"含む"},{comparision:"not_include",name:"含まない"}],
    };


    /**
     * 条件に合わせてフィルターを行う
     * condition[or[and]];
     * condition = [
     *      [
     *          {field:"id",value:1,comparision:"==="},
     *          {field:"name",value:"your name",comparision:"in"}
     *      ],
     *      [
     *          {field:"id",value:2,comparision:">"},
     *          {field:"name",value:"him name",comparision:"==="} 
     *      ]
     * ];
     * @param {Array} condition 
     */
    constructor(condition=[],data=null){

        this.condition  = null;
        this.set_condition(condition);

        // 元データリスト
        this.data = null;
        this.diff = null;
        this.set(data);
        // フィルターした結果のリストデータ
        this.result = [];

    }

    set(data){
        delete this.data;
        this.data = data;
        if(data){
            for(let i=0; i<this.data.length; i++){
                this.data[i][Filter.WORD.DUMMYID] = i;
            }
        }
        return this;
    }

    set_condition(condition){
        delete this.condition;
        this.condition = condition;
        return this;
    }

    /**
     * single filter
     * @returns 
     */
    check(list=[],field="",value=null,comparision=Filter.COMPARISION.EQUAL){
        const result = list.filter(function(data){
            let d = data[field];
            //Note:ここがあると重くなるので、本番はコメントアウト
            // console.log(d,field,value,comparision); 
            if(d instanceof Text){
                d = d.textContent;
            }else if(d instanceof HTMLInputElement && d.type === "checkbox"){
                d = d
            }else if(d instanceof HTMLInputElement){
                d = d.value
            }else if(d instanceof HTMLSelectElement){
                d = d.options[d.selectedIndex].text;
            }
            if(d === undefined){ return false;}
            if( Filter.COMPARISION.EQUAL == comparision){
                return d == value;
            }else if(Filter.COMPARISION.NOT_EQUAL == comparision){
                return d != value;
            }else if(Filter.COMPARISION.BIGGER === comparision){
                return parseFloat(d) > parseFloat(value);
            }else if(Filter.COMPARISION.SMALLER === comparision){
                return parseFloat(d) < parseFloat(value);
            }else if(Filter.COMPARISION.EQUAL_BIGGER === comparision){
                return parseFloat(d) >= parseFloat(value);
            }else if(Filter.COMPARISION.EQUAL_SMALLER === comparision){
                return parseFloat(d) <= parseFloat(value);
            }else if(Filter.COMPARISION.BEFORE === comparision){
                return new Date(d) < new Date(value);
            }else if(Filter.COMPARISION.AFTER === comparision){
                return new Date(d) > new Date(value);
            }else if(Filter.COMPARISION.EQUAL_BEFORE === comparision){
                return new Date(d) <= new Date(value);
            }else if(Filter.COMPARISION.EQUAL_AFTER === comparision){
                return new Date(d) >= new Date(value);
            }else if(Filter.COMPARISION.INCLUDE === comparision){
                return d.includes(value);
            }else if(Filter.COMPARISION.NOT_INCLUDE === comparision){
                return !(d.includes(value));
            }else if(Filter.COMPARISION.CHECK === comparision){
                return d.checked == true;
            }else if(Filter.COMPARISION.NOT_CHECK === comparision){
                return d.checked == false;
            }
        });
        return result;
    }

    or(or_condition){
        let result = [];
        for(let con of or_condition){
            result = result.concat(this.and(con));
        }
        return result;
    }

    and(and_condition){
        let result = this.data;
        for(let con of and_condition){
            result = this.check(result, con.field, con.value, con.comparision);
        }
        return result;
    }

    all(){
        if(this.result !== undefined && this.result !== null){
            return this.result;        
        }
        return [];
    }

    one(){
        return this.get(0);
    }

    get(index=0){
        if(this.result !== undefined && this.result !== null && this.result.length>0){
            return this.result[index] === undefined ? null : this.result[index];
        }
        return null;
    }

    map(list=[]){
        return Array.from( new Map( list.map((r) => [r[Filter.WORD.DUMMYID], r]) ).values() );
    }

    take_diff(){
        const self = this;
        return [...this.data].filter(function(d){
            let flag = true;
            for(let r of self.result){
                // console.log(d,r);
                // console.log(JSON.stringify(d) === JSON.stringify(r));
                if(JSON.stringify(d) === JSON.stringify(r)){
                    flag = false;
                }
            }
            return flag;
        });
    }

    build(){
        const result = this.or(this.condition);
        this.result = this.map(result);
        // this.diff = this.take_diff(); // 重くなるのでコメントアウト
        return this;
    }
}

class Sort{
    constructor(condition=[],data=null){
        this.condition = condition;
        this.data = data;
        this.result = [];
    }

    set_condition(condition){
        delete this.condition;
        this.condition = condition;
        return this;
    }

    check(list=[],field="",type="str",desc=-1){
        const result = list.sort(function(a,b){
            let val = null;
            if(type === "str"){
                if(a[field].localeCompare){
                    val = a[field].localeCompare(b[field]) * desc;
                }else{
                    val = a[field].textContent.localeCompare(b[field].textContent) * desc;
                }
            }else if(type === "int" || type === "num"){
                if(a[field].textContent){
                    // val = a[field].localeCompare(b[field]) * desc;
                    val = (parseFloat(a[field].textContent) * desc) - (parseFloat(b[field].textContent) * desc); 
                }else{
                    val = (a[field] * desc) - (b[field] * desc);
                }
            }else if(type === "datetime"){
                if(a[field].textContent){
                    val = new Date(a[field].textContent) > new Date(b[field].textContent) ? desc : -1 * desc;
                }else{
                    val = new Date(a[field]) > new Date(b[field]) ? desc : -1 * desc;
                }
            }else if(type === "check"){
                val = a[field].checked > b[field].checked ? desc : -1 * desc;
            }else if(type === "input" || type === "select"){
                // そのほかの型
                if(a[field].value && b[field].value){
                    val = a[field].value > b[field].value ? desc : -1 * desc;
                }else if(a[field].dataset && b[field].dataset){
                    val = a[field].dataset.value > b[field].dataset.value ? desc : -1 * desc;
                }else{
                    val = a[field].localeCompare(b[field]) * desc;
                }
            }
            return val;
        })

        return result;
    }

    build(){
        if(this.condition){
            const field = this.condition.field;
            const type = this.condition.type;
            const desc = this.condition.desc;
            this.result = this.check(this.data,field,type,desc);
        }
    }
}


class Pagination{
    constructor(condition=[],data=null){
        this.condition = condition;
        this.data = data;
        this.result = [];
    }

    check(perPage=10,dataLength=-1){
        const result = [];
        if(this.data){
            const len = dataLength === -1 ? this.data.length : dataLength;
            let page_data = [];
            for(let i=0; i<len; i++){
                if( i % perPage === 0 && i !== 0){
                    result.push(page_data);
                    page_data = [];
                }
                page_data.push(this.data[i] ?? {});
                
            }
            result.push(page_data)
        }
        return result;
    }

    dummy(perPage=10,dataLength=-1,dummyIndex=0){
        const result = [];
        if(this.data){
            const len = dataLength === -1 ? this.data.length : dataLength;
            let page_data = [];
            for(let i=0; i<len; i++){
                if( i % perPage === 0 && i !== 0){
                    result.push(page_data);
                    page_data = [];
                }
                page_data.push({});
                
            }
            result.push(page_data)
        }
        result[dummyIndex] = this.data;
        return result;
    }

    build(){
        if(this.condition){
            const perPage = this.condition.perPage
            const dataLength = this.condition.dataLength
            const dummyIndex = this.condition.dummyIndex ?? -1;
            // ダミーページネーション
            if(dummyIndex>=0){
                this.result = this.dummy(perPage,dataLength,dummyIndex);
            // リアルページネーション
            }else{
                if(dataLength){
                    this.result = this.check(perPage,dataLength);
                }else{
                    this.result = this.check(perPage);
                }
            }
        }
    }
}

class SideItems extends DOM{
    static list = [];
    static MODE = {LEFT:"left",RIGHT:"right"};
    static CONST = {ZINDEX:2,BORDER:{COLOR:"grey",BOLD:"1px"}};
    static style = null;

    constructor(selector=".body",mode=SideItems.MODE.LEFT){
        super(selector);
        this.mode = mode;
        this.cnt = 0;
        this.items = {};
        this.index = SideItems.CONST.ZINDEX;
        this.borderColor = SideItems.CONST.BORDER.COLOR;
        this._alignItems = "center";
        this._justifyContent = "center";
    }

    get alignItems(){
        return this._alignItems;
    }

    set alignItems(mode){
        this._alignItems = mode;
        if(this.frame){this.frame.style.alignItems = mode;}
    }

    get justifyContent(){
        return this._justifyContent;
    }

    set justifyContent(mode){
        this._justifyContent = mode;
        if(this.frame){this.frame.style.justifyContent = mode;}
    }

    style(){
        return SideItems.style ??  new Style(`
            .${this.cssClassFrame}{
                display:flex;
                flex-direction:column;
                height:100%;
                width: 36px;
                position: relative;
                left: 0px;
                top:  0px;
                // pointer-events:none;
                z-index:${this.zIndex ?? SideItems.CONST.ZINDEX};
                gap:4px;
            }
            .side-item{
                display:flex;
                height:36px;
                width: 36px;
                cursor:pointer;
                overflow:hidden;
                justify-content:center;
                align-items:center;
            }
        `).build();
    }
    
    build(dom){
        super.build();
        SideItems.style = this.style();
        if(dom !== null && dom !== undefined){
            this.main.appendChild(dom);
        }
        const bordersetting = `solid ${SideItems.CONST.BORDER.BOLD} ${SideItems.CONST.BORDER.COLOR}`
        if(this.mode === SideItems.MODE.LEFT){
            this.parent.prepend(this.frame);
            this.frame.style.borderRight = bordersetting;
        }else{
            this.parent.appendChild(this.frame);
            this.frame.style.borderLeft = bordersetting;
        }
        this.frame.style.justifyContent = this.justifyContent;
        this.frame.style.alignItems = this.alignItems;
        this.parent.style.display = "flex";
        this.parent.style.flexDirection = "row";

        return this.frame;
    }

    append(item){
        const btn = DOM.create("div",{class:"side-item"});
        btn.id = `${this.id}-${this.cnt++}`;
        if(typeof(item)==="string"){
            btn.innerHTML = item;
        }else{
            btn.appendChild(item)
        }
        this.frame.appendChild(btn);
        this.items[btn.id] = btn;
        return this;
    }

    delete(item_id){
        this.items[item_id].remove();
        delete this.items[item_id];
    }

    reset(){
        this.cnt = 0;
        this.frame.innerHTML = "";
    }

}

class SideMenu extends DOM {

    static list = [];
    static MODE = {LEFT:"left",RIGHT:"right"};
    static CONST = {TO_RIGHT:"&#9655",TO_LEFT:"&#9665",ZINDEX:2};
    static style = null;

    constructor(selector="body",mode=SideMenu.MODE.LEFT,margin_top=94,margin_bottom=36){
        super(selector);
        this.mode = mode;
        this.margin_top=margin_top;
        this.margin_bottom=margin_bottom;
        this.btn_op = null;
        this.btn_cl = null;
        this.zIndex = SideMenu.CONST.ZINDEX;
        
        SideMenu.list.push(this);
    }

    style(){
        return SideMenu.style ??  new Style(`
            .${this.cssClassFrame}{
                height:calc(100% - ${this.margin_top + this.margin_bottom}px);
                width: 100%;
                position: absolute;
                left: 0px;
                top: ${this.margin_top}px;
                pointer-events:none;
                z-index:${this.zIndex ?? SideMenu.CONST.ZINDEX};
            }

            .sidemenu-contents{
                display:flex;
                width: 50%;
                height: 100%;
                width: 16px;
                text-wrap: nowrap;
                over-flow: hidden;
                transition: width 0.5s, left 0.5s;
                position: absolute;
                left: 0px;
                pointer-events: all;

            }

            .sidemenu-contents.left{
                flex-direction:row-reverse;
            }
            .sidemenu-contents.right{
                flex-direction:row;
                left:calc(100% - 16px)
            }

            .sidemenu-contents.active{
                width: calc(40% + 16px);
            }

            .sidemenu-contents.right.active{
                left: calc(60% - 16px);
            }

            .btnbar{
                background-color: #333333;
                width: 16px;
                height: 100%;
                display:flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            }

            .btnop{
                background-color: #333333;
                cursor: pointer;
                height: 16px;
                width: 16px;
                display:flex;
                justify-content: center;
                align-items: center;
            }

            .btnop.disable{
                display:none;
            }

            .btncl{
                background-color: #333333;
                cursor: pointer;
                height: 16px;
                width: 16px;
                display:flex;
                justify-content: center;
                align-items: center;
            }

            .btncl.disable{
                display:none;
            }

            .contents{
                display:flex;
                flex-direction:column;
                background-color: #222222;
                height: 100%;
                width: calc(100% - 16px);
                overflow-x: hidden;
                
            }
        `).build();
    }


    make(){
        const elm = super.make();
        elm.classList.add("sidemenu-contents");
        elm.classList.add(this.mode);
        const op = this.mode === SideMenu.MODE.LEFT ? SideMenu.CONST.TO_RIGHT : SideMenu.CONST.TO_LEFT;
        const cl = this.mode === SideMenu.MODE.LEFT ? SideMenu.CONST.TO_LEFT  : SideMenu.CONST.TO_RIGHT;
        const btnbar = DOM.create("div",{class:"btnbar"});
        this.btn_op = DOM.create("div",{class:"btnop"});
        this.btn_op.innerHTML = op;
        this.btn_cl = DOM.create("div",{class:"btncl"});
        this.btn_cl.classList.add("disable");
        this.btn_cl.innerHTML = cl;
        btnbar.appendChild(this.btn_op);
        btnbar.appendChild(this.btn_cl);
        this.main = DOM.create("div",{class:"contents"});
        elm.appendChild(btnbar);
        elm.appendChild(this.main);
        this.mode = "close";
        // this.btn_op.addEventListener("click",function(){
        //     self.btn_op.classList.add(disable);
        //     self.btn_cl.classList.remove(disable);
        //     elm.classList.add("active");
        //     mode = "open";
        // });
        // this.btn_cl.addEventListener("click",function(){
        //     self.btn_op.classList.remove(disable);
        //     self.btn_cl.classList.add(disable);
        //     elm.classList.remove("active");
        //     mode = "close";
        // });
        btnbar.addEventListener("click",()=>{
            if(this.mode === "close"){
                this.show();
            }else{
                this.hide();
            }
        });
        this.btnbar = btnbar;

        return elm
    }

    show(){
        const disable = "disable";
        this.btn_op.classList.add(disable);
        this.btn_cl.classList.remove(disable);
        this.contents.classList.add("active");
        this.mode = "open";
        return this;
    }

    hide(){
        const disable = "disable";
        this.btn_op.classList.remove(disable);
        this.btn_cl.classList.add(disable);
        this.contents.classList.remove("active");
        this.mode = "close";
        return this;
    }

    build(dom){
        super.build();
        SideMenu.style = this.style();
        if(dom !== null && dom !== undefined){
            this.main.appendChild(dom);
        }
        return this.frame;
    }
    
    append(dom){
        this.main.appendChild(dom);
    }
}

/**
 * 依存関係 Block,Grid,ContextMenu,ShortCut,Style
 */
class Scheduler{
    static cnt = 0;
    static list = [];
    static style = null;
    static CONST = {
        ERROR:{
            NOT_FOUND:"対象が見つかりませんでした。"
        },
        SUCCESS:{
            OK:"処理に成功しました。"
        },
        RATIO:{
            MARGIN:{
                LABELX:0.5,
                LABELY:0.0
            }
        }
    }

    constructor(selector="body"){
        this.id = Scheduler.cnt++;

        this.ratio = {
            margin_labelX:Scheduler.CONST.RATIO.MARGIN.LABELX,
            margin_labelY:Scheduler.CONST.RATIO.MARGIN.LABELY,
        }

        this.dom = document.querySelector(selector);
        this.dom.addEventListener("click",()=>{
            this.contextmenu.hide();
            this.dom.focus();
        });

        // グリッド描画の初期化(x:1440)
        this.grid = new GridFixLocal(1441,8,192,96,selector,"minute","num");
        console.log("position",`${this.grid.w * this.ratio.margin_labelX}px 0px`);
        this.dom.style.backgroundPosition = `${this.grid.w * this.ratio.margin_labelX}px 0px`;
        this.dom.style.width  = `${this.grid.w * this.grid.x}px`;
        this.dom.style.height = `${this.grid.h * this.grid.y}px`;

        // グリッドのラベルの表示・非表示フラグ
        this.is_labeling = true;

        // 右クリックメニューの初期化
        this.find_event = ()=>{};
        this.contextmenu = new ContextMenu(selector);
        this.contextmenu.zIndex = ContextMenu.CONST.ZINDEX;
        this.contextmenu.append("コピー",()=>{this.copy();});
        this.contextmenu.append("切り取り",()=>{this.cut();});
        this.contextmenu.append("貼り付け",()=>{this.paste();});
        // this.contextmenu.append("行の挿入",()=>{this.insert();});
        this.contextmenu.append("削除",()=>{this.remove();});
        this.contextmenu.append("検索",()=>{this.find();this.find_event();});
        this.contextmenu.append("次の検索結果",()=>{this.findNext(this.target);this.find_event();});
        this.contextmenu.append("前の検索結果",()=>{this.findBack(this.target);this.find_event();});
        this.contextmenu.append("全選択",()=>{this.selectAll();});
        this.contextmenu.append("ラベルの表示・非表示",()=>{this.labeling();});
        this.contextmenu.build();

        // ショートカットの初期化
        this.shortcut = new ShortCut(selector);
        this.shortcut.append("c",()=>{this.copy()});
        this.shortcut.append("x",()=>{this.cut()});
        this.shortcut.append("v",()=>{this.paste()});
        // this.shortcut.append("i",()=>{this.insert()});
        this.shortcut.append("Delete",()=>{this.remove();});
        this.shortcut.append("f",()=>{this.find();this.find_event();});
        this.shortcut.append("p",()=>{this.findNext(this.target);this.find_event();});
        this.shortcut.append("ArrowUp",()=>{this.findNext(this.target);this.find_event();});
        this.shortcut.append("ArrowRight",()=>{this.findNext(this.target);this.find_event();});
        this.shortcut.append("b",()=>{this.findBack(this.target);this.find_event();});
        this.shortcut.append("ArrowDown",()=>{this.findBack(this.target);this.find_event();});
        this.shortcut.append("ArrowLeft",()=>{this.findBack(this.target);this.find_event();});
        this.shortcut.append("a",()=>{this.selectAll()});
        this.shortcut.append("l",()=>{this.labeling()});
        this.shortcut.build();

        // マウスの場所を登録する処理を追加
        this.dom.addEventListener("mousemove",(e)=>{
            if(this.dom === e.target){
                Block.offsetX = e.offsetX;
                Block.offsetY = e.offsetY;
            }
        });

        // 検索モーダルの初期化
        this.find_mdl = new Modal(Modal.SIZE.XSMALL)
            .set_title("検索")
            .set_yes_button(()=>{},"OK")
            .set_no_button (()=>{},"キャンセル");
        this.find_mdl.show_event = ()=>{this.find_mdl.body.querySelector("input").focus()};

        // 確認モーダル
        this.cm = new ConfirmModal(Modal.SIZE.XSMALL);

        // エラーモーダルの初期化
        this.emdl = new ErrorModal();

        // popcard
        this.popcard = new PopCard(selector);

        // 検索関連
        this.target_condition = {};
        this.targets = [];
        this.target = null;

        this.data = [];
        this.page = [];
        this.active_page = 0;
        this.active_data = 0;

        Scheduler.list.push(this);
    }

    style(){
        return Scheduler.style ?? new Style(`
            .grid-labelsX{
                width:${this.grid.width}px;
                margin-left:${parseFloat(this.grid.w) * parseFloat(this.ratio.margin_labelX)}px;
            }
            .grid-labelX{
                width:${this.grid.w}px;
            }
            .grid-labelsY{
                width:12px;
            }
            .grid-labelY{
                width:12px;
            }
        `).build();
    }

    insert(){
        const base = Block.clicked;
        if(base){
            new Promise((resolve)=>{
                const baseX = base.p.x;
                const baseY = base.p.y;
                const blocks = this.page[this.active_data][this.active_page].filter((b)=>b.p.y >= baseY);
                console.log(base,blocks);
                for(let b of blocks){
                    if(parseInt(b.p.y) === parseInt(baseY) && parseInt(b.p.x) === parseInt(baseX)){
                        this.grid.size(b,0,1);
                    }else{
                        this.grid.move(b,0,1);
                    }
                }
                this.make("insert",{x: parseInt(this.dom.parentElement.scrollLeft / this.grid.w) + 1,y:baseY,z:1,w:2,h:1}).draw();
                resolve();
            });
        }
    }

    copy(){
        const blocks = Block.focused;
        for(let b of blocks){
            // クローンを生成して、フォーカスをクローンに移しながらスケジューラへ登録
            const c = b.clone;
            this.append(c);
            b.focused = false;
            c.focused = true;
            this.draw();
            this.grid.move(c,0,1);

        }
        return blocks
    }

    remove(){
        // オブジェクト参照をすべて破棄することで、メモリを解放する
        for(let i=0; i<this.data.length; i++){
            this.data[i] = this.data[i].filter((b)=>b.focused === false);
        }
        for(let i=0; i<this.page.length; i++){
            for(let j=0; j<this.page[i].length; j++){
                this.page[i][j] = this.page[i][j].filter((b)=>b.focused === false);
            }
        }
        this.targets = this.targets.filter((t)=>t.focused === false);
        this.target = null;
        Block.remove();
    }

    cut(){
        Block.cut();
    }

    paste(){
        const pasted = Block.paste();
        for(let p of pasted){
            for(let i=0; i<this.page.length; i++){
                for(let j=0; j<this.page[i].length; j++){
                    this.page[i][j] = this.page[i][j].filter((b)=>b!==p);
                }
            }

            for(let i=0; i<this.data.length; i++){
                this.data[i] = this.data[i].filter((b)=>b!==p);
            }
            this.mapping(p);
        }
        this.draw();
    }

    move(blk,x=1,y=0){
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        // 項目列分１ずらす
        const pageX  = parseInt(x / (this.grid.x-1)) // + this.active_data;
        const pageY  = parseInt(y / this.grid.y) // + this.active_page;
        const pointX = parseInt(x % (this.grid.x-1));
        const pointY = parseInt(y % this.grid.y);

        // this.turn(pageX,pageY);

        this.grid.move(blk,pointX+1,pointY);
        for(let i=0; i<this.page.length; i++){
                for(let j=0; j<this.page[i].length; j++){
                    this.page[i][j] = this.page[i][j].filter((b)=>b!==blk);
                }
        }

        for(let i=0; i<this.data.length; i++){
            this.data[i] = this.data[i].filter((b)=>b!==blk);
            }
        this.mapping(blk);

        // this.turn(base_active_data,base_active_page);
    }

    point(blk,x=1,y=0){
        console.log(x,y);
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        // 項目列分１ずらす
        const pageX  = parseInt(x / (this.grid.x-1)); //+ this.active_data;
        const pageY  = parseInt(y / this.grid.y); //+ this.active_page;
        const pointX = parseInt(x % (this.grid.x-1));
        const pointY = parseInt(y % this.grid.y);

        // this.turn(pageX,pageY);
        this.grid.point(blk,pointX,pointY);
        for(let i=0; i<this.page.length; i++){
            if(!this.data[i]){
                this.page[i] = [];
                this.data[i] = [];
            }
            for(let j=0; j<this.page[i].length; j++){
                this.page[i][j] = this.page[i][j].filter((b)=>b!==blk);
            }
        }

        for(let i=0; i<this.data.length; i++){
            this.data[i] = this.data[i].filter((b)=>b!==blk);
        }
        this.mapping(blk,pageX,pageY);
        // this.turn(base_active_data,base_active_page);
        return blk;
    }

    mapping(b,d=-1,p=-1){
        b.dataindex = d===-1 ? this.active_data: d;
        b.pageindex = p===-1 ? this.active_page: p;
        if(!this.data[b.dataindex]){
            this.data[b.dataindex] = [];
        }
        this.data[b.dataindex].push(b);
        console.log(b.dataindex,[...this.data]);
        if(!this.page[b.dataindex]){
            this.page[b.dataindex] = [];
        }
        if(!this.page[b.dataindex][b.pageindex]){
            this.page[b.dataindex][b.pageindex] = []
        }
        this.page[b.dataindex][b.pageindex].push(b);
        return b;
    }

    find(){
        this.find_mdl.set_body(`<input style="height:36px; width:95%; font-size:12px;" placeholder="検索するキーワード" />`);
        this.targets = [];
        for(let b of Block.list){
            b.focused = false;
        }
        return this.find_mdl.confirm().then(()=>{
            const text = this.find_mdl.body.querySelector("input").value;
            if(text === ""){return null}
            this.target_condition = {text:text};
            let result = Block.find(this.target_condition);
            for(let r of result){
                // if(r.visible === true){
                //     r.focused = true;
                    this.targets.push(r);
                // }
            }
            const t = this.targets[0];
            if(t){
                this.target = t;
                this.scroll(t);
            }
            return t;
        });
    }

    findIndex(b){
        let index = 0;
        for(let i=0; i<scheduler.data.length; i++){
            if(scheduler.data[i].includes(b)){
                index = i;
            }
        }
        return index;
    }

    findNext(b){
        if(b){
            const i = this.targets.findIndex((t)=>t.id == b.id);
            let next = 0;
            if( i + 1 < this.targets.length){
                next = i + 1;
            }
            this.target = this.targets[next];
            this.scroll(this.target);
        }else{
            this.emdl.show(Scheduler.CONST.ERROR.NOT_FOUND);
        }
    }

    findBack(b){
        if(b){
            const i = this.targets.findIndex((t)=>t.id == b.id);
            let next = this.targets.length - 1;
            if( i - 1 >= 0){
                next = i - 1;
            }
            this.target = this.targets[next];
            this.scroll(this.target);
        }else{
            this.emdl.show(Scheduler.CONST.ERROR.NOT_FOUND);
        }
    }

    scroll(t){
        const padding = 64;
        scheduler.active_data = t.dataindex ?? 0;
        scheduler.active_page = t.pageindex ?? 0;
        scheduler.draw();
        if(t){
            t.focused = true;
            this.dom.parentElement.scrollTo({top:t.y - padding,left:t.x - padding,behavior:"smooth"});
            Block.focus();
        }else{
            this.emdl.show(Scheduler.CONST.ERROR.NOT_FOUND);
        }
        this.dom.focus();

    }

    selectAll(){
        if(this.page[this.active_data] && this.page[this.active_data][this.active_page] && this.page[this.active_data][this.active_page].length > 0){
            for(let d of this.page[this.active_data][this.active_page]){
                d.focused = true;
            }
            Block.focus();
        }else{
            this.popcard.show("選択できるデータがありません。");
        }
    }

    get map(){
        const m = this.grid.map;
        const n = [];
        for(let r=0; r<m.length; r++){
            n[r] = [];
            for(let c=0; c<m[r].length; c++){
                n[r][c] = [];
                for(let o=0; o<m[r][c].length; o++){
                    if(m[r][c][o].visible === true){
                        n[r][c].push(m[r][c][o]);
                    }
                }
            }
        }
        return n;
    }

    item(dom,p={x:1,y:1,z:1,w:1,h:1}){
        let b = null;
        if(typeof(dom) === "string"){
            b = this.make(dom,p);
            
        }else{
            b = this.wrap(dom,p);
        }
        b.movableX = false;
        return b;
    }

    append(b){
        this.grid.append(b.id,b);
        this.mapping(b);
        return b;
    }

    appends(block_list){
        for(let b of block_list){
            this.append(b);
        }
        return block_list;
    }

    make(html,p={x:1,y:1,z:1,w:10,h:1}){
        const b = new Block(p.x,p.y,p.z,p.w,p.h).make(html);
        this.append(b);
        return b;
    }

    wrap(selector,p={x:1,y:1,z:1,w:10,h:1}){
        const b = new Block(p.x,p.y,p.z,p.w,p.h).wrap(selector);
        this.append(b);
        return b;
    }

    /** 特定のブロックの前にあるブロックを取得する */
    before(b){
        let target = null;
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        for(let i=base_active_data; i>=0; i--){
            this.turn(i,base_active_page);
            const m = this.map;
            const row = m[b.p.y];
            const befores = i=== base_active_data ? row.slice(1,b.p.x) : row.slice(1);  //item列はのぞくので、０ではなく、１からスタート
            for(let blocks of befores.reverse()){
                if(blocks.length > 1){
                        this.emdl.show("直前のブロックの候補が複数あります。");
                        target =  null;
                        break;
                }else{
                    for(let block of blocks){
                        if ( b !== block){
                            target = block;
                            break;
                        }
                    }
                }

                if(target){
                    break;
                }
            }
            if(target){
                break;
            }
        }
        this.turn(base_active_data,base_active_page);
        return target;
    }

    befores(b){
        let target = null;
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        const tmp = [];
        for(let i=base_active_data; i>=0; i--){
            this.turn(i,base_active_page);
            const m = this.map;
            const row = m[b.p.y];
            const befores = i=== base_active_data ? row.slice(1,b.p.x) : row.slice(1);  //item列はのぞくので、０ではなく、１からスタート
            for(let blocks of befores.reverse()){
                for(let block of blocks){
                    if(b !== block){
                        tmp.push(block);
                    }
                }
            }
        }
        this.turn(base_active_data,base_active_page);
        return [...new Set(tmp)];
    }

    /** 特定のブロックの後ろにあるブロックを取得する */
    after(b){
        let target = null;
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        for(let i=base_active_data; i<30; i++){
            this.turn(i,base_active_page);
            const m = this.map;
            const row = m[b.p.y];
            const afters = i=== base_active_data ? row.slice(b.p.x + b.p.w) : row.slice(1);  //item列はのぞくので、０ではなく、１からスタート

            for(let blocks of afters){
                if(blocks.length > 1){
                        this.emdl.show("直後のブロックの候補が複数あります。");
                        target =  null;
                        break;
                }else{
                    for(let block of blocks){
                        if (b !== block){
                            target = block;
                            break
                        }
                    }
                }

                if(target){
                    break;
                }
            }
            // console.log(i,afters,target);

            if(target){
                break;
            }
        }
        this.turn(base_active_data,base_active_page);
        return target;
    }

    /** 特定のブロックの後ろにあるブロックを取得する */
    afters(b){
        let target = null;
        const base_active_data = this.active_data;
        const base_active_page = this.active_page;
        const tmp = [];
        for(let i=base_active_data; i<30; i++){
            this.turn(i,base_active_page);
            const m = this.map;
            const row = m[b.p.y];
            const afters = i=== base_active_data ? row.slice(b.p.x + b.p.w) : row.slice(1);  //item列はのぞくので、０ではなく、１からスタート
            for(let blocks of afters){
                for(let block of blocks){
                    if(b !== block){
                        tmp.push(block);
                    }
                }
            }
        }
        this.turn(base_active_data,base_active_page);
        return [...new Set(tmp)];
    }



    filterable(){
        this.filter_obj = new Filter();
        return this;
    }

    sortable(){
        this.sort_obj = new Sort();
        return this;
    }

    pagenatable(condition={perPage:this.grid.y,dataLength:this.data[this.active_data].length}){
        const p = new Pagination(condition,this.data[this.active_data]);
        p.build();
        this.page = p.result;
        return this;
    }

    turn_page(index=0){
        this.active_page = index;
        this.draw();
        return this;
    }

    turn_data(index=0){
        this.active_data = index;
        // this.pagenatable({perPage:this.grid.y,dataLength:this.data[this.active_data] ? this.data[this.active_data].length : 0});
        this.draw();
        return this;
    }

    turn(d=0,p=0){
        this.active_data = d;
        this.active_page = p;
        this.draw();
        return this;
    }

    draw(){
        for(let k of Object.keys(this.data)){
            for(let o of this.data[k]){
                o.visible = false;
            }
        }
        for(let i=0; i<this.page.length; i++){
            if(this.page[i]){
                for(let j=0; j<this.page[i].length; j++){
                    for(let o of this.page[i][j]){
                        if(i == this.active_data && j == this.active_page){
                            o.visible = true;
                        }else{
                            o.visible = false;
                        }
                    }
                }
            }
        }
        this.grid.draw();
    }

    labeling(){
        if(this.is_labeling){
            this.grid.label.x.style.display = "none";
            this.grid.label.y.style.display = "none";
            this.is_labeling = false;
        }else{
            this.grid.label.x.style.display = "flex";
            this.grid.label.y.style.display = "flex";
            this.is_labeling = true;
        }
    }

    build(){
        // 表示データの初期化
        this.turn();
        // スタイルの初期化
        Scheduler.style = this.style();
        this.popcard.build();
        this.popcard.title("通知");

        // グリッドのファイナライズ処理を実装
        // this.grid.finalize = ()=>{
        //     setTimeout(()=>{
        //         const items = this.data[this.active_data];
        //         for(let t of items){
        //             if(t.laps.length === 0){
        //                 t.draw();
        //             }
        //         }
        //     },100);
        // }

        return this;
    }

}

class DateTime{

    /**
     * 時間区間の重なりをチェックする関数
     * @param {Date | number} start1 - 最初の区間の開始時刻（Dateオブジェクトまたはタイムスタンプ）
     * @param {Date | number} end1   - 最初の区間の終了時刻
     * @param {Date | number} start2 - 比較する区間の開始時刻
     * @param {Date | number} end2   - 比較する区間の終了時刻
     * @returns {boolean} - 区間が重なっている場合は true
     */
    static isOverlapping(start1, end1, start2, end2) {
        start1 = typeof(start1) === "string" ? new Date(start1) : start1 
        start2 = typeof(start2) === "string" ? new Date(start2) : start2 
        end1 = typeof(end1) === "string" ? new Date(end1) : end1 
        end2 = typeof(end2) === "string" ? new Date(end2) : end2 

        return (start1 < end2 && start2 < end1);
    }

    static zero_pad(num,length){
        return (Array(length).join("0") + num).slice(-length);
    }

    static get baseDate(){
        const d = new Date();
        d.setFullYear(0);
        d.setMonth(1);
        d.setDate(1);
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        return d;
    }

    constructor(date){
        this.base = date ?? DateTime.baseDate;
        this.next = new Date(this.base.getTime());
        this.i = 0;
        this.array = [];
    }

    format(d,f="YYYY/MM/DD HH:mm:ss"){
        let map = {
            YYYY: d.getFullYear(),
            MM: DateTime.zero_pad(d.getMonth() + 1, 2),
            DD: DateTime.zero_pad(d.getDate(), 2),
            HH: DateTime.zero_pad(d.getHours(), 2),
            mm: DateTime.zero_pad(d.getMinutes(), 2),
            ss: DateTime.zero_pad(d.getSeconds(), 2),
        };
        return f.replace(/YYYY|MM|DD|HH|mm|ss/g,(match)=>map[match]);
    }

    toDate(base){
        return this.format(base ?? this.base, "YYYY/MM/DD HH:mm");
    }

    toTime(base){
        return this.format(base ?? this.base, "YYYY/MM/DD HH:mm:ss");
    }

    toNum(base){
        return this.i;
    }

    toHour(base){
        return this.format(base ?? this.base, "DD HH:mm");
    }

    toMinute(base){
        return this.format(base ?? this.base, "HH:mm");
    }

    toSecond(base){
        return this.format(base ?? this.base, "mm:ss");
    }

    list(m=60,mode="date"){
        this.array = [];
        if(mode==="date"){
            for(let i = 0; i < m; i++){
                this.array.push(this.toDate(this.next));
                this.next.setMinutes(this.next.getMinutes() + 1);
            }
        }else if(mode==="time"){
            for(let i = 0; i < m; i++){
                this.array.push(this.toTime(this.next));
                this.next.setSeconds(this.next.getSeconds() + 1);
            }
        }else if(mode==="num"){
            for(let i = 0; i< m; i++){
                this.array.push(i+1);
                // this.array.push(this.toNum(this.next));
                // this.i++;
            }
        }else if(mode==="second"){
            for(let i = 0; i< m; i++){
                this.array.push(this.toSecond(this.next));
                this.next.setSeconds(this.next.getSeconds() + 1);
            }
        }else if(mode==="minute"){
            for(let i = 0; i < m; i++){
                this.array.push(this.toMinute(this.next));
                this.next.setMinutes(this.next.getMinutes() + 1);
            }
        }else if(mode==="hour"){
            for(let i = 0; i < m; i++){
                this.array.push(this.toHour(this.next));
                this.next.setHours(this.next.getHours() + 1);
            }
        }
        return this.array;
    }
}

class DateTimeNow extends DateTime{
    constructor(){
        super(new Date());
    }
}

class TabPage extends GridObject{

    static list = [];
    static CST = {
        NAME_MAX:32,
    }
    static style = null;

    static turn_page(index=0){
        for(let tp of TabPage.list){
            tp.turn_page(index);
        }
    }

    constructor(selector){
        super(selector);
        this.data = {};     //初期データ
        this.pages = {};    //実際の画面DOMデータ
        this.tabs = {};     //タブ切り替えボタン
        this.active_color = "grey";
        this.base_color = "black";
        this.unit = "%";
        this._width = "100";
        this._height = "100";
        this.active_pagename = "";
        this.active_pageindex = 0;
        this.cnt = 0;
        this.css = null;
        this.zIndex = {min:1,max:2};
        TabPage.list.push(this);
    }

    get width(){
        return `${this._width}${this.unit}`;
    }

    set width(w){
        this._width = w;
    }

    get height(){
        return `${this._height}${this.unit}`;
    }

    set height(h){
        this._height = h;
    }

    style(){
        return new Style(`
            .frame-tabpage{
                height:calc(100% - 16px);
                width:calc(100% - 16px);
                padding: 8px;
            }
            .tab-btn{
                display:flex;
                align-items:center;
                background-color: ${this.base_color};
                border:1px solid ${this.base_color};
                padding-left:2px;
                padding-right:2px;
                border-radius:3px 3px 0px 0px;
                font-size:12px;
            }
            .tab-btn.active{
                background-color: ${this.active_color};
                border:1px solid ${this.active_color};
                padding-left:2px;
                padding-right:2px;
            }
            .tab-close{
                display:flex;
                height:10px;
                width:10px;
                font-size:10px;
                justify-content:center;
                align-items:center;
                cursor:pointer;
                border:1px solid #666666;
                border-radius:3px;
                margin-left:4px;
            }
            .tab{
                border: 1px solid ${this.active_color};
                width: calc(${this.width} - 10px);
                height: calc(${this.height} - 10px);
                padding: 4px;
                overflow:auto;
            }
        `);
    }

    turn_page(index=0){
        const pagenames = Object.keys(this.pages);
        let result = null;
        if(typeof(index)==="string"){
            for(let pagename of pagenames){
                if(index === pagename){
                    this.pages[pagename].style.display = "inline-block";
                    result = this.pages[pagename];
                    this.active_pagename = pagename;
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }else{
            for(let i=0; i<pagenames.length; i++){
                const pagename = pagenames[i];
                if(index === i){
                    this.pages[pagename].style.display = "inline-block";
                    result = this.pages[pagename];
                    this.active_pageindex = i;
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }

        this.coloring_strong(index);
        return result;
    }

    /** tab.dataset.idによるページ変更 */
    turn(tabindex=0){
        let result = null;
        const tabs = Object.values(this.tabs);
        const index = tabs.findIndex((t)=>t.dataset.id==tabindex);
        result = this.turn_page(index);
        return result;
    }

    coloring_strong(tabindex=0){
        console.log(tabindex);
        const tabs = Object.values(this.tabs)
        for(let t of tabs){
            t.classList.remove("active");
        }
        if(tabs[tabindex]){
            tabs[tabindex].classList.add("active");
        }
    }

    append(pagename,val,index=-1){
        if(index === -1){
            index = Object.keys(this.data).length;
        }

        let id = `${this.id}-${this.cnt++}`;
        if(this.data[id]){
            
        }else{
            this.data[id] = val;
        }
        const tab_btn = DOM.create("div",{class:"tab-btn"});
        tab_btn.textContent = pagename.slice(0,TabPage.CST.NAME_MAX);
        tab_btn.dataset.id = id;
        tab_btn.addEventListener("click",()=>{
            this.turn(tab_btn.dataset.id);
            // this.turn_page(pagename);
        });
        const tab_close = DOM.create("span",{class:"tab-close"});
        tab_close.textContent = "×";
        tab_close.addEventListener("click",(e)=>{
            e.stopPropagation();
            this.remove(tab_btn.dataset.id);
        });
        tab_btn.appendChild(tab_close);

        this.tabs[id] = tab_btn;
        const tab = document.createElement("div");
        const content = this.data[id];
        if(typeof(content) === "string"){
            tab.innerHTML = content;
        }else{
            tab.appendChild(content);
        }
        tab.style.display = "none";
        tab.id = `tab${this.id}-${index}`;
        tab.dataset.index = index;
        tab.classList.add(`tab`);
        this.pages[id] = tab;
        this.tab_frame.appendChild(tab_btn);
        this.main_frame.appendChild(tab);

        return tab;
    }

    remove_page(name){
        if(this.data[name] === undefined || this.data[name] === null){return;}
        if(typeof(this.data[name])!=="string"){
            this.data[name].remove();
        }
        this.pages[name].remove();
        this.tabs[name].remove();
        delete this.data[name];
        delete this.pages[name];
        delete this.tabs[name];
        this.turn_page(this.active_pageindex > 0 ? --this.active_pageindex : 0);
    }

    remove(tabindex=0){
        let result = null;
        const tabs = Object.values(this.tabs);
        const keys = Object.keys(this.tabs);
        const index = tabs.findIndex((t)=>t.dataset.id==tabindex);
        result = this.remove_page(keys[index]);
        return result;
    }

    make(){
        const elm = super.make();
        const tab_frame = document.createElement("div");
        // tab_frame.style.height = "24px";
        tab_frame.style.width = "100%";
        // tab_frame.style.overflow = "hidden";
        tab_frame.style.display = "flex";
        tab_frame.style.justifyContent = "start";
        tab_frame.style.flexFlow = "row wrap";
        const main_frame = document.createElement("div");
        main_frame.style.height = "100%";
        main_frame.style.height = "calc(100% - 24px)"; //タブが増えて折り返した場合はオーバーフロー
        elm.appendChild(tab_frame);
        elm.appendChild(main_frame);
        elm.style.display = "flex";
        elm.style.flexDirection = "column";
        elm.style.height = "100%";
        this.tab_frame = tab_frame;
        this.main_frame = main_frame;

        const pagenames = Object.keys(this.data);
        let p = 0;
        for(let pagename of pagenames){
            this.append(pagename,this.data[pagename],p++);
        }
        return elm;
    }

    build(){
        super.build();
        this.css = this.style();
        this.css.build();
    }
}

class ContextMenu extends DOM{

    static WIDTH = 120;
    static HEIGHT = 24;
    static CONST = {ZINDEX:2};
    static style = null;

    static{
        document.addEventListener("click",(e)=>{
            for(let cm of this.list){
                cm.hide(e);
            }
        });
        // document.addEventListener("contextmenu",(e)=>{
        //     for(let cm of this.list){
        //         cm.hide(e);
        //     }
        // });
    }

    constructor(selector="body"){

        super(selector);
        this.is_active = false;
        this.zIndex = {min:ContextMenu.CONST.ZINDEX, max:ContextMenu.CONST.ZINDEX};
        this.color = "white";
        this.backgroundColor = "black";
        this.list = [];
        this.index();

    }

    get left(){
        return this.contents.style.left;
    }

    get top(){
        return this.contents.style.top;
    }

    get width(){
        return this.contents.clientWidth;
    }

    get height(){
        return this.contents.clientHeight;
    }

    get title(){
        return this.menu_title ? this.menu_title.textContent : "";
    }

    set title(t=""){
        this.menu_title.textContent = t;
    }

    get w(){
        return ContextMenu.WIDTH;
    }

    set w(width){
        this.contents.style.width = `${width}px`;
    }

    get h(){
        return (this.list.length + 1) * ContextMenu.HEIGHT;
    }

    set h(height){
        this.contents.style.height = `${height}px`;
    }

    get x(){
        return this.contents.style.left;
    }

    set x(left){
        this.contents.style.left = `${left}px`;
    }

    get y(){
        return this.contents.style.top;
    }

    set y(top){
        this.contents.style.top = `${top}px`;
    }

    get ratioH(){
        return this.resizeH / this.baseH;
    }

    get ratioW(){
        return this.resizeW / this.baseW;
    }

    isTop(y){
        return y <= window.innerHeight / 2
    }

    isBottom(y){
        return y > window.innerHeight / 2
    }

    isLeft(x){
        return x <= window.innerWidth / 2;
    }

    isRight(x){
        return x > window.innerWidth / 2;
    }

    style(){
        return ContextMenu.style ?? new Style(`
            .frame-${this.type()}{
                position: fixed;
                display: none;
                /* ここのZINDEXの調整は、実装によって調整すべき */
                z-index: ${this.zIndex.min ?? ContextMenu.CONST.ZINDEX}; 
            }
            .frame-${this.type()}.active{
                display: block;
            }
            .contextmenu-list{
                padding: 4px;
                background-color: ${this.backgroundColor};
                color: ${this.color};
                border-bottom: 1px solid grey;
                min-width: ${ContextMenu.WIDTH}px;
            }
            .contextmenu-list:hover{
                background-color: grey;
            }
        `).build();
    }

    append(name,func=()=>{console.log("clicked.");}){
        this.list.push({
            "name":name,
            "func":func,
        });
        this.set_menu();
        return this;
    }

    remove(name){
        this.list = this.list.filter((l)=> l.name !== name );
        return this;
    }


    make(){
        const elm =  super.make();
        return elm;
    }

    set_menu(){
        if(this.contents){
            this.contents.innerHTML = "";
            for(let m of this.list){
                const div = DOM.create("div",{class:"contextmenu-list"});
                div.addEventListener("click",(e)=>{
                    m.func(e);
                    this.hide(e);
                });
                div.textContent = m.name;
                this.contents.appendChild(div);
            }
        }
        return this;
    }

    reset(){
        const x = this.list.length;
        for(let i=x; i>0; i--){
            m = this.list[i];
            this.remove(m);
        }
    }

    event(){
        this.parent.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            e.stopPropagation();
            // console.log(e.target,e.pageX,e.pageY);
            this.show(this.autoX(e.pageX),this.autoY(e.pageY));
        });
    }

    autoX(x){
        return x;
    }

    autoY(y){
        return y;
    }

    show(x=0,y=0){
        this.is_active = true;
        this.frame.classList.add("active");
        // this.frame.style.display = "inline-block";
        // this.contents.style.display = "inline-block";
        const p = this.contents.getClientRects()[0];
        const ph = p.height;
        const pw = p.width;
        console.log(this.isTop(y),this.isLeft(x),p);
        if(this.isTop(y) === true){
            this.y = y;
        }else{
            this.y = y - ph;
        }
        if(this.isLeft(x) === true){
            this.x = x;
        }else{
            this.x = x - pw;
        }

        this.contents.style.position = "fixed";
        this.contents.style.left = `${this.x}px`;
        this.contents.style.top = `${this.y}px`;
        this.contents.style.zIndex = this.zIndex;
        this.contents.style.border = `1px solid grey`;
        this.contents.style.borderRadius = `3px`;
    }

    hide(e){
        this.is_active = false;
        this.frame.classList.remove("active");
    }

    build(){
        super.build();
        ContextMenu.style = this.style();
        this.event();
        this.set_menu();
        return this;
    }
}


/**
 * Ctrl キー入力
 */
class ShortCut extends DOM{

    constructor(selector){
        super(selector);
        this.is_active = true;
        this.funcs = {};
        this.id = this.index();
    }

    get keys(){
        return Object.keys(this.funcs);
    }

    activate(){
        this.is_active = true;
    }

    deactivate(){
        this.is_active = false;
    }

    /**
     * 
     * @param {String} key 小文字アルファベット 
     * @param {Function} func ショートカットキー入力によって発火する関数
     * @returns 
     */
    append(key,func){
        if(typeof(func) === "function"){
            this.funcs[key] = func;
        }
        return this;
    }

    remove(key){
        if(this.keys.includes(this.keys)){
            delete this.funcs[key];
        }
        return this;
    }

    build(){
        super.build();
        // ショートカットキーの初期化
        this.parent.setAttribute("tabindex",this.id);
        this.parent.addEventListener("keydown",(e)=>{
            if(this.is_active){
                this.keydown(e);
            }
        });
        return this;
    }

    keydown(e){
        if( e.ctrlKey && this.keys.includes(e.key)){
            e.preventDefault();
            this.funcs[e.key](e);
        }else if(e.key === "Delete"){
            e.preventDefault();
            this.funcs[e.key](e);
        }
    }
}

/**
 * Ctrl + Shiftのキー入力
 */
class ShortCutShift extends ShortCut{

    constructor(selector){
        super(selector);
    }

    append(key,func){
        return super.append(key.toUpperCase(),func);
    }

    keydown(e){
        if(e.shiftKey){
            super.keydown(e);
        }
    }
}


/**
 * Ctrl + Shiftのキー入力
 */
class ShortCutAlt extends ShortCut{

    constructor(selector){
        super(selector);
    }

    keydown(e){
        if( this.keys.includes(e.key) && e.altKey){
            console.log(e.key, e.altKey);
            this.funcs[e.key](e);
            e.preventDefault();
        }
    }
}

class PopCard extends DOM{
    static style = null;

    constructor(selector="body"){
        super(selector);
        this.top = 24;
        this.height = 64;
        this.width  = 240;

        this.head = null;
        this.body = null;
        this.foot = null;
        this._title = null;
        this._close_btn = null;
        this.timeout = 3000;
        this.active = false;
        this.zIndex = 10;
        this.index();
        this._click = null;
        this._contextmenu = null;
    }

    click(func){
        if(typeof(func)==="function"){
            this._click = func;
        }
        return this;
    }

    make(){
        const elm = DOM.create("div",{class:"popcard"});
        this.head = DOM.create("div",{class:"popcard-head"});
        this.body = DOM.create("div",{class:"popcard-body"});
        this.foot = DOM.create("div",{class:"popcard-foot"});

        this._title     = DOM.create("span",{class:"popcard-title"});
        this._title.textContent = "title";
        this._close_btn = DOM.create("span",{class:"popcard-close"});
        this._close_btn.textContent = "×";
        this._close_btn.addEventListener("click",()=>{
            this.hide();
        })
        this.head.appendChild(this._title);
        this.head.appendChild(this._close_btn);
        
        this.body.addEventListener("click",()=>{
            if(typeof(this._click) === "function"){this._click();}
            this.hide();
        });

        elm.appendChild(this.head);
        elm.appendChild(this.body);
        elm.appendChild(this.foot);
        
        return elm;
    }

    style(){
        return PopCard.style ?? new Style(`
            .frame-${this.type()}{
                position:fixed;
                width:${this.width}px;
                height:${this.height}px;
                border: 1px solid grey;
                border-radius: 3px;
                color:white;
                background-color:black;
                left: 100vw;
                top:  ${this.top}px;
                z-index:${this.zIndex};
                transition: left 0.5s;
            }
            .frame-${this.type()}.active{
                /* 100% - 240body -2border -16px */
                left: calc(100vw - 258px);
            }
            .popcard-head{
                display:flex;
                justify-content:space-between;
                height:24px;
                background-color:#333333;
            }
            .popcard-body{
                display:block;
                height:36px;
                cursor:pointer;
                padding-left:8px;
            }
            .popcard-foot{
                display:block;
                width: 0px;
                height:4px;
                background-color:white;
                transition: width ${this.timeout / 1000}s;
            }
            .popcard-foot.active{
                width: ${this.width}px;
            }
            .popcard-title{
                padding-left:4px;
            }
            .popcard-close{
                cursor:pointer;
            }
        `).build();
    }

    build(){
        super.build();
        // 非表示で初期化
        this.hide();
        this.style();
        return this;
    }

    show(t=""){
        this.active = true;
        if(t!==""){this.message(t)}
        const count = PopCard.list.filter((p)=>p.active===true).length;
        this.frame.style.top = `${this.top + ((this.height + 12 ) * count)}px`;
        this.frame.classList.add("active");
        this.foot.classList.add("active");
        this.stack = setTimeout(()=>{this.hide()},this.timeout);
        return this;
    }

    hide(){
        this.frame.classList.remove("active");
        this.foot.classList.remove("active");
        this.active = false;
        clearTimeout(this.stack);
        this.stack = null;
        return this;
    }

    message(t="message"){
        this.body.innerHTML = t;
        return this;
    }

    title(t="title"){
        this._title.innerHTML = t;
        return this;
    }

}

class DataEditor extends DOM{
    static parse_jp = {string:"文字列",number:"数値",boolean:"真偽値",object:"参照型",array:"配列",any:"型不明"}

    static type_jp(val){
        let result = "";
        if(typeof(val) === "string" ){
            result = DataEditor.parse_jp[typeof(val)];
        }else if(typeof(val) === "number"){
            result = DataEditor.parse_jp[typeof(val)];
        }else if(typeof(val) === "boolean"){
            result = DataEditor.parse_jp[typeof(val)];
        }else if(val === null){
            result = DataEditor.parse_jp.any;
        }else if(Array.isArray(val)){
            result = DataEditor.parse_jp["array"];
        }else if(typeof(val) === "object"){
            result = DataEditor.parse_jp["object"];
        }
        return result;
    }

    constructor(selector="body",data=null,comments=null){
        super(selector);
        this._data = data;
        this._comments = comments;
        this.result = null;
        this.radioCnt = 0;
        this.is_enable_changekeys = false;
        this.index();
    }

    get data(){
        return this._data;
    }

    set data(d){
        this._data = typeof(d)==="string" ? JSON.parse(d) : d;
    }

    get comments(){
        return this._comments;
    }

    set comments(d){
        this._comments = typeof(d)==="string" ? JSON.parse(d) : d;
    }

    stringify(){
        return JSON.stringify(this.data);
    }

    style(){
        return new Style(`
            /* DataEditorのCSS */
            .frame-${this.type()}{
                border:1px solid grey;
            }
            .frame-${this.type()} input{
                width: calc(100% - 6px);
            }
            .frame-${this.type()} textarea{
                width: calc(100% - 6px);
            }
            .frame-${this.type()} input[type=radio]{
                width: 48px;
            }
            .frame-${this.type()} label{
                display:flex;
            }
            .jef-array{
                padding:2px;
            }
            .jef-object{
                padding:2px;
            }
            .jef-item{
                display:flex;
                flex-direction:row;
            }
            .jef-key{
                padding:2px;
                width:90px;
                over-flowx:auto;
            }
            .jef-cnt{
                padding:2px;
                width:16px;
            }
            .jef-typ{
                padding:2px;
                width:60px;
            }
            .jef-val{
                padding:2px;
                width: calc(80% - 158px);
            }
            .jef-bool{
                padding:2px;
                display:flex;
                font-size:12px;
            }
            .jef-come{
                padding:2px;
                width: 20%;
            }
            .jef-header{
                display:flex;
                border: 1px solid grey;
            }
            .jef-head-cnt{
                padding:2px;
                width:16px;
            }
            .jef-head-key{
                padding:2px;
                width:90px;
            }
            .jef-head-typ{
                padding:2px;
                width: 60px;
            }

            .jef-head-val{
                padding:2px;
                width: calc(80% - 158px);

            }
            .jef-head-come{
                padding:2px;
                width: 20%;
            }
            
        `);
    }

    remove(){
        super.remove();
        this.frame.remove();
    }

    make(){
        const elm = super.make();
        return elm;
    }

    search_form_by_key(key="key",contents=null){
        if(contents===null){
            contents = this.contents;
        }
        const items = contents.querySelectorAll(":scope > .jef-object > .jef-item");
        // console.log("items",items);
        for(let item of items){
            const k = item.querySelector(":scope > .jef-key");
            // console.log(k,k.textContent,key,k.textContent === key);
            if(k && k.textContent === key){
                return item;
            }
        }
        return null;
    }

    search_comment_by_key(key="key",contents=null){
        const item = this.search_form_by_key(key,contents);
        if(item){
            return item.querySelector(":scope > .jef-come");
        }
        return null;
    }

    search_form_by_index(index=0,contents=null){
        if(contents===null){
            contents = this.contents;
        }
        const items = contents.querySelectorAll(":scope > .jef-object > .jef-item");
        if(items && items.length > index){
            return items[index];
        }
        return null;
    }

    search_comment_by_index(index=0,contents=null){
        const item = this.search_form_by_index(index,contents);
        if(item){
            return item.querySelector(":scope > .jef-come");
        }
        return null;
    }

    form(frame=null,part=null,func=function(d){console.log(d)}){
        if(part === null || part === undefined){ return; }
        if(frame === null || frame === undefined){ return; }
        let val = part;
        if(typeof(val) === "string"){
            const elmdom = this.form_str(val);
            elmdom.dataset.type = "jef-str";
            frame.appendChild(elmdom);
        }else if(typeof(val) === "number"){
            const elmdom = this.form_num(val);
            elmdom.dataset.type = "jef-num";
            frame.appendChild(elmdom);
        }else if(typeof(val) === "boolean"){
            const elmdom = this.form_bool(val);
            elmdom.dataset.type = "jef-bool";
            frame.appendChild(elmdom);
        }else if(Array.isArray(val)){
            const elmdom = DOM.create("div",{class:"jef-array"})
            elmdom.dataset.type = "jef-array";
            frame.appendChild(elmdom);
            for(let elm of val){
                this.form(elmdom,elm);
            }
        }else if(typeof(val) === "object"){
            const obj = DOM.create("div",{class:"jef-object"});
            obj.dataset.type = "jef-object";
            const header = DOM.create("div",{class:"jef-header"});
            const headcnt = DOM.create("div",{class:"jef-head-cnt"});
            headcnt.textContent = "";
            const headkey = DOM.create("div",{class:"jef-head-key"});
            headkey.textContent = "パラメータ";
            const headtyp = DOM.create("div",{class:"jef-head-typ"});
            headtyp.textContent = "型";
            const headval = DOM.create("div",{class:"jef-head-val"});
            headval.textContent = "値";
            const headcome = DOM.create("div",{class:"jef-head-come"});
            headcome.textContent = "パラメータ説明";
            header.appendChild(headcnt);
            header.appendChild(headkey);
            header.appendChild(headtyp);
            header.appendChild(headval);
            header.appendChild(headcome);
            obj.appendChild(header);
            frame.appendChild(obj);
            let i = 1;
            for(let key of Object.keys(val)){
                const objitem = DOM.create("div",{class:"jef-item"});
                const objcnt = DOM.create("div",{class:"jef-cnt"});
                objcnt.textContent = i++;
                const objkey = DOM.create("div",{class:"jef-key"});
                objkey.appendChild(document.createTextNode(key));
                const objtyp = DOM.create("div",{class:"jef-typ"});
                objtyp.appendChild(document.createTextNode(DataEditor.type_jp(val[key])));
                const objval = DOM.create("div",{class:"jef-val"});
                const objcome = DOM.create("div",{class:"jef-come"});
                objitem.appendChild(objcnt);
                objitem.appendChild(objkey);
                objitem.appendChild(objtyp);
                objitem.appendChild(objval);
                objitem.appendChild(objcome);
                obj.appendChild(objitem);
                this.form(objval,val[key]);
            }
        }
        return val;
    }

    form_comment(frame=null,part=null){
        if(part === null || part === undefined){ return; }
        if(frame === null || frame === undefined){ return; }

        if(Array.isArray(part)){
            for(let p of part){
                for(let key of Object.keys(p)){
                    let val = p[key];
                    // console.log(key,val);
                    const item = this.search_form_by_key(key,frame.querySelector(":scope > .jef-array"));
                    if(item){
                        const come = this.search_comment_by_key(key,frame.querySelector(":scope > .jef-array"));
                        if(come){
                            if(val && typeof(val) === "object"){
                                come.textContent = val.comment;
                                this.form_comment(item.querySelector(":scope > .jef-val"),val.dict);
                            }else{
                                come.textContent = val;
                            }
                        }
                    }
                }
            }

        }else if(typeof(part) === "object"){
            for(let key of Object.keys(part)){
                const val = part[key];
                const item = this.search_form_by_key(key,frame);
                // console.log(key,val, item);
                if(item){
                    const come = this.search_comment_by_key(key,frame);
                    if(come){
                        if(val && typeof(val) === "object"){
                            come.textContent = val.comment;
                            this.form_comment(item.querySelector(":scope > .jef-val"),val.dict);
                        }else{
                            come.textContent = val;
                        }
                    }
                }
            }
        }
    }

    form_str(val=""){
        const textarea = document.createElement("textarea");
        textarea.value = val;
        const form = document.createElement("div");
        form.appendChild(textarea);
        return form;
    }

    form_num(val=0){
        const input = document.createElement("input");
        input.type = "number";
        input.value = val;
        const form = document.createElement("div");
        form.appendChild(input);
        return form;
    }

    form_bool(val){
        const input_t = document.createElement("input");
        input_t.type = "radio";
        input_t.name = `fbr${this.id}-${this.radioCnt}`;
        const label_t = document.createElement("label");
        label_t.appendChild(input_t);
        label_t.appendChild(document.createTextNode("True"));
        const input_f = document.createElement("input");
        input_f.type = "radio";
        input_f.name = `fbr${this.id}-${this.radioCnt}`;
        const label_f = document.createElement("label");
        label_f.appendChild(input_f);
        label_f.appendChild(document.createTextNode("False"));
        if(val === true){
            input_t.checked = true;
        }else{
            input_f.checked = true;
        }
        const form_b = DOM.create("div",{class:"jef-bool"});
        form_b.appendChild(label_t);
        form_b.appendChild(label_f);
        this.radioCnt++;
        return form_b;
    }

    /**
     *  
     * @param {Node} part 
     * @returns 
     */
    form_analize(part=null){
        if(part === null){ part = this.contents.firstElementChild }
        let tmp = null
        // datasetを全て親要素にするように統一すれば、再帰探索可能
        if(part.dataset.type==="jef-str"){
            tmp = part.querySelector("textarea").value;
        }else if(part.dataset.type==="jef-num"){
            const v = part.querySelector("input").value;
            tmp = v == "" ? 0 : v;
            tmp = JSON.parse(tmp);
        }else if(part.dataset.type==="jef-bool"){
            tmp = JSON.parse(part.querySelector("input:checked").parentElement.textContent.toLowerCase());
        }else if(part.dataset.type==="jef-array"){
            const item = part.childNodes;
            tmp = [];
            for(let x of item){
                // console.log(x);
                tmp.push(this.form_analize(x));
            }
        }else if(part.dataset.type==="jef-object"){
            const item = part.childNodes;
            tmp = {};
            for(let x of item){
                // console.log(x.querySelector(":scope > .jef-val"));
                const k = x.querySelector(":scope > .jef-key");
                const typ = x.querySelector(":scope > .jef-typ");
                if(typ && typ.textContent === DataEditor.parse_jp.any){
                    tmp[k.textContent]=null;
                }else if(k){
                    tmp[k.textContent]=this.form_analize(x.querySelector(":scope > .jef-val").firstElementChild);
                }
            }
        }

        return tmp;
    }

    enable_changekeys(flag=true){
        this.is_enable_changekeys = flag;
        const keys = this.contents.querySelectorAll(".jef-key");
        console.log(keys);
        for(let k of keys){
            k.contentEditable = flag;
        }

        return flag;
    }

    build(){
        const div = super.build();
        this.style().build();
        try{
            this.form(this.contents,this.data);
            this.form_comment(this.contents,this.comments);
        }catch(e){
            console.error(e);
        }
        return this.frame;
    }

    draw(){
        this.contents.innerHTML = "";
        this.form();
    }

}

class OrderDOM{

    constructor(selector){
        this.selector = selector;
        this.dom_list = [];
        this.active_dom = null;
        this.event = null;
        this.update();
        this.style().build();
        
    }

    style(){
        return new Style(`
            .order-dom{
                display:flex;
                flex-direction:row;
                align-items: center;
                gap:8px;
                padding-left:8px;
            }
            .order-dom.group{
                border-left: 4px solid white;
                padding-left:4px;
                background-color:#111111;
            }
            .order-dom.group.child{
                border-left: 2px solid white;
                padding-left: 6px;
                background-color:#444444;
            }
            .order-btn{
                display:flex;
                flex-direction: column;
            }
            .up-btn{
                cursor:pointer;
            }
            .down-btn{
                cursor:pointer;
            }

        `);
    }

    up(index){
        if(index > 0){
            const id1 = index;
            const id2 = --index;
            this.swap(id1,id2);
            // this.ungroup(id1,id2);
            this.reset_style();
        }
    }

    down(index){
        if(index < this.dom_list.length){
            const id1 = index;
            const id2 = ++index;
            this.swap(id1,id2);
            // this.ungroup(id1,id2);
            this.reset_style();
        }
    }

    update(){
        this.dom_list = document.querySelectorAll(this.selector);
        let cnt = -1;
        let startGroup = false;
        for(let i=0; i<this.dom_list.length; i++){
            let dom = this.dom_list[i];
            if(dom.dataset.orderid){
                dom.dataset.orderid = i;
            }else{
                const order_dom = DOM.create("div",{class:"order-dom"});
                order_dom.addEventListener("mousedown",()=>{
                    this.active_dom = dom;
                });
                dom.parentNode.insertBefore(order_dom,dom);
                const order_btn = DOM.create("span",{class:"order-btn"});
                const up_btn = DOM.create("span",{class:"up-btn"});
                up_btn.textContent = "▲";
                up_btn.addEventListener("click",()=>{
                    this.up(this.active_dom.dataset.orderid);
                    if(typeof(this.event)==="function"){
                        this.event();
                    }
                });
                const down_btn = DOM.create("span",{class:"down-btn"});
                down_btn.textContent = "▼";
                down_btn.addEventListener("click",()=>{
                    this.down(this.active_dom.dataset.orderid);
                    if(typeof(this.event)==="function"){
                        this.event();
                    }
                });

                order_btn.appendChild(up_btn);
                order_btn.appendChild(down_btn);
                order_dom.appendChild(order_btn);
                order_dom.appendChild(dom);
                dom.dataset.orderid = i;
            }

            // Note:親子関係を実装する場合は別途ロジックが必要
            // // EX groupへ切り替わりを監視し、インクリメントする処理を追加する
            // // EX お互いの親と子の紐づけ関係を保持しなければならない。（２つ以上の親子セットがある場合）
            // if(dom.parentNode.classList.contains("group") && dom.parentNode.classList.contains("child")){
            //     dom.dataset.order = cnt;
            // }else{
            //     dom.dataset.order = ++cnt;
            // }
            
        }
        return this.dom_list;
    }

    swap(id1,id2){
        console.log(id1,id2);
        try{
        const elem1 = this.dom_list[id1].parentNode;
        const elem2 = this.dom_list[id2].parentNode;
        if(elem1 && elem2 && elem1.parentNode){
            const parent = elem1.parentNode;
            const nextsibling = elem1.nextSibling;
            if(nextsibling === elem2){
                parent.insertBefore(elem2, elem1);
            }else{
                parent.insertBefore(elem1, elem2);
                parent.insertBefore(elem2, nextsibling);
            }
        }
        }catch(e){
            // Note:並べ替え失敗の時の対処（たぶん無視でよい）
            // console.error(e);
            console.log("入れ替えに失敗しました。");
        }
        this.update();
    }

    group(id1,id2){
        const elem1 = this.dom_list[id1].parentNode;
        elem1.classList.add("group");
        const elem2 = this.dom_list[id2].parentNode;
        elem2.classList.add("group");
        elem2.classList.add("child");
        this.update();
        // this.dom_list[id2].dataset.orderid = this.dom_list[id1].dataset.orderid;
    }
    ungroup(id1,id2){
        const elem1 = this.dom_list[id1].parentNode;
        elem1.classList.remove("group");
        elem1.classList.remove("child");
        const elem2 = this.dom_list[id2].parentNode;
        elem2.classList.remove("group");
        elem2.classList.remove("child");
        this.update();
    }
    reset_style(){
        for(let dom of this.dom_list){
            dom.parentNode.classList.remove("group");
            dom.parentNode.classList.remove("child");
        }
    }

}

class FileDrop extends DOM{

    constructor(selector="body"){
        super(selector);
        this.post_url = "";
        this.files = {};
        this.file_id_list = {};
        this.backup = {};
        this.backup_file_id_list = {};
        this.diff = {};
        this.diff_file_id_list = {};
        this.current_dirpath = "";
        this.cm = new ConfirmModal().set_yes_button(()=>{},"適用");
        this.dmdl = new Modal().set_no_button(()=>{},"閉じる");
        this.data = null;
        this.previewfile = null;
        this.visible = true;
        this.tree_area = null;
        this.folderdrop_input = null;
        this.filedrop_input = null;
        this.filepick = null;
        this.folderpick = null;
        this.load_event = null; //ファイルが選択された場合のコールバック関数
    }

    get length(){
        return Object.keys(this.files).length;
    }

    style(){
        return new Style(`
            .frame-${this.type()}{
                height: 100%;
            }
            .frame-${this.type()}.hidden{
                display:none;
            }
            .filedrop-area{
            
            }
            .filedrop-view{

            }
            .folderdrop-view{

            }
            .filedrop-input{
                display:none;
            }
            .folderdrop-input{
                display:none;
            }
            .file-record{
                
            }
            .current-record{
                display: flex;
                align-items: center;
                padding: 4px;
            }
            .dirpath{
                border:1px solid white;
            }
            .filename{
                border:1px solid white;
            }
            .filedrop{
                background-color: black;
                color: white;
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                overflow: auto;            
            }
            .filedrop.active{
                background-color: grey;
            }
            .file-tool{
                display:flex;
            }
            .dir-name{
                cursor:pointer;
                padding:4px;
            }
            .file-name{
                cursor:pointer;
                padding:4px;
            }
            .tree-area{
                height:100%;
                overflow-y:auto;
            }
            .fd-icon{
                width:16px;
                height:16px;
            }
            .fd-treeup{
                display:inline-block;
                cursor:pointer;
            }
            .fd-create{
                display:inline-block;
                cursor:pointer;
            }
            .fd-detail{
                cursor:pointer;
            }
            .fd-delete{
                cursor:pointer;
            }
            .fd-update{
                cursor:pointer;
            }
            .fd-preview{
                overflow:auto;
            }
        `);
    }

    post(url,func){
        // サーバへファイルを送信
        const rj = new RequestJSON().set_url_post(url);
        // 受信時の処理
        rj.set_func((data)=>{
            console.log("send OK");
            if(typeof(func)==="function"){
                func(data);
            }
        });
        const fd = new FormData();
        for(let file_path of Object.keys(this.files)){
            fd.append(file_path,this.files[file_path]);
        }
        rj.post_file(fd);
    }

    // get(url,filepath="filename"){
    //     // サーバからファイルを取得
    //     let file = null;
    //     fetch(url) //"/user/download"
    //     .then(response => response.blob())
    //     .then(blob=>{
    //         file = new File([blob], this.filename(filepath), {type:blob.type});
    //         this.files[filepath] = file
    //         console.log(file);
    //         new Promise((resolve)=>{
    //             const reader = new FileReader();
    //             reader.onload = () => resolve(f);
    //             return //reader.readAsText(file);
    //         });
    //     });
    // }

    /**
     * ファイルのゲッター
     * @param {Array} url_list  {file_path:url}で定義された辞書の配列
     * @param {String} sepa     サーバサイドが扱ているファイルパスのセパレータ 
     */
    // async get(url_list={file_path:"url"},sepa="\\"){
    //     const paths = Object.keys(this.files).filter(path=>this.files[path] === null);
    //     await Promise.all(paths.map(path =>{
    //         fetch(url_list[path])
    //         .then(res => res.blob())
    //         .then(blob => new File([blob],this.filename(path,sepa),{type:blob.type}))
    //         .then(f => {this.files[path] = f})
    //     }));
    // }

    get(url_list={file_path:"url"},sepa="\\"){
        console.log(url_list);
        const paths = Object.keys(this.files).filter(path=>this.files[path] === null);
        return Promise.all(paths.map(async path =>{
            let is_ok = false;
            fetch(url_list[path],{method:"GET",headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token}})
            .then(res => { is_ok = res.ok; return res.blob()})
            .then(blob => {if(is_ok){ return new File([blob],this.filename(path,sepa),{type:blob.type})}else{ return new File([blob],`${this.filename(path,sepa)}のファイル取得に失敗しました。`,{type:blob.type})}})
            .then(f => {this.files[path] = f})
        }));
    }

    find_filerecord(filename){
        const recs = this.tree_area.querySelectorAll(".current-record");
        let r = null;
        if(recs){
            const rows = [...recs];
            r =  rows.find((r)=>{
                    let result = false;
                    const fn_dom = r.querySelector(".file-name");
                    if(fn_dom){
                        result = fn_dom.textContent === filename;
                    }
                    return result;
                }) ?? null;
        }
        return r;
    }

    remove_filerecord(filename){
        try{
            const target = this.find_filerecord(filename);
            target.querySelector(".fd-delete").click();
            return true;
        }catch(e){
            console.log(e);
            return false;
        }
    }

    filename(filepath="",sepa="/"){
        const separated_list = filepath.split(sepa);
        return separated_list.length <= 1 ? filepath : filepath.split(sepa)[separated_list.length - 1];
    }

    read(file){
        return new Promise((resolve)=>{
            const reader = new FileReader();
            reader.onload = () => {
                this.data = reader.result;
                this.previewfile = file;
                this.preview = this.analize(file);
                resolve();
            }
            if(file.name.includes(".png") || file.name.includes(".jpg") || file.name.includes(".gif") || file.name.includes(".svg") || file.name.includes(".jpag")){
                reader.readAsDataURL(file);
            }else if(file.name.includes(".xlsx")){
                reader.readAsArrayBuffer(file);
            }else{
                reader.readAsText(file);
            }
        });
    }

    analize(file){
        const type = file.type;
        console.log("file-type:",file.type);
        let dom = null;
        if(type.startsWith("text/")){
            dom = DOM.create("pre",{class:"fd-preview"});
            dom.textContent = this.data;
        }else if(type.startsWith("image/")){
            // 画像データの作成
            dom = DOM.create("img",{class:"fd-preview"});
            dom.src = this.data;
            dom.style.width = "100%";
        }else if(type.startsWith("application/json")){
            dom = DOM.create("pre",{class:"fd-preview"});
            dom.textContent = this.data;
        }else{
            dom = DOM.create("div");
            dom.appendChild(document.createTextNode("プレビューに対応していません"));
            let pre = DOM.create("pre");
            pre.appendChild(document.createTextNode(this.data));
            dom.appendChild(pre);

        }
        return dom;
    }

    download(file) {
        // File からオブジェクトURLを作成
        const url = URL.createObjectURL(file);
        // 一時的な <a> 要素を作成
        const a = document.createElement('a');
        a.href = url;
        const filepath = file.name.split("/");
        a.download = filepath[filepath.length-1]; // ダウンロード時のファイル名を設定
        document.body.appendChild(a); // Firefox 対策でDOMに追加
        a.click(); // 自動的にクリック
        document.body.removeChild(a); // 後片付け
        URL.revokeObjectURL(url); // メモリ解放
    }

    download_by_name(filename){
        const fp = `${this.current_dirpath}${filename}`;
        const f = this.files[fp];
        let result = true;
        if(f){
            this.download(f);
        }else{
            result = false;
        }
        return result;
    }

    make(){
        const elm = super.make();
        elm.addEventListener("dragover",(e)=>{
            e.preventDefault();
            elm.classList.add("active");
        });
        elm.addEventListener("dragleave",(e)=>{
            elm.classList.remove("active");
        });
        elm.addEventListener("drop",async (e)=>{
            e.preventDefault();
            await this.dropload(e);
            this.draw();
            elm.classList.remove("active");
        });
        elm.classList.add("filedrop");
        const file_tool = DOM.create("div",{class:"file-tool"});
        const tree_area = DOM.create("div",{class:"tree-area"});
        const filedrop_view = DOM.create("div",{class:"filedrop-view"});
        filedrop_view.textContent = "ファイル選択";
        filedrop_view.style.paddingLeft = "10px";
        filedrop_view.style.cursor = "pointer";
        filedrop_view.addEventListener("click",function(){
            filedrop_input.click();
        });
        const folderdrop_view = DOM.create("div",{class:"folderdrop-view"});
        folderdrop_view.textContent = "フォルダ選択";
        folderdrop_view.style.paddingLeft = "10px";
        folderdrop_view.style.cursor = "pointer";
        folderdrop_view.addEventListener("click",function(){
            folderdrop_input.click();
        });
        const filedrop_input = DOM.create("input",{class:"filedrop-input"});
        filedrop_input.type = "file";
        filedrop_input.setAttribute("multiple","");
        filedrop_input.addEventListener("change",async (event)=>{
            await this.load(event);
            this.draw();
            filedrop_input.value = "";
        });
        const folderdrop_input = DOM.create("input",{class:"folderdrop-input"});
        folderdrop_input.type = "file";
        folderdrop_input.setAttribute("webkitdirectory","");
        folderdrop_input.setAttribute("directory","");
        folderdrop_input.setAttribute("multiple","");
        folderdrop_input.addEventListener("change",async (event)=>{
            await this.load(event);
            this.draw();
            folderdrop_input.value = "";
        });

        elm.appendChild(file_tool);
        elm.appendChild(tree_area);
        file_tool.appendChild(filedrop_view);
        file_tool.appendChild(folderdrop_view);
        file_tool.appendChild(filedrop_input);
        file_tool.appendChild(folderdrop_input);
        this.tree_area = tree_area;
        this.folderdrop_input = folderdrop_input;
        this.filedrop_input = filedrop_input;
        this.filepick = filedrop_view;
        this.folderpick = folderdrop_view;

        return elm;
    }

    async dropload(event){
        event.preventDefault();
        this.backup = {...this.files};
        const items = event.dataTransfer.items;
        let i = 0;
        for(const item of items){
            i++;
            const entry = item.webkitGetAsEntry();
            if(entry){
                // 差分の保持用
                this.diff = {};
                this.traverse_file_tree(entry);
                // await this.traverse_file_tree(entry);
            }
            console.log(item);
        }
        console.log('選択されたファイルの総数:', i, items);
        if(typeof(this.load_event) === "function"){
            this.load_event(this.files);
        }
    }

    async traverse_file_tree(entry,path=""){
        if(entry.isFile){
            await new Promise((resolve)=>{
                entry.file((file)=>{
                    console.log(path,file.name);
                    this.files[this.current_dirpath + path + file.name] = file;
                    this.diff[this.current_dirpath + path + file.name] = file;
                    this.draw();
                    resolve();
                });
            })
        }else if(entry.isDirectory){
            const reader = entry.createReader();
            const readEntries = () => {
                return new Promise((resolve) => {
                    reader.readEntries(resolve);
                });
            };

            let entries;
            do{
                entries = await readEntries();
                for(const e of entries){
                    await this.traverse_file_tree(e, path + entry.name + "/");
                }
            }while(entries.length > 0)
        }
    }

    async load(event){
        const files = Array.from(event.target.files);
        console.log('選択されたファイルの総数:', files.length);
        // バックアップのコピー
        this.backup = {...this.files};
        this.backup_file_id_list = {...this.file_id_list};
        // 差分の保持用
        this.diff = {};
        this.diff_id = {};
        // ファイル名一覧を表示
        files.forEach(file => {
            console.log(file.webkitRelativePath || file.name);
            // file.text().then(text=>console.log(text));
            this.files[`${this.current_dirpath}${file.webkitRelativePath || file.name}`] = file;
            this.diff[`${this.current_dirpath}${file.webkitRelativePath || file.name}`] = file;
            this.file_id_list[`${this.current_dirpath}${file.webkitRelativePath || file.name}`] = -1;
            this.diff_file_id_list[`${this.current_dirpath}${file.webkitRelativePath || file.name}`] = -1;

        });
        if(typeof(this.load_event) === "function"){
            this.load_event(this.files);
        }
    }

    rollback(){
        this.files = {...this.backup};
        this.file_id_list = {...this.backup_file_id_list};
        return this.files;
    }

    get dir(){
        const dirs = [];
        for(let fpath of Object.keys(this.files)){
            // webkitの性質上かならず末尾はファイル
            const file_path_list = fpath.split("/");
            const file_name = file_path_list[file_path_list.length-1];
            const dir_path = file_path_list.length > 1 ? file_path_list.slice(0,file_path_list.length-1).join("/") : "";
            dirs.push({
                dirpath:dir_path==="" ? dir_path : `${dir_path}/`,
                filename:file_name,
            });
        }
        return dirs;
    }

    current(dirpath=""){
        const current = {dirnames:[],filenames:[]};
        for(let d of this.dir){
            if(d.dirpath === dirpath){
                current.filenames.push(d.filename);
            }else if(d.dirpath.startsWith(dirpath)){
                // const dirname = d.dirpath.replace(dirpath,"").split("/")[0];
                const dirname = d.dirpath.slice(dirpath.length).split("/")[0];
                if(current.dirnames.includes(dirname) === false){
                    current.dirnames.push(dirname);
                }
            }
        }
        return current;
    }

    treeup(dirpath=""){
        let path = "";
        if(dirpath==="" || dirpath==="/"){
            path = "";
        }else{
            let dp = dirpath.split("/");
            path = `${dp.slice(0,dp.length-2).join("/")}/`;
            path = path==="/" ? "" : path;
        }
        return path;
    }

    draw(){
        this.tree_area.innerHTML = ""; //一度リセット
        const tree = DOM.create("div",{class:"current"});
        const current = this.current(this.current_dirpath);
        const record = DOM.create("div",{class:"current-record"});
        const treeup_btn = DOM.create("div",{class:"fd-treeup"});
        treeup_btn.textContent = "１つ上の階層";
        treeup_btn.style.paddingLeft = "10px";
        treeup_btn.style.cursor = "pointer";
        treeup_btn.addEventListener("click",()=>{
            console.log(this.current_dirpath);
            this.current_dirpath = this.treeup(this.current_dirpath);
            console.log(this.current_dirpath);
            this.draw();
        });
        this.treeup_btn = treeup_btn;
        const create_btn = DOM.create("div",{class:"fd-create"});
        create_btn.textContent = "フォルダ追加";
        create_btn.style.paddingLeft = "10px";
        create_btn.style.cursor = "pointer";

        create_btn.addEventListener("click",async ()=>{
            let newdir = ""
            this.cm.set_body("<input type='textbox' placeholder='新しいフォルダ名を入力してください'/>");
            const dirname = await this.cm.confirm(
                ()=>{return this.cm.body.querySelector("input").value;}
            );
            if(dirname === "" || dirname === null){
                return;
            }else{
                newdir = this.current_dirpath === "" ? `${dirname}/` : `${this.current_dirpath}${dirname}/`;
                console.log(newdir);
                this.files[newdir] = null;
                this.draw();
                return;
            }
        });

        const path_info = DOM.create("div",{class:"path-info"});
        path_info.textContent = this.current_dirpath;

        for(let d of current.dirnames){
            const dirrecord = record.cloneNode();
            const name = DOM.create("span",{class:"dir-name"});
            name.textContent = d;
            name.addEventListener("click",()=>{
                this.current_dirpath = this.current_dirpath === "" ? `${d}/` : `${this.current_dirpath}${d}/`;
                this.draw();
                path_info.textContent = this.current_dirpath;
            });
            const icon = DOM.create("img",{class:"fd-icon"});
            icon.src = "/static/img/_/icon_file.png"; 
            const btns = DOM.create("span",{class:"fd-btns"});
            // const detail_btn = DOM.create("span",{class:"fd-detail"});
            // detail_btn.textContent = "詳細";
            const delete_btn = DOM.create("button",{class:"fd-delete"});
            delete_btn.textContent = "削除";
            delete_btn.addEventListener("click",()=>{
                // それ以下のフォルダ・ファイルを削除
                const fps = Object.keys(this.files);
                const tmp_files = {};
                for(let fp of fps){
                    if(fp.startsWith(`${this.current_dirpath}${d}`) === false){
                        tmp_files[fp] = this.files[fp];
                    }
                }
                this.files = tmp_files;
                this.draw();
            });
            const update_btn = DOM.create("button",{class:"fd-update"});
            update_btn.textContent = "更新";
            update_btn.addEventListener("click",async (e)=>{
                // 名前の変更
                const base_dir = this.files[this.current_dirpath + d];
                this.cm.set_body(`<input type="textbox" placeholder="変更後の名前を入力してください" value="${d}"/>`);
                const newdir_name = await this.cm.confirm(
                    ()=>{return this.cm.body.querySelector("input").value }
                );
                const fps = Object.keys(this.files);
                const tmp_files = {};
                for(let fp of fps){
                    if(fp.startsWith(`${this.current_dirpath}${d}`) === false){
                        tmp_files[fp] = this.files[fp];
                    }else{
                        const newfile_path = fp.replace(`${this.current_dirpath}${d}`,`${this.current_dirpath}${newdir_name}`);
                        tmp_files[newfile_path] = this.files[fp];
                    }
                }
                this.files = tmp_files;
                this.draw();

            })
            // btns.appendChild(detail_btn);
            btns.appendChild(delete_btn);
            btns.appendChild(update_btn);
            dirrecord.appendChild(icon);
            dirrecord.appendChild(name);
            dirrecord.appendChild(btns);
            tree.appendChild(dirrecord);
        }

        for(let f of current.filenames){
            const dirrecord = record.cloneNode();
            const icon = DOM.create("img",{class:"fd-icon"}); 
            icon.src = "/static/img/_/icon_folder.png"; 
            const name = DOM.create("span",{class:"file-name"});
            name.textContent = f;
            name.addEventListener("click",async ()=>{
                detail_btn.textContent = "読込";
                await this.read(this.files[this.current_dirpath + f]);
                this.dmdl.set_title(f).reset_body().set_body(this.preview);
                this.dmdl.show();
                detail_btn.textContent = "詳細";
            });
            const btns = DOM.create("span",{class:"fd-btns"});
            const detail_btn = DOM.create("button",{class:"fd-detail"});
            detail_btn.dataset.filename = f;
            detail_btn.textContent = "詳細";
            detail_btn.addEventListener("click",async ()=>{
                detail_btn.textContent = "読込";
                await this.read(this.files[this.current_dirpath + f]);
                this.dmdl.set_title(f).reset_body().set_body(this.preview);
                this.dmdl.show();
                detail_btn.textContent = "詳細";
            });
            const delete_btn = DOM.create("button",{class:"fd-delete"});
            delete_btn.textContent = "削除";
            delete_btn.addEventListener("click",()=>{
                dirrecord.remove();
                // ファイルを削除
                delete this.files[this.current_dirpath + f];
                this.draw();
            });
            const update_btn = DOM.create("button",{class:"fd-update"});
            update_btn.textContent = "更新";
            update_btn.addEventListener("click",async ()=>{
                // 名前の更新
                const base_file = this.files[this.current_dirpath + f];
                this.cm.set_body(`<input type="textbox" placeholder="変更後の名前を入力してください" value="${base_file.name}"/>`);
                const newfile_name = await this.cm.confirm(
                    ()=>{return this.cm.body.querySelector("input").value }
                );
                console.log(newfile_name);
                const new_file = new File([base_file], newfile_name, {
                    type: base_file.type,
                    lastModified: base_file.lastModified,
                });

                this.files[this.current_dirpath + newfile_name] = new_file;
                delete this.files[this.current_dirpath + f];
                this.draw();
            });
            btns.appendChild(detail_btn);
            btns.appendChild(delete_btn);
            btns.appendChild(update_btn);
            dirrecord.appendChild(icon);
            dirrecord.appendChild(name);
            dirrecord.appendChild(btns);
            tree.appendChild(dirrecord);
        }

        this.tree_area.appendChild(treeup_btn);
        this.tree_area.appendChild(create_btn);
        this.tree_area.appendChild(tree);
    }

    build(){
        super.build();
        this.style().build();
        if(this.visible===false){
            this.frame.classList.add("hidden");
        }
        this.draw();
    }

    hide(){
        this.frame.classList.add("hidden");
    }

    show(){
        this.frame.classList.remove("hiddend");
    }

}


/**
 * FormObjectを生成するクラス
 */
class FormFactory{
    static{
        this.form_id = 0;
        this.CONST = {
            MESSAGES:{},
        }
    }

    static get forms(){
        return [
            FormInputText, FormInputNumber, FormInputFile, FormInputCheckBox, FormInputRadio, 
            FormInputDate, FormInputDateTime, FormInputPassword,
            FormTextArea, FormSelectBox,
            FormSubmit,
        ];
    }

    constructor(){
        this.id = `${FormFactory.form_id++}`;
        this.build();
    }

    // ↓以下のような生成・削除用のメソッドが動的に追加される

    // createInputText(){
    //     return new FormInputText();
    // }

    // deleteInputText(){
    //     
    // }

    // copyInputText(){
    //     
    // }

    // getInputTextList(){
    //     
    // }

    get forms(){
        return FormObject.all.filter((obj)=>obj.dataset.ffid == this.id);
    }

    draw(dom){
        const forms = this.forms;
        for(let fo of forms){
            dom.appendChild(fo.frame || fo.label || fo.dom);
        }
        return forms;
    }

    build(){
        for(let cls of FormFactory.forms){
            this[cls.name.replace("Form","create")]         = (n)=>{ let obj = new cls(); obj.dataset.ffid = this.id; obj.convenient_name = n ?? ""; return obj;};
            this[cls.name.replace("Form","delete")]         = (obj)=>{obj.delete()};
            this[cls.name.replace("Form","copy")]           = (obj)=>{obj.copy()};
            this[`${cls.name.replace("Form","get")}List`]   = ()=>this.forms.filter((obj)=>obj.name == cls.name.toLowerCase());
        }
    }
}

class EventHandler{
    static{
        this.CONST = {
            MESSAGES:{
                APPEND_ERROR:"イベントの登録ができませんでした",
            },
            EVENTS:{
                // 各オブジェクトで許容するイベント群
                // TODO:スマホ対応
                keydown:     (e)=>{},
                keyup:       (e)=>{},
                input:       (e)=>{},
                change:      (e)=>{},
                mouseover:   (e)=>{},
                click:       (e)=>{},
                dblclick:    (e)=>{},
                contextmenu: (e)=>{},
            }
        }
    }

    constructor(selector="body"){
        this.dom = null;
        if(typeof(selector) === "string"){
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        this.events = {...EventHandler.CONST.EVENTS};
        this.init();
    }

    init(){
        for(let event_name of Object.keys(this.events)){
            this.append(event_name,this.events[event_name]);
        }
        return this;
    }

    delete(){
        for(let event_name of Object.keys(this.events)){
            this.remove(event_name,this.events[event_name]);
        }
    }

    /**
     * イベントリスナーを登録するメソッド
     * イベントリスナーは常に一つになるように管理する。
     * @param {String} event_name 
     * @param {Function} func 
     * @returns {FormObject} this
     */
    append(event_name,func){
        // 既存の登録されたイベントを削除
        this.remove(event_name);
        // 新たにイベントを登録しなおす
        if( Object.keys(this.events).includes(event_name) && typeof(func) === "function" ){
            this.events[event_name] = func;
            this.dom.addEventListener(event_name,this.events[event_name]);
        }else{
            console.error(`${event_name}${EventHandler.CONST.MESSAGES.APPEND_ERROR}`);
        }
        return this;
    }

    /**
     * FormObjectのイベントリスナーを削除するメソッド
     * @param {String} event_name 
     * @param {Function} func 
     * @returns {FormObject} this
     */
    remove(event_name){
        this.dom.removeEventListener(event_name,this.events[event_name]);
        return this;
    }
}


class ThemeHandler{

    static{
        this.CONST = {
            COLOR:{
                BLACK:{FONT:"#ffffffff",BORDER:"#888888ff",BACKGROUND:"#000000ff"},
                RED  :{FONT:"#ffd9b3ff",BORDER:"#ff0000ff",BACKGROUND:"#ff8000ff"},
                // BORDER     :{NONE:"none",WHITE:"#ffffffbb",GREY:"#888888bb",BLACK:"#111111bb",RED:"#ff0000bb",Blue:"#007bffbb",GREEN:"#00fa25bb",YELLOW:"#fafa00bb",PURPLE:"#6000fabb",PINK:"#f200fabb",ORANGE:"#faab00bb",BROWN:"#fa7500bb"},
                // FONT       :{NONE:"none",WHITE:"#ffffffff",GREY:"#888888ff",BLACK:"#111111ff",RED:"#ff0000ff",Blue:"#007bffff",GREEN:"#00fa25ff",YELLOW:"#fafa00ff",PURPLE:"#6000faff",PINK:"#f200faff",ORANGE:"#faab00ff",BROWN:"#fa7500ff"},
                // BACKGROUND :{NONE:"none",WHITE:"#9a9a9aff",GREY:"#323232ff",BLACK:"#a9a9a9ff",RED:"#e45800ff",Blue:"#00ffbfff",GREEN:"#00fa96ff",YELLOW:"#81fa00ff",PURPLE:"#fa00edff",PINK:"#fa0043ff",ORANGE:"#ccfa00ff",BROWN:"#f6fa00ff"},
            }
        }
        this.targets = [];
        this.active_color = "BLACK";
        this.init();
    }

    static init(){
        let css_txt = "";
        for(let k of Object.keys(this.CONST.COLOR)){
            let c = this.CONST.COLOR[k];
            css_txt += `
                .theme.${k.toLowerCase()}{
                    color: ${c.FONT};
                    border: 1px solid ${c.BORDER};
                    background-color: ${c.BACKGROUND};
                }
            `;
        }

        this.style = new Style(css_txt).build();
    }

    static select(theme){
        this.active_color = theme.toLowerCase();
        for(let t of this.targets){
            t.coloring();
        }
    }

    constructor(selector){
        this.dom = null;
        if(typeof(selector) === "string"){
            this.dom = document.querySelector(selector);
        }else{
            this.dom = selector;
        }
        this.dom.classList.add("theme");
        ThemeHandler.targets.push(this.dom);
        this.coloring();
    }

    coloring(){
        for(let c of Object.keys(ThemeHandler.CONST.COLOR)){
            this.dom.classList.remove(c.toLowerCase());
        }
        this.dom.classList.add(ThemeHandler.active_color.toLowerCase());
    }

    delete(){
        ThemeHandler.targets = [...ThemeHandler.targets.filter((t)=>t!==this)];
    }
}

class FormObject{
    static{
        this.id = 0;
        this._list = [];
        this.CONST = {
            MESSAGES:{
                EMPTY:"値が入力されていません。",
                INIT:"初期化に失敗しました。",
            },
        }
    }

    static get all(){
        return FormObject._list;
    }

    static get list(){
        return FormObject._list.filter((fo)=>fo.name==this.name.toLowerCase());
    }

    constructor(mode="input"){
        this.id = FormObject.id++;
        this.mode = mode;
        this.messages = [];
        this.backup = null;
        this.dom = DOM.create(mode,{id:`${this.name}${this.id}`, class:this.name});
        this.label = null;
        this.event = new EventHandler(this.dom);
        this.theme = new ThemeHandler(this.dom);
        this.is_required = true;  // 必須入力
        this._check = (e)=>{};    // バリデーションチェック時のコールバック関数
        FormObject._list.push(this);
    }
    

    get list(){
        return FormObject._list.filter((fo)=>fo.name==this.name);
    }

    get count(){
        return this.list.length;
    }

    /**
     * ユーザフォームを管理するためのシステム内名称。フロントで利用するのは非推奨。
     */
    get name(){
        return this.constructor.name.toLowerCase();
    }

    /**
     * ユーザフォームを理解するための便宜的な名称。フロントで利用することを推奨。
     * domのdataset(data-name=便宜的な名称)を定義することで参照可能になる。
     */
    get convenient_name(){
        return this.dataset.name || this.dom.name;
    }

    set convenient_name(n){
        this.dataset.name = n;
        this.dom.name = n;
    }

    get style(){
        return this.dom.style;
    }

    set style(s){
        for(let k of Object.keys(s)){
            this.dom.style[k] = s[k];
        }
    }

    get dataset(){
        return this.dom.dataset;
    }

    set dataset(d){
        for(let k of Object.keys(d)){
            this.dom.style[k] = d[k];
        }
    }

    get value(){
        return this.dom.value;
    }

    set value(v){
        this.dom.value = v;
        if(this.backup !== null && this.backup !== undefined){
            this.backup = v;
        }
    }

    /**
     * ユーザが最終的に入力した値や選択したものを返す。
     * 例えば、ラジオボタンやチェックボックスなどのグループ化されたものは、選択されたもののみが取得される。
     */
    get answer(){
        return this.dom.value;
    }

    get type(){
        return this.dom.type;
    }

    set type(t){
        this.dom.type = t;
    }

    get is_error(){
        this.messages = this.validation();
        return this.messages.length > 0;
    }

    get check(){
        return this._check();
    }

    set check(callback){
        if(typeof(callback)==="function"){
            this._check = callback;
        }
    }

    attribute(key="id",value=""){
        if(value === "" || value === null || value === undefined){
            return this.dom.getAttribute(key);
        }else{
            this.dom.setAttribute(key,value)
            return this.dom.getAttribute(key);
        }
    }

    /**
     * Override必須: 最大最小値、文字数制限などをチェック
     * this.valueを評価して、エラーメッセージを配列構造で返却する関数
     * @returns error_message
     */
    validation(){
        let error_message = [];
        if(this.value === null || this.value === undefined){
            // 値がNULLやUNDEFINEDは普通はあり得ないのでエラーとする。
            error_message.push(`${this.convenient_name || this.name }：${FormObject.CONST.MESSAGES.EMPTY}`);
        }
        if(this.is_required && this.value === ""){
            // NOTE:必須入力時に空文字の場合はエラー。エラーにしたくない場合はOverride先で処理を無視するように実装するべき。
            error_message.push(`${this.convenient_name || this.name }：${FormObject.CONST.MESSAGES.EMPTY}`);
        }

        if(typeof(this.check)==="function"){
            // NOTE:各画面ごとにチェックの実装を変えるケースがある。そのためにCHECK関数を用意している。
            const messages = this.check();
            for(let m of messages){
                error_message.push(m);
            }
        }
        return error_message;
    }

    delete(){
        this.theme.delete();
        this.event.delete();
        this.dom.remove();
        FormObject._list = FormObject._list.filter((fo)=>fo!==this);
    }

    create(){
        return new this.constructor(this.mode);
    }

    copy(){
        const copied   = this.create();
        copied.mode    = this.mode;
        copied.value   = this.value;
        copied.type    = this.type;
        copied.dataset = {...this.dataset};
        copied.style   = {...this.style};
        return copied;
    }

    deactivate(){
        this.dom.disable = true;
        return this;
    }

    activate(){
        this.dom.disable = false;
        return this;
    }

    hide(){
        this.dom.style.display = "none";
        return this;
    }

    show(){
        this.dom.style.display = "inline-block";
        return this;
    }

    wrap(name="",comment=""){
        this.frame = DOM.create("div",{class:`form-inputframe`});
        this.prev  = DOM.create("div");
        this.back  = DOM.create("div");
        this.prev.textContent = name;
        this.back.textContent = comment;
        this.frame.appendChild(this.prev);
        this.frame.appendChild(this.label || this.dom);
        this.frame.appendChild(this.back);
        return this;
    }
}

class FormInputText extends FormObject{
    constructor(){
        super("input");
        this.type = "text";
    }

    validation(){
        return super.validation();
    }
}

class FormInputNumber extends FormObject{
    constructor(){
        super("input");
        this.type = "number";
    }

    validation(){
        return super.validation();
    }
}

class FormInputPassword extends FormObject{
    constructor(){
        super("input");
        this.type = "password";
    }

    validation(){
        return super.validation();
    }
}

class FormInputRadio extends FormObject{

    static group(group_name="group"){
        return this.list.filter((o)=>o.group_name==group_name);
    }

    static value(group_name="group"){
        const target = this.list.find((o)=>o.group_name==group_name && o.is_checked);
        return target ? parseInt(target.dataset.groupId) || target.name_label.textContent || target.value : null;
    }

    static find_by_value(group_name="group",value=""){
        return this.list.find((o)=>o.group_name==group_name && o.value == value);
    }

    /**
     * グルーピングされたラジオボタンを初期化するメソッド
     * @param {String} group_name 
     * @param {*} value 
     * @returns {Boolean} true(正常) / false(異常)
     */
    static init_group(group_name="group",value=""){
        let result = false;
        const target = this.find_by_value(group_name,value);
        if(target){
            target.checked = true;
            result = true;
        }else{
            console.error(FormObject.CONST.MESSAGES.INIT);
        }
        return result;
    }

    static CONST = {
        DEFAULT:{
            GROUPNAME:"group",
        },
        MESSAGES:{
            GROUPNAME_ERROR:"グループ名が初期値です。グループ名は便宜的な名前を付与するべきです。"
        }
    }

    constructor(){
        super("input");
        this.type = "radio";
        this.group_name = FormInputRadio.CONST.DEFAULT.GROUPNAME;
        this.label = DOM.create("label",{id:`${this.name}-label${this.id}`,class:`${this.name}-label`});
        this.name_label = DOM.create("span");
        this.label.appendChild(this.dom);
        this.label.appendChild(this.name_label);
    }

    label_name(s){
        this.name_label.textContent = s;
        const bro = this.brother;
        if(bro.length > 1 && bro[0].frame ){
            this.wrap();
        }
        return this;
    }

    group(group_name="group"){
        this.group_name = group_name;
        this.dom.name = group_name;
        this.dom.dataset.groupId = this.brother.length;
        return this;
    }

    get value(){
        return FormInputRadio.value(this.group_name);
    }

    get is_checked(){
        return this.dom.checked;
    }

    get brother(){
        return FormInputRadio.group(this.group_name);
    }

    select(){
        this.dom.checked = true;
        return this;
    }

    unselect(){
        this.dom.checked = false;
        return this;
    }

    validation(){
        let error_message = super.validation();
        if(this.group_name === FormInputRadio.CONST.DEFAULT.GROUPNAME){
            error_message.push(FormInputRadio.CONST.MESSAGES.GROUPNAME_ERROR);
        }
        return error_message;
    }

    wrap(name="",comment=""){
        const bro = this.brother;
        if(bro.length>1){
            // 兄弟要素が既にいる場合はその兄弟フレームを自フレームにする。
            const target = bro[0];
            if(!target.frame){
                target.frame = DOM.create("div", {class:`form-inputframe`});
                target.prev  = DOM.create("div");
                target.back  = DOM.create("div");
            }

            for(let b of bro.filter((x)=>x!==bro[0])){
                if(!b.frame){
                    b.frame = target.frame;
                    b.prev  = target.prev;
                    b.back  = target.back;
                }
            }

            if(name){this.prev.textContent = name};
            if(comment){this.back.textContent = comment};
            this.frame.appendChild(this.prev);
            for(let b of bro){
                this.frame.appendChild(b.label || b.dom);
            }
            this.frame.appendChild(this.back);
        }else{
            // 兄弟要素がない場合は、そのままラッピングする。
            super.wrap(name,comment);
        }
        return this;
    }
}

class FormInputCheckBox extends FormInputRadio{

    static find_by_value(group_name="group",value=""){
        return this.list.filter((o)=>o.group_name==group_name && o.dataset.value == value);
    }

    /**
     * グルーピングされたラジオボタンを初期化するメソッド
     * @param {String} group_name 
     * @param {*} value 
     * @returns {Boolean} true(正常) / false(異常)
     */
    static init_group(group_name="group",value=""){
        let result = false;
        const targets = this.find_by_value(group_name,value);
        for(let t of targets){
            if(t){
                t.checked = true;
                result = true;
            }else{
                console.error(FormObject.CONST.MESSAGES.INIT);
            }
        }
        return result;
    }

    constructor(){
        super();
        this.type = "checkbox";
        this.label = DOM.create("label",{id:`${this.name}-label${this.id}`,class:`${this.name}-label`});
        this.name_label = DOM.create("span");
        this.label.appendChild(this.dom);
        this.label.appendChild(this.name_label);
    }

    get brother(){
        return FormInputCheckBox.group(this.group_name);
    }

    get value(){
        return this.dom.checked;
    }

    set value(b){
        this.dom.checked = b;
    }

    group(group_name="group"){
        this.group_name = group_name;
        this.dom.name   = `${group_name}-${this.brother.length}`;
        this.dom.dataset.groupId = this.brother.length;
        return this;
    }

    validation(){
        return super.validation();
    }
}

class FormInputFile extends FormObject{
    constructor(){
        super("input");
        this.type = "file";
    }

    validation(){
        return super.validation();
    }
}

class FormInputDate extends FormObject{
    constructor(){
        super("input");
        this.type = "date";
    }

    validation(){
        return super.validation();
    }
}

class FormInputDateTime extends FormObject{
    constructor(){
        super("input");
        this.type = "datetime-local";
    }

    validation(){
        return super.validation();
    }
}

class FormTextArea extends FormObject{
    constructor(){
        super("textarea");
    }

    validation(){
        return super.validation();
    }
}

class FormSelectBox extends FormObject{
    constructor(){
        super("select");
        this._options = [];
    }

    get options(){
        return this._options;
    }

    set options(o){
        this._options = o;
        this.dom.innerHTML = "";
        for(let opt of this._options){
            this.dom.appendChild(this.parse_option(opt));
        }
    }

    get selectedIndex(){
        return this.dom.selectedIndex;
    }

    set selectedIndex(i){
        this.dom.selectedIndex = i;
    }

    parse_option(o){
        let result = null;
        if(typeof(o)===HTMLOptionElement){
            result = o;
        }else{
            result = DOM.create("option");
            result.value = o.value ?? "";
            result.id = o.id ?? "";
            result.textContent = o.text ?? "";
            result.classList.add(o.class ?? "option");
        }
        return result;
    }

    append(o){
        let tmp_options = this.options
        tmp_options.push(o);
        this.options = tmp_options;
        return this;
    }

    remove(o){
        let tmp_options = this.options;
        if(typeof(o)===HTMLOptionElement){
            this.options = tmp_options.filter((opt)=>opt!==o);
        }else{
            this.options = tmp_options.filter((opt)=>opt.value!==o.value);
        }
        return this;
    }

    copy(){
        const copied = super.copy();
        copied.options = this.options;
        return copied;
    }

    validation(){
        return super.validation();
    }
}

class FormSubmit extends FormObject{
    constructor(){
        super("input");
        this.type = "submit";
    }

    validation(){
        // ただのSUMITボタンなので特に何もしない
        return [];
    }
}

class FormManager extends DOM{
    
    constructor(selector="body"){
        super(selector);
        this.factory = new FormFactory();
        this.messages = [];
        this.action = "";
        this.method = "POST";
        this.is_submit = true;
        this.submit_btn = null;
        this.index();
    }

    make(){
        let content = null;
        if(this.is_submit){
            const elm = DOM.create("form",{id:`form-manager${this.id}`});
            elm.action = this.action;
            elm.method = this.method;
            content = elm;
        }else{
            const elm = super.make();
            elm.id = `form-manager${this.id}`;
            content = elm;
        }
        return content;
    }

    validation(){
        let error_messages = [];
        const forms = this.factory.forms
        for(let obj of forms){
            error_messages = [...error_messages, ...obj.validation()];
        }
        return [...new Set(error_messages)];
    }

    get is_error(){
        this.messages = this.validation();
        return this.messages.length > 0;
    }

    get values(){
        let result = {};
        if(this.is_error){
            result = {};
        }else{
            for(let f of this.factory.forms){
                console.log(f.convenient_name,f.value);
                result[f.convenient_name || f.name] = f.value;
            }
        }

        return result;
    }

    build(){
        return super.build();
    }

    draw(){
        return this.factory.draw(this.contents);
    }
}


/**
 * Quillに依存
 */
class Editor{

    static COLORS = [
        '#000000',
        '#e60000',
        '#008a00',
        '#0066cc',
        '#ffff00',
        //   'custom' // ← 自由色トリガー
    ];

    static cnt = 0;

    constructor(selector="body"){
        this.colorPicker = null;
        this.currentFormat = 'color';
        this.savedRange = null;
        const self = this;
        this.id = Editor.cnt++;
        this.dom = null;
        let target = selector;
        if(typeof(selector)!=="string"){
            selector.id = `ql-editor${this.id}`;
            target = `#${selector.id}`;
            this.dom = selector;
        }else{
            this.dom = document.querySelector(selector);
        }

        this.toolbarOptions = [
            ['bold', 'italic', 'underline'],
            [{ color: [...Editor.COLORS] }, { background: [...Editor.COLORS] }],
            ['customColor', 'customBg'], // ← 独自ボタン
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ];
        const toolbarOptions = this.toolbarOptions;
        this.quill = new Quill(target, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                    
                        customColor() {
                            self.openColorPicker('color');
                        },
                        customBg() {
                            self.openColorPicker('background');
                        }
                    }
                }
            }
        });

        document.querySelector(".ql-customColor").addEventListener("click",(e)=>{
            const picker = this.getColorPicker();
            picker.style.left = `${e.clientX}px`;
            picker.style.top  = `${e.clientY}px`;
            console.log(
                picker.style.left,
                picker.style.top
            );
        });
        document.querySelector(".ql-customBg").addEventListener("click",(e)=>{
            const picker = this.getColorPicker();
            picker.style.left = `${e.clientX}px`;
            picker.style.top  = `${e.clientY}px`;
        });
    }

    openColorPicker(format){
        this.currentFormat = format;
        const picker = this.getColorPicker();
        // 毎回 input を発火させる
        picker.value = '#000000';
        this.savedRange = this.quill.getSelection();
        requestAnimationFrame(() => {
            picker.click();
        });
    }

    getColorPicker() {
        if (this.colorPicker) return this.colorPicker;

        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';

        // 見えないが確実に動く配置
        colorPicker.style.position = 'fixed';
        colorPicker.style.top = '0px';
        colorPicker.style.left = '0px';
        colorPicker.style.width = '1px';
        colorPicker.style.height = '1px';
        colorPicker.style.border = 'none';
        colorPicker.style.padding = '0';
        colorPicker.style.background = 'transparent';

        document.body.appendChild(colorPicker);

        colorPicker.addEventListener('input', () => {
            if (this.savedRange) {
            this.quill.setSelection(this.savedRange);
            }
            this.quill.format(this.currentFormat, colorPicker.value);
            colorPicker.blur();
        });
        this.colorPicker = colorPicker;

        return this.colorPicker;
    }

    get innerHTML(){
        return this.quill.getContents();
    }

    set innerHTML(html){
        this.quill.clipboard.dangerouslyPasteHTML(this.quill.getLength() - 1,html);
    }

    get text(){
        return this.quill.getText();
    }

}

// let f = new Filter();
//     f.set_condition(
//         [
//             [{field:"id", value:4, comparision:Filter.COMPARISION.BIGGER},{field:"name", value:"e", comparision:Filter.COMPARISION.EQUAL}],
//             [{field:"name", value:"a", comparision:Filter.COMPARISION.EQUAL}],
//             [{field:"name", value:"a", comparision:Filter.COMPARISION.EQUAL}],
//         ]
//     )
//     .set([
//         {id:1,name:"a"},
//         {id:2,name:"b"},
//         {id:3,name:"c"},
//         {id:4,name:"d"},
//         {id:5,name:"e"},
//         {id:6,name:"f"},
//         {id:7,name:"g"},
//         {id:1,name:"a"},
//     ])
//     .build();

// console.log(f.all());

// new DOM();
// new DOM();

