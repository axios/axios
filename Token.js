// X-XSRF-TOKEN header automatic generation for trusted hosts #6035



import axios from 'axios';
const axiosInstance = axios.create();

const trustedHosts = ['https://example.com', 'https://api.example.com'];
axiosInstance.interceptors.request.use((config) => {
  if (trustedHosts.some(host => config.url.startsWith(host))) {
    const xsrfToken = getCookie('XSRF-TOKEN'); 
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    }
  }
  return config;
});
axiosInstance.get('https://example.com/api/data')
  .then(response => {
    console.log('Response Data:', response.data);
    if (response.data && response.data.someCondition) {
      console.log('Additional processing:', response.data.someValue);
    } else {
      console.log('No further processing needed.');
    }
  })
  .catch(error => {
    if (error.response) {
      console.log('Server responded with status:', error.response.status);
      console.log('Response Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. The request was made, but there was no response.');
    } else {
      console.log('Error:', error.message);
    }
  });
