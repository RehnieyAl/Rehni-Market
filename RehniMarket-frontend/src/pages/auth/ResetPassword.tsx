import { useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import type { ApiError } from "../../types/axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email ?? "";

  const [loading, setLoading] = useState(false);
  

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [code, setCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const inputs = useRef<(HTMLInputElement | null)[]>(
    []
  );

  const handleCodeChange = (
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

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    if (code.join("").length !== 6) {
      alert("Ingresa el código completo.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email,
        code: code.join(""),
        newPassword: password,
      });

      alert(
        "Contraseña actualizada correctamente."
      );
      navigate("/login", {
        state: {
          email,
        },
      });
    } catch (error) {
      console.error(error);
      const err = error as ApiError;
      const detail = err.response?.data?.detail;

      if (!detail) {
        alert("Ocurrió un error inesperado.");
        return;
      }

      if (typeof detail === "string") {
        alert(detail);
        return;
      }

      switch (detail.code) {
        case "RESET_CODE_EXPIRED":
          alert(detail.message);
          break;
        default:
          alert("Ocurrió un error inesperado.");
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">

          <div className="flex justify-center mb-6">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6D0F2D]/10">

              <ShieldCheck
                size={30}
                className="text-[#6D0F2D]"
              />

            </div>

          </div>

          <h1 className="text-3xl font-bold text-center">
            Nueva contraseña
          </h1>

          <p className="text-center text-gray-500 mt-3">
            Ingresa el código recibido y crea una nueva contraseña.
          </p>

          <p className="text-center font-semibold text-[#6D0F2D] mt-2 break-all">
            {email}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            <div className="flex justify-between gap-2">

              {code.map((digit, index) => (

                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    inputs.current[index] = el;
}}
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  onChange={(e) =>
                    handleCodeChange(
                      e.target.value,
                      index
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  className="w-12 h-14 rounded-2xl border border-gray-300 text-center text-xl font-bold outline-none focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />

              ))}

            </div>
                        <div>

              <label className="block text-sm font-semibold mb-2">
                Nueva contraseña
              </label>

              <div className="relative">

                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  required
                  className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6D0F2D]"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>

            </div>

            <div>

              <label className="block text-sm font-semibold mb-2">
                Confirmar contraseña
              </label>

              <div className="relative">

                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                  required
                  className="w-full h-14 rounded-2xl border border-gray-300 pl-12 pr-12 outline-none transition focus:border-[#6D0F2D] focus:ring-4 focus:ring-[#6D0F2D]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6D0F2D]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold text-lg hover:bg-[#530A20] transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Actualizando..."
                : "Guardar nueva contraseña"}
            </button>

          </form>

          <div className="mt-8 text-center">

            <div className="flex items-center gap-3 mb-6">

              <div className="flex-1 h-px bg-gray-200"></div>

              <span className="text-sm text-gray-400">
                o
              </span>

              <div className="flex-1 h-px bg-gray-200"></div>

            </div>

            <Link
              to="/login"
              state={{ email }}
              className="font-semibold text-[#6D0F2D] hover:underline"
            >
              Volver al inicio de sesión
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}