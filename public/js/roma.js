(function() {

/**
 * User module
 */
var User = (function() {
    var user = false, // contains logged in user data
        logoutText = "Login con Google",
        loginNav = [
            {
                name: "Profilo",
                href: "#",
                click: function(e) {
                    console.log(User.user);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, 
            {
                name: "Logout",
                href: "/logout"
            }
        ];

    function login() {
        var nav = $("#nav_tmpl");
        $.getJSON("/login", function(json) {
            if(json.error) { // not logged in
                nav.show();
                nav.text(logoutText);
                nav.attr("href", json.loginurl);
            } else { // logged in
                User.user = json;
                $.each(loginNav, function(i, v) {
                    var obj = v;
                    var c = nav.clone();
                    c.show().text(obj.name);
                    c.click(obj.click);
                    c.attr("href", obj.href);
                    c.insertBefore(nav);
                });
            }
        });
    }

    return {
        login: login,
        user: user
    };
})();


/**
 * UserWidget is the widget showing
 * all the users that have created an account
 * in cronological order
 */
var UserWidget = (function(){
    var url = "/users",
        tmpl = "#users li", $tmpl;

    function appendUser(user) {
        var c = $tmpl.clone(),
            children = c.children(),
            img = children.get(0),
            name = children.get(1);

        c.show();

        $(name).text(user.name);

        c.insertBefore($tmpl);

    }

    function init() {
        $tmpl = $(tmpl);
        $.getJSON(url, function(json){
            $.each(json, function(i, v) {
                appendUser(v);            
            });
        });
    }

    return {
        init: init
    };
})();

/**
 * For Modal window and other things
 */
var ModalResize = function() {
    var m = $(".modal"),
        width = m.width();

    m.css("left", ($(window).width() - width)/2 + "px");
};

$(window).resize(function(){
    ModalResize();
});

/**
 * Main entry
 */
$(function() {
    ModalResize();
    User.login();
    UserWidget.init();
});


})();
