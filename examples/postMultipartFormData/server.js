module.exports = function (req, res) {
  
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
