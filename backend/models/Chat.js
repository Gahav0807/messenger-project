const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  isGroup: { 
    type: Boolean, 
    default: false 
  },
  groupName: { 
    type: String 
  },
  groupAdmin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  lastMessage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;