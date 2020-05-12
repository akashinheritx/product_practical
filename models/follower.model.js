const followerSchema = new mongoose.Schema({
  _userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  _followerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
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

module.exports = mongoose.model('followers', followerSchema);