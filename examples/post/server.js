export default function (req, res) {
  let data = '';

  req.on('data', function (chunk) {
    data += chunk;
  });

  req.on('end', function () {
    console.log('POST data received');
    res.writeHead(200, {
    'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(data));
    res.end();
  });
};
