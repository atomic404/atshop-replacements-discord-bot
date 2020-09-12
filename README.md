# atshop-replacements-discord-bot
ATShop.io | Discord Bot to replace atshop.io orders.
- Reason for leaking this: legacy didn't pay

# Requirements
  - [NodeJS](https://nodejs.org/en/download/)

# Usage
  - Type the following commands into your discord server:
   * `$get order_id`
   * `$replace order_id amountOfReplacements`

# Installation

- Make sure to enable this to prevent people from inviting the bot and exploiting your orders.
![Disabling public bot](https://i.imgur.com/gbDDDKu.png)

- Edit `tkn, atshopTkn, & atshopLink` variables first.

```
npm install discord.js moment ddp ddp-login pm2 -g

pm2 start index.js --watch --name "Bot"
```
