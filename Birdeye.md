_This document lists Birdeye APIs that can be called to fetch token information._

# Birdeye

https://docs.birdeye.so/

## Pricing

| Package          | Base Price (A) | Included Compute Units (B) | Data Access                    | Rate Limit (E)           | Cost per 1M additional CUs (F) |
| ---------------- | -------------- | -------------------------- | ------------------------------ | ------------------------ | ------------------------------ |
| Standard         | \$0            | 0.3 Million                | Limited                        | 1 rps\*                  | No additional CUs              |
| Starter          | \$99           | 3 Million                  | Most APIs                      | 15 rps\*                 | \$33                           |
| Premium          | \$199          | 10 Million                 | Most APIs                      | 50 rps\*, 1,000 rpm\*\*  | \$9.9                          |
| Business         | \$699          | 50 Million                 | All APIs + Websockets \*\*\*   | 100 rps\*, 1,500 rpm\*\* | \$6.9                          |
| Business Classic | \$999          | 50M CU APIs + 50M CU WS    | All APIs + Websockets \*\*\*\* | 1,500 rpm\*\*            | \$5.9 for API, \$3.5 for WS    |
| Enterprise       | Custom         | Custom                     | Custom                         | Custom                   | Custom                         |

**Notes:**

- \*rps = requests per second
- \*\*rpm = requests per minute

## Accessibility by Packages

| Specs / Endpoint                                                       | Standard | Starter |   Premium    |   Business   |  Enterprise  |
| ---------------------------------------------------------------------- | :------: | :-----: | :----------: | :----------: | :----------: |
| **Integrated**                                                         |          |         |              |              |              |
| Token List (V1) (`/defi/tokenlist`)                                    |    ✅    |   ✅    |      ✅      |      ✅      |      ✅      |
| Token List (V3) (`/defi/v3/token/list`)                                |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token Overview (`/defi/token_overview`)                                |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - New Listing (`/defi/v2/tokens/new_listing`)                    |          |   ✅    | ✅ (not SUI) | ✅ (not SUI) | ✅ (not SUI) |
| Token - Market list (`/defi/v2/markets`)                               |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Security (`/defi/token_security`)                              |          |   ✅    | ✅ (not SUI) | ✅ (not SUI) | ✅ (not SUI) |
| Token - Creation Info (`/defi/token_creation_info`)                    |          |   ✅    |      ✅      |      ✅      | Solana only  |
| **Not Integrated**                                                     |          |         |              |              |              |
| Price (`/defi/price`)                                                  |    ✅    |   ✅    |      ✅      |      ✅      |      ✅      |
| Price - Historical (`/defi/history_price`)                             |    ✅    |   ✅    |      ✅      |      ✅      |      ✅      |
| Price - Multiple (`/defi/multi_price`)                                 |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trades - by token (`/defi/txs/token`)                                  |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trades - by pair (`/defi/txs/pair`)                                    |          |   ✅    |      ✅      |      ✅      |      ✅      |
| OHLCV (`/defi/ohlcv`)                                                  |          |   ✅    |      ✅      |      ✅      |      ✅      |
| OHLCV - pair (`/defi/ohlcv/pair`)                                      |          |   ✅    |      ✅      |      ✅      |      ✅      |
| OHLCV - Base/Quote (`/defi/ohlcv/base_quote`)                          |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Trending (`/defi/token_trending`)                              |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Defi - Historical Price Unix (`/defi/historical_price_unix`)           |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Defi - Price Volume (single) (`/defi/price_volume/single`)             |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Top Traders (`/defi/v2/tokens/top_traders`)                    |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Holder List (`/defi/v3/token/holder`)                          |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Token - Meta Data (Single) (`/defi/v3/token/meta-data/single`)         |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Market Data (Single) (`/defi/v3/token/market-data`)            |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Trading Data (Single) (`/defi/v3/token/trading-data/single`)   |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trades - Token Seek By Time (`defi/txs/token/seek_by_time`)            |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trades - Pair Seek By Time (`/defi/txs/pair/seek_by_time`)             |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trader - Trades Seek By Time (`/trader/txs/seek_by_time`)              |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Trader - Gainer Losers (`/trader/gainers-losers`)                      |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Pair - Overview (Single) (`/defi/v3/pair/overview/single`)             |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Supported Networks (`/v1/wallet/list_supported_chain`)                 |          |   ✅    |      ✅      |      ✅      |     N/A      |
| Wallet Portfolio (`/v1/wallet/token_list`)\*                           |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Wallet Transaction History (`/v1/wallet/tx_list`)\*                    |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Wallet - Token Balance (`/v1/wallet/token_balance`)\*                  |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Wallet - Balance Change (`/wallet/v2/balance-change`)                  |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Search (`defi/v3/search`)                                              |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Defi Price Volume (multiple) (`/defi/price_volume/multi`)              |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Meta Data (Multiple) (`/defi/v3/token/meta-data/multiple`)     |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token list - All (`/defi/v2/tokens/all`)                               |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Token - Trading Data (Multiple) (`/defi/v3/token/trade-data/multiple`) |          |   ✅    |      ✅      |      ✅      |      ✅      |
| Pair - Overview (Multiple) (`/defi/v3/pair/overview/multiple`)         |          |   ✅    |      ✅      |      ✅      | Solana only  |
| Token - Market Data (Multiple) (`/defi/v3/token/market-data/multiple`) |          |   ✅    |      ✅      |      ✅      |      ✅      |

---

| Specs                               | Standard | Starter      | Premium            | Business                  | Enterprise                     |
| ----------------------------------- | -------- | ------------ | ------------------ | ------------------------- | ------------------------------ |
| API rate limit per package          | 1 rps    | 15 rps       | 50 rps / 1 000 rpm | 100 rps / 1 500 rpm       | Customized                     |
| Websocket concurrent connection     | N/A      | N/A          | N/A                | 500                       | Customized                     |
| Support                             | No       | Email (slow) | Email (limited)    | Priority + Telegram group | Dedicated 24/7 account manager |
| Refundable                          | No       | No           | No                 | Case-by-case              | Case-by-case                   |
| Max usage per month (Compute Units) | 30 k CU  | 6 M CU       | 50 M CU            | 250 M CU                  | Customized                     |

## APIs

### Token List (V1)

Fetches lists of tokens.

**Chains supported**: Solana, Ethereum, Arbitrum, Avalanche, BSC, Optimism, Polygon, Base, ZKSync, Sui

#### Query Paramaters

| Parameter       | Type              | Description                                 | Options/Default                                                        |
| --------------- | ----------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| `sort_by`       | string (required) | Field used to sort token results            | `v24hUSD`, `mc`, `v24hChangePercent`, `liquidity` (default: `v24hUSD`) |
| `sort_type`     | string (required) | Sort order of the token list                | `asc`, `desc` (default: `desc`)                                        |
| `min_liquidity` | integer           | Specify the lower bound of liquidity.       | >=0 (default: 100)                                                     |
| `max_liquidity` | integer           | Specify the upper bound of liquidity.       |                                                                        |
| `offset`        | integer           | Pagination offset — number of items to skip | 0, 50, 100, ... (default: 0)                                           |
| `limit`         | integer           | Number of tokens to return                  | 1–50 (default: 50)                                                     |

#### Example request

```shell
curl --request GET \
     --url 'https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=0&limit=50&min_liquidity=100' \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example response

```json
{
  "success": true,
  "data": {
    "updateUnixTime": 1726679660,
    "updateTime": "2024-09-18T17:14:20",
    "tokens": [
      {
        "address": "So11111111111111111111111111111111111111112",
        "decimals": 9,
        "price": 152.37270634528284,
        "lastTradeUnixTime": 1726679251,
        "liquidity": 7027121030.361493,
        "logoURI": "https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png",
        "mc": 75217627246.4999,
        "name": "Wrapped SOL",
        "symbol": "SOL",
        "v24hChangePercent": -6.4865412491445245,
        "v24hUSD": 753340393.0850035
      },
      {
        "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "decimals": 6,
        "price": 0.99997,
        "lastTradeUnixTime": 1726679250,
        "liquidity": 3507793000.4033475,
        "logoURI": "https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FEPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v%2Flogo.png",
        "mc": 2973865527.5120635,
        "name": "USD Coin",
        "symbol": "USDC",
        "v24hChangePercent": -20.022827653450364,
        "v24hUSD": 364654013.9369947
      }
    ],
    "total": 455148
  }
}
```

### Token List (V3)

Retrieve a list of tokens on a specified chain. Maximum of 100 tokens per call.

**Chains supported**: Solana

#### Query Paramaters

| Parameter                       | Type                | Description                                    | Options/Default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sort_by`                       | string (required)   | Field used to sort token results               | `liquidity`, `marketcap`, `fdv`, `recent_listing_time`, `last_trade_unix_time`, `volume_1h_usd`, `volume_1h_change_percent`, `volume_2h_usd`, `volume_2h_change_percent`, `volume_4h_usd`, `volume_4h_change_percent`, `volume_8h_usd`, `volume_8h_change_percent`, `volume_24h_usd`, `volume_24h_change_percent`, `trade_1h_count`, `trade_2h_count`, `trade_4h_count`, `trade_8h_count`, `trade_24h_count`, `price_change_1h_percent`, `price_change_2h_percent`, `price_change_4h_percent`, `price_change_8h_percent`, `price_change_24h_percent`, `holder`, `recent_listing_time` (default: `liquidity`) |
| `sort_type`                     | `'asc'` \| `'desc'` | Sort order of the token list                   | `desc` (default)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `min_liquidity`                 | number              | Minimum liquidity filter                       | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `max_liquidity`                 | number              | Maximum liquidity filter                       | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_market_cap`                | number              | Minimum market cap filter                      | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `max_market_cap`                | number              | Maximum market cap filter                      | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_fdv`                       | number              | Minimum fully diluted valuation                | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `max_fdv`                       | number              | Maximum fully diluted valuation                | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_recent_listing_time`       | number (unix time)  | Minimum listing time (e.g., only newer tokens) | 1-10000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `max_recent_listing_time`       | number (unix time)  | Maximum listing time                           | 1-10000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `min_last_trade_unix_time`      | number (unix time)  | Filter for tokens with recent trading activity | 1-10000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `max_last_trade_unix_time`      | number (unix time)  | Max cutoff for last trade                      | 1-10000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `min_holder`                    | number              | Minimum number of holders                      | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_1h_usd`             | number              | Minimum 1h USD trading volume                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_2h_usd`             | number              | Minimum 2h USD trading volume                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_4h_usd`             | number              | Minimum 4h USD trading volume                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_8h_usd`             | number              | Minimum 8h USD trading volume                  | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_24h_usd`            | number              | Minimum 24h USD trading volume                 | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_1h_change_percent`  | number              | Minimum % change in volume over 1 hour         | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_2h_change_percent`  | number              | Minimum % change in volume over 2 hours        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_4h_change_percent`  | number              | Minimum % change in volume over 4 hours        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_8h_change_percent`  | number              | Minimum % change in volume over 8 hours        | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_volume_24h_change_percent` | number              | Minimum % change in volume over 24 hours       | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_price_change_1h_percent`   | number              | Minimum % price change over 1 hour             | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_price_change_2h_percent`   | number              | Minimum % price change over 2 hours            | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_price_change_4h_percent`   | number              | Minimum % price change over 4 hours            | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_price_change_8h_percent`   | number              | Minimum % price change over 8 hours            | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_price_change_24h_percent`  | number              | Minimum % price change over 24 hours           | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_trade_1h_count`            | number              | Minimum trade count over 1 hour                | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_trade_2h_count`            | number              | Minimum trade count over 2 hours               | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_trade_4h_count`            | number              | Minimum trade count over 4 hours               | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_trade_8h_count`            | number              | Minimum trade count over 8 hours               | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `min_trade_24h_count`           | number              | Minimum trade count over 24 hours              | -                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `offset`                        | integer             | Pagination offset — number of items to skip    | 0-10000 (default: 0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `limit`                         | integer             | Number of tokens to return                     | 1–100 (default: 100)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

#### Example request

```shell
curl --request GET \
     --url 'https://public-api.birdeye.so/defi/v3/token/list?sort_by=liquidity&sort_type=desc&offset=0&limit=100' \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example response

```json
{
  "data": {
    "items": [
      {
        "address": "So11111111111111111111111111111111111111112",
        "logo_uri": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        "name": "Wrapped SOL",
        "symbol": "SOL",
        "decimals": 9,
        "extensions": {
          "coingecko_id": "solana",
          "serum_v3_usdc": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
          "serum_v3_usdt": "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1",
          "website": "https://solana.com/",
          "telegram": null,
          "twitter": "https://twitter.com/solana",
          "description": "Wrapped Solana ",
          "discord": "https://discordapp.com/invite/pquxPsq",
          "medium": "https://medium.com/solana-labs"
        },
        "market_cap": 70986064152.41452,
        "fdv": 83119267824.4418,
        "liquidity": 21550102465.71004,
        "last_trade_unix_time": 1741400559,
        "volume_1h_usd": 114732972.33349997,
        "volume_1h_change_percent": 26.600242887580787,
        "volume_2h_usd": 197164311.91243982,
        "volume_2h_change_percent": -24.201147221219546,
        "volume_4h_usd": 494857896.4547814,
        "volume_4h_change_percent": -37.41364293011281,
        "volume_8h_usd": 1249189237.4290442,
        "volume_8h_change_percent": 1.7083969276685818,
        "volume_24h_usd": 3362990076.206178,
        "volume_24h_change_percent": 17.12828046192169,
        "trade_1h_count": 1023528,
        "trade_2h_count": 1904835,
        "trade_4h_count": 4538696,
        "trade_8h_count": 9721597,
        "trade_24h_count": 26369792,
        "price": 139.52300907321856,
        "price_change_1h_percent": 0.003981660688414792,
        "price_change_2h_percent": 0.5243251304288506,
        "price_change_4h_percent": -1.3858689583782735,
        "price_change_8h_percent": -3.8244082037697713,
        "price_change_24h_percent": -0.5479088778176531,
        "holder": 1420526,
        "recent_listing_time": null
      }
    ],
    "has_next": true
  },
  "success": true
}
```

### Token Overview

Retrieve stats of a specified token.

**Chains supported**: Solana

#### Query Paramaters

| Parameter | Type              | Description                                 | Options/Default                                  |
| --------- | ----------------- | ------------------------------------------- | ------------------------------------------------ |
| `address` | string (required) | The address of the token contract.          | -                                                |
| `frames`  | string            | A list of time frames seprated by comma (,) | `1m`, `5m`, `30m`, `1h`, `2h`, `4h`, `8h`, `24h` |

#### Example Request

```shell
curl --request GET \
     --url https://public-api.birdeye.so/defi/token_overview \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example Response

```json
{
  "data": {
    "address": "So11111111111111111111111111111111111111112",
    "decimals": 9,
    "symbol": "SOL",
    "name": "Wrapped SOL",
    "marketCap": 87180723232.4941,
    "fdv": 100842923039.98,
    "extensions": {
      "coingeckoId": "solana",
      "serumV3Usdc": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
      "serumV3Usdt": "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1",
      "website": "https://solana.com/",
      "telegram": null,
      "twitter": "https://twitter.com/solana",
      "description": "Wrapped Solana ",
      "discord": "https://discordapp.com/invite/pquxPsq",
      "medium": "https://medium.com/solana-labs"
    },
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    "liquidity": 16204441269.55982,
    "lastTradeUnixTime": 1746802093,
    "lastTradeHumanTime": "2025-05-09T14:48:13",
    "price": 167.9717977535047,
    "history1mPrice": 168.4088836293969,
    "priceChange1mPercent": -0.25953849136253415,
    "history5mPrice": 168.84359081129827,
    "priceChange5mPercent": -0.5163317444296175,
    "history30mPrice": 171.43733146253095,
    "priceChange30mPercent": -2.0214580333593686,
    "history1hPrice": 172.75722318541744,
    "priceChange1hPercent": -2.770029144759197,
    "history2hPrice": 172.2346734850696,
    "priceChange2hPercent": -2.475039227182354,
    "history4hPrice": 170.05580963573024,
    "priceChange4hPercent": -1.225487024930011,
    "history6hPrice": 167.3727512958139,
    "priceChange6hPercent": 0.35791157942550833,
    "history8hPrice": 163.54628739020663,
    "priceChange8hPercent": 2.7059680986454877,
    "history12hPrice": 162.74296455421606,
    "priceChange12hPercent": 3.2129396275970508,
    "history24hPrice": 157.51260920577943,
    "priceChange24hPercent": 6.640223027517149,
    "uniqueWallet1m": 7955,
    "uniqueWalletHistory1m": 8300,
    "uniqueWallet1mChangePercent": -4.156626506024097,
    "uniqueWallet5m": 27033,
    "uniqueWalletHistory5m": 27281,
    "uniqueWallet5mChangePercent": -0.9090575858656208,
    "uniqueWallet30m": 98980,
    "uniqueWalletHistory30m": 98887,
    "uniqueWallet30mChangePercent": 0.09404674021863339,
    "uniqueWallet1h": 166478,
    "uniqueWalletHistory1h": 145186,
    "uniqueWallet1hChangePercent": 14.665325857865083,
    "uniqueWallet2h": 265223,
    "uniqueWalletHistory2h": 181521,
    "uniqueWallet2hChangePercent": 46.111469196401515,
    "uniqueWallet4h": 382251,
    "uniqueWalletHistory4h": 275988,
    "uniqueWallet4hChangePercent": 38.50276098960824,
    "uniqueWallet8h": 565327,
    "uniqueWalletHistory8h": 593685,
    "uniqueWallet8hChangePercent": -4.77660712330613,
    "uniqueWallet24h": 1665723,
    "uniqueWalletHistory24h": 1404422,
    "uniqueWallet24hChangePercent": 18.605590057689213,
    "totalSupply": 600356276.4028102,
    "circulatingSupply": 519020004.53927445,
    "holder": 1760223,
    "trade1m": 20682,
    "tradeHistory1m": 24687,
    "trade1mChangePercent": -16.223113379511485,
    "sell1m": 11727,
    "sellHistory1m": 14036,
    "sell1mChangePercent": -16.450555713878597,
    "buy1m": 8955,
    "buyHistory1m": 10651,
    "buy1mChangePercent": -15.923387475354428,
    "v1m": 29901.998139863,
    "v1mUSD": 5077278.654974254,
    "vHistory1m": 30646.791280430996,
    "vHistory1mUSD": 5219685.923701156,
    "v1mChangePercent": -2.430248353743875,
    "vBuy1m": 12396.121135296999,
    "vBuy1mUSD": 2126705.432446164,
    "vBuyHistory1m": 13090.079018149998,
    "vBuyHistory1mUSD": 2212182.945199659,
    "vBuy1mChangePercent": -5.301403313843978,
    "vSell1m": 17505.877004566002,
    "vSell1mUSD": 2950573.2225280902,
    "vSellHistory1m": 17556.712262281,
    "vSellHistory1mUSD": 3007502.9785014973,
    "vSell1mChangePercent": -0.28954884579507056,
    "trade5m": 116233,
    "tradeHistory5m": 126663,
    "trade5mChangePercent": -8.234448891941609,
    "sell5m": 65905,
    "sellHistory5m": 70880,
    "sell5mChangePercent": -7.018905191873589,
    "buy5m": 50328,
    "buyHistory5m": 55783,
    "buy5mChangePercent": -9.778964917627233,
    "v5m": 161544.220822853,
    "v5mUSD": 27692876.766140137,
    "vHistory5m": 216566.50841522898,
    "vHistory5mUSD": 36920321.57370163,
    "v5mChangePercent": -25.406646667120018,
    "vBuy5m": 76068.134923731,
    "vBuy5mUSD": 13169147.136751132,
    "vBuyHistory5m": 105770.59333944602,
    "vBuyHistory5mUSD": 18036608.943288196,
    "vBuy5mChangePercent": -28.081962554934247,
    "vSell5m": 85476.085899122,
    "vSell5mUSD": 14523729.629389005,
    "vSellHistory5m": 110795.91507578298,
    "vSellHistory5mUSD": 18883712.63041343,
    "vSell5mChangePercent": -22.852673908909495,
    "trade30m": 788590,
    "tradeHistory30m": 797963,
    "trade30mChangePercent": -1.174615865647906,
    "sell30m": 442903,
    "sellHistory30m": 446408,
    "sell30mChangePercent": -0.7851561799967743,
    "buy30m": 345687,
    "buyHistory30m": 351555,
    "buy30mChangePercent": -1.6691556086529846,
    "v30m": 1254060.0583020002,
    "v30mUSD": 214883389.03084078,
    "vHistory30m": 1014809.626640769,
    "vHistory30mUSD": 176963012.98413345,
    "v30mChangePercent": 23.57589299317153,
    "vBuy30m": 617376.7933133912,
    "vBuy30mUSD": 105656879.5739485,
    "vBuyHistory30m": 515256.87016754213,
    "vBuyHistory30mUSD": 89409857.07236338,
    "vBuy30mChangePercent": 19.819225915928783,
    "vSell30m": 636683.264988609,
    "vSell30mUSD": 109226509.45689228,
    "vSellHistory30m": 499552.7564732268,
    "vSellHistory30mUSD": 87553155.91177008,
    "vSell30mChangePercent": 27.450655959443516,
    "trade1h": 1466265,
    "tradeHistory1h": 1320699,
    "trade1hChangePercent": 11.021890680616856,
    "sell1h": 821622,
    "sellHistory1h": 721102,
    "sell1hChangePercent": 13.939775510260684,
    "buy1h": 644643,
    "buyHistory1h": 599597,
    "buy1hChangePercent": 7.512712705367106,
    "v1h": 2108562.948260493,
    "v1hUSD": 364214841.91139424,
    "vHistory1h": 1783376.1195459762,
    "vHistory1hUSD": 315517691.7376682,
    "v1hChangePercent": 18.23433795879835,
    "vBuy1h": 1047163.9042004604,
    "vBuy1hUSD": 180355710.08512825,
    "vBuyHistory1h": 870775.027542904,
    "vBuyHistory1hUSD": 151538134.971131,
    "vBuy1hChangePercent": 20.25653826514513,
    "vSell1h": 1061399.0440600328,
    "vSell1hUSD": 183859131.82626596,
    "vSellHistory1h": 912601.092003072,
    "vSellHistory1hUSD": 163979556.76653722,
    "vSell1hChangePercent": 16.304818541293166,
    "trade2h": 2669379,
    "tradeHistory2h": 2273625,
    "trade2hChangePercent": 17.40630051129804,
    "sell2h": 1478759,
    "sellHistory2h": 1214967,
    "sell2hChangePercent": 21.711865425151462,
    "buy2h": 1190620,
    "buyHistory2h": 1058658,
    "buy2hChangePercent": 12.465026476917004,
    "v2h": 3731210.4661495816,
    "v2hUSD": 651452028.7737522,
    "vHistory2h": 4986668.953994334,
    "vHistory2hUSD": 876699150.961254,
    "v2hChangePercent": -25.176295026344732,
    "vBuy2h": 1831761.5833810142,
    "vBuy2hUSD": 316887774.0885777,
    "vBuyHistory2h": 2552431.93778671,
    "vBuyHistory2hUSD": 447965734.71457183,
    "vBuy2hChangePercent": -28.234655104285,
    "vSell2h": 1899448.8827685672,
    "vSell2hUSD": 334564254.68517447,
    "vSellHistory2h": 2434237.0162076233,
    "vSellHistory2hUSD": 428733416.24668217,
    "vSell2hChangePercent": -21.96943559227523,
    "trade4h": 5091801,
    "tradeHistory4h": 4712834,
    "trade4hChangePercent": 8.04117013245109,
    "sell4h": 2772519,
    "sellHistory4h": 2530641,
    "sell4hChangePercent": 9.557973651734878,
    "buy4h": 2319282,
    "buyHistory4h": 2182193,
    "buy4hChangePercent": 6.282166609461217,
    "v4h": 8939271.824863661,
    "v4hUSD": 1565560374.6611657,
    "vHistory4h": 8303593.777521941,
    "vHistory4hUSD": 1399553943.2157688,
    "v4hChangePercent": 7.65545695482501,
    "vBuy4h": 4504246.161137434,
    "vBuy4hUSD": 784884335.9037958,
    "vBuyHistory4h": 4305672.358770635,
    "vBuyHistory4hUSD": 725954295.8032504,
    "vBuy4hChangePercent": 4.611911585940923,
    "vSell4h": 4435025.663726228,
    "vSell4hUSD": 780676038.7573699,
    "vSellHistory4h": 3997921.418751306,
    "vSellHistory4hUSD": 673599647.4125183,
    "vSell4hChangePercent": 10.933287555998179,
    "trade8h": 9289851,
    "tradeHistory8h": 9379085,
    "trade8hChangePercent": -0.9514147702041297,
    "sell8h": 5029486,
    "sellHistory8h": 5093401,
    "sell8hChangePercent": -1.2548589832216235,
    "buy8h": 4260365,
    "buyHistory8h": 4285684,
    "buy8hChangePercent": -0.5907808415179467,
    "v8h": 15908857.34252959,
    "v8hUSD": 2732932277.975237,
    "vHistory8h": 9435031.81369001,
    "vHistory8hUSD": 1548030762.8614295,
    "v8hChangePercent": 68.61477159458232,
    "vBuy8h": 8049726.027986797,
    "vBuy8hUSD": 1378697583.6394334,
    "vBuyHistory8h": 4725061.174831935,
    "vBuyHistory8hUSD": 774623834.5994598,
    "vBuy8hChangePercent": 70.36236633006378,
    "vSell8h": 7859131.314542793,
    "vSell8hUSD": 1354234694.3358037,
    "vSellHistory8h": 4709970.638858074,
    "vSellHistory8hUSD": 773406928.2619697,
    "vSell8hChangePercent": 66.86157764346973,
    "trade24h": 29304866,
    "tradeHistory24h": 24668611,
    "trade24hChangePercent": 18.794146942444385,
    "sell24h": 15982558,
    "sellHistory24h": 13552421,
    "sell24hChangePercent": 17.9313865766124,
    "buy24h": 13322308,
    "buyHistory24h": 11116190,
    "buy24hChangePercent": 19.84599039778917,
    "v24h": 38745401.947157934,
    "v24hUSD": 6451492278.474664,
    "vHistory24h": 27529677.595021047,
    "vHistory24hUSD": 4160810504.560139,
    "v24hChangePercent": 40.740485657432245,
    "vBuy24h": 19559046.575467408,
    "vBuy24hUSD": 3250849329.4358945,
    "vBuyHistory24h": 13821503.465453008,
    "vBuyHistory24hUSD": 2090095440.02877,
    "vBuy24hChangePercent": 41.511714874980484,
    "vSell24h": 19186355.371690527,
    "vSell24hUSD": 3200642949.0387692,
    "vSellHistory24h": 13708174.129568037,
    "vSellHistory24hUSD": 2070715064.5313692,
    "vSell24hChangePercent": 39.962880470756865,
    "numberMarkets": 196569
  },
  "success": true
}
```

### Token New Listing

Retrieve a list of newly listed tokens.

**Chains supported**: Solana, Ethereum, Arbitrum, Avalanche, BSC, Optimism, Polygon, Base, ZKSync

#### Query Paramaters

| Parameter               | Type    | Description                                                                          | Options/Default              |
| ----------------------- | ------- | ------------------------------------------------------------------------------------ | ---------------------------- |
| `time_to`               | number  | Specify the end time using unix timestamps in seconds                                | 1-10000000000                |
| `limit`                 | number  | Limit the number of records returned.                                                | 1-20 (default: 10)           |
| `meme_platform_enabled` | boolean | Enable to receive token new listing from meme platforms (eg: pump.fun). Solana only. | true, false (default: false) |

#### Example Request

```shell
curl --request GET \
     --url 'https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=10&meme_platform_enabled=false' \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "address": "6Zk9e3nfXdYLXHYu5NvDiPHGMcjujVBv6gWRr7ckSdhP",
        "symbol": "TOPCAT",
        "name": "TOPCAT",
        "decimals": 9,
        "source": "raydium",
        "liquidityAddedAt": "2024-09-18T17:59:23",
        "logoURI": null,
        "liquidity": 15507.41635596545
      },
      {
        "address": "DsWUsiseYxAHZXEvq5cVcymYaohk8Gpe8E4otsjFpump",
        "symbol": "Onigiri",
        "name": "Onigiri",
        "decimals": 6,
        "source": "raydium",
        "liquidityAddedAt": "2024-09-18T17:57:14",
        "logoURI": "https://ipfs.io/ipfs/QmfXbLtRVuTTkazYqQix4R8FYW4Xkj2ZEnWKhLpGugaLQr",
        "liquidity": 32994.397007045525
      }
    ]
  }
}
```

### Token All Market List

Retrieve a list of markets for a specified token.

**Chains supported**: Solana, Ethereum, Arbitrum, Avalanche, BSC, Optimism, Polygon, Base, ZKSync, Sui

#### Query Paramaters

| Parameter    | Type              | Description                           | Options/Default                                                    |
| ------------ | ----------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `address`    | string (required) | The address of the token contract.    | -                                                                  |
| `time_frame` | string (required) |                                       | `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `24h` (default: `24h`) |
| `sort_type`  | string (required) | Specify the sort order.               | `asc`, `desc` (default: `desc`)                                    |
| `sort_by`    | string (required) | Specify the sort field.               | `liquidity`, `volume24h` (default: `liquidity`)                    |
| `offset`     | number            | Specify the offset for pagination.    | (default: 0)                                                       |
| `limit`      | number            | Limit the number of records returned. | 1-20 (default: 10)                                                 |

#### Example Request

```shell
curl --request GET \
     --url 'https://public-api.birdeye.so/defi/v2/markets?time_frame=24h&sort_type=desc&sort_by=volume24h&offset=0&limit=10' \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "address": "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb",
        "base": {
          "address": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
          "decimals": 9,
          "symbol": "JitoSOL",
          "icon": "https://img.fotofolio.xyz/?url=https%3A%2F%2Fstorage.googleapis.com%2Ftoken-metadata%2FJitoSOL-256.png"
        },
        "createdAt": "2024-05-28T07:19:22.813Z",
        "liquidity": 1733225301.1348372,
        "name": "JitoSOL-SOL",
        "price": null,
        "quote": {
          "address": "So11111111111111111111111111111111111111112",
          "decimals": 9,
          "icon": "https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png",
          "symbol": "SOL"
        },
        "source": "Stake Pool",
        "trade24h": 1021,
        "trade24hChangePercent": 72.46621621621621,
        "uniqueWallet24h": 382,
        "uniqueWallet24hChangePercent": -13.769751693002258,
        "volume24h": 7610352.270776577
      }
    ],
    "total": 1523
  }
}
```

### Token Security

Retrieve security information of a specified token.

**Chains supported**: Solana, Ethereum, Arbitrum, Avalanche, BSC, Optimism, Polygon, Base, ZKSync

#### Query Paramaters

| Parameter | Type              | Description                        | Options/Default |
| --------- | ----------------- | ---------------------------------- | --------------- |
| `address` | string (required) | The address of the token contract. | -               |

#### Example Request

```shell
curl --request GET \
     --url https://public-api.birdeye.so/defi/token_security \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example Response

```json
{
  "data": {
    "creatorAddress": "9AhKqLR67hwapvG8SA2JFXaCshXc9nALJjpKaHZrsbkw",
    "creatorOwnerAddress": null,
    "ownerAddress": null,
    "ownerOfOwnerAddress": null,
    "creationTx": "2K5X6HT9QZ8dcApbWL6mzYw6WBDvL5vWndTpGrFkQuMfuStGTP5LxPNQnnn5v5KR2T6UD1zEXnfCdajzUfuCPZgS",
    "creationTime": 1670531612,
    "creationSlot": 165714665,
    "mintTx": "44Jfxh3VFp6N2h3CLMGeHHxeexdtUnHRsvQ2QXF9h9JqHiBvjt2xCbJg7G443hPVvG4y5VP95iaiSRKuLVVcadCe",
    "mintTime": 1683780182,
    "mintSlot": 193273646,
    "creatorBalance": 48343.76164,
    "ownerBalance": null,
    "ownerPercentage": null,
    "creatorPercentage": 5.44198858929173e-10,
    "metaplexUpdateAuthority": "9AhKqLR67hwapvG8SA2JFXaCshXc9nALJjpKaHZrsbkw",
    "metaplexOwnerUpdateAuthority": null,
    "metaplexUpdateAuthorityBalance": 48343.76164,
    "metaplexUpdateAuthorityPercent": 5.44198858929173e-10,
    "mutableMetadata": true,
    "top10HolderBalance": 27020571907755.746,
    "top10HolderPercent": 0.3041667404641445,
    "top10UserBalance": 27020571907755.746,
    "top10UserPercent": 0.3041667404641445,
    "isTrueToken": null,
    "fakeToken": null,
    "totalSupply": 88834735403757.8,
    "preMarketHolder": [],
    "lockInfo": null,
    "freezeable": null,
    "freezeAuthority": null,
    "transferFeeEnable": null,
    "transferFeeData": null,
    "isToken2022": false,
    "nonTransferable": null,
    "jupStrictList": true
  },
  "success": true
}
```

### Token Creation Info

Retrieve the creation transaction information of a specified token

**Chains supported**: Solana

#### Query Paramaters

| Parameter | Type              | Description                        | Options/Default |
| --------- | ----------------- | ---------------------------------- | --------------- |
| `address` | string (required) | The address of the token contract. | -               |

#### Example Request

```shell
curl --request GET \
     --url https://public-api.birdeye.so/defi/token_creation_info \
     --header 'X-API-KEY: 2ce5540b1cde4bc7b14befc186d2ee6d' \
     --header 'accept: application/json' \
     --header 'x-chain: solana'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "txHash": "3cW2HpkUs5Hg2FBMa52iJoSMUf8MNkkzkRcGuBs1JEesQ1pnsvNwCbTmZfeJf8hTi9NSHh1Tqx6Rz5Wrr7ePDEps",
    "slot": 223012712,
    "tokenAddress": "D7rcV8SPxbv94s3kJETkrfMrWqHFs6qrmtbiu6saaany",
    "decimals": 5,
    "owner": "JEFL3KwPQeughdrQAjLo9o75qh15nYbFJ2ZDrb695qsZ",
    "blockUnixTime": 1697044029,
    "blockHumanTime": "2023-10-11T17:07:09.000Z"
  }
}
```

# Codex
