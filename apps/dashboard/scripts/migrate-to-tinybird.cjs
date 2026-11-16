const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const sqlDir = path.join(process.cwd(), 'src', 'queries', 'sql');
const files = walkDir(sqlDir);
let updated = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("import clickhouse from '@/lib/clickhouse'")) continue;

  // Add tinybird import after clickhouse import
  content = content.replace(
    "import clickhouse from '@/lib/clickhouse';",
    "import clickhouse from '@/lib/clickhouse';\nimport tinybird from '@/lib/tinybird';",
  );

  // Replace: const { X } = clickhouse; -> const { X } = (tinybird.enabled ? tinybird : clickhouse);
  content = content.replace(
    /(\s*const \{[^}]+\} = )clickhouse(;)/g,
    '$1(tinybird.enabled ? tinybird : clickhouse)$2',
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated:', path.relative(process.cwd(), file));
  updated++;
}

console.log('\nTotal updated:', updated);
