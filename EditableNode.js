import React, { useState } from 'react';

const EditableNode = ({ data, id, updateNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = () => setIsEditing(true);
  const handleBlur = () => {
    setIsEditing(false);
    updateNode(id, label);
  };

  return isEditing ? (
    <input
      type="text"
      value={label}
      onChange={(e) => setLabel(e.target.value)}
      onBlur={handleBlur}
      autoFocus
    />
  ) : (
    <div onDoubleClick={handleDoubleClick}>{label}</div>
  );
};

export default EditableNode;
