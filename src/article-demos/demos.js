// Contains the "demo framework", along with some of the more simple demos.

(function(exports) {
    "use strict";

    // Creates a server instance for each demo, and sets up "demo things".
    // It sizes each server according to the containing element, adds the
    // stipple pattern, and (optionally) adds the inspector as well.
    function bootstrapDemo(name, elem) {
        var serverSlot = document.createElement("div");
        serverSlot.classList.add('demo-' + name);
        elem.appendChild(serverSlot);

        var width = serverSlot.clientWidth;
        var height = serverSlot.clientHeight;

        var server = new Server();
        server.resize(width, height);
        serverSlot.appendChild(server.elem);

        return { server: server, elem: elem };
    }

    var demos = {};

    var ArticleDemos = {};
    ArticleDemos.registerDemo = function(name, func) {
        demos[name] = func;
    };

    ArticleDemos.runDemo = function(elem) {
        var demoName = elem.dataset.demo;
        var demoFunc = demos[demoName];
        if (!demoFunc)
            console.error("Unknown demo: " + demoName);

        var res = bootstrapDemo(demoName, elem);
        demoFunc(res);
    };

    // The "main" function of the article. Goes over all the demo elements
    // the article's source code and runs the according demo for them.
    ArticleDemos.runAllDemos = function() {
        var elems = document.querySelectorAll(".demo-server");
        [].forEach.call(elems, ArticleDemos.runDemo);
    };

    exports.ArticleDemos = ArticleDemos;

})(window);
