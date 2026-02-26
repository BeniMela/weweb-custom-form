import { computed } from "vue";
import { inferFieldType, formatFieldLabel } from "../utils/helpers";

export function useFields(props) {
  const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

  const autoFields = computed(() => {
    const data = props.content?.initialData;
    if (!data || typeof data !== "object" || Array.isArray(data)) return [];

    return Object.keys(data).map((key) => ({
      id: key,
      label: formatFieldLabel(key),
      type: inferFieldType(data[key]),
      placeholder: "",
      required: false,
      validationType: "none",
      validationValue: "",
      validationMessage: "",
      options: "",
      defaultValue: data[key] ?? "",
      width: "full",
    }));
  });

  const processedFields = computed(() => {
    const manualFields = props.content?.fields;
    const hasManualFields = Array.isArray(manualFields) && manualFields.length > 0;
    const shouldAutoGenerate = props.content?.autoGenerateFields === true;

    let fields;

    if (hasManualFields) {
      fields = manualFields;
    } else if (shouldAutoGenerate && autoFields.value.length > 0) {
      fields = autoFields.value;
    } else {
      fields = [];
    }

    return fields.map((field, index) => {
      const id =
        resolveMappingFormula(props.content?.fieldsIdFormula, field) ?? field?.id ?? `field-${index}`;
      const label =
        resolveMappingFormula(props.content?.fieldsLabelFormula, field) ?? field?.label ?? "";
      const type =
        resolveMappingFormula(props.content?.fieldsTypeFormula, field) ?? field?.type ?? "text";
      const placeholder =
        resolveMappingFormula(props.content?.fieldsPlaceholderFormula, field) ?? field?.placeholder ?? "";
      const required =
        resolveMappingFormula(props.content?.fieldsRequiredFormula, field) ?? field?.required ?? false;
      const options =
        resolveMappingFormula(props.content?.fieldsOptionsFormula, field) ?? field?.options ?? "";
      const optionsValueKey =
        resolveMappingFormula(props.content?.fieldsOptionsValueFormula, field) ?? field?.optionsValueKey ?? "value";
      const optionsLabelKey =
        resolveMappingFormula(props.content?.fieldsOptionsLabelFormula, field) ?? field?.optionsLabelKey ?? "label";
      const optionsThreshold =
        resolveMappingFormula(props.content?.fieldsOptionsThresholdFormula, field) ?? field?.optionsThreshold ?? 10;
      const multiple =
        resolveMappingFormula(props.content?.fieldsMultipleFormula, field) ?? field?.multiple ?? false;
      const searchDebounce =
        resolveMappingFormula(props.content?.fieldsSearchDebounceFormula, field) ?? field?.searchDebounce ?? 300;
      const searchValueKey =
        resolveMappingFormula(props.content?.fieldsSearchValueKeyFormula, field) ?? field?.searchValueKey ?? "id";
      const searchLabelTemplate =
        resolveMappingFormula(props.content?.fieldsSearchLabelTemplateFormula, field) ?? field?.searchLabelTemplate ?? "";
      const phoneDefaultCountry =
        resolveMappingFormula(props.content?.fieldsPhoneDefaultCountryFormula, field) ?? field?.phoneDefaultCountry ?? "FR";
      const phoneStoreFormat =
        resolveMappingFormula(props.content?.fieldsPhoneStoreFormatFormula, field) ?? field?.phoneStoreFormat ?? "e164";
      const defaultValue =
        resolveMappingFormula(props.content?.fieldsDefaultValueFormula, field) ?? field?.defaultValue ?? "";
      const hidden =
        resolveMappingFormula(props.content?.fieldsHiddenFormula, field) ?? field?.hidden ?? false;
      const readOnly = field?.readOnly ?? false;
      const showLabel = field?.showLabel ?? true;

      return {
        id: String(id),
        label: String(label),
        type: String(type),
        placeholder: String(placeholder),
        required: Boolean(required),
        hidden: Boolean(hidden),
        readOnly: Boolean(readOnly),
        showLabel: Boolean(showLabel),
        validationMessage: field?.validationMessage ?? "",
        validationFormula: field?.validationFormula ?? null,
        validateOnChange: field?.validateOnChange ?? false,
        validateOnBlur: field?.validateOnBlur ?? true,
        options,
        optionsValueKey: String(optionsValueKey),
        optionsLabelKey: String(optionsLabelKey),
        optionsThreshold: Number(optionsThreshold) || 10,
        multiple: Boolean(multiple),
        searchDebounce: Number(searchDebounce) || 300,
        searchValueKey: String(searchValueKey),
        searchLabelTemplate: String(searchLabelTemplate),
        phoneDefaultCountry: String(phoneDefaultCountry),
        phoneStoreFormat: String(phoneStoreFormat),
        defaultValue,
        width: field?.width ?? "full",
        arrayColumns: Array.isArray(field?.arrayColumns) ? field.arrayColumns : [],
        arrayAddLabel: field?.arrayAddLabel ?? "",
      };
    });
  });

  function getDefaultValues() {
    const defaults = {};
    for (const field of processedFields.value) {
      if (field.type === "section") {
        // Section separators have no value in formData
        continue;
      } else if (field.type === "array") {
        defaults[field.id] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      } else if (field.type === "search") {
        defaults[field.id] = null;
      } else if (field.type === "checkbox") {
        defaults[field.id] =
          field.defaultValue === true || field.defaultValue === "true" || false;
      } else if (field.multiple) {
        defaults[field.id] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      } else if (field.type === "number" && field.defaultValue !== "") {
        defaults[field.id] = field.defaultValue;
      } else {
        defaults[field.id] = field.defaultValue ?? "";
      }
    }
    return defaults;
  }

  return { processedFields, getDefaultValues };
}
