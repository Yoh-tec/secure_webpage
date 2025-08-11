# 🚨 CloudWatchアラーム設定ガイド

## 📊 設定されるアラーム一覧

### 1. Lambda関数呼び出し回数監視
- **アラーム名**: `form-portfolio-lambda-invocations`
- **閾値**: 800,000回/月（無料枠: 100万回/月）
- **通知**: 80%使用時にメール通知
- **料金**: 無料（基本メトリクス）

### 2. API Gatewayリクエスト数監視
- **アラーム名**: `form-portfolio-api-requests`
- **閾値**: 800,000回/月（無料枠: 100万回/月）
- **通知**: 80%使用時にメール通知
- **料金**: 無料（基本メトリクス）

### 3. DynamoDB読み取り容量監視
- **アラーム名**: `form-portfolio-dynamodb-read-capacity`
- **閾値**: 20,000,000 RCU/月（無料枠: 25RCU/月）
- **通知**: 80%使用時にメール通知
- **料金**: 無料（基本メトリクス）

### 4. DynamoDB書き込み容量監視
- **アラーム名**: `form-portfolio-dynamodb-write-capacity`
- **閾値**: 20,000,000 WCU/月（無料枠: 25WCU/月）
- **通知**: 80%使用時にメール通知
- **料金**: 無料（基本メトリクス）

### 5. S3バケットサイズ監視
- **アラーム名**: `form-portfolio-s3-bucket-size`
- **閾値**: 4GB（無料枠: 5GB）
- **通知**: 80%使用時にメール通知
- **料金**: 無料（基本メトリクス）

### 6. 予算アラート
- **アラーム名**: `form-portfolio-monthly-budget`
- **閾値**: $1/月（80%と100%で通知）
- **通知**: 予算の80%と100%でメール通知
- **料金**: 無料

## 💰 料金詳細

### CloudWatch無料枠
| サービス | 無料枠 | 追加料金 |
|---------|--------|----------|
| **基本メトリクス** | 無制限 | 無料 |
| **アラーム** | 10個まで | $0.10/アラーム/月 |
| **ログ** | 5GB/月 | $0.50/GB |
| **ダッシュボード** | 3個まで | $3/ダッシュボード/月 |

### このプロジェクトの料金
- **使用アラーム数**: 6個（無料枠内）
- **基本メトリクス**: 無料
- **SNS通知**: 無料（100万通知/月まで）
- **予算アラート**: 無料

**総コスト: 0円/月** 🎉

## 📧 通知設定

### SNSトピック
- **トピック名**: `form-portfolio-billing-alerts`
- **プロトコル**: Email
- **配信先**: デプロイ時に設定したメールアドレス

### 通知タイミング
1. **無料枠の80%使用時**: 早期警告
2. **無料枠の100%使用時**: 緊急警告
3. **予算の80%到達時**: コスト警告
4. **予算の100%到達時**: コスト超過

## 🔧 カスタマイズ方法

### アラーム閾値の変更
```hcl
# terraform/main.tf で閾値を調整
threshold = "600000"  # 60%で通知
```

### 通知頻度の変更
```hcl
# 評価期間を変更（現在: 24時間）
period = "3600"  # 1時間ごと
```

### 追加のアラーム設定
```hcl
# 新しいアラームを追加
resource "aws_cloudwatch_metric_alarm" "custom_alarm" {
  alarm_name          = "custom-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CustomMetric"
  namespace           = "AWS/Custom"
  period              = "86400"
  statistic           = "Average"
  threshold           = "100"
  alarm_description   = "カスタムアラーム"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]
}
```

## 📱 通知例

### メール通知の内容
```
件名: AWS CloudWatch Alarm - form-portfolio-lambda-invocations

Lambda関数の呼び出し回数が無料枠に近づいています

アラーム名: form-portfolio-lambda-invocations
現在の値: 850,000
閾値: 800,000
時間: 2024-01-15 10:30:00 UTC

詳細: https://console.aws.amazon.com/cloudwatch/
```

## 🛡️ セキュリティ

### IAM権限
- **CloudWatch**: メトリクス読み取り、アラーム作成
- **SNS**: トピック作成、通知送信
- **Budgets**: 予算設定、通知設定

### 最小権限の原則
- 必要最小限の権限のみ付与
- リソース固有の権限設定
- 定期的な権限見直し

## 📈 監視ダッシュボード

### 推奨ダッシュボード構成
1. **概要**: 全サービスの使用量
2. **コスト**: 月間コスト推移
3. **パフォーマンス**: レスポンス時間
4. **エラー**: エラー率とログ

### ダッシュボード作成
```bash
# AWS CLIでダッシュボード作成
aws cloudwatch put-dashboard \
  --dashboard-name "FormPortfolio" \
  --dashboard-body file://dashboard.json
```

## 🔍 トラブルシューティング

### よくある問題
1. **アラームが発動しない**
   - メトリクスの確認
   - 閾値の見直し
   - 評価期間の調整

2. **通知が届かない**
   - SNSサブスクリプションの確認
   - メールアドレスの確認
   - スパムフォルダの確認

3. **誤報が多い**
   - 閾値の調整
   - 評価期間の延長
   - 統計値の変更

### ログの確認
```bash
# CloudWatchログの確認
aws logs describe-log-groups
aws logs filter-log-events --log-group-name "/aws/lambda/form-portfolio-handler"
```

## 📚 参考資料

- [CloudWatch料金](https://aws.amazon.com/jp/cloudwatch/pricing/)
- [CloudWatchアラーム設定](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [SNS料金](https://aws.amazon.com/jp/sns/pricing/)
- [AWS Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html) 