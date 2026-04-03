const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const districtsRoutes = require('./routes/districts');
const microdistrictsRoutes = require('./routes/microdistricts');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Maps Editor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register',
      districts: '/api/districts',
      microdistricts: '/api/microdistricts'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/microdistricts', microdistrictsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint не найден'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Maps Editor API запущен на порту ${PORT}`);
  console.log(`📍 Окружение: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API доступен по адресу: http://localhost:${PORT}`);
});

module.exports = app;
