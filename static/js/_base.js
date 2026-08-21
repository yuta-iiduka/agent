console.log("_base.js is called.");
const head = document.querySelector(".head");
const body = document.querySelector(".body");
const foot = document.querySelector(".foot");
const endpoints = document.querySelector("meta[name=endpoints]").dataset;
const flash = document.querySelector(".flash");

// ハンバーガーメニューの初期化
document.addEventListener('DOMContentLoaded', () => {
    const burgers = document.querySelectorAll('.navbar-burger');
    burgers.forEach((burger) => {
        burger.addEventListener('click', () => {
            const target = document.getElementById(burger.dataset.target);
            burger.classList.toggle('is-active');
            target.classList.toggle('is-active');
        });
    });
});

/**
 * URLパラメータを取得もしくは、設定する関数
 * @param {String} key :パラメータキー
 * @param {String} val :パラメータ値
 */
function url_param(key,val=null){
    const params = new URLSearchParams(window.location.search);
    let result = null;
    if(val){
        const url = new URL(window.location.href);
        url.searchParams.set(key, val);
        history.pushState({}, "", url);
        result = url.toString();
    }else{
        result = params.get(key);
    }
    return result;
}

/**
 * エンドポイントからURLを解決する関数
 * @param {String} endpoint 
 * @returns
 */
function url_for(endpoint){
    return endpoints[endpoint];
}

/**
 * URLから画面遷移する関数
 * @param {String} url 
 */
function a(url){
    window.location.href = `${window.location.protocol}//${window.location.host}${url}`;
}

/**
 * 通知モーダルを表示する 同期関数
 * @param {String} str          : 表示する文字列
 * @param {Function} callback   : 描画するための関数(指定しない場合、ブラウザのalert()もしくは、message()を呼び出す。)
 */
function show_message(str="",callback=null){
    let msg = ""
    if(str=="" && flash){
        console.log(flash.textContent);
        msg = flash.textContent;
    }else if(str != ""){
        console.log(str);
        msg = str
    }

    msg = msg.trim();
    if(msg != ""){
        if(callback){
            callback(msg);
        }else if(alert_modal){
            alert_modal.message(msg);
        }else{
            window.alert(msg);
        }        
    }
}

/**
 * 確認モーダルを表示する 非同期関数
 * @param {String} str          : 表示する文字列
 * @param {Function} callback   : 描画するための関数(指定しない場合、ブラウザのalert()もしくは、message()を呼び出す。)
 */
async function show_confirm(message, callback=null){
    let result = false;
    if(callback){
        result = await callback();
    }else if(confirm_modal){
        result = await confirm_modal.confirm(message);
    }else{
        result = window.confirm(message)
    }
    return result;
}

/**
 * マークダウンのHTML変換関数
 * purify.js, marked.jsに依存
 * @param {*} dom 
 * @returns 
 */
function markdown(dom){
    let result = false
    try{
        const html = marked.parse(dom.textContent);
        dom.innerHTML = DOMPurify.sanitize(html);
        dom.dataset.is_converted = "true";
        result = true;
    }catch(e){
        console.error(e);
    }
    return result;
}

function to_markdown(dom){
    let result = ""
    try{
        const html = dom.innerHTML;
        const turndownService = new TurndownService();
        turndownService.use(turndownPluginGfm.gfm);
        turndownService.use(turndownPluginGfm.taskListItems);
        result = turndownService.turndown(html);
    }catch(e){
        console.error(e);
    }
    return result;
}


document.addEventListener("DOMContentLoaded", ()=>{
    // ヘッダー・フッターの表示・非表示
    frame = url_param("frame");
    if(frame=="false"){
        head.style.display = "none";
        foot.style.display = "none";
        body.style.height = "100%";
    }
    document.body.style.display = "block";
    // メッセージがあれば表示
    setTimeout(()=>{show_message();},100);

    htmxm = new HTMXManager(htmx);
    htmxm.init_event();
});

