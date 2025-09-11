import { PostAuthenticationTriggerEvent, PostAuthenticationTriggerHandler } from 'aws-lambda';

export const handler: PostAuthenticationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    // 認証後の処理
    console.log('Post-authentication for user:', userAttributes.email);

    // 必要に応じて、ここでカスタムロジックを追加
    // 例：ログイン履歴の記録、セッション管理など

    return event;
  } catch (error) {
    console.error('PostAuthenticationTrigger error:', error);
    throw error;
  }
};
