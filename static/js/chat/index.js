const chat_tool_list = document.getElementById("chat-tool-list");
const chat_room_list = document.getElementById("chat-room-list");
const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("sidebar-toggle");
const closer = document.getElementById("sidebar-close");
const overlay = document.getElementById("sidebar-overlay");
const buttion_create = document.getElementById("button-create");
const buttion_search = document.getElementById("button-search");
const sub_menu = document.querySelector(".side-sub-menu");
const side_sub_menu_list = document.querySelector(".side-sub-menu-list");

function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-active");
}

function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-active");
}

toggle.addEventListener("click", openSidebar);
closer.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);


const chat_tab = document.querySelector("#chat-tab ul");
const chat_tab_content = document.getElementById("chat-tab-content"); 
const chat_links = document.querySelectorAll(".chat-link");
const chat_link_icons = document.querySelectorAll(".chat-link-icon");
let link_id = 0;
chat_links.forEach((a)=>{
    enable_link(a);
});

chat_link_icons.forEach((img)=>{
    enable_sub_menu(img);
});

function show_sub_menu(dom){
    sub_menu.classList.remove("hide");
    sub_menu.classList.add("side-sub-menu");
    sub_menu.style.left   = `${dom.offsetLeft}px`;
    sub_menu.style.top    = `${dom.offsetTop}px`;
    console.log(sub_menu);
}

function hide_sub_menu(){
    sub_menu.classList.remove("side-sub-menu");
    sub_menu.classList.add("hide");
}

function append_sub_menu(name,callback){
    const a  = document.createElement("a");
    a.classList.add("side-sub-menu-item");
    a.classList.add("link");
    a.classList.add("is-info");
    a.textContent = name;
    a.dataset.name = name;
    a.addEventListener("click",(e)=>{
        callback(e);
    });
    const li = document.createElement("li");
    li.appendChild(a);
    side_sub_menu_list.appendChild(li);
}

function make_link(room_id,room_name){
    const a = document.createElement("a");
    a.classList.add("chat-link");
    a.classList.add("link");
    a.classList.add("is-primary");
    a.dataset.id   = room_id;
    a.dataset.url  = `${url_for("chat.room").replace("<room_id>",room_id)}?frame=false`;
    a.dataset.name = room_name;
    a.textContent = room_name;
    const div = document.createElement("div");
    div.classList.add("icon");
    const img = document.createElement("img");
    img.src = url_for("static").replace("<path:filename>", "img/three-dots.svg");
    enable_sub_menu(img);
    div.appendChild(img);
    enable_link(a);
    const li = document.createElement("li");
    li.appendChild(a);
    li.appendChild(div);
    return li;
}


let active_sub_menu_li = null;
function enable_sub_menu(img){
    img.addEventListener("click",(e)=>{
        active_sub_menu_li = e.target.closest("li");
        show_sub_menu(e.target);
    });
}

function get_chat_room_info(li){
    const a = li.querySelector("a");
    return {
        id:   a.dataset.id,
        name: a.dataset.name,
        url:  a.dataset.url,
    };
}

function enable_link(a){
    a.addEventListener("click",()=>{
        const url    = a.dataset.url;
        const name   = a.dataset.name;
        const tab    = document.createElement("li");
        const title  = document.createElement("a");
        const close  = document.createElement("button");
        tab.style.display = "flex";
        title.dataset.id = link_id;
        title.textContent = name;
        close.classList.add("delete");
        title.appendChild(close);
        tab.appendChild(title);
        chat_tab.appendChild(tab);

        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.dataset.id = link_id;
        iframe.style.width  = "100%";
        iframe.style.height = "100%";
        chat_tab_content.appendChild(iframe);
        closeSidebar();

        // タブのクリック
        tab.addEventListener("click",(e)=>{
            activate(tab);
        });

        // タブページの削除
        close.addEventListener("click",(e)=>{
            e.stopPropagation();
            iframe.remove();
            tab.remove();
            setTimeout(()=>{last_activate();},100);
        });

        activate(tab);
        link_id++;
    });
}

function activate(tab){
    deactivate();
    tab.classList.add("is-active");
    id = tab.querySelector("a").dataset.id;
    const iframe = chat_tab_content.querySelector(`iframe[data-id="${id}"]`);
    if(iframe){
        iframe.style.display = "block";
    }
}

function deactivate(){
    const tabs = chat_tab.querySelectorAll("li");
    for(let tb of tabs){
        tb.classList.remove("is-active");
        id = tb.querySelector("a").dataset.id;
        const iframe = chat_tab_content.querySelector(`iframe[data-id="${id}"]`);
        if(iframe){
            iframe.style.display = "none";
        }
    }
}

function last_activate(){
    const tabs = [...chat_tab.querySelectorAll("li")];
    if(tabs.length > 0){
        const last = tabs[tabs.length-1];
        activate(last);
    }
}

buttion_create.addEventListener("click",()=>{
    closeSidebar()
    modal.show();
});

buttion_search.addEventListener("click",()=>{
    closeSidebar()
    alert_modal.message("まだ");
});



let room_users = [];

/**
 * モーダルの初期化
 */
const modal = new BulmaModal();
modal.template = tmplate_modal;
modal.body.innerHTML = `
    <div id="grid-frame" class="w-100">
            <div id="grid"></div>
            <div id="pagination"></div>
    </div>
`;
const ok = document.createElement("button");
ok.id = "ok";
ok.textContent = "OK"
ok.classList.add("button");
ok.classList.add("is-primary");
ok.setAttribute("hx-post",url_for("chat.room_create"));
ok.setAttribute("hx-ext","json-enc");
ok.setAttribute("hx-swap","none");
ok.addEventListener("click",()=>{
    modal.hide();
    room_users = [];
    const checkedRows = grid.getCheckedRows();
    console.log(checkedRows);
    room_users = checkedRows;
});

const cancel = document.createElement("button");
cancel.id = "cancel";
cancel.textContent = "キャンセル";
cancel.classList.add("button");
cancel.addEventListener("click",()=>{
    modal.hide();
});

modal.button(ok);
modal.button(cancel);

let grid = null;
document.addEventListener("DOMContentLoaded",(e)=>{

    init_contextmenu();
    contextmenu.register("#chat-room-list",[{"title":"名前の変更"}]);
    contextmenu.appendEvent("名前の変更",(e)=>{console.log(e);console.log("clicked.")});


    // ルーム作成のユーザ選択のGridを初期化
    grid = new tui.Grid({
        el: document.getElementById("grid"),
        rowHeaders:["checkbox"],
        scrollX: false,
        scrollY: false,
        columns: [
                {header: "ID"   , name: "id"   ,align: "center", width: "64"},
                {header: "NAME" , name: "name" ,align: "center", width: "240"},
                {header: "EMAIL", name: "email",align: "center", width: "240"},
        ],
        data:[],
        pageOptions: {
            useClient: true,
            perPage:20,
        }
    });

    htmxm.on("htmx:after-request", "button-create", (e)=>{
        console.log(e);
        if(e.detail.xhr.status != 200){
            alert_modal.message(`${e.detail.xhr.status}:リクエストに失敗しました。`,"エラー");
        }
        console.log(e.detail.xhr);
        const users = JSON.parse(e.detail.xhr.response).map((u)=>{return {id:u.id,name:u.name,email:u.email}});
        console.log(users);
        grid.resetData(users);
        grid.refreshLayout();
    });

    htmxm.on("htmx:after-request", "ok", (e)=>{
        console.log(e);
        if(e.detail.xhr.status != 200){
            alert_modal.message(`${e.detail.xhr.status}:リクエストに失敗しました。`,"エラー");
        }
        const room = JSON.parse(e.detail.xhr.response);
        const li = make_link(room.id,room.name);
        chat_room_list.appendChild(li);
    });

    htmxm.on("htmx:before-request", "ok", (e)=>{
        console.log(e.detail.elt);
        const params = e.detail.requestConfig.parameters;
        console.log(params);
        params.id_list = room_users.map((m)=>m.id)
        console.log(params);
    });

    htmx.process(ok);

    // 一つ目のタブをクリック
    if(chat_links.length>0){
        chat_links[0].click();
    }

    append_sub_menu("ルーム名の変更",(e)=>{
        console.log(e.target);
        const data = get_chat_room_info(active_sub_menu_li);
        console.log(data);
        hide_sub_menu();
    });
    append_sub_menu("キャンセル",(e)=>{
        console.log(e.target)
        hide_sub_menu();
    });
});


