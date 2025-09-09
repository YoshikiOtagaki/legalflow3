"use client";

// Amplify設定を確実に読み込む
import "@/lib/amplify-config";

// このコンポーネントは、Amplify設定を確実に読み込むためのものです。
// useAuthフックが自動的に認証状態を管理するため、追加の処理は不要です。
export function AuthInitializer() {
  return null;
}
