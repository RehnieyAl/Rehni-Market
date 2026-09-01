import { Lock, Unlock } from "lucide-react";

import ConfirmModal from "@/shared/components/ConfirmModal";

interface UserStatusConfirmModalProps {
  isOpen: boolean;
  userName: string;
  active: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function UserStatusConfirmModal({
  isOpen,
  userName,
  active,
  loading,
  onConfirm,
  onClose,
}: UserStatusConfirmModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      tone={active ? "danger" : "success"}
      icon={active ? <Lock size={22} /> : <Unlock size={22} />}
      title={active ? "Bloquear usuario" : "Desbloquear usuario"}
      confirmLabel={active ? "Bloquear usuario" : "Desbloquear usuario"}
      loading={loading}
      onConfirm={onConfirm}
      onClose={onClose}
      message={
        <>
          <span className="font-semibold text-gray-900">{userName}</span>
          {active
            ? " perderá el acceso a su cuenta y no podrá iniciar sesión hasta que sea desbloqueado."
            : " podrá volver a acceder a su cuenta."}
        </>
      }
    />
  );
}
