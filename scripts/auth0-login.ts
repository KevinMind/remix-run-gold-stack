#!/usr/bin/env zx

import { $ } from 'zx';
import { setEnv, getEnv, log} from './utils';

function parseDeviceConfirmationCode(input: string) {
    const urlMatch = input.match(/Open the following URL in a browser: (\S+)/);

    const tenantMatch = input.match(/Tenant: (\S+)/);
  
    if (!urlMatch || !tenantMatch) {
      throw new Error('Input does not contain required information');
    }
  
    return {
      loginUrl: urlMatch[1],
      tenant: tenantMatch[1],
    };
}

async function isLoggedIn() {
  const authZeroDomain = getEnv('AUTH_ZERO_DOMAIN');

  if (authZeroDomain?.length) {
    try {
      $.verbose = false;
      await $`auth0 tenants list`;

      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

if (await isLoggedIn()) {
  log('already logged in...');
  process.exit(0);
}

$.verbose = true;
const result = await $`auth0 login --no-input`;

const data = parseDeviceConfirmationCode(result.stderr);

setEnv('AUTH_ZERO_DOMAIN', data.tenant);