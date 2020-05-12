const User = require('../../models/user.model');
const Follower = require('../../models/follower.model');
const dateFormat = require('../../helper/dateFormate.helper');
const constants = require('../../config/constants');
const commonFunction = require('../../helper/commonFunction.helper');
const logService = require('../../services/log.service');
const Lang = require('../../helper/response.helper');


/*      FOLLOW USER     */
exports.followUser = async (req, res, next) => {
  try {
      const _followerId = req.user._id
      const _userId = req.params.id
      var isUserExist = await User.findOne({_id : _userId, userType : {$in : [constants.USER_TYPE.USER, constants.USER_TYPE.BOT]}});
      
      if(!isUserExist){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("USER.USER_DETAILS_NOT_AVAILABLE", req.headers.lang),
            error: true,
            data:{}
          })
      }

      if(_userId == _followerId){
          return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("FOLLOW.SELF_FOLLOW", req.headers.lang),
            error: true,
            data:{}
          })
      }

      const alreadyFollowing = await Follower.find({_followerId, _userId})
      if (alreadyFollowing.length>0) {
         return res.status(400).send({
              status: constants.STATUS_CODE.FAIL,
              message: Lang.responseIn("FOLLOW.ALREADY_FOLLOWING", req.headers.lang),
              error: true,
              data: {}
          })
      }

      const newFollower = new Follower({
          _userId,
          _followerId,
          createdAt: dateFormat.setCurrentTimestamp(),
          updatedAt: dateFormat.setCurrentTimestamp(),
          syncAt: dateFormat.setCurrentTimestamp()
      })

      await newFollower.save()

      
      res.status(200).send({
          status: constants.STATUS_CODE.SUCCESS,
          message: Lang.responseIn("FOLLOW.FOLLOW_SUCCESS", req.headers.lang),
          error: false,
          data: newFollower
      })
      logService.responseData(req, newFollower);
  } catch (error) {
      console.log(error);
      res.status(500).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error: true,
          data: {},
      })
      logService.responseData(req, error);
  }
}

/*      UNFOLLOW USER     */
exports.unfollowUser = async (req, res, next) => {
  try {
      const _followerId = req.user._id
      const _userId = req.params.id

      const unfollowUser = await Follower.findOneAndDelete({_userId, _followerId})
      if(!unfollowUser){
        return res.status(400).send({
            status: constants.STATUS_CODE.FAIL,
            message: Lang.responseIn("FOLLOW.NOT_FOLLOWING", req.headers.lang),
            error: true,
            data: unfollowUser
        })    
      }
      res.status(200).send({
          status: constants.STATUS_CODE.SUCCESS,
          message: Lang.responseIn("FOLLOW.UNFOLLOW_SUCCESS", req.headers.lang),
          error: false,
          data: unfollowUser
      })

      logService.responseData(req, unfollowUser);
  } catch (error) {
      console.log(error);
      res.status(500).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error: true,
          data: {},
      })
      logService.responseData(req, error);
  }
}

/*      GET FOLLOWERS LIST     */
exports.getFollowersList =async(req, res, next)=> {
  try {
            const data = [];
            const sort = {};
            const search = req.query.q ? req.query.q : ''; // for searching
            if (req.query.sortBy) {
                const parts = req.query.sortBy.split(':');
                field = parts[0];
                parts[1] ==='desc' ? value=-1 : value= 1;
            }else{
                field = "createdAt",
                value = 1;
            }
            const pageOptions = {
                page: parseInt(req.query.page) || constants.PAGE,
                limit: parseInt(req.query.limit) || constants.LIMIT
            }
            var query = {
                deletedAt: { $eq: null },
                _userId: req.user._id,
            }
            if (search) {
                query.$or = [
                    { 'userName': new RegExp(search, 'i') },
                ]
            }
            const total = await Follower.countDocuments(query);

            const followers = await Follower.aggregate([
                { $match: query },
                { $lookup:
                    {
                        from: 'users',
                        localField: '_followerId',
                        foreignField: '_id',
                        as: '_followerId',
                    }
                },
                {$sort:{[field]: value}},
                { $project: 
                    {
                        "_followerId._id" : 1,
                        "_followerId.profilePic" : 1,
                        "_followerId.userName" : 1,
                    }
                }
            ])
            .skip((pageOptions.page - 1) * pageOptions.limit)
            .limit(pageOptions.limit)
            .collation({ locale: "en" });

            var image, followStatus;
            for(let i=0;i<followers.length;i++){
                var follower = followers[i]._followerId[0];
                var _followerId = follower._id
                // if(follower.profilePic){
                //     image = commonFunction.getProfilePicUrl(req,follower.profilePic);
                // }else{
                //     image = null;
                // }
                await commonFunction.getAWSImageUrl(follower)
                image = follower.profilePic;
                var userName = follower.userName
                var alreadyFollowing = await Follower.findOne({_followerId : req.user._id, _userId : follower._id})
                
                if(alreadyFollowing){
                    followStatus = constants.FOLLOW_STATUS.FOLLOWING
                }else{
                    followStatus = constants.FOLLOW_STATUS.NOT_FOLLOWING
                }
                data.push({_followerId, image, userName, followStatus})
            }

            var page = pageOptions.page;
            var limit = pageOptions.limit;
            
            res.status(200).send({
                status: constants.STATUS_CODE.SUCCESS,
                message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
                error: false,
                data: {data, page, limit, total}
            })
            // logService.responseData(req, data);
  } catch (error) {
      console.log(error);
      res.status(500).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error: true,
          data: {},
      })
    //   logService.responseData(req, error);
  }
}

/*      GET FOLLOWING LIST     */
exports.getFollowingList =async(req, res, next)=> {
  try {
        const data = [];
        const sort = {};
        const search = req.query.q ? req.query.q : ''; // for searching
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            field = parts[0];
            parts[1] ==='desc' ? value=-1 : value= 1;
        }else{
            field = "createdAt",
            value = 1;
        }
        const pageOptions = {
            page: parseInt(req.query.page) || constants.PAGE,
            limit: parseInt(req.query.limit) || constants.LIMIT
        }
        var query = {
            deletedAt: { $eq: null },
            _followerId: req.user._id,
        }
        if (search) {
            query.$or = [
                { 'userName': new RegExp(search, 'i') },
            ]
        }
        const total = await Follower.countDocuments(query);

        const following = await Follower.aggregate([
            { $match: query },
            { $lookup:
                {
                    from: 'users',
                    localField: '_userId',
                    foreignField: '_id',
                    as: '_userId',
                }
            },
            {$sort:{[field]: value}},
            { $project: 
                {
                    "_userId._id" : 1,
                    "_userId.profilePic" : 1,
                    "_userId.userName" : 1,
                }
            },
        ])
        .skip((pageOptions.page - 1) * pageOptions.limit)
        .limit(pageOptions.limit)
        .collation({ locale: "en" });

        var image, followStatus;
        for(let i=0;i<following.length;i++){
            var followingData = following[i]._userId[0];
            var _followingId = followingData._id
            // if(followingData.profilePic){
            //     // image = commonFunction.getProfilePicUrl(req,followingData.profilePic);
            // }else{
            //     image = null;
            // }
            await commonFunction.getAWSImageUrl(followingData);
            
            image = followingData.profilePic;
            var userName = followingData.userName
            var alreadyFollowing = await Follower.findOne({_followerId : req.user._id, _userId : followingData._id})
                if(alreadyFollowing){
                    followStatus = constants.FOLLOW_STATUS.FOLLOWING
                }else{
                    followStatus = constants.FOLLOW_STATUS.NOT_FOLLOWING
                }
            data.push({_followingId, image, userName, followStatus})
        }

        var page = pageOptions.page;
        var limit = pageOptions.limit;

        res.status(200).send({
            status: constants.STATUS_CODE.SUCCESS,
            message: Lang.responseIn("GENERAL.FETCH_SUCCESS", req.headers.lang),
            error: false,
            data: {data, page, limit, total}
      })
    //   logService.responseData(req, data);
  } catch (error) {
      console.log(error);
      res.status(500).send({
          status: constants.STATUS_CODE.FAIL,
          message: Lang.responseIn("GENERAL.GENERAL_CATCH_MESSAGE", req.headers.lang),
          error: true,
          data: {},
      })
    //   logService.responseData(req, error);
  }
}