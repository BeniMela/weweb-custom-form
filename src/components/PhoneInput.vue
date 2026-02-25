<template>
  <div
    ref="containerRef"
    class="ww-phone-input"
    :class="{
      'ww-phone-input--disabled': disabled,
      'ww-phone-input--readonly': readonly,
    }"
  >
    <!-- Country selector button -->
    <button
      type="button"
      class="ww-phone-input-country"
      :disabled="disabled || readonly"
      @click="toggleDropdown"
      @focus="$emit('focus')"
    >
      <span class="ww-phone-input-flag">{{ countryFlag }}</span>
      <span class="ww-phone-input-dial">+{{ dialCode }}</span>
      <svg class="ww-phone-input-caret" width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Number input -->
    <input
      type="tel"
      class="ww-phone-input-number"
      :value="nationalInput"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="handleNumberInput($event.target.value)"
      @focus="$emit('focus')"
      @blur="handleBlur"
    />

    <!-- Country dropdown -->
    <div v-if="isDropdownOpen" class="ww-phone-input-dropdown">
      <input
        class="ww-phone-input-search"
        type="text"
        :value="countrySearch"
        placeholder="Rechercher un pays..."
        @input="countrySearch = $event.target.value"
        @click.stop
      />
      <div class="ww-phone-input-country-list">
        <div
          v-for="country in filteredCountries"
          :key="country.code"
          class="ww-phone-input-country-option"
          :class="{ 'ww-phone-input-country-option--selected': country.code === selectedCountry }"
          @mousedown.prevent="selectCountry(country.code)"
        >
          <span class="ww-phone-input-option-flag">{{ country.flag }}</span>
          <span class="ww-phone-input-option-name">{{ country.name }}</span>
          <span class="ww-phone-input-option-dial">+{{ country.dialCode }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { parsePhoneNumber, getCountries, getCountryCallingCode, isValidPhoneNumber, AsYouType } from "libphonenumber-js/min";

function countryToFlag(isoCode) {
  try {
    return [...isoCode.toUpperCase()]
      .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
      .join("");
  } catch (e) {
    return isoCode;
  }
}

export default {
  name: "PhoneInput",
  props: {
    modelValue: { type: String, default: "" },
    defaultCountry: { type: String, default: "FR" },
    placeholder: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    storeFormat: { type: String, default: "e164" },
    lang: { type: String, default: "fr" },
  },
  emits: ["update:modelValue", "focus", "blur"],
  setup(props, { emit }) {
    const containerRef = ref(null);
    const selectedCountry = ref(props.defaultCountry || "FR");
    const nationalInput = ref("");
    const isDropdownOpen = ref(false);
    const countrySearch = ref("");

    // Build country list once
    const allCountries = computed(() => {
      let displayNames = null;
      try {
        displayNames = new Intl.DisplayNames([props.lang === "fr" ? "fr" : "en"], { type: "region" });
      } catch (e) { /* ignore */ }

      return getCountries()
        .map((code) => ({
          code,
          name: displayNames ? (displayNames.of(code) || code) : code,
          dialCode: getCountryCallingCode(code),
          flag: countryToFlag(code),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    const filteredCountries = computed(() => {
      const q = countrySearch.value.toLowerCase().trim();
      if (!q) return allCountries.value;
      return allCountries.value.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          String(c.dialCode).includes(q)
      );
    });

    const countryFlag = computed(() => countryToFlag(selectedCountry.value));
    const dialCode = computed(() => {
      try { return getCountryCallingCode(selectedCountry.value); } catch (e) { return ""; }
    });

    function parseIncoming(value) {
      if (!value) { nationalInput.value = ""; return; }
      try {
        const parsed = parsePhoneNumber(String(value), selectedCountry.value);
        if (parsed) {
          selectedCountry.value = parsed.country || props.defaultCountry;
          nationalInput.value = parsed.formatNational();
          return;
        }
      } catch (e) { /* ignore */ }
      nationalInput.value = String(value);
    }

    function computeOutput() {
      const raw = nationalInput.value.trim();
      if (!raw) return "";
      if (props.storeFormat === "raw" || props.storeFormat === "national") return raw;
      try {
        const phone = parsePhoneNumber(raw, selectedCountry.value);
        if (phone) return phone.format("E.164");
      } catch (e) { /* ignore */ }
      return raw;
    }

    function handleNumberInput(raw) {
      const formatter = new AsYouType(selectedCountry.value);
      nationalInput.value = formatter.input(raw);
      emit("update:modelValue", computeOutput());
    }

    function handleBlur() {
      isDropdownOpen.value = false;
      emit("blur");
    }

    function toggleDropdown() {
      if (props.disabled || props.readonly) return;
      isDropdownOpen.value = !isDropdownOpen.value;
      if (isDropdownOpen.value) countrySearch.value = "";
    }

    function selectCountry(code) {
      selectedCountry.value = code;
      isDropdownOpen.value = false;
      countrySearch.value = "";
      emit("update:modelValue", computeOutput());
    }

    // Click outside to close dropdown
    function handleClickOutside(e) {
      const doc = (typeof wwLib !== "undefined" ? wwLib.getFrontDocument() : null) || document;
      const el = containerRef.value;
      if (el && !el.contains(e.target)) {
        isDropdownOpen.value = false;
      }
    }

    onMounted(() => {
      parseIncoming(props.modelValue);
      const doc = (typeof wwLib !== "undefined" ? wwLib.getFrontDocument() : null) || document;
      doc.addEventListener("mousedown", handleClickOutside);
    });

    onBeforeUnmount(() => {
      const doc = (typeof wwLib !== "undefined" ? wwLib.getFrontDocument() : null) || document;
      doc.removeEventListener("mousedown", handleClickOutside);
    });

    watch(
      () => props.modelValue,
      (val) => {
        // Only re-parse if the value changed externally (not from our own emit)
        const current = computeOutput();
        if (val !== current) parseIncoming(val);
      }
    );

    watch(
      () => props.defaultCountry,
      (val) => {
        if (val && !nationalInput.value) selectedCountry.value = val;
      }
    );

    return {
      containerRef,
      selectedCountry,
      nationalInput,
      isDropdownOpen,
      countrySearch,
      countryFlag,
      dialCode,
      filteredCountries,
      handleNumberInput,
      handleBlur,
      toggleDropdown,
      selectCountry,
    };
  },
};
</script>

