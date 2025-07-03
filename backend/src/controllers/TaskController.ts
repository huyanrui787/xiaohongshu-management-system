import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Task } from '../models/Task';
import { TaskLog } from '../models/TaskLog';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class TaskController {
  // 获取任务列表
  async getTasks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { userId: req.user!.id };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.name = { [Op.like]: `%${search}%` };
      }

      const { count, rows } = await Task.findAndCountAll({
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
          tasks: rows,
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

  // 获取单个任务详情
  async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!task) {
        throw createError('Task not found', 404);
      }

      res.json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建任务
  async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        name,
        type,
        config,
        scheduleConfig,
        maxRetries = 3,
        retryDelay = 60
      } = req.body;

      if (!['create', 'publish', 'decoration'].includes(type)) {
        throw createError('Invalid task type', 400);
      }

      const task = await Task.create({
        userId: req.user!.id,
        name,
        type,
        config,
        scheduleConfig,
        maxRetries,
        retryDelay,
        status: 'pending',
        progressCurrent: 0,
        progressTotal: 0,
        progressPercentage: 0,
        progressMessage: '任务已创建',
        currentRetries: 0
      });

      res.status(201).json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新任务
  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      await task.update(updateData);

      res.json({
        success: true,
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除任务
  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      await task.destroy();

      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 执行任务
  async executeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      if (task.status === 'running') {
        throw createError('Task is already running', 400);
      }

      // 更新任务状态为运行中
      await task.update({
        status: 'running',
        startTime: new Date(),
        progressMessage: '任务开始执行',
        progressCurrent: 0,
        progressPercentage: 0
      });

      // 记录任务日志
      await TaskLog.create({
        taskId: task.id,
        level: 'info',
        message: '任务开始执行'
      });

      // TODO: 这里应该实现实际的任务执行逻辑
      // 根据任务类型调用不同的服务
      switch (task.type) {
        case 'create':
          await this.executeCreateTask(task);
          break;
        case 'publish':
          await this.executePublishTask(task);
          break;
        case 'decoration':
          await this.executeDecorationTask(task);
          break;
        default:
          throw createError('Unsupported task type', 400);
      }

      res.json({
        success: true,
        data: { task },
        message: 'Task execution started'
      });
    } catch (error) {
      // 如果执行失败，更新任务状态
      const task = await Task.findByPk(req.params.id);
      if (task) {
        await task.update({
          status: 'failed',
          endTime: new Date(),
          resultSuccess: false,
          resultError: error instanceof Error ? error.message : 'Unknown error'
        });

        await TaskLog.create({
          taskId: task.id,
          level: 'error',
          message: `任务执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      next(error);
    }
  }

  // 暂停任务
  async pauseTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      if (task.status !== 'running') {
        throw createError('Task is not running', 400);
      }

      await task.update({
        status: 'paused',
        progressMessage: '任务已暂停'
      });

      await TaskLog.create({
        taskId: task.id,
        level: 'info',
        message: '任务已暂停'
      });

      res.json({
        success: true,
        data: { task },
        message: 'Task paused successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 恢复任务
  async resumeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      if (task.status !== 'paused') {
        throw createError('Task is not paused', 400);
      }

      await task.update({
        status: 'running',
        progressMessage: '任务已恢复'
      });

      await TaskLog.create({
        taskId: task.id,
        level: 'info',
        message: '任务已恢复'
      });

      res.json({
        success: true,
        data: { task },
        message: 'Task resumed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 停止任务
  async stopTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      if (!['running', 'paused'].includes(task.status)) {
        throw createError('Task cannot be stopped', 400);
      }

      await task.update({
        status: 'failed',
        endTime: new Date(),
        progressMessage: '任务已停止',
        resultSuccess: false,
        resultError: '任务被手动停止'
      });

      await TaskLog.create({
        taskId: task.id,
        level: 'info',
        message: '任务被手动停止'
      });

      res.json({
        success: true,
        data: { task },
        message: 'Task stopped successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取任务日志
  async getTaskLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, level } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const task = await Task.findByPk(id);
      if (!task) {
        throw createError('Task not found', 404);
      }

      const where: any = { taskId: id };
      if (level) {
        where.level = level;
      }

      const { count, rows } = await TaskLog.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          logs: rows,
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

  // 批量操作任务
  async batchOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskIds, operation } = req.body;

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw createError('Task IDs array is required', 400);
      }

      let result;

      switch (operation) {
        case 'delete':
          result = await Task.destroy({
            where: { id: { [Op.in]: taskIds } }
          });
          break;

        case 'pause':
          const [pausedCount] = await Task.update(
            { status: 'paused' },
            { 
              where: { 
                id: { [Op.in]: taskIds },
                status: 'running'
              } 
            }
          );
          result = pausedCount;
          break;

        case 'stop':
          const [stoppedCount] = await Task.update(
            { 
              status: 'failed',
              endTime: new Date(),
              resultSuccess: false,
              resultError: '批量停止操作'
            },
            { 
              where: { 
                id: { [Op.in]: taskIds },
                status: { [Op.in]: ['running', 'paused'] }
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

  // 获取任务统计
  async getTaskStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // 获取任务状态统计
      const statusStats = await Task.findAll({
        where: { userId },
        attributes: [
          'status',
          [Task.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // 获取任务类型统计
      const typeStats = await Task.findAll({
        where: { userId },
        attributes: [
          'type',
          [Task.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['type'],
        raw: true
      });

      // 获取今日任务统计
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStats = await Task.findAll({
        where: {
          userId,
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        attributes: [
          'status',
          [Task.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['status'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          statusStats,
          typeStats,
          todayStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 私有方法：执行创作任务
  private async executeCreateTask(task: Task) {
    // TODO: 实现创作任务逻辑
    await this.simulateTaskExecution(task, '内容创作');
  }

  // 私有方法：执行发布任务
  private async executePublishTask(task: Task) {
    // TODO: 实现发布任务逻辑
    await this.simulateTaskExecution(task, '内容发布');
  }

  // 私有方法：执行装修任务
  private async executeDecorationTask(task: Task) {
    // TODO: 实现装修任务逻辑
    await this.simulateTaskExecution(task, '账号装修');
  }

  // 私有方法：模拟任务执行
  private async simulateTaskExecution(task: Task, taskTypeName: string) {
    const steps = 5;
    const stepDuration = 2000; // 每步2秒

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      
      const progress = Math.round((i / steps) * 100);
      const message = `${taskTypeName}进度: ${i}/${steps}`;

      await task.update({
        progressCurrent: i,
        progressTotal: steps,
        progressPercentage: progress,
        progressMessage: message
      });

      await TaskLog.create({
        taskId: task.id,
        level: 'info',
        message
      });
    }

    // 任务完成
    await task.update({
      status: 'completed',
      endTime: new Date(),
      duration: task.startTime ? (Date.now() - task.startTime.getTime()) / 1000 : 0,
      resultSuccess: true,
      resultData: { message: `${taskTypeName}任务执行成功` },
      progressMessage: '任务已完成'
    });

    await TaskLog.create({
      taskId: task.id,
      level: 'info',
      message: `${taskTypeName}任务执行完成`
    });
  }
}