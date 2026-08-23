
console.log("room.js is called.")
const chat_head = document.querySelector("#chat-head");
const chat_body = document.querySelector("#chat-body");
const chat_foot = document.querySelector("#chat-foot");

const button_send = document.getElementById("button-send");
const button_edit = document.getElementById("button-edit");
const button_cancel = document.getElementById("button-cancel");
const chat_textarea = document.getElementById("chat-textarea");
const chat_id = document.getElementById("chat-id");
const room_id = document.getElementById("room-id");

// const socketio = io();
const socketio = io(window.location.origin,{transports:["websocket"], withCredentials: true});

socketio.on("connect", (data)=>{
    console.log("connect server.");
});

socketio.on("message", (data)=>{
    console.log(data);
});

socketio.on("chat", (data)=>{
    console.log(data);
    method = data.method;
    if(method == "create"){
        append_chat(data.text);
    }else if(method == "update"){
        update_chat(data.id,data.text);
    }else if(method == "delete"){
        delete_chat(data.id);
    }
});

document.addEventListener("DOMContentLoaded",()=>{
    chat_body.querySelectorAll(".chat-text").forEach((e)=>{
        markdown(e);
    });

    button_cancel.addEventListener("click",()=>{
        // 編集のキャンセル
        mode_send();
        chat_textarea.value = "";
        chat_id.value = "";
    });

    document.querySelectorAll(".trs-btn").forEach((e)=>{
        // set_delete_button(e);
    });

    document.querySelectorAll(".edt-btn").forEach((e)=>{
        set_edit_button(e);
    });
    socketio.emit("join_chat_room",{room_id:room_id.value});

    htmxm.on("htmx:after-request", "button-send", (e)=>{
        console.log(e);
        // 成功した場合だけクリア
        if (e.detail.xhr.status >= 200 &&
            e.detail.xhr.status < 300) {
            const id = chat_id.value;
            chat_textarea.value = "";
            chat_id.value = "";
            mode_send();
        }
    });

});

function append_chat(html){
    const fragment = document.createRange().createContextualFragment(html);
    set_edit_button(fragment.querySelector(".edt-btn"));
    set_delete_button(fragment.querySelector(".trs-btn"));
    const chat_card = fragment.querySelector(`.chat-container`);
    if(chat_card){
        markdown(chat_card.querySelector("p.chat-text"));
    }
    chat_body.appendChild(fragment);

}

function update_chat(id, mark){
    const chat_card = document.querySelector(`.chat-container[data-id='${id}']`);
    if(chat_card){
        const p = chat_card.querySelector("p.chat-text");
        p.innerHTML = "";
        p.textContent = mark;
        markdown(p);
    }
}

function delete_chat(id){
    const chat_card = document.querySelector(`.chat-container[data-id='${id}']`);
    chat_card.remove();
    mode_send();
}

function set_edit_button(dom){
    dom.addEventListener("click",(e)=>{
        result = "";
        const parent = e.target.closest(".chat-container");
        const p = parent.querySelector("p.chat-text");
        console.log(p);
        result = to_markdown(p);
        chat_textarea.value = result;
        chat_id.value = parent.dataset.id;
        mode_edit();
    });
}

function set_delete_button(dom){
    htmx.process(dom);
}

function mode_send(){
    button_send.classList.remove("hide");
    button_edit.classList.add("hide");
    button_cancel.classList.add("hide");
}

function mode_edit(){
    button_send.classList.add("hide");
    button_edit.classList.remove("hide");
    button_cancel.classList.remove("hide");
}

