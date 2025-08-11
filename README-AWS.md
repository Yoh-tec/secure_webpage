# 🚀 AWS無料インフラ構築ポートフォリオ

## 📋 プロジェクト概要

個人情報入力フォームシステムをAWSの無料サービスを使用して構築したポートフォリオプロジェクトです。サーバーレスアーキテクチャを採用し、完全に無料で運用可能なWebアプリケーションを実現しています。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ユーザー      │    │   CloudFront    │    │   S3 Bucket     │
│   (ブラウザ)    │───▶│   (CDN/HTTPS)   │───▶│ (静的ホスティング)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  API Gateway    │
                       │   (REST API)    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Lambda        │───▶│   DynamoDB      │
                       │ (サーバーレス)  │    │   (データベース) │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ 使用技術

### フロントエンド
- **HTML5/CSS3**: レスポンシブデザイン
- **JavaScript (ES6+)**: モダンなフロントエンド開発
- **S3**: 静的Webサイトホスティング

### バックエンド
- **AWS Lambda**: サーバーレス関数
- **API Gateway**: REST API
- **DynamoDB**: NoSQLデータベース

### インフラ
- **CloudFront**: CDNとHTTPS
- **Terraform**: インフラのコード化
- **IAM**: セキュリティ管理

## 💰 コスト分析

### AWS無料枠の活用
| サービス | 無料枠 | 使用量 | コスト |
|---------|--------|--------|--------|
| S3 | 5GB/月 | ~1MB | 無料 |
| CloudFront | 1TB/月 | ~10GB/月 | 無料 |
| Lambda | 100万リクエスト/月 | ~1000/月 | 無料 |
| API Gateway | 100万リクエスト/月 | ~1000/月 | 無料 |
| DynamoDB | 25GB + 25WCU/25RCU | ~1GB | 無料 |

**総コスト: 0円/月** 🎉

## 🚀 デプロイ手順

### 1. 前提条件
```bash
# 必要なツールのインストール
brew install awscli terraform  # macOS
# または
sudo apt install awscli terraform  # Ubuntu
```

### 2. AWS認証情報の設定
```bash
aws configure
# AWS Access Key ID: [入力]
# AWS Secret Access Key: [入力]
# Default region name: ap-northeast-1
# Default output format: json
```

### 3. デプロイの実行
```bash
# デプロイスクリプトに実行権限を付与
chmod +x deploy.sh

# デプロイの実行
./deploy.sh
```

### 4. アクセス情報
デプロイ完了後、以下のURLでアクセス可能：
- **メインフォーム**: `https://[cloudfront-domain]`
- **管理者ページ**: `https://[cloudfront-domain]/admin.html`
- **管理者パスワード**: `Password`

## 📊 実装した機能

### フロントエンド機能
- ✅ レスポンシブデザイン
- ✅ リアルタイムバリデーション
- ✅ マイナンバー入力制限（12桁）
- ✅ 電話番号自動フォーマット
- ✅ エラーハンドリング

### バックエンド機能
- ✅ サーバーレスAPI
- ✅ データベース保存
- ✅ 管理者認証
- ✅ データエクスポート（CSV）
- ✅ CORS対応

### インフラ機能
- ✅ HTTPS対応
- ✅ CDN配信
- ✅ 自動スケーリング
- ✅ 高可用性
- ✅ セキュリティ設定

## 🔧 技術的な工夫

### 1. サーバーレスアーキテクチャ
- サーバー管理不要
- 自動スケーリング
- 使用した分だけ課金

### 2. セキュリティ対策
- HTTPS通信
- IAMロールによる最小権限
- 入力値検証
- SQLインジェクション対策

### 3. パフォーマンス最適化
- CloudFrontによる高速配信
- 静的ファイルのキャッシュ
- Lambda関数の最適化

### 4. 運用性
- Terraformによるインフラのコード化
- 自動デプロイスクリプト
- 監視・ログ機能

## 📈 スケーラビリティ

### 現在の構成
- 月間1000リクエストまで無料
- 同時接続数制限なし
- 自動スケーリング

### 将来的な拡張
- Route 53によるカスタムドメイン
- ACMによるSSL証明書
- CloudWatchによる監視
- SNSによる通知機能

## 🎯 学習成果

### AWSサービス
- **S3**: 静的ホスティング、バケットポリシー
- **CloudFront**: CDN設定、キャッシュ制御
- **Lambda**: サーバーレス関数開発
- **API Gateway**: REST API構築
- **DynamoDB**: NoSQLデータベース設計
- **IAM**: セキュリティ管理

### インフラ技術
- **Terraform**: インフラのコード化
- **CI/CD**: 自動デプロイ
- **セキュリティ**: 最小権限の原則
- **監視**: ログ管理

### 開発技術
- **JavaScript**: モダンなフロントエンド開発
- **Node.js**: サーバーレス関数
- **REST API**: API設計
- **データベース**: NoSQL設計

## 🔍 トラブルシューティング

### よくある問題
1. **AWS認証情報エラー**
   ```bash
   aws configure
   ```

2. **Terraform初期化エラー**
   ```bash
   cd terraform
   terraform init
   ```

3. **Lambda関数エラー**
   - CloudWatchログを確認
   - 環境変数の設定を確認

### リソースの削除
```bash
cd terraform
terraform destroy
```

## 📚 参考資料

- [AWS無料枠](https://aws.amazon.com/jp/free/)
- [Terraform公式ドキュメント](https://www.terraform.io/docs)
- [AWS Lambda開発者ガイド](https://docs.aws.amazon.com/lambda/)
- [DynamoDB開発者ガイド](https://docs.aws.amazon.com/dynamodb/)

## 📞 お問い合わせ

このプロジェクトについて質問や改善提案がございましたら、お気軽にお声がけください。

---

**このプロジェクトはAWS無料枠の範囲内で動作し、月額0円で運用可能です。** 🎉 