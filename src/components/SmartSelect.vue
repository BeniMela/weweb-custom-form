<template>
  <!-- Button group mode (few options) -->
  <div v-if="options.length <= threshold" class="ww-smart-select-buttons" :class="containerClasses">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="ww-smart-select-btn"
      :class="{ 'ww-smart-select-btn--active': isSelected(opt.value) }"
      :disabled="disabled"
      @click="toggleOption(opt.value)"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    >
      {{ opt.label }}
    </button>
  </div>

  <!-- Searchable dropdown mode (many options) -->
  <div v-else ref="containerRef" class="ww-smart-select-dropdown" :class="containerClasses">
    <div class="ww-smart-select-control ww-form-input" :class="{ 'ww-smart-select-control--open': isOpen }">
      <!-- Selected label (multi: count or single label) -->
      <template v-if="multiple && selectedValues.length > 0 && !isSearching">
        <span v-if="selectedValues.length === 1" class="ww-smart-select-single-label">
          {{ getLabel(selectedValues[0]) }}
        </span>
        <span v-else class="ww-smart-select-count">
          {{ selectedValues.length }} {{ selectedCountLabel }}
        </span>
      </template>
      <span v-else-if="!multiple && modelValue !== '' && modelValue !== null && modelValue !== undefined && !isSearching" class="ww-smart-select-single-label">
        {{ getLabel(modelValue) }}
      </span>
      <!-- Search input -->
      <input
        ref="inputRef"
        type="text"
        class="ww-smart-select-search"
        :class="{ 'ww-smart-select-search--hidden': !isSearching && hasSelection }"
        :value="searchQuery"
        :placeholder="hasSelection ? '' : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        autocomplete="off"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @input="handleSearch($event.target.value)"
        @keydown="handleKeydown"
        @mousedown.stop="handleInputClick"
      />
      <!-- Clear -->
      <button
        v-if="hasSelection && !disabled && !readonly"
        type="button"
        class="ww-smart-select-clear"
        tabindex="-1"
        @mousedown.prevent="clearSelection"
      >×</button>
      <!-- Arrow -->
      <div v-if="!disabled && !readonly" class="ww-smart-select-arrow" :class="{ 'ww-smart-select-arrow--open': isOpen }">
        <svg width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M3 5l3 3 3-3" /></svg>
      </div>
    </div>

    <!-- Dropdown list -->
    <div v-if="isOpen" class="ww-smart-select-list" ref="listRef">
      <div
        v-for="(opt, i) in filteredOptions"
        :key="opt.value"
        ref="optionRefs"
        class="ww-smart-select-option"
        :class="{
          'ww-smart-select-option--selected': isSelected(opt.value),
          'ww-smart-select-option--highlighted': highlightedIndex === i,
        }"
        @mousedown.prevent="toggleOption(opt.value)"
        @mouseenter="highlightedIndex = i"
      >
        <span v-if="multiple" class="ww-smart-select-check">
          <svg v-if="isSelected(opt.value)" width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        {{ opt.label }}
      </div>
      <div v-if="filteredOptions.length === 0" class="ww-smart-select-empty">
        {{ noResultsText }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from "vue";

export default {
  props: {
    modelValue: { type: [String, Number, Array], default: "" },
    options: { type: Array, default: () => [] },
    threshold: { type: Number, default: 10 },
    multiple: { type: Boolean, default: false },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    noResultsText: { type: String, default: "No results" },
    selectedCountLabel: { type: String, default: "selected" },
  },
  emits: ["update:modelValue", "focus", "blur"],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const searchQuery = ref("");
    const highlightedIndex = ref(-1);
    const isSearching = ref(false);

    const containerRef = ref(null);
    const inputRef = ref(null);
    const listRef = ref(null);
    const optionRefs = ref([]);

    const containerClasses = computed(() => ({
      "ww-smart-select--disabled": props.disabled,
      "ww-smart-select--readonly": props.readonly,
    }));

    const selectedValues = computed(() => {
      if (!props.multiple) return [];
      return Array.isArray(props.modelValue) ? props.modelValue : [];
    });

    const hasSelection = computed(() => {
      if (props.multiple) return selectedValues.value.length > 0;
      return props.modelValue !== "" && props.modelValue !== null && props.modelValue !== undefined;
    });

    function getLabel(value) {
      const match = props.options.find((o) => o.value === value);
      return match ? match.label : String(value);
    }

    function isSelected(value) {
      if (props.multiple) return selectedValues.value.includes(value);
      return props.modelValue === value;
    }

    const filteredOptions = computed(() => {
      if (!searchQuery.value) return props.options;
      const q = searchQuery.value.toLowerCase();
      return props.options.filter((o) => o.label.toLowerCase().includes(q));
    });

    function toggleOption(value) {
      if (props.disabled || props.readonly) return;
      if (props.multiple) {
        const vals = [...selectedValues.value];
        const idx = vals.indexOf(value);
        if (idx >= 0) vals.splice(idx, 1);
        else vals.push(value);
        emit("update:modelValue", vals);
        nextTick(() => inputRef.value?.focus());
      } else {
        emit("update:modelValue", value);
        closeDropdown();
      }
    }

    function clearSelection() {
      emit("update:modelValue", props.multiple ? [] : "");
      searchQuery.value = "";
    }

    function handleInputFocus() {
      emit("focus");
    }

    function handleInputBlur(e) {
      if (containerRef.value?.contains(e.relatedTarget)) return;
      closeDropdown();
      emit("blur");
    }

    function handleInputClick() {
      if (props.disabled || props.readonly) return;
      if (!isOpen.value) openDropdown();
    }

    function openDropdown() {
      isOpen.value = true;
      isSearching.value = true;
      searchQuery.value = "";
      highlightedIndex.value = -1;
      nextTick(() => {
        inputRef.value?.focus();
        if (!props.multiple) {
          const idx = filteredOptions.value.findIndex((o) => o.value === props.modelValue);
          if (idx >= 0) {
            highlightedIndex.value = idx;
            scrollToHighlighted();
          }
        }
      });
    }

    function closeDropdown() {
      isOpen.value = false;
      isSearching.value = false;
      searchQuery.value = "";
      highlightedIndex.value = -1;
    }

    function handleSearch(value) {
      searchQuery.value = value;
      isSearching.value = true;
      if (!isOpen.value) isOpen.value = true;
      highlightedIndex.value = filteredOptions.value.length > 0 ? 0 : -1;
    }

    function handleKeydown(e) {
      if (!isOpen.value) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
          e.preventDefault();
          openDropdown();
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1);
        scrollToHighlighted();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
        scrollToHighlighted();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
          toggleOption(filteredOptions.value[highlightedIndex.value].value);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      } else if (e.key === "Backspace" && !searchQuery.value && props.multiple) {
        const vals = [...selectedValues.value];
        if (vals.length > 0) {
          vals.pop();
          emit("update:modelValue", vals);
        }
      }
    }

    function scrollToHighlighted() {
      nextTick(() => {
        const el = optionRefs.value?.[highlightedIndex.value];
        if (el) el.scrollIntoView({ block: "nearest" });
      });
    }

    function handleClickOutside(e) {
      if (containerRef.value && !containerRef.value.contains(e.target)) {
        closeDropdown();
      }
    }

    let cleanupClickOutside = null;
    watch(isOpen, (open) => {
      if (open) {
        const doc = typeof wwLib !== "undefined" ? wwLib.getFrontDocument() : document;
        doc.addEventListener("mousedown", handleClickOutside);
        cleanupClickOutside = () => doc.removeEventListener("mousedown", handleClickOutside);
      } else if (cleanupClickOutside) {
        cleanupClickOutside();
        cleanupClickOutside = null;
      }
    });

    return {
      isOpen, searchQuery, highlightedIndex, isSearching,
      containerRef, inputRef, listRef, optionRefs,
      containerClasses, selectedValues, hasSelection, filteredOptions,
      getLabel, isSelected, toggleOption, clearSelection,
      handleInputFocus, handleInputBlur, handleInputClick,
      handleSearch, handleKeydown,
    };
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/smart-select.scss";
</style>
