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
      order_date TEXT,
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
    CREATE TABLE IF NOT EXISTS handmade (
      id INTEGER PRIMARY KEY,
      category TEXT,
      title TEXT,
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

    db.run(`INSERT OR REPLACE INTO handmade (id, category, title, price) VALUES 
    (1, 'Соус', 'Томатний соус', 20),
    (2, 'Соус', 'Вершковий соус', 25),
    (3, 'М‛ясо', 'Салямі', 45),
    (4, 'М‛ясо', 'Курка копчена', 50),
    (5, 'М‛ясо', 'Шинка', 50),
    (6, 'Сир', 'Сир твердий', 40),
    (7, 'Сир', 'Пармезан', 60),
    (8, 'Овочі', 'Помідор', 20),
    (9, 'Овочі', 'Кукурудза', 20),
    (10, 'Овочі', 'Цибуля', 15),
    (11, 'Овочі', 'Перець', 30)
    `);
});


function mainMenuKeyboard() {
    return {
        keyboard: [
            ["🍕 · Меню"],
            ["📃 · Моє замовлення"]
        ],
        resize_keyboard: true
    };
}

bot.onText(/\/start/, async (msg) => {
    const photo = './img/start.png';
    const caption = '✌️ · Вітаємо в Vaysed Pizza!\nХочете свіженьку піцулю тут і зараз? Ви у правильному місці.\nВикористовуйте меню внизу, щоб оформити замовлення.';

    await bot.sendPhoto(msg.chat.id, photo, {
        caption,
        reply_markup: mainMenuKeyboard()
    });
});

bot.onText(/🍕 · Меню/, async (msg) => {
    const photo = './img/menu-footer.png';
    const caption = '🍕 · Меню.\nВибирайте яку піцу хочете: власну чи готовий варіант?';

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
        await bot.sendMessage(msg.chat.id, 'Обирайте нижче.', {
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
        await bot.sendMessage(msg.chat.id, 'Обирайте нижче.', {
            reply_markup: {
                inline_keyboard: menu

            }
        });
    });

});


bot.on("callback_query", async (ctx) => {
    const data = ctx.data;
    db.get('SELECT * FROM pizzas WHERE title = ?', [data], async function (err, result) {
        if (result) {
            await handlePizzaSelection(ctx, data);
        }
    });
});

async function handlePizzaSelection(ctx, pizzaTitle) {
    const photoMap = {
        "Салямі": './img/salami.webp',
        "Гавайська": './img/havai.webp',
        "Цезаріо": './img/Cezar.webp',
        "Маргарита": './img/margaret.webp',
        "Мексиканська": './img/mexic.webp',
        "Карбонара": './img/karbonara.webp',
        "Морська": './img/sea.jpg'
    };

    db.get('SELECT * FROM pizzas WHERE title = ?', [pizzaTitle], async function(err, row) {
        if (row) {
            const pizza = `✌️ · ${row.title}\nСклад: ${row.composition}\nЦіна: ${row.price} грн`;
            await bot.sendPhoto(ctx.message.chat.id, photoMap[pizzaTitle], {
                caption: pizza,
                reply_markup: {
                    keyboard: [
                        [`Замовити ${row.title}`],
                        ["📃 · Моє замовлення"],
                        ["◀️ · Назад до варіантів"]
                    ],
                    resize_keyboard: true
                }
            });
        }
    });
}

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

async function addToCart(userId, pizzaTitle, supplements = '') {
    const price = await getPizzaPrice(pizzaTitle);
    if (price === null) {
        throw new Error(`Price for pizza "${pizzaTitle}" not found`);
    }

    const date = new Date();
    const formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);

    return new Promise((resolve, reject) => {
        db.run('INSERT INTO orders (user_id, pizza, supplements, total_price, order_date) VALUES (?, ?, ?, ?, ?)', 
               [userId, pizzaTitle, supplements, price, formattedDate], 
               function(err) {
            if (err) {
                console.error('Error adding to cart:', err);
                reject(err);
            } else {
                resolve(this.lastID); 
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
                        ["🥤 · Додати додатки", "🛒 · Замовити", "🗑️ · Очистити"],
                        ["◀ · Назад до меню"]                        
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
                            ["🥤 · Додати додатки", "🛒 · Замовити", "🗑️ · Очистити"],
                            ["◀ · Назад до меню"]
                        ],
                        resize_keyboard: true
                    },
                });
            } else {
                await bot.sendMessage(msg.chat.id, 'Ваш кошик порожній.', {
                    reply_markup: {
                        keyboard: [
                            ["◀ · Назад до меню"]
                        ],
                        resize_keyboard: true
                    },
                });
            }
        }
    });
});

bot.onText(/🗑️ · Очистити/, async (msg) => {
    db.run('DELETE FROM orders WHERE user_id = ?', [msg.chat.id], async (err) => {
        if (err) {
            console.error('Error deleting order:', err);
            await bot.sendMessage(msg.chat.id, 'Виникла помилка при очищенні вашого замовлення.', {
                reply_markup: {
                    keyboard: [
                        ["◀ · Назад до меню"]
                    ],
                    resize_keyboard: true
                },
            });
        } else {
            await bot.sendMessage(msg.chat.id, 'Ваше замовлення було очищено.', {
                reply_markup: {
                    keyboard: [
                        ["◀ · Назад до меню"]
                    ],
                    resize_keyboard: true
                },
            });
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
                    db.run('UPDATE orders SET supplements = ?, total_price = ? WHERE id = ?', 
                        [updatedSupplementList, updatedTotalPrice, row.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating order:', updateErr);
                            reject(updateErr);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    db.run('INSERT INTO orders (user_id, supplements, total_price) VALUES (?, ?, ?, ?)', 
                        [userId, supplementTitle, price], (insertErr) => {
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
        await bot.sendMessage(msg.chat.id, '🥤 · Додатки.', {
            reply_markup: {
                keyboard: [
                    ["📃 · Моє замовлення"]
                ], 
                resize_keyboard: true
            }
        });
        await bot.sendMessage(msg.chat.id, 'Обирайте нижче.', {
            reply_markup: {
                inline_keyboard: supplements
            }
        });
    });
});


bot.onText(/🛒 · Замовити/, async (msg) => {
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
            bot.sendMessage(userId, '🥳 · Оформлення замовлення.', {
                reply_markup: {
                    remove_keyboard: true
                }, 
            });
            setTimeout(() => {
                bot.sendMessage(userId, `Вкажіть ваше ім'я.\nПриклад: Святослав`);
            }, 100);
        });
    } else if (user.status !== 'completed') {
        setTimeout(() => {
            bot.sendMessage(userId, `Продовжуємо збір даних. Вкажіть ваше ім'я.\nПриклад: Святослав`);
        }, 100);
    } else {
        bot.sendMessage(userId, '🥳 · Оформлення замовлення.', {
            reply_markup: {
                remove_keyboard: true
            }, 
        });
        setTimeout(() => {
            bot.sendMessage(userId, `Ви вже зберегли адресу: ${user.address}. Бажаєте використати її для замовлення?`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Так', callback_data: 'use_saved_address' }],
                        [{ text: 'Ні', callback_data: 'update_address' }]
                    ]
                }
            });
        }, 100);
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

const pizzaState = {};

bot.onText(/🖌️ · Власна піца/, async (msg) => {
    const userId = msg.chat.id;
    pizzaState[userId] = { sauce: null, meat: null, cheese: null, veggies: [] };
    bot.sendPhoto(userId, './img/handmade.webp', { caption: "🖌️ · Створення власної піци.",
        reply_markup: {
            keyboard: [
                ["◀ · Назад до меню"]
            ],
            resize_keyboard: true
        }, 
    });
    setTimeout(() => {
        bot.sendMessage(userId, "Оберіть соус:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🥫️ Томатний соус | 20грн', callback_data: '1' }],
                    [{ text: '🫙️ Вершковий соус | 20грн', callback_data: '2' }]
                ]
            }
        });
    }, 200);
});

bot.on('callback_query', async (callbackQuery) => {
    const userId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (!pizzaState[userId]) return;

    const addIngredientAndAskNext = (ingredientType, nextMessage, nextOptions) => {
        const ingredientId = parseInt(data);
        db.get('SELECT * FROM handmade WHERE id = ?', [ingredientId], (err, row) => {
            if (err) {
                console.error(`Error fetching ${ingredientType}:`, err);
                return;
            }
            pizzaState[userId][ingredientType] = row;
            bot.answerCallbackQuery(callbackQuery.id, {
                text: `${row.title} додано`,
                show_alert: false,
            });

            bot.editMessageText(nextMessage, {
                chat_id: userId,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: nextOptions
                }
            });
        });
    };

    if (!pizzaState[userId].sauce) {
        addIngredientAndAskNext('sauce', "Оберіть м'ясо:", [
            [{ text: "🔴 Салямі | 45грн", callback_data: '3' }],
            [{ text: "🍗 Курка копчена | 50грн", callback_data: '4' }],
            [{ text: "🍖 Шинка | 50грн", callback_data: '5' }]
        ]);
    } else if (!pizzaState[userId].meat) {
        addIngredientAndAskNext('meat', "Оберіть сир:", [
            [{ text: "🧀️ Сир твердий | 40грн", callback_data: '6' }],
            [{ text: "🧀️ Пармезан | 60грн", callback_data: '7' }]
        ]);
    } else if (!pizzaState[userId].cheese) {
        addIngredientAndAskNext('cheese', "Оберіть овочі:", [
            [{ text: "🍅 Помідор | 20грн", callback_data: '8' }],
            [{ text: "🌽 Кукурудза | 20грн", callback_data: '9' }],
            [{ text: "🧅 Цибуля | 15грн", callback_data: '10' }],
            [{ text: "🫑 Перець | 30грн", callback_data: '11' }],
            [{ text: "Закінчити вибір овочів", callback_data: 'done_veggies' }]
        ]);
    } else if (data === 'done_veggies') {
        const pizza = pizzaState[userId];
        const basePrice = 60; 
        const totalPrice = basePrice + pizza.sauce.price + pizza.meat.price + pizza.cheese.price + pizza.veggies.reduce((sum, veggie) => sum + veggie.price, 0);

        let orderSummary = `Ваша піца:\n- Соус: ${pizza.sauce.title}\n- М'ясо: ${pizza.meat.title}\n- Сир: ${pizza.cheese.title}\n- Овочі:\n`;
        pizza.veggies.forEach((veggie) => {
            orderSummary += `  - ${veggie.title}\n`;
        });
        orderSummary += `Загальна вартість: ${totalPrice} грн`;

        bot.editMessageText(orderSummary, {
            chat_id: userId,
            message_id: callbackQuery.message.message_id
        });

        const pizzaDescription = `\nВласна піца: ${pizza.sauce.title}, ${pizza.meat.title}, ${pizza.cheese.title}, ${pizza.veggies.map(veggie => veggie.title).join(", ")}`;

        db.get('SELECT * FROM orders WHERE user_id = ?', [userId], (err, row) => {
            if (err) {
                console.error('Error fetching order:', err);
                return;
            }

            if (row) {
                const updatedPizzaList = row.pizza ? row.pizza + `\n${pizzaDescription}` : pizzaDescription;
                const updatedTotalPrice = row.total_price ? row.total_price + totalPrice : totalPrice;

                db.run('UPDATE orders SET pizza = ?, total_price = ? WHERE user_id = ?', [
                    updatedPizzaList,
                    updatedTotalPrice,
                    userId
                ], (err) => {
                    if (err) {
                        console.error('Error updating order:', err);
                        return;
                    }
                    bot.sendMessage(userId, 'Ваше замовлення оновлено!');
                });
            } else {
                db.run('INSERT INTO orders (user_id, pizza, total_price) VALUES (?, ?, ?)', [
                    userId,
                    pizzaDescription,
                    totalPrice
                ], (err) => {
                    if (err) {
                        console.error('Error inserting order:', err);
                        return;
                    }
                    bot.sendMessage(userId, 'Ваше замовлення збережено!');
                });
            }

            delete pizzaState[userId];
        });
    } else {
        db.get('SELECT * FROM handmade WHERE id = ?', [parseInt(data)], (err, row) => {
            if (err) {
                console.error('Error fetching veggie:', err);
                return;
            }
            pizzaState[userId].veggies.push(row);

            bot.answerCallbackQuery(callbackQuery.id, {
                text: `${row.title} додано`,
                show_alert: false,
            });
            bot.editMessageText("Овоч додано. Оберіть ще овоч або натисніть 'Закінчити вибір овочів' коли завершите:", {
                chat_id: userId,
                message_id: callbackQuery.message.message_id,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🍅 Помідор | 20грн", callback_data: '8' }],
                        [{ text: "🌽 Кукурудза | 20грн", callback_data: '9' }],
                        [{ text: "🧅 Цибуля | 15грн", callback_data: '10' }],
                        [{ text: "🫑 Перець | 30грн", callback_data: '11' }],
                        [{ text: "Закінчити вибір овочів", callback_data: 'done_veggies' }]
                    ]
                }
            });
        });
    }
});


console.log('Bot started')