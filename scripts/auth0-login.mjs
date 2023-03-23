#!/usr/bin/env zx

import { $ } from 'zx';
import { setEnv } from './utils.mjs';

function parseDeviceConfirmationCode(input) {
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

const result = await $`auth0 login --no-input`;

const data = parseDeviceConfirmationCode(result.stderr);

setEnv('AUTH_ZERO_DOMAIN', data.tenant);