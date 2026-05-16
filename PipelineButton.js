import React, { useState } from "react";

const PipelineButton = ({ label = "Run Pipeline", endpoint = "/run-pipeline", payload }) => {
  const [status, setStatus] = useState("idle"); // "idle", "loading", "success", "error"

  const handleClick = async () => {
    setStatus("loading");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === "Succeeded") {
        setStatus("success");
      } else {
        console.error("Pipeline failed:", data);
        setStatus("error");
      }
    } catch (err) {
      console.error("Pipeline error:", err);
      setStatus("error");
    }
  };

  const renderStatusIcon = () => {
    switch (status) {
      case "loading":
        return <span className="spinner">⏳</span>;
      case "success":
        return <span className="success">✅</span>;
      case "error":
        return <span className="error">❌</span>;
      default:
        return null;
    }
  };

  return (
    <button
      className={`pipeline-btn ${status}`}
      onClick={handleClick}
      disabled={status === "loading"}
    >
      {renderStatusIcon()}
      {status === "idle" && label}
      {status === "loading" && "Running..."}
      {status === "success" && "Success!"}
      {status === "error" && "Failed"}
    </button>
  );
};

export default PipelineButton;