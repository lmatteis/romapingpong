/**
 * From Crockford
 */
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}

/**
 * Widget class
 */
var Widget = (function() {
    // mostly takes care of showing the loading text
    // and/or error for the child widget 
    function load() {
        var $loader = $(this.loaderSel);
        $loader.show();
        // run the ajax method
        this.ajax(function() {
            $loader.hide(); 
        }, function() {
            $loader.html("Something went wrong with the request");
        });
    }
    return {
        load: load 
    };
})();

/**
 * UserWidget is the widget showing
 * all the users that have created an account
 * in cronological order
 */
var UserWidget = (function(){
    var self = object(Widget); // inherit from Widget

    self.loaderSel = "#users .loader";

    var url = "/users",
        tmpl = "#users li", $tmpl;

    function appendUser(user) {
        var c = $tmpl.clone(),
            children = c.children(),
            img = c.find("img"),
            name = children.get(1);

        c.show();

        img.attr("src", "avatar32.jpg");
        $(name).text(user.name);

        c.insertBefore($tmpl);
    }

    self.ajax = function(success, error) {
        $tmpl = $(tmpl);
        $.getJSON(url, function(json){
            $.each(json, function(i, v) {
                appendUser(v);            
            });

            success();
        }).error(error);
    }

    return self;
})();

/**
 * Profile functionalities
 */
var Profile = (function() {
    var tmpl = "#profile_tmpl",
        loaderSel = "";

    function replaceInfo(user) {
        var $tmpl = $(tmpl);
        $tmpl.find("img.gravatar").attr("src", "avatar32.jpg");
        $.each(user, function(key, value) {
            var found = $tmpl.find("." + key);
            found.html(value);

            // check the node name
        });
        Modal.show(tmpl);
    }

    // makes an ajax call to find 
    // the user information with this userid
    function show(userid) {
        Profile.currUserId = userid;
        if(userid == User.user.userid) { // it's the current user, dont do ajax
            replaceInfo(User.user);
            // show edit
            EditMode.display();
        } else { // run ajax
            Modal.loader();
        }
    }
    
    return {
        show: show
    };

})();
/**
 * Edit mode - figure out with display() if
 * we can display the "edit" link in the profile
 * and assign event for that link. when clicked
 * on() is ran.. so we can call display() and then
 * on() to show the editable box. cancel() will
 * get out of edit mode and replace all contents with original (cancel)
 */
var EditMode = (function(){
    // figure out the elements to turn into inputs/textareas
    // based on what's inside the dom Modal .profile element
    // so on() should always run after this element exists
    function on() {
        var cont = $(".modal .profile");

        var editLink = cont.find(".edit-mode a.edit");
        var saveLink = cont.find(".edit-mode a.save");

        if(editLink.text() == "Modifica") {
            $.each(User.user, function(key, value) {
                var found = cont.find("." + key);
                // and after it put an input/textarea
                if(key == "bio") { // for bio show textearea
                    var textarea = $("<textarea name='"+key+"'>" + value + "</textarea>");
                    textarea.insertAfter(found);
                } else
                    $("<input type='text' placeholder='"+(found.attr("placeholder") || "")+"' name='"+key+"' value='" + value + "' />").insertAfter(found);
                // hide the element we found
                found.hide();
            });
            editLink.text("Annulla");
            saveLink.show();

        } else if(editLink.text() == "Annulla") {
            $.each(User.user, function(key, value) {
                var found = cont.find("." + key);
                found.show();
            });
            cont.find("input, textarea").hide();
            editLink.text("Modifica");
            saveLink.hide();
        }

    }
    function save() {
        // get all the inputs and textareas
        var pars = {
            userid: Profile.currUserId
        };
        $("input, textarea").each(function(){
            var $this = $(this);
            pars[$this.attr("name")] =  $this.val();
        });

        $.post("/edit-user", pars, function() {
            // refresh profile page

            User.login(function() {
                Profile.show(User.user.userid);
            });
            
        }).error(function() {

        });

    }
    function display() {
        $(".edit-mode").show();
        // edit link
        $(".edit-mode a.edit").click(function(e) {
            on();
            e.preventDefault();
            e.stopPropagation();
        }).show();

        // save link
        $(".edit-mode a.save").click(function(e) {
            save();
            e.preventDefault();
            e.stopPropagation();
        });
    }
    function cancel() {

    }
    return {
        display: display,
        on: on,
        cancel: cancel
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
        // clone the contents of the selector,
        // not the whole selector otherwise it will clone the "id"
        // which should be unique 
        var clone = $(sel).children(":first").clone();

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
 * For Modal when window is resized
 */
var ModalResize = function() {
    // only resize if modal is visible
    if(!$(".modal").is(":visible")) return;

    var m = $(".modal"),
        width = m.width();

    m.css("left", ($(window).width() - width)/2 + "px");
};


/**
 * User authentication module
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

    function login(func) {
        var nav = $("#nav_tmpl");
        var c = nav.find("a").first().clone();
        nav.html("");
        $.getJSON("/login", function(json) {
            if(json.error) { // not logged in
                c.show();
                c.text(logoutText);
                c.attr("href", json.loginurl);
                nav.append(c);
            } else { // logged in
                User.user = json;
                $.each(loginNav, function(i, v) {
                    var obj = v;
                    c = c.clone();
                    c.show().text(obj.name);
                    c.click(obj.click);
                    c.attr("href", obj.href);
                    nav.append(c);
                });
                if(func) func();
            }
        });
    }

    return {
        login: login,
        user: user
    };
})();

/**
 * Resize window
 */
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

    UserWidget.load();
});

