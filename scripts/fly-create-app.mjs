#!/usr/bin/env zx

import { $, fs } from 'zx';
import tomml from 'toml';
import { log } from './utils.mjs';

const flyToml = fs.readFileSync('./fly.toml');

const result = tomml.parse(flyToml);

const appName = result.app;

if (!appName) {
    throw new Error('app name is required');
}

// fly apps create 

$.verbose = false;

const existingApps = JSON.parse(await $`flyctl apps list --json`);

const foundApp = existingApps.some((app) => app.ID === appName);

if (foundApp) {
    log(`found app: ${appName} in fly no need to create`);
} else {
    log(`creating app: ${appName}`);
    $.verbose = true;
    await $`fly apps create ${appName}`;
    await $`fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app ${appName}`;
}

const dbName = `${appName}-db`;

const foundDb = existingApps.some((app) => app.ID === dbName);

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

