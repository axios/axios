export default function (req, res) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const delay = parsedUrl.searchParams.get('delay') || 3000;

  setTimeout(() => {
    res.writeHead(200, {
      'Content-Type': 'text/json',
    });
    res.write(
      JSON.stringify({
        message: 'Response completed successfully after ' + delay + 'ms',
      })
    );
    res.end();
  }, delay);
}
