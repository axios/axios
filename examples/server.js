// Dependencies.
var fs = require('fs');
var path = require('path');
var http = require('http');
var argv = require('minimist')(process.argv.slice(2));

// Declare variables for later usage.
var server;
var dirs;

// Get the list of sub-directories inside specified root directory.
function listDirs(root) {
  // Read root directory content.
  var files = fs.readdirSync(root);
  var dirs = [];

  // Go through all directory content and extract only the folders.
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

// Get main template for axios examples and embed the links to examples into it.
function getIndexTemplate(exampleDirs) {
  var exampleLinks = exampleDirs.map(function (exampleDir) {
    var url = '/' + exampleDir;
    return '<li onclick="document.location=\'' + url + '\'"><a href="' + url + '">' + url + '</a></li>';
  });

  // Read main template wrapper.
  var indexTemplate = fs.readFileSync(path.join(__dirname, './index.html')).toString();

  // Embed the links into the template wrapper.
  return indexTemplate.replace('{{example_links}}', exampleLinks.join(''));
}

// Send the response back to the requester.
function sendResponse(res, statusCode, body) {
  res.writeHead(statusCode);
  res.write(body);
  res.end();
}

// Respond with status 200.
function send200(res, body) {
  sendResponse(res, 200, body || '<h1>OK</h1>');
}

// Respond with status 404.
function send404(res, body) {
  sendResponse(res, 404, body || '<h1>Not Found</h1>');
}

// Respond with a file stream.
function pipeFileToResponse(res, file, type) {
  if (type) {
    res.writeHead(200, {
      'Content-Type': type
    });
  }
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}

// Get all sub-directories of the current directory.
// Let's treat each directory as a separate example.
dirs = listDirs(__dirname);

// Create the http server.
server = http.createServer(function (req, res) {
  var url = req.url;

  // Process axios itself.
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
    send200(res, getIndexTemplate(dirs));
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

// Launch the server and listen on port 3000.
server.listen(argv.p || 3000);
