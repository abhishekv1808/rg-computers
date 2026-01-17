const Cart = require('../models/cart');
const Laptop = require('../models/laptop');
const Blog = require('../models/blog');

exports.getHome = async (req, res, next) => {
    try {
        const laptops = await Laptop.find({ category: { $nin: ['Monitor', 'Desktop'] } }).sort({ createdAt: -1 }).limit(8);
        const monitors = await Laptop.find({ category: 'Monitor' }).sort({ createdAt: -1 }).limit(4);
        const desktops = await Laptop.find({ category: 'Desktop' }).sort({ createdAt: -1 }).limit(4);
        const blogs = await Blog.find().sort({ createdAt: -1 }).limit(3);

        res.render('../views/user/home', {
            pageTitle: 'Home',
            laptops: laptops,
            monitors: monitors,
            desktops: desktops,
            blogs: blogs
        });
    } catch (err) {
        console.log(err);
        res.render('../views/user/home', {
            pageTitle: 'Home',
            laptops: [],
            monitors: [],
            desktops: [],
            blogs: []
        });
    }
}

exports.getLaptops = async (req, res, next) => {
    try {
        const laptops = await Laptop.find();
        res.render('../views/user/laptops', {
            pageTitle: 'Laptops',
            laptops: laptops
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
}

exports.getStoreLocator = (req, res, next) => {
    res.render('../views/user/store-locator', { pageTitle: 'Stores' });
}

exports.getAboutUs = (req, res, next) => {
    res.render('../views/user/aboutUs', { pageTitle: 'About Us' });
}

exports.getContactUs = (req, res, next) => {
    res.render('../views/user/contact-us', { pageTitle: 'Contact Us' });
}

exports.getLaptopsByBrand = async (req, res, next) => {
    const brandName = req.params.brandName;
    try {
        const laptops = await Laptop.find({
            brand: { $regex: new RegExp("^" + brandName + "$", "i") }
        });

        res.render('../views/user/brand-laptops', {
            pageTitle: `${brandName} Laptops`,
            laptops: laptops,
            brandName: brandName
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.getMonitorDetail = async (req, res, next) => {
    try {
        const monitorId = req.params.id;
        const monitor = await Laptop.findById(monitorId);

        if (!monitor || monitor.category !== 'Monitor') {
            return res.redirect('/monitors');
        }

        const similarMonitors = await Laptop.find({
            _id: { $ne: monitorId },
            category: 'Monitor'
        }).limit(4);

        const discount = monitor.mrp - monitor.price;
        const discountPercent = Math.round((discount / monitor.mrp) * 100);

        res.render('../views/user/monitor-detail', {
            pageTitle: `${monitor.brand} ${monitor.model}`,
            monitor: monitor,
            similarMonitors: similarMonitors,
            discount: discount,
            discountPercent: discountPercent
        });
    } catch (err) {
        console.log(err);
        res.redirect('/monitors');
    }
};

exports.getBlogDetail = async (req, res, next) => {
    try {
        const blogId = req.params.id;
        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.redirect('/');
        }

        const recentBlogs = await Blog.find({ _id: { $ne: blogId } }).sort({ createdAt: -1 }).limit(3);

        res.render('../views/user/blog-detail', {
            pageTitle: blog.title,
            blog: blog,
            recentBlogs: recentBlogs
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.getProductDetail = async (req, res, next) => {
    try {
        const laptopId = req.params.id;
        const laptop = await Laptop.findById(laptopId);

        if (!laptop) {
            return res.redirect('/');
        }

        if (laptop.category === 'Monitor') {
            return res.redirect('/monitor/' + laptopId);
        }

        const similarLaptops = await Laptop.find({
            _id: { $ne: laptopId },
            $or: [
                { brand: laptop.brand },
                { category: laptop.category }
            ]
        }).limit(4);

        const discount = laptop.mrp - laptop.price;
        const discountPercent = Math.round((discount / laptop.mrp) * 100);

        res.render('../views/user/product-detail', {
            pageTitle: `${laptop.brand} ${laptop.model} | RG Computers`,
            laptop: laptop,
            similarLaptops: similarLaptops,
            discount: discount,
            discountPercent: discountPercent,
            metaDescription: `Buy Refurbished ${laptop.brand} ${laptop.model} with ${laptop.specifications.processor}, ${laptop.specifications.ram}. Best price in India. 6 Months Warranty.`,
            keywords: `Refurbished ${laptop.brand} laptop, ${laptop.model} price, used ${laptop.brand} laptops, ${laptop.category} laptops`
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.getCompareLaptops = async (req, res, next) => {
    try {
        const laptops = await Laptop.find();
        res.render('../views/user/compare-laptops', {
            pageTitle: 'Compare Laptops',
            laptops: laptops
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.getSmartphones = async (req, res, next) => {
    try {
        const smartphones = await Laptop.find({ category: 'smartphone' });
        res.render('../views/user/smartphones', {
            pageTitle: 'Smartphones',
            smartphones: smartphones
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
}

exports.getMonitors = async (req, res, next) => {
    try {
        const monitors = await Laptop.find({ category: 'Monitor' });
        res.render('../views/user/monitors', {
            pageTitle: 'Monitors',
            monitors: monitors
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
}

exports.getSearch = async (req, res, next) => {
    const query = req.query.q;
    try {
        if (!query) {
            return res.redirect('/');
        }

        // Split query into terms
        const terms = query.split(' ').filter(term => term.trim() !== '');

        // Build regex for each term
        const regexTerms = terms.map(term => new RegExp(term, 'i'));

        // Construct query: Each term must match at least one field
        const searchConditions = regexTerms.map(regex => ({
            $or: [
                { brand: regex },
                { model: regex },
                { category: regex },
                { 'specifications.processor': regex },
                { 'specifications.ram': regex },
                { 'specifications.storage': regex },
                { 'specifications.display': regex },
                { 'specifications.graphics': regex },
                { 'specifications.os': regex }
            ]
        }));

        const laptops = await Laptop.find({
            $and: searchConditions
        });

        res.render('../views/user/laptops', {
            pageTitle: `Search Results for "${query}"`,
            laptops: laptops,
            searchQuery: query
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.postCart = async (req, res, next) => {
    const prodId = req.body.productId;
    console.log('Post Cart called with Product ID:', prodId);
    try {
        const product = await Laptop.findById(prodId);
        if (!product) {
            console.log('Product not found for ID:', prodId);
            return res.redirect('/');
        }

        console.log('Adding product to cart. Model:', product.model);
        await req.cart.addToCart(product);

        console.log('Product added to cart successfully. Redirecting to /cart');
        res.redirect('/cart');
    } catch (err) {
        console.log('Error in postCart:', err);
        res.redirect('/');
    }
};

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findById(req.session.cartId);

        // Fetch recommendations (e.g., 4 random laptops)
        const recommendations = await Laptop.aggregate([{ $sample: { size: 4 } }]);

        res.render('../views/user/cart', {
            pageTitle: 'Your Cart',
            products: cart.products,
            totalPrice: cart.totalPrice,
            recommendations: recommendations
        });
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
};

exports.postCartDeleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    const price = req.body.price;

    try {
        await req.cart.removeFromCart(prodId, price);
        res.redirect('/cart');
    } catch (err) {
        console.log(err);
        res.redirect('/cart');
    }
};

exports.postClearCart = async (req, res, next) => {
    try {
        await req.cart.clearCart();
        res.redirect('/cart');
    } catch (err) {
        console.log(err);
        res.redirect('/cart');
    }
};

exports.postCheckout = async (req, res, next) => {
    try {
        const cart = await Cart.findById(req.session.cartId);
        let message = "Hi, I want to place an order for:\n";
        cart.products.forEach(p => {
            message += `- ${p.product.brand} ${p.product.model} x${p.quantity} (₹${p.product.price})\n`;
        });
        message += `\nTotal: ₹${cart.totalPrice}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/918861088839?text=${encodedMessage}`;

        res.redirect(whatsappUrl);
    } catch (err) {
        console.log(err);
        res.redirect('/cart');
    }
};