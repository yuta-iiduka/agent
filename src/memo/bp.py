from server import *

NAME = "memo"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")


@bp.route("/",methods=["GET"])
@login_required
def index():
    query = []
    keywords = request.args.get("keywords",None)
    if keywords:
        keywords = keywords.replace("　"," ")
        for keyword in keywords.split(" "):
            query.append(Memo.name.like(f"%{keyword}%"))
            query.append(Memo.text.like(f"%{keyword}%"))

    memos = Memo.query.filter(or_(Memo.creator_id==current_user.id,Memo.updater_id==current_user.id)).filter(or_(*query)).all()
    user = User.query.all()
    map = {u.id: u for u in user}
    data = []
    for memo in memos:
        tmp = memo.to_dict()
        tmp["updater"] = map[memo.updater_id].to_dict()["name"]
        tmp["text"]    = ""
        data.append(tmp)

    return render_template("memo/index.html",data=data,keywords=keywords)

@bp.route("/create",methods=["GET"])
@login_required
def create():
    memo = Memo()
    return render_template("memo/create.html",data=memo)

@bp.route("/edit/<id>",methods=["GET"])
@login_required
def edit(id):
    memo = Memo.query.filter_by(id=id).first()
    return render_template("memo/edit.html",data=memo)

@bp.route("/save/<id>",methods=["POST"])
@login_required
def save(id):
    data = request.form
    memo = Memo.query.filter_by(id=id).first()
    if memo is None:
        memo = Memo()

    for k,v in data.items():
        print(k,v)
        if hasattr(memo,k):
            setattr(memo,k,v)

    if memo.creator_id is None or memo.creator_id == "":
        memo.creator_id = current_user.id
    memo.updater_id = current_user.id

    db.session.add(memo)
    db.session.commit()
    return redirect(url_for("memo.edit",id=memo.id))

@bp.route("/delete/<id>",methods=["GET","POST"])
@login_required
def delete(id):
    memo = Memo.query.filter_by(id=id).first()
    if memo is None:
        flash("削除対象が見つかりませんでした")
    else:
        db.session.delete(memo)
        db.session.commit()
    return redirect(url_for("memo.index"))