console.log("editor.js is called.");


let editor = null;
let viewer = null;
document.addEventListener("DOMContentLoaded",(e)=>{

    editor = new toastui.Editor({
        el: document.querySelector("#editor"),
        previewStyle: "vertical",
        height: "100%",
        initialValue: "Hello World!",
        initialEditType: "wysiwyg",
        theme: "dark",
        placeholder: "Please enter text.",
        previewStyle: "tab",
    });

    viewer = toastui.Editor.factory({
        el: document.querySelector("#viewer"),
        viewer: true,
        height: "100%",
        initialValue: "Hello World!",
        initialEditType: "wysiwyg",
        theme: "dark",
    });

    editor.on("change", ()=>{
        viewer.setMarkdown(editor.getMarkdown());
    });
});

