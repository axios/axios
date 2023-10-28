// it it possible to ignore options call? #6007



// Display a loading indicator or message while the request is in progress
showLoadingIndicator();

axios({
  timeout: 20000,
  method: 'POST', // Ensure 'POST' is in quotes
  url: 'sample.com',
  headers: {
    'Content-Type': 'application/json',
  },
  data: body,
})
  .then((response) => {
    // Handle the actual POST request response
    hideLoadingIndicator(); // Hide the loading indicator
    // Handle the response data
    return response.data;
  })
  .catch((error) => {
    // Handle errors, including failed POST requests
    hideLoadingIndicator(); // Hide the loading indicator in case of an error
    // Handle the error response
    throw error.response.data;
  });
