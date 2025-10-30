const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    image: { type: String, required: true },
    location: { type: String, required: true },
    farmerId: { type: String, required: true },
    farmerName: { type: String, required: true },
    description: { type: String, required: true },
    harvestDate: { type: String, required: true },
    organic: { type: Boolean, default: false }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;