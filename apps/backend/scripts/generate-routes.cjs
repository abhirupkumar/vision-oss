const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(fullPath);
    }
  });
  return results;
}

const scriptsDir = __dirname;
const backendDir = path.join(scriptsDir, '..');
const srcDir = path.join(backendDir, 'src');
const apiDir = path.join(srcDir, 'api');

let files = walk(apiDir);

files.sort((a, b) => {
  let aRel = a.substring(apiDir.length).replace(/\\/g, '/').replace(/\/route\.(ts|js)$/, '');
  let bRel = b.substring(apiDir.length).replace(/\\/g, '/').replace(/\/route\.(ts|js)$/, '');
  if (aRel === '') aRel = '/';
  if (bRel === '') bRel = '/';
  
  const aSegs = aRel.split('/').filter(Boolean);
  const bSegs = bRel.split('/').filter(Boolean);
  
  const minLen = Math.min(aSegs.length, bSegs.length);
  for (let i = 0; i < minLen; i++) {
    if (aSegs[i] !== bSegs[i]) {
      const aDyn = aSegs[i].startsWith('[');
      const bDyn = bSegs[i].startsWith('[');
      if (aDyn && !bDyn) return 1;
      if (!aDyn && bDyn) return -1;
      return aSegs[i].localeCompare(bSegs[i]);
    }
  }
  return bSegs.length - aSegs.length;
});

let imports = '';
let publicRoutes = '';
let protectedRoutes = '';

// Known public routes prefixes
const publicPrefixes = [
  '/send', '/record', '/share', '/batch', '/config', 
  '/webhooks', '/heartbeat', '/flush-queue', 
  '/recorder.js', '/auth/verify', '/llm-proxy'
];

function toCamelCase(str) {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
}

files.forEach(file => {
  let relativePath = file.substring(apiDir.length).replace(/\\/g, '/');
  // strip /route.ts
  relativePath = relativePath.replace(/\/route\.(ts|js)$/, '');
  if (relativePath === '') relativePath = '/';
  
  // Create import variable name
  const segments = relativePath.split('/').filter(Boolean).map(s => {
    if (s.startsWith('[') && s.endsWith(']')) {
      return s.slice(1, -1);
    }
    return s;
  });
  let varName = segments.length ? segments.map(toCamelCase).join('_') : 'root';
  varName = varName.replace(/[^a-zA-Z0-9_]/g, '');
  varName = varName + 'Route';
  
  const importPath = './api' + file.substring(apiDir.length).replace(/\\/g, '/').replace(/\.ts$/, '.js');
  imports += `import ${varName} from '${importPath}';\n`;

  const routePath = relativePath.replace(/\[(.*?)\]/g, ':$1');
  const isPublic = publicPrefixes.some(prefix => relativePath.startsWith(prefix));
  
  if (isPublic) {
    publicRoutes += `app.route('${routePath}', ${varName});\n`;
  } else {
    // Protected
    protectedRoutes += `api.route('${routePath}', ${varName});\n`;
  }
});

const indexContent = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.
// Run \`pnpm routes:generate\` to update this file.

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { loggerMiddleware } from './middleware/logger.js';
import { requireAuth } from './middleware/clerk.js';

${imports}

const app = new Hono<{ Variables: { auth: any } }>();

app.onError((err, c) => {
  console.error('[Global Error]:', err);
  return c.text('Internal Server Error', 500);
});

// Global middleware
app.use('*', async (c, next) => {
  // Inject Cloudflare Worker bindings into process.env so our node-compatible code works
  if (c.env) {
    Object.assign(process.env, c.env);
  }
  await next();
});
app.use('*', loggerMiddleware);
app.use('*', corsMiddleware);

// Public routes
${publicRoutes}

const api = new Hono<{ Variables: { auth: any } }>();
api.use('*', requireAuth());

api.onError((err, c) => {
  console.error('[API Error]:', err);
  return c.text('Internal Server Error', 500);
});

// Protected routes
${protectedRoutes}

app.route('/', api);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
console.log(\`Server is running on port \${port}\`);

// Only run the node server if we are running natively in Node.js
// Cloudflare Workers should simply use the 'export default app'
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  import('@hono/node-server').then(({ serve }) => {
    serve({
      fetch: app.fetch,
      port
    });
  });
}

export default app;
`;

fs.writeFileSync(path.join(srcDir, 'index.ts'), indexContent);
console.log('Successfully generated src/index.ts with ' + files.length + ' routes mounted.');
