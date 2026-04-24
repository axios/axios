export default function (req, res) {
  let _data = '';

  req.on('data', function (chunk) {
    _data += chunk;
  });

  req.on('end', function () {
    console.log('File uploaded');
    res.writeHead(200);
    res.end();
  });
}
