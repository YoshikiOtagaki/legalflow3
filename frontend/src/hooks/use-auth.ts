import { useState, useEffect, useCallback } from "react";
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  updateUserAttributes,
  fetchUserAttributes,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

// ユーザー情報の型定義
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  lawFirmId?: string;
  position?: string;
  barNumber?: string;
  isActive: boolean;
  preferredLanguage: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// 認証状態の型定義
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 認証フック
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // ユーザー情報の取得
  const fetchUser = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const cognitoUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const user: User = {
        id: cognitoUser.username,
        email: attributes.email || "",
        firstName: attributes.given_name || "",
        lastName: attributes.family_name || "",
        role: attributes["custom:role"] || "",
        lawFirmId: attributes["custom:lawFirmId"],
        position: attributes["custom:position"],
        barNumber: attributes["custom:barNumber"],
        isActive: attributes["custom:isActive"] === "true",
        preferredLanguage: attributes["custom:preferredLanguage"] || "ja",
        lastLoginAt: attributes["custom:lastLoginAt"],
        emailVerified: attributes.email_verified === "true",
        phoneVerified: attributes.phone_number_verified === "true",
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Failed to fetch user information",
      });
    }
  }, []);

  // ログイン
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        console.log("signIn function called with:", { email, password: "***" });
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        console.log("Calling amplifySignIn...");
        const cognitoUser = await amplifySignIn({ username: email, password });
        console.log("amplifySignIn result:", cognitoUser);

        if (
          cognitoUser.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE"
        ) {
          // MFAが必要な場合
          throw new Error("MFA_REQUIRED");
        }

        console.log("Calling fetchUser...");
        await fetchUser();
        console.log("Sign in completed successfully");
      } catch (error: any) {
        console.error("Sign in error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Sign in failed",
        }));
        throw error;
      }
    },
    [fetchUser],
  );

  // MFA認証
  const confirmSignIn = useCallback(async (code: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Amplify v6では、MFAはsignInの続きで処理される
      // この関数は現在の実装では使用されない
      throw new Error("MFA confirmation not implemented in current version");
    } catch (error: any) {
      console.error("MFA confirmation error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "MFA confirmation failed",
      }));
      throw error;
    }
  }, []);

  // ログアウト
  const signOut = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await amplifySignOut();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Sign out failed",
      }));
    }
  }, []);

  // ユーザー登録
  const signUp = useCallback(
    async (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
      lawFirmId?: string;
      position?: string;
      barNumber?: string;
    }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const { user } = await amplifySignUp({
          username: userData.email,
          password: userData.password,
          attributes: {
            email: userData.email,
            given_name: userData.firstName,
            family_name: userData.lastName,
            "custom:role": userData.role,
            "custom:lawFirmId": userData.lawFirmId || "",
            "custom:position": userData.position || "",
            "custom:barNumber": userData.barNumber || "",
            "custom:isActive": "true",
            "custom:preferredLanguage": "ja",
          },
        });

        setAuthState((prev) => ({ ...prev, isLoading: false }));

        return user;
      } catch (error: any) {
        console.error("Sign up error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Sign up failed",
        }));
        throw error;
      }
    },
    [],
  );

  // 確認コード送信
  const confirmSignUpUser = useCallback(async (email: string, code: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await confirmSignUp({ username: email, confirmationCode: code });

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error("Confirm sign up error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Confirmation failed",
      }));
      throw error;
    }
  }, []);

  // 確認コード再送信
  const resendConfirmationCode = useCallback(async (email: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await resendSignUpCode({ username: email });

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error("Resend confirmation code error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to resend confirmation code",
      }));
      throw error;
    }
  }, []);

  // パスワードリセット
  const forgotPassword = useCallback(async (email: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await resetPassword({ username: email });

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to send password reset email",
      }));
      throw error;
    }
  }, []);

  // パスワードリセット確認
  const forgotPasswordSubmit = useCallback(
    async (email: string, code: string, newPassword: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        await confirmResetPassword({
          username: email,
          confirmationCode: code,
          newPassword,
        });

        setAuthState((prev) => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        console.error("Forgot password submit error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to reset password",
        }));
        throw error;
      }
    },
    [],
  );

  // パスワード変更
  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        await updatePassword({ oldPassword, newPassword });

        setAuthState((prev) => ({ ...prev, isLoading: false }));
      } catch (error: any) {
        console.error("Change password error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to change password",
        }));
        throw error;
      }
    },
    [],
  );

  // プロフィール更新
  const updateProfile = useCallback(
    async (attributes: {
      firstName?: string;
      lastName?: string;
      position?: string;
      preferredLanguage?: string;
    }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const updateAttributes: Record<string, string> = {};
        if (attributes.firstName)
          updateAttributes.given_name = attributes.firstName;
        if (attributes.lastName)
          updateAttributes.family_name = attributes.lastName;
        if (attributes.position)
          updateAttributes["custom:position"] = attributes.position;
        if (attributes.preferredLanguage)
          updateAttributes["custom:preferredLanguage"] =
            attributes.preferredLanguage;

        await updateUserAttributes({ userAttributes: updateAttributes });

        await fetchUser();
      } catch (error: any) {
        console.error("Update profile error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to update profile",
        }));
        throw error;
      }
    },
    [fetchUser],
  );

  // メールアドレス変更
  const updateEmail = useCallback(async (newEmail: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await updateUserAttributes({ userAttributes: { email: newEmail } });

      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error("Update email error:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to update email",
      }));
      throw error;
    }
  }, []);

  // メールアドレス確認
  const verifyEmail = useCallback(
    async (code: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Note: Email verification is handled differently in Amplify v6
        // This would typically be done through a custom API or different flow
        throw new Error("Email verification not implemented in this version");

        await fetchUser();
      } catch (error: any) {
        console.error("Verify email error:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to verify email",
        }));
        throw error;
      }
    },
    [fetchUser],
  );

  // 認証状態の監視
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        await getCurrentUser();
        await fetchUser();
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuthState();

    // Hubイベントの監視
    const hubListener = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signIn":
          fetchUser();
          break;
        case "signOut":
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          break;
        case "signUp":
          setAuthState((prev) => ({ ...prev, isLoading: false }));
          break;
        case "signIn_failure":
        case "signUp_failure":
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: payload.data?.message || "Authentication failed",
          }));
          break;
      }
    });

    return () => {
      hubListener();
    };
  }, [fetchUser]);

  return {
    ...authState,
    authLoading: authState.isLoading,
    signIn,
    confirmSignIn,
    signOut,
    signUp,
    confirmSignUp: confirmSignUpUser,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    changePassword,
    updateProfile,
    updateEmail,
    verifyEmail,
    fetchUser,
  };
};
