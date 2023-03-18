import { Authenticator } from "remix-auth";
import type { Auth0ExtraParams, Auth0Profile, Auth0StrategyOptions } from "remix-auth-auth0";
import { Auth0Strategy } from "remix-auth-auth0";
import { sessionStorage } from "~/session.server";
import type { User} from '~/models/user.server';
import {createUser, getUserByEmail} from '~/models/user.server';
import { env } from "./env.server";

export let authenticator = new Authenticator<User>(sessionStorage);

interface CallbackArgs {
  profile: Auth0Profile;
  extraParams: Auth0ExtraParams;
  accessToken: string;
  refreshToken: string;
}

async function callbackLogin({ accessToken, refreshToken, extraParams, profile }: CallbackArgs) {
  console.log(JSON.stringify({
    accessToken,
    refreshToken,
    extraParams,
    profile
  }, null, 2));

  const email = profile?.emails?.[0].value;

  if (!email) throw new Error('must provide email');

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  return createUser({
    email,
    avatar: null,
    name: null,
  });
}

const defaultParams: Auth0StrategyOptions = {
  callbackURL: env.AUTH_ZERO_CALLBACK_URL,
  clientID: env.AUTH_ZERO_CLIENT_ID,
  clientSecret: env.AUTH_ZERO_CLIENT_SECRET,
  domain: env.AUTH_ZERO_DOMAIN,
};

authenticator.use(
  new Auth0Strategy(
    {
      ...defaultParams,
    },
    callbackLogin,
  ),
  "auth0"
)

authenticator.use(
  new Auth0Strategy(
    {
      ...defaultParams,
      connection: 'email',
    },
    callbackLogin,
  ),
  "auth0-magic"
)