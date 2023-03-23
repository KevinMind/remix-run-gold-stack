#!/usr/bin/env zx

import choice from 'cli-select';
import 'dotenv/config';
import { $, chalk } from 'zx';
import { z } from "zod";
import { setEnv, log } from './utils.mjs';

const {
    PORT,
    METRICS_PORT,
    GITPOD_WORKSPACE_URL
} = process.env;

const env = z.object({
    GITPOD_WORKSPACE_URL: z.string().trim().min(1),
    PORT: z.number().catch(3000),
    METRICS_PORT: z.number().catch(3001),
}).parse({
    PORT,
    METRICS_PORT,
    GITPOD_WORKSPACE_URL,
});

async function getAuthZeroClientId() {
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

    return app.clientId;
}

async function getAuthZeroClientSecret(clientId) {    
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
    
    return config['_CLIENT_SECRET_'];
}

function createAuthZeroCallbackUrl(baseUrl, port) {
    // TODO: extract this to shared function
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
const clientSecret = await getAuthZeroClientSecret(clientId);
const callbackUrl = await createAuthZeroCallbackUrl(env.GITPOD_WORKSPACE_URL, env.PORT);

updateAuthZeroCallbackUrl(callbackUrl, clientId);

log('updating .env file');

setEnv('AUTH_ZERO_CLIENT_ID', clientId);
setEnv('AUTH_ZERO_CLIENT_SECRET', clientSecret);
setEnv('AUTH_ZERO_CALLBACK_URL', callbackUrl.href);
setEnv('PORT', env.PORT.toString());
setEnv('METRICS_PORT', env.METRICS_PORT.toString());

$.verbose = true;

await $`prisma generate`

await $`prisma migrate deploy`

await $`prisma db seed`

$.verbose = false