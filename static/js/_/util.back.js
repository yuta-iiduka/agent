console.log("util.js is called.");
/**
 * TODO:ジャーナルなどの表示機能
 */

class NowLoading{
    constructor(selector="body"){
        this.dom = document.querySelector(selector);
    }

    show(message=""){
        return this;
    }

    hide(){
        return this;
    }
}

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

class DOM {
    static {
        this.counter = {};
        this.dict = {};

        const self = this;
        window.addEventListener("resize",function(){
            const objects_dict = Object.values(self.dict);
            for(let objects of objects_dict){
                const objects_list = Object.values(objects);
                for(let o of objects_list){
                    o.resize();
                }
            }
        })
    }

    static get list(){
        return Object.values(DOM.dict[this.name.toLowerCase()]);
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
            elm.classList.add(option.class);
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

    constructor(selector){
        if (typeof(selector) === "string" ){
            this.parent = document.querySelector(selector);
        }else{
            this.parent = selector;
        }
        if(this.parent === null){
            console.error("指定されたDOMが見つかりません");
        }
        this.frame = null;
        this.contents = null;
    }

    type(){
        return this.constructor.name.toLowerCase();
    }

    append(){
        return this.index();
    }

    index(){
        let id = 0
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
        return id;
    }

    remove(){
        delete DOM.dict[this.type()][this.id];
        DOM.counter[this.type()]--;
    }

    resize(){
        return;
    }

    /**
     * オーバーライド用 this.contentsに相当する
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
        this.frame = DOM.create("div",{class:`frame-${this.type()}`})
        this.contents = this.make();
        this.frame.appendChild(this.contents);
        this.parent.appendChild(this.frame);
        return this.frame;
    }

    get cssClassFrame(){
        return `frame-${this.type()}`;
    }
}

console.log("grid.js is called.")

class Grid{
    static{
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.list = [];
        this.id = 0;
        this.event_resize();
        this.is_pc = Platform.isPC();
        this.is_mobile = Platform.isMobile();
    }

    static event_resize(){
        window.addEventListener("resize",function(){
            for(let g of Grid.list){
                g.resize();
            }
        });
    }

    static get windowRatio(){
        return {
            w: window.innerWidth / this.width ,
            h:  window.innerHeight / this.height,
        }
    }

    constructor(x=64,y=64,selector="body",labelX="num"){
        this.id = Grid.id++;
        this.x = x;
        this.y = y;
        // this.baseFontSize = Platform.isPC() ? Grid.width / 100 : Grid.width / 50;
        this.baseFontSize = 12;
        this.dom = this.make(selector);
        this.fontSize = this.baseFontSize;
        // this.fontResize = true;
        this.fontResize = false;
        this._objects = {};
        this.lineColor = "#444444";
        this.lineSubColor = "#aaaaaa";
        this._width  = this.dom.offsetWidth;
        this._height = this.dom.offsetHeight;
        this._fit_event = null;
        this.draw();
        this.label_strong_color = "lightgreen";
        this.label_light_color  = "lightblue";
        this.labelX_mode = labelX; // "none","num", "date", "time"
        this.labelsX = this.labelingX();

        Grid.list.push(this);
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
        return this.x > 0 ? (Grid.width / this.x) * Grid.windowRatio.w : 0;
    }

    get h(){
        return this.y > 0 ? (Grid.height / this.y) * Grid.windowRatio.h : 0;
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
            const wid = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
            const hit = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
            let x = Math.round(o.x/wid);
            let y = Math.round(o.y/hit);
            let w = Math.round(o.w/wid);
            let h = Math.round(o.h/hit);
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


    /**
     * TODO: date, datetimeのラベリング
     * @returns {Array} tmp
     */
    labelingX(){
        const tmp = [];
        const lbl  = DOM.create("div",{class:"grid-label"});
        const lbls = DOM.create("div",{class:"grid-labels"});
        lbls.style.display = "flex";
        lbls.style.position = "sticky";
        lbls.style.zIndex = 2;
        lbls.style.top = 0;
        lbl.style.display = "block";
        lbl.style.flex = 1;
        lbl.style.textAlign = "center";
        lbl.style.fontWeight = "bold";
        lbl.style.pointerEvents = "none";
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
        return tmp;
    }
    
    draw(){
        // 背景の描画
        const dom = this.dom;
        const w = this.w;
        const h = this.h;
        dom.style.backgroundSize = `${w}px ${h}px`;
        dom.style.backgroundPosition = `0% 0%`;
        // dom.style.backgroundImage = `repeating-linear-gradient(90deg,#aaa 0px,#aaa 1px,transparent 1px,transparent ${w}px,red ${w}px,red ${w+1}px,transparent ${w+1}px, transparent ${w*2}px),repeating-linear-gradient(0deg,#aaa,#aaa 1px,transparent 1px,transparent ${h}px)`;
        // dom.style.background = `repeating-linear-gradient(90deg,${this.lineSubColor} 0px,${this.lineColor} 1px,transparent 1px,transparent ${w}px,${this.lineColor} ${w}px,${this.lineColor} ${w+1}px,transparent ${w+1}px,transparent ${w*2}px,${this.lineColor} ${w*2}px,${this.lineColor} ${w*2+1}px,transparent ${w*2+1}px,transparent ${w*3}px,${this.lineColor} ${w*3}px,${this.lineColor} ${w*3+1}px,transparent ${w*3+1}px,transparent ${w*4}px,${this.lineColor} ${w*4}px,${this.lineColor} ${w*4+1}px,transparent ${w*4+1}px,transparent ${w*5}px),repeating-linear-gradient(0deg,${this.lineColor},${this.lineColor} 1px,transparent 1px,transparent ${h}px)`;
        dom.style.backgroundImage = `repeating-linear-gradient(90deg,${this.lineSubColor} 0px,${this.lineColor} 1px,transparent 1px,transparent ${w}px,${this.lineColor} ${w}px,${this.lineColor} ${w+1}px,transparent ${w+1}px,transparent ${w*2}px,${this.lineColor} ${w*2}px,${this.lineColor} ${w*2+1}px,transparent ${w*2+1}px,transparent ${w*3}px,${this.lineColor} ${w*3}px,${this.lineColor} ${w*3+1}px,transparent ${w*3+1}px,transparent ${w*4}px,${this.lineColor} ${w*4}px,${this.lineColor} ${w*4+1}px,transparent ${w*4+1}px,transparent ${w*5}px),repeating-linear-gradient(0deg,${this.lineColor},${this.lineColor} 1px,transparent 1px,transparent ${h}px)`;
        
        // オブジェクトの描画
        for(let o of this.objects){
            // 座標の調整
            this.fit(o);
            // 描画
            o.draw();
        }
        // fit後のイベント
        if(typeof(this._fit_event) === "function"){
            this._fit_event(this.objects);
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
        const w = o.resizable === true ? this.w / Grid.windowRatio.w : this.w;
        const h = o.resizable === true ? this.h / Grid.windowRatio.h : this.h;
        if(o.x % w > w / 2){
            o.x = (Math.floor(o.x / w) + 1) * w;
        }else{
            o.x = Math.floor(o.x / w) * w;
        }

        if(o.y % h > h / 2){
            o.y = (Math.floor(o.y / h) + 1) * h;
        }else{
            o.y = Math.floor(o.y / h) * h;
        }

        if(o.w % w > w / 2){
            o.w = (Math.floor(o.w / w) + 1) * w;
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
            o.h = (Math.floor(o.h / h) + 1) * h;
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
            console.log(o.x , w, this.width);
            o.x = this.width - o.width;
        }

        if(o.y < 0){
            o.y = 0;
        }

        if(o.y + o.height > this.height){
            // console.log(o.y , h, this.height);
            o.y = this.height - o.height;
        }

        o.p = {x:Math.round(o.x/w),y:Math.round(o.y/h),z:o.z,w:Math.round(o.w/w),h:Math.round(o.h/h)}
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
        const msg = this.check(obj).length;
        if(msg === 0){
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

    remove(id){
        this._objects[id].remove();
        delete this._objects[id];
        return this._objects;
    }

    resize(){
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
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body",labelX="none"){
        super(x,y,selector,labelX);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
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
}

class GridFixGlobal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body",labelX="none"){
        super(x,y,w,h,selector,labelX);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.globalize();
        this.dom.parentElement.style.position = "relative";
    }
}

class GridFixLocal extends GridFix{
    constructor(x=64,y=64,w=GridWide.defaultW,h=GridWide.defaultH,selector="body",labelX="none"){
        super(x,y,w,h,selector,labelX);
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this.localize();
        this.dom.parentElement.style.position = "relative";
        this.dom.parentElement.style.overflow = "auto";
    }
}

class Block{
    static{
        this.is_initialized = false;
        this.cnt = 0;
        this.list = [];
        // this.focused = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.clientX = 0;
        this.clientY = 0;
        this.clicked = null;
        this.MAX_ZINDEX = 1;
        this.MIN_ZINDEX = 0;
        this.initializer();
    }

    static initializer(){
        this.is_initialized = true;
        // TODO touch
        document.body.addEventListener("mousedown",function(e){
            Block.mouseX = e.pageX;
            Block.mouseY = e.pageY;
        });

        // ここでいい感じに設定できればよいが、ちょうどよい設定が見つからない
        // this.dom.addEventListener("mousemove",(e)=>{
        //     if(this.dom === e.target){
        //         Block.offsetX = e.offsetX;
        //         Block.offsetY = e.offsetY;
        //     }
        // });
    }

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
        }
    }

    static get focused(){
        return Block.list.filter((b)=>b.focused===true);
    }

    static get copied(){
        return Block.list.filter((b)=>b.copied===true);
    }

    static syncronize_move(blk){
        for(let b of Block.focused){
            if(b !== blk){
                b.move(b.x + blk.gap.x, b.y + blk.gap.y);
                b.draw();
            }
        }
    }

    static syncronize_size(blk){
        for(let b of Block.focused){
            if(b !== blk){
                b.size(b.w + blk.gap.w, b.h + blk.gap.h);
                b.draw();
            }
        }
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

    static copy(){
        // 起点となる最も距離が上のBlockを取得する。
        const base = Block.focused.reduce((min,item)=>item.y < min.y ? item : min);
        const baseX = base.x; // ここで定数化しないと、forの中で起点がずれる可能性がある
        const baseY = base.y;
        const tmp = []
        for(let b of Block.focused){
            b.focused = false;
            const cp = new Block(b.p.x + 1, b.p.y + 1, b.p.z, b.p.w, b.p.h).make(b.dom.innerHTML);
            cp.focused = true;
            tmp.push(cp);
            cp.draw();
        }

        Block.focus();

        return tmp;
    }


    static remove(){
        for(let b of Block.focused){
            b.visible = false;
            b.remove();
            Block.list = Block.list.filter((o)=> b !== o);
        }
    }

    static isOverlapping(b1, b2) {
        const rect1 = b1.dom.getBoundingClientRect();
        const rect2 = b2.dom.getBoundingClientRect();
      
        return !(
          rect1.right - 1 < rect2.left ||   // rect1がrect2の左にある
          rect1.left + 1 > rect2.right ||   // rect1がrect2の右にある
          rect1.bottom + 1 < rect2.top ||   // rect1がrect2の上にある
          rect1.top - 1 > rect2.bottom      // rect1がrect2の下にある
        );
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
                result = result.filter((r)=>r.pack.innerHTML.includes(v));
            }else if(k === "id"){
                result = result.filter((r)=>r.id == id);
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
        this.gap = {x:0,y:0,z:0,w:0,h:0};
        this.laps = [];
        this.interval = 120;
        this.lastExecutionTime = Date.now();
        
        // DOM情報
        this.dom = null;
        this.head = null;
        this.foot = null;
        this.menu = null;
        this.body = null;
        this.frame = null;
        this.pack = null;
        this.style = {
            backgroundColor: "black",
            color: "white",
        };

        this.focused = false;
        this.copied = false;
        this.moved = false;
        this.active = false;
        this.relations = {};
        this.data = {};

        // 機能の有効化・無効化
        this.movable = false;
        this.resizable = true;
        this.visible = true;
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
        this.storongBackgroundColor = "red";

        this._contextmenu = function(e){console.log(`${this.id}:contextmenu`)};
        this._dblclick = function(e){console.log(`${this.id}:dblclick`)};
        this._keydown = function(e){console.log(`${this.id}:keydown ${e.key}`)};
        this._fit = (p)=>{
            let lap = false;
            for(let b of Block.list){
                if(b.visible === true && b !== this && this.overlap(b)){
                    this.style.backgroundColor = this.storongBackgroundColor;
                    lap = true;
                }
            }
            if(lap === false){
                this.style.backgroundColor = this.baseBackgroundColor;
            }
            this.draw();
        };
        this._collide = (b)=>{b.draw();}
        this._mousemove = null;
        this._resize = null;

        Block.list.push(this);
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

    move(x,y){
        this.gap.x = x - this.x;
        this.gap.y = y - this.y;
        if(this.movableX === true){this.x = x};
        if(this.movableY === true){this.y = y};
    }

    size(w,h){
        this.gap.w = w - this.w;
        this.gap.h = h - this.h;
        if(this.sizableX === true){this.w = w};
        if(this.sizableY === true){this.h = h};
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
        body.style.overflowY = "auto";
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

        const mousemove = function(e){
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
            let lap = false;
            for(let b of Block.list){
                if(b.visible === true && b !== self && self.overlap(b)){
                    self.style.backgroundColor = self.storongBackgroundColor;
                    lap = true;
                }
            }
            if(lap === false){
                self.style.backgroundColor = self.baseBackgroundColor;
            }
        }

        this.mousemove = mousemove;

        // 中処理
        document.body.addEventListener("mousemove", mousemove);
        
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
        this.pack.remove();
        const mousemove = this.mousemove;
        document.body.removeEventListener("mousemove",mousemove);
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
        if(this.visible === true && b.visible === true){
            result = Block.isOverlapping(this,b);
            if(result){
                if(!this.laps.includes(b)){this.laps.push(b);}
                new Promise((resolve)=>{this.collide(b);resolve();});
                new Promise((resolve)=>{b.collide(this);resolve();});
            }else{
                this.laps = this.laps.filter((x)=>x.id !== b.id)
                new Promise((resolve)=>{
                    this.draw();
                    b.draw();
                })
            }
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

    glovalize(){
        this.position = "fixed";
    }

    localize(){
        this.position = "absolute";
    }

    get contextmenu(){
        return this._contextmenu;
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

/**
 * TODO:Touch機能にも対応できるようにする
 */
class Sticky{
    static{
        this.cnt = 0;
        this.list = [];
        this.focused = null;
        this.mouseX = 0;
        this.mouseY = 0;
        // TODO touch
        document.body.addEventListener("mousedown",function(e){
            Sticky.mouseX = e.pageX;
            Sticky.mouseY = e.pageY;
        });
        this.MAX_ZINDEX = 1;
        this.MIN_ZINDEX = 0;
        
        this.canvas = this.canv();
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
    }

    static canv(){
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        canvas.style.height = "100%";
        canvas.style.width = "100%";
        canvas.style.position = "fixed";
        canvas.style.left = "0px";
        canvas.style.top  = "0px";
        canvas.style.pointerEvents = "none";
        // TODO touch
        window.addEventListener("resize",function(){
            canvas.width = Sticky.canvas.offsetWidth;
            canvas.height = Sticky.canvas.offsetHeight;
            Sticky.redraw();
        });
        return canvas;
    }

    static redraw(){

        Sticky.refresh();
        // オブジェクトごとに描画
        for(let s of Sticky.list){
            Sticky.draw(s);
        }
    }

    static refresh(){
        // 描写の初期化
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

    static draw(sticky){

        // 紐づけの描写
        for(let rid of Object.keys(sticky.relations)){
            this.draw_relation_line(sticky, sticky.relations[rid]);
        }
    }

    static draw_relation_line(sticky1,sticky2){
        if(sticky1.pack.style.display === "none" || sticky2.pack.style.display === "none"){return}
        this.ctx.beginPath();
        this.ctx.moveTo(sticky1.pack.offsetLeft,sticky1.pack.offsetTop);
        this.ctx.lineTo(sticky2.pack.offsetLeft,sticky2.pack.offsetTop);
        this.ctx.strokeStyle = "orange";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

    }

    static focus(){
        for(let s of Sticky.list){
            if(s.focused === true){
                s.z = Sticky.MAX_ZINDEX;
            }else{
                s.z = Sticky.MIN_ZINDEX;
            }
        }
    }

    static theme(style){
        DOM.style(`${style}`);
    }

    constructor(x=10,y=10,z=1,w=5,h=5){
        this.id = Sticky.cnt++;
        // 座標情報
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.ratio = {w:1,h:1};
        
        // DOM情報
        this.dom = null;
        this.head = null;
        this.foot = null;
        this.menu = null;
        this.body = null;
        this.frame = null;
        this.pack = null;
        this.style = {
            backgroundColor: "black",
            color: "white",
        };

        this.focused = false;
        this.active = false;
        this.relations = {};

        // 機能の有効化・無効化
        this.movable = false;
        this.resizable = true;
        this.visible = true;

        this._contextmenu = function(e){console.log(`${this.id}:contextmenu`)};
        this._dblclick = function(e){console.log(`${this.id}:dblclick`)};
        this._keydown = function(e){console.log(`${this.id}:keydown ${e.key}`)};
        this._resize = null;

        Sticky.list.push(this);
        console.log(Sticky.list);
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

    get name(){
        return this.constructor.name.toLowerCase();
    }

    move(x,y){
        this.x = x;
        this.y = y;
    }

    size(w,h){
        this.w = w;
        this.h = h;
    }

    make(html="",editable=true){
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

    wrap(selector, editable=true){
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
        dom.style.height = "100%";
        dom.style.width = "100%";
        const pack = document.createElement("div");
        pack.style.position = "fixed";
        pack.style.overflow = "hidden";
        pack.style.border = "solid";
        pack.style.borderWidth = "2px";
        pack.style.borderRadius = "4px";
        const frame = document.createElement("div");
        frame.style.overflow = "hidden";
        frame.style.height = "100%";
        frame.style.width  = "100%";
        const head = document.createElement("div");
        head.style.height = "24px";
        head.style.display = "flex";
        head.style.justifyContent = "space-between";
        const title = document.createElement("div");
        title.innerHTML = "title";
        const menu = document.createElement("div");
        const hide_btn = document.createElement("span");
        hide_btn.textContent = "×";
        hide_btn.style.cursor = "pointer";
        hide_btn.addEventListener("click",function(){
            self.hide();
        });
        
        const settings = document.createElement("span");
        settings.textContent = "■";
        settings.style.cursor = "pointer";
        const edit_btn = document.createElement("span");
        edit_btn.textContent = "〇";
        edit_btn.dataset.edit = "〇";
        edit_btn.dataset.unedit = "●";
        edit_btn.style.cursor = "pointer";
        edit_btn.addEventListener("click",function(){
            const is_edit = self.dom.getAttribute("contenteditable");
            if(JSON.parse(is_edit) === true){
                self.dom.setAttribute("contenteditable",false);
                edit_btn.textContent = edit_btn.dataset.unedit;
            }else{
                self.dom.setAttribute("contenteditable",true);
                edit_btn.textContent = edit_btn.dataset.edit;
            }
        });

        if(editable === true){
            menu.appendChild(edit_btn);
        }

        menu.appendChild(settings);
        menu.appendChild(hide_btn);

        const sub = document.createElement("div");
        sub.style.height = "24px";
        sub.style.display = "flex";
        sub.style.justifyContent = "flex-end";
        const sub_btns = document.createElement("div");
        sub.appendChild(sub_btns);
        head.appendChild(title);
        head.appendChild(menu);
        const foot = document.createElement("div");
        foot.style.height = "24px";
        foot.style.display = "flex";
        foot.style.justifyContent = "space-between";
        const messages = document.createElement("div");
        messages.style.fontSize = "x-small";
        messages.textContent = "foot";
        const controllers = document.createElement("div");
        controllers.style.width = "70%";
        foot.appendChild(messages);
        foot.appendChild(controllers);

        const body = document.createElement("div");
        body.style.overflowY = "auto";
        body.style.textWrap = "wrap";
        body.style.overflowWrap = "break-word";
        body.style.height = "calc( 100% - 72px)";

        body.appendChild(dom);
        frame.appendChild(head);
        frame.appendChild(sub);
        frame.appendChild(body);
        frame.appendChild(foot);
        pack.appendChild(frame);

        // head
        this.head = head;
        this.title = title;
        this.settings = settings;
        this.hide_btn = hide_btn;

        // body
        this.body = body;

        // foot
        this.foot = foot;
        this.messages = messages;
        this.controllers = controllers;

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
        this.head.addEventListener("mousedown",function(e){
            self.movable = true;
            baseL = self.pack.offsetLeft;
            baseT = self.pack.offsetTop;
        });

        // マウスによるリサイズ
        let is_pack = false;
        let is_frame = false;
        let hold = "";
        let baseW = 0;
        let baseH = 0;
        this.pack.addEventListener("mouseover",function(e){
            is_pack = true;
            Sticky.focused = self;
        });
        this.pack.addEventListener("mouseout",function(e){
            is_pack = false;
        });
        this.pack.addEventListener("mousedown",function(e){

            for(let s of Sticky.list){
                s.focused = false;
            }
            self.focused = true;

            Sticky.focus();

            const base = self.pack.getClientRects()[0];
            baseL = base.left - self.borderWidth;   
            baseT = base.top - self.borderWidth;
            baseW = base.width - self.borderWidth;
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

        // 中処理
        document.body.addEventListener("mousemove",function(e){
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
                    (e.pageX - Sticky.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "left"){
                self.move(
                    (e.pageX - Sticky.mouseX + baseL) / self.ratio.w,
                    self.y
                )
                self.size(
                    (-e.pageX + Sticky.mouseX + baseW) / self.ratio.w,
                    self.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "top"){
                self.move(
                    self.x,
                    (e.pageY - Sticky.mouseY + baseT) / self.ratio.h,
                )
                self.size(
                    self.w,
                    (-e.pageY + Sticky.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }else if(hold === "bottom"){
                self.size(
                    self.w,
                    (e.pageY - Sticky.mouseY + baseH) / self.ratio.h,
                );
                self.resize_event(self.ratio);
                self.draw();
                window.getSelection().removeAllRanges();
            }


            // 位置変更
            if(self.movable){
                self.move(
                    (e.pageX - (Sticky.mouseX - baseL)) / self.ratio.w,
                    (e.pageY - (Sticky.mouseY - baseT)) / self.ratio.h
                );
                self.draw();
                window.getSelection().removeAllRanges();
            }

            Sticky.redraw();

        });
        
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
        this.pack.remove();
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

    get contextmenu(){
        return this._contextmenu;
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
    static{
        this.cnt = 0;
        this.list = [];
        this.WORD = {OR:"OR",AND:"AND",DUMMYID:"_dummy_id"};
        this.COMPARISION = {
            EQUAL:"equal",NOT_EQUAL:"not_equal",
            BIGGER:"bigger",SMALLER:"smaller",
            EQUAL_BIGGER:"equal_bigger",EQUAL_SMALLER:"equal_smaller",
            BEFORE:"before",AFTER:"after",
            EQUAL_BEFORE:"equal_before",EQUAL_AFTER:"equal_after",
            INCLUDE:"include",NOT_INCLUDE:"not_include",
            CHECKED:"checked",NOT_CHECKED:"not_checked",
        };
        this.COMPARISION_NAME = {
            EQUAL:"等しい",NOT_EQUAL:"等しくない",
            BIGGER:"大なり",SMALLER:"小なり",
            EQUAL_BIGGER:"以上",EQUAL_SMALLER:"以下",
            BEFORE:"よりも前",AFTER:"よりも後",
            EQUAL_BEFORE:"以前",EQUAL_AFTER:"以後",
            INCLUDE:"含む",NOT_INCLUDE:"含まない",
            CHECKED:"チェックされている",NOT_CHECKED:"チェックされていない",
        };

        this.COMPARISIONLIST = {
            datetime:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"before",name:"以前"},{comparision:"after",name:"以後"}],
            str:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"include",name:"含む"},{comparision:"not_include",name:"含まない"}],
            int:[{comparision:"equal",name:"等しい"},{comparision:"not_equal",name:"等しくない"},{comparision:"equal_bigger",name:"以上"},{comparision:"equal_smaller",name:"以下"}],
            check:[{comparision:"checked",name:"チェックされている"},{comparision:"not_checked",name:"チェックされていない"}]
        };

    }

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
            const d = data[field];
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
            }else if(Filter.COMPARISION.CHECKED === comparision){
                if(typeof(d) === "string"){
                    const dom = document.createElement("div");
                    dom.innerHTML = d;
                    const c = dom.firstElementChild;
                    return c.checked === true;
                }else{
                    return d.checked === true;
                }
            }else if(Filter.COMPARISION.NOT_CHECKED === comparision){
                if(typeof(d) === "string"){
                    const dom = document.createElement("div");
                    dom.innerHTML = d;
                    const c = dom.firstElementChild;
                    return c.checked === false;
                }else{
                    return d.checked === false;
                }
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
        this.diff = this.take_diff();
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
                val = a[field].localeCompare(b[field]) * desc;
            }else if(type === "int"){
                val = a[field] * desc - b[field] * desc; 
            }else if(type === "num"){
                val = a[field] * desc - b[field] * desc; 
            }else if(type === "datetime"){
                val = new Date(a[field]) > new Date(b[field]) ? desc : -1 * desc;
            }else{
                val = a[field].toString().localeCompare(b[field].toString()) * desc;
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

    check(perPage=10,dataLength=-1,activePage=-1){
        const result = []
        if(this.data){
            const len = dataLength === -1 ? this.data.length : dataLength;
            let page_data = [];
            let page_num = 0;
            let cnt = 0;
            for(let i=0; i<len; i++){
                if( i % perPage === 0 && i !== 0){
                    result.push(page_data);
                    page_data = [];
                    page_num++;
                }
                if( activePage === -1){
                    if(this.data[cnt]){
                        page_data.push(this.data[cnt++]);
                    }
                }else if(activePage === page_num){
                    if(this.data[cnt]){
                        page_data.push(this.data[cnt++]);
                    }
                }
            }
            result.push(page_data)
        }
        return result;
    }

    build(){
        if(this.condition){
            const perPage = this.condition.perPage;
            const dataLength = this.condition.dataLength;
            const activePage = this.condition.activePage;
            if(dataLength){
                this.result = this.check(perPage,dataLength,activePage);
            }else{
                this.result = this.check(perPage);
            }
        }
    }
}

class SideMenu extends DOM {

    static list = [];
    static MODE = {LEFT:"left",RIGHT:"right"};
    static CONST = {TO_RIGHT:"&#9655",TO_LEFT:"&#9665",ZINDEX:10};

    constructor(selector="body",mode=SideMenu.MODE.LEFT){
        super(selector);
        this.mode = mode;
        this.css = this.style();
        this.btn_op = null;
        this.btn_cl = null;
        this.btnbar = null;
        this.zIndex = SideMenu.CONST.ZINDEX; /** ここの調整はContextMenu優先か、SideMenu優先か */
        SideMenu.list.push(this);
    }

    style(){
        return SideMenu.list.length > 0 ? null : new Style(`
            .${this.cssClassFrame}{
                height: 100%;
                width: 100%;
                position: absolute;
                left: 0px;
                top: 0px;
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
                width: calc(50% + 16px);
            }

            .sidemenu-contents.right.active{
                left: calc(50% - 16px);
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
        `);
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
        if(this.css !== null && this.css !== undefined){
            this.css.build();
        }
        if(dom !== null && dom !== undefined){
            this.main.appendChild(dom);
        }
        return this.frame;
    }

    append(dom){
        this.main.appendChild(dom);
    }


}

class TabPage extends DOM{

    // static list = [];

    static trun_page(index=0){
        for(let tp of TabPage.list){
            tp.turn_page(index);
        }
    }

    constructor(selector){
        super(selector);
        this.data = {};     //初期データ
        this.pages = {};    //実際の画面DOMデータ
        this.css = this.style();
        // TabPage.list.push(this);
    }

    style(){
        return new Style(`
            .tab-btn{
                background-color: black;
            }
            .tab-btn.active{
                background-color: grey;
            }
        `);
    }

    turn_page(index=0){
        const pagenames = Object.keys(this.pages);
        if(typeof(index)==="string"){
            for(let pagename of pagenames){
                if(index === pagename){
                    this.pages[pagename].style.display = "inline-block";
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }else{
            for(let i=0; i<pagenames.length; i++){
                const pagename = pagenames[i];
                if(index === i){
                    this.pages[pagename].style.display = "inline-block";
                }else{
                    this.pages[pagename].style.display = "none";
                }
            }
        }
    }

    make(){
        const self = this;
        const elm = super.make();
        const tab_frame = document.createElement("div");
        tab_frame.style.height = "24px";
        tab_frame.style.display = "flex";
        tab_frame.style.justifyContent = "start";
        const main_frame = document.createElement("div");
        main_frame.style.height = "calc(100% - 24px)";
        elm.appendChild(tab_frame);
        elm.appendChild(main_frame);
        elm.style.display = "flex";
        elm.style.flexDirection = "column";
        elm.style.height = "100%";

        const pagenames = Object.keys(this.data);
        let p = 0;
        for(let pagename of pagenames){
            const tab_btn = DOM.create("div",{class:"tab-btn"});
            tab_btn.textContent = pagename;
            tab_btn.addEventListener("click",function(){
                self.turn_page(tab_btn.textContent);
                for(let btn of document.querySelectorAll(".tab-btn")){
                    btn.classList.remove("active");
                }
                tab_btn.classList.add("active");
            });
            const tab = document.createElement("div");
            const content = this.data[pagename];
            if(typeof(content) === "string"){
                tab.innerHTML = content;
            }else{
                tab.appendChild(content);
            }
            tab.style.display = "none";
            tab.classList.add(`tab${p}`);
            this.pages[pagename] = tab;
            tab_frame.appendChild(tab_btn);
            main_frame.appendChild(tab);
            p += 1;
        }
        return elm;
    }

    build(){
        super.build();
        this.css.build();
    }
}

class Overlay{
    static id = 0;
    static list = [];
    static SIZE = {WIDTH:window.innerWidth,HEIGHT:window.innerHeight};
    static is_build = false;

    static initializer(){
        window.addEventListener("resize",()=>{
            for(let o of Overlay.list){
                o.resize();  
            }
        });
        this.style().build();
    }

    static style(){
        return new Style(`
            .overlay-canvas{
                height: 100%;
                width: 100%;
                position: relative;
                z-index: 1;
                left:0px;
                top:0px;
                pointer-events: none;
                background-color:none;
                opacity:0.5;
            }
        `);
    }

    constructor(selector){
        if(Overlay.is_build === false){Overlay.initializer();}
        if(selector === "string"){
            this.frame = document.querySelector(selector);
        }else{
            this.frame = selector;
        }
        this.id = Overlay.id++;
        this.canvas = this.make();
        this.frame.appendChild(this.canvas);
        this.resize();
        this.ctx = this.canvas.getContext("2d");
        Overlay.list.push(this);
    }

    make(){
        const canvas = document.createElement("canvas");
        canvas.classList.add("overlay-canvas");
        return canvas;
    }

    resize(){
        this.canvas.width  = `${this.frame.offsetWidth}`;
        this.canvas.height = `${this.frame.offsetHeight}`; 
        this.redraw();
    }

    refresh(){
        // 描写の初期化
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

    text(t,p={x:1,y:1}){
        this.ctx.fillStyle = "orange";
        this.ctx.fillText(t,p.x,p.y);
        return this.ctx;
    }

    draw(){
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.ctx.lineTo(this.canvas.offsetWidth,this.canvas.offsetHeight);
        this.ctx.strokeStyle = "orange";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        return this.ctx;
    }

    redraw(){
        return this;
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
                LABELY:0.0,
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

        // グリッド描画の初期化(x:1440+見出し)
        this.grid = new GridFixLocal(1441,64,128,64,selector,"minute");
        console.log("position",`${this.grid.w * this.ratio.margin_labelX}px 0px`);
        this.dom.style.backgroundPosition = `${this.grid.w * this.ratio.margin_labelX}px 0px`;
        this.dom.style.width  = `${this.grid.w * this.grid.x}px`;
        this.dom.style.height = `${this.grid.h * this.grid.y}px`;

        // 右クリックメニューの初期化
        this.contextmenu = new ContextMenu(selector);
        this.contextmenu.zIndex = ContextMenu.CONST.ZINDEX;
        this.contextmenu.append("コピー",()=>{this.copy();});
        this.contextmenu.append("切り取り",()=>{this.cut();});
        this.contextmenu.append("貼り付け",()=>{this.paste();});
        this.contextmenu.append("挿入",()=>{this.insert();});
        this.contextmenu.append("削除",()=>{this.remove();});
        this.contextmenu.append("検索",()=>{this.find();});
        this.contextmenu.append("次の検索結果",()=>{this.findNext(this.target);});
        this.contextmenu.append("前の検索結果",()=>{this.findBack(this.target);});
        this.contextmenu.append("全選択",()=>{this.selectAll()});
        this.contextmenu.build();

        // ショートカットの初期化
        this.shortcut = new ShortCut(selector);
        this.shortcut.append("c",()=>{this.copy()});
        this.shortcut.append("x",()=>{this.cut()});
        this.shortcut.append("v",()=>{this.paste()});
        this.shortcut.append("i",()=>{this.insert()});
        this.shortcut.append("Delete",()=>{this.remove()});
        this.shortcut.append("f",()=>{this.find()});
        this.shortcut.append("p",()=>{this.findNext(this.target)});
        this.shortcut.append("ArrowUp",()=>{this.findNext(this.target)});
        this.shortcut.append("ArrowRight",()=>{this.findNext(this.target)});
        this.shortcut.append("b",()=>{this.findBack(this.target)});
        this.shortcut.append("ArrowDown",()=>{this.findBack(this.target)});
        this.shortcut.append("ArrowLeft",()=>{this.findBack(this.target)});
        this.shortcut.append("a",()=>{this.selectAll()});
        this.shortcut.build();

        // マウスの場所を登録する処理を追加
        this.dom.addEventListener("mousemove",(e)=>{
            if(this.dom === e.target){
                Block.offsetX = e.offsetX;
                Block.offsetY = e.offsetY;
            }
        });

        // 確認モーダルの初期化
        this.find_mdl = new Modal()
            .set_title("検索")
            .set_yes_btn(()=>{},"OK")
            .set_no_btn (()=>{},"キャンセル");
        this.find_mdl.show_event = ()=>{this.find_mdl.body.querySelector("input").focus()};


        // エラーモーダルの初期化
        this.emdl = new ErrorModal();

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
            .grid-labels{
                width:${this.grid.width}px;
                margin-left:${parseFloat(this.grid.w) * parseFloat(this.ratio.margin_labelX)}px;
            }
            .grid-label{
                width:${this.grid.w}px;
            }
        `).build();
    }

    insert(){
        const base = Block.clicked;
        if(base){
            new Promise((resolve)=>{
                const baseX = base.x;
                const baseY = base.y;
                const blocks = this.page[this.active_page].filter((b)=>b.y >= baseY);
                console.log(base,blocks);
                for(let b of blocks){
                    if(parseInt(b.y) === parseInt(baseY) && parseInt(b.x) === parseInt(baseX)){
                        this.grid.size(b,0,1);
                    }else{
                        this.grid.move(b,0,1);
                    }
                }
                this.item("insert",{x:3,y:parseInt(baseY / this.grid.h),z:1,w:2,h:1});
                resolve();
            });
        }
    }

    copy(){
        const blocks = Block.copy();
        for(let b of blocks){
            this.append(b);
        }
        console.log(blocks);
        return blocks
    }

    remove(o){
        // オブジェクト参照をすべて破棄することで、メモリを解放する
        this.data = this.data.filter((b)=>o !== b);
        for(let i=0; i<this.page.length; i++){
            this.page[i] = this.page[i].filter((b)=>o !== b);
        }
        this.targets = this.targets.filter((t)=>o !== t);
        this.target = null;
        Block.remove();
    }

    cut(){
        Block.cut();
    }

    paste(){
        Block.paste();
    }

    find(){
        this.find_mdl.set_body(`<input placeholder="検索するキーワード" />`);
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
                if(r.visible === true){
                    r.focused = true;
                    this.targets.push(r);
                }
            }
            const t = this.targets[0];
            if(t){
                this.target = t;
                this.scroll(t);
            }
            return t;
        });
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
        for(let d of this.page[this.active_page]){
            d.focused = true;
        }
        Block.focus();
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
        if(!this.data[this.active_data]){
            this.data[this.active_data] = [];
        }
        this.data[this.active_data].push(b);
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
        const m = this.map;
        const row = m[b.p.y];
        const befores = row.slice(1,b.p.x);  //item列はのぞくので、０ではなく、１からスタート
        for(let blocks of befores.reverse()){
            if(blocks.length > 1){
                    this.emdl.show("直前のブロックの候補が複数あります。");
                    target =  null;
                    break;
            }else{
                for(let block of blocks){
                    target = block;
                    break;
                }
            }

            if(target){
                break;
            }
        }
        return target;
    }

    /** 特定のブロックの後ろにあるブロックを取得する */
    after(b){
        let target = null;
        const m = this.map;
        const row = m[b.p.y];
        const befores = row.slice(b.p.x + b.p.w);  //item列はのぞくので、０ではなく、１からスタート
        for(let blocks of befores){
            if(blocks.length > 1){
                    this.emdl.show("直後のブロックの候補が複数あります。");
                    target =  null;
                    break;
            }else{
                for(let block of blocks){
                    target = block;
                    break;
                }
            }

            if(target){
                break;
            }
        }
        return target;
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
    }

    turn_data(index=0){
        this.active_data = index;
        this.pagenatable({perPage:this.grid.y,dataLength:this.data[this.active_data].length});
        this.draw();
    }

    draw(){
        for(let k of Object.keys(this.data)){
            for(let o of this.data[k]){
                o.visible = false;
            }
        }
        for(let i=0; i<this.page.length; i++){
            for(let o of this.page[i]){
                if(i === this.active_page){
                    o.visible = true;
                }else{
                    o.visible = false;
                }
            }
        }
        this.grid.draw();
    }

    build(){
        // 表示データの初期化
        this.turn_data();
        this.turn_page();
        // スタイルの初期化
        Scheduler.style = this.style();
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
                this.array.push(this.toNum(this.next));
                this.i++;
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

class ContextMenu extends DOM{
    static CONST = {ZINDEX:10};

    constructor(selector="body"){
        super(selector);
        this.is_active = false;
        this.zIndex = ContextMenu.CONST.ZINDEX;
        this.color = "white";
        this.backgroundColor = "black";
        this.list = [];
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

    style(){
        return new Style(`
            .frame-${this.type()}{
                position: fixed;
                display: none;
                /* ここのZINDEXの調整は、実装によって調整すべき */
                z-index: ${this.zIndex ?? ContextMenu.CONST.ZINDEX}; 
            }
            .frame-${this.type()}.active{
                display: block;
            }
            .contextmenu-list{
                padding: 4px;
                background-color: ${this.backgroundColor};
                color: ${this.color};
                border-bottom: 1px solid grey;
                min-width: 120px;
            }
            .contextmenu-list:hover{
                background-color: grey;
            }
        `);
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

    show(x,y){
        this.is_active = true;
        this.frame.classList.add("active");
        console.log(x,y);
        this.contents.style.position = "fixed";
        this.contents.style.left = `${x}px`;
        this.contents.style.top = `${y}px`;
        this.contents.style.zIndex = this.zIndex;
        this.contents.style.border = `1px solid grey`;
        this.contents.style.borderRadius = `3px`;
    }
    
    hide(e){
        this.is_active = false;
        this.frame.classList.remove("active");
    }

    event(){
        this.parent.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            e.stopPropagation();
            console.log(e.target);
            this.show(this.autoX(e.pageX),this.autoY(e.pageY));
        });
    }

    autoX(x){
        return x;
    }

    autoY(y){
        return y;
    }

    build(){
        super.build();
        this.css = this.style();
        this.css.build();
        this.event();
        this.set_menu();
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
    static parse_jp = {string:"文字列",number:"数値",boolean:"真偽値",object:"参照型",array:"配列"}

    static type_jp(val){
        let result = "";
        if(typeof(val) === "string" ){
            result = DataEditor.parse_jp[typeof(val)];
        }else if(typeof(val) === "number"){
            result = DataEditor.parse_jp[typeof(val)];
        }else if(typeof(val) === "boolean"){
            result = DataEditor.parse_jp[typeof(val)];
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
                border:1px solid white;
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
                border: 1px solid white;
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
        if(typeof(val) === "string" ){
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
            const headkey = DOM.create("div",{class:"jef-head-key"});
            headkey.textContent = "キー";
            const headtyp = DOM.create("div",{class:"jef-head-typ"});
            headtyp.textContent = "型";
            const headval = DOM.create("div",{class:"jef-head-val"});
            headval.textContent = "値";
            const headcome = DOM.create("div",{class:"jef-head-come"});
            headcome.textContent = "説明";
            header.appendChild(headkey);
            header.appendChild(headtyp);
            header.appendChild(headval);
            header.appendChild(headcome);
            obj.appendChild(header);
            frame.appendChild(obj);
            for(let key of Object.keys(val)){
                const objitem = DOM.create("div",{class:"jef-item"});
                const objkey = DOM.create("div",{class:"jef-key"});
                objkey.appendChild(document.createTextNode(key));
                const objtyp = DOM.create("div",{class:"jef-typ"});
                objtyp.appendChild(document.createTextNode(DataEditor.type_jp(val[key])));
                const objval = DOM.create("div",{class:"jef-val"});
                const objcome = DOM.create("div",{class:"jef-come"});
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
                    console.log(key,val);
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
                let val = part[key];
                const item = this.search_form_by_key(key,frame);
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
            let v = part.querySelector("input").value ?? 0;
            v = v==="" ? 0 : v;
            tmp = JSON.parse(v);
        }else if(part.dataset.type==="jef-bool"){
            tmp = JSON.parse(part.querySelector("input:checked").parentElement.textContent.toLowerCase());
        }else if(part.dataset.type==="jef-array"){
            const item = part.childNodes;
            tmp = [];
            for(let x of item){
                console.log(x);
                tmp.push(this.form_analize(x));
            }
        }else if(part.dataset.type==="jef-object"){
            const item = part.childNodes;
            tmp = {};
            for(let x of item){
                console.log(x.querySelector(":scope > .jef-val"));
                const k = x.querySelector(":scope > .jef-key");
                if(k){
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
        this.form(this.contents,this.data);
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
                });
                const down_btn = DOM.create("span",{class:"down-btn"});
                down_btn.textContent = "▼";
                down_btn.addEventListener("click",()=>{
                    this.down(this.active_dom.dataset.orderid);
                });

                order_btn.appendChild(up_btn);
                order_btn.appendChild(down_btn);
                order_dom.appendChild(order_btn);
                order_dom.appendChild(dom);
                dom.dataset.orderid = i;
            }

            // TODO groupへ切り替わりを監視し、インクリメントする処理を追加する
            // TODO お互いの親と子の紐づけ関係を保持しなければならない。（２つ以上の親子セットがある場合）
            if(dom.parentNode.classList.contains("group") && dom.parentNode.classList.contains("child")){
                dom.dataset.order = cnt;
            }else{
                dom.dataset.order = ++cnt;
            }
            
        }
        return this.dom_list;
    }

    swap(id1,id2){
        console.log(id1,id2);
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
        this.current_dirpath = "";
        this.cm = new ConfirmModal();
        this.dmdl = new Modal().set_no_btn(()=>{},"閉じる");
        this.emdl = new ErrorModal();
        this.data = null;
        this.previewfile = null; 
    }

    style(){
        return new Style(`
            .frame-${this.type()}{
                height:100%;
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
                height:100%;
                width:100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                overflow-y: auto;
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

    post(){
        // サーバへファイルを送信
    }

    get(url,filepath="filename"){
        // サーバからファイルを取得
        let file = null;
        fetch(url) //"/user/download"
        .then(response => response.blob())
        .then(blob=>{
            file = new File([blob], this.filename(filepath), {type:blob.type});
            this.files[filepath] = file
            console.log(file);
            new Promise((resolve)=>{
                const reader = new FileReader();
                reader.onload = () => resolve(f);
                return //reader.readAsText(file);
            });
        });
    }

    filename(filepath=""){
        const separated_list = filepath.split("/");
        return separated_list.length <= 1 ? filepath : filepath.split("/")[separated_list.length - 1];
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
            if(file.name.includes(".png") || file.name.includes(".jpg") || file.name.includes(".gif")){
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
        let dom = null;
        if(type.startsWith("text/")){
            dom = DOM.create("pre",{class:"fd-preview"});
            dom.textContent = this.data;
        }else if(type.startsWith("image/")){
            // 画像データの作成
            dom = DOM.create("img",{class:"fd-preview"});
            dom.src = this.data;
            dom.style.width = "100%";
        }else{
            dom = DOM.create("div");
            dom.textContent = "プレビューに対応していません";
        }
        return dom;
    }

    download(file) {
        // File からオブジェクトURLを作成
        const url = URL.createObjectURL(file);
        // 一時的な <a> 要素を作成
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name; // ダウンロード時のファイル名を設定
        document.body.appendChild(a); // Firefox 対策でDOMに追加
        a.click(); // 自動的にクリック
        document.body.removeChild(a); // 後片付け
        URL.revokeObjectURL(url); // メモリ解放
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
        });
        const folderdrop_input = DOM.create("input",{class:"folderdrop-input"});
        folderdrop_input.type = "file";
        folderdrop_input.setAttribute("webkitdirectory","");
        folderdrop_input.setAttribute("directory","");
        folderdrop_input.setAttribute("multiple","");
        folderdrop_input.addEventListener("change",async (event)=>{
            await this.load(event);
            this.draw();
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

        return elm;
    }

    async dropload(event){
        event.preventDefault();
        const items = event.dataTransfer.items;
        let i = 0;
        for(const item of items){
            i++;
            const entry = item.webkitGetAsEntry();
            if(entry){
                this.traverse_file_tree(entry);
                // await this.traverse_file_tree(entry);
            }
            console.log(item);
        }
        console.log('選択されたファイルの総数:', i, items);

    }

    async traverse_file_tree(entry,path=""){
        if(entry.isFile){
            await new Promise((resolve)=>{
                entry.file((file)=>{
                    console.log(path,file.name);
                    this.files[this.current_dirpath + path + file.name] = file;
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
        // ファイル名一覧を表示
        files.forEach(file => {
            console.log(file.webkitRelativePath || file.name);
            // file.text().then(text=>console.log(text));
            this.files[`${this.current_dirpath}${file.webkitRelativePath || file.name}`] = file;
        });
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
            }else if(d.dirpath.includes(dirpath)){
                const dirname = d.dirpath.replace(dirpath,"").split("/")[0];
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
        // TODO: 右クリックメニュー
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
        const create_btn = DOM.create("div",{class:"fd-create"});
        create_btn.textContent = "フォルダ追加";
        create_btn.style.paddingLeft = "10px";
        create_btn.style.cursor = "pointer";
        create_btn.addEventListener("click",async ()=>{
            let newdir = ""
            this.com.set_body("<input type='textbox' placeholder='新しいフォルダ名を入力してください'/>");
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
                const base_dir = this.files[this.current_dirpath + d]
                this.cm.set_title(d).set_body(`<input type="textbox" placeholder="変更後の名前を入力してください" value="${d}"/>`);
                const newdir_name = await this.cm.confirm(
                    ()=>{return this.cm.body.querySelector("input").value }
                );
                const fps = Object.keys(this.files);
                if(fps.some(fp => fp.startsWith(`${this.current_dirpath}${newdir_name}`))){
                    this.emdl.show("フォルダ名が重複しています。");
                    return;
                }
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
                await this.read(this.files[this.current_dirpath + f]);
                this.dmdl.set_body(this.preview);
                this.dmdl.show();
            });
            const btns = DOM.create("span",{class:"fd-btns"});
            const detail_btn = DOM.create("button",{class:"fd-detail"});
            detail_btn.textContent = "詳細";
            detail_btn.addEventListener("click",async ()=>{
                await this.read(this.files[this.current_dirpath + f]);
                this.dmdl.set_body(this.preview);
                this.dmdl.show();
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
                const base_file = this.files[this.current_dirpath + f]
                this.cm.set_title(f).set_body(`<input type="textbox" placeholder="変更後の名前を入力してください" value="${base_file.name}"/>`);
                const newfile_name = await this.cm.confirm(
                    ()=>{return this.cm.body.querySelector("input").value }
                );
                if(Object.keys(this.files).includes(`${this.current_dirpath}${newfile_name}`)){
                    this.emdl.show("ファイル名が重複しています。");
                    return;
                }
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
        this.tree_area.appendChild(path_info);
        this.tree_area.appendChild(treeup_btn);
        this.tree_area.appendChild(create_btn);
        this.tree_area.appendChild(tree);
    }

    build(){
        super.build();
        this.style().build();
        this.draw();
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

