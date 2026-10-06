import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import logo from "@/assets/logo.png";

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);

const SOCIAL: { label: string; icon: ReactNode }[] = [
  {
    label: "Facebook",
    icon: (
      <Svg>
        <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
      </Svg>
    ),
  },
  {
    label: "Instagram",
    icon: (
      <Svg>
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Zm5.1-8.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
      </Svg>
    ),
  },
  {
    label: "YouTube",
    icon: (
      <Svg>
        <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-9 .4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.7.4 8.9.4 8.9.4s7.3 0 9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12ZM9.8 15.3V8.7l6 3.3-6 3.3Z" />
      </Svg>
    ),
  },
  {
    label: "LinkedIn",
    icon: (
      <Svg>
        <path d="M6.9 21H3.3V9h3.6v12ZM5.1 7.4A2.1 2.1 0 1 1 5.1 3.2a2.1 2.1 0 0 1 0 4.2ZM21 21h-3.6v-5.8c0-1.4 0-3.2-1.9-3.2s-2.2 1.5-2.2 3.1V21H9.7V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5V21Z" />
      </Svg>
    ),
  },
];

type FooterLink = { label: string; to?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Comprar",
    links: [
      { label: "Categorías", to: "/categories" },
      { label: "Ofertas", to: "/offers" },
      { label: "Novedades", to: "/new" },
      { label: "Productos", to: "/products" },
    ],
  },
  {
    title: "Vender",
    links: [
      { label: "Registra tu empresa", to: "/register-company" },
      { label: "Guía de vendedores" },
      { label: "Comisiones" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Centro de ayuda" },
      { label: "Términos y condiciones" },
      { label: "Política de privacidad" },
    ],
  },
];

const linkClass =
  "text-sm text-gray-500 transition hover:text-primary dark:text-ink-muted dark:hover:text-accent";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50 dark:border-hairline dark:bg-surface-1">
      <div className="mx-auto w-full max-w-[clamp(1280px,90vw,1600px)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <div className="max-w-xs">
            <img src={logo} alt="RehniMarket" className="h-9 w-auto object-contain" />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-ink-muted">
              El marketplace de tecnología donde empresas verificadas venden a más
              clientes.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className={linkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-ink-muted/70">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Síguenos</h3>
            <div className="mt-4 flex gap-2">
              {SOCIAL.map(({ label, icon }) => (
                <span
                  key={label}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-hairline dark:bg-surface-2 dark:text-ink-muted"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 dark:border-hairline">
          <p className="text-xs text-gray-400 dark:text-ink-muted">
            © {new Date().getFullYear()} RehniMarket. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
