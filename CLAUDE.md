
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
    ├── wwElement.vue     # Entry point: template, setup orchestration, scoped style import
    ├── composables/
    │   ├── index.js          # Barrel re-exports
    │   ├── useI18n.js        # Translations (FR/EN) + t() function
    │   ├── useFields.js      # Field processing, auto-generate, formula mapping
    │   ├── useFormState.js   # State, validation, dirty tracking, handlers, actions, watchers
    │   └── useStyles.js      # rootStyle + formClasses computed
    ├── components/
    │   ├── SmartSelect.vue   # Smart select: button group (≤ threshold) or searchable dropdown (> threshold)
    │   └── SearchSelect.vue  # External search: debounce → search-query event → bound options → { value, label }
    ├── utils/
    │   └── helpers.js        # Pure functions (no Vue, no WeWeb): parseOptions, isInputType, etc.
    └── styles/
        ├── form.scss         # Main form styles (imported as scoped in wwElement.vue)
        ├── smart-select.scss # SmartSelect styles (imported as scoped in SmartSelect.vue)
        └── search-select.scss # SearchSelect styles (imported as scoped in SearchSelect.vue)
```

### Architecture

**Pure utils** (`utils/helpers.js`) — stateless functions shared across composables and template:
`isInputType`, `parseOptions`, `getOptionLabel`, `formatDisplayValue`, `inferFieldType`, `formatFieldLabel`, `resolvePathValue`

**Composables** (`composables/`) — Vue 3 composition functions:
- **`useI18n(props)`** → `{ t }` — translations keyed by `props.content?.lang`
- **`useFields(props, { isDisplayMode })`** → `{ processedFields, getDefaultValues }` — field resolution with formula mapping
- **`useFormState(props, ctx, { processedFields, getDefaultValues, isReadOnly, t })`** → state refs, validation, dirty tracking, event handlers, WeWeb actions
- **`useStyles(props)`** → `{ rootStyle, formClasses }` — CSS variable mapping

**Styles** (`styles/form.scss`) — all SCSS imported via `@import` in wwElement.vue's scoped style block.

Mode computeds (`isDisplayMode`, `isAddMode`, `isEditMode`, `isReadOnly`) are defined in `wwElement.vue` setup.
Editor-only code (`generateFields`, `isEditing`) stays in `wwElement.vue` inside `/* wwEditor:start/end */` blocks.

## Component Architecture

### Modes

| Mode | Value | Description |
|------|-------|-------------|
| **Edit** | `"edit"` (default) | Modify existing data. Submit/Reset visible only when dirty. Shows original values. |
| **Add** | `"add"` | Create new entry. Submit always visible. No dirty tracking display. |
| **Display** | `"display"` | Read-only view. No form inputs, just text display. |

Backward compatible: `"form"` and `undefined` map to Edit mode.

### Field Types

`text`, `email`, `password`, `number`, `tel`, `url`, `date`, `textarea`, `select`, `checkbox`, `radio`, `search`, `section`

**`section`** — Visual separator with optional title and a horizontal line. No value in `formData`. Set `label` to the section title (e.g. "Localisation"), leave empty for a plain divider. Width `full` spans the whole row.

### Per-field Read Only & Show Label

- **`readOnly` (OnOff, default `false`)** — Makes the field read-only regardless of the global `readOnly` prop. Applies `disabled` + `readonly` HTML attributes and the `ww-form-input--readonly` CSS class. The field value is preserved in `formData` but cannot be edited. Global `isReadOnly` OR `field.readOnly` makes a field readonly.
- **`showLabel` (OnOff, default `true`)** — Controls whether the field label is rendered. When `false`, the label element is not rendered at all (no empty space). For checkboxes, also hides the inline label text.

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
| `search-query` | `{ fieldId, query }` | User typed in external search field |

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
| `loadData` | `(data)` | Load a JSON object into the form — sets values AND originalValues (dirty tracking baseline) |
| `setSearchResults` | `(fieldId, results)` | Inject search results for a `search` field (no external variable needed) |

### Validation Types

`none`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`

Validation messages support custom text per field. Default messages use the selected language (FR/EN).

**`validationValue`** is bindable — use a formula for dynamic validation. Example: bind `pattern` validationValue to `formData.cou_countries_id.cou_iso_code` to build a dynamic regex like `^FR`.

### i18n - Language Support

Property `lang` (TextSelect, bindable): `"fr"` (default) or `"en"`

Translated strings: required, emailInvalid, minLength, maxLength, minValue, maxValue, patternInvalid, selectPlaceholder, noResults, loading, selected, was, submit, reset.

### Data Binding & Field Generation

1. **initialData** (RawObject, bindable): JSON object to pre-fill the form
2. **autoGenerateFields** (OnOff): Auto-create fields from JSON keys
3. **generateFieldsButton** (editor-only): "Generate fields from data" button that flattens nested JSON into dot-path fields
4. **defaultValue** on each field: Can be a dot-path into initialData (e.g., `user.address.city`)

**Recommended pattern for Add vs Edit modes:**
Use the `loadData` action instead of `defaultValue` when values depend on context (mode, external data, etc.).
`loadData` sets both the field values AND the `originalValues` baseline for dirty tracking.
```
On page load
  → If mode = edit : loadData(myRecord)   // pre-fills + sets dirty baseline
  → If mode = add  : loadData({})          // empty form, no dirty baseline
```
For `search` fields: pass the full raw object (not just the id) so the label displays correctly:
```javascript
loadData({ cou_countries_id: { id: 63, cou_label_fr: "France", cou_iso_code: "FR" } })
```
5. **Formula properties**: `fieldsIdFormula`, `fieldsLabelFormula`, `fieldsTypeFormula`, `fieldsPlaceholderFormula`, `fieldsRequiredFormula`, `fieldsOptionsFormula`, `fieldsOptionsValueFormula`, `fieldsOptionsLabelFormula`, `fieldsOptionsThresholdFormula`, `fieldsMultipleFormula`, `fieldsSearchDebounceFormula`, `fieldsDefaultValueFormula`, `fieldsValidationValueFormula` for mapping when fields array is bound

### Select/Radio — SmartSelect Component

Both `select` and `radio` field types use the `SmartSelect` component (`src/components/SmartSelect.vue`) which adapts its UI based on the number of options:

- **≤ threshold** (default 10): **Button group (toggle)** — buttons side by side, selected option highlighted with accent color. Multiple selection: clicking toggles the value in/out of the array.
- **> threshold**: **Searchable dropdown** — input control that shows the selected label, opens a dropdown list with case-insensitive search, keyboard navigation (↑↓ Enter Escape Backspace), click outside to close, scroll to highlighted option, × button to clear.

Per-field property `optionsThreshold` (Number, default 10) controls the cutoff. Formula: `fieldsOptionsThresholdFormula`.

### Select — Multi

**`multiple` (OnOff, default false)** — Available on `select` fields. Allow selecting multiple values. The field value is stored as an array `[]`. `getDefaultValues` returns `[]` for `multiple` fields. The dropdown stays open after each selection. Backspace removes the last value when the search input is empty. Formula: `fieldsMultipleFormula`.

### Search — External Search Type

The `search` field type uses the `SearchSelect` component (`src/components/SearchSelect.vue`). It is purpose-built for API-driven search:

- Always in dropdown mode (no button group — the option list is not known in advance)
- User types → debounce delay (`searchDebounce` ms, default 300) → `search-query` trigger event fires with `{ fieldId, query }`
- Results injected via action `setSearchResults(fieldId, results)` — no external variable needed
- Selecting an option stores an object `{ value, label }` (not a primitive) — this avoids needing to re-fetch the label after selection
- Clear button sets value to `null`
- Loading spinner shown while user has typed and results have not yet arrived
- Keyboard navigation: ↑↓ Enter Escape
- Click outside closes the dropdown

**Recommended workflow (no external variable required):**
```
On Search Query
  → quick_search workflow (API call with event.query, event.fieldId)
  → [composant].setSearchResults(event.fieldId, résultat_api)
```

**Stored value format (in `formData`):** the **full raw object** (e.g. `{ id: 17, cou_label_fr: "Bangladesh", ... }`), or `null`. Not `{ value, label }`.

**IMPORTANT — default value must be `null`**: The `getDefaultValues()` function returns `null` for `search` fields. The `processedFields` watcher preserves `null` and only keeps current value if it's a valid object with the `searchValueKey` property. This prevents the `Invalid prop: Expected Object, got String ""` Vue warning on `SearchSelect`'s `modelValue` prop.

**`searchDebounce` (Number, default 300ms)** — Delay in ms before firing the `search-query` event after typing (0–2000ms). Formula: `fieldsSearchDebounceFormula`.

**`searchValueKey` (Text, default `"id"`)** — Key from the raw result object used as the identity value (for dirty tracking, required validation, and deduplication). Formula: `fieldsSearchValueKeyFormula`.

**`searchLabelTemplate` (Text, default `""`)** — Template string to build the displayed label using `{field}` placeholders. e.g. `"{cou_label_fr} ({cou_iso_code})"`. If empty, falls back to the `searchValueKey` value as label. Formula: `fieldsSearchLabelTemplateFormula`.

**Mapping logic:**
- `setSearchResults(fieldId, rawArray)` stores raw objects in `searchResults` ref
- `searchOptionsMap` (computed) maps raw items to `{ value, label }` via `mapSearchItem(item, field)` for `SearchSelect` display
- On selection, `handleSearchSelect(field, { value, label })` looks up the raw item in `searchResults` by `searchValueKey` and stores the full raw object in `formData`
- `getSearchModelValue(field)` derives `{ value, label }` from the stored raw object for `SearchSelect`'s `modelValue`
- `getSearchDisplayLabel(field)` builds the label from the stored raw object for display mode and dirty tracking

**`search-query` trigger event** — `{ fieldId: string, query: string }` — fired after debounce when user types in a `search` field.

**Display mode:** Shows `formDataValues[field.id]?.label ?? formDataValues[field.id]?.value ?? '—'`

**Dirty tracking:** Compares by `.value` property (not object reference).

**Required validation:** Valid only when `value?.value` is truthy.

### Select/Radio Options Binding

Options for `select` and `radio` fields support bound arrays of objects with custom key mapping:

1. **Per-field keys** (manual fields): `optionsValueKey` (default: `"value"`) and `optionsLabelKey` (default: `"label"`) on each field definition
2. **Formula mapping** (bound fields): `fieldsOptionsValueFormula` and `fieldsOptionsLabelFormula` resolve keys dynamically
3. **Fallback chain**: formula result → per-field key → defaults (`"value"` / `"label"`) → fallback to `id`/`name` properties
4. `parseOptions(options, valueKey, labelKey)` handles both array-of-objects and comma-separated strings

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
**Inputs**: `inputBackgroundColor`, `inputBorderColor`, `inputBorderRadius` (default: `8px`), `inputPadding`, `inputFontSize`, `inputTextColor`, `inputFocusBorderColor`
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
