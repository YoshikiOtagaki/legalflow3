import { PreAuthenticationTriggerEvent, PreAuthenticationTriggerHandler } from 'aws-lambda';

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    // 認証前の処理
    console.log('Pre-authentication for user:', userAttributes.email);

    // 必要に応じて、ここでカスタムロジックを追加
    // 例：IP制限、アカウント状態の確認など

    return event;
  } catch (error) {
    console.error('PreAuthenticationTrigger error:', error);
    throw error;
  }
};
