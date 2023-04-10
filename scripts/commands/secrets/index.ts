import { SecretsManager } from "../../secrets";
import { step, log } from "../../utils";

const secrets = new SecretsManager();

const key = "TEST_SECRET";

const secret = await step("write secret", async () => {
  const required = await secrets.requireSecret(key, async () => {
    return (Math.random() * 1_000).toString();
  });

  return required;
});

log(`my secret is`, secret);
