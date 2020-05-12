const bankAccountDetailsSchema = new mongoose.Schema({
    _userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    beneId: {
        type: String,
    },
    fullName: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    bankAccount:{
        type: String
    },
    ifsc:{
        type: String
    },
    address1:{
        type: String
    },
    address2:{
        type: String
    },
    city:{
        type: String
    },
    state:{
        type: String
    },
    pincode:{
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

module.exports = mongoose.model('bankAccountDetails', bankAccountDetailsSchema);
