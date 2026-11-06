"""Convierte un .docx a PDF con el conversor de OnlyOffice Desktop (x2t), solo para revisar.

Uso: uv run --project docs/Manuales/scripts python docs/Manuales/scripts/convertir_pdf.py entrada.docx salida.pdf
"""
import subprocess
import sys
import tempfile
from pathlib import Path

X2T = Path("/opt/onlyoffice/desktopeditors/converter/x2t")
FUENTES = Path.home() / ".local/share/onlyoffice/desktopeditors/data/fonts/AllFonts.js"


def convertir(entrada: Path, salida: Path) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        xml = Path(tmp) / "p.xml"
        xml.write_text(f"""<?xml version="1.0" encoding="utf-8"?>
<TaskQueueDataConvert><m_sFileFrom>{entrada.resolve()}</m_sFileFrom><m_sFileTo>{salida.resolve()}</m_sFileTo>
<m_nFormatTo>513</m_nFormatTo><m_sAllFontsPath>{FUENTES}</m_sAllFontsPath><m_sFontDir>/usr/share/fonts</m_sFontDir>
<m_sTempDir>{tmp}</m_sTempDir></TaskQueueDataConvert>""", encoding="utf-8")
        subprocess.run([str(X2T), str(xml)], cwd=X2T.parent, check=True, capture_output=True, timeout=600)


if __name__ == "__main__":
    convertir(Path(sys.argv[1]), Path(sys.argv[2]))
