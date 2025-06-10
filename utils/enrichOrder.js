const ProductImage = require('../models/productImage.model');

async function enrichOrderItems(items) {
  const productIds = items
    .map((item) => item.product_id?._id?.toString?.() || item.product_id?.toString?.())
    .filter(Boolean);

  const images = await ProductImage.find({
    product_id: { $in: productIds },
  });

  return items.map((item) => {
    const product = item.product_id.toObject?.() || item.product_id;
    const productImages = images
      .filter((img) => img.product_id.toString() === product._id.toString())
      .map((img) => img.url);

    return {
      ...item.toObject?.() || item,
      product_id: {
        ...product,
        image: productImages?.[0] || '/placeholder.jpg',
      },
    };
  });
}

module.exports = {
  enrichOrderItems,
};
