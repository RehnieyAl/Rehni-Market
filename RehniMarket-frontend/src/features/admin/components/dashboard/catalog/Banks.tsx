/** Catálogo de bancos en administración: logo, nombre, estado y cuentas enlazadas, con registro, edición y
 * activación. No hay borrado: un banco en desuso se desactiva para no romper cuentas ni liquidaciones. */
import { useEffect, useState } from "react";
import { Landmark, Pencil, Plus, Power } from "lucide-react";

import BankFormModal from "./BankFormModal";
import BankLogo from "@/features/payouts/components/BankLogo";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "@/shared/components/ui";
import { useAlert } from "@/shared/components/alert/useAlert";
import { getAdminBanks, updateBank } from "@/features/admin/api/bankService";

import type { AdminBank } from "@/features/payouts/types/response";

export default function Banks() {
  const { showAlert } = useAlert();

  const [banks, setBanks] = useState<AdminBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBank | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setFailed(false);
        const data = await getAdminBanks();
        if (!cancelled) setBanks(data);
      } catch (error) {
        console.error("Error cargando el catálogo de bancos:", error);
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

  const toggleActive = async (bank: AdminBank) => {
    try {
      setBusyId(bank.id);
      await updateBank(bank.id, { isActive: !bank.isActive });
      showAlert("success", bank.isActive ? `${bank.name} desactivado.` : `${bank.name} activado.`);
      reload();
    } catch (error) {
      console.error("Error cambiando el estado del banco:", error);
    } finally {
      setBusyId(null);
    }
  };

  const openForm = (bank: AdminBank | null) => {
    setEditing(bank);
    setFormOpen(true);
  };

  return (
    <section aria-labelledby="banks-title" className="rounded-card border border-hairline bg-surface-1 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="banks-title" className="text-lg font-semibold text-ink">
            Bancos
          </h2>
          <p className="text-sm text-ink-muted">Bancos que las empresas pueden elegir para recibir sus liquidaciones.</p>
        </div>
        <Button leadingIcon={<Plus size={16} />} onClick={() => openForm(null)}>
          Registrar banco
        </Button>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-card dark:bg-surface-2" />
            ))}
          </div>
        ) : failed ? (
          <ErrorState title="No se pudo cargar el catálogo de bancos" description="Intenta de nuevo en unos momentos." onRetry={reload} />
        ) : banks.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={<Landmark size={22} />}
            title="Aún no hay bancos registrados"
            description="Registra los bancos con los que las empresas pueden recibir sus pagos."
          />
        ) : (
          <ul className="space-y-3">
            {banks.map((bank) => (
              <li
                key={bank.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-hairline bg-surface-2/40 p-3 sm:flex-nowrap"
              >
                <BankLogo src={bank.logoUrl} name={bank.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{bank.name}</p>
                  <p className="text-xs text-ink-muted">
                    {bank.accountsCount === 1 ? "1 cuenta enlazada" : `${bank.accountsCount} cuentas enlazadas`}
                  </p>
                </div>
                <Badge tone={bank.isActive ? "success" : "neutral"} dot>
                  {bank.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Power size={15} />}
                    loading={busyId === bank.id}
                    onClick={() => void toggleActive(bank)}
                    aria-label={`${bank.isActive ? "Desactivar" : "Activar"} ${bank.name}`}
                  >
                    {bank.isActive ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leadingIcon={<Pencil size={15} />}
                    onClick={() => openForm(bank)}
                    aria-label={`Editar ${bank.name}`}
                  >
                    Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BankFormModal
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        isOpen={formOpen}
        bank={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          reload();
        }}
      />
    </section>
  );
}
