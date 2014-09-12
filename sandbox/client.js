var axios = require('../index');

var URL = 'http://127.0.0.1:3000/api';
var BODY = {
  foo: 'bar',
  baz: 1234
};

function handleSuccess(data) { console.log(data); }
function handleFailure(data) { console.log('error', data); }

// GET
axios.get(URL, { params: BODY })
  .then(handleSuccess)
  .catch(handleFailure);

// POST
axios.post(URL, BODY)
  .then(handleSuccess)
  .catch(handleFailure);