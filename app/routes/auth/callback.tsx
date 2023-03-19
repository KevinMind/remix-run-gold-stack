import type { LoaderArgs } from "@remix-run/node";

import { authenticateRequest, getAuthMethod } from "~/auth.server";

export let loader = ({ request }: LoaderArgs) => {
  const method = getAuthMethod(request);
  return authenticateRequest(request, method, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
