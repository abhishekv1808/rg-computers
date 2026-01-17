const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const Cart = require('./models/cart');
require('dotenv').config();

const rootDir = require('./utils/mainUtils');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const Admin = require('./models/admin');
const Blog = require('./models/blog');

const app = express();

const mongodbURL = process.env.MONGODB_URI;

const store = new MongoDBStore({
    uri: mongodbURL,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');


const cookieParser = require('cookie-parser');

app.use(express.static(path.join(rootDir, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use(async (req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Session: ${req.session.id} - CartID: ${req.session.cartId}`);
    try {
        if (!req.session.cartId) {
            console.log('No cart session. Creating new cart.');
            const cart = new Cart({ products: [], totalPrice: 0 });
            await cart.save();
            req.session.cartId = cart._id.toString();
            // Force session save to ensure cookie is set
            return req.session.save(err => {
                if (err) console.log('Session save error:', err);
                console.log('New Session Saved with Cart ID:', cart._id);
                req.cart = cart;
                res.locals.cartItemCount = 0;
                next();
            });
        } else {
            const cart = await Cart.findById(req.session.cartId);
            if (!cart) {
                console.log('Cart session exists but cart not found in DB. Creating new cart.');
                const newCart = new Cart({ products: [], totalPrice: 0 });
                await newCart.save();
                req.session.cartId = newCart._id.toString();
                return req.session.save(err => {
                    if (err) console.log('Session save error:', err);
                    console.log('Recovered Session Saved with New Cart ID:', newCart._id);
                    req.cart = newCart;
                    res.locals.cartItemCount = 0;
                    next();
                });
            } else {
                console.log('Cart Found:', cart._id, 'Items (on load):', cart.products.length);
                req.cart = cart;
            }
        }
        res.locals.cartItemCount = req.cart.products.reduce((acc, p) => acc + p.quantity, 0);
        next();
    } catch (err) {
        console.log('Middleware Error:', err);
        // Fallback to avoid crashing
        res.locals.cartItemCount = 0;
        next();
    }
});

app.use('/admin', adminRouter);
app.use(userRouter);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>Server Error</h1>
          <p>${message}</p>
          <a href="/">Go Home</a>
      </div>
  `);
});

const port = 3009;

mongoose.connect(mongodbURL).then(async (result) => {
    console.log("Connected to Mongodb");

    // Seed Admin if not exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('password123', 12);
        const admin = new Admin({
            email: 'admin@rgcomputers.in',
            password: hashedPassword
        });
        await admin.save();
        console.log('Seeded Admin User: admin@rgcomputers.in / password123');
    }

    // Seed Blogs if not exists
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
        const blogs = [
            {
                title: "Top 5 Laptops for Programming in 2026",
                excerpt: "Finding the perfect coding machine can be tough. We break down the best laptops for developers, from MacBooks to ThinkPads, considering keyboard quality, screen real estate, and performance.",
                content: `
                    <p class="mb-4">Choosing the right laptop for programming is crucial for productivity. Whether you're a web developer, data scientist, or game developer, your needs will vary. Here are our top picks for 2026.</p>
                    
                    <h3 class="text-xl font-bold mb-2">1. MacBook Pro 14 (M4 Pro)</h3>
                    <p class="mb-4">The new M4 chips are absolute beasts. For full-stack developers running Docker containers and virtual machines, the unified memory architecture changes everything. The battery life is also unmatched.</p>
                    
                    <h3 class="text-xl font-bold mb-2">2. Dell XPS 15</h3>
                    <p class="mb-4">If you're in the Windows ecosystem, the XPS 15 remains the king of build quality. The OLED screen option is perfect for frontend developers who need color accuracy.</p>
                    
                    <h3 class="text-xl font-bold mb-2">3. Lenovo ThinkPad X1 Carbon</h3>
                    <p class="mb-4">The keyboard is still the gold standard. For Linux users, this acts as the best host machine with excellent compatibility.</p>
                    
                    <h3 class="text-xl font-bold mb-2">Why Refurbished?</h3>
                    <p class="mb-4">Buying these machines refurbished from RG Computers can save you up to 40% while getting the same performance. All our units are quality tested.</p>
                `,
                imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600"
            },
            {
                title: "How to Extend Your Laptop's Battery Life",
                excerpt: "Is your laptop dying too fast? Check out these actionable tips to squeeze more juice out of your battery, covering software settings, hardware maintenance, and best practices.",
                content: `
                    <p class="mb-4">Battery anxiety is real. As laptops get more powerful, they also get hungrier. Here is how to make your charge last longer.</p>
                    
                    <h3 class="text-xl font-bold mb-2">1. Manage Background Apps</h3>
                    <p class="mb-4">Check your Task Manager or Activity Monitor. Apps like Chrome, Teams, or Slack can consume significant power even when idle.</p>
                    
                    <h3 class="text-xl font-bold mb-2">2. Optimize Display Brightness</h3>
                    <p class="mb-4">The screen is the biggest power drain. Lowering brightness to 50% can add an hour or more to your runtime.</p>
                    
                    <h3 class="text-xl font-bold mb-2">3. Battery Health Management</h3>
                    <p class="mb-4">Most modern laptops have 'smart charging' features that stop charging at 80% to preserve long-term battery health. Enable this in your BIOS or manufacturer settings.</p>
                `,
                imageUrl: "https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&q=80&w=600"
            },
            {
                title: "The Rise of ARM Processors in Laptops",
                excerpt: "Intel and AMD are no longer the only players. With Apple Silicon and Qualcomm's Snapdragon X Elite, the laptop landscape is shifting towards efficient ARM architecture.",
                content: `
                    <p class="mb-4">The x86 architecture has dominated computing for decades, but the tides are turning. ARM processors, known for their efficiency in mobile phones, are now powering high-performance laptops.</p>
                    
                    <h3 class="text-xl font-bold mb-2">Apple's Revolution</h3>
                    <p class="mb-4">It started with the M1. High performance per watt meant laptops could be fanless and still edit 4K video. Now with the M3 and M4, the lead has only widened.</p>
                    
                    <h3 class="text-xl font-bold mb-2">Windows on ARM</h3>
                    <p class="mb-4">Qualcomm is finally catching up. The new Snapdragon chips for Windows are promising similar battery life and performance, challenging the Wintel monopoly.</p>
                    
                    <p class="mb-4">At RG Computers, we stock a wide range of both x86 and ARM-based laptops to suit your workflow.</p>
                `,
                imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600"
            }
        ];

        await Blog.insertMany(blogs);
        console.log('Seeded 3 Blog Posts');
    }

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch((err) => {
    console.log("Connection failed", err);
});

module.exports = app;

