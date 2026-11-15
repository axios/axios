// Loads every blog post in docs/blog/ for the blog index page.
//
// To add a post, create docs/blog/<slug>.md with this frontmatter:
//
//   ---
//   title: Post title
//   date: 2026-11-02
//   author: Your Name
//   description: One or two sentences shown on the blog index.
//   image: /blog/<slug>/cover.webp   (optional cover image)
//   imageAlt: What the cover image shows
//   ---
//
// Put a post's images in docs/public/blog/<slug>/ and reference them from
// the post body with an absolute path: ![Alt text](/blog/<slug>/diagram.png)
//
// The post header shows the title, date, author, and cover image, so start
// the post body with its first paragraph or an `##` heading, not a `#` title.
//
// Posts are listed newest first. Set `draft: true` to hide a post from the
// index while you work on it (the page itself still builds).
import { createContentLoader } from 'vitepress';

export interface BlogPost {
  title: string;
  url: string;
  date: string;
  author?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

declare const data: BlogPost[];
export { data };

export default createContentLoader('blog/*.md', {
  transform(pages) {
    return pages
      .filter((page) => !page.url.endsWith('/blog/') && !page.frontmatter.draft)
      .map((page) => ({
        title: page.frontmatter.title,
        url: page.url,
        date: normalizeDate(page.frontmatter.date),
        author: page.frontmatter.author,
        description: page.frontmatter.description,
        image: page.frontmatter.image,
        imageAlt: page.frontmatter.imageAlt,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value : '';
}
