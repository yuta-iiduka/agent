""" 外部API呼び出し機能提供モジュール
"""
# 標準ライブラリのインポート
import json, urllib, urllib.parse, urllib.request, urllib.error, enum, base64, time, secrets, os, ssl
# 自製ライブラリのインポート
from common.utils import *
# 外部ライブラリのインポート
is_enable_introspect = False
try:
    import Cryptodome
    from Cryptodome.PublicKey import RSA
    from Cryptodome.Signature import pkcs1_15
    from Cryptodome.Hash import SHA256
    is_enable_introspect = True
except Exception as e:
    is_enable_introspect = False

# 定数
GET    = "GET"
POST   = "POST"
PUT    = "PUT"
PATCH  = "PATCH"
DELETE = "DELETE"

# メッセージ列挙
class RequestMessage(enum.Enum):
    NO_RESPONSE  = "レスポンスデータがありません。"
    FAILD        = "リクエストに失敗しました。"
    SUCCESS      = "リクエストに成功しました。"
    TOKEN_ERROR  = "トークンは文字列を指定してください。"
    MODULE_ERROR = "暗号ライブラリがインストールされていません。"

# モジュールのインポートチェック
def raise_module_error(param, *args, **kwargs):
    if is_enable_introspect:
        return
    else:
        raise Exception(RequestMessage.MODULE_ERROR.name,RequestMessage.MODULE_ERROR.value)

@Parasite.debuglog
@Parasite.spinweb
class APICaller:

    def __init__(self,fqdn="http://localhost:9999"):
        self._fqdn = fqdn
        self._token = None
        self.is_form = False
        self.result = {
            "body":"",
            "head":{},
            "code":-1,
        }

    @property
    def fqdn(self):
        return self._fqdn
    
    @fqdn.setter
    def fqdn(self,fqdn):
        self._fqdn = fqdn

    @property
    def token(self):
        return self._token
    
    @token.setter
    def token(self, token):
        if isinstance(token,str):
            self._token = token
        else:
            raise Exception(RequestMessage.TOKEN_ERROR)
        
    @property
    def body(self):
        return self.result["body"]
    
    @body.setter
    def body(self, b):
        self.result["body"] = b

    @property
    def head(self):
        return self.result["head"]
    
    @head.setter
    def head(self, h):
        self.result["head"] = h

    @property
    def status(self):
        return self.result["code"]
    
    @status.setter
    def status(self, code):
        self.result["code"] = code

    def call(self, uri="/login", method=POST, payload=None, headers={}):
        # 各変数の初期化
        result = None
        data = None                                    # APIレスポンス結果
        if payload:
            if self.is_form:
                data = urllib.parse.urlencode(payload).encode("utf-8")
            else:
                data = json.dumps(payload).encode("utf-8")   # 送信する辞書データをJSON文字列へ変換
        url = f"{self.fqdn}{uri}"                       # FQDN + ルーティングの文字列を生成
        # リクエストオブジェクト生成
        if data:
            req = urllib.request.Request(url, data=data, method=method)
        else:
            req = urllib.request.Request(url, method=method)
        # ヘッダーの準備
        req.add_header("Accept", "application/json")
        if method in (POST,PUT,PATCH) and data is not None:
            req.add_header("Content-Type", "application/json")
        if headers:
            for k, v in headers.items():
                req.add_header(k,v)

        # SSL検証までは必要としないので無効化
        option = {"timeout":5}
        if "https" in self.fqdn: 
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            option = {"context":context}
        
        try:
            with urllib.request.urlopen(req,**option) as res:
                self.status = res.getcode()
                if res.status != 200:
                    raise urllib.error.HTTPError(
                        url, res.tatus, res.reason, res.headers, None
                    )
                body = res.read().decode(res.headers.get_content_charset() or "utf-8")
                try:
                    result = json.loads(body)
                except Exception as e:
                    print(e)
                    result = body
                self.body = result
                self.head = res.getheaders()
        except Exception as e:
            print(e)
        return result

    def bearer(self, uri="/login", method=POST, payload=None, headers={}):
        """ トークンによるBearer認証用のメソッド
        """
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return self.call(uri, method, payload, headers)

    def basic(self, uri="/login", method=POST, payload=None, headers={}):
        """ トークンによるBasic認証用のメソッド
        """
        if self.token:
            headers["Authorization"] = f"Basic {self.token}"
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        return self.call(uri, method, payload, headers)

class APIEvent:
    """
    ### Outlines
        APIの呼び出しを管理するクラス
    ### Examples
    ```
        caller = APICaller("http://localhost:9999")
        apim   = APIEvent(caller)
        @apim.event
        def get_user_info(data):
            apim.caller.token = data["token"]
            if apim.no_error:
                data = apim.bearer("api/v1/xxx","POST",{"user_id":"xx-xx"})

        result = apim.call("login","POST",{"username":"sample","password":"xxxxx"})

    ```
    """

    def __init__(self,caller:APICaller=None):
        self.caller = caller
        self._event      = None
        self._token_event = None
        self.errors = []

    @property
    def fqdn(self):
        return self.caller.fqdn

    @fqdn.setter
    def fqdn(self, fqdn):
        self.caller.fqdn = fqdn

    def event(self, func):
        # setattr(self,func.__name__,func)
        self._event = func
        return func
    
    def token_event(self, func):
        # setattr(self,func.__name__,func)
        self._main_event = func
        return func

    def certification(self,uri="/login", method=POST, payload=None, headers={}):
        self.errors = []
        result = None
        data = self.caller.call(uri, method, payload, headers)
        if data:
            if callable(self._token_event):
                result = self._token_event(data)
        else:
            self.errors.append(RequestMessage.NO_RESPONSE)
        return result

    def call(self, uri="/login", method=POST, payload=None, headers={}):
        self.errors = []
        data = self.caller.call(uri, method, payload, headers)
        result = None
        if data:
            if callable(self._event):
                result = self._event(data)
        else:
            self.errors.append(RequestMessage.NO_RESPONSE)
        return result or data

    def bearer(self, uri="/login", method=POST, payload=None, headers={}):
        self.errors = []
        result = None
        data = self.caller.bearer(uri, method, payload, headers)
        if data:
            if callable(self._event):
                result = self._event(data)
        else:
            self.errors.append(RequestMessage.NO_RESPONSE)
        return result or data
        
    def basic(self, uri="/login", method=POST, payload=None, headers={}):
        self.errors = []
        result = None
        data = self.caller.basic(uri, method, payload, headers)
        if data:
            if callable(self._event):
                result = self._event(data)
        else:
            self.errors.append(RequestMessage.NO_RESPONSE)
        return result or data
    
    def token_triming(self,header_value=None, mode="bearer "):
        if header_value:
            return header_value.split()[1] if header_value.lower().startswith(mode.lower()) else None
        else:
            None
    
    def baerer_token(self,header):
        """
        ### Outlines
            ヘッダーからbaererトークンを取得するメソッド
        ### Args
            header: request.headers ヘッダー情報を保持する辞書型もしくはオブジェクト
        ### Returns
            token: String "Bearer ＊＊＊＊"で登録されているトークン部分の文字列
        """
        return self.token_triming(header.get("Authorization",None), "bearer ")

    def basic_token(self, header):
        """
        ### Outlines:
            ヘッダーからbasicトークンを取得するメソッド
        ### Args
            header: request.headersヘッダー情報を保持する辞書型もしくはオブジェクト
        ### Returns
            token: String "Basic XXX"で登録されているトークン部分の文字列
        """
        return self.token_triming(header.get("Authorization",None), "basic ")

    @property
    def messages(self):
        return [msg.value for msg in self.errors]
    
    @property
    def is_error(self):
        return len(self.errors) > 0

    @property
    def no_error(self):
        return len(self.errors) == 0

if __name__ == "__main__":
    pass

    # caller = APICaller("http://localhost:50314")
    # res = caller.call("/api/version",method=GET,headers={'Content-Type': 'application/json'})
    # print(res)
    # print(caller.status)
    # print(caller.head)
    # print(caller.body)
