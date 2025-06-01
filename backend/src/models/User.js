const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Telegram账号模式
const TelegramAccountSchema = new Schema({
  name: {
    type: String,
    required: true,
    default: '默认账号'
  },
  apiId: {
    type: String,
    required: true
  },
  apiHash: {
    type: String,
    required: true
  },
  sessionString: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  telegramId: {
    type: String
  },
  username: {
    type: String
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  profilePhoto: {
    type: String
  },
  lastSync: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 用户模型
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  telegramAccounts: [TelegramAccountSchema],
  activeAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'TelegramAccount'
  },
  authToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  settings: {
    defaultView: {
      type: String,
      enum: ['grid', 'list'],
      default: 'grid'
    },
    itemsPerPage: {
      type: Number,
      default: 20
    }
  }
});

module.exports = mongoose.model('User', UserSchema);
