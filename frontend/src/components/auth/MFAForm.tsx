import React, { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Alert, AlertDescription } from "../ui/Alert";
import { Loader2, Shield, Smartphone } from "lucide-react";

interface MFAFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MFAForm: React.FC<MFAFormProps> = ({ onSuccess, onCancel }) => {
  const { confirmSignIn, isLoading, error } = useAuth();
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // 数字のみ
    setCode(value);

    if (validationError) {
      setValidationError("");
    }
  };

  const validateCode = () => {
    if (!code) {
      setValidationError("確認コードは必須です");
      return false;
    }

    if (code.length !== 6) {
      setValidationError("確認コードは6桁で入力してください");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCode()) {
      return;
    }

    try {
      await confirmSignIn(code);
      onSuccess?.();
    } catch (error: any) {
      console.error("MFA confirmation error:", error);
    }
  };

  const handleResendCode = async () => {
    try {
      // 確認コードの再送信ロジック
      console.log("Resending MFA code...");
    } catch (error) {
      console.error("Resend code error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">二要素認証</CardTitle>
        <CardDescription>
          セキュリティのため、確認コードを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              確認コード
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="000000"
              maxLength={6}
              className={`text-center text-2xl tracking-widest ${validationError ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <p className="text-xs text-gray-500">
              認証アプリまたはSMSで受信した6桁のコードを入力してください
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  確認中...
                </>
              ) : (
                "確認"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={isLoading}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              コードを再送信
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onCancel}
                disabled={isLoading}
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            確認コードが見つからない場合
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 認証アプリを確認してください</li>
            <li>• SMSメッセージを確認してください</li>
            <li>• コードの有効期限（通常5分）を確認してください</li>
            <li>• 上記の「コードを再送信」ボタンをクリックしてください</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
