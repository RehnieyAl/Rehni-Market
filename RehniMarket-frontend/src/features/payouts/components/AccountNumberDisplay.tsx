// Número de cuenta completo, solo lectura (ver ALCANCE > "quiero ver el
// número de cuenta para liquidar" - sin botón de copiar, el usuario pidió
// explícitamente solo visualizarlo). Reutilizado en el detalle de
// liquidación, la vista previa y la confirmación de pago.
export default function AccountNumberDisplay({ value }: { value: string }) {
  return (
    <span className="inline-block rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-mono text-sm text-gray-900">
      {value}
    </span>
  );
}
