'use strict'
const form = document.querySelector('.form');
const phone = document.querySelector('#phone');
const inputItems = document.querySelectorAll('.form__input');

form.addEventListener('submit', validateForm);
phone.addEventListener('input', formatPhoneNumber);
inputItems.forEach((item) => item.addEventListener('blur', validateInput));
inputItems.forEach((item) => item.addEventListener('input', validateInput));

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
  },
  'phone': {
    patternMismatch: 'Phone number must be 10 digits'
  },
  'password': {
    valueMissing: 'Please enter a strong password',
  },
  'password-confirm': {
    valueMissing: 'Please reenter your password',
    passwordMismatch: 'Passwords do not match',
  },
};

function validateForm(e) {
  // Show any errors, do not submit form if errors are present
  let firstInvalidItem;
  inputItems.forEach((item) => {
    validateInput(item);
    if (!isInputValid(item)) {
      if (!firstInvalidItem) firstInvalidItem = item;
    }
  });

  if (firstInvalidItem) {
    firstInvalidItem.focus();
    e.preventDefault();
  }
}

function validateInput(e) {
  const inputElement = e.target || e;
  let errorMessage = '';
  let inputsRequiringValidation = [inputElement];

  // Skip real-time validation if user is typing in this field for the first time
  if (e.type === 'input' && !isInputPreviouslyValidated(inputElement)) {
    return;
  }
  inputElement.setAttribute('data-validation', '');

  if (inputElement.id.startsWith('password')) {
    const password = document.querySelector('#password');
    const passwordConfirm = document.querySelector('#password-confirm');

    // If password is updated, then password-confirm needs to be validated too
    if ((inputElement === password) && (isInputPreviouslyValidated(passwordConfirm))) {
      inputsRequiringValidation.push(passwordConfirm);
    }
    validatePasswordsMatch();
  }

  inputsRequiringValidation.forEach((input) => {
    if (!isInputValid(input)) {
      errorMessage = getErrorMessage(input) || 'Invalid format';
    }
  
    showErrorMessage(input, errorMessage);  
  });
}

function formatPhoneNumber(e) {
  // User can only type numbers and backspace
  const inputElement = e.target;
  const inputValue = inputElement.value;
  let numbers = inputValue.replace(/[^0-9]/g,'');
  const len = numbers.length;
  
  // Phone number format: (xxx) xxx-xxxx
  // When adding content, special characters are added when typing 1st, 3rd, 6th digits
  // When deleting content, special characters are removed when deleting 7th, 4th, 1st digits
  // This is to solve the problem where special characters were being added back, 
  // and the user can't backspace past it
  const deletedContent = e.inputType ? e.inputType.startsWith('delete') : false;
  if ((len >= 1 && len < 3 && !deletedContent) || (len >=1 && len < 4 && deletedContent)) {
    numbers = numbers.replace(/(\d{1})/, '($1');
  } else if ((len >= 3 && len < 6 && !deletedContent) || (len >= 4 && len < 7 && deletedContent)) {
    numbers = numbers.replace(/(\d{3})/, '($1) ')
  } else if ((len >= 6 && !deletedContent) || (len >= 7 && deletedContent)) {
    numbers = numbers.replace(/(\d{3})(\d{3})/, '($1) $2-')
  }

  inputElement.value = numbers;
} 

function validatePasswordsMatch() {
  const password = document.querySelector('#password');
  const passwordConfirm = document.querySelector('#password-confirm');

  if (password.value === passwordConfirm.value) {
    passwordConfirm.setCustomValidity('');
    passwordConfirm.validity.passwordMismatch = false;
  } else {
    passwordConfirm.setCustomValidity('passwordMismatch');
    passwordConfirm.validity.passwordMismatch = true;
  }
}

function showErrorMessage(inputElement, errorMessage) {
  if (errorMessage) {
    addErrorMessage(inputElement, errorMessage);
  } else {
    removeErrorMessage(inputElement);
  }
}

function getErrorMessage(inputElement) {
  const validityState = inputElement.validity;
  for (let errReason in validityState) {
    if (validityState[errReason] === true) {
      const errMessage = errorMessages[inputElement.id][errReason];
      return(errMessage);
    }
  }
}

function addErrorMessage(inputElement, errorMessage) {
  const errorElement = document.querySelector(`#${inputElement.id} ~ .form__error-msg`);
  const p = document.createElement('p');

  if (errorElement) {
    errorElement.textContent = errorMessage;
  } else {
    p.classList.add('form__error-msg');
    p.textContent = errorMessage;
    inputElement.parentNode.appendChild(p);
  }
}

function removeErrorMessage(inputElement) {
  const errorElement = document.querySelector(`#${inputElement.id} ~ .form__error-msg`);
  if (errorElement) errorElement.remove();
}

function isInputValid(inputElement) {
  return inputElement.validity.valid;
}

function isInputPreviouslyValidated(inputElement) {
  return inputElement.hasAttribute('data-validation');
}