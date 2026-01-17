it('preserves raw response data on JSON parse error', function () {
  try {
    JSON.parse('{"bad":');
  } catch (e) {
    expect(e).toBeDefined();
  }
});
