from flask import g, request
from functools import wraps
from common.validation import Validation, Check

class FlaskCheck(Check):

    def __init__(self, app=None, vc=Validation):
        self.app = app
        super().__init__(vc)
        self.init()

    def init(self):
        with self.app.app_context():
            self.messages = {}
            self.result = True
            self.injection = None
            self.is_fast = False
            self.is_late = False
            self.arguments = ()
            self.keywords = {}
    
    def append(self,key,val):
        self.messages[key] = val
        
    @property
    def messages(self):
        if not hasattr(g,"messages"):
            setattr(g,"messages",{})
        return getattr(g,"messages")
    
    @messages.setter
    def messages(self,val):
       setattr(g,"messages",val)
    
    @property
    def result(self):
        if not hasattr(g,"result"):
            setattr(g,"result",True)
        return getattr(g,"result")
    
    @result.setter
    def result(self,val):
        setattr(g,"result",val)
    
    @property
    def injection(self):
        if not hasattr(g,"injection"):
            setattr(g,"injection",None)
        return getattr(g,"injection")
    
    @injection.setter
    def injection(self,val):
        setattr(g,"injection",val)
    
    @property
    def is_fast(self):
        if not hasattr(g,"is_fast"):
            setattr(g,"is_fast",False)
        return getattr(g,"is_fast")
    
    @is_fast.setter
    def is_fast(self,val):
        setattr(g,"is_fast",val)
    
    @property
    def is_late(self):
        if not hasattr(g,"is_late"):
            setattr(g,"is_late",False)
        return getattr(g,"is_late")
    
    @is_late.setter
    def is_late(self,val):
        setattr(g,"is_late",val)
    
    @property
    def arguments(self):
        if not hasattr(g,"arguments"):
            setattr(g,"arguments", ())
        return getattr(g,"arguments")
    
    @arguments.setter
    def arguments(self,val):
        setattr(g,"arguments", val)
    
    @property
    def keywords(self):
        if not hasattr(g,"keywords"):
            setattr(g,"keywords", {})
        return getattr(g,"keywords")
    
    @keywords.setter
    def keywords(self,val):
       setattr(g,"keywords",val)

    ## リクエストコンテンツのチェック

    @property
    def form(self):
        return request.form
    
    @property
    def json(self):
        return request.get_json()

    @property
    def args(self):
        return request.args
    
    @property
    def files(self):
        return request.files
    
    def get_target(self,target):
        t = None
        if target == "form":
            t = self.form
        elif target == "json":
            t = self.json
        elif target == "args":
            t = self.args
        elif target == "files":
            t = self.files

        return t

    
    def v_inspect(self,checker,target,n,v=None):
        """ リクエストの受信データチェック関数生成関数
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                t = self.get_target(target)

                res = True
                if n in t:
                    res = self.invoke(checker,v,t[n])
                
                if res:
                    self.append(n,self.format(checker.__doc__.split("\n")[0],v))
                    self.result = False

                return self.response(func,*args,**kwargs)
            return wrapper
        return dec
    
    def v_compare(self,checker,target,n1,n2):
        """ リクエストの受信データの比較チェック関数生成関数
        """
        def dec(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                t = self.get_target(target)
                
                res = True
                if n1 in t and n2 in t:
                    v1 = t[n1]
                    v2 = t[n2]
                    res = checker(n1,n2)
                    if res:
                        self.append("{}|{}".format(n1,n2),self.format(checker.__doc__.split("\n")[0], [v1,v2]))
                        self.result = False

                return self.response(func, *args,**kwargs)
            return wrapper
        return dec

    def v_min(self,target,n,v):
        return self.v_inspect(self.vc.check_min_value,target,n,v)
    
    def v_max(self,target,n,v):
        return self.v_inspect(self.vc.check_max_value,target,n,v)
    
    def v_min_length(self,target,n,v):
        return self.v_inspect(self.vc.check_min_length,target,n,v)

    def v_max_length(self,target,n,v):
        return self.v_inspect(self.vc.check_max_length,target,n,v)

    def v_not_null(self,target,n):
        return self.v_inspect(self.vc.check_not_null,target,n)
    
    def v_null(self,target,n):
        return self.v_inspect(self.vc.check_null,target,n)
    
    def v_required(self,target,n):
        return self.v_inspect(self.vc.check_required,target,n)

    def v_before(self,target,n1,n2):
        return self.v_compare(self.vc.check_before,target,n1,n2)
    
    def v_after(self,target,n1,n2):
        return self.v_compare(self.vc.check_after,target,n1,n2)
    
    def v_regex(self,target,n,v):
        return self.v_inspect(self.vc.check_regex,target,n,v)
    
    def v_alphabet(self,target,n):
        return self.v_inspect(self.vc.check_regex,target,n,self.REGEX_ALPHABET)
    
    def v_include(self,target,n):
        return self.v_inspect(self.vc.check_include,target,n)
    
    def v_not_include(self,target,n):
        return self.v_inspect(self.vc.check_not_include,target,n)
    
    def v_check_int(self,target,n):
        return self.v_inspect(self.vc.check_int,target,n)
    
    def v_check_float(self,target,n):
        return self.v_inspect(self.vc.check_float,target,n)
    
    def v_check_list(self,target,n):
        return self.v_inspect(self.vc.check_list,target,n)
    
    def v_check_tuple(self,target,n):
        return self.v_inspect(self.vc.check_tuple,target,n)
    
    def v_min_count(self,target,n,v):
        return self.v_inspect(self.vc.check_min_count,target,n,v)
    
    def v_max_count(self,target,n,v):
        return self.v_inspect(self.vc.check_max_count,target,n,v)

    def v_zero_count(self,target,n):
        return self.v_inspect(self.vc.check_zero_count,target,n)
    
    def v_zero(self,target,n):
        return self.v_inspect(self.vc.check_zero,target,n)
    
    def v_convert_int(self,target,n):
        return self.v_inspect(self.vc.check_convert_int,target,n)
    
    def v_convert_float(self,target,n):
        return self.v_inspect(self.vc.check_convert_float,target,n)

    def v_convert_list(self,target,n):
        return self.v_inspect(self.vc.check_convert_list,target,n)

    def v_convert_tuple(self,target,n):
        return self.v_inspect(self.vc.check_convert_tuple,target,n)


class ValidationForm(Validation):
    def __init__(self, data=None):
        super().__init__(data)

    def _check(self,data=None):
        # validation form 特有のチェック
        return None
    
if __name__ == "__main__":
    pass