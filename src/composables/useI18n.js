import { computed } from "vue";

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
    noResults: "Aucun résultat",
    loading: "Chargement...",
    selected: "sélectionné(s)",
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
    noResults: "No results",
    loading: "Loading...",
    selected: "selected",
    was: "Was:",
    submit: "Submit",
    reset: "Reset",
  },
};

export function useI18n(props) {
  const lang = computed(() => props.content?.lang || "fr");

  function t(key, params) {
    const str = translations[lang.value]?.[key] || translations.fr[key] || key;
    if (!params) return str;
    return str.replace("{n}", params.n);
  }

  return { lang, t };
}
