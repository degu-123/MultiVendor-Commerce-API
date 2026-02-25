const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const AppError=require('./utils/AppError');
const { globalLimiter } = require('./middlewares/rateLimiter');
const globalErrorHandler = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sellerApplicationRoutes = require('./routes/sellerApplicationRoutes');
const storeRoutes = require('./routes/storeRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const productRoutes=require('./routes/productRoutes');
const cartRoutes=require('./routes/cartRoutes');
const orderRoutes=require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
app.use(helmet());

const allowedOrigins = ['http://localhost:3000']; // Add production URLs
app.use(cors({
  origin: function(origin, callback){
    if(!origin || allowedOrigins.indexOf(origin) !== -1){
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));
// Logging (dev only)
//development only
  app.use(morgan('dev'));
app.use(express.json({limit:'10kb'}));
app.use('/api/v1', globalLimiter);
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users',userRoutes);
app.use('/api/v1/seller-applications',sellerApplicationRoutes);
app.use('/api/v1/stores',storeRoutes);
app.use('/api/v1/catalogs',catalogRoutes);
app.use('/api/v1/products',productRoutes);
app.use('/api/v1/carts',cartRoutes);
app.use('/api/v1/orders',orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;