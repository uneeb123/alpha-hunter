# Scripts

## Create users and alpha

Read the information from `src/scripts/users.json` and updates the tables
Operation is idempotent

```
pnpm bulk-add-users -d verbose
```

## Delete all scrapers and users

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
