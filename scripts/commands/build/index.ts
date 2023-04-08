import { $ } from "zx";
import { step } from "../../utils";

await step("prisma generate", async () => {
  await $`prisma generate`;
});

await step("prisma migrate", async () => {
  await $`prisma db push`;
});

await step("build", async () => {
  $.verbose = true;
  await $`pnpm exec remix build`;
});
