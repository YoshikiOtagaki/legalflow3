import { create } from "zustand";
import { Amplify } from "aws-amplify";
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  getCurrentUser,
  AuthUser,
} from "aws-amplify/auth";

// Amplify設定を動的に読み込み
const configureAmplify = async () => {
  try {
    const response = await fetch("/amplify_outputs.json");
    const outputs = await response.json();
    Amplify.configure(outputs);
  } catch (error) {
    console.error("Amplify設定の読み込みに失敗しました:", error);
  }
};

// ストアが持つ状態と関数の型を定義します
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
}

function isErrorWithName(error: unknown): error is { name: string } {
  return typeof error === "object" && error !== null && "name" in error;
}

// useAuthStoreフックを作成します
export const useAuthStore = create<AuthState>((set, get) => ({
  // 初期状態
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,

  // ログイン処理
  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      await configureAmplify();

      const { isSignedIn } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      if (isSignedIn) {
        const currentUser = await getCurrentUser();
        set({
          isAuthenticated: true,
          isLoading: false,
          user: currentUser,
          error: null,
        });
      }
    } catch (error: unknown) {
      console.error("ログイン中にエラーが発生しました:", error);

      let errorMessage = "ログインに失敗しました。";

      if (isErrorWithName(error)) {
        if (error.name === "NotAuthorizedException") {
          errorMessage = "メールアドレスまたはパスワードが正しくありません。";
        } else if (error.name === "UserNotConfirmedException") {
          errorMessage =
            "アカウントが確認されていません。メールの確認コードを入力してください。";
        } else if (error.name === "UserNotFoundException") {
          errorMessage = "このメールアドレスは登録されていません。";
        } else if (error.name === "TooManyRequestsException") {
          errorMessage =
            "試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。";
        }
      }

      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: errorMessage,
      });
      throw error;
    }
  },

  // 新規登録処理
  register: async (userData) => {
    set({ isLoading: true, error: null });

    try {
      await configureAmplify();

      const { userId } = await signUp({
        username: userData.email,
        password: userData.password,
        options: {
          userAttributes: {
            email: userData.email,
            name: userData.name,
          },
        },
      });

      console.log("サインアップ成功！ユーザーID:", userId);
      set({ isLoading: false, error: null });

      // 確認コード入力が必要な場合は、ここで適切な処理を行う
      // 現在は成功として扱う
    } catch (error: unknown) {
      console.error("サインアップ中にエラーが発生しました:", error);

      let errorMessage = "サインアップに失敗しました。";

      if (isErrorWithName(error)) {
        if (error.name === "InvalidPasswordException") {
          errorMessage =
            "パスワードがポリシーに適合しません。大文字、小文字、数字、記号を含む8文字以上のパスワードを入力してください。";
        } else if (error.name === "UsernameExistsException") {
          errorMessage = "このメールアドレスは既に登録されています。";
        } else if (error.name === "InvalidParameterException") {
          errorMessage =
            "入力された情報に問題があります。メールアドレスとパスワードを確認してください。";
        } else if (error.name === "LimitExceededException") {
          errorMessage =
            "試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。";
        }
      }

      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: errorMessage,
      });
      throw error;
    }
  },

  // ログアウト処理
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await signOut();
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      console.error("ログアウト中にエラーが発生しました:", error);
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: "ログアウトに失敗しました。",
      });
    }
  },

  // 認証状態の確認
  checkAuthStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      await configureAmplify();
      const currentUser = await getCurrentUser();
      set({
        isAuthenticated: true,
        isLoading: false,
        user: currentUser,
        error: null,
      });
    } catch (error) {
      // ログインしていない場合は何もしない
      console.log("ユーザーはログインしていません");
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  },

  // エラーをクリア
  clearError: () => set({ error: null }),
}));
