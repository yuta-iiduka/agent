from server import *

NAME = "memo"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")


@bp.route("/edit",methods=["GET"])
@login_required
def edit():
    return render_template("memo/edit.html")

@bp.route("/",methods=["GET"])
@login_required
def index():
    return render_template("memo/index.html")
