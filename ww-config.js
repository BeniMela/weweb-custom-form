export default {
  editor: {
    label: {
      en: "Dynamic Form",
    },
    icon: "edit",
    customSettingsPropertiesOrder: [
      {
        label: "Mode",
        isCollapsible: true,
        properties: ["mode", "readOnly", "lang"],
      },
      {
        label: "Data",
        isCollapsible: true,
        properties: ["initialData", "autoGenerateFields"],
      },
      "generateFieldsButton",
      "fields",
      "fieldsIdFormula",
      "fieldsLabelFormula",
      "fieldsTypeFormula",
      "fieldsPlaceholderFormula",
      "fieldsRequiredFormula",
      "fieldsOptionsFormula",
      "fieldsOptionsValueFormula",
      "fieldsOptionsLabelFormula",
      "fieldsOptionsThresholdFormula",
      "fieldsMultipleFormula",
      "fieldsSearchDebounceFormula",
      "fieldsDefaultValueFormula",
      "fieldsHiddenFormula",
      {
        label: "Submit & Reset",
        isCollapsible: true,
        properties: [
          "showSubmitButton",
          "submitButtonText",
          "showResetButton",
          "resetButtonText",
        ],
      },
      {
        label: "Validation",
        isCollapsible: true,
        properties: ["validationGroups"],
      },
    ],
    customStylePropertiesOrder: [
      {
        label: "Layout",
        isCollapsible: true,
        properties: ["formLayout", "gap"],
      },
      {
        label: "Labels",
        isCollapsible: true,
        properties: ["labelColor", "labelFontSize"],
      },
      {
        label: "Inputs",
        isCollapsible: true,
        properties: [
          "inputBackgroundColor",
          "inputBorderColor",
          "inputBorderRadius",
          "inputPadding",
          "inputFontSize",
          "inputTextColor",
          "inputFocusBorderColor",
        ],
      },
      {
        label: "Dirty Fields",
        isCollapsible: true,
        properties: [
          "showOriginalValue",
          "dirtyBackgroundColor",
          "originalValueColor",
          "originalValueFontSize",
        ],
      },
      {
        label: "Display Mode",
        isCollapsible: true,
        properties: ["displayValueColor", "displayValueFontSize"],
      },
      {
        label: "Errors",
        isCollapsible: true,
        properties: ["errorColor", "errorBackgroundColor"],
      },
    ],
  },
  triggerEvents: [
    {
      name: "submit",
      label: { en: "On Submit" },
      event: { mode: "", formData: {}, originalValues: {}, changedFields: {}, isValid: true },
      default: true,
    },
    {
      name: "field-change",
      label: { en: "On Field Change" },
      event: { fieldId: "", value: "", formData: {} },
    },
    {
      name: "validation-error",
      label: { en: "On Validation Error" },
      event: { fieldId: "", error: "", formData: {} },
    },
    {
      name: "reset",
      label: { en: "On Reset" },
      event: { formData: {} },
    },
    {
      name: "field-focus",
      label: { en: "On Field Focus" },
      event: { fieldId: "" },
    },
    {
      name: "field-blur",
      label: { en: "On Field Blur" },
      event: { fieldId: "", value: "" },
    },
    {
      name: "data-loaded",
      label: { en: "On Data Loaded" },
      event: { formData: {} },
    },
    {
      name: "search-query",
      label: { en: "On Search Query" },
      event: { fieldId: "", query: "" },
    },
  ],
  actions: [
    { label: "Reset form", action: "resetForm" },
    {
      label: "Set field value",
      action: "setFieldValue",
      args: [
        { name: "Field ID", type: "string" },
        { name: "Value", type: "string" },
      ],
    },
    { label: "Validate form", action: "validate" },
    {
      label: "Set field error",
      action: "setFieldError",
      args: [
        { name: "Field ID", type: "string" },
        { name: "Error message", type: "string" },
      ],
    },
    { label: "Clear all errors", action: "clearErrors" },
    {
      label: "Load data",
      action: "loadData",
      args: [{ name: "Data (JSON object)", type: "object" }],
    },
    {
      label: "Set search results",
      action: "setSearchResults",
      args: [
        { name: "Field ID", type: "string" },
        { name: "Results (array)", type: "array" },
      ],
    },
  ],
  properties: {
    // ==========================================
    // SETTINGS - Mode
    // ==========================================
    mode: {
      label: { en: "Mode" },
      type: "TextSelect",
      section: "settings",
      options: {
        options: [
          { value: "edit", label: "Edit", default: true },
          { value: "add", label: "Add" },
          { value: "display", label: "Display (read-only)" },
        ],
      },
      defaultValue: "edit",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Component mode: 'edit' to modify existing data, 'add' for new entry, 'display' for read-only",
      },
      propertyHelp: {
        tooltip:
          "Edit: modify existing data, buttons appear only when changes are made. Add: create new entry, submit always visible. Display: read-only view.",
      },
      /* wwEditor:end */
    },
    readOnly: {
      label: { en: "Read Only" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
      hidden: (content) => content?.mode === "display",
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Make all fields read-only (keeps form styling but disables editing)",
      },
      propertyHelp: {
        tooltip:
          "When enabled, fields keep their form appearance but cannot be edited. Use Mode = Display for a cleaner read-only look.",
      },
      /* wwEditor:end */
    },

    lang: {
      label: { en: "Language" },
      type: "TextSelect",
      section: "settings",
      options: {
        options: [
          { value: "fr", label: "Français", default: true },
          { value: "en", label: "English" },
        ],
      },
      defaultValue: "fr",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Language for UI strings: 'fr' for French, 'en' for English",
      },
      propertyHelp: {
        tooltip:
          "Choose the language for validation messages, button labels, and other UI texts.",
      },
      /* wwEditor:end */
    },

    // ==========================================
    // SETTINGS - Data
    // ==========================================
    initialData: {
      label: { en: "Initial Data (JSON)" },
      type: "RawObject",
      section: "settings",
      bindable: true,
      defaultValue: null,
      options: {
        placeholder: '{ "name": "John", "email": "john@example.com" }',
      },
      /* wwEditor:start */
      bindingValidation: {
        type: "object",
        tooltip:
          "A JSON object whose values will pre-fill the form fields. Keys should match field IDs.",
      },
      propertyHelp: {
        tooltip:
          "Bind a JSON object to pre-fill the form. Keys must match field IDs. In Display mode, fields are auto-generated from this object if no fields are defined.",
      },
      /* wwEditor:end */
    },
    autoGenerateFields: {
      label: { en: "Auto-generate fields from data" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
      hidden: (content) => !content?.initialData,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Automatically create fields from the keys of initialData",
      },
      propertyHelp: {
        tooltip:
          "When enabled and initialData is provided, fields will be automatically generated from the JSON keys. Field types are inferred (number, boolean, text). Manually defined fields take priority.",
      },
      /* wwEditor:end */
    },

    // ==========================================
    // SETTINGS - Generate Fields Button
    // ==========================================
    generateFieldsButton: {
      type: "Button",
      options: {
        text: "Generate fields from data",
        color: "blue",
        action: "generateFields",
      },
      section: "settings",
      editorOnly: true,
      hidden: (content) => !content?.initialData,
    },

    // ==========================================
    // SETTINGS - Fields Array
    // ==========================================
    fields: {
      label: { en: "Fields" },
      type: "Array",
      section: "settings",
      bindable: true,
      defaultValue: [
        {
          id: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter your name",
          required: true,
          validationType: "none",
          validationValue: "",
          validationMessage: "",
          options: "",
          defaultValue: "",
          width: "full",
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          placeholder: "Enter your email",
          required: true,
          validationMessage: "",
          options: "",
          defaultValue: "",
          width: "full",
        },
      ],
      options: {
        expandable: true,
        getItemLabel(item, index) {
          return item?.label?.length
            ? item.label
            : item?.id?.length
            ? item.id
            : `Field ${index + 1}`;
        },
        item: {
          type: "Object",
          defaultValue: {
            id: "field",
            label: "New Field",
            type: "text",
            placeholder: "",
            required: false,
            validationFormula: null,
            validationMessage: "",
            validateOnChange: false,
            validateOnBlur: true,
            options: "",
            optionsValueKey: "value",
            optionsLabelKey: "label",
            optionsThreshold: 10,
            readOnly: false,
            hidden: false,
            showLabel: true,
            multiple: false,
            searchDebounce: 300,
            searchValueKey: "id",
            searchLabelTemplate: "",
            phoneDefaultCountry: "FR",
            phoneStoreFormat: "e164",
            defaultValue: "",
            width: "full",
          },
          options: (content, sidePanelContent, boundProperties, wwProps, array) => ({
            item: {
              id: {
                label: { en: "ID" },
                type: "Text",
              },
              label: {
                label: { en: "Label" },
                type: "Text",
                bindable: true,
              },
              type: {
                label: { en: "Type" },
                type: "TextSelect",
                options: {
                  options: [
                    { value: "text", label: "Text", default: true },
                    { value: "email", label: "Email" },
                    { value: "password", label: "Password" },
                    { value: "number", label: "Number" },
                    { value: "phone", label: "Phone (with country selector)" },
                    { value: "url", label: "URL" },
                    { value: "date", label: "Date" },
                    { value: "textarea", label: "Textarea" },
                    { value: "select", label: "Select" },
                    { value: "search", label: "Search (external)" },
                    { value: "checkbox", label: "Checkbox" },
                    { value: "radio", label: "Radio" },
                    { value: "section", label: "Section separator" },
                  ],
                },
              },
              placeholder: {
                label: { en: "Placeholder" },
                type: "Text",
                bindable: true,
                hidden:
                  array?.item?.type === "checkbox" ||
                  array?.item?.type === "radio",
              },
              required: {
                label: { en: "Required" },
                type: "OnOff",
                hidden: array?.item?.type === "section",
              },
              readOnly: {
                label: { en: "Read Only" },
                type: "OnOff",
                defaultValue: false,
                hidden: array?.item?.type === "section",
                bindable: true,
              },
              hidden: {
                label: { en: "Hidden" },
                type: "OnOff",
                defaultValue: false,
                bindable: true,
                /* wwEditor:start */
                bindingValidation: {
                  type: "boolean",
                  tooltip: "Hide this field conditionally. The value is preserved in formData but excluded from validation.",
                },
                propertyHelp: {
                  tooltip: "When true, the field is hidden from the form. Its value stays in formData but is not validated.",
                },
                /* wwEditor:end */
              },
              validationFormula: {
                label: { en: "Validation Formula" },
                type: "Text",
                bindable: true,
                /* wwEditor:start */
                bindingValidation: {
                  type: "boolean",
                  tooltip: "Bind a formula that returns true if the field is valid, false otherwise. Use validationMessage for the error text.",
                },
                propertyHelp: {
                  tooltip: "Bind a formula returning true (valid) or false (invalid). Example: formData.unl_unlocodes_id?.unl_code?.startsWith(formData.cou_countries_id?.cou_iso_code)",
                },
                /* wwEditor:end */
              },
              validationMessage: {
                label: { en: "Error Message" },
                type: "Text",
                bindable: true,
                hidden: !array?.item?.validationFormula,
              },
              validateOnChange: {
                label: { en: "Validate on Change" },
                type: "OnOff",
                defaultValue: false,
                /* wwEditor:start */
                propertyHelp: { tooltip: "Re-validate this field immediately when its value changes." },
                /* wwEditor:end */
              },
              validateOnBlur: {
                label: { en: "Validate on Blur" },
                type: "OnOff",
                defaultValue: true,
                /* wwEditor:start */
                propertyHelp: { tooltip: "Re-validate this field when it loses focus." },
                /* wwEditor:end */
              },
              options: {
                label: { en: "Options" },
                type: "Text",
                bindable: true,
                hidden:
                  array?.item?.type !== "select" &&
                  array?.item?.type !== "radio",
                /* wwEditor:start */
                bindingValidation: {
                  type: "array",
                  tooltip:
                    'Array of objects (e.g. [{ id: 1, name: "Option 1" }]) or comma-separated string "value1:Label 1, value2:Label 2"',
                },
                propertyHelp: {
                  tooltip:
                    'Bind an array of objects, or use text format: "value1:Label 1, value2:Label 2". When binding an array, set Value Key and Label Key below.',
                },
                /* wwEditor:end */
              },
              optionsValueKey: {
                label: { en: "Value Key" },
                type: "Text",
                defaultValue: "value",
                hidden:
                  array?.item?.type !== "select" &&
                  array?.item?.type !== "radio",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    'Object key to use as option value (default: "value"). e.g. "id", "code"',
                },
                /* wwEditor:end */
              },
              optionsLabelKey: {
                label: { en: "Label Key" },
                type: "Text",
                defaultValue: "label",
                hidden:
                  array?.item?.type !== "select" &&
                  array?.item?.type !== "radio",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    'Object key to use as option label (default: "label"). e.g. "name", "title"',
                },
                /* wwEditor:end */
              },
              optionsThreshold: {
                label: { en: "Buttons / Dropdown threshold" },
                type: "Number",
                defaultValue: 10,
                options: { min: 1, max: 100, step: 1 },
                hidden:
                  array?.item?.type !== "select" &&
                  array?.item?.type !== "radio",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    "Number of options below which buttons are shown instead of a searchable dropdown (default: 10).",
                },
                /* wwEditor:end */
              },
              multiple: {
                label: { en: "Multiple selection" },
                type: "OnOff",
                defaultValue: false,
                hidden: array?.item?.type !== "select" && array?.item?.type !== "radio",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    "Allow selecting multiple values. The field value will be stored as an array.",
                },
                /* wwEditor:end */
              },
              searchDebounce: {
                label: { en: "Debounce (ms)" },
                type: "Number",
                defaultValue: 300,
                options: { min: 0, max: 2000, step: 50 },
                hidden: array?.item?.type !== "search",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    "Delay in ms before firing the search-query event after the user stops typing (default: 300ms).",
                },
                /* wwEditor:end */
              },
              searchValueKey: {
                label: { en: "Value Key" },
                type: "Text",
                defaultValue: "id",
                hidden: array?.item?.type !== "search",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    'Object key used as the stored value (default: "id"). e.g. "id", "code", "uuid"',
                },
                /* wwEditor:end */
              },
              searchLabelTemplate: {
                label: { en: "Label Template" },
                type: "Text",
                defaultValue: "",
                hidden: array?.item?.type !== "search",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip:
                    'Template string to build the displayed label. Use {field} placeholders. e.g. "{cou_label_fr} ({cou_iso_code})". Leave empty to use the value key.',
                },
                /* wwEditor:end */
              },
              phoneDefaultCountry: {
                label: { en: "Default Country" },
                type: "Text",
                defaultValue: "FR",
                hidden: array?.item?.type !== "phone",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip: "ISO 3166-1 alpha-2 country code for the default dial prefix (e.g. FR, US, DE). Used when no value is set.",
                },
                /* wwEditor:end */
              },
              phoneStoreFormat: {
                label: { en: "Store Format" },
                type: "TextSelect",
                defaultValue: "e164",
                hidden: array?.item?.type !== "phone",
                options: {
                  options: [
                    { value: "e164", label: "E.164 (+33612345678)", default: true },
                    { value: "national", label: "National (06 12 34 56 78)" },
                    { value: "raw", label: "Raw (as typed)" },
                  ],
                },
                /* wwEditor:start */
                propertyHelp: {
                  tooltip: "Format stored in formData. E.164 is recommended for backend use. National keeps local formatting. Raw stores digits as typed.",
                },
                /* wwEditor:end */
              },
              showLabel: {
                label: { en: "Show Label" },
                type: "OnOff",
                defaultValue: true,
                hidden: array?.item?.type === "section",
              },
              defaultValue: {
                label: { en: "Default Value" },
                type: "Text",
                bindable: true,
                hidden: array?.item?.type === "section",
              },
              width: {
                label: { en: "Width" },
                type: "TextSelect",
                options: {
                  options: [
                    { value: "full", label: "Full", default: true },
                    { value: "half", label: "Half" },
                    { value: "third", label: "Third" },
                  ],
                },
              },
            },
            propertiesOrder: [
              "id",
              "label",
              "type",
              "showLabel",
              "readOnly",
              "hidden",
              "placeholder",
              "options",
              "optionsValueKey",
              "optionsLabelKey",
              "optionsThreshold",
              "multiple",
              "searchDebounce",
              "searchValueKey",
              "searchLabelTemplate",
              "phoneDefaultCountry",
              "phoneStoreFormat",
              "defaultValue",
              "width",
              {
                label: "Validation",
                isCollapsible: true,
                properties: [
                  "required",
                  "validationFormula",
                  "validationMessage",
                  "validateOnChange",
                  "validateOnBlur",
                ],
              },
            ],
          }),
        },
        movable: true,
      },
      /* wwEditor:start */
      bindingValidation: {
        type: "array",
        tooltip:
          "Array of field objects: { id, label, type, placeholder, required, options, defaultValue, width }",
      },
      /* wwEditor:end */
    },

    // ==========================================
    // SETTINGS - Formula properties for bound fields
    // ==========================================
    fieldsIdFormula: {
      label: { en: "ID Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['id']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsLabelFormula: {
      label: { en: "Label Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['label']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsTypeFormula: {
      label: { en: "Type Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['type']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsPlaceholderFormula: {
      label: { en: "Placeholder Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['placeholder']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsRequiredFormula: {
      label: { en: "Required Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['required']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsOptionsFormula: {
      label: { en: "Options Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['options']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsOptionsValueFormula: {
      label: { en: "Options Value Key" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['optionsValueKey']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsOptionsLabelFormula: {
      label: { en: "Options Label Key" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['optionsLabelKey']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsOptionsThresholdFormula: {
      label: { en: "Options Threshold" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['optionsThreshold']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsMultipleFormula: {
      label: { en: "Multiple Selection" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['multiple']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsSearchDebounceFormula: {
      label: { en: "Search Debounce (ms)" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['searchDebounce']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsDefaultValueFormula: {
      label: { en: "Default Value Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['defaultValue']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },
    fieldsHiddenFormula: {
      label: { en: "Hidden Field" },
      type: "Formula",
      section: "settings",
      options: (content) => ({
        template:
          Array.isArray(content.fields) && content.fields.length > 0
            ? content.fields[0]
            : null,
      }),
      defaultValue: {
        type: "f",
        code: "context.mapping?.['hidden']",
      },
      hidden: (content, sidepanelContent, boundProps) =>
        !Array.isArray(content.fields) ||
        !content.fields?.length ||
        !boundProps.fields,
    },

    // ==========================================
    // SETTINGS - Submit & Reset
    // ==========================================
    showSubmitButton: {
      label: { en: "Show Submit Button" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Show or hide the submit button",
      },
      /* wwEditor:end */
    },
    submitButtonText: {
      label: { en: "Submit Text" },
      type: "Text",
      section: "settings",
      bindable: true,
      defaultValue: "Submit",
      hidden: (content) => !content?.showSubmitButton,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Text displayed on the submit button",
      },
      /* wwEditor:end */
    },
    showResetButton: {
      label: { en: "Show Reset Button" },
      type: "OnOff",
      section: "settings",
      bindable: true,
      defaultValue: false,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Show or hide the reset button",
      },
      /* wwEditor:end */
    },
    resetButtonText: {
      label: { en: "Reset Text" },
      type: "Text",
      section: "settings",
      bindable: true,
      defaultValue: "Reset",
      hidden: (content) => !content?.showResetButton,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Text displayed on the reset button",
      },
      /* wwEditor:end */
    },

    validationGroups: {
      label: { en: "Validation Groups" },
      type: "Array",
      section: "settings",
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(item, index) {
          return item?.message?.length ? item.message : `Group ${index + 1}`;
        },
        item: {
          type: "Object",
          defaultValue: {
            formula: null,
            message: "",
            fields: "",
            width: "full",
            validateOnChange: false,
            validateOnBlur: true,
          },
          options: {
            item: {
              formula: {
                label: { en: "Formula (valid = true)" },
                type: "Text",
                bindable: true,
                /* wwEditor:start */
                bindingValidation: {
                  type: "boolean",
                  tooltip: "Bind a formula that returns true if the group is valid, false otherwise.",
                },
                propertyHelp: {
                  tooltip: "Formula returning true (valid) or false (invalid). Example: formData.adr_is_billing || formData.adr_is_delivery || formData.adr_is_pickup",
                },
                /* wwEditor:end */
              },
              message: {
                label: { en: "Error Message" },
                type: "Text",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip: "Error message displayed on all fields in this group when the formula returns false.",
                },
                /* wwEditor:end */
              },
              fields: {
                label: { en: "Field IDs (comma-separated)" },
                type: "Text",
                /* wwEditor:start */
                propertyHelp: {
                  tooltip: 'Comma-separated list of field IDs to show the error on. Example: "adr_is_billing,adr_is_delivery,adr_is_pickup"',
                },
                /* wwEditor:end */
              },
              validateOnChange: {
                label: { en: "Validate on Change" },
                type: "OnOff",
                defaultValue: false,
                /* wwEditor:start */
                propertyHelp: { tooltip: "Re-evaluate this group immediately when any field value changes." },
                /* wwEditor:end */
              },
              validateOnBlur: {
                label: { en: "Validate on Blur" },
                type: "OnOff",
                defaultValue: true,
                /* wwEditor:start */
                propertyHelp: { tooltip: "Re-evaluate this group when a field loses focus." },
                /* wwEditor:end */
              },
              width: {
                label: { en: "Message Width" },
                type: "TextSelect",
                defaultValue: "full",
                options: {
                  options: [
                    { value: "full", label: "Full", default: true },
                    { value: "half", label: "Half" },
                    { value: "third", label: "Third" },
                  ],
                },
                /* wwEditor:start */
                propertyHelp: {
                  tooltip: "Width of the error message row in the form grid (full/half/third).",
                },
                /* wwEditor:end */
              },
            },
            propertiesOrder: ["formula", "message", "fields", "width", "validateOnChange", "validateOnBlur"],
          },
        },
        movable: true,
      },
      /* wwEditor:start */
      propertyHelp: {
        tooltip: "Define cross-field validation rules. Each group has a formula (true = valid), an error message, and a list of field IDs to highlight.",
      },
      /* wwEditor:end */
    },

    // ==========================================
    // STYLE - Layout
    // ==========================================
    formLayout: {
      label: { en: "Layout" },
      type: "TextSelect",
      section: "style",
      options: {
        options: [
          { value: "vertical", label: "Vertical", default: true },
          { value: "inline", label: "Inline" },
        ],
      },
      defaultValue: "vertical",
      responsive: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Layout direction: vertical | inline",
      },
      /* wwEditor:end */
    },
    gap: {
      label: { en: "Gap" },
      type: "Length",
      section: "style",
      options: {
        noRange: true,
      },
      defaultValue: "16px",
      responsive: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "string",
        tooltip: "Spacing between fields (e.g., 16px)",
      },
      /* wwEditor:end */
    },

    // ==========================================
    // STYLE - Labels
    // ==========================================
    labelColor: {
      label: { en: "Label Color" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    labelFontSize: {
      label: { en: "Label Font Size" },
      type: "Length",
      section: "style",
      options: {
        unitChoices: [
          { value: "px", label: "px", min: 1, max: 100, default: true },
          { value: "em", label: "em", min: 0, max: 10, digits: 3, step: 0.1 },
          { value: "rem", label: "rem", min: 0, max: 10, digits: 3, step: 0.1 },
        ],
        noRange: true,
      },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },

    // ==========================================
    // STYLE - Inputs
    // ==========================================
    inputBackgroundColor: {
      label: { en: "Background" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputBorderColor: {
      label: { en: "Border Color" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputBorderRadius: {
      label: { en: "Border Radius" },
      type: "Length",
      section: "style",
      options: { noRange: true },
      defaultValue: "4px",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputPadding: {
      label: { en: "Padding" },
      type: "Length",
      section: "style",
      options: { noRange: true },
      defaultValue: "8px",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputFontSize: {
      label: { en: "Font Size" },
      type: "Length",
      section: "style",
      options: {
        unitChoices: [
          { value: "px", label: "px", min: 1, max: 100, default: true },
          { value: "em", label: "em", min: 0, max: 10, digits: 3, step: 0.1 },
          { value: "rem", label: "rem", min: 0, max: 10, digits: 3, step: 0.1 },
        ],
        noRange: true,
      },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputTextColor: {
      label: { en: "Text Color" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    inputFocusBorderColor: {
      label: { en: "Focus Border Color" },
      type: "Color",
      section: "style",
      defaultValue: "#3b82f6",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },

    // ==========================================
    // STYLE - Dirty Fields
    // ==========================================
    showOriginalValue: {
      label: { en: "Show original value" },
      type: "OnOff",
      section: "style",
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        type: "boolean",
        tooltip: "Show the original value below modified fields",
      },
      propertyHelp: {
        tooltip:
          "When a field is modified from its initial value, display the original value underneath.",
      },
      /* wwEditor:end */
    },
    dirtyBackgroundColor: {
      label: { en: "Modified field background" },
      type: "Color",
      section: "style",
      defaultValue: "#fefce8",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
      /* wwEditor:start */
      propertyHelp: {
        tooltip:
          "Background color applied to fields that have been modified from their initial value.",
      },
      /* wwEditor:end */
    },
    originalValueColor: {
      label: { en: "Original value color" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      defaultValue: "#9ca3af",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
      hidden: (content) => !content?.showOriginalValue,
    },
    originalValueFontSize: {
      label: { en: "Original value font size" },
      type: "Length",
      section: "style",
      options: {
        unitChoices: [
          { value: "px", label: "px", min: 1, max: 100, default: true },
          { value: "em", label: "em", min: 0, max: 10, digits: 3, step: 0.1 },
          { value: "rem", label: "rem", min: 0, max: 10, digits: 3, step: 0.1 },
        ],
        noRange: true,
      },
      defaultValue: "12px",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
      hidden: (content) => !content?.showOriginalValue,
    },

    // ==========================================
    // STYLE - Display Mode
    // ==========================================
    displayValueColor: {
      label: { en: "Value Color" },
      type: "Color",
      section: "style",
      options: { nullable: true },
      defaultValue: "#111827",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    displayValueFontSize: {
      label: { en: "Value Font Size" },
      type: "Length",
      section: "style",
      options: {
        unitChoices: [
          { value: "px", label: "px", min: 1, max: 100, default: true },
          { value: "em", label: "em", min: 0, max: 10, digits: 3, step: 0.1 },
          { value: "rem", label: "rem", min: 0, max: 10, digits: 3, step: 0.1 },
        ],
        noRange: true,
      },
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },

    // ==========================================
    // STYLE - Errors
    // ==========================================
    errorColor: {
      label: { en: "Error Color" },
      type: "Color",
      section: "style",
      defaultValue: "#f44336",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
    },
    errorBackgroundColor: {
      label: { en: "Error Background" },
      type: "Color",
      section: "style",
      defaultValue: "#ffdddd",
      responsive: true,
      bindable: true,
      states: true,
      classes: true,
      /* wwEditor:start */
      propertyHelp: {
        tooltip:
          "Background color for fields with validation errors.",
      },
      /* wwEditor:end */
    },
  },
};
