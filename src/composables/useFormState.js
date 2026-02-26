import { computed, ref, watch } from "vue";
import { resolvePathValue, getOptionLabel } from "../utils/helpers";
import { isValidPhoneNumber } from "libphonenumber-js/min";

export function useFormState(props, ctx, { processedFields, getDefaultValues, isReadOnly, t }) {
  // ==========================================
  // WeWeb internal variables
  // ==========================================
  const { setValue: setFormData } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "formData", type: "object", defaultValue: {}, readonly: true,
  });
  const { setValue: setErrors } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "errors", type: "object", defaultValue: {}, readonly: true,
  });
  const { setValue: setIsValid } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "isValid", type: "boolean", defaultValue: true, readonly: true,
  });
  const { setValue: setIsDirty } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "isDirty", type: "boolean", defaultValue: false, readonly: true,
  });
  const { setValue: setTouchedFields } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "touchedFields", type: "array", defaultValue: [], readonly: true,
  });
  const { setValue: setOriginalValues } = wwLib.wwVariable.useComponentVariable({
    uid: props.uid, name: "originalValues", type: "object", defaultValue: {}, readonly: true,
  });

  // ==========================================
  // Internal state
  // ==========================================
  const formDataValues = ref({});
  const errors = ref({});
  // groupErrors: array of { message, fields[] } — displayed once after the last field of the group
  const groupErrors = ref([]);
  const touchedSet = ref(new Set());
  const originalValues = ref({});
  const searchResults = ref({});

  const hasErrors = computed(() =>
    Object.keys(errors.value).length > 0 || groupErrors.value.length > 0
  );

  // ==========================================
  // Dirty tracking
  // ==========================================
  function isFieldDirty(fieldId) {
    if (!(fieldId in originalValues.value)) return false;
    const current = formDataValues.value[fieldId];
    const original = originalValues.value[fieldId];
    const field = processedFields.value.find((f) => f.id === fieldId);
    if (field?.type === "search") {
      const key = field.searchValueKey ?? "id";
      const currentVal = current ? (current[key] ?? current?.value ?? null) : null;
      const originalVal = original ? (original[key] ?? original?.value ?? null) : null;
      return currentVal !== originalVal;
    }
    // eslint-disable-next-line eqeqeq
    return current != original && String(current ?? "") !== String(original ?? "");
  }

  const hasAnyDirty = computed(() => {
    return processedFields.value.some((field) => isFieldDirty(field.id));
  });

  function formatOriginalValue(field) {
    const original = originalValues.value[field?.id];
    const wasLabel = t("was");
    if (original === undefined || original === null) return `${wasLabel} —`;
    if (field?.type === "checkbox") return original ? `${wasLabel} ✓` : `${wasLabel} ✗`;
    if (field?.type === "search") return `${wasLabel} ${original?.label ?? original?.value ?? "—"}`;
    if (field?.type === "select" || field?.type === "radio") return `${wasLabel} ${getOptionLabel(field, original)}`;
    return `${wasLabel} ${String(original)}`;
  }

  // ==========================================
  // Validation
  // ==========================================
  function validateField(fieldId) {
    const field = processedFields.value.find((f) => f.id === fieldId);
    if (!field) return null;
    if (field.hidden) return null;

    const value = formDataValues.value[fieldId];

    if (field.required) {
      const isEmpty = value === undefined || value === null || value === "" || value === false ||
        (field.type === "search" && !value?.[field.searchValueKey ?? "id"] && !value?.value) ||
        (field.type === "array" && (!Array.isArray(value) || value.length === 0));
      if (isEmpty) return field.validationMessage || t("required");
    }

    // Email validation
    if (field.type === "email" && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return field.validationMessage || t("emailInvalid");
      }
    }

    // Phone validation: check E.164 or national number is valid
    if (field.type === "phone" && value) {
      try {
        if (!isValidPhoneNumber(String(value), field.phoneDefaultCountry || "FR")) {
          return field.validationMessage || t("phoneInvalid");
        }
      } catch (e) {
        return field.validationMessage || t("phoneInvalid");
      }
    }

    // Array column validation
    if (field.type === "array" && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const row = value[i];
        for (const col of field.arrayColumns ?? []) {
          const colVal = row[col.id];
          if (col.required && (colVal === undefined || colVal === null || colVal === "" || colVal === false)) {
            return `${t("row")} ${i + 1} — ${col.label || col.id}: ${t("required")}`;
          }
          if (col.type === "email" && colVal) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(colVal))) {
              return `${t("row")} ${i + 1} — ${col.label || col.id}: ${t("emailInvalid")}`;
            }
          }
          if (col.type === "phone" && colVal) {
            try {
              if (!isValidPhoneNumber(String(colVal), col.phoneDefaultCountry || "FR")) {
                return `${t("row")} ${i + 1} — ${col.label || col.id}: ${t("phoneInvalid")}`;
              }
            } catch (e) {
              return `${t("row")} ${i + 1} — ${col.label || col.id}: ${t("phoneInvalid")}`;
            }
          }
        }
      }
    }

    // Formula validation: resolved by WeWeb binding, true = valid, false = invalid
    if (field.validationFormula !== null && field.validationFormula !== undefined) {
      if (field.validationFormula === false) {
        return field.validationMessage || t("patternInvalid");
      }
    }

    return null;
  }

  // Returns array of { message, fields[] } for failing groups
  function evaluateGroups() {
    const groups = props.content?.validationGroups;
    if (!Array.isArray(groups)) return [];
    const failing = [];
    for (const group of groups) {
      if (group.formula === false) {
        const fieldIds = String(group.fields ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        failing.push({ message: group.message || t("patternInvalid"), fields: fieldIds, width: group.width || "full" });
      }
    }
    return failing;
  }

  // Returns set of field IDs that belong to a failing group (for red border)
  function getGroupErrorFieldIds() {
    const ids = new Set();
    for (const g of groupErrors.value) {
      for (const id of g.fields) ids.add(id);
    }
    return ids;
  }

  function validateAll() {
    const newErrors = {};

    for (const field of processedFields.value) {
      const error = validateField(field.id);
      if (error) newErrors[field.id] = error;
    }

    const newGroupErrors = evaluateGroups();
    const allValid = Object.keys(newErrors).length === 0 && newGroupErrors.length === 0;

    errors.value = newErrors;
    groupErrors.value = newGroupErrors;
    setErrors(newErrors);
    setIsValid(allValid);

    if (!allValid) {
      const firstErrorId = Object.keys(newErrors)[0];
      if (firstErrorId) {
        ctx.emit("trigger-event", {
          name: "validation-error",
          event: { fieldId: firstErrorId, error: newErrors[firstErrorId], formData: { ...formDataValues.value } },
        });
      }
    }

    return allValid;
  }

  function updateFieldValidation(fieldId) {
    const error = validateField(fieldId);
    const newErrors = { ...errors.value };
    if (error) {
      newErrors[fieldId] = error;
    } else {
      delete newErrors[fieldId];
    }
    errors.value = newErrors;
    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0 && groupErrors.value.length === 0);
  }

  function updateGroupValidation() {
    groupErrors.value = evaluateGroups();
    setIsValid(Object.keys(errors.value).length === 0 && groupErrors.value.length === 0);
  }

  // ==========================================
  // Data loading
  // ==========================================
  function applyInitialData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    const current = { ...formDataValues.value };
    const originals = {};

    for (const field of processedFields.value) {
      const pathValue = resolvePathValue(data, field.defaultValue);
      if (pathValue !== undefined) {
        current[field.id] = pathValue;
        originals[field.id] = pathValue;
      } else if (field.id in data) {
        current[field.id] = data[field.id];
        originals[field.id] = data[field.id];
      }
    }

    for (const key of Object.keys(data)) {
      if (!(key in current)) current[key] = data[key];
      if (!(key in originals)) originals[key] = data[key];
    }

    originalValues.value = originals;
    setOriginalValues({ ...originals });
    formDataValues.value = current;
    setFormData({ ...current });

    ctx.emit("trigger-event", { name: "data-loaded", event: { formData: { ...current } } });
  }

  // ==========================================
  // Event handlers
  // ==========================================
  function handleInput(fieldId, value) {
    if (isReadOnly.value) return;

    formDataValues.value = { ...formDataValues.value, [fieldId]: value };
    setFormData({ ...formDataValues.value });
    setIsDirty(true);

    ctx.emit("trigger-event", {
      name: "field-change",
      event: { fieldId, value, formData: { ...formDataValues.value } },
    });

    const fieldDef = processedFields.value.find((f) => f.id === fieldId);
    if (fieldDef?.validateOnChange) updateFieldValidation(fieldId);

    // Groups with validateOnChange: re-evaluate if this field belongs to the group
    const groups = props.content?.validationGroups;
    if (Array.isArray(groups)) {
      for (const group of groups) {
        if (!group.validateOnChange) continue;
        const groupFieldIds = String(group.fields ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        if (groupFieldIds.includes(fieldId)) { updateGroupValidation(); break; }
      }
    }
  }

  function handleSearchQuery(fieldId, query) {
    ctx.emit("trigger-event", { name: "search-query", event: { fieldId, query } });
  }

  function handleFocus(fieldId) {
    ctx.emit("trigger-event", { name: "field-focus", event: { fieldId } });
  }

  function handleBlur(fieldId) {
    touchedSet.value.add(fieldId);
    setTouchedFields([...touchedSet.value]);

    ctx.emit("trigger-event", {
      name: "field-blur",
      event: { fieldId, value: formDataValues.value[fieldId] },
    });

    if (!isReadOnly.value) {
      const fieldDef = processedFields.value.find((f) => f.id === fieldId);
      if (fieldDef?.validateOnBlur !== false) updateFieldValidation(fieldId);

      // Groups with validateOnBlur: re-evaluate if this field belongs to the group
      const groups = props.content?.validationGroups;
      if (Array.isArray(groups)) {
        for (const group of groups) {
          if (group.validateOnBlur === false) continue;
          const groupFieldIds = String(group.fields ?? "").split(",").map((s) => s.trim()).filter(Boolean);
          if (groupFieldIds.includes(fieldId)) { updateGroupValidation(); break; }
        }
      }
    }
  }

  function handleSubmit() {
    if (isReadOnly.value) return;
    if (!validateAll()) return;

    const changedFields = {};
    for (const field of processedFields.value) {
      if (isFieldDirty(field.id)) {
        changedFields[field.id] = {
          oldValue: originalValues.value[field.id],
          newValue: formDataValues.value[field.id],
        };
      }
    }

    ctx.emit("trigger-event", {
      name: "submit",
      event: {
        mode: props.content?.mode || "edit",
        formData: { ...formDataValues.value },
        originalValues: { ...originalValues.value },
        changedFields,
        isValid: true,
      },
    });
  }

  function handleReset() {
    const defaults = getDefaultValues();
    const data = props.content?.initialData;
    const merged =
      data && typeof data === "object" && !Array.isArray(data)
        ? { ...defaults, ...data }
        : defaults;

    formDataValues.value = merged;
    errors.value = {};
    groupErrors.value = [];
    touchedSet.value = new Set();

    setFormData({ ...merged });
    setErrors({});
    setIsValid(true);
    setIsDirty(false);
    setTouchedFields([]);

    ctx.emit("trigger-event", { name: "reset", event: { formData: { ...merged } } });
  }

  // ==========================================
  // Actions (exposed for WeWeb workflows)
  // ==========================================
  function resetForm() { handleReset(); }

  function setFieldValue(fieldId, value) {
    if (typeof fieldId === "string") {
      formDataValues.value = { ...formDataValues.value, [fieldId]: value };
      setFormData({ ...formDataValues.value });
    }
  }

  function validate() { return validateAll(); }

  function setFieldError(fieldId, errorMessage) {
    if (typeof fieldId === "string") {
      const newErrors = { ...errors.value, [fieldId]: errorMessage };
      errors.value = newErrors;
      setErrors(newErrors);
      setIsValid(false);
    }
  }

  function clearErrors() {
    errors.value = {};
    groupErrors.value = [];
    setErrors({});
    setIsValid(true);
  }

  function loadData(data) {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      applyInitialData(data);
    }
  }

  function setSearchResults(fieldId, results) {
    if (typeof fieldId === "string") {
      searchResults.value = { ...searchResults.value, [fieldId]: Array.isArray(results) ? results : [] };
    }
  }

  // ==========================================
  // Watchers
  // ==========================================
  watch(
    processedFields,
    () => {
      const currentData = formDataValues.value;
      const defaults = getDefaultValues();
      const merged = { ...defaults };
      for (const key of Object.keys(currentData)) {
        if (!(key in merged)) continue;
        const current = currentData[key];
        const field = processedFields.value.find((f) => f.id === key);
        // For search fields, only keep current value if it's a non-null object
        if (field?.type === "search") {
          if (current && typeof current === "object") {
            merged[key] = current;
          }
          // else keep null from defaults
        } else if (field?.type === "array") {
          // Preserve array values as-is
          if (Array.isArray(current)) {
            merged[key] = current;
          }
        } else {
          merged[key] = current;
        }
      }
      // Only update if something actually changed to avoid infinite reactive loops
      // (e.g. when hidden is bound to formData.xxx, processedFields depends on formDataValues)
      const hasChanged = Object.keys(merged).some((k) => merged[k] !== currentData[k]) ||
        Object.keys(currentData).some((k) => !(k in merged));
      if (hasChanged) {
        formDataValues.value = merged;
        setFormData({ ...merged });
      }
    },
    { immediate: true }
  );

  watch(
    () => props.content?.initialData,
    (newData) => {
      if (newData && typeof newData === "object" && !Array.isArray(newData)) {
        applyInitialData(newData);
      }
    },
    { immediate: true, deep: true }
  );

  return {
    formDataValues,
    errors,
    groupErrors,
    getGroupErrorFieldIds,
    searchResults,
    originalValues,
    hasAnyDirty,
    hasErrors,
    isFieldDirty,
    formatOriginalValue,
    handleInput,
    handleFocus,
    handleBlur,
    handleSubmit,
    handleReset,
    handleSearchQuery,
    resetForm,
    setFieldValue,
    validate,
    setFieldError,
    clearErrors,
    loadData,
    setSearchResults,
  };
}
