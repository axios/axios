// Builds the blog sidebar from the posts in docs/blog/: an "All posts" link,
// then every published post, newest first. Drafts (`draft: true`) are left out.
//
// The sidebar is built when the config loads, so in `vitepress dev` a new
// post shows in the sidebar after a restart (the blog index updates live).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DefaultTheme } from 'vitepress';

const BLOG_DIR = fileURLToPath(new URL('../blog/', import.meta.url));

interface PostEntry {
  title: string;
  date: string;
  link: string;
}

export function blogSidebar(): DefaultTheme.SidebarItem[] {
  const posts: PostEntry[] = readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')
    .map((file) => {
      const frontmatter = readFrontmatter(readFileSync(BLOG_DIR + file, 'utf8'));
      if (frontmatter.draft === 'true') return null;
      return {
        title: frontmatter.title || file.replace(/\.md$/, ''),
        date: frontmatter.date || '',
        link: `/blog/${file.replace(/\.md$/, '')}`,
      };
    })
    .filter((post): post is PostEntry => post !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return [
    {
      text: 'Blog',
      items: [
        { text: 'All posts', link: '/blog/' },
        ...posts.map((post) => ({ text: post.title, link: post.link })),
      ],
    },
  ];
}

// Reads the simple `key: value` lines of a post's frontmatter. Only the
// sidebar fields are needed here; the pages themselves use VitePress's parser.
function readFrontmatter(source: string): Record<string, string> {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  const fields: Record<string, string> = {};
  if (!match) return fields;
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (field) fields[field[1]] = field[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return fields;
}
