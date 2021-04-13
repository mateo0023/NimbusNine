module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('errorMsg', 'Please login to view this page')
        res.redirect('/users/login');
    }
}