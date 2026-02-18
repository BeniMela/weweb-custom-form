
# CLAUDE.md - Custom Form Component

## Overview

Dynamic Form component for WeWeb with 3 modes (Edit, Add, Display), built-in validation, i18n (FR/EN), dirty field tracking, and JSON data binding.

## Development Commands

- **Install dependencies**: `npm i`
- **Serve locally**: `npm run serve --port=[PORT]`
- **Build for release**: `npm run build -- name=custom-form type=wwobject`

## Project Structure

```
custom-form/
├── package.json          # @weweb/cli only, name must NOT contain "ww"/"weweb"
├── ww-config.js          # Editor configuration (properties, triggers, actions)
├── CLAUDE.md             # This file
└── src/
    └── wwElement.vue     # Vue 3 Composition API component
```

## Component Architecture

### Modes

| Mode | Value | Description |
|------|-------|-------------|
| **Edit** | `"edit"` (default) | Modify existing data. Submit/Reset visible only when dirty. Shows original values. |
| **Add** | `"add"` | Create new entry. Submit always visible. No dirty tracking display. |
| **Display** | `"display"` | Read-only view. No form inputs, just text display. |

Backward compatible: `"form"` and `undefined` map to Edit mode.

### Field Types

`text`, `email`, `password`, `number`, `tel`, `url`, `date`, `textarea`, `select`, `checkbox`, `radio`

### Internal Variables (exposed to WeWeb workflows)

| Variable | Type | Description |
|----------|------|-------------|
| `formData` | object | Current form values `{ fieldId: value }` |
| `errors` | object | Current validation errors `{ fieldId: "message" }` |
| `isValid` | boolean | Whether the form has no errors |
| `isDirty` | boolean | Whether any field has been modified |
| `touchedFields` | array | List of field IDs that have been focused |
| `originalValues` | object | Original values before modification `{ fieldId: value }` |

### Trigger Events

| Event | Payload | Description |
|-------|---------|-------------|
| `submit` | `{ mode, formData, originalValues, changedFields, isValid }` | Form submitted (only fires if valid) |
| `field-change` | `{ fieldId, value, formData }` | A field value changed |
| `validation-error` | `{ fieldId, error, formData }` | First validation error after validateAll |
| `reset` | `{ formData }` | Form was reset |
| `field-focus` | `{ fieldId }` | A field received focus |
| `field-blur` | `{ fieldId, value }` | A field lost focus |
| `data-loaded` | `{ formData }` | initialData was applied |

**Submit event `changedFields` format:**
```javascript
{
  fieldId: {
    oldValue: "original",
    newValue: "modified"
  }
}
```

### Actions (callable from WeWeb workflows)

| Action | Args | Description |
|--------|------|-------------|
| `resetForm` | none | Reset to initial values |
| `setFieldValue` | `(fieldId, value)` | Set a specific field's value |
| `validate` | none | Run validation on all fields |
| `setFieldError` | `(fieldId, error)` | Manually set an error on a field |
| `clearErrors` | none | Clear all validation errors |
| `loadData` | `(data)` | Load a JSON object into the form |

### Validation Types

`none`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`

Validation messages support custom text per field. Default messages use the selected language (FR/EN).

### i18n - Language Support

Property `lang` (TextSelect, bindable): `"fr"` (default) or `"en"`

Translated strings: required, emailInvalid, minLength, maxLength, minValue, maxValue, patternInvalid, selectPlaceholder, was, submit, reset.

### Data Binding & Field Generation

1. **initialData** (RawObject, bindable): JSON object to pre-fill the form
2. **autoGenerateFields** (OnOff): Auto-create fields from JSON keys
3. **generateFieldsButton** (editor-only): "Generate fields from data" button that flattens nested JSON into dot-path fields
4. **defaultValue** on each field: Can be a dot-path into initialData (e.g., `user.address.city`)
5. **Formula properties**: `fieldsIdFormula`, `fieldsLabelFormula`, `fieldsTypeFormula`, `fieldsPlaceholderFormula`, `fieldsRequiredFormula`, `fieldsOptionsFormula`, `fieldsDefaultValueFormula` for mapping when fields array is bound

### Dirty Field Tracking (Edit mode only)

- `isFieldDirty(fieldId)` compares current vs original values
- Dirty fields get `--ww-form-dirty-bg` background (default: `#fefce8`)
- Original value shown below the input: "Etait : ..." / "Was: ..."
- `showOriginalValue` toggle in style settings
- Fields with errors get `--ww-form-error-bg` background (default: `#ffdddd`)

### Button Behavior

- **Edit mode**: Submit and Reset visible **only when `hasAnyDirty`**
- **Add mode**: Submit and Reset **always visible**
- **Submit disabled** when `hasErrors` is true (grayed out, `cursor: not-allowed`)
- Submit only fires trigger event if validation passes

### Style Properties (all configurable in editor)

**Layout**: `formLayout` (vertical/inline), `gap`
**Labels**: `labelColor`, `labelFontSize`
**Inputs**: `inputBackgroundColor`, `inputBorderColor`, `inputBorderRadius`, `inputPadding`, `inputFontSize`, `inputTextColor`, `inputFocusBorderColor`
**Dirty Fields**: `showOriginalValue`, `dirtyBackgroundColor`, `originalValueColor`, `originalValueFontSize`
**Display Mode**: `displayValueColor`, `displayValueFontSize`
**Errors**: `errorColor` (default: `#f44336`), `errorBackgroundColor` (default: `#ffdddd`)

All style properties use CSS variables on the root element via computed `rootStyle`.

## Key Implementation Patterns

### Optional Chaining (MANDATORY)

```javascript
// ALWAYS use optional chaining for all props.content access
props.content?.mode
props.content?.fields
props.content?.initialData
```

### Field Processing with Formula Mapping

```javascript
const processedFields = computed(() => {
  // ... resolve manual fields, auto-generated fields, or display mode fields
  return fields.map((field, index) => {
    const id = resolveMappingFormula(props.content?.fieldsIdFormula, field) ?? field?.id ?? `field-${index}`;
    // ... same pattern for label, type, placeholder, required, options, defaultValue
    return { id, label, type, ... };
  });
});
```

### Dot-Path Resolution for initialData

```javascript
function resolvePathValue(obj, path) {
  const parts = String(path).split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}
```

### Generate Fields from JSON (editor-only)

```javascript
/* wwEditor:start */
function generateFields() {
  // Flatten nested JSON into dot-path entries
  // Each entry becomes a field with defaultValue = dot-path
  ctx.emit("update:content", { fields });
}
/* wwEditor:end */
```

### CSS Variables via rootStyle

```javascript
const rootStyle = computed(() => ({
  "--ww-form-gap": props.content?.gap || "16px",
  "--ww-form-label-color": props.content?.labelColor || "#374151",
  // ... all style properties mapped to CSS variables
}));
```

## WeWeb Critical Requirements

- **Optional chaining** (`?.`) on ALL `props.content` references
- **`/* wwEditor:start */` / `/* wwEditor:end */`** blocks for editor-only code
- **NO hardcoded dimensions** on root element
- **NO direct `document`/`window`** access - use `wwLib.getFrontDocument()` / `wwLib.getFrontWindow()`
- **NO build config files** - only `@weweb/cli` as devDependency
- **Package name** must NOT contain "ww" or "weweb"
- **Emits**: `"trigger-event"` for events, `"update:content:effect"` for side effects, `"update:content"` for editor content updates
- **Internal variables**: `wwLib.wwVariable.useComponentVariable({ uid: props.uid, name, type, defaultValue, readonly: true })`
- **Formula mapping**: `wwLib.wwFormula.useFormula()` + `resolveMappingFormula()`

## Color Palette Reference

| Name | Hex |
|------|-----|
| Error light | `#ffdddd` |
| Error strong | `#f44336` |
| Grey dark | `#172739` |
| Grey light | `#d6d9db` |
| Grey light inactive | `#b5bcc5` |
| Grey medium | `#5e6775` |
| Orange light | `#FDDCAA` |
| Orange strong | `#ff7f00` |
| Placeholder text | `#000000ad` |
| Primary | `#0069e3` |
| Primary light | `#c4caf7` |
| Success light | `#ddffdd` |
| Success strong | `#4CAF50` |
| Transparent | `#1470AF00` |
| Warning light | `#ffffcc` |
| Warning strong | `#ffeb3b` |
