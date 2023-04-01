import { z } from "zod";

const {
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
  NODE_ENV,
} = process.env;

const NodeEnv = z.enum(["development", "production", "test"]);

const envSchema = z.object({
  SESSION_SECRET: z.string().trim().min(1),
  AUTH_ZERO_DOMAIN: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_ID: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_SECRET: z.string().trim().min(1),
  AUTH_ZERO_CALLBACK_URL: z.string().trim().min(1),
  NODE_ENV: NodeEnv.catch("development"),
});

export const env = envSchema.parse({
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
  NODE_ENV,
});

export const isProduction = env.NODE_ENV === "production";
