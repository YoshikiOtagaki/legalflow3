"use client";

import { useAuthStore } from "@/store/auth";
import { useEffect } from "react";

// このコンポーネントは、アプリケーションの起動時に認証状態を確認し、
// ストアを初期化する役割のみを担います。UIはレンダリングしません。
export function AuthInitializer() {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // コンポーネントがマウントされたときに一度だけ実行
    checkAuthStatus();
  }, [checkAuthStatus]);

  return null;
}
