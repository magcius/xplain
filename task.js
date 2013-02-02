(function(exports) {

    function Task(func, delay) {
        var id = 0;
        delay = delay || 0;
        function clear() {
            clearTimeout(id);
            id = 0;
        }
        function run(args) {
            id = 0;
            if (func.apply(null, args))
                schedule();
        }
        function alive() {
            return id > 0;
        }
        function schedule() {
            var args = [].slice.call(arguments);
            if (!alive())
                id = setTimeout(function() { run(args); }, delay);
        }

        schedule.clear = clear;
        schedule.run = run;
        schedule.alive = alive;
        return schedule;
    }

    exports.Task = Task;

})(window);
