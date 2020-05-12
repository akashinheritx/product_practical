const footBallFormationSchema = new mongoose.Schema({
  formationType: {
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

module.exports = mongoose.model('footBallFormations', footBallFormationSchema);