import {fs, chalk} from 'zx';
import os from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {config} from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRootPath = join(__dirname, '..');
const dotEnvPath = join(projectRootPath, '.env');

export function log(...args: any[]) {
    console.log(chalk.blue(...args, '\n'));
}

function readEnv() {
    return config({
        path: dotEnvPath,
    }).parsed ?? {};
}

export function setEnv(key: string, value: string) {
    const env = readEnv();

    env[key] = value;

    log(`setting ${key}=${value}`)

    fs.writeFileSync(dotEnvPath, Object.entries(env).map(([key, value]) => `${key}=${value}`).join(os.EOL));
}

export function getEnv(key: string) {
    const env = readEnv();

    return env[key];
}