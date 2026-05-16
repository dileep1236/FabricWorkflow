import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { debounce } from 'lodash';

// Sidebar component
const Sidebar = ({ onDragStart }) => (
  <div style={{ padding: '10px', background: '#f3f3f3', width: '150px' }}>
    <h5>Components</h5>
    {['sourcetobronze', 'bronzetovalidated', 'validatedtoenriched', 'enrichedtogold'].map((component) => (
      <div
        key={component}
        draggable
        onDragStart={(event) => onDragStart(event, component)}
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

// Custom Node with Delete Button
const CustomNode = ({ id, data }) => (
    <div style={{
      padding: '10px',
      background: '#fff',
      border: '1px solid black',
      position: 'relative',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <span>{data.label}</span>
  
      {/* Add connection markers */}
      <Handle type="target" position={Position.top} />
      <Handle type="source" position={Position.Bottom} />
  
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent click interference
          data.deleteNode(id);
        }}
        style={{
            position: 'absolute',
            top: '-7px', // Adjust distance from the top
            left: '92%', // Center it horizontally
            transform: 'translateX(-50%)', // Perfect centering
            width: '5px',
            height: '5px',
            background: 'transparent',
            border: 'none',
            color: 'gray',
            fontSize: '7px',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
      >
        ❌
      </button>
    </div>
  );
  
const nodeTypes = { customNode: CustomNode };

const WorkflowEditor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');

  // Handle node deletion
  const deleteNode = (nodeId) => {
    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.filter((node) => node.id !== nodeId);
  
      if (!Array.isArray(updatedNodes)) {
        console.error("updatedNodes is not an array", updatedNodes);
        return prevNodes; // Prevent breaking the app
      }
  
      adjustWorkflowSize(updatedNodes); // Resize dynamically after deletion
      return updatedNodes;
    });
  
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };
  

  // Dragging nodes from sidebar
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // Dropping new nodes onto the canvas
//   const onDrop = (event) => {
//     event.preventDefault();
//     const nodeType = event.dataTransfer.getData("application/reactflow");
//     if (!nodeType) return;

//     const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
//     const position = {
//       x: event.clientX - reactFlowBounds.left,
//       y: event.clientY - reactFlowBounds.top,
//     };

//     const newNode = {
//       id: `${nodes.length + 1}`,
//       type: 'customNode',
//       position,
//       data: { label: nodeType, deleteNode },
//     };

//     setNodes((prevNodes) => [...prevNodes, newNode]);
//   };
const onDrop = (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData("application/reactflow");
    if (!nodeType) return;
  
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
  
    const newNode = {
      id: `${nodes.length + 1}`,
      type: 'customNode',
      position,
      data: { label: nodeType, deleteNode },
    };
  
    setNodes((prevNodes) => {
      const updatedNodes = Array.isArray(prevNodes) ? [...prevNodes, newNode] : [newNode]; // ✅ Ensure array format
      adjustWorkflowSize(updatedNodes); // Resize dynamically
      return updatedNodes;
    });
  };
  const adjustWorkflowSize = (updatedNodes) => {
    const workflowArea = document.querySelector('.workflow-area');
  
    if (!workflowArea) return;
  
    // If there are no nodes left, reset to default size
    if (updatedNodes.length === 0) {
      workflowArea.style.width = `500px`; // Default min width
      workflowArea.style.height = `500px`; // Default min height
      return;
    }
  
    // Find the farthest node position among remaining nodes
    const maxX = Math.max(...updatedNodes.map((node) => node.position.x + 100), 500);
    const maxY = Math.max(...updatedNodes.map((node) => node.position.y + 100), 500);
  
    // ✅ Ensure resizing **only** expands but **doesn't increase height** unnecessarily
    const currentHeight = workflowArea.offsetHeight;
    const currentWidth = workflowArea.offsetWidth;
  
    workflowArea.style.width = maxX > currentWidth ? `${maxX + 50}px` : `${currentWidth}px`;
    workflowArea.style.height = maxY < currentHeight ? `${maxY + 50}px` : `${currentHeight}px`;
  };
  
  
  // Node double-click to open edit dialog
  const onNodeDoubleClick = (event, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
  };

  // Save changes to node label
  const handleSave = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { label: nodeLabel, deleteNode } } : node
      )
    );
    setSelectedNode(null);
  };

  // Fixing ResizeObserver loop issue
  useEffect(() => {
    const workflowArea = reactFlowWrapper.current;

    if (!workflowArea) return;

    const observer = new ResizeObserver((entries) => {
      console.log("Workflow resized:", entries[0].contentRect);
    });

    observer.observe(workflowArea);

    return () => observer.disconnect();
  }, []);
  const onConnect = useCallback((params) => {
    console.log("Connecting nodes:", params);
    setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, []);
  
  return (
    <div style={{ display: 'flex', height: '500px' }}>
      <Sidebar onDragStart={onDragStart} />
      <div
        className="workflow-area"
        style={{ flexGrow: 1, border: '1px solid black' }}
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            data: { ...node.data, deleteNode },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>

      {/* Edit Node Dialog */}
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '20px',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '5px',
          }}
        >
          <h3>Edit Node Label</h3>
          <input
            type="text"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
          />
          <button onClick={handleSave} style={{ margin: '10px' }}>
            Save
          </button>
          <button onClick={() => setSelectedNode(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default WorkflowEditor;
