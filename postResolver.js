//process.env.UV_THREADPOOL_SIZE = 1;
const Model = require('./db_model')
const { userModel, feedModel, answerFeedModel, categoryModel } = Model
const passwordHash = require('password-hash')
const jwt = require('jsonwebtoken')
const jwtSecret = '@shopaskyTheBest@'
const { PubSub } = require('graphql-subscriptions')
const USER_LOGIN = 'userId'
const pubsub = new PubSub()
const moment = require('moment');
const common = require("./common");

const feedController = {
    postQuestion: async(root, args, { pubsub }) => {
        let { feedType, title, content, category, postedBy, token } = args

        let isTokenValid = await checkToken(token)
        if (isTokenValid.status) {
            let feedRef = feedModel()
            feedRef.feedType = 'Question'
            feedRef.title = title
            feedRef.content = content
            feedRef.category = category
            feedRef.postedBy = isTokenValid.userData._id
            try {
                let insertResult = await feedModel.collection.insert(feedRef);
                let result = await feedModel
                    .findOne({ _id: insertResult.insertedIds[0] })
                    .lean()
                    .populate('postedBy', '_id fullName profileImageUrl')
                    .populate('category', '_id categoryName')
                result.status = true;
                result.msg = 'Data inserted';
                result.content = result.content != "" ? JSON.parse(result.content) : "";
                result.createdAt = moment(result.createdAt, 'YYYYMMDD').fromNow()
                result.feedId = result._id;
                result.postedBy.id = isTokenValid.userData._id
                result.postedBy.fullName = isTokenValid.userData.fullName;
                result.postedBy.profileImageUrl = isTokenValid.userData.profileImageUrl;
                result.likedByCurrentUser = "gray";
                result.dislikedByCurrentUser = "gray";
                result.voteCount = 0;

                return result;
            } catch (error) {
                console.log(error)
                return { status: false, msg: error }
            }
        }
    },

    getAllFeeds: async(root, args, context) => {
        // get all Feeds from the database
        try {
            let { token, page, categoryId, userId } = args;
            let skipFeed = 0;
            let limitFeed = 4;
            if (page == 1) {
                skipFeed = 0;
                limitFeed = 4;
            } else
                skipFeed = (Number(page) * 4) - 4 + 1;

            if (categoryId == "" && userId == "") {
                var result = await feedModel
                    .find({})
                    .sort({ _id: '-1' })
                    .lean()
                    .populate('postedBy', '_id fullName profileImageUrl')
                    .populate('category', '_id categoryName')
                    .skip(skipFeed)
                    .limit(limitFeed);
            } else if (categoryId != "" && userId == "") {
                var result = await feedModel
                    .find({ category: categoryId })
                    .sort({ _id: '-1' })
                    .lean()
                    .populate('postedBy', '_id fullName profileImageUrl')
                    .populate('category', '_id categoryName')
                    .skip(skipFeed)
                    .limit(limitFeed);
            } else if (userId != "" && categoryId == "") {
                var result = await feedModel
                    .find({ postedBy: userId })
                    .sort({ _id: '-1' })
                    .lean()
                    .populate('postedBy', '_id fullName profileImageUrl')
                    .populate('category', '_id categoryName')
                    .skip(skipFeed)
                    .limit(limitFeed);
            }


            // Send Category list one time to the frontend

            if (token != "") {

                let isTokenValid = await checkToken(token);
                if (isTokenValid.status) {
                    result.map(async item => {
                        item.content = item.content != "" ? JSON.parse(item.content) : "";
                        item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                        item.voteCount = await countVotes(item);
                        item.feedId = item._id
                        item.likedByCurrentUser = await checkCurrentVotedOrNot(item, isTokenValid.userData._id, "like")
                        item.dislikedByCurrentUser = await checkCurrentVotedOrNot(item, isTokenValid.userData._id, "dislike")
                    })

                    return result;
                } else {
                    result.map(async item => {
                        item.content = item.content != "" ? JSON.parse(item.content) : "";
                        item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                        item.voteCount = await countVotes(item);
                        item.feedId = item._id
                        item.likedByCurrentUser = ""
                        item.dislikedByCurrentUser = ""
                    })


                    return result;
                }
            }

            result.map(async item => {
                item.content = item.content != "" ? JSON.parse(item.content) : "";
                item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                item.voteCount = await countVotes(item);
                item.feedId = item._id
                item.likedByCurrentUser = ""
                item.dislikedByCurrentUser = ""

            })
            return result;
        } catch (error) {
            console.log(error)
        }
    },

    getSpecificPost: async(root, args, context) => {
        let { postId, token } = args

        try {
            let result = await feedModel
                .findOne({ _id: postId })
                .lean()
                .populate('postedBy', '_id fullName profileImageUrl')
                .populate('category', '_id categoryName')

            let currentUserId = "";
            if (token != "") {
                let isTokenValid = await checkToken(token);
                if (isTokenValid.status)
                    currentUserId = isTokenValid.userData._id;
            }

            if (result) {

                result.content != "" ? result.content = JSON.parse(result.content) : result.content = "";
                result.createdAt = moment(result.createdAt, 'YYYYMMDD').fromNow()
                result.feedId = result._id
                result.voteCount = await countVotes(result);
                result.postedBy.id = result.postedBy._id;
                if (token != "") {
                    result.likedByCurrentUser = await checkCurrentVotedOrNot(result, currentUserId, "like")
                    result.dislikedByCurrentUser = await checkCurrentVotedOrNot(result, currentUserId, "dislike");
                } else {
                    result.likedByCurrentUser = "gray";
                    result.dislikedByCurrentUser = "gray";
                }
                result.status = true
                result.error = ''
                result.msg = ''


                let answerResult = await answerFeedModel.find({ repliedFeedId: postId }).lean()
                    .populate('postedBy', '_id fullName profileImageUrl');
                result.answerCount = answerResult.length;
                answerResult.map(async item => {

                        item.content != "" ? item.content = JSON.parse(item.content) : item.content = "";
                        item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                        item.feedId = item._id
                        item.voteCount = await countVotes(item);
                        item.postedBy.id = item.postedBy._id;

                        if (token != "") {
                            item.likedByCurrentUser = await checkCurrentVotedOrNot(item, currentUserId, "like")
                            item.dislikedByCurrentUser = await checkCurrentVotedOrNot(item, currentUserId, "dislike");
                            item.canEditOrNot = common.checkCurrentUserCanEditOrNot(item, currentUserId);
                        } else {
                            item.likedByCurrentUser = "gray";
                            item.dislikedByCurrentUser = "gray";
                            item.canEditOrNot = false;
                        }
                    })
                    // console.log(answerResult);
                result.answers = answerResult;


            } else {
                let result = {}
                result.feedId = ''
                result.feedType = ''
                result.title = ''
                result.content = ''
                result.category = ''
                result.postedBy = { fullName: '', id: '', profileImageUrl: '' }
                result.likedBy = [0]
                result.createdAt = ''
                result.token = ''
                result.status = false
                result.msg = 'Post not found!'
                return result
            }


            return result
        } catch (error) {
            let result = {}
            result.feedId = ''
            result.feedType = ''
            result.title = ''
            result.content = ''
            result.category = ''
            result.postedBy = { fullName: '', id: '', profileImageUrl: '' }
            result.likedBy = [0]
            result.createdAt = ''
            result.token = ''
            result.status = false
            result.msg = error;
            return result
        }
    },

    postAnswer: async(root, args, context) => {
        let { token, content, repliedFeedId } = args;

        let isTokenValid = await checkToken(token)
        if (isTokenValid.status) {
            let ansfeedRef = answerFeedModel()
            ansfeedRef.feedType = 'Answer';
            ansfeedRef.content = content.trim();
            ansfeedRef.postedBy = isTokenValid.userData._id
            ansfeedRef.category = "";
            ansfeedRef.likedBy = [];
            ansfeedRef.dislikedBy = [];
            ansfeedRef.repliedFeedId = repliedFeedId;

            try {
                let result = await answerFeedModel.collection.insert(ansfeedRef);

                let answerResult = await answerFeedModel
                    .findOne({ "_id": result.insertedIds[0] })
                    .lean()
                    .populate('postedBy', '_id fullName profileImageUrl')

                answerResult.content = answerResult.content != "" ? JSON.parse(answerResult.content) : "";
                answerResult.feedId = result.insertedIds[0];
                answerResult.createdAt = moment(answerResult.createdAt, 'YYYYMMDD').fromNow()
                answerResult.voteCount = 0;
                answerResult.likedByCurrentUser = "gray";
                answerResult.dislikedByCurrentUser = "gray";
                answerResult.status = true;
                answerResult.msg = "Data Inserted!";
                answerResult.postedBy.id = answerResult.postedBy._id;
                answerResult.currentUserToken = token;

                // insert notification
                let notificationData = await common.insertNotification(isTokenValid.userData, repliedFeedId, "newAnswer", "wrote new Answer");

                answerResult.notificationData = notificationData;

                //  console.log("postedby",answerResult.postedBy._id,"currentUserToken",answerResult.currentUserId);
                //  console.log("answerResult",answerResult);
                return answerResult;
            } catch (error) {
                console.log(error);
            }

        } else {
            return { status: false, msg: "You are not authorize!" };
        }


    },

    getSpecificUserQuestions: async(root, args, context) => {
        let { userId } = args;
        try {
            let result = await feedModel
                .find({ postedBy: userId })
                .lean()
                .populate('postedBy', '_id fullName profileImageUrl');

            result.map(item => {
                item.content = item.content != "" ? JSON.parse(item.content) : "";
                item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                item.feedId = item._id
            })

            return result

        } catch (error) {
            console.log(error);
        }
    },

    getSpecificUserAnswers: async(root, args, context) => {
        let { userId } = args;

        try {

            let answerResult = await answerFeedModel.find({ postedBy: userId }).lean()
                .populate('postedBy', '_id fullName profileImageUrl');

            answerResult.map(item => {

                item.content != "" ? item.content = JSON.parse(item.content) : item.content = "";
                item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow()
                item.feedId = item._id
            })

            return answerResult;

        } catch (error) {
            console.log(error);
        }
    },

    likeAnswer: async(root, args, { pubsub }) => {
        let { token, answerId } = args;

        try {
            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {


                // check if answer posted by same user
                let postedByWhom = await answerFeedModel.find({
                    $and: [{ _id: answerId },
                        {
                            postedBy: isTokenValid.userData._id
                        }
                    ]
                });


                if (postedByWhom.length != 0)
                    return { status: false, msg: "You cannot like your own Answer!", voteCount: "" };


                // calculation rank
                await rankMaupulator(answerId, "answer", isTokenValid.userData._id, "like");

                //   check if the user liked already or not

                let checkLikeExisit = await answerFeedModel.find({ $and: [{ _id: answerId }, { likedBy: isTokenValid.userData._id }] });
                if (checkLikeExisit.length != 0) {
                    let unlike = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $pull: { "likedBy": isTokenValid.userData._id } });
                    let voteCount = getVoteCountOnFeed(answerId, "answer")
                    return { status: true, msg: "not_liked", voteCount: voteCount };
                }

                // check if user disliked this question or not

                let isDisliked = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $pull: { dislikedBy: { $in: [isTokenValid.userData._id] } } });


                let questionResult = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $push: { likedBy: isTokenValid.userData._id } });

                // insert notification
                let notificationData = await common.insertNotification(isTokenValid.userData, answerId, "answer", "like");

                if (questionResult) {
                    let voteCount = getVoteCountOnFeed(answerId, "answer")
                    return { status: true, msg: "Liked", voteCount: voteCount, notificationData: notificationData };

                } else
                    return { status: false, msg: "Question Not Found!" }

            }
        } catch (error) {
            console.log(error);
            return { status: false, msg: "Server Issue!" }
        }
    },

    dislikeAnswer: async(root, args, context) => {

        let { token, answerId } = args;

        try {
            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {


                // check if answer posted by same user
                let postedByWhom = await answerFeedModel.find({
                    $and: [{ _id: answerId },
                        {
                            postedBy: isTokenValid.userData._id
                        }
                    ]
                });


                if (postedByWhom.length != 0)
                    return { status: false, msg: "You cannot dislike your own Answer!", voteCount: "" };


                // calculation rank
                await rankMaupulator(answerId, "answer", isTokenValid.userData._id, "dislike");

                //   check if the user liked already or not

                let checkDislikeExisit = await answerFeedModel.find({ $and: [{ _id: answerId }, { dislikedBy: isTokenValid.userData._id }] });
                if (checkDislikeExisit.length != 0) {
                    let undislike = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $pull: { "dislikedBy": isTokenValid.userData._id } });
                    let voteCount = getVoteCountOnFeed(answerId, "answer")
                    return { status: true, msg: "liked", voteCount: voteCount };
                }

                // check if user liked this question or not

                let isliked = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $pull: { likedBy: { $in: [isTokenValid.userData._id] } } });


                let questionResult = await answerFeedModel.findOneAndUpdate({ _id: answerId }, { $push: { dislikedBy: isTokenValid.userData._id } });

                // insert notification
                let notificationData = await common.insertNotification(isTokenValid.userData, answerId, "answer", "dislike");

                if (questionResult) {
                    let voteCount = getVoteCountOnFeed(answerId, "answer")
                    return { status: true, msg: "DisLiked", voteCount: voteCount, notificationData: notificationData };
                } else
                    return { status: false, msg: "Answer Not Found!" }

            }
        } catch (error) {
            console.log(error);
            return { status: false, msg: "Server Issue!" }
        }

    },

    likeQuestion: async(root, args, context) => {
        let { token, questionId } = args;

        try {
            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {


                // check if answer posted by same user
                let postedByWhom = await feedModel.find({
                    $and: [{ _id: questionId },
                        {
                            postedBy: isTokenValid.userData._id
                        }
                    ]
                });
                if (postedByWhom.length != 0)
                    return { status: false, msg: "You cannot like your own Question!", voteCount: "" };

                // calculation rank
                await rankMaupulator(questionId, "question", isTokenValid.userData._id, "like");

                //   check if the user liked already or not
                let checkLikeExisit = await feedModel.find({ $and: [{ _id: questionId }, { likedBy: isTokenValid.userData._id }] });
                if (checkLikeExisit.length != 0) {
                    let unlike = await feedModel.findOneAndUpdate({ _id: questionId }, { $pull: { "likedBy": isTokenValid.userData._id } });
                    let voteCount = getVoteCountOnFeed(questionId, "question")
                    return { status: true, msg: "not_liked", voteCount: voteCount };
                }

                // check if user disliked this question or not
                let isDisliked = await feedModel.findOneAndUpdate({ _id: questionId }, { $pull: { dislikedBy: { $in: [isTokenValid.userData._id] } } });

                let questionResult = await feedModel.findOneAndUpdate({ _id: questionId }, { $push: { likedBy: isTokenValid.userData._id } });

                // insert notification
                let notificationData = await common.insertNotification(isTokenValid.userData, questionId, "question", "like");

                if (questionResult) {
                    let voteCount = getVoteCountOnFeed(questionId, "question")
                    return { status: true, msg: "Liked", voteCount: voteCount, notificationData: notificationData };

                } else
                    return { status: false, msg: "Question Not Found!" }

            }
        } catch (error) {
            console.log(error);
            return { status: false, msg: "Server Issue!" }
        }
    },

    dislikeQuestion: async(root, args, context) => {
        let { token, questionId } = args;

        try {
            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {

                // check if answer posted by same user
                let postedByWhom = await feedModel.find({
                    $and: [{ _id: questionId },
                        {
                            postedBy: isTokenValid.userData._id
                        }
                    ]
                });


                if (postedByWhom.length != 0)
                    return { status: false, msg: "You cannot dislike your own Question!", voteCount: "" };

                // calculation rank
                await rankMaupulator(questionId, "question", isTokenValid.userData._id, "dislike");

                //   check if the user liked already or not

                let checkDislikeExisit = await feedModel.find({ $and: [{ _id: questionId }, { dislikedBy: isTokenValid.userData._id }] });
                if (checkDislikeExisit.length != 0) {
                    let undislike = await feedModel.findOneAndUpdate({ _id: questionId }, { $pull: { "dislikedBy": isTokenValid.userData._id } });
                    let voteCount = getVoteCountOnFeed(questionId, "question")
                    return { status: true, msg: "not_liked", voteCount: voteCount };
                }

                // check if user liked this question or not

                let isliked = await feedModel.findOneAndUpdate({ _id: questionId }, { $pull: { likedBy: { $in: [isTokenValid.userData._id] } } });


                let questionResult = await feedModel.findOneAndUpdate({ _id: questionId }, { $push: { dislikedBy: isTokenValid.userData._id } });

                // insert notification
                let notificationData = await common.insertNotification(isTokenValid.userData, questionId, "question", "dislike");

                if (questionResult) {
                    let voteCount = getVoteCountOnFeed(questionId, "question")
                    return { status: true, msg: "DisLiked", voteCount: voteCount, notificationData: notificationData };
                } else
                    return { status: false, msg: "Question Not Found!" }

            }
        } catch (error) {
            console.log(error);
            return { status: false, msg: "Server Issue!" }
        }

    },

    getAllCategories: async(root, args, context) => {
        //let allCategories = await categoryModel.find({});
        let allCategories = await categoryModel.aggregate([{
            $lookup: {
                from: "feeds",
                localField: "_id",
                foreignField: "category",
                as: "questions"
            },

        }])

        allCategories.map((item) => {
            item.questionCount = item.questions.length;
        })



        return allCategories;
    },

    searchPosts: async(root, args, context) => {
        try {

            let { searchString } = args;

            let result = await feedModel.find({ title: new RegExp(searchString, 'i') }).limit(5);

            return result;

        } catch (error) {

        }
    },

    getAllQuestionsAndAnswerCount: async(root, args, context) => {
        try {
        
            let questionCount = await feedModel.find({}).count().lean();
            let answerCount = await answerFeedModel.find({}).count().lean();

            let result = {};
            result.questionCount = questionCount;
            result.answerCount = answerCount;
            result.status = true;
            result.msg = "";
            console.log("aya");
            console.log("result",result);
            return result;

        } catch (error) {

            return { status: false, msg: "Err", questionCount: "0", answerCount: "0" };

        }
    },

    getPopularPosts: async(root, args, context) => {
        try {

            let { postType } = args;



            let result;

            if (postType == "MOST_ANSWERED") {

                result = await answerFeedModel.aggregate([{
                        $group: { _id: { repliedFeedId: "$repliedFeedId" }, totalAnswers: { $sum: 1 } }
                    },
                    {
                        $lookup: {
                            from: "feeds",
                            localField: "_id.repliedFeedId",
                            foreignField: "_id",
                            as: "question"
                        }
                    },
                    {
                        $lookup: {
                            from: "allcategories",
                            localField: "question.category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "question.postedBy",
                            foreignField: "_id",
                            as: "postedBy"
                        }
                    },

                    {
                        $sort: { "totalAnswers": -1 }
                    },

                    {
                        $unwind: "$question"
                    },
                    {
                        $unwind: "$postedBy"
                    },
                    {
                        $unwind: "$category"
                    },
                    {
                        $project: {
                            _id: 0,
                            totalAnswers: 1,
                            question: {
                                title: 1,
                                createdAt: 1,
                                _id: 1
                            },
                            postedBy: {
                                fullName: 1,
                                profileImageUrl: 1
                            },
                            category: {
                                categoryName: 1
                            }
                        }
                    }
                ]).limit(5);

            } else if (postType == "CATEGORY") {


                result = await answerFeedModel.aggregate([{
                        $group: { _id: { repliedFeedId: "$repliedFeedId" }, totalAnswers: { $sum: 1 } }
                    },
                    {
                        $lookup: {
                            from: "feeds",
                            localField: "_id.repliedFeedId",
                            foreignField: "_id",
                            as: "questions"
                        }
                    },

                    { $match: { "questions.category": 'ObjectId("5e5a0a38a833d77648675864")' } },

                    {
                        $lookup: {
                            from: "allcategories",
                            localField: "questions.category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "questions.postedBy",
                            foreignField: "_id",
                            as: "postedBy"
                        }
                    },

                    {
                        $sort: { "totalAnswers": -1 }
                    },

                    {
                        $unwind: "$questions"
                    },
                    {
                        $unwind: "$postedBy"
                    },
                    {
                        $unwind: "$category"
                    },
                    {
                        $project: {
                            _id: 0,
                            totalAnswers: 1,
                            questions: {
                                title: 1,
                                createdAt: 1
                            },
                            postedBy: {
                                fullName: 1,
                                profileImageUrl: 1
                            },
                            category: {
                                categoryName: 1
                            }
                        }
                    }
                ])

            }


            result.map((item) => {
                item.question.createdAt = moment(item.question.createdAt, 'YYYYMMDD').fromNow()
            })
            return result;
        } catch (error) {
            console.log("error", error);
        }
    }

}

module.exports = feedController

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

async function countVotes(item) {

    let likes = item.likedBy.length;
    let dislikes = item.dislikedBy.length;

    // console.log("likedby->",item.likedBy.length);
    // console.log("dislikedBy->",item.dislikedBy.length);

    let count = likes - dislikes;
    //console.log(count);
    return count;

}

async function checkCurrentVotedOrNot(item, currentUserId, voteType) {
    if (voteType == "like") {
        let likeArr = item.likedBy;
        let x = likeArr.toString();

        if (x.indexOf(currentUserId) == -1)
            return "gray" // not_liked
        else
            return "black"; //liked
    } else {
        let dislikeArr = item.dislikedBy;
        let x = dislikeArr.toString();

        if (x.indexOf(currentUserId) == -1)
            return "gray" //not_disliked
        else
            return "black"; // disliked
    }

}

async function getVoteCountOnFeed(id, feedType) {
    if (feedType == "question") {
        let question = await feedModel.findOne({ "_id": id });
        let count = question.likedBy.length - question.dislikedBy.length;
        return count;
    } else {
        let answer = await answerFeedModel.findOne({ "_id": id });
        let count = answer.likedBy.length - answer.dislikedBy.length;
        return count;
    }
}

async function rankMaupulator(postId, postType, voterId, voteType) {
    let postOwnerId = "";
    let postOwnerInfo = "";
    if (postType == "question") {
        postOwnerId = await feedModel.findOne({ "_id": postId });
        postOwnerId = postOwnerId.postedBy;
        postOwnerInfo = await userModel.findOne({ "_id": postOwnerId });
    } else if (postType == "answer") {
        postOwnerId = await answerFeedModel.findOne({ "_id": postId });
        postOwnerId = postOwnerId.postedBy;
        postOwnerInfo = await userModel.findOne({ "_id": postOwnerId });
    }

    try {

        if (postType == "question") {
            let likeStatus = await feedModel.find({ $and: [{ _id: postId }, { likedBy: voterId }] });
            // console.log("likeStatus",likeStatus);
            let disLikeStatus = await feedModel.find({ $and: [{ _id: postId }, { dislikedBy: voterId }] });
            // console.log("dislikeStatus",disLikeStatus);

            if (voteType == "like" && likeStatus.length != 0 && disLikeStatus.length == 0) {
                // already liked so make it to the original -3 rank

                if (typeof postOwnerInfo.rank != "undefined" && postOwnerInfo.rank >= 3) {
                    let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -3 } })
                        //console.log("decUpdate",updateRank);
                }
            } else if (voteType == "like" && likeStatus.length == 0 && disLikeStatus.length != 0) {
                // disliked so increase to original then add 3 more means 6
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 6 } })
                    //  console.log("incUpdate",updateRank);
            } else if (voteType == "like" && likeStatus.length == 0 && disLikeStatus.length == 0) {
                // no votes is given so increase by 3
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 3 } })
                    // console.log("incOneUpdate",updateRank);
            } else if (voteType == "dislike" && likeStatus.length == 0 && disLikeStatus.length != 0) {
                // already disliked then makr it original increase 3
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 3 } })
                    //console.log("dislike incUpdate",updateRank);
            } else if (voteType == "dislike" && likeStatus.length != 0 && disLikeStatus.length == 0) {
                // liked then decrease to 6
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -6 } })
                    // console.log("dislike incUpdate",updateRank);
            } else if (voteType == "dislike" && likeStatus.length == 0 && disLikeStatus.length == 0) {
                // liked then decrease to 6
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -3 } })
                    //console.log("dislike incUpdate",updateRank);
            }
        } else if (postType == "answer") {
            let likeStatus = await answerFeedModel.find({ $and: [{ _id: postId }, { likedBy: voterId }] });
            //console.log("likeStatus",likeStatus);
            let disLikeStatus = await answerFeedModel.find({ $and: [{ _id: postId }, { dislikedBy: voterId }] });
            // console.log("dislikeStatus",disLikeStatus);

            if (voteType == "like" && likeStatus.length != 0 && disLikeStatus.length == 0) {
                // already liked so make it to the original -5 rank

                if (typeof postOwnerInfo.rank != "undefined" && postOwnerInfo.rank >= 5) {
                    let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -5 } })
                        //console.log("decUpdate",updateRank);
                }
            } else if (voteType == "like" && likeStatus.length == 0 && disLikeStatus.length != 0) {
                // disliked so increase to original then add 5 more means 10
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 10 } })
                    //console.log("incUpdate",updateRank);
            } else if (voteType == "like" && likeStatus.length == 0 && disLikeStatus.length == 0) {
                // no votes is given so increase by 5
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 5 } })
                    //console.log("incOneUpdate",updateRank);
            } else if (voteType == "dislike" && likeStatus.length == 0 && disLikeStatus.length != 0) {
                // already disliked then makr it original increase 5
                let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": 5 } })
                    //console.log("dislike incUpdate",updateRank);
            } else if (voteType == "dislike" && likeStatus.length != 0 && disLikeStatus.length == 0) {
                // liked then decrease to 10
                if (typeof postOwnerInfo.rank != "undefined" && postOwnerInfo.rank >= 10) {
                    let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -10 } })
                        //console.log("dislike incUpdate",updateRank);
                }
            } else if (voteType == "dislike" && likeStatus.length == 0 && disLikeStatus.length == 0) {
                // liked then decrease to 5
                if (typeof postOwnerInfo.rank != "undefined" && postOwnerInfo.rank >= 5) {
                    let updateRank = await userModel.findOneAndUpdate({ "_id": postOwnerInfo._id }, { $inc: { "rank": -5 } })
                        //console.log("dislike incUpdate",updateRank);
                }
            }
        }


    } catch (error) {
        console.log("error", error);
    }
}