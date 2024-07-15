# Site Uptime Monitor

A tool for monitoring website uptime and sending status updates to Discord via webhook.

## Overview

This project monitors the availability of a specified website and sends notifications to a Discord channel using a webhook whenever the website's status changes. It uses `axios` for HTTP requests, `discord.js` for interacting with Discord, `dotenv` for environment variable management, and `mongodb` for storing message IDs to avoid duplicate notifications.

## Features

- Monitors website availability every minute.
- Sends notifications only on status changes to prevent spam and resends a new message if the previous one is deleted accidentally.
- Manages notifications efficiently by updating message IDs in MongoDB, replacing deleted messages and preventing database bloat.

## Setup

1. **Create a Repository from Template**

   Click the "Use this template" button on the GitHub repository page to create a new repository from this template.

2. **Add Repository Secrets**

   Go to your repository settings on GitHub:

   - Navigate to `Settings` > `Secrets and variables` > `Actions`.
   - Add the following secrets:

     - `WEBSITE_URL`: The URL of the website you want to monitor.
     - `WEBHOOK_URL`: Your Discord webhook URL.
     - `MONGO_URI`: MongoDB connection URI.
     - `MONGO_DB_NAME`: MongoDB database name.
     - `MONGO_COLLECTION_NAME`: MongoDB collection name for storing message IDs.

3. **Run the GitHub Action**

   Go to the `Actions` tab of your repository:

   - Find the "Monitor Website" workflow.
   - Click "Run workflow" to start the monitoring process.

## Need Help with MongoDB?

If you’re unsure how to set up MongoDB, you can check out this [tutorial on YouTube](https://www.youtube.com/watch?v=jXgJyuBeb_o) for guidance.
