(function(exports) {
    "use strict";

    function repeat(x, n) {
        var L = [];
        for (var i = 0; i < n; i++)
            L.push(x);
        return L;
    }

    function StructWrapper(props) {
        var type = props.StructName;
        var typeInfo = Runtime.typeInfo['%struct.' + type];
        var size = typeInfo.flatSize;

        var fieldNames = props.Fields;
        if (typeInfo.fields.length != fieldNames.length)
            throw new Error("Invalid fields");

        var constructor = function(ptr) {
            this.$internal = ptr;
        };
        constructor.type = type;
        constructor.typeInfo = typeInfo;
        constructor.size = typeInfo.flatSize;

        var descs = {};

        fieldNames.forEach(function(name, i) {
            var off = typeInfo.flatIndexes[i];
            var type = typeInfo.fields[i];
            descs[name] = { get: function() {
                return getValue(this.$internal + off, type);
            } };
        });

        Object.defineProperties(constructor.prototype, descs);

        return constructor;
    }

    function TypeWrapper(props) {
        var type = props.TypeName;
        var typeInfo = Runtime.typeInfo['%struct.' + type];
        var size = typeInfo.flatSize;

        var init = props.Initialize;
        var finalize = props.Finalize;

        var constructor = function() {
            this.__construct__();
            this.__init__();
        };

        constructor.type = type;
        constructor.typeInfo = typeInfo;
        constructor.size = size;

        var proto = constructor.prototype;
        props.AutoBind.forEach(function(desc) {
            var name = desc.name;
            var args = ['this'].concat(desc.args);
            var nargs = args.length;

            var cname = type + '_' + name.replace(/^_/, '');
            proto[name] = function() {
                var args = [].slice.call(arguments);
                args.unshift(this);
                args = args.map(function(x) {
                    if (x.$internal)
                        return x.$internal;
                    else
                        return x;
                });
                if (args.length != nargs)
                    throw new Error("Invalid number of args to " + cname);

                return ccall(cname, 'number', repeat('number', nargs), args);
            };
        });

        proto.__init__ = function() {
            this[init].apply(this, arguments);
        };

        proto.__construct__ = function() {
            this.$internal = _malloc(size);
        };

        proto.finalize = function() {
            this[finalize].apply(this, arguments);
            _free(this.$internal);
        };

        return constructor;
    }

    var Box = new StructWrapper({
        StructName: 'pixman_box32',
        Fields: ['x1', 'y1', 'x2', 'y2']
    });
    Object.defineProperties(Box.prototype, {
        x: { get: function() { return this.x1; } },
        y: { get: function() { return this.y1; } },
        width: { get: function() { return this.x2 - this.x1; } },
        height: { get: function() { return this.y2 - this.y1; } },
    });
    Box.prototype.toString = function() {
        return "+{x}+{y}x{width}x{height}".replace(/{(\w+)}/g, (function(match, name) {
            return this[name];
        }).bind(this));
    };

    var Region = new TypeWrapper({
        TypeName: 'pixman_region32',
        Initialize: 'init',
        Finalize: 'fini',
        AutoBind: [
            {name: "init", args: []},
            {name: "init_rect", args: ["x", "y", "width", "height"]},
            {name: "fini", args: []},
            {name: "clear", args: []},
            {name: "copy", args: ["source"]},
            {name: "translate", args: ["x", "y"]},
            {name: "union", args: ["r1", "r2"]},
            {name: "union_rect", args: ["source", "x", "y", "width", "height"]},
            {name: "intersect", args: ["r1", "r2"]},
            {name: "intersect_rect", args: ["source", "x", "y", "width", "height"]},
            {name: "subtract", args: ["r1", "r2"]},
            {name: "n_rects", args: []},
            {name: "not_empty", args: []},
            {name: "contains_point", args: ["x", "y"]},
            {name: "_rectangles", args: []},
            {name: "_extents", args: []},
        ]
    });
    Region.prototype.iter_rectangles = function(callback) {
        var ptr = this._rectangles();
        var size = Box.size;
        var end = ptr + this.n_rects() * size;
        for (; ptr < end; ptr += size) {
            callback(new Box(ptr));
        }
    };
    Region.prototype.get_rectangle = function(idx) {
        return new Box(this._rectangles() + Box.size*idx);
    };
    Region.prototype.extents = function() {
        return new Box(this._extents());
    };
    Region.prototype.is_empty = function() {
        return !this.not_empty();
    };
    Region.prototype.toString = function() {
        if (this.is_empty())
            return "[]";

        var S = "[";
        this.iter_rectangles(function(rect) {
            S += rect + ", ";
        });
        S = S.slice(0, -2) + "]";
        return S;
    };

    exports.Region = Region;

})(window);
