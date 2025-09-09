"use client";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";

// Amplify設定を確実に読み込む
let outputs;
try {
  // For local development
  outputs = require("../../amplify_outputs.json");
} catch (error) {
  // For Amplify Hosting build environment
  try {
    outputs = require("../../../amplify_outputs.json");
  } catch (error2) {
    // Fallback to environment variables
    outputs = {
      version: "1",
      auth: {
        user_pool_id: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID,
        user_pool_client_id: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID,
        identity_pool_id: process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID,
        login_with: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_AWS_OAUTH_DOMAIN,
            scopes: ["openid", "email", "profile"],
            redirect_sign_in: [
              process.env.NEXT_PUBLIC_AWS_OAUTH_REDIRECT_SIGN_IN,
            ],
            redirect_sign_out: [
              process.env.NEXT_PUBLIC_AWS_OAUTH_REDIRECT_SIGN_OUT,
            ],
            response_type: "code",
          },
        },
      },
      data: {
        url: process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        default_authorization_type: "AMAZON_COGNITO_USER_POOLS",
        authorization_types: ["AMAZON_COGNITO_USER_POOLS"],
      },
      storage: {
        aws_region: process.env.NEXT_PUBLIC_AWS_REGION,
        bucket_name: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
      },
    };
  }
}

// Amplifyを初期化
Amplify.configure(outputs);

export function AuthInitializer() {
  useEffect(() => {
    // Amplify設定の確認ログ
    if (process.env.NODE_ENV === "development") {
      console.log("Amplify Gen2 initialized successfully");
    }
  }, []);

  return null;
}
