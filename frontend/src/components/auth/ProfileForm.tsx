import React, { useState, useEffect } from "react";
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
import { Loader2, Save, Check } from "lucide-react";

export const ProfileForm: React.FC = () => {
  const { user, updateProfile, updateEmail, verifyEmail, isLoading, error } =
    useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    position: "",
    preferredLanguage: "ja",
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
    verificationCode: "",
  });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position || "",
        preferredLanguage: user.preferredLanguage,
      });
    }
  }, [user]);

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

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName) {
      errors.firstName = "名前は必須です";
    }

    if (!formData.lastName) {
      errors.lastName = "姓は必須です";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmailForm = () => {
    const errors: Record<string, string> = {};

    if (!emailData.newEmail) {
      errors.newEmail = "メールアドレスは必須です";
    } else if (!/\S+@\S+\.\S+/.test(emailData.newEmail)) {
      errors.newEmail = "有効なメールアドレスを入力してください";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position,
        preferredLanguage: formData.preferredLanguage,
      });

      setSuccessMessage("プロフィールが更新されました");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmailForm()) {
      return;
    }

    try {
      await updateEmail(emailData.newEmail);
      setShowVerificationForm(true);
      setShowEmailForm(false);
    } catch (error) {
      console.error("Email update error:", error);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await verifyEmail(emailData.verificationCode);
      setShowVerificationForm(false);
      setEmailData({ newEmail: "", verificationCode: "" });
      setSuccessMessage("メールアドレスが更新されました");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Email verification error:", error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">
            ユーザー情報を読み込み中...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>あなたの基本情報を管理できます</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  名前
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
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
                  姓
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
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
              <label htmlFor="position" className="text-sm font-medium">
                職位
              </label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="職位を入力"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="preferredLanguage"
                className="text-sm font-medium"
              >
                言語設定
              </label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) =>
                  handleSelectChange("preferredLanguage", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="言語を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                現在のメールアドレス
              </label>
              <Input value={user.email} disabled className="bg-gray-50" />
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={isLoading}
              >
                メールアドレスを変更
              </button>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  プロフィールを更新
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showEmailForm && (
        <Card>
          <CardHeader>
            <CardTitle>メールアドレス変更</CardTitle>
            <CardDescription>
              新しいメールアドレスを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newEmail" className="text-sm font-medium">
                  新しいメールアドレス
                </label>
                <Input
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  value={emailData.newEmail}
                  onChange={handleEmailInputChange}
                  placeholder="new@email.com"
                  className={validationErrors.newEmail ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {validationErrors.newEmail && (
                  <p className="text-sm text-red-500">
                    {validationErrors.newEmail}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    "確認コードを送信"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                  disabled={isLoading}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showVerificationForm && (
        <Card>
          <CardHeader>
            <CardTitle>メールアドレス確認</CardTitle>
            <CardDescription>
              送信された確認コードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="verificationCode"
                  className="text-sm font-medium"
                >
                  確認コード
                </label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  value={emailData.verificationCode}
                  onChange={handleEmailInputChange}
                  placeholder="確認コードを入力"
                  disabled={isLoading}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      確認中...
                    </>
                  ) : (
                    "確認コードを送信"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowVerificationForm(false);
                    setShowEmailForm(true);
                  }}
                  disabled={isLoading}
                >
                  戻る
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
