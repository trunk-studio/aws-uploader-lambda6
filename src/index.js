import Handler from './handler';
import AWS from 'aws-sdk';

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
