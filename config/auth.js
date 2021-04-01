module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('errorMsg', 'Please log in to view this page')
        res.redirect('/users/login');
    }
}