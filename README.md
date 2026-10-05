# AveeCare OpenAPI Specification

[![CI](https://github.com/aveecare/aveecare-openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/aveecare/aveecare-openapi/actions/workflows/ci.yml)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-6BA539.svg)](https://spec.openapis.org/oas/v3.1.0)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

The public [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) specification of the
[AveeCare API](https://www.aveecare.com/docs/api), the REST API of AveeCare's home care
software. Use it to browse every endpoint, import the API into your favorite tool,
or generate a client in any language.

| File | What it is |
|---|---|
| [`openapi.json`](openapi.json) | The specification (JSON) |
| [`openapi.yaml`](openapi.yaml) | The same specification (YAML) |
| [`postman/aveecare.postman_collection.json`](postman/aveecare.postman_collection.json) | A Postman collection, one folder per resource |

The API base URL is `https://api.aveecare.com`, and every request is authenticated
with `Authorization: Bearer ak_...` using an API key from **Settings → API Keys** in
AveeCare. Keys are read-only or read and write. Each key may make 60 requests a minute.

## Use the spec

### Postman

1. In Postman choose **Import** and select
   [`postman/aveecare.postman_collection.json`](postman/aveecare.postman_collection.json),
   or import `openapi.json` directly to let Postman build its own collection.
2. Open the collection's **Variables** tab and set `AVEECARE_API_KEY` to your key.
   Leave `baseUrl` as `https://api.aveecare.com` unless you were given a sandbox.
3. Send **Me → Retrieve the current API key** first to check the key works.

Every request uses the collection's bearer token (`{{AVEECARE_API_KEY}}`), and
create requests send a fresh `Idempotency-Key` each time.

### Insomnia

Choose **Create → Import**, then pick `openapi.yaml` (or paste the raw URL
`https://raw.githubusercontent.com/aveecare/aveecare-openapi/main/openapi.yaml`).
Add a **Bearer Token** in the collection's authentication settings with your key.

### Bruno

Choose **Collections → Import Collection → OpenAPI V3 Spec** and pick `openapi.yaml`.
Then set the collection's authentication to **Bearer Token** with your key.

### Generate your own client

The official libraries are listed [below](#official-sdks-and-tools). For any other
language, generate a client with
[OpenAPI Generator](https://openapi-generator.tech):

```sh
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./aveecare-client
```

Swap `typescript-fetch` for any [generator](https://openapi-generator.tech/docs/generators)
(`java`, `csharp`, `kotlin`, `swift5`, ...). Whichever tool you use, set the
`Authorization: Bearer <key>` header on every request. OpenAPI 3.1 support varies
between generators; if one struggles, try a newer release of it.

### Read it in your browser

Any OpenAPI viewer works, for example
[Swagger Editor](https://editor.swagger.io) (**File → Import URL**) or
[Redocly](https://redocly.com/docs/cli/commands/preview-docs):

```sh
npx @redocly/cli preview-docs openapi.yaml
```

The reference documentation, with request and response examples in every
official SDK, is at [www.aveecare.com/docs/api](https://www.aveecare.com/docs/api).

## Conventions in the spec

- **Pagination.** List endpoints take `limit` (1 to 100, default 25) and `cursor`,
  and return `{ "object": "list", "data": [...], "next_cursor": "...", "has_more": true }`.
- **Filters.** Lists accept flat query parameters such as `status`, `patient_id`,
  `created_after` and `updated_after`. Visits require a `start_from` and `start_to` window of
  at most 93 days.
- **Errors.** Every error is `{ "error": { "type", "code", "message", "request_id" } }`
  with a fixed set of codes.
- **Idempotency.** Send an `Idempotency-Key` header on `POST` requests to make retries safe.
- **Rate limits.** Responses carry `RateLimit-Limit`, `RateLimit-Remaining` and
  `RateLimit-Reset`; a `429` carries `Retry-After`.

## Lint

The spec is checked with [Spectral](https://github.com/stoplightio/spectral) on every
push, using the rules in [`.spectral.yaml`](.spectral.yaml):

```sh
npm install
npm test        # JSON/YAML validity check, then Spectral
```

or without installing anything: `npx @stoplight/spectral-cli lint openapi.yaml`.

## How this repository is maintained

The specification is generated and published by AveeCare, and this repository mirrors
it, so please do not edit `openapi.json` or `openapi.yaml` by hand. Maintainers copy
the published spec here:

```sh
node scripts/sync.mjs <path-or-url-to-openapi.json>
```

The script validates the document, writes `openapi.json` and `openapi.yaml`, and
regenerates the Postman collection. See [CONTRIBUTING.md](CONTRIBUTING.md).

Found something wrong or missing in the API? [Open an issue](https://github.com/aveecare/aveecare-openapi/issues).

## Official SDKs and tools

- [aveecare-node](https://github.com/aveecare/aveecare-node): Node.js and TypeScript
- [aveecare-python](https://github.com/aveecare/aveecare-python): Python
- [aveecare-rust](https://github.com/aveecare/aveecare-rust): Rust
- [aveecare-go](https://github.com/aveecare/aveecare-go): Go
- [aveecare-ruby](https://github.com/aveecare/aveecare-ruby): Ruby
- [aveecare-php](https://github.com/aveecare/aveecare-php): PHP
- [aveecare-java](https://github.com/aveecare/aveecare-java): Java and Kotlin
- [aveecare-dotnet](https://github.com/aveecare/aveecare-dotnet): .NET
- [aveecare-cli](https://github.com/aveecare/aveecare-cli): command line
- [aveecare-openapi](https://github.com/aveecare/aveecare-openapi): OpenAPI specification
- [aveecare-mcp](https://github.com/aveecare/aveecare-mcp): connect AI assistants
- [aveecare-examples](https://github.com/aveecare/aveecare-examples): sample apps

## Learn more

- [AveeCare](https://www.aveecare.com): home care software
- [API documentation](https://www.aveecare.com/docs/api)
- [Developers](https://www.aveecare.com/developers)
- [Partner Center](https://www.aveecare.com/partners): building an integration to offer other agencies?

## License

MIT. See [LICENSE](LICENSE).

---

Built by [AveeCare](https://www.aveecare.com) — home care software.

Suggested GitHub topics and keywords are listed in [`.github/TOPICS.md`](.github/TOPICS.md).
