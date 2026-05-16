// import React, { useState, useRef, useCallback } from "react";
// import ReactFlow, { addEdge, Background, Controls, MarkerType } from "reactflow";
// import Sidebar from "./Sidebar";
// import CustomStartNode from "./CustomStartNode";
// import CustomEndNode from "./CustomEndNode";
// import "reactflow/dist/style.css";


// function WorkflowEditor() {
//   const [nodes, setNodes] = useState([]);
//   const [edges, setEdges] = useState([]);
//   const reactFlowWrapper = useRef(null);

//   const nodeTypes = {
//     startNode: (props) => <CustomStartNode {...props} setNodes={setNodes} />,
//     endNode: (props) => <CustomEndNode {...props} setNodes={setNodes} />,
//   };
  
//   // Function to connect nodes with arrows
//   const onConnect = useCallback((params) => {
//     console.log("Connecting nodes:", params);
//     setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
//   }, []);
  
  

//   // Function to delete selected nodes
//   const onNodesDelete = useCallback((nodesToRemove) => {
//     setNodes((nds) => nds.filter((node) => !nodesToRemove.some((n) => n.id === node.id)));
//   }, []);

//   // Function to delete edges (arrows)
//   const onEdgesDelete = useCallback((edgesToRemove) => {
//     setEdges((eds) => eds.filter((edge) => !edgesToRemove.some((e) => e.id === edge.id)));
//   }, []);

//   // Function to start dragging from the sidebar
//   const onDragStart = (event, nodeType) => {
//     event.dataTransfer.setData("application/reactflow", nodeType);
//     event.dataTransfer.effectAllowed = "move";
//   };

//   // Function to drop dragged components into the workflow
//   const onDrop = (event) => {
//     event.preventDefault();
//     const nodeType = event.dataTransfer.getData("application/reactflow");
//     const position = { x: event.clientX, y: event.clientY };

//     const newNode = {
//       id: `node-${Date.now()}`,
//       type: nodeType,
//       position,
//       data: { label: `${nodeType} Node`, description: "Double-click to edit!" },
//     };

//     setNodes((prev) => [...prev, newNode]);
//   };

//   return (
//     <div style={{ display: "flex" }}>
//       {/* Sidebar for draggable components */}
//       <Sidebar onDragStart={onDragStart} />

//       {/* Workflow canvas */}
//       <div
//         style={{ width: "100%", height: "600px" }}
//         ref={reactFlowWrapper}
//         onDrop={onDrop}
//         onDragOver={(e) => e.preventDefault()}
//       >
//         <ReactFlow
//           nodes={nodes}
//           edges={edges}
//           nodeTypes={nodeTypes}
//           onConnect={onConnect}
//           onNodesDelete={onNodesDelete}
//           onEdgesDelete={onEdgesDelete}
//         >
//           <Controls />
//           <Background />
//         </ReactFlow>
//       </div>
//     </div>
//   );
// }

// export default WorkflowEditor;
