var axios = require("axios@0.18.0")

const instance = axios.create({
  baseURL:'https://postman-echo.com/',
  url:'/get',
  params:{
    "foo1": "bar1",
    "foo2": "bar2"
  }
});

const {data} = await instance.request();

console.log(data)