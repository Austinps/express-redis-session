const form = document.getElementById('form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const button = document.getElementById('button');

  // Client-side validation for password field
  if (password.length < 6) {
    const errorElement = document.createElement('p');
    errorElement.textContent = 'Password must be at least 6 characters long.';
    form.appendChild(errorElement);
    return;
  }

  button.disabled = true; // Disable the button on submission

  fetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        console.log('Success');
        window.location.href = '/protected';
      } else {
        return response.json().then((data) => {
          console.log(data.error);
          const errorElement = document.createElement('p');
          errorElement.textContent = data.error;
          form.appendChild(errorElement);
        });
      }
    })
    .catch((error) => console.error(error))
    .finally(() => {
      button.disabled = false; // Re-enable the button after the request is completed
    });
});
