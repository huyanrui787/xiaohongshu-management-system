import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite数据库连接成功');
    
    // 同步数据库表结构 (force: false, alter: false 避免复杂的表结构修改)
    await sequelize.sync({ force: false, alter: false });
    console.log('数据库表同步成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};