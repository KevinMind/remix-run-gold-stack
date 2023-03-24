#!/usr/bin/env zx

import { $ } from 'zx';
import { setEnv, getEnv } from './utils.mjs';

const PORT = getEnv('PORT') || '3000';
const METRICS_PORT = getEnv('METRICS_PORT') || '3001';

await $`npm run script ./scripts/auth0-login.mjs`;
await $`npm run script ./scripts/auth0-set-env.mjs`;
await $`npm run script ./scripts/fly-login.mjs`;

setEnv('PORT', PORT.toString());
setEnv('METRICS_PORT', METRICS_PORT.toString());

await $`prisma generate`;

await $`prisma migrate deploy`;

await $`prisma db seed`;