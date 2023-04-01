#!/usr/bin/env zx

import { $ } from "zx";
import { z } from "zod";
import { setEnv, getEnv, step } from "../../utils";

import auth0Login, {
  createAuthZeroCallbackUrl,
  getAuthZeroClientId,
  getAuthZeroClientSecret,
  updateAuthZeroCallbackUrl,
} from "../../services/auth0";
import flyLogin from "../../services/fly";
import loginGithub, { setGhToken } from "../../services/github";

const envSchema = z.object({
  PORT: z.string().catch("3000"),
  METRICS_PORT: z.string().catch("30001"),
  GITPOD_WORKSPACE_URL: z.string().min(1),
});

const env = await step<z.infer<typeof envSchema>>("basic env", async () => {
  const { GITPOD_WORKSPACE_URL } = process.env;
  const PORT = getEnv("PORT") || "3000";
  const METRICS_PORT = getEnv("METRICS_PORT") || "3001";

  setEnv("PORT", PORT.toString());
  setEnv("METRICS_PORT", METRICS_PORT.toString());

  if (!GITPOD_WORKSPACE_URL) {
    throw new Error("missing GITPOD_WORKSPACE_URL");
  }

  return envSchema.parse({
    PORT,
    METRICS_PORT,
    GITPOD_WORKSPACE_URL,
  });
});

await step("auth0 client setup", async () => {
  // login to auth0
  await auth0Login();

  // set auth0 related environment variables
  $.verbose = false;

  async function setAuthZeroClientID() {
    const existingClientId = getEnv("AUTH_ZERO_CLIENT_ID");

    if (existingClientId?.length) {
      return existingClientId;
    }

    const clientId = await getAuthZeroClientId();

    setEnv("AUTH_ZERO_CLIENT_ID", clientId);

    return clientId;
  }

  async function setAuthZeroClientSecret(clientId: string) {
    const existingClientSecret = getEnv("AUTH_ZERO_CLIENT_SECRET");

    if (existingClientSecret?.length) {
      return existingClientSecret;
    }

    const clientSecret = await getAuthZeroClientSecret(clientId);

    setEnv("AUTH_ZERO_CLIENT_SECRET", clientSecret);

    return clientSecret;
  }

  const clientId = await setAuthZeroClientID();

  const callbackUrl = createAuthZeroCallbackUrl(
    env.GITPOD_WORKSPACE_URL,
    env.PORT
  );

  await setAuthZeroClientSecret(clientId);
  await updateAuthZeroCallbackUrl(callbackUrl.href, clientId);

  setEnv("AUTH_ZERO_CALLBACK_URL", callbackUrl.href);
});

await step("fly.io cli", async () => {
  // login to fly.io
  $.verbose = true;
  const flyToken = await flyLogin();

  // login to github
  await loginGithub();

  // set fly token in github secrets
  await setGhToken("FLY_API_TOKEN", flyToken);
});

await step("prisma client + db seed", async () => {
  await $`prisma generate`;

  await $`prisma migrate deploy`;

  await $`prisma db seed`;
});
