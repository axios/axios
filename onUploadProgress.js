// onUploadProgress event is not being fired - React Native #6015


console.log('Before axios.post is called'); // Check if this log statement is reached

const response = await axios.post(apiUrl, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
  },
  onUploadProgress: function ({ loaded, total, progress, bytes, estimated, rate, upload = true }) {
    let percentCompleted = (progress * 100).toFixed(0);
    console.log('percentCompleted', percentCompleted);
    uploadPercentCompleted.current = percentCompleted;
  },
  withCredentials: true,
});

console.log('After axios.post is called'); // Check if this log statement is reached
