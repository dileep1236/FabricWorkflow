function Sidebar({ onDragStart }) {
    return (
      <div style={{ padding: 10, border: "1px solid #ccc", width: 200 }}>
        <div draggable onDragStart={(e) => onDragStart(e, "startNode")}>Start Node</div>
        <div draggable onDragStart={(e) => onDragStart(e, "endNode")}>End Node</div>
      </div>
    );
  }
  
  export default Sidebar;
  