const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,
    quantity: { type: Number, default: 0 },
    farmerId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
