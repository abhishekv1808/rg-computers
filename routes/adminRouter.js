const path = require('path');
const express = require('express');
const adminController = require('../controllers/adminController');
const isAuth = require('../middleware/is-auth-jwt');
const { parser } = require('../utils/cloudinary');

const router = express.Router();

// /admin/login => GET
router.get('/login', adminController.getLogin);

// /admin/login => POST
router.post('/login', adminController.postLogin);

// /admin/logout => POST
router.post('/logout', adminController.postLogout);

// /admin/dashboard => GET
router.get('/dashboard', isAuth, adminController.getDashboard);

// /admin/add-laptop => GET
router.get('/add-laptop', isAuth, adminController.getAddLaptop);

// /admin/add-laptop => POST
router.post('/add-laptop', isAuth, parser.array('images', 10), adminController.postAddLaptop);

// /admin/add-monitor => GET
router.get('/add-monitor', isAuth, adminController.getAddMonitor);

// /admin/add-monitor => POST
router.post('/add-monitor', isAuth, parser.array('images', 10), adminController.postAddMonitor);

// /admin/edit-laptop/:laptopId => GET
router.get('/edit-laptop/:laptopId', isAuth, adminController.getEditLaptop);

// /admin/edit-laptop => POST
router.post('/edit-laptop', isAuth, parser.array('images', 10), adminController.postEditLaptop);

// /admin/edit-monitor => POST
router.post('/edit-monitor', isAuth, parser.array('images', 10), adminController.postEditMonitor);

// /admin/delete-laptop => POST
router.post('/delete-laptop', isAuth, adminController.postDeleteLaptop);

// /admin/inventory => GET
router.get('/inventory', isAuth, adminController.getInventory);

// /admin/update-inventory => POST
router.post('/update-inventory', isAuth, adminController.postUpdateInventory);

module.exports = router;
