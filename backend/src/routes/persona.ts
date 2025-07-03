import express from 'express';
import { PersonaController } from '../controllers/PersonaController';
// import { authenticate, checkPermission } from '../middleware/auth';

const router = express.Router();
const personaController = new PersonaController();

// 临时简化认证 - 只为了测试功能
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 1 }; // 模拟用户ID
  next();
};

// 人设管理路由 (暂时移除认证用于测试)
router.get('/', mockAuth, personaController.getPersonas);
router.get('/stats', mockAuth, personaController.getPersonaStats);
router.get('/templates', personaController.getPersonaTemplates);
router.get('/:id', personaController.getPersona);
router.post('/', mockAuth, personaController.createPersona);
router.put('/:id', personaController.updatePersona);
router.delete('/:id', personaController.deletePersona);

// 人设复制和模板
router.post('/:id/duplicate', personaController.duplicatePersona);
router.post('/from-template', mockAuth, personaController.createFromTemplate);

// AI生成人设
router.post('/generate', mockAuth, personaController.generatePersona);

// 批量操作
router.post('/batch', personaController.batchOperation);

export { router as personaRoutes };