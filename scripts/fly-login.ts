#!/usr/bin/env zx

import { $ } from 'zx';
import {log} from './utils';

async function getToken(attempts = 0): Promise<string> {
    if (attempts > 3) throw new Error('too many attempts to get token');

    try {
        $.verbose = false;
        const result = await $`flyctl auth token`;
        
        return result.stdout;
    } catch (error) {
        // TODO fix error any
        if ((error as any).exitCode === 1) {
            $.verbose = true;
            await $`flyctl auth login`;

            return getToken(attempts + 1);
        }
        throw error;
    }
}

async function setGhToken(token: string): Promise<void> {
    try {
        log('setting `FLY_API_TOKEN` in github secrets');
        $.verbose = false;
        await $`gh auth status`;

        const secrets = await $`gh secret list`;

        const hasFlyApiToken = secrets.stdout.match(RegExp('FLY_API_TOKEN'));

        if (!hasFlyApiToken) {
            await $`gh secret set FLY_API_TOKEN --body ""${token}`;
            log('FLY_API_TOKEN is set.');
        } else {
            log('FLY_API_TOKEN is already set');
        }
    } catch (error) {
        // TODO fix error any
        if ((error as any).exitCode === 1) {
            $.verbose = true;
            await $`gh auth login`;
            return setGhToken(token);
        }

        throw error;
    }
}

const flyAccessToken = await getToken();

await setGhToken(flyAccessToken);

