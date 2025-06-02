const mongoose = require('mongoose');
const Product = require('./models/product.model'); // Đảm bảo đường dẫn đúng

const MONGO_URI = '';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    const result = await Product.updateMany(
      {
        $or: [
          { averageRating: { $exists: false } },
          { reviewCount: { $exists: false } },
          { specialNotes: { $exists: false } },
          { specifications: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'onSale',
          averageRating: 0,
          reviewCount: 0,
          specialNotes: '',
          specifications: ''
        }
      }
    );

    console.log(`✅ Đã cập nhật ${result.modifiedCount} sản phẩm.`);
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
