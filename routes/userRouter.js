const express = require('express');
const path = require('path');
const userRouter = express.Router();
const {
    getHome,
    getLaptops,
    getStoreLocator,
    getAboutUs,
    getContactUs,
    getLaptopsByBrand,
    getProductDetail,
    getMonitorDetail,
    getBlogDetail,
    getCompareLaptops,
    getMonitors,
    getSearch,
    postCart,
    getCart,
    postCartDeleteProduct,
    postClearCart,
    postCheckout
} = require('../controllers/userController');

userRouter.get('/', getHome);
userRouter.get('/laptops', getLaptops);
userRouter.get('/search', getSearch);
userRouter.get('/brand/:brandName', getLaptopsByBrand);
userRouter.get('/compare-laptops', getCompareLaptops);
userRouter.get('/monitors', getMonitors);
userRouter.get('/monitor/:slug', getMonitorDetail);
userRouter.get('/blog/:id', getBlogDetail);
userRouter.get('/laptop/:slug', getProductDetail);
userRouter.get('/store-locator', getStoreLocator);
userRouter.get('/about-us', getAboutUs);
userRouter.get('/contact-us', getContactUs);

// Cart Routes
userRouter.get('/cart', getCart);
userRouter.post('/cart', postCart);
userRouter.post('/cart-delete-item', postCartDeleteProduct);
userRouter.post('/cart-clear', postClearCart);
userRouter.post('/checkout', postCheckout);


module.exports = userRouter;
