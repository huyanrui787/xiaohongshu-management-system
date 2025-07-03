import express from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticate, checkPermission } from '../middleware/auth';

const router = express.Router();
const taskController = new TaskController();

// 任务管理路由
router.get('/', authenticate, checkPermission('task:read'), taskController.getTasks);
router.get('/stats', authenticate, checkPermission('task:read'), taskController.getTaskStats);
router.get('/:id', authenticate, checkPermission('task:read'), taskController.getTask);
router.post('/', authenticate, checkPermission('task:create'), taskController.createTask);
router.put('/:id', authenticate, checkPermission('task:update'), taskController.updateTask);
router.delete('/:id', authenticate, checkPermission('task:delete'), taskController.deleteTask);

// 任务执行控制
router.post('/:id/execute', authenticate, checkPermission('task:execute'), taskController.executeTask);
router.post('/:id/pause', authenticate, checkPermission('task:execute'), taskController.pauseTask);
router.post('/:id/resume', authenticate, checkPermission('task:execute'), taskController.resumeTask);
router.post('/:id/stop', authenticate, checkPermission('task:execute'), taskController.stopTask);

// 任务日志
router.get('/:id/logs', authenticate, checkPermission('task:read'), taskController.getTaskLogs);

// 批量操作
router.post('/batch', authenticate, checkPermission('task:update'), taskController.batchOperation);

export { router as taskRoutes };