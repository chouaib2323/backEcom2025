const express = require('express');
const router = express.Router();
const authentication = require('../middlewares/athentication')
const Autho = require('../middlewares/authorization')
const upload = require('../middlewares/upload');
const admin = require ('../controllers/admin')




router.post('/adminLogin',admin.adminLogin)
router.post('/adminAddProduct',authentication,Autho('admin'),upload.array('images', 5),admin.adminAddProduct)
router.post('/adminAddCategory',authentication,Autho('admin'),admin.AddCategory)
router.get('/adminGetCategory',authentication,Autho('admin'),admin.GetCategories)

module.exports = router;