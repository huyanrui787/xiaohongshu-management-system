#!/bin/bash
# 一键部署命令 - 复制整个内容到服务器终端执行

apt update && apt install -y curl git && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs && npm install -g pm2 && cd /opt && rm -rf xiaohongshu-management-system && git clone https://github.com/huyanrui787/xiaohongshu-management-system.git && cd xiaohongshu-management-system/backend && npm install --production && echo 'NODE_ENV=production
PORT=5002
FRONTEND_URL=http://8.140.135.115
DB_TYPE=sqlite
JWT_SECRET=xiaohongshu-jwt-secret-key-2024
JWT_EXPIRE=7d' > .env && npm run build && pm2 delete xiaohongshu-backend 2>/dev/null || true && pm2 start dist/index.js --name "xiaohongshu-backend" && cd ../frontend && npm install && echo 'VITE_API_BASE_URL=http://8.140.135.115:5002/api' > .env.production && npm run build && apt install -y nginx && rm -f /etc/nginx/sites-enabled/default && echo 'server {
    listen 80;
    server_name 8.140.135.115 _;
    location / {
        root /opt/xiaohongshu-management-system/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    location /health {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}' > /etc/nginx/sites-available/xiaohongshu && ln -sf /etc/nginx/sites-available/xiaohongshu /etc/nginx/sites-enabled/ && nginx -t && systemctl restart nginx && systemctl enable nginx && ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 5002/tcp && ufw --force enable && pm2 startup systemd -u root --hp /root && pm2 save && echo "部署完成！访问 http://8.140.135.115"