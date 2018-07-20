module.exports = (req, res) => {
  var data = '';

  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    console.log('File uploaded');
    res.writeHead(200);
    res.end();
  });
};
