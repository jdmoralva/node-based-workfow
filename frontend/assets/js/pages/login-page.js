export function bootstrapLoginPage(options = {}) {
  const root = options.root || document;
  const form = root.querySelector('.login-form-card');
  const result = root.querySelector('[data-login-result]');
  const username = root.querySelector('#login-username');
  const password = root.querySelector('#login-password');
  const usernameFeedback = root.querySelector('[data-field-feedback="username"]');
  const passwordFeedback = root.querySelector('[data-field-feedback="password"]');

  if (!form || !result || !username || !password || !usernameFeedback || !passwordFeedback) {
    return {
      status: 'missing-form',
    };
  }

  function showFeedback(field, feedback) {
    feedback.textContent = feedback.dataset.requiredMessage || '';
    feedback.hidden = false;
    field.classList.add('login-form-card__input--invalid');
  }

  function clearFeedback(field, feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
    field.classList.remove('login-form-card__input--invalid');
  }

  function validateField(field, feedback) {
    if (field.value.trim()) {
      clearFeedback(field, feedback);
      return true;
    }

    showFeedback(field, feedback);
    return false;
  }

  function hideResult() {
    result.hidden = true;
    result.textContent = '';
  }

  function handleFieldInput(event) {
    const field = event.currentTarget;
    if (field === username && field.value.trim()) {
      clearFeedback(username, usernameFeedback);
    }
    if (field === password && field.value.trim()) {
      clearFeedback(password, passwordFeedback);
    }
    hideResult();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const usernameValid = validateField(username, usernameFeedback);
    const passwordValid = validateField(password, passwordFeedback);

    if (!usernameValid || !passwordValid) {
      hideResult();
      return;
    }

    result.textContent = result.dataset.placeholderMessage || '';
    result.hidden = !result.textContent;
  }

  form.addEventListener('submit', handleSubmit);
  username.addEventListener('input', handleFieldInput);
  password.addEventListener('input', handleFieldInput);

  return {
    status: 'ready',
    destroy() {
      form.removeEventListener('submit', handleSubmit);
      username.removeEventListener('input', handleFieldInput);
      password.removeEventListener('input', handleFieldInput);
    },
  };
}
