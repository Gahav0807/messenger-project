const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  // Дополнительные поля (опционально)
  isRead: { 
    type: Boolean, 
    default: false 
  },
  mediaUrl: { 
    type: String 
  },
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat', 
    required: true 
  }
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;