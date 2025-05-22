const mongoose = require('mongoose');

const transactionMapSchema = new mongoose.Schema({
  txn_ref: { type: String, required: true, unique: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }
});

module.exports = mongoose.model('TransactionMap', transactionMapSchema);