import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@vercel/remix";
import { json } from "@vercel/remix";
import { getUserById } from "~/models/user";

export async function loader({ request }: LoaderArgs) {
  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return json({ error: "missing id", user: null });
  }

  const user = await getUserById(Number(id));

  if (!user) {
    return json({ error: "could not find user", user: null });
  }

  return json({ error: null, user });
}

export default function User() {
  const data = useLoaderData<typeof loader>();
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
