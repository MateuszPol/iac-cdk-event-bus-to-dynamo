import { EventBridgeHandler } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const TABLE_NAME : string = process.env.TABLE_NAME!;

export const handler: EventBridgeHandler<any, any, any> = async (event, context, callback)  => {
    console.log(event);
    await saveItem(event.detail);
};

async function saveItem(item : any) {

    const params : DynamoDB.DocumentClient.PutItemInput = {
        TableName: TABLE_NAME,
        Item: item,
    };

    return dynamo
        .put(params)
        .promise()
        .then((output) => {
            console.log(output);
            return item;
        });
}