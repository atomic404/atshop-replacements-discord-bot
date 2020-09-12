# atshop-replacements-discord-bot
ATShop.io | Discord Bot to replace atshop.io orders.

# Requirements
  - [NodeJS](https://nodejs.org/en/download/)

# Usage
  - Type the following commands into your discord server:
   * `$get order_id`
   * `$replace order_id amountOfReplacements`

# Installation

- Edit `tkn, atshopTkn, & atshopLink` variables first.

```
npm install discord.js moment ddp ddp-login pm2 -g

pm2 start index.js --watch --name "Bot"
```
