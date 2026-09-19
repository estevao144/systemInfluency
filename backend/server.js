const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes       = require('./src/routes/auth');
const influencerRoutes = require('./src/routes/influencer');
const adminRoutes      = require('./src/routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth',       authRoutes);
app.use('/api/influencer', influencerRoutes);
app.use('/api/admin',      adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 81;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
