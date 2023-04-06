import { $ } from "zx";
import { step } from "../../utils";

await step("prisma generate", async () => {
  await $`pnpm exec prisma generate`;
});

await step("prisma migrate", async () => {
  await $`pnpm exec prisma db push`;
});

await step("db seed", async () => {
  await $`pnpm exec prisma db seed`;
});
