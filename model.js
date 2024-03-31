const mongoose = require('mongoose');


const noteSchema = new mongoose.Schema({
  title: {
    type: String
  },
  content: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now 
  },
  lastModifiedAt: {
    type: Date,
    default: Date.now 
  }
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
