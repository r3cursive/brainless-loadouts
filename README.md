# VALORANT Loadout Randomizer

A lofi text-only Valorant loadout randomizer with smart budget allocation.

## Quick Start

### v1.0 (Recommended)
Modular version with smart budget allocation and comprehensive tests.

```bash
# Open in browser
open v1/index.html

# Run tests via Docker
docker build -t valorant-randomizer-tests .
docker run --rm valorant-randomizer-tests
```

### v0 (Original)
Single-file version, simpler but less intelligent budget logic.

```bash
open index.html
```

## Features

- **Three input modes**:
  - `loadout` - Random everything
  - `agent:jett` - Random loadout for specific agent
  - `3000` - All agents affordable at budget

- **29 Valorant agents** with accurate ability costs
- **Complete weapon arsenal** with correct prices
- **Smart budget allocation** (v1.0 only)
- **Terminal aesthetic** - Green on black, monospace
- **Fully client-side** - No server required
- **Tested** - 41 Jest tests (v1.0 only)

## Version Comparison

| Feature | v0 | v1.0 |
|---------|----|----- |
| Files | 1 (24KB) | 3 (index.html, style.css, app.js) |
| Budget logic | Random | Smart weighted tiers |
| Tests | ❌ None | ✅ 41 Jest tests |
| 300 credits | Random picks | Prioritizes Shorty |
| Modular | ❌ | ✅ |

## Budget Tiers (v1.0)

- **Eco (<$1,500)**: Cheap weapons, minimal shields/abilities
- **Half Buy ($1,500-$3,499)**: SMGs, light shields, some abilities
- **Full Buy ($3,500+)**: Rifles, heavy shields, most abilities

## Example Usage

```
> 300
SAGE | Shorty | Classic | No Shield | None | $300
OMEN | Shorty | Classic | No Shield | None | $300

> 5500
JETT | Vandal | Sheriff | Heavy Shield | C+Q+E | $4,850
SAGE | Phantom | Ghost | Heavy Shield | C+Q | $4,600
```

## Development

### Testing (v1.0)
```bash
docker run --rm valorant-randomizer-tests npm test
docker run --rm valorant-randomizer-tests npm run test:coverage
```

### Git History
```bash
git log --oneline
```

## License

MIT

## Credits

Built with Claude Code
