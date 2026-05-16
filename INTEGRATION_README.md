# Fabric ConfigBuilder — Round 2: Editors, Mapping & Tooling

This package completes the refactor started in the first round. Everything
here was syntax-validated and the editors were render-tested in a headless
DOM (mount + first render, with mocked fetch).

## New / changed files

```
src/
  hooks/useConfigEditor.js              # EXTENDED: now supports a `filter`
                                        #   (for the Landing task-type filter)
                                        #   + buildSavePayload / identify /
                                        #   buildDeleteAllPayload options
  components/
    ConfirmDialog.js                    # NEW shared confirm dialog
                                        #   (replaces window.confirm in all 3)
    BronzeToValidatedConfigEditor.js    # refactored, uses ConfirmDialog
    LandingConfigEditor.js              # REFACTORED — task-type toggle,
                                        #   dynamic field sets preserved
    ValidatedToEnrichedConfigEditor.js  # REFACTORED — tabbed Matching/Lookup
                                        #   dialog, validateReferenceQuery kept
    FileUploadMapping.js                # REBUILT in MUI (was raw HTML table)
.gitignore                              # NEW — repo-root gitignore
```

## What changed per file

### `useConfigEditor.js` (extended)
The Landing editor filters its list by task type *and* its form fields depend
on that type. The hook now accepts:
- `listEndpoint` as a function `(filter) => url`
- `initialFields` as a function `(filter) => template`
- `identify(row)` — custom delete payload (Enriched deletes by
  `projectName + sourceName`, not `taskName`)
- `buildDeleteAllPayload()` — Enriched posts `{ validated: false }`
- `initialFilter` / exposes `filter` + `setFilter`

All three editors now share one CRUD engine. Net effect:
`Landing` 298→~230 lines, `Bronze` 237→~165, `Enriched` 330→~225 — and the
*duplicated* logic (load/normalize/add/save/delete) exists exactly once.

### `LandingConfigEditor.js`
- Task-type selector is now a segmented `ToggleButtonGroup` (Query/File/API)
  instead of a bare dropdown.
- The base/query/file/api field-set switching logic is **preserved exactly**.
- Add-button label reflects the active type ("Add File Task").

### `ValidatedToEnrichedConfigEditor.js`
- Matching and Lookup rule editors now open in **one tabbed dialog** instead
  of two overlapping modal flags (`showMatchingModal`/`showLookupModal`).
- `validateReferenceQuery()` is preserved and still passed to both
  sub-editors via the `onValidate` prop (your `MatchingEnrichedConfigEditor`
  and `LookupConfigEditor` are reused **unchanged**).
- Save/delete payloads are byte-for-byte the same as before.

### `FileUploadMapping.js` (rebuilt)
The single biggest visual inconsistency in the app. **All logic preserved**:
- `detectDelimiter()` heuristic — unchanged
- CSV (PapaParse) / XLSX / TXT parsing — unchanged
- `/get-mapping` load + truthy-coercion of `"1"|1|true` flags — unchanged
- derived columns, "enable all CDC", PK↔CDC interlock — unchanged
- the `/execute-sql-columns` payload (`{ projectName, sourceName, mapping }`)
  is **identical** — backend needs no changes

Only the presentation moved from raw `<table>/<input>` (styled by the broken
`App.css`) to MUI `Table` with sticky headers, chips for derived columns,
proper `TablePagination`, and toast feedback instead of `alert()`.

## Drop-in order (low risk)

1. Add `ConfirmDialog.js` and the extended `useConfigEditor.js`.
2. Replace the three editor files. They import:
   `./DynamicRowEditor` (unchanged, keep yours), `./FileUploadMapping`,
   `./EditorChrome`, `./ConfirmDialog`, `../hooks/useConfigEditor`,
   and for Enriched: your existing `./MatchingEnrichedConfigEditor` and
   `./LookupConfigEditor` (no changes needed to those).
3. Replace `FileUploadMapping.js`.
4. Add `.gitignore` at the repo root, then untrack the committed emulator
   files:
   ```bash
   git rm --cached __azurite_db_*.json AzuriteConfig
   git commit -m "chore: stop tracking local Azurite emulator state"
   ```

## Testing performed

- **Syntax**: all 16 source files compiled with `@babel/preset-env` +
  `@babel/preset-react` — 0 errors.
- **Render**: `BronzeToValidatedConfigEditor`, `LandingConfigEditor`,
  `ValidatedToEnrichedConfigEditor`, `FileUploadMapping`, and `AppShell`
  mounted and produced a full render tree in headless DOM with `fetch`
  stubbed. `ConfirmDialog` renders correctly *inside* the editors (verified);
  a standalone-mount test hit a known bare-jsdom Emotion-cache quirk that
  does not occur under Create React App.

No API contracts, request/response shapes, or data transformations were
changed — backend is untouched.
