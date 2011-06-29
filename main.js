require("apejs.js");
require("googlestore.js");

var print = function(response) {
    return {
        json: function(j) {
            response.getWriter().println(JSON.stringify(j));
        }
    };
}

apejs.urls = {
    "/":  {
        get: function(request, response) {
            var html = render("./skins/index.html");
            response.getWriter().println(html);
        }
    },
    "/login":  {
        get: function(request, response) {
            require("./user.js");

            if(user.currUser) { // logged in
                var u = {
                    "userid": ""+user.currUser.getUserId(),
                    "email": ""+user.currUser.getEmail(),
                    "nickname": ""+user.currUser.getNickname()
                };
                // lookup the user by key
                var userEntity = false;
                try {
                    var userKey = googlestore.createKey("user", u.userid);
                    userEntity = googlestore.get(userKey);
                } catch(e) {
                }

                if(userEntity) { // user exists as an entity
                    // add extra info directly from the db
                    u.dunno = userEntity.getProperty("dunno");
                    

                } else { // create it as an entity, with key the userid
                    u.created = new java.util.Date();
                    userEntity = googlestore.entity("user", u.userid, u);
                    googlestore.put(userEntity);

                    u.firsttime = true; // so the UI knows it's first time

                }
                u.created = false; //JSON.stringify doesn't like Java types
                print(response).json(u);

            } else {
                print(response).json({
                    "error": "Not logged in",
                    "loginurl": ""+user.createLoginURL("/")
                });
            }
        }
    },
    "/logout":  {
        get: function(request, response) {
            require("./user.js");
            response.sendRedirect(user.createLogoutURL("/"));
        }
    },
    "/users":  {
        get: function(request, response) {
            var tot = 10,
                offset = 0;
            var users = googlestore.query("user")
                        .sort("created", "DESC")
                        .limit(tot)
                        .offset(offset)
                        .fetch();

            var ret = []; // the array returned

            users.forEach(function(user) {
                ret.push({
                    "name": ""+(user.getProperty("fullname") || user.getProperty("nickname")),
                    "email": ""+user.getProperty("email") // for gravatar ( XXX BAD, never show users email)
                });

            });

            print(response).json(ret);
        }
    }
};
