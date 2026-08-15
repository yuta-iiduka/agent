
const button_create = document.querySelector("#button-create");
const button_edit   = document.querySelector("#button-edit");
const button_share  = document.querySelector("#button-share");
const button_delete = document.querySelector("#button-delete");
const button_search = document.querySelector("#button-search");
const keywords      = document.querySelector("input[name=keywords]");

button_search.addEventListener("click",(e)=>{
    const kwds = keywords.value;
    a(`${window.location.pathname}?keywords=${kwds}`);
});

button_create.addEventListener("click",(e)=>{
    a(url_for('memo.create'));
});

button_delete.addEventListener("click",(e)=>{
    if(id){
        a(url_for('memo.delete').replaceAll("<id>",id));
    }
});

button_edit.addEventListener("click",(e)=>{
    if(id){
        a(url_for('memo.edit').replaceAll("<id>",id));
    }
});


let id   = null;
let grid = null;
let data = [...document.querySelectorAll(".data")].map((d)=>Object.fromEntries(Object.entries(d.dataset)));
document.addEventListener("DOMContentLoaded",(e)=>{
    
    grid = new tui.Grid({
        el: document.getElementById('grid'),
        rowHeaders:["checkbox"],
        scrollX: false,
        scrollY: false,
        columns: [
                {header: "ID",name: "id",width: "64",align: "center"},
                {header: "Title",name: "name",width: "128",align: "center"},
                {header: "Updater",name: "updater",align: "center"},
                {header: "Updated At",name: "updated_at",align: "center"}
        ],
        data: data,
        pageOptions: {
            useClient: true,
            perPage:20,
        }
    });
    
    grid.on("click",(e)=>{
        console.log("getCheckedRows():",grid.getCheckedRows());
        console.log(e.rowKey);
        console.log(grid.getRow(e.rowKey));
        const clicked = grid.getRow(e.rowKey);
        if(clicked){
            id = clicked.id;
        }
    });

    grid.on("dblclick",(e)=>{
        console.log("getCheckedRows():",grid.getCheckedRows());
        console.log(e.rowKey);
        console.log(grid.getRow(e.rowKey));
        const clicked = grid.getRow(e.rowKey);
        if(clicked){
            a(url_for('memo.edit').replaceAll("<id>", clicked.id));
        }
    });

    // grid.resetData(data);
});

