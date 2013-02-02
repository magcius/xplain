(function(exports) {

    function Task(func, delay) {
        var id = 0;
        delay = delay || 0;
        function stop() {
            clearTimeout(id);
            id = 0;
        }
        function start() {
            var args = [].slice.call(arguments);
            id = setTimeout(function() { run(args); }, delay);
        }
        function run(args) {
            id = 0;
            if (func.apply(null, args))
                schedule.apply(null, args);
        }
        function alive() {
            return id > 0;
        }
        function schedule() {
            if (!alive())
                start.apply(null, arguments);
        }

        schedule.start = start;
        schedule.stop = stop;
        schedule.run = run;
        schedule.alive = alive;
        return schedule;
    }

    exports.Task = Task;

})(window);
