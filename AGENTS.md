# Fabric ConfigBuilder - Agent Guide

**Project**: Microsoft Fabric ConfigBuilder
**Purpose**: Visual configuration UI for data transformation pipelines with column mapping, workflow design, and ETL configuration management.
**Tech Stack**: React + Flask + Fabric SQL

## Quick Start

### Local Development
```bash
# Backend (Flask)
cd Service
pip install -r requirements.txt
python api_server.py  # Runs on http://localhost:5000

# Frontend (React) - in separate terminal
cd UI
npm install
npm start  # Runs on http://localhost:3000
```

**Requirements**: 
- Set `.env` in `/Service` with: `FABRIC_SQL_ENDPOINT`, `FABRIC_DB_NAME`, `FABRIC_WORKSPACE_ID`, `FABRIC_BASE_URL`
- Azure MSAL configured for authentication

## Project Structure

```
ConfigBuilder/
├── UI/                    # React frontend
│   ├── src/
│   │   ├── App.js        # Main router - defines all routes
│   │   ├── FileUploadMapping.js   # CSV/Excel upload & column mapping
│   │   ├── WorkflowEditor.js      # Visual workflow designer (React Flow)
│   │   ├── BronzeToValidatedConfigEditor.js   # Data validation config
│   │   ├── ValidatedToEnrichedConfigEditor.js # Data enrichment config
│   │   ├── Designer.js   # EIM data model designer
│   │   ├── Navbar.js, Sidebar.js, SiginIn.js  # UI chrome
│   │   └── ...other components
│   └── package.json       # React deps: @mui/material, react-flow-renderer, papaparse, xlsx
├── Service/               # Flask backend
│   ├── api_server.py      # REST API endpoints (main entry)
│   ├── helpers.py         # Fabric auth, database helpers
│   ├── dbConnect.ipynb    # Database connection reference
│   └── .env               # Config: FABRIC_SQL_ENDPOINT, FABRIC_DB_NAME, etc.
└── game/, AzuriteConfig/  # Storage emulation (local dev)
```

## Key Routes & Components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `SiginIn` | Azure MSAL authentication |
| `/file-upload-mapping` | `FileUploadMapping` | Upload CSV/Excel, map columns to destinations |
| `/sourcetovalidated` | `BronzeToValidatedConfigEditor` | Configure Bronze→Silver validation rules |
| `/validatedtoenriched` | `ValidatedToEnrichedConfigEditor` | Configure Silver→Gold enrichment rules |
| `/workflow` | `PipelineWorkflow` | Visual Fabric pipeline orchestration |
| `/eim` | `Designer` | Entity-Relationship modeling |

## API Conventions

**Backend**: Flask REST API at `http://localhost:5000/api/*`

**Common Endpoints**:
- `POST /api/get-mapping` → Fetch column mappings for a project/source
- `POST /api/execute-sql-columns` → Save column mappings to Fabric DB
- `GET /api/get-all` → Fetch all rows from `config.BronzeToSilverValidated`
- `GET /api/get-all-validatedtoenriched` → Fetch `config.SilverValidatedToEnriched`
- `POST /api/execute-sql` → Execute data transformation SQL

**Request/Response Pattern**:
```javascript
// Requests include projectName, sourceName in payload
fetch("http://localhost:5000/api/endpoint", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ projectName, sourceName, ... }),
  credentials: "include"  // For session/cookie auth
})
```

## Frontend Patterns

### Column Mapping (FileUploadMapping.js)
- Parses CSV/Excel with auto-delimiter detection
- Maps source columns to destination columns with metadata:
  - `datatype` (StringType, IntegerType, DateType, etc.)
  - `isCDCEnabled` (Change Data Capture)
  - `isPrimaryKey`, `isIdentity`
  - `isDerived` + `expression` for computed columns
  - `isEncryptEnabled`, `isRollingField`, `isDedupRankingField`
- Pagination: 10 rows per page
- Stores in `mapping` state keyed by source column name

### Workflows & Designers
- Use **React Flow** (`reactflow` library) for visual workflow/DAG editors
- Use **JointJS** (`jointjs` library) for diagram rendering
- Both save configuration back to Fabric SQL

### Data Tables
- Use **Material-UI DataGrid** (`@mui/x-data-grid`)
- Fetch from Fabric SQL via backend API

## Database Schema (Fabric SQL)

Key tables in Fabric SQL (accessed via PYODBC):
- `config.BronzeToSilverValidated` - Stores Bronze→Silver transformation configs
- `config.SilverValidatedToEnriched` - Stores Silver→Gold enrichment configs

Typical row schema includes:
```
ProjectName, SourceName, ProjectColumnName, SourceColumnName,
Datatype, IsCDCEnabled, IsEncryptEnabled, IsPrimaryKey, IsIdentity,
IsDerived, DerivedExpression, IsRollingField, IsDedupRankingField,
ProjectColumnID
```

## Authentication & Environment

**Azure MSAL Setup** (Frontend):
- `msalConfig.js` - Defines MSAL configuration
- `SiginIn.js` - MSAL sign-in component
- Tokens are passed to backend for Fabric SQL access

**Backend Fabric Auth**:
- `helpers.py` - Contains `get_token_struct_database()` and `get_token_struct_fabric()`
- Uses PYODBC with token-based authentication to Fabric SQL

**.env Variables** (Backend):
```
FABRIC_SQL_ENDPOINT=<server>
FABRIC_DB_NAME=<database>
FABRIC_BASE_URL=https://api.fabric.microsoft.com/
FABRIC_WORKSPACE_ID=<workspace-guid>
FABRIC_API_VERSION=2020-12-01
```

## Common Patterns

### Adding a New Configuration Editor
1. Create new component in `/UI/src/` (e.g., `MyConfigEditor.js`)
2. Add route in `App.js`
3. Fetch data from backend via `POST /api/get-mapping` or similar
4. Use `useState` + `useEffect` for data loading
5. Send updates via `POST /api/execute-sql-*`
6. Return success/error alerts to user

### Adding a New Backend Endpoint
1. Define route handler in `api_server.py`
2. Use `pyodbc.connect()` with Fabric connection string and token auth
3. Return JSON: `jsonify(data)` or `jsonify({'error': msg}), 500`
4. CORS is enabled for `http://localhost:3000`

### CSV/Excel Upload Pattern
- Use `FileUploadMapping.js` as reference
- Auto-detect delimiter with `detectDelimiter()` helper
- Parse with `PapaParse` (CSV) or `xlsx` (Excel)
- Map headers to destination columns with metadata

## Important Notes

⚠️ **CORS**: Only `http://localhost:3000` is allowed (update for production)

⚠️ **Local Dev Setup**: Requires Azurite emulator or real Fabric instance

⚠️ **Token Auth**: Uses Azure MSAL tokens for both frontend and backend database access

✅ **Adding derived columns**: UI supports computed columns with expressions (see `isDerived` + `expression`)

## Files to Check First

When tasked with:
- **Adding column metadata**: Look at `FileUploadMapping.js` (lines ~50-100) for the mapping object structure
- **API integrations**: Review `api_server.py` for endpoint patterns and CORS
- **Component layout**: Check `App.js` for routing structure
- **Database queries**: See `api_server.py` for PYODBC + Fabric SQL patterns
- **Workflow visualization**: Study `WorkflowEditor.js` or `Designer.js` for React Flow usage

## Next Steps

For AI agents working here:
1. ✅ Run `npm install && npm start` in `/UI` for frontend dev
2. ✅ Set up `.env` and run `python api_server.py` in `/Service` for backend
3. ✅ Review `FileUploadMapping.js` to understand the main column mapping UI pattern
4. ✅ Check `App.js` routes to understand feature organization
5. ✅ Inspect `api_server.py` for database integration patterns
