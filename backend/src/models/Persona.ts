import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface PersonaAttributes {
  id: number;
  userId: number;
  nickname: string;
  avatar?: string;
  brief: string;
  description: string;
  platform: 'xiaohongshu' | 'douyin' | 'weibo';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonaCreationAttributes extends Optional<PersonaAttributes, 'id' | 'createdAt' | 'updatedAt' | 'avatar'> {}

export class Persona extends Model<PersonaAttributes, PersonaCreationAttributes> implements PersonaAttributes {
  public id!: number;
  public userId!: number;
  public nickname!: string;
  public avatar?: string;
  public brief!: string;
  public description!: string;
  public platform!: 'xiaohongshu' | 'douyin' | 'weibo';
  public category!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Persona.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '人设ID'
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
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '人设昵称'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL'
  },
  brief: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '简介'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '详细描述'
  },
  platform: {
    type: DataTypes.ENUM('xiaohongshu', 'douyin', 'weibo'),
    defaultValue: 'xiaohongshu',
    comment: '平台'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类'
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
  modelName: 'Persona',
  tableName: 'personas',
  comment: '人设表',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['category']
    }
  ]
});

// 关联关系
Persona.belongsTo(User, { foreignKey: 'userId' });