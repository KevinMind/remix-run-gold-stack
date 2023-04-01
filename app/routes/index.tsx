import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import cn from "classnames";

import { env } from "~/env.server";

import { optionalUser } from "~/auth.server";
import type {
  ComponentProps,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
} from "react";
import { useState } from "react";
import { TypeScript } from "~/icons/Typescript";
import { Eslint } from "~/icons/Eslint";
import { Prisma } from "~/icons/Prisma";
import { Tailwind } from "~/icons/Tailwind";
import { Auth0 } from "~/icons/Auth0";
import { Zx } from "~/icons/Zx";
import React from "react";

function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 md:grid-cols-3">
      {children}
    </div>
  );
}

function Column({
  icon,
  title,
}: {
  icon: ReactElement<any, string | JSXElementConstructor<any>>;
  title: string;
}) {
  return (
    <div className="flex flex-col items-center">
      {React.cloneElement(icon, {
        className: "w-20 h-20 fill-purple-800",
      })}
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
    </div>
  );
}

function HeroLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className="rounded-full border-4 border-white bg-transparent px-6 py-3 font-bold text-white transition-colors duration-300 hover:border-transparent hover:bg-white hover:text-purple-700"
    >
      {children}
    </Link>
  );
}

function HeroText({ children }: { children: ReactNode }) {
  return (
    <h1 className="animate-text bg-gradient-to-r from-purple-900 via-purple-700 to-blue-700 bg-clip-text p-10 text-6xl font-black text-transparent">
      {children}
    </h1>
  );
}

function Avatar({
  iconSrc,
  userName,
  className,
  ...rest
}: React.HTMLProps<HTMLButtonElement> & { iconSrc: string; userName: string }) {
  const [hovered, setHovered] = useState(false);
  const nameArr = userName.split("");
  const letterCount = nameArr.length;
  const degree = 360 / letterCount;
  const radius = 8; // use 1/3 of avatar width/height
  const circumference = 2 * Math.PI * radius;
  const letterSpacing = circumference / letterCount;

  const letters = nameArr.map((letter, i) => (
    <span
      key={i}
      className={`absolute transition-transform`}
      style={{
        transform: `rotate(${degree * i - 90}deg) translate(${
          radius * 4.5
        }px, ${radius}px) ${hovered ? `rotate(${90 - degree * i}deg)` : ""}`,
        letterSpacing: `${letterSpacing}px`,
      }}
    >
      {letter}
    </span>
  ));

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
  }

  return (
    <button
      {...rest}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        `bg-gray-200 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-purple-900 bg-cover bg-center shadow-sphere`,
        className
      )}
      style={{
        backgroundImage: `url('${iconSrc}')`,
      }}
      type="button"
    >
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold tracking-wide text-white">
        {letters}
      </div>
    </button>
  );
}

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await optionalUser(request),
    env,
  });
}

export default function Index() {
  const navigate = useNavigate();

  const data = useLoaderData<typeof loader>();

  const isUser = Boolean(data.user);

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-purple to-blue">
        <div className="relative h-3/4">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple to-transparent">
            {isUser && (
              <Avatar
                onClick={() => navigate("/profile")}
                className="absolute top-2 right-2"
                iconSrc={data.user?.avatar ?? "https://picsum.photos/200"}
                userName={data?.user?.name ?? "Kevin Meinhardt"}
              />
            )}
            <div className="z-10 flex h-full flex-col items-center justify-center">
              <HeroText>The Purple Stack</HeroText>
              <div className="mt-4">
                {isUser ? (
                  <HeroLink to="/logout">Logout</HeroLink>
                ) : (
                  <HeroLink to="/login">Login</HeroLink>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-10">
          <p className="text-gray-600 mx-auto mb-10 max-w-3xl text-center text-lg font-bold">
            The Purple Stack empowers developers to create modern, scalable, and
            secure web applications. Auth0 provides easy-to-use authentication
            and authorization features, while Tailwind CSS simplifies styling
            for beautiful and consistent UIs. TypeScript, ESLint, and Prettier
            ensure high-quality, maintainable code. Vite streamlines testing and
            deployment. With the Purple Stack, developers can focus on building
            great features, from simple blogs to complex e-commerce platforms.
          </p>
          <Grid>
            <Column icon={<TypeScript />} title="Typescript" />
            <Column icon={<Eslint />} title="Eslint/Prettier" />
            <Column icon={<Tailwind />} title="Tailwind" />
            <Column icon={<Prisma />} title="Prisma" />
            <Column icon={<Zx />} title="ZX (scripts)" />
            <Column icon={<Auth0 />} title="Auth0" />
          </Grid>
        </div>
      </div>
    </>
  );
}
