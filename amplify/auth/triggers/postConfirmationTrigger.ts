import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;

  try {
    // ユーザー確認後の処理
    console.log('User confirmed:', userAttributes.email);

    // 必要に応じて、ここでカスタムロジックを追加
    // 例：ウェルカムメールの送信、初期データの設定など

    return event;
  } catch (error) {
    console.error('PostConfirmationTrigger error:', error);
    throw error;
  }
};
