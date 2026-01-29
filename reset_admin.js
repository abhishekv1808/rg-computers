const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/admin');
require('dotenv').config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@rgcomputers.in';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        // Remove existing admin
        await Admin.deleteOne({ email: email });
        console.log('Removed existing admin if any');

        // Create new admin
        const admin = new Admin({
            email: email,
            password: hashedPassword
        });

        await admin.save();
        console.log(`Admin reset successfully.\nEmail: ${email}\nPassword: ${password}`);

        mongoose.disconnect();
    } catch (err) {
        console.error('Error resetting admin:', err);
        mongoose.disconnect();
    }
};

resetAdmin();
