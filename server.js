const express = require('express');
const mongoose = require('mongoose');
const Note = require('./model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const app = express();
app.use(express.json());

// Middleware for JWT authentication
const auth = asyncHandler(async (req, res, next) => {
  try {
    let token = req.header('x-token');
    console.log(token);
    if (!token) {
      return res.status(400).send('Token not found');
    }
    let decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode.user;
    next();
  } catch (err) {
    console.log(err);
    return res.status(400).send('Server error');
  }
});

// MongoDB connection
mongoose.connect('mongodb+srv://VENU:VENU@cluster0.8dcs9gq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

// Registration endpoint
app.post('/auth/register', asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

// Login endpoint
app.post('/auth/login', asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const payload = {
      user: {
        id: user.id
      }
    };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      return res.json({ token });
    });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}));

// Create a new note
app.post('/notes', auth, asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content });
    const savedNote = await newNote.save();
    res.json(savedNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

// Retrieve all notes
app.get('/notes', auth, asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// Retrieve a specific note by ID
app.get('/notes/:id', auth, asyncHandler(async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// Update a specific note by ID
app.put('/notes/:id', auth, asyncHandler(async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, { title, content, lastModifiedAt: Date.now() }, { new: true });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}));

// Delete a specific note by ID
app.delete('/notes/:id', auth, asyncHandler(async (req, res) => {
  try {
    const deletedNote = await Note.findByIdAndDelete(req.params.id);
    if (!deletedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}));

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
