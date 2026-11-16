"""Convierte un .docx a PDF con el conversor de OnlyOffice Desktop (x2t), solo para revisar.

Uso: uv run --project docs/Manuales/scripts python docs/Manuales/scripts/convertir_pdf.py entrada.docx salida.pdf

La ruta del conversor se puede cambiar con la variable de entorno ONLYOFFICE_X2T.
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape

X2T = Path(os.environ.get("ONLYOFFICE_X2T", "/opt/onlyoffice/desktopeditors/converter/x2t"))
FUENTES = Path.home() / ".local/share/onlyoffice/desktopeditors/data/fonts/AllFonts.js"


def convertir(entrada: Path, salida: Path) -> None:
    if not X2T.is_file():
        raise RuntimeError(f"No se encontró el conversor de OnlyOffice en {X2T} (instalar OnlyOffice Desktop "
                           "o definir ONLYOFFICE_X2T).")
    if not entrada.is_file():
        raise FileNotFoundError(entrada)
    salida.unlink(missing_ok=True)      # para detectar si x2t no escribe el PDF
    with tempfile.TemporaryDirectory() as tmp:
        xml = Path(tmp) / "p.xml"
        # Las rutas se escapan: un & o un < en el nombre de una carpeta rompería el XML.
        xml.write_text(f"""<?xml version="1.0" encoding="utf-8"?>
<TaskQueueDataConvert><m_sFileFrom>{escape(str(entrada.resolve()))}</m_sFileFrom><m_sFileTo>{escape(str(salida.resolve()))}</m_sFileTo>
<m_nFormatTo>513</m_nFormatTo><m_sAllFontsPath>{escape(str(FUENTES))}</m_sAllFontsPath><m_sFontDir>/usr/share/fonts</m_sFontDir>
<m_sTempDir>{escape(tmp)}</m_sTempDir></TaskQueueDataConvert>""", encoding="utf-8")
        try:
            subprocess.run([str(X2T), str(xml)], cwd=X2T.parent, check=True, capture_output=True, timeout=600)
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"x2t no pudo convertir {entrada} (código {e.returncode}): "
                               f"{(e.stderr or e.stdout or b'').decode(errors='replace').strip()}") from e
    if not salida.is_file():
        raise RuntimeError(f"x2t terminó sin crear {salida}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Uso: convertir_pdf.py entrada.docx salida.pdf")
    convertir(Path(sys.argv[1]), Path(sys.argv[2]))
