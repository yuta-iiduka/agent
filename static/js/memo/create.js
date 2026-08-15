console.log("editor.js is called.");

const save_button = document.querySelector("#save-button");
const form   = document.querySelector("#form");
const name   = form.querySelector("input[name=name]");
const text   = form.querySelector("textarea");
const title  = document.querySelector("#title")

save_button.addEventListener("click",(e)=>{
    name.value = title.value;
    text.value = editor.getMarkdown();
    form.submit();
});

let editor = null;
let viewer = null;
let basetext = "Hello World!";
document.addEventListener("DOMContentLoaded",(e)=>{
    
    editor = new toastui.Editor({
        el: document.querySelector("#editor"),
        previewStyle: "vertical",
        height: "100%",
        initialValue: basetext,
        initialEditType: "wysiwyg",
        theme: "dark",
        placeholder: "Please enter text.",
        previewStyle: "tab",
    });

    viewer = toastui.Editor.factory({
        el: document.querySelector("#viewer"),
        viewer: true,
        height: "100%",
        initialValue: basetext,
        initialEditType: "wysiwyg",
        theme: "dark",
    });

    editor.on("change", ()=>{
        viewer.setMarkdown(editor.getMarkdown());
    });

});

