const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SouvenirHub API',
      version: '1.0.0',
      description: 'API documentation for SouvenirHub project'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: ['./routes/*.js'], // đường dẫn chứa Swagger comment
};


const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to SouvenirHub API');
});


const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);


module.exports = app;
