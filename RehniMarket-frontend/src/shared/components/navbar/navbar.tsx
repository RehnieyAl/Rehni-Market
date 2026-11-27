/** Barra de la tienda: navegación y búsqueda de escritorio; en móvil, búsqueda bajo la barra y menú lateral. */
import { Menu, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/public/auth/context/useAuth";
import { useLoginModal } from "@/features/public/auth/context/LoginModalContext";
import CartDropdown from "./CartDropdown";
import FavoritesDropdown from "./FavoritesDropdown";
import ProfileDropdown from "./ProfileDropdown";
import ProductThumbnail from "@/shared/components/ProductThumbnail";
import MobileMenu, { type StoreNavItem } from "./MobileMenu";
import logo from "@/assets/logo.png";

import { getDailyProducts } from "@/features/public/home/api/homeService";
import { formatPrice } from "@/shared/utils/formatPrice";

import type { PublicProductCard } from "@/features/public/home/types/response";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULTS_LIMIT = 5;

const NAV_ITEMS: StoreNavItem[] = [
  { label: "Inicio", to: "/", isActive: (pathname) => pathname === "/" },
  { label: "Categorías", to: "/categories", isActive: (pathname) => pathname === "/categories" },
  { label: "Productos", to: "/products", isActive: (pathname) => pathname === "/products" },
  { label: "Ofertas", to: "/offers", isActive: (pathname) => pathname === "/offers" },
  { label: "Novedades", to: "/new", isActive: (pathname) => pathname === "/new" },
];

const desktopLinkClass = (active: boolean) =>
  `relative py-1 transition-colors hover:text-secondary ${
    active
      ? "text-ink after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-secondary"
      : "text-gray-700 dark:text-ink-muted"
  }`;

type NavMenu = "favorites" | "cart" | "profile";

const ICON_BUTTON_CLASS =
  "relative rounded-control p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-secondary aria-expanded:bg-white/5 aria-expanded:text-ink";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [searchResults, setSearchResults] = useState<PublicProductCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSearch, setActiveSearch] = useState<"desktop" | "mobile">("desktop");

  const { role } = useAuth();
  // Un solo desplegable abierto a la vez entre favoritos, carrito y perfil.
  const [openMenu, setOpenMenu] = useState<NavMenu | null>(null);
  const menuProps = (menu: NavMenu) => ({
    open: openMenu === menu,
    onOpenChange: (next: boolean) => setOpenMenu(next ? menu : null),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const loginModal = useLoginModal();
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

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    menuButtonRef.current?.focus();
  }, []);

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

    void navigate(`/products?search=${encodeURIComponent(query)}`);
    setOpen(false);
    setShowDropdown(false);
  };

  const handleSelectResult = (productId: string) => {
    void navigate(`/products/${productId}`);
    setOpen(false);
    setShowDropdown(false);
  };

  const renderSearchDropdown = () => {
    if (!showDropdown) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-card border border-gray-200 bg-surface-1 shadow-pop dark:border-hairline dark:bg-surface-1">
        {searching ? (
          <div className="p-4 text-sm text-gray-500 dark:text-ink-muted">Buscando…</div>
        ) : searchResults.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 dark:text-ink-muted">No se encontraron productos</div>
        ) : (
          searchResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectResult(product.id)}
              className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition last:border-b-0 hover:bg-gray-50 dark:border-hairline dark:hover:bg-white/5"
            >
              <ProductThumbnail src={product.image} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">
                  {product.name}
                </p>

                <p className="truncate text-xs text-gray-500 dark:text-ink-muted">
                  {product.company_name}
                </p>
              </div>

              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatPrice(product.discount_enabled ? product.final_price : product.price)}
              </span>
            </button>
          ))
        )}
      </div>
    );
  };

  const renderSearchBox = (
    containerRef: RefObject<HTMLDivElement | null>,
    variant: "desktop" | "mobile",
  ) => (
    <div ref={containerRef} className="relative">
      <input
        type="search"
        value={search}
        onChange={(e) => {
          setActiveSearch(variant);
          handleSearchChange(e.target.value);
        }}
        onFocus={() => {
          setActiveSearch(variant);
          if (search.trim()) setShowDropdown(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        aria-label="Buscar productos"
        placeholder={
          variant === "desktop" ? "Buscar productos, marcas o categorías…" : "Buscar productos…"
        }
        className={
          variant === "desktop"
            ? "w-full rounded-full bg-gray-100 py-2.5 pl-5 pr-12 text-sm text-gray-700 outline-none transition focus:bg-surface-1 focus:ring-2 focus:ring-secondary/30 dark:bg-surface-2 dark:text-ink dark:placeholder:text-ink-muted dark:focus:bg-surface-2 dark:focus:ring-secondary/40"
            : "h-12 w-full rounded-full border border-hairline bg-surface-2 pl-12 pr-4 text-[15px] text-ink outline-none transition placeholder:text-ink-muted focus:border-secondary/60 focus:ring-2 focus:ring-secondary/30 [&::-webkit-search-cancel-button]:hidden"
        }
      />

      <button
        type="button"
        onClick={handleSearch}
        aria-label="Buscar"
        className={
          variant === "desktop"
            ? "absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition-shadow fill-hover"
            : "absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:text-ink"
        }
      >
        <Search size={variant === "desktop" ? 17 : 20} />
      </button>

      {activeSearch === variant && renderSearchDropdown()}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-surface-1 dark:border-hairline dark:bg-surface-1">
      <div className="mx-auto flex h-16 max-w-[clamp(1280px,90vw,1600px)] items-center gap-3 px-3 sm:h-20 sm:gap-4 sm:px-4 lg:px-8">

        <div className="flex shrink-0 items-center gap-6 xl:gap-10">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img
              src={logo}
              alt="RehniMarket"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>

          <nav aria-label="Tienda" className="hidden items-center gap-5 font-medium lg:flex xl:gap-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                aria-current={item.isActive(location.pathname) ? "page" : undefined}
                className={desktopLinkClass(item.isActive(location.pathname))}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative mx-auto hidden w-full min-w-0 max-w-sm lg:block">
          {renderSearchBox(desktopSearchRef, "desktop")}
        </div>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          {isBuyer && (
            <>
              <FavoritesDropdown {...menuProps("favorites")} triggerClassName={ICON_BUTTON_CLASS} />
              <CartDropdown {...menuProps("cart")} triggerClassName={ICON_BUTTON_CLASS} />
            </>
          )}

          {role == null ? (
            <>
              <Link
                to="/login"
                aria-haspopup="dialog"
                onClick={(event) => {
                  if (loginModal) {
                    event.preventDefault();
                    loginModal.openLogin();
                  }
                }}
                className="font-medium dark:text-ink dark:hover:text-secondary"
              >
                Iniciar sesión
              </Link>

              <Link
                to="/register-user"
                className="rounded-control bg-primary px-6 py-3 text-primary-fg transition-shadow fill-hover"
              >
                Registrarse
              </Link>
            </>
          ) : (
            <ProfileDropdown {...menuProps("profile")} />
          )}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="-mr-1 ml-auto flex h-11 w-11 items-center justify-center rounded-control text-gray-700 transition hover:bg-gray-100 dark:text-ink dark:hover:bg-white/5 lg:hidden"
        >
          <Menu size={26} />
        </button>
      </div>

      <div className="mx-auto max-w-[clamp(1280px,90vw,1600px)] px-3 pb-3 sm:px-4 lg:hidden">
        <div className="relative">{renderSearchBox(mobileSearchRef, "mobile")}</div>
      </div>

      <MobileMenu open={open} items={NAV_ITEMS} onClose={closeMenu} />
    </header>
  );
}