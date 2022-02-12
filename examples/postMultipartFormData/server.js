'use strict';
module.exports = function(req, res) {
  req.on('end', function() {
    res.writeHead(200, {
      'Content-Type': 'text/json'
    });

    res.end();
  });
};
