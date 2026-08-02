# 外部ライブラリのインポート
import jinja2
# 自製ライブラリのインポート
from common.file import *

class TemplateFile():
    """ テンプレートファイルからテキストファイルを生成するクラス
    ### Outlines
        jinja2テンプレートエンジンを使って、動的にテキスト生成する
    ### Examples
    tmp/sample.txtを参照し、テンプレート内のnameに「user」を挿入したsample.txtを生成する例
    ``` 
    < main.py >
    ------------------------------------------------------------
        tf = TemplateFile(folder_path="tmp")
        tf.draw("sample.txt",{"name":"user"})
        tf.save("sample.txt")
    ------------------------------------------------------------
    
    < tmp/sample.txt >
    ------------------------------------------------------------
        {{ name }} さん、こんにちは！
    ------------------------------------------------------------
    ```
    """
    def __init__(self,folder_path:str="templates"):
        self.folder_path = folder_path
        self.env = None
        self.text = ""
        self.init()

    def init(self):
        self.env = jinja2.Environment(loader=jinja2.FileSystemLoader(self.folder_path))

    def draw(self, file_name:str="sample.txt", context:dict={}):
        temp = self.env.get_template(file_name)
        self.text = temp.render(context)
        return self.text

    def save(self,save_path:str="sample.txt"):
        td = TextData(save_path,first_read=False)
        td.data = self.text
        return td.write()