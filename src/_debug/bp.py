from server import *

NAME = "_debug"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")

if settings.env == "develop":

    @bp.route("/",methods=["GET"])
    @login_required
    def menu():
        return render_template("_debug/menu.html")

    @bp.route("/tables",methods=["GET"])
    @login_required
    def tables():
        return render_template("_debug/tables.html", models=Models().info)

    @bp.route("/table/<table>",methods=["GET"])
    @login_required
    def table(table):
        return render_template("_debug/table.html", model=Models().info[table], data=Models().info[table]["class"].query.all())
