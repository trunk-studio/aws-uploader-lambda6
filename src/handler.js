import {
  Handler,
  operation
}
from 'lambda6';

import AWS from 'aws-sdk';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import config from './config';

/**
 * Refer: https://github.com/FineUploader/server-examples/blob/master/nodejs/s3/s3handler.js
 */

const s3 = new AWS.S3();

function signV2RestRequest(headersStr) {
    return getV2SignatureKey(config.secretAccessKey, headersStr);
}

function getV2SignatureKey(key, stringToSign) {

}

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
    
    if (payload.headers) {
      // Signs multipart (chunked) requests.  Omit if you don't want to support chunking.

      let words = CryptoJS.HmacSHA1(payload.headers, config.secretAccessKey);
      let signature = CryptoJS.enc.Base64.stringify(words);

      return {
          signature: signature
      };

    }
    else {
      // Signs "simple" (non-chunked) upload requests.
      
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
}