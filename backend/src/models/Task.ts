import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface TaskAttributes {
  id: number;
  userId: number;
  name: string;
  type: 'create' | 'publish' | 'decoration';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  
  // 任务配置
  config?: any;
  
  // 执行进度
  progressCurrent: number;
  progressTotal: number;
  progressPercentage: number;
  progressMessage: string;
  
  // 执行结果
  resultSuccess?: boolean;
  resultData?: any;
  resultError?: string;
  
  // 重试配置
  maxRetries: number;
  currentRetries: number;
  retryDelay: number;
  
  // 时间安排
  scheduleConfig?: any;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'createdAt' | 'updatedAt' | 'config' | 'resultSuccess' | 'resultData' | 'resultError' | 'scheduleConfig' | 'startTime' | 'endTime' | 'duration'> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public type!: 'create' | 'publish' | 'decoration';
  public status!: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  public config?: any;
  public progressCurrent!: number;
  public progressTotal!: number;
  public progressPercentage!: number;
  public progressMessage!: string;
  public resultSuccess?: boolean;
  public resultData?: any;
  public resultError?: string;
  public maxRetries!: number;
  public currentRetries!: number;
  public retryDelay!: number;
  public scheduleConfig?: any;
  public startTime?: Date;
  public endTime?: Date;
  public duration?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '任务ID'
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '任务名称'
  },
  type: {
    type: DataTypes.ENUM('create', 'publish', 'decoration'),
    allowNull: false,
    comment: '任务类型'
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'paused'),
    defaultValue: 'pending',
    comment: '任务状态'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '任务配置'
  },
  progressCurrent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前进度'
  },
  progressTotal: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总进度'
  },
  progressPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    comment: '进度百分比'
  },
  progressMessage: {
    type: DataTypes.STRING(500),
    defaultValue: '',
    comment: '进度消息'
  },
  resultSuccess: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: '执行成功'
  },
  resultData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '结果数据'
  },
  resultError: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: '最大重试次数'
  },
  currentRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前重试次数'
  },
  retryDelay: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: '重试延迟(秒)'
  },
  scheduleConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '计划配置'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束时间'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '执行时长(秒)'
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
  modelName: 'Task',
  tableName: 'tasks',
  comment: '任务表',
  indexes: [
    {
      fields: ['userId']
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
Task.belongsTo(User, { foreignKey: 'userId' });