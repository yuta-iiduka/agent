from server import *

NAME = "agent"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")


@bp.route("/",methods=["GET"])
@login_required
def index():
    return render_template("memo/index.html")
