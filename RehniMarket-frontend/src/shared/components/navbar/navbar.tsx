import { ImageOff, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useCart } from "@/features/cart/context/useCart";
import ProfileDropdown from "./ProfileDropdown";
import logo from "@/assets/logo.png";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 5;

// Dropdown de búsqueda rápida del navbar: reutiliza /products/daily como
// fuente de "varios productos" y filtra por nombre en el cliente sobre
// ese resultado (se cachea en memoria para no repetir la llamada en cada
// tecla). GET /public/products ya soporta un filtro `search` real (ver
// ProductsList.tsx) - este dropdown puntual no fue migrado a ese
// endpoint todavía.

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `relative py-1 transition hover:text-[#6D0F2D] ${
    isActive
      ? "text-[#6D0F2D] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-[#6D0F2D]"
      : "text-gray-700"
  }`;

const mobileLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-4 py-3.5 text-sm font-medium transition ${
    isActive ? "bg-[#6D0F2D]/10 text-[#6D0F2D]" : "text-gray-800 hover:bg-gray-50"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [searchResults, setSearchResults] = useState<PublicProductCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const { role } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const productsCacheRef = useRef<PublicProductCard[] | null>(null);

  // Cierra el dropdown al hacer click afuera de cualquiera de los dos
  // buscadores (desktop/mobile - solo uno está visible a la vez).
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const insideDesktop = desktopSearchRef.current?.contains(target);
      const insideMobile = mobileSearchRef.current?.contains(target);

      if (!insideDesktop && !insideMobile) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda en vivo (debounced) mientras el usuario escribe. El cierre
  // del dropdown al limpiar el campo se maneja en handleSearchChange (evento
  // directo del input, no acá) para no disparar setState de forma síncrona
  // dentro del efecto.
  useEffect(() => {
    const query = search.trim().toLowerCase();

    if (!query) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        if (!productsCacheRef.current) {
          productsCacheRef.current = await getDailyProducts(24);
        }

        if (cancelled) return;

        const matches = productsCacheRef.current
          .filter((product) => product.name.toLowerCase().includes(query))
          .slice(0, SEARCH_RESULTS_LIMIT);

        setSearchResults(matches);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error buscando productos:", error);

        if (!cancelled) {
          setSearchResults([]);
          setShowDropdown(true);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);

    // Limpiar la búsqueda cierra el dropdown de inmediato (ver REQUISITOS
    // > BUSCADOR DEL NAVBAR > 8).
    if (!value.trim()) {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const handleSearch = () => {
    const query = search.trim();

    if (!query) return;

    navigate(`/products?search=${encodeURIComponent(query)}`);
    setOpen(false);
    setShowDropdown(false);
  };

  const handleSelectResult = (productId: string) => {
    navigate(`/products/${productId}`);
    setOpen(false);
    setShowDropdown(false);
  };

  const renderSearchDropdown = () => {
    if (!showDropdown) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
        {searching ? (
          <div className="p-4 text-sm text-gray-500">Buscando...</div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No se encontraron productos</div>
        ) : (
          searchResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectResult(product.id)}
              className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition last:border-b-0 hover:bg-gray-50"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                  <ImageOff size={18} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {product.name}
                </p>

                {/* TODO(backend): PublicProductCardResponse no expone
                    categoría (catalog_name) en la tarjeta de producto - se
                    muestra la empresa en su lugar hasta que ese campo
                    exista (ver app/schemas/SchemaPublic.py). */}
                <p className="truncate text-xs text-gray-500">
                  {product.company_name}
                </p>
              </div>

              <span className="shrink-0 text-sm font-semibold text-[#6D0F2D]">
                {formatPrice(product.discount_enabled ? product.final_price : product.price)}
              </span>
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 lg:px-8">

        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="RehniMarket"
            className="h-40 w-auto object-contain"
          />
        </Link>

        <nav className="hidden gap-8 font-medium lg:flex">
          <NavLink to="/" end className={desktopLink}>
            Inicio
          </NavLink>

          <NavLink to="/categories" className={desktopLink}>
            Categorías
          </NavLink>

          <NavLink to="/products" className={desktopLink}>
            Productos
          </NavLink>
        </nav>

        {/* BUSCADOR DESKTOP */}
        <div ref={desktopSearchRef} className="relative hidden w-96 xl:block">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (search.trim()) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Buscar productos..."
            className="w-full rounded-full border py-3 pl-5 pr-12 outline-none focus:border-[#6D0F2D]"
          />

          <Search
            size={20}
            onClick={handleSearch}
            className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
          />

          {renderSearchDropdown()}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          {role === "user" && (
            <Link
              to="/cart"
              className="relative rounded-xl p-2 text-gray-700 transition hover:bg-gray-100"
              aria-label="Mi carrito"
            >
              <ShoppingCart size={22} />

              {!!cart?.totalItems && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6D0F2D] text-[10px] font-bold text-white">
                  {cart.totalItems}
                </span>
              )}
            </Link>
          )}

          {role == null ? (
            <>
              <Link to="/login" className="font-medium">
                Iniciar sesión
              </Link>

              <Link
                to="/register-user"
                className="rounded-xl bg-[#6D0F2D] px-6 py-3 text-white transition hover:bg-[#530A20]"
              >
                Registrarse
              </Link>
            </>
          ) : (
            <ProfileDropdown />
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="lg:hidden"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <div className="p-5">

            {/* BUSCADOR MÓVIL */}
            <div ref={mobileSearchRef} className="relative mb-5">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (search.trim()) setShowDropdown(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                placeholder="Buscar productos..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-[#6D0F2D] focus:bg-white"
              />

              <Search
                size={18}
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
              />

              {renderSearchDropdown()}
            </div>

            {/* NAVEGACIÓN */}
            <nav className="flex flex-col gap-1">
              <NavLink
                to="/"
                end
                onClick={() => setOpen(false)}
                className={mobileLink}
              >
                Inicio
              </NavLink>

              <NavLink
                to="/categories"
                onClick={() => setOpen(false)}
                className={mobileLink}
              >
                Categorías
              </NavLink>

              <NavLink
                to="/products"
                onClick={() => setOpen(false)}
                className={mobileLink}
              >
                Productos
              </NavLink>
            </nav>

            <div className="my-4 border-t border-gray-200" />

            {role === "user" && (
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart size={18} />
                  Mi carrito
                </span>

                {!!cart?.totalItems && (
                  <span className="rounded-full bg-[#6D0F2D] px-2 py-0.5 text-xs font-bold text-white">
                    {cart.totalItems}
                  </span>
                )}
              </Link>
            )}

            {role == null ? (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Iniciar sesión
                </Link>

                <Link
                  to="/register-user"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[#6D0F2D] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#530A20]"
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Mi cuenta
                </p>

                <ProfileDropdown />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}