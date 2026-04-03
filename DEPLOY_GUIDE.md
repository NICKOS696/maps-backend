# 🚀 Инструкция по деплою Backend на сервер

## ШАГ 1: Подготовка файлов на локальном компьютере

### Создайте архив backend-new (без node_modules)

```powershell
# В PowerShell на вашем компьютере
cd "C:\Users\Николай Филиппов\CascadeProjects\MAPS"

# Создаем архив (исключая node_modules)
Compress-Archive -Path backend-new\* -DestinationPath backend-new.zip -Force
```

---

## ШАГ 2: Загрузка на сервер через SCP

### Вариант A: Через WinSCP (графический интерфейс)

1. Откройте **WinSCP**
2. Подключитесь к серверу:
   - Host: `5.42.123.202`
   - Username: `root`
   - Password: ваш пароль
3. Перейдите в `/opt/`
4. Загрузите файл `backend-new.zip`

### Вариант B: Через PowerShell (командная строка)

```powershell
# Загрузка через SCP (если установлен OpenSSH)
scp "C:\Users\Николай Филиппов\CascadeProjects\MAPS\backend-new.zip" root@5.42.123.202:/opt/
```

---

## ШАГ 3: Распаковка и настройка на сервере

Подключитесь к серверу через SSH и выполните:

```bash
# 1. Переходим в /opt
cd /opt

# 2. Создаем директорию maps (если не существует)
mkdir -p /opt/maps

# 3. Распаковываем архив
unzip backend-new.zip -d /opt/maps/

# 4. Переходим в директорию
cd /opt/maps

# 5. Создаем .env файл
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maps_db
DB_USER=maps_user
DB_PASSWORD=maps_password_2026

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (ИЗМЕНИТЕ НА СВОЙ!)
JWT_SECRET=super-secret-maps-key-2026-change-this

# CORS Configuration
ALLOWED_ORIGINS=http://5.42.123.202,http://localhost:3000
EOF

# 6. Устанавливаем зависимости
npm install --production

# 7. Проверяем, что все установилось
ls -la
cat .env
```

---

## ШАГ 4: Запуск через PM2

```bash
# 1. Останавливаем PM2 процесс, если он уже запущен
pm2 stop maps-api 2>/dev/null || true
pm2 delete maps-api 2>/dev/null || true

# 2. Запускаем новый процесс
cd /opt/maps
pm2 start server.js --name maps-api

# 3. Сохраняем конфигурацию PM2
pm2 save

# 4. Настраиваем автозапуск при перезагрузке сервера
pm2 startup

# 5. Проверяем статус
pm2 status
pm2 logs maps-api --lines 20
```

---

## ШАГ 5: Проверка работы API

```bash
# Проверяем, что API отвечает
curl http://localhost:3000/

# Проверяем health endpoint
curl http://localhost:3000/health

# Проверяем получение районов (должно работать без авторизации)
curl http://localhost:3000/api/districts

# Проверяем авторизацию
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Ожидаемые результаты:**
- `GET /` → `{"status":"ok","message":"Maps Editor API",...}`
- `GET /health` → `{"status":"healthy",...}`
- `GET /api/districts` → `{"success":true,"data":[...]}`
- `POST /api/auth/login` → `{"success":true,"token":"...",...}`

---

## ШАГ 6: Проверка, что приложение зарплаты не сломалось

```bash
# Проверяем Docker контейнеры
docker ps

# Проверяем приложение зарплаты
curl http://localhost:8000
curl http://localhost:80
```

**Должны работать оба приложения:**
- ✅ Зарплата на портах 80 и 8000
- ✅ Maps API на порту 3000

---

## ШАГ 7: Настройка Nginx (опционально)

Если хотите, чтобы API был доступен через `/maps/api`:

```bash
# Найдите конфигурацию Nginx
find / -name "nginx.conf" 2>/dev/null
find / -name "default.conf" 2>/dev/null

# Добавьте location в конфигурацию Nginx:
# location /maps/api {
#     proxy_pass http://localhost:3000/api;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
# }

# Перезагрузите Nginx
nginx -t
nginx -s reload
```

---

## 🔧 Полезные команды PM2

```bash
# Просмотр логов
pm2 logs maps-api

# Перезапуск
pm2 restart maps-api

# Остановка
pm2 stop maps-api

# Удаление
pm2 delete maps-api

# Мониторинг
pm2 monit
```

---

## ✅ Чек-лист успешного деплоя

- [ ] Архив создан и загружен на сервер
- [ ] Файлы распакованы в `/opt/maps`
- [ ] `.env` файл создан с правильными параметрами
- [ ] `npm install` выполнен успешно
- [ ] PM2 процесс запущен и работает
- [ ] API отвечает на `http://localhost:3000`
- [ ] Авторизация работает (логин admin/admin123)
- [ ] Приложение зарплаты продолжает работать
- [ ] PM2 настроен на автозапуск

---

## 🆘 Решение проблем

### Проблема: npm install не работает
```bash
# Проверьте версию Node.js
node -v  # должно быть >= 18.x

# Очистите кеш npm
npm cache clean --force
npm install --production
```

### Проблема: PM2 не запускается
```bash
# Проверьте логи
pm2 logs maps-api --err

# Проверьте .env файл
cat /opt/maps/.env

# Проверьте подключение к БД
psql -U maps_user -d maps_db -h localhost -c "SELECT 1;"
```

### Проблема: Порт 3000 занят
```bash
# Найдите процесс на порту 3000
lsof -i :3000
netstat -tulpn | grep 3000

# Измените порт в .env
nano /opt/maps/.env
# PORT=3001

# Перезапустите PM2
pm2 restart maps-api
```
