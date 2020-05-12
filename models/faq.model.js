var faqSchema = new mongoose.Schema({
  question: {
    type: String,
    default: null,
    trim: true
  },
  answer: {
    type: String,
    default: null,
    trim: true
  },
  createdBy: {
    // ref: mongoose.Schema.Types.ObjectId,
    type: String,
    default: null
  },
  createdAt: {
    type: Number
  },
  updatedAt: {
    type: Number
  }
});
var FAQ = mongoose.model('faq', faqSchema);
module.exports = FAQ;
