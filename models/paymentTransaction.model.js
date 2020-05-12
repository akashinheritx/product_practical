const paymentTransactionSchema = new mongoose.Schema({
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    amount: {
        type: Number
    },
    transactionType:{
        type:Number
    },
    paidVia:{
        type:String
    },
    paymentToken:{
        type:String
    },
    adminApproval:{
        type:Number
    },
    transactionStatus:{
        type:Number
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

module.exports = mongoose.model('wallethistories', paymentTransactionSchema);