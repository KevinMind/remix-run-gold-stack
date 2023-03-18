import { z } from "zod";

const {
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
} = process.env;

const envSchema = z.object({
  SESSION_SECRET: z.string().trim().min(1),
  AUTH_ZERO_DOMAIN: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_ID: z.string().trim().min(1),
  AUTH_ZERO_CLIENT_SECRET: z.string().trim().min(1),
  AUTH_ZERO_CALLBACK_URL: z.string().trim().min(1),
});

export const env = envSchema.parse({
  SESSION_SECRET,
  AUTH_ZERO_DOMAIN,
  AUTH_ZERO_CLIENT_ID,
  AUTH_ZERO_CLIENT_SECRET,
  AUTH_ZERO_CALLBACK_URL,
});
