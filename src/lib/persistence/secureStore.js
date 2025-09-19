import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_FILENAME = 'secure-store.json';
const DEFAULT_DIR = process.env.DATA_STORE_DIR || path.join(process.cwd(), 'data');
const STORE_PATH = process.env.DATA_STORE_PATH || path.join(DEFAULT_DIR, DEFAULT_FILENAME);
const ENCRYPTION_SECRET = process.env.DATA_STORE_ENCRYPTION_KEY || process.env.DATA_ENCRYPTION_KEY;

function ensureKey() {
  const source = ENCRYPTION_SECRET;
  if (!source || source.length < 16) {
    throw new Error('DATA_STORE_ENCRYPTION_KEY (min 16 chars) must be set');
  }
  const base = Buffer.from(source, source.length >= 64 && /^[0-9a-fA-F]+$/.test(source) ? 'hex' : 'utf8');
  if (base.length === 32) return base;
  return crypto.createHash('sha256').update(base).digest();
}

const KEY = ensureKey();
const IV_LENGTH = 12; // AES-GCM recommended IV length

function encrypt(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payload) {
  const buffer = Buffer.from(payload, 'base64');
  if (buffer.length < IV_LENGTH + 16) {
    throw new Error('Encrypted payload too small');
  }
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = buffer.subarray(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

function emptyStore() {
  const now = new Date().toISOString();
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    users: [],
    verificationTokens: [],
    provisioning: [], // records linking user <-> stripe/twilio
  };
}

async function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

let cache = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function readStoreFromDisk() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const json = decrypt(raw.trim());
    const parsed = JSON.parse(json);
    cache = parsed;
    return clone(parsed);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const fresh = emptyStore();
      cache = fresh;
      await ensureDirectoryExists(STORE_PATH);
      await fs.writeFile(STORE_PATH, encrypt(JSON.stringify(fresh)), 'utf8');
      return clone(fresh);
    }
    throw err;
  }
}

async function writeStoreToDisk(store) {
  store.updatedAt = new Date().toISOString();
  await ensureDirectoryExists(STORE_PATH);
  await fs.writeFile(STORE_PATH, encrypt(JSON.stringify(store)), 'utf8');
  cache = clone(store);
}

export async function getStore(options = {}) {
  const { fresh = false } = options;
  if (!fresh && cache) {
    return clone(cache);
  }
  return readStoreFromDisk();
}

export async function updateStore(mutator) {
  const working = await getStore({ fresh: true });
  const result = await mutator(working);
  await writeStoreToDisk(working);
  return result;
}

export async function setStore(nextStore) {
  await writeStoreToDisk(nextStore);
}

export function getStorePath() {
  return STORE_PATH;
}

export function scrubValue(value) {
  if (!value) return value;
  if (typeof value === 'string') {
    return value.replace(/[^@\w\.-]/g, '').slice(0, 8) + '…';
  }
  return '[redacted]';
}
