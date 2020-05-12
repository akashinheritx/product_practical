const userKitSchema = new mongoose.Schema({
  kitUserName: {
    type: String,
    default: null
  },
  kitLogoPosition: {
    type: Number,
    default: null
  },
  kitFrontImage: {
    type: String,
    default : null
  },
  kitBackImage: {
    type: String,
    default : null
  },
  kitColor: {
    type: String,
    default: null
  },
  _userId: {
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

module.exports = mongoose.model('userKit', userKitSchema);
