const constants = require('../config/constants');

const badgeSchema = new mongoose.Schema({
    badgeName: {
        type: String,
        required: true,
    },
    badgeKey : {
		type: Number,
	},
    contestCount: {
        type: Number
    },
    badgeImage: {
        type: String,
        default : null
    },
    isActive: {
        type: Number,
        default : constants.STATUS.ACTIVE,
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

module.exports = mongoose.model('badges', badgeSchema);
