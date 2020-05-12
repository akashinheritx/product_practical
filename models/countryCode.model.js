const countryCodeSchema = new mongoose.Schema({
    countryName: {
        type: String,
    },
    countryCode: {
        type: String,
    },
    prefixDialing: {
        type: String,
    }
});

const Country = mongoose.model('countryCodes', countryCodeSchema);
module.exports = Country;