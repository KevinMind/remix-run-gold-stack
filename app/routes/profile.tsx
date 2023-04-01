import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);

  return json({
    user,
  });
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="px-10 py-4">
        <Link
          to="/"
          className="rounded bg-purple py-2 px-4 text-white hover:bg-purple-600"
        >
          Home
        </Link>
      </div>
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-6 rounded-lg bg-white px-8 py-6 shadow-lg">
          <div className="flex items-center">
            <img
              className="mr-4 h-12 w-12 rounded-full"
              src={user.avatar || "https://via.placeholder.com/150"}
              alt="User avatar"
            />
            <div>
              <h2 className="text-gray-800 text-lg font-medium">
                {user.name || "Anonymous"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-gray-500 text-sm">
                Joined on {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white px-8 py-6 shadow-lg">
          <Link
            to="/logout"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}
