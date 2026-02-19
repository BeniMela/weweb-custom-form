import { computed } from "vue";

export function useStyles(props) {
  const rootStyle = computed(() => ({
    "--ww-form-gap": props.content?.gap || "16px",
    "--ww-form-label-color": props.content?.labelColor || "#374151",
    "--ww-form-label-font-size": props.content?.labelFontSize || "14px",
    "--ww-form-input-bg": props.content?.inputBackgroundColor || "#ffffff",
    "--ww-form-input-border":
      props.content?.inputBorderColor || "#d1d5db",
    "--ww-form-input-radius":
      props.content?.inputBorderRadius || "8px",
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

  return { rootStyle, formClasses };
}
