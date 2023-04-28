export const renderForgotPassword = async (req, res) => {
  const errorMessage = req.session.errorMessage;
  const userNotFound = req.session.userNotFound;
  req.session.errorMessage = null;
  req.session.userNotFound = null;
  res.render('forgot-password', { errorMessage, userNotFound });
};

export const renderForgotPasswordSuccess = (req, res) => {
  res.render('forgot-password-success');
};

export const renderRegistration = (req, res) => {
  const error = req.query.error || null;
  res.render('signup', { error });
};

export const renderHome = (req, res) => {
  if (req.session.user) {
    // User is logged in, show logout link
    res.render('index', { loggedIn: true, user: req.session.user });
  } else {
    // User is not logged in, show login link
    res.render('index', { loggedIn: false });
  }
};

export const renderLogin = (req, res) => {
  // Check if user is already logged in
  if (req.session.user) {
    res.redirect('/protected');
  } else {
    const error = req.query.error || null; // get the error message from the query string
    res.render('login', { error });
  }
};

export const renderProtected = (req, res) => {
  console.log('Session user:', req.session.user);
  console.log('Session fingerprint:', req.session.fingerprint);
  console.log('Request IP:', req.ip);
  console.log('Request User-Agent:', req.headers['user-agent']);
  // Check if user is logged in and session fingerprint matches
  if (
    req.session.user &&
    req.session.fingerprint.ip === req.ip &&
    req.session.fingerprint.userAgent === req.headers['user-agent']
  ) {
    res.render('protected', { user: req.session.user, isChecked: true });
  } else {
    res.redirect('/login');
  }
};
