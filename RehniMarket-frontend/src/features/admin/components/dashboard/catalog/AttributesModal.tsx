import { useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2, Power } from "lucide-react";

import {
  getCatalogAttributes,
  createCatalogAttribute,
  deleteCatalogAttribute,
  setCatalogAttributeStatus,
  addAttributeOption,
  deleteAttributeOption,
} from "@/features/admin/api/catalogAttributeService";

import type {
  AdminCatalogResponse,
  AdminCatalogAttributeResponse,
  CatalogAttributeInputType,
  CatalogAttributeRole,
} from "@/features/admin/types/response";

interface AttributesModalProps {
  isOpen: boolean;
  catalog: AdminCatalogResponse | null;
  onClose: () => void;
}

const ROLE_LABEL: Record<CatalogAttributeRole, string> = {
  product: "Atributo de producto",
  variant: "Eje de variante",
};

const INPUT_LABEL: Record<CatalogAttributeInputType, string> = {
  select: "Lista de opciones",
  color: "Color",
  text: "Texto",
  number: "Número",
};

export default function AttributesModal({ isOpen, catalog, onClose }: AttributesModalProps) {
  const [attributes, setAttributes] = useState<AdminCatalogAttributeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState<CatalogAttributeRole>("variant");
  const [inputType, setInputType] = useState<CatalogAttributeInputType>("select");
  const [unit, setUnit] = useState("");

  const [optionDraft, setOptionDraft] = useState<Record<string, string>>({});
  const [optionHexDraft, setOptionHexDraft] = useState<Record<string, string>>({});

  const reload = async () => {
    if (!catalog) return;
    setAttributes(await getCatalogAttributes(catalog.id));
  };

  useEffect(() => {
    if (!isOpen || !catalog) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setAttributes(await getCatalogAttributes(catalog.id));
      } catch (loadError) {
        console.error("Error cargando atributos:", loadError);
        setError("No se pudieron cargar los atributos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, catalog]);

  if (!isOpen || !catalog) return null;

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      setBusy(true);
      setError(null);
      await action();
      await reload();
    } catch (actionError) {
      console.error(actionError);
      setError(fallback);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAttribute = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 1) return;

    run(async () => {
      await createCatalogAttribute(catalog.id, {
        name: name.trim(),
        role,
        input_type: inputType,
        unit: inputType === "number" && unit.trim() ? unit.trim() : null,
        position: attributes.length,
      });
      setName("");
      setUnit("");
    }, "No se pudo crear el atributo (¿nombre repetido?).");
  };

  const handleAddOption = (attributeId: string, isColor: boolean) => {
    const value = (optionDraft[attributeId] ?? "").trim();
    if (!value) return;

    run(async () => {
      await addAttributeOption(attributeId, {
        value,
        hex_color: isColor ? optionHexDraft[attributeId] || "#000000" : null,
        position: 0,
      });
      setOptionDraft((current) => ({ ...current, [attributeId]: "" }));
    }, "No se pudo agregar la opción (¿valor repetido?).");
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
            className="mb-5 flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej: Color, Talla, Marca"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Rol</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as CatalogAttributeRole)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
              >
                <option value="variant">Eje de variante</option>
                <option value="product">Atributo de producto</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Entrada</label>
              <select
                value={inputType}
                onChange={(event) =>
                  setInputType(event.target.value as CatalogAttributeInputType)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
              >
                <option value="select">Lista de opciones</option>
                <option value="color">Color</option>
                <option value="text">Texto</option>
                <option value="number">Número</option>
              </select>
            </div>

            {inputType === "number" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Unidad</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="Ej: GB, cm"
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#7A1833]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy || name.trim().length < 1}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#7A1833] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#64132a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Agregar
            </button>
          </form>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

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
                const takesOptions = attribute.input_type === "select" || isColor;

                return (
                  <li
                    key={attribute.id}
                    className={`rounded-xl border p-4 ${
                      attribute.is_active ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attribute.name}
                          {attribute.unit ? ` (${attribute.unit})` : ""}
                          {!attribute.is_active && (
                            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {ROLE_LABEL[attribute.role]} · {INPUT_LABEL[attribute.input_type]}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              () =>
                                setCatalogAttributeStatus(
                                  attribute.id,
                                  !attribute.is_active,
                                ),
                              "No se pudo cambiar el estado.",
                            )
                          }
                          disabled={busy}
                          className={`rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50 ${
                            attribute.is_active ? "text-green-600" : "text-gray-400"
                          }`}
                          title={attribute.is_active ? "Desactivar" : "Activar"}
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            run(
                              () => deleteCatalogAttribute(attribute.id),
                              "No se pudo eliminar: hay productos o variantes que lo usan.",
                            )
                          }
                          disabled={busy}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          title="Eliminar atributo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {takesOptions && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {attribute.options.map((option) => (
                            <span
                              key={option.id}
                              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
                            >
                              {isColor && option.hex_color && (
                                <span
                                  className="h-3 w-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: option.hex_color }}
                                />
                              )}
                              {option.value}
                              <button
                                type="button"
                                onClick={() =>
                                  run(
                                    () => deleteAttributeOption(option.id),
                                    "No se pudo eliminar: hay variantes que la usan.",
                                  )
                                }
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
