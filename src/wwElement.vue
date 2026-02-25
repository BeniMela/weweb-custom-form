<template>
  <div class="ww-dynamic-form" :style="rootStyle">
    <!-- FORM MODE (also handles display mode via isReadOnly) -->
    <form @submit.prevent="handleSubmit" novalidate>

      <!-- Fields grouped by section — each block has its own independent grid -->
      <template v-for="(block, bi) in fieldBlocks" :key="`block-${bi}`">

        <!-- Section header (null = fields before the first section) -->
        <div v-if="block.section" v-show="!block.section.hidden" class="ww-form-section-block">
          <div class="ww-form-section">
            <span v-if="block.section.label" class="ww-form-section-title">{{ block.section.label }}</span>
          </div>
        </div>

        <!-- Fields grid for this block -->
        <div class="ww-form-fields" :class="formClasses">
          <template v-for="field in block.fields" :key="field.id">
          <div
            v-show="!field.hidden"
            class="ww-form-field"
            :class="[
              `ww-form-field--${field.width || 'full'}`,
              { 'ww-form-field--error': errors[field.id] || groupErrorFieldIds.has(field.id) },
              { 'ww-form-field--dirty': isFieldDirty(field.id) },
            ]"
          >
            <!-- Label -->
            <label v-if="field.type !== 'checkbox' && field.showLabel !== false" :for="`${uid}-${field.id}`" class="ww-form-label">
              {{ field.label || field.id }}
              <span v-if="field.required && !(isReadOnly || field.readOnly)" class="ww-form-required">*</span>
            </label>

            <!-- Text / Email / Password / URL / Number / Date -->
            <input
              v-if="isInputType(field.type)"
              :id="`${uid}-${field.id}`"
              :type="field.type"
              :placeholder="field.placeholder || ''"
              :required="field.required"
              :value="formDataValues[field.id]"
              :readonly="isReadOnly || field.readOnly"
              :disabled="isReadOnly || field.readOnly"
              class="ww-form-input"
              :class="{ 'ww-form-input--readonly': isReadOnly || field.readOnly, 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
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
              :readonly="isReadOnly || field.readOnly"
              :disabled="isReadOnly || field.readOnly"
              class="ww-form-input ww-form-textarea"
              :class="{ 'ww-form-input--readonly': isReadOnly || field.readOnly, 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
              rows="4"
              @input="handleInput(field.id, $event.target.value)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            ></textarea>

            <!-- Select -->
            <SmartSelect
              v-else-if="field.type === 'select'"
              :model-value="formDataValues[field.id]"
              :options="parseOptions(field.options, field.optionsValueKey, field.optionsLabelKey)"
              :threshold="field.optionsThreshold"
              :multiple="field.multiple"
              :placeholder="field.placeholder || t('selectPlaceholder')"
              :disabled="isReadOnly || field.readOnly"
              :readonly="isReadOnly || field.readOnly"
              :no-results-text="t('noResults')"
              :selected-count-label="t('selected')"
              :class="{ 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
              @update:model-value="handleInput(field.id, $event)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            />

            <!-- Search (external) -->
            <SearchSelect
              v-else-if="field.type === 'search'"
              :model-value="getSearchModelValue(field)"
              :options="getSearchOptions(field)"
              :debounce="field.searchDebounce"
              :placeholder="field.placeholder || t('selectPlaceholder')"
              :disabled="isReadOnly || field.readOnly"
              :readonly="isReadOnly || field.readOnly"
              :no-results-text="t('noResults')"
              :loading-text="t('loading')"
              :input-class="{ 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
              @update:model-value="handleSearchSelect(field, $event)"
              @search="handleSearchQuery(field.id, $event)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            />

            <!-- Checkbox -->
            <label
              v-else-if="field.type === 'checkbox'"
              class="ww-form-checkbox-label"
              :class="{ 'ww-form-checkbox-label--dirty': isFieldDirty(field.id), 'ww-form-checkbox-label--error': errors[field.id] || groupErrorFieldIds.has(field.id), 'ww-form-checkbox-label--readonly': isReadOnly || field.readOnly }"
              :for="`${uid}-${field.id}`"
            >
              <input
                :id="`${uid}-${field.id}`"
                type="checkbox"
                :required="field.required"
                :checked="formDataValues[field.id] === true || formDataValues[field.id] === 'true'"
                :disabled="isReadOnly || field.readOnly"
                class="ww-form-checkbox"
                @change="handleInput(field.id, $event.target.checked)"
                @focus="handleFocus(field.id)"
                @blur="handleBlur(field.id)"
              />
              <span v-if="field.showLabel !== false">{{ field.label || field.id }}</span>
              <span v-if="field.required && !(isReadOnly || field.readOnly)" class="ww-form-required">*</span>
            </label>

            <!-- Radio -->
            <SmartSelect
              v-else-if="field.type === 'radio'"
              :model-value="formDataValues[field.id]"
              :options="parseOptions(field.options, field.optionsValueKey, field.optionsLabelKey)"
              :threshold="field.optionsThreshold"
              :placeholder="field.placeholder || ''"
              :disabled="isReadOnly || field.readOnly"
              :readonly="isReadOnly || field.readOnly"
              :no-results-text="t('noResults')"
              :class="{ 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
              @update:model-value="handleInput(field.id, $event)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            />

            <!-- Phone -->
            <PhoneInput
              v-else-if="field.type === 'phone'"
              :id="`${uid}-${field.id}`"
              :model-value="formDataValues[field.id]"
              :default-country="field.phoneDefaultCountry || 'FR'"
              :store-format="field.phoneStoreFormat || 'e164'"
              :placeholder="field.placeholder || ''"
              :disabled="isReadOnly || field.readOnly"
              :readonly="isReadOnly || field.readOnly"
              :lang="content.lang || 'fr'"
              :class="{ 'ww-form-input--dirty': isFieldDirty(field.id), 'ww-form-input--error': errors[field.id] || groupErrorFieldIds.has(field.id) }"
              @update:model-value="handleInput(field.id, $event)"
              @focus="handleFocus(field.id)"
              @blur="handleBlur(field.id)"
            />

            <!-- Original value (edit mode, dirty only) -->
            <div
              v-if="isEditMode && content?.showOriginalValue !== false && isFieldDirty(field.id)"
              class="ww-form-original"
            >
              {{ formatOriginalValue(field) }}
            </div>

            <!-- Field error message -->
            <div v-if="errors[field.id]" class="ww-form-error">{{ errors[field.id] }}</div>
          </div>

          <!-- Group error messages — inserted after the last field of each group -->
          <div
            v-for="(group, gi) in groupErrorsAfterField(field.id)"
            :key="`ge-${field.id}-${gi}`"
            class="ww-form-field ww-form-error--group-row"
            :class="`ww-form-field--${group.width || 'full'}`"
          >
            <div class="ww-form-error ww-form-error--group">{{ group.message }}</div>
          </div>
          </template>
        </div>

      </template>

      <!-- Buttons -->
      <div
        v-if="!isReadOnly && (isAddMode || hasAnyDirty) && (content?.showSubmitButton !== false || content?.showResetButton)"
        class="ww-form-actions"
      >
        <button v-if="content?.showResetButton" type="button" class="ww-form-btn ww-form-btn--reset" @click="handleReset">
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
import { computed } from "vue";
import { useI18n, useFields, useFormState, useStyles } from "./composables";
import { isInputType, parseOptions, getOptionLabel, formatDisplayValue, inferFieldType, formatFieldLabel } from "./utils/helpers";
import SmartSelect from "./components/SmartSelect.vue";
import SearchSelect from "./components/SearchSelect.vue";
import PhoneInput from "./components/PhoneInput.vue";

export default {
  components: { SmartSelect, SearchSelect, PhoneInput },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ["trigger-event", "update:content:effect"],
  setup(props, ctx) {
    const { t } = useI18n(props);

    // Mode
    const isAddMode = computed(() => props.content?.mode === "add");
    const isEditMode = computed(() => {
      const mode = props.content?.mode;
      return mode === "edit" || mode === "form" || !mode;
    });
    // display mode is now just an alias for readOnly — same form rendering
    const isReadOnly = computed(() => props.content?.readOnly === true || props.content?.mode === "display");

    // Fields & Styles
    const { processedFields, getDefaultValues } = useFields(props);
    const { rootStyle, formClasses } = useStyles(props);

    // Form state (includes validation, handlers, actions, watchers)
    const form = useFormState(props, ctx, { processedFields, getDefaultValues, isReadOnly, t });

    // Set of field IDs that are part of a failing group (for red border)
    const groupErrorFieldIds = computed(() => form.getGroupErrorFieldIds());

    // Returns group errors that should be rendered after a given fieldId
    // (i.e. groups where fieldId is the last visible field of the group)
    function groupErrorsAfterField(fieldId) {
      return form.groupErrors.value.filter((group) => {
        const visibleFieldIds = group.fields.filter((id) => {
          const f = processedFields.value.find((pf) => pf.id === id);
          return f && !f.hidden;
        });
        return visibleFieldIds[visibleFieldIds.length - 1] === fieldId;
      });
    }

    // Split processedFields into section blocks for rendering.
    // If props.content.sections is defined and non-empty, use it (Option A).
    // Otherwise fall back to extracting type==="section" entries from processedFields.
    const fieldBlocks = computed(() => {
      const sections = props.content?.sections;
      const fieldMap = Object.fromEntries(processedFields.value.map((f) => [f.id, f]));

      if (Array.isArray(sections) && sections.length > 0) {
        return sections.map((section) => {
          const fieldIds = String(section.fields ?? "").split(",").map((s) => s.trim()).filter(Boolean);
          return {
            section: { label: section.label ?? "", hidden: false },
            fields: fieldIds.map((id) => fieldMap[id]).filter(Boolean),
          };
        });
      }

      // Fallback: extract sections from type==="section" fields
      const blocks = [];
      let current = { section: null, fields: [] };
      for (const field of processedFields.value) {
        if (field.type === "section") {
          blocks.push(current);
          current = { section: field, fields: [] };
        } else {
          current.fields.push(field);
        }
      }
      blocks.push(current);
      return blocks.filter((b) => b.section !== null || b.fields.length > 0);
    });

    // Map a raw item to { value, label } using field's searchValueKey and searchLabelTemplate
    function mapSearchItem(item, field) {
      const value = item[field.searchValueKey ?? "id"] ?? item.id ?? item.value;
      let label;
      const template = field.searchLabelTemplate;
      if (template) {
        label = template.replace(/\{(\w+)\}/g, (_, key) => item[key] ?? "");
      } else {
        label = String(item[field.searchValueKey ?? "id"] ?? item.label ?? item.id ?? "");
      }
      return { value, label };
    }

    // Computed map fieldId → options array, reactive to searchResults changes
    const searchOptionsMap = computed(() => {
      const map = {};
      for (const field of processedFields.value) {
        if (field.type !== "search") continue;
        const injected = form.searchResults.value[field.id];
        if (injected !== undefined) {
          map[field.id] = injected.map((item) =>
            item && typeof item === "object" && "value" in item && "label" in item
              ? item
              : mapSearchItem(item, field)
          );
        } else {
          map[field.id] = parseOptions(field.options, field.optionsValueKey, field.optionsLabelKey);
        }
      }
      return map;
    });

    function getSearchOptions(field) {
      return searchOptionsMap.value[field.id] ?? [];
    }

    // Derive { value, label } from the stored raw object for SearchSelect display
    function getSearchModelValue(field) {
      const raw = form.formDataValues.value[field.id];
      if (!raw || typeof raw !== "object") return null;
      // Already normalized { value, label }
      if ("value" in raw && "label" in raw && !field.searchValueKey) return raw;
      return mapSearchItem(raw, field);
    }

    // On selection: find the raw item by value and store the full object
    function handleSearchSelect(field, selected) {
      if (selected === null) {
        form.handleInput(field.id, null);
        return;
      }
      // Look up raw item in searchResults by value key
      const raws = form.searchResults.value[field.id];
      const raw = raws?.find((item) => item[field.searchValueKey ?? "id"] === selected.value);
      form.handleInput(field.id, raw ?? selected);
    }

    // Build display label from raw object using the field's template
    function getSearchDisplayLabel(field) {
      const raw = form.formDataValues.value[field.id];
      if (!raw || typeof raw !== "object") return "—";
      const mapped = mapSearchItem(raw, field);
      return mapped.label || mapped.value || "—";
    }

    // Wrap formatOriginalValue to handle search fields with raw objects
    function formatOriginalValue(field) {
      if (field?.type === "search") {
        const original = form.originalValues.value[field.id];
        const wasLabel = t("was");
        if (!original || typeof original !== "object") return `${wasLabel} —`;
        const mapped = mapSearchItem(original, field);
        return `${wasLabel} ${mapped.label || mapped.value || "—"}`;
      }
      return form.formatOriginalValue(field);
    }

    /* wwEditor:start */
    const isEditing = computed(() => {
      return props.wwEditorState?.editMode === wwLib.wwEditorHelper?.EDIT_MODES?.EDITION;
    });

    function generateFields() {
      const data = props.content?.initialData;
      if (!data || typeof data !== "object" || Array.isArray(data)) return;

      const entries = [];
      function walk(obj, prefix) {
        for (const key of Object.keys(obj)) {
          const path = prefix ? `${prefix}.${key}` : key;
          const val = obj[key];
          if (val !== null && typeof val === "object" && !Array.isArray(val)) {
            walk(val, path);
          } else {
            entries.push({ path, value: val });
          }
        }
      }
      walk(data, "");

      ctx.emit("update:content", {
        fields: entries.map(({ path, value }) => ({
          id: path,
          label: formatFieldLabel(path.split(".").pop() || path),
          type: inferFieldType(value),
          placeholder: "",
          required: false,
          validationMessage: "",
          options: "",
          defaultValue: path,
          width: "full",
        })),
      });
    }
    /* wwEditor:end */

    return {
      // State
      formDataValues: form.formDataValues,
      errors: form.errors,
      groupErrors: form.groupErrors,
      groupErrorFieldIds,
      groupErrorsAfterField,
      // Computed
      processedFields,
      fieldBlocks,
      rootStyle,
      formClasses,
      isAddMode,
      isEditMode,
      isReadOnly,
      hasAnyDirty: form.hasAnyDirty,
      hasErrors: form.hasErrors,
      // i18n
      t,
      // Helpers (template)
      isInputType,
      parseOptions,
      getOptionLabel,
      formatDisplayValue,
      getSearchOptions,
      getSearchModelValue,
      getSearchDisplayLabel,
      handleSearchSelect,
      // Form methods
      isFieldDirty: form.isFieldDirty,
      formatOriginalValue,
      handleInput: form.handleInput,
      handleFocus: form.handleFocus,
      handleBlur: form.handleBlur,
      handleSubmit: form.handleSubmit,
      handleReset: form.handleReset,
      handleSearchQuery: form.handleSearchQuery,
      // Actions (WeWeb workflows)
      submitForm: form.handleSubmit,
      resetForm: form.resetForm,
      setFieldValue: form.setFieldValue,
      validate: form.validate,
      setFieldError: form.setFieldError,
      clearErrors: form.clearErrors,
      loadData: form.loadData,
      setSearchResults: form.setSearchResults,
      /* wwEditor:start */
      isEditing,
      generateFields,
      /* wwEditor:end */
    };
  },
};
</script>

<style lang="scss">
@import "./styles/form.scss";
@import "./styles/phone-input.scss";
</style>
