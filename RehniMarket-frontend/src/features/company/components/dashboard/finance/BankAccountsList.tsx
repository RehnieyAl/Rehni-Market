import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import axios from "axios";

import BankAccountForm from "./BankAccountForm";
import ConfirmModal from "@/shared/components/ConfirmModal";
import BankAccountCardSkeleton from "./BankAccountCardSkeleton";
import { EmptyState } from "@/shared/components/ui";

import { deleteBankAccount, getBankAccounts } from "@/features/company/api/bankAccountService";
import { BANK_ACCOUNT_TYPE_LABEL } from "@/features/payouts/utils/payoutStatus";
import { useAlert } from "@/shared/components/alert/useAlert";

import type { BankAccount } from "@/features/payouts/types/response";

export default function BankAccountsList() {
  const { showAlert } = useAlert();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await getBankAccounts();
      setAccounts(response);
    } catch (error) {
      console.error("Error cargando cuentas bancarias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadAccounts);
    return () => clearTimeout(timeout);
  }, []);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    loadAccounts();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteBankAccount(deleteTarget.id);
      showAlert("success", "Cuenta bancaria eliminada.");
      setDeleteTarget(null);
      loadAccounts();
    } catch (error) {
      console.error("Error eliminando cuenta bancaria:", error);

      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail?.message
        : undefined;

      showAlert("error", message ?? "No se pudo eliminar la cuenta bancaria.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-gray-500">
          Registra las cuentas donde puedes recibir el giro del 95% neto de tus liquidaciones
          mensuales. La cuenta predeterminada es la que se usa al generar cada liquidación.
        </p>

        <button
          onClick={handleOpenCreate}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <Plus size={16} />
          Nueva cuenta
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <BankAccountCardSkeleton key={index} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Building2 size={22} />}
          title="Aún no tienes cuentas bancarias"
          description="Registra al menos una cuenta para recibir el giro de tus liquidaciones mensuales."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-gray-200 bg-white p-5 shadow-card transition hover:shadow-pop"
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 size={20} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{account.bankName}</p>

                    {account.isDefault && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Star size={11} className="fill-current" />
                        Predeterminada
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {BANK_ACCOUNT_TYPE_LABEL[account.accountType]} •••• {account.accountNumber.slice(-4)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {account.accountHolder} · Doc. {account.documentNumber}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(account)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={14} />
                  Editar
                </button>

                <button
                  onClick={() => setDeleteTarget(account)}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BankAccountForm
        isOpen={formOpen}
        account={editingAccount}
        hasExistingAccounts={accounts.length > 0}
        onSaved={handleSaved}
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
            Estás a punto de eliminar{" "}
            <span className="font-semibold text-gray-900">
              {deleteTarget?.bankName ?? ""}
            </span>
            .{" "}
            <span className="font-medium text-danger">
              Esta acción no se puede deshacer.
            </span>
          </>
        }
      />
    </div>
  );
}
