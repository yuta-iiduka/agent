""" 通信モジュール
## 高負荷の場合OSの設定が必須
大量台数との同時接続は必ずインフラの設定を変える。
## ①設定値を確認
ulimit -n
1024 #多分初期値
## ②設定を変更
ulimit -n 60000
または /etc/security/limits.conf で
* soft nofile 60000
* hard nofile 60000
## ③ネットワークパラメータをチューニング
sysctl -w net.core.somaxconn=60000
sysctl -w net.ipv4.tcp_max_syn_backlog=60000
sysctl -w net.ipv4.ip_local_port_range="1024 65535"

### Example
``` 同期処理として非同期処理のUDPを組み込む場合のサンプル
from common.communication import *
async def send():
    udp = UDPClient("::1",50300)
    udp.run()
    udp.enqueue({"callback":"test","message":"This is TEST."},("::1",50300))
    i = 0
    while True and i < 10:
        await asyncio.sleep(1)
        i += 1

if __name__ == "__main__":
    # 同期処理スレッドとして管理する 
    t = threading.Thread(target=asyncio.run,args=(send(),))
    t.start()
```

```
    UDPG系統のクラスを使う場合を実行しておく。
    from gevent import monkey
    monkey.patch_all()
```
"""
import asyncio, json, struct, uuid, socket, base64, time, threading, inspect, copy

is_enable_gevent = False
try:
    import gevent
    from gevent import  queue, lock, socket
    is_enable_gevent = True
except Exception as e:
    is_enable_gevent = False


is_enable_netifaces = False
try:
    import netifaces
    is_enable_netifaces = True
except Exception as e:
    is_enable_netifaces = False

INTERVAL_TIME = 0.001
INTERVAL_NONE = 0
TIMEOUT_TIME = 3
RETRY_TIME = 2
MAX_PACKET_SIZE = 1024 #4096 # 2048 # 1024  # 分割サイズ
HEADER_FORMAT = "!I"    # 4byte length header
DUAL_STUCK_HOST = "::"
DUAL_STUCK_DEST = "::1"
LOCAL_HOST = "127.0.0.1"
FLOWINFO = 0
SCOPEID = 0
KEEP_TIME = 3600
RECEIVE_SIZE = 65536


class AddressResolver:
    """
    文字列（ホスト名）を IPv4 / IPv6 のアドレスへ解決するクラス
    """
    @staticmethod
    def resolve(host: str = "0.0.0.0", port: int = 9999):
        """ 
        ### Outlines
            ホストとポートからアドレス情報を返却するメソッド

        ### Args
            host: (str) ホスト
            port: (int) ポート

        ### Returns:
            IPv4 の場合は '(ip, port)'
            IPv6 の場合は '(ip, port, flowinfo, scopeid)'
        """
        try:
            # first try IPv4
            addrinfo = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
            return addrinfo[0][4]  # (ip, port)
        except socket.gaierror:
            # IPv6 fallback
            addrinfo = socket.getaddrinfo(host, port, socket.AF_INET6, socket.SOCK_STREAM)
            return addrinfo[0][4]  # (ip, port, flowinfo, scopeid)

class Packet:
    """ 
    パケットの生成クラス
    """
    def __init__(self, data: dict):
        self.data = data

    def encode(self):
        raw = json.dumps(self.data).encode()
        return struct.pack(HEADER_FORMAT, len(raw)) + raw

    @staticmethod
    async def read(reader: asyncio.StreamReader):
        header = await reader.readexactly(4)
        size = struct.unpack(HEADER_FORMAT, header)[0]
        body = await reader.readexactly(size)
        return json.loads(body.decode())

    @staticmethod
    def split(data: bytes):
        """
        データを MAX_PACKET_SIZE で分割し、分割情報を辞書型でまとめたリストを返す。

        ### Args
            data : bytes
                分割したいバイト列

        ### Returns
            tuple (packet_id, chunks)
                packet_id : str
                    UUID で生成されたパケット ID
                chunks : list[dict]
                    分割したチャンクを格納したリスト
                    1 要素しか無い場合もある
        """
        total = len(data)

        # 1 要素だけのリストにするケース
        if total <= MAX_PACKET_SIZE:
            packet_id = str(uuid.uuid4())
            chunk = {
                "type": "chunk",
                "id": packet_id,
                "index": 0,
                "total": 1,
                "data": data.decode('latin1')
            }
            return packet_id, [chunk]

        # それ以外は通常通り分割
        packet_id = str(uuid.uuid4())
        chunks = []
        for i in range(0, total, MAX_PACKET_SIZE):
            chunk_data = data[i:i + MAX_PACKET_SIZE]
            chunk = {
                "type": "chunk",
                "id": packet_id,
                "index": i // MAX_PACKET_SIZE,
                "total": (total + MAX_PACKET_SIZE - 1) // MAX_PACKET_SIZE,
                "data": chunk_data.decode('latin1')
            }
            chunks.append(chunk)
        return packet_id, chunks


class PacketAssembler:
    """ 
    パケット再構築クラス
    分割されたパケットを結合して、元のデータへ復元するクラス
    """
    def __init__(self,sleeper=None):
        self.buffers = {}
        self.timer = {}
        self.timeout = TIMEOUT_TIME
        self.stop = None
        self.sleeper = sleeper if sleeper else time
        self.cleaner = None
        self.start_cleaner()

    def add(self, packet):
        pid = packet["id"]

        if pid not in self.buffers:
            self.buffers[pid] = {
                "chunks": {},
                "total": packet["total"],
            }

        self.buffers[pid]["chunks"][packet["index"]] = packet["data"]
        self.timer[pid] = time.time()

        if len(self.buffers[pid]["chunks"]) == self.buffers[pid]["total"]:
            data = "".join(
                self.buffers[pid]["chunks"][i]
                for i in range(self.buffers[pid]["total"])
            )
            del self.buffers[pid]
            del self.timer[pid]
            return data.encode("latin1")
        return None
    
    def loss(self,pid):
        target = self.buffers[pid]  # {chunks{index,data},total,filename}
        chunks = target["chunks"]   # {index:data}
        exist_id = set([index for index, data in chunks.items()])
        total_id = set([index for index in range(target["total"])])
        diff = total_id - exist_id

        return list(diff)
    
    def delete(self, pid):
        del self.buffers[pid]
        del self.timer[pid]

    def timeout_check(self):
        while not self.stop.is_set():
            self.sleeper.sleep(1)
            now = time.time()
            targets = {**self.timer}
            for pid, last_time in targets.items():
                # （現在時刻）が（最終更新日時＋タイムアウト猶予時間）をオーバーした場合はパケットのバッファーを削除
                if now > last_time + self.timeout:            
                    self.delete(pid)

    def start_cleaner(self):
        self.stop = threading.Event()
        self.cleaner = threading.Thread(target=self.timeout_check,args=(),name="timeout_cleaner",daemon=True)
        self.cleaner.start()
        return self.cleaner

    def stop_cleaner(self):
        if self.cleaner:
            self.stop.set()
            self.cleaner.join()
            self.cleaner = None
            self.stop.clear()
        return self.cleaner

class CommunicationTask:
    """ 通信タスククラス
    通信データが送信し、受信まで完了していることを管理する。
    """
    def __init__(self, sleeper=None):
        self.task = {}
        self.keep_time = KEEP_TIME # INT
        self.sleeper = sleeper if sleeper else time

    def append(self):
        _uuid = str(uuid.uuid4())
        self.task[_uuid] = {"at":time.time(),"done":False}
        return _uuid
    
    def remove(self, uuid:str):
        result = False
        try:
            self.task[uuid] = None
            del self.task[uuid]
            result = True
        except Exception as e:
            print(e)
        return result

    def status(self, uuid:str, status:bool):
        result = False
        try:
            self.task[uuid]["done"] = status
            result = True
        except Exception as e:
            print(e)
        return result
    
    def is_done(self, uuid):
        """ タスクの完遂状況を取得するメソッド
        ### Args
            uuid(str): Pakcet UUID
        ### Returns
            result(bool): 完了(True)/未完(False)/タスク未登録(None)
        ### Note
            タスクのステータス管理はデフォルトでタイムアウト定数を参照して、タイムアウトする
            それ以降は、タスク未登録へリセットされるためNoneが返却されることに注意
        """
        result = None
        try:
            result = self.task[uuid]["done"]
        except Exception as e:
            print(e)
        return result
    
    def run(self):
        self.cleaner = threading.Thread(target=self.timeout,args=(),name="timeout",daemon=True)
        self.cleaner.start()
        return self.cleaner
    
    def timeout(self):
        while True:
            self.sleeper.sleep(1)
            now = time.time()
            for uid, st in self.task.items():
                # （現在時刻）が（最終更新日時＋タイムアウト猶予時間）をオーバーした場合はパケットのバッファーを削除
                if now > st["at"] + self.keep_time:            
                    self.remove(uid)


class BaseConnection:
    """ 共通コネクションクラス
    ### Outlines
        主にsend(data),sendto(data,addr),sendfile(filename,filedata,addr)のメソッドを提供し、データの送受信を実現する。
        BaseConnectionのサブクラス
            --UDPServer
            --UDPClient
            --TCPServer
            --TCPClient

    ### Warnnings
        1.これらのサブクラスをさらに継承することで、DB接続やHTTPサーバとの連携、通信内容のバリデーションなどを実装する。
        2.上記の５つのオブジェクトを直接修正や編集することはない。
    """

    def __init__(self,host,port):
        self.host = host
        self.port = port
        self.logger = None
        self._receive_callback = None      # パケット全てに対して発火するコールバック関数登録用の変数
        self._closer = None                # 通信の停止を担当するオブジェクト
        self.assembler = PacketAssembler() # 分割されたパケットを復元するオブジェクト
        self.echos = {}                    # 相手からの応答が必要な場合にスタックさせるエコー保持用の辞書型データ
        self.timer = {}                    # パケットID:パケット受信の最終更新日時を保持
        self.taskmanager  = CommunicationTask()
        self.event_loop = asyncio.new_event_loop()
        self.queue = asyncio.Queue() # asyncio.Queue(maxsize=10000000)
        self.current_packet = {}
        self._save = None
        self._load = None
        self._remv = None
        self.send_lock = asyncio.Lock()
        self.closing = False
        self.saving = False
        self.status = "OPENING" # OPENING READY RECONNECTING CLOSED
        self.fileno = None
        self.family = self.get_address_family(self.host)

    def debug(self,*args,**kwargs):
        if self.logger:
            self.logger.debug(*args,**kwargs)

    @property
    def name(self):
        """
        ### Outlines
            自インスタンスのクラス名
        ### Args
            None
        ### Returns
            自インスタンスのクラス名を表現する文字列
        """
        return type(self).__name__
    
    def check_complete_send_packet(self,uuid):
        return self.taskmanager.is_done(uuid)

    def get_address_family(self, host):
        """
        ### Outlines
            内部の通信オブジェクトが扱うアドレスデータの構造へ解決するメソッド
        ### Args
            addr: (host, port)のtuple型データ
        ### Returns
            remote_addr: 解決された送信先のアドレスデータ
        ### Examples
        ```
            # 受信時の処理（コールバック）
            @server.receive
            async def on_receive(data, addr):
                print(f"[SERVER] from {addr}: {data}")
        ```
        """
        try:
            info = socket.getaddrinfo(host, None)[0]
            return info[0]
        except:
            return socket.AF_INET
        
    def get_resolve_address(self,addr):
        """
        ### Outlines
            内部の通信オブジェクトが扱うアドレスデータの構造へ解決するメソッド
        ### Args
            addr: (host, port)のtuple型データ
        ### Returns
            remote_addr: 解決された送信先のアドレスデータ
        ### Examples
        ```
            # 受信時の処理（コールバック）
            @server.receive
            async def on_receive(data, addr):
                print(f"[SERVER] from {addr}: {data}")
        ```
        """
        remote_addr = None
        if self.family == socket.AF_INET6:
            tmp = list(addr) # (host, port, flowinfo, scopeid)の構造になるようにする
            if len(tmp) <= 2:
                tmp.append(FLOWINFO)
                tmp.append(SCOPEID)
            remote_addr = tuple(tmp)
        else:
            remote_addr = addr

        return remote_addr

    def find_if_by_ip(self, ip:str):
        """
        ip (str) : 検索したい IP アドレス
        return: IP が割り当てられたインタフェース名, もしくは None
        """
            
        result = None

        if is_enable_netifaces and ip != "::1":
            for iface in netifaces.interfaces():          # すべてのインタフェースを列挙
                addrs = netifaces.ifaddresses(iface)      # そのインタフェースのアドレス一覧
                # IPv4 と IPv6 両方をチェック
                print(addrs)
                for family in (netifaces.AF_INET, netifaces.AF_INET6):
                    if family in addrs:
                        for addrinfo in addrs[family]:
                            print(addrinfo)
                            if ip in addrinfo.get('addr'):
                                result = iface
                                break
        return result

    def find_scopeid(self, ip:str):
        result = SCOPEID
        ifname = self.find_if_by_ip(ip)
        if ifname:
            print("ifname:",ifname)
            result = socket.if_nametoindex(ifname)
        return result
            
    def reuse(self,fileno):
        """
        create_datagram_endpoint(sock=sock,reuse_port=False)で指定することで使いまわせる
        """
        print("fileno:",fileno)
        sock = socket.fromfd(fd=fileno, family=self.family,type=socket.SOCK_DGRAM)
        return sock

    def receive(self, callback):
        """
        ### Outlines
            パケット受信時のコールバック関数登録メソッド
        ### Args
            callback: 引数(data:受信データ, addr:送信元のアドレスを表現したtuple型データ)をもつコールバック関数
        ### Returns
            callback: 引数のコールバック関数
        ### Examples
        ```
            # 受信時の処理（コールバック）
            @server.receive
            async def on_receive(data, addr):
                print(f"[SERVER] from {addr}: {data}")
        ```
        """
        self._receive_callback = callback
        return callback

    def callback(self,func):
        """
        ### Outlines
            受信したパケットのtype属性によって発火するコールバック関数登録メソッド
        ###  Arg
            func: 引数(data:受信データ, addr:送信元のアドレスを表現したtuple型データ)をもつコールバック関数
        ### Returns
            func: 引数のコールバック関数
        ### Example
        ```
            # data={"callback":"hoge","message":"HELLO WORLD!!"} に対して発火するコールバック関数の例
            # 受信時の処理（コールバック）
            @server.callback
            async def hoge(data, addr):
                print(f"[SERVER] from {addr}: {data}")
        ```
        """
        try:
            method = getattr(self,func.__name__)
            if not method:
                setattr(self,func.__name__,func)
            else:
                raise Exception("duplication callback function name.")

        except Exception as e:
            setattr(self,func.__name__,func)
        return func
    
    async def wait(self):
        while self.status != "READY":
            await asyncio.sleep(0.1)

    async def _handle_data(self, data, addr=None):
        if isinstance(data, dict) and data.get("type",None) == "chunk":
            if "UDP" in self.name and data.get("data",None) and "_ack" not in data["data"]:
                # エコーと完了の通知は再度エコーしない。（無限ループになるため）
                await self._echo(data, addr)

            assembled = self.assembler.add(data)
            if assembled:
                obj = json.loads(assembled.decode())
                # UUIDの指定とエコー要求があれば、受信応答を送る
                if obj.get("_uuid",None) and obj.get("echo",False):
                    await self._done(obj,addr)
                # 要求されたコールバックを発火
                await self._invoke(obj,addr)

    async def _echo(self, data, addr=None):
        """ エコーメソッド。通信相手のackメソッドを呼び出す。
        """
        ack = {"callback":"_ack","id":data.get("id"),"index":data.get("index")}
        await self.sendto(ack, addr, wait=False)

    async def _set_echo(self, data, addr=None):
        id = data["id"]
        index = data["index"]
        remote_addr = self.get_resolve_address(addr)
        self.echos[(id, index, remote_addr)] = False

    async def _wait_echo(self, data, addr=None):
        """ エコーの応答を待ち、かえって来ない場合は失敗
        """
        timeout = time.time() + TIMEOUT_TIME
        while time.time() < timeout:
            id = data.get("id")
            index = data.get("index")
            remote_addr = self.get_resolve_address(addr)
            # print((id, index, remote_addr), self.echos.get((id, index, remote_addr), None))
            if self.echos.get((id, index, remote_addr), False):
                del self.echos[(id, index, remote_addr)]
                return False
            # await asyncio.sleep(0.1)
            await asyncio.sleep(INTERVAL_TIME)
        return True
    
    async def _done(self, data, addr=None):
        # UDP用の全データ受信完了のデータ送信
        dn = {"callback":"done","_uuid":data.get("_uuid"),"echo":False}
        await asyncio.sleep(INTERVAL_TIME)
        await self.sendto(dn, addr, wait=False)
        await asyncio.sleep(INTERVAL_TIME)

    async def _invoke(self,data,addr):
        try:
            # if isinstance(data, dict) and data.get("callback", None):
            typ = data["callback"]
            if hasattr(self,typ):
                method = getattr(self, typ)

                # 非同期処理のの場合はawaitを付与し、それ以外は通常実行する
                if inspect.iscoroutinefunction(method):
                    await method(data,addr)
                else:
                    method(data,addr)
            else:
                print(f"{typ} is not callback.")
        except Exception as e:
            self.debug(e)
            print(e)

        try:
            if self._receive_callback is not None:
                await self._receive_callback(data, addr)
        except Exception as e:
            self.debug(e)
            print(e)

    async def _ack(self,data,addr):
        id = data.get("id")
        index = data.get("index")
        remote_addr = self.get_resolve_address(addr)
        # print("ack",(id, index, remote_addr), self.echos[(id, index, remote_addr)])
        self.echos[(id, index, remote_addr)] = True

    async def done(self,data,addr):
        # UDP用の全データ受信完了通知の受信用メソッド
        uuid = data.get("_uuid")
        self.taskmanager.status(uuid,True)
        # print("task",self.taskmanager.task)

    async def file(self, data, addr):
        if data:
            print("file writing")
            filedata = base64.b64decode(data["filedata"])
            filename = data["filename"]
            id = data.get("id",None)
            print("filename:" , filename)

            # ファイル保存
            with open(f"{filename}", mode="wb") as f:
                f.write(filedata)
            # await self.sendto({"callback":"arrival","filename":filename,"id":id}, addr)

    async def send(self, data, wait=True):
        pass

    async def sendto(self, data, addr=None, wait=True):
        pass

    async def sendfile(self, filename, filedata, addr=None, queue=False):
        print("filename",filename)
        data = {"callback":"file","filedata":base64.b64encode(filedata).decode("ascii"),"filename":filename}
        if addr:
            if queue:
                return self.enqueue(data,addr)
            else:
                return await self.sendto(data, addr)
        else:
            if queue:
                return self.enqueue(data,addr)
            else:
                return await self.send(data)
    
    
    async def send_by_open_file(self, filepath, savepath, addr=None, queue=False):
        result = False
        data = None
        try:
            with open(filepath,"rb") as f:
                data = f.read()
        except Exception as e:
            print(e)
        
        if data:
            result = await self.sendfile(savepath, data, addr, queue)
        return result
    
    async def open(self,fileno=None):
        pass

    async def close(self):
        pass

    def connection_lost(self, exc):
        print("接続が閉じられました:", exc)
    
    def error_received(self, exc):
        print("UDPエラー:", exc)
        if self.status == "READY":
            self.status = "RECONNECTING"
            asyncio.create_task(self.reconnect())

    async def reconnect(self):
        if self.status != "RECONNECTING":
            return
        try:
            await self.close()
        except Exception as e:
            print(e)
        while True:
            try:
                await asyncio.sleep(1)
                await self.open()
                break
            except Exception as e:
                print(e)

    def run(self,fileno=None):
        """ Queue送信ワーカータスクを生成
        ### Note
            単なるサーバを起動(シンプルなパケットのやり取りのみを行う)
        """
        asyncio.create_task(self.open(fileno))
    
    def coroutine(self,async_task):
        """ 別イベントループにタスクを登録する同期処理メソッド
        ```
            # 戻り値の取得
            result = self.coroutine(async_task).result()
        ```
        """
        return asyncio.create_task(async_task)
        
    def enqueue(self,data,addr):
        result = None
        try:
            uuid = self.taskmanager.append()
            data["_uuid"] = uuid
            data["echo"] = True
            item = {
                "data": data,
                "addr": addr,
                "retry": 0,
                "created": time.time()
            }
            self.queue.put_nowait(item)
            result = uuid
        except Exception as e:
            print(e)
        return result

    async def worker(self):
        """ 未送信データの送信ワーカー(主にUDP用)
        """
        print("worker is running")
        async def resend(item):
            item["retry"] += 1
            if item["retry"] <= RETRY_TIME:
                await asyncio.sleep(2 ** item["retry"])
                self.queue.put_nowait(item)
            else:
                self.save(item)
        
        while True:
            item = await self.queue.get()
            uuid = item["data"]["_uuid"]
            self.current_packet[uuid] = item
            try:
                ok = await self.sendto(item["data"],item["addr"])
                if ok:
                    self.remove(item)
                    del self.current_packet[uuid]
                else:
                    await resend(item)
            except Exception as e:
                print(e)
                await resend(item)
            finally:
                self.queue.task_done()
            await asyncio.sleep(INTERVAL_TIME)
            
    def save(self,item):
        """ 未送信データの保存メソッド
        item = {
            "_uuid"   : uuid,
            "echo"    : True,
            "data"    : data,
            "addr"    : addr,
            "retry"   : 0,
            "created" : time.time()
        }
        """
        if callable(self._save):
            return self._save(item)
        
    def save_handler(self,func):
        """ 未送信データ保存メソッド登録デコレータ
        ### Examples
        ```
            @instance.save_handler
            def hoge(item):
                # データベースやファイルに保存する処理
        ```
        """
        self._save = func
        return func
    
    def load(self):
        """ 未送信データの読込メソッド
        """
        if callable(self._load):
            items = self._load()
            for item in items:
                self.enqueue(item["data"],item["addr"])

    def load_handler(self,func):
        """ 未送信データ読込メソッド登録デコレータ
        ### Examples
        ```
            @instance.load_handler
            def hoge():
                # データベースやファイルから読込処理
                return items
        ```
        """
        self._load = func
        return func
    
    def remove(self,item):
        if callable(self._remv):
            return self._remv(item)

    def remove_handler(self,func):
        """ 未送信データ読込メソッド登録デコレータ
        ### Examples
        ```
            @instance.remove_handler
            def hoge(items):
                # データベースやファイルから読込処理
                return items
        ```
        """
        self._remv = func
        return func    

class TCPServer(BaseConnection):
    def __init__(self, host=DUAL_STUCK_HOST, port=9999):
        super().__init__(host,port)
        self.host = host
        self.port = port
        self.clients = set()
        self.family = self.get_address_family(host)

    async def open(self,fileno=None):
        # reuse_port=True で複数のワーカでも使いまわせるはず
        server = await asyncio.start_server(self._handle_client, self.host, self.port, family=self.family)
        self._closer = server
        async def _open(server):
            async with server:
                await server.serve_forever()

        asyncio.create_task(_open(server))

    async def close(self):
        if self.server is None:
            raise Exception("サーバは起動していません。")
        self.server.close()
        self.server = None
            
    async def _handle_client(self, reader, writer):
        addr = writer.get_extra_info("peername")
        self.clients.add(writer)

        try:
            while True:
                data = await Packet.read(reader)
                await self._handle_data(data, addr)
        except:
            pass
        finally:
            self.clients.remove(writer)
            writer.close()
            await writer.wait_closed()

    async def send(self, data, wait=True):
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        try:
            for chunk in chunks:
                await self._broadcast(chunk)
                # await asyncio.sleep(INTERVAL_TIME)
                if wait:
                    await asyncio.sleep(INTERVAL_NONE)
        except Exception as e:
            print(e)
            result = False
        return result
        
    async def _broadcast(self, data):
        packet = Packet(data).encode()
        for client in [*self.clients]:
            client.write(packet)
            await client.drain()
            # await asyncio.sleep(INTERVAL_TIME)
            await asyncio.sleep(INTERVAL_NONE)

    async def sendto(self, data, addr=None, wait=True):
        if addr:
            remote_addr = self.get_resolve_address(addr)
            raw = json.dumps(data).encode()
            pid, chunks = Packet.split(raw)
            result = True
            try:
                for chunk in chunks:
                    for client in [*self.clients]:
                        if client.get_extra_info("peername") == remote_addr:
                            packet = Packet(chunk).encode()
                            client.write(packet)
                            await client.drain()
                            if wait:
                                await asyncio.sleep(INTERVAL_TIME)
                            # await asyncio.sleep(INTERVAL_NONE)
            except Exception as e:
                print(e)
                result = False
            return result
        else:
            return await self.send(data)
        
    def error_received(self, exc):
        super().error_received(exc)


class TCPClient(BaseConnection):
    def __init__(self, host=DUAL_STUCK_DEST, port=9999, local_port=9999):
        super().__init__(host,port)
        self.host = host
        self.port = port
        self.local_port = local_port
        self.reader = None
        self.writer = None
        self.family = self.get_address_family(host)
        self._closer = asyncio.Event()

    async def open(self,fileno=None):
        # loop = asyncio.get_running_loop()
        # # sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # sock = socket.socket(self.family, socket.SOCK_STREAM)
        # addr = None
        # if self.local_port:
        #     if self.family == socket.AF_INET6:
        #         sock.bind(("::", self.local_port))
        #         sock.setblocking(False)
        #         addr = (self.host, self.port, FLOWINFO, SCOPEID) # (host, port, flowinfo, scopeid)
        #     else:
        #         sock.bind((LOCAL_HOST, self.local_port))
        #         sock.setblocking(False)
        #         addr = (self.host, self.port)

        # await loop.sock_connect(sock, addr)
        # self.reader, self.writer = await asyncio.open_connection(sock=sock)
        # asyncio.create_task(self._listen())
        self._reconnect_task = asyncio.create_task(self._connect_loop())

    async def _connect_loop(self):
        retry = 0

        while not self._closer.is_set():
            try:
                print("接続試行中...")
                await self._connect()
                print("接続成功")

                retry = 0  # 成功したらリセット
                await self._listen()

            except Exception as e:
                print("接続エラー:", e)

            # 再接続待機（バックオフ）
            retry += 1
            wait = min(2 ** retry, 30)
            print(f"{wait}秒後に再接続...")
            await asyncio.sleep(wait)

    async def _connect(self):
        loop = asyncio.get_running_loop()
        sock = socket.socket(self.family, socket.SOCK_STREAM)

        if self.local_port:
            if self.family == socket.AF_INET6:
                sock.bind(("::", self.local_port))
                addr = (self.host, self.port, FLOWINFO, SCOPEID)
            else:
                sock.bind((LOCAL_HOST, self.local_port))
                addr = (self.host, self.port)

        sock.setblocking(False)
        await loop.sock_connect(sock, addr)

        self.reader, self.writer = await asyncio.open_connection(sock=sock)

    async def close(self):
        self._closer.set()
        if self.writer:
            self.writer.close()
            await self.writer.wait_closed()

    async def _listen(self):
        while not self._closer.is_set():
            data = await Packet.read(self.reader)
            await self._handle_data(data,(self.host, self.port))

        self._closer.clear()

    async def send(self, data, wait=True):
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        try:
            for chunk in chunks:
                await self._send(chunk)
                # await asyncio.sleep(INTERVAL_TIME)
                if wait:
                    await asyncio.sleep(INTERVAL_NONE)
        except Exception as e:
            print(e)
            result = False
        return result
                

    async def _send(self, data):
        packet = Packet(data).encode()
        self.writer.write(packet)
        await self.writer.drain()

    async def sendto(self, data, addr=None, wait=True):
        return await self.send(data,wait=wait)
    
    def error_received(self, exc):
        super().error_received(exc)

class UDPServer(BaseConnection):
    def __init__(self, host=DUAL_STUCK_HOST, port=9999):
        super().__init__(host,port)
        self.host = host
        self.port = port
        self.transport = None
        self.clients = set()
        self.family = self.get_address_family(host)

    async def open(self,fileno=None):
        self.status = "OPENING"
        try:
            loop = asyncio.get_running_loop()
            self._closer, self.protocol = (
                await loop.create_datagram_endpoint(
                    lambda: self,
                    local_addr=(self.host, self.port),
                    sock=self.reuse(fileno) if fileno else None,
                    family=self.family
                )
            )
            self.fileno = self._closer.get_extra_info('socket').fileno()
            self.status = "READY"
            asyncio.create_task(self.worker())
        except Exception as e:
            print(e)
            self.status = "RECONNECTING"

    async def close(self):
        self.status = "CLOSED"
        self.closing = True
        if self._closer:
            self._closer.close()
        self.transport = None
        self._closer = None
        self.protocol = None
        await asyncio.sleep(INTERVAL_TIME)
        self.closing = False

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        remote_addr = self.get_resolve_address(addr)
        self.clients.add(remote_addr)
        obj = json.loads(data.decode())
        asyncio.create_task(self._handle_data(obj, remote_addr))

    async def send(self, data, wait=True):
        await self.wait()
        if self.closing or self.transport is None:
            return False
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        try:
            async with self.send_lock:
                for chunk in chunks:
                    for i, addr in enumerate([*self.clients]):
                        await self._set_echo(chunk,addr)
                        self.transport.sendto(json.dumps(chunk).encode(),addr)
                        await asyncio.sleep(INTERVAL_TIME)
                        if wait:
                            retry = 0
                            while await self._wait_echo(chunk,addr) and retry < RETRY_TIME:
                                if retry >= RETRY_TIME:
                                    # raise Exception(f"送信に失敗しました。:{addr}:{data}")
                                    print(f"送信に失敗しました。:{addr}:{data}")
                                    result = False
                                else:
                                    self.transport.sendto(json.dumps(chunk).encode(),addr)
                                retry += 1

                        # await asyncio.sleep(INTERVAL_NONE)
                return result
        except Exception as e:
            print(e)
            result = False
            return result

    async def sendto(self, data, addr=None, wait=True):
        await self.wait()
        if self.closing or self.transport is None:
            return False
        
        remote_addr = self.get_resolve_address(addr)
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        try:
            async with self.send_lock:
                for i, chunk in enumerate(chunks):
                    if wait:
                        await self._set_echo(chunk,remote_addr)
                    self.transport.sendto(json.dumps(chunk).encode(), remote_addr)
                    await asyncio.sleep(INTERVAL_TIME)
                    if wait:
                        retry = 0
                        while await self._wait_echo(chunk,addr) and retry < RETRY_TIME:
                            if retry >= RETRY_TIME:
                                print(f"送信に失敗しました。:{addr}:{data}")
                                result = False
                            else:
                                self.transport.sendto(json.dumps(chunk).encode(), remote_addr)
                            retry += 1
                    # await asyncio.sleep(INTERVAL_NONE)
                return result
        except Exception as e:
            print(e)
            result = False
            return result

    def pause_writing(self):
        print("送信一時停止（バッファ満杯）")

    def resume_writing(self):
        print("送信再開")

    def error_received(self, exc):
        super().error_received(exc)
        cp = copy.deepcopy(self.current_packet)
        for uuid, item in cp.items():
            self.save(item)
            del self.current_packet[uuid]
            

class UDPClient(BaseConnection):
    def __init__(self, host=DUAL_STUCK_DEST, port=9999, local_port=None):
        super().__init__()
        self.host = host
        self.port = port
        self.local_port = local_port
        self.transport = None
        self.family = self.get_address_family(host)

    async def open(self,fileno=None):
        self.status = "OPENING"
        try:
            loop = asyncio.get_running_loop()
            local_addr = None
            remote_addr = None
            if self.family == socket.AF_INET6:
                local_addr = ("::", self.local_port) if self.local_port else None
                remote_addr = (self.host,self.port)
            else:
                local_addr = (LOCAL_HOST, self.local_port) if self.local_port else None
                remote_addr = (self.host,self.port)

            self._closer, self.protocol = (
            await loop.create_datagram_endpoint(
                lambda: self,
                remote_addr=remote_addr,
                local_addr=local_addr,
                sock=self.reuse(fileno) if fileno else None,
                family=self.family
                )
            )
            self.fileno = self._closer.get_extra_info('socket').fileno()
            self.status = "READY"
            asyncio.create_task(self.worker())

        except Exception as e:
            self.status = "RECONNECTING"
            raise e

    async def close(self):
        self.status = "CLOSED"
        self.closing = True
        if self._closer:
            self._closer.close()
        self.transport = None
        self._closer = None
        self.protocol = None
        await asyncio.sleep(INTERVAL_TIME)
        self.closing = False

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        remote_addr = self.get_resolve_address(addr)
        obj = json.loads(data.decode())
        asyncio.create_task(self._handle_data(obj, remote_addr))

    async def send(self, data, wait=True):
        return await self.sendto(data, wait)

    async def sendto(self, data, addr=None, wait=True):
        await self.wait()
        if self.closing or self.transport is None:
            return False
        remote_addr = self.get_resolve_address(addr)
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True

        try:
            async with self.send_lock:
                for i, chunk in enumerate(chunks):
                    if wait:
                        await self._set_echo(chunk,remote_addr)
                    self.transport.sendto(json.dumps(chunk).encode(),remote_addr)
                    await asyncio.sleep(INTERVAL_TIME)
                    if wait:
                        retry = 0
                        while await self._wait_echo(chunk,addr) and retry < RETRY_TIME:
                            if retry >= RETRY_TIME:
                                print(f"送信に失敗しました。:{addr}:{data}")
                                result = False
                            else:
                                self.transport.sendto(json.dumps(chunk).encode(),addr)
                            retry += 1
            return result
        except Exception as e:
            print(e)
            result = False
            return result

    def pause_writing(self):
        print("送信一時停止（バッファ満杯）")

    def resume_writing(self):
        print("送信再開")

    def error_received(self, exc):
        super().error_received(exc)
        cp = copy.deepcopy(self.current_packet)
        for uuid, item in cp.items():
            self.save(item)
            del self.current_packet[uuid]


class GeventConnection(BaseConnection):

    def __init__(self,host,port):
        self.host = host
        self.port = port
        self.family = self.get_address_family(host)
        self.logger = None
        self._receive_callback = None      # パケット全てに対して発火するコールバック関数登録用の変数
        self._closer = None                # 通信の停止を担当するオブジェクト
        self.assembler = PacketAssembler(sleeper=gevent) # 分割されたパケットを復元するオブジェクト
        self.echos = {}                    # 相手からの応答が必要な場合にスタックさせるエコー保持用の辞書型データ
        self.timer = {}                    # パケットID:パケット受信の最終更新日時を保持
        self.taskmanager  = CommunicationTask(sleeper=gevent)
        self.queue = queue.Queue()
        self.current_packet = {}
        self.transport = None
        self._save = None
        self._load = None
        self._remv = None
        self.send_lock = lock.RLock()
        self.closing = False
        self.saving = False
        self.status = "OPENING" # OPENING READY RECONNECTING CLOSED
        self.partners = set()
        self.fileno = None

    def debug(self,*args,**kwargs):
        if self.logger:
            self.logger.debug(*args,**kwargs)

    @property
    def name(self):
        return super().name
    
    def check_complete_send_packet(self, uuid):
        return super().check_complete_send_packet(uuid)
    
    def get_address_family(self, host):
        return super().get_address_family(host)
    
    def get_resolve_address(self, addr):
        return super().get_resolve_address(addr)
    
    def receive(self, callback):
        return super().receive(callback)
    
    def callback(self, func):
        return super().callback(func)

    def wait(self):
        while self.status != "READY":
            gevent.sleep(0.1)

    def _handle_data(self, data, addr=None):
        if isinstance(data, dict) and data.get("type") == "chunk":
            if "UDP" in self.name and data.get("data",None) and "_ack" not in data["data"]:
                # エコーと完了の通知は再度エコーしない。（無限ループになるため）
                gevent.spawn(self._echo, data, addr)

            assembled = self.assembler.add(data)
            if assembled:
                obj = json.loads(assembled.decode())
                # UUIDの指定とエコー要求があれば、受信応答を送る
                if obj.get("_uuid",None) and obj.get("echo",False):
                    gevent.spawn(self._done, obj, addr)
                # 要求されたコールバックを発火
                gevent.spawn(self._invoke, obj, addr)

    def _echo(self, data, addr=None):
        ack = {"callback":"_ack","id":data.get("id"),"index":data.get("index")}
        gevent.spawn(self.sendto, ack, addr, wait=False)

    def _set_echo(self, data, addr=None):
        id = data["id"]
        index = data["index"]
        # remote_addr = self.get_resolve_address(addr)
        remote_addr = addr
        self.echos[(id, index, remote_addr[:2])] = False

    def _wait_echo(self, data, addr=None):
        """ エコーの応答を待ち、かえって来ない場合は失敗
        """
        timeout = time.time() + TIMEOUT_TIME
        while time.time() < timeout:
            id = data.get("id")
            index = data.get("index")
            # remote_addr = self.get_resolve_address(addr)
            remote_addr = addr
            if self.echos.get((id, index, remote_addr[:2]), False):
                del self.echos[(id, index, remote_addr[:2])]
                return False
            gevent.sleep(INTERVAL_TIME)
        return True

    def _done(self, data, addr=None):
        dn = {"callback":"done","_uuid":data.get("_uuid"),"echo":False}
        gevent.sleep(INTERVAL_TIME)
        gevent.spawn(self.sendto,dn, addr, wait=False)
        gevent.sleep(INTERVAL_TIME)

    def _invoke(self, data, addr):
        try:
            # if isinstance(data, dict) and data.get("callback", None):
            typ = data["callback"]
            if hasattr(self,typ):
                method = getattr(self, typ)
                # 非同期処理のの場合はawaitを付与し、それ以外は通常実行する
                method(data,addr)
            else:
                print(f"{typ} is not callback.")
        except Exception as e:
            self.debug(e)
            print(e)

        try:
            if self._receive_callback is not None:
                self._receive_callback(data, addr)
        except Exception as e:
            self.debug(e)
            print(e)

    def _ack(self, data, addr):
        id = data.get("id")
        index = data.get("index")
        # remote_addr = self.get_resolve_address(addr)
        remote_addr = addr
        # print("ack",(id, index, remote_addr), self.echos[(id, index, remote_addr)])
        self.echos[(id, index, remote_addr)] = True
    
    def done(self, data, addr):
        # UDP用の全データ受信完了通知の受信用メソッド
        uuid = data.get("_uuid")
        self.taskmanager.status(uuid,True)

    def file(self, data, addr):
        if data:
            print("file writing")
            filedata = base64.b64decode(data["filedata"])
            filename = data["filename"]
            id = data.get("id",None)
            print("filename:" , filename)

            # ファイル保存
            with open(f"{filename}", mode="wb") as f:
                f.write(filedata)

    def open(self,fileno=None):
        raise NotImplementedError
    
    def close(self):
        raise NotImplementedError

    def send(self, data, wait=True):
        raise NotImplementedError

    def sendto(self, data, addr=None, wait=True):
        raise NotImplementedError

    def sendfile(self, filename, filedata, addr=None, queue=False):
        print("filename:",filename)
        data = {"callback":"file","filedata":base64.b64encode(filedata).decode("ascii"),"filename":filename}
        if addr:
            if queue:
                return gevent.spawn(self.enqueue,data,addr).get()
            else:
                return gevent.spawn(self.sendto, data, addr).get()
        else:
            if queue:
                return gevent.spawn(self.enqueue,data,addr).get()
            else:
                return gevent.spawn(self.send, data).get()

    def send_by_open_file(self, filepath, savepath, addr=None, queue=False):
        result = False
        data = None
        try:
            with open(filepath,"rb") as f:
                data = f.read()
        except Exception as e:
            self.debug(e)
            print(e)
        
        if data:
            result = gevent.spawn(self.sendfile, savepath, data, addr, queue).get()
        return result
    

    def reconnect(self):
        if self.status != "RECONNECTING":
            return
        try:
            gevent.spawn(self.close)
        except Exception as e:
            print(e)

        while True:
            try:
                gevent.sleep(1)
                gevent.spawn(self,open)
                break
            except Exception as e:
                print(e)

    def run(self,fileno=None):
        gevent.spawn(self.open,fileno).get()
        self.taskmanager.run()

    def coroutine(self, task):
        return gevent.spawn(task).get()
    
    def enqueue(self, data, addr):
        result = None
        try:
            uuid = self.taskmanager.append()
            data["_uuid"] = uuid
            data["echo"] = True
            item = {
                "data": data,
                "addr": addr,
                "retry": 0,
                "created": time.time()
            }
            self.queue.put_nowait(item)
            result = uuid
        except Exception as e:
            self.debug(e)
            print(e)

        return result
    
    def _worker(self):
        """ 未送信データの送信ワーカー(主にUDP用)
        """
        print("worker is running")
        def resend(item):
            item["retry"] += 1
            if item["retry"] <= RETRY_TIME:
                gevent.sleep(2 ** item["retry"])
                self.queue.put_nowait(item)
            else:
                self.save(item)
        
        while True:
            item = self.queue.get()
            uuid = item["data"]["_uuid"]
            self.current_packet[uuid] = item
            try:
                print("worker sending:", item["addr"])
                ok = gevent.spawn(self.sendto,item["data"],item["addr"]).get()
                print("ok",ok)
                if ok:
                    self.remove(item)
                    del self.current_packet[uuid]
                else:
                    gevent.spawn(resend,item).get()
            except Exception as e:
                print(e)
                gevent.spawn(resend,item).get()
            gevent.sleep(INTERVAL_TIME)

    def _receiver(self):
        while self.status == "READY":
            try:
                raw, addr = self.transport.recvfrom(RECEIVE_SIZE)
                obj = json.loads(raw.decode())
                self.partners.add(addr)
                gevent.spawn(self._handle_data, obj, addr)
            except socket.error as e:
                print(e)
                break

    def save(self, item):
        return super().save(item)
    
    def save_handler(self, func):
        return super().save_handler(func)
    
    def load(self):
        return super().load()
    
    def load_handler(self, func):
        return super().load_handler(func)
    
    def remove(self, item):
        return super().remove(item)
    
    def remove_handler(self, func):
        return super().remove_handler(func)


class UDPGServer(GeventConnection):
    def __init__(self, host=DUAL_STUCK_HOST, port=9999):
        super().__init__(host,port)

    def open(self,fileno=None):
        self.status = "OPENING"
        try:
            # 受信ソケットを作成
            if fileno:
                self.transport = self.reuse(fileno)
            else:
                self.transport = socket.socket(self.family, socket.SOCK_DGRAM)
                if self.family == socket.AF_INET6 and self.host != DUAL_STUCK_HOST:
                    self.transport.bind((self.host, self.port, FLOWINFO, self.find_scopeid(self.host)))
                else:
                    self.transport.bind((self.host, self.port))
            self.fileno = self.transport.fileno()
            self.status = "READY"

            # 受信グリーンレット
            self.receiver = gevent.spawn(self._receiver)

            # 送信キューのワーカー
            self.worker = gevent.spawn(self._worker)
        except Exception as e:
            self.status = "CLOSED"
            raise e

    def close(self):
        self.status = "CLOSED"
        if self.transport:
            self.transport.close()
            self.transport = None

    def send(self, data, wait=True):
        gevent.spawn(self.wait).get()
        if self.closing or self.transport is None:
            return False

        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        for chunk in chunks:
            for i, addr in enumerate([*self.partners]): # NOTE:送信中に接続相手が増えるリスクがあるためコピーしておく
                gevent.spawn(self._set_echo,chunk,addr)
                self.transport.sendto(json.dumps(chunk).encode(),addr)
                gevent.sleep(INTERVAL_TIME)
                if wait:
                    retry = 0
                    while gevent.spawn(self._wait_echo,chunk,addr).get() and retry < RETRY_TIME:
                        if retry >= RETRY_TIME:
                            # raise Exception(f"送信に失敗しました。:{addr}:{data}")
                            print(f"送信に失敗しました。:{addr}:{data}")
                            result = False
                        else:
                            self.transport.sendto(json.dumps(chunk).encode(),addr)
                        retry += 1
        return result


    def sendto(self, data, addr=None, wait=True):
        gevent.spawn(self.wait).get()
        if self.closing or self.transport is None:
            return False
        
        remote_addr = self.get_resolve_address(addr)
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True
        try:
            for i, chunk in enumerate(chunks):
                if wait:
                    gevent.spawn(self._set_echo,chunk,remote_addr)
                self.transport.sendto(json.dumps(chunk).encode(), remote_addr)
                gevent.sleep(INTERVAL_TIME)
                if wait:
                    retry = 0
                    while gevent.spawn(self._wait_echo,chunk,addr).get() and retry < RETRY_TIME:
                        if retry >= RETRY_TIME:
                            print(f"送信に失敗しました。:{addr}:{data}")
                            result = False
                        else:
                            self.transport.sendto(json.dumps(chunk).encode(), remote_addr)
                        retry += 1
            return result
        except Exception as e:
            print(e)
            result = False
            return result


class UDPGClient(GeventConnection):
    def __init__(self, host=DUAL_STUCK_DEST, port=9999, local_port=None):
        super().__init__(host,port)
        self.local_port = local_port

    def open(self,fileno=None):
        self.status = "OPENING"
        try:
            local_addr = None
            remote_addr = (self.host,self.port)
            if self.family == socket.AF_INET6 and self.host != DUAL_STUCK_HOST:
                local_addr = (self.host, self.local_port, FLOWINFO, self.find_scopeid(self.host)) if self.local_port else None
            else:
                local_addr = (self.host, self.local_port) if self.local_port else None

            if fileno:
                self.transport = self.reuse(fileno)
            else:
                self.transport = socket.socket(self.family,socket.SOCK_DGRAM)
                if self.local_port:
                    self.transport.bind(local_addr)
            self.fileno = self.transport.fileno()
            self.status = "READY"
            gevent.spawn(self._receiver)
            gevent.spawn(self._worker)
        
        except Exception as e:
            self.status = "CLOSE"
            raise e

    def close(self):
        self.status = "CLOSE"
        if self.transport:
            self.transport.close()
            self.transport = None

    def send(self, data, wait=True):
        return gevent.spawn(self.sendto, data, wait).get()
    
    def sendto(self, data, addr=None, wait=True):
        gevent.spawn(self.wait).get()
        if self.closing or self.transport is None:
            return False

        remote_addr = self.get_resolve_address(addr)
        raw = json.dumps(data).encode()
        pid, chunks = Packet.split(raw)
        result = True

        try:
            for i, chunk in enumerate(chunks):
                print(chunk)
                if wait:
                    gevent.spawn(self._set_echo,chunk,remote_addr)
                self.transport.sendto(json.dumps(chunk).encode(),remote_addr)
                gevent.sleep(INTERVAL_TIME)
                if wait:
                    retry = 0
                    while gevent.spawn(self._wait_echo,chunk,addr).get() and retry < RETRY_TIME:
                        if retry >= RETRY_TIME:
                            print(f"送信に失敗しました。:{addr}:{data}")
                            result = False
                        else:
                            self.transport.sendto(json.dumps(chunk).encode(),addr)
                        retry += 1
        except Exception as e:
            print(e)
            result = False
        return result


async def test():
    """
    py -m common.communication "server" "::1" "9999"
    py -m common.communication "client" "::1" "9999"
    """
    from common.logger import logger
    print("Ctrl + C: 終了")
    import sys
    args = sys.argv[1:]
    mode = args[0]
    host = args[1]
    port = int(args[2])
    print(mode,host,port)
    udp = None
    if mode == "server":
        udp = UDPServer(host=host,port=port)
    elif mode == "client":
        udp = UDPClient(host=host,port=port,local_port=port-1)
    
    @udp.receive
    async def logging(data,addr):
        l = f"[{mode}] from ({addr}) data:{data}"
        print(l)
        logger.debug(l)

    @udp.callback
    async def test(data,addr):
        # パケットとして合成されたものがこのコールバック関数に送られてくる
        pass

    @udp.save_handler
    def sv(item):
        logger.debug(item)

    udp.run()
    await asyncio.sleep(1)
    
    if mode == "client":
        # ファイルの転送
        task = udp.coroutine(udp.send_by_open_file("etc/data/unit_tree.json",f"etc/data/unit_tree.back.json",("::1",9999),True))

    if mode == "server":
        # 同時に通信を行う場合
        asyncio.gather(*[
            udp.sendto({"callback":"test","message":"This is TEST"},(host,port-1)),
            udp.sendto({"callback":"test","message":"This is TEST2"},(host,port-1))
        ])

        uuid = udp.enqueue({"callback":"test","message":"hello client"},(host,port-1))
    elif mode == "client":
        asyncio.gather(*[udp.sendto({"callback":"test","message":"This is TEST"},(host,port))])
        uuid = udp.enqueue({"callback":"test","message":"hello server"},(host,port))

    while True:
        await asyncio.sleep(1)
        print(f"uuid-{uuid}:",udp.taskmanager.is_done(uuid))
        if mode == "client":
            try:
                if task.done():
                    print(f"uuid-{task.result()}",udp.taskmanager.is_done(task.result()))
            except Exception as e:
                print(e)


if __name__ == "__main__":
    asyncio.run(test())