# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The version of the
specification itself is the API version in `info.version`.

## [Unreleased]

## [1.0.0] - 2026-10-05

### Added

- First public release of the AveeCare OpenAPI 3.1 specification (API version 1.0.0),
  as `openapi.json` and `openapi.yaml`.
- A Postman collection with one folder per resource, bearer authentication through
  `{{AVEECARE_API_KEY}}` and a `baseUrl` variable.
- Spectral lint rules and a CI workflow that lints the specification and checks that
  the JSON, YAML and Postman files agree.
