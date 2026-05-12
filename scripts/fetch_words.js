const fs = require('fs');
const path = require('path');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'words.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DICTIONARIES = {
  US: 'https://raw.githubusercontent.com/pbevin/lexicon/master/twl06.txt',
  UK: 'https://raw.githubusercontent.com/pbevin/lexicon/master/sowpods.txt'
};

const downloadFile = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

const initDb = () => {
  return new Promise((resolve, reject) => {
    // Delete existing db to start fresh during build
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
    
    const db = new sqlite3.Database(DB_PATH);
    db.serialize(() => {
      db.run(`CREATE TABLE words (
        word TEXT NOT NULL,
        dictionary TEXT NOT NULL
      )`);
      db.run(`CREATE INDEX idx_word_dict ON words(word, dictionary)`, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  });
};

const main = async () => {
  console.log('Starting data ingestion...');
  try {
    const db = await initDb();
    
    for (const [dictName, url] of Object.entries(DICTIONARIES)) {
      console.log(`Downloading ${dictName} from ${url}...`);
      const rawText = await downloadFile(url);
      
      const words = rawText.split('\n')
        .map(w => w.trim().toUpperCase())
        .filter(w => /^[A-Z]{2,15}$/.test(w));
      
      console.log(`Inserting ${words.length} words for ${dictName}...`);
      
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          const stmt = db.prepare('INSERT INTO words (word, dictionary) VALUES (?, ?)');
          for (const word of words) {
            stmt.run(word, dictName);
          }
          stmt.finalize();
          db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      console.log(`Finished processing ${dictName}`);
    }
    
    db.close();
    console.log('Database successfully built at', DB_PATH);
  } catch (error) {
    console.error('Error during data ingestion:', error);
    process.exit(1);
  }
};

main();
