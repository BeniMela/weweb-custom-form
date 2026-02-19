<template>
  <div ref="containerRef" class="ww-search-select" :class="containerClasses">
    <!-- Control -->
    <div class="ww-search-select-control ww-form-input" :class="[{ 'ww-search-select-control--open': isOpen }, inputClass]">
      <!-- Selected label (shown when not searching) -->
      <span v-if="hasSelection && !isSearching" class="ww-search-select-label">
        {{ modelValue.label }}
      </span>
      <!-- Search input -->
      <input
        ref="inputRef"
        type="text"
        class="ww-search-select-input"
        :class="{ 'ww-search-select-input--hidden': hasSelection && !isSearching }"
        :value="query"
        :placeholder="hasSelection ? '' : placeholder"
        :disabled="disabled"
        :readonly="readonly"
        autocomplete="off"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput($event.target.value)"
        @keydown="handleKeydown"
        @mousedown.stop="handleClick"
      />
      <!-- Clear -->
      <button
        v-if="hasSelection && !disabled && !readonly"
        type="button"
        class="ww-search-select-clear"
        tabindex="-1"
        @mousedown.prevent="clearSelection"
      >×</button>
      <!-- Arrow -->
      <div v-if="!disabled && !readonly" class="ww-search-select-arrow" :class="{ 'ww-search-select-arrow--open': isOpen }">
        <svg width="12" height="12" viewBox="0 0 12 12"><path fill="currentColor" d="M3 5l3 3 3-3" /></svg>
      </div>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="ww-search-select-list" ref="listRef">
      <!-- Loading -->
      <div v-if="isLoading" class="ww-search-select-loading">
        <span class="ww-search-select-spinner" />
        {{ loadingText }}
      </div>
      <!-- Results -->
      <template v-else>
        <div
          v-for="(opt, i) in options"
          :key="opt.value"
          ref="optionRefs"
          class="ww-search-select-option"
          :class="{
            'ww-search-select-option--selected': hasSelection && modelValue.value === opt.value,
            'ww-search-select-option--highlighted': highlightedIndex === i,
          }"
          @mousedown.prevent="selectOption(opt)"
          @mouseenter="highlightedIndex = i"
        >
          {{ opt.label }}
        </div>
        <div v-if="options.length === 0 && !isLoading" class="ww-search-select-empty">
          {{ query ? noResultsText : placeholder }}
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from "vue";

export default {
  props: {
    modelValue: { type: Object, default: null },   // { value, label } or null
    options: { type: Array, default: () => [] },   // [{ value, label }] from external source
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    debounce: { type: Number, default: 300 },
    noResultsText: { type: String, default: "No results" },
    loadingText: { type: String, default: "Loading..." },
    inputClass: { type: [String, Object, Array], default: null },
  },
  emits: ["update:modelValue", "search", "focus", "blur"],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const isSearching = ref(false);
    const query = ref("");
    const highlightedIndex = ref(-1);
    const isLoading = ref(false);

    const containerRef = ref(null);
    const inputRef = ref(null);
    const listRef = ref(null);
    const optionRefs = ref([]);

    let debounceTimer = null;

    const hasSelection = computed(() =>
      props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue.value !== undefined &&
      props.modelValue.value !== ""
    );

    const containerClasses = computed(() => ({
      "ww-search-select--disabled": props.disabled,
      "ww-search-select--readonly": props.readonly,
    }));

    function selectOption(opt) {
      if (props.disabled || props.readonly) return;
      emit("update:modelValue", { value: opt.value, label: opt.label });
      closeDropdown();
    }

    function clearSelection() {
      emit("update:modelValue", null);
      query.value = "";
      isLoading.value = false;
    }

    function handleFocus() {
      emit("focus");
    }

    function handleBlur(e) {
      if (containerRef.value?.contains(e.relatedTarget)) return;
      closeDropdown();
      emit("blur");
    }

    function handleClick() {
      if (props.disabled || props.readonly) return;
      if (!isOpen.value) openDropdown();
    }

    function openDropdown() {
      isOpen.value = true;
      isSearching.value = true;
      query.value = "";
      highlightedIndex.value = -1;
      nextTick(() => inputRef.value?.focus());
    }

    function closeDropdown() {
      isOpen.value = false;
      isSearching.value = false;
      query.value = "";
      highlightedIndex.value = -1;
      isLoading.value = false;
      clearTimeout(debounceTimer);
    }

    function handleInput(value) {
      query.value = value;
      isSearching.value = true;
      if (!isOpen.value) isOpen.value = true;
      highlightedIndex.value = -1;

      clearTimeout(debounceTimer);

      if (!value) {
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      debounceTimer = setTimeout(() => {
        emit("search", value);
      }, props.debounce);
    }

    // When options arrive from parent, stop loading and update highlight
    watch(() => props.options, () => {
      isLoading.value = false;
      if (isOpen.value) {
        highlightedIndex.value = props.options.length > 0 ? 0 : -1;
      }
    });

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
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, props.options.length - 1);
        scrollToHighlighted();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
        scrollToHighlighted();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex.value >= 0 && highlightedIndex.value < props.options.length) {
          selectOption(props.options[highlightedIndex.value]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
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
      isOpen, isSearching, query, highlightedIndex, isLoading,
      containerRef, inputRef, listRef, optionRefs,
      hasSelection, containerClasses,
      selectOption, clearSelection,
      handleFocus, handleBlur, handleClick,
      handleInput, handleKeydown,
    };
  },
};
</script>

<style lang="scss" scoped>
@import "../styles/search-select.scss";
</style>
