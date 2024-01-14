import axios from '../index';

const URL = 'http://127.0.0.1:3000/api';
const BODY = {
  foo: 'bar',
  baz: 1234
};


// GET

  axios.get(URL, {params:BODY})
  .then((data)=>{
    console.log(data);
  })
  .catch((error)=>{
    console.log(error);
  })


// POST

axios.post(URL, BODY)
  .then((data)=>{
    console.log(data);
  })
  .catch((error)=>{
    console.log(error);
  })
