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
  const {user} = useLoaderData<typeof loader>();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg px-8 py-6 mb-6">
          <div className="flex items-center">
            <img
              className="w-12 h-12 rounded-full mr-4"
              src={user.avatar || "https://via.placeholder.com/150"}
              alt="User avatar"
            />
            <div>
              <h2 className="text-lg font-medium text-gray-800">
                {user.name || "Anonymous"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                Joined on {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg px-8 py-6">
          <Link to="/logout" className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">Logout</Link>
        </div>
      </div>
    </div>
  );
}
