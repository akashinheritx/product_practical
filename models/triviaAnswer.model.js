const triviaAnswerSchema = new mongoose.Schema({
  _triviaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Trivia'
  },
  _questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Question'
  },
  answer: {
    type: String,
  },
  isCorrectAnswer:{
    type: Number,
  },
  createdAt: {
    type: Number,
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

module.exports = mongoose.model('triviaAnswers', triviaAnswerSchema);
