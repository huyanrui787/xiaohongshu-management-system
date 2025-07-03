#!/bin/bash

echo "=== 开始部署小红书管理系统 ==="

# 1. 更新系统包
echo "1. 更新系统包..."
apt update

# 2. 安装必要软件
echo "2. 安装必要软件..."
apt install -y curl wget git

# 3. 安装 Node.js 18.x
echo "3. 安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 4. 验证安装
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

# 5. 克隆项目
echo "5. 克隆项目..."
cd /opt
git clone https://github.com/huyanrui787/xiaohongshu-management-system.git
cd xiaohongshu-management-system

# 6. 部署后端
echo "6. 部署后端..."
cd backend

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env

# 修改环境变量
cat > .env << EOF
NODE_ENV=production
PORT=5002
FRONTEND_URL=http://8.140.135.115

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=123456
DB_NAME=xiaohongshu_management

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Claude API
CLAUDE_API_KEY=your-claude-api-key-here

# Proxy Settings
PROXY_POOL_URL=http://your-proxy-pool-api
EOF

# 构建项目
npm run build

# 安装 PM2 进程管理器
npm install -g pm2

# 启动后端服务
pm2 start dist/index.js --name "xiaohongshu-backend"

# 7. 部署前端
echo "7. 部署前端..."
cd ../frontend

# 安装依赖
npm install

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_BASE_URL=http://8.140.135.115:5002/api
EOF

# 构建前端
npm run build

# 8. 安装和配置 Nginx
echo "8. 安装 Nginx..."
apt install -y nginx

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/xiaohongshu << EOF
server {
    listen 80;
    server_name 8.140.135.115;

    # 前端静态文件
    location / {
        root /opt/xiaohongshu-management-system/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/xiaohongshu /etc/nginx/sites-enabled/

# 删除默认站点
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 启动 Nginx
systemctl start nginx
systemctl enable nginx

# 9. 开放防火墙端口
echo "9. 配置防火墙..."
ufw allow 80
ufw allow 5002
ufw --force enable

# 10. 设置 PM2 开机自启
echo "10. 设置服务自启动..."
pm2 startup
pm2 save

echo "=== 部署完成! ==="
echo "前端访问地址: http://8.140.135.115"
echo "后端API地址: http://8.140.135.115:5002"
echo ""
echo "查看后端服务状态: pm2 status"
echo "查看后端日志: pm2 logs xiaohongshu-backend"
echo "重启后端服务: pm2 restart xiaohongshu-backend"