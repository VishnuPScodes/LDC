// The "question paper order" bookmark marks how far a learner has read through the bank.
// It must only move forward: answering an older question (e.g. a review item) must not rewind it.
export function shouldAdvancePdfBookmark(currentPdfOrder: number | null | undefined, answeredPdfOrder: number | null | undefined): boolean {
  if (!answeredPdfOrder) return false;
  if (!currentPdfOrder) return true;
  return answeredPdfOrder > currentPdfOrder;
}
