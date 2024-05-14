require('dotenv').config()
const Bot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();

const token = `${process.env.SECRET_KEY}`;

const bot = new Bot(token, {
    polling: {
        interval: 300,
        autoStart: true
    }
});
bot.on("polling_error", (err) => {
    console.error(err);
    if (err && err.data && err.data.error && err.data.error.message) {
      console.log(err.data.error.message);
    }
});

const db = new sqlite3.Database('db.db', (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });
  
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      address TEXT,
      phone_number TEXT
    );`);
    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      pizza TEXT
    );`); // ^ title or id of pizza
    // db.run(`CREATE TABLE IF NOT EXISTS addresses(
    //     id INTEGER PRIMARY KEY,
    //     address TEXT
    // )`)
    db.run(`
    CREATE TABLE IF NOT EXISTS pizzas (
      id INTEGER PRIMARY KEY,
      title TEXT,
      composition TEXT,
      price INTEGER
    );`);
    
    db.run(`INSERT OR REPLACE INTO pizzas (id, title, composition, price) VALUES 
    (1, 'Салямі', 'Соус пелаті, сир моцарела, салямі.', '189'),
    (2, 'Гавайська', 'Соус пелаті, сир моцарела , помідор чері.', '180'),
    (3, 'Маргарита', 'Соус пелаті, сир моцарела , помідор чері.', '180'),
    (4, 'Цезаріо', 'Вершковий соус, авторський соус цезар, печене куряче філе, сир пармезан, салат айзберг, листя свіжого салату, перепелині яйця, помідор чері.', '205'),
    (5, 'Мексиканська', 'Соус пелаті, сир моцарела, бекон, чорізо, болгарський перець, помідор чері, синя цибуля, соус спайсі, перець чилі.', '210'),
    (6, 'Карбонара', 'Вершковий соус, бекон, сир пармезан, синя цибуля, яєчний жовток.', '195'),
    (7, 'Морська', 'Соус вершковий, сир моцарела, філе лосося, креветки, каперси, мікс салату, крем сир, помідори чері свіжі, сир пармезан, соус унагі.', '285');
    `);
});

const Cart = {
    orders: {},
    addOrder: function(userId, pizza) {
        if (!this.orders[userId]) {
            this.orders[userId] = [];
        }
        this.orders[userId].push(pizza);
    },
    clearOrder: function(userId) {
        delete this.orders[userId];
    },
    getOrder: function(userId) {
        return this.orders[userId];
    }
};
  

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
    await db.all("SELECT * FROM pizzas", async function (err, result) {
        const menu = result.map((item) => ([{
            text: item.title,
            callback_data: item.title
        }]))
        console.log(menu)
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
                inline_keyboard: menu
                // [
                //     [{ text: 'Салямі', callback_data: 'doneSalami' }, { text: 'Гавайська', callback_data: 'doneHavai' }],
                //     [{ text: 'Цезаріо', callback_data: 'doneCezar' }, { text: 'Маргарита', callback_data: 'doneMargaret' }],
                //     [{ text: 'Мексиканська', callback_data: 'doneMexic' }, { text: 'Карбонара', callback_data: 'doneCarbonara' }],
                //     [{ text: 'Морська', callback_data: 'doneSea' }],
                // ],
            }
        });
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
    await db.all("SELECT * FROM pizzas", async function (err, result) {
        const menu = result.map((item) => ([{
            text: item.title,
            callback_data: item.title
        }]))
        await bot.sendMessage(msg.chat.id, 'Обирай нижче.', {
            // get from DB
            reply_markup: {
                inline_keyboard: menu

            }
        });
    });

});


bot.on("callback_query", async (ctx) => {

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

    db.get('SELECT * FROM pizzas WHERE title = ?', [ctx.data], async function (err, result) {
        console.log('ONE ROW => ', result)
    })


    switch (ctx.data) {
        case "Салямі":
                db.get('SELECT * FROM pizzas WHERE id = 1', async function(err, row) {
                    if (row) {
                        const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                        console.log(row.title)
                        await bot.sendPhoto(ctx.message.chat.id, './img/salami.webp', { caption: pizza,
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
                })
                
            break;

        case "Гавайська":
            db.get('SELECT * FROM pizzas WHERE id = 2', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/havai.webp', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Гавайська"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
            break;

        case "Цезаріо":
            db.get('SELECT * FROM pizzas WHERE id = 4', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/Cezar.webp', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Цезаріо"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
        
            break;

        case "Маргарита":
            db.get('SELECT * FROM pizzas WHERE id = 3', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/margaret.webp', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Маргарита"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
            break;
          
        case "Мексиканська":
            db.get('SELECT * FROM pizzas WHERE id = 5', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/mexic.webp', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Мексиканська"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
            break;
          
        case "Карбонара":
            db.get('SELECT * FROM pizzas WHERE id = 6', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/karbonara.webp', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Карбонара"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
            break;
          
        case "Морська":
            db.get('SELECT * FROM pizzas WHERE id = 7', async function(err, row) {
                if (row) {
                    const pizza = '✌️ · ' + row.title + '\nСклад: ' + row.composition + '\nЦіна: ' + row.price + 'грн'
                    console.log(row.title)
                    await bot.sendPhoto(ctx.message.chat.id, './img/sea.jpg', { caption: pizza,
                        reply_markup: {
                            keyboard: [
                                ["Замовити Морська"],
                                ["◀️ · Назад до варіантів"],
                                ["📃 · Моє замовлення"]
                            ],
                            resize_keyboard: true
                        }, 
                    });
                }
            })
            break;
    

}})

    bot.onText(`Замовити Салямі`, async (ctx) => {
        Cart.addOrder(ctx.message.chat.id, salamiPizza); // Додайте цю піцу до замовлення користувача у кошику
        await bot.sendMessage(ctx.message.chat.id, `Піца ${salamiPizza.salami} була додана до вашого кошика.`);
        console.log('123') // Повідомте користувача, що піца була успішно додана до кошика
    });






bot.onText(/📃 · Моє замовлення/, async (msg) => {
    console.log(msg.chat.id);
    bot.sendMessage(msg.chat.id, '1234 sssss')
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