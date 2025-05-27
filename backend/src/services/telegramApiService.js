const config = require('../config/config');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Tag = require('../models/Tag');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), config.storage.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 自动分类函数
const categorizeContent = (content) => {
  // 基于内容类型和其他属性进行简单分类
  const { type, content: contentData } = content;
  
  // 基于MIME类型分类
  if (contentData.mimeType) {
    if (contentData.mimeType.startsWith('image/')) return '图片';
    if (contentData.mimeType.startsWith('video/')) return '视频';
    if (contentData.mimeType.startsWith('audio/')) return '音频';
    if (contentData.mimeType.includes('pdf')) return '文档';
  }
  
  // 基于内容类型分类
  switch (type) {
    case 'photo': return '图片';
    case 'video': return '视频';
    case 'audio': return '音频';
    case 'document': return '文档';
    case 'link': return '链接';
    case 'text': 
      // 如果文本包含URL，归类为链接
      if (contentData.text && contentData.text.match(/https?:\/\/[^\s]+/)) {
        return '链接';
      }
      return '文本';
    default: return '其他';
  }
};

// 生成视频缩略图
const generateVideoThumbnail = async (videoPath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: path.dirname(thumbnailPath),
        filename: path.basename(thumbnailPath),
        size: '320x240'
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', (err) => reject(err));
  });
};

// 下载文件
const downloadFile = async (fileId, userId, messageId, type) => {
  try {
    // 创建用户目录
    const userDir = path.join(uploadDir, userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // 这里应该使用Telegram API通过API_ID和API_HASH下载文件
    // 由于我们移除了Bot相关功能，这部分需要重新实现
    // 在实际应用中，需要使用Telegram客户端API获取文件
    
    // 设置本地文件路径
    const fileExt = '.jpg'; // 假设扩展名
    const localPath = path.join(userDir, `${messageId}${fileExt}`);
    
    // 如果是视频，生成缩略图
    let thumbnailPath = null;
    if (type === 'video') {
      thumbnailPath = path.join(userDir, `${messageId}_thumb.jpg`);
      await generateVideoThumbnail(localPath, thumbnailPath);
    }
    
    return {
      localPath,
      thumbnailPath
    };
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
};

// Telegram API服务
const telegramApiService = {
  // 同步用户收藏
  async syncUserFavorites(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 获取用户的Telegram ID
      const telegramId = user.telegramId;
      
      // 这里应该使用Telegram API获取用户的收藏内容
      // 需要使用API_ID、API_HASH和SESSION_STRING访问
      // 在实际应用中，需要使用Telegram客户端API获取收藏内容
      
      // 模拟收藏内容
      const mockFavorites = [
        {
          messageId: '12345',
          type: 'photo',
          content: {
            fileId: 'photo123',
            caption: '美丽的风景',
            width: 1280,
            height: 720
          },
          savedAt: new Date()
        },
        {
          messageId: '12346',
          type: 'video',
          content: {
            fileId: 'video123',
            caption: '有趣的视频',
            duration: 30,
            width: 1280,
            height: 720
          },
          savedAt: new Date()
        },
        {
          messageId: '12347',
          type: 'text',
          content: {
            text: '重要笔记：https://example.com'
          },
          savedAt: new Date()
        }
      ];
      
      let syncCount = 0;
      
      // 处理每个收藏项目
      for (const item of mockFavorites) {
        // 检查是否已存在
        const existingFavorite = await Favorite.findOne({
          userId,
          telegramMessageId: item.messageId
        });
        
        if (!existingFavorite) {
          // 处理媒体文件
          let localPath = null;
          let thumbnailUrl = null;
          
          if (['photo', 'video', 'audio', 'document'].includes(item.type) && item.content.fileId) {
            try {
              // 下载文件
              const downloadResult = await downloadFile(
                item.content.fileId,
                userId,
                item.messageId,
                item.type
              );
              
              localPath = downloadResult.localPath;
              
              // 如果是视频，设置缩略图URL
              if (item.type === 'video' && downloadResult.thumbnailPath) {
                thumbnailUrl = `/media/thumbnail/${path.basename(downloadResult.thumbnailPath)}`;
              }
            } catch (error) {
              console.error('文件下载失败:', error);
            }
          }
          
          // 自动分类
          const category = categorizeContent({
            type: item.type,
            content: item.content
          });
          
          // 创建新收藏
          const newFavorite = new Favorite({
            userId,
            telegramMessageId: item.messageId,
            type: item.type,
            content: {
              ...item.content,
              thumbnailUrl
            },
            category,
            savedAt: item.savedAt,
            localPath,
            isDownloaded: !!localPath
          });
          
          await newFavorite.save();
          syncCount++;
          
          // 如果内容有标签，更新标签计数
          if (item.content.caption) {
            // 简单的标签提取逻辑，查找#标签
            const tagMatches = item.content.caption.match(/#(\w+)/g);
            if (tagMatches) {
              const tags = tagMatches.map(tag => tag.substring(1));
              
              // 更新收藏的标签
              newFavorite.tags = tags;
              await newFavorite.save();
              
              // 更新标签集合
              for (const tagName of tags) {
                await Tag.findOneAndUpdate(
                  { userId, name: tagName },
                  { $inc: { count: 1 } },
                  { upsert: true, new: true }
                );
              }
            }
          }
        }
      }
      
      return { count: syncCount };
    } catch (error) {
      console.error('同步收藏失败:', error);
      throw error;
    }
  }
};

module.exports = telegramApiService;
