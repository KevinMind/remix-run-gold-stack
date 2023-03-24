import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import cn from 'classnames';

import { env } from "~/env.server";

import { optionalUser } from "~/auth.server";
import type { ComponentProps, JSXElementConstructor, ReactElement, ReactNode} from "react";
import { useState } from "react";
import { TypeScript } from "~/icons/Typescript";
import { Eslint } from "~/icons/Eslint";
import { Prisma } from "~/icons/Prisma";
import { Tailwind } from "~/icons/Tailwind";
import { Auth0 } from "~/icons/Auth0";
import { Zx } from "~/icons/Zx";
import React from "react";


function Grid({ children }: {children: ReactNode}) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">{children}</div>;
};

function Column({ icon, title }: {icon: ReactElement<any, string | JSXElementConstructor<any>>; title: string;}) {
  return (
    <div className="flex flex-col items-center">
      {React.cloneElement(icon, {
        className: 'w-20 h-20 fill-purple-800',
      })}
      <h2 className="text-lg font-bold mb-2">{title}</h2>
    </div>
  );
};

function HeroLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className="px-6 py-3 rounded-full font-bold transition-colors duration-300 bg-transparent text-white border-4 border-white hover:bg-white hover:text-purple-700 hover:border-transparent">
      {children}
    </Link>
  );
};

function HeroText({children}: {children: ReactNode}) {
  return (
    <h1 className="p-10 animate-text bg-gradient-to-r from-purple-900 via-purple-700 to-blue-700 bg-clip-text text-transparent text-6xl font-black">
      {children}
    </h1>
  )
}

function Avatar ({ iconSrc, userName, className, ...rest }: React.HTMLProps<HTMLButtonElement> & {iconSrc: string; userName: string;}) {
  const [hovered, setHovered] = useState(false);
  const nameArr = userName.split('');
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
        transform: `rotate(${degree * i - 90}deg) translate(${radius * 4.5}px, ${radius}px) ${hovered ? `rotate(${90 - degree * i}deg)` : ''}`,
        letterSpacing: `${letterSpacing}px`
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
        `bg-purple-900 w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-sphere overflow-hidden bg-center bg-cover`,
        className,
      )}
      style={{
        backgroundImage: `url('${iconSrc}')`
      }}
      type="button"
    >
      <div className="absolute inset-0 flex justify-center items-center text-white font-bold text-xl tracking-wide">
        {letters}
      </div>
    </button>
  );
};

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
    <div className="bg-gradient-to-br from-purple to-blue h-screen">
      <div className="relative h-3/4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple to-transparent rounded-lg">
          {isUser && (
            <Avatar
              onClick={() => navigate('/profile')}
              className="absolute top-2 right-2"
              iconSrc={data.user?.avatar ?? 'https://picsum.photos/200'}
              userName={data?.user?.name ?? 'Kevin Meinhardt'}
            />
          )}
          <div className="flex flex-col justify-center items-center h-full z-10">
            <HeroText>The Purple Stack</HeroText>
            <div className="mt-4">
              {isUser ? (
                <HeroLink to="/logout">Logout</HeroLink>
              ): (
                <HeroLink to="/login">Login</HeroLink>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white py-10">
        <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-10 text-center font-bold">
        The Purple Stack empowers developers to create modern, scalable, and secure web applications. Auth0 provides easy-to-use authentication and authorization features, while Tailwind CSS simplifies styling for beautiful and consistent UIs. TypeScript, ESLint, and Prettier ensure high-quality, maintainable code. Vite streamlines testing and deployment. With the Purple Stack, developers can focus on building great features, from simple blogs to complex e-commerce platforms.
        </p>
        <Grid>
          <Column
            icon={<TypeScript />}
            title="Typescript"
          />
          <Column
            icon={<Eslint />}
            title="Eslint/Prettier"
          />
          <Column
            icon={<Tailwind />}
            title="Tailwind"
          />
          <Column
            icon={<Prisma />}
            title="Prisma"
          />
          <Column
            icon={<Zx  />}
            title="ZX (scripts)"
          />
          <Column
            icon={<Auth0  />}
            title="Auth0"
          />
        </Grid>
      </div>
    </div>
    </>
  );
}
