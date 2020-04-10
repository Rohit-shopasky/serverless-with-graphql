
const Model = require('./db_model')
const moment = require('moment');

const { notificationModel,answerFeedModel,feedModel,userModel } = Model
 const common = {

     countVotes : async (item)=>{

        let likes = item.likedBy.length;
        let dislikes = item.dislikedBy.length;
     
       // console.log("likedby->",item.likedBy.length);
       // console.log("dislikedBy->",item.dislikedBy.length);
       
        let count = likes - dislikes;
        //console.log(count);
        return count;
       
     } 
,
checkCurrentVotedOrNot: async(item,currentUserId,voteType)=>
{
    if(voteType=="like")
    {
      let likeArr = item.likedBy;
      let x= likeArr.toString();
      
      if(x.indexOf(currentUserId)==-1)
      return "gray"  // not_liked
      else
      return "black";     //liked
    }
    else
    {
      let dislikeArr = item.dislikedBy;
      let x= dislikeArr.toString();
      
      if(x.indexOf(currentUserId)==-1)
      return "gray" //not_disliked
      else
      return "black"; // disliked
    }
  
},

checkCurrentUserCanEditOrNot: async (item,currentUserId) =>{
  let postedBy = await item.postedBy._id.toString();
  currentUserId =await currentUserId.toString();
  if(postedBy==currentUserId)
  return "TRUE";
  else
  return "FALSE";

},

insertNotification:async (actionUserData,postId,postType,actionType) =>{

  
  // find postOwnwerId
  let postOwnwerId;
  let postLink;
  let content = "";
  if(postType=="answer")
  {
     let data = await answerFeedModel.findOne({"_id":postId});
     postOwnwerId = data.postedBy;
     postLink = data.repliedFeedId;
     content =  actionType + "s your " + postType + ".";
  }
  else if(postType=="question")
  {
    let data = await feedModel.findOne({"_id":postId});
    postOwnwerId = data.postedBy;
    postLink = data._id;
    content =  actionType + "s your " + postType + ".";
  }
  else if(postType=="newAnswer")
  {
    let data = await feedModel.findOne({"_id":postId});
    postOwnwerId = data.postedBy;
    postLink = data._id;
    content = actionType + " on your Question."
  }

  // insert into notification table

  let notificRef = notificationModel();
  notificRef.to = postOwnwerId;
  notificRef.from = actionUserData._id;
  notificRef.content = content;
  notificRef.link = postLink;
  let notificationData = await notificationModel.collection.insert(notificRef);
  let data = notificationData.ops[0]

  let notificSendData = {};
  notificSendData._id = data._id;
  notificSendData.to = postOwnwerId;
  notificSendData.content = content;
  notificSendData.link = postLink;
  notificSendData.from = {};
  notificSendData.from.fullName = actionUserData.fullName;
  notificSendData.from.profileImageUrl = actionUserData.profileImageUrl;
  notificSendData.createdAt = moment(new Date(), 'YYYYMMDD').fromNow();

  return notificSendData;

},

checkToken: async (token) =>{

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

 }

 module.exports = common;

 