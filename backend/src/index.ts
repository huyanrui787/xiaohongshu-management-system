import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
// import { authRoutes } from './routes/auth';
import { accountRoutes } from './routes/account';
// import { contentRoutes } from './routes/content';
// import { taskRoutes } from './routes/task';
import { deviceRoutes } from './routes/device';
import { personaRoutes } from './routes/persona';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由注册 (暂时只启用部分路由)
// app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
// app.use('/api/content', contentRoutes);
// app.use('/api/tasks', taskRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/personas', personaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// 先启动服务器，数据库连接失败不影响基础功能
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// 异步连接SQLite数据库
connectDB()
  .then(() => {
    console.log('SQLite数据库连接成功');
  })
  .catch((error) => {
    console.error('SQLite数据库连接失败:', error);
    console.log('Server running without database connection');
  });

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io };