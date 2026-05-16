import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import "./App.css";

function FileUploadMapping({ selectedRow }) {
  console.log("Received Row:", selectedRow);
  const [projectName, setProjectName] = useState(selectedRow?.projectName || ""); // Store Project Name
  const [sourceName, setSourceName] = useState(selectedRow?.sourceName || ""); // Store Source Name
  const [sourceColumns, setSourceColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [sqlScript, setSqlScript] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCDCEnabledAll, setIsCDCEnabledAll] = useState(false);
  const [nextProjectColumnID, setNextProjectColumnID] = useState(1);
  const rowsPerPage = 10;
  const [derivedColumns, setDerivedColumns] = useState([]);

  useEffect(() => {
    if (selectedRow) {
      setProjectName(selectedRow.projectName || "");
      setSourceName(selectedRow.sourceName || "");
    }
  }, [selectedRow]);

  const detectDelimiter = (text) => {
    const firstLine = text.split("\n")[0]; 
    if (firstLine.includes("\t")) return "\t"; 
    if (firstLine.includes(";")) return ";"; 
    if (firstLine.includes("|")) return "|"; 
    return ","; // Default fallback
  };
  
 const initialLoad = (projectName, sourceName) => {
  fetch("http://localhost:5000/api/get-mapping", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ projectName, sourceName }),
    credentials: "include" // Optional: include if backend uses cookies/session
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      return res.json();
    })
 .then((data) => {
  console.log("Mapping data:", data);
  if (data && Array.isArray(data.mapping)) {
   const structuredMapping = data.mapping.reduce((acc, row) => {
  const col = row.SourceColumnName; // updated casing
  acc[col] = {
    destination: row.ProjectColumnName || "",
    datatype: row.Datatype || "StringType",
    isCDCEnabled:  row.IsCDCEnabled === "1" || row.IsCDCEnabled === 1 || row.IsCDCEnabled === true,
    isEncryptEnabled:  row.IsEncryptEnabled === "1" || row.IsEncryptEnabled === 1 || row.IsEncryptEnabled === true,
    isPrimaryKey:   row.IsPrimaryKey === "1" || row.IsPrimaryKey === 1 || row.IsPrimaryKey === true,
    isIdentity: row.IsIdentity === "1" || row.IsIdentity === 1 || row.IsIdentity === true,
    isDerived: row.IsDerived === "1" || row.IsDerived === 1 || row.IsDerived === true,
    isRollingField: row.IsRollingField === "1" || row.IsRollingField === 1 || row.IsRollingField === true,
    isDedupRankingField: row.IsDedupRankingField === "1" || row.IsDedupRankingField === 1 || row.IsDedupRankingField === true,
    expression: row.DerivedExpression || "",
    projectColumnID: row.ProjectColumnID || 0
  };
  return acc;
}, {});
console.log("Structured Mapping:", structuredMapping);
setMapping(structuredMapping);
setSourceColumns(Object.keys(structuredMapping));
  }
})
    .catch((err) => {
      console.error("Error fetching mapping:", err);
    });
};

React.useEffect(() => {
  if (projectName && sourceName) {
    initialLoad(projectName, sourceName);
  }
}, [projectName, sourceName]);

  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
  
    if (file) {
      const fileType = file.name.split(".").pop().toLowerCase();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        const text = e.target.result;
  
        if (fileType === "csv" ) {
          console.log("csv")
          // Papa.parse(e.target.result, {
          //   delimiter: "\t", // Automatically detects delimiter
          //   complete: (result) => {
          //     if (result.data.length > 0) {
          //       processHeaders(result.data);
          //     }
          //   },
          // });
          Papa.parse(e.target.result, {
            delimiter: detectDelimiter(e.target.result), 
            complete: (result) => processHeaders(result.data),
          });
          
        } else if (fileType === "xlsx" || fileType === "xls") {
          const workbook = XLSX.read(text, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  
          if (sheetData.length > 0) {
            processHeaders(sheetData);
          }
        } else if (fileType === "txt") {
          const rows = text.split("\n").map(row => row.split("\t")); // Tab-delimited parsing
          if (rows.length > 0) {
            processHeaders(rows);
          }
        }
      };
  
      if (fileType === "xlsx" || fileType === "xls") {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    }
  };
  
  const processHeaders = (data) => {
   
    const headers = data[0];
    setSourceColumns(headers);
  
    const initialMapping = headers.reduce((acc, col, index) => {
      acc[col] = { 
        destination: col.replace(/\s+/g, "").toLowerCase(), 
        datatype: "StringType", 
        isCDCEnabled: false, 
        isEncryptEnabled: false, 
        isPrimaryKey: false,
        projectColumnID: nextProjectColumnID + index 
      };
      return acc;
    }, {});
  
    setMapping(initialMapping);
  };
  
  const handleMappingChange = (col, field, value) => {
    setSqlScript("")
    setMapping((prev) => {
      const updatedMapping = { ...prev };

      if (field === "isPrimaryKey" && value) {
        updatedMapping[col].isCDCEnabled = false;
      }

      updatedMapping[col][field] = value;

      return updatedMapping;
    });
  };

  const handleEnableAllCDC = (event) => {
    const isChecked = event.target.checked;
    setIsCDCEnabledAll(isChecked);

    setMapping((prev) => {
      const updatedMapping = { ...prev };
      Object.keys(updatedMapping).forEach((col) => {
        if (!updatedMapping[col].isPrimaryKey) {
          updatedMapping[col].isCDCEnabled = isChecked;
        }
      });
      return updatedMapping;
    });
  };

const handleExecuteSql = () => {
 const payload = {
  projectName,
  sourceName,
  mapping
};
   console.log("Executing SQL with payload:", payload);
  fetch("http://localhost:5000/api/execute-sql-columns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
 
    body: JSON.stringify(payload)
  })
    .then((res) => res.text())
    .then((result) => {
      console.log("Backend response:", result);
      alert("SQL executed successfully!");
    })
    .catch((err) => {
      console.error("Execution failed:", err);
      alert("Something went wrong while executing SQL.");
    });
};
  

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlScript], { type: "text/sql" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "generated_script.sql";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sourceColumns.slice(indexOfFirstRow, indexOfLastRow);

  const nextPage = () => {
    if (currentPage < Math.ceil(sourceColumns.length / rowsPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
const addDerivedColumn = () => {
  const newColName = `DerivedColumn${derivedColumns.length + 1}`;
  
  const newCol = {
    destination: newColName,
    datatype: "StringType",
    isCDCEnabled: false,
    isEncryptEnabled: false,
    isPrimaryKey: false,
    isIdentity: false,
    isDerived: true,

    isRollingField: false,
    isDedupRankingField: false,

    expression: "",
    projectColumnID: nextProjectColumnID + Object.keys(mapping).length
  };

  setMapping((prev) => ({
    ...prev,
    [newColName]: newCol
  }));

  setSourceColumns((prev) => [...prev, newColName]);
  setDerivedColumns((prev) => [...prev, newColName]);
};
const deleteColumn = (colName) => {
  setMapping((prev) => {
    const { [colName]: _, ...rest } = prev;
    return rest;
  });
  setSourceColumns((prev) => prev.filter((col) => col !== colName));
  setDerivedColumns((prev) => prev.filter((col) => col !== colName));
};
  return (
    <div className="container">
      <h2>Upload Source File & Map Columns</h2>

      <div className="form-group">
        <input type="text" placeholder="Enter Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="input" /><br></br><br></br>
        <input type="text" placeholder="Enter Source Name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} className="input" /><br></br><br></br>
      </div>

      <input type="file" accept=".csv, .xlsx, .xls, .txt"  onChange={handleFileUpload} className="file-input" />

      {sourceColumns.length > 0 && (
        <>
        <button className="btn" onClick={addDerivedColumn}>Add Column</button>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Source Column</th>
                <th>Destination Column</th>
                <th>Data Type</th>
                <th style={{ display:"flex", alignItems:"center",  gap: "4px",
    margin: 0,
    padding: "25px" }}>
  <label>CDC</label>
  <input type="checkbox" checked={isCDCEnabledAll} onChange={handleEnableAllCDC} />
</th>

                <th>Is Encrypt Enabled</th>
                <th>Is Primary Key</th>
                <th>Is Derived</th>
                 <th>Derived Expression</th>
                <th>Is Identity</th>
                 <th>Is Rolling Field</th>
                  <th>Is Dedup Ranking Field</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((col, index) => (
                <tr key={index}>
                  <td>{col}</td>
                  <td>
                    <input
                      type="text"
                      value={mapping[col]?.destination ?? ""}
                      onChange={(e) => handleMappingChange(col, "destination", e.target.value)}
                      className="input-field"
                    />
                  </td>
                  <td>
                   <select
  value={mapping[col]?.datatype}
  onChange={(e) => handleMappingChange(col, "datatype", e.target.value)}
  className="dropdown"
>
  <option value="StringType">StringType</option>
  <option value="VarcharType">VarcharType</option>
  <option value="CharType">CharType</option>
  <option value="BooleanType">BooleanType</option>
  <option value="ByteType">ByteType</option>
  <option value="ShortType">ShortType</option>
  <option value="IntegerType">IntegerType</option>
  <option value="LongType">LongType</option>
  <option value="FloatType">FloatType</option>
  <option value="DoubleType">DoubleType</option>
  <option value="DecimalType">DecimalType</option>
  <option value="DateType">DateType</option>
  <option value="TimestampType">TimestampType</option>
  <option value="TimestampNTZType">TimestampNTZType</option>
  <option value="BinaryType">BinaryType</option>
  <option value="ArrayType">ArrayType</option>
  <option value="MapType">MapType</option>
  <option value="StructType">StructType</option>
</select>
                  </td>
                  <td align="left">
                    <input
                      type="checkbox"
                      checked={mapping[col]?.isCDCEnabled}
                      onChange={(e) => handleMappingChange(col, "isCDCEnabled", e.target.checked)}
                      disabled={mapping[col]?.isPrimaryKey}
                    />
                    
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={mapping[col]?.isEncryptEnabled}
                      onChange={(e) => handleMappingChange(col, "isEncryptEnabled", e.target.checked)}
                    />
                  </td>
                  <td>
                   <input
  type="checkbox"
  checked={mapping[col]?.isPrimaryKey || false}
  onChange={(e) => handleMappingChange(col, "isPrimaryKey", e.target.checked)}
/>

                  </td>
                  <td>
  <input
    type="checkbox"
    checked={mapping[col]?.isDerived || false}
    onChange={(e) => handleMappingChange(col, "isDerived", e.target.checked)}
  />
</td>
<td>
  {mapping[col]?.isDerived && (
    <input
      type="text"
      placeholder="Enter expression"
      value={mapping[col]?.expression || ""}
      onChange={(e) => handleMappingChange(col, "expression", e.target.value)}
      className="input-field"
    />
  )}
</td>
  <td>
  <input
    type="checkbox"
    checked={mapping[col]?.isIdentity || false}
    onChange={(e) => handleMappingChange(col, "isIdentity", e.target.checked)}
  />
</td>
<td>
  <input
    type="checkbox"
    checked={mapping[col]?.isRollingField || false}
    onChange={(e) => handleMappingChange(col, "isRollingField", e.target.checked)}
  />
</td>
<td>
  <input
    type="checkbox"
    checked={mapping[col]?.isDedupRankingField || false}
    onChange={(e) => handleMappingChange(col, "isDedupRankingField", e.target.checked)}
  />
</td>
<td>
 {derivedColumns.includes(col) && (
  <button onClick={() => deleteColumn(col)}>🗑️</button>
)}
</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1} className="btn">Previous</button>
            <span className="page-info"> Page {currentPage} </span>
            <button onClick={nextPage} disabled={currentPage === Math.ceil(sourceColumns.length / rowsPerPage)} className="btn">Next</button>
          </div>
        </>
      )}

      <div>
        {/* <button className="btn" onClick={generateSQLScript}  disabled={sourceColumns.length === 0}>Generate SQL Script</button>&nbsp; */}
        <br></br>
          <Button  variant="contained" onClick={handleExecuteSql}>
                Save Changes
              </Button>

      </div>
    </div>
  );
}

export default FileUploadMapping;
