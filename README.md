# ttrequest
---
http request中间件

## Install
```bash
$ npm install ttrequest
```

### 使用说明
```bash
var ttRequest = require('ttrequest');

//返回body，不对body做处理
ttRequest.exec(callInfo, params, function (err, body) {

})

//返回结果，获取body里的result属性，返回body.result
ttRequest(callInfo, params, function (err, result) {

})
```

#### call
```bash
{
    method: 'post',                                 //post或get        必填
    host: 'http://api.baidu.com/',                  //服务host         必填
    headers:{"Content-Type":"application/json"},    //请求服务的header 可选
    path: '/api/test'                               //path,服务的path  必填
}
```

#### params
GET或者POST 都使用Object类型,中间件会自动展开