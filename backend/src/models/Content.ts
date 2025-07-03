import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface ContentAttributes {
  id: number;
  userId: number;
  title: string;
  content: string;
  contentType: 'note' | 'video' | 'image';
  
  // 媒体文件
  images?: any;
  video?: string;
  cover?: string;
  
  // 标签和话题
  tags?: any;
  hashtags?: any;
  location?: string;
  
  // AI生成信息
  isAIGenerated: boolean;
  aiPrompt?: string;
  aiModel?: string;
  
  // 内容策略
  category: string;
  targetAudience?: any;
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'inspirational' | 'humorous';
  
  // 发布状态
  publishStatus: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledTime?: Date;
  
  // 审核状态
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface ContentCreationAttributes extends Optional<ContentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'video' | 'cover' | 'tags' | 'hashtags' | 'location' | 'aiPrompt' | 'aiModel' | 'targetAudience' | 'scheduledTime' | 'reviewNotes'> {}

export class Content extends Model<ContentAttributes, ContentCreationAttributes> implements ContentAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public content!: string;
  public contentType!: 'note' | 'video' | 'image';
  public images?: any;
  public video?: string;
  public cover?: string;
  public tags?: any;
  public hashtags?: any;
  public location?: string;
  public isAIGenerated!: boolean;
  public aiPrompt?: string;
  public aiModel?: string;
  public category!: string;
  public targetAudience?: any;
  public mood!: 'happy' | 'sad' | 'excited' | 'calm' | 'inspirational' | 'humorous';
  public publishStatus!: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  public scheduledTime?: Date;
  public reviewStatus!: 'pending' | 'approved' | 'rejected';
  public reviewNotes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Content.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '内容ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '创建用户ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '内容'
  },
  contentType: {
    type: DataTypes.ENUM('note', 'video', 'image'),
    allowNull: false,
    comment: '内容类型'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片URLs'
  },
  video: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '视频URL'
  },
  cover: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面URL'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签'
  },
  hashtags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '话题标签'
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '位置'
  },
  isAIGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否AI生成'
  },
  aiPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI提示词'
  },
  aiModel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'AI模型'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类'
  },
  targetAudience: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '目标受众'
  },
  mood: {
    type: DataTypes.ENUM('happy', 'sad', 'excited', 'calm', 'inspirational', 'humorous'),
    defaultValue: 'happy',
    comment: '情绪基调'
  },
  publishStatus: {
    type: DataTypes.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
    defaultValue: 'draft',
    comment: '发布状态'
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '计划发布时间'
  },
  reviewStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    comment: '审核状态'
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核备注'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Content',
  tableName: 'contents',
  comment: '内容表',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['contentType']
    },
    {
      fields: ['category']
    },
    {
      fields: ['publishStatus']
    },
    {
      fields: ['reviewStatus']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// 关联关系
Content.belongsTo(User, { foreignKey: 'userId' });