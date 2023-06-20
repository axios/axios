/**
 * Handles a POST request and sends a 200 response with a JSON content type.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export default function (req, res) {
  
  req.on('data', function (chunk) {
  });

  req.on('end', function () {
    console.log('POST  received');
    res.writeHead(200, {
      'Content-Type': 'text/json'
    });
    res.end();
  });
};
