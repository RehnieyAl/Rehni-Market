import { Badge } from "@/shared/components/ui";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "../utils/payoutStatus";

import type { PayoutStatus } from "../types/response";

export default function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Badge tone={PAYOUT_STATUS_TONE[status]}>{PAYOUT_STATUS_LABEL[status]}</Badge>;
}
