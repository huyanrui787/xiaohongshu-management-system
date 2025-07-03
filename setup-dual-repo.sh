#!/bin/bash

# 双仓库同时推送配置脚本
# 使用方法：./setup-dual-repo.sh "您的Coding仓库地址"

echo "=========================================="
echo "配置双仓库同时推送"
echo "=========================================="

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 请提供Coding仓库地址"
    echo "使用方法: ./setup-dual-repo.sh 'https://team.coding.net/p/project/d/repo/git'"
    echo ""
    echo "📝 Coding仓库地址格式示例："
    echo "  https://团队名.coding.net/p/项目名/d/仓库名/git"
    echo "  git@团队名.coding.net:项目名/仓库名.git"
    exit 1
fi

CODING_REPO=$1

echo "🔍 当前远程仓库配置："
git remote -v

echo ""
echo "📝 添加Coding推送地址..."

# 为origin添加Coding推送地址
git remote set-url --add --push origin "$CODING_REPO"

# 保持GitHub推送地址
git remote set-url --add --push origin "https://github.com/huyanrui787/xiaohongshu-management-system.git"

echo ""
echo "✅ 配置完成！新的远程仓库配置："
git remote -v

echo ""
echo "=========================================="
echo "🎉 双仓库同时推送已配置完成！"
echo "=========================================="
echo ""
echo "📖 使用方法："
echo "  git add ."
echo "  git commit -m \"你的提交信息\""
echo "  git push origin main"
echo ""
echo "💡 这样会同时推送到："
echo "  ✓ GitHub: https://github.com/huyanrui787/xiaohongshu-management-system"
echo "  ✓ Coding: $CODING_REPO"
echo ""
echo "🔧 其他有用命令："
echo "  git remote -v           # 查看远程仓库配置"
echo "  git push origin --all   # 推送所有分支"
echo "  git pull origin main    # 从GitHub拉取最新代码"
echo ""
echo "⚠️  注意事项："
echo "  1. 确保您在Coding中有推送权限"
echo "  2. 首次推送可能需要输入Coding账号密码"
echo "  3. 建议配置Coding的个人访问令牌以避免密码输入"
echo "=========================================="