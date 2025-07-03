import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Account } from '../models/Account';
import { User } from '../models/User';
import { ContentPublish } from '../models/ContentPublish';
import { Content } from '../models/Content';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AccountController {
  // 获取账号列表
  async getAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        platform, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (platform) {
        where.platform = platform;
      }

      if (search) {
        where[Op.or] = [
          { nickname: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Account.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [[sortBy as string, sortOrder as string]],
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          accounts: rows,
          pagination: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            limit: Number(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取单个账号详情
  async getAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!account) {
        throw createError('Account not found', 404);
      }

      res.json({
        success: true,
        data: { account }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建账号
  async createAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        nickname,
        username,
        password,
        phone,
        email,
        platform = 'xiaohongshu',
        deviceInfo,
        proxyConfig
      } = req.body;

      // 检查用户名是否已存在
      const existingAccount = await Account.findOne({
        where: { username }
      });

      if (existingAccount) {
        throw createError('Username already exists', 400);
      }

      const account = await Account.create({
        userId: 1, // 开发环境默认用户ID
        nickname,
        username,
        password,
        phone,
        email,
        platform: platform || 'xiaohongshu',
        deviceInfo,
        proxyConfig,
        status: 'inactive',
        // 统计信息默认值
        followersCount: 0,
        followingCount: 0,
        likesCount: 0,
        notesCount: 0,
        // 风控信息默认值
        riskLevel: 'low',
        lastActiveTime: new Date(),
        dailyActionsCount: 0,
        weeklyActionsCount: 0,
        monthlyActionsCount: 0,
        // 运营配置默认值
        isAutoPublish: false
      });

      res.status(201).json({
        success: true,
        data: { account }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新账号
  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      // 如果要更新用户名，检查是否已存在
      if (updateData.username && updateData.username !== account.username) {
        const existingAccount = await Account.findOne({
          where: { 
            username: updateData.username,
            id: { [Op.ne]: id }
          }
        });

        if (existingAccount) {
          throw createError('Username already exists', 400);
        }
      }

      await account.update(updateData);

      res.json({
        success: true,
        data: { account }
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除账号
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      await account.destroy();

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量导入账号
  async importAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { accounts } = req.body;

      if (!Array.isArray(accounts) || accounts.length === 0) {
        throw createError('Accounts array is required', 400);
      }

      const createdAccounts = [];
      const errors = [];

      for (const accountData of accounts) {
        try {
          // 检查用户名是否已存在
          const existingAccount = await Account.findOne({
            where: { username: accountData.username }
          });

          if (existingAccount) {
            errors.push({
              username: accountData.username,
              error: 'Username already exists'
            });
            continue;
          }

          const account = await Account.create({
            ...accountData,
            userId: req.user!.id,
            status: 'inactive'
          });

          createdAccounts.push(account);
        } catch (error) {
          errors.push({
            username: accountData.username,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        data: {
          created: createdAccounts.length,
          errors: errors.length,
          accounts: createdAccounts,
          importErrors: errors
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量更新账号状态
  async batchUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountIds, status } = req.body;

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        throw createError('Account IDs array is required', 400);
      }

      const [updatedCount] = await Account.update(
        { status },
        {
          where: {
            id: { [Op.in]: accountIds }
          }
        }
      );

      res.json({
        success: true,
        data: {
          updatedCount,
          message: `${updatedCount} accounts updated`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量删除账号
  async batchDeleteAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountIds } = req.body;

      if (!Array.isArray(accountIds) || accountIds.length === 0) {
        throw createError('Account IDs array is required', 400);
      }

      const deletedCount = await Account.destroy({
        where: {
          id: { [Op.in]: accountIds }
        }
      });

      res.json({
        success: true,
        data: {
          deletedCount,
          message: `${deletedCount} accounts deleted`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取账号内容列表
  async getAccountContents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        limit = 10,
        status,
        contentType 
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      const where: any = { accountId: id };
      
      if (status) {
        where.status = status;
      }

      const { count, rows } = await ContentPublish.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Content,
            where: contentType ? { contentType } : {},
            attributes: ['id', 'title', 'contentType', 'category', 'publishStatus', 'createdAt']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          contents: rows,
          pagination: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / Number(limit)),
            limit: Number(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取账号统计数据
  async getAccountStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      // 获取发布统计
      const publishStats = await ContentPublish.findAll({
        where: { accountId: id },
        attributes: [
          'status',
          [ContentPublish.sequelize!.fn('COUNT', '*'), 'count'],
          [ContentPublish.sequelize!.fn('SUM', ContentPublish.sequelize!.col('views')), 'totalViews'],
          [ContentPublish.sequelize!.fn('SUM', ContentPublish.sequelize!.col('likes')), 'totalLikes'],
          [ContentPublish.sequelize!.fn('SUM', ContentPublish.sequelize!.col('comments')), 'totalComments']
        ],
        group: ['status'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          account: {
            id: account.id,
            nickname: account.nickname,
            username: account.username,
            followersCount: account.followersCount,
            followingCount: account.followingCount,
            likesCount: account.likesCount,
            notesCount: account.notesCount
          },
          publishStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新账号统计数据
  async updateAccountStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { followersCount, followingCount, likesCount, notesCount } = req.body;

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      await account.update({
        followersCount: followersCount || account.followersCount,
        followingCount: followingCount || account.followingCount,
        likesCount: likesCount || account.likesCount,
        notesCount: notesCount || account.notesCount,
        lastActiveTime: new Date()
      });

      res.json({
        success: true,
        data: { account }
      });
    } catch (error) {
      next(error);
    }
  }

  // 验证账号登录状态
  async verifyAccountLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const account = await Account.findByPk(id);
      if (!account) {
        throw createError('Account not found', 404);
      }

      // TODO: 实现实际的登录验证逻辑
      // 这里可以调用小红书API验证cookies是否有效

      const isValid = true; // 模拟验证结果

      if (isValid) {
        account.lastActiveTime = new Date();
        await account.save();
      }

      res.json({
        success: true,
        data: {
          accountId: account.id,
          isValid,
          lastActiveTime: account.lastActiveTime
        }
      });
    } catch (error) {
      next(error);
    }
  }
}