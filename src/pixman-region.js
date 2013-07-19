// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
  Module.test;
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
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
  module.exports = Module;
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
  this['Module'] = Module;
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
  this['Module'] = Module;
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
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
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
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
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
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
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
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
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
        return Runtime.dynCall(sig, func, arguments);
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
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
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
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
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
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
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
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
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
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
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
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
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
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
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
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
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
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
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
if (!Math['imul']) Math['imul'] = function(a, b) {
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
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
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
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 3096;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var ___progname;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
var __ZNSt20bad_array_new_lengthC1Ev;
var __ZNSt20bad_array_new_lengthD1Ev;
var __ZNSt20bad_array_new_lengthD2Ev;
var _err;
var _errx;
var _warn;
var _warnx;
var _verr;
var _verrx;
var _vwarn;
var _vwarnx;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE = __ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE = __ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,115,0,0,0,0,0,0,0,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,99,0,0,0,0,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,48,10,0,0,0,0,0,0,232,9,0,0,0,0,0,0,240,9,0,0,0,0,0,0,0,10,0,0,0,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,111,112,116,105,111,110,32,100,111,101,115,110,39,116,32,116,97,107,101,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,46,42,115,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,115,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,99,0,0,0,0,255,255,255,255,0,0,0,0,97,109,98,105,103,117,111,117,115,32,111,112,116,105,111,110,32,45,45,32,37,46,42,115,0,0,0,0,0,0,0,0,37,115,58,32,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,50,45,62,120,49,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,38,38,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,121,49,32,60,32,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,117,109,82,101,99,116,115,32,61,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,45,32,99,117,114,95,115,116,97,114,116,32,119,97,115,32,102,97,108,115,101,0,80,79,83,73,88,76,89,95,67,79,82,82,69,67,84,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,71,79,79,68,95,82,69,67,84,32,40,98,111,120,41,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,114,101,99,116,97,110,103,108,101,32,112,97,115,115,101,100,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,10,0,0,0,0,0,0,0,37,115,58,32,0,0,0,0,37,115,10,0,0,0,0,0,105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,37,100,32,37,100,32,37,100,32,37,100,32,10,0,0,0,37,115,58,32,0,0,0,0,109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,45,62,120,49,32,60,32,114,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,101,119,95,114,101,99,116,115,32,33,61,32,48,32,119,97,115,32,102,97,108,115,101,0,37,115,58,32,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,49,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,60,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,115,105,122,101,32,119,97,115,32,102,97,108,115,101,0,0,0,101,120,116,101,110,116,115,58,32,37,100,32,37,100,32,37,100,32,37,100,10,0,0,0,110,117,109,58,32,37,100,32,115,105,122,101,58,32,37,100,10,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,115,101,116,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,117,110,105,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,115,117,98,116,114,97,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,105,110,116,101,114,115,101,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,97,112,112,101,110,100,95,110,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,117,110,105,111,110,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,114,101,115,101,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,119,105,116,104,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,111,112,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,111,118,101,114,108,97,112,95,112,114,111,99,95,112,116,114,44,32,105,110,116,44,32,105,110,116,41,0,0,105,110,116,32,112,105,120,109,97,110,95,99,111,97,108,101,115,99,101,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,200,9,0,0,16,0,0,0,26,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,9,0,0,16,0,0,0,6,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,0,0,0,0,128,9,0,0,0,0,0,0,144,9,0,0,192,9,0,0,0,0,0,0,0,0,0,0,160,9,0,0,200,9,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
HEAP32[((2496)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((2504)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2520)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
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
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,ELBIN:75,EDOTDOT:76,EBADMSG:77,EFTYPE:79,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENMFILE:89,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EPROCLIM:130,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,ENOSHARE:136,ECASECLASH:137,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STATIC);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,createFileHandle:function (stream, fd) {
        if (typeof stream === 'undefined') {
          stream = null;
        }
        if (!fd) {
          if (stream && stream.socket) {
            for (var i = 1; i < 64; i++) {
              if (!FS.streams[i]) {
                fd = i;
                break;
              }
            }
            assert(fd, 'ran out of low fds for sockets');
          } else {
            fd = Math.max(FS.streams.length, 64);
            for (var i = FS.streams.length; i < fd; i++) {
              FS.streams[i] = null; // Keep dense
            }
          }
        }
        // Close WebSocket first if we are about to replace the fd (i.e. dup2)
        if (FS.streams[fd] && FS.streams[fd].socket && FS.streams[fd].socket.close) {
          FS.streams[fd].socket.close();
        }
        FS.streams[fd] = stream;
        return fd;
      },removeFileHandle:function (fd) {
        FS.streams[fd] = null;
      },joinPath:function (parts, forceRelative) {
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
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
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
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
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
          if (val === null || val === 10) {
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
        stdin.isTerminal = !stdinOverridden;
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        stdout.isTerminal = !stdoutOverridden;
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        stderr.isTerminal = !stderrOverridden;
        FS.createDevice(devFolder, 'tty', input, output);
        FS.createDevice(devFolder, 'null', function(){}, function(){});
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
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
          error: false,
          eof: false,
          ungotten: []
        };
        // TODO: put these low in memory like we used to assert on: assert(Math.max(_stdin, _stdout, _stderr) < 15000); // make sure these are low, we flatten arrays with these
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
          'void*', ALLOC_NORMAL) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
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
  function _send(fd, buf, len, flags) {
      var info = FS.streams[fd];
      if (!info) return -1;
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
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
      if (stream && ('socket' in stream)) {
          return _send(fildes, buf, nbyte, 0);
      } else if (!stream) {
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
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
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
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
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
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
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
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
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
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
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
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
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
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
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
                if (next == 69) argText = argText.toUpperCase();
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
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
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
  var __pixman_log_error=undefined;
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
        _memcpy(dest, src, num) | 0;
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var _llvm_expect_i32=undefined;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
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
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
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
        case 10: return 1;
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
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
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
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
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
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
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
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
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
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        for (var j = 0; j < line.length; j++) {
          HEAP8[(((poolPtr)+(j))|0)]=line.charCodeAt(j);
        }
        HEAP8[(((poolPtr)+(j))|0)]=0;
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }
  var _llvm_va_start=undefined;
  function _llvm_va_end() {}
  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",75:"Inode is remote (not really error)",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",79:"Inappropriate file type or format",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can\t access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",89:"No more files",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"ENETRESET",127:"Socket is already connected",128:"Socket is not connected",129:"TOOMANYREFS",130:"EPROCLIM",131:"EUSERS",132:"EDQUOT",133:"ESTALE",134:"Not supported",135:"No medium (in tape drive)",136:"No such host or network path",137:"Filename exists with different case",138:"EILSEQ",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
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
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
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
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
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
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: getMimetype(name) });
              }
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
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
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
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
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
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
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
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x = event.pageX - (window.scrollX + rect.left);
          var y = event.pageY - (window.scrollY + rect.top);
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
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
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
___buildEnvironment(ENV);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0,0,__ZNSt20bad_array_new_lengthC2Ev,0,__verrx,0,__ZNSt20bad_array_new_lengthD0Ev,0,__warn,0,__verr
,0,__err,0,__ZNKSt9bad_alloc4whatEv,0,__ZNSt9bad_allocD2Ev,0,_pixman_region_intersect_o,0,__ZNKSt20bad_array_new_length4whatEv
,0,__warnx,0,__ZNSt9bad_allocC2Ev,0,__ZNSt9bad_allocD0Ev,0,__vwarn,0,__errx,0,_pixman_region_union_o,0,_pixman_region_subtract_o,0,__vwarnx];
// EMSCRIPTEN_START_FUNCS
function _pixman_region32_equal($reg1,$reg2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $i;var $rects1;var $rects2;$2=$reg1;$3=$reg2;var $4=$2;var $5=$4|0;var $6=$5|0;var $7=HEAP32[$6>>2];var $8=$3;var $9=$8|0;var $10=$9|0;var $11=HEAP32[$10>>2];var $12=($7|0)!=($11|0);if($12){label=2;break}else{label=3;break};case 2:$1=0;label=39;break;case 3:var $15=$2;var $16=$15|0;var $17=$16+8|0;var $18=HEAP32[$17>>2];var $19=$3;var $20=$19|0;var $21=$20+8|0;var $22=HEAP32[$21>>2];var $23=($18|0)!=($22|0);if($23){label=4;break}else{label=5;break};case 4:$1=0;label=39;break;case 5:var $26=$2;var $27=$26|0;var $28=$27+4|0;var $29=HEAP32[$28>>2];var $30=$3;var $31=$30|0;var $32=$31+4|0;var $33=HEAP32[$32>>2];var $34=($29|0)!=($33|0);if($34){label=6;break}else{label=7;break};case 6:$1=0;label=39;break;case 7:var $37=$2;var $38=$37|0;var $39=$38+12|0;var $40=HEAP32[$39>>2];var $41=$3;var $42=$41|0;var $43=$42+12|0;var $44=HEAP32[$43>>2];var $45=($40|0)!=($44|0);if($45){label=8;break}else{label=9;break};case 8:$1=0;label=39;break;case 9:var $48=$2;var $49=$48+16|0;var $50=HEAP32[$49>>2];var $51=($50|0)!=0;if($51){label=10;break}else{label=11;break};case 10:var $53=$2;var $54=$53+16|0;var $55=HEAP32[$54>>2];var $56=$55+4|0;var $57=HEAP32[$56>>2];var $60=$57;label=12;break;case 11:var $60=1;label=12;break;case 12:var $60;var $61=$3;var $62=$61+16|0;var $63=HEAP32[$62>>2];var $64=($63|0)!=0;if($64){label=13;break}else{label=14;break};case 13:var $66=$3;var $67=$66+16|0;var $68=HEAP32[$67>>2];var $69=$68+4|0;var $70=HEAP32[$69>>2];var $73=$70;label=15;break;case 14:var $73=1;label=15;break;case 15:var $73;var $74=($60|0)!=($73|0);if($74){label=16;break}else{label=17;break};case 16:$1=0;label=39;break;case 17:var $77=$2;var $78=$77+16|0;var $79=HEAP32[$78>>2];var $80=($79|0)!=0;if($80){label=18;break}else{label=19;break};case 18:var $82=$2;var $83=$82+16|0;var $84=HEAP32[$83>>2];var $85=$84+8|0;var $86=$85;var $91=$86;label=20;break;case 19:var $88=$2;var $89=$88|0;var $91=$89;label=20;break;case 20:var $91;$rects1=$91;var $92=$3;var $93=$92+16|0;var $94=HEAP32[$93>>2];var $95=($94|0)!=0;if($95){label=21;break}else{label=22;break};case 21:var $97=$3;var $98=$97+16|0;var $99=HEAP32[$98>>2];var $100=$99+8|0;var $101=$100;var $106=$101;label=23;break;case 22:var $103=$3;var $104=$103|0;var $106=$104;label=23;break;case 23:var $106;$rects2=$106;$i=0;label=24;break;case 24:var $108=$i;var $109=$2;var $110=$109+16|0;var $111=HEAP32[$110>>2];var $112=($111|0)!=0;if($112){label=25;break}else{label=26;break};case 25:var $114=$2;var $115=$114+16|0;var $116=HEAP32[$115>>2];var $117=$116+4|0;var $118=HEAP32[$117>>2];var $121=$118;label=27;break;case 26:var $121=1;label=27;break;case 27:var $121;var $122=($108|0)!=($121|0);if($122){label=28;break}else{label=38;break};case 28:var $124=$i;var $125=$rects1;var $126=$125+($124<<4)|0;var $127=$126|0;var $128=HEAP32[$127>>2];var $129=$i;var $130=$rects2;var $131=$130+($129<<4)|0;var $132=$131|0;var $133=HEAP32[$132>>2];var $134=($128|0)!=($133|0);if($134){label=29;break}else{label=30;break};case 29:$1=0;label=39;break;case 30:var $137=$i;var $138=$rects1;var $139=$138+($137<<4)|0;var $140=$139+8|0;var $141=HEAP32[$140>>2];var $142=$i;var $143=$rects2;var $144=$143+($142<<4)|0;var $145=$144+8|0;var $146=HEAP32[$145>>2];var $147=($141|0)!=($146|0);if($147){label=31;break}else{label=32;break};case 31:$1=0;label=39;break;case 32:var $150=$i;var $151=$rects1;var $152=$151+($150<<4)|0;var $153=$152+4|0;var $154=HEAP32[$153>>2];var $155=$i;var $156=$rects2;var $157=$156+($155<<4)|0;var $158=$157+4|0;var $159=HEAP32[$158>>2];var $160=($154|0)!=($159|0);if($160){label=33;break}else{label=34;break};case 33:$1=0;label=39;break;case 34:var $163=$i;var $164=$rects1;var $165=$164+($163<<4)|0;var $166=$165+12|0;var $167=HEAP32[$166>>2];var $168=$i;var $169=$rects2;var $170=$169+($168<<4)|0;var $171=$170+12|0;var $172=HEAP32[$171>>2];var $173=($167|0)!=($172|0);if($173){label=35;break}else{label=36;break};case 35:$1=0;label=39;break;case 36:label=37;break;case 37:var $177=$i;var $178=$177+1|0;$i=$178;label=24;break;case 38:$1=1;label=39;break;case 39:var $181=$1;return $181}}function _pixman_region32_n_rects($region){var label=0;label=1;while(1)switch(label){case 1:var $1;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{label=3;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9+4|0;var $11=HEAP32[$10>>2];var $14=$11;label=4;break;case 3:var $14=1;label=4;break;case 4:var $14;return $14}}function _pixman_region32_rectangles($region,$n_rects){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;$1=$region;$2=$n_rects;var $3=$2;var $4=($3|0)!=0;if($4){label=2;break}else{label=6;break};case 2:var $6=$1;var $7=$6+16|0;var $8=HEAP32[$7>>2];var $9=($8|0)!=0;if($9){label=3;break}else{label=4;break};case 3:var $11=$1;var $12=$11+16|0;var $13=HEAP32[$12>>2];var $14=$13+4|0;var $15=HEAP32[$14>>2];var $18=$15;label=5;break;case 4:var $18=1;label=5;break;case 5:var $18;var $19=$2;HEAP32[$19>>2]=$18;label=6;break;case 6:var $21=$1;var $22=$21+16|0;var $23=HEAP32[$22>>2];var $24=($23|0)!=0;if($24){label=7;break}else{label=8;break};case 7:var $26=$1;var $27=$26+16|0;var $28=HEAP32[$27>>2];var $29=$28+8|0;var $30=$29;var $35=$30;label=9;break;case 8:var $32=$1;var $33=$32|0;var $35=$33;label=9;break;case 9:var $35;return $35}}function _pixman_region32_print($rgn){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1;var $num;var $size;var $i;var $rects;$1=$rgn;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{label=3;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9+4|0;var $11=HEAP32[$10>>2];var $14=$11;label=4;break;case 3:var $14=1;label=4;break;case 4:var $14;$num=$14;var $15=$1;var $16=$15+16|0;var $17=HEAP32[$16>>2];var $18=($17|0)!=0;if($18){label=5;break}else{label=6;break};case 5:var $20=$1;var $21=$20+16|0;var $22=HEAP32[$21>>2];var $23=$22|0;var $24=HEAP32[$23>>2];var $27=$24;label=7;break;case 6:var $27=0;label=7;break;case 7:var $27;$size=$27;var $28=$1;var $29=$28+16|0;var $30=HEAP32[$29>>2];var $31=($30|0)!=0;if($31){label=8;break}else{label=9;break};case 8:var $33=$1;var $34=$33+16|0;var $35=HEAP32[$34>>2];var $36=$35+8|0;var $37=$36;var $42=$37;label=10;break;case 9:var $39=$1;var $40=$39|0;var $42=$40;label=10;break;case 10:var $42;$rects=$42;var $43=HEAP32[_stderr>>2];var $44=$num;var $45=$size;var $46=_fprintf($43,1328,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=$44,HEAP32[tempInt+8>>2]=$45,tempInt));var $47=HEAP32[_stderr>>2];var $48=$1;var $49=$48|0;var $50=$49|0;var $51=HEAP32[$50>>2];var $52=$1;var $53=$52|0;var $54=$53+4|0;var $55=HEAP32[$54>>2];var $56=$1;var $57=$56|0;var $58=$57+8|0;var $59=HEAP32[$58>>2];var $60=$1;var $61=$60|0;var $62=$61+12|0;var $63=HEAP32[$62>>2];var $64=_fprintf($47,1304,(tempInt=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[tempInt>>2]=$51,HEAP32[tempInt+8>>2]=$55,HEAP32[tempInt+16>>2]=$59,HEAP32[tempInt+24>>2]=$63,tempInt));$i=0;label=11;break;case 11:var $66=$i;var $67=$num;var $68=($66|0)<($67|0);if($68){label=12;break}else{label=14;break};case 12:var $70=HEAP32[_stderr>>2];var $71=$i;var $72=$rects;var $73=$72+($71<<4)|0;var $74=$73|0;var $75=HEAP32[$74>>2];var $76=$i;var $77=$rects;var $78=$77+($76<<4)|0;var $79=$78+4|0;var $80=HEAP32[$79>>2];var $81=$i;var $82=$rects;var $83=$82+($81<<4)|0;var $84=$83+8|0;var $85=HEAP32[$84>>2];var $86=$i;var $87=$rects;var $88=$87+($86<<4)|0;var $89=$88+12|0;var $90=HEAP32[$89>>2];var $91=_fprintf($70,752,(tempInt=STACKTOP,STACKTOP=STACKTOP+32|0,HEAP32[tempInt>>2]=$75,HEAP32[tempInt+8>>2]=$80,HEAP32[tempInt+16>>2]=$85,HEAP32[tempInt+24>>2]=$90,tempInt));label=13;break;case 13:var $93=$i;var $94=$93+1|0;$i=$94;label=11;break;case 14:var $96=HEAP32[_stderr>>2];var $97=_fprintf($96,688,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+7>>3<<3,HEAP32[tempInt>>2]=0,tempInt));var $98=$num;STACKTOP=sp;return $98}}function _pixman_region32_init($region){var $1;$1=$region;var $5=$1|0;var $6=HEAP32[176>>2];HEAP32[$5>>2]=HEAP32[$6>>2];HEAP32[$5+4>>2]=HEAP32[$6+4>>2];HEAP32[$5+8>>2]=HEAP32[$6+8>>2];HEAP32[$5+12>>2]=HEAP32[$6+12>>2];HEAP32[$1+16>>2]=HEAP32[168>>2];return}function _pixman_region32_init_rect($region,$x,$y,$width,$height){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;$1=$region;$2=$x;$3=$y;$4=$width;$5=$height;var $6=$2;var $7=$1;var $8=$7|0;var $9=$8|0;HEAP32[$9>>2]=$6;var $10=$3;var $11=$1;var $12=$11|0;var $13=$12+4|0;HEAP32[$13>>2]=$10;var $14=$2;var $15=$4;var $16=$14+$15|0;var $17=$1;var $18=$17|0;var $19=$18+8|0;HEAP32[$19>>2]=$16;var $20=$3;var $21=$5;var $22=$20+$21|0;var $23=$1;var $24=$23|0;var $25=$24+12|0;HEAP32[$25>>2]=$22;var $26=$1;var $27=$26|0;var $28=$27|0;var $29=HEAP32[$28>>2];var $30=$1;var $31=$30|0;var $32=$31+8|0;var $33=HEAP32[$32>>2];var $34=($29|0)<($33|0);if($34){label=2;break}else{label=3;break};case 2:var $36=$1;var $37=$36|0;var $38=$37+4|0;var $39=HEAP32[$38>>2];var $40=$1;var $41=$40|0;var $42=$41+12|0;var $43=HEAP32[$42>>2];var $44=($39|0)<($43|0);if($44){label=7;break}else{label=3;break};case 3:var $46=$1;var $47=$46|0;var $48=$47|0;var $49=HEAP32[$48>>2];var $50=$1;var $51=$50|0;var $52=$51+8|0;var $53=HEAP32[$52>>2];var $54=($49|0)>($53|0);if($54){label=5;break}else{label=4;break};case 4:var $56=$1;var $57=$56|0;var $58=$57+4|0;var $59=HEAP32[$58>>2];var $60=$1;var $61=$60|0;var $62=$61+12|0;var $63=HEAP32[$62>>2];var $64=($59|0)>($63|0);if($64){label=5;break}else{label=6;break};case 5:__pixman_log_error(2128,640);label=6;break;case 6:var $67=$1;_pixman_region32_init($67);label=8;break;case 7:var $69=$1;var $70=$69+16|0;HEAP32[$70>>2]=0;label=8;break;case 8:return}}function _pixman_region32_init_with_extents($region,$extents){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;$1=$region;$2=$extents;var $3=$2;var $4=$3|0;var $5=HEAP32[$4>>2];var $6=$2;var $7=$6+8|0;var $8=HEAP32[$7>>2];var $9=($5|0)<($8|0);if($9){label=2;break}else{label=3;break};case 2:var $11=$2;var $12=$11+4|0;var $13=HEAP32[$12>>2];var $14=$2;var $15=$14+12|0;var $16=HEAP32[$15>>2];var $17=($13|0)<($16|0);if($17){label=7;break}else{label=3;break};case 3:var $19=$2;var $20=$19|0;var $21=HEAP32[$20>>2];var $22=$2;var $23=$22+8|0;var $24=HEAP32[$23>>2];var $25=($21|0)>($24|0);if($25){label=5;break}else{label=4;break};case 4:var $27=$2;var $28=$27+4|0;var $29=HEAP32[$28>>2];var $30=$2;var $31=$30+12|0;var $32=HEAP32[$31>>2];var $33=($29|0)>($32|0);if($33){label=5;break}else{label=6;break};case 5:__pixman_log_error(2056,640);label=6;break;case 6:var $36=$1;_pixman_region32_init($36);label=8;break;case 7:var $38=$1;var $39=$38|0;var $40=$2;var $41=$39;var $42=$40;HEAP32[$41>>2]=HEAP32[$42>>2];HEAP32[$41+4>>2]=HEAP32[$42+4>>2];HEAP32[$41+8>>2]=HEAP32[$42+8>>2];HEAP32[$41+12>>2]=HEAP32[$42+12>>2];var $43=$1;var $44=$43+16|0;HEAP32[$44>>2]=0;label=8;break;case 8:return}}function _pixman_region32_fini($region){var label=0;label=1;while(1)switch(label){case 1:var $1;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{label=4;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9|0;var $11=HEAP32[$10>>2];var $12=($11|0)!=0;if($12){label=3;break}else{label=4;break};case 3:var $14=$1;var $15=$14+16|0;var $16=HEAP32[$15>>2];var $17=$16;_free($17);label=4;break;case 4:return}}function _pixman_region32_copy($dst,$src){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;$2=$dst;$3=$src;var $4=$2;var $5=$3;var $6=($4|0)==($5|0);if($6){label=2;break}else{label=3;break};case 2:$1=1;label=18;break;case 3:var $9=$2;var $10=$9|0;var $11=$3;var $12=$11|0;var $13=$10;var $14=$12;HEAP32[$13>>2]=HEAP32[$14>>2];HEAP32[$13+4>>2]=HEAP32[$14+4>>2];HEAP32[$13+8>>2]=HEAP32[$14+8>>2];HEAP32[$13+12>>2]=HEAP32[$14+12>>2];var $15=$3;var $16=$15+16|0;var $17=HEAP32[$16>>2];var $18=($17|0)!=0;if($18){label=4;break}else{label=5;break};case 4:var $20=$3;var $21=$20+16|0;var $22=HEAP32[$21>>2];var $23=$22|0;var $24=HEAP32[$23>>2];var $25=($24|0)!=0;if($25){label=9;break}else{label=5;break};case 5:var $27=$2;var $28=$27+16|0;var $29=HEAP32[$28>>2];var $30=($29|0)!=0;if($30){label=6;break}else{label=8;break};case 6:var $32=$2;var $33=$32+16|0;var $34=HEAP32[$33>>2];var $35=$34|0;var $36=HEAP32[$35>>2];var $37=($36|0)!=0;if($37){label=7;break}else{label=8;break};case 7:var $39=$2;var $40=$39+16|0;var $41=HEAP32[$40>>2];var $42=$41;_free($42);label=8;break;case 8:var $44=$3;var $45=$44+16|0;var $46=HEAP32[$45>>2];var $47=$2;var $48=$47+16|0;HEAP32[$48>>2]=$46;$1=1;label=18;break;case 9:var $50=$2;var $51=$50+16|0;var $52=HEAP32[$51>>2];var $53=($52|0)!=0;if($53){label=10;break}else{label=11;break};case 10:var $55=$2;var $56=$55+16|0;var $57=HEAP32[$56>>2];var $58=$57|0;var $59=HEAP32[$58>>2];var $60=$3;var $61=$60+16|0;var $62=HEAP32[$61>>2];var $63=$62+4|0;var $64=HEAP32[$63>>2];var $65=($59|0)<($64|0);if($65){label=11;break}else{label=17;break};case 11:var $67=$2;var $68=$67+16|0;var $69=HEAP32[$68>>2];var $70=($69|0)!=0;if($70){label=12;break}else{label=14;break};case 12:var $72=$2;var $73=$72+16|0;var $74=HEAP32[$73>>2];var $75=$74|0;var $76=HEAP32[$75>>2];var $77=($76|0)!=0;if($77){label=13;break}else{label=14;break};case 13:var $79=$2;var $80=$79+16|0;var $81=HEAP32[$80>>2];var $82=$81;_free($82);label=14;break;case 14:var $84=$3;var $85=$84+16|0;var $86=HEAP32[$85>>2];var $87=$86+4|0;var $88=HEAP32[$87>>2];var $89=_alloc_data($88);var $90=$2;var $91=$90+16|0;HEAP32[$91>>2]=$89;var $92=$2;var $93=$92+16|0;var $94=HEAP32[$93>>2];var $95=($94|0)!=0;if($95){label=16;break}else{label=15;break};case 15:var $97=$2;var $98=_pixman_break($97);$1=$98;label=18;break;case 16:var $100=$3;var $101=$100+16|0;var $102=HEAP32[$101>>2];var $103=$102+4|0;var $104=HEAP32[$103>>2];var $105=$2;var $106=$105+16|0;var $107=HEAP32[$106>>2];var $108=$107|0;HEAP32[$108>>2]=$104;label=17;break;case 17:var $110=$3;var $111=$110+16|0;var $112=HEAP32[$111>>2];var $113=$112+4|0;var $114=HEAP32[$113>>2];var $115=$2;var $116=$115+16|0;var $117=HEAP32[$116>>2];var $118=$117+4|0;HEAP32[$118>>2]=$114;var $119=$2;var $120=$119+16|0;var $121=HEAP32[$120>>2];var $122=$121+8|0;var $123=$122;var $124=$123;var $125=$3;var $126=$125+16|0;var $127=HEAP32[$126>>2];var $128=$127+8|0;var $129=$128;var $130=$129;var $131=$2;var $132=$131+16|0;var $133=HEAP32[$132>>2];var $134=$133+4|0;var $135=HEAP32[$134>>2];var $136=$135<<4;_memmove($124,$130,$136,1,0);$1=1;label=18;break;case 18:var $138=$1;return $138}}function _alloc_data($n){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $sz;$2=$n;var $3=$2;var $4=_PIXREGION_SZOF($3);$sz=$4;var $5=$sz;var $6=($5|0)!=0;if($6){label=3;break}else{label=2;break};case 2:$1=0;label=4;break;case 3:var $9=$sz;var $10=_malloc($9);var $11=$10;$1=$11;label=4;break;case 4:var $13=$1;return $13}}function _pixman_break($region){var label=0;label=1;while(1)switch(label){case 1:var $1;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{label=4;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9|0;var $11=HEAP32[$10>>2];var $12=($11|0)!=0;if($12){label=3;break}else{label=4;break};case 3:var $14=$1;var $15=$14+16|0;var $16=HEAP32[$15>>2];var $17=$16;_free($17);label=4;break;case 4:var $19=$1;var $20=$19|0;var $21=HEAP32[176>>2];var $22=$20;var $23=$21;HEAP32[$22>>2]=HEAP32[$23>>2];HEAP32[$22+4>>2]=HEAP32[$23+4>>2];HEAP32[$22+8>>2]=HEAP32[$23+8>>2];HEAP32[$22+12>>2]=HEAP32[$23+12>>2];var $24=HEAP32[184>>2];var $25=$1;var $26=$25+16|0;HEAP32[$26>>2]=$24;return 0}}function _pixman_region32_intersect($new_reg,$reg1,$reg2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;$2=$new_reg;$3=$reg1;$4=$reg2;var $5=$3;var $6=$5+16|0;var $7=HEAP32[$6>>2];var $8=($7|0)!=0;if($8){label=2;break}else{label=3;break};case 2:var $10=$3;var $11=$10+16|0;var $12=HEAP32[$11>>2];var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=($14|0)!=0;if($15){label=3;break}else{label=9;break};case 3:var $17=$4;var $18=$17+16|0;var $19=HEAP32[$18>>2];var $20=($19|0)!=0;if($20){label=4;break}else{label=5;break};case 4:var $22=$4;var $23=$22+16|0;var $24=HEAP32[$23>>2];var $25=$24+4|0;var $26=HEAP32[$25>>2];var $27=($26|0)!=0;if($27){label=5;break}else{label=9;break};case 5:var $29=$3;var $30=$29|0;var $31=$30+8|0;var $32=HEAP32[$31>>2];var $33=$4;var $34=$33|0;var $35=$34|0;var $36=HEAP32[$35>>2];var $37=($32|0)<=($36|0);if($37){label=9;break}else{label=6;break};case 6:var $39=$3;var $40=$39|0;var $41=$40|0;var $42=HEAP32[$41>>2];var $43=$4;var $44=$43|0;var $45=$44+8|0;var $46=HEAP32[$45>>2];var $47=($42|0)>=($46|0);if($47){label=9;break}else{label=7;break};case 7:var $49=$3;var $50=$49|0;var $51=$50+12|0;var $52=HEAP32[$51>>2];var $53=$4;var $54=$53|0;var $55=$54+4|0;var $56=HEAP32[$55>>2];var $57=($52|0)<=($56|0);if($57){label=9;break}else{label=8;break};case 8:var $59=$3;var $60=$59|0;var $61=$60+4|0;var $62=HEAP32[$61>>2];var $63=$4;var $64=$63|0;var $65=$64+12|0;var $66=HEAP32[$65>>2];var $67=($62|0)>=($66|0);if($67){label=9;break}else{label=17;break};case 9:var $69=$2;var $70=$69+16|0;var $71=HEAP32[$70>>2];var $72=($71|0)!=0;if($72){label=10;break}else{label=12;break};case 10:var $74=$2;var $75=$74+16|0;var $76=HEAP32[$75>>2];var $77=$76|0;var $78=HEAP32[$77>>2];var $79=($78|0)!=0;if($79){label=11;break}else{label=12;break};case 11:var $81=$2;var $82=$81+16|0;var $83=HEAP32[$82>>2];var $84=$83;_free($84);label=12;break;case 12:var $86=$2;var $87=$86|0;var $88=$87|0;var $89=HEAP32[$88>>2];var $90=$2;var $91=$90|0;var $92=$91+8|0;HEAP32[$92>>2]=$89;var $93=$2;var $94=$93|0;var $95=$94+4|0;var $96=HEAP32[$95>>2];var $97=$2;var $98=$97|0;var $99=$98+12|0;HEAP32[$99>>2]=$96;var $100=$3;var $101=$100+16|0;var $102=HEAP32[$101>>2];var $103=HEAP32[184>>2];var $104=($102|0)==($103|0);if($104){label=14;break}else{label=13;break};case 13:var $106=$4;var $107=$106+16|0;var $108=HEAP32[$107>>2];var $109=HEAP32[184>>2];var $110=($108|0)==($109|0);if($110){label=14;break}else{label=15;break};case 14:var $112=HEAP32[184>>2];var $113=$2;var $114=$113+16|0;HEAP32[$114>>2]=$112;$1=0;label=57;break;case 15:var $116=HEAP32[168>>2];var $117=$2;var $118=$117+16|0;HEAP32[$118>>2]=$116;label=16;break;case 16:label=56;break;case 17:var $121=$3;var $122=$121+16|0;var $123=HEAP32[$122>>2];var $124=($123|0)!=0;if($124){label=35;break}else{label=18;break};case 18:var $126=$4;var $127=$126+16|0;var $128=HEAP32[$127>>2];var $129=($128|0)!=0;if($129){label=35;break}else{label=19;break};case 19:var $131=$3;var $132=$131|0;var $133=$132|0;var $134=HEAP32[$133>>2];var $135=$4;var $136=$135|0;var $137=$136|0;var $138=HEAP32[$137>>2];var $139=($134|0)>($138|0);if($139){label=20;break}else{label=21;break};case 20:var $141=$3;var $142=$141|0;var $143=$142|0;var $144=HEAP32[$143>>2];var $151=$144;label=22;break;case 21:var $146=$4;var $147=$146|0;var $148=$147|0;var $149=HEAP32[$148>>2];var $151=$149;label=22;break;case 22:var $151;var $152=$2;var $153=$152|0;var $154=$153|0;HEAP32[$154>>2]=$151;var $155=$3;var $156=$155|0;var $157=$156+4|0;var $158=HEAP32[$157>>2];var $159=$4;var $160=$159|0;var $161=$160+4|0;var $162=HEAP32[$161>>2];var $163=($158|0)>($162|0);if($163){label=23;break}else{label=24;break};case 23:var $165=$3;var $166=$165|0;var $167=$166+4|0;var $168=HEAP32[$167>>2];var $175=$168;label=25;break;case 24:var $170=$4;var $171=$170|0;var $172=$171+4|0;var $173=HEAP32[$172>>2];var $175=$173;label=25;break;case 25:var $175;var $176=$2;var $177=$176|0;var $178=$177+4|0;HEAP32[$178>>2]=$175;var $179=$3;var $180=$179|0;var $181=$180+8|0;var $182=HEAP32[$181>>2];var $183=$4;var $184=$183|0;var $185=$184+8|0;var $186=HEAP32[$185>>2];var $187=($182|0)<($186|0);if($187){label=26;break}else{label=27;break};case 26:var $189=$3;var $190=$189|0;var $191=$190+8|0;var $192=HEAP32[$191>>2];var $199=$192;label=28;break;case 27:var $194=$4;var $195=$194|0;var $196=$195+8|0;var $197=HEAP32[$196>>2];var $199=$197;label=28;break;case 28:var $199;var $200=$2;var $201=$200|0;var $202=$201+8|0;HEAP32[$202>>2]=$199;var $203=$3;var $204=$203|0;var $205=$204+12|0;var $206=HEAP32[$205>>2];var $207=$4;var $208=$207|0;var $209=$208+12|0;var $210=HEAP32[$209>>2];var $211=($206|0)<($210|0);if($211){label=29;break}else{label=30;break};case 29:var $213=$3;var $214=$213|0;var $215=$214+12|0;var $216=HEAP32[$215>>2];var $223=$216;label=31;break;case 30:var $218=$4;var $219=$218|0;var $220=$219+12|0;var $221=HEAP32[$220>>2];var $223=$221;label=31;break;case 31:var $223;var $224=$2;var $225=$224|0;var $226=$225+12|0;HEAP32[$226>>2]=$223;var $227=$2;var $228=$227+16|0;var $229=HEAP32[$228>>2];var $230=($229|0)!=0;if($230){label=32;break}else{label=34;break};case 32:var $232=$2;var $233=$232+16|0;var $234=HEAP32[$233>>2];var $235=$234|0;var $236=HEAP32[$235>>2];var $237=($236|0)!=0;if($237){label=33;break}else{label=34;break};case 33:var $239=$2;var $240=$239+16|0;var $241=HEAP32[$240>>2];var $242=$241;_free($242);label=34;break;case 34:var $244=$2;var $245=$244+16|0;HEAP32[$245>>2]=0;label=55;break;case 35:var $247=$4;var $248=$247+16|0;var $249=HEAP32[$248>>2];var $250=($249|0)!=0;if($250){label=41;break}else{label=36;break};case 36:var $252=$4;var $253=$252|0;var $254=$253|0;var $255=HEAP32[$254>>2];var $256=$3;var $257=$256|0;var $258=$257|0;var $259=HEAP32[$258>>2];var $260=($255|0)<=($259|0);if($260){label=37;break}else{label=41;break};case 37:var $262=$4;var $263=$262|0;var $264=$263+8|0;var $265=HEAP32[$264>>2];var $266=$3;var $267=$266|0;var $268=$267+8|0;var $269=HEAP32[$268>>2];var $270=($265|0)>=($269|0);if($270){label=38;break}else{label=41;break};case 38:var $272=$4;var $273=$272|0;var $274=$273+4|0;var $275=HEAP32[$274>>2];var $276=$3;var $277=$276|0;var $278=$277+4|0;var $279=HEAP32[$278>>2];var $280=($275|0)<=($279|0);if($280){label=39;break}else{label=41;break};case 39:var $282=$4;var $283=$282|0;var $284=$283+12|0;var $285=HEAP32[$284>>2];var $286=$3;var $287=$286|0;var $288=$287+12|0;var $289=HEAP32[$288>>2];var $290=($285|0)>=($289|0);if($290){label=40;break}else{label=41;break};case 40:var $292=$2;var $293=$3;var $294=_pixman_region32_copy($292,$293);$1=$294;label=57;break;case 41:var $296=$3;var $297=$296+16|0;var $298=HEAP32[$297>>2];var $299=($298|0)!=0;if($299){label=47;break}else{label=42;break};case 42:var $301=$3;var $302=$301|0;var $303=$302|0;var $304=HEAP32[$303>>2];var $305=$4;var $306=$305|0;var $307=$306|0;var $308=HEAP32[$307>>2];var $309=($304|0)<=($308|0);if($309){label=43;break}else{label=47;break};case 43:var $311=$3;var $312=$311|0;var $313=$312+8|0;var $314=HEAP32[$313>>2];var $315=$4;var $316=$315|0;var $317=$316+8|0;var $318=HEAP32[$317>>2];var $319=($314|0)>=($318|0);if($319){label=44;break}else{label=47;break};case 44:var $321=$3;var $322=$321|0;var $323=$322+4|0;var $324=HEAP32[$323>>2];var $325=$4;var $326=$325|0;var $327=$326+4|0;var $328=HEAP32[$327>>2];var $329=($324|0)<=($328|0);if($329){label=45;break}else{label=47;break};case 45:var $331=$3;var $332=$331|0;var $333=$332+12|0;var $334=HEAP32[$333>>2];var $335=$4;var $336=$335|0;var $337=$336+12|0;var $338=HEAP32[$337>>2];var $339=($334|0)>=($338|0);if($339){label=46;break}else{label=47;break};case 46:var $341=$2;var $342=$4;var $343=_pixman_region32_copy($341,$342);$1=$343;label=57;break;case 47:var $345=$3;var $346=$4;var $347=($345|0)==($346|0);if($347){label=48;break}else{label=49;break};case 48:var $349=$2;var $350=$3;var $351=_pixman_region32_copy($349,$350);$1=$351;label=57;break;case 49:var $353=$2;var $354=$3;var $355=$4;var $356=_pixman_op($353,$354,$355,18,0,0);var $357=($356|0)!=0;if($357){label=51;break}else{label=50;break};case 50:$1=0;label=57;break;case 51:var $360=$2;_pixman_set_extents($360);label=52;break;case 52:label=53;break;case 53:label=54;break;case 54:label=55;break;case 55:label=56;break;case 56:$1=1;label=57;break;case 57:var $367=$1;return $367}}function _pixman_op($new_reg,$reg1,$reg2,$overlap_func,$append_non1,$append_non2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $7;var $r1;var $r2;var $r1_end;var $r2_end;var $ybot;var $ytop;var $old_data;var $prev_band;var $cur_band;var $r1_band_end;var $r2_band_end;var $top;var $bot;var $r1y1;var $r2y1;var $new_size;var $numRects;var $new_rects;var $new_rects1;var $new_data;var $data_size;$2=$new_reg;$3=$reg1;$4=$reg2;$5=$overlap_func;$6=$append_non1;$7=$append_non2;var $8=$3;var $9=$8+16|0;var $10=HEAP32[$9>>2];var $11=HEAP32[184>>2];var $12=($10|0)==($11|0);if($12){label=3;break}else{label=2;break};case 2:var $14=$4;var $15=$14+16|0;var $16=HEAP32[$15>>2];var $17=HEAP32[184>>2];var $18=($16|0)==($17|0);if($18){label=3;break}else{label=4;break};case 3:var $20=$2;var $21=_pixman_break($20);$1=$21;label=213;break;case 4:var $23=$3;var $24=$23+16|0;var $25=HEAP32[$24>>2];var $26=($25|0)!=0;if($26){label=5;break}else{label=6;break};case 5:var $28=$3;var $29=$28+16|0;var $30=HEAP32[$29>>2];var $31=$30+8|0;var $32=$31;var $37=$32;label=7;break;case 6:var $34=$3;var $35=$34|0;var $37=$35;label=7;break;case 7:var $37;$r1=$37;var $38=$3;var $39=$38+16|0;var $40=HEAP32[$39>>2];var $41=($40|0)!=0;if($41){label=8;break}else{label=9;break};case 8:var $43=$3;var $44=$43+16|0;var $45=HEAP32[$44>>2];var $46=$45+4|0;var $47=HEAP32[$46>>2];var $50=$47;label=10;break;case 9:var $50=1;label=10;break;case 10:var $50;$new_size=$50;var $51=$r1;var $52=$new_size;var $53=$51+($52<<4)|0;$r1_end=$53;var $54=$4;var $55=$54+16|0;var $56=HEAP32[$55>>2];var $57=($56|0)!=0;if($57){label=11;break}else{label=12;break};case 11:var $59=$4;var $60=$59+16|0;var $61=HEAP32[$60>>2];var $62=$61+4|0;var $63=HEAP32[$62>>2];var $66=$63;label=13;break;case 12:var $66=1;label=13;break;case 13:var $66;$numRects=$66;var $67=$4;var $68=$67+16|0;var $69=HEAP32[$68>>2];var $70=($69|0)!=0;if($70){label=14;break}else{label=15;break};case 14:var $72=$4;var $73=$72+16|0;var $74=HEAP32[$73>>2];var $75=$74+8|0;var $76=$75;var $81=$76;label=16;break;case 15:var $78=$4;var $79=$78|0;var $81=$79;label=16;break;case 16:var $81;$r2=$81;var $82=$r2;var $83=$numRects;var $84=$82+($83<<4)|0;$r2_end=$84;label=17;break;case 17:var $86=$r1;var $87=$r1_end;var $88=($86|0)!=($87|0);var $89=$88^1;var $90=$89&1;var $91=$90;var $92=($91|0)!=0;if($92){label=18;break}else{label=19;break};case 18:__pixman_log_error(2216,960);label=19;break;case 19:label=20;break;case 20:label=21;break;case 21:var $97=$r2;var $98=$r2_end;var $99=($97|0)!=($98|0);var $100=$99^1;var $101=$100&1;var $102=$101;var $103=($102|0)!=0;if($103){label=22;break}else{label=23;break};case 22:__pixman_log_error(2216,896);label=23;break;case 23:label=24;break;case 24:$old_data=0;var $107=$2;var $108=$3;var $109=($107|0)==($108|0);if($109){label=25;break}else{label=26;break};case 25:var $111=$new_size;var $112=($111|0)>1;if($112){label=28;break}else{label=26;break};case 26:var $114=$2;var $115=$4;var $116=($114|0)==($115|0);if($116){label=27;break}else{label=29;break};case 27:var $118=$numRects;var $119=($118|0)>1;if($119){label=28;break}else{label=29;break};case 28:var $121=$2;var $122=$121+16|0;var $123=HEAP32[$122>>2];$old_data=$123;var $124=HEAP32[168>>2];var $125=$2;var $126=$125+16|0;HEAP32[$126>>2]=$124;label=29;break;case 29:var $128=$numRects;var $129=$new_size;var $130=($128|0)>($129|0);if($130){label=30;break}else{label=31;break};case 30:var $132=$numRects;$new_size=$132;label=31;break;case 31:var $134=$new_size;var $135=$134<<1;$new_size=$135;var $136=$2;var $137=$136+16|0;var $138=HEAP32[$137>>2];var $139=($138|0)!=0;if($139){label=33;break}else{label=32;break};case 32:var $141=HEAP32[168>>2];var $142=$2;var $143=$142+16|0;HEAP32[$143>>2]=$141;label=36;break;case 33:var $145=$2;var $146=$145+16|0;var $147=HEAP32[$146>>2];var $148=$147|0;var $149=HEAP32[$148>>2];var $150=($149|0)!=0;if($150){label=34;break}else{label=35;break};case 34:var $152=$2;var $153=$152+16|0;var $154=HEAP32[$153>>2];var $155=$154+4|0;HEAP32[$155>>2]=0;label=35;break;case 35:label=36;break;case 36:var $158=$new_size;var $159=$2;var $160=$159+16|0;var $161=HEAP32[$160>>2];var $162=$161|0;var $163=HEAP32[$162>>2];var $164=($158|0)>($163|0);if($164){label=37;break}else{label=40;break};case 37:var $166=$2;var $167=$new_size;var $168=_pixman_rect_alloc($166,$167);var $169=($168|0)!=0;if($169){label=39;break}else{label=38;break};case 38:var $171=$old_data;var $172=$171;_free($172);$1=0;label=213;break;case 39:label=40;break;case 40:var $175=$r1;var $176=$175+4|0;var $177=HEAP32[$176>>2];var $178=$r2;var $179=$178+4|0;var $180=HEAP32[$179>>2];var $181=($177|0)<($180|0);if($181){label=41;break}else{label=42;break};case 41:var $183=$r1;var $184=$183+4|0;var $185=HEAP32[$184>>2];var $191=$185;label=43;break;case 42:var $187=$r2;var $188=$187+4|0;var $189=HEAP32[$188>>2];var $191=$189;label=43;break;case 43:var $191;$ybot=$191;$prev_band=0;label=44;break;case 44:label=45;break;case 45:var $194=$r1;var $195=$r1_end;var $196=($194|0)!=($195|0);var $197=$196^1;var $198=$197&1;var $199=$198;var $200=($199|0)!=0;if($200){label=46;break}else{label=47;break};case 46:__pixman_log_error(2216,960);label=47;break;case 47:label=48;break;case 48:label=49;break;case 49:var $205=$r2;var $206=$r2_end;var $207=($205|0)!=($206|0);var $208=$207^1;var $209=$208&1;var $210=$209;var $211=($210|0)!=0;if($211){label=50;break}else{label=51;break};case 50:__pixman_log_error(2216,896);label=51;break;case 51:label=52;break;case 52:label=53;break;case 53:var $216=$r1;var $217=$216+4|0;var $218=HEAP32[$217>>2];$r1y1=$218;var $219=$r1;var $220=$219+16|0;$r1_band_end=$220;label=54;break;case 54:var $222=$r1_band_end;var $223=$r1_end;var $224=($222|0)!=($223|0);if($224){label=55;break}else{var $232=0;label=56;break};case 55:var $226=$r1_band_end;var $227=$226+4|0;var $228=HEAP32[$227>>2];var $229=$r1y1;var $230=($228|0)==($229|0);var $232=$230;label=56;break;case 56:var $232;if($232){label=57;break}else{label=58;break};case 57:var $234=$r1_band_end;var $235=$234+16|0;$r1_band_end=$235;label=54;break;case 58:label=59;break;case 59:label=60;break;case 60:var $239=$r2;var $240=$239+4|0;var $241=HEAP32[$240>>2];$r2y1=$241;var $242=$r2;var $243=$242+16|0;$r2_band_end=$243;label=61;break;case 61:var $245=$r2_band_end;var $246=$r2_end;var $247=($245|0)!=($246|0);if($247){label=62;break}else{var $255=0;label=63;break};case 62:var $249=$r2_band_end;var $250=$249+4|0;var $251=HEAP32[$250>>2];var $252=$r2y1;var $253=($251|0)==($252|0);var $255=$253;label=63;break;case 63:var $255;if($255){label=64;break}else{label=65;break};case 64:var $257=$r2_band_end;var $258=$257+16|0;$r2_band_end=$258;label=61;break;case 65:label=66;break;case 66:var $261=$r1y1;var $262=$r2y1;var $263=($261|0)<($262|0);if($263){label=67;break}else{label=85;break};case 67:var $265=$6;var $266=($265|0)!=0;if($266){label=68;break}else{label=84;break};case 68:var $268=$r1y1;var $269=$ybot;var $270=($268|0)>($269|0);if($270){label=69;break}else{label=70;break};case 69:var $272=$r1y1;var $276=$272;label=71;break;case 70:var $274=$ybot;var $276=$274;label=71;break;case 71:var $276;$top=$276;var $277=$r1;var $278=$277+12|0;var $279=HEAP32[$278>>2];var $280=$r2y1;var $281=($279|0)<($280|0);if($281){label=72;break}else{label=73;break};case 72:var $283=$r1;var $284=$283+12|0;var $285=HEAP32[$284>>2];var $289=$285;label=74;break;case 73:var $287=$r2y1;var $289=$287;label=74;break;case 74:var $289;$bot=$289;var $290=$top;var $291=$bot;var $292=($290|0)!=($291|0);if($292){label=75;break}else{label=83;break};case 75:var $294=$2;var $295=$294+16|0;var $296=HEAP32[$295>>2];var $297=$296+4|0;var $298=HEAP32[$297>>2];$cur_band=$298;var $299=$2;var $300=$r1;var $301=$r1_band_end;var $302=$top;var $303=$bot;var $304=_pixman_region_append_non_o($299,$300,$301,$302,$303);var $305=($304|0)!=0;if($305){label=77;break}else{label=76;break};case 76:label=212;break;case 77:label=78;break;case 78:var $309=$cur_band;var $310=$prev_band;var $311=$309-$310|0;var $312=$2;var $313=$312+16|0;var $314=HEAP32[$313>>2];var $315=$314+4|0;var $316=HEAP32[$315>>2];var $317=$cur_band;var $318=$316-$317|0;var $319=($311|0)==($318|0);if($319){label=79;break}else{label=80;break};case 79:var $321=$2;var $322=$prev_band;var $323=$cur_band;var $324=_pixman_coalesce($321,$322,$323);$prev_band=$324;label=81;break;case 80:var $326=$cur_band;$prev_band=$326;label=81;break;case 81:label=82;break;case 82:label=83;break;case 83:label=84;break;case 84:var $331=$r2y1;$ytop=$331;label=106;break;case 85:var $333=$r2y1;var $334=$r1y1;var $335=($333|0)<($334|0);if($335){label=86;break}else{label=104;break};case 86:var $337=$7;var $338=($337|0)!=0;if($338){label=87;break}else{label=103;break};case 87:var $340=$r2y1;var $341=$ybot;var $342=($340|0)>($341|0);if($342){label=88;break}else{label=89;break};case 88:var $344=$r2y1;var $348=$344;label=90;break;case 89:var $346=$ybot;var $348=$346;label=90;break;case 90:var $348;$top=$348;var $349=$r2;var $350=$349+12|0;var $351=HEAP32[$350>>2];var $352=$r1y1;var $353=($351|0)<($352|0);if($353){label=91;break}else{label=92;break};case 91:var $355=$r2;var $356=$355+12|0;var $357=HEAP32[$356>>2];var $361=$357;label=93;break;case 92:var $359=$r1y1;var $361=$359;label=93;break;case 93:var $361;$bot=$361;var $362=$top;var $363=$bot;var $364=($362|0)!=($363|0);if($364){label=94;break}else{label=102;break};case 94:var $366=$2;var $367=$366+16|0;var $368=HEAP32[$367>>2];var $369=$368+4|0;var $370=HEAP32[$369>>2];$cur_band=$370;var $371=$2;var $372=$r2;var $373=$r2_band_end;var $374=$top;var $375=$bot;var $376=_pixman_region_append_non_o($371,$372,$373,$374,$375);var $377=($376|0)!=0;if($377){label=96;break}else{label=95;break};case 95:label=212;break;case 96:label=97;break;case 97:var $381=$cur_band;var $382=$prev_band;var $383=$381-$382|0;var $384=$2;var $385=$384+16|0;var $386=HEAP32[$385>>2];var $387=$386+4|0;var $388=HEAP32[$387>>2];var $389=$cur_band;var $390=$388-$389|0;var $391=($383|0)==($390|0);if($391){label=98;break}else{label=99;break};case 98:var $393=$2;var $394=$prev_band;var $395=$cur_band;var $396=_pixman_coalesce($393,$394,$395);$prev_band=$396;label=100;break;case 99:var $398=$cur_band;$prev_band=$398;label=100;break;case 100:label=101;break;case 101:label=102;break;case 102:label=103;break;case 103:var $403=$r1y1;$ytop=$403;label=105;break;case 104:var $405=$r1y1;$ytop=$405;label=105;break;case 105:label=106;break;case 106:var $408=$r1;var $409=$408+12|0;var $410=HEAP32[$409>>2];var $411=$r2;var $412=$411+12|0;var $413=HEAP32[$412>>2];var $414=($410|0)<($413|0);if($414){label=107;break}else{label=108;break};case 107:var $416=$r1;var $417=$416+12|0;var $418=HEAP32[$417>>2];var $424=$418;label=109;break;case 108:var $420=$r2;var $421=$420+12|0;var $422=HEAP32[$421>>2];var $424=$422;label=109;break;case 109:var $424;$ybot=$424;var $425=$ybot;var $426=$ytop;var $427=($425|0)>($426|0);if($427){label=110;break}else{label=118;break};case 110:var $429=$2;var $430=$429+16|0;var $431=HEAP32[$430>>2];var $432=$431+4|0;var $433=HEAP32[$432>>2];$cur_band=$433;var $434=$5;var $435=$2;var $436=$r1;var $437=$r1_band_end;var $438=$r2;var $439=$r2_band_end;var $440=$ytop;var $441=$ybot;var $442=FUNCTION_TABLE[$434]($435,$436,$437,$438,$439,$440,$441);var $443=($442|0)!=0;if($443){label=112;break}else{label=111;break};case 111:label=212;break;case 112:label=113;break;case 113:var $447=$cur_band;var $448=$prev_band;var $449=$447-$448|0;var $450=$2;var $451=$450+16|0;var $452=HEAP32[$451>>2];var $453=$452+4|0;var $454=HEAP32[$453>>2];var $455=$cur_band;var $456=$454-$455|0;var $457=($449|0)==($456|0);if($457){label=114;break}else{label=115;break};case 114:var $459=$2;var $460=$prev_band;var $461=$cur_band;var $462=_pixman_coalesce($459,$460,$461);$prev_band=$462;label=116;break;case 115:var $464=$cur_band;$prev_band=$464;label=116;break;case 116:label=117;break;case 117:label=118;break;case 118:var $468=$r1;var $469=$468+12|0;var $470=HEAP32[$469>>2];var $471=$ybot;var $472=($470|0)==($471|0);if($472){label=119;break}else{label=120;break};case 119:var $474=$r1_band_end;$r1=$474;label=120;break;case 120:var $476=$r2;var $477=$476+12|0;var $478=HEAP32[$477>>2];var $479=$ybot;var $480=($478|0)==($479|0);if($480){label=121;break}else{label=122;break};case 121:var $482=$r2_band_end;$r2=$482;label=122;break;case 122:label=123;break;case 123:var $485=$r1;var $486=$r1_end;var $487=($485|0)!=($486|0);if($487){label=124;break}else{var $493=0;label=125;break};case 124:var $489=$r2;var $490=$r2_end;var $491=($489|0)!=($490|0);var $493=$491;label=125;break;case 125:var $493;if($493){label=44;break}else{label=126;break};case 126:var $495=$r1;var $496=$r1_end;var $497=($495|0)!=($496|0);if($497){label=127;break}else{label=157;break};case 127:var $499=$6;var $500=($499|0)!=0;if($500){label=128;break}else{label=157;break};case 128:label=129;break;case 129:var $503=$r1;var $504=$503+4|0;var $505=HEAP32[$504>>2];$r1y1=$505;var $506=$r1;var $507=$506+16|0;$r1_band_end=$507;label=130;break;case 130:var $509=$r1_band_end;var $510=$r1_end;var $511=($509|0)!=($510|0);if($511){label=131;break}else{var $519=0;label=132;break};case 131:var $513=$r1_band_end;var $514=$513+4|0;var $515=HEAP32[$514>>2];var $516=$r1y1;var $517=($515|0)==($516|0);var $519=$517;label=132;break;case 132:var $519;if($519){label=133;break}else{label=134;break};case 133:var $521=$r1_band_end;var $522=$521+16|0;$r1_band_end=$522;label=130;break;case 134:label=135;break;case 135:var $525=$2;var $526=$525+16|0;var $527=HEAP32[$526>>2];var $528=$527+4|0;var $529=HEAP32[$528>>2];$cur_band=$529;var $530=$2;var $531=$r1;var $532=$r1_band_end;var $533=$r1y1;var $534=$ybot;var $535=($533|0)>($534|0);if($535){label=136;break}else{label=137;break};case 136:var $537=$r1y1;var $541=$537;label=138;break;case 137:var $539=$ybot;var $541=$539;label=138;break;case 138:var $541;var $542=$r1;var $543=$542+12|0;var $544=HEAP32[$543>>2];var $545=_pixman_region_append_non_o($530,$531,$532,$541,$544);var $546=($545|0)!=0;if($546){label=140;break}else{label=139;break};case 139:label=212;break;case 140:label=141;break;case 141:var $550=$cur_band;var $551=$prev_band;var $552=$550-$551|0;var $553=$2;var $554=$553+16|0;var $555=HEAP32[$554>>2];var $556=$555+4|0;var $557=HEAP32[$556>>2];var $558=$cur_band;var $559=$557-$558|0;var $560=($552|0)==($559|0);if($560){label=142;break}else{label=143;break};case 142:var $562=$2;var $563=$prev_band;var $564=$cur_band;var $565=_pixman_coalesce($562,$563,$564);$prev_band=$565;label=144;break;case 143:var $567=$cur_band;$prev_band=$567;label=144;break;case 144:label=145;break;case 145:label=146;break;case 146:var $571=$r1_end;var $572=$r1_band_end;var $573=$571;var $574=$572;var $575=$573-$574|0;var $576=($575|0)/16&-1;$new_rects=$576;var $577=($576|0)!=0;if($577){label=147;break}else{label=155;break};case 147:label=148;break;case 148:var $580=$2;var $581=$580+16|0;var $582=HEAP32[$581>>2];var $583=($582|0)!=0;if($583){label=149;break}else{label=150;break};case 149:var $585=$2;var $586=$585+16|0;var $587=HEAP32[$586>>2];var $588=$587+4|0;var $589=HEAP32[$588>>2];var $590=$new_rects;var $591=$589+$590|0;var $592=$2;var $593=$592+16|0;var $594=HEAP32[$593>>2];var $595=$594|0;var $596=HEAP32[$595>>2];var $597=($591|0)>($596|0);if($597){label=150;break}else{label=153;break};case 150:var $599=$2;var $600=$new_rects;var $601=_pixman_rect_alloc($599,$600);var $602=($601|0)!=0;if($602){label=152;break}else{label=151;break};case 151:label=212;break;case 152:label=153;break;case 153:label=154;break;case 154:var $607=$2;var $608=$607+16|0;var $609=HEAP32[$608>>2];var $610=$609+4|0;var $611=HEAP32[$610>>2];var $612=$2;var $613=$612+16|0;var $614=HEAP32[$613>>2];var $615=$614+8|0;var $616=$615;var $617=$616+($611<<4)|0;var $618=$617;var $619=$r1_band_end;var $620=$619;var $621=$new_rects;var $622=$621<<4;_memmove($618,$620,$622,1,0);var $623=$new_rects;var $624=$2;var $625=$624+16|0;var $626=HEAP32[$625>>2];var $627=$626+4|0;var $628=HEAP32[$627>>2];var $629=$628+$623|0;HEAP32[$627>>2]=$629;label=155;break;case 155:label=156;break;case 156:label=189;break;case 157:var $633=$r2;var $634=$r2_end;var $635=($633|0)!=($634|0);if($635){label=158;break}else{label=188;break};case 158:var $637=$7;var $638=($637|0)!=0;if($638){label=159;break}else{label=188;break};case 159:label=160;break;case 160:var $641=$r2;var $642=$641+4|0;var $643=HEAP32[$642>>2];$r2y1=$643;var $644=$r2;var $645=$644+16|0;$r2_band_end=$645;label=161;break;case 161:var $647=$r2_band_end;var $648=$r2_end;var $649=($647|0)!=($648|0);if($649){label=162;break}else{var $657=0;label=163;break};case 162:var $651=$r2_band_end;var $652=$651+4|0;var $653=HEAP32[$652>>2];var $654=$r2y1;var $655=($653|0)==($654|0);var $657=$655;label=163;break;case 163:var $657;if($657){label=164;break}else{label=165;break};case 164:var $659=$r2_band_end;var $660=$659+16|0;$r2_band_end=$660;label=161;break;case 165:label=166;break;case 166:var $663=$2;var $664=$663+16|0;var $665=HEAP32[$664>>2];var $666=$665+4|0;var $667=HEAP32[$666>>2];$cur_band=$667;var $668=$2;var $669=$r2;var $670=$r2_band_end;var $671=$r2y1;var $672=$ybot;var $673=($671|0)>($672|0);if($673){label=167;break}else{label=168;break};case 167:var $675=$r2y1;var $679=$675;label=169;break;case 168:var $677=$ybot;var $679=$677;label=169;break;case 169:var $679;var $680=$r2;var $681=$680+12|0;var $682=HEAP32[$681>>2];var $683=_pixman_region_append_non_o($668,$669,$670,$679,$682);var $684=($683|0)!=0;if($684){label=171;break}else{label=170;break};case 170:label=212;break;case 171:label=172;break;case 172:var $688=$cur_band;var $689=$prev_band;var $690=$688-$689|0;var $691=$2;var $692=$691+16|0;var $693=HEAP32[$692>>2];var $694=$693+4|0;var $695=HEAP32[$694>>2];var $696=$cur_band;var $697=$695-$696|0;var $698=($690|0)==($697|0);if($698){label=173;break}else{label=174;break};case 173:var $700=$2;var $701=$prev_band;var $702=$cur_band;var $703=_pixman_coalesce($700,$701,$702);$prev_band=$703;label=175;break;case 174:var $705=$cur_band;$prev_band=$705;label=175;break;case 175:label=176;break;case 176:label=177;break;case 177:var $709=$r2_end;var $710=$r2_band_end;var $711=$709;var $712=$710;var $713=$711-$712|0;var $714=($713|0)/16&-1;$new_rects1=$714;var $715=($714|0)!=0;if($715){label=178;break}else{label=186;break};case 178:label=179;break;case 179:var $718=$2;var $719=$718+16|0;var $720=HEAP32[$719>>2];var $721=($720|0)!=0;if($721){label=180;break}else{label=181;break};case 180:var $723=$2;var $724=$723+16|0;var $725=HEAP32[$724>>2];var $726=$725+4|0;var $727=HEAP32[$726>>2];var $728=$new_rects1;var $729=$727+$728|0;var $730=$2;var $731=$730+16|0;var $732=HEAP32[$731>>2];var $733=$732|0;var $734=HEAP32[$733>>2];var $735=($729|0)>($734|0);if($735){label=181;break}else{label=184;break};case 181:var $737=$2;var $738=$new_rects1;var $739=_pixman_rect_alloc($737,$738);var $740=($739|0)!=0;if($740){label=183;break}else{label=182;break};case 182:label=212;break;case 183:label=184;break;case 184:label=185;break;case 185:var $745=$2;var $746=$745+16|0;var $747=HEAP32[$746>>2];var $748=$747+4|0;var $749=HEAP32[$748>>2];var $750=$2;var $751=$750+16|0;var $752=HEAP32[$751>>2];var $753=$752+8|0;var $754=$753;var $755=$754+($749<<4)|0;var $756=$755;var $757=$r2_band_end;var $758=$757;var $759=$new_rects1;var $760=$759<<4;_memmove($756,$758,$760,1,0);var $761=$new_rects1;var $762=$2;var $763=$762+16|0;var $764=HEAP32[$763>>2];var $765=$764+4|0;var $766=HEAP32[$765>>2];var $767=$766+$761|0;HEAP32[$765>>2]=$767;label=186;break;case 186:label=187;break;case 187:label=188;break;case 188:label=189;break;case 189:var $772=$old_data;var $773=$772;_free($773);var $774=$2;var $775=$774+16|0;var $776=HEAP32[$775>>2];var $777=$776+4|0;var $778=HEAP32[$777>>2];$numRects=$778;var $779=($778|0)!=0;if($779){label=194;break}else{label=190;break};case 190:var $781=$2;var $782=$781+16|0;var $783=HEAP32[$782>>2];var $784=($783|0)!=0;if($784){label=191;break}else{label=193;break};case 191:var $786=$2;var $787=$786+16|0;var $788=HEAP32[$787>>2];var $789=$788|0;var $790=HEAP32[$789>>2];var $791=($790|0)!=0;if($791){label=192;break}else{label=193;break};case 192:var $793=$2;var $794=$793+16|0;var $795=HEAP32[$794>>2];var $796=$795;_free($796);label=193;break;case 193:var $798=HEAP32[168>>2];var $799=$2;var $800=$799+16|0;HEAP32[$800>>2]=$798;label=211;break;case 194:var $802=$numRects;var $803=($802|0)==1;if($803){label=195;break}else{label=199;break};case 195:var $805=$2;var $806=$805|0;var $807=$2;var $808=$807+16|0;var $809=HEAP32[$808>>2];var $810=$809+8|0;var $811=$810;var $812=$806;var $813=$811;HEAP32[$812>>2]=HEAP32[$813>>2];HEAP32[$812+4>>2]=HEAP32[$813+4>>2];HEAP32[$812+8>>2]=HEAP32[$813+8>>2];HEAP32[$812+12>>2]=HEAP32[$813+12>>2];var $814=$2;var $815=$814+16|0;var $816=HEAP32[$815>>2];var $817=($816|0)!=0;if($817){label=196;break}else{label=198;break};case 196:var $819=$2;var $820=$819+16|0;var $821=HEAP32[$820>>2];var $822=$821|0;var $823=HEAP32[$822>>2];var $824=($823|0)!=0;if($824){label=197;break}else{label=198;break};case 197:var $826=$2;var $827=$826+16|0;var $828=HEAP32[$827>>2];var $829=$828;_free($829);label=198;break;case 198:var $831=$2;var $832=$831+16|0;HEAP32[$832>>2]=0;label=210;break;case 199:label=200;break;case 200:var $835=$numRects;var $836=$2;var $837=$836+16|0;var $838=HEAP32[$837>>2];var $839=$838|0;var $840=HEAP32[$839>>2];var $841=$840>>1;var $842=($835|0)<($841|0);if($842){label=201;break}else{label=208;break};case 201:var $844=$2;var $845=$844+16|0;var $846=HEAP32[$845>>2];var $847=$846|0;var $848=HEAP32[$847>>2];var $849=($848|0)>50;if($849){label=202;break}else{label=208;break};case 202:var $851=$numRects;var $852=_PIXREGION_SZOF($851);$data_size=$852;var $853=$data_size;var $854=($853|0)!=0;if($854){label=204;break}else{label=203;break};case 203:$new_data=0;label=205;break;case 204:var $857=$2;var $858=$857+16|0;var $859=HEAP32[$858>>2];var $860=$859;var $861=$data_size;var $862=_realloc($860,$861);var $863=$862;$new_data=$863;label=205;break;case 205:var $865=$new_data;var $866=($865|0)!=0;if($866){label=206;break}else{label=207;break};case 206:var $868=$numRects;var $869=$new_data;var $870=$869|0;HEAP32[$870>>2]=$868;var $871=$new_data;var $872=$2;var $873=$872+16|0;HEAP32[$873>>2]=$871;label=207;break;case 207:label=208;break;case 208:label=209;break;case 209:label=210;break;case 210:label=211;break;case 211:$1=1;label=213;break;case 212:var $880=$old_data;var $881=$880;_free($881);var $882=$2;var $883=_pixman_break($882);$1=$883;label=213;break;case 213:var $885=$1;return $885}}function _pixman_region_intersect_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $7;var $8;var $x1;var $x2;var $next_rect;$2=$region;$3=$r1;$4=$r1_end;$5=$r2;$6=$r2_end;$7=$y1;$8=$y2;var $9=$2;var $10=$9+16|0;var $11=HEAP32[$10>>2];var $12=$11+4|0;var $13=HEAP32[$12>>2];var $14=$2;var $15=$14+16|0;var $16=HEAP32[$15>>2];var $17=$16+8|0;var $18=$17;var $19=$18+($13<<4)|0;$next_rect=$19;label=2;break;case 2:var $21=$7;var $22=$8;var $23=($21|0)<($22|0);var $24=$23^1;var $25=$24&1;var $26=$25;var $27=($26|0)!=0;if($27){label=3;break}else{label=4;break};case 3:__pixman_log_error(1648,464);label=4;break;case 4:label=5;break;case 5:label=6;break;case 6:var $32=$3;var $33=$4;var $34=($32|0)!=($33|0);if($34){label=7;break}else{var $40=0;label=8;break};case 7:var $36=$5;var $37=$6;var $38=($36|0)!=($37|0);var $40=$38;label=8;break;case 8:var $40;var $41=$40^1;var $42=$41&1;var $43=$42;var $44=($43|0)!=0;if($44){label=9;break}else{label=10;break};case 9:__pixman_log_error(1648,408);label=10;break;case 10:label=11;break;case 11:label=12;break;case 12:var $49=$3;var $50=$49|0;var $51=HEAP32[$50>>2];var $52=$5;var $53=$52|0;var $54=HEAP32[$53>>2];var $55=($51|0)>($54|0);if($55){label=13;break}else{label=14;break};case 13:var $57=$3;var $58=$57|0;var $59=HEAP32[$58>>2];var $65=$59;label=15;break;case 14:var $61=$5;var $62=$61|0;var $63=HEAP32[$62>>2];var $65=$63;label=15;break;case 15:var $65;$x1=$65;var $66=$3;var $67=$66+8|0;var $68=HEAP32[$67>>2];var $69=$5;var $70=$69+8|0;var $71=HEAP32[$70>>2];var $72=($68|0)<($71|0);if($72){label=16;break}else{label=17;break};case 16:var $74=$3;var $75=$74+8|0;var $76=HEAP32[$75>>2];var $82=$76;label=18;break;case 17:var $78=$5;var $79=$78+8|0;var $80=HEAP32[$79>>2];var $82=$80;label=18;break;case 18:var $82;$x2=$82;var $83=$x1;var $84=$x2;var $85=($83|0)<($84|0);if($85){label=19;break}else{label=33;break};case 19:label=20;break;case 20:var $88=$2;var $89=$88+16|0;var $90=HEAP32[$89>>2];var $91=($90|0)!=0;if($91){label=21;break}else{label=22;break};case 21:var $93=$2;var $94=$93+16|0;var $95=HEAP32[$94>>2];var $96=$95+4|0;var $97=HEAP32[$96>>2];var $98=$2;var $99=$98+16|0;var $100=HEAP32[$99>>2];var $101=$100|0;var $102=HEAP32[$101>>2];var $103=($97|0)==($102|0);if($103){label=22;break}else{label=25;break};case 22:var $105=$2;var $106=_pixman_rect_alloc($105,1);var $107=($106|0)!=0;if($107){label=24;break}else{label=23;break};case 23:$1=0;label=42;break;case 24:var $110=$2;var $111=$110+16|0;var $112=HEAP32[$111>>2];var $113=$112+4|0;var $114=HEAP32[$113>>2];var $115=$2;var $116=$115+16|0;var $117=HEAP32[$116>>2];var $118=$117+8|0;var $119=$118;var $120=$119+($114<<4)|0;$next_rect=$120;label=25;break;case 25:label=26;break;case 26:var $123=$x1;var $124=$next_rect;var $125=$124|0;HEAP32[$125>>2]=$123;var $126=$7;var $127=$next_rect;var $128=$127+4|0;HEAP32[$128>>2]=$126;var $129=$x2;var $130=$next_rect;var $131=$130+8|0;HEAP32[$131>>2]=$129;var $132=$8;var $133=$next_rect;var $134=$133+12|0;HEAP32[$134>>2]=$132;var $135=$next_rect;var $136=$135+16|0;$next_rect=$136;label=27;break;case 27:var $138=$2;var $139=$138+16|0;var $140=HEAP32[$139>>2];var $141=$140+4|0;var $142=HEAP32[$141>>2];var $143=$142+1|0;HEAP32[$141>>2]=$143;label=28;break;case 28:var $145=$2;var $146=$145+16|0;var $147=HEAP32[$146>>2];var $148=$147+4|0;var $149=HEAP32[$148>>2];var $150=$2;var $151=$150+16|0;var $152=HEAP32[$151>>2];var $153=$152|0;var $154=HEAP32[$153>>2];var $155=($149|0)<=($154|0);var $156=$155^1;var $157=$156&1;var $158=$157;var $159=($158|0)!=0;if($159){label=29;break}else{label=30;break};case 29:__pixman_log_error(1648,1232);label=30;break;case 30:label=31;break;case 31:label=32;break;case 32:label=33;break;case 33:var $165=$3;var $166=$165+8|0;var $167=HEAP32[$166>>2];var $168=$x2;var $169=($167|0)==($168|0);if($169){label=34;break}else{label=35;break};case 34:var $171=$3;var $172=$171+16|0;$3=$172;label=35;break;case 35:var $174=$5;var $175=$174+8|0;var $176=HEAP32[$175>>2];var $177=$x2;var $178=($176|0)==($177|0);if($178){label=36;break}else{label=37;break};case 36:var $180=$5;var $181=$180+16|0;$5=$181;label=37;break;case 37:label=38;break;case 38:var $184=$3;var $185=$4;var $186=($184|0)!=($185|0);if($186){label=39;break}else{var $192=0;label=40;break};case 39:var $188=$5;var $189=$6;var $190=($188|0)!=($189|0);var $192=$190;label=40;break;case 40:var $192;if($192){label=12;break}else{label=41;break};case 41:$1=1;label=42;break;case 42:var $195=$1;return $195}}function _pixman_set_extents($region){var label=0;label=1;while(1)switch(label){case 1:var $1;var $box;var $box_end;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=3;break}else{label=2;break};case 2:label=20;break;case 3:var $8=$1;var $9=$8+16|0;var $10=HEAP32[$9>>2];var $11=$10|0;var $12=HEAP32[$11>>2];var $13=($12|0)!=0;if($13){label=5;break}else{label=4;break};case 4:var $15=$1;var $16=$15|0;var $17=$16|0;var $18=HEAP32[$17>>2];var $19=$1;var $20=$19|0;var $21=$20+8|0;HEAP32[$21>>2]=$18;var $22=$1;var $23=$22|0;var $24=$23+4|0;var $25=HEAP32[$24>>2];var $26=$1;var $27=$26|0;var $28=$27+12|0;HEAP32[$28>>2]=$25;label=20;break;case 5:var $30=$1;var $31=$30+16|0;var $32=HEAP32[$31>>2];var $33=$32+8|0;var $34=$33;$box=$34;var $35=$1;var $36=$35+16|0;var $37=HEAP32[$36>>2];var $38=$37+4|0;var $39=HEAP32[$38>>2];var $40=$39-1|0;var $41=$1;var $42=$41+16|0;var $43=HEAP32[$42>>2];var $44=$43+8|0;var $45=$44;var $46=$45+($40<<4)|0;$box_end=$46;var $47=$box;var $48=$47|0;var $49=HEAP32[$48>>2];var $50=$1;var $51=$50|0;var $52=$51|0;HEAP32[$52>>2]=$49;var $53=$box;var $54=$53+4|0;var $55=HEAP32[$54>>2];var $56=$1;var $57=$56|0;var $58=$57+4|0;HEAP32[$58>>2]=$55;var $59=$box_end;var $60=$59+8|0;var $61=HEAP32[$60>>2];var $62=$1;var $63=$62|0;var $64=$63+8|0;HEAP32[$64>>2]=$61;var $65=$box_end;var $66=$65+12|0;var $67=HEAP32[$66>>2];var $68=$1;var $69=$68|0;var $70=$69+12|0;HEAP32[$70>>2]=$67;label=6;break;case 6:var $72=$1;var $73=$72|0;var $74=$73+4|0;var $75=HEAP32[$74>>2];var $76=$1;var $77=$76|0;var $78=$77+12|0;var $79=HEAP32[$78>>2];var $80=($75|0)<($79|0);var $81=$80^1;var $82=$81&1;var $83=$82;var $84=($83|0)!=0;if($84){label=7;break}else{label=8;break};case 7:__pixman_log_error(1352,1072);label=8;break;case 8:label=9;break;case 9:label=10;break;case 10:var $89=$box;var $90=$box_end;var $91=$89>>>0<=$90>>>0;if($91){label=11;break}else{label=16;break};case 11:var $93=$box;var $94=$93|0;var $95=HEAP32[$94>>2];var $96=$1;var $97=$96|0;var $98=$97|0;var $99=HEAP32[$98>>2];var $100=($95|0)<($99|0);if($100){label=12;break}else{label=13;break};case 12:var $102=$box;var $103=$102|0;var $104=HEAP32[$103>>2];var $105=$1;var $106=$105|0;var $107=$106|0;HEAP32[$107>>2]=$104;label=13;break;case 13:var $109=$box;var $110=$109+8|0;var $111=HEAP32[$110>>2];var $112=$1;var $113=$112|0;var $114=$113+8|0;var $115=HEAP32[$114>>2];var $116=($111|0)>($115|0);if($116){label=14;break}else{label=15;break};case 14:var $118=$box;var $119=$118+8|0;var $120=HEAP32[$119>>2];var $121=$1;var $122=$121|0;var $123=$122+8|0;HEAP32[$123>>2]=$120;label=15;break;case 15:var $125=$box;var $126=$125+16|0;$box=$126;label=10;break;case 16:label=17;break;case 17:var $129=$1;var $130=$129|0;var $131=$130|0;var $132=HEAP32[$131>>2];var $133=$1;var $134=$133|0;var $135=$134+8|0;var $136=HEAP32[$135>>2];var $137=($132|0)<($136|0);var $138=$137^1;var $139=$138&1;var $140=$139;var $141=($140|0)!=0;if($141){label=18;break}else{label=19;break};case 18:__pixman_log_error(1352,1e3);label=19;break;case 19:label=20;break;case 20:return}}function _pixman_region32_intersect_rect($dest,$source,$x,$y,$width,$height){var sp=STACKTOP;STACKTOP=STACKTOP+24|0;var $3;var $4;var $region=sp;$3=$x;$4=$y;HEAP32[$region+16>>2]=0;HEAP32[$region>>2]=$3;HEAP32[$region+4>>2]=$4;HEAP32[$region+8>>2]=$3+$width;HEAP32[$region+12>>2]=$4+$height;var $26=_pixman_region32_intersect($dest,$source,$region);STACKTOP=sp;return $26}function _pixman_region32_union_rect($dest,$source,$x,$y,$width,$height){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+24|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $7;var $region=sp;$2=$dest;$3=$source;$4=$x;$5=$y;$6=$width;$7=$height;var $8=$4;var $9=$region|0;var $10=$9|0;HEAP32[$10>>2]=$8;var $11=$5;var $12=$region|0;var $13=$12+4|0;HEAP32[$13>>2]=$11;var $14=$4;var $15=$6;var $16=$14+$15|0;var $17=$region|0;var $18=$17+8|0;HEAP32[$18>>2]=$16;var $19=$5;var $20=$7;var $21=$19+$20|0;var $22=$region|0;var $23=$22+12|0;HEAP32[$23>>2]=$21;var $24=$region|0;var $25=$24|0;var $26=HEAP32[$25>>2];var $27=$region|0;var $28=$27+8|0;var $29=HEAP32[$28>>2];var $30=($26|0)<($29|0);if($30){label=2;break}else{label=3;break};case 2:var $32=$region|0;var $33=$32+4|0;var $34=HEAP32[$33>>2];var $35=$region|0;var $36=$35+12|0;var $37=HEAP32[$36>>2];var $38=($34|0)<($37|0);if($38){label=7;break}else{label=3;break};case 3:var $40=$region|0;var $41=$40|0;var $42=HEAP32[$41>>2];var $43=$region|0;var $44=$43+8|0;var $45=HEAP32[$44>>2];var $46=($42|0)>($45|0);if($46){label=5;break}else{label=4;break};case 4:var $48=$region|0;var $49=$48+4|0;var $50=HEAP32[$49>>2];var $51=$region|0;var $52=$51+12|0;var $53=HEAP32[$52>>2];var $54=($50|0)>($53|0);if($54){label=5;break}else{label=6;break};case 5:__pixman_log_error(1872,640);label=6;break;case 6:var $57=$2;var $58=$3;var $59=_pixman_region32_copy($57,$58);$1=$59;label=8;break;case 7:var $61=$region+16|0;HEAP32[$61>>2]=0;var $62=$2;var $63=$3;var $64=_pixman_region32_union($62,$63,$region);$1=$64;label=8;break;case 8:var $66=$1;STACKTOP=sp;return $66}}function _pixman_region32_union($new_reg,$reg1,$reg2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;$2=$new_reg;$3=$reg1;$4=$reg2;var $5=$3;var $6=$4;var $7=($5|0)==($6|0);if($7){label=2;break}else{label=3;break};case 2:var $9=$2;var $10=$3;var $11=_pixman_region32_copy($9,$10);$1=$11;label=48;break;case 3:var $13=$3;var $14=$13+16|0;var $15=HEAP32[$14>>2];var $16=($15|0)!=0;if($16){label=4;break}else{label=10;break};case 4:var $18=$3;var $19=$18+16|0;var $20=HEAP32[$19>>2];var $21=$20+4|0;var $22=HEAP32[$21>>2];var $23=($22|0)!=0;if($23){label=10;break}else{label=5;break};case 5:var $25=$3;var $26=$25+16|0;var $27=HEAP32[$26>>2];var $28=HEAP32[184>>2];var $29=($27|0)==($28|0);if($29){label=6;break}else{label=7;break};case 6:var $31=$2;var $32=_pixman_break($31);$1=$32;label=48;break;case 7:var $34=$2;var $35=$4;var $36=($34|0)!=($35|0);if($36){label=8;break}else{label=9;break};case 8:var $38=$2;var $39=$4;var $40=_pixman_region32_copy($38,$39);$1=$40;label=48;break;case 9:$1=1;label=48;break;case 10:var $43=$4;var $44=$43+16|0;var $45=HEAP32[$44>>2];var $46=($45|0)!=0;if($46){label=11;break}else{label=17;break};case 11:var $48=$4;var $49=$48+16|0;var $50=HEAP32[$49>>2];var $51=$50+4|0;var $52=HEAP32[$51>>2];var $53=($52|0)!=0;if($53){label=17;break}else{label=12;break};case 12:var $55=$4;var $56=$55+16|0;var $57=HEAP32[$56>>2];var $58=HEAP32[184>>2];var $59=($57|0)==($58|0);if($59){label=13;break}else{label=14;break};case 13:var $61=$2;var $62=_pixman_break($61);$1=$62;label=48;break;case 14:var $64=$2;var $65=$3;var $66=($64|0)!=($65|0);if($66){label=15;break}else{label=16;break};case 15:var $68=$2;var $69=$3;var $70=_pixman_region32_copy($68,$69);$1=$70;label=48;break;case 16:$1=1;label=48;break;case 17:var $73=$3;var $74=$73+16|0;var $75=HEAP32[$74>>2];var $76=($75|0)!=0;if($76){label=25;break}else{label=18;break};case 18:var $78=$3;var $79=$78|0;var $80=$79|0;var $81=HEAP32[$80>>2];var $82=$4;var $83=$82|0;var $84=$83|0;var $85=HEAP32[$84>>2];var $86=($81|0)<=($85|0);if($86){label=19;break}else{label=25;break};case 19:var $88=$3;var $89=$88|0;var $90=$89+8|0;var $91=HEAP32[$90>>2];var $92=$4;var $93=$92|0;var $94=$93+8|0;var $95=HEAP32[$94>>2];var $96=($91|0)>=($95|0);if($96){label=20;break}else{label=25;break};case 20:var $98=$3;var $99=$98|0;var $100=$99+4|0;var $101=HEAP32[$100>>2];var $102=$4;var $103=$102|0;var $104=$103+4|0;var $105=HEAP32[$104>>2];var $106=($101|0)<=($105|0);if($106){label=21;break}else{label=25;break};case 21:var $108=$3;var $109=$108|0;var $110=$109+12|0;var $111=HEAP32[$110>>2];var $112=$4;var $113=$112|0;var $114=$113+12|0;var $115=HEAP32[$114>>2];var $116=($111|0)>=($115|0);if($116){label=22;break}else{label=25;break};case 22:var $118=$2;var $119=$3;var $120=($118|0)!=($119|0);if($120){label=23;break}else{label=24;break};case 23:var $122=$2;var $123=$3;var $124=_pixman_region32_copy($122,$123);$1=$124;label=48;break;case 24:$1=1;label=48;break;case 25:var $127=$4;var $128=$127+16|0;var $129=HEAP32[$128>>2];var $130=($129|0)!=0;if($130){label=33;break}else{label=26;break};case 26:var $132=$4;var $133=$132|0;var $134=$133|0;var $135=HEAP32[$134>>2];var $136=$3;var $137=$136|0;var $138=$137|0;var $139=HEAP32[$138>>2];var $140=($135|0)<=($139|0);if($140){label=27;break}else{label=33;break};case 27:var $142=$4;var $143=$142|0;var $144=$143+8|0;var $145=HEAP32[$144>>2];var $146=$3;var $147=$146|0;var $148=$147+8|0;var $149=HEAP32[$148>>2];var $150=($145|0)>=($149|0);if($150){label=28;break}else{label=33;break};case 28:var $152=$4;var $153=$152|0;var $154=$153+4|0;var $155=HEAP32[$154>>2];var $156=$3;var $157=$156|0;var $158=$157+4|0;var $159=HEAP32[$158>>2];var $160=($155|0)<=($159|0);if($160){label=29;break}else{label=33;break};case 29:var $162=$4;var $163=$162|0;var $164=$163+12|0;var $165=HEAP32[$164>>2];var $166=$3;var $167=$166|0;var $168=$167+12|0;var $169=HEAP32[$168>>2];var $170=($165|0)>=($169|0);if($170){label=30;break}else{label=33;break};case 30:var $172=$2;var $173=$4;var $174=($172|0)!=($173|0);if($174){label=31;break}else{label=32;break};case 31:var $176=$2;var $177=$4;var $178=_pixman_region32_copy($176,$177);$1=$178;label=48;break;case 32:$1=1;label=48;break;case 33:var $181=$2;var $182=$3;var $183=$4;var $184=_pixman_op($181,$182,$183,32,1,1);var $185=($184|0)!=0;if($185){label=35;break}else{label=34;break};case 34:$1=0;label=48;break;case 35:var $188=$3;var $189=$188|0;var $190=$189|0;var $191=HEAP32[$190>>2];var $192=$4;var $193=$192|0;var $194=$193|0;var $195=HEAP32[$194>>2];var $196=($191|0)<($195|0);if($196){label=36;break}else{label=37;break};case 36:var $198=$3;var $199=$198|0;var $200=$199|0;var $201=HEAP32[$200>>2];var $208=$201;label=38;break;case 37:var $203=$4;var $204=$203|0;var $205=$204|0;var $206=HEAP32[$205>>2];var $208=$206;label=38;break;case 38:var $208;var $209=$2;var $210=$209|0;var $211=$210|0;HEAP32[$211>>2]=$208;var $212=$3;var $213=$212|0;var $214=$213+4|0;var $215=HEAP32[$214>>2];var $216=$4;var $217=$216|0;var $218=$217+4|0;var $219=HEAP32[$218>>2];var $220=($215|0)<($219|0);if($220){label=39;break}else{label=40;break};case 39:var $222=$3;var $223=$222|0;var $224=$223+4|0;var $225=HEAP32[$224>>2];var $232=$225;label=41;break;case 40:var $227=$4;var $228=$227|0;var $229=$228+4|0;var $230=HEAP32[$229>>2];var $232=$230;label=41;break;case 41:var $232;var $233=$2;var $234=$233|0;var $235=$234+4|0;HEAP32[$235>>2]=$232;var $236=$3;var $237=$236|0;var $238=$237+8|0;var $239=HEAP32[$238>>2];var $240=$4;var $241=$240|0;var $242=$241+8|0;var $243=HEAP32[$242>>2];var $244=($239|0)>($243|0);if($244){label=42;break}else{label=43;break};case 42:var $246=$3;var $247=$246|0;var $248=$247+8|0;var $249=HEAP32[$248>>2];var $256=$249;label=44;break;case 43:var $251=$4;var $252=$251|0;var $253=$252+8|0;var $254=HEAP32[$253>>2];var $256=$254;label=44;break;case 44:var $256;var $257=$2;var $258=$257|0;var $259=$258+8|0;HEAP32[$259>>2]=$256;var $260=$3;var $261=$260|0;var $262=$261+12|0;var $263=HEAP32[$262>>2];var $264=$4;var $265=$264|0;var $266=$265+12|0;var $267=HEAP32[$266>>2];var $268=($263|0)>($267|0);if($268){label=45;break}else{label=46;break};case 45:var $270=$3;var $271=$270|0;var $272=$271+12|0;var $273=HEAP32[$272>>2];var $280=$273;label=47;break;case 46:var $275=$4;var $276=$275|0;var $277=$276+12|0;var $278=HEAP32[$277>>2];var $280=$278;label=47;break;case 47:var $280;var $281=$2;var $282=$281|0;var $283=$282+12|0;HEAP32[$283>>2]=$280;$1=1;label=48;break;case 48:var $285=$1;return $285}}function _pixman_region_union_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $7;var $8;var $next_rect;var $x1;var $x2;$2=$region;$3=$r1;$4=$r1_end;$5=$r2;$6=$r2_end;$7=$y1;$8=$y2;label=2;break;case 2:var $10=$7;var $11=$8;var $12=($10|0)<($11|0);var $13=$12^1;var $14=$13&1;var $15=$14;var $16=($15|0)!=0;if($16){label=3;break}else{label=4;break};case 3:__pixman_log_error(1400,464);label=4;break;case 4:label=5;break;case 5:label=6;break;case 6:var $21=$3;var $22=$4;var $23=($21|0)!=($22|0);if($23){label=7;break}else{var $29=0;label=8;break};case 7:var $25=$5;var $26=$6;var $27=($25|0)!=($26|0);var $29=$27;label=8;break;case 8:var $29;var $30=$29^1;var $31=$30&1;var $32=$31;var $33=($32|0)!=0;if($33){label=9;break}else{label=10;break};case 9:__pixman_log_error(1400,408);label=10;break;case 10:label=11;break;case 11:var $37=$2;var $38=$37+16|0;var $39=HEAP32[$38>>2];var $40=$39+4|0;var $41=HEAP32[$40>>2];var $42=$2;var $43=$42+16|0;var $44=HEAP32[$43>>2];var $45=$44+8|0;var $46=$45;var $47=$46+($41<<4)|0;$next_rect=$47;var $48=$3;var $49=$48|0;var $50=HEAP32[$49>>2];var $51=$5;var $52=$51|0;var $53=HEAP32[$52>>2];var $54=($50|0)<($53|0);if($54){label=12;break}else{label=13;break};case 12:var $56=$3;var $57=$56|0;var $58=HEAP32[$57>>2];$x1=$58;var $59=$3;var $60=$59+8|0;var $61=HEAP32[$60>>2];$x2=$61;var $62=$3;var $63=$62+16|0;$3=$63;label=14;break;case 13:var $65=$5;var $66=$65|0;var $67=HEAP32[$66>>2];$x1=$67;var $68=$5;var $69=$68+8|0;var $70=HEAP32[$69>>2];$x2=$70;var $71=$5;var $72=$71+16|0;$5=$72;label=14;break;case 14:label=15;break;case 15:var $75=$3;var $76=$4;var $77=($75|0)!=($76|0);if($77){label=16;break}else{var $83=0;label=17;break};case 16:var $79=$5;var $80=$6;var $81=($79|0)!=($80|0);var $83=$81;label=17;break;case 17:var $83;if($83){label=18;break}else{label=62;break};case 18:var $85=$3;var $86=$85|0;var $87=HEAP32[$86>>2];var $88=$5;var $89=$88|0;var $90=HEAP32[$89>>2];var $91=($87|0)<($90|0);if($91){label=19;break}else{label=40;break};case 19:label=20;break;case 20:var $94=$3;var $95=$94|0;var $96=HEAP32[$95>>2];var $97=$x2;var $98=($96|0)<=($97|0);if($98){label=21;break}else{label=24;break};case 21:var $100=$x2;var $101=$3;var $102=$101+8|0;var $103=HEAP32[$102>>2];var $104=($100|0)<($103|0);if($104){label=22;break}else{label=23;break};case 22:var $106=$3;var $107=$106+8|0;var $108=HEAP32[$107>>2];$x2=$108;label=23;break;case 23:label=38;break;case 24:label=25;break;case 25:var $112=$2;var $113=$112+16|0;var $114=HEAP32[$113>>2];var $115=($114|0)!=0;if($115){label=26;break}else{label=27;break};case 26:var $117=$2;var $118=$117+16|0;var $119=HEAP32[$118>>2];var $120=$119+4|0;var $121=HEAP32[$120>>2];var $122=$2;var $123=$122+16|0;var $124=HEAP32[$123>>2];var $125=$124|0;var $126=HEAP32[$125>>2];var $127=($121|0)==($126|0);if($127){label=27;break}else{label=30;break};case 27:var $129=$2;var $130=_pixman_rect_alloc($129,1);var $131=($130|0)!=0;if($131){label=29;break}else{label=28;break};case 28:$1=0;label=127;break;case 29:var $134=$2;var $135=$134+16|0;var $136=HEAP32[$135>>2];var $137=$136+4|0;var $138=HEAP32[$137>>2];var $139=$2;var $140=$139+16|0;var $141=HEAP32[$140>>2];var $142=$141+8|0;var $143=$142;var $144=$143+($138<<4)|0;$next_rect=$144;label=30;break;case 30:label=31;break;case 31:var $147=$x1;var $148=$next_rect;var $149=$148|0;HEAP32[$149>>2]=$147;var $150=$7;var $151=$next_rect;var $152=$151+4|0;HEAP32[$152>>2]=$150;var $153=$x2;var $154=$next_rect;var $155=$154+8|0;HEAP32[$155>>2]=$153;var $156=$8;var $157=$next_rect;var $158=$157+12|0;HEAP32[$158>>2]=$156;var $159=$next_rect;var $160=$159+16|0;$next_rect=$160;label=32;break;case 32:var $162=$2;var $163=$162+16|0;var $164=HEAP32[$163>>2];var $165=$164+4|0;var $166=HEAP32[$165>>2];var $167=$166+1|0;HEAP32[$165>>2]=$167;label=33;break;case 33:var $169=$2;var $170=$169+16|0;var $171=HEAP32[$170>>2];var $172=$171+4|0;var $173=HEAP32[$172>>2];var $174=$2;var $175=$174+16|0;var $176=HEAP32[$175>>2];var $177=$176|0;var $178=HEAP32[$177>>2];var $179=($173|0)<=($178|0);var $180=$179^1;var $181=$180&1;var $182=$181;var $183=($182|0)!=0;if($183){label=34;break}else{label=35;break};case 34:__pixman_log_error(1400,1232);label=35;break;case 35:label=36;break;case 36:label=37;break;case 37:var $188=$3;var $189=$188|0;var $190=HEAP32[$189>>2];$x1=$190;var $191=$3;var $192=$191+8|0;var $193=HEAP32[$192>>2];$x2=$193;label=38;break;case 38:var $195=$3;var $196=$195+16|0;$3=$196;label=39;break;case 39:label=61;break;case 40:label=41;break;case 41:var $200=$5;var $201=$200|0;var $202=HEAP32[$201>>2];var $203=$x2;var $204=($202|0)<=($203|0);if($204){label=42;break}else{label=45;break};case 42:var $206=$x2;var $207=$5;var $208=$207+8|0;var $209=HEAP32[$208>>2];var $210=($206|0)<($209|0);if($210){label=43;break}else{label=44;break};case 43:var $212=$5;var $213=$212+8|0;var $214=HEAP32[$213>>2];$x2=$214;label=44;break;case 44:label=59;break;case 45:label=46;break;case 46:var $218=$2;var $219=$218+16|0;var $220=HEAP32[$219>>2];var $221=($220|0)!=0;if($221){label=47;break}else{label=48;break};case 47:var $223=$2;var $224=$223+16|0;var $225=HEAP32[$224>>2];var $226=$225+4|0;var $227=HEAP32[$226>>2];var $228=$2;var $229=$228+16|0;var $230=HEAP32[$229>>2];var $231=$230|0;var $232=HEAP32[$231>>2];var $233=($227|0)==($232|0);if($233){label=48;break}else{label=51;break};case 48:var $235=$2;var $236=_pixman_rect_alloc($235,1);var $237=($236|0)!=0;if($237){label=50;break}else{label=49;break};case 49:$1=0;label=127;break;case 50:var $240=$2;var $241=$240+16|0;var $242=HEAP32[$241>>2];var $243=$242+4|0;var $244=HEAP32[$243>>2];var $245=$2;var $246=$245+16|0;var $247=HEAP32[$246>>2];var $248=$247+8|0;var $249=$248;var $250=$249+($244<<4)|0;$next_rect=$250;label=51;break;case 51:label=52;break;case 52:var $253=$x1;var $254=$next_rect;var $255=$254|0;HEAP32[$255>>2]=$253;var $256=$7;var $257=$next_rect;var $258=$257+4|0;HEAP32[$258>>2]=$256;var $259=$x2;var $260=$next_rect;var $261=$260+8|0;HEAP32[$261>>2]=$259;var $262=$8;var $263=$next_rect;var $264=$263+12|0;HEAP32[$264>>2]=$262;var $265=$next_rect;var $266=$265+16|0;$next_rect=$266;label=53;break;case 53:var $268=$2;var $269=$268+16|0;var $270=HEAP32[$269>>2];var $271=$270+4|0;var $272=HEAP32[$271>>2];var $273=$272+1|0;HEAP32[$271>>2]=$273;label=54;break;case 54:var $275=$2;var $276=$275+16|0;var $277=HEAP32[$276>>2];var $278=$277+4|0;var $279=HEAP32[$278>>2];var $280=$2;var $281=$280+16|0;var $282=HEAP32[$281>>2];var $283=$282|0;var $284=HEAP32[$283>>2];var $285=($279|0)<=($284|0);var $286=$285^1;var $287=$286&1;var $288=$287;var $289=($288|0)!=0;if($289){label=55;break}else{label=56;break};case 55:__pixman_log_error(1400,1232);label=56;break;case 56:label=57;break;case 57:label=58;break;case 58:var $294=$5;var $295=$294|0;var $296=HEAP32[$295>>2];$x1=$296;var $297=$5;var $298=$297+8|0;var $299=HEAP32[$298>>2];$x2=$299;label=59;break;case 59:var $301=$5;var $302=$301+16|0;$5=$302;label=60;break;case 60:label=61;break;case 61:label=15;break;case 62:var $306=$3;var $307=$4;var $308=($306|0)!=($307|0);if($308){label=63;break}else{label=87;break};case 63:label=64;break;case 64:label=65;break;case 65:var $312=$3;var $313=$312|0;var $314=HEAP32[$313>>2];var $315=$x2;var $316=($314|0)<=($315|0);if($316){label=66;break}else{label=69;break};case 66:var $318=$x2;var $319=$3;var $320=$319+8|0;var $321=HEAP32[$320>>2];var $322=($318|0)<($321|0);if($322){label=67;break}else{label=68;break};case 67:var $324=$3;var $325=$324+8|0;var $326=HEAP32[$325>>2];$x2=$326;label=68;break;case 68:label=83;break;case 69:label=70;break;case 70:var $330=$2;var $331=$330+16|0;var $332=HEAP32[$331>>2];var $333=($332|0)!=0;if($333){label=71;break}else{label=72;break};case 71:var $335=$2;var $336=$335+16|0;var $337=HEAP32[$336>>2];var $338=$337+4|0;var $339=HEAP32[$338>>2];var $340=$2;var $341=$340+16|0;var $342=HEAP32[$341>>2];var $343=$342|0;var $344=HEAP32[$343>>2];var $345=($339|0)==($344|0);if($345){label=72;break}else{label=75;break};case 72:var $347=$2;var $348=_pixman_rect_alloc($347,1);var $349=($348|0)!=0;if($349){label=74;break}else{label=73;break};case 73:$1=0;label=127;break;case 74:var $352=$2;var $353=$352+16|0;var $354=HEAP32[$353>>2];var $355=$354+4|0;var $356=HEAP32[$355>>2];var $357=$2;var $358=$357+16|0;var $359=HEAP32[$358>>2];var $360=$359+8|0;var $361=$360;var $362=$361+($356<<4)|0;$next_rect=$362;label=75;break;case 75:label=76;break;case 76:var $365=$x1;var $366=$next_rect;var $367=$366|0;HEAP32[$367>>2]=$365;var $368=$7;var $369=$next_rect;var $370=$369+4|0;HEAP32[$370>>2]=$368;var $371=$x2;var $372=$next_rect;var $373=$372+8|0;HEAP32[$373>>2]=$371;var $374=$8;var $375=$next_rect;var $376=$375+12|0;HEAP32[$376>>2]=$374;var $377=$next_rect;var $378=$377+16|0;$next_rect=$378;label=77;break;case 77:var $380=$2;var $381=$380+16|0;var $382=HEAP32[$381>>2];var $383=$382+4|0;var $384=HEAP32[$383>>2];var $385=$384+1|0;HEAP32[$383>>2]=$385;label=78;break;case 78:var $387=$2;var $388=$387+16|0;var $389=HEAP32[$388>>2];var $390=$389+4|0;var $391=HEAP32[$390>>2];var $392=$2;var $393=$392+16|0;var $394=HEAP32[$393>>2];var $395=$394|0;var $396=HEAP32[$395>>2];var $397=($391|0)<=($396|0);var $398=$397^1;var $399=$398&1;var $400=$399;var $401=($400|0)!=0;if($401){label=79;break}else{label=80;break};case 79:__pixman_log_error(1400,1232);label=80;break;case 80:label=81;break;case 81:label=82;break;case 82:var $406=$3;var $407=$406|0;var $408=HEAP32[$407>>2];$x1=$408;var $409=$3;var $410=$409+8|0;var $411=HEAP32[$410>>2];$x2=$411;label=83;break;case 83:var $413=$3;var $414=$413+16|0;$3=$414;label=84;break;case 84:label=85;break;case 85:var $417=$3;var $418=$4;var $419=($417|0)!=($418|0);if($419){label=64;break}else{label=86;break};case 86:label=113;break;case 87:var $422=$5;var $423=$6;var $424=($422|0)!=($423|0);if($424){label=88;break}else{label=112;break};case 88:label=89;break;case 89:label=90;break;case 90:var $428=$5;var $429=$428|0;var $430=HEAP32[$429>>2];var $431=$x2;var $432=($430|0)<=($431|0);if($432){label=91;break}else{label=94;break};case 91:var $434=$x2;var $435=$5;var $436=$435+8|0;var $437=HEAP32[$436>>2];var $438=($434|0)<($437|0);if($438){label=92;break}else{label=93;break};case 92:var $440=$5;var $441=$440+8|0;var $442=HEAP32[$441>>2];$x2=$442;label=93;break;case 93:label=108;break;case 94:label=95;break;case 95:var $446=$2;var $447=$446+16|0;var $448=HEAP32[$447>>2];var $449=($448|0)!=0;if($449){label=96;break}else{label=97;break};case 96:var $451=$2;var $452=$451+16|0;var $453=HEAP32[$452>>2];var $454=$453+4|0;var $455=HEAP32[$454>>2];var $456=$2;var $457=$456+16|0;var $458=HEAP32[$457>>2];var $459=$458|0;var $460=HEAP32[$459>>2];var $461=($455|0)==($460|0);if($461){label=97;break}else{label=100;break};case 97:var $463=$2;var $464=_pixman_rect_alloc($463,1);var $465=($464|0)!=0;if($465){label=99;break}else{label=98;break};case 98:$1=0;label=127;break;case 99:var $468=$2;var $469=$468+16|0;var $470=HEAP32[$469>>2];var $471=$470+4|0;var $472=HEAP32[$471>>2];var $473=$2;var $474=$473+16|0;var $475=HEAP32[$474>>2];var $476=$475+8|0;var $477=$476;var $478=$477+($472<<4)|0;$next_rect=$478;label=100;break;case 100:label=101;break;case 101:var $481=$x1;var $482=$next_rect;var $483=$482|0;HEAP32[$483>>2]=$481;var $484=$7;var $485=$next_rect;var $486=$485+4|0;HEAP32[$486>>2]=$484;var $487=$x2;var $488=$next_rect;var $489=$488+8|0;HEAP32[$489>>2]=$487;var $490=$8;var $491=$next_rect;var $492=$491+12|0;HEAP32[$492>>2]=$490;var $493=$next_rect;var $494=$493+16|0;$next_rect=$494;label=102;break;case 102:var $496=$2;var $497=$496+16|0;var $498=HEAP32[$497>>2];var $499=$498+4|0;var $500=HEAP32[$499>>2];var $501=$500+1|0;HEAP32[$499>>2]=$501;label=103;break;case 103:var $503=$2;var $504=$503+16|0;var $505=HEAP32[$504>>2];var $506=$505+4|0;var $507=HEAP32[$506>>2];var $508=$2;var $509=$508+16|0;var $510=HEAP32[$509>>2];var $511=$510|0;var $512=HEAP32[$511>>2];var $513=($507|0)<=($512|0);var $514=$513^1;var $515=$514&1;var $516=$515;var $517=($516|0)!=0;if($517){label=104;break}else{label=105;break};case 104:__pixman_log_error(1400,1232);label=105;break;case 105:label=106;break;case 106:label=107;break;case 107:var $522=$5;var $523=$522|0;var $524=HEAP32[$523>>2];$x1=$524;var $525=$5;var $526=$525+8|0;var $527=HEAP32[$526>>2];$x2=$527;label=108;break;case 108:var $529=$5;var $530=$529+16|0;$5=$530;label=109;break;case 109:label=110;break;case 110:var $533=$5;var $534=$6;var $535=($533|0)!=($534|0);if($535){label=89;break}else{label=111;break};case 111:label=112;break;case 112:label=113;break;case 113:label=114;break;case 114:var $540=$2;var $541=$540+16|0;var $542=HEAP32[$541>>2];var $543=($542|0)!=0;if($543){label=115;break}else{label=116;break};case 115:var $545=$2;var $546=$545+16|0;var $547=HEAP32[$546>>2];var $548=$547+4|0;var $549=HEAP32[$548>>2];var $550=$2;var $551=$550+16|0;var $552=HEAP32[$551>>2];var $553=$552|0;var $554=HEAP32[$553>>2];var $555=($549|0)==($554|0);if($555){label=116;break}else{label=119;break};case 116:var $557=$2;var $558=_pixman_rect_alloc($557,1);var $559=($558|0)!=0;if($559){label=118;break}else{label=117;break};case 117:$1=0;label=127;break;case 118:var $562=$2;var $563=$562+16|0;var $564=HEAP32[$563>>2];var $565=$564+4|0;var $566=HEAP32[$565>>2];var $567=$2;var $568=$567+16|0;var $569=HEAP32[$568>>2];var $570=$569+8|0;var $571=$570;var $572=$571+($566<<4)|0;$next_rect=$572;label=119;break;case 119:label=120;break;case 120:var $575=$x1;var $576=$next_rect;var $577=$576|0;HEAP32[$577>>2]=$575;var $578=$7;var $579=$next_rect;var $580=$579+4|0;HEAP32[$580>>2]=$578;var $581=$x2;var $582=$next_rect;var $583=$582+8|0;HEAP32[$583>>2]=$581;var $584=$8;var $585=$next_rect;var $586=$585+12|0;HEAP32[$586>>2]=$584;var $587=$next_rect;var $588=$587+16|0;$next_rect=$588;label=121;break;case 121:var $590=$2;var $591=$590+16|0;var $592=HEAP32[$591>>2];var $593=$592+4|0;var $594=HEAP32[$593>>2];var $595=$594+1|0;HEAP32[$593>>2]=$595;label=122;break;case 122:var $597=$2;var $598=$597+16|0;var $599=HEAP32[$598>>2];var $600=$599+4|0;var $601=HEAP32[$600>>2];var $602=$2;var $603=$602+16|0;var $604=HEAP32[$603>>2];var $605=$604|0;var $606=HEAP32[$605>>2];var $607=($601|0)<=($606|0);var $608=$607^1;var $609=$608&1;var $610=$609;var $611=($610|0)!=0;if($611){label=123;break}else{label=124;break};case 123:__pixman_log_error(1400,1232);label=124;break;case 124:label=125;break;case 125:label=126;break;case 126:$1=1;label=127;break;case 127:var $617=$1;return $617}}function _pixman_region32_subtract($reg_d,$reg_m,$reg_s){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;$2=$reg_d;$3=$reg_m;$4=$reg_s;var $5=$3;var $6=$5+16|0;var $7=HEAP32[$6>>2];var $8=($7|0)!=0;if($8){label=2;break}else{label=3;break};case 2:var $10=$3;var $11=$10+16|0;var $12=HEAP32[$11>>2];var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=($14|0)!=0;if($15){label=3;break}else{label=9;break};case 3:var $17=$4;var $18=$17+16|0;var $19=HEAP32[$18>>2];var $20=($19|0)!=0;if($20){label=4;break}else{label=5;break};case 4:var $22=$4;var $23=$22+16|0;var $24=HEAP32[$23>>2];var $25=$24+4|0;var $26=HEAP32[$25>>2];var $27=($26|0)!=0;if($27){label=5;break}else{label=9;break};case 5:var $29=$3;var $30=$29|0;var $31=$30+8|0;var $32=HEAP32[$31>>2];var $33=$4;var $34=$33|0;var $35=$34|0;var $36=HEAP32[$35>>2];var $37=($32|0)<=($36|0);if($37){label=9;break}else{label=6;break};case 6:var $39=$3;var $40=$39|0;var $41=$40|0;var $42=HEAP32[$41>>2];var $43=$4;var $44=$43|0;var $45=$44+8|0;var $46=HEAP32[$45>>2];var $47=($42|0)>=($46|0);if($47){label=9;break}else{label=7;break};case 7:var $49=$3;var $50=$49|0;var $51=$50+12|0;var $52=HEAP32[$51>>2];var $53=$4;var $54=$53|0;var $55=$54+4|0;var $56=HEAP32[$55>>2];var $57=($52|0)<=($56|0);if($57){label=9;break}else{label=8;break};case 8:var $59=$3;var $60=$59|0;var $61=$60+4|0;var $62=HEAP32[$61>>2];var $63=$4;var $64=$63|0;var $65=$64+12|0;var $66=HEAP32[$65>>2];var $67=($62|0)>=($66|0);if($67){label=9;break}else{label=12;break};case 9:var $69=$4;var $70=$69+16|0;var $71=HEAP32[$70>>2];var $72=HEAP32[184>>2];var $73=($71|0)==($72|0);if($73){label=10;break}else{label=11;break};case 10:var $75=$2;var $76=_pixman_break($75);$1=$76;label=21;break;case 11:var $78=$2;var $79=$3;var $80=_pixman_region32_copy($78,$79);$1=$80;label=21;break;case 12:var $82=$3;var $83=$4;var $84=($82|0)==($83|0);if($84){label=13;break}else{label=17;break};case 13:var $86=$2;var $87=$86+16|0;var $88=HEAP32[$87>>2];var $89=($88|0)!=0;if($89){label=14;break}else{label=16;break};case 14:var $91=$2;var $92=$91+16|0;var $93=HEAP32[$92>>2];var $94=$93|0;var $95=HEAP32[$94>>2];var $96=($95|0)!=0;if($96){label=15;break}else{label=16;break};case 15:var $98=$2;var $99=$98+16|0;var $100=HEAP32[$99>>2];var $101=$100;_free($101);label=16;break;case 16:var $103=$2;var $104=$103|0;var $105=$104|0;var $106=HEAP32[$105>>2];var $107=$2;var $108=$107|0;var $109=$108+8|0;HEAP32[$109>>2]=$106;var $110=$2;var $111=$110|0;var $112=$111+4|0;var $113=HEAP32[$112>>2];var $114=$2;var $115=$114|0;var $116=$115+12|0;HEAP32[$116>>2]=$113;var $117=HEAP32[168>>2];var $118=$2;var $119=$118+16|0;HEAP32[$119>>2]=$117;$1=1;label=21;break;case 17:label=18;break;case 18:var $122=$2;var $123=$3;var $124=$4;var $125=_pixman_op($122,$123,$124,34,1,0);var $126=($125|0)!=0;if($126){label=20;break}else{label=19;break};case 19:$1=0;label=21;break;case 20:var $129=$2;_pixman_set_extents($129);$1=1;label=21;break;case 21:var $131=$1;return $131}}function _pixman_region_subtract_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $7;var $8;var $next_rect;var $x1;$2=$region;$3=$r1;$4=$r1_end;$5=$r2;$6=$r2_end;$7=$y1;$8=$y2;var $9=$3;var $10=$9|0;var $11=HEAP32[$10>>2];$x1=$11;label=2;break;case 2:var $13=$7;var $14=$8;var $15=($13|0)<($14|0);var $16=$15^1;var $17=$16&1;var $18=$17;var $19=($18|0)!=0;if($19){label=3;break}else{label=4;break};case 3:__pixman_log_error(1520,464);label=4;break;case 4:label=5;break;case 5:label=6;break;case 6:var $24=$3;var $25=$4;var $26=($24|0)!=($25|0);if($26){label=7;break}else{var $32=0;label=8;break};case 7:var $28=$5;var $29=$6;var $30=($28|0)!=($29|0);var $32=$30;label=8;break;case 8:var $32;var $33=$32^1;var $34=$33&1;var $35=$34;var $36=($35|0)!=0;if($36){label=9;break}else{label=10;break};case 9:__pixman_log_error(1520,408);label=10;break;case 10:label=11;break;case 11:var $40=$2;var $41=$40+16|0;var $42=HEAP32[$41>>2];var $43=$42+4|0;var $44=HEAP32[$43>>2];var $45=$2;var $46=$45+16|0;var $47=HEAP32[$46>>2];var $48=$47+8|0;var $49=$48;var $50=$49+($44<<4)|0;$next_rect=$50;label=12;break;case 12:var $52=$5;var $53=$52+8|0;var $54=HEAP32[$53>>2];var $55=$x1;var $56=($54|0)<=($55|0);if($56){label=13;break}else{label=14;break};case 13:var $58=$5;var $59=$58+16|0;$5=$59;label=65;break;case 14:var $61=$5;var $62=$61|0;var $63=HEAP32[$62>>2];var $64=$x1;var $65=($63|0)<=($64|0);if($65){label=15;break}else{label=21;break};case 15:var $67=$5;var $68=$67+8|0;var $69=HEAP32[$68>>2];$x1=$69;var $70=$x1;var $71=$3;var $72=$71+8|0;var $73=HEAP32[$72>>2];var $74=($70|0)>=($73|0);if($74){label=16;break}else{label=19;break};case 16:var $76=$3;var $77=$76+16|0;$3=$77;var $78=$3;var $79=$4;var $80=($78|0)!=($79|0);if($80){label=17;break}else{label=18;break};case 17:var $82=$3;var $83=$82|0;var $84=HEAP32[$83>>2];$x1=$84;label=18;break;case 18:label=20;break;case 19:var $87=$5;var $88=$87+16|0;$5=$88;label=20;break;case 20:label=64;break;case 21:var $91=$5;var $92=$91|0;var $93=HEAP32[$92>>2];var $94=$3;var $95=$94+8|0;var $96=HEAP32[$95>>2];var $97=($93|0)<($96|0);if($97){label=22;break}else{label=45;break};case 22:label=23;break;case 23:var $100=$x1;var $101=$5;var $102=$101|0;var $103=HEAP32[$102>>2];var $104=($100|0)<($103|0);var $105=$104^1;var $106=$105&1;var $107=$106;var $108=($107|0)!=0;if($108){label=24;break}else{label=25;break};case 24:__pixman_log_error(1520,368);label=25;break;case 25:label=26;break;case 26:label=27;break;case 27:var $113=$2;var $114=$113+16|0;var $115=HEAP32[$114>>2];var $116=($115|0)!=0;if($116){label=28;break}else{label=29;break};case 28:var $118=$2;var $119=$118+16|0;var $120=HEAP32[$119>>2];var $121=$120+4|0;var $122=HEAP32[$121>>2];var $123=$2;var $124=$123+16|0;var $125=HEAP32[$124>>2];var $126=$125|0;var $127=HEAP32[$126>>2];var $128=($122|0)==($127|0);if($128){label=29;break}else{label=32;break};case 29:var $130=$2;var $131=_pixman_rect_alloc($130,1);var $132=($131|0)!=0;if($132){label=31;break}else{label=30;break};case 30:$1=0;label=92;break;case 31:var $135=$2;var $136=$135+16|0;var $137=HEAP32[$136>>2];var $138=$137+4|0;var $139=HEAP32[$138>>2];var $140=$2;var $141=$140+16|0;var $142=HEAP32[$141>>2];var $143=$142+8|0;var $144=$143;var $145=$144+($139<<4)|0;$next_rect=$145;label=32;break;case 32:label=33;break;case 33:var $148=$x1;var $149=$next_rect;var $150=$149|0;HEAP32[$150>>2]=$148;var $151=$7;var $152=$next_rect;var $153=$152+4|0;HEAP32[$153>>2]=$151;var $154=$5;var $155=$154|0;var $156=HEAP32[$155>>2];var $157=$next_rect;var $158=$157+8|0;HEAP32[$158>>2]=$156;var $159=$8;var $160=$next_rect;var $161=$160+12|0;HEAP32[$161>>2]=$159;var $162=$next_rect;var $163=$162+16|0;$next_rect=$163;label=34;break;case 34:var $165=$2;var $166=$165+16|0;var $167=HEAP32[$166>>2];var $168=$167+4|0;var $169=HEAP32[$168>>2];var $170=$169+1|0;HEAP32[$168>>2]=$170;label=35;break;case 35:var $172=$2;var $173=$172+16|0;var $174=HEAP32[$173>>2];var $175=$174+4|0;var $176=HEAP32[$175>>2];var $177=$2;var $178=$177+16|0;var $179=HEAP32[$178>>2];var $180=$179|0;var $181=HEAP32[$180>>2];var $182=($176|0)<=($181|0);var $183=$182^1;var $184=$183&1;var $185=$184;var $186=($185|0)!=0;if($186){label=36;break}else{label=37;break};case 36:__pixman_log_error(1520,1232);label=37;break;case 37:label=38;break;case 38:label=39;break;case 39:var $191=$5;var $192=$191+8|0;var $193=HEAP32[$192>>2];$x1=$193;var $194=$x1;var $195=$3;var $196=$195+8|0;var $197=HEAP32[$196>>2];var $198=($194|0)>=($197|0);if($198){label=40;break}else{label=43;break};case 40:var $200=$3;var $201=$200+16|0;$3=$201;var $202=$3;var $203=$4;var $204=($202|0)!=($203|0);if($204){label=41;break}else{label=42;break};case 41:var $206=$3;var $207=$206|0;var $208=HEAP32[$207>>2];$x1=$208;label=42;break;case 42:label=44;break;case 43:var $211=$5;var $212=$211+16|0;$5=$212;label=44;break;case 44:label=63;break;case 45:var $215=$3;var $216=$215+8|0;var $217=HEAP32[$216>>2];var $218=$x1;var $219=($217|0)>($218|0);if($219){label=46;break}else{label=60;break};case 46:label=47;break;case 47:var $222=$2;var $223=$222+16|0;var $224=HEAP32[$223>>2];var $225=($224|0)!=0;if($225){label=48;break}else{label=49;break};case 48:var $227=$2;var $228=$227+16|0;var $229=HEAP32[$228>>2];var $230=$229+4|0;var $231=HEAP32[$230>>2];var $232=$2;var $233=$232+16|0;var $234=HEAP32[$233>>2];var $235=$234|0;var $236=HEAP32[$235>>2];var $237=($231|0)==($236|0);if($237){label=49;break}else{label=52;break};case 49:var $239=$2;var $240=_pixman_rect_alloc($239,1);var $241=($240|0)!=0;if($241){label=51;break}else{label=50;break};case 50:$1=0;label=92;break;case 51:var $244=$2;var $245=$244+16|0;var $246=HEAP32[$245>>2];var $247=$246+4|0;var $248=HEAP32[$247>>2];var $249=$2;var $250=$249+16|0;var $251=HEAP32[$250>>2];var $252=$251+8|0;var $253=$252;var $254=$253+($248<<4)|0;$next_rect=$254;label=52;break;case 52:label=53;break;case 53:var $257=$x1;var $258=$next_rect;var $259=$258|0;HEAP32[$259>>2]=$257;var $260=$7;var $261=$next_rect;var $262=$261+4|0;HEAP32[$262>>2]=$260;var $263=$3;var $264=$263+8|0;var $265=HEAP32[$264>>2];var $266=$next_rect;var $267=$266+8|0;HEAP32[$267>>2]=$265;var $268=$8;var $269=$next_rect;var $270=$269+12|0;HEAP32[$270>>2]=$268;var $271=$next_rect;var $272=$271+16|0;$next_rect=$272;label=54;break;case 54:var $274=$2;var $275=$274+16|0;var $276=HEAP32[$275>>2];var $277=$276+4|0;var $278=HEAP32[$277>>2];var $279=$278+1|0;HEAP32[$277>>2]=$279;label=55;break;case 55:var $281=$2;var $282=$281+16|0;var $283=HEAP32[$282>>2];var $284=$283+4|0;var $285=HEAP32[$284>>2];var $286=$2;var $287=$286+16|0;var $288=HEAP32[$287>>2];var $289=$288|0;var $290=HEAP32[$289>>2];var $291=($285|0)<=($290|0);var $292=$291^1;var $293=$292&1;var $294=$293;var $295=($294|0)!=0;if($295){label=56;break}else{label=57;break};case 56:__pixman_log_error(1520,1232);label=57;break;case 57:label=58;break;case 58:label=59;break;case 59:label=60;break;case 60:var $301=$3;var $302=$301+16|0;$3=$302;var $303=$3;var $304=$4;var $305=($303|0)!=($304|0);if($305){label=61;break}else{label=62;break};case 61:var $307=$3;var $308=$307|0;var $309=HEAP32[$308>>2];$x1=$309;label=62;break;case 62:label=63;break;case 63:label=64;break;case 64:label=65;break;case 65:label=66;break;case 66:var $315=$3;var $316=$4;var $317=($315|0)!=($316|0);if($317){label=67;break}else{var $323=0;label=68;break};case 67:var $319=$5;var $320=$6;var $321=($319|0)!=($320|0);var $323=$321;label=68;break;case 68:var $323;if($323){label=12;break}else{label=69;break};case 69:label=70;break;case 70:var $326=$3;var $327=$4;var $328=($326|0)!=($327|0);if($328){label=71;break}else{label=91;break};case 71:label=72;break;case 72:var $331=$x1;var $332=$3;var $333=$332+8|0;var $334=HEAP32[$333>>2];var $335=($331|0)<($334|0);var $336=$335^1;var $337=$336&1;var $338=$337;var $339=($338|0)!=0;if($339){label=73;break}else{label=74;break};case 73:__pixman_log_error(1520,1192);label=74;break;case 74:label=75;break;case 75:label=76;break;case 76:var $344=$2;var $345=$344+16|0;var $346=HEAP32[$345>>2];var $347=($346|0)!=0;if($347){label=77;break}else{label=78;break};case 77:var $349=$2;var $350=$349+16|0;var $351=HEAP32[$350>>2];var $352=$351+4|0;var $353=HEAP32[$352>>2];var $354=$2;var $355=$354+16|0;var $356=HEAP32[$355>>2];var $357=$356|0;var $358=HEAP32[$357>>2];var $359=($353|0)==($358|0);if($359){label=78;break}else{label=81;break};case 78:var $361=$2;var $362=_pixman_rect_alloc($361,1);var $363=($362|0)!=0;if($363){label=80;break}else{label=79;break};case 79:$1=0;label=92;break;case 80:var $366=$2;var $367=$366+16|0;var $368=HEAP32[$367>>2];var $369=$368+4|0;var $370=HEAP32[$369>>2];var $371=$2;var $372=$371+16|0;var $373=HEAP32[$372>>2];var $374=$373+8|0;var $375=$374;var $376=$375+($370<<4)|0;$next_rect=$376;label=81;break;case 81:label=82;break;case 82:var $379=$x1;var $380=$next_rect;var $381=$380|0;HEAP32[$381>>2]=$379;var $382=$7;var $383=$next_rect;var $384=$383+4|0;HEAP32[$384>>2]=$382;var $385=$3;var $386=$385+8|0;var $387=HEAP32[$386>>2];var $388=$next_rect;var $389=$388+8|0;HEAP32[$389>>2]=$387;var $390=$8;var $391=$next_rect;var $392=$391+12|0;HEAP32[$392>>2]=$390;var $393=$next_rect;var $394=$393+16|0;$next_rect=$394;label=83;break;case 83:var $396=$2;var $397=$396+16|0;var $398=HEAP32[$397>>2];var $399=$398+4|0;var $400=HEAP32[$399>>2];var $401=$400+1|0;HEAP32[$399>>2]=$401;label=84;break;case 84:var $403=$2;var $404=$403+16|0;var $405=HEAP32[$404>>2];var $406=$405+4|0;var $407=HEAP32[$406>>2];var $408=$2;var $409=$408+16|0;var $410=HEAP32[$409>>2];var $411=$410|0;var $412=HEAP32[$411>>2];var $413=($407|0)<=($412|0);var $414=$413^1;var $415=$414&1;var $416=$415;var $417=($416|0)!=0;if($417){label=85;break}else{label=86;break};case 85:__pixman_log_error(1520,1232);label=86;break;case 86:label=87;break;case 87:label=88;break;case 88:var $422=$3;var $423=$422+16|0;$3=$423;var $424=$3;var $425=$4;var $426=($424|0)!=($425|0);if($426){label=89;break}else{label=90;break};case 89:var $428=$3;var $429=$428|0;var $430=HEAP32[$429>>2];$x1=$430;label=90;break;case 90:label=70;break;case 91:$1=1;label=92;break;case 92:var $434=$1;return $434}}function _pixman_region32_inverse($new_reg,$reg1,$inv_rect){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+24|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $inv_reg=sp;$2=$new_reg;$3=$reg1;$4=$inv_rect;var $5=$3;var $6=$5+16|0;var $7=HEAP32[$6>>2];var $8=($7|0)!=0;if($8){label=2;break}else{label=3;break};case 2:var $10=$3;var $11=$10+16|0;var $12=HEAP32[$11>>2];var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=($14|0)!=0;if($15){label=3;break}else{label=7;break};case 3:var $17=$4;var $18=$17+8|0;var $19=HEAP32[$18>>2];var $20=$3;var $21=$20|0;var $22=$21|0;var $23=HEAP32[$22>>2];var $24=($19|0)<=($23|0);if($24){label=7;break}else{label=4;break};case 4:var $26=$4;var $27=$26|0;var $28=HEAP32[$27>>2];var $29=$3;var $30=$29|0;var $31=$30+8|0;var $32=HEAP32[$31>>2];var $33=($28|0)>=($32|0);if($33){label=7;break}else{label=5;break};case 5:var $35=$4;var $36=$35+12|0;var $37=HEAP32[$36>>2];var $38=$3;var $39=$38|0;var $40=$39+4|0;var $41=HEAP32[$40>>2];var $42=($37|0)<=($41|0);if($42){label=7;break}else{label=6;break};case 6:var $44=$4;var $45=$44+4|0;var $46=HEAP32[$45>>2];var $47=$3;var $48=$47|0;var $49=$48+12|0;var $50=HEAP32[$49>>2];var $51=($46|0)>=($50|0);if($51){label=7;break}else{label=13;break};case 7:var $53=$3;var $54=$53+16|0;var $55=HEAP32[$54>>2];var $56=HEAP32[184>>2];var $57=($55|0)==($56|0);if($57){label=8;break}else{label=9;break};case 8:var $59=$2;var $60=_pixman_break($59);$1=$60;label=16;break;case 9:var $62=$2;var $63=$62|0;var $64=$4;var $65=$63;var $66=$64;HEAP32[$65>>2]=HEAP32[$66>>2];HEAP32[$65+4>>2]=HEAP32[$66+4>>2];HEAP32[$65+8>>2]=HEAP32[$66+8>>2];HEAP32[$65+12>>2]=HEAP32[$66+12>>2];var $67=$2;var $68=$67+16|0;var $69=HEAP32[$68>>2];var $70=($69|0)!=0;if($70){label=10;break}else{label=12;break};case 10:var $72=$2;var $73=$72+16|0;var $74=HEAP32[$73>>2];var $75=$74|0;var $76=HEAP32[$75>>2];var $77=($76|0)!=0;if($77){label=11;break}else{label=12;break};case 11:var $79=$2;var $80=$79+16|0;var $81=HEAP32[$80>>2];var $82=$81;_free($82);label=12;break;case 12:var $84=$2;var $85=$84+16|0;HEAP32[$85>>2]=0;$1=1;label=16;break;case 13:var $87=$inv_reg|0;var $88=$4;var $89=$87;var $90=$88;HEAP32[$89>>2]=HEAP32[$90>>2];HEAP32[$89+4>>2]=HEAP32[$90+4>>2];HEAP32[$89+8>>2]=HEAP32[$90+8>>2];HEAP32[$89+12>>2]=HEAP32[$90+12>>2];var $91=$inv_reg+16|0;HEAP32[$91>>2]=0;var $92=$2;var $93=$3;var $94=_pixman_op($92,$inv_reg,$93,34,1,0);var $95=($94|0)!=0;if($95){label=15;break}else{label=14;break};case 14:$1=0;label=16;break;case 15:var $98=$2;_pixman_set_extents($98);$1=1;label=16;break;case 16:var $100=$1;STACKTOP=sp;return $100}}function _pixman_region32_contains_rectangle($region,$prect){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $pbox;var $pbox_end;var $part_in;var $part_out;var $numRects;var $x;var $y;$2=$region;$3=$prect;var $4=$2;var $5=$4+16|0;var $6=HEAP32[$5>>2];var $7=($6|0)!=0;if($7){label=2;break}else{label=3;break};case 2:var $9=$2;var $10=$9+16|0;var $11=HEAP32[$10>>2];var $12=$11+4|0;var $13=HEAP32[$12>>2];var $16=$13;label=4;break;case 3:var $16=1;label=4;break;case 4:var $16;$numRects=$16;var $17=$numRects;var $18=($17|0)!=0;if($18){label=5;break}else{label=9;break};case 5:var $20=$2;var $21=$20|0;var $22=$21+8|0;var $23=HEAP32[$22>>2];var $24=$3;var $25=$24|0;var $26=HEAP32[$25>>2];var $27=($23|0)<=($26|0);if($27){label=9;break}else{label=6;break};case 6:var $29=$2;var $30=$29|0;var $31=$30|0;var $32=HEAP32[$31>>2];var $33=$3;var $34=$33+8|0;var $35=HEAP32[$34>>2];var $36=($32|0)>=($35|0);if($36){label=9;break}else{label=7;break};case 7:var $38=$2;var $39=$38|0;var $40=$39+12|0;var $41=HEAP32[$40>>2];var $42=$3;var $43=$42+4|0;var $44=HEAP32[$43>>2];var $45=($41|0)<=($44|0);if($45){label=9;break}else{label=8;break};case 8:var $47=$2;var $48=$47|0;var $49=$48+4|0;var $50=HEAP32[$49>>2];var $51=$3;var $52=$51+12|0;var $53=HEAP32[$52>>2];var $54=($50|0)>=($53|0);if($54){label=9;break}else{label=10;break};case 9:$1=0;label=50;break;case 10:var $57=$numRects;var $58=($57|0)==1;if($58){label=11;break}else{label=17;break};case 11:var $60=$2;var $61=$60|0;var $62=$61|0;var $63=HEAP32[$62>>2];var $64=$3;var $65=$64|0;var $66=HEAP32[$65>>2];var $67=($63|0)<=($66|0);if($67){label=12;break}else{label=16;break};case 12:var $69=$2;var $70=$69|0;var $71=$70+8|0;var $72=HEAP32[$71>>2];var $73=$3;var $74=$73+8|0;var $75=HEAP32[$74>>2];var $76=($72|0)>=($75|0);if($76){label=13;break}else{label=16;break};case 13:var $78=$2;var $79=$78|0;var $80=$79+4|0;var $81=HEAP32[$80>>2];var $82=$3;var $83=$82+4|0;var $84=HEAP32[$83>>2];var $85=($81|0)<=($84|0);if($85){label=14;break}else{label=16;break};case 14:var $87=$2;var $88=$87|0;var $89=$88+12|0;var $90=HEAP32[$89>>2];var $91=$3;var $92=$91+12|0;var $93=HEAP32[$92>>2];var $94=($90|0)>=($93|0);if($94){label=15;break}else{label=16;break};case 15:$1=1;label=50;break;case 16:$1=2;label=50;break;case 17:$part_out=0;$part_in=0;var $98=$3;var $99=$98|0;var $100=HEAP32[$99>>2];$x=$100;var $101=$3;var $102=$101+4|0;var $103=HEAP32[$102>>2];$y=$103;var $104=$2;var $105=$104+16|0;var $106=HEAP32[$105>>2];var $107=$106+8|0;var $108=$107;$pbox=$108;var $109=$pbox;var $110=$numRects;var $111=$109+($110<<4)|0;$pbox_end=$111;label=18;break;case 18:var $113=$pbox;var $114=$pbox_end;var $115=($113|0)!=($114|0);if($115){label=19;break}else{label=45;break};case 19:var $117=$pbox;var $118=$117+12|0;var $119=HEAP32[$118>>2];var $120=$y;var $121=($119|0)<=($120|0);if($121){label=20;break}else{label=23;break};case 20:var $123=$pbox;var $124=$pbox_end;var $125=$y;var $126=_find_box_for_y($123,$124,$125);$pbox=$126;var $127=$pbox_end;var $128=($126|0)==($127|0);if($128){label=21;break}else{label=22;break};case 21:label=45;break;case 22:label=23;break;case 23:var $132=$pbox;var $133=$132+4|0;var $134=HEAP32[$133>>2];var $135=$y;var $136=($134|0)>($135|0);if($136){label=24;break}else{label=28;break};case 24:$part_out=1;var $138=$part_in;var $139=($138|0)!=0;if($139){label=26;break}else{label=25;break};case 25:var $141=$pbox;var $142=$141+4|0;var $143=HEAP32[$142>>2];var $144=$3;var $145=$144+12|0;var $146=HEAP32[$145>>2];var $147=($143|0)>=($146|0);if($147){label=26;break}else{label=27;break};case 26:label=45;break;case 27:var $150=$pbox;var $151=$150+4|0;var $152=HEAP32[$151>>2];$y=$152;label=28;break;case 28:var $154=$pbox;var $155=$154+8|0;var $156=HEAP32[$155>>2];var $157=$x;var $158=($156|0)<=($157|0);if($158){label=29;break}else{label=30;break};case 29:label=44;break;case 30:var $161=$pbox;var $162=$161|0;var $163=HEAP32[$162>>2];var $164=$x;var $165=($163|0)>($164|0);if($165){label=31;break}else{label=34;break};case 31:$part_out=1;var $167=$part_in;var $168=($167|0)!=0;if($168){label=32;break}else{label=33;break};case 32:label=45;break;case 33:label=34;break;case 34:var $172=$pbox;var $173=$172|0;var $174=HEAP32[$173>>2];var $175=$3;var $176=$175+8|0;var $177=HEAP32[$176>>2];var $178=($174|0)<($177|0);if($178){label=35;break}else{label=38;break};case 35:$part_in=1;var $180=$part_out;var $181=($180|0)!=0;if($181){label=36;break}else{label=37;break};case 36:label=45;break;case 37:label=38;break;case 38:var $185=$pbox;var $186=$185+8|0;var $187=HEAP32[$186>>2];var $188=$3;var $189=$188+8|0;var $190=HEAP32[$189>>2];var $191=($187|0)>=($190|0);if($191){label=39;break}else{label=42;break};case 39:var $193=$pbox;var $194=$193+12|0;var $195=HEAP32[$194>>2];$y=$195;var $196=$y;var $197=$3;var $198=$197+12|0;var $199=HEAP32[$198>>2];var $200=($196|0)>=($199|0);if($200){label=40;break}else{label=41;break};case 40:label=45;break;case 41:var $203=$3;var $204=$203|0;var $205=HEAP32[$204>>2];$x=$205;label=43;break;case 42:$part_out=1;label=45;break;case 43:label=44;break;case 44:var $209=$pbox;var $210=$209+16|0;$pbox=$210;label=18;break;case 45:var $212=$part_in;var $213=($212|0)!=0;if($213){label=46;break}else{label=49;break};case 46:var $215=$y;var $216=$3;var $217=$216+12|0;var $218=HEAP32[$217>>2];var $219=($215|0)<($218|0);if($219){label=47;break}else{label=48;break};case 47:$1=2;label=50;break;case 48:$1=1;label=50;break;case 49:$1=0;label=50;break;case 50:var $224=$1;return $224}}function _find_box_for_y($begin,$end,$y){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $mid;$2=$begin;$3=$end;$4=$y;var $5=$3;var $6=$2;var $7=($5|0)==($6|0);if($7){label=2;break}else{label=3;break};case 2:var $9=$3;$1=$9;label=10;break;case 3:var $11=$3;var $12=$2;var $13=$11;var $14=$12;var $15=$13-$14|0;var $16=($15|0)/16&-1;var $17=($16|0)==1;if($17){label=4;break}else{label=7;break};case 4:var $19=$2;var $20=$19+12|0;var $21=HEAP32[$20>>2];var $22=$4;var $23=($21|0)>($22|0);if($23){label=5;break}else{label=6;break};case 5:var $25=$2;$1=$25;label=10;break;case 6:var $27=$3;$1=$27;label=10;break;case 7:var $29=$2;var $30=$3;var $31=$2;var $32=$30;var $33=$31;var $34=$32-$33|0;var $35=($34|0)/16&-1;var $36=($35|0)/2&-1;var $37=$29+($36<<4)|0;$mid=$37;var $38=$mid;var $39=$38+12|0;var $40=HEAP32[$39>>2];var $41=$4;var $42=($40|0)>($41|0);if($42){label=8;break}else{label=9;break};case 8:var $44=$2;var $45=$mid;var $46=$4;var $47=_find_box_for_y($44,$45,$46);$1=$47;label=10;break;case 9:var $49=$mid;var $50=$3;var $51=$4;var $52=_find_box_for_y($49,$50,$51);$1=$52;label=10;break;case 10:var $54=$1;return $54}}function _pixman_region32_not_empty($region){var label=0;label=1;while(1)switch(label){case 1:var $1;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{var $15=0;label=3;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9+4|0;var $11=HEAP32[$10>>2];var $12=($11|0)!=0;var $13=$12^1;var $15=$13;label=3;break;case 3:var $15;var $16=$15^1;var $17=$16&1;return $17}}function _pixman_region32_extents($region){return $region|0}function _pixman_region32_translate($region,$x,$y){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+32|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $x1=sp;var $x2=sp+8;var $y1=sp+16;var $y2=sp+24;var $nbox;var $pbox;var $pbox_out;$1=$region;$2=$x;$3=$y;var $4=$1;var $5=$4|0;var $6=$5|0;var $7=HEAP32[$6>>2];var $8=$2;var $9=$7+$8|0;var $10$0=$9;var $10$1=($9|0)<0?-1:0;var $st$0$0=$x1|0;HEAP32[$st$0$0>>2]=$10$0;var $st$1$1=$x1+4|0;HEAP32[$st$1$1>>2]=$10$1;var $11$0=$10$0;var $11=$11$0;var $12=$1;var $13=$12|0;var $14=$13|0;HEAP32[$14>>2]=$11;var $15=$1;var $16=$15|0;var $17=$16+4|0;var $18=HEAP32[$17>>2];var $19=$3;var $20=$18+$19|0;var $21$0=$20;var $21$1=($20|0)<0?-1:0;var $st$2$0=$y1|0;HEAP32[$st$2$0>>2]=$21$0;var $st$3$1=$y1+4|0;HEAP32[$st$3$1>>2]=$21$1;var $22$0=$21$0;var $22=$22$0;var $23=$1;var $24=$23|0;var $25=$24+4|0;HEAP32[$25>>2]=$22;var $26=$1;var $27=$26|0;var $28=$27+8|0;var $29=HEAP32[$28>>2];var $30=$2;var $31=$29+$30|0;var $32$0=$31;var $32$1=($31|0)<0?-1:0;var $st$4$0=$x2|0;HEAP32[$st$4$0>>2]=$32$0;var $st$5$1=$x2+4|0;HEAP32[$st$5$1>>2]=$32$1;var $33$0=$32$0;var $33=$33$0;var $34=$1;var $35=$34|0;var $36=$35+8|0;HEAP32[$36>>2]=$33;var $37=$1;var $38=$37|0;var $39=$38+12|0;var $40=HEAP32[$39>>2];var $41=$3;var $42=$40+$41|0;var $43$0=$42;var $43$1=($42|0)<0?-1:0;var $st$6$0=$y2|0;HEAP32[$st$6$0>>2]=$43$0;var $st$7$1=$y2+4|0;HEAP32[$st$7$1>>2]=$43$1;var $44$0=$43$0;var $44=$44$0;var $45=$1;var $46=$45|0;var $47=$46+12|0;HEAP32[$47>>2]=$44;var $ld$8$0=$x1|0;var $48$0=HEAP32[$ld$8$0>>2];var $ld$9$1=$x1+4|0;var $48$1=HEAP32[$ld$9$1>>2];var $$etemp$10$0=-2147483648;var $$etemp$10$1=-1;var $49$0=_i64Subtract($48$0,$48$1,$$etemp$10$0,$$etemp$10$1);var $49$1=tempRet0;var $ld$11$0=$y1|0;var $50$0=HEAP32[$ld$11$0>>2];var $ld$12$1=$y1+4|0;var $50$1=HEAP32[$ld$12$1>>2];var $$etemp$13$0=-2147483648;var $$etemp$13$1=-1;var $51$0=_i64Subtract($50$0,$50$1,$$etemp$13$0,$$etemp$13$1);var $51$1=tempRet0;var $52$0=$49$0|$51$0;var $52$1=$49$1|$51$1;var $ld$14$0=$x2|0;var $53$0=HEAP32[$ld$14$0>>2];var $ld$15$1=$x2+4|0;var $53$1=HEAP32[$ld$15$1>>2];var $$etemp$16$0=2147483647;var $$etemp$16$1=0;var $54$0=_i64Subtract($$etemp$16$0,$$etemp$16$1,$53$0,$53$1);var $54$1=tempRet0;var $55$0=$52$0|$54$0;var $55$1=$52$1|$54$1;var $ld$17$0=$y2|0;var $56$0=HEAP32[$ld$17$0>>2];var $ld$18$1=$y2+4|0;var $56$1=HEAP32[$ld$18$1>>2];var $$etemp$19$0=2147483647;var $$etemp$19$1=0;var $57$0=_i64Subtract($$etemp$19$0,$$etemp$19$1,$56$0,$56$1);var $57$1=tempRet0;var $58$0=$55$0|$57$0;var $58$1=$55$1|$57$1;var $$etemp$20$0=0;var $$etemp$20$1=0;var $59=($58$1|0)>=($$etemp$20$1|0)&(($58$1|0)>($$etemp$20$1|0)|$58$0>>>0>=$$etemp$20$0>>>0);if($59){label=2;break}else{label=10;break};case 2:var $61=$1;var $62=$61+16|0;var $63=HEAP32[$62>>2];var $64=($63|0)!=0;if($64){label=3;break}else{label=9;break};case 3:var $66=$1;var $67=$66+16|0;var $68=HEAP32[$67>>2];var $69=$68+4|0;var $70=HEAP32[$69>>2];$nbox=$70;var $71=($70|0)!=0;if($71){label=4;break}else{label=9;break};case 4:var $73=$1;var $74=$73+16|0;var $75=HEAP32[$74>>2];var $76=$75+8|0;var $77=$76;$pbox=$77;label=5;break;case 5:var $79=$nbox;var $80=$79-1|0;$nbox=$80;var $81=($79|0)!=0;if($81){label=6;break}else{label=8;break};case 6:var $83=$2;var $84=$pbox;var $85=$84|0;var $86=HEAP32[$85>>2];var $87=$86+$83|0;HEAP32[$85>>2]=$87;var $88=$3;var $89=$pbox;var $90=$89+4|0;var $91=HEAP32[$90>>2];var $92=$91+$88|0;HEAP32[$90>>2]=$92;var $93=$2;var $94=$pbox;var $95=$94+8|0;var $96=HEAP32[$95>>2];var $97=$96+$93|0;HEAP32[$95>>2]=$97;var $98=$3;var $99=$pbox;var $100=$99+12|0;var $101=HEAP32[$100>>2];var $102=$101+$98|0;HEAP32[$100>>2]=$102;label=7;break;case 7:var $104=$pbox;var $105=$104+16|0;$pbox=$105;label=5;break;case 8:label=9;break;case 9:label=52;break;case 10:var $ld$21$0=$x2|0;var $109$0=HEAP32[$ld$21$0>>2];var $ld$22$1=$x2+4|0;var $109$1=HEAP32[$ld$22$1>>2];var $$etemp$23$0=-2147483648;var $$etemp$23$1=-1;var $110$0=_i64Subtract($109$0,$109$1,$$etemp$23$0,$$etemp$23$1);var $110$1=tempRet0;var $ld$24$0=$y2|0;var $111$0=HEAP32[$ld$24$0>>2];var $ld$25$1=$y2+4|0;var $111$1=HEAP32[$ld$25$1>>2];var $$etemp$26$0=-2147483648;var $$etemp$26$1=-1;var $112$0=_i64Subtract($111$0,$111$1,$$etemp$26$0,$$etemp$26$1);var $112$1=tempRet0;var $113$0=$110$0|$112$0;var $113$1=$110$1|$112$1;var $ld$27$0=$x1|0;var $114$0=HEAP32[$ld$27$0>>2];var $ld$28$1=$x1+4|0;var $114$1=HEAP32[$ld$28$1>>2];var $$etemp$29$0=2147483647;var $$etemp$29$1=0;var $115$0=_i64Subtract($$etemp$29$0,$$etemp$29$1,$114$0,$114$1);var $115$1=tempRet0;var $116$0=$113$0|$115$0;var $116$1=$113$1|$115$1;var $ld$30$0=$y1|0;var $117$0=HEAP32[$ld$30$0>>2];var $ld$31$1=$y1+4|0;var $117$1=HEAP32[$ld$31$1>>2];var $$etemp$32$0=2147483647;var $$etemp$32$1=0;var $118$0=_i64Subtract($$etemp$32$0,$$etemp$32$1,$117$0,$117$1);var $118$1=tempRet0;var $119$0=$116$0|$118$0;var $119$1=$116$1|$118$1;var $$etemp$33$0=0;var $$etemp$33$1=0;var $120=($119$1|0)<=($$etemp$33$1|0)&(($119$1|0)<($$etemp$33$1|0)|$119$0>>>0<=$$etemp$33$0>>>0);if($120){label=11;break}else{label=15;break};case 11:var $122=$1;var $123=$122|0;var $124=$123|0;var $125=HEAP32[$124>>2];var $126=$1;var $127=$126|0;var $128=$127+8|0;HEAP32[$128>>2]=$125;var $129=$1;var $130=$129|0;var $131=$130+4|0;var $132=HEAP32[$131>>2];var $133=$1;var $134=$133|0;var $135=$134+12|0;HEAP32[$135>>2]=$132;var $136=$1;var $137=$136+16|0;var $138=HEAP32[$137>>2];var $139=($138|0)!=0;if($139){label=12;break}else{label=14;break};case 12:var $141=$1;var $142=$141+16|0;var $143=HEAP32[$142>>2];var $144=$143|0;var $145=HEAP32[$144>>2];var $146=($145|0)!=0;if($146){label=13;break}else{label=14;break};case 13:var $148=$1;var $149=$148+16|0;var $150=HEAP32[$149>>2];var $151=$150;_free($151);label=14;break;case 14:var $153=HEAP32[168>>2];var $154=$1;var $155=$154+16|0;HEAP32[$155>>2]=$153;label=52;break;case 15:var $ld$34$0=$x1|0;var $157$0=HEAP32[$ld$34$0>>2];var $ld$35$1=$x1+4|0;var $157$1=HEAP32[$ld$35$1>>2];var $$etemp$36$0=-2147483648;var $$etemp$36$1=-1;var $158=($157$1|0)<($$etemp$36$1|0)|($157$1|0)==($$etemp$36$1|0)&$157$0>>>0<$$etemp$36$0>>>0;if($158){label=16;break}else{label=17;break};case 16:var $160=$1;var $161=$160|0;var $162=$161|0;HEAP32[$162>>2]=-2147483648;label=20;break;case 17:var $ld$37$0=$x2|0;var $164$0=HEAP32[$ld$37$0>>2];var $ld$38$1=$x2+4|0;var $164$1=HEAP32[$ld$38$1>>2];var $$etemp$39$0=2147483647;var $$etemp$39$1=0;var $165=($164$1|0)>($$etemp$39$1|0)|($164$1|0)==($$etemp$39$1|0)&$164$0>>>0>$$etemp$39$0>>>0;if($165){label=18;break}else{label=19;break};case 18:var $167=$1;var $168=$167|0;var $169=$168+8|0;HEAP32[$169>>2]=2147483647;label=19;break;case 19:label=20;break;case 20:var $ld$40$0=$y1|0;var $172$0=HEAP32[$ld$40$0>>2];var $ld$41$1=$y1+4|0;var $172$1=HEAP32[$ld$41$1>>2];var $$etemp$42$0=-2147483648;var $$etemp$42$1=-1;var $173=($172$1|0)<($$etemp$42$1|0)|($172$1|0)==($$etemp$42$1|0)&$172$0>>>0<$$etemp$42$0>>>0;if($173){label=21;break}else{label=22;break};case 21:var $175=$1;var $176=$175|0;var $177=$176+4|0;HEAP32[$177>>2]=-2147483648;label=25;break;case 22:var $ld$43$0=$y2|0;var $179$0=HEAP32[$ld$43$0>>2];var $ld$44$1=$y2+4|0;var $179$1=HEAP32[$ld$44$1>>2];var $$etemp$45$0=2147483647;var $$etemp$45$1=0;var $180=($179$1|0)>($$etemp$45$1|0)|($179$1|0)==($$etemp$45$1|0)&$179$0>>>0>$$etemp$45$0>>>0;if($180){label=23;break}else{label=24;break};case 23:var $182=$1;var $183=$182|0;var $184=$183+12|0;HEAP32[$184>>2]=2147483647;label=24;break;case 24:label=25;break;case 25:var $187=$1;var $188=$187+16|0;var $189=HEAP32[$188>>2];var $190=($189|0)!=0;if($190){label=26;break}else{label=52;break};case 26:var $192=$1;var $193=$192+16|0;var $194=HEAP32[$193>>2];var $195=$194+4|0;var $196=HEAP32[$195>>2];$nbox=$196;var $197=($196|0)!=0;if($197){label=27;break}else{label=52;break};case 27:var $199=$1;var $200=$199+16|0;var $201=HEAP32[$200>>2];var $202=$201+8|0;var $203=$202;$pbox=$203;$pbox_out=$203;label=28;break;case 28:var $205=$nbox;var $206=$205-1|0;$nbox=$206;var $207=($205|0)!=0;if($207){label=29;break}else{label=43;break};case 29:var $209=$pbox;var $210=$209|0;var $211=HEAP32[$210>>2];var $212=$2;var $213=$211+$212|0;var $214$0=$213;var $214$1=($213|0)<0?-1:0;var $st$46$0=$x1|0;HEAP32[$st$46$0>>2]=$214$0;var $st$47$1=$x1+4|0;HEAP32[$st$47$1>>2]=$214$1;var $215$0=$214$0;var $215=$215$0;var $216=$pbox_out;var $217=$216|0;HEAP32[$217>>2]=$215;var $218=$pbox;var $219=$218+4|0;var $220=HEAP32[$219>>2];var $221=$3;var $222=$220+$221|0;var $223$0=$222;var $223$1=($222|0)<0?-1:0;var $st$48$0=$y1|0;HEAP32[$st$48$0>>2]=$223$0;var $st$49$1=$y1+4|0;HEAP32[$st$49$1>>2]=$223$1;var $224$0=$223$0;var $224=$224$0;var $225=$pbox_out;var $226=$225+4|0;HEAP32[$226>>2]=$224;var $227=$pbox;var $228=$227+8|0;var $229=HEAP32[$228>>2];var $230=$2;var $231=$229+$230|0;var $232$0=$231;var $232$1=($231|0)<0?-1:0;var $st$50$0=$x2|0;HEAP32[$st$50$0>>2]=$232$0;var $st$51$1=$x2+4|0;HEAP32[$st$51$1>>2]=$232$1;var $233$0=$232$0;var $233=$233$0;var $234=$pbox_out;var $235=$234+8|0;HEAP32[$235>>2]=$233;var $236=$pbox;var $237=$236+12|0;var $238=HEAP32[$237>>2];var $239=$3;var $240=$238+$239|0;var $241$0=$240;var $241$1=($240|0)<0?-1:0;var $st$52$0=$y2|0;HEAP32[$st$52$0>>2]=$241$0;var $st$53$1=$y2+4|0;HEAP32[$st$53$1>>2]=$241$1;var $242$0=$241$0;var $242=$242$0;var $243=$pbox_out;var $244=$243+12|0;HEAP32[$244>>2]=$242;var $ld$54$0=$x2|0;var $245$0=HEAP32[$ld$54$0>>2];var $ld$55$1=$x2+4|0;var $245$1=HEAP32[$ld$55$1>>2];var $$etemp$56$0=-2147483648;var $$etemp$56$1=-1;var $246$0=_i64Subtract($245$0,$245$1,$$etemp$56$0,$$etemp$56$1);var $246$1=tempRet0;var $ld$57$0=$y2|0;var $247$0=HEAP32[$ld$57$0>>2];var $ld$58$1=$y2+4|0;var $247$1=HEAP32[$ld$58$1>>2];var $$etemp$59$0=-2147483648;var $$etemp$59$1=-1;var $248$0=_i64Subtract($247$0,$247$1,$$etemp$59$0,$$etemp$59$1);var $248$1=tempRet0;var $249$0=$246$0|$248$0;var $249$1=$246$1|$248$1;var $ld$60$0=$x1|0;var $250$0=HEAP32[$ld$60$0>>2];var $ld$61$1=$x1+4|0;var $250$1=HEAP32[$ld$61$1>>2];var $$etemp$62$0=2147483647;var $$etemp$62$1=0;var $251$0=_i64Subtract($$etemp$62$0,$$etemp$62$1,$250$0,$250$1);var $251$1=tempRet0;var $252$0=$249$0|$251$0;var $252$1=$249$1|$251$1;var $ld$63$0=$y1|0;var $253$0=HEAP32[$ld$63$0>>2];var $ld$64$1=$y1+4|0;var $253$1=HEAP32[$ld$64$1>>2];var $$etemp$65$0=2147483647;var $$etemp$65$1=0;var $254$0=_i64Subtract($$etemp$65$0,$$etemp$65$1,$253$0,$253$1);var $254$1=tempRet0;var $255$0=$252$0|$254$0;var $255$1=$252$1|$254$1;var $$etemp$66$0=0;var $$etemp$66$1=0;var $256=($255$1|0)<=($$etemp$66$1|0)&(($255$1|0)<($$etemp$66$1|0)|$255$0>>>0<=$$etemp$66$0>>>0);if($256){label=30;break}else{label=31;break};case 30:var $258=$1;var $259=$258+16|0;var $260=HEAP32[$259>>2];var $261=$260+4|0;var $262=HEAP32[$261>>2];var $263=$262-1|0;HEAP32[$261>>2]=$263;label=42;break;case 31:var $ld$67$0=$x1|0;var $265$0=HEAP32[$ld$67$0>>2];var $ld$68$1=$x1+4|0;var $265$1=HEAP32[$ld$68$1>>2];var $$etemp$69$0=-2147483648;var $$etemp$69$1=-1;var $266=($265$1|0)<($$etemp$69$1|0)|($265$1|0)==($$etemp$69$1|0)&$265$0>>>0<$$etemp$69$0>>>0;if($266){label=32;break}else{label=33;break};case 32:var $268=$pbox_out;var $269=$268|0;HEAP32[$269>>2]=-2147483648;label=36;break;case 33:var $ld$70$0=$x2|0;var $271$0=HEAP32[$ld$70$0>>2];var $ld$71$1=$x2+4|0;var $271$1=HEAP32[$ld$71$1>>2];var $$etemp$72$0=2147483647;var $$etemp$72$1=0;var $272=($271$1|0)>($$etemp$72$1|0)|($271$1|0)==($$etemp$72$1|0)&$271$0>>>0>$$etemp$72$0>>>0;if($272){label=34;break}else{label=35;break};case 34:var $274=$pbox_out;var $275=$274+8|0;HEAP32[$275>>2]=2147483647;label=35;break;case 35:label=36;break;case 36:var $ld$73$0=$y1|0;var $278$0=HEAP32[$ld$73$0>>2];var $ld$74$1=$y1+4|0;var $278$1=HEAP32[$ld$74$1>>2];var $$etemp$75$0=-2147483648;var $$etemp$75$1=-1;var $279=($278$1|0)<($$etemp$75$1|0)|($278$1|0)==($$etemp$75$1|0)&$278$0>>>0<$$etemp$75$0>>>0;if($279){label=37;break}else{label=38;break};case 37:var $281=$pbox_out;var $282=$281+4|0;HEAP32[$282>>2]=-2147483648;label=41;break;case 38:var $ld$76$0=$y2|0;var $284$0=HEAP32[$ld$76$0>>2];var $ld$77$1=$y2+4|0;var $284$1=HEAP32[$ld$77$1>>2];var $$etemp$78$0=2147483647;var $$etemp$78$1=0;var $285=($284$1|0)>($$etemp$78$1|0)|($284$1|0)==($$etemp$78$1|0)&$284$0>>>0>$$etemp$78$0>>>0;if($285){label=39;break}else{label=40;break};case 39:var $287=$pbox_out;var $288=$287+12|0;HEAP32[$288>>2]=2147483647;label=40;break;case 40:label=41;break;case 41:var $291=$pbox_out;var $292=$291+16|0;$pbox_out=$292;label=42;break;case 42:var $294=$pbox;var $295=$294+16|0;$pbox=$295;label=28;break;case 43:var $297=$pbox_out;var $298=$pbox;var $299=($297|0)!=($298|0);if($299){label=44;break}else{label=51;break};case 44:var $301=$1;var $302=$301+16|0;var $303=HEAP32[$302>>2];var $304=$303+4|0;var $305=HEAP32[$304>>2];var $306=($305|0)==1;if($306){label=45;break}else{label=49;break};case 45:var $308=$1;var $309=$308|0;var $310=$1;var $311=$310+16|0;var $312=HEAP32[$311>>2];var $313=$312+8|0;var $314=$313;var $315=$309;var $316=$314;HEAP32[$315>>2]=HEAP32[$316>>2];HEAP32[$315+4>>2]=HEAP32[$316+4>>2];HEAP32[$315+8>>2]=HEAP32[$316+8>>2];HEAP32[$315+12>>2]=HEAP32[$316+12>>2];var $317=$1;var $318=$317+16|0;var $319=HEAP32[$318>>2];var $320=($319|0)!=0;if($320){label=46;break}else{label=48;break};case 46:var $322=$1;var $323=$322+16|0;var $324=HEAP32[$323>>2];var $325=$324|0;var $326=HEAP32[$325>>2];var $327=($326|0)!=0;if($327){label=47;break}else{label=48;break};case 47:var $329=$1;var $330=$329+16|0;var $331=HEAP32[$330>>2];var $332=$331;_free($332);label=48;break;case 48:var $334=$1;var $335=$334+16|0;HEAP32[$335>>2]=0;label=50;break;case 49:var $337=$1;_pixman_set_extents($337);label=50;break;case 50:label=51;break;case 51:label=52;break;case 52:STACKTOP=sp;return}}function _pixman_region32_reset($region,$box){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;$1=$region;$2=$box;label=2;break;case 2:var $4=$2;var $5=$4|0;var $6=HEAP32[$5>>2];var $7=$2;var $8=$7+8|0;var $9=HEAP32[$8>>2];var $10=($6|0)<($9|0);if($10){label=3;break}else{var $20=0;label=4;break};case 3:var $12=$2;var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=$2;var $16=$15+12|0;var $17=HEAP32[$16>>2];var $18=($14|0)<($17|0);var $20=$18;label=4;break;case 4:var $20;var $21=$20^1;var $22=$21&1;var $23=$22;var $24=($23|0)!=0;if($24){label=5;break}else{label=6;break};case 5:__pixman_log_error(1992,592);label=6;break;case 6:label=7;break;case 7:var $28=$1;var $29=$28|0;var $30=$2;var $31=$29;var $32=$30;HEAP32[$31>>2]=HEAP32[$32>>2];HEAP32[$31+4>>2]=HEAP32[$32+4>>2];HEAP32[$31+8>>2]=HEAP32[$32+8>>2];HEAP32[$31+12>>2]=HEAP32[$32+12>>2];var $33=$1;var $34=$33+16|0;var $35=HEAP32[$34>>2];var $36=($35|0)!=0;if($36){label=8;break}else{label=10;break};case 8:var $38=$1;var $39=$38+16|0;var $40=HEAP32[$39>>2];var $41=$40|0;var $42=HEAP32[$41>>2];var $43=($42|0)!=0;if($43){label=9;break}else{label=10;break};case 9:var $45=$1;var $46=$45+16|0;var $47=HEAP32[$46>>2];var $48=$47;_free($48);label=10;break;case 10:var $50=$1;var $51=$50+16|0;HEAP32[$51>>2]=0;return}}function _pixman_region32_clear($region){var label=0;label=1;while(1)switch(label){case 1:var $1;$1=$region;var $2=$1;var $3=$2+16|0;var $4=HEAP32[$3>>2];var $5=($4|0)!=0;if($5){label=2;break}else{label=4;break};case 2:var $7=$1;var $8=$7+16|0;var $9=HEAP32[$8>>2];var $10=$9|0;var $11=HEAP32[$10>>2];var $12=($11|0)!=0;if($12){label=3;break}else{label=4;break};case 3:var $14=$1;var $15=$14+16|0;var $16=HEAP32[$15>>2];var $17=$16;_free($17);label=4;break;case 4:var $19=$1;var $20=$19|0;var $21=HEAP32[176>>2];var $22=$20;var $23=$21;HEAP32[$22>>2]=HEAP32[$23>>2];HEAP32[$22+4>>2]=HEAP32[$23+4>>2];HEAP32[$22+8>>2]=HEAP32[$23+8>>2];HEAP32[$22+12>>2]=HEAP32[$23+12>>2];var $24=HEAP32[168>>2];var $25=$1;var $26=$25+16|0;HEAP32[$26>>2]=$24;return}}function _pixman_region32_contains_point($region,$x,$y,$box){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $pbox;var $pbox_end;var $numRects;$2=$region;$3=$x;$4=$y;$5=$box;var $6=$2;var $7=$6+16|0;var $8=HEAP32[$7>>2];var $9=($8|0)!=0;if($9){label=2;break}else{label=3;break};case 2:var $11=$2;var $12=$11+16|0;var $13=HEAP32[$12>>2];var $14=$13+4|0;var $15=HEAP32[$14>>2];var $18=$15;label=4;break;case 3:var $18=1;label=4;break;case 4:var $18;$numRects=$18;var $19=$numRects;var $20=($19|0)!=0;if($20){label=5;break}else{label=9;break};case 5:var $22=$2;var $23=$22|0;var $24=$23+8|0;var $25=HEAP32[$24>>2];var $26=$3;var $27=($25|0)>($26|0);if($27){label=6;break}else{label=9;break};case 6:var $29=$2;var $30=$29|0;var $31=$30|0;var $32=HEAP32[$31>>2];var $33=$3;var $34=($32|0)<=($33|0);if($34){label=7;break}else{label=9;break};case 7:var $36=$2;var $37=$36|0;var $38=$37+12|0;var $39=HEAP32[$38>>2];var $40=$4;var $41=($39|0)>($40|0);if($41){label=8;break}else{label=9;break};case 8:var $43=$2;var $44=$43|0;var $45=$44+4|0;var $46=HEAP32[$45>>2];var $47=$4;var $48=($46|0)<=($47|0);if($48){label=10;break}else{label=9;break};case 9:$1=0;label=26;break;case 10:var $51=$numRects;var $52=($51|0)==1;if($52){label=11;break}else{label=14;break};case 11:var $54=$5;var $55=($54|0)!=0;if($55){label=12;break}else{label=13;break};case 12:var $57=$5;var $58=$2;var $59=$58|0;var $60=$57;var $61=$59;HEAP32[$60>>2]=HEAP32[$61>>2];HEAP32[$60+4>>2]=HEAP32[$61+4>>2];HEAP32[$60+8>>2]=HEAP32[$61+8>>2];HEAP32[$60+12>>2]=HEAP32[$61+12>>2];label=13;break;case 13:$1=1;label=26;break;case 14:var $64=$2;var $65=$64+16|0;var $66=HEAP32[$65>>2];var $67=$66+8|0;var $68=$67;$pbox=$68;var $69=$pbox;var $70=$numRects;var $71=$69+($70<<4)|0;$pbox_end=$71;var $72=$pbox;var $73=$pbox_end;var $74=$4;var $75=_find_box_for_y($72,$73,$74);$pbox=$75;label=15;break;case 15:var $77=$pbox;var $78=$pbox_end;var $79=($77|0)!=($78|0);if($79){label=16;break}else{label=25;break};case 16:var $81=$4;var $82=$pbox;var $83=$82+4|0;var $84=HEAP32[$83>>2];var $85=($81|0)<($84|0);if($85){label=18;break}else{label=17;break};case 17:var $87=$3;var $88=$pbox;var $89=$88|0;var $90=HEAP32[$89>>2];var $91=($87|0)<($90|0);if($91){label=18;break}else{label=19;break};case 18:label=25;break;case 19:var $94=$3;var $95=$pbox;var $96=$95+8|0;var $97=HEAP32[$96>>2];var $98=($94|0)>=($97|0);if($98){label=20;break}else{label=21;break};case 20:label=24;break;case 21:var $101=$5;var $102=($101|0)!=0;if($102){label=22;break}else{label=23;break};case 22:var $104=$5;var $105=$pbox;var $106=$104;var $107=$105;HEAP32[$106>>2]=HEAP32[$107>>2];HEAP32[$106+4>>2]=HEAP32[$107+4>>2];HEAP32[$106+8>>2]=HEAP32[$107+8>>2];HEAP32[$106+12>>2]=HEAP32[$107+12>>2];label=23;break;case 23:$1=1;label=26;break;case 24:var $110=$pbox;var $111=$110+16|0;$pbox=$111;label=15;break;case 25:$1=0;label=26;break;case 26:var $114=$1;return $114}}function _pixman_region32_selfcheck($reg){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+16|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $i;var $numRects;var $pbox_p;var $pbox_n;var $box=sp;$2=$reg;var $3=$2;var $4=$3|0;var $5=$4|0;var $6=HEAP32[$5>>2];var $7=$2;var $8=$7|0;var $9=$8+8|0;var $10=HEAP32[$9>>2];var $11=($6|0)>($10|0);if($11){label=3;break}else{label=2;break};case 2:var $13=$2;var $14=$13|0;var $15=$14+4|0;var $16=HEAP32[$15>>2];var $17=$2;var $18=$17|0;var $19=$18+12|0;var $20=HEAP32[$19>>2];var $21=($16|0)>($20|0);if($21){label=3;break}else{label=4;break};case 3:$1=0;label=40;break;case 4:var $24=$2;var $25=$24+16|0;var $26=HEAP32[$25>>2];var $27=($26|0)!=0;if($27){label=5;break}else{label=6;break};case 5:var $29=$2;var $30=$29+16|0;var $31=HEAP32[$30>>2];var $32=$31+4|0;var $33=HEAP32[$32>>2];var $36=$33;label=7;break;case 6:var $36=1;label=7;break;case 7:var $36;$numRects=$36;var $37=$numRects;var $38=($37|0)!=0;if($38){label=14;break}else{label=8;break};case 8:var $40=$2;var $41=$40|0;var $42=$41|0;var $43=HEAP32[$42>>2];var $44=$2;var $45=$44|0;var $46=$45+8|0;var $47=HEAP32[$46>>2];var $48=($43|0)==($47|0);if($48){label=9;break}else{var $75=0;label=13;break};case 9:var $50=$2;var $51=$50|0;var $52=$51+4|0;var $53=HEAP32[$52>>2];var $54=$2;var $55=$54|0;var $56=$55+12|0;var $57=HEAP32[$56>>2];var $58=($53|0)==($57|0);if($58){label=10;break}else{var $75=0;label=13;break};case 10:var $60=$2;var $61=$60+16|0;var $62=HEAP32[$61>>2];var $63=$62|0;var $64=HEAP32[$63>>2];var $65=($64|0)!=0;if($65){var $73=1;label=12;break}else{label=11;break};case 11:var $67=$2;var $68=$67+16|0;var $69=HEAP32[$68>>2];var $70=HEAP32[168>>2];var $71=($69|0)==($70|0);var $73=$71;label=12;break;case 12:var $73;var $75=$73;label=13;break;case 13:var $75;var $76=$75&1;$1=$76;label=40;break;case 14:var $78=$numRects;var $79=($78|0)==1;if($79){label=15;break}else{label=16;break};case 15:var $81=$2;var $82=$81+16|0;var $83=HEAP32[$82>>2];var $84=($83|0)!=0;var $85=$84^1;var $86=$85&1;$1=$86;label=40;break;case 16:var $88=$2;var $89=$88+16|0;var $90=HEAP32[$89>>2];var $91=($90|0)!=0;if($91){label=17;break}else{label=18;break};case 17:var $93=$2;var $94=$93+16|0;var $95=HEAP32[$94>>2];var $96=$95+8|0;var $97=$96;var $102=$97;label=19;break;case 18:var $99=$2;var $100=$99|0;var $102=$100;label=19;break;case 19:var $102;$pbox_p=$102;var $103=$pbox_p;var $104=$box;var $105=$103;HEAP32[$104>>2]=HEAP32[$105>>2];HEAP32[$104+4>>2]=HEAP32[$105+4>>2];HEAP32[$104+8>>2]=HEAP32[$105+8>>2];HEAP32[$104+12>>2]=HEAP32[$105+12>>2];var $106=$numRects;var $107=$106-1|0;var $108=$pbox_p;var $109=$108+($107<<4)|0;var $110=$109+12|0;var $111=HEAP32[$110>>2];var $112=$box+12|0;HEAP32[$112>>2]=$111;var $113=$pbox_p;var $114=$113+16|0;$pbox_n=$114;var $115=$numRects;$i=$115;label=20;break;case 20:var $117=$i;var $118=$117-1|0;$i=$118;var $119=($118|0)>0;if($119){label=21;break}else{label=35;break};case 21:var $121=$pbox_n;var $122=$121|0;var $123=HEAP32[$122>>2];var $124=$pbox_n;var $125=$124+8|0;var $126=HEAP32[$125>>2];var $127=($123|0)>=($126|0);if($127){label=23;break}else{label=22;break};case 22:var $129=$pbox_n;var $130=$129+4|0;var $131=HEAP32[$130>>2];var $132=$pbox_n;var $133=$132+12|0;var $134=HEAP32[$133>>2];var $135=($131|0)>=($134|0);if($135){label=23;break}else{label=24;break};case 23:$1=0;label=40;break;case 24:var $138=$pbox_n;var $139=$138|0;var $140=HEAP32[$139>>2];var $141=$box|0;var $142=HEAP32[$141>>2];var $143=($140|0)<($142|0);if($143){label=25;break}else{label=26;break};case 25:var $145=$pbox_n;var $146=$145|0;var $147=HEAP32[$146>>2];var $148=$box|0;HEAP32[$148>>2]=$147;label=26;break;case 26:var $150=$pbox_n;var $151=$150+8|0;var $152=HEAP32[$151>>2];var $153=$box+8|0;var $154=HEAP32[$153>>2];var $155=($152|0)>($154|0);if($155){label=27;break}else{label=28;break};case 27:var $157=$pbox_n;var $158=$157+8|0;var $159=HEAP32[$158>>2];var $160=$box+8|0;HEAP32[$160>>2]=$159;label=28;break;case 28:var $162=$pbox_n;var $163=$162+4|0;var $164=HEAP32[$163>>2];var $165=$pbox_p;var $166=$165+4|0;var $167=HEAP32[$166>>2];var $168=($164|0)<($167|0);if($168){label=32;break}else{label=29;break};case 29:var $170=$pbox_n;var $171=$170+4|0;var $172=HEAP32[$171>>2];var $173=$pbox_p;var $174=$173+4|0;var $175=HEAP32[$174>>2];var $176=($172|0)==($175|0);if($176){label=30;break}else{label=33;break};case 30:var $178=$pbox_n;var $179=$178|0;var $180=HEAP32[$179>>2];var $181=$pbox_p;var $182=$181+8|0;var $183=HEAP32[$182>>2];var $184=($180|0)<($183|0);if($184){label=32;break}else{label=31;break};case 31:var $186=$pbox_n;var $187=$186+12|0;var $188=HEAP32[$187>>2];var $189=$pbox_p;var $190=$189+12|0;var $191=HEAP32[$190>>2];var $192=($188|0)!=($191|0);if($192){label=32;break}else{label=33;break};case 32:$1=0;label=40;break;case 33:label=34;break;case 34:var $196=$pbox_p;var $197=$196+16|0;$pbox_p=$197;var $198=$pbox_n;var $199=$198+16|0;$pbox_n=$199;label=20;break;case 35:var $201=$box|0;var $202=HEAP32[$201>>2];var $203=$2;var $204=$203|0;var $205=$204|0;var $206=HEAP32[$205>>2];var $207=($202|0)==($206|0);if($207){label=36;break}else{var $233=0;label=39;break};case 36:var $209=$box+8|0;var $210=HEAP32[$209>>2];var $211=$2;var $212=$211|0;var $213=$212+8|0;var $214=HEAP32[$213>>2];var $215=($210|0)==($214|0);if($215){label=37;break}else{var $233=0;label=39;break};case 37:var $217=$box+4|0;var $218=HEAP32[$217>>2];var $219=$2;var $220=$219|0;var $221=$220+4|0;var $222=HEAP32[$221>>2];var $223=($218|0)==($222|0);if($223){label=38;break}else{var $233=0;label=39;break};case 38:var $225=$box+12|0;var $226=HEAP32[$225>>2];var $227=$2;var $228=$227|0;var $229=$228+12|0;var $230=HEAP32[$229>>2];var $231=($226|0)==($230|0);var $233=$231;label=39;break;case 39:var $233;var $234=$233&1;$1=$234;label=40;break;case 40:var $236=$1;STACKTOP=sp;return $236}}function _pixman_region32_init_rects($region,$boxes,$count){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $rects;var $displacement;var $i;var $box;$2=$region;$3=$boxes;$4=$count;var $5=$4;var $6=($5|0)==1;if($6){label=2;break}else{label=3;break};case 2:var $8=$2;var $9=$3;var $10=$9|0;var $11=$10|0;var $12=HEAP32[$11>>2];var $13=$3;var $14=$13|0;var $15=$14+4|0;var $16=HEAP32[$15>>2];var $17=$3;var $18=$17|0;var $19=$18+8|0;var $20=HEAP32[$19>>2];var $21=$3;var $22=$21|0;var $23=$22|0;var $24=HEAP32[$23>>2];var $25=$20-$24|0;var $26=$3;var $27=$26|0;var $28=$27+12|0;var $29=HEAP32[$28>>2];var $30=$3;var $31=$30|0;var $32=$31+4|0;var $33=HEAP32[$32>>2];var $34=$29-$33|0;_pixman_region32_init_rect($8,$12,$16,$25,$34);$1=1;label=31;break;case 3:var $36=$2;_pixman_region32_init($36);var $37=$4;var $38=($37|0)==0;if($38){label=4;break}else{label=5;break};case 4:$1=1;label=31;break;case 5:var $41=$2;var $42=$4;var $43=_pixman_rect_alloc($41,$42);var $44=($43|0)!=0;if($44){label=7;break}else{label=6;break};case 6:$1=0;label=31;break;case 7:var $47=$2;var $48=$47+16|0;var $49=HEAP32[$48>>2];var $50=($49|0)!=0;if($50){label=8;break}else{label=9;break};case 8:var $52=$2;var $53=$52+16|0;var $54=HEAP32[$53>>2];var $55=$54+8|0;var $56=$55;var $61=$56;label=10;break;case 9:var $58=$2;var $59=$58|0;var $61=$59;label=10;break;case 10:var $61;$rects=$61;var $62=$rects;var $63=$62;var $64=$3;var $65=$64;var $66=$4;var $67=$66<<4;_memcpy($63,$65,$67)|0;var $68=$4;var $69=$2;var $70=$69+16|0;var $71=HEAP32[$70>>2];var $72=$71+4|0;HEAP32[$72>>2]=$68;$displacement=0;$i=0;label=11;break;case 11:var $74=$i;var $75=$4;var $76=($74|0)<($75|0);if($76){label=12;break}else{label=20;break};case 12:var $78=$i;var $79=$rects;var $80=$79+($78<<4)|0;$box=$80;var $81=$box;var $82=$81|0;var $83=HEAP32[$82>>2];var $84=$box;var $85=$84+8|0;var $86=HEAP32[$85>>2];var $87=($83|0)>=($86|0);if($87){label=14;break}else{label=13;break};case 13:var $89=$box;var $90=$89+4|0;var $91=HEAP32[$90>>2];var $92=$box;var $93=$92+12|0;var $94=HEAP32[$93>>2];var $95=($91|0)>=($94|0);if($95){label=14;break}else{label=15;break};case 14:var $97=$displacement;var $98=$97+1|0;$displacement=$98;label=18;break;case 15:var $100=$displacement;var $101=($100|0)!=0;if($101){label=16;break}else{label=17;break};case 16:var $103=$i;var $104=$displacement;var $105=$103-$104|0;var $106=$rects;var $107=$106+($105<<4)|0;var $108=$i;var $109=$rects;var $110=$109+($108<<4)|0;var $111=$107;var $112=$110;HEAP32[$111>>2]=HEAP32[$112>>2];HEAP32[$111+4>>2]=HEAP32[$112+4>>2];HEAP32[$111+8>>2]=HEAP32[$112+8>>2];HEAP32[$111+12>>2]=HEAP32[$112+12>>2];label=17;break;case 17:label=18;break;case 18:label=19;break;case 19:var $116=$i;var $117=$116+1|0;$i=$117;label=11;break;case 20:var $119=$displacement;var $120=$2;var $121=$120+16|0;var $122=HEAP32[$121>>2];var $123=$122+4|0;var $124=HEAP32[$123>>2];var $125=$124-$119|0;HEAP32[$123>>2]=$125;var $126=$2;var $127=$126+16|0;var $128=HEAP32[$127>>2];var $129=$128+4|0;var $130=HEAP32[$129>>2];var $131=($130|0)==0;if($131){label=21;break}else{label=25;break};case 21:var $133=$2;var $134=$133+16|0;var $135=HEAP32[$134>>2];var $136=($135|0)!=0;if($136){label=22;break}else{label=24;break};case 22:var $138=$2;var $139=$138+16|0;var $140=HEAP32[$139>>2];var $141=$140|0;var $142=HEAP32[$141>>2];var $143=($142|0)!=0;if($143){label=23;break}else{label=24;break};case 23:var $145=$2;var $146=$145+16|0;var $147=HEAP32[$146>>2];var $148=$147;_free($148);label=24;break;case 24:var $150=$2;_pixman_region32_init($150);$1=1;label=31;break;case 25:var $152=$2;var $153=$152+16|0;var $154=HEAP32[$153>>2];var $155=$154+4|0;var $156=HEAP32[$155>>2];var $157=($156|0)==1;if($157){label=26;break}else{label=30;break};case 26:var $159=$2;var $160=$159|0;var $161=$rects;var $162=$161|0;var $163=$160;var $164=$162;HEAP32[$163>>2]=HEAP32[$164>>2];HEAP32[$163+4>>2]=HEAP32[$164+4>>2];HEAP32[$163+8>>2]=HEAP32[$164+8>>2];HEAP32[$163+12>>2]=HEAP32[$164+12>>2];var $165=$2;var $166=$165+16|0;var $167=HEAP32[$166>>2];var $168=($167|0)!=0;if($168){label=27;break}else{label=29;break};case 27:var $170=$2;var $171=$170+16|0;var $172=HEAP32[$171>>2];var $173=$172|0;var $174=HEAP32[$173>>2];var $175=($174|0)!=0;if($175){label=28;break}else{label=29;break};case 28:var $177=$2;var $178=$177+16|0;var $179=HEAP32[$178>>2];var $180=$179;_free($180);label=29;break;case 29:var $182=$2;var $183=$182+16|0;HEAP32[$183>>2]=0;$1=1;label=31;break;case 30:var $185=$2;var $186=$185|0;var $187=$186+8|0;HEAP32[$187>>2]=0;var $188=$2;var $189=$188|0;var $190=$189|0;HEAP32[$190>>2]=0;var $191=$2;var $192=_validate($191);$1=$192;label=31;break;case 31:var $194=$1;return $194}}function _pixman_rect_alloc($region,$n){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $data;var $data_size;$2=$region;$3=$n;var $4=$2;var $5=$4+16|0;var $6=HEAP32[$5>>2];var $7=($6|0)!=0;if($7){label=5;break}else{label=2;break};case 2:var $9=$3;var $10=$9+1|0;$3=$10;var $11=$3;var $12=_alloc_data($11);var $13=$2;var $14=$13+16|0;HEAP32[$14>>2]=$12;var $15=$2;var $16=$15+16|0;var $17=HEAP32[$16>>2];var $18=($17|0)!=0;if($18){label=4;break}else{label=3;break};case 3:var $20=$2;var $21=_pixman_break($20);$1=$21;label=21;break;case 4:var $23=$2;var $24=$23+16|0;var $25=HEAP32[$24>>2];var $26=$25+4|0;HEAP32[$26>>2]=1;var $27=$2;var $28=$27+16|0;var $29=HEAP32[$28>>2];var $30=$29+8|0;var $31=$30;var $32=$2;var $33=$32|0;var $34=$31;var $35=$33;HEAP32[$34>>2]=HEAP32[$35>>2];HEAP32[$34+4>>2]=HEAP32[$35+4>>2];HEAP32[$34+8>>2]=HEAP32[$35+8>>2];HEAP32[$34+12>>2]=HEAP32[$35+12>>2];label=20;break;case 5:var $37=$2;var $38=$37+16|0;var $39=HEAP32[$38>>2];var $40=$39|0;var $41=HEAP32[$40>>2];var $42=($41|0)!=0;if($42){label=9;break}else{label=6;break};case 6:var $44=$3;var $45=_alloc_data($44);var $46=$2;var $47=$46+16|0;HEAP32[$47>>2]=$45;var $48=$2;var $49=$48+16|0;var $50=HEAP32[$49>>2];var $51=($50|0)!=0;if($51){label=8;break}else{label=7;break};case 7:var $53=$2;var $54=_pixman_break($53);$1=$54;label=21;break;case 8:var $56=$2;var $57=$56+16|0;var $58=HEAP32[$57>>2];var $59=$58+4|0;HEAP32[$59>>2]=0;label=19;break;case 9:var $61=$3;var $62=($61|0)==1;if($62){label=10;break}else{label=13;break};case 10:var $64=$2;var $65=$64+16|0;var $66=HEAP32[$65>>2];var $67=$66+4|0;var $68=HEAP32[$67>>2];$3=$68;var $69=$3;var $70=($69|0)>500;if($70){label=11;break}else{label=12;break};case 11:$3=250;label=12;break;case 12:label=13;break;case 13:var $74=$2;var $75=$74+16|0;var $76=HEAP32[$75>>2];var $77=$76+4|0;var $78=HEAP32[$77>>2];var $79=$3;var $80=$79+$78|0;$3=$80;var $81=$3;var $82=_PIXREGION_SZOF($81);$data_size=$82;var $83=$data_size;var $84=($83|0)!=0;if($84){label=15;break}else{label=14;break};case 14:$data=0;label=16;break;case 15:var $87=$2;var $88=$87+16|0;var $89=HEAP32[$88>>2];var $90=$89;var $91=$3;var $92=_PIXREGION_SZOF($91);var $93=_realloc($90,$92);var $94=$93;$data=$94;label=16;break;case 16:var $96=$data;var $97=($96|0)!=0;if($97){label=18;break}else{label=17;break};case 17:var $99=$2;var $100=_pixman_break($99);$1=$100;label=21;break;case 18:var $102=$data;var $103=$2;var $104=$103+16|0;HEAP32[$104>>2]=$102;label=19;break;case 19:label=20;break;case 20:var $107=$3;var $108=$2;var $109=$108+16|0;var $110=HEAP32[$109>>2];var $111=$110|0;HEAP32[$111>>2]=$107;$1=1;label=21;break;case 21:var $113=$1;return $113}}function _validate($badreg){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+1792|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $stack_regions=sp;var $numRects;var $ri;var $num_ri;var $size_ri;var $i;var $j;var $rit;var $reg;var $box;var $ri_box;var $hreg;var $ret;var $new_data;var $data_size;var $data_size1;var $half;$2=$badreg;$ret=1;var $3=$2;var $4=$3+16|0;var $5=HEAP32[$4>>2];var $6=($5|0)!=0;if($6){label=3;break}else{label=2;break};case 2:$1=1;label=131;break;case 3:var $9=$2;var $10=$9+16|0;var $11=HEAP32[$10>>2];var $12=$11+4|0;var $13=HEAP32[$12>>2];$numRects=$13;var $14=$numRects;var $15=($14|0)!=0;if($15){label=7;break}else{label=4;break};case 4:var $17=$2;var $18=$17+16|0;var $19=HEAP32[$18>>2];var $20=HEAP32[184>>2];var $21=($19|0)==($20|0);if($21){label=5;break}else{label=6;break};case 5:$1=0;label=131;break;case 6:$1=1;label=131;break;case 7:var $25=$2;var $26=$25|0;var $27=$26|0;var $28=HEAP32[$27>>2];var $29=$2;var $30=$29|0;var $31=$30+8|0;var $32=HEAP32[$31>>2];var $33=($28|0)<($32|0);if($33){label=8;break}else{label=25;break};case 8:var $35=$numRects;var $36=($35|0)==1;if($36){label=9;break}else{label=13;break};case 9:var $38=$2;var $39=$38+16|0;var $40=HEAP32[$39>>2];var $41=($40|0)!=0;if($41){label=10;break}else{label=12;break};case 10:var $43=$2;var $44=$43+16|0;var $45=HEAP32[$44>>2];var $46=$45|0;var $47=HEAP32[$46>>2];var $48=($47|0)!=0;if($48){label=11;break}else{label=12;break};case 11:var $50=$2;var $51=$50+16|0;var $52=HEAP32[$51>>2];var $53=$52;_free($53);label=12;break;case 12:var $55=$2;var $56=$55+16|0;HEAP32[$56>>2]=0;label=24;break;case 13:label=14;break;case 14:var $59=$numRects;var $60=$2;var $61=$60+16|0;var $62=HEAP32[$61>>2];var $63=$62|0;var $64=HEAP32[$63>>2];var $65=$64>>1;var $66=($59|0)<($65|0);if($66){label=15;break}else{label=22;break};case 15:var $68=$2;var $69=$68+16|0;var $70=HEAP32[$69>>2];var $71=$70|0;var $72=HEAP32[$71>>2];var $73=($72|0)>50;if($73){label=16;break}else{label=22;break};case 16:var $75=$numRects;var $76=_PIXREGION_SZOF($75);$data_size=$76;var $77=$data_size;var $78=($77|0)!=0;if($78){label=18;break}else{label=17;break};case 17:$new_data=0;label=19;break;case 18:var $81=$2;var $82=$81+16|0;var $83=HEAP32[$82>>2];var $84=$83;var $85=$data_size;var $86=_realloc($84,$85);var $87=$86;$new_data=$87;label=19;break;case 19:var $89=$new_data;var $90=($89|0)!=0;if($90){label=20;break}else{label=21;break};case 20:var $92=$numRects;var $93=$new_data;var $94=$93|0;HEAP32[$94>>2]=$92;var $95=$new_data;var $96=$2;var $97=$96+16|0;HEAP32[$97>>2]=$95;label=21;break;case 21:label=22;break;case 22:label=23;break;case 23:label=24;break;case 24:$1=1;label=131;break;case 25:var $103=$2;var $104=$103+16|0;var $105=HEAP32[$104>>2];var $106=$105+8|0;var $107=$106;var $108=$numRects;_quick_sort_rects($107,$108);var $109=$stack_regions|0;$ri=$109;$size_ri=64;$num_ri=1;var $110=$ri;var $111=$110|0;var $112=$111+20|0;HEAP32[$112>>2]=0;var $113=$ri;var $114=$113|0;var $115=$114+24|0;HEAP32[$115>>2]=0;var $116=$ri;var $117=$116|0;var $118=$117|0;var $119=$2;var $120=$118;var $121=$119;HEAP32[$120>>2]=HEAP32[$121>>2];HEAP32[$120+4>>2]=HEAP32[$121+4>>2];HEAP32[$120+8>>2]=HEAP32[$121+8>>2];HEAP32[$120+12>>2]=HEAP32[$121+12>>2];HEAP32[$120+16>>2]=HEAP32[$121+16>>2];var $122=$ri;var $123=$122|0;var $124=$123|0;var $125=$124+16|0;var $126=HEAP32[$125>>2];var $127=$126+8|0;var $128=$127;$box=$128;var $129=$ri;var $130=$129|0;var $131=$130|0;var $132=$131|0;var $133=$box;var $134=$132;var $135=$133;HEAP32[$134>>2]=HEAP32[$135>>2];HEAP32[$134+4>>2]=HEAP32[$135+4>>2];HEAP32[$134+8>>2]=HEAP32[$135+8>>2];HEAP32[$134+12>>2]=HEAP32[$135+12>>2];var $136=$ri;var $137=$136|0;var $138=$137|0;var $139=$138+16|0;var $140=HEAP32[$139>>2];var $141=$140+4|0;HEAP32[$141>>2]=1;var $142=$2;var $143=$142|0;var $144=HEAP32[176>>2];var $145=$143;var $146=$144;HEAP32[$145>>2]=HEAP32[$146>>2];HEAP32[$145+4>>2]=HEAP32[$146+4>>2];HEAP32[$145+8>>2]=HEAP32[$146+8>>2];HEAP32[$145+12>>2]=HEAP32[$146+12>>2];var $147=HEAP32[168>>2];var $148=$2;var $149=$148+16|0;HEAP32[$149>>2]=$147;var $150=$numRects;$i=$150;label=26;break;case 26:var $152=$i;var $153=$152-1|0;$i=$153;var $154=($153|0)>0;if($154){label=27;break}else{label=80;break};case 27:var $156=$box;var $157=$156+16|0;$box=$157;var $158=$num_ri;$j=$158;var $159=$ri;$rit=$159;label=28;break;case 28:var $161=$j;var $162=$161-1|0;$j=$162;var $163=($162|0)>=0;if($163){label=29;break}else{label=65;break};case 29:var $165=$rit;var $166=$165|0;$reg=$166;var $167=$reg;var $168=$167+16|0;var $169=HEAP32[$168>>2];var $170=$169+4|0;var $171=HEAP32[$170>>2];var $172=$171-1|0;var $173=$reg;var $174=$173+16|0;var $175=HEAP32[$174>>2];var $176=$175+8|0;var $177=$176;var $178=$177+($172<<4)|0;$ri_box=$178;var $179=$box;var $180=$179+4|0;var $181=HEAP32[$180>>2];var $182=$ri_box;var $183=$182+4|0;var $184=HEAP32[$183>>2];var $185=($181|0)==($184|0);if($185){label=30;break}else{label=44;break};case 30:var $187=$box;var $188=$187+12|0;var $189=HEAP32[$188>>2];var $190=$ri_box;var $191=$190+12|0;var $192=HEAP32[$191>>2];var $193=($189|0)==($192|0);if($193){label=31;break}else{label=44;break};case 31:var $195=$box;var $196=$195|0;var $197=HEAP32[$196>>2];var $198=$ri_box;var $199=$198+8|0;var $200=HEAP32[$199>>2];var $201=($197|0)<=($200|0);if($201){label=32;break}else{label=35;break};case 32:var $203=$box;var $204=$203+8|0;var $205=HEAP32[$204>>2];var $206=$ri_box;var $207=$206+8|0;var $208=HEAP32[$207>>2];var $209=($205|0)>($208|0);if($209){label=33;break}else{label=34;break};case 33:var $211=$box;var $212=$211+8|0;var $213=HEAP32[$212>>2];var $214=$ri_box;var $215=$214+8|0;HEAP32[$215>>2]=$213;label=34;break;case 34:label=43;break;case 35:label=36;break;case 36:var $219=$reg;var $220=$219+16|0;var $221=HEAP32[$220>>2];var $222=($221|0)!=0;if($222){label=37;break}else{label=38;break};case 37:var $224=$reg;var $225=$224+16|0;var $226=HEAP32[$225>>2];var $227=$226+4|0;var $228=HEAP32[$227>>2];var $229=$228+1|0;var $230=$reg;var $231=$230+16|0;var $232=HEAP32[$231>>2];var $233=$232|0;var $234=HEAP32[$233>>2];var $235=($229|0)>($234|0);if($235){label=38;break}else{label=41;break};case 38:var $237=$reg;var $238=_pixman_rect_alloc($237,1);var $239=($238|0)!=0;if($239){label=40;break}else{label=39;break};case 39:label=121;break;case 40:label=41;break;case 41:label=42;break;case 42:var $244=$reg;var $245=$244+16|0;var $246=HEAP32[$245>>2];var $247=$246+4|0;var $248=HEAP32[$247>>2];var $249=$reg;var $250=$249+16|0;var $251=HEAP32[$250>>2];var $252=$251+8|0;var $253=$252;var $254=$253+($248<<4)|0;var $255=$box;var $256=$254;var $257=$255;HEAP32[$256>>2]=HEAP32[$257>>2];HEAP32[$256+4>>2]=HEAP32[$257+4>>2];HEAP32[$256+8>>2]=HEAP32[$257+8>>2];HEAP32[$256+12>>2]=HEAP32[$257+12>>2];var $258=$reg;var $259=$258+16|0;var $260=HEAP32[$259>>2];var $261=$260+4|0;var $262=HEAP32[$261>>2];var $263=$262+1|0;HEAP32[$261>>2]=$263;label=43;break;case 43:label=79;break;case 44:var $266=$box;var $267=$266+4|0;var $268=HEAP32[$267>>2];var $269=$ri_box;var $270=$269+12|0;var $271=HEAP32[$270>>2];var $272=($268|0)>=($271|0);if($272){label=45;break}else{label=62;break};case 45:var $274=$reg;var $275=$274|0;var $276=$275+8|0;var $277=HEAP32[$276>>2];var $278=$ri_box;var $279=$278+8|0;var $280=HEAP32[$279>>2];var $281=($277|0)<($280|0);if($281){label=46;break}else{label=47;break};case 46:var $283=$ri_box;var $284=$283+8|0;var $285=HEAP32[$284>>2];var $286=$reg;var $287=$286|0;var $288=$287+8|0;HEAP32[$288>>2]=$285;label=47;break;case 47:var $290=$reg;var $291=$290|0;var $292=$291|0;var $293=HEAP32[$292>>2];var $294=$box;var $295=$294|0;var $296=HEAP32[$295>>2];var $297=($293|0)>($296|0);if($297){label=48;break}else{label=49;break};case 48:var $299=$box;var $300=$299|0;var $301=HEAP32[$300>>2];var $302=$reg;var $303=$302|0;var $304=$303|0;HEAP32[$304>>2]=$301;label=49;break;case 49:label=50;break;case 50:var $307=$rit;var $308=$307+24|0;var $309=HEAP32[$308>>2];var $310=$rit;var $311=$310+20|0;var $312=HEAP32[$311>>2];var $313=$309-$312|0;var $314=$reg;var $315=$314+16|0;var $316=HEAP32[$315>>2];var $317=$316+4|0;var $318=HEAP32[$317>>2];var $319=$rit;var $320=$319+24|0;var $321=HEAP32[$320>>2];var $322=$318-$321|0;var $323=($313|0)==($322|0);if($323){label=51;break}else{label=52;break};case 51:var $325=$reg;var $326=$rit;var $327=$326+20|0;var $328=HEAP32[$327>>2];var $329=$rit;var $330=$329+24|0;var $331=HEAP32[$330>>2];var $332=_pixman_coalesce($325,$328,$331);var $333=$rit;var $334=$333+20|0;HEAP32[$334>>2]=$332;label=53;break;case 52:var $336=$rit;var $337=$336+24|0;var $338=HEAP32[$337>>2];var $339=$rit;var $340=$339+20|0;HEAP32[$340>>2]=$338;label=53;break;case 53:label=54;break;case 54:var $343=$reg;var $344=$343+16|0;var $345=HEAP32[$344>>2];var $346=$345+4|0;var $347=HEAP32[$346>>2];var $348=$rit;var $349=$348+24|0;HEAP32[$349>>2]=$347;label=55;break;case 55:var $351=$reg;var $352=$351+16|0;var $353=HEAP32[$352>>2];var $354=($353|0)!=0;if($354){label=56;break}else{label=57;break};case 56:var $356=$reg;var $357=$356+16|0;var $358=HEAP32[$357>>2];var $359=$358+4|0;var $360=HEAP32[$359>>2];var $361=$360+1|0;var $362=$reg;var $363=$362+16|0;var $364=HEAP32[$363>>2];var $365=$364|0;var $366=HEAP32[$365>>2];var $367=($361|0)>($366|0);if($367){label=57;break}else{label=60;break};case 57:var $369=$reg;var $370=_pixman_rect_alloc($369,1);var $371=($370|0)!=0;if($371){label=59;break}else{label=58;break};case 58:label=121;break;case 59:label=60;break;case 60:label=61;break;case 61:var $376=$reg;var $377=$376+16|0;var $378=HEAP32[$377>>2];var $379=$378+4|0;var $380=HEAP32[$379>>2];var $381=$reg;var $382=$381+16|0;var $383=HEAP32[$382>>2];var $384=$383+8|0;var $385=$384;var $386=$385+($380<<4)|0;var $387=$box;var $388=$386;var $389=$387;HEAP32[$388>>2]=HEAP32[$389>>2];HEAP32[$388+4>>2]=HEAP32[$389+4>>2];HEAP32[$388+8>>2]=HEAP32[$389+8>>2];HEAP32[$388+12>>2]=HEAP32[$389+12>>2];var $390=$reg;var $391=$390+16|0;var $392=HEAP32[$391>>2];var $393=$392+4|0;var $394=HEAP32[$393>>2];var $395=$394+1|0;HEAP32[$393>>2]=$395;label=79;break;case 62:label=63;break;case 63:label=64;break;case 64:var $399=$rit;var $400=$399+28|0;$rit=$400;label=28;break;case 65:var $402=$size_ri;var $403=$num_ri;var $404=($402|0)==($403|0);if($404){label=66;break}else{label=76;break};case 66:var $406=$size_ri;var $407=$406<<1;$size_ri=$407;var $408=$size_ri;var $409=$408*28&-1;$data_size1=$409;var $410=$data_size1;var $411=$size_ri;var $412=($410>>>0)/($411>>>0)&-1;var $413=($412|0)!=28;if($413){label=67;break}else{label=68;break};case 67:label=121;break;case 68:var $416=$ri;var $417=$stack_regions|0;var $418=($416|0)==($417|0);if($418){label=69;break}else{label=72;break};case 69:var $420=$data_size1;var $421=_malloc($420);var $422=$421;$rit=$422;var $423=$rit;var $424=($423|0)!=0;if($424){label=71;break}else{label=70;break};case 70:label=121;break;case 71:var $427=$rit;var $428=$427;var $429=$ri;var $430=$429;var $431=$num_ri;var $432=$431*28&-1;_memcpy($428,$430,$432)|0;label=75;break;case 72:var $434=$ri;var $435=$434;var $436=$data_size1;var $437=_realloc($435,$436);var $438=$437;$rit=$438;var $439=$rit;var $440=($439|0)!=0;if($440){label=74;break}else{label=73;break};case 73:label=121;break;case 74:label=75;break;case 75:var $444=$rit;$ri=$444;var $445=$num_ri;var $446=$ri;var $447=$446+($445*28&-1)|0;$rit=$447;label=76;break;case 76:var $449=$num_ri;var $450=$449+1|0;$num_ri=$450;var $451=$rit;var $452=$451+20|0;HEAP32[$452>>2]=0;var $453=$rit;var $454=$453+24|0;HEAP32[$454>>2]=0;var $455=$rit;var $456=$455|0;var $457=$456|0;var $458=$box;var $459=$457;var $460=$458;HEAP32[$459>>2]=HEAP32[$460>>2];HEAP32[$459+4>>2]=HEAP32[$460+4>>2];HEAP32[$459+8>>2]=HEAP32[$460+8>>2];HEAP32[$459+12>>2]=HEAP32[$460+12>>2];var $461=$rit;var $462=$461|0;var $463=$462+16|0;HEAP32[$463>>2]=0;var $464=$rit;var $465=$464|0;var $466=$i;var $467=$num_ri;var $468=$466+$467|0;var $469=$num_ri;var $470=($468|0)/($469|0)&-1;var $471=_pixman_rect_alloc($465,$470);var $472=($471|0)!=0;if($472){label=78;break}else{label=77;break};case 77:label=121;break;case 78:label=79;break;case 79:label=26;break;case 80:var $477=$num_ri;$j=$477;var $478=$ri;$rit=$478;label=81;break;case 81:var $480=$j;var $481=$480-1|0;$j=$481;var $482=($481|0)>=0;if($482){label=82;break}else{label=96;break};case 82:var $484=$rit;var $485=$484|0;$reg=$485;var $486=$reg;var $487=$486+16|0;var $488=HEAP32[$487>>2];var $489=$488+4|0;var $490=HEAP32[$489>>2];var $491=$490-1|0;var $492=$reg;var $493=$492+16|0;var $494=HEAP32[$493>>2];var $495=$494+8|0;var $496=$495;var $497=$496+($491<<4)|0;$ri_box=$497;var $498=$ri_box;var $499=$498+12|0;var $500=HEAP32[$499>>2];var $501=$reg;var $502=$501|0;var $503=$502+12|0;HEAP32[$503>>2]=$500;var $504=$reg;var $505=$504|0;var $506=$505+8|0;var $507=HEAP32[$506>>2];var $508=$ri_box;var $509=$508+8|0;var $510=HEAP32[$509>>2];var $511=($507|0)<($510|0);if($511){label=83;break}else{label=84;break};case 83:var $513=$ri_box;var $514=$513+8|0;var $515=HEAP32[$514>>2];var $516=$reg;var $517=$516|0;var $518=$517+8|0;HEAP32[$518>>2]=$515;label=84;break;case 84:label=85;break;case 85:var $521=$rit;var $522=$521+24|0;var $523=HEAP32[$522>>2];var $524=$rit;var $525=$524+20|0;var $526=HEAP32[$525>>2];var $527=$523-$526|0;var $528=$reg;var $529=$528+16|0;var $530=HEAP32[$529>>2];var $531=$530+4|0;var $532=HEAP32[$531>>2];var $533=$rit;var $534=$533+24|0;var $535=HEAP32[$534>>2];var $536=$532-$535|0;var $537=($527|0)==($536|0);if($537){label=86;break}else{label=87;break};case 86:var $539=$reg;var $540=$rit;var $541=$540+20|0;var $542=HEAP32[$541>>2];var $543=$rit;var $544=$543+24|0;var $545=HEAP32[$544>>2];var $546=_pixman_coalesce($539,$542,$545);var $547=$rit;var $548=$547+20|0;HEAP32[$548>>2]=$546;label=88;break;case 87:var $550=$rit;var $551=$550+24|0;var $552=HEAP32[$551>>2];var $553=$rit;var $554=$553+20|0;HEAP32[$554>>2]=$552;label=88;break;case 88:label=89;break;case 89:var $557=$reg;var $558=$557+16|0;var $559=HEAP32[$558>>2];var $560=$559+4|0;var $561=HEAP32[$560>>2];var $562=($561|0)==1;if($562){label=90;break}else{label=94;break};case 90:var $564=$reg;var $565=$564+16|0;var $566=HEAP32[$565>>2];var $567=($566|0)!=0;if($567){label=91;break}else{label=93;break};case 91:var $569=$reg;var $570=$569+16|0;var $571=HEAP32[$570>>2];var $572=$571|0;var $573=HEAP32[$572>>2];var $574=($573|0)!=0;if($574){label=92;break}else{label=93;break};case 92:var $576=$reg;var $577=$576+16|0;var $578=HEAP32[$577>>2];var $579=$578;_free($579);label=93;break;case 93:var $581=$reg;var $582=$581+16|0;HEAP32[$582>>2]=0;label=94;break;case 94:label=95;break;case 95:var $585=$rit;var $586=$585+28|0;$rit=$586;label=81;break;case 96:label=97;break;case 97:var $589=$num_ri;var $590=($589|0)>1;if($590){label=98;break}else{label=118;break};case 98:var $592=$num_ri;var $593=($592|0)/2&-1;$half=$593;var $594=$num_ri;var $595=$594&1;$j=$595;label=99;break;case 99:var $597=$j;var $598=$half;var $599=$num_ri;var $600=$599&1;var $601=$598+$600|0;var $602=($597|0)<($601|0);if($602){label=100;break}else{label=115;break};case 100:var $604=$j;var $605=$ri;var $606=$605+($604*28&-1)|0;var $607=$606|0;$reg=$607;var $608=$j;var $609=$half;var $610=$608+$609|0;var $611=$ri;var $612=$611+($610*28&-1)|0;var $613=$612|0;$hreg=$613;var $614=$reg;var $615=$reg;var $616=$hreg;var $617=_pixman_op($614,$615,$616,32,1,1);var $618=($617|0)!=0;if($618){label=102;break}else{label=101;break};case 101:$ret=0;label=102;break;case 102:var $621=$hreg;var $622=$621|0;var $623=$622|0;var $624=HEAP32[$623>>2];var $625=$reg;var $626=$625|0;var $627=$626|0;var $628=HEAP32[$627>>2];var $629=($624|0)<($628|0);if($629){label=103;break}else{label=104;break};case 103:var $631=$hreg;var $632=$631|0;var $633=$632|0;var $634=HEAP32[$633>>2];var $635=$reg;var $636=$635|0;var $637=$636|0;HEAP32[$637>>2]=$634;label=104;break;case 104:var $639=$hreg;var $640=$639|0;var $641=$640+4|0;var $642=HEAP32[$641>>2];var $643=$reg;var $644=$643|0;var $645=$644+4|0;var $646=HEAP32[$645>>2];var $647=($642|0)<($646|0);if($647){label=105;break}else{label=106;break};case 105:var $649=$hreg;var $650=$649|0;var $651=$650+4|0;var $652=HEAP32[$651>>2];var $653=$reg;var $654=$653|0;var $655=$654+4|0;HEAP32[$655>>2]=$652;label=106;break;case 106:var $657=$hreg;var $658=$657|0;var $659=$658+8|0;var $660=HEAP32[$659>>2];var $661=$reg;var $662=$661|0;var $663=$662+8|0;var $664=HEAP32[$663>>2];var $665=($660|0)>($664|0);if($665){label=107;break}else{label=108;break};case 107:var $667=$hreg;var $668=$667|0;var $669=$668+8|0;var $670=HEAP32[$669>>2];var $671=$reg;var $672=$671|0;var $673=$672+8|0;HEAP32[$673>>2]=$670;label=108;break;case 108:var $675=$hreg;var $676=$675|0;var $677=$676+12|0;var $678=HEAP32[$677>>2];var $679=$reg;var $680=$679|0;var $681=$680+12|0;var $682=HEAP32[$681>>2];var $683=($678|0)>($682|0);if($683){label=109;break}else{label=110;break};case 109:var $685=$hreg;var $686=$685|0;var $687=$686+12|0;var $688=HEAP32[$687>>2];var $689=$reg;var $690=$689|0;var $691=$690+12|0;HEAP32[$691>>2]=$688;label=110;break;case 110:var $693=$hreg;var $694=$693+16|0;var $695=HEAP32[$694>>2];var $696=($695|0)!=0;if($696){label=111;break}else{label=113;break};case 111:var $698=$hreg;var $699=$698+16|0;var $700=HEAP32[$699>>2];var $701=$700|0;var $702=HEAP32[$701>>2];var $703=($702|0)!=0;if($703){label=112;break}else{label=113;break};case 112:var $705=$hreg;var $706=$705+16|0;var $707=HEAP32[$706>>2];var $708=$707;_free($708);label=113;break;case 113:label=114;break;case 114:var $711=$j;var $712=$711+1|0;$j=$712;label=99;break;case 115:var $714=$half;var $715=$num_ri;var $716=$715-$714|0;$num_ri=$716;var $717=$ret;var $718=($717|0)!=0;if($718){label=117;break}else{label=116;break};case 116:label=121;break;case 117:label=97;break;case 118:var $722=$2;var $723=$ri;var $724=$723|0;var $725=$724|0;var $726=$722;var $727=$725;HEAP32[$726>>2]=HEAP32[$727>>2];HEAP32[$726+4>>2]=HEAP32[$727+4>>2];HEAP32[$726+8>>2]=HEAP32[$727+8>>2];HEAP32[$726+12>>2]=HEAP32[$727+12>>2];HEAP32[$726+16>>2]=HEAP32[$727+16>>2];var $728=$ri;var $729=$stack_regions|0;var $730=($728|0)!=($729|0);if($730){label=119;break}else{label=120;break};case 119:var $732=$ri;var $733=$732;_free($733);label=120;break;case 120:var $735=$ret;$1=$735;label=131;break;case 121:$i=0;label=122;break;case 122:var $738=$i;var $739=$num_ri;var $740=($738|0)<($739|0);if($740){label=123;break}else{label=128;break};case 123:var $742=$i;var $743=$ri;var $744=$743+($742*28&-1)|0;var $745=$744|0;var $746=$745+16|0;var $747=HEAP32[$746>>2];var $748=($747|0)!=0;if($748){label=124;break}else{label=126;break};case 124:var $750=$i;var $751=$ri;var $752=$751+($750*28&-1)|0;var $753=$752|0;var $754=$753+16|0;var $755=HEAP32[$754>>2];var $756=$755|0;var $757=HEAP32[$756>>2];var $758=($757|0)!=0;if($758){label=125;break}else{label=126;break};case 125:var $760=$i;var $761=$ri;var $762=$761+($760*28&-1)|0;var $763=$762|0;var $764=$763+16|0;var $765=HEAP32[$764>>2];var $766=$765;_free($766);label=126;break;case 126:label=127;break;case 127:var $769=$i;var $770=$769+1|0;$i=$770;label=122;break;case 128:var $772=$ri;var $773=$stack_regions|0;var $774=($772|0)!=($773|0);if($774){label=129;break}else{label=130;break};case 129:var $776=$ri;var $777=$776;_free($777);label=130;break;case 130:var $779=$2;var $780=_pixman_break($779);$1=$780;label=131;break;case 131:var $782=$1;STACKTOP=sp;return $782}}function _PIXREGION_SZOF($n){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $size;$2=$n;var $3=$2;var $4=$3<<4;$size=$4;var $5=$2;var $6=$5>>>0>268435455;if($6){label=2;break}else{label=3;break};case 2:$1=0;label=6;break;case 3:var $9=$size;var $10=-1-$9|0;var $11=8>$10>>>0;if($11){label=4;break}else{label=5;break};case 4:$1=0;label=6;break;case 5:var $14=$size;var $15=$14+8|0;$1=$15;label=6;break;case 6:var $17=$1;return $17}}function _quick_sort_rects($rects,$numRects){var label=0;var sp=STACKTOP;STACKTOP=STACKTOP+64|0;label=1;while(1)switch(label){case 1:var $1;var $2;var $y1;var $x1;var $i;var $j;var $r;var $t=sp;var $t1=sp+16;var $t2=sp+32;var $t3=sp+48;$1=$rects;$2=$numRects;label=2;break;case 2:var $4=$2;var $5=($4|0)==2;if($5){label=3;break}else{label=8;break};case 3:var $7=$1;var $8=$7|0;var $9=$8+4|0;var $10=HEAP32[$9>>2];var $11=$1;var $12=$11+16|0;var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=($10|0)>($14|0);if($15){label=6;break}else{label=4;break};case 4:var $17=$1;var $18=$17|0;var $19=$18+4|0;var $20=HEAP32[$19>>2];var $21=$1;var $22=$21+16|0;var $23=$22+4|0;var $24=HEAP32[$23>>2];var $25=($20|0)==($24|0);if($25){label=5;break}else{label=7;break};case 5:var $27=$1;var $28=$27|0;var $29=$28|0;var $30=HEAP32[$29>>2];var $31=$1;var $32=$31+16|0;var $33=$32|0;var $34=HEAP32[$33>>2];var $35=($30|0)>($34|0);if($35){label=6;break}else{label=7;break};case 6:var $37=$1;var $38=$37|0;var $39=$t;var $40=$38;HEAP32[$39>>2]=HEAP32[$40>>2];HEAP32[$39+4>>2]=HEAP32[$40+4>>2];HEAP32[$39+8>>2]=HEAP32[$40+8>>2];HEAP32[$39+12>>2]=HEAP32[$40+12>>2];var $41=$1;var $42=$41|0;var $43=$1;var $44=$43+16|0;var $45=$42;var $46=$44;HEAP32[$45>>2]=HEAP32[$46>>2];HEAP32[$45+4>>2]=HEAP32[$46+4>>2];HEAP32[$45+8>>2]=HEAP32[$46+8>>2];HEAP32[$45+12>>2]=HEAP32[$46+12>>2];var $47=$1;var $48=$47+16|0;var $49=$48;var $50=$t;HEAP32[$49>>2]=HEAP32[$50>>2];HEAP32[$49+4>>2]=HEAP32[$50+4>>2];HEAP32[$49+8>>2]=HEAP32[$50+8>>2];HEAP32[$49+12>>2]=HEAP32[$50+12>>2];label=7;break;case 7:label=33;break;case 8:var $53=$1;var $54=$53|0;var $55=$t1;var $56=$54;HEAP32[$55>>2]=HEAP32[$56>>2];HEAP32[$55+4>>2]=HEAP32[$56+4>>2];HEAP32[$55+8>>2]=HEAP32[$56+8>>2];HEAP32[$55+12>>2]=HEAP32[$56+12>>2];var $57=$1;var $58=$57|0;var $59=$2;var $60=$59>>1;var $61=$1;var $62=$61+($60<<4)|0;var $63=$58;var $64=$62;HEAP32[$63>>2]=HEAP32[$64>>2];HEAP32[$63+4>>2]=HEAP32[$64+4>>2];HEAP32[$63+8>>2]=HEAP32[$64+8>>2];HEAP32[$63+12>>2]=HEAP32[$64+12>>2];var $65=$2;var $66=$65>>1;var $67=$1;var $68=$67+($66<<4)|0;var $69=$68;var $70=$t1;HEAP32[$69>>2]=HEAP32[$70>>2];HEAP32[$69+4>>2]=HEAP32[$70+4>>2];HEAP32[$69+8>>2]=HEAP32[$70+8>>2];HEAP32[$69+12>>2]=HEAP32[$70+12>>2];var $71=$1;var $72=$71|0;var $73=$72+4|0;var $74=HEAP32[$73>>2];$y1=$74;var $75=$1;var $76=$75|0;var $77=$76|0;var $78=HEAP32[$77>>2];$x1=$78;$i=0;var $79=$2;$j=$79;label=9;break;case 9:var $81=$i;var $82=$1;var $83=$82+($81<<4)|0;$r=$83;label=10;break;case 10:var $85=$r;var $86=$85+16|0;$r=$86;var $87=$i;var $88=$87+1|0;$i=$88;label=11;break;case 11:var $90=$i;var $91=$2;var $92=($90|0)!=($91|0);if($92){label=12;break}else{var $116=0;label=17;break};case 12:var $94=$r;var $95=$94+4|0;var $96=HEAP32[$95>>2];var $97=$y1;var $98=($96|0)<($97|0);if($98){var $114=1;label=16;break}else{label=13;break};case 13:var $100=$r;var $101=$100+4|0;var $102=HEAP32[$101>>2];var $103=$y1;var $104=($102|0)==($103|0);if($104){label=14;break}else{var $112=0;label=15;break};case 14:var $106=$r;var $107=$106|0;var $108=HEAP32[$107>>2];var $109=$x1;var $110=($108|0)<($109|0);var $112=$110;label=15;break;case 15:var $112;var $114=$112;label=16;break;case 16:var $114;var $116=$114;label=17;break;case 17:var $116;if($116){label=10;break}else{label=18;break};case 18:var $118=$j;var $119=$1;var $120=$119+($118<<4)|0;$r=$120;label=19;break;case 19:var $122=$r;var $123=$122-16|0;$r=$123;var $124=$j;var $125=$124-1|0;$j=$125;label=20;break;case 20:var $127=$y1;var $128=$r;var $129=$128+4|0;var $130=HEAP32[$129>>2];var $131=($127|0)<($130|0);if($131){var $147=1;label=24;break}else{label=21;break};case 21:var $133=$y1;var $134=$r;var $135=$134+4|0;var $136=HEAP32[$135>>2];var $137=($133|0)==($136|0);if($137){label=22;break}else{var $145=0;label=23;break};case 22:var $139=$x1;var $140=$r;var $141=$140|0;var $142=HEAP32[$141>>2];var $143=($139|0)<($142|0);var $145=$143;label=23;break;case 23:var $145;var $147=$145;label=24;break;case 24:var $147;if($147){label=19;break}else{label=25;break};case 25:var $149=$i;var $150=$j;var $151=($149|0)<($150|0);if($151){label=26;break}else{label=27;break};case 26:var $153=$i;var $154=$1;var $155=$154+($153<<4)|0;var $156=$t2;var $157=$155;HEAP32[$156>>2]=HEAP32[$157>>2];HEAP32[$156+4>>2]=HEAP32[$157+4>>2];HEAP32[$156+8>>2]=HEAP32[$157+8>>2];HEAP32[$156+12>>2]=HEAP32[$157+12>>2];var $158=$i;var $159=$1;var $160=$159+($158<<4)|0;var $161=$j;var $162=$1;var $163=$162+($161<<4)|0;var $164=$160;var $165=$163;HEAP32[$164>>2]=HEAP32[$165>>2];HEAP32[$164+4>>2]=HEAP32[$165+4>>2];HEAP32[$164+8>>2]=HEAP32[$165+8>>2];HEAP32[$164+12>>2]=HEAP32[$165+12>>2];var $166=$j;var $167=$1;var $168=$167+($166<<4)|0;var $169=$168;var $170=$t2;HEAP32[$169>>2]=HEAP32[$170>>2];HEAP32[$169+4>>2]=HEAP32[$170+4>>2];HEAP32[$169+8>>2]=HEAP32[$170+8>>2];HEAP32[$169+12>>2]=HEAP32[$170+12>>2];label=27;break;case 27:label=28;break;case 28:var $173=$i;var $174=$j;var $175=($173|0)<($174|0);if($175){label=9;break}else{label=29;break};case 29:var $177=$1;var $178=$177|0;var $179=$t3;var $180=$178;HEAP32[$179>>2]=HEAP32[$180>>2];HEAP32[$179+4>>2]=HEAP32[$180+4>>2];HEAP32[$179+8>>2]=HEAP32[$180+8>>2];HEAP32[$179+12>>2]=HEAP32[$180+12>>2];var $181=$1;var $182=$181|0;var $183=$j;var $184=$1;var $185=$184+($183<<4)|0;var $186=$182;var $187=$185;HEAP32[$186>>2]=HEAP32[$187>>2];HEAP32[$186+4>>2]=HEAP32[$187+4>>2];HEAP32[$186+8>>2]=HEAP32[$187+8>>2];HEAP32[$186+12>>2]=HEAP32[$187+12>>2];var $188=$j;var $189=$1;var $190=$189+($188<<4)|0;var $191=$190;var $192=$t3;HEAP32[$191>>2]=HEAP32[$192>>2];HEAP32[$191+4>>2]=HEAP32[$192+4>>2];HEAP32[$191+8>>2]=HEAP32[$192+8>>2];HEAP32[$191+12>>2]=HEAP32[$192+12>>2];var $193=$2;var $194=$j;var $195=$193-$194|0;var $196=$195-1|0;var $197=($196|0)>1;if($197){label=30;break}else{label=31;break};case 30:var $199=$j;var $200=$199+1|0;var $201=$1;var $202=$201+($200<<4)|0;var $203=$2;var $204=$j;var $205=$203-$204|0;var $206=$205-1|0;_quick_sort_rects($202,$206);label=31;break;case 31:var $208=$j;$2=$208;label=32;break;case 32:var $210=$2;var $211=($210|0)>1;if($211){label=2;break}else{label=33;break};case 33:STACKTOP=sp;return}}function _pixman_coalesce($region,$prev_start,$cur_start){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $prev_box;var $cur_box;var $numRects;var $y2;$2=$region;$3=$prev_start;$4=$cur_start;var $5=$4;var $6=$3;var $7=$5-$6|0;$numRects=$7;label=2;break;case 2:var $9=$numRects;var $10=$2;var $11=$10+16|0;var $12=HEAP32[$11>>2];var $13=$12+4|0;var $14=HEAP32[$13>>2];var $15=$4;var $16=$14-$15|0;var $17=($9|0)==($16|0);var $18=$17^1;var $19=$18&1;var $20=$19;var $21=($20|0)!=0;if($21){label=3;break}else{label=4;break};case 3:__pixman_log_error(2320,504);label=4;break;case 4:label=5;break;case 5:var $25=$numRects;var $26=($25|0)!=0;if($26){label=7;break}else{label=6;break};case 6:var $28=$4;$1=$28;label=19;break;case 7:var $30=$3;var $31=$2;var $32=$31+16|0;var $33=HEAP32[$32>>2];var $34=$33+8|0;var $35=$34;var $36=$35+($30<<4)|0;$prev_box=$36;var $37=$4;var $38=$2;var $39=$38+16|0;var $40=HEAP32[$39>>2];var $41=$40+8|0;var $42=$41;var $43=$42+($37<<4)|0;$cur_box=$43;var $44=$prev_box;var $45=$44+12|0;var $46=HEAP32[$45>>2];var $47=$cur_box;var $48=$47+4|0;var $49=HEAP32[$48>>2];var $50=($46|0)!=($49|0);if($50){label=8;break}else{label=9;break};case 8:var $52=$4;$1=$52;label=19;break;case 9:var $54=$cur_box;var $55=$54+12|0;var $56=HEAP32[$55>>2];$y2=$56;label=10;break;case 10:var $58=$prev_box;var $59=$58|0;var $60=HEAP32[$59>>2];var $61=$cur_box;var $62=$61|0;var $63=HEAP32[$62>>2];var $64=($60|0)!=($63|0);if($64){label=12;break}else{label=11;break};case 11:var $66=$prev_box;var $67=$66+8|0;var $68=HEAP32[$67>>2];var $69=$cur_box;var $70=$69+8|0;var $71=HEAP32[$70>>2];var $72=($68|0)!=($71|0);if($72){label=12;break}else{label=13;break};case 12:var $74=$4;$1=$74;label=19;break;case 13:var $76=$prev_box;var $77=$76+16|0;$prev_box=$77;var $78=$cur_box;var $79=$78+16|0;$cur_box=$79;var $80=$numRects;var $81=$80-1|0;$numRects=$81;label=14;break;case 14:var $83=$numRects;var $84=($83|0)!=0;if($84){label=10;break}else{label=15;break};case 15:var $86=$4;var $87=$3;var $88=$86-$87|0;$numRects=$88;var $89=$numRects;var $90=$2;var $91=$90+16|0;var $92=HEAP32[$91>>2];var $93=$92+4|0;var $94=HEAP32[$93>>2];var $95=$94-$89|0;HEAP32[$93>>2]=$95;label=16;break;case 16:var $97=$prev_box;var $98=$97-16|0;$prev_box=$98;var $99=$y2;var $100=$prev_box;var $101=$100+12|0;HEAP32[$101>>2]=$99;var $102=$numRects;var $103=$102-1|0;$numRects=$103;label=17;break;case 17:var $105=$numRects;var $106=($105|0)!=0;if($106){label=16;break}else{label=18;break};case 18:var $108=$3;$1=$108;label=19;break;case 19:var $110=$1;return $110}}function _pixman_region_append_non_o($region,$r,$r_end,$y1,$y2){var label=0;label=1;while(1)switch(label){case 1:var $1;var $2;var $3;var $4;var $5;var $6;var $next_rect;var $new_rects;$2=$region;$3=$r;$4=$r_end;$5=$y1;$6=$y2;var $7=$4;var $8=$3;var $9=$7;var $10=$8;var $11=$9-$10|0;var $12=($11|0)/16&-1;$new_rects=$12;label=2;break;case 2:var $14=$5;var $15=$6;var $16=($14|0)<($15|0);var $17=$16^1;var $18=$17&1;var $19=$18;var $20=($19|0)!=0;if($20){label=3;break}else{label=4;break};case 3:__pixman_log_error(1776,464);label=4;break;case 4:label=5;break;case 5:label=6;break;case 6:var $25=$new_rects;var $26=($25|0)!=0;var $27=$26^1;var $28=$27&1;var $29=$28;var $30=($29|0)!=0;if($30){label=7;break}else{label=8;break};case 7:__pixman_log_error(1776,848);label=8;break;case 8:label=9;break;case 9:label=10;break;case 10:var $35=$2;var $36=$35+16|0;var $37=HEAP32[$36>>2];var $38=($37|0)!=0;if($38){label=11;break}else{label=12;break};case 11:var $40=$2;var $41=$40+16|0;var $42=HEAP32[$41>>2];var $43=$42+4|0;var $44=HEAP32[$43>>2];var $45=$new_rects;var $46=$44+$45|0;var $47=$2;var $48=$47+16|0;var $49=HEAP32[$48>>2];var $50=$49|0;var $51=HEAP32[$50>>2];var $52=($46|0)>($51|0);if($52){label=12;break}else{label=15;break};case 12:var $54=$2;var $55=$new_rects;var $56=_pixman_rect_alloc($54,$55);var $57=($56|0)!=0;if($57){label=14;break}else{label=13;break};case 13:$1=0;label=26;break;case 14:label=15;break;case 15:label=16;break;case 16:var $62=$2;var $63=$62+16|0;var $64=HEAP32[$63>>2];var $65=$64+4|0;var $66=HEAP32[$65>>2];var $67=$2;var $68=$67+16|0;var $69=HEAP32[$68>>2];var $70=$69+8|0;var $71=$70;var $72=$71+($66<<4)|0;$next_rect=$72;var $73=$new_rects;var $74=$2;var $75=$74+16|0;var $76=HEAP32[$75>>2];var $77=$76+4|0;var $78=HEAP32[$77>>2];var $79=$78+$73|0;HEAP32[$77>>2]=$79;label=17;break;case 17:label=18;break;case 18:var $82=$3;var $83=$82|0;var $84=HEAP32[$83>>2];var $85=$3;var $86=$85+8|0;var $87=HEAP32[$86>>2];var $88=($84|0)<($87|0);var $89=$88^1;var $90=$89&1;var $91=$90;var $92=($91|0)!=0;if($92){label=19;break}else{label=20;break};case 19:__pixman_log_error(1776,808);label=20;break;case 20:label=21;break;case 21:label=22;break;case 22:var $97=$3;var $98=$97|0;var $99=HEAP32[$98>>2];var $100=$next_rect;var $101=$100|0;HEAP32[$101>>2]=$99;var $102=$5;var $103=$next_rect;var $104=$103+4|0;HEAP32[$104>>2]=$102;var $105=$3;var $106=$105+8|0;var $107=HEAP32[$106>>2];var $108=$next_rect;var $109=$108+8|0;HEAP32[$109>>2]=$107;var $110=$6;var $111=$next_rect;var $112=$111+12|0;HEAP32[$112>>2]=$110;var $113=$next_rect;var $114=$113+16|0;$next_rect=$114;label=23;break;case 23:var $116=$3;var $117=$116+16|0;$3=$117;label=24;break;case 24:var $119=$3;var $120=$4;var $121=($119|0)!=($120|0);if($121){label=17;break}else{label=25;break};case 25:$1=1;label=26;break;case 26:var $124=$1;return $124}}function _malloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=$bytes>>>0<245;if($1){label=2;break}else{label=78;break};case 2:var $3=$bytes>>>0<11;if($3){var $8=16;label=4;break}else{label=3;break};case 3:var $5=$bytes+11|0;var $6=$5&-8;var $8=$6;label=4;break;case 4:var $8;var $9=$8>>>3;var $10=HEAP32[2616>>2];var $11=$10>>>($9>>>0);var $12=$11&3;var $13=($12|0)==0;if($13){label=12;break}else{label=5;break};case 5:var $15=$11&1;var $16=$15^1;var $17=$16+$9|0;var $18=$17<<1;var $19=2656+($18<<2)|0;var $20=$19;var $_sum11=$18+2|0;var $21=2656+($_sum11<<2)|0;var $22=HEAP32[$21>>2];var $23=$22+8|0;var $24=HEAP32[$23>>2];var $25=($20|0)==($24|0);if($25){label=6;break}else{label=7;break};case 6:var $27=1<<$17;var $28=~$27;var $29=$10&$28;HEAP32[2616>>2]=$29;label=11;break;case 7:var $31=$24;var $32=HEAP32[2632>>2];var $33=$31>>>0<$32>>>0;if($33){label=10;break}else{label=8;break};case 8:var $35=$24+12|0;var $36=HEAP32[$35>>2];var $37=($36|0)==($22|0);if($37){label=9;break}else{label=10;break};case 9:HEAP32[$35>>2]=$20;HEAP32[$21>>2]=$24;label=11;break;case 10:_abort();case 11:var $40=$17<<3;var $41=$40|3;var $42=$22+4|0;HEAP32[$42>>2]=$41;var $43=$22;var $_sum1314=$40|4;var $44=$43+$_sum1314|0;var $45=$44;var $46=HEAP32[$45>>2];var $47=$46|1;HEAP32[$45>>2]=$47;var $48=$23;var $mem_0=$48;label=344;break;case 12:var $50=HEAP32[2624>>2];var $51=$8>>>0>$50>>>0;if($51){label=13;break}else{var $nb_0=$8;label=161;break};case 13:var $53=($11|0)==0;if($53){label=27;break}else{label=14;break};case 14:var $55=$11<<$9;var $56=2<<$9;var $57=-$56|0;var $58=$56|$57;var $59=$55&$58;var $60=-$59|0;var $61=$59&$60;var $62=$61-1|0;var $63=$62>>>12;var $64=$63&16;var $65=$62>>>($64>>>0);var $66=$65>>>5;var $67=$66&8;var $68=$67|$64;var $69=$65>>>($67>>>0);var $70=$69>>>2;var $71=$70&4;var $72=$68|$71;var $73=$69>>>($71>>>0);var $74=$73>>>1;var $75=$74&2;var $76=$72|$75;var $77=$73>>>($75>>>0);var $78=$77>>>1;var $79=$78&1;var $80=$76|$79;var $81=$77>>>($79>>>0);var $82=$80+$81|0;var $83=$82<<1;var $84=2656+($83<<2)|0;var $85=$84;var $_sum4=$83+2|0;var $86=2656+($_sum4<<2)|0;var $87=HEAP32[$86>>2];var $88=$87+8|0;var $89=HEAP32[$88>>2];var $90=($85|0)==($89|0);if($90){label=15;break}else{label=16;break};case 15:var $92=1<<$82;var $93=~$92;var $94=$10&$93;HEAP32[2616>>2]=$94;label=20;break;case 16:var $96=$89;var $97=HEAP32[2632>>2];var $98=$96>>>0<$97>>>0;if($98){label=19;break}else{label=17;break};case 17:var $100=$89+12|0;var $101=HEAP32[$100>>2];var $102=($101|0)==($87|0);if($102){label=18;break}else{label=19;break};case 18:HEAP32[$100>>2]=$85;HEAP32[$86>>2]=$89;label=20;break;case 19:_abort();case 20:var $105=$82<<3;var $106=$105-$8|0;var $107=$8|3;var $108=$87+4|0;HEAP32[$108>>2]=$107;var $109=$87;var $110=$109+$8|0;var $111=$110;var $112=$106|1;var $_sum67=$8|4;var $113=$109+$_sum67|0;var $114=$113;HEAP32[$114>>2]=$112;var $115=$109+$105|0;var $116=$115;HEAP32[$116>>2]=$106;var $117=HEAP32[2624>>2];var $118=($117|0)==0;if($118){label=26;break}else{label=21;break};case 21:var $120=HEAP32[2636>>2];var $121=$117>>>3;var $122=$121<<1;var $123=2656+($122<<2)|0;var $124=$123;var $125=HEAP32[2616>>2];var $126=1<<$121;var $127=$125&$126;var $128=($127|0)==0;if($128){label=22;break}else{label=23;break};case 22:var $130=$125|$126;HEAP32[2616>>2]=$130;var $_sum9_pre=$122+2|0;var $_pre=2656+($_sum9_pre<<2)|0;var $F4_0=$124;var $_pre_phi=$_pre;label=25;break;case 23:var $_sum10=$122+2|0;var $132=2656+($_sum10<<2)|0;var $133=HEAP32[$132>>2];var $134=$133;var $135=HEAP32[2632>>2];var $136=$134>>>0<$135>>>0;if($136){label=24;break}else{var $F4_0=$133;var $_pre_phi=$132;label=25;break};case 24:_abort();case 25:var $_pre_phi;var $F4_0;HEAP32[$_pre_phi>>2]=$120;var $139=$F4_0+12|0;HEAP32[$139>>2]=$120;var $140=$120+8|0;HEAP32[$140>>2]=$F4_0;var $141=$120+12|0;HEAP32[$141>>2]=$124;label=26;break;case 26:HEAP32[2624>>2]=$106;HEAP32[2636>>2]=$111;var $143=$88;var $mem_0=$143;label=344;break;case 27:var $145=HEAP32[2620>>2];var $146=($145|0)==0;if($146){var $nb_0=$8;label=161;break}else{label=28;break};case 28:var $148=-$145|0;var $149=$145&$148;var $150=$149-1|0;var $151=$150>>>12;var $152=$151&16;var $153=$150>>>($152>>>0);var $154=$153>>>5;var $155=$154&8;var $156=$155|$152;var $157=$153>>>($155>>>0);var $158=$157>>>2;var $159=$158&4;var $160=$156|$159;var $161=$157>>>($159>>>0);var $162=$161>>>1;var $163=$162&2;var $164=$160|$163;var $165=$161>>>($163>>>0);var $166=$165>>>1;var $167=$166&1;var $168=$164|$167;var $169=$165>>>($167>>>0);var $170=$168+$169|0;var $171=2920+($170<<2)|0;var $172=HEAP32[$171>>2];var $173=$172+4|0;var $174=HEAP32[$173>>2];var $175=$174&-8;var $176=$175-$8|0;var $t_0_i=$172;var $v_0_i=$172;var $rsize_0_i=$176;label=29;break;case 29:var $rsize_0_i;var $v_0_i;var $t_0_i;var $178=$t_0_i+16|0;var $179=HEAP32[$178>>2];var $180=($179|0)==0;if($180){label=30;break}else{var $185=$179;label=31;break};case 30:var $182=$t_0_i+20|0;var $183=HEAP32[$182>>2];var $184=($183|0)==0;if($184){label=32;break}else{var $185=$183;label=31;break};case 31:var $185;var $186=$185+4|0;var $187=HEAP32[$186>>2];var $188=$187&-8;var $189=$188-$8|0;var $190=$189>>>0<$rsize_0_i>>>0;var $_rsize_0_i=$190?$189:$rsize_0_i;var $_v_0_i=$190?$185:$v_0_i;var $t_0_i=$185;var $v_0_i=$_v_0_i;var $rsize_0_i=$_rsize_0_i;label=29;break;case 32:var $192=$v_0_i;var $193=HEAP32[2632>>2];var $194=$192>>>0<$193>>>0;if($194){label=76;break}else{label=33;break};case 33:var $196=$192+$8|0;var $197=$196;var $198=$192>>>0<$196>>>0;if($198){label=34;break}else{label=76;break};case 34:var $200=$v_0_i+24|0;var $201=HEAP32[$200>>2];var $202=$v_0_i+12|0;var $203=HEAP32[$202>>2];var $204=($203|0)==($v_0_i|0);if($204){label=40;break}else{label=35;break};case 35:var $206=$v_0_i+8|0;var $207=HEAP32[$206>>2];var $208=$207;var $209=$208>>>0<$193>>>0;if($209){label=39;break}else{label=36;break};case 36:var $211=$207+12|0;var $212=HEAP32[$211>>2];var $213=($212|0)==($v_0_i|0);if($213){label=37;break}else{label=39;break};case 37:var $215=$203+8|0;var $216=HEAP32[$215>>2];var $217=($216|0)==($v_0_i|0);if($217){label=38;break}else{label=39;break};case 38:HEAP32[$211>>2]=$203;HEAP32[$215>>2]=$207;var $R_1_i=$203;label=47;break;case 39:_abort();case 40:var $220=$v_0_i+20|0;var $221=HEAP32[$220>>2];var $222=($221|0)==0;if($222){label=41;break}else{var $R_0_i=$221;var $RP_0_i=$220;label=42;break};case 41:var $224=$v_0_i+16|0;var $225=HEAP32[$224>>2];var $226=($225|0)==0;if($226){var $R_1_i=0;label=47;break}else{var $R_0_i=$225;var $RP_0_i=$224;label=42;break};case 42:var $RP_0_i;var $R_0_i;var $227=$R_0_i+20|0;var $228=HEAP32[$227>>2];var $229=($228|0)==0;if($229){label=43;break}else{var $R_0_i=$228;var $RP_0_i=$227;label=42;break};case 43:var $231=$R_0_i+16|0;var $232=HEAP32[$231>>2];var $233=($232|0)==0;if($233){label=44;break}else{var $R_0_i=$232;var $RP_0_i=$231;label=42;break};case 44:var $235=$RP_0_i;var $236=$235>>>0<$193>>>0;if($236){label=46;break}else{label=45;break};case 45:HEAP32[$RP_0_i>>2]=0;var $R_1_i=$R_0_i;label=47;break;case 46:_abort();case 47:var $R_1_i;var $240=($201|0)==0;if($240){label=67;break}else{label=48;break};case 48:var $242=$v_0_i+28|0;var $243=HEAP32[$242>>2];var $244=2920+($243<<2)|0;var $245=HEAP32[$244>>2];var $246=($v_0_i|0)==($245|0);if($246){label=49;break}else{label=51;break};case 49:HEAP32[$244>>2]=$R_1_i;var $cond_i=($R_1_i|0)==0;if($cond_i){label=50;break}else{label=57;break};case 50:var $248=HEAP32[$242>>2];var $249=1<<$248;var $250=~$249;var $251=HEAP32[2620>>2];var $252=$251&$250;HEAP32[2620>>2]=$252;label=67;break;case 51:var $254=$201;var $255=HEAP32[2632>>2];var $256=$254>>>0<$255>>>0;if($256){label=55;break}else{label=52;break};case 52:var $258=$201+16|0;var $259=HEAP32[$258>>2];var $260=($259|0)==($v_0_i|0);if($260){label=53;break}else{label=54;break};case 53:HEAP32[$258>>2]=$R_1_i;label=56;break;case 54:var $263=$201+20|0;HEAP32[$263>>2]=$R_1_i;label=56;break;case 55:_abort();case 56:var $266=($R_1_i|0)==0;if($266){label=67;break}else{label=57;break};case 57:var $268=$R_1_i;var $269=HEAP32[2632>>2];var $270=$268>>>0<$269>>>0;if($270){label=66;break}else{label=58;break};case 58:var $272=$R_1_i+24|0;HEAP32[$272>>2]=$201;var $273=$v_0_i+16|0;var $274=HEAP32[$273>>2];var $275=($274|0)==0;if($275){label=62;break}else{label=59;break};case 59:var $277=$274;var $278=HEAP32[2632>>2];var $279=$277>>>0<$278>>>0;if($279){label=61;break}else{label=60;break};case 60:var $281=$R_1_i+16|0;HEAP32[$281>>2]=$274;var $282=$274+24|0;HEAP32[$282>>2]=$R_1_i;label=62;break;case 61:_abort();case 62:var $285=$v_0_i+20|0;var $286=HEAP32[$285>>2];var $287=($286|0)==0;if($287){label=67;break}else{label=63;break};case 63:var $289=$286;var $290=HEAP32[2632>>2];var $291=$289>>>0<$290>>>0;if($291){label=65;break}else{label=64;break};case 64:var $293=$R_1_i+20|0;HEAP32[$293>>2]=$286;var $294=$286+24|0;HEAP32[$294>>2]=$R_1_i;label=67;break;case 65:_abort();case 66:_abort();case 67:var $298=$rsize_0_i>>>0<16;if($298){label=68;break}else{label=69;break};case 68:var $300=$rsize_0_i+$8|0;var $301=$300|3;var $302=$v_0_i+4|0;HEAP32[$302>>2]=$301;var $_sum4_i=$300+4|0;var $303=$192+$_sum4_i|0;var $304=$303;var $305=HEAP32[$304>>2];var $306=$305|1;HEAP32[$304>>2]=$306;label=77;break;case 69:var $308=$8|3;var $309=$v_0_i+4|0;HEAP32[$309>>2]=$308;var $310=$rsize_0_i|1;var $_sum_i37=$8|4;var $311=$192+$_sum_i37|0;var $312=$311;HEAP32[$312>>2]=$310;var $_sum1_i=$rsize_0_i+$8|0;var $313=$192+$_sum1_i|0;var $314=$313;HEAP32[$314>>2]=$rsize_0_i;var $315=HEAP32[2624>>2];var $316=($315|0)==0;if($316){label=75;break}else{label=70;break};case 70:var $318=HEAP32[2636>>2];var $319=$315>>>3;var $320=$319<<1;var $321=2656+($320<<2)|0;var $322=$321;var $323=HEAP32[2616>>2];var $324=1<<$319;var $325=$323&$324;var $326=($325|0)==0;if($326){label=71;break}else{label=72;break};case 71:var $328=$323|$324;HEAP32[2616>>2]=$328;var $_sum2_pre_i=$320+2|0;var $_pre_i=2656+($_sum2_pre_i<<2)|0;var $F1_0_i=$322;var $_pre_phi_i=$_pre_i;label=74;break;case 72:var $_sum3_i=$320+2|0;var $330=2656+($_sum3_i<<2)|0;var $331=HEAP32[$330>>2];var $332=$331;var $333=HEAP32[2632>>2];var $334=$332>>>0<$333>>>0;if($334){label=73;break}else{var $F1_0_i=$331;var $_pre_phi_i=$330;label=74;break};case 73:_abort();case 74:var $_pre_phi_i;var $F1_0_i;HEAP32[$_pre_phi_i>>2]=$318;var $337=$F1_0_i+12|0;HEAP32[$337>>2]=$318;var $338=$318+8|0;HEAP32[$338>>2]=$F1_0_i;var $339=$318+12|0;HEAP32[$339>>2]=$322;label=75;break;case 75:HEAP32[2624>>2]=$rsize_0_i;HEAP32[2636>>2]=$197;label=77;break;case 76:_abort();case 77:var $342=$v_0_i+8|0;var $343=$342;var $mem_0=$343;label=344;break;case 78:var $345=$bytes>>>0>4294967231;if($345){var $nb_0=-1;label=161;break}else{label=79;break};case 79:var $347=$bytes+11|0;var $348=$347&-8;var $349=HEAP32[2620>>2];var $350=($349|0)==0;if($350){var $nb_0=$348;label=161;break}else{label=80;break};case 80:var $352=-$348|0;var $353=$347>>>8;var $354=($353|0)==0;if($354){var $idx_0_i=0;label=83;break}else{label=81;break};case 81:var $356=$348>>>0>16777215;if($356){var $idx_0_i=31;label=83;break}else{label=82;break};case 82:var $358=$353+1048320|0;var $359=$358>>>16;var $360=$359&8;var $361=$353<<$360;var $362=$361+520192|0;var $363=$362>>>16;var $364=$363&4;var $365=$364|$360;var $366=$361<<$364;var $367=$366+245760|0;var $368=$367>>>16;var $369=$368&2;var $370=$365|$369;var $371=14-$370|0;var $372=$366<<$369;var $373=$372>>>15;var $374=$371+$373|0;var $375=$374<<1;var $376=$374+7|0;var $377=$348>>>($376>>>0);var $378=$377&1;var $379=$378|$375;var $idx_0_i=$379;label=83;break;case 83:var $idx_0_i;var $381=2920+($idx_0_i<<2)|0;var $382=HEAP32[$381>>2];var $383=($382|0)==0;if($383){var $v_2_i=0;var $rsize_2_i=$352;var $t_1_i=0;label=90;break}else{label=84;break};case 84:var $385=($idx_0_i|0)==31;if($385){var $390=0;label=86;break}else{label=85;break};case 85:var $387=$idx_0_i>>>1;var $388=25-$387|0;var $390=$388;label=86;break;case 86:var $390;var $391=$348<<$390;var $v_0_i18=0;var $rsize_0_i17=$352;var $t_0_i16=$382;var $sizebits_0_i=$391;var $rst_0_i=0;label=87;break;case 87:var $rst_0_i;var $sizebits_0_i;var $t_0_i16;var $rsize_0_i17;var $v_0_i18;var $393=$t_0_i16+4|0;var $394=HEAP32[$393>>2];var $395=$394&-8;var $396=$395-$348|0;var $397=$396>>>0<$rsize_0_i17>>>0;if($397){label=88;break}else{var $v_1_i=$v_0_i18;var $rsize_1_i=$rsize_0_i17;label=89;break};case 88:var $399=($395|0)==($348|0);if($399){var $v_2_i=$t_0_i16;var $rsize_2_i=$396;var $t_1_i=$t_0_i16;label=90;break}else{var $v_1_i=$t_0_i16;var $rsize_1_i=$396;label=89;break};case 89:var $rsize_1_i;var $v_1_i;var $401=$t_0_i16+20|0;var $402=HEAP32[$401>>2];var $403=$sizebits_0_i>>>31;var $404=$t_0_i16+16+($403<<2)|0;var $405=HEAP32[$404>>2];var $406=($402|0)==0;var $407=($402|0)==($405|0);var $or_cond_i=$406|$407;var $rst_1_i=$or_cond_i?$rst_0_i:$402;var $408=($405|0)==0;var $409=$sizebits_0_i<<1;if($408){var $v_2_i=$v_1_i;var $rsize_2_i=$rsize_1_i;var $t_1_i=$rst_1_i;label=90;break}else{var $v_0_i18=$v_1_i;var $rsize_0_i17=$rsize_1_i;var $t_0_i16=$405;var $sizebits_0_i=$409;var $rst_0_i=$rst_1_i;label=87;break};case 90:var $t_1_i;var $rsize_2_i;var $v_2_i;var $410=($t_1_i|0)==0;var $411=($v_2_i|0)==0;var $or_cond21_i=$410&$411;if($or_cond21_i){label=91;break}else{var $t_2_ph_i=$t_1_i;label=93;break};case 91:var $413=2<<$idx_0_i;var $414=-$413|0;var $415=$413|$414;var $416=$349&$415;var $417=($416|0)==0;if($417){var $nb_0=$348;label=161;break}else{label=92;break};case 92:var $419=-$416|0;var $420=$416&$419;var $421=$420-1|0;var $422=$421>>>12;var $423=$422&16;var $424=$421>>>($423>>>0);var $425=$424>>>5;var $426=$425&8;var $427=$426|$423;var $428=$424>>>($426>>>0);var $429=$428>>>2;var $430=$429&4;var $431=$427|$430;var $432=$428>>>($430>>>0);var $433=$432>>>1;var $434=$433&2;var $435=$431|$434;var $436=$432>>>($434>>>0);var $437=$436>>>1;var $438=$437&1;var $439=$435|$438;var $440=$436>>>($438>>>0);var $441=$439+$440|0;var $442=2920+($441<<2)|0;var $443=HEAP32[$442>>2];var $t_2_ph_i=$443;label=93;break;case 93:var $t_2_ph_i;var $444=($t_2_ph_i|0)==0;if($444){var $rsize_3_lcssa_i=$rsize_2_i;var $v_3_lcssa_i=$v_2_i;label=96;break}else{var $t_230_i=$t_2_ph_i;var $rsize_331_i=$rsize_2_i;var $v_332_i=$v_2_i;label=94;break};case 94:var $v_332_i;var $rsize_331_i;var $t_230_i;var $445=$t_230_i+4|0;var $446=HEAP32[$445>>2];var $447=$446&-8;var $448=$447-$348|0;var $449=$448>>>0<$rsize_331_i>>>0;var $_rsize_3_i=$449?$448:$rsize_331_i;var $t_2_v_3_i=$449?$t_230_i:$v_332_i;var $450=$t_230_i+16|0;var $451=HEAP32[$450>>2];var $452=($451|0)==0;if($452){label=95;break}else{var $t_230_i=$451;var $rsize_331_i=$_rsize_3_i;var $v_332_i=$t_2_v_3_i;label=94;break};case 95:var $453=$t_230_i+20|0;var $454=HEAP32[$453>>2];var $455=($454|0)==0;if($455){var $rsize_3_lcssa_i=$_rsize_3_i;var $v_3_lcssa_i=$t_2_v_3_i;label=96;break}else{var $t_230_i=$454;var $rsize_331_i=$_rsize_3_i;var $v_332_i=$t_2_v_3_i;label=94;break};case 96:var $v_3_lcssa_i;var $rsize_3_lcssa_i;var $456=($v_3_lcssa_i|0)==0;if($456){var $nb_0=$348;label=161;break}else{label=97;break};case 97:var $458=HEAP32[2624>>2];var $459=$458-$348|0;var $460=$rsize_3_lcssa_i>>>0<$459>>>0;if($460){label=98;break}else{var $nb_0=$348;label=161;break};case 98:var $462=$v_3_lcssa_i;var $463=HEAP32[2632>>2];var $464=$462>>>0<$463>>>0;if($464){label=159;break}else{label=99;break};case 99:var $466=$462+$348|0;var $467=$466;var $468=$462>>>0<$466>>>0;if($468){label=100;break}else{label=159;break};case 100:var $470=$v_3_lcssa_i+24|0;var $471=HEAP32[$470>>2];var $472=$v_3_lcssa_i+12|0;var $473=HEAP32[$472>>2];var $474=($473|0)==($v_3_lcssa_i|0);if($474){label=106;break}else{label=101;break};case 101:var $476=$v_3_lcssa_i+8|0;var $477=HEAP32[$476>>2];var $478=$477;var $479=$478>>>0<$463>>>0;if($479){label=105;break}else{label=102;break};case 102:var $481=$477+12|0;var $482=HEAP32[$481>>2];var $483=($482|0)==($v_3_lcssa_i|0);if($483){label=103;break}else{label=105;break};case 103:var $485=$473+8|0;var $486=HEAP32[$485>>2];var $487=($486|0)==($v_3_lcssa_i|0);if($487){label=104;break}else{label=105;break};case 104:HEAP32[$481>>2]=$473;HEAP32[$485>>2]=$477;var $R_1_i22=$473;label=113;break;case 105:_abort();case 106:var $490=$v_3_lcssa_i+20|0;var $491=HEAP32[$490>>2];var $492=($491|0)==0;if($492){label=107;break}else{var $R_0_i20=$491;var $RP_0_i19=$490;label=108;break};case 107:var $494=$v_3_lcssa_i+16|0;var $495=HEAP32[$494>>2];var $496=($495|0)==0;if($496){var $R_1_i22=0;label=113;break}else{var $R_0_i20=$495;var $RP_0_i19=$494;label=108;break};case 108:var $RP_0_i19;var $R_0_i20;var $497=$R_0_i20+20|0;var $498=HEAP32[$497>>2];var $499=($498|0)==0;if($499){label=109;break}else{var $R_0_i20=$498;var $RP_0_i19=$497;label=108;break};case 109:var $501=$R_0_i20+16|0;var $502=HEAP32[$501>>2];var $503=($502|0)==0;if($503){label=110;break}else{var $R_0_i20=$502;var $RP_0_i19=$501;label=108;break};case 110:var $505=$RP_0_i19;var $506=$505>>>0<$463>>>0;if($506){label=112;break}else{label=111;break};case 111:HEAP32[$RP_0_i19>>2]=0;var $R_1_i22=$R_0_i20;label=113;break;case 112:_abort();case 113:var $R_1_i22;var $510=($471|0)==0;if($510){label=133;break}else{label=114;break};case 114:var $512=$v_3_lcssa_i+28|0;var $513=HEAP32[$512>>2];var $514=2920+($513<<2)|0;var $515=HEAP32[$514>>2];var $516=($v_3_lcssa_i|0)==($515|0);if($516){label=115;break}else{label=117;break};case 115:HEAP32[$514>>2]=$R_1_i22;var $cond_i23=($R_1_i22|0)==0;if($cond_i23){label=116;break}else{label=123;break};case 116:var $518=HEAP32[$512>>2];var $519=1<<$518;var $520=~$519;var $521=HEAP32[2620>>2];var $522=$521&$520;HEAP32[2620>>2]=$522;label=133;break;case 117:var $524=$471;var $525=HEAP32[2632>>2];var $526=$524>>>0<$525>>>0;if($526){label=121;break}else{label=118;break};case 118:var $528=$471+16|0;var $529=HEAP32[$528>>2];var $530=($529|0)==($v_3_lcssa_i|0);if($530){label=119;break}else{label=120;break};case 119:HEAP32[$528>>2]=$R_1_i22;label=122;break;case 120:var $533=$471+20|0;HEAP32[$533>>2]=$R_1_i22;label=122;break;case 121:_abort();case 122:var $536=($R_1_i22|0)==0;if($536){label=133;break}else{label=123;break};case 123:var $538=$R_1_i22;var $539=HEAP32[2632>>2];var $540=$538>>>0<$539>>>0;if($540){label=132;break}else{label=124;break};case 124:var $542=$R_1_i22+24|0;HEAP32[$542>>2]=$471;var $543=$v_3_lcssa_i+16|0;var $544=HEAP32[$543>>2];var $545=($544|0)==0;if($545){label=128;break}else{label=125;break};case 125:var $547=$544;var $548=HEAP32[2632>>2];var $549=$547>>>0<$548>>>0;if($549){label=127;break}else{label=126;break};case 126:var $551=$R_1_i22+16|0;HEAP32[$551>>2]=$544;var $552=$544+24|0;HEAP32[$552>>2]=$R_1_i22;label=128;break;case 127:_abort();case 128:var $555=$v_3_lcssa_i+20|0;var $556=HEAP32[$555>>2];var $557=($556|0)==0;if($557){label=133;break}else{label=129;break};case 129:var $559=$556;var $560=HEAP32[2632>>2];var $561=$559>>>0<$560>>>0;if($561){label=131;break}else{label=130;break};case 130:var $563=$R_1_i22+20|0;HEAP32[$563>>2]=$556;var $564=$556+24|0;HEAP32[$564>>2]=$R_1_i22;label=133;break;case 131:_abort();case 132:_abort();case 133:var $568=$rsize_3_lcssa_i>>>0<16;if($568){label=134;break}else{label=135;break};case 134:var $570=$rsize_3_lcssa_i+$348|0;var $571=$570|3;var $572=$v_3_lcssa_i+4|0;HEAP32[$572>>2]=$571;var $_sum19_i=$570+4|0;var $573=$462+$_sum19_i|0;var $574=$573;var $575=HEAP32[$574>>2];var $576=$575|1;HEAP32[$574>>2]=$576;label=160;break;case 135:var $578=$348|3;var $579=$v_3_lcssa_i+4|0;HEAP32[$579>>2]=$578;var $580=$rsize_3_lcssa_i|1;var $_sum_i2536=$348|4;var $581=$462+$_sum_i2536|0;var $582=$581;HEAP32[$582>>2]=$580;var $_sum1_i26=$rsize_3_lcssa_i+$348|0;var $583=$462+$_sum1_i26|0;var $584=$583;HEAP32[$584>>2]=$rsize_3_lcssa_i;var $585=$rsize_3_lcssa_i>>>3;var $586=$rsize_3_lcssa_i>>>0<256;if($586){label=136;break}else{label=141;break};case 136:var $588=$585<<1;var $589=2656+($588<<2)|0;var $590=$589;var $591=HEAP32[2616>>2];var $592=1<<$585;var $593=$591&$592;var $594=($593|0)==0;if($594){label=137;break}else{label=138;break};case 137:var $596=$591|$592;HEAP32[2616>>2]=$596;var $_sum15_pre_i=$588+2|0;var $_pre_i27=2656+($_sum15_pre_i<<2)|0;var $F5_0_i=$590;var $_pre_phi_i28=$_pre_i27;label=140;break;case 138:var $_sum18_i=$588+2|0;var $598=2656+($_sum18_i<<2)|0;var $599=HEAP32[$598>>2];var $600=$599;var $601=HEAP32[2632>>2];var $602=$600>>>0<$601>>>0;if($602){label=139;break}else{var $F5_0_i=$599;var $_pre_phi_i28=$598;label=140;break};case 139:_abort();case 140:var $_pre_phi_i28;var $F5_0_i;HEAP32[$_pre_phi_i28>>2]=$467;var $605=$F5_0_i+12|0;HEAP32[$605>>2]=$467;var $_sum16_i=$348+8|0;var $606=$462+$_sum16_i|0;var $607=$606;HEAP32[$607>>2]=$F5_0_i;var $_sum17_i=$348+12|0;var $608=$462+$_sum17_i|0;var $609=$608;HEAP32[$609>>2]=$590;label=160;break;case 141:var $611=$466;var $612=$rsize_3_lcssa_i>>>8;var $613=($612|0)==0;if($613){var $I7_0_i=0;label=144;break}else{label=142;break};case 142:var $615=$rsize_3_lcssa_i>>>0>16777215;if($615){var $I7_0_i=31;label=144;break}else{label=143;break};case 143:var $617=$612+1048320|0;var $618=$617>>>16;var $619=$618&8;var $620=$612<<$619;var $621=$620+520192|0;var $622=$621>>>16;var $623=$622&4;var $624=$623|$619;var $625=$620<<$623;var $626=$625+245760|0;var $627=$626>>>16;var $628=$627&2;var $629=$624|$628;var $630=14-$629|0;var $631=$625<<$628;var $632=$631>>>15;var $633=$630+$632|0;var $634=$633<<1;var $635=$633+7|0;var $636=$rsize_3_lcssa_i>>>($635>>>0);var $637=$636&1;var $638=$637|$634;var $I7_0_i=$638;label=144;break;case 144:var $I7_0_i;var $640=2920+($I7_0_i<<2)|0;var $_sum2_i=$348+28|0;var $641=$462+$_sum2_i|0;var $642=$641;HEAP32[$642>>2]=$I7_0_i;var $_sum3_i29=$348+16|0;var $643=$462+$_sum3_i29|0;var $_sum4_i30=$348+20|0;var $644=$462+$_sum4_i30|0;var $645=$644;HEAP32[$645>>2]=0;var $646=$643;HEAP32[$646>>2]=0;var $647=HEAP32[2620>>2];var $648=1<<$I7_0_i;var $649=$647&$648;var $650=($649|0)==0;if($650){label=145;break}else{label=146;break};case 145:var $652=$647|$648;HEAP32[2620>>2]=$652;HEAP32[$640>>2]=$611;var $653=$640;var $_sum5_i=$348+24|0;var $654=$462+$_sum5_i|0;var $655=$654;HEAP32[$655>>2]=$653;var $_sum6_i=$348+12|0;var $656=$462+$_sum6_i|0;var $657=$656;HEAP32[$657>>2]=$611;var $_sum7_i=$348+8|0;var $658=$462+$_sum7_i|0;var $659=$658;HEAP32[$659>>2]=$611;label=160;break;case 146:var $661=HEAP32[$640>>2];var $662=($I7_0_i|0)==31;if($662){var $667=0;label=148;break}else{label=147;break};case 147:var $664=$I7_0_i>>>1;var $665=25-$664|0;var $667=$665;label=148;break;case 148:var $667;var $668=$661+4|0;var $669=HEAP32[$668>>2];var $670=$669&-8;var $671=($670|0)==($rsize_3_lcssa_i|0);if($671){var $T_0_lcssa_i=$661;label=155;break}else{label=149;break};case 149:var $672=$rsize_3_lcssa_i<<$667;var $T_026_i=$661;var $K12_027_i=$672;label=151;break;case 150:var $674=$K12_027_i<<1;var $675=$682+4|0;var $676=HEAP32[$675>>2];var $677=$676&-8;var $678=($677|0)==($rsize_3_lcssa_i|0);if($678){var $T_0_lcssa_i=$682;label=155;break}else{var $T_026_i=$682;var $K12_027_i=$674;label=151;break};case 151:var $K12_027_i;var $T_026_i;var $680=$K12_027_i>>>31;var $681=$T_026_i+16+($680<<2)|0;var $682=HEAP32[$681>>2];var $683=($682|0)==0;if($683){label=152;break}else{label=150;break};case 152:var $685=$681;var $686=HEAP32[2632>>2];var $687=$685>>>0<$686>>>0;if($687){label=154;break}else{label=153;break};case 153:HEAP32[$681>>2]=$611;var $_sum12_i=$348+24|0;var $689=$462+$_sum12_i|0;var $690=$689;HEAP32[$690>>2]=$T_026_i;var $_sum13_i=$348+12|0;var $691=$462+$_sum13_i|0;var $692=$691;HEAP32[$692>>2]=$611;var $_sum14_i=$348+8|0;var $693=$462+$_sum14_i|0;var $694=$693;HEAP32[$694>>2]=$611;label=160;break;case 154:_abort();case 155:var $T_0_lcssa_i;var $696=$T_0_lcssa_i+8|0;var $697=HEAP32[$696>>2];var $698=$T_0_lcssa_i;var $699=HEAP32[2632>>2];var $700=$698>>>0<$699>>>0;if($700){label=158;break}else{label=156;break};case 156:var $702=$697;var $703=$702>>>0<$699>>>0;if($703){label=158;break}else{label=157;break};case 157:var $705=$697+12|0;HEAP32[$705>>2]=$611;HEAP32[$696>>2]=$611;var $_sum9_i=$348+8|0;var $706=$462+$_sum9_i|0;var $707=$706;HEAP32[$707>>2]=$697;var $_sum10_i=$348+12|0;var $708=$462+$_sum10_i|0;var $709=$708;HEAP32[$709>>2]=$T_0_lcssa_i;var $_sum11_i=$348+24|0;var $710=$462+$_sum11_i|0;var $711=$710;HEAP32[$711>>2]=0;label=160;break;case 158:_abort();case 159:_abort();case 160:var $713=$v_3_lcssa_i+8|0;var $714=$713;var $mem_0=$714;label=344;break;case 161:var $nb_0;var $715=HEAP32[2624>>2];var $716=$nb_0>>>0>$715>>>0;if($716){label=166;break}else{label=162;break};case 162:var $718=$715-$nb_0|0;var $719=HEAP32[2636>>2];var $720=$718>>>0>15;if($720){label=163;break}else{label=164;break};case 163:var $722=$719;var $723=$722+$nb_0|0;var $724=$723;HEAP32[2636>>2]=$724;HEAP32[2624>>2]=$718;var $725=$718|1;var $_sum2=$nb_0+4|0;var $726=$722+$_sum2|0;var $727=$726;HEAP32[$727>>2]=$725;var $728=$722+$715|0;var $729=$728;HEAP32[$729>>2]=$718;var $730=$nb_0|3;var $731=$719+4|0;HEAP32[$731>>2]=$730;label=165;break;case 164:HEAP32[2624>>2]=0;HEAP32[2636>>2]=0;var $733=$715|3;var $734=$719+4|0;HEAP32[$734>>2]=$733;var $735=$719;var $_sum1=$715+4|0;var $736=$735+$_sum1|0;var $737=$736;var $738=HEAP32[$737>>2];var $739=$738|1;HEAP32[$737>>2]=$739;label=165;break;case 165:var $741=$719+8|0;var $742=$741;var $mem_0=$742;label=344;break;case 166:var $744=HEAP32[2628>>2];var $745=$nb_0>>>0<$744>>>0;if($745){label=167;break}else{label=168;break};case 167:var $747=$744-$nb_0|0;HEAP32[2628>>2]=$747;var $748=HEAP32[2640>>2];var $749=$748;var $750=$749+$nb_0|0;var $751=$750;HEAP32[2640>>2]=$751;var $752=$747|1;var $_sum=$nb_0+4|0;var $753=$749+$_sum|0;var $754=$753;HEAP32[$754>>2]=$752;var $755=$nb_0|3;var $756=$748+4|0;HEAP32[$756>>2]=$755;var $757=$748+8|0;var $758=$757;var $mem_0=$758;label=344;break;case 168:var $760=HEAP32[2584>>2];var $761=($760|0)==0;if($761){label=169;break}else{label=172;break};case 169:var $763=_sysconf(8);var $764=$763-1|0;var $765=$764&$763;var $766=($765|0)==0;if($766){label=171;break}else{label=170;break};case 170:_abort();case 171:HEAP32[2592>>2]=$763;HEAP32[2588>>2]=$763;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $768=_time(0);var $769=$768&-16;var $770=$769^1431655768;HEAP32[2584>>2]=$770;label=172;break;case 172:var $772=$nb_0+48|0;var $773=HEAP32[2592>>2];var $774=$nb_0+47|0;var $775=$773+$774|0;var $776=-$773|0;var $777=$775&$776;var $778=$777>>>0>$nb_0>>>0;if($778){label=173;break}else{var $mem_0=0;label=344;break};case 173:var $780=HEAP32[3056>>2];var $781=($780|0)==0;if($781){label=175;break}else{label=174;break};case 174:var $783=HEAP32[3048>>2];var $784=$783+$777|0;var $785=$784>>>0<=$783>>>0;var $786=$784>>>0>$780>>>0;var $or_cond1_i=$785|$786;if($or_cond1_i){var $mem_0=0;label=344;break}else{label=175;break};case 175:var $788=HEAP32[3060>>2];var $789=$788&4;var $790=($789|0)==0;if($790){label=176;break}else{var $tsize_1_i=0;label=199;break};case 176:var $792=HEAP32[2640>>2];var $793=($792|0)==0;if($793){label=182;break}else{label=177;break};case 177:var $795=$792;var $sp_0_i_i=3064;label=178;break;case 178:var $sp_0_i_i;var $797=$sp_0_i_i|0;var $798=HEAP32[$797>>2];var $799=$798>>>0>$795>>>0;if($799){label=180;break}else{label=179;break};case 179:var $801=$sp_0_i_i+4|0;var $802=HEAP32[$801>>2];var $803=$798+$802|0;var $804=$803>>>0>$795>>>0;if($804){label=181;break}else{label=180;break};case 180:var $806=$sp_0_i_i+8|0;var $807=HEAP32[$806>>2];var $808=($807|0)==0;if($808){label=182;break}else{var $sp_0_i_i=$807;label=178;break};case 181:var $809=($sp_0_i_i|0)==0;if($809){label=182;break}else{label=189;break};case 182:var $810=_sbrk(0);var $811=($810|0)==-1;if($811){var $tsize_0323841_i=0;label=198;break}else{label=183;break};case 183:var $813=$810;var $814=HEAP32[2588>>2];var $815=$814-1|0;var $816=$815&$813;var $817=($816|0)==0;if($817){var $ssize_0_i=$777;label=185;break}else{label=184;break};case 184:var $819=$815+$813|0;var $820=-$814|0;var $821=$819&$820;var $822=$777-$813|0;var $823=$822+$821|0;var $ssize_0_i=$823;label=185;break;case 185:var $ssize_0_i;var $825=HEAP32[3048>>2];var $826=$825+$ssize_0_i|0;var $827=$ssize_0_i>>>0>$nb_0>>>0;var $828=$ssize_0_i>>>0<2147483647;var $or_cond_i31=$827&$828;if($or_cond_i31){label=186;break}else{var $tsize_0323841_i=0;label=198;break};case 186:var $830=HEAP32[3056>>2];var $831=($830|0)==0;if($831){label=188;break}else{label=187;break};case 187:var $833=$826>>>0<=$825>>>0;var $834=$826>>>0>$830>>>0;var $or_cond2_i=$833|$834;if($or_cond2_i){var $tsize_0323841_i=0;label=198;break}else{label=188;break};case 188:var $836=_sbrk($ssize_0_i);var $837=($836|0)==($810|0);var $ssize_0__i=$837?$ssize_0_i:0;var $__i=$837?$810:-1;var $tbase_0_i=$__i;var $tsize_0_i=$ssize_0__i;var $br_0_i=$836;var $ssize_1_i=$ssize_0_i;label=191;break;case 189:var $839=HEAP32[2628>>2];var $840=$775-$839|0;var $841=$840&$776;var $842=$841>>>0<2147483647;if($842){label=190;break}else{var $tsize_0323841_i=0;label=198;break};case 190:var $844=_sbrk($841);var $845=HEAP32[$797>>2];var $846=HEAP32[$801>>2];var $847=$845+$846|0;var $848=($844|0)==($847|0);var $_3_i=$848?$841:0;var $_4_i=$848?$844:-1;var $tbase_0_i=$_4_i;var $tsize_0_i=$_3_i;var $br_0_i=$844;var $ssize_1_i=$841;label=191;break;case 191:var $ssize_1_i;var $br_0_i;var $tsize_0_i;var $tbase_0_i;var $850=-$ssize_1_i|0;var $851=($tbase_0_i|0)==-1;if($851){label=192;break}else{var $tsize_246_i=$tsize_0_i;var $tbase_247_i=$tbase_0_i;label=202;break};case 192:var $853=($br_0_i|0)!=-1;var $854=$ssize_1_i>>>0<2147483647;var $or_cond5_i=$853&$854;var $855=$ssize_1_i>>>0<$772>>>0;var $or_cond6_i=$or_cond5_i&$855;if($or_cond6_i){label=193;break}else{var $ssize_2_i=$ssize_1_i;label=197;break};case 193:var $857=HEAP32[2592>>2];var $858=$774-$ssize_1_i|0;var $859=$858+$857|0;var $860=-$857|0;var $861=$859&$860;var $862=$861>>>0<2147483647;if($862){label=194;break}else{var $ssize_2_i=$ssize_1_i;label=197;break};case 194:var $864=_sbrk($861);var $865=($864|0)==-1;if($865){label=196;break}else{label=195;break};case 195:var $867=$861+$ssize_1_i|0;var $ssize_2_i=$867;label=197;break;case 196:var $869=_sbrk($850);var $tsize_0323841_i=$tsize_0_i;label=198;break;case 197:var $ssize_2_i;var $871=($br_0_i|0)==-1;if($871){var $tsize_0323841_i=$tsize_0_i;label=198;break}else{var $tsize_246_i=$ssize_2_i;var $tbase_247_i=$br_0_i;label=202;break};case 198:var $tsize_0323841_i;var $872=HEAP32[3060>>2];var $873=$872|4;HEAP32[3060>>2]=$873;var $tsize_1_i=$tsize_0323841_i;label=199;break;case 199:var $tsize_1_i;var $875=$777>>>0<2147483647;if($875){label=200;break}else{label=343;break};case 200:var $877=_sbrk($777);var $878=_sbrk(0);var $notlhs_i=($877|0)!=-1;var $notrhs_i=($878|0)!=-1;var $or_cond8_not_i=$notrhs_i&$notlhs_i;var $879=$877>>>0<$878>>>0;var $or_cond9_i=$or_cond8_not_i&$879;if($or_cond9_i){label=201;break}else{label=343;break};case 201:var $880=$878;var $881=$877;var $882=$880-$881|0;var $883=$nb_0+40|0;var $884=$882>>>0>$883>>>0;var $_tsize_1_i=$884?$882:$tsize_1_i;if($884){var $tsize_246_i=$_tsize_1_i;var $tbase_247_i=$877;label=202;break}else{label=343;break};case 202:var $tbase_247_i;var $tsize_246_i;var $885=HEAP32[3048>>2];var $886=$885+$tsize_246_i|0;HEAP32[3048>>2]=$886;var $887=HEAP32[3052>>2];var $888=$886>>>0>$887>>>0;if($888){label=203;break}else{label=204;break};case 203:HEAP32[3052>>2]=$886;label=204;break;case 204:var $890=HEAP32[2640>>2];var $891=($890|0)==0;if($891){label=205;break}else{var $sp_075_i=3064;label=212;break};case 205:var $893=HEAP32[2632>>2];var $894=($893|0)==0;var $895=$tbase_247_i>>>0<$893>>>0;var $or_cond10_i=$894|$895;if($or_cond10_i){label=206;break}else{label=207;break};case 206:HEAP32[2632>>2]=$tbase_247_i;label=207;break;case 207:HEAP32[3064>>2]=$tbase_247_i;HEAP32[3068>>2]=$tsize_246_i;HEAP32[3076>>2]=0;var $897=HEAP32[2584>>2];HEAP32[2652>>2]=$897;HEAP32[2648>>2]=-1;var $i_02_i_i=0;label=208;break;case 208:var $i_02_i_i;var $899=$i_02_i_i<<1;var $900=2656+($899<<2)|0;var $901=$900;var $_sum_i_i=$899+3|0;var $902=2656+($_sum_i_i<<2)|0;HEAP32[$902>>2]=$901;var $_sum1_i_i=$899+2|0;var $903=2656+($_sum1_i_i<<2)|0;HEAP32[$903>>2]=$901;var $904=$i_02_i_i+1|0;var $905=$904>>>0<32;if($905){var $i_02_i_i=$904;label=208;break}else{label=209;break};case 209:var $906=$tsize_246_i-40|0;var $907=$tbase_247_i+8|0;var $908=$907;var $909=$908&7;var $910=($909|0)==0;if($910){var $914=0;label=211;break}else{label=210;break};case 210:var $912=-$908|0;var $913=$912&7;var $914=$913;label=211;break;case 211:var $914;var $915=$tbase_247_i+$914|0;var $916=$915;var $917=$906-$914|0;HEAP32[2640>>2]=$916;HEAP32[2628>>2]=$917;var $918=$917|1;var $_sum_i14_i=$914+4|0;var $919=$tbase_247_i+$_sum_i14_i|0;var $920=$919;HEAP32[$920>>2]=$918;var $_sum2_i_i=$tsize_246_i-36|0;var $921=$tbase_247_i+$_sum2_i_i|0;var $922=$921;HEAP32[$922>>2]=40;var $923=HEAP32[2600>>2];HEAP32[2644>>2]=$923;label=341;break;case 212:var $sp_075_i;var $924=$sp_075_i|0;var $925=HEAP32[$924>>2];var $926=$sp_075_i+4|0;var $927=HEAP32[$926>>2];var $928=$925+$927|0;var $929=($tbase_247_i|0)==($928|0);if($929){label=214;break}else{label=213;break};case 213:var $931=$sp_075_i+8|0;var $932=HEAP32[$931>>2];var $933=($932|0)==0;if($933){label=219;break}else{var $sp_075_i=$932;label=212;break};case 214:var $934=$sp_075_i+12|0;var $935=HEAP32[$934>>2];var $936=$935&8;var $937=($936|0)==0;if($937){label=215;break}else{label=219;break};case 215:var $939=$890;var $940=$939>>>0>=$925>>>0;var $941=$939>>>0<$tbase_247_i>>>0;var $or_cond49_i=$940&$941;if($or_cond49_i){label=216;break}else{label=219;break};case 216:var $943=$927+$tsize_246_i|0;HEAP32[$926>>2]=$943;var $944=HEAP32[2640>>2];var $945=HEAP32[2628>>2];var $946=$945+$tsize_246_i|0;var $947=$944;var $948=$944+8|0;var $949=$948;var $950=$949&7;var $951=($950|0)==0;if($951){var $955=0;label=218;break}else{label=217;break};case 217:var $953=-$949|0;var $954=$953&7;var $955=$954;label=218;break;case 218:var $955;var $956=$947+$955|0;var $957=$956;var $958=$946-$955|0;HEAP32[2640>>2]=$957;HEAP32[2628>>2]=$958;var $959=$958|1;var $_sum_i18_i=$955+4|0;var $960=$947+$_sum_i18_i|0;var $961=$960;HEAP32[$961>>2]=$959;var $_sum2_i19_i=$946+4|0;var $962=$947+$_sum2_i19_i|0;var $963=$962;HEAP32[$963>>2]=40;var $964=HEAP32[2600>>2];HEAP32[2644>>2]=$964;label=341;break;case 219:var $965=HEAP32[2632>>2];var $966=$tbase_247_i>>>0<$965>>>0;if($966){label=220;break}else{label=221;break};case 220:HEAP32[2632>>2]=$tbase_247_i;label=221;break;case 221:var $968=$tbase_247_i+$tsize_246_i|0;var $sp_168_i=3064;label=222;break;case 222:var $sp_168_i;var $970=$sp_168_i|0;var $971=HEAP32[$970>>2];var $972=($971|0)==($968|0);if($972){label=224;break}else{label=223;break};case 223:var $974=$sp_168_i+8|0;var $975=HEAP32[$974>>2];var $976=($975|0)==0;if($976){label=306;break}else{var $sp_168_i=$975;label=222;break};case 224:var $977=$sp_168_i+12|0;var $978=HEAP32[$977>>2];var $979=$978&8;var $980=($979|0)==0;if($980){label=225;break}else{label=306;break};case 225:HEAP32[$970>>2]=$tbase_247_i;var $982=$sp_168_i+4|0;var $983=HEAP32[$982>>2];var $984=$983+$tsize_246_i|0;HEAP32[$982>>2]=$984;var $985=$tbase_247_i+8|0;var $986=$985;var $987=$986&7;var $988=($987|0)==0;if($988){var $993=0;label=227;break}else{label=226;break};case 226:var $990=-$986|0;var $991=$990&7;var $993=$991;label=227;break;case 227:var $993;var $994=$tbase_247_i+$993|0;var $_sum107_i=$tsize_246_i+8|0;var $995=$tbase_247_i+$_sum107_i|0;var $996=$995;var $997=$996&7;var $998=($997|0)==0;if($998){var $1003=0;label=229;break}else{label=228;break};case 228:var $1000=-$996|0;var $1001=$1000&7;var $1003=$1001;label=229;break;case 229:var $1003;var $_sum108_i=$1003+$tsize_246_i|0;var $1004=$tbase_247_i+$_sum108_i|0;var $1005=$1004;var $1006=$1004;var $1007=$994;var $1008=$1006-$1007|0;var $_sum_i21_i=$993+$nb_0|0;var $1009=$tbase_247_i+$_sum_i21_i|0;var $1010=$1009;var $1011=$1008-$nb_0|0;var $1012=$nb_0|3;var $_sum1_i22_i=$993+4|0;var $1013=$tbase_247_i+$_sum1_i22_i|0;var $1014=$1013;HEAP32[$1014>>2]=$1012;var $1015=HEAP32[2640>>2];var $1016=($1005|0)==($1015|0);if($1016){label=230;break}else{label=231;break};case 230:var $1018=HEAP32[2628>>2];var $1019=$1018+$1011|0;HEAP32[2628>>2]=$1019;HEAP32[2640>>2]=$1010;var $1020=$1019|1;var $_sum46_i_i=$_sum_i21_i+4|0;var $1021=$tbase_247_i+$_sum46_i_i|0;var $1022=$1021;HEAP32[$1022>>2]=$1020;label=305;break;case 231:var $1024=HEAP32[2636>>2];var $1025=($1005|0)==($1024|0);if($1025){label=232;break}else{label=233;break};case 232:var $1027=HEAP32[2624>>2];var $1028=$1027+$1011|0;HEAP32[2624>>2]=$1028;HEAP32[2636>>2]=$1010;var $1029=$1028|1;var $_sum44_i_i=$_sum_i21_i+4|0;var $1030=$tbase_247_i+$_sum44_i_i|0;var $1031=$1030;HEAP32[$1031>>2]=$1029;var $_sum45_i_i=$1028+$_sum_i21_i|0;var $1032=$tbase_247_i+$_sum45_i_i|0;var $1033=$1032;HEAP32[$1033>>2]=$1028;label=305;break;case 233:var $_sum2_i23_i=$tsize_246_i+4|0;var $_sum109_i=$_sum2_i23_i+$1003|0;var $1035=$tbase_247_i+$_sum109_i|0;var $1036=$1035;var $1037=HEAP32[$1036>>2];var $1038=$1037&3;var $1039=($1038|0)==1;if($1039){label=234;break}else{var $oldfirst_0_i_i=$1005;var $qsize_0_i_i=$1011;label=281;break};case 234:var $1041=$1037&-8;var $1042=$1037>>>3;var $1043=$1037>>>0<256;if($1043){label=235;break}else{label=247;break};case 235:var $_sum3940_i_i=$1003|8;var $_sum119_i=$_sum3940_i_i+$tsize_246_i|0;var $1045=$tbase_247_i+$_sum119_i|0;var $1046=$1045;var $1047=HEAP32[$1046>>2];var $_sum41_i_i=$tsize_246_i+12|0;var $_sum120_i=$_sum41_i_i+$1003|0;var $1048=$tbase_247_i+$_sum120_i|0;var $1049=$1048;var $1050=HEAP32[$1049>>2];var $1051=$1042<<1;var $1052=2656+($1051<<2)|0;var $1053=$1052;var $1054=($1047|0)==($1053|0);if($1054){label=238;break}else{label=236;break};case 236:var $1056=$1047;var $1057=HEAP32[2632>>2];var $1058=$1056>>>0<$1057>>>0;if($1058){label=246;break}else{label=237;break};case 237:var $1060=$1047+12|0;var $1061=HEAP32[$1060>>2];var $1062=($1061|0)==($1005|0);if($1062){label=238;break}else{label=246;break};case 238:var $1063=($1050|0)==($1047|0);if($1063){label=239;break}else{label=240;break};case 239:var $1065=1<<$1042;var $1066=~$1065;var $1067=HEAP32[2616>>2];var $1068=$1067&$1066;HEAP32[2616>>2]=$1068;label=280;break;case 240:var $1070=($1050|0)==($1053|0);if($1070){label=241;break}else{label=242;break};case 241:var $_pre61_i_i=$1050+8|0;var $_pre_phi62_i_i=$_pre61_i_i;label=244;break;case 242:var $1072=$1050;var $1073=HEAP32[2632>>2];var $1074=$1072>>>0<$1073>>>0;if($1074){label=245;break}else{label=243;break};case 243:var $1076=$1050+8|0;var $1077=HEAP32[$1076>>2];var $1078=($1077|0)==($1005|0);if($1078){var $_pre_phi62_i_i=$1076;label=244;break}else{label=245;break};case 244:var $_pre_phi62_i_i;var $1079=$1047+12|0;HEAP32[$1079>>2]=$1050;HEAP32[$_pre_phi62_i_i>>2]=$1047;label=280;break;case 245:_abort();case 246:_abort();case 247:var $1081=$1004;var $_sum34_i_i=$1003|24;var $_sum110_i=$_sum34_i_i+$tsize_246_i|0;var $1082=$tbase_247_i+$_sum110_i|0;var $1083=$1082;var $1084=HEAP32[$1083>>2];var $_sum5_i_i=$tsize_246_i+12|0;var $_sum111_i=$_sum5_i_i+$1003|0;var $1085=$tbase_247_i+$_sum111_i|0;var $1086=$1085;var $1087=HEAP32[$1086>>2];var $1088=($1087|0)==($1081|0);if($1088){label=253;break}else{label=248;break};case 248:var $_sum3637_i_i=$1003|8;var $_sum112_i=$_sum3637_i_i+$tsize_246_i|0;var $1090=$tbase_247_i+$_sum112_i|0;var $1091=$1090;var $1092=HEAP32[$1091>>2];var $1093=$1092;var $1094=HEAP32[2632>>2];var $1095=$1093>>>0<$1094>>>0;if($1095){label=252;break}else{label=249;break};case 249:var $1097=$1092+12|0;var $1098=HEAP32[$1097>>2];var $1099=($1098|0)==($1081|0);if($1099){label=250;break}else{label=252;break};case 250:var $1101=$1087+8|0;var $1102=HEAP32[$1101>>2];var $1103=($1102|0)==($1081|0);if($1103){label=251;break}else{label=252;break};case 251:HEAP32[$1097>>2]=$1087;HEAP32[$1101>>2]=$1092;var $R_1_i_i=$1087;label=260;break;case 252:_abort();case 253:var $_sum67_i_i=$1003|16;var $_sum117_i=$_sum2_i23_i+$_sum67_i_i|0;var $1106=$tbase_247_i+$_sum117_i|0;var $1107=$1106;var $1108=HEAP32[$1107>>2];var $1109=($1108|0)==0;if($1109){label=254;break}else{var $R_0_i_i=$1108;var $RP_0_i_i=$1107;label=255;break};case 254:var $_sum118_i=$_sum67_i_i+$tsize_246_i|0;var $1111=$tbase_247_i+$_sum118_i|0;var $1112=$1111;var $1113=HEAP32[$1112>>2];var $1114=($1113|0)==0;if($1114){var $R_1_i_i=0;label=260;break}else{var $R_0_i_i=$1113;var $RP_0_i_i=$1112;label=255;break};case 255:var $RP_0_i_i;var $R_0_i_i;var $1115=$R_0_i_i+20|0;var $1116=HEAP32[$1115>>2];var $1117=($1116|0)==0;if($1117){label=256;break}else{var $R_0_i_i=$1116;var $RP_0_i_i=$1115;label=255;break};case 256:var $1119=$R_0_i_i+16|0;var $1120=HEAP32[$1119>>2];var $1121=($1120|0)==0;if($1121){label=257;break}else{var $R_0_i_i=$1120;var $RP_0_i_i=$1119;label=255;break};case 257:var $1123=$RP_0_i_i;var $1124=HEAP32[2632>>2];var $1125=$1123>>>0<$1124>>>0;if($1125){label=259;break}else{label=258;break};case 258:HEAP32[$RP_0_i_i>>2]=0;var $R_1_i_i=$R_0_i_i;label=260;break;case 259:_abort();case 260:var $R_1_i_i;var $1129=($1084|0)==0;if($1129){label=280;break}else{label=261;break};case 261:var $_sum31_i_i=$tsize_246_i+28|0;var $_sum113_i=$_sum31_i_i+$1003|0;var $1131=$tbase_247_i+$_sum113_i|0;var $1132=$1131;var $1133=HEAP32[$1132>>2];var $1134=2920+($1133<<2)|0;var $1135=HEAP32[$1134>>2];var $1136=($1081|0)==($1135|0);if($1136){label=262;break}else{label=264;break};case 262:HEAP32[$1134>>2]=$R_1_i_i;var $cond_i_i=($R_1_i_i|0)==0;if($cond_i_i){label=263;break}else{label=270;break};case 263:var $1138=HEAP32[$1132>>2];var $1139=1<<$1138;var $1140=~$1139;var $1141=HEAP32[2620>>2];var $1142=$1141&$1140;HEAP32[2620>>2]=$1142;label=280;break;case 264:var $1144=$1084;var $1145=HEAP32[2632>>2];var $1146=$1144>>>0<$1145>>>0;if($1146){label=268;break}else{label=265;break};case 265:var $1148=$1084+16|0;var $1149=HEAP32[$1148>>2];var $1150=($1149|0)==($1081|0);if($1150){label=266;break}else{label=267;break};case 266:HEAP32[$1148>>2]=$R_1_i_i;label=269;break;case 267:var $1153=$1084+20|0;HEAP32[$1153>>2]=$R_1_i_i;label=269;break;case 268:_abort();case 269:var $1156=($R_1_i_i|0)==0;if($1156){label=280;break}else{label=270;break};case 270:var $1158=$R_1_i_i;var $1159=HEAP32[2632>>2];var $1160=$1158>>>0<$1159>>>0;if($1160){label=279;break}else{label=271;break};case 271:var $1162=$R_1_i_i+24|0;HEAP32[$1162>>2]=$1084;var $_sum3233_i_i=$1003|16;var $_sum114_i=$_sum3233_i_i+$tsize_246_i|0;var $1163=$tbase_247_i+$_sum114_i|0;var $1164=$1163;var $1165=HEAP32[$1164>>2];var $1166=($1165|0)==0;if($1166){label=275;break}else{label=272;break};case 272:var $1168=$1165;var $1169=HEAP32[2632>>2];var $1170=$1168>>>0<$1169>>>0;if($1170){label=274;break}else{label=273;break};case 273:var $1172=$R_1_i_i+16|0;HEAP32[$1172>>2]=$1165;var $1173=$1165+24|0;HEAP32[$1173>>2]=$R_1_i_i;label=275;break;case 274:_abort();case 275:var $_sum115_i=$_sum2_i23_i+$_sum3233_i_i|0;var $1176=$tbase_247_i+$_sum115_i|0;var $1177=$1176;var $1178=HEAP32[$1177>>2];var $1179=($1178|0)==0;if($1179){label=280;break}else{label=276;break};case 276:var $1181=$1178;var $1182=HEAP32[2632>>2];var $1183=$1181>>>0<$1182>>>0;if($1183){label=278;break}else{label=277;break};case 277:var $1185=$R_1_i_i+20|0;HEAP32[$1185>>2]=$1178;var $1186=$1178+24|0;HEAP32[$1186>>2]=$R_1_i_i;label=280;break;case 278:_abort();case 279:_abort();case 280:var $_sum9_i_i=$1041|$1003;var $_sum116_i=$_sum9_i_i+$tsize_246_i|0;var $1190=$tbase_247_i+$_sum116_i|0;var $1191=$1190;var $1192=$1041+$1011|0;var $oldfirst_0_i_i=$1191;var $qsize_0_i_i=$1192;label=281;break;case 281:var $qsize_0_i_i;var $oldfirst_0_i_i;var $1194=$oldfirst_0_i_i+4|0;var $1195=HEAP32[$1194>>2];var $1196=$1195&-2;HEAP32[$1194>>2]=$1196;var $1197=$qsize_0_i_i|1;var $_sum10_i_i=$_sum_i21_i+4|0;var $1198=$tbase_247_i+$_sum10_i_i|0;var $1199=$1198;HEAP32[$1199>>2]=$1197;var $_sum11_i_i=$qsize_0_i_i+$_sum_i21_i|0;var $1200=$tbase_247_i+$_sum11_i_i|0;var $1201=$1200;HEAP32[$1201>>2]=$qsize_0_i_i;var $1202=$qsize_0_i_i>>>3;var $1203=$qsize_0_i_i>>>0<256;if($1203){label=282;break}else{label=287;break};case 282:var $1205=$1202<<1;var $1206=2656+($1205<<2)|0;var $1207=$1206;var $1208=HEAP32[2616>>2];var $1209=1<<$1202;var $1210=$1208&$1209;var $1211=($1210|0)==0;if($1211){label=283;break}else{label=284;break};case 283:var $1213=$1208|$1209;HEAP32[2616>>2]=$1213;var $_sum27_pre_i_i=$1205+2|0;var $_pre_i24_i=2656+($_sum27_pre_i_i<<2)|0;var $F4_0_i_i=$1207;var $_pre_phi_i25_i=$_pre_i24_i;label=286;break;case 284:var $_sum30_i_i=$1205+2|0;var $1215=2656+($_sum30_i_i<<2)|0;var $1216=HEAP32[$1215>>2];var $1217=$1216;var $1218=HEAP32[2632>>2];var $1219=$1217>>>0<$1218>>>0;if($1219){label=285;break}else{var $F4_0_i_i=$1216;var $_pre_phi_i25_i=$1215;label=286;break};case 285:_abort();case 286:var $_pre_phi_i25_i;var $F4_0_i_i;HEAP32[$_pre_phi_i25_i>>2]=$1010;var $1222=$F4_0_i_i+12|0;HEAP32[$1222>>2]=$1010;var $_sum28_i_i=$_sum_i21_i+8|0;var $1223=$tbase_247_i+$_sum28_i_i|0;var $1224=$1223;HEAP32[$1224>>2]=$F4_0_i_i;var $_sum29_i_i=$_sum_i21_i+12|0;var $1225=$tbase_247_i+$_sum29_i_i|0;var $1226=$1225;HEAP32[$1226>>2]=$1207;label=305;break;case 287:var $1228=$1009;var $1229=$qsize_0_i_i>>>8;var $1230=($1229|0)==0;if($1230){var $I7_0_i_i=0;label=290;break}else{label=288;break};case 288:var $1232=$qsize_0_i_i>>>0>16777215;if($1232){var $I7_0_i_i=31;label=290;break}else{label=289;break};case 289:var $1234=$1229+1048320|0;var $1235=$1234>>>16;var $1236=$1235&8;var $1237=$1229<<$1236;var $1238=$1237+520192|0;var $1239=$1238>>>16;var $1240=$1239&4;var $1241=$1240|$1236;var $1242=$1237<<$1240;var $1243=$1242+245760|0;var $1244=$1243>>>16;var $1245=$1244&2;var $1246=$1241|$1245;var $1247=14-$1246|0;var $1248=$1242<<$1245;var $1249=$1248>>>15;var $1250=$1247+$1249|0;var $1251=$1250<<1;var $1252=$1250+7|0;var $1253=$qsize_0_i_i>>>($1252>>>0);var $1254=$1253&1;var $1255=$1254|$1251;var $I7_0_i_i=$1255;label=290;break;case 290:var $I7_0_i_i;var $1257=2920+($I7_0_i_i<<2)|0;var $_sum12_i26_i=$_sum_i21_i+28|0;var $1258=$tbase_247_i+$_sum12_i26_i|0;var $1259=$1258;HEAP32[$1259>>2]=$I7_0_i_i;var $_sum13_i_i=$_sum_i21_i+16|0;var $1260=$tbase_247_i+$_sum13_i_i|0;var $_sum14_i_i=$_sum_i21_i+20|0;var $1261=$tbase_247_i+$_sum14_i_i|0;var $1262=$1261;HEAP32[$1262>>2]=0;var $1263=$1260;HEAP32[$1263>>2]=0;var $1264=HEAP32[2620>>2];var $1265=1<<$I7_0_i_i;var $1266=$1264&$1265;var $1267=($1266|0)==0;if($1267){label=291;break}else{label=292;break};case 291:var $1269=$1264|$1265;HEAP32[2620>>2]=$1269;HEAP32[$1257>>2]=$1228;var $1270=$1257;var $_sum15_i_i=$_sum_i21_i+24|0;var $1271=$tbase_247_i+$_sum15_i_i|0;var $1272=$1271;HEAP32[$1272>>2]=$1270;var $_sum16_i_i=$_sum_i21_i+12|0;var $1273=$tbase_247_i+$_sum16_i_i|0;var $1274=$1273;HEAP32[$1274>>2]=$1228;var $_sum17_i_i=$_sum_i21_i+8|0;var $1275=$tbase_247_i+$_sum17_i_i|0;var $1276=$1275;HEAP32[$1276>>2]=$1228;label=305;break;case 292:var $1278=HEAP32[$1257>>2];var $1279=($I7_0_i_i|0)==31;if($1279){var $1284=0;label=294;break}else{label=293;break};case 293:var $1281=$I7_0_i_i>>>1;var $1282=25-$1281|0;var $1284=$1282;label=294;break;case 294:var $1284;var $1285=$1278+4|0;var $1286=HEAP32[$1285>>2];var $1287=$1286&-8;var $1288=($1287|0)==($qsize_0_i_i|0);if($1288){var $T_0_lcssa_i28_i=$1278;label=301;break}else{label=295;break};case 295:var $1289=$qsize_0_i_i<<$1284;var $T_055_i_i=$1278;var $K8_056_i_i=$1289;label=297;break;case 296:var $1291=$K8_056_i_i<<1;var $1292=$1299+4|0;var $1293=HEAP32[$1292>>2];var $1294=$1293&-8;var $1295=($1294|0)==($qsize_0_i_i|0);if($1295){var $T_0_lcssa_i28_i=$1299;label=301;break}else{var $T_055_i_i=$1299;var $K8_056_i_i=$1291;label=297;break};case 297:var $K8_056_i_i;var $T_055_i_i;var $1297=$K8_056_i_i>>>31;var $1298=$T_055_i_i+16+($1297<<2)|0;var $1299=HEAP32[$1298>>2];var $1300=($1299|0)==0;if($1300){label=298;break}else{label=296;break};case 298:var $1302=$1298;var $1303=HEAP32[2632>>2];var $1304=$1302>>>0<$1303>>>0;if($1304){label=300;break}else{label=299;break};case 299:HEAP32[$1298>>2]=$1228;var $_sum24_i_i=$_sum_i21_i+24|0;var $1306=$tbase_247_i+$_sum24_i_i|0;var $1307=$1306;HEAP32[$1307>>2]=$T_055_i_i;var $_sum25_i_i=$_sum_i21_i+12|0;var $1308=$tbase_247_i+$_sum25_i_i|0;var $1309=$1308;HEAP32[$1309>>2]=$1228;var $_sum26_i_i=$_sum_i21_i+8|0;var $1310=$tbase_247_i+$_sum26_i_i|0;var $1311=$1310;HEAP32[$1311>>2]=$1228;label=305;break;case 300:_abort();case 301:var $T_0_lcssa_i28_i;var $1313=$T_0_lcssa_i28_i+8|0;var $1314=HEAP32[$1313>>2];var $1315=$T_0_lcssa_i28_i;var $1316=HEAP32[2632>>2];var $1317=$1315>>>0<$1316>>>0;if($1317){label=304;break}else{label=302;break};case 302:var $1319=$1314;var $1320=$1319>>>0<$1316>>>0;if($1320){label=304;break}else{label=303;break};case 303:var $1322=$1314+12|0;HEAP32[$1322>>2]=$1228;HEAP32[$1313>>2]=$1228;var $_sum21_i_i=$_sum_i21_i+8|0;var $1323=$tbase_247_i+$_sum21_i_i|0;var $1324=$1323;HEAP32[$1324>>2]=$1314;var $_sum22_i_i=$_sum_i21_i+12|0;var $1325=$tbase_247_i+$_sum22_i_i|0;var $1326=$1325;HEAP32[$1326>>2]=$T_0_lcssa_i28_i;var $_sum23_i_i=$_sum_i21_i+24|0;var $1327=$tbase_247_i+$_sum23_i_i|0;var $1328=$1327;HEAP32[$1328>>2]=0;label=305;break;case 304:_abort();case 305:var $_sum1819_i_i=$993|8;var $1329=$tbase_247_i+$_sum1819_i_i|0;var $mem_0=$1329;label=344;break;case 306:var $1330=$890;var $sp_0_i_i_i=3064;label=307;break;case 307:var $sp_0_i_i_i;var $1332=$sp_0_i_i_i|0;var $1333=HEAP32[$1332>>2];var $1334=$1333>>>0>$1330>>>0;if($1334){label=309;break}else{label=308;break};case 308:var $1336=$sp_0_i_i_i+4|0;var $1337=HEAP32[$1336>>2];var $1338=$1333+$1337|0;var $1339=$1338>>>0>$1330>>>0;if($1339){label=310;break}else{label=309;break};case 309:var $1341=$sp_0_i_i_i+8|0;var $1342=HEAP32[$1341>>2];var $sp_0_i_i_i=$1342;label=307;break;case 310:var $_sum_i15_i=$1337-47|0;var $_sum1_i16_i=$1337-39|0;var $1343=$1333+$_sum1_i16_i|0;var $1344=$1343;var $1345=$1344&7;var $1346=($1345|0)==0;if($1346){var $1351=0;label=312;break}else{label=311;break};case 311:var $1348=-$1344|0;var $1349=$1348&7;var $1351=$1349;label=312;break;case 312:var $1351;var $_sum2_i17_i=$_sum_i15_i+$1351|0;var $1352=$1333+$_sum2_i17_i|0;var $1353=$890+16|0;var $1354=$1353;var $1355=$1352>>>0<$1354>>>0;var $1356=$1355?$1330:$1352;var $1357=$1356+8|0;var $1358=$1357;var $1359=$tsize_246_i-40|0;var $1360=$tbase_247_i+8|0;var $1361=$1360;var $1362=$1361&7;var $1363=($1362|0)==0;if($1363){var $1367=0;label=314;break}else{label=313;break};case 313:var $1365=-$1361|0;var $1366=$1365&7;var $1367=$1366;label=314;break;case 314:var $1367;var $1368=$tbase_247_i+$1367|0;var $1369=$1368;var $1370=$1359-$1367|0;HEAP32[2640>>2]=$1369;HEAP32[2628>>2]=$1370;var $1371=$1370|1;var $_sum_i_i_i=$1367+4|0;var $1372=$tbase_247_i+$_sum_i_i_i|0;var $1373=$1372;HEAP32[$1373>>2]=$1371;var $_sum2_i_i_i=$tsize_246_i-36|0;var $1374=$tbase_247_i+$_sum2_i_i_i|0;var $1375=$1374;HEAP32[$1375>>2]=40;var $1376=HEAP32[2600>>2];HEAP32[2644>>2]=$1376;var $1377=$1356+4|0;var $1378=$1377;HEAP32[$1378>>2]=27;HEAP32[$1357>>2]=HEAP32[3064>>2];HEAP32[$1357+4>>2]=HEAP32[3068>>2];HEAP32[$1357+8>>2]=HEAP32[3072>>2];HEAP32[$1357+12>>2]=HEAP32[3076>>2];HEAP32[3064>>2]=$tbase_247_i;HEAP32[3068>>2]=$tsize_246_i;HEAP32[3076>>2]=0;HEAP32[3072>>2]=$1358;var $1379=$1356+28|0;var $1380=$1379;HEAP32[$1380>>2]=7;var $1381=$1356+32|0;var $1382=$1381>>>0<$1338>>>0;if($1382){var $1383=$1380;label=315;break}else{label=316;break};case 315:var $1383;var $1384=$1383+4|0;HEAP32[$1384>>2]=7;var $1385=$1383+8|0;var $1386=$1385;var $1387=$1386>>>0<$1338>>>0;if($1387){var $1383=$1384;label=315;break}else{label=316;break};case 316:var $1388=($1356|0)==($1330|0);if($1388){label=341;break}else{label=317;break};case 317:var $1390=$1356;var $1391=$890;var $1392=$1390-$1391|0;var $1393=$1330+$1392|0;var $_sum3_i_i=$1392+4|0;var $1394=$1330+$_sum3_i_i|0;var $1395=$1394;var $1396=HEAP32[$1395>>2];var $1397=$1396&-2;HEAP32[$1395>>2]=$1397;var $1398=$1392|1;var $1399=$890+4|0;HEAP32[$1399>>2]=$1398;var $1400=$1393;HEAP32[$1400>>2]=$1392;var $1401=$1392>>>3;var $1402=$1392>>>0<256;if($1402){label=318;break}else{label=323;break};case 318:var $1404=$1401<<1;var $1405=2656+($1404<<2)|0;var $1406=$1405;var $1407=HEAP32[2616>>2];var $1408=1<<$1401;var $1409=$1407&$1408;var $1410=($1409|0)==0;if($1410){label=319;break}else{label=320;break};case 319:var $1412=$1407|$1408;HEAP32[2616>>2]=$1412;var $_sum11_pre_i_i=$1404+2|0;var $_pre_i_i=2656+($_sum11_pre_i_i<<2)|0;var $F_0_i_i=$1406;var $_pre_phi_i_i=$_pre_i_i;label=322;break;case 320:var $_sum12_i_i=$1404+2|0;var $1414=2656+($_sum12_i_i<<2)|0;var $1415=HEAP32[$1414>>2];var $1416=$1415;var $1417=HEAP32[2632>>2];var $1418=$1416>>>0<$1417>>>0;if($1418){label=321;break}else{var $F_0_i_i=$1415;var $_pre_phi_i_i=$1414;label=322;break};case 321:_abort();case 322:var $_pre_phi_i_i;var $F_0_i_i;HEAP32[$_pre_phi_i_i>>2]=$890;var $1421=$F_0_i_i+12|0;HEAP32[$1421>>2]=$890;var $1422=$890+8|0;HEAP32[$1422>>2]=$F_0_i_i;var $1423=$890+12|0;HEAP32[$1423>>2]=$1406;label=341;break;case 323:var $1425=$890;var $1426=$1392>>>8;var $1427=($1426|0)==0;if($1427){var $I1_0_i_i=0;label=326;break}else{label=324;break};case 324:var $1429=$1392>>>0>16777215;if($1429){var $I1_0_i_i=31;label=326;break}else{label=325;break};case 325:var $1431=$1426+1048320|0;var $1432=$1431>>>16;var $1433=$1432&8;var $1434=$1426<<$1433;var $1435=$1434+520192|0;var $1436=$1435>>>16;var $1437=$1436&4;var $1438=$1437|$1433;var $1439=$1434<<$1437;var $1440=$1439+245760|0;var $1441=$1440>>>16;var $1442=$1441&2;var $1443=$1438|$1442;var $1444=14-$1443|0;var $1445=$1439<<$1442;var $1446=$1445>>>15;var $1447=$1444+$1446|0;var $1448=$1447<<1;var $1449=$1447+7|0;var $1450=$1392>>>($1449>>>0);var $1451=$1450&1;var $1452=$1451|$1448;var $I1_0_i_i=$1452;label=326;break;case 326:var $I1_0_i_i;var $1454=2920+($I1_0_i_i<<2)|0;var $1455=$890+28|0;var $I1_0_c_i_i=$I1_0_i_i;HEAP32[$1455>>2]=$I1_0_c_i_i;var $1456=$890+20|0;HEAP32[$1456>>2]=0;var $1457=$890+16|0;HEAP32[$1457>>2]=0;var $1458=HEAP32[2620>>2];var $1459=1<<$I1_0_i_i;var $1460=$1458&$1459;var $1461=($1460|0)==0;if($1461){label=327;break}else{label=328;break};case 327:var $1463=$1458|$1459;HEAP32[2620>>2]=$1463;HEAP32[$1454>>2]=$1425;var $1464=$890+24|0;var $_c_i_i=$1454;HEAP32[$1464>>2]=$_c_i_i;var $1465=$890+12|0;HEAP32[$1465>>2]=$890;var $1466=$890+8|0;HEAP32[$1466>>2]=$890;label=341;break;case 328:var $1468=HEAP32[$1454>>2];var $1469=($I1_0_i_i|0)==31;if($1469){var $1474=0;label=330;break}else{label=329;break};case 329:var $1471=$I1_0_i_i>>>1;var $1472=25-$1471|0;var $1474=$1472;label=330;break;case 330:var $1474;var $1475=$1468+4|0;var $1476=HEAP32[$1475>>2];var $1477=$1476&-8;var $1478=($1477|0)==($1392|0);if($1478){var $T_0_lcssa_i_i=$1468;label=337;break}else{label=331;break};case 331:var $1479=$1392<<$1474;var $T_014_i_i=$1468;var $K2_015_i_i=$1479;label=333;break;case 332:var $1481=$K2_015_i_i<<1;var $1482=$1489+4|0;var $1483=HEAP32[$1482>>2];var $1484=$1483&-8;var $1485=($1484|0)==($1392|0);if($1485){var $T_0_lcssa_i_i=$1489;label=337;break}else{var $T_014_i_i=$1489;var $K2_015_i_i=$1481;label=333;break};case 333:var $K2_015_i_i;var $T_014_i_i;var $1487=$K2_015_i_i>>>31;var $1488=$T_014_i_i+16+($1487<<2)|0;var $1489=HEAP32[$1488>>2];var $1490=($1489|0)==0;if($1490){label=334;break}else{label=332;break};case 334:var $1492=$1488;var $1493=HEAP32[2632>>2];var $1494=$1492>>>0<$1493>>>0;if($1494){label=336;break}else{label=335;break};case 335:HEAP32[$1488>>2]=$1425;var $1496=$890+24|0;var $T_0_c8_i_i=$T_014_i_i;HEAP32[$1496>>2]=$T_0_c8_i_i;var $1497=$890+12|0;HEAP32[$1497>>2]=$890;var $1498=$890+8|0;HEAP32[$1498>>2]=$890;label=341;break;case 336:_abort();case 337:var $T_0_lcssa_i_i;var $1500=$T_0_lcssa_i_i+8|0;var $1501=HEAP32[$1500>>2];var $1502=$T_0_lcssa_i_i;var $1503=HEAP32[2632>>2];var $1504=$1502>>>0<$1503>>>0;if($1504){label=340;break}else{label=338;break};case 338:var $1506=$1501;var $1507=$1506>>>0<$1503>>>0;if($1507){label=340;break}else{label=339;break};case 339:var $1509=$1501+12|0;HEAP32[$1509>>2]=$1425;HEAP32[$1500>>2]=$1425;var $1510=$890+8|0;var $_c7_i_i=$1501;HEAP32[$1510>>2]=$_c7_i_i;var $1511=$890+12|0;var $T_0_c_i_i=$T_0_lcssa_i_i;HEAP32[$1511>>2]=$T_0_c_i_i;var $1512=$890+24|0;HEAP32[$1512>>2]=0;label=341;break;case 340:_abort();case 341:var $1513=HEAP32[2628>>2];var $1514=$1513>>>0>$nb_0>>>0;if($1514){label=342;break}else{label=343;break};case 342:var $1516=$1513-$nb_0|0;HEAP32[2628>>2]=$1516;var $1517=HEAP32[2640>>2];var $1518=$1517;var $1519=$1518+$nb_0|0;var $1520=$1519;HEAP32[2640>>2]=$1520;var $1521=$1516|1;var $_sum_i34=$nb_0+4|0;var $1522=$1518+$_sum_i34|0;var $1523=$1522;HEAP32[$1523>>2]=$1521;var $1524=$nb_0|3;var $1525=$1517+4|0;HEAP32[$1525>>2]=$1524;var $1526=$1517+8|0;var $1527=$1526;var $mem_0=$1527;label=344;break;case 343:var $1528=___errno_location();HEAP32[$1528>>2]=12;var $mem_0=0;label=344;break;case 344:var $mem_0;return $mem_0}}function _free($mem){var label=0;label=1;while(1)switch(label){case 1:var $1=($mem|0)==0;if($1){label=143;break}else{label=2;break};case 2:var $3=$mem-8|0;var $4=$3;var $5=HEAP32[2632>>2];var $6=$3>>>0<$5>>>0;if($6){label=142;break}else{label=3;break};case 3:var $8=$mem-4|0;var $9=$8;var $10=HEAP32[$9>>2];var $11=$10&3;var $12=($11|0)==1;if($12){label=142;break}else{label=4;break};case 4:var $14=$10&-8;var $_sum=$14-8|0;var $15=$mem+$_sum|0;var $16=$15;var $17=$10&1;var $18=($17|0)==0;if($18){label=5;break}else{var $p_0=$4;var $psize_0=$14;label=56;break};case 5:var $20=$3;var $21=HEAP32[$20>>2];var $22=($11|0)==0;if($22){label=143;break}else{label=6;break};case 6:var $_sum3=-8-$21|0;var $24=$mem+$_sum3|0;var $25=$24;var $26=$21+$14|0;var $27=$24>>>0<$5>>>0;if($27){label=142;break}else{label=7;break};case 7:var $29=HEAP32[2636>>2];var $30=($25|0)==($29|0);if($30){label=54;break}else{label=8;break};case 8:var $32=$21>>>3;var $33=$21>>>0<256;if($33){label=9;break}else{label=21;break};case 9:var $_sum47=$_sum3+8|0;var $35=$mem+$_sum47|0;var $36=$35;var $37=HEAP32[$36>>2];var $_sum48=$_sum3+12|0;var $38=$mem+$_sum48|0;var $39=$38;var $40=HEAP32[$39>>2];var $41=$32<<1;var $42=2656+($41<<2)|0;var $43=$42;var $44=($37|0)==($43|0);if($44){label=12;break}else{label=10;break};case 10:var $46=$37;var $47=$46>>>0<$5>>>0;if($47){label=20;break}else{label=11;break};case 11:var $49=$37+12|0;var $50=HEAP32[$49>>2];var $51=($50|0)==($25|0);if($51){label=12;break}else{label=20;break};case 12:var $52=($40|0)==($37|0);if($52){label=13;break}else{label=14;break};case 13:var $54=1<<$32;var $55=~$54;var $56=HEAP32[2616>>2];var $57=$56&$55;HEAP32[2616>>2]=$57;var $p_0=$25;var $psize_0=$26;label=56;break;case 14:var $59=($40|0)==($43|0);if($59){label=15;break}else{label=16;break};case 15:var $_pre81=$40+8|0;var $_pre_phi82=$_pre81;label=18;break;case 16:var $61=$40;var $62=$61>>>0<$5>>>0;if($62){label=19;break}else{label=17;break};case 17:var $64=$40+8|0;var $65=HEAP32[$64>>2];var $66=($65|0)==($25|0);if($66){var $_pre_phi82=$64;label=18;break}else{label=19;break};case 18:var $_pre_phi82;var $67=$37+12|0;HEAP32[$67>>2]=$40;HEAP32[$_pre_phi82>>2]=$37;var $p_0=$25;var $psize_0=$26;label=56;break;case 19:_abort();case 20:_abort();case 21:var $69=$24;var $_sum37=$_sum3+24|0;var $70=$mem+$_sum37|0;var $71=$70;var $72=HEAP32[$71>>2];var $_sum38=$_sum3+12|0;var $73=$mem+$_sum38|0;var $74=$73;var $75=HEAP32[$74>>2];var $76=($75|0)==($69|0);if($76){label=27;break}else{label=22;break};case 22:var $_sum44=$_sum3+8|0;var $78=$mem+$_sum44|0;var $79=$78;var $80=HEAP32[$79>>2];var $81=$80;var $82=$81>>>0<$5>>>0;if($82){label=26;break}else{label=23;break};case 23:var $84=$80+12|0;var $85=HEAP32[$84>>2];var $86=($85|0)==($69|0);if($86){label=24;break}else{label=26;break};case 24:var $88=$75+8|0;var $89=HEAP32[$88>>2];var $90=($89|0)==($69|0);if($90){label=25;break}else{label=26;break};case 25:HEAP32[$84>>2]=$75;HEAP32[$88>>2]=$80;var $R_1=$75;label=34;break;case 26:_abort();case 27:var $_sum40=$_sum3+20|0;var $93=$mem+$_sum40|0;var $94=$93;var $95=HEAP32[$94>>2];var $96=($95|0)==0;if($96){label=28;break}else{var $R_0=$95;var $RP_0=$94;label=29;break};case 28:var $_sum39=$_sum3+16|0;var $98=$mem+$_sum39|0;var $99=$98;var $100=HEAP32[$99>>2];var $101=($100|0)==0;if($101){var $R_1=0;label=34;break}else{var $R_0=$100;var $RP_0=$99;label=29;break};case 29:var $RP_0;var $R_0;var $102=$R_0+20|0;var $103=HEAP32[$102>>2];var $104=($103|0)==0;if($104){label=30;break}else{var $R_0=$103;var $RP_0=$102;label=29;break};case 30:var $106=$R_0+16|0;var $107=HEAP32[$106>>2];var $108=($107|0)==0;if($108){label=31;break}else{var $R_0=$107;var $RP_0=$106;label=29;break};case 31:var $110=$RP_0;var $111=$110>>>0<$5>>>0;if($111){label=33;break}else{label=32;break};case 32:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=34;break;case 33:_abort();case 34:var $R_1;var $115=($72|0)==0;if($115){var $p_0=$25;var $psize_0=$26;label=56;break}else{label=35;break};case 35:var $_sum41=$_sum3+28|0;var $117=$mem+$_sum41|0;var $118=$117;var $119=HEAP32[$118>>2];var $120=2920+($119<<2)|0;var $121=HEAP32[$120>>2];var $122=($69|0)==($121|0);if($122){label=36;break}else{label=38;break};case 36:HEAP32[$120>>2]=$R_1;var $cond=($R_1|0)==0;if($cond){label=37;break}else{label=44;break};case 37:var $124=HEAP32[$118>>2];var $125=1<<$124;var $126=~$125;var $127=HEAP32[2620>>2];var $128=$127&$126;HEAP32[2620>>2]=$128;var $p_0=$25;var $psize_0=$26;label=56;break;case 38:var $130=$72;var $131=HEAP32[2632>>2];var $132=$130>>>0<$131>>>0;if($132){label=42;break}else{label=39;break};case 39:var $134=$72+16|0;var $135=HEAP32[$134>>2];var $136=($135|0)==($69|0);if($136){label=40;break}else{label=41;break};case 40:HEAP32[$134>>2]=$R_1;label=43;break;case 41:var $139=$72+20|0;HEAP32[$139>>2]=$R_1;label=43;break;case 42:_abort();case 43:var $142=($R_1|0)==0;if($142){var $p_0=$25;var $psize_0=$26;label=56;break}else{label=44;break};case 44:var $144=$R_1;var $145=HEAP32[2632>>2];var $146=$144>>>0<$145>>>0;if($146){label=53;break}else{label=45;break};case 45:var $148=$R_1+24|0;HEAP32[$148>>2]=$72;var $_sum42=$_sum3+16|0;var $149=$mem+$_sum42|0;var $150=$149;var $151=HEAP32[$150>>2];var $152=($151|0)==0;if($152){label=49;break}else{label=46;break};case 46:var $154=$151;var $155=HEAP32[2632>>2];var $156=$154>>>0<$155>>>0;if($156){label=48;break}else{label=47;break};case 47:var $158=$R_1+16|0;HEAP32[$158>>2]=$151;var $159=$151+24|0;HEAP32[$159>>2]=$R_1;label=49;break;case 48:_abort();case 49:var $_sum43=$_sum3+20|0;var $162=$mem+$_sum43|0;var $163=$162;var $164=HEAP32[$163>>2];var $165=($164|0)==0;if($165){var $p_0=$25;var $psize_0=$26;label=56;break}else{label=50;break};case 50:var $167=$164;var $168=HEAP32[2632>>2];var $169=$167>>>0<$168>>>0;if($169){label=52;break}else{label=51;break};case 51:var $171=$R_1+20|0;HEAP32[$171>>2]=$164;var $172=$164+24|0;HEAP32[$172>>2]=$R_1;var $p_0=$25;var $psize_0=$26;label=56;break;case 52:_abort();case 53:_abort();case 54:var $_sum4=$14-4|0;var $176=$mem+$_sum4|0;var $177=$176;var $178=HEAP32[$177>>2];var $179=$178&3;var $180=($179|0)==3;if($180){label=55;break}else{var $p_0=$25;var $psize_0=$26;label=56;break};case 55:HEAP32[2624>>2]=$26;var $182=HEAP32[$177>>2];var $183=$182&-2;HEAP32[$177>>2]=$183;var $184=$26|1;var $_sum35=$_sum3+4|0;var $185=$mem+$_sum35|0;var $186=$185;HEAP32[$186>>2]=$184;var $187=$15;HEAP32[$187>>2]=$26;label=143;break;case 56:var $psize_0;var $p_0;var $189=$p_0;var $190=$189>>>0<$15>>>0;if($190){label=57;break}else{label=142;break};case 57:var $_sum34=$14-4|0;var $192=$mem+$_sum34|0;var $193=$192;var $194=HEAP32[$193>>2];var $195=$194&1;var $phitmp=($195|0)==0;if($phitmp){label=142;break}else{label=58;break};case 58:var $197=$194&2;var $198=($197|0)==0;if($198){label=59;break}else{label=114;break};case 59:var $200=HEAP32[2640>>2];var $201=($16|0)==($200|0);if($201){label=60;break}else{label=64;break};case 60:var $203=HEAP32[2628>>2];var $204=$203+$psize_0|0;HEAP32[2628>>2]=$204;HEAP32[2640>>2]=$p_0;var $205=$204|1;var $206=$p_0+4|0;HEAP32[$206>>2]=$205;var $207=HEAP32[2636>>2];var $208=($p_0|0)==($207|0);if($208){label=61;break}else{label=62;break};case 61:HEAP32[2636>>2]=0;HEAP32[2624>>2]=0;label=62;break;case 62:var $211=HEAP32[2644>>2];var $212=$204>>>0>$211>>>0;if($212){label=63;break}else{label=143;break};case 63:var $214=_sys_trim(0);label=143;break;case 64:var $216=HEAP32[2636>>2];var $217=($16|0)==($216|0);if($217){label=65;break}else{label=66;break};case 65:var $219=HEAP32[2624>>2];var $220=$219+$psize_0|0;HEAP32[2624>>2]=$220;HEAP32[2636>>2]=$p_0;var $221=$220|1;var $222=$p_0+4|0;HEAP32[$222>>2]=$221;var $223=$189+$220|0;var $224=$223;HEAP32[$224>>2]=$220;label=143;break;case 66:var $226=$194&-8;var $227=$226+$psize_0|0;var $228=$194>>>3;var $229=$194>>>0<256;if($229){label=67;break}else{label=79;break};case 67:var $231=$mem+$14|0;var $232=$231;var $233=HEAP32[$232>>2];var $_sum2829=$14|4;var $234=$mem+$_sum2829|0;var $235=$234;var $236=HEAP32[$235>>2];var $237=$228<<1;var $238=2656+($237<<2)|0;var $239=$238;var $240=($233|0)==($239|0);if($240){label=70;break}else{label=68;break};case 68:var $242=$233;var $243=HEAP32[2632>>2];var $244=$242>>>0<$243>>>0;if($244){label=78;break}else{label=69;break};case 69:var $246=$233+12|0;var $247=HEAP32[$246>>2];var $248=($247|0)==($16|0);if($248){label=70;break}else{label=78;break};case 70:var $249=($236|0)==($233|0);if($249){label=71;break}else{label=72;break};case 71:var $251=1<<$228;var $252=~$251;var $253=HEAP32[2616>>2];var $254=$253&$252;HEAP32[2616>>2]=$254;label=112;break;case 72:var $256=($236|0)==($239|0);if($256){label=73;break}else{label=74;break};case 73:var $_pre79=$236+8|0;var $_pre_phi80=$_pre79;label=76;break;case 74:var $258=$236;var $259=HEAP32[2632>>2];var $260=$258>>>0<$259>>>0;if($260){label=77;break}else{label=75;break};case 75:var $262=$236+8|0;var $263=HEAP32[$262>>2];var $264=($263|0)==($16|0);if($264){var $_pre_phi80=$262;label=76;break}else{label=77;break};case 76:var $_pre_phi80;var $265=$233+12|0;HEAP32[$265>>2]=$236;HEAP32[$_pre_phi80>>2]=$233;label=112;break;case 77:_abort();case 78:_abort();case 79:var $267=$15;var $_sum6=$14+16|0;var $268=$mem+$_sum6|0;var $269=$268;var $270=HEAP32[$269>>2];var $_sum78=$14|4;var $271=$mem+$_sum78|0;var $272=$271;var $273=HEAP32[$272>>2];var $274=($273|0)==($267|0);if($274){label=85;break}else{label=80;break};case 80:var $276=$mem+$14|0;var $277=$276;var $278=HEAP32[$277>>2];var $279=$278;var $280=HEAP32[2632>>2];var $281=$279>>>0<$280>>>0;if($281){label=84;break}else{label=81;break};case 81:var $283=$278+12|0;var $284=HEAP32[$283>>2];var $285=($284|0)==($267|0);if($285){label=82;break}else{label=84;break};case 82:var $287=$273+8|0;var $288=HEAP32[$287>>2];var $289=($288|0)==($267|0);if($289){label=83;break}else{label=84;break};case 83:HEAP32[$283>>2]=$273;HEAP32[$287>>2]=$278;var $R7_1=$273;label=92;break;case 84:_abort();case 85:var $_sum10=$14+12|0;var $292=$mem+$_sum10|0;var $293=$292;var $294=HEAP32[$293>>2];var $295=($294|0)==0;if($295){label=86;break}else{var $R7_0=$294;var $RP9_0=$293;label=87;break};case 86:var $_sum9=$14+8|0;var $297=$mem+$_sum9|0;var $298=$297;var $299=HEAP32[$298>>2];var $300=($299|0)==0;if($300){var $R7_1=0;label=92;break}else{var $R7_0=$299;var $RP9_0=$298;label=87;break};case 87:var $RP9_0;var $R7_0;var $301=$R7_0+20|0;var $302=HEAP32[$301>>2];var $303=($302|0)==0;if($303){label=88;break}else{var $R7_0=$302;var $RP9_0=$301;label=87;break};case 88:var $305=$R7_0+16|0;var $306=HEAP32[$305>>2];var $307=($306|0)==0;if($307){label=89;break}else{var $R7_0=$306;var $RP9_0=$305;label=87;break};case 89:var $309=$RP9_0;var $310=HEAP32[2632>>2];var $311=$309>>>0<$310>>>0;if($311){label=91;break}else{label=90;break};case 90:HEAP32[$RP9_0>>2]=0;var $R7_1=$R7_0;label=92;break;case 91:_abort();case 92:var $R7_1;var $315=($270|0)==0;if($315){label=112;break}else{label=93;break};case 93:var $_sum21=$14+20|0;var $317=$mem+$_sum21|0;var $318=$317;var $319=HEAP32[$318>>2];var $320=2920+($319<<2)|0;var $321=HEAP32[$320>>2];var $322=($267|0)==($321|0);if($322){label=94;break}else{label=96;break};case 94:HEAP32[$320>>2]=$R7_1;var $cond69=($R7_1|0)==0;if($cond69){label=95;break}else{label=102;break};case 95:var $324=HEAP32[$318>>2];var $325=1<<$324;var $326=~$325;var $327=HEAP32[2620>>2];var $328=$327&$326;HEAP32[2620>>2]=$328;label=112;break;case 96:var $330=$270;var $331=HEAP32[2632>>2];var $332=$330>>>0<$331>>>0;if($332){label=100;break}else{label=97;break};case 97:var $334=$270+16|0;var $335=HEAP32[$334>>2];var $336=($335|0)==($267|0);if($336){label=98;break}else{label=99;break};case 98:HEAP32[$334>>2]=$R7_1;label=101;break;case 99:var $339=$270+20|0;HEAP32[$339>>2]=$R7_1;label=101;break;case 100:_abort();case 101:var $342=($R7_1|0)==0;if($342){label=112;break}else{label=102;break};case 102:var $344=$R7_1;var $345=HEAP32[2632>>2];var $346=$344>>>0<$345>>>0;if($346){label=111;break}else{label=103;break};case 103:var $348=$R7_1+24|0;HEAP32[$348>>2]=$270;var $_sum22=$14+8|0;var $349=$mem+$_sum22|0;var $350=$349;var $351=HEAP32[$350>>2];var $352=($351|0)==0;if($352){label=107;break}else{label=104;break};case 104:var $354=$351;var $355=HEAP32[2632>>2];var $356=$354>>>0<$355>>>0;if($356){label=106;break}else{label=105;break};case 105:var $358=$R7_1+16|0;HEAP32[$358>>2]=$351;var $359=$351+24|0;HEAP32[$359>>2]=$R7_1;label=107;break;case 106:_abort();case 107:var $_sum23=$14+12|0;var $362=$mem+$_sum23|0;var $363=$362;var $364=HEAP32[$363>>2];var $365=($364|0)==0;if($365){label=112;break}else{label=108;break};case 108:var $367=$364;var $368=HEAP32[2632>>2];var $369=$367>>>0<$368>>>0;if($369){label=110;break}else{label=109;break};case 109:var $371=$R7_1+20|0;HEAP32[$371>>2]=$364;var $372=$364+24|0;HEAP32[$372>>2]=$R7_1;label=112;break;case 110:_abort();case 111:_abort();case 112:var $376=$227|1;var $377=$p_0+4|0;HEAP32[$377>>2]=$376;var $378=$189+$227|0;var $379=$378;HEAP32[$379>>2]=$227;var $380=HEAP32[2636>>2];var $381=($p_0|0)==($380|0);if($381){label=113;break}else{var $psize_1=$227;label=115;break};case 113:HEAP32[2624>>2]=$227;label=143;break;case 114:var $384=$194&-2;HEAP32[$193>>2]=$384;var $385=$psize_0|1;var $386=$p_0+4|0;HEAP32[$386>>2]=$385;var $387=$189+$psize_0|0;var $388=$387;HEAP32[$388>>2]=$psize_0;var $psize_1=$psize_0;label=115;break;case 115:var $psize_1;var $390=$psize_1>>>3;var $391=$psize_1>>>0<256;if($391){label=116;break}else{label=121;break};case 116:var $393=$390<<1;var $394=2656+($393<<2)|0;var $395=$394;var $396=HEAP32[2616>>2];var $397=1<<$390;var $398=$396&$397;var $399=($398|0)==0;if($399){label=117;break}else{label=118;break};case 117:var $401=$396|$397;HEAP32[2616>>2]=$401;var $_sum19_pre=$393+2|0;var $_pre=2656+($_sum19_pre<<2)|0;var $F16_0=$395;var $_pre_phi=$_pre;label=120;break;case 118:var $_sum20=$393+2|0;var $403=2656+($_sum20<<2)|0;var $404=HEAP32[$403>>2];var $405=$404;var $406=HEAP32[2632>>2];var $407=$405>>>0<$406>>>0;if($407){label=119;break}else{var $F16_0=$404;var $_pre_phi=$403;label=120;break};case 119:_abort();case 120:var $_pre_phi;var $F16_0;HEAP32[$_pre_phi>>2]=$p_0;var $410=$F16_0+12|0;HEAP32[$410>>2]=$p_0;var $411=$p_0+8|0;HEAP32[$411>>2]=$F16_0;var $412=$p_0+12|0;HEAP32[$412>>2]=$395;label=143;break;case 121:var $414=$p_0;var $415=$psize_1>>>8;var $416=($415|0)==0;if($416){var $I18_0=0;label=124;break}else{label=122;break};case 122:var $418=$psize_1>>>0>16777215;if($418){var $I18_0=31;label=124;break}else{label=123;break};case 123:var $420=$415+1048320|0;var $421=$420>>>16;var $422=$421&8;var $423=$415<<$422;var $424=$423+520192|0;var $425=$424>>>16;var $426=$425&4;var $427=$426|$422;var $428=$423<<$426;var $429=$428+245760|0;var $430=$429>>>16;var $431=$430&2;var $432=$427|$431;var $433=14-$432|0;var $434=$428<<$431;var $435=$434>>>15;var $436=$433+$435|0;var $437=$436<<1;var $438=$436+7|0;var $439=$psize_1>>>($438>>>0);var $440=$439&1;var $441=$440|$437;var $I18_0=$441;label=124;break;case 124:var $I18_0;var $443=2920+($I18_0<<2)|0;var $444=$p_0+28|0;var $I18_0_c=$I18_0;HEAP32[$444>>2]=$I18_0_c;var $445=$p_0+20|0;HEAP32[$445>>2]=0;var $446=$p_0+16|0;HEAP32[$446>>2]=0;var $447=HEAP32[2620>>2];var $448=1<<$I18_0;var $449=$447&$448;var $450=($449|0)==0;if($450){label=125;break}else{label=126;break};case 125:var $452=$447|$448;HEAP32[2620>>2]=$452;HEAP32[$443>>2]=$414;var $453=$p_0+24|0;var $_c=$443;HEAP32[$453>>2]=$_c;var $454=$p_0+12|0;HEAP32[$454>>2]=$p_0;var $455=$p_0+8|0;HEAP32[$455>>2]=$p_0;label=139;break;case 126:var $457=HEAP32[$443>>2];var $458=($I18_0|0)==31;if($458){var $463=0;label=128;break}else{label=127;break};case 127:var $460=$I18_0>>>1;var $461=25-$460|0;var $463=$461;label=128;break;case 128:var $463;var $464=$457+4|0;var $465=HEAP32[$464>>2];var $466=$465&-8;var $467=($466|0)==($psize_1|0);if($467){var $T_0_lcssa=$457;label=135;break}else{label=129;break};case 129:var $468=$psize_1<<$463;var $T_071=$457;var $K19_072=$468;label=131;break;case 130:var $470=$K19_072<<1;var $471=$478+4|0;var $472=HEAP32[$471>>2];var $473=$472&-8;var $474=($473|0)==($psize_1|0);if($474){var $T_0_lcssa=$478;label=135;break}else{var $T_071=$478;var $K19_072=$470;label=131;break};case 131:var $K19_072;var $T_071;var $476=$K19_072>>>31;var $477=$T_071+16+($476<<2)|0;var $478=HEAP32[$477>>2];var $479=($478|0)==0;if($479){label=132;break}else{label=130;break};case 132:var $481=$477;var $482=HEAP32[2632>>2];var $483=$481>>>0<$482>>>0;if($483){label=134;break}else{label=133;break};case 133:HEAP32[$477>>2]=$414;var $485=$p_0+24|0;var $T_0_c16=$T_071;HEAP32[$485>>2]=$T_0_c16;var $486=$p_0+12|0;HEAP32[$486>>2]=$p_0;var $487=$p_0+8|0;HEAP32[$487>>2]=$p_0;label=139;break;case 134:_abort();case 135:var $T_0_lcssa;var $489=$T_0_lcssa+8|0;var $490=HEAP32[$489>>2];var $491=$T_0_lcssa;var $492=HEAP32[2632>>2];var $493=$491>>>0<$492>>>0;if($493){label=138;break}else{label=136;break};case 136:var $495=$490;var $496=$495>>>0<$492>>>0;if($496){label=138;break}else{label=137;break};case 137:var $498=$490+12|0;HEAP32[$498>>2]=$414;HEAP32[$489>>2]=$414;var $499=$p_0+8|0;var $_c15=$490;HEAP32[$499>>2]=$_c15;var $500=$p_0+12|0;var $T_0_c=$T_0_lcssa;HEAP32[$500>>2]=$T_0_c;var $501=$p_0+24|0;HEAP32[$501>>2]=0;label=139;break;case 138:_abort();case 139:var $503=HEAP32[2648>>2];var $504=$503-1|0;HEAP32[2648>>2]=$504;var $505=($504|0)==0;if($505){var $sp_0_in_i=3072;label=140;break}else{label=143;break};case 140:var $sp_0_in_i;var $sp_0_i=HEAP32[$sp_0_in_i>>2];var $506=($sp_0_i|0)==0;var $507=$sp_0_i+8|0;if($506){label=141;break}else{var $sp_0_in_i=$507;label=140;break};case 141:HEAP32[2648>>2]=-1;label=143;break;case 142:_abort();case 143:return}}function _calloc($n_elements,$elem_size){var label=0;label=1;while(1)switch(label){case 1:var $1=($n_elements|0)==0;if($1){var $req_0=0;label=4;break}else{label=2;break};case 2:var $3=Math.imul($elem_size,$n_elements)|0;var $4=$elem_size|$n_elements;var $5=$4>>>0>65535;if($5){label=3;break}else{var $req_0=$3;label=4;break};case 3:var $7=($3>>>0)/($n_elements>>>0)&-1;var $8=($7|0)==($elem_size|0);var $_=$8?$3:-1;var $req_0=$_;label=4;break;case 4:var $req_0;var $10=_malloc($req_0);var $11=($10|0)==0;if($11){label=7;break}else{label=5;break};case 5:var $13=$10-4|0;var $14=$13;var $15=HEAP32[$14>>2];var $16=$15&3;var $17=($16|0)==0;if($17){label=7;break}else{label=6;break};case 6:_memset($10,0,$req_0);label=7;break;case 7:return $10}}function _realloc($oldmem,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=($oldmem|0)==0;if($1){label=2;break}else{label=3;break};case 2:var $3=_malloc($bytes);var $mem_0=$3;label=11;break;case 3:var $5=$bytes>>>0>4294967231;if($5){label=4;break}else{label=5;break};case 4:var $7=___errno_location();HEAP32[$7>>2]=12;var $mem_0=0;label=11;break;case 5:var $9=$bytes>>>0<11;if($9){var $14=16;label=7;break}else{label=6;break};case 6:var $11=$bytes+11|0;var $12=$11&-8;var $14=$12;label=7;break;case 7:var $14;var $15=$oldmem-8|0;var $16=$15;var $17=_try_realloc_chunk($16,$14);var $18=($17|0)==0;if($18){label=9;break}else{label=8;break};case 8:var $20=$17+8|0;var $21=$20;var $mem_0=$21;label=11;break;case 9:var $23=_malloc($bytes);var $24=($23|0)==0;if($24){var $mem_0=0;label=11;break}else{label=10;break};case 10:var $26=$oldmem-4|0;var $27=$26;var $28=HEAP32[$27>>2];var $29=$28&-8;var $30=$28&3;var $31=($30|0)==0;var $32=$31?8:4;var $33=$29-$32|0;var $34=$33>>>0<$bytes>>>0;var $35=$34?$33:$bytes;_memcpy($23,$oldmem,$35)|0;_free($oldmem);var $mem_0=$23;label=11;break;case 11:var $mem_0;return $mem_0}}function _realloc_in_place($oldmem,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=($oldmem|0)==0;if($1){label=7;break}else{label=2;break};case 2:var $3=$bytes>>>0>4294967231;if($3){label=3;break}else{label=4;break};case 3:var $5=___errno_location();HEAP32[$5>>2]=12;label=7;break;case 4:var $7=$bytes>>>0<11;if($7){var $12=16;label=6;break}else{label=5;break};case 5:var $9=$bytes+11|0;var $10=$9&-8;var $12=$10;label=6;break;case 6:var $12;var $13=$oldmem-8|0;var $14=$13;var $15=_try_realloc_chunk($14,$12);var $16=($15|0)==($14|0);var $oldmem_=$16?$oldmem:0;return $oldmem_;case 7:return 0}}function _memalign($alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=$alignment>>>0<9;if($1){label=2;break}else{label=3;break};case 2:var $3=_malloc($bytes);var $_0=$3;label=4;break;case 3:var $5=_internal_memalign($alignment,$bytes);var $_0=$5;label=4;break;case 4:var $_0;return $_0}}function _internal_memalign($alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=$alignment>>>0<16;var $_alignment=$1?16:$alignment;var $2=$_alignment-1|0;var $3=$2&$_alignment;var $4=($3|0)==0;if($4){var $_1=$_alignment;label=3;break}else{var $a_0=16;label=2;break};case 2:var $a_0;var $5=$a_0>>>0<$_alignment>>>0;var $6=$a_0<<1;if($5){var $a_0=$6;label=2;break}else{var $_1=$a_0;label=3;break};case 3:var $_1;var $7=-64-$_1|0;var $8=$7>>>0>$bytes>>>0;if($8){label=5;break}else{label=4;break};case 4:var $10=___errno_location();HEAP32[$10>>2]=12;var $mem_0=0;label=18;break;case 5:var $12=$bytes>>>0<11;if($12){var $17=16;label=7;break}else{label=6;break};case 6:var $14=$bytes+11|0;var $15=$14&-8;var $17=$15;label=7;break;case 7:var $17;var $18=$_1+12|0;var $19=$18+$17|0;var $20=_malloc($19);var $21=($20|0)==0;if($21){var $mem_0=0;label=18;break}else{label=8;break};case 8:var $23=$20-8|0;var $24=$23;var $25=$20;var $26=$_1-1|0;var $27=$25&$26;var $28=($27|0)==0;if($28){var $p_0=$24;label=14;break}else{label=9;break};case 9:var $30=$20+$26|0;var $31=$30;var $32=-$_1|0;var $33=$31&$32;var $34=$33;var $35=$34-8|0;var $36=$35;var $37=$23;var $38=$36-$37|0;var $39=$38>>>0>15;if($39){var $43=$35;label=11;break}else{label=10;break};case 10:var $_sum3=$_1-8|0;var $41=$34+$_sum3|0;var $43=$41;label=11;break;case 11:var $43;var $44=$43;var $45=$43;var $46=$45-$37|0;var $47=$20-4|0;var $48=$47;var $49=HEAP32[$48>>2];var $50=$49&-8;var $51=$50-$46|0;var $52=$49&3;var $53=($52|0)==0;if($53){label=12;break}else{label=13;break};case 12:var $55=$23;var $56=HEAP32[$55>>2];var $57=$56+$46|0;var $58=$43;HEAP32[$58>>2]=$57;var $59=$43+4|0;var $60=$59;HEAP32[$60>>2]=$51;var $p_0=$44;label=14;break;case 13:var $62=$43+4|0;var $63=$62;var $64=HEAP32[$63>>2];var $65=$64&1;var $66=$51|$65;var $67=$66|2;HEAP32[$63>>2]=$67;var $_sum4=$51+4|0;var $68=$43+$_sum4|0;var $69=$68;var $70=HEAP32[$69>>2];var $71=$70|1;HEAP32[$69>>2]=$71;var $72=HEAP32[$48>>2];var $73=$72&1;var $74=$46|$73;var $75=$74|2;HEAP32[$48>>2]=$75;var $_sum6=$46-4|0;var $76=$20+$_sum6|0;var $77=$76;var $78=HEAP32[$77>>2];var $79=$78|1;HEAP32[$77>>2]=$79;_dispose_chunk($24,$46);var $p_0=$44;label=14;break;case 14:var $p_0;var $81=$p_0+4|0;var $82=HEAP32[$81>>2];var $83=$82&3;var $84=($83|0)==0;if($84){label=17;break}else{label=15;break};case 15:var $86=$82&-8;var $87=$17+16|0;var $88=$86>>>0>$87>>>0;if($88){label=16;break}else{label=17;break};case 16:var $90=$86-$17|0;var $91=$p_0;var $92=$91+$17|0;var $93=$92;var $94=$82&1;var $95=$17|$94;var $96=$95|2;HEAP32[$81>>2]=$96;var $_sum1=$17|4;var $97=$91+$_sum1|0;var $98=$97;var $99=$90|3;HEAP32[$98>>2]=$99;var $_sum2=$86|4;var $100=$91+$_sum2|0;var $101=$100;var $102=HEAP32[$101>>2];var $103=$102|1;HEAP32[$101>>2]=$103;_dispose_chunk($93,$90);label=17;break;case 17:var $105=$p_0+8|0;var $106=$105;var $mem_0=$106;label=18;break;case 18:var $mem_0;return $mem_0}}function _sys_trim($pad){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=$pad>>>0<4294967232;if($13){label=6;break}else{var $released_2=0;label=21;break};case 6:var $15=HEAP32[2640>>2];var $16=($15|0)==0;if($16){var $released_2=0;label=21;break}else{label=7;break};case 7:var $18=$pad+40|0;var $19=HEAP32[2628>>2];var $20=$19>>>0>$18>>>0;if($20){label=8;break}else{label=19;break};case 8:var $22=HEAP32[2592>>2];var $_neg=-40-$pad|0;var $23=$_neg-1|0;var $24=$23+$19|0;var $25=$24+$22|0;var $26=($25>>>0)/($22>>>0)&-1;var $27=$26-1|0;var $28=$15;var $sp_0_i=3064;label=9;break;case 9:var $sp_0_i;var $30=$sp_0_i|0;var $31=HEAP32[$30>>2];var $32=$31>>>0>$28>>>0;if($32){label=11;break}else{label=10;break};case 10:var $34=$sp_0_i+4|0;var $35=HEAP32[$34>>2];var $36=$31+$35|0;var $37=$36>>>0>$28>>>0;if($37){label=12;break}else{label=11;break};case 11:var $39=$sp_0_i+8|0;var $40=HEAP32[$39>>2];var $sp_0_i=$40;label=9;break;case 12:var $41=Math.imul($27,$22)|0;var $42=$sp_0_i+12|0;var $43=HEAP32[$42>>2];var $44=$43&8;var $45=($44|0)==0;if($45){label=13;break}else{label=19;break};case 13:var $47=_sbrk(0);var $48=HEAP32[$30>>2];var $49=HEAP32[$34>>2];var $50=$48+$49|0;var $51=($47|0)==($50|0);if($51){label=14;break}else{label=19;break};case 14:var $53=-2147483648-$22|0;var $54=$41>>>0>2147483646;var $_=$54?$53:$41;var $55=-$_|0;var $56=_sbrk($55);var $57=_sbrk(0);var $58=($56|0)!=-1;var $59=$57>>>0<$47>>>0;var $or_cond=$58&$59;if($or_cond){label=15;break}else{label=19;break};case 15:var $61=$47;var $62=$57;var $63=$61-$62|0;var $64=($47|0)==($57|0);if($64){label=19;break}else{label=16;break};case 16:var $66=HEAP32[$34>>2];var $67=$66-$63|0;HEAP32[$34>>2]=$67;var $68=HEAP32[3048>>2];var $69=$68-$63|0;HEAP32[3048>>2]=$69;var $70=HEAP32[2640>>2];var $71=HEAP32[2628>>2];var $72=$71-$63|0;var $73=$70;var $74=$70+8|0;var $75=$74;var $76=$75&7;var $77=($76|0)==0;if($77){var $82=0;label=18;break}else{label=17;break};case 17:var $79=-$75|0;var $80=$79&7;var $82=$80;label=18;break;case 18:var $82;var $83=$73+$82|0;var $84=$83;var $85=$72-$82|0;HEAP32[2640>>2]=$84;HEAP32[2628>>2]=$85;var $86=$85|1;var $_sum_i=$82+4|0;var $87=$73+$_sum_i|0;var $88=$87;HEAP32[$88>>2]=$86;var $_sum2_i=$72+4|0;var $89=$73+$_sum2_i|0;var $90=$89;HEAP32[$90>>2]=40;var $91=HEAP32[2600>>2];HEAP32[2644>>2]=$91;var $phitmp=($47|0)!=($57|0);var $phitmp8=$phitmp&1;var $released_2=$phitmp8;label=21;break;case 19:var $92=HEAP32[2628>>2];var $93=HEAP32[2644>>2];var $94=$92>>>0>$93>>>0;if($94){label=20;break}else{var $released_2=0;label=21;break};case 20:HEAP32[2644>>2]=-1;var $released_2=0;label=21;break;case 21:var $released_2;return $released_2}}function _try_realloc_chunk($p,$nb){var label=0;label=1;while(1)switch(label){case 1:var $1=$p+4|0;var $2=HEAP32[$1>>2];var $3=$2&-8;var $4=$p;var $5=$4+$3|0;var $6=$5;var $7=HEAP32[2632>>2];var $8=$4>>>0<$7>>>0;if($8){label=72;break}else{label=2;break};case 2:var $10=$2&3;var $11=($10|0)!=1;var $12=$4>>>0<$5>>>0;var $or_cond=$11&$12;if($or_cond){label=3;break}else{label=72;break};case 3:var $_sum3334=$3|4;var $14=$4+$_sum3334|0;var $15=$14;var $16=HEAP32[$15>>2];var $17=$16&1;var $phitmp=($17|0)==0;if($phitmp){label=72;break}else{label=4;break};case 4:var $19=($10|0)==0;if($19){label=5;break}else{label=9;break};case 5:var $21=$nb>>>0<256;if($21){var $newp_0=0;label=73;break}else{label=6;break};case 6:var $23=$nb+4|0;var $24=$3>>>0<$23>>>0;if($24){label=8;break}else{label=7;break};case 7:var $26=$3-$nb|0;var $27=HEAP32[2592>>2];var $28=$27<<1;var $29=$26>>>0>$28>>>0;if($29){label=8;break}else{var $newp_0=$p;label=73;break};case 8:var $newp_0=0;label=73;break;case 9:var $32=$3>>>0<$nb>>>0;if($32){label=12;break}else{label=10;break};case 10:var $34=$3-$nb|0;var $35=$34>>>0>15;if($35){label=11;break}else{var $newp_0=$p;label=73;break};case 11:var $37=$4+$nb|0;var $38=$37;var $39=$2&1;var $40=$39|$nb;var $41=$40|2;HEAP32[$1>>2]=$41;var $_sum29=$nb+4|0;var $42=$4+$_sum29|0;var $43=$42;var $44=$34|3;HEAP32[$43>>2]=$44;var $45=HEAP32[$15>>2];var $46=$45|1;HEAP32[$15>>2]=$46;_dispose_chunk($38,$34);var $newp_0=$p;label=73;break;case 12:var $48=HEAP32[2640>>2];var $49=($6|0)==($48|0);if($49){label=13;break}else{label=15;break};case 13:var $51=HEAP32[2628>>2];var $52=$51+$3|0;var $53=$52>>>0>$nb>>>0;if($53){label=14;break}else{var $newp_0=0;label=73;break};case 14:var $55=$52-$nb|0;var $56=$4+$nb|0;var $57=$56;var $58=$2&1;var $59=$58|$nb;var $60=$59|2;HEAP32[$1>>2]=$60;var $_sum28=$nb+4|0;var $61=$4+$_sum28|0;var $62=$61;var $63=$55|1;HEAP32[$62>>2]=$63;HEAP32[2640>>2]=$57;HEAP32[2628>>2]=$55;var $newp_0=$p;label=73;break;case 15:var $65=HEAP32[2636>>2];var $66=($6|0)==($65|0);if($66){label=16;break}else{label=21;break};case 16:var $68=HEAP32[2624>>2];var $69=$68+$3|0;var $70=$69>>>0<$nb>>>0;if($70){var $newp_0=0;label=73;break}else{label=17;break};case 17:var $72=$69-$nb|0;var $73=$72>>>0>15;if($73){label=18;break}else{label=19;break};case 18:var $75=$4+$nb|0;var $76=$75;var $77=$4+$69|0;var $78=$2&1;var $79=$78|$nb;var $80=$79|2;HEAP32[$1>>2]=$80;var $_sum25=$nb+4|0;var $81=$4+$_sum25|0;var $82=$81;var $83=$72|1;HEAP32[$82>>2]=$83;var $84=$77;HEAP32[$84>>2]=$72;var $_sum26=$69+4|0;var $85=$4+$_sum26|0;var $86=$85;var $87=HEAP32[$86>>2];var $88=$87&-2;HEAP32[$86>>2]=$88;var $storemerge=$76;var $storemerge27=$72;label=20;break;case 19:var $90=$2&1;var $91=$90|$69;var $92=$91|2;HEAP32[$1>>2]=$92;var $_sum23=$69+4|0;var $93=$4+$_sum23|0;var $94=$93;var $95=HEAP32[$94>>2];var $96=$95|1;HEAP32[$94>>2]=$96;var $storemerge=0;var $storemerge27=0;label=20;break;case 20:var $storemerge27;var $storemerge;HEAP32[2624>>2]=$storemerge27;HEAP32[2636>>2]=$storemerge;var $newp_0=$p;label=73;break;case 21:var $99=$16&2;var $100=($99|0)==0;if($100){label=22;break}else{var $newp_0=0;label=73;break};case 22:var $102=$16&-8;var $103=$102+$3|0;var $104=$103>>>0<$nb>>>0;if($104){var $newp_0=0;label=73;break}else{label=23;break};case 23:var $106=$103-$nb|0;var $107=$16>>>3;var $108=$16>>>0<256;if($108){label=24;break}else{label=36;break};case 24:var $_sum17=$3+8|0;var $110=$4+$_sum17|0;var $111=$110;var $112=HEAP32[$111>>2];var $_sum18=$3+12|0;var $113=$4+$_sum18|0;var $114=$113;var $115=HEAP32[$114>>2];var $116=$107<<1;var $117=2656+($116<<2)|0;var $118=$117;var $119=($112|0)==($118|0);if($119){label=27;break}else{label=25;break};case 25:var $121=$112;var $122=$121>>>0<$7>>>0;if($122){label=35;break}else{label=26;break};case 26:var $124=$112+12|0;var $125=HEAP32[$124>>2];var $126=($125|0)==($6|0);if($126){label=27;break}else{label=35;break};case 27:var $127=($115|0)==($112|0);if($127){label=28;break}else{label=29;break};case 28:var $129=1<<$107;var $130=~$129;var $131=HEAP32[2616>>2];var $132=$131&$130;HEAP32[2616>>2]=$132;label=69;break;case 29:var $134=($115|0)==($118|0);if($134){label=30;break}else{label=31;break};case 30:var $_pre=$115+8|0;var $_pre_phi=$_pre;label=33;break;case 31:var $136=$115;var $137=$136>>>0<$7>>>0;if($137){label=34;break}else{label=32;break};case 32:var $139=$115+8|0;var $140=HEAP32[$139>>2];var $141=($140|0)==($6|0);if($141){var $_pre_phi=$139;label=33;break}else{label=34;break};case 33:var $_pre_phi;var $142=$112+12|0;HEAP32[$142>>2]=$115;HEAP32[$_pre_phi>>2]=$112;label=69;break;case 34:_abort();case 35:_abort();case 36:var $144=$5;var $_sum=$3+24|0;var $145=$4+$_sum|0;var $146=$145;var $147=HEAP32[$146>>2];var $_sum2=$3+12|0;var $148=$4+$_sum2|0;var $149=$148;var $150=HEAP32[$149>>2];var $151=($150|0)==($144|0);if($151){label=42;break}else{label=37;break};case 37:var $_sum14=$3+8|0;var $153=$4+$_sum14|0;var $154=$153;var $155=HEAP32[$154>>2];var $156=$155;var $157=$156>>>0<$7>>>0;if($157){label=41;break}else{label=38;break};case 38:var $159=$155+12|0;var $160=HEAP32[$159>>2];var $161=($160|0)==($144|0);if($161){label=39;break}else{label=41;break};case 39:var $163=$150+8|0;var $164=HEAP32[$163>>2];var $165=($164|0)==($144|0);if($165){label=40;break}else{label=41;break};case 40:HEAP32[$159>>2]=$150;HEAP32[$163>>2]=$155;var $R_1=$150;label=49;break;case 41:_abort();case 42:var $_sum4=$3+20|0;var $168=$4+$_sum4|0;var $169=$168;var $170=HEAP32[$169>>2];var $171=($170|0)==0;if($171){label=43;break}else{var $R_0=$170;var $RP_0=$169;label=44;break};case 43:var $_sum3=$3+16|0;var $173=$4+$_sum3|0;var $174=$173;var $175=HEAP32[$174>>2];var $176=($175|0)==0;if($176){var $R_1=0;label=49;break}else{var $R_0=$175;var $RP_0=$174;label=44;break};case 44:var $RP_0;var $R_0;var $177=$R_0+20|0;var $178=HEAP32[$177>>2];var $179=($178|0)==0;if($179){label=45;break}else{var $R_0=$178;var $RP_0=$177;label=44;break};case 45:var $181=$R_0+16|0;var $182=HEAP32[$181>>2];var $183=($182|0)==0;if($183){label=46;break}else{var $R_0=$182;var $RP_0=$181;label=44;break};case 46:var $185=$RP_0;var $186=$185>>>0<$7>>>0;if($186){label=48;break}else{label=47;break};case 47:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=49;break;case 48:_abort();case 49:var $R_1;var $190=($147|0)==0;if($190){label=69;break}else{label=50;break};case 50:var $_sum11=$3+28|0;var $192=$4+$_sum11|0;var $193=$192;var $194=HEAP32[$193>>2];var $195=2920+($194<<2)|0;var $196=HEAP32[$195>>2];var $197=($144|0)==($196|0);if($197){label=51;break}else{label=53;break};case 51:HEAP32[$195>>2]=$R_1;var $cond=($R_1|0)==0;if($cond){label=52;break}else{label=59;break};case 52:var $199=HEAP32[$193>>2];var $200=1<<$199;var $201=~$200;var $202=HEAP32[2620>>2];var $203=$202&$201;HEAP32[2620>>2]=$203;label=69;break;case 53:var $205=$147;var $206=HEAP32[2632>>2];var $207=$205>>>0<$206>>>0;if($207){label=57;break}else{label=54;break};case 54:var $209=$147+16|0;var $210=HEAP32[$209>>2];var $211=($210|0)==($144|0);if($211){label=55;break}else{label=56;break};case 55:HEAP32[$209>>2]=$R_1;label=58;break;case 56:var $214=$147+20|0;HEAP32[$214>>2]=$R_1;label=58;break;case 57:_abort();case 58:var $217=($R_1|0)==0;if($217){label=69;break}else{label=59;break};case 59:var $219=$R_1;var $220=HEAP32[2632>>2];var $221=$219>>>0<$220>>>0;if($221){label=68;break}else{label=60;break};case 60:var $223=$R_1+24|0;HEAP32[$223>>2]=$147;var $_sum12=$3+16|0;var $224=$4+$_sum12|0;var $225=$224;var $226=HEAP32[$225>>2];var $227=($226|0)==0;if($227){label=64;break}else{label=61;break};case 61:var $229=$226;var $230=HEAP32[2632>>2];var $231=$229>>>0<$230>>>0;if($231){label=63;break}else{label=62;break};case 62:var $233=$R_1+16|0;HEAP32[$233>>2]=$226;var $234=$226+24|0;HEAP32[$234>>2]=$R_1;label=64;break;case 63:_abort();case 64:var $_sum13=$3+20|0;var $237=$4+$_sum13|0;var $238=$237;var $239=HEAP32[$238>>2];var $240=($239|0)==0;if($240){label=69;break}else{label=65;break};case 65:var $242=$239;var $243=HEAP32[2632>>2];var $244=$242>>>0<$243>>>0;if($244){label=67;break}else{label=66;break};case 66:var $246=$R_1+20|0;HEAP32[$246>>2]=$239;var $247=$239+24|0;HEAP32[$247>>2]=$R_1;label=69;break;case 67:_abort();case 68:_abort();case 69:var $251=$106>>>0<16;if($251){label=70;break}else{label=71;break};case 70:var $253=HEAP32[$1>>2];var $254=$253&1;var $255=$103|$254;var $256=$255|2;HEAP32[$1>>2]=$256;var $_sum910=$103|4;var $257=$4+$_sum910|0;var $258=$257;var $259=HEAP32[$258>>2];var $260=$259|1;HEAP32[$258>>2]=$260;var $newp_0=$p;label=73;break;case 71:var $262=$4+$nb|0;var $263=$262;var $264=HEAP32[$1>>2];var $265=$264&1;var $266=$265|$nb;var $267=$266|2;HEAP32[$1>>2]=$267;var $_sum5=$nb+4|0;var $268=$4+$_sum5|0;var $269=$268;var $270=$106|3;HEAP32[$269>>2]=$270;var $_sum78=$103|4;var $271=$4+$_sum78|0;var $272=$271;var $273=HEAP32[$272>>2];var $274=$273|1;HEAP32[$272>>2]=$274;_dispose_chunk($263,$106);var $newp_0=$p;label=73;break;case 72:_abort();case 73:var $newp_0;return $newp_0}}function _malloc_footprint(){return HEAP32[3048>>2]}function _malloc_max_footprint(){return HEAP32[3052>>2]}function _malloc_footprint_limit(){var $1=HEAP32[3056>>2];return($1|0)==0?-1:$1}function _malloc_set_footprint_limit($bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=($bytes|0)==-1;if($1){var $result_0=0;label=3;break}else{label=2;break};case 2:var $3=HEAP32[2592>>2];var $4=$bytes-1|0;var $5=$4+$3|0;var $6=-$3|0;var $7=$5&$6;var $result_0=$7;label=3;break;case 3:var $result_0;HEAP32[3056>>2]=$result_0;return $result_0}}function _malloc_usable_size($mem){var label=0;label=1;while(1)switch(label){case 1:var $1=($mem|0)==0;if($1){var $_0=0;label=4;break}else{label=2;break};case 2:var $3=$mem-4|0;var $4=$3;var $5=HEAP32[$4>>2];var $6=$5&3;var $7=($6|0)==1;if($7){var $_0=0;label=4;break}else{label=3;break};case 3:var $9=$5&-8;var $10=($6|0)==0;var $11=$10?8:4;var $12=$9-$11|0;var $_0=$12;label=4;break;case 4:var $_0;return $_0}}function _posix_memalign($pp,$alignment,$bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=($alignment|0)==8;if($1){label=2;break}else{label=3;break};case 2:var $3=_malloc($bytes);var $mem_0=$3;label=7;break;case 3:var $5=$alignment>>>2;var $6=$alignment&3;var $7=($6|0)!=0;var $8=($5|0)==0;var $or_cond=$7|$8;if($or_cond){var $_0=22;label=9;break}else{label=4;break};case 4:var $10=$5+1073741823|0;var $11=$10&$5;var $12=($11|0)==0;if($12){label=5;break}else{var $_0=22;label=9;break};case 5:var $14=-64-$alignment|0;var $15=$14>>>0<$bytes>>>0;if($15){var $_0=12;label=9;break}else{label=6;break};case 6:var $17=$alignment>>>0<16;var $_alignment=$17?16:$alignment;var $18=_internal_memalign($_alignment,$bytes);var $mem_0=$18;label=7;break;case 7:var $mem_0;var $20=($mem_0|0)==0;if($20){var $_0=12;label=9;break}else{label=8;break};case 8:HEAP32[$pp>>2]=$mem_0;var $_0=0;label=9;break;case 9:var $_0;return $_0}}function _independent_calloc($n_elements,$elem_size,$chunks){var sp=STACKTOP;STACKTOP=STACKTOP+8|0;var $sz=sp;HEAP32[$sz>>2]=$elem_size;var $1=_ialloc($n_elements,$sz,3,$chunks);STACKTOP=sp;return $1}function _independent_comalloc($n_elements,$sizes,$chunks){return _ialloc($n_elements,$sizes,0,$chunks)}function _valloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=HEAP32[2588>>2];var $14=_memalign($13,$bytes);return $14}}function _pvalloc($bytes){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=HEAP32[2588>>2];var $14=$bytes-1|0;var $15=$14+$13|0;var $16=-$13|0;var $17=$15&$16;var $18=_memalign($13,$17);return $18}}function _ialloc($n_elements,$sizes,$opts,$chunks){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=($chunks|0)==0;var $14=($n_elements|0)==0;if($13){label=7;break}else{label=6;break};case 6:if($14){var $_0=$chunks;label=31;break}else{var $marray_0=$chunks;var $array_size_0=0;label=11;break};case 7:if($14){label=8;break}else{label=9;break};case 8:var $18=_malloc(0);var $19=$18;var $_0=$19;label=31;break;case 9:var $21=$n_elements<<2;var $22=$21>>>0<11;if($22){var $marray_0=0;var $array_size_0=16;label=11;break}else{label=10;break};case 10:var $24=$21+11|0;var $25=$24&-8;var $marray_0=0;var $array_size_0=$25;label=11;break;case 11:var $array_size_0;var $marray_0;var $27=$opts&1;var $28=($27|0)==0;if($28){label=12;break}else{label=13;break};case 12:if($14){var $element_size_0=0;var $contents_size_1=0;label=19;break}else{var $contents_size_07=0;var $i_08=0;label=16;break};case 13:var $30=HEAP32[$sizes>>2];var $31=$30>>>0<11;if($31){var $36=16;label=15;break}else{label=14;break};case 14:var $33=$30+11|0;var $34=$33&-8;var $36=$34;label=15;break;case 15:var $36;var $37=Math.imul($36,$n_elements)|0;var $element_size_0=$36;var $contents_size_1=$37;label=19;break;case 16:var $i_08;var $contents_size_07;var $38=$sizes+($i_08<<2)|0;var $39=HEAP32[$38>>2];var $40=$39>>>0<11;if($40){var $45=16;label=18;break}else{label=17;break};case 17:var $42=$39+11|0;var $43=$42&-8;var $45=$43;label=18;break;case 18:var $45;var $46=$45+$contents_size_07|0;var $47=$i_08+1|0;var $48=($47|0)==($n_elements|0);if($48){var $element_size_0=0;var $contents_size_1=$46;label=19;break}else{var $contents_size_07=$46;var $i_08=$47;label=16;break};case 19:var $contents_size_1;var $element_size_0;var $49=$array_size_0-4|0;var $50=$49+$contents_size_1|0;var $51=_malloc($50);var $52=($51|0)==0;if($52){var $_0=0;label=31;break}else{label=20;break};case 20:var $54=$51-8|0;var $55=$51-4|0;var $56=$55;var $57=HEAP32[$56>>2];var $58=$57&-8;var $59=$opts&2;var $60=($59|0)==0;if($60){label=22;break}else{label=21;break};case 21:var $62=-4-$array_size_0|0;var $63=$62+$58|0;_memset($51,0,$63);label=22;break;case 22:var $65=($marray_0|0)==0;if($65){label=23;break}else{var $marray_1=$marray_0;var $remainder_size_0=$58;label=24;break};case 23:var $67=$58-$contents_size_1|0;var $68=$51+$contents_size_1|0;var $69=$68;var $70=$67|3;var $_sum2=$contents_size_1-4|0;var $71=$51+$_sum2|0;var $72=$71;HEAP32[$72>>2]=$70;var $marray_1=$69;var $remainder_size_0=$contents_size_1;label=24;break;case 24:var $remainder_size_0;var $marray_1;HEAP32[$marray_1>>2]=$51;var $74=$n_elements-1|0;var $75=($74|0)==0;if($75){var $p_0_in_lcssa=$54;var $remainder_size_1_lcssa=$remainder_size_0;label=30;break}else{label=25;break};case 25:var $76=($element_size_0|0)==0;if($76){var $p_0_in3_us=$54;var $remainder_size_14_us=$remainder_size_0;var $i_15_us=0;label=26;break}else{var $p_0_in3=$54;var $remainder_size_14=$remainder_size_0;var $i_15=0;label=29;break};case 26:var $i_15_us;var $remainder_size_14_us;var $p_0_in3_us;var $77=$sizes+($i_15_us<<2)|0;var $78=HEAP32[$77>>2];var $79=$78>>>0<11;if($79){var $size_0_us=16;label=28;break}else{label=27;break};case 27:var $81=$78+11|0;var $82=$81&-8;var $size_0_us=$82;label=28;break;case 28:var $size_0_us;var $84=$remainder_size_14_us-$size_0_us|0;var $85=$size_0_us|3;var $86=$p_0_in3_us+4|0;var $87=$86;HEAP32[$87>>2]=$85;var $88=$p_0_in3_us+$size_0_us|0;var $89=$i_15_us+1|0;var $_sum11=$size_0_us+8|0;var $90=$p_0_in3_us+$_sum11|0;var $91=$marray_1+($89<<2)|0;HEAP32[$91>>2]=$90;var $92=($89|0)==($74|0);if($92){var $p_0_in_lcssa=$88;var $remainder_size_1_lcssa=$84;label=30;break}else{var $p_0_in3_us=$88;var $remainder_size_14_us=$84;var $i_15_us=$89;label=26;break};case 29:var $i_15;var $remainder_size_14;var $p_0_in3;var $94=$remainder_size_14-$element_size_0|0;var $95=$element_size_0|3;var $96=$p_0_in3+4|0;var $97=$96;HEAP32[$97>>2]=$95;var $98=$p_0_in3+$element_size_0|0;var $99=$i_15+1|0;var $_sum=$element_size_0+8|0;var $100=$p_0_in3+$_sum|0;var $101=$marray_1+($99<<2)|0;HEAP32[$101>>2]=$100;var $102=($99|0)==($74|0);if($102){var $p_0_in_lcssa=$98;var $remainder_size_1_lcssa=$94;label=30;break}else{var $p_0_in3=$98;var $remainder_size_14=$94;var $i_15=$99;label=29;break};case 30:var $remainder_size_1_lcssa;var $p_0_in_lcssa;var $103=$remainder_size_1_lcssa|3;var $104=$p_0_in_lcssa+4|0;var $105=$104;HEAP32[$105>>2]=$103;var $_0=$marray_1;label=31;break;case 31:var $_0;return $_0}}function _bulk_free($array,$nelem){var label=0;label=1;while(1)switch(label){case 1:var $1=$array+($nelem<<2)|0;var $2=($nelem|0)==0;if($2){label=12;break}else{var $a_07_i=$array;label=2;break};case 2:var $a_07_i;var $3=HEAP32[$a_07_i>>2];var $4=($3|0)==0;if($4){label=3;break}else{label=4;break};case 3:var $_pre_i=$a_07_i+4|0;var $_pre_phi_i=$_pre_i;label=11;break;case 4:var $6=$3-8|0;var $7=$6;var $8=$3-4|0;var $9=$8;var $10=HEAP32[$9>>2];var $11=$10&-8;HEAP32[$a_07_i>>2]=0;var $12=HEAP32[2632>>2];var $13=$6>>>0<$12>>>0;if($13){label=10;break}else{label=5;break};case 5:var $15=HEAP32[$9>>2];var $16=$15&3;var $17=($16|0)==1;if($17){label=10;break}else{label=6;break};case 6:var $19=$a_07_i+4|0;var $20=$15-8|0;var $_sum_i=$20&-8;var $21=($19|0)==($1|0);if($21){label=9;break}else{label=7;break};case 7:var $23=HEAP32[$19>>2];var $_sum2_i=$_sum_i+8|0;var $24=$3+$_sum2_i|0;var $25=($23|0)==($24|0);if($25){label=8;break}else{label=9;break};case 8:var $_sum34_i=$_sum_i|4;var $27=$3+$_sum34_i|0;var $28=$27;var $29=HEAP32[$28>>2];var $30=$29&-8;var $31=$30+$11|0;var $32=$15&1;var $33=$32|$31;var $34=$33|2;HEAP32[$9>>2]=$34;var $_sum6_i=$31-4|0;var $35=$3+$_sum6_i|0;var $36=$35;var $37=HEAP32[$36>>2];var $38=$37|1;HEAP32[$36>>2]=$38;HEAP32[$19>>2]=$3;var $_pre_phi_i=$19;label=11;break;case 9:_dispose_chunk($7,$11);var $_pre_phi_i=$19;label=11;break;case 10:_abort();case 11:var $_pre_phi_i;var $41=($_pre_phi_i|0)==($1|0);if($41){label=12;break}else{var $a_07_i=$_pre_phi_i;label=2;break};case 12:var $42=HEAP32[2628>>2];var $43=HEAP32[2644>>2];var $44=$42>>>0>$43>>>0;if($44){label=13;break}else{label=14;break};case 13:var $46=_sys_trim(0);label=14;break;case 14:return 0}}function _malloc_trim($pad){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=_sys_trim($pad);return $13}}function _mallinfo($agg_result){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=HEAP32[2640>>2];var $14=($13|0)==0;if($14){var $nm_sroa_8_0_i=0;var $nm_sroa_0_0_i=0;var $nm_sroa_1_0_i=0;var $nm_sroa_3_0_i=0;var $nm_sroa_4_0_i=0;var $nm_sroa_6_0_i=0;var $nm_sroa_7_0_i=0;label=17;break}else{label=6;break};case 6:var $16=HEAP32[2628>>2];var $17=$16+40|0;var $nfree_08_i=1;var $mfree_09_i=$17;var $sum_010_i=$17;var $s_011_i=3064;label=7;break;case 7:var $s_011_i;var $sum_010_i;var $mfree_09_i;var $nfree_08_i;var $19=$s_011_i|0;var $20=HEAP32[$19>>2];var $21=$20+8|0;var $22=$21;var $23=$22&7;var $24=($23|0)==0;if($24){var $28=0;label=9;break}else{label=8;break};case 8:var $26=-$22|0;var $27=$26&7;var $28=$27;label=9;break;case 9:var $28;var $29=$20+$28|0;var $30=$s_011_i+4|0;var $31=HEAP32[$30>>2];var $32=$20+$31|0;var $nfree_12_i=$nfree_08_i;var $mfree_13_i=$mfree_09_i;var $sum_14_i=$sum_010_i;var $q_0_in5_i=$29;label=10;break;case 10:var $q_0_in5_i;var $sum_14_i;var $mfree_13_i;var $nfree_12_i;var $q_0_i=$q_0_in5_i;var $34=$q_0_in5_i>>>0>=$32>>>0;var $35=($q_0_i|0)==($13|0);var $or_cond_i=$34|$35;if($or_cond_i){var $nfree_1_lcssa_i=$nfree_12_i;var $mfree_1_lcssa_i=$mfree_13_i;var $sum_1_lcssa_i=$sum_14_i;label=15;break}else{label=11;break};case 11:var $37=$q_0_in5_i+4|0;var $38=$37;var $39=HEAP32[$38>>2];var $40=($39|0)==7;if($40){var $nfree_1_lcssa_i=$nfree_12_i;var $mfree_1_lcssa_i=$mfree_13_i;var $sum_1_lcssa_i=$sum_14_i;label=15;break}else{label=12;break};case 12:var $42=$39&-8;var $43=$42+$sum_14_i|0;var $44=$39&3;var $45=($44|0)==1;if($45){label=13;break}else{var $mfree_2_i=$mfree_13_i;var $nfree_2_i=$nfree_12_i;label=14;break};case 13:var $47=$42+$mfree_13_i|0;var $48=$nfree_12_i+1|0;var $mfree_2_i=$47;var $nfree_2_i=$48;label=14;break;case 14:var $nfree_2_i;var $mfree_2_i;var $50=$q_0_in5_i+$42|0;var $51=$50>>>0<$20>>>0;if($51){var $nfree_1_lcssa_i=$nfree_2_i;var $mfree_1_lcssa_i=$mfree_2_i;var $sum_1_lcssa_i=$43;label=15;break}else{var $nfree_12_i=$nfree_2_i;var $mfree_13_i=$mfree_2_i;var $sum_14_i=$43;var $q_0_in5_i=$50;label=10;break};case 15:var $sum_1_lcssa_i;var $mfree_1_lcssa_i;var $nfree_1_lcssa_i;var $52=$s_011_i+8|0;var $53=HEAP32[$52>>2];var $54=($53|0)==0;if($54){label=16;break}else{var $nfree_08_i=$nfree_1_lcssa_i;var $mfree_09_i=$mfree_1_lcssa_i;var $sum_010_i=$sum_1_lcssa_i;var $s_011_i=$53;label=7;break};case 16:var $56=HEAP32[3048>>2];var $57=$56-$sum_1_lcssa_i|0;var $58=HEAP32[3052>>2];var $59=$56-$mfree_1_lcssa_i|0;var $nm_sroa_8_0_i=$16;var $nm_sroa_0_0_i=$sum_1_lcssa_i;var $nm_sroa_1_0_i=$nfree_1_lcssa_i;var $nm_sroa_3_0_i=$57;var $nm_sroa_4_0_i=$58;var $nm_sroa_6_0_i=$59;var $nm_sroa_7_0_i=$mfree_1_lcssa_i;label=17;break;case 17:var $nm_sroa_7_0_i;var $nm_sroa_6_0_i;var $nm_sroa_4_0_i;var $nm_sroa_3_0_i;var $nm_sroa_1_0_i;var $nm_sroa_0_0_i;var $nm_sroa_8_0_i;var $60=$agg_result|0;HEAP32[$60>>2]=$nm_sroa_0_0_i;var $61=$agg_result+4|0;HEAP32[$61>>2]=$nm_sroa_1_0_i;var $62=$agg_result+8|0;var $63=$62;var $$etemp$0$0=0;var $$etemp$0$1=0;var $st$1$0=$63|0;HEAP32[$st$1$0>>2]=$$etemp$0$0;var $st$2$1=$63+4|0;HEAP32[$st$2$1>>2]=$$etemp$0$1;var $64=$agg_result+16|0;HEAP32[$64>>2]=$nm_sroa_3_0_i;var $65=$agg_result+20|0;HEAP32[$65>>2]=$nm_sroa_4_0_i;var $66=$agg_result+24|0;HEAP32[$66>>2]=0;var $67=$agg_result+28|0;HEAP32[$67>>2]=$nm_sroa_6_0_i;var $68=$agg_result+32|0;HEAP32[$68>>2]=$nm_sroa_7_0_i;var $69=$agg_result+36|0;HEAP32[$69>>2]=$nm_sroa_8_0_i;return}}function _malloc_stats(){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:var $13=HEAP32[2640>>2];var $14=($13|0)==0;if($14){var $used_3_i=0;var $fp_0_i=0;var $maxfp_0_i=0;label=14;break}else{label=6;break};case 6:var $16=HEAP32[3052>>2];var $17=HEAP32[3048>>2];var $18=HEAP32[2628>>2];var $_neg2_i=$17-40|0;var $19=$_neg2_i-$18|0;var $used_05_i=$19;var $s_06_i=3064;label=7;break;case 7:var $s_06_i;var $used_05_i;var $21=$s_06_i|0;var $22=HEAP32[$21>>2];var $23=$22+8|0;var $24=$23;var $25=$24&7;var $26=($25|0)==0;if($26){var $30=0;label=9;break}else{label=8;break};case 8:var $28=-$24|0;var $29=$28&7;var $30=$29;label=9;break;case 9:var $30;var $31=$22+$30|0;var $32=$s_06_i+4|0;var $33=HEAP32[$32>>2];var $34=$22+$33|0;var $used_13_i=$used_05_i;var $q_0_in4_i=$31;label=10;break;case 10:var $q_0_in4_i;var $used_13_i;var $q_0_i=$q_0_in4_i;var $36=$q_0_in4_i>>>0>=$34>>>0;var $37=($q_0_i|0)==($13|0);var $or_cond_i=$36|$37;if($or_cond_i){var $used_1_lcssa_i=$used_13_i;label=13;break}else{label=11;break};case 11:var $39=$q_0_in4_i+4|0;var $40=$39;var $41=HEAP32[$40>>2];var $42=($41|0)==7;if($42){var $used_1_lcssa_i=$used_13_i;label=13;break}else{label=12;break};case 12:var $43=$41&3;var $44=($43|0)==1;var $45=$41&-8;var $46=$44?$45:0;var $used_2_i=$used_13_i-$46|0;var $47=$q_0_in4_i+$45|0;var $48=$47>>>0<$22>>>0;if($48){var $used_1_lcssa_i=$used_2_i;label=13;break}else{var $used_13_i=$used_2_i;var $q_0_in4_i=$47;label=10;break};case 13:var $used_1_lcssa_i;var $49=$s_06_i+8|0;var $50=HEAP32[$49>>2];var $51=($50|0)==0;if($51){var $used_3_i=$used_1_lcssa_i;var $fp_0_i=$17;var $maxfp_0_i=$16;label=14;break}else{var $used_05_i=$used_1_lcssa_i;var $s_06_i=$50;label=7;break};case 14:var $maxfp_0_i;var $fp_0_i;var $used_3_i;var $52=HEAP32[_stderr>>2];var $53=_fprintf($52,776,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$maxfp_0_i,tempInt));var $54=HEAP32[_stderr>>2];var $55=_fprintf($54,1152,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$fp_0_i,tempInt));var $56=HEAP32[_stderr>>2];var $57=_fprintf($56,712,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$used_3_i,tempInt));STACKTOP=sp;return}}function _mallopt($param_number,$value){var label=0;label=1;while(1)switch(label){case 1:var $1=HEAP32[2584>>2];var $2=($1|0)==0;if($2){label=2;break}else{label=5;break};case 2:var $4=_sysconf(8);var $5=$4-1|0;var $6=$5&$4;var $7=($6|0)==0;if($7){label=4;break}else{label=3;break};case 3:_abort();case 4:HEAP32[2592>>2]=$4;HEAP32[2588>>2]=$4;HEAP32[2596>>2]=-1;HEAP32[2600>>2]=2097152;HEAP32[2604>>2]=0;HEAP32[3060>>2]=0;var $9=_time(0);var $10=$9&-16;var $11=$10^1431655768;HEAP32[2584>>2]=$11;label=5;break;case 5:if(($param_number|0)==-1){label=6;break}else if(($param_number|0)==-2){label=7;break}else if(($param_number|0)==-3){label=10;break}else{var $_0_i=0;label=11;break};case 6:HEAP32[2600>>2]=$value;var $_0_i=1;label=11;break;case 7:var $15=HEAP32[2588>>2];var $16=$15>>>0>$value>>>0;if($16){var $_0_i=0;label=11;break}else{label=8;break};case 8:var $18=$value-1|0;var $19=$18&$value;var $20=($19|0)==0;if($20){label=9;break}else{var $_0_i=0;label=11;break};case 9:HEAP32[2592>>2]=$value;var $_0_i=1;label=11;break;case 10:HEAP32[2596>>2]=$value;var $_0_i=1;label=11;break;case 11:var $_0_i;return $_0_i}}function __ZSt15get_new_handlerv(){return tempValue=HEAP32[3096>>2],HEAP32[3096>>2]=tempValue+0,tempValue}function _dispose_chunk($p,$psize){var label=0;label=1;while(1)switch(label){case 1:var $1=$p;var $2=$1+$psize|0;var $3=$2;var $4=$p+4|0;var $5=HEAP32[$4>>2];var $6=$5&1;var $7=($6|0)==0;if($7){label=2;break}else{var $_0=$p;var $_02=$psize;label=54;break};case 2:var $9=$p|0;var $10=HEAP32[$9>>2];var $11=$5&3;var $12=($11|0)==0;if($12){label=135;break}else{label=3;break};case 3:var $14=-$10|0;var $15=$1+$14|0;var $16=$15;var $17=$10+$psize|0;var $18=HEAP32[2632>>2];var $19=$15>>>0<$18>>>0;if($19){label=53;break}else{label=4;break};case 4:var $21=HEAP32[2636>>2];var $22=($16|0)==($21|0);if($22){label=51;break}else{label=5;break};case 5:var $24=$10>>>3;var $25=$10>>>0<256;if($25){label=6;break}else{label=18;break};case 6:var $_sum35=8-$10|0;var $27=$1+$_sum35|0;var $28=$27;var $29=HEAP32[$28>>2];var $_sum36=12-$10|0;var $30=$1+$_sum36|0;var $31=$30;var $32=HEAP32[$31>>2];var $33=$24<<1;var $34=2656+($33<<2)|0;var $35=$34;var $36=($29|0)==($35|0);if($36){label=9;break}else{label=7;break};case 7:var $38=$29;var $39=$38>>>0<$18>>>0;if($39){label=17;break}else{label=8;break};case 8:var $41=$29+12|0;var $42=HEAP32[$41>>2];var $43=($42|0)==($16|0);if($43){label=9;break}else{label=17;break};case 9:var $44=($32|0)==($29|0);if($44){label=10;break}else{label=11;break};case 10:var $46=1<<$24;var $47=~$46;var $48=HEAP32[2616>>2];var $49=$48&$47;HEAP32[2616>>2]=$49;var $_0=$16;var $_02=$17;label=54;break;case 11:var $51=($32|0)==($35|0);if($51){label=12;break}else{label=13;break};case 12:var $_pre68=$32+8|0;var $_pre_phi69=$_pre68;label=15;break;case 13:var $53=$32;var $54=$53>>>0<$18>>>0;if($54){label=16;break}else{label=14;break};case 14:var $56=$32+8|0;var $57=HEAP32[$56>>2];var $58=($57|0)==($16|0);if($58){var $_pre_phi69=$56;label=15;break}else{label=16;break};case 15:var $_pre_phi69;var $59=$29+12|0;HEAP32[$59>>2]=$32;HEAP32[$_pre_phi69>>2]=$29;var $_0=$16;var $_02=$17;label=54;break;case 16:_abort();case 17:_abort();case 18:var $61=$15;var $_sum26=24-$10|0;var $62=$1+$_sum26|0;var $63=$62;var $64=HEAP32[$63>>2];var $_sum27=12-$10|0;var $65=$1+$_sum27|0;var $66=$65;var $67=HEAP32[$66>>2];var $68=($67|0)==($61|0);if($68){label=24;break}else{label=19;break};case 19:var $_sum33=8-$10|0;var $70=$1+$_sum33|0;var $71=$70;var $72=HEAP32[$71>>2];var $73=$72;var $74=$73>>>0<$18>>>0;if($74){label=23;break}else{label=20;break};case 20:var $76=$72+12|0;var $77=HEAP32[$76>>2];var $78=($77|0)==($61|0);if($78){label=21;break}else{label=23;break};case 21:var $80=$67+8|0;var $81=HEAP32[$80>>2];var $82=($81|0)==($61|0);if($82){label=22;break}else{label=23;break};case 22:HEAP32[$76>>2]=$67;HEAP32[$80>>2]=$72;var $R_1=$67;label=31;break;case 23:_abort();case 24:var $_sum28=16-$10|0;var $_sum29=$_sum28+4|0;var $85=$1+$_sum29|0;var $86=$85;var $87=HEAP32[$86>>2];var $88=($87|0)==0;if($88){label=25;break}else{var $R_0=$87;var $RP_0=$86;label=26;break};case 25:var $90=$1+$_sum28|0;var $91=$90;var $92=HEAP32[$91>>2];var $93=($92|0)==0;if($93){var $R_1=0;label=31;break}else{var $R_0=$92;var $RP_0=$91;label=26;break};case 26:var $RP_0;var $R_0;var $94=$R_0+20|0;var $95=HEAP32[$94>>2];var $96=($95|0)==0;if($96){label=27;break}else{var $R_0=$95;var $RP_0=$94;label=26;break};case 27:var $98=$R_0+16|0;var $99=HEAP32[$98>>2];var $100=($99|0)==0;if($100){label=28;break}else{var $R_0=$99;var $RP_0=$98;label=26;break};case 28:var $102=$RP_0;var $103=$102>>>0<$18>>>0;if($103){label=30;break}else{label=29;break};case 29:HEAP32[$RP_0>>2]=0;var $R_1=$R_0;label=31;break;case 30:_abort();case 31:var $R_1;var $107=($64|0)==0;if($107){var $_0=$16;var $_02=$17;label=54;break}else{label=32;break};case 32:var $_sum30=28-$10|0;var $109=$1+$_sum30|0;var $110=$109;var $111=HEAP32[$110>>2];var $112=2920+($111<<2)|0;var $113=HEAP32[$112>>2];var $114=($61|0)==($113|0);if($114){label=33;break}else{label=35;break};case 33:HEAP32[$112>>2]=$R_1;var $cond=($R_1|0)==0;if($cond){label=34;break}else{label=41;break};case 34:var $116=HEAP32[$110>>2];var $117=1<<$116;var $118=~$117;var $119=HEAP32[2620>>2];var $120=$119&$118;HEAP32[2620>>2]=$120;var $_0=$16;var $_02=$17;label=54;break;case 35:var $122=$64;var $123=HEAP32[2632>>2];var $124=$122>>>0<$123>>>0;if($124){label=39;break}else{label=36;break};case 36:var $126=$64+16|0;var $127=HEAP32[$126>>2];var $128=($127|0)==($61|0);if($128){label=37;break}else{label=38;break};case 37:HEAP32[$126>>2]=$R_1;label=40;break;case 38:var $131=$64+20|0;HEAP32[$131>>2]=$R_1;label=40;break;case 39:_abort();case 40:var $134=($R_1|0)==0;if($134){var $_0=$16;var $_02=$17;label=54;break}else{label=41;break};case 41:var $136=$R_1;var $137=HEAP32[2632>>2];var $138=$136>>>0<$137>>>0;if($138){label=50;break}else{label=42;break};case 42:var $140=$R_1+24|0;HEAP32[$140>>2]=$64;var $_sum31=16-$10|0;var $141=$1+$_sum31|0;var $142=$141;var $143=HEAP32[$142>>2];var $144=($143|0)==0;if($144){label=46;break}else{label=43;break};case 43:var $146=$143;var $147=HEAP32[2632>>2];var $148=$146>>>0<$147>>>0;if($148){label=45;break}else{label=44;break};case 44:var $150=$R_1+16|0;HEAP32[$150>>2]=$143;var $151=$143+24|0;HEAP32[$151>>2]=$R_1;label=46;break;case 45:_abort();case 46:var $_sum32=$_sum31+4|0;var $154=$1+$_sum32|0;var $155=$154;var $156=HEAP32[$155>>2];var $157=($156|0)==0;if($157){var $_0=$16;var $_02=$17;label=54;break}else{label=47;break};case 47:var $159=$156;var $160=HEAP32[2632>>2];var $161=$159>>>0<$160>>>0;if($161){label=49;break}else{label=48;break};case 48:var $163=$R_1+20|0;HEAP32[$163>>2]=$156;var $164=$156+24|0;HEAP32[$164>>2]=$R_1;var $_0=$16;var $_02=$17;label=54;break;case 49:_abort();case 50:_abort();case 51:var $_sum=$psize+4|0;var $168=$1+$_sum|0;var $169=$168;var $170=HEAP32[$169>>2];var $171=$170&3;var $172=($171|0)==3;if($172){label=52;break}else{var $_0=$16;var $_02=$17;label=54;break};case 52:HEAP32[2624>>2]=$17;var $174=HEAP32[$169>>2];var $175=$174&-2;HEAP32[$169>>2]=$175;var $176=$17|1;var $_sum24=4-$10|0;var $177=$1+$_sum24|0;var $178=$177;HEAP32[$178>>2]=$176;var $179=$2;HEAP32[$179>>2]=$17;label=135;break;case 53:_abort();case 54:var $_02;var $_0;var $181=HEAP32[2632>>2];var $182=$2>>>0<$181>>>0;if($182){label=134;break}else{label=55;break};case 55:var $_sum1=$psize+4|0;var $184=$1+$_sum1|0;var $185=$184;var $186=HEAP32[$185>>2];var $187=$186&2;var $188=($187|0)==0;if($188){label=56;break}else{label=109;break};case 56:var $190=HEAP32[2640>>2];var $191=($3|0)==($190|0);if($191){label=57;break}else{label=59;break};case 57:var $193=HEAP32[2628>>2];var $194=$193+$_02|0;HEAP32[2628>>2]=$194;HEAP32[2640>>2]=$_0;var $195=$194|1;var $196=$_0+4|0;HEAP32[$196>>2]=$195;var $197=HEAP32[2636>>2];var $198=($_0|0)==($197|0);if($198){label=58;break}else{label=135;break};case 58:HEAP32[2636>>2]=0;HEAP32[2624>>2]=0;label=135;break;case 59:var $201=HEAP32[2636>>2];var $202=($3|0)==($201|0);if($202){label=60;break}else{label=61;break};case 60:var $204=HEAP32[2624>>2];var $205=$204+$_02|0;HEAP32[2624>>2]=$205;HEAP32[2636>>2]=$_0;var $206=$205|1;var $207=$_0+4|0;HEAP32[$207>>2]=$206;var $208=$_0;var $209=$208+$205|0;var $210=$209;HEAP32[$210>>2]=$205;label=135;break;case 61:var $212=$186&-8;var $213=$212+$_02|0;var $214=$186>>>3;var $215=$186>>>0<256;if($215){label=62;break}else{label=74;break};case 62:var $_sum20=$psize+8|0;var $217=$1+$_sum20|0;var $218=$217;var $219=HEAP32[$218>>2];var $_sum21=$psize+12|0;var $220=$1+$_sum21|0;var $221=$220;var $222=HEAP32[$221>>2];var $223=$214<<1;var $224=2656+($223<<2)|0;var $225=$224;var $226=($219|0)==($225|0);if($226){label=65;break}else{label=63;break};case 63:var $228=$219;var $229=$228>>>0<$181>>>0;if($229){label=73;break}else{label=64;break};case 64:var $231=$219+12|0;var $232=HEAP32[$231>>2];var $233=($232|0)==($3|0);if($233){label=65;break}else{label=73;break};case 65:var $234=($222|0)==($219|0);if($234){label=66;break}else{label=67;break};case 66:var $236=1<<$214;var $237=~$236;var $238=HEAP32[2616>>2];var $239=$238&$237;HEAP32[2616>>2]=$239;label=107;break;case 67:var $241=($222|0)==($225|0);if($241){label=68;break}else{label=69;break};case 68:var $_pre66=$222+8|0;var $_pre_phi67=$_pre66;label=71;break;case 69:var $243=$222;var $244=$243>>>0<$181>>>0;if($244){label=72;break}else{label=70;break};case 70:var $246=$222+8|0;var $247=HEAP32[$246>>2];var $248=($247|0)==($3|0);if($248){var $_pre_phi67=$246;label=71;break}else{label=72;break};case 71:var $_pre_phi67;var $249=$219+12|0;HEAP32[$249>>2]=$222;HEAP32[$_pre_phi67>>2]=$219;label=107;break;case 72:_abort();case 73:_abort();case 74:var $251=$2;var $_sum2=$psize+24|0;var $252=$1+$_sum2|0;var $253=$252;var $254=HEAP32[$253>>2];var $_sum3=$psize+12|0;var $255=$1+$_sum3|0;var $256=$255;var $257=HEAP32[$256>>2];var $258=($257|0)==($251|0);if($258){label=80;break}else{label=75;break};case 75:var $_sum18=$psize+8|0;var $260=$1+$_sum18|0;var $261=$260;var $262=HEAP32[$261>>2];var $263=$262;var $264=$263>>>0<$181>>>0;if($264){label=79;break}else{label=76;break};case 76:var $266=$262+12|0;var $267=HEAP32[$266>>2];var $268=($267|0)==($251|0);if($268){label=77;break}else{label=79;break};case 77:var $270=$257+8|0;var $271=HEAP32[$270>>2];var $272=($271|0)==($251|0);if($272){label=78;break}else{label=79;break};case 78:HEAP32[$266>>2]=$257;HEAP32[$270>>2]=$262;var $R7_1=$257;label=87;break;case 79:_abort();case 80:var $_sum5=$psize+20|0;var $275=$1+$_sum5|0;var $276=$275;var $277=HEAP32[$276>>2];var $278=($277|0)==0;if($278){label=81;break}else{var $R7_0=$277;var $RP9_0=$276;label=82;break};case 81:var $_sum4=$psize+16|0;var $280=$1+$_sum4|0;var $281=$280;var $282=HEAP32[$281>>2];var $283=($282|0)==0;if($283){var $R7_1=0;label=87;break}else{var $R7_0=$282;var $RP9_0=$281;label=82;break};case 82:var $RP9_0;var $R7_0;var $284=$R7_0+20|0;var $285=HEAP32[$284>>2];var $286=($285|0)==0;if($286){label=83;break}else{var $R7_0=$285;var $RP9_0=$284;label=82;break};case 83:var $288=$R7_0+16|0;var $289=HEAP32[$288>>2];var $290=($289|0)==0;if($290){label=84;break}else{var $R7_0=$289;var $RP9_0=$288;label=82;break};case 84:var $292=$RP9_0;var $293=$292>>>0<$181>>>0;if($293){label=86;break}else{label=85;break};case 85:HEAP32[$RP9_0>>2]=0;var $R7_1=$R7_0;label=87;break;case 86:_abort();case 87:var $R7_1;var $297=($254|0)==0;if($297){label=107;break}else{label=88;break};case 88:var $_sum15=$psize+28|0;var $299=$1+$_sum15|0;var $300=$299;var $301=HEAP32[$300>>2];var $302=2920+($301<<2)|0;var $303=HEAP32[$302>>2];var $304=($251|0)==($303|0);if($304){label=89;break}else{label=91;break};case 89:HEAP32[$302>>2]=$R7_1;var $cond53=($R7_1|0)==0;if($cond53){label=90;break}else{label=97;break};case 90:var $306=HEAP32[$300>>2];var $307=1<<$306;var $308=~$307;var $309=HEAP32[2620>>2];var $310=$309&$308;HEAP32[2620>>2]=$310;label=107;break;case 91:var $312=$254;var $313=HEAP32[2632>>2];var $314=$312>>>0<$313>>>0;if($314){label=95;break}else{label=92;break};case 92:var $316=$254+16|0;var $317=HEAP32[$316>>2];var $318=($317|0)==($251|0);if($318){label=93;break}else{label=94;break};case 93:HEAP32[$316>>2]=$R7_1;label=96;break;case 94:var $321=$254+20|0;HEAP32[$321>>2]=$R7_1;label=96;break;case 95:_abort();case 96:var $324=($R7_1|0)==0;if($324){label=107;break}else{label=97;break};case 97:var $326=$R7_1;var $327=HEAP32[2632>>2];var $328=$326>>>0<$327>>>0;if($328){label=106;break}else{label=98;break};case 98:var $330=$R7_1+24|0;HEAP32[$330>>2]=$254;var $_sum16=$psize+16|0;var $331=$1+$_sum16|0;var $332=$331;var $333=HEAP32[$332>>2];var $334=($333|0)==0;if($334){label=102;break}else{label=99;break};case 99:var $336=$333;var $337=HEAP32[2632>>2];var $338=$336>>>0<$337>>>0;if($338){label=101;break}else{label=100;break};case 100:var $340=$R7_1+16|0;HEAP32[$340>>2]=$333;var $341=$333+24|0;HEAP32[$341>>2]=$R7_1;label=102;break;case 101:_abort();case 102:var $_sum17=$psize+20|0;var $344=$1+$_sum17|0;var $345=$344;var $346=HEAP32[$345>>2];var $347=($346|0)==0;if($347){label=107;break}else{label=103;break};case 103:var $349=$346;var $350=HEAP32[2632>>2];var $351=$349>>>0<$350>>>0;if($351){label=105;break}else{label=104;break};case 104:var $353=$R7_1+20|0;HEAP32[$353>>2]=$346;var $354=$346+24|0;HEAP32[$354>>2]=$R7_1;label=107;break;case 105:_abort();case 106:_abort();case 107:var $358=$213|1;var $359=$_0+4|0;HEAP32[$359>>2]=$358;var $360=$_0;var $361=$360+$213|0;var $362=$361;HEAP32[$362>>2]=$213;var $363=HEAP32[2636>>2];var $364=($_0|0)==($363|0);if($364){label=108;break}else{var $_1=$213;label=110;break};case 108:HEAP32[2624>>2]=$213;label=135;break;case 109:var $367=$186&-2;HEAP32[$185>>2]=$367;var $368=$_02|1;var $369=$_0+4|0;HEAP32[$369>>2]=$368;var $370=$_0;var $371=$370+$_02|0;var $372=$371;HEAP32[$372>>2]=$_02;var $_1=$_02;label=110;break;case 110:var $_1;var $374=$_1>>>3;var $375=$_1>>>0<256;if($375){label=111;break}else{label=116;break};case 111:var $377=$374<<1;var $378=2656+($377<<2)|0;var $379=$378;var $380=HEAP32[2616>>2];var $381=1<<$374;var $382=$380&$381;var $383=($382|0)==0;if($383){label=112;break}else{label=113;break};case 112:var $385=$380|$381;HEAP32[2616>>2]=$385;var $_sum13_pre=$377+2|0;var $_pre=2656+($_sum13_pre<<2)|0;var $F16_0=$379;var $_pre_phi=$_pre;label=115;break;case 113:var $_sum14=$377+2|0;var $387=2656+($_sum14<<2)|0;var $388=HEAP32[$387>>2];var $389=$388;var $390=HEAP32[2632>>2];var $391=$389>>>0<$390>>>0;if($391){label=114;break}else{var $F16_0=$388;var $_pre_phi=$387;label=115;break};case 114:_abort();case 115:var $_pre_phi;var $F16_0;HEAP32[$_pre_phi>>2]=$_0;var $394=$F16_0+12|0;HEAP32[$394>>2]=$_0;var $395=$_0+8|0;HEAP32[$395>>2]=$F16_0;var $396=$_0+12|0;HEAP32[$396>>2]=$379;label=135;break;case 116:var $398=$_0;var $399=$_1>>>8;var $400=($399|0)==0;if($400){var $I19_0=0;label=119;break}else{label=117;break};case 117:var $402=$_1>>>0>16777215;if($402){var $I19_0=31;label=119;break}else{label=118;break};case 118:var $404=$399+1048320|0;var $405=$404>>>16;var $406=$405&8;var $407=$399<<$406;var $408=$407+520192|0;var $409=$408>>>16;var $410=$409&4;var $411=$410|$406;var $412=$407<<$410;var $413=$412+245760|0;var $414=$413>>>16;var $415=$414&2;var $416=$411|$415;var $417=14-$416|0;var $418=$412<<$415;var $419=$418>>>15;var $420=$417+$419|0;var $421=$420<<1;var $422=$420+7|0;var $423=$_1>>>($422>>>0);var $424=$423&1;var $425=$424|$421;var $I19_0=$425;label=119;break;case 119:var $I19_0;var $427=2920+($I19_0<<2)|0;var $428=$_0+28|0;var $I19_0_c=$I19_0;HEAP32[$428>>2]=$I19_0_c;var $429=$_0+20|0;HEAP32[$429>>2]=0;var $430=$_0+16|0;HEAP32[$430>>2]=0;var $431=HEAP32[2620>>2];var $432=1<<$I19_0;var $433=$431&$432;var $434=($433|0)==0;if($434){label=120;break}else{label=121;break};case 120:var $436=$431|$432;HEAP32[2620>>2]=$436;HEAP32[$427>>2]=$398;var $437=$_0+24|0;var $_c=$427;HEAP32[$437>>2]=$_c;var $438=$_0+12|0;HEAP32[$438>>2]=$_0;var $439=$_0+8|0;HEAP32[$439>>2]=$_0;label=135;break;case 121:var $441=HEAP32[$427>>2];var $442=($I19_0|0)==31;if($442){var $447=0;label=123;break}else{label=122;break};case 122:var $444=$I19_0>>>1;var $445=25-$444|0;var $447=$445;label=123;break;case 123:var $447;var $448=$441+4|0;var $449=HEAP32[$448>>2];var $450=$449&-8;var $451=($450|0)==($_1|0);if($451){var $T_0_lcssa=$441;label=130;break}else{label=124;break};case 124:var $452=$_1<<$447;var $T_055=$441;var $K20_056=$452;label=126;break;case 125:var $454=$K20_056<<1;var $455=$462+4|0;var $456=HEAP32[$455>>2];var $457=$456&-8;var $458=($457|0)==($_1|0);if($458){var $T_0_lcssa=$462;label=130;break}else{var $T_055=$462;var $K20_056=$454;label=126;break};case 126:var $K20_056;var $T_055;var $460=$K20_056>>>31;var $461=$T_055+16+($460<<2)|0;var $462=HEAP32[$461>>2];var $463=($462|0)==0;if($463){label=127;break}else{label=125;break};case 127:var $465=$461;var $466=HEAP32[2632>>2];var $467=$465>>>0<$466>>>0;if($467){label=129;break}else{label=128;break};case 128:HEAP32[$461>>2]=$398;var $469=$_0+24|0;var $T_0_c10=$T_055;HEAP32[$469>>2]=$T_0_c10;var $470=$_0+12|0;HEAP32[$470>>2]=$_0;var $471=$_0+8|0;HEAP32[$471>>2]=$_0;label=135;break;case 129:_abort();case 130:var $T_0_lcssa;var $473=$T_0_lcssa+8|0;var $474=HEAP32[$473>>2];var $475=$T_0_lcssa;var $476=HEAP32[2632>>2];var $477=$475>>>0<$476>>>0;if($477){label=133;break}else{label=131;break};case 131:var $479=$474;var $480=$479>>>0<$476>>>0;if($480){label=133;break}else{label=132;break};case 132:var $482=$474+12|0;HEAP32[$482>>2]=$398;HEAP32[$473>>2]=$398;var $483=$_0+8|0;var $_c9=$474;HEAP32[$483>>2]=$_c9;var $484=$_0+12|0;var $T_0_c=$T_0_lcssa;HEAP32[$484>>2]=$T_0_c;var $485=$_0+24|0;HEAP32[$485>>2]=0;label=135;break;case 133:_abort();case 134:_abort();case 135:return}}function __Znwj($size){var label=0;label=1;while(1)switch(label){case 1:var $1=($size|0)==0;var $_size=$1?1:$size;label=2;break;case 2:var $3=_malloc($_size);var $4=($3|0)==0;if($4){label=3;break}else{label=10;break};case 3:var $6=(tempValue=HEAP32[3096>>2],HEAP32[3096>>2]=tempValue+0,tempValue);var $7=($6|0)==0;if($7){label=9;break}else{label=4;break};case 4:var $9=$6;FUNCTION_TABLE[$9]();label=2;break;case 5:var $lpad_loopexit$0=0;$lpad_loopexit$1=0;var $lpad_phi$1=$lpad_loopexit$1;var $lpad_phi$0=$lpad_loopexit$0;label=7;break;case 6:var $lpad_nonloopexit$0=0;$lpad_nonloopexit$1=0;var $lpad_phi$1=$lpad_nonloopexit$1;var $lpad_phi$0=$lpad_nonloopexit$0;label=7;break;case 7:var $lpad_phi$0;var $lpad_phi$1;var $11=$lpad_phi$1;var $12=($11|0)<0;if($12){label=8;break}else{label=11;break};case 8:var $14=$lpad_phi$0;___cxa_call_unexpected($14);case 9:var $16=___cxa_allocate_exception(4);var $17=$16;HEAP32[$17>>2]=2376;___cxa_throw($16,2504,16);label=12;break;case 10:return $3;case 11:abort();case 12:}}function __ZNSt9bad_allocD2Ev($this){return}function __ZNKSt9bad_alloc4whatEv($this){return 672}function __ZNKSt20bad_array_new_length4whatEv($this){return 936}function __ZSt15set_new_handlerPFvvE($handler){return tempValue=HEAP32[3096>>2],HEAP32[3096>>2]=$handler,tempValue}function __ZNSt9bad_allocC2Ev($this){HEAP32[$this>>2]=2376;return}function __ZNSt20bad_array_new_lengthC2Ev($this){HEAP32[$this>>2]=2408;return}function __ZdlPv($ptr){var label=0;label=1;while(1)switch(label){case 1:var $1=($ptr|0)==0;if($1){label=3;break}else{label=2;break};case 2:_free($ptr);label=3;break;case 3:return}}function __ZdlPvRKSt9nothrow_t($ptr,$0){__ZdlPv($ptr);return}function __ZdaPv($ptr){__ZdlPv($ptr);return}function __ZdaPvRKSt9nothrow_t($ptr,$0){__ZdaPv($ptr);return}function __ZNSt9bad_allocD0Ev($this){__ZdlPv($this);return}function __ZNSt20bad_array_new_lengthD0Ev($this){__ZdlPv($this);return}function _getopt($nargc,$nargv,$options){return _getopt_internal($nargc,$nargv,$options,0,0,0)}function _getopt_internal($nargc,$nargv,$options,$long_options,$idx,$flags){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=($options|0)==0;if($1){var $_04=-1;label=106;break}else{label=2;break};case 2:var $3=HEAP32[200>>2];var $4=($3|0)==0;if($4){label=3;break}else{label=4;break};case 3:HEAP32[2568>>2]=1;HEAP32[200>>2]=1;var $11=1;var $10=1;label=5;break;case 4:var $_pre55=HEAP32[2568>>2];var $6=HEAP32[320>>2];var $7=($6|0)==-1;var $8=($_pre55|0)!=0;var $or_cond=$7|$8;if($or_cond){var $11=$_pre55;var $10=$3;label=5;break}else{var $18=$6;var $17=$_pre55;var $16=$3;label=6;break};case 5:var $10;var $11;var $12=_getenv(576);var $13=($12|0)!=0;var $14=$13&1;HEAP32[320>>2]=$14;var $18=$14;var $17=$11;var $16=$10;label=6;break;case 6:var $16;var $17;var $18;var $19=HEAP8[$options];var $20=$19<<24>>24==45;if($20){label=7;break}else{label=8;break};case 7:var $21=$flags|2;var $_064=$21;label=9;break;case 8:var $23=($18|0)!=0;var $24=$19<<24>>24==43;var $or_cond6=$23|$24;var $25=$flags&-2;var $_flags=$or_cond6?$25:$flags;var $cond=$19<<24>>24==43;if($cond){var $_064=$_flags;label=9;break}else{var $_05=$options;var $_065=$_flags;label=10;break};case 9:var $_064;var $27=$options+1|0;var $_05=$27;var $_065=$_064;label=10;break;case 10:var $_065;var $_05;HEAP32[2576>>2]=0;var $29=($17|0)==0;if($29){var $32=$16;label=13;break}else{label=11;break};case 11:HEAP32[224>>2]=-1;HEAP32[216>>2]=-1;var $31=$16;var $_pr=$17;label=12;break;case 12:var $_pr;var $31;var $phitmp=($_pr|0)==0;if($phitmp){var $32=$31;label=13;break}else{var $37=$31;label=14;break};case 13:var $32;var $33=HEAP32[160>>2];var $34=HEAP8[$33];var $35=$34<<24>>24==0;if($35){var $37=$32;label=14;break}else{var $187=$33;var $186=$32;label=63;break};case 14:var $37;HEAP32[2568>>2]=0;var $38=($37|0)<($nargc|0);if($38){label=28;break}else{label=15;break};case 15:HEAP32[160>>2]=2608;var $40=HEAP32[224>>2];var $41=($40|0)==-1;var $42=HEAP32[216>>2];if($41){label=25;break}else{label=16;break};case 16:var $44=$40-$42|0;var $45=$37-$40|0;var $46=($44|0)%($45|0)&-1;var $47=($46|0)==0;if($47){var $_0_lcssa_i_i=$45;label=18;break}else{var $_01_i_i=$45;var $c_02_i_i=$46;label=17;break};case 17:var $c_02_i_i;var $_01_i_i;var $48=($_01_i_i|0)%($c_02_i_i|0)&-1;var $49=($48|0)==0;if($49){var $_0_lcssa_i_i=$c_02_i_i;label=18;break}else{var $_01_i_i=$c_02_i_i;var $c_02_i_i=$48;label=17;break};case 18:var $_0_lcssa_i_i;var $50=$37-$42|0;var $51=($50|0)/($_0_lcssa_i_i|0)&-1;var $52=($_0_lcssa_i_i|0)>0;if($52){label=19;break}else{var $69=$40;var $68=$42;var $67=$37;label=24;break};case 19:var $53=($51|0)>0;var $54=-$44|0;if($53){var $i_03_us_i=0;label=22;break}else{var $69=$40;var $68=$42;var $67=$37;label=24;break};case 20:var $56=$i_03_us_i+1|0;var $57=($56|0)<($_0_lcssa_i_i|0);if($57){var $i_03_us_i=$56;label=22;break}else{label=23;break};case 21:var $59;var $pos_02_us_i;var $j_01_us_i;var $60=($pos_02_us_i|0)<($40|0);var $pos_1_p_us_i=$60?$45:$54;var $pos_1_us_i=$pos_1_p_us_i+$pos_02_us_i|0;var $61=$nargv+($pos_1_us_i<<2)|0;var $62=HEAP32[$61>>2];HEAP32[$61>>2]=$59;HEAP32[$66>>2]=$62;var $63=$j_01_us_i+1|0;var $64=($63|0)<($51|0);if($64){var $j_01_us_i=$63;var $pos_02_us_i=$pos_1_us_i;var $59=$62;label=21;break}else{label=20;break};case 22:var $i_03_us_i;var $65=$i_03_us_i+$40|0;var $66=$nargv+($65<<2)|0;var $_pre_i=HEAP32[$66>>2];var $j_01_us_i=0;var $pos_02_us_i=$65;var $59=$_pre_i;label=21;break;case 23:var $_pre44=HEAP32[224>>2];var $_pre45=HEAP32[216>>2];var $_pre46=HEAP32[200>>2];var $69=$_pre44;var $68=$_pre45;var $67=$_pre46;label=24;break;case 24:var $67;var $68;var $69;var $70=$68-$69|0;var $71=$70+$67|0;HEAP32[200>>2]=$71;label=27;break;case 25:var $73=($42|0)==-1;if($73){label=27;break}else{label=26;break};case 26:HEAP32[200>>2]=$42;label=27;break;case 27:HEAP32[224>>2]=-1;HEAP32[216>>2]=-1;var $_04=-1;label=106;break;case 28:var $77=$nargv+($37<<2)|0;var $78=HEAP32[$77>>2];HEAP32[160>>2]=$78;var $79=HEAP8[$78];var $80=$79<<24>>24==45;if($80){label=29;break}else{label=31;break};case 29:var $82=$78+1|0;var $83=HEAP8[$82];var $84=$83<<24>>24==0;if($84){label=30;break}else{label=47;break};case 30:var $86=_strchr($_05,45);var $87=($86|0)==0;if($87){label=31;break}else{label=47;break};case 31:HEAP32[160>>2]=2608;var $89=$_065&2;var $90=($89|0)==0;if($90){label=33;break}else{label=32;break};case 32:var $92=$37+1|0;HEAP32[200>>2]=$92;var $93=HEAP32[$77>>2];HEAP32[2576>>2]=$93;var $_04=1;label=106;break;case 33:var $95=$_065&1;var $96=($95|0)==0;if($96){var $_04=-1;label=106;break}else{label=34;break};case 34:var $98=HEAP32[216>>2];var $99=($98|0)==-1;if($99){label=35;break}else{label=36;break};case 35:HEAP32[216>>2]=$37;var $134=$37;var $_pr_pre=0;label=46;break;case 36:var $102=HEAP32[224>>2];var $103=($102|0)==-1;if($103){var $134=$37;var $_pr_pre=0;label=46;break}else{label=37;break};case 37:var $105=$102-$98|0;var $106=$37-$102|0;var $107=($105|0)%($106|0)&-1;var $108=($107|0)==0;if($108){var $_0_lcssa_i_i11=$106;label=39;break}else{var $_01_i_i9=$106;var $c_02_i_i8=$107;label=38;break};case 38:var $c_02_i_i8;var $_01_i_i9;var $109=($_01_i_i9|0)%($c_02_i_i8|0)&-1;var $110=($109|0)==0;if($110){var $_0_lcssa_i_i11=$c_02_i_i8;label=39;break}else{var $_01_i_i9=$c_02_i_i8;var $c_02_i_i8=$109;label=38;break};case 39:var $_0_lcssa_i_i11;var $111=$37-$98|0;var $112=($111|0)/($_0_lcssa_i_i11|0)&-1;var $113=($_0_lcssa_i_i11|0)>0;if($113){label=40;break}else{var $130=$37;var $129=$102;var $128=$98;var $_pr_pre_pre=0;label=45;break};case 40:var $114=($112|0)>0;var $115=-$105|0;if($114){var $i_03_us_i18=0;label=43;break}else{var $130=$37;var $129=$102;var $128=$98;var $_pr_pre_pre=0;label=45;break};case 41:var $117=$i_03_us_i18+1|0;var $118=($117|0)<($_0_lcssa_i_i11|0);if($118){var $i_03_us_i18=$117;label=43;break}else{label=44;break};case 42:var $120;var $pos_02_us_i14;var $j_01_us_i15;var $121=($pos_02_us_i14|0)<($102|0);var $pos_1_p_us_i16=$121?$106:$115;var $pos_1_us_i17=$pos_1_p_us_i16+$pos_02_us_i14|0;var $122=$nargv+($pos_1_us_i17<<2)|0;var $123=HEAP32[$122>>2];HEAP32[$122>>2]=$120;HEAP32[$127>>2]=$123;var $124=$j_01_us_i15+1|0;var $125=($124|0)<($112|0);if($125){var $j_01_us_i15=$124;var $pos_02_us_i14=$pos_1_us_i17;var $120=$123;label=42;break}else{label=41;break};case 43:var $i_03_us_i18;var $126=$i_03_us_i18+$102|0;var $127=$nargv+($126<<2)|0;var $_pre_i19=HEAP32[$127>>2];var $j_01_us_i15=0;var $pos_02_us_i14=$126;var $120=$_pre_i19;label=42;break;case 44:var $_pre41=HEAP32[200>>2];var $_pre42=HEAP32[224>>2];var $_pre43=HEAP32[216>>2];var $_pr_pre_pre_pre=HEAP32[2568>>2];var $130=$_pre41;var $129=$_pre42;var $128=$_pre43;var $_pr_pre_pre=$_pr_pre_pre_pre;label=45;break;case 45:var $_pr_pre_pre;var $128;var $129;var $130;var $131=$130-$129|0;var $132=$131+$128|0;HEAP32[216>>2]=$132;HEAP32[224>>2]=-1;var $134=$130;var $_pr_pre=$_pr_pre_pre;label=46;break;case 46:var $_pr_pre;var $134;var $135=$134+1|0;HEAP32[200>>2]=$135;var $31=$135;var $_pr=$_pr_pre;label=12;break;case 47:var $136=HEAP32[216>>2];var $137=($136|0)!=-1;var $138=HEAP32[224>>2];var $139=($138|0)==-1;var $or_cond3=$137&$139;if($or_cond3){label=48;break}else{var $143=$83;var $142=$138;label=49;break};case 48:HEAP32[224>>2]=$37;var $_pre=HEAP8[$82];var $143=$_pre;var $142=$37;label=49;break;case 49:var $142;var $143;var $144=$143<<24>>24==0;if($144){var $187=$78;var $186=$37;label=63;break}else{label=50;break};case 50:HEAP32[160>>2]=$82;var $146=HEAP8[$82];var $147=$146<<24>>24==45;if($147){label=51;break}else{var $187=$82;var $186=$37;label=63;break};case 51:var $149=$78+2|0;var $150=HEAP8[$149];var $151=$150<<24>>24==0;if($151){label=52;break}else{var $187=$82;var $186=$37;label=63;break};case 52:var $153=$37+1|0;HEAP32[200>>2]=$153;HEAP32[160>>2]=2608;var $154=($142|0)==-1;if($154){label=62;break}else{label=53;break};case 53:var $156=$142-$136|0;var $157=$153-$142|0;var $158=($156|0)%($157|0)&-1;var $159=($158|0)==0;if($159){var $_0_lcssa_i_i25=$157;label=55;break}else{var $_01_i_i23=$157;var $c_02_i_i22=$158;label=54;break};case 54:var $c_02_i_i22;var $_01_i_i23;var $160=($_01_i_i23|0)%($c_02_i_i22|0)&-1;var $161=($160|0)==0;if($161){var $_0_lcssa_i_i25=$c_02_i_i22;label=55;break}else{var $_01_i_i23=$c_02_i_i22;var $c_02_i_i22=$160;label=54;break};case 55:var $_0_lcssa_i_i25;var $162=$153-$136|0;var $163=($162|0)/($_0_lcssa_i_i25|0)&-1;var $164=($_0_lcssa_i_i25|0)>0;if($164){label=56;break}else{var $181=$142;var $180=$136;var $179=$153;label=61;break};case 56:var $165=($163|0)>0;var $166=-$156|0;if($165){var $i_03_us_i32=0;label=59;break}else{var $181=$142;var $180=$136;var $179=$153;label=61;break};case 57:var $168=$i_03_us_i32+1|0;var $169=($168|0)<($_0_lcssa_i_i25|0);if($169){var $i_03_us_i32=$168;label=59;break}else{label=60;break};case 58:var $171;var $pos_02_us_i28;var $j_01_us_i29;var $172=($pos_02_us_i28|0)<($142|0);var $pos_1_p_us_i30=$172?$157:$166;var $pos_1_us_i31=$pos_1_p_us_i30+$pos_02_us_i28|0;var $173=$nargv+($pos_1_us_i31<<2)|0;var $174=HEAP32[$173>>2];HEAP32[$173>>2]=$171;HEAP32[$178>>2]=$174;var $175=$j_01_us_i29+1|0;var $176=($175|0)<($163|0);if($176){var $j_01_us_i29=$175;var $pos_02_us_i28=$pos_1_us_i31;var $171=$174;label=58;break}else{label=57;break};case 59:var $i_03_us_i32;var $177=$i_03_us_i32+$142|0;var $178=$nargv+($177<<2)|0;var $_pre_i33=HEAP32[$178>>2];var $j_01_us_i29=0;var $pos_02_us_i28=$177;var $171=$_pre_i33;label=58;break;case 60:var $_pre38=HEAP32[224>>2];var $_pre39=HEAP32[216>>2];var $_pre40=HEAP32[200>>2];var $181=$_pre38;var $180=$_pre39;var $179=$_pre40;label=61;break;case 61:var $179;var $180;var $181;var $182=$180-$181|0;var $183=$182+$179|0;HEAP32[200>>2]=$183;label=62;break;case 62:HEAP32[224>>2]=-1;HEAP32[216>>2]=-1;var $_04=-1;label=106;break;case 63:var $186;var $187;var $188=($long_options|0)!=0;if($188){label=64;break}else{var $209=$187;label=73;break};case 64:var $190=$nargv+($186<<2)|0;var $191=HEAP32[$190>>2];var $192=($187|0)==($191|0);if($192){var $209=$187;label=73;break}else{label=65;break};case 65:var $194=HEAP8[$187];var $195=$194<<24>>24==45;if($195){label=68;break}else{label=66;break};case 66:var $197=$_065&4;var $198=($197|0)==0;if($198){var $209=$187;label=73;break}else{label=67;break};case 67:var $cond70=$194<<24>>24==58;if($cond70){var $short_too_0=0;label=70;break}else{label=69;break};case 68:var $200=$187+1|0;HEAP32[160>>2]=$200;var $short_too_0=0;label=70;break;case 69:var $202=$194<<24>>24;var $203=_strchr($_05,$202);var $not_=($203|0)!=0;var $_=$not_&1;var $short_too_0=$_;label=70;break;case 70:var $short_too_0;var $205=_parse_long_options($nargv,$_05,$long_options,$idx,$short_too_0);var $206=($205|0)==-1;if($206){label=71;break}else{label=72;break};case 71:var $_pre58=HEAP32[160>>2];var $209=$_pre58;label=73;break;case 72:HEAP32[160>>2]=2608;var $_04=$205;label=106;break;case 73:var $209;var $210=$209+1|0;HEAP32[160>>2]=$210;var $211=HEAP8[$209];var $212=$211<<24>>24;if($211<<24>>24==45){label=74;break}else if($211<<24>>24==58){label=78;break}else{label=75;break};case 74:var $214=HEAP8[$210];var $215=$214<<24>>24==0;if($215){label=75;break}else{label=80;break};case 75:var $217=_strchr($_05,$212);var $218=($217|0)==0;if($218){label=76;break}else{label=84;break};case 76:var $220=$211<<24>>24==45;if($220){label=77;break}else{label=78;break};case 77:var $_pre60=HEAP8[$210];var $221=$_pre60<<24>>24==0;if($221){var $_04=-1;label=106;break}else{label=80;break};case 78:var $_pr68_pr=HEAP8[$210];var $222=$_pr68_pr<<24>>24==0;if($222){label=79;break}else{label=80;break};case 79:var $224=HEAP32[200>>2];var $225=$224+1|0;HEAP32[200>>2]=$225;label=80;break;case 80:var $226=HEAP32[208>>2];var $227=($226|0)==0;if($227){label=83;break}else{label=81;break};case 81:var $229=HEAP8[$_05];var $230=$229<<24>>24==58;if($230){label=83;break}else{label=82;break};case 82:__warnx(296,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$212,tempInt));label=83;break;case 83:HEAP32[192>>2]=$212;var $_04=63;label=106;break;case 84:var $234=$211<<24>>24==87;var $or_cond7=$188&$234;var $235=$217+1|0;var $236=HEAP8[$235];var $237=$236<<24>>24==59;var $or_cond71=$or_cond7&$237;if($or_cond71){label=85;break}else{label=93;break};case 85:var $239=HEAP8[$210];var $240=$239<<24>>24==0;if($240){label=86;break}else{label=92;break};case 86:var $242=HEAP32[200>>2];var $243=$242+1|0;HEAP32[200>>2]=$243;var $244=($243|0)<($nargc|0);if($244){label=91;break}else{label=87;break};case 87:HEAP32[160>>2]=2608;var $246=HEAP32[208>>2];var $247=($246|0)==0;if($247){label=90;break}else{label=88;break};case 88:var $249=HEAP8[$_05];var $250=$249<<24>>24==58;if($250){label=90;break}else{label=89;break};case 89:__warnx(48,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$212,tempInt));label=90;break;case 90:HEAP32[192>>2]=$212;var $253=HEAP8[$_05];var $254=$253<<24>>24==58;var $255=$254?58:63;var $_04=$255;label=106;break;case 91:var $257=$nargv+($243<<2)|0;var $258=HEAP32[$257>>2];HEAP32[160>>2]=$258;label=92;break;case 92:var $260=_parse_long_options($nargv,$_05,$long_options,$idx,0);HEAP32[160>>2]=2608;var $_04=$260;label=106;break;case 93:var $261=$236<<24>>24==58;if($261){label=96;break}else{label=94;break};case 94:var $263=HEAP8[$210];var $264=$263<<24>>24==0;if($264){label=95;break}else{var $_04=$212;label=106;break};case 95:var $266=HEAP32[200>>2];var $267=$266+1|0;HEAP32[200>>2]=$267;var $_04=$212;label=106;break;case 96:HEAP32[2576>>2]=0;var $269=HEAP8[$210];var $270=$269<<24>>24==0;if($270){label=98;break}else{label=97;break};case 97:HEAP32[2576>>2]=$210;label=105;break;case 98:var $273=$217+2|0;var $274=HEAP8[$273];var $275=$274<<24>>24==58;if($275){label=105;break}else{label=99;break};case 99:var $277=HEAP32[200>>2];var $278=$277+1|0;HEAP32[200>>2]=$278;var $279=($278|0)<($nargc|0);if($279){label=104;break}else{label=100;break};case 100:HEAP32[160>>2]=2608;var $281=HEAP32[208>>2];var $282=($281|0)==0;if($282){label=103;break}else{label=101;break};case 101:var $284=HEAP8[$_05];var $285=$284<<24>>24==58;if($285){label=103;break}else{label=102;break};case 102:__warnx(48,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$212,tempInt));label=103;break;case 103:HEAP32[192>>2]=$212;var $288=HEAP8[$_05];var $289=$288<<24>>24==58;var $290=$289?58:63;var $_04=$290;label=106;break;case 104:var $292=$nargv+($278<<2)|0;var $293=HEAP32[$292>>2];HEAP32[2576>>2]=$293;label=105;break;case 105:HEAP32[160>>2]=2608;var $294=HEAP32[200>>2];var $295=$294+1|0;HEAP32[200>>2]=$295;var $_04=$212;label=106;break;case 106:var $_04;STACKTOP=sp;return $_04}}function _getopt_long($nargc,$nargv,$options,$long_options,$idx){return _getopt_internal($nargc,$nargv,$options,$long_options,$idx,1)}function _getopt_long_only($nargc,$nargv,$options,$long_options,$idx){return _getopt_internal($nargc,$nargv,$options,$long_options,$idx,5)}function __ZnwjRKSt9nothrow_t($size,$0){var label=0;label=1;while(1)switch(label){case 1:var $2=__Znwj($size);var $p_0=$2;label=3;break;case 2:var $4$0=0;$4$1=0;var $5=$4$0;var $6=___cxa_begin_catch($5);___cxa_end_catch();var $p_0=0;label=3;break;case 3:var $p_0;return $p_0;case 4:var $9$0=0;$9$1=0;var $10=$9$0;___cxa_call_unexpected($10)}}function __Znaj($size){var label=0;label=1;while(1)switch(label){case 1:var $1=__Znwj($size);label=2;break;case 2:return $1;case 3:var $4$0=0;$4$1=0;var $5=$4$1;var $6=($5|0)<0;if($6){label=4;break}else{label=5;break};case 4:var $8=$4$0;___cxa_call_unexpected($8);case 5:abort()}}function __ZnajRKSt9nothrow_t($size,$0){var label=0;label=1;while(1)switch(label){case 1:var $2=__Znaj($size);var $p_0=$2;label=3;break;case 2:var $4$0=0;$4$1=0;var $5=$4$0;var $6=___cxa_begin_catch($5);___cxa_end_catch();var $p_0=0;label=3;break;case 3:var $p_0;return $p_0;case 4:var $9$0=0;$9$1=0;var $10=$9$0;___cxa_call_unexpected($10)}}function __ZSt17__throw_bad_allocv(){var $1=___cxa_allocate_exception(4);HEAP32[$1>>2]=2376;___cxa_throw($1,2504,16)}function _parse_long_options($nargv,$options,$long_options,$idx,$short_too){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=HEAP32[160>>2];var $2=HEAP32[200>>2];var $3=$2+1|0;HEAP32[200>>2]=$3;var $4=_strchr($1,61);var $5=($4|0)==0;if($5){label=3;break}else{label=2;break};case 2:var $7=$4;var $8=$1;var $9=$7-$8|0;var $10=$4+1|0;var $current_argv_len_0=$9;var $has_equal_0=$10;label=4;break;case 3:var $12=_strlen($1);var $current_argv_len_0=$12;var $has_equal_0=0;label=4;break;case 4:var $has_equal_0;var $current_argv_len_0;var $14=$long_options|0;var $15=HEAP32[$14>>2];var $16=($15|0)==0;if($16){label=37;break}else{label=5;break};case 5:var $17=($short_too|0)!=0;var $18=($current_argv_len_0|0)==1;var $or_cond3=$17&$18;if($or_cond3){var $i_05_us=0;var $19=$15;label=6;break}else{var $i_05=0;var $match_06=-1;var $29=$15;label=9;break};case 6:var $19;var $i_05_us;var $lhsc=HEAP8[$1];var $rhsc=HEAP8[$19];var $20=$lhsc<<24>>24==$rhsc<<24>>24;if($20){label=7;break}else{label=8;break};case 7:var $22=_strlen($19);var $23=($22|0)==1;if($23){var $match_2=$i_05_us;label=17;break}else{label=8;break};case 8:var $25=$i_05_us+1|0;var $26=$long_options+($25<<4)|0;var $27=HEAP32[$26>>2];var $28=($27|0)==0;if($28){label=37;break}else{var $i_05_us=$25;var $19=$27;label=6;break};case 9:var $29;var $match_06;var $i_05;var $30=_strncmp($1,$29,$current_argv_len_0);var $31=($30|0)==0;if($31){label=10;break}else{var $match_1=$match_06;label=16;break};case 10:var $33=_strlen($29);var $34=($33|0)==($current_argv_len_0|0);if($34){var $match_2=$i_05;label=17;break}else{label=11;break};case 11:var $36=($match_06|0)==-1;if($36){var $match_1=$i_05;label=16;break}else{label=12;break};case 12:var $37=HEAP32[208>>2];var $38=($37|0)==0;if($38){label=15;break}else{label=13;break};case 13:var $40=HEAP8[$options];var $41=$40<<24>>24==58;if($41){label=15;break}else{label=14;break};case 14:__warnx(328,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=$current_argv_len_0,HEAP32[tempInt+8>>2]=$1,tempInt));label=15;break;case 15:HEAP32[192>>2]=0;var $_0=63;label=47;break;case 16:var $match_1;var $45=$i_05+1|0;var $46=$long_options+($45<<4)|0;var $47=HEAP32[$46>>2];var $48=($47|0)==0;if($48){var $match_2=$match_1;label=17;break}else{var $i_05=$45;var $match_06=$match_1;var $29=$47;label=9;break};case 17:var $match_2;var $49=($match_2|0)==-1;if($49){label=37;break}else{label=18;break};case 18:var $51=$long_options+($match_2<<4)+4|0;var $52=HEAP32[$51>>2];var $53=($52|0)!=0;var $54=($has_equal_0|0)==0;var $or_cond4=$53|$54;if($or_cond4){label=25;break}else{label=19;break};case 19:var $56=HEAP32[208>>2];var $57=($56|0)==0;if($57){label=22;break}else{label=20;break};case 20:var $59=HEAP8[$options];var $60=$59<<24>>24==58;if($60){label=22;break}else{label=21;break};case 21:__warnx(232,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=$current_argv_len_0,HEAP32[tempInt+8>>2]=$1,tempInt));label=22;break;case 22:var $63=$long_options+($match_2<<4)+8|0;var $64=HEAP32[$63>>2];var $65=($64|0)==0;if($65){label=23;break}else{var $storemerge2=0;label=24;break};case 23:var $67=$long_options+($match_2<<4)+12|0;var $68=HEAP32[$67>>2];var $storemerge2=$68;label=24;break;case 24:var $storemerge2;HEAP32[192>>2]=$storemerge2;var $70=HEAP8[$options];var $71=$70<<24>>24==58;var $72=$71?58:63;var $_0=$72;label=47;break;case 25:var $_off=$52-1|0;var $switch=$_off>>>0<2;if($switch){label=26;break}else{label=30;break};case 26:if($54){label=28;break}else{label=27;break};case 27:HEAP32[2576>>2]=$has_equal_0;label=30;break;case 28:var $77=($52|0)==1;if($77){label=29;break}else{label=30;break};case 29:var $79=$2+2|0;HEAP32[200>>2]=$79;var $80=$nargv+($3<<2)|0;var $81=HEAP32[$80>>2];HEAP32[2576>>2]=$81;label=30;break;case 30:var $82=HEAP32[$51>>2];var $83=($82|0)==1;var $84=HEAP32[2576>>2];var $85=($84|0)==0;var $or_cond=$83&$85;if($or_cond){label=31;break}else{label=43;break};case 31:var $87=HEAP32[208>>2];var $88=($87|0)==0;if($88){label=34;break}else{label=32;break};case 32:var $90=HEAP8[$options];var $91=$90<<24>>24==58;if($91){label=34;break}else{label=33;break};case 33:__warnx(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$1,tempInt));label=34;break;case 34:var $94=$long_options+($match_2<<4)+8|0;var $95=HEAP32[$94>>2];var $96=($95|0)==0;if($96){label=35;break}else{var $storemerge=0;label=36;break};case 35:var $98=$long_options+($match_2<<4)+12|0;var $99=HEAP32[$98>>2];var $storemerge=$99;label=36;break;case 36:var $storemerge;HEAP32[192>>2]=$storemerge;var $100=HEAP32[200>>2];var $101=$100-1|0;HEAP32[200>>2]=$101;var $102=HEAP8[$options];var $103=$102<<24>>24==58;var $104=$103?58:63;var $_0=$104;label=47;break;case 37:var $105=($short_too|0)==0;if($105){label=39;break}else{label=38;break};case 38:HEAP32[200>>2]=$2;var $_0=-1;label=47;break;case 39:var $108=HEAP32[208>>2];var $109=($108|0)==0;if($109){label=42;break}else{label=40;break};case 40:var $111=HEAP8[$options];var $112=$111<<24>>24==58;if($112){label=42;break}else{label=41;break};case 41:__warnx(272,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$1,tempInt));label=42;break;case 42:HEAP32[192>>2]=0;var $_0=63;label=47;break;case 43:var $116=($idx|0)==0;if($116){label=45;break}else{label=44;break};case 44:HEAP32[$idx>>2]=$match_2;label=45;break;case 45:var $119=$long_options+($match_2<<4)+8|0;var $120=HEAP32[$119>>2];var $121=($120|0)==0;var $122=$long_options+($match_2<<4)+12|0;var $123=HEAP32[$122>>2];if($121){var $_0=$123;label=47;break}else{label=46;break};case 46:HEAP32[$120>>2]=$123;var $_0=0;label=47;break;case 47:var $_0;STACKTOP=sp;return $_0}}function __warn($fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $2=$ap;HEAP32[$2>>2]=varrp;HEAP32[$2+4>>2]=0;__vwarn($fmt,$ap|0);STACKTOP=sp;return}function __warnx($fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $2=$ap;HEAP32[$2>>2]=varrp;HEAP32[$2+4>>2]=0;__vwarnx($fmt,$ap|0);STACKTOP=sp;return}function __vwarn($fmt,$ap){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=___errno_location();var $2=HEAP32[$1>>2];var $3=HEAP32[_stderr>>2];var $4=HEAP32[___progname>>2];var $5=_fprintf($3,768,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$4,tempInt));var $6=($fmt|0)==0;if($6){label=3;break}else{label=2;break};case 2:var $8=HEAP32[_stderr>>2];var $9=_vfprintf($8,$fmt,$ap);var $10=HEAP32[_stderr>>2];var $11=_fwrite(1144,2,1,$10);label=3;break;case 3:var $13=HEAP32[_stderr>>2];var $14=_strerror($2);var $15=_fprintf($13,704,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$14,tempInt));STACKTOP=sp;return}}function __vwarnx($fmt,$ap){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=HEAP32[_stderr>>2];var $2=HEAP32[___progname>>2];var $3=_fprintf($1,696,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$2,tempInt));var $4=($fmt|0)==0;if($4){label=3;break}else{label=2;break};case 2:var $6=HEAP32[_stderr>>2];var $7=_vfprintf($6,$fmt,$ap);label=3;break;case 3:var $9=HEAP32[_stderr>>2];var $fputc=_fputc(10,$9);STACKTOP=sp;return}}function _strtod($string,$endPtr){var label=0;label=1;while(1)switch(label){case 1:var $p_0=$string;label=2;break;case 2:var $p_0;var $2=HEAP8[$p_0];var $3=$2<<24>>24;var $4=_isspace($3);var $5=($4|0)==0;var $6=$p_0+1|0;if($5){label=3;break}else{var $p_0=$6;label=2;break};case 3:var $8=HEAP8[$p_0];if($8<<24>>24==45){label=4;break}else if($8<<24>>24==43){label=5;break}else{var $p_2=$p_0;var $sign_0=0;label=6;break};case 4:var $p_2=$6;var $sign_0=1;label=6;break;case 5:var $p_2=$6;var $sign_0=0;label=6;break;case 6:var $sign_0;var $p_2;var $decPt_0=-1;var $mantSize_0=0;var $p_3=$p_2;label=7;break;case 7:var $p_3;var $mantSize_0;var $decPt_0;var $13=HEAP8[$p_3];var $14=$13<<24>>24;var $isdigittmp=$14-48|0;var $isdigit=$isdigittmp>>>0<10;if($isdigit){var $decPt_1=$decPt_0;label=9;break}else{label=8;break};case 8:var $16=$13<<24>>24!=46;var $17=($decPt_0|0)>-1;var $or_cond=$16|$17;if($or_cond){label=10;break}else{var $decPt_1=$mantSize_0;label=9;break};case 9:var $decPt_1;var $19=$p_3+1|0;var $20=$mantSize_0+1|0;var $decPt_0=$decPt_1;var $mantSize_0=$20;var $p_3=$19;label=7;break;case 10:var $22=-$mantSize_0|0;var $23=$p_3+$22|0;var $24=($decPt_0|0)<0;var $not_=$24^1;var $25=$not_<<31>>31;var $mantSize_1=$25+$mantSize_0|0;var $decPt_2=$24?$mantSize_0:$decPt_0;var $26=($mantSize_1|0)>18;var $27=-$mantSize_1|0;var $fracExp_0_p=$26?-18:$27;var $fracExp_0=$fracExp_0_p+$decPt_2|0;var $mantSize_2=$26?18:$mantSize_1;var $28=($mantSize_2|0)==0;if($28){var $p_11=$string;var $fraction_0=0;label=37;break}else{label=11;break};case 11:var $29=($mantSize_2|0)>9;if($29){var $p_422=$23;var $mantSize_323=$mantSize_2;var $frac1_024=0;label=15;break}else{label=13;break};case 12:var $phitmp=$40|0;var $phitmp29=$phitmp*1e9;var $frac1_0_lcssa36=$phitmp29;var $mantSize_3_lcssa37=9;var $p_4_lcssa38=$p_5;label=14;break;case 13:var $30=($mantSize_2|0)>0;if($30){var $frac1_0_lcssa36=0;var $mantSize_3_lcssa37=$mantSize_2;var $p_4_lcssa38=$23;label=14;break}else{var $frac2_0_lcssa=0;var $frac1_0_lcssa35=0;label=22;break};case 14:var $p_4_lcssa38;var $mantSize_3_lcssa37;var $frac1_0_lcssa36;var $p_615=$p_4_lcssa38;var $mantSize_416=$mantSize_3_lcssa37;var $frac2_017=0;label=18;break;case 15:var $frac1_024;var $mantSize_323;var $p_422;var $31=HEAP8[$p_422];var $32=$p_422+1|0;var $33=$31<<24>>24==46;if($33){label=16;break}else{var $c_0_in=$31;var $p_5=$32;label=17;break};case 16:var $35=HEAP8[$32];var $36=$p_422+2|0;var $c_0_in=$35;var $p_5=$36;label=17;break;case 17:var $p_5;var $c_0_in;var $c_0=$c_0_in<<24>>24;var $38=$frac1_024*10&-1;var $39=$38-48|0;var $40=$39+$c_0|0;var $41=$mantSize_323-1|0;var $42=($41|0)>9;if($42){var $p_422=$p_5;var $mantSize_323=$41;var $frac1_024=$40;label=15;break}else{label=12;break};case 18:var $frac2_017;var $mantSize_416;var $p_615;var $44=HEAP8[$p_615];var $45=$p_615+1|0;var $46=$44<<24>>24==46;if($46){label=19;break}else{var $c_1_in=$44;var $p_7=$45;label=20;break};case 19:var $48=HEAP8[$45];var $49=$p_615+2|0;var $c_1_in=$48;var $p_7=$49;label=20;break;case 20:var $p_7;var $c_1_in;var $c_1=$c_1_in<<24>>24;var $51=$frac2_017*10&-1;var $52=$51-48|0;var $53=$52+$c_1|0;var $54=$mantSize_416-1|0;var $55=($54|0)>0;if($55){var $p_615=$p_7;var $mantSize_416=$54;var $frac2_017=$53;label=18;break}else{label=21;break};case 21:var $phitmp30=$53|0;var $frac2_0_lcssa=$phitmp30;var $frac1_0_lcssa35=$frac1_0_lcssa36;label=22;break;case 22:var $frac1_0_lcssa35;var $frac2_0_lcssa;var $57=$frac1_0_lcssa35+$frac2_0_lcssa;if($13<<24>>24==69|$13<<24>>24==101){label=23;break}else{var $exp_1=0;var $p_10=$p_3;var $expSign_1=0;label=28;break};case 23:var $59=$p_3+1|0;var $60=HEAP8[$59];if($60<<24>>24==45){label=24;break}else if($60<<24>>24==43){label=25;break}else{var $p_9_ph=$59;var $expSign_0_ph=0;label=26;break};case 24:var $62=$p_3+2|0;var $p_9_ph=$62;var $expSign_0_ph=1;label=26;break;case 25:var $64=$p_3+2|0;var $p_9_ph=$64;var $expSign_0_ph=0;label=26;break;case 26:var $expSign_0_ph;var $p_9_ph;var $65=HEAP8[$p_9_ph];var $66=$65<<24>>24;var $isdigittmp17=$66-48|0;var $isdigit28=$isdigittmp17>>>0<10;if($isdigit28){var $p_99=$p_9_ph;var $exp_010=0;var $67=$66;label=27;break}else{var $exp_1=0;var $p_10=$p_9_ph;var $expSign_1=$expSign_0_ph;label=28;break};case 27:var $67;var $exp_010;var $p_99;var $68=$exp_010*10&-1;var $69=$68-48|0;var $70=$69+$67|0;var $71=$p_99+1|0;var $72=HEAP8[$71];var $73=$72<<24>>24;var $isdigittmp1=$73-48|0;var $isdigit2=$isdigittmp1>>>0<10;if($isdigit2){var $p_99=$71;var $exp_010=$70;var $67=$73;label=27;break}else{var $exp_1=$70;var $p_10=$71;var $expSign_1=$expSign_0_ph;label=28;break};case 28:var $expSign_1;var $p_10;var $exp_1;var $74=($expSign_1|0)==0;var $75=-$exp_1|0;var $exp_2_p=$74?$exp_1:$75;var $exp_2=$fracExp_0+$exp_2_p|0;var $76=($exp_2|0)<0;var $77=-$exp_2|0;var $exp_3=$76?$77:$exp_2;var $78=($exp_3|0)>511;if($78){label=29;break}else{label=30;break};case 29:var $79=___errno_location();HEAP32[$79>>2]=34;var $dblExp_03=1;var $d_04=88;var $exp_55=511;label=31;break;case 30:var $80=($exp_3|0)==0;if($80){var $dblExp_0_lcssa=1;label=34;break}else{var $dblExp_03=1;var $d_04=88;var $exp_55=$exp_3;label=31;break};case 31:var $exp_55;var $d_04;var $dblExp_03;var $81=$exp_55&1;var $82=($81|0)==0;if($82){var $dblExp_1=$dblExp_03;label=33;break}else{label=32;break};case 32:var $84=HEAPF64[$d_04>>3];var $85=$dblExp_03*$84;var $dblExp_1=$85;label=33;break;case 33:var $dblExp_1;var $87=$exp_55>>1;var $88=$d_04+8|0;var $89=($87|0)==0;if($89){var $dblExp_0_lcssa=$dblExp_1;label=34;break}else{var $dblExp_03=$dblExp_1;var $d_04=$88;var $exp_55=$87;label=31;break};case 34:var $dblExp_0_lcssa;var $90=($exp_2|0)>-1;if($90){label=36;break}else{label=35;break};case 35:var $92=$57/$dblExp_0_lcssa;var $p_11=$p_10;var $fraction_0=$92;label=37;break;case 36:var $94=$57*$dblExp_0_lcssa;var $p_11=$p_10;var $fraction_0=$94;label=37;break;case 37:var $fraction_0;var $p_11;var $96=($endPtr|0)==0;if($96){label=39;break}else{label=38;break};case 38:HEAP32[$endPtr>>2]=$p_11;label=39;break;case 39:var $99=($sign_0|0)==0;if($99){var $_0=$fraction_0;label=41;break}else{label=40;break};case 40:var $101=-$fraction_0;var $_0=$101;label=41;break;case 41:var $_0;return $_0}}function _strtold($nptr,$endptr){return _strtod($nptr,$endptr)}function _strtof($nptr,$endptr){return _strtod($nptr,$endptr)}function _strtod_l($nptr,$endptr,$loc){return _strtod($nptr,$endptr)}function _strtold_l($nptr,$endptr,$loc){return _strtod($nptr,$endptr)}function _atof($str){return _strtod($str,0)}function __err($eval,$fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $2=$ap;HEAP32[$2>>2]=varrp;HEAP32[$2+4>>2]=0;__verr($eval,$fmt,$ap|0)}function __errx($eval,$fmt,varrp){var sp=STACKTOP;STACKTOP=STACKTOP+16|0;var $ap=sp;var $2=$ap;HEAP32[$2>>2]=varrp;HEAP32[$2+4>>2]=0;__verrx($eval,$fmt,$ap|0)}function __verr($eval,$fmt,$ap){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=___errno_location();var $2=HEAP32[$1>>2];var $3=HEAP32[_stderr>>2];var $4=HEAP32[___progname>>2];var $5=_fprintf($3,360,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$4,tempInt));var $6=($fmt|0)==0;if($6){label=3;break}else{label=2;break};case 2:var $8=HEAP32[_stderr>>2];var $9=_vfprintf($8,$fmt,$ap);var $10=HEAP32[_stderr>>2];var $11=_fwrite(1184,2,1,$10);label=3;break;case 3:var $13=HEAP32[_stderr>>2];var $14=_strerror($2);var $15=_fprintf($13,744,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$14,tempInt));_exit($eval)}}function __verrx($eval,$fmt,$ap){var label=0;var sp=STACKTOP;label=1;while(1)switch(label){case 1:var $1=HEAP32[_stderr>>2];var $2=HEAP32[___progname>>2];var $3=_fprintf($1,888,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=$2,tempInt));var $4=($fmt|0)==0;if($4){label=3;break}else{label=2;break};case 2:var $6=HEAP32[_stderr>>2];var $7=_vfprintf($6,$fmt,$ap);label=3;break;case 3:var $9=HEAP32[_stderr>>2];var $fputc=_fputc(10,$9);_exit($eval)}}function _i64Add(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var l=0,h=0;l=a+c>>>0;h=b+d+(l>>>0<a>>>0|0)>>>0;return tempRet0=h,l|0}function _i64Subtract(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var l=0,h=0;l=a-c>>>0;h=b-d>>>0;h=b-d-(c>>>0>a>>>0|0)>>>0;return tempRet0=h,l|0}function _bitshift64Shl(low,high,bits){low=low|0;high=high|0;bits=bits|0;var ander=0;if((bits|0)<32){ander=(1<<bits)-1|0;tempRet0=high<<bits|(low&ander<<32-bits)>>>32-bits;return low<<bits}tempRet0=low<<bits-32;return 0}function _bitshift64Lshr(low,high,bits){low=low|0;high=high|0;bits=bits|0;var ander=0;if((bits|0)<32){ander=(1<<bits)-1|0;tempRet0=high>>>bits;return low>>>bits|(high&ander)<<32-bits}tempRet0=0;return high>>>bits-32|0}function _bitshift64Ashr(low,high,bits){low=low|0;high=high|0;bits=bits|0;var ander=0;if((bits|0)<32){ander=(1<<bits)-1|0;tempRet0=high>>bits;return low>>>bits|(high&ander)<<32-bits}tempRet0=(high|0)<0?-1:0;return high>>bits-32|0}function _llvm_ctlz_i32(x){x=x|0;var ret=0;ret=HEAP8[ctlz_i8+(x>>>24)|0];if((ret|0)<8)return ret|0;var ret=HEAP8[ctlz_i8+(x>>16&255)|0];if((ret|0)<8)return ret+8|0;var ret=HEAP8[ctlz_i8+(x>>8&255)|0];if((ret|0)<8)return ret+16|0;return HEAP8[ctlz_i8+(x&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(x){x=x|0;var ret=0;ret=HEAP8[cttz_i8+(x&255)|0];if((ret|0)<8)return ret|0;var ret=HEAP8[cttz_i8+(x>>8&255)|0];if((ret|0)<8)return ret+8|0;var ret=HEAP8[cttz_i8+(x>>16&255)|0];if((ret|0)<8)return ret+16|0;return HEAP8[cttz_i8+(x>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3($a,$b){$a=$a|0;$b=$b|0;var $1=0,$2=0,$3=0,$6=0,$8=0,$11=0,$12=0;$1=$a&65535;$2=$b&65535;$3=Math.imul($2,$1)|0;$6=$a>>>16;$8=($3>>>16)+Math.imul($2,$6)|0;$11=$b>>>16;$12=Math.imul($11,$1)|0;return(tempRet0=($8>>>16)+Math.imul($11,$6)+((($8&65535)+$12|0)>>>16)|0,$8+$12<<16|$3&65535|0)|0}function ___divdi3($a$0,$a$1,$b$0,$b$1){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;var $1$0=0,$1$1=0,$2$0=0,$2$1=0,$4$0=0,$4$1=0,$6$0=0,$7$0=0,$7$1=0,$8$0=0,$10$0=0;$1$0=$a$1>>31|(($a$1|0)<0?-1:0)<<1;$1$1=(($a$1|0)<0?-1:0)>>31|(($a$1|0)<0?-1:0)<<1;$2$0=$b$1>>31|(($b$1|0)<0?-1:0)<<1;$2$1=(($b$1|0)<0?-1:0)>>31|(($b$1|0)<0?-1:0)<<1;$4$0=_i64Subtract($1$0^$a$0,$1$1^$a$1,$1$0,$1$1)|0;$4$1=tempRet0;$6$0=_i64Subtract($2$0^$b$0,$2$1^$b$1,$2$0,$2$1)|0;$7$0=$2$0^$1$0;$7$1=$2$1^$1$1;$8$0=___udivmoddi4($4$0,$4$1,$6$0,tempRet0,0)|0;$10$0=_i64Subtract($8$0^$7$0,tempRet0^$7$1,$7$0,$7$1)|0;return(tempRet0=tempRet0,$10$0)|0}function ___remdi3($a$0,$a$1,$b$0,$b$1){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;var $rem=0,$1$0=0,$1$1=0,$2$0=0,$2$1=0,$4$0=0,$4$1=0,$6$0=0,$10$0=0,$10$1=0,__stackBase__=0;__stackBase__=STACKTOP;STACKTOP=STACKTOP+8|0;$rem=__stackBase__|0;$1$0=$a$1>>31|(($a$1|0)<0?-1:0)<<1;$1$1=(($a$1|0)<0?-1:0)>>31|(($a$1|0)<0?-1:0)<<1;$2$0=$b$1>>31|(($b$1|0)<0?-1:0)<<1;$2$1=(($b$1|0)<0?-1:0)>>31|(($b$1|0)<0?-1:0)<<1;$4$0=_i64Subtract($1$0^$a$0,$1$1^$a$1,$1$0,$1$1)|0;$4$1=tempRet0;$6$0=_i64Subtract($2$0^$b$0,$2$1^$b$1,$2$0,$2$1)|0;___udivmoddi4($4$0,$4$1,$6$0,tempRet0,$rem)|0;$10$0=_i64Subtract(HEAP32[$rem>>2]^$1$0,HEAP32[$rem+4>>2]^$1$1,$1$0,$1$1)|0;$10$1=tempRet0;STACKTOP=__stackBase__;return(tempRet0=$10$1,$10$0)|0}function ___muldi3($a$0,$a$1,$b$0,$b$1){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;var $x_sroa_0_0_extract_trunc=0,$y_sroa_0_0_extract_trunc=0,$1$0=0,$1$1=0,$2=0;$x_sroa_0_0_extract_trunc=$a$0;$y_sroa_0_0_extract_trunc=$b$0;$1$0=___muldsi3($x_sroa_0_0_extract_trunc,$y_sroa_0_0_extract_trunc)|0;$1$1=tempRet0;$2=Math.imul($a$1,$y_sroa_0_0_extract_trunc)|0;return(tempRet0=Math.imul($b$1,$x_sroa_0_0_extract_trunc)+$2+$1$1|$1$1&0,$1$0&-1|0)|0}function ___udivdi3($a$0,$a$1,$b$0,$b$1){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;var $1$0=0;$1$0=___udivmoddi4($a$0,$a$1,$b$0,$b$1,0)|0;return(tempRet0=tempRet0,$1$0)|0}function ___uremdi3($a$0,$a$1,$b$0,$b$1){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;var $rem=0,__stackBase__=0;__stackBase__=STACKTOP;STACKTOP=STACKTOP+8|0;$rem=__stackBase__|0;___udivmoddi4($a$0,$a$1,$b$0,$b$1,$rem)|0;STACKTOP=__stackBase__;return(tempRet0=HEAP32[$rem+4>>2]|0,HEAP32[$rem>>2]|0)|0}function ___udivmoddi4($a$0,$a$1,$b$0,$b$1,$rem){$a$0=$a$0|0;$a$1=$a$1|0;$b$0=$b$0|0;$b$1=$b$1|0;$rem=$rem|0;var $n_sroa_0_0_extract_trunc=0,$n_sroa_1_4_extract_shift$0=0,$n_sroa_1_4_extract_trunc=0,$d_sroa_0_0_extract_trunc=0,$d_sroa_1_4_extract_shift$0=0,$d_sroa_1_4_extract_trunc=0,$4=0,$17=0,$37=0,$49=0,$51=0,$57=0,$58=0,$66=0,$78=0,$86=0,$88=0,$89=0,$91=0,$92=0,$95=0,$105=0,$117=0,$119=0,$125=0,$126=0,$130=0,$q_sroa_1_1_ph=0,$q_sroa_0_1_ph=0,$r_sroa_1_1_ph=0,$r_sroa_0_1_ph=0,$sr_1_ph=0,$d_sroa_0_0_insert_insert99$0=0,$d_sroa_0_0_insert_insert99$1=0,$137$0=0,$137$1=0,$carry_0203=0,$sr_1202=0,$r_sroa_0_1201=0,$r_sroa_1_1200=0,$q_sroa_0_1199=0,$q_sroa_1_1198=0,$147=0,$149=0,$r_sroa_0_0_insert_insert42$0=0,$r_sroa_0_0_insert_insert42$1=0,$150$1=0,$151$0=0,$152=0,$154$0=0,$r_sroa_0_0_extract_trunc=0,$r_sroa_1_4_extract_trunc=0,$155=0,$carry_0_lcssa$0=0,$carry_0_lcssa$1=0,$r_sroa_0_1_lcssa=0,$r_sroa_1_1_lcssa=0,$q_sroa_0_1_lcssa=0,$q_sroa_1_1_lcssa=0,$q_sroa_0_0_insert_ext75$0=0,$q_sroa_0_0_insert_ext75$1=0,$q_sroa_0_0_insert_insert77$1=0,$_0$0=0,$_0$1=0;$n_sroa_0_0_extract_trunc=$a$0;$n_sroa_1_4_extract_shift$0=$a$1;$n_sroa_1_4_extract_trunc=$n_sroa_1_4_extract_shift$0;$d_sroa_0_0_extract_trunc=$b$0;$d_sroa_1_4_extract_shift$0=$b$1;$d_sroa_1_4_extract_trunc=$d_sroa_1_4_extract_shift$0;if(($n_sroa_1_4_extract_trunc|0)==0){$4=($rem|0)!=0;if(($d_sroa_1_4_extract_trunc|0)==0){if($4){HEAP32[$rem>>2]=($n_sroa_0_0_extract_trunc>>>0)%($d_sroa_0_0_extract_trunc>>>0);HEAP32[$rem+4>>2]=0}$_0$1=0;$_0$0=($n_sroa_0_0_extract_trunc>>>0)/($d_sroa_0_0_extract_trunc>>>0)>>>0;return(tempRet0=$_0$1,$_0$0)|0}else{if(!$4){$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}HEAP32[$rem>>2]=$a$0&-1;HEAP32[$rem+4>>2]=$a$1&0;$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}}$17=($d_sroa_1_4_extract_trunc|0)==0;do{if(($d_sroa_0_0_extract_trunc|0)==0){if($17){if(($rem|0)!=0){HEAP32[$rem>>2]=($n_sroa_1_4_extract_trunc>>>0)%($d_sroa_0_0_extract_trunc>>>0);HEAP32[$rem+4>>2]=0}$_0$1=0;$_0$0=($n_sroa_1_4_extract_trunc>>>0)/($d_sroa_0_0_extract_trunc>>>0)>>>0;return(tempRet0=$_0$1,$_0$0)|0}if(($n_sroa_0_0_extract_trunc|0)==0){if(($rem|0)!=0){HEAP32[$rem>>2]=0;HEAP32[$rem+4>>2]=($n_sroa_1_4_extract_trunc>>>0)%($d_sroa_1_4_extract_trunc>>>0)}$_0$1=0;$_0$0=($n_sroa_1_4_extract_trunc>>>0)/($d_sroa_1_4_extract_trunc>>>0)>>>0;return(tempRet0=$_0$1,$_0$0)|0}$37=$d_sroa_1_4_extract_trunc-1|0;if(($37&$d_sroa_1_4_extract_trunc|0)==0){if(($rem|0)!=0){HEAP32[$rem>>2]=$a$0&-1;HEAP32[$rem+4>>2]=$37&$n_sroa_1_4_extract_trunc|$a$1&0}$_0$1=0;$_0$0=$n_sroa_1_4_extract_trunc>>>((_llvm_cttz_i32($d_sroa_1_4_extract_trunc|0)|0)>>>0);return(tempRet0=$_0$1,$_0$0)|0}$49=_llvm_ctlz_i32($d_sroa_1_4_extract_trunc|0)|0;$51=$49-_llvm_ctlz_i32($n_sroa_1_4_extract_trunc|0)|0;if($51>>>0<=30){$57=$51+1|0;$58=31-$51|0;$sr_1_ph=$57;$r_sroa_0_1_ph=$n_sroa_1_4_extract_trunc<<$58|$n_sroa_0_0_extract_trunc>>>($57>>>0);$r_sroa_1_1_ph=$n_sroa_1_4_extract_trunc>>>($57>>>0);$q_sroa_0_1_ph=0;$q_sroa_1_1_ph=$n_sroa_0_0_extract_trunc<<$58;break}if(($rem|0)==0){$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}HEAP32[$rem>>2]=$a$0&-1;HEAP32[$rem+4>>2]=$n_sroa_1_4_extract_shift$0|$a$1&0;$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}else{if(!$17){$117=_llvm_ctlz_i32($d_sroa_1_4_extract_trunc|0)|0;$119=$117-_llvm_ctlz_i32($n_sroa_1_4_extract_trunc|0)|0;if($119>>>0<=31){$125=$119+1|0;$126=31-$119|0;$130=$119-31>>31;$sr_1_ph=$125;$r_sroa_0_1_ph=$n_sroa_0_0_extract_trunc>>>($125>>>0)&$130|$n_sroa_1_4_extract_trunc<<$126;$r_sroa_1_1_ph=$n_sroa_1_4_extract_trunc>>>($125>>>0)&$130;$q_sroa_0_1_ph=0;$q_sroa_1_1_ph=$n_sroa_0_0_extract_trunc<<$126;break}if(($rem|0)==0){$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}HEAP32[$rem>>2]=$a$0&-1;HEAP32[$rem+4>>2]=$n_sroa_1_4_extract_shift$0|$a$1&0;$_0$1=0;$_0$0=0;return(tempRet0=$_0$1,$_0$0)|0}$66=$d_sroa_0_0_extract_trunc-1|0;if(($66&$d_sroa_0_0_extract_trunc|0)!=0){$86=_llvm_ctlz_i32($d_sroa_0_0_extract_trunc|0)+33|0;$88=$86-_llvm_ctlz_i32($n_sroa_1_4_extract_trunc|0)|0;$89=64-$88|0;$91=32-$88|0;$92=$91>>31;$95=$88-32|0;$105=$95>>31;$sr_1_ph=$88;$r_sroa_0_1_ph=$91-1>>31&$n_sroa_1_4_extract_trunc>>>($95>>>0)|($n_sroa_1_4_extract_trunc<<$91|$n_sroa_0_0_extract_trunc>>>($88>>>0))&$105;$r_sroa_1_1_ph=$105&$n_sroa_1_4_extract_trunc>>>($88>>>0);$q_sroa_0_1_ph=$n_sroa_0_0_extract_trunc<<$89&$92;$q_sroa_1_1_ph=($n_sroa_1_4_extract_trunc<<$89|$n_sroa_0_0_extract_trunc>>>($95>>>0))&$92|$n_sroa_0_0_extract_trunc<<$91&$88-33>>31;break}if(($rem|0)!=0){HEAP32[$rem>>2]=$66&$n_sroa_0_0_extract_trunc;HEAP32[$rem+4>>2]=0}if(($d_sroa_0_0_extract_trunc|0)==1){$_0$1=$n_sroa_1_4_extract_shift$0|$a$1&0;$_0$0=$a$0&-1|0;return(tempRet0=$_0$1,$_0$0)|0}else{$78=_llvm_cttz_i32($d_sroa_0_0_extract_trunc|0)|0;$_0$1=$n_sroa_1_4_extract_trunc>>>($78>>>0)|0;$_0$0=$n_sroa_1_4_extract_trunc<<32-$78|$n_sroa_0_0_extract_trunc>>>($78>>>0)|0;return(tempRet0=$_0$1,$_0$0)|0}}}while(0);if(($sr_1_ph|0)==0){$q_sroa_1_1_lcssa=$q_sroa_1_1_ph;$q_sroa_0_1_lcssa=$q_sroa_0_1_ph;$r_sroa_1_1_lcssa=$r_sroa_1_1_ph;$r_sroa_0_1_lcssa=$r_sroa_0_1_ph;$carry_0_lcssa$1=0;$carry_0_lcssa$0=0}else{$d_sroa_0_0_insert_insert99$0=$b$0&-1|0;$d_sroa_0_0_insert_insert99$1=$d_sroa_1_4_extract_shift$0|$b$1&0;$137$0=_i64Add($d_sroa_0_0_insert_insert99$0,$d_sroa_0_0_insert_insert99$1,-1,-1)|0;$137$1=tempRet0;$q_sroa_1_1198=$q_sroa_1_1_ph;$q_sroa_0_1199=$q_sroa_0_1_ph;$r_sroa_1_1200=$r_sroa_1_1_ph;$r_sroa_0_1201=$r_sroa_0_1_ph;$sr_1202=$sr_1_ph;$carry_0203=0;while(1){$147=$q_sroa_0_1199>>>31|$q_sroa_1_1198<<1;$149=$carry_0203|$q_sroa_0_1199<<1;$r_sroa_0_0_insert_insert42$0=$r_sroa_0_1201<<1|$q_sroa_1_1198>>>31|0;$r_sroa_0_0_insert_insert42$1=$r_sroa_0_1201>>>31|$r_sroa_1_1200<<1|0;_i64Subtract($137$0,$137$1,$r_sroa_0_0_insert_insert42$0,$r_sroa_0_0_insert_insert42$1)|0;$150$1=tempRet0;$151$0=$150$1>>31|(($150$1|0)<0?-1:0)<<1;$152=$151$0&1;$154$0=_i64Subtract($r_sroa_0_0_insert_insert42$0,$r_sroa_0_0_insert_insert42$1,$151$0&$d_sroa_0_0_insert_insert99$0,((($150$1|0)<0?-1:0)>>31|(($150$1|0)<0?-1:0)<<1)&$d_sroa_0_0_insert_insert99$1)|0;$r_sroa_0_0_extract_trunc=$154$0;$r_sroa_1_4_extract_trunc=tempRet0;$155=$sr_1202-1|0;if(($155|0)==0){break}else{$q_sroa_1_1198=$147;$q_sroa_0_1199=$149;$r_sroa_1_1200=$r_sroa_1_4_extract_trunc;$r_sroa_0_1201=$r_sroa_0_0_extract_trunc;$sr_1202=$155;$carry_0203=$152}}$q_sroa_1_1_lcssa=$147;$q_sroa_0_1_lcssa=$149;$r_sroa_1_1_lcssa=$r_sroa_1_4_extract_trunc;$r_sroa_0_1_lcssa=$r_sroa_0_0_extract_trunc;$carry_0_lcssa$1=0;$carry_0_lcssa$0=$152}$q_sroa_0_0_insert_ext75$0=$q_sroa_0_1_lcssa;$q_sroa_0_0_insert_ext75$1=0;$q_sroa_0_0_insert_insert77$1=$q_sroa_1_1_lcssa|$q_sroa_0_0_insert_ext75$1;if(($rem|0)!=0){HEAP32[$rem>>2]=$r_sroa_0_1_lcssa;HEAP32[$rem+4>>2]=$r_sroa_1_1_lcssa}$_0$1=($q_sroa_0_0_insert_ext75$0|0)>>>31|$q_sroa_0_0_insert_insert77$1<<1|($q_sroa_0_0_insert_ext75$1<<1|$q_sroa_0_0_insert_ext75$0>>>31)&0|$carry_0_lcssa$1;$_0$0=($q_sroa_0_0_insert_ext75$0<<1|0>>>31)&-2|$carry_0_lcssa$0;return(tempRet0=$_0$1,$_0$0)|0}
// EMSCRIPTEN_END_FUNCS
Module["_malloc"] = _malloc;
Module["_calloc"] = _calloc;
Module["_realloc"] = _realloc;
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
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
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
Runtime.typeInfo = {"[0 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"[13 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":13,"flatFactor":1},"%\"class.std::exception\"":{"alignSize":4,"flatIndexes":[0],"fields":["i32 (...)**"],"flatSize":4,"flatFactor":4,"packed":false},"void (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x i16]":{"alignSize":2,"flatIndexes":[0,2],"fields":["i16","i16"],"flatSize":4,"flatFactor":2},"[72 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":72,"flatFactor":1},"[122 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":122,"flatFactor":1},"[15 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":15,"flatFactor":1},"[0 x void ()*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["void ()*","void ()*"],"flatSize":8,"flatFactor":4},"%struct.malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"%struct.malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"[123 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":123,"flatFactor":1},"%struct.pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[26 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":26,"flatFactor":1},"%struct.pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"%struct.anon":{"alignSize":8,"flatIndexes":[0,4,8,36,72,80,88,104,112,120,128,136,160,164,172,180,188,196,204],"fields":["i32","i8*","[26 x i8]","%struct.__tm","i32","i64","%struct._rand48","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","[8 x i8]","[24 x i8]","i32","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","i32"],"flatSize":208,"packed":false},"[41 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":41,"flatFactor":1},"[119 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":119,"flatFactor":1},"[2 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"%\"struct.std::nothrow_t\"":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1,"packed":false},"{ i8*,i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["i8*","i8*","i8*"],"flatSize":12,"flatFactor":4,"packed":false},"[103 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":103,"flatFactor":1},"%union.anon.0":{"alignSize":8,"flatIndexes":[0,208],"fields":["%struct.anon","[32 x i8]"],"flatSize":240,"flatFactor":208,"packed":false},"i32 (%struct.pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"[70 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":70,"flatFactor":1},"%struct.malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"%struct.malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"[0 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4},"[32 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":32,"flatFactor":1},"[0 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"%struct.pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[96 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":96,"flatFactor":1},"[37 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":37,"flatFactor":1},"[33 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":33,"flatFactor":1},"i8* (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"[1 x i32]":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"i8* (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[22 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":22,"flatFactor":1},"%\"class.std::bad_array_new_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"[9 x double]":{"alignSize":8,"flatIndexes":[0,8,16,24,32,40,48,56,64],"fields":["double","double","double","double","double","double","double","double","double"],"flatSize":72,"flatFactor":8},"%struct.option":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","i32*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[58 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":58,"flatFactor":1},"[65 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":65,"flatFactor":1},"[54 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":54,"flatFactor":1},"[3 x i16]":{"alignSize":2,"flatIndexes":[0,2,4],"fields":["i16","i16","i16"],"flatSize":6,"flatFactor":2},"%struct._glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"[34 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":34,"flatFactor":1},"%struct.malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[2 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct._rand48":{"alignSize":2,"flatIndexes":[0,6,12],"fields":["[3 x i16]","[3 x i16]","i16"],"flatSize":14,"flatFactor":6,"packed":false},"[38 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":38,"flatFactor":1},"[3 x i8]":{"alignSize":1,"flatIndexes":[0,1,2],"fields":["i8","i8","i8"],"flatSize":3,"flatFactor":1},"[21 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":21,"flatFactor":1},"[24 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":24,"flatFactor":1},"{ i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4,"packed":false},"%struct.__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[5 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16],"fields":["i8*","i8*","i8*","i8*","i8*"],"flatSize":20,"flatFactor":4},"[40 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":40,"flatFactor":1},"[0 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[1 x i8]":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1},"%struct._on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"void (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[5 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4],"fields":["i8","i8","i8","i8","i8"],"flatSize":5,"flatFactor":1},"[32 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[113 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":113,"flatFactor":1},"%struct._mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"[0 x double]":{"alignSize":8,"flatIndexes":[0,8],"fields":["double","double"],"flatSize":16,"flatFactor":8},"%struct.__tm":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":36,"flatFactor":4,"packed":false},"[86 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":86,"flatFactor":1},"[16 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":16,"flatFactor":1},"%\"class.std::bad_alloc\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::exception\""],"flatSize":4,"flatFactor":4,"packed":false},"%struct.__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[39 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":39,"flatFactor":1},"[8 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7],"fields":["i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":8,"flatFactor":1},"[32 x void ()*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*"],"flatSize":128,"flatFactor":4},"%union.anon":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4,"packed":false},"[25 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":25,"flatFactor":1},"[32 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":128,"flatFactor":4},"[47 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":47,"flatFactor":1},"[3 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"[0 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4},"void ()":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"%struct._reent":{"alignSize":8,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1064,"packed":false},"%struct.region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"[14 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":14,"flatFactor":1},"[4 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3],"fields":["i8","i8","i8","i8"],"flatSize":4,"flatFactor":1},"[18 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":18,"flatFactor":1},"[0 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"anon":{"alignSize":8,"flatIndexes":[0,4,8,36,72,80,88,104,112,120,128,136,160,164,172,180,188,196,204],"fields":["i32","i8*","[26 x i8]","%struct.__tm","i32","i64","%struct._rand48","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","[8 x i8]","[24 x i8]","i32","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","i32"],"flatSize":208,"packed":false},"[2 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"i32 (pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"_atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[0 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"option":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","i32*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"_glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"_rand48":{"alignSize":2,"flatIndexes":[0,6,12],"fields":["[3 x i16]","[3 x i16]","i16"],"flatSize":14,"flatFactor":6,"packed":false},"__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[0 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"[32 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"_mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"__tm":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":36,"flatFactor":4,"packed":false},"__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[3 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"_Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"_reent":{"alignSize":8,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1064,"packed":false},"region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false}}
Runtime.structMetadata = {}
// === Auto-generated postamble setup entry stuff ===
Module['callMain'] = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
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
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module['callMain'](args);
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
      if (!ABORT) doRun();
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
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
