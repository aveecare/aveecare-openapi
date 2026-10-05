# Contributing to aveecare-openapi

Thanks for helping improve the AveeCare API specification.

## How this repository is built

- **The specification is generated.** `openapi.json` and `openapi.yaml` are produced
  by AveeCare from the API itself and mirrored here, so please do not edit them by
  hand: a hand edit would be overwritten by the next release. If an endpoint,
  field or description is wrong or missing, open an issue and we will fix it at the
  source.
- **The tooling is hand-written** (the lint rules, the Postman generator and the
  maintenance scripts). Fixes and improvements to those are very welcome as pull requests.

## Development

```sh
npm install
npm test               # JSON/YAML validity check, then Spectral lint
npm run postman        # regenerate postman/aveecare.postman_collection.json
```

Maintainers copy a newly published spec here with:

```sh
node scripts/sync.mjs <path-or-url-to-openapi.json>
```

That validates the document, writes `openapi.json` and `openapi.yaml`, and rebuilds
the Postman collection. Commit all four files together.

## Pull requests

1. Open an issue first for anything larger than a small fix.
2. Run `npm test` and make sure the Postman collection is regenerated if you touched its script.
3. Add a line to `CHANGELOG.md` under "Unreleased".

By contributing you agree that your contributions are licensed under the MIT
License, and you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

Security issues: please follow [SECURITY.md](SECURITY.md) instead of opening a
public issue.
