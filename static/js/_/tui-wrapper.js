
class TUIContextMenu{

    static id   = 0;
    static list = [];

    constructor(){
        this.parent = document.querySelector("body");
        this.container = null;
        this.handler = {};
        this.build();
        this.id = TUIContextMenu.id++;
        TUIContextMenu.list.push(this);
    }

    build(){
        this.container = document.createElement("div");
        this.container.id = `tui-context-menu${this.id}`;
        this.parent.appendChild(this.container);  
        this.object = new tui.ContextMenu(this.container);
        console.log(this.object);
        return this;
    }

    click(e,cmd){
        console.log(e,cmd);
        if(cmd){
            const func = this.handler[cmd];
            if(func){
                func(e);
            }
        }
    }

    appendEvent(cmd,callback){
        this.handler[cmd] = callback;
    }

    removeEvent(cmd){
        delete this.handler[cmd];
    }

    register(selector, menu){
        const self = this;
        this.object.register(selector, (e,cmd)=>{self.click(e,cmd)}, menu);
    }
}

const menu = [
            {title: 'New Folder'},
            {
                title: 'New File',
                menu: [
                    {title: '20170101.xls'},
                    {title: 'image.png', command: 'export-to-png'},
                    {title: 'image.jpg', command: 'export-to-jpg'}
                ]
            },
            {separator: true},
            {title: 'Rename'},
            {title: 'Delete'},
            {title: 'Copy', disable: true},
            {title: 'Paste', disable: true}
        ];