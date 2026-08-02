from functools import wraps
from logging import (
    getLogger, handlers,Formatter,StreamHandler,FileHandler,
    DEBUG,INFO,WARN,ERROR,CRITICAL
    # DEBUG:10,INFO:20,WARN:30,ERROR:40,CRITICAL:50
)
import inspect,traceback,os


dirpath = "./log/"
filename = "app.log"
log_level = DEBUG
log_size = 1024 * 1024
log_backup_count = 10

# デフォルトのログフォルダを作る
if not os.path.exists(dirpath):
    os.makedirs(dirpath)

# 生成ロガーのカウンター
logid = 0
def make_logger(filename,fmt='%(asctime)s : %(levelname)s - %(message)s'):
    if not os.path.exists(dirpath):
        os.makedirs(dirpath)
    global logid
    lg = getLogger(__name__ + str(logid))
    lg.setLevel(log_level)
    format = Formatter(fmt)
    file_handler = handlers.RotatingFileHandler(
        dirpath + filename,
        mode="a",
        maxBytes=log_size,
        backupCount=log_backup_count,
        encoding="utf-8"
    )
    file_handler.setFormatter(format)
    lg.addHandler(file_handler)
    logid += 1
    return lg


lgr = make_logger(filename, '%(asctime)s : %(levelname)s - %(message)s')

def log(func):
    """ 関数のIN/OUTログ出力デコレータ
    ```
    @log
    def hoge():
        # それぞれの処理
        print("hoge")
    ```
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        frame = inspect.currentframe().f_back
        frame_info = inspect.getframeinfo(frame)
        source_lines, start_line = inspect.getsourcelines(func)
        sep = "\n"
        try:
            lgr.info(" 開始 : [{}] - [{} lines][{}.py {}() {} lines start]".format(frame_info.filename, frame_info.lineno, func.__module__, func.__name__, start_line))
            lgr.info(" 引数 : {} {}".format(args, kwargs))
            result = func(*args, **kwargs)
            lgr.info(" 終了 : [{}] - [{} lines][{}.py {}() {} lines end]".format(frame_info.filename, frame_info.lineno, func.__module__, func.__name__, start_line + len(source_lines) - 1))
            return result
        except Exception as e:
            e_message = traceback.format_exc()
            # 必要な部分だけ抽出
            e_log = sep.join(e_message.split(sep)[-4:])
            lgr.error("例外 : [{}.py] - [def {}()]{}{}".format(func.__module__,func.__name__,sep,e_log))
            raise e
    return wrapper

def observer(separation="",mode=INFO):
    """ メソッド内のローカル変数をすべて出力するデコレータ
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            caller_frame = inspect.currentframe().f_back
            caller_locals = caller_frame.f_locals
            frame_info = inspect.getframeinfo(caller_frame)
            txt = "{}[{}] - [{}()][{} lines]".format(separation,frame_info.filename,frame_info.function,frame_info.lineno)
            for name, value in caller_locals.items():
                txt += "\n{}:{}".format(name,value)
            txt += "\n{}".format(separation)
            if mode == INFO:
                lgr.info(txt)
            elif mode == DEBUG:
                lgr.debug(txt)
            elif mode == ERROR:
                lgr.error(txt)
            return result
        return wrapper
    return decorator

def writer(separation=""):
    """ オブジェクトメソッドの第二引数(message)に関数の情報を取得した結果文字列を追記するデコレータ
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            
            caller_frame = inspect.currentframe().f_back
            frame_info = inspect.getframeinfo(caller_frame)
            txt = "[{}] - [{}()][{} lines]{}".format(frame_info.filename,frame_info.function,frame_info.lineno,separation)

            if len(args)>1:
                lst = list(args)
                lst[1] = txt + str(lst[1])
                args = tuple(lst)

            if "message" in kwargs:
                kwargs["message"] = txt + str(kwargs["message"])

            result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator


class OutputLog:
    """ loggerをラッピングしたログ出力クラス
    """

    def __init__(self,lgr):
        """ loggerをラッピングしたログ出力オブジェクト
        #### モジュールや関数名、実行時の行数の出力を自動で行う
        ```
        from common.logger import logger
        logger.debug("TEST DEBUG")
        logger.info("TEST LOG")
        logger.error("TEST ERROR")
        localvalues = ["This","is","sample","array"]
        logger.debug_all("XX lines local values!")
        logger.info("XX lines local values!")
        logger.error("XX lines local values!")
        ```
        Args:
            lgr ロガーオブジェクト
        """
        self.lgr = lgr

    @writer(" - ")
    def debug(self,message=""):
        """ DEBUGログ出力する
        """
        self.lgr.debug("出力 : {}".format(message))

    @writer(" - ")
    def info(self,message=""):
        """ INFOログ出力する
        """
        self.lgr.info(" 出力 : {}".format(message))

    @writer(" - ")
    def error(self,message=""):
        """ ERRORログ出力する
        """
        self.lgr.error("出力 : {}".format(message))

    @observer("",DEBUG)
    def debug_all(self,comment=""):
        """ 呼び出し元のローカル変数をdebugログにすべて書き出す関数
        """
        self.lgr.debug("検証 : {}".format(comment))
        
    @observer("",INFO)
    def info_all(self,comment=""):
        """ 呼び出し元のローカル変数をinfoログにすべて書き出す関数
        """
        self.lgr.info(" 情報 : {}".format(comment))

    @observer("",ERROR)
    def error_all(self,comment=""):
        """ 呼び出し元のローカル変数をerrorログにすべて書き出す関数
        """
        self.lgr.error("例外 : {}".format(comment))

logger = OutputLog(lgr)
""" loggerをラッピングしたログ出力オブジェクト
### モジュールや関数名、実行時の行数の出力を自動で行う
```
    from common.logger import logger
    logger.debug("TEST DEBUG")
    logger.info("TEST LOG")
    logger.error("TEST ERROR")
    localvalues = ["This","is","sample","array"]
    logger.debug_all("local values!")
    logger.info_all("local values!")
    logger.error_all("local values!")
```
"""


if __name__ == "__main__":
    

    def test0():
        """ ロガー生成テスト"""
        newlogger = make_logger("test.log")
        newlogger.debug("This is new logger logging test.")

    @log
    def test1():
        """ IN/OUTログ出力テスト"""
        print("IN/OUT")
        logger.debug("IN/OUT")

    def test2():
        """ 標準ログ出力テスト"""
        logger.debug("This is debug log test.")
        logger.info("This is debug log test.")
        logger.error("This is debug log test.")

    def test3():
        """ 全変数ログ出力テスト"""
        val1 = "test"
        val2 = 2
        logger.debug_all("▼ DEBUG 変数取得のテストログ")
        logger.info_all("▼ INFO 変数取得のテストログ")
        logger.error_all("▼ ERROR 変数取得のテストログ")

    def test4():
        """ OutputLog シングルトンパターンテスト """
        try:
            dummy = OutputLog(logger)
            return dummy
        except Exception as e:
            print(e)

    test_list=[
        test0,
        test1,
        test2,
        test3,
        test4,
    ]

    for t in test_list:
        print(t.__name__,t.__doc__)
        t()
    
    