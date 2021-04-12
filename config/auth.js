module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('errorMsg', 'Please login to view this page')
        res.redirect('/users/login');
    },

    checkCampgroundOwnership: function (req, res, next){
        if(req.isAuthenticated()){ 
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    res.redirect("back");
                } else{
                    if(foundCampground.author.id.equals(req.user._id)){ 
                        next();
                    } else {
                        res.redirect("back");
                    }
                }
            });
        } else {
            res.redirect("back");
        }
    }
}