

// const container = document.getElementById('calendar');

// const calendar = new tui.Calendar(container, {
//     defaultView: 'week',
// });
let calendar = null;
document.addEventListener("DOMContentLoaded",()=>{
    calendar = new tui.Calendar('#calendar', {
        defaultView: url_param("calendar") || "month", // day, week, month
        usageStatistics: false,
        // useFormPopup: true,
        // useDetailPopup: true,
        week: {
            startDayOfWeek: 1,
            workweek: false,
        },
        month: {
            startDayOfWeek: 1,
        },
        timezone: {
            zones: [
                {
                    timezoneName: 'Asia/Tokyo',
                    displayLabel: '東京',
                }
            ],
        },
        calendars: [
            {
                id: 'work',
                name: '仕事',
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
            },
            {
                id: 'personal',
                name: 'プライベート',
                backgroundColor: '#10b981',
                borderColor: '#10b981',
            },
        ],
    });

    calendar.createEvents([
        {
            id: 'event-001',
            calendarId: 'work',
            title: '定例ミーティング',
            start: '2026-08-17T10:00:00',
            end: '2026-08-17T11:00:00',
            category: 'time',
        },

        {
            id: 'event-002',
            calendarId: 'work',
            title: '昼休み',
            start: '2026-08-17T12:00:00',
            end: '2026-08-17T13:00:00',
            category: 'time',
        },

        {
            id: 'event-003',
            calendarId: 'personal',
            title: '夏季休暇',
            start: '2026-08-20',
            end: '2026-08-22',
            category: 'allday',
        },
    ]);

    calendar.on('beforeUpdateEvent', ({ event, changes }) => {
        console.log(event);
        console.log(changes);
    });
    calendar.on('clickEvent', ({ event }) => {
        console.log(event);
    });
    calendar.on('selectDateTime', (event) => {
         console.log(event);
    });
    calendar.on('beforeDeleteEvent', ({ event }) => {
        console.log('削除:', event);
    });

    document.querySelector('#prev').addEventListener('click', () => {
        calendar.prev();
    });

    document.querySelector('#next').addEventListener('click', () => {
        calendar.next();
    });

    document.querySelector('#today').addEventListener('click', () => {
        calendar.today();
    });

    updateCalendarTitle();
});

function updateCalendarTitle() {
    const date = calendar.getDate();
    console.log(date);
}
