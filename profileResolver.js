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
const AWS = require('aws-sdk');
const ID = 'AKIAUH22NT7ZTSOT7VVV';
const SECRET = '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';
const BUCKET_NAME = 'shopakyimagebucket';
const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});




const editController = {
    getUserProfile: async(root, args, context) => {
        let { userId } = args;
         
        try {
            // let isTokenValid = await checkToken(token)
            // if (isTokenValid.status) {
            //     let sendData = isTokenValid.userData;

                let sendData = await userModel.findOne({"_id":userId}).lean();
                
                sendData.status = true;
                sendData.msg = "";
                console.log("sendData",sendData);

                let allAnswers = await answerFeedModel.find({postedBy:userId}).lean()
                .populate("repliedFeedId",'_id title')
                .sort({"_id":-1})
                ;
                //console.log("allAns",allAnswers);
                sendData.answers = allAnswers;
                sendData.answers.map((item)=>{
                   // item.repliedFeedId.feedId = item.repliedFeedId._id ===null ? "" : item.repliedFeedId._id
                   if(item.repliedFeedId===null)
                   {
                       item.repliedFeedId = {};
                       item.repliedFeedId.feedId = "";
                       item.repliedFeedId.title = "This Question was deleted by the user. So all answers releated to this question is also deleted";
                   }
                   else
                   {
                       item.repliedFeedId.feedId = item.repliedFeedId._id;
                       item.repliedFeedId.title = item.repliedFeedId.title;
                   }

                    item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow();
                    let answerContent = JSON.parse(item.content);
                    item.content = answerContent.trim();
                })

                let allQuestions = await feedModel.find({postedBy:userId}).lean().sort({"_id":-1});
                 sendData.questions = allQuestions;
                 sendData.questions.map((item)=>{
                    item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow();
                    item.feedId = item._id;
                 })
                 
                return sendData;
            // } else {
            //     return { status: false, msg: "No user found!" }
            // }

        } catch (error) {
            console.log(error);
            return { status: false, msg: "Something went wrong!" }
        }
    },
    editProfile: async(root, args, context) => {

        let {token,fullName,gender,profileImageString,coverImageString,aboutText} = args;
        console.log("args",args);

        try { 
            
            let isTokenValid = await checkToken(token)
            if (isTokenValid.status) {

                let profileImageValue ="";
                let coverImageValue = "";

                if(profileImageString!=""  && profileImageString.indexOf(BUCKET_NAME)==-1)
                {
                profileImageString = await uploadFileToS3(isTokenValid.userData._id + "_profilePic",profileImageString);
                profileImageValue = profileImageString.data.Location;
                }
                else if(profileImageString.indexOf(BUCKET_NAME)!=-1)
                profileImageValue = profileImageString;
                else
                profileImageValue ="";


                if(coverImageString!="" && coverImageString.indexOf(BUCKET_NAME)==-1)
                {
                coverImageString = await uploadFileToS3(isTokenValid.userData._id + "_coverPic",coverImageString);
                coverImageValue = coverImageString.data.Location;
                }
                else if(coverImageString.indexOf(BUCKET_NAME)!=-1)
                coverImageValue = coverImageString;
                else 
                coverImageValue="";   
                

              let updatedResult = await userModel.findOneAndUpdate({"_id":isTokenValid.userData._id},{$set:{fullName:fullName,gender:gender,profileImageUrl:profileImageValue,coverImageUrl:coverImageValue,aboutText:aboutText}},{new:true});

               updatedResult.status = true;
               updatedResult.msg = "";

              let updatedProfile = await userModel.findOne({"_id":isTokenValid.userData._id}).lean();
              
              
              updatedProfile.status = true;
              updatedProfile.msg = "Profile Updated!";
                
              return updatedProfile;
            }
            else
            {
                return { status: false, msg: "No user found!",fullName:"",gender:"",profileImageString:"", coverImageString:"",aboutText:""}
            }
            
        } catch (error) {
            console.log(error);
            return { status: false, msg: "Something went wrong!",fullName:"",gender:"",profileImageString:"", coverImageString:"",aboutText:"" }
        }
    },
   

getAllUsers: async(root,args,context)=>{
    try {
       
         let data = await userModel.aggregate([
             {
                 $lookup:{
                     from:"feeds",
                     localField:"_id",
                     foreignField:"postedBy",
                     as:"questions"
                 }
             }
         ])
         console.log("data",data);

         data.map((item)=>{
            item.questionCount = item.questions.length
         })

        return data;
    } catch (error) {
        console.log(error);
        return { status: false, msg: "Something went wrong!"}
    }
},

getSpecificUserDetails:async(root,args,context) =>{
  try {

    let {userId} = args;
    let data = await userModel.findOne({"_id":userId})
    console.log("data",data);
    return data;
      
  } catch (error) {
      
  }
}

}



async function checkToken(token) {
    let returnObj = {}
    if (token) {
        try {
            let findResult = await userModel.findOne({ token: token }).lean();
            
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


async function uploadFileToS3(fileName,fileValue)
{
      return new Promise((resolve,reject)=>{
        let buf = new Buffer(fileValue.replace(/^data:image\/\w+;base64,/, ""),'base64')
        s3.upload( {Bucket:BUCKET_NAME,Key:fileName,Body:buf,ContentEncoding: 'base64',
        ContentType: 'image/jpeg',ACL:"public-read"},(err,data)=>{
            if(err)
               reject({status:false,data:data});
            else
            {
               //console.log("data",data);
                resolve({status:true,data:data});
            }
            
        })
      }) 
      
}





module.exports = editController;