# Indexer API

Source: `backend/app/api/indexer.py`

## Overview

Background web indexer for crawling and extracting content from configured URLs.

## Add Source

```
POST /api/indexer/sources
```

**Request:**
```json
{
  "url": "https://example.com/docs",
  "label": "Example Docs"
}
```

## List Sources

```
GET /api/indexer/sources
```

**Response:**
```json
{
  "sources": [
    {
      "id": "uuid",
      "url": "https://example.com/docs",
      "label": "Example Docs",
      "enabled": true
    }
  ]
}
```

## Toggle Source

```
PUT /api/indexer/sources/{id}/toggle
```

**Request:**
```json
{
  "enabled": false
}
```

## Remove Source

```
DELETE /api/indexer/sources/{id}
```

## Trigger Crawl

Manually trigger a crawl of all enabled sources.

```
POST /api/indexer/crawl
```

## Background Daemon

### Get Status

```
GET /api/indexer/status
```

### Start Indexer

Start the background daemon.

```
POST /api/indexer/start?interval_minutes=60
```

### Stop Indexer

```
POST /api/indexer/stop
```
