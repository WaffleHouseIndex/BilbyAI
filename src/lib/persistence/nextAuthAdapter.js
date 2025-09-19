import crypto from 'node:crypto';
import { getStore, updateStore } from './secureStore.js';

function nowIso() {
  return new Date().toISOString();
}

function normaliseEmail(email) {
  return (email || '').trim().toLowerCase();
}

function trimEmail(email) {
  return (email || '').trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createNextAuthAdapter() {
  return {
    async createUser(user) {
      if (!user?.email) {
        throw new Error('Email is required');
      }
      const normalized = normaliseEmail(user.email);
      const displayEmail = trimEmail(user.email);
      return updateStore((store) => {
        if (store.users.some((u) => u.emailLower === normalized)) {
          throw new Error('User already exists');
        }
        const created = {
          id: crypto.randomUUID(),
          email: displayEmail,
          emailLower: normalized,
          emailVerified: user.emailVerified ?? null,
          name: user.name ?? null,
          stripeCustomerId: null,
          twilioNumberSid: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          metadata: {},
        };
        store.users.push(created);
        return clone(created);
      });
    },

    async getUser(id) {
      if (!id) return null;
      const store = await getStore();
      const user = store.users.find((u) => u.id === id);
      return user ? clone(user) : null;
    },

    async getUserByEmail(email) {
      const normalized = normaliseEmail(email);
      if (!normalized) return null;
      const store = await getStore();
      const user = store.users.find((u) => u.emailLower === normalized);
      return user ? clone(user) : null;
    },

    async getUserByAccount() {
      return null;
    },

    async updateUser(update) {
      if (!update?.id) throw new Error('User id is required to update');
      return updateStore((store) => {
        const idx = store.users.findIndex((u) => u.id === update.id);
        if (idx === -1) {
          throw new Error('User not found');
        }
        const existing = store.users[idx];
        const nextEmail = update.email ? trimEmail(update.email) : existing.email;
        const merged = {
          ...existing,
          ...update,
          email: nextEmail,
          emailLower: normaliseEmail(nextEmail || existing.emailLower),
          updatedAt: nowIso(),
        };
        store.users[idx] = merged;
        return clone(merged);
      });
    },

    async deleteUser(id) {
      if (!id) return null;
      return updateStore((store) => {
        const idx = store.users.findIndex((u) => u.id === id);
        if (idx === -1) return null;
        const [removed] = store.users.splice(idx, 1);
        store.provisioning = store.provisioning.filter((p) => p.userId !== id);
        return clone(removed);
      });
    },

    async linkAccount() {
      return null;
    },

    async unlinkAccount() {
      return null;
    },

    async createSession() {
      return null;
    },

    async getSessionAndUser() {
      return null;
    },

    async updateSession() {
      return null;
    },

    async deleteSession() {
      return null;
    },

    async createVerificationToken(token) {
      if (!token?.identifier || !token?.token) {
        throw new Error('Invalid verification token payload');
      }
      return updateStore((store) => {
        store.verificationTokens = store.verificationTokens.filter(
          (entry) => entry.identifier !== token.identifier || entry.token !== token.token
        );
        const record = {
          identifier: token.identifier,
          token: token.token,
          expires: token.expires ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          createdAt: nowIso(),
        };
        store.verificationTokens.push(record);
        return clone(record);
      });
    },

    async useVerificationToken({ identifier, token }) {
      if (!identifier || !token) return null;
      return updateStore((store) => {
        const idx = store.verificationTokens.findIndex(
          (entry) => entry.identifier === identifier && entry.token === token
        );
        if (idx === -1) return null;
        const [record] = store.verificationTokens.splice(idx, 1);
        return clone(record);
      });
    },
  };
}
