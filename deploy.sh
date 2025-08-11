#!/bin/bash

# AWS Form Portfolio デプロイスクリプト
# 完全無料でAWSインフラを構築します

set -e

echo "🚀 AWS Form Portfolio デプロイを開始します..."

# 必要なツールの確認
check_requirements() {
    echo "📋 必要なツールを確認中..."
    
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI がインストールされていません"
        echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html からインストールしてください"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        echo "❌ Terraform がインストールされていません"
        echo "   https://developer.hashicorp.com/terraform/downloads からインストールしてください"
        exit 1
    fi
    
    if ! command -v zip &> /dev/null; then
        echo "❌ zip コマンドが利用できません"
        exit 1
    fi
    
    echo "✅ 必要なツールが確認できました"
}

# AWS認証情報の確認
check_aws_credentials() {
    echo "🔐 AWS認証情報を確認中..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS認証情報が設定されていません"
        echo "   aws configure を実行して認証情報を設定してください"
        exit 1
    fi
    
    echo "✅ AWS認証情報が確認できました"
}

# Lambda関数のZIPファイル作成
create_lambda_package() {
    echo "📦 Lambda関数のパッケージを作成中..."
    
    # package.jsonの作成
    cat > package.json << EOF
{
  "name": "form-portfolio-lambda",
  "version": "1.0.0",
  "description": "Form Portfolio Lambda Function",
  "main": "lambda-function.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
EOF
    
    # 依存関係のインストール
    npm install --production
    
    # Lambda関数のZIPファイル作成
    zip -r lambda-function.zip lambda-function.js node_modules/
    
    echo "✅ Lambda関数のパッケージが作成されました"
}

# Terraformの初期化とデプロイ
deploy_infrastructure() {
    echo "🏗️  AWSインフラをデプロイ中..."
    
    cd terraform
    
    # Terraformの初期化
    terraform init
    
    # アラート用メールアドレスの設定
    echo "📧 アラート通知用メールアドレスを設定してください:"
    read -p "メールアドレス: " ALERT_EMAIL
    
    # プランの確認
    terraform plan -var="alert_email=$ALERT_EMAIL"
    
    # デプロイの実行
    terraform apply -auto-approve -var="alert_email=$ALERT_EMAIL"
    
    # 出力値の取得
    API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
    CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)
    WEBSITE_ENDPOINT=$(terraform output -raw website_endpoint)
    
    cd ..
    
    echo "✅ AWSインフラのデプロイが完了しました"
}

# フロントエンドファイルの更新
update_frontend() {
    echo "🌐 フロントエンドファイルを更新中..."
    
    # API Gateway URLを設定
    sed "s|YOUR_API_GATEWAY_URL|$API_GATEWAY_URL|g" script-aws.js > script-aws-updated.js
    sed "s|YOUR_API_GATEWAY_URL|$API_GATEWAY_URL|g" admin-script-aws.js > admin-script-aws-updated.js
    
    echo "✅ フロントエンドファイルが更新されました"
}

# S3へのファイルアップロード
upload_to_s3() {
    echo "📤 S3バケットにファイルをアップロード中..."
    
    # S3バケット名の取得
    BUCKET_NAME=$(cd terraform && terraform output -raw website_bucket_name && cd ..)
    
    # ファイルのアップロード
    aws s3 cp index.html s3://$BUCKET_NAME/
    aws s3 cp styles.css s3://$BUCKET_NAME/
    aws s3 cp script-aws-updated.js s3://$BUCKET_NAME/script.js
    aws s3 cp admin.html s3://$BUCKET_NAME/
    aws s3 cp admin-styles.css s3://$BUCKET_NAME/
    aws s3 cp admin-script-aws-updated.js s3://$BUCKET_NAME/admin-script.js
    
    echo "✅ ファイルのアップロードが完了しました"
}

# デプロイ完了の表示
show_deployment_info() {
    echo ""
    echo "🎉 デプロイが完了しました！"
    echo ""
    echo "📊 デプロイ情報:"
    echo "   🌐 CloudFront URL: https://$CLOUDFRONT_DOMAIN"
    echo "   🗄️  S3 Website URL: http://$WEBSITE_ENDPOINT"
    echo "   🔌 API Gateway URL: $API_GATEWAY_URL"
    echo ""
    echo "📝 管理者ページ:"
    echo "   https://$CLOUDFRONT_DOMAIN/admin.html"
    echo "   パスワード: Password"
    echo ""
    echo "🚨 監視・アラート設定:"
    echo "   - CloudWatchアラーム: 無料枠使用量の監視"
    echo "   - SNS通知: メールでのアラート配信"
    echo "   - 予算アラート: $1/月の予算設定"
    echo "   - 無料枠の80%使用時に通知"
    echo ""
    echo "💰 コスト情報:"
    echo "   この構成はAWS無料枠の範囲内で動作します"
    echo "   - S3: 5GBまで無料"
    echo "   - CloudFront: 1TB/月まで無料"
    echo "   - Lambda: 100万リクエスト/月まで無料"
    echo "   - API Gateway: 100万リクエスト/月まで無料"
    echo "   - DynamoDB: 25GB + 25WCU/25RCUまで無料"
    echo "   - CloudWatchアラーム: 10個まで無料"
    echo ""
    echo "⚠️  注意事項:"
    echo "   - 無料枠を超えると課金が発生する可能性があります"
    echo "   - 設定したメールアドレスにアラートが送信されます"
    echo "   - 定期的にAWSコンソールで使用量を確認してください"
    echo "   - 不要になった場合は terraform destroy でリソースを削除してください"
}

# メイン処理
main() {
    check_requirements
    check_aws_credentials
    create_lambda_package
    deploy_infrastructure
    update_frontend
    upload_to_s3
    show_deployment_info "$ALERT_EMAIL"
}

# スクリプトの実行
main 