cat <<JSON
[
  {
    "Id": "1",
    "Arn": "${func_arn}",
    "Input": "{\"s3bucket\":\"${s3bucket}\",\"s3prefix\":\"${s3prefix}\",\"instance\":\"${instance}\"}"
  }
]
JSON
