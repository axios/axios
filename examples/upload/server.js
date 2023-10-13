/**
 * Handles a file upload request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @remarks This function listens for data chunks from the request and concatenates them into a string. Once the request has ended, it logs a message and sends a response with a status code of 200.
 */
export default function (req, res) {
  let data = '';

  req.on('data', function (chunk) {
    data += chunk;
  });

  req.on('end', function () {
    console.log('File uploaded');
    res.writeHead(200);
    res.end();
  });
};
