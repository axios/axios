var axios = require('./index.js');
var fs = require('fs');

axios.defaults.experimental_http2 = true;

axios({
  method: 'get',
  url: 'http://bit.ly/2mTM3nY',
  responseType: 'stream'
}).then(function (response) {
    console.log(response);
    response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
  }).catch(function (error) {
    console.log(error);
  })