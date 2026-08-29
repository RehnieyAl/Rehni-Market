import type { ReactNode } from "react";

import { Modal } from "@/shared/components/ui";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function TermsModal({ isOpen, onClose, children }: TermsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Términos y condiciones" size="lg">
      {children}
    </Modal>
  );
}
