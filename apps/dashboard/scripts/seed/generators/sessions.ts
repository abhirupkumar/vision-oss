import { getRandomDevice } from '../distributions/devices.js';
import { getRandomGeo, getRandomLanguage } from '../distributions/geographic.js';
import { generateTimestampForDay } from '../distributions/temporal.js';
import { uuid } from '../utils.js';

// Sample name pools for identified visitors
const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Emma',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Karen',
  'Liam',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rachel',
  'Sam',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yara',
  'Zoe',
  'Ahmed',
  'Priya',
  'Chen',
  'Maria',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Young',
  'Robinson',
  'Kumar',
  'Chen',
  'Patel',
  'Kim',
  'Nguyen',
  'Santos',
  'Rivera',
  'Kowalski',
];

const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'icloud.com',
  'hotmail.com',
  'protonmail.com',
  'example.com',
  'company.io',
  'work.co',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  const domain = pick(EMAIL_DOMAINS);
  const variants = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()[0]}${lastName.toLowerCase()}@${domain}`,
  ];
  return pick(variants);
}

export interface VisitorData {
  id: string;
  projectId: string;
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  // Optional profile fields — present for ~30% of visitors
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  properties?: Record<string, unknown>;
}

export function createVisitor(projectId: string, day: Date): VisitorData {
  const deviceInfo = getRandomDevice();
  const geo = getRandomGeo();
  const language = getRandomLanguage();
  const createdAt = generateTimestampForDay(day);

  const visitor: VisitorData = {
    id: uuid(),
    projectId,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    screen: deviceInfo.screen,
    language,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    latitude: geo.latitude,
    longitude: geo.longitude,
    createdAt,
  };

  // ~30% chance of being an identified visitor with profile data
  if (Math.random() < 0.3) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    visitor.firstName = firstName;
    visitor.lastName = lastName;
    visitor.email = generateEmail(firstName, lastName);

    // ~50% of identified visitors have extra properties
    if (Math.random() < 0.5) {
      const plans = ['free', 'starter', 'pro', 'enterprise'];
      const sources = ['organic', 'paid', 'referral', 'social', 'email'];
      visitor.properties = {
        plan: pick(plans),
        source: pick(sources),
        signup_date: new Date(createdAt.getTime() - Math.random() * 30 * 86400000)
          .toISOString()
          .split('T')[0],
      };
    }
  }

  return visitor;
}

export function createVisitors(projectId: string, day: Date, count: number): VisitorData[] {
  const visitors: VisitorData[] = [];

  for (let i = 0; i < count; i++) {
    visitors.push(createVisitor(projectId, day));
  }

  // Sort by createdAt to maintain chronological order
  visitors.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return visitors;
}
