import { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

import {
  getCatalogAttributes,
  createCatalogAttribute,
  deleteCatalogAttribute,
  addAttributeOption,
  deleteAttributeOption,
} from "@/features/admin/api/catalogAttributeService";

import type {
  AdminCatalogResponse,
  AdminCatalogAttributeResponse,
} from "@/features/admin/types/response";

interface AttributesModalProps {
  isOpen: boolean;
  catalog: AdminCatalogResponse | null;
  onClose: () => void;
}

type Role = "variant" | "spec";
type InputType = "option" | "color" | "text" | "number";

const ROLE_LABEL: Record<Role, string> = {
  variant: "Eje de variante",
  spec: "Especificación",
};

// Gestion de atributos por categoria.
// El Admin define, por categoria, que atributos existen (Color, Talla,
// Almacenamiento, Marca...), si generan variantes comprables
// (role="variant") o solo describen (role="spec"), y sus valores.
export default function AttributesModal({ isOpen, catalog, onClose }: AttributesModalProps) {
  const [attributes, setAttributes] = useState<AdminCatalogAttributeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("variant");
  const [inputType, setInputType] = useState<InputType>("option");

  const [optionDraft, setOptionDraft] = useState<Record<string, string>>({});
  const [optionHexDraft, setOptionHexDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !catalog) return;

    const load = async () => {
      try {
        setLoading(true);
        setAttributes(await getCatalogAttributes(catalog.id));
      } catch (error) {
        console.error("Error cargando atributos:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, catalog]);

  if (!isOpen || !catalog) return null;

  const handleCreateAttribute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 1) return;

    try {
      setBusy(true);
      const created = await createCatalogAttribute(catalog.id, {
        name: name.trim(),
        role,
        input_type: role === "spec" && inputType === "color" ? "text" : inputType,
        position: attributes.length,
      });
      setAttributes((current) => [...current, created]);
      setName("");
    } catch (error) {
      console.error("Error creando atributo:", error);
      alert("No se pudo crear el atributo (¿nombre repetido?).");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAttribute = async (attributeId: string) => {
    try {
      setBusy(true);
      await deleteCatalogAttribute(attributeId);
      setAttributes((current) => current.filter((attribute) => attribute.id !== attributeId));
    } catch (error) {
      console.error("Error eliminando atributo:", error);
      alert("No se pudo eliminar: hay variantes activas que lo usan.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddOption = async (attributeId: string, isColor: boolean) => {
    const label = (optionDraft[attributeId] ?? "").trim();
    if (!label) return;

    try {
      setBusy(true);
      const updated = await addAttributeOption(attributeId, {
        label,
        hex: isColor ? optionHexDraft[attributeId] || "#000000" : undefined,
      });
      setAttributes((current) =>
        current.map((attribute) => (attribute.id === attributeId ? updated : attribute)),
      );
      setOptionDraft((current) => ({ ...current, [attributeId]: "" }));
    } catch (error) {
      console.error("Error agregando opción:", error);
      alert("No se pudo agregar la opción (¿valor repetido?).");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteOption = async (optionId: string, attributeId: string) => {
    try {
      setBusy(true);
      const updated = await deleteAttributeOption(optionId);
      setAttributes((current) =>
        current.map((attribute) => (attribute.id === attributeId ? updated : attribute)),
      );
    } catch (error) {
      console.error("Error eliminando opción:", error);
      alert("No se pudo eliminar: hay variantes activas que la usan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Atributos y variantes</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Categoría: <span className="font-medium text-gray-700">{catalog.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form
            onSubmit={handleCreateAttribute}
            className="mb-5 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Talla, Almacenamiento, Marca"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833] focus:ring-2 focus:ring-[#7A1833]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Tipo</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
              >
                <option value="variant">Eje de variante</option>
                <option value="spec">Especificación</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Entrada</label>
              <select
                value={inputType}
                onChange={(event) => setInputType(event.target.value as InputType)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
              >
                <option value="option">Lista de opciones</option>
                <option value="color">Color</option>
                <option value="text">Texto</option>
                <option value="number">Número</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={busy || name.trim().length < 1}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#7A1833] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Agregar
            </button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Cargando atributos...</p>
          ) : attributes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Esta categoría todavía no tiene atributos.
            </p>
          ) : (
            <ul className="space-y-3">
              {attributes.map((attribute) => {
                const isColor = attribute.input_type === "color";
                const takesOptions = attribute.input_type === "option" || isColor;

                return (
                  <li key={attribute.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attribute.name}
                          {attribute.unit ? ` (${attribute.unit})` : ""}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {ROLE_LABEL[attribute.role]} · {attribute.input_type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttribute(attribute.id)}
                        disabled={busy}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        title="Eliminar atributo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {takesOptions && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {attribute.options.map((option) => (
                            <span
                              key={option.id}
                              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
                            >
                              {isColor && option.hex && (
                                <span
                                  className="h-3 w-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: option.hex }}
                                />
                              )}
                              {option.label}
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(option.id, attribute.id)}
                                disabled={busy}
                                className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={optionDraft[attribute.id] ?? ""}
                            onChange={(event) =>
                              setOptionDraft((current) => ({
                                ...current,
                                [attribute.id]: event.target.value,
                              }))
                            }
                            placeholder="Nuevo valor"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#7A1833]"
                          />
                          {isColor && (
                            <input
                              type="color"
                              value={optionHexDraft[attribute.id] ?? "#000000"}
                              onChange={(event) =>
                                setOptionHexDraft((current) => ({
                                  ...current,
                                  [attribute.id]: event.target.value,
                                }))
                              }
                              className="h-8 w-10 rounded border border-gray-300"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddOption(attribute.id, isColor)}
                            disabled={busy}
                            className="rounded-lg bg-[#7A1833] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#64132a] disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : "Agregar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
