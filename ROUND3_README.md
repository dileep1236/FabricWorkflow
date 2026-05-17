# Fabric ConfigBuilder — Round 3: Lookup, Matching & Workflow Editor

This completes the redesign. Everything below was syntax-validated (all 21
source files, 0 errors) and render-tested in a headless DOM.

## New / changed files this round

```
src/components/
  LookupConfigEditor.js          # REFACTORED — api client, toasts, ConfirmDialog
  LookupRuleForm.js              # REDESIGNED — themed cards, empty states
  MatchingEnrichedConfigEditor.js# REFACTORED — api client, toasts, ConfirmDialog
  MatchingRuleForm.js            # REDESIGNED — themed 2-col layout, Alert for
                                 #   validation result; validate logic preserved
  MappingRow.js                  # RESTYLED — themed Paper rows (was already MUI)
  pipelineworkflow.js            # REDESIGNED — styled React Flow canvas
  CustomEdge.js                  # REDESIGNED — themed pill via EdgeLabelRenderer
```

## What was preserved (no behavior change)

**Lookup**
- Loads `/get-lookup-rule-and-mapping?projectName&sourceName`
- `normalizeKeys` PascalCase→camelCase on rule + mappings
- Delete: `/delete-lookup-rule` `{projectName, sourceName, lookupRuleName}`
- Save: `/save-lookup-rule` with `{ ...rule, mappings }`
- The exact mapping-row template in `addMappingRow`

**Matching**
- Loads gateways + `/get-rule-and-mapping?projectName&sourceName`
- `normalizeKeys` on rule + mappings; `toPascalCaseMapping` normalization
- `handleValidateQuery` posts the **same body** to
  `/validate-reference-query` and reacts to `result.message === 'success'`
  by setting source/reference columns + mappings
- Auto-validate on mappings change (the original `useEffect`) is kept
- Delete: `/delete-row-enriched`; Save: `/save-rule-and-mapping`

**Workflow editor**
- Drag-from-palette → `onDrop` creates a `customNode`
- `onConnect` adds a `custom` edge with an incrementing sequence
- `onEdgesChange` via `applyEdgeChanges`; `addEdge` on connect
- Double-click → node param editor (label / project / source / runId)
- `handleRun` fires **all nodes in parallel** against `/run-pipeline` and
  maps each node to loading/success/error exactly as before
- `CustomEdge` keeps the same `data` contract
  (`sequence`, `onSequenceChange`, `onDelete`)

## What changed (presentation only)

- Hardcoded `http://localhost:5000/api/...` → shared `api` client
  (configurable via `REACT_APP_API_URL`)
- `window.confirm()` / `alert()` → shared `ConfirmDialog` + toasts
- Raw/ad-hoc styling → the central theme: status-aware workflow nodes,
  a branded component palette, themed MiniMap/Controls/edges, an `Alert`
  for query-validation feedback, dashed empty-state panels, sticky save bars

## Integration notes

These import the shared infra from earlier rounds:
`../api/client`, `./ToastProvider`, `./ConfirmDialog`, `../theme/theme`.
Drop them in after those are in place. `pipelineworkflow.js` still does
`import 'reactflow/dist/style.css'` — that's correct and required; it works
in your Create React App build (only bare Node can't parse a CSS import,
which is why the headless test stubs it the way a bundler does).

`App.js` already routes `/workflow` → `PipelineWorkflow`. The Enriched
editor already opens the redesigned Matching/Lookup editors in its tabbed
dialog, so no wiring changes are needed.

## Testing performed

- **Syntax**: all 21 files compiled with `@babel/preset-env` +
  `@babel/preset-react` — 0 errors.
- **Render**: `LookupConfigEditor`, `LookupRuleForm`,
  `MatchingEnrichedConfigEditor`, `MatchingRuleForm`, `MappingRow`, and
  `pipelineworkflow` all mounted and produced full render trees in headless
  DOM with `fetch` stubbed (the workflow canvas verified to render its
  palette, Run button, and React Flow surface).

No API contracts, request/response shapes, or data transformations were
changed anywhere in this round. Backend is untouched.
