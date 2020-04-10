
const Model = require('./db_model')
const { userModel } = Model
const passwordHash = require('password-hash');
const jwt = require('jsonwebtoken');
const jwtSecret = "@shopaskyTheBest@";
const { PubSub }  = require('graphql-subscriptions');
const USER_LOGIN = 'userId';
const pubsub = new PubSub();



const userProfileController = {


  userSignup: async (root,args,{pubsub}) => {

    console.log(args);
  
    let {fullName,email,password,profileType} = args;

    if(fullName=="" || email=="" || password =="" || profileType=="" || fullName=== undefined || email=== undefined || password=== undefined || profileType===undefined)
    {
      return {status:-1,msg:"All parameters are required"};
    }

    let userRef = userModel()

    
    userRef.fullName = args.fullName.charAt(0).toUpperCase() + args.fullName.slice(1);
    userRef.email = args.email;
    userRef.password = passwordHash.generate(args.password);
    userRef.profileType = args.profileType;
    userRef.profileTypeUserId = "";
    userRef.profileImageUrl = "";

  
 
    try {

      let findResult = await userModel.findOne({"email":userRef.email});
    
      if(!findResult)
      {
        // insert user
        let token = jwt.sign({ val:userRef.email},jwtSecret);
        userRef.token = token;
        let result = await userModel.collection.insert(userRef);
        
        return { status:1,token:token} // User insterted
      }
      else
      {
         // already exisits
         console.log("Already exists");
         return {status:-1,token:""};
      }


    
    } catch (error) {
      console.log(error)
    }

    
  },

  userGoogleSignUp: async(root,args,{pubsub}) =>{

   let {fullName,email,profileType,profileTypeUserId,profileImageUrl} = args;

   if(fullName=="" || email=="" || profileType=="" || fullName=== undefined || email=== undefined || profileType===undefined)
    {
      return {status:-1,msg:"All parameters are required"};
    }

    let userRef = userModel();
    userRef.fullName = args.fullName.charAt(0).toUpperCase() + args.fullName.slice(1);
    userRef.email = args.email;
    userRef.profileType = args.profileType;
    userRef.profileTypeUserId = args.profileTypeUserId;
    userRef.profileImageUrl = args.profileImageUrl;

    try {

      let findResult = await userModel.findOne({"email":userRef.email});
      if(!findResult)
      {
        // insert user
        let token = jwt.sign({ val:userRef.email},jwtSecret);
        userRef.token = token;
        let result = await userModel.collection.insert(userRef);
        return { status:1,token:token} // User insterted
      }
      else
      {
         let token = jwt.sign({ val:userRef.email},jwtSecret);
         userRef.token = token;
         let updated_document = await userModel.findOneAndUpdate({"email":userRef.email},{$set:{"token":userRef.token}});
         return {status:1,token:token}
      }
      
    } catch (error) {
      
    }

   
    
  },

  

  userSigin: async (root,args,context) =>{
   
    let userRef = userModel()
    userRef.password = args.password;
    console.log("password",userRef.password);
    userRef.email = args.email;


    try {

      let findResult = await userModel.findOne({email:userRef.email});
       if(findResult===null)
       {
         return {status:"-1",token:"",msg:"Email does not exisit!",fullName:"",profileType:"",profileImageUrl:"",coverImageUrl:"",aboutText:""};
       }
       else
       {
        let isPassMatch = passwordHash.verify(userRef.password, findResult.password);
        if(isPassMatch)
        {
          let token = jwt.sign({ val:userRef.email},jwtSecret);
          console.log("new token",token);
          // update token
          await userModel.findOneAndUpdate({email:userRef.email},{$set:{token:token}});

            
          return {status:"1",token:JSON.stringify(token),msg:"ok",fullName:findResult.fullName,profileType:findResult.profileType,profileImageUrl:findResult.profileImageUrl,coverImageUrl:findResult.coverImageUrl,aboutText:findResult.aboutText,_id:findResult._id}
        }
        else
        {
          return {status:"-1",token:"",msg:"Incorrect Password",fullName:"",profileType:"",profileImageUrl:"",coverImageUrl:"",aboutText:""};
        }
       }
    

    } catch (error) {
      console.log(error);
    }
  },


  isUserSignin:async (parent, args, context, info) =>{
    let token = args.token;
    if(token)
    {
      let findResult = await userModel.findOne({token:token});
      if(findResult===null)
      {
        return {status:"-1",msg:"Incorrect token. Or token is expired! Try login again"};
      }
      else
      {
        return {status:"1",msg:"Ok"};
      }
    }
    else
    {
      return {status:"-1",msg:"Token is missing"};
    }
  },


  
 

  

}



module.exports = userProfileController

