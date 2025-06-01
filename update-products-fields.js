const mongoose = require('mongoose');
const Product = require('./models/product.model'); // Đảm bảo đường dẫn đúng


const MONGO_URI = 'mongodb+srv://souvenirhub:Souvenir123@cluster0.ypd2gmk.mongodb.net/souvenirhub?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    const result = await Product.updateMany(
      {
        $or: [
          { averageRating: { $exists: false } },
          { reviewCount: { $exists: false } }
        ]
      },
      {
        $set: {
          status: 'onSale',
          averageRating: 0,
          reviewCount: 0
        }
      }
    );

    console.log(`✅ Đã cập nhật ${result.modifiedCount} sản phẩm.`);
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật:', err);
  } finally {
    mongoose.disconnect();
  }
})();
