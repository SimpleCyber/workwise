// If you already have utils.ts elsewhere, you can remove this file.
// Add any shared helpers here gradually (no runtime change just by adding this file).

// Merge class names: accepts strings, arrays, and conditional objects.
export function cls(...inputs: any[]): string {
  const out: string[] = [];

  const push = (val: any) => {
    if (!val) return;
    if (typeof val === "string") {
      if (val.trim()) out.push(val);
    } else if (Array.isArray(val)) {
      val.forEach(push);
    } else if (typeof val === "object") {
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key) && val[key])
          out.push(key);
      }
    }
  };

  inputs.forEach(push);
  return Array.from(new Set(out)).join(" ");
}

// Simple unique id generator with optional prefix.
export function makeId(prefix = "id"): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${rand}_${time}`;
}

// Keep existing noop export if used elsewhere.
export const noop = () => {};

export default cls;
