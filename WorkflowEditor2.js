import React, { useEffect, useRef, useState } from "react";
import * as joint from "jointjs";
import "jointjs/dist/joint.css";

const Sidebar = ({ onDragStart }) => (
  <div style={{ padding: "10px", background: "#f3f3f3", width: "150px" }}>
    <h5>Components</h5>
    {["EIM Object", "Cleanse", "Standardize", "Lookup", "Source", "Match", "CustomScript", "Outbound"].map((component) => (
      <div
        key={component}
        draggable
        onDragStart={(event) => onDragStart(event, component)}
        style={{ padding: "5px", background: "lightblue", cursor: "grab", marginBottom: "5px" }}
      >
        {component}
      </div>
    ))}
  </div>
);

const WorkflowEditor = () => {
  const paperRef = useRef(null);
  const graph = useRef(new joint.dia.Graph());

  useEffect(() => {
    const paper = new joint.dia.Paper({
      el: paperRef.current,
      model: graph.current,
      width: 800,
      height: 500,
      gridSize: 10,
      interactive: true,
      
    });

 // Enable dragging the canvas itself (background area)
 paper.on("blank:pointerdown", (event, x, y) => {
    document.addEventListener("mousemove", (e) => {
      paper.translate(e.offsetX - x, e.offsetY - y);
    });

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", null);
    });
  });

  return () => paper.remove();
}, []);
    


  const addNode = (label, position) => {
    const node = new joint.shapes.standard.Rectangle();
    node.position(position.x, position.y);
    node.resize(120, 50);
    node.attr({
      body: { fill: "#fff", stroke: "black", rx: 6, ry: 6 },
      label: { text: label, fill: "black" },
    });

    node.addTo(graph.current);
    return node;
  };

  const connectNodes = (sourceNode, targetNode) => {
    const link = new joint.dia.Link({
      source: { id: sourceNode.id },
      target: { id: targetNode.id },
      attrs: { line: { stroke: "black", strokeWidth: 2, targetMarker: { type: "circle", r: 5, fill: "black" } } },
    });

    graph.current.addCell(link);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData("text/plain");
    if (!nodeType) {
      console.error("No data retrieved from drag event.");
      return;
    }

    const paperOffset = paperRef.current.getBoundingClientRect();
    const position = { x: event.clientX - paperOffset.left, y: event.clientY - paperOffset.top };

    const newNode = addNode(nodeType, position);

    // Connect nodes if dropped near another node
    const nearbyNodes = graph.current.findModelsFromPoint(position);
    const targetNode = nearbyNodes.find((node) => node.id !== newNode.id);
    if (targetNode) connectNodes(newNode, targetNode);
  };

  return (
    <div style={{ display: "flex", height: "500px" }}>
      <Sidebar onDragStart={(event, nodeType) => event.dataTransfer.setData("text/plain", nodeType)} />
      <div
        style={{ flexGrow: 1, border: "1px solid black", position: "relative" }}
        ref={paperRef}
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
      />
    </div>
  );
};

export default WorkflowEditor;
