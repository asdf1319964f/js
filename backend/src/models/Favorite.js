const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 收藏内容模型
const FavoriteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telegramMessageId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'photo', 'video', 'audio', 'document', 'link'],
    required: true
  },
  content: {
    text: String,
    caption: String,
    fileId: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number,
    width: Number,
    height: Number,
    thumbnailUrl: String,
    url: String
  },
  tags: [{
    type: String
  }],
  category: {
    type: String
  },
  savedAt: {
    type: Date,
    default: Date.now
  },
  localPath: {
    type: String
  },
  isDownloaded: {
    type: Boolean,
    default: false
  }
});

// 创建索引
FavoriteSchema.index({ userId: 1, savedAt: -1 });
FavoriteSchema.index({ userId: 1, type: 1 });
FavoriteSchema.index({ userId: 1, tags: 1 });
FavoriteSchema.index({ userId: 1, category: 1 });
FavoriteSchema.index({ 
  userId: 1, 
  'content.text': 'text', 
  'content.caption': 'text' 
}, { 
  name: 'search_index' 
});

module.exports = mongoose.model('Favorite', FavoriteSchema);
