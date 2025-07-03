import express from 'express';
import { DeviceController } from '../controllers/DeviceController';
// import { authenticate, checkPermission } from '../middleware/auth';

const router = express.Router();
const deviceController = new DeviceController();

// 临时简化认证 - 只为了测试功能
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 1 }; // 模拟用户ID
  next();
};

// 设备管理路由 (暂时移除认证用于测试)
router.get('/', mockAuth, deviceController.getDevices);
router.get('/stats', mockAuth, deviceController.getDeviceStats);
router.get('/:id', deviceController.getDevice);
router.post('/', mockAuth, deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// 设备状态控制
router.post('/:id/start', deviceController.startDevice);
router.post('/:id/stop', deviceController.stopDevice);
router.post('/:id/restart', deviceController.restartDevice);

// 账号绑定管理
router.post('/:id/bind', deviceController.bindAccount);
router.post('/:id/unbind', deviceController.unbindAccount);

// 批量操作
router.post('/batch', deviceController.batchOperation);

export { router as deviceRoutes };