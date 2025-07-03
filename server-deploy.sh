#!/bin/bash

# 小红书管理系统一键部署脚本
# 在服务器上运行此脚本

echo "=========================================="
echo "小红书管理系统部署脚本"
echo "服务器: 8.140.135.115"
echo "=========================================="

# 1. 更新系统
echo "更新系统软件包..."
apt update && apt upgrade -y

# 2. 安装必要工具
echo "安装必要工具..."
apt install -y curl wget git vim ufw

# 3. 安装 Node.js 18
echo "安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 4. 安装 PM2
echo "安装 PM2 进程管理器..."
npm install -g pm2

# 5. 停止可能存在的旧服务
echo "停止旧服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 6. 创建项目目录
echo "创建项目目录..."
mkdir -p /opt
cd /opt

# 删除旧项目
rm -rf xiaohongshu-management-system

# 7. 克隆项目
echo "克隆项目..."
git clone https://github.com/huyanrui787/xiaohongshu-management-system.git
cd xiaohongshu-management-system

# 8. 部署后端
echo "部署后端服务..."
cd backend

# 安装依赖
npm install --production

# 创建环境配置文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=5002
FRONTEND_URL=http://8.140.135.115

# SQLite 数据库配置
DB_TYPE=sqlite
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
DB_NAME=xiaohongshu_management

# JWT 配置
JWT_SECRET=xiaohongshu-jwt-secret-key-2024
JWT_EXPIRE=7d

# API 配置
CLAUDE_API_KEY=your-claude-api-key-here
PROXY_POOL_URL=http://your-proxy-pool-api
EOF

# 构建后端
npm run build

# 启动后端服务
pm2 start dist/index.js --name "xiaohongshu-backend" --log-date-format 'YYYY-MM-DD HH:mm:ss'

# 9. 部署前端
echo "部署前端..."
cd ../frontend

# 安装依赖
npm install

# 创建生产环境配置
cat > .env.production << 'EOF'
VITE_API_BASE_URL=http://8.140.135.115:5002/api
EOF

# 构建前端
npm run build

# 10. 安装和配置 Nginx
echo "安装配置 Nginx..."
apt install -y nginx

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default

# 创建新的 Nginx 配置
cat > /etc/nginx/sites-available/xiaohongshu << 'EOF'
server {
    listen 80;
    server_name 8.140.135.115 _;
    
    # 前端静态文件
    location / {
        root /opt/xiaohongshu-management-system/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }
    
    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/xiaohongshu /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

# 11. 配置防火墙
echo "配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 5002/tcp
ufw --force enable

# 12. 设置开机自启
echo "设置服务自启动..."
pm2 startup systemd -u root --hp /root
pm2 save

# 13. 检查服务状态
echo "检查服务状态..."
echo "=========================================="
echo "PM2 服务状态:"
pm2 status

echo "=========================================="
echo "Nginx 服务状态:"
systemctl status nginx --no-pager -l

echo "=========================================="
echo "防火墙状态:"
ufw status

echo "=========================================="
echo "端口监听状态:"
netstat -tlnp | grep -E ':80|:5002'

echo "=========================================="
echo "部署完成!"
echo "前端访问地址: http://8.140.135.115"
echo "后端API地址: http://8.140.135.115:5002/api"
echo "健康检查: http://8.140.135.115:5002/health"
echo "=========================================="

echo "常用管理命令:"
echo "查看服务状态: pm2 status"
echo "查看日志: pm2 logs xiaohongshu-backend"
echo "重启服务: pm2 restart xiaohongshu-backend"
echo "重启Nginx: systemctl restart nginx"
echo "=========================================="

# 14. 最后测试
echo "测试服务..."
sleep 3
curl -s http://localhost:5002/health || echo "后端服务启动中..."
curl -s http://localhost/ | head -n 10 || echo "前端服务启动中..."

echo "部署脚本执行完成!"