const kitImageSchema = new mongoose.Schema({
  kitName: {
    type: String,
    default: null
  },
  kitFrontImage: {
    type: String,
    required: true
  },
  kitBackImage: {
    type: String,
    required: true
  },
  kitDescription: {
    type: String,
    default: null
  },
  createdBy: {
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

module.exports = mongoose.model('kitimages', kitImageSchema);
