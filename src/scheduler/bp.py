from server import *

NAME = "scheduler"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")


@bp.route("/",methods=["GET"])
@login_required
def index():
    return render_template("scheduler/index.html")
