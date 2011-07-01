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
            require("./userwidget.js");

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
                    u.email = userEntity.getProperty("email") ? userEntity.getProperty("email") : user.currUser.getEmail();
                    u.name = ""+userEntity.getProperty("name");
                    u.url = ""+userEntity.getProperty("url");
                    u.city = ""+userEntity.getProperty("city");
                    u.bio = ""+userEntity.getProperty("bio");
                    u.gravatar = ""+userwidget.md5(u.email.trim().toLowerCase());
                    u.email = ""+u.email;
                    

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
            require("./userwidget.js");

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
                    "userid": ""+user.getProperty("userid"),
                    "name": ""+(user.getProperty("name") || userwidget.hideEmail(user.getProperty("nickname"))),
                    "gravatar": ""+userwidget.md5((user.getProperty("email")).trim().toLowerCase()) // show trimmed, lowercase and md5 email
                });

            });

            print(response).json(ret);
        }
    },
    "/users/([a-zA-Z0-9_]+)" : {
        get: function(request, response, matches) {
            require("./userwidget.js");
            var userid = matches[1];

            try {
                // get this user data
                var userKey = googlestore.createKey("user", userid),
                    userEntity = googlestore.get(userKey);

                var u = {};
                u.gravatar = userEntity.getProperty("email") ? ""+userwidget.md5(userEntity.getProperty("email").trim().toLowerCase()) : "null";
                u.name = ""+(userEntity.getProperty("name") || userwidget.hideEmail(userEntity.getProperty("nickname")));
                u.url = ""+userEntity.getProperty("url");
                u.city = ""+userEntity.getProperty("city");
                u.bio = ""+userEntity.getProperty("bio");

                print(response).json(u);
            } catch (e) {
                response.sendError(response.SC_BAD_REQUEST, e);
            }


        }
    },
    "/edit-user":  {
        post: function(request, response) {
            require("./user.js");
            require("./userwidget.js");

            // check user is logged in 
            if(!user.currUser)  // not logged in
                return response.sendError(response.SC_BAD_REQUEST, "Devi loggarti");
                
            var u = {
                bio: request.getParameter("bio"),
                city: request.getParameter("city"),
                email: request.getParameter("email"),
                name: request.getParameter("name"),
                url: request.getParameter("url")
            };

            if(!u.name || u.name == "" || !u.email || u.email == "" || !userwidget.validateEmail(u.email))
                return response.sendError(response.SC_BAD_REQUEST, "Email sbagliata");

            try {
                // find the entity with this userid
                var userKey = googlestore.createKey("user", ""+user.currUser.getUserId()),
                    userEntity = googlestore.get(userKey);

                googlestore.set(userEntity, u); 

                // use PUT to update this data inside the entity
                googlestore.put(userEntity);
            } catch(e) {
                return response.sendError(response.SC_BAD_REQUEST, "Qualcosa e' andato storto. Riprova");
            }
        }
    },
    "/chats":  {
        get: function(request, response) {
            require("./userwidget.js");

            var tot = 10,
                offset = 0;
            var chats = googlestore.query("chat")
                        .sort("created", "DESC")
                        .limit(tot)
                        .offset(offset)
                        .fetch();

            var ret = []; // the array returned

            chats.forEach(function(chat) {
                // given the userid
                // get this user data
                var userKey = googlestore.createKey("user", chat.getProperty("userid")),
                    userEntity = googlestore.get(userKey);

                ret.push({
                    "userid": ""+chat.getProperty("userid"),
                    "message": ""+chat.getProperty("message"),
                    "user": ""+(userEntity.getProperty("name") || userwidget.hideEmail(userEntity.getProperty("nickname")))
                });

            });

            print(response).json(ret);

        }
    },
    "/add-chat":  {
        post: function(request, response) {
            require("./user.js");
            if(!user.currUser)  // not logged in
                return response.sendError(response.SC_BAD_REQUEST, "Devi loggarti");

            var userid = request.getParameter("userid"),
                message = request.getParameter("message");

            if(!userid || userid == "" || !message || message == "")
                return response.sendError(response.SC_BAD_REQUEST, "Manca qualche parametro");

            // be sure we are this userid
            if(""+user.currUser.getUserId() != userid)
                return response.sendError(response.SC_BAD_REQUEST, "Non possiamo aggiungere per un altro utente");

            var chatEntity = googlestore.entity("chat", {
                "created": new java.util.Date(),
                "userid": userid,
                "message": message
            });
            googlestore.put(chatEntity);

        }
    }
};
