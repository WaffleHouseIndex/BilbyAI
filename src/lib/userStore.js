import crypto from 'node:crypto';
import { getStore, updateStore } from './persistence/secureStore.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function ensureProvisioningRecord(store, userId) {
  let record = store.provisioning.find((item) => item.userId === userId);
  if (!record) {
    record = {
      id: crypto.randomUUID(),
      userId,
      stripeCustomerId: null,
      twilioNumberSid: null,
      phoneNumber: null,
      status: 'none',
      lastAttemptAt: null,
      lastError: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.provisioning.push(record);
  } else {
    if (!record.status) record.status = 'none';
    if (!Object.prototype.hasOwnProperty.call(record, 'lastAttemptAt')) {
      record.lastAttemptAt = null;
    }
    if (!Object.prototype.hasOwnProperty.call(record, 'lastError')) {
      record.lastError = null;
    }
  }
  return record;
}

export async function getUserById(userId) {
  if (!userId) return null;
  const store = await getStore();
  const user = store.users.find((u) => u.id === userId);
  return user ? clone(user) : null;
}

export async function getUserByStripeCustomer(customerId) {
  if (!customerId) return null;
  const store = await getStore();
  const record = store.provisioning.find((item) => item.stripeCustomerId === customerId);
  if (!record) return null;
  const user = store.users.find((u) => u.id === record.userId);
  return user ? clone(user) : null;
}

export async function getProvisioningForUser(userId) {
  if (!userId) return null;
  const store = await getStore();
  const record = store.provisioning.find((item) => item.userId === userId);
  return record ? clone(record) : null;
}

export async function linkStripeCustomer({ userId, customerId }) {
  if (!userId || !customerId) {
    throw new Error('userId and customerId are required');
  }
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.stripeCustomerId = customerId;
    user.updatedAt = nowIso();
    const record = ensureProvisioningRecord(store, userId);
    record.stripeCustomerId = customerId;
    if (record.status === 'none') {
      record.status = 'pending';
      record.lastAttemptAt = nowIso();
    }
    record.updatedAt = nowIso();
    return { user: clone(user), provisioning: clone(record) };
  });
}

export async function linkTwilioNumber({ userId, phoneNumber, incomingNumberSid }) {
  if (!userId || !incomingNumberSid) {
    throw new Error('userId and incomingNumberSid are required');
  }
  return updateStore((store) => {
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.twilioNumberSid = incomingNumberSid;
    user.updatedAt = nowIso();
    const record = ensureProvisioningRecord(store, userId);
    record.twilioNumberSid = incomingNumberSid;
    record.phoneNumber = phoneNumber || record.phoneNumber;
    record.status = 'active';
    record.lastAttemptAt = nowIso();
    record.lastError = null;
    record.updatedAt = nowIso();
    return { user: clone(user), provisioning: clone(record) };
  });
}

export async function markProvisioningPending(userId) {
  if (!userId) throw new Error('userId is required');
  return updateStore((store) => {
    const record = ensureProvisioningRecord(store, userId);
    record.status = 'pending';
    record.lastAttemptAt = nowIso();
    record.lastError = null;
    record.updatedAt = nowIso();
    return clone(record);
  });
}

export async function markProvisioningFailure({ userId, error }) {
  if (!userId) throw new Error('userId is required');
  return updateStore((store) => {
    const record = ensureProvisioningRecord(store, userId);
    record.status = 'error';
    record.lastAttemptAt = nowIso();
    record.lastError = error ? String(error).slice(0, 400) : 'Unknown error';
    record.updatedAt = nowIso();
    return clone(record);
  });
}

export async function listUsers() {
  const store = await getStore();
  return store.users.map((u) => clone(u));
}
