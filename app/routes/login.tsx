import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import {
  authenticateRequest,
  getAuthMethod,
  optionalUser,
} from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  const method = getAuthMethod(request);

  console.log({
    raw: new URL(request.url).searchParams.get("method"),
    method,
  });

  await optionalUser(request);

  return authenticateRequest(request, method);
}

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  return null;
}
