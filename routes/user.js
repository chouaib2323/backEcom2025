const express = require('express');
const router = express.Router();
const user = require('../controllers/user')



router.post('/register',user.userRegister)
router.post('/login',user.userLogin)



module.exports = router;