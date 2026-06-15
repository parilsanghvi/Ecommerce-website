import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";

const ConfirmDeleteDialog = ({ open, onClose, onConfirm, itemName }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="delete-dialog-title"
    aria-describedby="delete-dialog-description"
    sx={{
      '& .MuiDialog-paper': {
        backgroundColor: 'var(--color-surface)',
        border: '2px solid var(--color-text)',
        boxShadow: '8px 8px 0 var(--color-primary)',
        borderRadius: 0,
        color: 'var(--color-text)'
      }
    }}
  >
    <DialogTitle id="delete-dialog-title" sx={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 900 }}>
      Confirm Delete
    </DialogTitle>
    <DialogContent>
      <Typography id="delete-dialog-description" sx={{ fontFamily: 'var(--font-body)', marginTop: '1rem' }}>
        Are you sure you want to delete this {itemName}? This action cannot be undone.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ color: 'var(--color-muted)' }}>
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        sx={{
          color: 'var(--color-primary)',
          fontWeight: 'bold'
        }}
        autoFocus
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDeleteDialog;
