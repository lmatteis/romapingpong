/*
 * Auto-growing textareas; technique ripped from Facebook
 */
(function($) {
    $.fn.autogrow = function(options) {
        
        this.filter('textarea').each(function() {
            
            var $this       = $(this),
                minHeight   = $this.height(),
                lineHeight  = $this.css('lineHeight');
            
            var shadow = $('<div></div>').css({
                position:   'absolute',
                top:        -10000,
                left:       -10000,
                width:      $(this).width() - parseInt($this.css('paddingLeft')) - parseInt($this.css('paddingRight')),
                fontSize:   $this.css('fontSize'),
                fontFamily: $this.css('fontFamily'),
                lineHeight: $this.css('lineHeight'),
                resize:     'none'
            }).appendTo(document.body);
            
            var update = function() {
    
                var times = function(string, number) {
                    for (var i = 0, r = ''; i < number; i ++) r += string;
                    return r;
                };
                
                var val = this.value.replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/&/g, '&amp;')
                                    .replace(/\n$/, '<br/>&nbsp;')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/ {2,}/g, function(space) { return times('&nbsp;', space.length -1) + ' ' });
                
                shadow.html(val);
                $(this).css('height', Math.max(shadow.height(), minHeight));
            
            }
            
            $(this).change(update).keyup(update).keydown(update);
            
            update.apply(this);
            
        });
        
        return this;
        
    }
    
})(jQuery);

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
    function loader(t) {
        var $loader = $(this.loaderSel);
        if(t)
            $loader.show();
        else
            $loader.hide();

        return $loader;
    }

    // mostly takes care of showing the loading text
    // and/or error for the child widget 
    function load() {
        this.loader(true);
        var that = this;
        // run the ajax method
        this.ajax(function() {
            that.loader(false);
        }, function() {
            loader(true).html("Error");
        });
    }

    return {
        load: load,
        loader: loader
    };
})();

/**
 * Gravatar url
 */
function Gravatar(hash, size) {
    //return "avatar32.jpg";
    return "http://www.gravatar.com/avatar/"+hash+".jpg?s="+size;
}

/**
 * UserWidget is the widget showing
 * all the users that have created an account
 * in cronological order
 */
var UserWidget = (function(){
    var self = object(Widget); // inherit from Widget

    self.loaderSel = "#users .loader";

    var url = "/users",
        tmpl = "#users li:first", $tmpl,
        result = "#users .result";

    function appendUser(user) {
        var c = $tmpl.clone(),
            children = c.children(),
            img = c.find("img"),
            name = children.get(1);

        c.show();

        img.attr("src", Gravatar(user.gravatar, 36));
        $(name).click(function(e) {
            Profile.show(user.userid);

            e.preventDefault();
            e.stopPropagation();
        }).text(user.name || user.email);

        $(result).append(c);
    }

    self.ajax = function(success, error) {
        $tmpl = $(tmpl);
        //clear template
        $(result).html("");

        $.getJSON(url, function(json){
            $.each(json, function(i, v) {
                appendUser(v);            
            });

            success();
        }).error(error);
    }

    return self;
})();

var ChatWidget = (function(){
    var self = object(Widget); // inherit from Widget

    self.loaderSel = ".chat_widget .loader";


    function addChat(msg) {
        var pars = {
            userid: User.user.userid,
            message: msg
        };
        
        self.loader(true);

        $.post("/add-chat", pars, function() {
            self.loader(false);
            $(".chat textarea").val("").removeAttr("disabled");
            ChatWidget.load();
        }).error(function(e) {
        });
         
    }
    function assignEvents() {
        var $textarea = $(".chat textarea");

        $textarea.autogrow();

        $textarea.keydown(function(e) {
            if(e.keyCode == 13) { // enter
                $textarea.attr("disabled", "disabled");
                $textarea.blur();

                addChat($textarea.val());

                e.preventDefault();
            }
        });
    }

    self.chatOn = function() {
        $(".chat").show();
        assignEvents();
    };

    var url = "/chats",
        $tmpl, $result;
    function appendChat(chat) {
        var clone = $tmpl.clone();

        clone.show();

        // check the size of message
        if(chat.message.length > 100) {
            clone.find(".message").css("font-size", "11px"); 
        } 
        if(chat.message.length > 200) {
            clone.find(".message").css("font-size", "10px"); 
        }
        if(chat.message.length > 300) {
            clone.find(".message").css("font-size", "9px"); 
        }

        clone.find(".message").html(chat.message);
        clone.find("a.user").click(function(e) {

            Profile.show(chat.userid);
              
            e.preventDefault();
            e.stopPropagation();
        }).html(chat.user);
        
        $result.append(clone);

    }
    self.ajax = function(success, error) {
        $result = $(".chat_widget .result");
        $tmpl = $(".chat_widget .chat_tmpl:first");

        //clear template
        $result.html("");

        $.getJSON(url, function(json){
            $.each(json, function(i, v) {
                appendChat(v);            
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
        // templates should be untouched, let's clone them
        var $tmpl = $(tmpl).clone();
        $tmpl.find("img.grav").attr("src", Gravatar(user.gravatar, 58));
        $tmpl.find(".name").html(user.name || user.email);
        $tmpl.find(".email").html(user.email);

        $tmpl.find(".url a").attr("href", user.url).html(user.url);

        $tmpl.find(".city").html(user.city);
        $tmpl.find(".bio").html(user.bio);

        Modal.show($tmpl);
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
            $.getJSON("/users/"+userid, function(user) {
                replaceInfo(user);
            });
        }
    }

    function loader(t) {
        if(t)
            $(".modal .loader").show();
        else
            $(".modal .loader").hide();
    }
    
    return {
        show: show,
        loader: loader
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

                if(value == "null") value = "";
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

        Profile.loader(true);
        $.post("/edit-user", pars, function() {
            // refresh profile page
            User.login(function() {
                Profile.show(User.user.userid);
            });

            // also refresh UserWidget
            UserWidget.load();
            ChatWidget.load();

            Profile.loader(false);
        }).error(function(e) {
            Profile.loader(e);
        });

    }
    function display() {
        $(".modal .edit-mode").show();
        $(".modal .email").parent().show();
        // edit link
        $(".modal .edit-mode a.edit").click(function(e) {
            on();
            e.preventDefault();
            e.stopPropagation();
        }).show();

        // save link
        $(".modal .edit-mode a.save").click(function(e) {
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

    // template to show
    function show(jel){
        // get the contents of the template
        var contents = jel.children(":first");

        $(m + " .content").html(contents);
        $(m).show();

        contents.show();

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
 * Disable caching for all AJAX responses
 */
$.ajaxSetup ({
    cache: false
});

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
    User.login(function() {
        ChatWidget.chatOn(); 
    });

    UserWidget.load();
    ChatWidget.load();
});

