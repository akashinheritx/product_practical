const submitTriviaAnswersSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users'
    },
    _triviaId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    _questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    _answerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default : null,
    },
    isCorrectAnswer: {
      type: Number
    },
    timeSpent:{
      type: Number
    },
    timeSpentInMilliSec:{
      type: Number,
      default: null,
    },
    createdAt: {
      type: Number
    },
    updatedAt: {
      type: Number
    },
    syncAt: {
      type: Number
    },
    deletedAt: {
      type: Number,
      default: null
    }
});
  
module.exports = mongoose.model('submitTriviaAnswers', submitTriviaAnswersSchema);