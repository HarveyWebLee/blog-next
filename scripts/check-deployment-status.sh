#!/bin/bash

# 荒野博客系统部署状态检查脚本

set -e

echo "🔍 荒野博客系统部署状态检查"
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

# 检查Docker容器状态
check_docker_container() {
    log_info "检查Docker容器状态..."
    
    if docker ps | grep -q blog-mysql; then
        log_success "MySQL容器正在运行"
        
        # 显示容器信息
        echo "   容器信息:"
        docker ps | grep blog-mysql | awk '{print "   - 容器ID: " $1 "\n   - 状态: " $7 "\n   - 端口: " $6}'
    else
        log_error "MySQL容器未运行"
        return 1
    fi
}

# 检查数据库连接
check_database_connection() {
    log_info "检查数据库连接..."
    
    if pnpm test:db:connect > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 检查环境变量
check_environment() {
    log_info "检查环境变量配置..."
    
    if [ -f .env.local ]; then
        log_success "环境变量文件存在"
        
        # 检查关键配置
        if grep -q "DB_PASSWORD=blog123456" .env.local; then
            log_success "数据库密码配置正确"
        else
            log_warning "数据库密码配置可能不正确"
        fi
        
        if grep -q "JWT_SECRET=blog_jwt_secret_key_2024" .env.local; then
            log_success "JWT密钥配置正确"
        else
            log_warning "JWT密钥配置可能不正确"
        fi
    else
        log_error "环境变量文件不存在"
        return 1
    fi
}

# 检查数据库表
check_database_tables() {
    log_info "检查数据库表结构..."
    
    # 运行数据库测试并提取表信息
    local result=$(pnpm test:db:connect 2>/dev/null | grep "表数量" || echo "0")
    
    if [[ $result == *"9"* ]]; then
        log_success "数据库表结构完整 (9个表)"
    else
        log_warning "数据库表结构可能不完整"
    fi
}

# 检查API端点
check_api_endpoints() {
    log_info "检查API端点..."
    
    # 检查开发服务器是否运行
    if curl -s http://localhost:3000/api/test-db > /dev/null 2>&1; then
        log_success "API端点可访问"
    else
        log_warning "API端点不可访问 (开发服务器可能未启动)"
    fi
}

# 检查前端页面
check_frontend_pages() {
    log_info "检查前端页面..."
    
    # 检查首页
    if curl -s http://localhost:3000/zh-CN > /dev/null 2>&1; then
        log_success "前端页面可访问"
    else
        log_warning "前端页面不可访问 (开发服务器可能未启动)"
    fi
}

# 显示系统信息
show_system_info() {
    echo ""
    echo "📊 系统信息:"
    echo "=================================================="
    
    # Docker信息
    echo "🐳 Docker容器:"
    if docker ps | grep -q blog-mysql; then
        docker ps | grep blog-mysql | awk '{print "   - 容器ID: " $1 "\n   - 镜像: " $2 "\n   - 状态: " $7 "\n   - 端口: " $6}'
    else
        echo "   - 状态: 未运行"
    fi
    
    echo ""
    echo "🗄️ 数据库信息:"
    if pnpm test:db:connect > /dev/null 2>&1; then
        local version=$(pnpm test:db:connect 2>/dev/null | grep "数据库版本" | awk '{print $3}' || echo "未知")
        local tables=$(pnpm test:db:connect 2>/dev/null | grep "表数量" | awk '{print $3}' || echo "0")
        echo "   - 版本: MySQL $version"
        echo "   - 数据库: blog_system"
        echo "   - 表数量: $tables"
    else
        echo "   - 状态: 连接失败"
    fi
    
    echo ""
    echo "🌐 可访问的URL:"
    echo "   - 中文首页: http://localhost:3000/zh-CN"
    echo "   - 英文首页: http://localhost:3000/en-US"
    echo "   - 日文首页: http://localhost:3000/ja-JP"
    echo "   - 博客列表: http://localhost:3000/zh-CN/blog"
    echo "   - 分类页面: http://localhost:3000/zh-CN/categories"
    echo "   - 标签页面: http://localhost:3000/zh-CN/tags"
    echo "   - 关于页面: http://localhost:3000/zh-CN/about"
    
    echo ""
    echo "🔧 常用命令:"
    echo "   - 启动服务器: pnpm dev"
    echo "   - 测试数据库: pnpm test:db:connect"
    echo "   - 测试API: pnpm test:api"
    echo "   - 查看容器: docker ps | grep blog-mysql"
    echo "   - 查看日志: docker logs blog-mysql"
    echo "   - 停止容器: docker stop blog-mysql"
    echo "   - 启动容器: docker start blog-mysql"
}

# 主函数
main() {
    local all_checks_passed=true
    
    # 执行各项检查
    check_docker_container || all_checks_passed=false
    check_environment || all_checks_passed=false
    check_database_connection || all_checks_passed=false
    check_database_tables || all_checks_passed=false
    check_api_endpoints || all_checks_passed=false
    check_frontend_pages || all_checks_passed=false
    
    # 显示系统信息
    show_system_info
    
    # 显示最终结果
    echo ""
    if [ "$all_checks_passed" = true ]; then
        log_success "所有检查通过！系统运行正常 🎉"
    else
        log_warning "部分检查未通过，请检查上述信息"
    fi
    
    echo ""
    echo "📝 如需重新部署，请运行: ./scripts/deploy-from-scratch.sh"
}

# 执行主函数
main "$@"
