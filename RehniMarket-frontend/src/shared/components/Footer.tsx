import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 bg-gradient-to-b from-[#7A1024] to-[#4A0B18] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2 lg:grid-cols-4">
        {/* Logo */}
        <div>
          {/*<div className="flex items-center gap-3">
            <img
              src="src/assets/logo.png"
              alt="RehniMarket"
              className="h-12 w-12 rounded-full"
            />

            <div>
              <h2 className="text-2xl font-bold">
                Rehni<span className="text-red-300">Market</span>
              </h2>

              <p className="text-sm text-gray-300">
                Compra. Vende. Conecta.
              </p>
            </div>
          </div>*/}

          <p className="mt-5 text-sm leading-7 text-gray-300">
            Marketplace donde puedes comprar y vender productos de forma
            sencilla y segura.
          </p>
        </div>

        {/* Productos */}
        <div>
          <h3 className="mb-4 font-semibold">Productos</h3>

          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link to="/productos" className="hover:text-white">
                Explorar productos
              </Link>
            </li>

            <li>
              <Link to="/categorias" className="hover:text-white">
                Categorías
              </Link>
            </li>
          </ul>
        </div>

        {/* Empresas */}
        <div>
          <h3 className="mb-4 font-semibold">Empresas</h3>

          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link to="/register-company" className="hover:text-white">
                Registrar empresa
              </Link>
            </li>

            <li>
              <Link to="/como-vender" className="hover:text-white">
                ¿Cómo vender?
              </Link>
            </li>
          </ul>
        </div>

        {/* Información */}
        <div>
          <h3 className="mb-4 font-semibold">Información</h3>

          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <Link to="/contacto" className="hover:text-white">
                Contacto
              </Link>
            </li>

            <li>
              <Link to="/terminos" className="hover:text-white">
                Términos y condiciones
              </Link>
            </li>

            <li>
              <Link to="/privacidad" className="hover:text-white">
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-sm text-gray-300">
        © {new Date().getFullYear()} RehniMarket. Todos los derechos reservados.
      </div>
    </footer>
  );
}