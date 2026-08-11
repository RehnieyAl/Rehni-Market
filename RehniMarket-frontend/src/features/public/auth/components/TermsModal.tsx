import Modal from "@/shared/components/modal";
import type { ReactNode } from "react";


interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}


export default function TermsModal({
  isOpen,
  onClose,
  children,
}: TermsModalProps) {

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Términos y Condiciones"
    >
      {children}
    </Modal>
  );
}