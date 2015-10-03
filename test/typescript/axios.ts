/// <reference path="../../axios.d.ts" />

import axios = require('axios');

axios.get('/user?ID=12345')
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.head('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.delete('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.put('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

axios.patch('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response.data);
    console.log(response.status + 324);
    console.log(response.headers);
    console.log(response.config);
  })
  .catch(function (response) {
    console.log(response);
  });

axios({
  method: 'get',
  url: '/user/12345'
});

axios({
  method: 'get',
  url: '/user/12345',
  transformRequest: (data) => {
    return data.doSomething();
  }
});

axios({
  url: "hi",
  headers: {'X-Requested-With': 'XMLHttpRequest'},
  params: {
    ID: 12345
  },
  data: {
    firstName: 'Fred'
  },
  withCredentials: false, // default
  responseType: 'json', // default
  xsrfCookieName: 'XSRF-TOKEN', // default
  xsrfHeaderName: 'X-XSRF-TOKEN' // default
});

var instance = axios.createNew();

axios.createNew({
  transformRequest: (data) => {
    return data.doSomething();
  },
  transformResponse: (data) => {
    return data.doSomethingElse();
  },
  headers: {'X-Requested-With': 'XMLHttpRequest'},
  timeout: 1000,
  withCredentials: false, // default
  responseType: 'json', // default
  xsrfCookieName: 'XSRF-TOKEN', // default
  xsrfHeaderName: 'X-XSRF-TOKEN' // default
});

instance.request({
    method: 'get',
    url: '/user/12345'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

instance.get('/user?ID=12345')
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });

instance.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (response) {
    console.log(response);
  });
