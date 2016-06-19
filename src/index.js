import Handler from './handler';

/**
 * Re-export of `Handler.handle()` that will be exposed to AWS Lambda as the
 * entry point to use when this bundle is uploaded to AWS.
 * @param {Object} event - the AWS Lambda event
 * @param {Object} context - the AWS Lambda context
 */
export function handler(event, context) {
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
}
