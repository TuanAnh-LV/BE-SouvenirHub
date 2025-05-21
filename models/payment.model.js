const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  payment_method: String,
  amount: { type: mongoose.Types.Decimal128 },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paid_at: Date
});

module.exports = mongoose.model('Payment', paymentSchema);
paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.amount = parseFloat(ret.amount.toString());
    return ret;
  }
});