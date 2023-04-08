import { $ } from "zx";

export async function pscaleExec(
  command: string,
  serviceToken: string,
  serviceTokenId: string
) {
  $.verbose = true;
  // @ts-ignore
  return await $([
    [
      "pscale",
      command,
      `--service-token ${serviceToken}`,
      `--service-token-id ${serviceTokenId}`,
    ].join(" "),
  ]);
}
