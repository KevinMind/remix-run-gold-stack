import choice from 'cli-select';
import 'dotenv/config';
import { $, chalk } from 'zx';
import { log} from './utils.mjs';

export async function getAuthZeroApps() {
    const allApps = await $`auth0 apps list --format json`
    
    const apps = JSON.parse(allApps.stdout).map((app) => ({
        name: app.name,
        clientId: app.client_id,
    }));

    return apps;
}

export async function getAuthZeroClientId() {
    const apps = await getAuthZeroApps();

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

    return clientId;
}

export async function getAuthZeroClientSecret(clientId) {
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
    
    return clientSecret;
}

export function createAuthZeroCallbackUrl(baseUrl, port) {
    const url = new URL(baseUrl);

    url.host = `${port}-${url.host}`;
    url.pathname = '/auth/callback';

    return url;
}

export async function updateAuthZeroCallbackUrl(callbackUrl, clientId) {
    await $`auth0 apps update ${clientId} -c ${callbackUrl}`;
}