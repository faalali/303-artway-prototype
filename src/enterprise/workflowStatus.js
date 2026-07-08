/**
 * workflowStatus.js
 *
 * State constants for administrative review pipelines
 * covering registry submissions, approvals, contact records, and funding cycles.
 */
export const WORKFLOW_STATES = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  CONTACTED: 'contacted',
  FUNDED: 'funded',
  ARCHIVED: 'archived'
};
