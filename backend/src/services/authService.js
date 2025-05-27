const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
const encryptSessionString = (sessionString) => {
  try {
    const key = Buffer.from(config.telegram.sessionEncryptionKey || 'default-encryption-key', 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(sessionString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('SESSION_STRING加密失败:', error);
    throw new Error('SESSION_STRING加密失败');
  }
};

// 解密SESSION_STRING
const decryptSessionString = (encryptedSessionString) => {
  try {
    const [ivHex, encryptedHex] = encryptedSessionString.split(':');
    const key = Buffer.from(config.telegram.sessionEncryptionKey || 'default-encryption-key', 'utf8');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('SESSION_STRING解密失败:', error);
    throw new Error('SESSION_STRING解密失败');
  }
};

// 用户认证服务
const authService = {
  // 用户注册
  async register(userData) {
    try {
      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        throw new Error('用户名已存在');
      }
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // 创建新用户
      const newUser = new User({
        username: userData.username,
        password: hashedPassword,
        telegramAccounts: []
      });
      
      // 如果提供了Telegram账号信息，添加到用户账号列表
      if (userData.telegramAccounts && userData.telegramAccounts.length > 0) {
        for (const account of userData.telegramAccounts) {
          // 加密SESSION_STRING
          account.sessionString = encryptSessionString(account.sessionString);
          newUser.telegramAccounts.push(account);
        }
        
        // 设置第一个账号为活跃账号
        if (newUser.telegramAccounts.length > 0) {
          newUser.telegramAccounts[0].isActive = true;
          newUser.activeAccountId = newUser.telegramAccounts[0]._id;
        }
      }
      
      // 保存用户
      await newUser.save();
      
      return {
        id: newUser._id,
        username: newUser.username,
        hasAccounts: newUser.telegramAccounts.length > 0
      };
    } catch (error) {
      throw error;
    }
  },
  
  // 用户登录
  async login(credentials) {
    try {
      // 查找用户
      const user = await User.findOne({ username: credentials.username });
      if (!user) {
        throw new Error('用户名或密码错误');
      }
      
      // 验证密码
      const isMatch = await bcrypt.compare(credentials.password, user.password);
      if (!isMatch) {
        throw new Error('用户名或密码错误');
      }
      
      // 更新最后登录时间
      user.lastLogin = Date.now();
      
      // 生成JWT令牌
      const token = generateToken(user);
      user.authToken = token;
      
      // 保存用户
      await user.save();
      
      // 准备返回数据
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
          profilePhoto: account.profilePhoto
        })),
        hasActiveAccount: !!user.activeAccountId
      };
      
      return {
        user: userData,
        token
      };
    } catch (error) {
      throw error;
    }
  },
  
  // 获取当前用户信息
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 准备返回数据
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
          profilePhoto: account.profilePhoto
        })),
        hasActiveAccount: !!user.activeAccountId
      };
      
      return userData;
    } catch (error) {
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
      
      // 检查API凭证是否完整
      if (!accountData.apiId || !accountData.apiHash || !accountData.sessionString) {
        throw new Error('API凭证不完整');
      }
      
      // 加密SESSION_STRING
      const encryptedSessionString = encryptSessionString(accountData.sessionString);
      
      // 创建新账号
      const newAccount = {
        name: accountData.name || `账号 ${user.telegramAccounts.length + 1}`,
        apiId: accountData.apiId,
        apiHash: accountData.apiHash,
        sessionString: encryptedSessionString,
        isActive: false,
        createdAt: Date.now()
      };
      
      // 添加到用户账号列表
      user.telegramAccounts.push(newAccount);
      
      // 如果是第一个账号，设置为活跃账号
      if (user.telegramAccounts.length === 1) {
        user.telegramAccounts[0].isActive = true;
        user.activeAccountId = user.telegramAccounts[0]._id;
      }
      
      // 保存用户
      await user.save();
      
      return {
        id: user.telegramAccounts[user.telegramAccounts.length - 1]._id,
        name: newAccount.name,
        isActive: newAccount.isActive
      };
    } catch (error) {
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
      
      // 查找目标账号
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在');
      }
      
      // 重置所有账号的活跃状态
      user.telegramAccounts.forEach(account => {
        account.isActive = false;
      });
      
      // 设置目标账号为活跃账号
      targetAccount.isActive = true;
      user.activeAccountId = targetAccount._id;
      
      // 保存用户
      await user.save();
      
      // 生成新的JWT令牌
      const token = generateToken(user);
      user.authToken = token;
      await user.save();
      
      return {
        token,
        account: {
          id: targetAccount._id,
          name: targetAccount.name,
          username: targetAccount.username,
          firstName: targetAccount.firstName,
          lastName: targetAccount.lastName,
          profilePhoto: targetAccount.profilePhoto
        }
      };
    } catch (error) {
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
      
      // 查找目标账号
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在');
      }
      
      // 检查是否是活跃账号
      const isActiveAccount = targetAccount.isActive;
      
      // 删除账号
      targetAccount.remove();
      
      // 如果删除的是活跃账号，且还有其他账号，设置第一个账号为活跃账号
      if (isActiveAccount && user.telegramAccounts.length > 0) {
        user.telegramAccounts[0].isActive = true;
        user.activeAccountId = user.telegramAccounts[0]._id;
      } else if (user.telegramAccounts.length === 0) {
        // 如果没有账号了，清除活跃账号ID
        user.activeAccountId = null;
      }
      
      // 保存用户
      await user.save();
      
      // 如果删除的是活跃账号，生成新的JWT令牌
      let token = null;
      if (isActiveAccount) {
        token = generateToken(user);
        user.authToken = token;
        await user.save();
      }
      
      return {
        success: true,
        token,
        remainingAccounts: user.telegramAccounts.map(account => ({
          id: account._id,
          name: account.name,
          isActive: account.isActive
        }))
      };
    } catch (error) {
      throw error;
    }
  },
  
  // 更新Telegram账号信息
  async updateTelegramAccount(userId, accountId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 查找目标账号
      const targetAccount = user.telegramAccounts.id(accountId);
      if (!targetAccount) {
        throw new Error('账号不存在');
      }
      
      // 更新账号信息
      if (updateData.name) {
        targetAccount.name = updateData.name;
      }
      
      if (updateData.apiId) {
        targetAccount.apiId = updateData.apiId;
      }
      
      if (updateData.apiHash) {
        targetAccount.apiHash = updateData.apiHash;
      }
      
      if (updateData.sessionString) {
        targetAccount.sessionString = encryptSessionString(updateData.sessionString);
      }
      
      // 保存用户
      await user.save();
      
      return {
        id: targetAccount._id,
        name: targetAccount.name,
        isActive: targetAccount.isActive
      };
    } catch (error) {
      throw error;
    }
  },
  
  // 获取活跃Telegram账号的API凭证
  async getActiveAccountCredentials(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 查找活跃账号
      const activeAccount = user.telegramAccounts.find(account => account.isActive);
      if (!activeAccount) {
        throw new Error('没有活跃的Telegram账号');
      }
      
      // 解密SESSION_STRING
      const sessionString = decryptSessionString(activeAccount.sessionString);
      
      return {
        apiId: activeAccount.apiId,
        apiHash: activeAccount.apiHash,
        sessionString
      };
    } catch (error) {
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
      
      // 更新设置
      user.settings = { ...user.settings, ...settings };
      await user.save();
      
      return user.settings;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = authService;
