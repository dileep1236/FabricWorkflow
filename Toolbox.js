import React from 'react';

const Toolbox = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ padding: '10px', border: '1px solid black' }}>
      <h3>Toolbox</h3>
      <div
        draggable
        onDragStart={(event) => onDragStart(event, 'process')}
        style={{ padding: '5px', border: '1px solid gray', cursor: 'grab' }}
      >
        Process Node
      </div>
    </div>
  );
};

export default Toolbox;
