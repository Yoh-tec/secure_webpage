# AWS Provider設定
provider "aws" {
  region = "ap-northeast-1"  # 東京リージョン
}

# S3バケット（静的Webサイトホスティング）
resource "aws_s3_bucket" "website_bucket" {
  bucket = "form-portfolio-website-${random_string.bucket_suffix.result}"
}

resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.website_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "website_bucket" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false

  depends_on = [aws_s3_bucket_policy.website_bucket_policy]
}

resource "aws_s3_bucket_policy" "website_bucket_policy" {
  bucket = aws_s3_bucket.website_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website_bucket.arn}/*"
      },
    ]
  })
}

# DynamoDBテーブル
resource "aws_dynamodb_table" "form_data_table" {
  name           = "form-data-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = "production"
    Project     = "form-portfolio"
  }
}

# Lambda関数用のIAMロール
resource "aws_iam_role" "lambda_role" {
  name = "form-portfolio-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda関数用のIAMポリシー
resource "aws_iam_role_policy" "lambda_policy" {
  name = "form-portfolio-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.form_data_table.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda関数
resource "aws_lambda_function" "form_handler" {
  filename         = "../lambda-function.zip"
  function_name    = "form-portfolio-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda-function.handler"
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.form_data_table.name
      ADMIN_PASSWORD = var.admin_password
    }
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "form_api" {
  name = "form-portfolio-api"
}

resource "aws_api_gateway_resource" "form_resource" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  parent_id   = aws_api_gateway_rest_api.form_api.root_resource_id
  path_part   = "form"
}

resource "aws_api_gateway_method" "form_post" {
  rest_api_id   = aws_api_gateway_rest_api.form_api.id
  resource_id   = aws_api_gateway_resource.form_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "form_get" {
  rest_api_id   = aws_api_gateway_rest_api.form_api.id
  resource_id   = aws_api_gateway_resource.form_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "form_options" {
  rest_api_id   = aws_api_gateway_rest_api.form_api.id
  resource_id   = aws_api_gateway_resource.form_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda統合

resource "aws_api_gateway_integration" "lambda_integration_get" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  resource_id = aws_api_gateway_resource.form_resource.id
  http_method = aws_api_gateway_method.form_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.form_handler.invoke_arn
}

resource "aws_api_gateway_integration" "lambda_integration_post" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  resource_id = aws_api_gateway_resource.form_resource.id
  http_method = aws_api_gateway_method.form_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.form_handler.invoke_arn
}

resource "aws_api_gateway_integration" "lambda_integration_options" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  resource_id = aws_api_gateway_resource.form_resource.id
  http_method = aws_api_gateway_method.form_options.http_method

  type = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  resource_id = aws_api_gateway_resource.form_resource.id
  http_method = aws_api_gateway_method.form_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.form_api.id
  resource_id = aws_api_gateway_resource.form_resource.id
  http_method = aws_api_gateway_method.form_options.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Lambda権限
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.form_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.form_api.execution_arn}/*/*"
}

# API Gatewayステージ
resource "aws_api_gateway_stage" "prod" {
  depends_on = [aws_api_gateway_deployment.form_deployment]
  deployment_id = aws_api_gateway_deployment.form_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.form_api.id
  stage_name    = "prod"
}

# API Gatewayデプロイメント
resource "aws_api_gateway_deployment" "form_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration_post,
    aws_api_gateway_integration.lambda_integration_get,
    aws_api_gateway_integration.lambda_integration_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.form_api.id
}

# CloudFront配信
resource "aws_cloudfront_distribution" "website_distribution" {
  origin {
    domain_name = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website_bucket.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.website_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website_bucket.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # エラーページの設定
  custom_error_response {
    error_code         = 404
    response_code      = "200"
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = "200"
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Environment = "production"
    Project     = "form-portfolio"
  }
}

resource "aws_cloudfront_origin_access_identity" "website_oai" {
  comment = "OAI for form portfolio website"
}

# ランダム文字列生成（バケット名用）
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# 変数定義
variable "admin_password" {
  description = "管理者パスワード"
  type        = string
  default     = "Password"
}

variable "alert_email" {
  description = "アラート通知用メールアドレス"
  type        = string
  default     = "your-email@example.com"
}

# 出力
output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.website_config.website_endpoint
}

output "website_bucket_name" {
  value = aws_s3_bucket.website_bucket.bucket
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.website_distribution.domain_name
}

output "api_gateway_url" {
  value = "${aws_api_gateway_stage.prod.invoke_url}/form"
}

# CloudWatchアラーム（無料枠監視）
resource "aws_cloudwatch_metric_alarm" "lambda_invocations" {
  alarm_name          = "form-portfolio-lambda-invocations"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Invocations"
  namespace           = "AWS/Lambda"
  period              = "86400"  # 24時間
  statistic           = "Sum"
  threshold           = "800000"  # 無料枠: 100万リクエスト/月
  alarm_description   = "Lambda関数の呼び出し回数が無料枠に近づいています"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.form_handler.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_requests" {
  alarm_name          = "form-portfolio-api-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Count"
  namespace           = "AWS/ApiGateway"
  period              = "86400"  # 24時間
  statistic           = "Sum"
  threshold           = "800000"  # 無料枠: 100万リクエスト/月
  alarm_description   = "API Gatewayのリクエスト数が無料枠に近づいています"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.form_api.name
    Stage   = aws_api_gateway_stage.prod.stage_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_consumed_read_capacity" {
  alarm_name          = "form-portfolio-dynamodb-read-capacity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "86400"  # 24時間
  statistic           = "Sum"
  threshold           = "20000000"  # 無料枠: 25RCU/月
  alarm_description   = "DynamoDBの読み取り容量が無料枠に近づいています"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.form_data_table.name
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_consumed_write_capacity" {
  alarm_name          = "form-portfolio-dynamodb-write-capacity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "86400"  # 24時間
  statistic           = "Sum"
  threshold           = "20000000"  # 無料枠: 25WCU/月
  alarm_description   = "DynamoDBの書き込み容量が無料枠に近づいています"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.form_data_table.name
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_bucket_size" {
  alarm_name          = "form-portfolio-s3-bucket-size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = "86400"  # 24時間
  statistic           = "Average"
  threshold           = "4000000000"  # 4GB（無料枠: 5GB）
  alarm_description   = "S3バケットサイズが無料枠に近づいています"
  alarm_actions       = [aws_sns_topic.billing_alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.website_bucket.bucket
    StorageType = "StandardStorage"
  }
}

# SNSトピック（通知用）
resource "aws_sns_topic" "billing_alerts" {
  name = "form-portfolio-billing-alerts"
}

# SNSサブスクリプション（メール通知）
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.billing_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email  # 変数で設定
}

# 予算アラート（Billing Alerts）
resource "aws_budgets_budget" "cost_budget" {
  name              = "form-portfolio-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "1"
  limit_unit        = "USD"
  time_period_start = "2024-01-01_00:00"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.form_data_table.name
} 