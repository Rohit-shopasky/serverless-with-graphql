const Model = require('./db_model')
const { userModel, feedModel, answerFeedModel, beforeEditAnswerModel, deletedAnswerModel, beforeEditQuestionModel, deletedQuestionModel } = Model
const passwordHash = require('password-hash')
const jwt = require('jsonwebtoken')
const jwtSecret = '@shopaskyTheBest@'
const { PubSub } = require('graphql-subscriptions')
const USER_LOGIN = 'userId'
const pubsub = new PubSub()
const moment = require('moment');
const common = require("./common");


const editController = {
    editAnswer: async(root, args, context) => {
        let { token, answerId, content } = args;

        try {

            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {
                // take out before editing answer
                let beforeEditData = await answerFeedModel.findOne({ "_id": answerId });

                if (beforeEditData.postedBy.toString() != isTokenValid.userData._id.toString())
                    return { status: false, msg: "You cannot edit this answer!", content: "" };

                // insert previous answer to beforeEditAnswers collection
                let insertData = {};
                insertData.content = beforeEditData.content
                insertData.likedby = beforeEditData.likedby
                insertData.dislikedby = beforeEditData.dislikedby;
                insertData.createdAt = beforeEditData.createdAt;
                insertData.feedType = beforeEditData.feedType;
                insertData.postedBy = beforeEditData.postedBy;
                insertData.category = beforeEditData.category;
                insertData.repliedFeedId = beforeEditData.repliedFeedId;
                let beforeInsertData = await beforeEditAnswerModel.collection.insert(insertData);

                // update the answer in answerFeeds collection
                let updateAnswer = await answerFeedModel.findOneAndUpdate({ "_id": answerId }, { $set: { "content": content } });
                updateAnswer.status = true;
                updateAnswer.msg = "Answer Updated!";

                // get the updated answer

                let answerData = await answerFeedModel.findOne({ "_id": answerId }).lean();
                //  answerData.content!="" ? answerData.content = JSON.parse(answerData.content) : answerData.content="";
                answerData.content = JSON.parse(answerData.content);
                answerData.createdAt = moment(answerData.createdAt, 'YYYYMMDD').fromNow()
                answerData.feedId = answerData._id
                answerData.voteCount = await common.countVotes(answerData);
                answerData.likedByCurrentUser = await common.checkCurrentVotedOrNot(answerData, isTokenValid._id, "like")
                answerData.dislikedByCurrentUser = await common.checkCurrentVotedOrNot(answerData, isTokenValid._id, "dislike")

                answerData.status = true;
                answerData.msg = "Edited Successfully!";

                return answerData;
            }

        } catch (error) {
            console.log(error);
            return { status: false, msg: "Something went wrong!" }
        }
    },


    editQuestion: async(root, args, context) => {
        let { token, questionId, title, content, category } = args;

        try {


            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {
                // take out before editing answer
                let beforeEditData = await feedModel.findOne({ "_id": questionId }).lean();

                delete beforeEditData._id;
                if (beforeEditData.postedBy.toString() != isTokenValid.userData._id.toString())
                    return { status: false, msg: "You cannot edit this question!", content: "" };

                let beforeInsertData = await beforeEditQuestionModel.collection.insert(beforeEditData);

                let isContentStringify = checkJSON(content);



                if (isContentStringify) {
                    content = JSON.stringify(content);
                }

                // update the question in Feeds collection
                let updateQuestion = await feedModel.findOneAndUpdate({ "_id": questionId }, { $set: { "content": content, "title": title, "category": category } });
                updateQuestion.status = true;
                updateQuestion.msg = "Question Updated!";

                // get the updated answer

                let questionData = await feedModel.findOne({ "_id": questionId }).lean();
                //  answerData.content!="" ? answerData.content = JSON.parse(answerData.content) : answerData.content="";
                questionData.title = questionData.title;
                questionData.content = JSON.parse(questionData.content);
                questionData.createdAt = moment(questionData.createdAt, 'YYYYMMDD').fromNow()
                questionData.feedId = questionData._id
                questionData.voteCount = await common.countVotes(questionData);
                questionData.likedByCurrentUser = await common.checkCurrentVotedOrNot(questionData, isTokenValid._id, "like")
                questionData.dislikedByCurrentUser = await common.checkCurrentVotedOrNot(questionData, isTokenValid._id, "dislike")

                questionData.status = true;
                questionData.msg = "Edited Successfully!";
                // console.log(questionData);
                return questionData;
            }

        } catch (error) {
            console.log(error);
            return { status: false, msg: "Something went wrong!" }
        }
    },

    deleteAnswer: async(root, args, context) => {
        let { token, answerId } = args;
        try {


            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {
                let beforeEditData = await answerFeedModel.findOne({ "_id": answerId }).lean();
                //console.log("beforeEditData",beforeEditData);

                if (beforeEditData.postedBy.toString() != isTokenValid.userData._id.toString())
                    return { status: false, msg: "You cannot edit this answer!", content: "" };
                let beforeDeleteData = await deletedAnswerModel.collection.insert(beforeEditData);

                let removeAnswer = await answerFeedModel.remove({ "_id": answerId });
                return { status: true, msg: "Answer Deleted Successfully!" }

            } else {
                return { status: false, msg: "You are not authorize to delete this answer!" }
            }

        } catch (error) {

            console.log("error", error);

        }
    },

    deleteQuestion: async(root, args, context) => {
        let { token, questionId } = args;
        try {

            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {
                let beforeEditData = await feedModel.findOne({ "_id": questionId }).lean();
                //console.log("beforeEditData",beforeEditData);

                if (beforeEditData.postedBy.toString() != isTokenValid.userData._id.toString())
                    return { status: false, msg: "You cannot edit this answer!", content: "" };
                let beforeDeleteData = await deletedQuestionModel.collection.insert(beforeEditData);

                let removeAnswer = await feedModel.remove({ "_id": questionId });
                return { status: true, msg: "Question Deleted Successfully!" }

            } else {
                return { status: false, msg: "You are not authorize to delete this answer!" }
            }

        } catch (error) {
            console.log(error);
            return { status: false, msg: "Something went wrong!" }
        }
    }
}



async function checkToken(token) {
    let returnObj = {}
    if (token) {
        try {
            let findResult = await userModel.findOne({ token: token })
            returnObj.status = true
            returnObj.userData = findResult
            return returnObj
        } catch (error) {
            console.log(error)
            returnObj.status = false
            returnObj.error = error
            return returnObj
        }
    } else {
        console.log('Token not provided!')

        returnObj.status = false
        returnObj.error = 'Token not provided!'
        return returnObj
    }
}

function checkJSON(data) {
    try {
        JSON.parse(data);
        return false;
    } catch (error) {
        return true;
    }
}


module.exports = editController;