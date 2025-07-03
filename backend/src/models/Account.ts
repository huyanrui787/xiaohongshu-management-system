import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface AccountAttributes {
  id: number;
  userId: number;
  nickname: string;
  username: string;
  password?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status: 'active' | 'banned' | 'restricted' | 'inactive';
  platform: 'xiaohongshu' | 'douyin' | 'weibo';
  
  // 统计信息
  followersCount: number;
  followingCount: number;
  likesCount: number;
  notesCount: number;
  
  // 登录信息
  cookies?: string;
  userAgent?: string;
  deviceInfo?: any;
  
  // 代理配置
  proxyConfig?: any;
  
  // 风控信息
  riskLevel: 'low' | 'medium' | 'high';
  lastActiveTime: Date;
  dailyActionsCount: number;
  weeklyActionsCount: number;
  monthlyActionsCount: number;
  
  // 分组和标签
  groups?: any;
  tags?: any;
  
  // 运营配置
  isAutoPublish: boolean;
  publishSchedule?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

interface AccountCreationAttributes extends Optional<AccountAttributes, 'id' | 'createdAt' | 'updatedAt' | 'password' | 'phone' | 'email' | 'avatar' | 'cookies' | 'userAgent' | 'deviceInfo' | 'proxyConfig' | 'groups' | 'tags' | 'publishSchedule'> {}

export class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  public id!: number;
  public userId!: number;
  public nickname!: string;
  public username!: string;
  public password?: string;
  public phone?: string;
  public email?: string;
  public avatar?: string;
  public status!: 'active' | 'banned' | 'restricted' | 'inactive';
  public platform!: 'xiaohongshu' | 'douyin' | 'weibo';
  public followersCount!: number;
  public followingCount!: number;
  public likesCount!: number;
  public notesCount!: number;
  public cookies?: string;
  public userAgent?: string;
  public deviceInfo?: any;
  public proxyConfig?: any;
  public riskLevel!: 'low' | 'medium' | 'high';
  public lastActiveTime!: Date;
  public dailyActionsCount!: number;
  public weeklyActionsCount!: number;
  public monthlyActionsCount!: number;
  public groups?: any;
  public tags?: any;
  public isAutoPublish!: boolean;
  public publishSchedule?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Account.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '账号ID'
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
    comment: '昵称'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '账号密码'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL'
  },
  status: {
    type: DataTypes.ENUM('active', 'banned', 'restricted', 'inactive'),
    defaultValue: 'active',
    comment: '账号状态'
  },
  platform: {
    type: DataTypes.ENUM('xiaohongshu', 'douyin', 'weibo'),
    defaultValue: 'xiaohongshu',
    comment: '平台'
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '粉丝数'
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '关注数'
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '获赞数'
  },
  notesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '笔记数'
  },
  cookies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '登录Cookie'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户代理'
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '设备信息'
  },
  proxyConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '代理配置'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'low',
    comment: '风险等级'
  },
  lastActiveTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '最后活跃时间'
  },
  dailyActionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每日操作数'
  },
  weeklyActionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每周操作数'
  },
  monthlyActionsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每月操作数'
  },
  groups: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '分组'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签'
  },
  isAutoPublish: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否自动发布'
  },
  publishSchedule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '发布计划配置'
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
  modelName: 'Account',
  tableName: 'accounts',
  comment: '小红书账号表',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['riskLevel']
    }
  ]
});

// 关联关系
Account.belongsTo(User, { foreignKey: 'userId' });