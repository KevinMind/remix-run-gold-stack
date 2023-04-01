import { $ } from "zx";
import { log } from "../utils";

export async function setGhToken(key: string, value: string): Promise<void> {
  log(`setting '${key}' in github secrets`);

  const secrets = await $`gh secret list`;

  const hasToken = secrets.stdout.match(RegExp(key));

  if (hasToken) {
    return log(`${key} is already set`);
  }

  await $`gh secret set ${key} --body ""${value}`;
  log(`${key} is set.`);
}

export default async function loginGithub() {
  try {
    $.verbose = false;
    await $`gh auth status`;
  } catch (error) {
    $.verbose = true;
    await $`gh auth login`;
  }
}
