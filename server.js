const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting: 60 requests per minute
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Serve static frontend files (will be built to /frontend/dist)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Initialize database
const dbPath = path.join(__dirname, 'data', 'words.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database. Ensure ingestion script has run.', err.message);
  }
});

// API endpoint
app.get('/api/check/:dictionary/:word', (req, res) => {
  const dictionary = req.params.dictionary.toUpperCase();
  const word = req.params.word.toUpperCase();

  // Validate dictionary
  if (!['US', 'UK'].includes(dictionary)) {
    return res.status(400).json({ error: 'Invalid dictionary. Use US or UK.' });
  }

  // Strict regex validation for word (2 to 15 uppercase letters)
  if (!/^[A-Z]{2,15}$/.test(word)) {
    return res.status(400).json({ error: 'Invalid word format. Must be 2-15 letters.' });
  }

  // Parameterized query
  const query = 'SELECT 1 FROM words WHERE word = ? AND dictionary = ? LIMIT 1';
  db.get(query, [word, dictionary], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      word: word,
      dictionary: dictionary,
      isValid: !!row
    });
  });
});

// Catch-all for React Router/Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sistermi's Scrabble Word Checker listening on port ${PORT}`);
});
