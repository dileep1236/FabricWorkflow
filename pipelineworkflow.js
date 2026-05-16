import React, { useState, useRef, useCallback } from 'react';
import { getBezierPath } from 'reactflow';
import CustomEdge from './CustomEdge'; // Assuming you have this component
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { applyEdgeChanges } from 'reactflow';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import PipelineButton from './PipelineButton'; // Assuming you have this component
import SourceToValidatedHybridEditor from './BronzeToValidatedConfigEditor';
// Sidebar
const Sidebar = ({ onDragStart }) => (
  <div style={{ padding: '10px', background: '#f3f3f3', width: '150px' }}>
    <h5>Components</h5>
    {['sourcetobronze', 'bronzetovalidated', 'validatedtoenriched', 'enrichedtogold'].map((component) => (
      <div
        key={component}
        draggable
        onDragStart={(e) => onDragStart(e, component)}
        style={{
          padding: '5px',
          background: 'lightblue',
          cursor: 'grab',
          marginBottom: '5px',
        }}
      >
        {component}
      </div>
    ))}
  </div>
);


// Custom Node
const CustomNode = ({ id, data }) => {
  const { label, deleteNode, status } = data;

  const getBackground = () => {
    switch (status) {
      case 'loading': return '#fff4cc';
      case 'success': return '#d4f7dc';
      case 'error': return '#fde3e3';
      default: return '#ffffff';
    }
  };

  return (
    <div style={{
      padding: '10px',
      background: getBackground(),
      border: '1px solid black',
      borderRadius: '6px',
      position: 'relative',
      textAlign: 'center',
      minWidth: '120px'
    }}>
      <span>{label}</span>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ marginTop: '6px', fontSize: '14px' }}>
        {status === 'loading' && <span className="spinner">⏳</span>}
        {status === 'success' && <span style={{ color: 'green' }}>✅</span>}
        {status === 'error' && <span style={{ color: 'red' }}>❌</span>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(id);
        }}
        style={{
          position: 'absolute',
          top: '-7px',
          right: '-7px',
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          border: 'none',
          background: '#ccc',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
    </div>
  );
};

const nodeTypes = { customNode: CustomNode };

const PipelineWorkflow1 = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState("idle"); // "idle" | "running" | "done"
  const [edgeSequenceCounter, setEdgeSequenceCounter] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeParams, setNodeParams] = useState({
    projectname: '',
    sourcename: '',
    pipelinerunid: ''
  });

  const reactFlowWrapper = useRef(null);

  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  };

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event) => {
    
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    };

    const newNode = {
      id: `${+new Date()}`,
      type: 'customNode',
      position,
      data: {
        label: nodeType,
        deleteNode,
        parameters: {
          projectname: '',
          sourcename: '',
          pipelinerunid: ''
        }
      },
      status: 'idle'
    };

    setNodes((nds) => [...nds, newNode]);
  };
// const [edges, setEdges] = useState([
//   {
//     id: 'e1-2',
//     source: '1',
//     target: '2',
//     type: 'custom',
   
//     data: {
//        sequence: 1,
//       onDelete: (edgeId) => {
//         setEdges((eds) => eds.filter((e) => e.id !== edgeId));
//       },
//       onSequenceChange: handleSequenceChange
//     },
//   },
// ]);
  const onEdgesChange = useCallback(
  (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  },
  [setEdges]
);
const handleSequenceChange = (edgeId, newSeq) => {
  setEdges((edges) =>
    edges.map((e) =>
      e.id === edgeId ? { ...e, data: { ...e.data, sequence: newSeq } } : e
    )
  );
};
const onConnect = (params) => {
  const newEdge = {
    ...params,
    id: `${params.source}-${params.target}`,
    type: 'custom',
    data: {
       sequence: edgeSequenceCounter,
      onDelete: (edgeId) => {
        setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      },
      onSequenceChange: handleSequenceChange
    },
  };
  setEdges((eds) => [...eds, newEdge]);
   setEdgeSequenceCounter((prev) => prev + 1);
};
  const onNodeDoubleClick = (_, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeParams(node.data.parameters || {});
  };

  const handleSave = () => {
    const updated = nodes.map((node) =>
      node.id === selectedNode.id
        ? {
            ...node,
            data: {
              ...node.data,
              label: nodeLabel,
              deleteNode,
              parameters: nodeParams
            }
          }
        : node
    );
    setNodes(updated);
    setSelectedNode(null);
  };

const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  // const handleRun = async () => {
  //   for (const node of nodes) {
  //     const { parameters = {}, label } = node.data;
  //     const payload = {
  //       projectname: parameters.projectname || 'defaultProject',
  //       sourcename: parameters.sourcename || 'defaultSource',
  //       pipelinename: label,
  //       pipelinerunid: parameters.pipelinerunid || `run_${Date.now()}`
  //     };

  //     try {
  //       const res = await fetch('http://localhost:5000/api/run-pipeline', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(payload)
  //       });

  //       const result = await res.json();
  //           if (result.status === "Succeeded") {
  //     setStatus("success");
  //   } else {
  //     setStatus("error");
  //   }
  //       console.log(`✅ Triggered ${label}:`, result.runId);
  //     } catch (err) {
  //       console.error(`❌ Failed ${label}:`, err);
  //     }
  //   }
  // };
  const traverseAndExecute = async () => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map();

  // Build adjacency list from edges
  edges.forEach(({ source, target }) => {
    if (!adjacency.has(source)) adjacency.set(source, []);
    adjacency.get(source).push(target);
  });

  const visited = new Set();
  const recursionStack = new Set();
  let cycleDetected = false;

  const dfs = async (nodeId) => {
    if (recursionStack.has(nodeId)) {
      console.error(`♻️ Cycle detected at node ${nodeId}`);
      cycleDetected = true;
      return;
    }

    if (visited.has(nodeId) || cycleDetected) return;

    recursionStack.add(nodeId);
    visited.add(nodeId);

    const currentNode = nodeMap.get(nodeId);
    if (!currentNode) return;

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status: 'loading' } } : n
      )
    );

    try {
      const payload = {
        projectname: currentNode.data.parameters?.projectname || 'defaultProject',
        sourcename: currentNode.data.parameters?.sourcename || 'defaultSource',
        pipelinename: currentNode.data.label,
        pipelinerunid:
          currentNode.data.parameters?.pipelinerunid || `run_${Date.now()}`
      };

      const res = await fetch('http://localhost:5000/api/run-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      const status = result.status === 'Completed' ? 'success' : 'error';

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
        )
      );

      console.log(`✅ Ran: ${currentNode.data.label}`);
    } catch (err) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n
        )
      );
      console.error(`❌ Error at ${currentNode.data.label}`, err);
    }

    const children = adjacency.get(nodeId) || [];
    for (const childId of children) {
      await dfs(childId);
    }

    recursionStack.delete(nodeId);
  };

  // Find all start nodes
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    console.warn('⚠️ No start nodes found.');
    return;
  }

  for (const start of startNodes) {
    await dfs(start.id);
    if (cycleDetected) {
      alert('⚠️ Cycle detected in the graph. Execution halted.');
      break;
    }
  }
};

// const executeEdgesBySequence = async () => {
//   const sortedEdges = [...edges].sort(
//     (a, b) => (a.data?.sequence ?? 0) - (b.data?.sequence ?? 0)
//   );

//   for (const edge of sortedEdges) {
//     const source = nodes.find((n) => n.id === edge.source);
//     const target = nodes.find((n) => n.id === edge.target);

//     if (!source || !target) {
//       console.warn(`⚠️ Skipping edge ${edge.id}: missing source or target`);
//       continue;
//     }

//     // Mark nodes as running
//     setNodes((prev) =>
//       prev.map((n) =>
//         n.id === source.id || n.id === target.id
//           ? { ...n, data: { ...n.data, status: "loading" } }
//           : n
//       )
//     );
//   await new Promise((res) => setTimeout(res, 100));
//     try {
//       const payload = {
//         projectname: source.data.parameters?.projectname || "defaultProject",
//         sourcename: source.data.parameters?.sourcename || "defaultSource",
//         pipelinename: source.data.label,
//         pipelinerunid:
//           source.data.parameters?.pipelinerunid || `run_${Date.now()}`,
//       };

//       const res = await fetch("http://localhost:5000/api/run-pipeline", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const result = await res.json();
//       const status = result.status === "Completed" ? "success" : "error";

//       setNodes((prev) =>
//         prev.map((n) =>
//           n.id === source.id || n.id === target.id
//             ? { ...n, data: { ...n.data, status } }
//             : n
//         )
//       );

//       console.log(`✅ Executed edge ${edge.id} [${edge.data.sequence}]`);
//     } catch (err) {
//       setNodes((prev) =>
//         prev.map((n) =>
//           n.id === source.id || n.id === target.id
//             ? { ...n, data: { ...n.data, status: "error" } }
//             : n
//         )
//       );
//       console.error(`❌ Edge ${edge.id} failed:`, err);
//     }
//   }
// };

  const handleRun = async () => {
  setWorkflowStatus("running");

  const promises = nodes.map(async (node) => {
    const { parameters = {}, label } = node.data;
    const nodeId = node.id;
    const payload = {
      projectname: parameters.projectname || 'defaultProject',
      sourcename: parameters.sourcename || 'defaultSource',
      pipelinename: label,
      pipelinerunid: parameters.pipelinerunid || `run_${Date.now()}`
    };

    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status: 'loading' } }
          : n
      )
    );

    try {
      const res = await fetch('http://localhost:5000/api/run-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: result.status === 'Completed' ? 'success' : 'error'
                }
              }
            : n
        )
      );

      console.log(`✅ Triggered ${label}:`, result.runId);
    } catch (err) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, status: 'error' } }
            : n
        )
      );
      console.error(`❌ Failed ${label}:`, err);
    }
  });

  //promises is now defined
  await Promise.allSettled(promises);
  setWorkflowStatus("done");
};
// const handleRun = async () => {
//   setWorkflowStatus("running");

//   try {
//     await traverseAndExecute();
//   } catch (err) {
//     console.error("Execution failed:", err);
//   }

//   setWorkflowStatus("done");
// };
// const handleRun = async () => {
//   setStatus("loading");

//   try {
//     const res = await fetch("http://localhost:5000/api/run-pipeline", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ /* your payload */ })
//     });

//     const data = await res.json();

//     if (data.status === "Succeeded") {
//       setStatus("success");
//     } else {
//       setStatus("error");
//     }
//   } catch (error) {
//     console.error("Pipeline trigger failed:", error);
//     setStatus("error");
//   }
// };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar onDragStart={onDragStart} />
      <div
        ref={reactFlowWrapper}
        className="workflow-area"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ flexGrow: 1, position: 'relative' }}
      >
       
     <button
  onClick={handleRun}
  disabled={workflowStatus === "running"}
  style={{
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 16px',
    background: '#0078d4',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    zIndex: 10,
    cursor: workflowStatus === "running" ? 'not-allowed' : 'pointer'
  }}
>
  {workflowStatus === "running" ? (
    <>
      Running...
      <span className="spinner">⏳</span>
    </>
  ) : (
    "Run Workflow 🚀"
  )}
</button>
{/* <PipelineButton
  payload={{
    parameters: {
      ProjectName: "MyProject",
      Source: "MySource",
      PipelineName: "MyPipeline",
      pipelinerunid: "run-001"
    }
  }}
  endpoint="http://localhost:5000/api/run-pipeline"
/> */}
        <ReactFlow
          nodes={nodes.map((n) => ({ ...n, data: { ...n.data, deleteNode } }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          edgeTypes={{ custom: CustomEdge }}
          nodeTypes={nodeTypes}
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>

      <Dialog open={!!selectedNode} onClose={() => setSelectedNode(null)} fullWidth maxWidth="md">
  <DialogTitle>Edit Node</DialogTitle>
  <DialogContent>
    <TextField
      label="Label"
      fullWidth
      value={nodeLabel}
      onChange={(e) => setNodeLabel(e.target.value)}
      margin="normal"
    />
    <TextField
      label="Project Name"
      fullWidth
      value={nodeParams.projectname}
      onChange={(e) =>
        setNodeParams((prev) => ({ ...prev, projectname: e.target.value }))
      }
      margin="normal"
    />
    <TextField
      label="Source Name"
      fullWidth
      value={nodeParams.sourcename}
      onChange={(e) =>
        setNodeParams((prev) => ({ ...prev, sourcename: e.target.value }))
      }
      margin="normal"
    />
    <TextField
      label="Pipeline Run ID"
      fullWidth
      value={nodeParams.pipelinerunid}
      onChange={(e) =>
        setNodeParams((prev) => ({ ...prev, pipelinerunid: e.target.value }))
      }
      margin="normal"
    />
    {/* <SourceToValidatedHybridEditor></SourceToValidatedHybridEditor> */}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleSave} variant="contained">Save</Button>
    <Button onClick={() => setSelectedNode(null)}>Cancel</Button>
  </DialogActions>
</Dialog>
      </div>
    </div>
  );
};

export default PipelineWorkflow1;
