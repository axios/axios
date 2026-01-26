import url from 'url';

export default function (req, res) {
  const parsedUrl = url.parse(req.url, true);
  const delay = parsedUrl.query.delay || 3000;

  setTimeout(() => {
    res.writeHead(200, {
      'Content-Type': 'text/json'
    });
    res.write(JSON.stringify({
      message: 'Response completed successfully after ' + delay + 'ms'
    }));
    res.end();
  }, delay);
};
