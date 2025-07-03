import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Task } from './Task';

interface TaskLogAttributes {
  id: number;
  taskId: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  createdAt: Date;
}

interface TaskLogCreationAttributes extends Optional<TaskLogAttributes, 'id' | 'createdAt'> {}

export class TaskLog extends Model<TaskLogAttributes, TaskLogCreationAttributes> implements TaskLogAttributes {
  public id!: number;
  public taskId!: number;
  public level!: 'info' | 'warn' | 'error';
  public message!: string;
  public readonly createdAt!: Date;
}

TaskLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '日志ID'
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: 'id'
    },
    comment: '任务ID'
  },
  level: {
    type: DataTypes.ENUM('info', 'warn', 'error'),
    allowNull: false,
    comment: '日志级别'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '日志消息'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'TaskLog',
  tableName: 'task_logs',
  comment: '任务日志表',
  timestamps: false,
  indexes: [
    {
      fields: ['taskId']
    },
    {
      fields: ['level']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// 关联关系
TaskLog.belongsTo(Task, { foreignKey: 'taskId' });
Task.hasMany(TaskLog, { foreignKey: 'taskId' });