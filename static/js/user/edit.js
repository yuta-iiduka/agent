
const icon_image = document.querySelector("#icon-image");
const icon_data  = document.querySelector("#icon-data");

icon_image.addEventListener("click", (e)=>{
    // 疑似的なファイルinputタグを生成
    const input = icon_data;
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e)=>{
        const file = input.files[0];
        if(!file){
            return;
        }
        console.log(file);

        const reader = new FileReader();
        reader.onload =  () => {
            // data:image/png;base64,xxxxx... の形式
            const base64 = reader.result;
            icon_image.src = base64;
        }

        reader.readAsDataURL(file);
    }

    input.click();
});
