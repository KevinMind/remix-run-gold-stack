import { Link, useLoaderData, useSubmit } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { env } from "~/env.server";

import { optionalUser } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await optionalUser(request),
    env,
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const sbumit = useSubmit();

  const isUser = Boolean(data.user);

  function logout() {
    sbumit(null, { action: "/logout", method: "post" });
  }

  return (
    <>
      <div className="">
        {isUser ? (
          <div className="flex flex-col p-10">
            <pre>{JSON.stringify(data.user, null, 2)}</pre>
            <button onClick={logout}>Logout</button>
            <Link to="/logout">Logout link</Link>
          </div>
        ) : (
          <div className="flex flex-col p-10">
            <p className="my-2 mx-auto max-w-xl">
              Get a one time password to your email address. no account creation
              needed. Or login with a social profile or your email.
            </p>
            <Link
              to="/login"
              className="mx-auto my-1 rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
