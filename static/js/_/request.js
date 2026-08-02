/**
 * 非同期通信でデータの送受信を行うクラス
 */

class RequestJSON{
  
  static csrf_token_dom = document.querySelector("meta[name=csrf_token]");
  static csrf_token = this.csrf_token_dom===null ? null : document.querySelector("meta[name=csrf_token]").getAttribute("value");
  static STATUS = {OK:"OK",NG:"NG",TRY:"TRY",WAIT:"WAIT"};
  static MESSAGE = {OK:"通信に成功しました。",NG:"通信に失敗しました。接続先のサーバが停止しているか、アクセスが集中している可能性があります。",TRY:"通信中です。",WAIT:"待機中です。"}

  constructor(url_get="/",url_post="/",func,error_func){
    this.group = "request";
    this.func = func;
    this.error_func = error_func;
    this.xhr = new XMLHttpRequest();
    this.url_get = url_get;
    this.url_post = url_post;
    this.res_data = {}; //レスポンスとして返却されたデータ
    this.status = RequestJSON.STATUS.WAIT
    this.init();
  }
  
  init(){
    let self = this;
		this.xhr.onload = function(){
			let READYSTATE_COMPLETED = 4;
			let HTTP_STATUS_OK = 200;
			if( this.readyState == READYSTATE_COMPLETED && this.status == HTTP_STATUS_OK ){
        self.res_data = JSON.parse(this.responseText);
				if(typeof(self.func) === "function"){
          self.status = RequestJSON.STATUS.OK;
          self.func(self.res_data);
        }
      }else if( this.readyState == READYSTATE_COMPLETED && this.status != HTTP_STATUS_OK ){
        // 200ステータス以外のステータスだった場合
        self.res_data = JSON.parse(this.responseText);
        if(typeof(self.error_func) === "function"){
          self.status = RequestJSON.STATUS.NG;
          self.error_func(self.res_data);
        }
			}else{
        self.status = RequestJSON.STATUS.NG;
        alert(RequestJSON.MESSAGE.NG);
      }
		}
    this.xhr.onerror = function(){
      if(typeof(self.connection_error_func) === "function"){
        self.connection_error_func();
      }else{
        alert(RequestJSON.MESSAGE.NG);
      }
    }
		return this;
  }

  set_func(func){
    this.func = func;
    return this;
  }

  set_error_func(func){
    this.error_func = func;
    return this;
  }

  set_connection_error_func(func){
    this.connection_error_func = func;
    return this;
  }

  set_url_get(url){
    this.url_get = url;
    return this;
  }

  set_url_post(url){
    this.url_post = url;
    return this;
  }

  async fetch(url="",options={
    method: "POST",
    headers: {'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
    body: JSON.stringify({}),
    }){
    const response = await fetch(url === "" ? this.url : url, options);
    if(!response.ok){
      if(typeof(this.connection_error_func) === "function"){
        this.connection_error_func();
      }else{
        alert(RequestJSON.MESSAGE.NG);
      }
      throw new Error(RequestJSON.MESSAGE.NG);
    }
    return response;
  }

  async fetchGET(url=""){
    // const response = await fetch(url === "" ? this.url : url,{
    //   method:"GET",
    //   headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
    // })
    // if(!response.ok){
    //   if(typeof(this.connection_error_func) === "function"){
    //     this.connection_error_func();
    //   }else{
    //     alert(RequestJSON.MESSAGE.NG);
    //   }
    //   throw new Error(RequestJSON.MESSAGE.NG);
    // }
    // this.res_data = await response.json();
    // return this.res_data;
    const response = await this.fetch(url,{
      method:"GET",
      headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
    });
    this.res_data = await response.json();
    return this.res_data;
  }

  async fetchPOST(url="",data=null){
    // const response = await fetch(url === "" ? this.url : url,{
    //   method:"POST",
    //   headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
    //   body: JSON.stringify(data ?? {})
    // })
    // if(!response.ok){
    //   if(typeof(this.connection_error_func) === "function"){
    //     this.connection_error_func();
    //   }else{
    //     alert(RequestJSON.MESSAGE.NG);
    //   }
    //   throw new Error(RequestJSON.MESSAGE.NG);
    // }
    // this.res_data = await response.json();
    // return this.res_data;
    const response = await this.fetch(url,{
      method:"POST",
      headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
      body: JSON.stringify(data ?? {}),
    });
    this.res_data = await response.json();
    return this.res_data;
  }

  async fetchFormData(url="",data=null){
    const response = await this.fetch(url,{
      method:"POST",
      headers:{'X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
      body: data ?? new FormData(),
    });
    this.res_data = await response.json();
    return this.res_data;
  }

  async fetchFile(url="",data={path:"filepath"}){
    const response = await this.fetch(url,{
      method:"POST",
      headers:{'Content-Type': 'application/json','X-Requested-With':'XMLHttpRequest','X-CSRFToken':RequestJSON.csrf_token},
      body: JSON.stringify(data ?? {}),
    });
    this.res_data = await response.blob();
    if (data.path){
      const path_splited = data.path.split("/");
      this.res_data = new File([this.res_data], path_splited[path_splited.length - 1], {type:this.res_data.type});
    }
    return this.res_data;
  }

  post(data){
    if(data === undefined){data = {}}
    this.xhr.open("POST",this.url_post);
		this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
    if(RequestJSON.csrf_token !== null){
		  this.xhr.setRequestHeader('X-CSRFToken', RequestJSON.csrf_token);
    }
    this.status = RequestJSON.STATUS.TRY;
		this.xhr.send(JSON.stringify(data));
  }

  post_form(data){
    this.xhr.open("POST",this.url_post);
    this.xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
    if(RequestJSON.csrf_token !== null){
      		this.xhr.setRequestHeader('X-CSRFToken', RequestJSON.csrf_token);
    }
    this.status = RequestJSON.STATUS.TRY;
		this.xhr.send(data);
  }

  post_file(data){
    this.xhr.open("POST",this.url_post);
    this.xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
    if(RequestJSON.csrf_token !== null){
      		this.xhr.setRequestHeader('X-CSRFToken', RequestJSON.csrf_token);
    }
    this.status = RequestJSON.STATUS.TRY;
		this.xhr.send(data);
  }

  get(data){
    if(data === undefined){data = {}}
    this.xhr.open("GET",this.url_get);
		this.xhr.setRequestHeader('Content-Type', 'application/json');
    this.xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
    if(RequestJSON.csrf_token !== null){
      this.xhr.setRequestHeader('X-CSRFToken', RequestJSON.csrf_token);
    }
    this.status = RequestJSON.STATUS.TRY;
		this.xhr.send(JSON.stringify(data));
  }

}


class RequestData extends RequestJSON{

}