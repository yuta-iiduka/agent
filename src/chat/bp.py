from server import *

NAME = "chat"
bp = Blueprint(NAME, __name__, url_prefix=f"/{NAME}")

@bp.route("/",methods=["GET"])
@login_required
@log
def index():
    room = Room.user_chat(current_user.id)
    if room is None:
        init_user_room()
    data = Room.index(current_user.id)
    return render_template("chat/index.html", data=data)

@bp.route("/room/create",methods=["POST"])
@login_required
@log
def room_create():
    try:
        data = request.get_json()
        print(data)
        id_list = data.get("id_list",[])
        id_list  = list(set(id_list))
        rom = Room()
        rom.name     = f"CHAT ROOM"
        rom.password = ""
        rom.status   = 1
        rom.group    = current_user.group
        rom.owner_id = current_user.id
        db.session.add(rom)
        db.session.flush()

        for user_id in id_list:
            relation = RelationRoomToUser()
            relation.user_id = user_id
            relation.room_id = rom.id
            db.session.add(relation)

        db.session.commit()
        result = jsonify({"message":"ルームの作成に成功しました。"})
    except Exception as e:
        print(e)
        db.session.rollback()
        result = jsonify({"message":"ルームの作成に失敗しました。"})

    print(result)
    return result



@bp.route("/chat/<room_id>",methods=["GET"])
@login_required
def room(room_id):
    room = Room.query.filter_by(id=room_id).first()
    data = []
    if room is None:
        flash("チャットルームの取得に失敗しました。")
        room = Room()
    else:
        data = Room.chat(room.id)

    return render_template("chat/room.html", room=room, data=data)

@bp.route("/chat/<room_id>",methods=["POST"])
@login_required
def post(room_id):
    data = request.form
    print(data)
    room_id = data.get("room_id",None)
    method = "create"
    text =""
    if room_id:
        id = data.get("id", -1)
        id = -1 if id == "" or id is None else id
        room_chat = RoomChat.query.filter_by(id=id).first()
        if room_chat is None:
            room_chat = RoomChat(
                id      = RoomChat.max_id() + 1,
                text    = data.get("text",None),
                user_id = current_user.id,
                room_id = int(room_id),
            )
            db.session.add(room_chat)
            db.session.commit()
            text = render_template("chat/chat.html", data=room_chat, user=current_user)
        else:
            room_chat.text = data.get("text",None)
            method = "update"
            text = room_chat.text
            db.session.add(room_chat)
            db.session.commit()

    else:
        flash("登録するチャットルームが見つかりませんでした。")

    socketio.emit(
        "chat",
        {"method":method,"id":room_chat.id,"text":text},
        to=f"chat-room-{room_id}"
    )
    return render_template("chat/chat.html", data=room_chat, user=current_user)

@bp.route("/chat/<room_id>",methods=["DELETE"])
@login_required
def delete(room_id):
    data = request.form
    print(data)
    room_chat = RoomChat.query.filter_by(id=data.get("id","-1")).first()
    if room_chat:
        db.session.delete(room_chat)
        db.session.commit()
        socketio.emit("chat",{"method":"delete","id":room_chat.id},to=f"chat-room-{room_id}")
    else:
        return jsonify({"message":"削除に失敗しました。"})

    return jsonify({"message":"削除に成功しました。"})

@bp.route("/chat/<room_id>",methods=["PUT"])
@login_required
def put(room_id):
    return post(room_id)


@socketio.event
def join_chat_room(data):
    print("join_chat_room",data)
    room_id = data.get("room_id")
    if room_id:
        room = f"chat-room-{room_id}"
        join_room(room)
        data["room"] = room
        socketio.emit("message", data, to=room)


@socketio.event
def message(data):
    print(data)
    room = data.get("room",None)
    socketio.emit("message", data, to=room)

@log
def init_user_room():
    result = False
    try:
        room = Room(
            name="MY ROOM",
            password = "",
            group = current_user.group,
            owner_id = current_user.id,
        )
        db.session.add(room)
        db.session.flush()

        relation = RelationRoomToUser(
            room_id = room.id,
            user_id = current_user.id
        )
        db.session.add(relation)
        db.session.commit()

        result = True
    except Exception as e:
        print(e)

    return result
