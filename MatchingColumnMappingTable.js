import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const MatchingColumnMappingTable = ({
  sourceColumns,
  referenceColumns,
  mappings,
  setMappings,
  addMapping,
  removeMapping,
}) => {
  const handleChange = (index, key, value) => {
    const updated = [...mappings];
    updated[index][key] = value;
    setMappings(updated);
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <Form.Label>Matching Columns</Form.Label>
        <Button variant="link" size="sm" onClick={addMapping} style={{ textDecoration: 'none' }}>
          Add Matching Column
        </Button>
      </div>
      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
        <Table size="sm" bordered className="eimtable">
          <thead>
            <tr>
              <th>Source Column</th>
              <th>Reference Column</th>
              <th>Match Type</th>
              <th>Weightage</th>
              <th>Similarity</th>
              <th>IsMatchColumn</th>
              <th>IsOutputColumn</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mappings.map((row, i) => (
              <tr key={row.id || i}>
                <td>
                  <Form.Select
                    size="sm"
                    value={row.SourceColumnName}
                    onChange={(e) => handleChange(i, 'SourceColumnName', e.target.value)}
                  >
                    {sourceColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Form.Select>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={row.ReferenceColumnName || ''}
                    onChange={(e) => handleChange(i, 'ReferenceColumnName', e.target.value)}
                  >
                    <option value="">--</option>
                    {referenceColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Form.Select>
                </td>
                <td>
                  <Form.Select
                    size="sm"
                    value={row.MatchType}
                    onChange={(e) => handleChange(i, 'MatchType', e.target.value)}
                    style={{ width: '80px' }}
                  >
                    <option value="None">None</option>
                    <option value="Exact">Exact</option>
                    <option value="Fuzzy">Fuzzy</option>
                  </Form.Select>
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={row.MatchType === 'None' ? '' : row.Weightage}
                    disabled={row.MatchType === 'None'}
                    onChange={(e) => handleChange(i, 'Weightage', e.target.value)}
                    style={{ width: '80px' }}
                  />
                </td>
                <td>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={
                      row.MatchType === 'None'
                        ? ''
                        : row.MatchType === 'Exact'
                        ? '1'
                        : row.Similarity || ''
                    }
                    disabled={row.MatchType === 'None' || row.MatchType === 'Exact'}
                    onChange={(e) => handleChange(i, 'Similarity', e.target.value)}
                    style={{ width: '80px' }}
                  />
                </td>
                <td>
                  <Form.Check
                    type="radio"
                    name={`match_${i}`}
                    checked={row.IsMatchColumn === true}
                    onChange={() => handleChange(i, 'IsMatchColumn', true)}
                  />
                </td>
                <td>
                  <Form.Check
                    type="radio"
                    name={`match_${i}`}
                    checked={row.IsMatchColumn === false}
                    onChange={() => handleChange(i, 'IsMatchColumn', false)}
                  />
                </td>
                <td>
                  <Button variant="light" size="sm" onClick={() => removeMapping(i)}>
                    <i className="glyphicon glyphicon-remove" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default MatchingColumnMappingTable;
