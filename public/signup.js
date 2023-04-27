// /public/signup.js

const signupForm = document.querySelector('#signup-form');

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = signupForm.email.value;
  const password = signupForm.password.value;

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    res.redirect('/');
  } catch (error) {
    console.error(error);
  }
});
