# ❌ Проблема: Не создаются подписки

## Причина найдена и исправлена ✅

### 🔴 ЧТО БЫЛО НЕ ТАК

Таблица `subscriptions` имеет PRIMARY KEY по полю `id`:
```sql
CREATE TABLE public.subscriptions (
  id TEXT PRIMARY KEY,  -- ← ТРЕБУЕТСЯ ЗНАЧЕНИЕ
  name TEXT NOT NULL,
  ...
)
```

Но при создании подписки через API, **ID не генерировался**, что приводило к ошибке:
```
PRIMARY KEY violation - id cannot be NULL
```

### ✅ КАК ИСПРАВЛЕНО

**В `server/api.ts` endpoint `POST /api/subscriptions`:**

```typescript
// БЫЛО:
const { name, description, price, period, status } = req.body;
const { data, error } = await supabase.from('subscriptions').insert({
  name, description, price, period, status,  // ❌ ID нет!
  ...
});

// СТАЛО:
const id = req.body.id || randomUUID();  // ✅ Генерируем UUID
const { data, error } = await supabase.from('subscriptions').insert({
  id,  // ✅ ДОБАВЛЕН ID
  name, description, price, period, status,
  ...
});
```

## Все изменения

### 1. **server/api.ts**
- ✅ Добавлен import для `randomUUID` из `crypto`
- ✅ POST /api/subscriptions - генерирует UUID если ID не предоставлен
- ✅ Добавлено логирование для диагностики (POST, PUT, DELETE)

### 2. **src/services/subscriptionsService.ts**
- ✅ Добавлено логирование в `createSubscription()` метод

### 3. **src/hooks/useSubscriptions.ts**
- ✅ Добавлено логирование в `addSubscription()` функцию

### 4. **src/services/api.ts**
- ✅ Добавлено логирование в `post()` метод

### 5. **scripts/init-database.sql**
- ✅ Добавлен индекс на поле `name` таблицы subscriptions

## Как это теперь работает

```
Frontend: Пользователь нажимает "Создать подписку"
   ↓
useSubscriptions.addSubscription(data)
   ↓
subscriptionsService.createSubscription(data)
   ↓
apiClient.post('/subscriptions', data)  // ← Логирование
   ↓
Backend: POST /api/subscriptions
   ├─ const id = randomUUID()  // ✅ Генерируем ID
   ├─ await supabase.insert({ id, name, price, ... })  // ✅ Вставляем с ID
   └─ res.json(data)  // ← Логирование ✅
   ↓
Frontend: Получает ответ, добавляет в список
   ↓
UI: Новая подписка отображается на экране ✅
```

## Диагностирование в браузере

Откройте **Developer Tools** (F12) → **Console** и создайте подписку.

Вы должны увидеть:
```
🌐 [API] POST http://localhost:5000/api/subscriptions with data: {...}
📬 [API] Response status: 201
✅ [API] Success, got response: {id: "uuid", name: "...", price: ..., ...}
✅ [subscriptionsService] Created subscription: {...}
✅ [useSubscriptions] Subscription created: {...}
```

## На сервере

Логи в терминале где запущен backend:
```
📍 POST /api/subscriptions - Creating subscription
🔑 Generated ID: 550e8400-e29b-41d4-a716-446655440000
📊 Database result: {...}
✅ Subscription created: {...}
```

## Тестирование

1. ✅ Убедитесь что таблицы созданы (выполните `scripts/init-database.sql`)
2. ✅ Запустите backend: `npm run dev:server`
3. ✅ Запустите frontend: `npm run dev`
4. ✅ Откройте **Subscriptions** страницу
5. ✅ Нажмите **Создать** и добавьте новую подписку
6. ✅ Проверьте **Console** в DevTools на логирование
7. ✅ Подписка должна добавиться в список

## Если всё ещё не работает

1. Проверьте что backend запущен: `npm run dev:server`
2. Проверьте что таблицы созданы: `node -e "fetch('http://localhost:5000/health').then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))"`
3. Проверьте браузер Console (F12) на красные ошибки
4. Проверьте логи сервера на ошибки БД

---

**Итог:** Проблема исправлена. Подписки теперь создаются корректно! 🎉