const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("sidebar-toggle");
const closer = document.getElementById("sidebar-close");
const overlay = document.getElementById("sidebar-overlay");
const buttion_create = document.getElementById("button-create");
const buttion_search = document.getElementById("button-search");

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
let link_id = 0;
chat_links.forEach((a)=>{
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
});

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


document.addEventListener("DOMContentLoaded",()=>{
    if(chat_links.length>0){
        chat_links[0].click();
    }
});

let room_users = [];

htmx.on("htmx:after-request", (e)=>{
    console.log(e);
    if(e.detail.xhr.status != 200){
        alert_modal.message(`${e.detail.xhr.status}:リクエストに失敗しました。`,"エラー");
    }
    if(e.detail.elt.id == "button-create"){
        console.log(e.detail.xhr);
        const users = JSON.parse(e.detail.xhr.response).map((u)=>{return {id:u.id,name:u.name,email:u.email}});
        console.log(users);
    }
});


htmx.on("htmx:before-request", (e)=>{
    console.log(e.detail.elt);
    if(e.detail.elt.id == "ok"){
        const params = e.detail.requestConfig.parameters;
        console.log(params);
        params.id_list = room_users.map((m)=>m.id)
        console.log(params);
    }
});


/**
 * モーダルの初期化
 */

const modal = new BulmaModal();
modal.template = tmplate_modal;
modal.body.innerHTML = ``;
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


