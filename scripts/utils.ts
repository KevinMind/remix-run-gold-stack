import {fs, chalk} from 'zx';
import os from 'os';

import {config} from 'dotenv';

export function log(...args: any[]) {
    console.log(chalk.blue(...args, '\n'));
}

function readEnv() {
    return config({
        path: './.env',
    }).parsed ?? {};
}

export function setEnv(key: string, value: string) {
    const env = readEnv();

    env[key] = value;

    log(`setting ${key}=${value}`)

    fs.writeFileSync("./.env", Object.entries(env).map(([key, value]) => `${key}=${value}`).join(os.EOL));
}

export function getEnv(key: string) {
    const env = readEnv();

    return env[key];
}