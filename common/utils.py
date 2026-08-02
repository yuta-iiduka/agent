# 標準ライブラリのインポート
import sys, os, json, multiprocessing, datetime, subprocess, threading, types, functools, inspect, urllib, uuid
# 外部ライブラリ

# 自製ライブラリ

def resource_path(relative_path):
    """PyInstallerと通常実行の両方に対応"""
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller実行時
        base_path = sys._MEIPASS
    else:
        # 通常のPython実行時
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

def pick(folder_path,file_name):
    return os.path.join(resource_path(folder_path),file_name)



""" 汎用系便利モジュール
    Parasite: 寄生クラス
    ddd: 辞書データ拡張クラス
"""
# 標準ライブラリのインポート
import sys, os, platform, json, time, datetime, multiprocessing, subprocess, threading, types, functools, inspect, urllib, uuid
# 外部ライブラリ
# import
# 自製ライブラリ
# import

class ddd(dict):
    """ Dot Dictonary Data
    ### Outline
        辞書キーを属性アクセスで取得できるようにするクラス
    ### Example
    ```
        # ddd() => {} 扱いとなる
        d = ddd({"name": "Bob", "age": 25}) 
        print(d.name)     # Bob

        d.city = "Tokyo"
        print(d.city)     # Tokyo
        print(d["city"])  # Tokyo
    ```
    """

    def __init__(self, *args, **kwargs):
        """コンストラクタ：辞書の初期化とネスト変換を行う"""
        super().__init__(*args, **kwargs)
        # すべての項目を走査し、必要なら再帰的に変換
        for key, value in list(self.items()):
            self[key] = self._convert(value)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            # 属性が存在しない場合は通常の AttributeError を投げる
            raise AttributeError(f"'DotDict' object has no attribute '{key}'")

    def __setattr__(self, key, value):
        self[key] = value

    # dict のメソッドを上書きしたい場合はここで行う
    def __delattr__(self, key):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"'DotDictData' object has no attribute '{key}'")
        
    def __repr__(self):
        """
        デバッグ時に見やすい表示を返す。
        """
        return f"DotDictData({super().__repr__()})"

    def to_dict(self):
        """
        変更を加えた DotDictData を再帰的に通常の dict に戻す。
        """
        result = {}
        for k, v in self.items():
            if isinstance(v, ddd):
                result[k] = v.to_dict()
            elif isinstance(v, list):
                result[k] = [x.to_dict() if isinstance(x, ddd) else x for x in v]
            else:
                result[k] = v
        return result
    
    def _convert(self, value):
        """値が dict または list なら再帰的に変換し、そうでなければそのまま返す"""
        if isinstance(value, dict):
            return ddd(value)
        elif isinstance(value, list):
            # リスト内の各要素も再帰変換
            return [self._convert(v) for v in value]
        else:
            return value

class PlatformInfo:
    def __init__(self):
        self.system = platform.system()        

    @property
    def is_windows(self):
        return "Windows" in self.system
    

    @property
    def is_android(self):
        return "ANDROID_STORAGE" in os.environ
    
    @property
    def is_linux(self):
        return not (self.is_windows or self.is_android)

    @property
    def get_uuid(self):
        """
        Windowsの場合は取得失敗のケースがあるので、何度かループ実行する必要がある。
        """
        ret_uu_id_str = ""
        if self.is_windows:
            uu_id = subprocess.run("powershell -Command (Get-WmiObject -Class Win32_ComputerSystemProduct).UUID", stdout=subprocess.PIPE).stdout.decode("utf-8")
            # 取得したUUIDの文字列には、末尾に改行文字("\r\n")を含むため除去
            ret_uu_id_str = uu_id.replace("\r\n", "")
        elif self.is_android:
            pass
        else:

            # LinuxのUUIDファイルの内容を読み込む
            with open("/etc/machine-id", "r", encoding="utf-8") as f:
                uu_id = f.read()
            # 取得したUUIDの文字列には、末尾に改行文字("\n")を含むため除去し、
            # 取得したUUIDはa～fが小文字のため、大文字に変換する。
            # (収集したUUIDは訓練情報データベースに格納されるため、
            # 「Windows収集時の大文字」と「Linux収集時の小文字」が混在しないよう、大文字に統一する。)
            uu_id_without_lf = uu_id.replace("\n", "").upper()

            # 取得したUUIDは半角ハイフン無しの32文字のため、戻り値の形式となるよう、半角ハイフンを追加する。
            ret_uu_id_str = uu_id_without_lf[0:8]   + "-" + \
                            uu_id_without_lf[8:12]  + "-" + \
                            uu_id_without_lf[12:16] + "-" + \
                            uu_id_without_lf[16:20] + "-" + \
                            uu_id_without_lf[20:32]
        return ret_uu_id_str


class Parasite:
    """ 寄生クラス
    ### Outlines
        特定のクラスに対して、Parasiteインスタンスを注入する。
        寄生したクラスのメソッドに対して、処理の介入などを実現する。
        Parasiteクラスのインスタンスを便宜的にwormオブジェクトとよび、ParasiteクラスそのものはそのままParasiteクラスと呼ぶ。
        @staticmethodで修飾したメソッドは寄生に耐性をもつため、個別に@Parasiteによる寄生をしなければならない。回避する場合は@classmethodで再定義する。
    ### Examples
    ```
        @Parasite.spinweb # @Parasite.wrap(Parasite.catch,Parasite.pprint)と同じ効果
        class A:
            def __init__(self):
                pass
            
            def aaa(self):
                pass
                
            @classmethod
            def bbb(cls):
                pass
                
            @staticmethod
            @Parasite.catch(Parasite.pprint)
            def ccc(cls):
                pass
    ```
    ### Requires
        dddクラス
    """
    def __init__(self):
        self.errors = []
        self.body = ddd()

    def has(self, key):
        return hasattr(self.body,key)
    
    def rmv(self, key):
        del self.body[key]

    def add(self, key, val):
        self.body[key] = val
    
    @classmethod
    def hatch(me, instance_or_class):
        """ wormオブジェクトのゲッター兼セッター
        ### Outlines
            寄生したwormオブジェクトを取得するか、産み付けてwormオブジェクトとして取得する
        ### Args
            instance: 寄生されたオブジェクト
        ### Returns
            wormオブジェクト
        """
        worm = None
        _WORM = "worm"
        if hasattr(instance_or_class,_WORM):
            worm = getattr(instance_or_class,_WORM)
        else:
            worm = me()
            setattr(instance_or_class, _WORM, worm)
        return worm

    @classmethod
    def egg(me, cls, decorator=None, *dec_args, **dec_kwargs):
        """ クラスへwormオブジェクトを寄生させるクラスメソッド
        ### Outlines:
            クラスに対してそのクラスのインスタンス生成時にwormとして自インスタンスを注入する（寄生させる）
            寄生されたクラス（宿主）は、インスタンス生成時にすべてのメソッドに対し、wormが指示したデコレータを付与する
            全てに適用されるため、メソッド内で同じオブジェクトを参照した場合は意図とは異なり、複数回実行されるリスクがある。
            
        ### Args
            decorator:  寄生デコレータ
            dec_args:   寄生デコレータの名前なし引数
            dec_kwargs: 寄生デコレータの名前あり引数
            
        ### Returns:
            寄生されたクラス
        """

        if decorator:
            decorator_name = decorator.__name__
            if not hasattr(me, decorator_name):
                raise Exception("存在しないデコレータです。")
        
        # org_init = inspect.unwrap(cls.__init__)
        org_init = cls.__init__            
        @functools.wraps(org_init)
        def wrap_init(instance, *args,**kwargs):
            org_init(instance, *args,**kwargs)
            # ラッピング対象のオブジェクトに自身のインスタンスを寄生させる
            worm = Parasite.hatch(instance)

        for name, attr in cls.__dict__.items():      # クラス属性全探索
            if name.startswith('__'):                # dunder（特殊メソッド）は除外
                continue
            # 何らかの関数かどうか
            # if callable(attr):
            if isinstance(attr, staticmethod):          # staticmethod なら __func__ を取り出す
                # original = inspect.unwrap(attr.__func__)
                original = attr.__func__
                # wrapped = staticmethod(decorator(*dec_args, **dec_kwargs)(original))
                # setattr(cls, name, wrapped)             # 置き換える
                print(f"staticメソッド「{name}」への寄生はできません。classメソッドとして再定義するか、直接指定して寄生させてください。")
            elif isinstance(attr, classmethod):         # classmethod も同様
                # original = inspect.unwrap(attr.__func__)
                original = attr.__func__
                # original = attr
                wrapped  = classmethod(decorator(*dec_args, **dec_kwargs)(original))
                setattr(cls, name, wrapped)             # 置き換える
            elif isinstance(attr, types.FunctionType):  # インスタンスメソッド
                # original = inspect.unwrap(attr)
                original = attr
                wrapped = decorator(*dec_args, **dec_kwargs)(original)
                setattr(cls, name, wrapped)             # 置き換える
                
        cls.__init__ = wrap_init
        return cls
    
    @classmethod
    def wrap(me, dec, *args, **kwargs):
        @functools.wraps(dec)
        def deco(cls):
            return Parasite.egg(cls, dec, *args, **kwargs)
        return deco
    
    @classmethod
    def ley_egg(me,cls):
        """ wormオブジェクトを埋め込み、寄生先のメソッドでwormを扱いたいときに使う
        """
        return me.wrap(me.dummy)(cls)
    
    @classmethod
    def spinweb(me,cls):
        """ 蜘蛛の巣のように処理を包み込むクラス寄生デコレータ
        ### Outlines
            try-exceptブロックで処理を包む。
        ### Args
            cls: Class
        """
        return me.wrap(me.catch, me.pprint)(cls)
    
    @classmethod
    def debuglog(me,cls):
        """ デバッグログ強制出力クラス寄生デコレータ
        """
        return me.wrap(me.bait)(cls)

    @classmethod
    def bait(cls):
        """ 強制名乗り上げメソッド
        """
        def decorator(func,logger=None):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                print(f"開始：{func.__name__}")
                if logger:
                    logger.debug(f"開始：{func.__name__}")
                result = func(instance, *args, **kwargs)
                print(f"終了：{func.__name__}")
                if logger:
                    logger.debug(f"終了：{func.__name__}")
                return result
            return wrapper
        return decorator

    @classmethod
    def catch(cls, finalize=None):
        """
        ### Outlines
            try-exceptブロックを追加するデコレータ
        
        ### Args
            finalize: Function(obj: Parasiteオブジェクト, errors: エラーメッセージ配列)

        ### Returns
            dec: 寄生デコレータ
        """

        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                worm = cls.hatch(instance)
                worm.errors = []
                result = None
                try:
                    result = func(instance, *args, **kwargs)
                    return result
                except urllib.error.HTTPError as e:
                    worm.errors.append(f"HTTPError: {e.code} {e.reason}")
                except urllib.error.URLError as e:
                    worm.errors.append(f"URLError: {e.reason}")
                except json.JSONDecodeError as e:
                    worm.errors.append(f"JSONDecodeError: {e.msg}")
                except Exception as e:
                    worm.errors.append(f"UnexpectedError: {e}")
                finally:
                    if finalize and callable(finalize):
                        finalize(worm, worm.errors)
                    else:
                        worm.pprint(worm.errors)
            return wrapper
        return dec
    
    def dummy(self):
        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                    return func(instance, *args, **kwargs)
            return wrapper
        return dec
    
    @classmethod
    def before(cls, method=None, *method_args, **method_kwargs):
        """
        ### Outlines
            メソッドの事前処理介入する寄生デコレータ生成関数
        
        ### Args
            method: Function(param: Param, *method_args, **method_kwargs)
            method_args: methodの名前なし引数の配列
            method_kwargs: methodの名前付き引数の辞書型配列
        
        ### Returns
            dec: 寄生デコレータ
        """
        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                result = None
                if method:
                    params = ddd()
                    params.args = args
                    params.kwargs = kwargs
                    method(params, *method_args, **method_kwargs)
                else:
                    print("method is not called.")
                result = func(instance, *args, **kwargs)
                return result
            return wrapper
        return dec
    
    @classmethod
    def after(cls, method=None, *method_args, **method_kwargs):
        """
        ### Outlines
            メソッドの事後処理介入する寄生デコレータ

        ### Args
            method: Function(result, *method_args, **method_kwargs)
            method_args: methodの名前なし引数の配列
            method_kwargs: methodの名前付き引数の辞書型配列

        ### Returns
            dec: 寄生デコレータ
        """
        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                result = None
                result = func(instance, *args, **kwargs)
                if method:
                    method(result, *method_args, **method_kwargs)
                else:
                    print("method is not called.")
                return result
            return wrapper
        return dec
    
    @classmethod
    def snatch(cls, method=None, *method_args, **method_kwargs):
        """ 処理の横取りメソッド
        ### Outlines
            メソッドの処理の横取りをする寄生デコレータ生成関数。横取りした結果の戻り値がある場合、宿主の処理は実行せず、横取りした結果を返す。

        ### Args
            method: Function(param: Param, *method_args, **method_kwargs)
            method_args: methodの名前なし引数の配列
            method_kwargs: methodの名前付き引数の辞書型配列
        
        ### Returns
            dec: 寄生デコレータ
        """
        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                result = None
                if method:
                    params = ddd()
                    params.args = args
                    params.kwargs = kwargs
                    result = method(params, *method_args, **method_kwargs)
                    if result:
                        pass
                    else:
                        result = func(instance, *args, **kwargs)
                else:
                    print("method is not called.")
                return result
            return wrapper
        return dec

    @classmethod
    def mimicry(cls, method=None, *method_args, **method_kwargs):
        """ 処理の擬態メソッド
        ### Outlines
            メソッドの処理結果に擬態する寄生デコレータ。宿主の戻り値を監視し、戻り値の偽装をする。

        ### Args
            method: Function(result, *method_args, **method_kwargs)
            method_args: methodの名前なし引数の配列
            method_kwargs: methodの名前付き引数の辞書型配列

        ### Returns
            dec: 寄生デコレータ
        """
        def dec(func):
            @functools.wraps(func)
            def wrapper(instance, *args, **kwargs):
                result = None
                result = func(instance, *args, **kwargs)
                if method:
                    result =  method(result, *method_args, **method_kwargs)
                else:
                    print("method is not called.")
                return result
            return wrapper
        return dec
    
    def pprint(self, args):
        for arg in args:
            if hasattr(arg,"value"):
                print(arg.value)
            else:
                print(arg)


class ThreadGroup:
    """ スレッドグループ
    ### Outlines
        スレッドグループを生成し、登録・監視しているスレッドの管理を行う。
    """

    def __init__(self,name="thread-group"):
        self.id = uuid.uuid4()
        self.name = name
        self.data = ddd()

    def append():
        pass

    def remove():
        pass

    def start():
        pass

    def stop():
        pass

    def wait():
        pass


class Workers:

    def __init__(self):
        self.targets = []

    @property
    def info(self):
        info = {}
        for p in self.targets:
            info[p.name] = p

    def start(self,func,args,name,coreids={0,1}):
        """ プロセス開始メソッド
        worker.start(asyncio.run, args=(tcp_server()), name="TCP", {0,1}) # 0番,1番コアを割り当てたTCPサーバ
        """
        proc = multiprocessing.Process(target=func, args=args, name=name)
        proc.start()
        self.targets.append(proc)

        try:
            os.sched_setaffinity(proc.pid, coreids)
        except Exception as e:
            print(e)
            print(sys.stderr)

        return proc.pid

    def stop(self,pid=-1):
        """ プロセス終了メソッド
        PIDを省略した場合は、管理対象をすべて終了
        """
        # 終了シグナルを送信
        for p in self.targets:
            if pid < 0 or p.pid == pid:
                p.terminate()

        # 終了するまで待機
        for p in self.targets:
            p.join()

class Task:
    """ OSにコマンドのタスクを登録するクラス
        管理者権限でタスク登録する場合は、管理者ユーザでこのPythonプロセスを起動しておく必要がある。
        TODO:別クラスによるユーザ取得、コマンドライン生成
        ```
        task = Task("cmd")
        task.append()
        task.run()
        task.wait()
        task.remove()
        ```
    """

    AUTH_USERNAME = ddd({"Windows":"SYSTEM","Linux":"root"})
    TIMEOUT_MINUTES = 1
    
    def __init__(self,cmdline=[],user="SYSTEM",exec_time=None):
        """ タスクオブジェクト
        ### Outlines
            タスク初期化
        ### Args
            cmdline (list)  : コマンドラインの配列
            user (str)      : ユーザ名
            exec_time (str) : 実行時刻文字列(省略した場合は現在時刻の２分前)
        """
        self.id = uuid.uuid4().hex
        self.messages = []
        self.user = user
        self.cmdline = cmdline
        self.datetime   = datetime.datetime.now().replace(second=0,microsecond=0)
        self.exec_time  = exec_time if exec_time else time.localtime(time.time() - (Task.TIMEOUT_MINUTES * 60))
        self.dummy_time = "{:02d}:{:02d}".format(self.exec_time.tm_hour, self.exec_time.tm_min)

    def subprocess(self, cmd, message):
        proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if proc.returncode != 0:
            self.messages.append(f"{message}: {proc.stderr.strip()}")
            return False, proc
        return True, proc

    @property
    def is_error(self):
        return len(self.messages) > 0
    
    @property
    def task_name(self):
        """ スケジューラに登録しているタスク名
        ### Outlines
            自インスタンス生成時にUUIDで採番したIDと接頭語「task_」を付与した名前を返却する。

        ### Returns:
            task_name (str): タスク名
        """
        return f"task_{self.id}"
    
    @property
    def cmd_name(self):
        """ コマンド名
        ### Outlines
            コマンド名をコマンドラインから抽出するメソッド
            exe拡張子が含まれていればそれを返却。含まれていなければコマンドの第一引数を返却。

        ### Returns
            cmd_name (str): コマンド名
        """
        n = ""
        for cmd in self.cmdline:
            if ".exe" in cmd:
                n = cmd
                break
        if n == "" and len(self.cmdline) > 0:
            n = self.cmdline[0]
        return n
    
    @property
    def status(self):
        pass

    def append(self):
        pass

    def remove(self):
        pass

    def run(self):
        pass

    def wait(self):
        pass


class TaskWindows(Task):
    """
    schtasks のコマンド文字列を作成
        /SC ONCE   : 一度だけ実行
        /TR <cmd>  : 実行コマンド
        /TS <time> : 実行時刻
        /RU <user> : 実行ユーザー
        /RL HIGHEST: 実行レベル（最高権限）
    """

    def __init__(self,cmdline=[],user="SYSTEM",exec_time=None):
        super().__init__(cmdline,user,exec_time)

    @property
    def status(self):
        """ タスクのステータス
        ### Returns 
        status (int)
        -1 : コマンド実行できない場合
        0  : 未実施・見つからない
        1  : 終了

        ### MEMO
        ```
        [CMD]
        schtasks /Query /TN 'taskname' /FO LIST /V
        [PowerShell]
        Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-TaskScheduler/Operational'; Id=202}
        ```
        """

        cmd = f'schtasks /Query /TN "{self.task_name}" /FO LIST /V'

        print(cmd)
        result, proc = self.subprocess(cmd, "faild task query")
        if not result:
            return -1
        
        last_run = None
        for line in proc.stdout.splitlines():
            if "前回の実行時刻" in line or "Last Run Time" in line: #JP,UA版 Windowsのみ対応
                last_run = line.split(":", 1)[1].strip()
                break
        print("last_run",last_run)
        if last_run:
            if last_run == "N/A":
                return 0
            else:
                formats = [
                    "%Y/%m/%d %H:%M:%S",
                    "%Y-%m-%d %H:%M:%S",
                    "%m/%d/%Y %H:%M:%S",
                ]
                last_run_datetime = None
                for fmt in formats:
                    try:
                        last_run_datetime = datetime.datetime.strptime(last_run,fmt)
                    except Exception:
                        continue
                print(last_run_datetime,self.datetime)
                if last_run_datetime >= self.datetime:
                    return 1
                else:
                    return 0

        return 0

    def append(self):
        if self.cmdline == "":
            raise Exception(f"faild task append: no command lines")
        # デフォルトの登録コマンド
        cmd = "".join((
            f'schtasks /create ',
            f'/f ',
            f'/TN "{self.task_name}" ',
            f'/TR {self.cmdline} ',
            f'/SC ONCE /ST {self.dummy_time} ',
        ))

        # 管理者の場合
        if self.user == Task.AUTH_USERNAME.Windows: #SYSTEM
            cmd += f'/RU "{self.user}" /RL HIGHEST '
        
        # ローカルユーザの場合
        else:
            cmd += f'/RU {self.user} '
            # パスワードがある場合
            # if self.password:
            #    cmd += f'/RP "{self.password}"'
        
        print(cmd)
        result, proc = self.subprocess(cmd, "faild task append")
        return result

    def remove(self):
        cmd = "".join((
            f'schtasks /delete ',
            f'/f ',
            f'/TN {self.task_name} ',
        ))
        print(cmd)
        result, proc = self.subprocess(cmd, "faild task remove")
        return result

    def run(self):
        cmd = "".join((
            f'schtasks /run ',
            f'/TN {self.task_name} ',
        ))
        print(cmd)
        result = self.subprocess(cmd, "faild task run")
        return result

    def wait(self):
        start = time.time()
        time.sleep(1)
        while self.status < 1:
            if time.time() - start  > (Task.TIMEOUT_MINUTES * 60):
                return False
            time.sleep(1)
        return True

class TaskLinux(Task):
    """
        TODO: Linuxにおけるスケジューラ機能(Cron,自製のスケジューラ)で実装
    """
    def __init__(self,cmdline=[],user="root",exec_time=None):
        super().__init__(cmdline,user,exec_time)

    @property
    def status(self):
        pass

    def append(self):
        pass

    def remove(self):
        pass

    def run(self):
        pass

    def wait(self):
        pass


if __name__ == "__main__":

    task = TaskWindows([])
    print(task.task_name)
    print(task.cmd_name)
    print(task.append())
    # print(task.run())
    # print(task.wait())
    # print(task.remove())
    # print("is_error",task.is_error)
