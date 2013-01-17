// Note: Some Emscripten settings will significantly limit the speed of the generated code.
// Note: Some Emscripten settings may limit the speed of the generated code.
// TODO: " u s e   s t r i c t ";

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
    assert(ret);
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
      assert(args.length == sig.length-1);
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      assert(sig.length == 1);
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    assert(sig);
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
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2);assert(STACKTOP|0 < STACK_MAX|0); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
  }
};





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
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
    assert(type, 'Must know what type to store in allocate!');

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
  assert(i < TOTAL_MEMORY);
    t = HEAPU8[((ptr)+(i))];
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
function copyTempFloat(ptr) { // functions, because inlining this code is increases code size too much
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

  // Print summary of correction activity
  CorrectionsMonitor.print();
}

function String_len(ptr) {
  var i = ptr;
  while (HEAP8[(i++)]) { // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  assert(i < TOTAL_MEMORY);
  }
  return i - ptr - 1;
}
Module['String_len'] = String_len;

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
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
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
    HEAP8[((buffer)+(i))]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer)+(i))]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
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

STATICTOP += 848;

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
allocate([5242888], ["%struct.pixman_region32_data*",0,0,0], ALLOC_NONE, 5242880);
allocate([5242896], ["%struct.pixman_box32*",0,0,0], ALLOC_NONE, 5242884);
allocate(8, "i8", ALLOC_NONE, 5242888);
allocate(16, "i8", ALLOC_NONE, 5242896);
allocate(8, "i8", ALLOC_NONE, 5242912);
allocate([5242912], ["%struct.pixman_region32_data*",0,0,0], ALLOC_NONE, 5242920);
allocate(24, "i8", ALLOC_NONE, 5242924);
allocate([109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0] /* max system bytes = % */, "i8", ALLOC_NONE, 5242948);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5242976);
allocate([10,0] /* \0A\00 */, "i8", ALLOC_NONE, 5242992);
allocate([105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* in use bytes     = % */, "i8", ALLOC_NONE, 5242996);
allocate([37,100,32,37,100,32,37,100,32,37,100,32,10,0] /* %d %d %d %d \0A\00 */, "i8", ALLOC_NONE, 5243024);
allocate([115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0] /* system bytes     = % */, "i8", ALLOC_NONE, 5243040);
allocate([98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* bad_array_new_length */, "i8", ALLOC_NONE, 5243068);
allocate([101,120,116,101,110,116,115,58,32,37,100,32,37,100,32,37,100,32,37,100,10,0] /* extents: %d %d %d %d */, "i8", ALLOC_NONE, 5243092);
allocate([110,117,109,58,32,37,100,32,115,105,122,101,58,32,37,100,10,0] /* num: %d size: %d\0A\ */, "i8", ALLOC_NONE, 5243116);
allocate(468, "i8", ALLOC_NONE, 5243136);
allocate([0, 0, 0, 0, 5243696, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243604);
allocate(1, "i8", ALLOC_NONE, 5243624);
allocate([0, 0, 0, 0, 5243708, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243628);
allocate(1, "i8", ALLOC_NONE, 5243648);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5243652);
allocate([83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0] /* St20bad_array_new_le */, "i8", ALLOC_NONE, 5243668);
allocate(12, "i8", ALLOC_NONE, 5243696);
allocate([0, 0, 0, 0, 0, 0, 0, 0, 5243696, 0, 0, 0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5243708);
allocate(1, "i8", ALLOC_NONE, 5243720);
allocate(4, "i8", ALLOC_NONE, 5243724);
HEAP32[((5243612)>>2)]=(6);
HEAP32[((5243616)>>2)]=(16);
HEAP32[((5243620)>>2)]=(8);
HEAP32[((5243636)>>2)]=(20);
HEAP32[((5243640)>>2)]=(4);
HEAP32[((5243644)>>2)]=(12);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([2,0,0,0], ["i8*",0,0,0], ALLOC_STATIC);
HEAP32[((5243696)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5243700)>>2)]=((5243652)|0);
HEAP32[((5243704)>>2)]=__ZTISt9exception;
HEAP32[((5243708)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5243712)>>2)]=((5243668)|0);
__ZNSt9bad_allocC1Ev = 14;
__ZNSt9bad_allocD1Ev = 18;
__ZNSt20bad_array_new_lengthC1Ev = 2;
__ZNSt20bad_array_new_lengthD1Ev = 26;
__ZNSt20bad_array_new_lengthD2Ev = (18);

  
  
  
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
  
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],checkStreams:function () {
        for (var i in FS.streams) if (FS.streams.hasOwnProperty(i)) assert(i >= 0 && i < FS.streams.length); // no keys not in dense span
        for (var i = 0; i < FS.streams.length; i++) assert(typeof FS.streams[i] == 'object'); // no non-null holes in dense span
      },ignorePermissions:true,joinPath:function (parts, forceRelative) {
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
        FS.checkStreams();
        assert(FS.streams.length < 1024); // at this early stage, we should not have a large set of file descriptors - just a few
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
          contents[offset + i] = HEAPU8[((buf)+(i))];
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
                stream.object.output(HEAP8[((buf)+(i))]);
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
  
  function __formatString(format, varargs) {
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
        next = HEAP8[(textIndex+1)];
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
            next = HEAP8[(textIndex+1)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[(textIndex+1)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[(textIndex+1)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[(textIndex+1)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[(textIndex+1)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[(textIndex+1)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[(textIndex+2)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[(textIndex+2)];
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
          next = HEAP8[(textIndex+1)];
  
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
            var argLength = String_len(arg);
            if (precisionSet) argLength = Math.min(argLength, precision);
            if (!flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            for (var i = 0; i < argLength; i++) {
              ret.push(HEAPU8[(arg++)]);
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

  var _llvm_memcpy_p0i8_p0i8_i32;

  
  function _memmove(dest, src, num, align) {
      if (src < dest && dest < src + num) {
        // Copy backwards in a safe manner
        src += num;
        dest += num;
        while (num--) {
          dest--;
          src--;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num);
      }
    }var _llvm_memmove_p0i8_p0i8_i32;
var _llvm_expect_i32; // stub for _llvm_expect_i32

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  
  function _memset(ptr, value, num, align) {
      // TODO: make these settings, and in memcpy, {{'s
      if (num >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        var stop = ptr + num;
        while (ptr % 4) { // no need to check for stop, since we have large num
          HEAP8[ptr++] = value;
        }
        if (value < 0) value += 256; // make it unsigned
        var ptr4 = ptr >> 2, stop4 = stop >> 2, value4 = value | (value << 8) | (value << 16) | (value << 24);
        while (ptr4 < stop4) {
          HEAP32[ptr4++] = value4;
        }
        ptr = ptr4 << 2;
        while (ptr < stop) {
          HEAP8[ptr++] = value;
        }
      } else {
        while (num--) {
          HEAP8[ptr++] = value;
        }
      }
    }var _llvm_memset_p0i8_i32;

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
    }var ___errno;

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
      throw ptr;;
    }

  function ___cxa_call_unexpected(exception) {
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
          return name.substr(-4) in { '.jpg': 1, '.png': 1, '.bmp': 1 };
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
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
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
          return name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
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
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
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
        try {
          var ctx = canvas.getContext(useWebGL ? 'experimental-webgl' : '2d');
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
      },requestFullScreen:function () {
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
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  

var FUNCTION_TABLE = [0,0,__ZNSt20bad_array_new_lengthC2Ev,0,__ZNSt20bad_array_new_lengthD0Ev,0,__ZNSt9bad_allocD2Ev,0,__ZNKSt9bad_alloc4whatEv,0,_pixman_region_intersect_o,0,__ZNKSt20bad_array_new_length4whatEv,0,__ZNSt9bad_allocC2Ev,0,__ZNSt9bad_allocD0Ev,0,__ZNSt9bad_allocD2Ev,0,__ZNSt9bad_allocD2Ev,0,_pixman_region_union_o,0,_pixman_region_subtract_o,0,__ZNSt9bad_allocD2Ev,0];

function _pixman_region32_equal($reg1, $reg2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $i;
      var $rects1;
      var $rects2;
      $2=$reg1;
      $3=$reg2;
      var $4=$2;
      var $5=(($4)|0);
      var $6=(($5)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$3;
      var $9=(($8)|0);
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($7)|0)!=(($11)|0);
      if ($12) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $1=0;
      label = 40; break;
    case 4: 
      var $15=$2;
      var $16=(($15)|0);
      var $17=(($16+8)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=$3;
      var $20=(($19)|0);
      var $21=(($20+8)|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=(($18)|0)!=(($22)|0);
      if ($23) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $1=0;
      label = 40; break;
    case 6: 
      var $26=$2;
      var $27=(($26)|0);
      var $28=(($27+4)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$3;
      var $31=(($30)|0);
      var $32=(($31+4)|0);
      var $33=HEAP32[(($32)>>2)];
      var $34=(($29)|0)!=(($33)|0);
      if ($34) { label = 7; break; } else { label = 8; break; }
    case 7: 
      $1=0;
      label = 40; break;
    case 8: 
      var $37=$2;
      var $38=(($37)|0);
      var $39=(($38+12)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=$3;
      var $42=(($41)|0);
      var $43=(($42+12)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=(($40)|0)!=(($44)|0);
      if ($45) { label = 9; break; } else { label = 10; break; }
    case 9: 
      $1=0;
      label = 40; break;
    case 10: 
      var $48=$2;
      var $49=(($48+16)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=(($50)|0)!=0;
      if ($51) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $53=$2;
      var $54=(($53+16)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=(($55+4)|0);
      var $57=HEAP32[(($56)>>2)];
      var $60 = $57;label = 13; break;
    case 12: 
      var $60 = 1;label = 13; break;
    case 13: 
      var $60;
      var $61=$3;
      var $62=(($61+16)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=(($63)|0)!=0;
      if ($64) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $66=$3;
      var $67=(($66+16)|0);
      var $68=HEAP32[(($67)>>2)];
      var $69=(($68+4)|0);
      var $70=HEAP32[(($69)>>2)];
      var $73 = $70;label = 16; break;
    case 15: 
      var $73 = 1;label = 16; break;
    case 16: 
      var $73;
      var $74=(($60)|0)!=(($73)|0);
      if ($74) { label = 17; break; } else { label = 18; break; }
    case 17: 
      $1=0;
      label = 40; break;
    case 18: 
      var $77=$2;
      var $78=(($77+16)|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=(($79)|0)!=0;
      if ($80) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $82=$2;
      var $83=(($82+16)|0);
      var $84=HEAP32[(($83)>>2)];
      var $85=(($84+8)|0);
      var $86=$85;
      var $91 = $86;label = 21; break;
    case 20: 
      var $88=$2;
      var $89=(($88)|0);
      var $91 = $89;label = 21; break;
    case 21: 
      var $91;
      $rects1=$91;
      var $92=$3;
      var $93=(($92+16)|0);
      var $94=HEAP32[(($93)>>2)];
      var $95=(($94)|0)!=0;
      if ($95) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $97=$3;
      var $98=(($97+16)|0);
      var $99=HEAP32[(($98)>>2)];
      var $100=(($99+8)|0);
      var $101=$100;
      var $106 = $101;label = 24; break;
    case 23: 
      var $103=$3;
      var $104=(($103)|0);
      var $106 = $104;label = 24; break;
    case 24: 
      var $106;
      $rects2=$106;
      $i=0;
      label = 25; break;
    case 25: 
      var $108=$i;
      var $109=$2;
      var $110=(($109+16)|0);
      var $111=HEAP32[(($110)>>2)];
      var $112=(($111)|0)!=0;
      if ($112) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $114=$2;
      var $115=(($114+16)|0);
      var $116=HEAP32[(($115)>>2)];
      var $117=(($116+4)|0);
      var $118=HEAP32[(($117)>>2)];
      var $121 = $118;label = 28; break;
    case 27: 
      var $121 = 1;label = 28; break;
    case 28: 
      var $121;
      var $122=(($108)|0)!=(($121)|0);
      if ($122) { label = 29; break; } else { label = 39; break; }
    case 29: 
      var $124=$i;
      var $125=$rects1;
      var $126=(($125+($124<<4))|0);
      var $127=(($126)|0);
      var $128=HEAP32[(($127)>>2)];
      var $129=$i;
      var $130=$rects2;
      var $131=(($130+($129<<4))|0);
      var $132=(($131)|0);
      var $133=HEAP32[(($132)>>2)];
      var $134=(($128)|0)!=(($133)|0);
      if ($134) { label = 30; break; } else { label = 31; break; }
    case 30: 
      $1=0;
      label = 40; break;
    case 31: 
      var $137=$i;
      var $138=$rects1;
      var $139=(($138+($137<<4))|0);
      var $140=(($139+8)|0);
      var $141=HEAP32[(($140)>>2)];
      var $142=$i;
      var $143=$rects2;
      var $144=(($143+($142<<4))|0);
      var $145=(($144+8)|0);
      var $146=HEAP32[(($145)>>2)];
      var $147=(($141)|0)!=(($146)|0);
      if ($147) { label = 32; break; } else { label = 33; break; }
    case 32: 
      $1=0;
      label = 40; break;
    case 33: 
      var $150=$i;
      var $151=$rects1;
      var $152=(($151+($150<<4))|0);
      var $153=(($152+4)|0);
      var $154=HEAP32[(($153)>>2)];
      var $155=$i;
      var $156=$rects2;
      var $157=(($156+($155<<4))|0);
      var $158=(($157+4)|0);
      var $159=HEAP32[(($158)>>2)];
      var $160=(($154)|0)!=(($159)|0);
      if ($160) { label = 34; break; } else { label = 35; break; }
    case 34: 
      $1=0;
      label = 40; break;
    case 35: 
      var $163=$i;
      var $164=$rects1;
      var $165=(($164+($163<<4))|0);
      var $166=(($165+12)|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=$i;
      var $169=$rects2;
      var $170=(($169+($168<<4))|0);
      var $171=(($170+12)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=(($167)|0)!=(($172)|0);
      if ($173) { label = 36; break; } else { label = 37; break; }
    case 36: 
      $1=0;
      label = 40; break;
    case 37: 
      label = 38; break;
    case 38: 
      var $177=$i;
      var $178=((($177)+(1))|0);
      $i=$178;
      label = 25; break;
    case 39: 
      $1=1;
      label = 40; break;
    case 40: 
      var $181=$1;

      return $181;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_equal["X"]=1;

function _pixman_region32_n_rects($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $14 = $11;label = 5; break;
    case 4: 
      var $14 = 1;label = 5; break;
    case 5: 
      var $14;

      return $14;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_rectangles($region, $n_rects) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      $1=$region;
      $2=$n_rects;
      var $3=$2;
      var $4=(($3)|0)!=0;
      if ($4) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $6=$1;
      var $7=(($6+16)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(($8)|0)!=0;
      if ($9) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $11=$1;
      var $12=(($11+16)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $18 = $15;label = 6; break;
    case 5: 
      var $18 = 1;label = 6; break;
    case 6: 
      var $18;
      var $19=$2;
      HEAP32[(($19)>>2)]=$18;
      label = 7; break;
    case 7: 
      var $21=$1;
      var $22=(($21+16)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=(($23)|0)!=0;
      if ($24) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $26=$1;
      var $27=(($26+16)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=(($28+8)|0);
      var $30=$29;
      var $35 = $30;label = 10; break;
    case 9: 
      var $32=$1;
      var $33=(($32)|0);
      var $35 = $33;label = 10; break;
    case 10: 
      var $35;

      return $35;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_print($rgn) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $num;
      var $size;
      var $i;
      var $rects;
      $1=$rgn;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $14 = $11;label = 5; break;
    case 4: 
      var $14 = 1;label = 5; break;
    case 5: 
      var $14;
      $num=$14;
      var $15=$1;
      var $16=(($15+16)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($17)|0)!=0;
      if ($18) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $20=$1;
      var $21=(($20+16)|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=(($22)|0);
      var $24=HEAP32[(($23)>>2)];
      var $27 = $24;label = 8; break;
    case 7: 
      var $27 = 0;label = 8; break;
    case 8: 
      var $27;
      $size=$27;
      var $28=$1;
      var $29=(($28+16)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=(($30)|0)!=0;
      if ($31) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $33=$1;
      var $34=(($33+16)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=(($35+8)|0);
      var $37=$36;
      var $42 = $37;label = 11; break;
    case 10: 
      var $39=$1;
      var $40=(($39)|0);
      var $42 = $40;label = 11; break;
    case 11: 
      var $42;
      $rects=$42;
      var $43=HEAP32[((_stderr)>>2)];
      var $44=$num;
      var $45=$size;
      var $46=_fprintf($43, ((5243116)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 8)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$44,HEAP32[(((tempInt)+(4))>>2)]=$45,tempInt));
      var $47=HEAP32[((_stderr)>>2)];
      var $48=$1;
      var $49=(($48)|0);
      var $50=(($49)|0);
      var $51=HEAP32[(($50)>>2)];
      var $52=$1;
      var $53=(($52)|0);
      var $54=(($53+4)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=$1;
      var $57=(($56)|0);
      var $58=(($57+8)|0);
      var $59=HEAP32[(($58)>>2)];
      var $60=$1;
      var $61=(($60)|0);
      var $62=(($61+12)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=_fprintf($47, ((5243092)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$51,HEAP32[(((tempInt)+(4))>>2)]=$55,HEAP32[(((tempInt)+(8))>>2)]=$59,HEAP32[(((tempInt)+(12))>>2)]=$63,tempInt));
      $i=0;
      label = 12; break;
    case 12: 
      var $66=$i;
      var $67=$num;
      var $68=(($66)|0) < (($67)|0);
      if ($68) { label = 13; break; } else { label = 15; break; }
    case 13: 
      var $70=HEAP32[((_stderr)>>2)];
      var $71=$i;
      var $72=$rects;
      var $73=(($72+($71<<4))|0);
      var $74=(($73)|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=$i;
      var $77=$rects;
      var $78=(($77+($76<<4))|0);
      var $79=(($78+4)|0);
      var $80=HEAP32[(($79)>>2)];
      var $81=$i;
      var $82=$rects;
      var $83=(($82+($81<<4))|0);
      var $84=(($83+8)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=$i;
      var $87=$rects;
      var $88=(($87+($86<<4))|0);
      var $89=(($88+12)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=_fprintf($70, ((5243024)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 16)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$75,HEAP32[(((tempInt)+(4))>>2)]=$80,HEAP32[(((tempInt)+(8))>>2)]=$85,HEAP32[(((tempInt)+(12))>>2)]=$90,tempInt));
      label = 14; break;
    case 14: 
      var $93=$i;
      var $94=((($93)+(1))|0);
      $i=$94;
      label = 12; break;
    case 15: 
      var $96=HEAP32[((_stderr)>>2)];
      var $97=_fprintf($96, ((5242992)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = ((((STACKTOP)+3)>>2)<<2),assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=0,tempInt));
      var $98=$num;
      STACKTOP = __stackBase__;
      return $98;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_print["X"]=1;

function _pixman_region32_init($region) {
  var label = 0;


  var $1;
  $1=$region;
  var $2=$1;
  var $3=(($2)|0);
  var $4=HEAP32[((5242884)>>2)];
  var $5=$3;
  var $6=$4;
  assert(16 % 1 === 0);HEAP32[(($5)>>2)]=HEAP32[(($6)>>2)];HEAP32[((($5)+(4))>>2)]=HEAP32[((($6)+(4))>>2)];HEAP32[((($5)+(8))>>2)]=HEAP32[((($6)+(8))>>2)];HEAP32[((($5)+(12))>>2)]=HEAP32[((($6)+(12))>>2)];
  var $7=HEAP32[((5242880)>>2)];
  var $8=$1;
  var $9=(($8+16)|0);
  HEAP32[(($9)>>2)]=$7;

  return;
}


function _pixman_region32_init_rect($region, $x, $y, $width, $height) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      $1=$region;
      $2=$x;
      $3=$y;
      $4=$width;
      $5=$height;
      var $6=$2;
      var $7=$1;
      var $8=(($7)|0);
      var $9=(($8)|0);
      HEAP32[(($9)>>2)]=$6;
      var $10=$3;
      var $11=$1;
      var $12=(($11)|0);
      var $13=(($12+4)|0);
      HEAP32[(($13)>>2)]=$10;
      var $14=$2;
      var $15=$4;
      var $16=((($14)+($15))|0);
      var $17=$1;
      var $18=(($17)|0);
      var $19=(($18+8)|0);
      HEAP32[(($19)>>2)]=$16;
      var $20=$3;
      var $21=$5;
      var $22=((($20)+($21))|0);
      var $23=$1;
      var $24=(($23)|0);
      var $25=(($24+12)|0);
      HEAP32[(($25)>>2)]=$22;
      var $26=$1;
      var $27=(($26)|0);
      var $28=(($27)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$1;
      var $31=(($30)|0);
      var $32=(($31+8)|0);
      var $33=HEAP32[(($32)>>2)];
      var $34=(($29)|0) < (($33)|0);
      if ($34) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $36=$1;
      var $37=(($36)|0);
      var $38=(($37+4)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$1;
      var $41=(($40)|0);
      var $42=(($41+12)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=(($39)|0) < (($43)|0);
      if ($44) { label = 10; break; } else { label = 4; break; }
    case 4: 
      var $46=$1;
      var $47=(($46)|0);
      var $48=(($47)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$1;
      var $51=(($50)|0);
      var $52=(($51+8)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=(($49)|0) > (($53)|0);
      if ($54) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $56=$1;
      var $57=(($56)|0);
      var $58=(($57+4)|0);
      var $59=HEAP32[(($58)>>2)];
      var $60=$1;
      var $61=(($60)|0);
      var $62=(($61+12)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=(($59)|0) > (($63)|0);
      if ($64) { label = 6; break; } else { label = 9; break; }
    case 6: 
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $69=$1;
      _pixman_region32_init($69);
      label = 11; break;
    case 10: 
      var $71=$1;
      var $72=(($71+16)|0);
      HEAP32[(($72)>>2)]=0;
      label = 11; break;
    case 11: 

      return;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_init_rect["X"]=1;

function _pixman_region32_init_with_extents($region, $extents) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      $1=$region;
      $2=$extents;
      var $3=$2;
      var $4=(($3)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=$2;
      var $7=(($6+8)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(($5)|0) < (($8)|0);
      if ($9) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $11=$2;
      var $12=(($11+4)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=$2;
      var $15=(($14+12)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=(($13)|0) < (($16)|0);
      if ($17) { label = 10; break; } else { label = 4; break; }
    case 4: 
      var $19=$2;
      var $20=(($19)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$2;
      var $23=(($22+8)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($21)|0) > (($24)|0);
      if ($25) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $27=$2;
      var $28=(($27+4)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$2;
      var $31=(($30+12)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($29)|0) > (($32)|0);
      if ($33) { label = 6; break; } else { label = 9; break; }
    case 6: 
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $38=$1;
      _pixman_region32_init($38);
      label = 11; break;
    case 10: 
      var $40=$1;
      var $41=(($40)|0);
      var $42=$2;
      var $43=$41;
      var $44=$42;
      assert(16 % 1 === 0);HEAP32[(($43)>>2)]=HEAP32[(($44)>>2)];HEAP32[((($43)+(4))>>2)]=HEAP32[((($44)+(4))>>2)];HEAP32[((($43)+(8))>>2)]=HEAP32[((($44)+(8))>>2)];HEAP32[((($43)+(12))>>2)]=HEAP32[((($44)+(12))>>2)];
      var $45=$1;
      var $46=(($45+16)|0);
      HEAP32[(($46)>>2)]=0;
      label = 11; break;
    case 11: 

      return;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_init_with_extents["X"]=1;

function _pixman_region32_fini($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|0)!=0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$1;
      var $15=(($14+16)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$16;
      _free($17);
      label = 5; break;
    case 5: 

      return;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_copy($dst, $src) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      $2=$dst;
      $3=$src;
      var $4=$2;
      var $5=$3;
      var $6=(($4)|0)==(($5)|0);
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $1=1;
      label = 19; break;
    case 4: 
      var $9=$2;
      var $10=(($9)|0);
      var $11=$3;
      var $12=(($11)|0);
      var $13=$10;
      var $14=$12;
      assert(16 % 1 === 0);HEAP32[(($13)>>2)]=HEAP32[(($14)>>2)];HEAP32[((($13)+(4))>>2)]=HEAP32[((($14)+(4))>>2)];HEAP32[((($13)+(8))>>2)]=HEAP32[((($14)+(8))>>2)];HEAP32[((($13)+(12))>>2)]=HEAP32[((($14)+(12))>>2)];
      var $15=$3;
      var $16=(($15+16)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($17)|0)!=0;
      if ($18) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $20=$3;
      var $21=(($20+16)|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=(($22)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($24)|0)!=0;
      if ($25) { label = 10; break; } else { label = 6; break; }
    case 6: 
      var $27=$2;
      var $28=(($27+16)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=(($29)|0)!=0;
      if ($30) { label = 7; break; } else { label = 9; break; }
    case 7: 
      var $32=$2;
      var $33=(($32+16)|0);
      var $34=HEAP32[(($33)>>2)];
      var $35=(($34)|0);
      var $36=HEAP32[(($35)>>2)];
      var $37=(($36)|0)!=0;
      if ($37) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $39=$2;
      var $40=(($39+16)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=$41;
      _free($42);
      label = 9; break;
    case 9: 
      var $44=$3;
      var $45=(($44+16)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=$2;
      var $48=(($47+16)|0);
      HEAP32[(($48)>>2)]=$46;
      $1=1;
      label = 19; break;
    case 10: 
      var $50=$2;
      var $51=(($50+16)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=(($52)|0)!=0;
      if ($53) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $55=$2;
      var $56=(($55+16)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=(($57)|0);
      var $59=HEAP32[(($58)>>2)];
      var $60=$3;
      var $61=(($60+16)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=(($62+4)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=(($59)|0) < (($64)|0);
      if ($65) { label = 12; break; } else { label = 18; break; }
    case 12: 
      var $67=$2;
      var $68=(($67+16)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=(($69)|0)!=0;
      if ($70) { label = 13; break; } else { label = 15; break; }
    case 13: 
      var $72=$2;
      var $73=(($72+16)|0);
      var $74=HEAP32[(($73)>>2)];
      var $75=(($74)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=(($76)|0)!=0;
      if ($77) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $79=$2;
      var $80=(($79+16)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=$81;
      _free($82);
      label = 15; break;
    case 15: 
      var $84=$3;
      var $85=(($84+16)|0);
      var $86=HEAP32[(($85)>>2)];
      var $87=(($86+4)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=_alloc_data($88);
      var $90=$2;
      var $91=(($90+16)|0);
      HEAP32[(($91)>>2)]=$89;
      var $92=$2;
      var $93=(($92+16)|0);
      var $94=HEAP32[(($93)>>2)];
      var $95=(($94)|0)!=0;
      if ($95) { label = 17; break; } else { label = 16; break; }
    case 16: 
      var $97=$2;
      var $98=_pixman_break($97);
      $1=$98;
      label = 19; break;
    case 17: 
      var $100=$3;
      var $101=(($100+16)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=(($102+4)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=$2;
      var $106=(($105+16)|0);
      var $107=HEAP32[(($106)>>2)];
      var $108=(($107)|0);
      HEAP32[(($108)>>2)]=$104;
      label = 18; break;
    case 18: 
      var $110=$3;
      var $111=(($110+16)|0);
      var $112=HEAP32[(($111)>>2)];
      var $113=(($112+4)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$2;
      var $116=(($115+16)|0);
      var $117=HEAP32[(($116)>>2)];
      var $118=(($117+4)|0);
      HEAP32[(($118)>>2)]=$114;
      var $119=$2;
      var $120=(($119+16)|0);
      var $121=HEAP32[(($120)>>2)];
      var $122=(($121+8)|0);
      var $123=$122;
      var $124=$123;
      var $125=$3;
      var $126=(($125+16)|0);
      var $127=HEAP32[(($126)>>2)];
      var $128=(($127+8)|0);
      var $129=$128;
      var $130=$129;
      var $131=$2;
      var $132=(($131+16)|0);
      var $133=HEAP32[(($132)>>2)];
      var $134=(($133+4)|0);
      var $135=HEAP32[(($134)>>2)];
      var $136=((($135<<4))|0);
      _memmove($124, $130, $136, 1, 0);
      $1=1;
      label = 19; break;
    case 19: 
      var $138=$1;

      return $138;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_copy["X"]=1;

function _alloc_data($n) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $sz;
      $2=$n;
      var $3=$2;
      var $4=_PIXREGION_SZOF($3);
      $sz=$4;
      var $5=$sz;
      var $6=(($5)|0)!=0;
      if ($6) { label = 4; break; } else { label = 3; break; }
    case 3: 
      $1=0;
      label = 5; break;
    case 4: 
      var $9=$sz;
      var $10=_malloc($9);
      var $11=$10;
      $1=$11;
      label = 5; break;
    case 5: 
      var $13=$1;

      return $13;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_break($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|0)!=0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$1;
      var $15=(($14+16)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$16;
      _free($17);
      label = 5; break;
    case 5: 
      var $19=$1;
      var $20=(($19)|0);
      var $21=HEAP32[((5242884)>>2)];
      var $22=$20;
      var $23=$21;
      assert(16 % 1 === 0);HEAP32[(($22)>>2)]=HEAP32[(($23)>>2)];HEAP32[((($22)+(4))>>2)]=HEAP32[((($23)+(4))>>2)];HEAP32[((($22)+(8))>>2)]=HEAP32[((($23)+(8))>>2)];HEAP32[((($22)+(12))>>2)]=HEAP32[((($23)+(12))>>2)];
      var $24=HEAP32[((5242920)>>2)];
      var $25=$1;
      var $26=(($25+16)|0);
      HEAP32[(($26)>>2)]=$24;

      return 0;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_intersect($new_reg, $reg1, $reg2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$new_reg;
      $3=$reg1;
      $4=$reg2;
      var $5=$3;
      var $6=(($5+16)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|0)!=0;
      if ($8) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $10=$3;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=(($14)|0)!=0;
      if ($15) { label = 4; break; } else { label = 10; break; }
    case 4: 
      var $17=$4;
      var $18=(($17+16)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=(($19)|0)!=0;
      if ($20) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $22=$4;
      var $23=(($22+16)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($26)|0)!=0;
      if ($27) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $29=$3;
      var $30=(($29)|0);
      var $31=(($30+8)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$4;
      var $34=(($33)|0);
      var $35=(($34)|0);
      var $36=HEAP32[(($35)>>2)];
      var $37=(($32)|0) <= (($36)|0);
      if ($37) { label = 10; break; } else { label = 7; break; }
    case 7: 
      var $39=$3;
      var $40=(($39)|0);
      var $41=(($40)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$4;
      var $44=(($43)|0);
      var $45=(($44+8)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=(($42)|0) >= (($46)|0);
      if ($47) { label = 10; break; } else { label = 8; break; }
    case 8: 
      var $49=$3;
      var $50=(($49)|0);
      var $51=(($50+12)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=$4;
      var $54=(($53)|0);
      var $55=(($54+4)|0);
      var $56=HEAP32[(($55)>>2)];
      var $57=(($52)|0) <= (($56)|0);
      if ($57) { label = 10; break; } else { label = 9; break; }
    case 9: 
      var $59=$3;
      var $60=(($59)|0);
      var $61=(($60+4)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=$4;
      var $64=(($63)|0);
      var $65=(($64+12)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($62)|0) >= (($66)|0);
      if ($67) { label = 10; break; } else { label = 18; break; }
    case 10: 
      var $69=$2;
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=(($71)|0)!=0;
      if ($72) { label = 11; break; } else { label = 13; break; }
    case 11: 
      var $74=$2;
      var $75=(($74+16)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=(($76)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=(($78)|0)!=0;
      if ($79) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $81=$2;
      var $82=(($81+16)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=$83;
      _free($84);
      label = 13; break;
    case 13: 
      var $86=$2;
      var $87=(($86)|0);
      var $88=(($87)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=$2;
      var $91=(($90)|0);
      var $92=(($91+8)|0);
      HEAP32[(($92)>>2)]=$89;
      var $93=$2;
      var $94=(($93)|0);
      var $95=(($94+4)|0);
      var $96=HEAP32[(($95)>>2)];
      var $97=$2;
      var $98=(($97)|0);
      var $99=(($98+12)|0);
      HEAP32[(($99)>>2)]=$96;
      var $100=$3;
      var $101=(($100+16)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=HEAP32[((5242920)>>2)];
      var $104=(($102)|0)==(($103)|0);
      if ($104) { label = 15; break; } else { label = 14; break; }
    case 14: 
      var $106=$4;
      var $107=(($106+16)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=HEAP32[((5242920)>>2)];
      var $110=(($108)|0)==(($109)|0);
      if ($110) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $112=HEAP32[((5242920)>>2)];
      var $113=$2;
      var $114=(($113+16)|0);
      HEAP32[(($114)>>2)]=$112;
      $1=0;
      label = 58; break;
    case 16: 
      var $116=HEAP32[((5242880)>>2)];
      var $117=$2;
      var $118=(($117+16)|0);
      HEAP32[(($118)>>2)]=$116;
      label = 17; break;
    case 17: 
      label = 57; break;
    case 18: 
      var $121=$3;
      var $122=(($121+16)|0);
      var $123=HEAP32[(($122)>>2)];
      var $124=(($123)|0)!=0;
      if ($124) { label = 36; break; } else { label = 19; break; }
    case 19: 
      var $126=$4;
      var $127=(($126+16)|0);
      var $128=HEAP32[(($127)>>2)];
      var $129=(($128)|0)!=0;
      if ($129) { label = 36; break; } else { label = 20; break; }
    case 20: 
      var $131=$3;
      var $132=(($131)|0);
      var $133=(($132)|0);
      var $134=HEAP32[(($133)>>2)];
      var $135=$4;
      var $136=(($135)|0);
      var $137=(($136)|0);
      var $138=HEAP32[(($137)>>2)];
      var $139=(($134)|0) > (($138)|0);
      if ($139) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $141=$3;
      var $142=(($141)|0);
      var $143=(($142)|0);
      var $144=HEAP32[(($143)>>2)];
      var $151 = $144;label = 23; break;
    case 22: 
      var $146=$4;
      var $147=(($146)|0);
      var $148=(($147)|0);
      var $149=HEAP32[(($148)>>2)];
      var $151 = $149;label = 23; break;
    case 23: 
      var $151;
      var $152=$2;
      var $153=(($152)|0);
      var $154=(($153)|0);
      HEAP32[(($154)>>2)]=$151;
      var $155=$3;
      var $156=(($155)|0);
      var $157=(($156+4)|0);
      var $158=HEAP32[(($157)>>2)];
      var $159=$4;
      var $160=(($159)|0);
      var $161=(($160+4)|0);
      var $162=HEAP32[(($161)>>2)];
      var $163=(($158)|0) > (($162)|0);
      if ($163) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $165=$3;
      var $166=(($165)|0);
      var $167=(($166+4)|0);
      var $168=HEAP32[(($167)>>2)];
      var $175 = $168;label = 26; break;
    case 25: 
      var $170=$4;
      var $171=(($170)|0);
      var $172=(($171+4)|0);
      var $173=HEAP32[(($172)>>2)];
      var $175 = $173;label = 26; break;
    case 26: 
      var $175;
      var $176=$2;
      var $177=(($176)|0);
      var $178=(($177+4)|0);
      HEAP32[(($178)>>2)]=$175;
      var $179=$3;
      var $180=(($179)|0);
      var $181=(($180+8)|0);
      var $182=HEAP32[(($181)>>2)];
      var $183=$4;
      var $184=(($183)|0);
      var $185=(($184+8)|0);
      var $186=HEAP32[(($185)>>2)];
      var $187=(($182)|0) < (($186)|0);
      if ($187) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $189=$3;
      var $190=(($189)|0);
      var $191=(($190+8)|0);
      var $192=HEAP32[(($191)>>2)];
      var $199 = $192;label = 29; break;
    case 28: 
      var $194=$4;
      var $195=(($194)|0);
      var $196=(($195+8)|0);
      var $197=HEAP32[(($196)>>2)];
      var $199 = $197;label = 29; break;
    case 29: 
      var $199;
      var $200=$2;
      var $201=(($200)|0);
      var $202=(($201+8)|0);
      HEAP32[(($202)>>2)]=$199;
      var $203=$3;
      var $204=(($203)|0);
      var $205=(($204+12)|0);
      var $206=HEAP32[(($205)>>2)];
      var $207=$4;
      var $208=(($207)|0);
      var $209=(($208+12)|0);
      var $210=HEAP32[(($209)>>2)];
      var $211=(($206)|0) < (($210)|0);
      if ($211) { label = 30; break; } else { label = 31; break; }
    case 30: 
      var $213=$3;
      var $214=(($213)|0);
      var $215=(($214+12)|0);
      var $216=HEAP32[(($215)>>2)];
      var $223 = $216;label = 32; break;
    case 31: 
      var $218=$4;
      var $219=(($218)|0);
      var $220=(($219+12)|0);
      var $221=HEAP32[(($220)>>2)];
      var $223 = $221;label = 32; break;
    case 32: 
      var $223;
      var $224=$2;
      var $225=(($224)|0);
      var $226=(($225+12)|0);
      HEAP32[(($226)>>2)]=$223;
      var $227=$2;
      var $228=(($227+16)|0);
      var $229=HEAP32[(($228)>>2)];
      var $230=(($229)|0)!=0;
      if ($230) { label = 33; break; } else { label = 35; break; }
    case 33: 
      var $232=$2;
      var $233=(($232+16)|0);
      var $234=HEAP32[(($233)>>2)];
      var $235=(($234)|0);
      var $236=HEAP32[(($235)>>2)];
      var $237=(($236)|0)!=0;
      if ($237) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $239=$2;
      var $240=(($239+16)|0);
      var $241=HEAP32[(($240)>>2)];
      var $242=$241;
      _free($242);
      label = 35; break;
    case 35: 
      var $244=$2;
      var $245=(($244+16)|0);
      HEAP32[(($245)>>2)]=0;
      label = 56; break;
    case 36: 
      var $247=$4;
      var $248=(($247+16)|0);
      var $249=HEAP32[(($248)>>2)];
      var $250=(($249)|0)!=0;
      if ($250) { label = 42; break; } else { label = 37; break; }
    case 37: 
      var $252=$4;
      var $253=(($252)|0);
      var $254=(($253)|0);
      var $255=HEAP32[(($254)>>2)];
      var $256=$3;
      var $257=(($256)|0);
      var $258=(($257)|0);
      var $259=HEAP32[(($258)>>2)];
      var $260=(($255)|0) <= (($259)|0);
      if ($260) { label = 38; break; } else { label = 42; break; }
    case 38: 
      var $262=$4;
      var $263=(($262)|0);
      var $264=(($263+8)|0);
      var $265=HEAP32[(($264)>>2)];
      var $266=$3;
      var $267=(($266)|0);
      var $268=(($267+8)|0);
      var $269=HEAP32[(($268)>>2)];
      var $270=(($265)|0) >= (($269)|0);
      if ($270) { label = 39; break; } else { label = 42; break; }
    case 39: 
      var $272=$4;
      var $273=(($272)|0);
      var $274=(($273+4)|0);
      var $275=HEAP32[(($274)>>2)];
      var $276=$3;
      var $277=(($276)|0);
      var $278=(($277+4)|0);
      var $279=HEAP32[(($278)>>2)];
      var $280=(($275)|0) <= (($279)|0);
      if ($280) { label = 40; break; } else { label = 42; break; }
    case 40: 
      var $282=$4;
      var $283=(($282)|0);
      var $284=(($283+12)|0);
      var $285=HEAP32[(($284)>>2)];
      var $286=$3;
      var $287=(($286)|0);
      var $288=(($287+12)|0);
      var $289=HEAP32[(($288)>>2)];
      var $290=(($285)|0) >= (($289)|0);
      if ($290) { label = 41; break; } else { label = 42; break; }
    case 41: 
      var $292=$2;
      var $293=$3;
      var $294=_pixman_region32_copy($292, $293);
      $1=$294;
      label = 58; break;
    case 42: 
      var $296=$3;
      var $297=(($296+16)|0);
      var $298=HEAP32[(($297)>>2)];
      var $299=(($298)|0)!=0;
      if ($299) { label = 48; break; } else { label = 43; break; }
    case 43: 
      var $301=$3;
      var $302=(($301)|0);
      var $303=(($302)|0);
      var $304=HEAP32[(($303)>>2)];
      var $305=$4;
      var $306=(($305)|0);
      var $307=(($306)|0);
      var $308=HEAP32[(($307)>>2)];
      var $309=(($304)|0) <= (($308)|0);
      if ($309) { label = 44; break; } else { label = 48; break; }
    case 44: 
      var $311=$3;
      var $312=(($311)|0);
      var $313=(($312+8)|0);
      var $314=HEAP32[(($313)>>2)];
      var $315=$4;
      var $316=(($315)|0);
      var $317=(($316+8)|0);
      var $318=HEAP32[(($317)>>2)];
      var $319=(($314)|0) >= (($318)|0);
      if ($319) { label = 45; break; } else { label = 48; break; }
    case 45: 
      var $321=$3;
      var $322=(($321)|0);
      var $323=(($322+4)|0);
      var $324=HEAP32[(($323)>>2)];
      var $325=$4;
      var $326=(($325)|0);
      var $327=(($326+4)|0);
      var $328=HEAP32[(($327)>>2)];
      var $329=(($324)|0) <= (($328)|0);
      if ($329) { label = 46; break; } else { label = 48; break; }
    case 46: 
      var $331=$3;
      var $332=(($331)|0);
      var $333=(($332+12)|0);
      var $334=HEAP32[(($333)>>2)];
      var $335=$4;
      var $336=(($335)|0);
      var $337=(($336+12)|0);
      var $338=HEAP32[(($337)>>2)];
      var $339=(($334)|0) >= (($338)|0);
      if ($339) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $341=$2;
      var $342=$4;
      var $343=_pixman_region32_copy($341, $342);
      $1=$343;
      label = 58; break;
    case 48: 
      var $345=$3;
      var $346=$4;
      var $347=(($345)|0)==(($346)|0);
      if ($347) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $349=$2;
      var $350=$3;
      var $351=_pixman_region32_copy($349, $350);
      $1=$351;
      label = 58; break;
    case 50: 
      var $353=$2;
      var $354=$3;
      var $355=$4;
      var $356=_pixman_op($353, $354, $355, 10, 0, 0);
      var $357=(($356)|0)!=0;
      if ($357) { label = 52; break; } else { label = 51; break; }
    case 51: 
      $1=0;
      label = 58; break;
    case 52: 
      var $360=$2;
      _pixman_set_extents($360);
      label = 53; break;
    case 53: 
      label = 54; break;
    case 54: 
      label = 55; break;
    case 55: 
      label = 56; break;
    case 56: 
      label = 57; break;
    case 57: 
      $1=1;
      label = 58; break;
    case 58: 
      var $367=$1;

      return $367;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_intersect["X"]=1;

function _pixman_op($new_reg, $reg1, $reg2, $overlap_func, $append_non1, $append_non2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $r1;
      var $r2;
      var $r1_end;
      var $r2_end;
      var $ybot;
      var $ytop;
      var $old_data;
      var $prev_band;
      var $cur_band;
      var $r1_band_end;
      var $r2_band_end;
      var $top;
      var $bot;
      var $r1y1;
      var $r2y1;
      var $new_size;
      var $numRects;
      var $new_rects;
      var $new_rects1;
      var $new_data;
      var $data_size;
      $2=$new_reg;
      $3=$reg1;
      $4=$reg2;
      $5=$overlap_func;
      $6=$append_non1;
      $7=$append_non2;
      var $8=$3;
      var $9=(($8+16)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=HEAP32[((5242920)>>2)];
      var $12=(($10)|0)==(($11)|0);
      if ($12) { label = 4; break; } else { label = 3; break; }
    case 3: 
      var $14=$4;
      var $15=(($14+16)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=HEAP32[((5242920)>>2)];
      var $18=(($16)|0)==(($17)|0);
      if ($18) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $20=$2;
      var $21=_pixman_break($20);
      $1=$21;
      label = 206; break;
    case 5: 
      var $23=$3;
      var $24=(($23+16)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25)|0)!=0;
      if ($26) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $28=$3;
      var $29=(($28+16)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=(($30+8)|0);
      var $32=$31;
      var $37 = $32;label = 8; break;
    case 7: 
      var $34=$3;
      var $35=(($34)|0);
      var $37 = $35;label = 8; break;
    case 8: 
      var $37;
      $r1=$37;
      var $38=$3;
      var $39=(($38+16)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=(($40)|0)!=0;
      if ($41) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $43=$3;
      var $44=(($43+16)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=(($45+4)|0);
      var $47=HEAP32[(($46)>>2)];
      var $50 = $47;label = 11; break;
    case 10: 
      var $50 = 1;label = 11; break;
    case 11: 
      var $50;
      $new_size=$50;
      var $51=$r1;
      var $52=$new_size;
      var $53=(($51+($52<<4))|0);
      $r1_end=$53;
      var $54=$4;
      var $55=(($54+16)|0);
      var $56=HEAP32[(($55)>>2)];
      var $57=(($56)|0)!=0;
      if ($57) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $59=$4;
      var $60=(($59+16)|0);
      var $61=HEAP32[(($60)>>2)];
      var $62=(($61+4)|0);
      var $63=HEAP32[(($62)>>2)];
      var $66 = $63;label = 14; break;
    case 13: 
      var $66 = 1;label = 14; break;
    case 14: 
      var $66;
      $numRects=$66;
      var $67=$4;
      var $68=(($67+16)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=(($69)|0)!=0;
      if ($70) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $72=$4;
      var $73=(($72+16)|0);
      var $74=HEAP32[(($73)>>2)];
      var $75=(($74+8)|0);
      var $76=$75;
      var $81 = $76;label = 17; break;
    case 16: 
      var $78=$4;
      var $79=(($78)|0);
      var $81 = $79;label = 17; break;
    case 17: 
      var $81;
      $r2=$81;
      var $82=$r2;
      var $83=$numRects;
      var $84=(($82+($83<<4))|0);
      $r2_end=$84;
      label = 18; break;
    case 18: 
      label = 19; break;
    case 19: 
      label = 20; break;
    case 20: 
      label = 21; break;
    case 21: 
      $old_data=0;
      var $89=$2;
      var $90=$3;
      var $91=(($89)|0)==(($90)|0);
      if ($91) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $93=$new_size;
      var $94=(($93)|0) > 1;
      if ($94) { label = 25; break; } else { label = 23; break; }
    case 23: 
      var $96=$2;
      var $97=$4;
      var $98=(($96)|0)==(($97)|0);
      if ($98) { label = 24; break; } else { label = 26; break; }
    case 24: 
      var $100=$numRects;
      var $101=(($100)|0) > 1;
      if ($101) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $103=$2;
      var $104=(($103+16)|0);
      var $105=HEAP32[(($104)>>2)];
      $old_data=$105;
      var $106=HEAP32[((5242880)>>2)];
      var $107=$2;
      var $108=(($107+16)|0);
      HEAP32[(($108)>>2)]=$106;
      label = 26; break;
    case 26: 
      var $110=$numRects;
      var $111=$new_size;
      var $112=(($110)|0) > (($111)|0);
      if ($112) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $114=$numRects;
      $new_size=$114;
      label = 28; break;
    case 28: 
      var $116=$new_size;
      var $117=$116 << 1;
      $new_size=$117;
      var $118=$2;
      var $119=(($118+16)|0);
      var $120=HEAP32[(($119)>>2)];
      var $121=(($120)|0)!=0;
      if ($121) { label = 30; break; } else { label = 29; break; }
    case 29: 
      var $123=HEAP32[((5242880)>>2)];
      var $124=$2;
      var $125=(($124+16)|0);
      HEAP32[(($125)>>2)]=$123;
      label = 33; break;
    case 30: 
      var $127=$2;
      var $128=(($127+16)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=(($129)|0);
      var $131=HEAP32[(($130)>>2)];
      var $132=(($131)|0)!=0;
      if ($132) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $134=$2;
      var $135=(($134+16)|0);
      var $136=HEAP32[(($135)>>2)];
      var $137=(($136+4)|0);
      HEAP32[(($137)>>2)]=0;
      label = 32; break;
    case 32: 
      label = 33; break;
    case 33: 
      var $140=$new_size;
      var $141=$2;
      var $142=(($141+16)|0);
      var $143=HEAP32[(($142)>>2)];
      var $144=(($143)|0);
      var $145=HEAP32[(($144)>>2)];
      var $146=(($140)|0) > (($145)|0);
      if ($146) { label = 34; break; } else { label = 37; break; }
    case 34: 
      var $148=$2;
      var $149=$new_size;
      var $150=_pixman_rect_alloc($148, $149);
      var $151=(($150)|0)!=0;
      if ($151) { label = 36; break; } else { label = 35; break; }
    case 35: 
      var $153=$old_data;
      var $154=$153;
      _free($154);
      $1=0;
      label = 206; break;
    case 36: 
      label = 37; break;
    case 37: 
      var $157=$r1;
      var $158=(($157+4)|0);
      var $159=HEAP32[(($158)>>2)];
      var $160=$r2;
      var $161=(($160+4)|0);
      var $162=HEAP32[(($161)>>2)];
      var $163=(($159)|0) < (($162)|0);
      if ($163) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $165=$r1;
      var $166=(($165+4)|0);
      var $167=HEAP32[(($166)>>2)];
      var $173 = $167;label = 40; break;
    case 39: 
      var $169=$r2;
      var $170=(($169+4)|0);
      var $171=HEAP32[(($170)>>2)];
      var $173 = $171;label = 40; break;
    case 40: 
      var $173;
      $ybot=$173;
      $prev_band=0;
      label = 41; break;
    case 41: 
      label = 42; break;
    case 42: 
      label = 43; break;
    case 43: 
      label = 44; break;
    case 44: 
      label = 45; break;
    case 45: 
      label = 46; break;
    case 46: 
      var $180=$r1;
      var $181=(($180+4)|0);
      var $182=HEAP32[(($181)>>2)];
      $r1y1=$182;
      var $183=$r1;
      var $184=(($183+16)|0);
      $r1_band_end=$184;
      label = 47; break;
    case 47: 
      var $186=$r1_band_end;
      var $187=$r1_end;
      var $188=(($186)|0)!=(($187)|0);
      if ($188) { label = 48; break; } else { var $196 = 0;label = 49; break; }
    case 48: 
      var $190=$r1_band_end;
      var $191=(($190+4)|0);
      var $192=HEAP32[(($191)>>2)];
      var $193=$r1y1;
      var $194=(($192)|0)==(($193)|0);
      var $196 = $194;label = 49; break;
    case 49: 
      var $196;
      if ($196) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $198=$r1_band_end;
      var $199=(($198+16)|0);
      $r1_band_end=$199;
      label = 47; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      var $203=$r2;
      var $204=(($203+4)|0);
      var $205=HEAP32[(($204)>>2)];
      $r2y1=$205;
      var $206=$r2;
      var $207=(($206+16)|0);
      $r2_band_end=$207;
      label = 54; break;
    case 54: 
      var $209=$r2_band_end;
      var $210=$r2_end;
      var $211=(($209)|0)!=(($210)|0);
      if ($211) { label = 55; break; } else { var $219 = 0;label = 56; break; }
    case 55: 
      var $213=$r2_band_end;
      var $214=(($213+4)|0);
      var $215=HEAP32[(($214)>>2)];
      var $216=$r2y1;
      var $217=(($215)|0)==(($216)|0);
      var $219 = $217;label = 56; break;
    case 56: 
      var $219;
      if ($219) { label = 57; break; } else { label = 58; break; }
    case 57: 
      var $221=$r2_band_end;
      var $222=(($221+16)|0);
      $r2_band_end=$222;
      label = 54; break;
    case 58: 
      label = 59; break;
    case 59: 
      var $225=$r1y1;
      var $226=$r2y1;
      var $227=(($225)|0) < (($226)|0);
      if ($227) { label = 60; break; } else { label = 78; break; }
    case 60: 
      var $229=$6;
      var $230=(($229)|0)!=0;
      if ($230) { label = 61; break; } else { label = 77; break; }
    case 61: 
      var $232=$r1y1;
      var $233=$ybot;
      var $234=(($232)|0) > (($233)|0);
      if ($234) { label = 62; break; } else { label = 63; break; }
    case 62: 
      var $236=$r1y1;
      var $240 = $236;label = 64; break;
    case 63: 
      var $238=$ybot;
      var $240 = $238;label = 64; break;
    case 64: 
      var $240;
      $top=$240;
      var $241=$r1;
      var $242=(($241+12)|0);
      var $243=HEAP32[(($242)>>2)];
      var $244=$r2y1;
      var $245=(($243)|0) < (($244)|0);
      if ($245) { label = 65; break; } else { label = 66; break; }
    case 65: 
      var $247=$r1;
      var $248=(($247+12)|0);
      var $249=HEAP32[(($248)>>2)];
      var $253 = $249;label = 67; break;
    case 66: 
      var $251=$r2y1;
      var $253 = $251;label = 67; break;
    case 67: 
      var $253;
      $bot=$253;
      var $254=$top;
      var $255=$bot;
      var $256=(($254)|0)!=(($255)|0);
      if ($256) { label = 68; break; } else { label = 76; break; }
    case 68: 
      var $258=$2;
      var $259=(($258+16)|0);
      var $260=HEAP32[(($259)>>2)];
      var $261=(($260+4)|0);
      var $262=HEAP32[(($261)>>2)];
      $cur_band=$262;
      var $263=$2;
      var $264=$r1;
      var $265=$r1_band_end;
      var $266=$top;
      var $267=$bot;
      var $268=_pixman_region_append_non_o($263, $264, $265, $266, $267);
      var $269=(($268)|0)!=0;
      if ($269) { label = 70; break; } else { label = 69; break; }
    case 69: 
      label = 205; break;
    case 70: 
      label = 71; break;
    case 71: 
      var $273=$cur_band;
      var $274=$prev_band;
      var $275=((($273)-($274))|0);
      var $276=$2;
      var $277=(($276+16)|0);
      var $278=HEAP32[(($277)>>2)];
      var $279=(($278+4)|0);
      var $280=HEAP32[(($279)>>2)];
      var $281=$cur_band;
      var $282=((($280)-($281))|0);
      var $283=(($275)|0)==(($282)|0);
      if ($283) { label = 72; break; } else { label = 73; break; }
    case 72: 
      var $285=$2;
      var $286=$prev_band;
      var $287=$cur_band;
      var $288=_pixman_coalesce($285, $286, $287);
      $prev_band=$288;
      label = 74; break;
    case 73: 
      var $290=$cur_band;
      $prev_band=$290;
      label = 74; break;
    case 74: 
      label = 75; break;
    case 75: 
      label = 76; break;
    case 76: 
      label = 77; break;
    case 77: 
      var $295=$r2y1;
      $ytop=$295;
      label = 99; break;
    case 78: 
      var $297=$r2y1;
      var $298=$r1y1;
      var $299=(($297)|0) < (($298)|0);
      if ($299) { label = 79; break; } else { label = 97; break; }
    case 79: 
      var $301=$7;
      var $302=(($301)|0)!=0;
      if ($302) { label = 80; break; } else { label = 96; break; }
    case 80: 
      var $304=$r2y1;
      var $305=$ybot;
      var $306=(($304)|0) > (($305)|0);
      if ($306) { label = 81; break; } else { label = 82; break; }
    case 81: 
      var $308=$r2y1;
      var $312 = $308;label = 83; break;
    case 82: 
      var $310=$ybot;
      var $312 = $310;label = 83; break;
    case 83: 
      var $312;
      $top=$312;
      var $313=$r2;
      var $314=(($313+12)|0);
      var $315=HEAP32[(($314)>>2)];
      var $316=$r1y1;
      var $317=(($315)|0) < (($316)|0);
      if ($317) { label = 84; break; } else { label = 85; break; }
    case 84: 
      var $319=$r2;
      var $320=(($319+12)|0);
      var $321=HEAP32[(($320)>>2)];
      var $325 = $321;label = 86; break;
    case 85: 
      var $323=$r1y1;
      var $325 = $323;label = 86; break;
    case 86: 
      var $325;
      $bot=$325;
      var $326=$top;
      var $327=$bot;
      var $328=(($326)|0)!=(($327)|0);
      if ($328) { label = 87; break; } else { label = 95; break; }
    case 87: 
      var $330=$2;
      var $331=(($330+16)|0);
      var $332=HEAP32[(($331)>>2)];
      var $333=(($332+4)|0);
      var $334=HEAP32[(($333)>>2)];
      $cur_band=$334;
      var $335=$2;
      var $336=$r2;
      var $337=$r2_band_end;
      var $338=$top;
      var $339=$bot;
      var $340=_pixman_region_append_non_o($335, $336, $337, $338, $339);
      var $341=(($340)|0)!=0;
      if ($341) { label = 89; break; } else { label = 88; break; }
    case 88: 
      label = 205; break;
    case 89: 
      label = 90; break;
    case 90: 
      var $345=$cur_band;
      var $346=$prev_band;
      var $347=((($345)-($346))|0);
      var $348=$2;
      var $349=(($348+16)|0);
      var $350=HEAP32[(($349)>>2)];
      var $351=(($350+4)|0);
      var $352=HEAP32[(($351)>>2)];
      var $353=$cur_band;
      var $354=((($352)-($353))|0);
      var $355=(($347)|0)==(($354)|0);
      if ($355) { label = 91; break; } else { label = 92; break; }
    case 91: 
      var $357=$2;
      var $358=$prev_band;
      var $359=$cur_band;
      var $360=_pixman_coalesce($357, $358, $359);
      $prev_band=$360;
      label = 93; break;
    case 92: 
      var $362=$cur_band;
      $prev_band=$362;
      label = 93; break;
    case 93: 
      label = 94; break;
    case 94: 
      label = 95; break;
    case 95: 
      label = 96; break;
    case 96: 
      var $367=$r1y1;
      $ytop=$367;
      label = 98; break;
    case 97: 
      var $369=$r1y1;
      $ytop=$369;
      label = 98; break;
    case 98: 
      label = 99; break;
    case 99: 
      var $372=$r1;
      var $373=(($372+12)|0);
      var $374=HEAP32[(($373)>>2)];
      var $375=$r2;
      var $376=(($375+12)|0);
      var $377=HEAP32[(($376)>>2)];
      var $378=(($374)|0) < (($377)|0);
      if ($378) { label = 100; break; } else { label = 101; break; }
    case 100: 
      var $380=$r1;
      var $381=(($380+12)|0);
      var $382=HEAP32[(($381)>>2)];
      var $388 = $382;label = 102; break;
    case 101: 
      var $384=$r2;
      var $385=(($384+12)|0);
      var $386=HEAP32[(($385)>>2)];
      var $388 = $386;label = 102; break;
    case 102: 
      var $388;
      $ybot=$388;
      var $389=$ybot;
      var $390=$ytop;
      var $391=(($389)|0) > (($390)|0);
      if ($391) { label = 103; break; } else { label = 111; break; }
    case 103: 
      var $393=$2;
      var $394=(($393+16)|0);
      var $395=HEAP32[(($394)>>2)];
      var $396=(($395+4)|0);
      var $397=HEAP32[(($396)>>2)];
      $cur_band=$397;
      var $398=$5;
      var $399=$2;
      var $400=$r1;
      var $401=$r1_band_end;
      var $402=$r2;
      var $403=$r2_band_end;
      var $404=$ytop;
      var $405=$ybot;
      var $406=FUNCTION_TABLE[$398]($399, $400, $401, $402, $403, $404, $405);
      var $407=(($406)|0)!=0;
      if ($407) { label = 105; break; } else { label = 104; break; }
    case 104: 
      label = 205; break;
    case 105: 
      label = 106; break;
    case 106: 
      var $411=$cur_band;
      var $412=$prev_band;
      var $413=((($411)-($412))|0);
      var $414=$2;
      var $415=(($414+16)|0);
      var $416=HEAP32[(($415)>>2)];
      var $417=(($416+4)|0);
      var $418=HEAP32[(($417)>>2)];
      var $419=$cur_band;
      var $420=((($418)-($419))|0);
      var $421=(($413)|0)==(($420)|0);
      if ($421) { label = 107; break; } else { label = 108; break; }
    case 107: 
      var $423=$2;
      var $424=$prev_band;
      var $425=$cur_band;
      var $426=_pixman_coalesce($423, $424, $425);
      $prev_band=$426;
      label = 109; break;
    case 108: 
      var $428=$cur_band;
      $prev_band=$428;
      label = 109; break;
    case 109: 
      label = 110; break;
    case 110: 
      label = 111; break;
    case 111: 
      var $432=$r1;
      var $433=(($432+12)|0);
      var $434=HEAP32[(($433)>>2)];
      var $435=$ybot;
      var $436=(($434)|0)==(($435)|0);
      if ($436) { label = 112; break; } else { label = 113; break; }
    case 112: 
      var $438=$r1_band_end;
      $r1=$438;
      label = 113; break;
    case 113: 
      var $440=$r2;
      var $441=(($440+12)|0);
      var $442=HEAP32[(($441)>>2)];
      var $443=$ybot;
      var $444=(($442)|0)==(($443)|0);
      if ($444) { label = 114; break; } else { label = 115; break; }
    case 114: 
      var $446=$r2_band_end;
      $r2=$446;
      label = 115; break;
    case 115: 
      label = 116; break;
    case 116: 
      var $449=$r1;
      var $450=$r1_end;
      var $451=(($449)|0)!=(($450)|0);
      if ($451) { label = 117; break; } else { var $457 = 0;label = 118; break; }
    case 117: 
      var $453=$r2;
      var $454=$r2_end;
      var $455=(($453)|0)!=(($454)|0);
      var $457 = $455;label = 118; break;
    case 118: 
      var $457;
      if ($457) { label = 41; break; } else { label = 119; break; }
    case 119: 
      var $459=$r1;
      var $460=$r1_end;
      var $461=(($459)|0)!=(($460)|0);
      if ($461) { label = 120; break; } else { label = 150; break; }
    case 120: 
      var $463=$6;
      var $464=(($463)|0)!=0;
      if ($464) { label = 121; break; } else { label = 150; break; }
    case 121: 
      label = 122; break;
    case 122: 
      var $467=$r1;
      var $468=(($467+4)|0);
      var $469=HEAP32[(($468)>>2)];
      $r1y1=$469;
      var $470=$r1;
      var $471=(($470+16)|0);
      $r1_band_end=$471;
      label = 123; break;
    case 123: 
      var $473=$r1_band_end;
      var $474=$r1_end;
      var $475=(($473)|0)!=(($474)|0);
      if ($475) { label = 124; break; } else { var $483 = 0;label = 125; break; }
    case 124: 
      var $477=$r1_band_end;
      var $478=(($477+4)|0);
      var $479=HEAP32[(($478)>>2)];
      var $480=$r1y1;
      var $481=(($479)|0)==(($480)|0);
      var $483 = $481;label = 125; break;
    case 125: 
      var $483;
      if ($483) { label = 126; break; } else { label = 127; break; }
    case 126: 
      var $485=$r1_band_end;
      var $486=(($485+16)|0);
      $r1_band_end=$486;
      label = 123; break;
    case 127: 
      label = 128; break;
    case 128: 
      var $489=$2;
      var $490=(($489+16)|0);
      var $491=HEAP32[(($490)>>2)];
      var $492=(($491+4)|0);
      var $493=HEAP32[(($492)>>2)];
      $cur_band=$493;
      var $494=$2;
      var $495=$r1;
      var $496=$r1_band_end;
      var $497=$r1y1;
      var $498=$ybot;
      var $499=(($497)|0) > (($498)|0);
      if ($499) { label = 129; break; } else { label = 130; break; }
    case 129: 
      var $501=$r1y1;
      var $505 = $501;label = 131; break;
    case 130: 
      var $503=$ybot;
      var $505 = $503;label = 131; break;
    case 131: 
      var $505;
      var $506=$r1;
      var $507=(($506+12)|0);
      var $508=HEAP32[(($507)>>2)];
      var $509=_pixman_region_append_non_o($494, $495, $496, $505, $508);
      var $510=(($509)|0)!=0;
      if ($510) { label = 133; break; } else { label = 132; break; }
    case 132: 
      label = 205; break;
    case 133: 
      label = 134; break;
    case 134: 
      var $514=$cur_band;
      var $515=$prev_band;
      var $516=((($514)-($515))|0);
      var $517=$2;
      var $518=(($517+16)|0);
      var $519=HEAP32[(($518)>>2)];
      var $520=(($519+4)|0);
      var $521=HEAP32[(($520)>>2)];
      var $522=$cur_band;
      var $523=((($521)-($522))|0);
      var $524=(($516)|0)==(($523)|0);
      if ($524) { label = 135; break; } else { label = 136; break; }
    case 135: 
      var $526=$2;
      var $527=$prev_band;
      var $528=$cur_band;
      var $529=_pixman_coalesce($526, $527, $528);
      $prev_band=$529;
      label = 137; break;
    case 136: 
      var $531=$cur_band;
      $prev_band=$531;
      label = 137; break;
    case 137: 
      label = 138; break;
    case 138: 
      label = 139; break;
    case 139: 
      var $535=$r1_end;
      var $536=$r1_band_end;
      var $537=$535;
      var $538=$536;
      var $539=((($537)-($538))|0);
      var $540=((((($539)|0))/(16))&-1);
      $new_rects=$540;
      var $541=(($540)|0)!=0;
      if ($541) { label = 140; break; } else { label = 148; break; }
    case 140: 
      label = 141; break;
    case 141: 
      var $544=$2;
      var $545=(($544+16)|0);
      var $546=HEAP32[(($545)>>2)];
      var $547=(($546)|0)!=0;
      if ($547) { label = 142; break; } else { label = 143; break; }
    case 142: 
      var $549=$2;
      var $550=(($549+16)|0);
      var $551=HEAP32[(($550)>>2)];
      var $552=(($551+4)|0);
      var $553=HEAP32[(($552)>>2)];
      var $554=$new_rects;
      var $555=((($553)+($554))|0);
      var $556=$2;
      var $557=(($556+16)|0);
      var $558=HEAP32[(($557)>>2)];
      var $559=(($558)|0);
      var $560=HEAP32[(($559)>>2)];
      var $561=(($555)|0) > (($560)|0);
      if ($561) { label = 143; break; } else { label = 146; break; }
    case 143: 
      var $563=$2;
      var $564=$new_rects;
      var $565=_pixman_rect_alloc($563, $564);
      var $566=(($565)|0)!=0;
      if ($566) { label = 145; break; } else { label = 144; break; }
    case 144: 
      label = 205; break;
    case 145: 
      label = 146; break;
    case 146: 
      label = 147; break;
    case 147: 
      var $571=$2;
      var $572=(($571+16)|0);
      var $573=HEAP32[(($572)>>2)];
      var $574=(($573+4)|0);
      var $575=HEAP32[(($574)>>2)];
      var $576=$2;
      var $577=(($576+16)|0);
      var $578=HEAP32[(($577)>>2)];
      var $579=(($578+8)|0);
      var $580=$579;
      var $581=(($580+($575<<4))|0);
      var $582=$581;
      var $583=$r1_band_end;
      var $584=$583;
      var $585=$new_rects;
      var $586=((($585<<4))|0);
      _memmove($582, $584, $586, 1, 0);
      var $587=$new_rects;
      var $588=$2;
      var $589=(($588+16)|0);
      var $590=HEAP32[(($589)>>2)];
      var $591=(($590+4)|0);
      var $592=HEAP32[(($591)>>2)];
      var $593=((($592)+($587))|0);
      HEAP32[(($591)>>2)]=$593;
      label = 148; break;
    case 148: 
      label = 149; break;
    case 149: 
      label = 182; break;
    case 150: 
      var $597=$r2;
      var $598=$r2_end;
      var $599=(($597)|0)!=(($598)|0);
      if ($599) { label = 151; break; } else { label = 181; break; }
    case 151: 
      var $601=$7;
      var $602=(($601)|0)!=0;
      if ($602) { label = 152; break; } else { label = 181; break; }
    case 152: 
      label = 153; break;
    case 153: 
      var $605=$r2;
      var $606=(($605+4)|0);
      var $607=HEAP32[(($606)>>2)];
      $r2y1=$607;
      var $608=$r2;
      var $609=(($608+16)|0);
      $r2_band_end=$609;
      label = 154; break;
    case 154: 
      var $611=$r2_band_end;
      var $612=$r2_end;
      var $613=(($611)|0)!=(($612)|0);
      if ($613) { label = 155; break; } else { var $621 = 0;label = 156; break; }
    case 155: 
      var $615=$r2_band_end;
      var $616=(($615+4)|0);
      var $617=HEAP32[(($616)>>2)];
      var $618=$r2y1;
      var $619=(($617)|0)==(($618)|0);
      var $621 = $619;label = 156; break;
    case 156: 
      var $621;
      if ($621) { label = 157; break; } else { label = 158; break; }
    case 157: 
      var $623=$r2_band_end;
      var $624=(($623+16)|0);
      $r2_band_end=$624;
      label = 154; break;
    case 158: 
      label = 159; break;
    case 159: 
      var $627=$2;
      var $628=(($627+16)|0);
      var $629=HEAP32[(($628)>>2)];
      var $630=(($629+4)|0);
      var $631=HEAP32[(($630)>>2)];
      $cur_band=$631;
      var $632=$2;
      var $633=$r2;
      var $634=$r2_band_end;
      var $635=$r2y1;
      var $636=$ybot;
      var $637=(($635)|0) > (($636)|0);
      if ($637) { label = 160; break; } else { label = 161; break; }
    case 160: 
      var $639=$r2y1;
      var $643 = $639;label = 162; break;
    case 161: 
      var $641=$ybot;
      var $643 = $641;label = 162; break;
    case 162: 
      var $643;
      var $644=$r2;
      var $645=(($644+12)|0);
      var $646=HEAP32[(($645)>>2)];
      var $647=_pixman_region_append_non_o($632, $633, $634, $643, $646);
      var $648=(($647)|0)!=0;
      if ($648) { label = 164; break; } else { label = 163; break; }
    case 163: 
      label = 205; break;
    case 164: 
      label = 165; break;
    case 165: 
      var $652=$cur_band;
      var $653=$prev_band;
      var $654=((($652)-($653))|0);
      var $655=$2;
      var $656=(($655+16)|0);
      var $657=HEAP32[(($656)>>2)];
      var $658=(($657+4)|0);
      var $659=HEAP32[(($658)>>2)];
      var $660=$cur_band;
      var $661=((($659)-($660))|0);
      var $662=(($654)|0)==(($661)|0);
      if ($662) { label = 166; break; } else { label = 167; break; }
    case 166: 
      var $664=$2;
      var $665=$prev_band;
      var $666=$cur_band;
      var $667=_pixman_coalesce($664, $665, $666);
      $prev_band=$667;
      label = 168; break;
    case 167: 
      var $669=$cur_band;
      $prev_band=$669;
      label = 168; break;
    case 168: 
      label = 169; break;
    case 169: 
      label = 170; break;
    case 170: 
      var $673=$r2_end;
      var $674=$r2_band_end;
      var $675=$673;
      var $676=$674;
      var $677=((($675)-($676))|0);
      var $678=((((($677)|0))/(16))&-1);
      $new_rects1=$678;
      var $679=(($678)|0)!=0;
      if ($679) { label = 171; break; } else { label = 179; break; }
    case 171: 
      label = 172; break;
    case 172: 
      var $682=$2;
      var $683=(($682+16)|0);
      var $684=HEAP32[(($683)>>2)];
      var $685=(($684)|0)!=0;
      if ($685) { label = 173; break; } else { label = 174; break; }
    case 173: 
      var $687=$2;
      var $688=(($687+16)|0);
      var $689=HEAP32[(($688)>>2)];
      var $690=(($689+4)|0);
      var $691=HEAP32[(($690)>>2)];
      var $692=$new_rects1;
      var $693=((($691)+($692))|0);
      var $694=$2;
      var $695=(($694+16)|0);
      var $696=HEAP32[(($695)>>2)];
      var $697=(($696)|0);
      var $698=HEAP32[(($697)>>2)];
      var $699=(($693)|0) > (($698)|0);
      if ($699) { label = 174; break; } else { label = 177; break; }
    case 174: 
      var $701=$2;
      var $702=$new_rects1;
      var $703=_pixman_rect_alloc($701, $702);
      var $704=(($703)|0)!=0;
      if ($704) { label = 176; break; } else { label = 175; break; }
    case 175: 
      label = 205; break;
    case 176: 
      label = 177; break;
    case 177: 
      label = 178; break;
    case 178: 
      var $709=$2;
      var $710=(($709+16)|0);
      var $711=HEAP32[(($710)>>2)];
      var $712=(($711+4)|0);
      var $713=HEAP32[(($712)>>2)];
      var $714=$2;
      var $715=(($714+16)|0);
      var $716=HEAP32[(($715)>>2)];
      var $717=(($716+8)|0);
      var $718=$717;
      var $719=(($718+($713<<4))|0);
      var $720=$719;
      var $721=$r2_band_end;
      var $722=$721;
      var $723=$new_rects1;
      var $724=((($723<<4))|0);
      _memmove($720, $722, $724, 1, 0);
      var $725=$new_rects1;
      var $726=$2;
      var $727=(($726+16)|0);
      var $728=HEAP32[(($727)>>2)];
      var $729=(($728+4)|0);
      var $730=HEAP32[(($729)>>2)];
      var $731=((($730)+($725))|0);
      HEAP32[(($729)>>2)]=$731;
      label = 179; break;
    case 179: 
      label = 180; break;
    case 180: 
      label = 181; break;
    case 181: 
      label = 182; break;
    case 182: 
      var $736=$old_data;
      var $737=$736;
      _free($737);
      var $738=$2;
      var $739=(($738+16)|0);
      var $740=HEAP32[(($739)>>2)];
      var $741=(($740+4)|0);
      var $742=HEAP32[(($741)>>2)];
      $numRects=$742;
      var $743=(($742)|0)!=0;
      if ($743) { label = 187; break; } else { label = 183; break; }
    case 183: 
      var $745=$2;
      var $746=(($745+16)|0);
      var $747=HEAP32[(($746)>>2)];
      var $748=(($747)|0)!=0;
      if ($748) { label = 184; break; } else { label = 186; break; }
    case 184: 
      var $750=$2;
      var $751=(($750+16)|0);
      var $752=HEAP32[(($751)>>2)];
      var $753=(($752)|0);
      var $754=HEAP32[(($753)>>2)];
      var $755=(($754)|0)!=0;
      if ($755) { label = 185; break; } else { label = 186; break; }
    case 185: 
      var $757=$2;
      var $758=(($757+16)|0);
      var $759=HEAP32[(($758)>>2)];
      var $760=$759;
      _free($760);
      label = 186; break;
    case 186: 
      var $762=HEAP32[((5242880)>>2)];
      var $763=$2;
      var $764=(($763+16)|0);
      HEAP32[(($764)>>2)]=$762;
      label = 204; break;
    case 187: 
      var $766=$numRects;
      var $767=(($766)|0)==1;
      if ($767) { label = 188; break; } else { label = 192; break; }
    case 188: 
      var $769=$2;
      var $770=(($769)|0);
      var $771=$2;
      var $772=(($771+16)|0);
      var $773=HEAP32[(($772)>>2)];
      var $774=(($773+8)|0);
      var $775=$774;
      var $776=$770;
      var $777=$775;
      assert(16 % 1 === 0);HEAP32[(($776)>>2)]=HEAP32[(($777)>>2)];HEAP32[((($776)+(4))>>2)]=HEAP32[((($777)+(4))>>2)];HEAP32[((($776)+(8))>>2)]=HEAP32[((($777)+(8))>>2)];HEAP32[((($776)+(12))>>2)]=HEAP32[((($777)+(12))>>2)];
      var $778=$2;
      var $779=(($778+16)|0);
      var $780=HEAP32[(($779)>>2)];
      var $781=(($780)|0)!=0;
      if ($781) { label = 189; break; } else { label = 191; break; }
    case 189: 
      var $783=$2;
      var $784=(($783+16)|0);
      var $785=HEAP32[(($784)>>2)];
      var $786=(($785)|0);
      var $787=HEAP32[(($786)>>2)];
      var $788=(($787)|0)!=0;
      if ($788) { label = 190; break; } else { label = 191; break; }
    case 190: 
      var $790=$2;
      var $791=(($790+16)|0);
      var $792=HEAP32[(($791)>>2)];
      var $793=$792;
      _free($793);
      label = 191; break;
    case 191: 
      var $795=$2;
      var $796=(($795+16)|0);
      HEAP32[(($796)>>2)]=0;
      label = 203; break;
    case 192: 
      label = 193; break;
    case 193: 
      var $799=$numRects;
      var $800=$2;
      var $801=(($800+16)|0);
      var $802=HEAP32[(($801)>>2)];
      var $803=(($802)|0);
      var $804=HEAP32[(($803)>>2)];
      var $805=$804 >> 1;
      var $806=(($799)|0) < (($805)|0);
      if ($806) { label = 194; break; } else { label = 201; break; }
    case 194: 
      var $808=$2;
      var $809=(($808+16)|0);
      var $810=HEAP32[(($809)>>2)];
      var $811=(($810)|0);
      var $812=HEAP32[(($811)>>2)];
      var $813=(($812)|0) > 50;
      if ($813) { label = 195; break; } else { label = 201; break; }
    case 195: 
      var $815=$numRects;
      var $816=_PIXREGION_SZOF($815);
      $data_size=$816;
      var $817=$data_size;
      var $818=(($817)|0)!=0;
      if ($818) { label = 197; break; } else { label = 196; break; }
    case 196: 
      $new_data=0;
      label = 198; break;
    case 197: 
      var $821=$2;
      var $822=(($821+16)|0);
      var $823=HEAP32[(($822)>>2)];
      var $824=$823;
      var $825=$data_size;
      var $826=_realloc($824, $825);
      var $827=$826;
      $new_data=$827;
      label = 198; break;
    case 198: 
      var $829=$new_data;
      var $830=(($829)|0)!=0;
      if ($830) { label = 199; break; } else { label = 200; break; }
    case 199: 
      var $832=$numRects;
      var $833=$new_data;
      var $834=(($833)|0);
      HEAP32[(($834)>>2)]=$832;
      var $835=$new_data;
      var $836=$2;
      var $837=(($836+16)|0);
      HEAP32[(($837)>>2)]=$835;
      label = 200; break;
    case 200: 
      label = 201; break;
    case 201: 
      label = 202; break;
    case 202: 
      label = 203; break;
    case 203: 
      label = 204; break;
    case 204: 
      $1=1;
      label = 206; break;
    case 205: 
      var $844=$old_data;
      var $845=$844;
      _free($845);
      var $846=$2;
      var $847=_pixman_break($846);
      $1=$847;
      label = 206; break;
    case 206: 
      var $849=$1;

      return $849;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_op["X"]=1;

function _pixman_set_extents($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $box;
      var $box_end;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 4; break; } else { label = 3; break; }
    case 3: 
      label = 17; break;
    case 4: 
      var $8=$1;
      var $9=(($8+16)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($10)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12)|0)!=0;
      if ($13) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $15=$1;
      var $16=(($15)|0);
      var $17=(($16)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=$1;
      var $20=(($19)|0);
      var $21=(($20+8)|0);
      HEAP32[(($21)>>2)]=$18;
      var $22=$1;
      var $23=(($22)|0);
      var $24=(($23+4)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=$1;
      var $27=(($26)|0);
      var $28=(($27+12)|0);
      HEAP32[(($28)>>2)]=$25;
      label = 17; break;
    case 6: 
      var $30=$1;
      var $31=(($30+16)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($32+8)|0);
      var $34=$33;
      $box=$34;
      var $35=$1;
      var $36=(($35+16)|0);
      var $37=HEAP32[(($36)>>2)];
      var $38=(($37+4)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=((($39)-(1))|0);
      var $41=$1;
      var $42=(($41+16)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=(($43+8)|0);
      var $45=$44;
      var $46=(($45+($40<<4))|0);
      $box_end=$46;
      var $47=$box;
      var $48=(($47)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$1;
      var $51=(($50)|0);
      var $52=(($51)|0);
      HEAP32[(($52)>>2)]=$49;
      var $53=$box;
      var $54=(($53+4)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=$1;
      var $57=(($56)|0);
      var $58=(($57+4)|0);
      HEAP32[(($58)>>2)]=$55;
      var $59=$box_end;
      var $60=(($59+8)|0);
      var $61=HEAP32[(($60)>>2)];
      var $62=$1;
      var $63=(($62)|0);
      var $64=(($63+8)|0);
      HEAP32[(($64)>>2)]=$61;
      var $65=$box_end;
      var $66=(($65+12)|0);
      var $67=HEAP32[(($66)>>2)];
      var $68=$1;
      var $69=(($68)|0);
      var $70=(($69+12)|0);
      HEAP32[(($70)>>2)]=$67;
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $74=$box;
      var $75=$box_end;
      var $76=(($74)>>>0) <= (($75)>>>0);
      if ($76) { label = 10; break; } else { label = 15; break; }
    case 10: 
      var $78=$box;
      var $79=(($78)|0);
      var $80=HEAP32[(($79)>>2)];
      var $81=$1;
      var $82=(($81)|0);
      var $83=(($82)|0);
      var $84=HEAP32[(($83)>>2)];
      var $85=(($80)|0) < (($84)|0);
      if ($85) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $87=$box;
      var $88=(($87)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=$1;
      var $91=(($90)|0);
      var $92=(($91)|0);
      HEAP32[(($92)>>2)]=$89;
      label = 12; break;
    case 12: 
      var $94=$box;
      var $95=(($94+8)|0);
      var $96=HEAP32[(($95)>>2)];
      var $97=$1;
      var $98=(($97)|0);
      var $99=(($98+8)|0);
      var $100=HEAP32[(($99)>>2)];
      var $101=(($96)|0) > (($100)|0);
      if ($101) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $103=$box;
      var $104=(($103+8)|0);
      var $105=HEAP32[(($104)>>2)];
      var $106=$1;
      var $107=(($106)|0);
      var $108=(($107+8)|0);
      HEAP32[(($108)>>2)]=$105;
      label = 14; break;
    case 14: 
      var $110=$box;
      var $111=(($110+16)|0);
      $box=$111;
      label = 9; break;
    case 15: 
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 

      return;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_set_extents["X"]=1;

function _pixman_region_intersect_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $x1;
      var $x2;
      var $next_rect;
      $2=$region;
      $3=$r1;
      $4=$r1_end;
      $5=$r2;
      $6=$r2_end;
      $7=$y1;
      $8=$y2;
      var $9=$2;
      var $10=(($9+16)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11+4)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=$2;
      var $15=(($14+16)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=(($16+8)|0);
      var $18=$17;
      var $19=(($18+($13<<4))|0);
      $next_rect=$19;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $25=$3;
      var $26=(($25)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=$5;
      var $29=(($28)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=(($27)|0) > (($30)|0);
      if ($31) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $33=$3;
      var $34=(($33)|0);
      var $35=HEAP32[(($34)>>2)];
      var $41 = $35;label = 10; break;
    case 9: 
      var $37=$5;
      var $38=(($37)|0);
      var $39=HEAP32[(($38)>>2)];
      var $41 = $39;label = 10; break;
    case 10: 
      var $41;
      $x1=$41;
      var $42=$3;
      var $43=(($42+8)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$5;
      var $46=(($45+8)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($44)|0) < (($47)|0);
      if ($48) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $50=$3;
      var $51=(($50+8)|0);
      var $52=HEAP32[(($51)>>2)];
      var $58 = $52;label = 13; break;
    case 12: 
      var $54=$5;
      var $55=(($54+8)|0);
      var $56=HEAP32[(($55)>>2)];
      var $58 = $56;label = 13; break;
    case 13: 
      var $58;
      $x2=$58;
      var $59=$x1;
      var $60=$x2;
      var $61=(($59)|0) < (($60)|0);
      if ($61) { label = 14; break; } else { label = 26; break; }
    case 14: 
      label = 15; break;
    case 15: 
      var $64=$2;
      var $65=(($64+16)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($66)|0)!=0;
      if ($67) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $69=$2;
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=(($71+4)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=$2;
      var $75=(($74+16)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=(($76)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=(($73)|0)==(($78)|0);
      if ($79) { label = 17; break; } else { label = 20; break; }
    case 17: 
      var $81=$2;
      var $82=_pixman_rect_alloc($81, 1);
      var $83=(($82)|0)!=0;
      if ($83) { label = 19; break; } else { label = 18; break; }
    case 18: 
      $1=0;
      label = 35; break;
    case 19: 
      var $86=$2;
      var $87=(($86+16)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=(($88+4)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$2;
      var $92=(($91+16)|0);
      var $93=HEAP32[(($92)>>2)];
      var $94=(($93+8)|0);
      var $95=$94;
      var $96=(($95+($90<<4))|0);
      $next_rect=$96;
      label = 20; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $99=$x1;
      var $100=$next_rect;
      var $101=(($100)|0);
      HEAP32[(($101)>>2)]=$99;
      var $102=$7;
      var $103=$next_rect;
      var $104=(($103+4)|0);
      HEAP32[(($104)>>2)]=$102;
      var $105=$x2;
      var $106=$next_rect;
      var $107=(($106+8)|0);
      HEAP32[(($107)>>2)]=$105;
      var $108=$8;
      var $109=$next_rect;
      var $110=(($109+12)|0);
      HEAP32[(($110)>>2)]=$108;
      var $111=$next_rect;
      var $112=(($111+16)|0);
      $next_rect=$112;
      label = 22; break;
    case 22: 
      var $114=$2;
      var $115=(($114+16)|0);
      var $116=HEAP32[(($115)>>2)];
      var $117=(($116+4)|0);
      var $118=HEAP32[(($117)>>2)];
      var $119=((($118)+(1))|0);
      HEAP32[(($117)>>2)]=$119;
      label = 23; break;
    case 23: 
      label = 24; break;
    case 24: 
      label = 25; break;
    case 25: 
      label = 26; break;
    case 26: 
      var $124=$3;
      var $125=(($124+8)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=$x2;
      var $128=(($126)|0)==(($127)|0);
      if ($128) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $130=$3;
      var $131=(($130+16)|0);
      $3=$131;
      label = 28; break;
    case 28: 
      var $133=$5;
      var $134=(($133+8)|0);
      var $135=HEAP32[(($134)>>2)];
      var $136=$x2;
      var $137=(($135)|0)==(($136)|0);
      if ($137) { label = 29; break; } else { label = 30; break; }
    case 29: 
      var $139=$5;
      var $140=(($139+16)|0);
      $5=$140;
      label = 30; break;
    case 30: 
      label = 31; break;
    case 31: 
      var $143=$3;
      var $144=$4;
      var $145=(($143)|0)!=(($144)|0);
      if ($145) { label = 32; break; } else { var $151 = 0;label = 33; break; }
    case 32: 
      var $147=$5;
      var $148=$6;
      var $149=(($147)|0)!=(($148)|0);
      var $151 = $149;label = 33; break;
    case 33: 
      var $151;
      if ($151) { label = 7; break; } else { label = 34; break; }
    case 34: 
      $1=1;
      label = 35; break;
    case 35: 
      var $154=$1;

      return $154;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region_intersect_o["X"]=1;

function _pixman_region32_intersect_rect($dest, $source, $x, $y, $width, $height) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 20)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);

  var $1;
  var $2;
  var $3;
  var $4;
  var $5;
  var $6;
  var $region=__stackBase__;
  $1=$dest;
  $2=$source;
  $3=$x;
  $4=$y;
  $5=$width;
  $6=$height;
  var $7=(($region+16)|0);
  HEAP32[(($7)>>2)]=0;
  var $8=$3;
  var $9=(($region)|0);
  var $10=(($9)|0);
  HEAP32[(($10)>>2)]=$8;
  var $11=$4;
  var $12=(($region)|0);
  var $13=(($12+4)|0);
  HEAP32[(($13)>>2)]=$11;
  var $14=$3;
  var $15=$5;
  var $16=((($14)+($15))|0);
  var $17=(($region)|0);
  var $18=(($17+8)|0);
  HEAP32[(($18)>>2)]=$16;
  var $19=$4;
  var $20=$6;
  var $21=((($19)+($20))|0);
  var $22=(($region)|0);
  var $23=(($22+12)|0);
  HEAP32[(($23)>>2)]=$21;
  var $24=$1;
  var $25=$2;
  var $26=_pixman_region32_intersect($24, $25, $region);
  STACKTOP = __stackBase__;
  return $26;
}


function _pixman_region32_union_rect($dest, $source, $x, $y, $width, $height) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 20)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $region=__stackBase__;
      $2=$dest;
      $3=$source;
      $4=$x;
      $5=$y;
      $6=$width;
      $7=$height;
      var $8=$4;
      var $9=(($region)|0);
      var $10=(($9)|0);
      HEAP32[(($10)>>2)]=$8;
      var $11=$5;
      var $12=(($region)|0);
      var $13=(($12+4)|0);
      HEAP32[(($13)>>2)]=$11;
      var $14=$4;
      var $15=$6;
      var $16=((($14)+($15))|0);
      var $17=(($region)|0);
      var $18=(($17+8)|0);
      HEAP32[(($18)>>2)]=$16;
      var $19=$5;
      var $20=$7;
      var $21=((($19)+($20))|0);
      var $22=(($region)|0);
      var $23=(($22+12)|0);
      HEAP32[(($23)>>2)]=$21;
      var $24=(($region)|0);
      var $25=(($24)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($region)|0);
      var $28=(($27+8)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=(($26)|0) < (($29)|0);
      if ($30) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $32=(($region)|0);
      var $33=(($32+4)|0);
      var $34=HEAP32[(($33)>>2)];
      var $35=(($region)|0);
      var $36=(($35+12)|0);
      var $37=HEAP32[(($36)>>2)];
      var $38=(($34)|0) < (($37)|0);
      if ($38) { label = 10; break; } else { label = 4; break; }
    case 4: 
      var $40=(($region)|0);
      var $41=(($40)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=(($region)|0);
      var $44=(($43+8)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=(($42)|0) > (($45)|0);
      if ($46) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $48=(($region)|0);
      var $49=(($48+4)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=(($region)|0);
      var $52=(($51+12)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=(($50)|0) > (($53)|0);
      if ($54) { label = 6; break; } else { label = 9; break; }
    case 6: 
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      label = 9; break;
    case 9: 
      var $59=$2;
      var $60=$3;
      var $61=_pixman_region32_copy($59, $60);
      $1=$61;
      label = 11; break;
    case 10: 
      var $63=(($region+16)|0);
      HEAP32[(($63)>>2)]=0;
      var $64=$2;
      var $65=$3;
      var $66=_pixman_region32_union($64, $65, $region);
      $1=$66;
      label = 11; break;
    case 11: 
      var $68=$1;
      STACKTOP = __stackBase__;
      return $68;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_union_rect["X"]=1;

function _pixman_region32_union($new_reg, $reg1, $reg2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$new_reg;
      $3=$reg1;
      $4=$reg2;
      var $5=$3;
      var $6=$4;
      var $7=(($5)|0)==(($6)|0);
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$2;
      var $10=$3;
      var $11=_pixman_region32_copy($9, $10);
      $1=$11;
      label = 49; break;
    case 4: 
      var $13=$3;
      var $14=(($13+16)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=(($15)|0)!=0;
      if ($16) { label = 5; break; } else { label = 11; break; }
    case 5: 
      var $18=$3;
      var $19=(($18+16)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=(($20+4)|0);
      var $22=HEAP32[(($21)>>2)];
      var $23=(($22)|0)!=0;
      if ($23) { label = 11; break; } else { label = 6; break; }
    case 6: 
      var $25=$3;
      var $26=(($25+16)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=HEAP32[((5242920)>>2)];
      var $29=(($27)|0)==(($28)|0);
      if ($29) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $31=$2;
      var $32=_pixman_break($31);
      $1=$32;
      label = 49; break;
    case 8: 
      var $34=$2;
      var $35=$4;
      var $36=(($34)|0)!=(($35)|0);
      if ($36) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $38=$2;
      var $39=$4;
      var $40=_pixman_region32_copy($38, $39);
      $1=$40;
      label = 49; break;
    case 10: 
      $1=1;
      label = 49; break;
    case 11: 
      var $43=$4;
      var $44=(($43+16)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=(($45)|0)!=0;
      if ($46) { label = 12; break; } else { label = 18; break; }
    case 12: 
      var $48=$4;
      var $49=(($48+16)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=(($50+4)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=(($52)|0)!=0;
      if ($53) { label = 18; break; } else { label = 13; break; }
    case 13: 
      var $55=$4;
      var $56=(($55+16)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=HEAP32[((5242920)>>2)];
      var $59=(($57)|0)==(($58)|0);
      if ($59) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $61=$2;
      var $62=_pixman_break($61);
      $1=$62;
      label = 49; break;
    case 15: 
      var $64=$2;
      var $65=$3;
      var $66=(($64)|0)!=(($65)|0);
      if ($66) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $68=$2;
      var $69=$3;
      var $70=_pixman_region32_copy($68, $69);
      $1=$70;
      label = 49; break;
    case 17: 
      $1=1;
      label = 49; break;
    case 18: 
      var $73=$3;
      var $74=(($73+16)|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=(($75)|0)!=0;
      if ($76) { label = 26; break; } else { label = 19; break; }
    case 19: 
      var $78=$3;
      var $79=(($78)|0);
      var $80=(($79)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=$4;
      var $83=(($82)|0);
      var $84=(($83)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=(($81)|0) <= (($85)|0);
      if ($86) { label = 20; break; } else { label = 26; break; }
    case 20: 
      var $88=$3;
      var $89=(($88)|0);
      var $90=(($89+8)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=$4;
      var $93=(($92)|0);
      var $94=(($93+8)|0);
      var $95=HEAP32[(($94)>>2)];
      var $96=(($91)|0) >= (($95)|0);
      if ($96) { label = 21; break; } else { label = 26; break; }
    case 21: 
      var $98=$3;
      var $99=(($98)|0);
      var $100=(($99+4)|0);
      var $101=HEAP32[(($100)>>2)];
      var $102=$4;
      var $103=(($102)|0);
      var $104=(($103+4)|0);
      var $105=HEAP32[(($104)>>2)];
      var $106=(($101)|0) <= (($105)|0);
      if ($106) { label = 22; break; } else { label = 26; break; }
    case 22: 
      var $108=$3;
      var $109=(($108)|0);
      var $110=(($109+12)|0);
      var $111=HEAP32[(($110)>>2)];
      var $112=$4;
      var $113=(($112)|0);
      var $114=(($113+12)|0);
      var $115=HEAP32[(($114)>>2)];
      var $116=(($111)|0) >= (($115)|0);
      if ($116) { label = 23; break; } else { label = 26; break; }
    case 23: 
      var $118=$2;
      var $119=$3;
      var $120=(($118)|0)!=(($119)|0);
      if ($120) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $122=$2;
      var $123=$3;
      var $124=_pixman_region32_copy($122, $123);
      $1=$124;
      label = 49; break;
    case 25: 
      $1=1;
      label = 49; break;
    case 26: 
      var $127=$4;
      var $128=(($127+16)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=(($129)|0)!=0;
      if ($130) { label = 34; break; } else { label = 27; break; }
    case 27: 
      var $132=$4;
      var $133=(($132)|0);
      var $134=(($133)|0);
      var $135=HEAP32[(($134)>>2)];
      var $136=$3;
      var $137=(($136)|0);
      var $138=(($137)|0);
      var $139=HEAP32[(($138)>>2)];
      var $140=(($135)|0) <= (($139)|0);
      if ($140) { label = 28; break; } else { label = 34; break; }
    case 28: 
      var $142=$4;
      var $143=(($142)|0);
      var $144=(($143+8)|0);
      var $145=HEAP32[(($144)>>2)];
      var $146=$3;
      var $147=(($146)|0);
      var $148=(($147+8)|0);
      var $149=HEAP32[(($148)>>2)];
      var $150=(($145)|0) >= (($149)|0);
      if ($150) { label = 29; break; } else { label = 34; break; }
    case 29: 
      var $152=$4;
      var $153=(($152)|0);
      var $154=(($153+4)|0);
      var $155=HEAP32[(($154)>>2)];
      var $156=$3;
      var $157=(($156)|0);
      var $158=(($157+4)|0);
      var $159=HEAP32[(($158)>>2)];
      var $160=(($155)|0) <= (($159)|0);
      if ($160) { label = 30; break; } else { label = 34; break; }
    case 30: 
      var $162=$4;
      var $163=(($162)|0);
      var $164=(($163+12)|0);
      var $165=HEAP32[(($164)>>2)];
      var $166=$3;
      var $167=(($166)|0);
      var $168=(($167+12)|0);
      var $169=HEAP32[(($168)>>2)];
      var $170=(($165)|0) >= (($169)|0);
      if ($170) { label = 31; break; } else { label = 34; break; }
    case 31: 
      var $172=$2;
      var $173=$4;
      var $174=(($172)|0)!=(($173)|0);
      if ($174) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $176=$2;
      var $177=$4;
      var $178=_pixman_region32_copy($176, $177);
      $1=$178;
      label = 49; break;
    case 33: 
      $1=1;
      label = 49; break;
    case 34: 
      var $181=$2;
      var $182=$3;
      var $183=$4;
      var $184=_pixman_op($181, $182, $183, 22, 1, 1);
      var $185=(($184)|0)!=0;
      if ($185) { label = 36; break; } else { label = 35; break; }
    case 35: 
      $1=0;
      label = 49; break;
    case 36: 
      var $188=$3;
      var $189=(($188)|0);
      var $190=(($189)|0);
      var $191=HEAP32[(($190)>>2)];
      var $192=$4;
      var $193=(($192)|0);
      var $194=(($193)|0);
      var $195=HEAP32[(($194)>>2)];
      var $196=(($191)|0) < (($195)|0);
      if ($196) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $198=$3;
      var $199=(($198)|0);
      var $200=(($199)|0);
      var $201=HEAP32[(($200)>>2)];
      var $208 = $201;label = 39; break;
    case 38: 
      var $203=$4;
      var $204=(($203)|0);
      var $205=(($204)|0);
      var $206=HEAP32[(($205)>>2)];
      var $208 = $206;label = 39; break;
    case 39: 
      var $208;
      var $209=$2;
      var $210=(($209)|0);
      var $211=(($210)|0);
      HEAP32[(($211)>>2)]=$208;
      var $212=$3;
      var $213=(($212)|0);
      var $214=(($213+4)|0);
      var $215=HEAP32[(($214)>>2)];
      var $216=$4;
      var $217=(($216)|0);
      var $218=(($217+4)|0);
      var $219=HEAP32[(($218)>>2)];
      var $220=(($215)|0) < (($219)|0);
      if ($220) { label = 40; break; } else { label = 41; break; }
    case 40: 
      var $222=$3;
      var $223=(($222)|0);
      var $224=(($223+4)|0);
      var $225=HEAP32[(($224)>>2)];
      var $232 = $225;label = 42; break;
    case 41: 
      var $227=$4;
      var $228=(($227)|0);
      var $229=(($228+4)|0);
      var $230=HEAP32[(($229)>>2)];
      var $232 = $230;label = 42; break;
    case 42: 
      var $232;
      var $233=$2;
      var $234=(($233)|0);
      var $235=(($234+4)|0);
      HEAP32[(($235)>>2)]=$232;
      var $236=$3;
      var $237=(($236)|0);
      var $238=(($237+8)|0);
      var $239=HEAP32[(($238)>>2)];
      var $240=$4;
      var $241=(($240)|0);
      var $242=(($241+8)|0);
      var $243=HEAP32[(($242)>>2)];
      var $244=(($239)|0) > (($243)|0);
      if ($244) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $246=$3;
      var $247=(($246)|0);
      var $248=(($247+8)|0);
      var $249=HEAP32[(($248)>>2)];
      var $256 = $249;label = 45; break;
    case 44: 
      var $251=$4;
      var $252=(($251)|0);
      var $253=(($252+8)|0);
      var $254=HEAP32[(($253)>>2)];
      var $256 = $254;label = 45; break;
    case 45: 
      var $256;
      var $257=$2;
      var $258=(($257)|0);
      var $259=(($258+8)|0);
      HEAP32[(($259)>>2)]=$256;
      var $260=$3;
      var $261=(($260)|0);
      var $262=(($261+12)|0);
      var $263=HEAP32[(($262)>>2)];
      var $264=$4;
      var $265=(($264)|0);
      var $266=(($265+12)|0);
      var $267=HEAP32[(($266)>>2)];
      var $268=(($263)|0) > (($267)|0);
      if ($268) { label = 46; break; } else { label = 47; break; }
    case 46: 
      var $270=$3;
      var $271=(($270)|0);
      var $272=(($271+12)|0);
      var $273=HEAP32[(($272)>>2)];
      var $280 = $273;label = 48; break;
    case 47: 
      var $275=$4;
      var $276=(($275)|0);
      var $277=(($276+12)|0);
      var $278=HEAP32[(($277)>>2)];
      var $280 = $278;label = 48; break;
    case 48: 
      var $280;
      var $281=$2;
      var $282=(($281)|0);
      var $283=(($282+12)|0);
      HEAP32[(($283)>>2)]=$280;
      $1=1;
      label = 49; break;
    case 49: 
      var $285=$1;

      return $285;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_union["X"]=1;

function _pixman_region_union_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $next_rect;
      var $x1;
      var $x2;
      $2=$region;
      $3=$r1;
      $4=$r1_end;
      $5=$r2;
      $6=$r2_end;
      $7=$y1;
      $8=$y2;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      label = 6; break;
    case 6: 
      var $13=$2;
      var $14=(($13+16)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=(($15+4)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=$2;
      var $19=(($18+16)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=(($20+8)|0);
      var $22=$21;
      var $23=(($22+($17<<4))|0);
      $next_rect=$23;
      var $24=$3;
      var $25=(($24)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=$5;
      var $28=(($27)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=(($26)|0) < (($29)|0);
      if ($30) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $32=$3;
      var $33=(($32)|0);
      var $34=HEAP32[(($33)>>2)];
      $x1=$34;
      var $35=$3;
      var $36=(($35+8)|0);
      var $37=HEAP32[(($36)>>2)];
      $x2=$37;
      var $38=$3;
      var $39=(($38+16)|0);
      $3=$39;
      label = 9; break;
    case 8: 
      var $41=$5;
      var $42=(($41)|0);
      var $43=HEAP32[(($42)>>2)];
      $x1=$43;
      var $44=$5;
      var $45=(($44+8)|0);
      var $46=HEAP32[(($45)>>2)];
      $x2=$46;
      var $47=$5;
      var $48=(($47+16)|0);
      $5=$48;
      label = 9; break;
    case 9: 
      label = 10; break;
    case 10: 
      var $51=$3;
      var $52=$4;
      var $53=(($51)|0)!=(($52)|0);
      if ($53) { label = 11; break; } else { var $59 = 0;label = 12; break; }
    case 11: 
      var $55=$5;
      var $56=$6;
      var $57=(($55)|0)!=(($56)|0);
      var $59 = $57;label = 12; break;
    case 12: 
      var $59;
      if ($59) { label = 13; break; } else { label = 53; break; }
    case 13: 
      var $61=$3;
      var $62=(($61)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=$5;
      var $65=(($64)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($63)|0) < (($66)|0);
      if ($67) { label = 14; break; } else { label = 33; break; }
    case 14: 
      label = 15; break;
    case 15: 
      var $70=$3;
      var $71=(($70)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=$x2;
      var $74=(($72)|0) <= (($73)|0);
      if ($74) { label = 16; break; } else { label = 19; break; }
    case 16: 
      var $76=$x2;
      var $77=$3;
      var $78=(($77+8)|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=(($76)|0) < (($79)|0);
      if ($80) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $82=$3;
      var $83=(($82+8)|0);
      var $84=HEAP32[(($83)>>2)];
      $x2=$84;
      label = 18; break;
    case 18: 
      label = 31; break;
    case 19: 
      label = 20; break;
    case 20: 
      var $88=$2;
      var $89=(($88+16)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=(($90)|0)!=0;
      if ($91) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $93=$2;
      var $94=(($93+16)|0);
      var $95=HEAP32[(($94)>>2)];
      var $96=(($95+4)|0);
      var $97=HEAP32[(($96)>>2)];
      var $98=$2;
      var $99=(($98+16)|0);
      var $100=HEAP32[(($99)>>2)];
      var $101=(($100)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=(($97)|0)==(($102)|0);
      if ($103) { label = 22; break; } else { label = 25; break; }
    case 22: 
      var $105=$2;
      var $106=_pixman_rect_alloc($105, 1);
      var $107=(($106)|0)!=0;
      if ($107) { label = 24; break; } else { label = 23; break; }
    case 23: 
      $1=0;
      label = 112; break;
    case 24: 
      var $110=$2;
      var $111=(($110+16)|0);
      var $112=HEAP32[(($111)>>2)];
      var $113=(($112+4)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$2;
      var $116=(($115+16)|0);
      var $117=HEAP32[(($116)>>2)];
      var $118=(($117+8)|0);
      var $119=$118;
      var $120=(($119+($114<<4))|0);
      $next_rect=$120;
      label = 25; break;
    case 25: 
      label = 26; break;
    case 26: 
      var $123=$x1;
      var $124=$next_rect;
      var $125=(($124)|0);
      HEAP32[(($125)>>2)]=$123;
      var $126=$7;
      var $127=$next_rect;
      var $128=(($127+4)|0);
      HEAP32[(($128)>>2)]=$126;
      var $129=$x2;
      var $130=$next_rect;
      var $131=(($130+8)|0);
      HEAP32[(($131)>>2)]=$129;
      var $132=$8;
      var $133=$next_rect;
      var $134=(($133+12)|0);
      HEAP32[(($134)>>2)]=$132;
      var $135=$next_rect;
      var $136=(($135+16)|0);
      $next_rect=$136;
      label = 27; break;
    case 27: 
      var $138=$2;
      var $139=(($138+16)|0);
      var $140=HEAP32[(($139)>>2)];
      var $141=(($140+4)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=((($142)+(1))|0);
      HEAP32[(($141)>>2)]=$143;
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      label = 30; break;
    case 30: 
      var $147=$3;
      var $148=(($147)|0);
      var $149=HEAP32[(($148)>>2)];
      $x1=$149;
      var $150=$3;
      var $151=(($150+8)|0);
      var $152=HEAP32[(($151)>>2)];
      $x2=$152;
      label = 31; break;
    case 31: 
      var $154=$3;
      var $155=(($154+16)|0);
      $3=$155;
      label = 32; break;
    case 32: 
      label = 52; break;
    case 33: 
      label = 34; break;
    case 34: 
      var $159=$5;
      var $160=(($159)|0);
      var $161=HEAP32[(($160)>>2)];
      var $162=$x2;
      var $163=(($161)|0) <= (($162)|0);
      if ($163) { label = 35; break; } else { label = 38; break; }
    case 35: 
      var $165=$x2;
      var $166=$5;
      var $167=(($166+8)|0);
      var $168=HEAP32[(($167)>>2)];
      var $169=(($165)|0) < (($168)|0);
      if ($169) { label = 36; break; } else { label = 37; break; }
    case 36: 
      var $171=$5;
      var $172=(($171+8)|0);
      var $173=HEAP32[(($172)>>2)];
      $x2=$173;
      label = 37; break;
    case 37: 
      label = 50; break;
    case 38: 
      label = 39; break;
    case 39: 
      var $177=$2;
      var $178=(($177+16)|0);
      var $179=HEAP32[(($178)>>2)];
      var $180=(($179)|0)!=0;
      if ($180) { label = 40; break; } else { label = 41; break; }
    case 40: 
      var $182=$2;
      var $183=(($182+16)|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=(($184+4)|0);
      var $186=HEAP32[(($185)>>2)];
      var $187=$2;
      var $188=(($187+16)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=(($189)|0);
      var $191=HEAP32[(($190)>>2)];
      var $192=(($186)|0)==(($191)|0);
      if ($192) { label = 41; break; } else { label = 44; break; }
    case 41: 
      var $194=$2;
      var $195=_pixman_rect_alloc($194, 1);
      var $196=(($195)|0)!=0;
      if ($196) { label = 43; break; } else { label = 42; break; }
    case 42: 
      $1=0;
      label = 112; break;
    case 43: 
      var $199=$2;
      var $200=(($199+16)|0);
      var $201=HEAP32[(($200)>>2)];
      var $202=(($201+4)|0);
      var $203=HEAP32[(($202)>>2)];
      var $204=$2;
      var $205=(($204+16)|0);
      var $206=HEAP32[(($205)>>2)];
      var $207=(($206+8)|0);
      var $208=$207;
      var $209=(($208+($203<<4))|0);
      $next_rect=$209;
      label = 44; break;
    case 44: 
      label = 45; break;
    case 45: 
      var $212=$x1;
      var $213=$next_rect;
      var $214=(($213)|0);
      HEAP32[(($214)>>2)]=$212;
      var $215=$7;
      var $216=$next_rect;
      var $217=(($216+4)|0);
      HEAP32[(($217)>>2)]=$215;
      var $218=$x2;
      var $219=$next_rect;
      var $220=(($219+8)|0);
      HEAP32[(($220)>>2)]=$218;
      var $221=$8;
      var $222=$next_rect;
      var $223=(($222+12)|0);
      HEAP32[(($223)>>2)]=$221;
      var $224=$next_rect;
      var $225=(($224+16)|0);
      $next_rect=$225;
      label = 46; break;
    case 46: 
      var $227=$2;
      var $228=(($227+16)|0);
      var $229=HEAP32[(($228)>>2)];
      var $230=(($229+4)|0);
      var $231=HEAP32[(($230)>>2)];
      var $232=((($231)+(1))|0);
      HEAP32[(($230)>>2)]=$232;
      label = 47; break;
    case 47: 
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      var $236=$5;
      var $237=(($236)|0);
      var $238=HEAP32[(($237)>>2)];
      $x1=$238;
      var $239=$5;
      var $240=(($239+8)|0);
      var $241=HEAP32[(($240)>>2)];
      $x2=$241;
      label = 50; break;
    case 50: 
      var $243=$5;
      var $244=(($243+16)|0);
      $5=$244;
      label = 51; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 10; break;
    case 53: 
      var $248=$3;
      var $249=$4;
      var $250=(($248)|0)!=(($249)|0);
      if ($250) { label = 54; break; } else { label = 76; break; }
    case 54: 
      label = 55; break;
    case 55: 
      label = 56; break;
    case 56: 
      var $254=$3;
      var $255=(($254)|0);
      var $256=HEAP32[(($255)>>2)];
      var $257=$x2;
      var $258=(($256)|0) <= (($257)|0);
      if ($258) { label = 57; break; } else { label = 60; break; }
    case 57: 
      var $260=$x2;
      var $261=$3;
      var $262=(($261+8)|0);
      var $263=HEAP32[(($262)>>2)];
      var $264=(($260)|0) < (($263)|0);
      if ($264) { label = 58; break; } else { label = 59; break; }
    case 58: 
      var $266=$3;
      var $267=(($266+8)|0);
      var $268=HEAP32[(($267)>>2)];
      $x2=$268;
      label = 59; break;
    case 59: 
      label = 72; break;
    case 60: 
      label = 61; break;
    case 61: 
      var $272=$2;
      var $273=(($272+16)|0);
      var $274=HEAP32[(($273)>>2)];
      var $275=(($274)|0)!=0;
      if ($275) { label = 62; break; } else { label = 63; break; }
    case 62: 
      var $277=$2;
      var $278=(($277+16)|0);
      var $279=HEAP32[(($278)>>2)];
      var $280=(($279+4)|0);
      var $281=HEAP32[(($280)>>2)];
      var $282=$2;
      var $283=(($282+16)|0);
      var $284=HEAP32[(($283)>>2)];
      var $285=(($284)|0);
      var $286=HEAP32[(($285)>>2)];
      var $287=(($281)|0)==(($286)|0);
      if ($287) { label = 63; break; } else { label = 66; break; }
    case 63: 
      var $289=$2;
      var $290=_pixman_rect_alloc($289, 1);
      var $291=(($290)|0)!=0;
      if ($291) { label = 65; break; } else { label = 64; break; }
    case 64: 
      $1=0;
      label = 112; break;
    case 65: 
      var $294=$2;
      var $295=(($294+16)|0);
      var $296=HEAP32[(($295)>>2)];
      var $297=(($296+4)|0);
      var $298=HEAP32[(($297)>>2)];
      var $299=$2;
      var $300=(($299+16)|0);
      var $301=HEAP32[(($300)>>2)];
      var $302=(($301+8)|0);
      var $303=$302;
      var $304=(($303+($298<<4))|0);
      $next_rect=$304;
      label = 66; break;
    case 66: 
      label = 67; break;
    case 67: 
      var $307=$x1;
      var $308=$next_rect;
      var $309=(($308)|0);
      HEAP32[(($309)>>2)]=$307;
      var $310=$7;
      var $311=$next_rect;
      var $312=(($311+4)|0);
      HEAP32[(($312)>>2)]=$310;
      var $313=$x2;
      var $314=$next_rect;
      var $315=(($314+8)|0);
      HEAP32[(($315)>>2)]=$313;
      var $316=$8;
      var $317=$next_rect;
      var $318=(($317+12)|0);
      HEAP32[(($318)>>2)]=$316;
      var $319=$next_rect;
      var $320=(($319+16)|0);
      $next_rect=$320;
      label = 68; break;
    case 68: 
      var $322=$2;
      var $323=(($322+16)|0);
      var $324=HEAP32[(($323)>>2)];
      var $325=(($324+4)|0);
      var $326=HEAP32[(($325)>>2)];
      var $327=((($326)+(1))|0);
      HEAP32[(($325)>>2)]=$327;
      label = 69; break;
    case 69: 
      label = 70; break;
    case 70: 
      label = 71; break;
    case 71: 
      var $331=$3;
      var $332=(($331)|0);
      var $333=HEAP32[(($332)>>2)];
      $x1=$333;
      var $334=$3;
      var $335=(($334+8)|0);
      var $336=HEAP32[(($335)>>2)];
      $x2=$336;
      label = 72; break;
    case 72: 
      var $338=$3;
      var $339=(($338+16)|0);
      $3=$339;
      label = 73; break;
    case 73: 
      label = 74; break;
    case 74: 
      var $342=$3;
      var $343=$4;
      var $344=(($342)|0)!=(($343)|0);
      if ($344) { label = 55; break; } else { label = 75; break; }
    case 75: 
      label = 100; break;
    case 76: 
      var $347=$5;
      var $348=$6;
      var $349=(($347)|0)!=(($348)|0);
      if ($349) { label = 77; break; } else { label = 99; break; }
    case 77: 
      label = 78; break;
    case 78: 
      label = 79; break;
    case 79: 
      var $353=$5;
      var $354=(($353)|0);
      var $355=HEAP32[(($354)>>2)];
      var $356=$x2;
      var $357=(($355)|0) <= (($356)|0);
      if ($357) { label = 80; break; } else { label = 83; break; }
    case 80: 
      var $359=$x2;
      var $360=$5;
      var $361=(($360+8)|0);
      var $362=HEAP32[(($361)>>2)];
      var $363=(($359)|0) < (($362)|0);
      if ($363) { label = 81; break; } else { label = 82; break; }
    case 81: 
      var $365=$5;
      var $366=(($365+8)|0);
      var $367=HEAP32[(($366)>>2)];
      $x2=$367;
      label = 82; break;
    case 82: 
      label = 95; break;
    case 83: 
      label = 84; break;
    case 84: 
      var $371=$2;
      var $372=(($371+16)|0);
      var $373=HEAP32[(($372)>>2)];
      var $374=(($373)|0)!=0;
      if ($374) { label = 85; break; } else { label = 86; break; }
    case 85: 
      var $376=$2;
      var $377=(($376+16)|0);
      var $378=HEAP32[(($377)>>2)];
      var $379=(($378+4)|0);
      var $380=HEAP32[(($379)>>2)];
      var $381=$2;
      var $382=(($381+16)|0);
      var $383=HEAP32[(($382)>>2)];
      var $384=(($383)|0);
      var $385=HEAP32[(($384)>>2)];
      var $386=(($380)|0)==(($385)|0);
      if ($386) { label = 86; break; } else { label = 89; break; }
    case 86: 
      var $388=$2;
      var $389=_pixman_rect_alloc($388, 1);
      var $390=(($389)|0)!=0;
      if ($390) { label = 88; break; } else { label = 87; break; }
    case 87: 
      $1=0;
      label = 112; break;
    case 88: 
      var $393=$2;
      var $394=(($393+16)|0);
      var $395=HEAP32[(($394)>>2)];
      var $396=(($395+4)|0);
      var $397=HEAP32[(($396)>>2)];
      var $398=$2;
      var $399=(($398+16)|0);
      var $400=HEAP32[(($399)>>2)];
      var $401=(($400+8)|0);
      var $402=$401;
      var $403=(($402+($397<<4))|0);
      $next_rect=$403;
      label = 89; break;
    case 89: 
      label = 90; break;
    case 90: 
      var $406=$x1;
      var $407=$next_rect;
      var $408=(($407)|0);
      HEAP32[(($408)>>2)]=$406;
      var $409=$7;
      var $410=$next_rect;
      var $411=(($410+4)|0);
      HEAP32[(($411)>>2)]=$409;
      var $412=$x2;
      var $413=$next_rect;
      var $414=(($413+8)|0);
      HEAP32[(($414)>>2)]=$412;
      var $415=$8;
      var $416=$next_rect;
      var $417=(($416+12)|0);
      HEAP32[(($417)>>2)]=$415;
      var $418=$next_rect;
      var $419=(($418+16)|0);
      $next_rect=$419;
      label = 91; break;
    case 91: 
      var $421=$2;
      var $422=(($421+16)|0);
      var $423=HEAP32[(($422)>>2)];
      var $424=(($423+4)|0);
      var $425=HEAP32[(($424)>>2)];
      var $426=((($425)+(1))|0);
      HEAP32[(($424)>>2)]=$426;
      label = 92; break;
    case 92: 
      label = 93; break;
    case 93: 
      label = 94; break;
    case 94: 
      var $430=$5;
      var $431=(($430)|0);
      var $432=HEAP32[(($431)>>2)];
      $x1=$432;
      var $433=$5;
      var $434=(($433+8)|0);
      var $435=HEAP32[(($434)>>2)];
      $x2=$435;
      label = 95; break;
    case 95: 
      var $437=$5;
      var $438=(($437+16)|0);
      $5=$438;
      label = 96; break;
    case 96: 
      label = 97; break;
    case 97: 
      var $441=$5;
      var $442=$6;
      var $443=(($441)|0)!=(($442)|0);
      if ($443) { label = 78; break; } else { label = 98; break; }
    case 98: 
      label = 99; break;
    case 99: 
      label = 100; break;
    case 100: 
      label = 101; break;
    case 101: 
      var $448=$2;
      var $449=(($448+16)|0);
      var $450=HEAP32[(($449)>>2)];
      var $451=(($450)|0)!=0;
      if ($451) { label = 102; break; } else { label = 103; break; }
    case 102: 
      var $453=$2;
      var $454=(($453+16)|0);
      var $455=HEAP32[(($454)>>2)];
      var $456=(($455+4)|0);
      var $457=HEAP32[(($456)>>2)];
      var $458=$2;
      var $459=(($458+16)|0);
      var $460=HEAP32[(($459)>>2)];
      var $461=(($460)|0);
      var $462=HEAP32[(($461)>>2)];
      var $463=(($457)|0)==(($462)|0);
      if ($463) { label = 103; break; } else { label = 106; break; }
    case 103: 
      var $465=$2;
      var $466=_pixman_rect_alloc($465, 1);
      var $467=(($466)|0)!=0;
      if ($467) { label = 105; break; } else { label = 104; break; }
    case 104: 
      $1=0;
      label = 112; break;
    case 105: 
      var $470=$2;
      var $471=(($470+16)|0);
      var $472=HEAP32[(($471)>>2)];
      var $473=(($472+4)|0);
      var $474=HEAP32[(($473)>>2)];
      var $475=$2;
      var $476=(($475+16)|0);
      var $477=HEAP32[(($476)>>2)];
      var $478=(($477+8)|0);
      var $479=$478;
      var $480=(($479+($474<<4))|0);
      $next_rect=$480;
      label = 106; break;
    case 106: 
      label = 107; break;
    case 107: 
      var $483=$x1;
      var $484=$next_rect;
      var $485=(($484)|0);
      HEAP32[(($485)>>2)]=$483;
      var $486=$7;
      var $487=$next_rect;
      var $488=(($487+4)|0);
      HEAP32[(($488)>>2)]=$486;
      var $489=$x2;
      var $490=$next_rect;
      var $491=(($490+8)|0);
      HEAP32[(($491)>>2)]=$489;
      var $492=$8;
      var $493=$next_rect;
      var $494=(($493+12)|0);
      HEAP32[(($494)>>2)]=$492;
      var $495=$next_rect;
      var $496=(($495+16)|0);
      $next_rect=$496;
      label = 108; break;
    case 108: 
      var $498=$2;
      var $499=(($498+16)|0);
      var $500=HEAP32[(($499)>>2)];
      var $501=(($500+4)|0);
      var $502=HEAP32[(($501)>>2)];
      var $503=((($502)+(1))|0);
      HEAP32[(($501)>>2)]=$503;
      label = 109; break;
    case 109: 
      label = 110; break;
    case 110: 
      label = 111; break;
    case 111: 
      $1=1;
      label = 112; break;
    case 112: 
      var $508=$1;

      return $508;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region_union_o["X"]=1;

function _pixman_region32_subtract($reg_d, $reg_m, $reg_s) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      $2=$reg_d;
      $3=$reg_m;
      $4=$reg_s;
      var $5=$3;
      var $6=(($5+16)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|0)!=0;
      if ($8) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $10=$3;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=(($14)|0)!=0;
      if ($15) { label = 4; break; } else { label = 10; break; }
    case 4: 
      var $17=$4;
      var $18=(($17+16)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=(($19)|0)!=0;
      if ($20) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $22=$4;
      var $23=(($22+16)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($26)|0)!=0;
      if ($27) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $29=$3;
      var $30=(($29)|0);
      var $31=(($30+8)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$4;
      var $34=(($33)|0);
      var $35=(($34)|0);
      var $36=HEAP32[(($35)>>2)];
      var $37=(($32)|0) <= (($36)|0);
      if ($37) { label = 10; break; } else { label = 7; break; }
    case 7: 
      var $39=$3;
      var $40=(($39)|0);
      var $41=(($40)|0);
      var $42=HEAP32[(($41)>>2)];
      var $43=$4;
      var $44=(($43)|0);
      var $45=(($44+8)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=(($42)|0) >= (($46)|0);
      if ($47) { label = 10; break; } else { label = 8; break; }
    case 8: 
      var $49=$3;
      var $50=(($49)|0);
      var $51=(($50+12)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=$4;
      var $54=(($53)|0);
      var $55=(($54+4)|0);
      var $56=HEAP32[(($55)>>2)];
      var $57=(($52)|0) <= (($56)|0);
      if ($57) { label = 10; break; } else { label = 9; break; }
    case 9: 
      var $59=$3;
      var $60=(($59)|0);
      var $61=(($60+4)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=$4;
      var $64=(($63)|0);
      var $65=(($64+12)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($62)|0) >= (($66)|0);
      if ($67) { label = 10; break; } else { label = 13; break; }
    case 10: 
      var $69=$4;
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=HEAP32[((5242920)>>2)];
      var $73=(($71)|0)==(($72)|0);
      if ($73) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $75=$2;
      var $76=_pixman_break($75);
      $1=$76;
      label = 22; break;
    case 12: 
      var $78=$2;
      var $79=$3;
      var $80=_pixman_region32_copy($78, $79);
      $1=$80;
      label = 22; break;
    case 13: 
      var $82=$3;
      var $83=$4;
      var $84=(($82)|0)==(($83)|0);
      if ($84) { label = 14; break; } else { label = 18; break; }
    case 14: 
      var $86=$2;
      var $87=(($86+16)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=(($88)|0)!=0;
      if ($89) { label = 15; break; } else { label = 17; break; }
    case 15: 
      var $91=$2;
      var $92=(($91+16)|0);
      var $93=HEAP32[(($92)>>2)];
      var $94=(($93)|0);
      var $95=HEAP32[(($94)>>2)];
      var $96=(($95)|0)!=0;
      if ($96) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $98=$2;
      var $99=(($98+16)|0);
      var $100=HEAP32[(($99)>>2)];
      var $101=$100;
      _free($101);
      label = 17; break;
    case 17: 
      var $103=$2;
      var $104=(($103)|0);
      var $105=(($104)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=$2;
      var $108=(($107)|0);
      var $109=(($108+8)|0);
      HEAP32[(($109)>>2)]=$106;
      var $110=$2;
      var $111=(($110)|0);
      var $112=(($111+4)|0);
      var $113=HEAP32[(($112)>>2)];
      var $114=$2;
      var $115=(($114)|0);
      var $116=(($115+12)|0);
      HEAP32[(($116)>>2)]=$113;
      var $117=HEAP32[((5242880)>>2)];
      var $118=$2;
      var $119=(($118+16)|0);
      HEAP32[(($119)>>2)]=$117;
      $1=1;
      label = 22; break;
    case 18: 
      label = 19; break;
    case 19: 
      var $122=$2;
      var $123=$3;
      var $124=$4;
      var $125=_pixman_op($122, $123, $124, 24, 1, 0);
      var $126=(($125)|0)!=0;
      if ($126) { label = 21; break; } else { label = 20; break; }
    case 20: 
      $1=0;
      label = 22; break;
    case 21: 
      var $129=$2;
      _pixman_set_extents($129);
      $1=1;
      label = 22; break;
    case 22: 
      var $131=$1;

      return $131;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_subtract["X"]=1;

function _pixman_region_subtract_o($region, $r1, $r1_end, $r2, $r2_end, $y1, $y2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $7;
      var $8;
      var $next_rect;
      var $x1;
      $2=$region;
      $3=$r1;
      $4=$r1_end;
      $5=$r2;
      $6=$r2_end;
      $7=$y1;
      $8=$y2;
      var $9=$3;
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      $x1=$11;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      label = 6; break;
    case 6: 
      var $16=$2;
      var $17=(($16+16)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=(($18+4)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=$2;
      var $22=(($21+16)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=(($23+8)|0);
      var $25=$24;
      var $26=(($25+($20<<4))|0);
      $next_rect=$26;
      label = 7; break;
    case 7: 
      var $28=$5;
      var $29=(($28+8)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$x1;
      var $32=(($30)|0) <= (($31)|0);
      if ($32) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $34=$5;
      var $35=(($34+16)|0);
      $5=$35;
      label = 54; break;
    case 9: 
      var $37=$5;
      var $38=(($37)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$x1;
      var $41=(($39)|0) <= (($40)|0);
      if ($41) { label = 10; break; } else { label = 16; break; }
    case 10: 
      var $43=$5;
      var $44=(($43+8)|0);
      var $45=HEAP32[(($44)>>2)];
      $x1=$45;
      var $46=$x1;
      var $47=$3;
      var $48=(($47+8)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=(($46)|0) >= (($49)|0);
      if ($50) { label = 11; break; } else { label = 14; break; }
    case 11: 
      var $52=$3;
      var $53=(($52+16)|0);
      $3=$53;
      var $54=$3;
      var $55=$4;
      var $56=(($54)|0)!=(($55)|0);
      if ($56) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $58=$3;
      var $59=(($58)|0);
      var $60=HEAP32[(($59)>>2)];
      $x1=$60;
      label = 13; break;
    case 13: 
      label = 15; break;
    case 14: 
      var $63=$5;
      var $64=(($63+16)|0);
      $5=$64;
      label = 15; break;
    case 15: 
      label = 53; break;
    case 16: 
      var $67=$5;
      var $68=(($67)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=$3;
      var $71=(($70+8)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=(($69)|0) < (($72)|0);
      if ($73) { label = 17; break; } else { label = 36; break; }
    case 17: 
      label = 18; break;
    case 18: 
      label = 19; break;
    case 19: 
      label = 20; break;
    case 20: 
      var $78=$2;
      var $79=(($78+16)|0);
      var $80=HEAP32[(($79)>>2)];
      var $81=(($80)|0)!=0;
      if ($81) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $83=$2;
      var $84=(($83+16)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=(($85+4)|0);
      var $87=HEAP32[(($86)>>2)];
      var $88=$2;
      var $89=(($88+16)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=(($90)|0);
      var $92=HEAP32[(($91)>>2)];
      var $93=(($87)|0)==(($92)|0);
      if ($93) { label = 22; break; } else { label = 25; break; }
    case 22: 
      var $95=$2;
      var $96=_pixman_rect_alloc($95, 1);
      var $97=(($96)|0)!=0;
      if ($97) { label = 24; break; } else { label = 23; break; }
    case 23: 
      $1=0;
      label = 77; break;
    case 24: 
      var $100=$2;
      var $101=(($100+16)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=(($102+4)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=$2;
      var $106=(($105+16)|0);
      var $107=HEAP32[(($106)>>2)];
      var $108=(($107+8)|0);
      var $109=$108;
      var $110=(($109+($104<<4))|0);
      $next_rect=$110;
      label = 25; break;
    case 25: 
      label = 26; break;
    case 26: 
      var $113=$x1;
      var $114=$next_rect;
      var $115=(($114)|0);
      HEAP32[(($115)>>2)]=$113;
      var $116=$7;
      var $117=$next_rect;
      var $118=(($117+4)|0);
      HEAP32[(($118)>>2)]=$116;
      var $119=$5;
      var $120=(($119)|0);
      var $121=HEAP32[(($120)>>2)];
      var $122=$next_rect;
      var $123=(($122+8)|0);
      HEAP32[(($123)>>2)]=$121;
      var $124=$8;
      var $125=$next_rect;
      var $126=(($125+12)|0);
      HEAP32[(($126)>>2)]=$124;
      var $127=$next_rect;
      var $128=(($127+16)|0);
      $next_rect=$128;
      label = 27; break;
    case 27: 
      var $130=$2;
      var $131=(($130+16)|0);
      var $132=HEAP32[(($131)>>2)];
      var $133=(($132+4)|0);
      var $134=HEAP32[(($133)>>2)];
      var $135=((($134)+(1))|0);
      HEAP32[(($133)>>2)]=$135;
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      label = 30; break;
    case 30: 
      var $139=$5;
      var $140=(($139+8)|0);
      var $141=HEAP32[(($140)>>2)];
      $x1=$141;
      var $142=$x1;
      var $143=$3;
      var $144=(($143+8)|0);
      var $145=HEAP32[(($144)>>2)];
      var $146=(($142)|0) >= (($145)|0);
      if ($146) { label = 31; break; } else { label = 34; break; }
    case 31: 
      var $148=$3;
      var $149=(($148+16)|0);
      $3=$149;
      var $150=$3;
      var $151=$4;
      var $152=(($150)|0)!=(($151)|0);
      if ($152) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $154=$3;
      var $155=(($154)|0);
      var $156=HEAP32[(($155)>>2)];
      $x1=$156;
      label = 33; break;
    case 33: 
      label = 35; break;
    case 34: 
      var $159=$5;
      var $160=(($159+16)|0);
      $5=$160;
      label = 35; break;
    case 35: 
      label = 52; break;
    case 36: 
      var $163=$3;
      var $164=(($163+8)|0);
      var $165=HEAP32[(($164)>>2)];
      var $166=$x1;
      var $167=(($165)|0) > (($166)|0);
      if ($167) { label = 37; break; } else { label = 49; break; }
    case 37: 
      label = 38; break;
    case 38: 
      var $170=$2;
      var $171=(($170+16)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=(($172)|0)!=0;
      if ($173) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $175=$2;
      var $176=(($175+16)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=(($177+4)|0);
      var $179=HEAP32[(($178)>>2)];
      var $180=$2;
      var $181=(($180+16)|0);
      var $182=HEAP32[(($181)>>2)];
      var $183=(($182)|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=(($179)|0)==(($184)|0);
      if ($185) { label = 40; break; } else { label = 43; break; }
    case 40: 
      var $187=$2;
      var $188=_pixman_rect_alloc($187, 1);
      var $189=(($188)|0)!=0;
      if ($189) { label = 42; break; } else { label = 41; break; }
    case 41: 
      $1=0;
      label = 77; break;
    case 42: 
      var $192=$2;
      var $193=(($192+16)|0);
      var $194=HEAP32[(($193)>>2)];
      var $195=(($194+4)|0);
      var $196=HEAP32[(($195)>>2)];
      var $197=$2;
      var $198=(($197+16)|0);
      var $199=HEAP32[(($198)>>2)];
      var $200=(($199+8)|0);
      var $201=$200;
      var $202=(($201+($196<<4))|0);
      $next_rect=$202;
      label = 43; break;
    case 43: 
      label = 44; break;
    case 44: 
      var $205=$x1;
      var $206=$next_rect;
      var $207=(($206)|0);
      HEAP32[(($207)>>2)]=$205;
      var $208=$7;
      var $209=$next_rect;
      var $210=(($209+4)|0);
      HEAP32[(($210)>>2)]=$208;
      var $211=$3;
      var $212=(($211+8)|0);
      var $213=HEAP32[(($212)>>2)];
      var $214=$next_rect;
      var $215=(($214+8)|0);
      HEAP32[(($215)>>2)]=$213;
      var $216=$8;
      var $217=$next_rect;
      var $218=(($217+12)|0);
      HEAP32[(($218)>>2)]=$216;
      var $219=$next_rect;
      var $220=(($219+16)|0);
      $next_rect=$220;
      label = 45; break;
    case 45: 
      var $222=$2;
      var $223=(($222+16)|0);
      var $224=HEAP32[(($223)>>2)];
      var $225=(($224+4)|0);
      var $226=HEAP32[(($225)>>2)];
      var $227=((($226)+(1))|0);
      HEAP32[(($225)>>2)]=$227;
      label = 46; break;
    case 46: 
      label = 47; break;
    case 47: 
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      var $232=$3;
      var $233=(($232+16)|0);
      $3=$233;
      var $234=$3;
      var $235=$4;
      var $236=(($234)|0)!=(($235)|0);
      if ($236) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $238=$3;
      var $239=(($238)|0);
      var $240=HEAP32[(($239)>>2)];
      $x1=$240;
      label = 51; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      label = 54; break;
    case 54: 
      label = 55; break;
    case 55: 
      var $246=$3;
      var $247=$4;
      var $248=(($246)|0)!=(($247)|0);
      if ($248) { label = 56; break; } else { var $254 = 0;label = 57; break; }
    case 56: 
      var $250=$5;
      var $251=$6;
      var $252=(($250)|0)!=(($251)|0);
      var $254 = $252;label = 57; break;
    case 57: 
      var $254;
      if ($254) { label = 7; break; } else { label = 58; break; }
    case 58: 
      label = 59; break;
    case 59: 
      var $257=$3;
      var $258=$4;
      var $259=(($257)|0)!=(($258)|0);
      if ($259) { label = 60; break; } else { label = 76; break; }
    case 60: 
      label = 61; break;
    case 61: 
      label = 62; break;
    case 62: 
      label = 63; break;
    case 63: 
      var $264=$2;
      var $265=(($264+16)|0);
      var $266=HEAP32[(($265)>>2)];
      var $267=(($266)|0)!=0;
      if ($267) { label = 64; break; } else { label = 65; break; }
    case 64: 
      var $269=$2;
      var $270=(($269+16)|0);
      var $271=HEAP32[(($270)>>2)];
      var $272=(($271+4)|0);
      var $273=HEAP32[(($272)>>2)];
      var $274=$2;
      var $275=(($274+16)|0);
      var $276=HEAP32[(($275)>>2)];
      var $277=(($276)|0);
      var $278=HEAP32[(($277)>>2)];
      var $279=(($273)|0)==(($278)|0);
      if ($279) { label = 65; break; } else { label = 68; break; }
    case 65: 
      var $281=$2;
      var $282=_pixman_rect_alloc($281, 1);
      var $283=(($282)|0)!=0;
      if ($283) { label = 67; break; } else { label = 66; break; }
    case 66: 
      $1=0;
      label = 77; break;
    case 67: 
      var $286=$2;
      var $287=(($286+16)|0);
      var $288=HEAP32[(($287)>>2)];
      var $289=(($288+4)|0);
      var $290=HEAP32[(($289)>>2)];
      var $291=$2;
      var $292=(($291+16)|0);
      var $293=HEAP32[(($292)>>2)];
      var $294=(($293+8)|0);
      var $295=$294;
      var $296=(($295+($290<<4))|0);
      $next_rect=$296;
      label = 68; break;
    case 68: 
      label = 69; break;
    case 69: 
      var $299=$x1;
      var $300=$next_rect;
      var $301=(($300)|0);
      HEAP32[(($301)>>2)]=$299;
      var $302=$7;
      var $303=$next_rect;
      var $304=(($303+4)|0);
      HEAP32[(($304)>>2)]=$302;
      var $305=$3;
      var $306=(($305+8)|0);
      var $307=HEAP32[(($306)>>2)];
      var $308=$next_rect;
      var $309=(($308+8)|0);
      HEAP32[(($309)>>2)]=$307;
      var $310=$8;
      var $311=$next_rect;
      var $312=(($311+12)|0);
      HEAP32[(($312)>>2)]=$310;
      var $313=$next_rect;
      var $314=(($313+16)|0);
      $next_rect=$314;
      label = 70; break;
    case 70: 
      var $316=$2;
      var $317=(($316+16)|0);
      var $318=HEAP32[(($317)>>2)];
      var $319=(($318+4)|0);
      var $320=HEAP32[(($319)>>2)];
      var $321=((($320)+(1))|0);
      HEAP32[(($319)>>2)]=$321;
      label = 71; break;
    case 71: 
      label = 72; break;
    case 72: 
      label = 73; break;
    case 73: 
      var $325=$3;
      var $326=(($325+16)|0);
      $3=$326;
      var $327=$3;
      var $328=$4;
      var $329=(($327)|0)!=(($328)|0);
      if ($329) { label = 74; break; } else { label = 75; break; }
    case 74: 
      var $331=$3;
      var $332=(($331)|0);
      var $333=HEAP32[(($332)>>2)];
      $x1=$333;
      label = 75; break;
    case 75: 
      label = 59; break;
    case 76: 
      $1=1;
      label = 77; break;
    case 77: 
      var $337=$1;

      return $337;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region_subtract_o["X"]=1;

function _pixman_region32_inverse($new_reg, $reg1, $inv_rect) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 20)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $inv_reg=__stackBase__;
      $2=$new_reg;
      $3=$reg1;
      $4=$inv_rect;
      var $5=$3;
      var $6=(($5+16)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=(($7)|0)!=0;
      if ($8) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $10=$3;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=(($14)|0)!=0;
      if ($15) { label = 4; break; } else { label = 8; break; }
    case 4: 
      var $17=$4;
      var $18=(($17+8)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=$3;
      var $21=(($20)|0);
      var $22=(($21)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=(($19)|0) <= (($23)|0);
      if ($24) { label = 8; break; } else { label = 5; break; }
    case 5: 
      var $26=$4;
      var $27=(($26)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$3;
      var $30=(($29)|0);
      var $31=(($30+8)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($28)|0) >= (($32)|0);
      if ($33) { label = 8; break; } else { label = 6; break; }
    case 6: 
      var $35=$4;
      var $36=(($35+12)|0);
      var $37=HEAP32[(($36)>>2)];
      var $38=$3;
      var $39=(($38)|0);
      var $40=(($39+4)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=(($37)|0) <= (($41)|0);
      if ($42) { label = 8; break; } else { label = 7; break; }
    case 7: 
      var $44=$4;
      var $45=(($44+4)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=$3;
      var $48=(($47)|0);
      var $49=(($48+12)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=(($46)|0) >= (($50)|0);
      if ($51) { label = 8; break; } else { label = 14; break; }
    case 8: 
      var $53=$3;
      var $54=(($53+16)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=HEAP32[((5242920)>>2)];
      var $57=(($55)|0)==(($56)|0);
      if ($57) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $59=$2;
      var $60=_pixman_break($59);
      $1=$60;
      label = 17; break;
    case 10: 
      var $62=$2;
      var $63=(($62)|0);
      var $64=$4;
      var $65=$63;
      var $66=$64;
      assert(16 % 1 === 0);HEAP32[(($65)>>2)]=HEAP32[(($66)>>2)];HEAP32[((($65)+(4))>>2)]=HEAP32[((($66)+(4))>>2)];HEAP32[((($65)+(8))>>2)]=HEAP32[((($66)+(8))>>2)];HEAP32[((($65)+(12))>>2)]=HEAP32[((($66)+(12))>>2)];
      var $67=$2;
      var $68=(($67+16)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=(($69)|0)!=0;
      if ($70) { label = 11; break; } else { label = 13; break; }
    case 11: 
      var $72=$2;
      var $73=(($72+16)|0);
      var $74=HEAP32[(($73)>>2)];
      var $75=(($74)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=(($76)|0)!=0;
      if ($77) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $79=$2;
      var $80=(($79+16)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=$81;
      _free($82);
      label = 13; break;
    case 13: 
      var $84=$2;
      var $85=(($84+16)|0);
      HEAP32[(($85)>>2)]=0;
      $1=1;
      label = 17; break;
    case 14: 
      var $87=(($inv_reg)|0);
      var $88=$4;
      var $89=$87;
      var $90=$88;
      assert(16 % 1 === 0);HEAP32[(($89)>>2)]=HEAP32[(($90)>>2)];HEAP32[((($89)+(4))>>2)]=HEAP32[((($90)+(4))>>2)];HEAP32[((($89)+(8))>>2)]=HEAP32[((($90)+(8))>>2)];HEAP32[((($89)+(12))>>2)]=HEAP32[((($90)+(12))>>2)];
      var $91=(($inv_reg+16)|0);
      HEAP32[(($91)>>2)]=0;
      var $92=$2;
      var $93=$3;
      var $94=_pixman_op($92, $inv_reg, $93, 24, 1, 0);
      var $95=(($94)|0)!=0;
      if ($95) { label = 16; break; } else { label = 15; break; }
    case 15: 
      $1=0;
      label = 17; break;
    case 16: 
      var $98=$2;
      _pixman_set_extents($98);
      $1=1;
      label = 17; break;
    case 17: 
      var $100=$1;
      STACKTOP = __stackBase__;
      return $100;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_inverse["X"]=1;

function _pixman_region32_contains_rectangle($region, $prect) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $pbox;
      var $pbox_end;
      var $part_in;
      var $part_out;
      var $numRects;
      var $x;
      var $y;
      $2=$region;
      $3=$prect;
      var $4=$2;
      var $5=(($4+16)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=(($6)|0)!=0;
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$2;
      var $10=(($9+16)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11+4)|0);
      var $13=HEAP32[(($12)>>2)];
      var $16 = $13;label = 5; break;
    case 4: 
      var $16 = 1;label = 5; break;
    case 5: 
      var $16;
      $numRects=$16;
      var $17=$numRects;
      var $18=(($17)|0)!=0;
      if ($18) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $20=$2;
      var $21=(($20)|0);
      var $22=(($21+8)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=$3;
      var $25=(($24)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($23)|0) <= (($26)|0);
      if ($27) { label = 10; break; } else { label = 7; break; }
    case 7: 
      var $29=$2;
      var $30=(($29)|0);
      var $31=(($30)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$3;
      var $34=(($33+8)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=(($32)|0) >= (($35)|0);
      if ($36) { label = 10; break; } else { label = 8; break; }
    case 8: 
      var $38=$2;
      var $39=(($38)|0);
      var $40=(($39+12)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=$3;
      var $43=(($42+4)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=(($41)|0) <= (($44)|0);
      if ($45) { label = 10; break; } else { label = 9; break; }
    case 9: 
      var $47=$2;
      var $48=(($47)|0);
      var $49=(($48+4)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=$3;
      var $52=(($51+12)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=(($50)|0) >= (($53)|0);
      if ($54) { label = 10; break; } else { label = 11; break; }
    case 10: 
      $1=0;
      label = 51; break;
    case 11: 
      var $57=$numRects;
      var $58=(($57)|0)==1;
      if ($58) { label = 12; break; } else { label = 18; break; }
    case 12: 
      var $60=$2;
      var $61=(($60)|0);
      var $62=(($61)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=$3;
      var $65=(($64)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($63)|0) <= (($66)|0);
      if ($67) { label = 13; break; } else { label = 17; break; }
    case 13: 
      var $69=$2;
      var $70=(($69)|0);
      var $71=(($70+8)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=$3;
      var $74=(($73+8)|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=(($72)|0) >= (($75)|0);
      if ($76) { label = 14; break; } else { label = 17; break; }
    case 14: 
      var $78=$2;
      var $79=(($78)|0);
      var $80=(($79+4)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=$3;
      var $83=(($82+4)|0);
      var $84=HEAP32[(($83)>>2)];
      var $85=(($81)|0) <= (($84)|0);
      if ($85) { label = 15; break; } else { label = 17; break; }
    case 15: 
      var $87=$2;
      var $88=(($87)|0);
      var $89=(($88+12)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$3;
      var $92=(($91+12)|0);
      var $93=HEAP32[(($92)>>2)];
      var $94=(($90)|0) >= (($93)|0);
      if ($94) { label = 16; break; } else { label = 17; break; }
    case 16: 
      $1=1;
      label = 51; break;
    case 17: 
      $1=2;
      label = 51; break;
    case 18: 
      $part_out=0;
      $part_in=0;
      var $98=$3;
      var $99=(($98)|0);
      var $100=HEAP32[(($99)>>2)];
      $x=$100;
      var $101=$3;
      var $102=(($101+4)|0);
      var $103=HEAP32[(($102)>>2)];
      $y=$103;
      var $104=$2;
      var $105=(($104+16)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=(($106+8)|0);
      var $108=$107;
      $pbox=$108;
      var $109=$pbox;
      var $110=$numRects;
      var $111=(($109+($110<<4))|0);
      $pbox_end=$111;
      label = 19; break;
    case 19: 
      var $113=$pbox;
      var $114=$pbox_end;
      var $115=(($113)|0)!=(($114)|0);
      if ($115) { label = 20; break; } else { label = 46; break; }
    case 20: 
      var $117=$pbox;
      var $118=(($117+12)|0);
      var $119=HEAP32[(($118)>>2)];
      var $120=$y;
      var $121=(($119)|0) <= (($120)|0);
      if ($121) { label = 21; break; } else { label = 24; break; }
    case 21: 
      var $123=$pbox;
      var $124=$pbox_end;
      var $125=$y;
      var $126=_find_box_for_y($123, $124, $125);
      $pbox=$126;
      var $127=$pbox_end;
      var $128=(($126)|0)==(($127)|0);
      if ($128) { label = 22; break; } else { label = 23; break; }
    case 22: 
      label = 46; break;
    case 23: 
      label = 24; break;
    case 24: 
      var $132=$pbox;
      var $133=(($132+4)|0);
      var $134=HEAP32[(($133)>>2)];
      var $135=$y;
      var $136=(($134)|0) > (($135)|0);
      if ($136) { label = 25; break; } else { label = 29; break; }
    case 25: 
      $part_out=1;
      var $138=$part_in;
      var $139=(($138)|0)!=0;
      if ($139) { label = 27; break; } else { label = 26; break; }
    case 26: 
      var $141=$pbox;
      var $142=(($141+4)|0);
      var $143=HEAP32[(($142)>>2)];
      var $144=$3;
      var $145=(($144+12)|0);
      var $146=HEAP32[(($145)>>2)];
      var $147=(($143)|0) >= (($146)|0);
      if ($147) { label = 27; break; } else { label = 28; break; }
    case 27: 
      label = 46; break;
    case 28: 
      var $150=$pbox;
      var $151=(($150+4)|0);
      var $152=HEAP32[(($151)>>2)];
      $y=$152;
      label = 29; break;
    case 29: 
      var $154=$pbox;
      var $155=(($154+8)|0);
      var $156=HEAP32[(($155)>>2)];
      var $157=$x;
      var $158=(($156)|0) <= (($157)|0);
      if ($158) { label = 30; break; } else { label = 31; break; }
    case 30: 
      label = 45; break;
    case 31: 
      var $161=$pbox;
      var $162=(($161)|0);
      var $163=HEAP32[(($162)>>2)];
      var $164=$x;
      var $165=(($163)|0) > (($164)|0);
      if ($165) { label = 32; break; } else { label = 35; break; }
    case 32: 
      $part_out=1;
      var $167=$part_in;
      var $168=(($167)|0)!=0;
      if ($168) { label = 33; break; } else { label = 34; break; }
    case 33: 
      label = 46; break;
    case 34: 
      label = 35; break;
    case 35: 
      var $172=$pbox;
      var $173=(($172)|0);
      var $174=HEAP32[(($173)>>2)];
      var $175=$3;
      var $176=(($175+8)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=(($174)|0) < (($177)|0);
      if ($178) { label = 36; break; } else { label = 39; break; }
    case 36: 
      $part_in=1;
      var $180=$part_out;
      var $181=(($180)|0)!=0;
      if ($181) { label = 37; break; } else { label = 38; break; }
    case 37: 
      label = 46; break;
    case 38: 
      label = 39; break;
    case 39: 
      var $185=$pbox;
      var $186=(($185+8)|0);
      var $187=HEAP32[(($186)>>2)];
      var $188=$3;
      var $189=(($188+8)|0);
      var $190=HEAP32[(($189)>>2)];
      var $191=(($187)|0) >= (($190)|0);
      if ($191) { label = 40; break; } else { label = 43; break; }
    case 40: 
      var $193=$pbox;
      var $194=(($193+12)|0);
      var $195=HEAP32[(($194)>>2)];
      $y=$195;
      var $196=$y;
      var $197=$3;
      var $198=(($197+12)|0);
      var $199=HEAP32[(($198)>>2)];
      var $200=(($196)|0) >= (($199)|0);
      if ($200) { label = 41; break; } else { label = 42; break; }
    case 41: 
      label = 46; break;
    case 42: 
      var $203=$3;
      var $204=(($203)|0);
      var $205=HEAP32[(($204)>>2)];
      $x=$205;
      label = 44; break;
    case 43: 
      $part_out=1;
      label = 46; break;
    case 44: 
      label = 45; break;
    case 45: 
      var $209=$pbox;
      var $210=(($209+16)|0);
      $pbox=$210;
      label = 19; break;
    case 46: 
      var $212=$part_in;
      var $213=(($212)|0)!=0;
      if ($213) { label = 47; break; } else { label = 50; break; }
    case 47: 
      var $215=$y;
      var $216=$3;
      var $217=(($216+12)|0);
      var $218=HEAP32[(($217)>>2)];
      var $219=(($215)|0) < (($218)|0);
      if ($219) { label = 48; break; } else { label = 49; break; }
    case 48: 
      $1=2;
      label = 51; break;
    case 49: 
      $1=1;
      label = 51; break;
    case 50: 
      $1=0;
      label = 51; break;
    case 51: 
      var $224=$1;

      return $224;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_contains_rectangle["X"]=1;

function _find_box_for_y($begin, $end, $y) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $mid;
      $2=$begin;
      $3=$end;
      $4=$y;
      var $5=$3;
      var $6=$2;
      var $7=(($5)|0)==(($6)|0);
      if ($7) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $9=$3;
      $1=$9;
      label = 11; break;
    case 4: 
      var $11=$3;
      var $12=$2;
      var $13=$11;
      var $14=$12;
      var $15=((($13)-($14))|0);
      var $16=((((($15)|0))/(16))&-1);
      var $17=(($16)|0)==1;
      if ($17) { label = 5; break; } else { label = 8; break; }
    case 5: 
      var $19=$2;
      var $20=(($19+12)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$4;
      var $23=(($21)|0) > (($22)|0);
      if ($23) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $25=$2;
      $1=$25;
      label = 11; break;
    case 7: 
      var $27=$3;
      $1=$27;
      label = 11; break;
    case 8: 
      var $29=$2;
      var $30=$3;
      var $31=$2;
      var $32=$30;
      var $33=$31;
      var $34=((($32)-($33))|0);
      var $35=((((($34)|0))/(16))&-1);
      var $36=((((($35)|0))/(2))&-1);
      var $37=(($29+($36<<4))|0);
      $mid=$37;
      var $38=$mid;
      var $39=(($38+12)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=$4;
      var $42=(($40)|0) > (($41)|0);
      if ($42) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $44=$2;
      var $45=$mid;
      var $46=$4;
      var $47=_find_box_for_y($44, $45, $46);
      $1=$47;
      label = 11; break;
    case 10: 
      var $49=$mid;
      var $50=$3;
      var $51=$4;
      var $52=_find_box_for_y($49, $50, $51);
      $1=$52;
      label = 11; break;
    case 11: 
      var $54=$1;

      return $54;
    default: assert(0, "bad label: " + label);
  }
}
_find_box_for_y["X"]=1;

function _pixman_region32_translate($region, $x, $y) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 32)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $x1=__stackBase__;
      var $x2=(__stackBase__)+(8);
      var $y1=(__stackBase__)+(16);
      var $y2=(__stackBase__)+(24);
      var $nbox;
      var $pbox;
      var $pbox_out;
      $1=$region;
      $2=$x;
      $3=$y;
      var $4=$1;
      var $5=(($4)|0);
      var $6=(($5)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$2;
      var $9=((($7)+($8))|0);
      var $10$0=$9;
      var $10$1=((($9)|0) < 0 ? -1 : 0);
      var $st$21$0=(($x1)|0);
      HEAP32[(($st$21$0)>>2)]=$10$0;
      var $st$21$1=(($x1+4)|0);
      HEAP32[(($st$21$1)>>2)]=$10$1;
      var $11$0=$10$0;
      var $11=$11$0;
      var $12=$1;
      var $13=(($12)|0);
      var $14=(($13)|0);
      HEAP32[(($14)>>2)]=$11;
      var $15=$1;
      var $16=(($15)|0);
      var $17=(($16+4)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=$3;
      var $20=((($18)+($19))|0);
      var $21$0=$20;
      var $21$1=((($20)|0) < 0 ? -1 : 0);
      var $st$39$0=(($y1)|0);
      HEAP32[(($st$39$0)>>2)]=$21$0;
      var $st$39$1=(($y1+4)|0);
      HEAP32[(($st$39$1)>>2)]=$21$1;
      var $22$0=$21$0;
      var $22=$22$0;
      var $23=$1;
      var $24=(($23)|0);
      var $25=(($24+4)|0);
      HEAP32[(($25)>>2)]=$22;
      var $26=$1;
      var $27=(($26)|0);
      var $28=(($27+8)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$2;
      var $31=((($29)+($30))|0);
      var $32$0=$31;
      var $32$1=((($31)|0) < 0 ? -1 : 0);
      var $st$57$0=(($x2)|0);
      HEAP32[(($st$57$0)>>2)]=$32$0;
      var $st$57$1=(($x2+4)|0);
      HEAP32[(($st$57$1)>>2)]=$32$1;
      var $33$0=$32$0;
      var $33=$33$0;
      var $34=$1;
      var $35=(($34)|0);
      var $36=(($35+8)|0);
      HEAP32[(($36)>>2)]=$33;
      var $37=$1;
      var $38=(($37)|0);
      var $39=(($38+12)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=$3;
      var $42=((($40)+($41))|0);
      var $43$0=$42;
      var $43$1=((($42)|0) < 0 ? -1 : 0);
      var $st$75$0=(($y2)|0);
      HEAP32[(($st$75$0)>>2)]=$43$0;
      var $st$75$1=(($y2+4)|0);
      HEAP32[(($st$75$1)>>2)]=$43$1;
      var $44$0=$43$0;
      var $44=$44$0;
      var $45=$1;
      var $46=(($45)|0);
      var $47=(($46+12)|0);
      HEAP32[(($47)>>2)]=$44;
      var $st$85$0=(($x1)|0);
      var $48$0=HEAP32[(($st$85$0)>>2)];
      var $st$85$1=(($x1+4)|0);
      var $48$1=HEAP32[(($st$85$1)>>2)];
      var $$etemp$0$0=-2147483648;
      var $$etemp$0$1=-1;
      var $49$0 = (i64Math.subtract($48$0,$48$1,$$etemp$0$0,$$etemp$0$1),HEAP32[((tempDoublePtr)>>2)]); var $49$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $st$92$0=(($y1)|0);
      var $50$0=HEAP32[(($st$92$0)>>2)];
      var $st$92$1=(($y1+4)|0);
      var $50$1=HEAP32[(($st$92$1)>>2)];
      var $$etemp$1$0=-2147483648;
      var $$etemp$1$1=-1;
      var $51$0 = (i64Math.subtract($50$0,$50$1,$$etemp$1$0,$$etemp$1$1),HEAP32[((tempDoublePtr)>>2)]); var $51$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $52$0=$49$0 | $51$0;
      var $52$1=$49$1 | $51$1;
      var $st$101$0=(($x2)|0);
      var $53$0=HEAP32[(($st$101$0)>>2)];
      var $st$101$1=(($x2+4)|0);
      var $53$1=HEAP32[(($st$101$1)>>2)];
      var $$etemp$2$0=2147483647;
      var $$etemp$2$1=0;
      var $54$0 = (i64Math.subtract($$etemp$2$0,$$etemp$2$1,$53$0,$53$1),HEAP32[((tempDoublePtr)>>2)]); var $54$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $55$0=$52$0 | $54$0;
      var $55$1=$52$1 | $54$1;
      var $st$110$0=(($y2)|0);
      var $56$0=HEAP32[(($st$110$0)>>2)];
      var $st$110$1=(($y2+4)|0);
      var $56$1=HEAP32[(($st$110$1)>>2)];
      var $$etemp$3$0=2147483647;
      var $$etemp$3$1=0;
      var $57$0 = (i64Math.subtract($$etemp$3$0,$$etemp$3$1,$56$0,$56$1),HEAP32[((tempDoublePtr)>>2)]); var $57$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $58$0=$55$0 | $57$0;
      var $58$1=$55$1 | $57$1;
      var $$etemp$4$0=0;
      var $$etemp$4$1=0;
      var $59=(($58$1|0) >= ($$etemp$4$1|0)) & (((($58$1|0) >  ($$etemp$4$1|0)) | ($58$0>>>0) >= ($$etemp$4$0>>>0)));
      if ($59) { label = 3; break; } else { label = 11; break; }
    case 3: 
      var $61=$1;
      var $62=(($61+16)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=(($63)|0)!=0;
      if ($64) { label = 4; break; } else { label = 10; break; }
    case 4: 
      var $66=$1;
      var $67=(($66+16)|0);
      var $68=HEAP32[(($67)>>2)];
      var $69=(($68+4)|0);
      var $70=HEAP32[(($69)>>2)];
      $nbox=$70;
      var $71=(($70)|0)!=0;
      if ($71) { label = 5; break; } else { label = 10; break; }
    case 5: 
      var $73=$1;
      var $74=(($73+16)|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=(($75+8)|0);
      var $77=$76;
      $pbox=$77;
      label = 6; break;
    case 6: 
      var $79=$nbox;
      var $80=((($79)-(1))|0);
      $nbox=$80;
      var $81=(($79)|0)!=0;
      if ($81) { label = 7; break; } else { label = 9; break; }
    case 7: 
      var $83=$2;
      var $84=$pbox;
      var $85=(($84)|0);
      var $86=HEAP32[(($85)>>2)];
      var $87=((($86)+($83))|0);
      HEAP32[(($85)>>2)]=$87;
      var $88=$3;
      var $89=$pbox;
      var $90=(($89+4)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=((($91)+($88))|0);
      HEAP32[(($90)>>2)]=$92;
      var $93=$2;
      var $94=$pbox;
      var $95=(($94+8)|0);
      var $96=HEAP32[(($95)>>2)];
      var $97=((($96)+($93))|0);
      HEAP32[(($95)>>2)]=$97;
      var $98=$3;
      var $99=$pbox;
      var $100=(($99+12)|0);
      var $101=HEAP32[(($100)>>2)];
      var $102=((($101)+($98))|0);
      HEAP32[(($100)>>2)]=$102;
      label = 8; break;
    case 8: 
      var $104=$pbox;
      var $105=(($104+16)|0);
      $pbox=$105;
      label = 6; break;
    case 9: 
      label = 10; break;
    case 10: 
      label = 53; break;
    case 11: 
      var $st$0$0=(($x2)|0);
      var $109$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($x2+4)|0);
      var $109$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$5$0=-2147483648;
      var $$etemp$5$1=-1;
      var $110$0 = (i64Math.subtract($109$0,$109$1,$$etemp$5$0,$$etemp$5$1),HEAP32[((tempDoublePtr)>>2)]); var $110$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $st$7$0=(($y2)|0);
      var $111$0=HEAP32[(($st$7$0)>>2)];
      var $st$7$1=(($y2+4)|0);
      var $111$1=HEAP32[(($st$7$1)>>2)];
      var $$etemp$6$0=-2147483648;
      var $$etemp$6$1=-1;
      var $112$0 = (i64Math.subtract($111$0,$111$1,$$etemp$6$0,$$etemp$6$1),HEAP32[((tempDoublePtr)>>2)]); var $112$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $113$0=$110$0 | $112$0;
      var $113$1=$110$1 | $112$1;
      var $st$16$0=(($x1)|0);
      var $114$0=HEAP32[(($st$16$0)>>2)];
      var $st$16$1=(($x1+4)|0);
      var $114$1=HEAP32[(($st$16$1)>>2)];
      var $$etemp$7$0=2147483647;
      var $$etemp$7$1=0;
      var $115$0 = (i64Math.subtract($$etemp$7$0,$$etemp$7$1,$114$0,$114$1),HEAP32[((tempDoublePtr)>>2)]); var $115$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $116$0=$113$0 | $115$0;
      var $116$1=$113$1 | $115$1;
      var $st$25$0=(($y1)|0);
      var $117$0=HEAP32[(($st$25$0)>>2)];
      var $st$25$1=(($y1+4)|0);
      var $117$1=HEAP32[(($st$25$1)>>2)];
      var $$etemp$8$0=2147483647;
      var $$etemp$8$1=0;
      var $118$0 = (i64Math.subtract($$etemp$8$0,$$etemp$8$1,$117$0,$117$1),HEAP32[((tempDoublePtr)>>2)]); var $118$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $119$0=$116$0 | $118$0;
      var $119$1=$116$1 | $118$1;
      var $$etemp$9$0=0;
      var $$etemp$9$1=0;
      var $120=(($119$1|0) <= ($$etemp$9$1|0)) & (((($119$1|0) <  ($$etemp$9$1|0)) | ($119$0>>>0) <= ($$etemp$9$0>>>0)));
      if ($120) { label = 12; break; } else { label = 16; break; }
    case 12: 
      var $122=$1;
      var $123=(($122)|0);
      var $124=(($123)|0);
      var $125=HEAP32[(($124)>>2)];
      var $126=$1;
      var $127=(($126)|0);
      var $128=(($127+8)|0);
      HEAP32[(($128)>>2)]=$125;
      var $129=$1;
      var $130=(($129)|0);
      var $131=(($130+4)|0);
      var $132=HEAP32[(($131)>>2)];
      var $133=$1;
      var $134=(($133)|0);
      var $135=(($134+12)|0);
      HEAP32[(($135)>>2)]=$132;
      var $136=$1;
      var $137=(($136+16)|0);
      var $138=HEAP32[(($137)>>2)];
      var $139=(($138)|0)!=0;
      if ($139) { label = 13; break; } else { label = 15; break; }
    case 13: 
      var $141=$1;
      var $142=(($141+16)|0);
      var $143=HEAP32[(($142)>>2)];
      var $144=(($143)|0);
      var $145=HEAP32[(($144)>>2)];
      var $146=(($145)|0)!=0;
      if ($146) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $148=$1;
      var $149=(($148+16)|0);
      var $150=HEAP32[(($149)>>2)];
      var $151=$150;
      _free($151);
      label = 15; break;
    case 15: 
      var $153=HEAP32[((5242880)>>2)];
      var $154=$1;
      var $155=(($154+16)|0);
      HEAP32[(($155)>>2)]=$153;
      label = 53; break;
    case 16: 
      var $st$0$0=(($x1)|0);
      var $157$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($x1+4)|0);
      var $157$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$10$0=-2147483648;
      var $$etemp$10$1=-1;
      var $158=(($157$1|0) < ($$etemp$10$1|0)) | (((($157$1|0) == ($$etemp$10$1|0) & ($157$0>>>0) <  ($$etemp$10$0>>>0))));
      if ($158) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $160=$1;
      var $161=(($160)|0);
      var $162=(($161)|0);
      HEAP32[(($162)>>2)]=-2147483648;
      label = 21; break;
    case 18: 
      var $st$0$0=(($x2)|0);
      var $164$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($x2+4)|0);
      var $164$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$11$0=2147483647;
      var $$etemp$11$1=0;
      var $165=(($164$1|0) > ($$etemp$11$1|0)) | (((($164$1|0) == ($$etemp$11$1|0) & ($164$0>>>0) >  ($$etemp$11$0>>>0))));
      if ($165) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $167=$1;
      var $168=(($167)|0);
      var $169=(($168+8)|0);
      HEAP32[(($169)>>2)]=2147483647;
      label = 20; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $st$0$0=(($y1)|0);
      var $172$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($y1+4)|0);
      var $172$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$12$0=-2147483648;
      var $$etemp$12$1=-1;
      var $173=(($172$1|0) < ($$etemp$12$1|0)) | (((($172$1|0) == ($$etemp$12$1|0) & ($172$0>>>0) <  ($$etemp$12$0>>>0))));
      if ($173) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $175=$1;
      var $176=(($175)|0);
      var $177=(($176+4)|0);
      HEAP32[(($177)>>2)]=-2147483648;
      label = 26; break;
    case 23: 
      var $st$0$0=(($y2)|0);
      var $179$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($y2+4)|0);
      var $179$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$13$0=2147483647;
      var $$etemp$13$1=0;
      var $180=(($179$1|0) > ($$etemp$13$1|0)) | (((($179$1|0) == ($$etemp$13$1|0) & ($179$0>>>0) >  ($$etemp$13$0>>>0))));
      if ($180) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $182=$1;
      var $183=(($182)|0);
      var $184=(($183+12)|0);
      HEAP32[(($184)>>2)]=2147483647;
      label = 25; break;
    case 25: 
      label = 26; break;
    case 26: 
      var $187=$1;
      var $188=(($187+16)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=(($189)|0)!=0;
      if ($190) { label = 27; break; } else { label = 53; break; }
    case 27: 
      var $192=$1;
      var $193=(($192+16)|0);
      var $194=HEAP32[(($193)>>2)];
      var $195=(($194+4)|0);
      var $196=HEAP32[(($195)>>2)];
      $nbox=$196;
      var $197=(($196)|0)!=0;
      if ($197) { label = 28; break; } else { label = 53; break; }
    case 28: 
      var $199=$1;
      var $200=(($199+16)|0);
      var $201=HEAP32[(($200)>>2)];
      var $202=(($201+8)|0);
      var $203=$202;
      $pbox=$203;
      $pbox_out=$203;
      label = 29; break;
    case 29: 
      var $205=$nbox;
      var $206=((($205)-(1))|0);
      $nbox=$206;
      var $207=(($205)|0)!=0;
      if ($207) { label = 30; break; } else { label = 44; break; }
    case 30: 
      var $209=$pbox;
      var $210=(($209)|0);
      var $211=HEAP32[(($210)>>2)];
      var $212=$2;
      var $213=((($211)+($212))|0);
      var $214$0=$213;
      var $214$1=((($213)|0) < 0 ? -1 : 0);
      var $st$7$0=(($x1)|0);
      HEAP32[(($st$7$0)>>2)]=$214$0;
      var $st$7$1=(($x1+4)|0);
      HEAP32[(($st$7$1)>>2)]=$214$1;
      var $215$0=$214$0;
      var $215=$215$0;
      var $216=$pbox_out;
      var $217=(($216)|0);
      HEAP32[(($217)>>2)]=$215;
      var $218=$pbox;
      var $219=(($218+4)|0);
      var $220=HEAP32[(($219)>>2)];
      var $221=$3;
      var $222=((($220)+($221))|0);
      var $223$0=$222;
      var $223$1=((($222)|0) < 0 ? -1 : 0);
      var $st$23$0=(($y1)|0);
      HEAP32[(($st$23$0)>>2)]=$223$0;
      var $st$23$1=(($y1+4)|0);
      HEAP32[(($st$23$1)>>2)]=$223$1;
      var $224$0=$223$0;
      var $224=$224$0;
      var $225=$pbox_out;
      var $226=(($225+4)|0);
      HEAP32[(($226)>>2)]=$224;
      var $227=$pbox;
      var $228=(($227+8)|0);
      var $229=HEAP32[(($228)>>2)];
      var $230=$2;
      var $231=((($229)+($230))|0);
      var $232$0=$231;
      var $232$1=((($231)|0) < 0 ? -1 : 0);
      var $st$39$0=(($x2)|0);
      HEAP32[(($st$39$0)>>2)]=$232$0;
      var $st$39$1=(($x2+4)|0);
      HEAP32[(($st$39$1)>>2)]=$232$1;
      var $233$0=$232$0;
      var $233=$233$0;
      var $234=$pbox_out;
      var $235=(($234+8)|0);
      HEAP32[(($235)>>2)]=$233;
      var $236=$pbox;
      var $237=(($236+12)|0);
      var $238=HEAP32[(($237)>>2)];
      var $239=$3;
      var $240=((($238)+($239))|0);
      var $241$0=$240;
      var $241$1=((($240)|0) < 0 ? -1 : 0);
      var $st$55$0=(($y2)|0);
      HEAP32[(($st$55$0)>>2)]=$241$0;
      var $st$55$1=(($y2+4)|0);
      HEAP32[(($st$55$1)>>2)]=$241$1;
      var $242$0=$241$0;
      var $242=$242$0;
      var $243=$pbox_out;
      var $244=(($243+12)|0);
      HEAP32[(($244)>>2)]=$242;
      var $st$64$0=(($x2)|0);
      var $245$0=HEAP32[(($st$64$0)>>2)];
      var $st$64$1=(($x2+4)|0);
      var $245$1=HEAP32[(($st$64$1)>>2)];
      var $$etemp$14$0=-2147483648;
      var $$etemp$14$1=-1;
      var $246$0 = (i64Math.subtract($245$0,$245$1,$$etemp$14$0,$$etemp$14$1),HEAP32[((tempDoublePtr)>>2)]); var $246$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $st$71$0=(($y2)|0);
      var $247$0=HEAP32[(($st$71$0)>>2)];
      var $st$71$1=(($y2+4)|0);
      var $247$1=HEAP32[(($st$71$1)>>2)];
      var $$etemp$15$0=-2147483648;
      var $$etemp$15$1=-1;
      var $248$0 = (i64Math.subtract($247$0,$247$1,$$etemp$15$0,$$etemp$15$1),HEAP32[((tempDoublePtr)>>2)]); var $248$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $249$0=$246$0 | $248$0;
      var $249$1=$246$1 | $248$1;
      var $st$80$0=(($x1)|0);
      var $250$0=HEAP32[(($st$80$0)>>2)];
      var $st$80$1=(($x1+4)|0);
      var $250$1=HEAP32[(($st$80$1)>>2)];
      var $$etemp$16$0=2147483647;
      var $$etemp$16$1=0;
      var $251$0 = (i64Math.subtract($$etemp$16$0,$$etemp$16$1,$250$0,$250$1),HEAP32[((tempDoublePtr)>>2)]); var $251$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $252$0=$249$0 | $251$0;
      var $252$1=$249$1 | $251$1;
      var $st$89$0=(($y1)|0);
      var $253$0=HEAP32[(($st$89$0)>>2)];
      var $st$89$1=(($y1+4)|0);
      var $253$1=HEAP32[(($st$89$1)>>2)];
      var $$etemp$17$0=2147483647;
      var $$etemp$17$1=0;
      var $254$0 = (i64Math.subtract($$etemp$17$0,$$etemp$17$1,$253$0,$253$1),HEAP32[((tempDoublePtr)>>2)]); var $254$1 = HEAP32[(((tempDoublePtr)+(4))>>2)];
      var $255$0=$252$0 | $254$0;
      var $255$1=$252$1 | $254$1;
      var $$etemp$18$0=0;
      var $$etemp$18$1=0;
      var $256=(($255$1|0) <= ($$etemp$18$1|0)) & (((($255$1|0) <  ($$etemp$18$1|0)) | ($255$0>>>0) <= ($$etemp$18$0>>>0)));
      if ($256) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $258=$1;
      var $259=(($258+16)|0);
      var $260=HEAP32[(($259)>>2)];
      var $261=(($260+4)|0);
      var $262=HEAP32[(($261)>>2)];
      var $263=((($262)-(1))|0);
      HEAP32[(($261)>>2)]=$263;
      label = 43; break;
    case 32: 
      var $st$0$0=(($x1)|0);
      var $265$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($x1+4)|0);
      var $265$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$19$0=-2147483648;
      var $$etemp$19$1=-1;
      var $266=(($265$1|0) < ($$etemp$19$1|0)) | (((($265$1|0) == ($$etemp$19$1|0) & ($265$0>>>0) <  ($$etemp$19$0>>>0))));
      if ($266) { label = 33; break; } else { label = 34; break; }
    case 33: 
      var $268=$pbox_out;
      var $269=(($268)|0);
      HEAP32[(($269)>>2)]=-2147483648;
      label = 37; break;
    case 34: 
      var $st$0$0=(($x2)|0);
      var $271$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($x2+4)|0);
      var $271$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$20$0=2147483647;
      var $$etemp$20$1=0;
      var $272=(($271$1|0) > ($$etemp$20$1|0)) | (((($271$1|0) == ($$etemp$20$1|0) & ($271$0>>>0) >  ($$etemp$20$0>>>0))));
      if ($272) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $274=$pbox_out;
      var $275=(($274+8)|0);
      HEAP32[(($275)>>2)]=2147483647;
      label = 36; break;
    case 36: 
      label = 37; break;
    case 37: 
      var $st$0$0=(($y1)|0);
      var $278$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($y1+4)|0);
      var $278$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$21$0=-2147483648;
      var $$etemp$21$1=-1;
      var $279=(($278$1|0) < ($$etemp$21$1|0)) | (((($278$1|0) == ($$etemp$21$1|0) & ($278$0>>>0) <  ($$etemp$21$0>>>0))));
      if ($279) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $281=$pbox_out;
      var $282=(($281+4)|0);
      HEAP32[(($282)>>2)]=-2147483648;
      label = 42; break;
    case 39: 
      var $st$0$0=(($y2)|0);
      var $284$0=HEAP32[(($st$0$0)>>2)];
      var $st$0$1=(($y2+4)|0);
      var $284$1=HEAP32[(($st$0$1)>>2)];
      var $$etemp$22$0=2147483647;
      var $$etemp$22$1=0;
      var $285=(($284$1|0) > ($$etemp$22$1|0)) | (((($284$1|0) == ($$etemp$22$1|0) & ($284$0>>>0) >  ($$etemp$22$0>>>0))));
      if ($285) { label = 40; break; } else { label = 41; break; }
    case 40: 
      var $287=$pbox_out;
      var $288=(($287+12)|0);
      HEAP32[(($288)>>2)]=2147483647;
      label = 41; break;
    case 41: 
      label = 42; break;
    case 42: 
      var $291=$pbox_out;
      var $292=(($291+16)|0);
      $pbox_out=$292;
      label = 43; break;
    case 43: 
      var $294=$pbox;
      var $295=(($294+16)|0);
      $pbox=$295;
      label = 29; break;
    case 44: 
      var $297=$pbox_out;
      var $298=$pbox;
      var $299=(($297)|0)!=(($298)|0);
      if ($299) { label = 45; break; } else { label = 52; break; }
    case 45: 
      var $301=$1;
      var $302=(($301+16)|0);
      var $303=HEAP32[(($302)>>2)];
      var $304=(($303+4)|0);
      var $305=HEAP32[(($304)>>2)];
      var $306=(($305)|0)==1;
      if ($306) { label = 46; break; } else { label = 50; break; }
    case 46: 
      var $308=$1;
      var $309=(($308)|0);
      var $310=$1;
      var $311=(($310+16)|0);
      var $312=HEAP32[(($311)>>2)];
      var $313=(($312+8)|0);
      var $314=$313;
      var $315=$309;
      var $316=$314;
      assert(16 % 1 === 0);HEAP32[(($315)>>2)]=HEAP32[(($316)>>2)];HEAP32[((($315)+(4))>>2)]=HEAP32[((($316)+(4))>>2)];HEAP32[((($315)+(8))>>2)]=HEAP32[((($316)+(8))>>2)];HEAP32[((($315)+(12))>>2)]=HEAP32[((($316)+(12))>>2)];
      var $317=$1;
      var $318=(($317+16)|0);
      var $319=HEAP32[(($318)>>2)];
      var $320=(($319)|0)!=0;
      if ($320) { label = 47; break; } else { label = 49; break; }
    case 47: 
      var $322=$1;
      var $323=(($322+16)|0);
      var $324=HEAP32[(($323)>>2)];
      var $325=(($324)|0);
      var $326=HEAP32[(($325)>>2)];
      var $327=(($326)|0)!=0;
      if ($327) { label = 48; break; } else { label = 49; break; }
    case 48: 
      var $329=$1;
      var $330=(($329+16)|0);
      var $331=HEAP32[(($330)>>2)];
      var $332=$331;
      _free($332);
      label = 49; break;
    case 49: 
      var $334=$1;
      var $335=(($334+16)|0);
      HEAP32[(($335)>>2)]=0;
      label = 51; break;
    case 50: 
      var $337=$1;
      _pixman_set_extents($337);
      label = 51; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_translate["X"]=1;

function _pixman_region32_reset($region, $box) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      $1=$region;
      $2=$box;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      var $5=$1;
      var $6=(($5)|0);
      var $7=$2;
      var $8=$6;
      var $9=$7;
      assert(16 % 1 === 0);HEAP32[(($8)>>2)]=HEAP32[(($9)>>2)];HEAP32[((($8)+(4))>>2)]=HEAP32[((($9)+(4))>>2)];HEAP32[((($8)+(8))>>2)]=HEAP32[((($9)+(8))>>2)];HEAP32[((($8)+(12))>>2)]=HEAP32[((($9)+(12))>>2)];
      var $10=$1;
      var $11=(($10+16)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12)|0)!=0;
      if ($13) { label = 5; break; } else { label = 7; break; }
    case 5: 
      var $15=$1;
      var $16=(($15+16)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($17)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=(($19)|0)!=0;
      if ($20) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $22=$1;
      var $23=(($22+16)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=$24;
      _free($25);
      label = 7; break;
    case 7: 
      var $27=$1;
      var $28=(($27+16)|0);
      HEAP32[(($28)>>2)]=0;

      return;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_not_empty($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { var $15 = 0;label = 4; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|0)!=0;
      var $13=$12 ^ 1;
      var $15 = $13;label = 4; break;
    case 4: 
      var $15;
      var $16=$15 ^ 1;
      var $17=(($16)&1);

      return $17;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_extents($region) {
  var label = 0;


  var $1;
  $1=$region;
  var $2=$1;
  var $3=(($2)|0);

  return $3;
}


function _pixman_region32_clear($region) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$region;
      var $2=$1;
      var $3=(($2+16)|0);
      var $4=HEAP32[(($3)>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { label = 3; break; } else { label = 5; break; }
    case 3: 
      var $7=$1;
      var $8=(($7+16)|0);
      var $9=HEAP32[(($8)>>2)];
      var $10=(($9)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11)|0)!=0;
      if ($12) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14=$1;
      var $15=(($14+16)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$16;
      _free($17);
      label = 5; break;
    case 5: 
      var $19=$1;
      var $20=(($19)|0);
      var $21=HEAP32[((5242884)>>2)];
      var $22=$20;
      var $23=$21;
      assert(16 % 1 === 0);HEAP32[(($22)>>2)]=HEAP32[(($23)>>2)];HEAP32[((($22)+(4))>>2)]=HEAP32[((($23)+(4))>>2)];HEAP32[((($22)+(8))>>2)]=HEAP32[((($23)+(8))>>2)];HEAP32[((($22)+(12))>>2)]=HEAP32[((($23)+(12))>>2)];
      var $24=HEAP32[((5242880)>>2)];
      var $25=$1;
      var $26=(($25+16)|0);
      HEAP32[(($26)>>2)]=$24;

      return;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_region32_contains_point($region, $x, $y, $box) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $pbox;
      var $pbox_end;
      var $numRects;
      $2=$region;
      $3=$x;
      $4=$y;
      $5=$box;
      var $6=$2;
      var $7=(($6+16)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(($8)|0)!=0;
      if ($9) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $11=$2;
      var $12=(($11+16)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $18 = $15;label = 5; break;
    case 4: 
      var $18 = 1;label = 5; break;
    case 5: 
      var $18;
      $numRects=$18;
      var $19=$numRects;
      var $20=(($19)|0)!=0;
      if ($20) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $22=$2;
      var $23=(($22)|0);
      var $24=(($23+8)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=$3;
      var $27=(($25)|0) > (($26)|0);
      if ($27) { label = 7; break; } else { label = 10; break; }
    case 7: 
      var $29=$2;
      var $30=(($29)|0);
      var $31=(($30)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$3;
      var $34=(($32)|0) <= (($33)|0);
      if ($34) { label = 8; break; } else { label = 10; break; }
    case 8: 
      var $36=$2;
      var $37=(($36)|0);
      var $38=(($37+12)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=$4;
      var $41=(($39)|0) > (($40)|0);
      if ($41) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $43=$2;
      var $44=(($43)|0);
      var $45=(($44+4)|0);
      var $46=HEAP32[(($45)>>2)];
      var $47=$4;
      var $48=(($46)|0) <= (($47)|0);
      if ($48) { label = 11; break; } else { label = 10; break; }
    case 10: 
      $1=0;
      label = 27; break;
    case 11: 
      var $51=$numRects;
      var $52=(($51)|0)==1;
      if ($52) { label = 12; break; } else { label = 15; break; }
    case 12: 
      var $54=$5;
      var $55=(($54)|0)!=0;
      if ($55) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $57=$5;
      var $58=$2;
      var $59=(($58)|0);
      var $60=$57;
      var $61=$59;
      assert(16 % 1 === 0);HEAP32[(($60)>>2)]=HEAP32[(($61)>>2)];HEAP32[((($60)+(4))>>2)]=HEAP32[((($61)+(4))>>2)];HEAP32[((($60)+(8))>>2)]=HEAP32[((($61)+(8))>>2)];HEAP32[((($60)+(12))>>2)]=HEAP32[((($61)+(12))>>2)];
      label = 14; break;
    case 14: 
      $1=1;
      label = 27; break;
    case 15: 
      var $64=$2;
      var $65=(($64+16)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($66+8)|0);
      var $68=$67;
      $pbox=$68;
      var $69=$pbox;
      var $70=$numRects;
      var $71=(($69+($70<<4))|0);
      $pbox_end=$71;
      var $72=$pbox;
      var $73=$pbox_end;
      var $74=$4;
      var $75=_find_box_for_y($72, $73, $74);
      $pbox=$75;
      label = 16; break;
    case 16: 
      var $77=$pbox;
      var $78=$pbox_end;
      var $79=(($77)|0)!=(($78)|0);
      if ($79) { label = 17; break; } else { label = 26; break; }
    case 17: 
      var $81=$4;
      var $82=$pbox;
      var $83=(($82+4)|0);
      var $84=HEAP32[(($83)>>2)];
      var $85=(($81)|0) < (($84)|0);
      if ($85) { label = 19; break; } else { label = 18; break; }
    case 18: 
      var $87=$3;
      var $88=$pbox;
      var $89=(($88)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=(($87)|0) < (($90)|0);
      if ($91) { label = 19; break; } else { label = 20; break; }
    case 19: 
      label = 26; break;
    case 20: 
      var $94=$3;
      var $95=$pbox;
      var $96=(($95+8)|0);
      var $97=HEAP32[(($96)>>2)];
      var $98=(($94)|0) >= (($97)|0);
      if ($98) { label = 21; break; } else { label = 22; break; }
    case 21: 
      label = 25; break;
    case 22: 
      var $101=$5;
      var $102=(($101)|0)!=0;
      if ($102) { label = 23; break; } else { label = 24; break; }
    case 23: 
      var $104=$5;
      var $105=$pbox;
      var $106=$104;
      var $107=$105;
      assert(16 % 1 === 0);HEAP32[(($106)>>2)]=HEAP32[(($107)>>2)];HEAP32[((($106)+(4))>>2)]=HEAP32[((($107)+(4))>>2)];HEAP32[((($106)+(8))>>2)]=HEAP32[((($107)+(8))>>2)];HEAP32[((($106)+(12))>>2)]=HEAP32[((($107)+(12))>>2)];
      label = 24; break;
    case 24: 
      $1=1;
      label = 27; break;
    case 25: 
      var $110=$pbox;
      var $111=(($110+16)|0);
      $pbox=$111;
      label = 16; break;
    case 26: 
      $1=0;
      label = 27; break;
    case 27: 
      var $114=$1;

      return $114;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_contains_point["X"]=1;

function _pixman_region32_selfcheck($reg) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 16)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $i;
      var $numRects;
      var $pbox_p;
      var $pbox_n;
      var $box=__stackBase__;
      $2=$reg;
      var $3=$2;
      var $4=(($3)|0);
      var $5=(($4)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=$2;
      var $8=(($7)|0);
      var $9=(($8+8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($6)|0) > (($10)|0);
      if ($11) { label = 4; break; } else { label = 3; break; }
    case 3: 
      var $13=$2;
      var $14=(($13)|0);
      var $15=(($14+4)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$2;
      var $18=(($17)|0);
      var $19=(($18+12)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=(($16)|0) > (($20)|0);
      if ($21) { label = 4; break; } else { label = 5; break; }
    case 4: 
      $1=0;
      label = 41; break;
    case 5: 
      var $24=$2;
      var $25=(($24+16)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($26)|0)!=0;
      if ($27) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $29=$2;
      var $30=(($29+16)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=(($31+4)|0);
      var $33=HEAP32[(($32)>>2)];
      var $36 = $33;label = 8; break;
    case 7: 
      var $36 = 1;label = 8; break;
    case 8: 
      var $36;
      $numRects=$36;
      var $37=$numRects;
      var $38=(($37)|0)!=0;
      if ($38) { label = 15; break; } else { label = 9; break; }
    case 9: 
      var $40=$2;
      var $41=(($40)|0);
      var $42=(($41)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=$2;
      var $45=(($44)|0);
      var $46=(($45+8)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($43)|0)==(($47)|0);
      if ($48) { label = 10; break; } else { var $75 = 0;label = 14; break; }
    case 10: 
      var $50=$2;
      var $51=(($50)|0);
      var $52=(($51+4)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=$2;
      var $55=(($54)|0);
      var $56=(($55+12)|0);
      var $57=HEAP32[(($56)>>2)];
      var $58=(($53)|0)==(($57)|0);
      if ($58) { label = 11; break; } else { var $75 = 0;label = 14; break; }
    case 11: 
      var $60=$2;
      var $61=(($60+16)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=(($62)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=(($64)|0)!=0;
      if ($65) { var $73 = 1;label = 13; break; } else { label = 12; break; }
    case 12: 
      var $67=$2;
      var $68=(($67+16)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=HEAP32[((5242880)>>2)];
      var $71=(($69)|0)==(($70)|0);
      var $73 = $71;label = 13; break;
    case 13: 
      var $73;
      var $75 = $73;label = 14; break;
    case 14: 
      var $75;
      var $76=(($75)&1);
      $1=$76;
      label = 41; break;
    case 15: 
      var $78=$numRects;
      var $79=(($78)|0)==1;
      if ($79) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $81=$2;
      var $82=(($81+16)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=(($83)|0)!=0;
      var $85=$84 ^ 1;
      var $86=(($85)&1);
      $1=$86;
      label = 41; break;
    case 17: 
      var $88=$2;
      var $89=(($88+16)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=(($90)|0)!=0;
      if ($91) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $93=$2;
      var $94=(($93+16)|0);
      var $95=HEAP32[(($94)>>2)];
      var $96=(($95+8)|0);
      var $97=$96;
      var $102 = $97;label = 20; break;
    case 19: 
      var $99=$2;
      var $100=(($99)|0);
      var $102 = $100;label = 20; break;
    case 20: 
      var $102;
      $pbox_p=$102;
      var $103=$pbox_p;
      var $104=$box;
      var $105=$103;
      assert(16 % 1 === 0);HEAP32[(($104)>>2)]=HEAP32[(($105)>>2)];HEAP32[((($104)+(4))>>2)]=HEAP32[((($105)+(4))>>2)];HEAP32[((($104)+(8))>>2)]=HEAP32[((($105)+(8))>>2)];HEAP32[((($104)+(12))>>2)]=HEAP32[((($105)+(12))>>2)];
      var $106=$numRects;
      var $107=((($106)-(1))|0);
      var $108=$pbox_p;
      var $109=(($108+($107<<4))|0);
      var $110=(($109+12)|0);
      var $111=HEAP32[(($110)>>2)];
      var $112=(($box+12)|0);
      HEAP32[(($112)>>2)]=$111;
      var $113=$pbox_p;
      var $114=(($113+16)|0);
      $pbox_n=$114;
      var $115=$numRects;
      $i=$115;
      label = 21; break;
    case 21: 
      var $117=$i;
      var $118=((($117)-(1))|0);
      $i=$118;
      var $119=(($118)|0) > 0;
      if ($119) { label = 22; break; } else { label = 36; break; }
    case 22: 
      var $121=$pbox_n;
      var $122=(($121)|0);
      var $123=HEAP32[(($122)>>2)];
      var $124=$pbox_n;
      var $125=(($124+8)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=(($123)|0) >= (($126)|0);
      if ($127) { label = 24; break; } else { label = 23; break; }
    case 23: 
      var $129=$pbox_n;
      var $130=(($129+4)|0);
      var $131=HEAP32[(($130)>>2)];
      var $132=$pbox_n;
      var $133=(($132+12)|0);
      var $134=HEAP32[(($133)>>2)];
      var $135=(($131)|0) >= (($134)|0);
      if ($135) { label = 24; break; } else { label = 25; break; }
    case 24: 
      $1=0;
      label = 41; break;
    case 25: 
      var $138=$pbox_n;
      var $139=(($138)|0);
      var $140=HEAP32[(($139)>>2)];
      var $141=(($box)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=(($140)|0) < (($142)|0);
      if ($143) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $145=$pbox_n;
      var $146=(($145)|0);
      var $147=HEAP32[(($146)>>2)];
      var $148=(($box)|0);
      HEAP32[(($148)>>2)]=$147;
      label = 27; break;
    case 27: 
      var $150=$pbox_n;
      var $151=(($150+8)|0);
      var $152=HEAP32[(($151)>>2)];
      var $153=(($box+8)|0);
      var $154=HEAP32[(($153)>>2)];
      var $155=(($152)|0) > (($154)|0);
      if ($155) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $157=$pbox_n;
      var $158=(($157+8)|0);
      var $159=HEAP32[(($158)>>2)];
      var $160=(($box+8)|0);
      HEAP32[(($160)>>2)]=$159;
      label = 29; break;
    case 29: 
      var $162=$pbox_n;
      var $163=(($162+4)|0);
      var $164=HEAP32[(($163)>>2)];
      var $165=$pbox_p;
      var $166=(($165+4)|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=(($164)|0) < (($167)|0);
      if ($168) { label = 33; break; } else { label = 30; break; }
    case 30: 
      var $170=$pbox_n;
      var $171=(($170+4)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=$pbox_p;
      var $174=(($173+4)|0);
      var $175=HEAP32[(($174)>>2)];
      var $176=(($172)|0)==(($175)|0);
      if ($176) { label = 31; break; } else { label = 34; break; }
    case 31: 
      var $178=$pbox_n;
      var $179=(($178)|0);
      var $180=HEAP32[(($179)>>2)];
      var $181=$pbox_p;
      var $182=(($181+8)|0);
      var $183=HEAP32[(($182)>>2)];
      var $184=(($180)|0) < (($183)|0);
      if ($184) { label = 33; break; } else { label = 32; break; }
    case 32: 
      var $186=$pbox_n;
      var $187=(($186+12)|0);
      var $188=HEAP32[(($187)>>2)];
      var $189=$pbox_p;
      var $190=(($189+12)|0);
      var $191=HEAP32[(($190)>>2)];
      var $192=(($188)|0)!=(($191)|0);
      if ($192) { label = 33; break; } else { label = 34; break; }
    case 33: 
      $1=0;
      label = 41; break;
    case 34: 
      label = 35; break;
    case 35: 
      var $196=$pbox_p;
      var $197=(($196+16)|0);
      $pbox_p=$197;
      var $198=$pbox_n;
      var $199=(($198+16)|0);
      $pbox_n=$199;
      label = 21; break;
    case 36: 
      var $201=(($box)|0);
      var $202=HEAP32[(($201)>>2)];
      var $203=$2;
      var $204=(($203)|0);
      var $205=(($204)|0);
      var $206=HEAP32[(($205)>>2)];
      var $207=(($202)|0)==(($206)|0);
      if ($207) { label = 37; break; } else { var $233 = 0;label = 40; break; }
    case 37: 
      var $209=(($box+8)|0);
      var $210=HEAP32[(($209)>>2)];
      var $211=$2;
      var $212=(($211)|0);
      var $213=(($212+8)|0);
      var $214=HEAP32[(($213)>>2)];
      var $215=(($210)|0)==(($214)|0);
      if ($215) { label = 38; break; } else { var $233 = 0;label = 40; break; }
    case 38: 
      var $217=(($box+4)|0);
      var $218=HEAP32[(($217)>>2)];
      var $219=$2;
      var $220=(($219)|0);
      var $221=(($220+4)|0);
      var $222=HEAP32[(($221)>>2)];
      var $223=(($218)|0)==(($222)|0);
      if ($223) { label = 39; break; } else { var $233 = 0;label = 40; break; }
    case 39: 
      var $225=(($box+12)|0);
      var $226=HEAP32[(($225)>>2)];
      var $227=$2;
      var $228=(($227)|0);
      var $229=(($228+12)|0);
      var $230=HEAP32[(($229)>>2)];
      var $231=(($226)|0)==(($230)|0);
      var $233 = $231;label = 40; break;
    case 40: 
      var $233;
      var $234=(($233)&1);
      $1=$234;
      label = 41; break;
    case 41: 
      var $236=$1;
      STACKTOP = __stackBase__;
      return $236;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_selfcheck["X"]=1;

function _pixman_region32_init_rects($region, $boxes, $count) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $rects;
      var $displacement;
      var $i;
      var $box;
      $2=$region;
      $3=$boxes;
      $4=$count;
      var $5=$4;
      var $6=(($5)|0)==1;
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $8=$2;
      var $9=$3;
      var $10=(($9)|0);
      var $11=(($10)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=$3;
      var $14=(($13)|0);
      var $15=(($14+4)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$3;
      var $18=(($17)|0);
      var $19=(($18+8)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=$3;
      var $22=(($21)|0);
      var $23=(($22)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=((($20)-($24))|0);
      var $26=$3;
      var $27=(($26)|0);
      var $28=(($27+12)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$3;
      var $31=(($30)|0);
      var $32=(($31+4)|0);
      var $33=HEAP32[(($32)>>2)];
      var $34=((($29)-($33))|0);
      _pixman_region32_init_rect($8, $12, $16, $25, $34);
      $1=1;
      label = 32; break;
    case 4: 
      var $36=$2;
      _pixman_region32_init($36);
      var $37=$4;
      var $38=(($37)|0)==0;
      if ($38) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $1=1;
      label = 32; break;
    case 6: 
      var $41=$2;
      var $42=$4;
      var $43=_pixman_rect_alloc($41, $42);
      var $44=(($43)|0)!=0;
      if ($44) { label = 8; break; } else { label = 7; break; }
    case 7: 
      $1=0;
      label = 32; break;
    case 8: 
      var $47=$2;
      var $48=(($47+16)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=(($49)|0)!=0;
      if ($50) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $52=$2;
      var $53=(($52+16)|0);
      var $54=HEAP32[(($53)>>2)];
      var $55=(($54+8)|0);
      var $56=$55;
      var $61 = $56;label = 11; break;
    case 10: 
      var $58=$2;
      var $59=(($58)|0);
      var $61 = $59;label = 11; break;
    case 11: 
      var $61;
      $rects=$61;
      var $62=$rects;
      var $63=$62;
      var $64=$3;
      var $65=$64;
      var $66=$4;
      var $67=((($66<<4))|0);
      assert($67 % 1 === 0);_memcpy($63, $65, $67);
      var $68=$4;
      var $69=$2;
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=(($71+4)|0);
      HEAP32[(($72)>>2)]=$68;
      $displacement=0;
      $i=0;
      label = 12; break;
    case 12: 
      var $74=$i;
      var $75=$4;
      var $76=(($74)|0) < (($75)|0);
      if ($76) { label = 13; break; } else { label = 21; break; }
    case 13: 
      var $78=$i;
      var $79=$rects;
      var $80=(($79+($78<<4))|0);
      $box=$80;
      var $81=$box;
      var $82=(($81)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=$box;
      var $85=(($84+8)|0);
      var $86=HEAP32[(($85)>>2)];
      var $87=(($83)|0) >= (($86)|0);
      if ($87) { label = 15; break; } else { label = 14; break; }
    case 14: 
      var $89=$box;
      var $90=(($89+4)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=$box;
      var $93=(($92+12)|0);
      var $94=HEAP32[(($93)>>2)];
      var $95=(($91)|0) >= (($94)|0);
      if ($95) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $97=$displacement;
      var $98=((($97)+(1))|0);
      $displacement=$98;
      label = 19; break;
    case 16: 
      var $100=$displacement;
      var $101=(($100)|0)!=0;
      if ($101) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $103=$i;
      var $104=$displacement;
      var $105=((($103)-($104))|0);
      var $106=$rects;
      var $107=(($106+($105<<4))|0);
      var $108=$i;
      var $109=$rects;
      var $110=(($109+($108<<4))|0);
      var $111=$107;
      var $112=$110;
      assert(16 % 1 === 0);HEAP32[(($111)>>2)]=HEAP32[(($112)>>2)];HEAP32[((($111)+(4))>>2)]=HEAP32[((($112)+(4))>>2)];HEAP32[((($111)+(8))>>2)]=HEAP32[((($112)+(8))>>2)];HEAP32[((($111)+(12))>>2)]=HEAP32[((($112)+(12))>>2)];
      label = 18; break;
    case 18: 
      label = 19; break;
    case 19: 
      label = 20; break;
    case 20: 
      var $116=$i;
      var $117=((($116)+(1))|0);
      $i=$117;
      label = 12; break;
    case 21: 
      var $119=$displacement;
      var $120=$2;
      var $121=(($120+16)|0);
      var $122=HEAP32[(($121)>>2)];
      var $123=(($122+4)|0);
      var $124=HEAP32[(($123)>>2)];
      var $125=((($124)-($119))|0);
      HEAP32[(($123)>>2)]=$125;
      var $126=$2;
      var $127=(($126+16)|0);
      var $128=HEAP32[(($127)>>2)];
      var $129=(($128+4)|0);
      var $130=HEAP32[(($129)>>2)];
      var $131=(($130)|0)==0;
      if ($131) { label = 22; break; } else { label = 26; break; }
    case 22: 
      var $133=$2;
      var $134=(($133+16)|0);
      var $135=HEAP32[(($134)>>2)];
      var $136=(($135)|0)!=0;
      if ($136) { label = 23; break; } else { label = 25; break; }
    case 23: 
      var $138=$2;
      var $139=(($138+16)|0);
      var $140=HEAP32[(($139)>>2)];
      var $141=(($140)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=(($142)|0)!=0;
      if ($143) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $145=$2;
      var $146=(($145+16)|0);
      var $147=HEAP32[(($146)>>2)];
      var $148=$147;
      _free($148);
      label = 25; break;
    case 25: 
      var $150=$2;
      _pixman_region32_init($150);
      $1=1;
      label = 32; break;
    case 26: 
      var $152=$2;
      var $153=(($152+16)|0);
      var $154=HEAP32[(($153)>>2)];
      var $155=(($154+4)|0);
      var $156=HEAP32[(($155)>>2)];
      var $157=(($156)|0)==1;
      if ($157) { label = 27; break; } else { label = 31; break; }
    case 27: 
      var $159=$2;
      var $160=(($159)|0);
      var $161=$rects;
      var $162=(($161)|0);
      var $163=$160;
      var $164=$162;
      assert(16 % 1 === 0);HEAP32[(($163)>>2)]=HEAP32[(($164)>>2)];HEAP32[((($163)+(4))>>2)]=HEAP32[((($164)+(4))>>2)];HEAP32[((($163)+(8))>>2)]=HEAP32[((($164)+(8))>>2)];HEAP32[((($163)+(12))>>2)]=HEAP32[((($164)+(12))>>2)];
      var $165=$2;
      var $166=(($165+16)|0);
      var $167=HEAP32[(($166)>>2)];
      var $168=(($167)|0)!=0;
      if ($168) { label = 28; break; } else { label = 30; break; }
    case 28: 
      var $170=$2;
      var $171=(($170+16)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=(($172)|0);
      var $174=HEAP32[(($173)>>2)];
      var $175=(($174)|0)!=0;
      if ($175) { label = 29; break; } else { label = 30; break; }
    case 29: 
      var $177=$2;
      var $178=(($177+16)|0);
      var $179=HEAP32[(($178)>>2)];
      var $180=$179;
      _free($180);
      label = 30; break;
    case 30: 
      var $182=$2;
      var $183=(($182+16)|0);
      HEAP32[(($183)>>2)]=0;
      $1=1;
      label = 32; break;
    case 31: 
      var $185=$2;
      var $186=(($185)|0);
      var $187=(($186+8)|0);
      HEAP32[(($187)>>2)]=0;
      var $188=$2;
      var $189=(($188)|0);
      var $190=(($189)|0);
      HEAP32[(($190)>>2)]=0;
      var $191=$2;
      var $192=_validate($191);
      $1=$192;
      label = 32; break;
    case 32: 
      var $194=$1;

      return $194;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region32_init_rects["X"]=1;

function _pixman_rect_alloc($region, $n) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $data;
      var $data_size;
      $2=$region;
      $3=$n;
      var $4=$2;
      var $5=(($4+16)|0);
      var $6=HEAP32[(($5)>>2)];
      var $7=(($6)|0)!=0;
      if ($7) { label = 6; break; } else { label = 3; break; }
    case 3: 
      var $9=$3;
      var $10=((($9)+(1))|0);
      $3=$10;
      var $11=$3;
      var $12=_alloc_data($11);
      var $13=$2;
      var $14=(($13+16)|0);
      HEAP32[(($14)>>2)]=$12;
      var $15=$2;
      var $16=(($15+16)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($17)|0)!=0;
      if ($18) { label = 5; break; } else { label = 4; break; }
    case 4: 
      var $20=$2;
      var $21=_pixman_break($20);
      $1=$21;
      label = 22; break;
    case 5: 
      var $23=$2;
      var $24=(($23+16)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25+4)|0);
      HEAP32[(($26)>>2)]=1;
      var $27=$2;
      var $28=(($27+16)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=(($29+8)|0);
      var $31=$30;
      var $32=$2;
      var $33=(($32)|0);
      var $34=$31;
      var $35=$33;
      assert(16 % 1 === 0);HEAP32[(($34)>>2)]=HEAP32[(($35)>>2)];HEAP32[((($34)+(4))>>2)]=HEAP32[((($35)+(4))>>2)];HEAP32[((($34)+(8))>>2)]=HEAP32[((($35)+(8))>>2)];HEAP32[((($34)+(12))>>2)]=HEAP32[((($35)+(12))>>2)];
      label = 21; break;
    case 6: 
      var $37=$2;
      var $38=(($37+16)|0);
      var $39=HEAP32[(($38)>>2)];
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=(($41)|0)!=0;
      if ($42) { label = 10; break; } else { label = 7; break; }
    case 7: 
      var $44=$3;
      var $45=_alloc_data($44);
      var $46=$2;
      var $47=(($46+16)|0);
      HEAP32[(($47)>>2)]=$45;
      var $48=$2;
      var $49=(($48+16)|0);
      var $50=HEAP32[(($49)>>2)];
      var $51=(($50)|0)!=0;
      if ($51) { label = 9; break; } else { label = 8; break; }
    case 8: 
      var $53=$2;
      var $54=_pixman_break($53);
      $1=$54;
      label = 22; break;
    case 9: 
      var $56=$2;
      var $57=(($56+16)|0);
      var $58=HEAP32[(($57)>>2)];
      var $59=(($58+4)|0);
      HEAP32[(($59)>>2)]=0;
      label = 20; break;
    case 10: 
      var $61=$3;
      var $62=(($61)|0)==1;
      if ($62) { label = 11; break; } else { label = 14; break; }
    case 11: 
      var $64=$2;
      var $65=(($64+16)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($66+4)|0);
      var $68=HEAP32[(($67)>>2)];
      $3=$68;
      var $69=$3;
      var $70=(($69)|0) > 500;
      if ($70) { label = 12; break; } else { label = 13; break; }
    case 12: 
      $3=250;
      label = 13; break;
    case 13: 
      label = 14; break;
    case 14: 
      var $74=$2;
      var $75=(($74+16)|0);
      var $76=HEAP32[(($75)>>2)];
      var $77=(($76+4)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=$3;
      var $80=((($79)+($78))|0);
      $3=$80;
      var $81=$3;
      var $82=_PIXREGION_SZOF($81);
      $data_size=$82;
      var $83=$data_size;
      var $84=(($83)|0)!=0;
      if ($84) { label = 16; break; } else { label = 15; break; }
    case 15: 
      $data=0;
      label = 17; break;
    case 16: 
      var $87=$2;
      var $88=(($87+16)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=$89;
      var $91=$3;
      var $92=_PIXREGION_SZOF($91);
      var $93=_realloc($90, $92);
      var $94=$93;
      $data=$94;
      label = 17; break;
    case 17: 
      var $96=$data;
      var $97=(($96)|0)!=0;
      if ($97) { label = 19; break; } else { label = 18; break; }
    case 18: 
      var $99=$2;
      var $100=_pixman_break($99);
      $1=$100;
      label = 22; break;
    case 19: 
      var $102=$data;
      var $103=$2;
      var $104=(($103+16)|0);
      HEAP32[(($104)>>2)]=$102;
      label = 20; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $107=$3;
      var $108=$2;
      var $109=(($108+16)|0);
      var $110=HEAP32[(($109)>>2)];
      var $111=(($110)|0);
      HEAP32[(($111)>>2)]=$107;
      $1=1;
      label = 22; break;
    case 22: 
      var $113=$1;

      return $113;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_rect_alloc["X"]=1;

function _validate($badreg) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 1792)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $stack_regions=__stackBase__;
      var $numRects;
      var $ri;
      var $num_ri;
      var $size_ri;
      var $i;
      var $j;
      var $rit;
      var $reg;
      var $box;
      var $ri_box;
      var $hreg;
      var $ret;
      var $new_data;
      var $data_size;
      var $data_size1;
      var $half;
      $2=$badreg;
      $ret=1;
      var $3=$2;
      var $4=(($3+16)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=(($5)|0)!=0;
      if ($6) { label = 4; break; } else { label = 3; break; }
    case 3: 
      $1=1;
      label = 132; break;
    case 4: 
      var $9=$2;
      var $10=(($9+16)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=(($11+4)|0);
      var $13=HEAP32[(($12)>>2)];
      $numRects=$13;
      var $14=$numRects;
      var $15=(($14)|0)!=0;
      if ($15) { label = 8; break; } else { label = 5; break; }
    case 5: 
      var $17=$2;
      var $18=(($17+16)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=HEAP32[((5242920)>>2)];
      var $21=(($19)|0)==(($20)|0);
      if ($21) { label = 6; break; } else { label = 7; break; }
    case 6: 
      $1=0;
      label = 132; break;
    case 7: 
      $1=1;
      label = 132; break;
    case 8: 
      var $25=$2;
      var $26=(($25)|0);
      var $27=(($26)|0);
      var $28=HEAP32[(($27)>>2)];
      var $29=$2;
      var $30=(($29)|0);
      var $31=(($30+8)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($28)|0) < (($32)|0);
      if ($33) { label = 9; break; } else { label = 26; break; }
    case 9: 
      var $35=$numRects;
      var $36=(($35)|0)==1;
      if ($36) { label = 10; break; } else { label = 14; break; }
    case 10: 
      var $38=$2;
      var $39=(($38+16)|0);
      var $40=HEAP32[(($39)>>2)];
      var $41=(($40)|0)!=0;
      if ($41) { label = 11; break; } else { label = 13; break; }
    case 11: 
      var $43=$2;
      var $44=(($43+16)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=(($45)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($47)|0)!=0;
      if ($48) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $50=$2;
      var $51=(($50+16)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=$52;
      _free($53);
      label = 13; break;
    case 13: 
      var $55=$2;
      var $56=(($55+16)|0);
      HEAP32[(($56)>>2)]=0;
      label = 25; break;
    case 14: 
      label = 15; break;
    case 15: 
      var $59=$numRects;
      var $60=$2;
      var $61=(($60+16)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=(($62)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=$64 >> 1;
      var $66=(($59)|0) < (($65)|0);
      if ($66) { label = 16; break; } else { label = 23; break; }
    case 16: 
      var $68=$2;
      var $69=(($68+16)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=(($70)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=(($72)|0) > 50;
      if ($73) { label = 17; break; } else { label = 23; break; }
    case 17: 
      var $75=$numRects;
      var $76=_PIXREGION_SZOF($75);
      $data_size=$76;
      var $77=$data_size;
      var $78=(($77)|0)!=0;
      if ($78) { label = 19; break; } else { label = 18; break; }
    case 18: 
      $new_data=0;
      label = 20; break;
    case 19: 
      var $81=$2;
      var $82=(($81+16)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=$83;
      var $85=$data_size;
      var $86=_realloc($84, $85);
      var $87=$86;
      $new_data=$87;
      label = 20; break;
    case 20: 
      var $89=$new_data;
      var $90=(($89)|0)!=0;
      if ($90) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $92=$numRects;
      var $93=$new_data;
      var $94=(($93)|0);
      HEAP32[(($94)>>2)]=$92;
      var $95=$new_data;
      var $96=$2;
      var $97=(($96+16)|0);
      HEAP32[(($97)>>2)]=$95;
      label = 22; break;
    case 22: 
      label = 23; break;
    case 23: 
      label = 24; break;
    case 24: 
      label = 25; break;
    case 25: 
      $1=1;
      label = 132; break;
    case 26: 
      var $103=$2;
      var $104=(($103+16)|0);
      var $105=HEAP32[(($104)>>2)];
      var $106=(($105+8)|0);
      var $107=$106;
      var $108=$numRects;
      _quick_sort_rects($107, $108);
      var $109=(($stack_regions)|0);
      $ri=$109;
      $size_ri=64;
      $num_ri=1;
      var $110=$ri;
      var $111=(($110)|0);
      var $112=(($111+20)|0);
      HEAP32[(($112)>>2)]=0;
      var $113=$ri;
      var $114=(($113)|0);
      var $115=(($114+24)|0);
      HEAP32[(($115)>>2)]=0;
      var $116=$ri;
      var $117=(($116)|0);
      var $118=(($117)|0);
      var $119=$2;
      var $120=$118;
      var $121=$119;
      assert(20 % 1 === 0);HEAP32[(($120)>>2)]=HEAP32[(($121)>>2)];HEAP32[((($120)+(4))>>2)]=HEAP32[((($121)+(4))>>2)];HEAP32[((($120)+(8))>>2)]=HEAP32[((($121)+(8))>>2)];HEAP32[((($120)+(12))>>2)]=HEAP32[((($121)+(12))>>2)];HEAP32[((($120)+(16))>>2)]=HEAP32[((($121)+(16))>>2)];
      var $122=$ri;
      var $123=(($122)|0);
      var $124=(($123)|0);
      var $125=(($124+16)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=(($126+8)|0);
      var $128=$127;
      $box=$128;
      var $129=$ri;
      var $130=(($129)|0);
      var $131=(($130)|0);
      var $132=(($131)|0);
      var $133=$box;
      var $134=$132;
      var $135=$133;
      assert(16 % 1 === 0);HEAP32[(($134)>>2)]=HEAP32[(($135)>>2)];HEAP32[((($134)+(4))>>2)]=HEAP32[((($135)+(4))>>2)];HEAP32[((($134)+(8))>>2)]=HEAP32[((($135)+(8))>>2)];HEAP32[((($134)+(12))>>2)]=HEAP32[((($135)+(12))>>2)];
      var $136=$ri;
      var $137=(($136)|0);
      var $138=(($137)|0);
      var $139=(($138+16)|0);
      var $140=HEAP32[(($139)>>2)];
      var $141=(($140+4)|0);
      HEAP32[(($141)>>2)]=1;
      var $142=$2;
      var $143=(($142)|0);
      var $144=HEAP32[((5242884)>>2)];
      var $145=$143;
      var $146=$144;
      assert(16 % 1 === 0);HEAP32[(($145)>>2)]=HEAP32[(($146)>>2)];HEAP32[((($145)+(4))>>2)]=HEAP32[((($146)+(4))>>2)];HEAP32[((($145)+(8))>>2)]=HEAP32[((($146)+(8))>>2)];HEAP32[((($145)+(12))>>2)]=HEAP32[((($146)+(12))>>2)];
      var $147=HEAP32[((5242880)>>2)];
      var $148=$2;
      var $149=(($148+16)|0);
      HEAP32[(($149)>>2)]=$147;
      var $150=$numRects;
      $i=$150;
      label = 27; break;
    case 27: 
      var $152=$i;
      var $153=((($152)-(1))|0);
      $i=$153;
      var $154=(($153)|0) > 0;
      if ($154) { label = 28; break; } else { label = 81; break; }
    case 28: 
      var $156=$box;
      var $157=(($156+16)|0);
      $box=$157;
      var $158=$num_ri;
      $j=$158;
      var $159=$ri;
      $rit=$159;
      label = 29; break;
    case 29: 
      var $161=$j;
      var $162=((($161)-(1))|0);
      $j=$162;
      var $163=(($162)|0) >= 0;
      if ($163) { label = 30; break; } else { label = 66; break; }
    case 30: 
      var $165=$rit;
      var $166=(($165)|0);
      $reg=$166;
      var $167=$reg;
      var $168=(($167+16)|0);
      var $169=HEAP32[(($168)>>2)];
      var $170=(($169+4)|0);
      var $171=HEAP32[(($170)>>2)];
      var $172=((($171)-(1))|0);
      var $173=$reg;
      var $174=(($173+16)|0);
      var $175=HEAP32[(($174)>>2)];
      var $176=(($175+8)|0);
      var $177=$176;
      var $178=(($177+($172<<4))|0);
      $ri_box=$178;
      var $179=$box;
      var $180=(($179+4)|0);
      var $181=HEAP32[(($180)>>2)];
      var $182=$ri_box;
      var $183=(($182+4)|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=(($181)|0)==(($184)|0);
      if ($185) { label = 31; break; } else { label = 45; break; }
    case 31: 
      var $187=$box;
      var $188=(($187+12)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=$ri_box;
      var $191=(($190+12)|0);
      var $192=HEAP32[(($191)>>2)];
      var $193=(($189)|0)==(($192)|0);
      if ($193) { label = 32; break; } else { label = 45; break; }
    case 32: 
      var $195=$box;
      var $196=(($195)|0);
      var $197=HEAP32[(($196)>>2)];
      var $198=$ri_box;
      var $199=(($198+8)|0);
      var $200=HEAP32[(($199)>>2)];
      var $201=(($197)|0) <= (($200)|0);
      if ($201) { label = 33; break; } else { label = 36; break; }
    case 33: 
      var $203=$box;
      var $204=(($203+8)|0);
      var $205=HEAP32[(($204)>>2)];
      var $206=$ri_box;
      var $207=(($206+8)|0);
      var $208=HEAP32[(($207)>>2)];
      var $209=(($205)|0) > (($208)|0);
      if ($209) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $211=$box;
      var $212=(($211+8)|0);
      var $213=HEAP32[(($212)>>2)];
      var $214=$ri_box;
      var $215=(($214+8)|0);
      HEAP32[(($215)>>2)]=$213;
      label = 35; break;
    case 35: 
      label = 44; break;
    case 36: 
      label = 37; break;
    case 37: 
      var $219=$reg;
      var $220=(($219+16)|0);
      var $221=HEAP32[(($220)>>2)];
      var $222=(($221)|0)!=0;
      if ($222) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $224=$reg;
      var $225=(($224+16)|0);
      var $226=HEAP32[(($225)>>2)];
      var $227=(($226+4)|0);
      var $228=HEAP32[(($227)>>2)];
      var $229=((($228)+(1))|0);
      var $230=$reg;
      var $231=(($230+16)|0);
      var $232=HEAP32[(($231)>>2)];
      var $233=(($232)|0);
      var $234=HEAP32[(($233)>>2)];
      var $235=(($229)|0) > (($234)|0);
      if ($235) { label = 39; break; } else { label = 42; break; }
    case 39: 
      var $237=$reg;
      var $238=_pixman_rect_alloc($237, 1);
      var $239=(($238)|0)!=0;
      if ($239) { label = 41; break; } else { label = 40; break; }
    case 40: 
      label = 122; break;
    case 41: 
      label = 42; break;
    case 42: 
      label = 43; break;
    case 43: 
      var $244=$reg;
      var $245=(($244+16)|0);
      var $246=HEAP32[(($245)>>2)];
      var $247=(($246+4)|0);
      var $248=HEAP32[(($247)>>2)];
      var $249=$reg;
      var $250=(($249+16)|0);
      var $251=HEAP32[(($250)>>2)];
      var $252=(($251+8)|0);
      var $253=$252;
      var $254=(($253+($248<<4))|0);
      var $255=$box;
      var $256=$254;
      var $257=$255;
      assert(16 % 1 === 0);HEAP32[(($256)>>2)]=HEAP32[(($257)>>2)];HEAP32[((($256)+(4))>>2)]=HEAP32[((($257)+(4))>>2)];HEAP32[((($256)+(8))>>2)]=HEAP32[((($257)+(8))>>2)];HEAP32[((($256)+(12))>>2)]=HEAP32[((($257)+(12))>>2)];
      var $258=$reg;
      var $259=(($258+16)|0);
      var $260=HEAP32[(($259)>>2)];
      var $261=(($260+4)|0);
      var $262=HEAP32[(($261)>>2)];
      var $263=((($262)+(1))|0);
      HEAP32[(($261)>>2)]=$263;
      label = 44; break;
    case 44: 
      label = 80; break;
    case 45: 
      var $266=$box;
      var $267=(($266+4)|0);
      var $268=HEAP32[(($267)>>2)];
      var $269=$ri_box;
      var $270=(($269+12)|0);
      var $271=HEAP32[(($270)>>2)];
      var $272=(($268)|0) >= (($271)|0);
      if ($272) { label = 46; break; } else { label = 63; break; }
    case 46: 
      var $274=$reg;
      var $275=(($274)|0);
      var $276=(($275+8)|0);
      var $277=HEAP32[(($276)>>2)];
      var $278=$ri_box;
      var $279=(($278+8)|0);
      var $280=HEAP32[(($279)>>2)];
      var $281=(($277)|0) < (($280)|0);
      if ($281) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $283=$ri_box;
      var $284=(($283+8)|0);
      var $285=HEAP32[(($284)>>2)];
      var $286=$reg;
      var $287=(($286)|0);
      var $288=(($287+8)|0);
      HEAP32[(($288)>>2)]=$285;
      label = 48; break;
    case 48: 
      var $290=$reg;
      var $291=(($290)|0);
      var $292=(($291)|0);
      var $293=HEAP32[(($292)>>2)];
      var $294=$box;
      var $295=(($294)|0);
      var $296=HEAP32[(($295)>>2)];
      var $297=(($293)|0) > (($296)|0);
      if ($297) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $299=$box;
      var $300=(($299)|0);
      var $301=HEAP32[(($300)>>2)];
      var $302=$reg;
      var $303=(($302)|0);
      var $304=(($303)|0);
      HEAP32[(($304)>>2)]=$301;
      label = 50; break;
    case 50: 
      label = 51; break;
    case 51: 
      var $307=$rit;
      var $308=(($307+24)|0);
      var $309=HEAP32[(($308)>>2)];
      var $310=$rit;
      var $311=(($310+20)|0);
      var $312=HEAP32[(($311)>>2)];
      var $313=((($309)-($312))|0);
      var $314=$reg;
      var $315=(($314+16)|0);
      var $316=HEAP32[(($315)>>2)];
      var $317=(($316+4)|0);
      var $318=HEAP32[(($317)>>2)];
      var $319=$rit;
      var $320=(($319+24)|0);
      var $321=HEAP32[(($320)>>2)];
      var $322=((($318)-($321))|0);
      var $323=(($313)|0)==(($322)|0);
      if ($323) { label = 52; break; } else { label = 53; break; }
    case 52: 
      var $325=$reg;
      var $326=$rit;
      var $327=(($326+20)|0);
      var $328=HEAP32[(($327)>>2)];
      var $329=$rit;
      var $330=(($329+24)|0);
      var $331=HEAP32[(($330)>>2)];
      var $332=_pixman_coalesce($325, $328, $331);
      var $333=$rit;
      var $334=(($333+20)|0);
      HEAP32[(($334)>>2)]=$332;
      label = 54; break;
    case 53: 
      var $336=$rit;
      var $337=(($336+24)|0);
      var $338=HEAP32[(($337)>>2)];
      var $339=$rit;
      var $340=(($339+20)|0);
      HEAP32[(($340)>>2)]=$338;
      label = 54; break;
    case 54: 
      label = 55; break;
    case 55: 
      var $343=$reg;
      var $344=(($343+16)|0);
      var $345=HEAP32[(($344)>>2)];
      var $346=(($345+4)|0);
      var $347=HEAP32[(($346)>>2)];
      var $348=$rit;
      var $349=(($348+24)|0);
      HEAP32[(($349)>>2)]=$347;
      label = 56; break;
    case 56: 
      var $351=$reg;
      var $352=(($351+16)|0);
      var $353=HEAP32[(($352)>>2)];
      var $354=(($353)|0)!=0;
      if ($354) { label = 57; break; } else { label = 58; break; }
    case 57: 
      var $356=$reg;
      var $357=(($356+16)|0);
      var $358=HEAP32[(($357)>>2)];
      var $359=(($358+4)|0);
      var $360=HEAP32[(($359)>>2)];
      var $361=((($360)+(1))|0);
      var $362=$reg;
      var $363=(($362+16)|0);
      var $364=HEAP32[(($363)>>2)];
      var $365=(($364)|0);
      var $366=HEAP32[(($365)>>2)];
      var $367=(($361)|0) > (($366)|0);
      if ($367) { label = 58; break; } else { label = 61; break; }
    case 58: 
      var $369=$reg;
      var $370=_pixman_rect_alloc($369, 1);
      var $371=(($370)|0)!=0;
      if ($371) { label = 60; break; } else { label = 59; break; }
    case 59: 
      label = 122; break;
    case 60: 
      label = 61; break;
    case 61: 
      label = 62; break;
    case 62: 
      var $376=$reg;
      var $377=(($376+16)|0);
      var $378=HEAP32[(($377)>>2)];
      var $379=(($378+4)|0);
      var $380=HEAP32[(($379)>>2)];
      var $381=$reg;
      var $382=(($381+16)|0);
      var $383=HEAP32[(($382)>>2)];
      var $384=(($383+8)|0);
      var $385=$384;
      var $386=(($385+($380<<4))|0);
      var $387=$box;
      var $388=$386;
      var $389=$387;
      assert(16 % 1 === 0);HEAP32[(($388)>>2)]=HEAP32[(($389)>>2)];HEAP32[((($388)+(4))>>2)]=HEAP32[((($389)+(4))>>2)];HEAP32[((($388)+(8))>>2)]=HEAP32[((($389)+(8))>>2)];HEAP32[((($388)+(12))>>2)]=HEAP32[((($389)+(12))>>2)];
      var $390=$reg;
      var $391=(($390+16)|0);
      var $392=HEAP32[(($391)>>2)];
      var $393=(($392+4)|0);
      var $394=HEAP32[(($393)>>2)];
      var $395=((($394)+(1))|0);
      HEAP32[(($393)>>2)]=$395;
      label = 80; break;
    case 63: 
      label = 64; break;
    case 64: 
      label = 65; break;
    case 65: 
      var $399=$rit;
      var $400=(($399+28)|0);
      $rit=$400;
      label = 29; break;
    case 66: 
      var $402=$size_ri;
      var $403=$num_ri;
      var $404=(($402)|0)==(($403)|0);
      if ($404) { label = 67; break; } else { label = 77; break; }
    case 67: 
      var $406=$size_ri;
      var $407=$406 << 1;
      $size_ri=$407;
      var $408=$size_ri;
      var $409=((($408)*(28))|0);
      $data_size1=$409;
      var $410=$data_size1;
      var $411=$size_ri;
      var $412=Math.floor(((($410)>>>0))/((($411)>>>0)));
      var $413=(($412)|0)!=28;
      if ($413) { label = 68; break; } else { label = 69; break; }
    case 68: 
      label = 122; break;
    case 69: 
      var $416=$ri;
      var $417=(($stack_regions)|0);
      var $418=(($416)|0)==(($417)|0);
      if ($418) { label = 70; break; } else { label = 73; break; }
    case 70: 
      var $420=$data_size1;
      var $421=_malloc($420);
      var $422=$421;
      $rit=$422;
      var $423=$rit;
      var $424=(($423)|0)!=0;
      if ($424) { label = 72; break; } else { label = 71; break; }
    case 71: 
      label = 122; break;
    case 72: 
      var $427=$rit;
      var $428=$427;
      var $429=$ri;
      var $430=$429;
      var $431=$num_ri;
      var $432=((($431)*(28))|0);
      assert($432 % 1 === 0);_memcpy($428, $430, $432);
      label = 76; break;
    case 73: 
      var $434=$ri;
      var $435=$434;
      var $436=$data_size1;
      var $437=_realloc($435, $436);
      var $438=$437;
      $rit=$438;
      var $439=$rit;
      var $440=(($439)|0)!=0;
      if ($440) { label = 75; break; } else { label = 74; break; }
    case 74: 
      label = 122; break;
    case 75: 
      label = 76; break;
    case 76: 
      var $444=$rit;
      $ri=$444;
      var $445=$num_ri;
      var $446=$ri;
      var $447=(($446+($445)*(28))|0);
      $rit=$447;
      label = 77; break;
    case 77: 
      var $449=$num_ri;
      var $450=((($449)+(1))|0);
      $num_ri=$450;
      var $451=$rit;
      var $452=(($451+20)|0);
      HEAP32[(($452)>>2)]=0;
      var $453=$rit;
      var $454=(($453+24)|0);
      HEAP32[(($454)>>2)]=0;
      var $455=$rit;
      var $456=(($455)|0);
      var $457=(($456)|0);
      var $458=$box;
      var $459=$457;
      var $460=$458;
      assert(16 % 1 === 0);HEAP32[(($459)>>2)]=HEAP32[(($460)>>2)];HEAP32[((($459)+(4))>>2)]=HEAP32[((($460)+(4))>>2)];HEAP32[((($459)+(8))>>2)]=HEAP32[((($460)+(8))>>2)];HEAP32[((($459)+(12))>>2)]=HEAP32[((($460)+(12))>>2)];
      var $461=$rit;
      var $462=(($461)|0);
      var $463=(($462+16)|0);
      HEAP32[(($463)>>2)]=0;
      var $464=$rit;
      var $465=(($464)|0);
      var $466=$i;
      var $467=$num_ri;
      var $468=((($466)+($467))|0);
      var $469=$num_ri;
      var $470=((((($468)|0))/((($469)|0)))&-1);
      var $471=_pixman_rect_alloc($465, $470);
      var $472=(($471)|0)!=0;
      if ($472) { label = 79; break; } else { label = 78; break; }
    case 78: 
      label = 122; break;
    case 79: 
      label = 80; break;
    case 80: 
      label = 27; break;
    case 81: 
      var $477=$num_ri;
      $j=$477;
      var $478=$ri;
      $rit=$478;
      label = 82; break;
    case 82: 
      var $480=$j;
      var $481=((($480)-(1))|0);
      $j=$481;
      var $482=(($481)|0) >= 0;
      if ($482) { label = 83; break; } else { label = 97; break; }
    case 83: 
      var $484=$rit;
      var $485=(($484)|0);
      $reg=$485;
      var $486=$reg;
      var $487=(($486+16)|0);
      var $488=HEAP32[(($487)>>2)];
      var $489=(($488+4)|0);
      var $490=HEAP32[(($489)>>2)];
      var $491=((($490)-(1))|0);
      var $492=$reg;
      var $493=(($492+16)|0);
      var $494=HEAP32[(($493)>>2)];
      var $495=(($494+8)|0);
      var $496=$495;
      var $497=(($496+($491<<4))|0);
      $ri_box=$497;
      var $498=$ri_box;
      var $499=(($498+12)|0);
      var $500=HEAP32[(($499)>>2)];
      var $501=$reg;
      var $502=(($501)|0);
      var $503=(($502+12)|0);
      HEAP32[(($503)>>2)]=$500;
      var $504=$reg;
      var $505=(($504)|0);
      var $506=(($505+8)|0);
      var $507=HEAP32[(($506)>>2)];
      var $508=$ri_box;
      var $509=(($508+8)|0);
      var $510=HEAP32[(($509)>>2)];
      var $511=(($507)|0) < (($510)|0);
      if ($511) { label = 84; break; } else { label = 85; break; }
    case 84: 
      var $513=$ri_box;
      var $514=(($513+8)|0);
      var $515=HEAP32[(($514)>>2)];
      var $516=$reg;
      var $517=(($516)|0);
      var $518=(($517+8)|0);
      HEAP32[(($518)>>2)]=$515;
      label = 85; break;
    case 85: 
      label = 86; break;
    case 86: 
      var $521=$rit;
      var $522=(($521+24)|0);
      var $523=HEAP32[(($522)>>2)];
      var $524=$rit;
      var $525=(($524+20)|0);
      var $526=HEAP32[(($525)>>2)];
      var $527=((($523)-($526))|0);
      var $528=$reg;
      var $529=(($528+16)|0);
      var $530=HEAP32[(($529)>>2)];
      var $531=(($530+4)|0);
      var $532=HEAP32[(($531)>>2)];
      var $533=$rit;
      var $534=(($533+24)|0);
      var $535=HEAP32[(($534)>>2)];
      var $536=((($532)-($535))|0);
      var $537=(($527)|0)==(($536)|0);
      if ($537) { label = 87; break; } else { label = 88; break; }
    case 87: 
      var $539=$reg;
      var $540=$rit;
      var $541=(($540+20)|0);
      var $542=HEAP32[(($541)>>2)];
      var $543=$rit;
      var $544=(($543+24)|0);
      var $545=HEAP32[(($544)>>2)];
      var $546=_pixman_coalesce($539, $542, $545);
      var $547=$rit;
      var $548=(($547+20)|0);
      HEAP32[(($548)>>2)]=$546;
      label = 89; break;
    case 88: 
      var $550=$rit;
      var $551=(($550+24)|0);
      var $552=HEAP32[(($551)>>2)];
      var $553=$rit;
      var $554=(($553+20)|0);
      HEAP32[(($554)>>2)]=$552;
      label = 89; break;
    case 89: 
      label = 90; break;
    case 90: 
      var $557=$reg;
      var $558=(($557+16)|0);
      var $559=HEAP32[(($558)>>2)];
      var $560=(($559+4)|0);
      var $561=HEAP32[(($560)>>2)];
      var $562=(($561)|0)==1;
      if ($562) { label = 91; break; } else { label = 95; break; }
    case 91: 
      var $564=$reg;
      var $565=(($564+16)|0);
      var $566=HEAP32[(($565)>>2)];
      var $567=(($566)|0)!=0;
      if ($567) { label = 92; break; } else { label = 94; break; }
    case 92: 
      var $569=$reg;
      var $570=(($569+16)|0);
      var $571=HEAP32[(($570)>>2)];
      var $572=(($571)|0);
      var $573=HEAP32[(($572)>>2)];
      var $574=(($573)|0)!=0;
      if ($574) { label = 93; break; } else { label = 94; break; }
    case 93: 
      var $576=$reg;
      var $577=(($576+16)|0);
      var $578=HEAP32[(($577)>>2)];
      var $579=$578;
      _free($579);
      label = 94; break;
    case 94: 
      var $581=$reg;
      var $582=(($581+16)|0);
      HEAP32[(($582)>>2)]=0;
      label = 95; break;
    case 95: 
      label = 96; break;
    case 96: 
      var $585=$rit;
      var $586=(($585+28)|0);
      $rit=$586;
      label = 82; break;
    case 97: 
      label = 98; break;
    case 98: 
      var $589=$num_ri;
      var $590=(($589)|0) > 1;
      if ($590) { label = 99; break; } else { label = 119; break; }
    case 99: 
      var $592=$num_ri;
      var $593=((((($592)|0))/(2))&-1);
      $half=$593;
      var $594=$num_ri;
      var $595=$594 & 1;
      $j=$595;
      label = 100; break;
    case 100: 
      var $597=$j;
      var $598=$half;
      var $599=$num_ri;
      var $600=$599 & 1;
      var $601=((($598)+($600))|0);
      var $602=(($597)|0) < (($601)|0);
      if ($602) { label = 101; break; } else { label = 116; break; }
    case 101: 
      var $604=$j;
      var $605=$ri;
      var $606=(($605+($604)*(28))|0);
      var $607=(($606)|0);
      $reg=$607;
      var $608=$j;
      var $609=$half;
      var $610=((($608)+($609))|0);
      var $611=$ri;
      var $612=(($611+($610)*(28))|0);
      var $613=(($612)|0);
      $hreg=$613;
      var $614=$reg;
      var $615=$reg;
      var $616=$hreg;
      var $617=_pixman_op($614, $615, $616, 22, 1, 1);
      var $618=(($617)|0)!=0;
      if ($618) { label = 103; break; } else { label = 102; break; }
    case 102: 
      $ret=0;
      label = 103; break;
    case 103: 
      var $621=$hreg;
      var $622=(($621)|0);
      var $623=(($622)|0);
      var $624=HEAP32[(($623)>>2)];
      var $625=$reg;
      var $626=(($625)|0);
      var $627=(($626)|0);
      var $628=HEAP32[(($627)>>2)];
      var $629=(($624)|0) < (($628)|0);
      if ($629) { label = 104; break; } else { label = 105; break; }
    case 104: 
      var $631=$hreg;
      var $632=(($631)|0);
      var $633=(($632)|0);
      var $634=HEAP32[(($633)>>2)];
      var $635=$reg;
      var $636=(($635)|0);
      var $637=(($636)|0);
      HEAP32[(($637)>>2)]=$634;
      label = 105; break;
    case 105: 
      var $639=$hreg;
      var $640=(($639)|0);
      var $641=(($640+4)|0);
      var $642=HEAP32[(($641)>>2)];
      var $643=$reg;
      var $644=(($643)|0);
      var $645=(($644+4)|0);
      var $646=HEAP32[(($645)>>2)];
      var $647=(($642)|0) < (($646)|0);
      if ($647) { label = 106; break; } else { label = 107; break; }
    case 106: 
      var $649=$hreg;
      var $650=(($649)|0);
      var $651=(($650+4)|0);
      var $652=HEAP32[(($651)>>2)];
      var $653=$reg;
      var $654=(($653)|0);
      var $655=(($654+4)|0);
      HEAP32[(($655)>>2)]=$652;
      label = 107; break;
    case 107: 
      var $657=$hreg;
      var $658=(($657)|0);
      var $659=(($658+8)|0);
      var $660=HEAP32[(($659)>>2)];
      var $661=$reg;
      var $662=(($661)|0);
      var $663=(($662+8)|0);
      var $664=HEAP32[(($663)>>2)];
      var $665=(($660)|0) > (($664)|0);
      if ($665) { label = 108; break; } else { label = 109; break; }
    case 108: 
      var $667=$hreg;
      var $668=(($667)|0);
      var $669=(($668+8)|0);
      var $670=HEAP32[(($669)>>2)];
      var $671=$reg;
      var $672=(($671)|0);
      var $673=(($672+8)|0);
      HEAP32[(($673)>>2)]=$670;
      label = 109; break;
    case 109: 
      var $675=$hreg;
      var $676=(($675)|0);
      var $677=(($676+12)|0);
      var $678=HEAP32[(($677)>>2)];
      var $679=$reg;
      var $680=(($679)|0);
      var $681=(($680+12)|0);
      var $682=HEAP32[(($681)>>2)];
      var $683=(($678)|0) > (($682)|0);
      if ($683) { label = 110; break; } else { label = 111; break; }
    case 110: 
      var $685=$hreg;
      var $686=(($685)|0);
      var $687=(($686+12)|0);
      var $688=HEAP32[(($687)>>2)];
      var $689=$reg;
      var $690=(($689)|0);
      var $691=(($690+12)|0);
      HEAP32[(($691)>>2)]=$688;
      label = 111; break;
    case 111: 
      var $693=$hreg;
      var $694=(($693+16)|0);
      var $695=HEAP32[(($694)>>2)];
      var $696=(($695)|0)!=0;
      if ($696) { label = 112; break; } else { label = 114; break; }
    case 112: 
      var $698=$hreg;
      var $699=(($698+16)|0);
      var $700=HEAP32[(($699)>>2)];
      var $701=(($700)|0);
      var $702=HEAP32[(($701)>>2)];
      var $703=(($702)|0)!=0;
      if ($703) { label = 113; break; } else { label = 114; break; }
    case 113: 
      var $705=$hreg;
      var $706=(($705+16)|0);
      var $707=HEAP32[(($706)>>2)];
      var $708=$707;
      _free($708);
      label = 114; break;
    case 114: 
      label = 115; break;
    case 115: 
      var $711=$j;
      var $712=((($711)+(1))|0);
      $j=$712;
      label = 100; break;
    case 116: 
      var $714=$half;
      var $715=$num_ri;
      var $716=((($715)-($714))|0);
      $num_ri=$716;
      var $717=$ret;
      var $718=(($717)|0)!=0;
      if ($718) { label = 118; break; } else { label = 117; break; }
    case 117: 
      label = 122; break;
    case 118: 
      label = 98; break;
    case 119: 
      var $722=$2;
      var $723=$ri;
      var $724=(($723)|0);
      var $725=(($724)|0);
      var $726=$722;
      var $727=$725;
      assert(20 % 1 === 0);HEAP32[(($726)>>2)]=HEAP32[(($727)>>2)];HEAP32[((($726)+(4))>>2)]=HEAP32[((($727)+(4))>>2)];HEAP32[((($726)+(8))>>2)]=HEAP32[((($727)+(8))>>2)];HEAP32[((($726)+(12))>>2)]=HEAP32[((($727)+(12))>>2)];HEAP32[((($726)+(16))>>2)]=HEAP32[((($727)+(16))>>2)];
      var $728=$ri;
      var $729=(($stack_regions)|0);
      var $730=(($728)|0)!=(($729)|0);
      if ($730) { label = 120; break; } else { label = 121; break; }
    case 120: 
      var $732=$ri;
      var $733=$732;
      _free($733);
      label = 121; break;
    case 121: 
      var $735=$ret;
      $1=$735;
      label = 132; break;
    case 122: 
      $i=0;
      label = 123; break;
    case 123: 
      var $738=$i;
      var $739=$num_ri;
      var $740=(($738)|0) < (($739)|0);
      if ($740) { label = 124; break; } else { label = 129; break; }
    case 124: 
      var $742=$i;
      var $743=$ri;
      var $744=(($743+($742)*(28))|0);
      var $745=(($744)|0);
      var $746=(($745+16)|0);
      var $747=HEAP32[(($746)>>2)];
      var $748=(($747)|0)!=0;
      if ($748) { label = 125; break; } else { label = 127; break; }
    case 125: 
      var $750=$i;
      var $751=$ri;
      var $752=(($751+($750)*(28))|0);
      var $753=(($752)|0);
      var $754=(($753+16)|0);
      var $755=HEAP32[(($754)>>2)];
      var $756=(($755)|0);
      var $757=HEAP32[(($756)>>2)];
      var $758=(($757)|0)!=0;
      if ($758) { label = 126; break; } else { label = 127; break; }
    case 126: 
      var $760=$i;
      var $761=$ri;
      var $762=(($761+($760)*(28))|0);
      var $763=(($762)|0);
      var $764=(($763+16)|0);
      var $765=HEAP32[(($764)>>2)];
      var $766=$765;
      _free($766);
      label = 127; break;
    case 127: 
      label = 128; break;
    case 128: 
      var $769=$i;
      var $770=((($769)+(1))|0);
      $i=$770;
      label = 123; break;
    case 129: 
      var $772=$ri;
      var $773=(($stack_regions)|0);
      var $774=(($772)|0)!=(($773)|0);
      if ($774) { label = 130; break; } else { label = 131; break; }
    case 130: 
      var $776=$ri;
      var $777=$776;
      _free($777);
      label = 131; break;
    case 131: 
      var $779=$2;
      var $780=_pixman_break($779);
      $1=$780;
      label = 132; break;
    case 132: 
      var $782=$1;
      STACKTOP = __stackBase__;
      return $782;
    default: assert(0, "bad label: " + label);
  }
}
_validate["X"]=1;

function _PIXREGION_SZOF($n) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $size;
      $2=$n;
      var $3=$2;
      var $4=((($3<<4))|0);
      $size=$4;
      var $5=$2;
      var $6=(($5)>>>0) > 268435455;
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $1=0;
      label = 7; break;
    case 4: 
      var $9=$size;
      var $10=(((-1)-($9))|0);
      var $11=8 > (($10)>>>0);
      if ($11) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $1=0;
      label = 7; break;
    case 6: 
      var $14=$size;
      var $15=((($14)+(8))|0);
      $1=$15;
      label = 7; break;
    case 7: 
      var $17=$1;

      return $17;
    default: assert(0, "bad label: " + label);
  }
}


function _pixman_coalesce($region, $prev_start, $cur_start) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $prev_box;
      var $cur_box;
      var $numRects;
      var $y2;
      $2=$region;
      $3=$prev_start;
      $4=$cur_start;
      var $5=$4;
      var $6=$3;
      var $7=((($5)-($6))|0);
      $numRects=$7;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      var $10=$numRects;
      var $11=(($10)|0)!=0;
      if ($11) { label = 6; break; } else { label = 5; break; }
    case 5: 
      var $13=$4;
      $1=$13;
      label = 18; break;
    case 6: 
      var $15=$3;
      var $16=$2;
      var $17=(($16+16)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=(($18+8)|0);
      var $20=$19;
      var $21=(($20+($15<<4))|0);
      $prev_box=$21;
      var $22=$4;
      var $23=$2;
      var $24=(($23+16)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25+8)|0);
      var $27=$26;
      var $28=(($27+($22<<4))|0);
      $cur_box=$28;
      var $29=$prev_box;
      var $30=(($29+12)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=$cur_box;
      var $33=(($32+4)|0);
      var $34=HEAP32[(($33)>>2)];
      var $35=(($31)|0)!=(($34)|0);
      if ($35) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $37=$4;
      $1=$37;
      label = 18; break;
    case 8: 
      var $39=$cur_box;
      var $40=(($39+12)|0);
      var $41=HEAP32[(($40)>>2)];
      $y2=$41;
      label = 9; break;
    case 9: 
      var $43=$prev_box;
      var $44=(($43)|0);
      var $45=HEAP32[(($44)>>2)];
      var $46=$cur_box;
      var $47=(($46)|0);
      var $48=HEAP32[(($47)>>2)];
      var $49=(($45)|0)!=(($48)|0);
      if ($49) { label = 11; break; } else { label = 10; break; }
    case 10: 
      var $51=$prev_box;
      var $52=(($51+8)|0);
      var $53=HEAP32[(($52)>>2)];
      var $54=$cur_box;
      var $55=(($54+8)|0);
      var $56=HEAP32[(($55)>>2)];
      var $57=(($53)|0)!=(($56)|0);
      if ($57) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $59=$4;
      $1=$59;
      label = 18; break;
    case 12: 
      var $61=$prev_box;
      var $62=(($61+16)|0);
      $prev_box=$62;
      var $63=$cur_box;
      var $64=(($63+16)|0);
      $cur_box=$64;
      var $65=$numRects;
      var $66=((($65)-(1))|0);
      $numRects=$66;
      label = 13; break;
    case 13: 
      var $68=$numRects;
      var $69=(($68)|0)!=0;
      if ($69) { label = 9; break; } else { label = 14; break; }
    case 14: 
      var $71=$4;
      var $72=$3;
      var $73=((($71)-($72))|0);
      $numRects=$73;
      var $74=$numRects;
      var $75=$2;
      var $76=(($75+16)|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=(($77+4)|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=((($79)-($74))|0);
      HEAP32[(($78)>>2)]=$80;
      label = 15; break;
    case 15: 
      var $82=$prev_box;
      var $83=((($82)-(16))|0);
      $prev_box=$83;
      var $84=$y2;
      var $85=$prev_box;
      var $86=(($85+12)|0);
      HEAP32[(($86)>>2)]=$84;
      var $87=$numRects;
      var $88=((($87)-(1))|0);
      $numRects=$88;
      label = 16; break;
    case 16: 
      var $90=$numRects;
      var $91=(($90)|0)!=0;
      if ($91) { label = 15; break; } else { label = 17; break; }
    case 17: 
      var $93=$3;
      $1=$93;
      label = 18; break;
    case 18: 
      var $95=$1;

      return $95;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_coalesce["X"]=1;

function _quick_sort_rects($rects, $numRects) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 64)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $y1;
      var $x1;
      var $i;
      var $j;
      var $r;
      var $t=__stackBase__;
      var $t1=(__stackBase__)+(16);
      var $t2=(__stackBase__)+(32);
      var $t3=(__stackBase__)+(48);
      $1=$rects;
      $2=$numRects;
      label = 3; break;
    case 3: 
      var $4=$2;
      var $5=(($4)|0)==2;
      if ($5) { label = 4; break; } else { label = 9; break; }
    case 4: 
      var $7=$1;
      var $8=(($7)|0);
      var $9=(($8+4)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=$1;
      var $12=(($11+16)|0);
      var $13=(($12+4)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=(($10)|0) > (($14)|0);
      if ($15) { label = 7; break; } else { label = 5; break; }
    case 5: 
      var $17=$1;
      var $18=(($17)|0);
      var $19=(($18+4)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=$1;
      var $22=(($21+16)|0);
      var $23=(($22+4)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($20)|0)==(($24)|0);
      if ($25) { label = 6; break; } else { label = 8; break; }
    case 6: 
      var $27=$1;
      var $28=(($27)|0);
      var $29=(($28)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$1;
      var $32=(($31+16)|0);
      var $33=(($32)|0);
      var $34=HEAP32[(($33)>>2)];
      var $35=(($30)|0) > (($34)|0);
      if ($35) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $37=$1;
      var $38=(($37)|0);
      var $39=$t;
      var $40=$38;
      assert(16 % 1 === 0);HEAP32[(($39)>>2)]=HEAP32[(($40)>>2)];HEAP32[((($39)+(4))>>2)]=HEAP32[((($40)+(4))>>2)];HEAP32[((($39)+(8))>>2)]=HEAP32[((($40)+(8))>>2)];HEAP32[((($39)+(12))>>2)]=HEAP32[((($40)+(12))>>2)];
      var $41=$1;
      var $42=(($41)|0);
      var $43=$1;
      var $44=(($43+16)|0);
      var $45=$42;
      var $46=$44;
      assert(16 % 1 === 0);HEAP32[(($45)>>2)]=HEAP32[(($46)>>2)];HEAP32[((($45)+(4))>>2)]=HEAP32[((($46)+(4))>>2)];HEAP32[((($45)+(8))>>2)]=HEAP32[((($46)+(8))>>2)];HEAP32[((($45)+(12))>>2)]=HEAP32[((($46)+(12))>>2)];
      var $47=$1;
      var $48=(($47+16)|0);
      var $49=$48;
      var $50=$t;
      assert(16 % 1 === 0);HEAP32[(($49)>>2)]=HEAP32[(($50)>>2)];HEAP32[((($49)+(4))>>2)]=HEAP32[((($50)+(4))>>2)];HEAP32[((($49)+(8))>>2)]=HEAP32[((($50)+(8))>>2)];HEAP32[((($49)+(12))>>2)]=HEAP32[((($50)+(12))>>2)];
      label = 8; break;
    case 8: 
      label = 34; break;
    case 9: 
      var $53=$1;
      var $54=(($53)|0);
      var $55=$t1;
      var $56=$54;
      assert(16 % 1 === 0);HEAP32[(($55)>>2)]=HEAP32[(($56)>>2)];HEAP32[((($55)+(4))>>2)]=HEAP32[((($56)+(4))>>2)];HEAP32[((($55)+(8))>>2)]=HEAP32[((($56)+(8))>>2)];HEAP32[((($55)+(12))>>2)]=HEAP32[((($56)+(12))>>2)];
      var $57=$1;
      var $58=(($57)|0);
      var $59=$2;
      var $60=$59 >> 1;
      var $61=$1;
      var $62=(($61+($60<<4))|0);
      var $63=$58;
      var $64=$62;
      assert(16 % 1 === 0);HEAP32[(($63)>>2)]=HEAP32[(($64)>>2)];HEAP32[((($63)+(4))>>2)]=HEAP32[((($64)+(4))>>2)];HEAP32[((($63)+(8))>>2)]=HEAP32[((($64)+(8))>>2)];HEAP32[((($63)+(12))>>2)]=HEAP32[((($64)+(12))>>2)];
      var $65=$2;
      var $66=$65 >> 1;
      var $67=$1;
      var $68=(($67+($66<<4))|0);
      var $69=$68;
      var $70=$t1;
      assert(16 % 1 === 0);HEAP32[(($69)>>2)]=HEAP32[(($70)>>2)];HEAP32[((($69)+(4))>>2)]=HEAP32[((($70)+(4))>>2)];HEAP32[((($69)+(8))>>2)]=HEAP32[((($70)+(8))>>2)];HEAP32[((($69)+(12))>>2)]=HEAP32[((($70)+(12))>>2)];
      var $71=$1;
      var $72=(($71)|0);
      var $73=(($72+4)|0);
      var $74=HEAP32[(($73)>>2)];
      $y1=$74;
      var $75=$1;
      var $76=(($75)|0);
      var $77=(($76)|0);
      var $78=HEAP32[(($77)>>2)];
      $x1=$78;
      $i=0;
      var $79=$2;
      $j=$79;
      label = 10; break;
    case 10: 
      var $81=$i;
      var $82=$1;
      var $83=(($82+($81<<4))|0);
      $r=$83;
      label = 11; break;
    case 11: 
      var $85=$r;
      var $86=(($85+16)|0);
      $r=$86;
      var $87=$i;
      var $88=((($87)+(1))|0);
      $i=$88;
      label = 12; break;
    case 12: 
      var $90=$i;
      var $91=$2;
      var $92=(($90)|0)!=(($91)|0);
      if ($92) { label = 13; break; } else { var $116 = 0;label = 18; break; }
    case 13: 
      var $94=$r;
      var $95=(($94+4)|0);
      var $96=HEAP32[(($95)>>2)];
      var $97=$y1;
      var $98=(($96)|0) < (($97)|0);
      if ($98) { var $114 = 1;label = 17; break; } else { label = 14; break; }
    case 14: 
      var $100=$r;
      var $101=(($100+4)|0);
      var $102=HEAP32[(($101)>>2)];
      var $103=$y1;
      var $104=(($102)|0)==(($103)|0);
      if ($104) { label = 15; break; } else { var $112 = 0;label = 16; break; }
    case 15: 
      var $106=$r;
      var $107=(($106)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=$x1;
      var $110=(($108)|0) < (($109)|0);
      var $112 = $110;label = 16; break;
    case 16: 
      var $112;
      var $114 = $112;label = 17; break;
    case 17: 
      var $114;
      var $116 = $114;label = 18; break;
    case 18: 
      var $116;
      if ($116) { label = 11; break; } else { label = 19; break; }
    case 19: 
      var $118=$j;
      var $119=$1;
      var $120=(($119+($118<<4))|0);
      $r=$120;
      label = 20; break;
    case 20: 
      var $122=$r;
      var $123=((($122)-(16))|0);
      $r=$123;
      var $124=$j;
      var $125=((($124)-(1))|0);
      $j=$125;
      label = 21; break;
    case 21: 
      var $127=$y1;
      var $128=$r;
      var $129=(($128+4)|0);
      var $130=HEAP32[(($129)>>2)];
      var $131=(($127)|0) < (($130)|0);
      if ($131) { var $147 = 1;label = 25; break; } else { label = 22; break; }
    case 22: 
      var $133=$y1;
      var $134=$r;
      var $135=(($134+4)|0);
      var $136=HEAP32[(($135)>>2)];
      var $137=(($133)|0)==(($136)|0);
      if ($137) { label = 23; break; } else { var $145 = 0;label = 24; break; }
    case 23: 
      var $139=$x1;
      var $140=$r;
      var $141=(($140)|0);
      var $142=HEAP32[(($141)>>2)];
      var $143=(($139)|0) < (($142)|0);
      var $145 = $143;label = 24; break;
    case 24: 
      var $145;
      var $147 = $145;label = 25; break;
    case 25: 
      var $147;
      if ($147) { label = 20; break; } else { label = 26; break; }
    case 26: 
      var $149=$i;
      var $150=$j;
      var $151=(($149)|0) < (($150)|0);
      if ($151) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $153=$i;
      var $154=$1;
      var $155=(($154+($153<<4))|0);
      var $156=$t2;
      var $157=$155;
      assert(16 % 1 === 0);HEAP32[(($156)>>2)]=HEAP32[(($157)>>2)];HEAP32[((($156)+(4))>>2)]=HEAP32[((($157)+(4))>>2)];HEAP32[((($156)+(8))>>2)]=HEAP32[((($157)+(8))>>2)];HEAP32[((($156)+(12))>>2)]=HEAP32[((($157)+(12))>>2)];
      var $158=$i;
      var $159=$1;
      var $160=(($159+($158<<4))|0);
      var $161=$j;
      var $162=$1;
      var $163=(($162+($161<<4))|0);
      var $164=$160;
      var $165=$163;
      assert(16 % 1 === 0);HEAP32[(($164)>>2)]=HEAP32[(($165)>>2)];HEAP32[((($164)+(4))>>2)]=HEAP32[((($165)+(4))>>2)];HEAP32[((($164)+(8))>>2)]=HEAP32[((($165)+(8))>>2)];HEAP32[((($164)+(12))>>2)]=HEAP32[((($165)+(12))>>2)];
      var $166=$j;
      var $167=$1;
      var $168=(($167+($166<<4))|0);
      var $169=$168;
      var $170=$t2;
      assert(16 % 1 === 0);HEAP32[(($169)>>2)]=HEAP32[(($170)>>2)];HEAP32[((($169)+(4))>>2)]=HEAP32[((($170)+(4))>>2)];HEAP32[((($169)+(8))>>2)]=HEAP32[((($170)+(8))>>2)];HEAP32[((($169)+(12))>>2)]=HEAP32[((($170)+(12))>>2)];
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      var $173=$i;
      var $174=$j;
      var $175=(($173)|0) < (($174)|0);
      if ($175) { label = 10; break; } else { label = 30; break; }
    case 30: 
      var $177=$1;
      var $178=(($177)|0);
      var $179=$t3;
      var $180=$178;
      assert(16 % 1 === 0);HEAP32[(($179)>>2)]=HEAP32[(($180)>>2)];HEAP32[((($179)+(4))>>2)]=HEAP32[((($180)+(4))>>2)];HEAP32[((($179)+(8))>>2)]=HEAP32[((($180)+(8))>>2)];HEAP32[((($179)+(12))>>2)]=HEAP32[((($180)+(12))>>2)];
      var $181=$1;
      var $182=(($181)|0);
      var $183=$j;
      var $184=$1;
      var $185=(($184+($183<<4))|0);
      var $186=$182;
      var $187=$185;
      assert(16 % 1 === 0);HEAP32[(($186)>>2)]=HEAP32[(($187)>>2)];HEAP32[((($186)+(4))>>2)]=HEAP32[((($187)+(4))>>2)];HEAP32[((($186)+(8))>>2)]=HEAP32[((($187)+(8))>>2)];HEAP32[((($186)+(12))>>2)]=HEAP32[((($187)+(12))>>2)];
      var $188=$j;
      var $189=$1;
      var $190=(($189+($188<<4))|0);
      var $191=$190;
      var $192=$t3;
      assert(16 % 1 === 0);HEAP32[(($191)>>2)]=HEAP32[(($192)>>2)];HEAP32[((($191)+(4))>>2)]=HEAP32[((($192)+(4))>>2)];HEAP32[((($191)+(8))>>2)]=HEAP32[((($192)+(8))>>2)];HEAP32[((($191)+(12))>>2)]=HEAP32[((($192)+(12))>>2)];
      var $193=$2;
      var $194=$j;
      var $195=((($193)-($194))|0);
      var $196=((($195)-(1))|0);
      var $197=(($196)|0) > 1;
      if ($197) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $199=$j;
      var $200=((($199)+(1))|0);
      var $201=$1;
      var $202=(($201+($200<<4))|0);
      var $203=$2;
      var $204=$j;
      var $205=((($203)-($204))|0);
      var $206=((($205)-(1))|0);
      _quick_sort_rects($202, $206);
      label = 32; break;
    case 32: 
      var $208=$j;
      $2=$208;
      label = 33; break;
    case 33: 
      var $210=$2;
      var $211=(($210)|0) > 1;
      if ($211) { label = 3; break; } else { label = 34; break; }
    case 34: 
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
_quick_sort_rects["X"]=1;

function _pixman_region_append_non_o($region, $r, $r_end, $y1, $y2) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $next_rect;
      var $new_rects;
      $2=$region;
      $3=$r;
      $4=$r_end;
      $5=$y1;
      $6=$y2;
      var $7=$4;
      var $8=$3;
      var $9=$7;
      var $10=$8;
      var $11=((($9)-($10))|0);
      var $12=((((($11)|0))/(16))&-1);
      $new_rects=$12;
      label = 3; break;
    case 3: 
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $18=$2;
      var $19=(($18+16)|0);
      var $20=HEAP32[(($19)>>2)];
      var $21=(($20)|0)!=0;
      if ($21) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $23=$2;
      var $24=(($23+16)|0);
      var $25=HEAP32[(($24)>>2)];
      var $26=(($25+4)|0);
      var $27=HEAP32[(($26)>>2)];
      var $28=$new_rects;
      var $29=((($27)+($28))|0);
      var $30=$2;
      var $31=(($30+16)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($32)|0);
      var $34=HEAP32[(($33)>>2)];
      var $35=(($29)|0) > (($34)|0);
      if ($35) { label = 9; break; } else { label = 12; break; }
    case 9: 
      var $37=$2;
      var $38=$new_rects;
      var $39=_pixman_rect_alloc($37, $38);
      var $40=(($39)|0)!=0;
      if ($40) { label = 11; break; } else { label = 10; break; }
    case 10: 
      $1=0;
      label = 21; break;
    case 11: 
      label = 12; break;
    case 12: 
      label = 13; break;
    case 13: 
      var $45=$2;
      var $46=(($45+16)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($47+4)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$2;
      var $51=(($50+16)|0);
      var $52=HEAP32[(($51)>>2)];
      var $53=(($52+8)|0);
      var $54=$53;
      var $55=(($54+($49<<4))|0);
      $next_rect=$55;
      var $56=$new_rects;
      var $57=$2;
      var $58=(($57+16)|0);
      var $59=HEAP32[(($58)>>2)];
      var $60=(($59+4)|0);
      var $61=HEAP32[(($60)>>2)];
      var $62=((($61)+($56))|0);
      HEAP32[(($60)>>2)]=$62;
      label = 14; break;
    case 14: 
      label = 15; break;
    case 15: 
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $67=$3;
      var $68=(($67)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=$next_rect;
      var $71=(($70)|0);
      HEAP32[(($71)>>2)]=$69;
      var $72=$5;
      var $73=$next_rect;
      var $74=(($73+4)|0);
      HEAP32[(($74)>>2)]=$72;
      var $75=$3;
      var $76=(($75+8)|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=$next_rect;
      var $79=(($78+8)|0);
      HEAP32[(($79)>>2)]=$77;
      var $80=$6;
      var $81=$next_rect;
      var $82=(($81+12)|0);
      HEAP32[(($82)>>2)]=$80;
      var $83=$next_rect;
      var $84=(($83+16)|0);
      $next_rect=$84;
      label = 18; break;
    case 18: 
      var $86=$3;
      var $87=(($86+16)|0);
      $3=$87;
      label = 19; break;
    case 19: 
      var $89=$3;
      var $90=$4;
      var $91=(($89)|0)!=(($90)|0);
      if ($91) { label = 14; break; } else { label = 20; break; }
    case 20: 
      $1=1;
      label = 21; break;
    case 21: 
      var $94=$1;

      return $94;
    default: assert(0, "bad label: " + label);
  }
}
_pixman_region_append_non_o["X"]=1;

function _malloc($bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $mem;
      var $nb;
      var $idx;
      var $smallbits;
      var $b;
      var $p;
      var $F;
      var $b1;
      var $p2;
      var $r;
      var $rsize;
      var $i;
      var $leftbits;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $F3;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F4;
      var $rsize5;
      var $p6;
      var $r7;
      var $dvs;
      var $rsize8;
      var $p9;
      var $r10;
      $1=$bytes;
      var $2=$1;
      var $3=(($2)>>>0) <= 244;
      if ($3) { label = 3; break; } else { label = 38; break; }
    case 3: 
      var $5=$1;
      var $6=(($5)>>>0) < 11;
      if ($6) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $14 = 16;label = 6; break;
    case 5: 
      var $9=$1;
      var $10=((($9)+(4))|0);
      var $11=((($10)+(7))|0);
      var $12=$11 & -8;
      var $14 = $12;label = 6; break;
    case 6: 
      var $14;
      $nb=$14;
      var $15=$nb;
      var $16=$15 >>> 3;
      $idx=$16;
      var $17=HEAP32[((((5243136)|0))>>2)];
      var $18=$idx;
      var $19=$17 >>> (($18)>>>0);
      $smallbits=$19;
      var $20=$smallbits;
      var $21=$20 & 3;
      var $22=(($21)|0)!=0;
      if ($22) { label = 7; break; } else { label = 14; break; }
    case 7: 
      var $24=$smallbits;
      var $25=$24 ^ -1;
      var $26=$25 & 1;
      var $27=$idx;
      var $28=((($27)+($26))|0);
      $idx=$28;
      var $29=$idx;
      var $30=$29 << 1;
      var $31=((((5243176)|0)+($30<<2))|0);
      var $32=$31;
      var $33=$32;
      $b=$33;
      var $34=$b;
      var $35=(($34+8)|0);
      var $36=HEAP32[(($35)>>2)];
      $p=$36;
      var $37=$p;
      var $38=(($37+8)|0);
      var $39=HEAP32[(($38)>>2)];
      $F=$39;
      var $40=$b;
      var $41=$F;
      var $42=(($40)|0)==(($41)|0);
      if ($42) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $44=$idx;
      var $45=1 << $44;
      var $46=$45 ^ -1;
      var $47=HEAP32[((((5243136)|0))>>2)];
      var $48=$47 & $46;
      HEAP32[((((5243136)|0))>>2)]=$48;
      label = 13; break;
    case 9: 
      var $50=$F;
      var $51=$50;
      var $52=HEAP32[((((5243152)|0))>>2)];
      var $53=(($51)>>>0) >= (($52)>>>0);
      var $54=(($53)&1);
      var $55=($54);
      var $56=(($55)|0)!=0;
      if ($56) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $58=$F;
      var $59=$b;
      var $60=(($59+8)|0);
      HEAP32[(($60)>>2)]=$58;
      var $61=$b;
      var $62=$F;
      var $63=(($62+12)|0);
      HEAP32[(($63)>>2)]=$61;
      label = 12; break;
    case 11: 
      _abort();
      throw "Reached an unreachable!"
    case 12: 
      label = 13; break;
    case 13: 
      var $67=$idx;
      var $68=$67 << 3;
      var $69=$68 | 1;
      var $70=$69 | 2;
      var $71=$p;
      var $72=(($71+4)|0);
      HEAP32[(($72)>>2)]=$70;
      var $73=$p;
      var $74=$73;
      var $75=$idx;
      var $76=$75 << 3;
      var $77=(($74+$76)|0);
      var $78=$77;
      var $79=(($78+4)|0);
      var $80=HEAP32[(($79)>>2)];
      var $81=$80 | 1;
      HEAP32[(($79)>>2)]=$81;
      var $82=$p;
      var $83=$82;
      var $84=(($83+8)|0);
      $mem=$84;
      label = 54; break;
    case 14: 
      var $86=$nb;
      var $87=HEAP32[((((5243144)|0))>>2)];
      var $88=(($86)>>>0) > (($87)>>>0);
      if ($88) { label = 15; break; } else { label = 36; break; }
    case 15: 
      var $90=$smallbits;
      var $91=(($90)|0)!=0;
      if ($91) { label = 16; break; } else { label = 31; break; }
    case 16: 
      var $93=$smallbits;
      var $94=$idx;
      var $95=$93 << $94;
      var $96=$idx;
      var $97=1 << $96;
      var $98=$97 << 1;
      var $99=$idx;
      var $100=1 << $99;
      var $101=$100 << 1;
      var $102=(((-$101))|0);
      var $103=$98 | $102;
      var $104=$95 & $103;
      $leftbits=$104;
      var $105=$leftbits;
      var $106=$leftbits;
      var $107=(((-$106))|0);
      var $108=$105 & $107;
      $leastbit=$108;
      var $109=$leastbit;
      var $110=((($109)-(1))|0);
      $Y=$110;
      var $111=$Y;
      var $112=$111 >>> 12;
      var $113=$112 & 16;
      $K=$113;
      var $114=$K;
      $N=$114;
      var $115=$K;
      var $116=$Y;
      var $117=$116 >>> (($115)>>>0);
      $Y=$117;
      var $118=$Y;
      var $119=$118 >>> 5;
      var $120=$119 & 8;
      $K=$120;
      var $121=$N;
      var $122=((($121)+($120))|0);
      $N=$122;
      var $123=$K;
      var $124=$Y;
      var $125=$124 >>> (($123)>>>0);
      $Y=$125;
      var $126=$Y;
      var $127=$126 >>> 2;
      var $128=$127 & 4;
      $K=$128;
      var $129=$N;
      var $130=((($129)+($128))|0);
      $N=$130;
      var $131=$K;
      var $132=$Y;
      var $133=$132 >>> (($131)>>>0);
      $Y=$133;
      var $134=$Y;
      var $135=$134 >>> 1;
      var $136=$135 & 2;
      $K=$136;
      var $137=$N;
      var $138=((($137)+($136))|0);
      $N=$138;
      var $139=$K;
      var $140=$Y;
      var $141=$140 >>> (($139)>>>0);
      $Y=$141;
      var $142=$Y;
      var $143=$142 >>> 1;
      var $144=$143 & 1;
      $K=$144;
      var $145=$N;
      var $146=((($145)+($144))|0);
      $N=$146;
      var $147=$K;
      var $148=$Y;
      var $149=$148 >>> (($147)>>>0);
      $Y=$149;
      var $150=$N;
      var $151=$Y;
      var $152=((($150)+($151))|0);
      $i=$152;
      var $153=$i;
      var $154=$153 << 1;
      var $155=((((5243176)|0)+($154<<2))|0);
      var $156=$155;
      var $157=$156;
      $b1=$157;
      var $158=$b1;
      var $159=(($158+8)|0);
      var $160=HEAP32[(($159)>>2)];
      $p2=$160;
      var $161=$p2;
      var $162=(($161+8)|0);
      var $163=HEAP32[(($162)>>2)];
      $F3=$163;
      var $164=$b1;
      var $165=$F3;
      var $166=(($164)|0)==(($165)|0);
      if ($166) { label = 17; break; } else { label = 18; break; }
    case 17: 
      var $168=$i;
      var $169=1 << $168;
      var $170=$169 ^ -1;
      var $171=HEAP32[((((5243136)|0))>>2)];
      var $172=$171 & $170;
      HEAP32[((((5243136)|0))>>2)]=$172;
      label = 22; break;
    case 18: 
      var $174=$F3;
      var $175=$174;
      var $176=HEAP32[((((5243152)|0))>>2)];
      var $177=(($175)>>>0) >= (($176)>>>0);
      var $178=(($177)&1);
      var $179=($178);
      var $180=(($179)|0)!=0;
      if ($180) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $182=$F3;
      var $183=$b1;
      var $184=(($183+8)|0);
      HEAP32[(($184)>>2)]=$182;
      var $185=$b1;
      var $186=$F3;
      var $187=(($186+12)|0);
      HEAP32[(($187)>>2)]=$185;
      label = 21; break;
    case 20: 
      _abort();
      throw "Reached an unreachable!"
    case 21: 
      label = 22; break;
    case 22: 
      var $191=$i;
      var $192=$191 << 3;
      var $193=$nb;
      var $194=((($192)-($193))|0);
      $rsize=$194;
      var $195=$nb;
      var $196=$195 | 1;
      var $197=$196 | 2;
      var $198=$p2;
      var $199=(($198+4)|0);
      HEAP32[(($199)>>2)]=$197;
      var $200=$p2;
      var $201=$200;
      var $202=$nb;
      var $203=(($201+$202)|0);
      var $204=$203;
      $r=$204;
      var $205=$rsize;
      var $206=$205 | 1;
      var $207=$r;
      var $208=(($207+4)|0);
      HEAP32[(($208)>>2)]=$206;
      var $209=$rsize;
      var $210=$r;
      var $211=$210;
      var $212=$rsize;
      var $213=(($211+$212)|0);
      var $214=$213;
      var $215=(($214)|0);
      HEAP32[(($215)>>2)]=$209;
      var $216=HEAP32[((((5243144)|0))>>2)];
      $DVS=$216;
      var $217=$DVS;
      var $218=(($217)|0)!=0;
      if ($218) { label = 23; break; } else { label = 30; break; }
    case 23: 
      var $220=HEAP32[((((5243156)|0))>>2)];
      $DV=$220;
      var $221=$DVS;
      var $222=$221 >>> 3;
      $I=$222;
      var $223=$I;
      var $224=$223 << 1;
      var $225=((((5243176)|0)+($224<<2))|0);
      var $226=$225;
      var $227=$226;
      $B=$227;
      var $228=$B;
      $F4=$228;
      var $229=HEAP32[((((5243136)|0))>>2)];
      var $230=$I;
      var $231=1 << $230;
      var $232=$229 & $231;
      var $233=(($232)|0)!=0;
      if ($233) { label = 25; break; } else { label = 24; break; }
    case 24: 
      var $235=$I;
      var $236=1 << $235;
      var $237=HEAP32[((((5243136)|0))>>2)];
      var $238=$237 | $236;
      HEAP32[((((5243136)|0))>>2)]=$238;
      label = 29; break;
    case 25: 
      var $240=$B;
      var $241=(($240+8)|0);
      var $242=HEAP32[(($241)>>2)];
      var $243=$242;
      var $244=HEAP32[((((5243152)|0))>>2)];
      var $245=(($243)>>>0) >= (($244)>>>0);
      var $246=(($245)&1);
      var $247=($246);
      var $248=(($247)|0)!=0;
      if ($248) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $250=$B;
      var $251=(($250+8)|0);
      var $252=HEAP32[(($251)>>2)];
      $F4=$252;
      label = 28; break;
    case 27: 
      _abort();
      throw "Reached an unreachable!"
    case 28: 
      label = 29; break;
    case 29: 
      var $256=$DV;
      var $257=$B;
      var $258=(($257+8)|0);
      HEAP32[(($258)>>2)]=$256;
      var $259=$DV;
      var $260=$F4;
      var $261=(($260+12)|0);
      HEAP32[(($261)>>2)]=$259;
      var $262=$F4;
      var $263=$DV;
      var $264=(($263+8)|0);
      HEAP32[(($264)>>2)]=$262;
      var $265=$B;
      var $266=$DV;
      var $267=(($266+12)|0);
      HEAP32[(($267)>>2)]=$265;
      label = 30; break;
    case 30: 
      var $269=$rsize;
      HEAP32[((((5243144)|0))>>2)]=$269;
      var $270=$r;
      HEAP32[((((5243156)|0))>>2)]=$270;
      var $271=$p2;
      var $272=$271;
      var $273=(($272+8)|0);
      $mem=$273;
      label = 54; break;
    case 31: 
      var $275=HEAP32[((((5243140)|0))>>2)];
      var $276=(($275)|0)!=0;
      if ($276) { label = 32; break; } else { label = 34; break; }
    case 32: 
      var $278=$nb;
      var $279=_tmalloc_small(5243136, $278);
      $mem=$279;
      var $280=(($279)|0)!=0;
      if ($280) { label = 33; break; } else { label = 34; break; }
    case 33: 
      label = 54; break;
    case 34: 
      label = 35; break;
    case 35: 
      label = 36; break;
    case 36: 
      label = 37; break;
    case 37: 
      label = 45; break;
    case 38: 
      var $287=$1;
      var $288=(($287)>>>0) >= 4294967232;
      if ($288) { label = 39; break; } else { label = 40; break; }
    case 39: 
      $nb=-1;
      label = 44; break;
    case 40: 
      var $291=$1;
      var $292=((($291)+(4))|0);
      var $293=((($292)+(7))|0);
      var $294=$293 & -8;
      $nb=$294;
      var $295=HEAP32[((((5243140)|0))>>2)];
      var $296=(($295)|0)!=0;
      if ($296) { label = 41; break; } else { label = 43; break; }
    case 41: 
      var $298=$nb;
      var $299=_tmalloc_large(5243136, $298);
      $mem=$299;
      var $300=(($299)|0)!=0;
      if ($300) { label = 42; break; } else { label = 43; break; }
    case 42: 
      label = 54; break;
    case 43: 
      label = 44; break;
    case 44: 
      label = 45; break;
    case 45: 
      var $305=$nb;
      var $306=HEAP32[((((5243144)|0))>>2)];
      var $307=(($305)>>>0) <= (($306)>>>0);
      if ($307) { label = 46; break; } else { label = 50; break; }
    case 46: 
      var $309=HEAP32[((((5243144)|0))>>2)];
      var $310=$nb;
      var $311=((($309)-($310))|0);
      $rsize5=$311;
      var $312=HEAP32[((((5243156)|0))>>2)];
      $p6=$312;
      var $313=$rsize5;
      var $314=(($313)>>>0) >= 16;
      if ($314) { label = 47; break; } else { label = 48; break; }
    case 47: 
      var $316=$p6;
      var $317=$316;
      var $318=$nb;
      var $319=(($317+$318)|0);
      var $320=$319;
      HEAP32[((((5243156)|0))>>2)]=$320;
      $r7=$320;
      var $321=$rsize5;
      HEAP32[((((5243144)|0))>>2)]=$321;
      var $322=$rsize5;
      var $323=$322 | 1;
      var $324=$r7;
      var $325=(($324+4)|0);
      HEAP32[(($325)>>2)]=$323;
      var $326=$rsize5;
      var $327=$r7;
      var $328=$327;
      var $329=$rsize5;
      var $330=(($328+$329)|0);
      var $331=$330;
      var $332=(($331)|0);
      HEAP32[(($332)>>2)]=$326;
      var $333=$nb;
      var $334=$333 | 1;
      var $335=$334 | 2;
      var $336=$p6;
      var $337=(($336+4)|0);
      HEAP32[(($337)>>2)]=$335;
      label = 49; break;
    case 48: 
      var $339=HEAP32[((((5243144)|0))>>2)];
      $dvs=$339;
      HEAP32[((((5243144)|0))>>2)]=0;
      HEAP32[((((5243156)|0))>>2)]=0;
      var $340=$dvs;
      var $341=$340 | 1;
      var $342=$341 | 2;
      var $343=$p6;
      var $344=(($343+4)|0);
      HEAP32[(($344)>>2)]=$342;
      var $345=$p6;
      var $346=$345;
      var $347=$dvs;
      var $348=(($346+$347)|0);
      var $349=$348;
      var $350=(($349+4)|0);
      var $351=HEAP32[(($350)>>2)];
      var $352=$351 | 1;
      HEAP32[(($350)>>2)]=$352;
      label = 49; break;
    case 49: 
      var $354=$p6;
      var $355=$354;
      var $356=(($355+8)|0);
      $mem=$356;
      label = 54; break;
    case 50: 
      var $358=$nb;
      var $359=HEAP32[((((5243148)|0))>>2)];
      var $360=(($358)>>>0) < (($359)>>>0);
      if ($360) { label = 51; break; } else { label = 52; break; }
    case 51: 
      var $362=$nb;
      var $363=HEAP32[((((5243148)|0))>>2)];
      var $364=((($363)-($362))|0);
      HEAP32[((((5243148)|0))>>2)]=$364;
      $rsize8=$364;
      var $365=HEAP32[((((5243160)|0))>>2)];
      $p9=$365;
      var $366=$p9;
      var $367=$366;
      var $368=$nb;
      var $369=(($367+$368)|0);
      var $370=$369;
      HEAP32[((((5243160)|0))>>2)]=$370;
      $r10=$370;
      var $371=$rsize8;
      var $372=$371 | 1;
      var $373=$r10;
      var $374=(($373+4)|0);
      HEAP32[(($374)>>2)]=$372;
      var $375=$nb;
      var $376=$375 | 1;
      var $377=$376 | 2;
      var $378=$p9;
      var $379=(($378+4)|0);
      HEAP32[(($379)>>2)]=$377;
      var $380=$p9;
      var $381=$380;
      var $382=(($381+8)|0);
      $mem=$382;
      label = 54; break;
    case 52: 
      label = 53; break;
    case 53: 
      var $385=$nb;
      var $386=_sys_alloc(5243136, $385);
      $mem=$386;
      label = 54; break;
    case 54: 
      var $388=$mem;

      return $388;
    default: assert(0, "bad label: " + label);
  }
}
_malloc["X"]=1;

function _tmalloc_small($m, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $t;
      var $v;
      var $rsize;
      var $i;
      var $leastbit;
      var $Y;
      var $K;
      var $N;
      var $trem;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $DVS;
      var $DV;
      var $I;
      var $B;
      var $F1;
      $1=$m;
      $2=$nb;
      var $3=$1;
      var $4=(($3+4)|0);
      var $5=HEAP32[(($4)>>2)];
      var $6=$1;
      var $7=(($6+4)|0);
      var $8=HEAP32[(($7)>>2)];
      var $9=(((-$8))|0);
      var $10=$5 & $9;
      $leastbit=$10;
      var $11=$leastbit;
      var $12=((($11)-(1))|0);
      $Y=$12;
      var $13=$Y;
      var $14=$13 >>> 12;
      var $15=$14 & 16;
      $K=$15;
      var $16=$K;
      $N=$16;
      var $17=$K;
      var $18=$Y;
      var $19=$18 >>> (($17)>>>0);
      $Y=$19;
      var $20=$Y;
      var $21=$20 >>> 5;
      var $22=$21 & 8;
      $K=$22;
      var $23=$N;
      var $24=((($23)+($22))|0);
      $N=$24;
      var $25=$K;
      var $26=$Y;
      var $27=$26 >>> (($25)>>>0);
      $Y=$27;
      var $28=$Y;
      var $29=$28 >>> 2;
      var $30=$29 & 4;
      $K=$30;
      var $31=$N;
      var $32=((($31)+($30))|0);
      $N=$32;
      var $33=$K;
      var $34=$Y;
      var $35=$34 >>> (($33)>>>0);
      $Y=$35;
      var $36=$Y;
      var $37=$36 >>> 1;
      var $38=$37 & 2;
      $K=$38;
      var $39=$N;
      var $40=((($39)+($38))|0);
      $N=$40;
      var $41=$K;
      var $42=$Y;
      var $43=$42 >>> (($41)>>>0);
      $Y=$43;
      var $44=$Y;
      var $45=$44 >>> 1;
      var $46=$45 & 1;
      $K=$46;
      var $47=$N;
      var $48=((($47)+($46))|0);
      $N=$48;
      var $49=$K;
      var $50=$Y;
      var $51=$50 >>> (($49)>>>0);
      $Y=$51;
      var $52=$N;
      var $53=$Y;
      var $54=((($52)+($53))|0);
      $i=$54;
      var $55=$i;
      var $56=$1;
      var $57=(($56+304)|0);
      var $58=(($57+($55<<2))|0);
      var $59=HEAP32[(($58)>>2)];
      $t=$59;
      $v=$59;
      var $60=$t;
      var $61=(($60+4)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=$62 & -8;
      var $64=$2;
      var $65=((($63)-($64))|0);
      $rsize=$65;
      label = 3; break;
    case 3: 
      var $67=$t;
      var $68=(($67+16)|0);
      var $69=(($68)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=(($70)|0)!=0;
      if ($71) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $73=$t;
      var $74=(($73+16)|0);
      var $75=(($74)|0);
      var $76=HEAP32[(($75)>>2)];
      var $83 = $76;label = 6; break;
    case 5: 
      var $78=$t;
      var $79=(($78+16)|0);
      var $80=(($79+4)|0);
      var $81=HEAP32[(($80)>>2)];
      var $83 = $81;label = 6; break;
    case 6: 
      var $83;
      $t=$83;
      var $84=(($83)|0)!=0;
      if ($84) { label = 7; break; } else { label = 10; break; }
    case 7: 
      var $86=$t;
      var $87=(($86+4)|0);
      var $88=HEAP32[(($87)>>2)];
      var $89=$88 & -8;
      var $90=$2;
      var $91=((($89)-($90))|0);
      $trem=$91;
      var $92=$trem;
      var $93=$rsize;
      var $94=(($92)>>>0) < (($93)>>>0);
      if ($94) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $96=$trem;
      $rsize=$96;
      var $97=$t;
      $v=$97;
      label = 9; break;
    case 9: 
      label = 3; break;
    case 10: 
      var $100=$v;
      var $101=$100;
      var $102=$1;
      var $103=(($102+16)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=(($101)>>>0) >= (($104)>>>0);
      var $106=(($105)&1);
      var $107=($106);
      var $108=(($107)|0)!=0;
      if ($108) { label = 11; break; } else { label = 70; break; }
    case 11: 
      var $110=$v;
      var $111=$110;
      var $112=$2;
      var $113=(($111+$112)|0);
      var $114=$113;
      $r=$114;
      var $115=$v;
      var $116=$115;
      var $117=$r;
      var $118=$117;
      var $119=(($116)>>>0) < (($118)>>>0);
      var $120=(($119)&1);
      var $121=($120);
      var $122=(($121)|0)!=0;
      if ($122) { label = 12; break; } else { label = 69; break; }
    case 12: 
      var $124=$v;
      var $125=(($124+24)|0);
      var $126=HEAP32[(($125)>>2)];
      $XP=$126;
      var $127=$v;
      var $128=(($127+12)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=$v;
      var $131=(($129)|0)!=(($130)|0);
      if ($131) { label = 13; break; } else { label = 17; break; }
    case 13: 
      var $133=$v;
      var $134=(($133+8)|0);
      var $135=HEAP32[(($134)>>2)];
      $F=$135;
      var $136=$v;
      var $137=(($136+12)|0);
      var $138=HEAP32[(($137)>>2)];
      $R=$138;
      var $139=$F;
      var $140=$139;
      var $141=$1;
      var $142=(($141+16)|0);
      var $143=HEAP32[(($142)>>2)];
      var $144=(($140)>>>0) >= (($143)>>>0);
      var $145=(($144)&1);
      var $146=($145);
      var $147=(($146)|0)!=0;
      if ($147) { label = 14; break; } else { label = 15; break; }
    case 14: 
      var $149=$R;
      var $150=$F;
      var $151=(($150+12)|0);
      HEAP32[(($151)>>2)]=$149;
      var $152=$F;
      var $153=$R;
      var $154=(($153+8)|0);
      HEAP32[(($154)>>2)]=$152;
      label = 16; break;
    case 15: 
      _abort();
      throw "Reached an unreachable!"
    case 16: 
      label = 29; break;
    case 17: 
      var $158=$v;
      var $159=(($158+16)|0);
      var $160=(($159+4)|0);
      $RP=$160;
      var $161=HEAP32[(($160)>>2)];
      $R=$161;
      var $162=(($161)|0)!=0;
      if ($162) { label = 19; break; } else { label = 18; break; }
    case 18: 
      var $164=$v;
      var $165=(($164+16)|0);
      var $166=(($165)|0);
      $RP=$166;
      var $167=HEAP32[(($166)>>2)];
      $R=$167;
      var $168=(($167)|0)!=0;
      if ($168) { label = 19; break; } else { label = 28; break; }
    case 19: 
      label = 20; break;
    case 20: 
      var $171=$R;
      var $172=(($171+16)|0);
      var $173=(($172+4)|0);
      $CP=$173;
      var $174=HEAP32[(($173)>>2)];
      var $175=(($174)|0)!=0;
      if ($175) { var $183 = 1;label = 22; break; } else { label = 21; break; }
    case 21: 
      var $177=$R;
      var $178=(($177+16)|0);
      var $179=(($178)|0);
      $CP=$179;
      var $180=HEAP32[(($179)>>2)];
      var $181=(($180)|0)!=0;
      var $183 = $181;label = 22; break;
    case 22: 
      var $183;
      if ($183) { label = 23; break; } else { label = 24; break; }
    case 23: 
      var $185=$CP;
      $RP=$185;
      var $186=HEAP32[(($185)>>2)];
      $R=$186;
      label = 20; break;
    case 24: 
      var $188=$RP;
      var $189=$188;
      var $190=$1;
      var $191=(($190+16)|0);
      var $192=HEAP32[(($191)>>2)];
      var $193=(($189)>>>0) >= (($192)>>>0);
      var $194=(($193)&1);
      var $195=($194);
      var $196=(($195)|0)!=0;
      if ($196) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $198=$RP;
      HEAP32[(($198)>>2)]=0;
      label = 27; break;
    case 26: 
      _abort();
      throw "Reached an unreachable!"
    case 27: 
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      var $203=$XP;
      var $204=(($203)|0)!=0;
      if ($204) { label = 30; break; } else { label = 57; break; }
    case 30: 
      var $206=$v;
      var $207=(($206+28)|0);
      var $208=HEAP32[(($207)>>2)];
      var $209=$1;
      var $210=(($209+304)|0);
      var $211=(($210+($208<<2))|0);
      $H=$211;
      var $212=$v;
      var $213=$H;
      var $214=HEAP32[(($213)>>2)];
      var $215=(($212)|0)==(($214)|0);
      if ($215) { label = 31; break; } else { label = 34; break; }
    case 31: 
      var $217=$R;
      var $218=$H;
      HEAP32[(($218)>>2)]=$217;
      var $219=(($217)|0)==0;
      if ($219) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $221=$v;
      var $222=(($221+28)|0);
      var $223=HEAP32[(($222)>>2)];
      var $224=1 << $223;
      var $225=$224 ^ -1;
      var $226=$1;
      var $227=(($226+4)|0);
      var $228=HEAP32[(($227)>>2)];
      var $229=$228 & $225;
      HEAP32[(($227)>>2)]=$229;
      label = 33; break;
    case 33: 
      label = 41; break;
    case 34: 
      var $232=$XP;
      var $233=$232;
      var $234=$1;
      var $235=(($234+16)|0);
      var $236=HEAP32[(($235)>>2)];
      var $237=(($233)>>>0) >= (($236)>>>0);
      var $238=(($237)&1);
      var $239=($238);
      var $240=(($239)|0)!=0;
      if ($240) { label = 35; break; } else { label = 39; break; }
    case 35: 
      var $242=$XP;
      var $243=(($242+16)|0);
      var $244=(($243)|0);
      var $245=HEAP32[(($244)>>2)];
      var $246=$v;
      var $247=(($245)|0)==(($246)|0);
      if ($247) { label = 36; break; } else { label = 37; break; }
    case 36: 
      var $249=$R;
      var $250=$XP;
      var $251=(($250+16)|0);
      var $252=(($251)|0);
      HEAP32[(($252)>>2)]=$249;
      label = 38; break;
    case 37: 
      var $254=$R;
      var $255=$XP;
      var $256=(($255+16)|0);
      var $257=(($256+4)|0);
      HEAP32[(($257)>>2)]=$254;
      label = 38; break;
    case 38: 
      label = 40; break;
    case 39: 
      _abort();
      throw "Reached an unreachable!"
    case 40: 
      label = 41; break;
    case 41: 
      var $262=$R;
      var $263=(($262)|0)!=0;
      if ($263) { label = 42; break; } else { label = 56; break; }
    case 42: 
      var $265=$R;
      var $266=$265;
      var $267=$1;
      var $268=(($267+16)|0);
      var $269=HEAP32[(($268)>>2)];
      var $270=(($266)>>>0) >= (($269)>>>0);
      var $271=(($270)&1);
      var $272=($271);
      var $273=(($272)|0)!=0;
      if ($273) { label = 43; break; } else { label = 54; break; }
    case 43: 
      var $275=$XP;
      var $276=$R;
      var $277=(($276+24)|0);
      HEAP32[(($277)>>2)]=$275;
      var $278=$v;
      var $279=(($278+16)|0);
      var $280=(($279)|0);
      var $281=HEAP32[(($280)>>2)];
      $C0=$281;
      var $282=(($281)|0)!=0;
      if ($282) { label = 44; break; } else { label = 48; break; }
    case 44: 
      var $284=$C0;
      var $285=$284;
      var $286=$1;
      var $287=(($286+16)|0);
      var $288=HEAP32[(($287)>>2)];
      var $289=(($285)>>>0) >= (($288)>>>0);
      var $290=(($289)&1);
      var $291=($290);
      var $292=(($291)|0)!=0;
      if ($292) { label = 45; break; } else { label = 46; break; }
    case 45: 
      var $294=$C0;
      var $295=$R;
      var $296=(($295+16)|0);
      var $297=(($296)|0);
      HEAP32[(($297)>>2)]=$294;
      var $298=$R;
      var $299=$C0;
      var $300=(($299+24)|0);
      HEAP32[(($300)>>2)]=$298;
      label = 47; break;
    case 46: 
      _abort();
      throw "Reached an unreachable!"
    case 47: 
      label = 48; break;
    case 48: 
      var $304=$v;
      var $305=(($304+16)|0);
      var $306=(($305+4)|0);
      var $307=HEAP32[(($306)>>2)];
      $C1=$307;
      var $308=(($307)|0)!=0;
      if ($308) { label = 49; break; } else { label = 53; break; }
    case 49: 
      var $310=$C1;
      var $311=$310;
      var $312=$1;
      var $313=(($312+16)|0);
      var $314=HEAP32[(($313)>>2)];
      var $315=(($311)>>>0) >= (($314)>>>0);
      var $316=(($315)&1);
      var $317=($316);
      var $318=(($317)|0)!=0;
      if ($318) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $320=$C1;
      var $321=$R;
      var $322=(($321+16)|0);
      var $323=(($322+4)|0);
      HEAP32[(($323)>>2)]=$320;
      var $324=$R;
      var $325=$C1;
      var $326=(($325+24)|0);
      HEAP32[(($326)>>2)]=$324;
      label = 52; break;
    case 51: 
      _abort();
      throw "Reached an unreachable!"
    case 52: 
      label = 53; break;
    case 53: 
      label = 55; break;
    case 54: 
      _abort();
      throw "Reached an unreachable!"
    case 55: 
      label = 56; break;
    case 56: 
      label = 57; break;
    case 57: 
      var $334=$rsize;
      var $335=(($334)>>>0) < 16;
      if ($335) { label = 58; break; } else { label = 59; break; }
    case 58: 
      var $337=$rsize;
      var $338=$2;
      var $339=((($337)+($338))|0);
      var $340=$339 | 1;
      var $341=$340 | 2;
      var $342=$v;
      var $343=(($342+4)|0);
      HEAP32[(($343)>>2)]=$341;
      var $344=$v;
      var $345=$344;
      var $346=$rsize;
      var $347=$2;
      var $348=((($346)+($347))|0);
      var $349=(($345+$348)|0);
      var $350=$349;
      var $351=(($350+4)|0);
      var $352=HEAP32[(($351)>>2)];
      var $353=$352 | 1;
      HEAP32[(($351)>>2)]=$353;
      label = 68; break;
    case 59: 
      var $355=$2;
      var $356=$355 | 1;
      var $357=$356 | 2;
      var $358=$v;
      var $359=(($358+4)|0);
      HEAP32[(($359)>>2)]=$357;
      var $360=$rsize;
      var $361=$360 | 1;
      var $362=$r;
      var $363=(($362+4)|0);
      HEAP32[(($363)>>2)]=$361;
      var $364=$rsize;
      var $365=$r;
      var $366=$365;
      var $367=$rsize;
      var $368=(($366+$367)|0);
      var $369=$368;
      var $370=(($369)|0);
      HEAP32[(($370)>>2)]=$364;
      var $371=$1;
      var $372=(($371+8)|0);
      var $373=HEAP32[(($372)>>2)];
      $DVS=$373;
      var $374=$DVS;
      var $375=(($374)|0)!=0;
      if ($375) { label = 60; break; } else { label = 67; break; }
    case 60: 
      var $377=$1;
      var $378=(($377+20)|0);
      var $379=HEAP32[(($378)>>2)];
      $DV=$379;
      var $380=$DVS;
      var $381=$380 >>> 3;
      $I=$381;
      var $382=$I;
      var $383=$382 << 1;
      var $384=$1;
      var $385=(($384+40)|0);
      var $386=(($385+($383<<2))|0);
      var $387=$386;
      var $388=$387;
      $B=$388;
      var $389=$B;
      $F1=$389;
      var $390=$1;
      var $391=(($390)|0);
      var $392=HEAP32[(($391)>>2)];
      var $393=$I;
      var $394=1 << $393;
      var $395=$392 & $394;
      var $396=(($395)|0)!=0;
      if ($396) { label = 62; break; } else { label = 61; break; }
    case 61: 
      var $398=$I;
      var $399=1 << $398;
      var $400=$1;
      var $401=(($400)|0);
      var $402=HEAP32[(($401)>>2)];
      var $403=$402 | $399;
      HEAP32[(($401)>>2)]=$403;
      label = 66; break;
    case 62: 
      var $405=$B;
      var $406=(($405+8)|0);
      var $407=HEAP32[(($406)>>2)];
      var $408=$407;
      var $409=$1;
      var $410=(($409+16)|0);
      var $411=HEAP32[(($410)>>2)];
      var $412=(($408)>>>0) >= (($411)>>>0);
      var $413=(($412)&1);
      var $414=($413);
      var $415=(($414)|0)!=0;
      if ($415) { label = 63; break; } else { label = 64; break; }
    case 63: 
      var $417=$B;
      var $418=(($417+8)|0);
      var $419=HEAP32[(($418)>>2)];
      $F1=$419;
      label = 65; break;
    case 64: 
      _abort();
      throw "Reached an unreachable!"
    case 65: 
      label = 66; break;
    case 66: 
      var $423=$DV;
      var $424=$B;
      var $425=(($424+8)|0);
      HEAP32[(($425)>>2)]=$423;
      var $426=$DV;
      var $427=$F1;
      var $428=(($427+12)|0);
      HEAP32[(($428)>>2)]=$426;
      var $429=$F1;
      var $430=$DV;
      var $431=(($430+8)|0);
      HEAP32[(($431)>>2)]=$429;
      var $432=$B;
      var $433=$DV;
      var $434=(($433+12)|0);
      HEAP32[(($434)>>2)]=$432;
      label = 67; break;
    case 67: 
      var $436=$rsize;
      var $437=$1;
      var $438=(($437+8)|0);
      HEAP32[(($438)>>2)]=$436;
      var $439=$r;
      var $440=$1;
      var $441=(($440+20)|0);
      HEAP32[(($441)>>2)]=$439;
      label = 68; break;
    case 68: 
      var $443=$v;
      var $444=$443;
      var $445=(($444+8)|0);

      return $445;
    case 69: 
      label = 70; break;
    case 70: 
      _abort();
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + label);
  }
}
_tmalloc_small["X"]=1;

function _tmalloc_large($m, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $v;
      var $rsize;
      var $t;
      var $idx;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $sizebits;
      var $rst;
      var $rt;
      var $trem;
      var $leftbits;
      var $i;
      var $leastbit;
      var $Y1;
      var $K2;
      var $N3;
      var $trem4;
      var $r;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I;
      var $B;
      var $F5;
      var $TP;
      var $H6;
      var $I7;
      var $X8;
      var $Y9;
      var $N10;
      var $K11;
      var $T;
      var $K12;
      var $C;
      var $F13;
      $2=$m;
      $3=$nb;
      $v=0;
      var $4=$3;
      var $5=(((-$4))|0);
      $rsize=$5;
      var $6=$3;
      var $7=$6 >>> 8;
      $X=$7;
      var $8=$X;
      var $9=(($8)|0)==0;
      if ($9) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $idx=0;
      label = 8; break;
    case 4: 
      var $12=$X;
      var $13=(($12)>>>0) > 65535;
      if ($13) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $idx=31;
      label = 7; break;
    case 6: 
      var $16=$X;
      $Y=$16;
      var $17=$Y;
      var $18=((($17)-(256))|0);
      var $19=$18 >>> 16;
      var $20=$19 & 8;
      $N=$20;
      var $21=$N;
      var $22=$Y;
      var $23=$22 << $21;
      $Y=$23;
      var $24=((($23)-(4096))|0);
      var $25=$24 >>> 16;
      var $26=$25 & 4;
      $K=$26;
      var $27=$K;
      var $28=$N;
      var $29=((($28)+($27))|0);
      $N=$29;
      var $30=$K;
      var $31=$Y;
      var $32=$31 << $30;
      $Y=$32;
      var $33=((($32)-(16384))|0);
      var $34=$33 >>> 16;
      var $35=$34 & 2;
      $K=$35;
      var $36=$N;
      var $37=((($36)+($35))|0);
      $N=$37;
      var $38=$N;
      var $39=(((14)-($38))|0);
      var $40=$K;
      var $41=$Y;
      var $42=$41 << $40;
      $Y=$42;
      var $43=$42 >>> 15;
      var $44=((($39)+($43))|0);
      $K=$44;
      var $45=$K;
      var $46=$45 << 1;
      var $47=$3;
      var $48=$K;
      var $49=((($48)+(7))|0);
      var $50=$47 >>> (($49)>>>0);
      var $51=$50 & 1;
      var $52=((($46)+($51))|0);
      $idx=$52;
      label = 7; break;
    case 7: 
      label = 8; break;
    case 8: 
      var $55=$idx;
      var $56=$2;
      var $57=(($56+304)|0);
      var $58=(($57+($55<<2))|0);
      var $59=HEAP32[(($58)>>2)];
      $t=$59;
      var $60=(($59)|0)!=0;
      if ($60) { label = 9; break; } else { label = 24; break; }
    case 9: 
      var $62=$3;
      var $63=$idx;
      var $64=(($63)|0)==31;
      if ($64) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $73 = 0;label = 12; break;
    case 11: 
      var $67=$idx;
      var $68=$67 >>> 1;
      var $69=((($68)+(8))|0);
      var $70=((($69)-(2))|0);
      var $71=(((31)-($70))|0);
      var $73 = $71;label = 12; break;
    case 12: 
      var $73;
      var $74=$62 << $73;
      $sizebits=$74;
      $rst=0;
      label = 13; break;
    case 13: 
      var $76=$t;
      var $77=(($76+4)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=$78 & -8;
      var $80=$3;
      var $81=((($79)-($80))|0);
      $trem=$81;
      var $82=$trem;
      var $83=$rsize;
      var $84=(($82)>>>0) < (($83)>>>0);
      if ($84) { label = 14; break; } else { label = 17; break; }
    case 14: 
      var $86=$t;
      $v=$86;
      var $87=$trem;
      $rsize=$87;
      var $88=(($87)|0)==0;
      if ($88) { label = 15; break; } else { label = 16; break; }
    case 15: 
      label = 23; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $92=$t;
      var $93=(($92+16)|0);
      var $94=(($93+4)|0);
      var $95=HEAP32[(($94)>>2)];
      $rt=$95;
      var $96=$sizebits;
      var $97=$96 >>> 31;
      var $98=$97 & 1;
      var $99=$t;
      var $100=(($99+16)|0);
      var $101=(($100+($98<<2))|0);
      var $102=HEAP32[(($101)>>2)];
      $t=$102;
      var $103=$rt;
      var $104=(($103)|0)!=0;
      if ($104) { label = 18; break; } else { label = 20; break; }
    case 18: 
      var $106=$rt;
      var $107=$t;
      var $108=(($106)|0)!=(($107)|0);
      if ($108) { label = 19; break; } else { label = 20; break; }
    case 19: 
      var $110=$rt;
      $rst=$110;
      label = 20; break;
    case 20: 
      var $112=$t;
      var $113=(($112)|0)==0;
      if ($113) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $115=$rst;
      $t=$115;
      label = 23; break;
    case 22: 
      var $117=$sizebits;
      var $118=$117 << 1;
      $sizebits=$118;
      label = 13; break;
    case 23: 
      label = 24; break;
    case 24: 
      var $121=$t;
      var $122=(($121)|0)==0;
      if ($122) { label = 25; break; } else { label = 29; break; }
    case 25: 
      var $124=$v;
      var $125=(($124)|0)==0;
      if ($125) { label = 26; break; } else { label = 29; break; }
    case 26: 
      var $127=$idx;
      var $128=1 << $127;
      var $129=$128 << 1;
      var $130=$idx;
      var $131=1 << $130;
      var $132=$131 << 1;
      var $133=(((-$132))|0);
      var $134=$129 | $133;
      var $135=$2;
      var $136=(($135+4)|0);
      var $137=HEAP32[(($136)>>2)];
      var $138=$134 & $137;
      $leftbits=$138;
      var $139=$leftbits;
      var $140=(($139)|0)!=0;
      if ($140) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $142=$leftbits;
      var $143=$leftbits;
      var $144=(((-$143))|0);
      var $145=$142 & $144;
      $leastbit=$145;
      var $146=$leastbit;
      var $147=((($146)-(1))|0);
      $Y1=$147;
      var $148=$Y1;
      var $149=$148 >>> 12;
      var $150=$149 & 16;
      $K2=$150;
      var $151=$K2;
      $N3=$151;
      var $152=$K2;
      var $153=$Y1;
      var $154=$153 >>> (($152)>>>0);
      $Y1=$154;
      var $155=$Y1;
      var $156=$155 >>> 5;
      var $157=$156 & 8;
      $K2=$157;
      var $158=$N3;
      var $159=((($158)+($157))|0);
      $N3=$159;
      var $160=$K2;
      var $161=$Y1;
      var $162=$161 >>> (($160)>>>0);
      $Y1=$162;
      var $163=$Y1;
      var $164=$163 >>> 2;
      var $165=$164 & 4;
      $K2=$165;
      var $166=$N3;
      var $167=((($166)+($165))|0);
      $N3=$167;
      var $168=$K2;
      var $169=$Y1;
      var $170=$169 >>> (($168)>>>0);
      $Y1=$170;
      var $171=$Y1;
      var $172=$171 >>> 1;
      var $173=$172 & 2;
      $K2=$173;
      var $174=$N3;
      var $175=((($174)+($173))|0);
      $N3=$175;
      var $176=$K2;
      var $177=$Y1;
      var $178=$177 >>> (($176)>>>0);
      $Y1=$178;
      var $179=$Y1;
      var $180=$179 >>> 1;
      var $181=$180 & 1;
      $K2=$181;
      var $182=$N3;
      var $183=((($182)+($181))|0);
      $N3=$183;
      var $184=$K2;
      var $185=$Y1;
      var $186=$185 >>> (($184)>>>0);
      $Y1=$186;
      var $187=$N3;
      var $188=$Y1;
      var $189=((($187)+($188))|0);
      $i=$189;
      var $190=$i;
      var $191=$2;
      var $192=(($191+304)|0);
      var $193=(($192+($190<<2))|0);
      var $194=HEAP32[(($193)>>2)];
      $t=$194;
      label = 28; break;
    case 28: 
      label = 29; break;
    case 29: 
      label = 30; break;
    case 30: 
      var $198=$t;
      var $199=(($198)|0)!=0;
      if ($199) { label = 31; break; } else { label = 37; break; }
    case 31: 
      var $201=$t;
      var $202=(($201+4)|0);
      var $203=HEAP32[(($202)>>2)];
      var $204=$203 & -8;
      var $205=$3;
      var $206=((($204)-($205))|0);
      $trem4=$206;
      var $207=$trem4;
      var $208=$rsize;
      var $209=(($207)>>>0) < (($208)>>>0);
      if ($209) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $211=$trem4;
      $rsize=$211;
      var $212=$t;
      $v=$212;
      label = 33; break;
    case 33: 
      var $214=$t;
      var $215=(($214+16)|0);
      var $216=(($215)|0);
      var $217=HEAP32[(($216)>>2)];
      var $218=(($217)|0)!=0;
      if ($218) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $220=$t;
      var $221=(($220+16)|0);
      var $222=(($221)|0);
      var $223=HEAP32[(($222)>>2)];
      var $230 = $223;label = 36; break;
    case 35: 
      var $225=$t;
      var $226=(($225+16)|0);
      var $227=(($226+4)|0);
      var $228=HEAP32[(($227)>>2)];
      var $230 = $228;label = 36; break;
    case 36: 
      var $230;
      $t=$230;
      label = 30; break;
    case 37: 
      var $232=$v;
      var $233=(($232)|0)!=0;
      if ($233) { label = 38; break; } else { label = 127; break; }
    case 38: 
      var $235=$rsize;
      var $236=$2;
      var $237=(($236+8)|0);
      var $238=HEAP32[(($237)>>2)];
      var $239=$3;
      var $240=((($238)-($239))|0);
      var $241=(($235)>>>0) < (($240)>>>0);
      if ($241) { label = 39; break; } else { label = 127; break; }
    case 39: 
      var $243=$v;
      var $244=$243;
      var $245=$2;
      var $246=(($245+16)|0);
      var $247=HEAP32[(($246)>>2)];
      var $248=(($244)>>>0) >= (($247)>>>0);
      var $249=(($248)&1);
      var $250=($249);
      var $251=(($250)|0)!=0;
      if ($251) { label = 40; break; } else { label = 126; break; }
    case 40: 
      var $253=$v;
      var $254=$253;
      var $255=$3;
      var $256=(($254+$255)|0);
      var $257=$256;
      $r=$257;
      var $258=$v;
      var $259=$258;
      var $260=$r;
      var $261=$260;
      var $262=(($259)>>>0) < (($261)>>>0);
      var $263=(($262)&1);
      var $264=($263);
      var $265=(($264)|0)!=0;
      if ($265) { label = 41; break; } else { label = 125; break; }
    case 41: 
      var $267=$v;
      var $268=(($267+24)|0);
      var $269=HEAP32[(($268)>>2)];
      $XP=$269;
      var $270=$v;
      var $271=(($270+12)|0);
      var $272=HEAP32[(($271)>>2)];
      var $273=$v;
      var $274=(($272)|0)!=(($273)|0);
      if ($274) { label = 42; break; } else { label = 46; break; }
    case 42: 
      var $276=$v;
      var $277=(($276+8)|0);
      var $278=HEAP32[(($277)>>2)];
      $F=$278;
      var $279=$v;
      var $280=(($279+12)|0);
      var $281=HEAP32[(($280)>>2)];
      $R=$281;
      var $282=$F;
      var $283=$282;
      var $284=$2;
      var $285=(($284+16)|0);
      var $286=HEAP32[(($285)>>2)];
      var $287=(($283)>>>0) >= (($286)>>>0);
      var $288=(($287)&1);
      var $289=($288);
      var $290=(($289)|0)!=0;
      if ($290) { label = 43; break; } else { label = 44; break; }
    case 43: 
      var $292=$R;
      var $293=$F;
      var $294=(($293+12)|0);
      HEAP32[(($294)>>2)]=$292;
      var $295=$F;
      var $296=$R;
      var $297=(($296+8)|0);
      HEAP32[(($297)>>2)]=$295;
      label = 45; break;
    case 44: 
      _abort();
      throw "Reached an unreachable!"
    case 45: 
      label = 58; break;
    case 46: 
      var $301=$v;
      var $302=(($301+16)|0);
      var $303=(($302+4)|0);
      $RP=$303;
      var $304=HEAP32[(($303)>>2)];
      $R=$304;
      var $305=(($304)|0)!=0;
      if ($305) { label = 48; break; } else { label = 47; break; }
    case 47: 
      var $307=$v;
      var $308=(($307+16)|0);
      var $309=(($308)|0);
      $RP=$309;
      var $310=HEAP32[(($309)>>2)];
      $R=$310;
      var $311=(($310)|0)!=0;
      if ($311) { label = 48; break; } else { label = 57; break; }
    case 48: 
      label = 49; break;
    case 49: 
      var $314=$R;
      var $315=(($314+16)|0);
      var $316=(($315+4)|0);
      $CP=$316;
      var $317=HEAP32[(($316)>>2)];
      var $318=(($317)|0)!=0;
      if ($318) { var $326 = 1;label = 51; break; } else { label = 50; break; }
    case 50: 
      var $320=$R;
      var $321=(($320+16)|0);
      var $322=(($321)|0);
      $CP=$322;
      var $323=HEAP32[(($322)>>2)];
      var $324=(($323)|0)!=0;
      var $326 = $324;label = 51; break;
    case 51: 
      var $326;
      if ($326) { label = 52; break; } else { label = 53; break; }
    case 52: 
      var $328=$CP;
      $RP=$328;
      var $329=HEAP32[(($328)>>2)];
      $R=$329;
      label = 49; break;
    case 53: 
      var $331=$RP;
      var $332=$331;
      var $333=$2;
      var $334=(($333+16)|0);
      var $335=HEAP32[(($334)>>2)];
      var $336=(($332)>>>0) >= (($335)>>>0);
      var $337=(($336)&1);
      var $338=($337);
      var $339=(($338)|0)!=0;
      if ($339) { label = 54; break; } else { label = 55; break; }
    case 54: 
      var $341=$RP;
      HEAP32[(($341)>>2)]=0;
      label = 56; break;
    case 55: 
      _abort();
      throw "Reached an unreachable!"
    case 56: 
      label = 57; break;
    case 57: 
      label = 58; break;
    case 58: 
      var $346=$XP;
      var $347=(($346)|0)!=0;
      if ($347) { label = 59; break; } else { label = 86; break; }
    case 59: 
      var $349=$v;
      var $350=(($349+28)|0);
      var $351=HEAP32[(($350)>>2)];
      var $352=$2;
      var $353=(($352+304)|0);
      var $354=(($353+($351<<2))|0);
      $H=$354;
      var $355=$v;
      var $356=$H;
      var $357=HEAP32[(($356)>>2)];
      var $358=(($355)|0)==(($357)|0);
      if ($358) { label = 60; break; } else { label = 63; break; }
    case 60: 
      var $360=$R;
      var $361=$H;
      HEAP32[(($361)>>2)]=$360;
      var $362=(($360)|0)==0;
      if ($362) { label = 61; break; } else { label = 62; break; }
    case 61: 
      var $364=$v;
      var $365=(($364+28)|0);
      var $366=HEAP32[(($365)>>2)];
      var $367=1 << $366;
      var $368=$367 ^ -1;
      var $369=$2;
      var $370=(($369+4)|0);
      var $371=HEAP32[(($370)>>2)];
      var $372=$371 & $368;
      HEAP32[(($370)>>2)]=$372;
      label = 62; break;
    case 62: 
      label = 70; break;
    case 63: 
      var $375=$XP;
      var $376=$375;
      var $377=$2;
      var $378=(($377+16)|0);
      var $379=HEAP32[(($378)>>2)];
      var $380=(($376)>>>0) >= (($379)>>>0);
      var $381=(($380)&1);
      var $382=($381);
      var $383=(($382)|0)!=0;
      if ($383) { label = 64; break; } else { label = 68; break; }
    case 64: 
      var $385=$XP;
      var $386=(($385+16)|0);
      var $387=(($386)|0);
      var $388=HEAP32[(($387)>>2)];
      var $389=$v;
      var $390=(($388)|0)==(($389)|0);
      if ($390) { label = 65; break; } else { label = 66; break; }
    case 65: 
      var $392=$R;
      var $393=$XP;
      var $394=(($393+16)|0);
      var $395=(($394)|0);
      HEAP32[(($395)>>2)]=$392;
      label = 67; break;
    case 66: 
      var $397=$R;
      var $398=$XP;
      var $399=(($398+16)|0);
      var $400=(($399+4)|0);
      HEAP32[(($400)>>2)]=$397;
      label = 67; break;
    case 67: 
      label = 69; break;
    case 68: 
      _abort();
      throw "Reached an unreachable!"
    case 69: 
      label = 70; break;
    case 70: 
      var $405=$R;
      var $406=(($405)|0)!=0;
      if ($406) { label = 71; break; } else { label = 85; break; }
    case 71: 
      var $408=$R;
      var $409=$408;
      var $410=$2;
      var $411=(($410+16)|0);
      var $412=HEAP32[(($411)>>2)];
      var $413=(($409)>>>0) >= (($412)>>>0);
      var $414=(($413)&1);
      var $415=($414);
      var $416=(($415)|0)!=0;
      if ($416) { label = 72; break; } else { label = 83; break; }
    case 72: 
      var $418=$XP;
      var $419=$R;
      var $420=(($419+24)|0);
      HEAP32[(($420)>>2)]=$418;
      var $421=$v;
      var $422=(($421+16)|0);
      var $423=(($422)|0);
      var $424=HEAP32[(($423)>>2)];
      $C0=$424;
      var $425=(($424)|0)!=0;
      if ($425) { label = 73; break; } else { label = 77; break; }
    case 73: 
      var $427=$C0;
      var $428=$427;
      var $429=$2;
      var $430=(($429+16)|0);
      var $431=HEAP32[(($430)>>2)];
      var $432=(($428)>>>0) >= (($431)>>>0);
      var $433=(($432)&1);
      var $434=($433);
      var $435=(($434)|0)!=0;
      if ($435) { label = 74; break; } else { label = 75; break; }
    case 74: 
      var $437=$C0;
      var $438=$R;
      var $439=(($438+16)|0);
      var $440=(($439)|0);
      HEAP32[(($440)>>2)]=$437;
      var $441=$R;
      var $442=$C0;
      var $443=(($442+24)|0);
      HEAP32[(($443)>>2)]=$441;
      label = 76; break;
    case 75: 
      _abort();
      throw "Reached an unreachable!"
    case 76: 
      label = 77; break;
    case 77: 
      var $447=$v;
      var $448=(($447+16)|0);
      var $449=(($448+4)|0);
      var $450=HEAP32[(($449)>>2)];
      $C1=$450;
      var $451=(($450)|0)!=0;
      if ($451) { label = 78; break; } else { label = 82; break; }
    case 78: 
      var $453=$C1;
      var $454=$453;
      var $455=$2;
      var $456=(($455+16)|0);
      var $457=HEAP32[(($456)>>2)];
      var $458=(($454)>>>0) >= (($457)>>>0);
      var $459=(($458)&1);
      var $460=($459);
      var $461=(($460)|0)!=0;
      if ($461) { label = 79; break; } else { label = 80; break; }
    case 79: 
      var $463=$C1;
      var $464=$R;
      var $465=(($464+16)|0);
      var $466=(($465+4)|0);
      HEAP32[(($466)>>2)]=$463;
      var $467=$R;
      var $468=$C1;
      var $469=(($468+24)|0);
      HEAP32[(($469)>>2)]=$467;
      label = 81; break;
    case 80: 
      _abort();
      throw "Reached an unreachable!"
    case 81: 
      label = 82; break;
    case 82: 
      label = 84; break;
    case 83: 
      _abort();
      throw "Reached an unreachable!"
    case 84: 
      label = 85; break;
    case 85: 
      label = 86; break;
    case 86: 
      var $477=$rsize;
      var $478=(($477)>>>0) < 16;
      if ($478) { label = 87; break; } else { label = 88; break; }
    case 87: 
      var $480=$rsize;
      var $481=$3;
      var $482=((($480)+($481))|0);
      var $483=$482 | 1;
      var $484=$483 | 2;
      var $485=$v;
      var $486=(($485+4)|0);
      HEAP32[(($486)>>2)]=$484;
      var $487=$v;
      var $488=$487;
      var $489=$rsize;
      var $490=$3;
      var $491=((($489)+($490))|0);
      var $492=(($488+$491)|0);
      var $493=$492;
      var $494=(($493+4)|0);
      var $495=HEAP32[(($494)>>2)];
      var $496=$495 | 1;
      HEAP32[(($494)>>2)]=$496;
      label = 124; break;
    case 88: 
      var $498=$3;
      var $499=$498 | 1;
      var $500=$499 | 2;
      var $501=$v;
      var $502=(($501+4)|0);
      HEAP32[(($502)>>2)]=$500;
      var $503=$rsize;
      var $504=$503 | 1;
      var $505=$r;
      var $506=(($505+4)|0);
      HEAP32[(($506)>>2)]=$504;
      var $507=$rsize;
      var $508=$r;
      var $509=$508;
      var $510=$rsize;
      var $511=(($509+$510)|0);
      var $512=$511;
      var $513=(($512)|0);
      HEAP32[(($513)>>2)]=$507;
      var $514=$rsize;
      var $515=$514 >>> 3;
      var $516=(($515)>>>0) < 32;
      if ($516) { label = 89; break; } else { label = 96; break; }
    case 89: 
      var $518=$rsize;
      var $519=$518 >>> 3;
      $I=$519;
      var $520=$I;
      var $521=$520 << 1;
      var $522=$2;
      var $523=(($522+40)|0);
      var $524=(($523+($521<<2))|0);
      var $525=$524;
      var $526=$525;
      $B=$526;
      var $527=$B;
      $F5=$527;
      var $528=$2;
      var $529=(($528)|0);
      var $530=HEAP32[(($529)>>2)];
      var $531=$I;
      var $532=1 << $531;
      var $533=$530 & $532;
      var $534=(($533)|0)!=0;
      if ($534) { label = 91; break; } else { label = 90; break; }
    case 90: 
      var $536=$I;
      var $537=1 << $536;
      var $538=$2;
      var $539=(($538)|0);
      var $540=HEAP32[(($539)>>2)];
      var $541=$540 | $537;
      HEAP32[(($539)>>2)]=$541;
      label = 95; break;
    case 91: 
      var $543=$B;
      var $544=(($543+8)|0);
      var $545=HEAP32[(($544)>>2)];
      var $546=$545;
      var $547=$2;
      var $548=(($547+16)|0);
      var $549=HEAP32[(($548)>>2)];
      var $550=(($546)>>>0) >= (($549)>>>0);
      var $551=(($550)&1);
      var $552=($551);
      var $553=(($552)|0)!=0;
      if ($553) { label = 92; break; } else { label = 93; break; }
    case 92: 
      var $555=$B;
      var $556=(($555+8)|0);
      var $557=HEAP32[(($556)>>2)];
      $F5=$557;
      label = 94; break;
    case 93: 
      _abort();
      throw "Reached an unreachable!"
    case 94: 
      label = 95; break;
    case 95: 
      var $561=$r;
      var $562=$B;
      var $563=(($562+8)|0);
      HEAP32[(($563)>>2)]=$561;
      var $564=$r;
      var $565=$F5;
      var $566=(($565+12)|0);
      HEAP32[(($566)>>2)]=$564;
      var $567=$F5;
      var $568=$r;
      var $569=(($568+8)|0);
      HEAP32[(($569)>>2)]=$567;
      var $570=$B;
      var $571=$r;
      var $572=(($571+12)|0);
      HEAP32[(($572)>>2)]=$570;
      label = 123; break;
    case 96: 
      var $574=$r;
      var $575=$574;
      $TP=$575;
      var $576=$rsize;
      var $577=$576 >>> 8;
      $X8=$577;
      var $578=$X8;
      var $579=(($578)|0)==0;
      if ($579) { label = 97; break; } else { label = 98; break; }
    case 97: 
      $I7=0;
      label = 102; break;
    case 98: 
      var $582=$X8;
      var $583=(($582)>>>0) > 65535;
      if ($583) { label = 99; break; } else { label = 100; break; }
    case 99: 
      $I7=31;
      label = 101; break;
    case 100: 
      var $586=$X8;
      $Y9=$586;
      var $587=$Y9;
      var $588=((($587)-(256))|0);
      var $589=$588 >>> 16;
      var $590=$589 & 8;
      $N10=$590;
      var $591=$N10;
      var $592=$Y9;
      var $593=$592 << $591;
      $Y9=$593;
      var $594=((($593)-(4096))|0);
      var $595=$594 >>> 16;
      var $596=$595 & 4;
      $K11=$596;
      var $597=$K11;
      var $598=$N10;
      var $599=((($598)+($597))|0);
      $N10=$599;
      var $600=$K11;
      var $601=$Y9;
      var $602=$601 << $600;
      $Y9=$602;
      var $603=((($602)-(16384))|0);
      var $604=$603 >>> 16;
      var $605=$604 & 2;
      $K11=$605;
      var $606=$N10;
      var $607=((($606)+($605))|0);
      $N10=$607;
      var $608=$N10;
      var $609=(((14)-($608))|0);
      var $610=$K11;
      var $611=$Y9;
      var $612=$611 << $610;
      $Y9=$612;
      var $613=$612 >>> 15;
      var $614=((($609)+($613))|0);
      $K11=$614;
      var $615=$K11;
      var $616=$615 << 1;
      var $617=$rsize;
      var $618=$K11;
      var $619=((($618)+(7))|0);
      var $620=$617 >>> (($619)>>>0);
      var $621=$620 & 1;
      var $622=((($616)+($621))|0);
      $I7=$622;
      label = 101; break;
    case 101: 
      label = 102; break;
    case 102: 
      var $625=$I7;
      var $626=$2;
      var $627=(($626+304)|0);
      var $628=(($627+($625<<2))|0);
      $H6=$628;
      var $629=$I7;
      var $630=$TP;
      var $631=(($630+28)|0);
      HEAP32[(($631)>>2)]=$629;
      var $632=$TP;
      var $633=(($632+16)|0);
      var $634=(($633+4)|0);
      HEAP32[(($634)>>2)]=0;
      var $635=$TP;
      var $636=(($635+16)|0);
      var $637=(($636)|0);
      HEAP32[(($637)>>2)]=0;
      var $638=$2;
      var $639=(($638+4)|0);
      var $640=HEAP32[(($639)>>2)];
      var $641=$I7;
      var $642=1 << $641;
      var $643=$640 & $642;
      var $644=(($643)|0)!=0;
      if ($644) { label = 104; break; } else { label = 103; break; }
    case 103: 
      var $646=$I7;
      var $647=1 << $646;
      var $648=$2;
      var $649=(($648+4)|0);
      var $650=HEAP32[(($649)>>2)];
      var $651=$650 | $647;
      HEAP32[(($649)>>2)]=$651;
      var $652=$TP;
      var $653=$H6;
      HEAP32[(($653)>>2)]=$652;
      var $654=$H6;
      var $655=$654;
      var $656=$TP;
      var $657=(($656+24)|0);
      HEAP32[(($657)>>2)]=$655;
      var $658=$TP;
      var $659=$TP;
      var $660=(($659+12)|0);
      HEAP32[(($660)>>2)]=$658;
      var $661=$TP;
      var $662=(($661+8)|0);
      HEAP32[(($662)>>2)]=$658;
      label = 122; break;
    case 104: 
      var $664=$H6;
      var $665=HEAP32[(($664)>>2)];
      $T=$665;
      var $666=$rsize;
      var $667=$I7;
      var $668=(($667)|0)==31;
      if ($668) { label = 105; break; } else { label = 106; break; }
    case 105: 
      var $677 = 0;label = 107; break;
    case 106: 
      var $671=$I7;
      var $672=$671 >>> 1;
      var $673=((($672)+(8))|0);
      var $674=((($673)-(2))|0);
      var $675=(((31)-($674))|0);
      var $677 = $675;label = 107; break;
    case 107: 
      var $677;
      var $678=$666 << $677;
      $K12=$678;
      label = 108; break;
    case 108: 
      var $680=$T;
      var $681=(($680+4)|0);
      var $682=HEAP32[(($681)>>2)];
      var $683=$682 & -8;
      var $684=$rsize;
      var $685=(($683)|0)!=(($684)|0);
      if ($685) { label = 109; break; } else { label = 115; break; }
    case 109: 
      var $687=$K12;
      var $688=$687 >>> 31;
      var $689=$688 & 1;
      var $690=$T;
      var $691=(($690+16)|0);
      var $692=(($691+($689<<2))|0);
      $C=$692;
      var $693=$K12;
      var $694=$693 << 1;
      $K12=$694;
      var $695=$C;
      var $696=HEAP32[(($695)>>2)];
      var $697=(($696)|0)!=0;
      if ($697) { label = 110; break; } else { label = 111; break; }
    case 110: 
      var $699=$C;
      var $700=HEAP32[(($699)>>2)];
      $T=$700;
      label = 114; break;
    case 111: 
      var $702=$C;
      var $703=$702;
      var $704=$2;
      var $705=(($704+16)|0);
      var $706=HEAP32[(($705)>>2)];
      var $707=(($703)>>>0) >= (($706)>>>0);
      var $708=(($707)&1);
      var $709=($708);
      var $710=(($709)|0)!=0;
      if ($710) { label = 112; break; } else { label = 113; break; }
    case 112: 
      var $712=$TP;
      var $713=$C;
      HEAP32[(($713)>>2)]=$712;
      var $714=$T;
      var $715=$TP;
      var $716=(($715+24)|0);
      HEAP32[(($716)>>2)]=$714;
      var $717=$TP;
      var $718=$TP;
      var $719=(($718+12)|0);
      HEAP32[(($719)>>2)]=$717;
      var $720=$TP;
      var $721=(($720+8)|0);
      HEAP32[(($721)>>2)]=$717;
      label = 121; break;
    case 113: 
      _abort();
      throw "Reached an unreachable!"
    case 114: 
      label = 120; break;
    case 115: 
      var $725=$T;
      var $726=(($725+8)|0);
      var $727=HEAP32[(($726)>>2)];
      $F13=$727;
      var $728=$T;
      var $729=$728;
      var $730=$2;
      var $731=(($730+16)|0);
      var $732=HEAP32[(($731)>>2)];
      var $733=(($729)>>>0) >= (($732)>>>0);
      if ($733) { label = 116; break; } else { var $742 = 0;label = 117; break; }
    case 116: 
      var $735=$F13;
      var $736=$735;
      var $737=$2;
      var $738=(($737+16)|0);
      var $739=HEAP32[(($738)>>2)];
      var $740=(($736)>>>0) >= (($739)>>>0);
      var $742 = $740;label = 117; break;
    case 117: 
      var $742;
      var $743=(($742)&1);
      var $744=($743);
      var $745=(($744)|0)!=0;
      if ($745) { label = 118; break; } else { label = 119; break; }
    case 118: 
      var $747=$TP;
      var $748=$F13;
      var $749=(($748+12)|0);
      HEAP32[(($749)>>2)]=$747;
      var $750=$T;
      var $751=(($750+8)|0);
      HEAP32[(($751)>>2)]=$747;
      var $752=$F13;
      var $753=$TP;
      var $754=(($753+8)|0);
      HEAP32[(($754)>>2)]=$752;
      var $755=$T;
      var $756=$TP;
      var $757=(($756+12)|0);
      HEAP32[(($757)>>2)]=$755;
      var $758=$TP;
      var $759=(($758+24)|0);
      HEAP32[(($759)>>2)]=0;
      label = 121; break;
    case 119: 
      _abort();
      throw "Reached an unreachable!"
    case 120: 
      label = 108; break;
    case 121: 
      label = 122; break;
    case 122: 
      label = 123; break;
    case 123: 
      label = 124; break;
    case 124: 
      var $766=$v;
      var $767=$766;
      var $768=(($767+8)|0);
      $1=$768;
      label = 128; break;
    case 125: 
      label = 126; break;
    case 126: 
      _abort();
      throw "Reached an unreachable!"
    case 127: 
      $1=0;
      label = 128; break;
    case 128: 
      var $773=$1;

      return $773;
    default: assert(0, "bad label: " + label);
  }
}
_tmalloc_large["X"]=1;

function _sys_alloc($m, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $tbase;
      var $tsize;
      var $mmap_flag;
      var $mem;
      var $br;
      var $ss;
      var $asize;
      var $base;
      var $esize;
      var $end;
      var $asize1;
      var $br2;
      var $end3;
      var $ssize;
      var $mn;
      var $sp;
      var $oldbase;
      var $rsize;
      var $p;
      var $r;
      $2=$m;
      $3=$nb;
      $tbase=-1;
      $tsize=0;
      $mmap_flag=0;
      var $4=HEAP32[((((5242924)|0))>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { var $10 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $7=_init_mparams();
      var $8=(($7)|0)!=0;
      var $10 = $8;label = 4; break;
    case 4: 
      var $10;
      var $11=(($10)&1);
      var $12=$2;
      var $13=(($12+440)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$14 & 0;
      var $16=(($15)|0)!=0;
      if ($16) { label = 5; break; } else { label = 10; break; }
    case 5: 
      var $18=$3;
      var $19=HEAP32[((((5242936)|0))>>2)];
      var $20=(($18)>>>0) >= (($19)>>>0);
      if ($20) { label = 6; break; } else { label = 10; break; }
    case 6: 
      var $22=$2;
      var $23=(($22+12)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=(($24)|0)!=0;
      if ($25) { label = 7; break; } else { label = 10; break; }
    case 7: 
      var $27=$2;
      var $28=$3;
      var $29=_mmap_alloc($27, $28);
      $mem=$29;
      var $30=$mem;
      var $31=(($30)|0)!=0;
      if ($31) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $33=$mem;
      $1=$33;
      label = 93; break;
    case 9: 
      label = 10; break;
    case 10: 
      var $36=$2;
      var $37=(($36+440)|0);
      var $38=HEAP32[(($37)>>2)];
      var $39=$38 & 4;
      var $40=(($39)|0)!=0;
      if ($40) { label = 43; break; } else { label = 11; break; }
    case 11: 
      $br=-1;
      var $42=$2;
      var $43=(($42+24)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=(($44)|0)==0;
      if ($45) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $55 = 0;label = 14; break;
    case 13: 
      var $48=$2;
      var $49=$2;
      var $50=(($49+24)|0);
      var $51=HEAP32[(($50)>>2)];
      var $52=$51;
      var $53=_segment_holding($48, $52);
      var $55 = $53;label = 14; break;
    case 14: 
      var $55;
      $ss=$55;
      $asize=0;
      var $56=$ss;
      var $57=(($56)|0)==0;
      if ($57) { label = 15; break; } else { label = 23; break; }
    case 15: 
      var $59=_sbrk(0);
      $base=$59;
      var $60=$base;
      var $61=(($60)|0)!=-1;
      if ($61) { label = 16; break; } else { label = 22; break; }
    case 16: 
      var $63=$3;
      var $64=((($63)+(48))|0);
      var $65=HEAP32[((((5242932)|0))>>2)];
      var $66=((($65)-(1))|0);
      var $67=((($64)+($66))|0);
      var $68=HEAP32[((((5242932)|0))>>2)];
      var $69=((($68)-(1))|0);
      var $70=$69 ^ -1;
      var $71=$67 & $70;
      $asize=$71;
      var $72=$base;
      var $73=$72;
      var $74=HEAP32[((((5242928)|0))>>2)];
      var $75=((($74)-(1))|0);
      var $76=$73 & $75;
      var $77=(($76)|0)==0;
      if ($77) { label = 18; break; } else { label = 17; break; }
    case 17: 
      var $79=$base;
      var $80=$79;
      var $81=HEAP32[((((5242928)|0))>>2)];
      var $82=((($81)-(1))|0);
      var $83=((($80)+($82))|0);
      var $84=HEAP32[((((5242928)|0))>>2)];
      var $85=((($84)-(1))|0);
      var $86=$85 ^ -1;
      var $87=$83 & $86;
      var $88=$base;
      var $89=$88;
      var $90=((($87)-($89))|0);
      var $91=$asize;
      var $92=((($91)+($90))|0);
      $asize=$92;
      label = 18; break;
    case 18: 
      var $94=$asize;
      var $95=(($94)>>>0) < 2147483647;
      if ($95) { label = 19; break; } else { label = 21; break; }
    case 19: 
      var $97=$asize;
      var $98=_sbrk($97);
      $br=$98;
      var $99=$base;
      var $100=(($98)|0)==(($99)|0);
      if ($100) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $102=$base;
      $tbase=$102;
      var $103=$asize;
      $tsize=$103;
      label = 21; break;
    case 21: 
      label = 22; break;
    case 22: 
      label = 27; break;
    case 23: 
      var $107=$3;
      var $108=$2;
      var $109=(($108+12)|0);
      var $110=HEAP32[(($109)>>2)];
      var $111=((($107)-($110))|0);
      var $112=((($111)+(48))|0);
      var $113=HEAP32[((((5242932)|0))>>2)];
      var $114=((($113)-(1))|0);
      var $115=((($112)+($114))|0);
      var $116=HEAP32[((((5242932)|0))>>2)];
      var $117=((($116)-(1))|0);
      var $118=$117 ^ -1;
      var $119=$115 & $118;
      $asize=$119;
      var $120=$asize;
      var $121=(($120)>>>0) < 2147483647;
      if ($121) { label = 24; break; } else { label = 26; break; }
    case 24: 
      var $123=$asize;
      var $124=_sbrk($123);
      $br=$124;
      var $125=$ss;
      var $126=(($125)|0);
      var $127=HEAP32[(($126)>>2)];
      var $128=$ss;
      var $129=(($128+4)|0);
      var $130=HEAP32[(($129)>>2)];
      var $131=(($127+$130)|0);
      var $132=(($124)|0)==(($131)|0);
      if ($132) { label = 25; break; } else { label = 26; break; }
    case 25: 
      var $134=$br;
      $tbase=$134;
      var $135=$asize;
      $tsize=$135;
      label = 26; break;
    case 26: 
      label = 27; break;
    case 27: 
      var $138=$tbase;
      var $139=(($138)|0)==-1;
      if ($139) { label = 28; break; } else { label = 42; break; }
    case 28: 
      var $141=$br;
      var $142=(($141)|0)!=-1;
      if ($142) { label = 29; break; } else { label = 38; break; }
    case 29: 
      var $144=$asize;
      var $145=(($144)>>>0) < 2147483647;
      if ($145) { label = 30; break; } else { label = 37; break; }
    case 30: 
      var $147=$asize;
      var $148=$3;
      var $149=((($148)+(48))|0);
      var $150=(($147)>>>0) < (($149)>>>0);
      if ($150) { label = 31; break; } else { label = 37; break; }
    case 31: 
      var $152=$3;
      var $153=((($152)+(48))|0);
      var $154=$asize;
      var $155=((($153)-($154))|0);
      var $156=HEAP32[((((5242932)|0))>>2)];
      var $157=((($156)-(1))|0);
      var $158=((($155)+($157))|0);
      var $159=HEAP32[((((5242932)|0))>>2)];
      var $160=((($159)-(1))|0);
      var $161=$160 ^ -1;
      var $162=$158 & $161;
      $esize=$162;
      var $163=$esize;
      var $164=(($163)>>>0) < 2147483647;
      if ($164) { label = 32; break; } else { label = 36; break; }
    case 32: 
      var $166=$esize;
      var $167=_sbrk($166);
      $end=$167;
      var $168=$end;
      var $169=(($168)|0)!=-1;
      if ($169) { label = 33; break; } else { label = 34; break; }
    case 33: 
      var $171=$esize;
      var $172=$asize;
      var $173=((($172)+($171))|0);
      $asize=$173;
      label = 35; break;
    case 34: 
      var $175=$asize;
      var $176=(((-$175))|0);
      var $177=_sbrk($176);
      $br=-1;
      label = 35; break;
    case 35: 
      label = 36; break;
    case 36: 
      label = 37; break;
    case 37: 
      label = 38; break;
    case 38: 
      var $182=$br;
      var $183=(($182)|0)!=-1;
      if ($183) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $185=$br;
      $tbase=$185;
      var $186=$asize;
      $tsize=$186;
      label = 41; break;
    case 40: 
      var $188=$2;
      var $189=(($188+440)|0);
      var $190=HEAP32[(($189)>>2)];
      var $191=$190 | 4;
      HEAP32[(($189)>>2)]=$191;
      label = 41; break;
    case 41: 
      label = 42; break;
    case 42: 
      label = 43; break;
    case 43: 
      var $195=$tbase;
      var $196=(($195)|0)==-1;
      if ($196) { label = 44; break; } else { label = 53; break; }
    case 44: 
      var $198=$3;
      var $199=((($198)+(48))|0);
      var $200=HEAP32[((((5242932)|0))>>2)];
      var $201=((($200)-(1))|0);
      var $202=((($199)+($201))|0);
      var $203=HEAP32[((((5242932)|0))>>2)];
      var $204=((($203)-(1))|0);
      var $205=$204 ^ -1;
      var $206=$202 & $205;
      $asize1=$206;
      var $207=$asize1;
      var $208=(($207)>>>0) < 2147483647;
      if ($208) { label = 45; break; } else { label = 52; break; }
    case 45: 
      $br2=-1;
      $end3=-1;
      var $210=$asize1;
      var $211=_sbrk($210);
      $br2=$211;
      var $212=_sbrk(0);
      $end3=$212;
      var $213=$br2;
      var $214=(($213)|0)!=-1;
      if ($214) { label = 46; break; } else { label = 51; break; }
    case 46: 
      var $216=$end3;
      var $217=(($216)|0)!=-1;
      if ($217) { label = 47; break; } else { label = 51; break; }
    case 47: 
      var $219=$br2;
      var $220=$end3;
      var $221=(($219)>>>0) < (($220)>>>0);
      if ($221) { label = 48; break; } else { label = 51; break; }
    case 48: 
      var $223=$end3;
      var $224=$br2;
      var $225=$223;
      var $226=$224;
      var $227=((($225)-($226))|0);
      $ssize=$227;
      var $228=$ssize;
      var $229=$3;
      var $230=((($229)+(40))|0);
      var $231=(($228)>>>0) > (($230)>>>0);
      if ($231) { label = 49; break; } else { label = 50; break; }
    case 49: 
      var $233=$br2;
      $tbase=$233;
      var $234=$ssize;
      $tsize=$234;
      label = 50; break;
    case 50: 
      label = 51; break;
    case 51: 
      label = 52; break;
    case 52: 
      label = 53; break;
    case 53: 
      var $239=$tbase;
      var $240=(($239)|0)!=-1;
      if ($240) { label = 54; break; } else { label = 92; break; }
    case 54: 
      var $242=$tsize;
      var $243=$2;
      var $244=(($243+432)|0);
      var $245=HEAP32[(($244)>>2)];
      var $246=((($245)+($242))|0);
      HEAP32[(($244)>>2)]=$246;
      var $247=$2;
      var $248=(($247+436)|0);
      var $249=HEAP32[(($248)>>2)];
      var $250=(($246)>>>0) > (($249)>>>0);
      if ($250) { label = 55; break; } else { label = 56; break; }
    case 55: 
      var $252=$2;
      var $253=(($252+432)|0);
      var $254=HEAP32[(($253)>>2)];
      var $255=$2;
      var $256=(($255+436)|0);
      HEAP32[(($256)>>2)]=$254;
      label = 56; break;
    case 56: 
      var $258=$2;
      var $259=(($258+24)|0);
      var $260=HEAP32[(($259)>>2)];
      var $261=(($260)|0)!=0;
      if ($261) { label = 64; break; } else { label = 57; break; }
    case 57: 
      var $263=$2;
      var $264=(($263+16)|0);
      var $265=HEAP32[(($264)>>2)];
      var $266=(($265)|0)==0;
      if ($266) { label = 59; break; } else { label = 58; break; }
    case 58: 
      var $268=$tbase;
      var $269=$2;
      var $270=(($269+16)|0);
      var $271=HEAP32[(($270)>>2)];
      var $272=(($268)>>>0) < (($271)>>>0);
      if ($272) { label = 59; break; } else { label = 60; break; }
    case 59: 
      var $274=$tbase;
      var $275=$2;
      var $276=(($275+16)|0);
      HEAP32[(($276)>>2)]=$274;
      label = 60; break;
    case 60: 
      var $278=$tbase;
      var $279=$2;
      var $280=(($279+444)|0);
      var $281=(($280)|0);
      HEAP32[(($281)>>2)]=$278;
      var $282=$tsize;
      var $283=$2;
      var $284=(($283+444)|0);
      var $285=(($284+4)|0);
      HEAP32[(($285)>>2)]=$282;
      var $286=$mmap_flag;
      var $287=$2;
      var $288=(($287+444)|0);
      var $289=(($288+12)|0);
      HEAP32[(($289)>>2)]=$286;
      var $290=HEAP32[((((5242924)|0))>>2)];
      var $291=$2;
      var $292=(($291+36)|0);
      HEAP32[(($292)>>2)]=$290;
      var $293=$2;
      var $294=(($293+32)|0);
      HEAP32[(($294)>>2)]=-1;
      var $295=$2;
      _init_bins($295);
      var $296=$2;
      var $297=(($296)|0)==5243136;
      if ($297) { label = 61; break; } else { label = 62; break; }
    case 61: 
      var $299=$2;
      var $300=$tbase;
      var $301=$300;
      var $302=$tsize;
      var $303=((($302)-(40))|0);
      _init_top($299, $301, $303);
      label = 63; break;
    case 62: 
      var $305=$2;
      var $306=$305;
      var $307=((($306)-(8))|0);
      var $308=$307;
      var $309=$308;
      var $310=$2;
      var $311=$310;
      var $312=((($311)-(8))|0);
      var $313=$312;
      var $314=(($313+4)|0);
      var $315=HEAP32[(($314)>>2)];
      var $316=$315 & -8;
      var $317=(($309+$316)|0);
      var $318=$317;
      $mn=$318;
      var $319=$2;
      var $320=$mn;
      var $321=$tbase;
      var $322=$tsize;
      var $323=(($321+$322)|0);
      var $324=$mn;
      var $325=$324;
      var $326=$323;
      var $327=$325;
      var $328=((($326)-($327))|0);
      var $329=((($328)-(40))|0);
      _init_top($319, $320, $329);
      label = 63; break;
    case 63: 
      label = 89; break;
    case 64: 
      var $332=$2;
      var $333=(($332+444)|0);
      $sp=$333;
      label = 65; break;
    case 65: 
      var $335=$sp;
      var $336=(($335)|0)!=0;
      if ($336) { label = 66; break; } else { var $348 = 0;label = 67; break; }
    case 66: 
      var $338=$tbase;
      var $339=$sp;
      var $340=(($339)|0);
      var $341=HEAP32[(($340)>>2)];
      var $342=$sp;
      var $343=(($342+4)|0);
      var $344=HEAP32[(($343)>>2)];
      var $345=(($341+$344)|0);
      var $346=(($338)|0)!=(($345)|0);
      var $348 = $346;label = 67; break;
    case 67: 
      var $348;
      if ($348) { label = 68; break; } else { label = 69; break; }
    case 68: 
      var $350=$sp;
      var $351=(($350+8)|0);
      var $352=HEAP32[(($351)>>2)];
      $sp=$352;
      label = 65; break;
    case 69: 
      var $354=$sp;
      var $355=(($354)|0)!=0;
      if ($355) { label = 70; break; } else { label = 75; break; }
    case 70: 
      var $357=$sp;
      var $358=(($357+12)|0);
      var $359=HEAP32[(($358)>>2)];
      var $360=$359 & 8;
      var $361=(($360)|0)!=0;
      if ($361) { label = 75; break; } else { label = 71; break; }
    case 71: 
      var $363=$sp;
      var $364=(($363+12)|0);
      var $365=HEAP32[(($364)>>2)];
      var $366=$365 & 0;
      var $367=$mmap_flag;
      var $368=(($366)|0)==(($367)|0);
      if ($368) { label = 72; break; } else { label = 75; break; }
    case 72: 
      var $370=$2;
      var $371=(($370+24)|0);
      var $372=HEAP32[(($371)>>2)];
      var $373=$372;
      var $374=$sp;
      var $375=(($374)|0);
      var $376=HEAP32[(($375)>>2)];
      var $377=(($373)>>>0) >= (($376)>>>0);
      if ($377) { label = 73; break; } else { label = 75; break; }
    case 73: 
      var $379=$2;
      var $380=(($379+24)|0);
      var $381=HEAP32[(($380)>>2)];
      var $382=$381;
      var $383=$sp;
      var $384=(($383)|0);
      var $385=HEAP32[(($384)>>2)];
      var $386=$sp;
      var $387=(($386+4)|0);
      var $388=HEAP32[(($387)>>2)];
      var $389=(($385+$388)|0);
      var $390=(($382)>>>0) < (($389)>>>0);
      if ($390) { label = 74; break; } else { label = 75; break; }
    case 74: 
      var $392=$tsize;
      var $393=$sp;
      var $394=(($393+4)|0);
      var $395=HEAP32[(($394)>>2)];
      var $396=((($395)+($392))|0);
      HEAP32[(($394)>>2)]=$396;
      var $397=$2;
      var $398=$2;
      var $399=(($398+24)|0);
      var $400=HEAP32[(($399)>>2)];
      var $401=$2;
      var $402=(($401+12)|0);
      var $403=HEAP32[(($402)>>2)];
      var $404=$tsize;
      var $405=((($403)+($404))|0);
      _init_top($397, $400, $405);
      label = 88; break;
    case 75: 
      var $407=$tbase;
      var $408=$2;
      var $409=(($408+16)|0);
      var $410=HEAP32[(($409)>>2)];
      var $411=(($407)>>>0) < (($410)>>>0);
      if ($411) { label = 76; break; } else { label = 77; break; }
    case 76: 
      var $413=$tbase;
      var $414=$2;
      var $415=(($414+16)|0);
      HEAP32[(($415)>>2)]=$413;
      label = 77; break;
    case 77: 
      var $417=$2;
      var $418=(($417+444)|0);
      $sp=$418;
      label = 78; break;
    case 78: 
      var $420=$sp;
      var $421=(($420)|0)!=0;
      if ($421) { label = 79; break; } else { var $431 = 0;label = 80; break; }
    case 79: 
      var $423=$sp;
      var $424=(($423)|0);
      var $425=HEAP32[(($424)>>2)];
      var $426=$tbase;
      var $427=$tsize;
      var $428=(($426+$427)|0);
      var $429=(($425)|0)!=(($428)|0);
      var $431 = $429;label = 80; break;
    case 80: 
      var $431;
      if ($431) { label = 81; break; } else { label = 82; break; }
    case 81: 
      var $433=$sp;
      var $434=(($433+8)|0);
      var $435=HEAP32[(($434)>>2)];
      $sp=$435;
      label = 78; break;
    case 82: 
      var $437=$sp;
      var $438=(($437)|0)!=0;
      if ($438) { label = 83; break; } else { label = 86; break; }
    case 83: 
      var $440=$sp;
      var $441=(($440+12)|0);
      var $442=HEAP32[(($441)>>2)];
      var $443=$442 & 8;
      var $444=(($443)|0)!=0;
      if ($444) { label = 86; break; } else { label = 84; break; }
    case 84: 
      var $446=$sp;
      var $447=(($446+12)|0);
      var $448=HEAP32[(($447)>>2)];
      var $449=$448 & 0;
      var $450=$mmap_flag;
      var $451=(($449)|0)==(($450)|0);
      if ($451) { label = 85; break; } else { label = 86; break; }
    case 85: 
      var $453=$sp;
      var $454=(($453)|0);
      var $455=HEAP32[(($454)>>2)];
      $oldbase=$455;
      var $456=$tbase;
      var $457=$sp;
      var $458=(($457)|0);
      HEAP32[(($458)>>2)]=$456;
      var $459=$tsize;
      var $460=$sp;
      var $461=(($460+4)|0);
      var $462=HEAP32[(($461)>>2)];
      var $463=((($462)+($459))|0);
      HEAP32[(($461)>>2)]=$463;
      var $464=$2;
      var $465=$tbase;
      var $466=$oldbase;
      var $467=$3;
      var $468=_prepend_alloc($464, $465, $466, $467);
      $1=$468;
      label = 93; break;
    case 86: 
      var $470=$2;
      var $471=$tbase;
      var $472=$tsize;
      var $473=$mmap_flag;
      _add_segment($470, $471, $472, $473);
      label = 87; break;
    case 87: 
      label = 88; break;
    case 88: 
      label = 89; break;
    case 89: 
      var $477=$3;
      var $478=$2;
      var $479=(($478+12)|0);
      var $480=HEAP32[(($479)>>2)];
      var $481=(($477)>>>0) < (($480)>>>0);
      if ($481) { label = 90; break; } else { label = 91; break; }
    case 90: 
      var $483=$3;
      var $484=$2;
      var $485=(($484+12)|0);
      var $486=HEAP32[(($485)>>2)];
      var $487=((($486)-($483))|0);
      HEAP32[(($485)>>2)]=$487;
      $rsize=$487;
      var $488=$2;
      var $489=(($488+24)|0);
      var $490=HEAP32[(($489)>>2)];
      $p=$490;
      var $491=$p;
      var $492=$491;
      var $493=$3;
      var $494=(($492+$493)|0);
      var $495=$494;
      var $496=$2;
      var $497=(($496+24)|0);
      HEAP32[(($497)>>2)]=$495;
      $r=$495;
      var $498=$rsize;
      var $499=$498 | 1;
      var $500=$r;
      var $501=(($500+4)|0);
      HEAP32[(($501)>>2)]=$499;
      var $502=$3;
      var $503=$502 | 1;
      var $504=$503 | 2;
      var $505=$p;
      var $506=(($505+4)|0);
      HEAP32[(($506)>>2)]=$504;
      var $507=$p;
      var $508=$507;
      var $509=(($508+8)|0);
      $1=$509;
      label = 93; break;
    case 91: 
      label = 92; break;
    case 92: 
      var $512=___errno_location();
      HEAP32[(($512)>>2)]=12;
      $1=0;
      label = 93; break;
    case 93: 
      var $514=$1;

      return $514;
    default: assert(0, "bad label: " + label);
  }
}
_sys_alloc["X"]=1;

function _free($mem) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $p;
      var $psize;
      var $next;
      var $prevsize;
      var $prev;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F1;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F2;
      var $B3;
      var $I4;
      var $TP5;
      var $XP6;
      var $R7;
      var $F8;
      var $RP9;
      var $CP10;
      var $H11;
      var $C012;
      var $C113;
      var $I14;
      var $B15;
      var $F16;
      var $tp;
      var $H17;
      var $I18;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K19;
      var $C;
      var $F20;
      $1=$mem;
      var $2=$1;
      var $3=(($2)|0)!=0;
      if ($3) { label = 3; break; } else { label = 197; break; }
    case 3: 
      var $5=$1;
      var $6=((($5)-(8))|0);
      var $7=$6;
      $p=$7;
      var $8=$p;
      var $9=$8;
      var $10=HEAP32[((((5243152)|0))>>2)];
      var $11=(($9)>>>0) >= (($10)>>>0);
      if ($11) { label = 4; break; } else { var $19 = 0;label = 5; break; }
    case 4: 
      var $13=$p;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=$15 & 3;
      var $17=(($16)|0)!=1;
      var $19 = $17;label = 5; break;
    case 5: 
      var $19;
      var $20=(($19)&1);
      var $21=($20);
      var $22=(($21)|0)!=0;
      if ($22) { label = 6; break; } else { label = 194; break; }
    case 6: 
      var $24=$p;
      var $25=(($24+4)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=$26 & -8;
      $psize=$27;
      var $28=$p;
      var $29=$28;
      var $30=$psize;
      var $31=(($29+$30)|0);
      var $32=$31;
      $next=$32;
      var $33=$p;
      var $34=(($33+4)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=$35 & 1;
      var $37=(($36)|0)!=0;
      if ($37) { label = 78; break; } else { label = 7; break; }
    case 7: 
      var $39=$p;
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      $prevsize=$41;
      var $42=$p;
      var $43=(($42+4)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$44 & 3;
      var $46=(($45)|0)==0;
      if ($46) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $48=$prevsize;
      var $49=((($48)+(16))|0);
      var $50=$psize;
      var $51=((($50)+($49))|0);
      $psize=$51;
      label = 196; break;
    case 9: 
      var $53=$p;
      var $54=$53;
      var $55=$prevsize;
      var $56=(((-$55))|0);
      var $57=(($54+$56)|0);
      var $58=$57;
      $prev=$58;
      var $59=$prevsize;
      var $60=$psize;
      var $61=((($60)+($59))|0);
      $psize=$61;
      var $62=$prev;
      $p=$62;
      var $63=$prev;
      var $64=$63;
      var $65=HEAP32[((((5243152)|0))>>2)];
      var $66=(($64)>>>0) >= (($65)>>>0);
      var $67=(($66)&1);
      var $68=($67);
      var $69=(($68)|0)!=0;
      if ($69) { label = 10; break; } else { label = 75; break; }
    case 10: 
      var $71=$p;
      var $72=HEAP32[((((5243156)|0))>>2)];
      var $73=(($71)|0)!=(($72)|0);
      if ($73) { label = 11; break; } else { label = 71; break; }
    case 11: 
      var $75=$prevsize;
      var $76=$75 >>> 3;
      var $77=(($76)>>>0) < 32;
      if ($77) { label = 12; break; } else { label = 24; break; }
    case 12: 
      var $79=$p;
      var $80=(($79+8)|0);
      var $81=HEAP32[(($80)>>2)];
      $F=$81;
      var $82=$p;
      var $83=(($82+12)|0);
      var $84=HEAP32[(($83)>>2)];
      $B=$84;
      var $85=$prevsize;
      var $86=$85 >>> 3;
      $I=$86;
      var $87=$F;
      var $88=$B;
      var $89=(($87)|0)==(($88)|0);
      if ($89) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $91=$I;
      var $92=1 << $91;
      var $93=$92 ^ -1;
      var $94=HEAP32[((((5243136)|0))>>2)];
      var $95=$94 & $93;
      HEAP32[((((5243136)|0))>>2)]=$95;
      label = 23; break;
    case 14: 
      var $97=$F;
      var $98=$I;
      var $99=$98 << 1;
      var $100=((((5243176)|0)+($99<<2))|0);
      var $101=$100;
      var $102=$101;
      var $103=(($97)|0)==(($102)|0);
      if ($103) { label = 16; break; } else { label = 15; break; }
    case 15: 
      var $105=$F;
      var $106=$105;
      var $107=HEAP32[((((5243152)|0))>>2)];
      var $108=(($106)>>>0) >= (($107)>>>0);
      if ($108) { label = 16; break; } else { var $125 = 0;label = 19; break; }
    case 16: 
      var $110=$B;
      var $111=$I;
      var $112=$111 << 1;
      var $113=((((5243176)|0)+($112<<2))|0);
      var $114=$113;
      var $115=$114;
      var $116=(($110)|0)==(($115)|0);
      if ($116) { var $123 = 1;label = 18; break; } else { label = 17; break; }
    case 17: 
      var $118=$B;
      var $119=$118;
      var $120=HEAP32[((((5243152)|0))>>2)];
      var $121=(($119)>>>0) >= (($120)>>>0);
      var $123 = $121;label = 18; break;
    case 18: 
      var $123;
      var $125 = $123;label = 19; break;
    case 19: 
      var $125;
      var $126=(($125)&1);
      var $127=($126);
      var $128=(($127)|0)!=0;
      if ($128) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $130=$B;
      var $131=$F;
      var $132=(($131+12)|0);
      HEAP32[(($132)>>2)]=$130;
      var $133=$F;
      var $134=$B;
      var $135=(($134+8)|0);
      HEAP32[(($135)>>2)]=$133;
      label = 22; break;
    case 21: 
      _abort();
      throw "Reached an unreachable!"
    case 22: 
      label = 23; break;
    case 23: 
      label = 70; break;
    case 24: 
      var $140=$p;
      var $141=$140;
      $TP=$141;
      var $142=$TP;
      var $143=(($142+24)|0);
      var $144=HEAP32[(($143)>>2)];
      $XP=$144;
      var $145=$TP;
      var $146=(($145+12)|0);
      var $147=HEAP32[(($146)>>2)];
      var $148=$TP;
      var $149=(($147)|0)!=(($148)|0);
      if ($149) { label = 25; break; } else { label = 29; break; }
    case 25: 
      var $151=$TP;
      var $152=(($151+8)|0);
      var $153=HEAP32[(($152)>>2)];
      $F1=$153;
      var $154=$TP;
      var $155=(($154+12)|0);
      var $156=HEAP32[(($155)>>2)];
      $R=$156;
      var $157=$F1;
      var $158=$157;
      var $159=HEAP32[((((5243152)|0))>>2)];
      var $160=(($158)>>>0) >= (($159)>>>0);
      var $161=(($160)&1);
      var $162=($161);
      var $163=(($162)|0)!=0;
      if ($163) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $165=$R;
      var $166=$F1;
      var $167=(($166+12)|0);
      HEAP32[(($167)>>2)]=$165;
      var $168=$F1;
      var $169=$R;
      var $170=(($169+8)|0);
      HEAP32[(($170)>>2)]=$168;
      label = 28; break;
    case 27: 
      _abort();
      throw "Reached an unreachable!"
    case 28: 
      label = 41; break;
    case 29: 
      var $174=$TP;
      var $175=(($174+16)|0);
      var $176=(($175+4)|0);
      $RP=$176;
      var $177=HEAP32[(($176)>>2)];
      $R=$177;
      var $178=(($177)|0)!=0;
      if ($178) { label = 31; break; } else { label = 30; break; }
    case 30: 
      var $180=$TP;
      var $181=(($180+16)|0);
      var $182=(($181)|0);
      $RP=$182;
      var $183=HEAP32[(($182)>>2)];
      $R=$183;
      var $184=(($183)|0)!=0;
      if ($184) { label = 31; break; } else { label = 40; break; }
    case 31: 
      label = 32; break;
    case 32: 
      var $187=$R;
      var $188=(($187+16)|0);
      var $189=(($188+4)|0);
      $CP=$189;
      var $190=HEAP32[(($189)>>2)];
      var $191=(($190)|0)!=0;
      if ($191) { var $199 = 1;label = 34; break; } else { label = 33; break; }
    case 33: 
      var $193=$R;
      var $194=(($193+16)|0);
      var $195=(($194)|0);
      $CP=$195;
      var $196=HEAP32[(($195)>>2)];
      var $197=(($196)|0)!=0;
      var $199 = $197;label = 34; break;
    case 34: 
      var $199;
      if ($199) { label = 35; break; } else { label = 36; break; }
    case 35: 
      var $201=$CP;
      $RP=$201;
      var $202=HEAP32[(($201)>>2)];
      $R=$202;
      label = 32; break;
    case 36: 
      var $204=$RP;
      var $205=$204;
      var $206=HEAP32[((((5243152)|0))>>2)];
      var $207=(($205)>>>0) >= (($206)>>>0);
      var $208=(($207)&1);
      var $209=($208);
      var $210=(($209)|0)!=0;
      if ($210) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $212=$RP;
      HEAP32[(($212)>>2)]=0;
      label = 39; break;
    case 38: 
      _abort();
      throw "Reached an unreachable!"
    case 39: 
      label = 40; break;
    case 40: 
      label = 41; break;
    case 41: 
      var $217=$XP;
      var $218=(($217)|0)!=0;
      if ($218) { label = 42; break; } else { label = 69; break; }
    case 42: 
      var $220=$TP;
      var $221=(($220+28)|0);
      var $222=HEAP32[(($221)>>2)];
      var $223=((((5243440)|0)+($222<<2))|0);
      $H=$223;
      var $224=$TP;
      var $225=$H;
      var $226=HEAP32[(($225)>>2)];
      var $227=(($224)|0)==(($226)|0);
      if ($227) { label = 43; break; } else { label = 46; break; }
    case 43: 
      var $229=$R;
      var $230=$H;
      HEAP32[(($230)>>2)]=$229;
      var $231=(($229)|0)==0;
      if ($231) { label = 44; break; } else { label = 45; break; }
    case 44: 
      var $233=$TP;
      var $234=(($233+28)|0);
      var $235=HEAP32[(($234)>>2)];
      var $236=1 << $235;
      var $237=$236 ^ -1;
      var $238=HEAP32[((((5243140)|0))>>2)];
      var $239=$238 & $237;
      HEAP32[((((5243140)|0))>>2)]=$239;
      label = 45; break;
    case 45: 
      label = 53; break;
    case 46: 
      var $242=$XP;
      var $243=$242;
      var $244=HEAP32[((((5243152)|0))>>2)];
      var $245=(($243)>>>0) >= (($244)>>>0);
      var $246=(($245)&1);
      var $247=($246);
      var $248=(($247)|0)!=0;
      if ($248) { label = 47; break; } else { label = 51; break; }
    case 47: 
      var $250=$XP;
      var $251=(($250+16)|0);
      var $252=(($251)|0);
      var $253=HEAP32[(($252)>>2)];
      var $254=$TP;
      var $255=(($253)|0)==(($254)|0);
      if ($255) { label = 48; break; } else { label = 49; break; }
    case 48: 
      var $257=$R;
      var $258=$XP;
      var $259=(($258+16)|0);
      var $260=(($259)|0);
      HEAP32[(($260)>>2)]=$257;
      label = 50; break;
    case 49: 
      var $262=$R;
      var $263=$XP;
      var $264=(($263+16)|0);
      var $265=(($264+4)|0);
      HEAP32[(($265)>>2)]=$262;
      label = 50; break;
    case 50: 
      label = 52; break;
    case 51: 
      _abort();
      throw "Reached an unreachable!"
    case 52: 
      label = 53; break;
    case 53: 
      var $270=$R;
      var $271=(($270)|0)!=0;
      if ($271) { label = 54; break; } else { label = 68; break; }
    case 54: 
      var $273=$R;
      var $274=$273;
      var $275=HEAP32[((((5243152)|0))>>2)];
      var $276=(($274)>>>0) >= (($275)>>>0);
      var $277=(($276)&1);
      var $278=($277);
      var $279=(($278)|0)!=0;
      if ($279) { label = 55; break; } else { label = 66; break; }
    case 55: 
      var $281=$XP;
      var $282=$R;
      var $283=(($282+24)|0);
      HEAP32[(($283)>>2)]=$281;
      var $284=$TP;
      var $285=(($284+16)|0);
      var $286=(($285)|0);
      var $287=HEAP32[(($286)>>2)];
      $C0=$287;
      var $288=(($287)|0)!=0;
      if ($288) { label = 56; break; } else { label = 60; break; }
    case 56: 
      var $290=$C0;
      var $291=$290;
      var $292=HEAP32[((((5243152)|0))>>2)];
      var $293=(($291)>>>0) >= (($292)>>>0);
      var $294=(($293)&1);
      var $295=($294);
      var $296=(($295)|0)!=0;
      if ($296) { label = 57; break; } else { label = 58; break; }
    case 57: 
      var $298=$C0;
      var $299=$R;
      var $300=(($299+16)|0);
      var $301=(($300)|0);
      HEAP32[(($301)>>2)]=$298;
      var $302=$R;
      var $303=$C0;
      var $304=(($303+24)|0);
      HEAP32[(($304)>>2)]=$302;
      label = 59; break;
    case 58: 
      _abort();
      throw "Reached an unreachable!"
    case 59: 
      label = 60; break;
    case 60: 
      var $308=$TP;
      var $309=(($308+16)|0);
      var $310=(($309+4)|0);
      var $311=HEAP32[(($310)>>2)];
      $C1=$311;
      var $312=(($311)|0)!=0;
      if ($312) { label = 61; break; } else { label = 65; break; }
    case 61: 
      var $314=$C1;
      var $315=$314;
      var $316=HEAP32[((((5243152)|0))>>2)];
      var $317=(($315)>>>0) >= (($316)>>>0);
      var $318=(($317)&1);
      var $319=($318);
      var $320=(($319)|0)!=0;
      if ($320) { label = 62; break; } else { label = 63; break; }
    case 62: 
      var $322=$C1;
      var $323=$R;
      var $324=(($323+16)|0);
      var $325=(($324+4)|0);
      HEAP32[(($325)>>2)]=$322;
      var $326=$R;
      var $327=$C1;
      var $328=(($327+24)|0);
      HEAP32[(($328)>>2)]=$326;
      label = 64; break;
    case 63: 
      _abort();
      throw "Reached an unreachable!"
    case 64: 
      label = 65; break;
    case 65: 
      label = 67; break;
    case 66: 
      _abort();
      throw "Reached an unreachable!"
    case 67: 
      label = 68; break;
    case 68: 
      label = 69; break;
    case 69: 
      label = 70; break;
    case 70: 
      label = 74; break;
    case 71: 
      var $338=$next;
      var $339=(($338+4)|0);
      var $340=HEAP32[(($339)>>2)];
      var $341=$340 & 3;
      var $342=(($341)|0)==3;
      if ($342) { label = 72; break; } else { label = 73; break; }
    case 72: 
      var $344=$psize;
      HEAP32[((((5243144)|0))>>2)]=$344;
      var $345=$next;
      var $346=(($345+4)|0);
      var $347=HEAP32[(($346)>>2)];
      var $348=$347 & -2;
      HEAP32[(($346)>>2)]=$348;
      var $349=$psize;
      var $350=$349 | 1;
      var $351=$p;
      var $352=(($351+4)|0);
      HEAP32[(($352)>>2)]=$350;
      var $353=$psize;
      var $354=$p;
      var $355=$354;
      var $356=$psize;
      var $357=(($355+$356)|0);
      var $358=$357;
      var $359=(($358)|0);
      HEAP32[(($359)>>2)]=$353;
      label = 196; break;
    case 73: 
      label = 74; break;
    case 74: 
      label = 76; break;
    case 75: 
      label = 195; break;
    case 76: 
      label = 77; break;
    case 77: 
      label = 78; break;
    case 78: 
      var $366=$p;
      var $367=$366;
      var $368=$next;
      var $369=$368;
      var $370=(($367)>>>0) < (($369)>>>0);
      if ($370) { label = 79; break; } else { var $378 = 0;label = 80; break; }
    case 79: 
      var $372=$next;
      var $373=(($372+4)|0);
      var $374=HEAP32[(($373)>>2)];
      var $375=$374 & 1;
      var $376=(($375)|0)!=0;
      var $378 = $376;label = 80; break;
    case 80: 
      var $378;
      var $379=(($378)&1);
      var $380=($379);
      var $381=(($380)|0)!=0;
      if ($381) { label = 81; break; } else { label = 193; break; }
    case 81: 
      var $383=$next;
      var $384=(($383+4)|0);
      var $385=HEAP32[(($384)>>2)];
      var $386=$385 & 2;
      var $387=(($386)|0)!=0;
      if ($387) { label = 154; break; } else { label = 82; break; }
    case 82: 
      var $389=$next;
      var $390=HEAP32[((((5243160)|0))>>2)];
      var $391=(($389)|0)==(($390)|0);
      if ($391) { label = 83; break; } else { label = 88; break; }
    case 83: 
      var $393=$psize;
      var $394=HEAP32[((((5243148)|0))>>2)];
      var $395=((($394)+($393))|0);
      HEAP32[((((5243148)|0))>>2)]=$395;
      $tsize=$395;
      var $396=$p;
      HEAP32[((((5243160)|0))>>2)]=$396;
      var $397=$tsize;
      var $398=$397 | 1;
      var $399=$p;
      var $400=(($399+4)|0);
      HEAP32[(($400)>>2)]=$398;
      var $401=$p;
      var $402=HEAP32[((((5243156)|0))>>2)];
      var $403=(($401)|0)==(($402)|0);
      if ($403) { label = 84; break; } else { label = 85; break; }
    case 84: 
      HEAP32[((((5243156)|0))>>2)]=0;
      HEAP32[((((5243144)|0))>>2)]=0;
      label = 85; break;
    case 85: 
      var $406=$tsize;
      var $407=HEAP32[((((5243164)|0))>>2)];
      var $408=(($406)>>>0) > (($407)>>>0);
      if ($408) { label = 86; break; } else { label = 87; break; }
    case 86: 
      var $410=_sys_trim(5243136, 0);
      label = 87; break;
    case 87: 
      label = 196; break;
    case 88: 
      var $413=$next;
      var $414=HEAP32[((((5243156)|0))>>2)];
      var $415=(($413)|0)==(($414)|0);
      if ($415) { label = 89; break; } else { label = 90; break; }
    case 89: 
      var $417=$psize;
      var $418=HEAP32[((((5243144)|0))>>2)];
      var $419=((($418)+($417))|0);
      HEAP32[((((5243144)|0))>>2)]=$419;
      $dsize=$419;
      var $420=$p;
      HEAP32[((((5243156)|0))>>2)]=$420;
      var $421=$dsize;
      var $422=$421 | 1;
      var $423=$p;
      var $424=(($423+4)|0);
      HEAP32[(($424)>>2)]=$422;
      var $425=$dsize;
      var $426=$p;
      var $427=$426;
      var $428=$dsize;
      var $429=(($427+$428)|0);
      var $430=$429;
      var $431=(($430)|0);
      HEAP32[(($431)>>2)]=$425;
      label = 196; break;
    case 90: 
      var $433=$next;
      var $434=(($433+4)|0);
      var $435=HEAP32[(($434)>>2)];
      var $436=$435 & -8;
      $nsize=$436;
      var $437=$nsize;
      var $438=$psize;
      var $439=((($438)+($437))|0);
      $psize=$439;
      var $440=$nsize;
      var $441=$440 >>> 3;
      var $442=(($441)>>>0) < 32;
      if ($442) { label = 91; break; } else { label = 103; break; }
    case 91: 
      var $444=$next;
      var $445=(($444+8)|0);
      var $446=HEAP32[(($445)>>2)];
      $F2=$446;
      var $447=$next;
      var $448=(($447+12)|0);
      var $449=HEAP32[(($448)>>2)];
      $B3=$449;
      var $450=$nsize;
      var $451=$450 >>> 3;
      $I4=$451;
      var $452=$F2;
      var $453=$B3;
      var $454=(($452)|0)==(($453)|0);
      if ($454) { label = 92; break; } else { label = 93; break; }
    case 92: 
      var $456=$I4;
      var $457=1 << $456;
      var $458=$457 ^ -1;
      var $459=HEAP32[((((5243136)|0))>>2)];
      var $460=$459 & $458;
      HEAP32[((((5243136)|0))>>2)]=$460;
      label = 102; break;
    case 93: 
      var $462=$F2;
      var $463=$I4;
      var $464=$463 << 1;
      var $465=((((5243176)|0)+($464<<2))|0);
      var $466=$465;
      var $467=$466;
      var $468=(($462)|0)==(($467)|0);
      if ($468) { label = 95; break; } else { label = 94; break; }
    case 94: 
      var $470=$F2;
      var $471=$470;
      var $472=HEAP32[((((5243152)|0))>>2)];
      var $473=(($471)>>>0) >= (($472)>>>0);
      if ($473) { label = 95; break; } else { var $490 = 0;label = 98; break; }
    case 95: 
      var $475=$B3;
      var $476=$I4;
      var $477=$476 << 1;
      var $478=((((5243176)|0)+($477<<2))|0);
      var $479=$478;
      var $480=$479;
      var $481=(($475)|0)==(($480)|0);
      if ($481) { var $488 = 1;label = 97; break; } else { label = 96; break; }
    case 96: 
      var $483=$B3;
      var $484=$483;
      var $485=HEAP32[((((5243152)|0))>>2)];
      var $486=(($484)>>>0) >= (($485)>>>0);
      var $488 = $486;label = 97; break;
    case 97: 
      var $488;
      var $490 = $488;label = 98; break;
    case 98: 
      var $490;
      var $491=(($490)&1);
      var $492=($491);
      var $493=(($492)|0)!=0;
      if ($493) { label = 99; break; } else { label = 100; break; }
    case 99: 
      var $495=$B3;
      var $496=$F2;
      var $497=(($496+12)|0);
      HEAP32[(($497)>>2)]=$495;
      var $498=$F2;
      var $499=$B3;
      var $500=(($499+8)|0);
      HEAP32[(($500)>>2)]=$498;
      label = 101; break;
    case 100: 
      _abort();
      throw "Reached an unreachable!"
    case 101: 
      label = 102; break;
    case 102: 
      label = 149; break;
    case 103: 
      var $505=$next;
      var $506=$505;
      $TP5=$506;
      var $507=$TP5;
      var $508=(($507+24)|0);
      var $509=HEAP32[(($508)>>2)];
      $XP6=$509;
      var $510=$TP5;
      var $511=(($510+12)|0);
      var $512=HEAP32[(($511)>>2)];
      var $513=$TP5;
      var $514=(($512)|0)!=(($513)|0);
      if ($514) { label = 104; break; } else { label = 108; break; }
    case 104: 
      var $516=$TP5;
      var $517=(($516+8)|0);
      var $518=HEAP32[(($517)>>2)];
      $F8=$518;
      var $519=$TP5;
      var $520=(($519+12)|0);
      var $521=HEAP32[(($520)>>2)];
      $R7=$521;
      var $522=$F8;
      var $523=$522;
      var $524=HEAP32[((((5243152)|0))>>2)];
      var $525=(($523)>>>0) >= (($524)>>>0);
      var $526=(($525)&1);
      var $527=($526);
      var $528=(($527)|0)!=0;
      if ($528) { label = 105; break; } else { label = 106; break; }
    case 105: 
      var $530=$R7;
      var $531=$F8;
      var $532=(($531+12)|0);
      HEAP32[(($532)>>2)]=$530;
      var $533=$F8;
      var $534=$R7;
      var $535=(($534+8)|0);
      HEAP32[(($535)>>2)]=$533;
      label = 107; break;
    case 106: 
      _abort();
      throw "Reached an unreachable!"
    case 107: 
      label = 120; break;
    case 108: 
      var $539=$TP5;
      var $540=(($539+16)|0);
      var $541=(($540+4)|0);
      $RP9=$541;
      var $542=HEAP32[(($541)>>2)];
      $R7=$542;
      var $543=(($542)|0)!=0;
      if ($543) { label = 110; break; } else { label = 109; break; }
    case 109: 
      var $545=$TP5;
      var $546=(($545+16)|0);
      var $547=(($546)|0);
      $RP9=$547;
      var $548=HEAP32[(($547)>>2)];
      $R7=$548;
      var $549=(($548)|0)!=0;
      if ($549) { label = 110; break; } else { label = 119; break; }
    case 110: 
      label = 111; break;
    case 111: 
      var $552=$R7;
      var $553=(($552+16)|0);
      var $554=(($553+4)|0);
      $CP10=$554;
      var $555=HEAP32[(($554)>>2)];
      var $556=(($555)|0)!=0;
      if ($556) { var $564 = 1;label = 113; break; } else { label = 112; break; }
    case 112: 
      var $558=$R7;
      var $559=(($558+16)|0);
      var $560=(($559)|0);
      $CP10=$560;
      var $561=HEAP32[(($560)>>2)];
      var $562=(($561)|0)!=0;
      var $564 = $562;label = 113; break;
    case 113: 
      var $564;
      if ($564) { label = 114; break; } else { label = 115; break; }
    case 114: 
      var $566=$CP10;
      $RP9=$566;
      var $567=HEAP32[(($566)>>2)];
      $R7=$567;
      label = 111; break;
    case 115: 
      var $569=$RP9;
      var $570=$569;
      var $571=HEAP32[((((5243152)|0))>>2)];
      var $572=(($570)>>>0) >= (($571)>>>0);
      var $573=(($572)&1);
      var $574=($573);
      var $575=(($574)|0)!=0;
      if ($575) { label = 116; break; } else { label = 117; break; }
    case 116: 
      var $577=$RP9;
      HEAP32[(($577)>>2)]=0;
      label = 118; break;
    case 117: 
      _abort();
      throw "Reached an unreachable!"
    case 118: 
      label = 119; break;
    case 119: 
      label = 120; break;
    case 120: 
      var $582=$XP6;
      var $583=(($582)|0)!=0;
      if ($583) { label = 121; break; } else { label = 148; break; }
    case 121: 
      var $585=$TP5;
      var $586=(($585+28)|0);
      var $587=HEAP32[(($586)>>2)];
      var $588=((((5243440)|0)+($587<<2))|0);
      $H11=$588;
      var $589=$TP5;
      var $590=$H11;
      var $591=HEAP32[(($590)>>2)];
      var $592=(($589)|0)==(($591)|0);
      if ($592) { label = 122; break; } else { label = 125; break; }
    case 122: 
      var $594=$R7;
      var $595=$H11;
      HEAP32[(($595)>>2)]=$594;
      var $596=(($594)|0)==0;
      if ($596) { label = 123; break; } else { label = 124; break; }
    case 123: 
      var $598=$TP5;
      var $599=(($598+28)|0);
      var $600=HEAP32[(($599)>>2)];
      var $601=1 << $600;
      var $602=$601 ^ -1;
      var $603=HEAP32[((((5243140)|0))>>2)];
      var $604=$603 & $602;
      HEAP32[((((5243140)|0))>>2)]=$604;
      label = 124; break;
    case 124: 
      label = 132; break;
    case 125: 
      var $607=$XP6;
      var $608=$607;
      var $609=HEAP32[((((5243152)|0))>>2)];
      var $610=(($608)>>>0) >= (($609)>>>0);
      var $611=(($610)&1);
      var $612=($611);
      var $613=(($612)|0)!=0;
      if ($613) { label = 126; break; } else { label = 130; break; }
    case 126: 
      var $615=$XP6;
      var $616=(($615+16)|0);
      var $617=(($616)|0);
      var $618=HEAP32[(($617)>>2)];
      var $619=$TP5;
      var $620=(($618)|0)==(($619)|0);
      if ($620) { label = 127; break; } else { label = 128; break; }
    case 127: 
      var $622=$R7;
      var $623=$XP6;
      var $624=(($623+16)|0);
      var $625=(($624)|0);
      HEAP32[(($625)>>2)]=$622;
      label = 129; break;
    case 128: 
      var $627=$R7;
      var $628=$XP6;
      var $629=(($628+16)|0);
      var $630=(($629+4)|0);
      HEAP32[(($630)>>2)]=$627;
      label = 129; break;
    case 129: 
      label = 131; break;
    case 130: 
      _abort();
      throw "Reached an unreachable!"
    case 131: 
      label = 132; break;
    case 132: 
      var $635=$R7;
      var $636=(($635)|0)!=0;
      if ($636) { label = 133; break; } else { label = 147; break; }
    case 133: 
      var $638=$R7;
      var $639=$638;
      var $640=HEAP32[((((5243152)|0))>>2)];
      var $641=(($639)>>>0) >= (($640)>>>0);
      var $642=(($641)&1);
      var $643=($642);
      var $644=(($643)|0)!=0;
      if ($644) { label = 134; break; } else { label = 145; break; }
    case 134: 
      var $646=$XP6;
      var $647=$R7;
      var $648=(($647+24)|0);
      HEAP32[(($648)>>2)]=$646;
      var $649=$TP5;
      var $650=(($649+16)|0);
      var $651=(($650)|0);
      var $652=HEAP32[(($651)>>2)];
      $C012=$652;
      var $653=(($652)|0)!=0;
      if ($653) { label = 135; break; } else { label = 139; break; }
    case 135: 
      var $655=$C012;
      var $656=$655;
      var $657=HEAP32[((((5243152)|0))>>2)];
      var $658=(($656)>>>0) >= (($657)>>>0);
      var $659=(($658)&1);
      var $660=($659);
      var $661=(($660)|0)!=0;
      if ($661) { label = 136; break; } else { label = 137; break; }
    case 136: 
      var $663=$C012;
      var $664=$R7;
      var $665=(($664+16)|0);
      var $666=(($665)|0);
      HEAP32[(($666)>>2)]=$663;
      var $667=$R7;
      var $668=$C012;
      var $669=(($668+24)|0);
      HEAP32[(($669)>>2)]=$667;
      label = 138; break;
    case 137: 
      _abort();
      throw "Reached an unreachable!"
    case 138: 
      label = 139; break;
    case 139: 
      var $673=$TP5;
      var $674=(($673+16)|0);
      var $675=(($674+4)|0);
      var $676=HEAP32[(($675)>>2)];
      $C113=$676;
      var $677=(($676)|0)!=0;
      if ($677) { label = 140; break; } else { label = 144; break; }
    case 140: 
      var $679=$C113;
      var $680=$679;
      var $681=HEAP32[((((5243152)|0))>>2)];
      var $682=(($680)>>>0) >= (($681)>>>0);
      var $683=(($682)&1);
      var $684=($683);
      var $685=(($684)|0)!=0;
      if ($685) { label = 141; break; } else { label = 142; break; }
    case 141: 
      var $687=$C113;
      var $688=$R7;
      var $689=(($688+16)|0);
      var $690=(($689+4)|0);
      HEAP32[(($690)>>2)]=$687;
      var $691=$R7;
      var $692=$C113;
      var $693=(($692+24)|0);
      HEAP32[(($693)>>2)]=$691;
      label = 143; break;
    case 142: 
      _abort();
      throw "Reached an unreachable!"
    case 143: 
      label = 144; break;
    case 144: 
      label = 146; break;
    case 145: 
      _abort();
      throw "Reached an unreachable!"
    case 146: 
      label = 147; break;
    case 147: 
      label = 148; break;
    case 148: 
      label = 149; break;
    case 149: 
      var $702=$psize;
      var $703=$702 | 1;
      var $704=$p;
      var $705=(($704+4)|0);
      HEAP32[(($705)>>2)]=$703;
      var $706=$psize;
      var $707=$p;
      var $708=$707;
      var $709=$psize;
      var $710=(($708+$709)|0);
      var $711=$710;
      var $712=(($711)|0);
      HEAP32[(($712)>>2)]=$706;
      var $713=$p;
      var $714=HEAP32[((((5243156)|0))>>2)];
      var $715=(($713)|0)==(($714)|0);
      if ($715) { label = 150; break; } else { label = 151; break; }
    case 150: 
      var $717=$psize;
      HEAP32[((((5243144)|0))>>2)]=$717;
      label = 196; break;
    case 151: 
      label = 152; break;
    case 152: 
      label = 153; break;
    case 153: 
      label = 155; break;
    case 154: 
      var $722=$next;
      var $723=(($722+4)|0);
      var $724=HEAP32[(($723)>>2)];
      var $725=$724 & -2;
      HEAP32[(($723)>>2)]=$725;
      var $726=$psize;
      var $727=$726 | 1;
      var $728=$p;
      var $729=(($728+4)|0);
      HEAP32[(($729)>>2)]=$727;
      var $730=$psize;
      var $731=$p;
      var $732=$731;
      var $733=$psize;
      var $734=(($732+$733)|0);
      var $735=$734;
      var $736=(($735)|0);
      HEAP32[(($736)>>2)]=$730;
      label = 155; break;
    case 155: 
      var $738=$psize;
      var $739=$738 >>> 3;
      var $740=(($739)>>>0) < 32;
      if ($740) { label = 156; break; } else { label = 163; break; }
    case 156: 
      var $742=$psize;
      var $743=$742 >>> 3;
      $I14=$743;
      var $744=$I14;
      var $745=$744 << 1;
      var $746=((((5243176)|0)+($745<<2))|0);
      var $747=$746;
      var $748=$747;
      $B15=$748;
      var $749=$B15;
      $F16=$749;
      var $750=HEAP32[((((5243136)|0))>>2)];
      var $751=$I14;
      var $752=1 << $751;
      var $753=$750 & $752;
      var $754=(($753)|0)!=0;
      if ($754) { label = 158; break; } else { label = 157; break; }
    case 157: 
      var $756=$I14;
      var $757=1 << $756;
      var $758=HEAP32[((((5243136)|0))>>2)];
      var $759=$758 | $757;
      HEAP32[((((5243136)|0))>>2)]=$759;
      label = 162; break;
    case 158: 
      var $761=$B15;
      var $762=(($761+8)|0);
      var $763=HEAP32[(($762)>>2)];
      var $764=$763;
      var $765=HEAP32[((((5243152)|0))>>2)];
      var $766=(($764)>>>0) >= (($765)>>>0);
      var $767=(($766)&1);
      var $768=($767);
      var $769=(($768)|0)!=0;
      if ($769) { label = 159; break; } else { label = 160; break; }
    case 159: 
      var $771=$B15;
      var $772=(($771+8)|0);
      var $773=HEAP32[(($772)>>2)];
      $F16=$773;
      label = 161; break;
    case 160: 
      _abort();
      throw "Reached an unreachable!"
    case 161: 
      label = 162; break;
    case 162: 
      var $777=$p;
      var $778=$B15;
      var $779=(($778+8)|0);
      HEAP32[(($779)>>2)]=$777;
      var $780=$p;
      var $781=$F16;
      var $782=(($781+12)|0);
      HEAP32[(($782)>>2)]=$780;
      var $783=$F16;
      var $784=$p;
      var $785=(($784+8)|0);
      HEAP32[(($785)>>2)]=$783;
      var $786=$B15;
      var $787=$p;
      var $788=(($787+12)|0);
      HEAP32[(($788)>>2)]=$786;
      label = 192; break;
    case 163: 
      var $790=$p;
      var $791=$790;
      $tp=$791;
      var $792=$psize;
      var $793=$792 >>> 8;
      $X=$793;
      var $794=$X;
      var $795=(($794)|0)==0;
      if ($795) { label = 164; break; } else { label = 165; break; }
    case 164: 
      $I18=0;
      label = 169; break;
    case 165: 
      var $798=$X;
      var $799=(($798)>>>0) > 65535;
      if ($799) { label = 166; break; } else { label = 167; break; }
    case 166: 
      $I18=31;
      label = 168; break;
    case 167: 
      var $802=$X;
      $Y=$802;
      var $803=$Y;
      var $804=((($803)-(256))|0);
      var $805=$804 >>> 16;
      var $806=$805 & 8;
      $N=$806;
      var $807=$N;
      var $808=$Y;
      var $809=$808 << $807;
      $Y=$809;
      var $810=((($809)-(4096))|0);
      var $811=$810 >>> 16;
      var $812=$811 & 4;
      $K=$812;
      var $813=$K;
      var $814=$N;
      var $815=((($814)+($813))|0);
      $N=$815;
      var $816=$K;
      var $817=$Y;
      var $818=$817 << $816;
      $Y=$818;
      var $819=((($818)-(16384))|0);
      var $820=$819 >>> 16;
      var $821=$820 & 2;
      $K=$821;
      var $822=$N;
      var $823=((($822)+($821))|0);
      $N=$823;
      var $824=$N;
      var $825=(((14)-($824))|0);
      var $826=$K;
      var $827=$Y;
      var $828=$827 << $826;
      $Y=$828;
      var $829=$828 >>> 15;
      var $830=((($825)+($829))|0);
      $K=$830;
      var $831=$K;
      var $832=$831 << 1;
      var $833=$psize;
      var $834=$K;
      var $835=((($834)+(7))|0);
      var $836=$833 >>> (($835)>>>0);
      var $837=$836 & 1;
      var $838=((($832)+($837))|0);
      $I18=$838;
      label = 168; break;
    case 168: 
      label = 169; break;
    case 169: 
      var $841=$I18;
      var $842=((((5243440)|0)+($841<<2))|0);
      $H17=$842;
      var $843=$I18;
      var $844=$tp;
      var $845=(($844+28)|0);
      HEAP32[(($845)>>2)]=$843;
      var $846=$tp;
      var $847=(($846+16)|0);
      var $848=(($847+4)|0);
      HEAP32[(($848)>>2)]=0;
      var $849=$tp;
      var $850=(($849+16)|0);
      var $851=(($850)|0);
      HEAP32[(($851)>>2)]=0;
      var $852=HEAP32[((((5243140)|0))>>2)];
      var $853=$I18;
      var $854=1 << $853;
      var $855=$852 & $854;
      var $856=(($855)|0)!=0;
      if ($856) { label = 171; break; } else { label = 170; break; }
    case 170: 
      var $858=$I18;
      var $859=1 << $858;
      var $860=HEAP32[((((5243140)|0))>>2)];
      var $861=$860 | $859;
      HEAP32[((((5243140)|0))>>2)]=$861;
      var $862=$tp;
      var $863=$H17;
      HEAP32[(($863)>>2)]=$862;
      var $864=$H17;
      var $865=$864;
      var $866=$tp;
      var $867=(($866+24)|0);
      HEAP32[(($867)>>2)]=$865;
      var $868=$tp;
      var $869=$tp;
      var $870=(($869+12)|0);
      HEAP32[(($870)>>2)]=$868;
      var $871=$tp;
      var $872=(($871+8)|0);
      HEAP32[(($872)>>2)]=$868;
      label = 189; break;
    case 171: 
      var $874=$H17;
      var $875=HEAP32[(($874)>>2)];
      $T=$875;
      var $876=$psize;
      var $877=$I18;
      var $878=(($877)|0)==31;
      if ($878) { label = 172; break; } else { label = 173; break; }
    case 172: 
      var $887 = 0;label = 174; break;
    case 173: 
      var $881=$I18;
      var $882=$881 >>> 1;
      var $883=((($882)+(8))|0);
      var $884=((($883)-(2))|0);
      var $885=(((31)-($884))|0);
      var $887 = $885;label = 174; break;
    case 174: 
      var $887;
      var $888=$876 << $887;
      $K19=$888;
      label = 175; break;
    case 175: 
      var $890=$T;
      var $891=(($890+4)|0);
      var $892=HEAP32[(($891)>>2)];
      var $893=$892 & -8;
      var $894=$psize;
      var $895=(($893)|0)!=(($894)|0);
      if ($895) { label = 176; break; } else { label = 182; break; }
    case 176: 
      var $897=$K19;
      var $898=$897 >>> 31;
      var $899=$898 & 1;
      var $900=$T;
      var $901=(($900+16)|0);
      var $902=(($901+($899<<2))|0);
      $C=$902;
      var $903=$K19;
      var $904=$903 << 1;
      $K19=$904;
      var $905=$C;
      var $906=HEAP32[(($905)>>2)];
      var $907=(($906)|0)!=0;
      if ($907) { label = 177; break; } else { label = 178; break; }
    case 177: 
      var $909=$C;
      var $910=HEAP32[(($909)>>2)];
      $T=$910;
      label = 181; break;
    case 178: 
      var $912=$C;
      var $913=$912;
      var $914=HEAP32[((((5243152)|0))>>2)];
      var $915=(($913)>>>0) >= (($914)>>>0);
      var $916=(($915)&1);
      var $917=($916);
      var $918=(($917)|0)!=0;
      if ($918) { label = 179; break; } else { label = 180; break; }
    case 179: 
      var $920=$tp;
      var $921=$C;
      HEAP32[(($921)>>2)]=$920;
      var $922=$T;
      var $923=$tp;
      var $924=(($923+24)|0);
      HEAP32[(($924)>>2)]=$922;
      var $925=$tp;
      var $926=$tp;
      var $927=(($926+12)|0);
      HEAP32[(($927)>>2)]=$925;
      var $928=$tp;
      var $929=(($928+8)|0);
      HEAP32[(($929)>>2)]=$925;
      label = 188; break;
    case 180: 
      _abort();
      throw "Reached an unreachable!"
    case 181: 
      label = 187; break;
    case 182: 
      var $933=$T;
      var $934=(($933+8)|0);
      var $935=HEAP32[(($934)>>2)];
      $F20=$935;
      var $936=$T;
      var $937=$936;
      var $938=HEAP32[((((5243152)|0))>>2)];
      var $939=(($937)>>>0) >= (($938)>>>0);
      if ($939) { label = 183; break; } else { var $946 = 0;label = 184; break; }
    case 183: 
      var $941=$F20;
      var $942=$941;
      var $943=HEAP32[((((5243152)|0))>>2)];
      var $944=(($942)>>>0) >= (($943)>>>0);
      var $946 = $944;label = 184; break;
    case 184: 
      var $946;
      var $947=(($946)&1);
      var $948=($947);
      var $949=(($948)|0)!=0;
      if ($949) { label = 185; break; } else { label = 186; break; }
    case 185: 
      var $951=$tp;
      var $952=$F20;
      var $953=(($952+12)|0);
      HEAP32[(($953)>>2)]=$951;
      var $954=$T;
      var $955=(($954+8)|0);
      HEAP32[(($955)>>2)]=$951;
      var $956=$F20;
      var $957=$tp;
      var $958=(($957+8)|0);
      HEAP32[(($958)>>2)]=$956;
      var $959=$T;
      var $960=$tp;
      var $961=(($960+12)|0);
      HEAP32[(($961)>>2)]=$959;
      var $962=$tp;
      var $963=(($962+24)|0);
      HEAP32[(($963)>>2)]=0;
      label = 188; break;
    case 186: 
      _abort();
      throw "Reached an unreachable!"
    case 187: 
      label = 175; break;
    case 188: 
      label = 189; break;
    case 189: 
      var $968=HEAP32[((((5243168)|0))>>2)];
      var $969=((($968)-(1))|0);
      HEAP32[((((5243168)|0))>>2)]=$969;
      var $970=(($969)|0)==0;
      if ($970) { label = 190; break; } else { label = 191; break; }
    case 190: 
      var $972=_release_unused_segments(5243136);
      label = 191; break;
    case 191: 
      label = 192; break;
    case 192: 
      label = 196; break;
    case 193: 
      label = 194; break;
    case 194: 
      label = 195; break;
    case 195: 
      _abort();
      throw "Reached an unreachable!"
    case 196: 
      label = 197; break;
    case 197: 

      return;
    default: assert(0, "bad label: " + label);
  }
}
_free["X"]=1;

function _sys_trim($m, $pad) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $released;
      var $unit;
      var $extra;
      var $sp;
      var $old_br;
      var $rel_br;
      var $new_br;
      $1=$m;
      $2=$pad;
      $released=0;
      var $3=HEAP32[((((5242924)|0))>>2)];
      var $4=(($3)|0)!=0;
      if ($4) { var $9 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $6=_init_mparams();
      var $7=(($6)|0)!=0;
      var $9 = $7;label = 4; break;
    case 4: 
      var $9;
      var $10=(($9)&1);
      var $11=$2;
      var $12=(($11)>>>0) < 4294967232;
      if ($12) { label = 5; break; } else { label = 26; break; }
    case 5: 
      var $14=$1;
      var $15=(($14+24)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=(($16)|0)!=0;
      if ($17) { label = 6; break; } else { label = 26; break; }
    case 6: 
      var $19=$2;
      var $20=((($19)+(40))|0);
      $2=$20;
      var $21=$1;
      var $22=(($21+12)|0);
      var $23=HEAP32[(($22)>>2)];
      var $24=$2;
      var $25=(($23)>>>0) > (($24)>>>0);
      if ($25) { label = 7; break; } else { label = 22; break; }
    case 7: 
      var $27=HEAP32[((((5242932)|0))>>2)];
      $unit=$27;
      var $28=$1;
      var $29=(($28+12)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$2;
      var $32=((($30)-($31))|0);
      var $33=$unit;
      var $34=((($33)-(1))|0);
      var $35=((($32)+($34))|0);
      var $36=$unit;
      var $37=Math.floor(((($35)>>>0))/((($36)>>>0)));
      var $38=((($37)-(1))|0);
      var $39=$unit;
      var $40=((($38)*($39))|0);
      $extra=$40;
      var $41=$1;
      var $42=$1;
      var $43=(($42+24)|0);
      var $44=HEAP32[(($43)>>2)];
      var $45=$44;
      var $46=_segment_holding($41, $45);
      $sp=$46;
      var $47=$sp;
      var $48=(($47+12)|0);
      var $49=HEAP32[(($48)>>2)];
      var $50=$49 & 8;
      var $51=(($50)|0)!=0;
      if ($51) { label = 19; break; } else { label = 8; break; }
    case 8: 
      var $53=$sp;
      var $54=(($53+12)|0);
      var $55=HEAP32[(($54)>>2)];
      var $56=$55 & 0;
      var $57=(($56)|0)!=0;
      if ($57) { label = 9; break; } else { label = 10; break; }
    case 9: 
      label = 18; break;
    case 10: 
      var $60=$extra;
      var $61=(($60)>>>0) >= 2147483647;
      if ($61) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $63=$unit;
      var $64=(((-2147483648)-($63))|0);
      $extra=$64;
      label = 12; break;
    case 12: 
      var $66=_sbrk(0);
      $old_br=$66;
      var $67=$old_br;
      var $68=$sp;
      var $69=(($68)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=$sp;
      var $72=(($71+4)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=(($70+$73)|0);
      var $75=(($67)|0)==(($74)|0);
      if ($75) { label = 13; break; } else { label = 17; break; }
    case 13: 
      var $77=$extra;
      var $78=(((-$77))|0);
      var $79=_sbrk($78);
      $rel_br=$79;
      var $80=_sbrk(0);
      $new_br=$80;
      var $81=$rel_br;
      var $82=(($81)|0)!=-1;
      if ($82) { label = 14; break; } else { label = 16; break; }
    case 14: 
      var $84=$new_br;
      var $85=$old_br;
      var $86=(($84)>>>0) < (($85)>>>0);
      if ($86) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $88=$old_br;
      var $89=$new_br;
      var $90=$88;
      var $91=$89;
      var $92=((($90)-($91))|0);
      $released=$92;
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      label = 18; break;
    case 18: 
      label = 19; break;
    case 19: 
      var $97=$released;
      var $98=(($97)|0)!=0;
      if ($98) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $100=$released;
      var $101=$sp;
      var $102=(($101+4)|0);
      var $103=HEAP32[(($102)>>2)];
      var $104=((($103)-($100))|0);
      HEAP32[(($102)>>2)]=$104;
      var $105=$released;
      var $106=$1;
      var $107=(($106+432)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=((($108)-($105))|0);
      HEAP32[(($107)>>2)]=$109;
      var $110=$1;
      var $111=$1;
      var $112=(($111+24)|0);
      var $113=HEAP32[(($112)>>2)];
      var $114=$1;
      var $115=(($114+12)|0);
      var $116=HEAP32[(($115)>>2)];
      var $117=$released;
      var $118=((($116)-($117))|0);
      _init_top($110, $113, $118);
      label = 21; break;
    case 21: 
      label = 22; break;
    case 22: 
      var $121=$released;
      var $122=(($121)|0)==0;
      if ($122) { label = 23; break; } else { label = 25; break; }
    case 23: 
      var $124=$1;
      var $125=(($124+12)|0);
      var $126=HEAP32[(($125)>>2)];
      var $127=$1;
      var $128=(($127+28)|0);
      var $129=HEAP32[(($128)>>2)];
      var $130=(($126)>>>0) > (($129)>>>0);
      if ($130) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $132=$1;
      var $133=(($132+28)|0);
      HEAP32[(($133)>>2)]=-1;
      label = 25; break;
    case 25: 
      label = 26; break;
    case 26: 
      var $136=$released;
      var $137=(($136)|0)!=0;
      var $138=$137 ? 1 : 0;

      return $138;
    default: assert(0, "bad label: " + label);
  }
}
_sys_trim["X"]=1;

function _calloc($n_elements, $elem_size) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $mem;
      var $req;
      $1=$n_elements;
      $2=$elem_size;
      $req=0;
      var $3=$1;
      var $4=(($3)|0)!=0;
      if ($4) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $6=$1;
      var $7=$2;
      var $8=((($6)*($7))|0);
      $req=$8;
      var $9=$1;
      var $10=$2;
      var $11=$9 | $10;
      var $12=$11 & -65536;
      var $13=(($12)|0)!=0;
      if ($13) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $15=$req;
      var $16=$1;
      var $17=Math.floor(((($15)>>>0))/((($16)>>>0)));
      var $18=$2;
      var $19=(($17)|0)!=(($18)|0);
      if ($19) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $req=-1;
      label = 6; break;
    case 6: 
      label = 7; break;
    case 7: 
      var $23=$req;
      var $24=_malloc($23);
      $mem=$24;
      var $25=$mem;
      var $26=(($25)|0)!=0;
      if ($26) { label = 8; break; } else { label = 10; break; }
    case 8: 
      var $28=$mem;
      var $29=((($28)-(8))|0);
      var $30=$29;
      var $31=(($30+4)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=$32 & 3;
      var $34=(($33)|0)==0;
      if ($34) { label = 10; break; } else { label = 9; break; }
    case 9: 
      var $36=$mem;
      var $37=$req;
      _memset($36, 0, $37, 1);
      label = 10; break;
    case 10: 
      var $39=$mem;

      return $39;
    default: assert(0, "bad label: " + label);
  }
}
Module["_calloc"] = _calloc;

function _realloc($oldmem, $bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $m;
      $2=$oldmem;
      $3=$bytes;
      var $4=$2;
      var $5=(($4)|0)==0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $7=$3;
      var $8=_malloc($7);
      $1=$8;
      label = 5; break;
    case 4: 
      $m=5243136;
      var $10=$m;
      var $11=$2;
      var $12=$3;
      var $13=_internal_realloc($10, $11, $12);
      $1=$13;
      label = 5; break;
    case 5: 
      var $15=$1;

      return $15;
    default: assert(0, "bad label: " + label);
  }
}


function _release_unused_segments($m) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $released;
      var $nsegs;
      var $pred;
      var $sp;
      var $base;
      var $size;
      var $next;
      var $p;
      var $psize;
      var $tp;
      var $XP;
      var $R;
      var $F;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $H1;
      var $I;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K2;
      var $C;
      var $F3;
      $1=$m;
      $released=0;
      $nsegs=0;
      var $2=$1;
      var $3=(($2+444)|0);
      $pred=$3;
      var $4=$pred;
      var $5=(($4+8)|0);
      var $6=HEAP32[(($5)>>2)];
      $sp=$6;
      label = 3; break;
    case 3: 
      var $8=$sp;
      var $9=(($8)|0)!=0;
      if ($9) { label = 4; break; } else { label = 88; break; }
    case 4: 
      var $11=$sp;
      var $12=(($11)|0);
      var $13=HEAP32[(($12)>>2)];
      $base=$13;
      var $14=$sp;
      var $15=(($14+4)|0);
      var $16=HEAP32[(($15)>>2)];
      $size=$16;
      var $17=$sp;
      var $18=(($17+8)|0);
      var $19=HEAP32[(($18)>>2)];
      $next=$19;
      var $20=$nsegs;
      var $21=((($20)+(1))|0);
      $nsegs=$21;
      var $22=$sp;
      var $23=(($22+12)|0);
      var $24=HEAP32[(($23)>>2)];
      var $25=$24 & 0;
      var $26=(($25)|0)!=0;
      if ($26) { label = 5; break; } else { label = 87; break; }
    case 5: 
      var $28=$sp;
      var $29=(($28+12)|0);
      var $30=HEAP32[(($29)>>2)];
      var $31=$30 & 8;
      var $32=(($31)|0)!=0;
      if ($32) { label = 87; break; } else { label = 6; break; }
    case 6: 
      var $34=$base;
      var $35=$base;
      var $36=(($35+8)|0);
      var $37=$36;
      var $38=$37 & 7;
      var $39=(($38)|0)==0;
      if ($39) { label = 7; break; } else { label = 8; break; }
    case 7: 
      var $49 = 0;label = 9; break;
    case 8: 
      var $42=$base;
      var $43=(($42+8)|0);
      var $44=$43;
      var $45=$44 & 7;
      var $46=(((8)-($45))|0);
      var $47=$46 & 7;
      var $49 = $47;label = 9; break;
    case 9: 
      var $49;
      var $50=(($34+$49)|0);
      var $51=$50;
      $p=$51;
      var $52=$p;
      var $53=(($52+4)|0);
      var $54=HEAP32[(($53)>>2)];
      var $55=$54 & -8;
      $psize=$55;
      var $56=$p;
      var $57=(($56+4)|0);
      var $58=HEAP32[(($57)>>2)];
      var $59=$58 & 3;
      var $60=(($59)|0)!=1;
      if ($60) { label = 86; break; } else { label = 10; break; }
    case 10: 
      var $62=$p;
      var $63=$62;
      var $64=$psize;
      var $65=(($63+$64)|0);
      var $66=$base;
      var $67=$size;
      var $68=(($66+$67)|0);
      var $69=((($68)-(40))|0);
      var $70=(($65)>>>0) >= (($69)>>>0);
      if ($70) { label = 11; break; } else { label = 86; break; }
    case 11: 
      var $72=$p;
      var $73=$72;
      $tp=$73;
      var $74=$p;
      var $75=$1;
      var $76=(($75+20)|0);
      var $77=HEAP32[(($76)>>2)];
      var $78=(($74)|0)==(($77)|0);
      if ($78) { label = 12; break; } else { label = 13; break; }
    case 12: 
      var $80=$1;
      var $81=(($80+20)|0);
      HEAP32[(($81)>>2)]=0;
      var $82=$1;
      var $83=(($82+8)|0);
      HEAP32[(($83)>>2)]=0;
      label = 59; break;
    case 13: 
      var $85=$tp;
      var $86=(($85+24)|0);
      var $87=HEAP32[(($86)>>2)];
      $XP=$87;
      var $88=$tp;
      var $89=(($88+12)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$tp;
      var $92=(($90)|0)!=(($91)|0);
      if ($92) { label = 14; break; } else { label = 18; break; }
    case 14: 
      var $94=$tp;
      var $95=(($94+8)|0);
      var $96=HEAP32[(($95)>>2)];
      $F=$96;
      var $97=$tp;
      var $98=(($97+12)|0);
      var $99=HEAP32[(($98)>>2)];
      $R=$99;
      var $100=$F;
      var $101=$100;
      var $102=$1;
      var $103=(($102+16)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=(($101)>>>0) >= (($104)>>>0);
      var $106=(($105)&1);
      var $107=($106);
      var $108=(($107)|0)!=0;
      if ($108) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $110=$R;
      var $111=$F;
      var $112=(($111+12)|0);
      HEAP32[(($112)>>2)]=$110;
      var $113=$F;
      var $114=$R;
      var $115=(($114+8)|0);
      HEAP32[(($115)>>2)]=$113;
      label = 17; break;
    case 16: 
      _abort();
      throw "Reached an unreachable!"
    case 17: 
      label = 30; break;
    case 18: 
      var $119=$tp;
      var $120=(($119+16)|0);
      var $121=(($120+4)|0);
      $RP=$121;
      var $122=HEAP32[(($121)>>2)];
      $R=$122;
      var $123=(($122)|0)!=0;
      if ($123) { label = 20; break; } else { label = 19; break; }
    case 19: 
      var $125=$tp;
      var $126=(($125+16)|0);
      var $127=(($126)|0);
      $RP=$127;
      var $128=HEAP32[(($127)>>2)];
      $R=$128;
      var $129=(($128)|0)!=0;
      if ($129) { label = 20; break; } else { label = 29; break; }
    case 20: 
      label = 21; break;
    case 21: 
      var $132=$R;
      var $133=(($132+16)|0);
      var $134=(($133+4)|0);
      $CP=$134;
      var $135=HEAP32[(($134)>>2)];
      var $136=(($135)|0)!=0;
      if ($136) { var $144 = 1;label = 23; break; } else { label = 22; break; }
    case 22: 
      var $138=$R;
      var $139=(($138+16)|0);
      var $140=(($139)|0);
      $CP=$140;
      var $141=HEAP32[(($140)>>2)];
      var $142=(($141)|0)!=0;
      var $144 = $142;label = 23; break;
    case 23: 
      var $144;
      if ($144) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $146=$CP;
      $RP=$146;
      var $147=HEAP32[(($146)>>2)];
      $R=$147;
      label = 21; break;
    case 25: 
      var $149=$RP;
      var $150=$149;
      var $151=$1;
      var $152=(($151+16)|0);
      var $153=HEAP32[(($152)>>2)];
      var $154=(($150)>>>0) >= (($153)>>>0);
      var $155=(($154)&1);
      var $156=($155);
      var $157=(($156)|0)!=0;
      if ($157) { label = 26; break; } else { label = 27; break; }
    case 26: 
      var $159=$RP;
      HEAP32[(($159)>>2)]=0;
      label = 28; break;
    case 27: 
      _abort();
      throw "Reached an unreachable!"
    case 28: 
      label = 29; break;
    case 29: 
      label = 30; break;
    case 30: 
      var $164=$XP;
      var $165=(($164)|0)!=0;
      if ($165) { label = 31; break; } else { label = 58; break; }
    case 31: 
      var $167=$tp;
      var $168=(($167+28)|0);
      var $169=HEAP32[(($168)>>2)];
      var $170=$1;
      var $171=(($170+304)|0);
      var $172=(($171+($169<<2))|0);
      $H=$172;
      var $173=$tp;
      var $174=$H;
      var $175=HEAP32[(($174)>>2)];
      var $176=(($173)|0)==(($175)|0);
      if ($176) { label = 32; break; } else { label = 35; break; }
    case 32: 
      var $178=$R;
      var $179=$H;
      HEAP32[(($179)>>2)]=$178;
      var $180=(($178)|0)==0;
      if ($180) { label = 33; break; } else { label = 34; break; }
    case 33: 
      var $182=$tp;
      var $183=(($182+28)|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=1 << $184;
      var $186=$185 ^ -1;
      var $187=$1;
      var $188=(($187+4)|0);
      var $189=HEAP32[(($188)>>2)];
      var $190=$189 & $186;
      HEAP32[(($188)>>2)]=$190;
      label = 34; break;
    case 34: 
      label = 42; break;
    case 35: 
      var $193=$XP;
      var $194=$193;
      var $195=$1;
      var $196=(($195+16)|0);
      var $197=HEAP32[(($196)>>2)];
      var $198=(($194)>>>0) >= (($197)>>>0);
      var $199=(($198)&1);
      var $200=($199);
      var $201=(($200)|0)!=0;
      if ($201) { label = 36; break; } else { label = 40; break; }
    case 36: 
      var $203=$XP;
      var $204=(($203+16)|0);
      var $205=(($204)|0);
      var $206=HEAP32[(($205)>>2)];
      var $207=$tp;
      var $208=(($206)|0)==(($207)|0);
      if ($208) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $210=$R;
      var $211=$XP;
      var $212=(($211+16)|0);
      var $213=(($212)|0);
      HEAP32[(($213)>>2)]=$210;
      label = 39; break;
    case 38: 
      var $215=$R;
      var $216=$XP;
      var $217=(($216+16)|0);
      var $218=(($217+4)|0);
      HEAP32[(($218)>>2)]=$215;
      label = 39; break;
    case 39: 
      label = 41; break;
    case 40: 
      _abort();
      throw "Reached an unreachable!"
    case 41: 
      label = 42; break;
    case 42: 
      var $223=$R;
      var $224=(($223)|0)!=0;
      if ($224) { label = 43; break; } else { label = 57; break; }
    case 43: 
      var $226=$R;
      var $227=$226;
      var $228=$1;
      var $229=(($228+16)|0);
      var $230=HEAP32[(($229)>>2)];
      var $231=(($227)>>>0) >= (($230)>>>0);
      var $232=(($231)&1);
      var $233=($232);
      var $234=(($233)|0)!=0;
      if ($234) { label = 44; break; } else { label = 55; break; }
    case 44: 
      var $236=$XP;
      var $237=$R;
      var $238=(($237+24)|0);
      HEAP32[(($238)>>2)]=$236;
      var $239=$tp;
      var $240=(($239+16)|0);
      var $241=(($240)|0);
      var $242=HEAP32[(($241)>>2)];
      $C0=$242;
      var $243=(($242)|0)!=0;
      if ($243) { label = 45; break; } else { label = 49; break; }
    case 45: 
      var $245=$C0;
      var $246=$245;
      var $247=$1;
      var $248=(($247+16)|0);
      var $249=HEAP32[(($248)>>2)];
      var $250=(($246)>>>0) >= (($249)>>>0);
      var $251=(($250)&1);
      var $252=($251);
      var $253=(($252)|0)!=0;
      if ($253) { label = 46; break; } else { label = 47; break; }
    case 46: 
      var $255=$C0;
      var $256=$R;
      var $257=(($256+16)|0);
      var $258=(($257)|0);
      HEAP32[(($258)>>2)]=$255;
      var $259=$R;
      var $260=$C0;
      var $261=(($260+24)|0);
      HEAP32[(($261)>>2)]=$259;
      label = 48; break;
    case 47: 
      _abort();
      throw "Reached an unreachable!"
    case 48: 
      label = 49; break;
    case 49: 
      var $265=$tp;
      var $266=(($265+16)|0);
      var $267=(($266+4)|0);
      var $268=HEAP32[(($267)>>2)];
      $C1=$268;
      var $269=(($268)|0)!=0;
      if ($269) { label = 50; break; } else { label = 54; break; }
    case 50: 
      var $271=$C1;
      var $272=$271;
      var $273=$1;
      var $274=(($273+16)|0);
      var $275=HEAP32[(($274)>>2)];
      var $276=(($272)>>>0) >= (($275)>>>0);
      var $277=(($276)&1);
      var $278=($277);
      var $279=(($278)|0)!=0;
      if ($279) { label = 51; break; } else { label = 52; break; }
    case 51: 
      var $281=$C1;
      var $282=$R;
      var $283=(($282+16)|0);
      var $284=(($283+4)|0);
      HEAP32[(($284)>>2)]=$281;
      var $285=$R;
      var $286=$C1;
      var $287=(($286+24)|0);
      HEAP32[(($287)>>2)]=$285;
      label = 53; break;
    case 52: 
      _abort();
      throw "Reached an unreachable!"
    case 53: 
      label = 54; break;
    case 54: 
      label = 56; break;
    case 55: 
      _abort();
      throw "Reached an unreachable!"
    case 56: 
      label = 57; break;
    case 57: 
      label = 58; break;
    case 58: 
      label = 59; break;
    case 59: 
      var $296=$psize;
      var $297=$296 >>> 8;
      $X=$297;
      var $298=$X;
      var $299=(($298)|0)==0;
      if ($299) { label = 60; break; } else { label = 61; break; }
    case 60: 
      $I=0;
      label = 65; break;
    case 61: 
      var $302=$X;
      var $303=(($302)>>>0) > 65535;
      if ($303) { label = 62; break; } else { label = 63; break; }
    case 62: 
      $I=31;
      label = 64; break;
    case 63: 
      var $306=$X;
      $Y=$306;
      var $307=$Y;
      var $308=((($307)-(256))|0);
      var $309=$308 >>> 16;
      var $310=$309 & 8;
      $N=$310;
      var $311=$N;
      var $312=$Y;
      var $313=$312 << $311;
      $Y=$313;
      var $314=((($313)-(4096))|0);
      var $315=$314 >>> 16;
      var $316=$315 & 4;
      $K=$316;
      var $317=$K;
      var $318=$N;
      var $319=((($318)+($317))|0);
      $N=$319;
      var $320=$K;
      var $321=$Y;
      var $322=$321 << $320;
      $Y=$322;
      var $323=((($322)-(16384))|0);
      var $324=$323 >>> 16;
      var $325=$324 & 2;
      $K=$325;
      var $326=$N;
      var $327=((($326)+($325))|0);
      $N=$327;
      var $328=$N;
      var $329=(((14)-($328))|0);
      var $330=$K;
      var $331=$Y;
      var $332=$331 << $330;
      $Y=$332;
      var $333=$332 >>> 15;
      var $334=((($329)+($333))|0);
      $K=$334;
      var $335=$K;
      var $336=$335 << 1;
      var $337=$psize;
      var $338=$K;
      var $339=((($338)+(7))|0);
      var $340=$337 >>> (($339)>>>0);
      var $341=$340 & 1;
      var $342=((($336)+($341))|0);
      $I=$342;
      label = 64; break;
    case 64: 
      label = 65; break;
    case 65: 
      var $345=$I;
      var $346=$1;
      var $347=(($346+304)|0);
      var $348=(($347+($345<<2))|0);
      $H1=$348;
      var $349=$I;
      var $350=$tp;
      var $351=(($350+28)|0);
      HEAP32[(($351)>>2)]=$349;
      var $352=$tp;
      var $353=(($352+16)|0);
      var $354=(($353+4)|0);
      HEAP32[(($354)>>2)]=0;
      var $355=$tp;
      var $356=(($355+16)|0);
      var $357=(($356)|0);
      HEAP32[(($357)>>2)]=0;
      var $358=$1;
      var $359=(($358+4)|0);
      var $360=HEAP32[(($359)>>2)];
      var $361=$I;
      var $362=1 << $361;
      var $363=$360 & $362;
      var $364=(($363)|0)!=0;
      if ($364) { label = 67; break; } else { label = 66; break; }
    case 66: 
      var $366=$I;
      var $367=1 << $366;
      var $368=$1;
      var $369=(($368+4)|0);
      var $370=HEAP32[(($369)>>2)];
      var $371=$370 | $367;
      HEAP32[(($369)>>2)]=$371;
      var $372=$tp;
      var $373=$H1;
      HEAP32[(($373)>>2)]=$372;
      var $374=$H1;
      var $375=$374;
      var $376=$tp;
      var $377=(($376+24)|0);
      HEAP32[(($377)>>2)]=$375;
      var $378=$tp;
      var $379=$tp;
      var $380=(($379+12)|0);
      HEAP32[(($380)>>2)]=$378;
      var $381=$tp;
      var $382=(($381+8)|0);
      HEAP32[(($382)>>2)]=$378;
      label = 85; break;
    case 67: 
      var $384=$H1;
      var $385=HEAP32[(($384)>>2)];
      $T=$385;
      var $386=$psize;
      var $387=$I;
      var $388=(($387)|0)==31;
      if ($388) { label = 68; break; } else { label = 69; break; }
    case 68: 
      var $397 = 0;label = 70; break;
    case 69: 
      var $391=$I;
      var $392=$391 >>> 1;
      var $393=((($392)+(8))|0);
      var $394=((($393)-(2))|0);
      var $395=(((31)-($394))|0);
      var $397 = $395;label = 70; break;
    case 70: 
      var $397;
      var $398=$386 << $397;
      $K2=$398;
      label = 71; break;
    case 71: 
      var $400=$T;
      var $401=(($400+4)|0);
      var $402=HEAP32[(($401)>>2)];
      var $403=$402 & -8;
      var $404=$psize;
      var $405=(($403)|0)!=(($404)|0);
      if ($405) { label = 72; break; } else { label = 78; break; }
    case 72: 
      var $407=$K2;
      var $408=$407 >>> 31;
      var $409=$408 & 1;
      var $410=$T;
      var $411=(($410+16)|0);
      var $412=(($411+($409<<2))|0);
      $C=$412;
      var $413=$K2;
      var $414=$413 << 1;
      $K2=$414;
      var $415=$C;
      var $416=HEAP32[(($415)>>2)];
      var $417=(($416)|0)!=0;
      if ($417) { label = 73; break; } else { label = 74; break; }
    case 73: 
      var $419=$C;
      var $420=HEAP32[(($419)>>2)];
      $T=$420;
      label = 77; break;
    case 74: 
      var $422=$C;
      var $423=$422;
      var $424=$1;
      var $425=(($424+16)|0);
      var $426=HEAP32[(($425)>>2)];
      var $427=(($423)>>>0) >= (($426)>>>0);
      var $428=(($427)&1);
      var $429=($428);
      var $430=(($429)|0)!=0;
      if ($430) { label = 75; break; } else { label = 76; break; }
    case 75: 
      var $432=$tp;
      var $433=$C;
      HEAP32[(($433)>>2)]=$432;
      var $434=$T;
      var $435=$tp;
      var $436=(($435+24)|0);
      HEAP32[(($436)>>2)]=$434;
      var $437=$tp;
      var $438=$tp;
      var $439=(($438+12)|0);
      HEAP32[(($439)>>2)]=$437;
      var $440=$tp;
      var $441=(($440+8)|0);
      HEAP32[(($441)>>2)]=$437;
      label = 84; break;
    case 76: 
      _abort();
      throw "Reached an unreachable!"
    case 77: 
      label = 83; break;
    case 78: 
      var $445=$T;
      var $446=(($445+8)|0);
      var $447=HEAP32[(($446)>>2)];
      $F3=$447;
      var $448=$T;
      var $449=$448;
      var $450=$1;
      var $451=(($450+16)|0);
      var $452=HEAP32[(($451)>>2)];
      var $453=(($449)>>>0) >= (($452)>>>0);
      if ($453) { label = 79; break; } else { var $462 = 0;label = 80; break; }
    case 79: 
      var $455=$F3;
      var $456=$455;
      var $457=$1;
      var $458=(($457+16)|0);
      var $459=HEAP32[(($458)>>2)];
      var $460=(($456)>>>0) >= (($459)>>>0);
      var $462 = $460;label = 80; break;
    case 80: 
      var $462;
      var $463=(($462)&1);
      var $464=($463);
      var $465=(($464)|0)!=0;
      if ($465) { label = 81; break; } else { label = 82; break; }
    case 81: 
      var $467=$tp;
      var $468=$F3;
      var $469=(($468+12)|0);
      HEAP32[(($469)>>2)]=$467;
      var $470=$T;
      var $471=(($470+8)|0);
      HEAP32[(($471)>>2)]=$467;
      var $472=$F3;
      var $473=$tp;
      var $474=(($473+8)|0);
      HEAP32[(($474)>>2)]=$472;
      var $475=$T;
      var $476=$tp;
      var $477=(($476+12)|0);
      HEAP32[(($477)>>2)]=$475;
      var $478=$tp;
      var $479=(($478+24)|0);
      HEAP32[(($479)>>2)]=0;
      label = 84; break;
    case 82: 
      _abort();
      throw "Reached an unreachable!"
    case 83: 
      label = 71; break;
    case 84: 
      label = 85; break;
    case 85: 
      label = 86; break;
    case 86: 
      label = 87; break;
    case 87: 
      var $486=$sp;
      $pred=$486;
      var $487=$next;
      $sp=$487;
      label = 3; break;
    case 88: 
      var $489=$nsegs;
      var $490=(($489)>>>0) > 4294967295;
      if ($490) { label = 89; break; } else { label = 90; break; }
    case 89: 
      var $492=$nsegs;
      var $495 = $492;label = 91; break;
    case 90: 
      var $495 = -1;label = 91; break;
    case 91: 
      var $495;
      var $496=$1;
      var $497=(($496+32)|0);
      HEAP32[(($497)>>2)]=$495;
      var $498=$released;

      return $498;
    default: assert(0, "bad label: " + label);
  }
}
_release_unused_segments["X"]=1;

function _memalign($alignment, $bytes) {
  var label = 0;


  var $1;
  var $2;
  $1=$alignment;
  $2=$bytes;
  var $3=$1;
  var $4=$2;
  var $5=_internal_memalign(5243136, $3, $4);

  return $5;
}


function _internal_memalign($m, $alignment, $bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $a;
      var $nb;
      var $req;
      var $mem;
      var $leader;
      var $trailer;
      var $p;
      var $br;
      var $pos;
      var $newp;
      var $leadsize;
      var $newsize;
      var $size;
      var $remainder_size;
      var $remainder;
      $2=$m;
      $3=$alignment;
      $4=$bytes;
      var $5=$3;
      var $6=(($5)>>>0) <= 8;
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $8=$4;
      var $9=_malloc($8);
      $1=$9;
      label = 38; break;
    case 4: 
      var $11=$3;
      var $12=(($11)>>>0) < 16;
      if ($12) { label = 5; break; } else { label = 6; break; }
    case 5: 
      $3=16;
      label = 6; break;
    case 6: 
      var $15=$3;
      var $16=$3;
      var $17=((($16)-(1))|0);
      var $18=$15 & $17;
      var $19=(($18)|0)!=0;
      if ($19) { label = 7; break; } else { label = 11; break; }
    case 7: 
      $a=16;
      label = 8; break;
    case 8: 
      var $22=$a;
      var $23=$3;
      var $24=(($22)>>>0) < (($23)>>>0);
      if ($24) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $26=$a;
      var $27=$26 << 1;
      $a=$27;
      label = 8; break;
    case 10: 
      var $29=$a;
      $3=$29;
      label = 11; break;
    case 11: 
      var $31=$4;
      var $32=$3;
      var $33=(((-64)-($32))|0);
      var $34=(($31)>>>0) >= (($33)>>>0);
      if ($34) { label = 12; break; } else { label = 15; break; }
    case 12: 
      var $36=$2;
      var $37=(($36)|0)!=0;
      if ($37) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $39=___errno_location();
      HEAP32[(($39)>>2)]=12;
      label = 14; break;
    case 14: 
      label = 37; break;
    case 15: 
      var $42=$4;
      var $43=(($42)>>>0) < 11;
      if ($43) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $51 = 16;label = 18; break;
    case 17: 
      var $46=$4;
      var $47=((($46)+(4))|0);
      var $48=((($47)+(7))|0);
      var $49=$48 & -8;
      var $51 = $49;label = 18; break;
    case 18: 
      var $51;
      $nb=$51;
      var $52=$nb;
      var $53=$3;
      var $54=((($52)+($53))|0);
      var $55=((($54)+(16))|0);
      var $56=((($55)-(4))|0);
      $req=$56;
      var $57=$req;
      var $58=_malloc($57);
      $mem=$58;
      var $59=$mem;
      var $60=(($59)|0)!=0;
      if ($60) { label = 19; break; } else { label = 36; break; }
    case 19: 
      $leader=0;
      $trailer=0;
      var $62=$mem;
      var $63=((($62)-(8))|0);
      var $64=$63;
      $p=$64;
      var $65=$mem;
      var $66=$65;
      var $67=$3;
      var $68=((($66)>>>0))%((($67)>>>0));
      var $69=(($68)|0)!=0;
      if ($69) { label = 20; break; } else { label = 27; break; }
    case 20: 
      var $71=$mem;
      var $72=$3;
      var $73=(($71+$72)|0);
      var $74=((($73)-(1))|0);
      var $75=$74;
      var $76=$3;
      var $77=(((-$76))|0);
      var $78=$75 & $77;
      var $79=$78;
      var $80=((($79)-(8))|0);
      var $81=$80;
      var $82=$81;
      $br=$82;
      var $83=$br;
      var $84=$p;
      var $85=$84;
      var $86=$83;
      var $87=$85;
      var $88=((($86)-($87))|0);
      var $89=(($88)>>>0) >= 16;
      if ($89) { label = 21; break; } else { label = 22; break; }
    case 21: 
      var $91=$br;
      var $97 = $91;label = 23; break;
    case 22: 
      var $93=$br;
      var $94=$3;
      var $95=(($93+$94)|0);
      var $97 = $95;label = 23; break;
    case 23: 
      var $97;
      $pos=$97;
      var $98=$pos;
      var $99=$98;
      $newp=$99;
      var $100=$pos;
      var $101=$p;
      var $102=$101;
      var $103=$100;
      var $104=$102;
      var $105=((($103)-($104))|0);
      $leadsize=$105;
      var $106=$p;
      var $107=(($106+4)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=$108 & -8;
      var $110=$leadsize;
      var $111=((($109)-($110))|0);
      $newsize=$111;
      var $112=$p;
      var $113=(($112+4)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$114 & 3;
      var $116=(($115)|0)==0;
      if ($116) { label = 24; break; } else { label = 25; break; }
    case 24: 
      var $118=$p;
      var $119=(($118)|0);
      var $120=HEAP32[(($119)>>2)];
      var $121=$leadsize;
      var $122=((($120)+($121))|0);
      var $123=$newp;
      var $124=(($123)|0);
      HEAP32[(($124)>>2)]=$122;
      var $125=$newsize;
      var $126=$newp;
      var $127=(($126+4)|0);
      HEAP32[(($127)>>2)]=$125;
      label = 26; break;
    case 25: 
      var $129=$newp;
      var $130=(($129+4)|0);
      var $131=HEAP32[(($130)>>2)];
      var $132=$131 & 1;
      var $133=$newsize;
      var $134=$132 | $133;
      var $135=$134 | 2;
      var $136=$newp;
      var $137=(($136+4)|0);
      HEAP32[(($137)>>2)]=$135;
      var $138=$newp;
      var $139=$138;
      var $140=$newsize;
      var $141=(($139+$140)|0);
      var $142=$141;
      var $143=(($142+4)|0);
      var $144=HEAP32[(($143)>>2)];
      var $145=$144 | 1;
      HEAP32[(($143)>>2)]=$145;
      var $146=$p;
      var $147=(($146+4)|0);
      var $148=HEAP32[(($147)>>2)];
      var $149=$148 & 1;
      var $150=$leadsize;
      var $151=$149 | $150;
      var $152=$151 | 2;
      var $153=$p;
      var $154=(($153+4)|0);
      HEAP32[(($154)>>2)]=$152;
      var $155=$p;
      var $156=$155;
      var $157=$leadsize;
      var $158=(($156+$157)|0);
      var $159=$158;
      var $160=(($159+4)|0);
      var $161=HEAP32[(($160)>>2)];
      var $162=$161 | 1;
      HEAP32[(($160)>>2)]=$162;
      var $163=$p;
      var $164=$163;
      var $165=(($164+8)|0);
      $leader=$165;
      label = 26; break;
    case 26: 
      var $167=$newp;
      $p=$167;
      label = 27; break;
    case 27: 
      var $169=$p;
      var $170=(($169+4)|0);
      var $171=HEAP32[(($170)>>2)];
      var $172=$171 & 3;
      var $173=(($172)|0)==0;
      if ($173) { label = 31; break; } else { label = 28; break; }
    case 28: 
      var $175=$p;
      var $176=(($175+4)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=$177 & -8;
      $size=$178;
      var $179=$size;
      var $180=$nb;
      var $181=((($180)+(16))|0);
      var $182=(($179)>>>0) > (($181)>>>0);
      if ($182) { label = 29; break; } else { label = 30; break; }
    case 29: 
      var $184=$size;
      var $185=$nb;
      var $186=((($184)-($185))|0);
      $remainder_size=$186;
      var $187=$p;
      var $188=$187;
      var $189=$nb;
      var $190=(($188+$189)|0);
      var $191=$190;
      $remainder=$191;
      var $192=$p;
      var $193=(($192+4)|0);
      var $194=HEAP32[(($193)>>2)];
      var $195=$194 & 1;
      var $196=$nb;
      var $197=$195 | $196;
      var $198=$197 | 2;
      var $199=$p;
      var $200=(($199+4)|0);
      HEAP32[(($200)>>2)]=$198;
      var $201=$p;
      var $202=$201;
      var $203=$nb;
      var $204=(($202+$203)|0);
      var $205=$204;
      var $206=(($205+4)|0);
      var $207=HEAP32[(($206)>>2)];
      var $208=$207 | 1;
      HEAP32[(($206)>>2)]=$208;
      var $209=$remainder;
      var $210=(($209+4)|0);
      var $211=HEAP32[(($210)>>2)];
      var $212=$211 & 1;
      var $213=$remainder_size;
      var $214=$212 | $213;
      var $215=$214 | 2;
      var $216=$remainder;
      var $217=(($216+4)|0);
      HEAP32[(($217)>>2)]=$215;
      var $218=$remainder;
      var $219=$218;
      var $220=$remainder_size;
      var $221=(($219+$220)|0);
      var $222=$221;
      var $223=(($222+4)|0);
      var $224=HEAP32[(($223)>>2)];
      var $225=$224 | 1;
      HEAP32[(($223)>>2)]=$225;
      var $226=$remainder;
      var $227=$226;
      var $228=(($227+8)|0);
      $trailer=$228;
      label = 30; break;
    case 30: 
      label = 31; break;
    case 31: 
      var $231=$leader;
      var $232=(($231)|0)!=0;
      if ($232) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $234=$leader;
      _free($234);
      label = 33; break;
    case 33: 
      var $236=$trailer;
      var $237=(($236)|0)!=0;
      if ($237) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $239=$trailer;
      _free($239);
      label = 35; break;
    case 35: 
      var $241=$p;
      var $242=$241;
      var $243=(($242+8)|0);
      $1=$243;
      label = 38; break;
    case 36: 
      label = 37; break;
    case 37: 
      $1=0;
      label = 38; break;
    case 38: 
      var $247=$1;

      return $247;
    default: assert(0, "bad label: " + label);
  }
}
_internal_memalign["X"]=1;

function _independent_calloc($n_elements, $elem_size, $chunks) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 4)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);

  var $1;
  var $2;
  var $3;
  var $sz=__stackBase__;
  $1=$n_elements;
  $2=$elem_size;
  $3=$chunks;
  var $4=$2;
  HEAP32[(($sz)>>2)]=$4;
  var $5=$1;
  var $6=$3;
  var $7=_ialloc(5243136, $5, $sz, 3, $6);
  STACKTOP = __stackBase__;
  return $7;
}


function _internal_realloc($m, $oldmem, $bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $oldp;
      var $oldsize;
      var $next;
      var $newp;
      var $extra;
      var $nb;
      var $rsize;
      var $remainder;
      var $newsize;
      var $newtopsize;
      var $newtop;
      var $newmem;
      var $oc;
      $2=$m;
      $3=$oldmem;
      $4=$bytes;
      var $5=$4;
      var $6=(($5)>>>0) >= 4294967232;
      if ($6) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $8=___errno_location();
      HEAP32[(($8)>>2)]=12;
      $1=0;
      label = 35; break;
    case 4: 
      var $10=$3;
      var $11=((($10)-(8))|0);
      var $12=$11;
      $oldp=$12;
      var $13=$oldp;
      var $14=(($13+4)|0);
      var $15=HEAP32[(($14)>>2)];
      var $16=$15 & -8;
      $oldsize=$16;
      var $17=$oldp;
      var $18=$17;
      var $19=$oldsize;
      var $20=(($18+$19)|0);
      var $21=$20;
      $next=$21;
      $newp=0;
      $extra=0;
      var $22=$oldp;
      var $23=$22;
      var $24=$2;
      var $25=(($24+16)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=(($23)>>>0) >= (($26)>>>0);
      if ($27) { label = 5; break; } else { var $47 = 0;label = 8; break; }
    case 5: 
      var $29=$oldp;
      var $30=(($29+4)|0);
      var $31=HEAP32[(($30)>>2)];
      var $32=$31 & 3;
      var $33=(($32)|0)!=1;
      if ($33) { label = 6; break; } else { var $47 = 0;label = 8; break; }
    case 6: 
      var $35=$oldp;
      var $36=$35;
      var $37=$next;
      var $38=$37;
      var $39=(($36)>>>0) < (($38)>>>0);
      if ($39) { label = 7; break; } else { var $47 = 0;label = 8; break; }
    case 7: 
      var $41=$next;
      var $42=(($41+4)|0);
      var $43=HEAP32[(($42)>>2)];
      var $44=$43 & 1;
      var $45=(($44)|0)!=0;
      var $47 = $45;label = 8; break;
    case 8: 
      var $47;
      var $48=(($47)&1);
      var $49=($48);
      var $50=(($49)|0)!=0;
      if ($50) { label = 9; break; } else { label = 24; break; }
    case 9: 
      var $52=$4;
      var $53=(($52)>>>0) < 11;
      if ($53) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $61 = 16;label = 12; break;
    case 11: 
      var $56=$4;
      var $57=((($56)+(4))|0);
      var $58=((($57)+(7))|0);
      var $59=$58 & -8;
      var $61 = $59;label = 12; break;
    case 12: 
      var $61;
      $nb=$61;
      var $62=$oldp;
      var $63=(($62+4)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=$64 & 3;
      var $66=(($65)|0)==0;
      if ($66) { label = 13; break; } else { label = 14; break; }
    case 13: 
      var $68=$2;
      var $69=$oldp;
      var $70=$nb;
      var $71=_mmap_resize($68, $69, $70);
      $newp=$71;
      label = 23; break;
    case 14: 
      var $73=$oldsize;
      var $74=$nb;
      var $75=(($73)>>>0) >= (($74)>>>0);
      if ($75) { label = 15; break; } else { label = 18; break; }
    case 15: 
      var $77=$oldsize;
      var $78=$nb;
      var $79=((($77)-($78))|0);
      $rsize=$79;
      var $80=$oldp;
      $newp=$80;
      var $81=$rsize;
      var $82=(($81)>>>0) >= 16;
      if ($82) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $84=$newp;
      var $85=$84;
      var $86=$nb;
      var $87=(($85+$86)|0);
      var $88=$87;
      $remainder=$88;
      var $89=$newp;
      var $90=(($89+4)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=$91 & 1;
      var $93=$nb;
      var $94=$92 | $93;
      var $95=$94 | 2;
      var $96=$newp;
      var $97=(($96+4)|0);
      HEAP32[(($97)>>2)]=$95;
      var $98=$newp;
      var $99=$98;
      var $100=$nb;
      var $101=(($99+$100)|0);
      var $102=$101;
      var $103=(($102+4)|0);
      var $104=HEAP32[(($103)>>2)];
      var $105=$104 | 1;
      HEAP32[(($103)>>2)]=$105;
      var $106=$rsize;
      var $107=$106 | 1;
      var $108=$107 | 2;
      var $109=$remainder;
      var $110=(($109+4)|0);
      HEAP32[(($110)>>2)]=$108;
      var $111=$remainder;
      var $112=$111;
      var $113=$rsize;
      var $114=(($112+$113)|0);
      var $115=$114;
      var $116=(($115+4)|0);
      var $117=HEAP32[(($116)>>2)];
      var $118=$117 | 1;
      HEAP32[(($116)>>2)]=$118;
      var $119=$remainder;
      var $120=$119;
      var $121=(($120+8)|0);
      $extra=$121;
      label = 17; break;
    case 17: 
      label = 22; break;
    case 18: 
      var $124=$next;
      var $125=$2;
      var $126=(($125+24)|0);
      var $127=HEAP32[(($126)>>2)];
      var $128=(($124)|0)==(($127)|0);
      if ($128) { label = 19; break; } else { label = 21; break; }
    case 19: 
      var $130=$oldsize;
      var $131=$2;
      var $132=(($131+12)|0);
      var $133=HEAP32[(($132)>>2)];
      var $134=((($130)+($133))|0);
      var $135=$nb;
      var $136=(($134)>>>0) > (($135)>>>0);
      if ($136) { label = 20; break; } else { label = 21; break; }
    case 20: 
      var $138=$oldsize;
      var $139=$2;
      var $140=(($139+12)|0);
      var $141=HEAP32[(($140)>>2)];
      var $142=((($138)+($141))|0);
      $newsize=$142;
      var $143=$newsize;
      var $144=$nb;
      var $145=((($143)-($144))|0);
      $newtopsize=$145;
      var $146=$oldp;
      var $147=$146;
      var $148=$nb;
      var $149=(($147+$148)|0);
      var $150=$149;
      $newtop=$150;
      var $151=$oldp;
      var $152=(($151+4)|0);
      var $153=HEAP32[(($152)>>2)];
      var $154=$153 & 1;
      var $155=$nb;
      var $156=$154 | $155;
      var $157=$156 | 2;
      var $158=$oldp;
      var $159=(($158+4)|0);
      HEAP32[(($159)>>2)]=$157;
      var $160=$oldp;
      var $161=$160;
      var $162=$nb;
      var $163=(($161+$162)|0);
      var $164=$163;
      var $165=(($164+4)|0);
      var $166=HEAP32[(($165)>>2)];
      var $167=$166 | 1;
      HEAP32[(($165)>>2)]=$167;
      var $168=$newtopsize;
      var $169=$168 | 1;
      var $170=$newtop;
      var $171=(($170+4)|0);
      HEAP32[(($171)>>2)]=$169;
      var $172=$newtop;
      var $173=$2;
      var $174=(($173+24)|0);
      HEAP32[(($174)>>2)]=$172;
      var $175=$newtopsize;
      var $176=$2;
      var $177=(($176+12)|0);
      HEAP32[(($177)>>2)]=$175;
      var $178=$oldp;
      $newp=$178;
      label = 21; break;
    case 21: 
      label = 22; break;
    case 22: 
      label = 23; break;
    case 23: 
      label = 25; break;
    case 24: 
      _abort();
      throw "Reached an unreachable!"
    case 25: 
      var $184=$newp;
      var $185=(($184)|0)!=0;
      if ($185) { label = 26; break; } else { label = 29; break; }
    case 26: 
      var $187=$extra;
      var $188=(($187)|0)!=0;
      if ($188) { label = 27; break; } else { label = 28; break; }
    case 27: 
      var $190=$extra;
      _free($190);
      label = 28; break;
    case 28: 
      var $192=$newp;
      var $193=$192;
      var $194=(($193+8)|0);
      $1=$194;
      label = 35; break;
    case 29: 
      var $196=$4;
      var $197=_malloc($196);
      $newmem=$197;
      var $198=$newmem;
      var $199=(($198)|0)!=0;
      if ($199) { label = 30; break; } else { label = 34; break; }
    case 30: 
      var $201=$oldsize;
      var $202=$oldp;
      var $203=(($202+4)|0);
      var $204=HEAP32[(($203)>>2)];
      var $205=$204 & 3;
      var $206=(($205)|0)==0;
      var $207=$206 ? 8 : 4;
      var $208=((($201)-($207))|0);
      $oc=$208;
      var $209=$newmem;
      var $210=$3;
      var $211=$oc;
      var $212=$4;
      var $213=(($211)>>>0) < (($212)>>>0);
      if ($213) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $215=$oc;
      var $219 = $215;label = 33; break;
    case 32: 
      var $217=$4;
      var $219 = $217;label = 33; break;
    case 33: 
      var $219;
      assert($219 % 1 === 0);_memcpy($209, $210, $219);
      var $220=$3;
      _free($220);
      label = 34; break;
    case 34: 
      var $222=$newmem;
      $1=$222;
      label = 35; break;
    case 35: 
      var $224=$1;

      return $224;
    default: assert(0, "bad label: " + label);
  }
}
_internal_realloc["X"]=1;

function _malloc_footprint() {
  var label = 0;


  var $1=HEAP32[((((5243568)|0))>>2)];

  return $1;
}


function _malloc_max_footprint() {
  var label = 0;


  var $1=HEAP32[((((5243572)|0))>>2)];

  return $1;
}


function _ialloc($m, $n_elements, $sizes, $opts, $chunks) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $5;
      var $6;
      var $element_size;
      var $contents_size;
      var $array_size;
      var $mem;
      var $p;
      var $remainder_size;
      var $marray;
      var $array_chunk;
      var $was_enabled;
      var $size;
      var $i;
      var $array_chunk_size;
      $2=$m;
      $3=$n_elements;
      $4=$sizes;
      $5=$opts;
      $6=$chunks;
      var $7=HEAP32[((((5242924)|0))>>2)];
      var $8=(($7)|0)!=0;
      if ($8) { var $13 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $10=_init_mparams();
      var $11=(($10)|0)!=0;
      var $13 = $11;label = 4; break;
    case 4: 
      var $13;
      var $14=(($13)&1);
      var $15=$6;
      var $16=(($15)|0)!=0;
      if ($16) { label = 5; break; } else { label = 8; break; }
    case 5: 
      var $18=$3;
      var $19=(($18)|0)==0;
      if ($19) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $21=$6;
      $1=$21;
      label = 48; break;
    case 7: 
      var $23=$6;
      $marray=$23;
      $array_size=0;
      label = 14; break;
    case 8: 
      var $25=$3;
      var $26=(($25)|0)==0;
      if ($26) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $28=_malloc(0);
      var $29=$28;
      $1=$29;
      label = 48; break;
    case 10: 
      $marray=0;
      var $31=$3;
      var $32=((($31<<2))|0);
      var $33=(($32)>>>0) < 11;
      if ($33) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $42 = 16;label = 13; break;
    case 12: 
      var $36=$3;
      var $37=((($36<<2))|0);
      var $38=((($37)+(4))|0);
      var $39=((($38)+(7))|0);
      var $40=$39 & -8;
      var $42 = $40;label = 13; break;
    case 13: 
      var $42;
      $array_size=$42;
      label = 14; break;
    case 14: 
      var $44=$5;
      var $45=$44 & 1;
      var $46=(($45)|0)!=0;
      if ($46) { label = 15; break; } else { label = 19; break; }
    case 15: 
      var $48=$4;
      var $49=HEAP32[(($48)>>2)];
      var $50=(($49)>>>0) < 11;
      if ($50) { label = 16; break; } else { label = 17; break; }
    case 16: 
      var $59 = 16;label = 18; break;
    case 17: 
      var $53=$4;
      var $54=HEAP32[(($53)>>2)];
      var $55=((($54)+(4))|0);
      var $56=((($55)+(7))|0);
      var $57=$56 & -8;
      var $59 = $57;label = 18; break;
    case 18: 
      var $59;
      $element_size=$59;
      var $60=$3;
      var $61=$element_size;
      var $62=((($60)*($61))|0);
      $contents_size=$62;
      label = 27; break;
    case 19: 
      $element_size=0;
      $contents_size=0;
      $i=0;
      label = 20; break;
    case 20: 
      var $65=$i;
      var $66=$3;
      var $67=(($65)|0)!=(($66)|0);
      if ($67) { label = 21; break; } else { label = 26; break; }
    case 21: 
      var $69=$i;
      var $70=$4;
      var $71=(($70+($69<<2))|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=(($72)>>>0) < 11;
      if ($73) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $84 = 16;label = 24; break;
    case 23: 
      var $76=$i;
      var $77=$4;
      var $78=(($77+($76<<2))|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=((($79)+(4))|0);
      var $81=((($80)+(7))|0);
      var $82=$81 & -8;
      var $84 = $82;label = 24; break;
    case 24: 
      var $84;
      var $85=$contents_size;
      var $86=((($85)+($84))|0);
      $contents_size=$86;
      label = 25; break;
    case 25: 
      var $88=$i;
      var $89=((($88)+(1))|0);
      $i=$89;
      label = 20; break;
    case 26: 
      label = 27; break;
    case 27: 
      var $92=$contents_size;
      var $93=$array_size;
      var $94=((($92)+($93))|0);
      $size=$94;
      var $95=$2;
      var $96=(($95+440)|0);
      var $97=HEAP32[(($96)>>2)];
      var $98=$97 & 0;
      $was_enabled=$98;
      var $99=$2;
      var $100=(($99+440)|0);
      var $101=HEAP32[(($100)>>2)];
      HEAP32[(($100)>>2)]=$101;
      var $102=$size;
      var $103=((($102)-(4))|0);
      var $104=_malloc($103);
      $mem=$104;
      var $105=$was_enabled;
      var $106=(($105)|0)!=0;
      if ($106) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $108=$2;
      var $109=(($108+440)|0);
      var $110=HEAP32[(($109)>>2)];
      HEAP32[(($109)>>2)]=$110;
      label = 29; break;
    case 29: 
      var $112=$mem;
      var $113=(($112)|0)==0;
      if ($113) { label = 30; break; } else { label = 31; break; }
    case 30: 
      $1=0;
      label = 48; break;
    case 31: 
      var $116=$mem;
      var $117=((($116)-(8))|0);
      var $118=$117;
      $p=$118;
      var $119=$p;
      var $120=(($119+4)|0);
      var $121=HEAP32[(($120)>>2)];
      var $122=$121 & -8;
      $remainder_size=$122;
      var $123=$5;
      var $124=$123 & 2;
      var $125=(($124)|0)!=0;
      if ($125) { label = 32; break; } else { label = 33; break; }
    case 32: 
      var $127=$mem;
      var $128=$127;
      var $129=$128;
      var $130=$remainder_size;
      var $131=((($130)-(4))|0);
      var $132=$array_size;
      var $133=((($131)-($132))|0);
      _memset($129, 0, $133, 4);
      label = 33; break;
    case 33: 
      var $135=$marray;
      var $136=(($135)|0)==0;
      if ($136) { label = 34; break; } else { label = 35; break; }
    case 34: 
      var $138=$p;
      var $139=$138;
      var $140=$contents_size;
      var $141=(($139+$140)|0);
      var $142=$141;
      $array_chunk=$142;
      var $143=$remainder_size;
      var $144=$contents_size;
      var $145=((($143)-($144))|0);
      $array_chunk_size=$145;
      var $146=$array_chunk;
      var $147=$146;
      var $148=(($147+8)|0);
      var $149=$148;
      $marray=$149;
      var $150=$array_chunk_size;
      var $151=$150 | 1;
      var $152=$151 | 2;
      var $153=$array_chunk;
      var $154=(($153+4)|0);
      HEAP32[(($154)>>2)]=$152;
      var $155=$contents_size;
      $remainder_size=$155;
      label = 35; break;
    case 35: 
      $i=0;
      label = 36; break;
    case 36: 
      var $158=$p;
      var $159=$158;
      var $160=(($159+8)|0);
      var $161=$i;
      var $162=$marray;
      var $163=(($162+($161<<2))|0);
      HEAP32[(($163)>>2)]=$160;
      var $164=$i;
      var $165=$3;
      var $166=((($165)-(1))|0);
      var $167=(($164)|0)!=(($166)|0);
      if ($167) { label = 37; break; } else { label = 44; break; }
    case 37: 
      var $169=$element_size;
      var $170=(($169)|0)!=0;
      if ($170) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $172=$element_size;
      $size=$172;
      label = 43; break;
    case 39: 
      var $174=$i;
      var $175=$4;
      var $176=(($175+($174<<2))|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=(($177)>>>0) < 11;
      if ($178) { label = 40; break; } else { label = 41; break; }
    case 40: 
      var $189 = 16;label = 42; break;
    case 41: 
      var $181=$i;
      var $182=$4;
      var $183=(($182+($181<<2))|0);
      var $184=HEAP32[(($183)>>2)];
      var $185=((($184)+(4))|0);
      var $186=((($185)+(7))|0);
      var $187=$186 & -8;
      var $189 = $187;label = 42; break;
    case 42: 
      var $189;
      $size=$189;
      label = 43; break;
    case 43: 
      var $191=$size;
      var $192=$remainder_size;
      var $193=((($192)-($191))|0);
      $remainder_size=$193;
      var $194=$size;
      var $195=$194 | 1;
      var $196=$195 | 2;
      var $197=$p;
      var $198=(($197+4)|0);
      HEAP32[(($198)>>2)]=$196;
      var $199=$p;
      var $200=$199;
      var $201=$size;
      var $202=(($200+$201)|0);
      var $203=$202;
      $p=$203;
      label = 45; break;
    case 44: 
      var $205=$remainder_size;
      var $206=$205 | 1;
      var $207=$206 | 2;
      var $208=$p;
      var $209=(($208+4)|0);
      HEAP32[(($209)>>2)]=$207;
      label = 47; break;
    case 45: 
      label = 46; break;
    case 46: 
      var $212=$i;
      var $213=((($212)+(1))|0);
      $i=$213;
      label = 36; break;
    case 47: 
      var $215=$marray;
      $1=$215;
      label = 48; break;
    case 48: 
      var $217=$1;

      return $217;
    default: assert(0, "bad label: " + label);
  }
}
_ialloc["X"]=1;

function _independent_comalloc($n_elements, $sizes, $chunks) {
  var label = 0;


  var $1;
  var $2;
  var $3;
  $1=$n_elements;
  $2=$sizes;
  $3=$chunks;
  var $4=$1;
  var $5=$2;
  var $6=$3;
  var $7=_ialloc(5243136, $4, $5, 0, $6);

  return $7;
}


function _valloc($bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $pagesz;
      $1=$bytes;
      var $2=HEAP32[((((5242924)|0))>>2)];
      var $3=(($2)|0)!=0;
      if ($3) { var $8 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $5=_init_mparams();
      var $6=(($5)|0)!=0;
      var $8 = $6;label = 4; break;
    case 4: 
      var $8;
      var $9=(($8)&1);
      var $10=HEAP32[((((5242928)|0))>>2)];
      $pagesz=$10;
      var $11=$pagesz;
      var $12=$1;
      var $13=_memalign($11, $12);

      return $13;
    default: assert(0, "bad label: " + label);
  }
}


function _pvalloc($bytes) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $pagesz;
      $1=$bytes;
      var $2=HEAP32[((((5242924)|0))>>2)];
      var $3=(($2)|0)!=0;
      if ($3) { var $8 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $5=_init_mparams();
      var $6=(($5)|0)!=0;
      var $8 = $6;label = 4; break;
    case 4: 
      var $8;
      var $9=(($8)&1);
      var $10=HEAP32[((((5242928)|0))>>2)];
      $pagesz=$10;
      var $11=$pagesz;
      var $12=$1;
      var $13=$pagesz;
      var $14=((($12)+($13))|0);
      var $15=((($14)-(1))|0);
      var $16=$pagesz;
      var $17=((($16)-(1))|0);
      var $18=$17 ^ -1;
      var $19=$15 & $18;
      var $20=_memalign($11, $19);

      return $20;
    default: assert(0, "bad label: " + label);
  }
}


function _malloc_trim($pad) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $result;
      $1=$pad;
      $result=0;
      var $2=HEAP32[((((5242924)|0))>>2)];
      var $3=(($2)|0)!=0;
      if ($3) { var $8 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $5=_init_mparams();
      var $6=(($5)|0)!=0;
      var $8 = $6;label = 4; break;
    case 4: 
      var $8;
      var $9=(($8)&1);
      var $10=$1;
      var $11=_sys_trim(5243136, $10);
      $result=$11;
      var $12=$result;

      return $12;
    default: assert(0, "bad label: " + label);
  }
}


function _mallinfo($agg_result) {
  var label = 0;


  _internal_mallinfo($agg_result, 5243136);

  return;
}


function _internal_mallinfo($agg_result, $m) {
  var label = 0;
  var __stackBase__  = STACKTOP; STACKTOP = (STACKTOP + 40)|0; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $nm=__stackBase__;
      var $nfree;
      var $mfree;
      var $sum;
      var $s;
      var $q;
      var $sz;
      $1=$m;
      var $2=$nm;
      for (var $$dest = $2>>2, $$stop = $$dest + 10; $$dest < $$stop; $$dest++) {
        HEAP32[$$dest] = 0
      };
      var $3=HEAP32[((((5242924)|0))>>2)];
      var $4=(($3)|0)!=0;
      if ($4) { var $9 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $6=_init_mparams();
      var $7=(($6)|0)!=0;
      var $9 = $7;label = 4; break;
    case 4: 
      var $9;
      var $10=(($9)&1);
      var $11=$1;
      var $12=(($11+24)|0);
      var $13=HEAP32[(($12)>>2)];
      var $14=(($13)|0)!=0;
      if ($14) { label = 5; break; } else { label = 21; break; }
    case 5: 
      $nfree=1;
      var $16=$1;
      var $17=(($16+12)|0);
      var $18=HEAP32[(($17)>>2)];
      var $19=((($18)+(40))|0);
      $mfree=$19;
      var $20=$mfree;
      $sum=$20;
      var $21=$1;
      var $22=(($21+444)|0);
      $s=$22;
      label = 6; break;
    case 6: 
      var $24=$s;
      var $25=(($24)|0)!=0;
      if ($25) { label = 7; break; } else { label = 20; break; }
    case 7: 
      var $27=$s;
      var $28=(($27)|0);
      var $29=HEAP32[(($28)>>2)];
      var $30=$s;
      var $31=(($30)|0);
      var $32=HEAP32[(($31)>>2)];
      var $33=(($32+8)|0);
      var $34=$33;
      var $35=$34 & 7;
      var $36=(($35)|0)==0;
      if ($36) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $48 = 0;label = 10; break;
    case 9: 
      var $39=$s;
      var $40=(($39)|0);
      var $41=HEAP32[(($40)>>2)];
      var $42=(($41+8)|0);
      var $43=$42;
      var $44=$43 & 7;
      var $45=(((8)-($44))|0);
      var $46=$45 & 7;
      var $48 = $46;label = 10; break;
    case 10: 
      var $48;
      var $49=(($29+$48)|0);
      var $50=$49;
      $q=$50;
      label = 11; break;
    case 11: 
      var $52=$q;
      var $53=$52;
      var $54=$s;
      var $55=(($54)|0);
      var $56=HEAP32[(($55)>>2)];
      var $57=(($53)>>>0) >= (($56)>>>0);
      if ($57) { label = 12; break; } else { var $81 = 0;label = 15; break; }
    case 12: 
      var $59=$q;
      var $60=$59;
      var $61=$s;
      var $62=(($61)|0);
      var $63=HEAP32[(($62)>>2)];
      var $64=$s;
      var $65=(($64+4)|0);
      var $66=HEAP32[(($65)>>2)];
      var $67=(($63+$66)|0);
      var $68=(($60)>>>0) < (($67)>>>0);
      if ($68) { label = 13; break; } else { var $81 = 0;label = 15; break; }
    case 13: 
      var $70=$q;
      var $71=$1;
      var $72=(($71+24)|0);
      var $73=HEAP32[(($72)>>2)];
      var $74=(($70)|0)!=(($73)|0);
      if ($74) { label = 14; break; } else { var $81 = 0;label = 15; break; }
    case 14: 
      var $76=$q;
      var $77=(($76+4)|0);
      var $78=HEAP32[(($77)>>2)];
      var $79=(($78)|0)!=7;
      var $81 = $79;label = 15; break;
    case 15: 
      var $81;
      if ($81) { label = 16; break; } else { label = 19; break; }
    case 16: 
      var $83=$q;
      var $84=(($83+4)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=$85 & -8;
      $sz=$86;
      var $87=$sz;
      var $88=$sum;
      var $89=((($88)+($87))|0);
      $sum=$89;
      var $90=$q;
      var $91=(($90+4)|0);
      var $92=HEAP32[(($91)>>2)];
      var $93=$92 & 3;
      var $94=(($93)|0)!=1;
      if ($94) { label = 18; break; } else { label = 17; break; }
    case 17: 
      var $96=$sz;
      var $97=$mfree;
      var $98=((($97)+($96))|0);
      $mfree=$98;
      var $99=$nfree;
      var $100=((($99)+(1))|0);
      $nfree=$100;
      label = 18; break;
    case 18: 
      var $102=$q;
      var $103=$102;
      var $104=$q;
      var $105=(($104+4)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=$106 & -8;
      var $108=(($103+$107)|0);
      var $109=$108;
      $q=$109;
      label = 11; break;
    case 19: 
      var $111=$s;
      var $112=(($111+8)|0);
      var $113=HEAP32[(($112)>>2)];
      $s=$113;
      label = 6; break;
    case 20: 
      var $115=$sum;
      var $116=(($nm)|0);
      HEAP32[(($116)>>2)]=$115;
      var $117=$nfree;
      var $118=(($nm+4)|0);
      HEAP32[(($118)>>2)]=$117;
      var $119=$1;
      var $120=(($119+432)|0);
      var $121=HEAP32[(($120)>>2)];
      var $122=$sum;
      var $123=((($121)-($122))|0);
      var $124=(($nm+16)|0);
      HEAP32[(($124)>>2)]=$123;
      var $125=$1;
      var $126=(($125+436)|0);
      var $127=HEAP32[(($126)>>2)];
      var $128=(($nm+20)|0);
      HEAP32[(($128)>>2)]=$127;
      var $129=$1;
      var $130=(($129+432)|0);
      var $131=HEAP32[(($130)>>2)];
      var $132=$mfree;
      var $133=((($131)-($132))|0);
      var $134=(($nm+28)|0);
      HEAP32[(($134)>>2)]=$133;
      var $135=$mfree;
      var $136=(($nm+32)|0);
      HEAP32[(($136)>>2)]=$135;
      var $137=$1;
      var $138=(($137+12)|0);
      var $139=HEAP32[(($138)>>2)];
      var $140=(($nm+36)|0);
      HEAP32[(($140)>>2)]=$139;
      label = 21; break;
    case 21: 
      var $142=$agg_result;
      var $143=$nm;
      assert(40 % 1 === 0);for (var $$src = $143>>2, $$dest = $142>>2, $$stop = $$src + 10; $$src < $$stop; $$src++, $$dest++) {
        HEAP32[$$dest] = HEAP32[$$src]
      };
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
_internal_mallinfo["X"]=1;

function _malloc_stats() {
  var label = 0;


  _internal_malloc_stats(5243136);

  return;
}


function _internal_malloc_stats($m) {
  var label = 0;
  var __stackBase__  = STACKTOP; assert(STACKTOP|0 % 4 == 0); assert(STACKTOP < STACK_MAX);
  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $maxfp;
      var $fp;
      var $used;
      var $s;
      var $q;
      $1=$m;
      var $2=HEAP32[((((5242924)|0))>>2)];
      var $3=(($2)|0)!=0;
      if ($3) { var $8 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $5=_init_mparams();
      var $6=(($5)|0)!=0;
      var $8 = $6;label = 4; break;
    case 4: 
      var $8;
      var $9=(($8)&1);
      $maxfp=0;
      $fp=0;
      $used=0;
      var $10=$1;
      var $11=(($10+24)|0);
      var $12=HEAP32[(($11)>>2)];
      var $13=(($12)|0)!=0;
      if ($13) { label = 5; break; } else { label = 21; break; }
    case 5: 
      var $15=$1;
      var $16=(($15+444)|0);
      $s=$16;
      var $17=$1;
      var $18=(($17+436)|0);
      var $19=HEAP32[(($18)>>2)];
      $maxfp=$19;
      var $20=$1;
      var $21=(($20+432)|0);
      var $22=HEAP32[(($21)>>2)];
      $fp=$22;
      var $23=$fp;
      var $24=$1;
      var $25=(($24+12)|0);
      var $26=HEAP32[(($25)>>2)];
      var $27=((($26)+(40))|0);
      var $28=((($23)-($27))|0);
      $used=$28;
      label = 6; break;
    case 6: 
      var $30=$s;
      var $31=(($30)|0)!=0;
      if ($31) { label = 7; break; } else { label = 20; break; }
    case 7: 
      var $33=$s;
      var $34=(($33)|0);
      var $35=HEAP32[(($34)>>2)];
      var $36=$s;
      var $37=(($36)|0);
      var $38=HEAP32[(($37)>>2)];
      var $39=(($38+8)|0);
      var $40=$39;
      var $41=$40 & 7;
      var $42=(($41)|0)==0;
      if ($42) { label = 8; break; } else { label = 9; break; }
    case 8: 
      var $54 = 0;label = 10; break;
    case 9: 
      var $45=$s;
      var $46=(($45)|0);
      var $47=HEAP32[(($46)>>2)];
      var $48=(($47+8)|0);
      var $49=$48;
      var $50=$49 & 7;
      var $51=(((8)-($50))|0);
      var $52=$51 & 7;
      var $54 = $52;label = 10; break;
    case 10: 
      var $54;
      var $55=(($35+$54)|0);
      var $56=$55;
      $q=$56;
      label = 11; break;
    case 11: 
      var $58=$q;
      var $59=$58;
      var $60=$s;
      var $61=(($60)|0);
      var $62=HEAP32[(($61)>>2)];
      var $63=(($59)>>>0) >= (($62)>>>0);
      if ($63) { label = 12; break; } else { var $87 = 0;label = 15; break; }
    case 12: 
      var $65=$q;
      var $66=$65;
      var $67=$s;
      var $68=(($67)|0);
      var $69=HEAP32[(($68)>>2)];
      var $70=$s;
      var $71=(($70+4)|0);
      var $72=HEAP32[(($71)>>2)];
      var $73=(($69+$72)|0);
      var $74=(($66)>>>0) < (($73)>>>0);
      if ($74) { label = 13; break; } else { var $87 = 0;label = 15; break; }
    case 13: 
      var $76=$q;
      var $77=$1;
      var $78=(($77+24)|0);
      var $79=HEAP32[(($78)>>2)];
      var $80=(($76)|0)!=(($79)|0);
      if ($80) { label = 14; break; } else { var $87 = 0;label = 15; break; }
    case 14: 
      var $82=$q;
      var $83=(($82+4)|0);
      var $84=HEAP32[(($83)>>2)];
      var $85=(($84)|0)!=7;
      var $87 = $85;label = 15; break;
    case 15: 
      var $87;
      if ($87) { label = 16; break; } else { label = 19; break; }
    case 16: 
      var $89=$q;
      var $90=(($89+4)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=$91 & 3;
      var $93=(($92)|0)!=1;
      if ($93) { label = 18; break; } else { label = 17; break; }
    case 17: 
      var $95=$q;
      var $96=(($95+4)|0);
      var $97=HEAP32[(($96)>>2)];
      var $98=$97 & -8;
      var $99=$used;
      var $100=((($99)-($98))|0);
      $used=$100;
      label = 18; break;
    case 18: 
      var $102=$q;
      var $103=$102;
      var $104=$q;
      var $105=(($104+4)|0);
      var $106=HEAP32[(($105)>>2)];
      var $107=$106 & -8;
      var $108=(($103+$107)|0);
      var $109=$108;
      $q=$109;
      label = 11; break;
    case 19: 
      var $111=$s;
      var $112=(($111+8)|0);
      var $113=HEAP32[(($112)>>2)];
      $s=$113;
      label = 6; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $116=HEAP32[((_stderr)>>2)];
      var $117=$maxfp;
      var $118=_fprintf($116, ((5242948)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$117,tempInt));
      var $119=HEAP32[((_stderr)>>2)];
      var $120=$fp;
      var $121=_fprintf($119, ((5243040)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$120,tempInt));
      var $122=HEAP32[((_stderr)>>2)];
      var $123=$used;
      var $124=_fprintf($122, ((5242996)|0), (tempInt=STACKTOP,STACKTOP = (STACKTOP + 4)|0,assert(STACKTOP|0 < STACK_MAX|0),HEAP32[((tempInt)>>2)]=$123,tempInt));
      STACKTOP = __stackBase__;
      return;
    default: assert(0, "bad label: " + label);
  }
}
_internal_malloc_stats["X"]=1;

function _mallopt($param_number, $value) {
  var label = 0;


  var $1;
  var $2;
  $1=$param_number;
  $2=$value;
  var $3=$1;
  var $4=$2;
  var $5=_change_mparam($3, $4);

  return $5;
}


function _init_mparams() {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $magic;
      var $psize;
      var $gsize;
      var $1=HEAP32[((((5242924)|0))>>2)];
      var $2=(($1)|0)==0;
      if ($2) { label = 3; break; } else { label = 7; break; }
    case 3: 
      var $4=_sysconf(8);
      $psize=$4;
      var $5=$psize;
      $gsize=$5;
      var $6=$gsize;
      var $7=$gsize;
      var $8=((($7)-(1))|0);
      var $9=$6 & $8;
      var $10=(($9)|0)!=0;
      if ($10) { label = 5; break; } else { label = 4; break; }
    case 4: 
      var $12=$psize;
      var $13=$psize;
      var $14=((($13)-(1))|0);
      var $15=$12 & $14;
      var $16=(($15)|0)!=0;
      if ($16) { label = 5; break; } else { label = 6; break; }
    case 5: 
      _abort();
      throw "Reached an unreachable!"
    case 6: 
      var $19=$gsize;
      HEAP32[((((5242932)|0))>>2)]=$19;
      var $20=$psize;
      HEAP32[((((5242928)|0))>>2)]=$20;
      HEAP32[((((5242936)|0))>>2)]=-1;
      HEAP32[((((5242940)|0))>>2)]=2097152;
      HEAP32[((((5242944)|0))>>2)]=0;
      var $21=HEAP32[((((5242944)|0))>>2)];
      HEAP32[((((5243576)|0))>>2)]=$21;
      var $22=_time(0);
      var $23=$22 ^ 1431655765;
      $magic=$23;
      var $24=$magic;
      var $25=$24 | 8;
      $magic=$25;
      var $26=$magic;
      var $27=$26 & -8;
      $magic=$27;
      var $28=$magic;
      HEAP32[((((5242924)|0))>>2)]=$28;
      label = 7; break;
    case 7: 

      return 1;
    default: assert(0, "bad label: " + label);
  }
}


function _malloc_usable_size($mem) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $p;
      $2=$mem;
      var $3=$2;
      var $4=(($3)|0)!=0;
      if ($4) { label = 3; break; } else { label = 6; break; }
    case 3: 
      var $6=$2;
      var $7=((($6)-(8))|0);
      var $8=$7;
      $p=$8;
      var $9=$p;
      var $10=(($9+4)|0);
      var $11=HEAP32[(($10)>>2)];
      var $12=$11 & 3;
      var $13=(($12)|0)!=1;
      if ($13) { label = 4; break; } else { label = 5; break; }
    case 4: 
      var $15=$p;
      var $16=(($15+4)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=$17 & -8;
      var $19=$p;
      var $20=(($19+4)|0);
      var $21=HEAP32[(($20)>>2)];
      var $22=$21 & 3;
      var $23=(($22)|0)==0;
      var $24=$23 ? 8 : 4;
      var $25=((($18)-($24))|0);
      $1=$25;
      label = 7; break;
    case 5: 
      label = 6; break;
    case 6: 
      $1=0;
      label = 7; break;
    case 7: 
      var $29=$1;

      return $29;
    default: assert(0, "bad label: " + label);
  }
}


function _mmap_resize($m, $oldp, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $oldsize;
      var $offset;
      var $oldmmsize;
      var $newmmsize;
      var $cp;
      var $newp;
      var $psize;
      $2=$m;
      $3=$oldp;
      $4=$nb;
      var $5=$3;
      var $6=(($5+4)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$7 & -8;
      $oldsize=$8;
      var $9=$4;
      var $10=$9 >>> 3;
      var $11=(($10)>>>0) < 32;
      if ($11) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $1=0;
      label = 15; break;
    case 4: 
      var $14=$oldsize;
      var $15=$4;
      var $16=((($15)+(4))|0);
      var $17=(($14)>>>0) >= (($16)>>>0);
      if ($17) { label = 5; break; } else { label = 7; break; }
    case 5: 
      var $19=$oldsize;
      var $20=$4;
      var $21=((($19)-($20))|0);
      var $22=HEAP32[((((5242932)|0))>>2)];
      var $23=$22 << 1;
      var $24=(($21)>>>0) <= (($23)>>>0);
      if ($24) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $26=$3;
      $1=$26;
      label = 15; break;
    case 7: 
      var $28=$3;
      var $29=(($28)|0);
      var $30=HEAP32[(($29)>>2)];
      $offset=$30;
      var $31=$oldsize;
      var $32=$offset;
      var $33=((($31)+($32))|0);
      var $34=((($33)+(16))|0);
      $oldmmsize=$34;
      var $35=$4;
      var $36=((($35)+(24))|0);
      var $37=((($36)+(7))|0);
      var $38=HEAP32[((((5242928)|0))>>2)];
      var $39=((($38)-(1))|0);
      var $40=((($37)+($39))|0);
      var $41=HEAP32[((((5242928)|0))>>2)];
      var $42=((($41)-(1))|0);
      var $43=$42 ^ -1;
      var $44=$40 & $43;
      $newmmsize=$44;
      $cp=-1;
      var $45=$cp;
      var $46=(($45)|0)!=-1;
      if ($46) { label = 8; break; } else { label = 13; break; }
    case 8: 
      var $48=$cp;
      var $49=$offset;
      var $50=(($48+$49)|0);
      var $51=$50;
      $newp=$51;
      var $52=$newmmsize;
      var $53=$offset;
      var $54=((($52)-($53))|0);
      var $55=((($54)-(16))|0);
      $psize=$55;
      var $56=$psize;
      var $57=$newp;
      var $58=(($57+4)|0);
      HEAP32[(($58)>>2)]=$56;
      var $59=$newp;
      var $60=$59;
      var $61=$psize;
      var $62=(($60+$61)|0);
      var $63=$62;
      var $64=(($63+4)|0);
      HEAP32[(($64)>>2)]=7;
      var $65=$newp;
      var $66=$65;
      var $67=$psize;
      var $68=((($67)+(4))|0);
      var $69=(($66+$68)|0);
      var $70=$69;
      var $71=(($70+4)|0);
      HEAP32[(($71)>>2)]=0;
      var $72=$cp;
      var $73=$2;
      var $74=(($73+16)|0);
      var $75=HEAP32[(($74)>>2)];
      var $76=(($72)>>>0) < (($75)>>>0);
      if ($76) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $78=$cp;
      var $79=$2;
      var $80=(($79+16)|0);
      HEAP32[(($80)>>2)]=$78;
      label = 10; break;
    case 10: 
      var $82=$newmmsize;
      var $83=$oldmmsize;
      var $84=((($82)-($83))|0);
      var $85=$2;
      var $86=(($85+432)|0);
      var $87=HEAP32[(($86)>>2)];
      var $88=((($87)+($84))|0);
      HEAP32[(($86)>>2)]=$88;
      var $89=$2;
      var $90=(($89+436)|0);
      var $91=HEAP32[(($90)>>2)];
      var $92=(($88)>>>0) > (($91)>>>0);
      if ($92) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $94=$2;
      var $95=(($94+432)|0);
      var $96=HEAP32[(($95)>>2)];
      var $97=$2;
      var $98=(($97+436)|0);
      HEAP32[(($98)>>2)]=$96;
      label = 12; break;
    case 12: 
      var $100=$newp;
      $1=$100;
      label = 15; break;
    case 13: 
      label = 14; break;
    case 14: 
      $1=0;
      label = 15; break;
    case 15: 
      var $104=$1;

      return $104;
    default: assert(0, "bad label: " + label);
  }
}
_mmap_resize["X"]=1;

function _segment_holding($m, $addr) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $sp;
      $2=$m;
      $3=$addr;
      var $4=$2;
      var $5=(($4+444)|0);
      $sp=$5;
      label = 3; break;
    case 3: 
      var $7=$3;
      var $8=$sp;
      var $9=(($8)|0);
      var $10=HEAP32[(($9)>>2)];
      var $11=(($7)>>>0) >= (($10)>>>0);
      if ($11) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $13=$3;
      var $14=$sp;
      var $15=(($14)|0);
      var $16=HEAP32[(($15)>>2)];
      var $17=$sp;
      var $18=(($17+4)|0);
      var $19=HEAP32[(($18)>>2)];
      var $20=(($16+$19)|0);
      var $21=(($13)>>>0) < (($20)>>>0);
      if ($21) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $23=$sp;
      $1=$23;
      label = 9; break;
    case 6: 
      var $25=$sp;
      var $26=(($25+8)|0);
      var $27=HEAP32[(($26)>>2)];
      $sp=$27;
      var $28=(($27)|0)==0;
      if ($28) { label = 7; break; } else { label = 8; break; }
    case 7: 
      $1=0;
      label = 9; break;
    case 8: 
      label = 3; break;
    case 9: 
      var $32=$1;

      return $32;
    default: assert(0, "bad label: " + label);
  }
}


function _init_top($m, $p, $psize) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $offset;
      $1=$m;
      $2=$p;
      $3=$psize;
      var $4=$2;
      var $5=$4;
      var $6=(($5+8)|0);
      var $7=$6;
      var $8=$7 & 7;
      var $9=(($8)|0)==0;
      if ($9) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $20 = 0;label = 5; break;
    case 4: 
      var $12=$2;
      var $13=$12;
      var $14=(($13+8)|0);
      var $15=$14;
      var $16=$15 & 7;
      var $17=(((8)-($16))|0);
      var $18=$17 & 7;
      var $20 = $18;label = 5; break;
    case 5: 
      var $20;
      $offset=$20;
      var $21=$2;
      var $22=$21;
      var $23=$offset;
      var $24=(($22+$23)|0);
      var $25=$24;
      $2=$25;
      var $26=$offset;
      var $27=$3;
      var $28=((($27)-($26))|0);
      $3=$28;
      var $29=$2;
      var $30=$1;
      var $31=(($30+24)|0);
      HEAP32[(($31)>>2)]=$29;
      var $32=$3;
      var $33=$1;
      var $34=(($33+12)|0);
      HEAP32[(($34)>>2)]=$32;
      var $35=$3;
      var $36=$35 | 1;
      var $37=$2;
      var $38=(($37+4)|0);
      HEAP32[(($38)>>2)]=$36;
      var $39=$2;
      var $40=$39;
      var $41=$3;
      var $42=(($40+$41)|0);
      var $43=$42;
      var $44=(($43+4)|0);
      HEAP32[(($44)>>2)]=40;
      var $45=HEAP32[((((5242940)|0))>>2)];
      var $46=$1;
      var $47=(($46+28)|0);
      HEAP32[(($47)>>2)]=$45;

      return;
    default: assert(0, "bad label: " + label);
  }
}
_init_top["X"]=1;

function _mmap_alloc($m, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $mmsize;
      var $mm;
      var $offset;
      var $psize;
      var $p;
      $2=$m;
      $3=$nb;
      var $4=$3;
      var $5=((($4)+(24))|0);
      var $6=((($5)+(7))|0);
      var $7=HEAP32[((((5242928)|0))>>2)];
      var $8=((($7)-(1))|0);
      var $9=((($6)+($8))|0);
      var $10=HEAP32[((((5242928)|0))>>2)];
      var $11=((($10)-(1))|0);
      var $12=$11 ^ -1;
      var $13=$9 & $12;
      $mmsize=$13;
      var $14=$mmsize;
      var $15=$3;
      var $16=(($14)>>>0) > (($15)>>>0);
      if ($16) { label = 3; break; } else { label = 14; break; }
    case 3: 
      $mm=-1;
      var $18=$mm;
      var $19=(($18)|0)!=-1;
      if ($19) { label = 4; break; } else { label = 13; break; }
    case 4: 
      var $21=$mm;
      var $22=(($21+8)|0);
      var $23=$22;
      var $24=$23 & 7;
      var $25=(($24)|0)==0;
      if ($25) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $35 = 0;label = 7; break;
    case 6: 
      var $28=$mm;
      var $29=(($28+8)|0);
      var $30=$29;
      var $31=$30 & 7;
      var $32=(((8)-($31))|0);
      var $33=$32 & 7;
      var $35 = $33;label = 7; break;
    case 7: 
      var $35;
      $offset=$35;
      var $36=$mmsize;
      var $37=$offset;
      var $38=((($36)-($37))|0);
      var $39=((($38)-(16))|0);
      $psize=$39;
      var $40=$mm;
      var $41=$offset;
      var $42=(($40+$41)|0);
      var $43=$42;
      $p=$43;
      var $44=$offset;
      var $45=$p;
      var $46=(($45)|0);
      HEAP32[(($46)>>2)]=$44;
      var $47=$psize;
      var $48=$p;
      var $49=(($48+4)|0);
      HEAP32[(($49)>>2)]=$47;
      var $50=$p;
      var $51=$50;
      var $52=$psize;
      var $53=(($51+$52)|0);
      var $54=$53;
      var $55=(($54+4)|0);
      HEAP32[(($55)>>2)]=7;
      var $56=$p;
      var $57=$56;
      var $58=$psize;
      var $59=((($58)+(4))|0);
      var $60=(($57+$59)|0);
      var $61=$60;
      var $62=(($61+4)|0);
      HEAP32[(($62)>>2)]=0;
      var $63=$2;
      var $64=(($63+16)|0);
      var $65=HEAP32[(($64)>>2)];
      var $66=(($65)|0)==0;
      if ($66) { label = 9; break; } else { label = 8; break; }
    case 8: 
      var $68=$mm;
      var $69=$2;
      var $70=(($69+16)|0);
      var $71=HEAP32[(($70)>>2)];
      var $72=(($68)>>>0) < (($71)>>>0);
      if ($72) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $74=$mm;
      var $75=$2;
      var $76=(($75+16)|0);
      HEAP32[(($76)>>2)]=$74;
      label = 10; break;
    case 10: 
      var $78=$mmsize;
      var $79=$2;
      var $80=(($79+432)|0);
      var $81=HEAP32[(($80)>>2)];
      var $82=((($81)+($78))|0);
      HEAP32[(($80)>>2)]=$82;
      var $83=$2;
      var $84=(($83+436)|0);
      var $85=HEAP32[(($84)>>2)];
      var $86=(($82)>>>0) > (($85)>>>0);
      if ($86) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $88=$2;
      var $89=(($88+432)|0);
      var $90=HEAP32[(($89)>>2)];
      var $91=$2;
      var $92=(($91+436)|0);
      HEAP32[(($92)>>2)]=$90;
      label = 12; break;
    case 12: 
      var $94=$p;
      var $95=$94;
      var $96=(($95+8)|0);
      $1=$96;
      label = 15; break;
    case 13: 
      label = 14; break;
    case 14: 
      $1=0;
      label = 15; break;
    case 15: 
      var $100=$1;

      return $100;
    default: assert(0, "bad label: " + label);
  }
}
_mmap_alloc["X"]=1;

function _init_bins($m) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $i;
      var $bin;
      $1=$m;
      $i=0;
      label = 3; break;
    case 3: 
      var $3=$i;
      var $4=(($3)>>>0) < 32;
      if ($4) { label = 4; break; } else { label = 6; break; }
    case 4: 
      var $6=$i;
      var $7=$6 << 1;
      var $8=$1;
      var $9=(($8+40)|0);
      var $10=(($9+($7<<2))|0);
      var $11=$10;
      var $12=$11;
      $bin=$12;
      var $13=$bin;
      var $14=$bin;
      var $15=(($14+12)|0);
      HEAP32[(($15)>>2)]=$13;
      var $16=$bin;
      var $17=(($16+8)|0);
      HEAP32[(($17)>>2)]=$13;
      label = 5; break;
    case 5: 
      var $19=$i;
      var $20=((($19)+(1))|0);
      $i=$20;
      label = 3; break;
    case 6: 

      return;
    default: assert(0, "bad label: " + label);
  }
}


function _change_mparam($param_number, $value) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $val;
      $2=$param_number;
      $3=$value;
      var $4=HEAP32[((((5242924)|0))>>2)];
      var $5=(($4)|0)!=0;
      if ($5) { var $10 = 1;label = 4; break; } else { label = 3; break; }
    case 3: 
      var $7=_init_mparams();
      var $8=(($7)|0)!=0;
      var $10 = $8;label = 4; break;
    case 4: 
      var $10;
      var $11=(($10)&1);
      var $12=$3;
      var $13=(($12)|0)==-1;
      if ($13) { label = 5; break; } else { label = 6; break; }
    case 5: 
      var $18 = -1;label = 7; break;
    case 6: 
      var $16=$3;
      var $18 = $16;label = 7; break;
    case 7: 
      var $18;
      $val=$18;
      var $19=$2;
      if ((($19)|0) == -1) {
        label = 8; break;
      }
      else if ((($19)|0) == -2) {
        label = 9; break;
      }
      else if ((($19)|0) == -3) {
        label = 13; break;
      }
      else {
      label = 14; break;
      }
      
    case 8: 
      var $21=$val;
      HEAP32[((((5242940)|0))>>2)]=$21;
      $1=1;
      label = 15; break;
    case 9: 
      var $23=$val;
      var $24=HEAP32[((((5242928)|0))>>2)];
      var $25=(($23)>>>0) >= (($24)>>>0);
      if ($25) { label = 10; break; } else { label = 12; break; }
    case 10: 
      var $27=$val;
      var $28=$val;
      var $29=((($28)-(1))|0);
      var $30=$27 & $29;
      var $31=(($30)|0)==0;
      if ($31) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $33=$val;
      HEAP32[((((5242932)|0))>>2)]=$33;
      $1=1;
      label = 15; break;
    case 12: 
      $1=0;
      label = 15; break;
    case 13: 
      var $36=$val;
      HEAP32[((((5242936)|0))>>2)]=$36;
      $1=1;
      label = 15; break;
    case 14: 
      $1=0;
      label = 15; break;
    case 15: 
      var $39=$1;

      return $39;
    default: assert(0, "bad label: " + label);
  }
}
_change_mparam["X"]=1;

function _prepend_alloc($m, $newbase, $oldbase, $nb) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $p;
      var $oldfirst;
      var $psize;
      var $q;
      var $qsize;
      var $tsize;
      var $dsize;
      var $nsize;
      var $F;
      var $B;
      var $I;
      var $TP;
      var $XP;
      var $R;
      var $F1;
      var $RP;
      var $CP;
      var $H;
      var $C0;
      var $C1;
      var $I2;
      var $B3;
      var $F4;
      var $TP5;
      var $H6;
      var $I7;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K8;
      var $C;
      var $F9;
      $1=$m;
      $2=$newbase;
      $3=$oldbase;
      $4=$nb;
      var $5=$2;
      var $6=$2;
      var $7=(($6+8)|0);
      var $8=$7;
      var $9=$8 & 7;
      var $10=(($9)|0)==0;
      if ($10) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $20 = 0;label = 5; break;
    case 4: 
      var $13=$2;
      var $14=(($13+8)|0);
      var $15=$14;
      var $16=$15 & 7;
      var $17=(((8)-($16))|0);
      var $18=$17 & 7;
      var $20 = $18;label = 5; break;
    case 5: 
      var $20;
      var $21=(($5+$20)|0);
      var $22=$21;
      $p=$22;
      var $23=$3;
      var $24=$3;
      var $25=(($24+8)|0);
      var $26=$25;
      var $27=$26 & 7;
      var $28=(($27)|0)==0;
      if ($28) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $38 = 0;label = 8; break;
    case 7: 
      var $31=$3;
      var $32=(($31+8)|0);
      var $33=$32;
      var $34=$33 & 7;
      var $35=(((8)-($34))|0);
      var $36=$35 & 7;
      var $38 = $36;label = 8; break;
    case 8: 
      var $38;
      var $39=(($23+$38)|0);
      var $40=$39;
      $oldfirst=$40;
      var $41=$oldfirst;
      var $42=$41;
      var $43=$p;
      var $44=$43;
      var $45=$42;
      var $46=$44;
      var $47=((($45)-($46))|0);
      $psize=$47;
      var $48=$p;
      var $49=$48;
      var $50=$4;
      var $51=(($49+$50)|0);
      var $52=$51;
      $q=$52;
      var $53=$psize;
      var $54=$4;
      var $55=((($53)-($54))|0);
      $qsize=$55;
      var $56=$4;
      var $57=$56 | 1;
      var $58=$57 | 2;
      var $59=$p;
      var $60=(($59+4)|0);
      HEAP32[(($60)>>2)]=$58;
      var $61=$oldfirst;
      var $62=$1;
      var $63=(($62+24)|0);
      var $64=HEAP32[(($63)>>2)];
      var $65=(($61)|0)==(($64)|0);
      if ($65) { label = 9; break; } else { label = 10; break; }
    case 9: 
      var $67=$qsize;
      var $68=$1;
      var $69=(($68+12)|0);
      var $70=HEAP32[(($69)>>2)];
      var $71=((($70)+($67))|0);
      HEAP32[(($69)>>2)]=$71;
      $tsize=$71;
      var $72=$q;
      var $73=$1;
      var $74=(($73+24)|0);
      HEAP32[(($74)>>2)]=$72;
      var $75=$tsize;
      var $76=$75 | 1;
      var $77=$q;
      var $78=(($77+4)|0);
      HEAP32[(($78)>>2)]=$76;
      label = 110; break;
    case 10: 
      var $80=$oldfirst;
      var $81=$1;
      var $82=(($81+20)|0);
      var $83=HEAP32[(($82)>>2)];
      var $84=(($80)|0)==(($83)|0);
      if ($84) { label = 11; break; } else { label = 12; break; }
    case 11: 
      var $86=$qsize;
      var $87=$1;
      var $88=(($87+8)|0);
      var $89=HEAP32[(($88)>>2)];
      var $90=((($89)+($86))|0);
      HEAP32[(($88)>>2)]=$90;
      $dsize=$90;
      var $91=$q;
      var $92=$1;
      var $93=(($92+20)|0);
      HEAP32[(($93)>>2)]=$91;
      var $94=$dsize;
      var $95=$94 | 1;
      var $96=$q;
      var $97=(($96+4)|0);
      HEAP32[(($97)>>2)]=$95;
      var $98=$dsize;
      var $99=$q;
      var $100=$99;
      var $101=$dsize;
      var $102=(($100+$101)|0);
      var $103=$102;
      var $104=(($103)|0);
      HEAP32[(($104)>>2)]=$98;
      label = 109; break;
    case 12: 
      var $106=$oldfirst;
      var $107=(($106+4)|0);
      var $108=HEAP32[(($107)>>2)];
      var $109=$108 & 3;
      var $110=(($109)|0)!=1;
      if ($110) { label = 73; break; } else { label = 13; break; }
    case 13: 
      var $112=$oldfirst;
      var $113=(($112+4)|0);
      var $114=HEAP32[(($113)>>2)];
      var $115=$114 & -8;
      $nsize=$115;
      var $116=$nsize;
      var $117=$116 >>> 3;
      var $118=(($117)>>>0) < 32;
      if ($118) { label = 14; break; } else { label = 26; break; }
    case 14: 
      var $120=$oldfirst;
      var $121=(($120+8)|0);
      var $122=HEAP32[(($121)>>2)];
      $F=$122;
      var $123=$oldfirst;
      var $124=(($123+12)|0);
      var $125=HEAP32[(($124)>>2)];
      $B=$125;
      var $126=$nsize;
      var $127=$126 >>> 3;
      $I=$127;
      var $128=$F;
      var $129=$B;
      var $130=(($128)|0)==(($129)|0);
      if ($130) { label = 15; break; } else { label = 16; break; }
    case 15: 
      var $132=$I;
      var $133=1 << $132;
      var $134=$133 ^ -1;
      var $135=$1;
      var $136=(($135)|0);
      var $137=HEAP32[(($136)>>2)];
      var $138=$137 & $134;
      HEAP32[(($136)>>2)]=$138;
      label = 25; break;
    case 16: 
      var $140=$F;
      var $141=$I;
      var $142=$141 << 1;
      var $143=$1;
      var $144=(($143+40)|0);
      var $145=(($144+($142<<2))|0);
      var $146=$145;
      var $147=$146;
      var $148=(($140)|0)==(($147)|0);
      if ($148) { label = 18; break; } else { label = 17; break; }
    case 17: 
      var $150=$F;
      var $151=$150;
      var $152=$1;
      var $153=(($152+16)|0);
      var $154=HEAP32[(($153)>>2)];
      var $155=(($151)>>>0) >= (($154)>>>0);
      if ($155) { label = 18; break; } else { var $176 = 0;label = 21; break; }
    case 18: 
      var $157=$B;
      var $158=$I;
      var $159=$158 << 1;
      var $160=$1;
      var $161=(($160+40)|0);
      var $162=(($161+($159<<2))|0);
      var $163=$162;
      var $164=$163;
      var $165=(($157)|0)==(($164)|0);
      if ($165) { var $174 = 1;label = 20; break; } else { label = 19; break; }
    case 19: 
      var $167=$B;
      var $168=$167;
      var $169=$1;
      var $170=(($169+16)|0);
      var $171=HEAP32[(($170)>>2)];
      var $172=(($168)>>>0) >= (($171)>>>0);
      var $174 = $172;label = 20; break;
    case 20: 
      var $174;
      var $176 = $174;label = 21; break;
    case 21: 
      var $176;
      var $177=(($176)&1);
      var $178=($177);
      var $179=(($178)|0)!=0;
      if ($179) { label = 22; break; } else { label = 23; break; }
    case 22: 
      var $181=$B;
      var $182=$F;
      var $183=(($182+12)|0);
      HEAP32[(($183)>>2)]=$181;
      var $184=$F;
      var $185=$B;
      var $186=(($185+8)|0);
      HEAP32[(($186)>>2)]=$184;
      label = 24; break;
    case 23: 
      _abort();
      throw "Reached an unreachable!"
    case 24: 
      label = 25; break;
    case 25: 
      label = 72; break;
    case 26: 
      var $191=$oldfirst;
      var $192=$191;
      $TP=$192;
      var $193=$TP;
      var $194=(($193+24)|0);
      var $195=HEAP32[(($194)>>2)];
      $XP=$195;
      var $196=$TP;
      var $197=(($196+12)|0);
      var $198=HEAP32[(($197)>>2)];
      var $199=$TP;
      var $200=(($198)|0)!=(($199)|0);
      if ($200) { label = 27; break; } else { label = 31; break; }
    case 27: 
      var $202=$TP;
      var $203=(($202+8)|0);
      var $204=HEAP32[(($203)>>2)];
      $F1=$204;
      var $205=$TP;
      var $206=(($205+12)|0);
      var $207=HEAP32[(($206)>>2)];
      $R=$207;
      var $208=$F1;
      var $209=$208;
      var $210=$1;
      var $211=(($210+16)|0);
      var $212=HEAP32[(($211)>>2)];
      var $213=(($209)>>>0) >= (($212)>>>0);
      var $214=(($213)&1);
      var $215=($214);
      var $216=(($215)|0)!=0;
      if ($216) { label = 28; break; } else { label = 29; break; }
    case 28: 
      var $218=$R;
      var $219=$F1;
      var $220=(($219+12)|0);
      HEAP32[(($220)>>2)]=$218;
      var $221=$F1;
      var $222=$R;
      var $223=(($222+8)|0);
      HEAP32[(($223)>>2)]=$221;
      label = 30; break;
    case 29: 
      _abort();
      throw "Reached an unreachable!"
    case 30: 
      label = 43; break;
    case 31: 
      var $227=$TP;
      var $228=(($227+16)|0);
      var $229=(($228+4)|0);
      $RP=$229;
      var $230=HEAP32[(($229)>>2)];
      $R=$230;
      var $231=(($230)|0)!=0;
      if ($231) { label = 33; break; } else { label = 32; break; }
    case 32: 
      var $233=$TP;
      var $234=(($233+16)|0);
      var $235=(($234)|0);
      $RP=$235;
      var $236=HEAP32[(($235)>>2)];
      $R=$236;
      var $237=(($236)|0)!=0;
      if ($237) { label = 33; break; } else { label = 42; break; }
    case 33: 
      label = 34; break;
    case 34: 
      var $240=$R;
      var $241=(($240+16)|0);
      var $242=(($241+4)|0);
      $CP=$242;
      var $243=HEAP32[(($242)>>2)];
      var $244=(($243)|0)!=0;
      if ($244) { var $252 = 1;label = 36; break; } else { label = 35; break; }
    case 35: 
      var $246=$R;
      var $247=(($246+16)|0);
      var $248=(($247)|0);
      $CP=$248;
      var $249=HEAP32[(($248)>>2)];
      var $250=(($249)|0)!=0;
      var $252 = $250;label = 36; break;
    case 36: 
      var $252;
      if ($252) { label = 37; break; } else { label = 38; break; }
    case 37: 
      var $254=$CP;
      $RP=$254;
      var $255=HEAP32[(($254)>>2)];
      $R=$255;
      label = 34; break;
    case 38: 
      var $257=$RP;
      var $258=$257;
      var $259=$1;
      var $260=(($259+16)|0);
      var $261=HEAP32[(($260)>>2)];
      var $262=(($258)>>>0) >= (($261)>>>0);
      var $263=(($262)&1);
      var $264=($263);
      var $265=(($264)|0)!=0;
      if ($265) { label = 39; break; } else { label = 40; break; }
    case 39: 
      var $267=$RP;
      HEAP32[(($267)>>2)]=0;
      label = 41; break;
    case 40: 
      _abort();
      throw "Reached an unreachable!"
    case 41: 
      label = 42; break;
    case 42: 
      label = 43; break;
    case 43: 
      var $272=$XP;
      var $273=(($272)|0)!=0;
      if ($273) { label = 44; break; } else { label = 71; break; }
    case 44: 
      var $275=$TP;
      var $276=(($275+28)|0);
      var $277=HEAP32[(($276)>>2)];
      var $278=$1;
      var $279=(($278+304)|0);
      var $280=(($279+($277<<2))|0);
      $H=$280;
      var $281=$TP;
      var $282=$H;
      var $283=HEAP32[(($282)>>2)];
      var $284=(($281)|0)==(($283)|0);
      if ($284) { label = 45; break; } else { label = 48; break; }
    case 45: 
      var $286=$R;
      var $287=$H;
      HEAP32[(($287)>>2)]=$286;
      var $288=(($286)|0)==0;
      if ($288) { label = 46; break; } else { label = 47; break; }
    case 46: 
      var $290=$TP;
      var $291=(($290+28)|0);
      var $292=HEAP32[(($291)>>2)];
      var $293=1 << $292;
      var $294=$293 ^ -1;
      var $295=$1;
      var $296=(($295+4)|0);
      var $297=HEAP32[(($296)>>2)];
      var $298=$297 & $294;
      HEAP32[(($296)>>2)]=$298;
      label = 47; break;
    case 47: 
      label = 55; break;
    case 48: 
      var $301=$XP;
      var $302=$301;
      var $303=$1;
      var $304=(($303+16)|0);
      var $305=HEAP32[(($304)>>2)];
      var $306=(($302)>>>0) >= (($305)>>>0);
      var $307=(($306)&1);
      var $308=($307);
      var $309=(($308)|0)!=0;
      if ($309) { label = 49; break; } else { label = 53; break; }
    case 49: 
      var $311=$XP;
      var $312=(($311+16)|0);
      var $313=(($312)|0);
      var $314=HEAP32[(($313)>>2)];
      var $315=$TP;
      var $316=(($314)|0)==(($315)|0);
      if ($316) { label = 50; break; } else { label = 51; break; }
    case 50: 
      var $318=$R;
      var $319=$XP;
      var $320=(($319+16)|0);
      var $321=(($320)|0);
      HEAP32[(($321)>>2)]=$318;
      label = 52; break;
    case 51: 
      var $323=$R;
      var $324=$XP;
      var $325=(($324+16)|0);
      var $326=(($325+4)|0);
      HEAP32[(($326)>>2)]=$323;
      label = 52; break;
    case 52: 
      label = 54; break;
    case 53: 
      _abort();
      throw "Reached an unreachable!"
    case 54: 
      label = 55; break;
    case 55: 
      var $331=$R;
      var $332=(($331)|0)!=0;
      if ($332) { label = 56; break; } else { label = 70; break; }
    case 56: 
      var $334=$R;
      var $335=$334;
      var $336=$1;
      var $337=(($336+16)|0);
      var $338=HEAP32[(($337)>>2)];
      var $339=(($335)>>>0) >= (($338)>>>0);
      var $340=(($339)&1);
      var $341=($340);
      var $342=(($341)|0)!=0;
      if ($342) { label = 57; break; } else { label = 68; break; }
    case 57: 
      var $344=$XP;
      var $345=$R;
      var $346=(($345+24)|0);
      HEAP32[(($346)>>2)]=$344;
      var $347=$TP;
      var $348=(($347+16)|0);
      var $349=(($348)|0);
      var $350=HEAP32[(($349)>>2)];
      $C0=$350;
      var $351=(($350)|0)!=0;
      if ($351) { label = 58; break; } else { label = 62; break; }
    case 58: 
      var $353=$C0;
      var $354=$353;
      var $355=$1;
      var $356=(($355+16)|0);
      var $357=HEAP32[(($356)>>2)];
      var $358=(($354)>>>0) >= (($357)>>>0);
      var $359=(($358)&1);
      var $360=($359);
      var $361=(($360)|0)!=0;
      if ($361) { label = 59; break; } else { label = 60; break; }
    case 59: 
      var $363=$C0;
      var $364=$R;
      var $365=(($364+16)|0);
      var $366=(($365)|0);
      HEAP32[(($366)>>2)]=$363;
      var $367=$R;
      var $368=$C0;
      var $369=(($368+24)|0);
      HEAP32[(($369)>>2)]=$367;
      label = 61; break;
    case 60: 
      _abort();
      throw "Reached an unreachable!"
    case 61: 
      label = 62; break;
    case 62: 
      var $373=$TP;
      var $374=(($373+16)|0);
      var $375=(($374+4)|0);
      var $376=HEAP32[(($375)>>2)];
      $C1=$376;
      var $377=(($376)|0)!=0;
      if ($377) { label = 63; break; } else { label = 67; break; }
    case 63: 
      var $379=$C1;
      var $380=$379;
      var $381=$1;
      var $382=(($381+16)|0);
      var $383=HEAP32[(($382)>>2)];
      var $384=(($380)>>>0) >= (($383)>>>0);
      var $385=(($384)&1);
      var $386=($385);
      var $387=(($386)|0)!=0;
      if ($387) { label = 64; break; } else { label = 65; break; }
    case 64: 
      var $389=$C1;
      var $390=$R;
      var $391=(($390+16)|0);
      var $392=(($391+4)|0);
      HEAP32[(($392)>>2)]=$389;
      var $393=$R;
      var $394=$C1;
      var $395=(($394+24)|0);
      HEAP32[(($395)>>2)]=$393;
      label = 66; break;
    case 65: 
      _abort();
      throw "Reached an unreachable!"
    case 66: 
      label = 67; break;
    case 67: 
      label = 69; break;
    case 68: 
      _abort();
      throw "Reached an unreachable!"
    case 69: 
      label = 70; break;
    case 70: 
      label = 71; break;
    case 71: 
      label = 72; break;
    case 72: 
      var $404=$oldfirst;
      var $405=$404;
      var $406=$nsize;
      var $407=(($405+$406)|0);
      var $408=$407;
      $oldfirst=$408;
      var $409=$nsize;
      var $410=$qsize;
      var $411=((($410)+($409))|0);
      $qsize=$411;
      label = 73; break;
    case 73: 
      var $413=$oldfirst;
      var $414=(($413+4)|0);
      var $415=HEAP32[(($414)>>2)];
      var $416=$415 & -2;
      HEAP32[(($414)>>2)]=$416;
      var $417=$qsize;
      var $418=$417 | 1;
      var $419=$q;
      var $420=(($419+4)|0);
      HEAP32[(($420)>>2)]=$418;
      var $421=$qsize;
      var $422=$q;
      var $423=$422;
      var $424=$qsize;
      var $425=(($423+$424)|0);
      var $426=$425;
      var $427=(($426)|0);
      HEAP32[(($427)>>2)]=$421;
      var $428=$qsize;
      var $429=$428 >>> 3;
      var $430=(($429)>>>0) < 32;
      if ($430) { label = 74; break; } else { label = 81; break; }
    case 74: 
      var $432=$qsize;
      var $433=$432 >>> 3;
      $I2=$433;
      var $434=$I2;
      var $435=$434 << 1;
      var $436=$1;
      var $437=(($436+40)|0);
      var $438=(($437+($435<<2))|0);
      var $439=$438;
      var $440=$439;
      $B3=$440;
      var $441=$B3;
      $F4=$441;
      var $442=$1;
      var $443=(($442)|0);
      var $444=HEAP32[(($443)>>2)];
      var $445=$I2;
      var $446=1 << $445;
      var $447=$444 & $446;
      var $448=(($447)|0)!=0;
      if ($448) { label = 76; break; } else { label = 75; break; }
    case 75: 
      var $450=$I2;
      var $451=1 << $450;
      var $452=$1;
      var $453=(($452)|0);
      var $454=HEAP32[(($453)>>2)];
      var $455=$454 | $451;
      HEAP32[(($453)>>2)]=$455;
      label = 80; break;
    case 76: 
      var $457=$B3;
      var $458=(($457+8)|0);
      var $459=HEAP32[(($458)>>2)];
      var $460=$459;
      var $461=$1;
      var $462=(($461+16)|0);
      var $463=HEAP32[(($462)>>2)];
      var $464=(($460)>>>0) >= (($463)>>>0);
      var $465=(($464)&1);
      var $466=($465);
      var $467=(($466)|0)!=0;
      if ($467) { label = 77; break; } else { label = 78; break; }
    case 77: 
      var $469=$B3;
      var $470=(($469+8)|0);
      var $471=HEAP32[(($470)>>2)];
      $F4=$471;
      label = 79; break;
    case 78: 
      _abort();
      throw "Reached an unreachable!"
    case 79: 
      label = 80; break;
    case 80: 
      var $475=$q;
      var $476=$B3;
      var $477=(($476+8)|0);
      HEAP32[(($477)>>2)]=$475;
      var $478=$q;
      var $479=$F4;
      var $480=(($479+12)|0);
      HEAP32[(($480)>>2)]=$478;
      var $481=$F4;
      var $482=$q;
      var $483=(($482+8)|0);
      HEAP32[(($483)>>2)]=$481;
      var $484=$B3;
      var $485=$q;
      var $486=(($485+12)|0);
      HEAP32[(($486)>>2)]=$484;
      label = 108; break;
    case 81: 
      var $488=$q;
      var $489=$488;
      $TP5=$489;
      var $490=$qsize;
      var $491=$490 >>> 8;
      $X=$491;
      var $492=$X;
      var $493=(($492)|0)==0;
      if ($493) { label = 82; break; } else { label = 83; break; }
    case 82: 
      $I7=0;
      label = 87; break;
    case 83: 
      var $496=$X;
      var $497=(($496)>>>0) > 65535;
      if ($497) { label = 84; break; } else { label = 85; break; }
    case 84: 
      $I7=31;
      label = 86; break;
    case 85: 
      var $500=$X;
      $Y=$500;
      var $501=$Y;
      var $502=((($501)-(256))|0);
      var $503=$502 >>> 16;
      var $504=$503 & 8;
      $N=$504;
      var $505=$N;
      var $506=$Y;
      var $507=$506 << $505;
      $Y=$507;
      var $508=((($507)-(4096))|0);
      var $509=$508 >>> 16;
      var $510=$509 & 4;
      $K=$510;
      var $511=$K;
      var $512=$N;
      var $513=((($512)+($511))|0);
      $N=$513;
      var $514=$K;
      var $515=$Y;
      var $516=$515 << $514;
      $Y=$516;
      var $517=((($516)-(16384))|0);
      var $518=$517 >>> 16;
      var $519=$518 & 2;
      $K=$519;
      var $520=$N;
      var $521=((($520)+($519))|0);
      $N=$521;
      var $522=$N;
      var $523=(((14)-($522))|0);
      var $524=$K;
      var $525=$Y;
      var $526=$525 << $524;
      $Y=$526;
      var $527=$526 >>> 15;
      var $528=((($523)+($527))|0);
      $K=$528;
      var $529=$K;
      var $530=$529 << 1;
      var $531=$qsize;
      var $532=$K;
      var $533=((($532)+(7))|0);
      var $534=$531 >>> (($533)>>>0);
      var $535=$534 & 1;
      var $536=((($530)+($535))|0);
      $I7=$536;
      label = 86; break;
    case 86: 
      label = 87; break;
    case 87: 
      var $539=$I7;
      var $540=$1;
      var $541=(($540+304)|0);
      var $542=(($541+($539<<2))|0);
      $H6=$542;
      var $543=$I7;
      var $544=$TP5;
      var $545=(($544+28)|0);
      HEAP32[(($545)>>2)]=$543;
      var $546=$TP5;
      var $547=(($546+16)|0);
      var $548=(($547+4)|0);
      HEAP32[(($548)>>2)]=0;
      var $549=$TP5;
      var $550=(($549+16)|0);
      var $551=(($550)|0);
      HEAP32[(($551)>>2)]=0;
      var $552=$1;
      var $553=(($552+4)|0);
      var $554=HEAP32[(($553)>>2)];
      var $555=$I7;
      var $556=1 << $555;
      var $557=$554 & $556;
      var $558=(($557)|0)!=0;
      if ($558) { label = 89; break; } else { label = 88; break; }
    case 88: 
      var $560=$I7;
      var $561=1 << $560;
      var $562=$1;
      var $563=(($562+4)|0);
      var $564=HEAP32[(($563)>>2)];
      var $565=$564 | $561;
      HEAP32[(($563)>>2)]=$565;
      var $566=$TP5;
      var $567=$H6;
      HEAP32[(($567)>>2)]=$566;
      var $568=$H6;
      var $569=$568;
      var $570=$TP5;
      var $571=(($570+24)|0);
      HEAP32[(($571)>>2)]=$569;
      var $572=$TP5;
      var $573=$TP5;
      var $574=(($573+12)|0);
      HEAP32[(($574)>>2)]=$572;
      var $575=$TP5;
      var $576=(($575+8)|0);
      HEAP32[(($576)>>2)]=$572;
      label = 107; break;
    case 89: 
      var $578=$H6;
      var $579=HEAP32[(($578)>>2)];
      $T=$579;
      var $580=$qsize;
      var $581=$I7;
      var $582=(($581)|0)==31;
      if ($582) { label = 90; break; } else { label = 91; break; }
    case 90: 
      var $591 = 0;label = 92; break;
    case 91: 
      var $585=$I7;
      var $586=$585 >>> 1;
      var $587=((($586)+(8))|0);
      var $588=((($587)-(2))|0);
      var $589=(((31)-($588))|0);
      var $591 = $589;label = 92; break;
    case 92: 
      var $591;
      var $592=$580 << $591;
      $K8=$592;
      label = 93; break;
    case 93: 
      var $594=$T;
      var $595=(($594+4)|0);
      var $596=HEAP32[(($595)>>2)];
      var $597=$596 & -8;
      var $598=$qsize;
      var $599=(($597)|0)!=(($598)|0);
      if ($599) { label = 94; break; } else { label = 100; break; }
    case 94: 
      var $601=$K8;
      var $602=$601 >>> 31;
      var $603=$602 & 1;
      var $604=$T;
      var $605=(($604+16)|0);
      var $606=(($605+($603<<2))|0);
      $C=$606;
      var $607=$K8;
      var $608=$607 << 1;
      $K8=$608;
      var $609=$C;
      var $610=HEAP32[(($609)>>2)];
      var $611=(($610)|0)!=0;
      if ($611) { label = 95; break; } else { label = 96; break; }
    case 95: 
      var $613=$C;
      var $614=HEAP32[(($613)>>2)];
      $T=$614;
      label = 99; break;
    case 96: 
      var $616=$C;
      var $617=$616;
      var $618=$1;
      var $619=(($618+16)|0);
      var $620=HEAP32[(($619)>>2)];
      var $621=(($617)>>>0) >= (($620)>>>0);
      var $622=(($621)&1);
      var $623=($622);
      var $624=(($623)|0)!=0;
      if ($624) { label = 97; break; } else { label = 98; break; }
    case 97: 
      var $626=$TP5;
      var $627=$C;
      HEAP32[(($627)>>2)]=$626;
      var $628=$T;
      var $629=$TP5;
      var $630=(($629+24)|0);
      HEAP32[(($630)>>2)]=$628;
      var $631=$TP5;
      var $632=$TP5;
      var $633=(($632+12)|0);
      HEAP32[(($633)>>2)]=$631;
      var $634=$TP5;
      var $635=(($634+8)|0);
      HEAP32[(($635)>>2)]=$631;
      label = 106; break;
    case 98: 
      _abort();
      throw "Reached an unreachable!"
    case 99: 
      label = 105; break;
    case 100: 
      var $639=$T;
      var $640=(($639+8)|0);
      var $641=HEAP32[(($640)>>2)];
      $F9=$641;
      var $642=$T;
      var $643=$642;
      var $644=$1;
      var $645=(($644+16)|0);
      var $646=HEAP32[(($645)>>2)];
      var $647=(($643)>>>0) >= (($646)>>>0);
      if ($647) { label = 101; break; } else { var $656 = 0;label = 102; break; }
    case 101: 
      var $649=$F9;
      var $650=$649;
      var $651=$1;
      var $652=(($651+16)|0);
      var $653=HEAP32[(($652)>>2)];
      var $654=(($650)>>>0) >= (($653)>>>0);
      var $656 = $654;label = 102; break;
    case 102: 
      var $656;
      var $657=(($656)&1);
      var $658=($657);
      var $659=(($658)|0)!=0;
      if ($659) { label = 103; break; } else { label = 104; break; }
    case 103: 
      var $661=$TP5;
      var $662=$F9;
      var $663=(($662+12)|0);
      HEAP32[(($663)>>2)]=$661;
      var $664=$T;
      var $665=(($664+8)|0);
      HEAP32[(($665)>>2)]=$661;
      var $666=$F9;
      var $667=$TP5;
      var $668=(($667+8)|0);
      HEAP32[(($668)>>2)]=$666;
      var $669=$T;
      var $670=$TP5;
      var $671=(($670+12)|0);
      HEAP32[(($671)>>2)]=$669;
      var $672=$TP5;
      var $673=(($672+24)|0);
      HEAP32[(($673)>>2)]=0;
      label = 106; break;
    case 104: 
      _abort();
      throw "Reached an unreachable!"
    case 105: 
      label = 93; break;
    case 106: 
      label = 107; break;
    case 107: 
      label = 108; break;
    case 108: 
      label = 109; break;
    case 109: 
      label = 110; break;
    case 110: 
      var $681=$p;
      var $682=$681;
      var $683=(($682+8)|0);

      return $683;
    default: assert(0, "bad label: " + label);
  }
}
_prepend_alloc["X"]=1;

function __ZSt15get_new_handlerv() {
  var label = 0;


  var $1=(tempValue=HEAP32[((5243724)>>2)],HEAP32[((5243724)>>2)]=tempValue+0,tempValue);
  var $2=$1;

  return $2;
}


function _memcpy($dest, $src, $n) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $d;
      var $s;
      var $wd;
      var $ws;
      $1=$dest;
      $2=$src;
      $3=$n;
      var $4=$1;
      $d=$4;
      var $5=$2;
      $s=$5;
      var $6=$d;
      var $7=$6;
      var $8=$7 & 3;
      var $9=$s;
      var $10=$9;
      var $11=$10 & 3;
      var $12=(($8)|0)!=(($11)|0);
      if ($12) { label = 3; break; } else { label = 4; break; }
    case 3: 
      label = 16; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $16=$d;
      var $17=$16;
      var $18=$17 & 3;
      var $19=(($18)|0)!=0;
      if ($19) { label = 6; break; } else { var $24 = 0;label = 7; break; }
    case 6: 
      var $21=$3;
      var $22=(($21)|0)!=0;
      var $24 = $22;label = 7; break;
    case 7: 
      var $24;
      if ($24) { label = 8; break; } else { label = 10; break; }
    case 8: 
      var $26=$s;
      var $27=(($26+1)|0);
      $s=$27;
      var $28=HEAP8[($26)];
      var $29=$d;
      var $30=(($29+1)|0);
      $d=$30;
      HEAP8[($29)]=$28;
      label = 9; break;
    case 9: 
      var $32=$3;
      var $33=((($32)-(1))|0);
      $3=$33;
      label = 5; break;
    case 10: 
      var $35=$3;
      var $36=(($35)|0)!=0;
      if ($36) { label = 11; break; } else { label = 21; break; }
    case 11: 
      var $38=$d;
      var $39=$38;
      $wd=$39;
      var $40=$s;
      var $41=$40;
      $ws=$41;
      label = 12; break;
    case 12: 
      var $43=$3;
      var $44=(($43)>>>0) >= 4;
      if ($44) { label = 13; break; } else { label = 15; break; }
    case 13: 
      var $46=$ws;
      var $47=(($46+4)|0);
      $ws=$47;
      var $48=HEAP32[(($46)>>2)];
      var $49=$wd;
      var $50=(($49+4)|0);
      $wd=$50;
      HEAP32[(($49)>>2)]=$48;
      label = 14; break;
    case 14: 
      var $52=$3;
      var $53=((($52)-(4))|0);
      $3=$53;
      label = 12; break;
    case 15: 
      var $55=$wd;
      var $56=$55;
      $d=$56;
      var $57=$ws;
      var $58=$57;
      $s=$58;
      label = 16; break;
    case 16: 
      label = 17; break;
    case 17: 
      var $61=$3;
      var $62=(($61)|0)!=0;
      if ($62) { label = 18; break; } else { label = 20; break; }
    case 18: 
      var $64=$s;
      var $65=(($64+1)|0);
      $s=$65;
      var $66=HEAP8[($64)];
      var $67=$d;
      var $68=(($67+1)|0);
      $d=$68;
      HEAP8[($67)]=$66;
      label = 19; break;
    case 19: 
      var $70=$3;
      var $71=((($70)-(1))|0);
      $3=$71;
      label = 17; break;
    case 20: 
      label = 21; break;
    case 21: 
      var $74=$1;

      return $74;
    default: assert(0, "bad label: " + label);
  }
}
Module["_memcpy"] = _memcpy;_memcpy["X"]=1;

function __ZdlPv($ptr) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      $1=$ptr;
      var $2=$1;
      var $3=(($2)|0)!=0;
      if ($3) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $5=$1;
      _free($5);
      label = 4; break;
    case 4: 

      return;
    default: assert(0, "bad label: " + label);
  }
}


function _add_segment($m, $tbase, $tsize, $mmapped) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      var $4;
      var $old_top;
      var $oldsp;
      var $old_end;
      var $ssize;
      var $rawsp;
      var $offset;
      var $asp;
      var $csp;
      var $sp;
      var $ss;
      var $tnext;
      var $p;
      var $nfences;
      var $nextp;
      var $q;
      var $psize;
      var $tn;
      var $I;
      var $B;
      var $F;
      var $TP;
      var $H;
      var $I1;
      var $X;
      var $Y;
      var $N;
      var $K;
      var $T;
      var $K2;
      var $C;
      var $F3;
      $1=$m;
      $2=$tbase;
      $3=$tsize;
      $4=$mmapped;
      var $5=$1;
      var $6=(($5+24)|0);
      var $7=HEAP32[(($6)>>2)];
      var $8=$7;
      $old_top=$8;
      var $9=$1;
      var $10=$old_top;
      var $11=_segment_holding($9, $10);
      $oldsp=$11;
      var $12=$oldsp;
      var $13=(($12)|0);
      var $14=HEAP32[(($13)>>2)];
      var $15=$oldsp;
      var $16=(($15+4)|0);
      var $17=HEAP32[(($16)>>2)];
      var $18=(($14+$17)|0);
      $old_end=$18;
      $ssize=24;
      var $19=$old_end;
      var $20=$ssize;
      var $21=((($20)+(16))|0);
      var $22=((($21)+(7))|0);
      var $23=(((-$22))|0);
      var $24=(($19+$23)|0);
      $rawsp=$24;
      var $25=$rawsp;
      var $26=(($25+8)|0);
      var $27=$26;
      var $28=$27 & 7;
      var $29=(($28)|0)==0;
      if ($29) { label = 3; break; } else { label = 4; break; }
    case 3: 
      var $39 = 0;label = 5; break;
    case 4: 
      var $32=$rawsp;
      var $33=(($32+8)|0);
      var $34=$33;
      var $35=$34 & 7;
      var $36=(((8)-($35))|0);
      var $37=$36 & 7;
      var $39 = $37;label = 5; break;
    case 5: 
      var $39;
      $offset=$39;
      var $40=$rawsp;
      var $41=$offset;
      var $42=(($40+$41)|0);
      $asp=$42;
      var $43=$asp;
      var $44=$old_top;
      var $45=(($44+16)|0);
      var $46=(($43)>>>0) < (($45)>>>0);
      if ($46) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $48=$old_top;
      var $52 = $48;label = 8; break;
    case 7: 
      var $50=$asp;
      var $52 = $50;label = 8; break;
    case 8: 
      var $52;
      $csp=$52;
      var $53=$csp;
      var $54=$53;
      $sp=$54;
      var $55=$sp;
      var $56=$55;
      var $57=(($56+8)|0);
      var $58=$57;
      $ss=$58;
      var $59=$sp;
      var $60=$59;
      var $61=$ssize;
      var $62=(($60+$61)|0);
      var $63=$62;
      $tnext=$63;
      var $64=$tnext;
      $p=$64;
      $nfences=0;
      var $65=$1;
      var $66=$2;
      var $67=$66;
      var $68=$3;
      var $69=((($68)-(40))|0);
      _init_top($65, $67, $69);
      var $70=$ssize;
      var $71=$70 | 1;
      var $72=$71 | 2;
      var $73=$sp;
      var $74=(($73+4)|0);
      HEAP32[(($74)>>2)]=$72;
      var $75=$ss;
      var $76=$1;
      var $77=(($76+444)|0);
      var $78=$75;
      var $79=$77;
      assert(16 % 1 === 0);HEAP32[(($78)>>2)]=HEAP32[(($79)>>2)];HEAP32[((($78)+(4))>>2)]=HEAP32[((($79)+(4))>>2)];HEAP32[((($78)+(8))>>2)]=HEAP32[((($79)+(8))>>2)];HEAP32[((($78)+(12))>>2)]=HEAP32[((($79)+(12))>>2)];
      var $80=$2;
      var $81=$1;
      var $82=(($81+444)|0);
      var $83=(($82)|0);
      HEAP32[(($83)>>2)]=$80;
      var $84=$3;
      var $85=$1;
      var $86=(($85+444)|0);
      var $87=(($86+4)|0);
      HEAP32[(($87)>>2)]=$84;
      var $88=$4;
      var $89=$1;
      var $90=(($89+444)|0);
      var $91=(($90+12)|0);
      HEAP32[(($91)>>2)]=$88;
      var $92=$ss;
      var $93=$1;
      var $94=(($93+444)|0);
      var $95=(($94+8)|0);
      HEAP32[(($95)>>2)]=$92;
      label = 9; break;
    case 9: 
      var $97=$p;
      var $98=$97;
      var $99=(($98+4)|0);
      var $100=$99;
      $nextp=$100;
      var $101=$p;
      var $102=(($101+4)|0);
      HEAP32[(($102)>>2)]=7;
      var $103=$nfences;
      var $104=((($103)+(1))|0);
      $nfences=$104;
      var $105=$nextp;
      var $106=(($105+4)|0);
      var $107=$106;
      var $108=$old_end;
      var $109=(($107)>>>0) < (($108)>>>0);
      if ($109) { label = 10; break; } else { label = 11; break; }
    case 10: 
      var $111=$nextp;
      $p=$111;
      label = 12; break;
    case 11: 
      label = 13; break;
    case 12: 
      label = 9; break;
    case 13: 
      var $115=$csp;
      var $116=$old_top;
      var $117=(($115)|0)!=(($116)|0);
      if ($117) { label = 14; break; } else { label = 50; break; }
    case 14: 
      var $119=$old_top;
      var $120=$119;
      $q=$120;
      var $121=$csp;
      var $122=$old_top;
      var $123=$121;
      var $124=$122;
      var $125=((($123)-($124))|0);
      $psize=$125;
      var $126=$q;
      var $127=$126;
      var $128=$psize;
      var $129=(($127+$128)|0);
      var $130=$129;
      $tn=$130;
      var $131=$tn;
      var $132=(($131+4)|0);
      var $133=HEAP32[(($132)>>2)];
      var $134=$133 & -2;
      HEAP32[(($132)>>2)]=$134;
      var $135=$psize;
      var $136=$135 | 1;
      var $137=$q;
      var $138=(($137+4)|0);
      HEAP32[(($138)>>2)]=$136;
      var $139=$psize;
      var $140=$q;
      var $141=$140;
      var $142=$psize;
      var $143=(($141+$142)|0);
      var $144=$143;
      var $145=(($144)|0);
      HEAP32[(($145)>>2)]=$139;
      var $146=$psize;
      var $147=$146 >>> 3;
      var $148=(($147)>>>0) < 32;
      if ($148) { label = 15; break; } else { label = 22; break; }
    case 15: 
      var $150=$psize;
      var $151=$150 >>> 3;
      $I=$151;
      var $152=$I;
      var $153=$152 << 1;
      var $154=$1;
      var $155=(($154+40)|0);
      var $156=(($155+($153<<2))|0);
      var $157=$156;
      var $158=$157;
      $B=$158;
      var $159=$B;
      $F=$159;
      var $160=$1;
      var $161=(($160)|0);
      var $162=HEAP32[(($161)>>2)];
      var $163=$I;
      var $164=1 << $163;
      var $165=$162 & $164;
      var $166=(($165)|0)!=0;
      if ($166) { label = 17; break; } else { label = 16; break; }
    case 16: 
      var $168=$I;
      var $169=1 << $168;
      var $170=$1;
      var $171=(($170)|0);
      var $172=HEAP32[(($171)>>2)];
      var $173=$172 | $169;
      HEAP32[(($171)>>2)]=$173;
      label = 21; break;
    case 17: 
      var $175=$B;
      var $176=(($175+8)|0);
      var $177=HEAP32[(($176)>>2)];
      var $178=$177;
      var $179=$1;
      var $180=(($179+16)|0);
      var $181=HEAP32[(($180)>>2)];
      var $182=(($178)>>>0) >= (($181)>>>0);
      var $183=(($182)&1);
      var $184=($183);
      var $185=(($184)|0)!=0;
      if ($185) { label = 18; break; } else { label = 19; break; }
    case 18: 
      var $187=$B;
      var $188=(($187+8)|0);
      var $189=HEAP32[(($188)>>2)];
      $F=$189;
      label = 20; break;
    case 19: 
      _abort();
      throw "Reached an unreachable!"
    case 20: 
      label = 21; break;
    case 21: 
      var $193=$q;
      var $194=$B;
      var $195=(($194+8)|0);
      HEAP32[(($195)>>2)]=$193;
      var $196=$q;
      var $197=$F;
      var $198=(($197+12)|0);
      HEAP32[(($198)>>2)]=$196;
      var $199=$F;
      var $200=$q;
      var $201=(($200+8)|0);
      HEAP32[(($201)>>2)]=$199;
      var $202=$B;
      var $203=$q;
      var $204=(($203+12)|0);
      HEAP32[(($204)>>2)]=$202;
      label = 49; break;
    case 22: 
      var $206=$q;
      var $207=$206;
      $TP=$207;
      var $208=$psize;
      var $209=$208 >>> 8;
      $X=$209;
      var $210=$X;
      var $211=(($210)|0)==0;
      if ($211) { label = 23; break; } else { label = 24; break; }
    case 23: 
      $I1=0;
      label = 28; break;
    case 24: 
      var $214=$X;
      var $215=(($214)>>>0) > 65535;
      if ($215) { label = 25; break; } else { label = 26; break; }
    case 25: 
      $I1=31;
      label = 27; break;
    case 26: 
      var $218=$X;
      $Y=$218;
      var $219=$Y;
      var $220=((($219)-(256))|0);
      var $221=$220 >>> 16;
      var $222=$221 & 8;
      $N=$222;
      var $223=$N;
      var $224=$Y;
      var $225=$224 << $223;
      $Y=$225;
      var $226=((($225)-(4096))|0);
      var $227=$226 >>> 16;
      var $228=$227 & 4;
      $K=$228;
      var $229=$K;
      var $230=$N;
      var $231=((($230)+($229))|0);
      $N=$231;
      var $232=$K;
      var $233=$Y;
      var $234=$233 << $232;
      $Y=$234;
      var $235=((($234)-(16384))|0);
      var $236=$235 >>> 16;
      var $237=$236 & 2;
      $K=$237;
      var $238=$N;
      var $239=((($238)+($237))|0);
      $N=$239;
      var $240=$N;
      var $241=(((14)-($240))|0);
      var $242=$K;
      var $243=$Y;
      var $244=$243 << $242;
      $Y=$244;
      var $245=$244 >>> 15;
      var $246=((($241)+($245))|0);
      $K=$246;
      var $247=$K;
      var $248=$247 << 1;
      var $249=$psize;
      var $250=$K;
      var $251=((($250)+(7))|0);
      var $252=$249 >>> (($251)>>>0);
      var $253=$252 & 1;
      var $254=((($248)+($253))|0);
      $I1=$254;
      label = 27; break;
    case 27: 
      label = 28; break;
    case 28: 
      var $257=$I1;
      var $258=$1;
      var $259=(($258+304)|0);
      var $260=(($259+($257<<2))|0);
      $H=$260;
      var $261=$I1;
      var $262=$TP;
      var $263=(($262+28)|0);
      HEAP32[(($263)>>2)]=$261;
      var $264=$TP;
      var $265=(($264+16)|0);
      var $266=(($265+4)|0);
      HEAP32[(($266)>>2)]=0;
      var $267=$TP;
      var $268=(($267+16)|0);
      var $269=(($268)|0);
      HEAP32[(($269)>>2)]=0;
      var $270=$1;
      var $271=(($270+4)|0);
      var $272=HEAP32[(($271)>>2)];
      var $273=$I1;
      var $274=1 << $273;
      var $275=$272 & $274;
      var $276=(($275)|0)!=0;
      if ($276) { label = 30; break; } else { label = 29; break; }
    case 29: 
      var $278=$I1;
      var $279=1 << $278;
      var $280=$1;
      var $281=(($280+4)|0);
      var $282=HEAP32[(($281)>>2)];
      var $283=$282 | $279;
      HEAP32[(($281)>>2)]=$283;
      var $284=$TP;
      var $285=$H;
      HEAP32[(($285)>>2)]=$284;
      var $286=$H;
      var $287=$286;
      var $288=$TP;
      var $289=(($288+24)|0);
      HEAP32[(($289)>>2)]=$287;
      var $290=$TP;
      var $291=$TP;
      var $292=(($291+12)|0);
      HEAP32[(($292)>>2)]=$290;
      var $293=$TP;
      var $294=(($293+8)|0);
      HEAP32[(($294)>>2)]=$290;
      label = 48; break;
    case 30: 
      var $296=$H;
      var $297=HEAP32[(($296)>>2)];
      $T=$297;
      var $298=$psize;
      var $299=$I1;
      var $300=(($299)|0)==31;
      if ($300) { label = 31; break; } else { label = 32; break; }
    case 31: 
      var $309 = 0;label = 33; break;
    case 32: 
      var $303=$I1;
      var $304=$303 >>> 1;
      var $305=((($304)+(8))|0);
      var $306=((($305)-(2))|0);
      var $307=(((31)-($306))|0);
      var $309 = $307;label = 33; break;
    case 33: 
      var $309;
      var $310=$298 << $309;
      $K2=$310;
      label = 34; break;
    case 34: 
      var $312=$T;
      var $313=(($312+4)|0);
      var $314=HEAP32[(($313)>>2)];
      var $315=$314 & -8;
      var $316=$psize;
      var $317=(($315)|0)!=(($316)|0);
      if ($317) { label = 35; break; } else { label = 41; break; }
    case 35: 
      var $319=$K2;
      var $320=$319 >>> 31;
      var $321=$320 & 1;
      var $322=$T;
      var $323=(($322+16)|0);
      var $324=(($323+($321<<2))|0);
      $C=$324;
      var $325=$K2;
      var $326=$325 << 1;
      $K2=$326;
      var $327=$C;
      var $328=HEAP32[(($327)>>2)];
      var $329=(($328)|0)!=0;
      if ($329) { label = 36; break; } else { label = 37; break; }
    case 36: 
      var $331=$C;
      var $332=HEAP32[(($331)>>2)];
      $T=$332;
      label = 40; break;
    case 37: 
      var $334=$C;
      var $335=$334;
      var $336=$1;
      var $337=(($336+16)|0);
      var $338=HEAP32[(($337)>>2)];
      var $339=(($335)>>>0) >= (($338)>>>0);
      var $340=(($339)&1);
      var $341=($340);
      var $342=(($341)|0)!=0;
      if ($342) { label = 38; break; } else { label = 39; break; }
    case 38: 
      var $344=$TP;
      var $345=$C;
      HEAP32[(($345)>>2)]=$344;
      var $346=$T;
      var $347=$TP;
      var $348=(($347+24)|0);
      HEAP32[(($348)>>2)]=$346;
      var $349=$TP;
      var $350=$TP;
      var $351=(($350+12)|0);
      HEAP32[(($351)>>2)]=$349;
      var $352=$TP;
      var $353=(($352+8)|0);
      HEAP32[(($353)>>2)]=$349;
      label = 47; break;
    case 39: 
      _abort();
      throw "Reached an unreachable!"
    case 40: 
      label = 46; break;
    case 41: 
      var $357=$T;
      var $358=(($357+8)|0);
      var $359=HEAP32[(($358)>>2)];
      $F3=$359;
      var $360=$T;
      var $361=$360;
      var $362=$1;
      var $363=(($362+16)|0);
      var $364=HEAP32[(($363)>>2)];
      var $365=(($361)>>>0) >= (($364)>>>0);
      if ($365) { label = 42; break; } else { var $374 = 0;label = 43; break; }
    case 42: 
      var $367=$F3;
      var $368=$367;
      var $369=$1;
      var $370=(($369+16)|0);
      var $371=HEAP32[(($370)>>2)];
      var $372=(($368)>>>0) >= (($371)>>>0);
      var $374 = $372;label = 43; break;
    case 43: 
      var $374;
      var $375=(($374)&1);
      var $376=($375);
      var $377=(($376)|0)!=0;
      if ($377) { label = 44; break; } else { label = 45; break; }
    case 44: 
      var $379=$TP;
      var $380=$F3;
      var $381=(($380+12)|0);
      HEAP32[(($381)>>2)]=$379;
      var $382=$T;
      var $383=(($382+8)|0);
      HEAP32[(($383)>>2)]=$379;
      var $384=$F3;
      var $385=$TP;
      var $386=(($385+8)|0);
      HEAP32[(($386)>>2)]=$384;
      var $387=$T;
      var $388=$TP;
      var $389=(($388+12)|0);
      HEAP32[(($389)>>2)]=$387;
      var $390=$TP;
      var $391=(($390+24)|0);
      HEAP32[(($391)>>2)]=0;
      label = 47; break;
    case 45: 
      _abort();
      throw "Reached an unreachable!"
    case 46: 
      label = 34; break;
    case 47: 
      label = 48; break;
    case 48: 
      label = 49; break;
    case 49: 
      label = 50; break;
    case 50: 

      return;
    default: assert(0, "bad label: " + label);
  }
}
_add_segment["X"]=1;

function __Znwj($size) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $p;
      var $nh;
      var $2;
      var $3;
      $1=$size;
      var $4=$1;
      var $5=(($4)|0)==0;
      if ($5) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $1=1;
      label = 4; break;
    case 4: 
      label = 5; break;
    case 5: 
      var $9=$1;
      var $10=_malloc($9);
      $p=$10;
      var $11=(($10)|0)==0;
      if ($11) { label = 6; break; } else { label = 14; break; }
    case 6: 
      var $13=__ZSt15get_new_handlerv();
      $nh=$13;
      var $14=$nh;
      var $15=(($14)|0)!=0;
      if ($15) { label = 7; break; } else { label = 12; break; }
    case 7: 
      var $17=$nh;
      (function() { try { __THREW__ = 0; return FUNCTION_TABLE[$17]() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 8; break; } else { label = 9; break; }
    case 8: 
      label = 13; break;
    case 9: 
      var $20$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]); $20$1 = tempRet0;
      var $21=$20$0;
      $2=$21;
      var $22=$20$1;
      $3=$22;
      label = 10; break;
    case 10: 
      var $24=$3;
      var $25=(($24)|0) < 0;
      if ($25) { label = 11; break; } else { label = 15; break; }
    case 11: 
      var $27=$2;
      ___cxa_call_unexpected($27);
      throw "Reached an unreachable!"
    case 12: 
      var $29=___cxa_allocate_exception(4);
      var $30=$29;
      FUNCTION_TABLE[__ZNSt9bad_allocC1Ev]($30);
      (function() { try { __THREW__ = 0; return ___cxa_throw($29, 5243696, (6)) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 16; break; } else { label = 9; break; }
    case 13: 
      label = 5; break;
    case 14: 
      var $33=$p;

      return $33;
    case 15: 
      var $35=$2;
      var $36=$3;
      var $37$0=$35;
      var $37$1=0;
      var $38$0=$37$0;
      var $38$1=$36;
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) { HEAP32[((_llvm_eh_exception.buf)>>2)]=$38$0 } throw ptr;;
    case 16: 
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + label);
  }
}
__Znwj["X"]=1;

function __ZnwjRKSt9nothrow_t($size, $0) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $2;
      var $3;
      var $p;
      var $4;
      var $5;
      $2=$size;
      $3=$0;
      $p=0;
      var $6=$2;
      var $7 = (function() { try { __THREW__ = 0; return __Znwj($6) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $p=$7;
      label = 7; break;
    case 4: 
      var $10$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[0]); $10$1 = tempRet0;
      var $11=$10$0;
      $4=$11;
      var $12=$10$1;
      $5=$12;
      label = 5; break;
    case 5: 
      var $14=$4;
      var $15=___cxa_begin_catch($14);
      (function() { try { __THREW__ = 0; return ___cxa_end_catch() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 6; break; } else { label = 8; break; }
    case 6: 
      label = 7; break;
    case 7: 
      var $18=$p;

      return $18;
    case 8: 
      var $20$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]); $20$1 = tempRet0;
      var $21=$20$0;
      $4=$21;
      var $22=$20$1;
      $5=$22;
      label = 9; break;
    case 9: 
      var $24=$4;
      ___cxa_call_unexpected($24);
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + label);
  }
}


function __Znaj($size) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $3;
      $1=$size;
      var $4=$1;
      var $5 = (function() { try { __THREW__ = 0; return __Znwj($4) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 3; break; } else { label = 4; break; }
    case 3: 

      return $5;
    case 4: 
      var $8$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]); $8$1 = tempRet0;
      var $9=$8$0;
      $2=$9;
      var $10=$8$1;
      $3=$10;
      label = 5; break;
    case 5: 
      var $12=$3;
      var $13=(($12)|0) < 0;
      if ($13) { label = 6; break; } else { label = 7; break; }
    case 6: 
      var $15=$2;
      ___cxa_call_unexpected($15);
      throw "Reached an unreachable!"
    case 7: 
      var $17=$2;
      var $18=$3;
      var $19$0=$17;
      var $19$1=0;
      var $20$0=$19$0;
      var $20$1=$18;
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) { HEAP32[((_llvm_eh_exception.buf)>>2)]=$20$0 } throw ptr;;
    default: assert(0, "bad label: " + label);
  }
}


function __ZnajRKSt9nothrow_t($size, $nothrow) {
  var label = 0;

  label = 2; 
  while(1) switch(label) {
    case 2: 
      var $1;
      var $2;
      var $p;
      var $3;
      var $4;
      $1=$size;
      $2=$nothrow;
      $p=0;
      var $5=$1;
      var $6 = (function() { try { __THREW__ = 0; return __Znaj($5) } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 3; break; } else { label = 4; break; }
    case 3: 
      $p=$6;
      label = 7; break;
    case 4: 
      var $9$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[0]); $9$1 = tempRet0;
      var $10=$9$0;
      $3=$10;
      var $11=$9$1;
      $4=$11;
      label = 5; break;
    case 5: 
      var $13=$3;
      var $14=___cxa_begin_catch($13);
      (function() { try { __THREW__ = 0; return ___cxa_end_catch() } catch(e) { if (typeof e != "number") throw e; if (ABORT) throw e; __THREW__ = 1; return null } })();if (!__THREW__) { label = 6; break; } else { label = 8; break; }
    case 6: 
      label = 7; break;
    case 7: 
      var $17=$p;

      return $17;
    case 8: 
      var $19$0 = ___cxa_find_matching_catch(HEAP32[((_llvm_eh_exception.buf)>>2)],HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)],[]); $19$1 = tempRet0;
      var $20=$19$0;
      $3=$20;
      var $21=$19$1;
      $4=$21;
      label = 9; break;
    case 9: 
      var $23=$3;
      ___cxa_call_unexpected($23);
      throw "Reached an unreachable!"
    default: assert(0, "bad label: " + label);
  }
}


function __ZNKSt9bad_alloc4whatEv($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;

  return ((5242976)|0);
}


function __ZNKSt20bad_array_new_length4whatEv($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;

  return ((5243068)|0);
}


function __ZSt15set_new_handlerPFvvE($handler) {
  var label = 0;


  var $1;
  $1=$handler;
  var $2=$1;
  var $3=$2;
  var $4=(tempValue=HEAP32[((5243724)>>2)],HEAP32[((5243724)>>2)]=$3,tempValue);
  var $5=$4;

  return $5;
}


function __ZNSt9bad_allocC2Ev($this) {
  var label = 0;


  var $1;
  var $2;
  $2=$this;
  var $3=$2;
  var $4=$3;
  $1=$4;
  var $5=$1;
  var $6=$5;
  HEAP32[(($6)>>2)]=((__ZTVSt9exception+8)|0);
  var $7=$3;
  HEAP32[(($7)>>2)]=((5243612)|0);

  return;
}


function __ZdlPvRKSt9nothrow_t($ptr, $0) {
  var label = 0;


  var $2;
  var $3;
  $2=$ptr;
  $3=$0;
  var $4=$2;
  __ZdlPv($4);

  return;
}


function __ZdaPv($ptr) {
  var label = 0;


  var $1;
  $1=$ptr;
  var $2=$1;
  __ZdlPv($2);

  return;
}


function __ZdaPvRKSt9nothrow_t($ptr, $0) {
  var label = 0;


  var $2;
  var $3;
  $2=$ptr;
  $3=$0;
  var $4=$2;
  __ZdaPv($4);

  return;
}


function __ZNSt9bad_allocD0Ev($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;
  FUNCTION_TABLE[__ZNSt9bad_allocD1Ev]($2);
  var $3=$2;
  __ZdlPv($3);

  return;
}


function __ZNSt9bad_allocD2Ev($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;
  var $3=$2;


  return;
}


function __ZNSt20bad_array_new_lengthC2Ev($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;
  var $3=$2;
  __ZNSt9bad_allocC2Ev($3);
  var $4=$2;
  HEAP32[(($4)>>2)]=((5243636)|0);

  return;
}


function __ZNSt20bad_array_new_lengthD0Ev($this) {
  var label = 0;


  var $1;
  $1=$this;
  var $2=$1;
  FUNCTION_TABLE[__ZNSt20bad_array_new_lengthD1Ev]($2);
  var $3=$2;
  __ZdlPv($3);

  return;
}


function __ZSt17__throw_bad_allocv() {
  var label = 0;


  var $1=___cxa_allocate_exception(4);
  var $2=$1;
  FUNCTION_TABLE[__ZNSt9bad_allocC1Ev]($2);
  ___cxa_throw($1, 5243696, (6));
  throw "Reached an unreachable!"

  return;
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


Runtime.typeInfo = {"%union.anon.0":{"alignSize":4,"flatIndexes":[0],"fields":["%struct.anon.1"],"flatSize":240,"flatFactor":240,"packed":false},"%struct._glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"[5 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16],"fields":["i8*","i8*","i8*","i8*","i8*"],"flatSize":20,"flatFactor":4},"%struct._atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"%struct.malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[14 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":14,"flatFactor":1},"[0 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"{ i8*,i8*,i8* }":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["i8*","i8*","i8*"],"flatSize":12,"flatFactor":4,"packed":false},"%\"class.std::bad_alloc\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::exception\""],"flatSize":4,"flatFactor":4,"packed":false},"[30 x i32]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":120,"flatFactor":4},"%\"class.std::exception\"":{"alignSize":4,"flatIndexes":[0],"fields":["i32 (...)**"],"flatSize":4,"flatFactor":4,"packed":false},"%struct.malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"[2 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"[0 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":8,"flatFactor":4},"void (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"void (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[32 x void ()*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*","void ()*"],"flatSize":128,"flatFactor":4},"[0 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"%struct.mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"[13 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":13,"flatFactor":1},"%struct.pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[32 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"%union.anon":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4,"packed":false},"[3 x i8]":{"alignSize":1,"flatIndexes":[0,1,2],"fields":["i8","i8","i8"],"flatSize":3,"flatFactor":1},"[25 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":25,"flatFactor":1},"[32 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":128,"flatFactor":4},"[21 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":21,"flatFactor":1},"[3 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"%struct.__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"[0 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4},"[15 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":15,"flatFactor":1},"void ()":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[0 x void ()*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["void ()*","void ()*"],"flatSize":8,"flatFactor":4},"%struct.malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"[26 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":26,"flatFactor":1},"[30 x i8*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116],"fields":["i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*","i8*"],"flatSize":120,"flatFactor":4},"[0 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[1 x i8]":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1},"i8* (%\"class.std::bad_alloc\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"%struct._Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"%struct.malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,460,464],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":468,"packed":false},"%struct.pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[0 x %struct.__sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"i32 (%struct.pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct._reent":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1060,"packed":false},"[1 x i32]":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"%struct.region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"%struct.pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[22 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":22,"flatFactor":1},"%\"class.std::bad_array_new_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"%struct.anon.1":{"alignSize":4,"flatIndexes":[0,120],"fields":["[30 x i8*]","[30 x i32]"],"flatSize":240,"flatFactor":120,"packed":false},"i8* (%\"class.std::bad_array_new_length\"*)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"[2 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"%\"struct.std::nothrow_t\"":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1,"packed":false},"%struct._mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"[18 x i8]":{"alignSize":1,"flatIndexes":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],"fields":["i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8","i8"],"flatSize":18,"flatFactor":1},"%struct.__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false},"_glue":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["%struct._glue*","i32","%struct.__sFILE*"],"flatSize":12,"flatFactor":4,"packed":false},"_atexit":{"alignSize":4,"flatIndexes":[0,4,8,136],"fields":["%struct._atexit*","i32","[32 x void ()*]","%struct._on_exit_args"],"flatSize":400,"packed":false},"malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[0 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":8,"flatFactor":4},"malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[32 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[3 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104,208],"fields":["%struct.__sFILE","%struct.__sFILE","%struct.__sFILE"],"flatSize":312,"flatFactor":104},"[66 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,76,80,84,88,92,96,100,104,108,112,116,120,124,128,132,136,140,144,148,152,156,160,164,168,172,176,180,184,188,192,196,200,204,208,212,216,220,224,228,232,236,240,244,248,252,256,260],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"__sFILE":{"alignSize":4,"flatIndexes":[0,4,8,12,14,16,24,28,32,36,40,44,48,56,60,64,67,68,76,80,84,88,92,100],"fields":["i8*","i32","i32","i16","i16","%struct.__sbuf","i32","i8*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i8*, i32)*","i32 (%struct._reent*, i8*, i32, i32)*","i32 (%struct._reent*, i8*)*","%struct.__sbuf","i8*","i32","[3 x i8]","[1 x i8]","%struct.__sbuf","i32","i32","%struct._reent*","i32","%struct._mbstate_t","i32"],"flatSize":104,"packed":false},"malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"[0 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_on_exit_args":{"alignSize":4,"flatIndexes":[0,128,256,260],"fields":["[32 x i8*]","[32 x i8*]","i32","i32"],"flatSize":264,"packed":false},"_Bigint":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["%struct._Bigint*","i32","i32","i32","i32","[1 x i32]"],"flatSize":24,"flatFactor":4,"packed":false},"malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,460,464],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":468,"packed":false},"pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[0 x __sFILE]":{"alignSize":4,"flatIndexes":[0,104],"fields":["%struct.__sFILE","%struct.__sFILE"],"flatSize":208,"flatFactor":104},"i32 (pixman_region32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, %struct.pixman_box32*, i32, i32)":{"alignSize":4,"flatIndexes":[0],"fields":["i32"],"flatSize":4,"flatFactor":4},"_reent":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,48,52,56,60,64,68,72,76,80,84,88,328,332,732,736,748],"fields":["i32","%struct.__sFILE*","%struct.__sFILE*","%struct.__sFILE*","i32","[25 x i8]","i32","i8*","i32","void (%struct._reent*)*","%struct._Bigint*","i32","%struct._Bigint*","%struct._Bigint**","i32","i8*","%union.anon.0","%struct._atexit*","%struct._atexit","void (i32)**","%struct._glue","[3 x %struct.__sFILE]"],"flatSize":1060,"packed":false},"region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"anon.1":{"alignSize":4,"flatIndexes":[0,120],"fields":["[30 x i8*]","[30 x i32]"],"flatSize":240,"flatFactor":120,"packed":false},"[2 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"_mbstate_t":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","%union.anon"],"flatSize":8,"flatFactor":4,"packed":false},"__sbuf":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i32"],"flatSize":8,"flatFactor":4,"packed":false}}
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

  return Module['_main'](argc, argv, 0);
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


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["__ZNKSt20bad_array_new_length4whatEv","_validate","_pixman_coalesce","_pixman_region32_init_rect","_pixman_rect_alloc","_pixman_region32_contains_point","_pixman_region32_copy","_pvalloc","_release_unused_segments","_pixman_region32_clear","__ZNKSt9bad_alloc4whatEv","__ZdlPvRKSt9nothrow_t","_pixman_region32_contains_rectangle","_pixman_region32_union_rect","_pixman_region32_selfcheck","_PIXREGION_SZOF","_malloc_trim","_pixman_region32_inverse","_mmap_resize","_malloc_usable_size","_pixman_region32_init_rects","__ZdlPv","_sys_alloc","_free","__ZNSt9bad_allocC2Ev","_change_mparam","_memalign","_independent_calloc","_pixman_region32_fini","_pixman_region32_intersect","_pixman_region_subtract_o","_pixman_region32_n_rects","_pixman_region32_translate","_pixman_region32_subtract","_tmalloc_small","_pixman_region32_init_with_extents","_find_box_for_y","__ZSt15get_new_handlerv","_tmalloc_large","_pixman_region32_equal","_pixman_region32_rectangles","__ZNSt9bad_allocD2Ev","_alloc_data","_pixman_region32_union","_quick_sort_rects","_pixman_region32_intersect_rect","__ZNSt20bad_array_new_lengthC2Ev","_pixman_region32_extents","__Znwj","__ZSt17__throw_bad_allocv","_pixman_region32_reset","_pixman_region32_not_empty","_sys_trim","_independent_comalloc","_pixman_region_append_non_o","_internal_mallinfo","_ialloc","_malloc_footprint","_prepend_alloc","__ZnwjRKSt9nothrow_t","_memcpy","_internal_memalign","_mallopt","_pixman_region32_print","__Znaj","_add_segment","_init_bins","_malloc","_malloc_max_footprint","_valloc","_pixman_set_extents","__ZNSt20bad_array_new_lengthD0Ev","_internal_malloc_stats","_pixman_break","__ZNSt9bad_allocD0Ev","_calloc","_mmap_alloc","_init_top","__ZSt15set_new_handlerPFvvE","_mallinfo","_internal_realloc","__ZdaPv","_malloc_stats","_init_mparams","_pixman_region32_init","_realloc","_segment_holding","_pixman_region_intersect_o","_pixman_region_union_o","_pixman_op","__ZnajRKSt9nothrow_t","__ZdaPvRKSt9nothrow_t"]


