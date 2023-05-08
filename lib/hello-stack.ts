import {Stack, StackProps} from 'aws-cdk-lib';
import * as bus from 'aws-cdk-lib/aws-events'
import {Runtime, StartingPosition} from "aws-cdk-lib/aws-lambda";
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import {StreamViewType} from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs';
import * as path from "path";
import {DynamoEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

/*
  POC of IaC usage, CloudFormation based on CDK using AWS:
    - EventBus
    - DynamoDB
    - DynamoDB Streams
    - Lmabdas
    - CloudWatch
    - Scheduler for Lambdas
 */
export class HelloStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {

    super(scope, id, props);

    // var cloudWatchLogGroup = new LogGroup(this, "CloudWatchLogs", {
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   retention: RetentionDays.ONE_DAY
    // });

    // Event bus definition
    const eventBus = new bus.EventBus(this, 'MarketoEventBus', {
      eventBusName: 'marketo-events'
    })

    const eventBusRule = new bus.Rule(this, 'MarketoEventBusRule', {
      ruleName: `marketo-events-rule`,
      description: 'Rule marching marketo events',
      eventBus: eventBus,
      eventPattern: {
        source: ['swaggerhub.marketo.customer.update'],
      }
    });

    // DynamoDB
    const table = new dynamodb.Table(this, 'TableMateusz', {
      partitionKey: {name: 'id', type: dynamodb.AttributeType.STRING},
      sortKey: {name: 'createdAt', type: dynamodb.AttributeType.NUMBER},
      stream: StreamViewType.NEW_IMAGE
    });

    // Lambda to add
    const lambdaFunctionAdd = new lambda.NodejsFunction(this, "InsertMarketoDynamoLambdaFunction", {
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, `/../insert-marketo-info-lambda/insert-marketo-info.ts`),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName
      },
    });

    // Read function
    const lambdaFunctionRead = new lambda.NodejsFunction(this, "ReadMarketoDynamoLambdaFunction", {
      runtime: Runtime.NODEJS_16_X,
      entry: path.join(__dirname, `/../insert-marketo-info-lambda/read-marketo-data.ts`),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName
      },
    });

    // Schedule with rate of 2 minutes
    // const eventScheduleRule = new bus.Rule(this, 'MarketoEventScheduleRule', {
    //   schedule: bus.Schedule.rate(Duration.minutes(2)),
    // });

    lambdaFunctionRead.addEventSource(
        new DynamoEventSource(table, {
          startingPosition: StartingPosition.LATEST,
          batchSize: 3,
        })
    )

    table.grantStream(lambdaFunctionRead);
    table.grantReadWriteData(lambdaFunctionAdd);

    eventBusRule.addTarget(new targets.LambdaFunction(lambdaFunctionAdd, {}));

    //eventBusRule.addTarget(new CloudWatchLogGroup(cloudWatchLogGroup, {}))

  }
}
