const bcrypt = require('bcryptjs');
const decode = require('jwt-decode');
const mongoose = require('mongoose');
const constants = require('../config/constants');
const commonMessage = require('../helper/commonMessage.helper');
const jwt = require('jsonwebtoken');
const keys = require('../keys/keys');
const dateFormat = require('../helper/dateFormate.helper');

const allMultipleDeviceLogin = constants.MULTIPLE_DEVICE_LOGIN || false;
const singleDeviceOnLoginLogOutOtherDevice = false;
const tokenExpireTime = constants.TOKEN_EXPIRE_TIME || '365d';
const Message = commonMessage.MESSAGE;
const Lang = require('../helper/response.helper');

const userSchema = new mongoose.Schema({
	firstName: {
		type: String,
		trim: true,
		default : null,
	},
	lastName: {
		type: String,
		trim: true,
		default : null,
	},
	userName: {
		type: String,
		trim: true,
	},
	password: {
		type: String,
		trim: true,
	},
	gender: {
		type: String,
		trim: true,
		default : null,
	},
	dob: {
		type: String,
		trim: true,
	},
	userType: {
		type: Number,
		trim: true,
	},
	registerType: {
		type: Number,
		trim: true,
	},
	countryCode: {
		type: String,
		trim: true,
		default:constants.COUNTRY_CODE,
	},
	mobileNumber: {
		type: String,
		trim: true,
		default: null,
	},
	isMobileVerified:{
		type: Number,
		trim: true,
		default: constants.USER.NOT_VERIFY,
	},
	tempMobileNumber : {
		type: String,
		trim: true,
		default: null,
	},
	email: {
		type: String,
		trim: true,
		lowercase: true,
	},
	isEmailVerified:{
		type: Number,
		trim: true,
		default: constants.USER.NOT_VERIFY,
	},
	tempEmail : {
		type: String,
		trim: true,
		default: null,
	},
	googleSocialId:{
		type: String,
		trim: true,
		default:null,
	},
	facebookSocialId:{
		type: String,
		trim: true,
		default:null,
	},
	appleSocialId:{
		type: String,
		trim: true,
		default:null,
	},
	profilePic: {
		type: String,
		default : null,
	},
	lat: {
		type: Number,
		trim: true,
	},
	long: {
		type: Number,
		trim: true,
	},
	resetPasswordToken: {
		type: String,
		default: null,
	},
	resetPasswordExpires: {
		type: Number,
		default: null,
	},
	otp: {
		type: Number,
	},
	otpExpires: {
		type: Number,
	},
	status: {
		type: Number,
		default: constants.STATUS.INACTIVE,
	},
	deviceTokens: [{
		deviceToken: {
			type: String,
			required: true,
			default: null,
		},
		deviceType: {
			type: String,
			require: true,
			default: null,			
		},
		token: {
			type: String,
			default: null,
		}
	}],
	boosters: [{
		_boosterId: {
		  type: mongoose.Schema.Types.ObjectId,
		  required: true,
		  ref: 'globalboostersettings'
		},
		boosterType:{
			type: Number,
		},
		boosterQty:{
		  type: Number,
		  default: 0,
		},
	}],
	deviceToken: {
		type: String,
		require: true,
		default: null,
	},
    deviceType: {
        type: String,
        require: true,
        default: null,
	},
	referralCode:{
		type: String,
		require: true,
	},
	_referBy:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users',
		default: null,
		require: true,
	},
	referredByName : {
		type: String,
		default : null
	},
	participatedInCount:{
		type: Number,
		default: 0,
	},
	badgeKey : {
		type: Number,
		default: constants.BADGE.DEFAULT_BADGE_KEY,
	},
	depositBalance:{
		type: Number,
		default: 0,
	},
	referralBalance:{
		type: Number,
		default: 0,
	},
	winningBalance:{
		type: Number,
		default: 0,
	},
	nameOnPanCard:{
		type: String,
		default: null,
	},
	panCardNumber:{
		type: String,
		default: null,
	},
	dobOnPanCard:{
		type: String,
		default: null,
	},
	city:{
		type: String,
		default: 'ahmedabad',
		lowercase: true,
	},
	state:{
		type: String,
		default: 'gujarat',
		lowercase: true,
	},
	country:{
		type: String,
		default: 'india',
		lowercase: true,
	},
	preferredLanguage:{
		type: String,
		default: 'en',
		lowercase: true,
	},
	panCardImage:{
		type: String,
		default: null,
	},
	isPanVerified:{
		type: Number,
		default: constants.USER.NOT_VERIFY,
	},
	tokens: [{
		token: {
			type: String,
			required: true,
		}
	}],
	createdAt: {
		type: Number,
	},
	updatedAt: {
		type: Number,
	},
	syncAt: {
		type: Number,
	},
	deletedAt: {
		type: Number,
		default : null,
	},
});

//checking if password is valid
userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

// find user by credentials 
userSchema.statics.findByCredential = async function (req, mobileNumber, email, password) {
	let user;
	if(mobileNumber){
		user = await User.findOne({mobileNumber, deletedAt:null });
	}else if(email){
		user = await User.findOne({ email, deletedAt:null });
	}
	
	if (!user) {
		// throw new Error(Message.USER_MOBILE_NOT_EXISTS);
		throw new Error(Lang.responseIn("USER.INVALID_CREDENTIALS", req.headers.lang));
	}

	if (!user.validPassword(password)){
		// throw new Error(Message.USER_MOBILE_NOT_EXISTS);
		throw new Error(Lang.responseIn("USER.INVALID_CREDENTIALS", req.headers.lang));
    }

	return user;
}

// device login 
userSchema.statics.checkSettingForDeviceLogin = async function (token) {
	//restrict user to login if setting for multidevice login is off
    if(!allMultipleDeviceLogin){
        if(((token).length) > 1){
			// throw new Error(Message.MULTIPLE_DEVICE_LOGIN_NOT_ALLOWED);
			throw new Error(Lang.responseIn("USER.MULTIPLE_DEVICE_LOGIN_NOT_ALLOWED", req.headers.lang));
        }
    }
}

// for generating token
userSchema.methods.generateToken = async function () {
	const user = this;
	const token = await jwt.sign({ _id: user._id.toString() }, keys.JWT_SECRET,{
		expiresIn: tokenExpireTime
	  });
	//all multiple device to login with same credential
	if(allMultipleDeviceLogin){
		user.tokens = user.tokens.concat({ token });
		await user.save();
		return token;
	}else{
		//on device other device login logout from all other devices
		if(singleDeviceOnLoginLogOutOtherDevice){
			user.tokens = [];
			user.tokens = user.tokens.concat({ token });
			await user.save();
			return token;
		}else{
			//if token not exist then add token else same token will remain as it is.
			if(((user.tokens).length) == 0){
				user.tokens = user.tokens.concat({ token });
				await user.save();
				return token;
			}else if(user.tokens.length>0){
			const decoded = decode(user.tokens[0].token)
			currentTime = await dateFormat.setCurrentTimestampInSeconds();
			console.log(decoded.exp < currentTime);
			if(decoded.exp < currentTime){
				user.tokens = [];
				user.tokens = user.tokens.concat({ token });
				await user.save();
				return token;
			}else{
				//if token is not esxpired then it will come here
			}
			}
		}
	}
}

// to send minimal objects
userSchema.methods.toJSON = function () {
	const user = this;
	const userObj = user.toObject();
	return userObj;
}

var User = mongoose.model('users', userSchema);
module.exports = User;