from server import *

NAME = "user"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")


@bp.route("/index",methods=["GET"])
@login_required
@log
def index():
    return jsonify(User.to_dict_list(User.query.all()))

@bp.route("/edit",methods=["GET","POST"])
@login_required
@log
def edit():
    if request.method == "POST":
        data = request.form
        print(data)
        try:
            user = User.query.filter_by(id=current_user.id).first()
            user.name  = data.get("name",  current_user.name)
            user.email = data.get("email", current_user.email)
            icon = request.files.get("icon",None)
            if icon:
                icon_data = icon.read()
                img_data = ImageData(first_read=False)
                img_data.data  = icon_data
                img_data.image = img_data.bytes_to_image()
                img_data.image = img_data.resize((64,64))
                user.icon = img_data.image_to_data_url()
            db.session.add(user)
            db.session.commit()
            flash("ユーザ情報の更新が成功しました。")
        except Exception as e:
            print(e)
            logger.error_all("ユーザ情報の更新に失敗したときの変数")
            flash("ユーザ情報の更新が失敗しました。")
            db.session.rollback()

    return render_template("user/edit.html")
