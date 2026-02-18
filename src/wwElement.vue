<template>
  <div class="ww-dynamic-form" :style="rootStyle">
    <!-- DISPLAY MODE -->
    <div v-if="isDisplayMode" class="ww-form-display">
      <div class="ww-form-fields" :class="formClasses">
        <div
          v-for="field in processedFields"
          :key="field.id"
          class="ww-form-field"
          :class="[`ww-form-field--${field.width || 'full'}`]"
        >
          <div class="ww-form-label">
            {{ field.label || field.id }}
          </div>
          <div class="ww-form-display-value">
            <template v-if="field.type === 'checkbox'">
              <span class="ww-form-display-bool" :class="{ 'ww-form-display-bool--true': formDataValues[field.id] }">
                {{ formDataValues[field.id] ? '✓' : '✗' }}
              </span>
            </template>
            <template v-else-if="field.type === 'select' || field.type === 'radio'">
              {{ getOptionLabel(field, formDataValues[field.id]) }}
            </template>
            <template v-else>
              {{ formatDisplayValue(formDataValues[field.id]) }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- FORM MODE -->
    <form v-else @submit.prevent="handleSubmit" novalidate>
      <div class="ww-form-fields" :class="formClasses">
        <div
          v-for="field in processedFields"
          :key="field.id"
          class="ww-form-field"
          :class="[
            `ww-form-field--${field.width || 'full'}`,
            { 'ww-form-field--error': errors[field.id] },
            { 'ww-form-field--dirty': isFieldDirty(field.id) },
          ]"
        >
          <!-- Label -->
          <label
            v-if="field.type !== 'checkbox'"
            :for="`${uid}-${field.id}`"
            class="ww-form-label"
          >
            {{ field.label || field.id }}
            <span v-if="field.required && !isReadOnly" class="ww-form-required">*</span>
          </label>

          <!-- Text / Email / Password / Tel / URL / Number / Date -->
          <input
            v-if="isInputType(field.type)"
            :id="`${uid}-${field.id}`"
            :type="field.type"
            :placeholder="field.placeholder || ''"
            :required="field.required"
            :value="formDataValues[field.id]"
            :readonly="isReadOnly"
            :disabled="isReadOnly"
            class="ww-form-input"
            :class="{ 'ww-form-input--readonly': isReadOnly, 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] }"
            @input="handleInput(field.id, $event.target.value)"
            @focus="handleFocus(field.id)"
            @blur="handleBlur(field.id)"
          />

          <!-- Textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :id="`${uid}-${field.id}`"
            :placeholder="field.placeholder || ''"
            :required="field.required"
            :value="formDataValues[field.id]"
            :readonly="isReadOnly"
            :disabled="isReadOnly"
            class="ww-form-input ww-form-textarea"
            :class="{ 'ww-form-input--readonly': isReadOnly, 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] }"
            rows="4"
            @input="handleInput(field.id, $event.target.value)"
            @focus="handleFocus(field.id)"
            @blur="handleBlur(field.id)"
          ></textarea>

          <!-- Select -->
          <select
            v-else-if="field.type === 'select'"
            :id="`${uid}-${field.id}`"
            :required="field.required"
            :value="formDataValues[field.id]"
            :disabled="isReadOnly"
            class="ww-form-input ww-form-select"
            :class="{ 'ww-form-input--readonly': isReadOnly, 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] }"
            @change="handleInput(field.id, $event.target.value)"
            @focus="handleFocus(field.id)"
            @blur="handleBlur(field.id)"
          >
            <option value="" disabled>
              {{ field.placeholder || t('selectPlaceholder') }}
            </option>
            <option
              v-for="opt in parseOptions(field.options)"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>

          <!-- Checkbox -->
          <label
            v-else-if="field.type === 'checkbox'"
            class="ww-form-checkbox-label"
            :class="{ 'ww-form-checkbox-label--dirty': isFieldDirty(field.id) }"
            :for="`${uid}-${field.id}`"
          >
            <input
              :id="`${uid}-${field.id}`"
              type="checkbox"
              :required="field.required"
              :checked="formDataValues[field.id] === true || formDataValues[field.id] === 'true'"
              :disabled="isReadOnly"
              class="ww-form-checkbox"
              @change="handleInput(field.id, $event.target.checked)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            />
            <span>{{ field.label || field.id }}</span>
            <span v-if="field.required && !isReadOnly" class="ww-form-required">*</span>
          </label>

          <!-- Radio -->
          <div
            v-else-if="field.type === 'radio'"
            class="ww-form-radio-group"
            :class="{ 'ww-form-radio-group--dirty': isFieldDirty(field.id) }"
          >
            <label
              v-for="opt in parseOptions(field.options)"
              :key="opt.value"
              class="ww-form-radio-label"
            >
              <input
                type="radio"
                :name="`${uid}-${field.id}`"
                :value="opt.value"
                :checked="formDataValues[field.id] === opt.value"
                :disabled="isReadOnly"
                class="ww-form-radio"
                @change="handleInput(field.id, opt.value)"
                @focus="handleFocus(field.id)"
                @blur="handleBlur(field.id)"
              />
              <span>{{ opt.label }}</span>
            </label>
          </div>

          <!-- Original value (shown when field is dirty, edit mode only) -->
          <div
            v-if="isEditMode && content?.showOriginalValue !== false && isFieldDirty(field.id)"
            class="ww-form-original"
          >
            {{ formatOriginalValue(field) }}
          </div>

          <!-- Error message -->
          <div v-if="errors[field.id]" class="ww-form-error">
            {{ errors[field.id] }}
          </div>
        </div>
      </div>

      <!-- Buttons: always visible in add mode, only when dirty in edit mode -->
      <div
        v-if="!isReadOnly && (isAddMode || hasAnyDirty) && (content?.showSubmitButton !== false || content?.showResetButton)"
        class="ww-form-actions"
      >
        <button
          v-if="content?.showResetButton"
          type="button"
          class="ww-form-btn ww-form-btn--reset"
          @click="handleReset"
        >
          {{ content?.resetButtonText || t('reset') }}
        </button>
        <button
          v-if="content?.showSubmitButton !== false"
          type="submit"
          class="ww-form-btn ww-form-btn--submit"
          :class="{ 'ww-form-btn--disabled': hasErrors }"
          :disabled="hasErrors"
        >
          {{ content?.submitButtonText || t('submit') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { computed, watch, ref } from "vue";

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ["trigger-event", "update:content:effect"],
  setup(props, ctx) {
    const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

    // ==========================================
    // Translations
    // ==========================================
    const translations = {
      fr: {
        required: "Ce champ est obligatoire",
        emailInvalid: "Veuillez saisir une adresse email valide",
        minLength: "Minimum {n} caractères requis",
        maxLength: "Maximum {n} caractères autorisés",
        minValue: "La valeur doit être au moins {n}",
        maxValue: "La valeur doit être au maximum {n}",
        patternInvalid: "La valeur ne correspond pas au format requis",
        selectPlaceholder: "Sélectionner...",
        was: "Était :",
        submit: "Envoyer",
        reset: "Réinitialiser",
      },
      en: {
        required: "This field is required",
        emailInvalid: "Please enter a valid email address",
        minLength: "Minimum {n} characters required",
        maxLength: "Maximum {n} characters allowed",
        minValue: "Value must be at least {n}",
        maxValue: "Value must be at most {n}",
        patternInvalid: "Value does not match the required format",
        selectPlaceholder: "Select...",
        was: "Was:",
        submit: "Submit",
        reset: "Reset",
      },
    };

    const lang = computed(() => props.content?.lang || "fr");

    function t(key, params) {
      const str = translations[lang.value]?.[key] || translations.fr[key] || key;
      if (!params) return str;
      return str.replace("{n}", params.n);
    }

    // ==========================================
    // Internal Variables
    // ==========================================
    const { value: formDataVar, setValue: setFormData } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "formData",
        type: "object",
        defaultValue: {},
        readonly: true,
      });

    const { value: errorsVar, setValue: setErrors } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "errors",
        type: "object",
        defaultValue: {},
        readonly: true,
      });

    const { value: isValidVar, setValue: setIsValid } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "isValid",
        type: "boolean",
        defaultValue: true,
        readonly: true,
      });

    const { value: isDirtyVar, setValue: setIsDirty } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "isDirty",
        type: "boolean",
        defaultValue: false,
        readonly: true,
      });

    const { value: touchedFieldsVar, setValue: setTouchedFields } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "touchedFields",
        type: "array",
        defaultValue: [],
        readonly: true,
      });

    const { value: originalValuesVar, setValue: setOriginalValues } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "originalValues",
        type: "object",
        defaultValue: {},
        readonly: true,
      });

    // ==========================================
    // Internal state (not exposed)
    // ==========================================
    const formDataValues = ref({});
    const errors = ref({});
    const touchedSet = ref(new Set());
    const originalValues = ref({});

    // ==========================================
    // Mode computed
    // ==========================================
    const isDisplayMode = computed(() => props.content?.mode === "display");
    const isAddMode = computed(() => props.content?.mode === "add");
    const isEditMode = computed(() => {
      const mode = props.content?.mode;
      return mode === "edit" || mode === "form" || (!mode);
    });
    const isReadOnly = computed(
      () => props.content?.readOnly === true || isDisplayMode.value
    );

    // ==========================================
    // Auto-generate fields from initialData
    // ==========================================
    function inferFieldType(value) {
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

    function formatFieldLabel(key) {
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim();
    }

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

    // ==========================================
    // Computed
    // ==========================================
    const processedFields = computed(() => {
      const manualFields = props.content?.fields;
      const hasManualFields =
        Array.isArray(manualFields) && manualFields.length > 0;
      const shouldAutoGenerate = props.content?.autoGenerateFields === true;

      let fields;

      if (hasManualFields) {
        fields = manualFields;
      } else if (shouldAutoGenerate && autoFields.value.length > 0) {
        fields = autoFields.value;
      } else if (!hasManualFields && isDisplayMode.value && autoFields.value.length > 0) {
        // In display mode, auto-generate from data even without the toggle
        fields = autoFields.value;
      } else {
        fields = [];
      }

      return fields.map((field, index) => {
        const id =
          resolveMappingFormula(props.content?.fieldsIdFormula, field) ??
          field?.id ??
          `field-${index}`;
        const label =
          resolveMappingFormula(props.content?.fieldsLabelFormula, field) ??
          field?.label ??
          "";
        const type =
          resolveMappingFormula(props.content?.fieldsTypeFormula, field) ??
          field?.type ??
          "text";
        const placeholder =
          resolveMappingFormula(
            props.content?.fieldsPlaceholderFormula,
            field
          ) ??
          field?.placeholder ??
          "";
        const required =
          resolveMappingFormula(props.content?.fieldsRequiredFormula, field) ??
          field?.required ??
          false;
        const options =
          resolveMappingFormula(props.content?.fieldsOptionsFormula, field) ??
          field?.options ??
          "";
        const defaultValue =
          resolveMappingFormula(
            props.content?.fieldsDefaultValueFormula,
            field
          ) ??
          field?.defaultValue ??
          "";

        return {
          id: String(id),
          label: String(label),
          type: String(type),
          placeholder: String(placeholder),
          required: Boolean(required),
          validationType: field?.validationType ?? "none",
          validationValue: field?.validationValue ?? "",
          validationMessage: field?.validationMessage ?? "",
          options: options,
          defaultValue: defaultValue,
          width: field?.width ?? "full",
        };
      });
    });

    const rootStyle = computed(() => ({
      "--ww-form-gap": props.content?.gap || "16px",
      "--ww-form-label-color": props.content?.labelColor || "#374151",
      "--ww-form-label-font-size": props.content?.labelFontSize || "14px",
      "--ww-form-input-bg": props.content?.inputBackgroundColor || "#ffffff",
      "--ww-form-input-border":
        props.content?.inputBorderColor || "#d1d5db",
      "--ww-form-input-radius":
        props.content?.inputBorderRadius || "4px",
      "--ww-form-input-padding": props.content?.inputPadding || "8px",
      "--ww-form-input-font-size": props.content?.inputFontSize || "14px",
      "--ww-form-input-color": props.content?.inputTextColor || "#111827",
      "--ww-form-input-focus":
        props.content?.inputFocusBorderColor || "#3b82f6",
      "--ww-form-error-color": props.content?.errorColor || "#ef4444",
      "--ww-form-dirty-bg":
        props.content?.dirtyBackgroundColor || "#fefce8",
      "--ww-form-original-color":
        props.content?.originalValueColor || "#9ca3af",
      "--ww-form-original-font-size":
        props.content?.originalValueFontSize || "12px",
      "--ww-form-display-color":
        props.content?.displayValueColor || "#111827",
      "--ww-form-display-font-size":
        props.content?.displayValueFontSize || "14px",
      "--ww-form-error-bg":
        props.content?.errorBackgroundColor || "#ffdddd",
    }));

    const formClasses = computed(() => ({
      "ww-form-fields--inline": props.content?.formLayout === "inline",
    }));

    const hasAnyDirty = computed(() => {
      for (const field of processedFields.value) {
        if (isFieldDirty(field.id)) return true;
      }
      return false;
    });

    const hasErrors = computed(() => Object.keys(errors.value).length > 0);

    // ==========================================
    // Helpers
    // ==========================================
    function isInputType(type) {
      return [
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "date",
      ].includes(type);
    }

    function parseOptions(optionsStr) {
      if (!optionsStr) return [];
      if (Array.isArray(optionsStr)) {
        return optionsStr.map((opt) => {
          if (typeof opt === "object" && opt !== null) {
            return {
              value: String(opt?.value ?? opt?.id ?? ""),
              label: String(opt?.label ?? opt?.name ?? opt?.value ?? ""),
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

    function getOptionLabel(field, value) {
      if (value === undefined || value === null || value === "") return "—";
      const opts = parseOptions(field?.options);
      const match = opts.find((o) => o.value === String(value));
      return match ? match.label : String(value);
    }

    function formatDisplayValue(value) {
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

    function isFieldDirty(fieldId) {
      if (!(fieldId in originalValues.value)) return false;
      const current = formDataValues.value[fieldId];
      const original = originalValues.value[fieldId];
      // eslint-disable-next-line eqeqeq
      return current != original && String(current ?? "") !== String(original ?? "");
    }

    function formatOriginalValue(field) {
      const original = originalValues.value[field?.id];
      const wasLabel = t("was");
      if (original === undefined || original === null) return `${wasLabel} —`;
      if (field?.type === "checkbox") {
        return original ? `${wasLabel} ✓` : `${wasLabel} ✗`;
      }
      if (field?.type === "select" || field?.type === "radio") {
        return `${wasLabel} ${getOptionLabel(field, original)}`;
      }
      return `${wasLabel} ${String(original)}`;
    }

    function getDefaultValues() {
      const defaults = {};
      for (const field of processedFields.value) {
        if (field.type === "checkbox") {
          defaults[field.id] =
            field.defaultValue === true ||
            field.defaultValue === "true" ||
            false;
        } else if (field.type === "number" && field.defaultValue !== "") {
          defaults[field.id] = field.defaultValue;
        } else {
          defaults[field.id] = field.defaultValue ?? "";
        }
      }
      return defaults;
    }

    function resolvePathValue(obj, path) {
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

    function applyInitialData(data) {
      if (!data || typeof data !== "object" || Array.isArray(data)) return;
      const current = { ...formDataValues.value };
      const originals = {};

      // For each field, try to resolve its defaultValue as a path into the data
      for (const field of processedFields.value) {
        const pathValue = resolvePathValue(data, field.defaultValue);
        if (pathValue !== undefined) {
          current[field.id] = pathValue;
          originals[field.id] = pathValue;
        } else if (field.id in data) {
          // Direct key match (flat JSON)
          current[field.id] = data[field.id];
          originals[field.id] = data[field.id];
        }
      }

      // Also apply any direct key matches not covered by fields
      for (const key of Object.keys(data)) {
        if (!(key in current)) {
          current[key] = data[key];
        }
        if (!(key in originals)) {
          originals[key] = data[key];
        }
      }

      originalValues.value = originals;
      setOriginalValues({ ...originals });
      formDataValues.value = current;
      setFormData({ ...current });

      ctx.emit("trigger-event", {
        name: "data-loaded",
        event: { formData: { ...current } },
      });
    }

    // ==========================================
    // Validation
    // ==========================================
    function validateField(fieldId) {
      const field = processedFields.value.find((f) => f.id === fieldId);
      if (!field) return null;

      const value = formDataValues.value[fieldId];
      let error = null;

      if (field.required) {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === false
        ) {
          error = field.validationMessage || t("required");
          return error;
        }
      }

      if (value === undefined || value === null || value === "") return null;

      const valType = field.validationType;
      const valValue = field.validationValue;

      if (valType === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          error =
            field.validationMessage || t("emailInvalid");
        }
      } else if (valType === "minLength") {
        const min = parseInt(valValue, 10);
        if (!isNaN(min) && String(value).length < min) {
          error =
            field.validationMessage ||
            t("minLength", { n: min });
        }
      } else if (valType === "maxLength") {
        const max = parseInt(valValue, 10);
        if (!isNaN(max) && String(value).length > max) {
          error =
            field.validationMessage ||
            t("maxLength", { n: max });
        }
      } else if (valType === "min") {
        const min = parseFloat(valValue);
        if (!isNaN(min) && Number(value) < min) {
          error =
            field.validationMessage || t("minValue", { n: min });
        }
      } else if (valType === "max") {
        const max = parseFloat(valValue);
        if (!isNaN(max) && Number(value) > max) {
          error =
            field.validationMessage || t("maxValue", { n: max });
        }
      } else if (valType === "pattern") {
        try {
          const regex = new RegExp(valValue);
          if (!regex.test(String(value))) {
            error =
              field.validationMessage ||
              t("patternInvalid");
          }
        } catch (e) {
          // Invalid regex, skip
        }
      }

      return error;
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
            event: {
              fieldId: firstErrorId,
              error: newErrors[firstErrorId],
              formData: { ...formDataValues.value },
            },
          });
        }
      }

      return allValid;
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
        event: {
          fieldId,
          value,
          formData: { ...formDataValues.value },
        },
      });

      if (props.content?.validateOnChange) {
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
    }

    function handleFocus(fieldId) {
      ctx.emit("trigger-event", {
        name: "field-focus",
        event: { fieldId },
      });
    }

    function handleBlur(fieldId) {
      touchedSet.value.add(fieldId);
      setTouchedFields([...touchedSet.value]);

      ctx.emit("trigger-event", {
        name: "field-blur",
        event: {
          fieldId,
          value: formDataValues.value[fieldId],
        },
      });

      if (props.content?.validateOnBlur !== false && !isReadOnly.value) {
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
    }

    function handleSubmit() {
      if (isReadOnly.value) return;
      const isValid = validateAll();
      if (!isValid) return;

      const mode = props.content?.mode || "edit";

      // Build changedFields: only fields that differ from original
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
          mode,
          formData: { ...formDataValues.value },
          originalValues: { ...originalValues.value },
          changedFields,
          isValid,
        },
      });
    }

    function handleReset() {
      const defaults = getDefaultValues();
      // Re-apply initialData on top of defaults
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

      ctx.emit("trigger-event", {
        name: "reset",
        event: { formData: { ...merged } },
      });
    }

    // ==========================================
    // Actions (exposed for WeWeb workflows)
    // ==========================================
    function resetForm() {
      handleReset();
    }

    function setFieldValue(fieldId, value) {
      if (typeof fieldId === "string") {
        formDataValues.value = { ...formDataValues.value, [fieldId]: value };
        setFormData({ ...formDataValues.value });
      }
    }

    function validate() {
      return validateAll();
    }

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

    // ==========================================
    // Watchers
    // ==========================================

    // Initialize formData when fields change
    watch(
      processedFields,
      (newFields) => {
        const currentData = formDataValues.value;
        const defaults = getDefaultValues();
        const merged = { ...defaults };
        for (const key of Object.keys(currentData)) {
          if (key in merged) {
            merged[key] = currentData[key];
          }
        }
        formDataValues.value = merged;
        setFormData({ ...merged });
      },
      { immediate: true }
    );

    // Watch initialData and apply values
    watch(
      () => props.content?.initialData,
      (newData) => {
        if (newData && typeof newData === "object" && !Array.isArray(newData)) {
          applyInitialData(newData);
        }
      },
      { immediate: true, deep: true }
    );

    /* wwEditor:start */
    const isEditing = computed(() => {
      return (
        props.wwEditorState?.editMode ===
        wwLib.wwEditorHelper?.EDIT_MODES?.EDITION
      );
    });

    function generateFields() {
      const data = props.content?.initialData;
      if (!data || typeof data !== "object" || Array.isArray(data)) return;

      // Flatten nested objects into dot-path entries
      const entries = [];
      function walk(obj, prefix) {
        for (const key of Object.keys(obj)) {
          const path = prefix ? `${prefix}.${key}` : key;
          const val = obj[key];
          if (
            val !== null &&
            typeof val === "object" &&
            !Array.isArray(val)
          ) {
            walk(val, path);
          } else {
            entries.push({ path, value: val });
          }
        }
      }
      walk(data, "");

      const fields = entries.map(({ path, value }) => ({
        id: path,
        label: formatFieldLabel(path.split(".").pop() || path),
        type: inferFieldType(value),
        placeholder: "",
        required: false,
        validationType: "none",
        validationValue: "",
        validationMessage: "",
        options: "",
        defaultValue: path,
        width: "full",
      }));

      ctx.emit("update:content", { fields });
    }
    /* wwEditor:end */

    return {
      // State
      formDataValues,
      errors,
      // Computed
      processedFields,
      rootStyle,
      formClasses,
      isDisplayMode,
      isAddMode,
      isEditMode,
      isReadOnly,
      hasAnyDirty,
      hasErrors,
      // Translation
      t,
      // Methods
      isInputType,
      parseOptions,
      getOptionLabel,
      formatDisplayValue,
      isFieldDirty,
      formatOriginalValue,
      handleInput,
      handleFocus,
      handleBlur,
      handleSubmit,
      handleReset,
      // Actions
      resetForm,
      setFieldValue,
      validate,
      setFieldError,
      clearErrors,
      loadData,
      /* wwEditor:start */
      isEditing,
      generateFields,
      /* wwEditor:end */
    };
  },
};
</script>

<style lang="scss" scoped>
.ww-dynamic-form {
  width: 100%;
}

.ww-form-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ww-form-gap, 16px);

  &--inline {
    flex-direction: row;
    align-items: flex-end;
  }
}

.ww-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--full {
    width: 100%;
  }

  &--half {
    width: calc(50% - var(--ww-form-gap, 16px) / 2);
  }

  &--third {
    width: calc(33.333% - var(--ww-form-gap, 16px) * 2 / 3);
  }

  &--error {
    .ww-form-input {
      border-color: var(--ww-form-error-color, #ef4444);
    }
  }

  &--dirty.ww-form-field--error {
    .ww-form-input {
      background-color: var(--ww-form-error-bg, #ffdddd);
    }
  }
}

.ww-form-label {
  font-size: var(--ww-form-label-font-size, 14px);
  color: var(--ww-form-label-color, #374151);
  font-weight: 500;
}

.ww-form-required {
  color: var(--ww-form-error-color, #ef4444);
  margin-left: 2px;
}

// ==========================================
// Form inputs
// ==========================================
.ww-form-input {
  width: 100%;
  padding: var(--ww-form-input-padding, 8px);
  font-size: var(--ww-form-input-font-size, 14px);
  color: var(--ww-form-input-color, #111827);
  background-color: var(--ww-form-input-bg, #ffffff);
  border: 1px solid var(--ww-form-input-border, #d1d5db);
  border-radius: var(--ww-form-input-radius, 4px);
  outline: none;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
  font-family: inherit;

  &:focus {
    border-color: var(--ww-form-input-focus, #3b82f6);
    box-shadow: 0 0 0 2px
      color-mix(
        in srgb,
        var(--ww-form-input-focus, #3b82f6) 20%,
        transparent
      );
  }

  &::placeholder {
    color: #9ca3af;
  }

  &--readonly {
    background-color: #f9fafb;
    cursor: default;
    opacity: 0.8;

    &:focus {
      border-color: var(--ww-form-input-border, #d1d5db);
      box-shadow: none;
    }
  }
}

.ww-form-textarea {
  resize: vertical;
  min-height: 80px;
}

.ww-form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
  cursor: pointer;

  &.ww-form-input--readonly {
    cursor: default;
  }
}

.ww-form-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ww-form-label-font-size, 14px);
  color: var(--ww-form-label-color, #374151);
  cursor: pointer;
}

.ww-form-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--ww-form-input-focus, #3b82f6);

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
}

.ww-form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ww-form-radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--ww-form-input-font-size, 14px);
  color: var(--ww-form-input-color, #111827);
  cursor: pointer;
}

.ww-form-radio {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--ww-form-input-focus, #3b82f6);

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
}

// ==========================================
// Dirty field styles
// ==========================================
.ww-form-input--dirty {
  background-color: var(--ww-form-dirty-bg, #fefce8);
}

.ww-form-input--error {
  background-color: var(--ww-form-error-bg, #ffdddd);
  border-color: var(--ww-form-error-color, #ef4444);
}

.ww-form-checkbox-label--dirty,
.ww-form-radio-group--dirty {
  background-color: var(--ww-form-dirty-bg, #fefce8);
  border-radius: var(--ww-form-input-radius, 4px);
  padding: 4px 8px;
}

.ww-form-original {
  font-size: var(--ww-form-original-font-size, 12px);
  color: var(--ww-form-original-color, #9ca3af);
  font-style: italic;
  margin-top: 2px;
}

.ww-form-error {
  font-size: 12px;
  color: var(--ww-form-error-color, #ef4444);
  margin-top: 2px;
}

// ==========================================
// Display mode
// ==========================================
.ww-form-display-value {
  font-size: var(--ww-form-display-font-size, 14px);
  color: var(--ww-form-display-color, #111827);
  padding: 4px 0;
  word-break: break-word;
}

.ww-form-display-bool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: #fee2e2;
  color: #dc2626;

  &--true {
    background-color: #dcfce7;
    color: #16a34a;
  }
}

// ==========================================
// Buttons
// ==========================================
.ww-form-actions {
  display: flex;
  gap: 8px;
  margin-top: var(--ww-form-gap, 16px);
  justify-content: flex-end;
}

.ww-form-btn {
  padding: 8px 20px;
  font-size: var(--ww-form-input-font-size, 14px);
  font-family: inherit;
  border-radius: var(--ww-form-input-radius, 4px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }

  &--submit {
    background-color: var(--ww-form-input-focus, #3b82f6);
    color: #ffffff;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      opacity: 0.5;
    }
  }

  &--reset {
    background-color: transparent;
    color: var(--ww-form-label-color, #374151);
    border-color: var(--ww-form-input-border, #d1d5db);
  }
}
</style>
