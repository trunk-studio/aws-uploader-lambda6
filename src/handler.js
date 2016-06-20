import { Handler, operation } from 'lambda6';

var aws = require('aws-sdk');

var elastictranscoder = new aws.ElasticTranscoder();

function basename(path) {
   return path.split('/').reverse()[0].split('.')[0];
}

function outputKey(name, ext) {
   return name + '-' + Date.now().toString() + '.' + ext;
}

export default class TestHandler extends Handler {

  /**
   * Sample operation handler for the "test" operation, it simply causes the
   * handler to succeed with the the operation name and payload it's given.
   * @param {Object} payload - the `payload` field extracted from `event`
   */
  @operation
  test(payload) {
    // No need to call `this.context.succeed()`, just return the value
    return { operationName: this.operation, value: payload };
  }

  @operation
  s3event(payload) {
    //var key = payload.Records[0].s3.object.key;
    return { result: true };
  }

  @operation
  nothing(payload) {
    return { result: true };
  }

  @operation
  echo(payload) {
    return { payload: payload };
  }

  @operation
  transcoder(payload) {

    var key = payload.key;

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
    
    console.log('+++ Invoke elastictranscoder.createJob');

    elastictranscoder.createJob(params, function(err, data) {
      console.log("+++ elastictranscoder.createJob callback");
      if (err){
        console.log(err);
      }
    });
  }
}
