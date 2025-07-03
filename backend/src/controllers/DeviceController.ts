import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Device } from '../models/Device';
import { Account } from '../models/Account';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class DeviceController {
  // 获取设备列表
  async getDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { userId: req.user!.id };

      if (status) {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { serialNumber: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { cardHolder: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Device.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [[sortBy as string, sortOrder as string]],
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          },
          {
            model: Account,
            attributes: ['id', 'nickname', 'username', 'platform'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: {
          devices: rows,
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

  // 获取单个设备详情
  async getDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          },
          {
            model: Account,
            attributes: ['id', 'nickname', 'username', 'platform'],
            required: false
          }
        ]
      });

      if (!device) {
        throw createError('Device not found', 404);
      }

      res.json({
        success: true,
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建设备
  async createDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        phone,
        cardHolder,
        serialNumber,
        boundAccountId
      } = req.body;

      // 检查序列号是否已存在
      if (serialNumber) {
        const existingDevice = await Device.findOne({
          where: { serialNumber }
        });

        if (existingDevice) {
          throw createError('Serial number already exists', 400);
        }
      }

      // 如果指定了绑定账号，验证账号是否存在
      if (boundAccountId) {
        const account = await Account.findByPk(boundAccountId);
        if (!account) {
          throw createError('Account not found', 400);
        }
      }

      const device = await Device.create({
        userId: req.user!.id,
        phone,
        cardHolder,
        serialNumber,
        boundAccountId,
        status: 'stopped'
      });

      res.status(201).json({
        success: true,
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新设备
  async updateDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      // 如果要更新序列号，检查是否已存在
      if (updateData.serialNumber && updateData.serialNumber !== device.serialNumber) {
        const existingDevice = await Device.findOne({
          where: { 
            serialNumber: updateData.serialNumber,
            id: { [Op.ne]: id }
          }
        });

        if (existingDevice) {
          throw createError('Serial number already exists', 400);
        }
      }

      // 如果要更新绑定账号，验证账号是否存在
      if (updateData.boundAccountId && updateData.boundAccountId !== device.boundAccountId) {
        const account = await Account.findByPk(updateData.boundAccountId);
        if (!account) {
          throw createError('Account not found', 400);
        }
      }

      await device.update(updateData);

      res.json({
        success: true,
        data: { device }
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除设备
  async deleteDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      await device.destroy();

      res.json({
        success: true,
        message: 'Device deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 启动设备
  async startDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      if (device.status === 'running') {
        throw createError('Device is already running', 400);
      }

      await device.update({ status: 'running' });

      res.json({
        success: true,
        data: { device },
        message: 'Device started successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 停止设备
  async stopDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      if (device.status === 'stopped') {
        throw createError('Device is already stopped', 400);
      }

      await device.update({ status: 'stopped' });

      res.json({
        success: true,
        data: { device },
        message: 'Device stopped successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 重启设备
  async restartDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      // 设置为维护状态，然后重启
      await device.update({ status: 'maintenance' });
      
      // 模拟重启过程
      setTimeout(async () => {
        await device.update({ status: 'running' });
      }, 3000);

      res.json({
        success: true,
        data: { device },
        message: 'Device restart initiated'
      });
    } catch (error) {
      next(error);
    }
  }

  // 绑定账号到设备
  async bindAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { accountId } = req.body;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      const account = await Account.findByPk(accountId);
      if (!account) {
        throw createError('Account not found', 404);
      }

      // 检查账号是否已经绑定到其他设备
      const existingBinding = await Device.findOne({
        where: { 
          boundAccountId: accountId,
          id: { [Op.ne]: id }
        }
      });

      if (existingBinding) {
        throw createError('Account is already bound to another device', 400);
      }

      await device.update({ boundAccountId: accountId });

      const updatedDevice = await Device.findByPk(id, {
        include: [
          {
            model: Account,
            attributes: ['id', 'nickname', 'username', 'platform']
          }
        ]
      });

      res.json({
        success: true,
        data: { device: updatedDevice },
        message: 'Account bound to device successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 解绑设备账号
  async unbindAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const device = await Device.findByPk(id);
      if (!device) {
        throw createError('Device not found', 404);
      }

      if (!device.boundAccountId) {
        throw createError('Device has no bound account', 400);
      }

      await device.update({ boundAccountId: undefined });

      res.json({
        success: true,
        data: { device },
        message: 'Account unbound from device successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量操作设备
  async batchOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { deviceIds, operation, data } = req.body;

      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        throw createError('Device IDs array is required', 400);
      }

      let result;

      switch (operation) {
        case 'delete':
          result = await Device.destroy({
            where: { id: { [Op.in]: deviceIds } }
          });
          break;

        case 'updateStatus':
          const [updatedCount] = await Device.update(
            { status: data.status },
            { where: { id: { [Op.in]: deviceIds } } }
          );
          result = updatedCount;
          break;

        case 'start':
          const [startedCount] = await Device.update(
            { status: 'running' },
            { 
              where: { 
                id: { [Op.in]: deviceIds },
                status: { [Op.ne]: 'running' }
              } 
            }
          );
          result = startedCount;
          break;

        case 'stop':
          const [stoppedCount] = await Device.update(
            { status: 'stopped' },
            { 
              where: { 
                id: { [Op.in]: deviceIds },
                status: { [Op.ne]: 'stopped' }
              } 
            }
          );
          result = stoppedCount;
          break;

        default:
          throw createError('Invalid operation', 400);
      }

      res.json({
        success: true,
        data: {
          operation,
          affectedCount: result,
          message: `${operation} completed for ${result} items`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取设备统计
  async getDeviceStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // 获取设备状态统计
      const statusStats = await Device.findAll({
        where: { userId },
        attributes: [
          'status',
          [Device.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // 获取绑定状态统计
      const bindingStats = await Device.findAll({
        where: { userId },
        attributes: [
          [Device.sequelize!.fn('COUNT', '*'), 'total'],
          [Device.sequelize!.fn('COUNT', Device.sequelize!.col('boundAccountId')), 'bound'],
          [Device.sequelize!.fn('COUNT', Device.sequelize!.literal('CASE WHEN boundAccountId IS NULL THEN 1 END')), 'unbound']
        ],
        raw: true
      });

      res.json({
        success: true,
        data: {
          statusStats,
          bindingStats: bindingStats[0] || {}
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取可用账号列表（用于绑定）
  async getAvailableAccounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // 获取未绑定到任何设备的账号
      const boundAccountIds = await Device.findAll({
        attributes: ['boundAccountId'],
        where: {
          boundAccountId: { [Op.ne]: undefined }
        },
        raw: true
      }).then(devices => devices.map(d => d.boundAccountId).filter(Boolean));

      const whereClause: any = { 
        userId: req.user!.id,
        status: 'active'
      };

      if (boundAccountIds.length > 0) {
        whereClause.id = { [Op.notIn]: boundAccountIds };
      }

      const accounts = await Account.findAll({
        where: whereClause,
        attributes: ['id', 'nickname', 'username', 'platform'],
        order: [['nickname', 'ASC']]
      });

      res.json({
        success: true,
        data: { accounts }
      });
    } catch (error) {
      next(error);
    }
  }
}