import { z } from "zod";

const { DATABASE_URL, SESSION_SECRET, NODE_ENV } = process.env;

const NodeEnv = z.enum(["development", "production", "test"]);

const envSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  SESSION_SECRET: z.string().trim().min(1),
  NODE_ENV: NodeEnv.catch("development"),
});

export const env = envSchema.parse({
  DATABASE_URL,
  SESSION_SECRET,
  NODE_ENV,
});

export const isProduction = env.NODE_ENV === "production";
