# Running clustering

curl -X POST http://localhost:3000/api/visualization/tweet-embeddings/compute

# Running Telegram Message Handler Locally

curl -X POST https://admin.singularitylabs.co/api/telegram/delete-webhook
ngrok http 3000
copy paste the forwarding URL
pnpm dev
curl -X POST https://<PRODUCTION_URL>/api/telegram/set-webhook
curl -X POST https://<PRODUCTION_URL>/api/telegram/delete-webhook
curl -X POST https://admin.singularitylabs.co/api/telegram/set-webhook

curl -X POST https://e664-2601-646-300-5e0-b974-eee8-c8c9-d14c.ngrok-free.app/api/telegram/set-webhook

## Setting up Maix locally

curl -X POST https://admin.singularitylabs.co/api/maix/delete-webhook
ngrok http 3000
Make sure to replace PRODUCTION_URL in Environment Variables
pnpm dev
curl -X POST https://2ccb-2600-1700-14be-86df-5859-5984-1c0b-c262.ngrok-free.app/api/maix/set-webhook
curl -X POST https://2ccb-2600-1700-14be-86df-5859-5984-1c0b-c262.ngrok-free.app/api/maix/delete-webhook
curl -X POST https://admin.singularitylabs.co/api/maix/set-webhook

## Manually broadcast

curl -X GET https://admin.singularitylabs.co/api/maix/broadcast
curl -X GET https://2d31-2601-646-300-5e0-e8c2-57a8-8edd-a354.ngrok-free.app/api/maix/broadcast

# Telegram Bot

## Commands

start - Initiates the bot
settings - Manage your subscription and customize your preferences

## Populate database manually with Token info

curl -X POST http://localhost:3000/api/update-tokens

# Scripts

## Management

#### Create users and alpha

Read the information from `src/scripts/users.json` and updates the tables
Operation is idempotent

```
pnpm bulk-add-users -d verbose
```

#### Delete all scrapers and users

```
pnpm delete-all
```

## Scrape

Can be run multiple times without issues

```
pnpm scrape
pnpm scrape --debug verbose --loop
pnpm scrape -d verbose
```

## Extract

```
pnpm extract --alpha KAITO --debug verbose
pnpm extract -a KAITO -d verbose --dry-run
pnpm extract --alpha GENERAL --telegram
pnpm extract --alpha GENERAL --telegram --langchain
```

## To run test scripts

```
npx tsx src/scripts/test/twitter.ts
npx tsx src/scripts/test/telegram.ts
```

# Workflow

There are two major sequence of operations that need to happen. First we get data from Twitter using their API. But because their API has limits, we need to constantly call their API and retry and save the results in a Database.

## Workflow 1: Data gathering

There is only one step here fetch timeline for every user

Keep running it in a loop

## Workflow 2: Finding Alpha

We take the fetched timeline and convert it to processed tweets.
After getting the process tweets, we convert the tweets to a book like format. Then we run a couple of different things on it.

- Summarizer to tweet generate content for tweet
- Create audio for podcast which in turn is used for creating video content for a podcast

### Schema

User

- TwitterID
- TwitterName
- TwitterUser

Alpha

- Name
- Users

Scraper

- Status (STARTED, PAUSED, FINISHED)
- WhenToResume?
- StartTime
- EndTime

ScraperUser

- ID
- ScrapperID
- UserID
- LastFetchedTweetID
- ScrapedFilePath?

Processor

- ID
- Alpha
- ProcessedFilePath
- CreatedAt

ProcessorUser

- UserID
- ProcessorID
- FirstProcessedTweetID
- LastProcessedTweetID

Queries

- What is the last scrapped Tweet ID for a user?
- What is the last processed Tweet ID for a user?
- Fetch all the new tweets since processed ID?
