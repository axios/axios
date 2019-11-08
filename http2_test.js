var axios = require('./index.js');
var fs = require('fs');

axios.defaults.experimental_http2 = true;

axios({
  method: 'POST',
  data: {
    my_data: "yolo swag"
  },
  url: 'https://localhost:8443/',
  certificatePath: './localhost-cert.pem',
}).then(function (response) {
    console.log(response);
  }).catch(function (error) {
    console.log(error);
  })