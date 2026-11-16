import { docs } from '@/.source';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const api = loader({
  baseUrl: '/api',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const guides = loader({
  baseUrl: '/guides',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const cloud = loader({
  baseUrl: '/cloud',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
