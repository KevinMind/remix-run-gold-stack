#!/usr/bin/env zx

import 'dotenv/config';
import { $ } from 'zx';
import { setEnv, getEnv} from './utils.mjs';

import { getAuthZeroClientId, getAuthZeroClientSecret, createAuthZeroCallbackUrl, updateAuthZeroCallbackUrl } from './shared.mjs';

const PORT = getEnv('PORT') || '3000';
const {GITPOD_WORKSPACE_URL} = process.env;

async function setAuthZeroClientID() {
    const existingClientId = getEnv('AUTH_ZERO_CLIENT_ID');

    if (existingClientId.length) {
        return existingClientId;
    }

    const clientId = getAuthZeroClientId();

    setEnv('AUTH_ZERO_CLIENT_ID', clientId);

    return clientId;
}

async function setAuthZeroClientSecret(clientId) {
    const existingClientSecret = getEnv('AUTH_ZERO_CLIENT_SECRET');

    if (existingClientSecret.length) {
        return existingClientSecret;
    }


    const clientSecret = getAuthZeroClientSecret(clientId);

    setEnv('AUTH_ZERO_CLIENT_SECRET', clientSecret);
    
    return clientSecret;
}

$.verbose = false;

const clientId = await setAuthZeroClientID();

const callbackUrl = await createAuthZeroCallbackUrl(GITPOD_WORKSPACE_URL, PORT);

await setAuthZeroClientSecret(clientId);
await updateAuthZeroCallbackUrl(callbackUrl.href, clientId);

setEnv('AUTH_ZERO_CALLBACK_URL', callbackUrl.href);
