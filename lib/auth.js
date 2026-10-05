'use strict';

function requireLogin(req, res, next) {
  if (!req.currentUser) {
    req.session.flash = { type: 'error', msg: 'דאַרפֿסט זיך צוערשט אַרײַנלאָגירן.' };
    return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'נישט ערלויבט',
      code: 403,
      message: 'בלויז אַן אַדמיניסטראַטאָר קען צוקומען צו דער זײַטל.',
    });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
