// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const influencerRoutes = require('./src/routes/influencer');
// const adminRoutes = require('./src/routes/admin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/influencer', influencerRoutes);
// app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
