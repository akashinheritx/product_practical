const constants = require('../../config/constants');
const fs = require('fs');

makeFolders = () => {

        // make public folder
        if (!fs.existsSync(constants.PATH.PUBLIC_PATH)) {
            console.log('Public folder created')
            fs.mkdirSync(constants.PATH.PUBLIC_PATH);
        }

        // make image folder
        if (!fs.existsSync(constants.PATH.IMAGE_PATH)) {
            fs.mkdirSync(constants.PATH.IMAGE_PATH);
            console.log('Files folder created')
        }

        // make image folder
        if (!fs.existsSync(constants.PATH.PRODUCT_IMG_PATH)) {
            fs.mkdirSync(constants.PATH.PRODUCT_IMG_PATH);
            console.log('Files folder created')
        }

        

}
makeFolders();

module.exports = makeFolders