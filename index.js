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
        user_id INTEGER,
        name TEXT,
        phone_number TEXT,
        address TEXT,
        status TEXT
    );`);

    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      pizza TEXT,
      supplements TEXT,
      total_price INTEGER
    );`);

    db.run(`
    CREATE TABLE IF NOT EXISTS pizzas (
      id INTEGER PRIMARY KEY,
      title TEXT,
      composition TEXT,
      price INTEGER
    );`);

    db.run(`
    CREATE TABLE IF NOT EXISTS supplements (
      id INTEGER PRIMARY KEY,
      title TEXT,
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

    db.run(`INSERT OR REPLACE INTO supplements (id, title, price) VALUES 
    (1, 'Вода газована (0,5 мл) | 25грн', '25'),
    (2, 'Coca-Cola (0,75 л) | 45грн', '45'),
    (3, 'Coca-Cola (0,5 л) | 35грн', '35'),
    (4, 'Яблучний сік (0,95 мл) | 75грн', '75'),
    (5, 'Ананасовий сік (0,95 мл) | 75грн', '75'),
    (6, 'Мультифруктовий сік (0,95 мл) | 75грн', '75'),
    (7, 'Томатний сік (0,95 мл) | 75грн', '75'),
    (8, 'Банановий сік (0,95 мл) | 75грн', '75')
    `);
});


function mainMenuKeyboard() {
    return {
        keyboard: [
            ["🍕 · Меню"],
            ["📃 · Моє замовлення"],
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

bot.onText(/🍕 · Меню/, async (msg) => {
    const photo = './img/menu-footer.png';
    const caption = '🍕 · Меню.\nВибирай яку піцу хочеш: власну чи готовий варіант?';

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



async function getPizzaPrice(pizzaTitle) {
    return new Promise((resolve, reject) => {
        db.get('SELECT price FROM pizzas WHERE title = ?', [pizzaTitle], (err, row) => {
            if (err) {
                console.error('Error fetching pizza price:', err);
                reject(err);
            } else {
                if (row) {
                    resolve(row.price);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

async function addToCart(userId, pizzaTitle) {
    const price = await getPizzaPrice(pizzaTitle);
    if (price === null) {
        throw new Error(`Price for pizza "${pizzaTitle}" not found`);
    }

    return new Promise((resolve, reject) => {
        db.get('SELECT id, pizza, total_price FROM orders WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                console.error('Error fetching order:', err);
                reject(err);
            } else {
                if (row) {
                    const updatedPizzaList = row.pizza + `\n${pizzaTitle}`;
                    const updatedTotalPrice = row.total_price + price;
                    db.run('UPDATE orders SET pizza = ?, total_price = ? WHERE id = ?', [updatedPizzaList, updatedTotalPrice, row.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating order:', updateErr);
                            reject(updateErr);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    db.run('INSERT INTO orders (user_id, pizza, total_price) VALUES (?, ?, ?)', [userId, pizzaTitle, price], (insertErr) => {
                        if (insertErr) {
                            console.error('Error inserting new order:', insertErr);
                            reject(insertErr);
                        } else {
                            resolve();
                        }
                    });
                }
            }
        });
    });
}


bot.onText(/Замовити (Салямі|Гавайська|Маргарита|Цезаріо|Мексиканська|Карбонара|Морська)/, async (msg, match) => {
    const pizzaTitle = match[1];
    try {
        await addToCart(msg.chat.id, pizzaTitle);
        await bot.sendMessage(msg.chat.id, `Піца "${pizzaTitle}" додана до кошика.`);
    } catch (error) {
        await bot.sendMessage(msg.chat.id, `Виникла помилка: ${error.message}`);
    }
});

bot.onText(/📃 · Моє замовлення/, async (msg) => {
    db.get('SELECT pizza, supplements, total_price FROM orders WHERE user_id = ?', [msg.chat.id], async (err, row) => {
        if (err) {
            console.error('Error fetching order:', err);
            await bot.sendMessage(msg.chat.id, 'Виникла помилка при отриманні вашого замовлення.', {
                reply_markup: {
                    keyboard: [
                        ["🥤 · Додати додатки"],
                        ["🧺 · Замовити"],
                        ["◀️ · Назад до варіантів"]
                    ],
                    resize_keyboard: true
                }, 
            });
        } else {
           if (row) {
                const pizzas = row.pizza;
                const supplements = row.supplements ? `\n\nДодатки:\n${row.supplements}` : '';
                const totalPrice = row.total_price;
                await bot.sendMessage(msg.chat.id, `Ваше замовлення:\n${pizzas}${supplements}\n\nЗагальна сума: ${totalPrice} грн`, {
                    reply_markup: {
                        keyboard: [
                            ["🥤 · Додати додатки"],
                            ["🧺 · Замовити"],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }, 
                });
            } else {
                await bot.sendMessage(msg.chat.id, 'Ваш кошик порожній.', {
                    reply_markup: {
                        keyboard: [
                            ["🥤 · Додати додатки"],
                            ["🧺 · Замовити"],
                            ["◀️ · Назад до варіантів"]
                        ],
                        resize_keyboard: true
                    }, 
                });
            }
        }
    });
});

async function getSupplementPrice(supplementTitle) {
    return new Promise((resolve, reject) => {
        db.get('SELECT price FROM supplements WHERE title = ?', [supplementTitle], (err, row) => {
            if (err) {
                console.error('Error fetching supplement price:', err);
                reject(err);
            } else {
                if (row) {
                    resolve(row.price);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

async function addSupplementToCart(userId, supplementTitle) {
    const price = await getSupplementPrice(supplementTitle);
    if (price === null) {
        throw new Error(`Price for supplement "${supplementTitle}" not found`);
    }

    return new Promise((resolve, reject) => {
        db.get('SELECT id, supplements, total_price FROM orders WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                console.error('Error fetching order:', err);
                reject(err);
            } else {
                if (row) {
                    const updatedSupplementList = row.supplements ? row.supplements + `\n${supplementTitle}` : supplementTitle;
                    const updatedTotalPrice = row.total_price + price;
                    db.run('UPDATE orders SET supplements = ?, total_price = ? WHERE id = ?', [updatedSupplementList, updatedTotalPrice, row.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating order:', updateErr);
                            reject(updateErr);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    db.run('INSERT INTO orders (user_id, supplements, total_price) VALUES (?, ?, ?)', [userId, supplementTitle, price], (insertErr) => {
                        if (insertErr) {
                            console.error('Error inserting new order:', insertErr);
                            reject(insertErr);
                        } else {
                            resolve();
                        }
                    });
                }
            }
        });
    });
}

bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const supplementTitle = callbackQuery.data;

    try {
        await addSupplementToCart(message.chat.id, supplementTitle);
        await bot.sendMessage(message.chat.id, `Додаток "${supplementTitle}" доданий до кошика.`);
    } catch (error) {
        await console.error(message.chat.id, `Виникла помилка: ${error.message}`);
    }
});


bot.onText(/🥤 · Додати додатки/, async (msg) => {
    await db.all("SELECT * FROM supplements", async (err, result) => {
        const supplements = result.map((item) => ([{
            text: item.title,
            callback_data: item.title
        }]));
        await bot.sendMessage(msg.chat.id, 'Обирай нижче.', {
            reply_markup: {
                inline_keyboard: supplements
            }
        });
    });
});


const state = {};


bot.onText(/🧺 · Замовити/, async (msg) => {
    const userId = msg.chat.id;
    const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });

    if (!user) {
        db.run('INSERT INTO users (user_id, status) VALUES (?, ?)', [userId, 'awaiting_name'], (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                return;
            }
            bot.sendMessage(userId, 'Оформлення замовлення.', {
                reply_markup: {
                    keyboard: [
                        ["◀ · Назад до меню"]
                    ],
                    resize_keyboard: true
                }, 
            });
            bot.sendMessage(userId, `Вкажіть ваше ім'я.\nПриклад: Святослав`);
        });
    } else if (user.status !== 'completed') {
        bot.sendMessage(userId, `Продовжуємо збір даних. Вкажіть ваше ім'я.\nПриклад: Святослав`);
    } else {
        bot.sendMessage(userId, 'Оформлення замовлення.', {
            reply_markup: {
                keyboard: [
                    ["◀ · Назад до меню"]
                ],
                resize_keyboard: true
            }, 
        });
        bot.sendMessage(userId, `Ви вже зберегли адресу: ${user.address}. Бажаєте використати її для замовлення?`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Так', callback_data: 'use_saved_address' }],
                    [{ text: 'Ні', callback_data: 'update_address' }]
                ]
            }
        });
    }
});

bot.on('callback_query', (callbackQuery) => {
    const userId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'use_saved_address') {
        bot.sendMessage(userId, `Ваше замовлення прийняте з використанням збереженої адреси.\nОчікуйте дзвінка від кур'єра!`);
    } else if (data === 'update_address') {
        db.run('UPDATE users SET status = ? WHERE user_id = ?', ['awaiting_name', userId], (err) => {
            if (err) {
                console.error('Error updating user status:', err);
                return;
            }
            bot.sendMessage(userId, `Вкажіть ваше ім'я.\nПриклад: Святослав`);
        });
    }
});

bot.on('message', async (msg) => {
    const userId = msg.chat.id;
    const text = msg.text;

    const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });

    if (!user || !user.status) return;

    if (user.status === 'awaiting_name') {
        db.run('UPDATE users SET name = ?, status = ? WHERE user_id = ?', [text, 'awaiting_phone', userId], (err) => {
            if (err) {
                console.error('Error updating user name:', err);
                return;
            }
            bot.sendMessage(userId, 'Вкажіть ваш номер телефону:\nПриклад: +380987654321');
        });
    } else if (user.status === 'awaiting_phone') {
        db.run('UPDATE users SET phone_number = ?, status = ? WHERE user_id = ?', [text, 'awaiting_address', userId], (err) => {
            if (err) {
                console.error('Error updating user phone number:', err);
                return;
            }
            bot.sendMessage(userId, 'Вкажіть вашу адресу:\nПриклад:м. Івано-Франківськ, вул. Хороша, буд. 7, кв. 1');
        });
    } else if (user.status === 'awaiting_address') {
        db.run('UPDATE users SET address = ?, status = ? WHERE user_id = ?', [text, 'completed', userId], (err) => {
            if (err) {
                console.error('Error updating user address:', err);
                return;
            }
            bot.sendMessage(userId, `Ваші дані збережено.\nЗамовлення прийняте, очікуйте дзвінка від кур'єра!`);
        });
    }
});




// bot.onText(/📃 · Моє замовлення/, async (msg) => {
//     console.log(msg.chat.id + " @" + msg.from.username);

//     db.all('SELECT DISTINCT pizza FROM orders WHERE user_id = ?', [msg.chat.id], async function (err, result) {
//         if (result && result.length > 0) {
//             const pizzas = result.map(row => row.pizza).join('\n');
//             console.log('->', pizzas);
//             bot.sendMessage(msg.chat.id, 'Ваше замовлення:\n' + pizzas)
//         }
//     });
    

// });


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