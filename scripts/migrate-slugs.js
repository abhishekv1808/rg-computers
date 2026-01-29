const mongoose = require('mongoose');
const Laptop = require('../models/laptop');
require('dotenv').config(); // Defaults to .env in CWD

const mongodbURL = process.env.MONGODB_URI;

if (!mongodbURL) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

mongoose.connect(mongodbURL).then(async () => {
    console.log('Connected to MongoDB for migration...');

    try {
        const laptops = await Laptop.find({});
        console.log(`Found ${laptops.length} laptops to update.`);

        for (const laptop of laptops) {
            let baseSlug = slugify(`${laptop.brand}-${laptop.model}`);
            let slug = baseSlug;
            let counter = 1;

            // Check for uniqueness
            while (await Laptop.findOne({ slug: slug, _id: { $ne: laptop._id } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            laptop.slug = slug;
            await laptop.save();
            console.log(`Updated: ${laptop.brand} ${laptop.model} -> ${slug}`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}).catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
});
