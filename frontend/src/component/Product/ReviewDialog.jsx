import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Rating } from "@mui/material";

const ReviewDialog = ({
  open,
  submitReviewToggle,
  rating,
  setRating,
  comment,
  setComment,
  reviewSubmitHandler
}) => {
  return (
    <Dialog
      aria-labelledby="submit-review-dialog-title"
      open={open}
      onClose={submitReviewToggle}
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
      <DialogTitle id="submit-review-dialog-title" sx={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', fontWeight: 900 }}>Submit Review</DialogTitle>
      <DialogContent className="submitDialog">
        <Rating
          onChange={(e, newValue) => setRating(newValue)}
          value={rating}
          size="large"
          aria-label="Rating"
          sx={{
            '& .MuiRating-iconFilled': { color: 'var(--color-primary)' },
            '& .MuiRating-iconEmpty': { color: 'var(--color-muted)' }
          }}
        />
        <textarea
          className="submitDialogTextArea"
          cols="30"
          rows="5"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review here..."
          aria-label="Review comment"
        ></textarea>
      </DialogContent>
      <DialogActions>
        <Button onClick={submitReviewToggle} sx={{ color: 'var(--color-muted)' }}>
          Cancel
        </Button>
        <Button
          onClick={reviewSubmitHandler}
          disabled={rating <= 0 || comment.trim().length === 0}
          sx={{
            color: (rating <= 0 || comment.trim().length === 0) ? 'var(--color-muted)' : 'var(--color-primary)',
            fontWeight: 'bold'
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewDialog;
