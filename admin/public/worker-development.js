/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toPropertyKey = __webpack_require__(2);
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 2 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(3)["default"]);
var toPrimitive = __webpack_require__(4);
function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 3 */
/***/ ((module) => {

function _typeof(o) {
  "@babel/helpers - typeof";

  return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ }),
/* 4 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _typeof = (__webpack_require__(3)["default"]);
function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var _defineProperty = __webpack_require__(1);
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
/**
 * Service Worker for handling push notifications
 * Handles push events and notification clicks
 */

// Listen for push notifications from backend
self.addEventListener('push', function (event) {
  try {
    let data = {};

    // Parse push event data
    if (event.data) {
      try {
        data = event.data.json();
      } catch (e) {
        console.error('[Worker] Failed to parse push data as JSON:', e);
        data = {
          body: event.data.text()
        };
      }
    }
    console.log('[Worker] Push notification received:', {
      title: data.title,
      status: data.status,
      timestamp: new Date().toISOString()
    });

    // Build notification options
    const options = {
      body: data.body || 'Нет сообщения',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-light-32x32.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || 'notification',
      // Use tag to prevent duplicates
      requireInteraction: data.requireInteraction || false,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.tag || 'admin-notification',
        url: data.url || '/orders',
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        status: data.status
      },
      actions: [{
        action: 'open',
        title: 'Открыть'
      }, {
        action: 'close',
        title: 'Закрыть'
      }]
    };
    const title = data.title || 'Mazir Admin';
    console.log('[Worker] Showing notification:', _objectSpread({
      title
    }, options));
    event.waitUntil(self.registration.showNotification(title, options).then(() => {
      console.log('[Worker] Notification displayed successfully');
    }).catch(error => {
      console.error('[Worker] Failed to show notification:', error);
    }));
  } catch (error) {
    console.error('[Worker] Error handling push event:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  var _event$notification$d, _event$notification$d2;
  console.log('[Worker] Notification clicked:', {
    action: event.action,
    url: (_event$notification$d = event.notification.data) === null || _event$notification$d === void 0 ? void 0 : _event$notification$d.url,
    tag: event.notification.tag
  });
  event.notification.close();

  // Don't open window if user clicked 'close'
  if (event.action === 'close') {
    console.log('[Worker] Close action selected, not opening window');
    return;
  }
  const url = ((_event$notification$d2 = event.notification.data) === null || _event$notification$d2 === void 0 ? void 0 : _event$notification$d2.url) || '/orders';
  event.waitUntil(clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(function (clientList) {
    console.log('[Worker] Found client windows:', clientList.length);

    // Try to find an existing window with the same URL
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url && client.url.includes(url) && 'focus' in client) {
        console.log('[Worker] Focusing existing window with URL:', url);
        return client.focus();
      }
    }

    // Open new window if none found
    if (clients.openWindow) {
      console.log('[Worker] Opening new window with URL:', url);
      return clients.openWindow(url);
    }
  }).catch(error => {
    console.error('[Worker] Error handling notification click:', error);
  }));
});

// Handle notification close events (optional)
self.addEventListener('notificationclose', function (event) {
  console.log('[Worker] Notification closed:', {
    tag: event.notification.tag,
    timestamp: new Date().toISOString()
  });
});
})();

/******/ })()
;