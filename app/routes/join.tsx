import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";

import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  return authenticator.isAuthenticated(request, {
    successRedirect: '/',
  });
}


export const meta: MetaFunction = () => {
  return {
    title: "Sign Up",
  };
};

export default function Join() {

  return (
    <div className="flex min-h-full flex-col justify-center z-10">
      <Form action="/auth/auth0?screen_hint=signup" method="post">
        <button>Register with Auth0</button>
      </Form>
    </div>
  );
}
