const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Database Setup
const db = new Database('photos.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    round INTEGER DEFAULT 1,
    wins INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
  );
  
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id INTEGER NOT NULL,
    loser_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(winner_id) REFERENCES photos(id),
    FOREIGN KEY(loser_id) REFERENCES photos(id)
  );
`);

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public/uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Routes

// 1. Upload Photos
app.post('/api/photos', upload.array('photos'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });

    const insert = db.prepare('INSERT INTO photos (filename, original_name) VALUES (?, ?)');
    const insertMany = db.transaction((files) => {
      files.forEach(file => insert.run(file.filename, file.originalname));
    });

    insertMany(req.files);
    res.json({ message: `Uploaded ${req.files.length} photos` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 2. Get Duel Pair
app.get('/api/duel', (req, res) => {
  try {
    const findMatch = () => {
      const activeCount = db.prepare("SELECT COUNT(*) as count FROM photos WHERE status = 'active'").get().count;
      
      if (activeCount <= 1) {
         const winner = db.prepare("SELECT * FROM photos WHERE status = 'active' ORDER BY wins DESC LIMIT 1").get();
         return { type: 'winner', winner: winner || null };
      }

      const rounds = db.prepare("SELECT round, COUNT(*) as count FROM photos WHERE status = 'active' GROUP BY round ORDER BY round ASC").all();

      for (const r of rounds) {
        if (r.count >= 2) {
          const photos = db.prepare("SELECT * FROM photos WHERE round = ? AND status = 'active' ORDER BY RANDOM() LIMIT 2").all(r.round);
          if (photos.length === 2 && photos[0].id !== photos[1].id) {
             const matchesRemaining = Math.floor(r.count / 2);
             return { type: 'duel', left: photos[0], right: photos[1], matchesRemaining };
          }
        } else if (r.count === 1) {
          db.prepare("UPDATE photos SET round = round + 1 WHERE round = ? AND status = 'active'").run(r.round);
          return 'promoted';
        }
      }
      return null;
    };

    let result = findMatch();
    let attempts = 0;
    while (result === 'promoted' && attempts < 10) {
        result = findMatch();
        attempts++;
    }

    result ? res.json(result) : res.status(404).json({ error: 'No duel found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Duel generation failed' });
  }
});

// 3. Vote (Eliminate)
app.post('/api/vote', (req, res) => {
  const { winnerId, loserId } = req.body;
  if (!winnerId || !loserId) return res.status(400).json({ error: 'Missing IDs' });

  try {
    const transaction = db.transaction(() => {
        db.prepare("UPDATE photos SET round = round + 1, wins = wins + 1 WHERE id = ?").run(winnerId);
        db.prepare("UPDATE photos SET status = 'eliminated' WHERE id = ?").run(loserId);
        db.prepare("INSERT INTO history (winner_id, loser_id) VALUES (?, ?)").run(winnerId, loserId);
    });
    transaction();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vote failed' });
  }
});

// 3.5 Undo Vote
app.post('/api/undo', (req, res) => {
    try {
        const lastAction = db.prepare("SELECT * FROM history ORDER BY id DESC LIMIT 1").get();
        
        if (!lastAction) {
            return res.status(404).json({ error: 'No history to undo' });
        }

        const transaction = db.transaction(() => {
            // Revert Winner: Decrease round and wins
            db.prepare("UPDATE photos SET round = round - 1, wins = wins - 1 WHERE id = ?").run(lastAction.winner_id);
            // Revert Loser: Set status back to active
            db.prepare("UPDATE photos SET status = 'active' WHERE id = ?").run(lastAction.loser_id);
            // Remove history record
            db.prepare("DELETE FROM history WHERE id = ?").run(lastAction.id);
        });

        transaction();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Undo failed' });
    }
});

// 4. Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const sql = `
            SELECT id, filename, original_name, MAX(round) as round, MAX(wins) as wins, status 
            FROM photos 
            GROUP BY original_name 
            ORDER BY wins DESC 
            LIMIT 5
        `;
        res.json(db.prepare(sql).all());
    } catch (err) {
        res.status(500).json({ error: 'Leaderboard failed' });
    }
});

// 5. Restart
app.post('/api/restart', (req, res) => {
    try {
        try {
            db.transaction(() => {
                db.prepare("DELETE FROM history").run();
                db.prepare("DELETE FROM photos").run();
            })();
        } catch (dbError) {
             console.error("DB Cleanup Error:", dbError);
             // Fallback: try deleting individually if constraint fails, though order above should be correct
             try {
                db.prepare("DELETE FROM history").run();
                db.prepare("DELETE FROM photos").run();
             } catch(e) {
                 throw e; 
             }
        }
        
        const uploadsDir = path.join(__dirname, 'public/uploads');
        if (fs.existsSync(uploadsDir)) {
             const files = fs.readdirSync(uploadsDir);
             files.forEach(file => {
                 if (file !== '.gitkeep') {
                     try {
                        fs.unlinkSync(path.join(uploadsDir, file));
                     } catch (e) {
                         console.error(`Failed to delete ${file}:`, e);
                     }
                 }
             });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Restart error:", err);
        res.status(500).json({ error: 'Restart failed' });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
