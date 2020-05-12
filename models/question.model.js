const questionSchema = new mongoose.Schema({
  _triviaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Trivia'
  },
  question: {
    type: String
  },
  option1: {
    type: String
  },
  option2: {
    type: String
  },
  option3: {
    type: String
  },
  option4: {
    type: String
  },
  correctAnswer: {
    type: String
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

module.exports = mongoose.model('questions', questionSchema);