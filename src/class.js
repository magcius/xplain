// Contains a simple Class system, based on the Class module I wrote for
// gjs, which was based on the Class system in MooTools.

(function(exports) {
    "use strict";

    // Similar to "super()" in Java, this is installed on a class's prototype,
    // usable in method implementations like "this.parent();" to call the
    // method on the parent instance.
    function _parent() {
        if (!this.__caller__)
            throw new TypeError("The method 'parent' cannot be called");

        var caller = this.__caller__;
        var name = caller._name;
        var parent = caller._owner.__super__;

        var previous = parent ? parent.prototype[name] : undefined;

        if (!previous)
            throw new TypeError("The method '" + name + "' is not on the superclass");

        return previous.apply(this, arguments);
    }

    // The "this.parent();" method works by wrapping every single method
    // to save the method that we called to get here, along with the owner
    // for every method, allowing us to chain up easily.
    function wrapFunction(obj, name, meth) {
        if (meth._origin) meth = meth._origin;

        function wrapper() {
            var oldCaller = this.__caller__;
            this.__caller__ = wrapper;
            var result = meth.apply(this, arguments);
            this.__caller__ = oldCaller;
            return result;
        }

        wrapper._origin = meth;
        wrapper._name = name;
        wrapper._owner = obj;

        return wrapper;
    }

    function Class(params) {
        var newClass = function() {
            if (this.initialize)
                this.initialize.apply(this, arguments);
        };

        var parent = params.Extends;
        if (parent) {
            newClass.__super__ = parent;
            newClass.prototype = Object.create(parent.prototype);
        }

        for (var prop in params) {
            var value = params[prop];

            if (typeof value === 'function')
                value = wrapFunction(newClass, prop, value);

            newClass.prototype[prop] = value;
        }

        newClass.prototype.constructor = newClass;
        newClass.prototype.parent = _parent;

        return newClass;
    };

    exports.Class = Class;

})(window);
