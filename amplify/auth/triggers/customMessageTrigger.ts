import { CustomMessageTriggerEvent, CustomMessageTriggerHandler } from 'aws-lambda';

export const handler: CustomMessageTriggerHandler = async (event) => {
  const { userAttributes, codeParameter } = event.request;

  try {
    // カスタムメッセージの処理
    console.log('Custom message trigger for user:', userAttributes.email);

    // 必要に応じて、ここでカスタムメッセージの内容を変更
    // 例：多言語対応、ブランディングなど

    return event;
  } catch (error) {
    console.error('CustomMessageTrigger error:', error);
    throw error;
  }
};
