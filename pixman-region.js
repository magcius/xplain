// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}

if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  Module['load'] = importScripts;
}

if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  BITSHIFT64_SHL: 0,
  BITSHIFT64_ASHR: 1,
  BITSHIFT64_LSHR: 2,
  bitshift64: function (low, high, op, bits) {
    var ret;
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
          break;
      }
    } else if (bits == 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [high, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high, 0];
          break;
      }
    } else { // bits > 32
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low << (bits - 32)];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high >>>  (bits - 32) , 0];
          break;
      }
    }
    HEAP32[tempDoublePtr>>2] = ret[0]; // cannot use utility functions since we are in runtime itself
    HEAP32[tempDoublePtr+4>>2] = ret[1];
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}







//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// Simple unoptimized memset - necessary during startup
var _memset = function(ptr, value, num) {
  var stop = ptr + num;
  while (ptr < stop) {
    HEAP8[((ptr++)|0)]=value;
  }
}

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    _memset(ret, 0, size);
    return ret;
  }

  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }

  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var utf8 = new Runtime.UTF8Processor();
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (nullTerminated && t == 0) break;
    ret += utf8.processCChar(t);
    i += 1;
    if (!nullTerminated && i == length) break;
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max

var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY

var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

// === Body ===



assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);

STATICTOP += 2516;

assert(STATICTOP < TOTAL_MEMORY);

var _stderr;







































var __ZTVSt9exception;


var __ZTVN10__cxxabiv120__si_class_type_infoE;


var __ZTISt9exception;




var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
var __ZNSt20bad_array_new_lengthC1Ev;
var __ZNSt20bad_array_new_lengthD1Ev;
var __ZNSt20bad_array_new_lengthD2Ev;
allocate(8, "i8", ALLOC_NONE, 5242880);
allocate(16, "i8", ALLOC_NONE, 5242888);
allocate(8, "i8", ALLOC_NONE, 5242904);
allocate(24, "i8", ALLOC_NONE, 5242912);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,50,45,62,120,49,32,119,97,115,32,102,97,108,115,101,0] /* The expression x1 _  */, "i8", ALLOC_NONE, 5242936);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,38,38,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0] /* The expression r1 != */, "i8", ALLOC_NONE, 5242976);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,121,49,32,60,32,121,50,32,119,97,115,32,102,97,108,115,101,0] /* The expression y1 _  */, "i8", ALLOC_NONE, 5243032);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,117,109,82,101,99,116,115,32,61,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,45,32,99,117,114,95,115,116,97,114,116,32,119,97,115,32,102,97,108,115,101,0] /* The expression numRe */, "i8", ALLOC_NONE, 5243068);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,71,79,79,68,95,82,69,67,84,32,40,98,111,120,41,32,119,97,115,32,102,97,108,115,101,0] /* The expression GOOD_ */, "i8", ALLOC_NONE, 5243140);
allocate([73,110,118,97,108,105,100,32,114,101,99,116,97,110,103,108,101,32,112,97,115,115,101,100,0] /* Invalid rectangle pa */, "i8", ALLOC_NONE, 5243184);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5243212);
allocate([10,0] /* \0A\00 */, "i8", ALLOC_NONE, 5243228);
allocate([105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* in use bytes     = % */, "i8", ALLOC_NONE, 5243232);
allocate([37,100,32,37,100,32,37,100,32,37,100,32,10,0] /* %d %d %d %d \0A\00 */, "i8", ALLOC_NONE, 5243260);
allocate([109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0] /* max system bytes = % */, "i8", ALLOC_NONE, 5243276);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,45,62,120,49,32,60,32,114,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0] /* The expression r-_x1 */, "i8", ALLOC_NONE, 5243304);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,101,119,95,114,101,99,116,115,32,33,61,32,48,32,119,97,115,32,102,97,108,115,101,0] /* The expression new_r */, "i8", ALLOC_NONE, 5243344);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0] /* The expression r2 != */, "i8", ALLOC_NONE, 5243384);
allocate([98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* bad_array_new_length */, "i8", ALLOC_NONE, 5243424);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0] /* The expression r1 != */, "i8", ALLOC_NONE, 5243448);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,50,32,119,97,115,32,102,97,108,115,101,0] /* The expression regio */, "i8", ALLOC_NONE, 5243488);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,50,32,119,97,115,32,102,97,108,115,101,0] /* The expression regio */, "i8", ALLOC_NONE, 5243556);
allocate([115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* system bytes     = % */, "i8", ALLOC_NONE, 5243624);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,49,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0] /* The expression x1 _  */, "i8", ALLOC_NONE, 5243652);
allocate([84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,60,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,115,105,122,101,32,119,97,115,32,102,97,108,115,101,0] /* The expression regio */, "i8", ALLOC_NONE, 5243692);
allocate([101,120,116,101,110,116,115,58,32,37,100,32,37,100,32,37,100,32,37,100,10,0] /* extents: %d %d %d %d */, "i8", ALLOC_NONE, 5243764);
allocate([110,117,109,58,32,37,100,32,115,105,122,101,58,32,37,100,10,0] /* num: %d size: %d\0A\ */, "i8", ALLOC_NONE, 5243788);
allocate(468, "i8", ALLOC_NONE, 5243808);
allocate([118,111,105,100,32,112,105,120,109,97,110,95,115,101,116,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,41,0] /* void pixman_set_exte */, "i8", ALLOC_NONE, 5244276);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,117,110,105,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5244320);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,115,117,98,116,114,97,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5244440);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,105,110,116,101,114,115,101,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5244564);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,97,112,112,101,110,100,95,110,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5244688);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,117,110,105,111,110,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5244784);
allocate([118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,114,101,115,101,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0] /* void pixman_region32 */, "i8", ALLOC_NONE, 5244900);
allocate([118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,119,105,116,104,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0] /* void pixman_region32 */, "i8", ALLOC_NONE, 5244960);
allocate([118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0] /* void pixman_region32 */, "i8", ALLOC_NONE, 5245032);
allocate([112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,111,112,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,111,118,101,114,108,97,112,95,112,114,111,99,95,112,116,114,44,32,105,110,116,44,32,105,110,116,41,0] /* pixman_bool_t pixman */, "i8", ALLOC_NONE, 5245120);
allocate([105,110,116,32,112,105,120,109,97,110,95,99,111,97,108,101,115,99,101,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0] /* int pixman_coalesce( */, "i8", ALLOC_NONE, 5245224);
allocate([0,0,0,0,180,9,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245272);
allocate(1, "i8", ALLOC_NONE, 5245292);
allocate([0,0,0,0,192,9,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245296);
allocate(1, "i8", ALLOC_NONE, 5245316);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5245320);
allocate([83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* St20bad_array_new_le */, "i8", ALLOC_NONE, 5245336);
allocate(12, "i8", ALLOC_NONE, 5245364);
allocate([0,0,0,0,0,0,0,0,180,9,80,0], "i8", ALLOC_NONE, 5245376);
allocate(1, "i8", ALLOC_NONE, 5245388);
allocate(4, "i8", ALLOC_NONE, 5245392);
HEAP32[((5245280)>>2)]=(20);
HEAP32[((5245284)>>2)]=(16);
HEAP32[((5245288)>>2)]=(8);
HEAP32[((5245304)>>2)]=(20);
HEAP32[((5245308)>>2)]=(4);
HEAP32[((5245312)>>2)]=(12);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([2,0,0,0], "i8", ALLOC_STATIC);
HEAP32[((5245364)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5245368)>>2)]=((5245320)|0);
HEAP32[((5245372)>>2)]=__ZTISt9exception;
HEAP32[((5245376)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5245380)>>2)]=((5245336)|0);
__ZNSt9bad_allocC1Ev = 14;
__ZNSt9bad_allocD1Ev = 20;
__ZNSt20bad_array_new_lengthC1Ev = 2;
__ZNSt20bad_array_new_lengthD1Ev = (20);
__ZNSt20bad_array_new_lengthD2Ev = (20);

  
  
  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
  
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
    
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
    
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
    
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
    
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
    
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.ensureObjects();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 'l'.charCodeAt(0)) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            var origArg = currArg;
            var argText;
            // Flatten i64-1 [low, high] into a (slightly rounded) double
            if (argSize == 8) {
              currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 'u'.charCodeAt(0));
            }
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
              if (argSize == 8 && i64Math) argText = (origArg[1]>>>0).toString(16) + (origArg[0]>>>0).toString(16); else
              if (currArg < 0) {
                // Represent negative numbers in hex as 2's complement.
                currArg = -currArg;
                argText = (currAbsArg - 1).toString(16);
                var buffer = [];
                for (var i = 0; i < argText.length; i++) {
                  buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                }
                argText = buffer.join('');
                while (argText.length < argSize * 2) argText = 'f' + argText;
              } else {
                argText = currAbsArg.toString(16);
              }
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
              if (currAbsArg === 0) {
                argText = '(nil)';
              } else {
                prefix = '0x';
                argText = currAbsArg.toString(16);
              }
            }
            if (precisionSet) {
              while (argText.length < precision) {
                argText = '0' + argText;
              }
            }
  
            // Add sign if needed
            if (flagAlwaysSigned) {
              if (currArg < 0) {
                prefix = '-' + prefix;
              } else {
                prefix = '+' + prefix;
              }
            }
  
            // Add padding.
            while (prefix.length + argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad) {
                  argText = '0' + argText;
                } else {
                  prefix = ' ' + prefix;
                }
              }
            }
  
            // Insert the result into the buffer.
            argText = prefix + argText;
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg('double');
            var argText;
  
            if (isNaN(currArg)) {
              argText = 'nan';
              flagZeroPad = false;
            } else if (!isFinite(currArg)) {
              argText = (currArg < 0 ? '-' : '') + 'inf';
              flagZeroPad = false;
            } else {
              var isGeneral = false;
              var effectivePrecision = Math.min(precision, 20);
  
              // Convert g/G to f/F or e/E, as per:
              // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
              }
  
              var parts = argText.split('e');
              if (isGeneral && !flagAlternative) {
                // Discard trailing zeros and periods.
                while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                       (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                  parts[0] = parts[0].slice(0, -1);
                }
              } else {
                // Make sure we have a period in alternative mode.
                if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                // Zero pad until required precision.
                while (precision > effectivePrecision++) parts[0] += '0';
              }
              argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
              // Capitalize 'E' if needed.
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
              // Add sign.
              if (flagAlwaysSigned && currArg >= 0) {
                argText = '+' + argText;
              }
            }
  
            // Add padding.
            while (argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                  argText = argText[0] + '0' + argText.slice(1);
                } else {
                  argText = (flagZeroPad ? '0' : ' ') + argText;
                }
              }
            }
  
            // Adjust case.
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*') || nullString;
            var argLength = _strlen(arg);
            if (precisionSet) argLength = Math.min(argLength, precision);
            if (!flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            for (var i = 0; i < argLength; i++) {
              ret.push(HEAPU8[((arg++)|0)]);
            }
            if (flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP32[((ptr)>>2)]=ret.length
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP8[(i)]);
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
var __pixman_log_error; // stub for __pixman_log_error

  
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num);
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if (num|0 >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }

  function ___gxx_personality_v0() {
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return (tempRet0 = typeArray[i],thrown);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return (tempRet0 = throwntype,thrown);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }

  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }

  
  function ___cxa_free_exception(ptr) {
      return _free(ptr);
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      __THREW__ = 0;
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }

  function __ZNSt9exceptionD2Ev(){}

  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }





  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],ensureObjects:function () {
        if (Browser.ensured) return;
        Browser.ensured = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
  
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false,
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},requestFullScreen:function () {
        var canvas = Module['canvas'];
        function fullScreenChange() {
          var isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                        canvas['mozRequestPointerLock'] ||
                                        canvas['webkitRequestPointerLock'];
            canvas.requestPointerLock();
            isFullScreen = true;
          }
          if (Module['onFullScreen']) Module['onFullScreen'](isFullScreen);
        }
  
        document.addEventListener('fullscreenchange', fullScreenChange, false);
        document.addEventListener('mozfullscreenchange', fullScreenChange, false);
        document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  


var FUNCTION_TABLE = [0,0,__ZNSt20bad_array_new_lengthC2Ev,0,__ZNSt20bad_array_new_lengthD0Ev,0,_pixman_region_subtract_o,0,__ZNKSt9bad_alloc4whatEv,0,_pixman_region_intersect_o,0,__ZNKSt20bad_array_new_length4whatEv,0,__ZNSt9bad_allocC2Ev,0,__ZNSt9bad_allocD0Ev,0,_pixman_region_union_o,0,__ZNSt9bad_allocD2Ev,0];

function _pixman_region32_equal($reg1, $reg2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $reg1 | 0;
    var $2 = $reg1 | 0;
    var $3 = HEAP32[$2 >> 2];
    var $4 = $reg2 | 0;
    var $5 = $reg2 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($3 | 0) == ($6 | 0);
    if ($7) {
      label = 3;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 3:
    var $9 = $reg1 + 8 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $reg2 + 8 | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = ($10 | 0) == ($12 | 0);
    if ($13) {
      label = 4;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 4:
    var $15 = $reg1 + 4 | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = $reg2 + 4 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($16 | 0) == ($18 | 0);
    if ($19) {
      label = 5;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 5:
    var $21 = $reg1 + 12 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = $reg2 + 12 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = ($22 | 0) == ($24 | 0);
    if ($25) {
      label = 6;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 6:
    var $27 = $reg1 + 16 | 0;
    var $28 = HEAP32[$27 >> 2];
    var $29 = ($28 | 0) == 0;
    if ($29) {
      var $34 = 1;
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $31 = $28 + 4 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $34 = $32;
    label = 8;
    break;
   case 8:
    var $34;
    var $35 = $reg2 + 16 | 0;
    var $36 = HEAP32[$35 >> 2];
    var $37 = ($36 | 0) == 0;
    if ($37) {
      var $42 = 1;
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $39 = $36 + 4 | 0;
    var $40 = HEAP32[$39 >> 2];
    var $42 = $40;
    label = 10;
    break;
   case 10:
    var $42;
    var $43 = ($34 | 0) == ($42 | 0);
    if ($43) {
      label = 11;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 11:
    var $45 = HEAP32[$27 >> 2];
    var $46 = ($45 | 0) == 0;
    if ($46) {
      var $51 = $1;
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $48 = $45 + 8 | 0;
    var $49 = $48;
    var $51 = $49;
    label = 13;
    break;
   case 13:
    var $51;
    var $52 = HEAP32[$35 >> 2];
    var $53 = ($52 | 0) == 0;
    if ($53) {
      var $58 = $4;
      label = 15;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $55 = $52 + 8 | 0;
    var $56 = $55;
    var $58 = $56;
    label = 15;
    break;
   case 15:
    var $58;
    var $59 = HEAP32[$27 >> 2];
    var $60 = ($59 | 0) == 0;
    var $61 = $59 + 4 | 0;
    var $i_0 = 0;
    label = 16;
    break;
   case 16:
    var $i_0;
    if ($60) {
      var $66 = 1;
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $64 = HEAP32[$61 >> 2];
    var $66 = $64;
    label = 18;
    break;
   case 18:
    var $66;
    var $67 = ($i_0 | 0) == ($66 | 0);
    if ($67) {
      var $_0 = 1;
      label = 23;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $69 = $51 + ($i_0 << 4) | 0;
    var $70 = HEAP32[$69 >> 2];
    var $71 = $58 + ($i_0 << 4) | 0;
    var $72 = HEAP32[$71 >> 2];
    var $73 = ($70 | 0) == ($72 | 0);
    if ($73) {
      label = 20;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 20:
    var $75 = $51 + ($i_0 << 4) + 8 | 0;
    var $76 = HEAP32[$75 >> 2];
    var $77 = $58 + ($i_0 << 4) + 8 | 0;
    var $78 = HEAP32[$77 >> 2];
    var $79 = ($76 | 0) == ($78 | 0);
    if ($79) {
      label = 21;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 21:
    var $81 = $51 + ($i_0 << 4) + 4 | 0;
    var $82 = HEAP32[$81 >> 2];
    var $83 = $58 + ($i_0 << 4) + 4 | 0;
    var $84 = HEAP32[$83 >> 2];
    var $85 = ($82 | 0) == ($84 | 0);
    if ($85) {
      label = 22;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 22:
    var $87 = $51 + ($i_0 << 4) + 12 | 0;
    var $88 = HEAP32[$87 >> 2];
    var $89 = $58 + ($i_0 << 4) + 12 | 0;
    var $90 = HEAP32[$89 >> 2];
    var $91 = ($88 | 0) == ($90 | 0);
    var $92 = $i_0 + 1 | 0;
    if ($91) {
      var $i_0 = $92;
      label = 16;
      break;
    } else {
      var $_0 = 0;
      label = 23;
      break;
    }
   case 23:
    var $_0;
    return $_0;
  }
}
_pixman_region32_equal["X"] = 1;
function _pixman_region32_n_rects($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $8 = 1;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $8 = $6;
    label = 4;
    break;
   case 4:
    var $8;
    return $8;
  }
}
function _pixman_region32_rectangles($region, $n_rects) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($n_rects | 0) == 0;
    if ($1) {
      label = 6;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $3 = $region + 16 | 0;
    var $4 = HEAP32[$3 >> 2];
    var $5 = ($4 | 0) == 0;
    if ($5) {
      var $10 = 1;
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $7 = $4 + 4 | 0;
    var $8 = HEAP32[$7 >> 2];
    var $10 = $8;
    label = 5;
    break;
   case 5:
    var $10;
    HEAP32[$n_rects >> 2] = $10;
    label = 6;
    break;
   case 6:
    var $12 = $region + 16 | 0;
    var $13 = HEAP32[$12 >> 2];
    var $14 = ($13 | 0) == 0;
    if ($14) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $16 = $13 + 8 | 0;
    var $17 = $16;
    var $21 = $17;
    label = 9;
    break;
   case 8:
    var $19 = $region | 0;
    var $21 = $19;
    label = 9;
    break;
   case 9:
    var $21;
    return $21;
  }
}
function _pixman_region32_print($rgn) {
  var label = 0;
  var __stackBase__ = STACKTOP;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $rgn + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $15 = 1;
      var $14 = 0;
      label = 6;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $_pr = HEAP32[$1 >> 2];
    var $7 = ($_pr | 0) == 0;
    if ($7) {
      var $15 = $6;
      var $14 = 0;
      label = 6;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $8 = $_pr | 0;
    var $9 = HEAP32[$8 >> 2];
    var $_pr21_pr = HEAP32[$1 >> 2];
    var $10 = ($_pr21_pr | 0) == 0;
    if ($10) {
      var $15 = $6;
      var $14 = $9;
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $12 = $_pr21_pr + 8 | 0;
    var $13 = $12;
    var $20 = $13;
    var $19 = $6;
    var $18 = $9;
    label = 7;
    break;
   case 6:
    var $14;
    var $15;
    var $16 = $rgn | 0;
    var $20 = $16;
    var $19 = $15;
    var $18 = $14;
    label = 7;
    break;
   case 7:
    var $18;
    var $19;
    var $20;
    var $21 = HEAP32[_stderr >> 2];
    var $22 = _fprintf($21, 5243788, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $19, HEAP32[tempInt + 4 >> 2] = $18, tempInt));
    var $23 = HEAP32[_stderr >> 2];
    var $24 = $rgn | 0;
    var $25 = HEAP32[$24 >> 2];
    var $26 = $rgn + 4 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $28 = $rgn + 8 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $30 = $rgn + 12 | 0;
    var $31 = HEAP32[$30 >> 2];
    var $32 = _fprintf($23, 5243764, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $25, HEAP32[tempInt + 4 >> 2] = $27, HEAP32[tempInt + 8 >> 2] = $29, HEAP32[tempInt + 12 >> 2] = $31, tempInt));
    var $33 = ($19 | 0) > 0;
    var $34 = HEAP32[_stderr >> 2];
    if ($33) {
      var $i_023 = 0;
      var $35 = $34;
      label = 8;
      break;
    } else {
      var $_lcssa = $34;
      label = 9;
      break;
    }
   case 8:
    var $35;
    var $i_023;
    var $36 = $20 + ($i_023 << 4) | 0;
    var $37 = HEAP32[$36 >> 2];
    var $38 = $20 + ($i_023 << 4) + 4 | 0;
    var $39 = HEAP32[$38 >> 2];
    var $40 = $20 + ($i_023 << 4) + 8 | 0;
    var $41 = HEAP32[$40 >> 2];
    var $42 = $20 + ($i_023 << 4) + 12 | 0;
    var $43 = HEAP32[$42 >> 2];
    var $44 = _fprintf($35, 5243260, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $37, HEAP32[tempInt + 4 >> 2] = $39, HEAP32[tempInt + 8 >> 2] = $41, HEAP32[tempInt + 12 >> 2] = $43, tempInt));
    var $45 = $i_023 + 1 | 0;
    var $46 = HEAP32[_stderr >> 2];
    var $exitcond = ($45 | 0) == ($19 | 0);
    if ($exitcond) {
      var $_lcssa = $46;
      label = 9;
      break;
    } else {
      var $i_023 = $45;
      var $35 = $46;
      label = 8;
      break;
    }
   case 9:
    var $_lcssa;
    var $fputc = _fputc(10, $_lcssa);
    STACKTOP = __stackBase__;
    return $19;
  }
}
_pixman_region32_print["X"] = 1;
function _pixman_region32_init($region) {
  var $1 = $region;
  HEAP32[$1 >> 2] = 0;
  HEAP32[$1 + 4 >> 2] = 0;
  HEAP32[$1 + 8 >> 2] = 0;
  HEAP32[$1 + 12 >> 2] = 0;
  HEAP32[$region + 16 >> 2] = 5242880;
  return;
}
function _pixman_region32_init_rect($region, $x, $y, $width, $height) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region | 0;
    HEAP32[$1 >> 2] = $x;
    var $2 = $region + 4 | 0;
    HEAP32[$2 >> 2] = $y;
    var $3 = $width + $x | 0;
    var $4 = $region + 8 | 0;
    HEAP32[$4 >> 2] = $3;
    var $5 = $height + $y | 0;
    var $6 = $region + 12 | 0;
    HEAP32[$6 >> 2] = $5;
    var $7 = HEAP32[$1 >> 2];
    var $8 = HEAP32[$4 >> 2];
    var $9 = ($7 | 0) < ($8 | 0);
    if ($9) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $11 = HEAP32[$2 >> 2];
    var $12 = ($11 | 0) < ($5 | 0);
    if ($12) {
      label = 8;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $14 = HEAP32[$1 >> 2];
    var $15 = HEAP32[$4 >> 2];
    var $16 = ($14 | 0) > ($15 | 0);
    if ($16) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $18 = HEAP32[$2 >> 2];
    var $19 = HEAP32[$6 >> 2];
    var $20 = ($18 | 0) > ($19 | 0);
    if ($20) {
      label = 6;
      break;
    } else {
      label = 7;
      break;
    }
   case 6:
    __pixman_log_error(5245032, 5243184);
    label = 7;
    break;
   case 7:
    _pixman_region32_init($region);
    label = 9;
    break;
   case 8:
    var $24 = $region + 16 | 0;
    HEAP32[$24 >> 2] = 0;
    label = 9;
    break;
   case 9:
    return;
  }
}
function _pixman_region32_init_with_extents($region, $extents) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $extents | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = $extents + 8 | 0;
    var $4 = HEAP32[$3 >> 2];
    var $5 = ($2 | 0) < ($4 | 0);
    if ($5) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $7 = $extents + 4 | 0;
    var $8 = HEAP32[$7 >> 2];
    var $9 = $extents + 12 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($8 | 0) < ($10 | 0);
    if ($11) {
      label = 8;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $13 = HEAP32[$1 >> 2];
    var $14 = HEAP32[$3 >> 2];
    var $15 = ($13 | 0) > ($14 | 0);
    if ($15) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $17 = $extents + 4 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = $extents + 12 | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = ($18 | 0) > ($20 | 0);
    if ($21) {
      label = 6;
      break;
    } else {
      label = 7;
      break;
    }
   case 6:
    __pixman_log_error(5244960, 5243184);
    label = 7;
    break;
   case 7:
    _pixman_region32_init($region);
    label = 9;
    break;
   case 8:
    var $25 = $region;
    var $26 = $extents;
    HEAP32[$25 >> 2] = HEAP32[$26 >> 2];
    HEAP32[$25 + 4 >> 2] = HEAP32[$26 + 4 >> 2];
    HEAP32[$25 + 8 >> 2] = HEAP32[$26 + 8 >> 2];
    HEAP32[$25 + 12 >> 2] = HEAP32[$26 + 12 >> 2];
    var $27 = $region + 16 | 0;
    HEAP32[$27 >> 2] = 0;
    label = 9;
    break;
   case 9:
    return;
  }
}
function _pixman_region32_fini($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $2;
    _free($9);
    label = 5;
    break;
   case 5:
    return;
  }
}
function _pixman_region32_copy($dst, $src) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($dst | 0) == ($src | 0);
    if ($1) {
      var $_0 = 1;
      label = 18;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $3 = $dst;
    var $4 = $src;
    HEAP32[$3 >> 2] = HEAP32[$4 >> 2];
    HEAP32[$3 + 4 >> 2] = HEAP32[$4 + 4 >> 2];
    HEAP32[$3 + 8 >> 2] = HEAP32[$4 + 8 >> 2];
    HEAP32[$3 + 12 >> 2] = HEAP32[$4 + 12 >> 2];
    var $5 = $src + 16 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $6 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($10 | 0) == 0;
    if ($11) {
      label = 5;
      break;
    } else {
      label = 9;
      break;
    }
   case 5:
    var $13 = $dst + 16 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($14 | 0) == 0;
    if ($15) {
      label = 8;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $17 = $14 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($18 | 0) == 0;
    if ($19) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $21 = $14;
    _free($21);
    label = 8;
    break;
   case 8:
    var $23 = HEAP32[$5 >> 2];
    HEAP32[$13 >> 2] = $23;
    var $_0 = 1;
    label = 18;
    break;
   case 9:
    var $25 = $dst + 16 | 0;
    var $26 = HEAP32[$25 >> 2];
    var $27 = ($26 | 0) == 0;
    if ($27) {
      label = 14;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $29 = $26 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = $6 + 4 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = ($30 | 0) < ($32 | 0);
    if ($33) {
      label = 11;
      break;
    } else {
      label = 17;
      break;
    }
   case 11:
    var $_pr = HEAP32[$25 >> 2];
    var $35 = ($_pr | 0) == 0;
    if ($35) {
      label = 14;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $37 = $_pr | 0;
    var $38 = HEAP32[$37 >> 2];
    var $39 = ($38 | 0) == 0;
    if ($39) {
      label = 14;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $41 = $_pr;
    _free($41);
    label = 14;
    break;
   case 14:
    var $42 = HEAP32[$5 >> 2];
    var $43 = $42 + 4 | 0;
    var $44 = HEAP32[$43 >> 2];
    var $45 = _alloc_data($44);
    HEAP32[$25 >> 2] = $45;
    var $46 = ($45 | 0) == 0;
    if ($46) {
      label = 15;
      break;
    } else {
      label = 16;
      break;
    }
   case 15:
    _pixman_break($dst);
    var $_0 = 0;
    label = 18;
    break;
   case 16:
    var $49 = HEAP32[$5 >> 2];
    var $50 = $49 + 4 | 0;
    var $51 = HEAP32[$50 >> 2];
    var $52 = $45 | 0;
    HEAP32[$52 >> 2] = $51;
    label = 17;
    break;
   case 17:
    var $54 = HEAP32[$5 >> 2];
    var $55 = $54 + 4 | 0;
    var $56 = HEAP32[$55 >> 2];
    var $57 = HEAP32[$25 >> 2];
    var $58 = $57 + 4 | 0;
    HEAP32[$58 >> 2] = $56;
    var $59 = HEAP32[$25 >> 2];
    var $60 = $59 + 8 | 0;
    var $61 = $60;
    var $62 = HEAP32[$5 >> 2];
    var $63 = $62 + 8 | 0;
    var $64 = $63;
    var $65 = $59 + 4 | 0;
    var $66 = HEAP32[$65 >> 2];
    var $67 = $66 << 4;
    _memmove($61, $64, $67, 1, 0);
    var $_0 = 1;
    label = 18;
    break;
   case 18:
    var $_0;
    return $_0;
  }
}
_pixman_region32_copy["X"] = 1;
function _alloc_data($n) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = _PIXREGION_SZOF($n);
    var $2 = ($1 | 0) == 0;
    if ($2) {
      var $_0 = 0;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $4 = _malloc($1);
    var $5 = $4;
    var $_0 = $5;
    label = 4;
    break;
   case 4:
    var $_0;
    return $_0;
  }
}
function _pixman_break($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $2;
    _free($9);
    label = 5;
    break;
   case 5:
    var $11 = $region;
    HEAP32[$11 >> 2] = 0;
    HEAP32[$11 + 4 >> 2] = 0;
    HEAP32[$11 + 8 >> 2] = 0;
    HEAP32[$11 + 12 >> 2] = 0;
    HEAP32[$1 >> 2] = 5242904;
    return;
  }
}
function _pixman_region32_intersect($new_reg, $reg1, $reg2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $reg1 + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 10;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $reg2 + 16 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($10 | 0) == 0;
    if ($11) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $13 = $10 + 4 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($14 | 0) == 0;
    if ($15) {
      label = 10;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $17 = $reg1 + 8 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = $reg2 | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = ($18 | 0) > ($20 | 0);
    if ($21) {
      label = 7;
      break;
    } else {
      label = 10;
      break;
    }
   case 7:
    var $23 = $reg1 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = $reg2 + 8 | 0;
    var $26 = HEAP32[$25 >> 2];
    var $27 = ($24 | 0) < ($26 | 0);
    if ($27) {
      label = 8;
      break;
    } else {
      label = 10;
      break;
    }
   case 8:
    var $29 = $reg1 + 12 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = $reg2 + 4 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = ($30 | 0) > ($32 | 0);
    if ($33) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    var $35 = $reg1 + 4 | 0;
    var $36 = HEAP32[$35 >> 2];
    var $37 = $reg2 + 12 | 0;
    var $38 = HEAP32[$37 >> 2];
    var $39 = ($36 | 0) < ($38 | 0);
    if ($39) {
      label = 17;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $41 = $new_reg + 16 | 0;
    var $42 = HEAP32[$41 >> 2];
    var $43 = ($42 | 0) == 0;
    if ($43) {
      label = 13;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $45 = $42 | 0;
    var $46 = HEAP32[$45 >> 2];
    var $47 = ($46 | 0) == 0;
    if ($47) {
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $49 = $42;
    _free($49);
    label = 13;
    break;
   case 13:
    var $51 = $new_reg | 0;
    var $52 = HEAP32[$51 >> 2];
    var $53 = $new_reg + 8 | 0;
    HEAP32[$53 >> 2] = $52;
    var $54 = $new_reg + 4 | 0;
    var $55 = HEAP32[$54 >> 2];
    var $56 = $new_reg + 12 | 0;
    HEAP32[$56 >> 2] = $55;
    var $57 = HEAP32[$1 >> 2];
    var $58 = ($57 | 0) == 5242904;
    if ($58) {
      label = 15;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $60 = $reg2 + 16 | 0;
    var $61 = HEAP32[$60 >> 2];
    var $62 = ($61 | 0) == 5242904;
    if ($62) {
      label = 15;
      break;
    } else {
      label = 16;
      break;
    }
   case 15:
    HEAP32[$41 >> 2] = 5242904;
    var $_0 = 0;
    label = 39;
    break;
   case 16:
    HEAP32[$41 >> 2] = 5242880;
    var $_0 = 1;
    label = 39;
    break;
   case 17:
    var $66 = HEAP32[$1 >> 2];
    var $67 = ($66 | 0) == 0;
    var $68 = HEAP32[$9 >> 2];
    var $69 = ($68 | 0) == 0;
    if ($67) {
      label = 18;
      break;
    } else {
      label = 23;
      break;
    }
   case 18:
    if ($69) {
      label = 19;
      break;
    } else {
      label = 29;
      break;
    }
   case 19:
    var $72 = ($24 | 0) > ($20 | 0);
    var $_ = $72 ? $24 : $20;
    var $73 = $new_reg | 0;
    HEAP32[$73 >> 2] = $_;
    var $74 = HEAP32[$35 >> 2];
    var $75 = HEAP32[$31 >> 2];
    var $76 = ($74 | 0) > ($75 | 0);
    var $77 = $76 ? $74 : $75;
    var $78 = $new_reg + 4 | 0;
    HEAP32[$78 >> 2] = $77;
    var $79 = HEAP32[$17 >> 2];
    var $80 = HEAP32[$25 >> 2];
    var $81 = ($79 | 0) < ($80 | 0);
    var $_78 = $81 ? $79 : $80;
    var $82 = $new_reg + 8 | 0;
    HEAP32[$82 >> 2] = $_78;
    var $83 = HEAP32[$29 >> 2];
    var $84 = HEAP32[$37 >> 2];
    var $85 = ($83 | 0) < ($84 | 0);
    var $86 = $85 ? $83 : $84;
    var $87 = $new_reg + 12 | 0;
    HEAP32[$87 >> 2] = $86;
    var $88 = $new_reg + 16 | 0;
    var $89 = HEAP32[$88 >> 2];
    var $90 = ($89 | 0) == 0;
    if ($90) {
      label = 22;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    var $92 = $89 | 0;
    var $93 = HEAP32[$92 >> 2];
    var $94 = ($93 | 0) == 0;
    if ($94) {
      label = 22;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $96 = $89;
    _free($96);
    label = 22;
    break;
   case 22:
    HEAP32[$88 >> 2] = 0;
    var $_0 = 1;
    label = 39;
    break;
   case 23:
    if ($69) {
      label = 24;
      break;
    } else {
      label = 29;
      break;
    }
   case 24:
    var $100 = HEAP32[$19 >> 2];
    var $101 = HEAP32[$23 >> 2];
    var $102 = ($100 | 0) > ($101 | 0);
    if ($102) {
      label = 29;
      break;
    } else {
      label = 25;
      break;
    }
   case 25:
    var $104 = HEAP32[$25 >> 2];
    var $105 = HEAP32[$17 >> 2];
    var $106 = ($104 | 0) < ($105 | 0);
    if ($106) {
      label = 29;
      break;
    } else {
      label = 26;
      break;
    }
   case 26:
    var $108 = HEAP32[$31 >> 2];
    var $109 = HEAP32[$35 >> 2];
    var $110 = ($108 | 0) > ($109 | 0);
    if ($110) {
      label = 29;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $112 = HEAP32[$37 >> 2];
    var $113 = HEAP32[$29 >> 2];
    var $114 = ($112 | 0) < ($113 | 0);
    if ($114) {
      label = 29;
      break;
    } else {
      label = 28;
      break;
    }
   case 28:
    var $116 = _pixman_region32_copy($new_reg, $reg1);
    var $_0 = $116;
    label = 39;
    break;
   case 29:
    var $117 = HEAP32[$1 >> 2];
    var $118 = ($117 | 0) == 0;
    if ($118) {
      label = 30;
      break;
    } else {
      label = 35;
      break;
    }
   case 30:
    var $120 = HEAP32[$23 >> 2];
    var $121 = HEAP32[$19 >> 2];
    var $122 = ($120 | 0) > ($121 | 0);
    if ($122) {
      label = 35;
      break;
    } else {
      label = 31;
      break;
    }
   case 31:
    var $124 = HEAP32[$17 >> 2];
    var $125 = HEAP32[$25 >> 2];
    var $126 = ($124 | 0) < ($125 | 0);
    if ($126) {
      label = 35;
      break;
    } else {
      label = 32;
      break;
    }
   case 32:
    var $128 = HEAP32[$35 >> 2];
    var $129 = HEAP32[$31 >> 2];
    var $130 = ($128 | 0) > ($129 | 0);
    if ($130) {
      label = 35;
      break;
    } else {
      label = 33;
      break;
    }
   case 33:
    var $132 = HEAP32[$29 >> 2];
    var $133 = HEAP32[$37 >> 2];
    var $134 = ($132 | 0) < ($133 | 0);
    if ($134) {
      label = 35;
      break;
    } else {
      label = 34;
      break;
    }
   case 34:
    var $136 = _pixman_region32_copy($new_reg, $reg2);
    var $_0 = $136;
    label = 39;
    break;
   case 35:
    var $138 = ($reg1 | 0) == ($reg2 | 0);
    if ($138) {
      label = 36;
      break;
    } else {
      label = 37;
      break;
    }
   case 36:
    var $140 = _pixman_region32_copy($new_reg, $reg1);
    var $_0 = $140;
    label = 39;
    break;
   case 37:
    var $142 = _pixman_op($new_reg, $reg1, $reg2, 10, 0, 0);
    var $143 = ($142 | 0) == 0;
    if ($143) {
      var $_0 = 0;
      label = 39;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    _pixman_set_extents($new_reg);
    var $_0 = 1;
    label = 39;
    break;
   case 39:
    var $_0;
    return $_0;
  }
}
_pixman_region32_intersect["X"] = 1;
function _pixman_op($new_reg, $reg1, $reg2, $overlap_func, $append_non1, $append_non2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $reg1 + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 5242904;
    if ($3) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $reg2 + 16 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 5242904;
    if ($7) {
      label = 4;
      break;
    } else {
      label = 5;
      break;
    }
   case 4:
    _pixman_break($new_reg);
    var $_0 = 0;
    label = 93;
    break;
   case 5:
    var $10 = ($2 | 0) == 0;
    if ($10) {
      label = 7;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $12 = $2 + 8 | 0;
    var $13 = $12;
    var $17 = $13;
    label = 8;
    break;
   case 7:
    var $15 = $reg1 | 0;
    var $17 = $15;
    label = 8;
    break;
   case 8:
    var $17;
    var $18 = HEAP32[$1 >> 2];
    var $19 = ($18 | 0) == 0;
    if ($19) {
      var $24 = 1;
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $21 = $18 + 4 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $24 = $22;
    label = 10;
    break;
   case 10:
    var $24;
    var $25 = $17 + ($24 << 4) | 0;
    var $26 = HEAP32[$5 >> 2];
    var $27 = ($26 | 0) == 0;
    if ($27) {
      var $35 = 1;
      label = 13;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $29 = $26 + 4 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $_pr = HEAP32[$5 >> 2];
    var $31 = ($_pr | 0) == 0;
    if ($31) {
      var $35 = $30;
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $33 = $_pr + 8 | 0;
    var $34 = $33;
    var $39 = $34;
    var $38 = $30;
    label = 14;
    break;
   case 13:
    var $35;
    var $36 = $reg2 | 0;
    var $39 = $36;
    var $38 = $35;
    label = 14;
    break;
   case 14:
    var $38;
    var $39;
    var $40 = $39 + ($38 << 4) | 0;
    var $41 = ($24 | 0) == 0;
    if ($41) {
      label = 15;
      break;
    } else {
      label = 16;
      break;
    }
   case 15:
    __pixman_log_error(5245120, 5243448);
    label = 16;
    break;
   case 16:
    var $44 = ($38 | 0) == 0;
    if ($44) {
      label = 17;
      break;
    } else {
      label = 18;
      break;
    }
   case 17:
    __pixman_log_error(5245120, 5243384);
    label = 18;
    break;
   case 18:
    var $47 = ($new_reg | 0) == ($reg1 | 0);
    var $48 = ($24 | 0) > 1;
    var $or_cond = $47 & $48;
    if ($or_cond) {
      label = 20;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $50 = ($new_reg | 0) == ($reg2 | 0);
    var $51 = ($38 | 0) > 1;
    var $or_cond245 = $50 & $51;
    if ($or_cond245) {
      label = 20;
      break;
    } else {
      var $old_data_0 = 0;
      label = 21;
      break;
    }
   case 20:
    var $53 = $new_reg + 16 | 0;
    var $54 = HEAP32[$53 >> 2];
    HEAP32[$53 >> 2] = 5242880;
    var $phitmp = $54;
    var $old_data_0 = $phitmp;
    label = 21;
    break;
   case 21:
    var $old_data_0;
    var $56 = ($38 | 0) > ($24 | 0);
    var $_ = $56 ? $38 : $24;
    var $57 = $_ << 1;
    var $58 = $new_reg + 16 | 0;
    var $59 = HEAP32[$58 >> 2];
    var $60 = ($59 | 0) == 0;
    if ($60) {
      label = 22;
      break;
    } else {
      label = 23;
      break;
    }
   case 22:
    HEAP32[$58 >> 2] = 5242880;
    label = 25;
    break;
   case 23:
    var $63 = $59 | 0;
    var $64 = HEAP32[$63 >> 2];
    var $65 = ($64 | 0) == 0;
    if ($65) {
      label = 25;
      break;
    } else {
      label = 24;
      break;
    }
   case 24:
    var $67 = $59 + 4 | 0;
    HEAP32[$67 >> 2] = 0;
    label = 25;
    break;
   case 25:
    var $69 = HEAP32[$58 >> 2];
    var $70 = $69 | 0;
    var $71 = HEAP32[$70 >> 2];
    var $72 = ($57 | 0) > ($71 | 0);
    if ($72) {
      label = 26;
      break;
    } else {
      label = 28;
      break;
    }
   case 26:
    var $74 = _pixman_rect_alloc($new_reg, $57);
    var $75 = ($74 | 0) == 0;
    if ($75) {
      label = 27;
      break;
    } else {
      label = 28;
      break;
    }
   case 27:
    _free($old_data_0);
    var $_0 = 0;
    label = 93;
    break;
   case 28:
    var $78 = $17 + 4 | 0;
    var $79 = HEAP32[$78 >> 2];
    var $80 = $39 + 4 | 0;
    var $81 = HEAP32[$80 >> 2];
    var $82 = ($79 | 0) < ($81 | 0);
    var $_246 = $82 ? $79 : $81;
    var $83 = ($append_non1 | 0) == 0;
    var $84 = ($append_non2 | 0) == 0;
    var $r1_0 = $17;
    var $r2_0 = $39;
    var $prev_band_0 = 0;
    var $ybot_0 = $_246;
    label = 29;
    break;
   case 29:
    var $ybot_0;
    var $prev_band_0;
    var $r2_0;
    var $r1_0;
    var $86 = ($r1_0 | 0) == ($25 | 0);
    if ($86) {
      label = 30;
      break;
    } else {
      label = 31;
      break;
    }
   case 30:
    __pixman_log_error(5245120, 5243448);
    label = 31;
    break;
   case 31:
    var $89 = ($r2_0 | 0) == ($40 | 0);
    if ($89) {
      label = 32;
      break;
    } else {
      label = 33;
      break;
    }
   case 32:
    __pixman_log_error(5245120, 5243384);
    label = 33;
    break;
   case 33:
    var $92 = $r1_0 + 4 | 0;
    var $93 = HEAP32[$92 >> 2];
    var $r1_0_pn = $r1_0;
    label = 34;
    break;
   case 34:
    var $r1_0_pn;
    var $r1_band_end_0 = $r1_0_pn + 16 | 0;
    var $95 = ($r1_band_end_0 | 0) == ($25 | 0);
    if ($95) {
      label = 36;
      break;
    } else {
      label = 35;
      break;
    }
   case 35:
    var $97 = $r1_0_pn + 20 | 0;
    var $98 = HEAP32[$97 >> 2];
    var $99 = ($98 | 0) == ($93 | 0);
    if ($99) {
      var $r1_0_pn = $r1_band_end_0;
      label = 34;
      break;
    } else {
      label = 36;
      break;
    }
   case 36:
    var $100 = $r2_0 + 4 | 0;
    var $101 = HEAP32[$100 >> 2];
    var $r2_0_pn = $r2_0;
    label = 37;
    break;
   case 37:
    var $r2_0_pn;
    var $r2_band_end_0 = $r2_0_pn + 16 | 0;
    var $103 = ($r2_band_end_0 | 0) == ($40 | 0);
    if ($103) {
      label = 39;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    var $105 = $r2_0_pn + 20 | 0;
    var $106 = HEAP32[$105 >> 2];
    var $107 = ($106 | 0) == ($101 | 0);
    if ($107) {
      var $r2_0_pn = $r2_band_end_0;
      label = 37;
      break;
    } else {
      label = 39;
      break;
    }
   case 39:
    var $108 = ($93 | 0) < ($101 | 0);
    if ($108) {
      label = 40;
      break;
    } else {
      label = 45;
      break;
    }
   case 40:
    if ($83) {
      var $prev_band_3 = $prev_band_0;
      var $ytop_0 = $101;
      label = 50;
      break;
    } else {
      label = 41;
      break;
    }
   case 41:
    var $111 = ($93 | 0) > ($ybot_0 | 0);
    var $112 = $111 ? $93 : $ybot_0;
    var $113 = $r1_0 + 12 | 0;
    var $114 = HEAP32[$113 >> 2];
    var $115 = ($114 | 0) < ($101 | 0);
    var $_247 = $115 ? $114 : $101;
    var $116 = ($112 | 0) == ($_247 | 0);
    if ($116) {
      var $prev_band_3 = $prev_band_0;
      var $ytop_0 = $101;
      label = 50;
      break;
    } else {
      label = 42;
      break;
    }
   case 42:
    var $118 = HEAP32[$58 >> 2];
    var $119 = $118 + 4 | 0;
    var $120 = HEAP32[$119 >> 2];
    var $121 = _pixman_region_append_non_o($new_reg, $r1_0, $r1_band_end_0, $112, $_247);
    var $122 = ($121 | 0) == 0;
    if ($122) {
      label = 92;
      break;
    } else {
      label = 43;
      break;
    }
   case 43:
    var $124 = $120 - $prev_band_0 | 0;
    var $125 = HEAP32[$58 >> 2];
    var $126 = $125 + 4 | 0;
    var $127 = HEAP32[$126 >> 2];
    var $128 = $127 - $120 | 0;
    var $129 = ($124 | 0) == ($128 | 0);
    if ($129) {
      label = 44;
      break;
    } else {
      var $prev_band_3 = $120;
      var $ytop_0 = $101;
      label = 50;
      break;
    }
   case 44:
    var $131 = _pixman_coalesce($new_reg, $prev_band_0, $120);
    var $prev_band_3 = $131;
    var $ytop_0 = $101;
    label = 50;
    break;
   case 45:
    var $133 = ($101 | 0) >= ($93 | 0);
    var $or_cond255 = $133 | $84;
    if ($or_cond255) {
      var $prev_band_3 = $prev_band_0;
      var $ytop_0 = $93;
      label = 50;
      break;
    } else {
      label = 46;
      break;
    }
   case 46:
    var $135 = ($101 | 0) > ($ybot_0 | 0);
    var $136 = $135 ? $101 : $ybot_0;
    var $137 = $r2_0 + 12 | 0;
    var $138 = HEAP32[$137 >> 2];
    var $139 = ($138 | 0) < ($93 | 0);
    var $_248 = $139 ? $138 : $93;
    var $140 = ($136 | 0) == ($_248 | 0);
    if ($140) {
      var $prev_band_3 = $prev_band_0;
      var $ytop_0 = $93;
      label = 50;
      break;
    } else {
      label = 47;
      break;
    }
   case 47:
    var $142 = HEAP32[$58 >> 2];
    var $143 = $142 + 4 | 0;
    var $144 = HEAP32[$143 >> 2];
    var $145 = _pixman_region_append_non_o($new_reg, $r2_0, $r2_band_end_0, $136, $_248);
    var $146 = ($145 | 0) == 0;
    if ($146) {
      label = 92;
      break;
    } else {
      label = 48;
      break;
    }
   case 48:
    var $148 = $144 - $prev_band_0 | 0;
    var $149 = HEAP32[$58 >> 2];
    var $150 = $149 + 4 | 0;
    var $151 = HEAP32[$150 >> 2];
    var $152 = $151 - $144 | 0;
    var $153 = ($148 | 0) == ($152 | 0);
    if ($153) {
      label = 49;
      break;
    } else {
      var $prev_band_3 = $144;
      var $ytop_0 = $93;
      label = 50;
      break;
    }
   case 49:
    var $155 = _pixman_coalesce($new_reg, $prev_band_0, $144);
    var $prev_band_3 = $155;
    var $ytop_0 = $93;
    label = 50;
    break;
   case 50:
    var $ytop_0;
    var $prev_band_3;
    var $157 = $r1_0 + 12 | 0;
    var $158 = HEAP32[$157 >> 2];
    var $159 = $r2_0 + 12 | 0;
    var $160 = HEAP32[$159 >> 2];
    var $161 = ($158 | 0) < ($160 | 0);
    var $_249 = $161 ? $158 : $160;
    var $162 = ($_249 | 0) > ($ytop_0 | 0);
    if ($162) {
      label = 51;
      break;
    } else {
      var $prev_band_4 = $prev_band_3;
      label = 54;
      break;
    }
   case 51:
    var $164 = HEAP32[$58 >> 2];
    var $165 = $164 + 4 | 0;
    var $166 = HEAP32[$165 >> 2];
    var $167 = FUNCTION_TABLE[$overlap_func]($new_reg, $r1_0, $r1_band_end_0, $r2_0, $r2_band_end_0, $ytop_0, $_249);
    var $168 = ($167 | 0) == 0;
    if ($168) {
      label = 92;
      break;
    } else {
      label = 52;
      break;
    }
   case 52:
    var $170 = $166 - $prev_band_3 | 0;
    var $171 = HEAP32[$58 >> 2];
    var $172 = $171 + 4 | 0;
    var $173 = HEAP32[$172 >> 2];
    var $174 = $173 - $166 | 0;
    var $175 = ($170 | 0) == ($174 | 0);
    if ($175) {
      label = 53;
      break;
    } else {
      var $prev_band_4 = $166;
      label = 54;
      break;
    }
   case 53:
    var $177 = _pixman_coalesce($new_reg, $prev_band_3, $166);
    var $prev_band_4 = $177;
    label = 54;
    break;
   case 54:
    var $prev_band_4;
    var $179 = HEAP32[$157 >> 2];
    var $180 = ($179 | 0) == ($_249 | 0);
    var $r1_band_end_0_r1_0 = $180 ? $r1_band_end_0 : $r1_0;
    var $181 = HEAP32[$159 >> 2];
    var $182 = ($181 | 0) == ($_249 | 0);
    var $r2_1 = $182 ? $r2_band_end_0 : $r2_0;
    var $_not = ($r1_band_end_0_r1_0 | 0) == ($25 | 0);
    var $183 = ($r2_1 | 0) == ($40 | 0);
    var $or_cond250 = $_not | $183;
    if ($or_cond250) {
      label = 55;
      break;
    } else {
      var $r1_0 = $r1_band_end_0_r1_0;
      var $r2_0 = $r2_1;
      var $prev_band_0 = $prev_band_4;
      var $ybot_0 = $_249;
      label = 29;
      break;
    }
   case 55:
    var $184 = ($append_non1 | 0) == 0;
    var $or_cond252 = $_not | $184;
    if ($or_cond252) {
      label = 67;
      break;
    } else {
      label = 56;
      break;
    }
   case 56:
    var $186 = $r1_band_end_0_r1_0 + 4 | 0;
    var $187 = HEAP32[$186 >> 2];
    var $r1_1_pn = $r1_band_end_0_r1_0;
    label = 57;
    break;
   case 57:
    var $r1_1_pn;
    var $r1_band_end_1 = $r1_1_pn + 16 | 0;
    var $189 = ($r1_band_end_1 | 0) == ($25 | 0);
    if ($189) {
      label = 59;
      break;
    } else {
      label = 58;
      break;
    }
   case 58:
    var $191 = $r1_1_pn + 20 | 0;
    var $192 = HEAP32[$191 >> 2];
    var $193 = ($192 | 0) == ($187 | 0);
    if ($193) {
      var $r1_1_pn = $r1_band_end_1;
      label = 57;
      break;
    } else {
      label = 59;
      break;
    }
   case 59:
    var $194 = HEAP32[$58 >> 2];
    var $195 = $194 + 4 | 0;
    var $196 = HEAP32[$195 >> 2];
    var $197 = ($187 | 0) > ($_249 | 0);
    var $198 = $197 ? $187 : $_249;
    var $199 = $r1_band_end_0_r1_0 + 12 | 0;
    var $200 = HEAP32[$199 >> 2];
    var $201 = _pixman_region_append_non_o($new_reg, $r1_band_end_0_r1_0, $r1_band_end_1, $198, $200);
    var $202 = ($201 | 0) == 0;
    if ($202) {
      label = 92;
      break;
    } else {
      label = 60;
      break;
    }
   case 60:
    var $204 = $196 - $prev_band_4 | 0;
    var $205 = HEAP32[$58 >> 2];
    var $206 = $205 + 4 | 0;
    var $207 = HEAP32[$206 >> 2];
    var $208 = $207 - $196 | 0;
    var $209 = ($204 | 0) == ($208 | 0);
    if ($209) {
      label = 61;
      break;
    } else {
      label = 62;
      break;
    }
   case 61:
    var $211 = _pixman_coalesce($new_reg, $prev_band_4, $196);
    label = 62;
    break;
   case 62:
    var $213 = $25;
    var $214 = $r1_band_end_1;
    var $215 = $213 - $214 | 0;
    var $216 = $215 >> 4;
    var $217 = ($216 | 0) == 0;
    if ($217) {
      label = 79;
      break;
    } else {
      label = 63;
      break;
    }
   case 63:
    var $219 = HEAP32[$58 >> 2];
    var $220 = ($219 | 0) == 0;
    if ($220) {
      label = 65;
      break;
    } else {
      label = 64;
      break;
    }
   case 64:
    var $222 = $219 + 4 | 0;
    var $223 = HEAP32[$222 >> 2];
    var $224 = $223 + $216 | 0;
    var $225 = $219 | 0;
    var $226 = HEAP32[$225 >> 2];
    var $227 = ($224 | 0) > ($226 | 0);
    if ($227) {
      label = 65;
      break;
    } else {
      label = 66;
      break;
    }
   case 65:
    var $229 = _pixman_rect_alloc($new_reg, $216);
    var $230 = ($229 | 0) == 0;
    if ($230) {
      label = 92;
      break;
    } else {
      label = 66;
      break;
    }
   case 66:
    var $232 = HEAP32[$58 >> 2];
    var $233 = $232 + 4 | 0;
    var $234 = HEAP32[$233 >> 2];
    var $235 = $232 + 8 | 0;
    var $236 = $235;
    var $237 = $236 + ($234 << 4) | 0;
    var $238 = $237;
    var $239 = $r1_band_end_1;
    _memmove($238, $239, $215, 1, 0);
    var $240 = HEAP32[$58 >> 2];
    var $241 = $240 + 4 | 0;
    var $242 = HEAP32[$241 >> 2];
    var $243 = $242 + $216 | 0;
    HEAP32[$241 >> 2] = $243;
    label = 79;
    break;
   case 67:
    var $245 = ($append_non2 | 0) == 0;
    var $or_cond253 = $183 | $245;
    if ($or_cond253) {
      label = 79;
      break;
    } else {
      label = 68;
      break;
    }
   case 68:
    var $247 = $r2_1 + 4 | 0;
    var $248 = HEAP32[$247 >> 2];
    var $r2_1_pn = $r2_1;
    label = 69;
    break;
   case 69:
    var $r2_1_pn;
    var $r2_band_end_1 = $r2_1_pn + 16 | 0;
    var $250 = ($r2_band_end_1 | 0) == ($40 | 0);
    if ($250) {
      label = 71;
      break;
    } else {
      label = 70;
      break;
    }
   case 70:
    var $252 = $r2_1_pn + 20 | 0;
    var $253 = HEAP32[$252 >> 2];
    var $254 = ($253 | 0) == ($248 | 0);
    if ($254) {
      var $r2_1_pn = $r2_band_end_1;
      label = 69;
      break;
    } else {
      label = 71;
      break;
    }
   case 71:
    var $255 = HEAP32[$58 >> 2];
    var $256 = $255 + 4 | 0;
    var $257 = HEAP32[$256 >> 2];
    var $258 = ($248 | 0) > ($_249 | 0);
    var $259 = $258 ? $248 : $_249;
    var $260 = $r2_1 + 12 | 0;
    var $261 = HEAP32[$260 >> 2];
    var $262 = _pixman_region_append_non_o($new_reg, $r2_1, $r2_band_end_1, $259, $261);
    var $263 = ($262 | 0) == 0;
    if ($263) {
      label = 92;
      break;
    } else {
      label = 72;
      break;
    }
   case 72:
    var $265 = $257 - $prev_band_4 | 0;
    var $266 = HEAP32[$58 >> 2];
    var $267 = $266 + 4 | 0;
    var $268 = HEAP32[$267 >> 2];
    var $269 = $268 - $257 | 0;
    var $270 = ($265 | 0) == ($269 | 0);
    if ($270) {
      label = 73;
      break;
    } else {
      label = 74;
      break;
    }
   case 73:
    var $272 = _pixman_coalesce($new_reg, $prev_band_4, $257);
    label = 74;
    break;
   case 74:
    var $274 = $40;
    var $275 = $r2_band_end_1;
    var $276 = $274 - $275 | 0;
    var $277 = $276 >> 4;
    var $278 = ($277 | 0) == 0;
    if ($278) {
      label = 79;
      break;
    } else {
      label = 75;
      break;
    }
   case 75:
    var $280 = HEAP32[$58 >> 2];
    var $281 = ($280 | 0) == 0;
    if ($281) {
      label = 77;
      break;
    } else {
      label = 76;
      break;
    }
   case 76:
    var $283 = $280 + 4 | 0;
    var $284 = HEAP32[$283 >> 2];
    var $285 = $284 + $277 | 0;
    var $286 = $280 | 0;
    var $287 = HEAP32[$286 >> 2];
    var $288 = ($285 | 0) > ($287 | 0);
    if ($288) {
      label = 77;
      break;
    } else {
      label = 78;
      break;
    }
   case 77:
    var $290 = _pixman_rect_alloc($new_reg, $277);
    var $291 = ($290 | 0) == 0;
    if ($291) {
      label = 92;
      break;
    } else {
      label = 78;
      break;
    }
   case 78:
    var $293 = HEAP32[$58 >> 2];
    var $294 = $293 + 4 | 0;
    var $295 = HEAP32[$294 >> 2];
    var $296 = $293 + 8 | 0;
    var $297 = $296;
    var $298 = $297 + ($295 << 4) | 0;
    var $299 = $298;
    var $300 = $r2_band_end_1;
    _memmove($299, $300, $276, 1, 0);
    var $301 = HEAP32[$58 >> 2];
    var $302 = $301 + 4 | 0;
    var $303 = HEAP32[$302 >> 2];
    var $304 = $303 + $277 | 0;
    HEAP32[$302 >> 2] = $304;
    label = 79;
    break;
   case 79:
    _free($old_data_0);
    var $306 = HEAP32[$58 >> 2];
    var $307 = $306 + 4 | 0;
    var $308 = HEAP32[$307 >> 2];
    if (($308 | 0) == 0) {
      label = 80;
      break;
    } else if (($308 | 0) == 1) {
      label = 84;
      break;
    } else {
      label = 88;
      break;
    }
   case 80:
    var $310 = ($306 | 0) == 0;
    if ($310) {
      label = 83;
      break;
    } else {
      label = 81;
      break;
    }
   case 81:
    var $312 = $306 | 0;
    var $313 = HEAP32[$312 >> 2];
    var $314 = ($313 | 0) == 0;
    if ($314) {
      label = 83;
      break;
    } else {
      label = 82;
      break;
    }
   case 82:
    var $316 = $306;
    _free($316);
    label = 83;
    break;
   case 83:
    HEAP32[$58 >> 2] = 5242880;
    var $_0 = 1;
    label = 93;
    break;
   case 84:
    var $319 = $306 + 8 | 0;
    var $320 = $new_reg;
    var $321 = $319;
    HEAP32[$320 >> 2] = HEAP32[$321 >> 2];
    HEAP32[$320 + 4 >> 2] = HEAP32[$321 + 4 >> 2];
    HEAP32[$320 + 8 >> 2] = HEAP32[$321 + 8 >> 2];
    HEAP32[$320 + 12 >> 2] = HEAP32[$321 + 12 >> 2];
    var $322 = HEAP32[$58 >> 2];
    var $323 = ($322 | 0) == 0;
    if ($323) {
      label = 87;
      break;
    } else {
      label = 85;
      break;
    }
   case 85:
    var $325 = $322 | 0;
    var $326 = HEAP32[$325 >> 2];
    var $327 = ($326 | 0) == 0;
    if ($327) {
      label = 87;
      break;
    } else {
      label = 86;
      break;
    }
   case 86:
    var $329 = $322;
    _free($329);
    label = 87;
    break;
   case 87:
    HEAP32[$58 >> 2] = 0;
    var $_0 = 1;
    label = 93;
    break;
   case 88:
    var $332 = $306 | 0;
    var $333 = HEAP32[$332 >> 2];
    var $334 = $333 >> 1;
    var $335 = ($308 | 0) < ($334 | 0);
    var $336 = ($333 | 0) > 50;
    var $or_cond254 = $335 & $336;
    if ($or_cond254) {
      label = 89;
      break;
    } else {
      var $_0 = 1;
      label = 93;
      break;
    }
   case 89:
    var $338 = _PIXREGION_SZOF($308);
    var $339 = ($338 | 0) == 0;
    if ($339) {
      var $_0 = 1;
      label = 93;
      break;
    } else {
      label = 90;
      break;
    }
   case 90:
    var $341 = $306;
    var $342 = _realloc($341, $338);
    var $343 = ($342 | 0) == 0;
    if ($343) {
      var $_0 = 1;
      label = 93;
      break;
    } else {
      label = 91;
      break;
    }
   case 91:
    var $345 = $342;
    var $346 = $342;
    HEAP32[$346 >> 2] = $308;
    HEAP32[$58 >> 2] = $345;
    var $_0 = 1;
    label = 93;
    break;
   case 92:
    _free($old_data_0);
    _pixman_break($new_reg);
    var $_0 = 0;
    label = 93;
    break;
   case 93:
    var $_0;
    return $_0;
  }
}
_pixman_op["X"] = 1;
function _pixman_region_intersect_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = $2 + 4 | 0;
    var $4 = HEAP32[$3 >> 2];
    var $5 = $2 + 8 | 0;
    var $6 = $5;
    var $7 = $6 + ($4 << 4) | 0;
    var $8 = ($y1 | 0) < ($y2 | 0);
    if ($8) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    __pixman_log_error(5244564, 5243032);
    label = 4;
    break;
   case 4:
    var $11 = ($r1 | 0) == ($r1_end | 0);
    var $phitmp = ($r2 | 0) == ($r2_end | 0);
    var $_phitmp = $11 | $phitmp;
    if ($_phitmp) {
      label = 5;
      break;
    } else {
      var $next_rect_0 = $7;
      var $_044 = $r1;
      var $_045 = $r2;
      label = 6;
      break;
    }
   case 5:
    __pixman_log_error(5244564, 5242976);
    var $next_rect_0 = $7;
    var $_044 = $r1;
    var $_045 = $r2;
    label = 6;
    break;
   case 6:
    var $_045;
    var $_044;
    var $next_rect_0;
    var $13 = $_044 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = $_045 | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = ($14 | 0) > ($16 | 0);
    var $_ = $17 ? $14 : $16;
    var $18 = $_044 + 8 | 0;
    var $19 = HEAP32[$18 >> 2];
    var $20 = $_045 + 8 | 0;
    var $21 = HEAP32[$20 >> 2];
    var $22 = ($19 | 0) < ($21 | 0);
    var $23 = $22 ? $19 : $21;
    var $24 = ($_ | 0) < ($23 | 0);
    if ($24) {
      label = 7;
      break;
    } else {
      var $next_rect_2 = $next_rect_0;
      label = 13;
      break;
    }
   case 7:
    var $26 = HEAP32[$1 >> 2];
    var $27 = ($26 | 0) == 0;
    if ($27) {
      label = 9;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $29 = $26 + 4 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = $26 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = ($30 | 0) == ($32 | 0);
    if ($33) {
      label = 9;
      break;
    } else {
      var $next_rect_1 = $next_rect_0;
      label = 11;
      break;
    }
   case 9:
    var $35 = _pixman_rect_alloc($region, 1);
    var $36 = ($35 | 0) == 0;
    if ($36) {
      var $_0 = 0;
      label = 14;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $38 = HEAP32[$1 >> 2];
    var $39 = $38 + 4 | 0;
    var $40 = HEAP32[$39 >> 2];
    var $41 = $38 + 8 | 0;
    var $42 = $41;
    var $43 = $42 + ($40 << 4) | 0;
    var $next_rect_1 = $43;
    label = 11;
    break;
   case 11:
    var $next_rect_1;
    var $45 = $next_rect_1 | 0;
    HEAP32[$45 >> 2] = $_;
    var $46 = $next_rect_1 + 4 | 0;
    HEAP32[$46 >> 2] = $y1;
    var $47 = $next_rect_1 + 8 | 0;
    HEAP32[$47 >> 2] = $23;
    var $48 = $next_rect_1 + 12 | 0;
    HEAP32[$48 >> 2] = $y2;
    var $49 = $next_rect_1 + 16 | 0;
    var $50 = HEAP32[$1 >> 2];
    var $51 = $50 + 4 | 0;
    var $52 = HEAP32[$51 >> 2];
    var $53 = $52 + 1 | 0;
    HEAP32[$51 >> 2] = $53;
    var $54 = HEAP32[$1 >> 2];
    var $55 = $54 + 4 | 0;
    var $56 = HEAP32[$55 >> 2];
    var $57 = $54 | 0;
    var $58 = HEAP32[$57 >> 2];
    var $59 = ($56 | 0) > ($58 | 0);
    if ($59) {
      label = 12;
      break;
    } else {
      var $next_rect_2 = $49;
      label = 13;
      break;
    }
   case 12:
    __pixman_log_error(5244564, 5243692);
    var $next_rect_2 = $49;
    label = 13;
    break;
   case 13:
    var $next_rect_2;
    var $62 = HEAP32[$18 >> 2];
    var $63 = ($62 | 0) == ($23 | 0);
    var $64 = $_044 + 16 | 0;
    var $__044 = $63 ? $64 : $_044;
    var $65 = HEAP32[$20 >> 2];
    var $66 = ($65 | 0) == ($23 | 0);
    var $67 = $_045 + 16 | 0;
    var $_146 = $66 ? $67 : $_045;
    var $68 = ($__044 | 0) == ($r1_end | 0);
    var $69 = ($_146 | 0) == ($r2_end | 0);
    var $or_cond = $68 | $69;
    if ($or_cond) {
      var $_0 = 1;
      label = 14;
      break;
    } else {
      var $next_rect_0 = $next_rect_2;
      var $_044 = $__044;
      var $_045 = $_146;
      label = 6;
      break;
    }
   case 14:
    var $_0;
    return $_0;
  }
}
_pixman_region_intersect_o["X"] = 1;
function _pixman_set_extents($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 15;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 4;
      break;
    } else {
      label = 5;
      break;
    }
   case 4:
    var $9 = $region | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $region + 8 | 0;
    HEAP32[$11 >> 2] = $10;
    var $12 = $region + 4 | 0;
    var $13 = HEAP32[$12 >> 2];
    var $14 = $region + 12 | 0;
    HEAP32[$14 >> 2] = $13;
    label = 15;
    break;
   case 5:
    var $16 = $2 + 8 | 0;
    var $17 = $16;
    var $18 = $2 + 4 | 0;
    var $19 = HEAP32[$18 >> 2];
    var $20 = $19 - 1 | 0;
    var $21 = $17 + ($20 << 4) | 0;
    var $22 = $16 | 0;
    var $23 = HEAP32[$22 >> 2];
    var $24 = $region | 0;
    HEAP32[$24 >> 2] = $23;
    var $25 = $2 + 12 | 0;
    var $26 = HEAP32[$25 >> 2];
    var $27 = $region + 4 | 0;
    HEAP32[$27 >> 2] = $26;
    var $28 = $17 + ($20 << 4) + 8 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $30 = $region + 8 | 0;
    HEAP32[$30 >> 2] = $29;
    var $31 = $17 + ($20 << 4) + 12 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = $region + 12 | 0;
    HEAP32[$33 >> 2] = $32;
    var $34 = HEAP32[$27 >> 2];
    var $35 = ($34 | 0) < ($32 | 0);
    if ($35) {
      label = 7;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    __pixman_log_error(5244276, 5243556);
    label = 7;
    break;
   case 7:
    var $37 = $17 >>> 0 > $21 >>> 0;
    if ($37) {
      label = 13;
      break;
    } else {
      var $box_029 = $17;
      label = 8;
      break;
    }
   case 8:
    var $box_029;
    var $38 = $box_029 | 0;
    var $39 = HEAP32[$38 >> 2];
    var $40 = HEAP32[$24 >> 2];
    var $41 = ($39 | 0) < ($40 | 0);
    if ($41) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    HEAP32[$24 >> 2] = $39;
    label = 10;
    break;
   case 10:
    var $44 = $box_029 + 8 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = HEAP32[$30 >> 2];
    var $47 = ($45 | 0) > ($46 | 0);
    if ($47) {
      label = 11;
      break;
    } else {
      label = 12;
      break;
    }
   case 11:
    HEAP32[$30 >> 2] = $45;
    label = 12;
    break;
   case 12:
    var $50 = $box_029 + 16 | 0;
    var $51 = $50 >>> 0 > $21 >>> 0;
    if ($51) {
      label = 13;
      break;
    } else {
      var $box_029 = $50;
      label = 8;
      break;
    }
   case 13:
    var $52 = HEAP32[$24 >> 2];
    var $53 = HEAP32[$30 >> 2];
    var $54 = ($52 | 0) < ($53 | 0);
    if ($54) {
      label = 15;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    __pixman_log_error(5244276, 5243488);
    label = 15;
    break;
   case 15:
    return;
  }
}
_pixman_set_extents["X"] = 1;
function _pixman_region32_intersect_rect($dest, $source, $x, $y, $width, $height) {
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 20 | 0;
  var $region = __stackBase__;
  HEAP32[$region + 16 >> 2] = 0;
  HEAP32[$region >> 2] = $x;
  HEAP32[$region + 4 >> 2] = $y;
  HEAP32[$region + 8 >> 2] = $width + $x | 0;
  HEAP32[$region + 12 >> 2] = $height + $y | 0;
  var $8 = _pixman_region32_intersect($dest, $source, $region);
  STACKTOP = __stackBase__;
  return $8;
}
function _pixman_region32_union_rect($dest, $source, $x, $y, $width, $height) {
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 20 | 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $region = __stackBase__;
    var $1 = $region | 0;
    HEAP32[$1 >> 2] = $x;
    var $2 = $region + 4 | 0;
    HEAP32[$2 >> 2] = $y;
    var $3 = $width + $x | 0;
    var $4 = $region + 8 | 0;
    HEAP32[$4 >> 2] = $3;
    var $5 = $height + $y | 0;
    var $6 = $region + 12 | 0;
    HEAP32[$6 >> 2] = $5;
    var $7 = HEAP32[$1 >> 2];
    var $8 = HEAP32[$4 >> 2];
    var $9 = ($7 | 0) < ($8 | 0);
    if ($9) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $11 = HEAP32[$2 >> 2];
    var $12 = ($11 | 0) < ($5 | 0);
    if ($12) {
      label = 8;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $14 = HEAP32[$1 >> 2];
    var $15 = HEAP32[$4 >> 2];
    var $16 = ($14 | 0) > ($15 | 0);
    if ($16) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $18 = HEAP32[$2 >> 2];
    var $19 = HEAP32[$6 >> 2];
    var $20 = ($18 | 0) > ($19 | 0);
    if ($20) {
      label = 6;
      break;
    } else {
      label = 7;
      break;
    }
   case 6:
    __pixman_log_error(5244784, 5243184);
    label = 7;
    break;
   case 7:
    var $23 = _pixman_region32_copy($dest, $source);
    var $_0 = $23;
    label = 9;
    break;
   case 8:
    var $25 = $region + 16 | 0;
    HEAP32[$25 >> 2] = 0;
    var $26 = _pixman_region32_union($dest, $source, $region);
    var $_0 = $26;
    label = 9;
    break;
   case 9:
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
}
function _pixman_region32_union($new_reg, $reg1, $reg2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($reg1 | 0) == ($reg2 | 0);
    if ($1) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $3 = _pixman_region32_copy($new_reg, $reg1);
    var $_0 = $3;
    label = 32;
    break;
   case 4:
    var $5 = $reg1 + 16 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 10;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $9 = $6 + 4 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($10 | 0) == 0;
    if ($11) {
      label = 6;
      break;
    } else {
      label = 10;
      break;
    }
   case 6:
    var $13 = ($6 | 0) == 5242904;
    if ($13) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    _pixman_break($new_reg);
    var $_0 = 0;
    label = 32;
    break;
   case 8:
    var $16 = ($new_reg | 0) == ($reg2 | 0);
    if ($16) {
      var $_0 = 1;
      label = 32;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $18 = _pixman_region32_copy($new_reg, $reg2);
    var $_0 = $18;
    label = 32;
    break;
   case 10:
    var $20 = $reg2 + 16 | 0;
    var $21 = HEAP32[$20 >> 2];
    var $22 = ($21 | 0) == 0;
    if ($22) {
      label = 16;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $24 = $21 + 4 | 0;
    var $25 = HEAP32[$24 >> 2];
    var $26 = ($25 | 0) == 0;
    if ($26) {
      label = 12;
      break;
    } else {
      label = 16;
      break;
    }
   case 12:
    var $28 = ($21 | 0) == 5242904;
    if ($28) {
      label = 13;
      break;
    } else {
      label = 14;
      break;
    }
   case 13:
    _pixman_break($new_reg);
    var $_0 = 0;
    label = 32;
    break;
   case 14:
    var $31 = ($new_reg | 0) == ($reg1 | 0);
    if ($31) {
      var $_0 = 1;
      label = 32;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $33 = _pixman_region32_copy($new_reg, $reg1);
    var $_0 = $33;
    label = 32;
    break;
   case 16:
    var $35 = HEAP32[$5 >> 2];
    var $36 = ($35 | 0) == 0;
    if ($36) {
      label = 17;
      break;
    } else {
      label = 23;
      break;
    }
   case 17:
    var $38 = $reg1 | 0;
    var $39 = HEAP32[$38 >> 2];
    var $40 = $reg2 | 0;
    var $41 = HEAP32[$40 >> 2];
    var $42 = ($39 | 0) > ($41 | 0);
    if ($42) {
      label = 23;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $44 = $reg1 + 8 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = $reg2 + 8 | 0;
    var $47 = HEAP32[$46 >> 2];
    var $48 = ($45 | 0) < ($47 | 0);
    if ($48) {
      label = 23;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $50 = $reg1 + 4 | 0;
    var $51 = HEAP32[$50 >> 2];
    var $52 = $reg2 + 4 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = ($51 | 0) > ($53 | 0);
    if ($54) {
      label = 23;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    var $56 = $reg1 + 12 | 0;
    var $57 = HEAP32[$56 >> 2];
    var $58 = $reg2 + 12 | 0;
    var $59 = HEAP32[$58 >> 2];
    var $60 = ($57 | 0) < ($59 | 0);
    if ($60) {
      label = 23;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $62 = ($new_reg | 0) == ($reg1 | 0);
    if ($62) {
      var $_0 = 1;
      label = 32;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $64 = _pixman_region32_copy($new_reg, $reg1);
    var $_0 = $64;
    label = 32;
    break;
   case 23:
    var $66 = HEAP32[$20 >> 2];
    var $67 = ($66 | 0) == 0;
    if ($67) {
      label = 24;
      break;
    } else {
      label = 30;
      break;
    }
   case 24:
    var $69 = $reg2 | 0;
    var $70 = HEAP32[$69 >> 2];
    var $71 = $reg1 | 0;
    var $72 = HEAP32[$71 >> 2];
    var $73 = ($70 | 0) > ($72 | 0);
    if ($73) {
      label = 30;
      break;
    } else {
      label = 25;
      break;
    }
   case 25:
    var $75 = $reg2 + 8 | 0;
    var $76 = HEAP32[$75 >> 2];
    var $77 = $reg1 + 8 | 0;
    var $78 = HEAP32[$77 >> 2];
    var $79 = ($76 | 0) < ($78 | 0);
    if ($79) {
      label = 30;
      break;
    } else {
      label = 26;
      break;
    }
   case 26:
    var $81 = $reg2 + 4 | 0;
    var $82 = HEAP32[$81 >> 2];
    var $83 = $reg1 + 4 | 0;
    var $84 = HEAP32[$83 >> 2];
    var $85 = ($82 | 0) > ($84 | 0);
    if ($85) {
      label = 30;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $87 = $reg2 + 12 | 0;
    var $88 = HEAP32[$87 >> 2];
    var $89 = $reg1 + 12 | 0;
    var $90 = HEAP32[$89 >> 2];
    var $91 = ($88 | 0) < ($90 | 0);
    if ($91) {
      label = 30;
      break;
    } else {
      label = 28;
      break;
    }
   case 28:
    var $93 = ($new_reg | 0) == ($reg2 | 0);
    if ($93) {
      var $_0 = 1;
      label = 32;
      break;
    } else {
      label = 29;
      break;
    }
   case 29:
    var $95 = _pixman_region32_copy($new_reg, $reg2);
    var $_0 = $95;
    label = 32;
    break;
   case 30:
    var $97 = _pixman_op($new_reg, $reg1, $reg2, 18, 1, 1);
    var $98 = ($97 | 0) == 0;
    if ($98) {
      var $_0 = 0;
      label = 32;
      break;
    } else {
      label = 31;
      break;
    }
   case 31:
    var $100 = $reg1 | 0;
    var $101 = HEAP32[$100 >> 2];
    var $102 = $reg2 | 0;
    var $103 = HEAP32[$102 >> 2];
    var $104 = ($101 | 0) < ($103 | 0);
    var $_ = $104 ? $101 : $103;
    var $105 = $new_reg | 0;
    HEAP32[$105 >> 2] = $_;
    var $106 = $reg1 + 4 | 0;
    var $107 = HEAP32[$106 >> 2];
    var $108 = $reg2 + 4 | 0;
    var $109 = HEAP32[$108 >> 2];
    var $110 = ($107 | 0) < ($109 | 0);
    var $111 = $110 ? $107 : $109;
    var $112 = $new_reg + 4 | 0;
    HEAP32[$112 >> 2] = $111;
    var $113 = $reg1 + 8 | 0;
    var $114 = HEAP32[$113 >> 2];
    var $115 = $reg2 + 8 | 0;
    var $116 = HEAP32[$115 >> 2];
    var $117 = ($114 | 0) > ($116 | 0);
    var $_68 = $117 ? $114 : $116;
    var $118 = $new_reg + 8 | 0;
    HEAP32[$118 >> 2] = $_68;
    var $119 = $reg1 + 12 | 0;
    var $120 = HEAP32[$119 >> 2];
    var $121 = $reg2 + 12 | 0;
    var $122 = HEAP32[$121 >> 2];
    var $123 = ($120 | 0) > ($122 | 0);
    var $124 = $123 ? $120 : $122;
    var $125 = $new_reg + 12 | 0;
    HEAP32[$125 >> 2] = $124;
    var $_0 = 1;
    label = 32;
    break;
   case 32:
    var $_0;
    return $_0;
  }
}
_pixman_region32_union["X"] = 1;
function _pixman_region_union_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($y1 | 0) < ($y2 | 0);
    if ($1) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    __pixman_log_error(5244320, 5243032);
    label = 4;
    break;
   case 4:
    var $4 = ($r1 | 0) == ($r1_end | 0);
    var $phitmp = ($r2 | 0) == ($r2_end | 0);
    var $_phitmp = $4 | $phitmp;
    if ($_phitmp) {
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    __pixman_log_error(5244320, 5242976);
    label = 6;
    break;
   case 6:
    var $7 = $region + 16 | 0;
    var $8 = HEAP32[$7 >> 2];
    var $9 = $8 + 4 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $8 + 8 | 0;
    var $12 = $11;
    var $13 = $12 + ($10 << 4) | 0;
    var $14 = $r1 | 0;
    var $15 = HEAP32[$14 >> 2];
    var $16 = $r2 | 0;
    var $17 = HEAP32[$16 >> 2];
    var $18 = ($15 | 0) < ($17 | 0);
    if ($18) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    var $20 = $r1 + 16 | 0;
    var $r1_pn = $r1;
    var $x1_0_ph = $15;
    var $_0149_ph = $20;
    var $_0150_ph = $r2;
    label = 9;
    break;
   case 8:
    var $22 = $r2 + 16 | 0;
    var $r1_pn = $r2;
    var $x1_0_ph = $17;
    var $_0149_ph = $r1;
    var $_0150_ph = $22;
    label = 9;
    break;
   case 9:
    var $_0150_ph;
    var $_0149_ph;
    var $x1_0_ph;
    var $r1_pn;
    var $x2_0_ph_in = $r1_pn + 8 | 0;
    var $x2_0_ph = HEAP32[$x2_0_ph_in >> 2];
    var $23 = ($_0149_ph | 0) != ($r1_end | 0);
    var $24 = ($_0150_ph | 0) != ($r2_end | 0);
    var $_177209 = $23 & $24;
    if ($_177209) {
      var $_0150_ph159210 = $_0150_ph;
      var $_0149_ph160211 = $_0149_ph;
      var $next_rect_0_ph212 = $13;
      var $x1_0_ph161213 = $x1_0_ph;
      var $x2_0_ph162214 = $x2_0_ph;
      var $25 = $24;
      label = 10;
      break;
    } else {
      var $_0149_lcssa = $_0149_ph;
      var $next_rect_0_lcssa = $13;
      var $x1_0_lcssa = $x1_0_ph;
      var $x2_0_lcssa = $x2_0_ph;
      var $_lcssa = $23;
      var $_0150_ph159192 = $_0150_ph;
      label = 32;
      break;
    }
   case 10:
    var $25;
    var $x2_0_ph162214;
    var $x1_0_ph161213;
    var $next_rect_0_ph212;
    var $_0149_ph160211;
    var $_0150_ph159210;
    var $26 = $_0150_ph159210 | 0;
    var $_0149178 = $_0149_ph160211;
    var $next_rect_0180 = $next_rect_0_ph212;
    var $x1_0181 = $x1_0_ph161213;
    var $x2_0182 = $x2_0_ph162214;
    label = 11;
    break;
   case 11:
    var $x2_0182;
    var $x1_0181;
    var $next_rect_0180;
    var $_0149178;
    var $28 = $_0149178 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $30 = HEAP32[$26 >> 2];
    var $31 = ($29 | 0) < ($30 | 0);
    if ($31) {
      label = 12;
      break;
    } else {
      label = 22;
      break;
    }
   case 12:
    var $33 = ($29 | 0) > ($x2_0182 | 0);
    if ($33) {
      label = 14;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $35 = $_0149178 + 8 | 0;
    var $36 = HEAP32[$35 >> 2];
    var $37 = ($x2_0182 | 0) < ($36 | 0);
    var $_x2_0 = $37 ? $36 : $x2_0182;
    var $x2_1 = $_x2_0;
    var $x1_1 = $x1_0181;
    var $next_rect_2 = $next_rect_0180;
    label = 21;
    break;
   case 14:
    var $39 = HEAP32[$7 >> 2];
    var $40 = ($39 | 0) == 0;
    if ($40) {
      label = 16;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $42 = $39 + 4 | 0;
    var $43 = HEAP32[$42 >> 2];
    var $44 = $39 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = ($43 | 0) == ($45 | 0);
    if ($46) {
      label = 16;
      break;
    } else {
      var $next_rect_1 = $next_rect_0180;
      label = 18;
      break;
    }
   case 16:
    var $48 = _pixman_rect_alloc($region, 1);
    var $49 = ($48 | 0) == 0;
    if ($49) {
      var $_0 = 0;
      label = 60;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $51 = HEAP32[$7 >> 2];
    var $52 = $51 + 4 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = $51 + 8 | 0;
    var $55 = $54;
    var $56 = $55 + ($53 << 4) | 0;
    var $next_rect_1 = $56;
    label = 18;
    break;
   case 18:
    var $next_rect_1;
    var $58 = $next_rect_1 | 0;
    HEAP32[$58 >> 2] = $x1_0181;
    var $59 = $next_rect_1 + 4 | 0;
    HEAP32[$59 >> 2] = $y1;
    var $60 = $next_rect_1 + 8 | 0;
    HEAP32[$60 >> 2] = $x2_0182;
    var $61 = $next_rect_1 + 12 | 0;
    HEAP32[$61 >> 2] = $y2;
    var $62 = $next_rect_1 + 16 | 0;
    var $63 = HEAP32[$7 >> 2];
    var $64 = $63 + 4 | 0;
    var $65 = HEAP32[$64 >> 2];
    var $66 = $65 + 1 | 0;
    HEAP32[$64 >> 2] = $66;
    var $67 = HEAP32[$7 >> 2];
    var $68 = $67 + 4 | 0;
    var $69 = HEAP32[$68 >> 2];
    var $70 = $67 | 0;
    var $71 = HEAP32[$70 >> 2];
    var $72 = ($69 | 0) > ($71 | 0);
    if ($72) {
      label = 19;
      break;
    } else {
      label = 20;
      break;
    }
   case 19:
    __pixman_log_error(5244320, 5243692);
    label = 20;
    break;
   case 20:
    var $75 = HEAP32[$28 >> 2];
    var $76 = $_0149178 + 8 | 0;
    var $77 = HEAP32[$76 >> 2];
    var $x2_1 = $77;
    var $x1_1 = $75;
    var $next_rect_2 = $62;
    label = 21;
    break;
   case 21:
    var $next_rect_2;
    var $x1_1;
    var $x2_1;
    var $79 = $_0149178 + 16 | 0;
    var $80 = ($79 | 0) != ($r1_end | 0);
    var $_ = $80 & $25;
    if ($_) {
      var $_0149178 = $79;
      var $next_rect_0180 = $next_rect_2;
      var $x1_0181 = $x1_1;
      var $x2_0182 = $x2_1;
      label = 11;
      break;
    } else {
      var $_0149_lcssa = $79;
      var $next_rect_0_lcssa = $next_rect_2;
      var $x1_0_lcssa = $x1_1;
      var $x2_0_lcssa = $x2_1;
      var $_lcssa = $80;
      var $_0150_ph159192 = $_0150_ph159210;
      label = 32;
      break;
    }
   case 22:
    var $82 = ($30 | 0) > ($x2_0182 | 0);
    if ($82) {
      label = 24;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $84 = $_0150_ph159210 + 8 | 0;
    var $85 = HEAP32[$84 >> 2];
    var $86 = ($x2_0182 | 0) < ($85 | 0);
    var $_x2_0152 = $86 ? $85 : $x2_0182;
    var $x2_2 = $_x2_0152;
    var $x1_2 = $x1_0181;
    var $next_rect_4 = $next_rect_0180;
    label = 31;
    break;
   case 24:
    var $88 = HEAP32[$7 >> 2];
    var $89 = ($88 | 0) == 0;
    if ($89) {
      label = 26;
      break;
    } else {
      label = 25;
      break;
    }
   case 25:
    var $91 = $88 + 4 | 0;
    var $92 = HEAP32[$91 >> 2];
    var $93 = $88 | 0;
    var $94 = HEAP32[$93 >> 2];
    var $95 = ($92 | 0) == ($94 | 0);
    if ($95) {
      label = 26;
      break;
    } else {
      var $next_rect_3 = $next_rect_0180;
      label = 28;
      break;
    }
   case 26:
    var $97 = _pixman_rect_alloc($region, 1);
    var $98 = ($97 | 0) == 0;
    if ($98) {
      var $_0 = 0;
      label = 60;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $100 = HEAP32[$7 >> 2];
    var $101 = $100 + 4 | 0;
    var $102 = HEAP32[$101 >> 2];
    var $103 = $100 + 8 | 0;
    var $104 = $103;
    var $105 = $104 + ($102 << 4) | 0;
    var $next_rect_3 = $105;
    label = 28;
    break;
   case 28:
    var $next_rect_3;
    var $107 = $next_rect_3 | 0;
    HEAP32[$107 >> 2] = $x1_0181;
    var $108 = $next_rect_3 + 4 | 0;
    HEAP32[$108 >> 2] = $y1;
    var $109 = $next_rect_3 + 8 | 0;
    HEAP32[$109 >> 2] = $x2_0182;
    var $110 = $next_rect_3 + 12 | 0;
    HEAP32[$110 >> 2] = $y2;
    var $111 = $next_rect_3 + 16 | 0;
    var $112 = HEAP32[$7 >> 2];
    var $113 = $112 + 4 | 0;
    var $114 = HEAP32[$113 >> 2];
    var $115 = $114 + 1 | 0;
    HEAP32[$113 >> 2] = $115;
    var $116 = HEAP32[$7 >> 2];
    var $117 = $116 + 4 | 0;
    var $118 = HEAP32[$117 >> 2];
    var $119 = $116 | 0;
    var $120 = HEAP32[$119 >> 2];
    var $121 = ($118 | 0) > ($120 | 0);
    if ($121) {
      label = 29;
      break;
    } else {
      label = 30;
      break;
    }
   case 29:
    __pixman_log_error(5244320, 5243692);
    label = 30;
    break;
   case 30:
    var $124 = HEAP32[$26 >> 2];
    var $125 = $_0150_ph159210 + 8 | 0;
    var $126 = HEAP32[$125 >> 2];
    var $x2_2 = $126;
    var $x1_2 = $124;
    var $next_rect_4 = $111;
    label = 31;
    break;
   case 31:
    var $next_rect_4;
    var $x1_2;
    var $x2_2;
    var $127 = $_0150_ph159210 + 16 | 0;
    var $128 = ($_0149178 | 0) != ($r1_end | 0);
    var $129 = ($127 | 0) != ($r2_end | 0);
    var $_177 = $128 & $129;
    if ($_177) {
      var $_0150_ph159210 = $127;
      var $_0149_ph160211 = $_0149178;
      var $next_rect_0_ph212 = $next_rect_4;
      var $x1_0_ph161213 = $x1_2;
      var $x2_0_ph162214 = $x2_2;
      var $25 = $129;
      label = 10;
      break;
    } else {
      var $_0149_lcssa = $_0149178;
      var $next_rect_0_lcssa = $next_rect_4;
      var $x1_0_lcssa = $x1_2;
      var $x2_0_lcssa = $x2_2;
      var $_lcssa = $128;
      var $_0150_ph159192 = $127;
      label = 32;
      break;
    }
   case 32:
    var $_0150_ph159192;
    var $_lcssa;
    var $x2_0_lcssa;
    var $x1_0_lcssa;
    var $next_rect_0_lcssa;
    var $_0149_lcssa;
    if ($_lcssa) {
      var $x2_3 = $x2_0_lcssa;
      var $x1_3 = $x1_0_lcssa;
      var $next_rect_5 = $next_rect_0_lcssa;
      var $_1 = $_0149_lcssa;
      label = 33;
      break;
    } else {
      label = 43;
      break;
    }
   case 33:
    var $_1;
    var $next_rect_5;
    var $x1_3;
    var $x2_3;
    var $130 = $_1 | 0;
    var $131 = HEAP32[$130 >> 2];
    var $132 = ($131 | 0) > ($x2_3 | 0);
    if ($132) {
      label = 35;
      break;
    } else {
      label = 34;
      break;
    }
   case 34:
    var $134 = $_1 + 8 | 0;
    var $135 = HEAP32[$134 >> 2];
    var $136 = ($x2_3 | 0) < ($135 | 0);
    var $_x2_3 = $136 ? $135 : $x2_3;
    var $x2_4 = $_x2_3;
    var $x1_4 = $x1_3;
    var $next_rect_7 = $next_rect_5;
    label = 42;
    break;
   case 35:
    var $138 = HEAP32[$7 >> 2];
    var $139 = ($138 | 0) == 0;
    if ($139) {
      label = 37;
      break;
    } else {
      label = 36;
      break;
    }
   case 36:
    var $141 = $138 + 4 | 0;
    var $142 = HEAP32[$141 >> 2];
    var $143 = $138 | 0;
    var $144 = HEAP32[$143 >> 2];
    var $145 = ($142 | 0) == ($144 | 0);
    if ($145) {
      label = 37;
      break;
    } else {
      var $next_rect_6 = $next_rect_5;
      label = 39;
      break;
    }
   case 37:
    var $147 = _pixman_rect_alloc($region, 1);
    var $148 = ($147 | 0) == 0;
    if ($148) {
      var $_0 = 0;
      label = 60;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    var $150 = HEAP32[$7 >> 2];
    var $151 = $150 + 4 | 0;
    var $152 = HEAP32[$151 >> 2];
    var $153 = $150 + 8 | 0;
    var $154 = $153;
    var $155 = $154 + ($152 << 4) | 0;
    var $next_rect_6 = $155;
    label = 39;
    break;
   case 39:
    var $next_rect_6;
    var $157 = $next_rect_6 | 0;
    HEAP32[$157 >> 2] = $x1_3;
    var $158 = $next_rect_6 + 4 | 0;
    HEAP32[$158 >> 2] = $y1;
    var $159 = $next_rect_6 + 8 | 0;
    HEAP32[$159 >> 2] = $x2_3;
    var $160 = $next_rect_6 + 12 | 0;
    HEAP32[$160 >> 2] = $y2;
    var $161 = $next_rect_6 + 16 | 0;
    var $162 = HEAP32[$7 >> 2];
    var $163 = $162 + 4 | 0;
    var $164 = HEAP32[$163 >> 2];
    var $165 = $164 + 1 | 0;
    HEAP32[$163 >> 2] = $165;
    var $166 = HEAP32[$7 >> 2];
    var $167 = $166 + 4 | 0;
    var $168 = HEAP32[$167 >> 2];
    var $169 = $166 | 0;
    var $170 = HEAP32[$169 >> 2];
    var $171 = ($168 | 0) > ($170 | 0);
    if ($171) {
      label = 40;
      break;
    } else {
      label = 41;
      break;
    }
   case 40:
    __pixman_log_error(5244320, 5243692);
    label = 41;
    break;
   case 41:
    var $174 = HEAP32[$130 >> 2];
    var $175 = $_1 + 8 | 0;
    var $176 = HEAP32[$175 >> 2];
    var $x2_4 = $176;
    var $x1_4 = $174;
    var $next_rect_7 = $161;
    label = 42;
    break;
   case 42:
    var $next_rect_7;
    var $x1_4;
    var $x2_4;
    var $178 = $_1 + 16 | 0;
    var $179 = ($178 | 0) == ($r1_end | 0);
    if ($179) {
      var $x2_7 = $x2_4;
      var $x1_7 = $x1_4;
      var $next_rect_11 = $next_rect_7;
      label = 54;
      break;
    } else {
      var $x2_3 = $x2_4;
      var $x1_3 = $x1_4;
      var $next_rect_5 = $next_rect_7;
      var $_1 = $178;
      label = 33;
      break;
    }
   case 43:
    var $181 = ($_0150_ph159192 | 0) == ($r2_end | 0);
    if ($181) {
      var $x2_7 = $x2_0_lcssa;
      var $x1_7 = $x1_0_lcssa;
      var $next_rect_11 = $next_rect_0_lcssa;
      label = 54;
      break;
    } else {
      var $x2_5 = $x2_0_lcssa;
      var $x1_5 = $x1_0_lcssa;
      var $next_rect_8 = $next_rect_0_lcssa;
      var $_1151 = $_0150_ph159192;
      label = 44;
      break;
    }
   case 44:
    var $_1151;
    var $next_rect_8;
    var $x1_5;
    var $x2_5;
    var $182 = $_1151 | 0;
    var $183 = HEAP32[$182 >> 2];
    var $184 = ($183 | 0) > ($x2_5 | 0);
    if ($184) {
      label = 46;
      break;
    } else {
      label = 45;
      break;
    }
   case 45:
    var $186 = $_1151 + 8 | 0;
    var $187 = HEAP32[$186 >> 2];
    var $188 = ($x2_5 | 0) < ($187 | 0);
    var $_x2_5 = $188 ? $187 : $x2_5;
    var $x2_6 = $_x2_5;
    var $x1_6 = $x1_5;
    var $next_rect_10 = $next_rect_8;
    label = 53;
    break;
   case 46:
    var $190 = HEAP32[$7 >> 2];
    var $191 = ($190 | 0) == 0;
    if ($191) {
      label = 48;
      break;
    } else {
      label = 47;
      break;
    }
   case 47:
    var $193 = $190 + 4 | 0;
    var $194 = HEAP32[$193 >> 2];
    var $195 = $190 | 0;
    var $196 = HEAP32[$195 >> 2];
    var $197 = ($194 | 0) == ($196 | 0);
    if ($197) {
      label = 48;
      break;
    } else {
      var $next_rect_9 = $next_rect_8;
      label = 50;
      break;
    }
   case 48:
    var $199 = _pixman_rect_alloc($region, 1);
    var $200 = ($199 | 0) == 0;
    if ($200) {
      var $_0 = 0;
      label = 60;
      break;
    } else {
      label = 49;
      break;
    }
   case 49:
    var $202 = HEAP32[$7 >> 2];
    var $203 = $202 + 4 | 0;
    var $204 = HEAP32[$203 >> 2];
    var $205 = $202 + 8 | 0;
    var $206 = $205;
    var $207 = $206 + ($204 << 4) | 0;
    var $next_rect_9 = $207;
    label = 50;
    break;
   case 50:
    var $next_rect_9;
    var $209 = $next_rect_9 | 0;
    HEAP32[$209 >> 2] = $x1_5;
    var $210 = $next_rect_9 + 4 | 0;
    HEAP32[$210 >> 2] = $y1;
    var $211 = $next_rect_9 + 8 | 0;
    HEAP32[$211 >> 2] = $x2_5;
    var $212 = $next_rect_9 + 12 | 0;
    HEAP32[$212 >> 2] = $y2;
    var $213 = $next_rect_9 + 16 | 0;
    var $214 = HEAP32[$7 >> 2];
    var $215 = $214 + 4 | 0;
    var $216 = HEAP32[$215 >> 2];
    var $217 = $216 + 1 | 0;
    HEAP32[$215 >> 2] = $217;
    var $218 = HEAP32[$7 >> 2];
    var $219 = $218 + 4 | 0;
    var $220 = HEAP32[$219 >> 2];
    var $221 = $218 | 0;
    var $222 = HEAP32[$221 >> 2];
    var $223 = ($220 | 0) > ($222 | 0);
    if ($223) {
      label = 51;
      break;
    } else {
      label = 52;
      break;
    }
   case 51:
    __pixman_log_error(5244320, 5243692);
    label = 52;
    break;
   case 52:
    var $226 = HEAP32[$182 >> 2];
    var $227 = $_1151 + 8 | 0;
    var $228 = HEAP32[$227 >> 2];
    var $x2_6 = $228;
    var $x1_6 = $226;
    var $next_rect_10 = $213;
    label = 53;
    break;
   case 53:
    var $next_rect_10;
    var $x1_6;
    var $x2_6;
    var $230 = $_1151 + 16 | 0;
    var $231 = ($230 | 0) == ($r2_end | 0);
    if ($231) {
      var $x2_7 = $x2_6;
      var $x1_7 = $x1_6;
      var $next_rect_11 = $next_rect_10;
      label = 54;
      break;
    } else {
      var $x2_5 = $x2_6;
      var $x1_5 = $x1_6;
      var $next_rect_8 = $next_rect_10;
      var $_1151 = $230;
      label = 44;
      break;
    }
   case 54:
    var $next_rect_11;
    var $x1_7;
    var $x2_7;
    var $232 = HEAP32[$7 >> 2];
    var $233 = ($232 | 0) == 0;
    if ($233) {
      label = 56;
      break;
    } else {
      label = 55;
      break;
    }
   case 55:
    var $235 = $232 + 4 | 0;
    var $236 = HEAP32[$235 >> 2];
    var $237 = $232 | 0;
    var $238 = HEAP32[$237 >> 2];
    var $239 = ($236 | 0) == ($238 | 0);
    if ($239) {
      label = 56;
      break;
    } else {
      var $next_rect_12 = $next_rect_11;
      label = 58;
      break;
    }
   case 56:
    var $241 = _pixman_rect_alloc($region, 1);
    var $242 = ($241 | 0) == 0;
    if ($242) {
      var $_0 = 0;
      label = 60;
      break;
    } else {
      label = 57;
      break;
    }
   case 57:
    var $244 = HEAP32[$7 >> 2];
    var $245 = $244 + 4 | 0;
    var $246 = HEAP32[$245 >> 2];
    var $247 = $244 + 8 | 0;
    var $248 = $247;
    var $249 = $248 + ($246 << 4) | 0;
    var $next_rect_12 = $249;
    label = 58;
    break;
   case 58:
    var $next_rect_12;
    var $251 = $next_rect_12 | 0;
    HEAP32[$251 >> 2] = $x1_7;
    var $252 = $next_rect_12 + 4 | 0;
    HEAP32[$252 >> 2] = $y1;
    var $253 = $next_rect_12 + 8 | 0;
    HEAP32[$253 >> 2] = $x2_7;
    var $254 = $next_rect_12 + 12 | 0;
    HEAP32[$254 >> 2] = $y2;
    var $255 = HEAP32[$7 >> 2];
    var $256 = $255 + 4 | 0;
    var $257 = HEAP32[$256 >> 2];
    var $258 = $257 + 1 | 0;
    HEAP32[$256 >> 2] = $258;
    var $259 = HEAP32[$7 >> 2];
    var $260 = $259 + 4 | 0;
    var $261 = HEAP32[$260 >> 2];
    var $262 = $259 | 0;
    var $263 = HEAP32[$262 >> 2];
    var $264 = ($261 | 0) > ($263 | 0);
    if ($264) {
      label = 59;
      break;
    } else {
      var $_0 = 1;
      label = 60;
      break;
    }
   case 59:
    __pixman_log_error(5244320, 5243692);
    var $_0 = 1;
    label = 60;
    break;
   case 60:
    var $_0;
    return $_0;
  }
}
_pixman_region_union_o["X"] = 1;
function _pixman_region32_subtract($reg_d, $reg_m, $reg_s) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $reg_m + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 10;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $reg_s + 16 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($10 | 0) == 0;
    if ($11) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $13 = $10 + 4 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($14 | 0) == 0;
    if ($15) {
      label = 10;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $17 = $reg_m + 8 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = $reg_s | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = ($18 | 0) > ($20 | 0);
    if ($21) {
      label = 7;
      break;
    } else {
      label = 10;
      break;
    }
   case 7:
    var $23 = $reg_m | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = $reg_s + 8 | 0;
    var $26 = HEAP32[$25 >> 2];
    var $27 = ($24 | 0) < ($26 | 0);
    if ($27) {
      label = 8;
      break;
    } else {
      label = 10;
      break;
    }
   case 8:
    var $29 = $reg_m + 12 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = $reg_s + 4 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = ($30 | 0) > ($32 | 0);
    if ($33) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    var $35 = $reg_m + 4 | 0;
    var $36 = HEAP32[$35 >> 2];
    var $37 = $reg_s + 12 | 0;
    var $38 = HEAP32[$37 >> 2];
    var $39 = ($36 | 0) < ($38 | 0);
    if ($39) {
      label = 13;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $41 = $reg_s + 16 | 0;
    var $42 = HEAP32[$41 >> 2];
    var $43 = ($42 | 0) == 5242904;
    if ($43) {
      label = 11;
      break;
    } else {
      label = 12;
      break;
    }
   case 11:
    _pixman_break($reg_d);
    var $_0 = 0;
    label = 20;
    break;
   case 12:
    var $46 = _pixman_region32_copy($reg_d, $reg_m);
    var $_0 = $46;
    label = 20;
    break;
   case 13:
    var $48 = ($reg_m | 0) == ($reg_s | 0);
    if ($48) {
      label = 14;
      break;
    } else {
      label = 18;
      break;
    }
   case 14:
    var $50 = $reg_d + 16 | 0;
    var $51 = HEAP32[$50 >> 2];
    var $52 = ($51 | 0) == 0;
    if ($52) {
      label = 17;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $54 = $51 | 0;
    var $55 = HEAP32[$54 >> 2];
    var $56 = ($55 | 0) == 0;
    if ($56) {
      label = 17;
      break;
    } else {
      label = 16;
      break;
    }
   case 16:
    var $58 = $51;
    _free($58);
    label = 17;
    break;
   case 17:
    var $60 = $reg_d | 0;
    var $61 = HEAP32[$60 >> 2];
    var $62 = $reg_d + 8 | 0;
    HEAP32[$62 >> 2] = $61;
    var $63 = $reg_d + 4 | 0;
    var $64 = HEAP32[$63 >> 2];
    var $65 = $reg_d + 12 | 0;
    HEAP32[$65 >> 2] = $64;
    HEAP32[$50 >> 2] = 5242880;
    var $_0 = 1;
    label = 20;
    break;
   case 18:
    var $67 = _pixman_op($reg_d, $reg_m, $reg_s, 6, 1, 0);
    var $68 = ($67 | 0) == 0;
    if ($68) {
      var $_0 = 0;
      label = 20;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    _pixman_set_extents($reg_d);
    var $_0 = 1;
    label = 20;
    break;
   case 20:
    var $_0;
    return $_0;
  }
}
_pixman_region32_subtract["X"] = 1;
function _find_box_for_y($begin, $end, $y) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($end | 0) == ($begin | 0);
    if ($1) {
      var $_0 = $end;
      label = 6;
      break;
    } else {
      var $begin_tr20 = $begin;
      var $end_tr21 = $end;
      label = 3;
      break;
    }
   case 3:
    var $end_tr21;
    var $begin_tr20;
    var $2 = $end_tr21;
    var $3 = $begin_tr20;
    var $4 = $2 - $3 | 0;
    var $5 = $4 >> 4;
    var $6 = ($5 | 0) == 1;
    if ($6) {
      label = 4;
      break;
    } else {
      label = 5;
      break;
    }
   case 4:
    var $8 = $begin_tr20 + 12 | 0;
    var $9 = HEAP32[$8 >> 2];
    var $10 = ($9 | 0) > ($y | 0);
    var $begin_end = $10 ? $begin_tr20 : $end_tr21;
    var $_0 = $begin_end;
    label = 6;
    break;
   case 5:
    var $11 = ($5 | 0) / 2 & -1;
    var $12 = $begin_tr20 + ($11 << 4) | 0;
    var $13 = $begin_tr20 + ($11 << 4) + 12 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($14 | 0) > ($y | 0);
    var $begin_tr_ = $15 ? $begin_tr20 : $12;
    var $_end_tr = $15 ? $12 : $end_tr21;
    var $16 = ($_end_tr | 0) == ($begin_tr_ | 0);
    if ($16) {
      var $_0 = $_end_tr;
      label = 6;
      break;
    } else {
      var $begin_tr20 = $begin_tr_;
      var $end_tr21 = $_end_tr;
      label = 3;
      break;
    }
   case 6:
    var $_0;
    return $_0;
  }
}
function _pixman_region_subtract_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $r1 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($y1 | 0) < ($y2 | 0);
    if ($3) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    __pixman_log_error(5244440, 5243032);
    label = 4;
    break;
   case 4:
    var $6 = ($r1 | 0) == ($r1_end | 0);
    var $phitmp = ($r2 | 0) == ($r2_end | 0);
    var $_phitmp = $6 | $phitmp;
    if ($_phitmp) {
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    __pixman_log_error(5244440, 5242976);
    label = 6;
    break;
   case 6:
    var $9 = $region + 16 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $10 + 4 | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = $10 + 8 | 0;
    var $14 = $13;
    var $15 = $14 + ($12 << 4) | 0;
    var $x1_0 = $2;
    var $next_rect_0 = $15;
    var $_0103 = $r1;
    var $_0104 = $r2;
    label = 7;
    break;
   case 7:
    var $_0104;
    var $_0103;
    var $next_rect_0;
    var $x1_0;
    var $17 = $_0104 + 8 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($18 | 0) > ($x1_0 | 0);
    if ($19) {
      label = 9;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $21 = $_0104 + 16 | 0;
    var $x1_1 = $x1_0;
    var $next_rect_4 = $next_rect_0;
    var $_1 = $_0103;
    var $_1105 = $21;
    label = 34;
    break;
   case 9:
    var $23 = $_0104 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = ($24 | 0) > ($x1_0 | 0);
    var $26 = $_0103 + 8 | 0;
    var $27 = HEAP32[$26 >> 2];
    if ($25) {
      label = 14;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $29 = ($18 | 0) < ($27 | 0);
    if ($29) {
      label = 13;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $31 = $_0103 + 16 | 0;
    var $32 = ($31 | 0) == ($r1_end | 0);
    if ($32) {
      var $x1_1 = $18;
      var $next_rect_4 = $next_rect_0;
      var $_1 = $31;
      var $_1105 = $_0104;
      label = 34;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $34 = $31 | 0;
    var $35 = HEAP32[$34 >> 2];
    var $x1_1 = $35;
    var $next_rect_4 = $next_rect_0;
    var $_1 = $31;
    var $_1105 = $_0104;
    label = 34;
    break;
   case 13:
    var $37 = $_0104 + 16 | 0;
    var $x1_1 = $18;
    var $next_rect_4 = $next_rect_0;
    var $_1 = $_0103;
    var $_1105 = $37;
    label = 34;
    break;
   case 14:
    var $39 = ($24 | 0) < ($27 | 0);
    if ($39) {
      label = 15;
      break;
    } else {
      label = 25;
      break;
    }
   case 15:
    var $41 = HEAP32[$9 >> 2];
    var $42 = ($41 | 0) == 0;
    if ($42) {
      label = 17;
      break;
    } else {
      label = 16;
      break;
    }
   case 16:
    var $44 = $41 + 4 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = $41 | 0;
    var $47 = HEAP32[$46 >> 2];
    var $48 = ($45 | 0) == ($47 | 0);
    if ($48) {
      label = 17;
      break;
    } else {
      var $next_rect_1 = $next_rect_0;
      label = 19;
      break;
    }
   case 17:
    var $50 = _pixman_rect_alloc($region, 1);
    var $51 = ($50 | 0) == 0;
    if ($51) {
      var $_0 = 0;
      label = 47;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $53 = HEAP32[$9 >> 2];
    var $54 = $53 + 4 | 0;
    var $55 = HEAP32[$54 >> 2];
    var $56 = $53 + 8 | 0;
    var $57 = $56;
    var $58 = $57 + ($55 << 4) | 0;
    var $next_rect_1 = $58;
    label = 19;
    break;
   case 19:
    var $next_rect_1;
    var $60 = $next_rect_1 | 0;
    HEAP32[$60 >> 2] = $x1_0;
    var $61 = $next_rect_1 + 4 | 0;
    HEAP32[$61 >> 2] = $y1;
    var $62 = HEAP32[$23 >> 2];
    var $63 = $next_rect_1 + 8 | 0;
    HEAP32[$63 >> 2] = $62;
    var $64 = $next_rect_1 + 12 | 0;
    HEAP32[$64 >> 2] = $y2;
    var $65 = $next_rect_1 + 16 | 0;
    var $66 = HEAP32[$9 >> 2];
    var $67 = $66 + 4 | 0;
    var $68 = HEAP32[$67 >> 2];
    var $69 = $68 + 1 | 0;
    HEAP32[$67 >> 2] = $69;
    var $70 = HEAP32[$9 >> 2];
    var $71 = $70 + 4 | 0;
    var $72 = HEAP32[$71 >> 2];
    var $73 = $70 | 0;
    var $74 = HEAP32[$73 >> 2];
    var $75 = ($72 | 0) > ($74 | 0);
    if ($75) {
      label = 20;
      break;
    } else {
      label = 21;
      break;
    }
   case 20:
    __pixman_log_error(5244440, 5243692);
    label = 21;
    break;
   case 21:
    var $78 = HEAP32[$17 >> 2];
    var $79 = HEAP32[$26 >> 2];
    var $80 = ($78 | 0) < ($79 | 0);
    if ($80) {
      label = 24;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $82 = $_0103 + 16 | 0;
    var $83 = ($82 | 0) == ($r1_end | 0);
    if ($83) {
      var $x1_1 = $78;
      var $next_rect_4 = $65;
      var $_1 = $82;
      var $_1105 = $_0104;
      label = 34;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $85 = $82 | 0;
    var $86 = HEAP32[$85 >> 2];
    var $x1_1 = $86;
    var $next_rect_4 = $65;
    var $_1 = $82;
    var $_1105 = $_0104;
    label = 34;
    break;
   case 24:
    var $88 = $_0104 + 16 | 0;
    var $x1_1 = $78;
    var $next_rect_4 = $65;
    var $_1 = $_0103;
    var $_1105 = $88;
    label = 34;
    break;
   case 25:
    var $90 = ($27 | 0) > ($x1_0 | 0);
    if ($90) {
      label = 26;
      break;
    } else {
      var $next_rect_3 = $next_rect_0;
      label = 32;
      break;
    }
   case 26:
    var $92 = HEAP32[$9 >> 2];
    var $93 = ($92 | 0) == 0;
    if ($93) {
      label = 28;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $95 = $92 + 4 | 0;
    var $96 = HEAP32[$95 >> 2];
    var $97 = $92 | 0;
    var $98 = HEAP32[$97 >> 2];
    var $99 = ($96 | 0) == ($98 | 0);
    if ($99) {
      label = 28;
      break;
    } else {
      var $next_rect_2 = $next_rect_0;
      label = 30;
      break;
    }
   case 28:
    var $101 = _pixman_rect_alloc($region, 1);
    var $102 = ($101 | 0) == 0;
    if ($102) {
      var $_0 = 0;
      label = 47;
      break;
    } else {
      label = 29;
      break;
    }
   case 29:
    var $104 = HEAP32[$9 >> 2];
    var $105 = $104 + 4 | 0;
    var $106 = HEAP32[$105 >> 2];
    var $107 = $104 + 8 | 0;
    var $108 = $107;
    var $109 = $108 + ($106 << 4) | 0;
    var $next_rect_2 = $109;
    label = 30;
    break;
   case 30:
    var $next_rect_2;
    var $111 = $next_rect_2 | 0;
    HEAP32[$111 >> 2] = $x1_0;
    var $112 = $next_rect_2 + 4 | 0;
    HEAP32[$112 >> 2] = $y1;
    var $113 = HEAP32[$26 >> 2];
    var $114 = $next_rect_2 + 8 | 0;
    HEAP32[$114 >> 2] = $113;
    var $115 = $next_rect_2 + 12 | 0;
    HEAP32[$115 >> 2] = $y2;
    var $116 = $next_rect_2 + 16 | 0;
    var $117 = HEAP32[$9 >> 2];
    var $118 = $117 + 4 | 0;
    var $119 = HEAP32[$118 >> 2];
    var $120 = $119 + 1 | 0;
    HEAP32[$118 >> 2] = $120;
    var $121 = HEAP32[$9 >> 2];
    var $122 = $121 + 4 | 0;
    var $123 = HEAP32[$122 >> 2];
    var $124 = $121 | 0;
    var $125 = HEAP32[$124 >> 2];
    var $126 = ($123 | 0) > ($125 | 0);
    if ($126) {
      label = 31;
      break;
    } else {
      var $next_rect_3 = $116;
      label = 32;
      break;
    }
   case 31:
    __pixman_log_error(5244440, 5243692);
    var $next_rect_3 = $116;
    label = 32;
    break;
   case 32:
    var $next_rect_3;
    var $129 = $_0103 + 16 | 0;
    var $130 = ($129 | 0) == ($r1_end | 0);
    if ($130) {
      var $x1_1 = $x1_0;
      var $next_rect_4 = $next_rect_3;
      var $_1 = $129;
      var $_1105 = $_0104;
      label = 34;
      break;
    } else {
      label = 33;
      break;
    }
   case 33:
    var $132 = $129 | 0;
    var $133 = HEAP32[$132 >> 2];
    var $x1_1 = $133;
    var $next_rect_4 = $next_rect_3;
    var $_1 = $129;
    var $_1105 = $_0104;
    label = 34;
    break;
   case 34:
    var $_1105;
    var $_1;
    var $next_rect_4;
    var $x1_1;
    var $135 = ($_1 | 0) == ($r1_end | 0);
    var $136 = ($_1105 | 0) == ($r2_end | 0);
    var $or_cond = $135 | $136;
    if ($or_cond) {
      var $x1_2_ph = $x1_1;
      var $next_rect_5_ph = $next_rect_4;
      var $_2_ph = $_1;
      label = 35;
      break;
    } else {
      var $x1_0 = $x1_1;
      var $next_rect_0 = $next_rect_4;
      var $_0103 = $_1;
      var $_0104 = $_1105;
      label = 7;
      break;
    }
   case 35:
    var $_2_ph;
    var $next_rect_5_ph;
    var $x1_2_ph;
    var $next_rect_5 = $next_rect_5_ph;
    var $_2 = $_2_ph;
    label = 36;
    break;
   case 36:
    var $_2;
    var $next_rect_5;
    var $137 = ($_2 | 0) == ($r1_end | 0);
    if ($137) {
      var $_0 = 1;
      label = 47;
      break;
    } else {
      label = 37;
      break;
    }
   case 37:
    var $139 = $_2 + 8 | 0;
    var $140 = HEAP32[$139 >> 2];
    var $141 = ($x1_2_ph | 0) < ($140 | 0);
    if ($141) {
      label = 39;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    __pixman_log_error(5244440, 5243652);
    label = 39;
    break;
   case 39:
    var $144 = HEAP32[$9 >> 2];
    var $145 = ($144 | 0) == 0;
    if ($145) {
      label = 41;
      break;
    } else {
      label = 40;
      break;
    }
   case 40:
    var $147 = $144 + 4 | 0;
    var $148 = HEAP32[$147 >> 2];
    var $149 = $144 | 0;
    var $150 = HEAP32[$149 >> 2];
    var $151 = ($148 | 0) == ($150 | 0);
    if ($151) {
      label = 41;
      break;
    } else {
      var $next_rect_6 = $next_rect_5;
      label = 43;
      break;
    }
   case 41:
    var $153 = _pixman_rect_alloc($region, 1);
    var $154 = ($153 | 0) == 0;
    if ($154) {
      var $_0 = 0;
      label = 47;
      break;
    } else {
      label = 42;
      break;
    }
   case 42:
    var $156 = HEAP32[$9 >> 2];
    var $157 = $156 + 4 | 0;
    var $158 = HEAP32[$157 >> 2];
    var $159 = $156 + 8 | 0;
    var $160 = $159;
    var $161 = $160 + ($158 << 4) | 0;
    var $next_rect_6 = $161;
    label = 43;
    break;
   case 43:
    var $next_rect_6;
    var $163 = $next_rect_6 | 0;
    HEAP32[$163 >> 2] = $x1_2_ph;
    var $164 = $next_rect_6 + 4 | 0;
    HEAP32[$164 >> 2] = $y1;
    var $165 = HEAP32[$139 >> 2];
    var $166 = $next_rect_6 + 8 | 0;
    HEAP32[$166 >> 2] = $165;
    var $167 = $next_rect_6 + 12 | 0;
    HEAP32[$167 >> 2] = $y2;
    var $168 = $next_rect_6 + 16 | 0;
    var $169 = HEAP32[$9 >> 2];
    var $170 = $169 + 4 | 0;
    var $171 = HEAP32[$170 >> 2];
    var $172 = $171 + 1 | 0;
    HEAP32[$170 >> 2] = $172;
    var $173 = HEAP32[$9 >> 2];
    var $174 = $173 + 4 | 0;
    var $175 = HEAP32[$174 >> 2];
    var $176 = $173 | 0;
    var $177 = HEAP32[$176 >> 2];
    var $178 = ($175 | 0) > ($177 | 0);
    if ($178) {
      label = 44;
      break;
    } else {
      label = 45;
      break;
    }
   case 44:
    __pixman_log_error(5244440, 5243692);
    label = 45;
    break;
   case 45:
    var $181 = $_2 + 16 | 0;
    var $182 = ($181 | 0) == ($r1_end | 0);
    if ($182) {
      var $next_rect_5 = $168;
      var $_2 = $181;
      label = 36;
      break;
    } else {
      label = 46;
      break;
    }
   case 46:
    var $184 = $181 | 0;
    var $185 = HEAP32[$184 >> 2];
    var $x1_2_ph = $185;
    var $next_rect_5_ph = $168;
    var $_2_ph = $181;
    label = 35;
    break;
   case 47:
    var $_0;
    return $_0;
  }
}
_pixman_region_subtract_o["X"] = 1;
function _pixman_region32_inverse($new_reg, $reg1, $inv_rect) {
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 20 | 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $inv_reg = __stackBase__;
    var $1 = $reg1 + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 8;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $inv_rect + 8 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $reg1 | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = ($10 | 0) > ($12 | 0);
    if ($13) {
      label = 5;
      break;
    } else {
      label = 8;
      break;
    }
   case 5:
    var $15 = $inv_rect | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = $reg1 + 8 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($16 | 0) < ($18 | 0);
    if ($19) {
      label = 6;
      break;
    } else {
      label = 8;
      break;
    }
   case 6:
    var $21 = $inv_rect + 12 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = $reg1 + 4 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = ($22 | 0) > ($24 | 0);
    if ($25) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    var $27 = $inv_rect + 4 | 0;
    var $28 = HEAP32[$27 >> 2];
    var $29 = $reg1 + 12 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = ($28 | 0) < ($30 | 0);
    if ($31) {
      label = 14;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $33 = HEAP32[$1 >> 2];
    var $34 = ($33 | 0) == 5242904;
    if ($34) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    _pixman_break($new_reg);
    var $_0 = 0;
    label = 16;
    break;
   case 10:
    var $37 = $new_reg;
    var $38 = $inv_rect;
    HEAP32[$37 >> 2] = HEAP32[$38 >> 2];
    HEAP32[$37 + 4 >> 2] = HEAP32[$38 + 4 >> 2];
    HEAP32[$37 + 8 >> 2] = HEAP32[$38 + 8 >> 2];
    HEAP32[$37 + 12 >> 2] = HEAP32[$38 + 12 >> 2];
    var $39 = $new_reg + 16 | 0;
    var $40 = HEAP32[$39 >> 2];
    var $41 = ($40 | 0) == 0;
    if ($41) {
      label = 13;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $43 = $40 | 0;
    var $44 = HEAP32[$43 >> 2];
    var $45 = ($44 | 0) == 0;
    if ($45) {
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $47 = $40;
    _free($47);
    label = 13;
    break;
   case 13:
    HEAP32[$39 >> 2] = 0;
    var $_0 = 1;
    label = 16;
    break;
   case 14:
    var $50 = $inv_reg;
    var $51 = $inv_rect;
    HEAP32[$50 >> 2] = HEAP32[$51 >> 2];
    HEAP32[$50 + 4 >> 2] = HEAP32[$51 + 4 >> 2];
    HEAP32[$50 + 8 >> 2] = HEAP32[$51 + 8 >> 2];
    HEAP32[$50 + 12 >> 2] = HEAP32[$51 + 12 >> 2];
    var $52 = $inv_reg + 16 | 0;
    HEAP32[$52 >> 2] = 0;
    var $53 = _pixman_op($new_reg, $inv_reg, $reg1, 6, 1, 0);
    var $54 = ($53 | 0) == 0;
    if ($54) {
      var $_0 = 0;
      label = 16;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    _pixman_set_extents($new_reg);
    var $_0 = 1;
    label = 16;
    break;
   case 16:
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
}
_pixman_region32_inverse["X"] = 1;
function _pixman_region32_contains_rectangle($region, $prect) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $8 = 1;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      var $_0 = 0;
      label = 27;
      break;
    } else {
      var $8 = $6;
      label = 4;
      break;
    }
   case 4:
    var $8;
    var $9 = $region + 8 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $prect | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = ($10 | 0) > ($12 | 0);
    if ($13) {
      label = 5;
      break;
    } else {
      var $_0 = 0;
      label = 27;
      break;
    }
   case 5:
    var $15 = $region | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = $prect + 8 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($16 | 0) < ($18 | 0);
    if ($19) {
      label = 6;
      break;
    } else {
      var $_0 = 0;
      label = 27;
      break;
    }
   case 6:
    var $21 = $region + 12 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = $prect + 4 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = ($22 | 0) > ($24 | 0);
    if ($25) {
      label = 7;
      break;
    } else {
      var $_0 = 0;
      label = 27;
      break;
    }
   case 7:
    var $27 = $region + 4 | 0;
    var $28 = HEAP32[$27 >> 2];
    var $29 = $prect + 12 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = ($28 | 0) < ($30 | 0);
    if ($31) {
      label = 8;
      break;
    } else {
      var $_0 = 0;
      label = 27;
      break;
    }
   case 8:
    var $33 = ($8 | 0) == 1;
    if ($33) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    var $35 = ($16 | 0) > ($12 | 0);
    var $36 = ($10 | 0) < ($18 | 0);
    var $or_cond = $35 | $36;
    var $37 = ($28 | 0) > ($24 | 0);
    var $or_cond51 = $or_cond | $37;
    var $38 = ($22 | 0) < ($30 | 0);
    var $or_cond52 = $or_cond51 | $38;
    var $_53 = $or_cond52 ? 2 : 1;
    return $_53;
   case 10:
    var $40 = HEAP32[$1 >> 2];
    var $41 = $40 + 8 | 0;
    var $42 = $41;
    var $43 = $42 + ($8 << 4) | 0;
    var $44 = ($42 | 0) == ($43 | 0);
    if ($44) {
      var $_0 = 0;
      label = 27;
      break;
    } else {
      var $pbox_057 = $42;
      var $part_in_058 = 0;
      var $part_out_059 = 0;
      var $x_060 = $12;
      var $y_061 = $24;
      label = 11;
      break;
    }
   case 11:
    var $y_061;
    var $x_060;
    var $part_out_059;
    var $part_in_058;
    var $pbox_057;
    var $45 = $pbox_057 + 12 | 0;
    var $46 = HEAP32[$45 >> 2];
    var $47 = ($46 | 0) > ($y_061 | 0);
    if ($47) {
      var $pbox_1 = $pbox_057;
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $49 = _find_box_for_y($pbox_057, $43, $y_061);
    var $50 = ($49 | 0) == ($43 | 0);
    if ($50) {
      var $y_3 = $y_061;
      var $part_in_3 = $part_in_058;
      label = 25;
      break;
    } else {
      var $pbox_1 = $49;
      label = 13;
      break;
    }
   case 13:
    var $pbox_1;
    var $52 = $pbox_1 + 4 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = ($53 | 0) > ($y_061 | 0);
    if ($54) {
      label = 14;
      break;
    } else {
      var $y_1 = $y_061;
      var $part_out_1 = $part_out_059;
      label = 16;
      break;
    }
   case 14:
    var $56 = ($part_in_058 | 0) == 0;
    if ($56) {
      label = 15;
      break;
    } else {
      var $y_355 = $y_061;
      label = 26;
      break;
    }
   case 15:
    var $58 = HEAP32[$29 >> 2];
    var $59 = ($53 | 0) < ($58 | 0);
    if ($59) {
      var $y_1 = $53;
      var $part_out_1 = 1;
      label = 16;
      break;
    } else {
      var $_0 = 0;
      label = 27;
      break;
    }
   case 16:
    var $part_out_1;
    var $y_1;
    var $61 = $pbox_1 + 8 | 0;
    var $62 = HEAP32[$61 >> 2];
    var $63 = ($62 | 0) > ($x_060 | 0);
    if ($63) {
      label = 17;
      break;
    } else {
      var $y_2 = $y_1;
      var $x_1 = $x_060;
      var $part_out_3 = $part_out_1;
      var $part_in_2 = $part_in_058;
      label = 24;
      break;
    }
   case 17:
    var $65 = $pbox_1 | 0;
    var $66 = HEAP32[$65 >> 2];
    var $67 = ($66 | 0) > ($x_060 | 0);
    if ($67) {
      label = 18;
      break;
    } else {
      var $part_out_2 = $part_out_1;
      label = 19;
      break;
    }
   case 18:
    var $69 = ($part_in_058 | 0) == 0;
    if ($69) {
      var $part_out_2 = 1;
      label = 19;
      break;
    } else {
      var $y_355 = $y_1;
      label = 26;
      break;
    }
   case 19:
    var $part_out_2;
    var $71 = HEAP32[$65 >> 2];
    var $72 = HEAP32[$17 >> 2];
    var $73 = ($71 | 0) < ($72 | 0);
    if ($73) {
      label = 20;
      break;
    } else {
      var $part_in_1 = $part_in_058;
      label = 21;
      break;
    }
   case 20:
    var $75 = ($part_out_2 | 0) == 0;
    if ($75) {
      var $part_in_1 = 1;
      label = 21;
      break;
    } else {
      var $y_355 = $y_1;
      label = 26;
      break;
    }
   case 21:
    var $part_in_1;
    var $77 = HEAP32[$61 >> 2];
    var $78 = HEAP32[$17 >> 2];
    var $79 = ($77 | 0) < ($78 | 0);
    if ($79) {
      var $y_3 = $y_1;
      var $part_in_3 = $part_in_1;
      label = 25;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $81 = $pbox_1 + 12 | 0;
    var $82 = HEAP32[$81 >> 2];
    var $83 = HEAP32[$29 >> 2];
    var $84 = ($82 | 0) < ($83 | 0);
    if ($84) {
      label = 23;
      break;
    } else {
      var $y_3 = $82;
      var $part_in_3 = $part_in_1;
      label = 25;
      break;
    }
   case 23:
    var $86 = HEAP32[$11 >> 2];
    var $y_2 = $82;
    var $x_1 = $86;
    var $part_out_3 = $part_out_2;
    var $part_in_2 = $part_in_1;
    label = 24;
    break;
   case 24:
    var $part_in_2;
    var $part_out_3;
    var $x_1;
    var $y_2;
    var $88 = $pbox_1 + 16 | 0;
    var $89 = ($88 | 0) == ($43 | 0);
    if ($89) {
      var $y_3 = $y_2;
      var $part_in_3 = $part_in_2;
      label = 25;
      break;
    } else {
      var $pbox_057 = $88;
      var $part_in_058 = $part_in_2;
      var $part_out_059 = $part_out_3;
      var $x_060 = $x_1;
      var $y_061 = $y_2;
      label = 11;
      break;
    }
   case 25:
    var $part_in_3;
    var $y_3;
    var $90 = ($part_in_3 | 0) == 0;
    if ($90) {
      var $_0 = 0;
      label = 27;
      break;
    } else {
      var $y_355 = $y_3;
      label = 26;
      break;
    }
   case 26:
    var $y_355;
    var $91 = HEAP32[$29 >> 2];
    var $92 = ($y_355 | 0) < ($91 | 0);
    var $_ = $92 ? 2 : 1;
    var $_0 = $_;
    label = 27;
    break;
   case 27:
    var $_0;
    return $_0;
  }
}
_pixman_region32_contains_rectangle["X"] = 1;
function _pixman_region32_translate($region, $x, $y) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = $2 + $x | 0;
    var $4$0 = $3;
    var $4$1 = ($3 | 0) < 0 ? -1 : 0;
    HEAP32[$1 >> 2] = $3;
    var $5 = $region + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = $6 + $y | 0;
    var $8$0 = $7;
    var $8$1 = ($7 | 0) < 0 ? -1 : 0;
    HEAP32[$5 >> 2] = $7;
    var $9 = $region + 8 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $10 + $x | 0;
    var $12$0 = $11;
    var $12$1 = ($11 | 0) < 0 ? -1 : 0;
    HEAP32[$9 >> 2] = $11;
    var $13 = $region + 12 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = $14 + $y | 0;
    var $16$0 = $15;
    var $16$1 = ($15 | 0) < 0 ? -1 : 0;
    HEAP32[$13 >> 2] = $15;
    var $$etemp$0$0 = -2147483648;
    var $$etemp$0$1 = 0;
    var $17$0 = (i64Math.add($4$0, $4$1, $$etemp$0$0, $$etemp$0$1), HEAP32[tempDoublePtr >> 2]);
    var $17$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$1$0 = -2147483648;
    var $$etemp$1$1 = 0;
    var $18$0 = (i64Math.add($8$0, $8$1, $$etemp$1$0, $$etemp$1$1), HEAP32[tempDoublePtr >> 2]);
    var $18$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $19$0 = $18$0 | $17$0;
    var $19$1 = $18$1 | $17$1;
    var $$etemp$2$0 = 2147483647;
    var $$etemp$2$1 = 0;
    var $20$0 = (i64Math.subtract($$etemp$2$0, $$etemp$2$1, $12$0, $12$1), HEAP32[tempDoublePtr >> 2]);
    var $20$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $21$0 = $19$0 | $20$0;
    var $21$1 = $19$1 | $20$1;
    var $$etemp$3$0 = 2147483647;
    var $$etemp$3$1 = 0;
    var $22$0 = (i64Math.subtract($$etemp$3$0, $$etemp$3$1, $16$0, $16$1), HEAP32[tempDoublePtr >> 2]);
    var $22$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $23$0 = $21$0 | $22$0;
    var $23$1 = $21$1 | $22$1;
    var $$etemp$4$0 = -1;
    var $$etemp$4$1 = -1;
    var $24 = ($23$1 | 0) > ($$etemp$4$1 | 0) | ($23$1 | 0) == ($$etemp$4$1 | 0) & $23$0 >>> 0 > $$etemp$4$0 >>> 0;
    if ($24) {
      label = 3;
      break;
    } else {
      label = 7;
      break;
    }
   case 3:
    var $26 = $region + 16 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $28 = ($27 | 0) == 0;
    if ($28) {
      label = 26;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $30 = $27 + 4 | 0;
    var $31 = HEAP32[$30 >> 2];
    var $32 = ($31 | 0) == 0;
    if ($32) {
      label = 26;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $33 = $27 + 8 | 0;
    var $34 = $33;
    var $nbox_082 = $31;
    var $pbox_083 = $34;
    label = 6;
    break;
   case 6:
    var $pbox_083;
    var $nbox_082;
    var $36 = $nbox_082 - 1 | 0;
    var $37 = $pbox_083 | 0;
    var $38 = HEAP32[$37 >> 2];
    var $39 = $38 + $x | 0;
    HEAP32[$37 >> 2] = $39;
    var $40 = $pbox_083 + 4 | 0;
    var $41 = HEAP32[$40 >> 2];
    var $42 = $41 + $y | 0;
    HEAP32[$40 >> 2] = $42;
    var $43 = $pbox_083 + 8 | 0;
    var $44 = HEAP32[$43 >> 2];
    var $45 = $44 + $x | 0;
    HEAP32[$43 >> 2] = $45;
    var $46 = $pbox_083 + 12 | 0;
    var $47 = HEAP32[$46 >> 2];
    var $48 = $47 + $y | 0;
    HEAP32[$46 >> 2] = $48;
    var $49 = $pbox_083 + 16 | 0;
    var $50 = ($36 | 0) == 0;
    if ($50) {
      label = 26;
      break;
    } else {
      var $nbox_082 = $36;
      var $pbox_083 = $49;
      label = 6;
      break;
    }
   case 7:
    var $$etemp$5$0 = -2147483648;
    var $$etemp$5$1 = 0;
    var $52$0 = (i64Math.add($12$0, $12$1, $$etemp$5$0, $$etemp$5$1), HEAP32[tempDoublePtr >> 2]);
    var $52$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$6$0 = -2147483648;
    var $$etemp$6$1 = 0;
    var $53$0 = (i64Math.add($16$0, $16$1, $$etemp$6$0, $$etemp$6$1), HEAP32[tempDoublePtr >> 2]);
    var $53$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$7$0 = 2147483647;
    var $$etemp$7$1 = 0;
    var $54$0 = (i64Math.subtract($$etemp$7$0, $$etemp$7$1, $4$0, $4$1), HEAP32[tempDoublePtr >> 2]);
    var $54$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$8$0 = 2147483647;
    var $$etemp$8$1 = 0;
    var $55$0 = (i64Math.subtract($$etemp$8$0, $$etemp$8$1, $8$0, $8$1), HEAP32[tempDoublePtr >> 2]);
    var $55$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $56$0 = $55$0 | $54$0;
    var $56$1 = $55$1 | $54$1;
    var $57$0 = $56$0 | $52$0;
    var $57$1 = $56$1 | $52$1;
    var $58$0 = $57$0 | $53$0;
    var $58$1 = $57$1 | $53$1;
    var $$etemp$9$0 = 1;
    var $$etemp$9$1 = 0;
    var $59 = ($58$1 | 0) < ($$etemp$9$1 | 0) | ($58$1 | 0) == ($$etemp$9$1 | 0) & $58$0 >>> 0 < $$etemp$9$0 >>> 0;
    if ($59) {
      label = 8;
      break;
    } else {
      label = 12;
      break;
    }
   case 8:
    var $61 = HEAP32[$1 >> 2];
    HEAP32[$9 >> 2] = $61;
    var $62 = HEAP32[$5 >> 2];
    HEAP32[$13 >> 2] = $62;
    var $63 = $region + 16 | 0;
    var $64 = HEAP32[$63 >> 2];
    var $65 = ($64 | 0) == 0;
    if ($65) {
      label = 11;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $67 = $64 | 0;
    var $68 = HEAP32[$67 >> 2];
    var $69 = ($68 | 0) == 0;
    if ($69) {
      label = 11;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $71 = $64;
    _free($71);
    label = 11;
    break;
   case 11:
    HEAP32[$63 >> 2] = 5242880;
    label = 26;
    break;
   case 12:
    var $74 = $region + 16 | 0;
    var $75 = HEAP32[$74 >> 2];
    var $76 = ($75 | 0) == 0;
    if ($76) {
      label = 26;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $78 = $75 + 4 | 0;
    var $79 = HEAP32[$78 >> 2];
    var $80 = ($79 | 0) == 0;
    if ($80) {
      label = 26;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $81 = $75 + 8 | 0;
    var $82 = $81;
    var $83 = $79 << 1;
    var $84 = $83 | 1;
    var $scevgep = $75 + ($84 << 3) | 0;
    var $pbox_184 = $82;
    var $pbox_out_085 = $82;
    var $_in = $79;
    label = 15;
    break;
   case 15:
    var $_in;
    var $pbox_out_085;
    var $pbox_184;
    var $86 = $_in - 1 | 0;
    var $87 = $pbox_184 | 0;
    var $88 = HEAP32[$87 >> 2];
    var $89 = $88 + $x | 0;
    var $90$0 = $89;
    var $90$1 = ($89 | 0) < 0 ? -1 : 0;
    var $91 = $pbox_out_085 | 0;
    HEAP32[$91 >> 2] = $89;
    var $92 = $pbox_184 + 4 | 0;
    var $93 = HEAP32[$92 >> 2];
    var $94 = $93 + $y | 0;
    var $95$0 = $94;
    var $95$1 = ($94 | 0) < 0 ? -1 : 0;
    var $96 = $pbox_out_085 + 4 | 0;
    HEAP32[$96 >> 2] = $94;
    var $97 = $pbox_184 + 8 | 0;
    var $98 = HEAP32[$97 >> 2];
    var $99 = $98 + $x | 0;
    var $100$0 = $99;
    var $100$1 = ($99 | 0) < 0 ? -1 : 0;
    var $101 = $pbox_out_085 + 8 | 0;
    HEAP32[$101 >> 2] = $99;
    var $102 = $pbox_184 + 12 | 0;
    var $103 = HEAP32[$102 >> 2];
    var $104 = $103 + $y | 0;
    var $105$0 = $104;
    var $105$1 = ($104 | 0) < 0 ? -1 : 0;
    var $106 = $pbox_out_085 + 12 | 0;
    HEAP32[$106 >> 2] = $104;
    var $$etemp$10$0 = -2147483648;
    var $$etemp$10$1 = 0;
    var $107$0 = (i64Math.add($100$0, $100$1, $$etemp$10$0, $$etemp$10$1), HEAP32[tempDoublePtr >> 2]);
    var $107$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$11$0 = -2147483648;
    var $$etemp$11$1 = 0;
    var $108$0 = (i64Math.add($105$0, $105$1, $$etemp$11$0, $$etemp$11$1), HEAP32[tempDoublePtr >> 2]);
    var $108$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$12$0 = 2147483647;
    var $$etemp$12$1 = 0;
    var $109$0 = (i64Math.subtract($$etemp$12$0, $$etemp$12$1, $90$0, $90$1), HEAP32[tempDoublePtr >> 2]);
    var $109$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $$etemp$13$0 = 2147483647;
    var $$etemp$13$1 = 0;
    var $110$0 = (i64Math.subtract($$etemp$13$0, $$etemp$13$1, $95$0, $95$1), HEAP32[tempDoublePtr >> 2]);
    var $110$1 = HEAP32[tempDoublePtr + 4 >> 2];
    var $111$0 = $110$0 | $109$0;
    var $111$1 = $110$1 | $109$1;
    var $112$0 = $111$0 | $107$0;
    var $112$1 = $111$1 | $107$1;
    var $113$0 = $112$0 | $108$0;
    var $113$1 = $112$1 | $108$1;
    var $$etemp$14$0 = 1;
    var $$etemp$14$1 = 0;
    var $114 = ($113$1 | 0) < ($$etemp$14$1 | 0) | ($113$1 | 0) == ($$etemp$14$1 | 0) & $113$0 >>> 0 < $$etemp$14$0 >>> 0;
    if ($114) {
      label = 16;
      break;
    } else {
      label = 17;
      break;
    }
   case 16:
    var $116 = HEAP32[$74 >> 2];
    var $117 = $116 + 4 | 0;
    var $118 = HEAP32[$117 >> 2];
    var $119 = $118 - 1 | 0;
    HEAP32[$117 >> 2] = $119;
    var $pbox_out_1 = $pbox_out_085;
    label = 18;
    break;
   case 17:
    var $121 = $pbox_out_085 + 16 | 0;
    var $pbox_out_1 = $121;
    label = 18;
    break;
   case 18:
    var $pbox_out_1;
    var $123 = $pbox_184 + 16 | 0;
    var $124 = ($86 | 0) == 0;
    if ($124) {
      label = 19;
      break;
    } else {
      var $pbox_184 = $123;
      var $pbox_out_085 = $pbox_out_1;
      var $_in = $86;
      label = 15;
      break;
    }
   case 19:
    var $scevgep88 = $scevgep;
    var $126 = ($pbox_out_1 | 0) == ($scevgep88 | 0);
    if ($126) {
      label = 26;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    var $128 = HEAP32[$74 >> 2];
    var $129 = $128 + 4 | 0;
    var $130 = HEAP32[$129 >> 2];
    var $131 = ($130 | 0) == 1;
    if ($131) {
      label = 21;
      break;
    } else {
      label = 25;
      break;
    }
   case 21:
    var $133 = $128 + 8 | 0;
    var $134 = $region;
    var $135 = $133;
    HEAP32[$134 >> 2] = HEAP32[$135 >> 2];
    HEAP32[$134 + 4 >> 2] = HEAP32[$135 + 4 >> 2];
    HEAP32[$134 + 8 >> 2] = HEAP32[$135 + 8 >> 2];
    HEAP32[$134 + 12 >> 2] = HEAP32[$135 + 12 >> 2];
    var $136 = HEAP32[$74 >> 2];
    var $137 = ($136 | 0) == 0;
    if ($137) {
      label = 24;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $139 = $136 | 0;
    var $140 = HEAP32[$139 >> 2];
    var $141 = ($140 | 0) == 0;
    if ($141) {
      label = 24;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $143 = $136;
    _free($143);
    label = 24;
    break;
   case 24:
    HEAP32[$74 >> 2] = 0;
    label = 26;
    break;
   case 25:
    _pixman_set_extents($region);
    label = 26;
    break;
   case 26:
    return;
  }
}
_pixman_region32_translate["X"] = 1;
function _pixman_region32_reset($region, $box) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $box | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = $box + 8 | 0;
    var $4 = HEAP32[$3 >> 2];
    var $5 = ($2 | 0) < ($4 | 0);
    if ($5) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $7 = $box + 4 | 0;
    var $8 = HEAP32[$7 >> 2];
    var $9 = $box + 12 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $phitmp = ($8 | 0) < ($10 | 0);
    if ($phitmp) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    __pixman_log_error(5244900, 5243140);
    label = 5;
    break;
   case 5:
    var $12 = $region;
    var $13 = $box;
    HEAP32[$12 >> 2] = HEAP32[$13 >> 2];
    HEAP32[$12 + 4 >> 2] = HEAP32[$13 + 4 >> 2];
    HEAP32[$12 + 8 >> 2] = HEAP32[$13 + 8 >> 2];
    HEAP32[$12 + 12 >> 2] = HEAP32[$13 + 12 >> 2];
    var $14 = $region + 16 | 0;
    var $15 = HEAP32[$14 >> 2];
    var $16 = ($15 | 0) == 0;
    if ($16) {
      label = 8;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $18 = $15 | 0;
    var $19 = HEAP32[$18 >> 2];
    var $20 = ($19 | 0) == 0;
    if ($20) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $22 = $15;
    _free($22);
    label = 8;
    break;
   case 8:
    HEAP32[$14 >> 2] = 0;
    return;
  }
}
function _pixman_region32_clear($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $2;
    _free($9);
    label = 5;
    break;
   case 5:
    var $11 = $region;
    HEAP32[$11 >> 2] = 0;
    HEAP32[$11 + 4 >> 2] = 0;
    HEAP32[$11 + 8 >> 2] = 0;
    HEAP32[$11 + 12 >> 2] = 0;
    HEAP32[$1 >> 2] = 5242880;
    return;
  }
}
function _pixman_region32_not_empty($region) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $9 = 1;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) != 0;
    var $9 = $7;
    label = 4;
    break;
   case 4:
    var $9;
    var $10 = $9 & 1;
    return $10;
  }
}
function _pixman_region32_extents($region) {
  return $region | 0;
}
function _pixman_region32_selfcheck($reg) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $reg | 0;
    var $2 = $reg | 0;
    var $3 = HEAP32[$2 >> 2];
    var $4 = $reg + 8 | 0;
    var $5 = HEAP32[$4 >> 2];
    var $6 = ($3 | 0) > ($5 | 0);
    if ($6) {
      var $_0 = 0;
      label = 28;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $8 = $reg + 4 | 0;
    var $9 = HEAP32[$8 >> 2];
    var $10 = $reg + 12 | 0;
    var $11 = HEAP32[$10 >> 2];
    var $12 = ($9 | 0) > ($11 | 0);
    if ($12) {
      var $_0 = 0;
      label = 28;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $14 = $reg + 16 | 0;
    var $15 = HEAP32[$14 >> 2];
    var $16 = ($15 | 0) == 0;
    if ($16) {
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    var $17 = HEAP32[$14 >> 2];
    var $18 = ($17 | 0) != 0;
    var $44 = $18;
    label = 12;
    break;
   case 6:
    var $20 = $15 + 4 | 0;
    var $21 = HEAP32[$20 >> 2];
    var $22 = ($21 | 0) == 0;
    if ($22) {
      label = 7;
      break;
    } else {
      label = 11;
      break;
    }
   case 7:
    var $24 = HEAP32[$2 >> 2];
    var $25 = HEAP32[$4 >> 2];
    var $26 = ($24 | 0) == ($25 | 0);
    if ($26) {
      label = 8;
      break;
    } else {
      var $37 = 0;
      label = 10;
      break;
    }
   case 8:
    var $28 = HEAP32[$8 >> 2];
    var $29 = HEAP32[$10 >> 2];
    var $30 = ($28 | 0) == ($29 | 0);
    if ($30) {
      label = 9;
      break;
    } else {
      var $37 = 0;
      label = 10;
      break;
    }
   case 9:
    var $32 = HEAP32[$14 >> 2];
    var $33 = $32 | 0;
    var $34 = HEAP32[$33 >> 2];
    var $35 = ($32 | 0) == 5242880;
    var $not_ = ($34 | 0) != 0;
    var $_ = $35 | $not_;
    var $37 = $_;
    label = 10;
    break;
   case 10:
    var $37;
    var $38 = $37 & 1;
    var $_0 = $38;
    label = 28;
    break;
   case 11:
    var $40 = ($21 | 0) == 1;
    var $41 = HEAP32[$14 >> 2];
    var $42 = ($41 | 0) != 0;
    if ($40) {
      var $44 = $42;
      label = 12;
      break;
    } else {
      label = 13;
      break;
    }
   case 12:
    var $44;
    var $45 = $44 & 1;
    var $46 = $45 ^ 1;
    var $_0 = $46;
    label = 28;
    break;
   case 13:
    if ($42) {
      label = 14;
      break;
    } else {
      var $52 = $1;
      label = 15;
      break;
    }
   case 14:
    var $49 = $41 + 8 | 0;
    var $50 = $49;
    var $52 = $50;
    label = 15;
    break;
   case 15:
    var $52;
    var $box_sroa_0_0__idx = $52 | 0;
    var $box_sroa_0_0_copyload = HEAP32[$box_sroa_0_0__idx >> 2];
    var $box_sroa_1_4__idx2 = $52 + 4 | 0;
    var $box_sroa_1_4_copyload = HEAP32[$box_sroa_1_4__idx2 >> 2];
    var $box_sroa_2_8__idx4 = $52 + 8 | 0;
    var $box_sroa_2_8_copyload = HEAP32[$box_sroa_2_8__idx4 >> 2];
    var $53 = $21 - 1 | 0;
    var $54 = $52 + ($53 << 4) + 12 | 0;
    var $55 = HEAP32[$54 >> 2];
    var $56 = $21 - 1 | 0;
    var $57 = ($56 | 0) > 0;
    if ($57) {
      var $box_sroa_2_052 = $box_sroa_2_8_copyload;
      var $box_sroa_0_053 = $box_sroa_0_0_copyload;
      var $_pn = $52;
      var $58 = $56;
      label = 16;
      break;
    } else {
      var $box_sroa_2_0_lcssa = $box_sroa_2_8_copyload;
      var $box_sroa_0_0_lcssa = $box_sroa_0_0_copyload;
      label = 23;
      break;
    }
   case 16:
    var $58;
    var $_pn;
    var $box_sroa_0_053;
    var $box_sroa_2_052;
    var $pbox_n_054 = $_pn + 16 | 0;
    var $59 = $pbox_n_054 | 0;
    var $60 = HEAP32[$59 >> 2];
    var $61 = $_pn + 24 | 0;
    var $62 = HEAP32[$61 >> 2];
    var $63 = ($60 | 0) < ($62 | 0);
    if ($63) {
      label = 17;
      break;
    } else {
      var $_0 = 0;
      label = 28;
      break;
    }
   case 17:
    var $65 = $_pn + 20 | 0;
    var $66 = HEAP32[$65 >> 2];
    var $67 = $_pn + 28 | 0;
    var $68 = HEAP32[$67 >> 2];
    var $69 = ($66 | 0) < ($68 | 0);
    if ($69) {
      label = 18;
      break;
    } else {
      var $_0 = 0;
      label = 28;
      break;
    }
   case 18:
    var $71 = ($60 | 0) < ($box_sroa_0_053 | 0);
    var $_box_sroa_0_0 = $71 ? $60 : $box_sroa_0_053;
    var $72 = ($62 | 0) > ($box_sroa_2_052 | 0);
    var $box_sroa_2_1 = $72 ? $62 : $box_sroa_2_052;
    var $73 = $_pn + 4 | 0;
    var $74 = HEAP32[$73 >> 2];
    var $75 = ($66 | 0) < ($74 | 0);
    if ($75) {
      var $_0 = 0;
      label = 28;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $77 = ($66 | 0) == ($74 | 0);
    if ($77) {
      label = 20;
      break;
    } else {
      label = 22;
      break;
    }
   case 20:
    var $79 = $_pn + 8 | 0;
    var $80 = HEAP32[$79 >> 2];
    var $81 = ($60 | 0) < ($80 | 0);
    if ($81) {
      var $_0 = 0;
      label = 28;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $83 = $_pn + 12 | 0;
    var $84 = HEAP32[$83 >> 2];
    var $85 = ($68 | 0) == ($84 | 0);
    if ($85) {
      label = 22;
      break;
    } else {
      var $_0 = 0;
      label = 28;
      break;
    }
   case 22:
    var $87 = $58 - 1 | 0;
    var $88 = ($87 | 0) > 0;
    if ($88) {
      var $box_sroa_2_052 = $box_sroa_2_1;
      var $box_sroa_0_053 = $_box_sroa_0_0;
      var $_pn = $pbox_n_054;
      var $58 = $87;
      label = 16;
      break;
    } else {
      var $box_sroa_2_0_lcssa = $box_sroa_2_1;
      var $box_sroa_0_0_lcssa = $_box_sroa_0_0;
      label = 23;
      break;
    }
   case 23:
    var $box_sroa_0_0_lcssa;
    var $box_sroa_2_0_lcssa;
    var $89 = HEAP32[$2 >> 2];
    var $90 = ($box_sroa_0_0_lcssa | 0) == ($89 | 0);
    if ($90) {
      label = 24;
      break;
    } else {
      var $101 = 0;
      label = 27;
      break;
    }
   case 24:
    var $92 = HEAP32[$4 >> 2];
    var $93 = ($box_sroa_2_0_lcssa | 0) == ($92 | 0);
    if ($93) {
      label = 25;
      break;
    } else {
      var $101 = 0;
      label = 27;
      break;
    }
   case 25:
    var $95 = HEAP32[$8 >> 2];
    var $96 = ($box_sroa_1_4_copyload | 0) == ($95 | 0);
    if ($96) {
      label = 26;
      break;
    } else {
      var $101 = 0;
      label = 27;
      break;
    }
   case 26:
    var $98 = HEAP32[$10 >> 2];
    var $99 = ($55 | 0) == ($98 | 0);
    var $101 = $99;
    label = 27;
    break;
   case 27:
    var $101;
    var $102 = $101 & 1;
    var $_0 = $102;
    label = 28;
    break;
   case 28:
    var $_0;
    return $_0;
  }
}
_pixman_region32_selfcheck["X"] = 1;
function _pixman_region32_contains_point($region, $x, $y, $box) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $8 = 1;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      var $8 = $6;
      label = 4;
      break;
    }
   case 4:
    var $8;
    var $9 = $region + 8 | 0;
    var $10 = HEAP32[$9 >> 2];
    var $11 = ($10 | 0) > ($x | 0);
    if ($11) {
      label = 5;
      break;
    } else {
      var $_0 = 0;
      label = 18;
      break;
    }
   case 5:
    var $13 = $region | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($14 | 0) > ($x | 0);
    if ($15) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $17 = $region + 12 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($18 | 0) > ($y | 0);
    if ($19) {
      label = 7;
      break;
    } else {
      var $_0 = 0;
      label = 18;
      break;
    }
   case 7:
    var $21 = $region + 4 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = ($22 | 0) > ($y | 0);
    if ($23) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $25 = ($8 | 0) == 1;
    if ($25) {
      label = 9;
      break;
    } else {
      label = 11;
      break;
    }
   case 9:
    var $27 = ($box | 0) == 0;
    if ($27) {
      var $_0 = 1;
      label = 18;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $29 = $box;
    var $30 = $region;
    HEAP32[$29 >> 2] = HEAP32[$30 >> 2];
    HEAP32[$29 + 4 >> 2] = HEAP32[$30 + 4 >> 2];
    HEAP32[$29 + 8 >> 2] = HEAP32[$30 + 8 >> 2];
    HEAP32[$29 + 12 >> 2] = HEAP32[$30 + 12 >> 2];
    var $_0 = 1;
    label = 18;
    break;
   case 11:
    var $32 = HEAP32[$1 >> 2];
    var $33 = $32 + 8 | 0;
    var $34 = $33;
    var $35 = $34 + ($8 << 4) | 0;
    var $36 = _find_box_for_y($34, $35, $y);
    var $pbox_0 = $36;
    label = 12;
    break;
   case 12:
    var $pbox_0;
    var $38 = ($pbox_0 | 0) == ($35 | 0);
    if ($38) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $40 = $pbox_0 + 4 | 0;
    var $41 = HEAP32[$40 >> 2];
    var $42 = ($41 | 0) > ($y | 0);
    if ($42) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $44 = $pbox_0 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = ($45 | 0) > ($x | 0);
    if ($46) {
      var $_0 = 0;
      label = 18;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $48 = $pbox_0 + 8 | 0;
    var $49 = HEAP32[$48 >> 2];
    var $50 = ($49 | 0) > ($x | 0);
    var $51 = $pbox_0 + 16 | 0;
    if ($50) {
      label = 16;
      break;
    } else {
      var $pbox_0 = $51;
      label = 12;
      break;
    }
   case 16:
    var $53 = ($box | 0) == 0;
    if ($53) {
      var $_0 = 1;
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $55 = $box;
    var $56 = $pbox_0;
    HEAP32[$55 >> 2] = HEAP32[$56 >> 2];
    HEAP32[$55 + 4 >> 2] = HEAP32[$56 + 4 >> 2];
    HEAP32[$55 + 8 >> 2] = HEAP32[$56 + 8 >> 2];
    HEAP32[$55 + 12 >> 2] = HEAP32[$56 + 12 >> 2];
    var $_0 = 1;
    label = 18;
    break;
   case 18:
    var $_0;
    return $_0;
  }
}
_pixman_region32_contains_point["X"] = 1;
function _pixman_region32_init_rects($region, $boxes, $count) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($count | 0) == 1;
    if ($1) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $3 = $boxes | 0;
    var $4 = HEAP32[$3 >> 2];
    var $5 = $boxes + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = $boxes + 8 | 0;
    var $8 = HEAP32[$7 >> 2];
    var $9 = $8 - $4 | 0;
    var $10 = $boxes + 12 | 0;
    var $11 = HEAP32[$10 >> 2];
    var $12 = $11 - $6 | 0;
    _pixman_region32_init_rect($region, $4, $6, $9, $12);
    var $_0 = 1;
    label = 26;
    break;
   case 4:
    _pixman_region32_init($region);
    var $14 = ($count | 0) == 0;
    if ($14) {
      var $_0 = 1;
      label = 26;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $16 = _pixman_rect_alloc($region, $count);
    var $17 = ($16 | 0) == 0;
    if ($17) {
      var $_0 = 0;
      label = 26;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $19 = $region + 16 | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = ($20 | 0) == 0;
    if ($21) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $23 = $20 + 8 | 0;
    var $24 = $23;
    var $28 = $24;
    label = 9;
    break;
   case 8:
    var $26 = $region | 0;
    var $28 = $26;
    label = 9;
    break;
   case 9:
    var $28;
    var $29 = $28;
    var $30 = $boxes;
    var $31 = $count << 4;
    _memcpy($29, $30, $31);
    var $32 = HEAP32[$19 >> 2];
    var $33 = $32 + 4 | 0;
    HEAP32[$33 >> 2] = $count;
    var $34 = ($count | 0) > 0;
    if ($34) {
      var $displacement_046 = 0;
      var $i_047 = 0;
      label = 10;
      break;
    } else {
      var $displacement_0_lcssa = 0;
      label = 16;
      break;
    }
   case 10:
    var $i_047;
    var $displacement_046;
    var $35 = $28 + ($i_047 << 4) | 0;
    var $36 = $35 | 0;
    var $37 = HEAP32[$36 >> 2];
    var $38 = $28 + ($i_047 << 4) + 8 | 0;
    var $39 = HEAP32[$38 >> 2];
    var $40 = ($37 | 0) < ($39 | 0);
    if ($40) {
      label = 11;
      break;
    } else {
      label = 12;
      break;
    }
   case 11:
    var $42 = $28 + ($i_047 << 4) + 4 | 0;
    var $43 = HEAP32[$42 >> 2];
    var $44 = $28 + ($i_047 << 4) + 12 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = ($43 | 0) < ($45 | 0);
    if ($46) {
      label = 13;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $48 = $displacement_046 + 1 | 0;
    var $displacement_1 = $48;
    label = 15;
    break;
   case 13:
    var $50 = ($displacement_046 | 0) == 0;
    if ($50) {
      var $displacement_1 = 0;
      label = 15;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $52 = $i_047 - $displacement_046 | 0;
    var $53 = $28 + ($52 << 4) | 0;
    var $54 = $53;
    var $55 = $35;
    HEAP32[$54 >> 2] = HEAP32[$55 >> 2];
    HEAP32[$54 + 4 >> 2] = HEAP32[$55 + 4 >> 2];
    HEAP32[$54 + 8 >> 2] = HEAP32[$55 + 8 >> 2];
    HEAP32[$54 + 12 >> 2] = HEAP32[$55 + 12 >> 2];
    var $displacement_1 = $displacement_046;
    label = 15;
    break;
   case 15:
    var $displacement_1;
    var $57 = $i_047 + 1 | 0;
    var $exitcond = ($57 | 0) == ($count | 0);
    if ($exitcond) {
      var $displacement_0_lcssa = $displacement_1;
      label = 16;
      break;
    } else {
      var $displacement_046 = $displacement_1;
      var $i_047 = $57;
      label = 10;
      break;
    }
   case 16:
    var $displacement_0_lcssa;
    var $58 = HEAP32[$19 >> 2];
    var $59 = $58 + 4 | 0;
    var $60 = HEAP32[$59 >> 2];
    var $61 = $60 - $displacement_0_lcssa | 0;
    HEAP32[$59 >> 2] = $61;
    var $62 = HEAP32[$19 >> 2];
    var $63 = $62 + 4 | 0;
    var $64 = HEAP32[$63 >> 2];
    if (($64 | 0) == 0) {
      label = 17;
      break;
    } else if (($64 | 0) == 1) {
      label = 21;
      break;
    } else {
      label = 25;
      break;
    }
   case 17:
    var $66 = ($62 | 0) == 0;
    if ($66) {
      label = 20;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $68 = $62 | 0;
    var $69 = HEAP32[$68 >> 2];
    var $70 = ($69 | 0) == 0;
    if ($70) {
      label = 20;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $72 = $62;
    _free($72);
    label = 20;
    break;
   case 20:
    _pixman_region32_init($region);
    var $_0 = 1;
    label = 26;
    break;
   case 21:
    var $75 = $region;
    HEAP32[$75 >> 2] = HEAP32[$29 >> 2];
    HEAP32[$75 + 4 >> 2] = HEAP32[$29 + 4 >> 2];
    HEAP32[$75 + 8 >> 2] = HEAP32[$29 + 8 >> 2];
    HEAP32[$75 + 12 >> 2] = HEAP32[$29 + 12 >> 2];
    var $76 = HEAP32[$19 >> 2];
    var $77 = ($76 | 0) == 0;
    if ($77) {
      label = 24;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $79 = $76 | 0;
    var $80 = HEAP32[$79 >> 2];
    var $81 = ($80 | 0) == 0;
    if ($81) {
      label = 24;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $83 = $76;
    _free($83);
    label = 24;
    break;
   case 24:
    HEAP32[$19 >> 2] = 0;
    var $_0 = 1;
    label = 26;
    break;
   case 25:
    var $86 = $region + 8 | 0;
    HEAP32[$86 >> 2] = 0;
    var $87 = $region | 0;
    HEAP32[$87 >> 2] = 0;
    var $88 = _validate($region);
    var $_0 = $88;
    label = 26;
    break;
   case 26:
    var $_0;
    return $_0;
  }
}
_pixman_region32_init_rects["X"] = 1;
function _pixman_rect_alloc($region, $n) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $region + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) == 0;
    if ($3) {
      label = 3;
      break;
    } else {
      label = 6;
      break;
    }
   case 3:
    var $5 = $n + 1 | 0;
    var $6 = _alloc_data($5);
    HEAP32[$1 >> 2] = $6;
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 4;
      break;
    } else {
      label = 5;
      break;
    }
   case 4:
    _pixman_break($region);
    var $_0 = 0;
    label = 17;
    break;
   case 5:
    var $10 = $6 + 4 | 0;
    HEAP32[$10 >> 2] = 1;
    var $11 = HEAP32[$1 >> 2];
    var $12 = $11 + 8 | 0;
    var $13 = $12;
    var $14 = $region;
    HEAP32[$13 >> 2] = HEAP32[$14 >> 2];
    HEAP32[$13 + 4 >> 2] = HEAP32[$14 + 4 >> 2];
    HEAP32[$13 + 8 >> 2] = HEAP32[$14 + 8 >> 2];
    HEAP32[$13 + 12 >> 2] = HEAP32[$14 + 12 >> 2];
    var $_1 = $5;
    label = 16;
    break;
   case 6:
    var $16 = $2 | 0;
    var $17 = HEAP32[$16 >> 2];
    var $18 = ($17 | 0) == 0;
    if ($18) {
      label = 7;
      break;
    } else {
      label = 10;
      break;
    }
   case 7:
    var $20 = _alloc_data($n);
    HEAP32[$1 >> 2] = $20;
    var $21 = ($20 | 0) == 0;
    if ($21) {
      label = 8;
      break;
    } else {
      label = 9;
      break;
    }
   case 8:
    _pixman_break($region);
    var $_0 = 0;
    label = 17;
    break;
   case 9:
    var $24 = $20 + 4 | 0;
    HEAP32[$24 >> 2] = 0;
    var $_1 = $n;
    label = 16;
    break;
   case 10:
    var $26 = ($n | 0) == 1;
    if ($26) {
      label = 11;
      break;
    } else {
      var $_026 = $n;
      label = 12;
      break;
    }
   case 11:
    var $28 = $2 + 4 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $30 = ($29 | 0) > 500;
    var $_ = $30 ? 250 : $29;
    var $_026 = $_;
    label = 12;
    break;
   case 12:
    var $_026;
    var $32 = HEAP32[$1 >> 2];
    var $33 = $32 + 4 | 0;
    var $34 = HEAP32[$33 >> 2];
    var $35 = $34 + $_026 | 0;
    var $36 = _PIXREGION_SZOF($35);
    var $37 = ($36 | 0) == 0;
    if ($37) {
      label = 14;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $39 = $32;
    var $40 = _realloc($39, $36);
    var $41 = ($40 | 0) == 0;
    if ($41) {
      label = 14;
      break;
    } else {
      label = 15;
      break;
    }
   case 14:
    _pixman_break($region);
    var $_0 = 0;
    label = 17;
    break;
   case 15:
    var $43 = $40;
    HEAP32[$1 >> 2] = $43;
    var $_1 = $35;
    label = 16;
    break;
   case 16:
    var $_1;
    var $45 = HEAP32[$1 >> 2];
    var $46 = $45 | 0;
    HEAP32[$46 >> 2] = $_1;
    var $_0 = 1;
    label = 17;
    break;
   case 17:
    var $_0;
    return $_0;
  }
}
_pixman_rect_alloc["X"] = 1;
function _PIXREGION_SZOF($n) {
  return $n >>> 0 > 268435455 ? 0 : $n << 4 | 8;
}
function _validate($badreg) {
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 1792 | 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $stack_regions = __stackBase__;
    var $1 = $badreg + 16 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = ($2 | 0) != 0;
    if ($3) {
      label = 3;
      break;
    } else {
      var $_0 = 1;
      label = 84;
      break;
    }
   case 3:
    var $5 = $2 + 4 | 0;
    var $6 = HEAP32[$5 >> 2];
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 4;
      break;
    } else {
      label = 5;
      break;
    }
   case 4:
    var $not_ = ($2 | 0) != 5242904;
    var $_ = $not_ & 1;
    var $_0 = $_;
    label = 84;
    break;
   case 5:
    var $10 = $badreg | 0;
    var $11 = HEAP32[$10 >> 2];
    var $12 = $badreg + 8 | 0;
    var $13 = HEAP32[$12 >> 2];
    var $14 = ($11 | 0) < ($13 | 0);
    if ($14) {
      label = 6;
      break;
    } else {
      label = 15;
      break;
    }
   case 6:
    var $16 = ($6 | 0) == 1;
    if ($16) {
      label = 7;
      break;
    } else {
      label = 11;
      break;
    }
   case 7:
    if ($3) {
      label = 8;
      break;
    } else {
      label = 10;
      break;
    }
   case 8:
    var $19 = $2 | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = ($20 | 0) == 0;
    if ($21) {
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $23 = $2;
    _free($23);
    label = 10;
    break;
   case 10:
    HEAP32[$1 >> 2] = 0;
    var $_0 = 1;
    label = 84;
    break;
   case 11:
    var $26 = $2 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $28 = $27 >> 1;
    var $29 = ($6 | 0) < ($28 | 0);
    var $30 = ($27 | 0) > 50;
    var $or_cond = $29 & $30;
    if ($or_cond) {
      label = 12;
      break;
    } else {
      var $_0 = 1;
      label = 84;
      break;
    }
   case 12:
    var $32 = _PIXREGION_SZOF($6);
    var $33 = ($32 | 0) == 0;
    if ($33) {
      var $_0 = 1;
      label = 84;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $35 = $2;
    var $36 = _realloc($35, $32);
    var $37 = ($36 | 0) == 0;
    if ($37) {
      var $_0 = 1;
      label = 84;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $39 = $36;
    var $40 = $36;
    HEAP32[$40 >> 2] = $6;
    HEAP32[$1 >> 2] = $39;
    var $_0 = 1;
    label = 84;
    break;
   case 15:
    var $42 = $2 + 8 | 0;
    var $43 = $42;
    _quick_sort_rects($43, $6);
    var $44 = $stack_regions | 0;
    var $45 = $stack_regions + 20 | 0;
    HEAP32[$45 >> 2] = 0;
    var $46 = $stack_regions + 24 | 0;
    HEAP32[$46 >> 2] = 0;
    var $47 = $stack_regions;
    var $48 = $badreg;
    HEAP32[$47 >> 2] = HEAP32[$48 >> 2];
    HEAP32[$47 + 4 >> 2] = HEAP32[$48 + 4 >> 2];
    HEAP32[$47 + 8 >> 2] = HEAP32[$48 + 8 >> 2];
    HEAP32[$47 + 12 >> 2] = HEAP32[$48 + 12 >> 2];
    HEAP32[$47 + 16 >> 2] = HEAP32[$48 + 16 >> 2];
    var $49 = $stack_regions + 16 | 0;
    var $50 = HEAP32[$49 >> 2];
    var $51 = $50 + 8 | 0;
    var $52 = $51;
    var $53 = $51;
    HEAP32[$47 >> 2] = HEAP32[$53 >> 2];
    HEAP32[$47 + 4 >> 2] = HEAP32[$53 + 4 >> 2];
    HEAP32[$47 + 8 >> 2] = HEAP32[$53 + 8 >> 2];
    HEAP32[$47 + 12 >> 2] = HEAP32[$53 + 12 >> 2];
    var $54 = HEAP32[$49 >> 2];
    var $55 = $54 + 4 | 0;
    HEAP32[$55 >> 2] = 1;
    HEAP32[$48 >> 2] = 0;
    HEAP32[$48 + 4 >> 2] = 0;
    HEAP32[$48 + 8 >> 2] = 0;
    HEAP32[$48 + 12 >> 2] = 0;
    HEAP32[$1 >> 2] = 5242880;
    var $ri_0_ph = $44;
    var $num_ri_0_ph = 1;
    var $size_ri_0_ph = 64;
    var $box_0_ph = $52;
    var $i_0_ph = $6;
    label = 16;
    break;
   case 16:
    var $i_0_ph;
    var $box_0_ph;
    var $size_ri_0_ph;
    var $num_ri_0_ph;
    var $ri_0_ph;
    var $56 = $i_0_ph - 1 | 0;
    var $57 = ($56 | 0) > 0;
    if ($57) {
      var $i_0220 = $i_0_ph;
      var $box_0221 = $box_0_ph;
      var $59 = $56;
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $58 = ($num_ri_0_ph | 0) > 0;
    if ($58) {
      var $rit_3196 = $ri_0_ph;
      var $_in = $num_ri_0_ph;
      label = 49;
      break;
    } else {
      var $num_ri_1 = $num_ri_0_ph;
      var $ret_0 = 1;
      label = 59;
      break;
    }
   case 18:
    var $59;
    var $box_0221;
    var $i_0220;
    var $60 = $box_0221 + 16 | 0;
    var $61 = $box_0221 + 20 | 0;
    var $62 = $box_0221 + 28 | 0;
    var $rit_0 = $ri_0_ph;
    var $j_0 = $num_ri_0_ph;
    label = 19;
    break;
   case 19:
    var $j_0;
    var $rit_0;
    var $64 = $j_0 - 1 | 0;
    var $65 = ($j_0 | 0) > 0;
    if ($65) {
      label = 20;
      break;
    } else {
      label = 41;
      break;
    }
   case 20:
    var $67 = $rit_0 | 0;
    var $68 = $rit_0 + 16 | 0;
    var $69 = HEAP32[$68 >> 2];
    var $70 = $69 + 4 | 0;
    var $71 = HEAP32[$70 >> 2];
    var $72 = $71 - 1 | 0;
    var $73 = $69 + 8 | 0;
    var $74 = $73;
    var $75 = HEAP32[$61 >> 2];
    var $76 = $74 + ($72 << 4) + 4 | 0;
    var $77 = HEAP32[$76 >> 2];
    var $78 = ($75 | 0) == ($77 | 0);
    if ($78) {
      label = 21;
      break;
    } else {
      label = 30;
      break;
    }
   case 21:
    var $80 = HEAP32[$62 >> 2];
    var $81 = $74 + ($72 << 4) + 12 | 0;
    var $82 = HEAP32[$81 >> 2];
    var $83 = ($80 | 0) == ($82 | 0);
    if ($83) {
      label = 22;
      break;
    } else {
      label = 30;
      break;
    }
   case 22:
    var $85 = $60 | 0;
    var $86 = HEAP32[$85 >> 2];
    var $87 = $74 + ($72 << 4) + 8 | 0;
    var $88 = HEAP32[$87 >> 2];
    var $89 = ($86 | 0) > ($88 | 0);
    if ($89) {
      label = 25;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $91 = $box_0221 + 24 | 0;
    var $92 = HEAP32[$91 >> 2];
    var $93 = ($92 | 0) > ($88 | 0);
    if ($93) {
      label = 24;
      break;
    } else {
      label = 29;
      break;
    }
   case 24:
    HEAP32[$87 >> 2] = $92;
    label = 29;
    break;
   case 25:
    var $96 = ($69 | 0) == 0;
    if ($96) {
      label = 27;
      break;
    } else {
      label = 26;
      break;
    }
   case 26:
    var $98 = $71 + 1 | 0;
    var $99 = $69 | 0;
    var $100 = HEAP32[$99 >> 2];
    var $101 = ($98 | 0) > ($100 | 0);
    if ($101) {
      label = 27;
      break;
    } else {
      label = 28;
      break;
    }
   case 27:
    var $103 = _pixman_rect_alloc($67, 1);
    var $104 = ($103 | 0) == 0;
    if ($104) {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $num_ri_0_ph;
      label = 76;
      break;
    } else {
      label = 28;
      break;
    }
   case 28:
    var $106 = HEAP32[$68 >> 2];
    var $107 = $106 + 4 | 0;
    var $108 = HEAP32[$107 >> 2];
    var $109 = $106 + 8 | 0;
    var $110 = $109;
    var $111 = $110 + ($108 << 4) | 0;
    var $112 = $111;
    var $113 = $60;
    HEAP32[$112 >> 2] = HEAP32[$113 >> 2];
    HEAP32[$112 + 4 >> 2] = HEAP32[$113 + 4 >> 2];
    HEAP32[$112 + 8 >> 2] = HEAP32[$113 + 8 >> 2];
    HEAP32[$112 + 12 >> 2] = HEAP32[$113 + 12 >> 2];
    var $114 = HEAP32[$68 >> 2];
    var $115 = $114 + 4 | 0;
    var $116 = HEAP32[$115 >> 2];
    var $117 = $116 + 1 | 0;
    HEAP32[$115 >> 2] = $117;
    label = 29;
    break;
   case 29:
    var $118 = $59 - 1 | 0;
    var $119 = ($118 | 0) > 0;
    if ($119) {
      var $i_0220 = $59;
      var $box_0221 = $60;
      var $59 = $118;
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 30:
    var $121 = HEAP32[$61 >> 2];
    var $122 = $74 + ($72 << 4) + 12 | 0;
    var $123 = HEAP32[$122 >> 2];
    var $124 = ($121 | 0) < ($123 | 0);
    var $125 = $rit_0 + 28 | 0;
    if ($124) {
      var $rit_0 = $125;
      var $j_0 = $64;
      label = 19;
      break;
    } else {
      label = 31;
      break;
    }
   case 31:
    var $127 = $rit_0 + 8 | 0;
    var $128 = HEAP32[$127 >> 2];
    var $129 = $74 + ($72 << 4) + 8 | 0;
    var $130 = HEAP32[$129 >> 2];
    var $131 = ($128 | 0) < ($130 | 0);
    if ($131) {
      label = 32;
      break;
    } else {
      label = 33;
      break;
    }
   case 32:
    HEAP32[$127 >> 2] = $130;
    label = 33;
    break;
   case 33:
    var $134 = $rit_0 | 0;
    var $135 = HEAP32[$134 >> 2];
    var $136 = $60 | 0;
    var $137 = HEAP32[$136 >> 2];
    var $138 = ($135 | 0) > ($137 | 0);
    if ($138) {
      label = 34;
      break;
    } else {
      label = 35;
      break;
    }
   case 34:
    HEAP32[$134 >> 2] = $137;
    label = 35;
    break;
   case 35:
    var $141 = $rit_0 + 24 | 0;
    var $142 = HEAP32[$141 >> 2];
    var $143 = $rit_0 + 20 | 0;
    var $144 = HEAP32[$143 >> 2];
    var $145 = $142 - $144 | 0;
    var $146 = HEAP32[$68 >> 2];
    var $147 = $146 + 4 | 0;
    var $148 = HEAP32[$147 >> 2];
    var $149 = $148 - $142 | 0;
    var $150 = ($145 | 0) == ($149 | 0);
    if ($150) {
      label = 36;
      break;
    } else {
      var $storemerge187 = $142;
      label = 37;
      break;
    }
   case 36:
    var $152 = _pixman_coalesce($67, $144, $142);
    var $storemerge187 = $152;
    label = 37;
    break;
   case 37:
    var $storemerge187;
    HEAP32[$143 >> 2] = $storemerge187;
    var $154 = HEAP32[$68 >> 2];
    var $155 = $154 + 4 | 0;
    var $156 = HEAP32[$155 >> 2];
    HEAP32[$141 >> 2] = $156;
    var $157 = HEAP32[$68 >> 2];
    var $158 = ($157 | 0) == 0;
    if ($158) {
      label = 39;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    var $160 = $157 + 4 | 0;
    var $161 = HEAP32[$160 >> 2];
    var $162 = $161 + 1 | 0;
    var $163 = $157 | 0;
    var $164 = HEAP32[$163 >> 2];
    var $165 = ($162 | 0) > ($164 | 0);
    if ($165) {
      label = 39;
      break;
    } else {
      label = 40;
      break;
    }
   case 39:
    var $167 = _pixman_rect_alloc($67, 1);
    var $168 = ($167 | 0) == 0;
    if ($168) {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $num_ri_0_ph;
      label = 76;
      break;
    } else {
      label = 40;
      break;
    }
   case 40:
    var $170 = HEAP32[$68 >> 2];
    var $171 = $170 + 4 | 0;
    var $172 = HEAP32[$171 >> 2];
    var $173 = $170 + 8 | 0;
    var $174 = $173;
    var $175 = $174 + ($172 << 4) | 0;
    var $176 = $175;
    var $177 = $60;
    HEAP32[$176 >> 2] = HEAP32[$177 >> 2];
    HEAP32[$176 + 4 >> 2] = HEAP32[$177 + 4 >> 2];
    HEAP32[$176 + 8 >> 2] = HEAP32[$177 + 8 >> 2];
    HEAP32[$176 + 12 >> 2] = HEAP32[$177 + 12 >> 2];
    var $178 = HEAP32[$68 >> 2];
    var $179 = $178 + 4 | 0;
    var $180 = HEAP32[$179 >> 2];
    var $181 = $180 + 1 | 0;
    HEAP32[$179 >> 2] = $181;
    label = 29;
    break;
   case 41:
    var $183 = ($size_ri_0_ph | 0) == ($num_ri_0_ph | 0);
    if ($183) {
      label = 42;
      break;
    } else {
      var $ri_1 = $ri_0_ph;
      var $size_ri_1 = $size_ri_0_ph;
      var $rit_2 = $rit_0;
      label = 48;
      break;
    }
   case 42:
    var $185 = $size_ri_0_ph << 1;
    var $186 = $size_ri_0_ph * 56 & -1;
    var $187 = Math.floor(($186 >>> 0) / ($185 >>> 0));
    var $188 = ($187 | 0) == 28;
    if ($188) {
      label = 43;
      break;
    } else {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $num_ri_0_ph;
      label = 76;
      break;
    }
   case 43:
    var $190 = ($ri_0_ph | 0) == ($44 | 0);
    if ($190) {
      label = 44;
      break;
    } else {
      label = 46;
      break;
    }
   case 44:
    var $192 = _malloc($186);
    var $193 = ($192 | 0) == 0;
    if ($193) {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $num_ri_0_ph;
      label = 76;
      break;
    } else {
      label = 45;
      break;
    }
   case 45:
    var $195 = $ri_0_ph;
    var $196 = $num_ri_0_ph * 28 & -1;
    _memcpy($192, $195, $196);
    var $rit_1_in = $192;
    label = 47;
    break;
   case 46:
    var $198 = $ri_0_ph;
    var $199 = _realloc($198, $186);
    var $200 = ($199 | 0) == 0;
    if ($200) {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $num_ri_0_ph;
      label = 76;
      break;
    } else {
      var $rit_1_in = $199;
      label = 47;
      break;
    }
   case 47:
    var $rit_1_in;
    var $rit_1 = $rit_1_in;
    var $202 = $rit_1 + ($num_ri_0_ph * 28 & -1) | 0;
    var $ri_1 = $rit_1;
    var $size_ri_1 = $185;
    var $rit_2 = $202;
    label = 48;
    break;
   case 48:
    var $rit_2;
    var $size_ri_1;
    var $ri_1;
    var $204 = $num_ri_0_ph + 1 | 0;
    var $205 = $rit_2 + 20 | 0;
    HEAP32[$205 >> 2] = 0;
    var $206 = $rit_2 + 24 | 0;
    HEAP32[$206 >> 2] = 0;
    var $207 = $rit_2 | 0;
    var $208 = $rit_2;
    var $209 = $60;
    HEAP32[$208 >> 2] = HEAP32[$209 >> 2];
    HEAP32[$208 + 4 >> 2] = HEAP32[$209 + 4 >> 2];
    HEAP32[$208 + 8 >> 2] = HEAP32[$209 + 8 >> 2];
    HEAP32[$208 + 12 >> 2] = HEAP32[$209 + 12 >> 2];
    var $210 = $rit_2 + 16 | 0;
    HEAP32[$210 >> 2] = 0;
    var $211 = $num_ri_0_ph + $i_0220 | 0;
    var $212 = ($211 | 0) / ($204 | 0) & -1;
    var $213 = _pixman_rect_alloc($207, $212);
    var $214 = ($213 | 0) == 0;
    if ($214) {
      var $ri_2 = $ri_1;
      var $num_ri_2 = $204;
      label = 76;
      break;
    } else {
      var $ri_0_ph = $ri_1;
      var $num_ri_0_ph = $204;
      var $size_ri_0_ph = $size_ri_1;
      var $box_0_ph = $60;
      var $i_0_ph = $59;
      label = 16;
      break;
    }
   case 49:
    var $_in;
    var $rit_3196;
    var $215 = $_in - 1 | 0;
    var $216 = $rit_3196 | 0;
    var $217 = $rit_3196 + 16 | 0;
    var $218 = HEAP32[$217 >> 2];
    var $219 = $218 + 4 | 0;
    var $220 = HEAP32[$219 >> 2];
    var $221 = $220 - 1 | 0;
    var $222 = $218 + 8 | 0;
    var $223 = $222;
    var $224 = $223 + ($221 << 4) + 12 | 0;
    var $225 = HEAP32[$224 >> 2];
    var $226 = $rit_3196 + 12 | 0;
    HEAP32[$226 >> 2] = $225;
    var $227 = $rit_3196 + 8 | 0;
    var $228 = HEAP32[$227 >> 2];
    var $229 = $223 + ($221 << 4) + 8 | 0;
    var $230 = HEAP32[$229 >> 2];
    var $231 = ($228 | 0) < ($230 | 0);
    if ($231) {
      label = 50;
      break;
    } else {
      label = 51;
      break;
    }
   case 50:
    HEAP32[$227 >> 2] = $230;
    label = 51;
    break;
   case 51:
    var $234 = $rit_3196 + 24 | 0;
    var $235 = HEAP32[$234 >> 2];
    var $236 = $rit_3196 + 20 | 0;
    var $237 = HEAP32[$236 >> 2];
    var $238 = $235 - $237 | 0;
    var $239 = HEAP32[$217 >> 2];
    var $240 = $239 + 4 | 0;
    var $241 = HEAP32[$240 >> 2];
    var $242 = $241 - $235 | 0;
    var $243 = ($238 | 0) == ($242 | 0);
    if ($243) {
      label = 52;
      break;
    } else {
      var $storemerge = $235;
      label = 53;
      break;
    }
   case 52:
    var $245 = _pixman_coalesce($216, $237, $235);
    var $storemerge = $245;
    label = 53;
    break;
   case 53:
    var $storemerge;
    HEAP32[$236 >> 2] = $storemerge;
    var $247 = HEAP32[$217 >> 2];
    var $248 = $247 + 4 | 0;
    var $249 = HEAP32[$248 >> 2];
    var $250 = ($249 | 0) == 1;
    if ($250) {
      label = 54;
      break;
    } else {
      label = 58;
      break;
    }
   case 54:
    var $252 = ($247 | 0) == 0;
    if ($252) {
      label = 57;
      break;
    } else {
      label = 55;
      break;
    }
   case 55:
    var $254 = $247 | 0;
    var $255 = HEAP32[$254 >> 2];
    var $256 = ($255 | 0) == 0;
    if ($256) {
      label = 57;
      break;
    } else {
      label = 56;
      break;
    }
   case 56:
    var $258 = $247;
    _free($258);
    label = 57;
    break;
   case 57:
    HEAP32[$217 >> 2] = 0;
    label = 58;
    break;
   case 58:
    var $261 = $rit_3196 + 28 | 0;
    var $262 = ($215 | 0) > 0;
    if ($262) {
      var $rit_3196 = $261;
      var $_in = $215;
      label = 49;
      break;
    } else {
      var $num_ri_1 = $num_ri_0_ph;
      var $ret_0 = 1;
      label = 59;
      break;
    }
   case 59:
    var $ret_0;
    var $num_ri_1;
    var $263 = ($num_ri_1 | 0) > 1;
    if ($263) {
      label = 60;
      break;
    } else {
      label = 74;
      break;
    }
   case 60:
    var $264 = ($num_ri_1 | 0) / 2 & -1;
    var $265 = $num_ri_1 & 1;
    var $266 = $264 + $265 | 0;
    var $j_2189 = $265;
    var $ret_1190 = $ret_0;
    label = 61;
    break;
   case 61:
    var $ret_1190;
    var $j_2189;
    var $268 = $ri_0_ph + ($j_2189 * 28 & -1) | 0;
    var $269 = $j_2189 + $264 | 0;
    var $270 = $ri_0_ph + ($269 * 28 & -1) | 0;
    var $271 = _pixman_op($268, $268, $270, 18, 1, 1);
    var $272 = ($271 | 0) == 0;
    var $_ret_1 = $272 ? 0 : $ret_1190;
    var $273 = $270 | 0;
    var $274 = HEAP32[$273 >> 2];
    var $275 = $268 | 0;
    var $276 = HEAP32[$275 >> 2];
    var $277 = ($274 | 0) < ($276 | 0);
    if ($277) {
      label = 62;
      break;
    } else {
      label = 63;
      break;
    }
   case 62:
    HEAP32[$275 >> 2] = $274;
    label = 63;
    break;
   case 63:
    var $280 = $ri_0_ph + ($269 * 28 & -1) + 4 | 0;
    var $281 = HEAP32[$280 >> 2];
    var $282 = $ri_0_ph + ($j_2189 * 28 & -1) + 4 | 0;
    var $283 = HEAP32[$282 >> 2];
    var $284 = ($281 | 0) < ($283 | 0);
    if ($284) {
      label = 64;
      break;
    } else {
      label = 65;
      break;
    }
   case 64:
    HEAP32[$282 >> 2] = $281;
    label = 65;
    break;
   case 65:
    var $287 = $ri_0_ph + ($269 * 28 & -1) + 8 | 0;
    var $288 = HEAP32[$287 >> 2];
    var $289 = $ri_0_ph + ($j_2189 * 28 & -1) + 8 | 0;
    var $290 = HEAP32[$289 >> 2];
    var $291 = ($288 | 0) > ($290 | 0);
    if ($291) {
      label = 66;
      break;
    } else {
      label = 67;
      break;
    }
   case 66:
    HEAP32[$289 >> 2] = $288;
    label = 67;
    break;
   case 67:
    var $294 = $ri_0_ph + ($269 * 28 & -1) + 12 | 0;
    var $295 = HEAP32[$294 >> 2];
    var $296 = $ri_0_ph + ($j_2189 * 28 & -1) + 12 | 0;
    var $297 = HEAP32[$296 >> 2];
    var $298 = ($295 | 0) > ($297 | 0);
    if ($298) {
      label = 68;
      break;
    } else {
      label = 69;
      break;
    }
   case 68:
    HEAP32[$296 >> 2] = $295;
    label = 69;
    break;
   case 69:
    var $301 = $ri_0_ph + ($269 * 28 & -1) + 16 | 0;
    var $302 = HEAP32[$301 >> 2];
    var $303 = ($302 | 0) == 0;
    if ($303) {
      label = 72;
      break;
    } else {
      label = 70;
      break;
    }
   case 70:
    var $305 = $302 | 0;
    var $306 = HEAP32[$305 >> 2];
    var $307 = ($306 | 0) == 0;
    if ($307) {
      label = 72;
      break;
    } else {
      label = 71;
      break;
    }
   case 71:
    var $309 = $302;
    _free($309);
    label = 72;
    break;
   case 72:
    var $311 = $j_2189 + 1 | 0;
    var $312 = ($311 | 0) < ($266 | 0);
    if ($312) {
      var $j_2189 = $311;
      var $ret_1190 = $_ret_1;
      label = 61;
      break;
    } else {
      label = 73;
      break;
    }
   case 73:
    var $313 = $num_ri_1 - $264 | 0;
    var $314 = ($_ret_1 | 0) == 0;
    if ($314) {
      var $ri_2 = $ri_0_ph;
      var $num_ri_2 = $313;
      label = 76;
      break;
    } else {
      var $num_ri_1 = $313;
      var $ret_0 = $_ret_1;
      label = 59;
      break;
    }
   case 74:
    var $316 = $ri_0_ph;
    HEAP32[$48 >> 2] = HEAP32[$316 >> 2];
    HEAP32[$48 + 4 >> 2] = HEAP32[$316 + 4 >> 2];
    HEAP32[$48 + 8 >> 2] = HEAP32[$316 + 8 >> 2];
    HEAP32[$48 + 12 >> 2] = HEAP32[$316 + 12 >> 2];
    HEAP32[$48 + 16 >> 2] = HEAP32[$316 + 16 >> 2];
    var $317 = ($ri_0_ph | 0) == ($44 | 0);
    if ($317) {
      var $_0 = $ret_0;
      label = 84;
      break;
    } else {
      label = 75;
      break;
    }
   case 75:
    _free($316);
    var $_0 = $ret_0;
    label = 84;
    break;
   case 76:
    var $num_ri_2;
    var $ri_2;
    var $319 = ($num_ri_2 | 0) > 0;
    if ($319) {
      var $i_1188 = 0;
      label = 77;
      break;
    } else {
      label = 81;
      break;
    }
   case 77:
    var $i_1188;
    var $320 = $ri_2 + ($i_1188 * 28 & -1) + 16 | 0;
    var $321 = HEAP32[$320 >> 2];
    var $322 = ($321 | 0) == 0;
    if ($322) {
      label = 80;
      break;
    } else {
      label = 78;
      break;
    }
   case 78:
    var $324 = $321 | 0;
    var $325 = HEAP32[$324 >> 2];
    var $326 = ($325 | 0) == 0;
    if ($326) {
      label = 80;
      break;
    } else {
      label = 79;
      break;
    }
   case 79:
    var $328 = $321;
    _free($328);
    label = 80;
    break;
   case 80:
    var $330 = $i_1188 + 1 | 0;
    var $exitcond = ($330 | 0) == ($num_ri_2 | 0);
    if ($exitcond) {
      label = 81;
      break;
    } else {
      var $i_1188 = $330;
      label = 77;
      break;
    }
   case 81:
    var $331 = ($ri_2 | 0) == ($44 | 0);
    if ($331) {
      label = 83;
      break;
    } else {
      label = 82;
      break;
    }
   case 82:
    var $333 = $ri_2;
    _free($333);
    label = 83;
    break;
   case 83:
    _pixman_break($badreg);
    var $_0 = 0;
    label = 84;
    break;
   case 84:
    var $_0;
    STACKTOP = __stackBase__;
    return $_0;
  }
}
_validate["X"] = 1;
function _quick_sort_rects($rects, $numRects) {
  var label = 0;
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 64 | 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $t = __stackBase__;
    var $t1 = __stackBase__ + 16;
    var $t2 = __stackBase__ + 32;
    var $t3 = __stackBase__ + 48;
    var $1 = $t1;
    var $2 = $rects;
    var $3 = $rects + 4 | 0;
    var $4 = $rects | 0;
    var $5 = $t2;
    var $6 = $t3;
    var $_0 = $numRects;
    label = 3;
    break;
   case 3:
    var $_0;
    var $8 = ($_0 | 0) == 2;
    if ($8) {
      label = 4;
      break;
    } else {
      label = 8;
      break;
    }
   case 4:
    var $10 = $rects + 4 | 0;
    var $11 = HEAP32[$10 >> 2];
    var $12 = $rects + 16 | 0;
    var $13 = $rects + 20 | 0;
    var $14 = HEAP32[$13 >> 2];
    var $15 = ($11 | 0) > ($14 | 0);
    if ($15) {
      label = 7;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $17 = ($11 | 0) == ($14 | 0);
    if ($17) {
      label = 6;
      break;
    } else {
      label = 24;
      break;
    }
   case 6:
    var $19 = $rects | 0;
    var $20 = HEAP32[$19 >> 2];
    var $21 = $12 | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = ($20 | 0) > ($22 | 0);
    if ($23) {
      label = 7;
      break;
    } else {
      label = 24;
      break;
    }
   case 7:
    var $25 = $t;
    var $26 = $rects;
    HEAP32[$25 >> 2] = HEAP32[$26 >> 2];
    HEAP32[$25 + 4 >> 2] = HEAP32[$26 + 4 >> 2];
    HEAP32[$25 + 8 >> 2] = HEAP32[$26 + 8 >> 2];
    HEAP32[$25 + 12 >> 2] = HEAP32[$26 + 12 >> 2];
    var $27 = $12;
    HEAP32[$26 >> 2] = HEAP32[$27 >> 2];
    HEAP32[$26 + 4 >> 2] = HEAP32[$27 + 4 >> 2];
    HEAP32[$26 + 8 >> 2] = HEAP32[$27 + 8 >> 2];
    HEAP32[$26 + 12 >> 2] = HEAP32[$27 + 12 >> 2];
    HEAP32[$27 >> 2] = HEAP32[$25 >> 2];
    HEAP32[$27 + 4 >> 2] = HEAP32[$25 + 4 >> 2];
    HEAP32[$27 + 8 >> 2] = HEAP32[$25 + 8 >> 2];
    HEAP32[$27 + 12 >> 2] = HEAP32[$25 + 12 >> 2];
    label = 24;
    break;
   case 8:
    HEAP32[$1 >> 2] = HEAP32[$2 >> 2];
    HEAP32[$1 + 4 >> 2] = HEAP32[$2 + 4 >> 2];
    HEAP32[$1 + 8 >> 2] = HEAP32[$2 + 8 >> 2];
    HEAP32[$1 + 12 >> 2] = HEAP32[$2 + 12 >> 2];
    var $29 = $_0 >> 1;
    var $30 = $rects + ($29 << 4) | 0;
    var $31 = $30;
    HEAP32[$2 >> 2] = HEAP32[$31 >> 2];
    HEAP32[$2 + 4 >> 2] = HEAP32[$31 + 4 >> 2];
    HEAP32[$2 + 8 >> 2] = HEAP32[$31 + 8 >> 2];
    HEAP32[$2 + 12 >> 2] = HEAP32[$31 + 12 >> 2];
    HEAP32[$31 >> 2] = HEAP32[$1 >> 2];
    HEAP32[$31 + 4 >> 2] = HEAP32[$1 + 4 >> 2];
    HEAP32[$31 + 8 >> 2] = HEAP32[$1 + 8 >> 2];
    HEAP32[$31 + 12 >> 2] = HEAP32[$1 + 12 >> 2];
    var $32 = HEAP32[$3 >> 2];
    var $33 = HEAP32[$4 >> 2];
    var $j_0 = $_0;
    var $i_0 = 0;
    label = 9;
    break;
   case 9:
    var $i_0;
    var $j_0;
    var $35 = $i_0 + 1 | 0;
    var $36 = ($35 | 0) == ($_0 | 0);
    if ($36) {
      var $_lcssa = $35;
      label = 15;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $37 = $rects + ($i_0 << 4) | 0;
    var $_sum = $i_0 + 1 | 0;
    var $38 = $rects + ($_sum << 4) | 0;
    var $r_067 = $37;
    var $41 = $38;
    var $40 = $35;
    label = 11;
    break;
   case 11:
    var $40;
    var $41;
    var $r_067;
    var $42 = $r_067 + 20 | 0;
    var $43 = HEAP32[$42 >> 2];
    var $44 = ($43 | 0) < ($32 | 0);
    if ($44) {
      label = 14;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $46 = ($43 | 0) == ($32 | 0);
    if ($46) {
      label = 13;
      break;
    } else {
      var $_lcssa = $40;
      label = 15;
      break;
    }
   case 13:
    var $48 = $41 | 0;
    var $49 = HEAP32[$48 >> 2];
    var $50 = ($49 | 0) < ($33 | 0);
    if ($50) {
      label = 14;
      break;
    } else {
      var $_lcssa = $40;
      label = 15;
      break;
    }
   case 14:
    var $51 = $41 + 16 | 0;
    var $52 = $40 + 1 | 0;
    var $53 = ($52 | 0) == ($_0 | 0);
    if ($53) {
      var $_lcssa = $52;
      label = 15;
      break;
    } else {
      var $r_067 = $41;
      var $41 = $51;
      var $40 = $52;
      label = 11;
      break;
    }
   case 15:
    var $_lcssa;
    var $54 = $rects + ($j_0 << 4) | 0;
    var $r_1 = $54;
    var $j_1 = $j_0;
    label = 16;
    break;
   case 16:
    var $j_1;
    var $r_1;
    var $55 = $r_1 - 16 | 0;
    var $56 = $j_1 - 1 | 0;
    var $57 = $r_1 - 16 + 4 | 0;
    var $58 = HEAP32[$57 >> 2];
    var $59 = ($32 | 0) < ($58 | 0);
    if ($59) {
      var $r_1 = $55;
      var $j_1 = $56;
      label = 16;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $61 = ($32 | 0) == ($58 | 0);
    if ($61) {
      label = 18;
      break;
    } else {
      label = 19;
      break;
    }
   case 18:
    var $63 = $55 | 0;
    var $64 = HEAP32[$63 >> 2];
    var $65 = ($33 | 0) < ($64 | 0);
    if ($65) {
      var $r_1 = $55;
      var $j_1 = $56;
      label = 16;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $66 = ($_lcssa | 0) < ($56 | 0);
    if ($66) {
      label = 20;
      break;
    } else {
      label = 21;
      break;
    }
   case 20:
    var $68 = $rects + ($_lcssa << 4) | 0;
    var $69 = $68;
    HEAP32[$5 >> 2] = HEAP32[$69 >> 2];
    HEAP32[$5 + 4 >> 2] = HEAP32[$69 + 4 >> 2];
    HEAP32[$5 + 8 >> 2] = HEAP32[$69 + 8 >> 2];
    HEAP32[$5 + 12 >> 2] = HEAP32[$69 + 12 >> 2];
    var $70 = $rects + ($56 << 4) | 0;
    var $71 = $70;
    HEAP32[$69 >> 2] = HEAP32[$71 >> 2];
    HEAP32[$69 + 4 >> 2] = HEAP32[$71 + 4 >> 2];
    HEAP32[$69 + 8 >> 2] = HEAP32[$71 + 8 >> 2];
    HEAP32[$69 + 12 >> 2] = HEAP32[$71 + 12 >> 2];
    HEAP32[$71 >> 2] = HEAP32[$5 >> 2];
    HEAP32[$71 + 4 >> 2] = HEAP32[$5 + 4 >> 2];
    HEAP32[$71 + 8 >> 2] = HEAP32[$5 + 8 >> 2];
    HEAP32[$71 + 12 >> 2] = HEAP32[$5 + 12 >> 2];
    var $j_0 = $56;
    var $i_0 = $_lcssa;
    label = 9;
    break;
   case 21:
    HEAP32[$6 >> 2] = HEAP32[$2 >> 2];
    HEAP32[$6 + 4 >> 2] = HEAP32[$2 + 4 >> 2];
    HEAP32[$6 + 8 >> 2] = HEAP32[$2 + 8 >> 2];
    HEAP32[$6 + 12 >> 2] = HEAP32[$2 + 12 >> 2];
    var $72 = $rects + ($56 << 4) | 0;
    var $73 = $72;
    HEAP32[$2 >> 2] = HEAP32[$73 >> 2];
    HEAP32[$2 + 4 >> 2] = HEAP32[$73 + 4 >> 2];
    HEAP32[$2 + 8 >> 2] = HEAP32[$73 + 8 >> 2];
    HEAP32[$2 + 12 >> 2] = HEAP32[$73 + 12 >> 2];
    HEAP32[$73 >> 2] = HEAP32[$6 >> 2];
    HEAP32[$73 + 4 >> 2] = HEAP32[$6 + 4 >> 2];
    HEAP32[$73 + 8 >> 2] = HEAP32[$6 + 8 >> 2];
    HEAP32[$73 + 12 >> 2] = HEAP32[$6 + 12 >> 2];
    var $74 = $_0 - $56 | 0;
    var $75 = $74 - 1 | 0;
    var $76 = ($75 | 0) > 1;
    if ($76) {
      label = 22;
      break;
    } else {
      label = 23;
      break;
    }
   case 22:
    var $78 = $rects + ($j_1 << 4) | 0;
    _quick_sort_rects($78, $75);
    label = 23;
    break;
   case 23:
    var $80 = ($56 | 0) > 1;
    if ($80) {
      var $_0 = $56;
      label = 3;
      break;
    } else {
      label = 24;
      break;
    }
   case 24:
    STACKTOP = __stackBase__;
    return;
  }
}
_quick_sort_rects["X"] = 1;
function _pixman_coalesce($region, $prev_start, $cur_start) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $cur_start - $prev_start | 0;
    var $2 = $region + 16 | 0;
    var $3 = HEAP32[$2 >> 2];
    var $4 = $3 + 4 | 0;
    var $5 = HEAP32[$4 >> 2];
    var $6 = $5 - $cur_start | 0;
    var $7 = ($1 | 0) == ($6 | 0);
    if ($7) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    __pixman_log_error(5245224, 5243068);
    label = 4;
    break;
   case 4:
    var $10 = ($cur_start | 0) == ($prev_start | 0);
    if ($10) {
      var $_0 = $cur_start;
      label = 12;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $12 = HEAP32[$2 >> 2];
    var $13 = $12 + 8 | 0;
    var $14 = $13;
    var $15 = $14 + ($prev_start << 4) + 12 | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = $14 + ($cur_start << 4) + 4 | 0;
    var $18 = HEAP32[$17 >> 2];
    var $19 = ($16 | 0) == ($18 | 0);
    if ($19) {
      label = 6;
      break;
    } else {
      var $_0 = $cur_start;
      label = 12;
      break;
    }
   case 6:
    var $21 = $14 + ($cur_start << 4) | 0;
    var $22 = $14 + ($prev_start << 4) | 0;
    var $23 = $14 + ($cur_start << 4) + 12 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $numRects_0 = $1;
    var $cur_box_0 = $21;
    var $prev_box_0 = $22;
    label = 7;
    break;
   case 7:
    var $prev_box_0;
    var $cur_box_0;
    var $numRects_0;
    var $26 = $prev_box_0 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $28 = $cur_box_0 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $30 = ($27 | 0) == ($29 | 0);
    if ($30) {
      label = 8;
      break;
    } else {
      var $_0 = $cur_start;
      label = 12;
      break;
    }
   case 8:
    var $32 = $prev_box_0 + 8 | 0;
    var $33 = HEAP32[$32 >> 2];
    var $34 = $cur_box_0 + 8 | 0;
    var $35 = HEAP32[$34 >> 2];
    var $36 = ($33 | 0) == ($35 | 0);
    if ($36) {
      label = 9;
      break;
    } else {
      var $_0 = $cur_start;
      label = 12;
      break;
    }
   case 9:
    var $38 = $prev_box_0 + 16 | 0;
    var $39 = $cur_box_0 + 16 | 0;
    var $40 = $numRects_0 - 1 | 0;
    var $41 = ($40 | 0) == 0;
    if ($41) {
      label = 10;
      break;
    } else {
      var $numRects_0 = $40;
      var $cur_box_0 = $39;
      var $prev_box_0 = $38;
      label = 7;
      break;
    }
   case 10:
    var $43 = HEAP32[$2 >> 2];
    var $44 = $43 + 4 | 0;
    var $45 = HEAP32[$44 >> 2];
    var $46 = $45 - $1 | 0;
    HEAP32[$44 >> 2] = $46;
    var $numRects_1 = $1;
    var $prev_box_1 = $38;
    label = 11;
    break;
   case 11:
    var $prev_box_1;
    var $numRects_1;
    var $48 = $prev_box_1 - 16 | 0;
    var $49 = $prev_box_1 - 16 + 12 | 0;
    HEAP32[$49 >> 2] = $24;
    var $50 = $numRects_1 - 1 | 0;
    var $51 = ($50 | 0) == 0;
    if ($51) {
      var $_0 = $prev_start;
      label = 12;
      break;
    } else {
      var $numRects_1 = $50;
      var $prev_box_1 = $48;
      label = 11;
      break;
    }
   case 12:
    var $_0;
    return $_0;
  }
}
_pixman_coalesce["X"] = 1;
function _pixman_region_append_non_o($region, $r, $r_end, $y1, $y2) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $r_end;
    var $2 = $r;
    var $3 = $1 - $2 | 0;
    var $4 = $3 >> 4;
    var $5 = ($y1 | 0) < ($y2 | 0);
    if ($5) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    __pixman_log_error(5244688, 5243032);
    label = 4;
    break;
   case 4:
    var $8 = ($4 | 0) == 0;
    if ($8) {
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    __pixman_log_error(5244688, 5243344);
    label = 6;
    break;
   case 6:
    var $11 = $region + 16 | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = ($12 | 0) == 0;
    if ($13) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $15 = $12 + 4 | 0;
    var $16 = HEAP32[$15 >> 2];
    var $17 = $16 + $4 | 0;
    var $18 = $12 | 0;
    var $19 = HEAP32[$18 >> 2];
    var $20 = ($17 | 0) > ($19 | 0);
    if ($20) {
      label = 8;
      break;
    } else {
      label = 9;
      break;
    }
   case 8:
    var $22 = _pixman_rect_alloc($region, $4);
    var $23 = ($22 | 0) == 0;
    if ($23) {
      var $_0 = 0;
      label = 13;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $25 = HEAP32[$11 >> 2];
    var $26 = $25 + 4 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $28 = $25 + 8 | 0;
    var $29 = $28;
    var $30 = $29 + ($27 << 4) | 0;
    var $31 = $27 + $4 | 0;
    HEAP32[$26 >> 2] = $31;
    var $next_rect_0 = $30;
    var $_028 = $r;
    label = 10;
    break;
   case 10:
    var $_028;
    var $next_rect_0;
    var $33 = $_028 | 0;
    var $34 = HEAP32[$33 >> 2];
    var $35 = $_028 + 8 | 0;
    var $36 = HEAP32[$35 >> 2];
    var $37 = ($34 | 0) < ($36 | 0);
    if ($37) {
      label = 12;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    __pixman_log_error(5244688, 5243304);
    label = 12;
    break;
   case 12:
    var $40 = HEAP32[$33 >> 2];
    var $41 = $next_rect_0 | 0;
    HEAP32[$41 >> 2] = $40;
    var $42 = $next_rect_0 + 4 | 0;
    HEAP32[$42 >> 2] = $y1;
    var $43 = HEAP32[$35 >> 2];
    var $44 = $next_rect_0 + 8 | 0;
    HEAP32[$44 >> 2] = $43;
    var $45 = $next_rect_0 + 12 | 0;
    HEAP32[$45 >> 2] = $y2;
    var $46 = $next_rect_0 + 16 | 0;
    var $47 = $_028 + 16 | 0;
    var $48 = ($47 | 0) == ($r_end | 0);
    if ($48) {
      var $_0 = 1;
      label = 13;
      break;
    } else {
      var $next_rect_0 = $46;
      var $_028 = $47;
      label = 10;
      break;
    }
   case 13:
    var $_0;
    return $_0;
  }
}
_pixman_region_append_non_o["X"] = 1;
function _malloc($bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $bytes >>> 0 < 245;
    if ($1) {
      label = 3;
      break;
    } else {
      label = 28;
      break;
    }
   case 3:
    var $3 = $bytes >>> 0 < 11;
    if ($3) {
      var $8 = 16;
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $5 = $bytes + 11 | 0;
    var $6 = $5 & -8;
    var $8 = $6;
    label = 5;
    break;
   case 5:
    var $8;
    var $9 = $8 >>> 3;
    var $10 = HEAP32[5243808 >> 2];
    var $11 = $10 >>> ($9 >>> 0);
    var $12 = $11 & 3;
    var $13 = ($12 | 0) == 0;
    if ($13) {
      label = 12;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $15 = $11 & 1;
    var $16 = $15 ^ 1;
    var $17 = $16 + $9 | 0;
    var $18 = $17 << 1;
    var $19 = 5243848 + ($18 << 2) | 0;
    var $20 = $19;
    var $_sum106 = $18 + 2 | 0;
    var $21 = 5243848 + ($_sum106 << 2) | 0;
    var $22 = HEAP32[$21 >> 2];
    var $23 = $22 + 8 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = ($20 | 0) == ($24 | 0);
    if ($25) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    var $27 = 1 << $17;
    var $28 = $27 ^ -1;
    var $29 = $10 & $28;
    HEAP32[5243808 >> 2] = $29;
    label = 11;
    break;
   case 8:
    var $31 = $24;
    var $32 = HEAP32[5243824 >> 2];
    var $33 = $31 >>> 0 < $32 >>> 0;
    if ($33) {
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    HEAP32[$21 >> 2] = $24;
    var $35 = $24 + 12 | 0;
    HEAP32[$35 >> 2] = $20;
    label = 11;
    break;
   case 10:
    _abort();
   case 11:
    var $38 = $17 << 3;
    var $39 = $38 | 3;
    var $40 = $22 + 4 | 0;
    HEAP32[$40 >> 2] = $39;
    var $41 = $22;
    var $_sum107108 = $38 | 4;
    var $42 = $41 + $_sum107108 | 0;
    var $43 = $42;
    var $44 = HEAP32[$43 >> 2];
    var $45 = $44 | 1;
    HEAP32[$43 >> 2] = $45;
    var $46 = $23;
    var $mem_0 = $46;
    label = 39;
    break;
   case 12:
    var $48 = HEAP32[5243816 >> 2];
    var $49 = $8 >>> 0 > $48 >>> 0;
    if ($49) {
      label = 13;
      break;
    } else {
      var $nb_0 = $8;
      label = 31;
      break;
    }
   case 13:
    var $51 = ($11 | 0) == 0;
    if ($51) {
      label = 26;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $53 = $11 << $9;
    var $54 = 2 << $9;
    var $55 = -$54 | 0;
    var $56 = $54 | $55;
    var $57 = $53 & $56;
    var $58 = -$57 | 0;
    var $59 = $57 & $58;
    var $60 = $59 - 1 | 0;
    var $61 = $60 >>> 12;
    var $62 = $61 & 16;
    var $63 = $60 >>> ($62 >>> 0);
    var $64 = $63 >>> 5;
    var $65 = $64 & 8;
    var $66 = $65 | $62;
    var $67 = $63 >>> ($65 >>> 0);
    var $68 = $67 >>> 2;
    var $69 = $68 & 4;
    var $70 = $66 | $69;
    var $71 = $67 >>> ($69 >>> 0);
    var $72 = $71 >>> 1;
    var $73 = $72 & 2;
    var $74 = $70 | $73;
    var $75 = $71 >>> ($73 >>> 0);
    var $76 = $75 >>> 1;
    var $77 = $76 & 1;
    var $78 = $74 | $77;
    var $79 = $75 >>> ($77 >>> 0);
    var $80 = $78 + $79 | 0;
    var $81 = $80 << 1;
    var $82 = 5243848 + ($81 << 2) | 0;
    var $83 = $82;
    var $_sum100 = $81 + 2 | 0;
    var $84 = 5243848 + ($_sum100 << 2) | 0;
    var $85 = HEAP32[$84 >> 2];
    var $86 = $85 + 8 | 0;
    var $87 = HEAP32[$86 >> 2];
    var $88 = ($83 | 0) == ($87 | 0);
    if ($88) {
      label = 15;
      break;
    } else {
      label = 16;
      break;
    }
   case 15:
    var $90 = 1 << $80;
    var $91 = $90 ^ -1;
    var $92 = $10 & $91;
    HEAP32[5243808 >> 2] = $92;
    label = 19;
    break;
   case 16:
    var $94 = $87;
    var $95 = HEAP32[5243824 >> 2];
    var $96 = $94 >>> 0 < $95 >>> 0;
    if ($96) {
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    HEAP32[$84 >> 2] = $87;
    var $98 = $87 + 12 | 0;
    HEAP32[$98 >> 2] = $83;
    label = 19;
    break;
   case 18:
    _abort();
   case 19:
    var $101 = $80 << 3;
    var $102 = $101 - $8 | 0;
    var $103 = $8 | 3;
    var $104 = $85 + 4 | 0;
    HEAP32[$104 >> 2] = $103;
    var $105 = $85;
    var $106 = $105 + $8 | 0;
    var $107 = $106;
    var $108 = $102 | 1;
    var $_sum101102 = $8 | 4;
    var $109 = $105 + $_sum101102 | 0;
    var $110 = $109;
    HEAP32[$110 >> 2] = $108;
    var $111 = $105 + $101 | 0;
    var $112 = $111;
    HEAP32[$112 >> 2] = $102;
    var $113 = HEAP32[5243816 >> 2];
    var $114 = ($113 | 0) == 0;
    if ($114) {
      label = 25;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    var $116 = HEAP32[5243828 >> 2];
    var $117 = $113 >>> 3;
    var $118 = $117 << 1;
    var $119 = 5243848 + ($118 << 2) | 0;
    var $120 = $119;
    var $121 = HEAP32[5243808 >> 2];
    var $122 = 1 << $117;
    var $123 = $121 & $122;
    var $124 = ($123 | 0) == 0;
    if ($124) {
      label = 21;
      break;
    } else {
      label = 22;
      break;
    }
   case 21:
    var $126 = $121 | $122;
    HEAP32[5243808 >> 2] = $126;
    var $F4_0 = $120;
    label = 24;
    break;
   case 22:
    var $_sum105 = $118 + 2 | 0;
    var $128 = 5243848 + ($_sum105 << 2) | 0;
    var $129 = HEAP32[$128 >> 2];
    var $130 = $129;
    var $131 = HEAP32[5243824 >> 2];
    var $132 = $130 >>> 0 < $131 >>> 0;
    if ($132) {
      label = 23;
      break;
    } else {
      var $F4_0 = $129;
      label = 24;
      break;
    }
   case 23:
    _abort();
   case 24:
    var $F4_0;
    var $_sum104 = $118 + 2 | 0;
    var $135 = 5243848 + ($_sum104 << 2) | 0;
    HEAP32[$135 >> 2] = $116;
    var $136 = $F4_0 + 12 | 0;
    HEAP32[$136 >> 2] = $116;
    var $137 = $116 + 8 | 0;
    HEAP32[$137 >> 2] = $F4_0;
    var $138 = $116 + 12 | 0;
    HEAP32[$138 >> 2] = $120;
    label = 25;
    break;
   case 25:
    HEAP32[5243816 >> 2] = $102;
    HEAP32[5243828 >> 2] = $107;
    var $140 = $86;
    var $mem_0 = $140;
    label = 39;
    break;
   case 26:
    var $142 = HEAP32[5243812 >> 2];
    var $143 = ($142 | 0) == 0;
    if ($143) {
      var $nb_0 = $8;
      label = 31;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $145 = _tmalloc_small($8);
    var $146 = ($145 | 0) == 0;
    if ($146) {
      var $nb_0 = $8;
      label = 31;
      break;
    } else {
      var $mem_0 = $145;
      label = 39;
      break;
    }
   case 28:
    var $148 = $bytes >>> 0 > 4294967231;
    if ($148) {
      var $nb_0 = -1;
      label = 31;
      break;
    } else {
      label = 29;
      break;
    }
   case 29:
    var $150 = $bytes + 11 | 0;
    var $151 = $150 & -8;
    var $152 = HEAP32[5243812 >> 2];
    var $153 = ($152 | 0) == 0;
    if ($153) {
      var $nb_0 = $151;
      label = 31;
      break;
    } else {
      label = 30;
      break;
    }
   case 30:
    var $155 = _tmalloc_large($151);
    var $156 = ($155 | 0) == 0;
    if ($156) {
      var $nb_0 = $151;
      label = 31;
      break;
    } else {
      var $mem_0 = $155;
      label = 39;
      break;
    }
   case 31:
    var $nb_0;
    var $158 = HEAP32[5243816 >> 2];
    var $159 = $nb_0 >>> 0 > $158 >>> 0;
    if ($159) {
      label = 36;
      break;
    } else {
      label = 32;
      break;
    }
   case 32:
    var $161 = $158 - $nb_0 | 0;
    var $162 = HEAP32[5243828 >> 2];
    var $163 = $161 >>> 0 > 15;
    if ($163) {
      label = 33;
      break;
    } else {
      label = 34;
      break;
    }
   case 33:
    var $165 = $162;
    var $166 = $165 + $nb_0 | 0;
    var $167 = $166;
    HEAP32[5243828 >> 2] = $167;
    HEAP32[5243816 >> 2] = $161;
    var $168 = $161 | 1;
    var $_sum98 = $nb_0 + 4 | 0;
    var $169 = $165 + $_sum98 | 0;
    var $170 = $169;
    HEAP32[$170 >> 2] = $168;
    var $171 = $165 + $158 | 0;
    var $172 = $171;
    HEAP32[$172 >> 2] = $161;
    var $173 = $nb_0 | 3;
    var $174 = $162 + 4 | 0;
    HEAP32[$174 >> 2] = $173;
    label = 35;
    break;
   case 34:
    HEAP32[5243816 >> 2] = 0;
    HEAP32[5243828 >> 2] = 0;
    var $176 = $158 | 3;
    var $177 = $162 + 4 | 0;
    HEAP32[$177 >> 2] = $176;
    var $178 = $162;
    var $_sum97 = $158 + 4 | 0;
    var $179 = $178 + $_sum97 | 0;
    var $180 = $179;
    var $181 = HEAP32[$180 >> 2];
    var $182 = $181 | 1;
    HEAP32[$180 >> 2] = $182;
    label = 35;
    break;
   case 35:
    var $184 = $162 + 8 | 0;
    var $185 = $184;
    var $mem_0 = $185;
    label = 39;
    break;
   case 36:
    var $187 = HEAP32[5243820 >> 2];
    var $188 = $nb_0 >>> 0 < $187 >>> 0;
    if ($188) {
      label = 37;
      break;
    } else {
      label = 38;
      break;
    }
   case 37:
    var $190 = $187 - $nb_0 | 0;
    HEAP32[5243820 >> 2] = $190;
    var $191 = HEAP32[5243832 >> 2];
    var $192 = $191;
    var $193 = $192 + $nb_0 | 0;
    var $194 = $193;
    HEAP32[5243832 >> 2] = $194;
    var $195 = $190 | 1;
    var $_sum = $nb_0 + 4 | 0;
    var $196 = $192 + $_sum | 0;
    var $197 = $196;
    HEAP32[$197 >> 2] = $195;
    var $198 = $nb_0 | 3;
    var $199 = $191 + 4 | 0;
    HEAP32[$199 >> 2] = $198;
    var $200 = $191 + 8 | 0;
    var $201 = $200;
    var $mem_0 = $201;
    label = 39;
    break;
   case 38:
    var $203 = _sys_alloc($nb_0);
    var $mem_0 = $203;
    label = 39;
    break;
   case 39:
    var $mem_0;
    return $mem_0;
  }
}
_malloc["X"] = 1;
function _tmalloc_small($nb) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5243812 >> 2];
    var $2 = -$1 | 0;
    var $3 = $1 & $2;
    var $4 = $3 - 1 | 0;
    var $5 = $4 >>> 12;
    var $6 = $5 & 16;
    var $7 = $4 >>> ($6 >>> 0);
    var $8 = $7 >>> 5;
    var $9 = $8 & 8;
    var $10 = $9 | $6;
    var $11 = $7 >>> ($9 >>> 0);
    var $12 = $11 >>> 2;
    var $13 = $12 & 4;
    var $14 = $10 | $13;
    var $15 = $11 >>> ($13 >>> 0);
    var $16 = $15 >>> 1;
    var $17 = $16 & 2;
    var $18 = $14 | $17;
    var $19 = $15 >>> ($17 >>> 0);
    var $20 = $19 >>> 1;
    var $21 = $20 & 1;
    var $22 = $18 | $21;
    var $23 = $19 >>> ($21 >>> 0);
    var $24 = $22 + $23 | 0;
    var $25 = 5244112 + ($24 << 2) | 0;
    var $26 = HEAP32[$25 >> 2];
    var $27 = $26 + 4 | 0;
    var $28 = HEAP32[$27 >> 2];
    var $29 = $28 & -8;
    var $30 = $29 - $nb | 0;
    var $t_0 = $26;
    var $v_0 = $26;
    var $rsize_0 = $30;
    label = 3;
    break;
   case 3:
    var $rsize_0;
    var $v_0;
    var $t_0;
    var $32 = $t_0 + 16 | 0;
    var $33 = HEAP32[$32 >> 2];
    var $34 = ($33 | 0) == 0;
    if ($34) {
      label = 4;
      break;
    } else {
      var $39 = $33;
      label = 5;
      break;
    }
   case 4:
    var $36 = $t_0 + 20 | 0;
    var $37 = HEAP32[$36 >> 2];
    var $38 = ($37 | 0) == 0;
    if ($38) {
      label = 6;
      break;
    } else {
      var $39 = $37;
      label = 5;
      break;
    }
   case 5:
    var $39;
    var $40 = $39 + 4 | 0;
    var $41 = HEAP32[$40 >> 2];
    var $42 = $41 & -8;
    var $43 = $42 - $nb | 0;
    var $44 = $43 >>> 0 < $rsize_0 >>> 0;
    var $_rsize_0 = $44 ? $43 : $rsize_0;
    var $_v_0 = $44 ? $39 : $v_0;
    var $t_0 = $39;
    var $v_0 = $_v_0;
    var $rsize_0 = $_rsize_0;
    label = 3;
    break;
   case 6:
    var $46 = $v_0;
    var $47 = HEAP32[5243824 >> 2];
    var $48 = $46 >>> 0 < $47 >>> 0;
    if ($48) {
      label = 50;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $50 = $46 + $nb | 0;
    var $51 = $50;
    var $52 = $46 >>> 0 < $50 >>> 0;
    if ($52) {
      label = 8;
      break;
    } else {
      label = 50;
      break;
    }
   case 8:
    var $54 = $v_0 + 24 | 0;
    var $55 = HEAP32[$54 >> 2];
    var $56 = $v_0 + 12 | 0;
    var $57 = HEAP32[$56 >> 2];
    var $58 = ($57 | 0) == ($v_0 | 0);
    if ($58) {
      label = 12;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $60 = $v_0 + 8 | 0;
    var $61 = HEAP32[$60 >> 2];
    var $62 = $61;
    var $63 = $62 >>> 0 < $47 >>> 0;
    if ($63) {
      label = 11;
      break;
    } else {
      label = 10;
      break;
    }
   case 10:
    var $65 = $61 + 12 | 0;
    HEAP32[$65 >> 2] = $57;
    var $66 = $57 + 8 | 0;
    HEAP32[$66 >> 2] = $61;
    var $R_1 = $57;
    label = 20;
    break;
   case 11:
    _abort();
   case 12:
    var $69 = $v_0 + 20 | 0;
    var $70 = HEAP32[$69 >> 2];
    var $71 = ($70 | 0) == 0;
    if ($71) {
      label = 13;
      break;
    } else {
      var $R_0 = $70;
      var $RP_0 = $69;
      label = 14;
      break;
    }
   case 13:
    var $73 = $v_0 + 16 | 0;
    var $74 = HEAP32[$73 >> 2];
    var $75 = ($74 | 0) == 0;
    if ($75) {
      var $R_1 = 0;
      label = 20;
      break;
    } else {
      var $R_0 = $74;
      var $RP_0 = $73;
      label = 14;
      break;
    }
   case 14:
    var $RP_0;
    var $R_0;
    var $76 = $R_0 + 20 | 0;
    var $77 = HEAP32[$76 >> 2];
    var $78 = ($77 | 0) == 0;
    if ($78) {
      label = 15;
      break;
    } else {
      var $CP_0 = $76;
      label = 16;
      break;
    }
   case 15:
    var $80 = $R_0 + 16 | 0;
    var $81 = HEAP32[$80 >> 2];
    var $82 = ($81 | 0) == 0;
    if ($82) {
      label = 17;
      break;
    } else {
      var $CP_0 = $80;
      label = 16;
      break;
    }
   case 16:
    var $CP_0;
    var $83 = HEAP32[$CP_0 >> 2];
    var $R_0 = $83;
    var $RP_0 = $CP_0;
    label = 14;
    break;
   case 17:
    var $85 = $RP_0;
    var $86 = HEAP32[5243824 >> 2];
    var $87 = $85 >>> 0 < $86 >>> 0;
    if ($87) {
      label = 19;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    HEAP32[$RP_0 >> 2] = 0;
    var $R_1 = $R_0;
    label = 20;
    break;
   case 19:
    _abort();
   case 20:
    var $R_1;
    var $91 = ($55 | 0) == 0;
    if ($91) {
      label = 40;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $93 = $v_0 + 28 | 0;
    var $94 = HEAP32[$93 >> 2];
    var $95 = 5244112 + ($94 << 2) | 0;
    var $96 = HEAP32[$95 >> 2];
    var $97 = ($v_0 | 0) == ($96 | 0);
    if ($97) {
      label = 22;
      break;
    } else {
      label = 24;
      break;
    }
   case 22:
    HEAP32[$95 >> 2] = $R_1;
    var $cond = ($R_1 | 0) == 0;
    if ($cond) {
      label = 23;
      break;
    } else {
      label = 30;
      break;
    }
   case 23:
    var $99 = HEAP32[$93 >> 2];
    var $100 = 1 << $99;
    var $101 = $100 ^ -1;
    var $102 = HEAP32[5243812 >> 2];
    var $103 = $102 & $101;
    HEAP32[5243812 >> 2] = $103;
    label = 40;
    break;
   case 24:
    var $105 = $55;
    var $106 = HEAP32[5243824 >> 2];
    var $107 = $105 >>> 0 < $106 >>> 0;
    if ($107) {
      label = 28;
      break;
    } else {
      label = 25;
      break;
    }
   case 25:
    var $109 = $55 + 16 | 0;
    var $110 = HEAP32[$109 >> 2];
    var $111 = ($110 | 0) == ($v_0 | 0);
    if ($111) {
      label = 26;
      break;
    } else {
      label = 27;
      break;
    }
   case 26:
    HEAP32[$109 >> 2] = $R_1;
    label = 29;
    break;
   case 27:
    var $114 = $55 + 20 | 0;
    HEAP32[$114 >> 2] = $R_1;
    label = 29;
    break;
   case 28:
    _abort();
   case 29:
    var $117 = ($R_1 | 0) == 0;
    if ($117) {
      label = 40;
      break;
    } else {
      label = 30;
      break;
    }
   case 30:
    var $119 = $R_1;
    var $120 = HEAP32[5243824 >> 2];
    var $121 = $119 >>> 0 < $120 >>> 0;
    if ($121) {
      label = 39;
      break;
    } else {
      label = 31;
      break;
    }
   case 31:
    var $123 = $R_1 + 24 | 0;
    HEAP32[$123 >> 2] = $55;
    var $124 = $v_0 + 16 | 0;
    var $125 = HEAP32[$124 >> 2];
    var $126 = ($125 | 0) == 0;
    if ($126) {
      label = 35;
      break;
    } else {
      label = 32;
      break;
    }
   case 32:
    var $128 = $125;
    var $129 = HEAP32[5243824 >> 2];
    var $130 = $128 >>> 0 < $129 >>> 0;
    if ($130) {
      label = 34;
      break;
    } else {
      label = 33;
      break;
    }
   case 33:
    var $132 = $R_1 + 16 | 0;
    HEAP32[$132 >> 2] = $125;
    var $133 = $125 + 24 | 0;
    HEAP32[$133 >> 2] = $R_1;
    label = 35;
    break;
   case 34:
    _abort();
   case 35:
    var $136 = $v_0 + 20 | 0;
    var $137 = HEAP32[$136 >> 2];
    var $138 = ($137 | 0) == 0;
    if ($138) {
      label = 40;
      break;
    } else {
      label = 36;
      break;
    }
   case 36:
    var $140 = $137;
    var $141 = HEAP32[5243824 >> 2];
    var $142 = $140 >>> 0 < $141 >>> 0;
    if ($142) {
      label = 38;
      break;
    } else {
      label = 37;
      break;
    }
   case 37:
    var $144 = $R_1 + 20 | 0;
    HEAP32[$144 >> 2] = $137;
    var $145 = $137 + 24 | 0;
    HEAP32[$145 >> 2] = $R_1;
    label = 40;
    break;
   case 38:
    _abort();
   case 39:
    _abort();
   case 40:
    var $149 = $rsize_0 >>> 0 < 16;
    if ($149) {
      label = 41;
      break;
    } else {
      label = 42;
      break;
    }
   case 41:
    var $151 = $rsize_0 + $nb | 0;
    var $152 = $151 | 3;
    var $153 = $v_0 + 4 | 0;
    HEAP32[$153 >> 2] = $152;
    var $_sum4 = $151 + 4 | 0;
    var $154 = $46 + $_sum4 | 0;
    var $155 = $154;
    var $156 = HEAP32[$155 >> 2];
    var $157 = $156 | 1;
    HEAP32[$155 >> 2] = $157;
    label = 49;
    break;
   case 42:
    var $159 = $nb | 3;
    var $160 = $v_0 + 4 | 0;
    HEAP32[$160 >> 2] = $159;
    var $161 = $rsize_0 | 1;
    var $_sum = $nb + 4 | 0;
    var $162 = $46 + $_sum | 0;
    var $163 = $162;
    HEAP32[$163 >> 2] = $161;
    var $_sum1 = $rsize_0 + $nb | 0;
    var $164 = $46 + $_sum1 | 0;
    var $165 = $164;
    HEAP32[$165 >> 2] = $rsize_0;
    var $166 = HEAP32[5243816 >> 2];
    var $167 = ($166 | 0) == 0;
    if ($167) {
      label = 48;
      break;
    } else {
      label = 43;
      break;
    }
   case 43:
    var $169 = HEAP32[5243828 >> 2];
    var $170 = $166 >>> 3;
    var $171 = $170 << 1;
    var $172 = 5243848 + ($171 << 2) | 0;
    var $173 = $172;
    var $174 = HEAP32[5243808 >> 2];
    var $175 = 1 << $170;
    var $176 = $174 & $175;
    var $177 = ($176 | 0) == 0;
    if ($177) {
      label = 44;
      break;
    } else {
      label = 45;
      break;
    }
   case 44:
    var $179 = $174 | $175;
    HEAP32[5243808 >> 2] = $179;
    var $F1_0 = $173;
    label = 47;
    break;
   case 45:
    var $_sum3 = $171 + 2 | 0;
    var $181 = 5243848 + ($_sum3 << 2) | 0;
    var $182 = HEAP32[$181 >> 2];
    var $183 = $182;
    var $184 = HEAP32[5243824 >> 2];
    var $185 = $183 >>> 0 < $184 >>> 0;
    if ($185) {
      label = 46;
      break;
    } else {
      var $F1_0 = $182;
      label = 47;
      break;
    }
   case 46:
    _abort();
   case 47:
    var $F1_0;
    var $_sum2 = $171 + 2 | 0;
    var $188 = 5243848 + ($_sum2 << 2) | 0;
    HEAP32[$188 >> 2] = $169;
    var $189 = $F1_0 + 12 | 0;
    HEAP32[$189 >> 2] = $169;
    var $190 = $169 + 8 | 0;
    HEAP32[$190 >> 2] = $F1_0;
    var $191 = $169 + 12 | 0;
    HEAP32[$191 >> 2] = $173;
    label = 48;
    break;
   case 48:
    HEAP32[5243816 >> 2] = $rsize_0;
    HEAP32[5243828 >> 2] = $51;
    label = 49;
    break;
   case 49:
    var $194 = $v_0 + 8 | 0;
    var $195 = $194;
    return $195;
   case 50:
    _abort();
  }
}
_tmalloc_small["X"] = 1;
function _sys_alloc($nb) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = HEAP32[5244248 >> 2];
    var $6 = $5 & 4;
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      var $tsize_125 = 0;
      label = 24;
      break;
    }
   case 5:
    var $9 = HEAP32[5243832 >> 2];
    var $10 = ($9 | 0) == 0;
    if ($10) {
      label = 7;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $12 = $9;
    var $13 = _segment_holding($12);
    var $14 = ($13 | 0) == 0;
    if ($14) {
      label = 7;
      break;
    } else {
      label = 12;
      break;
    }
   case 7:
    var $15 = _sbrk(0);
    var $16 = ($15 | 0) == -1;
    if ($16) {
      var $tsize_0121720_ph = 0;
      label = 22;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $18 = HEAP32[5242920 >> 2];
    var $19 = $nb + 47 | 0;
    var $20 = $19 + $18 | 0;
    var $21 = -$18 | 0;
    var $22 = $20 & $21;
    var $23 = $15;
    var $24 = HEAP32[5242916 >> 2];
    var $25 = $24 - 1 | 0;
    var $26 = $25 & $23;
    var $27 = ($26 | 0) == 0;
    if ($27) {
      var $asize_0 = $22;
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $29 = $25 + $23 | 0;
    var $30 = -$24 | 0;
    var $31 = $29 & $30;
    var $32 = $22 - $23 | 0;
    var $33 = $32 + $31 | 0;
    var $asize_0 = $33;
    label = 10;
    break;
   case 10:
    var $asize_0;
    var $35 = $asize_0 >>> 0 < 2147483647;
    if ($35) {
      label = 11;
      break;
    } else {
      var $tsize_0121720_ph = 0;
      label = 22;
      break;
    }
   case 11:
    var $37 = _sbrk($asize_0);
    var $38 = ($37 | 0) == ($15 | 0);
    var $asize_0_ = $38 ? $asize_0 : 0;
    var $_ = $38 ? $15 : -1;
    var $tbase_0 = $_;
    var $tsize_0 = $asize_0_;
    var $br_0 = $37;
    var $asize_1 = $asize_0;
    label = 14;
    break;
   case 12:
    var $40 = HEAP32[5243820 >> 2];
    var $41 = HEAP32[5242920 >> 2];
    var $42 = $nb + 47 | 0;
    var $43 = $42 - $40 | 0;
    var $44 = $43 + $41 | 0;
    var $45 = -$41 | 0;
    var $46 = $44 & $45;
    var $47 = $46 >>> 0 < 2147483647;
    if ($47) {
      label = 13;
      break;
    } else {
      var $tsize_0121720_ph = 0;
      label = 22;
      break;
    }
   case 13:
    var $49 = _sbrk($46);
    var $50 = $13 | 0;
    var $51 = HEAP32[$50 >> 2];
    var $52 = $13 + 4 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = $51 + $53 | 0;
    var $55 = ($49 | 0) == ($54 | 0);
    var $_1 = $55 ? $46 : 0;
    var $_2 = $55 ? $49 : -1;
    var $tbase_0 = $_2;
    var $tsize_0 = $_1;
    var $br_0 = $49;
    var $asize_1 = $46;
    label = 14;
    break;
   case 14:
    var $asize_1;
    var $br_0;
    var $tsize_0;
    var $tbase_0;
    var $57 = -$asize_1 | 0;
    var $58 = ($tbase_0 | 0) == -1;
    if ($58) {
      label = 15;
      break;
    } else {
      var $tsize_229 = $tsize_0;
      var $tbase_230 = $tbase_0;
      label = 27;
      break;
    }
   case 15:
    var $60 = ($br_0 | 0) != -1;
    var $61 = $asize_1 >>> 0 < 2147483647;
    var $or_cond = $60 & $61;
    if ($or_cond) {
      label = 16;
      break;
    } else {
      var $asize_2 = $asize_1;
      label = 21;
      break;
    }
   case 16:
    var $63 = $nb + 48 | 0;
    var $64 = $asize_1 >>> 0 < $63 >>> 0;
    if ($64) {
      label = 17;
      break;
    } else {
      var $asize_2 = $asize_1;
      label = 21;
      break;
    }
   case 17:
    var $66 = HEAP32[5242920 >> 2];
    var $67 = $nb + 47 | 0;
    var $68 = $67 - $asize_1 | 0;
    var $69 = $68 + $66 | 0;
    var $70 = -$66 | 0;
    var $71 = $69 & $70;
    var $72 = $71 >>> 0 < 2147483647;
    if ($72) {
      label = 18;
      break;
    } else {
      var $asize_2 = $asize_1;
      label = 21;
      break;
    }
   case 18:
    var $74 = _sbrk($71);
    var $75 = ($74 | 0) == -1;
    if ($75) {
      label = 20;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $77 = $71 + $asize_1 | 0;
    var $asize_2 = $77;
    label = 21;
    break;
   case 20:
    var $79 = _sbrk($57);
    var $tsize_0121720_ph = $tsize_0;
    label = 22;
    break;
   case 21:
    var $asize_2;
    var $81 = ($br_0 | 0) == -1;
    if ($81) {
      label = 23;
      break;
    } else {
      var $tsize_229 = $asize_2;
      var $tbase_230 = $br_0;
      label = 27;
      break;
    }
   case 22:
    var $tsize_0121720_ph;
    var $82 = HEAP32[5244248 >> 2];
    var $83 = $82 | 4;
    HEAP32[5244248 >> 2] = $83;
    var $tsize_125 = $tsize_0121720_ph;
    label = 24;
    break;
   case 23:
    var $84 = HEAP32[5244248 >> 2];
    var $85 = $84 | 4;
    HEAP32[5244248 >> 2] = $85;
    var $tsize_125 = $tsize_0;
    label = 24;
    break;
   case 24:
    var $tsize_125;
    var $86 = HEAP32[5242920 >> 2];
    var $87 = $nb + 47 | 0;
    var $88 = $87 + $86 | 0;
    var $89 = -$86 | 0;
    var $90 = $88 & $89;
    var $91 = $90 >>> 0 < 2147483647;
    if ($91) {
      label = 25;
      break;
    } else {
      label = 48;
      break;
    }
   case 25:
    var $93 = _sbrk($90);
    var $94 = _sbrk(0);
    var $notlhs = ($93 | 0) != -1;
    var $notrhs = ($94 | 0) != -1;
    var $or_cond3_not = $notrhs & $notlhs;
    var $95 = $93 >>> 0 < $94 >>> 0;
    var $or_cond4 = $or_cond3_not & $95;
    if ($or_cond4) {
      label = 26;
      break;
    } else {
      label = 48;
      break;
    }
   case 26:
    var $96 = $94;
    var $97 = $93;
    var $98 = $96 - $97 | 0;
    var $99 = $nb + 40 | 0;
    var $100 = $98 >>> 0 > $99 >>> 0;
    var $_tsize_1 = $100 ? $98 : $tsize_125;
    var $_tbase_1 = $100 ? $93 : -1;
    var $101 = ($_tbase_1 | 0) == -1;
    if ($101) {
      label = 48;
      break;
    } else {
      var $tsize_229 = $_tsize_1;
      var $tbase_230 = $_tbase_1;
      label = 27;
      break;
    }
   case 27:
    var $tbase_230;
    var $tsize_229;
    var $102 = HEAP32[5244240 >> 2];
    var $103 = $102 + $tsize_229 | 0;
    HEAP32[5244240 >> 2] = $103;
    var $104 = HEAP32[5244244 >> 2];
    var $105 = $103 >>> 0 > $104 >>> 0;
    if ($105) {
      label = 28;
      break;
    } else {
      label = 29;
      break;
    }
   case 28:
    HEAP32[5244244 >> 2] = $103;
    label = 29;
    break;
   case 29:
    var $108 = HEAP32[5243832 >> 2];
    var $109 = ($108 | 0) == 0;
    if ($109) {
      label = 30;
      break;
    } else {
      var $sp_042 = 5244252;
      label = 33;
      break;
    }
   case 30:
    var $111 = HEAP32[5243824 >> 2];
    var $112 = ($111 | 0) == 0;
    var $113 = $tbase_230 >>> 0 < $111 >>> 0;
    var $or_cond5 = $112 | $113;
    if ($or_cond5) {
      label = 31;
      break;
    } else {
      label = 32;
      break;
    }
   case 31:
    HEAP32[5243824 >> 2] = $tbase_230;
    label = 32;
    break;
   case 32:
    HEAP32[5244252 >> 2] = $tbase_230;
    HEAP32[5244256 >> 2] = $tsize_229;
    HEAP32[5244264 >> 2] = 0;
    var $116 = HEAP32[5242912 >> 2];
    HEAP32[5243844 >> 2] = $116;
    HEAP32[5243840 >> 2] = -1;
    _init_bins();
    var $117 = $tbase_230;
    var $118 = $tsize_229 - 40 | 0;
    _init_top($117, $118);
    label = 46;
    break;
   case 33:
    var $sp_042;
    var $119 = $sp_042 | 0;
    var $120 = HEAP32[$119 >> 2];
    var $121 = $sp_042 + 4 | 0;
    var $122 = HEAP32[$121 >> 2];
    var $123 = $120 + $122 | 0;
    var $124 = ($tbase_230 | 0) == ($123 | 0);
    if ($124) {
      label = 35;
      break;
    } else {
      label = 34;
      break;
    }
   case 34:
    var $126 = $sp_042 + 8 | 0;
    var $127 = HEAP32[$126 >> 2];
    var $128 = ($127 | 0) == 0;
    if ($128) {
      label = 38;
      break;
    } else {
      var $sp_042 = $127;
      label = 33;
      break;
    }
   case 35:
    var $129 = $sp_042 + 12 | 0;
    var $130 = HEAP32[$129 >> 2];
    var $131 = $130 & 8;
    var $132 = ($131 | 0) == 0;
    if ($132) {
      label = 36;
      break;
    } else {
      label = 38;
      break;
    }
   case 36:
    var $134 = HEAP32[5243832 >> 2];
    var $135 = $134;
    var $136 = $135 >>> 0 >= $120 >>> 0;
    var $137 = $135 >>> 0 < $123 >>> 0;
    var $or_cond31 = $136 & $137;
    if ($or_cond31) {
      label = 37;
      break;
    } else {
      label = 38;
      break;
    }
   case 37:
    var $139 = $122 + $tsize_229 | 0;
    HEAP32[$121 >> 2] = $139;
    var $140 = HEAP32[5243832 >> 2];
    var $141 = HEAP32[5243820 >> 2];
    var $142 = $141 + $tsize_229 | 0;
    _init_top($140, $142);
    label = 46;
    break;
   case 38:
    var $143 = HEAP32[5243824 >> 2];
    var $144 = $tbase_230 >>> 0 < $143 >>> 0;
    if ($144) {
      label = 39;
      break;
    } else {
      label = 40;
      break;
    }
   case 39:
    HEAP32[5243824 >> 2] = $tbase_230;
    label = 40;
    break;
   case 40:
    var $146 = $tbase_230 + $tsize_229 | 0;
    var $sp_135 = 5244252;
    label = 41;
    break;
   case 41:
    var $sp_135;
    var $148 = $sp_135 | 0;
    var $149 = HEAP32[$148 >> 2];
    var $150 = ($149 | 0) == ($146 | 0);
    if ($150) {
      label = 43;
      break;
    } else {
      label = 42;
      break;
    }
   case 42:
    var $152 = $sp_135 + 8 | 0;
    var $153 = HEAP32[$152 >> 2];
    var $154 = ($153 | 0) == 0;
    if ($154) {
      label = 45;
      break;
    } else {
      var $sp_135 = $153;
      label = 41;
      break;
    }
   case 43:
    var $155 = $sp_135 + 12 | 0;
    var $156 = HEAP32[$155 >> 2];
    var $157 = $156 & 8;
    var $158 = ($157 | 0) == 0;
    if ($158) {
      label = 44;
      break;
    } else {
      label = 45;
      break;
    }
   case 44:
    HEAP32[$148 >> 2] = $tbase_230;
    var $160 = $sp_135 + 4 | 0;
    var $161 = HEAP32[$160 >> 2];
    var $162 = $161 + $tsize_229 | 0;
    HEAP32[$160 >> 2] = $162;
    var $163 = _prepend_alloc($tbase_230, $149, $nb);
    var $_0 = $163;
    label = 49;
    break;
   case 45:
    _add_segment($tbase_230, $tsize_229);
    label = 46;
    break;
   case 46:
    var $165 = HEAP32[5243820 >> 2];
    var $166 = $165 >>> 0 > $nb >>> 0;
    if ($166) {
      label = 47;
      break;
    } else {
      label = 48;
      break;
    }
   case 47:
    var $168 = $165 - $nb | 0;
    HEAP32[5243820 >> 2] = $168;
    var $169 = HEAP32[5243832 >> 2];
    var $170 = $169;
    var $171 = $170 + $nb | 0;
    var $172 = $171;
    HEAP32[5243832 >> 2] = $172;
    var $173 = $168 | 1;
    var $_sum = $nb + 4 | 0;
    var $174 = $170 + $_sum | 0;
    var $175 = $174;
    HEAP32[$175 >> 2] = $173;
    var $176 = $nb | 3;
    var $177 = $169 + 4 | 0;
    HEAP32[$177 >> 2] = $176;
    var $178 = $169 + 8 | 0;
    var $179 = $178;
    var $_0 = $179;
    label = 49;
    break;
   case 48:
    var $180 = ___errno_location();
    HEAP32[$180 >> 2] = 12;
    var $_0 = 0;
    label = 49;
    break;
   case 49:
    var $_0;
    return $_0;
  }
}
_sys_alloc["X"] = 1;
function _tmalloc_large($nb) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = -$nb | 0;
    var $2 = $nb >>> 8;
    var $3 = ($2 | 0) == 0;
    if ($3) {
      var $idx_0 = 0;
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $5 = $nb >>> 0 > 16777215;
    if ($5) {
      var $idx_0 = 31;
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $7 = $2 + 1048320 | 0;
    var $8 = $7 >>> 16;
    var $9 = $8 & 8;
    var $10 = $2 << $9;
    var $11 = $10 + 520192 | 0;
    var $12 = $11 >>> 16;
    var $13 = $12 & 4;
    var $14 = $13 | $9;
    var $15 = $10 << $13;
    var $16 = $15 + 245760 | 0;
    var $17 = $16 >>> 16;
    var $18 = $17 & 2;
    var $19 = $14 | $18;
    var $20 = 14 - $19 | 0;
    var $21 = $15 << $18;
    var $22 = $21 >>> 15;
    var $23 = $20 + $22 | 0;
    var $24 = $23 << 1;
    var $25 = $23 + 7 | 0;
    var $26 = $nb >>> ($25 >>> 0);
    var $27 = $26 & 1;
    var $28 = $27 | $24;
    var $idx_0 = $28;
    label = 5;
    break;
   case 5:
    var $idx_0;
    var $30 = 5244112 + ($idx_0 << 2) | 0;
    var $31 = HEAP32[$30 >> 2];
    var $32 = ($31 | 0) == 0;
    if ($32) {
      var $v_2 = 0;
      var $rsize_2 = $1;
      var $t_1 = 0;
      label = 12;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $34 = ($idx_0 | 0) == 31;
    if ($34) {
      var $39 = 0;
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $36 = $idx_0 >>> 1;
    var $37 = 25 - $36 | 0;
    var $39 = $37;
    label = 8;
    break;
   case 8:
    var $39;
    var $40 = $nb << $39;
    var $v_0 = 0;
    var $rsize_0 = $1;
    var $t_0 = $31;
    var $sizebits_0 = $40;
    var $rst_0 = 0;
    label = 9;
    break;
   case 9:
    var $rst_0;
    var $sizebits_0;
    var $t_0;
    var $rsize_0;
    var $v_0;
    var $42 = $t_0 + 4 | 0;
    var $43 = HEAP32[$42 >> 2];
    var $44 = $43 & -8;
    var $45 = $44 - $nb | 0;
    var $46 = $45 >>> 0 < $rsize_0 >>> 0;
    if ($46) {
      label = 10;
      break;
    } else {
      var $v_1 = $v_0;
      var $rsize_1 = $rsize_0;
      label = 11;
      break;
    }
   case 10:
    var $48 = ($44 | 0) == ($nb | 0);
    if ($48) {
      var $v_2 = $t_0;
      var $rsize_2 = $45;
      var $t_1 = $t_0;
      label = 12;
      break;
    } else {
      var $v_1 = $t_0;
      var $rsize_1 = $45;
      label = 11;
      break;
    }
   case 11:
    var $rsize_1;
    var $v_1;
    var $50 = $t_0 + 20 | 0;
    var $51 = HEAP32[$50 >> 2];
    var $52 = $sizebits_0 >>> 31;
    var $53 = $t_0 + 16 + ($52 << 2) | 0;
    var $54 = HEAP32[$53 >> 2];
    var $55 = ($51 | 0) == 0;
    var $56 = ($51 | 0) == ($54 | 0);
    var $or_cond = $55 | $56;
    var $rst_1 = $or_cond ? $rst_0 : $51;
    var $57 = ($54 | 0) == 0;
    var $58 = $sizebits_0 << 1;
    if ($57) {
      var $v_2 = $v_1;
      var $rsize_2 = $rsize_1;
      var $t_1 = $rst_1;
      label = 12;
      break;
    } else {
      var $v_0 = $v_1;
      var $rsize_0 = $rsize_1;
      var $t_0 = $54;
      var $sizebits_0 = $58;
      var $rst_0 = $rst_1;
      label = 9;
      break;
    }
   case 12:
    var $t_1;
    var $rsize_2;
    var $v_2;
    var $59 = ($t_1 | 0) == 0;
    var $60 = ($v_2 | 0) == 0;
    var $or_cond19 = $59 & $60;
    if ($or_cond19) {
      label = 13;
      break;
    } else {
      var $t_2_ph = $t_1;
      label = 15;
      break;
    }
   case 13:
    var $62 = 2 << $idx_0;
    var $63 = -$62 | 0;
    var $64 = $62 | $63;
    var $65 = HEAP32[5243812 >> 2];
    var $66 = $65 & $64;
    var $67 = ($66 | 0) == 0;
    if ($67) {
      var $t_2_ph = $t_1;
      label = 15;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $69 = -$66 | 0;
    var $70 = $66 & $69;
    var $71 = $70 - 1 | 0;
    var $72 = $71 >>> 12;
    var $73 = $72 & 16;
    var $74 = $71 >>> ($73 >>> 0);
    var $75 = $74 >>> 5;
    var $76 = $75 & 8;
    var $77 = $76 | $73;
    var $78 = $74 >>> ($76 >>> 0);
    var $79 = $78 >>> 2;
    var $80 = $79 & 4;
    var $81 = $77 | $80;
    var $82 = $78 >>> ($80 >>> 0);
    var $83 = $82 >>> 1;
    var $84 = $83 & 2;
    var $85 = $81 | $84;
    var $86 = $82 >>> ($84 >>> 0);
    var $87 = $86 >>> 1;
    var $88 = $87 & 1;
    var $89 = $85 | $88;
    var $90 = $86 >>> ($88 >>> 0);
    var $91 = $89 + $90 | 0;
    var $92 = 5244112 + ($91 << 2) | 0;
    var $93 = HEAP32[$92 >> 2];
    var $t_2_ph = $93;
    label = 15;
    break;
   case 15:
    var $t_2_ph;
    var $94 = ($t_2_ph | 0) == 0;
    if ($94) {
      var $rsize_3_lcssa = $rsize_2;
      var $v_3_lcssa = $v_2;
      label = 18;
      break;
    } else {
      var $t_224 = $t_2_ph;
      var $rsize_325 = $rsize_2;
      var $v_326 = $v_2;
      label = 16;
      break;
    }
   case 16:
    var $v_326;
    var $rsize_325;
    var $t_224;
    var $95 = $t_224 + 4 | 0;
    var $96 = HEAP32[$95 >> 2];
    var $97 = $96 & -8;
    var $98 = $97 - $nb | 0;
    var $99 = $98 >>> 0 < $rsize_325 >>> 0;
    var $_rsize_3 = $99 ? $98 : $rsize_325;
    var $t_2_v_3 = $99 ? $t_224 : $v_326;
    var $100 = $t_224 + 16 | 0;
    var $101 = HEAP32[$100 >> 2];
    var $102 = ($101 | 0) == 0;
    if ($102) {
      label = 17;
      break;
    } else {
      var $t_224 = $101;
      var $rsize_325 = $_rsize_3;
      var $v_326 = $t_2_v_3;
      label = 16;
      break;
    }
   case 17:
    var $103 = $t_224 + 20 | 0;
    var $104 = HEAP32[$103 >> 2];
    var $105 = ($104 | 0) == 0;
    if ($105) {
      var $rsize_3_lcssa = $_rsize_3;
      var $v_3_lcssa = $t_2_v_3;
      label = 18;
      break;
    } else {
      var $t_224 = $104;
      var $rsize_325 = $_rsize_3;
      var $v_326 = $t_2_v_3;
      label = 16;
      break;
    }
   case 18:
    var $v_3_lcssa;
    var $rsize_3_lcssa;
    var $106 = ($v_3_lcssa | 0) == 0;
    if ($106) {
      var $_0 = 0;
      label = 81;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $108 = HEAP32[5243816 >> 2];
    var $109 = $108 - $nb | 0;
    var $110 = $rsize_3_lcssa >>> 0 < $109 >>> 0;
    if ($110) {
      label = 20;
      break;
    } else {
      var $_0 = 0;
      label = 81;
      break;
    }
   case 20:
    var $112 = $v_3_lcssa;
    var $113 = HEAP32[5243824 >> 2];
    var $114 = $112 >>> 0 < $113 >>> 0;
    if ($114) {
      label = 80;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $116 = $112 + $nb | 0;
    var $117 = $116;
    var $118 = $112 >>> 0 < $116 >>> 0;
    if ($118) {
      label = 22;
      break;
    } else {
      label = 80;
      break;
    }
   case 22:
    var $120 = $v_3_lcssa + 24 | 0;
    var $121 = HEAP32[$120 >> 2];
    var $122 = $v_3_lcssa + 12 | 0;
    var $123 = HEAP32[$122 >> 2];
    var $124 = ($123 | 0) == ($v_3_lcssa | 0);
    if ($124) {
      label = 26;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $126 = $v_3_lcssa + 8 | 0;
    var $127 = HEAP32[$126 >> 2];
    var $128 = $127;
    var $129 = $128 >>> 0 < $113 >>> 0;
    if ($129) {
      label = 25;
      break;
    } else {
      label = 24;
      break;
    }
   case 24:
    var $131 = $127 + 12 | 0;
    HEAP32[$131 >> 2] = $123;
    var $132 = $123 + 8 | 0;
    HEAP32[$132 >> 2] = $127;
    var $R_1 = $123;
    label = 34;
    break;
   case 25:
    _abort();
   case 26:
    var $135 = $v_3_lcssa + 20 | 0;
    var $136 = HEAP32[$135 >> 2];
    var $137 = ($136 | 0) == 0;
    if ($137) {
      label = 27;
      break;
    } else {
      var $R_0 = $136;
      var $RP_0 = $135;
      label = 28;
      break;
    }
   case 27:
    var $139 = $v_3_lcssa + 16 | 0;
    var $140 = HEAP32[$139 >> 2];
    var $141 = ($140 | 0) == 0;
    if ($141) {
      var $R_1 = 0;
      label = 34;
      break;
    } else {
      var $R_0 = $140;
      var $RP_0 = $139;
      label = 28;
      break;
    }
   case 28:
    var $RP_0;
    var $R_0;
    var $142 = $R_0 + 20 | 0;
    var $143 = HEAP32[$142 >> 2];
    var $144 = ($143 | 0) == 0;
    if ($144) {
      label = 29;
      break;
    } else {
      var $CP_0 = $142;
      label = 30;
      break;
    }
   case 29:
    var $146 = $R_0 + 16 | 0;
    var $147 = HEAP32[$146 >> 2];
    var $148 = ($147 | 0) == 0;
    if ($148) {
      label = 31;
      break;
    } else {
      var $CP_0 = $146;
      label = 30;
      break;
    }
   case 30:
    var $CP_0;
    var $149 = HEAP32[$CP_0 >> 2];
    var $R_0 = $149;
    var $RP_0 = $CP_0;
    label = 28;
    break;
   case 31:
    var $151 = $RP_0;
    var $152 = HEAP32[5243824 >> 2];
    var $153 = $151 >>> 0 < $152 >>> 0;
    if ($153) {
      label = 33;
      break;
    } else {
      label = 32;
      break;
    }
   case 32:
    HEAP32[$RP_0 >> 2] = 0;
    var $R_1 = $R_0;
    label = 34;
    break;
   case 33:
    _abort();
   case 34:
    var $R_1;
    var $157 = ($121 | 0) == 0;
    if ($157) {
      label = 54;
      break;
    } else {
      label = 35;
      break;
    }
   case 35:
    var $159 = $v_3_lcssa + 28 | 0;
    var $160 = HEAP32[$159 >> 2];
    var $161 = 5244112 + ($160 << 2) | 0;
    var $162 = HEAP32[$161 >> 2];
    var $163 = ($v_3_lcssa | 0) == ($162 | 0);
    if ($163) {
      label = 36;
      break;
    } else {
      label = 38;
      break;
    }
   case 36:
    HEAP32[$161 >> 2] = $R_1;
    var $cond = ($R_1 | 0) == 0;
    if ($cond) {
      label = 37;
      break;
    } else {
      label = 44;
      break;
    }
   case 37:
    var $165 = HEAP32[$159 >> 2];
    var $166 = 1 << $165;
    var $167 = $166 ^ -1;
    var $168 = HEAP32[5243812 >> 2];
    var $169 = $168 & $167;
    HEAP32[5243812 >> 2] = $169;
    label = 54;
    break;
   case 38:
    var $171 = $121;
    var $172 = HEAP32[5243824 >> 2];
    var $173 = $171 >>> 0 < $172 >>> 0;
    if ($173) {
      label = 42;
      break;
    } else {
      label = 39;
      break;
    }
   case 39:
    var $175 = $121 + 16 | 0;
    var $176 = HEAP32[$175 >> 2];
    var $177 = ($176 | 0) == ($v_3_lcssa | 0);
    if ($177) {
      label = 40;
      break;
    } else {
      label = 41;
      break;
    }
   case 40:
    HEAP32[$175 >> 2] = $R_1;
    label = 43;
    break;
   case 41:
    var $180 = $121 + 20 | 0;
    HEAP32[$180 >> 2] = $R_1;
    label = 43;
    break;
   case 42:
    _abort();
   case 43:
    var $183 = ($R_1 | 0) == 0;
    if ($183) {
      label = 54;
      break;
    } else {
      label = 44;
      break;
    }
   case 44:
    var $185 = $R_1;
    var $186 = HEAP32[5243824 >> 2];
    var $187 = $185 >>> 0 < $186 >>> 0;
    if ($187) {
      label = 53;
      break;
    } else {
      label = 45;
      break;
    }
   case 45:
    var $189 = $R_1 + 24 | 0;
    HEAP32[$189 >> 2] = $121;
    var $190 = $v_3_lcssa + 16 | 0;
    var $191 = HEAP32[$190 >> 2];
    var $192 = ($191 | 0) == 0;
    if ($192) {
      label = 49;
      break;
    } else {
      label = 46;
      break;
    }
   case 46:
    var $194 = $191;
    var $195 = HEAP32[5243824 >> 2];
    var $196 = $194 >>> 0 < $195 >>> 0;
    if ($196) {
      label = 48;
      break;
    } else {
      label = 47;
      break;
    }
   case 47:
    var $198 = $R_1 + 16 | 0;
    HEAP32[$198 >> 2] = $191;
    var $199 = $191 + 24 | 0;
    HEAP32[$199 >> 2] = $R_1;
    label = 49;
    break;
   case 48:
    _abort();
   case 49:
    var $202 = $v_3_lcssa + 20 | 0;
    var $203 = HEAP32[$202 >> 2];
    var $204 = ($203 | 0) == 0;
    if ($204) {
      label = 54;
      break;
    } else {
      label = 50;
      break;
    }
   case 50:
    var $206 = $203;
    var $207 = HEAP32[5243824 >> 2];
    var $208 = $206 >>> 0 < $207 >>> 0;
    if ($208) {
      label = 52;
      break;
    } else {
      label = 51;
      break;
    }
   case 51:
    var $210 = $R_1 + 20 | 0;
    HEAP32[$210 >> 2] = $203;
    var $211 = $203 + 24 | 0;
    HEAP32[$211 >> 2] = $R_1;
    label = 54;
    break;
   case 52:
    _abort();
   case 53:
    _abort();
   case 54:
    var $215 = $rsize_3_lcssa >>> 0 < 16;
    if ($215) {
      label = 55;
      break;
    } else {
      label = 56;
      break;
    }
   case 55:
    var $217 = $rsize_3_lcssa + $nb | 0;
    var $218 = $217 | 3;
    var $219 = $v_3_lcssa + 4 | 0;
    HEAP32[$219 >> 2] = $218;
    var $_sum18 = $217 + 4 | 0;
    var $220 = $112 + $_sum18 | 0;
    var $221 = $220;
    var $222 = HEAP32[$221 >> 2];
    var $223 = $222 | 1;
    HEAP32[$221 >> 2] = $223;
    label = 79;
    break;
   case 56:
    var $225 = $nb | 3;
    var $226 = $v_3_lcssa + 4 | 0;
    HEAP32[$226 >> 2] = $225;
    var $227 = $rsize_3_lcssa | 1;
    var $_sum = $nb + 4 | 0;
    var $228 = $112 + $_sum | 0;
    var $229 = $228;
    HEAP32[$229 >> 2] = $227;
    var $_sum1 = $rsize_3_lcssa + $nb | 0;
    var $230 = $112 + $_sum1 | 0;
    var $231 = $230;
    HEAP32[$231 >> 2] = $rsize_3_lcssa;
    var $232 = $rsize_3_lcssa >>> 3;
    var $233 = $rsize_3_lcssa >>> 0 < 256;
    if ($233) {
      label = 57;
      break;
    } else {
      label = 62;
      break;
    }
   case 57:
    var $235 = $232 << 1;
    var $236 = 5243848 + ($235 << 2) | 0;
    var $237 = $236;
    var $238 = HEAP32[5243808 >> 2];
    var $239 = 1 << $232;
    var $240 = $238 & $239;
    var $241 = ($240 | 0) == 0;
    if ($241) {
      label = 58;
      break;
    } else {
      label = 59;
      break;
    }
   case 58:
    var $243 = $238 | $239;
    HEAP32[5243808 >> 2] = $243;
    var $F5_0 = $237;
    label = 61;
    break;
   case 59:
    var $_sum17 = $235 + 2 | 0;
    var $245 = 5243848 + ($_sum17 << 2) | 0;
    var $246 = HEAP32[$245 >> 2];
    var $247 = $246;
    var $248 = HEAP32[5243824 >> 2];
    var $249 = $247 >>> 0 < $248 >>> 0;
    if ($249) {
      label = 60;
      break;
    } else {
      var $F5_0 = $246;
      label = 61;
      break;
    }
   case 60:
    _abort();
   case 61:
    var $F5_0;
    var $_sum14 = $235 + 2 | 0;
    var $252 = 5243848 + ($_sum14 << 2) | 0;
    HEAP32[$252 >> 2] = $117;
    var $253 = $F5_0 + 12 | 0;
    HEAP32[$253 >> 2] = $117;
    var $_sum15 = $nb + 8 | 0;
    var $254 = $112 + $_sum15 | 0;
    var $255 = $254;
    HEAP32[$255 >> 2] = $F5_0;
    var $_sum16 = $nb + 12 | 0;
    var $256 = $112 + $_sum16 | 0;
    var $257 = $256;
    HEAP32[$257 >> 2] = $237;
    label = 79;
    break;
   case 62:
    var $259 = $116;
    var $260 = $rsize_3_lcssa >>> 8;
    var $261 = ($260 | 0) == 0;
    if ($261) {
      var $I7_0 = 0;
      label = 65;
      break;
    } else {
      label = 63;
      break;
    }
   case 63:
    var $263 = $rsize_3_lcssa >>> 0 > 16777215;
    if ($263) {
      var $I7_0 = 31;
      label = 65;
      break;
    } else {
      label = 64;
      break;
    }
   case 64:
    var $265 = $260 + 1048320 | 0;
    var $266 = $265 >>> 16;
    var $267 = $266 & 8;
    var $268 = $260 << $267;
    var $269 = $268 + 520192 | 0;
    var $270 = $269 >>> 16;
    var $271 = $270 & 4;
    var $272 = $271 | $267;
    var $273 = $268 << $271;
    var $274 = $273 + 245760 | 0;
    var $275 = $274 >>> 16;
    var $276 = $275 & 2;
    var $277 = $272 | $276;
    var $278 = 14 - $277 | 0;
    var $279 = $273 << $276;
    var $280 = $279 >>> 15;
    var $281 = $278 + $280 | 0;
    var $282 = $281 << 1;
    var $283 = $281 + 7 | 0;
    var $284 = $rsize_3_lcssa >>> ($283 >>> 0);
    var $285 = $284 & 1;
    var $286 = $285 | $282;
    var $I7_0 = $286;
    label = 65;
    break;
   case 65:
    var $I7_0;
    var $288 = 5244112 + ($I7_0 << 2) | 0;
    var $_sum2 = $nb + 28 | 0;
    var $289 = $112 + $_sum2 | 0;
    var $290 = $289;
    HEAP32[$290 >> 2] = $I7_0;
    var $_sum3 = $nb + 16 | 0;
    var $291 = $112 + $_sum3 | 0;
    var $_sum4 = $nb + 20 | 0;
    var $292 = $112 + $_sum4 | 0;
    var $293 = $292;
    HEAP32[$293 >> 2] = 0;
    var $294 = $291;
    HEAP32[$294 >> 2] = 0;
    var $295 = HEAP32[5243812 >> 2];
    var $296 = 1 << $I7_0;
    var $297 = $295 & $296;
    var $298 = ($297 | 0) == 0;
    if ($298) {
      label = 66;
      break;
    } else {
      label = 67;
      break;
    }
   case 66:
    var $300 = $295 | $296;
    HEAP32[5243812 >> 2] = $300;
    HEAP32[$288 >> 2] = $259;
    var $301 = $288;
    var $_sum5 = $nb + 24 | 0;
    var $302 = $112 + $_sum5 | 0;
    var $303 = $302;
    HEAP32[$303 >> 2] = $301;
    var $_sum6 = $nb + 12 | 0;
    var $304 = $112 + $_sum6 | 0;
    var $305 = $304;
    HEAP32[$305 >> 2] = $259;
    var $_sum7 = $nb + 8 | 0;
    var $306 = $112 + $_sum7 | 0;
    var $307 = $306;
    HEAP32[$307 >> 2] = $259;
    label = 79;
    break;
   case 67:
    var $309 = HEAP32[$288 >> 2];
    var $310 = ($I7_0 | 0) == 31;
    if ($310) {
      var $315 = 0;
      label = 69;
      break;
    } else {
      label = 68;
      break;
    }
   case 68:
    var $312 = $I7_0 >>> 1;
    var $313 = 25 - $312 | 0;
    var $315 = $313;
    label = 69;
    break;
   case 69:
    var $315;
    var $316 = $rsize_3_lcssa << $315;
    var $K12_0 = $316;
    var $T_0 = $309;
    label = 70;
    break;
   case 70:
    var $T_0;
    var $K12_0;
    var $318 = $T_0 + 4 | 0;
    var $319 = HEAP32[$318 >> 2];
    var $320 = $319 & -8;
    var $321 = ($320 | 0) == ($rsize_3_lcssa | 0);
    if ($321) {
      label = 75;
      break;
    } else {
      label = 71;
      break;
    }
   case 71:
    var $323 = $K12_0 >>> 31;
    var $324 = $T_0 + 16 + ($323 << 2) | 0;
    var $325 = HEAP32[$324 >> 2];
    var $326 = ($325 | 0) == 0;
    var $327 = $K12_0 << 1;
    if ($326) {
      label = 72;
      break;
    } else {
      var $K12_0 = $327;
      var $T_0 = $325;
      label = 70;
      break;
    }
   case 72:
    var $329 = $324;
    var $330 = HEAP32[5243824 >> 2];
    var $331 = $329 >>> 0 < $330 >>> 0;
    if ($331) {
      label = 74;
      break;
    } else {
      label = 73;
      break;
    }
   case 73:
    HEAP32[$324 >> 2] = $259;
    var $_sum11 = $nb + 24 | 0;
    var $333 = $112 + $_sum11 | 0;
    var $334 = $333;
    HEAP32[$334 >> 2] = $T_0;
    var $_sum12 = $nb + 12 | 0;
    var $335 = $112 + $_sum12 | 0;
    var $336 = $335;
    HEAP32[$336 >> 2] = $259;
    var $_sum13 = $nb + 8 | 0;
    var $337 = $112 + $_sum13 | 0;
    var $338 = $337;
    HEAP32[$338 >> 2] = $259;
    label = 79;
    break;
   case 74:
    _abort();
   case 75:
    var $341 = $T_0 + 8 | 0;
    var $342 = HEAP32[$341 >> 2];
    var $343 = $T_0;
    var $344 = HEAP32[5243824 >> 2];
    var $345 = $343 >>> 0 < $344 >>> 0;
    if ($345) {
      label = 78;
      break;
    } else {
      label = 76;
      break;
    }
   case 76:
    var $347 = $342;
    var $348 = $347 >>> 0 < $344 >>> 0;
    if ($348) {
      label = 78;
      break;
    } else {
      label = 77;
      break;
    }
   case 77:
    var $350 = $342 + 12 | 0;
    HEAP32[$350 >> 2] = $259;
    HEAP32[$341 >> 2] = $259;
    var $_sum8 = $nb + 8 | 0;
    var $351 = $112 + $_sum8 | 0;
    var $352 = $351;
    HEAP32[$352 >> 2] = $342;
    var $_sum9 = $nb + 12 | 0;
    var $353 = $112 + $_sum9 | 0;
    var $354 = $353;
    HEAP32[$354 >> 2] = $T_0;
    var $_sum10 = $nb + 24 | 0;
    var $355 = $112 + $_sum10 | 0;
    var $356 = $355;
    HEAP32[$356 >> 2] = 0;
    label = 79;
    break;
   case 78:
    _abort();
   case 79:
    var $358 = $v_3_lcssa + 8 | 0;
    var $359 = $358;
    var $_0 = $359;
    label = 81;
    break;
   case 80:
    _abort();
   case 81:
    var $_0;
    return $_0;
  }
}
_tmalloc_large["X"] = 1;
function _sys_trim($pad) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = $pad >>> 0 < 4294967232;
    if ($5) {
      label = 5;
      break;
    } else {
      var $released_2 = 0;
      label = 14;
      break;
    }
   case 5:
    var $7 = HEAP32[5243832 >> 2];
    var $8 = ($7 | 0) == 0;
    if ($8) {
      var $released_2 = 0;
      label = 14;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $10 = $pad + 40 | 0;
    var $11 = HEAP32[5243820 >> 2];
    var $12 = $11 >>> 0 > $10 >>> 0;
    if ($12) {
      label = 7;
      break;
    } else {
      label = 12;
      break;
    }
   case 7:
    var $14 = HEAP32[5242920 >> 2];
    var $_neg = -40 - $pad | 0;
    var $15 = $_neg - 1 | 0;
    var $16 = $15 + $11 | 0;
    var $17 = $16 + $14 | 0;
    var $18 = Math.floor(($17 >>> 0) / ($14 >>> 0));
    var $19 = $18 - 1 | 0;
    var $20 = Math.imul($19, $14);
    var $21 = $7;
    var $22 = _segment_holding($21);
    var $23 = $22 + 12 | 0;
    var $24 = HEAP32[$23 >> 2];
    var $25 = $24 & 8;
    var $26 = ($25 | 0) == 0;
    if ($26) {
      label = 8;
      break;
    } else {
      label = 12;
      break;
    }
   case 8:
    var $28 = _sbrk(0);
    var $29 = $22 | 0;
    var $30 = HEAP32[$29 >> 2];
    var $31 = $22 + 4 | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = $30 + $32 | 0;
    var $34 = ($28 | 0) == ($33 | 0);
    if ($34) {
      label = 9;
      break;
    } else {
      label = 12;
      break;
    }
   case 9:
    var $36 = -2147483648 - $14 | 0;
    var $37 = $20 >>> 0 > 2147483646;
    var $_ = $37 ? $36 : $20;
    var $38 = -$_ | 0;
    var $39 = _sbrk($38);
    var $40 = _sbrk(0);
    var $41 = ($39 | 0) != -1;
    var $42 = $40 >>> 0 < $28 >>> 0;
    var $or_cond = $41 & $42;
    if ($or_cond) {
      label = 10;
      break;
    } else {
      label = 12;
      break;
    }
   case 10:
    var $44 = $28;
    var $45 = $40;
    var $46 = $44 - $45 | 0;
    var $47 = ($28 | 0) == ($40 | 0);
    if ($47) {
      label = 12;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $49 = $22 + 4 | 0;
    var $50 = HEAP32[$49 >> 2];
    var $51 = $50 - $46 | 0;
    HEAP32[$49 >> 2] = $51;
    var $52 = HEAP32[5244240 >> 2];
    var $53 = $52 - $46 | 0;
    HEAP32[5244240 >> 2] = $53;
    var $54 = HEAP32[5243832 >> 2];
    var $55 = HEAP32[5243820 >> 2];
    var $56 = $55 - $46 | 0;
    _init_top($54, $56);
    var $phitmp = ($28 | 0) != ($40 | 0);
    var $released_2 = $phitmp;
    label = 14;
    break;
   case 12:
    var $57 = HEAP32[5243820 >> 2];
    var $58 = HEAP32[5243836 >> 2];
    var $59 = $57 >>> 0 > $58 >>> 0;
    if ($59) {
      label = 13;
      break;
    } else {
      var $released_2 = 0;
      label = 14;
      break;
    }
   case 13:
    HEAP32[5243836 >> 2] = -1;
    var $released_2 = 0;
    label = 14;
    break;
   case 14:
    var $released_2;
    var $62 = $released_2 & 1;
    return $62;
  }
}
_sys_trim["X"] = 1;
function _free($mem) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($mem | 0) == 0;
    if ($1) {
      label = 130;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $3 = $mem - 8 | 0;
    var $4 = $3;
    var $5 = HEAP32[5243824 >> 2];
    var $6 = $3 >>> 0 < $5 >>> 0;
    if ($6) {
      label = 129;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $8 = $mem - 4 | 0;
    var $9 = $8;
    var $10 = HEAP32[$9 >> 2];
    var $11 = $10 & 3;
    var $12 = ($11 | 0) == 1;
    if ($12) {
      label = 129;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $14 = $10 & -8;
    var $_sum = $14 - 8 | 0;
    var $15 = $mem + $_sum | 0;
    var $16 = $15;
    var $17 = $10 & 1;
    var $18 = ($17 | 0) == 0;
    if ($18) {
      label = 6;
      break;
    } else {
      var $p_0 = $4;
      var $psize_0 = $14;
      label = 50;
      break;
    }
   case 6:
    var $20 = $3;
    var $21 = HEAP32[$20 >> 2];
    var $22 = ($11 | 0) == 0;
    if ($22) {
      label = 130;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $_sum216 = -8 - $21 | 0;
    var $24 = $mem + $_sum216 | 0;
    var $25 = $24;
    var $26 = $21 + $14 | 0;
    var $27 = $24 >>> 0 < $5 >>> 0;
    if ($27) {
      label = 129;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $29 = HEAP32[5243828 >> 2];
    var $30 = ($25 | 0) == ($29 | 0);
    if ($30) {
      label = 48;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $32 = $21 >>> 3;
    var $33 = $21 >>> 0 < 256;
    if ($33) {
      label = 10;
      break;
    } else {
      label = 16;
      break;
    }
   case 10:
    var $_sum250 = $_sum216 + 8 | 0;
    var $35 = $mem + $_sum250 | 0;
    var $36 = $35;
    var $37 = HEAP32[$36 >> 2];
    var $_sum251 = $_sum216 + 12 | 0;
    var $38 = $mem + $_sum251 | 0;
    var $39 = $38;
    var $40 = HEAP32[$39 >> 2];
    var $41 = ($37 | 0) == ($40 | 0);
    if ($41) {
      label = 11;
      break;
    } else {
      label = 12;
      break;
    }
   case 11:
    var $43 = 1 << $32;
    var $44 = $43 ^ -1;
    var $45 = HEAP32[5243808 >> 2];
    var $46 = $45 & $44;
    HEAP32[5243808 >> 2] = $46;
    var $p_0 = $25;
    var $psize_0 = $26;
    label = 50;
    break;
   case 12:
    var $48 = $32 << 1;
    var $49 = 5243848 + ($48 << 2) | 0;
    var $50 = $49;
    var $51 = ($37 | 0) != ($50 | 0);
    var $52 = $37;
    var $53 = $52 >>> 0 < $5 >>> 0;
    var $or_cond = $51 & $53;
    if ($or_cond) {
      label = 15;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $55 = ($40 | 0) == ($50 | 0);
    var $56 = $40;
    var $57 = $56 >>> 0 >= $5 >>> 0;
    var $or_cond263 = $55 | $57;
    if ($or_cond263) {
      label = 14;
      break;
    } else {
      label = 15;
      break;
    }
   case 14:
    var $58 = $37 + 12 | 0;
    HEAP32[$58 >> 2] = $40;
    var $59 = $40 + 8 | 0;
    HEAP32[$59 >> 2] = $37;
    var $p_0 = $25;
    var $psize_0 = $26;
    label = 50;
    break;
   case 15:
    _abort();
   case 16:
    var $61 = $24;
    var $_sum242 = $_sum216 + 24 | 0;
    var $62 = $mem + $_sum242 | 0;
    var $63 = $62;
    var $64 = HEAP32[$63 >> 2];
    var $_sum243 = $_sum216 + 12 | 0;
    var $65 = $mem + $_sum243 | 0;
    var $66 = $65;
    var $67 = HEAP32[$66 >> 2];
    var $68 = ($67 | 0) == ($61 | 0);
    if ($68) {
      label = 20;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $_sum249 = $_sum216 + 8 | 0;
    var $70 = $mem + $_sum249 | 0;
    var $71 = $70;
    var $72 = HEAP32[$71 >> 2];
    var $73 = $72;
    var $74 = $73 >>> 0 < $5 >>> 0;
    if ($74) {
      label = 19;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $76 = $72 + 12 | 0;
    HEAP32[$76 >> 2] = $67;
    var $77 = $67 + 8 | 0;
    HEAP32[$77 >> 2] = $72;
    var $R_1 = $67;
    label = 28;
    break;
   case 19:
    _abort();
   case 20:
    var $_sum245 = $_sum216 + 20 | 0;
    var $80 = $mem + $_sum245 | 0;
    var $81 = $80;
    var $82 = HEAP32[$81 >> 2];
    var $83 = ($82 | 0) == 0;
    if ($83) {
      label = 21;
      break;
    } else {
      var $R_0 = $82;
      var $RP_0 = $81;
      label = 22;
      break;
    }
   case 21:
    var $_sum244 = $_sum216 + 16 | 0;
    var $85 = $mem + $_sum244 | 0;
    var $86 = $85;
    var $87 = HEAP32[$86 >> 2];
    var $88 = ($87 | 0) == 0;
    if ($88) {
      var $R_1 = 0;
      label = 28;
      break;
    } else {
      var $R_0 = $87;
      var $RP_0 = $86;
      label = 22;
      break;
    }
   case 22:
    var $RP_0;
    var $R_0;
    var $89 = $R_0 + 20 | 0;
    var $90 = HEAP32[$89 >> 2];
    var $91 = ($90 | 0) == 0;
    if ($91) {
      label = 23;
      break;
    } else {
      var $CP_0 = $89;
      label = 24;
      break;
    }
   case 23:
    var $93 = $R_0 + 16 | 0;
    var $94 = HEAP32[$93 >> 2];
    var $95 = ($94 | 0) == 0;
    if ($95) {
      label = 25;
      break;
    } else {
      var $CP_0 = $93;
      label = 24;
      break;
    }
   case 24:
    var $CP_0;
    var $96 = HEAP32[$CP_0 >> 2];
    var $R_0 = $96;
    var $RP_0 = $CP_0;
    label = 22;
    break;
   case 25:
    var $98 = $RP_0;
    var $99 = HEAP32[5243824 >> 2];
    var $100 = $98 >>> 0 < $99 >>> 0;
    if ($100) {
      label = 27;
      break;
    } else {
      label = 26;
      break;
    }
   case 26:
    HEAP32[$RP_0 >> 2] = 0;
    var $R_1 = $R_0;
    label = 28;
    break;
   case 27:
    _abort();
   case 28:
    var $R_1;
    var $104 = ($64 | 0) == 0;
    if ($104) {
      var $p_0 = $25;
      var $psize_0 = $26;
      label = 50;
      break;
    } else {
      label = 29;
      break;
    }
   case 29:
    var $_sum246 = $_sum216 + 28 | 0;
    var $106 = $mem + $_sum246 | 0;
    var $107 = $106;
    var $108 = HEAP32[$107 >> 2];
    var $109 = 5244112 + ($108 << 2) | 0;
    var $110 = HEAP32[$109 >> 2];
    var $111 = ($61 | 0) == ($110 | 0);
    if ($111) {
      label = 30;
      break;
    } else {
      label = 32;
      break;
    }
   case 30:
    HEAP32[$109 >> 2] = $R_1;
    var $cond = ($R_1 | 0) == 0;
    if ($cond) {
      label = 31;
      break;
    } else {
      label = 38;
      break;
    }
   case 31:
    var $113 = HEAP32[$107 >> 2];
    var $114 = 1 << $113;
    var $115 = $114 ^ -1;
    var $116 = HEAP32[5243812 >> 2];
    var $117 = $116 & $115;
    HEAP32[5243812 >> 2] = $117;
    var $p_0 = $25;
    var $psize_0 = $26;
    label = 50;
    break;
   case 32:
    var $119 = $64;
    var $120 = HEAP32[5243824 >> 2];
    var $121 = $119 >>> 0 < $120 >>> 0;
    if ($121) {
      label = 36;
      break;
    } else {
      label = 33;
      break;
    }
   case 33:
    var $123 = $64 + 16 | 0;
    var $124 = HEAP32[$123 >> 2];
    var $125 = ($124 | 0) == ($61 | 0);
    if ($125) {
      label = 34;
      break;
    } else {
      label = 35;
      break;
    }
   case 34:
    HEAP32[$123 >> 2] = $R_1;
    label = 37;
    break;
   case 35:
    var $128 = $64 + 20 | 0;
    HEAP32[$128 >> 2] = $R_1;
    label = 37;
    break;
   case 36:
    _abort();
   case 37:
    var $131 = ($R_1 | 0) == 0;
    if ($131) {
      var $p_0 = $25;
      var $psize_0 = $26;
      label = 50;
      break;
    } else {
      label = 38;
      break;
    }
   case 38:
    var $133 = $R_1;
    var $134 = HEAP32[5243824 >> 2];
    var $135 = $133 >>> 0 < $134 >>> 0;
    if ($135) {
      label = 47;
      break;
    } else {
      label = 39;
      break;
    }
   case 39:
    var $137 = $R_1 + 24 | 0;
    HEAP32[$137 >> 2] = $64;
    var $_sum247 = $_sum216 + 16 | 0;
    var $138 = $mem + $_sum247 | 0;
    var $139 = $138;
    var $140 = HEAP32[$139 >> 2];
    var $141 = ($140 | 0) == 0;
    if ($141) {
      label = 43;
      break;
    } else {
      label = 40;
      break;
    }
   case 40:
    var $143 = $140;
    var $144 = HEAP32[5243824 >> 2];
    var $145 = $143 >>> 0 < $144 >>> 0;
    if ($145) {
      label = 42;
      break;
    } else {
      label = 41;
      break;
    }
   case 41:
    var $147 = $R_1 + 16 | 0;
    HEAP32[$147 >> 2] = $140;
    var $148 = $140 + 24 | 0;
    HEAP32[$148 >> 2] = $R_1;
    label = 43;
    break;
   case 42:
    _abort();
   case 43:
    var $_sum248 = $_sum216 + 20 | 0;
    var $151 = $mem + $_sum248 | 0;
    var $152 = $151;
    var $153 = HEAP32[$152 >> 2];
    var $154 = ($153 | 0) == 0;
    if ($154) {
      var $p_0 = $25;
      var $psize_0 = $26;
      label = 50;
      break;
    } else {
      label = 44;
      break;
    }
   case 44:
    var $156 = $153;
    var $157 = HEAP32[5243824 >> 2];
    var $158 = $156 >>> 0 < $157 >>> 0;
    if ($158) {
      label = 46;
      break;
    } else {
      label = 45;
      break;
    }
   case 45:
    var $160 = $R_1 + 20 | 0;
    HEAP32[$160 >> 2] = $153;
    var $161 = $153 + 24 | 0;
    HEAP32[$161 >> 2] = $R_1;
    var $p_0 = $25;
    var $psize_0 = $26;
    label = 50;
    break;
   case 46:
    _abort();
   case 47:
    _abort();
   case 48:
    var $_sum217 = $14 - 4 | 0;
    var $165 = $mem + $_sum217 | 0;
    var $166 = $165;
    var $167 = HEAP32[$166 >> 2];
    var $168 = $167 & 3;
    var $169 = ($168 | 0) == 3;
    if ($169) {
      label = 49;
      break;
    } else {
      var $p_0 = $25;
      var $psize_0 = $26;
      label = 50;
      break;
    }
   case 49:
    HEAP32[5243816 >> 2] = $26;
    var $171 = HEAP32[$166 >> 2];
    var $172 = $171 & -2;
    HEAP32[$166 >> 2] = $172;
    var $173 = $26 | 1;
    var $_sum240 = $_sum216 + 4 | 0;
    var $174 = $mem + $_sum240 | 0;
    var $175 = $174;
    HEAP32[$175 >> 2] = $173;
    var $176 = $15;
    HEAP32[$176 >> 2] = $26;
    label = 130;
    break;
   case 50:
    var $psize_0;
    var $p_0;
    var $178 = $p_0;
    var $179 = $178 >>> 0 < $15 >>> 0;
    if ($179) {
      label = 51;
      break;
    } else {
      label = 129;
      break;
    }
   case 51:
    var $_sum239 = $14 - 4 | 0;
    var $181 = $mem + $_sum239 | 0;
    var $182 = $181;
    var $183 = HEAP32[$182 >> 2];
    var $184 = $183 & 1;
    var $185 = ($184 | 0) == 0;
    if ($185) {
      label = 129;
      break;
    } else {
      label = 52;
      break;
    }
   case 52:
    var $187 = $183 & 2;
    var $188 = ($187 | 0) == 0;
    if ($188) {
      label = 53;
      break;
    } else {
      label = 103;
      break;
    }
   case 53:
    var $190 = HEAP32[5243832 >> 2];
    var $191 = ($16 | 0) == ($190 | 0);
    if ($191) {
      label = 54;
      break;
    } else {
      label = 58;
      break;
    }
   case 54:
    var $193 = HEAP32[5243820 >> 2];
    var $194 = $193 + $psize_0 | 0;
    HEAP32[5243820 >> 2] = $194;
    HEAP32[5243832 >> 2] = $p_0;
    var $195 = $194 | 1;
    var $196 = $p_0 + 4 | 0;
    HEAP32[$196 >> 2] = $195;
    var $197 = HEAP32[5243828 >> 2];
    var $198 = ($p_0 | 0) == ($197 | 0);
    if ($198) {
      label = 55;
      break;
    } else {
      label = 56;
      break;
    }
   case 55:
    HEAP32[5243828 >> 2] = 0;
    HEAP32[5243816 >> 2] = 0;
    label = 56;
    break;
   case 56:
    var $201 = HEAP32[5243836 >> 2];
    var $202 = $194 >>> 0 > $201 >>> 0;
    if ($202) {
      label = 57;
      break;
    } else {
      label = 130;
      break;
    }
   case 57:
    var $204 = _sys_trim(0);
    label = 130;
    break;
   case 58:
    var $206 = HEAP32[5243828 >> 2];
    var $207 = ($16 | 0) == ($206 | 0);
    if ($207) {
      label = 59;
      break;
    } else {
      label = 60;
      break;
    }
   case 59:
    var $209 = HEAP32[5243816 >> 2];
    var $210 = $209 + $psize_0 | 0;
    HEAP32[5243816 >> 2] = $210;
    HEAP32[5243828 >> 2] = $p_0;
    var $211 = $210 | 1;
    var $212 = $p_0 + 4 | 0;
    HEAP32[$212 >> 2] = $211;
    var $213 = $178 + $210 | 0;
    var $214 = $213;
    HEAP32[$214 >> 2] = $210;
    label = 130;
    break;
   case 60:
    var $216 = $183 & -8;
    var $217 = $216 + $psize_0 | 0;
    var $218 = $183 >>> 3;
    var $219 = $183 >>> 0 < 256;
    if ($219) {
      label = 61;
      break;
    } else {
      label = 69;
      break;
    }
   case 61:
    var $221 = $mem + $14 | 0;
    var $222 = $221;
    var $223 = HEAP32[$222 >> 2];
    var $_sum237238 = $14 | 4;
    var $224 = $mem + $_sum237238 | 0;
    var $225 = $224;
    var $226 = HEAP32[$225 >> 2];
    var $227 = ($223 | 0) == ($226 | 0);
    if ($227) {
      label = 62;
      break;
    } else {
      label = 63;
      break;
    }
   case 62:
    var $229 = 1 << $218;
    var $230 = $229 ^ -1;
    var $231 = HEAP32[5243808 >> 2];
    var $232 = $231 & $230;
    HEAP32[5243808 >> 2] = $232;
    label = 101;
    break;
   case 63:
    var $234 = $218 << 1;
    var $235 = 5243848 + ($234 << 2) | 0;
    var $236 = $235;
    var $237 = ($223 | 0) == ($236 | 0);
    if ($237) {
      label = 65;
      break;
    } else {
      label = 64;
      break;
    }
   case 64:
    var $239 = $223;
    var $240 = HEAP32[5243824 >> 2];
    var $241 = $239 >>> 0 < $240 >>> 0;
    if ($241) {
      label = 68;
      break;
    } else {
      label = 65;
      break;
    }
   case 65:
    var $243 = ($226 | 0) == ($236 | 0);
    if ($243) {
      label = 67;
      break;
    } else {
      label = 66;
      break;
    }
   case 66:
    var $245 = $226;
    var $246 = HEAP32[5243824 >> 2];
    var $247 = $245 >>> 0 < $246 >>> 0;
    if ($247) {
      label = 68;
      break;
    } else {
      label = 67;
      break;
    }
   case 67:
    var $248 = $223 + 12 | 0;
    HEAP32[$248 >> 2] = $226;
    var $249 = $226 + 8 | 0;
    HEAP32[$249 >> 2] = $223;
    label = 101;
    break;
   case 68:
    _abort();
   case 69:
    var $251 = $15;
    var $_sum219 = $14 + 16 | 0;
    var $252 = $mem + $_sum219 | 0;
    var $253 = $252;
    var $254 = HEAP32[$253 >> 2];
    var $_sum220221 = $14 | 4;
    var $255 = $mem + $_sum220221 | 0;
    var $256 = $255;
    var $257 = HEAP32[$256 >> 2];
    var $258 = ($257 | 0) == ($251 | 0);
    if ($258) {
      label = 73;
      break;
    } else {
      label = 70;
      break;
    }
   case 70:
    var $260 = $mem + $14 | 0;
    var $261 = $260;
    var $262 = HEAP32[$261 >> 2];
    var $263 = $262;
    var $264 = HEAP32[5243824 >> 2];
    var $265 = $263 >>> 0 < $264 >>> 0;
    if ($265) {
      label = 72;
      break;
    } else {
      label = 71;
      break;
    }
   case 71:
    var $267 = $262 + 12 | 0;
    HEAP32[$267 >> 2] = $257;
    var $268 = $257 + 8 | 0;
    HEAP32[$268 >> 2] = $262;
    var $R7_1 = $257;
    label = 81;
    break;
   case 72:
    _abort();
   case 73:
    var $_sum223 = $14 + 12 | 0;
    var $271 = $mem + $_sum223 | 0;
    var $272 = $271;
    var $273 = HEAP32[$272 >> 2];
    var $274 = ($273 | 0) == 0;
    if ($274) {
      label = 74;
      break;
    } else {
      var $R7_0 = $273;
      var $RP9_0 = $272;
      label = 75;
      break;
    }
   case 74:
    var $_sum222 = $14 + 8 | 0;
    var $276 = $mem + $_sum222 | 0;
    var $277 = $276;
    var $278 = HEAP32[$277 >> 2];
    var $279 = ($278 | 0) == 0;
    if ($279) {
      var $R7_1 = 0;
      label = 81;
      break;
    } else {
      var $R7_0 = $278;
      var $RP9_0 = $277;
      label = 75;
      break;
    }
   case 75:
    var $RP9_0;
    var $R7_0;
    var $280 = $R7_0 + 20 | 0;
    var $281 = HEAP32[$280 >> 2];
    var $282 = ($281 | 0) == 0;
    if ($282) {
      label = 76;
      break;
    } else {
      var $CP10_0 = $280;
      label = 77;
      break;
    }
   case 76:
    var $284 = $R7_0 + 16 | 0;
    var $285 = HEAP32[$284 >> 2];
    var $286 = ($285 | 0) == 0;
    if ($286) {
      label = 78;
      break;
    } else {
      var $CP10_0 = $284;
      label = 77;
      break;
    }
   case 77:
    var $CP10_0;
    var $287 = HEAP32[$CP10_0 >> 2];
    var $R7_0 = $287;
    var $RP9_0 = $CP10_0;
    label = 75;
    break;
   case 78:
    var $289 = $RP9_0;
    var $290 = HEAP32[5243824 >> 2];
    var $291 = $289 >>> 0 < $290 >>> 0;
    if ($291) {
      label = 80;
      break;
    } else {
      label = 79;
      break;
    }
   case 79:
    HEAP32[$RP9_0 >> 2] = 0;
    var $R7_1 = $R7_0;
    label = 81;
    break;
   case 80:
    _abort();
   case 81:
    var $R7_1;
    var $295 = ($254 | 0) == 0;
    if ($295) {
      label = 101;
      break;
    } else {
      label = 82;
      break;
    }
   case 82:
    var $_sum232 = $14 + 20 | 0;
    var $297 = $mem + $_sum232 | 0;
    var $298 = $297;
    var $299 = HEAP32[$298 >> 2];
    var $300 = 5244112 + ($299 << 2) | 0;
    var $301 = HEAP32[$300 >> 2];
    var $302 = ($251 | 0) == ($301 | 0);
    if ($302) {
      label = 83;
      break;
    } else {
      label = 85;
      break;
    }
   case 83:
    HEAP32[$300 >> 2] = $R7_1;
    var $cond261 = ($R7_1 | 0) == 0;
    if ($cond261) {
      label = 84;
      break;
    } else {
      label = 91;
      break;
    }
   case 84:
    var $304 = HEAP32[$298 >> 2];
    var $305 = 1 << $304;
    var $306 = $305 ^ -1;
    var $307 = HEAP32[5243812 >> 2];
    var $308 = $307 & $306;
    HEAP32[5243812 >> 2] = $308;
    label = 101;
    break;
   case 85:
    var $310 = $254;
    var $311 = HEAP32[5243824 >> 2];
    var $312 = $310 >>> 0 < $311 >>> 0;
    if ($312) {
      label = 89;
      break;
    } else {
      label = 86;
      break;
    }
   case 86:
    var $314 = $254 + 16 | 0;
    var $315 = HEAP32[$314 >> 2];
    var $316 = ($315 | 0) == ($251 | 0);
    if ($316) {
      label = 87;
      break;
    } else {
      label = 88;
      break;
    }
   case 87:
    HEAP32[$314 >> 2] = $R7_1;
    label = 90;
    break;
   case 88:
    var $319 = $254 + 20 | 0;
    HEAP32[$319 >> 2] = $R7_1;
    label = 90;
    break;
   case 89:
    _abort();
   case 90:
    var $322 = ($R7_1 | 0) == 0;
    if ($322) {
      label = 101;
      break;
    } else {
      label = 91;
      break;
    }
   case 91:
    var $324 = $R7_1;
    var $325 = HEAP32[5243824 >> 2];
    var $326 = $324 >>> 0 < $325 >>> 0;
    if ($326) {
      label = 100;
      break;
    } else {
      label = 92;
      break;
    }
   case 92:
    var $328 = $R7_1 + 24 | 0;
    HEAP32[$328 >> 2] = $254;
    var $_sum233 = $14 + 8 | 0;
    var $329 = $mem + $_sum233 | 0;
    var $330 = $329;
    var $331 = HEAP32[$330 >> 2];
    var $332 = ($331 | 0) == 0;
    if ($332) {
      label = 96;
      break;
    } else {
      label = 93;
      break;
    }
   case 93:
    var $334 = $331;
    var $335 = HEAP32[5243824 >> 2];
    var $336 = $334 >>> 0 < $335 >>> 0;
    if ($336) {
      label = 95;
      break;
    } else {
      label = 94;
      break;
    }
   case 94:
    var $338 = $R7_1 + 16 | 0;
    HEAP32[$338 >> 2] = $331;
    var $339 = $331 + 24 | 0;
    HEAP32[$339 >> 2] = $R7_1;
    label = 96;
    break;
   case 95:
    _abort();
   case 96:
    var $_sum234 = $14 + 12 | 0;
    var $342 = $mem + $_sum234 | 0;
    var $343 = $342;
    var $344 = HEAP32[$343 >> 2];
    var $345 = ($344 | 0) == 0;
    if ($345) {
      label = 101;
      break;
    } else {
      label = 97;
      break;
    }
   case 97:
    var $347 = $344;
    var $348 = HEAP32[5243824 >> 2];
    var $349 = $347 >>> 0 < $348 >>> 0;
    if ($349) {
      label = 99;
      break;
    } else {
      label = 98;
      break;
    }
   case 98:
    var $351 = $R7_1 + 20 | 0;
    HEAP32[$351 >> 2] = $344;
    var $352 = $344 + 24 | 0;
    HEAP32[$352 >> 2] = $R7_1;
    label = 101;
    break;
   case 99:
    _abort();
   case 100:
    _abort();
   case 101:
    var $356 = $217 | 1;
    var $357 = $p_0 + 4 | 0;
    HEAP32[$357 >> 2] = $356;
    var $358 = $178 + $217 | 0;
    var $359 = $358;
    HEAP32[$359 >> 2] = $217;
    var $360 = HEAP32[5243828 >> 2];
    var $361 = ($p_0 | 0) == ($360 | 0);
    if ($361) {
      label = 102;
      break;
    } else {
      var $psize_1 = $217;
      label = 104;
      break;
    }
   case 102:
    HEAP32[5243816 >> 2] = $217;
    label = 130;
    break;
   case 103:
    var $364 = $183 & -2;
    HEAP32[$182 >> 2] = $364;
    var $365 = $psize_0 | 1;
    var $366 = $p_0 + 4 | 0;
    HEAP32[$366 >> 2] = $365;
    var $367 = $178 + $psize_0 | 0;
    var $368 = $367;
    HEAP32[$368 >> 2] = $psize_0;
    var $psize_1 = $psize_0;
    label = 104;
    break;
   case 104:
    var $psize_1;
    var $370 = $psize_1 >>> 3;
    var $371 = $psize_1 >>> 0 < 256;
    if ($371) {
      label = 105;
      break;
    } else {
      label = 110;
      break;
    }
   case 105:
    var $373 = $370 << 1;
    var $374 = 5243848 + ($373 << 2) | 0;
    var $375 = $374;
    var $376 = HEAP32[5243808 >> 2];
    var $377 = 1 << $370;
    var $378 = $376 & $377;
    var $379 = ($378 | 0) == 0;
    if ($379) {
      label = 106;
      break;
    } else {
      label = 107;
      break;
    }
   case 106:
    var $381 = $376 | $377;
    HEAP32[5243808 >> 2] = $381;
    var $F16_0 = $375;
    label = 109;
    break;
   case 107:
    var $_sum231 = $373 + 2 | 0;
    var $383 = 5243848 + ($_sum231 << 2) | 0;
    var $384 = HEAP32[$383 >> 2];
    var $385 = $384;
    var $386 = HEAP32[5243824 >> 2];
    var $387 = $385 >>> 0 < $386 >>> 0;
    if ($387) {
      label = 108;
      break;
    } else {
      var $F16_0 = $384;
      label = 109;
      break;
    }
   case 108:
    _abort();
   case 109:
    var $F16_0;
    var $_sum230 = $373 + 2 | 0;
    var $390 = 5243848 + ($_sum230 << 2) | 0;
    HEAP32[$390 >> 2] = $p_0;
    var $391 = $F16_0 + 12 | 0;
    HEAP32[$391 >> 2] = $p_0;
    var $392 = $p_0 + 8 | 0;
    HEAP32[$392 >> 2] = $F16_0;
    var $393 = $p_0 + 12 | 0;
    HEAP32[$393 >> 2] = $375;
    label = 130;
    break;
   case 110:
    var $395 = $p_0;
    var $396 = $psize_1 >>> 8;
    var $397 = ($396 | 0) == 0;
    if ($397) {
      var $I18_0 = 0;
      label = 113;
      break;
    } else {
      label = 111;
      break;
    }
   case 111:
    var $399 = $psize_1 >>> 0 > 16777215;
    if ($399) {
      var $I18_0 = 31;
      label = 113;
      break;
    } else {
      label = 112;
      break;
    }
   case 112:
    var $401 = $396 + 1048320 | 0;
    var $402 = $401 >>> 16;
    var $403 = $402 & 8;
    var $404 = $396 << $403;
    var $405 = $404 + 520192 | 0;
    var $406 = $405 >>> 16;
    var $407 = $406 & 4;
    var $408 = $407 | $403;
    var $409 = $404 << $407;
    var $410 = $409 + 245760 | 0;
    var $411 = $410 >>> 16;
    var $412 = $411 & 2;
    var $413 = $408 | $412;
    var $414 = 14 - $413 | 0;
    var $415 = $409 << $412;
    var $416 = $415 >>> 15;
    var $417 = $414 + $416 | 0;
    var $418 = $417 << 1;
    var $419 = $417 + 7 | 0;
    var $420 = $psize_1 >>> ($419 >>> 0);
    var $421 = $420 & 1;
    var $422 = $421 | $418;
    var $I18_0 = $422;
    label = 113;
    break;
   case 113:
    var $I18_0;
    var $424 = 5244112 + ($I18_0 << 2) | 0;
    var $425 = $p_0 + 28 | 0;
    var $I18_0_c = $I18_0;
    HEAP32[$425 >> 2] = $I18_0_c;
    var $426 = $p_0 + 20 | 0;
    HEAP32[$426 >> 2] = 0;
    var $427 = $p_0 + 16 | 0;
    HEAP32[$427 >> 2] = 0;
    var $428 = HEAP32[5243812 >> 2];
    var $429 = 1 << $I18_0;
    var $430 = $428 & $429;
    var $431 = ($430 | 0) == 0;
    if ($431) {
      label = 114;
      break;
    } else {
      label = 115;
      break;
    }
   case 114:
    var $433 = $428 | $429;
    HEAP32[5243812 >> 2] = $433;
    HEAP32[$424 >> 2] = $395;
    var $434 = $p_0 + 24 | 0;
    var $_c = $424;
    HEAP32[$434 >> 2] = $_c;
    var $435 = $p_0 + 12 | 0;
    HEAP32[$435 >> 2] = $p_0;
    var $436 = $p_0 + 8 | 0;
    HEAP32[$436 >> 2] = $p_0;
    label = 127;
    break;
   case 115:
    var $438 = HEAP32[$424 >> 2];
    var $439 = ($I18_0 | 0) == 31;
    if ($439) {
      var $444 = 0;
      label = 117;
      break;
    } else {
      label = 116;
      break;
    }
   case 116:
    var $441 = $I18_0 >>> 1;
    var $442 = 25 - $441 | 0;
    var $444 = $442;
    label = 117;
    break;
   case 117:
    var $444;
    var $445 = $psize_1 << $444;
    var $K19_0 = $445;
    var $T_0 = $438;
    label = 118;
    break;
   case 118:
    var $T_0;
    var $K19_0;
    var $447 = $T_0 + 4 | 0;
    var $448 = HEAP32[$447 >> 2];
    var $449 = $448 & -8;
    var $450 = ($449 | 0) == ($psize_1 | 0);
    if ($450) {
      label = 123;
      break;
    } else {
      label = 119;
      break;
    }
   case 119:
    var $452 = $K19_0 >>> 31;
    var $453 = $T_0 + 16 + ($452 << 2) | 0;
    var $454 = HEAP32[$453 >> 2];
    var $455 = ($454 | 0) == 0;
    var $456 = $K19_0 << 1;
    if ($455) {
      label = 120;
      break;
    } else {
      var $K19_0 = $456;
      var $T_0 = $454;
      label = 118;
      break;
    }
   case 120:
    var $458 = $453;
    var $459 = HEAP32[5243824 >> 2];
    var $460 = $458 >>> 0 < $459 >>> 0;
    if ($460) {
      label = 122;
      break;
    } else {
      label = 121;
      break;
    }
   case 121:
    HEAP32[$453 >> 2] = $395;
    var $462 = $p_0 + 24 | 0;
    var $T_0_c227 = $T_0;
    HEAP32[$462 >> 2] = $T_0_c227;
    var $463 = $p_0 + 12 | 0;
    HEAP32[$463 >> 2] = $p_0;
    var $464 = $p_0 + 8 | 0;
    HEAP32[$464 >> 2] = $p_0;
    label = 127;
    break;
   case 122:
    _abort();
   case 123:
    var $467 = $T_0 + 8 | 0;
    var $468 = HEAP32[$467 >> 2];
    var $469 = $T_0;
    var $470 = HEAP32[5243824 >> 2];
    var $471 = $469 >>> 0 < $470 >>> 0;
    if ($471) {
      label = 126;
      break;
    } else {
      label = 124;
      break;
    }
   case 124:
    var $473 = $468;
    var $474 = $473 >>> 0 < $470 >>> 0;
    if ($474) {
      label = 126;
      break;
    } else {
      label = 125;
      break;
    }
   case 125:
    var $476 = $468 + 12 | 0;
    HEAP32[$476 >> 2] = $395;
    HEAP32[$467 >> 2] = $395;
    var $477 = $p_0 + 8 | 0;
    var $_c226 = $468;
    HEAP32[$477 >> 2] = $_c226;
    var $478 = $p_0 + 12 | 0;
    var $T_0_c = $T_0;
    HEAP32[$478 >> 2] = $T_0_c;
    var $479 = $p_0 + 24 | 0;
    HEAP32[$479 >> 2] = 0;
    label = 127;
    break;
   case 126:
    _abort();
   case 127:
    var $481 = HEAP32[5243840 >> 2];
    var $482 = $481 - 1 | 0;
    HEAP32[5243840 >> 2] = $482;
    var $483 = ($482 | 0) == 0;
    if ($483) {
      label = 128;
      break;
    } else {
      label = 130;
      break;
    }
   case 128:
    _release_unused_segments();
    label = 130;
    break;
   case 129:
    _abort();
   case 130:
    return;
  }
}
_free["X"] = 1;
function _malloc_footprint() {
  return HEAP32[5244240 >> 2];
}
function _malloc_max_footprint() {
  return HEAP32[5244244 >> 2];
}
function _release_unused_segments() {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $sp_0_in = 5244260;
    label = 3;
    break;
   case 3:
    var $sp_0_in;
    var $sp_0 = HEAP32[$sp_0_in >> 2];
    var $2 = ($sp_0 | 0) == 0;
    var $3 = $sp_0 + 8 | 0;
    if ($2) {
      label = 4;
      break;
    } else {
      var $sp_0_in = $3;
      label = 3;
      break;
    }
   case 4:
    HEAP32[5243840 >> 2] = -1;
    return;
  }
}
function _calloc($n_elements, $elem_size) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($n_elements | 0) == 0;
    if ($1) {
      var $req_0 = 0;
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $3 = Math.imul($elem_size, $n_elements);
    var $4 = $elem_size | $n_elements;
    var $5 = $4 >>> 0 > 65535;
    if ($5) {
      label = 4;
      break;
    } else {
      var $req_0 = $3;
      label = 5;
      break;
    }
   case 4:
    var $7 = Math.floor(($3 >>> 0) / ($n_elements >>> 0));
    var $8 = ($7 | 0) == ($elem_size | 0);
    var $_ = $8 ? $3 : -1;
    var $req_0 = $_;
    label = 5;
    break;
   case 5:
    var $req_0;
    var $10 = _malloc($req_0);
    var $11 = ($10 | 0) == 0;
    if ($11) {
      label = 8;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $13 = $10 - 4 | 0;
    var $14 = $13;
    var $15 = HEAP32[$14 >> 2];
    var $16 = $15 & 3;
    var $17 = ($16 | 0) == 0;
    if ($17) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    _memset($10, 0, $req_0);
    label = 8;
    break;
   case 8:
    return $10;
  }
}
Module["_calloc"] = _calloc;
function _realloc($oldmem, $bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($oldmem | 0) == 0;
    if ($1) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $3 = _malloc($bytes);
    var $_0 = $3;
    label = 5;
    break;
   case 4:
    var $5 = _internal_realloc($oldmem, $bytes);
    var $_0 = $5;
    label = 5;
    break;
   case 5:
    var $_0;
    return $_0;
  }
}
Module["_realloc"] = _realloc;
function _memalign($alignment, $bytes) {
  return _internal_memalign($alignment, $bytes);
}
function _internal_memalign($alignment, $bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $alignment >>> 0 < 9;
    if ($1) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $3 = _malloc($bytes);
    var $_0 = $3;
    label = 25;
    break;
   case 4:
    var $5 = $alignment >>> 0 < 16;
    var $_alignment = $5 ? 16 : $alignment;
    var $6 = $_alignment - 1 | 0;
    var $7 = $6 & $_alignment;
    var $8 = ($7 | 0) == 0;
    if ($8) {
      var $_1 = $_alignment;
      label = 6;
      break;
    } else {
      var $a_0 = 16;
      label = 5;
      break;
    }
   case 5:
    var $a_0;
    var $9 = $a_0 >>> 0 < $_alignment >>> 0;
    var $10 = $a_0 << 1;
    if ($9) {
      var $a_0 = $10;
      label = 5;
      break;
    } else {
      var $_1 = $a_0;
      label = 6;
      break;
    }
   case 6:
    var $_1;
    var $11 = -64 - $_1 | 0;
    var $12 = $11 >>> 0 > $bytes >>> 0;
    if ($12) {
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $14 = ___errno_location();
    HEAP32[$14 >> 2] = 12;
    var $_0 = 0;
    label = 25;
    break;
   case 8:
    var $16 = $bytes >>> 0 < 11;
    if ($16) {
      var $21 = 16;
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $18 = $bytes + 11 | 0;
    var $19 = $18 & -8;
    var $21 = $19;
    label = 10;
    break;
   case 10:
    var $21;
    var $22 = $_1 + 12 | 0;
    var $23 = $22 + $21 | 0;
    var $24 = _malloc($23);
    var $25 = ($24 | 0) == 0;
    if ($25) {
      var $_0 = 0;
      label = 25;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $27 = $24 - 8 | 0;
    var $28 = $24;
    var $29 = ($28 >>> 0) % ($_1 >>> 0);
    var $30 = ($29 | 0) == 0;
    if ($30) {
      var $leader_1 = 0;
      var $p_0_in = $27;
      label = 17;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $_sum3 = $_1 - 1 | 0;
    var $32 = $24 + $_sum3 | 0;
    var $33 = $32;
    var $34 = -$_1 | 0;
    var $35 = $33 & $34;
    var $36 = $35;
    var $37 = $36 - 8 | 0;
    var $38 = $37;
    var $39 = $27;
    var $40 = $38 - $39 | 0;
    var $41 = $40 >>> 0 > 15;
    if ($41) {
      var $45 = $37;
      label = 14;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $_sum4 = $_1 - 8 | 0;
    var $43 = $36 + $_sum4 | 0;
    var $45 = $43;
    label = 14;
    break;
   case 14:
    var $45;
    var $46 = $45;
    var $47 = $46 - $39 | 0;
    var $48 = $24 - 4 | 0;
    var $49 = $48;
    var $50 = HEAP32[$49 >> 2];
    var $51 = $50 & -8;
    var $52 = $51 - $47 | 0;
    var $53 = $50 & 3;
    var $54 = ($53 | 0) == 0;
    if ($54) {
      label = 15;
      break;
    } else {
      label = 16;
      break;
    }
   case 15:
    var $56 = $27;
    var $57 = HEAP32[$56 >> 2];
    var $58 = $57 + $47 | 0;
    var $59 = $45;
    HEAP32[$59 >> 2] = $58;
    var $60 = $45 + 4 | 0;
    var $61 = $60;
    HEAP32[$61 >> 2] = $52;
    var $leader_1 = 0;
    var $p_0_in = $45;
    label = 17;
    break;
   case 16:
    var $63 = $45 + 4 | 0;
    var $64 = $63;
    var $65 = HEAP32[$64 >> 2];
    var $66 = $65 & 1;
    var $67 = $52 | $66;
    var $68 = $67 | 2;
    HEAP32[$64 >> 2] = $68;
    var $_sum5 = $52 + 4 | 0;
    var $69 = $45 + $_sum5 | 0;
    var $70 = $69;
    var $71 = HEAP32[$70 >> 2];
    var $72 = $71 | 1;
    HEAP32[$70 >> 2] = $72;
    var $73 = HEAP32[$49 >> 2];
    var $74 = $73 & 1;
    var $75 = $47 | $74;
    var $76 = $75 | 2;
    HEAP32[$49 >> 2] = $76;
    var $_sum7 = $47 - 4 | 0;
    var $77 = $24 + $_sum7 | 0;
    var $78 = $77;
    var $79 = HEAP32[$78 >> 2];
    var $80 = $79 | 1;
    HEAP32[$78 >> 2] = $80;
    var $leader_1 = $24;
    var $p_0_in = $45;
    label = 17;
    break;
   case 17:
    var $p_0_in;
    var $leader_1;
    var $82 = $p_0_in + 4 | 0;
    var $83 = $82;
    var $84 = HEAP32[$83 >> 2];
    var $85 = $84 & 3;
    var $86 = ($85 | 0) == 0;
    if ($86) {
      var $trailer_0 = 0;
      label = 20;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $88 = $84 & -8;
    var $89 = $21 + 16 | 0;
    var $90 = $88 >>> 0 > $89 >>> 0;
    if ($90) {
      label = 19;
      break;
    } else {
      var $trailer_0 = 0;
      label = 20;
      break;
    }
   case 19:
    var $92 = $88 - $21 | 0;
    var $93 = $84 & 1;
    var $94 = $21 | $93;
    var $95 = $94 | 2;
    HEAP32[$83 >> 2] = $95;
    var $_sum1 = $21 | 4;
    var $96 = $p_0_in + $_sum1 | 0;
    var $97 = $96;
    var $98 = $92 | 3;
    HEAP32[$97 >> 2] = $98;
    var $_sum2 = $88 | 4;
    var $99 = $p_0_in + $_sum2 | 0;
    var $100 = $99;
    var $101 = HEAP32[$100 >> 2];
    var $102 = $101 | 1;
    HEAP32[$100 >> 2] = $102;
    var $_sum = $21 + 8 | 0;
    var $103 = $p_0_in + $_sum | 0;
    var $trailer_0 = $103;
    label = 20;
    break;
   case 20:
    var $trailer_0;
    var $105 = ($leader_1 | 0) == 0;
    if ($105) {
      label = 22;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    _free($leader_1);
    label = 22;
    break;
   case 22:
    var $108 = ($trailer_0 | 0) == 0;
    if ($108) {
      label = 24;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    _free($trailer_0);
    label = 24;
    break;
   case 24:
    var $111 = $p_0_in + 8 | 0;
    var $_0 = $111;
    label = 25;
    break;
   case 25:
    var $_0;
    return $_0;
  }
}
_internal_memalign["X"] = 1;
function _independent_calloc($n_elements, $elem_size, $chunks) {
  var __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 4 | 0;
  var $sz = __stackBase__;
  HEAP32[$sz >> 2] = $elem_size;
  var $1 = _ialloc($n_elements, $sz, 3, $chunks);
  STACKTOP = __stackBase__;
  return $1;
}
function _ialloc($n_elements, $sizes, $opts, $chunks) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = ($chunks | 0) == 0;
    var $6 = ($n_elements | 0) == 0;
    if ($5) {
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    if ($6) {
      var $_0 = $chunks;
      label = 30;
      break;
    } else {
      var $marray_0 = $chunks;
      var $array_size_0 = 0;
      label = 10;
      break;
    }
   case 6:
    if ($6) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    var $10 = _malloc(0);
    var $11 = $10;
    var $_0 = $11;
    label = 30;
    break;
   case 8:
    var $13 = $n_elements << 2;
    var $14 = $13 >>> 0 < 11;
    if ($14) {
      var $marray_0 = 0;
      var $array_size_0 = 16;
      label = 10;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $16 = $13 + 11 | 0;
    var $17 = $16 & -8;
    var $marray_0 = 0;
    var $array_size_0 = $17;
    label = 10;
    break;
   case 10:
    var $array_size_0;
    var $marray_0;
    var $19 = $opts & 1;
    var $20 = ($19 | 0) == 0;
    if ($20) {
      label = 11;
      break;
    } else {
      label = 12;
      break;
    }
   case 11:
    var $21 = ($n_elements | 0) == 0;
    if ($21) {
      var $element_size_0 = 0;
      var $contents_size_1 = 0;
      label = 18;
      break;
    } else {
      var $contents_size_07 = 0;
      var $i_08 = 0;
      label = 15;
      break;
    }
   case 12:
    var $23 = HEAP32[$sizes >> 2];
    var $24 = $23 >>> 0 < 11;
    if ($24) {
      var $29 = 16;
      label = 14;
      break;
    } else {
      label = 13;
      break;
    }
   case 13:
    var $26 = $23 + 11 | 0;
    var $27 = $26 & -8;
    var $29 = $27;
    label = 14;
    break;
   case 14:
    var $29;
    var $30 = Math.imul($29, $n_elements);
    var $element_size_0 = $29;
    var $contents_size_1 = $30;
    label = 18;
    break;
   case 15:
    var $i_08;
    var $contents_size_07;
    var $31 = $sizes + ($i_08 << 2) | 0;
    var $32 = HEAP32[$31 >> 2];
    var $33 = $32 >>> 0 < 11;
    if ($33) {
      var $38 = 16;
      label = 17;
      break;
    } else {
      label = 16;
      break;
    }
   case 16:
    var $35 = $32 + 11 | 0;
    var $36 = $35 & -8;
    var $38 = $36;
    label = 17;
    break;
   case 17:
    var $38;
    var $39 = $38 + $contents_size_07 | 0;
    var $40 = $i_08 + 1 | 0;
    var $41 = ($40 | 0) == ($n_elements | 0);
    if ($41) {
      var $element_size_0 = 0;
      var $contents_size_1 = $39;
      label = 18;
      break;
    } else {
      var $contents_size_07 = $39;
      var $i_08 = $40;
      label = 15;
      break;
    }
   case 18:
    var $contents_size_1;
    var $element_size_0;
    var $42 = $array_size_0 - 4 | 0;
    var $43 = $42 + $contents_size_1 | 0;
    var $44 = _malloc($43);
    var $45 = ($44 | 0) == 0;
    if ($45) {
      var $_0 = 0;
      label = 30;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $47 = $44 - 8 | 0;
    var $48 = $44 - 4 | 0;
    var $49 = $48;
    var $50 = HEAP32[$49 >> 2];
    var $51 = $50 & -8;
    var $52 = $opts & 2;
    var $53 = ($52 | 0) == 0;
    if ($53) {
      label = 21;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    var $55 = -4 - $array_size_0 | 0;
    var $56 = $55 + $51 | 0;
    _memset($44, 0, $56);
    label = 21;
    break;
   case 21:
    var $58 = ($marray_0 | 0) == 0;
    if ($58) {
      label = 22;
      break;
    } else {
      var $marray_1 = $marray_0;
      var $remainder_size_0 = $51;
      label = 23;
      break;
    }
   case 22:
    var $60 = $51 - $contents_size_1 | 0;
    var $61 = $44 + $contents_size_1 | 0;
    var $62 = $61;
    var $63 = $60 | 3;
    var $_sum2 = $contents_size_1 - 4 | 0;
    var $64 = $44 + $_sum2 | 0;
    var $65 = $64;
    HEAP32[$65 >> 2] = $63;
    var $marray_1 = $62;
    var $remainder_size_0 = $contents_size_1;
    label = 23;
    break;
   case 23:
    var $remainder_size_0;
    var $marray_1;
    HEAP32[$marray_1 >> 2] = $44;
    var $67 = $n_elements - 1 | 0;
    var $68 = ($67 | 0) == 0;
    if ($68) {
      var $p_0_in_lcssa = $47;
      var $remainder_size_1_lcssa = $remainder_size_0;
      label = 29;
      break;
    } else {
      label = 24;
      break;
    }
   case 24:
    var $69 = ($element_size_0 | 0) == 0;
    var $p_0_in3 = $47;
    var $remainder_size_14 = $remainder_size_0;
    var $i_15 = 0;
    label = 25;
    break;
   case 25:
    var $i_15;
    var $remainder_size_14;
    var $p_0_in3;
    if ($69) {
      label = 26;
      break;
    } else {
      var $size_0 = $element_size_0;
      label = 28;
      break;
    }
   case 26:
    var $72 = $sizes + ($i_15 << 2) | 0;
    var $73 = HEAP32[$72 >> 2];
    var $74 = $73 >>> 0 < 11;
    if ($74) {
      var $size_0 = 16;
      label = 28;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $76 = $73 + 11 | 0;
    var $77 = $76 & -8;
    var $size_0 = $77;
    label = 28;
    break;
   case 28:
    var $size_0;
    var $79 = $remainder_size_14 - $size_0 | 0;
    var $80 = $size_0 | 3;
    var $81 = $p_0_in3 + 4 | 0;
    var $82 = $81;
    HEAP32[$82 >> 2] = $80;
    var $83 = $p_0_in3 + $size_0 | 0;
    var $84 = $i_15 + 1 | 0;
    var $_sum = $size_0 + 8 | 0;
    var $85 = $p_0_in3 + $_sum | 0;
    var $86 = $marray_1 + ($84 << 2) | 0;
    HEAP32[$86 >> 2] = $85;
    var $87 = ($84 | 0) == ($67 | 0);
    if ($87) {
      var $p_0_in_lcssa = $83;
      var $remainder_size_1_lcssa = $79;
      label = 29;
      break;
    } else {
      var $p_0_in3 = $83;
      var $remainder_size_14 = $79;
      var $i_15 = $84;
      label = 25;
      break;
    }
   case 29:
    var $remainder_size_1_lcssa;
    var $p_0_in_lcssa;
    var $88 = $remainder_size_1_lcssa | 3;
    var $89 = $p_0_in_lcssa + 4 | 0;
    var $90 = $89;
    HEAP32[$90 >> 2] = $88;
    var $_0 = $marray_1;
    label = 30;
    break;
   case 30:
    var $_0;
    return $_0;
  }
}
_ialloc["X"] = 1;
function _independent_comalloc($n_elements, $sizes, $chunks) {
  return _ialloc($n_elements, $sizes, 0, $chunks);
}
function _valloc($bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = HEAP32[5242916 >> 2];
    var $6 = _memalign($5, $bytes);
    return $6;
  }
}
function _pvalloc($bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = HEAP32[5242916 >> 2];
    var $6 = $bytes - 1 | 0;
    var $7 = $6 + $5 | 0;
    var $8 = -$5 | 0;
    var $9 = $7 & $8;
    var $10 = _memalign($5, $9);
    return $10;
  }
}
function _malloc_trim($pad) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = _sys_trim($pad);
    return $5;
  }
}
function _mallinfo($agg_result) {
  _internal_mallinfo($agg_result);
  return;
}
function _internal_mallinfo($agg_result) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = HEAP32[5243832 >> 2];
    var $6 = ($5 | 0) == 0;
    if ($6) {
      var $nm_sroa_8_0 = 0;
      var $nm_sroa_0_0 = 0;
      var $nm_sroa_1_0 = 0;
      var $nm_sroa_3_0 = 0;
      var $nm_sroa_4_0 = 0;
      var $nm_sroa_7_0 = 0;
      var $nm_sroa_6_0 = 0;
      label = 17;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $8 = HEAP32[5243820 >> 2];
    var $9 = $8 + 40 | 0;
    var $10 = HEAP32[5243832 >> 2];
    var $nfree_08 = 1;
    var $mfree_09 = $9;
    var $sum_010 = $9;
    var $s_011 = 5244252;
    label = 6;
    break;
   case 6:
    var $s_011;
    var $sum_010;
    var $mfree_09;
    var $nfree_08;
    var $12 = $s_011 | 0;
    var $13 = HEAP32[$12 >> 2];
    var $14 = $13 + 8 | 0;
    var $15 = $14;
    var $16 = $15 & 7;
    var $17 = ($16 | 0) == 0;
    if ($17) {
      var $22 = 0;
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $19 = -$15 | 0;
    var $20 = $19 & 7;
    var $22 = $20;
    label = 8;
    break;
   case 8:
    var $22;
    var $23 = $13 + $22 | 0;
    var $24 = HEAP32[$12 >> 2];
    var $25 = $23 >>> 0 < $24 >>> 0;
    if ($25) {
      var $nfree_1_lcssa = $nfree_08;
      var $mfree_1_lcssa = $mfree_09;
      var $sum_1_lcssa = $sum_010;
      label = 15;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $26 = $s_011 + 4 | 0;
    var $27 = HEAP32[$26 >> 2];
    var $nfree_12 = $nfree_08;
    var $mfree_13 = $mfree_09;
    var $sum_14 = $sum_010;
    var $q_0_in5 = $23;
    var $29 = $24;
    label = 10;
    break;
   case 10:
    var $29;
    var $q_0_in5;
    var $sum_14;
    var $mfree_13;
    var $nfree_12;
    var $q_0 = $q_0_in5;
    var $30 = $29 + $27 | 0;
    var $31 = $q_0_in5 >>> 0 >= $30 >>> 0;
    var $32 = ($q_0 | 0) == ($10 | 0);
    var $or_cond = $31 | $32;
    if ($or_cond) {
      var $nfree_1_lcssa = $nfree_12;
      var $mfree_1_lcssa = $mfree_13;
      var $sum_1_lcssa = $sum_14;
      label = 15;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $34 = $q_0_in5 + 4 | 0;
    var $35 = $34;
    var $36 = HEAP32[$35 >> 2];
    var $37 = ($36 | 0) == 7;
    if ($37) {
      var $nfree_1_lcssa = $nfree_12;
      var $mfree_1_lcssa = $mfree_13;
      var $sum_1_lcssa = $sum_14;
      label = 15;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $39 = $36 & -8;
    var $40 = $39 + $sum_14 | 0;
    var $41 = $36 & 3;
    var $42 = ($41 | 0) == 1;
    if ($42) {
      label = 13;
      break;
    } else {
      var $mfree_2 = $mfree_13;
      var $nfree_2 = $nfree_12;
      label = 14;
      break;
    }
   case 13:
    var $44 = $39 + $mfree_13 | 0;
    var $45 = $nfree_12 + 1 | 0;
    var $mfree_2 = $44;
    var $nfree_2 = $45;
    label = 14;
    break;
   case 14:
    var $nfree_2;
    var $mfree_2;
    var $47 = HEAP32[$35 >> 2];
    var $48 = $47 & -8;
    var $49 = $q_0_in5 + $48 | 0;
    var $50 = HEAP32[$12 >> 2];
    var $51 = $49 >>> 0 < $50 >>> 0;
    if ($51) {
      var $nfree_1_lcssa = $nfree_2;
      var $mfree_1_lcssa = $mfree_2;
      var $sum_1_lcssa = $40;
      label = 15;
      break;
    } else {
      var $nfree_12 = $nfree_2;
      var $mfree_13 = $mfree_2;
      var $sum_14 = $40;
      var $q_0_in5 = $49;
      var $29 = $50;
      label = 10;
      break;
    }
   case 15:
    var $sum_1_lcssa;
    var $mfree_1_lcssa;
    var $nfree_1_lcssa;
    var $52 = $s_011 + 8 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = ($53 | 0) == 0;
    if ($54) {
      label = 16;
      break;
    } else {
      var $nfree_08 = $nfree_1_lcssa;
      var $mfree_09 = $mfree_1_lcssa;
      var $sum_010 = $sum_1_lcssa;
      var $s_011 = $53;
      label = 6;
      break;
    }
   case 16:
    var $56 = HEAP32[5244240 >> 2];
    var $57 = $56 - $sum_1_lcssa | 0;
    var $58 = HEAP32[5244244 >> 2];
    var $59 = $56 - $mfree_1_lcssa | 0;
    var $60 = HEAP32[5243820 >> 2];
    var $nm_sroa_8_0 = $60;
    var $nm_sroa_0_0 = $sum_1_lcssa;
    var $nm_sroa_1_0 = $nfree_1_lcssa;
    var $nm_sroa_3_0 = $57;
    var $nm_sroa_4_0 = $58;
    var $nm_sroa_7_0 = $mfree_1_lcssa;
    var $nm_sroa_6_0 = $59;
    label = 17;
    break;
   case 17:
    var $nm_sroa_6_0;
    var $nm_sroa_7_0;
    var $nm_sroa_4_0;
    var $nm_sroa_3_0;
    var $nm_sroa_1_0;
    var $nm_sroa_0_0;
    var $nm_sroa_8_0;
    var $nm_sroa_0_0__idx = $agg_result | 0;
    HEAP32[$nm_sroa_0_0__idx >> 2] = $nm_sroa_0_0;
    var $nm_sroa_1_4__idx24 = $agg_result + 4 | 0;
    HEAP32[$nm_sroa_1_4__idx24 >> 2] = $nm_sroa_1_0;
    var $nm_sroa_2_8__idx = $agg_result + 8 | 0;
    var $62 = $nm_sroa_2_8__idx;
    var $$etemp$0$0 = 0;
    var $$etemp$0$1 = 0;
    var $st$15$0 = $62 | 0;
    HEAP32[$st$15$0 >> 2] = $$etemp$0$0;
    var $st$15$1 = $62 + 4 | 0;
    HEAP32[$st$15$1 >> 2] = $$etemp$0$1;
    var $nm_sroa_3_16__idx26 = $agg_result + 16 | 0;
    HEAP32[$nm_sroa_3_16__idx26 >> 2] = $nm_sroa_3_0;
    var $nm_sroa_4_20__idx27 = $agg_result + 20 | 0;
    HEAP32[$nm_sroa_4_20__idx27 >> 2] = $nm_sroa_4_0;
    var $nm_sroa_5_24__idx28 = $agg_result + 24 | 0;
    HEAP32[$nm_sroa_5_24__idx28 >> 2] = 0;
    var $nm_sroa_6_28__idx29 = $agg_result + 28 | 0;
    HEAP32[$nm_sroa_6_28__idx29 >> 2] = $nm_sroa_6_0;
    var $nm_sroa_7_32__idx30 = $agg_result + 32 | 0;
    HEAP32[$nm_sroa_7_32__idx30 >> 2] = $nm_sroa_7_0;
    var $nm_sroa_8_36__idx31 = $agg_result + 36 | 0;
    HEAP32[$nm_sroa_8_36__idx31 >> 2] = $nm_sroa_8_0;
    return;
  }
}
_internal_mallinfo["X"] = 1;
function _malloc_stats() {
  _internal_malloc_stats();
  return;
}
function _internal_malloc_stats() {
  var label = 0;
  var __stackBase__ = STACKTOP;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    var $5 = HEAP32[5243832 >> 2];
    var $6 = ($5 | 0) == 0;
    if ($6) {
      var $used_3 = 0;
      var $fp_0 = 0;
      var $maxfp_0 = 0;
      label = 16;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $8 = HEAP32[5244244 >> 2];
    var $9 = HEAP32[5244240 >> 2];
    var $10 = HEAP32[5243820 >> 2];
    var $_neg2 = $9 - 40 | 0;
    var $11 = $_neg2 - $10 | 0;
    var $12 = HEAP32[5243832 >> 2];
    var $used_05 = $11;
    var $s_06 = 5244252;
    label = 6;
    break;
   case 6:
    var $s_06;
    var $used_05;
    var $14 = $s_06 | 0;
    var $15 = HEAP32[$14 >> 2];
    var $16 = $15 + 8 | 0;
    var $17 = $16;
    var $18 = $17 & 7;
    var $19 = ($18 | 0) == 0;
    if ($19) {
      var $24 = 0;
      label = 8;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $21 = -$17 | 0;
    var $22 = $21 & 7;
    var $24 = $22;
    label = 8;
    break;
   case 8:
    var $24;
    var $25 = $15 + $24 | 0;
    var $26 = HEAP32[$14 >> 2];
    var $27 = $25 >>> 0 < $26 >>> 0;
    if ($27) {
      var $used_1_lcssa = $used_05;
      label = 15;
      break;
    } else {
      label = 9;
      break;
    }
   case 9:
    var $28 = $s_06 + 4 | 0;
    var $29 = HEAP32[$28 >> 2];
    var $used_13 = $used_05;
    var $q_0_in4 = $25;
    var $31 = $26;
    label = 10;
    break;
   case 10:
    var $31;
    var $q_0_in4;
    var $used_13;
    var $q_0 = $q_0_in4;
    var $32 = $31 + $29 | 0;
    var $33 = $q_0_in4 >>> 0 >= $32 >>> 0;
    var $34 = ($q_0 | 0) == ($12 | 0);
    var $or_cond = $33 | $34;
    if ($or_cond) {
      var $used_1_lcssa = $used_13;
      label = 15;
      break;
    } else {
      label = 11;
      break;
    }
   case 11:
    var $36 = $q_0_in4 + 4 | 0;
    var $37 = $36;
    var $38 = HEAP32[$37 >> 2];
    var $39 = ($38 | 0) == 7;
    if ($39) {
      var $used_1_lcssa = $used_13;
      label = 15;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $41 = $38 & 3;
    var $42 = ($41 | 0) == 1;
    if ($42) {
      label = 13;
      break;
    } else {
      var $used_2 = $used_13;
      label = 14;
      break;
    }
   case 13:
    var $44 = $38 & -8;
    var $45 = $used_13 - $44 | 0;
    var $used_2 = $45;
    label = 14;
    break;
   case 14:
    var $used_2;
    var $47 = HEAP32[$37 >> 2];
    var $48 = $47 & -8;
    var $49 = $q_0_in4 + $48 | 0;
    var $50 = HEAP32[$14 >> 2];
    var $51 = $49 >>> 0 < $50 >>> 0;
    if ($51) {
      var $used_1_lcssa = $used_2;
      label = 15;
      break;
    } else {
      var $used_13 = $used_2;
      var $q_0_in4 = $49;
      var $31 = $50;
      label = 10;
      break;
    }
   case 15:
    var $used_1_lcssa;
    var $52 = $s_06 + 8 | 0;
    var $53 = HEAP32[$52 >> 2];
    var $54 = ($53 | 0) == 0;
    if ($54) {
      var $used_3 = $used_1_lcssa;
      var $fp_0 = $9;
      var $maxfp_0 = $8;
      label = 16;
      break;
    } else {
      var $used_05 = $used_1_lcssa;
      var $s_06 = $53;
      label = 6;
      break;
    }
   case 16:
    var $maxfp_0;
    var $fp_0;
    var $used_3;
    var $55 = HEAP32[_stderr >> 2];
    var $56 = _fprintf($55, 5243276, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = $maxfp_0, tempInt));
    var $57 = HEAP32[_stderr >> 2];
    var $58 = _fprintf($57, 5243624, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = $fp_0, tempInt));
    var $59 = HEAP32[_stderr >> 2];
    var $60 = _fprintf($59, 5243232, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = $used_3, tempInt));
    STACKTOP = __stackBase__;
    return;
  }
}
_internal_malloc_stats["X"] = 1;
function _mallopt($param_number, $value) {
  return _change_mparam($param_number, $value);
}
function _change_mparam($param_number, $value) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    _init_mparams();
    label = 4;
    break;
   case 4:
    if (($param_number | 0) == -1) {
      label = 5;
      break;
    } else if (($param_number | 0) == -2) {
      label = 6;
      break;
    } else if (($param_number | 0) == -3) {
      label = 9;
      break;
    } else {
      var $_0 = 0;
      label = 10;
      break;
    }
   case 5:
    HEAP32[5242928 >> 2] = $value;
    var $_0 = 1;
    label = 10;
    break;
   case 6:
    var $7 = HEAP32[5242916 >> 2];
    var $8 = $7 >>> 0 > $value >>> 0;
    if ($8) {
      var $_0 = 0;
      label = 10;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $10 = $value - 1 | 0;
    var $11 = $10 & $value;
    var $12 = ($11 | 0) == 0;
    if ($12) {
      label = 8;
      break;
    } else {
      var $_0 = 0;
      label = 10;
      break;
    }
   case 8:
    HEAP32[5242920 >> 2] = $value;
    var $_0 = 1;
    label = 10;
    break;
   case 9:
    HEAP32[5242924 >> 2] = $value;
    var $_0 = 1;
    label = 10;
    break;
   case 10:
    var $_0;
    return $_0;
  }
}
function _internal_realloc($oldmem, $bytes) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $bytes >>> 0 > 4294967231;
    if ($1) {
      label = 3;
      break;
    } else {
      label = 4;
      break;
    }
   case 3:
    var $3 = ___errno_location();
    HEAP32[$3 >> 2] = 12;
    var $_0 = 0;
    label = 24;
    break;
   case 4:
    var $5 = $oldmem - 8 | 0;
    var $6 = $5;
    var $7 = $oldmem - 4 | 0;
    var $8 = $7;
    var $9 = HEAP32[$8 >> 2];
    var $10 = $9 & -8;
    var $_sum = $10 - 8 | 0;
    var $11 = $oldmem + $_sum | 0;
    var $12 = $11;
    var $13 = HEAP32[5243824 >> 2];
    var $14 = $5 >>> 0 < $13 >>> 0;
    if ($14) {
      label = 17;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $16 = $9 & 3;
    var $17 = ($16 | 0) != 1;
    var $18 = ($_sum | 0) > -8;
    var $or_cond = $17 & $18;
    if ($or_cond) {
      label = 6;
      break;
    } else {
      label = 17;
      break;
    }
   case 6:
    var $_sum8 = $10 - 4 | 0;
    var $20 = $oldmem + $_sum8 | 0;
    var $21 = $20;
    var $22 = HEAP32[$21 >> 2];
    var $23 = $22 & 1;
    var $24 = ($23 | 0) == 0;
    if ($24) {
      label = 17;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $26 = $bytes >>> 0 < 11;
    if ($26) {
      var $31 = 16;
      label = 9;
      break;
    } else {
      label = 8;
      break;
    }
   case 8:
    var $28 = $bytes + 11 | 0;
    var $29 = $28 & -8;
    var $31 = $29;
    label = 9;
    break;
   case 9:
    var $31;
    var $32 = HEAP32[$8 >> 2];
    var $33 = $32 & 3;
    var $34 = ($33 | 0) == 0;
    if ($34) {
      label = 10;
      break;
    } else {
      label = 11;
      break;
    }
   case 10:
    var $36 = _mmap_resize($6, $31);
    var $newp_0 = $36;
    var $extra_0 = 0;
    label = 18;
    break;
   case 11:
    var $38 = $10 >>> 0 < $31 >>> 0;
    if ($38) {
      label = 14;
      break;
    } else {
      label = 12;
      break;
    }
   case 12:
    var $40 = $10 - $31 | 0;
    var $41 = $40 >>> 0 > 15;
    if ($41) {
      label = 13;
      break;
    } else {
      var $newp_0 = $6;
      var $extra_0 = 0;
      label = 18;
      break;
    }
   case 13:
    var $43 = $32 & 1;
    var $44 = $31 | $43;
    var $45 = $44 | 2;
    HEAP32[$8 >> 2] = $45;
    var $_sum4 = $31 - 4 | 0;
    var $46 = $oldmem + $_sum4 | 0;
    var $47 = $46;
    var $48 = $40 | 3;
    HEAP32[$47 >> 2] = $48;
    var $49 = HEAP32[$21 >> 2];
    var $50 = $49 | 1;
    HEAP32[$21 >> 2] = $50;
    var $51 = $oldmem + $31 | 0;
    var $newp_0 = $6;
    var $extra_0 = $51;
    label = 18;
    break;
   case 14:
    var $53 = HEAP32[5243832 >> 2];
    var $54 = ($12 | 0) == ($53 | 0);
    if ($54) {
      label = 15;
      break;
    } else {
      label = 22;
      break;
    }
   case 15:
    var $56 = HEAP32[5243820 >> 2];
    var $57 = $56 + $10 | 0;
    var $58 = $57 >>> 0 > $31 >>> 0;
    if ($58) {
      label = 16;
      break;
    } else {
      label = 22;
      break;
    }
   case 16:
    var $60 = $57 - $31 | 0;
    var $_sum1 = $31 - 8 | 0;
    var $61 = $oldmem + $_sum1 | 0;
    var $62 = $61;
    var $63 = $32 & 1;
    var $64 = $31 | $63;
    var $65 = $64 | 2;
    HEAP32[$8 >> 2] = $65;
    var $_sum2 = $31 - 4 | 0;
    var $66 = $oldmem + $_sum2 | 0;
    var $67 = $66;
    var $68 = $60 | 1;
    HEAP32[$67 >> 2] = $68;
    HEAP32[5243832 >> 2] = $62;
    HEAP32[5243820 >> 2] = $60;
    var $newp_0 = $6;
    var $extra_0 = 0;
    label = 18;
    break;
   case 17:
    _abort();
   case 18:
    var $extra_0;
    var $newp_0;
    var $70 = ($newp_0 | 0) == 0;
    if ($70) {
      label = 22;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $72 = ($extra_0 | 0) == 0;
    if ($72) {
      label = 21;
      break;
    } else {
      label = 20;
      break;
    }
   case 20:
    _free($extra_0);
    label = 21;
    break;
   case 21:
    var $75 = $newp_0 + 8 | 0;
    var $76 = $75;
    var $_0 = $76;
    label = 24;
    break;
   case 22:
    var $77 = _malloc($bytes);
    var $78 = ($77 | 0) == 0;
    if ($78) {
      var $_0 = 0;
      label = 24;
      break;
    } else {
      label = 23;
      break;
    }
   case 23:
    var $80 = HEAP32[$8 >> 2];
    var $81 = $80 & 3;
    var $82 = ($81 | 0) == 0;
    var $83 = $82 ? 8 : 4;
    var $84 = $10 - $83 | 0;
    var $85 = $84 >>> 0 < $bytes >>> 0;
    var $86 = $85 ? $84 : $bytes;
    _memcpy($77, $oldmem, $86);
    _free($oldmem);
    var $_0 = $77;
    label = 24;
    break;
   case 24:
    var $_0;
    return $_0;
  }
}
_internal_realloc["X"] = 1;
function _init_mparams() {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5242912 >> 2];
    var $2 = ($1 | 0) == 0;
    if ($2) {
      label = 3;
      break;
    } else {
      label = 6;
      break;
    }
   case 3:
    var $4 = _sysconf(8);
    var $5 = $4 - 1 | 0;
    var $6 = $5 & $4;
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    _abort();
   case 5:
    HEAP32[5242920 >> 2] = $4;
    HEAP32[5242916 >> 2] = $4;
    HEAP32[5242924 >> 2] = -1;
    HEAP32[5242928 >> 2] = 2097152;
    HEAP32[5242932 >> 2] = 0;
    HEAP32[5244248 >> 2] = 0;
    var $10 = _time(0);
    var $11 = $10 & -16;
    var $12 = $11 ^ 1431655768;
    HEAP32[5242912 >> 2] = $12;
    label = 6;
    break;
   case 6:
    return;
  }
}
function _malloc_usable_size($mem) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($mem | 0) == 0;
    if ($1) {
      var $_0 = 0;
      label = 5;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $3 = $mem - 4 | 0;
    var $4 = $3;
    var $5 = HEAP32[$4 >> 2];
    var $6 = $5 & 3;
    var $7 = ($6 | 0) == 1;
    if ($7) {
      var $_0 = 0;
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $5 & -8;
    var $10 = ($6 | 0) == 0;
    var $11 = $10 ? 8 : 4;
    var $12 = $9 - $11 | 0;
    var $_0 = $12;
    label = 5;
    break;
   case 5:
    var $_0;
    return $_0;
  }
}
function _mmap_resize($oldp, $nb) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $oldp + 4 | 0;
    var $2 = HEAP32[$1 >> 2];
    var $3 = $2 & -8;
    var $4 = $nb >>> 0 < 256;
    if ($4) {
      var $_0 = 0;
      label = 6;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $6 = $nb + 4 | 0;
    var $7 = $3 >>> 0 < $6 >>> 0;
    if ($7) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $9 = $3 - $nb | 0;
    var $10 = HEAP32[5242920 >> 2];
    var $11 = $10 << 1;
    var $12 = $9 >>> 0 > $11 >>> 0;
    if ($12) {
      label = 5;
      break;
    } else {
      var $_0 = $oldp;
      label = 6;
      break;
    }
   case 5:
    var $_0 = 0;
    label = 6;
    break;
   case 6:
    var $_0;
    return $_0;
  }
}
function _segment_holding($addr) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $sp_0 = 5244252;
    label = 3;
    break;
   case 3:
    var $sp_0;
    var $2 = $sp_0 | 0;
    var $3 = HEAP32[$2 >> 2];
    var $4 = $3 >>> 0 > $addr >>> 0;
    if ($4) {
      label = 5;
      break;
    } else {
      label = 4;
      break;
    }
   case 4:
    var $6 = $sp_0 + 4 | 0;
    var $7 = HEAP32[$6 >> 2];
    var $8 = $3 + $7 | 0;
    var $9 = $8 >>> 0 > $addr >>> 0;
    if ($9) {
      var $_0 = $sp_0;
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $11 = $sp_0 + 8 | 0;
    var $12 = HEAP32[$11 >> 2];
    var $13 = ($12 | 0) == 0;
    if ($13) {
      var $_0 = 0;
      label = 6;
      break;
    } else {
      var $sp_0 = $12;
      label = 3;
      break;
    }
   case 6:
    var $_0;
    return $_0;
  }
}
function _init_top($p, $psize) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $p;
    var $2 = $p + 8 | 0;
    var $3 = $2;
    var $4 = $3 & 7;
    var $5 = ($4 | 0) == 0;
    if ($5) {
      var $10 = 0;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $7 = -$3 | 0;
    var $8 = $7 & 7;
    var $10 = $8;
    label = 4;
    break;
   case 4:
    var $10;
    var $11 = $1 + $10 | 0;
    var $12 = $11;
    var $13 = $psize - $10 | 0;
    HEAP32[5243832 >> 2] = $12;
    HEAP32[5243820 >> 2] = $13;
    var $14 = $13 | 1;
    var $_sum = $10 + 4 | 0;
    var $15 = $1 + $_sum | 0;
    var $16 = $15;
    HEAP32[$16 >> 2] = $14;
    var $_sum2 = $psize + 4 | 0;
    var $17 = $1 + $_sum2 | 0;
    var $18 = $17;
    HEAP32[$18 >> 2] = 40;
    var $19 = HEAP32[5242928 >> 2];
    HEAP32[5243836 >> 2] = $19;
    return;
  }
}
function _init_bins() {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $i_02 = 0;
    label = 3;
    break;
   case 3:
    var $i_02;
    var $2 = $i_02 << 1;
    var $3 = 5243848 + ($2 << 2) | 0;
    var $4 = $3;
    var $_sum = $2 + 3 | 0;
    var $5 = 5243848 + ($_sum << 2) | 0;
    HEAP32[$5 >> 2] = $4;
    var $_sum1 = $2 + 2 | 0;
    var $6 = 5243848 + ($_sum1 << 2) | 0;
    HEAP32[$6 >> 2] = $4;
    var $7 = $i_02 + 1 | 0;
    var $exitcond = ($7 | 0) == 32;
    if ($exitcond) {
      label = 4;
      break;
    } else {
      var $i_02 = $7;
      label = 3;
      break;
    }
   case 4:
    return;
  }
}
function _mmap_alloc() {
}
function _prepend_alloc($newbase, $oldbase, $nb) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = $newbase + 8 | 0;
    var $2 = $1;
    var $3 = $2 & 7;
    var $4 = ($3 | 0) == 0;
    if ($4) {
      var $9 = 0;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $6 = -$2 | 0;
    var $7 = $6 & 7;
    var $9 = $7;
    label = 4;
    break;
   case 4:
    var $9;
    var $10 = $newbase + $9 | 0;
    var $11 = $oldbase + 8 | 0;
    var $12 = $11;
    var $13 = $12 & 7;
    var $14 = ($13 | 0) == 0;
    if ($14) {
      var $19 = 0;
      label = 6;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    var $16 = -$12 | 0;
    var $17 = $16 & 7;
    var $19 = $17;
    label = 6;
    break;
   case 6:
    var $19;
    var $20 = $oldbase + $19 | 0;
    var $21 = $20;
    var $22 = $20;
    var $23 = $10;
    var $24 = $22 - $23 | 0;
    var $_sum = $9 + $nb | 0;
    var $25 = $newbase + $_sum | 0;
    var $26 = $25;
    var $27 = $24 - $nb | 0;
    var $28 = $nb | 3;
    var $_sum1 = $9 + 4 | 0;
    var $29 = $newbase + $_sum1 | 0;
    var $30 = $29;
    HEAP32[$30 >> 2] = $28;
    var $31 = HEAP32[5243832 >> 2];
    var $32 = ($21 | 0) == ($31 | 0);
    if ($32) {
      label = 7;
      break;
    } else {
      label = 8;
      break;
    }
   case 7:
    var $34 = HEAP32[5243820 >> 2];
    var $35 = $34 + $27 | 0;
    HEAP32[5243820 >> 2] = $35;
    HEAP32[5243832 >> 2] = $26;
    var $36 = $35 | 1;
    var $_sum42 = $_sum + 4 | 0;
    var $37 = $newbase + $_sum42 | 0;
    var $38 = $37;
    HEAP32[$38 >> 2] = $36;
    label = 76;
    break;
   case 8:
    var $40 = HEAP32[5243828 >> 2];
    var $41 = ($21 | 0) == ($40 | 0);
    if ($41) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    var $43 = HEAP32[5243816 >> 2];
    var $44 = $43 + $27 | 0;
    HEAP32[5243816 >> 2] = $44;
    HEAP32[5243828 >> 2] = $26;
    var $45 = $44 | 1;
    var $_sum40 = $_sum + 4 | 0;
    var $46 = $newbase + $_sum40 | 0;
    var $47 = $46;
    HEAP32[$47 >> 2] = $45;
    var $_sum41 = $44 + $_sum | 0;
    var $48 = $newbase + $_sum41 | 0;
    var $49 = $48;
    HEAP32[$49 >> 2] = $44;
    label = 76;
    break;
   case 10:
    var $_sum2 = $19 + 4 | 0;
    var $51 = $oldbase + $_sum2 | 0;
    var $52 = $51;
    var $53 = HEAP32[$52 >> 2];
    var $54 = $53 & 3;
    var $55 = ($54 | 0) == 1;
    if ($55) {
      label = 11;
      break;
    } else {
      var $oldfirst_0 = $21;
      var $qsize_0 = $27;
      label = 53;
      break;
    }
   case 11:
    var $57 = $53 & -8;
    var $58 = $53 >>> 3;
    var $59 = $53 >>> 0 < 256;
    if ($59) {
      label = 12;
      break;
    } else {
      label = 20;
      break;
    }
   case 12:
    var $_sum3738 = $19 | 8;
    var $61 = $oldbase + $_sum3738 | 0;
    var $62 = $61;
    var $63 = HEAP32[$62 >> 2];
    var $_sum39 = $19 + 12 | 0;
    var $64 = $oldbase + $_sum39 | 0;
    var $65 = $64;
    var $66 = HEAP32[$65 >> 2];
    var $67 = ($63 | 0) == ($66 | 0);
    if ($67) {
      label = 13;
      break;
    } else {
      label = 14;
      break;
    }
   case 13:
    var $69 = 1 << $58;
    var $70 = $69 ^ -1;
    var $71 = HEAP32[5243808 >> 2];
    var $72 = $71 & $70;
    HEAP32[5243808 >> 2] = $72;
    label = 52;
    break;
   case 14:
    var $74 = $58 << 1;
    var $75 = 5243848 + ($74 << 2) | 0;
    var $76 = $75;
    var $77 = ($63 | 0) == ($76 | 0);
    if ($77) {
      label = 16;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $79 = $63;
    var $80 = HEAP32[5243824 >> 2];
    var $81 = $79 >>> 0 < $80 >>> 0;
    if ($81) {
      label = 19;
      break;
    } else {
      label = 16;
      break;
    }
   case 16:
    var $83 = ($66 | 0) == ($76 | 0);
    if ($83) {
      label = 18;
      break;
    } else {
      label = 17;
      break;
    }
   case 17:
    var $85 = $66;
    var $86 = HEAP32[5243824 >> 2];
    var $87 = $85 >>> 0 < $86 >>> 0;
    if ($87) {
      label = 19;
      break;
    } else {
      label = 18;
      break;
    }
   case 18:
    var $88 = $63 + 12 | 0;
    HEAP32[$88 >> 2] = $66;
    var $89 = $66 + 8 | 0;
    HEAP32[$89 >> 2] = $63;
    label = 52;
    break;
   case 19:
    _abort();
   case 20:
    var $91 = $20;
    var $_sum34 = $19 | 24;
    var $92 = $oldbase + $_sum34 | 0;
    var $93 = $92;
    var $94 = HEAP32[$93 >> 2];
    var $_sum5 = $19 + 12 | 0;
    var $95 = $oldbase + $_sum5 | 0;
    var $96 = $95;
    var $97 = HEAP32[$96 >> 2];
    var $98 = ($97 | 0) == ($91 | 0);
    if ($98) {
      label = 24;
      break;
    } else {
      label = 21;
      break;
    }
   case 21:
    var $_sum3536 = $19 | 8;
    var $100 = $oldbase + $_sum3536 | 0;
    var $101 = $100;
    var $102 = HEAP32[$101 >> 2];
    var $103 = $102;
    var $104 = HEAP32[5243824 >> 2];
    var $105 = $103 >>> 0 < $104 >>> 0;
    if ($105) {
      label = 23;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $107 = $102 + 12 | 0;
    HEAP32[$107 >> 2] = $97;
    var $108 = $97 + 8 | 0;
    HEAP32[$108 >> 2] = $102;
    var $R_1 = $97;
    label = 32;
    break;
   case 23:
    _abort();
   case 24:
    var $_sum67 = $19 | 16;
    var $_sum8 = $_sum67 + 4 | 0;
    var $111 = $oldbase + $_sum8 | 0;
    var $112 = $111;
    var $113 = HEAP32[$112 >> 2];
    var $114 = ($113 | 0) == 0;
    if ($114) {
      label = 25;
      break;
    } else {
      var $R_0 = $113;
      var $RP_0 = $112;
      label = 26;
      break;
    }
   case 25:
    var $116 = $oldbase + $_sum67 | 0;
    var $117 = $116;
    var $118 = HEAP32[$117 >> 2];
    var $119 = ($118 | 0) == 0;
    if ($119) {
      var $R_1 = 0;
      label = 32;
      break;
    } else {
      var $R_0 = $118;
      var $RP_0 = $117;
      label = 26;
      break;
    }
   case 26:
    var $RP_0;
    var $R_0;
    var $120 = $R_0 + 20 | 0;
    var $121 = HEAP32[$120 >> 2];
    var $122 = ($121 | 0) == 0;
    if ($122) {
      label = 27;
      break;
    } else {
      var $CP_0 = $120;
      label = 28;
      break;
    }
   case 27:
    var $124 = $R_0 + 16 | 0;
    var $125 = HEAP32[$124 >> 2];
    var $126 = ($125 | 0) == 0;
    if ($126) {
      label = 29;
      break;
    } else {
      var $CP_0 = $124;
      label = 28;
      break;
    }
   case 28:
    var $CP_0;
    var $127 = HEAP32[$CP_0 >> 2];
    var $R_0 = $127;
    var $RP_0 = $CP_0;
    label = 26;
    break;
   case 29:
    var $129 = $RP_0;
    var $130 = HEAP32[5243824 >> 2];
    var $131 = $129 >>> 0 < $130 >>> 0;
    if ($131) {
      label = 31;
      break;
    } else {
      label = 30;
      break;
    }
   case 30:
    HEAP32[$RP_0 >> 2] = 0;
    var $R_1 = $R_0;
    label = 32;
    break;
   case 31:
    _abort();
   case 32:
    var $R_1;
    var $135 = ($94 | 0) == 0;
    if ($135) {
      label = 52;
      break;
    } else {
      label = 33;
      break;
    }
   case 33:
    var $_sum30 = $19 + 28 | 0;
    var $137 = $oldbase + $_sum30 | 0;
    var $138 = $137;
    var $139 = HEAP32[$138 >> 2];
    var $140 = 5244112 + ($139 << 2) | 0;
    var $141 = HEAP32[$140 >> 2];
    var $142 = ($91 | 0) == ($141 | 0);
    if ($142) {
      label = 34;
      break;
    } else {
      label = 36;
      break;
    }
   case 34:
    HEAP32[$140 >> 2] = $R_1;
    var $cond = ($R_1 | 0) == 0;
    if ($cond) {
      label = 35;
      break;
    } else {
      label = 42;
      break;
    }
   case 35:
    var $144 = HEAP32[$138 >> 2];
    var $145 = 1 << $144;
    var $146 = $145 ^ -1;
    var $147 = HEAP32[5243812 >> 2];
    var $148 = $147 & $146;
    HEAP32[5243812 >> 2] = $148;
    label = 52;
    break;
   case 36:
    var $150 = $94;
    var $151 = HEAP32[5243824 >> 2];
    var $152 = $150 >>> 0 < $151 >>> 0;
    if ($152) {
      label = 40;
      break;
    } else {
      label = 37;
      break;
    }
   case 37:
    var $154 = $94 + 16 | 0;
    var $155 = HEAP32[$154 >> 2];
    var $156 = ($155 | 0) == ($91 | 0);
    if ($156) {
      label = 38;
      break;
    } else {
      label = 39;
      break;
    }
   case 38:
    HEAP32[$154 >> 2] = $R_1;
    label = 41;
    break;
   case 39:
    var $159 = $94 + 20 | 0;
    HEAP32[$159 >> 2] = $R_1;
    label = 41;
    break;
   case 40:
    _abort();
   case 41:
    var $162 = ($R_1 | 0) == 0;
    if ($162) {
      label = 52;
      break;
    } else {
      label = 42;
      break;
    }
   case 42:
    var $164 = $R_1;
    var $165 = HEAP32[5243824 >> 2];
    var $166 = $164 >>> 0 < $165 >>> 0;
    if ($166) {
      label = 51;
      break;
    } else {
      label = 43;
      break;
    }
   case 43:
    var $168 = $R_1 + 24 | 0;
    HEAP32[$168 >> 2] = $94;
    var $_sum3132 = $19 | 16;
    var $169 = $oldbase + $_sum3132 | 0;
    var $170 = $169;
    var $171 = HEAP32[$170 >> 2];
    var $172 = ($171 | 0) == 0;
    if ($172) {
      label = 47;
      break;
    } else {
      label = 44;
      break;
    }
   case 44:
    var $174 = $171;
    var $175 = HEAP32[5243824 >> 2];
    var $176 = $174 >>> 0 < $175 >>> 0;
    if ($176) {
      label = 46;
      break;
    } else {
      label = 45;
      break;
    }
   case 45:
    var $178 = $R_1 + 16 | 0;
    HEAP32[$178 >> 2] = $171;
    var $179 = $171 + 24 | 0;
    HEAP32[$179 >> 2] = $R_1;
    label = 47;
    break;
   case 46:
    _abort();
   case 47:
    var $_sum33 = $_sum3132 + 4 | 0;
    var $182 = $oldbase + $_sum33 | 0;
    var $183 = $182;
    var $184 = HEAP32[$183 >> 2];
    var $185 = ($184 | 0) == 0;
    if ($185) {
      label = 52;
      break;
    } else {
      label = 48;
      break;
    }
   case 48:
    var $187 = $184;
    var $188 = HEAP32[5243824 >> 2];
    var $189 = $187 >>> 0 < $188 >>> 0;
    if ($189) {
      label = 50;
      break;
    } else {
      label = 49;
      break;
    }
   case 49:
    var $191 = $R_1 + 20 | 0;
    HEAP32[$191 >> 2] = $184;
    var $192 = $184 + 24 | 0;
    HEAP32[$192 >> 2] = $R_1;
    label = 52;
    break;
   case 50:
    _abort();
   case 51:
    _abort();
   case 52:
    var $_sum9 = $57 | $19;
    var $196 = $oldbase + $_sum9 | 0;
    var $197 = $196;
    var $198 = $57 + $27 | 0;
    var $oldfirst_0 = $197;
    var $qsize_0 = $198;
    label = 53;
    break;
   case 53:
    var $qsize_0;
    var $oldfirst_0;
    var $200 = $oldfirst_0 + 4 | 0;
    var $201 = HEAP32[$200 >> 2];
    var $202 = $201 & -2;
    HEAP32[$200 >> 2] = $202;
    var $203 = $qsize_0 | 1;
    var $_sum10 = $_sum + 4 | 0;
    var $204 = $newbase + $_sum10 | 0;
    var $205 = $204;
    HEAP32[$205 >> 2] = $203;
    var $_sum11 = $qsize_0 + $_sum | 0;
    var $206 = $newbase + $_sum11 | 0;
    var $207 = $206;
    HEAP32[$207 >> 2] = $qsize_0;
    var $208 = $qsize_0 >>> 3;
    var $209 = $qsize_0 >>> 0 < 256;
    if ($209) {
      label = 54;
      break;
    } else {
      label = 59;
      break;
    }
   case 54:
    var $211 = $208 << 1;
    var $212 = 5243848 + ($211 << 2) | 0;
    var $213 = $212;
    var $214 = HEAP32[5243808 >> 2];
    var $215 = 1 << $208;
    var $216 = $214 & $215;
    var $217 = ($216 | 0) == 0;
    if ($217) {
      label = 55;
      break;
    } else {
      label = 56;
      break;
    }
   case 55:
    var $219 = $214 | $215;
    HEAP32[5243808 >> 2] = $219;
    var $F4_0 = $213;
    label = 58;
    break;
   case 56:
    var $_sum29 = $211 + 2 | 0;
    var $221 = 5243848 + ($_sum29 << 2) | 0;
    var $222 = HEAP32[$221 >> 2];
    var $223 = $222;
    var $224 = HEAP32[5243824 >> 2];
    var $225 = $223 >>> 0 < $224 >>> 0;
    if ($225) {
      label = 57;
      break;
    } else {
      var $F4_0 = $222;
      label = 58;
      break;
    }
   case 57:
    _abort();
   case 58:
    var $F4_0;
    var $_sum26 = $211 + 2 | 0;
    var $228 = 5243848 + ($_sum26 << 2) | 0;
    HEAP32[$228 >> 2] = $26;
    var $229 = $F4_0 + 12 | 0;
    HEAP32[$229 >> 2] = $26;
    var $_sum27 = $_sum + 8 | 0;
    var $230 = $newbase + $_sum27 | 0;
    var $231 = $230;
    HEAP32[$231 >> 2] = $F4_0;
    var $_sum28 = $_sum + 12 | 0;
    var $232 = $newbase + $_sum28 | 0;
    var $233 = $232;
    HEAP32[$233 >> 2] = $213;
    label = 76;
    break;
   case 59:
    var $235 = $25;
    var $236 = $qsize_0 >>> 8;
    var $237 = ($236 | 0) == 0;
    if ($237) {
      var $I7_0 = 0;
      label = 62;
      break;
    } else {
      label = 60;
      break;
    }
   case 60:
    var $239 = $qsize_0 >>> 0 > 16777215;
    if ($239) {
      var $I7_0 = 31;
      label = 62;
      break;
    } else {
      label = 61;
      break;
    }
   case 61:
    var $241 = $236 + 1048320 | 0;
    var $242 = $241 >>> 16;
    var $243 = $242 & 8;
    var $244 = $236 << $243;
    var $245 = $244 + 520192 | 0;
    var $246 = $245 >>> 16;
    var $247 = $246 & 4;
    var $248 = $247 | $243;
    var $249 = $244 << $247;
    var $250 = $249 + 245760 | 0;
    var $251 = $250 >>> 16;
    var $252 = $251 & 2;
    var $253 = $248 | $252;
    var $254 = 14 - $253 | 0;
    var $255 = $249 << $252;
    var $256 = $255 >>> 15;
    var $257 = $254 + $256 | 0;
    var $258 = $257 << 1;
    var $259 = $257 + 7 | 0;
    var $260 = $qsize_0 >>> ($259 >>> 0);
    var $261 = $260 & 1;
    var $262 = $261 | $258;
    var $I7_0 = $262;
    label = 62;
    break;
   case 62:
    var $I7_0;
    var $264 = 5244112 + ($I7_0 << 2) | 0;
    var $_sum12 = $_sum + 28 | 0;
    var $265 = $newbase + $_sum12 | 0;
    var $266 = $265;
    HEAP32[$266 >> 2] = $I7_0;
    var $_sum13 = $_sum + 16 | 0;
    var $267 = $newbase + $_sum13 | 0;
    var $_sum14 = $_sum + 20 | 0;
    var $268 = $newbase + $_sum14 | 0;
    var $269 = $268;
    HEAP32[$269 >> 2] = 0;
    var $270 = $267;
    HEAP32[$270 >> 2] = 0;
    var $271 = HEAP32[5243812 >> 2];
    var $272 = 1 << $I7_0;
    var $273 = $271 & $272;
    var $274 = ($273 | 0) == 0;
    if ($274) {
      label = 63;
      break;
    } else {
      label = 64;
      break;
    }
   case 63:
    var $276 = $271 | $272;
    HEAP32[5243812 >> 2] = $276;
    HEAP32[$264 >> 2] = $235;
    var $277 = $264;
    var $_sum15 = $_sum + 24 | 0;
    var $278 = $newbase + $_sum15 | 0;
    var $279 = $278;
    HEAP32[$279 >> 2] = $277;
    var $_sum16 = $_sum + 12 | 0;
    var $280 = $newbase + $_sum16 | 0;
    var $281 = $280;
    HEAP32[$281 >> 2] = $235;
    var $_sum17 = $_sum + 8 | 0;
    var $282 = $newbase + $_sum17 | 0;
    var $283 = $282;
    HEAP32[$283 >> 2] = $235;
    label = 76;
    break;
   case 64:
    var $285 = HEAP32[$264 >> 2];
    var $286 = ($I7_0 | 0) == 31;
    if ($286) {
      var $291 = 0;
      label = 66;
      break;
    } else {
      label = 65;
      break;
    }
   case 65:
    var $288 = $I7_0 >>> 1;
    var $289 = 25 - $288 | 0;
    var $291 = $289;
    label = 66;
    break;
   case 66:
    var $291;
    var $292 = $qsize_0 << $291;
    var $K8_0 = $292;
    var $T_0 = $285;
    label = 67;
    break;
   case 67:
    var $T_0;
    var $K8_0;
    var $294 = $T_0 + 4 | 0;
    var $295 = HEAP32[$294 >> 2];
    var $296 = $295 & -8;
    var $297 = ($296 | 0) == ($qsize_0 | 0);
    if ($297) {
      label = 72;
      break;
    } else {
      label = 68;
      break;
    }
   case 68:
    var $299 = $K8_0 >>> 31;
    var $300 = $T_0 + 16 + ($299 << 2) | 0;
    var $301 = HEAP32[$300 >> 2];
    var $302 = ($301 | 0) == 0;
    var $303 = $K8_0 << 1;
    if ($302) {
      label = 69;
      break;
    } else {
      var $K8_0 = $303;
      var $T_0 = $301;
      label = 67;
      break;
    }
   case 69:
    var $305 = $300;
    var $306 = HEAP32[5243824 >> 2];
    var $307 = $305 >>> 0 < $306 >>> 0;
    if ($307) {
      label = 71;
      break;
    } else {
      label = 70;
      break;
    }
   case 70:
    HEAP32[$300 >> 2] = $235;
    var $_sum23 = $_sum + 24 | 0;
    var $309 = $newbase + $_sum23 | 0;
    var $310 = $309;
    HEAP32[$310 >> 2] = $T_0;
    var $_sum24 = $_sum + 12 | 0;
    var $311 = $newbase + $_sum24 | 0;
    var $312 = $311;
    HEAP32[$312 >> 2] = $235;
    var $_sum25 = $_sum + 8 | 0;
    var $313 = $newbase + $_sum25 | 0;
    var $314 = $313;
    HEAP32[$314 >> 2] = $235;
    label = 76;
    break;
   case 71:
    _abort();
   case 72:
    var $317 = $T_0 + 8 | 0;
    var $318 = HEAP32[$317 >> 2];
    var $319 = $T_0;
    var $320 = HEAP32[5243824 >> 2];
    var $321 = $319 >>> 0 < $320 >>> 0;
    if ($321) {
      label = 75;
      break;
    } else {
      label = 73;
      break;
    }
   case 73:
    var $323 = $318;
    var $324 = $323 >>> 0 < $320 >>> 0;
    if ($324) {
      label = 75;
      break;
    } else {
      label = 74;
      break;
    }
   case 74:
    var $326 = $318 + 12 | 0;
    HEAP32[$326 >> 2] = $235;
    HEAP32[$317 >> 2] = $235;
    var $_sum20 = $_sum + 8 | 0;
    var $327 = $newbase + $_sum20 | 0;
    var $328 = $327;
    HEAP32[$328 >> 2] = $318;
    var $_sum21 = $_sum + 12 | 0;
    var $329 = $newbase + $_sum21 | 0;
    var $330 = $329;
    HEAP32[$330 >> 2] = $T_0;
    var $_sum22 = $_sum + 24 | 0;
    var $331 = $newbase + $_sum22 | 0;
    var $332 = $331;
    HEAP32[$332 >> 2] = 0;
    label = 76;
    break;
   case 75:
    _abort();
   case 76:
    var $_sum1819 = $9 | 8;
    var $334 = $newbase + $_sum1819 | 0;
    return $334;
  }
}
_prepend_alloc["X"] = 1;
function __ZNKSt9bad_alloc4whatEv($this) {
  return 5243212;
}
function __ZNKSt20bad_array_new_length4whatEv($this) {
  return 5243424;
}
function __ZSt15get_new_handlerv() {
  return tempValue = HEAP32[5245392 >> 2], HEAP32[5245392 >> 2] = tempValue + 0, tempValue;
}
function __ZSt15set_new_handlerPFvvE($handler) {
  return tempValue = HEAP32[5245392 >> 2], HEAP32[5245392 >> 2] = $handler, tempValue;
}
function __ZNSt9bad_allocC2Ev($this) {
  HEAP32[$this >> 2] = 5245280;
  return;
}
function __ZdlPv($ptr) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($ptr | 0) == 0;
    if ($1) {
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    _free($ptr);
    label = 4;
    break;
   case 4:
    return;
  }
}
function __ZdlPvRKSt9nothrow_t($ptr, $0) {
  __ZdlPv($ptr);
  return;
}
function __ZdaPv($ptr) {
  __ZdlPv($ptr);
  return;
}
function __ZdaPvRKSt9nothrow_t($ptr, $0) {
  __ZdaPv($ptr);
  return;
}
function __ZNSt9bad_allocD0Ev($this) {
  __ZNSt9bad_allocD2Ev($this);
  __ZdlPv($this);
  return;
}
function __ZNSt9bad_allocD2Ev($this) {
  return;
}
function __ZNSt20bad_array_new_lengthC2Ev($this) {
  __ZNSt9bad_allocC2Ev($this | 0);
  HEAP32[$this >> 2] = 5245304;
  return;
}
function __ZNSt20bad_array_new_lengthD0Ev($this) {
  __ZNSt9bad_allocD2Ev($this | 0);
  __ZdlPv($this);
  return;
}
function _add_segment($tbase, $tsize) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = HEAP32[5243832 >> 2];
    var $2 = $1;
    var $3 = _segment_holding($2);
    var $4 = $3 | 0;
    var $5 = HEAP32[$4 >> 2];
    var $6 = $3 + 4 | 0;
    var $7 = HEAP32[$6 >> 2];
    var $8 = $5 + $7 | 0;
    var $_sum = $7 - 47 | 0;
    var $_sum1 = $7 - 39 | 0;
    var $9 = $5 + $_sum1 | 0;
    var $10 = $9;
    var $11 = $10 & 7;
    var $12 = ($11 | 0) == 0;
    if ($12) {
      var $17 = 0;
      label = 4;
      break;
    } else {
      label = 3;
      break;
    }
   case 3:
    var $14 = -$10 | 0;
    var $15 = $14 & 7;
    var $17 = $15;
    label = 4;
    break;
   case 4:
    var $17;
    var $_sum2 = $_sum + $17 | 0;
    var $18 = $5 + $_sum2 | 0;
    var $19 = $1 + 16 | 0;
    var $20 = $19;
    var $21 = $18 >>> 0 < $20 >>> 0;
    var $22 = $21 ? $2 : $18;
    var $23 = $22 + 8 | 0;
    var $24 = $23;
    var $25 = $tbase;
    var $26 = $tsize - 40 | 0;
    _init_top($25, $26);
    var $27 = $22 + 4 | 0;
    var $28 = $27;
    HEAP32[$28 >> 2] = 27;
    HEAP32[$23 >> 2] = HEAP32[5244252 >> 2];
    HEAP32[$23 + 4 >> 2] = HEAP32[5244256 >> 2];
    HEAP32[$23 + 8 >> 2] = HEAP32[5244260 >> 2];
    HEAP32[$23 + 12 >> 2] = HEAP32[5244264 >> 2];
    HEAP32[5244252 >> 2] = $tbase;
    HEAP32[5244256 >> 2] = $tsize;
    HEAP32[5244264 >> 2] = 0;
    HEAP32[5244260 >> 2] = $24;
    var $29 = $22 + 28 | 0;
    var $30 = $29;
    HEAP32[$30 >> 2] = 7;
    var $31 = $22 + 32 | 0;
    var $32 = $31 >>> 0 < $8 >>> 0;
    if ($32) {
      var $33 = $30;
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    var $33;
    var $34 = $33 + 4 | 0;
    HEAP32[$34 >> 2] = 7;
    var $35 = $33 + 8 | 0;
    var $36 = $35;
    var $37 = $36 >>> 0 < $8 >>> 0;
    if ($37) {
      var $33 = $34;
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 6:
    var $38 = ($22 | 0) == ($2 | 0);
    if ($38) {
      label = 30;
      break;
    } else {
      label = 7;
      break;
    }
   case 7:
    var $40 = $22;
    var $41 = $1;
    var $42 = $40 - $41 | 0;
    var $43 = $2 + $42 | 0;
    var $_sum3 = $42 + 4 | 0;
    var $44 = $2 + $_sum3 | 0;
    var $45 = $44;
    var $46 = HEAP32[$45 >> 2];
    var $47 = $46 & -2;
    HEAP32[$45 >> 2] = $47;
    var $48 = $42 | 1;
    var $49 = $1 + 4 | 0;
    HEAP32[$49 >> 2] = $48;
    var $50 = $43;
    HEAP32[$50 >> 2] = $42;
    var $51 = $42 >>> 3;
    var $52 = $42 >>> 0 < 256;
    if ($52) {
      label = 8;
      break;
    } else {
      label = 13;
      break;
    }
   case 8:
    var $54 = $51 << 1;
    var $55 = 5243848 + ($54 << 2) | 0;
    var $56 = $55;
    var $57 = HEAP32[5243808 >> 2];
    var $58 = 1 << $51;
    var $59 = $57 & $58;
    var $60 = ($59 | 0) == 0;
    if ($60) {
      label = 9;
      break;
    } else {
      label = 10;
      break;
    }
   case 9:
    var $62 = $57 | $58;
    HEAP32[5243808 >> 2] = $62;
    var $F_0 = $56;
    label = 12;
    break;
   case 10:
    var $_sum11 = $54 + 2 | 0;
    var $64 = 5243848 + ($_sum11 << 2) | 0;
    var $65 = HEAP32[$64 >> 2];
    var $66 = $65;
    var $67 = HEAP32[5243824 >> 2];
    var $68 = $66 >>> 0 < $67 >>> 0;
    if ($68) {
      label = 11;
      break;
    } else {
      var $F_0 = $65;
      label = 12;
      break;
    }
   case 11:
    _abort();
   case 12:
    var $F_0;
    var $_sum10 = $54 + 2 | 0;
    var $71 = 5243848 + ($_sum10 << 2) | 0;
    HEAP32[$71 >> 2] = $1;
    var $72 = $F_0 + 12 | 0;
    HEAP32[$72 >> 2] = $1;
    var $73 = $1 + 8 | 0;
    HEAP32[$73 >> 2] = $F_0;
    var $74 = $1 + 12 | 0;
    HEAP32[$74 >> 2] = $56;
    label = 30;
    break;
   case 13:
    var $76 = $1;
    var $77 = $42 >>> 8;
    var $78 = ($77 | 0) == 0;
    if ($78) {
      var $I1_0 = 0;
      label = 16;
      break;
    } else {
      label = 14;
      break;
    }
   case 14:
    var $80 = $42 >>> 0 > 16777215;
    if ($80) {
      var $I1_0 = 31;
      label = 16;
      break;
    } else {
      label = 15;
      break;
    }
   case 15:
    var $82 = $77 + 1048320 | 0;
    var $83 = $82 >>> 16;
    var $84 = $83 & 8;
    var $85 = $77 << $84;
    var $86 = $85 + 520192 | 0;
    var $87 = $86 >>> 16;
    var $88 = $87 & 4;
    var $89 = $88 | $84;
    var $90 = $85 << $88;
    var $91 = $90 + 245760 | 0;
    var $92 = $91 >>> 16;
    var $93 = $92 & 2;
    var $94 = $89 | $93;
    var $95 = 14 - $94 | 0;
    var $96 = $90 << $93;
    var $97 = $96 >>> 15;
    var $98 = $95 + $97 | 0;
    var $99 = $98 << 1;
    var $100 = $98 + 7 | 0;
    var $101 = $42 >>> ($100 >>> 0);
    var $102 = $101 & 1;
    var $103 = $102 | $99;
    var $I1_0 = $103;
    label = 16;
    break;
   case 16:
    var $I1_0;
    var $105 = 5244112 + ($I1_0 << 2) | 0;
    var $106 = $1 + 28 | 0;
    var $I1_0_c = $I1_0;
    HEAP32[$106 >> 2] = $I1_0_c;
    var $107 = $1 + 20 | 0;
    HEAP32[$107 >> 2] = 0;
    var $108 = $1 + 16 | 0;
    HEAP32[$108 >> 2] = 0;
    var $109 = HEAP32[5243812 >> 2];
    var $110 = 1 << $I1_0;
    var $111 = $109 & $110;
    var $112 = ($111 | 0) == 0;
    if ($112) {
      label = 17;
      break;
    } else {
      label = 18;
      break;
    }
   case 17:
    var $114 = $109 | $110;
    HEAP32[5243812 >> 2] = $114;
    HEAP32[$105 >> 2] = $76;
    var $115 = $1 + 24 | 0;
    var $_c = $105;
    HEAP32[$115 >> 2] = $_c;
    var $116 = $1 + 12 | 0;
    HEAP32[$116 >> 2] = $1;
    var $117 = $1 + 8 | 0;
    HEAP32[$117 >> 2] = $1;
    label = 30;
    break;
   case 18:
    var $119 = HEAP32[$105 >> 2];
    var $120 = ($I1_0 | 0) == 31;
    if ($120) {
      var $125 = 0;
      label = 20;
      break;
    } else {
      label = 19;
      break;
    }
   case 19:
    var $122 = $I1_0 >>> 1;
    var $123 = 25 - $122 | 0;
    var $125 = $123;
    label = 20;
    break;
   case 20:
    var $125;
    var $126 = $42 << $125;
    var $K2_0 = $126;
    var $T_0 = $119;
    label = 21;
    break;
   case 21:
    var $T_0;
    var $K2_0;
    var $128 = $T_0 + 4 | 0;
    var $129 = HEAP32[$128 >> 2];
    var $130 = $129 & -8;
    var $131 = ($130 | 0) == ($42 | 0);
    if ($131) {
      label = 26;
      break;
    } else {
      label = 22;
      break;
    }
   case 22:
    var $133 = $K2_0 >>> 31;
    var $134 = $T_0 + 16 + ($133 << 2) | 0;
    var $135 = HEAP32[$134 >> 2];
    var $136 = ($135 | 0) == 0;
    var $137 = $K2_0 << 1;
    if ($136) {
      label = 23;
      break;
    } else {
      var $K2_0 = $137;
      var $T_0 = $135;
      label = 21;
      break;
    }
   case 23:
    var $139 = $134;
    var $140 = HEAP32[5243824 >> 2];
    var $141 = $139 >>> 0 < $140 >>> 0;
    if ($141) {
      label = 25;
      break;
    } else {
      label = 24;
      break;
    }
   case 24:
    HEAP32[$134 >> 2] = $76;
    var $143 = $1 + 24 | 0;
    var $T_0_c7 = $T_0;
    HEAP32[$143 >> 2] = $T_0_c7;
    var $144 = $1 + 12 | 0;
    HEAP32[$144 >> 2] = $1;
    var $145 = $1 + 8 | 0;
    HEAP32[$145 >> 2] = $1;
    label = 30;
    break;
   case 25:
    _abort();
   case 26:
    var $148 = $T_0 + 8 | 0;
    var $149 = HEAP32[$148 >> 2];
    var $150 = $T_0;
    var $151 = HEAP32[5243824 >> 2];
    var $152 = $150 >>> 0 < $151 >>> 0;
    if ($152) {
      label = 29;
      break;
    } else {
      label = 27;
      break;
    }
   case 27:
    var $154 = $149;
    var $155 = $154 >>> 0 < $151 >>> 0;
    if ($155) {
      label = 29;
      break;
    } else {
      label = 28;
      break;
    }
   case 28:
    var $157 = $149 + 12 | 0;
    HEAP32[$157 >> 2] = $76;
    HEAP32[$148 >> 2] = $76;
    var $158 = $1 + 8 | 0;
    var $_c6 = $149;
    HEAP32[$158 >> 2] = $_c6;
    var $159 = $1 + 12 | 0;
    var $T_0_c = $T_0;
    HEAP32[$159 >> 2] = $T_0_c;
    var $160 = $1 + 24 | 0;
    HEAP32[$160 >> 2] = 0;
    label = 30;
    break;
   case 29:
    _abort();
   case 30:
    return;
  }
}
_add_segment["X"] = 1;
function __Znwj($size) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = ($size | 0) == 0;
    var $_size = $1 ? 1 : $size;
    label = 3;
    break;
   case 3:
    var $3 = _malloc($_size);
    var $4 = ($3 | 0) == 0;
    if ($4) {
      label = 4;
      break;
    } else {
      label = 11;
      break;
    }
   case 4:
    var $6 = __ZSt15get_new_handlerv();
    var $7 = ($6 | 0) == 0;
    if ($7) {
      label = 10;
      break;
    } else {
      label = 5;
      break;
    }
   case 5:
    FUNCTION_TABLE[$6]();
    label = 3;
    break;
   case 6:
    var $lpad_loopexit$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], []);
    $lpad_loopexit$1 = tempRet0;
    var $lpad_phi$1 = $lpad_loopexit$1;
    var $lpad_phi$0 = $lpad_loopexit$0;
    label = 8;
    break;
   case 7:
    var $lpad_nonloopexit$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], []);
    $lpad_nonloopexit$1 = tempRet0;
    var $lpad_phi$1 = $lpad_nonloopexit$1;
    var $lpad_phi$0 = $lpad_nonloopexit$0;
    label = 8;
    break;
   case 8:
    var $lpad_phi$0;
    var $lpad_phi$1;
    var $10 = $lpad_phi$1;
    var $11 = ($10 | 0) < 0;
    if ($11) {
      label = 9;
      break;
    } else {
      label = 12;
      break;
    }
   case 9:
    var $13 = $lpad_phi$0;
    ___cxa_call_unexpected($13);
   case 10:
    var $15 = ___cxa_allocate_exception(4);
    var $16 = $15;
    __ZNSt9bad_allocC2Ev($16);
    ___cxa_throw($15, 5245364, 20);
    label = 13;
    break;
   case 11:
    return $3;
   case 12:
    if (HEAP32[_llvm_eh_exception.buf >> 2] == 0) {
      HEAP32[_llvm_eh_exception.buf >> 2] = $lpad_phi$0;
    }
    throw $lpad_phi$0 + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
   case 13:
  }
}
function __ZnwjRKSt9nothrow_t($size, $0) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $2 = __Znwj($size);
    var $p_0 = $2;
    label = 4;
    break;
   case 3:
    var $4$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], [ 0 ]);
    $4$1 = tempRet0;
    var $5 = $4$0;
    var $6 = ___cxa_begin_catch($5);
    ___cxa_end_catch();
    var $p_0 = 0;
    label = 4;
    break;
   case 4:
    var $p_0;
    return $p_0;
   case 5:
    var $9$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], []);
    $9$1 = tempRet0;
    var $10 = $9$0;
    ___cxa_call_unexpected($10);
  }
}
function __Znaj($size) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = __Znwj($size);
    label = 3;
    break;
   case 3:
    return $1;
   case 4:
    var $4$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], []);
    $4$1 = tempRet0;
    var $5 = $4$1;
    var $6 = ($5 | 0) < 0;
    if ($6) {
      label = 5;
      break;
    } else {
      label = 6;
      break;
    }
   case 5:
    var $8 = $4$0;
    ___cxa_call_unexpected($8);
   case 6:
    if (HEAP32[_llvm_eh_exception.buf >> 2] == 0) {
      HEAP32[_llvm_eh_exception.buf >> 2] = $4$0;
    }
    throw $4$0 + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
  }
}
function __ZnajRKSt9nothrow_t($size, $nothrow) {
  var label = 0;
  label = 2;
  while (1) switch (label) {
   case 2:
    var $1 = __Znaj($size);
    var $p_0 = $1;
    label = 4;
    break;
   case 3:
    var $3$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], [ 0 ]);
    $3$1 = tempRet0;
    var $4 = $3$0;
    var $5 = ___cxa_begin_catch($4);
    ___cxa_end_catch();
    var $p_0 = 0;
    label = 4;
    break;
   case 4:
    var $p_0;
    return $p_0;
   case 5:
    var $8$0 = ___cxa_find_matching_catch(HEAP32[_llvm_eh_exception.buf >> 2], HEAP32[_llvm_eh_exception.buf + 4 >> 2], []);
    $8$1 = tempRet0;
    var $9 = $8$0;
    ___cxa_call_unexpected($9);
  }
}
function __ZSt17__throw_bad_allocv() {
  var $1 = ___cxa_allocate_exception(4);
  __ZNSt9bad_allocC2Ev($1);
  ___cxa_throw($1, 5245364, 20);
}





// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    add: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.add(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    subtract: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.subtract(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    multiply: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.multiply(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    divide: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.div(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, z, null);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    modulo: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.modulo(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, null, z);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======


Runtime.typeInfo = {"%union.anon.0":{"alignSize":4,"flatIndexes":[0],"fields":["%struct.anon.1"],"flatSize":240,"flatFactor":240,"packed":false},"[41 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":41,"flatFactor":1},"%struct._glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"[70 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":70,"flatFactor":1},"[72 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":72,"flatFactor":1},"[5 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16],"fields":["i8*","i8*","i8*","i8*","i8*"],"flatSize":20,"flatFactor":4},"%struct._atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"%struct.malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[86 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":86,"flatFactor":1},"[14 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":14,"flatFactor":1},"[0 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"{ i8*,i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["i8*","i8*","i8*"],"flatSize":12,"flatFactor":4,"packed":false},"%\"class.std::bad_alloc\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::exception\""],"flatSize":4,"flatFactor":4,"packed":false},"[30 x i32]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":120,"flatFactor":4},"i8* (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%\"class.std::exception\"":{"alignSize":4,"flatIndexes":[0],"fields":["i32 (...)**"],"flatSize":4,"flatFactor":4,"packed":false},"[58 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":58,"flatFactor":1},"[26 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":26,"flatFactor":1},"%struct.malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"[2 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"[0 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4},"void (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"void (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[32 x void ()*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*"],"flatSize":128,"flatFactor":4},"[38 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":38,"flatFactor":1},"[0 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"[13 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":13,"flatFactor":1},"[15 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":15,"flatFactor":1},"%struct.pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[32 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"%union.anon":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4,"packed":false},"[3 x i8]":{"alignSize":1,"flatIndexes":[0,1,2],"fields":["i8","i8","i8"],"flatSize":3,"flatFactor":1},"[25 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":25,"flatFactor":1},"[32 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":128,"flatFactor":4},"[96 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":96,"flatFactor":1},"[37 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":37,"flatFactor":1},"[47 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":47,"flatFactor":1},"[3 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"[122 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":122,"flatFactor":1},"%struct.__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[0 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4},"[33 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":33,"flatFactor":1},"void ()":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x void ()*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["void ()*","void ()*"],"flatSize":8,"flatFactor":4},"%struct.malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"[40 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":40,"flatFactor":1},"[103 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":103,"flatFactor":1},"[30 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":120,"flatFactor":4},"[0 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[1 x i8]":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1},"i8* (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"%struct._Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"%struct.malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,460,464],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":468,"packed":false},"[123 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":123,"flatFactor":1},"%struct.pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[0 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"i32 (%struct.pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._reent":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1060,"packed":false},"[1 x i32]":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct.region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"%struct.pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[22 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":22,"flatFactor":1},"%\"class.std::bad_array_new_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"%struct.anon.1":{"alignSize":4,"flatIndexes":[0,120],"fields":["[30 x i8*]","[30 x i32]"],"flatSize":240,"flatFactor":120,"packed":false},"[119 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":119,"flatFactor":1},"[54 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":54,"flatFactor":1},"[2 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[21 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":21,"flatFactor":1},"[65 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":65,"flatFactor":1},"[113 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":113,"flatFactor":1},"%\"struct.std::nothrow_t\"":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1,"packed":false},"[39 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":39,"flatFactor":1},"%struct._mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"[18 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":18,"flatFactor":1},"%struct.__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"_glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"_atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[0 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[32 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[3 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"[0 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"_Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,460,464],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":468,"packed":false},"pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[0 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"i32 (pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"_reent":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1060,"packed":false},"region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"anon.1":{"alignSize":4,"flatIndexes":[0,120],"fields":["[30 x i8*]","[30 x i32]"],"flatSize":240,"flatFactor":120,"packed":false},"[2 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false}}
Runtime.structMetadata = {}

// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);


  var ret;

  ret = Module['_main'](argc, argv, 0);


  return ret;
}




function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

initRuntime();

var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

if (shouldRunNow) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}






  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["__ZNKSt20bad_array_new_length4whatEv","_validate","_pixman_coalesce","_pixman_region32_init_rect","_pixman_rect_alloc","_pixman_region32_contains_point","_pixman_region32_copy","_pvalloc","_release_unused_segments","_pixman_region32_clear","__ZNKSt9bad_alloc4whatEv","__ZdlPvRKSt9nothrow_t","_pixman_region32_contains_rectangle","_pixman_region32_union_rect","_pixman_region32_selfcheck","_PIXREGION_SZOF","_malloc_trim","_pixman_region32_inverse","_mmap_resize","_malloc_usable_size","_pixman_region32_init_rects","__ZdlPv","_sys_alloc","_free","__ZNSt9bad_allocC2Ev","_change_mparam","_memalign","_independent_calloc","_pixman_region32_fini","_pixman_region32_intersect","_pixman_region_subtract_o","_pixman_region32_n_rects","_pixman_region32_translate","_pixman_region32_subtract","_tmalloc_small","_pixman_region32_init_with_extents","_find_box_for_y","__ZSt15get_new_handlerv","_tmalloc_large","_pixman_region32_equal","_pixman_region32_rectangles","__ZNSt9bad_allocD2Ev","_alloc_data","_pixman_region32_union","_quick_sort_rects","_pixman_region32_intersect_rect","__ZNSt20bad_array_new_lengthC2Ev","_pixman_region32_extents","__Znwj","__ZSt17__throw_bad_allocv","_pixman_region32_reset","_pixman_region32_not_empty","_sys_trim","_independent_comalloc","_pixman_region_append_non_o","_internal_mallinfo","_ialloc","_malloc_footprint","_prepend_alloc","__ZnwjRKSt9nothrow_t","_internal_memalign","_mallopt","_pixman_region32_print","__Znaj","_add_segment","_init_bins","_malloc","_malloc_max_footprint","_valloc","_pixman_set_extents","__ZNSt20bad_array_new_lengthD0Ev","_internal_malloc_stats","_pixman_break","__ZNSt9bad_allocD0Ev","_calloc","_mmap_alloc","_init_top","__ZSt15set_new_handlerPFvvE","_mallinfo","_internal_realloc","__ZdaPv","_malloc_stats","_init_mparams","_pixman_region32_init","_realloc","_segment_holding","_pixman_region_intersect_o","_pixman_region_union_o","_pixman_op","__ZnajRKSt9nothrow_t","__ZdaPvRKSt9nothrow_t"]



