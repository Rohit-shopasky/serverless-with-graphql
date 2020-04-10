const Types = require("./types");


let Query = `
type Query {
  chats: [Chat]

  userSignin(email:String!, password: String!) : userType

  isUserSignin(token:String!) : userType

  getAllFeeds(token:String!,page:String!,categoryId:String!,userId:String!) : [feed]

  getSpecificPost(postId:String!,token:String!) : feed

  getSpecificUserQuestions(userId:String!): [feed]

  getSpecificUserAnswers(userId:String!):[answerFeed]

  getUserProfile(userId:String!) : userType

  getAllCategories:[category]

  getAllUsers:[userType]

  getSpecificUserDetails(userId:String!):userType

  searchPosts(searchString:String!):[feed]
  
  getAllNotifications(token:String!): [notification]

  getAllQuestionsAndAnswerCount: postCount

  getPopularPosts(postType:String!) : [popularPost]
}
`;

let Mutation = `
type Mutation {
  sendMessage(from: String!, message: String!): Chat

  sendText(text:String!) : SimpleText

  userSignup(fullName:String!,email:String!,password:String!,profileType:String!,profileTypeUserId:String!,profileImageUrl:String!,status:String!) : userType

  userGoogleSignup(fullName:String!,email:String!,password:String!,profileType:String!,profileTypeUserId:String!,profileImageUrl:String!,status:String!) : userType

  postQuestion(feedType:String!,title:String!,content:String!,category:String!,postedBy:String!,createdAt:String!,token:String!,status:String!,msg:String!) : feed

  postAnswer(token:String!,content:String!,repliedFeedId:String!) : answerFeed

  likeAnswer(token:String!,answerId:String!) : answerFeed
 
  dislikeAnswer(token:String!,answerId:String!) : answerFeed

  likeQuestion (token: String!,questionId:String) : feed

  dislikeQuestion (token: String!,questionId:String) : feed

  editAnswer(token:String!,answerId:String,content:String!) : answerFeed

  editQuestion(token:String!,questionId:String!,title:String!,content:String!,category:String!) : feed

  deleteAnswer(token:String!,answerId:String!) : answerFeed

  deleteQuestion(token:String!,questionId:String!) :feed
  
  editProfile(token:String!,fullName:String!,gender:String!,profileImageString:String!,coverImageString:String!,aboutText:String!) : userType

  seenNotification(token:String!,notificationList:[String!]) : notification

}
`;

let Subscription = `

type Subscription {
  
  newQuestionPost:feed
  newAnswerPost(feedId:String!):answerFeed
  newNotification(userId:String!):notification
}

`;

const typeDefs = Types + Query + Mutation + Subscription;

module.exports = typeDefs