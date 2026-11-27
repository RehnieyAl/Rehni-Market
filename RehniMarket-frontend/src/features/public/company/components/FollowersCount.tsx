/** Contador de seguidores del perfil: esqueleto mientras llega de la API, nunca un número inventado. */
import { Skeleton } from "@/shared/components/ui";

import { pluralize } from "./companyFormat";

export default function FollowersCount({ count }: { count: number | null }) {
  if (count === null) return <Skeleton className="h-4 w-16 dark:bg-surface-3" />;

  return <>{pluralize(count, "seguidor", "seguidores")}</>;
}
