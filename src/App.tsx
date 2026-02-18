import { useEffect, useState } from 'react'

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

type Screen = 'main' | 'cart' | 'contact' | 'success';

interface ContactForm {
  phone: string;
  telegram: string;
  comment: string;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Курс 'C для профи'", price: 150, image: "💻" },
  { id: 2, name: "Алгоритмы и структуры", price: 100, image: "🧩" },
  { id: 3, name: "Архитектура ПО", price: 200, image: "🏗️" },
];

function App() {
  const [cart, setCart] = useState<Product[]>([]);
  const [screen, setScreen] = useState<Screen>('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contact, setContact] = useState<ContactForm>({
    phone: '',
    telegram: '',
    comment: '',
  });
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    if (!tg) return;
    tg.ready();
    tg.expand();
    // Устанавливаем цвет заголовка в цвет темы Telegram
    tg.setHeaderColor('secondary_bg_color');
  }, [tg]);

  // Управление главной кнопкой
  useEffect(() => {
    if (!tg) return;

    if (screen === 'success' || (screen === 'main' && cart.length === 0)) {
      tg.MainButton.hide();
      return;
    }

    tg.MainButton.show();
    let buttonText = "ПОСМОТРЕТЬ КОРЗИНУ";
    if (screen === 'cart') buttonText = "ОФОРМИТЬ ЗАКАЗ";
    if (screen === 'contact') buttonText = "ОТПРАВИТЬ ЗАКАЗ";

    tg.MainButton.setParams({
      text: buttonText,
      color: "#3b82f6", // Яркий синий
      is_active: !isSubmitting,
    });
  }, [cart.length, screen, tg, isSubmitting]);

  // Логика нажатия
  useEffect(() => {
    if (!tg) return;

    const handleMainButton = () => {
      if (screen === 'main') {
        setScreen('cart');
      } else if (screen === 'cart') {
        if (cart.length === 0) {
          tg.HapticFeedback?.notificationOccurred('error');
          tg.showAlert?.("Корзина пуста");
          return;
        }
        setScreen('contact');
      } else if (screen === 'contact') {
        // Валидация: хотя бы один контакт должен быть заполнен
        if (!contact.phone && !contact.telegram) {
          tg.HapticFeedback?.notificationOccurred('error');
          tg.showAlert?.("Пожалуйста, укажи телефон или Telegram для связи");
          return;
        }

        setIsSubmitting(true);

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const payload = {
          type: 'order',
          items: cart.map(({ id, name, price }) => ({ id, name, price })),
          total,
          createdAt: new Date().toISOString(),
          user: tg.initDataUnsafe?.user ?? null,
          contact: {
            phone: contact.phone.trim() || undefined,
            telegram: contact.telegram.trim() || undefined,
            comment: contact.comment.trim() || undefined,
          },
        };

        // Визуальный фидбек перед закрытием
        tg.HapticFeedback?.notificationOccurred('success');

        // Отправляем данные на всех платформах
        try {
          if (!tg.sendData) {
            tg.showAlert?.("Ошибка: функция отправки недоступна");
            setIsSubmitting(false);
            return;
          }
          
          tg.sendData(JSON.stringify(payload));
        } catch (error) {
          console.error("Ошибка отправки данных:", error);
          tg.showAlert?.("Ошибка отправки заказа. Попробуй еще раз.");
          setIsSubmitting(false);
          return;
        }

        setScreen('success');
        setCart([]);
        setContact({ phone: '', telegram: '', comment: '' });
        setIsSubmitting(false);
      }
    };

    tg.onEvent('mainButtonClicked', handleMainButton);
    return () => tg.offEvent('mainButtonClicked', handleMainButton);
  }, [cart, screen, contact, tg]);

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
    tg?.HapticFeedback?.impactOccurred('medium');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const getProductCount = (productId: number) => {
    return cart.filter(item => item.id === productId).length;
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      {/* Шапка */}
      <div className="p-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              ASTAEV DIGITAL
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Premium Solutions</p>
          </div>
          {cart.length > 0 && (
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                🛒
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                {cart.length}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        {screen === 'main' && (
          <div className="grid gap-4">
            {PRODUCTS.map(product => {
              const count = getProductCount(product.id);
              return (
                <div key={product.id} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 p-5 rounded-3xl flex items-center justify-between group transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <span className="text-4xl bg-gradient-to-br from-slate-800 to-slate-700 p-3 rounded-2xl block">{product.image}</span>
                      {count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-100">{product.name}</h3>
                      <p className="text-blue-400 font-mono text-sm mt-1">⭐ {product.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-90"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {screen === 'cart' && (
          <div className="animate-in fade-in slide-in-from-right-5 duration-300">
            <button
              onClick={() => setScreen('main')}
              className="mb-6 text-slate-400 hover:text-slate-300 flex items-center gap-2 font-medium transition-colors active:scale-95"
            >
              <span className="text-xl">←</span> Вернуться к покупкам
            </button>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Твой заказ
            </h2>
            <p className="text-slate-500 text-sm mb-6">{cart.length} {cart.length === 1 ? 'товар' : cart.length < 5 ? 'товара' : 'товаров'}</p>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-slate-500 text-lg">Корзина пуста</p>
                <p className="text-slate-600 text-sm mt-2">Добавь курсы на главной странице</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gradient-to-r from-slate-900/80 to-slate-800/80 p-4 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{item.image || '📦'}</span>
                        <div>
                          <span className="font-medium text-slate-100">{item.name}</span>
                          <span className="ml-2 text-xs text-slate-500">#{item.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-400 font-semibold">⭐ {item.price}</span>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center text-sm transition-all active:scale-90"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl shadow-xl shadow-blue-900/30 border border-blue-400/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-blue-100 text-sm font-medium opacity-90 uppercase tracking-tighter">Итоговая стоимость</p>
                    <span className="text-blue-100/80 text-xs">{cart.length} {cart.length === 1 ? 'товар' : 'товаров'}</span>
                  </div>
                  <div className="text-4xl font-black text-white mt-1 mb-3">⭐ {totalPrice}</div>
                  <div className="flex items-center gap-2 text-blue-100/90 text-xs">
                    <span>💬</span>
                    <span>Нажми кнопку внизу Telegram, чтобы продолжить</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {screen === 'contact' && (
          <div className="animate-in fade-in slide-in-from-right-5 duration-300">
            <button
              onClick={() => setScreen('cart')}
              className="mb-6 text-slate-400 hover:text-slate-300 flex items-center gap-2 font-medium transition-colors active:scale-95"
            >
              <span className="text-xl">←</span> Вернуться к корзине
            </button>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Контактные данные
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Укажи, как с тобой связаться для уточнения деталей заказа
            </p>

            {isSubmitting && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-blue-300">Отправка заказа...</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <span>📱</span>
                  <span>Телефон</span>
                  <span className="text-slate-500 text-xs font-normal">(необязательно)</span>
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <span>✈️</span>
                  <span>Telegram</span>
                  <span className="text-slate-500 text-xs font-normal">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={contact.telegram}
                  onChange={(e) => setContact(prev => ({ ...prev, telegram: e.target.value }))}
                  placeholder="@username или номер телефона"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <span>💬</span>
                  <span>Комментарий</span>
                  <span className="text-slate-500 text-xs font-normal">(необязательно)</span>
                </label>
                <textarea
                  value={contact.comment}
                  onChange={(e) => setContact(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Дополнительная информация о заказе..."
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:opacity-50"
                />
              </div>

              {(!contact.phone && !contact.telegram) && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <p className="text-xs text-amber-300 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Укажи хотя бы телефон или Telegram для связи</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === 'success' && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-300 text-center space-y-6 py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40 animate-pulse">
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                Заказ отправлен!
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                Мы получили твою заявку. Менеджер свяжется с тобой в Telegram в ближайшее время, чтобы уточнить детали и оплату.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => tg?.close?.()}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 text-slate-100 text-sm font-semibold transition-all shadow-lg active:scale-95"
              >
                Закрыть мини‑приложение
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;