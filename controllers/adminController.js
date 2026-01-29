const Laptop = require('../models/laptop');
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

exports.getLogin = (req, res, next) => {
    res.render('admin/login', {
        pageTitle: 'Admin Login',
        errorMessage: null
    });
};

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const admin = await Admin.findOne({ email: email });
        if (!admin) {
            return res.render('admin/login', {
                pageTitle: 'Admin Login',
                errorMessage: 'Invalid email or password.'
            });
        }
        const doMatch = await bcrypt.compare(password, admin.password);
        if (doMatch) {
            // Generate JWT
            const token = jwt.sign(
                { adminId: admin._id.toString(), email: admin.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // Set Cookie
            res.cookie('token', token, {
                httpOnly: true,
                // secure: true, // Enable in production with HTTPS
                maxAge: 3600000 // 1 hour
            });

            console.log('Admin Logged In Successfully (JWT)');
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/login', {
            pageTitle: 'Admin Login',
            errorMessage: 'Invalid email or password.'
        });
    } catch (err) {
        console.log(err);
        res.redirect('/admin/login');
    }
};

exports.postLogout = (req, res, next) => {
    res.clearCookie('token');
    res.redirect('/admin/login');
};

exports.getDashboard = async (req, res, next) => {
    try {
        const page = +req.query.page || 1;
        const ITEMS_PER_PAGE = 10;

        const totalLaptops = await Laptop.countDocuments();
        const laptops = await Laptop.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        const recentLaptops = await Laptop.find().sort({ createdAt: -1 }).limit(5); // Separate query for recent items widget

        // Calculate total inventory value (using aggregation for efficiency over entire dataset)
        const allLaptopsForStats = await Laptop.find({}, 'price stockQuantity brand status');
        const totalValue = allLaptopsForStats.reduce((acc, curr) => acc + (curr.price * curr.stockQuantity), 0);

        // Stats Calculation
        const outOfStock = allLaptopsForStats.filter(l => l.status === 'Out of Stock').length;
        const lowStock = allLaptopsForStats.filter(l => l.status === 'Low Stock').length;

        // Calculate unique brands
        const uniqueBrands = [...new Set(allLaptopsForStats.map(l => l.brand))].length;

        // Calculate Brand Distribution for Chart
        const brandCounts = {};
        allLaptopsForStats.forEach(laptop => {
            const brand = laptop.brand || 'Unknown';
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });

        const brandData = {
            labels: Object.keys(brandCounts),
            data: Object.values(brandCounts)
        };

        res.render('admin/admin-portal', {
            pageTitle: 'Admin Dashboard',
            laptops: laptops,
            totalLaptops: totalLaptops,
            recentLaptops: recentLaptops,
            totalValue: totalValue,
            outOfStock: outOfStock,
            lowStock: lowStock,
            uniqueBrands: uniqueBrands,
            brandData: brandData, // Pass chart data
            path: '/admin/dashboard',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalLaptops,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalLaptops / ITEMS_PER_PAGE)
        });
    } catch (err) {
        console.log(err);
    }
};

exports.getAddLaptop = (req, res, next) => {
    res.render('admin/edit-laptop', {
        pageTitle: 'Add Laptop',
        editing: false,
        path: '/admin/add-laptop'
    });
};

exports.postAddLaptop = async (req, res, next) => {
    const brand = req.body.brand;
    const model = req.body.model;
    const category = req.body.category;
    const price = req.body.price;
    const mrp = req.body.mrp;

    if (parseFloat(price) > parseFloat(mrp)) {
        return res.send('<script>alert("Validation Error: Selling Price cannot be greater than MRP."); window.history.back();</script>');
    }

    const description = req.body.description;

    // Handle Cloudinary Uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => file.path);
    }

    const stockQuantity = req.body.stockQuantity;
    const status = req.body.status;
    const specs = {
        processor: req.body.processor,
        ram: req.body.ram, // Ensure these keys match the form input names
        storage: req.body.storage,
        display: req.body.display,
        graphics: req.body.graphics,
        os: req.body.os
    };

    const slug = slugify(`${brand}-${model}`);

    const laptop = new Laptop({
        brand: brand,
        model: model,
        slug: slug,
        category: category,
        price: price,
        mrp: mrp,
        description: description,
        imageUrls: imageUrls,
        stockQuantity: stockQuantity,
        status: status,
        specifications: specs
    });

    try {
        await laptop.save();
        console.log('Created Laptop');
        res.redirect('/admin/dashboard');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getAddMonitor = (req, res, next) => {
    res.render('admin/add-monitor', {
        pageTitle: 'Add Monitor',
        editing: false,
        path: '/admin/add-monitor'
    });
};

exports.postAddMonitor = async (req, res, next) => {
    const brand = req.body.brand;
    const model = req.body.model;
    const category = 'Monitor'; // Explicitly set
    const price = req.body.price;
    const mrp = req.body.mrp;

    if (parseFloat(price) > parseFloat(mrp)) {
        return res.send('<script>alert("Validation Error: Selling Price cannot be greater than MRP."); window.history.back();</script>');
    }

    const description = req.body.description;

    // Handle Cloudinary Uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => file.path);
    }

    const stockQuantity = req.body.stockQuantity;
    const status = req.body.status;
    const specs = {
        // Monitors usually don't have these, but if form provided them (unlikely), ignore or include
        display: req.body.display,
        os: req.body.os // Some smart monitors might have OS
    };

    const slug = slugify(`${brand}-${model}`);

    const laptop = new Laptop({ // Using Laptop model as generic Product model
        brand: brand,
        model: model,
        slug: slug,
        category: category,
        price: price,
        mrp: mrp,
        description: description,
        imageUrls: imageUrls,
        stockQuantity: stockQuantity,
        status: status,
        specifications: specs
    });

    try {
        await laptop.save();
        console.log('Created Monitor');
        res.redirect('/admin/dashboard');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postEditMonitor = async (req, res, next) => {
    const monitorId = req.body.monitorId;
    const updatedBrand = req.body.brand;
    const updatedModel = req.body.model;
    // Category remains 'Monitor'
    const updatedPrice = req.body.price;
    const updatedMrp = req.body.mrp;

    if (parseFloat(updatedPrice) > parseFloat(updatedMrp)) {
        return res.send('<script>alert("Validation Error: Selling Price cannot be greater than MRP."); window.history.back();</script>');
    }

    const updatedDesc = req.body.description;

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
        newImageUrls = req.files.map(file => file.path);
    }

    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) {
        existingImages = [existingImages];
    }

    const finalImageUrls = existingImages.concat(newImageUrls);

    const updatedStockQuantity = req.body.stockQuantity;
    const updatedStatus = req.body.status;
    const updatedSpecs = {
        display: req.body.display,
        os: req.body.os
    };

    try {
        const monitor = await Laptop.findById(monitorId); // Still using Laptop model
        if (!monitor) return res.redirect('/admin/dashboard');

        monitor.slug = slugify(`${updatedBrand}-${updatedModel}`);
        monitor.brand = updatedBrand;
        monitor.model = updatedModel;
        monitor.price = updatedPrice;
        monitor.mrp = updatedMrp;
        monitor.description = updatedDesc;
        monitor.imageUrls = finalImageUrls;
        monitor.stockQuantity = updatedStockQuantity;
        monitor.status = updatedStatus;
        monitor.specifications = updatedSpecs; // Overwrite specs with monitor specific ones

        await monitor.save();
        console.log('UPDATED MONITOR!');
        res.redirect('/admin/inventory');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getEditLaptop = async (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const laptopId = req.params.laptopId;
    try {
        const laptop = await Laptop.findById(laptopId);
        if (!laptop) {
            return res.redirect('/');
        }

        // Check if it's a monitor
        if (laptop.category === 'Monitor') {
            return res.render('admin/add-monitor', { // Reuse add-monitor for editing
                pageTitle: 'Edit Monitor',
                editing: editMode,
                monitor: laptop, // Pass 'monitor' variable
                path: '/admin/edit-monitor'
            });
        }

        res.render('admin/edit-laptop', {
            pageTitle: 'Edit Laptop',
            editing: editMode,
            laptop: laptop,
            path: '/admin/edit-laptop'
        });
    } catch (err) {
        console.log(err);
    }
};

exports.postEditLaptop = async (req, res, next) => {
    const laptopId = req.body.laptopId;
    const updatedBrand = req.body.brand;
    const updatedModel = req.body.model;
    const updatedCategory = req.body.category;
    const updatedPrice = req.body.price;
    const updatedMrp = req.body.mrp;

    if (parseFloat(updatedPrice) > parseFloat(updatedMrp)) {
        return res.send('<script>alert("Validation Error: Selling Price cannot be greater than MRP."); window.history.back();</script>');
    }

    const updatedDesc = req.body.description;

    // Handle New Uploads
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
        newImageUrls = req.files.map(file => file.path);
    }

    // Handle Existing Images (passed as hidden inputs or checkboxes from the view)
    // If 'existingImages' is undefined (user deleted all), start empty.
    // If it's a string (one image), make array. 
    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) {
        existingImages = [existingImages];
    }

    // Combine old and new
    const finalImageUrls = existingImages.concat(newImageUrls);

    const updatedStockQuantity = req.body.stockQuantity;
    const updatedStatus = req.body.status;
    const updatedSpecs = {
        processor: req.body.processor,
        ram: req.body.ram,
        storage: req.body.storage,
        display: req.body.display,
        graphics: req.body.graphics,
        os: req.body.os
    };

    try {
        const laptop = await Laptop.findById(laptopId);
        laptop.slug = slugify(`${updatedBrand}-${updatedModel}`);
        laptop.brand = updatedBrand;
        laptop.model = updatedModel;
        laptop.category = updatedCategory;
        laptop.price = updatedPrice;
        laptop.mrp = updatedMrp;
        laptop.description = updatedDesc;
        laptop.imageUrls = finalImageUrls; // Update with combined list
        laptop.stockQuantity = updatedStockQuantity;
        laptop.status = updatedStatus;
        laptop.specifications = updatedSpecs;
        await laptop.save();
        console.log('UPDATED LAPTOP!');
        res.redirect('/admin/dashboard');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postDeleteLaptop = async (req, res, next) => {
    const laptopId = req.body.laptopId;
    try {
        await Laptop.findByIdAndDelete(laptopId);
        console.log('DESTROYED LAPTOP');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.log(err);
    }
};

exports.getInventory = async (req, res, next) => {
    try {
        const page = +req.query.page || 1;
        const ITEMS_PER_PAGE = 10;

        const searchQuery = req.query.search;
        let filter = {};
        if (searchQuery) {
            filter = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { model: { $regex: searchQuery, $options: 'i' } },
                    { category: { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const totalLaptops = await Laptop.countDocuments(filter);
        const laptops = await Laptop.find(filter)
            .sort({ brand: 1 })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        // Stats Calculation
        const outOfStock = await Laptop.countDocuments({ status: 'Out of Stock' });
        const lowStock = await Laptop.countDocuments({ status: 'Low Stock' });

        // Calculate total value
        const allLaptops = await Laptop.find({}, 'price stockQuantity');
        const totalValue = allLaptops.reduce((acc, curr) => acc + (curr.price * curr.stockQuantity), 0);

        res.render('admin/inventory', {
            pageTitle: 'Inventory Management',
            laptops: laptops,
            path: '/admin/inventory',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalLaptops,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalLaptops / ITEMS_PER_PAGE),

            // Stats passed to view
            stats: {
                totalLaptops: totalLaptops,
                outOfStock: outOfStock,
                lowStock: lowStock,
                totalValue: totalValue
            },
            stats: {
                totalLaptops: totalLaptops,
                outOfStock: outOfStock,
                lowStock: lowStock,
                totalValue: totalValue
            },
            totalLaptops: totalLaptops,
            searchQuery: searchQuery // Pass search query to view
        });
    } catch (err) {
        console.log(err);
    }
};

exports.postUpdateInventory = async (req, res, next) => {
    const laptopId = req.body.laptopId;
    const newStock = req.body.stockQuantity;
    const newStatus = req.body.status;

    try {
        const laptop = await Laptop.findById(laptopId);
        laptop.stockQuantity = newStock;
        laptop.status = newStatus;
        await laptop.save();
        res.redirect('/admin/inventory');
    } catch (err) {
        console.log(err);
        res.redirect('/admin/inventory');
    }
};
