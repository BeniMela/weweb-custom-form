/**
 * Pure utility functions — no Vue reactivity, no WeWeb dependencies.
 */

const INPUT_TYPES = ["text", "email", "password", "number", "tel", "url", "date"];

export function isInputType(type) {
  return INPUT_TYPES.includes(type);
}

export function parseOptions(optionsStr, valueKey = "value", labelKey = "label") {
  if (!optionsStr) return [];
  if (Array.isArray(optionsStr)) {
    return optionsStr.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: String(opt?.[valueKey] ?? opt?.value ?? opt?.id ?? ""),
          label: String(opt?.[labelKey] ?? opt?.label ?? opt?.name ?? opt?.[valueKey] ?? opt?.value ?? ""),
        };
      }
      return { value: String(opt), label: String(opt) };
    });
  }
  if (typeof optionsStr !== "string") return [];
  return optionsStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const parts = pair.split(":");
      const value = (parts[0] || "").trim();
      const label = (parts[1] || parts[0] || "").trim();
      return { value, label };
    });
}

export function getOptionLabel(field, value) {
  if (value === undefined || value === null || value === "") return "—";
  const opts = parseOptions(field?.options, field?.optionsValueKey, field?.optionsLabelKey);
  const match = opts.find((o) => o.value === String(value));
  return match ? match.label : String(value);
}

export function formatDisplayValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
}

export function inferFieldType(value) {
  if (value === null || value === undefined) return "text";
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return "date";
    if (/^https?:\/\//.test(value)) return "url";
    if (value.length > 100) return "textarea";
  }
  return "text";
}

export function formatFieldLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function resolvePathValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = String(path).split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return current;
}
