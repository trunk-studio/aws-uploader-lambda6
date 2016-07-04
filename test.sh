# curl -H "Content-Type: application/json" -X GET https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod

curl -H "Content-Type: application/json" -X POST -d "{\"operation\": \"echo\", \"payload\": \"Hello Lambda\"}" https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod

# curl -H "Content-Type: application/json" -X POST -d "{\"operation\": \"s3test\", \"payload\": \"Hello Lambda\"}" https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod

#curl -H "Content-Type: application/json" -X POST -d "{\"operation\": \"transcoder\", \"payload\": {\"key\": \"emvpupload/a14057/994E6240-3725-4FD0-BF2F-20058157938E/en/raw.mp4\"}}" https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod

