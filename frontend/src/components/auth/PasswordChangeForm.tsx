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
import { Loader2, Eye, EyeOff, Check } from "lucide-react";

export const PasswordChangeForm: React.FC = () => {
  const { changePassword, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // バリデーションエラーをクリア
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.currentPassword) {
      errors.currentPassword = "現在のパスワードは必須です";
    }

    if (!formData.newPassword) {
      errors.newPassword = "新しいパスワードは必須です";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "パスワードは8文字以上で入力してください";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(
        formData.newPassword,
      )
    ) {
      errors.newPassword =
        "パスワードは大文字、小文字、数字、記号を含む必要があります";
    } else if (formData.newPassword === formData.currentPassword) {
      errors.newPassword =
        "新しいパスワードは現在のパスワードと異なる必要があります";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "パスワード確認は必須です";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "パスワードが一致しません";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await changePassword(formData.currentPassword, formData.newPassword);

      setSuccessMessage("パスワードが正常に変更されました");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error("Password change error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>パスワード変更</CardTitle>
        <CardDescription>
          セキュリティのため、定期的にパスワードを変更することをお勧めします
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              現在のパスワード
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="現在のパスワードを入力"
                className={
                  validationErrors.currentPassword ? "border-red-500" : ""
                }
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPasswords.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {validationErrors.currentPassword && (
              <p className="text-sm text-red-500">
                {validationErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              新しいパスワード
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="新しいパスワードを入力"
                className={validationErrors.newPassword ? "border-red-500" : ""}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.newPassword && (
              <p className="text-sm text-red-500">
                {validationErrors.newPassword}
              </p>
            )}
            <p className="text-xs text-gray-500">
              8文字以上、大文字、小文字、数字、記号を含む必要があります
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              新しいパスワード（確認）
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="新しいパスワードを再入力"
                className={
                  validationErrors.confirmPassword ? "border-red-500" : ""
                }
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPasswords.confirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-500">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              パスワードの要件
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 8文字以上</li>
              <li>• 大文字を含む</li>
              <li>• 小文字を含む</li>
              <li>• 数字を含む</li>
              <li>• 記号（@$!%*?&）を含む</li>
              <li>• 現在のパスワードと異なる</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                変更中...
              </>
            ) : (
              "パスワードを変更"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
