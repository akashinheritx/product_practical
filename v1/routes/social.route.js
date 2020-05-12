const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router();
const passport = require('passport')
const googlePlusTokenStrategy = require('passport-google-plus-token')
const FacebookTokenStrategy = require('passport-facebook-token')

const keys = require('../../keys/keys');
const Social = require('../../models/social.model')

const signToken = user => {
    return jwt.sign({
        iss:'codework',
        sub:req.user.id,
        iat:new Date().getTime(), //current time
        exp:new Date().setDate(new Date().getDate()+1) //current time + 1 day ahead
    }, keys.JWT_SECRET)
}

//Google Oauth strategy
passport.use('googleToken', new googlePlusTokenStrategy({

    clientID:keys.CLIENT_ID,
    clientSecret:keys.CLIENT_SECRET

}, async function(accessToken, refreshToken, profile, done) {
   
    try{
            console.log('accessToken', accessToken)
            console.log('refreshToken', refreshToken)
            console.log('profile',profile)
    
            //check in DB whether the user exist or not
            const existingUser = await Social.findOne({"google.id": profile.id})
                if(existingUser){
                    console.log('user already exist in our DB')
                    return done(null, existingUser)
                        }

             //If that not the case
            console.log('user donesnt exist we are creating new one')
            const newSocialUser = new Social({
            method:'google',
            google:{
                id:profile.id,
                name:profile.name.givenName+' '+profile.name.familyName,
                email:profile.emails[0].value,
                token:accessToken
        
            }
            })
            await newSocialUser.save()
            done(null, newSocialUser)
        }catch (error){
        done(error, false, error.message)
    }
}))

//google oauth router
router.post('/oauth/google', passport.authenticate('googleToken', {session:false}), async(req,res)=> {
    try{
     
    console.log('req.user', req.user)
    const token = signToken(req.user)
    res.status(200).json({token})
}catch(error){
    console.log(error);
      
    res.status(400).send({
        message: "Unable to fetch user",
        error: true,
        e: error
    });
}
})

//facebook authentication
passport.use('facebookToken', new FacebookTokenStrategy({

    clientID:keys.APP_ID,
    clientSecret:keys.APP_SECRET

}, async function(accessToken, refreshToken, profile, done) {
   
    try{
            console.log('accessToken', accessToken)
            console.log('refreshToken', refreshToken)
            console.log('profile',profile)
    
            //check in DB whether the user exist or not
            const existingUser = await Social.findOne({"facebook.id": profile.id})
                if(existingUser){
                    // console.log('user already exist in our DB')
                    return done(null, existingUser)
                        }

             //If that not the case
            // console.log('user donesnt exist we are creating new one')
            const newSocialUser = new Social({
            method:'facebook',
            facebook:{
                id: profile.id,
                email: profile.emails[0].value        
            }
            })
            await newSocialUser.save()
            done(null, newSocialUser)
        }catch (error){
        done(error, false, error.message)
    }
}))
  //facebook oauth router
router.post('/oauth/facebook', passport.authenticate('facebookToken', {session:false}), async(req,res)=> {
    try{
     
    console.log('req.user', req.user)
    const token = signToken(req.user)
    res.status(200).json({token})
}catch(error){
    console.log(error);
      
    res.status(400).send({
        message: "Unable to fetch user",
        error: true,
        e: error
    });
}
})

module.exports = router