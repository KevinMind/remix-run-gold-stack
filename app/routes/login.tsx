import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "react-router";
import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  const method = new URL(request.url).searchParams.get("method") || "auth0";

  if (!["auth0", "auth0-magic"].includes(method)) {
    return redirect('/login');
  }

  await authenticator.isAuthenticated(request, {
    successRedirect: '/',
  });

  return authenticator.authenticate(method, request);
}

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  return null;
}
