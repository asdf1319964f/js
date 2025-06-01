const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 标签模型
const TagSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建复合唯一索引，确保每个用户的标签名称唯一
TagSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', TagSchema);
