const { body } = require('express-validator');

//validate user form detail
exports.registerValidator = [
  body('firstName')
    .optional()
    .trim()
    .matches('^([a-zA-Z ]+)$')
    .withMessage('REGISTER.FIRST_NAME_ALPHA')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.FIRST_NAME_LENGTH'),
  body('lastName')
    .optional()
    .trim()
    .matches('^([a-zA-Z ]+)$')
    .withMessage('REGISTER.LAST_NAME_ALPHA')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.LAST_NAME_LENGTH'),
  body('userName')
    .not()
    .isEmpty()
    .withMessage('REGISTER.USER_NAME')
    .trim()
    .matches('^([a-zA-Z0-9_.]+)$')
    .withMessage('REGISTER.USER_NAME_ALPHA_NUMERIC')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.USER_NAME_LENGTH'),
  body('email')
    .not()
    .isEmpty()
    .withMessage('REGISTER.USER_EMAIL')
    .isEmail().withMessage('REGISTER.IS_EMAIL')
    .trim(),
  body('password')
    .optional()
    .trim()
    .matches("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
    .withMessage('REGISTER.IS_PASSWORD_VALID'),  
  body('userType')
    .not()
    .isEmpty()
    .withMessage('REGISTER.USER_TYPE')
    .matches(/^[2-4]$/)
    .withMessage('REGISTER.USER_TYPE_VALUE')
    .trim(),
  body('registerType')
    .not()
    .isEmpty()
    .withMessage('REGISTER.REGISTER_TYPE')
    .matches(/^[1-2]$/)
    .withMessage('REGISTER.REGISTER_TYPE_VALUE')
    .trim(),
  body('mobileNumber')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('REGISTER.MOBILE_NUMBER_NUMERIC')
    .isLength({ min: 10, max: 10 })
    .withMessage('REGISTER.MOBILE_NUMBER_LENGTH'),
  body('lat')
    .not()
    .isEmpty()
    .withMessage('REGISTER.LAT')
    .trim()
    .isNumeric()
    .withMessage('REGISTER.LAT_NUMERIC'),
  body('long')
    .not()
    .isEmpty()
    .withMessage('REGISTER.LONG')
    .trim()
    .isNumeric()
    .withMessage('REGISTER.LONG_NUMERIC'),
  body('dob')
    .not()
    .isEmpty()
    .withMessage('REGISTER.DOB')
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/)
    .withMessage('REGISTER.IS_DOB_VALID'),
  body('gender')
    .optional(),
  body('state')
    .not()
    .isEmpty()
    .withMessage('REGISTER.LOCATION'),
  body('country')
    .not()
    .isEmpty()
    .withMessage('REGISTER.LOCATION'),
  body('preferredLanguage')
    .optional()
    .matches(/^(en|hn)$/)
    .withMessage('REGISTER.PREFERRED_LANGUAGE'),
];

//validate user edit form detail
exports.updateUserProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .matches('^([a-zA-Z ]+)$')
    .withMessage('REGISTER.FIRST_NAME_ALPHA')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.FIRST_NAME_LENGTH'),
  body('lastName')
    .optional()
    .trim()
    .matches('^([a-zA-Z ]+)$')
    .withMessage('REGISTER.LAST_NAME_ALPHA')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.LAST_NAME_LENGTH'),
  body('userName')
    .optional()
    .trim()
    .matches('^([a-zA-Z0-9_.]+)$')
    .withMessage('REGISTER.USER_NAME_ALPHA_NUMERIC')
    .isLength({ min: 2, max: 16 })
    .withMessage('REGISTER.USER_NAME_LENGTH'),
  body('email')
    .optional()
    .isEmail().withMessage('REGISTER.IS_EMAIL')
    .trim(),
  body('password')
    .optional()
    .trim()
    .matches("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
    .withMessage('REGISTER.IS_PASSWORD_VALID'),
  body('mobileNumber')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('REGISTER.MOBILE_NUMBER_NUMERIC')
    .isLength({ min: 10, max: 10 })
    .withMessage('REGISTER.MOBILE_NUMBER_LENGTH'),
  body('lat')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('REGISTER.LAT_NUMERIC'),
  body('long')
    .optional()
    .trim()
    .isNumeric()
    .withMessage('REGISTER.LONG_NUMERIC'),
  body('dob')
    .optional()
    .matches(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/)
    .withMessage('REGISTER.IS_DOB_VALID'),
  body('gender')
    .optional(),
  body('preferredLanguage')
    .optional()
    .matches(/^(en|hn)$/)
    .withMessage('REGISTER.PREFERRED_LANGUAGE'),
];

//validate password while editing it
exports.updateUserPasswordValidator = [
  body('newPassword')
    .optional()
    .trim()
    .matches("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})")
    .withMessage('REGISTER.IS_PASSWORD_VALID'),  
]

//validate mobile number while editing it
exports.updateUserMobileNumberValidator = [
  body('tempMobileNumber')
    .not()
    .isEmpty()
    .withMessage('REGISTER.MOBILE_NUMBER')
    .trim()
    .isNumeric()
    .withMessage('REGISTER.MOBILE_NUMBER_NUMERIC')
    .isLength({ min: 10, max: 10 })
    .withMessage('REGISTER.MOBILE_NUMBER_LENGTH'),  
]

//validate email while editing it
exports.updateUserEmailValidator = [
  body('tempEmail')
    .not()
    .isEmpty()
    .withMessage('REGISTER.USER_EMAIL')
    .isEmail().withMessage('REGISTER.IS_EMAIL')
    .trim(),
]