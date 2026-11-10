import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { hash, verify } from "@node-rs/argon2";
import nodemailer from "nodemailer";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
let auth: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  const secret = process.env.AUTH_SECRET;
  const baseURL = process.env.APP_URL;
  if (!secret || secret.length < 32 || !baseURL)
    throw new Error("Configure AUTH_SECRET and APP_URL before signing in.");
  return betterAuth({
    appName: "PalettePlate",
    secret,
    baseURL,
    logger: { disabled: true },
    disabledPaths: [
      "/request-password-reset",
      "/reset-password",
      "/send-verification-email",
      "/verify-email",
      "/sign-in/email-otp",
      "/update-user",
      "/change-email",
      "/delete-user",
    ],
    database: drizzleAdapter(getDb(), {
      provider: "mysql",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: {
        hash: (password) =>
          hash(password, {
            algorithm: 2,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
          }),
        verify: ({ hash: encoded, password }) => verify(encoded, password),
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
        region: { type: "string", required: false, input: false },
        gender: { type: "string", required: false, input: false },
        contactNumber: { type: "string", required: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
      },
    },
    advanced: {
      useSecureCookies: baseURL.startsWith("https://"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    plugins: [
      emailOTP({
        sendVerificationOnSignUp: true,
        overrideDefaultEmailVerification: true,
        storeOTP: "hashed",
        expiresIn: 600,
        allowedAttempts: 3,
        async sendVerificationOTP({ email, otp, type }) {
          if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
            throw new Error("Email delivery is not configured.");
          const transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 1025),
            secure: process.env.SMTP_SECURE === "true",
            ...(process.env.SMTP_USER
              ? {
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                  },
                }
              : {}),
          });
          await transport.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject:
              type === "forget-password"
                ? "Reset your PalettePlate password"
                : "Verify your PalettePlate email",
            text: `Your PalettePlate code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
          });
        },
      }),
    ],
  });
}
export function getAuth() {
  return (auth ??= createAuth());
}
