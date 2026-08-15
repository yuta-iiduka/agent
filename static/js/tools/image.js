
let editor = null;
document.addEventListener("DOMContentLoaded",()=>{
    editor = new tui.ImageEditor('#image-editor', {
        includeUI: {
            loadImage: {
                path: '/static/img/default.png',
                name: 'default'
            },
            theme: {},
            menu: [
                'crop',
                'flip',
                'rotate',
                'draw',
                'shape',
                'icon',
                'text',
                'filter'
            ],
            initMenu: 'filter',
            uiSize: {
                width: '100%',
                height: '100%'
            },
            menuBarPosition: 'left'
        },
        // cssMaxWidth: 1000,
        // cssMaxHeight: 700,
        selectionStyle: {
            cornerSize: 20,
            rotatingPointOffset: 70
        }
    });
});
