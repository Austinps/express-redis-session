import { Router } from 'express';

const router = Router();

app.post('/toggle-checkbox', (req, res) => {
  const { user } = req.session;
  const checkboxState = req.body.checkboxState;
  // Save the checkbox state
  // Your code here

  if (!user) {
    return res.redirect('/login');
  }

  if (!checkboxState) {
    return res.render('protected', {
      user,
      message: 'Please accept the terms and conditions.',
    });
  }

  // Render the protected page
  res.redirect('/protected');
});

export default router;
