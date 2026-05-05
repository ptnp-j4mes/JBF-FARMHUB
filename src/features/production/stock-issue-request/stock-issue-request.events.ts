export const STOCK_ISSUE_REQUESTS_CHANGED_EVENT = 'stock-issue-requests-changed';

export function notifyStockIssueRequestsChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(STOCK_ISSUE_REQUESTS_CHANGED_EVENT));
}
