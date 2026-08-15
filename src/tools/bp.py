from server import *

NAME = "tools"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")

@bp.route("/chart",methods=["GET"])
@login_required
@log
def chart():
    return render_template("tools/chart.html")

@bp.route("/image",methods=["GET"])
@login_required
@log
def image():
    return render_template("tools/image.html")
