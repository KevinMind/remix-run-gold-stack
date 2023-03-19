import { z } from "zod";

const {
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
  PORT,
  NODE_ENV,
  METRICS_PORT,
} = process.env;

const NodeEnv = z.enum(["development", "production", "test"]);

const envSchema = z.object({
  SESSION_SECRET: z.string().trim().min(1),
  AUTH_ZERO_DOMAIN: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_ID: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_SECRET: z.string().trim().min(1),
  AUTH_ZERO_CALLBACK_URL: z.string().trim().min(1),
  PORT: z.number().catch(3000),
  METRICS_PORT: z.number().catch(3001),
  NODE_ENV: NodeEnv.catch("development"),
});

export const env = envSchema.parse({
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
  PORT,
  METRICS_PORT,
  NODE_ENV,
});

export const isProduction = env.NODE_ENV === "production";
