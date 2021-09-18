const axios = require('../../index');
// 


(async function () {
    try {
        let resp = await axios({
            url: "https://jsonplaceholder.typicode.com/comments",
            params: {
                postId: 1
            },
            keepPathnameDecoded: true
        });
        console.log(resp.data ? 'ok': 'false');
        console.log('\n------------------\n')

        
        resp = await axios({
            url: "https://services.odata.org/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')",
            params: {
                ID: 12345
            },
            keepPathnameDecoded: true
        });
        console.log(resp.data ? 'ok': 'failure');
        console.log('\n------------------\n')

        resp = await axios({
            baseURL: "https://services.odata.org/",
            url: "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')",
            params: {
                ID: 12345
            },
            keepPathnameDecoded: true
        });
        console.log(resp.data ? 'ok': 'failure');
        console.log('\n------------------\n')
        
        resp = await axios({
            baseURL: "https://services.odata.org/",
            url: "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')",
            params: {
                ID: 12345
            },
            keepPathnameDecoded: false
        });
        console.log(resp.data ? 'ok': 'failure');
        console.log('\n------------------\n')
        
        resp = await axios({
            baseURL: "https://services.odata.org/",
            url: "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')?ID=12345",
            keepPathnameDecoded: true
        });
        console.log(resp.data ? 'ok': 'failure');
        console.log('\n------------------\n')
        
        resp = await axios({
            baseURL: "https://services.odata.org/",
            url: "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')?ID=12345",
            keepPathnameDecoded: false
        });
        console.log(resp.data ? 'ok': 'failure');
    }
    catch (err) {
        console.log(err)
    }
})().catch(err => {
    console.log(err)
});