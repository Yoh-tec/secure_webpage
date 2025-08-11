# 個人情報管理システム - Form Portfolio

## 📋 概要

個人情報を安全に収集・管理するためのWebアプリケーションです。AWSのクラウドサービスを活用し、セキュリティとスケーラビリティを重視した設計となっています。

## ✨ 主な機能

- **個人情報入力フォーム**: 氏名、生年月日、マイナンバー、連絡先などの情報を収集
- **管理者ダッシュボード**: 登録されたデータの閲覧・管理
- **セキュリティ機能**: 管理者認証、データマスキング、HTTPS通信
- **データエクスポート**: CSV形式でのデータ出力

## 🏗️ アーキテクチャ

### フロントエンド
- HTML5 + CSS3 + JavaScript (ES6+)
- レスポンシブデザイン対応
- モバイルファースト設計

### バックエンド
- **AWS Lambda**: サーバーレス関数
- **Amazon DynamoDB**: NoSQLデータベース
- **Amazon API Gateway**: RESTful API
- **Amazon S3**: 静的Webサイトホスティング
- **Amazon CloudFront**: CDN配信

### インフラストラクチャ
- **Terraform**: Infrastructure as Code
- **AWS IAM**: セキュリティ管理
- **CloudWatch**: 監視・アラート

## 🚀 デプロイ方法

### 前提条件
- AWS CLI がインストールされている
- Terraform がインストールされている
- AWS認証情報が設定されている

### 手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/Yoh-tec/secure_webpage.git
   cd secure_webpage
   ```

2. **Terraformでデプロイ**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **出力されたURLでアクセス**
   ```bash
   terraform output cloudfront_domain
   ```

## 🌐 アクセス方法

### メインページ（フォーム）
```
https://[cloudfront-domain].cloudfront.net
```

### 管理者ページ
```
https://[cloudfront-domain].cloudfront.net/admin.html
```

### APIエンドポイント
```
https://[api-gateway-url]/form
```

## 🔐 セキュリティ機能

- **HTTPS通信**: 全通信が暗号化
- **管理者認証**: パスワードベースの認証
- **データマスキング**: マイナンバーの一部をマスク表示
- **CORS設定**: 適切なクロスオリジン制御
- **IAMロール**: 最小権限の原則

## �� 対応デバイス

- デスクトップPC
- タブレット
- スマートフォン
- レスポンシブデザイン対応

## 🛠️ 開発環境

### 必要なツール
- Node.js (v18以上)
- AWS CLI
- Terraform
- モダンブラウザ

### ローカル開発
```bash
# 依存関係のインストール
npm install

# ローカルサーバーの起動（必要に応じて）
python -m http.server 8000
```

## 📊 監視・アラート

- **CloudWatch**: Lambda関数の実行回数、API Gatewayのリクエスト数
- **SNS**: コスト超過アラート
- **DynamoDB**: 読み書き容量の監視
- **S3**: バケットサイズの監視

## 🔧 カスタマイズ

### 環境変数
- `ADMIN_PASSWORD`: 管理者パスワード
- `ALERT_EMAIL`: アラート通知用メールアドレス

### 設定ファイル
- `terraform/main.tf`: インフラ設定
- `lambda-function.js`: Lambda関数のロジック
- `admin-script-aws-updated.js`: 管理者ページのスクリプト

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。

## 🔄 更新履歴

- **v1.0.0**: 初期リリース
  - 基本的なフォーム機能
  - 管理者ダッシュボード
  - AWSインフラの構築

---

**注意**: このシステムは個人情報を扱います。本格運用前にセキュリティ監査を実施し、適切な法的要件を満たしていることを確認してください。 