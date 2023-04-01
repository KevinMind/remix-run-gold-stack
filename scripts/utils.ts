import { fs, chalk, $, spinner } from "zx";
import os from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectRootPath = join(__dirname, "..");
const dotEnvPath = join(projectRootPath, ".env");

$.cwd = projectRootPath;

export function log(...args: any[]) {
  console.log(chalk.blue(...args, "\n"));
}

export function logImportant(...args: any[]) {
  console.log(
    chalk.bgBlue(chalk.white(chalk.bold("IMPORTANT!"), ...args, "\n"))
  );
}

function logStep(...args: any[]) {
  console.log(chalk.green("<----", ...args, "---->", "\n"));
}

function readEnv() {
  return (
    config({
      path: dotEnvPath,
    }).parsed ?? {}
  );
}

export function setEnv(key: string, value: string) {
  const env = readEnv();

  env[key] = value;

  log(`setting ${key}=${value}`);

  fs.writeFileSync(
    dotEnvPath,
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join(os.EOL)
  );
}

export function getEnv(key: string) {
  const env = readEnv();

  return env[key];
}

export async function step<T = never>(name: string, cb: () => Promise<T>) {
  logStep(`step: ${name}`);

  const result = await spinner(async () => cb());

  return result;
}
