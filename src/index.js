import Handler from './handler';

export function handler(event, context) {

  console.log(event);

  if (event.Records) {
    // SNS or S3 Events
    let record = event.Records[0];
    
    if (record.EventSource == 'aws:sns') {
      event.operation = 'transcoderCallback';
      event.payload = record;
    }
  }
  
  if (!event.operation) {
    event.operation = 'nothing';
  }
  
  if (!event.payload) {
    event.payload = {};
  }

  return new Handler().handle(event, context);
}
