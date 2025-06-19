const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'entries.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read entries
function readEntries() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper to write entries
function writeEntries(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

// Get all entries
app.get('/api/entries', (req, res) => {
  const entries = readEntries();
  res.json(entries);
});

// Get single entry by id
app.get('/api/entries/:id', (req, res) => {
  const entries = readEntries();
  const entry = entries.find(e => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json(entry);
});

// Submit new entry
app.post('/api/entries', (req, res) => {
  const { title, author, date, type, content, tags } = req.body;
  if (!title || !author || !date || !type || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const entries = readEntries();
  const newEntry = {
    id: Date.now().toString(),
    title,
    author,
    date,
    type,
    content,
    tags: tags || []
  };
  entries.unshift(newEntry);
  writeEntries(entries);
  res.status(201).json(newEntry);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 