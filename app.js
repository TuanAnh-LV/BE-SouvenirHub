const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Biến để lưu io instance
let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

// ✅ Gắn req.io vào request
app.use((req, res, next) => {
  if (ioInstance) {
    req.io = ioInstance;
  }
  next();
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SouvenirHub API",
      version: "1.0.0",
      description: "API documentation for SouvenirHub project",
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication (register, login, forgot password)",
      },
      { name: "Admin", description: "Admin dashboard and control" },
      { name: "User", description: "User profile management" },
      { name: "Seller", description: "Seller management and operations" },
      { name: "Shops", description: "Shop registration and management" },
      { name: "ShopApplications", description: "Shop application management" },
      { name: "Categories", description: "Product categories" },
      { name: "Products", description: "Product creation and browsing" },
      { name: "ProductVariants", description:"Product variant"},
      { name: "ProductImages", description: "Product image management" },
      { name: "Cart", description: "Add to cart" },
      { name: "Orders", description: "Order placement and tracking" },
      { name: "Addresses", description: "Shipping address management" },
      { name: "Payments", description: "Payment processing and management" },
      { name: "Reviews", description: "Product reviews and ratings" },
      { name: "Notifications",description: "Notification"},
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/**/*.js"], // hoặc './routes/*.js' nếu không có subfolder
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Sample route
app.get("/", (req, res) => {
  res.send("Welcome to SouvenirHub API");
});

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

const addressRoutes = require("./routes/address.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");

app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

const reviewRoutes = require("./routes/review.routes");
const sellerRoutes = require("./routes/seller.routes");

app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes);

const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);

const vnpayRoutes = require("./routes/vnpay.routes");
app.use("/api/payments", vnpayRoutes);

const productImageRoutes = require("./routes/productImage.routes");
app.use("/api/product-images", productImageRoutes);

const shopRoutes = require("./routes/shop.routes");
app.use("/api/shops", shopRoutes);

const shopApplicationRoutes = require("./routes/shopApplication.routes");
app.use("/api/shop-applications", shopApplicationRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/user", userRoutes);

const cartRoutes = require("./routes/cart.routes");
app.use("/api/cart", cartRoutes);

const blogRoutes = require("./routes/blog.routes");
app.use("/api/blogs", blogRoutes);

const blogImageRoutes = require("./routes/blogImage.routes");
app.use("/api/blog-images", blogImageRoutes);

const voucherRoutes = require("./routes/voucher.routes");
app.use("/api/vouchers", voucherRoutes);

const bookingRoutes = require("./routes/booking.routes");
app.use("/api/bookings", bookingRoutes);

const productVariant = require("./routes/productVariant.routes")
app.use('/api/product-variants', productVariant);

const notificationRoutes = require("./routes/notifications.routes");
app.use('/api/notifications', notificationRoutes);

module.exports = { app, setSocketIO };


