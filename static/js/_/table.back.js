console.log("table.js is called.");

class Table extends DOM{
    static id = 0;
    static is_init = false;
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

    static style = `
        .table{
            background-color: black;
        }
        .thead{
            position: sticky;
            top: 48px;
            width: 100%;
            background-color: black;
        }
        .thead th{
            word-break: break-word;
        }
        .tbody{
        
        }
        .tbody tr.active{
            background-color: #222222;
        }
        .tbody td{
            height: 24px;
            word-break: break-word;
        }
        .tfoot{
        
        }
        .ui_filter{
            position: sticky;
            top: 0px;
            display: flex;
            gap: 8px;
            height: 48px;
            align-items: center;
            background-color: black;
        }
        .filter_btn{
            cursor: pointer;
            border: solid 1px white;    
        }
        .and_frame{
            display: flex;
            width: 100%;
            gap: 8px;
        }
        .or_frame{
            width: calc(100% - 2px);
            border: solid 1px white;
        }
        .or_head{
            display: flex;
            width: calc(100% - 4px);
            gap: 8px;
            border: solid 1px white;
            padding: 2px;
        }
        .or_body{
            width: calc(100% - 4px);
            border: solid 1px white;
            padding-left: 2px;
            padding-right: 2px;
        }
        .add_or_frame{
            border: solid 1px white;
        }
        .del_or_frame{
            border: solid 1px white;
        }
        .add_and_frame{
            border: solid 1px white;
        }
        .del_and_frame{
            border: solid 1px white;
        }
        .ui_pagination{
            display: flex;
            gap: 8px;
            height: 48px;
            align-items: center;
            justify-content: center;
        }
        .pagination-btn{
            width: 24px;
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
    `;

    constructor(selector){
        super(selector);
        this.dom_id = this.append();
        this.id = Table.id++;
        this._rid = 0;
        this._data = null;
        this._rows = null;
        this._columns = null;
        this._diff = null;
        this._base = null;
        this._url = null;

        this.table = null;
        this.head = null;
        this.body = null;
        this.foot = null;

        this.page = 0;
        this.page_data = [];

        this.is_sortable = true;
        this.is_filtable = true;
        this.is_paginate = true;
        this.is_update = false;
        this.is_reload = false;
        this.is_request = false;
        this.is_swapable = false;

        this.active_filterable = true;
        this.active_sortable = true;
        this.active_paginate = true;
        this.active_tr = null;

        this.click_th = null;
        this.click_tr = null;
        this.click_td = null;
        this.view = null;

        this.filter_modal = null;
        this.filter_condition = [];
        this.pp = 10;

    }

    get url(){
        return this._url === null ? window.location.href : this._url;
    }

    set url(x){
        this._url = x;
    }

    get_url_param(key){
        const url = new URL(this.url);
        const params = new URLSearchParams(url.search);
        return params.get(key);
    }

    set_url_param(key,val){
        const url = new URL(this.url);
        const params = new URLSearchParams(url.search);
        params.set(key,val);
        url.search = params.toString();
        this.url = url.href;
        // window.history.replaceState({},"",url);
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
        if(this.is_update){
            this.set_url_param(`so${this.id}`,JSON.stringify(param));
        }
    }

    get fi(){
        return JSON.parse(Table.get_url_param(`fi${this.id}`));
    }

    set fi(param){
        Table.set_url_param(`fi${this.id}`,JSON.stringify(param));
        if(this.is_update){
            this.set_url_param(`fi${this.id}`,JSON.stringify(param));
        }
    }

    /**
     * ページネーションのアクティブなページのインデックス(page)
     */
    get pa(){
        return JSON.parse(Table.get_url_param(`pa${this.id}`));
    }

    set pa(param){
        Table.set_url_param(`pa${this.id}`,JSON.stringify(param));
        if(this.is_update){
            this.set_url_param(`pa${this.id}`,JSON.stringify(param));
        }
    }

    /**
     * ページネーションの１ページ当たりのレコード数(per page)
     */
    get pp(){
        return JSON.parse(Table.get_url_param(`pp${this.id}`));
    }

    set pp(param){
        Table.set_url_param(`pp${this.id}`,JSON.stringify(param));
        if(this.is_update){
            this.set_url_param(`pp${this.id}`,JSON.stringify(param));
        }
    }

    /**
     * ページネーションのデータ量(data length)
     */
    get dl(){
        return JSON.parse(Table.get_url_param(`dl${this.id}`));
    }

    set dl(param){
        Table.set_url_param(`dl${this.id}`,JSON.stringify(param));
        if(this.is_update){
            this.set_url_param(`dl${this.id}`,JSON.stringify(param));
        }
    }

    /**
     * テーブルの基本データ
     */
    get data(){
        return this._data;
    }

    set data(data){
        try{
            this.rid = 0;
            if(data !== null && data !== undefined && data.length !== undefined){
                for(let d of data){
                    if( Object.keys(d).includes("dataset")){
                        d.dataset.rid = this.rid++;
                    }else{
                        d.dataset = {"rid":this.rid++};
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
        for(let d of data){
            if( Object.keys(d).includes("dataset")){
                d.dataset.rid = this.rid++;
            }else{
                d.dataset = {"rid":this.rid++};
            }
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
            th.innerHTML = c.label;
            th.addEventListener("click",function(){
                if(typeof(self.click_th) === "function"){
                    self.click_th(th);
                }
            });
            tr.appendChild(th);
        }
        this.head.appendChild(tr);
        return tr;
    }


    /**
     * レコードを生成する関数
     * @param {*} tr [{field,value,dataset},...]
     */
    insert(row){
        console.log(row);
        const tr = document.createElement("tr");
        const self = this;
        if(row.dataset){ 
            for(let k of Object.keys(row.dataset)){
                tr.dataset[k] = row.dataset[k];
            }
        }

        const fields = Object.keys(row)
        for(let field of fields){
            if ( field.startsWith("_")===false && !(field === "dataset")){
                const td = document.createElement("td");
                td.dataset[field] = field;
                td.dataset.value = row[field];
                td.innerHTML     = row[field];
                td.addEventListener("click",function(){
                    if(typeof(self.click_td) === "function"){
                        self.click_td(td);
                    }
                });
                const inputs = td.querySelectorAll("input[type=text]");
                for(let input of inputs){
                    input.addEventListener("input",function(e){
                        input.setAttribute("value",e.target.value);
                        td.dataset.value = td.innerHTML;
                        row[field] = td.dataset.value;
                    });
                }
                const checks = td.querySelectorAll("input[type=checkbox]");
                for(let check of checks){
                    check.addEventListener("change",function(e){
                        const c = check.checked;
                        if(c){
                            check.setAttribute("checked",c);
                        }else{
                            check.removeAttribute("checked");
                        }
                        td.dataset.value = td.innerHTML;
                        row[field] = td.dataset.value;
                    });
                }
                tr.appendChild(td);
            }else if(field === "dataset"){
                const keys = Object.keys(row[field]);
                for(let k of keys){
                    tr.dataset[k] = row[field][k];
                }
            }
        }

        tr.addEventListener("click",function(){
            self.active_tr = tr;
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

    up(tr){
        if(tr === null){ return; }
        const trid = this.data.findIndex(r=> r.dataset.rid == tr.dataset.rid);
        // 境界チェック（trid > 0 であることが必要）
        if (trid > 0 && trid < this.data.length) {
        // 入れ替え
        [this.data[trid - 1], this.data[trid]] = [this.data[trid], this.data[trid - 1]];
        }
        //ソート条件無くさないと、結局並べ替えてしまうので無効化
        this.so = null; 
        this.draw(false);
    }

    down(tr){
        const trid = this.data.findIndex(r=> r.dataset.rid == tr.dataset.rid);
        // 境界チェック：nが最後の要素ではないこと
        if (trid >= 0 && trid < this.data.length - 1) {
        [this.data[trid], this.data[trid + 1]] = [this.data[trid + 1], this.data[trid]];
        }
        //ソート条件無くさないと、結局並べ替えてしまうので無効化
        this.so = null; 
        this.draw(false);
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
    fetch(get_url){
        // 画面遷移を伴う通信でデータを取得する場合
        // 初期化時に何もしないで、それ以降にソートリクエストを送る

        // 画面遷移を伴わない通信でデータを取得する場合
        // 初期化時にソートリクエストを送る
        const rj = new RequestJSON(get_url);
        rj.set_func((d)=>{
            const rows = [];
            for(let c of d.data){
                const r = {};
                for(let k of this.columns){
                    let v = c[k.field];
                    if(v === null || v === undefined){ v = "" }
                    r[k.field] = v;
                }
                rows.push(r);
            }
            this.dl = d.count;
            this.data=rows;
            this.draw(false);
        });
        rj.set_error_func((d)=>{alert(d)})
        rj.get();
        // rj.fetchGet(get);
        // this.rows = rj.res_data;
        // this.data = rj.res_data;
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
        console.log("pa",this.pa);
        const pagination = new Pagination({perPage:this.pp,dataLength:this.dl,activePage:(this.is_update || this.is_reload) ? this.pa : 0},this.rows);
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
     * テーブル情報を表示する場所
     * @returns 
     */
    ui_info(){
        const old = document.querySelector(`#ui_info${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_info",id:`ui_info${this.id}`})
    }

    /**
     * フィルターUI作成
     * @returns 
     */
    ui_filter(){
        const old = document.querySelector(`#ui_filter${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_filter",id:`ui_filter${this.id}`})
    }

    /**
     * ソートUI作成
     * @returns 
     */
    ui_sort(){
        const old = document.querySelector(`#ui_sort${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_sort",id:`ui_sort${this.id}`})
    }

    /**
     * ページネーションUI作成
     * @returns 
     */
    ui_pagination(){
        const old = document.querySelector(`#ui_pagination${this.id}`);
        if(old){old.remove();}
        return DOM.create("div",{class:"ui_pagination",id:`ui_pagination${this.id}`})
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
     * @returns Array
     */
    load_rows(){
        const trs = this.body.querySelectorAll("tr");
        const columns = this.load_columns();
        const t = [];
        for(let tr of trs){
            const c = {};
            let tds = tr.querySelectorAll("td");
            for(let td of tds){
                for(let col of columns){
                    if( Object.keys(td.dataset).includes(col.field) ){
                        c[col.field] = td.innerHTML;
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
            this.fi = this.fi;
            this.pp = this.pp;
            this.pa = this.pa;
            this.dl = this.dl;
            this.so = this.so;
        }
        return super.build();
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

}


/**
 * ソート、フィルター、ページネーション機能を提供するクラス
 * 
 */
class TableBuilder extends Table{
    static{
        this.prefix = "t_";
    }

    constructor(selector){
        super(selector);
        this.is_built = false;

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
        }

        return this.table;
    }

    /**
     * 設定後の初期化
     * @returns 
     */
    build(){
        // フレームの追加
        super.build();
        // 描画
        this.draw();
        this.is_built = true;
        return this;
    }

    /**
     * レコードの描画やその操作UIの描画
     */
    draw(request=true){
        this.body.innerHTML = "";
        this.rows = this.data;

        // データ更新を伴う場合
        if(request === true){
            // データの部分更新を伴う場合
            if(this.is_update === true){
                this.fetch(this.url);

            // データリロードを伴う場合
            }else if(this.is_reload === true){
                // ビルド前にリロードはしない(無限ループになるため)
                this.reload();
            }
        }
        // データ更新を伴わない場合

        if(this.is_filtable){
            if(this.active_filterable){
                if(this.fi){this.rows = this.filter();}
            }else{
                this.diff = null;
            }
            this.frame.prepend(this.ui_filter());
        }
        if(this.is_sortable){
            if(this.so){this.rows = this.sort();}
            this.ui_sort();
        }
        if(this.is_paginate){
            if(typeof(this.pp) === "number" && this.pp > 0){this.page_data = this.paginate();}
            this.frame.append(this.ui_pagination());
            if(typeof(this.pa) === "number"){
                this.rows = this.page_data[this.pa];
            }else{
                this.rows = this.page_data[0];
            }
        }

        // tbodyにレコードを追加
        if( this.rows && this.rows.length > 0 ){
            // 設定に応じて描写
            this.inserts(this.rows);
        }
        return super.draw();
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
                    const option = document.createElement("option");
                    if(col.type !== "input"){
                        option.value = col.field;
                        option.dataset.typ = col.type;
                        option.dataset.lbl = col.label;
                        option.dataset.fld = col.field;
                        option.textContent = `${col.label}:${col.type}`;
                        sel_af.appendChild(option);
                    }
                }

                // AND条件追加
                const add_af = DOM.create("div",{class:"add_and_frame"});
                add_af.textContent = "追加"
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
                name_af.textContent = con.label;
                name_af.dataset.field = con.field;
                // AND比較演算子選択
                const sel_af = DOM.create("select",{class:"select_and_frame"});
                // ANDフォーム
                const form_af = add_setting_form(con);
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

            // タイプによって、設定値フォームを変更する
            function add_setting_form(con){
                let form = null;
                if(con.type === "check"){
                    form = DOM.create("input",{class:"and_form"});
                    form.type = "hidden";

                }else if(con.type === "input"){
                    form = DOM.create("input",{class:"and_form"});
                    form.type = "hidden";
                }else{
                    form = DOM.create("input",{class:"and_form"});
                    form.value = con.value;
                }

                return form;
            }

            for(let con of condition){
                dom.appendChild(make_frame(con));
            }
        }

        // フィルターモーダルボタン起動
        const filter_btn = DOM.create("div",{id:`filter_btn${this.id}`,class:"filter_btn"});
        filter_btn.textContent = "フィルター";
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
        filter_checkbox_label.appendChild(document.createTextNode("フィルター機能"));
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
            add_of.textContent = "追加";

            // ORフレーム追加ボタン
            add_of.addEventListener("click",function(){
                add_or_con(self.filter_modal.body,[]);
            });

            const del_of = DOM.create("div",{class:"del_or_frame"});
            del_of.textContent = "削除";
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
                .set_yes_btn(function(){
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
                                value: and_frame.querySelector("input").value,
                                comparision: and_frame.querySelector("select").value,
                                type: and_frame.dataset.type,
                                label: and_frame.querySelector(".and_name").textContent,
                            });
                        }
                        or_filter.push(and_filter);
                    }
                    self.fi = or_filter;
                    filter_checkbox_input.checked = true;
                    self.draw();
                })
                .add_foot(add_of)
                .add_foot(del_of);
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
            first.textContent = "◁";
            first.addEventListener("click",function(){
                self.turn_page("first");
            });
        const last = btn.cloneNode();
            last.textContent = "▷";
            last.addEventListener("click",function(){
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
        if(this.page_data.length === 0){
            btn_list = [first, prev, threePoint.cloneNode(true), next , last]
        }else if(this.page_data.length === 1){
            btn_list = [first,prev,space.cloneNode(true),active_page,space.cloneNode(true),next,last];
        }else if(this.page_data.length === 2 && this.pa === 0){
            btn_list = [first,prev,space.cloneNode(true),active_page,next_num,next,last];
        }else if(this.page_data.length === 2 && this.pa === 1){
            btn_list = [first,prev,prev_num,active_page,space.cloneNode(true),next,last];
        }else{
            let max_p = Object.keys(this.page_data).length;
            if (this.pa === 0 || typeof(this.pa) !== "number"){
                btn_list = [first,prev,space.cloneNode(true),active_page,next_num,threePoint.cloneNode(true),space.cloneNode(true),next,last];
            }else if(this.pa === 1){
                btn_list = [first,prev,space.cloneNode(true),prev_num,active_page,next_num,threePoint.cloneNode(true),space.cloneNode(true),next,last];
            }else if(this.pa ===  max_p - 1){
                btn_list = [first,prev,space.cloneNode(true),threePoint.cloneNode(true),prev_num,active_page,space.cloneNode(true),next,last];
            }else if(this.pa === max_p - 2){
                btn_list = [first,prev,space.cloneNode(true),threePoint.cloneNode(true),active_page,next_num,space.cloneNode(true),next,last];                
            }else{
                btn_list = [first,prev,space.cloneNode(true),threePoint.cloneNode(true),prev_num,active_page,next_num,threePoint.cloneNode(true),space.cloneNode(true),next,last];
            }
        }

        for(let b of btn_list){
            ui.appendChild(b);
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

    build(){
        this.columns = this.load_columns();
        this.data = this.load_rows();
        super.build();
        return this;
    }

}
