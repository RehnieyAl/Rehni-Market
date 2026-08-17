import AccountSettings from "@/features/public/auth/components/AccountSettings";

// "Configuración de cuenta" es común a cualquier rol (user/company/admin/
// owner) - la lógica vive una sola vez en AccountSettings (ver
// features/public/auth/components/AccountSettings.tsx). Este archivo solo
// monta esa vista compartida en el dashboard de empresa.
export default function Profile() {
  return <AccountSettings />;
}
