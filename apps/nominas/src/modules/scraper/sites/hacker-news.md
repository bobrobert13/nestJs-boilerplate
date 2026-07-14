# Hacker News — HTML Structure Reference

> Site: `https://news.ycombinator.com/`
> Strategy: `ExampleScraperStrategy`

## Page Structure

```
┌────────────────────────────────────────────┐
│ <html>                                     │
│   <body>                                    │
│     <center>                                │
│       <table id="hnmain">                   │
│         <tr>  ← header (logo, nav)          │
│         <tr>                                │
│           <td>                              │
│             <table>                         │
│               <tr class="athing">           │ ← story row 1
│                 <td class="title">          │
│                   <span class="titleline">  │
│                     <a> Story Title </a>    │ ← select: `span.titleline a`
│                   </span>                   │
│                 </td>                       │
│               </tr>                         │
│               <tr>  ← subtext (points, by)  │
│               <tr class="athing">           │ ← story row 2
│               ...                           │
│             </table>                        │
│           </td>                             │
│         </tr>                               │
│       </table>                              │
│     </center>                               │
│   </body>                                   │
│ </html>                                     │
└────────────────────────────────────────────┘
```

## Key Selectors

| Field | CSS Selector | Type |
|-------|-------------|------|
| Story rows | `tr.athing` | Container |
| Story title | `tr.athing span.titleline a` | Text + `href` attr |
| Page title | `title` | Text |

## Data Mapping

| Output Field | Source | Notes |
|-------------|--------|-------|
| `pageTitle` | `document.title` | Entire page title |
| `storyCount` | `tr.athing` count | Max 10 stories |
| `stories[].title` | `span.titleline a` text | Trimmed |
| `stories[].url` | `span.titleline a` href | Story or HN discussion link |

## Special Notes

- No auth required
- No pagination (first page only in current strategy)
- `domcontentloaded` is sufficient (no JS rendering needed)
- Rate limit: be respectful — HN blocks aggressive scrapers
