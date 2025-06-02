const mongoose = require('mongoose');
const Shop = require('../models/shop.model'); 
const Category = require('../models/category.model'); 

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: mongoose.Types.Decimal128, required: true },
  stock: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pendingApproval', 'onSale', 'outOfStock', 'offSale', 'archived'],
    default: 'pendingApproval'
  },
  specifications: { type: String, default: '' },
  specialNotes: { type: String, default: '' },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  sold: {
    type: Number,
    default: 0
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
productSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.price = parseFloat(ret.price.toString());
    return ret;
  }
});

