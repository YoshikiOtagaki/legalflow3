"use client";

import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";

// Amplify設定を確実に読み込む
import "@/lib/amplify-config";

// このコンポーネントは、アプリケーションの起動時に認証状態を確認し、
// ストアを初期化する役割のみを担います。UIはレンダリングしません。
export function AuthInitializer() {
  const { checkAuthStatus } = useAuthStore();
  const [isAmplifyReady, setIsAmplifyReady] = useState(false);

  useEffect(() => {
    // Amplify設定が完了するまで待つ
    const initializeAuth = async () => {
      try {
        // Amplify設定が完了するまで待機
        let retries = 0;
        const maxRetries = 10;

        while (retries < maxRetries) {
          try {
            // Amplify設定の確認
            await new Promise((resolve) => setTimeout(resolve, 100));
            setIsAmplifyReady(true);
            break;
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              console.error("Amplify configuration timeout");
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        // Amplify設定が完了したら認証状態をチェック
        if (isAmplifyReady) {
          await checkAuthStatus();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }
    };

    initializeAuth();
  }, [checkAuthStatus, isAmplifyReady]);

  return null;
}
