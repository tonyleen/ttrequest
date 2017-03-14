/********************************************************************
 * Copyright (C) 2016 上海洋码头网络技术有限公司. All Rights Reserved.
 *
 * @author tongliang
 * @email tongliang@ymatou.com
 * @date 2016/3/16
 *
 ********************************************************************
 */
var apiClient = require('./lib/apiclient.js');

apiClient({
  method: 'get',
  host: 'http://www.ymatou.com',
  path: '/',
  keepAlive: false
}, null, function (err, result) {
  console.log('start test-----');
  console.log('ymt-node-apiclient test err:', err, ',result:', result);
  console.log('end test-----');
});

apiClient.exec({
  method: 'get',
  host: 'http://www.ymatou.com',
  path: '/'
}, null, function (err, result) {
  console.log('start test-----');
  console.log('ymt-node-apiclient exec test err:', err, ',result:', result);
  console.log('end test-----');
});