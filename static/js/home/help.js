
let viewer = null;
let viewer_dom = document.querySelector("#viewer");
document.addEventListener("DOMContentLoaded",(e)=>{
    viewer = toastui.Editor.factory({
        el: viewer_dom,
        viewer: true,
        height: "100%",
        initialValue: viewer_dom.dataset.text,
        initialEditType: "wysiwyg",
        theme: "dark",
    });
});