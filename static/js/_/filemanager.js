console.log("filemanager.js");

class FileData{
    constructor(file = new File([""],"sample.txt")){
        this.file = file;
        this.type = file.type;
    }

    async read(){
        if(this.file.type.includes("text") || this.file.type.includes("json")){
            this.data = await this.file.text();
        }
        this.data = await this.file.arrayBuffer();
        return this.data;
    }
}

class ExcelData extends FileData{

    constructor(file){
        super(file);
    }

    async read(){
        this.data = await this.file.arrayBuffer();
        this.workbook = XLSX.read(this.data,{type:"array"});
        this.active_sheet_name = this.workbook.SheetNames[0];
        this.active_sheet = this.workbook.Sheets[this.active_sheet_name];
        this.active_sheet_data = XLSX.utils.sheet_to_json(this.active_sheet);
        console.log(this.active_sheet_data);
    }
}



class FileManager{

    static style = null;
    static cnt = 0;
    static CONST = {ZINDEX:4};

    constructor(selector="body"){
        this.parent = null;
        if(typeof(selector)==="string"){
            this.parent = document.querySelector(selector);
        }else{
            this.parent = selector;
        }
        if(this.parent == null){ new Error("DOMの取得に失敗しました。"); }
        this.id = FileManager.cnt++;
        this.style = FileManager.style ?? this.style();
        this.current_directory = "";
        this.current_dir_node = null;
        this.current_file_node = null;
        this.current_target = null;
        this.files = [];
        this.dirs  = [];
        this.backup = {files:[],dirs:[]};
        this.selected = {files:[],dirs:[]};
        this.url = {
            read: "",
            load: "",
            download: "",
            upload:"",
            rename:"",
            delete:"",
        }
        this.request = new RequestData();
    }

    get rect(){
        const [rect] = this.parent.getClientRects();
        return rect;
    }

    style(){
        const s = document.createElement("style");
        s.innerHTML = `
            .fm-frame{
                height:100%;
                width:100%;
            }
            .fm-head{
                display:flex;
                flex-direction:column;
                height:64px;
                width:100%;
            }
            .fm-body{
                height:calc(100% - 88px);
                width: 100%;
                overflow: auto;
            }
            .fm-foot{
                height:24px;
                width:100%;
            }
            .fm-overlay{
                height:${this.rect.height}px;
                width: ${this.rect.width}px;
                opacity:0.5;
                overflow: hidden;
                pointer-events:none;
                position: fixed;
                top: ${this.rect.top}px;
                left: ${this.rect.left}px;
                z-index:${FileManager.CONST.ZINDEX};
            }

            .fm-toolbar{
                display:flex;
                justify-content:space-between;
                align-items:center;
                height:32px;
                width:100%;
            }
            .fm-infobar{
                height:32px;
                width:100%;
                display:flex;
                justify-content:flex-end;
                align-items:center;
            }
            .fm-datalist{
                height:100%;
                width:100%;
                display:flex;
                flex-direction:column;
                justify-content:flex-start;
                align-items:center;
            }
        `;
        document.head.appendChild(s);
        return s;
    }

    /**
     * FileManagerのDOMを生成する
     */
    build(){
        // URLの取得
        this.parent.innerHTML = "";
        this.url = {
            save: this.parent.dataset.urlSave,
            dataload: this.parent.dataset.urlDataload,
            download: this.parent.dataset.urlDownload,
            rename: this.parent.dataset.urlRename,
        }
        // 基本UI
        const frame = document.createElement("div");
        frame.classList.add("fm-frame");
        const head = document.createElement("div");
        head.classList.add("fm-head");
        const body = document.createElement("div");
        body.classList.add("fm-body");
        const foot = document.createElement("div");
        foot.classList.add("fm-foot");

        // head
        const toolhead = document.createElement("div");
        toolhead.classList.add("fm-toolbar");
        const infobar = document.createElement("div");
        infobar.classList.add("fm-infobar");
        head.appendChild(toolhead);
        head.appendChild(infobar);

        // body
        const datalist_frame = document.createElement("div");
        datalist_frame.classList.add("fm-datalist");
        body.appendChild(datalist_frame);

        // foot
        const toolfoot = document.createElement("div");
        toolfoot.classList.add("fm-toolbar");
        foot.appendChild(toolfoot);

        // オーバーレイ
        const overlay = document.createElement("div");
        overlay.classList.add("fm-overlay");
        window.addEventListener("resize",()=>{
            overlay.style.top    = `${this.rect.top}px`;
            overlay.style.left   = `${this.rect.left}px`;
            overlay.style.width  = `${this.rect.width}px`;
            overlay.style.height = `${this.rect.height}px`;
        });

        this.overlay = overlay;
        this.frame = frame;
        this.head  = head;
        this.body  = body;
        this.foot  = foot;

        this.toolhead = toolhead;
        this.infobar = infobar;
        this.datalist_frame = datalist_frame;
        this.toolfoot = toolfoot;
        
        this.frame.appendChild(head);
        this.frame.appendChild(body);
        this.frame.appendChild(foot);
        this.parent.appendChild(overlay);
        this.parent.appendChild(frame);

    }

    /**
     * 描画メソッド
     * @returns
     */
    draw(){
        this.current_dir_node.draw();
        return;
    }


    /**
     * ファイル・ディレクトリ情報をサーバから取得
     * @returns 
     */
    async load(data={path:""}){
        const json = await this.request.fetchPOST(this.url.dataload,data);
        console.log(json);

        return json;
    }

    /**
     * ファイル・ディレクトリ情報をサーバから取得
     * @returns 
     */
    async save(data={}){
        const json = await this.request.fetchFormData(this.url.save,data);
        return;
    }

    /**
     * ファイル・ディレクトリのロールバック
     * @returns 
     */
    rollback(){
        return;
    }

    /**
     * カレントディレクトリを上へ移動
     * @returns 
     */
    up(){
        return;
    }

    /**
     * カレントディレクトリを下へ移動
     * @returns 
     */
    down(){
        return;
    }

    /**
     * ファイル・フォルダを選択する。
     * @returns 
     */
    select(){
        return;
    }

    unselect(){
        return;
    }
    
    download(){
        return;
    }

    upload(){
        return;
    }

    rename(){

    }

    insert(data){
        // node insert
        const div = document.createElement("div");
        div.classList.add("");

        return;
    }

    delete(){
        return;
    }

    copy(){
        return;
    }

    view(){
        return;
    }

    search(){
        return;
    }
}


class DataNode{
    constructor(){
        this.type = "data";
        this.info = {};
        this.parent = null;
        this.childs = [];
        this.data   = null;
        this.backup = null;
        this.status = {};
    }
}

class FileNode extends DataNode{
    constructor(){
        super();
        this.type = "file";
        this.old = "";
        this.new = "";
    }

    rename(){
        // リネーム

    }

    draw(){

    }
}

class DirNode extends DataNode{
    constructor(){
        super();
        this.type = "dir";
        this.old = "";
        this.new = "";
    }

    rename(){
        // 再帰的なパスのリネームが必要
    }

    draw(){

    }
}