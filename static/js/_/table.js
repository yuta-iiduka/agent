console.log("table.js is called.");

class Table extends DOM{
    static id = 0;
    static is_init = false;
    static MESSAGE={NODATA:"データはありません。",TRY:"処理中です"}

    /**
     * @summery 日付オブジェクトを文字列のタイムスタンプ型に変換する関数
     * @param {Date} d Dateオブジェクト
     * @param {Boolean} seconds 秒数まで出力するかどうかの
     * @param {String} substitute 変換に失敗した場合の代替文字列
     * @returns 
     */
    static toTimeStamp(d = new Date(), seconds=true, substitute=""){
        let result = !(seconds) ? 
            `${d.getFullYear()}/${("00"+(d.getMonth()+1)).slice(-2)}/${("00"+d.getDate()).slice(-2)} ${("00"+d.getHours()).slice(-2)}:${("00"+d.getMinutes()).slice(-2)}` :
            `${d.getFullYear()}/${("00"+(d.getMonth()+1)).slice(-2)}/${("00"+d.getDate()).slice(-2)} ${("00"+d.getHours()).slice(-2)}:${("00"+d.getMinutes()).slice(-2)}:${("00"+d.getSeconds()).slice(-2)}`;
        if(result.includes("N")){
            result = substitute;
        }
        return result;
    }

    static get_url_param(key){
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    static set_url_param(key,val){
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        params.set(key,val);
        url.search = params.toString();
        window.history.replaceState({},"",url);
    }

    static get_request_url(path,param=null){
        return `${window.location.origin}/${path}${param || window.location.search}`;
    }

    static style = `
        .frame-${this.name.toLowerCase()}{
        }
        .table-frame{

        }
        .table{
            background-color: #33363B;
            padding:0px;
            margin:0px;
            table-layout:auto;
        }
        .thead{
            // position: sticky;
            // top: 48px;
            // top:0;
            // width: auto;
            background-color: #33363B;
        }
        .thead th{
            white-space: nowrap;
        }
        .thead tr{
        }
        .tbody{

        }
        .tbody tr{
        }
        .tbody tr.active{
            background-color: #222222;
        }
        .tbody tr[data-active=true]{
            background-color:rgb(0, 136, 255);
        }
        .tbody tr:hover{
            background-color:rgb(135, 188, 210);
        }
        .tbody td{
            height: 24px;
            // word-break: break-word;
            // white-space: nowrap;
        }
        .tfoot td{
            text-wrap: nowrap;
            text-align: center;
        }
        .ui_tableinfo{
            background-color: #33363B;
            height: 36px;
            margin-bottom: 8px;
            border-bottom: 1px solid grey;
            display: flex;
            justify-content: space-between;
        }
        .ui_info_left{
            padding:4px;
        }
        .ui_info_right{
            padding:4px;
        }
        .ui_info_sub{
            display:flex;
            padding:4px;
            justify-content: space-between;
        }
        .ui_filter{
            position: sticky;
            top: 0px;
            display: flex;
            gap: 8px;
            height: 48px;
            align-items: center;
            background-color: #33363B;
        }
        .filter_btn{
            cursor: pointer;
            border: solid 1px white;    
        }
        .and_frame{
            display: block;
            width: calc(100% - 16px);
            gap: 8px;
            margin:4px;
            padding:4px;
        }
        .and_frame * {
            display: inline-flex;
            margin:2px;
            // padding:2px;
            height:32px;
        }
        .and_frame:not(:last-child)::after{
            content: "AND";
            display: block;
        }
        .or_frame{
            width: calc(100% - 18px);
            border: solid 1px grey;
            margin:4px;
            padding:4px;
        }
        .or_frame:not(:last-child)::after{
            content: "OR";
            display:block;
        }
        .or_head{
            display: flex;
            width: calc(100% - 4px);
            gap: 8px;
            // border: solid 1px grey;
            padding: 2px;
        }
        .or_head > :last-child{
            margin-left: auto;
        }
        .or_body{
            width: calc(100% - 4px);
            border: solid 1px grey;
            padding-left: 2px;
            padding-right: 2px;
        }
        .add_or_frame{
            display:inline-block;
            cursor:pointer;
            border: solid 1px white;
            text-align: center;
            align-content:center;
            min-width: 120px;
        }
        .del_or_frame{
            display:inline-block;
            cursor:pointer;
            border: solid 1px white;
            align-content:center;
            text-align: center;
            min-width: 120px;
        }
        .add_and_frame{
            display:inline-block;
            cursor:pointer;
            border: solid 1px white;
            align-content:center;
            text-align: center;
            min-width: 120px;
        }
        .del_and_frame{
            display:inline-block;
            cursor:pointer;
            border: solid 1px white;
            align-content:center;
            text-align: center;
            min-width: 120px;
            width:120px;
            height:30px;
        }
        .ui_pagination{
            display: flex;
            gap: 8px;
            height: 48px;
            align-items: center;
            justify-content: center;
        }
        .pagination-btn{
            // width: 24px;
            width: auto;
            text-align: center;
            cursor: pointer;
        }
        .pagination-space{
            width: 24px;
            text-align: center;
        }
        .pagination-space{
            width: 24px;
            text-align: center;
        }
        .table-scroll-frame{
            display:block;
            width:100%;
            height:100%;
            // min-height: 240px;
            overflow:auto;
        }
        .select_and_frame{
            background-color:black;
            color:white;
        }
    `;

    constructor(selector){
        super(selector);
        this.dom_id = this.index();
        this.id = Table.id++;
        this._rid = 0;
        this._data = null;
        this._rows = null;
        this._columns = null;
        this._diff = null;
        this._base = null;
        this._title = "";

        this.table = null;
        this.head = null;
        this.body = null;
        this.foot = null;
        this.ui = {};

        this.page = 0;
        this.page_data = [];

        this.is_sortable = true;
        this.is_filtable = true;
        this.is_paginate = true;
        this.is_request = false;
        this.is_update = false;
        this.is_reload = false;

        this.active_filterable = true;
        this.active_sortable = true;
        this.active_paginate = true;

        this.selectable = "multiple"; // "single", "disable";
        this.active_trs = [];

        this.active_tr = null;
        this.active_td = null;
        this.active_th = null;

        this.click_th = null;
        this.click_tr = null;
        this.click_td = null;
        this.view = null;

        this.message_tr = null;

        this.filter_modal = null;
        this.filter_condition = [];
        
        this.get_url=window.location.origin;

    }

    get width(){
        return this.frame.style.width
    }

    set width(w){
        this.frame.style.width = w;
    }

    get height(){
        return this.frame.style.height;
    }

    set height(h){
        this.frame.style.height = h;
    }

    get title(){
        return this._title;
    }

    set title(t){
        this._title = t;
        if(this.left){this.info_left.textContent = t}
    }

    get rid(){
        return this._rid;
    }

    set rid(i){
        this._rid = i;
    }

    get so(){
        return JSON.parse(Table.get_url_param(`so${this.id}`));
    }

    set so(param){
        Table.set_url_param(`so${this.id}`,JSON.stringify(param));
    }

    get fi(){
        return JSON.parse(Table.get_url_param(`fi${this.id}`));
    }

    set fi(param){
        Table.set_url_param(`fi${this.id}`,JSON.stringify(param));
    }

    /**
     * ページネーションのアクティブなページのインデックス(page)
     */
    get pa(){
        return JSON.parse(Table.get_url_param(`pa${this.id}`));
    }

    set pa(param){
        Table.set_url_param(`pa${this.id}`,JSON.stringify(param));
    }

    /**
     * ページネーションの１ページ当たりのレコード数(per page)
     */
    get pp(){
        return JSON.parse(Table.get_url_param(`pp${this.id}`));
    }

    set pp(param){
        Table.set_url_param(`pp${this.id}`,JSON.stringify(param));
    }

    /**
     * ページネーションのデータ量(data length)
     */
    get dl(){
        return JSON.parse(Table.get_url_param(`dl${this.id}`));
    }

    set dl(param){
        Table.set_url_param(`dl${this.id}`,JSON.stringify(param));
    }

    get result_info(){
        let total = 0;
        let start = 0;
        let end   = 0;
        if(this.dl){
            total = this.dl;
        }else{
            total = this.rows.length;
        }
        if(this.is_paginate && this.pa !== null){
            start = (this.pa * this.pp) + 1;
        }

        if(this.is_paginate && this.pa !== null){
            end = start + Object.keys(this.page_data[this.pa]).length - 1; // this.rowsの方がよいか？
        }else{
            end = this.rows.length; //totalの方がよいか？
        }
        if(start > end){ start = end}
        return `検索結果：${total}件（${start}-${end}件 表示中）`;
    }

    /**
     * テーブルの基本データ
     */
    get data(){
        return this._data || [];
    }

    set data(data){
        try{
            this.rid = 0;
            if(data !== null && data !== undefined && data.length !== undefined){
                for(let d of data){
                    if( Object.keys(d).includes("dataset")){
                        d.dataset.rid = this.rid++;
                        d.dataset.active = d.dataset.active ?? false;
                    }else{
                        d.dataset = {};
                        d.dataset.rid = this.rid++;
                        d.dataset.active = false;
                    }
                }
            }
        }catch(e){
            console.error(e);
        }

        this._data = data;
        this._rows = data;
    }

    push(d){
        if( Object.keys(d).includes("dataset")){
            d.dataset.rid = this.rid++;
            d.dataset.active = d.dataset.active ?? false;
        }else{
            d.dataset = {};
            d.dataset.rid = this.rid++;
            d.dataset.active = false;
        }
        this._data.push(d);
    }

    /**
     * 各機能の状態に応じて参照されるレコードデータ
     */
    get rows(){
        // 利用する機能に応じた部分データを返却
        return this._rows;
    }

    set rows(data){
        this._rows = data;
    }

    get diff(){
        return this._diff === null ? [] : this._diff;
    }

    set diff(data){
        this._diff = data;
    }

    get base(){
        return this._base === null ? [] : this._base;
    }

    set base(data){
        this._base = data;
    }

    /**
     * 各機能の状態に応じて参照されるカラムデータ
     */
    get columns(){
        return this._columns;
    }

    set columns(data){
        this._columns = data;
    }
    
    get head_trs(){
        return this.head === null ? null : this.head.querySelectorAll("tr");
    }

    get body_trs(){
        return this.body === null ? null : this.body.querySelectorAll("tr");
    }

    get foot_trs(){
        return this.foot === null ? null : this.foot.querySelectorAll("tr");
    }

    add(row){
        if(row !== null && row !== undefined){
            if( Object.keys(row).includes("dataset")){
                row.dataset.rid = this.rid;
            }else{
                row.dataset = {"rid":this.rid};
            }
        }
        this.data.push(row);
        return row.dataset.rid;
    }

    find(rid){
        let row = null;
        let index = null;
        for(let i=0; i<this.rows.length; i++){
            let r = this.rows[i];
            const keys = Object.keys(r);
            if( keys.includes("dataset") && r.dataset.rid == rid){
                row = r;
                index = i;
                break;
            }
        }
        return {"row":row, "index":index};
    }

    tr(func){
        this.click_tr = func;
        return this;
    }

    td(func){
        this.click_td = func;
        return this;
    }

    th(func){
        this.click_th = func;
        return this;
    }

    /**
     * 見出しを生成する関数
     * @param {*} columns [{field,label,type},...]
     */
    header(columns){
        const tr = document.createElement("tr");
        const self = this;
        for(let c of columns){
            const th = document.createElement("th");
            if(c.dataset){ 
                for(let d of Object.values(c.dataset)){
                    td.dataset[d] = d;
                }
            }
            th.dataset.field = c.field;
            th.dataset.type = c.type;
            if(typeof(c.label) !== "object"){
                th.innerHTML = c.label;
            }else{
                th.appendChild(c.label);
            }
            th.addEventListener("click",function(){
                self.active_th = th;
                if(typeof(self.click_th) === "function"){
                    self.click_th(th);
                }
            });
            tr.appendChild(th);
        }
        this.head.appendChild(tr);
        return tr;
    }

    footer(){
        const tr = document.createElement("tr");
        tr.style.display = "none";
        const td = document.createElement("td");
        const ths = this.head.querySelectorAll("th");
        td.colSpan = ths.length;
        td.textContent = Table.MESSAGE.NODATA;
        if(ths.length>0){
            tr.appendChild(td);
            this.foot.appendChild(tr);
        }
        this.message_tr = tr;
        return tr;
    }

    /**
     * レコードを生成する関数
     * @param {*} tr [{field,value,dataset},...]
     */
    insert(row){
        const tr = document.createElement("tr");
        const self = this;
        if(row.dataset){ 
            for(let k of Object.keys(row.dataset)){
                tr.dataset[k] = row.dataset[k];
            }
        }

        const fields = Object.keys(row)
        for(let field of fields){
            if(field === "_dummy_id"){continue}
            
            if ( field.startsWith("_")===false && !(field === "dataset")){
                const td = document.createElement("td");
                td.dataset[field] = field;
                if(typeof(row[field])!=="object"){
                    td.dataset.value = row[field];
                    td.innerHTML     = row[field];
                }else{
                    // objectであれば、その要素のvalueもしくはその子要素のvalueプロパティを格納する
                    if(row[field].childElement){
                        td.dataset.value = row[field].childElement.value;
                    }else{
                        td.dataset.value = row[field].value ?? row[field].textContent ?? row[field].toString();
                    }
                    td.appendChild(row[field]);
                }
                td.addEventListener("click",function(){
                    self.active_td = td;
                    if(typeof(self.click_td) === "function"){
                        self.click_td(td);
                    }
                });
                tr.appendChild(td);
            }else if(field === "dataset"){
                const keys = Object.keys(row[field]);
                for(let k of keys){
                    tr.dataset[k] = row[field][k];
                }
            }else{
                const td = document.createElement("td");
                td.dataset[field] = field;
                td.dataset.value = row[field];
                try{
                    td.appendChild(row[field]);
                }catch(e){
                    console.error(row[field],field);
                }
                tr.appendChild(td);
            }
        }

        tr.addEventListener("click",function(){
            if(tr.dataset.active === "true"){
                tr.dataset.active = "false";
                self.active_tr = null;
                self.active_trs = [];
            }else{
                tr.dataset.active = "true";
                self.active_tr = tr;
                self.active_trs = [];
            }

            for(let btr of self.body_trs){
                if(self.selectable === "disable"){
                    btr.dataset.active = "false";
                }else if(self.selectable === "single"){
                    if(parseInt(tr.dataset.rid) === parseInt(btr.dataset.rid)){
                        btr.dataset.active = tr.dataset.active;
                        if(btr.dataset.active === "true"){
                            self.active_trs.push(tr);
                        }
                    }else{
                        btr.dataset.active = "false";
                    }
                }else{
                    if(btr.dataset.active === "true"){
                        self.active_trs.push(btr);
                    }
                }
            }
            for(let r of self.data){
                if(parseInt(tr.dataset.rid) === parseInt(r.dataset.rid)){
                    r.dataset.active = tr.dataset.active;
                }else if(self.selectable === "disable"){
                    r.dataset.active = "false";
                }else if(self.selectable === "single"){
                    r.dataset.active = "false";
                }
            }
            if(typeof(self.click_tr) === "function"){
                self.click_tr(tr);
            }
        });
        this.body.appendChild(tr);
        return tr;
    }

    /**
     * 複数レコードの追加をする関数
     * @param {*} rows 
     * @returns {Array}
     */
    inserts(rows){
        const trs = [];
        if(!rows){return trs;}
        for(let row of rows){
            trs.push(this.insert(row));
        }
        return trs;
    }

    /**
     * @param {*} search_condition [{comparision:x,field:x,value:x}]
     * @param {*} update_condition [{field:x,value:x}]
     * @returns 
     */
    update(search_condition,update_condition){
        const tmp_data = [...this.data];
        if(search_condition !== null && search_condition.length > 0){
            const filter = new Filter(search_condition,tmp_data);
            filter.build();
            const diff = filter.diff;
            const result = filter.result;
            for(let r of result){
                for(let u of update_condition){
                    r[u.field] = u.value;
                }
            }
            console.log(diff);
            console.log(result);
            this.data = [...result, ...diff].sort(function(a,b){
                return a["_dummy_id"] > b["_dummy_id"];
            });
            return this.data;
        }
        return tmp_data;
    }

    /**
     * [{comparision:x,field:x,value:x}]
     * @param {*} condition 
     * @returns 
     */
    delete(condition){
        const tmp_data = [...this.data];
        if(condition !== null && condition.length > 0){
            const filter = new Filter(condition,tmp_data);
            filter.build();
            this.data = filter.diff;
            return filter.diff;
        }
        return tmp_data;
    }

    /**
     * リクエスト
     */
    async fetch(url=null){
        // 画面遷移を伴う通信でデータを取得する場合
        // 初期化時に何もしないで、それ以降にソートリクエストを送る

        // 画面遷移を伴わない通信でデータを取得する場合
        // 初期化時にソートリクエストを送る
        const rj = new RequestJSON();
        await rj.fetchGET(url || this.get_url);
        // this.data = rj.res_data;
        // this.rows = rj.res_data;
        if(typeof(this.flash) === "function"){
            // データ量は毎回変わるかもしれないためメンバ変数へ格納する。
            if(rj.res_data.dl){
                this.dl = rj.res_data.dl;
            }
            this.flash(rj.res_data);
        }
        // console.log(this.data);
    }


    reload(){
        window.location.reload();
    }

    /**
     * フィルター機能
     * &fi0=[[{"field":"id",%20"value":1,%20"comparision":"equal"}]]
     */
    filter(){
        if(this.fi !== null && this.fi.length > 0){
            const filter = new Filter(this.fi,this.data);
            filter.build();
            this.diff = filter.diff;
            this.base = filter.result;
            return filter.result;
        }
        return this.data;
    }

    /**
     * ソート機能
     */
    sort(){
        const sort = new Sort(this.so,this.rows);
        sort.build();
        return sort.result;
    }

    /**
     * ページネーション機能
     */
    paginate(){
        const index = this.is_request === true ? parseInt(this.pa) : -1;
        const pagination = new Pagination({perPage:this.pp,dataLength:this.dl,dummyIndex:index},this.rows);
        pagination.build();
        return pagination.result;
    }

    turn_page(index){
        if(this.page_data !== null && this.page_data.length > 0){
            let i = null;
            const pa = this.pa;
            if(typeof(index) === "number"){
                i = index;
            }else if( index === "first" ){
                i = 0;
            }else if( index === "last" ){
                i = this.page_data.length - 1;
            }else if( index === "prev" ){
                if(pa > 0 ){
                    i = pa - 1;
                }else{
                    i = 0;
                }
            }else if( index === "next" ){
                if(pa < this.page_data.length - 1){
                    i = pa + 1;
                }else{
                    i = this.page_data.length - 1
                }
            }
            if(this.page_data[i] !== undefined){
                this.pa = i;
                this.draw();
            }
        }
    }

    /**
     * フィルターUI作成
     * @returns 
     */
    ui_filter(){
        const old = document.querySelector(`#ui_filter${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_filter",id:`ui_filter${this.id}`});
    }

    /**
     * ソートUI作成
     * @returns 
     */
    ui_sort(){
        const old = document.querySelector(`#ui_sort${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_sort",id:`ui_sort${this.id}`});
    }

    /**
     * ページネーションUI作成
     * @returns 
     */
    ui_pagination(){
        const old = document.querySelector(`#ui_pagination${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_pagination",id:`ui_pagination${this.id}`});
    }

    /**
     * テーブル情報UI作成
     * @returns
     */

    ui_info(){
        const old = document.querySelector(`#ui_tableinfo${this.id}`);
        if(old){old.remove();}
        this.info = DOM.create("div",{class:"ui_tableinfo",id:`ui_tableinfo${this.id}`});
        this.info_left = DOM.create("div",{class:"ui_info_left",id:`ui_info_left${this.id}`});
        this.info_left.textContent = this.title;
        this.info_right = DOM.create("div",{class:"ui_info_right",id:`ui_info_right${this.id}`});
        this.info.appendChild(this.info_left);
        this.info.appendChild(this.info_right);
        return this.info;
    }

    ui_info_sub(){
        this.info_sub = DOM.create("div",{class:"ui_info_sub",id:`ui_info_sub${this.id}`});
        return this.info_sub;
    }

    ui_scroll_frame(){
        // テーブルのスクロールフレームを追加
        this.scroll_frame = DOM.create("div",{id:`table-scroll-frame${this.id}`,class:"table-scroll-frame"});
        this.scroll_frame.appendChild(this.table);
        return this.scroll_frame;
    }

    set_title(t){
        this.info_left.textContent = t;
        this.title = t;
        return this;
    }

    set_info(i=""){
        if(typeof(i)==="string"){
            this.info_sub.innerHTML = i;
        }else{
            this.info_sub.appendChild(i);
        }
        return this;
    }


    /**
     * 表示されているTableタグからカラムデータを抽出する関数
     * [{field:"id",label:"ID",type:"int"},{field:"name",label:"NAME",type:"str"}];
     * @returns Array
     */
    load_columns(){
        const ths = this.head.querySelectorAll("th");
        const t = [];
        for(let th of ths){
            t.push({
                field: th.dataset.field,
                label: th.innerHTML,
                type:  th.dataset.type
            })
        }
        return t;
    }

    /**
     * 表示されているTableタグからレコードデータを抽出する関数
     * [{field name: value}]
     * @param is_simple_table テーブルの各レコードデータは数値やテキストやチェックボックスなどの単一のデータ:true,複数の要素:false（レコード内に、複数の要素などがあるかどうか）
     * @returns Array
     */
    load_rows(is_simple_table=true){
        const trs = this.body.querySelectorAll("tr");
        const columns = this.load_columns();
        const t = [];
        for(let tr of trs){
            const c = {};
            let tds = tr.querySelectorAll("td");
            for(let td of tds){
                for(let col of columns){
                    if( Object.keys(td.dataset).includes(col.field) ){
                        if(is_simple_table){
                            c[col.field] = td.firstChild || td.innerHTML;
                        }else{
                            c[col.field] = td.querySelector(":scope > *") || td.innerHTML;
                        }
                    }
                }
            }
            if(Object.keys(tr.dataset).length > 0){
                c["dataset"] = tr.dataset;
            }
            t.push(c);
        }
        return t;
    }

    /**
     * テーブルのDOMを生成する関数（オーバライド必須）
     * @returns 
     */
    make(){
        return super.make();
    }

    /**
     * テーブル初期化後の動作（オーバーライド用）
     */
    build(){
        if(Table.is_init === false){
            this.css = new Style(Table.style);
        }
        super.build();
        this.frame.classList.add("table-frame");
        return this.frame
    }

    /**
     * テーブルの描画関数(オーバーライド必須)
     * @returns 
     */
    draw(){
        if( typeof(this.view) === "function"){
            this.view();
        }
        return;
    }

    show(){
        this.frame.style.display ="none";
    }

    hide(){
        this.frame.style.display ="inline-block";
    }

    show_message(m=Table.MESSAGE.NODATA){
        this.message_tr.querySelector("td").textContent = m;
        this.message_tr.style.display = "table-row"; //"inline-block";
    }

    hide_message(){
        this.message_tr.style.display = "none";
    }

}


/**
 * ソート、フィルター、ページネーション機能を提供するクラス
 * 
 */
class TableBuilder extends Table{
    static prefix = "t_";

    constructor(selector){
        super(selector);

        this.is_built = false;
        this.adjust_height = 24;
    }

    /**
     * テーブルを生成する
     * @returns table
     */
    make(){
        // テーブルの初期化
        this.table = DOM.create("table", {id:`table${this.id}`,class:"table"});
        this.head  = DOM.create("thead", {id:`thead${this.id}`,class:"thead"});
        this.body  = DOM.create("tbody", {id:`tbody${this.id}`,class:"tbody"});
        this.foot  = DOM.create("tfoot", {id:`tfoot${this.id}`,class:"tfoot"});
        DOM.append(this.table,[this.head,this.body,this.foot]);

        // 見出しの追加
        const columns = this.columns;
        if( columns && columns.length > 0 ){
            this.header(columns);
            this.footer();
        }

        return this.table;
    }

    /**
     * 設定後の初期化
     * @returns 
     */
    build(){
        if(this.is_paginate && this.pp === null){
            this.pp = 10;
        }
        if(this.is_paginate && (this.pa === null || this.pa < 0)){
            this.pa = 0;
        }
        super.build();
        // フレームの追加
        this.frame.prepend(this.ui_info_sub());
        this.frame.prepend(this.ui_info());
        this.frame.appendChild(this.ui_scroll_frame());
        this.frame.style.height = "auto";
        this.frame.style.width  = "auto";

        
        // 描画
        this.draw();
        this.is_built = true;
        
        return this;
    }

    calc_scroll_frame(){
        // フレームの最大値を初期化
        this.scroll_frame_height = parseInt(getComputedStyle(this.frame.parentElement).height) - parseInt(getComputedStyle(this.info).height) - parseInt(getComputedStyle(this.info_sub).height);
        if(this.is_filtable){
            this.scroll_frame_height -= parseInt(getComputedStyle(this.ui.filter).height);
        }
        if(this.is_paginate){
            this.scroll_frame_height -= parseInt(getComputedStyle(this.ui.pagination).height);
        }
        // 余白
        this.scroll_frame_height -= this.adjust_height;
    }

    resize(){
        this.calc_scroll_frame();
        this.scroll_frame.style.height = `${this.scroll_frame_height}px`;
        return super.resize();
    }

    /**
     * レコードの描画やその操作UIの描画
     */
    draw(){
        this.body.innerHTML = "";
        this.rows = this.data;

        // データ更新を伴う場合
        if(this.is_update === true){
            this.fetch().then(()=>{
                this.set_ui();
                // tbodyにレコードを追加
                if( this.rows && this.rows.length > 0 ){
                    // 設定に応じて描写
                    this.inserts(this.rows);
                }

                this.calc_scroll_frame();
                this.scroll_frame.style.height = `${this.scroll_frame_height}px`;
                return super.draw();
            });
            return;

        // データリロードを伴う場合
        }else if(this.is_reload === true){
            // ビルド前にリロードはしない(無限ループになるため)
            this.reload();
        // データ更新を伴わない場合
        }else{
            this.set_ui();
            // if(this.is_filtable){
            //     if(this.active_filterable){
            //         if(this.fi){this.rows = this.filter();}
            //     }else{
            //         this.diff = null;
            //     }
            //     this.ui.filter = this.ui_filter();
            //     this.frame.prepend(this.ui.filter);
            // }
            // if(this.is_sortable){
            //     if(this.so){this.rows = this.sort();}
            //     this.ui_sort();
            // }
            // if(this.is_paginate){
            //     if(typeof(this.pp) === "number" && this.pp > 0){this.page_data = this.paginate();}
            //     this.ui.pagination = this.ui_pagination();
            //     this.frame.append(this.ui.pagination);
            //     if(typeof(this.pa) === "number"){
            //         this.rows = this.page_data[this.pa];
            //     }else{
            //         this.rows = this.page_data[0];
            //     }
            // }
        }
        // tbodyにレコードを追加
        if( this.rows && this.rows.length > 0 ){
            // 設定に応じて描写
            this.inserts(this.rows);
        }

        this.calc_scroll_frame();
        this.scroll_frame.style.height = `${this.scroll_frame_height}px`;
        return super.draw();
    }

    set_ui(){
        if(this.is_filtable){
            if(this.active_filterable){
                if(this.fi){this.rows = this.filter();}
            }else{
                this.diff = null;
            }
            this.ui.filter = this.ui_filter();
            this.frame.prepend(this.ui.filter);
        }
        if(this.is_sortable){
            if(this.so){this.rows = this.sort();}
            this.ui_sort();
        }
        if(this.is_paginate){
            if(typeof(this.pp) === "number" && this.pp > 0){this.page_data = this.paginate();}
            this.ui.pagination = this.ui_pagination();
            this.frame.append(this.ui.pagination);
            if(typeof(this.pa) === "number"){
                this.rows = this.page_data[this.pa];
            }else{
                this.rows = this.page_data[0];
            }
        }
    }

    ui_filter(){
        const ui = super.ui_filter();
        const self = this;

        // 関数内関数を定義する
        /**
         * １．フィルターのリストからOR条件を追加する関数
         * @param {*} dom 
         * @param {*} condition [{},{},..]
         */
        function add_or_con(dom,condition){

            function make_frame(){
                // ORフレーム
                const _of  = DOM.create("div",{class:"or_frame"});
                const _of_hd = DOM.create("div",{class:"or_head"});
                const _of_bd = DOM.create("div",{class:"or_body"});

                // ORセレクタ
                const sel_af = DOM.create("select",{class:"select_and_frame"});
                for(let col of self.columns){
                    if(col.type.startsWith("_")){continue}
                    const option = document.createElement("option");
                    option.value = col.field;
                    option.dataset.typ = col.type;
                    option.dataset.fld = col.field;
                    if(typeof(col.label)!=="object"){
                        option.dataset.lbl = col.label;
                        option.textContent = `${col.label}:${col.type}`;
                    }else{
                        option.dataset.lbl = col.type;
                        option.textContent = `${col.type}`;
                    }
                    sel_af.appendChild(option);
                }

                // AND条件追加
                const add_af = DOM.create("div",{class:"add_and_frame"});
                add_af.textContent = "項目追加"
                add_af.addEventListener("click",function(){
                    const opt = sel_af.options[sel_af.selectedIndex];
                    add_and_con(_of_bd,[{field:opt.dataset.fld, value:"", comparision:"", type:opt.dataset.typ, label: opt.dataset.lbl}]);
                });

                // OR条件削除
                const del_of = DOM.create("div",{class:"del_or_frame"});
                del_of.textContent = "削除";
                del_of.addEventListener("click",function(){
                    // del_of.parentElement.parentElement.remove();
                    _of.remove();
                });
                
                _of_hd.appendChild(sel_af);
                _of_hd.appendChild(add_af);
                _of_hd.appendChild(del_of);

                _of.appendChild(_of_hd);
                _of.appendChild(_of_bd);
                dom.appendChild(_of);
                return _of_bd;
            }

            if(condition.length>0){
                for(let con of condition){
                    add_and_con(make_frame(),con);
                }
            }else{
                make_frame();
            }
        }

        /**
         * OR条件内のAND条件を追加する関数
         * @param {*} dom 
         * @param {*} condition {field:opt.dataset.fld, value:"", comparision:"", type:opt.dataset.typ, label: opt.dataset.lbl}
         */
        function add_and_con(dom,condition){

            function make_frame(con){
                // ANDフレーム
                const _af = DOM.create("div",{class:"and_frame"});
                _af.dataset.type = con.type;
                // AND条件対象名
                const name_af = DOM.create("div",{class:"and_name"});
                name_af.dataset.field = con.field;
                name_af.textContent = con.label;

                // AND比較演算子選択
                const sel_af = DOM.create("select",{class:"select_and_frame"});
                // ANDフォーム
                const form_af = DOM.create("input",{class:"and_form"});
                form_af.value = con.value;
                if(con.type === "check"){
                    form_af.style.display = "none";
                }

                // AND削除ボタン
                const del_af = DOM.create("div",{class:"del_and_frame"});
                del_af.textContent = "削除";
                del_af.addEventListener("click",function(){
                    _af.remove();
                });
                _af.appendChild(name_af);
                _af.appendChild(add_option(sel_af,con.type,con.comparision));
                _af.appendChild(form_af);
                _af.appendChild(del_af);
                return _af;
            }

            // 手動追加する場合、カラムの型（文字列、日付）などに応じて比較演算子リストを追加する関数
            function add_option(select, type, comparision){
                const com_list = Filter.COMPARISIONLIST[type];
                if(com_list !== undefined){
                    for(let com of com_list){
                        const opt = document.createElement("option");
                        opt.textContent = com.name;
                        opt.value = com.comparision;
                        if(com.comparision === comparision){
                            opt.selected = true;
                        }
                        select.appendChild(opt);
                    }
                }
                return select;
            }

            for(let con of condition){
                dom.appendChild(make_frame(con));
            }
        }

        // フィルターモーダルボタン起動
        const filter_btn = DOM.create("div",{id:`filter_btn${this.id}`,class:"filter_btn"});
        filter_btn.textContent = "フィルタ設定";
        filter_btn.addEventListener("click",function(){
            self.filter_modal.set_body("");
            if(self.fi !== null){
                add_or_con(filter_modal.body,self.fi);
            }else{
                add_or_con(filter_modal.body,[]);
            }
            filter_modal.show();
        });

        // フィルターの有効・無効を切り替える
        const filter_checkbox = DOM.create("div",{id:`filter_checkbox${this.id}`,class:"filter_checkbox"});
        const filter_checkbox_input = DOM.create("input");
        filter_checkbox_input.type = "checkbox";
        filter_checkbox_input.checked = self.active_filterable;
        const filter_checkbox_label = DOM.create("label");
        filter_checkbox_label.appendChild(filter_checkbox_input);
        filter_checkbox_label.appendChild(document.createTextNode("フィルタ適用"));
        filter_checkbox_input.addEventListener("click",function(){
            const check = filter_checkbox_input.checked;
            self.active_filterable = check;
            if(check === false){
                self.filter_condition = self.fi;
                self.fi = [];
            }else{
                self.fi = self.filter_condition;
            }
            self.draw();
        });
        
        filter_checkbox.appendChild(filter_checkbox_label);
        ui.append(filter_btn);
        ui.append(filter_checkbox);

        // モーダルの初期化
        if(this.filter_modal === null){
            const add_of = DOM.create("div",{class:"add_or_frame"});
            add_of.textContent = "OR条件追加";

            // ORフレーム追加ボタン
            add_of.addEventListener("click",function(){
                add_or_con(self.filter_modal.body,[]);
            });

            const del_of = DOM.create("div",{class:"del_or_frame"});
            del_of.textContent = "フィルタ全件削除";
            // ORフレーム全条件削除ボタン
            del_of.addEventListener("click",function(){
                const or_frames = self.filter_modal.body.querySelectorAll(".or_frame");
                for(let or_frame of or_frames){
                    or_frame.remove();
                }
            });

            this.filter_modal = new Modal()
                .set_title("フィルター")
                .set_body("")
                .set_yes_button(function(){
                    const or_frames = self.filter_modal.body.querySelectorAll(".or_frame");
                    const or_filter = [];
                    for(let or_frame of or_frames){
                        // OR条件を追加
                        let and_frames = or_frame.querySelectorAll(".and_frame");
                        const and_filter = [];
                        for(let and_frame of and_frames){
                            // AND条件を追加
                            and_filter.push({
                                field: and_frame.querySelector(".and_name").dataset.field,
                                value: and_frame.querySelector("input")!==null ? and_frame.querySelector("input").value: "",
                                comparision: and_frame.querySelector("select").value,
                                type: and_frame.dataset.type,
                                label: and_frame.querySelector(".and_name").textContent,
                            });
                        }
                        or_filter.push(and_filter);
                    }

                    
                    self.fi = or_filter;
                    self.filter_condition = or_filter;
                    filter_checkbox_input.checked = false;
                    filter_checkbox_label.click();

                })
                .set_custom_foot(add_of)
                .set_custom_foot(del_of);
        }
        const filter_modal = this.filter_modal;

        return ui;
    }

    ui_sort(){
        // const ui = super.ui_sort();
        const self = this;
        const ths = this.head.querySelectorAll("th");
        const so = this.so;
        for(let th of ths){
            if(so && so.field===th.dataset.field){
                th.dataset.desc = so.desc;
            }else{
                th.dataset.desc = -1;
            }

            // ビルド前であればソート機能を追加
            if(this.is_built === false){
                th.addEventListener("click",function(){
                    th.dataset.desc *= -1;
                    const ths = self.head.querySelectorAll("th");
                    for(let h of ths){
                        h.classList.remove("active");
                    }
                    th.classList.add("active");
                    self.so = {field:th.dataset.field,type:th.dataset.type,desc:th.dataset.desc};
                    self.sort();
                    self.draw();
                });
            }
        }

        return super.ui_sort();
    }

    ui_pagination(){
        if(this.pa > this.page_data.length - 1){
            this.pa = this.page_data.length - 1;
        }
        const self = this;
        const ui = super.ui_pagination();
        const index = this.pa !== null ? this.pa + 1 : 1;
        const btn = DOM.create("div",{class:"pagination-btn"});
        
        const active_page = btn.cloneNode();
        active_page.textContent = index;
        active_page.style.color = "red";

        const prev = btn.cloneNode();
            prev.textContent = "<";
            prev.addEventListener("click",function(){
                self.turn_page("prev");
            });
        const next = btn.cloneNode();
            next.textContent = ">";
            next.addEventListener("click",function(){
                self.turn_page("next");
            });
        const first = btn.cloneNode();
            first.textContent = "<<";
            first.addEventListener("click",function(){
                self.turn_page("first");
            });

        const first_num = btn.cloneNode();
            first_num.textContent = 1;
            first_num.addEventListener("click",function(){
                self.turn_page("first");
            });

        const last = btn.cloneNode();
            last.textContent = ">>";
            last.addEventListener("click",function(){
                self.turn_page("last");
            });

        const last_num = btn.cloneNode();
            last_num.textContent = this.page_data.length;
            last_num.addEventListener("click",function(){
                self.turn_page("last");
            });

        const prev_num = btn.cloneNode();
            prev_num.textContent = this.pa > 0 ? index - 1: "";
            prev_num.addEventListener("click",function(){
                self.turn_page("prev");
            });

        const next_num = btn.cloneNode();
            next_num.textContent = this.pa < this.page_data.length - 1 ? index + 1 : "";
            next_num.addEventListener("click",function(){
                self.turn_page("next");
            });

        const space = DOM.create("div",{class:"pagination-space"});
        const threePoint = DOM.create("div",{class:"pagination-threePoint"});
            threePoint.textContent = "...";
        
        let btn_list = [];
        const max_p = Object.keys(this.page_data).length;
        // console.log("page",this.page_data,this.pa);
        if(this.page_data.length == 0){
            // 全０ページの場合
            btn_list = [first, prev, threePoint.cloneNode(true), next , last]
        }else if(this.page_data.length == 1){
            // 全１ページの場合
            btn_list = [first,prev,space.cloneNode(true),active_page,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 2 && this.pa == 0){
            // 全２ページの場合で１ページ目を表示する場合
            btn_list = [first,prev,space.cloneNode(true),active_page,next_num,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 2 && this.pa == 1){
            // 全２ページの場合で２ページ目を表示する場合
            btn_list = [first,prev,space.cloneNode(true),prev_num,active_page,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 3 && this.pa == 0){
            // 全３ページの場合で１ページ目を表示する場合
            btn_list = [first,prev,space.cloneNode(true),active_page,next_num,last_num,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 3 && this.pa == 1){
            // 全３ページの場合で２ページ目を表示する場合
            btn_list = [first,prev,space.cloneNode(true),prev_num,active_page,next_num,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 3 && this.pa == 2){
            // 全３ページの場合で３ページ目を表示する場合
            btn_list = [first,prev,space.cloneNode(true),first_num,prev_num,active_page,space.cloneNode(true),next,last];
        }else{
            // そのほか表示ページが４ページよりも多いとき
            if (this.pa == 0 || typeof(this.pa) !== "number"){
                btn_list = [first,prev,space.cloneNode(true),active_page,next_num,threePoint.cloneNode(true),last_num,space.cloneNode(true),next,last];
            }else if(this.pa === 1){
                btn_list = [first,prev,space.cloneNode(true),prev_num,active_page,next_num,threePoint.cloneNode(true),last_num,space.cloneNode(true),next,last];
            }else if(this.pa ===  max_p - 1){
                btn_list = [first,prev,space.cloneNode(true),first_num,threePoint.cloneNode(true),prev_num,active_page,space.cloneNode(true),next,last];
            }else if(this.pa === max_p - 2){
                btn_list = [first,prev,space.cloneNode(true),first_num,threePoint.cloneNode(true),active_page,next_num,space.cloneNode(true),next,last];                
            }else{
                btn_list = [first,prev,space.cloneNode(true),first_num,threePoint.cloneNode(true),prev_num,active_page,next_num,threePoint.cloneNode(true),last_num,space.cloneNode(true),next,last];
            }
        }

        for(let b of btn_list){
            ui.appendChild(b);
        }

        if(this.info_right){
            // 情報の更新
            this.info_right.textContent = this.result_info;
        }

        return ui;
    }

}



/**
 * 連想配列からテーブルを生成する場合、既存テーブルを拡張する場合
 */

class TableWrapper extends TableBuilder{
    constructor(selector){
        super(selector);
        this.table = document.querySelector(`${selector} table`);
        this.head = this.table.querySelector(`thead`);
        this.body = this.table.querySelector(`tbody`);
        this.foot = this.table.querySelector(`tfoot`);

        this.table.classList.add("table");
        this.head.classList.add("thead");
        this.body.classList.add("tbody");
        this.foot.classList.add("tfoot");
    }

    /**
     * テーブルを生成する
     * @returns table
     */
    make(){
        return this.table;
    }

    build(is_simple_table=true){
        this.columns = this.load_columns();
        this.data = this.load_rows(is_simple_table);
        super.build();
        return this;
    }

}


/**
 * 描画するごとに画面がリロードされるテーブルの動的生成クラス
 * dl,pa,pp,so,fiのパラメータでページネーション、ソート、フィルターのパラメータをバックエンドで行う。
 */
class TableBuilderReload extends TableBuilder{
    constructor(selector){
        super(selector);
    }
    build(){
        this.is_request = true;
        super.build();
        this.is_reload = true;
        return this;
    }
}


/**
 * 描画するごとに画面がリロードされるテーブルのHTMLラッパークラス
 * dl,pa,pp,so,fiのパラメータでページネーション、ソート、フィルターのパラメータをバックエンドで行う。
 */
class TableWrapperReload extends TableWrapper{
    constructor(selector){
        super(selector);
    }
    build(is_simple_table=true){
        this.is_request = true;
        super.build(is_simple_table);
        this.is_reload = true;
        return this;
    }
}


/**
 * 描画するごとに指定したURLにデータ更新リクエストをするテーブルの動的生成クラス
 * dl,pa,pp,so,fiのパラメータでページネーション、ソート、フィルターのパラメータをバックエンドで行う。
 */
class TableBuilderUpdate extends TableBuilder{
    constructor(selector){
        super(selector);
    }

    build(){
        this.is_request = true;
        super.build();
        this.is_update = true;
        this.draw();
        return this;
    }

    draw(){
        this.get_url = Table.get_request_url(this.parent.dataset.url);
        console.log(this.get_url);
        return super.draw();
    }

    /**
     * 非同期でデータを取得できたときに発火する関数
     * オーバーライド or 各画面で再定義する
     * @param {*} data 取得したデータ
     */
    flash(data){

    }
}


/**
 * 描画するごとに指定したURLにデータ更新リクエストをするテーブルのHTMLラッパークラス
 * dl,pa,pp,so,fiのパラメータでページネーション、ソート、フィルターのパラメータをバックエンドで行う。
 */
class TableWrapperUpdate extends TableWrapper{
    constructor(selector){
        super(selector);
    }
    build(is_simple_table=true){
        this.is_request = true;
        super.build(is_simple_table);
        this.is_update = true;
        // this.draw();
        return this;
    }

    draw(){
        this.get_url = Table.get_request_url(this.parent.dataset.url);
        console.log(this.get_url);
        return super.draw();
    }

    /**
     * オーバーライド用
     * @param {*} data 取得したデータ
     */
    flash(data){

    }
}