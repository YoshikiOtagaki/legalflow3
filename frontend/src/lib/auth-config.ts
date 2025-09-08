import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

// Amplify設定
Amplify.configure({
  API: {
    GraphQL: {
      endpoint:
        process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
        "https://api.legalflow3.com/graphql",
      region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
      defaultAuthMode: "userPool",
    },
  },
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_XXXXXXXXX",
      userPoolClientId:
        process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
        "XXXXXXXXXXXXXXXXXXXXXXXXXX",
      loginWith: {
        oauth: {
          domain:
            process.env.NEXT_PUBLIC_OAUTH_DOMAIN ||
            "legalflow3.auth.us-east-1.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [
            process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN ||
              "http://localhost:3000/",
          ],
          redirectSignOut: [
            process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT ||
              "http://localhost:3000/",
          ],
          responseType: "code",
        },
        email: true,
        phone: true,
      },
      mfa: {
        mode: "OPTIONAL",
        totp: true,
        sms: true,
      },
    },
  },
});

export const client = generateClient();

// 認証設定の型定義
export interface AuthConfig {
  userPoolId: string;
  userPoolClientId: string;
  oauthDomain: string;
  redirectSignIn: string[];
  redirectSignOut: string[];
  responseType: string;
}

// 認証設定の取得
export const getAuthConfig = (): AuthConfig => {
  return {
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_XXXXXXXXX",
    userPoolClientId:
      process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
      "XXXXXXXXXXXXXXXXXXXXXXXXXX",
    oauthDomain:
      process.env.NEXT_PUBLIC_OAUTH_DOMAIN ||
      "legalflow3.auth.us-east-1.amazoncognito.com",
    redirectSignIn: [
      process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || "http://localhost:3000/",
    ],
    redirectSignOut: [
      process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || "http://localhost:3000/",
    ],
    responseType: "code",
  };
};
