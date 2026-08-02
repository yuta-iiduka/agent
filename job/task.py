import datetime
from flask_apscheduler import APScheduler

aps = APScheduler()

@aps.task("interval", id="job", seconds=60)
def server_minites_task():
    print(datetime.datetime.now())
