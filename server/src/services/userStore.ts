import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../db.js';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string; // salt:hash
  role: 'user' | 'reviewer' | 'admin';
  city?: string | null;
  language: string;
  topics: string[];
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<StoredUser, 'password'>;

function resolveDataDir(): string {
  const cwd = process.cwd();
  if (path.basename(cwd) === 'server') {
    return path.resolve(cwd, 'data');
  }
  return path.resolve(cwd, 'server', 'data');
}

const DATA_DIR = resolveDataDir();
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Write queue to prevent concurrent write collisions on the JSON store
let writeQueue = Promise.resolve();

function queueWrite<T>(op: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(op);
  writeQueue = result.then(() => {}, () => {});
  return result;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Password hashing helper for default seeds
function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function sanitizeUser(user: StoredUser): SafeUser {
  const { password: _p, ...safe } = user;
  return safe;
}

export function getInitialDemoUsers(): StoredUser[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'usr_editor',
      name: 'Aarav Sharma (Chief Editor)',
      email: 'editor@upwise.news',
      password: hashSeedPassword('password123'),
      role: 'reviewer',
      city: 'New Delhi',
      language: 'en',
      topics: ['tech-computing', 'india-national'],
      interests: ['India & Politics', 'Technology & Science'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_citizen',
      name: 'Priya Patel (Citizen Reporter)',
      email: 'citizen@upwise.news',
      password: hashSeedPassword('password123'),
      role: 'user',
      city: 'Bengaluru',
      language: 'en',
      topics: ['startups-ai', 'career-education'],
      interests: ['Business & Economy'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_reporter',
      name: 'Rohan Verma (Local Correspondent)',
      email: 'reporter@upwise.news',
      password: hashSeedPassword('password123'),
      role: 'user',
      city: 'Mumbai',
      language: 'en',
      topics: ['sports', 'science-innovation'],
      interests: ['Sports', 'World & Lifestyle'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export async function readUsersFromFile(): Promise<StoredUser[]> {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const defaults = getInitialDemoUsers();
    await writeUsersToFile(defaults);
    return defaults;
  }

  try {
    const raw = await fs.promises.readFile(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaults = getInitialDemoUsers();
    await writeUsersToFile(defaults);
    return defaults;
  } catch (err) {
    console.warn('[UserStore] Error reading users.json, initializing defaults:', (err as Error).message);
    const defaults = getInitialDemoUsers();
    await writeUsersToFile(defaults);
    return defaults;
  }
}

export async function writeUsersToFile(users: StoredUser[]): Promise<void> {
  ensureDataDir();
  return queueWrite(async () => {
    const tmpFile = `${USERS_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    const data = JSON.stringify(users, null, 2);
    await fs.promises.writeFile(tmpFile, data, 'utf-8');
    await fs.promises.rename(tmpFile, USERS_FILE);
  });
}

// User lookup by normalized email
export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();

  // Read from JSON file store first
  const users = await readUsersFromFile();
  const match = users.find((u) => u.email.toLowerCase() === normalized);
  if (match) return match;

  // Secondary check with Prisma if connected
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: normalized },
      include: { interests: true },
    });
    if (dbUser && dbUser.password) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        role: dbUser.role as any,
        city: dbUser.city,
        language: dbUser.language,
        topics: dbUser.topics,
        interests: dbUser.interests.map((i) => i.category),
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database unavailable
  }

  return null;
}

// User lookup by ID
export async function findUserById(id: string): Promise<StoredUser | null> {
  // Read from JSON file store first
  const users = await readUsersFromFile();
  const match = users.find((u) => u.id === id);
  if (match) return match;

  // Secondary check with Prisma if connected
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id },
      include: { interests: true },
    });
    if (dbUser && dbUser.password) {
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        password: dbUser.password,
        role: dbUser.role as any,
        city: dbUser.city,
        language: dbUser.language,
        topics: dbUser.topics,
        interests: dbUser.interests.map((i) => i.category),
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database unavailable
  }

  return null;
}

// User creation
export async function createUserRecord(userData: {
  name: string;
  email: string;
  passwordHash: string;
  role?: 'user' | 'reviewer' | 'admin';
  city?: string | null;
  language?: string;
  topics?: string[];
  interests?: string[];
}): Promise<SafeUser> {
  const normalized = userData.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newUser: StoredUser = {
    id,
    name: userData.name.trim(),
    email: normalized,
    password: userData.passwordHash,
    role: userData.role || 'user',
    city: userData.city || null,
    language: userData.language === 'hi' ? 'hi' : 'en',
    topics: userData.topics || [],
    interests: userData.interests || [],
    createdAt: now,
    updatedAt: now,
  };

  const users = await readUsersFromFile();
  users.push(newUser);
  await writeUsersToFile(users);

  // Non-blocking Prisma sync if available
  prisma.user.create({
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      city: newUser.city,
      language: newUser.language,
      topics: newUser.topics,
    },
  }).catch(() => {});

  return sanitizeUser(newUser);
}

// User preference update
export async function updateUserPreferences(
  userId: string,
  updates: {
    city?: string | null;
    language?: string;
    topics?: string[];
    categories?: string[];
  }
): Promise<SafeUser | null> {
  const users = await readUsersFromFile();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return null;
  }

  const user = users[userIndex];
  if (updates.city !== undefined) user.city = updates.city;
  if (updates.language !== undefined) user.language = updates.language === 'hi' ? 'hi' : 'en';
  if (updates.topics !== undefined) user.topics = updates.topics;
  if (updates.categories !== undefined) user.interests = updates.categories;
  user.updatedAt = new Date().toISOString();

  users[userIndex] = user;
  await writeUsersToFile(users);

  // Non-blocking Prisma update
  const updateData: any = {};
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.language !== undefined) updateData.language = updates.language;
  if (updates.topics !== undefined) updateData.topics = updates.topics;

  prisma.user.update({
    where: { id: userId },
    data: updateData,
  }).catch(() => {});

  return sanitizeUser(user);
}
