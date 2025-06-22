const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shipping_address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingAddress', required: true },
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  },  
  total_price: { type: mongoose.Types.Decimal128 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.total_price = parseFloat(ret.total_price.toString());
    return ret;
  }
});
