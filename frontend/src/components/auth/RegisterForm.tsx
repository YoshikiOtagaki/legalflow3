import React, { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Alert, AlertDescription } from "../ui/Alert";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onLogin,
}) => {
  const { signUp, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "",
    lawFirmId: "",
    position: "",
    barNumber: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  const handleSelectChange = (name: string, value: string) => {
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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "メールアドレスは必須です";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "有効なメールアドレスを入力してください";
    }

    if (!formData.password) {
      errors.password = "パスワードは必須です";
    } else if (formData.password.length < 8) {
      errors.password = "パスワードは8文字以上で入力してください";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)
    ) {
      errors.password =
        "パスワードは大文字、小文字、数字、記号を含む必要があります";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "パスワード確認は必須です";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "パスワードが一致しません";
    }

    if (!formData.firstName) {
      errors.firstName = "名前は必須です";
    }

    if (!formData.lastName) {
      errors.lastName = "姓は必須です";
    }

    if (!formData.role) {
      errors.role = "役職は必須です";
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
      await signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        lawFirmId: formData.lawFirmId || undefined,
        position: formData.position || undefined,
        barNumber: formData.barNumber || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">アカウント作成</CardTitle>
        <CardDescription>
          LegalFlow3のアカウントを作成してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                名前 *
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="太郎"
                className={validationErrors.firstName ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {validationErrors.firstName && (
                <p className="text-sm text-red-500">
                  {validationErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                姓 *
              </label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="田中"
                className={validationErrors.lastName ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {validationErrors.lastName && (
                <p className="text-sm text-red-500">
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className={validationErrors.email ? "border-red-500" : ""}
              disabled={isLoading}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              役職 *
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={validationErrors.role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="役職を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAWYER">弁護士</SelectItem>
                <SelectItem value="PARALEGAL">パラリーガル</SelectItem>
                <SelectItem value="CLIENT">クライアント</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.role && (
              <p className="text-sm text-red-500">{validationErrors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lawFirmId" className="text-sm font-medium">
              所属事務所ID
            </label>
            <Input
              id="lawFirmId"
              name="lawFirmId"
              value={formData.lawFirmId}
              onChange={handleInputChange}
              placeholder="事務所ID（オプション）"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="position" className="text-sm font-medium">
              職位
            </label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="職位（オプション）"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="barNumber" className="text-sm font-medium">
              弁護士登録番号
            </label>
            <Input
              id="barNumber"
              name="barNumber"
              value={formData.barNumber}
              onChange={handleInputChange}
              placeholder="弁護士登録番号（オプション）"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード *
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="パスワードを入力"
                className={validationErrors.password ? "border-red-500" : ""}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-sm text-red-500">
                {validationErrors.password}
              </p>
            )}
            <p className="text-xs text-gray-500">
              8文字以上、大文字、小文字、数字、記号を含む必要があります
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              パスワード確認 *
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="パスワードを再入力"
                className={
                  validationErrors.confirmPassword ? "border-red-500" : ""
                }
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-500">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                アカウント作成中...
              </>
            ) : (
              "アカウントを作成"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onLogin}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isLoading}
            >
              既にアカウントをお持ちの方はこちら
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
