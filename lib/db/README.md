windows 环境下
先创建路径 /mysql_data 以供挂载

```
docker run -d \
  --name mysql-server \
  --restart unless-stopped \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -p 3306:3306 \
  -v /e/mysql_data:/var/lib/mysql \
  mysql:8.0
```

```
docker run -d --name mysql-server --restart unless-stopped -e MYSQL_ROOT_PASSWORD=123456 -p 3306:3306 -v /e/mysql_data:/var/lib/mysql mysql:8.0
```
