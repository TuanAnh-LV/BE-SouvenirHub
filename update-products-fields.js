const mongoose = require('mongoose');
const Product = require('./models/product.model');
const OrderItem = require('./models/orderItem.model');

const MONGO_URI = 'mongodb+srv://souvenirhub:Souvenir123@cluster0.ypd2gmk.mongodb.net/souvenirhub?retryWrites=true&w=majority&appName=Cluster0'; // Thay URI của bạn

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const updated = await Product.updateMany(
      { sold: { $exists: false } },
      { $set: { sold: 0 } }
    );
    
    console.log(`✅ Synchronized ${updated.modifiedCount} products with sold = 0`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to sync sold:', err);
    process.exit(1);
  }
})();
