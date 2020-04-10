const Model = require('./db_model')
const { userModel, notificationModel} = Model
const { PubSub } = require('graphql-subscriptions')
const USER_LOGIN = 'userId'
const pubsub = new PubSub()
const moment = require('moment');
const common = require("./common");

const notificationController = {


    getAllNotifications: async(root, args, context) => {
        try {
            
            let {token} = args;
            
            let isTokenValid = await common.checkToken(token)
            if(isTokenValid.status==true)
            {
                let data = await notificationModel.find({to:isTokenValid.userData._id})
                .populate("from", "fullName profileImageUrl")
                .sort({"_id":-1}).lean();

                 data.map(async (item)=>{
                      console.log("createdAt",item.createdAt);
                     item.createdAt = moment(item.createdAt, 'YYYYMMDD').fromNow();
                     //item.createdAt = moment("20111031", "YYYYMMDD").fromNow(); // 8 years ago
                     
                 })
               // console.log(data);
                return data;
            }
            

        } catch (error) {
            console.log("error",error);
            return {status:false,msg:"Something went wrong!"};
            
        }
    },

    seenNotification: async (root, args, context) =>{
        try {

            let {token,notificationList} = args;
            let isTokenValid = await common.checkToken(token)
            if(isTokenValid.status==true)
            {
                let data = await notificationModel.updateMany({"_id":{"$in":notificationList}},{$set:{seen:true}})
                return {status:true,msg:""};
            }
            else
            return {status:false,msg:"Token Error"}


            
        } catch (error) {
            console.log("error",error);
            return {status:false,msg:"Something went wrong!"};
        }

    }

}

module.exports = notificationController;