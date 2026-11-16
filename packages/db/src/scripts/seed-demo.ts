#!/usr/bin/env tsx
/**
 * seed-demo.ts
 *
 * Populates high-fidelity, correlated, and relatable demo analytics and business data
 * for "Wordcraft AI" (an AI writing assistant SaaS) into Tinybird and PostgreSQL.
 *
 * Architecture Principles:
 * - NO DUPLICATION: Telemetry, visitors, and events live exclusively in Tinybird.
 * - ZERO analytics/visitor/payment tables touched in PostgreSQL (strictly 21 relational config tables).
 * - Project name is strictly `demo-project`.
 *
 * Usage:
 *   pnpm --filter @vision/db seed:demo -- --org-id <ORG_ID> [--months 12] [--visitors 500] [--dry-run] [--reset]
 */

import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// 1. Environment & Configuration
// ---------------------------------------------------------------------------
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../tinybird/.env.local'),
  resolve(__dirname, '../../../tinybird/.env.local'),
];

for (const p of envPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p, override: false });
  }
}

let configBaseUrl = '';
const configPath = resolve(__dirname, '../../tinybird/tinybird.config.json');
if (existsSync(configPath)) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    configBaseUrl = config.baseUrl || '';
  } catch {
    // Ignore parse error
  }
}

const dbUrl = process.env.DATABASE_URL;
const tinybirdUrl = (process.env.TINYBIRD_URL || configBaseUrl || 'https://api.tinybird.co').replace(/\/$/, '');
const tinybirdToken = process.env.TINYBIRD_TOKEN;

// ---------------------------------------------------------------------------
// 2. CLI Argument Parsing
// ---------------------------------------------------------------------------
interface SeedOptions {
  orgId: string;
  months: number;
  visitorsCount: number;
  isDryRun: boolean;
  shouldReset: boolean;
}

function printHelp() {
  console.log(`
🌱 Wordcraft AI - Demo Project Seeder

Usage:
  pnpm --filter @vision/db seed:demo -- [options]

Options:
  --org-id <ID>       (Required) Target organization ID
  --months <N>        Number of months of past data to generate (default: 12)
  --visitors <N>      Number of unique visitors in the synthetic pool (default: 25000)
  --dry-run           Simulate generation & calculate row counts without writing to DBs
  --reset             Wipe existing demo-project data in Tinybird & PostgreSQL before seeding
  --help, -h          Show this help message
`);
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  let orgId = '';
  let months = 12;
  let visitorsCount = 25000;
  let isDryRun = false;
  let shouldReset = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--org-id' && i + 1 < args.length) {
      orgId = args[++i];
    } else if (arg.startsWith('--org-id=')) {
      orgId = arg.split('=')[1];
    } else if (arg === '--months' && i + 1 < args.length) {
      months = parseInt(args[++i], 10);
    } else if (arg.startsWith('--months=')) {
      months = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--visitors' && i + 1 < args.length) {
      visitorsCount = parseInt(args[++i], 10);
    } else if (arg.startsWith('--visitors=')) {
      visitorsCount = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--reset') {
      shouldReset = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!orgId) {
    if (isDryRun) {
      orgId = 'preview-demo-org';
    } else {
      console.error('❌ Error: --org-id <ORG_ID> is required.');
      printHelp();
      process.exit(1);
    }
  }

  if (isNaN(months) || months < 1) months = 12;
  if (isNaN(visitorsCount) || visitorsCount < 1) visitorsCount = 25000;

  return { orgId, months, visitorsCount, isDryRun, shouldReset };
}

// ---------------------------------------------------------------------------
// 3. Helper Utilities & Formatting
// ---------------------------------------------------------------------------
function getUTCString(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 23);
}

function randomChoice<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWeightedChoice<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const entry of items) {
    if (r <= entry.weight) return entry.item;
    r -= entry.weight;
  }
  return items[items.length - 1].item;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function md5(str: string): string {
  return createHash('md5').update(str).digest('hex');
}

// ---------------------------------------------------------------------------
// 4. Tinybird Batch Ingestion Client
// ---------------------------------------------------------------------------
async function uploadToTinybird(table: string, rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;

  const BATCH_SIZE = 1000;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const ndjson = batch.map((r) => JSON.stringify(r)).join('\n');

    const res = await fetch(`${tinybirdUrl}/v0/events?name=${encodeURIComponent(table)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tinybirdToken}`,
      },
      body: ndjson,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tinybird insert failed for "${table}" (${res.status}): ${errText}`);
    }
  }
}

async function deleteFromTinybird(table: string, condition: string): Promise<void> {
  const res = await fetch(
    `${tinybirdUrl}/v0/datasources/${encodeURIComponent(table)}/rows?delete_condition=${encodeURIComponent(condition)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tinybirdToken}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    console.warn(`Tinybird cleanup warning for ${table}: ${errText}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Data Domains & Archetypes (Wordcraft AI SaaS)
// ---------------------------------------------------------------------------
interface GeoLocation {
  country: string;
  region: string;
  city: string;
  language: string;
  tzOffsetHours: number;
}

const GEOGRAPHIES: { item: GeoLocation; weight: number }[] = [
  { item: { country: 'US', region: 'US-CA', city: 'San Francisco', language: 'en-US', tzOffsetHours: -8 }, weight: 22 },
  { item: { country: 'US', region: 'US-NY', city: 'New York', language: 'en-US', tzOffsetHours: -5 }, weight: 15 },
  { item: { country: 'US', region: 'US-TX', city: 'Austin', language: 'en-US', tzOffsetHours: -6 }, weight: 8 },
  { item: { country: 'GB', region: 'GB-ENG', city: 'London', language: 'en-GB', tzOffsetHours: 0 }, weight: 12 },
  { item: { country: 'DE', region: 'DE-BY', city: 'Munich', language: 'de-DE', tzOffsetHours: 1 }, weight: 5 },
  { item: { country: 'DE', region: 'DE-BE', city: 'Berlin', language: 'de-DE', tzOffsetHours: 1 }, weight: 4 },
  { item: { country: 'IN', region: 'IN-KA', city: 'Bengaluru', language: 'en-IN', tzOffsetHours: 5.5 }, weight: 7 },
  { item: { country: 'IN', region: 'IN-MH', city: 'Mumbai', language: 'en-IN', tzOffsetHours: 5.5 }, weight: 3 },
  { item: { country: 'AU', region: 'AU-NSW', city: 'Sydney', language: 'en-AU', tzOffsetHours: 10 }, weight: 5 },
  { item: { country: 'CA', region: 'CA-ON', city: 'Toronto', language: 'en-CA', tzOffsetHours: -5 }, weight: 5 },
  { item: { country: 'FR', region: 'FR-IDF', city: 'Paris', language: 'fr-FR', tzOffsetHours: 1 }, weight: 4 },
  { item: { country: 'JP', region: 'JP-13', city: 'Tokyo', language: 'ja-JP', tzOffsetHours: 9 }, weight: 4 },
  { item: { country: 'NL', region: 'NL-NH', city: 'Amsterdam', language: 'nl-NL', tzOffsetHours: 1 }, weight: 3 },
  { item: { country: 'BR', region: 'BR-SP', city: 'Sao Paulo', language: 'pt-BR', tzOffsetHours: -3 }, weight: 3 },
];

const PLATFORMS = [
  { item: { os: 'macOS', browser: 'Chrome', device: 'desktop', screen: '1920x1080' }, weight: 35 },
  { item: { os: 'macOS', browser: 'Safari', device: 'desktop', screen: '1440x900' }, weight: 20 },
  { item: { os: 'Windows', browser: 'Chrome', device: 'desktop', screen: '1920x1080' }, weight: 25 },
  { item: { os: 'Windows', browser: 'Edge', device: 'desktop', screen: '1920x1080' }, weight: 10 },
  { item: { os: 'Linux', browser: 'Chrome', device: 'desktop', screen: '2560x1440' }, weight: 5 },
  { item: { os: 'iOS', browser: 'Mobile Safari', device: 'mobile', screen: '390x844' }, weight: 3 },
  { item: { os: 'Android', browser: 'Chrome', device: 'mobile', screen: '412x915' }, weight: 2 },
];

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carlos', 'Elena', 'David', 'Priya', 'Michael', 'Sarah',
  'Liam', 'Emma', 'Alexander', 'Sophia', 'James', 'Olivia', 'Marcus', 'Chloe',
  'Daniel', 'Fatima', 'Lucas', 'Mia', 'Benjamin', 'Amara', 'Noah', 'Zoe',
  'Ethan', 'Hannah', 'Gabriel', 'Nora', 'Julian', 'Grace'
];

const LAST_NAMES = [
  'Johnson', 'Smith', 'Rodriguez', 'Rostova', 'Kim', 'Patel', 'Chang', 'Connor',
  'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Lewis'
];

const COMPANIES = [
  { name: 'Acme Corp', domain: 'acmeworks.com' },
  { name: 'TechNova Solutions', domain: 'technova.io' },
  { name: 'Horizon Media', domain: 'horizonmedia.co' },
  { name: 'Peak Labs', domain: 'peaklabs.ai' },
  { name: 'Linearity Inc', domain: 'linearity.tech' },
  { name: 'Supra Systems', domain: 'suprasys.net' },
  { name: 'Starlight Ventures', domain: 'starlight.co' },
  { name: 'CloudScale', domain: 'cloudscale.dev' },
  { name: 'Vanguard Digital', domain: 'vanguarddigital.org' },
  { name: 'Apex Logistics', domain: 'apexlogistics.io' },
];

const ROLES = [
  'Product Manager', 'Content Lead', 'Copywriter', 'Founder & CEO',
  'Marketing Director', 'Staff Engineer', 'Technical Writer', 'Growth Marketer',
  'Head of Comms', 'UX Researcher'
];

const LLM_MODELS = [
  { model: 'gpt-4o', provider: 'openai', promptPricePerM: 2.50, compPricePerM: 10.00, weight: 45 },
  { model: 'claude-3-5-sonnet-20241022', provider: 'anthropic', promptPricePerM: 3.00, compPricePerM: 15.00, weight: 35 },
  { model: 'gemini-1.5-pro', provider: 'google', promptPricePerM: 1.25, compPricePerM: 5.00, weight: 12 },
  { model: 'gpt-4o-mini', provider: 'openai', promptPricePerM: 0.15, compPricePerM: 0.60, weight: 8 },
];

const LLM_TEMPLATES = [
  'summarize-v2', 'rewrite-tone', 'grammar-fix',
  'generate-outline', 'expand-paragraph', 'translate'
];

const ERROR_CATALOG = [
  {
    type: 'TypeError',
    message: "Cannot read properties of null (reading 'innerHTML')",
    filename: '/static/chunks/editor-core.js',
    lineno: 412,
    colno: 27,
    level: 'error',
    stack: "TypeError: Cannot read properties of null (reading 'innerHTML')\n    at WordEditor.render (webpack-internal:///./src/components/WordEditor.tsx:412:27)\n    at commitMutationEffectsOnFiber (webpack-internal:///./node_modules/react-dom/cjs/react-dom.production.min.js:312:14)",
  },
  {
    type: 'TypeError',
    message: 'fetch is not a function',
    filename: '/static/chunks/api-client.js',
    lineno: 88,
    colno: 14,
    level: 'error',
    stack: 'TypeError: fetch is not a function\n    at ApiClient.execute (webpack-internal:///./src/lib/api-client.ts:88:14)\n    at async generateCompletion (webpack-internal:///./src/hooks/useAI.ts:45:9)',
  },
  {
    type: 'ReferenceError',
    message: 'regeneratorRuntime is not defined',
    filename: '/static/chunks/polyfill.js',
    lineno: 15,
    colno: 8,
    level: 'error',
    stack: 'ReferenceError: regeneratorRuntime is not defined\n    at webpack-internal:///./src/polyfills/async-iterator.js:15:8\n    at Object.eval (webpack-internal:///./src/index.tsx:3:1)',
  },
  {
    type: 'ChunkLoadError',
    message: 'Loading chunk 12 failed (missing: /_next/static/chunks/12.js)',
    filename: '/static/chunks/app-bundle.js',
    lineno: 1024,
    colno: 5,
    level: 'warning',
    stack: 'ChunkLoadError: Loading chunk 12 failed.\n    at Function.requireEnsure [as e] (webpack-internal:///./src/bootstrap.ts:1024:5)\n    at dynamicImport (webpack-internal:///./src/routes.tsx:32:11)',
  },
  {
    type: 'UnhandledRejection',
    message: 'Network request timed out: upstream LLM gateway',
    filename: '/static/chunks/network.js',
    lineno: 64,
    colno: 19,
    level: 'error',
    stack: 'UnhandledRejection: Network request timed out: upstream LLM gateway\n    at Timeout._onTimeout (webpack-internal:///./src/lib/network.ts:64:19)\n    at listOnTimeout (node:internal/timers:559:17)',
  },
  {
    type: 'SyntaxError',
    message: 'Unexpected token < in JSON at position 0',
    filename: '/static/chunks/parser.js',
    lineno: 182,
    colno: 31,
    level: 'warning',
    stack: 'SyntaxError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at parseAiResponse (webpack-internal:///./src/lib/parser.ts:182:31)',
  },
  {
    type: 'TypeError',
    message: 'Cannot destructure property of undefined (reading userPlan)',
    filename: '/static/chunks/user-profile.js',
    lineno: 53,
    colno: 12,
    level: 'error',
    stack: 'TypeError: Cannot destructure property of undefined (reading userPlan)\n    at BillingBadge (webpack-internal:///./src/components/BillingBadge.tsx:53:12)\n    at renderWithHooks (webpack-internal:///./node_modules/react-dom/cjs/react-dom.production.min.js:154:398)',
  },
  {
    type: 'Error',
    message: 'Maximum update depth exceeded in editor autosave watcher',
    filename: '/static/chunks/react-dom.js',
    lineno: 2891,
    colno: 44,
    level: 'fatal',
    stack: 'Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside useEffect.\n    at checkForNestedUpdates (webpack-internal:///./node_modules/react-dom/cjs/react-dom.production.min.js:2891:44)',
  },
];

// Precompute error fingerprints
const ERROR_CATALOG_WITH_FP = ERROR_CATALOG.map((err) => ({
  ...err,
  fingerprint: md5(`${err.type}:${err.message}:${err.filename}`),
}));

// ---------------------------------------------------------------------------
// 6. Synthetic In-Memory Visitor Model
// ---------------------------------------------------------------------------
interface SyntheticVisitor {
  visitorId: string;
  distinctId: string;
  isIdentified: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  role?: string;
  plan: 'free' | 'trial' | 'pro' | 'team';
  mrrCents: number;
  signupSource: string;
  firstSeenAt: Date;
  geo: GeoLocation;
  platform: { os: string; browser: string; device: string; screen: string };
  sessions: {
    sessionId: string;
    startedAt: Date;
    durationMs: number;
  }[];
}

function generateVisitorPool(
  visitorsCount: number,
  months: number,
  now: Date
): SyntheticVisitor[] {
  const visitors: SyntheticVisitor[] = [];
  const totalDays = months * 30;
  const startTimeMs = now.getTime() - totalDays * 24 * 60 * 60 * 1000;
  const coreCount = Math.min(180, Math.max(40, Math.round(visitorsCount * 0.007)));

  for (let i = 0; i < coreCount; i++) {
    const visitorId = randomUUID();
    const isIdentified = Math.random() < 0.85; // 85% identified in core pool
    const geo = randomWeightedChoice(GEOGRAPHIES);
    const platform = randomWeightedChoice(PLATFORMS);

    // SaaS growth curve: newer visitors appear with accelerating probability
    // Power factor 1.5 weights new visitor arrivals closer to the present
    const progressFactor = Math.pow(Math.random(), 1.5);
    const firstSeenDaysOffset = totalDays * (1 - progressFactor);
    const firstSeenMs = startTimeMs + (totalDays - firstSeenDaysOffset) * 24 * 60 * 60 * 1000;
    const firstSeenAt = new Date(Math.min(now.getTime() - 60000, Math.max(startTimeMs, firstSeenMs)));

    let distinctId = '';
    let firstName: string | undefined;
    let lastName: string | undefined;
    let email: string | undefined;
    let company: string | undefined;
    let role: string | undefined;
    let plan: 'free' | 'trial' | 'pro' | 'team' = 'free';
    let mrrCents = 0;
    const signupSource = randomChoice(['google', 'github', 'direct', 'producthunt', 'linkedin']);

    if (isIdentified) {
      firstName = randomChoice(FIRST_NAMES);
      lastName = randomChoice(LAST_NAMES);
      const comp = randomChoice(COMPANIES);
      company = comp.name;
      role = randomChoice(ROLES);
      distinctId = `usr_${firstName.toLowerCase()}_${randomInt(100, 999)}`;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${comp.domain}`;

      // Plan weighting for core identified users:
      // ~6% team ($79/mo), ~18% pro ($29/mo), ~44% trial ($0), ~32% free ($0)
      // Ensures total revenue (~$14k-$18k) is healthy and strictly less than visitors (25k)
      const planRoll = Math.random();
      if (planRoll < 0.06) {
        plan = 'team';
        mrrCents = 7900;
      } else if (planRoll < 0.24) {
        plan = 'pro';
        mrrCents = 2900;
      } else if (planRoll < 0.68) {
        plan = 'trial';
        mrrCents = 0;
      } else {
        plan = 'free';
        mrrCents = 0;
      }
    }

    // Generate sessions (identified users have higher retention: 4-14 sessions; anonymous: 1-3 sessions)
    const sessionCount = isIdentified ? randomInt(4, 14) : randomInt(1, 3);
    const sessions: SyntheticVisitor['sessions'] = [];

    let currentSessionTime = new Date(firstSeenAt.getTime());
    for (let s = 0; s < sessionCount; s++) {
      if (currentSessionTime.getTime() > now.getTime()) break;

      const durationMs = randomInt(45, 1200) * 1000;
      sessions.push({
        sessionId: randomUUID(),
        startedAt: new Date(currentSessionTime.getTime()),
        durationMs,
      });

      // Space next session realistically (retention curve: days to weeks later)
      const daysUntilNext = randomFloat(0.5, 14);
      currentSessionTime = new Date(currentSessionTime.getTime() + daysUntilNext * 24 * 60 * 60 * 1000);
    }

    visitors.push({
      visitorId,
      distinctId,
      isIdentified,
      firstName,
      lastName,
      email,
      company,
      role,
      plan,
      mrrCents,
      signupSource,
      firstSeenAt,
      geo,
      platform,
      sessions,
    });
  }

  return visitors;
}

// ---------------------------------------------------------------------------
// 7. Main Execution Pipeline
// ---------------------------------------------------------------------------
async function main() {
  const options = parseArgs();
  const { orgId, months, visitorsCount, isDryRun, shouldReset } = options;

  console.log('\n================================================================');
  console.log('   🌱 Wordcraft AI - Demo Project Seeder (demo-project)         ');
  console.log('================================================================');
  console.log(`Target Org ID      : ${orgId}`);
  console.log(`History Window     : ${months} month(s)`);
  console.log(`Synthetic Visitors : ${visitorsCount}`);
  console.log(`Execution Mode     : ${isDryRun ? '🔍 [DRY RUN - No writes]' : '🚀 LIVE WRITE'}`);
  console.log(`Reset Previous     : ${shouldReset ? '⚠️ YES (Clean wipe)' : 'NO (Additive)'}`);
  console.log(`Tinybird Endpoint  : ${tinybirdUrl}`);
  console.log('================================================================\n');

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is missing. Please check .env');
    process.exit(1);
  }

  if (!tinybirdToken) {
    console.error('❌ TINYBIRD_TOKEN is missing. Please check .env');
    process.exit(1);
  }

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const sql = postgres(dbUrl, {
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    connect_timeout: 15,
  });

  const now = new Date();
  const summary = {
    organization: 0,
    user: 0,
    member: 0,
    project: 0,
    client: 0,
    payment_connection: 0,
    ab_test: 0,
    ab_test_variant: 0,
    ab_test_session: 0,
    error_group: 0,
    tinybird_visitor_data: 0,
    tinybird_project_event: 0,
    tinybird_event_data: 0,
    tinybird_llm_events: 0,
    tinybird_project_revenue: 0,
    tinybird_project_error: 0,
  };

  try {
    // -----------------------------------------------------------------------
    // Connectivity Check
    // -----------------------------------------------------------------------
    process.stdout.write('🔌 Testing PostgreSQL & Tinybird connectivity... ');
    await sql`SELECT 1 as ping;`;
    const tbPingRes = await fetch(`${tinybirdUrl}/v0/pipes`, {
      headers: { Authorization: `Bearer ${tinybirdToken}` },
    });
    if (!tbPingRes.ok) {
      throw new Error(`Tinybird ping failed with status ${tbPingRes.status}`);
    }
    console.log('✅ Connected!');

    // -----------------------------------------------------------------------
    // Reset Logic (if --reset specified)
    // -----------------------------------------------------------------------
    let targetProjectId = '';
    const [existingProj] = await sql<[{ project_id: string }?]>`
      SELECT project_id FROM project 
      WHERE organization_id = ${orgId} AND name = 'demo-project'
      LIMIT 1;
    `;

    if (existingProj) {
      targetProjectId = existingProj.project_id;
    }

    if (shouldReset && targetProjectId) {
      console.log(`\n⚠️  Resetting existing demo-project data (${targetProjectId})...`);
      if (!isDryRun) {
        // Tinybird deletions
        await Promise.all([
          deleteFromTinybird('project_event', `project_id = '${targetProjectId}'`),
          deleteFromTinybird('event_data', `project_id = '${targetProjectId}'`),
          deleteFromTinybird('visitor_data', `project_id = '${targetProjectId}'`),
          deleteFromTinybird('llm_events', `project_id = '${targetProjectId}'`),
          deleteFromTinybird('project_revenue', `project_id = '${targetProjectId}'`),
          deleteFromTinybird('project_error', `project_id = '${targetProjectId}'`),
        ]);

        // PostgreSQL deletions
        await sql`DELETE FROM ab_test_session WHERE test_id IN (SELECT id FROM ab_test WHERE project_id = ${targetProjectId});`;
        await sql`DELETE FROM ab_test_variant WHERE test_id IN (SELECT id FROM ab_test WHERE project_id = ${targetProjectId});`;
        await sql`DELETE FROM ab_test WHERE project_id = ${targetProjectId};`;
        await sql`DELETE FROM error_group WHERE project_id = ${targetProjectId};`;
        await sql`DELETE FROM payment_connection WHERE project_id = ${targetProjectId};`;
        await sql`DELETE FROM client WHERE project_id = ${targetProjectId};`;
        await sql`DELETE FROM project WHERE project_id = ${targetProjectId};`;
      }
      console.log('✅ Previous demo-project state cleared.');
      targetProjectId = '';
    }

    // -----------------------------------------------------------------------
    // Phase 0: Bootstrap PostgreSQL Relational State
    // -----------------------------------------------------------------------
    console.log('\n📦 Phase 0: Bootstrapping PostgreSQL relational config...');

    // 0.1 Organization
    const [existingOrg] = await sql<[{ organization_id: string }?]>`
      SELECT organization_id FROM organization WHERE organization_id = ${orgId} LIMIT 1;
    `;
    if (!existingOrg) {
      if (!isDryRun) {
        await sql`
          INSERT INTO organization (organization_id, name)
          VALUES (${orgId}, 'Demo Organization')
          ON CONFLICT (organization_id) DO NOTHING;
        `;
      }
      summary.organization = 1;
      console.log(`   + Created organization "${orgId}"`);
    } else {
      console.log(`   ✓ Organization "${orgId}" already exists`);
    }

    // 0.2 Demo Admin User
    const demoUserId = 'user_demo_admin';
    const demoClerkId = 'user_clerk_demo_admin';
    const demoEmail = 'demo-admin@wordcraft.ai';
    if (!isDryRun) {
      await sql`
        INSERT INTO "user" (user_id, clerk_id, email, role, display_name)
        VALUES (${demoUserId}, ${demoClerkId}, ${demoEmail}, 'admin', 'Demo Admin')
        ON CONFLICT (email) DO UPDATE SET display_name = 'Demo Admin';
      `;
    }
    summary.user = 1;

    // 0.3 Member
    if (!isDryRun) {
      await sql`
        INSERT INTO member (member_id, organization_id, user_id, role)
        VALUES (${randomUUID()}, ${orgId}, ${demoUserId}, 'admin')
        ON CONFLICT DO NOTHING;
      `;
    }
    summary.member = 1;

    // 0.4 Project (strictly 'demo-project')
    if (!targetProjectId) {
      targetProjectId = randomUUID();
      if (!isDryRun) {
        await sql`
          INSERT INTO project (
            project_id, name, domain, user_id, organization_id, 
            created_by, replay_enabled, autocapture_enabled
          )
          VALUES (
            ${targetProjectId}, 'demo-project', 'app.wordcraft.ai', ${demoUserId}, ${orgId},
            ${demoUserId}, false, true
          );
        `;
      }
      summary.project = 1;
      console.log(`   + Created project "demo-project" (${targetProjectId})`);
    } else {
      console.log(`   ✓ Using existing project "demo-project" (${targetProjectId})`);
    }

    // 0.5 Client (Write API client)
    const clientId = randomUUID();
    if (!isDryRun) {
      await sql`
        INSERT INTO client (
          id, name, type, project_id, organization_id, "ignoreCorsAndSecret", updated_at
        )
        VALUES (
          ${clientId}, 'Default Web Client', 'write', ${targetProjectId}, ${orgId}, true, ${now}
        )
        ON CONFLICT DO NOTHING;
      `;
    }
    summary.client = 1;

    // 0.6 Payment Connection (Stripe)
    const paymentConnectionId = randomUUID();
    if (!isDryRun) {
      await sql`
        INSERT INTO payment_connection (
          id, project_id, provider, status, config, notify_enabled, updated_at
        )
        VALUES (
          ${paymentConnectionId}, ${targetProjectId}, 'stripe', 'active', '{}'::jsonb, false, ${now}
        )
        ON CONFLICT (project_id, provider) DO NOTHING;
      `;
    }
    summary.payment_connection = 1;

    // 0.7 A/B Tests & Variants
    interface ABTestDef {
      name: string;
      description: string;
      goalEventName: string;
      status: 'running' | 'stopped';
      variants: { name: string; weight: number }[];
    }

    const testDefs: ABTestDef[] = [
      {
        name: 'Pricing Page Redesign',
        description: 'Testing annual discount highlighting vs standard cards',
        goalEventName: 'upgrade_clicked',
        status: 'running',
        variants: [
          { name: 'Control', weight: 50 },
          { name: 'Variant A', weight: 50 },
        ],
      },
      {
        name: 'CTA Button Copy',
        description: 'Hero CTA conversion test: Start Free vs Try Free vs Get Started',
        goalEventName: 'signup',
        status: 'stopped',
        variants: [
          { name: 'Start Free', weight: 33 },
          { name: 'Try Free', weight: 33 },
          { name: 'Get Started', weight: 34 },
        ],
      },
      {
        name: 'Onboarding Flow',
        description: 'Compact 2-step onboarding vs comprehensive 5-step tour',
        goalEventName: 'document_created',
        status: 'running',
        variants: [
          { name: 'Short', weight: 50 },
          { name: 'Long', weight: 50 },
        ],
      },
    ];

    const createdTests: { id: string; name: string; goalEventName: string; variants: { id: string; name: string; weight: number }[] }[] = [];

    for (const td of testDefs) {
      const testId = randomUUID();
      const variantRecords: { id: string; name: string; weight: number }[] = [];

      if (!isDryRun) {
        await sql`
          INSERT INTO ab_test (id, project_id, name, description, goal_event_name, status, updated_at)
          VALUES (${testId}, ${targetProjectId}, ${td.name}, ${td.description}, ${td.goalEventName}, ${td.status}, ${now});
        `;

        for (const v of td.variants) {
          const varId = randomUUID();
          await sql`
            INSERT INTO ab_test_variant (id, test_id, name, weight)
            VALUES (${varId}, ${testId}, ${v.name}, ${v.weight});
          `;
          variantRecords.push({ id: varId, name: v.name, weight: v.weight });
        }
      } else {
        for (const v of td.variants) {
          variantRecords.push({ id: randomUUID(), name: v.name, weight: v.weight });
        }
      }

      summary.ab_test++;
      summary.ab_test_variant += td.variants.length;
      createdTests.push({ id: testId, name: td.name, goalEventName: td.goalEventName, variants: variantRecords });
    }
    console.log(`   ✓ Created 3 A/B test experiments with variants`);

    // -----------------------------------------------------------------------
    // Phase 1: In-Memory Visitor Pool Generation
    // -----------------------------------------------------------------------
    console.log(`\n👥 Phase 1: Synthesizing ${visitorsCount} visitor profiles across ${months} months...`);
    const visitors = generateVisitorPool(visitorsCount, months, now);
    const identifiedVisitors = visitors.filter((v) => v.isIdentified);
    const totalSessions = visitors.reduce((acc, v) => acc + v.sessions.length, 0);
    console.log(`   ✓ Generated ${visitors.length} visitors (${identifiedVisitors.length} identified, ${totalSessions} sessions)`);

    // -----------------------------------------------------------------------
    // Phase 2: Visitor Traits (Tinybird: visitor_data)
    // -----------------------------------------------------------------------
    console.log('\n🏷️  Phase 2: Generating visitor traits for Tinybird visitor_data...');
    const visitorDataRows: Record<string, unknown>[] = [];

    for (const v of identifiedVisitors) {
      const createdAtStr = getUTCString(v.firstSeenAt);
      const pushTrait = (key: string, type: number, strVal: string, numVal: number | null = null) => {
        visitorDataRows.push({
          project_id: targetProjectId,
          visitor_id: v.visitorId,
          distinct_id: v.distinctId,
          data_key: key,
          data_type: type,
          string_value: strVal,
          number_value: numVal,
          date_value: null,
          created_at: createdAtStr,
        });
      };

      if (v.firstName) pushTrait('first_name', 0, v.firstName);
      if (v.lastName) pushTrait('last_name', 0, v.lastName);
      if (v.email) pushTrait('email', 0, v.email);
      if (v.company) pushTrait('company', 0, v.company);
      if (v.role) pushTrait('role', 0, v.role);
      pushTrait('plan', 0, v.plan);
      pushTrait('mrr_cents', 1, String(v.mrrCents), v.mrrCents);
      pushTrait('signup_source', 0, v.signupSource);
    }

    summary.tinybird_visitor_data = visitorDataRows.length;
    console.log(`   ✓ Prepared ${visitorDataRows.length} trait records`);
    if (!isDryRun) {
      process.stdout.write(`   ⏳ Uploading to Tinybird visitor_data... `);
      await uploadToTinybird('visitor_data', visitorDataRows);
      console.log('Done!');
    }

    // -----------------------------------------------------------------------
    // Phase 3 & 4: Sessions, Pageviews, Custom Events, Autocapture, Event Data
    // -----------------------------------------------------------------------
    console.log('\n📊 Phase 3 & 4: Generating telemetry, funnels & Web Vitals...');

    const projectEventRows: Record<string, unknown>[] = [];
    const eventDataRows: Record<string, unknown>[] = [];
    const llmEventRows: Record<string, unknown>[] = [];
    const revenueRows: Record<string, unknown>[] = [];
    const errorRows: Record<string, unknown>[] = [];
    const abTestSessions: { testId: string; variantId: string; sessionId: string; converted: boolean; convertedAt: Date | null }[] = [];

    // Helper: Deploy dates (5th, 18th, 26th of each month) to simulate release spikes
    const isDeployWindow = (d: Date): boolean => {
      const day = d.getUTCDate();
      return (day >= 5 && day <= 6) || (day >= 18 && day <= 19) || (day >= 26 && day <= 27);
    };

    for (const visitor of visitors) {
      for (let sIdx = 0; sIdx < visitor.sessions.length; sIdx++) {
        const session = visitor.sessions[sIdx];
        let eventTime = new Date(session.startedAt.getTime());
        const isFirstSession = sIdx === 0;

        // Realistic UTM acquisition context on first session
        let utmSource = '';
        let utmMedium = '';
        let utmCampaign = '';
        let referrerDomain = '';
        if (isFirstSession && Math.random() < 0.45) {
          utmSource = randomChoice(['google', 'twitter', 'linkedin', 'producthunt', 'newsletter']);
          utmMedium = randomChoice(['cpc', 'social', 'referral', 'email']);
          utmCampaign = randomChoice(['q2_growth', 'ai_writers_summit', 'product_hunt_launch', 'content_seo']);
          referrerDomain = `${utmSource}.com`;
        }

        // Web Vitals calculation (with spike degradation on deploy dates)
        const deploySpike = isDeployWindow(eventTime);
        const lcp = deploySpike ? randomFloat(2800, 5200, 1) : randomFloat(1100, 2200, 1);
        const inp = deploySpike ? randomFloat(180, 320, 1) : randomFloat(35, 110, 1);
        const cls = deploySpike ? randomFloat(0.12, 0.30, 3) : randomFloat(0.01, 0.07, 3);
        const fcp = deploySpike ? randomFloat(1400, 2800, 1) : randomFloat(650, 1300, 1);
        const ttfb = deploySpike ? randomFloat(250, 650, 1) : randomFloat(90, 220, 1);

        const pushEvent = (
          eventType: number,
          urlPath: string,
          pageTitle: string,
          eventName: string | null = null,
          tag: string | null = null
        ): string => {
          const eventId = randomUUID();
          projectEventRows.push({
            project_id: targetProjectId,
            visitor_id: visitor.visitorId,
            session_id: session.sessionId,
            event_id: eventId,
            hostname: 'app.wordcraft.ai',
            url_path: urlPath,
            url_query: '',
            referrer_path: '',
            referrer_query: '',
            referrer_domain: referrerDomain,
            page_title: pageTitle,
            event_type: eventType,
            event_name: eventName || '',
            tag: tag || '',
            browser: visitor.platform.browser,
            os: visitor.platform.os,
            device: visitor.platform.device,
            screen: visitor.platform.screen,
            language: visitor.geo.language,
            country: visitor.geo.country,
            region: visitor.geo.region,
            city: visitor.geo.city,
            distinct_id: visitor.distinctId,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: '',
            utm_term: '',
            gclid: '',
            fbclid: '',
            msclkid: '',
            ttclid: '',
            li_fat_id: '',
            twclid: '',
            lcp: eventType === 1 ? lcp : null,
            inp: eventType === 1 ? inp : null,
            cls: eventType === 1 ? cls : null,
            fcp: eventType === 1 ? fcp : null,
            ttfb: eventType === 1 ? ttfb : null,
            latitude: null,
            longitude: null,
            created_at: getUTCString(eventTime),
          });
          // Increment event time by 15-90 seconds
          eventTime = new Date(eventTime.getTime() + randomInt(15, 90) * 1000);
          return eventId;
        };

        const pushEventProperty = (
          eventId: string,
          urlPath: string,
          eventName: string,
          key: string,
          type: number,
          strVal: string,
          numVal: number | null = null
        ) => {
          eventDataRows.push({
            project_id: targetProjectId,
            session_id: session.sessionId,
            event_id: eventId,
            url_path: urlPath,
            event_name: eventName,
            data_key: key,
            data_type: type,
            string_value: strVal,
            number_value: numVal,
            date_value: null,
            created_at: getUTCString(eventTime),
          });
        };

        // --- Step 1: Landing Page ---
        pushEvent(1, '/', 'Wordcraft AI - The AI Writing Assistant for Modern Teams');
        pushEvent(3, '/', '', null, 'cta-hero');

        // A/B Test 2 Assignment: CTA Button Copy (triggered on Landing)
        const ctaTest = createdTests.find((t) => t.name === 'CTA Button Copy');
        let signedUpInSession = false;
        let signupEventTime: Date | null = null;

        // --- Step 2: Pricing Navigation ---
        let visitedPricing = false;
        if (Math.random() < 0.55) {
          visitedPricing = true;
          pushEvent(1, '/pricing', 'Pricing & Plans - Wordcraft AI');
          pushEvent(3, '/pricing', '', null, 'pricing-plan-pro');
        }

        // --- Step 3: Signup & Onboarding ---
        if (visitor.isIdentified && isFirstSession) {
          signedUpInSession = true;
          signupEventTime = new Date(eventTime.getTime());
          const signupId = pushEvent(2, '/pricing', 'Pricing & Plans - Wordcraft AI', 'signup');
          pushEventProperty(signupId, '/pricing', 'signup', 'method', 0, visitor.signupSource);
          pushEventProperty(signupId, '/pricing', 'signup', 'referral_source', 0, utmSource || 'direct');

          pushEvent(1, '/onboarding', 'Get Started - Wordcraft AI');
          pushEvent(3, '/onboarding', '', null, 'onboarding-next-step');

          const trialId = pushEvent(2, '/onboarding', 'Get Started - Wordcraft AI', 'trial_started');
          pushEventProperty(trialId, '/onboarding', 'trial_started', 'plan', 0, 'pro_trial');
          pushEventProperty(trialId, '/onboarding', 'trial_started', 'trial_days', 1, '14', 14);
        }

        // A/B Test 2 Conversion Record
        if (ctaTest) {
          const selectedVariant = randomWeightedChoice(
            ctaTest.variants.map((v) => ({ item: v, weight: v.weight }))
          );
          abTestSessions.push({
            testId: ctaTest.id,
            variantId: selectedVariant.id,
            sessionId: session.sessionId,
            converted: signedUpInSession,
            convertedAt: signupEventTime,
          });
        }

        // --- Step 4: Product Usage (Dashboard -> Editor -> Document & AI) ---
        let createdDocumentInSession = false;
        let docCreatedTime: Date | null = null;
        let clickedUpgradeInSession = false;
        let upgradeEventTime: Date | null = null;

        if (visitor.isIdentified && !isFirstSession) {
          pushEvent(1, '/dashboard', 'Dashboard - Wordcraft AI');

          // Active AI document generation: paying users heavily use AI;
          // occasional trial users test it out
          const shouldRunAI = (visitor.plan === 'pro' || visitor.plan === 'team')
            ? Math.random() < 0.80
            : (visitor.plan === 'trial' && Math.random() < 0.04);

          if (shouldRunAI) {
            pushEvent(1, '/editor', 'Document Editor - Wordcraft AI');
            pushEvent(3, '/editor', '', null, 'editor-toolbar-generate');

            // Document creation
            createdDocumentInSession = true;
            docCreatedTime = new Date(eventTime.getTime());
            const docId = pushEvent(2, '/editor', 'Document Editor - Wordcraft AI', 'document_created');
            const docType = randomChoice(['blog_post', 'cold_email', 'product_spec', 'press_release', 'newsletter']);
            const wordCount = randomInt(280, 1450);
            pushEventProperty(docId, '/editor', 'document_created', 'doc_type', 0, docType);
            pushEventProperty(docId, '/editor', 'document_created', 'word_count', 1, String(wordCount), wordCount);

            // AI Generation Event
            const aiTemplate = randomChoice(LLM_TEMPLATES);
            const aiId = pushEvent(2, '/editor', 'Document Editor - Wordcraft AI', 'ai_generate_clicked');
            pushEventProperty(aiId, '/editor', 'ai_generate_clicked', 'template_name', 0, aiTemplate);
            pushEventProperty(aiId, '/editor', 'ai_generate_clicked', 'doc_id', 0, randomUUID());

            // ---------------------------------------------------------------
            // Phase 5: LLM Events (Attached to ai_generate_clicked)
            // ---------------------------------------------------------------
            const traceId = randomUUID();
            const selectedModel = randomWeightedChoice(
              LLM_MODELS.map((m) => ({ item: m, weight: m.weight }))
            );
            const promptTokens = randomInt(400, 2400);
            const completionTokens = randomInt(180, 950);
            const totalTokens = promptTokens + completionTokens;
            const inputCost = (promptTokens / 1_000_000) * selectedModel.promptPricePerM;
            const outputCost = (completionTokens / 1_000_000) * selectedModel.compPricePerM;
            const totalCost = inputCost + outputCost;
            const latencyMs = randomInt(650, 4200);
            const ttftMs = randomInt(180, 850);

            // Status weighting: 95% success, 3% error, 1% timeout, 1% rate_limited
            const statusRoll = Math.random();
            let status = 'success';
            let errorMessage = '';
            if (statusRoll > 0.98) {
              status = 'rate_limited';
              errorMessage = 'Rate limit exceeded for organization';
            } else if (statusRoll > 0.96) {
              status = 'timeout';
              errorMessage = 'Request timed out after 30000ms';
            } else if (statusRoll > 0.94) {
              status = 'error';
              errorMessage = 'Upstream 502 Bad Gateway from provider';
            }

            const chainSpanId = randomUUID();
            const genSpanId = randomUUID();

            // Span 1: Root Chain Span
            llmEventRows.push({
              id: chainSpanId,
              project_id: targetProjectId,
              session_id: session.sessionId,
              visitor_id: visitor.visitorId,
              trace_id: traceId,
              parent_event_id: '',
              span_type: 'chain',
              model: 'orchestrator',
              provider: 'internal',
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
              latency_ms: latencyMs + 120,
              cost: 0,
              cost_details: '{}',
              prompt: `Synthesize writing suggestions for template: ${aiTemplate}`,
              output: status === 'success' ? 'Generated AI text output for editor' : '',
              completion: status === 'success' ? 'Generated AI text output for editor' : '',
              metadata: JSON.stringify({ template: aiTemplate, mode: 'assist' }),
              tool_calls: '[]',
              tool_definitions: '[]',
              created_at: getUTCString(eventTime),
              status,
              error_message: errorMessage,
              template_name: aiTemplate,
              score: status === 'success' ? randomFloat(0.85, 0.99, 2) : 0,
              ttft_ms: ttftMs,
              name: 'wordcraft.orchestrator',
              level: 'default',
              start_time: getUTCString(eventTime),
              end_time: getUTCString(new Date(eventTime.getTime() + latencyMs)),
              completion_start_time: getUTCString(new Date(eventTime.getTime() + ttftMs)),
              user_id: visitor.distinctId,
              environment: 'production',
              release: 'v2.4.1',
              version: '2.4.1',
              tags: JSON.stringify(['wordcraft', aiTemplate, 'production']),
              model_parameters: JSON.stringify({ temperature: 0.7, max_tokens: 1024, top_p: 0.95 }),
              request_path: '/api/v1/generate',
              usage_unit: 'tokens',
              prompt_cache_read_tokens: 0,
              prompt_cache_write_tokens: 0,
              reasoning_tokens: 0,
              usage_details: '{}',
              input_cost: inputCost,
              output_cost: outputCost,
              http_status_code: status === 'success' ? 200 : 500,
              error_code: errorMessage ? 'AI_SERVICE_ERROR' : '',
              prompt_id: `prompt_${aiTemplate}`,
              prompt_version: 2,
              scores: JSON.stringify([
                { name: 'relevance', value: randomFloat(0.88, 0.99) },
                { name: 'fluency', value: randomFloat(0.90, 0.99) },
              ]),
              country_code: visitor.geo.country,
              body_truncated: 0,
            });

            // Span 2: Generation Span
            llmEventRows.push({
              id: genSpanId,
              project_id: targetProjectId,
              session_id: session.sessionId,
              visitor_id: visitor.visitorId,
              trace_id: traceId,
              parent_event_id: chainSpanId,
              span_type: 'generation',
              model: selectedModel.model,
              provider: selectedModel.provider,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
              latency_ms: latencyMs,
              cost: totalCost,
              cost_details: JSON.stringify({ input_cost: inputCost, output_cost: outputCost, currency: 'USD' }),
              prompt: `Write text for: ${aiTemplate}`,
              output: status === 'success' ? 'Completion content received' : '',
              completion: status === 'success' ? 'Completion content received' : '',
              metadata: '{}',
              tool_calls: '[]',
              tool_definitions: '[]',
              created_at: getUTCString(eventTime),
              status,
              error_message: errorMessage,
              template_name: aiTemplate,
              score: status === 'success' ? randomFloat(0.85, 0.99, 2) : 0,
              ttft_ms: ttftMs,
              name: `${selectedModel.provider}.chat.completion`,
              level: 'default',
              start_time: getUTCString(eventTime),
              end_time: getUTCString(new Date(eventTime.getTime() + latencyMs)),
              completion_start_time: getUTCString(new Date(eventTime.getTime() + ttftMs)),
              user_id: visitor.distinctId,
              environment: 'production',
              release: 'v2.4.1',
              version: '2.4.1',
              tags: JSON.stringify(['llm', selectedModel.model]),
              model_parameters: JSON.stringify({ temperature: 0.7, max_tokens: 1024 }),
              request_path: '/api/v1/generate',
              usage_unit: 'tokens',
              prompt_cache_read_tokens: 0,
              prompt_cache_write_tokens: 0,
              reasoning_tokens: 0,
              usage_details: '{}',
              input_cost: inputCost,
              output_cost: outputCost,
              http_status_code: status === 'success' ? 200 : 500,
              error_code: errorMessage ? 'PROVIDER_ERROR' : '',
              prompt_id: `prompt_${aiTemplate}`,
              prompt_version: 2,
              scores: JSON.stringify([{ name: 'quality', value: randomFloat(0.85, 0.98) }]),
              country_code: visitor.geo.country,
              body_truncated: 0,
            });

            // Additional feature usage
            if (Math.random() < 0.35) {
              const exportId = pushEvent(2, '/editor', 'Document Editor - Wordcraft AI', 'export_pdf');
              pushEventProperty(exportId, '/editor', 'export_pdf', 'format', 0, 'pdf');
              pushEventProperty(exportId, '/editor', 'export_pdf', 'page_count', 1, '2', 2);
            }
          }
        }

        // A/B Test 3 Assignment: Onboarding Flow (Goal: document_created)
        const onboardingTest = createdTests.find((t) => t.name === 'Onboarding Flow');
        if (onboardingTest && visitor.isIdentified) {
          const selectedVariant = randomWeightedChoice(
            onboardingTest.variants.map((v) => ({ item: v, weight: v.weight }))
          );
          abTestSessions.push({
            testId: onboardingTest.id,
            variantId: selectedVariant.id,
            sessionId: session.sessionId,
            converted: createdDocumentInSession,
            convertedAt: docCreatedTime,
          });
        }

        // --- Step 5: Upgrade & Conversion Funnel ---
        if (visitor.plan === 'pro' || visitor.plan === 'team') {
          // If this is session 2 or 3, fire upgrade conversion
          if (sIdx === 1 || (sIdx === 2 && Math.random() < 0.5)) {
            clickedUpgradeInSession = true;
            upgradeEventTime = new Date(eventTime.getTime());

            const upgradeId = pushEvent(2, '/dashboard', 'Dashboard - Wordcraft AI', 'upgrade_clicked');
            pushEventProperty(upgradeId, '/dashboard', 'upgrade_clicked', 'source_page', 0, '/dashboard');
            pushEventProperty(upgradeId, '/dashboard', 'upgrade_clicked', 'target_plan', 0, visitor.plan);

            pushEvent(1, '/billing', 'Billing & Subscription - Wordcraft AI');
            pushEvent(3, '/billing', '', null, 'billing-form-submit');

            const isAnnual = Math.random() < 0.22;
            const amount = visitor.plan === 'pro' ? (isAnnual ? 290 : 29) : (isAnnual ? 790 : 79);
            const currency = 'USD';

            const subEventId = pushEvent(2, '/billing', 'Billing & Subscription - Wordcraft AI', 'subscription_purchased');
            pushEventProperty(subEventId, '/billing', 'subscription_purchased', 'plan', 0, visitor.plan);
            pushEventProperty(subEventId, '/billing', 'subscription_purchased', 'billing', 0, isAnnual ? 'annual' : 'monthly');
            pushEventProperty(subEventId, '/billing', 'subscription_purchased', 'amount', 1, String(amount), amount);
            pushEventProperty(subEventId, '/billing', 'subscription_purchased', 'currency', 0, currency);

            // ---------------------------------------------------------------
            // Phase 6: Revenue Records (Tinybird: project_revenue)
            // ---------------------------------------------------------------
            revenueRows.push({
              project_id: targetProjectId,
              distinct_id: visitor.distinctId,
              session_id: session.sessionId,
              event_id: subEventId,
              event_name: 'subscription_purchased',
              currency,
              revenue: amount,
              provider: 'stripe',
              payment_connection_id: paymentConnectionId,
              created_at: getUTCString(eventTime),
            });

            // Generate monthly recurring revenue (invoice.paid) every 30 days until now
            if (!isAnnual) {
              let nextBillingDate = new Date(eventTime.getTime() + 30 * 24 * 60 * 60 * 1000);
              while (nextBillingDate.getTime() <= now.getTime()) {
                // 3% monthly churn roll
                if (Math.random() < 0.03) break;

                const recurringEventId = randomUUID();
                const recurringDateStr = getUTCString(nextBillingDate);

                revenueRows.push({
                  project_id: targetProjectId,
                  distinct_id: visitor.distinctId,
                  session_id: session.sessionId,
                  event_id: recurringEventId,
                  event_name: 'invoice.paid',
                  currency,
                  revenue: amount,
                  provider: 'stripe',
                  payment_connection_id: paymentConnectionId,
                  created_at: recurringDateStr,
                });

                // Match with projectEventRows so event joins and analytics match
                projectEventRows.push({
                  project_id: targetProjectId,
                  visitor_id: visitor.visitorId,
                  session_id: session.sessionId,
                  event_id: recurringEventId,
                  hostname: 'app.wordcraft.ai',
                  url_path: '/billing',
                  url_query: '',
                  referrer_path: '',
                  referrer_query: '',
                  referrer_domain: '',
                  page_title: 'Billing & Subscription - Wordcraft AI',
                  event_type: 2,
                  event_name: 'invoice.paid',
                  tag: 'recurring_subscription',
                  browser: visitor.platform.browser,
                  os: visitor.platform.os,
                  device: visitor.platform.device,
                  screen: visitor.platform.screen,
                  language: visitor.geo.language,
                  country: visitor.geo.country,
                  region: visitor.geo.region,
                  city: visitor.geo.city,
                  distinct_id: visitor.distinctId,
                  utm_source: '',
                  utm_medium: '',
                  utm_campaign: '',
                  utm_content: '',
                  utm_term: '',
                  gclid: '',
                  fbclid: '',
                  msclkid: '',
                  ttclid: '',
                  li_fat_id: '',
                  twclid: '',
                  lcp: null,
                  inp: null,
                  cls: null,
                  fcp: null,
                  ttfb: null,
                  latitude: null,
                  longitude: null,
                  created_at: recurringDateStr,
                });

                nextBillingDate = new Date(nextBillingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
              }
            }
          }
        }

        // A/B Test 1 Assignment: Pricing Page Redesign (Goal: upgrade_clicked)
        const pricingTest = createdTests.find((t) => t.name === 'Pricing Page Redesign');
        if (pricingTest && visitedPricing) {
          const selectedVariant = randomWeightedChoice(
            pricingTest.variants.map((v) => ({ item: v, weight: v.weight }))
          );
          abTestSessions.push({
            testId: pricingTest.id,
            variantId: selectedVariant.id,
            sessionId: session.sessionId,
            converted: clickedUpgradeInSession,
            convertedAt: upgradeEventTime,
          });
        }

        // -------------------------------------------------------------------
        // Phase 7: Errors (Tinybird: project_error)
        // -------------------------------------------------------------------
        // Higher error occurrence rate around deploy days
        const errorChance = deploySpike ? 0.35 : 0.06;
        if (Math.random() < errorChance) {
          const chosenErr = randomChoice(ERROR_CATALOG_WITH_FP);
          errorRows.push({
            project_id: targetProjectId,
            visitor_id: visitor.visitorId,
            session_id: session.sessionId,
            error_id: randomUUID(),
            error_type: chosenErr.type,
            message: chosenErr.message,
            filename: chosenErr.filename,
            lineno: chosenErr.lineno,
            colno: chosenErr.colno,
            stack: chosenErr.stack,
            fingerprint: chosenErr.fingerprint,
            url_path: '/editor',
            url_query: '',
            hostname: 'app.wordcraft.ai',
            browser: visitor.platform.browser,
            os: visitor.platform.os,
            device: visitor.platform.device,
            country: visitor.geo.country,
            region: visitor.geo.region,
            city: visitor.geo.city,
            level: chosenErr.level,
            created_at: getUTCString(eventTime),
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // Phase 4.2: Top-of-Funnel Anonymous Casual Traffic
    // -----------------------------------------------------------------------
    const topOfFunnelCount = Math.max(0, visitorsCount - visitors.length);
    if (topOfFunnelCount > 0) {
      console.log(`\n🌐 Phase 4.2: Generating ${topOfFunnelCount} top-of-funnel organic & referral visitors...`);
      const totalDays = months * 30;
      const startTimeMs = now.getTime() - totalDays * 24 * 60 * 60 * 1000;

      for (let i = 0; i < topOfFunnelCount; i++) {
        const visitorId = randomUUID();
        const sessionId = randomUUID();
        const geo = randomWeightedChoice(GEOGRAPHIES);
        const platform = randomWeightedChoice(PLATFORMS);

        const progress = Math.pow(Math.random(), 1.5);
        const timeOffsetMs = totalDays * (1 - progress) * 24 * 60 * 60 * 1000;
        const visitorTime = new Date(Math.min(now.getTime() - 10000, Math.max(startTimeMs, now.getTime() - timeOffsetMs)));

        let utmSource = '';
        let utmMedium = '';
        let utmCampaign = '';
        let referrerDomain = '';
        if (Math.random() < 0.50) {
          utmSource = randomChoice(['google', 'twitter', 'linkedin', 'producthunt', 'newsletter', 'github']);
          utmMedium = randomChoice(['cpc', 'social', 'referral', 'organic']);
          utmCampaign = randomChoice(['q2_growth', 'ai_writers_summit', 'product_hunt_launch', 'content_seo', 'brand_launch']);
          referrerDomain = `${utmSource}.com`;
        }

        projectEventRows.push({
          project_id: targetProjectId,
          visitor_id: visitorId,
          session_id: sessionId,
          event_id: randomUUID(),
          hostname: 'app.wordcraft.ai',
          url_path: '/',
          url_query: utmSource ? `?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}` : '',
          referrer_path: '',
          referrer_query: '',
          referrer_domain: referrerDomain,
          page_title: 'Wordcraft AI - The AI Writing Assistant for Modern Teams',
          event_type: 1, // pageview
          event_name: '',
          tag: '',
          browser: platform.browser,
          os: platform.os,
          device: platform.device,
          screen: platform.screen,
          language: geo.language,
          country: geo.country,
          region: geo.region,
          city: geo.city,
          distinct_id: '',
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: '',
          utm_term: '',
          gclid: '',
          fbclid: '',
          msclkid: '',
          ttclid: '',
          li_fat_id: '',
          twclid: '',
          lcp: randomFloat(1100, 2400, 1),
          inp: randomFloat(40, 120, 1),
          cls: randomFloat(0.01, 0.08, 3),
          fcp: randomFloat(700, 1400, 1),
          ttfb: randomFloat(100, 250, 1),
          latitude: null,
          longitude: null,
          created_at: getUTCString(visitorTime),
        });

        // 35% browse to /pricing
        if (Math.random() < 0.35) {
          const pricingTime = new Date(visitorTime.getTime() + randomInt(20, 90) * 1000);
          projectEventRows.push({
            project_id: targetProjectId,
            visitor_id: visitorId,
            session_id: sessionId,
            event_id: randomUUID(),
            hostname: 'app.wordcraft.ai',
            url_path: '/pricing',
            url_query: '',
            referrer_path: '/',
            referrer_query: '',
            referrer_domain: referrerDomain,
            page_title: 'Pricing & Plans - Wordcraft AI',
            event_type: 1,
            event_name: '',
            tag: '',
            browser: platform.browser,
            os: platform.os,
            device: platform.device,
            screen: platform.screen,
            language: geo.language,
            country: geo.country,
            region: geo.region,
            city: geo.city,
            distinct_id: '',
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            utm_content: '',
            utm_term: '',
            gclid: '',
            fbclid: '',
            msclkid: '',
            ttclid: '',
            li_fat_id: '',
            twclid: '',
            lcp: null,
            inp: null,
            cls: null,
            fcp: null,
            ttfb: null,
            latitude: null,
            longitude: null,
            created_at: getUTCString(pricingTime),
          });
        }
      }
      console.log(`   ✓ Ingested top-of-funnel visitor traffic (Total unique visitors: ${visitors.length + topOfFunnelCount})`);
    }

    summary.tinybird_project_event = projectEventRows.length;
    summary.tinybird_event_data = eventDataRows.length;
    summary.tinybird_llm_events = llmEventRows.length;
    summary.tinybird_project_revenue = revenueRows.length;
    summary.tinybird_project_error = errorRows.length;

    console.log(`   ✓ Formulated ${projectEventRows.length} project_event rows`);
    console.log(`   ✓ Formulated ${eventDataRows.length} event_data property rows`);
    console.log(`   ✓ Formulated ${llmEventRows.length} llm_events span rows`);
    console.log(`   ✓ Formulated ${revenueRows.length} project_revenue rows`);
    console.log(`   ✓ Formulated ${errorRows.length} project_error rows`);

    // -----------------------------------------------------------------------
    // Upload Data to Tinybird
    // -----------------------------------------------------------------------
    if (!isDryRun) {
      process.stdout.write(`   ⏳ Uploading ${projectEventRows.length} rows to Tinybird project_event... `);
      await uploadToTinybird('project_event', projectEventRows);
      console.log('Done!');

      process.stdout.write(`   ⏳ Uploading ${eventDataRows.length} rows to Tinybird event_data... `);
      await uploadToTinybird('event_data', eventDataRows);
      console.log('Done!');

      process.stdout.write(`   ⏳ Uploading ${llmEventRows.length} rows to Tinybird llm_events... `);
      await uploadToTinybird('llm_events', llmEventRows);
      console.log('Done!');

      process.stdout.write(`   ⏳ Uploading ${revenueRows.length} rows to Tinybird project_revenue... `);
      await uploadToTinybird('project_revenue', revenueRows);
      console.log('Done!');

      process.stdout.write(`   ⏳ Uploading ${errorRows.length} rows to Tinybird project_error... `);
      await uploadToTinybird('project_error', errorRows);
      console.log('Done!');
    }

    // -----------------------------------------------------------------------
    // Phase 7.2: Aggregate Errors into PostgreSQL error_group
    // -----------------------------------------------------------------------
    console.log('\n🐞 Phase 7.2: Aggregating deduplicated errors into PostgreSQL error_group...');
    for (const catErr of ERROR_CATALOG_WITH_FP) {
      const matchingErrors = errorRows.filter((e) => e.fingerprint === catErr.fingerprint);
      if (matchingErrors.length === 0) continue;

      const occurrences = matchingErrors.length;
      const affectedUsers = new Set(matchingErrors.map((e) => e.visitor_id)).size;
      const timestamps = matchingErrors.map((e) => new Date(e.created_at as string).getTime());
      const firstSeen = new Date(Math.min(...timestamps));
      const lastSeen = new Date(Math.max(...timestamps));

      if (!isDryRun) {
        await sql`
          INSERT INTO error_group (
            error_group_id, project_id, fingerprint, error_type, message,
            occurrences, affected_users, first_seen, last_seen, resolved
          )
          VALUES (
            ${randomUUID()}, ${targetProjectId}, ${catErr.fingerprint}, ${catErr.type}, ${catErr.message},
            ${occurrences}, ${affectedUsers}, ${firstSeen}, ${lastSeen}, false
          )
          ON CONFLICT (project_id, fingerprint) DO UPDATE SET
            occurrences = error_group.occurrences + ${occurrences},
            affected_users = error_group.affected_users + ${affectedUsers},
            last_seen = GREATEST(error_group.last_seen, ${lastSeen});
        `;
      }
      summary.error_group++;
    }
    console.log(`   ✓ Recorded ${summary.error_group} error groups in PostgreSQL`);

    // -----------------------------------------------------------------------
    // Phase 8: Record A/B Test Sessions in PostgreSQL
    // -----------------------------------------------------------------------
    console.log(`\n🧪 Phase 8: Recording ${abTestSessions.length} A/B test sessions in PostgreSQL...`);
    summary.ab_test_session = abTestSessions.length;

    if (!isDryRun && abTestSessions.length > 0) {
      const BATCH_SIZE = 500;
      for (let i = 0; i < abTestSessions.length; i += BATCH_SIZE) {
        const chunk = abTestSessions.slice(i, i + BATCH_SIZE);
        const rows = chunk.map((item) => ({
          id: randomUUID(),
          test_id: item.testId,
          variant_id: item.variantId,
          session_id: item.sessionId,
          converted: item.converted,
          converted_at: item.convertedAt,
        }));
        await sql`
          INSERT INTO ab_test_session ${sql(rows, 'id', 'test_id', 'variant_id', 'session_id', 'converted', 'converted_at')}
          ON CONFLICT (test_id, session_id) DO NOTHING;
        `;
      }
    }
    console.log(`   ✓ Ingested A/B test sessions`);

    // -----------------------------------------------------------------------
    // Execution Summary Report
    // -----------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('              🎉 SEED COMPLETED SUCCESSFULLY                     ');
    console.log('================================================================');
    console.log(`Target Organization ID : ${orgId}`);
    console.log(`Project Name           : demo-project (${targetProjectId})`);
    console.log(`Domain                 : app.wordcraft.ai`);
    console.log(`Time Span              : Past ${months} months`);
    console.log('----------------------------------------------------------------');
    console.log('Store       | Table                 | Records Generated');
    console.log('----------------------------------------------------------------');
    console.log(`PostgreSQL  | organization          | ${summary.organization}`);
    console.log(`PostgreSQL  | user                  | ${summary.user}`);
    console.log(`PostgreSQL  | member                | ${summary.member}`);
    console.log(`PostgreSQL  | project               | ${summary.project}`);
    console.log(`PostgreSQL  | client                | ${summary.client}`);
    console.log(`PostgreSQL  | payment_connection    | ${summary.payment_connection}`);
    console.log(`PostgreSQL  | ab_test               | ${summary.ab_test}`);
    console.log(`PostgreSQL  | ab_test_variant       | ${summary.ab_test_variant}`);
    console.log(`PostgreSQL  | ab_test_session       | ${summary.ab_test_session}`);
    console.log(`PostgreSQL  | error_group           | ${summary.error_group}`);
    console.log('----------------------------------------------------------------');
    console.log(`Tinybird    | visitor_data          | ${summary.tinybird_visitor_data}`);
    console.log(`Tinybird    | project_event         | ${summary.tinybird_project_event}`);
    console.log(`Tinybird    | event_data            | ${summary.tinybird_event_data}`);
    console.log(`Tinybird    | llm_events            | ${summary.tinybird_llm_events}`);
    console.log(`Tinybird    | project_revenue       | ${summary.tinybird_project_revenue}`);
    console.log(`Tinybird    | project_error         | ${summary.tinybird_project_error}`);
    console.log('----------------------------------------------------------------');

    const totalRevSum = revenueRows.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
    const totalLlmCostSum = llmEventRows
      .filter((r) => r.span_type === 'generation')
      .reduce((acc, r) => acc + Number(r.cost || 0), 0);
    const grossMarginSum = totalRevSum - totalLlmCostSum;
    const grossMarginPct = totalRevSum > 0 ? (grossMarginSum / totalRevSum) * 100 : 0;
    const totalUniqueVisitors = visitors.length + topOfFunnelCount;

    console.log('Business Metrics & Unit Economics Overview');
    console.log('----------------------------------------------------------------');
    console.log(`Unique Visitors        : ${totalUniqueVisitors.toLocaleString()}`);
    console.log(`Total Revenue (USD)    : $${totalRevSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`AI Compute Cost (USD)  : $${totalLlmCostSum.toFixed(4)}`);
    console.log(`Blended Gross Margin   : $${grossMarginSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${grossMarginPct.toFixed(1)}% PROFIT)`);
    console.log(`Ratio (Visitors > Rev) : ${totalUniqueVisitors > totalRevSum ? '✅ PASSED (' + totalUniqueVisitors + ' visitors > $' + totalRevSum.toFixed(0) + ' revenue)' : '❌ FAILED'}`);
    console.log('================================================================\n');

    if (isDryRun) {
      console.log('💡 Note: This was a DRY RUN simulation. No records were written.');
      console.log('   Run without --dry-run to commit data live.\n');
    }
  } catch (err: any) {
    console.error('\n❌ Seeding failed:', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
