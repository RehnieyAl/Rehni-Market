import { Smartphone, Download, Globe } from "lucide-react";
import { isAndroid, isIOS } from "react-device-detect";

export default function MobileRedirect() {

  const apkLink =
    "https://www.mediafire.com/file/TU_ARCHIVO/RehniMarket.apk";

  const continueWeb = () => {
    localStorage.setItem("continueWeb", "true");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-200 p-8 text-center">

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#6D0F2D]/10">
          <Smartphone size={48} className="text-[#6D0F2D]" />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          RehniMarket móvil
        </h1>

        <p className="mt-4 text-gray-500 leading-relaxed">
          Para disfrutar de una mejor experiencia desde tu dispositivo móvil,
          descarga nuestra aplicación oficial.
        </p>


        {isAndroid && (
          <a
            href={apkLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-[#6D0F2D] text-white font-semibold hover:bg-[#530A20] transition"
          >
            <Download size={22} />
            Descargar APK
          </a>
        )}


        {isIOS && (
          <div className="mt-8 rounded-2xl bg-gray-100 p-5 text-gray-600">
            <p className="font-semibold text-gray-800">
              Aplicación iOS
            </p>

            <p className="mt-2 text-sm">
              La versión para iPhone estará disponible próximamente.
            </p>
          </div>
        )}


        {!isAndroid && !isIOS && (
          <div className="mt-8 rounded-2xl bg-gray-100 p-5 text-gray-600">
            <p>
              Dispositivo no compatible.
            </p>
          </div>
        )}


        <button
          onClick={continueWeb}
          className="mt-6 flex items-center justify-center gap-3 w-full h-14 rounded-2xl border border-[#6D0F2D] text-[#6D0F2D] font-semibold hover:bg-[#6D0F2D]/10 transition"
        >
          <Globe size={22} />
          Continuar versión web
        </button>

      </div>

    </div>
  );
}