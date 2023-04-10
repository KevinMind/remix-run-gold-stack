import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "crypto";
import { fs } from "zx";
import { join } from "path";
import { logImportant, projectRootPath } from "./utils";

export class SecretsManager {
  private readonly directory: string;
  private readonly key: Buffer;

  constructor(password = secretPassword()) {
    this.directory = join(projectRootPath, "secrets");

    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }

    this.key = scryptSync(Buffer.from(password, "base64"), "salt", 32);
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

  public static createPassword() {
    const password = randomBytes(32).toString("base64");

    logImportant(
      `your secret is '${password}'. Save this to environment variable '${SECRET_PASSWORD}'. Make sure to keep track of this value.`
    );
    return password;
  }

  private getFilePath(key: string): string {
    return join(this.directory, `${key}.secret`);
  }
}

export const SECRET_PASSWORD = "SECRET_PASSWORD";

export const secretPassword = () => {
  const password = process.env[SECRET_PASSWORD];

  if (!password)
    throw new Error(
      `password missing in environment variables. make sure it is set at '${SECRET_PASSWORD}' in your environment`
    );

  return password;
};

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
