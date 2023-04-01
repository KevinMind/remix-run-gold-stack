import type { LoaderArgs } from "@vercel/remix";

import { authenticateRequest, getAuthMethod } from "~/auth.server";

export let loader = ({ request }: LoaderArgs) => {
  const method = getAuthMethod(request);
  return authenticateRequest(request, method, {
    successRedirect: "/profile",
    failureRedirect: "/login",
  });
};
