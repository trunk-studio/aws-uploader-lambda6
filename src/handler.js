import {
  Handler,
  operation
}
from 'lambda6';

import AWS from 'aws-sdk';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import config from './config';
import fetch from 'node-fetch';

/**
 * Refer: https://github.com/FineUploader/server-examples/blob/master/nodejs/s3/s3handler.js
 */

const elastictranscoder = new AWS.ElasticTranscoder();

const s3 = new AWS.S3();

function _cdnUrlToS3Key(cdnUrl) {
  let tokens = cdnUrl.split('/');
  tokens.shift();
  tokens.shift();
  tokens.shift();
  return tokens.join('/');
}

function _cdnUrlGetHost(cdnUrl) {
  let tokens = cdnUrl.split('/');
  let host = [];
  host.push(tokens.shift());
  host.push(tokens.shift());
  host.push(tokens.shift());
  return host.join('/') + '/';
}

async function _getS3ObjectContentLength(s3key) {
  let result = await s3.headObject({Bucket: config.bucketName, Key: s3key}).promise();
  return result.ContentLength;
}

async function _listS3Thumbnails(s3key_prefix, url_prefix) {
  let result = await s3.listObjects({
    Bucket: config.bucketName,
    Prefix: s3key_prefix
  }).promise();
  
  let objects = result.Contents;
  
  let thumbs = [];
  
  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i];
    let suffix = obj.Key.substr(-4);
    if (suffix == '.jpg' || suffix == '.png') {
      thumbs.push(url_prefix?url_prefix+obj.Key:obj.Key);
    }
  }
  
  let limitedThumbs = [];
  
  if (thumbs.length > 3) {
    limitedThumbs.push(thumbs[0]);
    limitedThumbs.push(thumbs[Math.round(thumbs.length/2.0)]);
    limitedThumbs.push(thumbs[thumbs.length - 1]);
  }
  else {
    limitedThumbs = thumbs;
  }
  
  return limitedThumbs.join(';');
}

export default class TestHandler extends Handler {

  @operation
  async echo(payload) {
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
  
  @operation
  async transcoder(payload) {
    console.log('>>> Invoke: elastictranscoder.createJob');

    await elastictranscoder.createJob(payload).promise();
    
    console.log("<<< Callback: elastictranscoder.createJob callback");
    
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
  
  @operation
  async transcoderCallback(record) {
    
    let sns = record.Sns;
    
    console.log('<<< Transcoder Job Callback <<<' + JSON.stringify(sns));

    let message = JSON.parse(sns.Message);
    let outputs = message.outputs;
    let userMetadata = message.userMetadata;
    
    let callbackEndpoint = userMetadata.CallbackEndpoint;
    
    let cloudfrontBaseUrl = new Buffer(userMetadata.CloudFrontBaseURL, 'base64').toString('utf8');
    let videoKeyPattern = new Buffer(userMetadata.VideoKeyPattern, 'base64').toString('utf8');
    
    let callbackParams = JSON.parse(
      new Buffer(
        userMetadata.CallbackParams0 + userMetadata.CallbackParams1 +
        userMetadata.CallbackParams2 + userMetadata.CallbackParams3, 'base64'
      ).toString('utf8')
    );
    
    /*
    let videoUrl480 = callbackParams.videoUrl480;
    let videoUrl480_s3key = _cdnUrlToS3Key(videoUrl480);
    let videoSize480 = await _getS3ObjectContentLength(videoUrl480_s3key);
    let thumbnail480 = await _listS3Thumbnails(
      videoUrl480_s3key.substr(0, videoUrl480_s3key.lastIndexOf('.')),
      _cdnUrlGetHost(videoUrl480)
    );
    
    let videoUrl720 = callbackParams.videoUrl720;
    let videoUrl720_s3key = _cdnUrlToS3Key(videoUrl720);
    let videoSize720 = await _getS3ObjectContentLength(videoUrl720_s3key);
    let thumbnail720 = await _listS3Thumbnails(
      videoUrl720_s3key.substr(0, videoUrl720_s3key.lastIndexOf('.')),
      _cdnUrlGetHost(videoUrl720)
    );
    */

    for (let i = 0; i < outputs.length; i++) {

      let output = outputs[i];
      
      let resolutionKind = output.height;
      
      let videoKey = videoKeyPattern.replace('{resolutionKind}', resolutionKind);
      
      callbackParams.outputs.push({
        resolutionKind: resolutionKind,
        videoSize: await _getS3ObjectContentLength(videoKey),
        thumbnail: await _listS3Thumbnails(
          videoKey.substr(0, videoKey.lastIndexOf('.')), cloudfrontBaseUrl
        )
      });
      
      /*
      if (output.height == 480) {
        callbackParams.videoSize480 = videoSize480;
        callbackParams.thumbnail480 = thumbnail480;
      }
      else if (output.height == 720) {
        callbackParams.videoSize720 = videoSize720;
        callbackParams.thumbnail720 = thumbnail720;
      }
      */
      
      callbackParams.videoDuration = output.duration;
    }

    let response = await fetch(callbackEndpoint, {
      method: 'POST',
      body: JSON.stringify(callbackParams),
    	/* redirect: 'follow', */
    	headers: {'Content-Type': 'application/json'}
    });
    
    let resultJson = await response.json();
    
    console.log('>>> Transcoder Job Callback >>>' + JSON.stringify(resultJson));
    
    return resultJson;
  }
}