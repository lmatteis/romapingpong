var util = {
    splitter: function(value) {
        return value.split(" ");
    },
    normalize: function(obj) {
        var arr = [];
        for(var i in obj) {
            var value = obj[i];

            // be sure value is a JS string
            value = ""+value;

            // ok for each value we must trim() it and lowercase() it
            value = value.trim().toLowerCase();


            // then we must split it by space
            var words = this.splitter(value);

            for(var x=0; x<words.length; x++) {
                // add each word to our main array
                arr.push(words[x]);
            }
        }
        return arr;
    }
};
