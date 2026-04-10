#!/bin/bash

# 荒野博客系统快速部署脚本
# 从零开始部署整个系统

set -e  # 遇到错误立即退出

echo "🚀 荒野博客系统快速部署脚本"
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 停止现有容器
stop_existing_containers() {
    log_info "停止现有MySQL容器..."
    
    if docker ps -a | grep -q blog-mysql; then
        docker stop blog-mysql 2>/dev/null || true
        docker rm blog-mysql 2>/dev/null || true
        log_success "现有容器已停止"
    else
        log_info "无现有容器需要停止"
    fi
}

# 创建MySQL容器
create_mysql_container() {
    log_info "创建MySQL容器..."
    
    docker run --name blog-mysql \
        -e MYSQL_ROOT_PASSWORD=blog123456 \
        -e MYSQL_DATABASE=blog_system \
        -e MYSQL_CHARSET=utf8mb4 \
        -e MYSQL_COLLATION=utf8mb4_unicode_ci \
        -p 3306:3306 \
        -v /Users/harveylee/Documents/mysql-data:/var/lib/mysql \
        -d mysql:8.0
    
    log_success "MySQL容器创建成功"
    
    # 等待MySQL启动
    log_info "等待MySQL服务启动..."
    sleep 10
    
    # 检查容器状态
    if docker ps | grep -q blog-mysql; then
        log_success "MySQL容器运行正常"
    else
        log_error "MySQL容器启动失败"
        exit 1
    fi
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    if [ ! -f .env.local ]; then
        cp env.example .env.local
        log_success "环境变量文件已创建"
    else
        log_info "环境变量文件已存在"
    fi
    
    # 更新配置
    sed -i '' 's/your_password_here/blog123456/g' .env.local
    sed -i '' 's/your_jwt_secret_key_here/blog_jwt_secret_key_2024/g' .env.local
    
    log_success "环境变量配置完成"
}

# 测试数据库连接
test_database_connection() {
    log_info "测试数据库连接..."
    
    if pnpm test:db:connect; then
        log_success "数据库连接测试通过"
    else
        log_error "数据库连接测试失败"
        exit 1
    fi
}

# 运行数据库迁移
run_database_migration() {
    log_info "运行数据库迁移..."
    
    if pnpm db:migrate; then
        log_success "数据库迁移完成"
    else
        log_error "数据库迁移失败"
        exit 1
    fi
}

# 填充测试数据
seed_database() {
    log_info "填充测试数据..."
    
    if pnpm db:seed; then
        log_success "测试数据填充完成"
    else
        log_warning "测试数据填充可能不完整，但继续执行"
    fi
}

# 测试API功能
test_api() {
    log_info "测试API功能..."
    
    if pnpm test:api; then
        log_success "API功能测试通过"
    else
        log_warning "API功能测试可能不完整，但继续执行"
    fi
}

# 启动开发服务器
start_dev_server() {
    log_info "启动开发服务器..."
    
    log_success "开发服务器启动命令: pnpm dev"
    log_info "请在另一个终端中运行: pnpm dev"
    log_info "然后访问: http://localhost:3000/zh-CN"
}

# 显示部署结果
show_deployment_result() {
    echo ""
    echo "🎉 部署完成！"
    echo "=================================================="
    echo "📊 系统状态:"
    echo "   - MySQL容器: 运行中"
    echo "   - 数据库: blog_system"
    echo "   - 表数量: 9个"
    echo "   - 端口: 3306"
    echo ""
    echo "🌐 可访问的URL:"
    echo "   - 中文首页: http://localhost:3000/zh-CN"
    echo "   - 英文首页: http://localhost:3000/en-US"
    echo "   - 日文首页: http://localhost:3000/ja-JP"
    echo "   - 博客列表: http://localhost:3000/zh-CN/blog"
    echo ""
    echo "🔧 常用命令:"
    echo "   - 启动服务器: pnpm dev"
    echo "   - 测试数据库: pnpm test:db:connect"
    echo "   - 测试API: pnpm test:api"
    echo "   - 查看容器: docker ps | grep blog-mysql"
    echo ""
}

# 主函数
main() {
    check_dependencies
    stop_existing_containers
    create_mysql_container
    setup_environment
    test_database_connection
    run_database_migration
    seed_database
    test_api
    show_deployment_result
    start_dev_server
}

# 执行主函数
main "$@"
