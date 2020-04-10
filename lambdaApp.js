'use strict'

const awsServerlessExpress = require('aws-serverless-express');
const { ApolloServer, gql } = require('apollo-server-lambda');

const app = require('./src/app');
const server = awsServerlessExpress.createServer(app);

//exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
exports.lambdaHandler = (event, context) => {
//console.log("event", event);
return  awsServerlessExpress.proxy(server, event, context);
}
