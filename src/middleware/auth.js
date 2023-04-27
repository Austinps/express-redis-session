const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }

  firebase
    .auth()
    .verifyIdToken(req.session.user.idToken)
    .then(() => {
      next();
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      res.status(401).send(`Unauthorized: ${errorMessage}`);
    });
};

app.get('/protected', requireAuth, (req, res) => {
  res.render('protected', { user: req.session.user });
});
