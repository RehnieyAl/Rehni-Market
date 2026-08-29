import Catalogs from "./catalog/Catalogs";

export default function CatalogManagement() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra los catálogos del marketplace y sus atributos de producto y
          de variante.
        </p>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <Catalogs />
      </div>
    </div>
  );
}
