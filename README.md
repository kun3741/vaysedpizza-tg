
# 🍕 Welcome to **Vaysed Pizza**.

**An interesting Telegram chat-bot for ordering pizza.**

![Screenshot](https://vaysed.trolling.today/gte9lyen.png)

Bot mainally created as an exam project for King Danylo University, but, actually, can used for some other things. Writed with **JavaScript**, using NodeJS libary **node-telegram-bot-api**, and **sqlite3** for databases.
Language - **Ukrainian. 🇺🇦** 

Using this bot as a common user, you can choose what you want to order:
- **Done pizzas options:**
  - Salami
  - Hawaiian
  - Margarita
  - Cesario
  - Mexican
  - Carbonara
  - Sea
- **Self pizza (handmade, using proposed options for fillings):**
  - Tomato sauce
  - Cream sauce
  - Salami
  - Fried chicken
  - Ham
  - Cheese
  - Parmesan
  - Tomato
  - Pickled corn
  - Onion
  - Bell pepper

Also, when user makes an order, bot propose to choose some **attachments to order:**
 - Carbonated water
 - Coca-Cola
 - Apple juice
 - Pineapple juice
 - Multifruit juice
 - Tomato juice
 - Banana juice

All aforementioned things saving in database **db.db**, from which the bot conveniently uses them in further work.
Also bot saving information about **user address, name and phone number**, for future ease of input.
## ⭐ Run Locally

Clone the project
```bash
  git clone https://github.com/kun3741/vaysedpizza-tg
```

Go to the project directory
```bash
  cd vaysedpizza-tg
```

Install dependencies
```bash
  npm install package.json
```

Start the bot
```bash
  node index.js
```


## ❗ Environment Variables

To run this project, you will need to create and add `SECRET_KEY` environment variables to your .env file.
You can find information about how to get this key, which names **token**, [here](https://core.telegram.org/bots/tutorial).



## 👤 About developer
**Project made first-year student of King Danylo University, specialization «121 - Software Engineering», Volodymyr Dedeliuk.**

[![bio](https://img.shields.io/badge/Bio_Webpage-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://monke.party/kun)
[![telegram](https://img.shields.io/badge/telegram-1DA1F2?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/kun3741)
[![twitter](https://img.shields.io/badge/email-ffbf00?style=for-the-badge&logo=gmail&logoColor=black)](mailto:vaysed.dev@gmail.com/)

