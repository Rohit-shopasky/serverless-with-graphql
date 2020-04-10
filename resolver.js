const chats = []
const { withFilter} = require('graphql-yoga')
const signupResolver = require("./signupResolver");
const postResolver = require("./postResolver");
const profileResolver = require("./profileResolver");
const editResolver = require("./editResolver");
const notificationResolver = require("./notificationResolver");
const CHAT_CHANNEL = 'CHAT_CHANNEL';
const NEW_MSG = "NEW_MSG";
const NEW_QUES_POST = "NEW_QUES_POST";
const NEW_ANSWER_POST = "NEW_ANSWER_POST";
const NEW_NOTIFICATION  = "NEW_NOTIFICATION";


const resolvers = {
    Query: {
        chats(root, args, context) {
            return chats
        },

        async userSignin(root, args, context) {
            let result = await signupResolver.userSigin(root, args);
            return result;
        },

        async isUserSignin(root, args, context) {
            let result = await signupResolver.isUserSignin(root, args);
            return result;
        },

        async getAllFeeds(root, args, context) {
            let result = await postResolver.getAllFeeds(root, args, context);
            return result;
        },

        async getSpecificPost(root, args, context) {
            let result = await postResolver.getSpecificPost(root, args, context);
            return result;
        },

        async getSpecificUserQuestions(root, args, context) {
            let result = await postResolver.getSpecificUserQuestions(root, args, context);
            return result;
        },

        async getSpecificUserAnswers(root, args, context) {
            let result = await postResolver.getSpecificUserAnswers(root, args, context);
            return result;
        },
        async getUserProfile(root, args, context) {
            let result = await profileResolver.getUserProfile(root, args, context);
            return result;
        },
        async getAllCategories(root,args,context){
            let result = await postResolver.getAllCategories(root, args, context);
            return result;
        },
        async getAllUsers(root,args,context){
            let result = await profileResolver.getAllUsers(root, args, context);
            return result;
        },
        async getSpecificUserDetails(root,args,context){
            let result = await profileResolver.getSpecificUserDetails(root, args, context);
            return result;
        },

        async searchPosts(root,args,context){
            let result = await postResolver.searchPosts(root, args, context);
            return result;
        },

        async getAllNotifications(root,args,context){
            let result = await notificationResolver.getAllNotifications(root, args, context);
            return result;
        },

        async getAllQuestionsAndAnswerCount(root, args, context) {
            let result = await postResolver.getAllQuestionsAndAnswerCount(root, args, context);
            return result;
        },

        async getPopularPosts(root, args, context) {
            let result = await postResolver.getPopularPosts(root, args, context);
            return result;
        },

    },

    Mutation: {
        async userSignup(root, args, { pubsub }) {
            let result = await signupResolver.userSignup(root, args, { pubsub })
            return result;
        },

        async userGoogleSignup(root, args, { pubsub }) {
            let result = await signupResolver.userGoogleSignUp(root, args, { pubsub });
            return result;
        },

        async editProfile(root, args, context) {
            let result = await profileResolver.editProfile(root, args, context);
            return result;
        },

        async postQuestion(root, args, { pubsub }) {
            let result = await postResolver.postQuestion(root, args, { pubsub });
            pubsub.publish(NEW_QUES_POST, { newQuestionPost: result });
            return result;
        },

        async postAnswer(root, args, { pubsub }) {
            let result = await postResolver.postAnswer(root, args, { pubsub });
            pubsub.publish(NEW_ANSWER_POST, { newAnswerPost: result });
            if(typeof result.notificationData!="undefined")
            pubsub.publish(NEW_NOTIFICATION, { newNotification: result.notificationData });
            return result;
        },

        async likeAnswer(root, args, {pubsub}) {
            let result = await postResolver.likeAnswer(root, args, {pubsub});
            if(typeof result.notificationData!="undefined")
            pubsub.publish(NEW_NOTIFICATION, { newNotification: result.notificationData });
            return result;
        },
        async dislikeAnswer(root, args,{pubsub}) {
            let result = await postResolver.dislikeAnswer(root, args, {pubsub});
            if(typeof result.notificationData!="undefined")
            pubsub.publish(NEW_NOTIFICATION, { newNotification: result.notificationData });
            return result;
        },

        async likeQuestion(root, args, {pubsub}) {
            let result = await postResolver.likeQuestion(root, args, {pubsub});
            if(typeof result.notificationData!="undefined")
            pubsub.publish(NEW_NOTIFICATION, { newNotification: result.notificationData });
            return result;
        },

        async dislikeQuestion(root, args, {pubsub}) {
            let result = await postResolver.dislikeQuestion(root, args, {pubsub});
            if(typeof result.notificationData!="undefined")
            pubsub.publish(NEW_NOTIFICATION, { newNotification: result.notificationData });
            return result;
        },

        async editAnswer(root, args, context) {
            let result = await editResolver.editAnswer(root, args, context);
            return result;
        },

        async editQuestion(root, args, context) {
            let result = await editResolver.editQuestion(root, args, context);
            return result;
        },

        async deleteAnswer(root, args, context) {
            let result = await editResolver.deleteAnswer(root, args, context);
            return result;
        },

        async deleteQuestion(root, args, context) {
            let result = await editResolver.deleteQuestion(root, args, context);
            return result;
        },

        async seenNotification(root, args, context) {
            let result = await notificationResolver.seenNotification(root, args, context);
            return result;
        },

        

    },

    Subscription: {
        newQuestionPost: {
            subscribe(root, args, { pubsub }) {
                return pubsub.asyncIterator(NEW_QUES_POST);
            }
        },

        newAnswerPost: {
            subscribe: withFilter((root, args, { pubsub }) => pubsub.asyncIterator(NEW_ANSWER_POST), (payload, variables) => {
              return payload.newAnswerPost.repliedFeedId == variables.feedId;
            }),
          },

          newNotification: {
            subscribe: withFilter((root, args, { pubsub }) => pubsub.asyncIterator(NEW_NOTIFICATION), (payload, variables) => {
              return payload.newNotification.to == variables.userId;
            }),
          },

    }
}

module.exports = resolvers