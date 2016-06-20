import Handler from './handler';
import aws from 'aws-sdk';

const elastictranscoder = new aws.ElasticTranscoder();

function basename(path) {
   return path.split('/').reverse()[0].split('.')[0];
}

function outputKey(name, ext) {
   return name + '-' + Date.now().toString() + '.' + ext;
}

/**
 * Re-export of `Handler.handle()` that will be exposed to AWS Lambda as the
 * entry point to use when this bundle is uploaded to AWS.
 * @param {Object} event - the AWS Lambda event
 * @param {Object} context - the AWS Lambda context
 */
export function handler(event, context) {

  if (event.operation == 'transcoder') {
    var key = event.payload.key;

    var params = {
      Input: { 
        Key: key
      },
      PipelineId: '1462358425462-kxvzpj',
      OutputKeyPrefix: 'emvpcontent/',
      Outputs: [
        {
          Key: outputKey(basename(key), 'mp4'),
          PresetId: '1465455390986-0t1jc6',
        }
      ]
    };
    
    console.log('+++ Invoke: elastictranscoder.createJob');

    elastictranscoder.createJob(params, function(err, data) {

      console.log("+++ Callback: elastictranscoder.createJob callback");

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

/*
  if (!event.operation) {
    if (event.Records) {
      event.operation = 's3event';
      event.payload = { Records: event.Records };
    }
    else {
      event.operation = 'nothing';
      event.payload = {};
    }
  }

  return new Handler().handle(event, context);
*/

}
