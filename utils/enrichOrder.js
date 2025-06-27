const ProductImage = require('../models/productImage.model');

async function enrichOrderItems(items) {
  const productIds = items
    .map((item) => item.product_id?._id?.toString?.() || item.product_id?.toString?.())
    .filter(Boolean);

  const images = await ProductImage.find({
    product_id: { $in: productIds },
  });

  return items.map((item) => {
    const product = item.product_id?.toObject?.() || item.product_id;
    const variant = item.variant_id?.toObject?.() || item.variant_id;

    // Lấy ảnh từ variant nếu có, nếu không thì từ product
    const variantImages = variant?.images || [];
    const productImages = images
      .filter((img) => img.product_id.toString() === product._id.toString())
      .map((img) => img.url);

    return {
      _id: item._id,
      quantity: item.quantity,
      price: parseFloat(item.price?.toString() || 0),

      product: {
        _id: product._id,
        name: product.name,
        image: variantImages[0] || productImages?.[0] || '/placeholder.jpg',
      },

      variant: variant
        ? {
            _id: variant._id,
            name: variant.name,
            attributes: variant.attributes || {},
            images: variant.images || [],
          }
        : null,
    };
  });
}

module.exports = {
  enrichOrderItems,
};
