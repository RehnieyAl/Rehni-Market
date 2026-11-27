/** Contacto institucional publicado, pedido una vez por carga de la app (lo usan el footer y la ayuda). */
import { useEffect, useState } from "react";

import { getPublicPlatformContact, type PublicPlatformContact } from "../api/platformContactService";

let request: Promise<PublicPlatformContact | null> | null = null;

function loadOnce(): Promise<PublicPlatformContact | null> {
  // Un fallo no debe romper el footer: sin contacto simplemente no se muestra el bloque.
  request ??= getPublicPlatformContact().catch(() => {
    request = null;
    return null;
  });
  return request;
}

export function resetPublicPlatformContactCache() {
  request = null;
}

export default function usePublicPlatformContact(): PublicPlatformContact | null {
  const [contact, setContact] = useState<PublicPlatformContact | null>(null);

  useEffect(() => {
    let active = true;
    void loadOnce().then((value) => {
      if (active) setContact(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return contact;
}
