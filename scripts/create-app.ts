#!/usr/bin/env zx

import { $, fs } from 'zx';
import tomml from 'toml';
import { log , getEnv} from './utils';
import { getAuthZeroApps, updateAuthZeroCallbackUrl } from './shared';

const flyToml = fs.readFileSync('../fly.toml', 'utf-8');

const result = tomml.parse(flyToml);

const appName = result.app;

if (!appName) {
    throw new Error('app name is required');
}

// fly apps create 

$.verbose = false;

const flyAppList = await $`flyctl apps list --json`;

const existingApps = JSON.parse(flyAppList.stdout);

const foundApp = existingApps.some((app: any) => app.ID === appName);

if (foundApp) {
    log(`found app: ${appName} in fly no need to create`);
} else {
    log(`creating app: ${appName}`);
    $.verbose = true;
    await $`fly apps create ${appName}`;
    await $`fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app ${appName}`;
}

const dbName = `${appName}-db`;

const foundDb = existingApps.some((app: any) => app.ID === dbName);

if (foundDb) {
    log(`found db: ${dbName}`);
} else {
    $.verbose = true;
    const region = 'ams';
    const volumeSize = 1;
    const initialClusterSize = 1;
    const vmSize = 'shared-cpu-1x';

    log(`creating database ${dbName} for ${appName}`);
    await $`fly postgres create --name ${dbName} --region ${region} --volume-size ${volumeSize} --initial-cluster-size ${initialClusterSize} --vm-size ${vmSize} `;
    await $`fly postgres attach --app ${appName} ${dbName}`;
}

// create an auth0 production app

const authZeroApps = await getAuthZeroApps();

const authZeroProductionName = `${appName}-production`;

const foundAuthZeroApp = authZeroApps.find((app: any) => app.name === authZeroProductionName);

let clientId;
let clientSecret;

const authZeroDomain = getEnv('AUTH_ZERO_DOMAIN');

$.verbose = false;

if (foundAuthZeroApp) {
    log('auth zero production app exists already...');

    const result = await $`auth0 apps show ${foundAuthZeroApp.clientId} --format json --reveal`;

    const app = JSON.parse(result.stdout);

    clientId = app['client_id'];
    clientSecret = app['client_secret'];
    
} else {
    const result = await $`auth0 apps create -n ${authZeroProductionName} -t regular --reveal --format json`;

    const app = JSON.parse(result.stdout);

    clientId = app['client_id'];
    clientSecret = app['client_secret'];
}

const baseURL = `https://${appName}.fly.dev/auth/callback`;

async function flySetSecret(key: string, value: string) {
    await $`flyctl secrets set ${key}=${value} --app ${appName} --detach`;
}

updateAuthZeroCallbackUrl(baseURL, clientId);

$.verbose = true;
await flySetSecret('AUTH_ZERO_DOMAIN', authZeroDomain);
await flySetSecret('AUTH_ZERO_CLIENT_ID', clientId);
await flySetSecret('AUTH_ZERO_CLIENT_SECRET', clientSecret);
await flySetSecret('AUTH_ZERO_CALLBACK_URL', baseURL);

