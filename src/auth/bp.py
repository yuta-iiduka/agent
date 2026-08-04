from server import *

NAME = "auth"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")

@bp.route("/login",methods=["GET","POST"])
@log
def login():
    if request.method == "POST":
        print(request.form)
        email = request.form["email"]
        password = request.form["password"]
        next = request.form["next"]
        user = User.query.filter_by(email=email).first()
        if user is not None:
            if user.verify_password(password):
                login_user(user)
                if next is not None and next != "":
                    return redirect(next)
                else:
                    return redirect(url_for("home.home"))
            else:
                flash("パスワードが違います。")
        else:
            flash("メールアドレスが違います。",)
    return render_template("auth/login.html", next=request.args.get("next"))

@bp.route("/signup",methods=["GET","POST"])
@transaction
@log
def signup():
    next_ = request.args.get("next")
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = User.query.filter_by(email=email).first()
        if user is None:
            user = User(
                name = None,
                email = email,
                password = password,
            )

            db.session.add(user)

            user = User.query.filter_by(email=email).first()

            if user is not None:
                login_user(user)
                if next_ is not None:
                    return redirect(next_)
                else:
                    return redirect("/")
            else:
                flash("ユーザ登録に失敗しました。")
        else:
            flash("既にメールアドレスが利用されています。")
    return render_template("auth/signup.html")

@bp.route("/logout",methods=["GET"])
@login_required
@log
def logout():
    logout_user()
    return redirect(url_for("auth.login"))

@socketio.event
def connect():
    print("connect")
    join_room("room-{}".format(current_user.id))
