import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { env } from "~/env.server";

import { authenticator } from "~/auth.server";


export async function loader({request}: LoaderArgs) {
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

            <div className="absolute w-full h-screen">
              <div className=" text-white text-center flex flex-col py-10 px-4 md:p-20 md:max-w-7xl mx-auto">
                <h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl uppercase">
                  <span className="">
                    Remix Gold Stack
                  </span>
                </h1>


                {isUser ? (
                  <div className="p-10 flex flex-col">
                    <pre>
                      {JSON.stringify(data.user, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-10 flex flex-col">
                    <Link
                      to="/login?method=auth0-magic"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-auto my-1"
                    >
                      Login with magic link
                    </Link>
                    <p className="my-2 max-w-xl mx-auto">
                      Get a one time password to your email address. no account creation needed. Or login with a social profile or your email.
                    </p>
                    <Link
                      to="/login"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-auto my-1"
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
  )
}
