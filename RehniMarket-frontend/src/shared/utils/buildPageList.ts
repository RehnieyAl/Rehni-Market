// Lista compacta de páginas con "..." para huecos grandes (mismo criterio
// que usaba antes ProductsList.tsx en solitario, ver ALCANCE > rediseño
// Categorías > reutilización de paginación): siempre ancla 1, 2, 3 al
// inicio y las últimas 2 al final, más el entorno inmediato de la página
// actual. Puramente de presentación sobre `current`/`total`.
export function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const anchors = new Set(
    [1, 2, 3, total - 1, total, current - 1, current, current + 1].filter(
      (n) => n >= 1 && n <= total,
    ),
  );

  const sorted = [...anchors].sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const n of sorted) {
    if (previous && n - previous > 1) result.push("ellipsis");
    result.push(n);
    previous = n;
  }

  return result;
}
