// Contains the "test" demo used on "Introduction & Table of Contents"

(function(exports) {
    "use strict";

    // The "test" demo used in the first paragraph to let the user test
    // that everything is working fine on their browser...
    ArticleDemos.registerDemo("test", "height: 2em", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));
    });

})(window);
