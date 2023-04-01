import type { LoaderArgs, MetaFunction } from "@vercel/remix";
import {
  authenticateRequest,
  getAuthMethod,
  optionalUser,
} from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  const method = getAuthMethod(request);

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
