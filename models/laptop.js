const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const laptopSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    mrp: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrls: {
        type: [String],
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Standard', 'Corporate', 'Workstation', 'Gaming', 'Monitor', 'Desktop'],
        default: 'Standard'
    },
    status: {
        type: String,
        required: true,
        enum: ['In Stock', 'Out of Stock', 'Low Stock', 'Discontinued'],
        default: 'In Stock'
    },
    specifications: {
        processor: String,
        ram: String,
        storage: String,
        display: String,
        graphics: String,
        os: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Laptop', laptopSchema);
