import React, { useState } from 'react';
import { Modal, Box, TextField, Button } from '@mui/material';

const EditModal = ({ open, handleClose, nodeData, updateNode }) => {
  const [label, setLabel] = useState(nodeData.label);

  const handleSave = () => {
    updateNode(nodeData.id, label);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ p: 3, bgcolor: 'white', width: 300, mx: 'auto', mt: 10 }}>
        <h3>Edit Node</h3>
        <TextField
          label="Node Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          fullWidth
        />
        <Button onClick={handleSave} variant="contained" sx={{ mt: 2 }}>
          Save
        </Button>
      </Box>
    </Modal>
  );
};

export default EditModal;