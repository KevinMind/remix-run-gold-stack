import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "crypto";
import { fs, os } from "zx";
import { join } from "path";
import { config } from "dotenv";
import { logImportant, projectRootPath } from "./utils";

export class SecretsManager {
  private readonly directory: string;
  private readonly key: Buffer;

  constructor() {
    this.directory = join(projectRootPath, "secrets");

    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    const password = Buffer.from(this.getPassword(), "base64");
    this.key = scryptSync(password, "salt", 32); // Use 'salt' as a fixed salt for simplicity; consider using a random salt in a real-world application
  }

  writeSecret(key: SecretKeys, value: string): void {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);

    const encryptedValue = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const ivAndEncryptedValue = Buffer.concat([
      iv,
      tag,
      encryptedValue,
    ]).toString("base64");

    fs.writeFileSync(this.getFilePath(key), ivAndEncryptedValue, "utf8");
  }

  readSecret(key: SecretKeys): string | null {
    const secretPath = this.getFilePath(key);
    if (!fs.existsSync(secretPath)) return null;
    const ivAndEncryptedValue = Buffer.from(
      fs.readFileSync(secretPath, "utf8"),
      "base64"
    );
    const iv = ivAndEncryptedValue.slice(0, 16);
    const tag = ivAndEncryptedValue.slice(16, 32);
    const encryptedValue = ivAndEncryptedValue.slice(32);

    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);

    return (
      decipher.update(encryptedValue).toString("utf8") + decipher.final("utf8")
    );
  }

  async requireSecret(key: SecretKeys, onMissing: () => Promise<string>) {
    const existing = this.readSecret(key);

    if (existing) return existing;

    const value = await onMissing();
    this.writeSecret(key, value);

    return value;
  }

  getPassword() {
    const dotEnvPath = join(projectRootPath, ".env");

    const env = config({
      path: dotEnvPath,
    }).parsed!;

    const secret = process.env[SECRET_PASSWORD] || env[SECRET_PASSWORD];

    if (secret?.length) {
      return secret;
    }

    const newSecret = randomBytes(32).toString("base64");

    fs.writeFileSync(
      dotEnvPath,
      Object.entries({ ...env, [SECRET_PASSWORD]: newSecret })
        .map(([key, value]) => `${key}=${value}`)
        .join(os.EOL)
    );

    logImportant(
      `your secret is '${newSecret}'. Saving to .env file as ${SECRET_PASSWORD}. Make sure to keep track of this value.`
    );
    return newSecret;
  }

  private getFilePath(key: string): string {
    return join(this.directory, `${key}.secret`);
  }
}

export const SECRET_PASSWORD = "SECRET_PASSWORD";

export enum SecretKeys {
  Github = "GITHUB_ACCESS_TOKEN",
  Vercel = "VERCEL_ACCESS_TOKEN",
  VercelOrgId = "VERCEL_ORG_ID",
  VercelProjectId = "VERCEL_PROJECT_ID",
  PlanetScale = "PLANETSCALE_SERVICE_TOKEN",
  PlanetScaleTokenId = "PLANETSCALE_SERVICE_TOKEN_ID",
  PlanetScaleOrg = "PLANETSCALE_ORG",
  PlanetScaleDatabase = "PLANETSSCALE_DATABASE",
}
