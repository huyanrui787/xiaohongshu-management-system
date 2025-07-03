import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Content } from './Content';
import { Account } from './Account';

interface ContentPublishAttributes {
  id: number;
  contentId: number;
  accountId: number;
  status: 'pending' | 'success' | 'failed';
  publishedAt?: Date;
  postId?: string;
  postUrl?: string;
  errorMessage?: string;
  
  // 数据表现
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface ContentPublishCreationAttributes extends Optional<ContentPublishAttributes, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'postId' | 'postUrl' | 'errorMessage'> {}

export class ContentPublish extends Model<ContentPublishAttributes, ContentPublishCreationAttributes> implements ContentPublishAttributes {
  public id!: number;
  public contentId!: number;
  public accountId!: number;
  public status!: 'pending' | 'success' | 'failed';
  public publishedAt?: Date;
  public postId?: string;
  public postUrl?: string;
  public errorMessage?: string;
  public views!: number;
  public likes!: number;
  public comments!: number;
  public shares!: number;
  public saves!: number;
  public engagementRate!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ContentPublish.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '发布记录ID'
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Content,
      key: 'id'
    },
    comment: '内容ID'
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Account,
      key: 'id'
    },
    comment: '账号ID'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending',
    comment: '发布状态'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布时间'
  },
  postId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '平台文章ID'
  },
  postUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '文章链接'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览量'
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数'
  },
  shares: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '分享数'
  },
  saves: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '收藏数'
  },
  engagementRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '互动率'
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
  modelName: 'ContentPublish',
  tableName: 'content_publishes',
  comment: '内容发布记录表',
  indexes: [
    {
      fields: ['contentId']
    },
    {
      fields: ['accountId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['publishedAt']
    },
    {
      unique: true,
      fields: ['contentId', 'accountId']
    }
  ]
});

// 关联关系
ContentPublish.belongsTo(Content, { foreignKey: 'contentId' });
ContentPublish.belongsTo(Account, { foreignKey: 'accountId' });
Content.hasMany(ContentPublish, { foreignKey: 'contentId' });
Account.hasMany(ContentPublish, { foreignKey: 'accountId' });