const kitColorSchema = new mongoose.Schema({
  colorName: {
    type: String,
    default: null
  },
  hexCode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  },
  syncAt: {
    type: Number,
    default: null
  },
  deletedAt: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('Color', kitColorSchema);
