const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  attributes: { type: Map, of: String },
  price: { type: mongoose.Types.Decimal128, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 }, 
  stock: { type: Number, default: 0 },
  images: [String]
});


module.exports = mongoose.model('ProductVariant', productVariantSchema);
productVariantSchema.set("toJSON", {
    transform: (doc, ret) => {
      ret.price = parseFloat(ret.price.toString());
      ret.finalPrice = +(ret.price * (1 - (ret.discount || 0) / 100)).toFixed(2);
      return ret;
    }
  });
  