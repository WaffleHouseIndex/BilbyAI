import crypto from 'node:crypto';
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { Resend } from 'resend';
import { createNextAuthAdapter } from '@/lib/persistence/nextAuthAdapter.js';
import { getUserById, getProvisioningForUser } from '@/lib/userStore.js';

const resendFrom = process.env.AUTH_EMAIL_FROM || 'BilbyAI <no-reply@bilby.ai>';
const resendAudience = process.env.AUTH_EMAIL_AUDIENCE || 'BilbyAI Copilot';

async function sendVerificationRequest({ identifier, url }) {
  const email = (identifier || '').trim();
  if (!email) {
    console.warn('[auth] email provider invoked without recipient');
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info('[auth] magic link (RESEND_API_KEY not set):', { email, url });
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: 'Your BilbyAI magic link',
      html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;">
  <h1 style="margin-bottom:16px;">Sign in to ${resendAudience}</h1>
  <p style="margin-bottom:16px;">Click the secure link below to access your BilbyAI console.</p>
  <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Sign in</a></p>
  <p style="margin-top:24px;color:#64748b;font-size:13px;">This link expires in 10 minutes. If you did not request it you can safely ignore this email.</p>
</body></html>`,
    });

    if (result?.error) {
      console.error('[auth] Resend send error', result.error);
      console.info('[auth] fallback magic link:', url);
    } else {
      console.info('[auth] magic link dispatched via Resend', { email, id: result?.id });
    }
  } catch (err) {
    console.error('[auth] failed to send magic link via Resend', err?.message || err);
    console.info('[auth] fallback magic link:', url);
  }
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

const adapter = createNextAuthAdapter();

export const authOptions = {
  adapter,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12,
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/check-inbox',
  },
  providers: [
    EmailProvider({
      from: resendFrom,
      sendVerificationRequest,
      maxAge: 10 * 60,
      generateVerificationToken: createToken,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.stripeCustomerId = user.stripeCustomerId || null;
        token.twilioNumberSid = user.twilioNumberSid || null;
      }
      if (token?.uid && (!token.stripeCustomerId || !token.twilioNumberSid)) {
        const stored = await getUserById(token.uid);
        if (stored) {
          token.stripeCustomerId = stored.stripeCustomerId || null;
          token.twilioNumberSid = stored.twilioNumberSid || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.uid) {
        session.user = session.user || {};
        session.user.id = token.uid;
        session.user.email = token.email || session.user.email;
        session.user.stripeCustomerId = token.stripeCustomerId || null;
        session.user.twilioNumberSid = token.twilioNumberSid || null;
        const provisioning = await getProvisioningForUser(token.uid);
        session.user.provisioning = provisioning || null;
      }
      return session;
    },
  },
  logger: {
    error(code, metadata) {
      console.error('[auth]', code, metadata);
    },
    warn(code) {
      console.warn('[auth]', code);
    },
    debug() {
          // suppress noisy auth logs
    },
  },
  trustHost: true,
};

export const authHandler = NextAuth(authOptions);
