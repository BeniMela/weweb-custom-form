import { computed, ref, watch } from "vue";
import { resolvePathValue, getOptionLabel } from "../utils/helpers";

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
  const touchedSet = ref(new Set());
  const originalValues = ref({});
  const searchResults = ref({});

  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

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
        (field.type === "search" && !value?.[field.searchValueKey ?? "id"] && !value?.value);
      if (isEmpty) return field.validationMessage || t("required");
    }

    if (value === undefined || value === null || value === "") return null;

    const { validationType: valType, validationValue: valValue, validationMessage: msg } = field;

    if (valType === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return msg || t("emailInvalid");
    } else if (valType === "minLength") {
      const min = parseInt(valValue, 10);
      if (!isNaN(min) && String(value).length < min) return msg || t("minLength", { n: min });
    } else if (valType === "maxLength") {
      const max = parseInt(valValue, 10);
      if (!isNaN(max) && String(value).length > max) return msg || t("maxLength", { n: max });
    } else if (valType === "min") {
      const min = parseFloat(valValue);
      if (!isNaN(min) && Number(value) < min) return msg || t("minValue", { n: min });
    } else if (valType === "max") {
      const max = parseFloat(valValue);
      if (!isNaN(max) && Number(value) > max) return msg || t("maxValue", { n: max });
    } else if (valType === "pattern") {
      try {
        if (!new RegExp(valValue).test(String(value))) return msg || t("patternInvalid");
      } catch (e) { /* invalid regex, skip */ }
    }

    return null;
  }

  function validateAll() {
    const newErrors = {};
    let allValid = true;

    for (const field of processedFields.value) {
      const error = validateField(field.id);
      if (error) {
        newErrors[field.id] = error;
        allValid = false;
      }
    }

    errors.value = newErrors;
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
    setIsValid(Object.keys(newErrors).length === 0);
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

    if (props.content?.validateOnChange) updateFieldValidation(fieldId);
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

    if (props.content?.validateOnBlur !== false && !isReadOnly.value) {
      updateFieldValidation(fieldId);
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
        } else {
          merged[key] = current;
        }
      }
      formDataValues.value = merged;
      setFormData({ ...merged });
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
