const { Telegraf } = require('telegraf');
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

// 创建Telegram Bot实例
const bot = new Telegraf(config.telegram.botToken);

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
    
    // 获取文件信息
    const fileInfo = await bot.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.telegram.botToken}/${fileInfo.file_path}`;
    
    // 设置本地文件路径
    const fileExt = path.extname(fileInfo.file_path) || '';
    const localPath = path.join(userDir, `${messageId}${fileExt}`);
    
    // 下载文件
    const response = await fetch(fileUrl);
    const fileStream = fs.createWriteStream(localPath);
    
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
    
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

// Telegram Bot服务
const telegramBotService = {
  // 初始化Bot
  init() {
    // 处理/start命令
    bot.start((ctx) => {
      return ctx.reply('欢迎使用Telegram收藏夹查看系统！请使用Web应用登录以同步您的收藏内容。');
    });
    
    // 处理/help命令
    bot.help((ctx) => {
      return ctx.reply(
        '使用指南：\n' +
        '/start - 开始使用Bot\n' +
        '/login - 获取登录链接\n' +
        '/sync - 手动同步收藏\n' +
        '/help - 获取帮助信息'
      );
    });
    
    // 处理/login命令
    bot.command('login', (ctx) => {
      // 这里应该返回Web应用的登录链接
      return ctx.reply('请访问以下链接登录系统：\nhttps://your-domain.com/login');
    });
    
    // 处理/sync命令
    bot.command('sync', async (ctx) => {
      try {
        const telegramId = ctx.from.id.toString();
        const user = await User.findOne({ telegramId });
        
        if (!user) {
          return ctx.reply('请先通过Web应用登录系统。');
        }
        
        ctx.reply('开始同步您的收藏内容，这可能需要一些时间...');
        
        // 调用同步函数
        const result = await this.syncUserFavorites(user._id);
        
        return ctx.reply(`同步完成！共同步了${result.count}个收藏项目。`);
      } catch (error) {
        console.error('同步失败:', error);
        return ctx.reply('同步失败，请稍后重试。');
      }
    });
    
    // 启动Bot
    bot.launch().then(() => {
      console.log('Telegram Bot 已启动');
    }).catch(err => {
      console.error('Telegram Bot 启动失败:', err);
    });
    
    // 优雅关闭
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  },
  
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
      // 由于Telegram API限制，这里简化处理，假设我们已经有了收藏内容列表
      // 在实际应用中，需要使用Telegram客户端API或其他方法获取
      
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
  },
  
  // 获取Bot实例
  getBot() {
    return bot;
  }
};

module.exports = telegramBotService;
