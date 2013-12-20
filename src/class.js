(function(exports) {
	"use strict";

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

	function wrapFunction(obj, name, meth) {
		if (meth._origin) meth = meth._origin;

	    function wrapper() {
	        this.__caller__ = wrapper;
	        var result = meth.apply(this, arguments);
	        this.__caller__ = null;
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
