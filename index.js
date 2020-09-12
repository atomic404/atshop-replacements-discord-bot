const Discord = require('discord.js');
const moment = require('moment');
const DDP = require('ddp');
const Login = require('ddp-login');

const client = new Discord.Client();
const DDPClient = new DDP({url: 'wss://atshop.io/websocket'});

// Insert your discord token here
const tkn = '';

// https://docs.atshop.io/guide/authentication.html#fetching-your-login-token
const atshopTkn = '';
const atshopLink = 'https://yourshop.atshop.io/'; // Make sure you have a '/' at the end

// Prefix for the discord bot.
const prefix = '$';

// Picture for some random commands
const pic = 'https://link.com/picture.png';


// Connecting to discord.js && atshop.io ws
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

DDPClient.connect((err, reconnected) => {
    if (err) {
        throw err;
    }

    Login.loginWithToken(DDPClient, atshopTkn, (err, user) => {
        console.log(`You are now logged in.`)
    })
});

function getOrder(message, args) {
    const ebed = new Discord.RichEmbed()
        .setAuthor(message.author.tag, message.author.avatarURL)
        .setDescription(`Payment is pending - items will be issued to the customer once funds have come through.\nIf you think this is a mistake, and the customer has proven the funds have gone thru, please issue the following command:\n\n\`\`\`${prefix}fulfill order_id\`\`\``)
        .setTimestamp()
        .setThumbnail(message.author.avatarURL)
        .setColor(0xff0000);
    const ebed2 = new Discord.RichEmbed()
        .setAuthor(message.author.tag, message.author.avatarURL)
        .setDescription(`Please use the command in the following format:\n\n\`\`\`${prefix}get order_id\`\`\``)
        .setTimestamp()
        .setThumbnail(message.author.avatarURL)
        .setColor(0xff0000)

    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    let orderID = args[0];
    if (!orderID) return message.channel.send(ebed2);

    DDPClient.subscribe('order', [orderID], () => {
        const collection = DDPClient.collections['shop.orders']; // Array of orders you're subscribed to.
        const order = collection[orderID]; // Your order.

        let ebc = '';
        let meaning = {
            reversed: 'The customer triggered a chargeback for this order, reverting funds back to the customer.',
            completed: 'Order was paid for and fulfilled.',
            discarded: 'Order was discarded by the shop administrator.',
            hold: 'Pending manual review by the shop administrator.'
        }
        if (order.status == 'reversed') ebc += meaning.reversed;
        if (order.status == 'completed') ebc += meaning.completed;
        if (order.status == 'discarded') ebc += meaning.discarded;
        if (order.status == 'hold') ebc += meaning.hold;

        if (!order.paid) return message.channel.send(ebed);
        let ago = moment(order.paidAt).fromNow();

        DDPClient.subscribe('ordered.product', [orderID], () => {
            const collection = DDPClient.collections['shop.products'];
            var product = collection[order.productId];

            DDPClient.subscribe('order.items', [orderID], () => {
                const soldStock = DDPClient.collections['shop.product.stock'];
                let receivedGoods = '';

                if (order.quantity.length > 5) {
                    receivedGoods += 'Too many accounts to be displayed here.';
                } else {
                    Object.values(soldStock).forEach(acc => {
                        receivedGoods += `${acc.entry}\n`
                    });
                }

                const embed = new Discord.RichEmbed()
                    .setTitle(`Order ID: ${orderID}`)
                    .setAuthor(order.email, pic)
                    .setDescription(`[Click here to go to the order page](${atshopLink}admin/order/${orderID}/items)`)
                    .setFooter(`${atshopLink} | Purchased ${ago}`)
                    .addField(`Product Name`, product.name, true)
                    .addField(`Current Stock`, product.stockCount, true)
                    .addField(`Payment Gateway`, order.paymentMethod, true)
                    .addField(`Fulfilled - ${order.fulfilled}`, `${ebc}`, true)
                    .addField(`Quantity`, `${order.quantity}`, true)
                    .addField(`Price`, `$${order.paidAmount / 100}`, true)
                    //.addField(`Received Digital Goods (${order.quantity})`, `\`\`\`${receivedGoods}\`\`\``) // Atshop fucks this up sometimes
                    .setThumbnail(pic)
                    .setColor(0xff0000)
                message.channel.send(embed)
            })
        });
    });
};

function replaceOrder(message, args) {
    const ebed = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.avatarURL).setDescription(`Payment is pending - items will be issued to the customer once funds have come through.\nIf you think this is a mistake, and the customer has proven the funds have gone thru, please issue the following command:\n\n\`\`\`${prefix}fulfill order_id\`\`\``).setTimestamp().setThumbnail(message.author.avatarURL).setColor(0xff0000);
    const ebed2 = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.avatarURL).setDescription(`Please use the command in the following format:\n\n\`\`\`${prefix}get order_id\`\`\``).setTimestamp().setThumbnail(message.author.avatarURL).setColor(0xff0000)
    const ebed3 = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.avatarURL).setDescription(`No stock found for this product.`).setTimestamp().setThumbnail(message.author.avatarURL).setColor(0xff0000)
    const ebed4 = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.avatarURL).setDescription(`Replacement has been sent to email.`).setTimestamp().setThumbnail(message.author.avatarURL).setColor(0xff0000)
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    let orderID = args[0];
    let amount = parseInt(args[1]) || 1;
    if (!orderID) return message.channel.send(ebed2);

    DDPClient.subscribe('order', [orderID], () => {
        const collection = DDPClient.collections['shop.orders']; // Array of orders you're subscribed to.
        const order = collection[orderID]; // Your order.

        if (!order.paid) return message.channel.send(ebed);
        DDPClient.call('admin.orders.replace', [order.shopId, orderID, amount, 'replaced thru discord bot.'], (err) => {
            if (err) {
                console.error(err)
                return message.channel.send(ebed3)
            };
            message.channel.send(ebed4)
        });
    });
};

client.on("message", async(message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.content.startsWith(prefix)) {
        let args = message.content.substring(prefix.length).split(" ");
        let command = args.shift();
        switch (command) {
            case "get":
                return getOrder(message, args);
            case "replace":
                return replaceOrder(message, args);
        }
    }
});

client.login(tkn);
