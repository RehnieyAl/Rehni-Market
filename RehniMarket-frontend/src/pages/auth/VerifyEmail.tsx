import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail, changeEmail } from "../../services/authService";
import { ErrorCode } from "../../types/ErrorCode";
import axios from "axios";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email ?? "";

  const [currentEmail, setCurrentEmail] = useState(email);
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (
    value: string,
    index: number
  ) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;

    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === "Backspace" &&
      !code[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      alert("Ingresa el código completo.");
      return;
    }

    setLoading(true);

    try {
      await verifyEmail({
        email: currentEmail,
        code: verificationCode,
      });

      alert("Cuenta verificada correctamente.");

      navigate("/login", {
        state: {
          email: currentEmail,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)){
        const error = err.response?.data?.detail;

        switch (error?.code){
          case ErrorCode.USER_NOT_FOUND:
            alert(error.message)
            break;
          
          default:
            alert(error?.message ?? "Ocurrio un error.")
        }
      } else {
        alert("Ocurrio un error inesperado")
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      alert("Ingresa un correo electrónico.");
      return;
    }

    setChangingEmail(true);

    try {
      await changeEmail({
        old_email: currentEmail,
        new_email: newEmail,
      });

      setCurrentEmail(newEmail);
      setNewEmail("");
      setEditingEmail(false);

      alert(
        "Correo actualizado correctamente. Se ha enviado un nuevo código de verificación."
      );
    } catch (error) {
      console.error(error);
      alert("No fue posible cambiar el correo.");
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#6D0F2D]/10 flex items-center justify-center">
              <Mail
                size={30}
                className="text-[#6D0F2D]"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center">
            Verifica tu correo
          </h1>

          <p className="text-center text-gray-500 mt-3">
            Hemos enviado un código de verificación a
          </p>

          <p className="text-center font-semibold text-[#6D0F2D] mt-2 break-all">
            {currentEmail}
          </p>

          <div className="mt-5">
            {!editingEmail ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEditingEmail(true)}
                  className="text-sm font-semibold text-[#6D0F2D] hover:underline"
                >
                  ¿El correo es incorrecto? Cambiar correo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) =>
                    setNewEmail(e.target.value)
                  }
                  placeholder="Nuevo correo electrónico"
                  className="w-full h-12 rounded-xl border border-gray-300 px-4 outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={changingEmail}
                    onClick={handleChangeEmail}
                    className="flex-1 h-11 rounded-xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition"
                  >
                    {changingEmail
                      ? "Actualizando..."
                      : "Guardar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingEmail(false);
                      setNewEmail("");
                    }}
                    className="flex-1 h-11 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(e) =>
                    handleChange(
                      e.target.value,
                      index
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  maxLength={1}
                  inputMode="numeric"
                  className="w-12 h-14 rounded-2xl border border-gray-300 text-center text-xl font-bold outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition"
            >
              {loading
                ? "Verificando..."
                : "Verificar correo"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              ¿Ya verificaste tu cuenta?
            </p>

            <Link
              to="/login"
              state={{ email: currentEmail }}
              className="font-semibold text-[#6D0F2D] hover:underline"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}