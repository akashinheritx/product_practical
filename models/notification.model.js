let mongoosePaginate = require('mongoose-paginate');
const constants = require('../config/constants');

let notificationSchema = new mongoose.Schema({
    notification: {
        type: String,
        required: true
    },
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    _contestId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    contestName: {
      type: String,
      default: null
    },
    _teamId: {
      type: mongoose.Schema.Types.ObjectId,
      default : null
    },
    orderId: {
      type: String,
      default : null
    },
    notificationType: {
      type: String,
      required: true
    },
    notificationImage: {
      type: String,
      required: true
    },
    isRead: {
      type: Number,
      default : constants.NOTIFICATION_READ.UNREAD
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
notificationSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('notifications', notificationSchema);