#!/usr/bin/env zx

import { $ } from 'zx';
import { join } from 'path';
import { setEnv, getEnv } from './utils';

const PORT = getEnv('PORT') || '3000';
const METRICS_PORT = getEnv('METRICS_PORT') || '3001';

await $`npm run script ./auth0-login.ts`;
await $`npm run script ./auth0-set-env.ts`;
await $`npm run script ./fly-login`;

setEnv('PORT', PORT.toString());
setEnv('METRICS_PORT', METRICS_PORT.toString());

// Add wrapper to $ to be able to set properties and have thmem reset automatically
$.cwd = join(process.cwd(), '..');

await $`prisma generate`;

await $`prisma migrate deploy`;

await $`prisma db seed`;

$.cwd = process.cwd();