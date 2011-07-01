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
                    u.name = userEntity.getProperty("name") ? ""+userEntity.getProperty("name") : "";
                    u.url = userEntity.getProperty("url") ? ""+userEntity.getProperty("url") : "";
                    u.city = userEntity.getProperty("city") ? ""+userEntity.getProperty("city") : "";
                    u.bio = userEntity.getProperty("bio") ? ""+userEntity.getProperty("bio") : "";
                    

                } else { // create it as an entity, with key the userid
                    u.created = new java.util.Date();
                    userEntity = googlestore.entity("user", u.userid, u);
                    googlestore.put(userEntity);

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
    },
    "/edit-user":  {
        post: function(request, response) {
            var u = {
                userid: request.getParameter("userid"),
                bio: request.getParameter("bio"),
                city: request.getParameter("city"),
                email: request.getParameter("email"),
                name: request.getParameter("name"),
                url: request.getParameter("url")
            };

            if(!u.userid || u.userid == "" || !u.email || u.email == "")
                return print(response).json({
                    "error": "Devi completare l'email"
                });

            try {
                // find the entity with this userid
                var userKey = googlestore.createKey("user", u.userid),
                    userEntity = googlestore.get(userKey);

                googlestore.set(userEntity, u); 

                // use PUT to inser this data inside the entity
                googlestore.put(userEntity);
            } catch(e) {
                res.sendError(res.SC_BAD_REQUEST, "Something went wrong in the datastore");
            }
        }
    }
};
