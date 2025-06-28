import express from 'express'
import bodyParser from 'body-parser'

import db from './config/db.js'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import discoverRoutes from './routes/discover.js'
import connectionRoutes from './routes/connections.js'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// ROUTES
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/discover', discoverRoutes)
app.use('/api/connections', connectionRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});