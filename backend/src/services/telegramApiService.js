// backend/services/telegramApiService.js

const config = require('../config/config');
const User = require('../models/User'); 
const Favorite = require('../models/Favorite');
const Tag = require('../models/Tag');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// 导入 @telegram/client 客户端库 (请确保 package.json 已安装 'telegram')
const { TelegramClient } = require('telegram'); // <-- 确保这里是 'telegram'
const { StringSession } = require('telegram/sessions'); // <-- 确保这里是 'telegram/sessions'

// 导入 decryptSessionString 函数，用于解密 sessionString
// 注意：这里只导入需要用到的 decryptSessionString 函数，避免循环依赖问题
const { decryptSessionString } = require('./authService');


// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath);

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), config.storage.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 辅助函数：自动分类内容
const categorizeContent = (content) => {
  const { type, content: contentData } = content;
  
  if (contentData.mimeType) {
    if (contentData.mimeType.startsWith('image/')) return '图片';
    if (contentData.mimeType.startsWith('video/')) return '视频';
    if (contentData.mimeType.startsWith('audio/')) return '音频';
    if (contentData.mimeType.includes('pdf')) return '文档';
  }
  
  switch (type) {
    case 'photo': return '图片';
    case 'video': return '视频';
    case 'audio': return '音频';
    case 'document': return '文档';
    case 'link': return '链接';
    case 'text': 
      if (contentData.text && contentData.text.match(/https?:\/\/[^\s]+/)) {
        return '链接';
      }
      return '文本';
    default: return '其他';
  }
};

// 辅助函数：生成视频缩略图
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

// 辅助函数：实际下载文件 (现在使用 @telegram/client 客户端)
const downloadFile = async (client, telegramFileObject, userId, messageId) => {
  try {
    const userDir = path.join(uploadDir, userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    // 获取文件扩展名或根据MIME类型猜测
    let fileExt = '';
    if (telegramFileObject.mimeType) {
        const mimeToExt = {
            'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
            'video/mp4': '.mp4', 'video/webm': '.webm',
            'audio/mpeg': '.mp3', 'audio/ogg': '.ogg',
            'application/pdf': '.pdf',
            'application/zip': '.zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
            // ... 更多MIME类型映射
        };
        fileExt = mimeToExt[telegramFileObject.mimeType] || path.extname(telegramFileObject.name || '').toLowerCase() || '';
    } else if (telegramFileObject.name) {
        fileExt = path.extname(telegramFileObject.name).toLowerCase();
    }
    if (!fileExt) fileExt = '.bin'; // 默认二进制扩展名
    
    const localPath = path.join(userDir, `${messageId}${fileExt}`);
    
    // 使用 GramJS 客户端下载文件
    const fileBuffer = await client.downloadMedia(telegramFileObject);
    fs.writeFileSync(localPath, fileBuffer);

    let thumbnailUrl = null;
    const isVideo = telegramFileObject.mimeType && telegramFileObject.mimeType.startsWith('video/');

    if (isVideo && telegramFileObject.thumb) {
        // 如果视频有内置缩略图，下载它
        const thumbnailBuffer = await client.downloadMedia(telegramFileObject.thumb);
        const thumbExt = path.extname(telegramFileObject.thumb.name || '.jpg');
        const thumbFilename = `${messageId}_thumb${thumbExt}`;
        const thumbLocalPath = path.join(userDir, thumbFilename);
        fs.writeFileSync(thumbLocalPath, thumbnailBuffer);
        thumbnailUrl = `/media/${userId}/${thumbFilename}`; // 公开访问路径
    } else if (isVideo && localPath) {
        // 如果没有内置缩略图但下载了视频，尝试用 ffmpeg 生成
        const thumbFilename = `${messageId}_thumb.jpg`;
        const thumbLocalPath = path.join(userDir, thumbFilename);
        await generateVideoThumbnail(localPath, thumbLocalPath);
        thumbnailUrl = `/media/${userId}/${thumbFilename}`; // 公开访问路径
    }
    // 对于图片，可以直接使用 fileId 或 Telegram 提供的 URL，或者也下载到本地并生成URL
    if (telegramFileObject.mimeType && telegramFileObject.mimeType.startsWith('image/') && !thumbnailUrl) {
        thumbnailUrl = `/media/${userId}/${path.basename(localPath)}`; // 图片的缩略图就是它自己
    }
    
    return {
      localPath,
      thumbnailUrl // 用于前端显示的 URL
    };
  } catch (error) {
    console.error(`文件下载失败 (fileId: ${telegramFileObject.id}, userId: ${userId}):`, error.message, error.stack);
    throw error; // 抛出错误，以便上层处理
  }
};

// Telegram API服务
const telegramApiService = {
  // ***** 初始化 Telegram 客户端并获取账户详情 *****
  async initializeAndGetAccountDetails(apiId, apiHash, sessionString) {
    // GramJS 客户端的初始化
    const client = new TelegramClient(new StringSession(sessionString), parseInt(apiId), apiHash, {
      connectionRetries: 5, 
      baseLogger: console // 可选：启用 GramJS 内部日志，方便调试
    });
    try {
      console.log(`[GramJS] 尝试连接 Telegram API (API ID: ${apiId}, API Hash: ${apiHash.substring(0,5)}...${apiHash.substring(apiHash.length-5)}, Session Length: ${sessionString.length})...`);
      
      // 步骤1: 连接到 Telegram 服务器
      await client.connect(); 

      if (!client.connected) {
          throw new Error('Telegram客户端连接失败，无法建立连接。');
      }
      
      // 步骤2: 尝试获取账户信息 (使用 getMe()，假设会话已由 sessionString 建立)
      console.log(`[GramJS] 连接成功，尝试获取账户信息 (使用 getMe())...`);
      const me = await client.getMe(); // <-- 关键修改：回退到 client.getMe()

      // ***** 关键修改：添加更强大的防御性检查 *****
      // 如果 me 对象为空，或者它的 ID 属性为空，则抛出明确错误
      if (!me || !me.id) { 
          // 打印 GramJS 内部日志，看是否有未捕获的错误
          console.error('[GramJS] 致命错误：client.getMe() 返回了无效的用户对象。');
          throw new Error('无法获取完整的Telegram账户信息，API凭证或Session String可能无效。');
      }
      // ***************************************
      
      // 只有当 me 确定不为空且有 ID 时才打印这些信息，并访问其属性
      console.log(`[GramJS] 成功获取账户详情: @${me.username || '无用户名'} (ID: ${me.id})`); 
      
      // 获取用户头像（如果存在）
      let profilePhotoUrl = null;
      if (me.photo) {
        const photoPath = path.join(uploadDir, 'profiles', me.id.toString()); 
        if (!fs.existsSync(photoPath)) {
            fs.mkdirSync(photoPath, { recursive: true });
        }
        const profilePhotoBuffer = await client.downloadProfilePhoto(me, { isBig: true });
        const photoFilename = `${me.id}_profile.jpg`; // 假设为jpg
        const photoLocalPath = path.join(photoPath, photoFilename);
        fs.writeFileSync(photoLocalPath, profilePhotoBuffer);
        profilePhotoUrl = `/media/profiles/${me.id}/${photoFilename}`; // 公开访问路径
      }

      // 返回处理后的账户详情
      return {
        id: me.id.toString(), 
        username: me.username || null,
        firstName: me.firstName || null,
        lastName: me.lastName || null,
        profilePhoto: profilePhotoUrl
      };
    } catch (error) {
      console.error(`[GramJS] 初始化或获取账户详情失败: ${error.message}`, error.stack);
      // 捕获并重新抛出更具体的错误，前端会显示这些信息
      if (error.message.includes('AuthKey must be set') || error.message.includes('session string') || error.message.includes('PHONE_NUMBER_REQUIRED')) {
        throw new Error('Telegram会话字符串无效或过期，请重新生成或API凭证不匹配。');
      } else if (error.message.includes('PHONE_NUMBER_UNOCCUPIED')) {
        throw new Error('Telegram手机号码未注册或API凭证不匹配。');
      } else if (error.message.includes('AUTH_KEY_UNREGISTERED')) {
        throw new Error('API ID或API Hash不正确。');
      } else if (error.message.includes('PASSWORD_REQUIRED')) { 
        throw new Error('Telegram账户启用了两步验证，请确保Session String已包含密码验证（通过Telethon或GramJS交互式登录生成）。');
      } else if (error.message === 'TIMEOUT') { 
        throw new Error('Telegram API 连接超时，请检查网络或凭证是否正确。服务器IP可能被限制。');
      }
      throw new Error(`Telegram API错误：${error.message}`); 
    } finally {
      if (client && client.connected) {
        await client.disconnect(); 
      }
    }
  },

  // 同步用户收藏 (现在使用 @telegram/client 客户端获取真实数据)
  async syncUserFavorites(userId) {
    let client;
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const activeAccount = user.telegramAccounts.find(acc => acc.isActive);
      if (!activeAccount) {
        throw new Error('没有活跃的Telegram账号来同步收藏');
      }

      // 解密 SESSION_STRING
      const sessionString = decryptSessionString(activeAccount.sessionString);

      // 初始化 Telegram 客户端
      client = new TelegramClient(new StringSession(sessionString), parseInt(activeAccount.apiId), activeAccount.apiHash, {
        connectionRetries: 5,
        baseLogger: console // 启用日志
      });
      console.log(`[GramJS] 尝试连接 Telegram API 进行收藏同步...`);
      await client.connect(); // 这里不需要 start()，因为是同步已连接账户
      console.log(`[GramJS] 收藏同步连接成功，尝试获取消息...`);

      // 获取“Saved Messages”对话（或指定对话ID）
      // 假设收藏内容都在Saved Messages
      const savedMessagesDialog = await client.getPeerById('me'); // 'me' 通常指Saved Messages
      
      // 获取消息
      const messages = await client.getMessages(savedMessagesDialog, {
        limit: 100, // 每次获取的消息数量，可根据需要调整
        // offsetDate: activeAccount.lastSync // 可以用上次同步时间作为偏移量，只获取新消息
      });
      console.log(`[GramJS] 成功获取 ${messages.length} 条消息.`);

      let syncCount = 0;
      
      for (const msg of messages) {
        // 确保消息ID是唯一的
        const telegramMessageId = msg.id.toString(); 

        const existingFavorite = await Favorite.findOne({
          userId,
          telegramMessageId: telegramMessageId
        });
        
        if (existingFavorite) {
          // 如果已存在，跳过。
          continue; 
        }
        
        let favoriteType = 'text';
        let favoriteContent = { text: msg.message || '' };
        let localPath = null;
        let thumbnailUrl = null;
        let telegramFileObject = null; // 用于传递给 downloadFile
        
        // 判断消息类型并提取内容
        if (msg.media) {
          telegramFileObject = msg.media; // @telegram/client media 对象
          if (msg.photo) {
            favoriteType = 'photo';
            favoriteContent = { 
              fileId: msg.photo.id.toString(), // Telegram file ID
              caption: msg.message || '',
              width: msg.photo.sizes[msg.photo.sizes.length - 1].w, // 获取最大尺寸
              height: msg.photo.sizes[msg.photo.sizes.length - 1].h,
              url: null // 待下载到本地生成URL
            };
          } else if (msg.video) {
            favoriteType = 'video';
            favoriteContent = { 
              fileId: msg.video.id.toString(),
              caption: msg.message || '',
              duration: msg.video.duration,
              width: msg.video.w,
              height: msg.video.h,
              mimeType: msg.video.mimeType
            };
          } else if (msg.audio) {
            favoriteType = 'audio';
            favoriteContent = {
              fileId: msg.audio.id.toString(),
              caption: msg.message || '',
              duration: msg.audio.duration,
              mimeType: msg.audio.mimeType,
              fileName: msg.audio.attributes[0] ? msg.audio.attributes[0].fileName : 'audio.mp3',
              fileSize: msg.audio.size
            };
          } else if (msg.document) {
            favoriteType = 'document';
            favoriteContent = {
              fileId: msg.document.id.toString(),
              caption: msg.message || '',
              mimeType: msg.document.mimeType,
              fileName: msg.document.attributes[0] ? msg.document.attributes[0].fileName : 'document',
              fileSize: msg.document.size
            };
          }
          
          // 尝试下载文件
          try {
            const downloadResult = await downloadFile(client, telegramFileObject, userId, telegramMessageId);
            localPath = downloadResult.localPath;
            thumbnailUrl = downloadResult.thumbnailUrl;
            // 对于图片，如果 thumbnailUrl 仍为 null，但 localPath 存在，将其设为 localPath 的公共访问 URL
            if (favoriteType === 'photo' && !thumbnailUrl && localPath) {
                thumbnailUrl = `/media/${userId}/${path.basename(localPath)}`;
            }
            favoriteContent.url = thumbnailUrl; // 对于图片和视频，URL可以是缩略图或本地路径
          } catch (downloadError) {
            console.error(`同步收藏时文件下载失败 (msgId: ${telegramMessageId}):`, downloadError.message, downloadError.stack);
            localPath = null; 
            thumbnailUrl = null;
          }
        } else if (msg.message && msg.message.match(/https?:\/\/[^\s]+/)) {
          favoriteType = 'link';
          favoriteContent = { url: msg.message.match(/https?:\/\/[^\s]+/)[0], text: msg.message };
        }
        
        // 自动分类 (基于判断出的 favoriteType 和 favoriteContent)
        const category = categorizeContent({ type: favoriteType, content: favoriteContent });
        
        // 创建新收藏
        const newFavorite = new Favorite({
          userId,
          telegramMessageId: telegramMessageId,
          type: favoriteType,
          content: {
            ...favoriteContent,
            thumbnailUrl: thumbnailUrl // 确保 content 中包含 thumbnailUrl
          },
          category,
          savedAt: msg.date, // 使用 Telegram 消息的原始日期
          localPath,
          isDownloaded: !!localPath
        });
        
        await newFavorite.save();
        syncCount++;
        
        // 提取并更新标签
        if (msg.message) { // 从消息文本中提取标签
          const tagMatches = msg.message.match(/#(\w+)/g);
          if (tagMatches) {
            const tags = tagMatches.map(tag => tag.substring(1));
            newFavorite.tags = tags;
            await newFavorite.save(); // 保存更新后的收藏（包含标签）
            
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
      
      // 更新用户的 lastSync 时间
      activeAccount.lastSync = new Date();
      await user.save(); // 保存 user，更新 activeAccount 的 lastSync

      return { count: syncCount };
    } catch (error) {
      console.error('同步收藏失败:', error.message, error.stack);
      throw error;
    } finally {
      if (client && client.connected) {
        await client.disconnect(); 
      }
    }
  }
};

module.exports = telegramApiService;