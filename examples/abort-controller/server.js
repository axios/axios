export default function (req, res) {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid URL');
    return;
  }
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
