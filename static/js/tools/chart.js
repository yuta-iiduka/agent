
document.addEventListener("DOMContentLoaded",()=>{
    const el = document.getElementById('chart');

    const data = {
        categories: ['1月', '2月', '3月', '4月', '5月'],
        series: [
            {
                name: '売上',
                data: [120, 150, 180, 160, 220]
            }
        ]
    };

    const options = {
        chart: {
            width: "100%",
            height: "100%",
        }
    };

    toastui.Chart.columnChart({
        el,
        data,
        options
    });
});