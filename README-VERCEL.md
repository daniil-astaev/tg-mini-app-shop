# Деплой Telegram Mini App на Vercel

## Шаг 1: Подготовка репозитория

1. Убедитесь, что все изменения сохранены в Git:
```bash
git add .
git commit -m "Настройка Vercel деплоя"
git push
```

## Шаг 2: Настройка Vercel

1. Зайдите на [vercel.com](https://vercel.com) и подключите ваш GitHub репозиторий
2. При настройке проекта добавьте переменные окружения:
   - `BOT_TOKEN`: ваш токен бота от BotFather
   - `WEB_APP_URL`: URL вашего приложения на Vercel (получите после первого деплоя)
   - `NODE_ENV`: `production`

## Шаг 3: Настройка Webhook

После первого деплоя вам нужно будет:
1. Получить URL вашего Vercel приложения
2. Установить webhook для Telegram бота:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-vercel-app.vercel.app/api/bot"}'
```

## Шаг 4: Обновление WEB_APP_URL

После деплоя обновите переменную `WEB_APP_URL` в настройках Vercel, чтобы она указывала на ваш сайт.

## Структура проекта

- `bot.js` - Telegram бот с экспортом для Vercel
- `vercel.json` - конфигурация Vercel
- `src/` - React приложение для Mini App
- `database.js` - работа с SQLite базой данных

## Продажа TMA проектов

Этот проект можно использовать как шаблон для создания:
- Интернет-магазинов
- Сервисов записи
- Бронирования услуг
- Каталогов товаров
- И любых других сервисов в Telegram

Для быстрого создания новых проектов:
1. Скопируйте этот репозиторий
2. Измените дизайн и функционал в `src/`
3. Настройте команды бота под свои нужды
4. Задеплойте на Vercel
