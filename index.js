require('dotenv').config()
const Bot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3');

const token = `${process.env.SECRET_KEY}`;
const bot = new Bot(token, {
    polling: {
        interval: 300,
        autoStart: true
    }
});
bot.on("polling_error", (err) => {
    if (err && err.data && err.data.error && err.data.error.message) {
      console.log(err.data.error.message);
    } else {
      console.log('undefined comand or error');
    }
});

const db = new sqlite3.Database('vaysed_pizza.db', (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      address TEXT,
      phone_number TEXT
    );
  
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      pizza TEXT,
      address TEXT,
      phone_number TEXT,
      recipient_name TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
  
const orders = [];
  
  function storeOrder(msg, content) {
    const chatId = msg.payload.chatId
    if (!orders[chatId]) {
      orders[chatId] = [];
    }
    orders[chatId].push(content);
  }
  
  function getOrder(msg) {
    const chatId = msg.payload.chatId;
    return orders[chatId];
    console.log(chatId);
  }
  
  function formatOrderText(order) {
    let text = 'Ваше замовлення: \n';
    if (order.length === 0) {
      text = 'Кошик порожній, поверніться в меню щоб зробити замовлення.';
    } else {
      order.forEach((pizza, index) => {
        text += `${index + 1}. ${pizza} \n`;
      });
    }
    return text;
  }

function mainMenuKeyboard() {
    return {
        keyboard: [
            ["🍕 · Оформити замовлення"],
            ["📃 · Мої замовлення"],
            ['ℹ️ · Моя інформація', "📞 · Зворотній зв'язок"]
        ],
        resize_keyboard: true
    };
}

bot.onText(/\/start/, async (msg) => {
    const photo = './img/start.png';
    const caption = '✌️ · Вітаємо в Vaysed Pizza!\nХочеш свіженьку піцулю тут і зараз? Ти у правильному місці.\nВикористовуй меню внизу, щоб оформити замовлення.';

    await bot.sendPhoto(msg.chat.id, photo, {
        caption,
        reply_markup: mainMenuKeyboard()
    });
});

bot.onText(/🍕 · Оформити замовлення/, async (msg) => {
    const photo = './img/menu-footer.png';
    const caption = '🍕 · Оформлення замовлення.\nВибирай яку піцу хочеш: власну чи готовий варіант?';

    await bot.sendPhoto(msg.chat.id, photo, {
        caption,
        reply_markup: {
            keyboard: [
                ["😸 · Готові варіанти", "🖌️ · Власна піца"],
                ["◀ · Назад до меню"]
            ],
            resize_keyboard: true
        },
    });

});

bot.onText(/◀ · Назад до меню/, async (msg) => {
    await bot.sendMessage(msg.chat.id, '🪧 · Ви повернулись в головне меню.', {
        reply_markup: mainMenuKeyboard()
    });
});

bot.onText(/😸 · Готові варіанти/, async (msg) => {
    await bot.sendMessage(msg.chat.id, '😸 · Готові варіанти.', {
        reply_markup: {
            keyboard: [
                ["📃 · Моє замовлення"],
                ["◀ · Назад до меню"]
            ],
            resize_keyboard: true
        }
    });
    await bot.sendMessage(msg.chat.id, 'Обирай нижче.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Салямі', callback_data: 'doneSalami' }, { text: 'Гавайська', callback_data: 'doneHavai' }],
                [{ text: 'Цезаріо', callback_data: 'doneCezar' }, { text: 'Маргарита', callback_data: 'doneMargaret' }],
                [{ text: 'Мексиканська', callback_data: 'doneMexic' }, { text: 'Карбонара', callback_data: 'doneCarbonara' }],
                [{ text: 'Морська', callback_data: 'doneSea' }],
            ],
        }
    });
});

bot.onText(/◀️ · Назад до варіантів/, async (msg) => {
    await bot.sendMessage(msg.chat.id, 'Ви повернулись до варіантів піци.', {
        reply_markup: {
            keyboard: [
                ["📃 · Моє замовлення"],
                ["◀ · Назад до меню"]
            ],
            resize_keyboard: true
        }
    });

    await bot.sendMessage(msg.chat.id, 'Обирай нижче.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Салямі', callback_data: 'doneSalami' }, { text: 'Гавайська', callback_data: 'doneHavai' }],
                [{ text: 'Цезаріо', callback_data: 'doneCezar' }, { text: 'Маргарита', callback_data: 'doneMargaret' }],
                [{ text: 'Мексиканська', callback_data: 'doneMexic' }, { text: 'Карбонара', callback_data: 'doneCarbonara' }],
                [{ text: 'Морська', callback_data: 'doneSea' }],
            ],
        }
    });

});


bot.on("callback_query", async (ctx) => {

    const pizzas = [
        { salami: 'Салямі', price: 189 },  
        { havai: 'Гавайська', price: 190 },  
        { kozak: 'Козацька', price: 150 },
        { margaret: 'Маргарита', price: 180 },
        { cezar: 'Цезаріо', price: 205 },  
        { mexic: 'Мексиканська', price: 210 },  
        { karbonara: 'Карбонара', price: 195 }, 
        { sea: 'Морська', price: 285 }, 
    ];
    
    bot.onText("Замовити", async (msg) => {
        const orderText = formatOrderText(getOrder(msg));
            await bot.sendMessage(msg.chat.id, orderText, {
                reply_markup: {
                    keyboard: [
                        ["Так", "Ні"],
                        ["◀️ · Назад до варіантів"]
                    ],
                    resize_keyboard: true
                }
            });
    });


    switch (ctx.data) {
        case "doneSalami":
            const salamiPizza = pizzas.find(pizza => pizza.salami);
            if (salamiPizza) {
                const caption = `✌️ · ${salamiPizza.salami}. \nСклад: Соус пелаті, сир моцарела, салямі. \nЦіна: ${salamiPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/salami.webp', { caption,
                    reply_markup: {
                        keyboard: [
                            ["Замовити Салямі"],
                            ["◀️ · Назад до варіантів"],
                            ["📃 · Моє замовлення"]
                        ],
                        resize_keyboard: true
                    }, 
                });
            }
            break;

        case "doneHavai":
            const havaiPizza = pizzas.find(pizza => pizza.havai);
            if (havaiPizza) {
                const caption = `✌️ · ${havaiPizza.havai}. \nСклад: Соус пелаті, сир моцарела, шинка, ананас. \nЦіна: ${havaiPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/havai.webp', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${havaiPizza.havai}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
            break;

        case "doneCezar":
            const cezarPizza = pizzas.find(pizza => pizza.cezar);
            if (cezarPizza) {
                const caption = `✌️ · ${cezarPizza.cezar}.\nСклад: Вершковий соус, авторський соус цезар, печене куряче філе, сир пармезан, салат айзберг, листя свіжого салату, перепелині яйця, помідор чері. \nЦіна: ${cezarPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/Cezar.webp', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${cezarPizza.cezar}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
        
            break;

        case "doneMargaret":
            const margaretPizza = pizzas.find(pizza => pizza.margaret);
            if (margaretPizza) {
                const caption = `✌️ · ${margaretPizza.margaret}.\nСклад: Соус пелаті, сир моцарела , помідор чері. \nЦіна: ${margaretPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/margaret.webp', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${margaretPizza.margaret}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
            break;
          
        case "doneMexic":
            const mexicPizza = pizzas.find(pizza => pizza.mexic);
            if (mexicPizza) {
                const caption = `✌️ · ${mexicPizza.mexic}.\nСоус пелаті, сир моцарела, бекон, чорізо, болгарський перець, помідор чері, синя цибуля, соус спайсі, перець чилі. \nЦіна: ${mexicPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/mexic.webp', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${mexicPizza.mexic}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
            break;
          
        case "doneCarbonara":
            const karbonaraPizza = pizzas.find(pizza => pizza.karbonara);
            if (karbonaraPizza) {
                const caption = `✌️ · ${karbonaraPizza.karbonara}.\nСклад: Вершковий соус, бекон, сир пармезан, синя цибуля, яєчний жовток. \nЦіна: ${karbonaraPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/karbonara.webp', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${karbonaraPizza.karbonara}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
            break;
          
        case "doneSea":
            const seaPizza = pizzas.find(pizza => pizza.sea);
            if (seaPizza) {
                const caption = `✌️ · ${seaPizza.sea}.\nСоус вершковий, сир моцарела, філе лосося, криветки, каперси, мікс салату, крем сир, помідори чері свіжі, сир пармезан, соус унагі.  \nЦіна: ${seaPizza.price}грн`;
                await bot.sendPhoto(ctx.message.chat.id, './img/vegan.jpg', { caption,
                
                    reply_markup: {
                        keyboard: [
                            [`Замовити ${seaPizza.sea}`],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }
                });
            }
            break;
    

    }
});




bot.onText(/📃 · Моє замовлення/, async (msg) => {
    bot.sendMessage(msg.chat.id, '1234')
});


// bot.onText(/ℹ️ · Моя інформація/, async (msg) => {
//   await bot.sendMessage(msg.chat.id, `😎 · Інформація про користувача\nІм'я: 123`, {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: "Змінити ім'я", callback_data: 'changeUsername' }, { text: 'Гавайська', callback_data: 'doneHavai' }],
//         [{ text: 'Мисливська', callback_data: 'doneHunter' }, { text: 'Маргарита', callback_data: 'doneMargaret' }],
//         [{ text: 'Барбекю', callback_data: 'doneBbq' }, { text: 'Карбонара', callback_data: 'doneCarbonara' }],
//         [{ text: 'Вегетаріанська', callback_data: 'doneSea' }],
//       ],

//     }
//   });
// });



console.log('Bot started')