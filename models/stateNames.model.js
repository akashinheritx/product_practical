const stateNamesSchema = new mongoose.Schema({
    stateName: {
        type: String,
    },
    stateType: {
        type: String,
    },
});

const State = mongoose.model('stateNames', stateNamesSchema);
module.exports = State;