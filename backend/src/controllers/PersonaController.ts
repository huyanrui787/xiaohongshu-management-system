import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Persona } from '../models/Persona';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class PersonaController {
  // 获取人设列表
  async getPersonas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        platform,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = { userId: req.user!.id };

      if (platform) {
        where.platform = platform;
      }

      if (category) {
        where.category = category;
      }

      if (search) {
        where[Op.or] = [
          { nickname: { [Op.like]: `%${search}%` } },
          { brief: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Persona.findAndCountAll({
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
          personas: rows,
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

  // 获取单个人设详情
  async getPersona(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const persona = await Persona.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'username', 'email']
          }
        ]
      });

      if (!persona) {
        throw createError('Persona not found', 404);
      }

      res.json({
        success: true,
        data: { persona }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建人设
  async createPersona(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        nickname,
        avatar,
        brief,
        description,
        platform = 'xiaohongshu',
        category
      } = req.body;

      if (!nickname) {
        throw createError('Nickname is required', 400);
      }

      if (!brief) {
        throw createError('Brief is required', 400);
      }

      if (!description) {
        throw createError('Description is required', 400);
      }

      if (!category) {
        throw createError('Category is required', 400);
      }

      const persona = await Persona.create({
        userId: req.user!.id,
        nickname,
        avatar,
        brief,
        description,
        platform,
        category
      });

      res.status(201).json({
        success: true,
        data: { persona }
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新人设
  async updatePersona(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const persona = await Persona.findByPk(id);
      if (!persona) {
        throw createError('Persona not found', 404);
      }

      await persona.update(updateData);

      res.json({
        success: true,
        data: { persona }
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除人设
  async deletePersona(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const persona = await Persona.findByPk(id);
      if (!persona) {
        throw createError('Persona not found', 404);
      }

      await persona.destroy();

      res.json({
        success: true,
        message: 'Persona deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 复制人设
  async duplicatePersona(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const originalPersona = await Persona.findByPk(id);
      if (!originalPersona) {
        throw createError('Persona not found', 404);
      }

      const duplicatedPersona = await Persona.create({
        userId: originalPersona.userId,
        nickname: `${originalPersona.nickname} (复制)`,
        avatar: originalPersona.avatar,
        brief: originalPersona.brief,
        description: originalPersona.description,
        platform: originalPersona.platform,
        category: originalPersona.category
      });

      res.status(201).json({
        success: true,
        data: { persona: duplicatedPersona }
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量操作人设
  async batchOperation(req: Request, res: Response, next: NextFunction) {
    try {
      const { personaIds, operation, data } = req.body;

      if (!Array.isArray(personaIds) || personaIds.length === 0) {
        throw createError('Persona IDs array is required', 400);
      }

      let result;

      switch (operation) {
        case 'delete':
          result = await Persona.destroy({
            where: { id: { [Op.in]: personaIds } }
          });
          break;

        case 'updateCategory':
          const [updatedCount] = await Persona.update(
            { category: data.category },
            { where: { id: { [Op.in]: personaIds } } }
          );
          result = updatedCount;
          break;

        case 'updatePlatform':
          const [platformUpdatedCount] = await Persona.update(
            { platform: data.platform },
            { where: { id: { [Op.in]: personaIds } } }
          );
          result = platformUpdatedCount;
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

  // 获取人设统计
  async getPersonaStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      // 获取平台统计
      const platformStats = await Persona.findAll({
        where: { userId },
        attributes: [
          'platform',
          [Persona.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['platform'],
        raw: true
      });

      // 获取分类统计
      const categoryStats = await Persona.findAll({
        where: { userId },
        attributes: [
          'category',
          [Persona.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['category'],
        raw: true
      });

      // 获取总数
      const totalCount = await Persona.count({
        where: { userId }
      });

      res.json({
        success: true,
        data: {
          totalCount,
          platformStats,
          categoryStats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 生成AI人设
  async generatePersona(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { 
        category,
        platform = 'xiaohongshu',
        style,
        targetAudience,
        characteristics
      } = req.body;

      if (!category) {
        throw createError('Category is required', 400);
      }

      // TODO: 集成AI服务生成人设
      // 这里是模拟生成的人设
      const generatedPersona = {
        nickname: `AI生成${category}达人`,
        brief: `专注${category}领域的内容创作者`,
        description: `我是一个专业的${category}内容创作者，擅长为${targetAudience}受众创作${style}风格的内容。我的特点包括：${characteristics?.join('、') || '专业、有趣、实用'}。`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${category}`
      };

      const persona = await Persona.create({
        userId: req.user!.id,
        nickname: generatedPersona.nickname,
        avatar: generatedPersona.avatar,
        brief: generatedPersona.brief,
        description: generatedPersona.description,
        platform,
        category
      });

      res.status(201).json({
        success: true,
        data: { persona }
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取人设模板
  async getPersonaTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { platform = 'xiaohongshu', category } = req.query;

      // 预定义的人设模板
      const templates = [
        {
          id: 'beauty-expert',
          nickname: '美妆达人',
          brief: '专业美妆博主，分享护肤化妆技巧',
          description: '我是一位有着5年美妆经验的博主，专注于分享平价好物和实用妆容教程。喜欢尝试新产品，为大家提供真实的使用体验。',
          category: '美妆',
          platform: 'xiaohongshu',
          tags: ['护肤', '化妆', '好物推荐']
        },
        {
          id: 'fashion-blogger',
          nickname: '穿搭博主',
          brief: '时尚穿搭达人，分享搭配灵感',
          description: '热爱时尚的穿搭博主，擅长平价搭配和vintage风格。每天分享不同场合的穿搭灵感，让每个人都能找到适合自己的风格。',
          category: '穿搭',
          platform: 'xiaohongshu',
          tags: ['穿搭', '时尚', '搭配']
        },
        {
          id: 'food-lover',
          nickname: '美食探店家',
          brief: '美食博主，探索城市美味',
          description: '资深美食爱好者，走遍城市的每一个角落寻找美味。从街边小吃到高端餐厅，为大家发现值得品尝的好味道。',
          category: '美食',
          platform: 'xiaohongshu',
          tags: ['美食', '探店', '餐厅推荐']
        },
        {
          id: 'travel-blogger',
          nickname: '旅行达人',
          brief: '旅行博主，分享旅行攻略',
          description: '热爱旅行的自由行达人，足迹遍布世界各地。专注于分享实用的旅行攻略、景点推荐和旅行小贴士。',
          category: '旅行',
          platform: 'xiaohongshu',
          tags: ['旅行', '攻略', '景点推荐']
        },
        {
          id: 'fitness-coach',
          nickname: '健身教练',
          brief: '健身达人，分享运动健康知识',
          description: '国家级健身教练，专注于分享科学的健身方法和营养知识。帮助大家建立健康的生活方式，收获更好的身材。',
          category: '健身',
          platform: 'xiaohongshu',
          tags: ['健身', '运动', '健康']
        }
      ];

      let filteredTemplates = templates;

      if (platform && platform !== 'all') {
        filteredTemplates = filteredTemplates.filter(t => t.platform === platform);
      }

      if (category) {
        filteredTemplates = filteredTemplates.filter(t => 
          t.category.toLowerCase().includes(category.toString().toLowerCase())
        );
      }

      res.json({
        success: true,
        data: { templates: filteredTemplates }
      });
    } catch (error) {
      next(error);
    }
  }

  // 从模板创建人设
  async createFromTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { templateId, customizations } = req.body;

      if (!templateId) {
        throw createError('Template ID is required', 400);
      }

      // 获取模板（这里简化处理，实际应该从数据库或配置文件获取）
      const templateMap = {
        'beauty-expert': {
          nickname: '美妆达人',
          brief: '专业美妆博主，分享护肤化妆技巧',
          description: '我是一位有着5年美妆经验的博主，专注于分享平价好物和实用妆容教程。',
          category: '美妆',
          platform: 'xiaohongshu'
        },
        'fashion-blogger': {
          nickname: '穿搭博主',
          brief: '时尚穿搭达人，分享搭配灵感',
          description: '热爱时尚的穿搭博主，擅长平价搭配和vintage风格。',
          category: '穿搭',
          platform: 'xiaohongshu'
        }
        // ... 其他模板
      };

      const template = templateMap[templateId as keyof typeof templateMap];
      if (!template) {
        throw createError('Template not found', 404);
      }

      // 应用自定义修改
      const personaData = {
        ...template,
        ...customizations,
        userId: req.user!.id
      };

      const persona = await Persona.create(personaData);

      res.status(201).json({
        success: true,
        data: { persona }
      });
    } catch (error) {
      next(error);
    }
  }
}