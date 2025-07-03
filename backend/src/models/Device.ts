import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Account } from './Account';

interface DeviceAttributes {
  id: number;
  userId: number;
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  phone?: string;
  cardHolder?: string;
  serialNumber?: string;
  boundAccountId?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DeviceCreationAttributes extends Optional<DeviceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'phone' | 'cardHolder' | 'serialNumber' | 'boundAccountId'> {}

export class Device extends Model<DeviceAttributes, DeviceCreationAttributes> implements DeviceAttributes {
  public id!: number;
  public userId!: number;
  public status!: 'running' | 'stopped' | 'error' | 'maintenance';
  public phone?: string;
  public cardHolder?: string;
  public serialNumber?: string;
  public boundAccountId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Device.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '设备ID'
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
  status: {
    type: DataTypes.ENUM('running', 'stopped', 'error', 'maintenance'),
    defaultValue: 'stopped',
    comment: '设备状态'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  cardHolder: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '持卡人'
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: '序列号'
  },
  boundAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Account,
      key: 'id'
    },
    comment: '绑定账号ID'
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
  modelName: 'Device',
  tableName: 'devices',
  comment: '设备表',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['boundAccountId']
    }
  ]
});

// 关联关系
Device.belongsTo(User, { foreignKey: 'userId' });
Device.belongsTo(Account, { foreignKey: 'boundAccountId' });