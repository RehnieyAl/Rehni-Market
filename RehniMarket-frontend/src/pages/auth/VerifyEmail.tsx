import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../services/authService";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email ?? "";

  const [loading, setLoading] = useState(false);

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
        email,
        code: verificationCode,
      });

      alert("Cuenta verificada correctamente.");

      navigate("/login", {
        state: {
          email,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Código incorrecto.");
    } finally {
      setLoading(false);
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
            {email}
          </p>

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
              state={{ email }}
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