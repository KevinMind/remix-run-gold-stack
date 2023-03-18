import type { LinksFunction, MetaFunction } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { env } from "~/env.server";
import { authenticator } from "./auth.server";
import { Progress } from "./components/Progress";

import tailwindStylesheetUrl from "./styles/tailwind.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Lenzhardts",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  return json({
    env,
    user: await authenticator.isAuthenticated(request),
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  const isUser = Boolean(data.user);

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Progress />
        <Outlet />
        <div>{isUser ? <p>User</p> : <p>No user</p>}</div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
