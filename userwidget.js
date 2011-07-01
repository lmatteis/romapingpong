importPackage(java.lang);

var userwidget = {

    validateEmail: function(email){ 
         var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
         return email.match(re);
    },
    hideEmail: function(email) {
        return email.split("@")[0];
    },

    // makes a md5 string out of a string
    md5: function(text) {
        function bytesToHex(b) {
            var hexDigit = ['0', '1', '2', '3', '4', '5', '6', '7',
                         '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
            var buf = new StringBuffer();
            for (var j=0; j<b.length; j++) {
                buf.append(hexDigit[(b[j] >> 4) & 0x0f]);
                buf.append(hexDigit[b[j] & 0x0f]);
            }
            return buf.toString();
        }
        var md = java.security.MessageDigest.getInstance("MD5");
        md.update(text.getBytes("iso-8859-1"), 0, text.length());
        var hash = md.digest();
        return bytesToHex(hash).toLowerCase();
    }
};
