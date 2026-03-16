const axios = require('../');

console.log('Axios loaded successfully in CommonJS environment');
console.log('Axios version:', axios.VERSION || 'unknown');

// Basic test to ensure it works
axios.get('https://httpbin.org/get')
  .then(response => {
    console.log('GET request successful');
    console.log('Status:', response.status);
  })
  .catch(error => {
    console.log('GET request failed, but axios loaded:', error.message);
  });