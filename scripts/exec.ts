import { spawnSync } from "child_process";

const [, , script, ...rest] = process.argv;

spawnSync("npm", ["run", "script", `./commands/${script}/index.ts`, ...rest], {
  stdio: "inherit",
});
