import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { env } from "~/env.server";

import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await authenticator.isAuthenticated(request),
    env,
  });
}

export default function Wedding() {
  const data = useLoaderData<typeof loader>();

  const isUser = Boolean(data.user);

  return (
    <>
      <div className="">
        <div className="">
          <div className="relative h-screen">
            <div className="absolute h-screen w-full">
              <div className=" mx-auto flex flex-col py-10 px-4 text-center text-white md:max-w-7xl md:p-20">
                <h1 className="text-center text-6xl font-extrabold uppercase tracking-tight sm:text-8xl lg:text-9xl">
                  <span className="">Remix Gold Stack</span>
                </h1>

                {isUser ? (
                  <div className="flex flex-col p-10">
                    <pre>{JSON.stringify(data.user, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col p-10">
                    <Link
                      to="/login?method=auth0-magic"
                      className="mx-auto my-1 rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700"
                    >
                      Login with magic link
                    </Link>
                    <p className="my-2 mx-auto max-w-xl">
                      Get a one time password to your email address. no account
                      creation needed. Or login with a social profile or your
                      email.
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
