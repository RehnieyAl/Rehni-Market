/** Estado de "Seguir tienda": contador público para todos y estado propio del comprador, ambos
 * leídos de la API (PostgreSQL), con una sola petición de seguir/dejar de seguir a la vez. */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  followCompany,
  getCompanyFollowers,
  getCompanyFollowStatus,
  unfollowCompany,
} from "@/features/public/company/api/companyService";
import { useRole } from "@/hooks/useRole";

export function useCompanyFollow(companyId: string | undefined) {
  const { role, status } = useRole();
  const isBuyer = role === "user";

  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!companyId || status === "loading") return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        if (isBuyer) {
          const state = await getCompanyFollowStatus(companyId);
          if (cancelled) return;
          setFollowersCount(state.followers_count);
          setIsFollowing(state.is_following);
        } else {
          const counter = await getCompanyFollowers(companyId);
          if (cancelled) return;
          setFollowersCount(counter.followers_count);
          setIsFollowing(false);
        }
      } catch (error) {
        console.error("Error cargando los seguidores de la empresa:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [companyId, isBuyer, status]);

  const toggleFollow = useCallback(async () => {
    // El ref corta el doble clic antes del siguiente render; `pending` solo pinta el estado.
    if (!companyId || !isBuyer || pendingRef.current) return;

    pendingRef.current = true;
    setPending(true);

    try {
      const state = isFollowing
        ? await unfollowCompany(companyId)
        : await followCompany(companyId);

      setFollowersCount(state.followers_count);
      setIsFollowing(state.is_following);
    } catch (error) {
      // El interceptor de la API ya muestra el mensaje; el estado anterior se conserva.
      console.error("Error actualizando el seguimiento de la empresa:", error);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [companyId, isBuyer, isFollowing]);

  return { followersCount, isFollowing, loading, pending, toggleFollow };
}
