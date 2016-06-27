import Handler from './handler';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import FormData from 'form-data';

const elastictranscoder = new AWS.ElasticTranscoder();

export function handler(event, context) {

  console.log(event);

  if (event.Records) {
    // SNS or S3 Events
    let record = event.Records[0];
    
    if (record.EventSource == 'aws:sns') {
      // Transcoder Job Complete
      let sns = record.Sns;
      
      console.log('<<< Transcoder Job Callback <<<' + JSON.stringify(sns));
      //console.log(sns);
      
      let message = JSON.parse(sns.Message);
      let outputs = message.outputs;
      let userMetadata = message.userMetadata;
      
      let callbackEndpoint = userMetadata.CallbackEndpoint;
      
      let callbackParams = JSON.parse(
        new Buffer(
          userMetadata.CallbackParams0 + userMetadata.CallbackParams1 +
          userMetadata.CallbackParams2 + userMetadata.CallbackParams3, 'base64'
        ).toString('utf8')
      );
      
      for (let i = 0; i < outputs.length; i++) {
        let output = outputs[i];
        
        if (output.height == 480) {
          callbackParams.videoSize480 = '';
          callbackParams.thumbnail480 = '';
        }
        else if (output.height == 720) {
          callbackParams.videoSize720 = '';
          callbackParams.thumbnail480 = '';
        }
        
        callbackParams.videoDuration = output.duration;
      }

      /*
      console.log((callbackParams));
      console.log(JSON.stringify(callbackParams));
      */

      // Use httpbin.org for testing purpose
      // 'http://httpbin.org/post'
      
      fetch(callbackEndpoint, {
        method: 'POST',
        body: JSON.stringify(callbackParams),
      	redirect: 'follow',
      	headers: {'Content-Type': 'application/json'}
      })
      .then(function(res) {
          return res.json();
      }).then(function(json) {
          console.log(json);
          context.succeed();
      });
    }
  }
  else if (event.operation == 'transcoder') {

    console.log('>>> Invoke: elastictranscoder.createJob');

    elastictranscoder.createJob(event.payload, function(err, data) {

      console.log("<<< Callback: elastictranscoder.createJob callback");

      if (err){
        console.log(err);
        context.fail();
        return;
      }
      
      context.succeed();
    });
  }
  else if (event.operation && event.payload) {
    return new Handler().handle(event, context);
  }
  else {
    event.operation = 'nothing';
    event.payload = {};
    return new Handler().handle(event, context);
  }
}
