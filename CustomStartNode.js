import React, { useState } from "react";
import { Handle } from "reactflow";
import EditNodeDialog from "./EditNodeDialog";

const CustomStartNode = ({ data, id, setNodes }) => {
  const [open, setOpen] = useState(false);

  const handleDoubleClick = () => setOpen(true);

  const handleSave = (newData) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, data: { ...newData } } : node))
    );
  };

  return (
    <div
      style={{ padding: 10, borderRadius: 5, background: "#4CAF50", color: "white", cursor: "pointer" }}
      onDoubleClick={handleDoubleClick}
    >
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle type="source" position="bottom" />
      <EditNodeDialog open={open} onClose={() => setOpen(false)} nodeData={data} onSave={handleSave} />
    </div>
  );
};

export default CustomStartNode;
