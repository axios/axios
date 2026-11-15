// Formats a blog post date (YYYY-MM-DD, or the ISO timestamp VitePress turns
// frontmatter dates into) for display. Uses UTC so the day shown matches the
// frontmatter regardless of the reader's time zone.
export function formatPostDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
