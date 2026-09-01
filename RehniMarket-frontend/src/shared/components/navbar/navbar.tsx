import { Heart, ImageOff, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useCart } from "@/features/cart/context/useCart";
import ProfileDropdown from "./ProfileDropdown";
import logo from "@/assets/logo.png";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 5;

const NAV_ITEMS: {
  label: string;
  to: string;
  isActive: (location: Location) => boolean;
}[] = [
  {
    label: "Inicio",
    to: "/",
    isActive: (location) => location.pathname === "/",
  },
  {
    label: "Categorías",
    to: "/categories",
    isActive: (location) => location.pathname === "/categories",
  },
  {
    label: "Productos",
    to: "/products",
    isActive: (location) => location.pathname === "/products",
  },
  {
    label: "Ofertas",
    to: "/offers",
    isActive: (location) => location.pathname === "/offers",
  },
  {
    label: "Novedades",
    to: "/new",
    isActive: (location) => location.pathname === "/new",
  },
];

const desktopLinkClass = (active: boolean) =>
  `relative py-1 transition hover:text-primary ${
    active
      ? "text-primary after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-primary"
      : "text-gray-700"
  }`;

const mobileLinkClass = (active: boolean) =>
  `rounded-control px-4 py-3.5 text-sm font-medium transition ${
    active ? "bg-brand-50 text-primary" : "text-gray-800 hover:bg-gray-50"
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
  const location = useLocation();
  const isBuyer = role === "user";

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const productsCacheRef = useRef<PublicProductCard[] | null>(null);

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

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-card border border-gray-200 bg-white shadow-pop">
        {searching ? (
          <div className="p-4 text-sm text-gray-500">Buscando…</div>
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

                <p className="truncate text-xs text-gray-500">
                  {product.company_name}
                </p>
              </div>

              <span className="shrink-0 text-sm font-semibold text-primary">
                {formatPrice(product.discount_enabled ? product.final_price : product.price)}
              </span>
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-[clamp(1280px,90vw,1600px)] items-center gap-3 px-3 sm:h-20 sm:gap-4 sm:px-4 lg:px-8">

        <div className="flex shrink-0 items-center gap-6 xl:gap-10">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img
              src={logo}
              alt="RehniMarket"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>

          <nav className="hidden items-center gap-5 font-medium lg:flex xl:gap-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={desktopLinkClass(item.isActive(location))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          ref={desktopSearchRef}
          className="relative mx-auto hidden w-full min-w-0 max-w-sm lg:block"
        >
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
            placeholder="Buscar productos…"
            className="w-full rounded-full bg-gray-100 py-2.5 pl-5 pr-11 text-sm text-gray-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-600/30"
          />

          <Search
            size={18}
            onClick={handleSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
          />

          {renderSearchDropdown()}
        </div>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          {isBuyer && (
            <Link
              to="/user/dashboard?tab=favorites"
              className="rounded-control p-2 text-gray-600 transition hover:bg-gray-100 hover:text-primary"
              aria-label="Mis favoritos"
            >
              <Heart size={22} />
            </Link>
          )}

          {isBuyer && (
            <Link
              to="/cart"
              className="relative rounded-control p-2 text-gray-600 transition hover:bg-gray-100 hover:text-primary"
              aria-label="Mi carrito"
            >
              <ShoppingCart size={22} />

              {!!cart?.totalItems && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
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
                className="rounded-control bg-primary px-6 py-3 text-primary-fg transition hover:bg-primary-hover"
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
          aria-controls="mobile-menu"
          className="-mr-1 ml-auto rounded-control p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {open && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gray-200 bg-white lg:hidden"
        >
          <div className="p-5">

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
                placeholder="Buscar productos…"
                className="w-full rounded-control border border-gray-200 bg-gray-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-brand-600 focus:bg-white"
              />

              <Search
                size={18}
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400"
              />

              {renderSearchDropdown()}
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={mobileLinkClass(item.isActive(location))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="my-4 border-t border-gray-200" />

            {isBuyer && (
              <div className="mb-4 flex flex-col gap-2">
                <Link
                  to="/user/dashboard?tab=favorites"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  <Heart size={18} />
                  Mis favoritos
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Mi carrito
                  </span>

                  {!!cart?.totalItems && (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
                      {cart.totalItems}
                    </span>
                  )}
                </Link>
              </div>
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
                  className="rounded-control bg-primary px-4 py-3 text-center text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
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