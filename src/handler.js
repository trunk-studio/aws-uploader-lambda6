import {
  Handler,
  operation
}
from 'lambda6';

import AWS from 'aws-sdk';
import crypto from 'crypto';
import config from './config';

const s3 = new AWS.S3();
    
export default class TestHandler extends Handler {

  @operation
  echo(payload) {
    return {
      payload: payload
    };
  }
  
  // @operation
  // accessKey(payload) {
  //   return {
  //     accessKey: config.accessKey
  //   }
  // }

  @operation
  s3event(payload) {
    //var key = payload.Records[0].s3.object.key;
    return {
      result: true
    };
  }

  @operation
  nothing(payload) {
    return {
      result: true
    };
  }

  // @operation
  // transcoder(payload) {
  // }

  @operation
  signature(payload) {

    const fileName = payload.conditions[5]['x-amz-meta-qqfilename'];
    const fileType = payload.conditions[2]['Content-Type'];
    const S3_BUCKET = payload.conditions[1]['bucket'];

    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 60,
      ContentType: fileType,
      ACL: 'public-read'
    };

    let policy = new Buffer(JSON.stringify(payload)).toString('base64').replace(/\n|\r/, '');
    let hmac = crypto.createHmac("sha1", config.secretAccessKey);

    let hash2 = hmac.update(policy);
    let signature = hmac.digest("base64");

    let data = s3.getSignedUrl('putObject', s3Params);

    return {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
      policy: policy,
      signature: signature
    };
  }
}