import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
};

export const userPool = new CognitoUserPool(poolData);

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const token = session.getAccessToken();
  // Refresh if expiring within 5 minutes
  const exp = token.getExpiration();
  if (Date.now() / 1000 > exp - 300) {
    return new Promise((resolve) => {
      const user = userPool.getCurrentUser();
      if (!user) return resolve(null);
      user.refreshSession(session.getRefreshToken(), (err, newSession) => {
        if (err) return resolve(null);
        resolve(newSession.getAccessToken().getJwtToken());
      });
    });
  }
  return token.getJwtToken();
}

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

export function signUp(
  email: string,
  password: string,
  name: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    userPool.signUp(email, password, attrs, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signOut(): void {
  const user = userPool.getCurrentUser();
  user?.signOut();
}

export function getGoogleSignInUrl(redirectUri: string): string {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: redirectUri,
    identity_provider: "Google",
    scope: "openid email",
  });
  return `https://${domain}/oauth2/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

  const res = await fetch(`https://${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const tokens = await res.json();

  // Decode the username from the id_token payload (no verification needed — came directly from Cognito)
  const payload = JSON.parse(atob(tokens.id_token.split(".")[1]));
  const username: string = payload["cognito:username"] ?? payload.sub;

  // Write tokens into localStorage in the exact format amazon-cognito-identity-js expects
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.setItem(`${prefix}.LastAuthUser`, username);
  localStorage.setItem(`${prefix}.${username}.accessToken`, tokens.access_token);
  localStorage.setItem(`${prefix}.${username}.idToken`, tokens.id_token);
  if (tokens.refresh_token) {
    localStorage.setItem(`${prefix}.${username}.refreshToken`, tokens.refresh_token);
  }
  localStorage.setItem(`${prefix}.${username}.clockDrift`, "0");
}
