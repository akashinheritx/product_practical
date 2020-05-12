const prizeBreakDownSchema = new mongoose.Schema({
  _triviaId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Trivia'
  },
  from: {
    type: Number
  },
  to:{
    type: Number
  },
  amount:{
    type: Number
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

module.exports = mongoose.model('prizeBreakDowns', prizeBreakDownSchema);