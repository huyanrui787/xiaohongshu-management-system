import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Account } from './Account';

interface AnalyticsSummaryAttributes {
  id: number;
  userId: number;
  accountId?: number;
  type: 'trend' | 'competitor' | 'audience' | 'performance' | 'keyword';
  title: string;
  summary?: string;
  status: 'pending' | 'completed' | 'failed';
  mongoDataId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalyticsSummaryCreationAttributes extends Optional<AnalyticsSummaryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'accountId' | 'summary' | 'mongoDataId'> {}

export class AnalyticsSummary extends Model<AnalyticsSummaryAttributes, AnalyticsSummaryCreationAttributes> implements AnalyticsSummaryAttributes {
  public id!: number;
  public userId!: number;
  public accountId?: number;
  public type!: 'trend' | 'competitor' | 'audience' | 'performance' | 'keyword';
  public title!: string;
  public summary?: string;
  public status!: 'pending' | 'completed' | 'failed';
  public mongoDataId?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AnalyticsSummary.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '分析摘要ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Account,
      key: 'id'
    },
    comment: '账号ID（可选）'
  },
  type: {
    type: DataTypes.ENUM('trend', 'competitor', 'audience', 'performance', 'keyword'),
    allowNull: false,
    comment: '分析类型'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '分析标题'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分析摘要'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
    comment: '分析状态'
  },
  mongoDataId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'MongoDB数据ID（详细数据存储在MongoDB）'
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
  modelName: 'AnalyticsSummary',
  tableName: 'analytics_summary',
  comment: '分析数据摘要表',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['accountId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// 关联关系
AnalyticsSummary.belongsTo(User, { foreignKey: 'userId' });
AnalyticsSummary.belongsTo(Account, { foreignKey: 'accountId' });