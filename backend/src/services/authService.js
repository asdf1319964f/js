// backend/services/authService.js

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// 导入 Telegram API 服务，因为它包含了 initializeAndGetAccountDetails 方法
// 这一行保留，因为 authService 的 addTelegramAccount 方法需要调用 telegramApiService
const telegramApiService = require('./telegramApiService'); 


// 辅助函数：确保密钥长度正确
const ensureKeyLength = (keyString) => {
  if (!keyString || keyString.length !== 64) { 
    const errorMsg = `SESSION_ENCRYPTION_KEY 配置错误！必须是64个十六进制字符。当前长度: ${keyString ? keyString.length : 'undefined'}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return keyString;
};

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      activeAccountId: user.activeAccountId 
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// 加密SESSION_STRING
// 这个函数现在可以直接调用 decryptSessionString，因为它们在同一文件且都被导出了
const encryptSessionString = (sessionString) => {
  try {
    const key = Buffer.from(ensureKeyLength(config.telegram.sessionEncryptionKey), 'hex');
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(sessionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('SESSION_STRING加密失败 (encryptSessionString):', error.message, error.stack); 
    throw new Error('SESSION_STRING加密失败');
  }
};

// 解密SESSION_STRING
// 这个函数直接定义在这里，不需要从其他文件导入
const decryptSessionString = (encryptedSessionString) => {
  try {
    const [ivHex, encryptedHex] = encryptedSessionString.split(':');
    const key = Buffer.from(ensureKeyLength(config.telegram.sessionEncryptionKey), 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('SESSION_STRING解密失败 (decryptSessionString):', error.message, error.stack);
    throw new Error('SESSION_STRING解密失败');
  }
};

// 用户认证服务
const authService = {
  // 用户注册
  async register({ username, password, telegramAccounts }) { 
    try {
      const existingUser = await User.findOne({ username: username });
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = new User({
        username: username,
        password: hashedPassword,
        telegramAccounts: []
      });
      
      if (telegramAccounts && telegramAccounts.length > 0) {
        for (const account of telegramAccounts) {
          account.sessionString = encryptSessionString(account.sessionString); // 调用加密函数
          newUser.telegramAccounts.push(account);
        }
        
        if (newUser.telegramAccounts.length > 0) {
          newUser.telegramAccounts[0].isActive = true;
          newUser.activeAccountId = newUser.telegramAccounts[0]._id;
        }
      }
      
      await newUser.save();
      
      return {
        success: true,
        message: '用户注册成功',
        userId: newUser._id,
        username: newUser.username
      };
    } catch (error) {
      console.error('注册服务失败:', error.message, error.stack); 
      throw error;
    }
  },
  
  // 用户登录
  async login(credentials) {
    try {
      const user = await User.findOne({ username: credentials.username });
      if (!user) {
        throw new Error('用户名或密码错误');
      }
      
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        throw new Error('用户名或密码错误');
      }
      
      user.lastLogin = Date.now();
      
      const token = generateToken(user);
      
      await user.save();
      
      const userData = {
        id: user._id,
        username: user.username,
        settings: user.settings,
        accounts: user.telegramAccounts.map(account => ({
          id: account._id,
          name: account.name,
          isActive: account.isActive,
          username: account.username,
          firstName: account.firstName,
          lastName: account.lastName,
          profilePhoto: account.profilePhoto,
          telegramId: account.telegramId 
        })),
        hasActiveAccount: !!user.activeAccountId
      };
      
      return {
        user: userData,
        token
      };
    } catch (error) {
      console.error('登录服务失败:', error.message, error.stack); 
      throw error;
    }
  },
  
  // 获取当前用户信息
  async fetchCurrentUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const userData = {
        id: user._id,
        username: user.username,
        settings: user.settings,
        accounts: user.telegramAccounts.map(account => ({
          id: account._id,
          name: account.name,
          isActive: account.isActive,
          username: account.username,
          firstName: account.firstName,
          lastName: account.lastName,
          profilePhoto: account.profilePhoto,
          telegramId: account.telegramId 
        })),
        hasActiveAccount: !!user.activeAccountId
      };
      
      return userData;
    } catch (error) {
      console.error('获取用户信息服务失败的详细错误信息 (fetchCurrentUser):', {
        message: error.message,
        stack: error.stack,
        userId: userId
      });
      throw error;
    }
  },
  
  // 添加Telegram账号
  async addTelegramAccount(userId, accountData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      if (!accountData.apiId || !accountData.apiHash || !accountData.sessionString) {
        throw new Error('API凭证不完整');
      }
      
      const encryptedSessionString = encryptSessionString(accountData.sessionString); // 调用加密函数
      
      const newAccount = { // <-- newAccount 是一个普通的 JS 对象
        name: accountData.name || `账号 ${user.telegramAccounts.length + 1}`,
        apiId: accountData.apiId,
        apiHash: accountData.apiHash,
        sessionString: encryptedSessionString,
        isActive: false, 
        createdAt: Date.now()
      };
      
      user.telegramAccounts.push(newAccount); // 将这个对象推入数组
      // newAccount 现在是 user.telegramAccounts 数组中一个条目的引用
      
      if (user.telegramAccounts.length === 1) {
        user.telegramAccounts[0].isActive = true;
        user.activeAccountId = user.telegramAccounts[0]._id;
      }
      
      await user.save(); // 第一次保存：Mongoose 会给 newAccount 在数组中分配一个 _id

      // ***** 关键修改：处理 Telegram API 获取账户详情并更新账户信息 *****
      let telegramAccountDetails;
      try {
          const decryptedSessionStringLocal = decryptSessionString(encryptedSessionString); // 调用解密函数
          
          // 注意：这里的 telegramApiService 模块现在被导入并使用
          telegramAccountDetails = await telegramApiService.initializeAndGetAccountDetails(
              newAccount.apiId, // 使用 newAccount 中已有的 apiId
              newAccount.apiHash, // 使用 newAccount 中已有的 apiHash
              decryptedSessionStringLocal // 使用本地解密后的 sessionString
          );

          // 只有在成功获取到详情时才更新 newAccount 对象
          if (telegramAccountDetails) { 
              newAccount.telegramId = telegramAccountDetails.id;
              newAccount.username = telegramAccountDetails.username;
              newAccount.firstName = telegramAccountDetails.firstName;
              newAccount.lastName = telegramAccountDetails.lastName;
              newAccount.profilePhoto = telegramAccountDetails.profilePhoto;
              newAccount.lastSync = new Date(); 
              // 告诉 Mongoose 数组内的文档被修改了，需要保存
              user.markModified('telegramAccounts'); 
          } else {
              // initializeAndGetAccountDetails 应该抛出错误而不是返回 null，
              // 但为了安全，这里处理一下以防万一
              console.warn('Telegram API 获取账户详情返回空数据。');
              throw new Error('Telegram API 获取账户详情返回空数据。');
          }

      } catch (telegramError) {
          console.error('连接Telegram API获取账户详情失败 (addTelegramAccount 内部):', telegramError.message, telegramError.stack);
          // 在这里抛出更明确的错误，以便外部捕获和处理
          throw new Error('无法连接Telegram API获取账户详情：' + telegramError.message);
      }
      // ***** 结束新增部分 *****
      
      await user.save(); // 第二次保存：持久化 newAccount 对象（作为内嵌文档）的详细信息

      return { // 返回新添加的账号信息 (现在包含了从Telegram获取的详情)
        id: newAccount._id, // newAccount._id 应该已经由第一次保存分配了
        name: newAccount.name,
        isActive: newAccount.isActive,
        username: newAccount.username, 
        firstName: newAccount.firstName,
        lastName: newAccount.lastName,
        profilePhoto: newAccount.profilePhoto,
        telegramId: newAccount.telegramId,
        lastSync: newAccount.lastSync 
      };
    } catch (error) {
      console.error('添加Telegram账号服务失败:', error.message, error.stack); 
      throw error;
    }
  },
  
  // 切换活跃Telegram账号
  async switchTelegramAccount(userId, accountId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在或无权访问');
      }
      
      user.telegramAccounts.forEach(account => {
        account.isActive = false;
      });
      
      targetAccount.isActive = true;
      user.activeAccountId = targetAccount._id;
      
      await user.save();
      
      const token = generateToken(user);
      
      return {
        token,
        account: { // 返回新活跃账号的非敏感信息
          id: targetAccount._id,
          name: targetAccount.name,
          isActive: targetAccount.isActive,
          username: targetAccount.username,
          firstName: targetAccount.firstName,
          lastName: targetAccount.lastName, // 修正 typo from target.lastName
          profilePhoto: targetAccount.profilePhoto,
          telegramId: targetAccount.telegramId
        }
      };
    } catch (error) {
      console.error('切换Telegram账号服务失败:', error.message, error.stack);
      throw error;
    }
  },
  
  // 更新Telegram账号信息 (仅更新部分字段)
  async updateTelegramAccount(userId, accountId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在或无权访问');
      }
      
      if (updateData.name !== undefined) {
        targetAccount.name = updateData.name;
      }
      if (updateData.apiId !== undefined) {
        targetAccount.apiId = updateData.apiId;
      }
      if (updateData.apiHash !== undefined) {
        targetAccount.apiHash = updateData.apiHash;
      }
      if (updateData.sessionString !== undefined && updateData.sessionString.trim() !== '') {
        targetAccount.sessionString = encryptSessionString(updateData.sessionString); // 调用加密函数
      }
      
      await user.save();
      
      return { // 返回更新后的账号信息 (不包含敏感信息)
        id: targetAccount._id,
        name: targetAccount.name,
        isActive: targetAccount.isActive,
        username: targetAccount.username, 
        firstName: targetAccount.firstName,
        lastName: targetAccount.lastName,
        profilePhoto: targetAccount.profilePhoto,
        telegramId: targetAccount.telegramId,
        lastSync: targetAccount.lastSync
      };
    } catch (error) {
      console.error('更新Telegram账号服务失败:', error.message, error.stack);
      throw error;
    }
  },
  
  // 删除Telegram账号
  async deleteTelegramAccount(userId, accountId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在或无权访问');
      }
      
      const isActiveAccount = targetAccount.isActive;
      
      targetAccount.remove(); // 删除内嵌文档

      if (isActiveAccount && user.telegramAccounts.length > 0) {
        user.telegramAccounts[0].isActive = true;
        user.activeAccountId = user.telegramAccounts[0]._id;
      } else if (user.telegramAccounts.length === 0) {
        user.activeAccountId = null;
      }
      
      await user.save();
      
      let token = null;
      if (isActiveAccount) {
        token = generateToken(user);
      }
      
      const remainingAccountsData = user.telegramAccounts.map(acc => ({
          id: acc._id,
          name: acc.name,
          isActive: acc.isActive,
          username: acc.username,
          firstName: acc.firstName,
          lastName: acc.lastName,
          profilePhoto: acc.profilePhoto,
          telegramId: acc.telegramId,
          lastSync: acc.lastSync
      }));

      return {
        success: true,
        token, 
        remainingAccounts: remainingAccountsData
      };
    } catch (error) {
      console.error('删除Telegram账号服务失败:', error.message, error.stack);
      throw error;
    }
  },

  // 更新用户设置
  async updateUserSettings(userId, settings) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 合并新设置到现有设置对象
      user.settings = Object.assign({}, user.settings || {}, settings);
      // 标记嵌套对象已修改
      user.markModified('settings');
      await user.save();

      return user.settings;
    } catch (error) {
      console.error('更新用户设置服务失败:', error.message, error.stack);
      throw error;
    }
  },

  // 获取活跃Telegram账号的API凭证 (后端内部调用，例如同步功能)
  async getActiveAccountCredentials(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      const activeAccount = user.telegramAccounts.find(account => account.isActive);
      if (!activeAccount) {
        throw new Error('没有活跃的Telegram账号');
      }
      
      const sessionString = decryptSessionString(activeAccount.sessionString); // 调用解密函数
      
      return {
        apiId: activeAccount.apiId,
        apiHash: activeAccount.apiHash,
        sessionString,
        telegramId: activeAccount.telegramId
      };
    } catch (error) {
      console.error('获取活跃账户凭证服务失败:', error.message, error.stack);
      throw error;
    }
  }
};

// ***** 关键修改：正确导出 authService 对象以及独立函数 *****
// 这样其他模块可以通过 require('./authService') 访问 authService 对象的方法，
// 也可以通过解构方式访问 decryptSessionString 等独立函数。
module.exports = {
  ...authService, // 展开 authService 对象的属性（即所有方法）
  decryptSessionString, // 显式导出 decryptSessionString 函数
  encryptSessionString, // 显式导出 encryptSessionString 函数
  // generateToken, // 如果需要被其他模块直接调用，也可以在这里导出
  // ensureKeyLength, // 如果需要被其他模块直接调用，也可以在这里导出
};