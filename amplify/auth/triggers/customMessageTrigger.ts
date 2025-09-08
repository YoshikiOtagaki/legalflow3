import { CustomMessageTriggerEvent, CustomMessageTriggerHandler } from 'aws-lambda';

export const handler: CustomMessageTriggerHandler = async (event) => {
  const { codeParameter, userAttributes, triggerSource } = event.request;

  switch (triggerSource) {
    case 'CustomMessage_SignUp':
      event.response.emailSubject = 'LegalFlow3 アカウント確認';
      event.response.emailMessage = createSignUpEmailMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_ResendCode':
      event.response.emailSubject = 'LegalFlow3 確認コード再送';
      event.response.emailMessage = createResendCodeEmailMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_ForgotPassword':
      event.response.emailSubject = 'LegalFlow3 パスワードリセット';
      event.response.emailMessage = createForgotPasswordEmailMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_UpdateUserAttribute':
      event.response.emailSubject = 'LegalFlow3 メールアドレス変更確認';
      event.response.emailMessage = createUpdateEmailMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_VerifyUserAttribute':
      event.response.emailSubject = 'LegalFlow3 メールアドレス確認';
      event.response.emailMessage = createVerifyEmailMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_AdminCreateUser':
      event.response.emailSubject = 'LegalFlow3 アカウント作成完了';
      event.response.emailMessage = createAdminCreateUserMessage(userAttributes.given_name, codeParameter);
      break;

    case 'CustomMessage_ResendCode':
      event.response.smsMessage = `LegalFlow3の確認コード: ${codeParameter}`;
      break;

    default:
      // デフォルトのメッセージを使用
      break;
  }

  return event;
};

function createSignUpEmailMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 アカウント確認</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、ご登録ありがとうございます</h2>
            <p>LegalFlow3にご登録いただき、誠にありがとうございます。</p>
            <p>アカウントを有効化するために、以下の確認コードをアプリケーションに入力してください：</p>
            <div class="code">${code}</div>
            <p>このコードは24時間有効です。</p>
            <p>もしこのアカウント登録に心当たりがない場合は、このメールを無視してください。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
            <p>このメールは自動送信されています。返信はできません。</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createResendCodeEmailMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 確認コード再送</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、確認コードを再送いたします</h2>
            <p>以下の確認コードをアプリケーションに入力してください：</p>
            <div class="code">${code}</div>
            <p>このコードは24時間有効です。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createForgotPasswordEmailMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 パスワードリセット</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、パスワードリセット</h2>
            <p>パスワードリセットのリクエストを受け付けました。</p>
            <p>新しいパスワードを設定するために、以下の確認コードをアプリケーションに入力してください：</p>
            <div class="code">${code}</div>
            <p>このコードは1時間有効です。</p>
            <p>もしこのリクエストに心当たりがない場合は、このメールを無視してください。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createUpdateEmailMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 メールアドレス変更確認</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、メールアドレス変更確認</h2>
            <p>メールアドレスの変更を確認するために、以下の確認コードをアプリケーションに入力してください：</p>
            <div class="code">${code}</div>
            <p>このコードは1時間有効です。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createVerifyEmailMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 メールアドレス確認</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、メールアドレス確認</h2>
            <p>メールアドレスを確認するために、以下の確認コードをアプリケーションに入力してください：</p>
            <div class="code">${code}</div>
            <p>このコードは1時間有効です。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
        </div>
    </div>
</body>
</html>
  `;
}

function createAdminCreateUserMessage(firstName: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>LegalFlow3 アカウント作成完了</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background-color: #f8fafc; }
        .code { background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LegalFlow3</h1>
        </div>
        <div class="content">
            <h2>${firstName}様、アカウントが作成されました</h2>
            <p>管理者によりLegalFlow3のアカウントが作成されました。</p>
            <p>初回ログイン時に以下の確認コードが必要です：</p>
            <div class="code">${code}</div>
            <p>このコードは24時間有効です。</p>
            <p>ログイン後は、パスワードの変更をお勧めします。</p>
        </div>
        <div class="footer">
            <p>LegalFlow3チーム</p>
        </div>
    </div>
</body>
</html>
  `;
}
