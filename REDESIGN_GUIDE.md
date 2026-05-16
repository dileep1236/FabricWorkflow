# Fabric ConfigBuilder — UI Redesign & Refactor

A professional/enterprise redesign of the React frontend, plus
maintainability refactors that remove large amounts of duplicated code.

> **Open `preview.html` in any browser** to see the new look interactively
> before changing your repo. No build step needed.

---

## 1. What was wrong (current code)

| Area | Problem |
|---|---|
| **Styling** | `App.css` forces `font-size: 0.5rem` on *every* MUI component — text is nearly unreadable. Magic hex values (`#6483a5`, `#007bff`, `#28a745`) scattered across CSS + inline styles. |
| **Navigation** | `Navbar.js` is plain text links separated by `\| &nbsp;` with no active state. |
| **Sign-in** | Bare `<h1>` + two unstyled buttons; auth result only `console.log`-ed. |
| **Feedback** | Every action uses blocking `alert()` / `window.confirm()`. |
| **Duplication** | `LandingConfigEditor`, `BronzeToValidatedConfigEditor`, `ValidatedToEnrichedConfigEditor` each re-implement ~120 lines of identical load/add/save/delete logic. |
| **API calls** | `http://localhost:5000/api/...` hardcoded in ~8 files. |
| **Dead files** | `WorkflowEditor1/2`, `BronzeToValidatedConfigEditor1`, `workflow.js`, two imports of the Enriched form, etc. |
| **Mixed UI** | `FileUploadMapping` uses raw HTML `<table>`/`<input>`; editors use MUI `DataGrid`. |

## 2. What this redesign delivers

**Design system** (`src/theme/theme.js`)
- Single source of truth: color, type scale, spacing, radii, shadows.
- One steel-blue brand ramp derived from your original `#6483a5`, tuned for AA contrast.
- MUI component overrides so DataGrid / buttons / inputs are consistent everywhere.
- Readable typography (kills the `0.5rem` rule).

**App shell** (`src/components/AppShell.js`)
- Fixed branded sidebar with grouped, icon-led navigation + active highlight.
- Sticky top context bar showing the current stage.
- User footer with connection status.

**Feedback system**
- `ToastProvider` — non-blocking on-brand toasts replace `alert()`.
- In-app confirm dialogs replace `window.confirm()`.
- `LinearProgress` loading states on grids.

**Maintainability**
- `src/api/client.js` — one configurable API client (`REACT_APP_API_URL`), consistent errors.
- `src/hooks/useConfigEditor.js` — the shared CRUD engine. Each editor drops from ~240 → ~90 lines.
- `src/components/EditorChrome.js` — shared `PageHeader` + `EditorToolbar`.

## 3. Files in this package

```
src/
  theme/theme.js                         # design system (NEW)
  api/client.js                          # central API client (NEW)
  hooks/useConfigEditor.js               # shared CRUD hook (NEW)
  components/
    ToastProvider.js                     # toast system (NEW)
    AppShell.js                          # sidebar + topbar (replaces Navbar.js)
    EditorChrome.js                      # PageHeader / EditorToolbar (NEW)
    BronzeToValidatedConfigEditor.js     # refactored reference editor
  pages/
    SignIn.js                            # redesigned auth page
  App.js                                 # cleaned routing + providers
preview.html                             # interactive design preview
```

## 4. How to adopt (incremental — low risk)

You can migrate piece by piece; nothing here forces a big-bang rewrite.

1. **Drop in the foundation** (zero behavior change):
   `theme/`, `api/`, `components/ToastProvider.js`.
2. **Wrap the app** — copy the new `App.js`, or just add
   `<ThemeProvider theme={theme}>`, `<CssBaseline/>`, `<ToastProvider>` around
   your existing routes. Replace `Navbar` with `AppShell`.
3. **Delete `App.css`'s `font-size: 0.5rem` block** — the theme handles sizing.
4. **Refactor one editor** using `useConfigEditor` (see the included
   `BronzeToValidatedConfigEditor.js`), confirm parity, then repeat for the
   Landing and Enriched editors — they map 1:1 to the same hook.
5. **Swap fetch calls** to `api.get/post`, then set
   `REACT_APP_API_URL` in `.env` for non-local environments.

### Endpoint mapping for the other two editors

```js
// LandingConfigEditor
useConfigEditor({
  listEndpoint: '/get-all-ingest?taskType=Query',
  saveEndpoint: '/execute-sql',
  deleteEndpoint: '/delete-row',
  deleteAllEndpoint: '/delete-all-rows',
  initialFields: LANDING_INITIAL_FIELDS,
});

// ValidatedToEnrichedConfigEditor
useConfigEditor({
  listEndpoint: '/get-all-validatedtoenriched',
  saveEndpoint: '/execute-sql-enriched',
  deleteEndpoint: '/delete-row-enriched',
  deleteAllEndpoint: '/delete-all-rows',
  initialFields: ENRICHED_INITIAL_FIELDS,
  identify: (row) => ({ projectName: row.projectName, sourceName: row.sourceName }),
});
```

## 5. Cleanup recommendations (separate from UI work)

Safe to delete once routes are confirmed: `WorkflowEditor1.js`,
`WorkflowEditor2.js`, `workflow.js`, `BronzeToValidatedConfigEditor1.js`,
duplicate Enriched import in `App.js`, and the committed
`__azurite_db_*.json` / `AzuriteConfig` artifacts (these are local emulator
state and shouldn't be in version control — add them to `.gitignore`).

No business logic, API contracts, or data shapes were changed — this is a
presentation-and-structure refactor only.
