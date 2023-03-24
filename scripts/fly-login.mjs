#!/usr/bin/env zx

import { $ } from 'zx';
import {log} from './utils.mjs';

async function getToken(attempts = 0) {
    if (attempts > 3) throw new Error('max retries exceeded');

    try {
        $.verbose = false;
        const result = await $`flyctl auth token`;
        
        return result.stdout;
    } catch (error) {
        if (error.exitCode === 1) {
            $.verbose = true;
            await $`flyctl auth login`;

            return getToken(attempts + 1);
        }
    }
}

async function setGhToken(token) {
    try {
        $.verbose = false;
        await $`gh auth status`;

        const secrets = await $`gh secret list`;

        const hasFlyApiToken = secrets.stdout.match(RegExp('FLY_API_TOKEN'));

        if (!hasFlyApiToken) {
            await $`gh secret set FLY_API_TOKEN --body ""${token}`;
            log('FLY_API_TOKEN is set.');
        }
    } catch (error) {
        if (error.exitCode === 1) {
            $.verbose = true;
            await $`gh auth login`;
            return setGhToken(token);
        }
    }
}

const flyAccessToken = await getToken();

await setGhToken(flyAccessToken);

