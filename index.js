

const { ApolloServer,graphqlLambda,PubSub } = require('apollo-server-lambda');
const typeDefs = require('./schema')
const resolvers = require('./resolver');
const redis = require("redis");

const pubsub = new PubSub()
const server = new ApolloServer({ typeDefs, resolvers, context: { pubsub },playground: {    endpoint: "/Prod/"  } , })


 const graphqlHandler = server.createHandler({
    cors: {
      origin: '*',
      credentials: true,
    },
  });

module.exports.graphqlHandler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  function callbackFilter(error, output) {
    output.headers['Access-Control-Allow-Origin'] = '*';
    callback(error, output);
  }

  graphqlHandler(event, context, callbackFilter);
};









