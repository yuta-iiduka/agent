import re, inspect, datetime, ast
from functools import wraps


class Validation():
    """ バリデーションの処理が定義されたクラス。各バリデーション処理はクラスメソッドで定義されている。
    
    Exp:
    >>> Validation.check_int(1)
    False
    """

    UNEXPECTED_ERROR = "予期しないエラーです。"
    DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
    DATETIME_FORMAT2 = "%Y/%m/%d %H:%M:%S"
    REGEX_ALPHABET = "[A-Za-z0-9]+"

    @classmethod
    def check_type(cls,v,typ):
        """入力値が不適です。
        >>> Validation.check_type("(1,2)",str)
        False
        >>> Validation.check_type((1,2),str)
        True
        """
        result = True
        if isinstance(v,typ):
            result = False
        return result
    
    @classmethod
    def check_list(cls,v):
        """入力値は配列です。
        >>> Validation.check_list([1,2])
        False
        >>> Validation.check_list("[1,2]")
        True
        >>> Validation.check_list((1,2))
        True
        """
        return cls.check_type(v,list)
    
    @classmethod
    def check_tuple(cls,v):
        """入力値はタプルです。
        >>> Validation.check_tuple((1,2))
        False
        >>> Validation.check_tuple("(1,2)")
        True
        >>> Validation.check_tuple([1,2])
        True
        """
        return cls.check_type(v,tuple)

    @classmethod
    def check_float(cls,v):
        """入力値は小数です。
        >>> Validation.check_float(1.2)
        False
        >>> Validation.check_float("1.2")
        True
        >>> Validation.check_float(1)
        True
        """
        return cls.check_type(v,float)

    @classmethod
    def check_int(cls,v):
        """入力値は整数値です。
        >>> Validation.check_int(1)
        False
        >>> Validation.check_int("1")
        True
        """
        return cls.check_type(v,int)
    
    @classmethod
    def check_str(cls,v):
        """入力値は文字列です。
        >>> Validation.check_str("1")
        False
        >>> Validation.check_str(1)
        True
        """
        return cls.check_type(v,str)
    
    @classmethod
    def check_convert(cls,v,typ):
        """入力値が不適です。
        >>> Validation.check_convert("1.2",float)
        False
        >>> Validation.check_convert(1.2,float)
        False
        >>> Validation.check_convert("1.2.3",float)
        True
        """
        result = True
        try:
            if isinstance(v,typ):
                result = False
            elif typ in [list,tuple,dict,set] and isinstance(v,str):
                result = not(isinstance(ast.literal_eval(v),typ))
            else:
                typ(v)
                result = False
        except Exception as e:
            result = True
        return result
    
    @classmethod
    def check_convert_int(cls,v):
        """入力値は整数値です。
        >>> Validation.check_convert_int("1")
        False
        >>> Validation.check_convert_int(1)
        False
        >>> Validation.check_convert_int("1.2")
        True
        """
        result = cls.check_int(v)
        if result:
            result =  cls.check_convert(v,int)
        return result
    
    @classmethod
    def check_convert_float(cls,v):
        """入力値は小数です。
        >>> Validation.check_convert_float("1.2")
        False
        >>> Validation.check_convert_float(1.2)
        False
        >>> Validation.check_convert_float("1.2.3")
        True
        """
        result = cls.check_float(v)
        if result:
            result =  cls.check_convert(v,float)
        return result
    
    @classmethod
    def check_convert_list(cls,v):
        """入力値は配列です。
        >>> Validation.check_convert_list("[1,2]")
        False
        >>> Validation.check_convert_list([1,2])
        False
        >>> Validation.check_convert_list("1")
        True
        """
        result = cls.check_list(v)
        if result:
            result =  cls.check_convert(v,list)
        return result

    @classmethod
    def check_convert_tuple(cls,v):
        """入力値はタプルです。
        >>> Validation.check_convert_tuple("(1,2)")
        False
        >>> Validation.check_convert_tuple((1,2))
        False
        >>> Validation.check_convert_tuple("1")
        True
        """
        result = cls.check_tuple(v)
        if result:
            result =  cls.check_convert(v,tuple)
        return result

    @classmethod
    def check_min_value(cls,min,val):
        """最小値は{}です。
        >>> Validation.check_min_value(10,10)
        False
        >>> Validation.check_min_value(10, 9)
        True
        """
        result = True
        val = int(val) if isinstance(val,str) else val
        min = int(min) if isinstance(min,str) else min
        if val >= min :
            result = False
        return result

    @classmethod
    def check_max_value(cls,max,val):
        """最大値は{}です。
        >>> Validation.check_max_value(10,10)
        False
        >>> Validation.check_max_value(10, 11)
        True
        """
        result = True
        val = int(val) if isinstance(val,str) else val
        max = int(max) if isinstance(max,str) else max
        if val <= max:
            result = False
        return result
    
    @classmethod
    def check_max_float(cls,max,val):
        """最大値は{}です。
        >>> Validation.check_max_float(10.1,10.1)
        False
        >>> Validation.check_max_float(10.1, 10.2)
        True
        """
        result = True
        val = float(val) if isinstance(val,str) else val
        max = float(max) if isinstance(max,str) else max
        if val <= max:
            result = False
        return result
    
    @classmethod
    def check_min_length(cls,min,val):
        """文字数は{}以上です。
        >>> Validation.check_min_length(10,"123456789|")
        False
        >>> Validation.check_min_length(10,"123456789")
        True
        """
        result = True
        v = str(val)
        min = int(min) if isinstance(min,str) else min
        if len(v) >= min:
            result = False
        return result
    
    @classmethod
    def check_max_length(cls,max,val):
        """文字数は{}以下です。
        >>> Validation.check_max_length(10, "123456789|")
        False
        >>> Validation.check_max_length(10, "123456789|1")
        True
        """
        result = True
        v = str(val)
        max = int(max) if isinstance(max,str) else max
        if len(v) <= max:
            result = False
        return result

    @classmethod
    def check_before(cls,time1,time2):
        """{}以前の時刻を指定してください。
        >>> time1 = datetime.datetime.strptime("1999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
        >>> time2 = datetime.datetime.now()
        >>> Validation.check_before(time1,time2)
        False
        >>> Validation.check_before(time2,time1)
        True
        """
        result = True
        time1 = datetime.datetime.strptime(time1,Validation.DATETIME_FORMAT) if isinstance(time1,str) else time1
        time2 = datetime.datetime.strptime(time2,Validation.DATETIME_FORMAT) if isinstance(time2,str) else time2
        if time1 <= time2:
            result = False
        return result
    
    @classmethod
    def check_after(cls,time1,time2):
        """{}以後の時刻を指定してください。
        >>> time1 = datetime.datetime.strptime("9999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
        >>> time2 = datetime.datetime.now()
        >>> Validation.check_after(time1,time2)
        False
        >>> Validation.check_after(time2,time1)
        True
        """
        result = True
        time1 = datetime.datetime.strptime(time1,Validation.DATETIME_FORMAT) if isinstance(time1,str) else time1
        time2 = datetime.datetime.strptime(time2,Validation.DATETIME_FORMAT) if isinstance(time2,str) else time2
        if time1 >= time2:
            result = False
        return result
    
    @classmethod
    def check_equal_datetime(cls,time1,time2):
        """{}指定された時刻と異なります。
        >>> time1 = datetime.datetime.strptime("1999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
        >>> time2 = datetime.datetime.strptime("1999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
        >>> time3 = datetime.datetime.now()
        >>> Validation.check_equal_datetime(time1,time2)
        False
        >>> Validation.check_equal_datetime(time1,time3)
        True
        """
        result = True
        time1 = datetime.datetime.strptime(time1,Validation.DATETIME_FORMAT) if isinstance(time1,str) else time1
        time2 = datetime.datetime.strptime(time2,Validation.DATETIME_FORMAT) if isinstance(time2,str) else time2
        if time1 == time2:
            result = False
        return result

    @classmethod
    def check_regex(cls,reg,val):
        """パターンにマッチしません。
        >>> Validation.check_regex(Validation.REGEX_ALPHABET,"snms1234")
        False
        >>> Validation.check_regex(Validation.REGEX_ALPHABET,"あいうえお1234")
        True
        """
        return not(bool(re.fullmatch("{}".format(reg),str(val))))

    @classmethod
    def check_equal_value(cls,val1=None,val2=None):
        """値が一致しません。
        >>> Validation.check_equal_value(1,1)
        False
        >>> Validation.check_equal_value("a","a")
        False
        >>> Validation.check_equal_value([1,2],[1,2]) # Pythonは等式で結べてしまうので注意
        False
        >>> Validation.check_equal_value({"a":"b"},{"a":"b"}) # Pythonは等式で結べてしまうので注意
        False
        >>> Validation.check_equal_value(1,"a")
        True
        """
        result = True        
        if val1 == val2:
            result = False
        return result
    
    @classmethod
    def check_include(cls,word,text):
        """{}が含まれいません。
        >>> Validation.check_include("a","abcd")
        False
        >>> Validation.check_include("a",["a","b","c","d"])
        False
        >>> Validation.check_include(1,[1,2,3,4])
        False
        >>> Validation.check_include("a","bcd")
        True
        """
        result = True
        if word in text:
            result = False
        return result
    
    @classmethod
    def check_not_include(cls,word,text):
        """{}が含まれています。
        >>> Validation.check_not_include("a","bcd")
        False
        >>> Validation.check_not_include("a","abcd")
        True
        >>> Validation.check_not_include("a",["a","b","c","d"])
        True
        >>> Validation.check_not_include(1,[1,2,3,4])
        True
        """
        return not(cls.check_include(word,text))
    
    @classmethod
    def check_not_null(cls,v):
        """値がありません。
        >>> Validation.check_not_null("")
        False
        >>> Validation.check_not_null(1)
        False
        >>> Validation.check_not_null([])
        False
        >>> Validation.check_not_null(())
        False
        >>> Validation.check_not_null(None)
        True
        """
        return v is None
    
    @classmethod
    def check_null(cls,v):
        """値があります。
        >>> Validation.check_null(None)
        False
        >>> Validation.check_null("")
        True
        >>> Validation.check_null(1)
        True
        >>> Validation.check_null([])
        True
        >>> Validation.check_null(())
        True
        """
        return v is not None
    
    @classmethod
    def check_required(cls,v):
        """必須入力です。
        >>> Validation.check_required(1)
        False
        >>> Validation.check_required("a")
        False
        >>> Validation.check_required(None)
        True
        >>> Validation.check_required("")
        True
        """
        return v is None or v == ""
    
    @classmethod
    def check_max_count(cls,max,v):
        """{}個まで入力できます。
        >>> Validation.check_max_count(2,[1,2])
        False
        >>> Validation.check_max_count(2,[1,2,3])
        True
        """
        return len(v) > max
    
    @classmethod
    def check_min_count(cls,min,v):
        """{}個以上の入力が必須です。
        >>> Validation.check_min_count(2,[1,2])
        False
        >>> Validation.check_min_count(2,[1])
        True
        """
        return len(v) < min
    
    @classmethod
    def check_zero_count(cls,v):
        """1個以上の入力が必要です。
        >>> Validation.check_zero_count([1])
        False
        >>> Validation.check_zero_count([])
        True
        """
        return len(v) == 0
    
    @classmethod
    def check_zero(cls,v):
        """値が0です。
        >>> Validation.check_zero(1)
        False
        >>> Validation.check_zero("1")
        False
        >>> Validation.check_zero(0)
        True
        >>> Validation.check_zero("0")
        True
        """
        if isinstance(v,str):
            try:
                result = int(v) == 0
            except Exception as e:
                result = False
        else:
            result = v == 0
        return result

    
    def __init__(self,data=None):
        self.data = data
        self.messages = []

    @property
    def result(self):
        return any(self.messages)

    def _check(self,data=None):
        """ チェック関数（オーバーライド必須）
            チェック処理とメッセージの登録を実装する。
            ※チェック結果が問題ない場合はメッセージは登録しない。
            メッセージはself.messagesへ追加するように実装する。
        """
        print(data)
        return None
    
    def check(self,data=None):
        self.messages = []
        try:
            self._check(data)
            return self.result
        except Exception as e:
            print(e)
            self.messages.append(Validation.UNEXPECTED_ERROR)
            return self.result
        
    def append(self,message,*args):
        self.messages.append(message.format(*args))


class Check:
    """ 
    処理介入チェッククラス。チェック対象の関数に対して、本クラスが提供するデコレータを付与することで実現する。
    ```
    c = Check()

    # チェック処理用の関数
    def checker(*args,**kwargs):
        print("NG)

    # hoge関数のバリデーションチェックをラッピングしたもの
    # チェックモードのfast, late, customをはじめに付与しておき、各バリデーションを追加していく。
    @c.fast(checker)
    @c.min("x",10)
    def hoge(x):
        print("OK")
    ```
    """


    ARGS_ERROR = "入力した値が適切ではありません.。"
    CHECKER_ERROR = "指定されたchecker関数は呼び出しできません。"
    REGEX_ALPHABET = "[A-Za-z0-9]+"

    def __init__(self,vc=Validation):
        self.init()
        # バリデーションクラスのメンバ変数(Validationクラスかそのサブクラス)
        self.vc = vc

    def init(self):
        self.messages = {}
        self.result = True
        self.injection = None
        self.is_fast = False
        self.is_late = False
        self.arguments = ()
        self.keywords = {}
        self.data = None
    
    def append(self,key,val):
        self.messages[key] = val

    @property
    def messages(self):
        return self._messages
    
    @messages.setter
    def messages(self,val):
        self._messages = val
    
    @property
    def result(self):
        return self._result
    
    @result.setter
    def result(self,val):
        self._result = val
    
    @property
    def injection(self):
        return self._injection
    
    @injection.setter
    def injection(self,val):
        self._injection = val
    
    @property
    def is_fast(self):
        return self._is_fast
    
    @is_fast.setter
    def is_fast(self,val):
        self._is_fast = val
    
    @property
    def is_late(self):
        return self._is_late
    
    @is_late.setter
    def is_late(self,val):
        self._is_late = val
    
    @property
    def arguments(self):
        return self._arguments
    
    @arguments.setter
    def arguments(self,val):
        self._arguments = val
    
    @property
    def keywords(self):
        return self._keywords
    
    @keywords.setter
    def keywords(self,val):
        self._keywords = val

    @property
    def text(self):
        return "\n".join(self.messages.values())
    
    @property
    def data(self):
        return {
            "_messages":self.messages,
            "_result":self.result,
            "_arguments":self.arguments,
            "_keywords":self.keywords
        }
    
    @data.setter
    def data(self,d):
        self._data = d

    def business(self,checker=None):
        """ ビジネスロジックに関するバリデーションチェック(機能ごとに複雑に定義されるべきチェックロジック)
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                data = {"args":args,"kwargs":kwargs}
                if callable(checker):
                    res = checker(data)
                    if res is not None or res == "":
                        self.messages["_check"] = res
                else:
                    vc = self.vc()
                    if vc.check(data):
                        self.result = False
                        self.messages["_check"] = vc.messages

                return self.response(func, *args, **kwargs)
            return wrapper
        return dec

    def inspect(self,checker,n,v=None):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()
                for name,value in bound_args.arguments.items():
                    if name == n :
                        # result = checker(v,value) if v is not None else checker(value)
                        result = self.invoke(checker,v,value)
                        if result:
                            self.append(n,self.format(checker.__doc__.split("\n")[0], v))
                            self.result = False
                            break

                return self.response(func, *args, **kwargs)
            return wrapper
        return dec
    

    def compare(self,checker,n1,n2):
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                sig = inspect.signature(func)
                bound_args = sig.bind(*args, **kwargs)
                bound_args.apply_defaults()
                v1 = bound_args.arguments[n1] if n1 in bound_args.arguments else None
                v2 = bound_args.arguments[n2] if n2 in bound_args.arguments else None

                result = True
                if v1 is not None and v2 is not None:
                    result = checker(v1,v2)
                    if result:
                        self.append("{}|{}".format(n1,n2),self.format(checker.__doc__.split("\n")[0], [v1,v2]))
                        self.result = False

                return self.response(func, *args, **kwargs)
            return wrapper
        return dec
            
    def response(self, func, *args, **kwargs):
        ret = None
        if self.result == False and self.is_fast == True:
            kwargs["_messages"] = self.messages
            kwargs["_result"] = self.result
            args = args + self.arguments
            kwargs = {**kwargs , **self.keywords}
            self.arguments = args
            self.keywords = kwargs
            ret = self.injection(*args, **kwargs) if callable(self.injection) else func(*args, **kwargs)
        elif self.result == False and self.is_late == True:

            #オリジナル関数の場合
            if func is inspect.unwrap(func):
                kwargs["_messages"] = self.messages
                kwargs["_result"] = self.result
                args = args + self.arguments
                kwargs = {**kwargs , **self.keywords}
                self.arguments = args
                self.keywords = kwargs
                ret = self.injection(*args, **kwargs) if callable(self.injection) else func(*args, **kwargs)
            
            #ラッピング関数の場合
            else:
                ret = func(*args, **kwargs) if callable(self.injection) else func(*args, **kwargs)
        elif self.result == True:
            ret = func(*args, **kwargs)
        else:
            ret = func(*args, **kwargs)
        return ret

    def invoke(self,checker,baseV,argV):
        result = True
        if callable(checker):
            result = checker(baseV,argV) if baseV is not None else checker(argV)
            
        else:
            self.append("_error",self.CHECKER_ERROR)
        return result

    def min(self,n,v):
        """
        n:名前
        v:基準値
        """
        return self.inspect(self.vc.check_min_value,n,v)
    
    def max(self,n,v):
        return self.inspect(self.vc.check_max_value,n,v)
    
    def max_length(self,n,v):
        return self.inspect(self.vc.check_max_length,n,v)

    def min_length(self,n,v):
        return self.inspect(self.vc.check_min_length,n,v)

    def not_null(self,n):
        return self.inspect(self.vc.check_not_null,n)
    
    def equal(self,n1,n2):
        """ 指定した引数の２つの要素が等しいことをチェックする関数デコレータ
        Args:
            n1(string):比較したい値の引数名
            n2(string):比較したい値の引数名
        Returns:
            function:チェック処理でラッピングされた関数
        """
        return self.compare(self.vc.check_equal_value,n1,n2)
    
    def time(self,n1,n2):
        return self.compare(self.vc.check_equal_datetime,n1,n2)
    
    def before(self,n1,n2):
        return self.compare(self.vc.check_before,n1,n2)
    
    def after(self,n1,n2):
        return self.compare(self.vc.check_after,n1,n2)
        
    def regex(self,n,v="[A-Za-z0-9]+"):
        return self.inspect(self.vc.check_regex,n,v)

    def alphabet(self,n):
        return self.inspect(self.vc.check_regex,n,self.REGEX_ALPHABET)

    def include(self,n,v):
        return  self.inspect(self.vc.check_include,n,v)
    
    def not_include(self,n,v):
        return  self.inspect(self.vc.check_not_include,n,v)
    
    def required(self,n):
        return self.inspect(self.vc.check_required,n)
    
    def check_int(self,n):
        return self.inspect(self.vc.check_int,n)
    
    def check_float(self,n):
        return self.inspect(self.vc.check_float,n)
    
    def check_list(self,n):
        return self.inspect(self.vc.check_list,n)
    
    def check_tuple(self,n):
        return self.inspect(self.vc.check_tuple,n)

    def convert_int(self,n):
        return self.inspect(self.vc.check_convert_int,n)
    
    def convert_float(self,n):
        return self.inspect(self.vc.check_convert_float,n)
    
    def convert_list(self,n):
        return self.inspect(self.vc.check_convert_list,n)
    
    def convert_tuple(self,n):
        return self.inspect(self.vc.check_convert_tuple,n)
    
    def max_count(self,n,v):
        return self.inspect(self.vc.check_max_count,n,v)
    
    def min_count(self,n,v):
        return self.inspect(self.vc.check_min_count,n,v)
    
    def zero_count(self,n):
        return self.inspect(self.vc.check_zero_count,n)
    
    def zero(self,n):
        return self.inspect(self.vc.check_zero,n)

    def fast(self,injection,*arguments,**keywords):
        """ 一つでもチェックが入った場合に即座に処理を介入させる関数
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if callable(injection):
                    self.init()
                    self.injection = injection
                    self.is_fast = True
                    self.is_late = False
                    self.arguments = arguments
                    self.keywords = keywords
                return func(*args, **kwargs)
            return wrapper
        return dec
    
    def late(self,injection,*arguments,**keywords):
        """ 全てのチェックを終えた後に処理を介入させる関数
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if callable(injection):
                    self.init()
                    self.injection = injection
                    self.is_fast = False
                    self.is_late = True
                    self.arguments = arguments
                    self.keywords = keywords
                return func(*args, **kwargs)
            return wrapper
        return dec
    
    def custom(self,*arguments,**keywords):
        """ メイン関数内でチェック処理をする場合（介入をさせない関数）
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                self.init()
                self.is_fast = False
                self.is_late = False
                self.arguments = arguments
                self.keywords = keywords
                return func(*args, **kwargs)
            return wrapper
        return dec

    def format(self,doc,val):
        try:
            message = ""
            if val is None:
                message += doc
            elif isinstance(doc,dict):
                message += doc.format(**val)
            elif isinstance(doc,list):
                message += doc.format(*val)
            else:
                message += doc.format(val)
        except Exception as e:
            message = doc
        return message


if __name__ == "__main__":

    """
    以下はサンプルコード
    """

    """
        py -m common.validation.py
    """
    print("===Validationテスト===")
    import doctest
    doctest.testmod(verbose=True)

    print("===Checkテスト===")
    import threading
    c = Check()

    def checker(*args, **kwargs):
        """ バリデーションのチェック時の処理を行う関数 """
        print("NG")
        print(c.data)

    def mycheck(*args,**kwargs):
        """ mycheck """
        print(args,kwargs)
        for arg in args:
            if arg["args"][0] > 1:
                return "CHECK"
            else:
                return ""

    test_list = []
    def make_test(func,args):
        t = threading.Thread(target=func,args=args)
        test_list.append({"thread":t,"name":func.__doc__})

    @c.custom()
    @c.min("x",10)
    def test1(x):
        """min"""
        print("args",x)
        print(c.data)
    
    @c.custom()
    @c.max("x",10)
    def test2(x):
        """max"""
        print("args",x)
        print(c.data)

    @c.custom()
    @c.max_length("x",10)
    def test3(x):
        """max_length"""
        print("args",x)
        print(c.data)

    @c.custom()
    @c.min_length("x",10)
    def test4(x):
        """min_length"""
        print("args",x)
        print(c.data)

    @c.custom()
    @c.not_null("x")
    def test5(x):
        """not_null"""
        print("args",x)
        print(c.data)

    @c.custom()
    @c.equal("x","y")
    def test6(x,y):
        """equal"""
        print("args",x,y)
        print(c.data)

    @c.custom()
    @c.time("x","y")
    def test7(x,y):
        """ time equal """
        print("args",x,y)
        print(c.data)

    @c.custom()
    @c.before("x","y")
    def test8(x,y):
        """ before """
        print("args",x,y)
        print(c.data)

    @c.custom()
    @c.after("x","y")
    def test9(x,y):
        """ after """
        print("args",x,y)
        print(c.data)

    @c.custom()
    @c.regex("x")
    def test10(x):
        """ regex """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.alphabet("x")
    def test11(x):
        """ alphabet """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.include("x","aa")
    def test12(x):
        """ include """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.not_include("x","aa")
    def test13(x):
        """ not_include """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.required("x")
    def test14(x):
        """ required """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.check_int("x")
    def test15(x):
        """ check_int """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.check_float("x")
    def test16(x):
        """ check_float """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.check_list("x")
    def test17(x):
        """ check_list """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.check_tuple("x")
    def test18(x):
        """ check_tuple """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.max_count("x",2)
    def test19(x):
        """ max_count """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.min_count("x",2)
    def test20(x):
        """ min_count """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.zero_count("x")
    def test21(x):
        """ zero_count """
        print("args",x)
        print(c.data)

    @c.custom()
    @c.zero("x")
    def test22(x):
        """ zero """
        print("args",x)
        print(c.data)

    @c.fast(checker)
    @c.min("x",10)
    @c.max("y",20)
    def test23(x,y):
        """ fast check """
        print("args",x,y)
        print(c.data)

    @c.late(checker)
    @c.min("x",10)
    @c.max("y",20)
    def test24(x,y):
        """ late check """
        print("args",x,y)
        print(c.data)

    @c.fast(checker)
    @c.business(mycheck)
    def test25(x):
        """ business check """
        print(c.data)

    make_test(test1,args=( 9,))
    make_test(test1,args=(10,))
    make_test(test1,args=(11,))

    make_test(test2,args=( 9,))
    make_test(test2,args=(10,))
    make_test(test2,args=(11,))

    make_test(test3,args=("123456789",))
    make_test(test3,args=("1234567890",))
    make_test(test3,args=("12345678901",))

    make_test(test4,args=("123456789",))
    make_test(test4,args=("1234567890",))
    make_test(test4,args=("12345678901",))

    make_test(test5,args=(None,))
    make_test(test5,args=("",))
    make_test(test5,args=("a",))
    make_test(test5,args=(1,))
    
    make_test(test6,args=(1,1))
    make_test(test6,args=(1,2))
    make_test(test6,args=("a","a"))
    make_test(test6,args=("a","b"))
    make_test(test6,args=([1,2],[1,2]))
    make_test(test6,args=([1,2],[3,4]))
    make_test(test6,args=((1,2),(1,2)))
    make_test(test6,args=((1,2),(3,4)))

    time1 = datetime.datetime.strptime("1999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
    time2 = datetime.datetime.strptime("1999/12/31 23:59:59",Validation.DATETIME_FORMAT2)
    time3 = datetime.datetime.strptime("2000/12/31 23:59:59",Validation.DATETIME_FORMAT2)
    now   = datetime.datetime.now()

    make_test(test7 ,args=(time1,time2))
    make_test(test7 ,args=(time1,time3))

    make_test(test8 ,args=(time1,time2))
    make_test(test8 ,args=(time1,time3))
    make_test(test8 ,args=(time1,now))

    make_test(test9 ,args=(time1,time2))
    make_test(test9 ,args=(time1,time3))
    make_test(test9 ,args=(now,time1))

    make_test(test10,args=("aaa",))
    make_test(test10,args=("あああ",))

    make_test(test11,args=("aaa",))
    make_test(test11,args=("あああ",))

    make_test(test12,args=("12",))
    make_test(test12,args=("aaa",))

    make_test(test12,args=("12",))
    make_test(test12,args=("aaa",))

    make_test(test13,args=("12",))
    make_test(test13,args=("aaa",))

    make_test(test14,args=("",))
    make_test(test14,args=(None,))
    make_test(test14,args=("aaa",))

    make_test(test15,args=(12,))
    make_test(test15,args=("12",))
    make_test(test15,args=("aaa",))

    make_test(test16,args=(12,))
    make_test(test16,args=(1.2,))
    make_test(test16,args=("1.2",))
    make_test(test16,args=("aaa",))

    make_test(test17,args=([1,2],))
    make_test(test17,args=((1,2),))
    make_test(test17,args=("[1,2]",))

    make_test(test18,args=((1,2),))
    make_test(test18,args=([1,2],))
    make_test(test18,args=("(1,2)",))

    make_test(test19,args=([1,2,3],))
    make_test(test19,args=([1,2],))

    make_test(test20,args=([1],))
    make_test(test20,args=([1,2],))

    make_test(test21,args=([],))
    make_test(test21,args=([1,2],))

    make_test(test22,args=(0,))
    make_test(test22,args=(1,))
    make_test(test22,args=("0",))
    make_test(test22,args=("",))
    make_test(test22,args=(None,))

    make_test(test23,args=(5,25))

    make_test(test24,args=(5,25))

    make_test(test25,args=(10,))

    for th in test_list:
        print(th["name"])
        th["thread"].run()