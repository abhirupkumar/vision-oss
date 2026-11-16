import { eq } from 'drizzle-orm';
import { db } from '../client';
import { Organization, Project } from '../schema';
import { slugify } from '../lib/generate';

export async function getId(tableName: 'project' | 'organization', name: string): Promise<string> {
  const newId = slugify(name);

  let existing;
  if (tableName === 'project') {
    existing = await db.query.Project.findFirst({ where: eq(Project.id, newId) });
  } else if (tableName === 'organization') {
    existing = await db.query.Organization.findFirst({ where: eq(Organization.id, newId) });
  }

  function random(str: string) {
    const numbers = Math.floor(1000 + Math.random() * 9000);
    if (str.match(/-\d{4}$/g)) {
      return str.replace(/-\d{4}$/g, `-${numbers}`);
    }
    return `${str}-${numbers}`;
  }

  if (existing) {
    return getId(tableName, random(name));
  }

  return newId;
}
