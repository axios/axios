import axios from 'axios';
window.axios = axios;
const result = document.querySelector('#result');
document.querySelector('#load').addEventListener('click', async () => {
  result.textContent = JSON.stringify((await axios.get('/echo', { params: { user: 42 } })).data);
});
document.querySelector('#upload').addEventListener('submit', async (event) => {
  event.preventDefault();
  result.textContent = JSON.stringify((await axios.post('/echo', new FormData(event.target))).data);
});
