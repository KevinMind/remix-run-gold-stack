#!/usr/bin/env zx

import choice from 'cli-select';
import 'dotenv/config';
import { $, chalk } from 'zx';
import { setEnv, log, getEnv} from './utils.mjs';

const PORT = getEnv('PORT') || '3000';
const {GITPOD_WORKSPACE_URL} = process.env;

async function getAuthZeroClientId() {
    const existingClientId = getEnv('AUTH_ZERO_CLIENT_ID');

    if (existingClientId) {
        return existingClientId;
    }

    const allApps = await $`auth0 apps list --format json`
    
    const apps = JSON.parse(allApps.stdout).map((app) => ({
        name: app.name,
        clientId: app.client_id,
    }));

    log('Select auth0 app to use');
    
    const selectedApp = await choice({
        values: apps.map((app) => app.name),
        valueRenderer: (value, selected) => {
            const text = chalk.black(value.toString());
            if (selected) {
                return chalk.bold(chalk.underline(text));
            }
            return text;
        },
    });
    
    const app = apps[selectedApp.id];

    log(`selected: ${app.name}`);

    const clientId = app.clientId;

    setEnv('AUTH_ZERO_CLIENT_ID', clientId);

    return clientId;
}

async function getAuthZeroClientSecret(clientId) {
    const existingClientSecret = getEnv('AUTH_ZERO_CLIENT_SECRET');

    if (existingClientSecret) {
        return existingClientSecret;
    }

    function parseKeyValues(input) {
        const result = {};
      
        // Split the input string into lines
        const lines = input.split('\n');
      
        // Iterate through each line
        for (const line of lines) {
          // Use a regular expression to match a key-value pair
          const match = line.match(/([A-Z\s]+)\s+(.+)/);
      
          if (match) {
            const key = match[1].replace(/\s+/g, '_').trim();
            const value = match[2].trim();
            result[key] = value;
          }
        }
      
        return result;
    }

    const appInfo = await $`auth0 apps show ${clientId} -r`;
    
    const config = parseKeyValues(appInfo.stdout);

    const clientSecret = config['_CLIENT_SECRET_'];

    setEnv('AUTH_ZERO_CLIENT_SECRET', clientSecret);
    
    return clientSecret;
}

function createAuthZeroCallbackUrl(baseUrl, port) {
    const url = new URL(baseUrl);

    url.host = `${port}-${url.host}`;
    url.pathname = '/auth/callback';

    return url;
}

async function updateAuthZeroCallbackUrl(callbackUrl, clientId) {
    await $`auth0 apps update ${clientId} -c ${callbackUrl.href}`;
}

$.verbose = false;

const clientId = await getAuthZeroClientId();
const callbackUrl = await createAuthZeroCallbackUrl(GITPOD_WORKSPACE_URL, PORT);

updateAuthZeroCallbackUrl(callbackUrl, clientId);

setEnv('AUTH_ZERO_CALLBACK_URL', callbackUrl.href);
