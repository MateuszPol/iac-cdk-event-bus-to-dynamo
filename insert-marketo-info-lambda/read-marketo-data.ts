import {DynamoDBStreamHandler} from 'aws-lambda';

export const handler: DynamoDBStreamHandler = async (event, callback)  => {
    console.log(event);
};