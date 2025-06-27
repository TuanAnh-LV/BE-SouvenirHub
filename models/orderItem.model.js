const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
  quantity: { type: Number, required: true },
  price: { type: mongoose.Types.Decimal128, required: true }
});


module.exports = mongoose.model('OrderItem', orderItemSchema);
orderItemSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.price = parseFloat(ret.price.toString());
    return ret;
  }
});