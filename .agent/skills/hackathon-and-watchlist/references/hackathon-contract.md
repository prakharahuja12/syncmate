# Hackathon & Watchlist Contract Reference

## Hackathon Object Specification
```json
"hackathon": {
  "name": "Smart India Hackathon 2026",
  "registrationUrl": "https://sih.gov.in/register",
  "officialUrl": "https://sih.gov.in",
  "problemStatementUrl": "https://sih.gov.in/ps",
  "registrationOpensAt": "2026-08-01T00:00:00.000Z",
  "registrationClosesAt": "2026-09-30T23:59:59.000Z",
  "prizePool": "₹1,00,000",
  "location": "Online / New Delhi",
  "mode": "hybrid",
  "details": "Grand finale hackathon"
}
```

## Primary URL Rule (Addendum 1)
Clients open `primaryUrl` on event card click:
`primaryUrl = hackathon.registrationUrl || hackathon.officialUrl || url || null`

## Watchlist Envelope Exception (Addendum 3)
`GET /groups/:gid/watchlist` returns:
```json
{
  "success": true,
  "data": {
    "open": [
      {
        "id": "...",
        "title": "...",
        "hackathon": { ... },
        "daysToRegistrationClose": 5,
        "pinSummary": { "pinnedBy": [...], "isPinnedByMe": true },
        "participation": [
          { "user": { "id": "u1", "name": "Alex" }, "status": "registered" },
          { "user": { "id": "u2", "name": "Sam" }, "status": null }
        ],
        "myStatus": "registered"
      }
    ],
    "closed": []
  }
}
```

