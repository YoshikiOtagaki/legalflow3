import type { PreSignUpTriggerHandler } from 'aws-lambda';

// ALLOWED_EMAIL_DOMAINSはAmplifyの環境変数で設定することを推奨
const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];

export const handler: PreSignUpTriggerHandler = async (event) => {
  const { email } = event.request.userAttributes;

  // 許可されたドメインが設定されている場合のみチェック
  if (allowedDomains.length > 0) {
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      // 許可されていないドメインの場合はエラーをスローして登録を拒否
      throw new Error(`Invalid email domain. Only ${allowedDomains.join(', ')} are allowed.`);
    }
  }

  // 自動確認を有効にする（これは正しい使い方です）
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;

  return event;
};
