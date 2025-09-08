import React from "react";
import { useAuth } from "../../hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    );
  }

  // 未認証
  if (!isAuthenticated || !user) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ログインが必要です
            </h2>
            <p className="text-gray-600 mb-4">
              このページにアクセスするにはログインしてください。
            </p>
            <a
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              ログインページへ
            </a>
          </div>
        </div>
      )
    );
  }

  // アカウントが無効
  if (!user.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            アカウントが無効です
          </h2>
          <p className="text-gray-600 mb-4">
            このアカウントは管理者により無効化されています。
          </p>
          <p className="text-sm text-gray-500">
            管理者にお問い合わせください。
          </p>
        </div>
      </div>
    );
  }

  // ロールチェック
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            アクセス権限がありません
          </h2>
          <p className="text-gray-600 mb-4">
            このページにアクセスするには <strong>{requiredRole}</strong>{" "}
            の権限が必要です。
          </p>
          <p className="text-sm text-gray-500">
            現在の権限: <strong>{user.role}</strong>
          </p>
        </div>
      </div>
    );
  }

  // 権限チェック（簡略化された実装）
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every((permission) => {
      // 実際の実装では、ユーザーの権限をチェック
      // ここでは簡略化
      return true;
    });

    if (!hasRequiredPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              アクセス権限がありません
            </h2>
            <p className="text-gray-600 mb-4">
              このページにアクセスするには追加の権限が必要です。
            </p>
            <p className="text-sm text-gray-500">
              管理者にお問い合わせください。
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// 高階コンポーネント版
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, "children"> = {},
) => {
  return (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  );
};

// ロール別のガード
export const withRoleGuard = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: string,
) => {
  return withAuthGuard(Component, { requiredRole });
};

// 権限別のガード
export const withPermissionGuard = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[],
) => {
  return withAuthGuard(Component, { requiredPermissions });
};
