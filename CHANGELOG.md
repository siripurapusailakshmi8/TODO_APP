# Changelog

## Unreleased

### Added

- **TODO-SEARCH-NAME** - Added optional `name` title search to `GET /todos` with trimmed, case-insensitive substring matching. Search combines with `completed` and `priority` using AND semantics; blank or repeated `name` input returns HTTP `400`, while a valid no-match returns HTTP `200` with an empty collection. Requests that omit `name` remain backward compatible, and no dependencies were added.