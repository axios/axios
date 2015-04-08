var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');
var argv = require('minimist')(process.argv.slice(2));
var server;
var dirs;

function listDirs(root) {
  var files = fs.readdirSync(root);
  var dirs = [];

  for (var i=0, l=files.length; i<l; i++) {
    var file = files[i];
    if (file[0] !== '.') {
      var stat = fs.statSync(path.join(root, file));
      if (stat.isDirectory()) {
        dirs.push(file);
      }
    }
  }

  return dirs;
}

function getIndexTemplate() {
  var links = dirs.map(function (dir) {
    var url = '/' + dir;
    return '<li onclick="document.location=\'' + url + '\'"><a href="' + url + '">' + url + '</a></li>';
  });

  return (
    '<!doctype html>' +
    '<html>' +
    '<head>' +
    '<title>axios examples</title>' +
    '<style>' +
    'body {padding:25px;}' +
    'ul {margin:0; padding:0; list-style:none;}' +
    'li {padding:5px 10px;}' +
    'li:hover {background:#eee; cursor:pointer;}' +
    'a {text-decoration:none; color:#0080ff;}' +
    '</style>' +
    '<body>' +
    '<ul>' +
    links.join('') +
    '</ul>'
  );
}

function sendResponse(res, statusCode, body) {
  res.writeHead(statusCode);
  res.write(body);
  res.end();
}

function send200(res, body) {
  sendResponse(res, 200, body || '<h1>OK</h1>');
}

function send404(res, body) {
  sendResponse(res, 404, body || '<h1>Not Found</h1>');
}

function pipeFileToResponse(res, file, type) {
  if (type) {
    res.writeHead(200, {
      'Content-Type': type
    });
  }
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}


dirs = listDirs(__dirname);

server = http.createServer(function (req, res) {
  var url = req.url;

  // Process axios itself
  if (/axios\.min\.js$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.min.js', 'text/javascript');
    return;
  }
  if (/axios\.min\.map$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.min.map', 'text/javascript');
    return;
  }
  if (/axios\.amd\.min\.js$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.amd.min.js', 'text/javascript');
    return;
  }
  if (/axios\.amd\.min\.map$/.test(url)) {
    pipeFileToResponse(res, '../dist/axios.amd.min.map', 'text/javascript');
    return;
  }

  // Process /
  if (url === '/' || url === '/index.html') {
    send200(res, getIndexTemplate());
    return;
  }

  // Format request */ -> */index.html
  if (/\/$/.test(url)) {
    url += 'index.html';
  }
  
  // Format request /get -> /get/index.html
  var parts = url.split('/');
  if (dirs.indexOf(parts[parts.length - 1]) > -1) {
    url += '/index.html';
  }

  // Process index.html request
  if (/index\.html$/.test(url)) {
    if (fs.existsSync(path.join(__dirname, url))) {
      pipeFileToResponse(res, url, 'text/html');
    } else {
      send404(res);
    }
  }

  // Process server request
  else if (new RegExp('(' + dirs.join('|') + ')\/server').test(url)) {
    if (fs.existsSync(path.join(__dirname, url + '.js'))) {
      require(path.join(__dirname, url + '.js'))(req, res);
    } else {
      send404(res);
    }
  }
  else {
    send404(res);
  }
});

server.listen(argv.p || 3000);
