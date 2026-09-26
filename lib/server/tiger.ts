// Analytics facade (task 2.3 / C2/C3).
//
// lib/server/tiger.ts is the fixed facade name: projectEvent comes from the
// pure projection, writeMetricBatch/getAccessSummary from the Tiger store.
// No Supabase client lives in this module; analytics consumes committed
// events and never controls the workflow.

export {
  projectEvent,
  caseHash,
  metricEventConflict,
  type CommittedEvent,
  type MetricEvent,
} from './analytics/project';
export {
  writeMetricBatch,
  getAccessSummary,
  payloadHash,
  EventConflictError,
} from './analytics/store';
export { summarize } from './analytics/summary';