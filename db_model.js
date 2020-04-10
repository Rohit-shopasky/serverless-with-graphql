const mongoose = require('mongoose')
mongoose.connect(
    'mongodb+srv://shopasky:123456789hii@cluster0-8gjxo.mongodb.net/shop?retryWrites=true&w=majority', { useNewUrlParser: true,useUnifiedTopology: true }
)
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))

const AutoIncrement = require('mongoose-sequence')(mongoose)
const Schema = mongoose.Schema

const user = new mongoose.Schema({
    userId: Number,
    fullName: { type: String },
    email: { type: String },
    password: { type: String },
    gender:{type:String},
    profileType: { type: String },
    profileTypeUserId: { type: String },
    profileImageUrl: { type: String },
    coverImageUrl:{type:String},
    aboutText:{type:String},
    token: [],
    rank:{type:Number,default:0},
    createdAt: { type: Date, default: new Date() },
    updatedAt:{type:Date}
})
user.plugin(AutoIncrement, { inc_field: 'userId' }) // plugin added for auto increment order id

const feed = new mongoose.Schema({
    feedType: String,
    title: String,
    content: String,
    category: { type: Schema.Types.ObjectId, ref: 'allCategories' },
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() }
})

const beforeEditQuestion = new mongoose.Schema({
    feedType: String,
    title: String,
    content: String,
    category: String,
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() }
})

const answerFeed = new mongoose.Schema({
    feedType: String,
    content: String,
    category: String,
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() },
    repliedFeedId: { type: Schema.Types.ObjectId, ref: 'Feeds' }
})

const beforeEditAnswer = new mongoose.Schema({
    feedType: String,
    content: String,
    category: String,
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() },
    repliedFeedId: { type: Schema.Types.ObjectId, ref: 'Feeds' }
})

const deletedAnswers = new mongoose.Schema({
    feedType: String,
    content: String,
    category: String,
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() },
    repliedFeedId: { type: Schema.Types.ObjectId, ref: 'Feeds' }
})

const deletedQuestions = new mongoose.Schema({
    feedType: String,
    title: String,
    content: String,
    category: String,
    postedBy: { type: Schema.Types.ObjectId, ref: 'Users' },
    likedBy: { type: Array },
    dislikedBy: { type: Array },
    createdAt: { type: Date, default: new Date() }
})

const allCategories = new mongoose.Schema({
    categoryName: String,
    categoryImage:String,
    createdAt:{type:Date,default:new Date()}
});

const notifications = new mongoose.Schema({
    to: {type: Schema.Types.ObjectId, ref: 'Users' },
    from:{type: Schema.Types.ObjectId, ref: 'Users' },
    content:{type:String,default:""},
    link:{type:String,default:""},
    seen:{type:Boolean,default:false},
    createdAt:{type: Date, default: new Date()},
    expireAt:{type:Date},

});


const Schemas = {
    userModel: mongoose.model('Users', user),
    feedModel: mongoose.model('Feeds', feed),
    answerFeedModel: mongoose.model('AnswerFeeds', answerFeed),
    beforeEditAnswerModel: mongoose.model('beforeEditAnswers', beforeEditAnswer),
    deletedAnswerModel: mongoose.model('deletedAnswers', deletedAnswers),
    beforeEditQuestionModel: mongoose.model('beforeEditQuestions', beforeEditQuestion),
    deletedQuestionModel: mongoose.model('deletedQuestions', deletedQuestions),
    categoryModel: mongoose.model('allCategories', allCategories),
    notificationModel: mongoose.model('notifications',notifications),
}

module.exports = Schemas