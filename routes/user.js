const express = require('express');
const router = express.Router();
const user = require('../controllers/user')
const authentication = require('../middlewares/athentication')
const Autho = require('../middlewares/authorization')


router.post('/register',user.userRegister)
router.post('/login',user.userLogin)
router.get('/getproducts',user.GetProducts)
router.get('/userGetCategory',authentication,Autho('user'),user.GetCategories)

module.exports = router;