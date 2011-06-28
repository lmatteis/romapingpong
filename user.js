importPackage(com.google.appengine.api.users);

/**
 * Little abstraction around the UserService API
 */
var user = (function(){
    var userService = UserServiceFactory.getUserService();

    function createLoginURL(url) {
        return userService.createLoginURL(url);
    }
    function createLogoutURL(url) {
        return userService.createLogoutURL(url);
    }

    return {
        currUser: userService.getCurrentUser(),
        createLoginURL: createLoginURL,
        createLogoutURL: createLogoutURL
    }
})();
