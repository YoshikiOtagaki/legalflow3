### AWS 本番環境デプロイ ToDo リスト (Amplify 中心)

**フェーズ1: AWS 環境の基盤構築**
*   AWS アカウントの準備と初期設定
*   IAM ユーザー/ロールの作成と最小権限の原則に基づいた権限設定
*   VPC (Virtual Private Cloud) の設計と構築（パブリック/プライベートサブネット、NAT Gateway、インターネットゲートウェイなど）
*   セキュリティグループとネットワークACL (NACL) の設定
*   S3 VPC ゲートウェイエンドポイントの作成

**フェーズ2: Amplify CLI のセットアップとプロジェクトの初期化**
*   Amplify CLI のインストール
*   Amplify CLI の設定 (AWS 認証情報の設定)
*   Amplify プロジェクトの初期化 (`amplify init`)

**フェーズ3: 認証機能の追加 (Amplify Auth - Cognito)**
*   Amplify Auth の追加 (`amplify add auth`)
*   Cognito ユーザープールの設定 (ユーザー名/パスワード認証、ソーシャルログインなど)
*   フロントエンドアプリケーションとの連携

**フェーズ4: データベースの追加 (Amplify API - DynamoDB)**
*   Amplify API の追加 (`amplify add api`)
*   GraphQL API または REST API の選択
*   データモデルの定義 (GraphQL Schema)
*   DynamoDB テーブルのプロvisioning
*   フロントエンドアプリケーションとの連携

**フェーズ5: バックエンドAPI の追加 (Amplify API - Lambda)**
*   Amplify API の追加 (`amplify add api`) (REST API として)
*   Node.js Express アプリケーションの Lambda 関数としてのラップ
*   API Gateway の設定
*   Lambda 関数と DynamoDB の連携設定
*   フロントエンドアプリケーションとの連携

**フェーズ6: ドキュメント生成サービスの追加 (Amplify API - Lambda)**
*   Amplify API の追加 (`amplify add api`) (REST API として)
*   Python アプリケーションの Lambda 関数としてのラップ
*   API Gateway の設定
*   フロントエンドアプリケーションとの連携

**フェーズ7: フロントエンドのデプロイ (Amplify Hosting)**
*   Amplify Hosting の設定 (`amplify add hosting`)
*   Next.js アプリケーションのビルド設定
*   カスタムドメインの設定 (Route 53 と連携)
*   SSL/TLS 証明書 (ACM) のプロビジョニングと設定

**フェーズ8: CI/CD の構築 (Amplify Console)**
*   Amplify Console を利用した自動デプロイの設定 (GitHub との連携)
*   ビルド設定の調整

**フェーズ9: 監視・ログ・セキュリティ強化**
*   CloudWatch Logs の設定 (Lambda、API Gateway)
*   CloudWatch Metrics と Alarms の設定
*   AWS WAF の設定 (API Gateway/CloudFront)
*   AWS Secrets Manager の利用 (機密情報の管理)

**フェーズ10: ドメイン・DNS 設定**
*   Amazon Route 53 でドメインの登録または既存ドメインの移行
*   各サービスの DNS レコード設定
