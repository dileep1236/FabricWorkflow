import React, { useState } from "react";
import { Handle } from "reactflow";
import EditNodeDialog from "./EditNodeDialog";





const CustomEndNode = ({ data } ) => {
  return (
    <div
    style={{ padding: 10, borderRadius: 5, background: "#4CAF50", color: "white", cursor: "pointer" }}
   
  >
    <strong>{data.label}</strong>
    <p>{data.description}</p>
    <Handle type="source" position="bottom" />
  
  </div>
  );
};

export default CustomEndNode;
