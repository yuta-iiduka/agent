from server import *

NAME = "home"
bp = Blueprint(NAME, __name__)


@bp.route("/",methods=["GET"])
@login_required
def home():
    return render_template("home/home.html")
