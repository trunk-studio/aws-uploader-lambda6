import Handler from './handler';
import AWS from 'aws-sdk';

const elastictranscoder = new AWS.ElasticTranscoder();

export function handler(event, context) {

  console.log(event);

  if (event.operation == 'transcoder') {

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
