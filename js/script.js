'use strict'
const form = document.querySelector('.form');
const phone = document.querySelector('#phone');
const inputs = document.querySelectorAll('.form__input');
const showPasswordButtons = document.querySelectorAll('.form__password-visibility-toggle');
let timeout;

form.addEventListener('submit', validateForm);
phone.addEventListener('input', formatPhoneNumber);
inputs.forEach((item) => item.addEventListener('focus', setPasswordRulesVisibility));
inputs.forEach((item) => item.addEventListener('blur', validateInput));
inputs.forEach((item) => item.addEventListener('input', validateInput));
showPasswordButtons.forEach((item) => item.addEventListener('click', togglePasswordVisibility));

const errorMessages = {
  'first-name': {
    valueMissing: 'Please enter your first name',
  },
  'last-name': {
    valueMissing: 'Please enter your last name',
  },
  'email': {
    valueMissing: 'Please enter your email address',
    typeMismatch: 'Please enter a valid email address',
    patternMismatch: 'Please enter a valid email address',
  },
  'phone': {
    patternMismatch: 'Phone numbers must be 10 digits',
  },
  'password': {
    valueMissing: 'Please enter a strong password',
    patternMismatch: 'Please enter a strong password',
  },
  'password-confirm': {
    valueMissing: 'Please reenter your password',
    passwordMismatch: 'Passwords do not match',
  },
};

function validateForm(e) {
  let firstInvalidInput = '';
  inputs.forEach((input) => {
    // Validate all fields and show any errors
    validateInput(input);

    // If errors are present, set focus on the first invalid input, 
    // and do not submit the form
    if ((!isInputValid(input)) && (!firstInvalidInput)) {
      firstInvalidInput = input;
      firstInvalidInput.focus();
      e.preventDefault();
    }
  });
}

function validateInput(e) {
  const input = e.target || e;
  let fieldsToValidate = [];

  // Enable live errors after the field loses focus or when submitting the form
  // This gives users a chance to finish typing before errors are displayed
  // All subsequent typing will show/hide errors in real time
  if (e.type !== 'input') {
    input.classList.add('real-time-validation');
  }

  // If live errors is enabled for this field, add it to the list of fields to validate
  if (isShowLiveErrors(input)) {
    fieldsToValidate.push(input);
  }

  if (input.id.startsWith('password')) {
    const password = document.querySelector('#password');
    const passwordConfirm = document.querySelector('#password-confirm');

    if (input === password) {
      // Check off password rules as they match in real-time
      validatePassword();

      // If password is updated, then validate password-confirm too if its
      // live errors are enabled (add it to the list of fields to validate)
      if (isShowLiveErrors(passwordConfirm)) {
        fieldsToValidate.push(passwordConfirm);
      }
    }

    // Sets the validity of the password-confirm field
    validatePasswordsMatch();
  }

  // Check the validity of any fields on the list, then display or hide errors
  fieldsToValidate.forEach((input) => {
    const inputParent = input.parentElement;
    const errorContainer = document.querySelector(`#${inputParent.id} + .form__error`);
    const error = document.querySelector(`#${inputParent.id} + .form__error > p`);
    if (isInputValid(input)) {
      // Small delay provides time for the text fade out animation to finish
      // (so text doesn't disappear abruptly when cleared)
      if (errorContainer.classList.contains('form__error--expand')) {
        timeout = setTimeout(() => {
                    error.textContent = '';
                  }, 200);
        errorContainer.classList.add('form__error--collapse');
        errorContainer.classList.remove('form__error--expand');
      }
    } else {
      // Clear existing timeouts, so error text doesn't get inadvertently blanked out
      clearTimeout(timeout);
      if (!errorContainer.classList.contains('form__error--expand')) {
        error.textContent = getErrorMessage(input);
        errorContainer.classList.add('form__error--expand');
        errorContainer.classList.remove('form__error--collapse');
      }
    }
  });
}

function validatePassword() {
  const passwordValue = document.querySelector('#password').value;
  const rules = {
    length: document.querySelector('.pw-length'),
    upper: document.querySelector('.pw-upper'),
    lower: document.querySelector('.pw-lower'),
    digit: document.querySelector('.pw-digit'),
  }
  const regex = {
    length: /^.{8,}$/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    digit: /\d/,
  }

  // Verify the password against each of the 4 rules
  // Check off any rules that match (controlled via class)
  // Note: Overall password validity is not determined here, but by the pattern attribute
  for (let i = 0; i < 4; i++) {
    const rule = Object.values(rules)[i];
    const isRulePassed = Object.values(regex)[i].test(passwordValue);
    if (isRulePassed) {
      rule.classList.add('password-rules__rule--success');
    } else {
      rule.classList.remove('password-rules__rule--success');
    }
  }
}

function validatePasswordsMatch() {
  const password = document.querySelector('#password');
  const passwordConfirm = document.querySelector('#password-confirm');

  // Depending on whether passwords match, clear or set passwordMismatch error
  // If password-confirm is blank, always use valueMissing error (ie. clear passwordMismatch error)
  // Note: Sets validity only, does not display errors (validateInput does that)
  if ((password.value === passwordConfirm.value) || (passwordConfirm.value === '')) {
    passwordConfirm.setCustomValidity('');
    passwordConfirm.validity.passwordMismatch = false;
  } else {
    passwordConfirm.setCustomValidity('passwordMismatch');
    passwordConfirm.validity.passwordMismatch = true;
  }
}

function formatPhoneNumber(e) {
  const input = e.target;
  const numbers = input.value.replace(/[^0-9]/g,'');
  const len = numbers.length;
  const hasDeletedContent = e.inputType ? e.inputType.startsWith('delete') : false;

  // Only allow typing numbers and backspace, which is automatically
  // formatted as: (xxx) xxx-xxxx
  // When adding content, special characters are inserted when typing 1st, 3rd, 6th digits
  // When deleting content, special characters are removed when deleting 7th, 4th, 1st digits
  // The positions are different so the user can backspace past the special characters
  // (otherwise they keep getting added back)
  let formatted = '';
  if ((len >= 1 && len < 3 && !hasDeletedContent) || (len >=1 && len < 4 && hasDeletedContent)) {
    formatted = numbers.replace(/(\d{1})/, '($1');
  } else if ((len >= 3 && len < 6 && !hasDeletedContent) || (len >= 4 && len < 7 && hasDeletedContent)) {
    formatted = numbers.replace(/(\d{3})/, '($1) ');
  } else if ((len >= 6 && !hasDeletedContent) || (len >= 7 && hasDeletedContent)) {
    formatted = numbers.replace(/(\d{3})(\d{3})/, '($1) $2-');
  }

  input.value = formatted;
} 

function setPasswordRulesVisibility(e) {
  // When focus is on...
  // - password field: Always show password rules
  // - any other field: If password is valid, hide password rules
  //                    Otherwise, do nothing
  const password = document.querySelector('#password');
  const passwordRules = document.querySelector('.password-rules');
  if (e.target === password) {
    passwordRules.classList.add('password-rules--expand');
    passwordRules.classList.remove('password-rules--collapse');
  } else if (password.validity.valid) {
    passwordRules.classList.add('password-rules--collapse');
    passwordRules.classList.remove('password-rules--expand');
  }
}

function togglePasswordVisibility(e) {
  // Toggle between showing/hiding the password
  const showHideToggle = e.target;
  const input = showHideToggle.parentElement.querySelector('input');
  if (showHideToggle.textContent === 'Show') {
    input.type = 'text';
    showHideToggle.textContent = 'Hide';
  } else {
    input.type = 'password';
    showHideToggle.textContent = 'Show';
  }
}

function getErrorMessage(input) {
  // Use the first error reason listed for why constraint validation failed
  // to lookup and return the custom error message to display to user
  const validityState = input.validity;
  for (let errReason in validityState) {
    if (validityState[errReason]) {
      return errorMessages[input.id][errReason];
    }
  }
}

function isInputValid(input) {
  // Return whether input passed constraint validation
  return input.validity.valid;
}

function isShowLiveErrors(input) {
  // Return whether to show errors in real-time for this field
  // If true, it means user has attempted/finished typing this field, so
  // we can start displaying errors from now on
  return input.classList.contains('real-time-validation');
}