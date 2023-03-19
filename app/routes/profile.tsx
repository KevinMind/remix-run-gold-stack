import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/auth.server";

export async function loader({ request }: LoaderArgs) {
  const user = await requireUser(request);

  return json({
    user,
  });
}

export default function Profile() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
