import { Authenticator } from "remix-auth";
import type {
  Auth0ExtraParams,
  Auth0Profile,
  Auth0StrategyOptions,
} from "remix-auth-auth0";
import { Auth0Strategy } from "remix-auth-auth0";
import { sessionStorage } from "~/session.server";
import type { User } from "~/models/user.server";
import { createUser, getUserByEmail } from "~/models/user.server";
import { env } from "./env.server";

let authenticator = new Authenticator<User>(sessionStorage);

const HOME_PATH = "/";
const LOGIN_PATH = "/login";

export enum AuthMethods {
  Standard = "auth0",
}

export async function logout(
  request: Request,
  options: Parameters<typeof authenticator.logout>[1] = {
    redirectTo: HOME_PATH,
  }
) {
  return authenticator.logout(request, options);
}

export async function requireUser(
  request: Request,
  options: Parameters<typeof authenticator.isAuthenticated>[1] = {
    successRedirect: HOME_PATH,
    failureRedirect: LOGIN_PATH,
  }
) {
  await authenticator.isAuthenticated(request, options);
}

export async function optionalUser(request: Request) {
  return authenticator.isAuthenticated(request);
}

export function authenticateRequest(
  request: Request,
  method: AuthMethods,
  options: Parameters<typeof authenticator.authenticate>[2] = {
    successRedirect: HOME_PATH,
  }
) {
  return authenticator.authenticate(method, request, options);
}

export function getAuthMethod(request: Request): AuthMethods {
  const method = new URL(request.url).searchParams.get("authMethod");

  if (method) {
    const validMethods = Object.values(AuthMethods);

    if (validMethods.includes(method as AuthMethods)) {
      return method as AuthMethods;
    }
  }

  return AuthMethods.Standard;
}

interface CallbackArgs {
  profile: Auth0Profile;
  extraParams: Auth0ExtraParams;
  accessToken: string;
  refreshToken: string;
}

async function callbackLogin({
  accessToken,
  refreshToken,
  extraParams,
  profile,
}: CallbackArgs) {
  console.log(
    JSON.stringify(
      {
        accessToken,
        refreshToken,
        extraParams,
        profile,
      },
      null,
      2
    )
  );

  const email = profile?.emails?.[0].value;

  if (!email) throw new Error("must provide email");

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

type Method = {
  [key in AuthMethods]: Auth0StrategyOptions;
};

const authenticationMethods: Method = {
  [AuthMethods.Standard]: defaultParams,
  // add more auth methods below
  /*
  [AuthMethods.CustomStrategy]: {...defaultParams, connection: ''}
  */
};

for (let [authMethod, options] of Object.entries(authenticationMethods)) {
  authenticator.use(
    new Auth0Strategy<User>(options, callbackLogin),
    authMethod
  );
}
