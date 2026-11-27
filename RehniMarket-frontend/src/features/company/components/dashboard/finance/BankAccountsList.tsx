/** Cuentas bancarias de la empresa: logo y nombre del banco, tipo, número enmascarado y cuenta principal,
 * con alta, edición, cambio de principal y borrado. `compact` es la tarjeta lateral del resumen financiero. */
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Landmark, Pencil, Plus, Star, Trash2 } from "lucide-react";
import axios from "axios";

import BankAccountForm from "./BankAccountForm";
import BankAccountCardSkeleton from "./BankAccountCardSkeleton";
import BankLogo from "@/features/payouts/components/BankLogo";
import ConfirmModal from "@/shared/components/ConfirmModal";
import DashboardSection from "@/shared/components/dashboard/DashboardSection";
import { EmptyState, ErrorState } from "@/shared/components/ui";
import { deleteBankAccount, getBankAccounts, updateBankAccount } from "@/features/company/api/bankAccountService";
import { BANK_ACCOUNT_TYPE_LABEL } from "@/features/payouts/utils/payoutStatus";
import { useAlert } from "@/shared/components/alert/useAlert";
import { cn } from "@/shared/utils/cn";

import type { BankAccount } from "@/features/payouts/types/response";

const ICON_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-control border border-hairline bg-surface-2 text-ink-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:opacity-50";

interface BankCardProps {
  account: BankAccount;
  compact: boolean;
  busy: boolean;
  onMakeDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function BankCard({ account, compact, busy, onMakeDefault, onEdit, onDelete }: BankCardProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-card border border-hairline bg-surface-2/40 p-3 sm:flex-nowrap sm:p-4">
      <BankLogo src={account.bankLogoUrl} name={account.bankName} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{account.bankName}</p>
        <p className="text-sm text-ink-muted">Cuenta de {BANK_ACCOUNT_TYPE_LABEL[account.accountType].toLowerCase()}</p>
        <p className="font-mono text-sm text-ink">
          <span aria-hidden="true">•••• </span>
          <span className="sr-only">Termina en </span>
          {account.lastFourDigits}
        </p>
        {!compact && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {account.accountHolder} · Doc. {account.documentNumber}
          </p>
        )}
      </div>

      {account.isDefault ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 size={13} aria-hidden="true" />
          Principal
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-ink-muted">
          <Circle size={12} aria-hidden="true" />
          Secundaria
        </span>
      )}

      <div className="flex gap-2">
        {!account.isDefault && (
          <button
            type="button"
            onClick={onMakeDefault}
            disabled={busy}
            className={ICON_BUTTON}
            title="Hacer principal"
            aria-label={`Hacer principal la cuenta de ${account.bankName} terminada en ${account.lastFourDigits}`}
          >
            <Star size={17} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className={ICON_BUTTON}
          title="Editar cuenta"
          aria-label={`Editar la cuenta de ${account.bankName} terminada en ${account.lastFourDigits}`}
        >
          <Pencil size={17} aria-hidden="true" />
        </button>
        {!compact && (
          <button
            type="button"
            onClick={onDelete}
            className={cn(ICON_BUTTON, "text-danger hover:bg-danger-bg hover:text-danger")}
            title="Eliminar cuenta"
            aria-label={`Eliminar la cuenta de ${account.bankName} terminada en ${account.lastFourDigits}`}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}

export default function BankAccountsList({ compact = false }: { compact?: boolean }) {
  const { showAlert } = useAlert();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const response = await getBankAccounts();
        if (!cancelled) setAccounts(response);
      } catch (error) {
        console.error("Error cargando cuentas bancarias:", error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const openForm = (account: BankAccount | null) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleMakeDefault = async (account: BankAccount) => {
    try {
      setBusyId(account.id);
      await updateBankAccount(account.id, { isDefault: true });
      showAlert("success", `${account.bankName} ahora es tu cuenta principal.`);
      reload();
    } catch (error) {
      console.error("Error cambiando la cuenta principal:", error);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteBankAccount(deleteTarget.id);
      showAlert("success", "Cuenta bancaria eliminada.");
      setDeleteTarget(null);
      reload();
    } catch (error) {
      console.error("Error eliminando cuenta bancaria:", error);
      const message = axios.isAxiosError(error) ? error.response?.data?.detail?.message : undefined;
      showAlert("error", message ?? "No se pudo eliminar la cuenta bancaria.");
    } finally {
      setDeleting(false);
    }
  };

  let content;
  if (loading) {
    content = (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <BankAccountCardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (failed) {
    content = (
      <ErrorState title="No se pudieron cargar tus cuentas" description="Intenta de nuevo en unos momentos." onRetry={reload} />
    );
  } else if (accounts.length === 0) {
    content = (
      <EmptyState
        variant="plain"
        icon={<Landmark size={22} />}
        title="Aún no tienes cuentas bancarias"
        description="Registra al menos una cuenta para recibir el giro de tus liquidaciones mensuales."
      />
    );
  } else {
    content = (
      <ul className="space-y-3">
        {accounts.map((account) => (
          <BankCard
            key={account.id}
            account={account}
            compact={compact}
            busy={busyId === account.id}
            onMakeDefault={() => void handleMakeDefault(account)}
            onEdit={() => openForm(account)}
            onDelete={() => setDeleteTarget(account)}
          />
        ))}
      </ul>
    );
  }

  return (
    <DashboardSection title="Cuentas bancarias" icon={<Landmark size={20} />} className="h-full">
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        {compact
          ? "Gestiona las cuentas donde recibes tus liquidaciones."
          : "Registra las cuentas donde recibes el giro neto de tus liquidaciones mensuales. La cuenta principal es la que se usa al generar cada liquidación."}
      </p>

      {content}

      <button
        type="button"
        onClick={() => openForm(null)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-card border border-dashed border-gray-300 text-sm font-medium text-ink transition hover:border-secondary hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      >
        <Plus size={18} aria-hidden="true" />
        Agregar cuenta bancaria
      </button>

      {/* El formulario toma sus valores al montarse: la key lo reinicia para cada cuenta. */}
      <BankAccountForm
        key={formOpen ? (editingAccount?.id ?? "new") : "closed"}
        isOpen={formOpen}
        account={editingAccount}
        hasExistingAccounts={accounts.length > 0}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Eliminar cuenta bancaria"
        tone="danger"
        confirmLabel="Eliminar cuenta"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        message={
          <>
            Estás a punto de eliminar la cuenta de{" "}
            <span className="font-semibold text-ink">{deleteTarget?.bankName ?? ""}</span> terminada en{" "}
            {deleteTarget?.lastFourDigits}. <span className="font-medium text-danger">Esta acción no se puede deshacer.</span>
          </>
        }
      />
    </DashboardSection>
  );
}
