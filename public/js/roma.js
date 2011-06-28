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
                    // show Profile of logged in user
                    Profile.show(User.user.userid);

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
 * Profile widget
 */
var Profile = (function() {
    var tmpl = "#profile";

    function replaceInfo(user) {
        var $tmpl = $(tmpl);
        $.each(user, function(key, value) {
            $tmpl.find("." + key).html(value);
        });
        Modal.show(tmpl);
    }

    // makes an ajax call to find 
    // the user information with this userid
    function show(userid) {
        Modal.loader();

        var mockuser = User.user;
        replaceInfo(mockuser);
    }
    
    return {
        show: show
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
 * Modal events
 */
var Modal = (function(){
    var m = ".modal";
    function loader() {
        $(m + " .content").html("Caricamento...");
        $(m).show();
        ModalResize();
    }

    // takes the string selector of the template to show
    function show(sel){
        var clone = $(sel).clone();

        $(m + " .content").html(clone);
        $(m).show();
        clone.show();

        ModalResize();
    }

    // assign event for closing
    function assignEvents() {
        $(m + " .close").click(function(e) {
            $(m).hide();    
            e.preventDefault();
            e.stopPropagation();
        });
    }

    return {
        show: show,
        assignEvents: assignEvents,
        loader: loader
    };
})();
/**
 * For Modal window and other things
 */
var ModalResize = function() {
    // only resize if modal is visible
    if(!$(".modal").is(":visible")) return;

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
    Modal.assignEvents();
    User.login();
    UserWidget.init();
});


})();
