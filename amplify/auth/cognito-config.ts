import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'LegalFlow3 アカウント確認',
      verificationEmailBody: (createCode) =>
        `LegalFlow3にご登録いただき、ありがとうございます。

確認コード: ${createCode}

このコードをアプリケーションに入力してアカウントを有効化してください。
このコードは24時間有効です。

LegalFlow3チーム`,
      verificationEmailStyle: 'CODE'
    },
    phone: {
      verificationMessage: (createCode) =>
        `LegalFlow3の確認コード: ${createCode}`,
      verificationMessageStyle: 'CODE'
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true
    },
    givenName: {
      required: true,
      mutable: true
    },
    familyName: {
      required: true,
      mutable: true
    },
    phoneNumber: {
      required: false,
      mutable: true
    },
    'custom:role': {
      required: true,
      mutable: true,
      dataType: 'String',
      stringAttributeConstraints: {
        minLength: '1',
        maxLength: '50'
      }
    },
    'custom:lawFirmId': {
      required: false,
      mutable: true,
      dataType: 'String',
      stringAttributeConstraints: {
        minLength: '1',
        maxLength: '50'
      }
    },
    'custom:position': {
      required: false,
      mutable: true,
      dataType: 'String',
      stringAttributeConstraints: {
        minLength: '1',
        maxLength: '100'
      }
    },
    'custom:barNumber': {
      required: false,
      mutable: true,
      dataType: 'String',
      stringAttributeConstraints: {
        minLength: '1',
        maxLength: '20'
      }
    },
    'custom:isActive': {
      required: true,
      mutable: true,
      dataType: 'Boolean'
    },
    'custom:lastLoginAt': {
      required: false,
      mutable: true,
      dataType: 'String'
    },
    'custom:preferredLanguage': {
      required: false,
      mutable: true,
      dataType: 'String',
      stringAttributeConstraints: {
        minLength: '2',
        maxLength: '5'
      }
    }
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    temporaryPasswordValidityDays: 7
  },
  mfa: {
    mode: 'OPTIONAL',
    totp: true,
    sms: true
  },
  accountRecovery: ['email'],
  triggers: {
    preSignUp: 'preSignUpTrigger',
    postConfirmation: 'postConfirmationTrigger',
    preAuthentication: 'preAuthenticationTrigger',
    postAuthentication: 'postAuthenticationTrigger',
    customMessage: 'customMessageTrigger'
  }
});
