'use strict';

function requireLogin(req, res, next) {
  if (!req.currentUser) {
    req.session.flash = { type: 'error', msg: 'Please log in first.' };
    return res.redirect('/auth/login?next=' + encodeURIComponent(req.originalUrl));
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Not allowed',
      code: 403,
      message: 'Only an administrator can access this page.',
    });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
