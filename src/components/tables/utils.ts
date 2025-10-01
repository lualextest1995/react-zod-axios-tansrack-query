// utils.ts
export function getRowIdSafe<T extends object>(row: T, index: number): string {
  if ("id" in row) {
    const idVal = row.id;
    if (typeof idVal === "string" || typeof idVal === "number") {
      return String(idVal);
    }
  }
  return String(index);
}
