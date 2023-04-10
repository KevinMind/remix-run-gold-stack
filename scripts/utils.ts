import { fs, chalk, $, spinner } from "zx";
import os from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { config } from "dotenv";

import pkgJson from "../package.json" assert { type: "json" };

export { pkgJson };

const __dirname = dirname(fileURLToPath(import.meta.url));

export const projectRootPath = join(__dirname, "..");
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

export async function step<T = never>(
  name: string,
  cb: () => Promise<T>,
  options: { spinner: boolean } = { spinner: true }
) {
  logStep(`step: ${name}`);

  const result = options.spinner ? await spinner(async () => cb()) : await cb();

  return result;
}

export async function withTmpPath(
  value: string,
  cb: (tmpPath: string) => Promise<void>
) {
  const tmpDir = join(projectRootPath, 'tmp');
  const tmpPath = join(tmpDir, `tmp-${Math.random() * 1_000}.secret`);

  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  fs.writeFileSync(tmpPath, value);

  try {
    await cb(tmpPath);
  } finally {
    fs.removeSync(tmpPath);
  }
}

