const constants = require('../../config/constants');
const fs = require('fs');

makeFolders = () => {

        // make public folder
        if (!fs.existsSync(constants.PUBLIC_PATH)) {
            console.log('Public folder created')
            fs.mkdirSync(constants.PUBLIC_PATH);
        }

        // make image folder
        if (!fs.existsSync(constants.PUBLIC_FILE_PATH)) {
            fs.mkdirSync(constants.PUBLIC_FILE_PATH);
            console.log('Files folder created')
        }

        // make logo folder
        if (!fs.existsSync(constants.PUBLIC_IMAGE_PATH)) {
            fs.mkdirSync(constants.PUBLIC_IMAGE_PATH);
            console.log('Images folder created')
        }

        // make badge image folder
        if (!fs.existsSync(constants.PUBLIC_IMAGE_BADGE_IMAGE_PATH)) {
            fs.mkdirSync(constants.PUBLIC_IMAGE_BADGE_IMAGE_PATH);
            console.log('Badge image folder created')
        }

        // copy level 1 badge image
        if (!fs.existsSync(constants.LEVEL1_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Novice3.png', `./public/images/badgeImage/Novice3.png`);
            console.log('Level 1 Badge image copied.')
        }

        // copy level 2 badge image
        if (!fs.existsSync(constants.LEVEL2_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Novice2.png', `./public/images/badgeImage/Novice2.png`);
            console.log('Level 2 Badge image copied.')
        }

        // copy level 3 badge image
        if (!fs.existsSync(constants.LEVEL3_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Novice1.png', `./public/images/badgeImage/Novice1.png`);
            console.log('Level 3 Badge image copied.')
        }

        // copy level 4 badge image
        if (!fs.existsSync(constants.LEVEL4_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Bronze3.png', `./public/images/badgeImage/Bronze3.png`);
            console.log('Level 4 Badge image copied.')
        }

        // copy level 5 badge image
        if (!fs.existsSync(constants.LEVEL5_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Bronze2.png', `./public/images/badgeImage/Bronze2.png`);
            console.log('Level 5 Badge image copied.')
        }


        // copy level 6 badge image
        if (!fs.existsSync(constants.LEVEL6_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Bronze1.png', `./public/images/badgeImage/Bronze1.png`);
            console.log('Level 6 Badge image copied.')
        }

        // copy level 7 badge image
        if (!fs.existsSync(constants.LEVEL7_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Silver3.png', `./public/images/badgeImage/Silver3.png`);
            console.log('Level 7 Badge image copied.')
        }

        // copy level 8 badge image
        if (!fs.existsSync(constants.LEVEL8_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Silver2.png', `./public/images/badgeImage/Silver2.png`);
            console.log('Level 8 Badge image copied.')
        }

        // copy level 9 badge image
        if (!fs.existsSync(constants.LEVEL9_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Silver1.png', `./public/images/badgeImage/Silver1.png`);
            console.log('Level 9 Badge image copied.')
        }

        // copy level 10 badge image
        if (!fs.existsSync(constants.LEVEL10_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Gold3.png', `./public/images/badgeImage/Gold3.png`);
            console.log('Level 10 Badge image copied.')
        }
        
        // copy level 11 badge image
        if (!fs.existsSync(constants.LEVEL11_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Gold2.png', `./public/images/badgeImage/Gold2.png`);
            console.log('Level 11 Badge image copied.')
        }

        // copy level 12 badge image
        if (!fs.existsSync(constants.LEVEL12_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Gold1.png', `./public/images/badgeImage/Gold1.png`);
            console.log('Level 12 Badge image copied.')
        }

        // copy level 13 badge image
        if (!fs.existsSync(constants.LEVEL13_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Professional2.png', `./public/images/badgeImage/Professional2.png`);
            console.log('Level 13 Badge image copied.')
        }

        // copy level 14 badge image
        if (!fs.existsSync(constants.LEVEL14_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Professional1.png', `./public/images/badgeImage/Professional1.png`);
            console.log('Level 14 Badge image copied.')
        }

        // copy level 15 badge image
        if (!fs.existsSync(constants.LEVEL15_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/WorldClass2.png', `./public/images/badgeImage/WorldClass2.png`);
            console.log('Level 15 Badge image copied.')
        }


        // copy level 16 badge image
        if (!fs.existsSync(constants.LEVEL16_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/WorldClass1.png', `./public/images/badgeImage/WorldClass1.png`);
            console.log('Level 16 Badge image copied.')
        }

        // copy level 17 badge image
        if (!fs.existsSync(constants.LEVEL17_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Legendary2.png', `./public/images/badgeImage/Legendary2.png`);
            console.log('Level 17 Badge image copied.')
        }

        // copy level 18 badge image
        if (!fs.existsSync(constants.LEVEL18_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Legendary1.png', `./public/images/badgeImage/Legendary1.png`);
            console.log('Level 18 Badge image copied.')
        }

        // copy level 19 badge image
        if (!fs.existsSync(constants.LEVEL19_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Elite.png', `./public/images/badgeImage/Elite.png`);
            console.log('Level 19 Badge image copied.')
        }

        // copy level 20 badge image
        if (!fs.existsSync(constants.LEVEL20_BADGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/TheGaffer.png', `./public/images/badgeImage/TheGaffer.png`);
            console.log('Level 20 Badge image copied.')
        }

        // make default image folder
        if (!fs.existsSync(constants.PUBLIC_IMAGE_DEFAULT_IMAGE_PATH)) {
            fs.mkdirSync(constants.PUBLIC_IMAGE_DEFAULT_IMAGE_PATH);
            console.log('Default image folder created')
        }

        // copy default user image 
        if (!fs.existsSync(constants.PUBLIC_IMAGE_DEFAULT_IMAGE_PIC_PATH)) {
            fs.copyFileSync('./publicImages/user.png', `./public/images/defaultImage/user.png`);
            console.log('Default image copied.')
        }

        // make logo folder
        if (!fs.existsSync(constants.PUBLIC_IMAGE_LOGO_PATH)) {
            fs.mkdirSync(constants.PUBLIC_IMAGE_LOGO_PATH);
            console.log('Logo folder created')
        }

        // copy logo image
        if (!fs.existsSync(constants.PUBLIC_IMAGE_LOGO_PIC_PATH)) {
            fs.copyFileSync('./publicImages/twelfthMan.png', `./public/images/logo/twelfthMan.png`);
            console.log('Logo image copied.')
        }

        // make profile pic folder
        if (!fs.existsSync(constants.PUBLIC_IMAGE_PROFILE_PIC_PATH)) {
            fs.mkdirSync(constants.PUBLIC_IMAGE_PROFILE_PIC_PATH);
            console.log('profile pic folder created')
        }

        // make kit image folder
        if (!fs.existsSync(constants.PATH.KIT_IMAGE_PATH)) {
            fs.mkdirSync(constants.PATH.KIT_IMAGE_PATH);
            console.log('kit folder created')
        }

        // make Notification image folder
        if (!fs.existsSync(constants.PATH.NOTIFICATION_IMAGE_PATH)) {
            fs.mkdirSync(constants.PATH.NOTIFICATION_IMAGE_PATH);
            console.log('Notification folder created')
        }

        // copy DFS notification image
        if (!fs.existsSync(constants.DFS_IMAGE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/dfs.jpg', `./public/images/notificationImage/dfs.jpg`);
            console.log('DFS image copied.')
        }

        // copy League notification image
        if (!fs.existsSync(constants.LEAGUE_IMAGE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/league.jpg', `./public/images/notificationImage/league.jpg`);
            console.log('League image copied.')
        }

        // copy Trivia notification image
        if (!fs.existsSync(constants.TRIVIA_IMAGE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/trivia.jpg', `./public/images/notificationImage/trivia.jpg`);
            console.log('TRIVIA image copied.')
        }

        // copy Kit notification image
        if (!fs.existsSync(constants.KIT_IMAGE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/kit.png', `./public/images/notificationImage/kit.png`);
            console.log('KIT image copied.')
        }

        // copy cancel notification image
        if (!fs.existsSync(constants.CANCEL_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Cancel.png', `./public/images/notificationImage/Cancel.png`);
            console.log('Cancel Notification image copied.')
        }

        // copy confirm notification image
        if (!fs.existsSync(constants.CONFIRM_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Confirm.png', `./public/images/notificationImage/Confirm.png`);
            console.log('Confirm Notification image copied.')
        }

        // copy Force Updated notification image
        if (!fs.existsSync(constants.FORCE_UPDATE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Force_Update.png', `./public/images/notificationImage/Force_Update.png`);
            console.log('Force Update Notification image copied.')
        }

        // copy Kit Add notification image
        if (!fs.existsSync(constants.KIT_ADD_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Kit_Add.png', `./public/images/notificationImage/Kit_Add.png`);
            console.log('Kit Add Notification image copied.')
        }

        // copy Kit Updated notification image
        if (!fs.existsSync(constants.KIT_UPDATE_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Kit_Update.png', `./public/images/notificationImage/Kit_Update.png`);
            console.log('Kit Update Notification image copied.')
        }

        // copy Leaderboard Generated notification image
        if (!fs.existsSync(constants.LEADERBOARD_GENERATED_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Leaderboard_Generated.png', `./public/images/notificationImage/Leaderboard_Generated.png`);
            console.log('Leaderboard Generated Notification image copied.')
        }

        // copy Rank notification image
        if (!fs.existsSync(constants.RANK_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Rank.png', `./public/images/notificationImage/Rank.png`);
            console.log('Rank Notification image copied.')
        }

        // copy Refund notification image
        if (!fs.existsSync(constants.REFUND_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Refund.png', `./public/images/notificationImage/Refund.png`);
            console.log('Refund Notification image copied.')
        }

        // copy Start notification image
        if (!fs.existsSync(constants.START_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Start.png', `./public/images/notificationImage/Start.png`);
            console.log('Start Notification image copied.')
        }

        // copy User Level notification image
        if (!fs.existsSync(constants.USER_LEVEL_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/User_Level.png', `./public/images/notificationImage/User_Level.png`);
            console.log('User Level Notification image copied.')
        }

        // copy Weekly Leaderboard Generated notification image
        if (!fs.existsSync(constants.CANCEL_NOTI_PIC_PATH)) {
            fs.copyFileSync('./publicImages/Weekly_Leaderboard_Generated.png', `./public/images/notificationImage/Weekly_Leaderboard_Generated.png`);
            console.log('Weekly Leaderboard Generated Notification image copied.')
        }

}
makeFolders();

module.exports = makeFolders