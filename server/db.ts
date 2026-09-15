import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Student, Material, Assignment, Submission, Announcement } from '../src/types';

export interface UserSession {
  token: string;
  userId: string;
  role: 'admin' | 'student';
  createdAt: number;
}

export interface DatabaseSchema {
  students: Student[];
  materials: Material[];
  assignments: Assignment[];
  submissions: Submission[];
  announcements: Announcement[];
  sessions: UserSession[];
  adminPasswordHash: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial Admin Password: 198086
// Hashed with bcrypt - never stored as plaintext
const DEFAULT_ADMIN_HASH = bcrypt.hashSync('198086', 10);

function getDefaultData(): DatabaseSchema {
  return {
    students: [],
    materials: [],
    assignments: [],
    submissions: [],
    announcements: [],
    sessions: [],
    adminPasswordHash: DEFAULT_ADMIN_HASH,
  };
}

let cachedDb: DatabaseSchema | null = null;

export function loadDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = getDefaultData();
    saveDb(defaultData);
    cachedDb = defaultData;
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all collections exist
    const db: DatabaseSchema = {
      students: Array.isArray(parsed.students) ? parsed.students : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      adminPasswordHash: parsed.adminPasswordHash || DEFAULT_ADMIN_HASH,
    };
    cachedDb = db;
    return db;
  } catch (err) {
    console.error('Error reading database file, initializing default:', err);
    const defaultData = getDefaultData();
    saveDb(defaultData);
    cachedDb = defaultData;
    return defaultData;
  }
}

export function saveDb(data: DatabaseSchema): void {
  cachedDb = data;
  const tempFile = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Session Helpers (30 days validity)
const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export function createSession(userId: string, role: 'admin' | 'student'): string {
  const db = loadDb();
  const token = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  // Clean old sessions (> 30 days)
  const now = Date.now();
  const validSessions = db.sessions.filter(s => now - s.createdAt < SESSION_LIFETIME);
  validSessions.push({ token, userId, role, createdAt: now });
  db.sessions = validSessions;
  saveDb(db);
  return token;
}

export function getSession(token: string): UserSession | null {
  const db = loadDb();
  const session = db.sessions.find(s => s.token === token);
  if (!session) return null;
  const now = Date.now();
  if (now - session.createdAt > SESSION_LIFETIME) {
    // expired
    db.sessions = db.sessions.filter(s => s.token !== token);
    saveDb(db);
    return null;
  }
  return session;
}

export function removeSession(token: string): void {
  const db = loadDb();
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDb(db);
}
