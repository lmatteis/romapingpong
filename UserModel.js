require("./userwidget.js");

/**
 * u is a user entity from the datastore
 * this function takes care of retreving the proper fields
 * that make a user from the datastore object and
 * returning the result in a plain JS object
 */
function User(u) {
    var props = [
        "created", 
        "userid", 
        "name", 
        "email", 
        "nickname",
        "city",
        "url",
        "bio"
    ];


    var ret = {};

    // do gravatar
    ret["gravatar"] = ""+userwidget.md5(u.getProperty("email").trim().toLowerCase());

    for(var i=0; i<props.length; i++) {
        var value = u.getProperty(props[i]);

        if(value instanceof Text)
            value = value.getValue();

        if(value == null) value = "";

        ret[props[i]] = ""+value;
    }

    // hide email
    ret["email"] = userwidget.hideEmail(ret["email"]);

    return ret;
}
