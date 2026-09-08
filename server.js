const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload folders exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'data', 'database.json');
['uploads', 'uploads/images', 'uploads/audio', 'data'].forEach(dir => {
  if (!fs.existsSync(path.join(__dirname, dir))) fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ storySets: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOADS_DIR));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, 'uploads/images/');
    else if (file.mimetype.startsWith('audio/')) cb(null, 'uploads/audio/');
    else cb(new Error('Invalid file type'), null);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API: Get all story sets
app.get('/api/stories', (req, res) => {
  const db = readDB();
  res.json(db.storySets);
});

// API: Get specific story set
app.get('/api/stories/:id', (req, res) => {
  const db = readDB();
  const story = db.storySets.find(s => s.id === req.params.id);
  if (!story) return res.status(404).json({ error: 'Story set not found' });
  res.json(story);
});

// API: Create a new story set with cards and reference audio
app.post('/api/stories', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cards', maxCount: 6 }
]), (req, res) => {
  try {
    const { title, prompt, duration } = req.body;
    const db = readDB();

    const audioFile = req.files['audio'] ? `/uploads/audio/${req.files['audio'][0].filename}` : null;
    const cardFiles = (req.files['cards'] || []).map((file, index) => ({
      id: `card-${Date.now()}-${index}`,
      correctOrder: index + 1, // Admin uploads in target correct order 1, 2, 3, 4
      imageUrl: `/uploads/images/${file.filename}`
    }));

    const newStory = {
      id: 'story_' + Date.now(),
      title: title || 'Untitled Story',
      prompt: prompt || '請按順序排列圖片，然後講述故事。',
      durationSeconds: parseInt(duration, 10) || 60,
      audioUrl: audioFile,
      cards: cardFiles
    };

    db.storySets.push(newStory);
    writeDB(db);

    res.status(201).json({ success: true, story: newStory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Delete a story set
app.delete('/api/stories/:id', (req, res) => {
  const db = readDB();
  db.storySets = db.storySets.filter(s => s.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});