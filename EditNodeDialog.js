import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const EditNodeDialog = ({ open, onClose, nodeData, onSave }) => {
  const [label, setLabel] = useState(nodeData?.label || "");
  const [description, setDescription] = useState(nodeData?.description || "");

  const handleSave = () => {
    onSave({ label, description });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Node Properties</DialogTitle>
      <DialogContent>
        <TextField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} fullWidth />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={3} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditNodeDialog;
