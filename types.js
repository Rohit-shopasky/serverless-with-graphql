let Types = `type Chat {
    id: Int!
    from: String!
    message: String!
  }
  
   type SimpleText {
     
     text: String!
   }

   type userType{
       _id:               String!
       fullName:          String!
       email:             String!
       password:          String!
       profileType:       String!
       profileTypeUserId: String!
       profileImageUrl:   String!
       coverImageUrl:     String!
       createdAt:         String!
       updatedAt:         String!
       aboutText:         String!
       gender:            String!
       token:             String!
       status:            String!
       msg:               String!
       questions:         [feed]
       answers:           [answerFeed]
      questionCount:      String!
      

   }

   type response{
     token:                 String!
      status:                String!
      msg:                   String! 
   }

   type likes{
     likedBy:            String!
     likedAt:            String!
   }

   type dislikes{
    dislikedBy:            String!
    dislikedAt:            String!
  }

   type postedByUser{
     fullName:            String!
     id:                  String!
     profileImageUrl:     String!
   }

   type feed{
      _id:                   String!
      feedId:                String!
      feedType:              String!
      title:                 String!
      content:               String!
      category:              category
      postedBy:              postedByUser       
      likedBy:               [likes]
      dislikedBy:            [dislikes]
      likedByCurrentUser:    String!
      dislikedByCurrentUser: String!
      answerCount:           String!
      voteCount:             String!
      createdAt:             String!
      token:                 String!
      status:                String!
      msg:                   String! 
      answers:               [answerFeed] 
      page:                  String!
      notification:          notification
      
    }

   type answerFeed {
     feedId:                String!
     feedType:              String!
     content:               String!
     createdAt:             String!
     category:              String!
     likedBy:               [likes]
     repliedFeedId:         feed
     likedByCurrentUser:    String!
     dislikedByCurrentUser: String!
     voteCount:             String!
     canEditOrNot:          String!
     currentUserToken:      String!
     postedBy:              postedByUser
     token:                 String!
     status:                String!
     msg:                   String!
     notification:          notification
    
   }

   type category {
     _id:                  String!
     categoryName:         String!
     categoryImage:        String!
     questionCount:        String!
     answerCount:          String!
   }

   type notification {
     _id:                  String!
     to:                   String!
     from:                 postedByUser
     content:              String!
     link:                 String!
     createdAt:            String!
     expireAt:             String!
     seen:                 Boolean!
     status:               String!
     msg:                  String!
   }

   type postCount {
     _id:                  String!
     questionCount:        String!
     answerCount:          String!
     status:               String!
     msg:                  String!
   }


   type popularPost {
     totalAnswers:       String!
     question:           feed
     category:           category
     createdAt:          String!
     postedBy:           postedByUser
     status:             String!
     msg:                String!
   }

  
  `;

module.exports = Types;