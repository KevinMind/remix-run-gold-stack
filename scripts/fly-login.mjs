#!/usr/bin/env zx

import { $ } from 'zx';
// import { setEnv } from './utils.mjs';

const result = await $`flyctl auth token`;

const flyAccessToken = result.stdout;

await $`gh auth login`;

await $`gh secret set FLY_API_TOKEN --body ""${flyAccessToken}`;