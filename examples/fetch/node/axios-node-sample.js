
// in a normal environment, you'd do:
// `npm install axios`
// import axios from "axios";

// for temporary testing, before the feature is merged, you can do:
// `npm install axios@git+https://github.com/sgammon/axios.git --ignore-scripts`

import axios from "../../../dist/node/axios.cjs";

function doTest(cbk, err) {
    console.log('fetching...');
    axios.get("https://httpbin.org/json", {adapter: 'fetch'})
        .then(cbk, err);
}

doTest(function (response) {
    console.log("data from httpbin.org: ", response.data);
}, function (err) {
    console.error('error: ', err);
    throw err;
});
