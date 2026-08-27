import { PAYOUT_STATUS_BADGE, PAYOUT_STATUS_LABEL } from "../utils/payoutStatus";

import type { PayoutStatus } from "../types/response";

export default function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${PAYOUT_STATUS_BADGE[status]}`}
    >
      {PAYOUT_STATUS_LABEL[status]}
    </span>
  );
}
