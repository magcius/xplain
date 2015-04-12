// Contains the "demo framework", along with some of the more simple demos.

(function(exports) {
    "use strict";

    // Creates a server instance for each demo, and sets up "demo things".
    // It sizes each server according to the containing element, adds the
    // stipple pattern, and (optionally) adds the inspector as well.
    function bootstrapDemo(name, elem) {
        var demoSlot = document.createElement("div");
        demoSlot.classList.add('demo-' + name);
        elem.appendChild(demoSlot);
        return demoSlot;
    }

    var demos = {};

    var ArticleDemos = {};
    ArticleDemos.registerDemo = function(name, func) {
        demos[name] = func;
    };

    function findDemo(demoName) {
        var demoFunc = demos[demoName];
        if (!demoFunc)
            console.error("Unknown demo: " + demoName);
        return demoFunc;
    }
    ArticleDemos.runServerDemo = function(elem) {
        var demoName = elem.dataset.demo;
        var demoFunc = findDemo(demoName);
        var demoSlot = bootstrapDemo(demoName, elem);
        var server = new Server();
        server.resize(demoSlot.clientWidth, demoSlot.clientHeight);
        demoSlot.appendChild(server.elem);
        var res = { server: server, elem: elem };
        demoFunc(res);
    };
    ArticleDemos.runCanvasDemo = function(elem) {
        var demoName = elem.dataset.demo;
        var demoFunc = findDemo(demoName);
        if (!demoFunc)
            return;

        var demoSlot = bootstrapDemo(demoName, elem);
        var canvas = document.createElement('canvas');
        canvas.width = demoSlot.clientWidth;
        canvas.height = demoSlot.clientHeight;
        demoSlot.appendChild(canvas);
        var res = { canvas: canvas, elem: elem };
        demoFunc(res);
    };

    // The "main" function of the article. Goes over all the demo elements
    // the article's source code and runs the according demo for them.
    ArticleDemos.runAllDemos = function() {
        var elems;
        elems = document.querySelectorAll(".demo-server");
        [].forEach.call(elems, ArticleDemos.runServerDemo);
        elems = document.querySelectorAll(".demo-canvas");
        [].forEach.call(elems, ArticleDemos.runCanvasDemo);
    };

    exports.ArticleDemos = ArticleDemos;

})(window);
