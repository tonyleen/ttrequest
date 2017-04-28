'use strict';

var req = require('request');
var assert = require('assert');
var url = require('url');

//常量
var _defaultTimeout = 2000,//get 默认超时时间
  _defaultPostTimeout = 5000,//post 默认超时时间
  _keepAlive = true;//是否开启keep alive

//apiclient 类
var apiClient = function (options) {
  assert(options, 'options is necessary');
  assert(options.host, 'options.host is necessary');
  this.host = options.host;
  this.path = options.path;
  this.method = options.method || 'get';
  this.headers = options.headers || {};
  this.useQuerystring = options.useQuerystring;
  //传request到后端服务 by sxd
  if (options.req && options.req.headers) this.headers.RequestId = options.req.headers.requestid;

  this.timeout = options.timeout || _defaultTimeout;
  if (this.method && this.method == 'post')
    this.postTimeout = options.postTimeout || options.timeout || _defaultPostTimeout;

  if (this.timeout < 200) this.timeout = _defaultTimeout;
  if (this.postTimeout < 500) this.postTimeout = _defaultPostTimeout;

  if (this.headers['User-Agent'] === undefined) {
    this.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
  }
  if (typeof options.keepAlive === 'undefined' || options.keepAlive == null)
    this.keepAlive = _keepAlive;
  else
    this.keepAlive = options.keepAlive;

  //是否格式化get时array参数解析，true时则array解析为array=1&array=2（默认array[0]=1&array[1]=2）
  if (!this.useQuerystring) this.useQuerystring = undefined;
};

//原生调用,返回 err,response,body
apiClient.prototype.originalRequest = function (params, callback) {
  if (!this.path) this.path = '';
  var reqUrl = url.resolve(this.host, this.path);
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }
  if (!params) params = {};

  var reqOptions = {
    method: this.method,
    url: reqUrl,
    headers: this.headers,
    forever: this.keepAlive,
    useQuerystring: this.useQuerystring
  };
  if (this.method === 'get') {
    reqOptions.qs = params;

    //默认超时时间
    if (this.timeout) reqOptions.timeout = this.timeout;
  }
  else if (this.method === 'post') {
    try {
      if (reqOptions.headers && (reqOptions.headers['Content-Type'] == 'application/x-www-form-urlencoded' || reqOptions.headers['content-type'] == 'application/x-www-form-urlencoded')) {
        reqOptions.form = params;
      }
      else if (reqOptions.headers && (reqOptions.headers['Content-Type'] == 'multipart/form-data' || reqOptions.headers['content-type'] == 'multipart/form-data')) {
        reqOptions.formData = params;
      }
      else
        reqOptions.body = JSON.stringify(params);
    } catch (e) {
    }

    //默认超时时间
    if (this.postTimeout) reqOptions.timeout = this.postTimeout;
  }

  req(reqOptions, function (error, response, body) {
    //被服务端关闭连接就重试一次
    if (error && error.message == 'socket hang up') {
      params._onSocketHangUpRetry = true;
      req(reqOptions, function (error, response, body) {
        callback(error, response, body);
      });
    }
    else
      callback(error, response, body);
  });
};

//基础调用,返回 err,body
apiClient.prototype.baseRequest = function (params, callback) {
  this.originalRequest(params, function (error, response, body) {
    if (!error && response && response.statusCode == 200) {
      try {
        var _body = JSON.parse(body);
        var result = undefined;
        result = _body;
      }
      catch (e) {
        return callback(e);
      }
      return callback(null, result);
    } else if (error) {
      return callback(error);
    } else {
      if (!response) response = {};
      return callback(new Error('http code:' + response.statusCode + ' body:' + body));
    }
  });
};

//基础请求,返回body.result
exports = module.exports = function (options, paramsOrCallback, callback) {
  var ac = new apiClient(options);
  if (typeof paramsOrCallback === 'function') {
    callback = paramsOrCallback;
    paramsOrCallback = null;
  }
  return ac.baseRequest(paramsOrCallback, function (err, body) {
    if (body) {
      var result = undefined;
      if (body.status != 200) {
        result = body;
      }
      else {
        result = body['result'] || body['Result'] || undefined;
      }
      return callback(null, result)
    }
    return callback(err, body);
  });
};

//基础请求,返回原生body
exports.exec = function (options, paramsOrCallback, callback) {
  var ac = new apiClient(options);
  if (typeof paramsOrCallback === 'function') {
    callback = paramsOrCallback;
    paramsOrCallback = null;
  }
  return ac.baseRequest(paramsOrCallback, callback);
};

//原生请求,返回包括httpcode,原生body
exports.execOriginal = function (options, paramsOrCallback, callback) {
  var ac = new apiClient(options);
  if (typeof paramsOrCallback === 'function') {
    callback = paramsOrCallback;
    paramsOrCallback = null;
  }
  return ac.originalRequest(paramsOrCallback, callback);
};

//请求get
exports.get = function (getUrl, paramsOrCallback, callback) {
  var options = {};
  if (paramsOrCallback && typeof paramsOrCallback == 'object') {
    options = paramsOrCallback;
  }
  var urlObj = url.parse(getUrl);
  options.method = 'get';
  options.path = urlObj.path;
  options.host = urlObj.protocol + '//' + urlObj.host;

  var ac = new apiClient(options);
  if (typeof paramsOrCallback === 'function') {
    callback = paramsOrCallback;
    paramsOrCallback = null;
  }
  return ac.baseRequest(paramsOrCallback, callback);
};

//请求serarch
exports.callSearch = function (options, appInfo, paramObj, callback) {
  //需接入appInfo中间件后使用
  var infos = [];
  infos.push('userid:' + appInfo.userId);
  infos.push('cookieid:' + appInfo.deviceId);
  if (appInfo.idfa) infos.push('idfa:' + appInfo.idfa);
  if (appInfo.imei) infos.push('imei:' + appInfo.imei);
  if (appInfo.yId) infos.push('yid:' + (appInfo.yId || 'abcd'));
  if (!paramObj.info) paramObj.info = infos.join(',');
  if (!paramObj.yid) paramObj.yid = appInfo.yId || 'abcd';
  if (!paramObj.requestid) paramObj.requestid = appInfo.requestId;
  if (!paramObj.platform) paramObj.platform = 'appbuyer';

  exports.exec(options, paramObj, callback);
};

//设置apiClient超时默认值,timeout 超时时间（单位毫秒），不设置，默认5000毫秒
//老设置 timeout = 1000
//新设置 timeout = {get:2000,post:5000}
exports.setDefaultTimeout = function (timeout) {
  if (!timeout) return false;

  //兼容老设置，只能设置一个超时时间
  if (typeof timeout === 'number') _defaultTimeout = timeout;
  else if (typeof timeout === 'object') {
    if (timeout.get && typeof timeout.get === 'number') _defaultTimeout = timeout.get;
    if (timeout.post && typeof timeout.post === 'number') _defaultPostTimeout = timeout.post;
  }
};
