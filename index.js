const axios = require('axios');
const { WebhookClient, MessageEmbed } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');
const { MongoClient } = require('mongodb');

dotenv.config();

const WEBSITE_URL = process.env.WEBSITE_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME;

let HTTP_STATUS_DESCRIPTIONS = {};

try {
    const data = fs.readFileSync('status_descriptions.json', 'utf8');
    HTTP_STATUS_DESCRIPTIONS = JSON.parse(data);
} catch (error) {
    console.error("Failed to read or parse status_descriptions.json:", error);
}

if (!WEBSITE_URL || !WEBHOOK_URL || !MONGO_URI || !MONGO_DB_NAME || !MONGO_COLLECTION_NAME) {
    console.error("Please provide WEBSITE_URL, WEBHOOK_URL, MONGO_URI, MONGO_DB_NAME, and MONGO_COLLECTION_NAME in the .env file.");
    process.exit(1);
}

const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
let previousStatus = null; // Variable to store the previous status

async function sendDiscordMessage(title, description, color, timestamp) {
    const embed = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp(timestamp);

    try {
        const message = await webhookClient.send({ embeds: [embed] });
        console.log("Discord message sent successfully. Message ID:", message.id);
        return message.id; // Return the message ID
    } catch (error) {
        console.error("Failed to send Discord message:", error);
        return null;
    }
}

async function connectToMongoDB() {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(MONGO_DB_NAME).collection(MONGO_COLLECTION_NAME);
}

async function getPreviousMessageId(collection) {
    const document = await collection.findOne({});
    return document ? document.messageId : null;
}

async function updateMessageId(collection, newMessageId) {
    const previousMessageId = await getPreviousMessageId(collection);
    if (previousMessageId) {
        await deleteMessageId(collection, previousMessageId);
    }
    await collection.updateOne({}, { $set: { messageId: newMessageId } }, { upsert: true });
    console.log(`Message ID ${newMessageId} added to the database.`);
}

async function deleteMessageId(collection, messageId) {
    await collection.deleteOne({});
    console.log(`Old Message ID ${messageId} removed from the database.`);
}

async function checkPreviousMessage(collection) {
    const previousMessageId = await getPreviousMessageId(collection);
    if (previousMessageId) {
        const exists = await webhookClient.fetchMessage(previousMessageId).then(() => true).catch(() => false);
        return exists ? previousMessageId : null;
    }
    return null;
}

async function monitorWebsite() {
    const collection = await connectToMongoDB();

    const existingMessageId = await checkPreviousMessage(collection);
    if (existingMessageId) {
        console.log("Previous message exists with ID:", existingMessageId);
        previousStatus = "up"; // Assume previous status was up if the message exists
    }

    while (true) {
        try {
            const response = await axios.get(WEBSITE_URL);
            console.log("Website is available.");
            if (previousStatus !== "up") {
                const messageId = await sendDiscordMessage(
                    "Dantotsu is Available",
                    "Available",
                    '#dedede',
                    new Date()
                );
                await updateMessageId(collection, messageId);
                previousStatus = "up";
            } else {
                const previousMessageId = await getPreviousMessageId(collection);
                if (previousMessageId) {
                    const exists = await webhookClient.fetchMessage(previousMessageId).then(() => true).catch(() => false);
                    if (!exists) {
                        const messageId = await sendDiscordMessage(
                            "Dantotsu is Available",
                            "Available",
                            '#dedede',
                            new Date()
                        );
                        await updateMessageId(collection, messageId);
                    }
                }
            }
        } catch (error) {
            const statusCode = error.response ? error.response.status : 'Unknown';
            const statusDescription = error.response ? HTTP_STATUS_DESCRIPTIONS[statusCode] || 'Unknown Status' : 'No response from server';
            console.error(`Website is down: HTTP ERROR ${statusCode} - ${statusDescription}`);
            if (previousStatus !== "down") {
                const messageId = await sendDiscordMessage(
                    "Dantotsu is Reporting Error",
                    `HTTP ERROR ${statusCode} - ${statusDescription}`,
                    '#dedede',
                    new Date()
                );
                await updateMessageId(collection, messageId);
                previousStatus = "down";
            } else {
                const previousMessageId = await getPreviousMessageId(collection);
                if (previousMessageId) {
                    const exists = await webhookClient.fetchMessage(previousMessageId).then(() => true).catch(() => false);
                    if (!exists) {
                        const messageId = await sendDiscordMessage(
                            "Dantotsu is Reporting Error",
                            `HTTP ERROR ${statusCode} - ${statusDescription}`,
                            '#dedede',
                            new Date()
                        );
                        await updateMessageId(collection, messageId);
                    }
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 60000)); // Check every minute
    }
}

console.log("Starting website monitoring...");
monitorWebsite();
