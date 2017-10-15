# lambda-rds-logs-uploader

Upload RDS logs to S3.

# Usage

## Install Node Modules

```bash
npm install
```

## Create IAM Policies

```bash
s3_policy_arn=$(
  aws iam create-policy \
    --policy-name AmazonS3LogsWriteAccess \
    --policy-document file://s3-policy.json \
    | jq -r ".Policy.Arn"
)
rds_policy_arn=$(
  aws iam create-policy \
    --policy-name AmazonRDSLogsAccess \
    --policy-document file://rds-policy.json \
    | jq -r ".Policy.Arn"
)
```

## Create IAM Role for Lambda Function

```bash
role_arn=$(
  aws iam create-role \
    --role-name lambda_rds_logs_uploader \
    --assume-role-policy-document file://assume-policy-document.json \
    | jq -r ".Role.Arn"
)
aws iam attach-role-policy \
  --role-name lambda_rds_logs_uploader \
  --policy-arn ${s3_policy_arn}
aws iam attach-role-policy \
  --role-name lambda_rds_logs_uploader \
  --policy-arn ${rds_policy_arn}
```

## Deploy Lambda Function

```bash
region=ap-northeast-1
func_arn=$(
  node_modules/.bin/node-lambda deploy \
    --environment production \
    --region ${region} \
    --functionName rds-logs-uploader \
    --role ${role_arn} \
    --timeout 300 \
    --description "Created by https://github.com/Wondershake/lambda-rds-logs-uploader" \
    --excludeGlobs ".* *.example *.md *.json *.sh LICENSE" \
    | grep FunctionArn \
    | sed -E "s/^[^']+'(.+)'.*/\1/"
)
```

## Create Scheduling Rule

```bash
rule_arn=$(
  aws events put-rule \
    --name lambda-rds-logs-uploader-rule \
    --schedule-expression 'rate(1 day)' \
    | jq -r ".RuleArn"
)
```

## Add Lambda Permission to Scheduling Rule

```bash
aws lambda add-permission \
  --function-name rds-logs-uploader-production \
  --statement-id lambda-rds-logs-uploader \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn ${rule_arn}
```

## Add Event Target

```bash
s3bucket=your-bucket
s3prefix=prefix/
instance=db-instance-name

aws events put-targets \
  --rule lambda-rds-logs-uploader-rule \
  --targets "$(. ./target-json-template.sh)"
```
