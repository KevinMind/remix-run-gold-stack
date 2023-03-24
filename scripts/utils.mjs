import {fs, chalk} from 'zx';
import os from 'os';

import {config} from 'dotenv';
import { join } from 'path';

export function log(...args) {
    console.log(chalk.blue(...args, '\n'));
}

function readEnv() {
    return config({
        path: './.env',
    }).parsed;
}

export function setEnv(key, value) {
    const env = readEnv();

    env[key] = value;

    log(`setting ${key}=${value}`)

    fs.writeFileSync("./.env", Object.entries(env).map(([key, value]) => `${key}=${value}`).join(os.EOL));
}

export function getEnv(key) {
    const env = config({
        path: join(__dirname, '..', '.env'),
    }).parsed;

    return env[key];
}