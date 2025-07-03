# Coding 代码仓库配置指南

## 1. 创建Coding仓库

1. 登录 [Coding](https://coding.net/)
2. 创建新项目或进入现有项目
3. 创建新的Git仓库
4. 复制仓库地址，格式通常为：
   ```
   https://你的团队名.coding.net/p/项目名/d/仓库名/git
   ```

## 2. 配置多远程仓库

### 方案A：添加第二个远程仓库
```bash
# 添加Coding远程仓库
git remote add coding https://你的团队名.coding.net/p/项目名/d/仓库名/git

# 推送到不同平台
git push origin main      # 推送到GitHub
git push coding main      # 推送到Coding
```

### 方案B：同时推送到两个平台（推荐）
```bash
# 为origin添加多个push URL
git remote set-url --add --push origin https://你的团队名.coding.net/p/项目名/d/仓库名/git
git remote set-url --add --push origin https://github.com/huyanrui787/xiaohongshu-management-system.git

# 一次推送到两个平台
git push origin main
```

### 方案C：完全迁移到Coding
```bash
# 移除GitHub远程仓库
git remote remove origin

# 添加Coding作为新的origin
git remote add origin https://你的团队名.coding.net/p/项目名/d/仓库名/git

# 推送到Coding
git push -u origin main
```

## 3. 认证配置

### 使用个人访问令牌（推荐）
1. 在Coding中生成个人访问令牌
2. 配置Git凭据：
```bash
git config --global credential.helper store
# 首次推送时输入用户名和令牌
```

### 使用SSH密钥
1. 生成SSH密钥：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
2. 添加公钥到Coding账户
3. 使用SSH地址：
```bash
git remote add coding git@你的团队名.coding.net:项目名/仓库名.git
```

## 4. 常用命令

```bash
# 查看所有远程仓库
git remote -v

# 查看仓库状态
git status

# 推送到指定远程仓库
git push coding main

# 从指定远程仓库拉取
git pull coding main

# 同步最新代码
git fetch --all
```

## 5. 团队协作

### 分支管理
```bash
# 创建开发分支
git checkout -b develop

# 推送分支到Coding
git push coding develop

# 创建功能分支
git checkout -b feature/new-feature

# 推送功能分支
git push coding feature/new-feature
```

### 合并请求
1. 在Coding中创建合并请求
2. 代码审查
3. 合并到主分支

## 6. CI/CD集成

Coding提供持续集成功能，可以配置自动构建和部署：

1. 在项目中创建 `.coding-ci.yml` 文件
2. 配置构建流程
3. 设置自动部署

## 7. 问题解决

### 推送失败
- 检查仓库权限
- 确认仓库地址正确
- 检查网络连接

### 认证问题
- 重新生成访问令牌
- 清除缓存的凭据：`git config --global --unset credential.helper`

提供您的Coding仓库信息，我来帮您具体配置！