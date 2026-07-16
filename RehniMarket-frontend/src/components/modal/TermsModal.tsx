import Modal from "./Modal";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({
  isOpen,
  onClose,
}: TermsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Términos y Condiciones"
    >
      <div className="space-y-4 text-gray-700">
        <p>
          Bienvenido a <strong>RehniMarket</strong>. Al crear una cuenta,
          aceptas cumplir con los siguientes términos y condiciones.
        </p>

        <h3 className="text-lg font-semibold">
          1. Uso de la plataforma
        </h3>

        <p>
          La plataforma permite comprar y vender productos de manera
          segura. El usuario es responsable de la información que publique.
        </p>

        <h3 className="text-lg font-semibold">
          2. Cuenta de usuario
        </h3>

        <p>
          Debes proporcionar información verídica y mantener la
          confidencialidad de tu contraseña.
        </p>

        <h3 className="text-lg font-semibold">
          3. Publicaciones
        </h3>

        <p>
          Está prohibido publicar contenido ilegal, ofensivo o que
          infrinja derechos de terceros.
        </p>

        <h3 className="text-lg font-semibold">
          4. Privacidad
        </h3>

        <p>
          Tus datos serán tratados conforme a nuestra política de
          privacidad y la legislación aplicable.
        </p>

        <h3 className="text-lg font-semibold">
          5. Aceptación
        </h3>

        <p>
          Al marcar la casilla de aceptación confirmas que has leído y
          aceptado estos términos y condiciones.
        </p>
      </div>
    </Modal>
  );
}