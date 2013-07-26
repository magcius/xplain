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
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          assert(index === type.fields.length);
          size = 0;
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
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
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
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
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
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
      case 'i64': (tempI64 = [value>>>0,((Math.min((+(Math.floor((value)/(+(4294967296))))), (+(4294967295))))|0)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
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
Math.imul = Math['imul'];
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
STATICTOP = STATIC_BASE + 3184;
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
/* memory initializer */ allocate([111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,115,0,0,0,0,0,0,0,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,99,0,0,0,0,0,0,0,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,128,10,0,0,0,0,0,0,56,10,0,0,0,0,0,0,64,10,0,0,0,0,0,0,80,10,0,0,0,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,255,255,255,255,0,0,0,0,111,112,116,105,111,110,32,100,111,101,115,110,39,116,32,116,97,107,101,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,46,42,115,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,115,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,99,0,0,0,0,255,255,255,255,0,0,0,0,97,109,98,105,103,117,111,117,115,32,111,112,116,105,111,110,32,45,45,32,37,46,42,115,0,0,0,0,0,0,0,0,37,115,58,32,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,50,45,62,120,49,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,38,38,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,121,49,32,60,32,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,117,109,82,101,99,116,115,32,61,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,45,32,99,117,114,95,115,116,97,114,116,32,119,97,115,32,102,97,108,115,101,0,80,79,83,73,88,76,89,95,67,79,82,82,69,67,84,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,71,79,79,68,95,82,69,67,84,32,40,98,111,120,41,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,114,101,99,116,97,110,103,108,101,32,112,97,115,115,101,100,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,10,0,0,0,0,0,0,0,37,115,58,32,0,0,0,0,105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,37,115,10,0,0,0,0,0,37,115,10,0,0,0,0,0,109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,37,100,32,37,100,32,37,100,32,37,100,32,10,0,0,0,37,115,58,32,0,0,0,0,42,42,42,32,66,85,71,32,42,42,42,10,73,110,32,37,115,58,32,37,115,10,83,101,116,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,110,32,39,95,112,105,120,109,97,110,95,108,111,103,95,101,114,114,111,114,39,32,116,111,32,100,101,98,117,103,10,10,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,45,62,120,49,32,60,32,114,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,101,119,95,114,101,99,116,115,32,33,61,32,48,32,119,97,115,32,102,97,108,115,101,0,37,115,58,32,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,58,32,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,49,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,60,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,115,105,122,101,32,119,97,115,32,102,97,108,115,101,0,0,0,101,120,116,101,110,116,115,58,32,37,100,32,37,100,32,37,100,32,37,100,10,0,0,0,110,117,109,58,32,37,100,32,115,105,122,101,58,32,37,100,10,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,115,101,116,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,117,110,105,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,115,117,98,116,114,97,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,105,110,116,101,114,115,101,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,97,112,112,101,110,100,95,110,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,117,110,105,111,110,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,114,101,115,101,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,119,105,116,104,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,111,112,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,111,118,101,114,108,97,112,95,112,114,111,99,95,112,116,114,44,32,105,110,116,44,32,105,110,116,41,0,0,105,110,116,32,112,105,120,109,97,110,95,99,111,97,108,101,115,99,101,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,24,10,0,0,16,0,0,0,26,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,10,0,0,16,0,0,0,6,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,0,0,0,0,208,9,0,0,0,0,0,0,224,9,0,0,16,10,0,0,0,0,0,0,0,0,0,0,240,9,0,0,24,10,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
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
  Module["ERRNO_CODES"] = ERRNO_CODES;
  var ___errno_state=0;
  Module["___errno_state"] = ___errno_state;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  Module["___setErrNo"] = ___setErrNo;
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stdin"] = _stdin;
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stdout"] = _stdout;
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stderr"] = _stderr;
  var __impure_ptr=allocate(1, "i32*", ALLOC_STATIC);
  Module["__impure_ptr"] = __impure_ptr;var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,createFileHandle:function (stream, fd) {
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
        function createSimpleOutput() {
          var fn = function (val) {
            if (val === null || val === 10) {
              fn.printer(fn.buffer.join(''));
              fn.buffer = [];
            } else {
              fn.buffer.push(utf8.processCChar(val));
            }
          };
          return fn;
        }
        if (!output) {
          stdoutOverridden = false;
          output = createSimpleOutput();
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = createSimpleOutput();
        }
        if (!error.printer) error.printer = Module['printErr'];
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
  Module["FS"] = FS;
  function _send(fd, buf, len, flags) {
      var info = FS.streams[fd];
      if (!info) return -1;
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
  Module["_send"] = _send;
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
    }
  Module["_pwrite"] = _pwrite;function _write(fildes, buf, nbyte) {
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
    }
  Module["_write"] = _write;function _fwrite(ptr, size, nitems, stream) {
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
  Module["_fwrite"] = _fwrite;
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }
  Module["__reallyNegative"] = __reallyNegative;function __formatString(format, varargs) {
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
    }
  Module["__formatString"] = __formatString;function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  Module["_fprintf"] = _fprintf;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_llvm_memcpy_p0i8_p0i8_i32"] = _llvm_memcpy_p0i8_p0i8_i32;
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  Module["_llvm_memmove_p0i8_p0i8_i32"] = _llvm_memmove_p0i8_p0i8_i32;
  var _llvm_expect_i32=undefined;
  Module["_llvm_expect_i32"] = _llvm_expect_i32;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  Module["_abort"] = _abort;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_llvm_memset_p0i8_i32"] = _llvm_memset_p0i8_i32;
  function ___errno_location() {
      return ___errno_state;
    }
  Module["___errno_location"] = ___errno_location;var ___errno=___errno_location;
  Module["___errno"] = ___errno;
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
  Module["_sysconf"] = _sysconf;
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  Module["_time"] = _time;
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
  Module["_sbrk"] = _sbrk;
  function ___gxx_personality_v0() {
    }
  Module["___gxx_personality_v0"] = ___gxx_personality_v0;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  Module["___cxa_allocate_exception"] = ___cxa_allocate_exception;
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  Module["_llvm_eh_exception"] = _llvm_eh_exception;
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  Module["__ZSt18uncaught_exceptionv"] = __ZSt18uncaught_exceptionv;
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
    }
  Module["___cxa_is_number_type"] = ___cxa_is_number_type;function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
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
  Module["___cxa_does_inherit"] = ___cxa_does_inherit;
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  Module["___resumeException"] = ___resumeException;function ___cxa_find_matching_catch(thrown, throwntype) {
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
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }
  Module["___cxa_find_matching_catch"] = ___cxa_find_matching_catch;function ___cxa_throw(ptr, type, destructor) {
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
  Module["___cxa_throw"] = ___cxa_throw;
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  Module["___cxa_call_unexpected"] = ___cxa_call_unexpected;
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  Module["___cxa_begin_catch"] = ___cxa_begin_catch;
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }
  Module["___cxa_free_exception"] = ___cxa_free_exception;function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
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
  Module["___cxa_end_catch"] = ___cxa_end_catch;
  var _environ=allocate(1, "i32*", ALLOC_STATIC);
  Module["_environ"] = _environ;var ___environ=_environ;
  Module["___environ"] = ___environ;function ___buildEnvironment(env) {
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
    }
  Module["___buildEnvironment"] = ___buildEnvironment;var ENV={};
  Module["ENV"] = ENV;function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  Module["_getenv"] = _getenv;
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  Module["_strchr"] = _strchr;
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
  Module["_strncmp"] = _strncmp;
  var _llvm_va_start=undefined;
  Module["_llvm_va_start"] = _llvm_va_start;
  function _llvm_va_end() {}
  Module["_llvm_va_end"] = _llvm_va_end;
  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }
  Module["_vfprintf"] = _vfprintf;
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",75:"Inode is remote (not really error)",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",79:"Inappropriate file type or format",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can\t access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",89:"No more files",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"ENETRESET",127:"Socket is already connected",128:"Socket is not connected",129:"TOOMANYREFS",130:"EPROCLIM",131:"EUSERS",132:"EDQUOT",133:"ESTALE",134:"Not supported",135:"No medium (in tape drive)",136:"No such host or network path",137:"Filename exists with different case",138:"EILSEQ",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};
  Module["ERRNO_MESSAGES"] = ERRNO_MESSAGES;function _strerror_r(errnum, strerrbuf, buflen) {
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
    }
  Module["_strerror_r"] = _strerror_r;function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  Module["_strerror"] = _strerror;
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
    }
  Module["__exit"] = __exit;function _exit(status) {
      __exit(status);
    }
  Module["_exit"] = _exit;
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
  Module["_fputc"] = _fputc;
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    }
  Module["_isspace"] = _isspace;
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
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
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
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
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
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
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
  Module["Browser"] = Browser;
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
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    return Module["dynCall_iiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'use asm';
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;
  var ctlz_i8=env.ctlz_i8|0;
  var __ZTVN10__cxxabiv120__si_class_type_infoE=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;
  var _stderr=env._stderr|0;
  var __ZTVN10__cxxabiv117__class_type_infoE=env.__ZTVN10__cxxabiv117__class_type_infoE|0;
  var ___progname=env.___progname|0;
  var NaN=+env.NaN;
  var Infinity=+env.Infinity;
  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var invoke_iiiiiiii=env.invoke_iiiiiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_ii=env.invoke_ii;
  var invoke_viii=env.invoke_viii;
  var invoke_v=env.invoke_v;
  var invoke_iii=env.invoke_iii;
  var _strncmp=env._strncmp;
  var _llvm_va_end=env._llvm_va_end;
  var _sysconf=env._sysconf;
  var ___cxa_throw=env.___cxa_throw;
  var _strerror=env._strerror;
  var _abort=env._abort;
  var _fprintf=env._fprintf;
  var _llvm_eh_exception=env._llvm_eh_exception;
  var ___cxa_free_exception=env.___cxa_free_exception;
  var ___buildEnvironment=env.___buildEnvironment;
  var __reallyNegative=env.__reallyNegative;
  var _strchr=env._strchr;
  var _fputc=env._fputc;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _send=env._send;
  var _write=env._write;
  var _exit=env._exit;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var _isspace=env._isspace;
  var ___cxa_is_number_type=env.___cxa_is_number_type;
  var ___resumeException=env.___resumeException;
  var __formatString=env.__formatString;
  var ___cxa_does_inherit=env.___cxa_does_inherit;
  var _getenv=env._getenv;
  var _vfprintf=env._vfprintf;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var _pwrite=env._pwrite;
  var ___cxa_call_unexpected=env.___cxa_call_unexpected;
  var _sbrk=env._sbrk;
  var _strerror_r=env._strerror_r;
  var ___errno_location=env.___errno_location;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var _time=env._time;
  var __exit=env.__exit;
  var ___cxa_end_catch=env.___cxa_end_catch;
// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP;
 STACKTOP = STACKTOP + size | 0;
 STACKTOP = STACKTOP + 7 >> 3 << 3;
 return ret | 0;
}
function stackSave() {
 return STACKTOP | 0;
}
function stackRestore(top) {
 top = top | 0;
 STACKTOP = top;
}
function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if ((__THREW__ | 0) == 0) {
  __THREW__ = threw;
  threwValue = value;
 }
}
function copyTempFloat(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0];
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0];
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0];
}
function copyTempDouble(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0];
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0];
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0];
 HEAP8[tempDoublePtr + 4 | 0] = HEAP8[ptr + 4 | 0];
 HEAP8[tempDoublePtr + 5 | 0] = HEAP8[ptr + 5 | 0];
 HEAP8[tempDoublePtr + 6 | 0] = HEAP8[ptr + 6 | 0];
 HEAP8[tempDoublePtr + 7 | 0] = HEAP8[ptr + 7 | 0];
}
function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value;
}
function setTempRet1(value) {
 value = value | 0;
 tempRet1 = value;
}
function setTempRet2(value) {
 value = value | 0;
 tempRet2 = value;
}
function setTempRet3(value) {
 value = value | 0;
 tempRet3 = value;
}
function setTempRet4(value) {
 value = value | 0;
 tempRet4 = value;
}
function setTempRet5(value) {
 value = value | 0;
 tempRet5 = value;
}
function setTempRet6(value) {
 value = value | 0;
 tempRet6 = value;
}
function setTempRet7(value) {
 value = value | 0;
 tempRet7 = value;
}
function setTempRet8(value) {
 value = value | 0;
 tempRet8 = value;
}
function setTempRet9(value) {
 value = value | 0;
 tempRet9 = value;
}
function runPostSets() {
 HEAP32[644] = __ZTVN10__cxxabiv117__class_type_infoE + 8;
 HEAP32[646] = __ZTVN10__cxxabiv120__si_class_type_infoE + 8;
 HEAP32[650] = __ZTVN10__cxxabiv120__si_class_type_infoE + 8;
}
function _pixman_region32_equal($reg1, $reg2) {
 $reg1 = $reg1 | 0;
 $reg2 = $reg2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $i = 0, $rects1 = 0, $rects2 = 0, $60 = 0, $73 = 0, $91 = 0, $106 = 0, $121 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $reg1;
  $3 = $reg2;
  if ((HEAP32[$2 >> 2] | 0) != (HEAP32[$3 >> 2] | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $1 = 0;
  label = 39;
  break;
 case 3:
  if ((HEAP32[$2 + 8 >> 2] | 0) != (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  $1 = 0;
  label = 39;
  break;
 case 5:
  if ((HEAP32[$2 + 4 >> 2] | 0) != (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 6;
   break;
  } else {
   label = 7;
   break;
  }
 case 6:
  $1 = 0;
  label = 39;
  break;
 case 7:
  if ((HEAP32[$2 + 12 >> 2] | 0) != (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $1 = 0;
  label = 39;
  break;
 case 9:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 11;
   break;
  }
 case 10:
  $60 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 12;
  break;
 case 11:
  $60 = 1;
  label = 12;
  break;
 case 12:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  $73 = HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 15;
  break;
 case 14:
  $73 = 1;
  label = 15;
  break;
 case 15:
  if (($60 | 0) != ($73 | 0)) {
   label = 16;
   break;
  } else {
   label = 17;
   break;
  }
 case 16:
  $1 = 0;
  label = 39;
  break;
 case 17:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  $91 = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  label = 20;
  break;
 case 19:
  $91 = $2 | 0;
  label = 20;
  break;
 case 20:
  $rects1 = $91;
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 21;
   break;
  } else {
   label = 22;
   break;
  }
 case 21:
  $106 = (HEAP32[$3 + 16 >> 2] | 0) + 8 | 0;
  label = 23;
  break;
 case 22:
  $106 = $3 | 0;
  label = 23;
  break;
 case 23:
  $rects2 = $106;
  $i = 0;
  label = 24;
  break;
 case 24:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 25;
   break;
  } else {
   label = 26;
   break;
  }
 case 25:
  $121 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 27;
  break;
 case 26:
  $121 = 1;
  label = 27;
  break;
 case 27:
  if (($i | 0) != ($121 | 0)) {
   label = 28;
   break;
  } else {
   label = 38;
   break;
  }
 case 28:
  if ((HEAP32[$rects1 + ($i << 4) >> 2] | 0) != (HEAP32[$rects2 + ($i << 4) >> 2] | 0)) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  $1 = 0;
  label = 39;
  break;
 case 30:
  if ((HEAP32[$rects1 + ($i << 4) + 8 >> 2] | 0) != (HEAP32[$rects2 + ($i << 4) + 8 >> 2] | 0)) {
   label = 31;
   break;
  } else {
   label = 32;
   break;
  }
 case 31:
  $1 = 0;
  label = 39;
  break;
 case 32:
  if ((HEAP32[$rects1 + ($i << 4) + 4 >> 2] | 0) != (HEAP32[$rects2 + ($i << 4) + 4 >> 2] | 0)) {
   label = 33;
   break;
  } else {
   label = 34;
   break;
  }
 case 33:
  $1 = 0;
  label = 39;
  break;
 case 34:
  if ((HEAP32[$rects1 + ($i << 4) + 12 >> 2] | 0) != (HEAP32[$rects2 + ($i << 4) + 12 >> 2] | 0)) {
   label = 35;
   break;
  } else {
   label = 36;
   break;
  }
 case 35:
  $1 = 0;
  label = 39;
  break;
 case 36:
  label = 37;
  break;
 case 37:
  $i = $i + 1 | 0;
  label = 24;
  break;
 case 38:
  $1 = 1;
  label = 39;
  break;
 case 39:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_n_rects($region) {
 $region = $region | 0;
 var $1 = 0, $14 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $14 = HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 4;
  break;
 case 3:
  $14 = 1;
  label = 4;
  break;
 case 4:
  return $14 | 0;
 }
 return 0;
}
function _pixman_region32_rectangles($region, $n_rects) {
 $region = $region | 0;
 $n_rects = $n_rects | 0;
 var $1 = 0, $2 = 0, $18 = 0, $35 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  $2 = $n_rects;
  if (($2 | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 6;
   break;
  }
 case 2:
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  $18 = HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 5;
  break;
 case 4:
  $18 = 1;
  label = 5;
  break;
 case 5:
  HEAP32[$2 >> 2] = $18;
  label = 6;
  break;
 case 6:
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  $35 = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  label = 9;
  break;
 case 8:
  $35 = $1 | 0;
  label = 9;
  break;
 case 9:
  return $35 | 0;
 }
 return 0;
}
function _pixman_region32_print($rgn) {
 $rgn = $rgn | 0;
 var $1 = 0, $num = 0, $i = 0, $rects = 0, $14 = 0, $27 = 0, $42 = 0, $55 = 0, $59 = 0, $63 = 0, $80 = 0, $85 = 0, $90 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $rgn;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $14 = HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 4;
  break;
 case 3:
  $14 = 1;
  label = 4;
  break;
 case 4:
  $num = $14;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  $27 = HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0;
  label = 7;
  break;
 case 6:
  $27 = 0;
  label = 7;
  break;
 case 7:
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $42 = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  label = 10;
  break;
 case 9:
  $42 = $1 | 0;
  label = 10;
  break;
 case 10:
  $rects = $42;
  _fprintf(HEAP32[_stderr >> 2] | 0, 1408, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $num, HEAP32[tempInt + 8 >> 2] = $27, tempInt) | 0) | 0;
  $55 = HEAP32[$1 + 4 >> 2] | 0;
  $59 = HEAP32[$1 + 8 >> 2] | 0;
  $63 = HEAP32[$1 + 12 >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 1384, (tempInt = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempInt >> 2] = HEAP32[$1 >> 2], HEAP32[tempInt + 8 >> 2] = $55, HEAP32[tempInt + 16 >> 2] = $59, HEAP32[tempInt + 24 >> 2] = $63, tempInt) | 0) | 0;
  $i = 0;
  label = 11;
  break;
 case 11:
  if (($i | 0) < ($num | 0)) {
   label = 12;
   break;
  } else {
   label = 14;
   break;
  }
 case 12:
  $80 = HEAP32[$rects + ($i << 4) + 4 >> 2] | 0;
  $85 = HEAP32[$rects + ($i << 4) + 8 >> 2] | 0;
  $90 = HEAP32[$rects + ($i << 4) + 12 >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 784, (tempInt = STACKTOP, STACKTOP = STACKTOP + 32 | 0, HEAP32[tempInt >> 2] = HEAP32[$rects + ($i << 4) >> 2], HEAP32[tempInt + 8 >> 2] = $80, HEAP32[tempInt + 16 >> 2] = $85, HEAP32[tempInt + 24 >> 2] = $90, tempInt) | 0) | 0;
  label = 13;
  break;
 case 13:
  $i = $i + 1 | 0;
  label = 11;
  break;
 case 14:
  _fprintf(HEAP32[_stderr >> 2] | 0, 688, (tempInt = STACKTOP, STACKTOP = STACKTOP + 1 | 0, STACKTOP = STACKTOP + 7 >> 3 << 3, HEAP32[tempInt >> 2] = 0, tempInt) | 0) | 0;
  STACKTOP = sp;
  return $num | 0;
 }
 return 0;
}
function _pixman_region32_init($region) {
 $region = $region | 0;
 var $1 = 0, $5 = 0, $6 = 0;
 $1 = $region;
 $5 = $1 | 0;
 $6 = HEAP32[44] | 0;
 HEAP32[$5 >> 2] = HEAP32[$6 >> 2];
 HEAP32[$5 + 4 >> 2] = HEAP32[$6 + 4 >> 2];
 HEAP32[$5 + 8 >> 2] = HEAP32[$6 + 8 >> 2];
 HEAP32[$5 + 12 >> 2] = HEAP32[$6 + 12 >> 2];
 HEAP32[$1 + 16 >> 2] = HEAP32[42];
 return;
}
function _pixman_region32_init_rect($region, $x, $y, $width, $height) {
 $region = $region | 0;
 $x = $x | 0;
 $y = $y | 0;
 $width = $width | 0;
 $height = $height | 0;
 var $1 = 0, $2 = 0, $3 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  $2 = $x;
  $3 = $y;
  HEAP32[$1 >> 2] = $2;
  HEAP32[$1 + 4 >> 2] = $3;
  HEAP32[$1 + 8 >> 2] = $2 + $width;
  HEAP32[$1 + 12 >> 2] = $3 + $height;
  if ((HEAP32[$1 >> 2] | 0) < (HEAP32[$1 + 8 >> 2] | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[$1 + 4 >> 2] | 0) < (HEAP32[$1 + 12 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  if ((HEAP32[$1 >> 2] | 0) > (HEAP32[$1 + 8 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$1 + 4 >> 2] | 0) > (HEAP32[$1 + 12 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  __pixman_log_error(2208, 640);
  label = 6;
  break;
 case 6:
  _pixman_region32_init($1);
  label = 8;
  break;
 case 7:
  HEAP32[$1 + 16 >> 2] = 0;
  label = 8;
  break;
 case 8:
  return;
 }
}
function _pixman_region32_init_with_extents($region, $extents) {
 $region = $region | 0;
 $extents = $extents | 0;
 var $1 = 0, $2 = 0, $41 = 0, $42 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  $2 = $extents;
  if ((HEAP32[$2 >> 2] | 0) < (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[$2 + 4 >> 2] | 0) < (HEAP32[$2 + 12 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  if ((HEAP32[$2 >> 2] | 0) > (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$2 + 4 >> 2] | 0) > (HEAP32[$2 + 12 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  __pixman_log_error(2136, 640);
  label = 6;
  break;
 case 6:
  _pixman_region32_init($1);
  label = 8;
  break;
 case 7:
  $41 = $1 | 0;
  $42 = $2;
  HEAP32[$41 >> 2] = HEAP32[$42 >> 2];
  HEAP32[$41 + 4 >> 2] = HEAP32[$42 + 4 >> 2];
  HEAP32[$41 + 8 >> 2] = HEAP32[$42 + 8 >> 2];
  HEAP32[$41 + 12 >> 2] = HEAP32[$42 + 12 >> 2];
  HEAP32[$1 + 16 >> 2] = 0;
  label = 8;
  break;
 case 8:
  return;
 }
}
function _pixman_region32_fini($region) {
 $region = $region | 0;
 var $1 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 4;
   break;
  }
 case 2:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 4;
  break;
 case 4:
  return;
 }
}
function _pixman_region32_copy($dst, $src) {
 $dst = $dst | 0;
 $src = $src | 0;
 var $1 = 0, $2 = 0, $3 = 0, $13 = 0, $14 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $dst;
  $3 = $src;
  if (($2 | 0) == ($3 | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $1 = 1;
  label = 18;
  break;
 case 3:
  $13 = $2 | 0;
  $14 = $3 | 0;
  HEAP32[$13 >> 2] = HEAP32[$14 >> 2];
  HEAP32[$13 + 4 >> 2] = HEAP32[$14 + 4 >> 2];
  HEAP32[$13 + 8 >> 2] = HEAP32[$14 + 8 >> 2];
  HEAP32[$13 + 12 >> 2] = HEAP32[$14 + 12 >> 2];
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  if ((HEAP32[HEAP32[$3 + 16 >> 2] >> 2] | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 6;
   break;
  } else {
   label = 8;
   break;
  }
 case 6:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 8;
  break;
 case 8:
  HEAP32[$2 + 16 >> 2] = HEAP32[$3 + 16 >> 2];
  $1 = 1;
  label = 18;
  break;
 case 9:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 11;
   break;
  }
 case 10:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) < (HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0)) {
   label = 11;
   break;
  } else {
   label = 17;
   break;
  }
 case 11:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 12;
   break;
  } else {
   label = 14;
   break;
  }
 case 12:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 14;
  break;
 case 14:
  HEAP32[$2 + 16 >> 2] = _alloc_data(HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0) | 0;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 16;
   break;
  } else {
   label = 15;
   break;
  }
 case 15:
  $1 = _pixman_break($2) | 0;
  label = 18;
  break;
 case 16:
  HEAP32[HEAP32[$2 + 16 >> 2] >> 2] = HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2];
  label = 17;
  break;
 case 17:
  HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] = HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2];
  _memmove((HEAP32[$2 + 16 >> 2] | 0) + 8 | 0, (HEAP32[$3 + 16 >> 2] | 0) + 8 | 0, HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4 | 0);
  $1 = 1;
  label = 18;
  break;
 case 18:
  return $1 | 0;
 }
 return 0;
}
function _alloc_data($n) {
 $n = $n | 0;
 var $1 = 0, $sz = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $sz = _PIXREGION_SZOF($n) | 0;
  if (($sz | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $1 = 0;
  label = 4;
  break;
 case 3:
  $1 = _malloc($sz) | 0;
  label = 4;
  break;
 case 4:
  return $1 | 0;
 }
 return 0;
}
function _pixman_break($region) {
 $region = $region | 0;
 var $1 = 0, $22 = 0, $23 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 4;
   break;
  }
 case 2:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 4;
  break;
 case 4:
  $22 = $1 | 0;
  $23 = HEAP32[44] | 0;
  HEAP32[$22 >> 2] = HEAP32[$23 >> 2];
  HEAP32[$22 + 4 >> 2] = HEAP32[$23 + 4 >> 2];
  HEAP32[$22 + 8 >> 2] = HEAP32[$23 + 8 >> 2];
  HEAP32[$22 + 12 >> 2] = HEAP32[$23 + 12 >> 2];
  HEAP32[$1 + 16 >> 2] = HEAP32[46];
  return 0;
 }
 return 0;
}
function _pixman_region32_intersect($new_reg, $reg1, $reg2) {
 $new_reg = $new_reg | 0;
 $reg1 = $reg1 | 0;
 $reg2 = $reg2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $151 = 0, $175 = 0, $199 = 0, $223 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $new_reg;
  $3 = $reg1;
  $4 = $reg2;
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 9;
   break;
  }
 case 3:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  if ((HEAP32[(HEAP32[$4 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 9;
   break;
  }
 case 5:
  if ((HEAP32[$3 + 8 >> 2] | 0) <= (HEAP32[$4 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ((HEAP32[$3 >> 2] | 0) >= (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if ((HEAP32[$3 + 12 >> 2] | 0) <= (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ((HEAP32[$3 + 4 >> 2] | 0) >= (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 17;
   break;
  }
 case 9:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 12;
   break;
  }
 case 10:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 12;
  break;
 case 12:
  HEAP32[$2 + 8 >> 2] = HEAP32[$2 >> 2];
  HEAP32[$2 + 12 >> 2] = HEAP32[$2 + 4 >> 2];
  if ((HEAP32[$3 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 14;
   break;
  } else {
   label = 13;
   break;
  }
 case 13:
  if ((HEAP32[$4 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 14;
   break;
  } else {
   label = 15;
   break;
  }
 case 14:
  HEAP32[$2 + 16 >> 2] = HEAP32[46];
  $1 = 0;
  label = 57;
  break;
 case 15:
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  label = 16;
  break;
 case 16:
  label = 56;
  break;
 case 17:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 35;
   break;
  } else {
   label = 18;
   break;
  }
 case 18:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 35;
   break;
  } else {
   label = 19;
   break;
  }
 case 19:
  if ((HEAP32[$3 >> 2] | 0) > (HEAP32[$4 >> 2] | 0)) {
   label = 20;
   break;
  } else {
   label = 21;
   break;
  }
 case 20:
  $151 = HEAP32[$3 >> 2] | 0;
  label = 22;
  break;
 case 21:
  $151 = HEAP32[$4 >> 2] | 0;
  label = 22;
  break;
 case 22:
  HEAP32[$2 >> 2] = $151;
  if ((HEAP32[$3 + 4 >> 2] | 0) > (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 23;
   break;
  } else {
   label = 24;
   break;
  }
 case 23:
  $175 = HEAP32[$3 + 4 >> 2] | 0;
  label = 25;
  break;
 case 24:
  $175 = HEAP32[$4 + 4 >> 2] | 0;
  label = 25;
  break;
 case 25:
  HEAP32[$2 + 4 >> 2] = $175;
  if ((HEAP32[$3 + 8 >> 2] | 0) < (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 26;
   break;
  } else {
   label = 27;
   break;
  }
 case 26:
  $199 = HEAP32[$3 + 8 >> 2] | 0;
  label = 28;
  break;
 case 27:
  $199 = HEAP32[$4 + 8 >> 2] | 0;
  label = 28;
  break;
 case 28:
  HEAP32[$2 + 8 >> 2] = $199;
  if ((HEAP32[$3 + 12 >> 2] | 0) < (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  $223 = HEAP32[$3 + 12 >> 2] | 0;
  label = 31;
  break;
 case 30:
  $223 = HEAP32[$4 + 12 >> 2] | 0;
  label = 31;
  break;
 case 31:
  HEAP32[$2 + 12 >> 2] = $223;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 32;
   break;
  } else {
   label = 34;
   break;
  }
 case 32:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 33;
   break;
  } else {
   label = 34;
   break;
  }
 case 33:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 34;
  break;
 case 34:
  HEAP32[$2 + 16 >> 2] = 0;
  label = 55;
  break;
 case 35:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 41;
   break;
  } else {
   label = 36;
   break;
  }
 case 36:
  if ((HEAP32[$4 >> 2] | 0) <= (HEAP32[$3 >> 2] | 0)) {
   label = 37;
   break;
  } else {
   label = 41;
   break;
  }
 case 37:
  if ((HEAP32[$4 + 8 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 38;
   break;
  } else {
   label = 41;
   break;
  }
 case 38:
  if ((HEAP32[$4 + 4 >> 2] | 0) <= (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 39;
   break;
  } else {
   label = 41;
   break;
  }
 case 39:
  if ((HEAP32[$4 + 12 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 40;
   break;
  } else {
   label = 41;
   break;
  }
 case 40:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 57;
  break;
 case 41:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 47;
   break;
  } else {
   label = 42;
   break;
  }
 case 42:
  if ((HEAP32[$3 >> 2] | 0) <= (HEAP32[$4 >> 2] | 0)) {
   label = 43;
   break;
  } else {
   label = 47;
   break;
  }
 case 43:
  if ((HEAP32[$3 + 8 >> 2] | 0) >= (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 44;
   break;
  } else {
   label = 47;
   break;
  }
 case 44:
  if ((HEAP32[$3 + 4 >> 2] | 0) <= (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 45;
   break;
  } else {
   label = 47;
   break;
  }
 case 45:
  if ((HEAP32[$3 + 12 >> 2] | 0) >= (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 46;
   break;
  } else {
   label = 47;
   break;
  }
 case 46:
  $1 = _pixman_region32_copy($2, $4) | 0;
  label = 57;
  break;
 case 47:
  if (($3 | 0) == ($4 | 0)) {
   label = 48;
   break;
  } else {
   label = 49;
   break;
  }
 case 48:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 57;
  break;
 case 49:
  if ((_pixman_op($2, $3, $4, 18, 0, 0) | 0) != 0) {
   label = 51;
   break;
  } else {
   label = 50;
   break;
  }
 case 50:
  $1 = 0;
  label = 57;
  break;
 case 51:
  _pixman_set_extents($2);
  label = 52;
  break;
 case 52:
  label = 53;
  break;
 case 53:
  label = 54;
  break;
 case 54:
  label = 55;
  break;
 case 55:
  label = 56;
  break;
 case 56:
  $1 = 1;
  label = 57;
  break;
 case 57:
  return $1 | 0;
 }
 return 0;
}
function _pixman_op($new_reg, $reg1, $reg2, $overlap_func, $append_non1, $append_non2) {
 $new_reg = $new_reg | 0;
 $reg1 = $reg1 | 0;
 $reg2 = $reg2 | 0;
 $overlap_func = $overlap_func | 0;
 $append_non1 = $append_non1 | 0;
 $append_non2 = $append_non2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $6 = 0, $7 = 0, $r1 = 0, $r2 = 0, $r1_end = 0, $r2_end = 0, $ybot = 0, $ytop = 0, $old_data = 0, $prev_band = 0, $cur_band = 0, $r1_band_end = 0, $r2_band_end = 0, $top = 0, $bot = 0, $r1y1 = 0, $r2y1 = 0, $new_size = 0, $numRects = 0, $new_rects = 0, $new_rects1 = 0, $new_data = 0, $data_size = 0, $37 = 0, $50 = 0, $66 = 0, $81 = 0, $191 = 0, $232 = 0, $255 = 0, $276 = 0, $289 = 0, $348 = 0, $361 = 0, $424 = 0, $493 = 0, $519 = 0, $541 = 0, $576 = 0, $627 = 0, $657 = 0, $679 = 0, $714 = 0, $765 = 0, $778 = 0, $812 = 0, $813 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $new_reg;
  $3 = $reg1;
  $4 = $reg2;
  $6 = $append_non1;
  $7 = $append_non2;
  if ((HEAP32[$3 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  if ((HEAP32[$4 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  $1 = _pixman_break($2) | 0;
  label = 213;
  break;
 case 4:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  $37 = (HEAP32[$3 + 16 >> 2] | 0) + 8 | 0;
  label = 7;
  break;
 case 6:
  $37 = $3 | 0;
  label = 7;
  break;
 case 7:
  $r1 = $37;
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $50 = HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 10;
  break;
 case 9:
  $50 = 1;
  label = 10;
  break;
 case 10:
  $new_size = $50;
  $r1_end = $r1 + ($new_size << 4) | 0;
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  $66 = HEAP32[(HEAP32[$4 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 13;
  break;
 case 12:
  $66 = 1;
  label = 13;
  break;
 case 13:
  $numRects = $66;
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 14;
   break;
  } else {
   label = 15;
   break;
  }
 case 14:
  $81 = (HEAP32[$4 + 16 >> 2] | 0) + 8 | 0;
  label = 16;
  break;
 case 15:
  $81 = $4 | 0;
  label = 16;
  break;
 case 16:
  $r2 = $81;
  $r2_end = $r2 + ($numRects << 4) | 0;
  label = 17;
  break;
 case 17:
  if (((($r1 | 0) != ($r1_end | 0) ^ 1) & 1 | 0) != 0) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  __pixman_log_error(2296, 1040);
  label = 19;
  break;
 case 19:
  label = 20;
  break;
 case 20:
  label = 21;
  break;
 case 21:
  if (((($r2 | 0) != ($r2_end | 0) ^ 1) & 1 | 0) != 0) {
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 22:
  __pixman_log_error(2296, 976);
  label = 23;
  break;
 case 23:
  label = 24;
  break;
 case 24:
  $old_data = 0;
  if (($2 | 0) == ($3 | 0)) {
   label = 25;
   break;
  } else {
   label = 26;
   break;
  }
 case 25:
  if (($new_size | 0) > 1) {
   label = 28;
   break;
  } else {
   label = 26;
   break;
  }
 case 26:
  if (($2 | 0) == ($4 | 0)) {
   label = 27;
   break;
  } else {
   label = 29;
   break;
  }
 case 27:
  if (($numRects | 0) > 1) {
   label = 28;
   break;
  } else {
   label = 29;
   break;
  }
 case 28:
  $old_data = HEAP32[$2 + 16 >> 2] | 0;
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  label = 29;
  break;
 case 29:
  if (($numRects | 0) > ($new_size | 0)) {
   label = 30;
   break;
  } else {
   label = 31;
   break;
  }
 case 30:
  $new_size = $numRects;
  label = 31;
  break;
 case 31:
  $new_size = $new_size << 1;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 33;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  label = 36;
  break;
 case 33:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 34;
   break;
  } else {
   label = 35;
   break;
  }
 case 34:
  HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] = 0;
  label = 35;
  break;
 case 35:
  label = 36;
  break;
 case 36:
  if (($new_size | 0) > (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 37;
   break;
  } else {
   label = 40;
   break;
  }
 case 37:
  if ((_pixman_rect_alloc($2, $new_size) | 0) != 0) {
   label = 39;
   break;
  } else {
   label = 38;
   break;
  }
 case 38:
  _free($old_data);
  $1 = 0;
  label = 213;
  break;
 case 39:
  label = 40;
  break;
 case 40:
  if ((HEAP32[$r1 + 4 >> 2] | 0) < (HEAP32[$r2 + 4 >> 2] | 0)) {
   label = 41;
   break;
  } else {
   label = 42;
   break;
  }
 case 41:
  $191 = HEAP32[$r1 + 4 >> 2] | 0;
  label = 43;
  break;
 case 42:
  $191 = HEAP32[$r2 + 4 >> 2] | 0;
  label = 43;
  break;
 case 43:
  $ybot = $191;
  $prev_band = 0;
  label = 44;
  break;
 case 44:
  label = 45;
  break;
 case 45:
  if (((($r1 | 0) != ($r1_end | 0) ^ 1) & 1 | 0) != 0) {
   label = 46;
   break;
  } else {
   label = 47;
   break;
  }
 case 46:
  __pixman_log_error(2296, 1040);
  label = 47;
  break;
 case 47:
  label = 48;
  break;
 case 48:
  label = 49;
  break;
 case 49:
  if (((($r2 | 0) != ($r2_end | 0) ^ 1) & 1 | 0) != 0) {
   label = 50;
   break;
  } else {
   label = 51;
   break;
  }
 case 50:
  __pixman_log_error(2296, 976);
  label = 51;
  break;
 case 51:
  label = 52;
  break;
 case 52:
  label = 53;
  break;
 case 53:
  $r1y1 = HEAP32[$r1 + 4 >> 2] | 0;
  $r1_band_end = $r1 + 16 | 0;
  label = 54;
  break;
 case 54:
  if (($r1_band_end | 0) != ($r1_end | 0)) {
   label = 55;
   break;
  } else {
   $232 = 0;
   label = 56;
   break;
  }
 case 55:
  $232 = (HEAP32[$r1_band_end + 4 >> 2] | 0) == ($r1y1 | 0);
  label = 56;
  break;
 case 56:
  if ($232) {
   label = 57;
   break;
  } else {
   label = 58;
   break;
  }
 case 57:
  $r1_band_end = $r1_band_end + 16 | 0;
  label = 54;
  break;
 case 58:
  label = 59;
  break;
 case 59:
  label = 60;
  break;
 case 60:
  $r2y1 = HEAP32[$r2 + 4 >> 2] | 0;
  $r2_band_end = $r2 + 16 | 0;
  label = 61;
  break;
 case 61:
  if (($r2_band_end | 0) != ($r2_end | 0)) {
   label = 62;
   break;
  } else {
   $255 = 0;
   label = 63;
   break;
  }
 case 62:
  $255 = (HEAP32[$r2_band_end + 4 >> 2] | 0) == ($r2y1 | 0);
  label = 63;
  break;
 case 63:
  if ($255) {
   label = 64;
   break;
  } else {
   label = 65;
   break;
  }
 case 64:
  $r2_band_end = $r2_band_end + 16 | 0;
  label = 61;
  break;
 case 65:
  label = 66;
  break;
 case 66:
  if (($r1y1 | 0) < ($r2y1 | 0)) {
   label = 67;
   break;
  } else {
   label = 85;
   break;
  }
 case 67:
  if (($6 | 0) != 0) {
   label = 68;
   break;
  } else {
   label = 84;
   break;
  }
 case 68:
  if (($r1y1 | 0) > ($ybot | 0)) {
   label = 69;
   break;
  } else {
   label = 70;
   break;
  }
 case 69:
  $276 = $r1y1;
  label = 71;
  break;
 case 70:
  $276 = $ybot;
  label = 71;
  break;
 case 71:
  $top = $276;
  if ((HEAP32[$r1 + 12 >> 2] | 0) < ($r2y1 | 0)) {
   label = 72;
   break;
  } else {
   label = 73;
   break;
  }
 case 72:
  $289 = HEAP32[$r1 + 12 >> 2] | 0;
  label = 74;
  break;
 case 73:
  $289 = $r2y1;
  label = 74;
  break;
 case 74:
  $bot = $289;
  if (($top | 0) != ($bot | 0)) {
   label = 75;
   break;
  } else {
   label = 83;
   break;
  }
 case 75:
  $cur_band = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if ((_pixman_region_append_non_o($2, $r1, $r1_band_end, $top, $bot) | 0) != 0) {
   label = 77;
   break;
  } else {
   label = 76;
   break;
  }
 case 76:
  label = 212;
  break;
 case 77:
  label = 78;
  break;
 case 78:
  if (($cur_band - $prev_band | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $cur_band | 0)) {
   label = 79;
   break;
  } else {
   label = 80;
   break;
  }
 case 79:
  $prev_band = _pixman_coalesce($2, $prev_band, $cur_band) | 0;
  label = 81;
  break;
 case 80:
  $prev_band = $cur_band;
  label = 81;
  break;
 case 81:
  label = 82;
  break;
 case 82:
  label = 83;
  break;
 case 83:
  label = 84;
  break;
 case 84:
  $ytop = $r2y1;
  label = 106;
  break;
 case 85:
  if (($r2y1 | 0) < ($r1y1 | 0)) {
   label = 86;
   break;
  } else {
   label = 104;
   break;
  }
 case 86:
  if (($7 | 0) != 0) {
   label = 87;
   break;
  } else {
   label = 103;
   break;
  }
 case 87:
  if (($r2y1 | 0) > ($ybot | 0)) {
   label = 88;
   break;
  } else {
   label = 89;
   break;
  }
 case 88:
  $348 = $r2y1;
  label = 90;
  break;
 case 89:
  $348 = $ybot;
  label = 90;
  break;
 case 90:
  $top = $348;
  if ((HEAP32[$r2 + 12 >> 2] | 0) < ($r1y1 | 0)) {
   label = 91;
   break;
  } else {
   label = 92;
   break;
  }
 case 91:
  $361 = HEAP32[$r2 + 12 >> 2] | 0;
  label = 93;
  break;
 case 92:
  $361 = $r1y1;
  label = 93;
  break;
 case 93:
  $bot = $361;
  if (($top | 0) != ($bot | 0)) {
   label = 94;
   break;
  } else {
   label = 102;
   break;
  }
 case 94:
  $cur_band = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if ((_pixman_region_append_non_o($2, $r2, $r2_band_end, $top, $bot) | 0) != 0) {
   label = 96;
   break;
  } else {
   label = 95;
   break;
  }
 case 95:
  label = 212;
  break;
 case 96:
  label = 97;
  break;
 case 97:
  if (($cur_band - $prev_band | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $cur_band | 0)) {
   label = 98;
   break;
  } else {
   label = 99;
   break;
  }
 case 98:
  $prev_band = _pixman_coalesce($2, $prev_band, $cur_band) | 0;
  label = 100;
  break;
 case 99:
  $prev_band = $cur_band;
  label = 100;
  break;
 case 100:
  label = 101;
  break;
 case 101:
  label = 102;
  break;
 case 102:
  label = 103;
  break;
 case 103:
  $ytop = $r1y1;
  label = 105;
  break;
 case 104:
  $ytop = $r1y1;
  label = 105;
  break;
 case 105:
  label = 106;
  break;
 case 106:
  if ((HEAP32[$r1 + 12 >> 2] | 0) < (HEAP32[$r2 + 12 >> 2] | 0)) {
   label = 107;
   break;
  } else {
   label = 108;
   break;
  }
 case 107:
  $424 = HEAP32[$r1 + 12 >> 2] | 0;
  label = 109;
  break;
 case 108:
  $424 = HEAP32[$r2 + 12 >> 2] | 0;
  label = 109;
  break;
 case 109:
  $ybot = $424;
  if (($ybot | 0) > ($ytop | 0)) {
   label = 110;
   break;
  } else {
   label = 118;
   break;
  }
 case 110:
  $cur_band = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if ((FUNCTION_TABLE_iiiiiiii[$overlap_func & 63]($2, $r1, $r1_band_end, $r2, $r2_band_end, $ytop, $ybot) | 0) != 0) {
   label = 112;
   break;
  } else {
   label = 111;
   break;
  }
 case 111:
  label = 212;
  break;
 case 112:
  label = 113;
  break;
 case 113:
  if (($cur_band - $prev_band | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $cur_band | 0)) {
   label = 114;
   break;
  } else {
   label = 115;
   break;
  }
 case 114:
  $prev_band = _pixman_coalesce($2, $prev_band, $cur_band) | 0;
  label = 116;
  break;
 case 115:
  $prev_band = $cur_band;
  label = 116;
  break;
 case 116:
  label = 117;
  break;
 case 117:
  label = 118;
  break;
 case 118:
  if ((HEAP32[$r1 + 12 >> 2] | 0) == ($ybot | 0)) {
   label = 119;
   break;
  } else {
   label = 120;
   break;
  }
 case 119:
  $r1 = $r1_band_end;
  label = 120;
  break;
 case 120:
  if ((HEAP32[$r2 + 12 >> 2] | 0) == ($ybot | 0)) {
   label = 121;
   break;
  } else {
   label = 122;
   break;
  }
 case 121:
  $r2 = $r2_band_end;
  label = 122;
  break;
 case 122:
  label = 123;
  break;
 case 123:
  if (($r1 | 0) != ($r1_end | 0)) {
   label = 124;
   break;
  } else {
   $493 = 0;
   label = 125;
   break;
  }
 case 124:
  $493 = ($r2 | 0) != ($r2_end | 0);
  label = 125;
  break;
 case 125:
  if ($493) {
   label = 44;
   break;
  } else {
   label = 126;
   break;
  }
 case 126:
  if (($r1 | 0) != ($r1_end | 0)) {
   label = 127;
   break;
  } else {
   label = 157;
   break;
  }
 case 127:
  if (($6 | 0) != 0) {
   label = 128;
   break;
  } else {
   label = 157;
   break;
  }
 case 128:
  label = 129;
  break;
 case 129:
  $r1y1 = HEAP32[$r1 + 4 >> 2] | 0;
  $r1_band_end = $r1 + 16 | 0;
  label = 130;
  break;
 case 130:
  if (($r1_band_end | 0) != ($r1_end | 0)) {
   label = 131;
   break;
  } else {
   $519 = 0;
   label = 132;
   break;
  }
 case 131:
  $519 = (HEAP32[$r1_band_end + 4 >> 2] | 0) == ($r1y1 | 0);
  label = 132;
  break;
 case 132:
  if ($519) {
   label = 133;
   break;
  } else {
   label = 134;
   break;
  }
 case 133:
  $r1_band_end = $r1_band_end + 16 | 0;
  label = 130;
  break;
 case 134:
  label = 135;
  break;
 case 135:
  $cur_band = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if (($r1y1 | 0) > ($ybot | 0)) {
   label = 136;
   break;
  } else {
   label = 137;
   break;
  }
 case 136:
  $541 = $r1y1;
  label = 138;
  break;
 case 137:
  $541 = $ybot;
  label = 138;
  break;
 case 138:
  if ((_pixman_region_append_non_o($2, $r1, $r1_band_end, $541, HEAP32[$r1 + 12 >> 2] | 0) | 0) != 0) {
   label = 140;
   break;
  } else {
   label = 139;
   break;
  }
 case 139:
  label = 212;
  break;
 case 140:
  label = 141;
  break;
 case 141:
  if (($cur_band - $prev_band | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $cur_band | 0)) {
   label = 142;
   break;
  } else {
   label = 143;
   break;
  }
 case 142:
  $prev_band = _pixman_coalesce($2, $prev_band, $cur_band) | 0;
  label = 144;
  break;
 case 143:
  $prev_band = $cur_band;
  label = 144;
  break;
 case 144:
  label = 145;
  break;
 case 145:
  label = 146;
  break;
 case 146:
  $576 = ($r1_end - $r1_band_end | 0) / 16 | 0;
  $new_rects = $576;
  if (($576 | 0) != 0) {
   label = 147;
   break;
  } else {
   label = 155;
   break;
  }
 case 147:
  label = 148;
  break;
 case 148:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 149;
   break;
  } else {
   label = 150;
   break;
  }
 case 149:
  if (((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) + $new_rects | 0) > (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 150;
   break;
  } else {
   label = 153;
   break;
  }
 case 150:
  if ((_pixman_rect_alloc($2, $new_rects) | 0) != 0) {
   label = 152;
   break;
  } else {
   label = 151;
   break;
  }
 case 151:
  label = 212;
  break;
 case 152:
  label = 153;
  break;
 case 153:
  label = 154;
  break;
 case 154:
  _memmove((HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0, $r1_band_end | 0, $new_rects << 4 | 0);
  $627 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$627 >> 2] = (HEAP32[$627 >> 2] | 0) + $new_rects;
  label = 155;
  break;
 case 155:
  label = 156;
  break;
 case 156:
  label = 189;
  break;
 case 157:
  if (($r2 | 0) != ($r2_end | 0)) {
   label = 158;
   break;
  } else {
   label = 188;
   break;
  }
 case 158:
  if (($7 | 0) != 0) {
   label = 159;
   break;
  } else {
   label = 188;
   break;
  }
 case 159:
  label = 160;
  break;
 case 160:
  $r2y1 = HEAP32[$r2 + 4 >> 2] | 0;
  $r2_band_end = $r2 + 16 | 0;
  label = 161;
  break;
 case 161:
  if (($r2_band_end | 0) != ($r2_end | 0)) {
   label = 162;
   break;
  } else {
   $657 = 0;
   label = 163;
   break;
  }
 case 162:
  $657 = (HEAP32[$r2_band_end + 4 >> 2] | 0) == ($r2y1 | 0);
  label = 163;
  break;
 case 163:
  if ($657) {
   label = 164;
   break;
  } else {
   label = 165;
   break;
  }
 case 164:
  $r2_band_end = $r2_band_end + 16 | 0;
  label = 161;
  break;
 case 165:
  label = 166;
  break;
 case 166:
  $cur_band = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if (($r2y1 | 0) > ($ybot | 0)) {
   label = 167;
   break;
  } else {
   label = 168;
   break;
  }
 case 167:
  $679 = $r2y1;
  label = 169;
  break;
 case 168:
  $679 = $ybot;
  label = 169;
  break;
 case 169:
  if ((_pixman_region_append_non_o($2, $r2, $r2_band_end, $679, HEAP32[$r2 + 12 >> 2] | 0) | 0) != 0) {
   label = 171;
   break;
  } else {
   label = 170;
   break;
  }
 case 170:
  label = 212;
  break;
 case 171:
  label = 172;
  break;
 case 172:
  if (($cur_band - $prev_band | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $cur_band | 0)) {
   label = 173;
   break;
  } else {
   label = 174;
   break;
  }
 case 173:
  $prev_band = _pixman_coalesce($2, $prev_band, $cur_band) | 0;
  label = 175;
  break;
 case 174:
  $prev_band = $cur_band;
  label = 175;
  break;
 case 175:
  label = 176;
  break;
 case 176:
  label = 177;
  break;
 case 177:
  $714 = ($r2_end - $r2_band_end | 0) / 16 | 0;
  $new_rects1 = $714;
  if (($714 | 0) != 0) {
   label = 178;
   break;
  } else {
   label = 186;
   break;
  }
 case 178:
  label = 179;
  break;
 case 179:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 180;
   break;
  } else {
   label = 181;
   break;
  }
 case 180:
  if (((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) + $new_rects1 | 0) > (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 181;
   break;
  } else {
   label = 184;
   break;
  }
 case 181:
  if ((_pixman_rect_alloc($2, $new_rects1) | 0) != 0) {
   label = 183;
   break;
  } else {
   label = 182;
   break;
  }
 case 182:
  label = 212;
  break;
 case 183:
  label = 184;
  break;
 case 184:
  label = 185;
  break;
 case 185:
  _memmove((HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0, $r2_band_end | 0, $new_rects1 << 4 | 0);
  $765 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$765 >> 2] = (HEAP32[$765 >> 2] | 0) + $new_rects1;
  label = 186;
  break;
 case 186:
  label = 187;
  break;
 case 187:
  label = 188;
  break;
 case 188:
  label = 189;
  break;
 case 189:
  _free($old_data);
  $778 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  $numRects = $778;
  if (($778 | 0) != 0) {
   label = 194;
   break;
  } else {
   label = 190;
   break;
  }
 case 190:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 191;
   break;
  } else {
   label = 193;
   break;
  }
 case 191:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 192;
   break;
  } else {
   label = 193;
   break;
  }
 case 192:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 193;
  break;
 case 193:
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  label = 211;
  break;
 case 194:
  if (($numRects | 0) == 1) {
   label = 195;
   break;
  } else {
   label = 199;
   break;
  }
 case 195:
  $812 = $2 | 0;
  $813 = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  HEAP32[$812 >> 2] = HEAP32[$813 >> 2];
  HEAP32[$812 + 4 >> 2] = HEAP32[$813 + 4 >> 2];
  HEAP32[$812 + 8 >> 2] = HEAP32[$813 + 8 >> 2];
  HEAP32[$812 + 12 >> 2] = HEAP32[$813 + 12 >> 2];
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 196;
   break;
  } else {
   label = 198;
   break;
  }
 case 196:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 197;
   break;
  } else {
   label = 198;
   break;
  }
 case 197:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 198;
  break;
 case 198:
  HEAP32[$2 + 16 >> 2] = 0;
  label = 210;
  break;
 case 199:
  label = 200;
  break;
 case 200:
  if (($numRects | 0) < (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] >> 1 | 0)) {
   label = 201;
   break;
  } else {
   label = 208;
   break;
  }
 case 201:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) > 50) {
   label = 202;
   break;
  } else {
   label = 208;
   break;
  }
 case 202:
  $data_size = _PIXREGION_SZOF($numRects) | 0;
  if (($data_size | 0) != 0) {
   label = 204;
   break;
  } else {
   label = 203;
   break;
  }
 case 203:
  $new_data = 0;
  label = 205;
  break;
 case 204:
  $new_data = _realloc(HEAP32[$2 + 16 >> 2] | 0, $data_size) | 0;
  label = 205;
  break;
 case 205:
  if (($new_data | 0) != 0) {
   label = 206;
   break;
  } else {
   label = 207;
   break;
  }
 case 206:
  HEAP32[$new_data >> 2] = $numRects;
  HEAP32[$2 + 16 >> 2] = $new_data;
  label = 207;
  break;
 case 207:
  label = 208;
  break;
 case 208:
  label = 209;
  break;
 case 209:
  label = 210;
  break;
 case 210:
  label = 211;
  break;
 case 211:
  $1 = 1;
  label = 213;
  break;
 case 212:
  _free($old_data);
  $1 = _pixman_break($2) | 0;
  label = 213;
  break;
 case 213:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region_intersect_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
 $region = $region | 0;
 $r1 = $r1 | 0;
 $r1_end = $r1_end | 0;
 $r2 = $r2 | 0;
 $r2_end = $r2_end | 0;
 $y1 = $y1 | 0;
 $y2 = $y2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $x1 = 0, $x2 = 0, $next_rect = 0, $40 = 0, $65 = 0, $82 = 0, $141 = 0, $192 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $r1;
  $4 = $r1_end;
  $5 = $r2;
  $6 = $r2_end;
  $7 = $y1;
  $8 = $y2;
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 2;
  break;
 case 2:
  if (((($7 | 0) < ($8 | 0) ^ 1) & 1 | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  __pixman_log_error(1728, 464);
  label = 4;
  break;
 case 4:
  label = 5;
  break;
 case 5:
  label = 6;
  break;
 case 6:
  if (($3 | 0) != ($4 | 0)) {
   label = 7;
   break;
  } else {
   $40 = 0;
   label = 8;
   break;
  }
 case 7:
  $40 = ($5 | 0) != ($6 | 0);
  label = 8;
  break;
 case 8:
  if ((($40 ^ 1) & 1 | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  __pixman_log_error(1728, 408);
  label = 10;
  break;
 case 10:
  label = 11;
  break;
 case 11:
  label = 12;
  break;
 case 12:
  if ((HEAP32[$3 >> 2] | 0) > (HEAP32[$5 >> 2] | 0)) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  $65 = HEAP32[$3 >> 2] | 0;
  label = 15;
  break;
 case 14:
  $65 = HEAP32[$5 >> 2] | 0;
  label = 15;
  break;
 case 15:
  $x1 = $65;
  if ((HEAP32[$3 + 8 >> 2] | 0) < (HEAP32[$5 + 8 >> 2] | 0)) {
   label = 16;
   break;
  } else {
   label = 17;
   break;
  }
 case 16:
  $82 = HEAP32[$3 + 8 >> 2] | 0;
  label = 18;
  break;
 case 17:
  $82 = HEAP32[$5 + 8 >> 2] | 0;
  label = 18;
  break;
 case 18:
  $x2 = $82;
  if (($x1 | 0) < ($x2 | 0)) {
   label = 19;
   break;
  } else {
   label = 33;
   break;
  }
 case 19:
  label = 20;
  break;
 case 20:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 21;
   break;
  } else {
   label = 22;
   break;
  }
 case 21:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 22;
   break;
  } else {
   label = 25;
   break;
  }
 case 22:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 24;
   break;
  } else {
   label = 23;
   break;
  }
 case 23:
  $1 = 0;
  label = 42;
  break;
 case 24:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 25;
  break;
 case 25:
  label = 26;
  break;
 case 26:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 27;
  break;
 case 27:
  $141 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$141 >> 2] = (HEAP32[$141 >> 2] | 0) + 1;
  label = 28;
  break;
 case 28:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  __pixman_log_error(1728, 1312);
  label = 30;
  break;
 case 30:
  label = 31;
  break;
 case 31:
  label = 32;
  break;
 case 32:
  label = 33;
  break;
 case 33:
  if ((HEAP32[$3 + 8 >> 2] | 0) == ($x2 | 0)) {
   label = 34;
   break;
  } else {
   label = 35;
   break;
  }
 case 34:
  $3 = $3 + 16 | 0;
  label = 35;
  break;
 case 35:
  if ((HEAP32[$5 + 8 >> 2] | 0) == ($x2 | 0)) {
   label = 36;
   break;
  } else {
   label = 37;
   break;
  }
 case 36:
  $5 = $5 + 16 | 0;
  label = 37;
  break;
 case 37:
  label = 38;
  break;
 case 38:
  if (($3 | 0) != ($4 | 0)) {
   label = 39;
   break;
  } else {
   $192 = 0;
   label = 40;
   break;
  }
 case 39:
  $192 = ($5 | 0) != ($6 | 0);
  label = 40;
  break;
 case 40:
  if ($192) {
   label = 12;
   break;
  } else {
   label = 41;
   break;
  }
 case 41:
  $1 = 1;
  label = 42;
  break;
 case 42:
  return $1 | 0;
 }
 return 0;
}
function _pixman_set_extents($region) {
 $region = $region | 0;
 var $1 = 0, $box = 0, $box_end = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  label = 20;
  break;
 case 3:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  HEAP32[$1 + 8 >> 2] = HEAP32[$1 >> 2];
  HEAP32[$1 + 12 >> 2] = HEAP32[$1 + 4 >> 2];
  label = 20;
  break;
 case 5:
  $box = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  $box_end = (HEAP32[$1 + 16 >> 2] | 0) + 8 + ((HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0) - 1 << 4) | 0;
  HEAP32[$1 >> 2] = HEAP32[$box >> 2];
  HEAP32[$1 + 4 >> 2] = HEAP32[$box + 4 >> 2];
  HEAP32[$1 + 8 >> 2] = HEAP32[$box_end + 8 >> 2];
  HEAP32[$1 + 12 >> 2] = HEAP32[$box_end + 12 >> 2];
  label = 6;
  break;
 case 6:
  if ((((HEAP32[$1 + 4 >> 2] | 0) < (HEAP32[$1 + 12 >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  __pixman_log_error(1432, 1184);
  label = 8;
  break;
 case 8:
  label = 9;
  break;
 case 9:
  label = 10;
  break;
 case 10:
  if ($box >>> 0 <= $box_end >>> 0) {
   label = 11;
   break;
  } else {
   label = 16;
   break;
  }
 case 11:
  if ((HEAP32[$box >> 2] | 0) < (HEAP32[$1 >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  HEAP32[$1 >> 2] = HEAP32[$box >> 2];
  label = 13;
  break;
 case 13:
  if ((HEAP32[$box + 8 >> 2] | 0) > (HEAP32[$1 + 8 >> 2] | 0)) {
   label = 14;
   break;
  } else {
   label = 15;
   break;
  }
 case 14:
  HEAP32[$1 + 8 >> 2] = HEAP32[$box + 8 >> 2];
  label = 15;
  break;
 case 15:
  $box = $box + 16 | 0;
  label = 10;
  break;
 case 16:
  label = 17;
  break;
 case 17:
  if ((((HEAP32[$1 >> 2] | 0) < (HEAP32[$1 + 8 >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  __pixman_log_error(1432, 1080);
  label = 19;
  break;
 case 19:
  label = 20;
  break;
 case 20:
  return;
 }
}
function _pixman_region32_intersect_rect($dest, $source, $x, $y, $width, $height) {
 $dest = $dest | 0;
 $source = $source | 0;
 $x = $x | 0;
 $y = $y | 0;
 $width = $width | 0;
 $height = $height | 0;
 var $3 = 0, $4 = 0, $region = 0, $26 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 24 | 0;
 $region = sp | 0;
 $3 = $x;
 $4 = $y;
 HEAP32[$region + 16 >> 2] = 0;
 HEAP32[$region >> 2] = $3;
 HEAP32[$region + 4 >> 2] = $4;
 HEAP32[$region + 8 >> 2] = $3 + $width;
 HEAP32[$region + 12 >> 2] = $4 + $height;
 $26 = _pixman_region32_intersect($dest, $source, $region) | 0;
 STACKTOP = sp;
 return $26 | 0;
}
function _pixman_region32_union_rect($dest, $source, $x, $y, $width, $height) {
 $dest = $dest | 0;
 $source = $source | 0;
 $x = $x | 0;
 $y = $y | 0;
 $width = $width | 0;
 $height = $height | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $region = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 24 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $region = sp | 0;
  $2 = $dest;
  $3 = $source;
  $4 = $x;
  $5 = $y;
  HEAP32[$region >> 2] = $4;
  HEAP32[$region + 4 >> 2] = $5;
  HEAP32[$region + 8 >> 2] = $4 + $width;
  HEAP32[$region + 12 >> 2] = $5 + $height;
  if ((HEAP32[$region >> 2] | 0) < (HEAP32[$region + 8 >> 2] | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[$region + 4 >> 2] | 0) < (HEAP32[$region + 12 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  if ((HEAP32[$region >> 2] | 0) > (HEAP32[$region + 8 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$region + 4 >> 2] | 0) > (HEAP32[$region + 12 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  __pixman_log_error(1952, 640);
  label = 6;
  break;
 case 6:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 8;
  break;
 case 7:
  HEAP32[$region + 16 >> 2] = 0;
  $1 = _pixman_region32_union($2, $3, $region) | 0;
  label = 8;
  break;
 case 8:
  STACKTOP = sp;
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_union($new_reg, $reg1, $reg2) {
 $new_reg = $new_reg | 0;
 $reg1 = $reg1 | 0;
 $reg2 = $reg2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $208 = 0, $232 = 0, $256 = 0, $280 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $new_reg;
  $3 = $reg1;
  $4 = $reg2;
  if (($3 | 0) == ($4 | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 48;
  break;
 case 3:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 10;
   break;
  }
 case 4:
  if ((HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  if ((HEAP32[$3 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 6;
   break;
  } else {
   label = 7;
   break;
  }
 case 6:
  $1 = _pixman_break($2) | 0;
  label = 48;
  break;
 case 7:
  if (($2 | 0) != ($4 | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $1 = _pixman_region32_copy($2, $4) | 0;
  label = 48;
  break;
 case 9:
  $1 = 1;
  label = 48;
  break;
 case 10:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 17;
   break;
  }
 case 11:
  if ((HEAP32[(HEAP32[$4 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 17;
   break;
  } else {
   label = 12;
   break;
  }
 case 12:
  if ((HEAP32[$4 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  $1 = _pixman_break($2) | 0;
  label = 48;
  break;
 case 14:
  if (($2 | 0) != ($3 | 0)) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 48;
  break;
 case 16:
  $1 = 1;
  label = 48;
  break;
 case 17:
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 25;
   break;
  } else {
   label = 18;
   break;
  }
 case 18:
  if ((HEAP32[$3 >> 2] | 0) <= (HEAP32[$4 >> 2] | 0)) {
   label = 19;
   break;
  } else {
   label = 25;
   break;
  }
 case 19:
  if ((HEAP32[$3 + 8 >> 2] | 0) >= (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 20;
   break;
  } else {
   label = 25;
   break;
  }
 case 20:
  if ((HEAP32[$3 + 4 >> 2] | 0) <= (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 21;
   break;
  } else {
   label = 25;
   break;
  }
 case 21:
  if ((HEAP32[$3 + 12 >> 2] | 0) >= (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 22;
   break;
  } else {
   label = 25;
   break;
  }
 case 22:
  if (($2 | 0) != ($3 | 0)) {
   label = 23;
   break;
  } else {
   label = 24;
   break;
  }
 case 23:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 48;
  break;
 case 24:
  $1 = 1;
  label = 48;
  break;
 case 25:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 33;
   break;
  } else {
   label = 26;
   break;
  }
 case 26:
  if ((HEAP32[$4 >> 2] | 0) <= (HEAP32[$3 >> 2] | 0)) {
   label = 27;
   break;
  } else {
   label = 33;
   break;
  }
 case 27:
  if ((HEAP32[$4 + 8 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 28;
   break;
  } else {
   label = 33;
   break;
  }
 case 28:
  if ((HEAP32[$4 + 4 >> 2] | 0) <= (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 29;
   break;
  } else {
   label = 33;
   break;
  }
 case 29:
  if ((HEAP32[$4 + 12 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 30;
   break;
  } else {
   label = 33;
   break;
  }
 case 30:
  if (($2 | 0) != ($4 | 0)) {
   label = 31;
   break;
  } else {
   label = 32;
   break;
  }
 case 31:
  $1 = _pixman_region32_copy($2, $4) | 0;
  label = 48;
  break;
 case 32:
  $1 = 1;
  label = 48;
  break;
 case 33:
  if ((_pixman_op($2, $3, $4, 32, 1, 1) | 0) != 0) {
   label = 35;
   break;
  } else {
   label = 34;
   break;
  }
 case 34:
  $1 = 0;
  label = 48;
  break;
 case 35:
  if ((HEAP32[$3 >> 2] | 0) < (HEAP32[$4 >> 2] | 0)) {
   label = 36;
   break;
  } else {
   label = 37;
   break;
  }
 case 36:
  $208 = HEAP32[$3 >> 2] | 0;
  label = 38;
  break;
 case 37:
  $208 = HEAP32[$4 >> 2] | 0;
  label = 38;
  break;
 case 38:
  HEAP32[$2 >> 2] = $208;
  if ((HEAP32[$3 + 4 >> 2] | 0) < (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 39;
   break;
  } else {
   label = 40;
   break;
  }
 case 39:
  $232 = HEAP32[$3 + 4 >> 2] | 0;
  label = 41;
  break;
 case 40:
  $232 = HEAP32[$4 + 4 >> 2] | 0;
  label = 41;
  break;
 case 41:
  HEAP32[$2 + 4 >> 2] = $232;
  if ((HEAP32[$3 + 8 >> 2] | 0) > (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 42;
   break;
  } else {
   label = 43;
   break;
  }
 case 42:
  $256 = HEAP32[$3 + 8 >> 2] | 0;
  label = 44;
  break;
 case 43:
  $256 = HEAP32[$4 + 8 >> 2] | 0;
  label = 44;
  break;
 case 44:
  HEAP32[$2 + 8 >> 2] = $256;
  if ((HEAP32[$3 + 12 >> 2] | 0) > (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 45;
   break;
  } else {
   label = 46;
   break;
  }
 case 45:
  $280 = HEAP32[$3 + 12 >> 2] | 0;
  label = 47;
  break;
 case 46:
  $280 = HEAP32[$4 + 12 >> 2] | 0;
  label = 47;
  break;
 case 47:
  HEAP32[$2 + 12 >> 2] = $280;
  $1 = 1;
  label = 48;
  break;
 case 48:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region_union_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
 $region = $region | 0;
 $r1 = $r1 | 0;
 $r1_end = $r1_end | 0;
 $r2 = $r2 | 0;
 $r2_end = $r2_end | 0;
 $y1 = $y1 | 0;
 $y2 = $y2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $next_rect = 0, $x1 = 0, $x2 = 0, $29 = 0, $83 = 0, $165 = 0, $271 = 0, $383 = 0, $499 = 0, $593 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $r1;
  $4 = $r1_end;
  $5 = $r2;
  $6 = $r2_end;
  $7 = $y1;
  $8 = $y2;
  label = 2;
  break;
 case 2:
  if (((($7 | 0) < ($8 | 0) ^ 1) & 1 | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  __pixman_log_error(1480, 464);
  label = 4;
  break;
 case 4:
  label = 5;
  break;
 case 5:
  label = 6;
  break;
 case 6:
  if (($3 | 0) != ($4 | 0)) {
   label = 7;
   break;
  } else {
   $29 = 0;
   label = 8;
   break;
  }
 case 7:
  $29 = ($5 | 0) != ($6 | 0);
  label = 8;
  break;
 case 8:
  if ((($29 ^ 1) & 1 | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  __pixman_log_error(1480, 408);
  label = 10;
  break;
 case 10:
  label = 11;
  break;
 case 11:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  if ((HEAP32[$3 >> 2] | 0) < (HEAP32[$5 >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  $x1 = HEAP32[$3 >> 2] | 0;
  $x2 = HEAP32[$3 + 8 >> 2] | 0;
  $3 = $3 + 16 | 0;
  label = 14;
  break;
 case 13:
  $x1 = HEAP32[$5 >> 2] | 0;
  $x2 = HEAP32[$5 + 8 >> 2] | 0;
  $5 = $5 + 16 | 0;
  label = 14;
  break;
 case 14:
  label = 15;
  break;
 case 15:
  if (($3 | 0) != ($4 | 0)) {
   label = 16;
   break;
  } else {
   $83 = 0;
   label = 17;
   break;
  }
 case 16:
  $83 = ($5 | 0) != ($6 | 0);
  label = 17;
  break;
 case 17:
  if ($83) {
   label = 18;
   break;
  } else {
   label = 62;
   break;
  }
 case 18:
  if ((HEAP32[$3 >> 2] | 0) < (HEAP32[$5 >> 2] | 0)) {
   label = 19;
   break;
  } else {
   label = 40;
   break;
  }
 case 19:
  label = 20;
  break;
 case 20:
  if ((HEAP32[$3 >> 2] | 0) <= ($x2 | 0)) {
   label = 21;
   break;
  } else {
   label = 24;
   break;
  }
 case 21:
  if (($x2 | 0) < (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 22:
  $x2 = HEAP32[$3 + 8 >> 2] | 0;
  label = 23;
  break;
 case 23:
  label = 38;
  break;
 case 24:
  label = 25;
  break;
 case 25:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 26;
   break;
  } else {
   label = 27;
   break;
  }
 case 26:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 27;
   break;
  } else {
   label = 30;
   break;
  }
 case 27:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 29;
   break;
  } else {
   label = 28;
   break;
  }
 case 28:
  $1 = 0;
  label = 127;
  break;
 case 29:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 30;
  break;
 case 30:
  label = 31;
  break;
 case 31:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 32;
  break;
 case 32:
  $165 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$165 >> 2] = (HEAP32[$165 >> 2] | 0) + 1;
  label = 33;
  break;
 case 33:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 34;
   break;
  } else {
   label = 35;
   break;
  }
 case 34:
  __pixman_log_error(1480, 1312);
  label = 35;
  break;
 case 35:
  label = 36;
  break;
 case 36:
  label = 37;
  break;
 case 37:
  $x1 = HEAP32[$3 >> 2] | 0;
  $x2 = HEAP32[$3 + 8 >> 2] | 0;
  label = 38;
  break;
 case 38:
  $3 = $3 + 16 | 0;
  label = 39;
  break;
 case 39:
  label = 61;
  break;
 case 40:
  label = 41;
  break;
 case 41:
  if ((HEAP32[$5 >> 2] | 0) <= ($x2 | 0)) {
   label = 42;
   break;
  } else {
   label = 45;
   break;
  }
 case 42:
  if (($x2 | 0) < (HEAP32[$5 + 8 >> 2] | 0)) {
   label = 43;
   break;
  } else {
   label = 44;
   break;
  }
 case 43:
  $x2 = HEAP32[$5 + 8 >> 2] | 0;
  label = 44;
  break;
 case 44:
  label = 59;
  break;
 case 45:
  label = 46;
  break;
 case 46:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 47;
   break;
  } else {
   label = 48;
   break;
  }
 case 47:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 48;
   break;
  } else {
   label = 51;
   break;
  }
 case 48:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 50;
   break;
  } else {
   label = 49;
   break;
  }
 case 49:
  $1 = 0;
  label = 127;
  break;
 case 50:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 51;
  break;
 case 51:
  label = 52;
  break;
 case 52:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 53;
  break;
 case 53:
  $271 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$271 >> 2] = (HEAP32[$271 >> 2] | 0) + 1;
  label = 54;
  break;
 case 54:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 55;
   break;
  } else {
   label = 56;
   break;
  }
 case 55:
  __pixman_log_error(1480, 1312);
  label = 56;
  break;
 case 56:
  label = 57;
  break;
 case 57:
  label = 58;
  break;
 case 58:
  $x1 = HEAP32[$5 >> 2] | 0;
  $x2 = HEAP32[$5 + 8 >> 2] | 0;
  label = 59;
  break;
 case 59:
  $5 = $5 + 16 | 0;
  label = 60;
  break;
 case 60:
  label = 61;
  break;
 case 61:
  label = 15;
  break;
 case 62:
  if (($3 | 0) != ($4 | 0)) {
   label = 63;
   break;
  } else {
   label = 87;
   break;
  }
 case 63:
  label = 64;
  break;
 case 64:
  label = 65;
  break;
 case 65:
  if ((HEAP32[$3 >> 2] | 0) <= ($x2 | 0)) {
   label = 66;
   break;
  } else {
   label = 69;
   break;
  }
 case 66:
  if (($x2 | 0) < (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 67;
   break;
  } else {
   label = 68;
   break;
  }
 case 67:
  $x2 = HEAP32[$3 + 8 >> 2] | 0;
  label = 68;
  break;
 case 68:
  label = 83;
  break;
 case 69:
  label = 70;
  break;
 case 70:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 71;
   break;
  } else {
   label = 72;
   break;
  }
 case 71:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 72;
   break;
  } else {
   label = 75;
   break;
  }
 case 72:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 74;
   break;
  } else {
   label = 73;
   break;
  }
 case 73:
  $1 = 0;
  label = 127;
  break;
 case 74:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 75;
  break;
 case 75:
  label = 76;
  break;
 case 76:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 77;
  break;
 case 77:
  $383 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$383 >> 2] = (HEAP32[$383 >> 2] | 0) + 1;
  label = 78;
  break;
 case 78:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 79;
   break;
  } else {
   label = 80;
   break;
  }
 case 79:
  __pixman_log_error(1480, 1312);
  label = 80;
  break;
 case 80:
  label = 81;
  break;
 case 81:
  label = 82;
  break;
 case 82:
  $x1 = HEAP32[$3 >> 2] | 0;
  $x2 = HEAP32[$3 + 8 >> 2] | 0;
  label = 83;
  break;
 case 83:
  $3 = $3 + 16 | 0;
  label = 84;
  break;
 case 84:
  label = 85;
  break;
 case 85:
  if (($3 | 0) != ($4 | 0)) {
   label = 64;
   break;
  } else {
   label = 86;
   break;
  }
 case 86:
  label = 113;
  break;
 case 87:
  if (($5 | 0) != ($6 | 0)) {
   label = 88;
   break;
  } else {
   label = 112;
   break;
  }
 case 88:
  label = 89;
  break;
 case 89:
  label = 90;
  break;
 case 90:
  if ((HEAP32[$5 >> 2] | 0) <= ($x2 | 0)) {
   label = 91;
   break;
  } else {
   label = 94;
   break;
  }
 case 91:
  if (($x2 | 0) < (HEAP32[$5 + 8 >> 2] | 0)) {
   label = 92;
   break;
  } else {
   label = 93;
   break;
  }
 case 92:
  $x2 = HEAP32[$5 + 8 >> 2] | 0;
  label = 93;
  break;
 case 93:
  label = 108;
  break;
 case 94:
  label = 95;
  break;
 case 95:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 96;
   break;
  } else {
   label = 97;
   break;
  }
 case 96:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 97;
   break;
  } else {
   label = 100;
   break;
  }
 case 97:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 99;
   break;
  } else {
   label = 98;
   break;
  }
 case 98:
  $1 = 0;
  label = 127;
  break;
 case 99:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 100;
  break;
 case 100:
  label = 101;
  break;
 case 101:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 102;
  break;
 case 102:
  $499 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$499 >> 2] = (HEAP32[$499 >> 2] | 0) + 1;
  label = 103;
  break;
 case 103:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 104;
   break;
  } else {
   label = 105;
   break;
  }
 case 104:
  __pixman_log_error(1480, 1312);
  label = 105;
  break;
 case 105:
  label = 106;
  break;
 case 106:
  label = 107;
  break;
 case 107:
  $x1 = HEAP32[$5 >> 2] | 0;
  $x2 = HEAP32[$5 + 8 >> 2] | 0;
  label = 108;
  break;
 case 108:
  $5 = $5 + 16 | 0;
  label = 109;
  break;
 case 109:
  label = 110;
  break;
 case 110:
  if (($5 | 0) != ($6 | 0)) {
   label = 89;
   break;
  } else {
   label = 111;
   break;
  }
 case 111:
  label = 112;
  break;
 case 112:
  label = 113;
  break;
 case 113:
  label = 114;
  break;
 case 114:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 115;
   break;
  } else {
   label = 116;
   break;
  }
 case 115:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 116;
   break;
  } else {
   label = 119;
   break;
  }
 case 116:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 118;
   break;
  } else {
   label = 117;
   break;
  }
 case 117:
  $1 = 0;
  label = 127;
  break;
 case 118:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 119;
  break;
 case 119:
  label = 120;
  break;
 case 120:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = $x2;
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 121;
  break;
 case 121:
  $593 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$593 >> 2] = (HEAP32[$593 >> 2] | 0) + 1;
  label = 122;
  break;
 case 122:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 123;
   break;
  } else {
   label = 124;
   break;
  }
 case 123:
  __pixman_log_error(1480, 1312);
  label = 124;
  break;
 case 124:
  label = 125;
  break;
 case 125:
  label = 126;
  break;
 case 126:
  $1 = 1;
  label = 127;
  break;
 case 127:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_subtract($reg_d, $reg_m, $reg_s) {
 $reg_d = $reg_d | 0;
 $reg_m = $reg_m | 0;
 $reg_s = $reg_s | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $reg_d;
  $3 = $reg_m;
  $4 = $reg_s;
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 9;
   break;
  }
 case 3:
  if ((HEAP32[$4 + 16 >> 2] | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  if ((HEAP32[(HEAP32[$4 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 9;
   break;
  }
 case 5:
  if ((HEAP32[$3 + 8 >> 2] | 0) <= (HEAP32[$4 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ((HEAP32[$3 >> 2] | 0) >= (HEAP32[$4 + 8 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if ((HEAP32[$3 + 12 >> 2] | 0) <= (HEAP32[$4 + 4 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ((HEAP32[$3 + 4 >> 2] | 0) >= (HEAP32[$4 + 12 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 12;
   break;
  }
 case 9:
  if ((HEAP32[$4 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 10;
   break;
  } else {
   label = 11;
   break;
  }
 case 10:
  $1 = _pixman_break($2) | 0;
  label = 21;
  break;
 case 11:
  $1 = _pixman_region32_copy($2, $3) | 0;
  label = 21;
  break;
 case 12:
  if (($3 | 0) == ($4 | 0)) {
   label = 13;
   break;
  } else {
   label = 17;
   break;
  }
 case 13:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 14;
   break;
  } else {
   label = 16;
   break;
  }
 case 14:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 16;
  break;
 case 16:
  HEAP32[$2 + 8 >> 2] = HEAP32[$2 >> 2];
  HEAP32[$2 + 12 >> 2] = HEAP32[$2 + 4 >> 2];
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  $1 = 1;
  label = 21;
  break;
 case 17:
  label = 18;
  break;
 case 18:
  if ((_pixman_op($2, $3, $4, 34, 1, 0) | 0) != 0) {
   label = 20;
   break;
  } else {
   label = 19;
   break;
  }
 case 19:
  $1 = 0;
  label = 21;
  break;
 case 20:
  _pixman_set_extents($2);
  $1 = 1;
  label = 21;
  break;
 case 21:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region_subtract_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
 $region = $region | 0;
 $r1 = $r1 | 0;
 $r1_end = $r1_end | 0;
 $r2 = $r2 | 0;
 $r2_end = $r2_end | 0;
 $y1 = $y1 | 0;
 $y2 = $y2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $next_rect = 0, $x1 = 0, $32 = 0, $168 = 0, $277 = 0, $323 = 0, $399 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $r1;
  $4 = $r1_end;
  $5 = $r2;
  $6 = $r2_end;
  $7 = $y1;
  $8 = $y2;
  $x1 = HEAP32[$3 >> 2] | 0;
  label = 2;
  break;
 case 2:
  if (((($7 | 0) < ($8 | 0) ^ 1) & 1 | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  __pixman_log_error(1600, 464);
  label = 4;
  break;
 case 4:
  label = 5;
  break;
 case 5:
  label = 6;
  break;
 case 6:
  if (($3 | 0) != ($4 | 0)) {
   label = 7;
   break;
  } else {
   $32 = 0;
   label = 8;
   break;
  }
 case 7:
  $32 = ($5 | 0) != ($6 | 0);
  label = 8;
  break;
 case 8:
  if ((($32 ^ 1) & 1 | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  __pixman_log_error(1600, 408);
  label = 10;
  break;
 case 10:
  label = 11;
  break;
 case 11:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 12;
  break;
 case 12:
  if ((HEAP32[$5 + 8 >> 2] | 0) <= ($x1 | 0)) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  $5 = $5 + 16 | 0;
  label = 65;
  break;
 case 14:
  if ((HEAP32[$5 >> 2] | 0) <= ($x1 | 0)) {
   label = 15;
   break;
  } else {
   label = 21;
   break;
  }
 case 15:
  $x1 = HEAP32[$5 + 8 >> 2] | 0;
  if (($x1 | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 16;
   break;
  } else {
   label = 19;
   break;
  }
 case 16:
  $3 = $3 + 16 | 0;
  if (($3 | 0) != ($4 | 0)) {
   label = 17;
   break;
  } else {
   label = 18;
   break;
  }
 case 17:
  $x1 = HEAP32[$3 >> 2] | 0;
  label = 18;
  break;
 case 18:
  label = 20;
  break;
 case 19:
  $5 = $5 + 16 | 0;
  label = 20;
  break;
 case 20:
  label = 64;
  break;
 case 21:
  if ((HEAP32[$5 >> 2] | 0) < (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 22;
   break;
  } else {
   label = 45;
   break;
  }
 case 22:
  label = 23;
  break;
 case 23:
  if (((($x1 | 0) < (HEAP32[$5 >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 24;
   break;
  } else {
   label = 25;
   break;
  }
 case 24:
  __pixman_log_error(1600, 368);
  label = 25;
  break;
 case 25:
  label = 26;
  break;
 case 26:
  label = 27;
  break;
 case 27:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 28;
   break;
  } else {
   label = 29;
   break;
  }
 case 28:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 29;
   break;
  } else {
   label = 32;
   break;
  }
 case 29:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 31;
   break;
  } else {
   label = 30;
   break;
  }
 case 30:
  $1 = 0;
  label = 92;
  break;
 case 31:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 32;
  break;
 case 32:
  label = 33;
  break;
 case 33:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = HEAP32[$5 >> 2];
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 34;
  break;
 case 34:
  $168 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$168 >> 2] = (HEAP32[$168 >> 2] | 0) + 1;
  label = 35;
  break;
 case 35:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 36;
   break;
  } else {
   label = 37;
   break;
  }
 case 36:
  __pixman_log_error(1600, 1312);
  label = 37;
  break;
 case 37:
  label = 38;
  break;
 case 38:
  label = 39;
  break;
 case 39:
  $x1 = HEAP32[$5 + 8 >> 2] | 0;
  if (($x1 | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 40;
   break;
  } else {
   label = 43;
   break;
  }
 case 40:
  $3 = $3 + 16 | 0;
  if (($3 | 0) != ($4 | 0)) {
   label = 41;
   break;
  } else {
   label = 42;
   break;
  }
 case 41:
  $x1 = HEAP32[$3 >> 2] | 0;
  label = 42;
  break;
 case 42:
  label = 44;
  break;
 case 43:
  $5 = $5 + 16 | 0;
  label = 44;
  break;
 case 44:
  label = 63;
  break;
 case 45:
  if ((HEAP32[$3 + 8 >> 2] | 0) > ($x1 | 0)) {
   label = 46;
   break;
  } else {
   label = 60;
   break;
  }
 case 46:
  label = 47;
  break;
 case 47:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 48;
   break;
  } else {
   label = 49;
   break;
  }
 case 48:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 49;
   break;
  } else {
   label = 52;
   break;
  }
 case 49:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 51;
   break;
  } else {
   label = 50;
   break;
  }
 case 50:
  $1 = 0;
  label = 92;
  break;
 case 51:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 52;
  break;
 case 52:
  label = 53;
  break;
 case 53:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = HEAP32[$3 + 8 >> 2];
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 54;
  break;
 case 54:
  $277 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$277 >> 2] = (HEAP32[$277 >> 2] | 0) + 1;
  label = 55;
  break;
 case 55:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 56;
   break;
  } else {
   label = 57;
   break;
  }
 case 56:
  __pixman_log_error(1600, 1312);
  label = 57;
  break;
 case 57:
  label = 58;
  break;
 case 58:
  label = 59;
  break;
 case 59:
  label = 60;
  break;
 case 60:
  $3 = $3 + 16 | 0;
  if (($3 | 0) != ($4 | 0)) {
   label = 61;
   break;
  } else {
   label = 62;
   break;
  }
 case 61:
  $x1 = HEAP32[$3 >> 2] | 0;
  label = 62;
  break;
 case 62:
  label = 63;
  break;
 case 63:
  label = 64;
  break;
 case 64:
  label = 65;
  break;
 case 65:
  label = 66;
  break;
 case 66:
  if (($3 | 0) != ($4 | 0)) {
   label = 67;
   break;
  } else {
   $323 = 0;
   label = 68;
   break;
  }
 case 67:
  $323 = ($5 | 0) != ($6 | 0);
  label = 68;
  break;
 case 68:
  if ($323) {
   label = 12;
   break;
  } else {
   label = 69;
   break;
  }
 case 69:
  label = 70;
  break;
 case 70:
  if (($3 | 0) != ($4 | 0)) {
   label = 71;
   break;
  } else {
   label = 91;
   break;
  }
 case 71:
  label = 72;
  break;
 case 72:
  if (((($x1 | 0) < (HEAP32[$3 + 8 >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 73;
   break;
  } else {
   label = 74;
   break;
  }
 case 73:
  __pixman_log_error(1600, 1272);
  label = 74;
  break;
 case 74:
  label = 75;
  break;
 case 75:
  label = 76;
  break;
 case 76:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 77;
   break;
  } else {
   label = 78;
   break;
  }
 case 77:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 78;
   break;
  } else {
   label = 81;
   break;
  }
 case 78:
  if ((_pixman_rect_alloc($2, 1) | 0) != 0) {
   label = 80;
   break;
  } else {
   label = 79;
   break;
  }
 case 79:
  $1 = 0;
  label = 92;
  break;
 case 80:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  label = 81;
  break;
 case 81:
  label = 82;
  break;
 case 82:
  HEAP32[$next_rect >> 2] = $x1;
  HEAP32[$next_rect + 4 >> 2] = $7;
  HEAP32[$next_rect + 8 >> 2] = HEAP32[$3 + 8 >> 2];
  HEAP32[$next_rect + 12 >> 2] = $8;
  $next_rect = $next_rect + 16 | 0;
  label = 83;
  break;
 case 83:
  $399 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$399 >> 2] = (HEAP32[$399 >> 2] | 0) + 1;
  label = 84;
  break;
 case 84:
  if ((((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) <= (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 85;
   break;
  } else {
   label = 86;
   break;
  }
 case 85:
  __pixman_log_error(1600, 1312);
  label = 86;
  break;
 case 86:
  label = 87;
  break;
 case 87:
  label = 88;
  break;
 case 88:
  $3 = $3 + 16 | 0;
  if (($3 | 0) != ($4 | 0)) {
   label = 89;
   break;
  } else {
   label = 90;
   break;
  }
 case 89:
  $x1 = HEAP32[$3 >> 2] | 0;
  label = 90;
  break;
 case 90:
  label = 70;
  break;
 case 91:
  $1 = 1;
  label = 92;
  break;
 case 92:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_inverse($new_reg, $reg1, $inv_rect) {
 $new_reg = $new_reg | 0;
 $reg1 = $reg1 | 0;
 $inv_rect = $inv_rect | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $inv_reg = 0, $65 = 0, $66 = 0, $89 = 0, $90 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 24 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $inv_reg = sp | 0;
  $2 = $new_reg;
  $3 = $reg1;
  $4 = $inv_rect;
  if ((HEAP32[$3 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  if ((HEAP32[(HEAP32[$3 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 7;
   break;
  }
 case 3:
  if ((HEAP32[$4 + 8 >> 2] | 0) <= (HEAP32[$3 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$4 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  if ((HEAP32[$4 + 12 >> 2] | 0) <= (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ((HEAP32[$4 + 4 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 7;
   break;
  } else {
   label = 13;
   break;
  }
 case 7:
  if ((HEAP32[$3 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $1 = _pixman_break($2) | 0;
  label = 16;
  break;
 case 9:
  $65 = $2 | 0;
  $66 = $4;
  HEAP32[$65 >> 2] = HEAP32[$66 >> 2];
  HEAP32[$65 + 4 >> 2] = HEAP32[$66 + 4 >> 2];
  HEAP32[$65 + 8 >> 2] = HEAP32[$66 + 8 >> 2];
  HEAP32[$65 + 12 >> 2] = HEAP32[$66 + 12 >> 2];
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 12;
   break;
  }
 case 10:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 12;
  break;
 case 12:
  HEAP32[$2 + 16 >> 2] = 0;
  $1 = 1;
  label = 16;
  break;
 case 13:
  $89 = $inv_reg | 0;
  $90 = $4;
  HEAP32[$89 >> 2] = HEAP32[$90 >> 2];
  HEAP32[$89 + 4 >> 2] = HEAP32[$90 + 4 >> 2];
  HEAP32[$89 + 8 >> 2] = HEAP32[$90 + 8 >> 2];
  HEAP32[$89 + 12 >> 2] = HEAP32[$90 + 12 >> 2];
  HEAP32[$inv_reg + 16 >> 2] = 0;
  if ((_pixman_op($2, $inv_reg, $3, 34, 1, 0) | 0) != 0) {
   label = 15;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  $1 = 0;
  label = 16;
  break;
 case 15:
  _pixman_set_extents($2);
  $1 = 1;
  label = 16;
  break;
 case 16:
  STACKTOP = sp;
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_contains_rectangle($region, $prect) {
 $region = $region | 0;
 $prect = $prect | 0;
 var $1 = 0, $2 = 0, $3 = 0, $pbox = 0, $pbox_end = 0, $part_in = 0, $part_out = 0, $numRects = 0, $x = 0, $y = 0, $16 = 0, $126 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $prect;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $16 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 4;
  break;
 case 3:
  $16 = 1;
  label = 4;
  break;
 case 4:
  $numRects = $16;
  if (($numRects | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 9;
   break;
  }
 case 5:
  if ((HEAP32[$2 + 8 >> 2] | 0) <= (HEAP32[$3 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ((HEAP32[$2 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if ((HEAP32[$2 + 12 >> 2] | 0) <= (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ((HEAP32[$2 + 4 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  $1 = 0;
  label = 50;
  break;
 case 10:
  if (($numRects | 0) == 1) {
   label = 11;
   break;
  } else {
   label = 17;
   break;
  }
 case 11:
  if ((HEAP32[$2 >> 2] | 0) <= (HEAP32[$3 >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 16;
   break;
  }
 case 12:
  if ((HEAP32[$2 + 8 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 13;
   break;
  } else {
   label = 16;
   break;
  }
 case 13:
  if ((HEAP32[$2 + 4 >> 2] | 0) <= (HEAP32[$3 + 4 >> 2] | 0)) {
   label = 14;
   break;
  } else {
   label = 16;
   break;
  }
 case 14:
  if ((HEAP32[$2 + 12 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  $1 = 1;
  label = 50;
  break;
 case 16:
  $1 = 2;
  label = 50;
  break;
 case 17:
  $part_out = 0;
  $part_in = 0;
  $x = HEAP32[$3 >> 2] | 0;
  $y = HEAP32[$3 + 4 >> 2] | 0;
  $pbox = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  $pbox_end = $pbox + ($numRects << 4) | 0;
  label = 18;
  break;
 case 18:
  if (($pbox | 0) != ($pbox_end | 0)) {
   label = 19;
   break;
  } else {
   label = 45;
   break;
  }
 case 19:
  if ((HEAP32[$pbox + 12 >> 2] | 0) <= ($y | 0)) {
   label = 20;
   break;
  } else {
   label = 23;
   break;
  }
 case 20:
  $126 = _find_box_for_y($pbox, $pbox_end, $y) | 0;
  $pbox = $126;
  if (($126 | 0) == ($pbox_end | 0)) {
   label = 21;
   break;
  } else {
   label = 22;
   break;
  }
 case 21:
  label = 45;
  break;
 case 22:
  label = 23;
  break;
 case 23:
  if ((HEAP32[$pbox + 4 >> 2] | 0) > ($y | 0)) {
   label = 24;
   break;
  } else {
   label = 28;
   break;
  }
 case 24:
  $part_out = 1;
  if (($part_in | 0) != 0) {
   label = 26;
   break;
  } else {
   label = 25;
   break;
  }
 case 25:
  if ((HEAP32[$pbox + 4 >> 2] | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 26;
   break;
  } else {
   label = 27;
   break;
  }
 case 26:
  label = 45;
  break;
 case 27:
  $y = HEAP32[$pbox + 4 >> 2] | 0;
  label = 28;
  break;
 case 28:
  if ((HEAP32[$pbox + 8 >> 2] | 0) <= ($x | 0)) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  label = 44;
  break;
 case 30:
  if ((HEAP32[$pbox >> 2] | 0) > ($x | 0)) {
   label = 31;
   break;
  } else {
   label = 34;
   break;
  }
 case 31:
  $part_out = 1;
  if (($part_in | 0) != 0) {
   label = 32;
   break;
  } else {
   label = 33;
   break;
  }
 case 32:
  label = 45;
  break;
 case 33:
  label = 34;
  break;
 case 34:
  if ((HEAP32[$pbox >> 2] | 0) < (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 35;
   break;
  } else {
   label = 38;
   break;
  }
 case 35:
  $part_in = 1;
  if (($part_out | 0) != 0) {
   label = 36;
   break;
  } else {
   label = 37;
   break;
  }
 case 36:
  label = 45;
  break;
 case 37:
  label = 38;
  break;
 case 38:
  if ((HEAP32[$pbox + 8 >> 2] | 0) >= (HEAP32[$3 + 8 >> 2] | 0)) {
   label = 39;
   break;
  } else {
   label = 42;
   break;
  }
 case 39:
  $y = HEAP32[$pbox + 12 >> 2] | 0;
  if (($y | 0) >= (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 40;
   break;
  } else {
   label = 41;
   break;
  }
 case 40:
  label = 45;
  break;
 case 41:
  $x = HEAP32[$3 >> 2] | 0;
  label = 43;
  break;
 case 42:
  $part_out = 1;
  label = 45;
  break;
 case 43:
  label = 44;
  break;
 case 44:
  $pbox = $pbox + 16 | 0;
  label = 18;
  break;
 case 45:
  if (($part_in | 0) != 0) {
   label = 46;
   break;
  } else {
   label = 49;
   break;
  }
 case 46:
  if (($y | 0) < (HEAP32[$3 + 12 >> 2] | 0)) {
   label = 47;
   break;
  } else {
   label = 48;
   break;
  }
 case 47:
  $1 = 2;
  label = 50;
  break;
 case 48:
  $1 = 1;
  label = 50;
  break;
 case 49:
  $1 = 0;
  label = 50;
  break;
 case 50:
  return $1 | 0;
 }
 return 0;
}
function _find_box_for_y($begin, $end, $y) {
 $begin = $begin | 0;
 $end = $end | 0;
 $y = $y | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $mid = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $begin;
  $3 = $end;
  $4 = $y;
  if (($3 | 0) == ($2 | 0)) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $1 = $3;
  label = 10;
  break;
 case 3:
  if ((($3 - $2 | 0) / 16 | 0 | 0) == 1) {
   label = 4;
   break;
  } else {
   label = 7;
   break;
  }
 case 4:
  if ((HEAP32[$2 + 12 >> 2] | 0) > ($4 | 0)) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  $1 = $2;
  label = 10;
  break;
 case 6:
  $1 = $3;
  label = 10;
  break;
 case 7:
  $mid = $2 + (((($3 - $2 | 0) / 16 | 0 | 0) / 2 | 0) << 4) | 0;
  if ((HEAP32[$mid + 12 >> 2] | 0) > ($4 | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $1 = _find_box_for_y($2, $mid, $4) | 0;
  label = 10;
  break;
 case 9:
  $1 = _find_box_for_y($mid, $3, $4) | 0;
  label = 10;
  break;
 case 10:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_not_empty($region) {
 $region = $region | 0;
 var $1 = 0, $15 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   $15 = 0;
   label = 3;
   break;
  }
 case 2:
  $15 = (HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0) != 0 ^ 1;
  label = 3;
  break;
 case 3:
  return ($15 ^ 1) & 1 | 0;
 }
 return 0;
}
function _pixman_region32_extents($region) {
 $region = $region | 0;
 return $region | 0;
}
function _pixman_region32_translate($region, $x, $y) {
 $region = $region | 0;
 $x = $x | 0;
 $y = $y | 0;
 var $1 = 0, $2 = 0, $3 = 0, $x1 = 0, $x2 = 0, $y1 = 0, $y2 = 0, $nbox = 0, $pbox = 0, $pbox_out = 0, $9 = 0, $10$0 = 0, $20 = 0, $21$0 = 0, $31 = 0, $32$0 = 0, $42 = 0, $43$0 = 0, $49$0 = 0, $49$1 = 0, $51$0 = 0, $52$1 = 0, $54$0 = 0, $55$1 = 0, $57$0 = 0, $58$1 = 0, $$etemp$20$1 = 0, $70 = 0, $79 = 0, $85 = 0, $90 = 0, $95 = 0, $100 = 0, $110$0 = 0, $110$1 = 0, $112$0 = 0, $113$1 = 0, $115$0 = 0, $116$1 = 0, $118$0 = 0, $119$1 = 0, $$etemp$33$1 = 0, $157$1 = 0, $$etemp$36$1 = 0, $164$1 = 0, $$etemp$39$1 = 0, $172$1 = 0, $$etemp$42$1 = 0, $179$1 = 0, $$etemp$45$1 = 0, $196 = 0, $203 = 0, $205 = 0, $213 = 0, $214$0 = 0, $222 = 0, $223$0 = 0, $231 = 0, $232$0 = 0, $240 = 0, $241$0 = 0, $246$0 = 0, $246$1 = 0, $248$0 = 0, $249$1 = 0, $251$0 = 0, $252$1 = 0, $254$0 = 0, $255$1 = 0, $$etemp$66$1 = 0, $261 = 0, $265$1 = 0, $$etemp$69$1 = 0, $271$1 = 0, $$etemp$72$1 = 0, $278$1 = 0, $$etemp$75$1 = 0, $284$1 = 0, $$etemp$78$1 = 0, $315 = 0, $316 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $x1 = sp | 0;
  $x2 = sp + 8 | 0;
  $y1 = sp + 16 | 0;
  $y2 = sp + 24 | 0;
  $1 = $region;
  $2 = $x;
  $3 = $y;
  $9 = (HEAP32[$1 >> 2] | 0) + $2 | 0;
  $10$0 = $9;
  HEAP32[$x1 >> 2] = $10$0;
  HEAP32[$x1 + 4 >> 2] = ($9 | 0) < 0 ? -1 : 0;
  HEAP32[$1 >> 2] = $10$0;
  $20 = (HEAP32[$1 + 4 >> 2] | 0) + $3 | 0;
  $21$0 = $20;
  HEAP32[$y1 >> 2] = $21$0;
  HEAP32[$y1 + 4 >> 2] = ($20 | 0) < 0 ? -1 : 0;
  HEAP32[$1 + 4 >> 2] = $21$0;
  $31 = (HEAP32[$1 + 8 >> 2] | 0) + $2 | 0;
  $32$0 = $31;
  HEAP32[$x2 >> 2] = $32$0;
  HEAP32[$x2 + 4 >> 2] = ($31 | 0) < 0 ? -1 : 0;
  HEAP32[$1 + 8 >> 2] = $32$0;
  $42 = (HEAP32[$1 + 12 >> 2] | 0) + $3 | 0;
  $43$0 = $42;
  HEAP32[$y2 >> 2] = $43$0;
  HEAP32[$y2 + 4 >> 2] = ($42 | 0) < 0 ? -1 : 0;
  HEAP32[$1 + 12 >> 2] = $43$0;
  $49$0 = _i64Subtract(HEAP32[$x1 >> 2] | 0, HEAP32[$x1 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $49$1 = tempRet0;
  $51$0 = _i64Subtract(HEAP32[$y1 >> 2] | 0, HEAP32[$y1 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $52$1 = $49$1 | tempRet0;
  $54$0 = _i64Subtract(2147483647, 0, HEAP32[$x2 >> 2] | 0, HEAP32[$x2 + 4 >> 2] | 0) | 0;
  $55$1 = $52$1 | tempRet0;
  $57$0 = _i64Subtract(2147483647, 0, HEAP32[$y2 >> 2] | 0, HEAP32[$y2 + 4 >> 2] | 0) | 0;
  $58$1 = $55$1 | tempRet0;
  $$etemp$20$1 = 0;
  if (($58$1 | 0) >= ($$etemp$20$1 | 0) & (($58$1 | 0) > ($$etemp$20$1 | 0) | ($49$0 | $51$0 | $54$0 | $57$0) >>> 0 >= 0 >>> 0)) {
   label = 2;
   break;
  } else {
   label = 10;
   break;
  }
 case 2:
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 9;
   break;
  }
 case 3:
  $70 = HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0;
  $nbox = $70;
  if (($70 | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 9;
   break;
  }
 case 4:
  $pbox = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  label = 5;
  break;
 case 5:
  $79 = $nbox;
  $nbox = $79 - 1 | 0;
  if (($79 | 0) != 0) {
   label = 6;
   break;
  } else {
   label = 8;
   break;
  }
 case 6:
  $85 = $pbox | 0;
  HEAP32[$85 >> 2] = (HEAP32[$85 >> 2] | 0) + $2;
  $90 = $pbox + 4 | 0;
  HEAP32[$90 >> 2] = (HEAP32[$90 >> 2] | 0) + $3;
  $95 = $pbox + 8 | 0;
  HEAP32[$95 >> 2] = (HEAP32[$95 >> 2] | 0) + $2;
  $100 = $pbox + 12 | 0;
  HEAP32[$100 >> 2] = (HEAP32[$100 >> 2] | 0) + $3;
  label = 7;
  break;
 case 7:
  $pbox = $pbox + 16 | 0;
  label = 5;
  break;
 case 8:
  label = 9;
  break;
 case 9:
  label = 52;
  break;
 case 10:
  $110$0 = _i64Subtract(HEAP32[$x2 >> 2] | 0, HEAP32[$x2 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $110$1 = tempRet0;
  $112$0 = _i64Subtract(HEAP32[$y2 >> 2] | 0, HEAP32[$y2 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $113$1 = $110$1 | tempRet0;
  $115$0 = _i64Subtract(2147483647, 0, HEAP32[$x1 >> 2] | 0, HEAP32[$x1 + 4 >> 2] | 0) | 0;
  $116$1 = $113$1 | tempRet0;
  $118$0 = _i64Subtract(2147483647, 0, HEAP32[$y1 >> 2] | 0, HEAP32[$y1 + 4 >> 2] | 0) | 0;
  $119$1 = $116$1 | tempRet0;
  $$etemp$33$1 = 0;
  if (($119$1 | 0) <= ($$etemp$33$1 | 0) & (($119$1 | 0) < ($$etemp$33$1 | 0) | ($110$0 | $112$0 | $115$0 | $118$0) >>> 0 <= 0 >>> 0)) {
   label = 11;
   break;
  } else {
   label = 15;
   break;
  }
 case 11:
  HEAP32[$1 + 8 >> 2] = HEAP32[$1 >> 2];
  HEAP32[$1 + 12 >> 2] = HEAP32[$1 + 4 >> 2];
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 12;
   break;
  } else {
   label = 14;
   break;
  }
 case 12:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 14;
  break;
 case 14:
  HEAP32[$1 + 16 >> 2] = HEAP32[42];
  label = 52;
  break;
 case 15:
  $157$1 = HEAP32[$x1 + 4 >> 2] | 0;
  $$etemp$36$1 = -1;
  if (($157$1 | 0) < ($$etemp$36$1 | 0) | ($157$1 | 0) == ($$etemp$36$1 | 0) & (HEAP32[$x1 >> 2] | 0) >>> 0 < -2147483648 >>> 0) {
   label = 16;
   break;
  } else {
   label = 17;
   break;
  }
 case 16:
  HEAP32[$1 >> 2] = -2147483648;
  label = 20;
  break;
 case 17:
  $164$1 = HEAP32[$x2 + 4 >> 2] | 0;
  $$etemp$39$1 = 0;
  if (($164$1 | 0) > ($$etemp$39$1 | 0) | ($164$1 | 0) == ($$etemp$39$1 | 0) & (HEAP32[$x2 >> 2] | 0) >>> 0 > 2147483647 >>> 0) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  HEAP32[$1 + 8 >> 2] = 2147483647;
  label = 19;
  break;
 case 19:
  label = 20;
  break;
 case 20:
  $172$1 = HEAP32[$y1 + 4 >> 2] | 0;
  $$etemp$42$1 = -1;
  if (($172$1 | 0) < ($$etemp$42$1 | 0) | ($172$1 | 0) == ($$etemp$42$1 | 0) & (HEAP32[$y1 >> 2] | 0) >>> 0 < -2147483648 >>> 0) {
   label = 21;
   break;
  } else {
   label = 22;
   break;
  }
 case 21:
  HEAP32[$1 + 4 >> 2] = -2147483648;
  label = 25;
  break;
 case 22:
  $179$1 = HEAP32[$y2 + 4 >> 2] | 0;
  $$etemp$45$1 = 0;
  if (($179$1 | 0) > ($$etemp$45$1 | 0) | ($179$1 | 0) == ($$etemp$45$1 | 0) & (HEAP32[$y2 >> 2] | 0) >>> 0 > 2147483647 >>> 0) {
   label = 23;
   break;
  } else {
   label = 24;
   break;
  }
 case 23:
  HEAP32[$1 + 12 >> 2] = 2147483647;
  label = 24;
  break;
 case 24:
  label = 25;
  break;
 case 25:
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 26;
   break;
  } else {
   label = 52;
   break;
  }
 case 26:
  $196 = HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0;
  $nbox = $196;
  if (($196 | 0) != 0) {
   label = 27;
   break;
  } else {
   label = 52;
   break;
  }
 case 27:
  $203 = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  $pbox = $203;
  $pbox_out = $203;
  label = 28;
  break;
 case 28:
  $205 = $nbox;
  $nbox = $205 - 1 | 0;
  if (($205 | 0) != 0) {
   label = 29;
   break;
  } else {
   label = 43;
   break;
  }
 case 29:
  $213 = (HEAP32[$pbox >> 2] | 0) + $2 | 0;
  $214$0 = $213;
  HEAP32[$x1 >> 2] = $214$0;
  HEAP32[$x1 + 4 >> 2] = ($213 | 0) < 0 ? -1 : 0;
  HEAP32[$pbox_out >> 2] = $214$0;
  $222 = (HEAP32[$pbox + 4 >> 2] | 0) + $3 | 0;
  $223$0 = $222;
  HEAP32[$y1 >> 2] = $223$0;
  HEAP32[$y1 + 4 >> 2] = ($222 | 0) < 0 ? -1 : 0;
  HEAP32[$pbox_out + 4 >> 2] = $223$0;
  $231 = (HEAP32[$pbox + 8 >> 2] | 0) + $2 | 0;
  $232$0 = $231;
  HEAP32[$x2 >> 2] = $232$0;
  HEAP32[$x2 + 4 >> 2] = ($231 | 0) < 0 ? -1 : 0;
  HEAP32[$pbox_out + 8 >> 2] = $232$0;
  $240 = (HEAP32[$pbox + 12 >> 2] | 0) + $3 | 0;
  $241$0 = $240;
  HEAP32[$y2 >> 2] = $241$0;
  HEAP32[$y2 + 4 >> 2] = ($240 | 0) < 0 ? -1 : 0;
  HEAP32[$pbox_out + 12 >> 2] = $241$0;
  $246$0 = _i64Subtract(HEAP32[$x2 >> 2] | 0, HEAP32[$x2 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $246$1 = tempRet0;
  $248$0 = _i64Subtract(HEAP32[$y2 >> 2] | 0, HEAP32[$y2 + 4 >> 2] | 0, -2147483648, -1) | 0;
  $249$1 = $246$1 | tempRet0;
  $251$0 = _i64Subtract(2147483647, 0, HEAP32[$x1 >> 2] | 0, HEAP32[$x1 + 4 >> 2] | 0) | 0;
  $252$1 = $249$1 | tempRet0;
  $254$0 = _i64Subtract(2147483647, 0, HEAP32[$y1 >> 2] | 0, HEAP32[$y1 + 4 >> 2] | 0) | 0;
  $255$1 = $252$1 | tempRet0;
  $$etemp$66$1 = 0;
  if (($255$1 | 0) <= ($$etemp$66$1 | 0) & (($255$1 | 0) < ($$etemp$66$1 | 0) | ($246$0 | $248$0 | $251$0 | $254$0) >>> 0 <= 0 >>> 0)) {
   label = 30;
   break;
  } else {
   label = 31;
   break;
  }
 case 30:
  $261 = (HEAP32[$1 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$261 >> 2] = (HEAP32[$261 >> 2] | 0) - 1;
  label = 42;
  break;
 case 31:
  $265$1 = HEAP32[$x1 + 4 >> 2] | 0;
  $$etemp$69$1 = -1;
  if (($265$1 | 0) < ($$etemp$69$1 | 0) | ($265$1 | 0) == ($$etemp$69$1 | 0) & (HEAP32[$x1 >> 2] | 0) >>> 0 < -2147483648 >>> 0) {
   label = 32;
   break;
  } else {
   label = 33;
   break;
  }
 case 32:
  HEAP32[$pbox_out >> 2] = -2147483648;
  label = 36;
  break;
 case 33:
  $271$1 = HEAP32[$x2 + 4 >> 2] | 0;
  $$etemp$72$1 = 0;
  if (($271$1 | 0) > ($$etemp$72$1 | 0) | ($271$1 | 0) == ($$etemp$72$1 | 0) & (HEAP32[$x2 >> 2] | 0) >>> 0 > 2147483647 >>> 0) {
   label = 34;
   break;
  } else {
   label = 35;
   break;
  }
 case 34:
  HEAP32[$pbox_out + 8 >> 2] = 2147483647;
  label = 35;
  break;
 case 35:
  label = 36;
  break;
 case 36:
  $278$1 = HEAP32[$y1 + 4 >> 2] | 0;
  $$etemp$75$1 = -1;
  if (($278$1 | 0) < ($$etemp$75$1 | 0) | ($278$1 | 0) == ($$etemp$75$1 | 0) & (HEAP32[$y1 >> 2] | 0) >>> 0 < -2147483648 >>> 0) {
   label = 37;
   break;
  } else {
   label = 38;
   break;
  }
 case 37:
  HEAP32[$pbox_out + 4 >> 2] = -2147483648;
  label = 41;
  break;
 case 38:
  $284$1 = HEAP32[$y2 + 4 >> 2] | 0;
  $$etemp$78$1 = 0;
  if (($284$1 | 0) > ($$etemp$78$1 | 0) | ($284$1 | 0) == ($$etemp$78$1 | 0) & (HEAP32[$y2 >> 2] | 0) >>> 0 > 2147483647 >>> 0) {
   label = 39;
   break;
  } else {
   label = 40;
   break;
  }
 case 39:
  HEAP32[$pbox_out + 12 >> 2] = 2147483647;
  label = 40;
  break;
 case 40:
  label = 41;
  break;
 case 41:
  $pbox_out = $pbox_out + 16 | 0;
  label = 42;
  break;
 case 42:
  $pbox = $pbox + 16 | 0;
  label = 28;
  break;
 case 43:
  if (($pbox_out | 0) != ($pbox | 0)) {
   label = 44;
   break;
  } else {
   label = 51;
   break;
  }
 case 44:
  if ((HEAP32[(HEAP32[$1 + 16 >> 2] | 0) + 4 >> 2] | 0) == 1) {
   label = 45;
   break;
  } else {
   label = 49;
   break;
  }
 case 45:
  $315 = $1 | 0;
  $316 = (HEAP32[$1 + 16 >> 2] | 0) + 8 | 0;
  HEAP32[$315 >> 2] = HEAP32[$316 >> 2];
  HEAP32[$315 + 4 >> 2] = HEAP32[$316 + 4 >> 2];
  HEAP32[$315 + 8 >> 2] = HEAP32[$316 + 8 >> 2];
  HEAP32[$315 + 12 >> 2] = HEAP32[$316 + 12 >> 2];
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 46;
   break;
  } else {
   label = 48;
   break;
  }
 case 46:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 47;
   break;
  } else {
   label = 48;
   break;
  }
 case 47:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 48;
  break;
 case 48:
  HEAP32[$1 + 16 >> 2] = 0;
  label = 50;
  break;
 case 49:
  _pixman_set_extents($1);
  label = 50;
  break;
 case 50:
  label = 51;
  break;
 case 51:
  label = 52;
  break;
 case 52:
  STACKTOP = sp;
  return;
 }
}
function _pixman_region32_reset($region, $box) {
 $region = $region | 0;
 $box = $box | 0;
 var $1 = 0, $2 = 0, $20 = 0, $31 = 0, $32 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  $2 = $box;
  label = 2;
  break;
 case 2:
  if ((HEAP32[$2 >> 2] | 0) < (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 3;
   break;
  } else {
   $20 = 0;
   label = 4;
   break;
  }
 case 3:
  $20 = (HEAP32[$2 + 4 >> 2] | 0) < (HEAP32[$2 + 12 >> 2] | 0);
  label = 4;
  break;
 case 4:
  if ((($20 ^ 1) & 1 | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  __pixman_log_error(2072, 592);
  label = 6;
  break;
 case 6:
  label = 7;
  break;
 case 7:
  $31 = $1 | 0;
  $32 = $2;
  HEAP32[$31 >> 2] = HEAP32[$32 >> 2];
  HEAP32[$31 + 4 >> 2] = HEAP32[$32 + 4 >> 2];
  HEAP32[$31 + 8 >> 2] = HEAP32[$32 + 8 >> 2];
  HEAP32[$31 + 12 >> 2] = HEAP32[$32 + 12 >> 2];
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 8;
   break;
  } else {
   label = 10;
   break;
  }
 case 8:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 10;
  break;
 case 10:
  HEAP32[$1 + 16 >> 2] = 0;
  return;
 }
}
function _pixman_region32_clear($region) {
 $region = $region | 0;
 var $1 = 0, $22 = 0, $23 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $region;
  if ((HEAP32[$1 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 4;
   break;
  }
 case 2:
  if ((HEAP32[HEAP32[$1 + 16 >> 2] >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  _free(HEAP32[$1 + 16 >> 2] | 0);
  label = 4;
  break;
 case 4:
  $22 = $1 | 0;
  $23 = HEAP32[44] | 0;
  HEAP32[$22 >> 2] = HEAP32[$23 >> 2];
  HEAP32[$22 + 4 >> 2] = HEAP32[$23 + 4 >> 2];
  HEAP32[$22 + 8 >> 2] = HEAP32[$23 + 8 >> 2];
  HEAP32[$22 + 12 >> 2] = HEAP32[$23 + 12 >> 2];
  HEAP32[$1 + 16 >> 2] = HEAP32[42];
  return;
 }
}
function _pixman_region32_contains_point($region, $x, $y, $box) {
 $region = $region | 0;
 $x = $x | 0;
 $y = $y | 0;
 $box = $box | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $pbox = 0, $pbox_end = 0, $numRects = 0, $18 = 0, $60 = 0, $61 = 0, $106 = 0, $107 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $x;
  $4 = $y;
  $5 = $box;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $18 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 4;
  break;
 case 3:
  $18 = 1;
  label = 4;
  break;
 case 4:
  $numRects = $18;
  if (($numRects | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 9;
   break;
  }
 case 5:
  if ((HEAP32[$2 + 8 >> 2] | 0) > ($3 | 0)) {
   label = 6;
   break;
  } else {
   label = 9;
   break;
  }
 case 6:
  if ((HEAP32[$2 >> 2] | 0) <= ($3 | 0)) {
   label = 7;
   break;
  } else {
   label = 9;
   break;
  }
 case 7:
  if ((HEAP32[$2 + 12 >> 2] | 0) > ($4 | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  if ((HEAP32[$2 + 4 >> 2] | 0) <= ($4 | 0)) {
   label = 10;
   break;
  } else {
   label = 9;
   break;
  }
 case 9:
  $1 = 0;
  label = 26;
  break;
 case 10:
  if (($numRects | 0) == 1) {
   label = 11;
   break;
  } else {
   label = 14;
   break;
  }
 case 11:
  if (($5 | 0) != 0) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  $60 = $5;
  $61 = $2 | 0;
  HEAP32[$60 >> 2] = HEAP32[$61 >> 2];
  HEAP32[$60 + 4 >> 2] = HEAP32[$61 + 4 >> 2];
  HEAP32[$60 + 8 >> 2] = HEAP32[$61 + 8 >> 2];
  HEAP32[$60 + 12 >> 2] = HEAP32[$61 + 12 >> 2];
  label = 13;
  break;
 case 13:
  $1 = 1;
  label = 26;
  break;
 case 14:
  $pbox = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  $pbox_end = $pbox + ($numRects << 4) | 0;
  $pbox = _find_box_for_y($pbox, $pbox_end, $4) | 0;
  label = 15;
  break;
 case 15:
  if (($pbox | 0) != ($pbox_end | 0)) {
   label = 16;
   break;
  } else {
   label = 25;
   break;
  }
 case 16:
  if (($4 | 0) < (HEAP32[$pbox + 4 >> 2] | 0)) {
   label = 18;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  if (($3 | 0) < (HEAP32[$pbox >> 2] | 0)) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  label = 25;
  break;
 case 19:
  if (($3 | 0) >= (HEAP32[$pbox + 8 >> 2] | 0)) {
   label = 20;
   break;
  } else {
   label = 21;
   break;
  }
 case 20:
  label = 24;
  break;
 case 21:
  if (($5 | 0) != 0) {
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 22:
  $106 = $5;
  $107 = $pbox;
  HEAP32[$106 >> 2] = HEAP32[$107 >> 2];
  HEAP32[$106 + 4 >> 2] = HEAP32[$107 + 4 >> 2];
  HEAP32[$106 + 8 >> 2] = HEAP32[$107 + 8 >> 2];
  HEAP32[$106 + 12 >> 2] = HEAP32[$107 + 12 >> 2];
  label = 23;
  break;
 case 23:
  $1 = 1;
  label = 26;
  break;
 case 24:
  $pbox = $pbox + 16 | 0;
  label = 15;
  break;
 case 25:
  $1 = 0;
  label = 26;
  break;
 case 26:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_selfcheck($reg) {
 $reg = $reg | 0;
 var $1 = 0, $2 = 0, $i = 0, $numRects = 0, $pbox_p = 0, $pbox_n = 0, $box = 0, $36 = 0, $73 = 0, $75 = 0, $102 = 0, $104 = 0, $105 = 0, $118 = 0, $233 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $box = sp | 0;
  $2 = $reg;
  if ((HEAP32[$2 >> 2] | 0) > (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  if ((HEAP32[$2 + 4 >> 2] | 0) > (HEAP32[$2 + 12 >> 2] | 0)) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  $1 = 0;
  label = 40;
  break;
 case 4:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  $36 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  label = 7;
  break;
 case 6:
  $36 = 1;
  label = 7;
  break;
 case 7:
  $numRects = $36;
  if (($numRects | 0) != 0) {
   label = 14;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ((HEAP32[$2 >> 2] | 0) == (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 9;
   break;
  } else {
   $75 = 0;
   label = 13;
   break;
  }
 case 9:
  if ((HEAP32[$2 + 4 >> 2] | 0) == (HEAP32[$2 + 12 >> 2] | 0)) {
   label = 10;
   break;
  } else {
   $75 = 0;
   label = 13;
   break;
  }
 case 10:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   $73 = 1;
   label = 12;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  $73 = (HEAP32[$2 + 16 >> 2] | 0) == (HEAP32[42] | 0);
  label = 12;
  break;
 case 12:
  $75 = $73;
  label = 13;
  break;
 case 13:
  $1 = $75 & 1;
  label = 40;
  break;
 case 14:
  if (($numRects | 0) == 1) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  $1 = ((HEAP32[$2 + 16 >> 2] | 0) != 0 ^ 1) & 1;
  label = 40;
  break;
 case 16:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 17;
   break;
  } else {
   label = 18;
   break;
  }
 case 17:
  $102 = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  label = 19;
  break;
 case 18:
  $102 = $2 | 0;
  label = 19;
  break;
 case 19:
  $pbox_p = $102;
  $104 = $box;
  $105 = $pbox_p;
  HEAP32[$104 >> 2] = HEAP32[$105 >> 2];
  HEAP32[$104 + 4 >> 2] = HEAP32[$105 + 4 >> 2];
  HEAP32[$104 + 8 >> 2] = HEAP32[$105 + 8 >> 2];
  HEAP32[$104 + 12 >> 2] = HEAP32[$105 + 12 >> 2];
  HEAP32[$box + 12 >> 2] = HEAP32[$pbox_p + ($numRects - 1 << 4) + 12 >> 2];
  $pbox_n = $pbox_p + 16 | 0;
  $i = $numRects;
  label = 20;
  break;
 case 20:
  $118 = $i - 1 | 0;
  $i = $118;
  if (($118 | 0) > 0) {
   label = 21;
   break;
  } else {
   label = 35;
   break;
  }
 case 21:
  if ((HEAP32[$pbox_n >> 2] | 0) >= (HEAP32[$pbox_n + 8 >> 2] | 0)) {
   label = 23;
   break;
  } else {
   label = 22;
   break;
  }
 case 22:
  if ((HEAP32[$pbox_n + 4 >> 2] | 0) >= (HEAP32[$pbox_n + 12 >> 2] | 0)) {
   label = 23;
   break;
  } else {
   label = 24;
   break;
  }
 case 23:
  $1 = 0;
  label = 40;
  break;
 case 24:
  if ((HEAP32[$pbox_n >> 2] | 0) < (HEAP32[$box >> 2] | 0)) {
   label = 25;
   break;
  } else {
   label = 26;
   break;
  }
 case 25:
  HEAP32[$box >> 2] = HEAP32[$pbox_n >> 2];
  label = 26;
  break;
 case 26:
  if ((HEAP32[$pbox_n + 8 >> 2] | 0) > (HEAP32[$box + 8 >> 2] | 0)) {
   label = 27;
   break;
  } else {
   label = 28;
   break;
  }
 case 27:
  HEAP32[$box + 8 >> 2] = HEAP32[$pbox_n + 8 >> 2];
  label = 28;
  break;
 case 28:
  if ((HEAP32[$pbox_n + 4 >> 2] | 0) < (HEAP32[$pbox_p + 4 >> 2] | 0)) {
   label = 32;
   break;
  } else {
   label = 29;
   break;
  }
 case 29:
  if ((HEAP32[$pbox_n + 4 >> 2] | 0) == (HEAP32[$pbox_p + 4 >> 2] | 0)) {
   label = 30;
   break;
  } else {
   label = 33;
   break;
  }
 case 30:
  if ((HEAP32[$pbox_n >> 2] | 0) < (HEAP32[$pbox_p + 8 >> 2] | 0)) {
   label = 32;
   break;
  } else {
   label = 31;
   break;
  }
 case 31:
  if ((HEAP32[$pbox_n + 12 >> 2] | 0) != (HEAP32[$pbox_p + 12 >> 2] | 0)) {
   label = 32;
   break;
  } else {
   label = 33;
   break;
  }
 case 32:
  $1 = 0;
  label = 40;
  break;
 case 33:
  label = 34;
  break;
 case 34:
  $pbox_p = $pbox_p + 16 | 0;
  $pbox_n = $pbox_n + 16 | 0;
  label = 20;
  break;
 case 35:
  if ((HEAP32[$box >> 2] | 0) == (HEAP32[$2 >> 2] | 0)) {
   label = 36;
   break;
  } else {
   $233 = 0;
   label = 39;
   break;
  }
 case 36:
  if ((HEAP32[$box + 8 >> 2] | 0) == (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 37;
   break;
  } else {
   $233 = 0;
   label = 39;
   break;
  }
 case 37:
  if ((HEAP32[$box + 4 >> 2] | 0) == (HEAP32[$2 + 4 >> 2] | 0)) {
   label = 38;
   break;
  } else {
   $233 = 0;
   label = 39;
   break;
  }
 case 38:
  $233 = (HEAP32[$box + 12 >> 2] | 0) == (HEAP32[$2 + 12 >> 2] | 0);
  label = 39;
  break;
 case 39:
  $1 = $233 & 1;
  label = 40;
  break;
 case 40:
  STACKTOP = sp;
  return $1 | 0;
 }
 return 0;
}
function _pixman_region32_init_rects($region, $boxes, $count) {
 $region = $region | 0;
 $boxes = $boxes | 0;
 $count = $count | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $rects = 0, $displacement = 0, $i = 0, $box = 0, $61 = 0, $111 = 0, $112 = 0, $123 = 0, $163 = 0, $164 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $boxes;
  $4 = $count;
  if (($4 | 0) == 1) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  _pixman_region32_init_rect($2, HEAP32[$3 >> 2] | 0, HEAP32[$3 + 4 >> 2] | 0, (HEAP32[$3 + 8 >> 2] | 0) - (HEAP32[$3 >> 2] | 0) | 0, (HEAP32[$3 + 12 >> 2] | 0) - (HEAP32[$3 + 4 >> 2] | 0) | 0);
  $1 = 1;
  label = 31;
  break;
 case 3:
  _pixman_region32_init($2);
  if (($4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  $1 = 1;
  label = 31;
  break;
 case 5:
  if ((_pixman_rect_alloc($2, $4) | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $1 = 0;
  label = 31;
  break;
 case 7:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $61 = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  label = 10;
  break;
 case 9:
  $61 = $2 | 0;
  label = 10;
  break;
 case 10:
  $rects = $61;
  _memcpy($rects | 0, $3 | 0, $4 << 4) | 0;
  HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] = $4;
  $displacement = 0;
  $i = 0;
  label = 11;
  break;
 case 11:
  if (($i | 0) < ($4 | 0)) {
   label = 12;
   break;
  } else {
   label = 20;
   break;
  }
 case 12:
  $box = $rects + ($i << 4) | 0;
  if ((HEAP32[$box >> 2] | 0) >= (HEAP32[$box + 8 >> 2] | 0)) {
   label = 14;
   break;
  } else {
   label = 13;
   break;
  }
 case 13:
  if ((HEAP32[$box + 4 >> 2] | 0) >= (HEAP32[$box + 12 >> 2] | 0)) {
   label = 14;
   break;
  } else {
   label = 15;
   break;
  }
 case 14:
  $displacement = $displacement + 1 | 0;
  label = 18;
  break;
 case 15:
  if (($displacement | 0) != 0) {
   label = 16;
   break;
  } else {
   label = 17;
   break;
  }
 case 16:
  $111 = $rects + ($i - $displacement << 4) | 0;
  $112 = $rects + ($i << 4) | 0;
  HEAP32[$111 >> 2] = HEAP32[$112 >> 2];
  HEAP32[$111 + 4 >> 2] = HEAP32[$112 + 4 >> 2];
  HEAP32[$111 + 8 >> 2] = HEAP32[$112 + 8 >> 2];
  HEAP32[$111 + 12 >> 2] = HEAP32[$112 + 12 >> 2];
  label = 17;
  break;
 case 17:
  label = 18;
  break;
 case 18:
  label = 19;
  break;
 case 19:
  $i = $i + 1 | 0;
  label = 11;
  break;
 case 20:
  $123 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$123 >> 2] = (HEAP32[$123 >> 2] | 0) - $displacement;
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == 0) {
   label = 21;
   break;
  } else {
   label = 25;
   break;
  }
 case 21:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 22;
   break;
  } else {
   label = 24;
   break;
  }
 case 22:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 23;
   break;
  } else {
   label = 24;
   break;
  }
 case 23:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 24;
  break;
 case 24:
  _pixman_region32_init($2);
  $1 = 1;
  label = 31;
  break;
 case 25:
  if ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) == 1) {
   label = 26;
   break;
  } else {
   label = 30;
   break;
  }
 case 26:
  $163 = $2 | 0;
  $164 = $rects | 0;
  HEAP32[$163 >> 2] = HEAP32[$164 >> 2];
  HEAP32[$163 + 4 >> 2] = HEAP32[$164 + 4 >> 2];
  HEAP32[$163 + 8 >> 2] = HEAP32[$164 + 8 >> 2];
  HEAP32[$163 + 12 >> 2] = HEAP32[$164 + 12 >> 2];
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 27;
   break;
  } else {
   label = 29;
   break;
  }
 case 27:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 28;
   break;
  } else {
   label = 29;
   break;
  }
 case 28:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 29;
  break;
 case 29:
  HEAP32[$2 + 16 >> 2] = 0;
  $1 = 1;
  label = 31;
  break;
 case 30:
  HEAP32[$2 + 8 >> 2] = 0;
  HEAP32[$2 >> 2] = 0;
  $1 = _validate($2) | 0;
  label = 31;
  break;
 case 31:
  return $1 | 0;
 }
 return 0;
}
function _pixman_rect_alloc($region, $n) {
 $region = $region | 0;
 $n = $n | 0;
 var $1 = 0, $2 = 0, $3 = 0, $data = 0, $34 = 0, $35 = 0, $90 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $n;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 5;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $3 = $3 + 1 | 0;
  HEAP32[$2 + 16 >> 2] = _alloc_data($3) | 0;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  $1 = _pixman_break($2) | 0;
  label = 21;
  break;
 case 4:
  HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] = 1;
  $34 = (HEAP32[$2 + 16 >> 2] | 0) + 8 | 0;
  $35 = $2 | 0;
  HEAP32[$34 >> 2] = HEAP32[$35 >> 2];
  HEAP32[$34 + 4 >> 2] = HEAP32[$35 + 4 >> 2];
  HEAP32[$34 + 8 >> 2] = HEAP32[$35 + 8 >> 2];
  HEAP32[$34 + 12 >> 2] = HEAP32[$35 + 12 >> 2];
  label = 20;
  break;
 case 5:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 9;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  HEAP32[$2 + 16 >> 2] = _alloc_data($3) | 0;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 8;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  $1 = _pixman_break($2) | 0;
  label = 21;
  break;
 case 8:
  HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] = 0;
  label = 19;
  break;
 case 9:
  if (($3 | 0) == 1) {
   label = 10;
   break;
  } else {
   label = 13;
   break;
  }
 case 10:
  $3 = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if (($3 | 0) > 500) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  $3 = 250;
  label = 12;
  break;
 case 12:
  label = 13;
  break;
 case 13:
  $3 = $3 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) | 0;
  if ((_PIXREGION_SZOF($3) | 0) != 0) {
   label = 15;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  $data = 0;
  label = 16;
  break;
 case 15:
  $90 = HEAP32[$2 + 16 >> 2] | 0;
  $data = _realloc($90, _PIXREGION_SZOF($3) | 0) | 0;
  label = 16;
  break;
 case 16:
  if (($data | 0) != 0) {
   label = 18;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $1 = _pixman_break($2) | 0;
  label = 21;
  break;
 case 18:
  HEAP32[$2 + 16 >> 2] = $data;
  label = 19;
  break;
 case 19:
  label = 20;
  break;
 case 20:
  HEAP32[HEAP32[$2 + 16 >> 2] >> 2] = $3;
  $1 = 1;
  label = 21;
  break;
 case 21:
  return $1 | 0;
 }
 return 0;
}
function _validate($badreg) {
 $badreg = $badreg | 0;
 var $1 = 0, $2 = 0, $stack_regions = 0, $numRects = 0, $ri = 0, $num_ri = 0, $size_ri = 0, $i = 0, $j = 0, $rit = 0, $reg = 0, $box = 0, $ri_box = 0, $hreg = 0, $ret = 0, $new_data = 0, $data_size = 0, $data_size1 = 0, $half = 0, $120 = 0, $121 = 0, $134 = 0, $135 = 0, $145 = 0, $146 = 0, $153 = 0, $162 = 0, $256 = 0, $257 = 0, $261 = 0, $388 = 0, $389 = 0, $393 = 0, $459 = 0, $460 = 0, $481 = 0, $726 = 0, $727 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 1792 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $stack_regions = sp | 0;
  $2 = $badreg;
  $ret = 1;
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $1 = 1;
  label = 131;
  break;
 case 3:
  $numRects = HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0;
  if (($numRects | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$2 + 16 >> 2] | 0) == (HEAP32[46] | 0)) {
   label = 5;
   break;
  } else {
   label = 6;
   break;
  }
 case 5:
  $1 = 0;
  label = 131;
  break;
 case 6:
  $1 = 1;
  label = 131;
  break;
 case 7:
  if ((HEAP32[$2 >> 2] | 0) < (HEAP32[$2 + 8 >> 2] | 0)) {
   label = 8;
   break;
  } else {
   label = 25;
   break;
  }
 case 8:
  if (($numRects | 0) == 1) {
   label = 9;
   break;
  } else {
   label = 13;
   break;
  }
 case 9:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 12;
   break;
  }
 case 10:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  _free(HEAP32[$2 + 16 >> 2] | 0);
  label = 12;
  break;
 case 12:
  HEAP32[$2 + 16 >> 2] = 0;
  label = 24;
  break;
 case 13:
  label = 14;
  break;
 case 14:
  if (($numRects | 0) < (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] >> 1 | 0)) {
   label = 15;
   break;
  } else {
   label = 22;
   break;
  }
 case 15:
  if ((HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0) > 50) {
   label = 16;
   break;
  } else {
   label = 22;
   break;
  }
 case 16:
  $data_size = _PIXREGION_SZOF($numRects) | 0;
  if (($data_size | 0) != 0) {
   label = 18;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $new_data = 0;
  label = 19;
  break;
 case 18:
  $new_data = _realloc(HEAP32[$2 + 16 >> 2] | 0, $data_size) | 0;
  label = 19;
  break;
 case 19:
  if (($new_data | 0) != 0) {
   label = 20;
   break;
  } else {
   label = 21;
   break;
  }
 case 20:
  HEAP32[$new_data >> 2] = $numRects;
  HEAP32[$2 + 16 >> 2] = $new_data;
  label = 21;
  break;
 case 21:
  label = 22;
  break;
 case 22:
  label = 23;
  break;
 case 23:
  label = 24;
  break;
 case 24:
  $1 = 1;
  label = 131;
  break;
 case 25:
  _quick_sort_rects((HEAP32[$2 + 16 >> 2] | 0) + 8 | 0, $numRects);
  $ri = $stack_regions | 0;
  $size_ri = 64;
  $num_ri = 1;
  HEAP32[$ri + 20 >> 2] = 0;
  HEAP32[$ri + 24 >> 2] = 0;
  $120 = $ri | 0;
  $121 = $2;
  HEAP32[$120 >> 2] = HEAP32[$121 >> 2];
  HEAP32[$120 + 4 >> 2] = HEAP32[$121 + 4 >> 2];
  HEAP32[$120 + 8 >> 2] = HEAP32[$121 + 8 >> 2];
  HEAP32[$120 + 12 >> 2] = HEAP32[$121 + 12 >> 2];
  HEAP32[$120 + 16 >> 2] = HEAP32[$121 + 16 >> 2];
  $box = (HEAP32[$ri + 16 >> 2] | 0) + 8 | 0;
  $134 = $ri | 0;
  $135 = $box;
  HEAP32[$134 >> 2] = HEAP32[$135 >> 2];
  HEAP32[$134 + 4 >> 2] = HEAP32[$135 + 4 >> 2];
  HEAP32[$134 + 8 >> 2] = HEAP32[$135 + 8 >> 2];
  HEAP32[$134 + 12 >> 2] = HEAP32[$135 + 12 >> 2];
  HEAP32[(HEAP32[$ri + 16 >> 2] | 0) + 4 >> 2] = 1;
  $145 = $2 | 0;
  $146 = HEAP32[44] | 0;
  HEAP32[$145 >> 2] = HEAP32[$146 >> 2];
  HEAP32[$145 + 4 >> 2] = HEAP32[$146 + 4 >> 2];
  HEAP32[$145 + 8 >> 2] = HEAP32[$146 + 8 >> 2];
  HEAP32[$145 + 12 >> 2] = HEAP32[$146 + 12 >> 2];
  HEAP32[$2 + 16 >> 2] = HEAP32[42];
  $i = $numRects;
  label = 26;
  break;
 case 26:
  $153 = $i - 1 | 0;
  $i = $153;
  if (($153 | 0) > 0) {
   label = 27;
   break;
  } else {
   label = 80;
   break;
  }
 case 27:
  $box = $box + 16 | 0;
  $j = $num_ri;
  $rit = $ri;
  label = 28;
  break;
 case 28:
  $162 = $j - 1 | 0;
  $j = $162;
  if (($162 | 0) >= 0) {
   label = 29;
   break;
  } else {
   label = 65;
   break;
  }
 case 29:
  $reg = $rit | 0;
  $ri_box = (HEAP32[$reg + 16 >> 2] | 0) + 8 + ((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) - 1 << 4) | 0;
  if ((HEAP32[$box + 4 >> 2] | 0) == (HEAP32[$ri_box + 4 >> 2] | 0)) {
   label = 30;
   break;
  } else {
   label = 44;
   break;
  }
 case 30:
  if ((HEAP32[$box + 12 >> 2] | 0) == (HEAP32[$ri_box + 12 >> 2] | 0)) {
   label = 31;
   break;
  } else {
   label = 44;
   break;
  }
 case 31:
  if ((HEAP32[$box >> 2] | 0) <= (HEAP32[$ri_box + 8 >> 2] | 0)) {
   label = 32;
   break;
  } else {
   label = 35;
   break;
  }
 case 32:
  if ((HEAP32[$box + 8 >> 2] | 0) > (HEAP32[$ri_box + 8 >> 2] | 0)) {
   label = 33;
   break;
  } else {
   label = 34;
   break;
  }
 case 33:
  HEAP32[$ri_box + 8 >> 2] = HEAP32[$box + 8 >> 2];
  label = 34;
  break;
 case 34:
  label = 43;
  break;
 case 35:
  label = 36;
  break;
 case 36:
  if ((HEAP32[$reg + 16 >> 2] | 0) != 0) {
   label = 37;
   break;
  } else {
   label = 38;
   break;
  }
 case 37:
  if (((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) + 1 | 0) > (HEAP32[HEAP32[$reg + 16 >> 2] >> 2] | 0)) {
   label = 38;
   break;
  } else {
   label = 41;
   break;
  }
 case 38:
  if ((_pixman_rect_alloc($reg, 1) | 0) != 0) {
   label = 40;
   break;
  } else {
   label = 39;
   break;
  }
 case 39:
  label = 121;
  break;
 case 40:
  label = 41;
  break;
 case 41:
  label = 42;
  break;
 case 42:
  $256 = (HEAP32[$reg + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  $257 = $box;
  HEAP32[$256 >> 2] = HEAP32[$257 >> 2];
  HEAP32[$256 + 4 >> 2] = HEAP32[$257 + 4 >> 2];
  HEAP32[$256 + 8 >> 2] = HEAP32[$257 + 8 >> 2];
  HEAP32[$256 + 12 >> 2] = HEAP32[$257 + 12 >> 2];
  $261 = (HEAP32[$reg + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$261 >> 2] = (HEAP32[$261 >> 2] | 0) + 1;
  label = 43;
  break;
 case 43:
  label = 79;
  break;
 case 44:
  if ((HEAP32[$box + 4 >> 2] | 0) >= (HEAP32[$ri_box + 12 >> 2] | 0)) {
   label = 45;
   break;
  } else {
   label = 62;
   break;
  }
 case 45:
  if ((HEAP32[$reg + 8 >> 2] | 0) < (HEAP32[$ri_box + 8 >> 2] | 0)) {
   label = 46;
   break;
  } else {
   label = 47;
   break;
  }
 case 46:
  HEAP32[$reg + 8 >> 2] = HEAP32[$ri_box + 8 >> 2];
  label = 47;
  break;
 case 47:
  if ((HEAP32[$reg >> 2] | 0) > (HEAP32[$box >> 2] | 0)) {
   label = 48;
   break;
  } else {
   label = 49;
   break;
  }
 case 48:
  HEAP32[$reg >> 2] = HEAP32[$box >> 2];
  label = 49;
  break;
 case 49:
  label = 50;
  break;
 case 50:
  if (((HEAP32[$rit + 24 >> 2] | 0) - (HEAP32[$rit + 20 >> 2] | 0) | 0) == ((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) - (HEAP32[$rit + 24 >> 2] | 0) | 0)) {
   label = 51;
   break;
  } else {
   label = 52;
   break;
  }
 case 51:
  HEAP32[$rit + 20 >> 2] = _pixman_coalesce($reg, HEAP32[$rit + 20 >> 2] | 0, HEAP32[$rit + 24 >> 2] | 0) | 0;
  label = 53;
  break;
 case 52:
  HEAP32[$rit + 20 >> 2] = HEAP32[$rit + 24 >> 2];
  label = 53;
  break;
 case 53:
  label = 54;
  break;
 case 54:
  HEAP32[$rit + 24 >> 2] = HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2];
  label = 55;
  break;
 case 55:
  if ((HEAP32[$reg + 16 >> 2] | 0) != 0) {
   label = 56;
   break;
  } else {
   label = 57;
   break;
  }
 case 56:
  if (((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) + 1 | 0) > (HEAP32[HEAP32[$reg + 16 >> 2] >> 2] | 0)) {
   label = 57;
   break;
  } else {
   label = 60;
   break;
  }
 case 57:
  if ((_pixman_rect_alloc($reg, 1) | 0) != 0) {
   label = 59;
   break;
  } else {
   label = 58;
   break;
  }
 case 58:
  label = 121;
  break;
 case 59:
  label = 60;
  break;
 case 60:
  label = 61;
  break;
 case 61:
  $388 = (HEAP32[$reg + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  $389 = $box;
  HEAP32[$388 >> 2] = HEAP32[$389 >> 2];
  HEAP32[$388 + 4 >> 2] = HEAP32[$389 + 4 >> 2];
  HEAP32[$388 + 8 >> 2] = HEAP32[$389 + 8 >> 2];
  HEAP32[$388 + 12 >> 2] = HEAP32[$389 + 12 >> 2];
  $393 = (HEAP32[$reg + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$393 >> 2] = (HEAP32[$393 >> 2] | 0) + 1;
  label = 79;
  break;
 case 62:
  label = 63;
  break;
 case 63:
  label = 64;
  break;
 case 64:
  $rit = $rit + 28 | 0;
  label = 28;
  break;
 case 65:
  if (($size_ri | 0) == ($num_ri | 0)) {
   label = 66;
   break;
  } else {
   label = 76;
   break;
  }
 case 66:
  $size_ri = $size_ri << 1;
  $data_size1 = $size_ri * 28 | 0;
  if ((($data_size1 >>> 0) / ($size_ri >>> 0) | 0 | 0) != 28) {
   label = 67;
   break;
  } else {
   label = 68;
   break;
  }
 case 67:
  label = 121;
  break;
 case 68:
  if (($ri | 0) == ($stack_regions | 0)) {
   label = 69;
   break;
  } else {
   label = 72;
   break;
  }
 case 69:
  $rit = _malloc($data_size1) | 0;
  if (($rit | 0) != 0) {
   label = 71;
   break;
  } else {
   label = 70;
   break;
  }
 case 70:
  label = 121;
  break;
 case 71:
  _memcpy($rit | 0, $ri | 0, $num_ri * 28 | 0) | 0;
  label = 75;
  break;
 case 72:
  $rit = _realloc($ri, $data_size1) | 0;
  if (($rit | 0) != 0) {
   label = 74;
   break;
  } else {
   label = 73;
   break;
  }
 case 73:
  label = 121;
  break;
 case 74:
  label = 75;
  break;
 case 75:
  $ri = $rit;
  $rit = $ri + ($num_ri * 28 | 0) | 0;
  label = 76;
  break;
 case 76:
  $num_ri = $num_ri + 1 | 0;
  HEAP32[$rit + 20 >> 2] = 0;
  HEAP32[$rit + 24 >> 2] = 0;
  $459 = $rit | 0;
  $460 = $box;
  HEAP32[$459 >> 2] = HEAP32[$460 >> 2];
  HEAP32[$459 + 4 >> 2] = HEAP32[$460 + 4 >> 2];
  HEAP32[$459 + 8 >> 2] = HEAP32[$460 + 8 >> 2];
  HEAP32[$459 + 12 >> 2] = HEAP32[$460 + 12 >> 2];
  HEAP32[$rit + 16 >> 2] = 0;
  if ((_pixman_rect_alloc($rit | 0, ($i + $num_ri | 0) / ($num_ri | 0) | 0) | 0) != 0) {
   label = 78;
   break;
  } else {
   label = 77;
   break;
  }
 case 77:
  label = 121;
  break;
 case 78:
  label = 79;
  break;
 case 79:
  label = 26;
  break;
 case 80:
  $j = $num_ri;
  $rit = $ri;
  label = 81;
  break;
 case 81:
  $481 = $j - 1 | 0;
  $j = $481;
  if (($481 | 0) >= 0) {
   label = 82;
   break;
  } else {
   label = 96;
   break;
  }
 case 82:
  $reg = $rit | 0;
  $ri_box = (HEAP32[$reg + 16 >> 2] | 0) + 8 + ((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) - 1 << 4) | 0;
  HEAP32[$reg + 12 >> 2] = HEAP32[$ri_box + 12 >> 2];
  if ((HEAP32[$reg + 8 >> 2] | 0) < (HEAP32[$ri_box + 8 >> 2] | 0)) {
   label = 83;
   break;
  } else {
   label = 84;
   break;
  }
 case 83:
  HEAP32[$reg + 8 >> 2] = HEAP32[$ri_box + 8 >> 2];
  label = 84;
  break;
 case 84:
  label = 85;
  break;
 case 85:
  if (((HEAP32[$rit + 24 >> 2] | 0) - (HEAP32[$rit + 20 >> 2] | 0) | 0) == ((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) - (HEAP32[$rit + 24 >> 2] | 0) | 0)) {
   label = 86;
   break;
  } else {
   label = 87;
   break;
  }
 case 86:
  HEAP32[$rit + 20 >> 2] = _pixman_coalesce($reg, HEAP32[$rit + 20 >> 2] | 0, HEAP32[$rit + 24 >> 2] | 0) | 0;
  label = 88;
  break;
 case 87:
  HEAP32[$rit + 20 >> 2] = HEAP32[$rit + 24 >> 2];
  label = 88;
  break;
 case 88:
  label = 89;
  break;
 case 89:
  if ((HEAP32[(HEAP32[$reg + 16 >> 2] | 0) + 4 >> 2] | 0) == 1) {
   label = 90;
   break;
  } else {
   label = 94;
   break;
  }
 case 90:
  if ((HEAP32[$reg + 16 >> 2] | 0) != 0) {
   label = 91;
   break;
  } else {
   label = 93;
   break;
  }
 case 91:
  if ((HEAP32[HEAP32[$reg + 16 >> 2] >> 2] | 0) != 0) {
   label = 92;
   break;
  } else {
   label = 93;
   break;
  }
 case 92:
  _free(HEAP32[$reg + 16 >> 2] | 0);
  label = 93;
  break;
 case 93:
  HEAP32[$reg + 16 >> 2] = 0;
  label = 94;
  break;
 case 94:
  label = 95;
  break;
 case 95:
  $rit = $rit + 28 | 0;
  label = 81;
  break;
 case 96:
  label = 97;
  break;
 case 97:
  if (($num_ri | 0) > 1) {
   label = 98;
   break;
  } else {
   label = 118;
   break;
  }
 case 98:
  $half = ($num_ri | 0) / 2 | 0;
  $j = $num_ri & 1;
  label = 99;
  break;
 case 99:
  if (($j | 0) < ($half + ($num_ri & 1) | 0)) {
   label = 100;
   break;
  } else {
   label = 115;
   break;
  }
 case 100:
  $reg = $ri + ($j * 28 | 0) | 0;
  $hreg = $ri + (($j + $half | 0) * 28 | 0) | 0;
  if ((_pixman_op($reg, $reg, $hreg, 32, 1, 1) | 0) != 0) {
   label = 102;
   break;
  } else {
   label = 101;
   break;
  }
 case 101:
  $ret = 0;
  label = 102;
  break;
 case 102:
  if ((HEAP32[$hreg >> 2] | 0) < (HEAP32[$reg >> 2] | 0)) {
   label = 103;
   break;
  } else {
   label = 104;
   break;
  }
 case 103:
  HEAP32[$reg >> 2] = HEAP32[$hreg >> 2];
  label = 104;
  break;
 case 104:
  if ((HEAP32[$hreg + 4 >> 2] | 0) < (HEAP32[$reg + 4 >> 2] | 0)) {
   label = 105;
   break;
  } else {
   label = 106;
   break;
  }
 case 105:
  HEAP32[$reg + 4 >> 2] = HEAP32[$hreg + 4 >> 2];
  label = 106;
  break;
 case 106:
  if ((HEAP32[$hreg + 8 >> 2] | 0) > (HEAP32[$reg + 8 >> 2] | 0)) {
   label = 107;
   break;
  } else {
   label = 108;
   break;
  }
 case 107:
  HEAP32[$reg + 8 >> 2] = HEAP32[$hreg + 8 >> 2];
  label = 108;
  break;
 case 108:
  if ((HEAP32[$hreg + 12 >> 2] | 0) > (HEAP32[$reg + 12 >> 2] | 0)) {
   label = 109;
   break;
  } else {
   label = 110;
   break;
  }
 case 109:
  HEAP32[$reg + 12 >> 2] = HEAP32[$hreg + 12 >> 2];
  label = 110;
  break;
 case 110:
  if ((HEAP32[$hreg + 16 >> 2] | 0) != 0) {
   label = 111;
   break;
  } else {
   label = 113;
   break;
  }
 case 111:
  if ((HEAP32[HEAP32[$hreg + 16 >> 2] >> 2] | 0) != 0) {
   label = 112;
   break;
  } else {
   label = 113;
   break;
  }
 case 112:
  _free(HEAP32[$hreg + 16 >> 2] | 0);
  label = 113;
  break;
 case 113:
  label = 114;
  break;
 case 114:
  $j = $j + 1 | 0;
  label = 99;
  break;
 case 115:
  $num_ri = $num_ri - $half | 0;
  if (($ret | 0) != 0) {
   label = 117;
   break;
  } else {
   label = 116;
   break;
  }
 case 116:
  label = 121;
  break;
 case 117:
  label = 97;
  break;
 case 118:
  $726 = $2;
  $727 = $ri | 0;
  HEAP32[$726 >> 2] = HEAP32[$727 >> 2];
  HEAP32[$726 + 4 >> 2] = HEAP32[$727 + 4 >> 2];
  HEAP32[$726 + 8 >> 2] = HEAP32[$727 + 8 >> 2];
  HEAP32[$726 + 12 >> 2] = HEAP32[$727 + 12 >> 2];
  HEAP32[$726 + 16 >> 2] = HEAP32[$727 + 16 >> 2];
  if (($ri | 0) != ($stack_regions | 0)) {
   label = 119;
   break;
  } else {
   label = 120;
   break;
  }
 case 119:
  _free($ri);
  label = 120;
  break;
 case 120:
  $1 = $ret;
  label = 131;
  break;
 case 121:
  $i = 0;
  label = 122;
  break;
 case 122:
  if (($i | 0) < ($num_ri | 0)) {
   label = 123;
   break;
  } else {
   label = 128;
   break;
  }
 case 123:
  if ((HEAP32[$ri + ($i * 28 | 0) + 16 >> 2] | 0) != 0) {
   label = 124;
   break;
  } else {
   label = 126;
   break;
  }
 case 124:
  if ((HEAP32[HEAP32[$ri + ($i * 28 | 0) + 16 >> 2] >> 2] | 0) != 0) {
   label = 125;
   break;
  } else {
   label = 126;
   break;
  }
 case 125:
  _free(HEAP32[$ri + ($i * 28 | 0) + 16 >> 2] | 0);
  label = 126;
  break;
 case 126:
  label = 127;
  break;
 case 127:
  $i = $i + 1 | 0;
  label = 122;
  break;
 case 128:
  if (($ri | 0) != ($stack_regions | 0)) {
   label = 129;
   break;
  } else {
   label = 130;
   break;
  }
 case 129:
  _free($ri);
  label = 130;
  break;
 case 130:
  $1 = _pixman_break($2) | 0;
  label = 131;
  break;
 case 131:
  STACKTOP = sp;
  return $1 | 0;
 }
 return 0;
}
function _PIXREGION_SZOF($n) {
 $n = $n | 0;
 var $1 = 0, $2 = 0, $size = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $n;
  $size = $2 << 4;
  if ($2 >>> 0 > 268435455) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $1 = 0;
  label = 6;
  break;
 case 3:
  if (8 > (-1 - $size | 0) >>> 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  $1 = 0;
  label = 6;
  break;
 case 5:
  $1 = $size + 8 | 0;
  label = 6;
  break;
 case 6:
  return $1 | 0;
 }
 return 0;
}
function _quick_sort_rects($rects, $numRects) {
 $rects = $rects | 0;
 $numRects = $numRects | 0;
 var $1 = 0, $2 = 0, $y1 = 0, $x1 = 0, $i = 0, $j = 0, $r = 0, $t = 0, $t1 = 0, $t2 = 0, $t3 = 0, $39 = 0, $40 = 0, $45 = 0, $46 = 0, $49 = 0, $50 = 0, $55 = 0, $56 = 0, $63 = 0, $64 = 0, $69 = 0, $70 = 0, $112 = 0, $114 = 0, $116 = 0, $145 = 0, $147 = 0, $156 = 0, $157 = 0, $164 = 0, $165 = 0, $169 = 0, $170 = 0, $179 = 0, $180 = 0, $186 = 0, $187 = 0, $191 = 0, $192 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $t = sp | 0;
  $t1 = sp + 16 | 0;
  $t2 = sp + 32 | 0;
  $t3 = sp + 48 | 0;
  $1 = $rects;
  $2 = $numRects;
  label = 2;
  break;
 case 2:
  if (($2 | 0) == 2) {
   label = 3;
   break;
  } else {
   label = 8;
   break;
  }
 case 3:
  if ((HEAP32[$1 + 4 >> 2] | 0) > (HEAP32[$1 + 20 >> 2] | 0)) {
   label = 6;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if ((HEAP32[$1 + 4 >> 2] | 0) == (HEAP32[$1 + 20 >> 2] | 0)) {
   label = 5;
   break;
  } else {
   label = 7;
   break;
  }
 case 5:
  if ((HEAP32[$1 >> 2] | 0) > (HEAP32[$1 + 16 >> 2] | 0)) {
   label = 6;
   break;
  } else {
   label = 7;
   break;
  }
 case 6:
  $39 = $t;
  $40 = $1 | 0;
  HEAP32[$39 >> 2] = HEAP32[$40 >> 2];
  HEAP32[$39 + 4 >> 2] = HEAP32[$40 + 4 >> 2];
  HEAP32[$39 + 8 >> 2] = HEAP32[$40 + 8 >> 2];
  HEAP32[$39 + 12 >> 2] = HEAP32[$40 + 12 >> 2];
  $45 = $1 | 0;
  $46 = $1 + 16 | 0;
  HEAP32[$45 >> 2] = HEAP32[$46 >> 2];
  HEAP32[$45 + 4 >> 2] = HEAP32[$46 + 4 >> 2];
  HEAP32[$45 + 8 >> 2] = HEAP32[$46 + 8 >> 2];
  HEAP32[$45 + 12 >> 2] = HEAP32[$46 + 12 >> 2];
  $49 = $1 + 16 | 0;
  $50 = $t;
  HEAP32[$49 >> 2] = HEAP32[$50 >> 2];
  HEAP32[$49 + 4 >> 2] = HEAP32[$50 + 4 >> 2];
  HEAP32[$49 + 8 >> 2] = HEAP32[$50 + 8 >> 2];
  HEAP32[$49 + 12 >> 2] = HEAP32[$50 + 12 >> 2];
  label = 7;
  break;
 case 7:
  label = 33;
  break;
 case 8:
  $55 = $t1;
  $56 = $1 | 0;
  HEAP32[$55 >> 2] = HEAP32[$56 >> 2];
  HEAP32[$55 + 4 >> 2] = HEAP32[$56 + 4 >> 2];
  HEAP32[$55 + 8 >> 2] = HEAP32[$56 + 8 >> 2];
  HEAP32[$55 + 12 >> 2] = HEAP32[$56 + 12 >> 2];
  $63 = $1 | 0;
  $64 = $1 + ($2 >> 1 << 4) | 0;
  HEAP32[$63 >> 2] = HEAP32[$64 >> 2];
  HEAP32[$63 + 4 >> 2] = HEAP32[$64 + 4 >> 2];
  HEAP32[$63 + 8 >> 2] = HEAP32[$64 + 8 >> 2];
  HEAP32[$63 + 12 >> 2] = HEAP32[$64 + 12 >> 2];
  $69 = $1 + ($2 >> 1 << 4) | 0;
  $70 = $t1;
  HEAP32[$69 >> 2] = HEAP32[$70 >> 2];
  HEAP32[$69 + 4 >> 2] = HEAP32[$70 + 4 >> 2];
  HEAP32[$69 + 8 >> 2] = HEAP32[$70 + 8 >> 2];
  HEAP32[$69 + 12 >> 2] = HEAP32[$70 + 12 >> 2];
  $y1 = HEAP32[$1 + 4 >> 2] | 0;
  $x1 = HEAP32[$1 >> 2] | 0;
  $i = 0;
  $j = $2;
  label = 9;
  break;
 case 9:
  $r = $1 + ($i << 4) | 0;
  label = 10;
  break;
 case 10:
  $r = $r + 16 | 0;
  $i = $i + 1 | 0;
  label = 11;
  break;
 case 11:
  if (($i | 0) != ($2 | 0)) {
   label = 12;
   break;
  } else {
   $116 = 0;
   label = 17;
   break;
  }
 case 12:
  if ((HEAP32[$r + 4 >> 2] | 0) < ($y1 | 0)) {
   $114 = 1;
   label = 16;
   break;
  } else {
   label = 13;
   break;
  }
 case 13:
  if ((HEAP32[$r + 4 >> 2] | 0) == ($y1 | 0)) {
   label = 14;
   break;
  } else {
   $112 = 0;
   label = 15;
   break;
  }
 case 14:
  $112 = (HEAP32[$r >> 2] | 0) < ($x1 | 0);
  label = 15;
  break;
 case 15:
  $114 = $112;
  label = 16;
  break;
 case 16:
  $116 = $114;
  label = 17;
  break;
 case 17:
  if ($116) {
   label = 10;
   break;
  } else {
   label = 18;
   break;
  }
 case 18:
  $r = $1 + ($j << 4) | 0;
  label = 19;
  break;
 case 19:
  $r = $r - 16 | 0;
  $j = $j - 1 | 0;
  label = 20;
  break;
 case 20:
  if (($y1 | 0) < (HEAP32[$r + 4 >> 2] | 0)) {
   $147 = 1;
   label = 24;
   break;
  } else {
   label = 21;
   break;
  }
 case 21:
  if (($y1 | 0) == (HEAP32[$r + 4 >> 2] | 0)) {
   label = 22;
   break;
  } else {
   $145 = 0;
   label = 23;
   break;
  }
 case 22:
  $145 = ($x1 | 0) < (HEAP32[$r >> 2] | 0);
  label = 23;
  break;
 case 23:
  $147 = $145;
  label = 24;
  break;
 case 24:
  if ($147) {
   label = 19;
   break;
  } else {
   label = 25;
   break;
  }
 case 25:
  if (($i | 0) < ($j | 0)) {
   label = 26;
   break;
  } else {
   label = 27;
   break;
  }
 case 26:
  $156 = $t2;
  $157 = $1 + ($i << 4) | 0;
  HEAP32[$156 >> 2] = HEAP32[$157 >> 2];
  HEAP32[$156 + 4 >> 2] = HEAP32[$157 + 4 >> 2];
  HEAP32[$156 + 8 >> 2] = HEAP32[$157 + 8 >> 2];
  HEAP32[$156 + 12 >> 2] = HEAP32[$157 + 12 >> 2];
  $164 = $1 + ($i << 4) | 0;
  $165 = $1 + ($j << 4) | 0;
  HEAP32[$164 >> 2] = HEAP32[$165 >> 2];
  HEAP32[$164 + 4 >> 2] = HEAP32[$165 + 4 >> 2];
  HEAP32[$164 + 8 >> 2] = HEAP32[$165 + 8 >> 2];
  HEAP32[$164 + 12 >> 2] = HEAP32[$165 + 12 >> 2];
  $169 = $1 + ($j << 4) | 0;
  $170 = $t2;
  HEAP32[$169 >> 2] = HEAP32[$170 >> 2];
  HEAP32[$169 + 4 >> 2] = HEAP32[$170 + 4 >> 2];
  HEAP32[$169 + 8 >> 2] = HEAP32[$170 + 8 >> 2];
  HEAP32[$169 + 12 >> 2] = HEAP32[$170 + 12 >> 2];
  label = 27;
  break;
 case 27:
  label = 28;
  break;
 case 28:
  if (($i | 0) < ($j | 0)) {
   label = 9;
   break;
  } else {
   label = 29;
   break;
  }
 case 29:
  $179 = $t3;
  $180 = $1 | 0;
  HEAP32[$179 >> 2] = HEAP32[$180 >> 2];
  HEAP32[$179 + 4 >> 2] = HEAP32[$180 + 4 >> 2];
  HEAP32[$179 + 8 >> 2] = HEAP32[$180 + 8 >> 2];
  HEAP32[$179 + 12 >> 2] = HEAP32[$180 + 12 >> 2];
  $186 = $1 | 0;
  $187 = $1 + ($j << 4) | 0;
  HEAP32[$186 >> 2] = HEAP32[$187 >> 2];
  HEAP32[$186 + 4 >> 2] = HEAP32[$187 + 4 >> 2];
  HEAP32[$186 + 8 >> 2] = HEAP32[$187 + 8 >> 2];
  HEAP32[$186 + 12 >> 2] = HEAP32[$187 + 12 >> 2];
  $191 = $1 + ($j << 4) | 0;
  $192 = $t3;
  HEAP32[$191 >> 2] = HEAP32[$192 >> 2];
  HEAP32[$191 + 4 >> 2] = HEAP32[$192 + 4 >> 2];
  HEAP32[$191 + 8 >> 2] = HEAP32[$192 + 8 >> 2];
  HEAP32[$191 + 12 >> 2] = HEAP32[$192 + 12 >> 2];
  if (($2 - $j - 1 | 0) > 1) {
   label = 30;
   break;
  } else {
   label = 31;
   break;
  }
 case 30:
  _quick_sort_rects($1 + ($j + 1 << 4) | 0, $2 - $j - 1 | 0);
  label = 31;
  break;
 case 31:
  $2 = $j;
  label = 32;
  break;
 case 32:
  if (($2 | 0) > 1) {
   label = 2;
   break;
  } else {
   label = 33;
   break;
  }
 case 33:
  STACKTOP = sp;
  return;
 }
}
function _pixman_coalesce($region, $prev_start, $cur_start) {
 $region = $region | 0;
 $prev_start = $prev_start | 0;
 $cur_start = $cur_start | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $prev_box = 0, $cur_box = 0, $numRects = 0, $y2 = 0, $93 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $prev_start;
  $4 = $cur_start;
  $numRects = $4 - $3 | 0;
  label = 2;
  break;
 case 2:
  if (((($numRects | 0) == ((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) - $4 | 0) ^ 1) & 1 | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  __pixman_log_error(2400, 504);
  label = 4;
  break;
 case 4:
  label = 5;
  break;
 case 5:
  if (($numRects | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $1 = $4;
  label = 19;
  break;
 case 7:
  $prev_box = (HEAP32[$2 + 16 >> 2] | 0) + 8 + ($3 << 4) | 0;
  $cur_box = (HEAP32[$2 + 16 >> 2] | 0) + 8 + ($4 << 4) | 0;
  if ((HEAP32[$prev_box + 12 >> 2] | 0) != (HEAP32[$cur_box + 4 >> 2] | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $1 = $4;
  label = 19;
  break;
 case 9:
  $y2 = HEAP32[$cur_box + 12 >> 2] | 0;
  label = 10;
  break;
 case 10:
  if ((HEAP32[$prev_box >> 2] | 0) != (HEAP32[$cur_box >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  if ((HEAP32[$prev_box + 8 >> 2] | 0) != (HEAP32[$cur_box + 8 >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  $1 = $4;
  label = 19;
  break;
 case 13:
  $prev_box = $prev_box + 16 | 0;
  $cur_box = $cur_box + 16 | 0;
  $numRects = $numRects - 1 | 0;
  label = 14;
  break;
 case 14:
  if (($numRects | 0) != 0) {
   label = 10;
   break;
  } else {
   label = 15;
   break;
  }
 case 15:
  $numRects = $4 - $3 | 0;
  $93 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$93 >> 2] = (HEAP32[$93 >> 2] | 0) - $numRects;
  label = 16;
  break;
 case 16:
  $prev_box = $prev_box - 16 | 0;
  HEAP32[$prev_box + 12 >> 2] = $y2;
  $numRects = $numRects - 1 | 0;
  label = 17;
  break;
 case 17:
  if (($numRects | 0) != 0) {
   label = 16;
   break;
  } else {
   label = 18;
   break;
  }
 case 18:
  $1 = $3;
  label = 19;
  break;
 case 19:
  return $1 | 0;
 }
 return 0;
}
function _pixman_region_append_non_o($region, $r, $r_end, $y1, $y2) {
 $region = $region | 0;
 $r = $r | 0;
 $r_end = $r_end | 0;
 $y1 = $y1 | 0;
 $y2 = $y2 | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $next_rect = 0, $new_rects = 0, $77 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = $region;
  $3 = $r;
  $4 = $r_end;
  $5 = $y1;
  $6 = $y2;
  $new_rects = ($4 - $3 | 0) / 16 | 0;
  label = 2;
  break;
 case 2:
  if (((($5 | 0) < ($6 | 0) ^ 1) & 1 | 0) != 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  __pixman_log_error(1856, 464);
  label = 4;
  break;
 case 4:
  label = 5;
  break;
 case 5:
  label = 6;
  break;
 case 6:
  if (((($new_rects | 0) != 0 ^ 1) & 1 | 0) != 0) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  __pixman_log_error(1856, 928);
  label = 8;
  break;
 case 8:
  label = 9;
  break;
 case 9:
  label = 10;
  break;
 case 10:
  if ((HEAP32[$2 + 16 >> 2] | 0) != 0) {
   label = 11;
   break;
  } else {
   label = 12;
   break;
  }
 case 11:
  if (((HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] | 0) + $new_rects | 0) > (HEAP32[HEAP32[$2 + 16 >> 2] >> 2] | 0)) {
   label = 12;
   break;
  } else {
   label = 15;
   break;
  }
 case 12:
  if ((_pixman_rect_alloc($2, $new_rects) | 0) != 0) {
   label = 14;
   break;
  } else {
   label = 13;
   break;
  }
 case 13:
  $1 = 0;
  label = 26;
  break;
 case 14:
  label = 15;
  break;
 case 15:
  label = 16;
  break;
 case 16:
  $next_rect = (HEAP32[$2 + 16 >> 2] | 0) + 8 + (HEAP32[(HEAP32[$2 + 16 >> 2] | 0) + 4 >> 2] << 4) | 0;
  $77 = (HEAP32[$2 + 16 >> 2] | 0) + 4 | 0;
  HEAP32[$77 >> 2] = (HEAP32[$77 >> 2] | 0) + $new_rects;
  label = 17;
  break;
 case 17:
  label = 18;
  break;
 case 18:
  if ((((HEAP32[$3 >> 2] | 0) < (HEAP32[$3 + 8 >> 2] | 0) ^ 1) & 1 | 0) != 0) {
   label = 19;
   break;
  } else {
   label = 20;
   break;
  }
 case 19:
  __pixman_log_error(1856, 888);
  label = 20;
  break;
 case 20:
  label = 21;
  break;
 case 21:
  label = 22;
  break;
 case 22:
  HEAP32[$next_rect >> 2] = HEAP32[$3 >> 2];
  HEAP32[$next_rect + 4 >> 2] = $5;
  HEAP32[$next_rect + 8 >> 2] = HEAP32[$3 + 8 >> 2];
  HEAP32[$next_rect + 12 >> 2] = $6;
  $next_rect = $next_rect + 16 | 0;
  label = 23;
  break;
 case 23:
  $3 = $3 + 16 | 0;
  label = 24;
  break;
 case 24:
  if (($3 | 0) != ($4 | 0)) {
   label = 17;
   break;
  } else {
   label = 25;
   break;
  }
 case 25:
  $1 = 1;
  label = 26;
  break;
 case 26:
  return $1 | 0;
 }
 return 0;
}
function __pixman_log_error($function, $message) {
 $function = $function | 0;
 $message = $message | 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[674] | 0) < 10) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  _fprintf(HEAP32[_stderr >> 2] | 0, 808, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $function, HEAP32[tempInt + 8 >> 2] = $message, tempInt) | 0) | 0;
  HEAP32[674] = (HEAP32[674] | 0) + 1;
  label = 3;
  break;
 case 3:
  STACKTOP = sp;
  return;
 }
}
function _malloc($bytes) {
 $bytes = $bytes | 0;
 var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $17 = 0, $18 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $35 = 0, $40 = 0, $45 = 0, $56 = 0, $59 = 0, $62 = 0, $64 = 0, $65 = 0, $67 = 0, $69 = 0, $71 = 0, $73 = 0, $75 = 0, $77 = 0, $79 = 0, $82 = 0, $83 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $100 = 0, $105 = 0, $106 = 0, $109 = 0, $117 = 0, $120 = 0, $121 = 0, $122 = 0, $124 = 0, $125 = 0, $126 = 0, $132 = 0, $133 = 0, $_pre_phi = 0, $F4_0 = 0, $145 = 0, $150 = 0, $152 = 0, $153 = 0, $155 = 0, $157 = 0, $159 = 0, $161 = 0, $163 = 0, $165 = 0, $167 = 0, $172 = 0, $rsize_0_i = 0, $v_0_i = 0, $t_0_i = 0, $179 = 0, $183 = 0, $185 = 0, $189 = 0, $190 = 0, $192 = 0, $193 = 0, $196 = 0, $201 = 0, $203 = 0, $207 = 0, $211 = 0, $215 = 0, $220 = 0, $221 = 0, $224 = 0, $225 = 0, $RP_0_i = 0, $R_0_i = 0, $227 = 0, $228 = 0, $231 = 0, $232 = 0, $R_1_i = 0, $242 = 0, $244 = 0, $258 = 0, $274 = 0, $286 = 0, $300 = 0, $304 = 0, $315 = 0, $318 = 0, $319 = 0, $320 = 0, $322 = 0, $323 = 0, $324 = 0, $330 = 0, $331 = 0, $_pre_phi_i = 0, $F1_0_i = 0, $347 = 0, $348 = 0, $349 = 0, $352 = 0, $353 = 0, $360 = 0, $361 = 0, $364 = 0, $366 = 0, $369 = 0, $374 = 0, $idx_0_i = 0, $382 = 0, $390 = 0, $rst_0_i = 0, $sizebits_0_i = 0, $t_0_i16 = 0, $rsize_0_i17 = 0, $v_0_i18 = 0, $395 = 0, $396 = 0, $rsize_1_i = 0, $v_1_i = 0, $402 = 0, $405 = 0, $rst_1_i = 0, $t_1_i = 0, $rsize_2_i = 0, $v_2_i = 0, $413 = 0, $416 = 0, $421 = 0, $423 = 0, $424 = 0, $426 = 0, $428 = 0, $430 = 0, $432 = 0, $434 = 0, $436 = 0, $438 = 0, $t_2_ph_i = 0, $v_332_i = 0, $rsize_331_i = 0, $t_230_i = 0, $448 = 0, $449 = 0, $_rsize_3_i = 0, $t_2_v_3_i = 0, $451 = 0, $454 = 0, $v_3_lcssa_i = 0, $rsize_3_lcssa_i = 0, $462 = 0, $463 = 0, $466 = 0, $467 = 0, $471 = 0, $473 = 0, $477 = 0, $481 = 0, $485 = 0, $490 = 0, $491 = 0, $494 = 0, $495 = 0, $RP_0_i19 = 0, $R_0_i20 = 0, $497 = 0, $498 = 0, $501 = 0, $502 = 0, $R_1_i22 = 0, $512 = 0, $514 = 0, $528 = 0, $544 = 0, $556 = 0, $570 = 0, $574 = 0, $585 = 0, $588 = 0, $590 = 0, $591 = 0, $592 = 0, $598 = 0, $599 = 0, $_pre_phi_i28 = 0, $F5_0_i = 0, $611 = 0, $612 = 0, $619 = 0, $620 = 0, $623 = 0, $625 = 0, $628 = 0, $633 = 0, $I7_0_i = 0, $640 = 0, $647 = 0, $648 = 0, $661 = 0, $667 = 0, $K12_027_i = 0, $T_026_i = 0, $681 = 0, $682 = 0, $T_0_lcssa_i = 0, $696 = 0, $697 = 0, $699 = 0, $nb_0 = 0, $715 = 0, $718 = 0, $719 = 0, $722 = 0, $737 = 0, $744 = 0, $747 = 0, $748 = 0, $749 = 0, $763 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $780 = 0, $783 = 0, $784 = 0, $792 = 0, $795 = 0, $sp_0_i_i = 0, $797 = 0, $798 = 0, $801 = 0, $807 = 0, $810 = 0, $813 = 0, $814 = 0, $815 = 0, $ssize_0_i = 0, $825 = 0, $826 = 0, $830 = 0, $836 = 0, $837 = 0, $841 = 0, $844 = 0, $848 = 0, $ssize_1_i = 0, $br_0_i = 0, $tsize_0_i = 0, $tbase_0_i = 0, $857 = 0, $861 = 0, $ssize_2_i = 0, $tsize_0323841_i = 0, $tsize_1_i = 0, $877 = 0, $878 = 0, $882 = 0, $884 = 0, $tbase_247_i = 0, $tsize_246_i = 0, $886 = 0, $890 = 0, $893 = 0, $i_02_i_i = 0, $899 = 0, $901 = 0, $904 = 0, $908 = 0, $914 = 0, $917 = 0, $sp_075_i = 0, $925 = 0, $926 = 0, $927 = 0, $932 = 0, $939 = 0, $944 = 0, $946 = 0, $947 = 0, $949 = 0, $955 = 0, $958 = 0, $sp_168_i = 0, $970 = 0, $975 = 0, $982 = 0, $986 = 0, $993 = 0, $996 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $_sum_i21_i = 0, $1009 = 0, $1010 = 0, $1011 = 0, $1019 = 0, $1028 = 0, $_sum2_i23_i = 0, $1037 = 0, $1041 = 0, $1042 = 0, $1047 = 0, $1050 = 0, $1053 = 0, $1076 = 0, $_pre_phi62_i_i = 0, $1081 = 0, $1084 = 0, $1087 = 0, $1092 = 0, $1097 = 0, $1101 = 0, $_sum67_i_i = 0, $1107 = 0, $1108 = 0, $1112 = 0, $1113 = 0, $RP_0_i_i = 0, $R_0_i_i = 0, $1115 = 0, $1116 = 0, $1119 = 0, $1120 = 0, $R_1_i_i = 0, $1132 = 0, $1134 = 0, $1148 = 0, $_sum3233_i_i = 0, $1165 = 0, $1178 = 0, $qsize_0_i_i = 0, $oldfirst_0_i_i = 0, $1194 = 0, $1202 = 0, $1205 = 0, $1207 = 0, $1208 = 0, $1209 = 0, $1215 = 0, $1216 = 0, $_pre_phi_i25_i = 0, $F4_0_i_i = 0, $1228 = 0, $1229 = 0, $1236 = 0, $1237 = 0, $1240 = 0, $1242 = 0, $1245 = 0, $1250 = 0, $I7_0_i_i = 0, $1257 = 0, $1264 = 0, $1265 = 0, $1278 = 0, $1284 = 0, $K8_056_i_i = 0, $T_055_i_i = 0, $1298 = 0, $1299 = 0, $T_0_lcssa_i28_i = 0, $1313 = 0, $1314 = 0, $1316 = 0, $1330 = 0, $sp_0_i_i_i = 0, $1333 = 0, $1337 = 0, $1338 = 0, $1344 = 0, $1351 = 0, $1352 = 0, $1356 = 0, $1357 = 0, $1361 = 0, $1367 = 0, $1370 = 0, $1380 = 0, $1383 = 0, $1384 = 0, $1392 = 0, $1395 = 0, $1401 = 0, $1404 = 0, $1406 = 0, $1407 = 0, $1408 = 0, $1414 = 0, $1415 = 0, $_pre_phi_i_i = 0, $F_0_i_i = 0, $1425 = 0, $1426 = 0, $1433 = 0, $1434 = 0, $1437 = 0, $1439 = 0, $1442 = 0, $1447 = 0, $I1_0_i_i = 0, $1454 = 0, $1458 = 0, $1459 = 0, $1468 = 0, $1474 = 0, $K2_015_i_i = 0, $T_014_i_i = 0, $1488 = 0, $1489 = 0, $T_0_lcssa_i_i = 0, $1500 = 0, $1501 = 0, $1503 = 0, $1513 = 0, $1516 = 0, $1517 = 0, $1518 = 0, $mem_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ($bytes >>> 0 < 245) {
   label = 2;
   break;
  } else {
   label = 78;
   break;
  }
 case 2:
  if ($bytes >>> 0 < 11) {
   $8 = 16;
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  $8 = $bytes + 11 & -8;
  label = 4;
  break;
 case 4:
  $9 = $8 >>> 3;
  $10 = HEAP32[676] | 0;
  $11 = $10 >>> ($9 >>> 0);
  if (($11 & 3 | 0) == 0) {
   label = 12;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  $17 = ($11 & 1 ^ 1) + $9 | 0;
  $18 = $17 << 1;
  $20 = 2744 + ($18 << 2) | 0;
  $21 = 2744 + ($18 + 2 << 2) | 0;
  $22 = HEAP32[$21 >> 2] | 0;
  $23 = $22 + 8 | 0;
  $24 = HEAP32[$23 >> 2] | 0;
  if (($20 | 0) == ($24 | 0)) {
   label = 6;
   break;
  } else {
   label = 7;
   break;
  }
 case 6:
  HEAP32[676] = $10 & ~(1 << $17);
  label = 11;
  break;
 case 7:
  if ($24 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 10;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $35 = $24 + 12 | 0;
  if ((HEAP32[$35 >> 2] | 0) == ($22 | 0)) {
   label = 9;
   break;
  } else {
   label = 10;
   break;
  }
 case 9:
  HEAP32[$35 >> 2] = $20;
  HEAP32[$21 >> 2] = $24;
  label = 11;
  break;
 case 10:
  _abort();
  return 0;
  return 0;
 case 11:
  $40 = $17 << 3;
  HEAP32[$22 + 4 >> 2] = $40 | 3;
  $45 = $22 + ($40 | 4) | 0;
  HEAP32[$45 >> 2] = HEAP32[$45 >> 2] | 1;
  $mem_0 = $23;
  label = 344;
  break;
 case 12:
  if ($8 >>> 0 > (HEAP32[678] | 0) >>> 0) {
   label = 13;
   break;
  } else {
   $nb_0 = $8;
   label = 161;
   break;
  }
 case 13:
  if (($11 | 0) == 0) {
   label = 27;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  $56 = 2 << $9;
  $59 = $11 << $9 & ($56 | -$56);
  $62 = ($59 & -$59) - 1 | 0;
  $64 = $62 >>> 12 & 16;
  $65 = $62 >>> ($64 >>> 0);
  $67 = $65 >>> 5 & 8;
  $69 = $65 >>> ($67 >>> 0);
  $71 = $69 >>> 2 & 4;
  $73 = $69 >>> ($71 >>> 0);
  $75 = $73 >>> 1 & 2;
  $77 = $73 >>> ($75 >>> 0);
  $79 = $77 >>> 1 & 1;
  $82 = ($67 | $64 | $71 | $75 | $79) + ($77 >>> ($79 >>> 0)) | 0;
  $83 = $82 << 1;
  $85 = 2744 + ($83 << 2) | 0;
  $86 = 2744 + ($83 + 2 << 2) | 0;
  $87 = HEAP32[$86 >> 2] | 0;
  $88 = $87 + 8 | 0;
  $89 = HEAP32[$88 >> 2] | 0;
  if (($85 | 0) == ($89 | 0)) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  HEAP32[676] = $10 & ~(1 << $82);
  label = 20;
  break;
 case 16:
  if ($89 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 19;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $100 = $89 + 12 | 0;
  if ((HEAP32[$100 >> 2] | 0) == ($87 | 0)) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  HEAP32[$100 >> 2] = $85;
  HEAP32[$86 >> 2] = $89;
  label = 20;
  break;
 case 19:
  _abort();
  return 0;
  return 0;
 case 20:
  $105 = $82 << 3;
  $106 = $105 - $8 | 0;
  HEAP32[$87 + 4 >> 2] = $8 | 3;
  $109 = $87;
  HEAP32[$109 + ($8 | 4) >> 2] = $106 | 1;
  HEAP32[$109 + $105 >> 2] = $106;
  $117 = HEAP32[678] | 0;
  if (($117 | 0) == 0) {
   label = 26;
   break;
  } else {
   label = 21;
   break;
  }
 case 21:
  $120 = HEAP32[681] | 0;
  $121 = $117 >>> 3;
  $122 = $121 << 1;
  $124 = 2744 + ($122 << 2) | 0;
  $125 = HEAP32[676] | 0;
  $126 = 1 << $121;
  if (($125 & $126 | 0) == 0) {
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 22:
  HEAP32[676] = $125 | $126;
  $F4_0 = $124;
  $_pre_phi = 2744 + ($122 + 2 << 2) | 0;
  label = 25;
  break;
 case 23:
  $132 = 2744 + ($122 + 2 << 2) | 0;
  $133 = HEAP32[$132 >> 2] | 0;
  if ($133 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 24;
   break;
  } else {
   $F4_0 = $133;
   $_pre_phi = $132;
   label = 25;
   break;
  }
 case 24:
  _abort();
  return 0;
  return 0;
 case 25:
  HEAP32[$_pre_phi >> 2] = $120;
  HEAP32[$F4_0 + 12 >> 2] = $120;
  HEAP32[$120 + 8 >> 2] = $F4_0;
  HEAP32[$120 + 12 >> 2] = $124;
  label = 26;
  break;
 case 26:
  HEAP32[678] = $106;
  HEAP32[681] = $109 + $8;
  $mem_0 = $88;
  label = 344;
  break;
 case 27:
  $145 = HEAP32[677] | 0;
  if (($145 | 0) == 0) {
   $nb_0 = $8;
   label = 161;
   break;
  } else {
   label = 28;
   break;
  }
 case 28:
  $150 = ($145 & -$145) - 1 | 0;
  $152 = $150 >>> 12 & 16;
  $153 = $150 >>> ($152 >>> 0);
  $155 = $153 >>> 5 & 8;
  $157 = $153 >>> ($155 >>> 0);
  $159 = $157 >>> 2 & 4;
  $161 = $157 >>> ($159 >>> 0);
  $163 = $161 >>> 1 & 2;
  $165 = $161 >>> ($163 >>> 0);
  $167 = $165 >>> 1 & 1;
  $172 = HEAP32[3008 + (($155 | $152 | $159 | $163 | $167) + ($165 >>> ($167 >>> 0)) << 2) >> 2] | 0;
  $t_0_i = $172;
  $v_0_i = $172;
  $rsize_0_i = (HEAP32[$172 + 4 >> 2] & -8) - $8 | 0;
  label = 29;
  break;
 case 29:
  $179 = HEAP32[$t_0_i + 16 >> 2] | 0;
  if (($179 | 0) == 0) {
   label = 30;
   break;
  } else {
   $185 = $179;
   label = 31;
   break;
  }
 case 30:
  $183 = HEAP32[$t_0_i + 20 >> 2] | 0;
  if (($183 | 0) == 0) {
   label = 32;
   break;
  } else {
   $185 = $183;
   label = 31;
   break;
  }
 case 31:
  $189 = (HEAP32[$185 + 4 >> 2] & -8) - $8 | 0;
  $190 = $189 >>> 0 < $rsize_0_i >>> 0;
  $t_0_i = $185;
  $v_0_i = $190 ? $185 : $v_0_i;
  $rsize_0_i = $190 ? $189 : $rsize_0_i;
  label = 29;
  break;
 case 32:
  $192 = $v_0_i;
  $193 = HEAP32[680] | 0;
  if ($192 >>> 0 < $193 >>> 0) {
   label = 76;
   break;
  } else {
   label = 33;
   break;
  }
 case 33:
  $196 = $192 + $8 | 0;
  if ($192 >>> 0 < $196 >>> 0) {
   label = 34;
   break;
  } else {
   label = 76;
   break;
  }
 case 34:
  $201 = HEAP32[$v_0_i + 24 >> 2] | 0;
  $203 = HEAP32[$v_0_i + 12 >> 2] | 0;
  if (($203 | 0) == ($v_0_i | 0)) {
   label = 40;
   break;
  } else {
   label = 35;
   break;
  }
 case 35:
  $207 = HEAP32[$v_0_i + 8 >> 2] | 0;
  if ($207 >>> 0 < $193 >>> 0) {
   label = 39;
   break;
  } else {
   label = 36;
   break;
  }
 case 36:
  $211 = $207 + 12 | 0;
  if ((HEAP32[$211 >> 2] | 0) == ($v_0_i | 0)) {
   label = 37;
   break;
  } else {
   label = 39;
   break;
  }
 case 37:
  $215 = $203 + 8 | 0;
  if ((HEAP32[$215 >> 2] | 0) == ($v_0_i | 0)) {
   label = 38;
   break;
  } else {
   label = 39;
   break;
  }
 case 38:
  HEAP32[$211 >> 2] = $203;
  HEAP32[$215 >> 2] = $207;
  $R_1_i = $203;
  label = 47;
  break;
 case 39:
  _abort();
  return 0;
  return 0;
 case 40:
  $220 = $v_0_i + 20 | 0;
  $221 = HEAP32[$220 >> 2] | 0;
  if (($221 | 0) == 0) {
   label = 41;
   break;
  } else {
   $R_0_i = $221;
   $RP_0_i = $220;
   label = 42;
   break;
  }
 case 41:
  $224 = $v_0_i + 16 | 0;
  $225 = HEAP32[$224 >> 2] | 0;
  if (($225 | 0) == 0) {
   $R_1_i = 0;
   label = 47;
   break;
  } else {
   $R_0_i = $225;
   $RP_0_i = $224;
   label = 42;
   break;
  }
 case 42:
  $227 = $R_0_i + 20 | 0;
  $228 = HEAP32[$227 >> 2] | 0;
  if (($228 | 0) == 0) {
   label = 43;
   break;
  } else {
   $R_0_i = $228;
   $RP_0_i = $227;
   label = 42;
   break;
  }
 case 43:
  $231 = $R_0_i + 16 | 0;
  $232 = HEAP32[$231 >> 2] | 0;
  if (($232 | 0) == 0) {
   label = 44;
   break;
  } else {
   $R_0_i = $232;
   $RP_0_i = $231;
   label = 42;
   break;
  }
 case 44:
  if ($RP_0_i >>> 0 < $193 >>> 0) {
   label = 46;
   break;
  } else {
   label = 45;
   break;
  }
 case 45:
  HEAP32[$RP_0_i >> 2] = 0;
  $R_1_i = $R_0_i;
  label = 47;
  break;
 case 46:
  _abort();
  return 0;
  return 0;
 case 47:
  if (($201 | 0) == 0) {
   label = 67;
   break;
  } else {
   label = 48;
   break;
  }
 case 48:
  $242 = $v_0_i + 28 | 0;
  $244 = 3008 + (HEAP32[$242 >> 2] << 2) | 0;
  if (($v_0_i | 0) == (HEAP32[$244 >> 2] | 0)) {
   label = 49;
   break;
  } else {
   label = 51;
   break;
  }
 case 49:
  HEAP32[$244 >> 2] = $R_1_i;
  if (($R_1_i | 0) == 0) {
   label = 50;
   break;
  } else {
   label = 57;
   break;
  }
 case 50:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$242 >> 2]);
  label = 67;
  break;
 case 51:
  if ($201 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 55;
   break;
  } else {
   label = 52;
   break;
  }
 case 52:
  $258 = $201 + 16 | 0;
  if ((HEAP32[$258 >> 2] | 0) == ($v_0_i | 0)) {
   label = 53;
   break;
  } else {
   label = 54;
   break;
  }
 case 53:
  HEAP32[$258 >> 2] = $R_1_i;
  label = 56;
  break;
 case 54:
  HEAP32[$201 + 20 >> 2] = $R_1_i;
  label = 56;
  break;
 case 55:
  _abort();
  return 0;
  return 0;
 case 56:
  if (($R_1_i | 0) == 0) {
   label = 67;
   break;
  } else {
   label = 57;
   break;
  }
 case 57:
  if ($R_1_i >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 66;
   break;
  } else {
   label = 58;
   break;
  }
 case 58:
  HEAP32[$R_1_i + 24 >> 2] = $201;
  $274 = HEAP32[$v_0_i + 16 >> 2] | 0;
  if (($274 | 0) == 0) {
   label = 62;
   break;
  } else {
   label = 59;
   break;
  }
 case 59:
  if ($274 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 61;
   break;
  } else {
   label = 60;
   break;
  }
 case 60:
  HEAP32[$R_1_i + 16 >> 2] = $274;
  HEAP32[$274 + 24 >> 2] = $R_1_i;
  label = 62;
  break;
 case 61:
  _abort();
  return 0;
  return 0;
 case 62:
  $286 = HEAP32[$v_0_i + 20 >> 2] | 0;
  if (($286 | 0) == 0) {
   label = 67;
   break;
  } else {
   label = 63;
   break;
  }
 case 63:
  if ($286 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 65;
   break;
  } else {
   label = 64;
   break;
  }
 case 64:
  HEAP32[$R_1_i + 20 >> 2] = $286;
  HEAP32[$286 + 24 >> 2] = $R_1_i;
  label = 67;
  break;
 case 65:
  _abort();
  return 0;
  return 0;
 case 66:
  _abort();
  return 0;
  return 0;
 case 67:
  if ($rsize_0_i >>> 0 < 16) {
   label = 68;
   break;
  } else {
   label = 69;
   break;
  }
 case 68:
  $300 = $rsize_0_i + $8 | 0;
  HEAP32[$v_0_i + 4 >> 2] = $300 | 3;
  $304 = $192 + ($300 + 4) | 0;
  HEAP32[$304 >> 2] = HEAP32[$304 >> 2] | 1;
  label = 77;
  break;
 case 69:
  HEAP32[$v_0_i + 4 >> 2] = $8 | 3;
  HEAP32[$192 + ($8 | 4) >> 2] = $rsize_0_i | 1;
  HEAP32[$192 + ($rsize_0_i + $8) >> 2] = $rsize_0_i;
  $315 = HEAP32[678] | 0;
  if (($315 | 0) == 0) {
   label = 75;
   break;
  } else {
   label = 70;
   break;
  }
 case 70:
  $318 = HEAP32[681] | 0;
  $319 = $315 >>> 3;
  $320 = $319 << 1;
  $322 = 2744 + ($320 << 2) | 0;
  $323 = HEAP32[676] | 0;
  $324 = 1 << $319;
  if (($323 & $324 | 0) == 0) {
   label = 71;
   break;
  } else {
   label = 72;
   break;
  }
 case 71:
  HEAP32[676] = $323 | $324;
  $F1_0_i = $322;
  $_pre_phi_i = 2744 + ($320 + 2 << 2) | 0;
  label = 74;
  break;
 case 72:
  $330 = 2744 + ($320 + 2 << 2) | 0;
  $331 = HEAP32[$330 >> 2] | 0;
  if ($331 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 73;
   break;
  } else {
   $F1_0_i = $331;
   $_pre_phi_i = $330;
   label = 74;
   break;
  }
 case 73:
  _abort();
  return 0;
  return 0;
 case 74:
  HEAP32[$_pre_phi_i >> 2] = $318;
  HEAP32[$F1_0_i + 12 >> 2] = $318;
  HEAP32[$318 + 8 >> 2] = $F1_0_i;
  HEAP32[$318 + 12 >> 2] = $322;
  label = 75;
  break;
 case 75:
  HEAP32[678] = $rsize_0_i;
  HEAP32[681] = $196;
  label = 77;
  break;
 case 76:
  _abort();
  return 0;
  return 0;
 case 77:
  $mem_0 = $v_0_i + 8 | 0;
  label = 344;
  break;
 case 78:
  if ($bytes >>> 0 > 4294967231) {
   $nb_0 = -1;
   label = 161;
   break;
  } else {
   label = 79;
   break;
  }
 case 79:
  $347 = $bytes + 11 | 0;
  $348 = $347 & -8;
  $349 = HEAP32[677] | 0;
  if (($349 | 0) == 0) {
   $nb_0 = $348;
   label = 161;
   break;
  } else {
   label = 80;
   break;
  }
 case 80:
  $352 = -$348 | 0;
  $353 = $347 >>> 8;
  if (($353 | 0) == 0) {
   $idx_0_i = 0;
   label = 83;
   break;
  } else {
   label = 81;
   break;
  }
 case 81:
  if ($348 >>> 0 > 16777215) {
   $idx_0_i = 31;
   label = 83;
   break;
  } else {
   label = 82;
   break;
  }
 case 82:
  $360 = ($353 + 1048320 | 0) >>> 16 & 8;
  $361 = $353 << $360;
  $364 = ($361 + 520192 | 0) >>> 16 & 4;
  $366 = $361 << $364;
  $369 = ($366 + 245760 | 0) >>> 16 & 2;
  $374 = 14 - ($364 | $360 | $369) + ($366 << $369 >>> 15) | 0;
  $idx_0_i = $348 >>> (($374 + 7 | 0) >>> 0) & 1 | $374 << 1;
  label = 83;
  break;
 case 83:
  $382 = HEAP32[3008 + ($idx_0_i << 2) >> 2] | 0;
  if (($382 | 0) == 0) {
   $v_2_i = 0;
   $rsize_2_i = $352;
   $t_1_i = 0;
   label = 90;
   break;
  } else {
   label = 84;
   break;
  }
 case 84:
  if (($idx_0_i | 0) == 31) {
   $390 = 0;
   label = 86;
   break;
  } else {
   label = 85;
   break;
  }
 case 85:
  $390 = 25 - ($idx_0_i >>> 1) | 0;
  label = 86;
  break;
 case 86:
  $v_0_i18 = 0;
  $rsize_0_i17 = $352;
  $t_0_i16 = $382;
  $sizebits_0_i = $348 << $390;
  $rst_0_i = 0;
  label = 87;
  break;
 case 87:
  $395 = HEAP32[$t_0_i16 + 4 >> 2] & -8;
  $396 = $395 - $348 | 0;
  if ($396 >>> 0 < $rsize_0_i17 >>> 0) {
   label = 88;
   break;
  } else {
   $v_1_i = $v_0_i18;
   $rsize_1_i = $rsize_0_i17;
   label = 89;
   break;
  }
 case 88:
  if (($395 | 0) == ($348 | 0)) {
   $v_2_i = $t_0_i16;
   $rsize_2_i = $396;
   $t_1_i = $t_0_i16;
   label = 90;
   break;
  } else {
   $v_1_i = $t_0_i16;
   $rsize_1_i = $396;
   label = 89;
   break;
  }
 case 89:
  $402 = HEAP32[$t_0_i16 + 20 >> 2] | 0;
  $405 = HEAP32[$t_0_i16 + 16 + ($sizebits_0_i >>> 31 << 2) >> 2] | 0;
  $rst_1_i = ($402 | 0) == 0 | ($402 | 0) == ($405 | 0) ? $rst_0_i : $402;
  if (($405 | 0) == 0) {
   $v_2_i = $v_1_i;
   $rsize_2_i = $rsize_1_i;
   $t_1_i = $rst_1_i;
   label = 90;
   break;
  } else {
   $v_0_i18 = $v_1_i;
   $rsize_0_i17 = $rsize_1_i;
   $t_0_i16 = $405;
   $sizebits_0_i = $sizebits_0_i << 1;
   $rst_0_i = $rst_1_i;
   label = 87;
   break;
  }
 case 90:
  if (($t_1_i | 0) == 0 & ($v_2_i | 0) == 0) {
   label = 91;
   break;
  } else {
   $t_2_ph_i = $t_1_i;
   label = 93;
   break;
  }
 case 91:
  $413 = 2 << $idx_0_i;
  $416 = $349 & ($413 | -$413);
  if (($416 | 0) == 0) {
   $nb_0 = $348;
   label = 161;
   break;
  } else {
   label = 92;
   break;
  }
 case 92:
  $421 = ($416 & -$416) - 1 | 0;
  $423 = $421 >>> 12 & 16;
  $424 = $421 >>> ($423 >>> 0);
  $426 = $424 >>> 5 & 8;
  $428 = $424 >>> ($426 >>> 0);
  $430 = $428 >>> 2 & 4;
  $432 = $428 >>> ($430 >>> 0);
  $434 = $432 >>> 1 & 2;
  $436 = $432 >>> ($434 >>> 0);
  $438 = $436 >>> 1 & 1;
  $t_2_ph_i = HEAP32[3008 + (($426 | $423 | $430 | $434 | $438) + ($436 >>> ($438 >>> 0)) << 2) >> 2] | 0;
  label = 93;
  break;
 case 93:
  if (($t_2_ph_i | 0) == 0) {
   $rsize_3_lcssa_i = $rsize_2_i;
   $v_3_lcssa_i = $v_2_i;
   label = 96;
   break;
  } else {
   $t_230_i = $t_2_ph_i;
   $rsize_331_i = $rsize_2_i;
   $v_332_i = $v_2_i;
   label = 94;
   break;
  }
 case 94:
  $448 = (HEAP32[$t_230_i + 4 >> 2] & -8) - $348 | 0;
  $449 = $448 >>> 0 < $rsize_331_i >>> 0;
  $_rsize_3_i = $449 ? $448 : $rsize_331_i;
  $t_2_v_3_i = $449 ? $t_230_i : $v_332_i;
  $451 = HEAP32[$t_230_i + 16 >> 2] | 0;
  if (($451 | 0) == 0) {
   label = 95;
   break;
  } else {
   $t_230_i = $451;
   $rsize_331_i = $_rsize_3_i;
   $v_332_i = $t_2_v_3_i;
   label = 94;
   break;
  }
 case 95:
  $454 = HEAP32[$t_230_i + 20 >> 2] | 0;
  if (($454 | 0) == 0) {
   $rsize_3_lcssa_i = $_rsize_3_i;
   $v_3_lcssa_i = $t_2_v_3_i;
   label = 96;
   break;
  } else {
   $t_230_i = $454;
   $rsize_331_i = $_rsize_3_i;
   $v_332_i = $t_2_v_3_i;
   label = 94;
   break;
  }
 case 96:
  if (($v_3_lcssa_i | 0) == 0) {
   $nb_0 = $348;
   label = 161;
   break;
  } else {
   label = 97;
   break;
  }
 case 97:
  if ($rsize_3_lcssa_i >>> 0 < ((HEAP32[678] | 0) - $348 | 0) >>> 0) {
   label = 98;
   break;
  } else {
   $nb_0 = $348;
   label = 161;
   break;
  }
 case 98:
  $462 = $v_3_lcssa_i;
  $463 = HEAP32[680] | 0;
  if ($462 >>> 0 < $463 >>> 0) {
   label = 159;
   break;
  } else {
   label = 99;
   break;
  }
 case 99:
  $466 = $462 + $348 | 0;
  $467 = $466;
  if ($462 >>> 0 < $466 >>> 0) {
   label = 100;
   break;
  } else {
   label = 159;
   break;
  }
 case 100:
  $471 = HEAP32[$v_3_lcssa_i + 24 >> 2] | 0;
  $473 = HEAP32[$v_3_lcssa_i + 12 >> 2] | 0;
  if (($473 | 0) == ($v_3_lcssa_i | 0)) {
   label = 106;
   break;
  } else {
   label = 101;
   break;
  }
 case 101:
  $477 = HEAP32[$v_3_lcssa_i + 8 >> 2] | 0;
  if ($477 >>> 0 < $463 >>> 0) {
   label = 105;
   break;
  } else {
   label = 102;
   break;
  }
 case 102:
  $481 = $477 + 12 | 0;
  if ((HEAP32[$481 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
   label = 103;
   break;
  } else {
   label = 105;
   break;
  }
 case 103:
  $485 = $473 + 8 | 0;
  if ((HEAP32[$485 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
   label = 104;
   break;
  } else {
   label = 105;
   break;
  }
 case 104:
  HEAP32[$481 >> 2] = $473;
  HEAP32[$485 >> 2] = $477;
  $R_1_i22 = $473;
  label = 113;
  break;
 case 105:
  _abort();
  return 0;
  return 0;
 case 106:
  $490 = $v_3_lcssa_i + 20 | 0;
  $491 = HEAP32[$490 >> 2] | 0;
  if (($491 | 0) == 0) {
   label = 107;
   break;
  } else {
   $R_0_i20 = $491;
   $RP_0_i19 = $490;
   label = 108;
   break;
  }
 case 107:
  $494 = $v_3_lcssa_i + 16 | 0;
  $495 = HEAP32[$494 >> 2] | 0;
  if (($495 | 0) == 0) {
   $R_1_i22 = 0;
   label = 113;
   break;
  } else {
   $R_0_i20 = $495;
   $RP_0_i19 = $494;
   label = 108;
   break;
  }
 case 108:
  $497 = $R_0_i20 + 20 | 0;
  $498 = HEAP32[$497 >> 2] | 0;
  if (($498 | 0) == 0) {
   label = 109;
   break;
  } else {
   $R_0_i20 = $498;
   $RP_0_i19 = $497;
   label = 108;
   break;
  }
 case 109:
  $501 = $R_0_i20 + 16 | 0;
  $502 = HEAP32[$501 >> 2] | 0;
  if (($502 | 0) == 0) {
   label = 110;
   break;
  } else {
   $R_0_i20 = $502;
   $RP_0_i19 = $501;
   label = 108;
   break;
  }
 case 110:
  if ($RP_0_i19 >>> 0 < $463 >>> 0) {
   label = 112;
   break;
  } else {
   label = 111;
   break;
  }
 case 111:
  HEAP32[$RP_0_i19 >> 2] = 0;
  $R_1_i22 = $R_0_i20;
  label = 113;
  break;
 case 112:
  _abort();
  return 0;
  return 0;
 case 113:
  if (($471 | 0) == 0) {
   label = 133;
   break;
  } else {
   label = 114;
   break;
  }
 case 114:
  $512 = $v_3_lcssa_i + 28 | 0;
  $514 = 3008 + (HEAP32[$512 >> 2] << 2) | 0;
  if (($v_3_lcssa_i | 0) == (HEAP32[$514 >> 2] | 0)) {
   label = 115;
   break;
  } else {
   label = 117;
   break;
  }
 case 115:
  HEAP32[$514 >> 2] = $R_1_i22;
  if (($R_1_i22 | 0) == 0) {
   label = 116;
   break;
  } else {
   label = 123;
   break;
  }
 case 116:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$512 >> 2]);
  label = 133;
  break;
 case 117:
  if ($471 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 121;
   break;
  } else {
   label = 118;
   break;
  }
 case 118:
  $528 = $471 + 16 | 0;
  if ((HEAP32[$528 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
   label = 119;
   break;
  } else {
   label = 120;
   break;
  }
 case 119:
  HEAP32[$528 >> 2] = $R_1_i22;
  label = 122;
  break;
 case 120:
  HEAP32[$471 + 20 >> 2] = $R_1_i22;
  label = 122;
  break;
 case 121:
  _abort();
  return 0;
  return 0;
 case 122:
  if (($R_1_i22 | 0) == 0) {
   label = 133;
   break;
  } else {
   label = 123;
   break;
  }
 case 123:
  if ($R_1_i22 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 132;
   break;
  } else {
   label = 124;
   break;
  }
 case 124:
  HEAP32[$R_1_i22 + 24 >> 2] = $471;
  $544 = HEAP32[$v_3_lcssa_i + 16 >> 2] | 0;
  if (($544 | 0) == 0) {
   label = 128;
   break;
  } else {
   label = 125;
   break;
  }
 case 125:
  if ($544 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 127;
   break;
  } else {
   label = 126;
   break;
  }
 case 126:
  HEAP32[$R_1_i22 + 16 >> 2] = $544;
  HEAP32[$544 + 24 >> 2] = $R_1_i22;
  label = 128;
  break;
 case 127:
  _abort();
  return 0;
  return 0;
 case 128:
  $556 = HEAP32[$v_3_lcssa_i + 20 >> 2] | 0;
  if (($556 | 0) == 0) {
   label = 133;
   break;
  } else {
   label = 129;
   break;
  }
 case 129:
  if ($556 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 131;
   break;
  } else {
   label = 130;
   break;
  }
 case 130:
  HEAP32[$R_1_i22 + 20 >> 2] = $556;
  HEAP32[$556 + 24 >> 2] = $R_1_i22;
  label = 133;
  break;
 case 131:
  _abort();
  return 0;
  return 0;
 case 132:
  _abort();
  return 0;
  return 0;
 case 133:
  if ($rsize_3_lcssa_i >>> 0 < 16) {
   label = 134;
   break;
  } else {
   label = 135;
   break;
  }
 case 134:
  $570 = $rsize_3_lcssa_i + $348 | 0;
  HEAP32[$v_3_lcssa_i + 4 >> 2] = $570 | 3;
  $574 = $462 + ($570 + 4) | 0;
  HEAP32[$574 >> 2] = HEAP32[$574 >> 2] | 1;
  label = 160;
  break;
 case 135:
  HEAP32[$v_3_lcssa_i + 4 >> 2] = $348 | 3;
  HEAP32[$462 + ($348 | 4) >> 2] = $rsize_3_lcssa_i | 1;
  HEAP32[$462 + ($rsize_3_lcssa_i + $348) >> 2] = $rsize_3_lcssa_i;
  $585 = $rsize_3_lcssa_i >>> 3;
  if ($rsize_3_lcssa_i >>> 0 < 256) {
   label = 136;
   break;
  } else {
   label = 141;
   break;
  }
 case 136:
  $588 = $585 << 1;
  $590 = 2744 + ($588 << 2) | 0;
  $591 = HEAP32[676] | 0;
  $592 = 1 << $585;
  if (($591 & $592 | 0) == 0) {
   label = 137;
   break;
  } else {
   label = 138;
   break;
  }
 case 137:
  HEAP32[676] = $591 | $592;
  $F5_0_i = $590;
  $_pre_phi_i28 = 2744 + ($588 + 2 << 2) | 0;
  label = 140;
  break;
 case 138:
  $598 = 2744 + ($588 + 2 << 2) | 0;
  $599 = HEAP32[$598 >> 2] | 0;
  if ($599 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 139;
   break;
  } else {
   $F5_0_i = $599;
   $_pre_phi_i28 = $598;
   label = 140;
   break;
  }
 case 139:
  _abort();
  return 0;
  return 0;
 case 140:
  HEAP32[$_pre_phi_i28 >> 2] = $467;
  HEAP32[$F5_0_i + 12 >> 2] = $467;
  HEAP32[$462 + ($348 + 8) >> 2] = $F5_0_i;
  HEAP32[$462 + ($348 + 12) >> 2] = $590;
  label = 160;
  break;
 case 141:
  $611 = $466;
  $612 = $rsize_3_lcssa_i >>> 8;
  if (($612 | 0) == 0) {
   $I7_0_i = 0;
   label = 144;
   break;
  } else {
   label = 142;
   break;
  }
 case 142:
  if ($rsize_3_lcssa_i >>> 0 > 16777215) {
   $I7_0_i = 31;
   label = 144;
   break;
  } else {
   label = 143;
   break;
  }
 case 143:
  $619 = ($612 + 1048320 | 0) >>> 16 & 8;
  $620 = $612 << $619;
  $623 = ($620 + 520192 | 0) >>> 16 & 4;
  $625 = $620 << $623;
  $628 = ($625 + 245760 | 0) >>> 16 & 2;
  $633 = 14 - ($623 | $619 | $628) + ($625 << $628 >>> 15) | 0;
  $I7_0_i = $rsize_3_lcssa_i >>> (($633 + 7 | 0) >>> 0) & 1 | $633 << 1;
  label = 144;
  break;
 case 144:
  $640 = 3008 + ($I7_0_i << 2) | 0;
  HEAP32[$462 + ($348 + 28) >> 2] = $I7_0_i;
  HEAP32[$462 + ($348 + 20) >> 2] = 0;
  HEAP32[$462 + ($348 + 16) >> 2] = 0;
  $647 = HEAP32[677] | 0;
  $648 = 1 << $I7_0_i;
  if (($647 & $648 | 0) == 0) {
   label = 145;
   break;
  } else {
   label = 146;
   break;
  }
 case 145:
  HEAP32[677] = $647 | $648;
  HEAP32[$640 >> 2] = $611;
  HEAP32[$462 + ($348 + 24) >> 2] = $640;
  HEAP32[$462 + ($348 + 12) >> 2] = $611;
  HEAP32[$462 + ($348 + 8) >> 2] = $611;
  label = 160;
  break;
 case 146:
  $661 = HEAP32[$640 >> 2] | 0;
  if (($I7_0_i | 0) == 31) {
   $667 = 0;
   label = 148;
   break;
  } else {
   label = 147;
   break;
  }
 case 147:
  $667 = 25 - ($I7_0_i >>> 1) | 0;
  label = 148;
  break;
 case 148:
  if ((HEAP32[$661 + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
   $T_0_lcssa_i = $661;
   label = 155;
   break;
  } else {
   label = 149;
   break;
  }
 case 149:
  $T_026_i = $661;
  $K12_027_i = $rsize_3_lcssa_i << $667;
  label = 151;
  break;
 case 150:
  if ((HEAP32[$682 + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
   $T_0_lcssa_i = $682;
   label = 155;
   break;
  } else {
   $T_026_i = $682;
   $K12_027_i = $K12_027_i << 1;
   label = 151;
   break;
  }
 case 151:
  $681 = $T_026_i + 16 + ($K12_027_i >>> 31 << 2) | 0;
  $682 = HEAP32[$681 >> 2] | 0;
  if (($682 | 0) == 0) {
   label = 152;
   break;
  } else {
   label = 150;
   break;
  }
 case 152:
  if ($681 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 154;
   break;
  } else {
   label = 153;
   break;
  }
 case 153:
  HEAP32[$681 >> 2] = $611;
  HEAP32[$462 + ($348 + 24) >> 2] = $T_026_i;
  HEAP32[$462 + ($348 + 12) >> 2] = $611;
  HEAP32[$462 + ($348 + 8) >> 2] = $611;
  label = 160;
  break;
 case 154:
  _abort();
  return 0;
  return 0;
 case 155:
  $696 = $T_0_lcssa_i + 8 | 0;
  $697 = HEAP32[$696 >> 2] | 0;
  $699 = HEAP32[680] | 0;
  if ($T_0_lcssa_i >>> 0 < $699 >>> 0) {
   label = 158;
   break;
  } else {
   label = 156;
   break;
  }
 case 156:
  if ($697 >>> 0 < $699 >>> 0) {
   label = 158;
   break;
  } else {
   label = 157;
   break;
  }
 case 157:
  HEAP32[$697 + 12 >> 2] = $611;
  HEAP32[$696 >> 2] = $611;
  HEAP32[$462 + ($348 + 8) >> 2] = $697;
  HEAP32[$462 + ($348 + 12) >> 2] = $T_0_lcssa_i;
  HEAP32[$462 + ($348 + 24) >> 2] = 0;
  label = 160;
  break;
 case 158:
  _abort();
  return 0;
  return 0;
 case 159:
  _abort();
  return 0;
  return 0;
 case 160:
  $mem_0 = $v_3_lcssa_i + 8 | 0;
  label = 344;
  break;
 case 161:
  $715 = HEAP32[678] | 0;
  if ($nb_0 >>> 0 > $715 >>> 0) {
   label = 166;
   break;
  } else {
   label = 162;
   break;
  }
 case 162:
  $718 = $715 - $nb_0 | 0;
  $719 = HEAP32[681] | 0;
  if ($718 >>> 0 > 15) {
   label = 163;
   break;
  } else {
   label = 164;
   break;
  }
 case 163:
  $722 = $719;
  HEAP32[681] = $722 + $nb_0;
  HEAP32[678] = $718;
  HEAP32[$722 + ($nb_0 + 4) >> 2] = $718 | 1;
  HEAP32[$722 + $715 >> 2] = $718;
  HEAP32[$719 + 4 >> 2] = $nb_0 | 3;
  label = 165;
  break;
 case 164:
  HEAP32[678] = 0;
  HEAP32[681] = 0;
  HEAP32[$719 + 4 >> 2] = $715 | 3;
  $737 = $719 + ($715 + 4) | 0;
  HEAP32[$737 >> 2] = HEAP32[$737 >> 2] | 1;
  label = 165;
  break;
 case 165:
  $mem_0 = $719 + 8 | 0;
  label = 344;
  break;
 case 166:
  $744 = HEAP32[679] | 0;
  if ($nb_0 >>> 0 < $744 >>> 0) {
   label = 167;
   break;
  } else {
   label = 168;
   break;
  }
 case 167:
  $747 = $744 - $nb_0 | 0;
  HEAP32[679] = $747;
  $748 = HEAP32[682] | 0;
  $749 = $748;
  HEAP32[682] = $749 + $nb_0;
  HEAP32[$749 + ($nb_0 + 4) >> 2] = $747 | 1;
  HEAP32[$748 + 4 >> 2] = $nb_0 | 3;
  $mem_0 = $748 + 8 | 0;
  label = 344;
  break;
 case 168:
  if ((HEAP32[666] | 0) == 0) {
   label = 169;
   break;
  } else {
   label = 172;
   break;
  }
 case 169:
  $763 = _sysconf(8) | 0;
  if (($763 - 1 & $763 | 0) == 0) {
   label = 171;
   break;
  } else {
   label = 170;
   break;
  }
 case 170:
  _abort();
  return 0;
  return 0;
 case 171:
  HEAP32[668] = $763;
  HEAP32[667] = $763;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 172;
  break;
 case 172:
  $773 = HEAP32[668] | 0;
  $774 = $nb_0 + 47 | 0;
  $775 = $773 + $774 | 0;
  $776 = -$773 | 0;
  $777 = $775 & $776;
  if ($777 >>> 0 > $nb_0 >>> 0) {
   label = 173;
   break;
  } else {
   $mem_0 = 0;
   label = 344;
   break;
  }
 case 173:
  $780 = HEAP32[786] | 0;
  if (($780 | 0) == 0) {
   label = 175;
   break;
  } else {
   label = 174;
   break;
  }
 case 174:
  $783 = HEAP32[784] | 0;
  $784 = $783 + $777 | 0;
  if ($784 >>> 0 <= $783 >>> 0 | $784 >>> 0 > $780 >>> 0) {
   $mem_0 = 0;
   label = 344;
   break;
  } else {
   label = 175;
   break;
  }
 case 175:
  if ((HEAP32[787] & 4 | 0) == 0) {
   label = 176;
   break;
  } else {
   $tsize_1_i = 0;
   label = 199;
   break;
  }
 case 176:
  $792 = HEAP32[682] | 0;
  if (($792 | 0) == 0) {
   label = 182;
   break;
  } else {
   label = 177;
   break;
  }
 case 177:
  $795 = $792;
  $sp_0_i_i = 3152;
  label = 178;
  break;
 case 178:
  $797 = $sp_0_i_i | 0;
  $798 = HEAP32[$797 >> 2] | 0;
  if ($798 >>> 0 > $795 >>> 0) {
   label = 180;
   break;
  } else {
   label = 179;
   break;
  }
 case 179:
  $801 = $sp_0_i_i + 4 | 0;
  if (($798 + (HEAP32[$801 >> 2] | 0) | 0) >>> 0 > $795 >>> 0) {
   label = 181;
   break;
  } else {
   label = 180;
   break;
  }
 case 180:
  $807 = HEAP32[$sp_0_i_i + 8 >> 2] | 0;
  if (($807 | 0) == 0) {
   label = 182;
   break;
  } else {
   $sp_0_i_i = $807;
   label = 178;
   break;
  }
 case 181:
  if (($sp_0_i_i | 0) == 0) {
   label = 182;
   break;
  } else {
   label = 189;
   break;
  }
 case 182:
  $810 = _sbrk(0) | 0;
  if (($810 | 0) == -1) {
   $tsize_0323841_i = 0;
   label = 198;
   break;
  } else {
   label = 183;
   break;
  }
 case 183:
  $813 = $810;
  $814 = HEAP32[667] | 0;
  $815 = $814 - 1 | 0;
  if (($815 & $813 | 0) == 0) {
   $ssize_0_i = $777;
   label = 185;
   break;
  } else {
   label = 184;
   break;
  }
 case 184:
  $ssize_0_i = $777 - $813 + ($815 + $813 & -$814) | 0;
  label = 185;
  break;
 case 185:
  $825 = HEAP32[784] | 0;
  $826 = $825 + $ssize_0_i | 0;
  if ($ssize_0_i >>> 0 > $nb_0 >>> 0 & $ssize_0_i >>> 0 < 2147483647) {
   label = 186;
   break;
  } else {
   $tsize_0323841_i = 0;
   label = 198;
   break;
  }
 case 186:
  $830 = HEAP32[786] | 0;
  if (($830 | 0) == 0) {
   label = 188;
   break;
  } else {
   label = 187;
   break;
  }
 case 187:
  if ($826 >>> 0 <= $825 >>> 0 | $826 >>> 0 > $830 >>> 0) {
   $tsize_0323841_i = 0;
   label = 198;
   break;
  } else {
   label = 188;
   break;
  }
 case 188:
  $836 = _sbrk($ssize_0_i | 0) | 0;
  $837 = ($836 | 0) == ($810 | 0);
  $tbase_0_i = $837 ? $810 : -1;
  $tsize_0_i = $837 ? $ssize_0_i : 0;
  $br_0_i = $836;
  $ssize_1_i = $ssize_0_i;
  label = 191;
  break;
 case 189:
  $841 = $775 - (HEAP32[679] | 0) & $776;
  if ($841 >>> 0 < 2147483647) {
   label = 190;
   break;
  } else {
   $tsize_0323841_i = 0;
   label = 198;
   break;
  }
 case 190:
  $844 = _sbrk($841 | 0) | 0;
  $848 = ($844 | 0) == ((HEAP32[$797 >> 2] | 0) + (HEAP32[$801 >> 2] | 0) | 0);
  $tbase_0_i = $848 ? $844 : -1;
  $tsize_0_i = $848 ? $841 : 0;
  $br_0_i = $844;
  $ssize_1_i = $841;
  label = 191;
  break;
 case 191:
  if (($tbase_0_i | 0) == -1) {
   label = 192;
   break;
  } else {
   $tsize_246_i = $tsize_0_i;
   $tbase_247_i = $tbase_0_i;
   label = 202;
   break;
  }
 case 192:
  if (($br_0_i | 0) != -1 & $ssize_1_i >>> 0 < 2147483647 & $ssize_1_i >>> 0 < ($nb_0 + 48 | 0) >>> 0) {
   label = 193;
   break;
  } else {
   $ssize_2_i = $ssize_1_i;
   label = 197;
   break;
  }
 case 193:
  $857 = HEAP32[668] | 0;
  $861 = $774 - $ssize_1_i + $857 & -$857;
  if ($861 >>> 0 < 2147483647) {
   label = 194;
   break;
  } else {
   $ssize_2_i = $ssize_1_i;
   label = 197;
   break;
  }
 case 194:
  if ((_sbrk($861 | 0) | 0) == -1) {
   label = 196;
   break;
  } else {
   label = 195;
   break;
  }
 case 195:
  $ssize_2_i = $861 + $ssize_1_i | 0;
  label = 197;
  break;
 case 196:
  _sbrk(-$ssize_1_i | 0) | 0;
  $tsize_0323841_i = $tsize_0_i;
  label = 198;
  break;
 case 197:
  if (($br_0_i | 0) == -1) {
   $tsize_0323841_i = $tsize_0_i;
   label = 198;
   break;
  } else {
   $tsize_246_i = $ssize_2_i;
   $tbase_247_i = $br_0_i;
   label = 202;
   break;
  }
 case 198:
  HEAP32[787] = HEAP32[787] | 4;
  $tsize_1_i = $tsize_0323841_i;
  label = 199;
  break;
 case 199:
  if ($777 >>> 0 < 2147483647) {
   label = 200;
   break;
  } else {
   label = 343;
   break;
  }
 case 200:
  $877 = _sbrk($777 | 0) | 0;
  $878 = _sbrk(0) | 0;
  if (($878 | 0) != -1 & ($877 | 0) != -1 & $877 >>> 0 < $878 >>> 0) {
   label = 201;
   break;
  } else {
   label = 343;
   break;
  }
 case 201:
  $882 = $878 - $877 | 0;
  $884 = $882 >>> 0 > ($nb_0 + 40 | 0) >>> 0;
  if ($884) {
   $tsize_246_i = $884 ? $882 : $tsize_1_i;
   $tbase_247_i = $877;
   label = 202;
   break;
  } else {
   label = 343;
   break;
  }
 case 202:
  $886 = (HEAP32[784] | 0) + $tsize_246_i | 0;
  HEAP32[784] = $886;
  if ($886 >>> 0 > (HEAP32[785] | 0) >>> 0) {
   label = 203;
   break;
  } else {
   label = 204;
   break;
  }
 case 203:
  HEAP32[785] = $886;
  label = 204;
  break;
 case 204:
  $890 = HEAP32[682] | 0;
  if (($890 | 0) == 0) {
   label = 205;
   break;
  } else {
   $sp_075_i = 3152;
   label = 212;
   break;
  }
 case 205:
  $893 = HEAP32[680] | 0;
  if (($893 | 0) == 0 | $tbase_247_i >>> 0 < $893 >>> 0) {
   label = 206;
   break;
  } else {
   label = 207;
   break;
  }
 case 206:
  HEAP32[680] = $tbase_247_i;
  label = 207;
  break;
 case 207:
  HEAP32[788] = $tbase_247_i;
  HEAP32[789] = $tsize_246_i;
  HEAP32[791] = 0;
  HEAP32[685] = HEAP32[666];
  HEAP32[684] = -1;
  $i_02_i_i = 0;
  label = 208;
  break;
 case 208:
  $899 = $i_02_i_i << 1;
  $901 = 2744 + ($899 << 2) | 0;
  HEAP32[2744 + ($899 + 3 << 2) >> 2] = $901;
  HEAP32[2744 + ($899 + 2 << 2) >> 2] = $901;
  $904 = $i_02_i_i + 1 | 0;
  if ($904 >>> 0 < 32) {
   $i_02_i_i = $904;
   label = 208;
   break;
  } else {
   label = 209;
   break;
  }
 case 209:
  $908 = $tbase_247_i + 8 | 0;
  if (($908 & 7 | 0) == 0) {
   $914 = 0;
   label = 211;
   break;
  } else {
   label = 210;
   break;
  }
 case 210:
  $914 = -$908 & 7;
  label = 211;
  break;
 case 211:
  $917 = $tsize_246_i - 40 - $914 | 0;
  HEAP32[682] = $tbase_247_i + $914;
  HEAP32[679] = $917;
  HEAP32[$tbase_247_i + ($914 + 4) >> 2] = $917 | 1;
  HEAP32[$tbase_247_i + ($tsize_246_i - 36) >> 2] = 40;
  HEAP32[683] = HEAP32[670];
  label = 341;
  break;
 case 212:
  $925 = HEAP32[$sp_075_i >> 2] | 0;
  $926 = $sp_075_i + 4 | 0;
  $927 = HEAP32[$926 >> 2] | 0;
  if (($tbase_247_i | 0) == ($925 + $927 | 0)) {
   label = 214;
   break;
  } else {
   label = 213;
   break;
  }
 case 213:
  $932 = HEAP32[$sp_075_i + 8 >> 2] | 0;
  if (($932 | 0) == 0) {
   label = 219;
   break;
  } else {
   $sp_075_i = $932;
   label = 212;
   break;
  }
 case 214:
  if ((HEAP32[$sp_075_i + 12 >> 2] & 8 | 0) == 0) {
   label = 215;
   break;
  } else {
   label = 219;
   break;
  }
 case 215:
  $939 = $890;
  if ($939 >>> 0 >= $925 >>> 0 & $939 >>> 0 < $tbase_247_i >>> 0) {
   label = 216;
   break;
  } else {
   label = 219;
   break;
  }
 case 216:
  HEAP32[$926 >> 2] = $927 + $tsize_246_i;
  $944 = HEAP32[682] | 0;
  $946 = (HEAP32[679] | 0) + $tsize_246_i | 0;
  $947 = $944;
  $949 = $944 + 8 | 0;
  if (($949 & 7 | 0) == 0) {
   $955 = 0;
   label = 218;
   break;
  } else {
   label = 217;
   break;
  }
 case 217:
  $955 = -$949 & 7;
  label = 218;
  break;
 case 218:
  $958 = $946 - $955 | 0;
  HEAP32[682] = $947 + $955;
  HEAP32[679] = $958;
  HEAP32[$947 + ($955 + 4) >> 2] = $958 | 1;
  HEAP32[$947 + ($946 + 4) >> 2] = 40;
  HEAP32[683] = HEAP32[670];
  label = 341;
  break;
 case 219:
  if ($tbase_247_i >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 220;
   break;
  } else {
   label = 221;
   break;
  }
 case 220:
  HEAP32[680] = $tbase_247_i;
  label = 221;
  break;
 case 221:
  $sp_168_i = 3152;
  label = 222;
  break;
 case 222:
  $970 = $sp_168_i | 0;
  if ((HEAP32[$970 >> 2] | 0) == ($tbase_247_i + $tsize_246_i | 0)) {
   label = 224;
   break;
  } else {
   label = 223;
   break;
  }
 case 223:
  $975 = HEAP32[$sp_168_i + 8 >> 2] | 0;
  if (($975 | 0) == 0) {
   label = 306;
   break;
  } else {
   $sp_168_i = $975;
   label = 222;
   break;
  }
 case 224:
  if ((HEAP32[$sp_168_i + 12 >> 2] & 8 | 0) == 0) {
   label = 225;
   break;
  } else {
   label = 306;
   break;
  }
 case 225:
  HEAP32[$970 >> 2] = $tbase_247_i;
  $982 = $sp_168_i + 4 | 0;
  HEAP32[$982 >> 2] = (HEAP32[$982 >> 2] | 0) + $tsize_246_i;
  $986 = $tbase_247_i + 8 | 0;
  if (($986 & 7 | 0) == 0) {
   $993 = 0;
   label = 227;
   break;
  } else {
   label = 226;
   break;
  }
 case 226:
  $993 = -$986 & 7;
  label = 227;
  break;
 case 227:
  $996 = $tbase_247_i + ($tsize_246_i + 8) | 0;
  if (($996 & 7 | 0) == 0) {
   $1003 = 0;
   label = 229;
   break;
  } else {
   label = 228;
   break;
  }
 case 228:
  $1003 = -$996 & 7;
  label = 229;
  break;
 case 229:
  $1004 = $tbase_247_i + ($1003 + $tsize_246_i) | 0;
  $1005 = $1004;
  $_sum_i21_i = $993 + $nb_0 | 0;
  $1009 = $tbase_247_i + $_sum_i21_i | 0;
  $1010 = $1009;
  $1011 = $1004 - ($tbase_247_i + $993) - $nb_0 | 0;
  HEAP32[$tbase_247_i + ($993 + 4) >> 2] = $nb_0 | 3;
  if (($1005 | 0) == (HEAP32[682] | 0)) {
   label = 230;
   break;
  } else {
   label = 231;
   break;
  }
 case 230:
  $1019 = (HEAP32[679] | 0) + $1011 | 0;
  HEAP32[679] = $1019;
  HEAP32[682] = $1010;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $1019 | 1;
  label = 305;
  break;
 case 231:
  if (($1005 | 0) == (HEAP32[681] | 0)) {
   label = 232;
   break;
  } else {
   label = 233;
   break;
  }
 case 232:
  $1028 = (HEAP32[678] | 0) + $1011 | 0;
  HEAP32[678] = $1028;
  HEAP32[681] = $1010;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $1028 | 1;
  HEAP32[$tbase_247_i + ($1028 + $_sum_i21_i) >> 2] = $1028;
  label = 305;
  break;
 case 233:
  $_sum2_i23_i = $tsize_246_i + 4 | 0;
  $1037 = HEAP32[$tbase_247_i + ($_sum2_i23_i + $1003) >> 2] | 0;
  if (($1037 & 3 | 0) == 1) {
   label = 234;
   break;
  } else {
   $oldfirst_0_i_i = $1005;
   $qsize_0_i_i = $1011;
   label = 281;
   break;
  }
 case 234:
  $1041 = $1037 & -8;
  $1042 = $1037 >>> 3;
  if ($1037 >>> 0 < 256) {
   label = 235;
   break;
  } else {
   label = 247;
   break;
  }
 case 235:
  $1047 = HEAP32[$tbase_247_i + (($1003 | 8) + $tsize_246_i) >> 2] | 0;
  $1050 = HEAP32[$tbase_247_i + ($tsize_246_i + 12 + $1003) >> 2] | 0;
  $1053 = 2744 + ($1042 << 1 << 2) | 0;
  if (($1047 | 0) == ($1053 | 0)) {
   label = 238;
   break;
  } else {
   label = 236;
   break;
  }
 case 236:
  if ($1047 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 246;
   break;
  } else {
   label = 237;
   break;
  }
 case 237:
  if ((HEAP32[$1047 + 12 >> 2] | 0) == ($1005 | 0)) {
   label = 238;
   break;
  } else {
   label = 246;
   break;
  }
 case 238:
  if (($1050 | 0) == ($1047 | 0)) {
   label = 239;
   break;
  } else {
   label = 240;
   break;
  }
 case 239:
  HEAP32[676] = HEAP32[676] & ~(1 << $1042);
  label = 280;
  break;
 case 240:
  if (($1050 | 0) == ($1053 | 0)) {
   label = 241;
   break;
  } else {
   label = 242;
   break;
  }
 case 241:
  $_pre_phi62_i_i = $1050 + 8 | 0;
  label = 244;
  break;
 case 242:
  if ($1050 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 245;
   break;
  } else {
   label = 243;
   break;
  }
 case 243:
  $1076 = $1050 + 8 | 0;
  if ((HEAP32[$1076 >> 2] | 0) == ($1005 | 0)) {
   $_pre_phi62_i_i = $1076;
   label = 244;
   break;
  } else {
   label = 245;
   break;
  }
 case 244:
  HEAP32[$1047 + 12 >> 2] = $1050;
  HEAP32[$_pre_phi62_i_i >> 2] = $1047;
  label = 280;
  break;
 case 245:
  _abort();
  return 0;
  return 0;
 case 246:
  _abort();
  return 0;
  return 0;
 case 247:
  $1081 = $1004;
  $1084 = HEAP32[$tbase_247_i + (($1003 | 24) + $tsize_246_i) >> 2] | 0;
  $1087 = HEAP32[$tbase_247_i + ($tsize_246_i + 12 + $1003) >> 2] | 0;
  if (($1087 | 0) == ($1081 | 0)) {
   label = 253;
   break;
  } else {
   label = 248;
   break;
  }
 case 248:
  $1092 = HEAP32[$tbase_247_i + (($1003 | 8) + $tsize_246_i) >> 2] | 0;
  if ($1092 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 252;
   break;
  } else {
   label = 249;
   break;
  }
 case 249:
  $1097 = $1092 + 12 | 0;
  if ((HEAP32[$1097 >> 2] | 0) == ($1081 | 0)) {
   label = 250;
   break;
  } else {
   label = 252;
   break;
  }
 case 250:
  $1101 = $1087 + 8 | 0;
  if ((HEAP32[$1101 >> 2] | 0) == ($1081 | 0)) {
   label = 251;
   break;
  } else {
   label = 252;
   break;
  }
 case 251:
  HEAP32[$1097 >> 2] = $1087;
  HEAP32[$1101 >> 2] = $1092;
  $R_1_i_i = $1087;
  label = 260;
  break;
 case 252:
  _abort();
  return 0;
  return 0;
 case 253:
  $_sum67_i_i = $1003 | 16;
  $1107 = $tbase_247_i + ($_sum2_i23_i + $_sum67_i_i) | 0;
  $1108 = HEAP32[$1107 >> 2] | 0;
  if (($1108 | 0) == 0) {
   label = 254;
   break;
  } else {
   $R_0_i_i = $1108;
   $RP_0_i_i = $1107;
   label = 255;
   break;
  }
 case 254:
  $1112 = $tbase_247_i + ($_sum67_i_i + $tsize_246_i) | 0;
  $1113 = HEAP32[$1112 >> 2] | 0;
  if (($1113 | 0) == 0) {
   $R_1_i_i = 0;
   label = 260;
   break;
  } else {
   $R_0_i_i = $1113;
   $RP_0_i_i = $1112;
   label = 255;
   break;
  }
 case 255:
  $1115 = $R_0_i_i + 20 | 0;
  $1116 = HEAP32[$1115 >> 2] | 0;
  if (($1116 | 0) == 0) {
   label = 256;
   break;
  } else {
   $R_0_i_i = $1116;
   $RP_0_i_i = $1115;
   label = 255;
   break;
  }
 case 256:
  $1119 = $R_0_i_i + 16 | 0;
  $1120 = HEAP32[$1119 >> 2] | 0;
  if (($1120 | 0) == 0) {
   label = 257;
   break;
  } else {
   $R_0_i_i = $1120;
   $RP_0_i_i = $1119;
   label = 255;
   break;
  }
 case 257:
  if ($RP_0_i_i >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 259;
   break;
  } else {
   label = 258;
   break;
  }
 case 258:
  HEAP32[$RP_0_i_i >> 2] = 0;
  $R_1_i_i = $R_0_i_i;
  label = 260;
  break;
 case 259:
  _abort();
  return 0;
  return 0;
 case 260:
  if (($1084 | 0) == 0) {
   label = 280;
   break;
  } else {
   label = 261;
   break;
  }
 case 261:
  $1132 = $tbase_247_i + ($tsize_246_i + 28 + $1003) | 0;
  $1134 = 3008 + (HEAP32[$1132 >> 2] << 2) | 0;
  if (($1081 | 0) == (HEAP32[$1134 >> 2] | 0)) {
   label = 262;
   break;
  } else {
   label = 264;
   break;
  }
 case 262:
  HEAP32[$1134 >> 2] = $R_1_i_i;
  if (($R_1_i_i | 0) == 0) {
   label = 263;
   break;
  } else {
   label = 270;
   break;
  }
 case 263:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$1132 >> 2]);
  label = 280;
  break;
 case 264:
  if ($1084 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 268;
   break;
  } else {
   label = 265;
   break;
  }
 case 265:
  $1148 = $1084 + 16 | 0;
  if ((HEAP32[$1148 >> 2] | 0) == ($1081 | 0)) {
   label = 266;
   break;
  } else {
   label = 267;
   break;
  }
 case 266:
  HEAP32[$1148 >> 2] = $R_1_i_i;
  label = 269;
  break;
 case 267:
  HEAP32[$1084 + 20 >> 2] = $R_1_i_i;
  label = 269;
  break;
 case 268:
  _abort();
  return 0;
  return 0;
 case 269:
  if (($R_1_i_i | 0) == 0) {
   label = 280;
   break;
  } else {
   label = 270;
   break;
  }
 case 270:
  if ($R_1_i_i >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 279;
   break;
  } else {
   label = 271;
   break;
  }
 case 271:
  HEAP32[$R_1_i_i + 24 >> 2] = $1084;
  $_sum3233_i_i = $1003 | 16;
  $1165 = HEAP32[$tbase_247_i + ($_sum3233_i_i + $tsize_246_i) >> 2] | 0;
  if (($1165 | 0) == 0) {
   label = 275;
   break;
  } else {
   label = 272;
   break;
  }
 case 272:
  if ($1165 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 274;
   break;
  } else {
   label = 273;
   break;
  }
 case 273:
  HEAP32[$R_1_i_i + 16 >> 2] = $1165;
  HEAP32[$1165 + 24 >> 2] = $R_1_i_i;
  label = 275;
  break;
 case 274:
  _abort();
  return 0;
  return 0;
 case 275:
  $1178 = HEAP32[$tbase_247_i + ($_sum2_i23_i + $_sum3233_i_i) >> 2] | 0;
  if (($1178 | 0) == 0) {
   label = 280;
   break;
  } else {
   label = 276;
   break;
  }
 case 276:
  if ($1178 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 278;
   break;
  } else {
   label = 277;
   break;
  }
 case 277:
  HEAP32[$R_1_i_i + 20 >> 2] = $1178;
  HEAP32[$1178 + 24 >> 2] = $R_1_i_i;
  label = 280;
  break;
 case 278:
  _abort();
  return 0;
  return 0;
 case 279:
  _abort();
  return 0;
  return 0;
 case 280:
  $oldfirst_0_i_i = $tbase_247_i + (($1041 | $1003) + $tsize_246_i) | 0;
  $qsize_0_i_i = $1041 + $1011 | 0;
  label = 281;
  break;
 case 281:
  $1194 = $oldfirst_0_i_i + 4 | 0;
  HEAP32[$1194 >> 2] = HEAP32[$1194 >> 2] & -2;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $qsize_0_i_i | 1;
  HEAP32[$tbase_247_i + ($qsize_0_i_i + $_sum_i21_i) >> 2] = $qsize_0_i_i;
  $1202 = $qsize_0_i_i >>> 3;
  if ($qsize_0_i_i >>> 0 < 256) {
   label = 282;
   break;
  } else {
   label = 287;
   break;
  }
 case 282:
  $1205 = $1202 << 1;
  $1207 = 2744 + ($1205 << 2) | 0;
  $1208 = HEAP32[676] | 0;
  $1209 = 1 << $1202;
  if (($1208 & $1209 | 0) == 0) {
   label = 283;
   break;
  } else {
   label = 284;
   break;
  }
 case 283:
  HEAP32[676] = $1208 | $1209;
  $F4_0_i_i = $1207;
  $_pre_phi_i25_i = 2744 + ($1205 + 2 << 2) | 0;
  label = 286;
  break;
 case 284:
  $1215 = 2744 + ($1205 + 2 << 2) | 0;
  $1216 = HEAP32[$1215 >> 2] | 0;
  if ($1216 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 285;
   break;
  } else {
   $F4_0_i_i = $1216;
   $_pre_phi_i25_i = $1215;
   label = 286;
   break;
  }
 case 285:
  _abort();
  return 0;
  return 0;
 case 286:
  HEAP32[$_pre_phi_i25_i >> 2] = $1010;
  HEAP32[$F4_0_i_i + 12 >> 2] = $1010;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $F4_0_i_i;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1207;
  label = 305;
  break;
 case 287:
  $1228 = $1009;
  $1229 = $qsize_0_i_i >>> 8;
  if (($1229 | 0) == 0) {
   $I7_0_i_i = 0;
   label = 290;
   break;
  } else {
   label = 288;
   break;
  }
 case 288:
  if ($qsize_0_i_i >>> 0 > 16777215) {
   $I7_0_i_i = 31;
   label = 290;
   break;
  } else {
   label = 289;
   break;
  }
 case 289:
  $1236 = ($1229 + 1048320 | 0) >>> 16 & 8;
  $1237 = $1229 << $1236;
  $1240 = ($1237 + 520192 | 0) >>> 16 & 4;
  $1242 = $1237 << $1240;
  $1245 = ($1242 + 245760 | 0) >>> 16 & 2;
  $1250 = 14 - ($1240 | $1236 | $1245) + ($1242 << $1245 >>> 15) | 0;
  $I7_0_i_i = $qsize_0_i_i >>> (($1250 + 7 | 0) >>> 0) & 1 | $1250 << 1;
  label = 290;
  break;
 case 290:
  $1257 = 3008 + ($I7_0_i_i << 2) | 0;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 28) >> 2] = $I7_0_i_i;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 20) >> 2] = 0;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 16) >> 2] = 0;
  $1264 = HEAP32[677] | 0;
  $1265 = 1 << $I7_0_i_i;
  if (($1264 & $1265 | 0) == 0) {
   label = 291;
   break;
  } else {
   label = 292;
   break;
  }
 case 291:
  HEAP32[677] = $1264 | $1265;
  HEAP32[$1257 >> 2] = $1228;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = $1257;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1228;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1228;
  label = 305;
  break;
 case 292:
  $1278 = HEAP32[$1257 >> 2] | 0;
  if (($I7_0_i_i | 0) == 31) {
   $1284 = 0;
   label = 294;
   break;
  } else {
   label = 293;
   break;
  }
 case 293:
  $1284 = 25 - ($I7_0_i_i >>> 1) | 0;
  label = 294;
  break;
 case 294:
  if ((HEAP32[$1278 + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
   $T_0_lcssa_i28_i = $1278;
   label = 301;
   break;
  } else {
   label = 295;
   break;
  }
 case 295:
  $T_055_i_i = $1278;
  $K8_056_i_i = $qsize_0_i_i << $1284;
  label = 297;
  break;
 case 296:
  if ((HEAP32[$1299 + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
   $T_0_lcssa_i28_i = $1299;
   label = 301;
   break;
  } else {
   $T_055_i_i = $1299;
   $K8_056_i_i = $K8_056_i_i << 1;
   label = 297;
   break;
  }
 case 297:
  $1298 = $T_055_i_i + 16 + ($K8_056_i_i >>> 31 << 2) | 0;
  $1299 = HEAP32[$1298 >> 2] | 0;
  if (($1299 | 0) == 0) {
   label = 298;
   break;
  } else {
   label = 296;
   break;
  }
 case 298:
  if ($1298 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 300;
   break;
  } else {
   label = 299;
   break;
  }
 case 299:
  HEAP32[$1298 >> 2] = $1228;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = $T_055_i_i;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1228;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1228;
  label = 305;
  break;
 case 300:
  _abort();
  return 0;
  return 0;
 case 301:
  $1313 = $T_0_lcssa_i28_i + 8 | 0;
  $1314 = HEAP32[$1313 >> 2] | 0;
  $1316 = HEAP32[680] | 0;
  if ($T_0_lcssa_i28_i >>> 0 < $1316 >>> 0) {
   label = 304;
   break;
  } else {
   label = 302;
   break;
  }
 case 302:
  if ($1314 >>> 0 < $1316 >>> 0) {
   label = 304;
   break;
  } else {
   label = 303;
   break;
  }
 case 303:
  HEAP32[$1314 + 12 >> 2] = $1228;
  HEAP32[$1313 >> 2] = $1228;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1314;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $T_0_lcssa_i28_i;
  HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = 0;
  label = 305;
  break;
 case 304:
  _abort();
  return 0;
  return 0;
 case 305:
  $mem_0 = $tbase_247_i + ($993 | 8) | 0;
  label = 344;
  break;
 case 306:
  $1330 = $890;
  $sp_0_i_i_i = 3152;
  label = 307;
  break;
 case 307:
  $1333 = HEAP32[$sp_0_i_i_i >> 2] | 0;
  if ($1333 >>> 0 > $1330 >>> 0) {
   label = 309;
   break;
  } else {
   label = 308;
   break;
  }
 case 308:
  $1337 = HEAP32[$sp_0_i_i_i + 4 >> 2] | 0;
  $1338 = $1333 + $1337 | 0;
  if ($1338 >>> 0 > $1330 >>> 0) {
   label = 310;
   break;
  } else {
   label = 309;
   break;
  }
 case 309:
  $sp_0_i_i_i = HEAP32[$sp_0_i_i_i + 8 >> 2] | 0;
  label = 307;
  break;
 case 310:
  $1344 = $1333 + ($1337 - 39) | 0;
  if (($1344 & 7 | 0) == 0) {
   $1351 = 0;
   label = 312;
   break;
  } else {
   label = 311;
   break;
  }
 case 311:
  $1351 = -$1344 & 7;
  label = 312;
  break;
 case 312:
  $1352 = $1333 + ($1337 - 47 + $1351) | 0;
  $1356 = $1352 >>> 0 < ($890 + 16 | 0) >>> 0 ? $1330 : $1352;
  $1357 = $1356 + 8 | 0;
  $1361 = $tbase_247_i + 8 | 0;
  if (($1361 & 7 | 0) == 0) {
   $1367 = 0;
   label = 314;
   break;
  } else {
   label = 313;
   break;
  }
 case 313:
  $1367 = -$1361 & 7;
  label = 314;
  break;
 case 314:
  $1370 = $tsize_246_i - 40 - $1367 | 0;
  HEAP32[682] = $tbase_247_i + $1367;
  HEAP32[679] = $1370;
  HEAP32[$tbase_247_i + ($1367 + 4) >> 2] = $1370 | 1;
  HEAP32[$tbase_247_i + ($tsize_246_i - 36) >> 2] = 40;
  HEAP32[683] = HEAP32[670];
  HEAP32[$1356 + 4 >> 2] = 27;
  HEAP32[$1357 >> 2] = HEAP32[788];
  HEAP32[$1357 + 4 >> 2] = HEAP32[3156 >> 2];
  HEAP32[$1357 + 8 >> 2] = HEAP32[3160 >> 2];
  HEAP32[$1357 + 12 >> 2] = HEAP32[3164 >> 2];
  HEAP32[788] = $tbase_247_i;
  HEAP32[789] = $tsize_246_i;
  HEAP32[791] = 0;
  HEAP32[790] = $1357;
  $1380 = $1356 + 28 | 0;
  HEAP32[$1380 >> 2] = 7;
  if (($1356 + 32 | 0) >>> 0 < $1338 >>> 0) {
   $1383 = $1380;
   label = 315;
   break;
  } else {
   label = 316;
   break;
  }
 case 315:
  $1384 = $1383 + 4 | 0;
  HEAP32[$1384 >> 2] = 7;
  if (($1383 + 8 | 0) >>> 0 < $1338 >>> 0) {
   $1383 = $1384;
   label = 315;
   break;
  } else {
   label = 316;
   break;
  }
 case 316:
  if (($1356 | 0) == ($1330 | 0)) {
   label = 341;
   break;
  } else {
   label = 317;
   break;
  }
 case 317:
  $1392 = $1356 - $890 | 0;
  $1395 = $1330 + ($1392 + 4) | 0;
  HEAP32[$1395 >> 2] = HEAP32[$1395 >> 2] & -2;
  HEAP32[$890 + 4 >> 2] = $1392 | 1;
  HEAP32[$1330 + $1392 >> 2] = $1392;
  $1401 = $1392 >>> 3;
  if ($1392 >>> 0 < 256) {
   label = 318;
   break;
  } else {
   label = 323;
   break;
  }
 case 318:
  $1404 = $1401 << 1;
  $1406 = 2744 + ($1404 << 2) | 0;
  $1407 = HEAP32[676] | 0;
  $1408 = 1 << $1401;
  if (($1407 & $1408 | 0) == 0) {
   label = 319;
   break;
  } else {
   label = 320;
   break;
  }
 case 319:
  HEAP32[676] = $1407 | $1408;
  $F_0_i_i = $1406;
  $_pre_phi_i_i = 2744 + ($1404 + 2 << 2) | 0;
  label = 322;
  break;
 case 320:
  $1414 = 2744 + ($1404 + 2 << 2) | 0;
  $1415 = HEAP32[$1414 >> 2] | 0;
  if ($1415 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 321;
   break;
  } else {
   $F_0_i_i = $1415;
   $_pre_phi_i_i = $1414;
   label = 322;
   break;
  }
 case 321:
  _abort();
  return 0;
  return 0;
 case 322:
  HEAP32[$_pre_phi_i_i >> 2] = $890;
  HEAP32[$F_0_i_i + 12 >> 2] = $890;
  HEAP32[$890 + 8 >> 2] = $F_0_i_i;
  HEAP32[$890 + 12 >> 2] = $1406;
  label = 341;
  break;
 case 323:
  $1425 = $890;
  $1426 = $1392 >>> 8;
  if (($1426 | 0) == 0) {
   $I1_0_i_i = 0;
   label = 326;
   break;
  } else {
   label = 324;
   break;
  }
 case 324:
  if ($1392 >>> 0 > 16777215) {
   $I1_0_i_i = 31;
   label = 326;
   break;
  } else {
   label = 325;
   break;
  }
 case 325:
  $1433 = ($1426 + 1048320 | 0) >>> 16 & 8;
  $1434 = $1426 << $1433;
  $1437 = ($1434 + 520192 | 0) >>> 16 & 4;
  $1439 = $1434 << $1437;
  $1442 = ($1439 + 245760 | 0) >>> 16 & 2;
  $1447 = 14 - ($1437 | $1433 | $1442) + ($1439 << $1442 >>> 15) | 0;
  $I1_0_i_i = $1392 >>> (($1447 + 7 | 0) >>> 0) & 1 | $1447 << 1;
  label = 326;
  break;
 case 326:
  $1454 = 3008 + ($I1_0_i_i << 2) | 0;
  HEAP32[$890 + 28 >> 2] = $I1_0_i_i;
  HEAP32[$890 + 20 >> 2] = 0;
  HEAP32[$890 + 16 >> 2] = 0;
  $1458 = HEAP32[677] | 0;
  $1459 = 1 << $I1_0_i_i;
  if (($1458 & $1459 | 0) == 0) {
   label = 327;
   break;
  } else {
   label = 328;
   break;
  }
 case 327:
  HEAP32[677] = $1458 | $1459;
  HEAP32[$1454 >> 2] = $1425;
  HEAP32[$890 + 24 >> 2] = $1454;
  HEAP32[$890 + 12 >> 2] = $890;
  HEAP32[$890 + 8 >> 2] = $890;
  label = 341;
  break;
 case 328:
  $1468 = HEAP32[$1454 >> 2] | 0;
  if (($I1_0_i_i | 0) == 31) {
   $1474 = 0;
   label = 330;
   break;
  } else {
   label = 329;
   break;
  }
 case 329:
  $1474 = 25 - ($I1_0_i_i >>> 1) | 0;
  label = 330;
  break;
 case 330:
  if ((HEAP32[$1468 + 4 >> 2] & -8 | 0) == ($1392 | 0)) {
   $T_0_lcssa_i_i = $1468;
   label = 337;
   break;
  } else {
   label = 331;
   break;
  }
 case 331:
  $T_014_i_i = $1468;
  $K2_015_i_i = $1392 << $1474;
  label = 333;
  break;
 case 332:
  if ((HEAP32[$1489 + 4 >> 2] & -8 | 0) == ($1392 | 0)) {
   $T_0_lcssa_i_i = $1489;
   label = 337;
   break;
  } else {
   $T_014_i_i = $1489;
   $K2_015_i_i = $K2_015_i_i << 1;
   label = 333;
   break;
  }
 case 333:
  $1488 = $T_014_i_i + 16 + ($K2_015_i_i >>> 31 << 2) | 0;
  $1489 = HEAP32[$1488 >> 2] | 0;
  if (($1489 | 0) == 0) {
   label = 334;
   break;
  } else {
   label = 332;
   break;
  }
 case 334:
  if ($1488 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 336;
   break;
  } else {
   label = 335;
   break;
  }
 case 335:
  HEAP32[$1488 >> 2] = $1425;
  HEAP32[$890 + 24 >> 2] = $T_014_i_i;
  HEAP32[$890 + 12 >> 2] = $890;
  HEAP32[$890 + 8 >> 2] = $890;
  label = 341;
  break;
 case 336:
  _abort();
  return 0;
  return 0;
 case 337:
  $1500 = $T_0_lcssa_i_i + 8 | 0;
  $1501 = HEAP32[$1500 >> 2] | 0;
  $1503 = HEAP32[680] | 0;
  if ($T_0_lcssa_i_i >>> 0 < $1503 >>> 0) {
   label = 340;
   break;
  } else {
   label = 338;
   break;
  }
 case 338:
  if ($1501 >>> 0 < $1503 >>> 0) {
   label = 340;
   break;
  } else {
   label = 339;
   break;
  }
 case 339:
  HEAP32[$1501 + 12 >> 2] = $1425;
  HEAP32[$1500 >> 2] = $1425;
  HEAP32[$890 + 8 >> 2] = $1501;
  HEAP32[$890 + 12 >> 2] = $T_0_lcssa_i_i;
  HEAP32[$890 + 24 >> 2] = 0;
  label = 341;
  break;
 case 340:
  _abort();
  return 0;
  return 0;
 case 341:
  $1513 = HEAP32[679] | 0;
  if ($1513 >>> 0 > $nb_0 >>> 0) {
   label = 342;
   break;
  } else {
   label = 343;
   break;
  }
 case 342:
  $1516 = $1513 - $nb_0 | 0;
  HEAP32[679] = $1516;
  $1517 = HEAP32[682] | 0;
  $1518 = $1517;
  HEAP32[682] = $1518 + $nb_0;
  HEAP32[$1518 + ($nb_0 + 4) >> 2] = $1516 | 1;
  HEAP32[$1517 + 4 >> 2] = $nb_0 | 3;
  $mem_0 = $1517 + 8 | 0;
  label = 344;
  break;
 case 343:
  HEAP32[(___errno_location() | 0) >> 2] = 12;
  $mem_0 = 0;
  label = 344;
  break;
 case 344:
  return $mem_0 | 0;
 }
 return 0;
}
function _free($mem) {
 $mem = $mem | 0;
 var $3 = 0, $5 = 0, $10 = 0, $11 = 0, $14 = 0, $15 = 0, $16 = 0, $21 = 0, $_sum3 = 0, $24 = 0, $25 = 0, $26 = 0, $32 = 0, $37 = 0, $40 = 0, $43 = 0, $64 = 0, $_pre_phi82 = 0, $69 = 0, $72 = 0, $75 = 0, $80 = 0, $84 = 0, $88 = 0, $94 = 0, $95 = 0, $99 = 0, $100 = 0, $RP_0 = 0, $R_0 = 0, $102 = 0, $103 = 0, $106 = 0, $107 = 0, $R_1 = 0, $118 = 0, $120 = 0, $134 = 0, $151 = 0, $164 = 0, $177 = 0, $psize_0 = 0, $p_0 = 0, $189 = 0, $193 = 0, $194 = 0, $204 = 0, $220 = 0, $227 = 0, $228 = 0, $233 = 0, $236 = 0, $239 = 0, $262 = 0, $_pre_phi80 = 0, $267 = 0, $270 = 0, $273 = 0, $278 = 0, $283 = 0, $287 = 0, $293 = 0, $294 = 0, $298 = 0, $299 = 0, $RP9_0 = 0, $R7_0 = 0, $301 = 0, $302 = 0, $305 = 0, $306 = 0, $R7_1 = 0, $318 = 0, $320 = 0, $334 = 0, $351 = 0, $364 = 0, $psize_1 = 0, $390 = 0, $393 = 0, $395 = 0, $396 = 0, $397 = 0, $403 = 0, $404 = 0, $_pre_phi = 0, $F16_0 = 0, $414 = 0, $415 = 0, $422 = 0, $423 = 0, $426 = 0, $428 = 0, $431 = 0, $436 = 0, $I18_0 = 0, $443 = 0, $447 = 0, $448 = 0, $457 = 0, $463 = 0, $K19_072 = 0, $T_071 = 0, $477 = 0, $478 = 0, $T_0_lcssa = 0, $489 = 0, $490 = 0, $492 = 0, $504 = 0, $sp_0_in_i = 0, $sp_0_i = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($mem | 0) == 0) {
   label = 143;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $3 = $mem - 8 | 0;
  $5 = HEAP32[680] | 0;
  if ($3 >>> 0 < $5 >>> 0) {
   label = 142;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  $10 = HEAP32[$mem - 4 >> 2] | 0;
  $11 = $10 & 3;
  if (($11 | 0) == 1) {
   label = 142;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  $14 = $10 & -8;
  $15 = $mem + ($14 - 8) | 0;
  $16 = $15;
  if (($10 & 1 | 0) == 0) {
   label = 5;
   break;
  } else {
   $p_0 = $3;
   $psize_0 = $14;
   label = 56;
   break;
  }
 case 5:
  $21 = HEAP32[$3 >> 2] | 0;
  if (($11 | 0) == 0) {
   label = 143;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $_sum3 = -8 - $21 | 0;
  $24 = $mem + $_sum3 | 0;
  $25 = $24;
  $26 = $21 + $14 | 0;
  if ($24 >>> 0 < $5 >>> 0) {
   label = 142;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if (($25 | 0) == (HEAP32[681] | 0)) {
   label = 54;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $32 = $21 >>> 3;
  if ($21 >>> 0 < 256) {
   label = 9;
   break;
  } else {
   label = 21;
   break;
  }
 case 9:
  $37 = HEAP32[$mem + ($_sum3 + 8) >> 2] | 0;
  $40 = HEAP32[$mem + ($_sum3 + 12) >> 2] | 0;
  $43 = 2744 + ($32 << 1 << 2) | 0;
  if (($37 | 0) == ($43 | 0)) {
   label = 12;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  if ($37 >>> 0 < $5 >>> 0) {
   label = 20;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  if ((HEAP32[$37 + 12 >> 2] | 0) == ($25 | 0)) {
   label = 12;
   break;
  } else {
   label = 20;
   break;
  }
 case 12:
  if (($40 | 0) == ($37 | 0)) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  HEAP32[676] = HEAP32[676] & ~(1 << $32);
  $p_0 = $25;
  $psize_0 = $26;
  label = 56;
  break;
 case 14:
  if (($40 | 0) == ($43 | 0)) {
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  $_pre_phi82 = $40 + 8 | 0;
  label = 18;
  break;
 case 16:
  if ($40 >>> 0 < $5 >>> 0) {
   label = 19;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $64 = $40 + 8 | 0;
  if ((HEAP32[$64 >> 2] | 0) == ($25 | 0)) {
   $_pre_phi82 = $64;
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  HEAP32[$37 + 12 >> 2] = $40;
  HEAP32[$_pre_phi82 >> 2] = $37;
  $p_0 = $25;
  $psize_0 = $26;
  label = 56;
  break;
 case 19:
  _abort();
 case 20:
  _abort();
 case 21:
  $69 = $24;
  $72 = HEAP32[$mem + ($_sum3 + 24) >> 2] | 0;
  $75 = HEAP32[$mem + ($_sum3 + 12) >> 2] | 0;
  if (($75 | 0) == ($69 | 0)) {
   label = 27;
   break;
  } else {
   label = 22;
   break;
  }
 case 22:
  $80 = HEAP32[$mem + ($_sum3 + 8) >> 2] | 0;
  if ($80 >>> 0 < $5 >>> 0) {
   label = 26;
   break;
  } else {
   label = 23;
   break;
  }
 case 23:
  $84 = $80 + 12 | 0;
  if ((HEAP32[$84 >> 2] | 0) == ($69 | 0)) {
   label = 24;
   break;
  } else {
   label = 26;
   break;
  }
 case 24:
  $88 = $75 + 8 | 0;
  if ((HEAP32[$88 >> 2] | 0) == ($69 | 0)) {
   label = 25;
   break;
  } else {
   label = 26;
   break;
  }
 case 25:
  HEAP32[$84 >> 2] = $75;
  HEAP32[$88 >> 2] = $80;
  $R_1 = $75;
  label = 34;
  break;
 case 26:
  _abort();
 case 27:
  $94 = $mem + ($_sum3 + 20) | 0;
  $95 = HEAP32[$94 >> 2] | 0;
  if (($95 | 0) == 0) {
   label = 28;
   break;
  } else {
   $R_0 = $95;
   $RP_0 = $94;
   label = 29;
   break;
  }
 case 28:
  $99 = $mem + ($_sum3 + 16) | 0;
  $100 = HEAP32[$99 >> 2] | 0;
  if (($100 | 0) == 0) {
   $R_1 = 0;
   label = 34;
   break;
  } else {
   $R_0 = $100;
   $RP_0 = $99;
   label = 29;
   break;
  }
 case 29:
  $102 = $R_0 + 20 | 0;
  $103 = HEAP32[$102 >> 2] | 0;
  if (($103 | 0) == 0) {
   label = 30;
   break;
  } else {
   $R_0 = $103;
   $RP_0 = $102;
   label = 29;
   break;
  }
 case 30:
  $106 = $R_0 + 16 | 0;
  $107 = HEAP32[$106 >> 2] | 0;
  if (($107 | 0) == 0) {
   label = 31;
   break;
  } else {
   $R_0 = $107;
   $RP_0 = $106;
   label = 29;
   break;
  }
 case 31:
  if ($RP_0 >>> 0 < $5 >>> 0) {
   label = 33;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  HEAP32[$RP_0 >> 2] = 0;
  $R_1 = $R_0;
  label = 34;
  break;
 case 33:
  _abort();
 case 34:
  if (($72 | 0) == 0) {
   $p_0 = $25;
   $psize_0 = $26;
   label = 56;
   break;
  } else {
   label = 35;
   break;
  }
 case 35:
  $118 = $mem + ($_sum3 + 28) | 0;
  $120 = 3008 + (HEAP32[$118 >> 2] << 2) | 0;
  if (($69 | 0) == (HEAP32[$120 >> 2] | 0)) {
   label = 36;
   break;
  } else {
   label = 38;
   break;
  }
 case 36:
  HEAP32[$120 >> 2] = $R_1;
  if (($R_1 | 0) == 0) {
   label = 37;
   break;
  } else {
   label = 44;
   break;
  }
 case 37:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$118 >> 2]);
  $p_0 = $25;
  $psize_0 = $26;
  label = 56;
  break;
 case 38:
  if ($72 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 42;
   break;
  } else {
   label = 39;
   break;
  }
 case 39:
  $134 = $72 + 16 | 0;
  if ((HEAP32[$134 >> 2] | 0) == ($69 | 0)) {
   label = 40;
   break;
  } else {
   label = 41;
   break;
  }
 case 40:
  HEAP32[$134 >> 2] = $R_1;
  label = 43;
  break;
 case 41:
  HEAP32[$72 + 20 >> 2] = $R_1;
  label = 43;
  break;
 case 42:
  _abort();
 case 43:
  if (($R_1 | 0) == 0) {
   $p_0 = $25;
   $psize_0 = $26;
   label = 56;
   break;
  } else {
   label = 44;
   break;
  }
 case 44:
  if ($R_1 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 53;
   break;
  } else {
   label = 45;
   break;
  }
 case 45:
  HEAP32[$R_1 + 24 >> 2] = $72;
  $151 = HEAP32[$mem + ($_sum3 + 16) >> 2] | 0;
  if (($151 | 0) == 0) {
   label = 49;
   break;
  } else {
   label = 46;
   break;
  }
 case 46:
  if ($151 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 48;
   break;
  } else {
   label = 47;
   break;
  }
 case 47:
  HEAP32[$R_1 + 16 >> 2] = $151;
  HEAP32[$151 + 24 >> 2] = $R_1;
  label = 49;
  break;
 case 48:
  _abort();
 case 49:
  $164 = HEAP32[$mem + ($_sum3 + 20) >> 2] | 0;
  if (($164 | 0) == 0) {
   $p_0 = $25;
   $psize_0 = $26;
   label = 56;
   break;
  } else {
   label = 50;
   break;
  }
 case 50:
  if ($164 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 52;
   break;
  } else {
   label = 51;
   break;
  }
 case 51:
  HEAP32[$R_1 + 20 >> 2] = $164;
  HEAP32[$164 + 24 >> 2] = $R_1;
  $p_0 = $25;
  $psize_0 = $26;
  label = 56;
  break;
 case 52:
  _abort();
 case 53:
  _abort();
 case 54:
  $177 = $mem + ($14 - 4) | 0;
  if ((HEAP32[$177 >> 2] & 3 | 0) == 3) {
   label = 55;
   break;
  } else {
   $p_0 = $25;
   $psize_0 = $26;
   label = 56;
   break;
  }
 case 55:
  HEAP32[678] = $26;
  HEAP32[$177 >> 2] = HEAP32[$177 >> 2] & -2;
  HEAP32[$mem + ($_sum3 + 4) >> 2] = $26 | 1;
  HEAP32[$15 >> 2] = $26;
  label = 143;
  break;
 case 56:
  $189 = $p_0;
  if ($189 >>> 0 < $15 >>> 0) {
   label = 57;
   break;
  } else {
   label = 142;
   break;
  }
 case 57:
  $193 = $mem + ($14 - 4) | 0;
  $194 = HEAP32[$193 >> 2] | 0;
  if (($194 & 1 | 0) == 0) {
   label = 142;
   break;
  } else {
   label = 58;
   break;
  }
 case 58:
  if (($194 & 2 | 0) == 0) {
   label = 59;
   break;
  } else {
   label = 114;
   break;
  }
 case 59:
  if (($16 | 0) == (HEAP32[682] | 0)) {
   label = 60;
   break;
  } else {
   label = 64;
   break;
  }
 case 60:
  $204 = (HEAP32[679] | 0) + $psize_0 | 0;
  HEAP32[679] = $204;
  HEAP32[682] = $p_0;
  HEAP32[$p_0 + 4 >> 2] = $204 | 1;
  if (($p_0 | 0) == (HEAP32[681] | 0)) {
   label = 61;
   break;
  } else {
   label = 62;
   break;
  }
 case 61:
  HEAP32[681] = 0;
  HEAP32[678] = 0;
  label = 62;
  break;
 case 62:
  if ($204 >>> 0 > (HEAP32[683] | 0) >>> 0) {
   label = 63;
   break;
  } else {
   label = 143;
   break;
  }
 case 63:
  _sys_trim(0) | 0;
  label = 143;
  break;
 case 64:
  if (($16 | 0) == (HEAP32[681] | 0)) {
   label = 65;
   break;
  } else {
   label = 66;
   break;
  }
 case 65:
  $220 = (HEAP32[678] | 0) + $psize_0 | 0;
  HEAP32[678] = $220;
  HEAP32[681] = $p_0;
  HEAP32[$p_0 + 4 >> 2] = $220 | 1;
  HEAP32[$189 + $220 >> 2] = $220;
  label = 143;
  break;
 case 66:
  $227 = ($194 & -8) + $psize_0 | 0;
  $228 = $194 >>> 3;
  if ($194 >>> 0 < 256) {
   label = 67;
   break;
  } else {
   label = 79;
   break;
  }
 case 67:
  $233 = HEAP32[$mem + $14 >> 2] | 0;
  $236 = HEAP32[$mem + ($14 | 4) >> 2] | 0;
  $239 = 2744 + ($228 << 1 << 2) | 0;
  if (($233 | 0) == ($239 | 0)) {
   label = 70;
   break;
  } else {
   label = 68;
   break;
  }
 case 68:
  if ($233 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 78;
   break;
  } else {
   label = 69;
   break;
  }
 case 69:
  if ((HEAP32[$233 + 12 >> 2] | 0) == ($16 | 0)) {
   label = 70;
   break;
  } else {
   label = 78;
   break;
  }
 case 70:
  if (($236 | 0) == ($233 | 0)) {
   label = 71;
   break;
  } else {
   label = 72;
   break;
  }
 case 71:
  HEAP32[676] = HEAP32[676] & ~(1 << $228);
  label = 112;
  break;
 case 72:
  if (($236 | 0) == ($239 | 0)) {
   label = 73;
   break;
  } else {
   label = 74;
   break;
  }
 case 73:
  $_pre_phi80 = $236 + 8 | 0;
  label = 76;
  break;
 case 74:
  if ($236 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 77;
   break;
  } else {
   label = 75;
   break;
  }
 case 75:
  $262 = $236 + 8 | 0;
  if ((HEAP32[$262 >> 2] | 0) == ($16 | 0)) {
   $_pre_phi80 = $262;
   label = 76;
   break;
  } else {
   label = 77;
   break;
  }
 case 76:
  HEAP32[$233 + 12 >> 2] = $236;
  HEAP32[$_pre_phi80 >> 2] = $233;
  label = 112;
  break;
 case 77:
  _abort();
 case 78:
  _abort();
 case 79:
  $267 = $15;
  $270 = HEAP32[$mem + ($14 + 16) >> 2] | 0;
  $273 = HEAP32[$mem + ($14 | 4) >> 2] | 0;
  if (($273 | 0) == ($267 | 0)) {
   label = 85;
   break;
  } else {
   label = 80;
   break;
  }
 case 80:
  $278 = HEAP32[$mem + $14 >> 2] | 0;
  if ($278 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 84;
   break;
  } else {
   label = 81;
   break;
  }
 case 81:
  $283 = $278 + 12 | 0;
  if ((HEAP32[$283 >> 2] | 0) == ($267 | 0)) {
   label = 82;
   break;
  } else {
   label = 84;
   break;
  }
 case 82:
  $287 = $273 + 8 | 0;
  if ((HEAP32[$287 >> 2] | 0) == ($267 | 0)) {
   label = 83;
   break;
  } else {
   label = 84;
   break;
  }
 case 83:
  HEAP32[$283 >> 2] = $273;
  HEAP32[$287 >> 2] = $278;
  $R7_1 = $273;
  label = 92;
  break;
 case 84:
  _abort();
 case 85:
  $293 = $mem + ($14 + 12) | 0;
  $294 = HEAP32[$293 >> 2] | 0;
  if (($294 | 0) == 0) {
   label = 86;
   break;
  } else {
   $R7_0 = $294;
   $RP9_0 = $293;
   label = 87;
   break;
  }
 case 86:
  $298 = $mem + ($14 + 8) | 0;
  $299 = HEAP32[$298 >> 2] | 0;
  if (($299 | 0) == 0) {
   $R7_1 = 0;
   label = 92;
   break;
  } else {
   $R7_0 = $299;
   $RP9_0 = $298;
   label = 87;
   break;
  }
 case 87:
  $301 = $R7_0 + 20 | 0;
  $302 = HEAP32[$301 >> 2] | 0;
  if (($302 | 0) == 0) {
   label = 88;
   break;
  } else {
   $R7_0 = $302;
   $RP9_0 = $301;
   label = 87;
   break;
  }
 case 88:
  $305 = $R7_0 + 16 | 0;
  $306 = HEAP32[$305 >> 2] | 0;
  if (($306 | 0) == 0) {
   label = 89;
   break;
  } else {
   $R7_0 = $306;
   $RP9_0 = $305;
   label = 87;
   break;
  }
 case 89:
  if ($RP9_0 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 91;
   break;
  } else {
   label = 90;
   break;
  }
 case 90:
  HEAP32[$RP9_0 >> 2] = 0;
  $R7_1 = $R7_0;
  label = 92;
  break;
 case 91:
  _abort();
 case 92:
  if (($270 | 0) == 0) {
   label = 112;
   break;
  } else {
   label = 93;
   break;
  }
 case 93:
  $318 = $mem + ($14 + 20) | 0;
  $320 = 3008 + (HEAP32[$318 >> 2] << 2) | 0;
  if (($267 | 0) == (HEAP32[$320 >> 2] | 0)) {
   label = 94;
   break;
  } else {
   label = 96;
   break;
  }
 case 94:
  HEAP32[$320 >> 2] = $R7_1;
  if (($R7_1 | 0) == 0) {
   label = 95;
   break;
  } else {
   label = 102;
   break;
  }
 case 95:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$318 >> 2]);
  label = 112;
  break;
 case 96:
  if ($270 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 100;
   break;
  } else {
   label = 97;
   break;
  }
 case 97:
  $334 = $270 + 16 | 0;
  if ((HEAP32[$334 >> 2] | 0) == ($267 | 0)) {
   label = 98;
   break;
  } else {
   label = 99;
   break;
  }
 case 98:
  HEAP32[$334 >> 2] = $R7_1;
  label = 101;
  break;
 case 99:
  HEAP32[$270 + 20 >> 2] = $R7_1;
  label = 101;
  break;
 case 100:
  _abort();
 case 101:
  if (($R7_1 | 0) == 0) {
   label = 112;
   break;
  } else {
   label = 102;
   break;
  }
 case 102:
  if ($R7_1 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 111;
   break;
  } else {
   label = 103;
   break;
  }
 case 103:
  HEAP32[$R7_1 + 24 >> 2] = $270;
  $351 = HEAP32[$mem + ($14 + 8) >> 2] | 0;
  if (($351 | 0) == 0) {
   label = 107;
   break;
  } else {
   label = 104;
   break;
  }
 case 104:
  if ($351 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 106;
   break;
  } else {
   label = 105;
   break;
  }
 case 105:
  HEAP32[$R7_1 + 16 >> 2] = $351;
  HEAP32[$351 + 24 >> 2] = $R7_1;
  label = 107;
  break;
 case 106:
  _abort();
 case 107:
  $364 = HEAP32[$mem + ($14 + 12) >> 2] | 0;
  if (($364 | 0) == 0) {
   label = 112;
   break;
  } else {
   label = 108;
   break;
  }
 case 108:
  if ($364 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 110;
   break;
  } else {
   label = 109;
   break;
  }
 case 109:
  HEAP32[$R7_1 + 20 >> 2] = $364;
  HEAP32[$364 + 24 >> 2] = $R7_1;
  label = 112;
  break;
 case 110:
  _abort();
 case 111:
  _abort();
 case 112:
  HEAP32[$p_0 + 4 >> 2] = $227 | 1;
  HEAP32[$189 + $227 >> 2] = $227;
  if (($p_0 | 0) == (HEAP32[681] | 0)) {
   label = 113;
   break;
  } else {
   $psize_1 = $227;
   label = 115;
   break;
  }
 case 113:
  HEAP32[678] = $227;
  label = 143;
  break;
 case 114:
  HEAP32[$193 >> 2] = $194 & -2;
  HEAP32[$p_0 + 4 >> 2] = $psize_0 | 1;
  HEAP32[$189 + $psize_0 >> 2] = $psize_0;
  $psize_1 = $psize_0;
  label = 115;
  break;
 case 115:
  $390 = $psize_1 >>> 3;
  if ($psize_1 >>> 0 < 256) {
   label = 116;
   break;
  } else {
   label = 121;
   break;
  }
 case 116:
  $393 = $390 << 1;
  $395 = 2744 + ($393 << 2) | 0;
  $396 = HEAP32[676] | 0;
  $397 = 1 << $390;
  if (($396 & $397 | 0) == 0) {
   label = 117;
   break;
  } else {
   label = 118;
   break;
  }
 case 117:
  HEAP32[676] = $396 | $397;
  $F16_0 = $395;
  $_pre_phi = 2744 + ($393 + 2 << 2) | 0;
  label = 120;
  break;
 case 118:
  $403 = 2744 + ($393 + 2 << 2) | 0;
  $404 = HEAP32[$403 >> 2] | 0;
  if ($404 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 119;
   break;
  } else {
   $F16_0 = $404;
   $_pre_phi = $403;
   label = 120;
   break;
  }
 case 119:
  _abort();
 case 120:
  HEAP32[$_pre_phi >> 2] = $p_0;
  HEAP32[$F16_0 + 12 >> 2] = $p_0;
  HEAP32[$p_0 + 8 >> 2] = $F16_0;
  HEAP32[$p_0 + 12 >> 2] = $395;
  label = 143;
  break;
 case 121:
  $414 = $p_0;
  $415 = $psize_1 >>> 8;
  if (($415 | 0) == 0) {
   $I18_0 = 0;
   label = 124;
   break;
  } else {
   label = 122;
   break;
  }
 case 122:
  if ($psize_1 >>> 0 > 16777215) {
   $I18_0 = 31;
   label = 124;
   break;
  } else {
   label = 123;
   break;
  }
 case 123:
  $422 = ($415 + 1048320 | 0) >>> 16 & 8;
  $423 = $415 << $422;
  $426 = ($423 + 520192 | 0) >>> 16 & 4;
  $428 = $423 << $426;
  $431 = ($428 + 245760 | 0) >>> 16 & 2;
  $436 = 14 - ($426 | $422 | $431) + ($428 << $431 >>> 15) | 0;
  $I18_0 = $psize_1 >>> (($436 + 7 | 0) >>> 0) & 1 | $436 << 1;
  label = 124;
  break;
 case 124:
  $443 = 3008 + ($I18_0 << 2) | 0;
  HEAP32[$p_0 + 28 >> 2] = $I18_0;
  HEAP32[$p_0 + 20 >> 2] = 0;
  HEAP32[$p_0 + 16 >> 2] = 0;
  $447 = HEAP32[677] | 0;
  $448 = 1 << $I18_0;
  if (($447 & $448 | 0) == 0) {
   label = 125;
   break;
  } else {
   label = 126;
   break;
  }
 case 125:
  HEAP32[677] = $447 | $448;
  HEAP32[$443 >> 2] = $414;
  HEAP32[$p_0 + 24 >> 2] = $443;
  HEAP32[$p_0 + 12 >> 2] = $p_0;
  HEAP32[$p_0 + 8 >> 2] = $p_0;
  label = 139;
  break;
 case 126:
  $457 = HEAP32[$443 >> 2] | 0;
  if (($I18_0 | 0) == 31) {
   $463 = 0;
   label = 128;
   break;
  } else {
   label = 127;
   break;
  }
 case 127:
  $463 = 25 - ($I18_0 >>> 1) | 0;
  label = 128;
  break;
 case 128:
  if ((HEAP32[$457 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
   $T_0_lcssa = $457;
   label = 135;
   break;
  } else {
   label = 129;
   break;
  }
 case 129:
  $T_071 = $457;
  $K19_072 = $psize_1 << $463;
  label = 131;
  break;
 case 130:
  if ((HEAP32[$478 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
   $T_0_lcssa = $478;
   label = 135;
   break;
  } else {
   $T_071 = $478;
   $K19_072 = $K19_072 << 1;
   label = 131;
   break;
  }
 case 131:
  $477 = $T_071 + 16 + ($K19_072 >>> 31 << 2) | 0;
  $478 = HEAP32[$477 >> 2] | 0;
  if (($478 | 0) == 0) {
   label = 132;
   break;
  } else {
   label = 130;
   break;
  }
 case 132:
  if ($477 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 134;
   break;
  } else {
   label = 133;
   break;
  }
 case 133:
  HEAP32[$477 >> 2] = $414;
  HEAP32[$p_0 + 24 >> 2] = $T_071;
  HEAP32[$p_0 + 12 >> 2] = $p_0;
  HEAP32[$p_0 + 8 >> 2] = $p_0;
  label = 139;
  break;
 case 134:
  _abort();
 case 135:
  $489 = $T_0_lcssa + 8 | 0;
  $490 = HEAP32[$489 >> 2] | 0;
  $492 = HEAP32[680] | 0;
  if ($T_0_lcssa >>> 0 < $492 >>> 0) {
   label = 138;
   break;
  } else {
   label = 136;
   break;
  }
 case 136:
  if ($490 >>> 0 < $492 >>> 0) {
   label = 138;
   break;
  } else {
   label = 137;
   break;
  }
 case 137:
  HEAP32[$490 + 12 >> 2] = $414;
  HEAP32[$489 >> 2] = $414;
  HEAP32[$p_0 + 8 >> 2] = $490;
  HEAP32[$p_0 + 12 >> 2] = $T_0_lcssa;
  HEAP32[$p_0 + 24 >> 2] = 0;
  label = 139;
  break;
 case 138:
  _abort();
 case 139:
  $504 = (HEAP32[684] | 0) - 1 | 0;
  HEAP32[684] = $504;
  if (($504 | 0) == 0) {
   $sp_0_in_i = 3160;
   label = 140;
   break;
  } else {
   label = 143;
   break;
  }
 case 140:
  $sp_0_i = HEAP32[$sp_0_in_i >> 2] | 0;
  if (($sp_0_i | 0) == 0) {
   label = 141;
   break;
  } else {
   $sp_0_in_i = $sp_0_i + 8 | 0;
   label = 140;
   break;
  }
 case 141:
  HEAP32[684] = -1;
  label = 143;
  break;
 case 142:
  _abort();
 case 143:
  return;
 }
}
function _calloc($n_elements, $elem_size) {
 $n_elements = $n_elements | 0;
 $elem_size = $elem_size | 0;
 var $3 = 0, $req_0 = 0, $10 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($n_elements | 0) == 0) {
   $req_0 = 0;
   label = 4;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $3 = Math_imul($elem_size, $n_elements) | 0;
  if (($elem_size | $n_elements) >>> 0 > 65535) {
   label = 3;
   break;
  } else {
   $req_0 = $3;
   label = 4;
   break;
  }
 case 3:
  $req_0 = (($3 >>> 0) / ($n_elements >>> 0) | 0 | 0) == ($elem_size | 0) ? $3 : -1;
  label = 4;
  break;
 case 4:
  $10 = _malloc($req_0) | 0;
  if (($10 | 0) == 0) {
   label = 7;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  if ((HEAP32[$10 - 4 >> 2] & 3 | 0) == 0) {
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  _memset($10 | 0, 0, $req_0 | 0);
  label = 7;
  break;
 case 7:
  return $10 | 0;
 }
 return 0;
}
function _realloc($oldmem, $bytes) {
 $oldmem = $oldmem | 0;
 $bytes = $bytes | 0;
 var $14 = 0, $17 = 0, $23 = 0, $28 = 0, $33 = 0, $mem_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($oldmem | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $mem_0 = _malloc($bytes) | 0;
  label = 11;
  break;
 case 3:
  if ($bytes >>> 0 > 4294967231) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  HEAP32[(___errno_location() | 0) >> 2] = 12;
  $mem_0 = 0;
  label = 11;
  break;
 case 5:
  if ($bytes >>> 0 < 11) {
   $14 = 16;
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $14 = $bytes + 11 & -8;
  label = 7;
  break;
 case 7:
  $17 = _try_realloc_chunk($oldmem - 8 | 0, $14) | 0;
  if (($17 | 0) == 0) {
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $mem_0 = $17 + 8 | 0;
  label = 11;
  break;
 case 9:
  $23 = _malloc($bytes) | 0;
  if (($23 | 0) == 0) {
   $mem_0 = 0;
   label = 11;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  $28 = HEAP32[$oldmem - 4 >> 2] | 0;
  $33 = ($28 & -8) - (($28 & 3 | 0) == 0 ? 8 : 4) | 0;
  _memcpy($23 | 0, $oldmem | 0, $33 >>> 0 < $bytes >>> 0 ? $33 : $bytes) | 0;
  _free($oldmem);
  $mem_0 = $23;
  label = 11;
  break;
 case 11:
  return $mem_0 | 0;
 }
 return 0;
}
function _realloc_in_place($oldmem, $bytes) {
 $oldmem = $oldmem | 0;
 $bytes = $bytes | 0;
 var $12 = 0, $14 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($oldmem | 0) == 0) {
   label = 7;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  if ($bytes >>> 0 > 4294967231) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  HEAP32[(___errno_location() | 0) >> 2] = 12;
  label = 7;
  break;
 case 4:
  if ($bytes >>> 0 < 11) {
   $12 = 16;
   label = 6;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  $12 = $bytes + 11 & -8;
  label = 6;
  break;
 case 6:
  $14 = $oldmem - 8 | 0;
  return ((_try_realloc_chunk($14, $12) | 0) == ($14 | 0) ? $oldmem : 0) | 0;
 case 7:
  return 0;
 }
 return 0;
}
function _memalign($alignment, $bytes) {
 $alignment = $alignment | 0;
 $bytes = $bytes | 0;
 var $_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ($alignment >>> 0 < 9) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $_0 = _malloc($bytes) | 0;
  label = 4;
  break;
 case 3:
  $_0 = _internal_memalign($alignment, $bytes) | 0;
  label = 4;
  break;
 case 4:
  return $_0 | 0;
 }
 return 0;
}
function _internal_memalign($alignment, $bytes) {
 $alignment = $alignment | 0;
 $bytes = $bytes | 0;
 var $_alignment = 0, $a_0 = 0, $_1 = 0, $17 = 0, $20 = 0, $23 = 0, $24 = 0, $26 = 0, $34 = 0, $35 = 0, $37 = 0, $43 = 0, $44 = 0, $46 = 0, $48 = 0, $49 = 0, $51 = 0, $63 = 0, $69 = 0, $77 = 0, $p_0 = 0, $81 = 0, $82 = 0, $86 = 0, $90 = 0, $91 = 0, $101 = 0, $mem_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $_alignment = $alignment >>> 0 < 16 ? 16 : $alignment;
  if (($_alignment - 1 & $_alignment | 0) == 0) {
   $_1 = $_alignment;
   label = 3;
   break;
  } else {
   $a_0 = 16;
   label = 2;
   break;
  }
 case 2:
  if ($a_0 >>> 0 < $_alignment >>> 0) {
   $a_0 = $a_0 << 1;
   label = 2;
   break;
  } else {
   $_1 = $a_0;
   label = 3;
   break;
  }
 case 3:
  if ((-64 - $_1 | 0) >>> 0 > $bytes >>> 0) {
   label = 5;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  HEAP32[(___errno_location() | 0) >> 2] = 12;
  $mem_0 = 0;
  label = 18;
  break;
 case 5:
  if ($bytes >>> 0 < 11) {
   $17 = 16;
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $17 = $bytes + 11 & -8;
  label = 7;
  break;
 case 7:
  $20 = _malloc($_1 + 12 + $17 | 0) | 0;
  if (($20 | 0) == 0) {
   $mem_0 = 0;
   label = 18;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $23 = $20 - 8 | 0;
  $24 = $23;
  $26 = $_1 - 1 | 0;
  if (($20 & $26 | 0) == 0) {
   $p_0 = $24;
   label = 14;
   break;
  } else {
   label = 9;
   break;
  }
 case 9:
  $34 = $20 + $26 & -$_1;
  $35 = $34 - 8 | 0;
  $37 = $23;
  if (($35 - $37 | 0) >>> 0 > 15) {
   $43 = $35;
   label = 11;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  $43 = $34 + ($_1 - 8) | 0;
  label = 11;
  break;
 case 11:
  $44 = $43;
  $46 = $43 - $37 | 0;
  $48 = $20 - 4 | 0;
  $49 = HEAP32[$48 >> 2] | 0;
  $51 = ($49 & -8) - $46 | 0;
  if (($49 & 3 | 0) == 0) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  HEAP32[$43 >> 2] = (HEAP32[$23 >> 2] | 0) + $46;
  HEAP32[$43 + 4 >> 2] = $51;
  $p_0 = $44;
  label = 14;
  break;
 case 13:
  $63 = $43 + 4 | 0;
  HEAP32[$63 >> 2] = $51 | HEAP32[$63 >> 2] & 1 | 2;
  $69 = $43 + ($51 + 4) | 0;
  HEAP32[$69 >> 2] = HEAP32[$69 >> 2] | 1;
  HEAP32[$48 >> 2] = $46 | HEAP32[$48 >> 2] & 1 | 2;
  $77 = $20 + ($46 - 4) | 0;
  HEAP32[$77 >> 2] = HEAP32[$77 >> 2] | 1;
  _dispose_chunk($24, $46);
  $p_0 = $44;
  label = 14;
  break;
 case 14:
  $81 = $p_0 + 4 | 0;
  $82 = HEAP32[$81 >> 2] | 0;
  if (($82 & 3 | 0) == 0) {
   label = 17;
   break;
  } else {
   label = 15;
   break;
  }
 case 15:
  $86 = $82 & -8;
  if ($86 >>> 0 > ($17 + 16 | 0) >>> 0) {
   label = 16;
   break;
  } else {
   label = 17;
   break;
  }
 case 16:
  $90 = $86 - $17 | 0;
  $91 = $p_0;
  HEAP32[$81 >> 2] = $17 | $82 & 1 | 2;
  HEAP32[$91 + ($17 | 4) >> 2] = $90 | 3;
  $101 = $91 + ($86 | 4) | 0;
  HEAP32[$101 >> 2] = HEAP32[$101 >> 2] | 1;
  _dispose_chunk($91 + $17 | 0, $90);
  label = 17;
  break;
 case 17:
  $mem_0 = $p_0 + 8 | 0;
  label = 18;
  break;
 case 18:
  return $mem_0 | 0;
 }
 return 0;
}
function _sys_trim($pad) {
 $pad = $pad | 0;
 var $4 = 0, $15 = 0, $19 = 0, $22 = 0, $28 = 0, $sp_0_i = 0, $30 = 0, $31 = 0, $34 = 0, $41 = 0, $47 = 0, $56 = 0, $57 = 0, $63 = 0, $70 = 0, $72 = 0, $73 = 0, $75 = 0, $82 = 0, $85 = 0, $released_2 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  if ($pad >>> 0 < 4294967232) {
   label = 6;
   break;
  } else {
   $released_2 = 0;
   label = 21;
   break;
  }
 case 6:
  $15 = HEAP32[682] | 0;
  if (($15 | 0) == 0) {
   $released_2 = 0;
   label = 21;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  $19 = HEAP32[679] | 0;
  if ($19 >>> 0 > ($pad + 40 | 0) >>> 0) {
   label = 8;
   break;
  } else {
   label = 19;
   break;
  }
 case 8:
  $22 = HEAP32[668] | 0;
  $28 = $15;
  $sp_0_i = 3152;
  label = 9;
  break;
 case 9:
  $30 = $sp_0_i | 0;
  $31 = HEAP32[$30 >> 2] | 0;
  if ($31 >>> 0 > $28 >>> 0) {
   label = 11;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  $34 = $sp_0_i + 4 | 0;
  if (($31 + (HEAP32[$34 >> 2] | 0) | 0) >>> 0 > $28 >>> 0) {
   label = 12;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  $sp_0_i = HEAP32[$sp_0_i + 8 >> 2] | 0;
  label = 9;
  break;
 case 12:
  $41 = Math_imul((((-40 - $pad - 1 + $19 + $22 | 0) >>> 0) / ($22 >>> 0) | 0) - 1 | 0, $22) | 0;
  if ((HEAP32[$sp_0_i + 12 >> 2] & 8 | 0) == 0) {
   label = 13;
   break;
  } else {
   label = 19;
   break;
  }
 case 13:
  $47 = _sbrk(0) | 0;
  if (($47 | 0) == ((HEAP32[$30 >> 2] | 0) + (HEAP32[$34 >> 2] | 0) | 0)) {
   label = 14;
   break;
  } else {
   label = 19;
   break;
  }
 case 14:
  $56 = _sbrk(-($41 >>> 0 > 2147483646 ? -2147483648 - $22 | 0 : $41) | 0) | 0;
  $57 = _sbrk(0) | 0;
  if (($56 | 0) != -1 & $57 >>> 0 < $47 >>> 0) {
   label = 15;
   break;
  } else {
   label = 19;
   break;
  }
 case 15:
  $63 = $47 - $57 | 0;
  if (($47 | 0) == ($57 | 0)) {
   label = 19;
   break;
  } else {
   label = 16;
   break;
  }
 case 16:
  HEAP32[$34 >> 2] = (HEAP32[$34 >> 2] | 0) - $63;
  HEAP32[784] = (HEAP32[784] | 0) - $63;
  $70 = HEAP32[682] | 0;
  $72 = (HEAP32[679] | 0) - $63 | 0;
  $73 = $70;
  $75 = $70 + 8 | 0;
  if (($75 & 7 | 0) == 0) {
   $82 = 0;
   label = 18;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $82 = -$75 & 7;
  label = 18;
  break;
 case 18:
  $85 = $72 - $82 | 0;
  HEAP32[682] = $73 + $82;
  HEAP32[679] = $85;
  HEAP32[$73 + ($82 + 4) >> 2] = $85 | 1;
  HEAP32[$73 + ($72 + 4) >> 2] = 40;
  HEAP32[683] = HEAP32[670];
  $released_2 = ($47 | 0) != ($57 | 0) | 0;
  label = 21;
  break;
 case 19:
  if ((HEAP32[679] | 0) >>> 0 > (HEAP32[683] | 0) >>> 0) {
   label = 20;
   break;
  } else {
   $released_2 = 0;
   label = 21;
   break;
  }
 case 20:
  HEAP32[683] = -1;
  $released_2 = 0;
  label = 21;
  break;
 case 21:
  return $released_2 | 0;
 }
 return 0;
}
function _try_realloc_chunk($p, $nb) {
 $p = $p | 0;
 $nb = $nb | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $10 = 0, $15 = 0, $16 = 0, $34 = 0, $52 = 0, $55 = 0, $69 = 0, $72 = 0, $86 = 0, $94 = 0, $storemerge27 = 0, $storemerge = 0, $103 = 0, $106 = 0, $107 = 0, $112 = 0, $115 = 0, $118 = 0, $139 = 0, $_pre_phi = 0, $144 = 0, $147 = 0, $150 = 0, $155 = 0, $159 = 0, $163 = 0, $169 = 0, $170 = 0, $174 = 0, $175 = 0, $RP_0 = 0, $R_0 = 0, $177 = 0, $178 = 0, $181 = 0, $182 = 0, $R_1 = 0, $193 = 0, $195 = 0, $209 = 0, $226 = 0, $239 = 0, $258 = 0, $272 = 0, $newp_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $p + 4 | 0;
  $2 = HEAP32[$1 >> 2] | 0;
  $3 = $2 & -8;
  $4 = $p;
  $5 = $4 + $3 | 0;
  $6 = $5;
  $7 = HEAP32[680] | 0;
  if ($4 >>> 0 < $7 >>> 0) {
   label = 72;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $10 = $2 & 3;
  if (($10 | 0) != 1 & $4 >>> 0 < $5 >>> 0) {
   label = 3;
   break;
  } else {
   label = 72;
   break;
  }
 case 3:
  $15 = $4 + ($3 | 4) | 0;
  $16 = HEAP32[$15 >> 2] | 0;
  if (($16 & 1 | 0) == 0) {
   label = 72;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if (($10 | 0) == 0) {
   label = 5;
   break;
  } else {
   label = 9;
   break;
  }
 case 5:
  if ($nb >>> 0 < 256) {
   $newp_0 = 0;
   label = 73;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ($3 >>> 0 < ($nb + 4 | 0) >>> 0) {
   label = 8;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if (($3 - $nb | 0) >>> 0 > HEAP32[668] << 1 >>> 0) {
   label = 8;
   break;
  } else {
   $newp_0 = $p;
   label = 73;
   break;
  }
 case 8:
  $newp_0 = 0;
  label = 73;
  break;
 case 9:
  if ($3 >>> 0 < $nb >>> 0) {
   label = 12;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  $34 = $3 - $nb | 0;
  if ($34 >>> 0 > 15) {
   label = 11;
   break;
  } else {
   $newp_0 = $p;
   label = 73;
   break;
  }
 case 11:
  HEAP32[$1 >> 2] = $2 & 1 | $nb | 2;
  HEAP32[$4 + ($nb + 4) >> 2] = $34 | 3;
  HEAP32[$15 >> 2] = HEAP32[$15 >> 2] | 1;
  _dispose_chunk($4 + $nb | 0, $34);
  $newp_0 = $p;
  label = 73;
  break;
 case 12:
  if (($6 | 0) == (HEAP32[682] | 0)) {
   label = 13;
   break;
  } else {
   label = 15;
   break;
  }
 case 13:
  $52 = (HEAP32[679] | 0) + $3 | 0;
  if ($52 >>> 0 > $nb >>> 0) {
   label = 14;
   break;
  } else {
   $newp_0 = 0;
   label = 73;
   break;
  }
 case 14:
  $55 = $52 - $nb | 0;
  HEAP32[$1 >> 2] = $2 & 1 | $nb | 2;
  HEAP32[$4 + ($nb + 4) >> 2] = $55 | 1;
  HEAP32[682] = $4 + $nb;
  HEAP32[679] = $55;
  $newp_0 = $p;
  label = 73;
  break;
 case 15:
  if (($6 | 0) == (HEAP32[681] | 0)) {
   label = 16;
   break;
  } else {
   label = 21;
   break;
  }
 case 16:
  $69 = (HEAP32[678] | 0) + $3 | 0;
  if ($69 >>> 0 < $nb >>> 0) {
   $newp_0 = 0;
   label = 73;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $72 = $69 - $nb | 0;
  if ($72 >>> 0 > 15) {
   label = 18;
   break;
  } else {
   label = 19;
   break;
  }
 case 18:
  HEAP32[$1 >> 2] = $2 & 1 | $nb | 2;
  HEAP32[$4 + ($nb + 4) >> 2] = $72 | 1;
  HEAP32[$4 + $69 >> 2] = $72;
  $86 = $4 + ($69 + 4) | 0;
  HEAP32[$86 >> 2] = HEAP32[$86 >> 2] & -2;
  $storemerge = $4 + $nb | 0;
  $storemerge27 = $72;
  label = 20;
  break;
 case 19:
  HEAP32[$1 >> 2] = $2 & 1 | $69 | 2;
  $94 = $4 + ($69 + 4) | 0;
  HEAP32[$94 >> 2] = HEAP32[$94 >> 2] | 1;
  $storemerge = 0;
  $storemerge27 = 0;
  label = 20;
  break;
 case 20:
  HEAP32[678] = $storemerge27;
  HEAP32[681] = $storemerge;
  $newp_0 = $p;
  label = 73;
  break;
 case 21:
  if (($16 & 2 | 0) == 0) {
   label = 22;
   break;
  } else {
   $newp_0 = 0;
   label = 73;
   break;
  }
 case 22:
  $103 = ($16 & -8) + $3 | 0;
  if ($103 >>> 0 < $nb >>> 0) {
   $newp_0 = 0;
   label = 73;
   break;
  } else {
   label = 23;
   break;
  }
 case 23:
  $106 = $103 - $nb | 0;
  $107 = $16 >>> 3;
  if ($16 >>> 0 < 256) {
   label = 24;
   break;
  } else {
   label = 36;
   break;
  }
 case 24:
  $112 = HEAP32[$4 + ($3 + 8) >> 2] | 0;
  $115 = HEAP32[$4 + ($3 + 12) >> 2] | 0;
  $118 = 2744 + ($107 << 1 << 2) | 0;
  if (($112 | 0) == ($118 | 0)) {
   label = 27;
   break;
  } else {
   label = 25;
   break;
  }
 case 25:
  if ($112 >>> 0 < $7 >>> 0) {
   label = 35;
   break;
  } else {
   label = 26;
   break;
  }
 case 26:
  if ((HEAP32[$112 + 12 >> 2] | 0) == ($6 | 0)) {
   label = 27;
   break;
  } else {
   label = 35;
   break;
  }
 case 27:
  if (($115 | 0) == ($112 | 0)) {
   label = 28;
   break;
  } else {
   label = 29;
   break;
  }
 case 28:
  HEAP32[676] = HEAP32[676] & ~(1 << $107);
  label = 69;
  break;
 case 29:
  if (($115 | 0) == ($118 | 0)) {
   label = 30;
   break;
  } else {
   label = 31;
   break;
  }
 case 30:
  $_pre_phi = $115 + 8 | 0;
  label = 33;
  break;
 case 31:
  if ($115 >>> 0 < $7 >>> 0) {
   label = 34;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  $139 = $115 + 8 | 0;
  if ((HEAP32[$139 >> 2] | 0) == ($6 | 0)) {
   $_pre_phi = $139;
   label = 33;
   break;
  } else {
   label = 34;
   break;
  }
 case 33:
  HEAP32[$112 + 12 >> 2] = $115;
  HEAP32[$_pre_phi >> 2] = $112;
  label = 69;
  break;
 case 34:
  _abort();
  return 0;
  return 0;
 case 35:
  _abort();
  return 0;
  return 0;
 case 36:
  $144 = $5;
  $147 = HEAP32[$4 + ($3 + 24) >> 2] | 0;
  $150 = HEAP32[$4 + ($3 + 12) >> 2] | 0;
  if (($150 | 0) == ($144 | 0)) {
   label = 42;
   break;
  } else {
   label = 37;
   break;
  }
 case 37:
  $155 = HEAP32[$4 + ($3 + 8) >> 2] | 0;
  if ($155 >>> 0 < $7 >>> 0) {
   label = 41;
   break;
  } else {
   label = 38;
   break;
  }
 case 38:
  $159 = $155 + 12 | 0;
  if ((HEAP32[$159 >> 2] | 0) == ($144 | 0)) {
   label = 39;
   break;
  } else {
   label = 41;
   break;
  }
 case 39:
  $163 = $150 + 8 | 0;
  if ((HEAP32[$163 >> 2] | 0) == ($144 | 0)) {
   label = 40;
   break;
  } else {
   label = 41;
   break;
  }
 case 40:
  HEAP32[$159 >> 2] = $150;
  HEAP32[$163 >> 2] = $155;
  $R_1 = $150;
  label = 49;
  break;
 case 41:
  _abort();
  return 0;
  return 0;
 case 42:
  $169 = $4 + ($3 + 20) | 0;
  $170 = HEAP32[$169 >> 2] | 0;
  if (($170 | 0) == 0) {
   label = 43;
   break;
  } else {
   $R_0 = $170;
   $RP_0 = $169;
   label = 44;
   break;
  }
 case 43:
  $174 = $4 + ($3 + 16) | 0;
  $175 = HEAP32[$174 >> 2] | 0;
  if (($175 | 0) == 0) {
   $R_1 = 0;
   label = 49;
   break;
  } else {
   $R_0 = $175;
   $RP_0 = $174;
   label = 44;
   break;
  }
 case 44:
  $177 = $R_0 + 20 | 0;
  $178 = HEAP32[$177 >> 2] | 0;
  if (($178 | 0) == 0) {
   label = 45;
   break;
  } else {
   $R_0 = $178;
   $RP_0 = $177;
   label = 44;
   break;
  }
 case 45:
  $181 = $R_0 + 16 | 0;
  $182 = HEAP32[$181 >> 2] | 0;
  if (($182 | 0) == 0) {
   label = 46;
   break;
  } else {
   $R_0 = $182;
   $RP_0 = $181;
   label = 44;
   break;
  }
 case 46:
  if ($RP_0 >>> 0 < $7 >>> 0) {
   label = 48;
   break;
  } else {
   label = 47;
   break;
  }
 case 47:
  HEAP32[$RP_0 >> 2] = 0;
  $R_1 = $R_0;
  label = 49;
  break;
 case 48:
  _abort();
  return 0;
  return 0;
 case 49:
  if (($147 | 0) == 0) {
   label = 69;
   break;
  } else {
   label = 50;
   break;
  }
 case 50:
  $193 = $4 + ($3 + 28) | 0;
  $195 = 3008 + (HEAP32[$193 >> 2] << 2) | 0;
  if (($144 | 0) == (HEAP32[$195 >> 2] | 0)) {
   label = 51;
   break;
  } else {
   label = 53;
   break;
  }
 case 51:
  HEAP32[$195 >> 2] = $R_1;
  if (($R_1 | 0) == 0) {
   label = 52;
   break;
  } else {
   label = 59;
   break;
  }
 case 52:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$193 >> 2]);
  label = 69;
  break;
 case 53:
  if ($147 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 57;
   break;
  } else {
   label = 54;
   break;
  }
 case 54:
  $209 = $147 + 16 | 0;
  if ((HEAP32[$209 >> 2] | 0) == ($144 | 0)) {
   label = 55;
   break;
  } else {
   label = 56;
   break;
  }
 case 55:
  HEAP32[$209 >> 2] = $R_1;
  label = 58;
  break;
 case 56:
  HEAP32[$147 + 20 >> 2] = $R_1;
  label = 58;
  break;
 case 57:
  _abort();
  return 0;
  return 0;
 case 58:
  if (($R_1 | 0) == 0) {
   label = 69;
   break;
  } else {
   label = 59;
   break;
  }
 case 59:
  if ($R_1 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 68;
   break;
  } else {
   label = 60;
   break;
  }
 case 60:
  HEAP32[$R_1 + 24 >> 2] = $147;
  $226 = HEAP32[$4 + ($3 + 16) >> 2] | 0;
  if (($226 | 0) == 0) {
   label = 64;
   break;
  } else {
   label = 61;
   break;
  }
 case 61:
  if ($226 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 63;
   break;
  } else {
   label = 62;
   break;
  }
 case 62:
  HEAP32[$R_1 + 16 >> 2] = $226;
  HEAP32[$226 + 24 >> 2] = $R_1;
  label = 64;
  break;
 case 63:
  _abort();
  return 0;
  return 0;
 case 64:
  $239 = HEAP32[$4 + ($3 + 20) >> 2] | 0;
  if (($239 | 0) == 0) {
   label = 69;
   break;
  } else {
   label = 65;
   break;
  }
 case 65:
  if ($239 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 67;
   break;
  } else {
   label = 66;
   break;
  }
 case 66:
  HEAP32[$R_1 + 20 >> 2] = $239;
  HEAP32[$239 + 24 >> 2] = $R_1;
  label = 69;
  break;
 case 67:
  _abort();
  return 0;
  return 0;
 case 68:
  _abort();
  return 0;
  return 0;
 case 69:
  if ($106 >>> 0 < 16) {
   label = 70;
   break;
  } else {
   label = 71;
   break;
  }
 case 70:
  HEAP32[$1 >> 2] = $103 | HEAP32[$1 >> 2] & 1 | 2;
  $258 = $4 + ($103 | 4) | 0;
  HEAP32[$258 >> 2] = HEAP32[$258 >> 2] | 1;
  $newp_0 = $p;
  label = 73;
  break;
 case 71:
  HEAP32[$1 >> 2] = HEAP32[$1 >> 2] & 1 | $nb | 2;
  HEAP32[$4 + ($nb + 4) >> 2] = $106 | 3;
  $272 = $4 + ($103 | 4) | 0;
  HEAP32[$272 >> 2] = HEAP32[$272 >> 2] | 1;
  _dispose_chunk($4 + $nb | 0, $106);
  $newp_0 = $p;
  label = 73;
  break;
 case 72:
  _abort();
  return 0;
  return 0;
 case 73:
  return $newp_0 | 0;
 }
 return 0;
}
function _malloc_footprint() {
 return HEAP32[784] | 0;
}
function _malloc_max_footprint() {
 return HEAP32[785] | 0;
}
function _malloc_footprint_limit() {
 var $1 = 0;
 $1 = HEAP32[786] | 0;
 return (($1 | 0) == 0 ? -1 : $1) | 0;
}
function _malloc_set_footprint_limit($bytes) {
 $bytes = $bytes | 0;
 var $3 = 0, $result_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($bytes | 0) == -1) {
   $result_0 = 0;
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $3 = HEAP32[668] | 0;
  $result_0 = $bytes - 1 + $3 & -$3;
  label = 3;
  break;
 case 3:
  HEAP32[786] = $result_0;
  return $result_0 | 0;
 }
 return 0;
}
function _malloc_usable_size($mem) {
 $mem = $mem | 0;
 var $5 = 0, $6 = 0, $_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($mem | 0) == 0) {
   $_0 = 0;
   label = 4;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $5 = HEAP32[$mem - 4 >> 2] | 0;
  $6 = $5 & 3;
  if (($6 | 0) == 1) {
   $_0 = 0;
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  $_0 = ($5 & -8) - (($6 | 0) == 0 ? 8 : 4) | 0;
  label = 4;
  break;
 case 4:
  return $_0 | 0;
 }
 return 0;
}
function _posix_memalign($pp, $alignment, $bytes) {
 $pp = $pp | 0;
 $alignment = $alignment | 0;
 $bytes = $bytes | 0;
 var $5 = 0, $mem_0 = 0, $_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($alignment | 0) == 8) {
   label = 2;
   break;
  } else {
   label = 3;
   break;
  }
 case 2:
  $mem_0 = _malloc($bytes) | 0;
  label = 7;
  break;
 case 3:
  $5 = $alignment >>> 2;
  if (($alignment & 3 | 0) != 0 | ($5 | 0) == 0) {
   $_0 = 22;
   label = 9;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if (($5 + 1073741823 & $5 | 0) == 0) {
   label = 5;
   break;
  } else {
   $_0 = 22;
   label = 9;
   break;
  }
 case 5:
  if ((-64 - $alignment | 0) >>> 0 < $bytes >>> 0) {
   $_0 = 12;
   label = 9;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $mem_0 = _internal_memalign($alignment >>> 0 < 16 ? 16 : $alignment, $bytes) | 0;
  label = 7;
  break;
 case 7:
  if (($mem_0 | 0) == 0) {
   $_0 = 12;
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  HEAP32[$pp >> 2] = $mem_0;
  $_0 = 0;
  label = 9;
  break;
 case 9:
  return $_0 | 0;
 }
 return 0;
}
function _independent_calloc($n_elements, $elem_size, $chunks) {
 $n_elements = $n_elements | 0;
 $elem_size = $elem_size | 0;
 $chunks = $chunks | 0;
 var $sz = 0, $1 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 8 | 0;
 $sz = sp | 0;
 HEAP32[$sz >> 2] = $elem_size;
 $1 = _ialloc($n_elements, $sz, 3, $chunks) | 0;
 STACKTOP = sp;
 return $1 | 0;
}
function _independent_comalloc($n_elements, $sizes, $chunks) {
 $n_elements = $n_elements | 0;
 $sizes = $sizes | 0;
 $chunks = $chunks | 0;
 return _ialloc($n_elements, $sizes, 0, $chunks) | 0;
}
function _valloc($bytes) {
 $bytes = $bytes | 0;
 var $4 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  return _memalign(HEAP32[667] | 0, $bytes) | 0;
 }
 return 0;
}
function _pvalloc($bytes) {
 $bytes = $bytes | 0;
 var $4 = 0, $13 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  $13 = HEAP32[667] | 0;
  return _memalign($13, $bytes - 1 + $13 & -$13) | 0;
 }
 return 0;
}
function _ialloc($n_elements, $sizes, $opts, $chunks) {
 $n_elements = $n_elements | 0;
 $sizes = $sizes | 0;
 $opts = $opts | 0;
 $chunks = $chunks | 0;
 var $4 = 0, $14 = 0, $21 = 0, $array_size_0 = 0, $marray_0 = 0, $30 = 0, $36 = 0, $i_08 = 0, $contents_size_07 = 0, $39 = 0, $45 = 0, $46 = 0, $47 = 0, $contents_size_1 = 0, $element_size_0 = 0, $51 = 0, $54 = 0, $58 = 0, $remainder_size_0 = 0, $marray_1 = 0, $74 = 0, $i_15_us = 0, $remainder_size_14_us = 0, $p_0_in3_us = 0, $78 = 0, $size_0_us = 0, $84 = 0, $88 = 0, $89 = 0, $i_15 = 0, $remainder_size_14 = 0, $p_0_in3 = 0, $94 = 0, $98 = 0, $99 = 0, $remainder_size_1_lcssa = 0, $p_0_in_lcssa = 0, $_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  $14 = ($n_elements | 0) == 0;
  if (($chunks | 0) == 0) {
   label = 7;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  if ($14) {
   $_0 = $chunks;
   label = 31;
   break;
  } else {
   $marray_0 = $chunks;
   $array_size_0 = 0;
   label = 11;
   break;
  }
 case 7:
  if ($14) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $_0 = _malloc(0) | 0;
  label = 31;
  break;
 case 9:
  $21 = $n_elements << 2;
  if ($21 >>> 0 < 11) {
   $marray_0 = 0;
   $array_size_0 = 16;
   label = 11;
   break;
  } else {
   label = 10;
   break;
  }
 case 10:
  $marray_0 = 0;
  $array_size_0 = $21 + 11 & -8;
  label = 11;
  break;
 case 11:
  if (($opts & 1 | 0) == 0) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  if ($14) {
   $element_size_0 = 0;
   $contents_size_1 = 0;
   label = 19;
   break;
  } else {
   $contents_size_07 = 0;
   $i_08 = 0;
   label = 16;
   break;
  }
 case 13:
  $30 = HEAP32[$sizes >> 2] | 0;
  if ($30 >>> 0 < 11) {
   $36 = 16;
   label = 15;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  $36 = $30 + 11 & -8;
  label = 15;
  break;
 case 15:
  $element_size_0 = $36;
  $contents_size_1 = Math_imul($36, $n_elements) | 0;
  label = 19;
  break;
 case 16:
  $39 = HEAP32[$sizes + ($i_08 << 2) >> 2] | 0;
  if ($39 >>> 0 < 11) {
   $45 = 16;
   label = 18;
   break;
  } else {
   label = 17;
   break;
  }
 case 17:
  $45 = $39 + 11 & -8;
  label = 18;
  break;
 case 18:
  $46 = $45 + $contents_size_07 | 0;
  $47 = $i_08 + 1 | 0;
  if (($47 | 0) == ($n_elements | 0)) {
   $element_size_0 = 0;
   $contents_size_1 = $46;
   label = 19;
   break;
  } else {
   $contents_size_07 = $46;
   $i_08 = $47;
   label = 16;
   break;
  }
 case 19:
  $51 = _malloc($array_size_0 - 4 + $contents_size_1 | 0) | 0;
  if (($51 | 0) == 0) {
   $_0 = 0;
   label = 31;
   break;
  } else {
   label = 20;
   break;
  }
 case 20:
  $54 = $51 - 8 | 0;
  $58 = HEAP32[$51 - 4 >> 2] & -8;
  if (($opts & 2 | 0) == 0) {
   label = 22;
   break;
  } else {
   label = 21;
   break;
  }
 case 21:
  _memset($51 | 0, 0, -4 - $array_size_0 + $58 | 0);
  label = 22;
  break;
 case 22:
  if (($marray_0 | 0) == 0) {
   label = 23;
   break;
  } else {
   $marray_1 = $marray_0;
   $remainder_size_0 = $58;
   label = 24;
   break;
  }
 case 23:
  HEAP32[$51 + ($contents_size_1 - 4) >> 2] = $58 - $contents_size_1 | 3;
  $marray_1 = $51 + $contents_size_1 | 0;
  $remainder_size_0 = $contents_size_1;
  label = 24;
  break;
 case 24:
  HEAP32[$marray_1 >> 2] = $51;
  $74 = $n_elements - 1 | 0;
  if (($74 | 0) == 0) {
   $p_0_in_lcssa = $54;
   $remainder_size_1_lcssa = $remainder_size_0;
   label = 30;
   break;
  } else {
   label = 25;
   break;
  }
 case 25:
  if (($element_size_0 | 0) == 0) {
   $p_0_in3_us = $54;
   $remainder_size_14_us = $remainder_size_0;
   $i_15_us = 0;
   label = 26;
   break;
  } else {
   $p_0_in3 = $54;
   $remainder_size_14 = $remainder_size_0;
   $i_15 = 0;
   label = 29;
   break;
  }
 case 26:
  $78 = HEAP32[$sizes + ($i_15_us << 2) >> 2] | 0;
  if ($78 >>> 0 < 11) {
   $size_0_us = 16;
   label = 28;
   break;
  } else {
   label = 27;
   break;
  }
 case 27:
  $size_0_us = $78 + 11 & -8;
  label = 28;
  break;
 case 28:
  $84 = $remainder_size_14_us - $size_0_us | 0;
  HEAP32[$p_0_in3_us + 4 >> 2] = $size_0_us | 3;
  $88 = $p_0_in3_us + $size_0_us | 0;
  $89 = $i_15_us + 1 | 0;
  HEAP32[$marray_1 + ($89 << 2) >> 2] = $p_0_in3_us + ($size_0_us + 8);
  if (($89 | 0) == ($74 | 0)) {
   $p_0_in_lcssa = $88;
   $remainder_size_1_lcssa = $84;
   label = 30;
   break;
  } else {
   $p_0_in3_us = $88;
   $remainder_size_14_us = $84;
   $i_15_us = $89;
   label = 26;
   break;
  }
 case 29:
  $94 = $remainder_size_14 - $element_size_0 | 0;
  HEAP32[$p_0_in3 + 4 >> 2] = $element_size_0 | 3;
  $98 = $p_0_in3 + $element_size_0 | 0;
  $99 = $i_15 + 1 | 0;
  HEAP32[$marray_1 + ($99 << 2) >> 2] = $p_0_in3 + ($element_size_0 + 8);
  if (($99 | 0) == ($74 | 0)) {
   $p_0_in_lcssa = $98;
   $remainder_size_1_lcssa = $94;
   label = 30;
   break;
  } else {
   $p_0_in3 = $98;
   $remainder_size_14 = $94;
   $i_15 = $99;
   label = 29;
   break;
  }
 case 30:
  HEAP32[$p_0_in_lcssa + 4 >> 2] = $remainder_size_1_lcssa | 3;
  $_0 = $marray_1;
  label = 31;
  break;
 case 31:
  return $_0 | 0;
 }
 return 0;
}
function _bulk_free($array, $nelem) {
 $array = $array | 0;
 $nelem = $nelem | 0;
 var $1 = 0, $a_07_i = 0, $3 = 0, $6 = 0, $9 = 0, $11 = 0, $15 = 0, $19 = 0, $_sum_i = 0, $31 = 0, $36 = 0, $_pre_phi_i = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $array + ($nelem << 2) | 0;
  if (($nelem | 0) == 0) {
   label = 12;
   break;
  } else {
   $a_07_i = $array;
   label = 2;
   break;
  }
 case 2:
  $3 = HEAP32[$a_07_i >> 2] | 0;
  if (($3 | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  $_pre_phi_i = $a_07_i + 4 | 0;
  label = 11;
  break;
 case 4:
  $6 = $3 - 8 | 0;
  $9 = $3 - 4 | 0;
  $11 = HEAP32[$9 >> 2] & -8;
  HEAP32[$a_07_i >> 2] = 0;
  if ($6 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 10;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  $15 = HEAP32[$9 >> 2] | 0;
  if (($15 & 3 | 0) == 1) {
   label = 10;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $19 = $a_07_i + 4 | 0;
  $_sum_i = $15 - 8 & -8;
  if (($19 | 0) == ($1 | 0)) {
   label = 9;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if ((HEAP32[$19 >> 2] | 0) == ($3 + ($_sum_i + 8) | 0)) {
   label = 8;
   break;
  } else {
   label = 9;
   break;
  }
 case 8:
  $31 = (HEAP32[$3 + ($_sum_i | 4) >> 2] & -8) + $11 | 0;
  HEAP32[$9 >> 2] = $15 & 1 | $31 | 2;
  $36 = $3 + ($31 - 4) | 0;
  HEAP32[$36 >> 2] = HEAP32[$36 >> 2] | 1;
  HEAP32[$19 >> 2] = $3;
  $_pre_phi_i = $19;
  label = 11;
  break;
 case 9:
  _dispose_chunk($6, $11);
  $_pre_phi_i = $19;
  label = 11;
  break;
 case 10:
  _abort();
  return 0;
  return 0;
 case 11:
  if (($_pre_phi_i | 0) == ($1 | 0)) {
   label = 12;
   break;
  } else {
   $a_07_i = $_pre_phi_i;
   label = 2;
   break;
  }
 case 12:
  if ((HEAP32[679] | 0) >>> 0 > (HEAP32[683] | 0) >>> 0) {
   label = 13;
   break;
  } else {
   label = 14;
   break;
  }
 case 13:
  _sys_trim(0) | 0;
  label = 14;
  break;
 case 14:
  return 0;
 }
 return 0;
}
function _malloc_trim($pad) {
 $pad = $pad | 0;
 var $4 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  return _sys_trim($pad) | 0;
 }
 return 0;
}
function _mallinfo($agg_result) {
 $agg_result = $agg_result | 0;
 var $4 = 0, $13 = 0, $16 = 0, $17 = 0, $s_011_i = 0, $sum_010_i = 0, $mfree_09_i = 0, $nfree_08_i = 0, $20 = 0, $22 = 0, $28 = 0, $q_0_in5_i = 0, $sum_14_i = 0, $mfree_13_i = 0, $nfree_12_i = 0, $39 = 0, $42 = 0, $43 = 0, $nfree_2_i = 0, $mfree_2_i = 0, $50 = 0, $sum_1_lcssa_i = 0, $mfree_1_lcssa_i = 0, $nfree_1_lcssa_i = 0, $53 = 0, $56 = 0, $nm_sroa_7_0_i = 0, $nm_sroa_6_0_i = 0, $nm_sroa_4_0_i = 0, $nm_sroa_3_0_i = 0, $nm_sroa_1_0_i = 0, $nm_sroa_0_0_i = 0, $nm_sroa_8_0_i = 0, $63 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  $13 = HEAP32[682] | 0;
  if (($13 | 0) == 0) {
   $nm_sroa_8_0_i = 0;
   $nm_sroa_0_0_i = 0;
   $nm_sroa_1_0_i = 0;
   $nm_sroa_3_0_i = 0;
   $nm_sroa_4_0_i = 0;
   $nm_sroa_6_0_i = 0;
   $nm_sroa_7_0_i = 0;
   label = 17;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $16 = HEAP32[679] | 0;
  $17 = $16 + 40 | 0;
  $nfree_08_i = 1;
  $mfree_09_i = $17;
  $sum_010_i = $17;
  $s_011_i = 3152;
  label = 7;
  break;
 case 7:
  $20 = HEAP32[$s_011_i >> 2] | 0;
  $22 = $20 + 8 | 0;
  if (($22 & 7 | 0) == 0) {
   $28 = 0;
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $28 = -$22 & 7;
  label = 9;
  break;
 case 9:
  $nfree_12_i = $nfree_08_i;
  $mfree_13_i = $mfree_09_i;
  $sum_14_i = $sum_010_i;
  $q_0_in5_i = $20 + $28 | 0;
  label = 10;
  break;
 case 10:
  if ($q_0_in5_i >>> 0 >= ($20 + (HEAP32[$s_011_i + 4 >> 2] | 0) | 0) >>> 0 | ($q_0_in5_i | 0) == ($13 | 0)) {
   $nfree_1_lcssa_i = $nfree_12_i;
   $mfree_1_lcssa_i = $mfree_13_i;
   $sum_1_lcssa_i = $sum_14_i;
   label = 15;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  $39 = HEAP32[$q_0_in5_i + 4 >> 2] | 0;
  if (($39 | 0) == 7) {
   $nfree_1_lcssa_i = $nfree_12_i;
   $mfree_1_lcssa_i = $mfree_13_i;
   $sum_1_lcssa_i = $sum_14_i;
   label = 15;
   break;
  } else {
   label = 12;
   break;
  }
 case 12:
  $42 = $39 & -8;
  $43 = $42 + $sum_14_i | 0;
  if (($39 & 3 | 0) == 1) {
   label = 13;
   break;
  } else {
   $mfree_2_i = $mfree_13_i;
   $nfree_2_i = $nfree_12_i;
   label = 14;
   break;
  }
 case 13:
  $mfree_2_i = $42 + $mfree_13_i | 0;
  $nfree_2_i = $nfree_12_i + 1 | 0;
  label = 14;
  break;
 case 14:
  $50 = $q_0_in5_i + $42 | 0;
  if ($50 >>> 0 < $20 >>> 0) {
   $nfree_1_lcssa_i = $nfree_2_i;
   $mfree_1_lcssa_i = $mfree_2_i;
   $sum_1_lcssa_i = $43;
   label = 15;
   break;
  } else {
   $nfree_12_i = $nfree_2_i;
   $mfree_13_i = $mfree_2_i;
   $sum_14_i = $43;
   $q_0_in5_i = $50;
   label = 10;
   break;
  }
 case 15:
  $53 = HEAP32[$s_011_i + 8 >> 2] | 0;
  if (($53 | 0) == 0) {
   label = 16;
   break;
  } else {
   $nfree_08_i = $nfree_1_lcssa_i;
   $mfree_09_i = $mfree_1_lcssa_i;
   $sum_010_i = $sum_1_lcssa_i;
   $s_011_i = $53;
   label = 7;
   break;
  }
 case 16:
  $56 = HEAP32[784] | 0;
  $nm_sroa_8_0_i = $16;
  $nm_sroa_0_0_i = $sum_1_lcssa_i;
  $nm_sroa_1_0_i = $nfree_1_lcssa_i;
  $nm_sroa_3_0_i = $56 - $sum_1_lcssa_i | 0;
  $nm_sroa_4_0_i = HEAP32[785] | 0;
  $nm_sroa_6_0_i = $56 - $mfree_1_lcssa_i | 0;
  $nm_sroa_7_0_i = $mfree_1_lcssa_i;
  label = 17;
  break;
 case 17:
  HEAP32[$agg_result >> 2] = $nm_sroa_0_0_i;
  HEAP32[$agg_result + 4 >> 2] = $nm_sroa_1_0_i;
  $63 = $agg_result + 8 | 0;
  HEAP32[$63 >> 2] = 0;
  HEAP32[$63 + 4 >> 2] = 0;
  HEAP32[$agg_result + 16 >> 2] = $nm_sroa_3_0_i;
  HEAP32[$agg_result + 20 >> 2] = $nm_sroa_4_0_i;
  HEAP32[$agg_result + 24 >> 2] = 0;
  HEAP32[$agg_result + 28 >> 2] = $nm_sroa_6_0_i;
  HEAP32[$agg_result + 32 >> 2] = $nm_sroa_7_0_i;
  HEAP32[$agg_result + 36 >> 2] = $nm_sroa_8_0_i;
  return;
 }
}
function _malloc_stats() {
 var $4 = 0, $13 = 0, $17 = 0, $s_06_i = 0, $used_05_i = 0, $22 = 0, $24 = 0, $30 = 0, $q_0_in4_i = 0, $used_13_i = 0, $41 = 0, $45 = 0, $used_2_i = 0, $47 = 0, $used_1_lcssa_i = 0, $50 = 0, $maxfp_0_i = 0, $fp_0_i = 0, $used_3_i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  $13 = HEAP32[682] | 0;
  if (($13 | 0) == 0) {
   $used_3_i = 0;
   $fp_0_i = 0;
   $maxfp_0_i = 0;
   label = 14;
   break;
  } else {
   label = 6;
   break;
  }
 case 6:
  $17 = HEAP32[784] | 0;
  $used_05_i = $17 - 40 - (HEAP32[679] | 0) | 0;
  $s_06_i = 3152;
  label = 7;
  break;
 case 7:
  $22 = HEAP32[$s_06_i >> 2] | 0;
  $24 = $22 + 8 | 0;
  if (($24 & 7 | 0) == 0) {
   $30 = 0;
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $30 = -$24 & 7;
  label = 9;
  break;
 case 9:
  $used_13_i = $used_05_i;
  $q_0_in4_i = $22 + $30 | 0;
  label = 10;
  break;
 case 10:
  if ($q_0_in4_i >>> 0 >= ($22 + (HEAP32[$s_06_i + 4 >> 2] | 0) | 0) >>> 0 | ($q_0_in4_i | 0) == ($13 | 0)) {
   $used_1_lcssa_i = $used_13_i;
   label = 13;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  $41 = HEAP32[$q_0_in4_i + 4 >> 2] | 0;
  if (($41 | 0) == 7) {
   $used_1_lcssa_i = $used_13_i;
   label = 13;
   break;
  } else {
   label = 12;
   break;
  }
 case 12:
  $45 = $41 & -8;
  $used_2_i = $used_13_i - (($41 & 3 | 0) == 1 ? $45 : 0) | 0;
  $47 = $q_0_in4_i + $45 | 0;
  if ($47 >>> 0 < $22 >>> 0) {
   $used_1_lcssa_i = $used_2_i;
   label = 13;
   break;
  } else {
   $used_13_i = $used_2_i;
   $q_0_in4_i = $47;
   label = 10;
   break;
  }
 case 13:
  $50 = HEAP32[$s_06_i + 8 >> 2] | 0;
  if (($50 | 0) == 0) {
   $used_3_i = $used_1_lcssa_i;
   $fp_0_i = $17;
   $maxfp_0_i = HEAP32[785] | 0;
   label = 14;
   break;
  } else {
   $used_05_i = $used_1_lcssa_i;
   $s_06_i = $50;
   label = 7;
   break;
  }
 case 14:
  _fprintf(HEAP32[_stderr >> 2] | 0, 752, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $maxfp_0_i, tempInt) | 0) | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 1152, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $fp_0_i, tempInt) | 0) | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 704, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $used_3_i, tempInt) | 0) | 0;
  STACKTOP = sp;
  return;
 }
}
function _mallopt($param_number, $value) {
 $param_number = $param_number | 0;
 $value = $value | 0;
 var $4 = 0, $_0_i = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if ((HEAP32[666] | 0) == 0) {
   label = 2;
   break;
  } else {
   label = 5;
   break;
  }
 case 2:
  $4 = _sysconf(8) | 0;
  if (($4 - 1 & $4 | 0) == 0) {
   label = 4;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  _abort();
  return 0;
  return 0;
 case 4:
  HEAP32[668] = $4;
  HEAP32[667] = $4;
  HEAP32[669] = -1;
  HEAP32[670] = 2097152;
  HEAP32[671] = 0;
  HEAP32[787] = 0;
  HEAP32[666] = (_time(0) | 0) & -16 ^ 1431655768;
  label = 5;
  break;
 case 5:
  if (($param_number | 0) == (-1 | 0)) {
   label = 6;
   break;
  } else if (($param_number | 0) == (-2 | 0)) {
   label = 7;
   break;
  } else if (($param_number | 0) == (-3 | 0)) {
   label = 10;
   break;
  } else {
   $_0_i = 0;
   label = 11;
   break;
  }
 case 6:
  HEAP32[670] = $value;
  $_0_i = 1;
  label = 11;
  break;
 case 7:
  if ((HEAP32[667] | 0) >>> 0 > $value >>> 0) {
   $_0_i = 0;
   label = 11;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if (($value - 1 & $value | 0) == 0) {
   label = 9;
   break;
  } else {
   $_0_i = 0;
   label = 11;
   break;
  }
 case 9:
  HEAP32[668] = $value;
  $_0_i = 1;
  label = 11;
  break;
 case 10:
  HEAP32[669] = $value;
  $_0_i = 1;
  label = 11;
  break;
 case 11:
  return $_0_i | 0;
 }
 return 0;
}
function __ZSt15get_new_handlerv() {
 return (tempValue = HEAP32[796] | 0, HEAP32[796] = tempValue + 0, tempValue) | 0;
}
function _dispose_chunk($p, $psize) {
 $p = $p | 0;
 $psize = $psize | 0;
 var $1 = 0, $2 = 0, $3 = 0, $5 = 0, $10 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $24 = 0, $29 = 0, $32 = 0, $35 = 0, $56 = 0, $_pre_phi69 = 0, $61 = 0, $64 = 0, $67 = 0, $72 = 0, $76 = 0, $80 = 0, $_sum28 = 0, $86 = 0, $87 = 0, $91 = 0, $92 = 0, $RP_0 = 0, $R_0 = 0, $94 = 0, $95 = 0, $98 = 0, $99 = 0, $R_1 = 0, $110 = 0, $112 = 0, $126 = 0, $_sum31 = 0, $143 = 0, $156 = 0, $169 = 0, $_02 = 0, $_0 = 0, $181 = 0, $185 = 0, $186 = 0, $194 = 0, $205 = 0, $213 = 0, $214 = 0, $219 = 0, $222 = 0, $225 = 0, $246 = 0, $_pre_phi67 = 0, $251 = 0, $254 = 0, $257 = 0, $262 = 0, $266 = 0, $270 = 0, $276 = 0, $277 = 0, $281 = 0, $282 = 0, $RP9_0 = 0, $R7_0 = 0, $284 = 0, $285 = 0, $288 = 0, $289 = 0, $R7_1 = 0, $300 = 0, $302 = 0, $316 = 0, $333 = 0, $346 = 0, $_1 = 0, $374 = 0, $377 = 0, $379 = 0, $380 = 0, $381 = 0, $387 = 0, $388 = 0, $_pre_phi = 0, $F16_0 = 0, $398 = 0, $399 = 0, $406 = 0, $407 = 0, $410 = 0, $412 = 0, $415 = 0, $420 = 0, $I19_0 = 0, $427 = 0, $431 = 0, $432 = 0, $441 = 0, $447 = 0, $K20_056 = 0, $T_055 = 0, $461 = 0, $462 = 0, $T_0_lcssa = 0, $473 = 0, $474 = 0, $476 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = $p;
  $2 = $1 + $psize | 0;
  $3 = $2;
  $5 = HEAP32[$p + 4 >> 2] | 0;
  if (($5 & 1 | 0) == 0) {
   label = 2;
   break;
  } else {
   $_0 = $p;
   $_02 = $psize;
   label = 54;
   break;
  }
 case 2:
  $10 = HEAP32[$p >> 2] | 0;
  if (($5 & 3 | 0) == 0) {
   label = 135;
   break;
  } else {
   label = 3;
   break;
  }
 case 3:
  $15 = $1 + (-$10 | 0) | 0;
  $16 = $15;
  $17 = $10 + $psize | 0;
  $18 = HEAP32[680] | 0;
  if ($15 >>> 0 < $18 >>> 0) {
   label = 53;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  if (($16 | 0) == (HEAP32[681] | 0)) {
   label = 51;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  $24 = $10 >>> 3;
  if ($10 >>> 0 < 256) {
   label = 6;
   break;
  } else {
   label = 18;
   break;
  }
 case 6:
  $29 = HEAP32[$1 + (8 - $10) >> 2] | 0;
  $32 = HEAP32[$1 + (12 - $10) >> 2] | 0;
  $35 = 2744 + ($24 << 1 << 2) | 0;
  if (($29 | 0) == ($35 | 0)) {
   label = 9;
   break;
  } else {
   label = 7;
   break;
  }
 case 7:
  if ($29 >>> 0 < $18 >>> 0) {
   label = 17;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ((HEAP32[$29 + 12 >> 2] | 0) == ($16 | 0)) {
   label = 9;
   break;
  } else {
   label = 17;
   break;
  }
 case 9:
  if (($32 | 0) == ($29 | 0)) {
   label = 10;
   break;
  } else {
   label = 11;
   break;
  }
 case 10:
  HEAP32[676] = HEAP32[676] & ~(1 << $24);
  $_0 = $16;
  $_02 = $17;
  label = 54;
  break;
 case 11:
  if (($32 | 0) == ($35 | 0)) {
   label = 12;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  $_pre_phi69 = $32 + 8 | 0;
  label = 15;
  break;
 case 13:
  if ($32 >>> 0 < $18 >>> 0) {
   label = 16;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  $56 = $32 + 8 | 0;
  if ((HEAP32[$56 >> 2] | 0) == ($16 | 0)) {
   $_pre_phi69 = $56;
   label = 15;
   break;
  } else {
   label = 16;
   break;
  }
 case 15:
  HEAP32[$29 + 12 >> 2] = $32;
  HEAP32[$_pre_phi69 >> 2] = $29;
  $_0 = $16;
  $_02 = $17;
  label = 54;
  break;
 case 16:
  _abort();
 case 17:
  _abort();
 case 18:
  $61 = $15;
  $64 = HEAP32[$1 + (24 - $10) >> 2] | 0;
  $67 = HEAP32[$1 + (12 - $10) >> 2] | 0;
  if (($67 | 0) == ($61 | 0)) {
   label = 24;
   break;
  } else {
   label = 19;
   break;
  }
 case 19:
  $72 = HEAP32[$1 + (8 - $10) >> 2] | 0;
  if ($72 >>> 0 < $18 >>> 0) {
   label = 23;
   break;
  } else {
   label = 20;
   break;
  }
 case 20:
  $76 = $72 + 12 | 0;
  if ((HEAP32[$76 >> 2] | 0) == ($61 | 0)) {
   label = 21;
   break;
  } else {
   label = 23;
   break;
  }
 case 21:
  $80 = $67 + 8 | 0;
  if ((HEAP32[$80 >> 2] | 0) == ($61 | 0)) {
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 22:
  HEAP32[$76 >> 2] = $67;
  HEAP32[$80 >> 2] = $72;
  $R_1 = $67;
  label = 31;
  break;
 case 23:
  _abort();
 case 24:
  $_sum28 = 16 - $10 | 0;
  $86 = $1 + ($_sum28 + 4) | 0;
  $87 = HEAP32[$86 >> 2] | 0;
  if (($87 | 0) == 0) {
   label = 25;
   break;
  } else {
   $R_0 = $87;
   $RP_0 = $86;
   label = 26;
   break;
  }
 case 25:
  $91 = $1 + $_sum28 | 0;
  $92 = HEAP32[$91 >> 2] | 0;
  if (($92 | 0) == 0) {
   $R_1 = 0;
   label = 31;
   break;
  } else {
   $R_0 = $92;
   $RP_0 = $91;
   label = 26;
   break;
  }
 case 26:
  $94 = $R_0 + 20 | 0;
  $95 = HEAP32[$94 >> 2] | 0;
  if (($95 | 0) == 0) {
   label = 27;
   break;
  } else {
   $R_0 = $95;
   $RP_0 = $94;
   label = 26;
   break;
  }
 case 27:
  $98 = $R_0 + 16 | 0;
  $99 = HEAP32[$98 >> 2] | 0;
  if (($99 | 0) == 0) {
   label = 28;
   break;
  } else {
   $R_0 = $99;
   $RP_0 = $98;
   label = 26;
   break;
  }
 case 28:
  if ($RP_0 >>> 0 < $18 >>> 0) {
   label = 30;
   break;
  } else {
   label = 29;
   break;
  }
 case 29:
  HEAP32[$RP_0 >> 2] = 0;
  $R_1 = $R_0;
  label = 31;
  break;
 case 30:
  _abort();
 case 31:
  if (($64 | 0) == 0) {
   $_0 = $16;
   $_02 = $17;
   label = 54;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  $110 = $1 + (28 - $10) | 0;
  $112 = 3008 + (HEAP32[$110 >> 2] << 2) | 0;
  if (($61 | 0) == (HEAP32[$112 >> 2] | 0)) {
   label = 33;
   break;
  } else {
   label = 35;
   break;
  }
 case 33:
  HEAP32[$112 >> 2] = $R_1;
  if (($R_1 | 0) == 0) {
   label = 34;
   break;
  } else {
   label = 41;
   break;
  }
 case 34:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$110 >> 2]);
  $_0 = $16;
  $_02 = $17;
  label = 54;
  break;
 case 35:
  if ($64 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 39;
   break;
  } else {
   label = 36;
   break;
  }
 case 36:
  $126 = $64 + 16 | 0;
  if ((HEAP32[$126 >> 2] | 0) == ($61 | 0)) {
   label = 37;
   break;
  } else {
   label = 38;
   break;
  }
 case 37:
  HEAP32[$126 >> 2] = $R_1;
  label = 40;
  break;
 case 38:
  HEAP32[$64 + 20 >> 2] = $R_1;
  label = 40;
  break;
 case 39:
  _abort();
 case 40:
  if (($R_1 | 0) == 0) {
   $_0 = $16;
   $_02 = $17;
   label = 54;
   break;
  } else {
   label = 41;
   break;
  }
 case 41:
  if ($R_1 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 50;
   break;
  } else {
   label = 42;
   break;
  }
 case 42:
  HEAP32[$R_1 + 24 >> 2] = $64;
  $_sum31 = 16 - $10 | 0;
  $143 = HEAP32[$1 + $_sum31 >> 2] | 0;
  if (($143 | 0) == 0) {
   label = 46;
   break;
  } else {
   label = 43;
   break;
  }
 case 43:
  if ($143 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 45;
   break;
  } else {
   label = 44;
   break;
  }
 case 44:
  HEAP32[$R_1 + 16 >> 2] = $143;
  HEAP32[$143 + 24 >> 2] = $R_1;
  label = 46;
  break;
 case 45:
  _abort();
 case 46:
  $156 = HEAP32[$1 + ($_sum31 + 4) >> 2] | 0;
  if (($156 | 0) == 0) {
   $_0 = $16;
   $_02 = $17;
   label = 54;
   break;
  } else {
   label = 47;
   break;
  }
 case 47:
  if ($156 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 49;
   break;
  } else {
   label = 48;
   break;
  }
 case 48:
  HEAP32[$R_1 + 20 >> 2] = $156;
  HEAP32[$156 + 24 >> 2] = $R_1;
  $_0 = $16;
  $_02 = $17;
  label = 54;
  break;
 case 49:
  _abort();
 case 50:
  _abort();
 case 51:
  $169 = $1 + ($psize + 4) | 0;
  if ((HEAP32[$169 >> 2] & 3 | 0) == 3) {
   label = 52;
   break;
  } else {
   $_0 = $16;
   $_02 = $17;
   label = 54;
   break;
  }
 case 52:
  HEAP32[678] = $17;
  HEAP32[$169 >> 2] = HEAP32[$169 >> 2] & -2;
  HEAP32[$1 + (4 - $10) >> 2] = $17 | 1;
  HEAP32[$2 >> 2] = $17;
  label = 135;
  break;
 case 53:
  _abort();
 case 54:
  $181 = HEAP32[680] | 0;
  if ($2 >>> 0 < $181 >>> 0) {
   label = 134;
   break;
  } else {
   label = 55;
   break;
  }
 case 55:
  $185 = $1 + ($psize + 4) | 0;
  $186 = HEAP32[$185 >> 2] | 0;
  if (($186 & 2 | 0) == 0) {
   label = 56;
   break;
  } else {
   label = 109;
   break;
  }
 case 56:
  if (($3 | 0) == (HEAP32[682] | 0)) {
   label = 57;
   break;
  } else {
   label = 59;
   break;
  }
 case 57:
  $194 = (HEAP32[679] | 0) + $_02 | 0;
  HEAP32[679] = $194;
  HEAP32[682] = $_0;
  HEAP32[$_0 + 4 >> 2] = $194 | 1;
  if (($_0 | 0) == (HEAP32[681] | 0)) {
   label = 58;
   break;
  } else {
   label = 135;
   break;
  }
 case 58:
  HEAP32[681] = 0;
  HEAP32[678] = 0;
  label = 135;
  break;
 case 59:
  if (($3 | 0) == (HEAP32[681] | 0)) {
   label = 60;
   break;
  } else {
   label = 61;
   break;
  }
 case 60:
  $205 = (HEAP32[678] | 0) + $_02 | 0;
  HEAP32[678] = $205;
  HEAP32[681] = $_0;
  HEAP32[$_0 + 4 >> 2] = $205 | 1;
  HEAP32[$_0 + $205 >> 2] = $205;
  label = 135;
  break;
 case 61:
  $213 = ($186 & -8) + $_02 | 0;
  $214 = $186 >>> 3;
  if ($186 >>> 0 < 256) {
   label = 62;
   break;
  } else {
   label = 74;
   break;
  }
 case 62:
  $219 = HEAP32[$1 + ($psize + 8) >> 2] | 0;
  $222 = HEAP32[$1 + ($psize + 12) >> 2] | 0;
  $225 = 2744 + ($214 << 1 << 2) | 0;
  if (($219 | 0) == ($225 | 0)) {
   label = 65;
   break;
  } else {
   label = 63;
   break;
  }
 case 63:
  if ($219 >>> 0 < $181 >>> 0) {
   label = 73;
   break;
  } else {
   label = 64;
   break;
  }
 case 64:
  if ((HEAP32[$219 + 12 >> 2] | 0) == ($3 | 0)) {
   label = 65;
   break;
  } else {
   label = 73;
   break;
  }
 case 65:
  if (($222 | 0) == ($219 | 0)) {
   label = 66;
   break;
  } else {
   label = 67;
   break;
  }
 case 66:
  HEAP32[676] = HEAP32[676] & ~(1 << $214);
  label = 107;
  break;
 case 67:
  if (($222 | 0) == ($225 | 0)) {
   label = 68;
   break;
  } else {
   label = 69;
   break;
  }
 case 68:
  $_pre_phi67 = $222 + 8 | 0;
  label = 71;
  break;
 case 69:
  if ($222 >>> 0 < $181 >>> 0) {
   label = 72;
   break;
  } else {
   label = 70;
   break;
  }
 case 70:
  $246 = $222 + 8 | 0;
  if ((HEAP32[$246 >> 2] | 0) == ($3 | 0)) {
   $_pre_phi67 = $246;
   label = 71;
   break;
  } else {
   label = 72;
   break;
  }
 case 71:
  HEAP32[$219 + 12 >> 2] = $222;
  HEAP32[$_pre_phi67 >> 2] = $219;
  label = 107;
  break;
 case 72:
  _abort();
 case 73:
  _abort();
 case 74:
  $251 = $2;
  $254 = HEAP32[$1 + ($psize + 24) >> 2] | 0;
  $257 = HEAP32[$1 + ($psize + 12) >> 2] | 0;
  if (($257 | 0) == ($251 | 0)) {
   label = 80;
   break;
  } else {
   label = 75;
   break;
  }
 case 75:
  $262 = HEAP32[$1 + ($psize + 8) >> 2] | 0;
  if ($262 >>> 0 < $181 >>> 0) {
   label = 79;
   break;
  } else {
   label = 76;
   break;
  }
 case 76:
  $266 = $262 + 12 | 0;
  if ((HEAP32[$266 >> 2] | 0) == ($251 | 0)) {
   label = 77;
   break;
  } else {
   label = 79;
   break;
  }
 case 77:
  $270 = $257 + 8 | 0;
  if ((HEAP32[$270 >> 2] | 0) == ($251 | 0)) {
   label = 78;
   break;
  } else {
   label = 79;
   break;
  }
 case 78:
  HEAP32[$266 >> 2] = $257;
  HEAP32[$270 >> 2] = $262;
  $R7_1 = $257;
  label = 87;
  break;
 case 79:
  _abort();
 case 80:
  $276 = $1 + ($psize + 20) | 0;
  $277 = HEAP32[$276 >> 2] | 0;
  if (($277 | 0) == 0) {
   label = 81;
   break;
  } else {
   $R7_0 = $277;
   $RP9_0 = $276;
   label = 82;
   break;
  }
 case 81:
  $281 = $1 + ($psize + 16) | 0;
  $282 = HEAP32[$281 >> 2] | 0;
  if (($282 | 0) == 0) {
   $R7_1 = 0;
   label = 87;
   break;
  } else {
   $R7_0 = $282;
   $RP9_0 = $281;
   label = 82;
   break;
  }
 case 82:
  $284 = $R7_0 + 20 | 0;
  $285 = HEAP32[$284 >> 2] | 0;
  if (($285 | 0) == 0) {
   label = 83;
   break;
  } else {
   $R7_0 = $285;
   $RP9_0 = $284;
   label = 82;
   break;
  }
 case 83:
  $288 = $R7_0 + 16 | 0;
  $289 = HEAP32[$288 >> 2] | 0;
  if (($289 | 0) == 0) {
   label = 84;
   break;
  } else {
   $R7_0 = $289;
   $RP9_0 = $288;
   label = 82;
   break;
  }
 case 84:
  if ($RP9_0 >>> 0 < $181 >>> 0) {
   label = 86;
   break;
  } else {
   label = 85;
   break;
  }
 case 85:
  HEAP32[$RP9_0 >> 2] = 0;
  $R7_1 = $R7_0;
  label = 87;
  break;
 case 86:
  _abort();
 case 87:
  if (($254 | 0) == 0) {
   label = 107;
   break;
  } else {
   label = 88;
   break;
  }
 case 88:
  $300 = $1 + ($psize + 28) | 0;
  $302 = 3008 + (HEAP32[$300 >> 2] << 2) | 0;
  if (($251 | 0) == (HEAP32[$302 >> 2] | 0)) {
   label = 89;
   break;
  } else {
   label = 91;
   break;
  }
 case 89:
  HEAP32[$302 >> 2] = $R7_1;
  if (($R7_1 | 0) == 0) {
   label = 90;
   break;
  } else {
   label = 97;
   break;
  }
 case 90:
  HEAP32[677] = HEAP32[677] & ~(1 << HEAP32[$300 >> 2]);
  label = 107;
  break;
 case 91:
  if ($254 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 95;
   break;
  } else {
   label = 92;
   break;
  }
 case 92:
  $316 = $254 + 16 | 0;
  if ((HEAP32[$316 >> 2] | 0) == ($251 | 0)) {
   label = 93;
   break;
  } else {
   label = 94;
   break;
  }
 case 93:
  HEAP32[$316 >> 2] = $R7_1;
  label = 96;
  break;
 case 94:
  HEAP32[$254 + 20 >> 2] = $R7_1;
  label = 96;
  break;
 case 95:
  _abort();
 case 96:
  if (($R7_1 | 0) == 0) {
   label = 107;
   break;
  } else {
   label = 97;
   break;
  }
 case 97:
  if ($R7_1 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 106;
   break;
  } else {
   label = 98;
   break;
  }
 case 98:
  HEAP32[$R7_1 + 24 >> 2] = $254;
  $333 = HEAP32[$1 + ($psize + 16) >> 2] | 0;
  if (($333 | 0) == 0) {
   label = 102;
   break;
  } else {
   label = 99;
   break;
  }
 case 99:
  if ($333 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 101;
   break;
  } else {
   label = 100;
   break;
  }
 case 100:
  HEAP32[$R7_1 + 16 >> 2] = $333;
  HEAP32[$333 + 24 >> 2] = $R7_1;
  label = 102;
  break;
 case 101:
  _abort();
 case 102:
  $346 = HEAP32[$1 + ($psize + 20) >> 2] | 0;
  if (($346 | 0) == 0) {
   label = 107;
   break;
  } else {
   label = 103;
   break;
  }
 case 103:
  if ($346 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 105;
   break;
  } else {
   label = 104;
   break;
  }
 case 104:
  HEAP32[$R7_1 + 20 >> 2] = $346;
  HEAP32[$346 + 24 >> 2] = $R7_1;
  label = 107;
  break;
 case 105:
  _abort();
 case 106:
  _abort();
 case 107:
  HEAP32[$_0 + 4 >> 2] = $213 | 1;
  HEAP32[$_0 + $213 >> 2] = $213;
  if (($_0 | 0) == (HEAP32[681] | 0)) {
   label = 108;
   break;
  } else {
   $_1 = $213;
   label = 110;
   break;
  }
 case 108:
  HEAP32[678] = $213;
  label = 135;
  break;
 case 109:
  HEAP32[$185 >> 2] = $186 & -2;
  HEAP32[$_0 + 4 >> 2] = $_02 | 1;
  HEAP32[$_0 + $_02 >> 2] = $_02;
  $_1 = $_02;
  label = 110;
  break;
 case 110:
  $374 = $_1 >>> 3;
  if ($_1 >>> 0 < 256) {
   label = 111;
   break;
  } else {
   label = 116;
   break;
  }
 case 111:
  $377 = $374 << 1;
  $379 = 2744 + ($377 << 2) | 0;
  $380 = HEAP32[676] | 0;
  $381 = 1 << $374;
  if (($380 & $381 | 0) == 0) {
   label = 112;
   break;
  } else {
   label = 113;
   break;
  }
 case 112:
  HEAP32[676] = $380 | $381;
  $F16_0 = $379;
  $_pre_phi = 2744 + ($377 + 2 << 2) | 0;
  label = 115;
  break;
 case 113:
  $387 = 2744 + ($377 + 2 << 2) | 0;
  $388 = HEAP32[$387 >> 2] | 0;
  if ($388 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 114;
   break;
  } else {
   $F16_0 = $388;
   $_pre_phi = $387;
   label = 115;
   break;
  }
 case 114:
  _abort();
 case 115:
  HEAP32[$_pre_phi >> 2] = $_0;
  HEAP32[$F16_0 + 12 >> 2] = $_0;
  HEAP32[$_0 + 8 >> 2] = $F16_0;
  HEAP32[$_0 + 12 >> 2] = $379;
  label = 135;
  break;
 case 116:
  $398 = $_0;
  $399 = $_1 >>> 8;
  if (($399 | 0) == 0) {
   $I19_0 = 0;
   label = 119;
   break;
  } else {
   label = 117;
   break;
  }
 case 117:
  if ($_1 >>> 0 > 16777215) {
   $I19_0 = 31;
   label = 119;
   break;
  } else {
   label = 118;
   break;
  }
 case 118:
  $406 = ($399 + 1048320 | 0) >>> 16 & 8;
  $407 = $399 << $406;
  $410 = ($407 + 520192 | 0) >>> 16 & 4;
  $412 = $407 << $410;
  $415 = ($412 + 245760 | 0) >>> 16 & 2;
  $420 = 14 - ($410 | $406 | $415) + ($412 << $415 >>> 15) | 0;
  $I19_0 = $_1 >>> (($420 + 7 | 0) >>> 0) & 1 | $420 << 1;
  label = 119;
  break;
 case 119:
  $427 = 3008 + ($I19_0 << 2) | 0;
  HEAP32[$_0 + 28 >> 2] = $I19_0;
  HEAP32[$_0 + 20 >> 2] = 0;
  HEAP32[$_0 + 16 >> 2] = 0;
  $431 = HEAP32[677] | 0;
  $432 = 1 << $I19_0;
  if (($431 & $432 | 0) == 0) {
   label = 120;
   break;
  } else {
   label = 121;
   break;
  }
 case 120:
  HEAP32[677] = $431 | $432;
  HEAP32[$427 >> 2] = $398;
  HEAP32[$_0 + 24 >> 2] = $427;
  HEAP32[$_0 + 12 >> 2] = $_0;
  HEAP32[$_0 + 8 >> 2] = $_0;
  label = 135;
  break;
 case 121:
  $441 = HEAP32[$427 >> 2] | 0;
  if (($I19_0 | 0) == 31) {
   $447 = 0;
   label = 123;
   break;
  } else {
   label = 122;
   break;
  }
 case 122:
  $447 = 25 - ($I19_0 >>> 1) | 0;
  label = 123;
  break;
 case 123:
  if ((HEAP32[$441 + 4 >> 2] & -8 | 0) == ($_1 | 0)) {
   $T_0_lcssa = $441;
   label = 130;
   break;
  } else {
   label = 124;
   break;
  }
 case 124:
  $T_055 = $441;
  $K20_056 = $_1 << $447;
  label = 126;
  break;
 case 125:
  if ((HEAP32[$462 + 4 >> 2] & -8 | 0) == ($_1 | 0)) {
   $T_0_lcssa = $462;
   label = 130;
   break;
  } else {
   $T_055 = $462;
   $K20_056 = $K20_056 << 1;
   label = 126;
   break;
  }
 case 126:
  $461 = $T_055 + 16 + ($K20_056 >>> 31 << 2) | 0;
  $462 = HEAP32[$461 >> 2] | 0;
  if (($462 | 0) == 0) {
   label = 127;
   break;
  } else {
   label = 125;
   break;
  }
 case 127:
  if ($461 >>> 0 < (HEAP32[680] | 0) >>> 0) {
   label = 129;
   break;
  } else {
   label = 128;
   break;
  }
 case 128:
  HEAP32[$461 >> 2] = $398;
  HEAP32[$_0 + 24 >> 2] = $T_055;
  HEAP32[$_0 + 12 >> 2] = $_0;
  HEAP32[$_0 + 8 >> 2] = $_0;
  label = 135;
  break;
 case 129:
  _abort();
 case 130:
  $473 = $T_0_lcssa + 8 | 0;
  $474 = HEAP32[$473 >> 2] | 0;
  $476 = HEAP32[680] | 0;
  if ($T_0_lcssa >>> 0 < $476 >>> 0) {
   label = 133;
   break;
  } else {
   label = 131;
   break;
  }
 case 131:
  if ($474 >>> 0 < $476 >>> 0) {
   label = 133;
   break;
  } else {
   label = 132;
   break;
  }
 case 132:
  HEAP32[$474 + 12 >> 2] = $398;
  HEAP32[$473 >> 2] = $398;
  HEAP32[$_0 + 8 >> 2] = $474;
  HEAP32[$_0 + 12 >> 2] = $T_0_lcssa;
  HEAP32[$_0 + 24 >> 2] = 0;
  label = 135;
  break;
 case 133:
  _abort();
 case 134:
  _abort();
 case 135:
  return;
 }
}
function __Znwj($size) {
 $size = $size | 0;
 var $3 = 0, $6 = 0, $lpad_phi$0 = 0, $lpad_phi$1 = 0, $16 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  label = 2;
  break;
 case 2:
  $3 = _malloc(($size | 0) == 0 ? 1 : $size) | 0;
  if (($3 | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 10;
   break;
  }
 case 3:
  $6 = (tempValue = HEAP32[796] | 0, HEAP32[796] = tempValue + 0, tempValue);
  if (($6 | 0) == 0) {
   label = 9;
   break;
  } else {
   label = 4;
   break;
  }
 case 4:
  FUNCTION_TABLE_v[$6 & 63]();
  label = 2;
  break;
 case 5:
  $lpad_phi$1 = 0;
  $lpad_phi$0 = 0;
  label = 7;
  break;
 case 6:
  $lpad_phi$1 = 0;
  $lpad_phi$0 = 0;
  label = 7;
  break;
 case 7:
  if (($lpad_phi$1 | 0) < 0) {
   label = 8;
   break;
  } else {
   label = 11;
   break;
  }
 case 8:
  ___cxa_call_unexpected($lpad_phi$0 | 0);
  return 0;
 case 9:
  $16 = ___cxa_allocate_exception(4) | 0;
  HEAP32[$16 >> 2] = 2456;
  ___cxa_throw($16 | 0, 2584, 16);
  label = 12;
  break;
 case 10:
  return $3 | 0;
 case 11:
  abort();
 case 12:
  return 0;
 }
 return 0;
}
function __ZNSt9bad_allocD2Ev($this) {
 $this = $this | 0;
 return;
}
function __ZNKSt9bad_alloc4whatEv($this) {
 $this = $this | 0;
 return 672 | 0;
}
function __ZNKSt20bad_array_new_length4whatEv($this) {
 $this = $this | 0;
 return 1016 | 0;
}
function __ZSt15set_new_handlerPFvvE($handler) {
 $handler = $handler | 0;
 return (tempValue = HEAP32[796] | 0, HEAP32[796] = $handler, tempValue) | 0;
}
function __ZNSt9bad_allocC2Ev($this) {
 $this = $this | 0;
 HEAP32[$this >> 2] = 2456;
 return;
}
function __ZNSt20bad_array_new_lengthC2Ev($this) {
 $this = $this | 0;
 HEAP32[$this >> 2] = 2488;
 return;
}
function __ZdlPv($ptr) {
 $ptr = $ptr | 0;
 var label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($ptr | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  _free($ptr);
  label = 3;
  break;
 case 3:
  return;
 }
}
function __ZdlPvRKSt9nothrow_t($ptr, $0) {
 $ptr = $ptr | 0;
 $0 = $0 | 0;
 __ZdlPv($ptr);
 return;
}
function __ZdaPv($ptr) {
 $ptr = $ptr | 0;
 __ZdlPv($ptr);
 return;
}
function __ZdaPvRKSt9nothrow_t($ptr, $0) {
 $ptr = $ptr | 0;
 $0 = $0 | 0;
 __ZdaPv($ptr);
 return;
}
function __ZNSt9bad_allocD0Ev($this) {
 $this = $this | 0;
 __ZdlPv($this);
 return;
}
function __ZNSt20bad_array_new_lengthD0Ev($this) {
 $this = $this | 0;
 __ZdlPv($this);
 return;
}
function _getopt($nargc, $nargv, $options) {
 $nargc = $nargc | 0;
 $nargv = $nargv | 0;
 $options = $options | 0;
 return _getopt_internal($nargc, $nargv, $options, 0, 0, 0) | 0;
}
function _getopt_internal($nargc, $nargv, $options, $long_options, $idx, $flags) {
 $nargc = $nargc | 0;
 $nargv = $nargv | 0;
 $options = $options | 0;
 $long_options = $long_options | 0;
 $idx = $idx | 0;
 $flags = $flags | 0;
 var $3 = 0, $_pre55 = 0, $6 = 0, $10 = 0, $11 = 0, $14 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $_flags = 0, $_064 = 0, $_065 = 0, $_05 = 0, $_pr = 0, $31 = 0, $32 = 0, $33 = 0, $37 = 0, $40 = 0, $42 = 0, $44 = 0, $45 = 0, $46 = 0, $c_02_i_i = 0, $_01_i_i = 0, $48 = 0, $_0_lcssa_i_i = 0, $51 = 0, $56 = 0, $59 = 0, $pos_02_us_i = 0, $j_01_us_i = 0, $pos_1_us_i = 0, $61 = 0, $62 = 0, $63 = 0, $i_03_us_i = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $77 = 0, $78 = 0, $82 = 0, $83 = 0, $98 = 0, $102 = 0, $105 = 0, $106 = 0, $107 = 0, $c_02_i_i8 = 0, $_01_i_i9 = 0, $109 = 0, $_0_lcssa_i_i11 = 0, $112 = 0, $117 = 0, $120 = 0, $pos_02_us_i14 = 0, $j_01_us_i15 = 0, $pos_1_us_i17 = 0, $122 = 0, $123 = 0, $124 = 0, $i_03_us_i18 = 0, $126 = 0, $127 = 0, $_pr_pre_pre = 0, $128 = 0, $129 = 0, $130 = 0, $_pr_pre = 0, $134 = 0, $135 = 0, $136 = 0, $138 = 0, $142 = 0, $143 = 0, $153 = 0, $156 = 0, $157 = 0, $158 = 0, $c_02_i_i22 = 0, $_01_i_i23 = 0, $160 = 0, $_0_lcssa_i_i25 = 0, $163 = 0, $168 = 0, $171 = 0, $pos_02_us_i28 = 0, $j_01_us_i29 = 0, $pos_1_us_i31 = 0, $173 = 0, $174 = 0, $175 = 0, $i_03_us_i32 = 0, $177 = 0, $178 = 0, $179 = 0, $180 = 0, $181 = 0, $186 = 0, $187 = 0, $188 = 0, $194 = 0, $short_too_0 = 0, $205 = 0, $209 = 0, $210 = 0, $211 = 0, $212 = 0, $217 = 0, $236 = 0, $243 = 0, $260 = 0, $278 = 0, $_04 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  if (($options | 0) == 0) {
   $_04 = -1;
   label = 106;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $3 = HEAP32[50] | 0;
  if (($3 | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 4;
   break;
  }
 case 3:
  HEAP32[662] = 1;
  HEAP32[50] = 1;
  $11 = 1;
  $10 = 1;
  label = 5;
  break;
 case 4:
  $_pre55 = HEAP32[662] | 0;
  $6 = HEAP32[80] | 0;
  if (($6 | 0) == -1 | ($_pre55 | 0) != 0) {
   $11 = $_pre55;
   $10 = $3;
   label = 5;
   break;
  } else {
   $18 = $6;
   $17 = $_pre55;
   $16 = $3;
   label = 6;
   break;
  }
 case 5:
  $14 = (_getenv(576) | 0) != 0 | 0;
  HEAP32[80] = $14;
  $18 = $14;
  $17 = $11;
  $16 = $10;
  label = 6;
  break;
 case 6:
  $19 = HEAP8[$options] | 0;
  if ($19 << 24 >> 24 == 45) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  $_064 = $flags | 2;
  label = 9;
  break;
 case 8:
  $_flags = ($18 | 0) != 0 | $19 << 24 >> 24 == 43 ? $flags & -2 : $flags;
  if ($19 << 24 >> 24 == 43) {
   $_064 = $_flags;
   label = 9;
   break;
  } else {
   $_05 = $options;
   $_065 = $_flags;
   label = 10;
   break;
  }
 case 9:
  $_05 = $options + 1 | 0;
  $_065 = $_064;
  label = 10;
  break;
 case 10:
  HEAP32[664] = 0;
  if (($17 | 0) == 0) {
   $32 = $16;
   label = 13;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  HEAP32[56] = -1;
  HEAP32[54] = -1;
  $31 = $16;
  $_pr = $17;
  label = 12;
  break;
 case 12:
  if (($_pr | 0) == 0) {
   $32 = $31;
   label = 13;
   break;
  } else {
   $37 = $31;
   label = 14;
   break;
  }
 case 13:
  $33 = HEAP32[40] | 0;
  if ((HEAP8[$33] | 0) == 0) {
   $37 = $32;
   label = 14;
   break;
  } else {
   $187 = $33;
   $186 = $32;
   label = 63;
   break;
  }
 case 14:
  HEAP32[662] = 0;
  if (($37 | 0) < ($nargc | 0)) {
   label = 28;
   break;
  } else {
   label = 15;
   break;
  }
 case 15:
  HEAP32[40] = 2688;
  $40 = HEAP32[56] | 0;
  $42 = HEAP32[54] | 0;
  if (($40 | 0) == -1) {
   label = 25;
   break;
  } else {
   label = 16;
   break;
  }
 case 16:
  $44 = $40 - $42 | 0;
  $45 = $37 - $40 | 0;
  $46 = ($44 | 0) % ($45 | 0) | 0;
  if (($46 | 0) == 0) {
   $_0_lcssa_i_i = $45;
   label = 18;
   break;
  } else {
   $_01_i_i = $45;
   $c_02_i_i = $46;
   label = 17;
   break;
  }
 case 17:
  $48 = ($_01_i_i | 0) % ($c_02_i_i | 0) | 0;
  if (($48 | 0) == 0) {
   $_0_lcssa_i_i = $c_02_i_i;
   label = 18;
   break;
  } else {
   $_01_i_i = $c_02_i_i;
   $c_02_i_i = $48;
   label = 17;
   break;
  }
 case 18:
  $51 = ($37 - $42 | 0) / ($_0_lcssa_i_i | 0) | 0;
  if (($_0_lcssa_i_i | 0) > 0) {
   label = 19;
   break;
  } else {
   $69 = $40;
   $68 = $42;
   $67 = $37;
   label = 24;
   break;
  }
 case 19:
  if (($51 | 0) > 0) {
   $i_03_us_i = 0;
   label = 22;
   break;
  } else {
   $69 = $40;
   $68 = $42;
   $67 = $37;
   label = 24;
   break;
  }
 case 20:
  $56 = $i_03_us_i + 1 | 0;
  if (($56 | 0) < ($_0_lcssa_i_i | 0)) {
   $i_03_us_i = $56;
   label = 22;
   break;
  } else {
   label = 23;
   break;
  }
 case 21:
  $pos_1_us_i = (($pos_02_us_i | 0) < ($40 | 0) ? $45 : -$44 | 0) + $pos_02_us_i | 0;
  $61 = $nargv + ($pos_1_us_i << 2) | 0;
  $62 = HEAP32[$61 >> 2] | 0;
  HEAP32[$61 >> 2] = $59;
  HEAP32[$66 >> 2] = $62;
  $63 = $j_01_us_i + 1 | 0;
  if (($63 | 0) < ($51 | 0)) {
   $j_01_us_i = $63;
   $pos_02_us_i = $pos_1_us_i;
   $59 = $62;
   label = 21;
   break;
  } else {
   label = 20;
   break;
  }
 case 22:
  $65 = $i_03_us_i + $40 | 0;
  $66 = $nargv + ($65 << 2) | 0;
  $j_01_us_i = 0;
  $pos_02_us_i = $65;
  $59 = HEAP32[$66 >> 2] | 0;
  label = 21;
  break;
 case 23:
  $69 = HEAP32[56] | 0;
  $68 = HEAP32[54] | 0;
  $67 = HEAP32[50] | 0;
  label = 24;
  break;
 case 24:
  HEAP32[50] = $68 - $69 + $67;
  label = 27;
  break;
 case 25:
  if (($42 | 0) == -1) {
   label = 27;
   break;
  } else {
   label = 26;
   break;
  }
 case 26:
  HEAP32[50] = $42;
  label = 27;
  break;
 case 27:
  HEAP32[56] = -1;
  HEAP32[54] = -1;
  $_04 = -1;
  label = 106;
  break;
 case 28:
  $77 = $nargv + ($37 << 2) | 0;
  $78 = HEAP32[$77 >> 2] | 0;
  HEAP32[40] = $78;
  if ((HEAP8[$78] | 0) == 45) {
   label = 29;
   break;
  } else {
   label = 31;
   break;
  }
 case 29:
  $82 = $78 + 1 | 0;
  $83 = HEAP8[$82] | 0;
  if ($83 << 24 >> 24 == 0) {
   label = 30;
   break;
  } else {
   label = 47;
   break;
  }
 case 30:
  if ((_strchr($_05 | 0, 45) | 0) == 0) {
   label = 31;
   break;
  } else {
   label = 47;
   break;
  }
 case 31:
  HEAP32[40] = 2688;
  if (($_065 & 2 | 0) == 0) {
   label = 33;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  HEAP32[50] = $37 + 1;
  HEAP32[664] = HEAP32[$77 >> 2];
  $_04 = 1;
  label = 106;
  break;
 case 33:
  if (($_065 & 1 | 0) == 0) {
   $_04 = -1;
   label = 106;
   break;
  } else {
   label = 34;
   break;
  }
 case 34:
  $98 = HEAP32[54] | 0;
  if (($98 | 0) == -1) {
   label = 35;
   break;
  } else {
   label = 36;
   break;
  }
 case 35:
  HEAP32[54] = $37;
  $134 = $37;
  $_pr_pre = 0;
  label = 46;
  break;
 case 36:
  $102 = HEAP32[56] | 0;
  if (($102 | 0) == -1) {
   $134 = $37;
   $_pr_pre = 0;
   label = 46;
   break;
  } else {
   label = 37;
   break;
  }
 case 37:
  $105 = $102 - $98 | 0;
  $106 = $37 - $102 | 0;
  $107 = ($105 | 0) % ($106 | 0) | 0;
  if (($107 | 0) == 0) {
   $_0_lcssa_i_i11 = $106;
   label = 39;
   break;
  } else {
   $_01_i_i9 = $106;
   $c_02_i_i8 = $107;
   label = 38;
   break;
  }
 case 38:
  $109 = ($_01_i_i9 | 0) % ($c_02_i_i8 | 0) | 0;
  if (($109 | 0) == 0) {
   $_0_lcssa_i_i11 = $c_02_i_i8;
   label = 39;
   break;
  } else {
   $_01_i_i9 = $c_02_i_i8;
   $c_02_i_i8 = $109;
   label = 38;
   break;
  }
 case 39:
  $112 = ($37 - $98 | 0) / ($_0_lcssa_i_i11 | 0) | 0;
  if (($_0_lcssa_i_i11 | 0) > 0) {
   label = 40;
   break;
  } else {
   $130 = $37;
   $129 = $102;
   $128 = $98;
   $_pr_pre_pre = 0;
   label = 45;
   break;
  }
 case 40:
  if (($112 | 0) > 0) {
   $i_03_us_i18 = 0;
   label = 43;
   break;
  } else {
   $130 = $37;
   $129 = $102;
   $128 = $98;
   $_pr_pre_pre = 0;
   label = 45;
   break;
  }
 case 41:
  $117 = $i_03_us_i18 + 1 | 0;
  if (($117 | 0) < ($_0_lcssa_i_i11 | 0)) {
   $i_03_us_i18 = $117;
   label = 43;
   break;
  } else {
   label = 44;
   break;
  }
 case 42:
  $pos_1_us_i17 = (($pos_02_us_i14 | 0) < ($102 | 0) ? $106 : -$105 | 0) + $pos_02_us_i14 | 0;
  $122 = $nargv + ($pos_1_us_i17 << 2) | 0;
  $123 = HEAP32[$122 >> 2] | 0;
  HEAP32[$122 >> 2] = $120;
  HEAP32[$127 >> 2] = $123;
  $124 = $j_01_us_i15 + 1 | 0;
  if (($124 | 0) < ($112 | 0)) {
   $j_01_us_i15 = $124;
   $pos_02_us_i14 = $pos_1_us_i17;
   $120 = $123;
   label = 42;
   break;
  } else {
   label = 41;
   break;
  }
 case 43:
  $126 = $i_03_us_i18 + $102 | 0;
  $127 = $nargv + ($126 << 2) | 0;
  $j_01_us_i15 = 0;
  $pos_02_us_i14 = $126;
  $120 = HEAP32[$127 >> 2] | 0;
  label = 42;
  break;
 case 44:
  $130 = HEAP32[50] | 0;
  $129 = HEAP32[56] | 0;
  $128 = HEAP32[54] | 0;
  $_pr_pre_pre = HEAP32[662] | 0;
  label = 45;
  break;
 case 45:
  HEAP32[54] = $130 - $129 + $128;
  HEAP32[56] = -1;
  $134 = $130;
  $_pr_pre = $_pr_pre_pre;
  label = 46;
  break;
 case 46:
  $135 = $134 + 1 | 0;
  HEAP32[50] = $135;
  $31 = $135;
  $_pr = $_pr_pre;
  label = 12;
  break;
 case 47:
  $136 = HEAP32[54] | 0;
  $138 = HEAP32[56] | 0;
  if (($136 | 0) != -1 & ($138 | 0) == -1) {
   label = 48;
   break;
  } else {
   $143 = $83;
   $142 = $138;
   label = 49;
   break;
  }
 case 48:
  HEAP32[56] = $37;
  $143 = HEAP8[$82] | 0;
  $142 = $37;
  label = 49;
  break;
 case 49:
  if ($143 << 24 >> 24 == 0) {
   $187 = $78;
   $186 = $37;
   label = 63;
   break;
  } else {
   label = 50;
   break;
  }
 case 50:
  HEAP32[40] = $82;
  if ((HEAP8[$82] | 0) == 45) {
   label = 51;
   break;
  } else {
   $187 = $82;
   $186 = $37;
   label = 63;
   break;
  }
 case 51:
  if ((HEAP8[$78 + 2 | 0] | 0) == 0) {
   label = 52;
   break;
  } else {
   $187 = $82;
   $186 = $37;
   label = 63;
   break;
  }
 case 52:
  $153 = $37 + 1 | 0;
  HEAP32[50] = $153;
  HEAP32[40] = 2688;
  if (($142 | 0) == -1) {
   label = 62;
   break;
  } else {
   label = 53;
   break;
  }
 case 53:
  $156 = $142 - $136 | 0;
  $157 = $153 - $142 | 0;
  $158 = ($156 | 0) % ($157 | 0) | 0;
  if (($158 | 0) == 0) {
   $_0_lcssa_i_i25 = $157;
   label = 55;
   break;
  } else {
   $_01_i_i23 = $157;
   $c_02_i_i22 = $158;
   label = 54;
   break;
  }
 case 54:
  $160 = ($_01_i_i23 | 0) % ($c_02_i_i22 | 0) | 0;
  if (($160 | 0) == 0) {
   $_0_lcssa_i_i25 = $c_02_i_i22;
   label = 55;
   break;
  } else {
   $_01_i_i23 = $c_02_i_i22;
   $c_02_i_i22 = $160;
   label = 54;
   break;
  }
 case 55:
  $163 = ($153 - $136 | 0) / ($_0_lcssa_i_i25 | 0) | 0;
  if (($_0_lcssa_i_i25 | 0) > 0) {
   label = 56;
   break;
  } else {
   $181 = $142;
   $180 = $136;
   $179 = $153;
   label = 61;
   break;
  }
 case 56:
  if (($163 | 0) > 0) {
   $i_03_us_i32 = 0;
   label = 59;
   break;
  } else {
   $181 = $142;
   $180 = $136;
   $179 = $153;
   label = 61;
   break;
  }
 case 57:
  $168 = $i_03_us_i32 + 1 | 0;
  if (($168 | 0) < ($_0_lcssa_i_i25 | 0)) {
   $i_03_us_i32 = $168;
   label = 59;
   break;
  } else {
   label = 60;
   break;
  }
 case 58:
  $pos_1_us_i31 = (($pos_02_us_i28 | 0) < ($142 | 0) ? $157 : -$156 | 0) + $pos_02_us_i28 | 0;
  $173 = $nargv + ($pos_1_us_i31 << 2) | 0;
  $174 = HEAP32[$173 >> 2] | 0;
  HEAP32[$173 >> 2] = $171;
  HEAP32[$178 >> 2] = $174;
  $175 = $j_01_us_i29 + 1 | 0;
  if (($175 | 0) < ($163 | 0)) {
   $j_01_us_i29 = $175;
   $pos_02_us_i28 = $pos_1_us_i31;
   $171 = $174;
   label = 58;
   break;
  } else {
   label = 57;
   break;
  }
 case 59:
  $177 = $i_03_us_i32 + $142 | 0;
  $178 = $nargv + ($177 << 2) | 0;
  $j_01_us_i29 = 0;
  $pos_02_us_i28 = $177;
  $171 = HEAP32[$178 >> 2] | 0;
  label = 58;
  break;
 case 60:
  $181 = HEAP32[56] | 0;
  $180 = HEAP32[54] | 0;
  $179 = HEAP32[50] | 0;
  label = 61;
  break;
 case 61:
  HEAP32[50] = $180 - $181 + $179;
  label = 62;
  break;
 case 62:
  HEAP32[56] = -1;
  HEAP32[54] = -1;
  $_04 = -1;
  label = 106;
  break;
 case 63:
  $188 = ($long_options | 0) != 0;
  if ($188) {
   label = 64;
   break;
  } else {
   $209 = $187;
   label = 73;
   break;
  }
 case 64:
  if (($187 | 0) == (HEAP32[$nargv + ($186 << 2) >> 2] | 0)) {
   $209 = $187;
   label = 73;
   break;
  } else {
   label = 65;
   break;
  }
 case 65:
  $194 = HEAP8[$187] | 0;
  if ($194 << 24 >> 24 == 45) {
   label = 68;
   break;
  } else {
   label = 66;
   break;
  }
 case 66:
  if (($_065 & 4 | 0) == 0) {
   $209 = $187;
   label = 73;
   break;
  } else {
   label = 67;
   break;
  }
 case 67:
  if ($194 << 24 >> 24 == 58) {
   $short_too_0 = 0;
   label = 70;
   break;
  } else {
   label = 69;
   break;
  }
 case 68:
  HEAP32[40] = $187 + 1;
  $short_too_0 = 0;
  label = 70;
  break;
 case 69:
  $short_too_0 = (_strchr($_05 | 0, $194 << 24 >> 24 | 0) | 0) != 0 | 0;
  label = 70;
  break;
 case 70:
  $205 = _parse_long_options($nargv, $_05, $long_options, $idx, $short_too_0) | 0;
  if (($205 | 0) == -1) {
   label = 71;
   break;
  } else {
   label = 72;
   break;
  }
 case 71:
  $209 = HEAP32[40] | 0;
  label = 73;
  break;
 case 72:
  HEAP32[40] = 2688;
  $_04 = $205;
  label = 106;
  break;
 case 73:
  $210 = $209 + 1 | 0;
  HEAP32[40] = $210;
  $211 = HEAP8[$209] | 0;
  $212 = $211 << 24 >> 24;
  if (($211 << 24 >> 24 | 0) == 45) {
   label = 74;
   break;
  } else if (($211 << 24 >> 24 | 0) == 58) {
   label = 78;
   break;
  } else {
   label = 75;
   break;
  }
 case 74:
  if ((HEAP8[$210] | 0) == 0) {
   label = 75;
   break;
  } else {
   label = 80;
   break;
  }
 case 75:
  $217 = _strchr($_05 | 0, $212 | 0) | 0;
  if (($217 | 0) == 0) {
   label = 76;
   break;
  } else {
   label = 84;
   break;
  }
 case 76:
  if ($211 << 24 >> 24 == 45) {
   label = 77;
   break;
  } else {
   label = 78;
   break;
  }
 case 77:
  if ((HEAP8[$210] | 0) == 0) {
   $_04 = -1;
   label = 106;
   break;
  } else {
   label = 80;
   break;
  }
 case 78:
  if ((HEAP8[$210] | 0) == 0) {
   label = 79;
   break;
  } else {
   label = 80;
   break;
  }
 case 79:
  HEAP32[50] = (HEAP32[50] | 0) + 1;
  label = 80;
  break;
 case 80:
  if ((HEAP32[52] | 0) == 0) {
   label = 83;
   break;
  } else {
   label = 81;
   break;
  }
 case 81:
  if ((HEAP8[$_05] | 0) == 58) {
   label = 83;
   break;
  } else {
   label = 82;
   break;
  }
 case 82:
  __warnx(296, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $212, tempInt) | 0);
  label = 83;
  break;
 case 83:
  HEAP32[48] = $212;
  $_04 = 63;
  label = 106;
  break;
 case 84:
  $236 = HEAP8[$217 + 1 | 0] | 0;
  if ($188 & $211 << 24 >> 24 == 87 & $236 << 24 >> 24 == 59) {
   label = 85;
   break;
  } else {
   label = 93;
   break;
  }
 case 85:
  if ((HEAP8[$210] | 0) == 0) {
   label = 86;
   break;
  } else {
   label = 92;
   break;
  }
 case 86:
  $243 = (HEAP32[50] | 0) + 1 | 0;
  HEAP32[50] = $243;
  if (($243 | 0) < ($nargc | 0)) {
   label = 91;
   break;
  } else {
   label = 87;
   break;
  }
 case 87:
  HEAP32[40] = 2688;
  if ((HEAP32[52] | 0) == 0) {
   label = 90;
   break;
  } else {
   label = 88;
   break;
  }
 case 88:
  if ((HEAP8[$_05] | 0) == 58) {
   label = 90;
   break;
  } else {
   label = 89;
   break;
  }
 case 89:
  __warnx(48, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $212, tempInt) | 0);
  label = 90;
  break;
 case 90:
  HEAP32[48] = $212;
  $_04 = (HEAP8[$_05] | 0) == 58 ? 58 : 63;
  label = 106;
  break;
 case 91:
  HEAP32[40] = HEAP32[$nargv + ($243 << 2) >> 2];
  label = 92;
  break;
 case 92:
  $260 = _parse_long_options($nargv, $_05, $long_options, $idx, 0) | 0;
  HEAP32[40] = 2688;
  $_04 = $260;
  label = 106;
  break;
 case 93:
  if ($236 << 24 >> 24 == 58) {
   label = 96;
   break;
  } else {
   label = 94;
   break;
  }
 case 94:
  if ((HEAP8[$210] | 0) == 0) {
   label = 95;
   break;
  } else {
   $_04 = $212;
   label = 106;
   break;
  }
 case 95:
  HEAP32[50] = (HEAP32[50] | 0) + 1;
  $_04 = $212;
  label = 106;
  break;
 case 96:
  HEAP32[664] = 0;
  if ((HEAP8[$210] | 0) == 0) {
   label = 98;
   break;
  } else {
   label = 97;
   break;
  }
 case 97:
  HEAP32[664] = $210;
  label = 105;
  break;
 case 98:
  if ((HEAP8[$217 + 2 | 0] | 0) == 58) {
   label = 105;
   break;
  } else {
   label = 99;
   break;
  }
 case 99:
  $278 = (HEAP32[50] | 0) + 1 | 0;
  HEAP32[50] = $278;
  if (($278 | 0) < ($nargc | 0)) {
   label = 104;
   break;
  } else {
   label = 100;
   break;
  }
 case 100:
  HEAP32[40] = 2688;
  if ((HEAP32[52] | 0) == 0) {
   label = 103;
   break;
  } else {
   label = 101;
   break;
  }
 case 101:
  if ((HEAP8[$_05] | 0) == 58) {
   label = 103;
   break;
  } else {
   label = 102;
   break;
  }
 case 102:
  __warnx(48, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $212, tempInt) | 0);
  label = 103;
  break;
 case 103:
  HEAP32[48] = $212;
  $_04 = (HEAP8[$_05] | 0) == 58 ? 58 : 63;
  label = 106;
  break;
 case 104:
  HEAP32[664] = HEAP32[$nargv + ($278 << 2) >> 2];
  label = 105;
  break;
 case 105:
  HEAP32[40] = 2688;
  HEAP32[50] = (HEAP32[50] | 0) + 1;
  $_04 = $212;
  label = 106;
  break;
 case 106:
  STACKTOP = sp;
  return $_04 | 0;
 }
 return 0;
}
function _getopt_long($nargc, $nargv, $options, $long_options, $idx) {
 $nargc = $nargc | 0;
 $nargv = $nargv | 0;
 $options = $options | 0;
 $long_options = $long_options | 0;
 $idx = $idx | 0;
 return _getopt_internal($nargc, $nargv, $options, $long_options, $idx, 1) | 0;
}
function _getopt_long_only($nargc, $nargv, $options, $long_options, $idx) {
 $nargc = $nargc | 0;
 $nargv = $nargv | 0;
 $options = $options | 0;
 $long_options = $long_options | 0;
 $idx = $idx | 0;
 return _getopt_internal($nargc, $nargv, $options, $long_options, $idx, 5) | 0;
}
function __ZnwjRKSt9nothrow_t($size, $0) {
 $size = $size | 0;
 $0 = $0 | 0;
 var $p_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $p_0 = __Znwj($size) | 0;
  label = 3;
  break;
 case 2:
  ___cxa_begin_catch(0) | 0;
  ___cxa_end_catch();
  $p_0 = 0;
  label = 3;
  break;
 case 3:
  return $p_0 | 0;
 case 4:
  ___cxa_call_unexpected(0);
  return 0;
 }
 return 0;
}
function __Znaj($size) {
 $size = $size | 0;
 var label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  label = 2;
  break;
 case 2:
  return __Znwj($size) | 0;
 case 3:
  if (0 < 0) {
   label = 4;
   break;
  } else {
   label = 5;
   break;
  }
 case 4:
  ___cxa_call_unexpected(0);
  return 0;
 case 5:
  abort();
 }
 return 0;
}
function __ZnajRKSt9nothrow_t($size, $0) {
 $size = $size | 0;
 $0 = $0 | 0;
 var $p_0 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $p_0 = __Znaj($size) | 0;
  label = 3;
  break;
 case 2:
  ___cxa_begin_catch(0) | 0;
  ___cxa_end_catch();
  $p_0 = 0;
  label = 3;
  break;
 case 3:
  return $p_0 | 0;
 case 4:
  ___cxa_call_unexpected(0);
  return 0;
 }
 return 0;
}
function __ZSt17__throw_bad_allocv() {
 var $1 = 0;
 $1 = ___cxa_allocate_exception(4) | 0;
 HEAP32[$1 >> 2] = 2456;
 ___cxa_throw($1 | 0, 2584, 16);
}
function _parse_long_options($nargv, $options, $long_options, $idx, $short_too) {
 $nargv = $nargv | 0;
 $options = $options | 0;
 $long_options = $long_options | 0;
 $idx = $idx | 0;
 $short_too = $short_too | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $has_equal_0 = 0, $current_argv_len_0 = 0, $15 = 0, $19 = 0, $i_05_us = 0, $25 = 0, $27 = 0, $29 = 0, $match_06 = 0, $i_05 = 0, $match_1 = 0, $45 = 0, $47 = 0, $match_2 = 0, $51 = 0, $52 = 0, $54 = 0, $storemerge2 = 0, $storemerge = 0, $120 = 0, $123 = 0, $_0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $1 = HEAP32[40] | 0;
  $2 = HEAP32[50] | 0;
  $3 = $2 + 1 | 0;
  HEAP32[50] = $3;
  $4 = _strchr($1 | 0, 61) | 0;
  if (($4 | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  $current_argv_len_0 = $4 - $1 | 0;
  $has_equal_0 = $4 + 1 | 0;
  label = 4;
  break;
 case 3:
  $current_argv_len_0 = _strlen($1 | 0) | 0;
  $has_equal_0 = 0;
  label = 4;
  break;
 case 4:
  $15 = HEAP32[$long_options >> 2] | 0;
  if (($15 | 0) == 0) {
   label = 37;
   break;
  } else {
   label = 5;
   break;
  }
 case 5:
  if (($short_too | 0) != 0 & ($current_argv_len_0 | 0) == 1) {
   $i_05_us = 0;
   $19 = $15;
   label = 6;
   break;
  } else {
   $i_05 = 0;
   $match_06 = -1;
   $29 = $15;
   label = 9;
   break;
  }
 case 6:
  if ((HEAP8[$1] | 0) == (HEAP8[$19] | 0)) {
   label = 7;
   break;
  } else {
   label = 8;
   break;
  }
 case 7:
  if ((_strlen($19 | 0) | 0) == 1) {
   $match_2 = $i_05_us;
   label = 17;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  $25 = $i_05_us + 1 | 0;
  $27 = HEAP32[$long_options + ($25 << 4) >> 2] | 0;
  if (($27 | 0) == 0) {
   label = 37;
   break;
  } else {
   $i_05_us = $25;
   $19 = $27;
   label = 6;
   break;
  }
 case 9:
  if ((_strncmp($1 | 0, $29 | 0, $current_argv_len_0 | 0) | 0) == 0) {
   label = 10;
   break;
  } else {
   $match_1 = $match_06;
   label = 16;
   break;
  }
 case 10:
  if ((_strlen($29 | 0) | 0) == ($current_argv_len_0 | 0)) {
   $match_2 = $i_05;
   label = 17;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  if (($match_06 | 0) == -1) {
   $match_1 = $i_05;
   label = 16;
   break;
  } else {
   label = 12;
   break;
  }
 case 12:
  if ((HEAP32[52] | 0) == 0) {
   label = 15;
   break;
  } else {
   label = 13;
   break;
  }
 case 13:
  if ((HEAP8[$options] | 0) == 58) {
   label = 15;
   break;
  } else {
   label = 14;
   break;
  }
 case 14:
  __warnx(328, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $current_argv_len_0, HEAP32[tempInt + 8 >> 2] = $1, tempInt) | 0);
  label = 15;
  break;
 case 15:
  HEAP32[48] = 0;
  $_0 = 63;
  label = 47;
  break;
 case 16:
  $45 = $i_05 + 1 | 0;
  $47 = HEAP32[$long_options + ($45 << 4) >> 2] | 0;
  if (($47 | 0) == 0) {
   $match_2 = $match_1;
   label = 17;
   break;
  } else {
   $i_05 = $45;
   $match_06 = $match_1;
   $29 = $47;
   label = 9;
   break;
  }
 case 17:
  if (($match_2 | 0) == -1) {
   label = 37;
   break;
  } else {
   label = 18;
   break;
  }
 case 18:
  $51 = $long_options + ($match_2 << 4) + 4 | 0;
  $52 = HEAP32[$51 >> 2] | 0;
  $54 = ($has_equal_0 | 0) == 0;
  if (($52 | 0) != 0 | $54) {
   label = 25;
   break;
  } else {
   label = 19;
   break;
  }
 case 19:
  if ((HEAP32[52] | 0) == 0) {
   label = 22;
   break;
  } else {
   label = 20;
   break;
  }
 case 20:
  if ((HEAP8[$options] | 0) == 58) {
   label = 22;
   break;
  } else {
   label = 21;
   break;
  }
 case 21:
  __warnx(232, (tempInt = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempInt >> 2] = $current_argv_len_0, HEAP32[tempInt + 8 >> 2] = $1, tempInt) | 0);
  label = 22;
  break;
 case 22:
  if ((HEAP32[$long_options + ($match_2 << 4) + 8 >> 2] | 0) == 0) {
   label = 23;
   break;
  } else {
   $storemerge2 = 0;
   label = 24;
   break;
  }
 case 23:
  $storemerge2 = HEAP32[$long_options + ($match_2 << 4) + 12 >> 2] | 0;
  label = 24;
  break;
 case 24:
  HEAP32[48] = $storemerge2;
  $_0 = (HEAP8[$options] | 0) == 58 ? 58 : 63;
  label = 47;
  break;
 case 25:
  if (($52 - 1 | 0) >>> 0 < 2) {
   label = 26;
   break;
  } else {
   label = 30;
   break;
  }
 case 26:
  if ($54) {
   label = 28;
   break;
  } else {
   label = 27;
   break;
  }
 case 27:
  HEAP32[664] = $has_equal_0;
  label = 30;
  break;
 case 28:
  if (($52 | 0) == 1) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  HEAP32[50] = $2 + 2;
  HEAP32[664] = HEAP32[$nargv + ($3 << 2) >> 2];
  label = 30;
  break;
 case 30:
  if ((HEAP32[$51 >> 2] | 0) == 1 & (HEAP32[664] | 0) == 0) {
   label = 31;
   break;
  } else {
   label = 43;
   break;
  }
 case 31:
  if ((HEAP32[52] | 0) == 0) {
   label = 34;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  if ((HEAP8[$options] | 0) == 58) {
   label = 34;
   break;
  } else {
   label = 33;
   break;
  }
 case 33:
  __warnx(8, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $1, tempInt) | 0);
  label = 34;
  break;
 case 34:
  if ((HEAP32[$long_options + ($match_2 << 4) + 8 >> 2] | 0) == 0) {
   label = 35;
   break;
  } else {
   $storemerge = 0;
   label = 36;
   break;
  }
 case 35:
  $storemerge = HEAP32[$long_options + ($match_2 << 4) + 12 >> 2] | 0;
  label = 36;
  break;
 case 36:
  HEAP32[48] = $storemerge;
  HEAP32[50] = (HEAP32[50] | 0) - 1;
  $_0 = (HEAP8[$options] | 0) == 58 ? 58 : 63;
  label = 47;
  break;
 case 37:
  if (($short_too | 0) == 0) {
   label = 39;
   break;
  } else {
   label = 38;
   break;
  }
 case 38:
  HEAP32[50] = $2;
  $_0 = -1;
  label = 47;
  break;
 case 39:
  if ((HEAP32[52] | 0) == 0) {
   label = 42;
   break;
  } else {
   label = 40;
   break;
  }
 case 40:
  if ((HEAP8[$options] | 0) == 58) {
   label = 42;
   break;
  } else {
   label = 41;
   break;
  }
 case 41:
  __warnx(272, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $1, tempInt) | 0);
  label = 42;
  break;
 case 42:
  HEAP32[48] = 0;
  $_0 = 63;
  label = 47;
  break;
 case 43:
  if (($idx | 0) == 0) {
   label = 45;
   break;
  } else {
   label = 44;
   break;
  }
 case 44:
  HEAP32[$idx >> 2] = $match_2;
  label = 45;
  break;
 case 45:
  $120 = HEAP32[$long_options + ($match_2 << 4) + 8 >> 2] | 0;
  $123 = HEAP32[$long_options + ($match_2 << 4) + 12 >> 2] | 0;
  if (($120 | 0) == 0) {
   $_0 = $123;
   label = 47;
   break;
  } else {
   label = 46;
   break;
  }
 case 46:
  HEAP32[$120 >> 2] = $123;
  $_0 = 0;
  label = 47;
  break;
 case 47:
  STACKTOP = sp;
  return $_0 | 0;
 }
 return 0;
}
function __warn($fmt, varrp) {
 $fmt = $fmt | 0;
 varrp = varrp | 0;
 var $ap = 0, $2 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 $ap = sp | 0;
 $2 = $ap;
 HEAP32[$2 >> 2] = varrp;
 HEAP32[$2 + 4 >> 2] = 0;
 __vwarn($fmt, $ap | 0);
 STACKTOP = sp;
 return;
}
function __warnx($fmt, varrp) {
 $fmt = $fmt | 0;
 varrp = varrp | 0;
 var $ap = 0, $2 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 $ap = sp | 0;
 $2 = $ap;
 HEAP32[$2 >> 2] = varrp;
 HEAP32[$2 + 4 >> 2] = 0;
 __vwarnx($fmt, $ap | 0);
 STACKTOP = sp;
 return;
}
function __vwarn($fmt, $ap) {
 $fmt = $fmt | 0;
 $ap = $ap | 0;
 var $2 = 0, $4 = 0, $13 = 0, $14 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = HEAP32[(___errno_location() | 0) >> 2] | 0;
  $4 = HEAP32[___progname >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 800, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $4, tempInt) | 0) | 0;
  if (($fmt | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  _vfprintf(HEAP32[_stderr >> 2] | 0, $fmt | 0, $ap | 0) | 0;
  _fwrite(1256, 2, 1, HEAP32[_stderr >> 2] | 0) | 0;
  label = 3;
  break;
 case 3:
  $13 = HEAP32[_stderr >> 2] | 0;
  $14 = _strerror($2 | 0) | 0;
  _fprintf($13 | 0, 736, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $14, tempInt) | 0) | 0;
  STACKTOP = sp;
  return;
 }
}
function __vwarnx($fmt, $ap) {
 $fmt = $fmt | 0;
 $ap = $ap | 0;
 var $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = HEAP32[___progname >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 696, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $2, tempInt) | 0) | 0;
  if (($fmt | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  _vfprintf(HEAP32[_stderr >> 2] | 0, $fmt | 0, $ap | 0) | 0;
  label = 3;
  break;
 case 3:
  _fputc(10, HEAP32[_stderr >> 2] | 0) | 0;
  STACKTOP = sp;
  return;
 }
}
function _strtod($string, $endPtr) {
 $string = $string | 0;
 $endPtr = $endPtr | 0;
 var $p_0 = 0, $6 = 0, $8 = 0, $sign_0 = 0, $p_2 = 0, $p_3 = 0, $mantSize_0 = 0, $decPt_0 = 0, $13 = 0, $decPt_1 = 0, $23 = 0, $24 = 0, $mantSize_1 = 0, $26 = 0, $fracExp_0 = 0, $mantSize_2 = 0, $p_4_lcssa38 = 0, $mantSize_3_lcssa37 = 0, $frac1_0_lcssa36 = 0.0, $frac1_024 = 0, $mantSize_323 = 0, $p_422 = 0, $31 = 0, $32 = 0, $p_5 = 0, $c_0_in = 0, $40 = 0, $41 = 0, $frac2_017 = 0, $mantSize_416 = 0, $p_615 = 0, $44 = 0, $45 = 0, $p_7 = 0, $c_1_in = 0, $53 = 0, $54 = 0, $frac1_0_lcssa35 = 0.0, $frac2_0_lcssa = 0.0, $57 = 0.0, $59 = 0, $60 = 0, $expSign_0_ph = 0, $p_9_ph = 0, $66 = 0, $67 = 0, $exp_010 = 0, $p_99 = 0, $70 = 0, $71 = 0, $73 = 0, $expSign_1 = 0, $p_10 = 0, $exp_1 = 0, $exp_2 = 0, $exp_3 = 0, $exp_55 = 0, $d_04 = 0, $dblExp_03 = 0.0, $dblExp_1 = 0.0, $87 = 0, $dblExp_0_lcssa = 0.0, $fraction_0 = 0.0, $p_11 = 0, $_0 = 0.0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $p_0 = $string;
  label = 2;
  break;
 case 2:
  $6 = $p_0 + 1 | 0;
  if ((_isspace(HEAP8[$p_0] | 0) | 0) == 0) {
   label = 3;
   break;
  } else {
   $p_0 = $6;
   label = 2;
   break;
  }
 case 3:
  $8 = HEAP8[$p_0] | 0;
  if (($8 << 24 >> 24 | 0) == 45) {
   label = 4;
   break;
  } else if (($8 << 24 >> 24 | 0) == 43) {
   label = 5;
   break;
  } else {
   $p_2 = $p_0;
   $sign_0 = 0;
   label = 6;
   break;
  }
 case 4:
  $p_2 = $6;
  $sign_0 = 1;
  label = 6;
  break;
 case 5:
  $p_2 = $6;
  $sign_0 = 0;
  label = 6;
  break;
 case 6:
  $decPt_0 = -1;
  $mantSize_0 = 0;
  $p_3 = $p_2;
  label = 7;
  break;
 case 7:
  $13 = HEAP8[$p_3] | 0;
  if ((($13 << 24 >> 24) - 48 | 0) >>> 0 < 10) {
   $decPt_1 = $decPt_0;
   label = 9;
   break;
  } else {
   label = 8;
   break;
  }
 case 8:
  if ($13 << 24 >> 24 != 46 | ($decPt_0 | 0) > -1) {
   label = 10;
   break;
  } else {
   $decPt_1 = $mantSize_0;
   label = 9;
   break;
  }
 case 9:
  $decPt_0 = $decPt_1;
  $mantSize_0 = $mantSize_0 + 1 | 0;
  $p_3 = $p_3 + 1 | 0;
  label = 7;
  break;
 case 10:
  $23 = $p_3 + (-$mantSize_0 | 0) | 0;
  $24 = ($decPt_0 | 0) < 0;
  $mantSize_1 = (($24 ^ 1) << 31 >> 31) + $mantSize_0 | 0;
  $26 = ($mantSize_1 | 0) > 18;
  $fracExp_0 = ($26 ? -18 : -$mantSize_1 | 0) + ($24 ? $mantSize_0 : $decPt_0) | 0;
  $mantSize_2 = $26 ? 18 : $mantSize_1;
  if (($mantSize_2 | 0) == 0) {
   $p_11 = $string;
   $fraction_0 = 0.0;
   label = 37;
   break;
  } else {
   label = 11;
   break;
  }
 case 11:
  if (($mantSize_2 | 0) > 9) {
   $p_422 = $23;
   $mantSize_323 = $mantSize_2;
   $frac1_024 = 0;
   label = 15;
   break;
  } else {
   label = 13;
   break;
  }
 case 12:
  $frac1_0_lcssa36 = +($40 | 0) * 1.0e9;
  $mantSize_3_lcssa37 = 9;
  $p_4_lcssa38 = $p_5;
  label = 14;
  break;
 case 13:
  if (($mantSize_2 | 0) > 0) {
   $frac1_0_lcssa36 = 0.0;
   $mantSize_3_lcssa37 = $mantSize_2;
   $p_4_lcssa38 = $23;
   label = 14;
   break;
  } else {
   $frac2_0_lcssa = 0.0;
   $frac1_0_lcssa35 = 0.0;
   label = 22;
   break;
  }
 case 14:
  $p_615 = $p_4_lcssa38;
  $mantSize_416 = $mantSize_3_lcssa37;
  $frac2_017 = 0;
  label = 18;
  break;
 case 15:
  $31 = HEAP8[$p_422] | 0;
  $32 = $p_422 + 1 | 0;
  if ($31 << 24 >> 24 == 46) {
   label = 16;
   break;
  } else {
   $c_0_in = $31;
   $p_5 = $32;
   label = 17;
   break;
  }
 case 16:
  $c_0_in = HEAP8[$32] | 0;
  $p_5 = $p_422 + 2 | 0;
  label = 17;
  break;
 case 17:
  $40 = ($frac1_024 * 10 | 0) - 48 + ($c_0_in << 24 >> 24) | 0;
  $41 = $mantSize_323 - 1 | 0;
  if (($41 | 0) > 9) {
   $p_422 = $p_5;
   $mantSize_323 = $41;
   $frac1_024 = $40;
   label = 15;
   break;
  } else {
   label = 12;
   break;
  }
 case 18:
  $44 = HEAP8[$p_615] | 0;
  $45 = $p_615 + 1 | 0;
  if ($44 << 24 >> 24 == 46) {
   label = 19;
   break;
  } else {
   $c_1_in = $44;
   $p_7 = $45;
   label = 20;
   break;
  }
 case 19:
  $c_1_in = HEAP8[$45] | 0;
  $p_7 = $p_615 + 2 | 0;
  label = 20;
  break;
 case 20:
  $53 = ($frac2_017 * 10 | 0) - 48 + ($c_1_in << 24 >> 24) | 0;
  $54 = $mantSize_416 - 1 | 0;
  if (($54 | 0) > 0) {
   $p_615 = $p_7;
   $mantSize_416 = $54;
   $frac2_017 = $53;
   label = 18;
   break;
  } else {
   label = 21;
   break;
  }
 case 21:
  $frac2_0_lcssa = +($53 | 0);
  $frac1_0_lcssa35 = $frac1_0_lcssa36;
  label = 22;
  break;
 case 22:
  $57 = $frac1_0_lcssa35 + $frac2_0_lcssa;
  if (($13 << 24 >> 24 | 0) == 69 | ($13 << 24 >> 24 | 0) == 101) {
   label = 23;
   break;
  } else {
   $exp_1 = 0;
   $p_10 = $p_3;
   $expSign_1 = 0;
   label = 28;
   break;
  }
 case 23:
  $59 = $p_3 + 1 | 0;
  $60 = HEAP8[$59] | 0;
  if (($60 << 24 >> 24 | 0) == 45) {
   label = 24;
   break;
  } else if (($60 << 24 >> 24 | 0) == 43) {
   label = 25;
   break;
  } else {
   $p_9_ph = $59;
   $expSign_0_ph = 0;
   label = 26;
   break;
  }
 case 24:
  $p_9_ph = $p_3 + 2 | 0;
  $expSign_0_ph = 1;
  label = 26;
  break;
 case 25:
  $p_9_ph = $p_3 + 2 | 0;
  $expSign_0_ph = 0;
  label = 26;
  break;
 case 26:
  $66 = HEAP8[$p_9_ph] | 0;
  if (($66 - 48 | 0) >>> 0 < 10) {
   $p_99 = $p_9_ph;
   $exp_010 = 0;
   $67 = $66;
   label = 27;
   break;
  } else {
   $exp_1 = 0;
   $p_10 = $p_9_ph;
   $expSign_1 = $expSign_0_ph;
   label = 28;
   break;
  }
 case 27:
  $70 = ($exp_010 * 10 | 0) - 48 + $67 | 0;
  $71 = $p_99 + 1 | 0;
  $73 = HEAP8[$71] | 0;
  if (($73 - 48 | 0) >>> 0 < 10) {
   $p_99 = $71;
   $exp_010 = $70;
   $67 = $73;
   label = 27;
   break;
  } else {
   $exp_1 = $70;
   $p_10 = $71;
   $expSign_1 = $expSign_0_ph;
   label = 28;
   break;
  }
 case 28:
  $exp_2 = $fracExp_0 + (($expSign_1 | 0) == 0 ? $exp_1 : -$exp_1 | 0) | 0;
  $exp_3 = ($exp_2 | 0) < 0 ? -$exp_2 | 0 : $exp_2;
  if (($exp_3 | 0) > 511) {
   label = 29;
   break;
  } else {
   label = 30;
   break;
  }
 case 29:
  HEAP32[(___errno_location() | 0) >> 2] = 34;
  $dblExp_03 = 1.0;
  $d_04 = 88;
  $exp_55 = 511;
  label = 31;
  break;
 case 30:
  if (($exp_3 | 0) == 0) {
   $dblExp_0_lcssa = 1.0;
   label = 34;
   break;
  } else {
   $dblExp_03 = 1.0;
   $d_04 = 88;
   $exp_55 = $exp_3;
   label = 31;
   break;
  }
 case 31:
  if (($exp_55 & 1 | 0) == 0) {
   $dblExp_1 = $dblExp_03;
   label = 33;
   break;
  } else {
   label = 32;
   break;
  }
 case 32:
  $dblExp_1 = $dblExp_03 * +HEAPF64[$d_04 >> 3];
  label = 33;
  break;
 case 33:
  $87 = $exp_55 >> 1;
  if (($87 | 0) == 0) {
   $dblExp_0_lcssa = $dblExp_1;
   label = 34;
   break;
  } else {
   $dblExp_03 = $dblExp_1;
   $d_04 = $d_04 + 8 | 0;
   $exp_55 = $87;
   label = 31;
   break;
  }
 case 34:
  if (($exp_2 | 0) > -1) {
   label = 36;
   break;
  } else {
   label = 35;
   break;
  }
 case 35:
  $p_11 = $p_10;
  $fraction_0 = $57 / $dblExp_0_lcssa;
  label = 37;
  break;
 case 36:
  $p_11 = $p_10;
  $fraction_0 = $57 * $dblExp_0_lcssa;
  label = 37;
  break;
 case 37:
  if (($endPtr | 0) == 0) {
   label = 39;
   break;
  } else {
   label = 38;
   break;
  }
 case 38:
  HEAP32[$endPtr >> 2] = $p_11;
  label = 39;
  break;
 case 39:
  if (($sign_0 | 0) == 0) {
   $_0 = $fraction_0;
   label = 41;
   break;
  } else {
   label = 40;
   break;
  }
 case 40:
  $_0 = -0.0 - $fraction_0;
  label = 41;
  break;
 case 41:
  return +$_0;
 }
 return 0.0;
}
function _strtold($nptr, $endptr) {
 $nptr = $nptr | 0;
 $endptr = $endptr | 0;
 return +(+_strtod($nptr, $endptr));
}
function _strtof($nptr, $endptr) {
 $nptr = $nptr | 0;
 $endptr = $endptr | 0;
 return +(+_strtod($nptr, $endptr));
}
function _strtod_l($nptr, $endptr, $loc) {
 $nptr = $nptr | 0;
 $endptr = $endptr | 0;
 $loc = $loc | 0;
 return +(+_strtod($nptr, $endptr));
}
function _strtold_l($nptr, $endptr, $loc) {
 $nptr = $nptr | 0;
 $endptr = $endptr | 0;
 $loc = $loc | 0;
 return +(+_strtod($nptr, $endptr));
}
function _atof($str) {
 $str = $str | 0;
 return +(+_strtod($str, 0));
}
function __err($eval, $fmt, varrp) {
 $eval = $eval | 0;
 $fmt = $fmt | 0;
 varrp = varrp | 0;
 var $ap = 0, $2 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 $ap = sp | 0;
 $2 = $ap;
 HEAP32[$2 >> 2] = varrp;
 HEAP32[$2 + 4 >> 2] = 0;
 __verr($eval, $fmt, $ap | 0);
}
function __errx($eval, $fmt, varrp) {
 $eval = $eval | 0;
 $fmt = $fmt | 0;
 varrp = varrp | 0;
 var $ap = 0, $2 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 $ap = sp | 0;
 $2 = $ap;
 HEAP32[$2 >> 2] = varrp;
 HEAP32[$2 + 4 >> 2] = 0;
 __verrx($eval, $fmt, $ap | 0);
}
function __verr($eval, $fmt, $ap) {
 $eval = $eval | 0;
 $fmt = $fmt | 0;
 $ap = $ap | 0;
 var $2 = 0, $4 = 0, $13 = 0, $14 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = HEAP32[(___errno_location() | 0) >> 2] | 0;
  $4 = HEAP32[___progname >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 360, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $4, tempInt) | 0) | 0;
  if (($fmt | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  _vfprintf(HEAP32[_stderr >> 2] | 0, $fmt | 0, $ap | 0) | 0;
  _fwrite(1264, 2, 1, HEAP32[_stderr >> 2] | 0) | 0;
  label = 3;
  break;
 case 3:
  $13 = HEAP32[_stderr >> 2] | 0;
  $14 = _strerror($2 | 0) | 0;
  _fprintf($13 | 0, 744, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $14, tempInt) | 0) | 0;
  _exit($eval | 0);
 }
}
function __verrx($eval, $fmt, $ap) {
 $eval = $eval | 0;
 $fmt = $fmt | 0;
 $ap = $ap | 0;
 var $2 = 0, label = 0;
 label = 1;
 while (1) switch (label | 0) {
 case 1:
  $2 = HEAP32[___progname >> 2] | 0;
  _fprintf(HEAP32[_stderr >> 2] | 0, 968, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = $2, tempInt) | 0) | 0;
  if (($fmt | 0) == 0) {
   label = 3;
   break;
  } else {
   label = 2;
   break;
  }
 case 2:
  _vfprintf(HEAP32[_stderr >> 2] | 0, $fmt | 0, $ap | 0) | 0;
  label = 3;
  break;
 case 3:
  _fputc(10, HEAP32[_stderr >> 2] | 0) | 0;
  _exit($eval | 0);
 }
}
function _strlen(ptr) {
 ptr = ptr | 0;
 var curr = 0;
 curr = ptr;
 while (HEAP8[curr] | 0) {
  curr = curr + 1 | 0;
 }
 return curr - ptr | 0;
}
function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0;
 ret = dest | 0;
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if ((num | 0) == 0) return ret | 0;
   HEAP8[dest] = HEAP8[src] | 0;
   dest = dest + 1 | 0;
   src = src + 1 | 0;
   num = num - 1 | 0;
  }
  while ((num | 0) >= 4) {
   HEAP32[dest >> 2] = HEAP32[src >> 2];
   dest = dest + 4 | 0;
   src = src + 4 | 0;
   num = num - 4 | 0;
  }
 }
 while ((num | 0) > 0) {
  HEAP8[dest] = HEAP8[src] | 0;
  dest = dest + 1 | 0;
  src = src + 1 | 0;
  num = num - 1 | 0;
 }
 return ret | 0;
}
function _memmove(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 if ((src | 0) < (dest | 0) & (dest | 0) < (src + num | 0)) {
  src = src + num | 0;
  dest = dest + num | 0;
  while ((num | 0) > 0) {
   dest = dest - 1 | 0;
   src = src - 1 | 0;
   num = num - 1 | 0;
   HEAP8[dest] = HEAP8[src] | 0;
  }
 } else {
  _memcpy(dest, src, num) | 0;
 }
}
function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
 stop = ptr + num | 0;
 if ((num | 0) >= 20) {
  value = value & 255;
  unaligned = ptr & 3;
  value4 = value | value << 8 | value << 16 | value << 24;
  stop4 = stop & ~3;
  if (unaligned) {
   unaligned = ptr + 4 - unaligned | 0;
   while ((ptr | 0) < (unaligned | 0)) {
    HEAP8[ptr] = value;
    ptr = ptr + 1 | 0;
   }
  }
  while ((ptr | 0) < (stop4 | 0)) {
   HEAP32[ptr >> 2] = value4;
   ptr = ptr + 4 | 0;
  }
 }
 while ((ptr | 0) < (stop | 0)) {
  HEAP8[ptr] = value;
  ptr = ptr + 1 | 0;
 }
}
function _i64Add(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var l = 0;
 l = a + c >>> 0;
 return (tempRet0 = b + d + (l >>> 0 < a >>> 0 | 0) >>> 0, l | 0) | 0;
}
function _i64Subtract(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var h = 0;
 h = b - d >>> 0;
 h = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
 return (tempRet0 = h, a - c >>> 0 | 0) | 0;
}
function _bitshift64Shl(low, high, bits) {
 low = low | 0;
 high = high | 0;
 bits = bits | 0;
 if ((bits | 0) < 32) {
  tempRet0 = high << bits | (low & (1 << bits) - 1 << 32 - bits) >>> 32 - bits;
  return low << bits;
 }
 tempRet0 = low << bits - 32;
 return 0;
}
function _bitshift64Lshr(low, high, bits) {
 low = low | 0;
 high = high | 0;
 bits = bits | 0;
 if ((bits | 0) < 32) {
  tempRet0 = high >>> bits;
  return low >>> bits | (high & (1 << bits) - 1) << 32 - bits;
 }
 tempRet0 = 0;
 return high >>> bits - 32 | 0;
}
function _bitshift64Ashr(low, high, bits) {
 low = low | 0;
 high = high | 0;
 bits = bits | 0;
 if ((bits | 0) < 32) {
  tempRet0 = high >> bits;
  return low >>> bits | (high & (1 << bits) - 1) << 32 - bits;
 }
 tempRet0 = (high | 0) < 0 ? -1 : 0;
 return high >> bits - 32 | 0;
}
function _llvm_ctlz_i32(x) {
 x = x | 0;
 var ret = 0;
 ret = HEAP8[ctlz_i8 + (x >>> 24) | 0] | 0;
 if ((ret | 0) < 8) return ret | 0;
 ret = HEAP8[ctlz_i8 + (x >> 16 & 255) | 0] | 0;
 if ((ret | 0) < 8) return ret + 8 | 0;
 ret = HEAP8[ctlz_i8 + (x >> 8 & 255) | 0] | 0;
 if ((ret | 0) < 8) return ret + 16 | 0;
 return (HEAP8[ctlz_i8 + (x & 255) | 0] | 0) + 24 | 0;
}
function _llvm_cttz_i32(x) {
 x = x | 0;
 var ret = 0;
 ret = HEAP8[cttz_i8 + (x & 255) | 0] | 0;
 if ((ret | 0) < 8) return ret | 0;
 ret = HEAP8[cttz_i8 + (x >> 8 & 255) | 0] | 0;
 if ((ret | 0) < 8) return ret + 8 | 0;
 ret = HEAP8[cttz_i8 + (x >> 16 & 255) | 0] | 0;
 if ((ret | 0) < 8) return ret + 16 | 0;
 return (HEAP8[cttz_i8 + (x >>> 24) | 0] | 0) + 24 | 0;
}
function ___muldsi3($a, $b) {
 $a = $a | 0;
 $b = $b | 0;
 var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
 $1 = $a & 65535;
 $2 = $b & 65535;
 $3 = Math_imul($2, $1) | 0;
 $6 = $a >>> 16;
 $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
 $11 = $b >>> 16;
 $12 = Math_imul($11, $1) | 0;
 return (tempRet0 = ($8 >>> 16) + (Math_imul($11, $6) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, $8 + $12 << 16 | $3 & 65535 | 0) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $7$0 = 0, $7$1 = 0, $10$0 = 0;
 $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
 $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
 $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
 $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
 $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
 $4$1 = tempRet0;
 $7$0 = $2$0 ^ $1$0;
 $7$1 = $2$1 ^ $1$1;
 $10$0 = _i64Subtract((___udivmoddi4($4$0, $4$1, _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0, tempRet0, 0) | 0) ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
 return (tempRet0 = tempRet0, $10$0) | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
 __stackBase__ = STACKTOP;
 STACKTOP = STACKTOP + 8 | 0;
 $rem = __stackBase__ | 0;
 $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
 $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
 $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
 $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
 $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
 $4$1 = tempRet0;
 $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
 ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
 $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
 $10$1 = tempRet0;
 STACKTOP = __stackBase__;
 return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0;
 $x_sroa_0_0_extract_trunc = $a$0;
 $y_sroa_0_0_extract_trunc = $b$0;
 $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
 $1$1 = tempRet0;
 return (tempRet0 = (Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0) + (Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $1$1 | $1$1 & 0, $1$0 | 0 | 0) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $1$0 = 0;
 $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
 return (tempRet0 = tempRet0, $1$0) | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 var $rem = 0, __stackBase__ = 0;
 __stackBase__ = STACKTOP;
 STACKTOP = STACKTOP + 8 | 0;
 $rem = __stackBase__ | 0;
 ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
 STACKTOP = __stackBase__;
 return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
 $a$0 = $a$0 | 0;
 $a$1 = $a$1 | 0;
 $b$0 = $b$0 | 0;
 $b$1 = $b$1 | 0;
 $rem = $rem | 0;
 var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $_0$0 = 0, $_0$1 = 0;
 $n_sroa_0_0_extract_trunc = $a$0;
 $n_sroa_1_4_extract_shift$0 = $a$1;
 $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
 $d_sroa_0_0_extract_trunc = $b$0;
 $d_sroa_1_4_extract_shift$0 = $b$1;
 $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
 if (($n_sroa_1_4_extract_trunc | 0) == 0) {
  $4 = ($rem | 0) != 0;
  if (($d_sroa_1_4_extract_trunc | 0) == 0) {
   if ($4) {
    HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
    HEAP32[$rem + 4 >> 2] = 0;
   }
   $_0$1 = 0;
   $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  } else {
   if (!$4) {
    $_0$1 = 0;
    $_0$0 = 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   HEAP32[$rem >> 2] = $a$0 | 0;
   HEAP32[$rem + 4 >> 2] = $a$1 & 0;
   $_0$1 = 0;
   $_0$0 = 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  }
 }
 $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
 do {
  if (($d_sroa_0_0_extract_trunc | 0) == 0) {
   if ($17) {
    if (($rem | 0) != 0) {
     HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
     HEAP32[$rem + 4 >> 2] = 0;
    }
    $_0$1 = 0;
    $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   if (($n_sroa_0_0_extract_trunc | 0) == 0) {
    if (($rem | 0) != 0) {
     HEAP32[$rem >> 2] = 0;
     HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
    }
    $_0$1 = 0;
    $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
   if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
    if (($rem | 0) != 0) {
     HEAP32[$rem >> 2] = $a$0 | 0;
     HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
    }
    $_0$1 = 0;
    $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   $51 = (_llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0) - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
   if ($51 >>> 0 <= 30) {
    $57 = $51 + 1 | 0;
    $58 = 31 - $51 | 0;
    $sr_1_ph = $57;
    $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
    $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
    $q_sroa_0_1_ph = 0;
    $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
    break;
   }
   if (($rem | 0) == 0) {
    $_0$1 = 0;
    $_0$0 = 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   HEAP32[$rem >> 2] = $a$0 | 0;
   HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
   $_0$1 = 0;
   $_0$0 = 0;
   return (tempRet0 = $_0$1, $_0$0) | 0;
  } else {
   if (!$17) {
    $119 = (_llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0) - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
    if ($119 >>> 0 <= 31) {
     $125 = $119 + 1 | 0;
     $126 = 31 - $119 | 0;
     $130 = $119 - 31 >> 31;
     $sr_1_ph = $125;
     $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
     $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
     $q_sroa_0_1_ph = 0;
     $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
     break;
    }
    if (($rem | 0) == 0) {
     $_0$1 = 0;
     $_0$0 = 0;
     return (tempRet0 = $_0$1, $_0$0) | 0;
    }
    HEAP32[$rem >> 2] = $a$0 | 0;
    HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
    $_0$1 = 0;
    $_0$0 = 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
   $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
   if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
    $88 = (_llvm_ctlz_i32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
    $89 = 64 - $88 | 0;
    $91 = 32 - $88 | 0;
    $92 = $91 >> 31;
    $95 = $88 - 32 | 0;
    $105 = $95 >> 31;
    $sr_1_ph = $88;
    $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
    $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
    $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
    $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
    break;
   }
   if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
    HEAP32[$rem + 4 >> 2] = 0;
   }
   if (($d_sroa_0_0_extract_trunc | 0) == 1) {
    $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
    $_0$0 = $a$0 | 0 | 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   } else {
    $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
    $_0$1 = $n_sroa_1_4_extract_trunc >>> ($78 >>> 0) | 0;
    $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
    return (tempRet0 = $_0$1, $_0$0) | 0;
   }
  }
 } while (0);
 if (($sr_1_ph | 0) == 0) {
  $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
  $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
  $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
  $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
  $carry_0_lcssa$1 = 0;
  $carry_0_lcssa$0 = 0;
 } else {
  $d_sroa_0_0_insert_insert99$0 = $b$0 | 0 | 0;
  $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
  $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0, $d_sroa_0_0_insert_insert99$1, -1, -1) | 0;
  $137$1 = tempRet0;
  $q_sroa_1_1198 = $q_sroa_1_1_ph;
  $q_sroa_0_1199 = $q_sroa_0_1_ph;
  $r_sroa_1_1200 = $r_sroa_1_1_ph;
  $r_sroa_0_1201 = $r_sroa_0_1_ph;
  $sr_1202 = $sr_1_ph;
  $carry_0203 = 0;
  while (1) {
   $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
   $149 = $carry_0203 | $q_sroa_0_1199 << 1;
   $r_sroa_0_0_insert_insert42$0 = $r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31 | 0;
   $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
   _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
   $150$1 = tempRet0;
   $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
   $152 = $151$0 & 1;
   $r_sroa_0_0_extract_trunc = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
   $r_sroa_1_4_extract_trunc = tempRet0;
   $155 = $sr_1202 - 1 | 0;
   if (($155 | 0) == 0) {
    break;
   } else {
    $q_sroa_1_1198 = $147;
    $q_sroa_0_1199 = $149;
    $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
    $sr_1202 = $155;
    $carry_0203 = $152;
   }
  }
  $q_sroa_1_1_lcssa = $147;
  $q_sroa_0_1_lcssa = $149;
  $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
  $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
  $carry_0_lcssa$1 = 0;
  $carry_0_lcssa$0 = $152;
 }
 $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
 $q_sroa_0_0_insert_ext75$1 = 0;
 if (($rem | 0) != 0) {
  HEAP32[$rem >> 2] = $r_sroa_0_1_lcssa;
  HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa;
 }
 $_0$1 = ($q_sroa_0_0_insert_ext75$0 | 0) >>> 31 | ($q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1) << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
 $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
 return (tempRet0 = $_0$1, $_0$0) | 0;
}
function dynCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 a4 = a4 | 0;
 a5 = a5 | 0;
 a6 = a6 | 0;
 a7 = a7 | 0;
 return FUNCTION_TABLE_iiiiiiii[index & 63](a1 | 0, a2 | 0, a3 | 0, a4 | 0, a5 | 0, a6 | 0, a7 | 0) | 0;
}
function dynCall_vi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 FUNCTION_TABLE_vi[index & 63](a1 | 0);
}
function dynCall_vii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 FUNCTION_TABLE_vii[index & 63](a1 | 0, a2 | 0);
}
function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[index & 63](a1 | 0) | 0;
}
function dynCall_viii(index, a1, a2, a3) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 a3 = a3 | 0;
 FUNCTION_TABLE_viii[index & 63](a1 | 0, a2 | 0, a3 | 0);
}
function dynCall_v(index) {
 index = index | 0;
 FUNCTION_TABLE_v[index & 63]();
}
function dynCall_iii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 return FUNCTION_TABLE_iii[index & 63](a1 | 0, a2 | 0) | 0;
}
function b0(p0, p1, p2, p3, p4, p5, p6) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 p3 = p3 | 0;
 p4 = p4 | 0;
 p5 = p5 | 0;
 p6 = p6 | 0;
 abort(0);
 return 0;
}
function b1(p0) {
 p0 = p0 | 0;
 abort(1);
}
function b2(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(2);
}
function b3(p0) {
 p0 = p0 | 0;
 abort(3);
 return 0;
}
function b4(p0, p1, p2) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 p2 = p2 | 0;
 abort(4);
}
function b5() {
 abort(5);
}
function b6(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(6);
 return 0;
}
// EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_iiiiiiii = [b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0
  ,b0,b0,b0,b0,b0,b0,b0,_pixman_region_intersect_o,b0,b0
  ,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,_pixman_region_union_o,b0,_pixman_region_subtract_o,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0,b0];
  var FUNCTION_TABLE_vi = [b1,b1,__ZNSt20bad_array_new_lengthC2Ev,b1,b1,b1,__ZNSt20bad_array_new_lengthD0Ev,b1,b1,b1,b1
  ,b1,b1,b1,b1,b1,__ZNSt9bad_allocD2Ev,b1,b1,b1,b1,b1,b1,b1,__ZNSt9bad_allocC2Ev,b1,__ZNSt9bad_allocD0Ev,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1,b1];
  var FUNCTION_TABLE_vii = [b2,b2,b2,b2,b2,b2,b2,b2,__warn,b2,b2
  ,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2
  ,b2,__warnx,b2,b2,b2,b2,b2,__vwarn,b2,b2,b2,b2,b2,b2,b2,__vwarnx,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2];
  var FUNCTION_TABLE_ii = [b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3
  ,b3,b3,b3,__ZNKSt9bad_alloc4whatEv,b3,b3,b3,b3,b3,__ZNKSt20bad_array_new_length4whatEv,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3,b3];
  var FUNCTION_TABLE_viii = [b4,b4,b4,b4,__verrx,b4,b4,b4,b4,b4,__verr
  ,b4,__err,b4,b4,b4,b4,b4,b4,b4,b4
  ,b4,b4,b4,b4,b4,b4,b4,b4,b4,__errx,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4,b4];
  var FUNCTION_TABLE_v = [b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5];
  var FUNCTION_TABLE_iii = [b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6,b6];
  return { _strlen: _strlen, _validate: _validate, _pixman_region32_init_rect: _pixman_region32_init_rect, _pixman_rect_alloc: _pixman_rect_alloc, _pixman_region32_contains_point: _pixman_region32_contains_point, _pixman_region32_copy: _pixman_region32_copy, _pvalloc: _pvalloc, __ZNSt9bad_allocC2Ev: __ZNSt9bad_allocC2Ev, _pixman_region32_intersect: _pixman_region32_intersect, __ZNKSt9bad_alloc4whatEv: __ZNKSt9bad_alloc4whatEv, __ZdlPvRKSt9nothrow_t: __ZdlPvRKSt9nothrow_t, _pixman_region32_contains_rectangle: _pixman_region32_contains_rectangle, _strtod_l: _strtod_l, _mallinfo: _mallinfo, _pixman_region32_selfcheck: _pixman_region32_selfcheck, __vwarnx: __vwarnx, _PIXREGION_SZOF: _PIXREGION_SZOF, _pixman_region32_inverse: _pixman_region32_inverse, _malloc_usable_size: _malloc_usable_size, _pixman_region32_init_rects: _pixman_region32_init_rects, __ZdlPv: __ZdlPv, _getopt_long_only: _getopt_long_only, _free: _free, __err: __err, _memalign: _memalign, __warnx: __warnx, _bulk_free: _bulk_free, _independent_calloc: _independent_calloc, _pixman_region32_fini: _pixman_region32_fini, _pixman_region32_clear: _pixman_region32_clear, _pixman_region_subtract_o: _pixman_region_subtract_o, _pixman_region32_n_rects: _pixman_region32_n_rects, _pixman_region32_translate: _pixman_region32_translate, _pixman_region32_subtract: _pixman_region32_subtract, _pixman_region32_init_with_extents: _pixman_region32_init_with_extents, _find_box_for_y: _find_box_for_y, _strtof: _strtof, _strtod: _strtod, __ZSt15get_new_handlerv: __ZSt15get_new_handlerv, _pixman_region32_equal: _pixman_region32_equal, __verr: __verr, _pixman_region32_rectangles: _pixman_region32_rectangles, _parse_long_options: _parse_long_options, __ZNSt9bad_allocD2Ev: __ZNSt9bad_allocD2Ev, _getopt_internal: _getopt_internal, _alloc_data: _alloc_data, _pixman_region32_union: _pixman_region32_union, _quick_sort_rects: _quick_sort_rects, _try_realloc_chunk: _try_realloc_chunk, _pixman_region32_intersect_rect: _pixman_region32_intersect_rect, __ZNSt20bad_array_new_lengthC2Ev: __ZNSt20bad_array_new_lengthC2Ev, __warn: __warn, _pixman_region32_extents: _pixman_region32_extents, __Znwj: __Znwj, __ZSt17__throw_bad_allocv: __ZSt17__throw_bad_allocv, __ZNKSt20bad_array_new_length4whatEv: __ZNKSt20bad_array_new_length4whatEv, _pixman_region32_not_empty: _pixman_region32_not_empty, _sys_trim: _sys_trim, _independent_comalloc: _independent_comalloc, _pixman_region_append_non_o: _pixman_region_append_non_o, __Znaj: __Znaj, __ZnwjRKSt9nothrow_t: __ZnwjRKSt9nothrow_t, _malloc_set_footprint_limit: _malloc_set_footprint_limit, _posix_memalign: _posix_memalign, _strtold_l: _strtold_l, __verrx: __verrx, __errx: __errx, __pixman_log_error: __pixman_log_error, _strtold: _strtold, _ialloc: _ialloc, _memset: _memset, _atof: _atof, _memcpy: _memcpy, _internal_memalign: _internal_memalign, _realloc_in_place: _realloc_in_place, _mallopt: _mallopt, _pixman_region32_print: _pixman_region32_print, _dispose_chunk: _dispose_chunk, _malloc: _malloc, _malloc_max_footprint: _malloc_max_footprint, _getopt: _getopt, _malloc_footprint_limit: _malloc_footprint_limit, _valloc: _valloc, _malloc_footprint: _malloc_footprint, __ZNSt20bad_array_new_lengthD0Ev: __ZNSt20bad_array_new_lengthD0Ev, _pixman_region32_reset: _pixman_region32_reset, _pixman_break: _pixman_break, __ZNSt9bad_allocD0Ev: __ZNSt9bad_allocD0Ev, _pixman_set_extents: _pixman_set_extents, _calloc: _calloc, _pixman_coalesce: _pixman_coalesce, __ZSt15set_new_handlerPFvvE: __ZSt15set_new_handlerPFvvE, _pixman_region32_union_rect: _pixman_region32_union_rect, _malloc_trim: _malloc_trim, __ZdaPv: __ZdaPv, _malloc_stats: _malloc_stats, __vwarn: __vwarn, _pixman_region32_init: _pixman_region32_init, _realloc: _realloc, _pixman_region_intersect_o: _pixman_region_intersect_o, _pixman_region_union_o: _pixman_region_union_o, _pixman_op: _pixman_op, _getopt_long: _getopt_long, _memmove: _memmove, __ZnajRKSt9nothrow_t: __ZnajRKSt9nothrow_t, __ZdaPvRKSt9nothrow_t: __ZdaPvRKSt9nothrow_t, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_iiiiiiii: dynCall_iiiiiiii, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_ii: dynCall_ii, dynCall_viii: dynCall_viii, dynCall_v: dynCall_v, dynCall_iii: dynCall_iii };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiiiiii": invoke_iiiiiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_strncmp": _strncmp, "_llvm_va_end": _llvm_va_end, "_sysconf": _sysconf, "___cxa_throw": ___cxa_throw, "_strerror": _strerror, "_abort": _abort, "_fprintf": _fprintf, "_llvm_eh_exception": _llvm_eh_exception, "___cxa_free_exception": ___cxa_free_exception, "___buildEnvironment": ___buildEnvironment, "__reallyNegative": __reallyNegative, "_strchr": _strchr, "_fputc": _fputc, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "_exit": _exit, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___cxa_allocate_exception": ___cxa_allocate_exception, "_isspace": _isspace, "___cxa_is_number_type": ___cxa_is_number_type, "___resumeException": ___resumeException, "__formatString": __formatString, "___cxa_does_inherit": ___cxa_does_inherit, "_getenv": _getenv, "_vfprintf": _vfprintf, "___cxa_begin_catch": ___cxa_begin_catch, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_pwrite": _pwrite, "___cxa_call_unexpected": ___cxa_call_unexpected, "_sbrk": _sbrk, "_strerror_r": _strerror_r, "___errno_location": ___errno_location, "___gxx_personality_v0": ___gxx_personality_v0, "_time": _time, "__exit": __exit, "___cxa_end_catch": ___cxa_end_catch, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "___progname": ___progname }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _validate = Module["_validate"] = asm["_validate"];
var _pixman_region32_init_rect = Module["_pixman_region32_init_rect"] = asm["_pixman_region32_init_rect"];
var _pixman_rect_alloc = Module["_pixman_rect_alloc"] = asm["_pixman_rect_alloc"];
var _pixman_region32_contains_point = Module["_pixman_region32_contains_point"] = asm["_pixman_region32_contains_point"];
var _pixman_region32_copy = Module["_pixman_region32_copy"] = asm["_pixman_region32_copy"];
var _pvalloc = Module["_pvalloc"] = asm["_pvalloc"];
var __ZNSt9bad_allocC2Ev = Module["__ZNSt9bad_allocC2Ev"] = asm["__ZNSt9bad_allocC2Ev"];
var _pixman_region32_intersect = Module["_pixman_region32_intersect"] = asm["_pixman_region32_intersect"];
var __ZNKSt9bad_alloc4whatEv = Module["__ZNKSt9bad_alloc4whatEv"] = asm["__ZNKSt9bad_alloc4whatEv"];
var __ZdlPvRKSt9nothrow_t = Module["__ZdlPvRKSt9nothrow_t"] = asm["__ZdlPvRKSt9nothrow_t"];
var _pixman_region32_contains_rectangle = Module["_pixman_region32_contains_rectangle"] = asm["_pixman_region32_contains_rectangle"];
var _strtod_l = Module["_strtod_l"] = asm["_strtod_l"];
var _mallinfo = Module["_mallinfo"] = asm["_mallinfo"];
var _pixman_region32_selfcheck = Module["_pixman_region32_selfcheck"] = asm["_pixman_region32_selfcheck"];
var __vwarnx = Module["__vwarnx"] = asm["__vwarnx"];
var _PIXREGION_SZOF = Module["_PIXREGION_SZOF"] = asm["_PIXREGION_SZOF"];
var _pixman_region32_inverse = Module["_pixman_region32_inverse"] = asm["_pixman_region32_inverse"];
var _malloc_usable_size = Module["_malloc_usable_size"] = asm["_malloc_usable_size"];
var _pixman_region32_init_rects = Module["_pixman_region32_init_rects"] = asm["_pixman_region32_init_rects"];
var __ZdlPv = Module["__ZdlPv"] = asm["__ZdlPv"];
var _getopt_long_only = Module["_getopt_long_only"] = asm["_getopt_long_only"];
var _free = Module["_free"] = asm["_free"];
var __err = Module["__err"] = asm["__err"];
var _memalign = Module["_memalign"] = asm["_memalign"];
var __warnx = Module["__warnx"] = asm["__warnx"];
var _bulk_free = Module["_bulk_free"] = asm["_bulk_free"];
var _independent_calloc = Module["_independent_calloc"] = asm["_independent_calloc"];
var _pixman_region32_fini = Module["_pixman_region32_fini"] = asm["_pixman_region32_fini"];
var _pixman_region32_clear = Module["_pixman_region32_clear"] = asm["_pixman_region32_clear"];
var _pixman_region_subtract_o = Module["_pixman_region_subtract_o"] = asm["_pixman_region_subtract_o"];
var _pixman_region32_n_rects = Module["_pixman_region32_n_rects"] = asm["_pixman_region32_n_rects"];
var _pixman_region32_translate = Module["_pixman_region32_translate"] = asm["_pixman_region32_translate"];
var _pixman_region32_subtract = Module["_pixman_region32_subtract"] = asm["_pixman_region32_subtract"];
var _pixman_region32_init_with_extents = Module["_pixman_region32_init_with_extents"] = asm["_pixman_region32_init_with_extents"];
var _find_box_for_y = Module["_find_box_for_y"] = asm["_find_box_for_y"];
var _strtof = Module["_strtof"] = asm["_strtof"];
var _strtod = Module["_strtod"] = asm["_strtod"];
var __ZSt15get_new_handlerv = Module["__ZSt15get_new_handlerv"] = asm["__ZSt15get_new_handlerv"];
var _pixman_region32_equal = Module["_pixman_region32_equal"] = asm["_pixman_region32_equal"];
var __verr = Module["__verr"] = asm["__verr"];
var _pixman_region32_rectangles = Module["_pixman_region32_rectangles"] = asm["_pixman_region32_rectangles"];
var _parse_long_options = Module["_parse_long_options"] = asm["_parse_long_options"];
var __ZNSt9bad_allocD2Ev = Module["__ZNSt9bad_allocD2Ev"] = asm["__ZNSt9bad_allocD2Ev"];
var _getopt_internal = Module["_getopt_internal"] = asm["_getopt_internal"];
var _alloc_data = Module["_alloc_data"] = asm["_alloc_data"];
var _pixman_region32_union = Module["_pixman_region32_union"] = asm["_pixman_region32_union"];
var _quick_sort_rects = Module["_quick_sort_rects"] = asm["_quick_sort_rects"];
var _try_realloc_chunk = Module["_try_realloc_chunk"] = asm["_try_realloc_chunk"];
var _pixman_region32_intersect_rect = Module["_pixman_region32_intersect_rect"] = asm["_pixman_region32_intersect_rect"];
var __ZNSt20bad_array_new_lengthC2Ev = Module["__ZNSt20bad_array_new_lengthC2Ev"] = asm["__ZNSt20bad_array_new_lengthC2Ev"];
var __warn = Module["__warn"] = asm["__warn"];
var _pixman_region32_extents = Module["_pixman_region32_extents"] = asm["_pixman_region32_extents"];
var __Znwj = Module["__Znwj"] = asm["__Znwj"];
var __ZSt17__throw_bad_allocv = Module["__ZSt17__throw_bad_allocv"] = asm["__ZSt17__throw_bad_allocv"];
var __ZNKSt20bad_array_new_length4whatEv = Module["__ZNKSt20bad_array_new_length4whatEv"] = asm["__ZNKSt20bad_array_new_length4whatEv"];
var _pixman_region32_not_empty = Module["_pixman_region32_not_empty"] = asm["_pixman_region32_not_empty"];
var _sys_trim = Module["_sys_trim"] = asm["_sys_trim"];
var _independent_comalloc = Module["_independent_comalloc"] = asm["_independent_comalloc"];
var _pixman_region_append_non_o = Module["_pixman_region_append_non_o"] = asm["_pixman_region_append_non_o"];
var __Znaj = Module["__Znaj"] = asm["__Znaj"];
var __ZnwjRKSt9nothrow_t = Module["__ZnwjRKSt9nothrow_t"] = asm["__ZnwjRKSt9nothrow_t"];
var _malloc_set_footprint_limit = Module["_malloc_set_footprint_limit"] = asm["_malloc_set_footprint_limit"];
var _posix_memalign = Module["_posix_memalign"] = asm["_posix_memalign"];
var _strtold_l = Module["_strtold_l"] = asm["_strtold_l"];
var __verrx = Module["__verrx"] = asm["__verrx"];
var __errx = Module["__errx"] = asm["__errx"];
var __pixman_log_error = Module["__pixman_log_error"] = asm["__pixman_log_error"];
var _strtold = Module["_strtold"] = asm["_strtold"];
var _ialloc = Module["_ialloc"] = asm["_ialloc"];
var _memset = Module["_memset"] = asm["_memset"];
var _atof = Module["_atof"] = asm["_atof"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _internal_memalign = Module["_internal_memalign"] = asm["_internal_memalign"];
var _realloc_in_place = Module["_realloc_in_place"] = asm["_realloc_in_place"];
var _mallopt = Module["_mallopt"] = asm["_mallopt"];
var _pixman_region32_print = Module["_pixman_region32_print"] = asm["_pixman_region32_print"];
var _dispose_chunk = Module["_dispose_chunk"] = asm["_dispose_chunk"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _malloc_max_footprint = Module["_malloc_max_footprint"] = asm["_malloc_max_footprint"];
var _getopt = Module["_getopt"] = asm["_getopt"];
var _malloc_footprint_limit = Module["_malloc_footprint_limit"] = asm["_malloc_footprint_limit"];
var _valloc = Module["_valloc"] = asm["_valloc"];
var _malloc_footprint = Module["_malloc_footprint"] = asm["_malloc_footprint"];
var __ZNSt20bad_array_new_lengthD0Ev = Module["__ZNSt20bad_array_new_lengthD0Ev"] = asm["__ZNSt20bad_array_new_lengthD0Ev"];
var _pixman_region32_reset = Module["_pixman_region32_reset"] = asm["_pixman_region32_reset"];
var _pixman_break = Module["_pixman_break"] = asm["_pixman_break"];
var __ZNSt9bad_allocD0Ev = Module["__ZNSt9bad_allocD0Ev"] = asm["__ZNSt9bad_allocD0Ev"];
var _pixman_set_extents = Module["_pixman_set_extents"] = asm["_pixman_set_extents"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _pixman_coalesce = Module["_pixman_coalesce"] = asm["_pixman_coalesce"];
var __ZSt15set_new_handlerPFvvE = Module["__ZSt15set_new_handlerPFvvE"] = asm["__ZSt15set_new_handlerPFvvE"];
var _pixman_region32_union_rect = Module["_pixman_region32_union_rect"] = asm["_pixman_region32_union_rect"];
var _malloc_trim = Module["_malloc_trim"] = asm["_malloc_trim"];
var __ZdaPv = Module["__ZdaPv"] = asm["__ZdaPv"];
var _malloc_stats = Module["_malloc_stats"] = asm["_malloc_stats"];
var __vwarn = Module["__vwarn"] = asm["__vwarn"];
var _pixman_region32_init = Module["_pixman_region32_init"] = asm["_pixman_region32_init"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _pixman_region_intersect_o = Module["_pixman_region_intersect_o"] = asm["_pixman_region_intersect_o"];
var _pixman_region_union_o = Module["_pixman_region_union_o"] = asm["_pixman_region_union_o"];
var _pixman_op = Module["_pixman_op"] = asm["_pixman_op"];
var _getopt_long = Module["_getopt_long"] = asm["_getopt_long"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __ZnajRKSt9nothrow_t = Module["__ZnajRKSt9nothrow_t"] = asm["__ZnajRKSt9nothrow_t"];
var __ZdaPvRKSt9nothrow_t = Module["__ZdaPvRKSt9nothrow_t"] = asm["__ZdaPvRKSt9nothrow_t"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = asm["dynCall_iiiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
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
Runtime.typeInfo = {"[0 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"[13 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":13,"flatFactor":1},"%\"class.std::exception\"":{"alignSize":4,"flatIndexes":[0],"fields":["i32 (...)**"],"flatSize":4,"flatFactor":4,"packed":false},"void (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x i16]":{"alignSize":2,"flatIndexes":[0,2],"fields":["i16","i16"],"flatSize":4,"flatFactor":2},"[72 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":72,"flatFactor":1},"[122 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":122,"flatFactor":1},"[15 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":15,"flatFactor":1},"[0 x void ()*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["void ()*","void ()*"],"flatSize":8,"flatFactor":4},"%struct.malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"%struct.malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"[123 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":123,"flatFactor":1},"%struct.pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[26 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":26,"flatFactor":1},"%struct.pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"%struct.anon":{"alignSize":8,"flatIndexes":[0,4,8,36,72,80,88,104,112,120,128,136,160,164,172,180,188,196,204],"fields":["i32","i8*","[26 x i8]","%struct.__tm","i32","i64","%struct._rand48","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","[8 x i8]","[24 x i8]","i32","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","i32"],"flatSize":208,"packed":false},"[41 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":41,"flatFactor":1},"[119 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":119,"flatFactor":1},"[2 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"%\"struct.std::nothrow_t\"":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1,"packed":false},"{ i8*,i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["i8*","i8*","i8*"],"flatSize":12,"flatFactor":4,"packed":false},"[103 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":103,"flatFactor":1},"%union.anon.0":{"alignSize":8,"flatIndexes":[0,208],"fields":["%struct.anon","[32 x i8]"],"flatSize":240,"flatFactor":208,"packed":false},"i32 (%struct.pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[73 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":73,"flatFactor":1},"%struct._atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"[70 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":70,"flatFactor":1},"%struct.malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"%struct.malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"[0 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4},"[32 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":32,"flatFactor":1},"[0 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"%struct.pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[96 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":96,"flatFactor":1},"[37 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":37,"flatFactor":1},"[33 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":33,"flatFactor":1},"i8* (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"[1 x i32]":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"i8* (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[22 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":22,"flatFactor":1},"%\"class.std::bad_array_new_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"[9 x double]":{"alignSize":8,"flatIndexes":[0,8,16,24,32,40,48,56,64],"fields":["double","double","double","double","double","double","double","double","double"],"flatSize":72,"flatFactor":8},"%struct.option":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","i32*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[58 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":58,"flatFactor":1},"[65 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":65,"flatFactor":1},"[54 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":54,"flatFactor":1},"[3 x i16]":{"alignSize":2,"flatIndexes":[0,2,4],"fields":["i16","i16","i16"],"flatSize":6,"flatFactor":2},"%struct._glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"[34 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":34,"flatFactor":1},"%struct.malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[2 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct._rand48":{"alignSize":2,"flatIndexes":[0,6,12],"fields":["[3 x i16]","[3 x i16]","i16"],"flatSize":14,"flatFactor":6,"packed":false},"[38 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":38,"flatFactor":1},"[3 x i8]":{"alignSize":1,"flatIndexes":[0,1,2],"fields":["i8","i8","i8"],"flatSize":3,"flatFactor":1},"[21 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":21,"flatFactor":1},"[24 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":24,"flatFactor":1},"{ i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4,"packed":false},"%struct.__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[5 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16],"fields":["i8*","i8*","i8*","i8*","i8*"],"flatSize":20,"flatFactor":4},"[40 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":40,"flatFactor":1},"[0 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[1 x i8]":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1},"%struct._on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"void (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[5 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4],"fields":["i8","i8","i8","i8","i8"],"flatSize":5,"flatFactor":1},"[32 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[113 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":113,"flatFactor":1},"%struct._mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"[0 x double]":{"alignSize":8,"flatIndexes":[0,8],"fields":["double","double"],"flatSize":16,"flatFactor":8},"%struct.__tm":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":36,"flatFactor":4,"packed":false},"[86 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":86,"flatFactor":1},"[16 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":16,"flatFactor":1},"%\"class.std::bad_alloc\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::exception\""],"flatSize":4,"flatFactor":4,"packed":false},"%struct.__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[39 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":39,"flatFactor":1},"[8 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7],"fields":["i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":8,"flatFactor":1},"[32 x void ()*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*"],"flatSize":128,"flatFactor":4},"%union.anon":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4,"packed":false},"[25 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":25,"flatFactor":1},"[32 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":128,"flatFactor":4},"[47 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":47,"flatFactor":1},"[3 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"[0 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4},"void ()":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"%struct._reent":{"alignSize":8,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1064,"packed":false},"%struct.region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"[14 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":14,"flatFactor":1},"[4 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3],"fields":["i8","i8","i8","i8"],"flatSize":4,"flatFactor":1},"[18 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":18,"flatFactor":1},"[0 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"anon":{"alignSize":8,"flatIndexes":[0,4,8,36,72,80,88,104,112,120,128,136,160,164,172,180,188,196,204],"fields":["i32","i8*","[26 x i8]","%struct.__tm","i32","i64","%struct._rand48","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","[8 x i8]","[24 x i8]","i32","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","%struct._mbstate_t","i32"],"flatSize":208,"packed":false},"[2 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"i32 (pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"_atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[0 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"option":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","i32*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"_glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"_rand48":{"alignSize":2,"flatIndexes":[0,6,12],"fields":["[3 x i16]","[3 x i16]","i16"],"flatSize":14,"flatFactor":6,"packed":false},"__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[0 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"[32 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"_mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"__tm":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":36,"flatFactor":4,"packed":false},"__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[3 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"_Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"_reent":{"alignSize":8,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1064,"packed":false},"region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false}}
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
