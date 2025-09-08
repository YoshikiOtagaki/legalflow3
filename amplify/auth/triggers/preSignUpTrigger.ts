import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  // メールアドレスの検証
  if (!userAttributes.email) {
    throw new Error('メールアドレスは必須です');
  }

  // ドメインホワイトリストの確認（オプション）
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
  if (allowedDomains.length > 0) {
    const emailDomain = userAttributes.email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      throw new Error('許可されていないメールドメインです');
    }
  }

  // 必須カスタム属性の確認
  if (!userAttributes['custom:role']) {
    throw new Error('役職は必須です');
  }

  // 役職の検証
  const validRoles = ['ADMIN', 'LAWYER', 'PARALEGAL', 'CLIENT'];
  if (!validRoles.includes(userAttributes['custom:role'])) {
    throw new Error('無効な役職です');
  }

  // デフォルト値の設定
  if (!userAttributes['custom:isActive']) {
    event.response.userAttributes['custom:isActive'] = 'true';
  }

  if (!userAttributes['custom:preferredLanguage']) {
    event.response.userAttributes['custom:preferredLanguage'] = 'ja';
  }

  // 自動確認を有効化（メール確認が必要な場合）
  event.response.autoConfirmUser = false;
  event.response.autoVerifyEmail = false;

  return event;
};
