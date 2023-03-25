#!/usr/bin/env zx

import 'dotenv/config';
import { $ } from 'zx';
import { setEnv, getEnv} from './utils';

import { getAuthZeroClientId, getAuthZeroClientSecret, createAuthZeroCallbackUrl, updateAuthZeroCallbackUrl } from './shared';

const PORT = getEnv('PORT') || '3000';
const {GITPOD_WORKSPACE_URL} = process.env;

if (!GITPOD_WORKSPACE_URL) {
    throw new Error('missing GITPOD_WORKSPACE_URL');
}

async function setAuthZeroClientID() {
    const existingClientId = getEnv('AUTH_ZERO_CLIENT_ID');

    if (existingClientId?.length) {
        return existingClientId;
    }

    const clientId = await getAuthZeroClientId();

    setEnv('AUTH_ZERO_CLIENT_ID', clientId);

    return clientId;
}

async function setAuthZeroClientSecret(clientId: string) {
    const existingClientSecret = getEnv('AUTH_ZERO_CLIENT_SECRET');

    if (existingClientSecret?.length) {
        return existingClientSecret;
    }


    const clientSecret = await getAuthZeroClientSecret(clientId);

    setEnv('AUTH_ZERO_CLIENT_SECRET', clientSecret);
    
    return clientSecret;
}

$.verbose = false;

const clientId = await setAuthZeroClientID();

const callbackUrl = await createAuthZeroCallbackUrl(GITPOD_WORKSPACE_URL, PORT);

await setAuthZeroClientSecret(clientId);
await updateAuthZeroCallbackUrl(callbackUrl.href, clientId);

setEnv('AUTH_ZERO_CALLBACK_URL', callbackUrl.href);
