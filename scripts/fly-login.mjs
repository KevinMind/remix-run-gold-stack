#!/usr/bin/env zx

import { $ } from 'zx';

await $`flyctl auth login`;

const result = await $`flyctl auth token`;

const flyAccessToken = result.stdout;

await $`gh auth login`;

await $`gh secret set FLY_API_TOKEN --body ""${flyAccessToken}`;