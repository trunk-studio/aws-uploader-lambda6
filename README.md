# AWS Uploader Lambda6

```
npm i
gulp lambda
```


## lambda.json

從 AWS Management Console 找到 `lambda_s3_exec_role` 的 Role ARN。

```
https://console.aws.amazon.com/iam/home?region=ap-northeast-1#roles/lambda_s3_exec_role
```

Role ARN 的範例：

```
arn:aws:iam::數字代碼:role/lambda_s3_exec_role
```

AWS SNS 範例

```
{ Records:  [ { EventSource: 'aws:sns', EventVersion: '1.0', EventSubscriptionArn: 'arn:aws:sns:ap-northeast-1:802997416844:DefaultTranscoderPipelineEvents:d69ad940-15df-478e-8b86-668248cb765e', Sns: [Object] } ] }
```