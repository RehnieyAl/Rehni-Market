import { Link } from "react-router-dom";

export default function Footer() {
  const links = [
    { to: "/productos", label: "Productos" },
    { to: "/categorias", label: "Categorías" },
    { to: "/register-company", label: "Registrar empresa" },
    { to: "/como-vender", label: "¿Cómo vender?" },
    { to: "/contacto", label: "Contacto" },
    { to: "/terminos", label: "Términos" },
    { to: "/privacidad", label: "Privacidad" },
  ];

  return (
    <footer className="mt-8 bg-gradient-to-b from-[#7A1024] to-[#4A0B18] text-white sm:mt-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-xs text-gray-300">
          © {new Date().getFullYear()} RehniMarket
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-xs text-gray-300 transition hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}