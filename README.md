# Maps Editor Backend API

Backend API для редактора карт с поддержкой PostgreSQL/PostGIS.

## 🚀 Установка

### На локальном компьютере (для разработки)

```bash
# Установка зависимостей
npm install

# Копирование .env файла
copy .env.example .env

# Редактирование .env файла (укажите параметры БД)

# Запуск в режиме разработки
npm run dev

# Или запуск в продакшн режиме
npm start
```

### На сервере (продакшн)

```bash
# 1. Создание директории
mkdir -p /opt/maps
cd /opt/maps

# 2. Загрузка файлов backend
# (используйте scp или git)

# 3. Установка зависимостей
npm install --production

# 4. Создание .env файла
nano .env
# Вставьте конфигурацию из .env.example

# 5. Запуск через PM2
pm2 start server.js --name maps-api
pm2 save
pm2 startup
```

## 📡 API Endpoints

### Авторизация

#### POST /api/auth/login
Вход в систему

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Авторизация успешна",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "editor"
  }
}
```

#### POST /api/auth/register
Регистрация нового пользователя

**Request:**
```json
{
  "username": "newuser",
  "password": "password123",
  "role": "editor"
}
```

### Районы (Districts)

#### GET /api/districts
Получить все районы (или фильтр по city_id)

**Query params:**
- `city_id` (optional) - ID города

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "city_id": 1,
      "name": "Яшнабад",
      "color": "#ee1111",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "city_name": "Ташкент"
    }
  ]
}
```

#### GET /api/districts/:id
Получить район по ID

#### POST /api/districts
Создать новый район (требуется авторизация)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "city_id": 1,
  "name": "Новый район",
  "color": "#3388ff",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[69.123, 41.456], ...]]
  }
}
```

#### PUT /api/districts/:id
Обновить район (требуется авторизация)

#### DELETE /api/districts/:id
Удалить район (требуется авторизация)

### Микрорайоны (Microdistricts)

Аналогичные endpoints для микрорайонов:
- GET /api/microdistricts
- GET /api/microdistricts/:id
- POST /api/microdistricts
- PUT /api/microdistricts/:id
- DELETE /api/microdistricts/:id

## 🔒 Авторизация

Для защищенных endpoints (POST, PUT, DELETE) требуется JWT токен в заголовке:

```
Authorization: Bearer <your-jwt-token>
```

Токен получается при успешной авторизации через `/api/auth/login`.

## 🗄️ База данных

Приложение использует PostgreSQL с расширением PostGIS для работы с геопространственными данными.

### Структура таблиц:
- `companies` - компании
- `cities` - города
- `districts` - районы (с геометрией)
- `microdistricts` - микрорайоны (с геометрией)
- `users` - пользователи

## 🔧 Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maps_db
DB_USER=maps_user
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=production

JWT_SECRET=your-secret-key-change-in-production

ALLOWED_ORIGINS=http://5.42.123.202,http://localhost:3000
```

## 📦 Зависимости

- **express** - веб-фреймворк
- **pg** - PostgreSQL клиент
- **bcryptjs** - хеширование паролей
- **jsonwebtoken** - JWT авторизация
- **cors** - CORS middleware
- **dotenv** - переменные окружения
- **body-parser** - парсинг запросов

## 🛠️ Разработка

```bash
# Установка с dev зависимостями
npm install

# Запуск с автоперезагрузкой
npm run dev
```

## 📝 Примечания

- Все защищенные endpoints требуют JWT токен
- Геометрия хранится в формате GeoJSON
- API возвращает ошибки в формате JSON
- CORS настроен для указанных доменов
