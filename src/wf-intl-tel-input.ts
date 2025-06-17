import { getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";
import intlTelInput from "intl-tel-input";

const errorMap = [
  "Invalid number",
  "Invalid country code",
  "Too short",
  "Too long",
  "Invalid number",
];

const takeLenisScrollIntoAccount = () => {
  const allItiDropdowns = getMultipleHtmlElements({ selector: ".iti__dropdown-content" });

  if (!allItiDropdowns) return;

  for (const dropdown of allItiDropdowns) {
    dropdown.setAttribute("data-lenis-prevent", "");
  }
};

const initIntlTelInputs = () => {
  const intlTelInputElements = getMultipleHtmlElements<HTMLInputElement>({
    selector: "[data-phone-input]",
  });

  if (!intlTelInputElements) return;

  for (const input of intlTelInputElements) {
    const iti = intlTelInput(input, {
      loadUtils: () =>
        import(
          `https://cdn.jsdelivr.net/npm/intl-tel-input@${intlTelInput.version}/build/js/utils.js`
        ),
      strictMode: true,
      separateDialCode: true,
      initialCountry: "ae",
    });

    const inputParentForm = input.closest<HTMLFormElement>("form");

    if (!inputParentForm) continue;

    const submitButtonOriginal = getHtmlElement<HTMLButtonElement>({
      selector: "button[type=submit], input[type=submit], [data-tform-submit=true]",
      parent: inputParentForm,
    });

    if (!submitButtonOriginal) continue;

    const submitButton = submitButtonOriginal.cloneNode(true) as HTMLButtonElement;

    submitButtonOriginal.parentNode?.replaceChild(submitButton, submitButtonOriginal);

    const errorElement = getHtmlElement({
      selector: "[data-phone-error]",
      parent: inputParentForm,
    });

    if (errorElement) errorElement.style.display = "none";

    const hubSpotFieldName = input.dataset.wfhsfieldname;

    /**
     * Insert hidden inputs
     */
    const fullPhoneNumberInput = document.createElement("input");
    const countryNameInput = document.createElement("input");

    fullPhoneNumberInput.setAttribute("tabindex", "-1");
    countryNameInput.setAttribute("tabindex", "-1");

    fullPhoneNumberInput.name = "full_phone";
    countryNameInput.name = "country_name";

    fullPhoneNumberInput.style.display = "none";
    countryNameInput.style.display = "none";

    if (hubSpotFieldName !== undefined) {
      input.removeAttribute("data-wfhsfieldname");
      fullPhoneNumberInput.setAttribute("data-wfhsfieldname", hubSpotFieldName);
    }

    inputParentForm.appendChild(fullPhoneNumberInput);
    inputParentForm.appendChild(countryNameInput);

    submitButton.type = "button";

    let hasErrorOccured: boolean = false;

    submitButton.addEventListener("click", () => {
      if (iti.isValidNumber()) {
        if (errorElement) errorElement.style.display = "none";

        const fullNumber = iti.getNumber();
        const countryName = iti.getSelectedCountryData().name;

        fullPhoneNumberInput.value = fullNumber;
        countryNameInput.value = countryName ?? "";

        submitButton.parentNode?.replaceChild(submitButtonOriginal, submitButton);
        submitButtonOriginal.click();
        return;
      }
      hasErrorOccured = true;
      if (!errorElement) return;

      const errorMessage = errorMap[iti.getValidationError()];

      if (!errorMessage) return;

      errorElement.style.display = "block";
      errorElement.innerText = errorMessage;
    });

    input.addEventListener("input", () => {
      if (!hasErrorOccured) return;

      if (iti.isValidNumber() && errorElement) {
        errorElement.style.display = "none";
        return;
      }

      if (!errorElement) return;

      const errorMessage = errorMap[iti.getValidationError()];

      if (!errorMessage) return;

      errorElement.style.display = "block";
      errorElement.innerText = errorMessage;
    });
  }

  takeLenisScrollIntoAccount();
};

initIntlTelInputs();
