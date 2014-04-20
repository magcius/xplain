// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
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
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
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

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
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
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



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
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
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
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
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
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
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
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
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
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
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
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
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
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
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
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

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
    var func = Module['_' + ident]; // closure exported function
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
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
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
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
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
  // TODO: use TextDecoder
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

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

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

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

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

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

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
    HEAP8[(((buffer)+(i))|0)]=chr;
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

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
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

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 2888;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });

var _stderr;
var _stderr=_stderr=allocate(1, "i32*", ALLOC_STATIC);




























































































var __ZTVN10__cxxabiv120__si_class_type_infoE;






var __ZTISt9exception;
var __ZTISt9exception=__ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);














var __ZNSt9bad_allocC1Ev;
var __ZNSt9bad_allocD1Ev;
var __ZNSt20bad_array_new_lengthC1Ev;
var __ZNSt20bad_array_new_lengthD1Ev;
var __ZNSt20bad_array_new_lengthD2Ev;
var __ZNSt16bad_array_lengthC1Ev;
var __ZNSt16bad_array_lengthD1Ev;
var __ZNSt16bad_array_lengthD2Ev;
var ___strtof_l;
var ___strtod_l;
var ___strtold_l;
/* memory initializer */ allocate([40,9,0,0,0,0,0,0,48,9,0,0,0,0,0,0,64,9,0,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,50,45,62,120,49,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,38,38,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,121,49,32,60,32,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,117,109,82,101,99,116,115,32,61,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,45,32,99,117,114,95,115,116,97,114,116,32,119,97,115,32,102,97,108,115,101,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,71,79,79,68,95,82,69,67,84,32,40,98,111,120,41,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,114,101,99,116,97,110,103,108,101,32,112,97,115,115,101,100,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,10,0,0,0,0,0,0,0,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,105,110,32,117,115,101,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,109,97,120,32,115,121,115,116,101,109,32,98,121,116,101,115,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,37,100,32,37,100,32,37,100,32,37,100,32,10,0,0,0,42,42,42,32,66,85,71,32,42,42,42,10,73,110,32,37,115,58,32,37,115,10,83,101,116,32,97,32,98,114,101,97,107,112,111,105,110,116,32,111,110,32,39,95,112,105,120,109,97,110,95,108,111,103,95,101,114,114,111,114,39,32,116,111,32,100,101,98,117,103,10,10,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,45,62,120,49,32,60,32,114,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,110,101,119,95,114,101,99,116,115,32,33,61,32,48,32,119,97,115,32,102,97,108,115,101,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,50,32,33,61,32,114,50,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,98,97,100,95,97,114,114,97,121,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,49,32,33,61,32,114,49,95,101,110,100,32,119,97,115,32,102,97,108,115,101,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,115,121,115,116,101,109,32,98,121,116,101,115,32,32,32,32,32,61,32,37,49,48,108,117,10,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,49,32,60,32,114,101,103,105,111,110,45,62,101,120,116,101,110,116,115,46,121,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,120,49,32,60,32,114,49,45,62,120,50,32,119,97,115,32,102,97,108,115,101,0,0,0,0,84,104,101,32,101,120,112,114,101,115,115,105,111,110,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,110,117,109,82,101,99,116,115,32,60,61,32,114,101,103,105,111,110,45,62,100,97,116,97,45,62,115,105,122,101,32,119,97,115,32,102,97,108,115,101,0,0,0,101,120,116,101,110,116,115,58,32,37,100,32,37,100,32,37,100,32,37,100,10,0,0,0,110,117,109,58,32,37,100,32,115,105,122,101,58,32,37,100,10,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,115,101,116,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,117,110,105,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,115,117,98,116,114,97,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,105,110,116,101,114,115,101,99,116,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,95,97,112,112,101,110,100,95,110,111,110,95,111,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,117,110,105,111,110,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,114,101,115,101,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,0,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,119,105,116,104,95,101,120,116,101,110,116,115,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,98,111,120,95,116,121,112,101,95,116,32,42,41,0,0,0,118,111,105,100,32,112,105,120,109,97,110,95,114,101,103,105,111,110,51,50,95,105,110,105,116,95,114,101,99,116,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,44,32,117,110,115,105,103,110,101,100,32,105,110,116,41,0,0,0,112,105,120,109,97,110,95,98,111,111,108,95,116,32,112,105,120,109,97,110,95,111,112,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,111,118,101,114,108,97,112,95,112,114,111,99,95,112,116,114,44,32,105,110,116,44,32,105,110,116,41,0,0,105,110,116,32,112,105,120,109,97,110,95,99,111,97,108,101,115,99,101,40,114,101,103,105,111,110,95,116,121,112,101,95,116,32,42,44,32,105,110,116,44,32,105,110,116,41,0,0,0,0,0,0,248,8,0,0,12,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,9,0,0,12,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,9,0,0,12,0,0,0,14,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,50,48,98,97,100,95,97,114,114,97,121,95,110,101,119,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,83,116,49,54,98,97,100,95,97,114,114,97,121,95,108,101,110,103,116,104,0,0,0,0,0,0,0,0,176,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,8,0,0,248,8,0,0,0,0,0,0,0,0,0,0,224,8,0,0,248,8,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



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


  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  Module["ERRNO_CODES"] = ERRNO_CODES;
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  Module["ERRNO_MESSAGES"] = ERRNO_MESSAGES;
  
  
  var ___errno_state=0;
  Module["___errno_state"] = ___errno_state;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  Module["___setErrNo"] = ___setErrNo;
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  Module["PATH"] = PATH;
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  Module["TTY"] = TTY;
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  Module["MEMFS"] = MEMFS;
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  Module["IDBFS"] = IDBFS;
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  Module["NODEFS"] = NODEFS;
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stdin"] = _stdin;
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stdout"] = _stdout;
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  Module["_stderr"] = _stderr;
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }
  Module["_fflush"] = _fflush;var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
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
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
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
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
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
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
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
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  Module["FS"] = FS;
  
  
  
  
  function _mkport() { throw 'TODO' }
  Module["_mkport"] = _mkport;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};
  Module["SOCKFS"] = SOCKFS;function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  Module["_send"] = _send;
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  Module["_pwrite"] = _pwrite;function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  Module["_write"] = _write;
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }
  Module["_fileno"] = _fileno;function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
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
          var flagPadSign = false;
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
              case 32:
                flagPadSign = true;
                break;
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
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
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
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
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
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
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
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
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
              HEAP32[((ptr)>>2)]=ret.length;
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

  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    }
  Module["_emscripten_memcpy_big"] = _emscripten_memcpy_big; 
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_llvm_memcpy_p0i8_p0i8_i32"] = _llvm_memcpy_p0i8_p0i8_i32;

  
   
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  Module["_llvm_memmove_p0i8_p0i8_i32"] = _llvm_memmove_p0i8_p0i8_i32;

  var _llvm_expect_i32=undefined;
  Module["_llvm_expect_i32"] = _llvm_expect_i32;

  function _abort() {
      Module['abort']();
    }
  Module["_abort"] = _abort;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_llvm_memset_p0i8_i32"] = _llvm_memset_p0i8_i32;

  function ___errno_location() {
      return ___errno_state;
    }
  Module["___errno_location"] = ___errno_location;

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

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  Module["_sysconf"] = _sysconf;

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }
  Module["_time"] = _time;

  
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
  
  
  
  var ___cxa_last_thrown_exception=0;
  Module["___cxa_last_thrown_exception"] = ___cxa_last_thrown_exception;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  Module["___resumeException"] = ___resumeException;
  
  var ___cxa_exception_header_size=8;
  Module["___cxa_exception_header_size"] = ___cxa_exception_header_size;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
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
  Module["___cxa_find_matching_catch"] = ___cxa_find_matching_catch;function ___gxx_personality_v0() {
    }
  Module["___gxx_personality_v0"] = ___gxx_personality_v0;

  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }
  Module["___cxa_allocate_exception"] = ___cxa_allocate_exception;

  function ___cxa_throw(ptr, type, destructor) {
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
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  Module["___cxa_throw"] = ___cxa_throw;

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  Module["___cxa_call_unexpected"] = ___cxa_call_unexpected;

  
  var ___cxa_caught_exceptions=[];
  Module["___cxa_caught_exceptions"] = ___cxa_caught_exceptions;function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }
  Module["___cxa_begin_catch"] = ___cxa_begin_catch;

  
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr - ___cxa_exception_header_size);
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
      // Call destructor if one is registered then clear it.
      var ptr = ___cxa_caught_exceptions.pop();
      if (ptr) {
        header = ptr - ___cxa_exception_header_size;
        var destructor = HEAP32[(((header)+(4))>>2)];
        if (destructor) {
          Runtime.dynCall('vi', destructor, [ptr]);
          HEAP32[(((header)+(4))>>2)]=0;
        }
        ___cxa_free_exception(ptr);
        ___cxa_last_thrown_exception = 0;
      }
    }
  Module["___cxa_end_catch"] = ___cxa_end_catch;

  function __ZNSt9exceptionD2Ev() {}
  Module["__ZNSt9exceptionD2Ev"] = __ZNSt9exceptionD2Ev;

  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  Module["_isspace"] = _isspace;

  function _llvm_lifetime_start() {}
  Module["_llvm_lifetime_start"] = _llvm_lifetime_start;

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }
  Module["_copysign"] = _copysign;var _copysignl=_copysign;
  Module["_copysignl"] = _copysignl;

  
  function _fmod(x, y) {
      return x % y;
    }
  Module["_fmod"] = _fmod;var _fmodl=_fmod;
  Module["_fmodl"] = _fmodl;

  var _fabs=Math_abs;
  Module["_fabs"] = _fabs;

  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }
  Module["_isdigit"] = _isdigit;

  var _llvm_memset_p0i8_i64=_memset;
  Module["_llvm_memset_p0i8_i64"] = _llvm_memset_p0i8_i64;

  function _llvm_lifetime_end() {}
  Module["_llvm_lifetime_end"] = _llvm_lifetime_end;

   
  Module["_tolower"] = _tolower;






  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
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
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
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
          img.onload = function img_onload() {
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
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
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
            audio.onerror = function audio_onerror(event) {
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
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
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
          GLctx = Module.ctx = ctx;
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
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
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
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
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
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
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
        xhr.onload = function xhr_onload() {
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
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};
  Module["Browser"] = Browser;
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

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

function invoke_fiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_fiii"](index,a1,a2,a3);
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

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
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

function invoke_diii(index,a1,a2,a3) {
  try {
    return Module["dynCall_diii"](index,a1,a2,a3);
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
  var __ZTISt9exception=env.__ZTISt9exception|0;
  var _stderr=env._stderr|0;
  var __ZTVN10__cxxabiv120__si_class_type_infoE=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;
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
  var invoke_fiii=env.invoke_fiii;
  var invoke_vi=env.invoke_vi;
  var invoke_ii=env.invoke_ii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_v=env.invoke_v;
  var invoke_iii=env.invoke_iii;
  var invoke_diii=env.invoke_diii;
  var _llvm_lifetime_end=env._llvm_lifetime_end;
  var _sysconf=env._sysconf;
  var ___cxa_throw=env.___cxa_throw;
  var _abort=env._abort;
  var _fprintf=env._fprintf;
  var ___cxa_end_catch=env.___cxa_end_catch;
  var ___cxa_free_exception=env.___cxa_free_exception;
  var _isdigit=env._isdigit;
  var _fflush=env._fflush;
  var __reallyNegative=env.__reallyNegative;
  var _fabs=env._fabs;
  var _llvm_lifetime_start=env._llvm_lifetime_start;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _send=env._send;
  var _write=env._write;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var _isspace=env._isspace;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var ___cxa_is_number_type=env.___cxa_is_number_type;
  var ___resumeException=env.___resumeException;
  var __formatString=env.__formatString;
  var ___cxa_does_inherit=env.___cxa_does_inherit;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _fileno=env._fileno;
  var _pwrite=env._pwrite;
  var ___cxa_call_unexpected=env.___cxa_call_unexpected;
  var _sbrk=env._sbrk;
  var ___errno_location=env.___errno_location;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var __ZNSt9exceptionD2Ev=env.__ZNSt9exceptionD2Ev;
  var _mkport=env._mkport;
  var _copysign=env._copysign;
  var _fmod=env._fmod;
  var _time=env._time;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
STACKTOP = (STACKTOP + 7)&-8;
  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1|0] = HEAP8[ptr+1|0];
  HEAP8[tempDoublePtr+2|0] = HEAP8[ptr+2|0];
  HEAP8[tempDoublePtr+3|0] = HEAP8[ptr+3|0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1|0] = HEAP8[ptr+1|0];
  HEAP8[tempDoublePtr+2|0] = HEAP8[ptr+2|0];
  HEAP8[tempDoublePtr+3|0] = HEAP8[ptr+3|0];
  HEAP8[tempDoublePtr+4|0] = HEAP8[ptr+4|0];
  HEAP8[tempDoublePtr+5|0] = HEAP8[ptr+5|0];
  HEAP8[tempDoublePtr+6|0] = HEAP8[ptr+6|0];
  HEAP8[tempDoublePtr+7|0] = HEAP8[ptr+7|0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}

function setTempRet1(value) {
  value = value|0;
  tempRet1 = value;
}

function setTempRet2(value) {
  value = value|0;
  tempRet2 = value;
}

function setTempRet3(value) {
  value = value|0;
  tempRet3 = value;
}

function setTempRet4(value) {
  value = value|0;
  tempRet4 = value;
}

function setTempRet5(value) {
  value = value|0;
  tempRet5 = value;
}

function setTempRet6(value) {
  value = value|0;
  tempRet6 = value;
}

function setTempRet7(value) {
  value = value|0;
  tempRet7 = value;
}

function setTempRet8(value) {
  value = value|0;
  tempRet8 = value;
}

function setTempRet9(value) {
  value = value|0;
  tempRet9 = value;
}
function runPostSets() {

HEAP32[((2296 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2304 )>>2)]=__ZTISt9exception;
HEAP32[((2312 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((2328 )>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
}

function _pixman_region32_equal($reg1,$reg2){
 $reg1=($reg1)|0;
 $reg2=($reg2)|0;
 var $1=0,$2=0,$3=0,$i=0,$rects1=0,$rects2=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$15=0,$16=0,$17=0,$18=0,$19=0;
 var $20=0,$21=0,$22=0,$23=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0;
 var $44=0,$45=0,$48=0,$49=0,$50=0,$51=0,$53=0,$54=0,$55=0,$56=0,$57=0,$60=0,$61=0,$62=0,$63=0,$64=0,$66=0,$67=0,$68=0,$69=0;
 var $70=0,$73=0,$74=0,$77=0,$78=0,$79=0,$80=0,$82=0,$83=0,$84=0,$85=0,$86=0,$88=0,$89=0,$91=0,$92=0,$93=0,$94=0,$95=0,$97=0;
 var $98=0,$99=0,$100=0,$101=0,$103=0,$104=0,$106=0,$108=0,$109=0,$110=0,$111=0,$112=0,$114=0,$115=0,$116=0,$117=0,$118=0,$121=0,$122=0,$124=0;
 var $125=0,$126=0,$127=0,$128=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$137=0,$138=0,$139=0,$140=0,$141=0,$142=0,$143=0,$144=0,$145=0,$146=0;
 var $147=0,$150=0,$151=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$160=0,$163=0,$164=0,$165=0,$166=0,$167=0,$168=0,$169=0,$170=0;
 var $171=0,$172=0,$173=0,$177=0,$178=0,$181=0,label=0;
 var sp=0;sp=STACKTOP;






 $2=$reg1;
 $3=$reg2;
 $4=$2;
 $5=(($4)|0);
 $6=(($5)|0);
 $7=((HEAP32[(($6)>>2)])|0);
 $8=$3;
 $9=(($8)|0);
 $10=(($9)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $12=($7|0)!=($11|0);
 if ($12) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 $15=$2;
 $16=(($15)|0);
 $17=(($16+8)|0);
 $18=((HEAP32[(($17)>>2)])|0);
 $19=$3;
 $20=(($19)|0);
 $21=(($20+8)|0);
 $22=((HEAP32[(($21)>>2)])|0);
 $23=($18|0)!=($22|0);
 if ($23) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 $26=$2;
 $27=(($26)|0);
 $28=(($27+4)|0);
 $29=((HEAP32[(($28)>>2)])|0);
 $30=$3;
 $31=(($30)|0);
 $32=(($31+4)|0);
 $33=((HEAP32[(($32)>>2)])|0);
 $34=($29|0)!=($33|0);
 if ($34) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 $37=$2;
 $38=(($37)|0);
 $39=(($38+12)|0);
 $40=((HEAP32[(($39)>>2)])|0);
 $41=$3;
 $42=(($41)|0);
 $43=(($42+12)|0);
 $44=((HEAP32[(($43)>>2)])|0);
 $45=($40|0)!=($44|0);
 if ($45) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 $48=$2;
 $49=(($48+16)|0);
 $50=((HEAP32[(($49)>>2)])|0);
 $51=($50|0)!=0;
 if ($51) {
  $53=$2;
  $54=(($53+16)|0);
  $55=((HEAP32[(($54)>>2)])|0);
  $56=(($55+4)|0);
  $57=((HEAP32[(($56)>>2)])|0);
  $60=$57;
 } else {
  $60=1;
 }

 $61=$3;
 $62=(($61+16)|0);
 $63=((HEAP32[(($62)>>2)])|0);
 $64=($63|0)!=0;
 if ($64) {
  $66=$3;
  $67=(($66+16)|0);
  $68=((HEAP32[(($67)>>2)])|0);
  $69=(($68+4)|0);
  $70=((HEAP32[(($69)>>2)])|0);
  $73=$70;
 } else {
  $73=1;
 }

 $74=($60|0)!=($73|0);
 if ($74) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 $77=$2;
 $78=(($77+16)|0);
 $79=((HEAP32[(($78)>>2)])|0);
 $80=($79|0)!=0;
 if ($80) {
  $82=$2;
  $83=(($82+16)|0);
  $84=((HEAP32[(($83)>>2)])|0);
  $85=(($84+8)|0);
  $86=$85;
  $91=$86;
 } else {
  $88=$2;
  $89=(($88)|0);
  $91=$89;
 }

 $rects1=$91;
 $92=$3;
 $93=(($92+16)|0);
 $94=((HEAP32[(($93)>>2)])|0);
 $95=($94|0)!=0;
 if ($95) {
  $97=$3;
  $98=(($97+16)|0);
  $99=((HEAP32[(($98)>>2)])|0);
  $100=(($99+8)|0);
  $101=$100;
  $106=$101;
 } else {
  $103=$3;
  $104=(($103)|0);
  $106=$104;
 }

 $rects2=$106;
 $i=0;
 while(1) {
  $108=$i;
  $109=$2;
  $110=(($109+16)|0);
  $111=((HEAP32[(($110)>>2)])|0);
  $112=($111|0)!=0;
  if ($112) {
   $114=$2;
   $115=(($114+16)|0);
   $116=((HEAP32[(($115)>>2)])|0);
   $117=(($116+4)|0);
   $118=((HEAP32[(($117)>>2)])|0);
   $121=$118;
  } else {
   $121=1;
  }

  $122=($108|0)!=($121|0);
  if (!($122)) {
   label = 38;
   break;
  }
  $124=$i;
  $125=$rects1;
  $126=(($125+($124<<4))|0);
  $127=(($126)|0);
  $128=((HEAP32[(($127)>>2)])|0);
  $129=$i;
  $130=$rects2;
  $131=(($130+($129<<4))|0);
  $132=(($131)|0);
  $133=((HEAP32[(($132)>>2)])|0);
  $134=($128|0)!=($133|0);
  if ($134) {
   label = 29;
   break;
  }
  $137=$i;
  $138=$rects1;
  $139=(($138+($137<<4))|0);
  $140=(($139+8)|0);
  $141=((HEAP32[(($140)>>2)])|0);
  $142=$i;
  $143=$rects2;
  $144=(($143+($142<<4))|0);
  $145=(($144+8)|0);
  $146=((HEAP32[(($145)>>2)])|0);
  $147=($141|0)!=($146|0);
  if ($147) {
   label = 31;
   break;
  }
  $150=$i;
  $151=$rects1;
  $152=(($151+($150<<4))|0);
  $153=(($152+4)|0);
  $154=((HEAP32[(($153)>>2)])|0);
  $155=$i;
  $156=$rects2;
  $157=(($156+($155<<4))|0);
  $158=(($157+4)|0);
  $159=((HEAP32[(($158)>>2)])|0);
  $160=($154|0)!=($159|0);
  if ($160) {
   label = 33;
   break;
  }
  $163=$i;
  $164=$rects1;
  $165=(($164+($163<<4))|0);
  $166=(($165+12)|0);
  $167=((HEAP32[(($166)>>2)])|0);
  $168=$i;
  $169=$rects2;
  $170=(($169+($168<<4))|0);
  $171=(($170+12)|0);
  $172=((HEAP32[(($171)>>2)])|0);
  $173=($167|0)!=($172|0);
  if ($173) {
   label = 35;
   break;
  }
  $177=$i;
  $178=((($177)+(1))|0);
  $i=$178;
 }
 if ((label|0) == 29) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 else if ((label|0) == 31) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 else if ((label|0) == 33) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 else if ((label|0) == 35) {
  $1=0;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
 else if ((label|0) == 38) {
  $1=1;
  $181=$1;
  STACKTOP=sp;return (($181)|0);
 }
  return 0;
}


function _pixman_region32_print($rgn){
 $rgn=($rgn)|0;
 var $1=0,$num=0,$size=0,$i=0,$rects=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0;
 var $21=0,$22=0,$23=0,$24=0,$27=0,$28=0,$29=0,$30=0,$31=0,$33=0,$34=0,$35=0,$36=0,$37=0,$39=0,$40=0,$42=0,$43=0,$44=0,$45=0;
 var $46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$66=0;
 var $67=0,$68=0,$70=0,$71=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$85=0,$86=0,$87=0;
 var $88=0,$89=0,$90=0,$91=0,$93=0,$94=0,$96=0,$97=0,$98=0,label=0;
 var tempVarArgs=0;
 var sp=0;sp=STACKTOP;





 $1=$rgn;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if ($5) {
  $7=$1;
  $8=(($7+16)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=(($9+4)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $14=$11;
 } else {
  $14=1;
 }

 $num=$14;
 $15=$1;
 $16=(($15+16)|0);
 $17=((HEAP32[(($16)>>2)])|0);
 $18=($17|0)!=0;
 if ($18) {
  $20=$1;
  $21=(($20+16)|0);
  $22=((HEAP32[(($21)>>2)])|0);
  $23=(($22)|0);
  $24=((HEAP32[(($23)>>2)])|0);
  $27=$24;
 } else {
  $27=0;
 }

 $size=$27;
 $28=$1;
 $29=(($28+16)|0);
 $30=((HEAP32[(($29)>>2)])|0);
 $31=($30|0)!=0;
 if ($31) {
  $33=$1;
  $34=(($33+16)|0);
  $35=((HEAP32[(($34)>>2)])|0);
  $36=(($35+8)|0);
  $37=$36;
  $42=$37;
 } else {
  $39=$1;
  $40=(($39)|0);
  $42=$40;
 }

 $rects=$42;
 $43=((HEAP32[((_stderr)>>2)])|0);
 $44=$num;
 $45=$size;
 $46=((_fprintf((($43)|0),((1088)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,HEAP32[((tempVarArgs)>>2)]=$44,HEAP32[(((tempVarArgs)+(8))>>2)]=$45,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $47=((HEAP32[((_stderr)>>2)])|0);
 $48=$1;
 $49=(($48)|0);
 $50=(($49)|0);
 $51=((HEAP32[(($50)>>2)])|0);
 $52=$1;
 $53=(($52)|0);
 $54=(($53+4)|0);
 $55=((HEAP32[(($54)>>2)])|0);
 $56=$1;
 $57=(($56)|0);
 $58=(($57+8)|0);
 $59=((HEAP32[(($58)>>2)])|0);
 $60=$1;
 $61=(($60)|0);
 $62=(($61+12)|0);
 $63=((HEAP32[(($62)>>2)])|0);
 $64=((_fprintf((($47)|0),((1064)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,HEAP32[((tempVarArgs)>>2)]=$51,HEAP32[(((tempVarArgs)+(8))>>2)]=$55,HEAP32[(((tempVarArgs)+(16))>>2)]=$59,HEAP32[(((tempVarArgs)+(24))>>2)]=$63,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $i=0;
 while(1) {
  $66=$i;
  $67=$num;
  $68=($66|0)<($67|0);
  if (!($68)) {
   break;
  }
  $70=((HEAP32[((_stderr)>>2)])|0);
  $71=$i;
  $72=$rects;
  $73=(($72+($71<<4))|0);
  $74=(($73)|0);
  $75=((HEAP32[(($74)>>2)])|0);
  $76=$i;
  $77=$rects;
  $78=(($77+($76<<4))|0);
  $79=(($78+4)|0);
  $80=((HEAP32[(($79)>>2)])|0);
  $81=$i;
  $82=$rects;
  $83=(($82+($81<<4))|0);
  $84=(($83+8)|0);
  $85=((HEAP32[(($84)>>2)])|0);
  $86=$i;
  $87=$rects;
  $88=(($87+($86<<4))|0);
  $89=(($88+12)|0);
  $90=((HEAP32[(($89)>>2)])|0);
  $91=((_fprintf((($70)|0),((488)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 32)|0,HEAP32[((tempVarArgs)>>2)]=$75,HEAP32[(((tempVarArgs)+(8))>>2)]=$80,HEAP32[(((tempVarArgs)+(16))>>2)]=$85,HEAP32[(((tempVarArgs)+(24))>>2)]=$90,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
  $93=$i;
  $94=((($93)+(1))|0);
  $i=$94;
 }
 $96=((HEAP32[((_stderr)>>2)])|0);
 $97=((_fprintf((($96)|0),((392)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 1)|0,STACKTOP = (((STACKTOP)+7)&-8),HEAP32[((tempVarArgs)>>2)]=0,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $98=$num;
 STACKTOP=sp;return (($98)|0);
}


function _pixman_region32_init($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2)|0);
 $4=((HEAP32[((16)>>2)])|0);
 $5=$3;
 $6=$4;
 HEAP32[(($5)>>2)]=((HEAP32[(($6)>>2)])|0);HEAP32[((($5)+(4))>>2)]=((HEAP32[((($6)+(4))>>2)])|0);HEAP32[((($5)+(8))>>2)]=((HEAP32[((($6)+(8))>>2)])|0);HEAP32[((($5)+(12))>>2)]=((HEAP32[((($6)+(12))>>2)])|0);
 $7=((HEAP32[((8)>>2)])|0);
 $8=$1;
 $9=(($8+16)|0);
 HEAP32[(($9)>>2)]=$7;
 STACKTOP=sp;return;
}


function _pixman_region32_init_rect($region,$x,$y,$width,$height){
 $region=($region)|0;
 $x=($x)|0;
 $y=($y)|0;
 $width=($width)|0;
 $height=($height)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0;
 var $21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0;
 var $42=0,$43=0,$44=0,$46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0;
 var $64=0,$67=0,$69=0,$70=0,label=0;
 var sp=0;sp=STACKTOP;





 $1=$region;
 $2=$x;
 $3=$y;
 $4=$width;
 $5=$height;
 $6=$2;
 $7=$1;
 $8=(($7)|0);
 $9=(($8)|0);
 HEAP32[(($9)>>2)]=$6;
 $10=$3;
 $11=$1;
 $12=(($11)|0);
 $13=(($12+4)|0);
 HEAP32[(($13)>>2)]=$10;
 $14=$2;
 $15=$4;
 $16=((($14)+($15))|0);
 $17=$1;
 $18=(($17)|0);
 $19=(($18+8)|0);
 HEAP32[(($19)>>2)]=$16;
 $20=$3;
 $21=$5;
 $22=((($20)+($21))|0);
 $23=$1;
 $24=(($23)|0);
 $25=(($24+12)|0);
 HEAP32[(($25)>>2)]=$22;
 $26=$1;
 $27=(($26)|0);
 $28=(($27)|0);
 $29=((HEAP32[(($28)>>2)])|0);
 $30=$1;
 $31=(($30)|0);
 $32=(($31+8)|0);
 $33=((HEAP32[(($32)>>2)])|0);
 $34=($29|0)<($33|0);
 if ($34) {
  $36=$1;
  $37=(($36)|0);
  $38=(($37+4)|0);
  $39=((HEAP32[(($38)>>2)])|0);
  $40=$1;
  $41=(($40)|0);
  $42=(($41+12)|0);
  $43=((HEAP32[(($42)>>2)])|0);
  $44=($39|0)<($43|0);
  if ($44) {
   $69=$1;
   $70=(($69+16)|0);
   HEAP32[(($70)>>2)]=0;
   STACKTOP=sp;return;
  }
 }
 $46=$1;
 $47=(($46)|0);
 $48=(($47)|0);
 $49=((HEAP32[(($48)>>2)])|0);
 $50=$1;
 $51=(($50)|0);
 $52=(($51+8)|0);
 $53=((HEAP32[(($52)>>2)])|0);
 $54=($49|0)>($53|0);
 if ($54) {
  label = 5;
 } else {
  $56=$1;
  $57=(($56)|0);
  $58=(($57+4)|0);
  $59=((HEAP32[(($58)>>2)])|0);
  $60=$1;
  $61=(($60)|0);
  $62=(($61+12)|0);
  $63=((HEAP32[(($62)>>2)])|0);
  $64=($59|0)>($63|0);
  if ($64) {
   label = 5;
  }
 }
 if ((label|0) == 5) {
  __pixman_log_error(1888,344);
 }
 $67=$1;
 _pixman_region32_init($67);
 STACKTOP=sp;return;
}


function _pixman_region32_init_with_extents($region,$extents){
 $region=($region)|0;
 $extents=($extents)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$19=0,$20=0,$21=0,$22=0;
 var $23=0,$24=0,$25=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$36=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,label=0;
 var sp=0;sp=STACKTOP;


 $1=$region;
 $2=$extents;
 $3=$2;
 $4=(($3)|0);
 $5=((HEAP32[(($4)>>2)])|0);
 $6=$2;
 $7=(($6+8)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=($5|0)<($8|0);
 if ($9) {
  $11=$2;
  $12=(($11+4)|0);
  $13=((HEAP32[(($12)>>2)])|0);
  $14=$2;
  $15=(($14+12)|0);
  $16=((HEAP32[(($15)>>2)])|0);
  $17=($13|0)<($16|0);
  if ($17) {
   $38=$1;
   $39=(($38)|0);
   $40=$2;
   $41=$39;
   $42=$40;
   HEAP32[(($41)>>2)]=((HEAP32[(($42)>>2)])|0);HEAP32[((($41)+(4))>>2)]=((HEAP32[((($42)+(4))>>2)])|0);HEAP32[((($41)+(8))>>2)]=((HEAP32[((($42)+(8))>>2)])|0);HEAP32[((($41)+(12))>>2)]=((HEAP32[((($42)+(12))>>2)])|0);
   $43=$1;
   $44=(($43+16)|0);
   HEAP32[(($44)>>2)]=0;
   STACKTOP=sp;return;
  }
 }
 $19=$2;
 $20=(($19)|0);
 $21=((HEAP32[(($20)>>2)])|0);
 $22=$2;
 $23=(($22+8)|0);
 $24=((HEAP32[(($23)>>2)])|0);
 $25=($21|0)>($24|0);
 if ($25) {
  label = 5;
 } else {
  $27=$2;
  $28=(($27+4)|0);
  $29=((HEAP32[(($28)>>2)])|0);
  $30=$2;
  $31=(($30+12)|0);
  $32=((HEAP32[(($31)>>2)])|0);
  $33=($29|0)>($32|0);
  if ($33) {
   label = 5;
  }
 }
 if ((label|0) == 5) {
  __pixman_log_error(1816,344);
 }
 $36=$1;
 _pixman_region32_init($36);
 STACKTOP=sp;return;
}


function _pixman_region32_fini($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if (!($5)) {
  STACKTOP=sp;return;
 }
 $7=$1;
 $8=(($7+16)|0);
 $9=((HEAP32[(($8)>>2)])|0);
 $10=(($9)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $12=($11|0)!=0;
 if (!($12)) {
  STACKTOP=sp;return;
 }
 $14=$1;
 $15=(($14+16)|0);
 $16=((HEAP32[(($15)>>2)])|0);
 $17=$16;
 _free($17);
 STACKTOP=sp;return;
}


function _pixman_region32_n_rects($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$14=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if ($5) {
  $7=$1;
  $8=(($7+16)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=(($9+4)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $14=$11;

  STACKTOP=sp;return (($14)|0);
 } else {
  $14=1;

  STACKTOP=sp;return (($14)|0);
 }
  return 0;
}


function _pixman_region32_rectangles($region,$n_rects){
 $region=($region)|0;
 $n_rects=($n_rects)|0;
 var $1=0,$2=0,$3=0,$4=0,$6=0,$7=0,$8=0,$9=0,$11=0,$12=0,$13=0,$14=0,$15=0,$18=0,$19=0,$21=0,$22=0,$23=0,$24=0,$26=0;
 var $27=0,$28=0,$29=0,$30=0,$32=0,$33=0,$35=0,label=0;
 var sp=0;sp=STACKTOP;


 $1=$region;
 $2=$n_rects;
 $3=$2;
 $4=($3|0)!=0;
 if ($4) {
  $6=$1;
  $7=(($6+16)|0);
  $8=((HEAP32[(($7)>>2)])|0);
  $9=($8|0)!=0;
  if ($9) {
   $11=$1;
   $12=(($11+16)|0);
   $13=((HEAP32[(($12)>>2)])|0);
   $14=(($13+4)|0);
   $15=((HEAP32[(($14)>>2)])|0);
   $18=$15;
  } else {
   $18=1;
  }

  $19=$2;
  HEAP32[(($19)>>2)]=$18;
 }
 $21=$1;
 $22=(($21+16)|0);
 $23=((HEAP32[(($22)>>2)])|0);
 $24=($23|0)!=0;
 if ($24) {
  $26=$1;
  $27=(($26+16)|0);
  $28=((HEAP32[(($27)>>2)])|0);
  $29=(($28+8)|0);
  $30=$29;
  $35=$30;

  STACKTOP=sp;return (($35)|0);
 } else {
  $32=$1;
  $33=(($32)|0);
  $35=$33;

  STACKTOP=sp;return (($35)|0);
 }
  return 0;
}


function _pixman_region32_copy($dst,$src){
 $dst=($dst)|0;
 $src=($src)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0,$22=0,$23=0;
 var $24=0,$25=0,$27=0,$28=0,$29=0,$30=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$39=0,$40=0,$41=0,$42=0,$44=0,$45=0,$46=0,$47=0;
 var $48=0,$50=0,$51=0,$52=0,$53=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$67=0,$68=0,$69=0,$70=0;
 var $72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$79=0,$80=0,$81=0,$82=0,$84=0,$85=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0,$92=0,$93=0;
 var $94=0,$95=0,$97=0,$98=0,$100=0,$101=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$110=0,$111=0,$112=0,$113=0,$114=0,$115=0,$116=0;
 var $117=0,$118=0,$119=0,$120=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0,$127=0,$128=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$135=0,$136=0;
 var $138=0,label=0;
 var sp=0;sp=STACKTOP;



 $2=$dst;
 $3=$src;
 $4=$2;
 $5=$3;
 $6=($4|0)==($5|0);
 if ($6) {
  $1=1;
  $138=$1;
  STACKTOP=sp;return (($138)|0);
 }
 $9=$2;
 $10=(($9)|0);
 $11=$3;
 $12=(($11)|0);
 $13=$10;
 $14=$12;
 HEAP32[(($13)>>2)]=((HEAP32[(($14)>>2)])|0);HEAP32[((($13)+(4))>>2)]=((HEAP32[((($14)+(4))>>2)])|0);HEAP32[((($13)+(8))>>2)]=((HEAP32[((($14)+(8))>>2)])|0);HEAP32[((($13)+(12))>>2)]=((HEAP32[((($14)+(12))>>2)])|0);
 $15=$3;
 $16=(($15+16)|0);
 $17=((HEAP32[(($16)>>2)])|0);
 $18=($17|0)!=0;
 if ($18) {
  $20=$3;
  $21=(($20+16)|0);
  $22=((HEAP32[(($21)>>2)])|0);
  $23=(($22)|0);
  $24=((HEAP32[(($23)>>2)])|0);
  $25=($24|0)!=0;
  if ($25) {
   $50=$2;
   $51=(($50+16)|0);
   $52=((HEAP32[(($51)>>2)])|0);
   $53=($52|0)!=0;
   if ($53) {
    $55=$2;
    $56=(($55+16)|0);
    $57=((HEAP32[(($56)>>2)])|0);
    $58=(($57)|0);
    $59=((HEAP32[(($58)>>2)])|0);
    $60=$3;
    $61=(($60+16)|0);
    $62=((HEAP32[(($61)>>2)])|0);
    $63=(($62+4)|0);
    $64=((HEAP32[(($63)>>2)])|0);
    $65=($59|0)<($64|0);
    if ($65) {
     label = 11;
    }
   } else {
    label = 11;
   }
   do {
    if ((label|0) == 11) {
     $67=$2;
     $68=(($67+16)|0);
     $69=((HEAP32[(($68)>>2)])|0);
     $70=($69|0)!=0;
     if ($70) {
      $72=$2;
      $73=(($72+16)|0);
      $74=((HEAP32[(($73)>>2)])|0);
      $75=(($74)|0);
      $76=((HEAP32[(($75)>>2)])|0);
      $77=($76|0)!=0;
      if ($77) {
       $79=$2;
       $80=(($79+16)|0);
       $81=((HEAP32[(($80)>>2)])|0);
       $82=$81;
       _free($82);
      }
     }
     $84=$3;
     $85=(($84+16)|0);
     $86=((HEAP32[(($85)>>2)])|0);
     $87=(($86+4)|0);
     $88=((HEAP32[(($87)>>2)])|0);
     $89=((_alloc_data($88))|0);
     $90=$2;
     $91=(($90+16)|0);
     HEAP32[(($91)>>2)]=$89;
     $92=$2;
     $93=(($92+16)|0);
     $94=((HEAP32[(($93)>>2)])|0);
     $95=($94|0)!=0;
     if ($95) {
      $100=$3;
      $101=(($100+16)|0);
      $102=((HEAP32[(($101)>>2)])|0);
      $103=(($102+4)|0);
      $104=((HEAP32[(($103)>>2)])|0);
      $105=$2;
      $106=(($105+16)|0);
      $107=((HEAP32[(($106)>>2)])|0);
      $108=(($107)|0);
      HEAP32[(($108)>>2)]=$104;
      break;
     }
     $97=$2;
     $98=((_pixman_break($97))|0);
     $1=$98;
     $138=$1;
     STACKTOP=sp;return (($138)|0);
    }
   } while(0);
   $110=$3;
   $111=(($110+16)|0);
   $112=((HEAP32[(($111)>>2)])|0);
   $113=(($112+4)|0);
   $114=((HEAP32[(($113)>>2)])|0);
   $115=$2;
   $116=(($115+16)|0);
   $117=((HEAP32[(($116)>>2)])|0);
   $118=(($117+4)|0);
   HEAP32[(($118)>>2)]=$114;
   $119=$2;
   $120=(($119+16)|0);
   $121=((HEAP32[(($120)>>2)])|0);
   $122=(($121+8)|0);
   $123=$122;
   $124=$123;
   $125=$3;
   $126=(($125+16)|0);
   $127=((HEAP32[(($126)>>2)])|0);
   $128=(($127+8)|0);
   $129=$128;
   $130=$129;
   $131=$2;
   $132=(($131+16)|0);
   $133=((HEAP32[(($132)>>2)])|0);
   $134=(($133+4)|0);
   $135=((HEAP32[(($134)>>2)])|0);
   $136=($135<<4);
   ((_memmove((($124)|0),(($130)|0),(($136)|0)))|0);
   $1=1;
   $138=$1;
   STACKTOP=sp;return (($138)|0);
  }
 }
 $27=$2;
 $28=(($27+16)|0);
 $29=((HEAP32[(($28)>>2)])|0);
 $30=($29|0)!=0;
 if ($30) {
  $32=$2;
  $33=(($32+16)|0);
  $34=((HEAP32[(($33)>>2)])|0);
  $35=(($34)|0);
  $36=((HEAP32[(($35)>>2)])|0);
  $37=($36|0)!=0;
  if ($37) {
   $39=$2;
   $40=(($39+16)|0);
   $41=((HEAP32[(($40)>>2)])|0);
   $42=$41;
   _free($42);
  }
 }
 $44=$3;
 $45=(($44+16)|0);
 $46=((HEAP32[(($45)>>2)])|0);
 $47=$2;
 $48=(($47+16)|0);
 HEAP32[(($48)>>2)]=$46;
 $1=1;
 $138=$1;
 STACKTOP=sp;return (($138)|0);
}


function _alloc_data($n){
 $n=($n)|0;
 var $1=0,$2=0,$sz=0,$3=0,$4=0,$5=0,$6=0,$9=0,$10=0,$11=0,$13=0,label=0;
 var sp=0;sp=STACKTOP;



 $2=$n;
 $3=$2;
 $4=((_PIXREGION_SZOF($3))|0);
 $sz=$4;
 $5=$sz;
 $6=($5|0)!=0;
 if ($6) {
  $9=$sz;
  $10=((_malloc($9))|0);
  $11=$10;
  $1=$11;
 } else {
  $1=0;
 }
 $13=$1;
 STACKTOP=sp;return (($13)|0);
}


function _pixman_break($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$19=0,$20=0,$21=0,$22=0,$23=0;
 var $24=0,$25=0,$26=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if ($5) {
  $7=$1;
  $8=(($7+16)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=(($9)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $12=($11|0)!=0;
  if ($12) {
   $14=$1;
   $15=(($14+16)|0);
   $16=((HEAP32[(($15)>>2)])|0);
   $17=$16;
   _free($17);
  }
 }
 $19=$1;
 $20=(($19)|0);
 $21=((HEAP32[((16)>>2)])|0);
 $22=$20;
 $23=$21;
 HEAP32[(($22)>>2)]=((HEAP32[(($23)>>2)])|0);HEAP32[((($22)+(4))>>2)]=((HEAP32[((($23)+(4))>>2)])|0);HEAP32[((($22)+(8))>>2)]=((HEAP32[((($23)+(8))>>2)])|0);HEAP32[((($22)+(12))>>2)]=((HEAP32[((($23)+(12))>>2)])|0);
 $24=((HEAP32[((24)>>2)])|0);
 $25=$1;
 $26=(($25+16)|0);
 HEAP32[(($26)>>2)]=$24;
 STACKTOP=sp;return ((0)|0);
}


function _pixman_region32_intersect($new_reg,$reg1,$reg2){
 $new_reg=($new_reg)|0;
 $reg1=($reg1)|0;
 $reg2=($reg2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$22=0,$23=0;
 var $24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0;
 var $46=0,$47=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0;
 var $69=0,$70=0,$71=0,$72=0,$74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$81=0,$82=0,$83=0,$84=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0;
 var $92=0,$93=0,$94=0,$95=0,$96=0,$97=0,$98=0,$99=0,$100=0,$101=0,$102=0,$103=0,$104=0,$106=0,$107=0,$108=0,$109=0,$110=0,$112=0,$113=0;
 var $114=0,$116=0,$117=0,$118=0,$121=0,$122=0,$123=0,$124=0,$126=0,$127=0,$128=0,$129=0,$131=0,$132=0,$133=0,$134=0,$135=0,$136=0,$137=0,$138=0;
 var $139=0,$141=0,$142=0,$143=0,$144=0,$146=0,$147=0,$148=0,$149=0,$151=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$160=0,$161=0;
 var $162=0,$163=0,$165=0,$166=0,$167=0,$168=0,$170=0,$171=0,$172=0,$173=0,$175=0,$176=0,$177=0,$178=0,$179=0,$180=0,$181=0,$182=0,$183=0,$184=0;
 var $185=0,$186=0,$187=0,$189=0,$190=0,$191=0,$192=0,$194=0,$195=0,$196=0,$197=0,$199=0,$200=0,$201=0,$202=0,$203=0,$204=0,$205=0,$206=0,$207=0;
 var $208=0,$209=0,$210=0,$211=0,$213=0,$214=0,$215=0,$216=0,$218=0,$219=0,$220=0,$221=0,$223=0,$224=0,$225=0,$226=0,$227=0,$228=0,$229=0,$230=0;
 var $232=0,$233=0,$234=0,$235=0,$236=0,$237=0,$239=0,$240=0,$241=0,$242=0,$244=0,$245=0,$247=0,$248=0,$249=0,$250=0,$252=0,$253=0,$254=0,$255=0;
 var $256=0,$257=0,$258=0,$259=0,$260=0,$262=0,$263=0,$264=0,$265=0,$266=0,$267=0,$268=0,$269=0,$270=0,$272=0,$273=0,$274=0,$275=0,$276=0,$277=0;
 var $278=0,$279=0,$280=0,$282=0,$283=0,$284=0,$285=0,$286=0,$287=0,$288=0,$289=0,$290=0,$292=0,$293=0,$294=0,$296=0,$297=0,$298=0,$299=0,$301=0;
 var $302=0,$303=0,$304=0,$305=0,$306=0,$307=0,$308=0,$309=0,$311=0,$312=0,$313=0,$314=0,$315=0,$316=0,$317=0,$318=0,$319=0,$321=0,$322=0,$323=0;
 var $324=0,$325=0,$326=0,$327=0,$328=0,$329=0,$331=0,$332=0,$333=0,$334=0,$335=0,$336=0,$337=0,$338=0,$339=0,$341=0,$342=0,$343=0,$345=0,$346=0;
 var $347=0,$349=0,$350=0,$351=0,$353=0,$354=0,$355=0,$356=0,$357=0,$360=0,$367=0,label=0;
 var sp=0;sp=STACKTOP;




 $2=$new_reg;
 $3=$reg1;
 $4=$reg2;
 $5=$3;
 $6=(($5+16)|0);
 $7=((HEAP32[(($6)>>2)])|0);
 $8=($7|0)!=0;
 if ($8) {
  $10=$3;
  $11=(($10+16)|0);
  $12=((HEAP32[(($11)>>2)])|0);
  $13=(($12+4)|0);
  $14=((HEAP32[(($13)>>2)])|0);
  $15=($14|0)!=0;
  if ($15) {
   label = 3;
  } else {
   label = 9;
  }
 } else {
  label = 3;
 }
 do {
  if ((label|0) == 3) {
   $17=$4;
   $18=(($17+16)|0);
   $19=((HEAP32[(($18)>>2)])|0);
   $20=($19|0)!=0;
   if ($20) {
    $22=$4;
    $23=(($22+16)|0);
    $24=((HEAP32[(($23)>>2)])|0);
    $25=(($24+4)|0);
    $26=((HEAP32[(($25)>>2)])|0);
    $27=($26|0)!=0;
    if (!($27)) {
     label = 9;
     break;
    }
   }
   $29=$3;
   $30=(($29)|0);
   $31=(($30+8)|0);
   $32=((HEAP32[(($31)>>2)])|0);
   $33=$4;
   $34=(($33)|0);
   $35=(($34)|0);
   $36=((HEAP32[(($35)>>2)])|0);
   $37=($32|0)<=($36|0);
   if ($37) {
    label = 9;
   } else {
    $39=$3;
    $40=(($39)|0);
    $41=(($40)|0);
    $42=((HEAP32[(($41)>>2)])|0);
    $43=$4;
    $44=(($43)|0);
    $45=(($44+8)|0);
    $46=((HEAP32[(($45)>>2)])|0);
    $47=($42|0)>=($46|0);
    if ($47) {
     label = 9;
    } else {
     $49=$3;
     $50=(($49)|0);
     $51=(($50+12)|0);
     $52=((HEAP32[(($51)>>2)])|0);
     $53=$4;
     $54=(($53)|0);
     $55=(($54+4)|0);
     $56=((HEAP32[(($55)>>2)])|0);
     $57=($52|0)<=($56|0);
     if ($57) {
      label = 9;
     } else {
      $59=$3;
      $60=(($59)|0);
      $61=(($60+4)|0);
      $62=((HEAP32[(($61)>>2)])|0);
      $63=$4;
      $64=(($63)|0);
      $65=(($64+12)|0);
      $66=((HEAP32[(($65)>>2)])|0);
      $67=($62|0)>=($66|0);
      if ($67) {
       label = 9;
      } else {
       $121=$3;
       $122=(($121+16)|0);
       $123=((HEAP32[(($122)>>2)])|0);
       $124=($123|0)!=0;
       if ($124) {
        label = 35;
       } else {
        $126=$4;
        $127=(($126+16)|0);
        $128=((HEAP32[(($127)>>2)])|0);
        $129=($128|0)!=0;
        if ($129) {
         label = 35;
        } else {
         $131=$3;
         $132=(($131)|0);
         $133=(($132)|0);
         $134=((HEAP32[(($133)>>2)])|0);
         $135=$4;
         $136=(($135)|0);
         $137=(($136)|0);
         $138=((HEAP32[(($137)>>2)])|0);
         $139=($134|0)>($138|0);
         if ($139) {
          $141=$3;
          $142=(($141)|0);
          $143=(($142)|0);
          $144=((HEAP32[(($143)>>2)])|0);
          $151=$144;
         } else {
          $146=$4;
          $147=(($146)|0);
          $148=(($147)|0);
          $149=((HEAP32[(($148)>>2)])|0);
          $151=$149;
         }

         $152=$2;
         $153=(($152)|0);
         $154=(($153)|0);
         HEAP32[(($154)>>2)]=$151;
         $155=$3;
         $156=(($155)|0);
         $157=(($156+4)|0);
         $158=((HEAP32[(($157)>>2)])|0);
         $159=$4;
         $160=(($159)|0);
         $161=(($160+4)|0);
         $162=((HEAP32[(($161)>>2)])|0);
         $163=($158|0)>($162|0);
         if ($163) {
          $165=$3;
          $166=(($165)|0);
          $167=(($166+4)|0);
          $168=((HEAP32[(($167)>>2)])|0);
          $175=$168;
         } else {
          $170=$4;
          $171=(($170)|0);
          $172=(($171+4)|0);
          $173=((HEAP32[(($172)>>2)])|0);
          $175=$173;
         }

         $176=$2;
         $177=(($176)|0);
         $178=(($177+4)|0);
         HEAP32[(($178)>>2)]=$175;
         $179=$3;
         $180=(($179)|0);
         $181=(($180+8)|0);
         $182=((HEAP32[(($181)>>2)])|0);
         $183=$4;
         $184=(($183)|0);
         $185=(($184+8)|0);
         $186=((HEAP32[(($185)>>2)])|0);
         $187=($182|0)<($186|0);
         if ($187) {
          $189=$3;
          $190=(($189)|0);
          $191=(($190+8)|0);
          $192=((HEAP32[(($191)>>2)])|0);
          $199=$192;
         } else {
          $194=$4;
          $195=(($194)|0);
          $196=(($195+8)|0);
          $197=((HEAP32[(($196)>>2)])|0);
          $199=$197;
         }

         $200=$2;
         $201=(($200)|0);
         $202=(($201+8)|0);
         HEAP32[(($202)>>2)]=$199;
         $203=$3;
         $204=(($203)|0);
         $205=(($204+12)|0);
         $206=((HEAP32[(($205)>>2)])|0);
         $207=$4;
         $208=(($207)|0);
         $209=(($208+12)|0);
         $210=((HEAP32[(($209)>>2)])|0);
         $211=($206|0)<($210|0);
         if ($211) {
          $213=$3;
          $214=(($213)|0);
          $215=(($214+12)|0);
          $216=((HEAP32[(($215)>>2)])|0);
          $223=$216;
         } else {
          $218=$4;
          $219=(($218)|0);
          $220=(($219+12)|0);
          $221=((HEAP32[(($220)>>2)])|0);
          $223=$221;
         }

         $224=$2;
         $225=(($224)|0);
         $226=(($225+12)|0);
         HEAP32[(($226)>>2)]=$223;
         $227=$2;
         $228=(($227+16)|0);
         $229=((HEAP32[(($228)>>2)])|0);
         $230=($229|0)!=0;
         if ($230) {
          $232=$2;
          $233=(($232+16)|0);
          $234=((HEAP32[(($233)>>2)])|0);
          $235=(($234)|0);
          $236=((HEAP32[(($235)>>2)])|0);
          $237=($236|0)!=0;
          if ($237) {
           $239=$2;
           $240=(($239+16)|0);
           $241=((HEAP32[(($240)>>2)])|0);
           $242=$241;
           _free($242);
          }
         }
         $244=$2;
         $245=(($244+16)|0);
         HEAP32[(($245)>>2)]=0;
        }
       }
       if ((label|0) == 35) {
        $247=$4;
        $248=(($247+16)|0);
        $249=((HEAP32[(($248)>>2)])|0);
        $250=($249|0)!=0;
        if (!($250)) {
         $252=$4;
         $253=(($252)|0);
         $254=(($253)|0);
         $255=((HEAP32[(($254)>>2)])|0);
         $256=$3;
         $257=(($256)|0);
         $258=(($257)|0);
         $259=((HEAP32[(($258)>>2)])|0);
         $260=($255|0)<=($259|0);
         if ($260) {
          $262=$4;
          $263=(($262)|0);
          $264=(($263+8)|0);
          $265=((HEAP32[(($264)>>2)])|0);
          $266=$3;
          $267=(($266)|0);
          $268=(($267+8)|0);
          $269=((HEAP32[(($268)>>2)])|0);
          $270=($265|0)>=($269|0);
          if ($270) {
           $272=$4;
           $273=(($272)|0);
           $274=(($273+4)|0);
           $275=((HEAP32[(($274)>>2)])|0);
           $276=$3;
           $277=(($276)|0);
           $278=(($277+4)|0);
           $279=((HEAP32[(($278)>>2)])|0);
           $280=($275|0)<=($279|0);
           if ($280) {
            $282=$4;
            $283=(($282)|0);
            $284=(($283+12)|0);
            $285=((HEAP32[(($284)>>2)])|0);
            $286=$3;
            $287=(($286)|0);
            $288=(($287+12)|0);
            $289=((HEAP32[(($288)>>2)])|0);
            $290=($285|0)>=($289|0);
            if ($290) {
             $292=$2;
             $293=$3;
             $294=((_pixman_region32_copy($292,$293))|0);
             $1=$294;
             $367=$1;
             STACKTOP=sp;return (($367)|0);
            }
           }
          }
         }
        }
        $296=$3;
        $297=(($296+16)|0);
        $298=((HEAP32[(($297)>>2)])|0);
        $299=($298|0)!=0;
        if (!($299)) {
         $301=$3;
         $302=(($301)|0);
         $303=(($302)|0);
         $304=((HEAP32[(($303)>>2)])|0);
         $305=$4;
         $306=(($305)|0);
         $307=(($306)|0);
         $308=((HEAP32[(($307)>>2)])|0);
         $309=($304|0)<=($308|0);
         if ($309) {
          $311=$3;
          $312=(($311)|0);
          $313=(($312+8)|0);
          $314=((HEAP32[(($313)>>2)])|0);
          $315=$4;
          $316=(($315)|0);
          $317=(($316+8)|0);
          $318=((HEAP32[(($317)>>2)])|0);
          $319=($314|0)>=($318|0);
          if ($319) {
           $321=$3;
           $322=(($321)|0);
           $323=(($322+4)|0);
           $324=((HEAP32[(($323)>>2)])|0);
           $325=$4;
           $326=(($325)|0);
           $327=(($326+4)|0);
           $328=((HEAP32[(($327)>>2)])|0);
           $329=($324|0)<=($328|0);
           if ($329) {
            $331=$3;
            $332=(($331)|0);
            $333=(($332+12)|0);
            $334=((HEAP32[(($333)>>2)])|0);
            $335=$4;
            $336=(($335)|0);
            $337=(($336+12)|0);
            $338=((HEAP32[(($337)>>2)])|0);
            $339=($334|0)>=($338|0);
            if ($339) {
             $341=$2;
             $342=$4;
             $343=((_pixman_region32_copy($341,$342))|0);
             $1=$343;
             $367=$1;
             STACKTOP=sp;return (($367)|0);
            }
           }
          }
         }
        }
        $345=$3;
        $346=$4;
        $347=($345|0)==($346|0);
        if ($347) {
         $349=$2;
         $350=$3;
         $351=((_pixman_region32_copy($349,$350))|0);
         $1=$351;
         $367=$1;
         STACKTOP=sp;return (($367)|0);
        }
        $353=$2;
        $354=$3;
        $355=$4;
        $356=((_pixman_op($353,$354,$355,2,0,0))|0);
        $357=($356|0)!=0;
        if (!($357)) {
         $1=0;
         $367=$1;
         STACKTOP=sp;return (($367)|0);
        }
        $360=$2;
        _pixman_set_extents($360);
       }
      }
     }
    }
   }
  }
 } while(0);
 do {
  if ((label|0) == 9) {
   $69=$2;
   $70=(($69+16)|0);
   $71=((HEAP32[(($70)>>2)])|0);
   $72=($71|0)!=0;
   if ($72) {
    $74=$2;
    $75=(($74+16)|0);
    $76=((HEAP32[(($75)>>2)])|0);
    $77=(($76)|0);
    $78=((HEAP32[(($77)>>2)])|0);
    $79=($78|0)!=0;
    if ($79) {
     $81=$2;
     $82=(($81+16)|0);
     $83=((HEAP32[(($82)>>2)])|0);
     $84=$83;
     _free($84);
    }
   }
   $86=$2;
   $87=(($86)|0);
   $88=(($87)|0);
   $89=((HEAP32[(($88)>>2)])|0);
   $90=$2;
   $91=(($90)|0);
   $92=(($91+8)|0);
   HEAP32[(($92)>>2)]=$89;
   $93=$2;
   $94=(($93)|0);
   $95=(($94+4)|0);
   $96=((HEAP32[(($95)>>2)])|0);
   $97=$2;
   $98=(($97)|0);
   $99=(($98+12)|0);
   HEAP32[(($99)>>2)]=$96;
   $100=$3;
   $101=(($100+16)|0);
   $102=((HEAP32[(($101)>>2)])|0);
   $103=((HEAP32[((24)>>2)])|0);
   $104=($102|0)==($103|0);
   if (!($104)) {
    $106=$4;
    $107=(($106+16)|0);
    $108=((HEAP32[(($107)>>2)])|0);
    $109=((HEAP32[((24)>>2)])|0);
    $110=($108|0)==($109|0);
    if (!($110)) {
     $116=((HEAP32[((8)>>2)])|0);
     $117=$2;
     $118=(($117+16)|0);
     HEAP32[(($118)>>2)]=$116;
     break;
    }
   }
   $112=((HEAP32[((24)>>2)])|0);
   $113=$2;
   $114=(($113+16)|0);
   HEAP32[(($114)>>2)]=$112;
   $1=0;
   $367=$1;
   STACKTOP=sp;return (($367)|0);
  }
 } while(0);
 $1=1;
 $367=$1;
 STACKTOP=sp;return (($367)|0);
}


function _pixman_op($new_reg,$reg1,$reg2,$overlap_func,$append_non1,$append_non2){
 $new_reg=($new_reg)|0;
 $reg1=($reg1)|0;
 $reg2=($reg2)|0;
 $overlap_func=($overlap_func)|0;
 $append_non1=($append_non1)|0;
 $append_non2=($append_non2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$r1=0,$r2=0,$r1_end=0,$r2_end=0,$ybot=0,$ytop=0,$old_data=0,$prev_band=0,$cur_band=0,$r1_band_end=0,$r2_band_end=0,$top=0,$bot=0;
 var $r1y1=0,$r2y1=0,$new_size=0,$numRects=0,$new_rects=0,$new_rects1=0,$new_data=0,$data_size=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0;
 var $23=0,$24=0,$25=0,$26=0,$28=0,$29=0,$30=0,$31=0,$32=0,$34=0,$35=0,$37=0,$38=0,$39=0,$40=0,$41=0,$43=0,$44=0,$45=0,$46=0;
 var $47=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$59=0,$60=0,$61=0,$62=0,$63=0,$66=0,$67=0,$68=0,$69=0,$70=0,$72=0;
 var $73=0,$74=0,$75=0,$76=0,$78=0,$79=0,$81=0,$82=0,$83=0,$84=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0,$92=0,$97=0,$98=0,$99=0;
 var $100=0,$101=0,$102=0,$103=0,$107=0,$108=0,$109=0,$111=0,$112=0,$114=0,$115=0,$116=0,$118=0,$119=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0;
 var $128=0,$129=0,$130=0,$132=0,$134=0,$135=0,$136=0,$137=0,$138=0,$139=0,$141=0,$142=0,$143=0,$145=0,$146=0,$147=0,$148=0,$149=0,$150=0,$152=0;
 var $153=0,$154=0,$155=0,$158=0,$159=0,$160=0,$161=0,$162=0,$163=0,$164=0,$166=0,$167=0,$168=0,$169=0,$171=0,$172=0,$175=0,$176=0,$177=0,$178=0;
 var $179=0,$180=0,$181=0,$183=0,$184=0,$185=0,$187=0,$188=0,$189=0,$191=0,$194=0,$195=0,$196=0,$197=0,$198=0,$199=0,$200=0,$205=0,$206=0,$207=0;
 var $208=0,$209=0,$210=0,$211=0,$216=0,$217=0,$218=0,$219=0,$220=0,$222=0,$223=0,$224=0,$226=0,$227=0,$228=0,$229=0,$230=0,$232=0,$234=0,$235=0;
 var $239=0,$240=0,$241=0,$242=0,$243=0,$245=0,$246=0,$247=0,$249=0,$250=0,$251=0,$252=0,$253=0,$255=0,$257=0,$258=0,$261=0,$262=0,$263=0,$265=0;
 var $266=0,$268=0,$269=0,$270=0,$272=0,$274=0,$276=0,$277=0,$278=0,$279=0,$280=0,$281=0,$283=0,$284=0,$285=0,$287=0,$289=0,$290=0,$291=0,$292=0;
 var $294=0,$295=0,$296=0,$297=0,$298=0,$299=0,$300=0,$301=0,$302=0,$303=0,$304=0,$305=0,$309=0,$310=0,$311=0,$312=0,$313=0,$314=0,$315=0,$316=0;
 var $317=0,$318=0,$319=0,$321=0,$322=0,$323=0,$324=0,$326=0,$331=0,$333=0,$334=0,$335=0,$337=0,$338=0,$340=0,$341=0,$342=0,$344=0,$346=0,$348=0;
 var $349=0,$350=0,$351=0,$352=0,$353=0,$355=0,$356=0,$357=0,$359=0,$361=0,$362=0,$363=0,$364=0,$366=0,$367=0,$368=0,$369=0,$370=0,$371=0,$372=0;
 var $373=0,$374=0,$375=0,$376=0,$377=0,$381=0,$382=0,$383=0,$384=0,$385=0,$386=0,$387=0,$388=0,$389=0,$390=0,$391=0,$393=0,$394=0,$395=0,$396=0;
 var $398=0,$403=0,$405=0,$408=0,$409=0,$410=0,$411=0,$412=0,$413=0,$414=0,$416=0,$417=0,$418=0,$420=0,$421=0,$422=0,$424=0,$425=0,$426=0,$427=0;
 var $429=0,$430=0,$431=0,$432=0,$433=0,$434=0,$435=0,$436=0,$437=0,$438=0,$439=0,$440=0,$441=0,$442=0,$443=0,$447=0,$448=0,$449=0,$450=0,$451=0;
 var $452=0,$453=0,$454=0,$455=0,$456=0,$457=0,$459=0,$460=0,$461=0,$462=0,$464=0,$468=0,$469=0,$470=0,$471=0,$472=0,$474=0,$476=0,$477=0,$478=0;
 var $479=0,$480=0,$482=0,$485=0,$486=0,$487=0,$489=0,$490=0,$491=0,$493=0,$495=0,$496=0,$497=0,$499=0,$500=0,$503=0,$504=0,$505=0,$506=0,$507=0;
 var $509=0,$510=0,$511=0,$513=0,$514=0,$515=0,$516=0,$517=0,$519=0,$521=0,$522=0,$525=0,$526=0,$527=0,$528=0,$529=0,$530=0,$531=0,$532=0,$533=0;
 var $534=0,$535=0,$537=0,$539=0,$541=0,$542=0,$543=0,$544=0,$545=0,$546=0,$550=0,$551=0,$552=0,$553=0,$554=0,$555=0,$556=0,$557=0,$558=0,$559=0;
 var $560=0,$562=0,$563=0,$564=0,$565=0,$567=0,$571=0,$572=0,$573=0,$574=0,$575=0,$576=0,$577=0,$580=0,$581=0,$582=0,$583=0,$585=0,$586=0,$587=0;
 var $588=0,$589=0,$590=0,$591=0,$592=0,$593=0,$594=0,$595=0,$596=0,$597=0,$599=0,$600=0,$601=0,$602=0,$607=0,$608=0,$609=0,$610=0,$611=0,$612=0;
 var $613=0,$614=0,$615=0,$616=0,$617=0,$618=0,$619=0,$620=0,$621=0,$622=0,$623=0,$624=0,$625=0,$626=0,$627=0,$628=0,$629=0,$633=0,$634=0,$635=0;
 var $637=0,$638=0,$641=0,$642=0,$643=0,$644=0,$645=0,$647=0,$648=0,$649=0,$651=0,$652=0,$653=0,$654=0,$655=0,$657=0,$659=0,$660=0,$663=0,$664=0;
 var $665=0,$666=0,$667=0,$668=0,$669=0,$670=0,$671=0,$672=0,$673=0,$675=0,$677=0,$679=0,$680=0,$681=0,$682=0,$683=0,$684=0,$688=0,$689=0,$690=0;
 var $691=0,$692=0,$693=0,$694=0,$695=0,$696=0,$697=0,$698=0,$700=0,$701=0,$702=0,$703=0,$705=0,$709=0,$710=0,$711=0,$712=0,$713=0,$714=0,$715=0;
 var $718=0,$719=0,$720=0,$721=0,$723=0,$724=0,$725=0,$726=0,$727=0,$728=0,$729=0,$730=0,$731=0,$732=0,$733=0,$734=0,$735=0,$737=0,$738=0,$739=0;
 var $740=0,$745=0,$746=0,$747=0,$748=0,$749=0,$750=0,$751=0,$752=0,$753=0,$754=0,$755=0,$756=0,$757=0,$758=0,$759=0,$760=0,$761=0,$762=0,$763=0;
 var $764=0,$765=0,$766=0,$767=0,$772=0,$773=0,$774=0,$775=0,$776=0,$777=0,$778=0,$779=0,$781=0,$782=0,$783=0,$784=0,$786=0,$787=0,$788=0,$789=0;
 var $790=0,$791=0,$793=0,$794=0,$795=0,$796=0,$798=0,$799=0,$800=0,$802=0,$803=0,$805=0,$806=0,$807=0,$808=0,$809=0,$810=0,$811=0,$812=0,$813=0;
 var $814=0,$815=0,$816=0,$817=0,$819=0,$820=0,$821=0,$822=0,$823=0,$824=0,$826=0,$827=0,$828=0,$829=0,$831=0,$832=0,$835=0,$836=0,$837=0,$838=0;
 var $839=0,$840=0,$841=0,$842=0,$844=0,$845=0,$846=0,$847=0,$848=0,$849=0,$851=0,$852=0,$853=0,$854=0,$857=0,$858=0,$859=0,$860=0,$861=0,$862=0;
 var $863=0,$865=0,$866=0,$868=0,$869=0,$870=0,$871=0,$872=0,$873=0,$880=0,$881=0,$882=0,$883=0,$885=0,label=0;
 var sp=0;sp=STACKTOP;




























 $2=$new_reg;
 $3=$reg1;
 $4=$reg2;
 $5=$overlap_func;
 $6=$append_non1;
 $7=$append_non2;
 $8=$3;
 $9=(($8+16)|0);
 $10=((HEAP32[(($9)>>2)])|0);
 $11=((HEAP32[((24)>>2)])|0);
 $12=($10|0)==($11|0);
 if (!($12)) {
  $14=$4;
  $15=(($14+16)|0);
  $16=((HEAP32[(($15)>>2)])|0);
  $17=((HEAP32[((24)>>2)])|0);
  $18=($16|0)==($17|0);
  if (!($18)) {
   $23=$3;
   $24=(($23+16)|0);
   $25=((HEAP32[(($24)>>2)])|0);
   $26=($25|0)!=0;
   if ($26) {
    $28=$3;
    $29=(($28+16)|0);
    $30=((HEAP32[(($29)>>2)])|0);
    $31=(($30+8)|0);
    $32=$31;
    $37=$32;
   } else {
    $34=$3;
    $35=(($34)|0);
    $37=$35;
   }

   $r1=$37;
   $38=$3;
   $39=(($38+16)|0);
   $40=((HEAP32[(($39)>>2)])|0);
   $41=($40|0)!=0;
   if ($41) {
    $43=$3;
    $44=(($43+16)|0);
    $45=((HEAP32[(($44)>>2)])|0);
    $46=(($45+4)|0);
    $47=((HEAP32[(($46)>>2)])|0);
    $50=$47;
   } else {
    $50=1;
   }

   $new_size=$50;
   $51=$r1;
   $52=$new_size;
   $53=(($51+($52<<4))|0);
   $r1_end=$53;
   $54=$4;
   $55=(($54+16)|0);
   $56=((HEAP32[(($55)>>2)])|0);
   $57=($56|0)!=0;
   if ($57) {
    $59=$4;
    $60=(($59+16)|0);
    $61=((HEAP32[(($60)>>2)])|0);
    $62=(($61+4)|0);
    $63=((HEAP32[(($62)>>2)])|0);
    $66=$63;
   } else {
    $66=1;
   }

   $numRects=$66;
   $67=$4;
   $68=(($67+16)|0);
   $69=((HEAP32[(($68)>>2)])|0);
   $70=($69|0)!=0;
   if ($70) {
    $72=$4;
    $73=(($72+16)|0);
    $74=((HEAP32[(($73)>>2)])|0);
    $75=(($74+8)|0);
    $76=$75;
    $81=$76;
   } else {
    $78=$4;
    $79=(($78)|0);
    $81=$79;
   }

   $r2=$81;
   $82=$r2;
   $83=$numRects;
   $84=(($82+($83<<4))|0);
   $r2_end=$84;
   $86=$r1;
   $87=$r1_end;
   $88=($86|0)!=($87|0);
   $89=$88^1;
   $90=($89&1);
   $91=($90);
   $92=($91|0)!=0;
   if ($92) {
    __pixman_log_error(1976,736);
   }
   $97=$r2;
   $98=$r2_end;
   $99=($97|0)!=($98|0);
   $100=$99^1;
   $101=($100&1);
   $102=($101);
   $103=($102|0)!=0;
   if ($103) {
    __pixman_log_error(1976,672);
   }
   $old_data=0;
   $107=$2;
   $108=$3;
   $109=($107|0)==($108|0);
   if ($109) {
    $111=$new_size;
    $112=($111|0)>1;
    if ($112) {
     label = 28;
    } else {
     label = 26;
    }
   } else {
    label = 26;
   }
   if ((label|0) == 26) {
    $114=$2;
    $115=$4;
    $116=($114|0)==($115|0);
    if ($116) {
     $118=$numRects;
     $119=($118|0)>1;
     if ($119) {
      label = 28;
     }
    }
   }
   if ((label|0) == 28) {
    $121=$2;
    $122=(($121+16)|0);
    $123=((HEAP32[(($122)>>2)])|0);
    $old_data=$123;
    $124=((HEAP32[((8)>>2)])|0);
    $125=$2;
    $126=(($125+16)|0);
    HEAP32[(($126)>>2)]=$124;
   }
   $128=$numRects;
   $129=$new_size;
   $130=($128|0)>($129|0);
   if ($130) {
    $132=$numRects;
    $new_size=$132;
   }
   $134=$new_size;
   $135=$134<<1;
   $new_size=$135;
   $136=$2;
   $137=(($136+16)|0);
   $138=((HEAP32[(($137)>>2)])|0);
   $139=($138|0)!=0;
   if ($139) {
    $145=$2;
    $146=(($145+16)|0);
    $147=((HEAP32[(($146)>>2)])|0);
    $148=(($147)|0);
    $149=((HEAP32[(($148)>>2)])|0);
    $150=($149|0)!=0;
    if ($150) {
     $152=$2;
     $153=(($152+16)|0);
     $154=((HEAP32[(($153)>>2)])|0);
     $155=(($154+4)|0);
     HEAP32[(($155)>>2)]=0;
    }
   } else {
    $141=((HEAP32[((8)>>2)])|0);
    $142=$2;
    $143=(($142+16)|0);
    HEAP32[(($143)>>2)]=$141;
   }
   $158=$new_size;
   $159=$2;
   $160=(($159+16)|0);
   $161=((HEAP32[(($160)>>2)])|0);
   $162=(($161)|0);
   $163=((HEAP32[(($162)>>2)])|0);
   $164=($158|0)>($163|0);
   do {
    if ($164) {
     $166=$2;
     $167=$new_size;
     $168=((_pixman_rect_alloc($166,$167))|0);
     $169=($168|0)!=0;
     if ($169) {
      break;
     }
     $171=$old_data;
     $172=$171;
     _free($172);
     $1=0;
     $885=$1;
     STACKTOP=sp;return (($885)|0);
    }
   } while(0);
   $175=$r1;
   $176=(($175+4)|0);
   $177=((HEAP32[(($176)>>2)])|0);
   $178=$r2;
   $179=(($178+4)|0);
   $180=((HEAP32[(($179)>>2)])|0);
   $181=($177|0)<($180|0);
   if ($181) {
    $183=$r1;
    $184=(($183+4)|0);
    $185=((HEAP32[(($184)>>2)])|0);
    $191=$185;
   } else {
    $187=$r2;
    $188=(($187+4)|0);
    $189=((HEAP32[(($188)>>2)])|0);
    $191=$189;
   }

   $ybot=$191;
   $prev_band=0;
   while(1) {
    $194=$r1;
    $195=$r1_end;
    $196=($194|0)!=($195|0);
    $197=$196^1;
    $198=($197&1);
    $199=($198);
    $200=($199|0)!=0;
    if ($200) {
     __pixman_log_error(1976,736);
    }
    $205=$r2;
    $206=$r2_end;
    $207=($205|0)!=($206|0);
    $208=$207^1;
    $209=($208&1);
    $210=($209);
    $211=($210|0)!=0;
    if ($211) {
     __pixman_log_error(1976,672);
    }
    $216=$r1;
    $217=(($216+4)|0);
    $218=((HEAP32[(($217)>>2)])|0);
    $r1y1=$218;
    $219=$r1;
    $220=(($219+16)|0);
    $r1_band_end=$220;
    while(1) {
     $222=$r1_band_end;
     $223=$r1_end;
     $224=($222|0)!=($223|0);
     if ($224) {
      $226=$r1_band_end;
      $227=(($226+4)|0);
      $228=((HEAP32[(($227)>>2)])|0);
      $229=$r1y1;
      $230=($228|0)==($229|0);
      $232=$230;
     } else {
      $232=0;
     }

     if (!($232)) {
      break;
     }
     $234=$r1_band_end;
     $235=(($234+16)|0);
     $r1_band_end=$235;
    }
    $239=$r2;
    $240=(($239+4)|0);
    $241=((HEAP32[(($240)>>2)])|0);
    $r2y1=$241;
    $242=$r2;
    $243=(($242+16)|0);
    $r2_band_end=$243;
    while(1) {
     $245=$r2_band_end;
     $246=$r2_end;
     $247=($245|0)!=($246|0);
     if ($247) {
      $249=$r2_band_end;
      $250=(($249+4)|0);
      $251=((HEAP32[(($250)>>2)])|0);
      $252=$r2y1;
      $253=($251|0)==($252|0);
      $255=$253;
     } else {
      $255=0;
     }

     if (!($255)) {
      break;
     }
     $257=$r2_band_end;
     $258=(($257+16)|0);
     $r2_band_end=$258;
    }
    $261=$r1y1;
    $262=$r2y1;
    $263=($261|0)<($262|0);
    if ($263) {
     $265=$6;
     $266=($265|0)!=0;
     if ($266) {
      $268=$r1y1;
      $269=$ybot;
      $270=($268|0)>($269|0);
      if ($270) {
       $272=$r1y1;
       $276=$272;
      } else {
       $274=$ybot;
       $276=$274;
      }

      $top=$276;
      $277=$r1;
      $278=(($277+12)|0);
      $279=((HEAP32[(($278)>>2)])|0);
      $280=$r2y1;
      $281=($279|0)<($280|0);
      if ($281) {
       $283=$r1;
       $284=(($283+12)|0);
       $285=((HEAP32[(($284)>>2)])|0);
       $289=$285;
      } else {
       $287=$r2y1;
       $289=$287;
      }

      $bot=$289;
      $290=$top;
      $291=$bot;
      $292=($290|0)!=($291|0);
      if ($292) {
       $294=$2;
       $295=(($294+16)|0);
       $296=((HEAP32[(($295)>>2)])|0);
       $297=(($296+4)|0);
       $298=((HEAP32[(($297)>>2)])|0);
       $cur_band=$298;
       $299=$2;
       $300=$r1;
       $301=$r1_band_end;
       $302=$top;
       $303=$bot;
       $304=((_pixman_region_append_non_o($299,$300,$301,$302,$303))|0);
       $305=($304|0)!=0;
       if (!($305)) {
        label = 76;
        break;
       }
       $309=$cur_band;
       $310=$prev_band;
       $311=((($309)-($310))|0);
       $312=$2;
       $313=(($312+16)|0);
       $314=((HEAP32[(($313)>>2)])|0);
       $315=(($314+4)|0);
       $316=((HEAP32[(($315)>>2)])|0);
       $317=$cur_band;
       $318=((($316)-($317))|0);
       $319=($311|0)==($318|0);
       if ($319) {
        $321=$2;
        $322=$prev_band;
        $323=$cur_band;
        $324=((_pixman_coalesce($321,$322,$323))|0);
        $prev_band=$324;
       } else {
        $326=$cur_band;
        $prev_band=$326;
       }
      }
     }
     $331=$r2y1;
     $ytop=$331;
    } else {
     $333=$r2y1;
     $334=$r1y1;
     $335=($333|0)<($334|0);
     if ($335) {
      $337=$7;
      $338=($337|0)!=0;
      if ($338) {
       $340=$r2y1;
       $341=$ybot;
       $342=($340|0)>($341|0);
       if ($342) {
        $344=$r2y1;
        $348=$344;
       } else {
        $346=$ybot;
        $348=$346;
       }

       $top=$348;
       $349=$r2;
       $350=(($349+12)|0);
       $351=((HEAP32[(($350)>>2)])|0);
       $352=$r1y1;
       $353=($351|0)<($352|0);
       if ($353) {
        $355=$r2;
        $356=(($355+12)|0);
        $357=((HEAP32[(($356)>>2)])|0);
        $361=$357;
       } else {
        $359=$r1y1;
        $361=$359;
       }

       $bot=$361;
       $362=$top;
       $363=$bot;
       $364=($362|0)!=($363|0);
       if ($364) {
        $366=$2;
        $367=(($366+16)|0);
        $368=((HEAP32[(($367)>>2)])|0);
        $369=(($368+4)|0);
        $370=((HEAP32[(($369)>>2)])|0);
        $cur_band=$370;
        $371=$2;
        $372=$r2;
        $373=$r2_band_end;
        $374=$top;
        $375=$bot;
        $376=((_pixman_region_append_non_o($371,$372,$373,$374,$375))|0);
        $377=($376|0)!=0;
        if (!($377)) {
         label = 95;
         break;
        }
        $381=$cur_band;
        $382=$prev_band;
        $383=((($381)-($382))|0);
        $384=$2;
        $385=(($384+16)|0);
        $386=((HEAP32[(($385)>>2)])|0);
        $387=(($386+4)|0);
        $388=((HEAP32[(($387)>>2)])|0);
        $389=$cur_band;
        $390=((($388)-($389))|0);
        $391=($383|0)==($390|0);
        if ($391) {
         $393=$2;
         $394=$prev_band;
         $395=$cur_band;
         $396=((_pixman_coalesce($393,$394,$395))|0);
         $prev_band=$396;
        } else {
         $398=$cur_band;
         $prev_band=$398;
        }
       }
      }
      $403=$r1y1;
      $ytop=$403;
     } else {
      $405=$r1y1;
      $ytop=$405;
     }
    }
    $408=$r1;
    $409=(($408+12)|0);
    $410=((HEAP32[(($409)>>2)])|0);
    $411=$r2;
    $412=(($411+12)|0);
    $413=((HEAP32[(($412)>>2)])|0);
    $414=($410|0)<($413|0);
    if ($414) {
     $416=$r1;
     $417=(($416+12)|0);
     $418=((HEAP32[(($417)>>2)])|0);
     $424=$418;
    } else {
     $420=$r2;
     $421=(($420+12)|0);
     $422=((HEAP32[(($421)>>2)])|0);
     $424=$422;
    }

    $ybot=$424;
    $425=$ybot;
    $426=$ytop;
    $427=($425|0)>($426|0);
    if ($427) {
     $429=$2;
     $430=(($429+16)|0);
     $431=((HEAP32[(($430)>>2)])|0);
     $432=(($431+4)|0);
     $433=((HEAP32[(($432)>>2)])|0);
     $cur_band=$433;
     $434=$5;
     $435=$2;
     $436=$r1;
     $437=$r1_band_end;
     $438=$r2;
     $439=$r2_band_end;
     $440=$ytop;
     $441=$ybot;
     $442=((FUNCTION_TABLE_iiiiiiii[($434)&7]($435,$436,$437,$438,$439,$440,$441))|0);
     $443=($442|0)!=0;
     if (!($443)) {
      label = 111;
      break;
     }
     $447=$cur_band;
     $448=$prev_band;
     $449=((($447)-($448))|0);
     $450=$2;
     $451=(($450+16)|0);
     $452=((HEAP32[(($451)>>2)])|0);
     $453=(($452+4)|0);
     $454=((HEAP32[(($453)>>2)])|0);
     $455=$cur_band;
     $456=((($454)-($455))|0);
     $457=($449|0)==($456|0);
     if ($457) {
      $459=$2;
      $460=$prev_band;
      $461=$cur_band;
      $462=((_pixman_coalesce($459,$460,$461))|0);
      $prev_band=$462;
     } else {
      $464=$cur_band;
      $prev_band=$464;
     }
    }
    $468=$r1;
    $469=(($468+12)|0);
    $470=((HEAP32[(($469)>>2)])|0);
    $471=$ybot;
    $472=($470|0)==($471|0);
    if ($472) {
     $474=$r1_band_end;
     $r1=$474;
    }
    $476=$r2;
    $477=(($476+12)|0);
    $478=((HEAP32[(($477)>>2)])|0);
    $479=$ybot;
    $480=($478|0)==($479|0);
    if ($480) {
     $482=$r2_band_end;
     $r2=$482;
    }
    $485=$r1;
    $486=$r1_end;
    $487=($485|0)!=($486|0);
    if ($487) {
     $489=$r2;
     $490=$r2_end;
     $491=($489|0)!=($490|0);
     $493=$491;
    } else {
     $493=0;
    }

    if (!($493)) {
     label = 126;
     break;
    }
   }
   L163: do {
    if ((label|0) == 76) {
    }
    else if ((label|0) == 95) {
    }
    else if ((label|0) == 111) {
    }
    else if ((label|0) == 126) {
     $495=$r1;
     $496=$r1_end;
     $497=($495|0)!=($496|0);
     if ($497) {
      $499=$6;
      $500=($499|0)!=0;
      if ($500) {
       $503=$r1;
       $504=(($503+4)|0);
       $505=((HEAP32[(($504)>>2)])|0);
       $r1y1=$505;
       $506=$r1;
       $507=(($506+16)|0);
       $r1_band_end=$507;
       while(1) {
        $509=$r1_band_end;
        $510=$r1_end;
        $511=($509|0)!=($510|0);
        if ($511) {
         $513=$r1_band_end;
         $514=(($513+4)|0);
         $515=((HEAP32[(($514)>>2)])|0);
         $516=$r1y1;
         $517=($515|0)==($516|0);
         $519=$517;
        } else {
         $519=0;
        }

        if (!($519)) {
         break;
        }
        $521=$r1_band_end;
        $522=(($521+16)|0);
        $r1_band_end=$522;
       }
       $525=$2;
       $526=(($525+16)|0);
       $527=((HEAP32[(($526)>>2)])|0);
       $528=(($527+4)|0);
       $529=((HEAP32[(($528)>>2)])|0);
       $cur_band=$529;
       $530=$2;
       $531=$r1;
       $532=$r1_band_end;
       $533=$r1y1;
       $534=$ybot;
       $535=($533|0)>($534|0);
       if ($535) {
        $537=$r1y1;
        $541=$537;
       } else {
        $539=$ybot;
        $541=$539;
       }

       $542=$r1;
       $543=(($542+12)|0);
       $544=((HEAP32[(($543)>>2)])|0);
       $545=((_pixman_region_append_non_o($530,$531,$532,$541,$544))|0);
       $546=($545|0)!=0;
       if (!($546)) {
        break;
       }
       $550=$cur_band;
       $551=$prev_band;
       $552=((($550)-($551))|0);
       $553=$2;
       $554=(($553+16)|0);
       $555=((HEAP32[(($554)>>2)])|0);
       $556=(($555+4)|0);
       $557=((HEAP32[(($556)>>2)])|0);
       $558=$cur_band;
       $559=((($557)-($558))|0);
       $560=($552|0)==($559|0);
       if ($560) {
        $562=$2;
        $563=$prev_band;
        $564=$cur_band;
        $565=((_pixman_coalesce($562,$563,$564))|0);
        $prev_band=$565;
       } else {
        $567=$cur_band;
        $prev_band=$567;
       }
       $571=$r1_end;
       $572=$r1_band_end;
       $573=$571;
       $574=$572;
       $575=((($573)-($574))|0);
       $576=(((($575|0))/(16))&-1);
       $new_rects=$576;
       $577=($576|0)!=0;
       if ($577) {
        $580=$2;
        $581=(($580+16)|0);
        $582=((HEAP32[(($581)>>2)])|0);
        $583=($582|0)!=0;
        if ($583) {
         $585=$2;
         $586=(($585+16)|0);
         $587=((HEAP32[(($586)>>2)])|0);
         $588=(($587+4)|0);
         $589=((HEAP32[(($588)>>2)])|0);
         $590=$new_rects;
         $591=((($589)+($590))|0);
         $592=$2;
         $593=(($592+16)|0);
         $594=((HEAP32[(($593)>>2)])|0);
         $595=(($594)|0);
         $596=((HEAP32[(($595)>>2)])|0);
         $597=($591|0)>($596|0);
         if ($597) {
          label = 150;
         }
        } else {
         label = 150;
        }
        do {
         if ((label|0) == 150) {
          $599=$2;
          $600=$new_rects;
          $601=((_pixman_rect_alloc($599,$600))|0);
          $602=($601|0)!=0;
          if ($602) {
           break;
          } else {
           break L163;
          }
         }
        } while(0);
        $607=$2;
        $608=(($607+16)|0);
        $609=((HEAP32[(($608)>>2)])|0);
        $610=(($609+4)|0);
        $611=((HEAP32[(($610)>>2)])|0);
        $612=$2;
        $613=(($612+16)|0);
        $614=((HEAP32[(($613)>>2)])|0);
        $615=(($614+8)|0);
        $616=$615;
        $617=(($616+($611<<4))|0);
        $618=$617;
        $619=$r1_band_end;
        $620=$619;
        $621=$new_rects;
        $622=($621<<4);
        ((_memmove((($618)|0),(($620)|0),(($622)|0)))|0);
        $623=$new_rects;
        $624=$2;
        $625=(($624+16)|0);
        $626=((HEAP32[(($625)>>2)])|0);
        $627=(($626+4)|0);
        $628=((HEAP32[(($627)>>2)])|0);
        $629=((($628)+($623))|0);
        HEAP32[(($627)>>2)]=$629;
       }
      } else {
       label = 157;
      }
     } else {
      label = 157;
     }
     if ((label|0) == 157) {
      $633=$r2;
      $634=$r2_end;
      $635=($633|0)!=($634|0);
      if ($635) {
       $637=$7;
       $638=($637|0)!=0;
       if ($638) {
        $641=$r2;
        $642=(($641+4)|0);
        $643=((HEAP32[(($642)>>2)])|0);
        $r2y1=$643;
        $644=$r2;
        $645=(($644+16)|0);
        $r2_band_end=$645;
        while(1) {
         $647=$r2_band_end;
         $648=$r2_end;
         $649=($647|0)!=($648|0);
         if ($649) {
          $651=$r2_band_end;
          $652=(($651+4)|0);
          $653=((HEAP32[(($652)>>2)])|0);
          $654=$r2y1;
          $655=($653|0)==($654|0);
          $657=$655;
         } else {
          $657=0;
         }

         if (!($657)) {
          break;
         }
         $659=$r2_band_end;
         $660=(($659+16)|0);
         $r2_band_end=$660;
        }
        $663=$2;
        $664=(($663+16)|0);
        $665=((HEAP32[(($664)>>2)])|0);
        $666=(($665+4)|0);
        $667=((HEAP32[(($666)>>2)])|0);
        $cur_band=$667;
        $668=$2;
        $669=$r2;
        $670=$r2_band_end;
        $671=$r2y1;
        $672=$ybot;
        $673=($671|0)>($672|0);
        if ($673) {
         $675=$r2y1;
         $679=$675;
        } else {
         $677=$ybot;
         $679=$677;
        }

        $680=$r2;
        $681=(($680+12)|0);
        $682=((HEAP32[(($681)>>2)])|0);
        $683=((_pixman_region_append_non_o($668,$669,$670,$679,$682))|0);
        $684=($683|0)!=0;
        if (!($684)) {
         break;
        }
        $688=$cur_band;
        $689=$prev_band;
        $690=((($688)-($689))|0);
        $691=$2;
        $692=(($691+16)|0);
        $693=((HEAP32[(($692)>>2)])|0);
        $694=(($693+4)|0);
        $695=((HEAP32[(($694)>>2)])|0);
        $696=$cur_band;
        $697=((($695)-($696))|0);
        $698=($690|0)==($697|0);
        if ($698) {
         $700=$2;
         $701=$prev_band;
         $702=$cur_band;
         $703=((_pixman_coalesce($700,$701,$702))|0);
         $prev_band=$703;
        } else {
         $705=$cur_band;
         $prev_band=$705;
        }
        $709=$r2_end;
        $710=$r2_band_end;
        $711=$709;
        $712=$710;
        $713=((($711)-($712))|0);
        $714=(((($713|0))/(16))&-1);
        $new_rects1=$714;
        $715=($714|0)!=0;
        if ($715) {
         $718=$2;
         $719=(($718+16)|0);
         $720=((HEAP32[(($719)>>2)])|0);
         $721=($720|0)!=0;
         if ($721) {
          $723=$2;
          $724=(($723+16)|0);
          $725=((HEAP32[(($724)>>2)])|0);
          $726=(($725+4)|0);
          $727=((HEAP32[(($726)>>2)])|0);
          $728=$new_rects1;
          $729=((($727)+($728))|0);
          $730=$2;
          $731=(($730+16)|0);
          $732=((HEAP32[(($731)>>2)])|0);
          $733=(($732)|0);
          $734=((HEAP32[(($733)>>2)])|0);
          $735=($729|0)>($734|0);
          if ($735) {
           label = 181;
          }
         } else {
          label = 181;
         }
         do {
          if ((label|0) == 181) {
           $737=$2;
           $738=$new_rects1;
           $739=((_pixman_rect_alloc($737,$738))|0);
           $740=($739|0)!=0;
           if ($740) {
            break;
           } else {
            break L163;
           }
          }
         } while(0);
         $745=$2;
         $746=(($745+16)|0);
         $747=((HEAP32[(($746)>>2)])|0);
         $748=(($747+4)|0);
         $749=((HEAP32[(($748)>>2)])|0);
         $750=$2;
         $751=(($750+16)|0);
         $752=((HEAP32[(($751)>>2)])|0);
         $753=(($752+8)|0);
         $754=$753;
         $755=(($754+($749<<4))|0);
         $756=$755;
         $757=$r2_band_end;
         $758=$757;
         $759=$new_rects1;
         $760=($759<<4);
         ((_memmove((($756)|0),(($758)|0),(($760)|0)))|0);
         $761=$new_rects1;
         $762=$2;
         $763=(($762+16)|0);
         $764=((HEAP32[(($763)>>2)])|0);
         $765=(($764+4)|0);
         $766=((HEAP32[(($765)>>2)])|0);
         $767=((($766)+($761))|0);
         HEAP32[(($765)>>2)]=$767;
        }
       }
      }
     }
     $772=$old_data;
     $773=$772;
     _free($773);
     $774=$2;
     $775=(($774+16)|0);
     $776=((HEAP32[(($775)>>2)])|0);
     $777=(($776+4)|0);
     $778=((HEAP32[(($777)>>2)])|0);
     $numRects=$778;
     $779=($778|0)!=0;
     if ($779) {
      $802=$numRects;
      $803=($802|0)==1;
      if ($803) {
       $805=$2;
       $806=(($805)|0);
       $807=$2;
       $808=(($807+16)|0);
       $809=((HEAP32[(($808)>>2)])|0);
       $810=(($809+8)|0);
       $811=$810;
       $812=$806;
       $813=$811;
       HEAP32[(($812)>>2)]=((HEAP32[(($813)>>2)])|0);HEAP32[((($812)+(4))>>2)]=((HEAP32[((($813)+(4))>>2)])|0);HEAP32[((($812)+(8))>>2)]=((HEAP32[((($813)+(8))>>2)])|0);HEAP32[((($812)+(12))>>2)]=((HEAP32[((($813)+(12))>>2)])|0);
       $814=$2;
       $815=(($814+16)|0);
       $816=((HEAP32[(($815)>>2)])|0);
       $817=($816|0)!=0;
       if ($817) {
        $819=$2;
        $820=(($819+16)|0);
        $821=((HEAP32[(($820)>>2)])|0);
        $822=(($821)|0);
        $823=((HEAP32[(($822)>>2)])|0);
        $824=($823|0)!=0;
        if ($824) {
         $826=$2;
         $827=(($826+16)|0);
         $828=((HEAP32[(($827)>>2)])|0);
         $829=$828;
         _free($829);
        }
       }
       $831=$2;
       $832=(($831+16)|0);
       HEAP32[(($832)>>2)]=0;
      } else {
       $835=$numRects;
       $836=$2;
       $837=(($836+16)|0);
       $838=((HEAP32[(($837)>>2)])|0);
       $839=(($838)|0);
       $840=((HEAP32[(($839)>>2)])|0);
       $841=$840>>1;
       $842=($835|0)<($841|0);
       if ($842) {
        $844=$2;
        $845=(($844+16)|0);
        $846=((HEAP32[(($845)>>2)])|0);
        $847=(($846)|0);
        $848=((HEAP32[(($847)>>2)])|0);
        $849=($848|0)>50;
        if ($849) {
         $851=$numRects;
         $852=((_PIXREGION_SZOF($851))|0);
         $data_size=$852;
         $853=$data_size;
         $854=($853|0)!=0;
         if ($854) {
          $857=$2;
          $858=(($857+16)|0);
          $859=((HEAP32[(($858)>>2)])|0);
          $860=$859;
          $861=$data_size;
          $862=((_realloc($860,$861))|0);
          $863=$862;
          $new_data=$863;
         } else {
          $new_data=0;
         }
         $865=$new_data;
         $866=($865|0)!=0;
         if ($866) {
          $868=$numRects;
          $869=$new_data;
          $870=(($869)|0);
          HEAP32[(($870)>>2)]=$868;
          $871=$new_data;
          $872=$2;
          $873=(($872+16)|0);
          HEAP32[(($873)>>2)]=$871;
         }
        }
       }
      }
     } else {
      $781=$2;
      $782=(($781+16)|0);
      $783=((HEAP32[(($782)>>2)])|0);
      $784=($783|0)!=0;
      if ($784) {
       $786=$2;
       $787=(($786+16)|0);
       $788=((HEAP32[(($787)>>2)])|0);
       $789=(($788)|0);
       $790=((HEAP32[(($789)>>2)])|0);
       $791=($790|0)!=0;
       if ($791) {
        $793=$2;
        $794=(($793+16)|0);
        $795=((HEAP32[(($794)>>2)])|0);
        $796=$795;
        _free($796);
       }
      }
      $798=((HEAP32[((8)>>2)])|0);
      $799=$2;
      $800=(($799+16)|0);
      HEAP32[(($800)>>2)]=$798;
     }
     $1=1;
     $885=$1;
     STACKTOP=sp;return (($885)|0);
    }
   } while(0);
   $880=$old_data;
   $881=$880;
   _free($881);
   $882=$2;
   $883=((_pixman_break($882))|0);
   $1=$883;
   $885=$1;
   STACKTOP=sp;return (($885)|0);
  }
 }
 $20=$2;
 $21=((_pixman_break($20))|0);
 $1=$21;
 $885=$1;
 STACKTOP=sp;return (($885)|0);
}


function _pixman_region_intersect_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){
 $region=($region)|0;
 $r1=($r1)|0;
 $r1_end=($r1_end)|0;
 $r2=($r2)|0;
 $r2_end=($r2_end)|0;
 $y1=($y1)|0;
 $y2=($y2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$x1=0,$x2=0,$next_rect=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0;
 var $18=0,$19=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$32=0,$33=0,$34=0,$36=0,$37=0,$38=0,$40=0,$41=0,$42=0,$43=0,$44=0;
 var $49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$57=0,$58=0,$59=0,$61=0,$62=0,$63=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0,$71=0;
 var $72=0,$74=0,$75=0,$76=0,$78=0,$79=0,$80=0,$82=0,$83=0,$84=0,$85=0,$88=0,$89=0,$90=0,$91=0,$93=0,$94=0,$95=0,$96=0,$97=0;
 var $98=0,$99=0,$100=0,$101=0,$102=0,$103=0,$105=0,$106=0,$107=0,$110=0,$111=0,$112=0,$113=0,$114=0,$115=0,$116=0,$117=0,$118=0,$119=0,$120=0;
 var $123=0,$124=0,$125=0,$126=0,$127=0,$128=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$135=0,$136=0,$138=0,$139=0,$140=0,$141=0,$142=0,$143=0;
 var $145=0,$146=0,$147=0,$148=0,$149=0,$150=0,$151=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$165=0,$166=0,$167=0,$168=0,$169=0;
 var $171=0,$172=0,$174=0,$175=0,$176=0,$177=0,$178=0,$180=0,$181=0,$184=0,$185=0,$186=0,$188=0,$189=0,$190=0,$192=0,$195=0,label=0;
 var sp=0;sp=STACKTOP;











 $2=$region;
 $3=$r1;
 $4=$r1_end;
 $5=$r2;
 $6=$r2_end;
 $7=$y1;
 $8=$y2;
 $9=$2;
 $10=(($9+16)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $12=(($11+4)|0);
 $13=((HEAP32[(($12)>>2)])|0);
 $14=$2;
 $15=(($14+16)|0);
 $16=((HEAP32[(($15)>>2)])|0);
 $17=(($16+8)|0);
 $18=$17;
 $19=(($18+($13<<4))|0);
 $next_rect=$19;
 $21=$7;
 $22=$8;
 $23=($21|0)<($22|0);
 $24=$23^1;
 $25=($24&1);
 $26=($25);
 $27=($26|0)!=0;
 if ($27) {
  __pixman_log_error(1408,168);
 }
 $32=$3;
 $33=$4;
 $34=($32|0)!=($33|0);
 if ($34) {
  $36=$5;
  $37=$6;
  $38=($36|0)!=($37|0);
  $40=$38;
 } else {
  $40=0;
 }

 $41=$40^1;
 $42=($41&1);
 $43=($42);
 $44=($43|0)!=0;
 if ($44) {
  __pixman_log_error(1408,112);
 }
 while(1) {
  $49=$3;
  $50=(($49)|0);
  $51=((HEAP32[(($50)>>2)])|0);
  $52=$5;
  $53=(($52)|0);
  $54=((HEAP32[(($53)>>2)])|0);
  $55=($51|0)>($54|0);
  if ($55) {
   $57=$3;
   $58=(($57)|0);
   $59=((HEAP32[(($58)>>2)])|0);
   $65=$59;
  } else {
   $61=$5;
   $62=(($61)|0);
   $63=((HEAP32[(($62)>>2)])|0);
   $65=$63;
  }

  $x1=$65;
  $66=$3;
  $67=(($66+8)|0);
  $68=((HEAP32[(($67)>>2)])|0);
  $69=$5;
  $70=(($69+8)|0);
  $71=((HEAP32[(($70)>>2)])|0);
  $72=($68|0)<($71|0);
  if ($72) {
   $74=$3;
   $75=(($74+8)|0);
   $76=((HEAP32[(($75)>>2)])|0);
   $82=$76;
  } else {
   $78=$5;
   $79=(($78+8)|0);
   $80=((HEAP32[(($79)>>2)])|0);
   $82=$80;
  }

  $x2=$82;
  $83=$x1;
  $84=$x2;
  $85=($83|0)<($84|0);
  if ($85) {
   $88=$2;
   $89=(($88+16)|0);
   $90=((HEAP32[(($89)>>2)])|0);
   $91=($90|0)!=0;
   if ($91) {
    $93=$2;
    $94=(($93+16)|0);
    $95=((HEAP32[(($94)>>2)])|0);
    $96=(($95+4)|0);
    $97=((HEAP32[(($96)>>2)])|0);
    $98=$2;
    $99=(($98+16)|0);
    $100=((HEAP32[(($99)>>2)])|0);
    $101=(($100)|0);
    $102=((HEAP32[(($101)>>2)])|0);
    $103=($97|0)==($102|0);
    if ($103) {
     label = 22;
    }
   } else {
    label = 22;
   }
   if ((label|0) == 22) {
    label = 0;
    $105=$2;
    $106=((_pixman_rect_alloc($105,1))|0);
    $107=($106|0)!=0;
    if (!($107)) {
     label = 23;
     break;
    }
    $110=$2;
    $111=(($110+16)|0);
    $112=((HEAP32[(($111)>>2)])|0);
    $113=(($112+4)|0);
    $114=((HEAP32[(($113)>>2)])|0);
    $115=$2;
    $116=(($115+16)|0);
    $117=((HEAP32[(($116)>>2)])|0);
    $118=(($117+8)|0);
    $119=$118;
    $120=(($119+($114<<4))|0);
    $next_rect=$120;
   }
   $123=$x1;
   $124=$next_rect;
   $125=(($124)|0);
   HEAP32[(($125)>>2)]=$123;
   $126=$7;
   $127=$next_rect;
   $128=(($127+4)|0);
   HEAP32[(($128)>>2)]=$126;
   $129=$x2;
   $130=$next_rect;
   $131=(($130+8)|0);
   HEAP32[(($131)>>2)]=$129;
   $132=$8;
   $133=$next_rect;
   $134=(($133+12)|0);
   HEAP32[(($134)>>2)]=$132;
   $135=$next_rect;
   $136=(($135+16)|0);
   $next_rect=$136;
   $138=$2;
   $139=(($138+16)|0);
   $140=((HEAP32[(($139)>>2)])|0);
   $141=(($140+4)|0);
   $142=((HEAP32[(($141)>>2)])|0);
   $143=((($142)+(1))|0);
   HEAP32[(($141)>>2)]=$143;
   $145=$2;
   $146=(($145+16)|0);
   $147=((HEAP32[(($146)>>2)])|0);
   $148=(($147+4)|0);
   $149=((HEAP32[(($148)>>2)])|0);
   $150=$2;
   $151=(($150+16)|0);
   $152=((HEAP32[(($151)>>2)])|0);
   $153=(($152)|0);
   $154=((HEAP32[(($153)>>2)])|0);
   $155=($149|0)<=($154|0);
   $156=$155^1;
   $157=($156&1);
   $158=($157);
   $159=($158|0)!=0;
   if ($159) {
    __pixman_log_error(1408,992);
   }
  }
  $165=$3;
  $166=(($165+8)|0);
  $167=((HEAP32[(($166)>>2)])|0);
  $168=$x2;
  $169=($167|0)==($168|0);
  if ($169) {
   $171=$3;
   $172=(($171+16)|0);
   $3=$172;
  }
  $174=$5;
  $175=(($174+8)|0);
  $176=((HEAP32[(($175)>>2)])|0);
  $177=$x2;
  $178=($176|0)==($177|0);
  if ($178) {
   $180=$5;
   $181=(($180+16)|0);
   $5=$181;
  }
  $184=$3;
  $185=$4;
  $186=($184|0)!=($185|0);
  if ($186) {
   $188=$5;
   $189=$6;
   $190=($188|0)!=($189|0);
   $192=$190;
  } else {
   $192=0;
  }

  if (!($192)) {
   label = 41;
   break;
  }
 }
 if ((label|0) == 23) {
  $1=0;
  $195=$1;
  STACKTOP=sp;return (($195)|0);
 }
 else if ((label|0) == 41) {
  $1=1;
  $195=$1;
  STACKTOP=sp;return (($195)|0);
 }
  return 0;
}


function _pixman_set_extents($region){
 $region=($region)|0;
 var $1=0,$box=0,$box_end=0,$2=0,$3=0,$4=0,$5=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0,$21=0;
 var $22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0;
 var $43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0;
 var $63=0,$64=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0;
 var $84=0,$89=0,$90=0,$91=0,$93=0,$94=0,$95=0,$96=0,$97=0,$98=0,$99=0,$100=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$109=0,$110=0;
 var $111=0,$112=0,$113=0,$114=0,$115=0,$116=0,$118=0,$119=0,$120=0,$121=0,$122=0,$123=0,$125=0,$126=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0;
 var $135=0,$136=0,$137=0,$138=0,$139=0,$140=0,$141=0,label=0;
 var sp=0;sp=STACKTOP;



 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if (!($5)) {
  STACKTOP=sp;return;
 }
 $8=$1;
 $9=(($8+16)|0);
 $10=((HEAP32[(($9)>>2)])|0);
 $11=(($10)|0);
 $12=((HEAP32[(($11)>>2)])|0);
 $13=($12|0)!=0;
 if (!($13)) {
  $15=$1;
  $16=(($15)|0);
  $17=(($16)|0);
  $18=((HEAP32[(($17)>>2)])|0);
  $19=$1;
  $20=(($19)|0);
  $21=(($20+8)|0);
  HEAP32[(($21)>>2)]=$18;
  $22=$1;
  $23=(($22)|0);
  $24=(($23+4)|0);
  $25=((HEAP32[(($24)>>2)])|0);
  $26=$1;
  $27=(($26)|0);
  $28=(($27+12)|0);
  HEAP32[(($28)>>2)]=$25;
  STACKTOP=sp;return;
 }
 $30=$1;
 $31=(($30+16)|0);
 $32=((HEAP32[(($31)>>2)])|0);
 $33=(($32+8)|0);
 $34=$33;
 $box=$34;
 $35=$1;
 $36=(($35+16)|0);
 $37=((HEAP32[(($36)>>2)])|0);
 $38=(($37+4)|0);
 $39=((HEAP32[(($38)>>2)])|0);
 $40=((($39)-(1))|0);
 $41=$1;
 $42=(($41+16)|0);
 $43=((HEAP32[(($42)>>2)])|0);
 $44=(($43+8)|0);
 $45=$44;
 $46=(($45+($40<<4))|0);
 $box_end=$46;
 $47=$box;
 $48=(($47)|0);
 $49=((HEAP32[(($48)>>2)])|0);
 $50=$1;
 $51=(($50)|0);
 $52=(($51)|0);
 HEAP32[(($52)>>2)]=$49;
 $53=$box;
 $54=(($53+4)|0);
 $55=((HEAP32[(($54)>>2)])|0);
 $56=$1;
 $57=(($56)|0);
 $58=(($57+4)|0);
 HEAP32[(($58)>>2)]=$55;
 $59=$box_end;
 $60=(($59+8)|0);
 $61=((HEAP32[(($60)>>2)])|0);
 $62=$1;
 $63=(($62)|0);
 $64=(($63+8)|0);
 HEAP32[(($64)>>2)]=$61;
 $65=$box_end;
 $66=(($65+12)|0);
 $67=((HEAP32[(($66)>>2)])|0);
 $68=$1;
 $69=(($68)|0);
 $70=(($69+12)|0);
 HEAP32[(($70)>>2)]=$67;
 $72=$1;
 $73=(($72)|0);
 $74=(($73+4)|0);
 $75=((HEAP32[(($74)>>2)])|0);
 $76=$1;
 $77=(($76)|0);
 $78=(($77+12)|0);
 $79=((HEAP32[(($78)>>2)])|0);
 $80=($75|0)<($79|0);
 $81=$80^1;
 $82=($81&1);
 $83=($82);
 $84=($83|0)!=0;
 if ($84) {
  __pixman_log_error(1112,880);
 }
 while(1) {
  $89=$box;
  $90=$box_end;
  $91=($89>>>0)<=($90>>>0);
  if (!($91)) {
   break;
  }
  $93=$box;
  $94=(($93)|0);
  $95=((HEAP32[(($94)>>2)])|0);
  $96=$1;
  $97=(($96)|0);
  $98=(($97)|0);
  $99=((HEAP32[(($98)>>2)])|0);
  $100=($95|0)<($99|0);
  if ($100) {
   $102=$box;
   $103=(($102)|0);
   $104=((HEAP32[(($103)>>2)])|0);
   $105=$1;
   $106=(($105)|0);
   $107=(($106)|0);
   HEAP32[(($107)>>2)]=$104;
  }
  $109=$box;
  $110=(($109+8)|0);
  $111=((HEAP32[(($110)>>2)])|0);
  $112=$1;
  $113=(($112)|0);
  $114=(($113+8)|0);
  $115=((HEAP32[(($114)>>2)])|0);
  $116=($111|0)>($115|0);
  if ($116) {
   $118=$box;
   $119=(($118+8)|0);
   $120=((HEAP32[(($119)>>2)])|0);
   $121=$1;
   $122=(($121)|0);
   $123=(($122+8)|0);
   HEAP32[(($123)>>2)]=$120;
  }
  $125=$box;
  $126=(($125+16)|0);
  $box=$126;
 }
 $129=$1;
 $130=(($129)|0);
 $131=(($130)|0);
 $132=((HEAP32[(($131)>>2)])|0);
 $133=$1;
 $134=(($133)|0);
 $135=(($134+8)|0);
 $136=((HEAP32[(($135)>>2)])|0);
 $137=($132|0)<($136|0);
 $138=$137^1;
 $139=($138&1);
 $140=($139);
 $141=($140|0)!=0;
 if ($141) {
  __pixman_log_error(1112,776);
 }
 STACKTOP=sp;return;
}


function _pixman_region32_intersect_rect($dest,$source,$x,$y,$width,$height){
 $dest=($dest)|0;
 $source=($source)|0;
 $x=($x)|0;
 $y=($y)|0;
 $width=($width)|0;
 $height=($height)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$region=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0;
 var $20=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+24)|0;






 $region=((sp)|0);
 $1=$dest;
 $2=$source;
 $3=$x;
 $4=$y;
 $5=$width;
 $6=$height;
 $7=(($region+16)|0);
 HEAP32[(($7)>>2)]=0;
 $8=$3;
 $9=(($region)|0);
 $10=(($9)|0);
 HEAP32[(($10)>>2)]=$8;
 $11=$4;
 $12=(($region)|0);
 $13=(($12+4)|0);
 HEAP32[(($13)>>2)]=$11;
 $14=$3;
 $15=$5;
 $16=((($14)+($15))|0);
 $17=(($region)|0);
 $18=(($17+8)|0);
 HEAP32[(($18)>>2)]=$16;
 $19=$4;
 $20=$6;
 $21=((($19)+($20))|0);
 $22=(($region)|0);
 $23=(($22+12)|0);
 HEAP32[(($23)>>2)]=$21;
 $24=$1;
 $25=$2;
 $26=((_pixman_region32_intersect($24,$25,$region))|0);
 STACKTOP=sp;return (($26)|0);
}


function _pixman_region32_union_rect($dest,$source,$x,$y,$width,$height){
 $dest=($dest)|0;
 $source=($source)|0;
 $x=($x)|0;
 $y=($y)|0;
 $width=($width)|0;
 $height=($height)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$region=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0;
 var $20=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$40=0,$41=0;
 var $42=0,$43=0,$44=0,$45=0,$46=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$57=0,$58=0,$59=0,$61=0,$62=0,$63=0,$64=0,$66=0;
 var label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+24)|0;







 $region=((sp)|0);
 $2=$dest;
 $3=$source;
 $4=$x;
 $5=$y;
 $6=$width;
 $7=$height;
 $8=$4;
 $9=(($region)|0);
 $10=(($9)|0);
 HEAP32[(($10)>>2)]=$8;
 $11=$5;
 $12=(($region)|0);
 $13=(($12+4)|0);
 HEAP32[(($13)>>2)]=$11;
 $14=$4;
 $15=$6;
 $16=((($14)+($15))|0);
 $17=(($region)|0);
 $18=(($17+8)|0);
 HEAP32[(($18)>>2)]=$16;
 $19=$5;
 $20=$7;
 $21=((($19)+($20))|0);
 $22=(($region)|0);
 $23=(($22+12)|0);
 HEAP32[(($23)>>2)]=$21;
 $24=(($region)|0);
 $25=(($24)|0);
 $26=((HEAP32[(($25)>>2)])|0);
 $27=(($region)|0);
 $28=(($27+8)|0);
 $29=((HEAP32[(($28)>>2)])|0);
 $30=($26|0)<($29|0);
 if ($30) {
  $32=(($region)|0);
  $33=(($32+4)|0);
  $34=((HEAP32[(($33)>>2)])|0);
  $35=(($region)|0);
  $36=(($35+12)|0);
  $37=((HEAP32[(($36)>>2)])|0);
  $38=($34|0)<($37|0);
  if ($38) {
   $61=(($region+16)|0);
   HEAP32[(($61)>>2)]=0;
   $62=$2;
   $63=$3;
   $64=((_pixman_region32_union($62,$63,$region))|0);
   $1=$64;
   $66=$1;
   STACKTOP=sp;return (($66)|0);
  }
 }
 $40=(($region)|0);
 $41=(($40)|0);
 $42=((HEAP32[(($41)>>2)])|0);
 $43=(($region)|0);
 $44=(($43+8)|0);
 $45=((HEAP32[(($44)>>2)])|0);
 $46=($42|0)>($45|0);
 if ($46) {
  label = 5;
 } else {
  $48=(($region)|0);
  $49=(($48+4)|0);
  $50=((HEAP32[(($49)>>2)])|0);
  $51=(($region)|0);
  $52=(($51+12)|0);
  $53=((HEAP32[(($52)>>2)])|0);
  $54=($50|0)>($53|0);
  if ($54) {
   label = 5;
  }
 }
 if ((label|0) == 5) {
  __pixman_log_error(1632,344);
 }
 $57=$2;
 $58=$3;
 $59=((_pixman_region32_copy($57,$58))|0);
 $1=$59;
 $66=$1;
 STACKTOP=sp;return (($66)|0);
}


function _pixman_region32_union($new_reg,$reg1,$reg2){
 $new_reg=($new_reg)|0;
 $reg1=($reg1)|0;
 $reg2=($reg2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,$15=0,$16=0,$18=0,$19=0,$20=0,$21=0,$22=0,$23=0;
 var $25=0,$26=0,$27=0,$28=0,$29=0,$31=0,$32=0,$34=0,$35=0,$36=0,$38=0,$39=0,$40=0,$43=0,$44=0,$45=0,$46=0,$48=0,$49=0,$50=0;
 var $51=0,$52=0,$53=0,$55=0,$56=0,$57=0,$58=0,$59=0,$61=0,$62=0,$64=0,$65=0,$66=0,$68=0,$69=0,$70=0,$73=0,$74=0,$75=0,$76=0;
 var $78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$85=0,$86=0,$88=0,$89=0,$90=0,$91=0,$92=0,$93=0,$94=0,$95=0,$96=0,$98=0,$99=0;
 var $100=0,$101=0,$102=0,$103=0,$104=0,$105=0,$106=0,$108=0,$109=0,$110=0,$111=0,$112=0,$113=0,$114=0,$115=0,$116=0,$118=0,$119=0,$120=0,$122=0;
 var $123=0,$124=0,$127=0,$128=0,$129=0,$130=0,$132=0,$133=0,$134=0,$135=0,$136=0,$137=0,$138=0,$139=0,$140=0,$142=0,$143=0,$144=0,$145=0,$146=0;
 var $147=0,$148=0,$149=0,$150=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$160=0,$162=0,$163=0,$164=0,$165=0,$166=0,$167=0,$168=0;
 var $169=0,$170=0,$172=0,$173=0,$174=0,$176=0,$177=0,$178=0,$181=0,$182=0,$183=0,$184=0,$185=0,$188=0,$189=0,$190=0,$191=0,$192=0,$193=0,$194=0;
 var $195=0,$196=0,$198=0,$199=0,$200=0,$201=0,$203=0,$204=0,$205=0,$206=0,$208=0,$209=0,$210=0,$211=0,$212=0,$213=0,$214=0,$215=0,$216=0,$217=0;
 var $218=0,$219=0,$220=0,$222=0,$223=0,$224=0,$225=0,$227=0,$228=0,$229=0,$230=0,$232=0,$233=0,$234=0,$235=0,$236=0,$237=0,$238=0,$239=0,$240=0;
 var $241=0,$242=0,$243=0,$244=0,$246=0,$247=0,$248=0,$249=0,$251=0,$252=0,$253=0,$254=0,$256=0,$257=0,$258=0,$259=0,$260=0,$261=0,$262=0,$263=0;
 var $264=0,$265=0,$266=0,$267=0,$268=0,$270=0,$271=0,$272=0,$273=0,$275=0,$276=0,$277=0,$278=0,$280=0,$281=0,$282=0,$283=0,$285=0,label=0;
 var sp=0;sp=STACKTOP;




 $2=$new_reg;
 $3=$reg1;
 $4=$reg2;
 $5=$3;
 $6=$4;
 $7=($5|0)==($6|0);
 if ($7) {
  $9=$2;
  $10=$3;
  $11=((_pixman_region32_copy($9,$10))|0);
  $1=$11;
  $285=$1;
  STACKTOP=sp;return (($285)|0);
 }
 $13=$3;
 $14=(($13+16)|0);
 $15=((HEAP32[(($14)>>2)])|0);
 $16=($15|0)!=0;
 if ($16) {
  $18=$3;
  $19=(($18+16)|0);
  $20=((HEAP32[(($19)>>2)])|0);
  $21=(($20+4)|0);
  $22=((HEAP32[(($21)>>2)])|0);
  $23=($22|0)!=0;
  if (!($23)) {
   $25=$3;
   $26=(($25+16)|0);
   $27=((HEAP32[(($26)>>2)])|0);
   $28=((HEAP32[((24)>>2)])|0);
   $29=($27|0)==($28|0);
   if ($29) {
    $31=$2;
    $32=((_pixman_break($31))|0);
    $1=$32;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   }
   $34=$2;
   $35=$4;
   $36=($34|0)!=($35|0);
   if ($36) {
    $38=$2;
    $39=$4;
    $40=((_pixman_region32_copy($38,$39))|0);
    $1=$40;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   } else {
    $1=1;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   }
  }
 }
 $43=$4;
 $44=(($43+16)|0);
 $45=((HEAP32[(($44)>>2)])|0);
 $46=($45|0)!=0;
 if ($46) {
  $48=$4;
  $49=(($48+16)|0);
  $50=((HEAP32[(($49)>>2)])|0);
  $51=(($50+4)|0);
  $52=((HEAP32[(($51)>>2)])|0);
  $53=($52|0)!=0;
  if (!($53)) {
   $55=$4;
   $56=(($55+16)|0);
   $57=((HEAP32[(($56)>>2)])|0);
   $58=((HEAP32[((24)>>2)])|0);
   $59=($57|0)==($58|0);
   if ($59) {
    $61=$2;
    $62=((_pixman_break($61))|0);
    $1=$62;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   }
   $64=$2;
   $65=$3;
   $66=($64|0)!=($65|0);
   if ($66) {
    $68=$2;
    $69=$3;
    $70=((_pixman_region32_copy($68,$69))|0);
    $1=$70;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   } else {
    $1=1;
    $285=$1;
    STACKTOP=sp;return (($285)|0);
   }
  }
 }
 $73=$3;
 $74=(($73+16)|0);
 $75=((HEAP32[(($74)>>2)])|0);
 $76=($75|0)!=0;
 if (!($76)) {
  $78=$3;
  $79=(($78)|0);
  $80=(($79)|0);
  $81=((HEAP32[(($80)>>2)])|0);
  $82=$4;
  $83=(($82)|0);
  $84=(($83)|0);
  $85=((HEAP32[(($84)>>2)])|0);
  $86=($81|0)<=($85|0);
  if ($86) {
   $88=$3;
   $89=(($88)|0);
   $90=(($89+8)|0);
   $91=((HEAP32[(($90)>>2)])|0);
   $92=$4;
   $93=(($92)|0);
   $94=(($93+8)|0);
   $95=((HEAP32[(($94)>>2)])|0);
   $96=($91|0)>=($95|0);
   if ($96) {
    $98=$3;
    $99=(($98)|0);
    $100=(($99+4)|0);
    $101=((HEAP32[(($100)>>2)])|0);
    $102=$4;
    $103=(($102)|0);
    $104=(($103+4)|0);
    $105=((HEAP32[(($104)>>2)])|0);
    $106=($101|0)<=($105|0);
    if ($106) {
     $108=$3;
     $109=(($108)|0);
     $110=(($109+12)|0);
     $111=((HEAP32[(($110)>>2)])|0);
     $112=$4;
     $113=(($112)|0);
     $114=(($113+12)|0);
     $115=((HEAP32[(($114)>>2)])|0);
     $116=($111|0)>=($115|0);
     if ($116) {
      $118=$2;
      $119=$3;
      $120=($118|0)!=($119|0);
      if ($120) {
       $122=$2;
       $123=$3;
       $124=((_pixman_region32_copy($122,$123))|0);
       $1=$124;
       $285=$1;
       STACKTOP=sp;return (($285)|0);
      } else {
       $1=1;
       $285=$1;
       STACKTOP=sp;return (($285)|0);
      }
     }
    }
   }
  }
 }
 $127=$4;
 $128=(($127+16)|0);
 $129=((HEAP32[(($128)>>2)])|0);
 $130=($129|0)!=0;
 if (!($130)) {
  $132=$4;
  $133=(($132)|0);
  $134=(($133)|0);
  $135=((HEAP32[(($134)>>2)])|0);
  $136=$3;
  $137=(($136)|0);
  $138=(($137)|0);
  $139=((HEAP32[(($138)>>2)])|0);
  $140=($135|0)<=($139|0);
  if ($140) {
   $142=$4;
   $143=(($142)|0);
   $144=(($143+8)|0);
   $145=((HEAP32[(($144)>>2)])|0);
   $146=$3;
   $147=(($146)|0);
   $148=(($147+8)|0);
   $149=((HEAP32[(($148)>>2)])|0);
   $150=($145|0)>=($149|0);
   if ($150) {
    $152=$4;
    $153=(($152)|0);
    $154=(($153+4)|0);
    $155=((HEAP32[(($154)>>2)])|0);
    $156=$3;
    $157=(($156)|0);
    $158=(($157+4)|0);
    $159=((HEAP32[(($158)>>2)])|0);
    $160=($155|0)<=($159|0);
    if ($160) {
     $162=$4;
     $163=(($162)|0);
     $164=(($163+12)|0);
     $165=((HEAP32[(($164)>>2)])|0);
     $166=$3;
     $167=(($166)|0);
     $168=(($167+12)|0);
     $169=((HEAP32[(($168)>>2)])|0);
     $170=($165|0)>=($169|0);
     if ($170) {
      $172=$2;
      $173=$4;
      $174=($172|0)!=($173|0);
      if ($174) {
       $176=$2;
       $177=$4;
       $178=((_pixman_region32_copy($176,$177))|0);
       $1=$178;
       $285=$1;
       STACKTOP=sp;return (($285)|0);
      } else {
       $1=1;
       $285=$1;
       STACKTOP=sp;return (($285)|0);
      }
     }
    }
   }
  }
 }
 $181=$2;
 $182=$3;
 $183=$4;
 $184=((_pixman_op($181,$182,$183,6,1,1))|0);
 $185=($184|0)!=0;
 if (!($185)) {
  $1=0;
  $285=$1;
  STACKTOP=sp;return (($285)|0);
 }
 $188=$3;
 $189=(($188)|0);
 $190=(($189)|0);
 $191=((HEAP32[(($190)>>2)])|0);
 $192=$4;
 $193=(($192)|0);
 $194=(($193)|0);
 $195=((HEAP32[(($194)>>2)])|0);
 $196=($191|0)<($195|0);
 if ($196) {
  $198=$3;
  $199=(($198)|0);
  $200=(($199)|0);
  $201=((HEAP32[(($200)>>2)])|0);
  $208=$201;
 } else {
  $203=$4;
  $204=(($203)|0);
  $205=(($204)|0);
  $206=((HEAP32[(($205)>>2)])|0);
  $208=$206;
 }

 $209=$2;
 $210=(($209)|0);
 $211=(($210)|0);
 HEAP32[(($211)>>2)]=$208;
 $212=$3;
 $213=(($212)|0);
 $214=(($213+4)|0);
 $215=((HEAP32[(($214)>>2)])|0);
 $216=$4;
 $217=(($216)|0);
 $218=(($217+4)|0);
 $219=((HEAP32[(($218)>>2)])|0);
 $220=($215|0)<($219|0);
 if ($220) {
  $222=$3;
  $223=(($222)|0);
  $224=(($223+4)|0);
  $225=((HEAP32[(($224)>>2)])|0);
  $232=$225;
 } else {
  $227=$4;
  $228=(($227)|0);
  $229=(($228+4)|0);
  $230=((HEAP32[(($229)>>2)])|0);
  $232=$230;
 }

 $233=$2;
 $234=(($233)|0);
 $235=(($234+4)|0);
 HEAP32[(($235)>>2)]=$232;
 $236=$3;
 $237=(($236)|0);
 $238=(($237+8)|0);
 $239=((HEAP32[(($238)>>2)])|0);
 $240=$4;
 $241=(($240)|0);
 $242=(($241+8)|0);
 $243=((HEAP32[(($242)>>2)])|0);
 $244=($239|0)>($243|0);
 if ($244) {
  $246=$3;
  $247=(($246)|0);
  $248=(($247+8)|0);
  $249=((HEAP32[(($248)>>2)])|0);
  $256=$249;
 } else {
  $251=$4;
  $252=(($251)|0);
  $253=(($252+8)|0);
  $254=((HEAP32[(($253)>>2)])|0);
  $256=$254;
 }

 $257=$2;
 $258=(($257)|0);
 $259=(($258+8)|0);
 HEAP32[(($259)>>2)]=$256;
 $260=$3;
 $261=(($260)|0);
 $262=(($261+12)|0);
 $263=((HEAP32[(($262)>>2)])|0);
 $264=$4;
 $265=(($264)|0);
 $266=(($265+12)|0);
 $267=((HEAP32[(($266)>>2)])|0);
 $268=($263|0)>($267|0);
 if ($268) {
  $270=$3;
  $271=(($270)|0);
  $272=(($271+12)|0);
  $273=((HEAP32[(($272)>>2)])|0);
  $280=$273;
 } else {
  $275=$4;
  $276=(($275)|0);
  $277=(($276+12)|0);
  $278=((HEAP32[(($277)>>2)])|0);
  $280=$278;
 }

 $281=$2;
 $282=(($281)|0);
 $283=(($282+12)|0);
 HEAP32[(($283)>>2)]=$280;
 $1=1;
 $285=$1;
 STACKTOP=sp;return (($285)|0);
}


function _pixman_region_union_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){
 $region=($region)|0;
 $r1=($r1)|0;
 $r1_end=($r1_end)|0;
 $r2=($r2)|0;
 $r2_end=($r2_end)|0;
 $y1=($y1)|0;
 $y2=($y2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$next_rect=0,$x1=0,$x2=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$21=0,$22=0;
 var $23=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$46=0,$47=0;
 var $48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0,$65=0,$66=0,$67=0,$68=0,$69=0;
 var $70=0,$71=0,$72=0,$75=0,$76=0,$77=0,$79=0,$80=0,$81=0,$83=0,$85=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0,$94=0,$95=0,$96=0;
 var $97=0,$98=0,$100=0,$101=0,$102=0,$103=0,$104=0,$106=0,$107=0,$108=0,$112=0,$113=0,$114=0,$115=0,$117=0,$118=0,$119=0,$120=0,$121=0,$122=0;
 var $123=0,$124=0,$125=0,$126=0,$127=0,$129=0,$130=0,$131=0,$134=0,$135=0,$136=0,$137=0,$138=0,$139=0,$140=0,$141=0,$142=0,$143=0,$144=0,$147=0;
 var $148=0,$149=0,$150=0,$151=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$160=0,$162=0,$163=0,$164=0,$165=0,$166=0,$167=0,$169=0;
 var $170=0,$171=0,$172=0,$173=0,$174=0,$175=0,$176=0,$177=0,$178=0,$179=0,$180=0,$181=0,$182=0,$183=0,$188=0,$189=0,$190=0,$191=0,$192=0,$193=0;
 var $195=0,$196=0,$200=0,$201=0,$202=0,$203=0,$204=0,$206=0,$207=0,$208=0,$209=0,$210=0,$212=0,$213=0,$214=0,$218=0,$219=0,$220=0,$221=0,$223=0;
 var $224=0,$225=0,$226=0,$227=0,$228=0,$229=0,$230=0,$231=0,$232=0,$233=0,$235=0,$236=0,$237=0,$240=0,$241=0,$242=0,$243=0,$244=0,$245=0,$246=0;
 var $247=0,$248=0,$249=0,$250=0,$253=0,$254=0,$255=0,$256=0,$257=0,$258=0,$259=0,$260=0,$261=0,$262=0,$263=0,$264=0,$265=0,$266=0,$268=0,$269=0;
 var $270=0,$271=0,$272=0,$273=0,$275=0,$276=0,$277=0,$278=0,$279=0,$280=0,$281=0,$282=0,$283=0,$284=0,$285=0,$286=0,$287=0,$288=0,$289=0,$294=0;
 var $295=0,$296=0,$297=0,$298=0,$299=0,$301=0,$302=0,$306=0,$307=0,$308=0,$312=0,$313=0,$314=0,$315=0,$316=0,$318=0,$319=0,$320=0,$321=0,$322=0;
 var $324=0,$325=0,$326=0,$330=0,$331=0,$332=0,$333=0,$335=0,$336=0,$337=0,$338=0,$339=0,$340=0,$341=0,$342=0,$343=0,$344=0,$345=0,$347=0,$348=0;
 var $349=0,$352=0,$353=0,$354=0,$355=0,$356=0,$357=0,$358=0,$359=0,$360=0,$361=0,$362=0,$365=0,$366=0,$367=0,$368=0,$369=0,$370=0,$371=0,$372=0;
 var $373=0,$374=0,$375=0,$376=0,$377=0,$378=0,$380=0,$381=0,$382=0,$383=0,$384=0,$385=0,$387=0,$388=0,$389=0,$390=0,$391=0,$392=0,$393=0,$394=0;
 var $395=0,$396=0,$397=0,$398=0,$399=0,$400=0,$401=0,$406=0,$407=0,$408=0,$409=0,$410=0,$411=0,$413=0,$414=0,$417=0,$418=0,$419=0,$422=0,$423=0;
 var $424=0,$428=0,$429=0,$430=0,$431=0,$432=0,$434=0,$435=0,$436=0,$437=0,$438=0,$440=0,$441=0,$442=0,$446=0,$447=0,$448=0,$449=0,$451=0,$452=0;
 var $453=0,$454=0,$455=0,$456=0,$457=0,$458=0,$459=0,$460=0,$461=0,$463=0,$464=0,$465=0,$468=0,$469=0,$470=0,$471=0,$472=0,$473=0,$474=0,$475=0;
 var $476=0,$477=0,$478=0,$481=0,$482=0,$483=0,$484=0,$485=0,$486=0,$487=0,$488=0,$489=0,$490=0,$491=0,$492=0,$493=0,$494=0,$496=0,$497=0,$498=0;
 var $499=0,$500=0,$501=0,$503=0,$504=0,$505=0,$506=0,$507=0,$508=0,$509=0,$510=0,$511=0,$512=0,$513=0,$514=0,$515=0,$516=0,$517=0,$522=0,$523=0;
 var $524=0,$525=0,$526=0,$527=0,$529=0,$530=0,$533=0,$534=0,$535=0,$540=0,$541=0,$542=0,$543=0,$545=0,$546=0,$547=0,$548=0,$549=0,$550=0,$551=0;
 var $552=0,$553=0,$554=0,$555=0,$557=0,$558=0,$559=0,$562=0,$563=0,$564=0,$565=0,$566=0,$567=0,$568=0,$569=0,$570=0,$571=0,$572=0,$575=0,$576=0;
 var $577=0,$578=0,$579=0,$580=0,$581=0,$582=0,$583=0,$584=0,$585=0,$586=0,$587=0,$588=0,$590=0,$591=0,$592=0,$593=0,$594=0,$595=0,$597=0,$598=0;
 var $599=0,$600=0,$601=0,$602=0,$603=0,$604=0,$605=0,$606=0,$607=0,$608=0,$609=0,$610=0,$611=0,$617=0,label=0;
 var sp=0;sp=STACKTOP;











 $2=$region;
 $3=$r1;
 $4=$r1_end;
 $5=$r2;
 $6=$r2_end;
 $7=$y1;
 $8=$y2;
 $10=$7;
 $11=$8;
 $12=($10|0)<($11|0);
 $13=$12^1;
 $14=($13&1);
 $15=($14);
 $16=($15|0)!=0;
 if ($16) {
  __pixman_log_error(1160,168);
 }
 $21=$3;
 $22=$4;
 $23=($21|0)!=($22|0);
 if ($23) {
  $25=$5;
  $26=$6;
  $27=($25|0)!=($26|0);
  $29=$27;
 } else {
  $29=0;
 }

 $30=$29^1;
 $31=($30&1);
 $32=($31);
 $33=($32|0)!=0;
 if ($33) {
  __pixman_log_error(1160,112);
 }
 $37=$2;
 $38=(($37+16)|0);
 $39=((HEAP32[(($38)>>2)])|0);
 $40=(($39+4)|0);
 $41=((HEAP32[(($40)>>2)])|0);
 $42=$2;
 $43=(($42+16)|0);
 $44=((HEAP32[(($43)>>2)])|0);
 $45=(($44+8)|0);
 $46=$45;
 $47=(($46+($41<<4))|0);
 $next_rect=$47;
 $48=$3;
 $49=(($48)|0);
 $50=((HEAP32[(($49)>>2)])|0);
 $51=$5;
 $52=(($51)|0);
 $53=((HEAP32[(($52)>>2)])|0);
 $54=($50|0)<($53|0);
 if ($54) {
  $56=$3;
  $57=(($56)|0);
  $58=((HEAP32[(($57)>>2)])|0);
  $x1=$58;
  $59=$3;
  $60=(($59+8)|0);
  $61=((HEAP32[(($60)>>2)])|0);
  $x2=$61;
  $62=$3;
  $63=(($62+16)|0);
  $3=$63;
 } else {
  $65=$5;
  $66=(($65)|0);
  $67=((HEAP32[(($66)>>2)])|0);
  $x1=$67;
  $68=$5;
  $69=(($68+8)|0);
  $70=((HEAP32[(($69)>>2)])|0);
  $x2=$70;
  $71=$5;
  $72=(($71+16)|0);
  $5=$72;
 }
 while(1) {
  $75=$3;
  $76=$4;
  $77=($75|0)!=($76|0);
  if ($77) {
   $79=$5;
   $80=$6;
   $81=($79|0)!=($80|0);
   $83=$81;
  } else {
   $83=0;
  }

  if (!($83)) {
   label = 62;
   break;
  }
  $85=$3;
  $86=(($85)|0);
  $87=((HEAP32[(($86)>>2)])|0);
  $88=$5;
  $89=(($88)|0);
  $90=((HEAP32[(($89)>>2)])|0);
  $91=($87|0)<($90|0);
  if ($91) {
   $94=$3;
   $95=(($94)|0);
   $96=((HEAP32[(($95)>>2)])|0);
   $97=$x2;
   $98=($96|0)<=($97|0);
   if ($98) {
    $100=$x2;
    $101=$3;
    $102=(($101+8)|0);
    $103=((HEAP32[(($102)>>2)])|0);
    $104=($100|0)<($103|0);
    if ($104) {
     $106=$3;
     $107=(($106+8)|0);
     $108=((HEAP32[(($107)>>2)])|0);
     $x2=$108;
    }
   } else {
    $112=$2;
    $113=(($112+16)|0);
    $114=((HEAP32[(($113)>>2)])|0);
    $115=($114|0)!=0;
    if ($115) {
     $117=$2;
     $118=(($117+16)|0);
     $119=((HEAP32[(($118)>>2)])|0);
     $120=(($119+4)|0);
     $121=((HEAP32[(($120)>>2)])|0);
     $122=$2;
     $123=(($122+16)|0);
     $124=((HEAP32[(($123)>>2)])|0);
     $125=(($124)|0);
     $126=((HEAP32[(($125)>>2)])|0);
     $127=($121|0)==($126|0);
     if ($127) {
      label = 27;
     }
    } else {
     label = 27;
    }
    if ((label|0) == 27) {
     label = 0;
     $129=$2;
     $130=((_pixman_rect_alloc($129,1))|0);
     $131=($130|0)!=0;
     if (!($131)) {
      label = 28;
      break;
     }
     $134=$2;
     $135=(($134+16)|0);
     $136=((HEAP32[(($135)>>2)])|0);
     $137=(($136+4)|0);
     $138=((HEAP32[(($137)>>2)])|0);
     $139=$2;
     $140=(($139+16)|0);
     $141=((HEAP32[(($140)>>2)])|0);
     $142=(($141+8)|0);
     $143=$142;
     $144=(($143+($138<<4))|0);
     $next_rect=$144;
    }
    $147=$x1;
    $148=$next_rect;
    $149=(($148)|0);
    HEAP32[(($149)>>2)]=$147;
    $150=$7;
    $151=$next_rect;
    $152=(($151+4)|0);
    HEAP32[(($152)>>2)]=$150;
    $153=$x2;
    $154=$next_rect;
    $155=(($154+8)|0);
    HEAP32[(($155)>>2)]=$153;
    $156=$8;
    $157=$next_rect;
    $158=(($157+12)|0);
    HEAP32[(($158)>>2)]=$156;
    $159=$next_rect;
    $160=(($159+16)|0);
    $next_rect=$160;
    $162=$2;
    $163=(($162+16)|0);
    $164=((HEAP32[(($163)>>2)])|0);
    $165=(($164+4)|0);
    $166=((HEAP32[(($165)>>2)])|0);
    $167=((($166)+(1))|0);
    HEAP32[(($165)>>2)]=$167;
    $169=$2;
    $170=(($169+16)|0);
    $171=((HEAP32[(($170)>>2)])|0);
    $172=(($171+4)|0);
    $173=((HEAP32[(($172)>>2)])|0);
    $174=$2;
    $175=(($174+16)|0);
    $176=((HEAP32[(($175)>>2)])|0);
    $177=(($176)|0);
    $178=((HEAP32[(($177)>>2)])|0);
    $179=($173|0)<=($178|0);
    $180=$179^1;
    $181=($180&1);
    $182=($181);
    $183=($182|0)!=0;
    if ($183) {
     __pixman_log_error(1160,992);
    }
    $188=$3;
    $189=(($188)|0);
    $190=((HEAP32[(($189)>>2)])|0);
    $x1=$190;
    $191=$3;
    $192=(($191+8)|0);
    $193=((HEAP32[(($192)>>2)])|0);
    $x2=$193;
   }
   $195=$3;
   $196=(($195+16)|0);
   $3=$196;
  } else {
   $200=$5;
   $201=(($200)|0);
   $202=((HEAP32[(($201)>>2)])|0);
   $203=$x2;
   $204=($202|0)<=($203|0);
   if ($204) {
    $206=$x2;
    $207=$5;
    $208=(($207+8)|0);
    $209=((HEAP32[(($208)>>2)])|0);
    $210=($206|0)<($209|0);
    if ($210) {
     $212=$5;
     $213=(($212+8)|0);
     $214=((HEAP32[(($213)>>2)])|0);
     $x2=$214;
    }
   } else {
    $218=$2;
    $219=(($218+16)|0);
    $220=((HEAP32[(($219)>>2)])|0);
    $221=($220|0)!=0;
    if ($221) {
     $223=$2;
     $224=(($223+16)|0);
     $225=((HEAP32[(($224)>>2)])|0);
     $226=(($225+4)|0);
     $227=((HEAP32[(($226)>>2)])|0);
     $228=$2;
     $229=(($228+16)|0);
     $230=((HEAP32[(($229)>>2)])|0);
     $231=(($230)|0);
     $232=((HEAP32[(($231)>>2)])|0);
     $233=($227|0)==($232|0);
     if ($233) {
      label = 48;
     }
    } else {
     label = 48;
    }
    if ((label|0) == 48) {
     label = 0;
     $235=$2;
     $236=((_pixman_rect_alloc($235,1))|0);
     $237=($236|0)!=0;
     if (!($237)) {
      label = 49;
      break;
     }
     $240=$2;
     $241=(($240+16)|0);
     $242=((HEAP32[(($241)>>2)])|0);
     $243=(($242+4)|0);
     $244=((HEAP32[(($243)>>2)])|0);
     $245=$2;
     $246=(($245+16)|0);
     $247=((HEAP32[(($246)>>2)])|0);
     $248=(($247+8)|0);
     $249=$248;
     $250=(($249+($244<<4))|0);
     $next_rect=$250;
    }
    $253=$x1;
    $254=$next_rect;
    $255=(($254)|0);
    HEAP32[(($255)>>2)]=$253;
    $256=$7;
    $257=$next_rect;
    $258=(($257+4)|0);
    HEAP32[(($258)>>2)]=$256;
    $259=$x2;
    $260=$next_rect;
    $261=(($260+8)|0);
    HEAP32[(($261)>>2)]=$259;
    $262=$8;
    $263=$next_rect;
    $264=(($263+12)|0);
    HEAP32[(($264)>>2)]=$262;
    $265=$next_rect;
    $266=(($265+16)|0);
    $next_rect=$266;
    $268=$2;
    $269=(($268+16)|0);
    $270=((HEAP32[(($269)>>2)])|0);
    $271=(($270+4)|0);
    $272=((HEAP32[(($271)>>2)])|0);
    $273=((($272)+(1))|0);
    HEAP32[(($271)>>2)]=$273;
    $275=$2;
    $276=(($275+16)|0);
    $277=((HEAP32[(($276)>>2)])|0);
    $278=(($277+4)|0);
    $279=((HEAP32[(($278)>>2)])|0);
    $280=$2;
    $281=(($280+16)|0);
    $282=((HEAP32[(($281)>>2)])|0);
    $283=(($282)|0);
    $284=((HEAP32[(($283)>>2)])|0);
    $285=($279|0)<=($284|0);
    $286=$285^1;
    $287=($286&1);
    $288=($287);
    $289=($288|0)!=0;
    if ($289) {
     __pixman_log_error(1160,992);
    }
    $294=$5;
    $295=(($294)|0);
    $296=((HEAP32[(($295)>>2)])|0);
    $x1=$296;
    $297=$5;
    $298=(($297+8)|0);
    $299=((HEAP32[(($298)>>2)])|0);
    $x2=$299;
   }
   $301=$5;
   $302=(($301+16)|0);
   $5=$302;
  }
 }
 if ((label|0) == 28) {
  $1=0;
  $617=$1;
  STACKTOP=sp;return (($617)|0);
 }
 else if ((label|0) == 49) {
  $1=0;
  $617=$1;
  STACKTOP=sp;return (($617)|0);
 }
 else if ((label|0) == 62) {
  $306=$3;
  $307=$4;
  $308=($306|0)!=($307|0);
  do {
   if ($308) {
    while(1) {
     $312=$3;
     $313=(($312)|0);
     $314=((HEAP32[(($313)>>2)])|0);
     $315=$x2;
     $316=($314|0)<=($315|0);
     if ($316) {
      $318=$x2;
      $319=$3;
      $320=(($319+8)|0);
      $321=((HEAP32[(($320)>>2)])|0);
      $322=($318|0)<($321|0);
      if ($322) {
       $324=$3;
       $325=(($324+8)|0);
       $326=((HEAP32[(($325)>>2)])|0);
       $x2=$326;
      }
     } else {
      $330=$2;
      $331=(($330+16)|0);
      $332=((HEAP32[(($331)>>2)])|0);
      $333=($332|0)!=0;
      if ($333) {
       $335=$2;
       $336=(($335+16)|0);
       $337=((HEAP32[(($336)>>2)])|0);
       $338=(($337+4)|0);
       $339=((HEAP32[(($338)>>2)])|0);
       $340=$2;
       $341=(($340+16)|0);
       $342=((HEAP32[(($341)>>2)])|0);
       $343=(($342)|0);
       $344=((HEAP32[(($343)>>2)])|0);
       $345=($339|0)==($344|0);
       if ($345) {
        label = 72;
       }
      } else {
       label = 72;
      }
      if ((label|0) == 72) {
       label = 0;
       $347=$2;
       $348=((_pixman_rect_alloc($347,1))|0);
       $349=($348|0)!=0;
       if (!($349)) {
        break;
       }
       $352=$2;
       $353=(($352+16)|0);
       $354=((HEAP32[(($353)>>2)])|0);
       $355=(($354+4)|0);
       $356=((HEAP32[(($355)>>2)])|0);
       $357=$2;
       $358=(($357+16)|0);
       $359=((HEAP32[(($358)>>2)])|0);
       $360=(($359+8)|0);
       $361=$360;
       $362=(($361+($356<<4))|0);
       $next_rect=$362;
      }
      $365=$x1;
      $366=$next_rect;
      $367=(($366)|0);
      HEAP32[(($367)>>2)]=$365;
      $368=$7;
      $369=$next_rect;
      $370=(($369+4)|0);
      HEAP32[(($370)>>2)]=$368;
      $371=$x2;
      $372=$next_rect;
      $373=(($372+8)|0);
      HEAP32[(($373)>>2)]=$371;
      $374=$8;
      $375=$next_rect;
      $376=(($375+12)|0);
      HEAP32[(($376)>>2)]=$374;
      $377=$next_rect;
      $378=(($377+16)|0);
      $next_rect=$378;
      $380=$2;
      $381=(($380+16)|0);
      $382=((HEAP32[(($381)>>2)])|0);
      $383=(($382+4)|0);
      $384=((HEAP32[(($383)>>2)])|0);
      $385=((($384)+(1))|0);
      HEAP32[(($383)>>2)]=$385;
      $387=$2;
      $388=(($387+16)|0);
      $389=((HEAP32[(($388)>>2)])|0);
      $390=(($389+4)|0);
      $391=((HEAP32[(($390)>>2)])|0);
      $392=$2;
      $393=(($392+16)|0);
      $394=((HEAP32[(($393)>>2)])|0);
      $395=(($394)|0);
      $396=((HEAP32[(($395)>>2)])|0);
      $397=($391|0)<=($396|0);
      $398=$397^1;
      $399=($398&1);
      $400=($399);
      $401=($400|0)!=0;
      if ($401) {
       __pixman_log_error(1160,992);
      }
      $406=$3;
      $407=(($406)|0);
      $408=((HEAP32[(($407)>>2)])|0);
      $x1=$408;
      $409=$3;
      $410=(($409+8)|0);
      $411=((HEAP32[(($410)>>2)])|0);
      $x2=$411;
     }
     $413=$3;
     $414=(($413+16)|0);
     $3=$414;
     $417=$3;
     $418=$4;
     $419=($417|0)!=($418|0);
     if (!($419)) {
      label = 86;
      break;
     }
    }
    if ((label|0) == 86) {
     break;
    }
    $1=0;
    $617=$1;
    STACKTOP=sp;return (($617)|0);
   } else {
    $422=$5;
    $423=$6;
    $424=($422|0)!=($423|0);
    do {
     if ($424) {
      while(1) {
       $428=$5;
       $429=(($428)|0);
       $430=((HEAP32[(($429)>>2)])|0);
       $431=$x2;
       $432=($430|0)<=($431|0);
       if ($432) {
        $434=$x2;
        $435=$5;
        $436=(($435+8)|0);
        $437=((HEAP32[(($436)>>2)])|0);
        $438=($434|0)<($437|0);
        if ($438) {
         $440=$5;
         $441=(($440+8)|0);
         $442=((HEAP32[(($441)>>2)])|0);
         $x2=$442;
        }
       } else {
        $446=$2;
        $447=(($446+16)|0);
        $448=((HEAP32[(($447)>>2)])|0);
        $449=($448|0)!=0;
        if ($449) {
         $451=$2;
         $452=(($451+16)|0);
         $453=((HEAP32[(($452)>>2)])|0);
         $454=(($453+4)|0);
         $455=((HEAP32[(($454)>>2)])|0);
         $456=$2;
         $457=(($456+16)|0);
         $458=((HEAP32[(($457)>>2)])|0);
         $459=(($458)|0);
         $460=((HEAP32[(($459)>>2)])|0);
         $461=($455|0)==($460|0);
         if ($461) {
          label = 97;
         }
        } else {
         label = 97;
        }
        if ((label|0) == 97) {
         label = 0;
         $463=$2;
         $464=((_pixman_rect_alloc($463,1))|0);
         $465=($464|0)!=0;
         if (!($465)) {
          break;
         }
         $468=$2;
         $469=(($468+16)|0);
         $470=((HEAP32[(($469)>>2)])|0);
         $471=(($470+4)|0);
         $472=((HEAP32[(($471)>>2)])|0);
         $473=$2;
         $474=(($473+16)|0);
         $475=((HEAP32[(($474)>>2)])|0);
         $476=(($475+8)|0);
         $477=$476;
         $478=(($477+($472<<4))|0);
         $next_rect=$478;
        }
        $481=$x1;
        $482=$next_rect;
        $483=(($482)|0);
        HEAP32[(($483)>>2)]=$481;
        $484=$7;
        $485=$next_rect;
        $486=(($485+4)|0);
        HEAP32[(($486)>>2)]=$484;
        $487=$x2;
        $488=$next_rect;
        $489=(($488+8)|0);
        HEAP32[(($489)>>2)]=$487;
        $490=$8;
        $491=$next_rect;
        $492=(($491+12)|0);
        HEAP32[(($492)>>2)]=$490;
        $493=$next_rect;
        $494=(($493+16)|0);
        $next_rect=$494;
        $496=$2;
        $497=(($496+16)|0);
        $498=((HEAP32[(($497)>>2)])|0);
        $499=(($498+4)|0);
        $500=((HEAP32[(($499)>>2)])|0);
        $501=((($500)+(1))|0);
        HEAP32[(($499)>>2)]=$501;
        $503=$2;
        $504=(($503+16)|0);
        $505=((HEAP32[(($504)>>2)])|0);
        $506=(($505+4)|0);
        $507=((HEAP32[(($506)>>2)])|0);
        $508=$2;
        $509=(($508+16)|0);
        $510=((HEAP32[(($509)>>2)])|0);
        $511=(($510)|0);
        $512=((HEAP32[(($511)>>2)])|0);
        $513=($507|0)<=($512|0);
        $514=$513^1;
        $515=($514&1);
        $516=($515);
        $517=($516|0)!=0;
        if ($517) {
         __pixman_log_error(1160,992);
        }
        $522=$5;
        $523=(($522)|0);
        $524=((HEAP32[(($523)>>2)])|0);
        $x1=$524;
        $525=$5;
        $526=(($525+8)|0);
        $527=((HEAP32[(($526)>>2)])|0);
        $x2=$527;
       }
       $529=$5;
       $530=(($529+16)|0);
       $5=$530;
       $533=$5;
       $534=$6;
       $535=($533|0)!=($534|0);
       if (!($535)) {
        label = 111;
        break;
       }
      }
      if ((label|0) == 111) {
       break;
      }
      $1=0;
      $617=$1;
      STACKTOP=sp;return (($617)|0);
     }
    } while(0);
   }
  } while(0);
  $540=$2;
  $541=(($540+16)|0);
  $542=((HEAP32[(($541)>>2)])|0);
  $543=($542|0)!=0;
  if ($543) {
   $545=$2;
   $546=(($545+16)|0);
   $547=((HEAP32[(($546)>>2)])|0);
   $548=(($547+4)|0);
   $549=((HEAP32[(($548)>>2)])|0);
   $550=$2;
   $551=(($550+16)|0);
   $552=((HEAP32[(($551)>>2)])|0);
   $553=(($552)|0);
   $554=((HEAP32[(($553)>>2)])|0);
   $555=($549|0)==($554|0);
   if ($555) {
    label = 116;
   }
  } else {
   label = 116;
  }
  do {
   if ((label|0) == 116) {
    $557=$2;
    $558=((_pixman_rect_alloc($557,1))|0);
    $559=($558|0)!=0;
    if ($559) {
     $562=$2;
     $563=(($562+16)|0);
     $564=((HEAP32[(($563)>>2)])|0);
     $565=(($564+4)|0);
     $566=((HEAP32[(($565)>>2)])|0);
     $567=$2;
     $568=(($567+16)|0);
     $569=((HEAP32[(($568)>>2)])|0);
     $570=(($569+8)|0);
     $571=$570;
     $572=(($571+($566<<4))|0);
     $next_rect=$572;
     break;
    }
    $1=0;
    $617=$1;
    STACKTOP=sp;return (($617)|0);
   }
  } while(0);
  $575=$x1;
  $576=$next_rect;
  $577=(($576)|0);
  HEAP32[(($577)>>2)]=$575;
  $578=$7;
  $579=$next_rect;
  $580=(($579+4)|0);
  HEAP32[(($580)>>2)]=$578;
  $581=$x2;
  $582=$next_rect;
  $583=(($582+8)|0);
  HEAP32[(($583)>>2)]=$581;
  $584=$8;
  $585=$next_rect;
  $586=(($585+12)|0);
  HEAP32[(($586)>>2)]=$584;
  $587=$next_rect;
  $588=(($587+16)|0);
  $next_rect=$588;
  $590=$2;
  $591=(($590+16)|0);
  $592=((HEAP32[(($591)>>2)])|0);
  $593=(($592+4)|0);
  $594=((HEAP32[(($593)>>2)])|0);
  $595=((($594)+(1))|0);
  HEAP32[(($593)>>2)]=$595;
  $597=$2;
  $598=(($597+16)|0);
  $599=((HEAP32[(($598)>>2)])|0);
  $600=(($599+4)|0);
  $601=((HEAP32[(($600)>>2)])|0);
  $602=$2;
  $603=(($602+16)|0);
  $604=((HEAP32[(($603)>>2)])|0);
  $605=(($604)|0);
  $606=((HEAP32[(($605)>>2)])|0);
  $607=($601|0)<=($606|0);
  $608=$607^1;
  $609=($608&1);
  $610=($609);
  $611=($610|0)!=0;
  if ($611) {
   __pixman_log_error(1160,992);
  }
  $1=1;
  $617=$1;
  STACKTOP=sp;return (($617)|0);
 }
  return 0;
}


function _pixman_region32_subtract($reg_d,$reg_m,$reg_s){
 $reg_d=($reg_d)|0;
 $reg_m=($reg_m)|0;
 $reg_s=($reg_s)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$22=0,$23=0;
 var $24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0;
 var $46=0,$47=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0;
 var $69=0,$70=0,$71=0,$72=0,$73=0,$75=0,$76=0,$78=0,$79=0,$80=0,$82=0,$83=0,$84=0,$86=0,$87=0,$88=0,$89=0,$91=0,$92=0,$93=0;
 var $94=0,$95=0,$96=0,$98=0,$99=0,$100=0,$101=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$109=0,$110=0,$111=0,$112=0,$113=0,$114=0,$115=0;
 var $116=0,$117=0,$118=0,$119=0,$122=0,$123=0,$124=0,$125=0,$126=0,$129=0,$131=0,label=0;
 var sp=0;sp=STACKTOP;




 $2=$reg_d;
 $3=$reg_m;
 $4=$reg_s;
 $5=$3;
 $6=(($5+16)|0);
 $7=((HEAP32[(($6)>>2)])|0);
 $8=($7|0)!=0;
 if ($8) {
  $10=$3;
  $11=(($10+16)|0);
  $12=((HEAP32[(($11)>>2)])|0);
  $13=(($12+4)|0);
  $14=((HEAP32[(($13)>>2)])|0);
  $15=($14|0)!=0;
  if ($15) {
   label = 3;
  }
 } else {
  label = 3;
 }
 do {
  if ((label|0) == 3) {
   $17=$4;
   $18=(($17+16)|0);
   $19=((HEAP32[(($18)>>2)])|0);
   $20=($19|0)!=0;
   if ($20) {
    $22=$4;
    $23=(($22+16)|0);
    $24=((HEAP32[(($23)>>2)])|0);
    $25=(($24+4)|0);
    $26=((HEAP32[(($25)>>2)])|0);
    $27=($26|0)!=0;
    if (!($27)) {
     break;
    }
   }
   $29=$3;
   $30=(($29)|0);
   $31=(($30+8)|0);
   $32=((HEAP32[(($31)>>2)])|0);
   $33=$4;
   $34=(($33)|0);
   $35=(($34)|0);
   $36=((HEAP32[(($35)>>2)])|0);
   $37=($32|0)<=($36|0);
   if (!($37)) {
    $39=$3;
    $40=(($39)|0);
    $41=(($40)|0);
    $42=((HEAP32[(($41)>>2)])|0);
    $43=$4;
    $44=(($43)|0);
    $45=(($44+8)|0);
    $46=((HEAP32[(($45)>>2)])|0);
    $47=($42|0)>=($46|0);
    if (!($47)) {
     $49=$3;
     $50=(($49)|0);
     $51=(($50+12)|0);
     $52=((HEAP32[(($51)>>2)])|0);
     $53=$4;
     $54=(($53)|0);
     $55=(($54+4)|0);
     $56=((HEAP32[(($55)>>2)])|0);
     $57=($52|0)<=($56|0);
     if (!($57)) {
      $59=$3;
      $60=(($59)|0);
      $61=(($60+4)|0);
      $62=((HEAP32[(($61)>>2)])|0);
      $63=$4;
      $64=(($63)|0);
      $65=(($64+12)|0);
      $66=((HEAP32[(($65)>>2)])|0);
      $67=($62|0)>=($66|0);
      if (!($67)) {
       $82=$3;
       $83=$4;
       $84=($82|0)==($83|0);
       if ($84) {
        $86=$2;
        $87=(($86+16)|0);
        $88=((HEAP32[(($87)>>2)])|0);
        $89=($88|0)!=0;
        if ($89) {
         $91=$2;
         $92=(($91+16)|0);
         $93=((HEAP32[(($92)>>2)])|0);
         $94=(($93)|0);
         $95=((HEAP32[(($94)>>2)])|0);
         $96=($95|0)!=0;
         if ($96) {
          $98=$2;
          $99=(($98+16)|0);
          $100=((HEAP32[(($99)>>2)])|0);
          $101=$100;
          _free($101);
         }
        }
        $103=$2;
        $104=(($103)|0);
        $105=(($104)|0);
        $106=((HEAP32[(($105)>>2)])|0);
        $107=$2;
        $108=(($107)|0);
        $109=(($108+8)|0);
        HEAP32[(($109)>>2)]=$106;
        $110=$2;
        $111=(($110)|0);
        $112=(($111+4)|0);
        $113=((HEAP32[(($112)>>2)])|0);
        $114=$2;
        $115=(($114)|0);
        $116=(($115+12)|0);
        HEAP32[(($116)>>2)]=$113;
        $117=((HEAP32[((8)>>2)])|0);
        $118=$2;
        $119=(($118+16)|0);
        HEAP32[(($119)>>2)]=$117;
        $1=1;
        $131=$1;
        STACKTOP=sp;return (($131)|0);
       }
       $122=$2;
       $123=$3;
       $124=$4;
       $125=((_pixman_op($122,$123,$124,4,1,0))|0);
       $126=($125|0)!=0;
       if ($126) {
        $129=$2;
        _pixman_set_extents($129);
        $1=1;
        $131=$1;
        STACKTOP=sp;return (($131)|0);
       } else {
        $1=0;
        $131=$1;
        STACKTOP=sp;return (($131)|0);
       }
      }
     }
    }
   }
  }
 } while(0);
 $69=$4;
 $70=(($69+16)|0);
 $71=((HEAP32[(($70)>>2)])|0);
 $72=((HEAP32[((24)>>2)])|0);
 $73=($71|0)==($72|0);
 if ($73) {
  $75=$2;
  $76=((_pixman_break($75))|0);
  $1=$76;
  $131=$1;
  STACKTOP=sp;return (($131)|0);
 } else {
  $78=$2;
  $79=$3;
  $80=((_pixman_region32_copy($78,$79))|0);
  $1=$80;
  $131=$1;
  STACKTOP=sp;return (($131)|0);
 }
  return 0;
}


function _pixman_region_subtract_o($region,$r1,$r1_end,$r2,$r2_end,$y1,$y2){
 $region=($region)|0;
 $r1=($r1)|0;
 $r1_end=($r1_end)|0;
 $r2=($r2)|0;
 $r2_end=($r2_end)|0;
 $y1=($y1)|0;
 $y2=($y2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$next_rect=0,$x1=0,$9=0,$10=0,$11=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0;
 var $24=0,$25=0,$26=0,$28=0,$29=0,$30=0,$32=0,$33=0,$34=0,$35=0,$36=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$46=0,$47=0,$48=0;
 var $49=0,$50=0,$52=0,$53=0,$54=0,$55=0,$56=0,$58=0,$59=0,$61=0,$62=0,$63=0,$64=0,$65=0,$67=0,$68=0,$69=0,$70=0,$71=0,$72=0;
 var $73=0,$74=0,$76=0,$77=0,$78=0,$79=0,$80=0,$82=0,$83=0,$84=0,$87=0,$88=0,$91=0,$92=0,$93=0,$94=0,$95=0,$96=0,$97=0,$100=0;
 var $101=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$113=0,$114=0,$115=0,$116=0,$118=0,$119=0,$120=0,$121=0,$122=0,$123=0,$124=0,$125=0;
 var $126=0,$127=0,$128=0,$130=0,$131=0,$132=0,$135=0,$136=0,$137=0,$138=0,$139=0,$140=0,$141=0,$142=0,$143=0,$144=0,$145=0,$148=0,$149=0,$150=0;
 var $151=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$158=0,$159=0,$160=0,$161=0,$162=0,$163=0,$165=0,$166=0,$167=0,$168=0,$169=0,$170=0,$172=0;
 var $173=0,$174=0,$175=0,$176=0,$177=0,$178=0,$179=0,$180=0,$181=0,$182=0,$183=0,$184=0,$185=0,$186=0,$191=0,$192=0,$193=0,$194=0,$195=0,$196=0;
 var $197=0,$198=0,$200=0,$201=0,$202=0,$203=0,$204=0,$206=0,$207=0,$208=0,$211=0,$212=0,$215=0,$216=0,$217=0,$218=0,$219=0,$222=0,$223=0,$224=0;
 var $225=0,$227=0,$228=0,$229=0,$230=0,$231=0,$232=0,$233=0,$234=0,$235=0,$236=0,$237=0,$239=0,$240=0,$241=0,$244=0,$245=0,$246=0,$247=0,$248=0;
 var $249=0,$250=0,$251=0,$252=0,$253=0,$254=0,$257=0,$258=0,$259=0,$260=0,$261=0,$262=0,$263=0,$264=0,$265=0,$266=0,$267=0,$268=0,$269=0,$270=0;
 var $271=0,$272=0,$274=0,$275=0,$276=0,$277=0,$278=0,$279=0,$281=0,$282=0,$283=0,$284=0,$285=0,$286=0,$287=0,$288=0,$289=0,$290=0,$291=0,$292=0;
 var $293=0,$294=0,$295=0,$301=0,$302=0,$303=0,$304=0,$305=0,$307=0,$308=0,$309=0,$315=0,$316=0,$317=0,$319=0,$320=0,$321=0,$323=0,$326=0,$327=0;
 var $328=0,$331=0,$332=0,$333=0,$334=0,$335=0,$336=0,$337=0,$338=0,$339=0,$344=0,$345=0,$346=0,$347=0,$349=0,$350=0,$351=0,$352=0,$353=0,$354=0;
 var $355=0,$356=0,$357=0,$358=0,$359=0,$361=0,$362=0,$363=0,$366=0,$367=0,$368=0,$369=0,$370=0,$371=0,$372=0,$373=0,$374=0,$375=0,$376=0,$379=0;
 var $380=0,$381=0,$382=0,$383=0,$384=0,$385=0,$386=0,$387=0,$388=0,$389=0,$390=0,$391=0,$392=0,$393=0,$394=0,$396=0,$397=0,$398=0,$399=0,$400=0;
 var $401=0,$403=0,$404=0,$405=0,$406=0,$407=0,$408=0,$409=0,$410=0,$411=0,$412=0,$413=0,$414=0,$415=0,$416=0,$417=0,$422=0,$423=0,$424=0,$425=0;
 var $426=0,$428=0,$429=0,$430=0,$434=0,label=0;
 var sp=0;sp=STACKTOP;










 $2=$region;
 $3=$r1;
 $4=$r1_end;
 $5=$r2;
 $6=$r2_end;
 $7=$y1;
 $8=$y2;
 $9=$3;
 $10=(($9)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $x1=$11;
 $13=$7;
 $14=$8;
 $15=($13|0)<($14|0);
 $16=$15^1;
 $17=($16&1);
 $18=($17);
 $19=($18|0)!=0;
 if ($19) {
  __pixman_log_error(1280,168);
 }
 $24=$3;
 $25=$4;
 $26=($24|0)!=($25|0);
 if ($26) {
  $28=$5;
  $29=$6;
  $30=($28|0)!=($29|0);
  $32=$30;
 } else {
  $32=0;
 }

 $33=$32^1;
 $34=($33&1);
 $35=($34);
 $36=($35|0)!=0;
 if ($36) {
  __pixman_log_error(1280,112);
 }
 $40=$2;
 $41=(($40+16)|0);
 $42=((HEAP32[(($41)>>2)])|0);
 $43=(($42+4)|0);
 $44=((HEAP32[(($43)>>2)])|0);
 $45=$2;
 $46=(($45+16)|0);
 $47=((HEAP32[(($46)>>2)])|0);
 $48=(($47+8)|0);
 $49=$48;
 $50=(($49+($44<<4))|0);
 $next_rect=$50;
 while(1) {
  $52=$5;
  $53=(($52+8)|0);
  $54=((HEAP32[(($53)>>2)])|0);
  $55=$x1;
  $56=($54|0)<=($55|0);
  if ($56) {
   $58=$5;
   $59=(($58+16)|0);
   $5=$59;
  } else {
   $61=$5;
   $62=(($61)|0);
   $63=((HEAP32[(($62)>>2)])|0);
   $64=$x1;
   $65=($63|0)<=($64|0);
   if ($65) {
    $67=$5;
    $68=(($67+8)|0);
    $69=((HEAP32[(($68)>>2)])|0);
    $x1=$69;
    $70=$x1;
    $71=$3;
    $72=(($71+8)|0);
    $73=((HEAP32[(($72)>>2)])|0);
    $74=($70|0)>=($73|0);
    if ($74) {
     $76=$3;
     $77=(($76+16)|0);
     $3=$77;
     $78=$3;
     $79=$4;
     $80=($78|0)!=($79|0);
     if ($80) {
      $82=$3;
      $83=(($82)|0);
      $84=((HEAP32[(($83)>>2)])|0);
      $x1=$84;
     }
    } else {
     $87=$5;
     $88=(($87+16)|0);
     $5=$88;
    }
   } else {
    $91=$5;
    $92=(($91)|0);
    $93=((HEAP32[(($92)>>2)])|0);
    $94=$3;
    $95=(($94+8)|0);
    $96=((HEAP32[(($95)>>2)])|0);
    $97=($93|0)<($96|0);
    if ($97) {
     $100=$x1;
     $101=$5;
     $102=(($101)|0);
     $103=((HEAP32[(($102)>>2)])|0);
     $104=($100|0)<($103|0);
     $105=$104^1;
     $106=($105&1);
     $107=($106);
     $108=($107|0)!=0;
     if ($108) {
      __pixman_log_error(1280,72);
     }
     $113=$2;
     $114=(($113+16)|0);
     $115=((HEAP32[(($114)>>2)])|0);
     $116=($115|0)!=0;
     if ($116) {
      $118=$2;
      $119=(($118+16)|0);
      $120=((HEAP32[(($119)>>2)])|0);
      $121=(($120+4)|0);
      $122=((HEAP32[(($121)>>2)])|0);
      $123=$2;
      $124=(($123+16)|0);
      $125=((HEAP32[(($124)>>2)])|0);
      $126=(($125)|0);
      $127=((HEAP32[(($126)>>2)])|0);
      $128=($122|0)==($127|0);
      if ($128) {
       label = 29;
      }
     } else {
      label = 29;
     }
     if ((label|0) == 29) {
      label = 0;
      $130=$2;
      $131=((_pixman_rect_alloc($130,1))|0);
      $132=($131|0)!=0;
      if (!($132)) {
       label = 30;
       break;
      }
      $135=$2;
      $136=(($135+16)|0);
      $137=((HEAP32[(($136)>>2)])|0);
      $138=(($137+4)|0);
      $139=((HEAP32[(($138)>>2)])|0);
      $140=$2;
      $141=(($140+16)|0);
      $142=((HEAP32[(($141)>>2)])|0);
      $143=(($142+8)|0);
      $144=$143;
      $145=(($144+($139<<4))|0);
      $next_rect=$145;
     }
     $148=$x1;
     $149=$next_rect;
     $150=(($149)|0);
     HEAP32[(($150)>>2)]=$148;
     $151=$7;
     $152=$next_rect;
     $153=(($152+4)|0);
     HEAP32[(($153)>>2)]=$151;
     $154=$5;
     $155=(($154)|0);
     $156=((HEAP32[(($155)>>2)])|0);
     $157=$next_rect;
     $158=(($157+8)|0);
     HEAP32[(($158)>>2)]=$156;
     $159=$8;
     $160=$next_rect;
     $161=(($160+12)|0);
     HEAP32[(($161)>>2)]=$159;
     $162=$next_rect;
     $163=(($162+16)|0);
     $next_rect=$163;
     $165=$2;
     $166=(($165+16)|0);
     $167=((HEAP32[(($166)>>2)])|0);
     $168=(($167+4)|0);
     $169=((HEAP32[(($168)>>2)])|0);
     $170=((($169)+(1))|0);
     HEAP32[(($168)>>2)]=$170;
     $172=$2;
     $173=(($172+16)|0);
     $174=((HEAP32[(($173)>>2)])|0);
     $175=(($174+4)|0);
     $176=((HEAP32[(($175)>>2)])|0);
     $177=$2;
     $178=(($177+16)|0);
     $179=((HEAP32[(($178)>>2)])|0);
     $180=(($179)|0);
     $181=((HEAP32[(($180)>>2)])|0);
     $182=($176|0)<=($181|0);
     $183=$182^1;
     $184=($183&1);
     $185=($184);
     $186=($185|0)!=0;
     if ($186) {
      __pixman_log_error(1280,992);
     }
     $191=$5;
     $192=(($191+8)|0);
     $193=((HEAP32[(($192)>>2)])|0);
     $x1=$193;
     $194=$x1;
     $195=$3;
     $196=(($195+8)|0);
     $197=((HEAP32[(($196)>>2)])|0);
     $198=($194|0)>=($197|0);
     if ($198) {
      $200=$3;
      $201=(($200+16)|0);
      $3=$201;
      $202=$3;
      $203=$4;
      $204=($202|0)!=($203|0);
      if ($204) {
       $206=$3;
       $207=(($206)|0);
       $208=((HEAP32[(($207)>>2)])|0);
       $x1=$208;
      }
     } else {
      $211=$5;
      $212=(($211+16)|0);
      $5=$212;
     }
    } else {
     $215=$3;
     $216=(($215+8)|0);
     $217=((HEAP32[(($216)>>2)])|0);
     $218=$x1;
     $219=($217|0)>($218|0);
     if ($219) {
      $222=$2;
      $223=(($222+16)|0);
      $224=((HEAP32[(($223)>>2)])|0);
      $225=($224|0)!=0;
      if ($225) {
       $227=$2;
       $228=(($227+16)|0);
       $229=((HEAP32[(($228)>>2)])|0);
       $230=(($229+4)|0);
       $231=((HEAP32[(($230)>>2)])|0);
       $232=$2;
       $233=(($232+16)|0);
       $234=((HEAP32[(($233)>>2)])|0);
       $235=(($234)|0);
       $236=((HEAP32[(($235)>>2)])|0);
       $237=($231|0)==($236|0);
       if ($237) {
        label = 49;
       }
      } else {
       label = 49;
      }
      if ((label|0) == 49) {
       label = 0;
       $239=$2;
       $240=((_pixman_rect_alloc($239,1))|0);
       $241=($240|0)!=0;
       if (!($241)) {
        label = 50;
        break;
       }
       $244=$2;
       $245=(($244+16)|0);
       $246=((HEAP32[(($245)>>2)])|0);
       $247=(($246+4)|0);
       $248=((HEAP32[(($247)>>2)])|0);
       $249=$2;
       $250=(($249+16)|0);
       $251=((HEAP32[(($250)>>2)])|0);
       $252=(($251+8)|0);
       $253=$252;
       $254=(($253+($248<<4))|0);
       $next_rect=$254;
      }
      $257=$x1;
      $258=$next_rect;
      $259=(($258)|0);
      HEAP32[(($259)>>2)]=$257;
      $260=$7;
      $261=$next_rect;
      $262=(($261+4)|0);
      HEAP32[(($262)>>2)]=$260;
      $263=$3;
      $264=(($263+8)|0);
      $265=((HEAP32[(($264)>>2)])|0);
      $266=$next_rect;
      $267=(($266+8)|0);
      HEAP32[(($267)>>2)]=$265;
      $268=$8;
      $269=$next_rect;
      $270=(($269+12)|0);
      HEAP32[(($270)>>2)]=$268;
      $271=$next_rect;
      $272=(($271+16)|0);
      $next_rect=$272;
      $274=$2;
      $275=(($274+16)|0);
      $276=((HEAP32[(($275)>>2)])|0);
      $277=(($276+4)|0);
      $278=((HEAP32[(($277)>>2)])|0);
      $279=((($278)+(1))|0);
      HEAP32[(($277)>>2)]=$279;
      $281=$2;
      $282=(($281+16)|0);
      $283=((HEAP32[(($282)>>2)])|0);
      $284=(($283+4)|0);
      $285=((HEAP32[(($284)>>2)])|0);
      $286=$2;
      $287=(($286+16)|0);
      $288=((HEAP32[(($287)>>2)])|0);
      $289=(($288)|0);
      $290=((HEAP32[(($289)>>2)])|0);
      $291=($285|0)<=($290|0);
      $292=$291^1;
      $293=($292&1);
      $294=($293);
      $295=($294|0)!=0;
      if ($295) {
       __pixman_log_error(1280,992);
      }
     }
     $301=$3;
     $302=(($301+16)|0);
     $3=$302;
     $303=$3;
     $304=$4;
     $305=($303|0)!=($304|0);
     if ($305) {
      $307=$3;
      $308=(($307)|0);
      $309=((HEAP32[(($308)>>2)])|0);
      $x1=$309;
     }
    }
   }
  }
  $315=$3;
  $316=$4;
  $317=($315|0)!=($316|0);
  if ($317) {
   $319=$5;
   $320=$6;
   $321=($319|0)!=($320|0);
   $323=$321;
  } else {
   $323=0;
  }

  if (!($323)) {
   label = 69;
   break;
  }
 }
 if ((label|0) == 30) {
  $1=0;
  $434=$1;
  STACKTOP=sp;return (($434)|0);
 }
 else if ((label|0) == 50) {
  $1=0;
  $434=$1;
  STACKTOP=sp;return (($434)|0);
 }
 else if ((label|0) == 69) {
  while(1) {
   $326=$3;
   $327=$4;
   $328=($326|0)!=($327|0);
   if (!($328)) {
    label = 91;
    break;
   }
   $331=$x1;
   $332=$3;
   $333=(($332+8)|0);
   $334=((HEAP32[(($333)>>2)])|0);
   $335=($331|0)<($334|0);
   $336=$335^1;
   $337=($336&1);
   $338=($337);
   $339=($338|0)!=0;
   if ($339) {
    __pixman_log_error(1280,952);
   }
   $344=$2;
   $345=(($344+16)|0);
   $346=((HEAP32[(($345)>>2)])|0);
   $347=($346|0)!=0;
   if ($347) {
    $349=$2;
    $350=(($349+16)|0);
    $351=((HEAP32[(($350)>>2)])|0);
    $352=(($351+4)|0);
    $353=((HEAP32[(($352)>>2)])|0);
    $354=$2;
    $355=(($354+16)|0);
    $356=((HEAP32[(($355)>>2)])|0);
    $357=(($356)|0);
    $358=((HEAP32[(($357)>>2)])|0);
    $359=($353|0)==($358|0);
    if ($359) {
     label = 78;
    }
   } else {
    label = 78;
   }
   if ((label|0) == 78) {
    label = 0;
    $361=$2;
    $362=((_pixman_rect_alloc($361,1))|0);
    $363=($362|0)!=0;
    if (!($363)) {
     label = 79;
     break;
    }
    $366=$2;
    $367=(($366+16)|0);
    $368=((HEAP32[(($367)>>2)])|0);
    $369=(($368+4)|0);
    $370=((HEAP32[(($369)>>2)])|0);
    $371=$2;
    $372=(($371+16)|0);
    $373=((HEAP32[(($372)>>2)])|0);
    $374=(($373+8)|0);
    $375=$374;
    $376=(($375+($370<<4))|0);
    $next_rect=$376;
   }
   $379=$x1;
   $380=$next_rect;
   $381=(($380)|0);
   HEAP32[(($381)>>2)]=$379;
   $382=$7;
   $383=$next_rect;
   $384=(($383+4)|0);
   HEAP32[(($384)>>2)]=$382;
   $385=$3;
   $386=(($385+8)|0);
   $387=((HEAP32[(($386)>>2)])|0);
   $388=$next_rect;
   $389=(($388+8)|0);
   HEAP32[(($389)>>2)]=$387;
   $390=$8;
   $391=$next_rect;
   $392=(($391+12)|0);
   HEAP32[(($392)>>2)]=$390;
   $393=$next_rect;
   $394=(($393+16)|0);
   $next_rect=$394;
   $396=$2;
   $397=(($396+16)|0);
   $398=((HEAP32[(($397)>>2)])|0);
   $399=(($398+4)|0);
   $400=((HEAP32[(($399)>>2)])|0);
   $401=((($400)+(1))|0);
   HEAP32[(($399)>>2)]=$401;
   $403=$2;
   $404=(($403+16)|0);
   $405=((HEAP32[(($404)>>2)])|0);
   $406=(($405+4)|0);
   $407=((HEAP32[(($406)>>2)])|0);
   $408=$2;
   $409=(($408+16)|0);
   $410=((HEAP32[(($409)>>2)])|0);
   $411=(($410)|0);
   $412=((HEAP32[(($411)>>2)])|0);
   $413=($407|0)<=($412|0);
   $414=$413^1;
   $415=($414&1);
   $416=($415);
   $417=($416|0)!=0;
   if ($417) {
    __pixman_log_error(1280,992);
   }
   $422=$3;
   $423=(($422+16)|0);
   $3=$423;
   $424=$3;
   $425=$4;
   $426=($424|0)!=($425|0);
   if ($426) {
    $428=$3;
    $429=(($428)|0);
    $430=((HEAP32[(($429)>>2)])|0);
    $x1=$430;
   }
  }
  if ((label|0) == 79) {
   $1=0;
   $434=$1;
   STACKTOP=sp;return (($434)|0);
  }
  else if ((label|0) == 91) {
   $1=1;
   $434=$1;
   STACKTOP=sp;return (($434)|0);
  }
 }
  return 0;
}


function _pixman_region32_inverse($new_reg,$reg1,$inv_rect){
 $new_reg=($new_reg)|0;
 $reg1=($reg1)|0;
 $inv_rect=($inv_rect)|0;
 var $1=0,$2=0,$3=0,$4=0,$inv_reg=0,$5=0,$6=0,$7=0,$8=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$21=0;
 var $22=0,$23=0,$24=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$44=0;
 var $45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$53=0,$54=0,$55=0,$56=0,$57=0,$59=0,$60=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0;
 var $68=0,$69=0,$70=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$79=0,$80=0,$81=0,$82=0,$84=0,$85=0,$87=0,$88=0,$89=0,$90=0,$91=0;
 var $92=0,$93=0,$94=0,$95=0,$98=0,$100=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+24)|0;




 $inv_reg=((sp)|0);
 $2=$new_reg;
 $3=$reg1;
 $4=$inv_rect;
 $5=$3;
 $6=(($5+16)|0);
 $7=((HEAP32[(($6)>>2)])|0);
 $8=($7|0)!=0;
 if ($8) {
  $10=$3;
  $11=(($10+16)|0);
  $12=((HEAP32[(($11)>>2)])|0);
  $13=(($12+4)|0);
  $14=((HEAP32[(($13)>>2)])|0);
  $15=($14|0)!=0;
  if ($15) {
   label = 3;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $17=$4;
  $18=(($17+8)|0);
  $19=((HEAP32[(($18)>>2)])|0);
  $20=$3;
  $21=(($20)|0);
  $22=(($21)|0);
  $23=((HEAP32[(($22)>>2)])|0);
  $24=($19|0)<=($23|0);
  if (!($24)) {
   $26=$4;
   $27=(($26)|0);
   $28=((HEAP32[(($27)>>2)])|0);
   $29=$3;
   $30=(($29)|0);
   $31=(($30+8)|0);
   $32=((HEAP32[(($31)>>2)])|0);
   $33=($28|0)>=($32|0);
   if (!($33)) {
    $35=$4;
    $36=(($35+12)|0);
    $37=((HEAP32[(($36)>>2)])|0);
    $38=$3;
    $39=(($38)|0);
    $40=(($39+4)|0);
    $41=((HEAP32[(($40)>>2)])|0);
    $42=($37|0)<=($41|0);
    if (!($42)) {
     $44=$4;
     $45=(($44+4)|0);
     $46=((HEAP32[(($45)>>2)])|0);
     $47=$3;
     $48=(($47)|0);
     $49=(($48+12)|0);
     $50=((HEAP32[(($49)>>2)])|0);
     $51=($46|0)>=($50|0);
     if (!($51)) {
      $87=(($inv_reg)|0);
      $88=$4;
      $89=$87;
      $90=$88;
      HEAP32[(($89)>>2)]=((HEAP32[(($90)>>2)])|0);HEAP32[((($89)+(4))>>2)]=((HEAP32[((($90)+(4))>>2)])|0);HEAP32[((($89)+(8))>>2)]=((HEAP32[((($90)+(8))>>2)])|0);HEAP32[((($89)+(12))>>2)]=((HEAP32[((($90)+(12))>>2)])|0);
      $91=(($inv_reg+16)|0);
      HEAP32[(($91)>>2)]=0;
      $92=$2;
      $93=$3;
      $94=((_pixman_op($92,$inv_reg,$93,4,1,0))|0);
      $95=($94|0)!=0;
      if ($95) {
       $98=$2;
       _pixman_set_extents($98);
       $1=1;
       $100=$1;
       STACKTOP=sp;return (($100)|0);
      } else {
       $1=0;
       $100=$1;
       STACKTOP=sp;return (($100)|0);
      }
     }
    }
   }
  }
 }
 $53=$3;
 $54=(($53+16)|0);
 $55=((HEAP32[(($54)>>2)])|0);
 $56=((HEAP32[((24)>>2)])|0);
 $57=($55|0)==($56|0);
 if ($57) {
  $59=$2;
  $60=((_pixman_break($59))|0);
  $1=$60;
  $100=$1;
  STACKTOP=sp;return (($100)|0);
 }
 $62=$2;
 $63=(($62)|0);
 $64=$4;
 $65=$63;
 $66=$64;
 HEAP32[(($65)>>2)]=((HEAP32[(($66)>>2)])|0);HEAP32[((($65)+(4))>>2)]=((HEAP32[((($66)+(4))>>2)])|0);HEAP32[((($65)+(8))>>2)]=((HEAP32[((($66)+(8))>>2)])|0);HEAP32[((($65)+(12))>>2)]=((HEAP32[((($66)+(12))>>2)])|0);
 $67=$2;
 $68=(($67+16)|0);
 $69=((HEAP32[(($68)>>2)])|0);
 $70=($69|0)!=0;
 if ($70) {
  $72=$2;
  $73=(($72+16)|0);
  $74=((HEAP32[(($73)>>2)])|0);
  $75=(($74)|0);
  $76=((HEAP32[(($75)>>2)])|0);
  $77=($76|0)!=0;
  if ($77) {
   $79=$2;
   $80=(($79+16)|0);
   $81=((HEAP32[(($80)>>2)])|0);
   $82=$81;
   _free($82);
  }
 }
 $84=$2;
 $85=(($84+16)|0);
 HEAP32[(($85)>>2)]=0;
 $1=1;
 $100=$1;
 STACKTOP=sp;return (($100)|0);
}


function _pixman_region32_contains_rectangle($region,$prect){
 $region=($region)|0;
 $prect=($prect)|0;
 var $1=0,$2=0,$3=0,$pbox=0,$pbox_end=0,$part_in=0,$part_out=0,$numRects=0,$x=0,$y=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$12=0,$13=0,$16=0;
 var $17=0,$18=0,$20=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$38=0,$39=0;
 var $40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$47=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$54=0,$57=0,$58=0,$60=0,$61=0,$62=0,$63=0;
 var $64=0,$65=0,$66=0,$67=0,$69=0,$70=0,$71=0,$72=0,$73=0,$74=0,$75=0,$76=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$85=0;
 var $87=0,$88=0,$89=0,$90=0,$91=0,$92=0,$93=0,$94=0,$98=0,$99=0,$100=0,$101=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$109=0;
 var $110=0,$111=0,$113=0,$114=0,$115=0,$117=0,$118=0,$119=0,$120=0,$121=0,$123=0,$124=0,$125=0,$126=0,$127=0,$128=0,$132=0,$133=0,$134=0,$135=0;
 var $136=0,$138=0,$139=0,$141=0,$142=0,$143=0,$144=0,$145=0,$146=0,$147=0,$150=0,$151=0,$152=0,$154=0,$155=0,$156=0,$157=0,$158=0,$161=0,$162=0;
 var $163=0,$164=0,$165=0,$167=0,$168=0,$172=0,$173=0,$174=0,$175=0,$176=0,$177=0,$178=0,$180=0,$181=0,$185=0,$186=0,$187=0,$188=0,$189=0,$190=0;
 var $191=0,$193=0,$194=0,$195=0,$196=0,$197=0,$198=0,$199=0,$200=0,$203=0,$204=0,$205=0,$209=0,$210=0,$212=0,$213=0,$215=0,$216=0,$217=0,$218=0;
 var $219=0,$224=0,label=0;
 var sp=0;sp=STACKTOP;










 $2=$region;
 $3=$prect;
 $4=$2;
 $5=(($4+16)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=($6|0)!=0;
 if ($7) {
  $9=$2;
  $10=(($9+16)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $12=(($11+4)|0);
  $13=((HEAP32[(($12)>>2)])|0);
  $16=$13;
 } else {
  $16=1;
 }

 $numRects=$16;
 $17=$numRects;
 $18=($17|0)!=0;
 if ($18) {
  $20=$2;
  $21=(($20)|0);
  $22=(($21+8)|0);
  $23=((HEAP32[(($22)>>2)])|0);
  $24=$3;
  $25=(($24)|0);
  $26=((HEAP32[(($25)>>2)])|0);
  $27=($23|0)<=($26|0);
  if (!($27)) {
   $29=$2;
   $30=(($29)|0);
   $31=(($30)|0);
   $32=((HEAP32[(($31)>>2)])|0);
   $33=$3;
   $34=(($33+8)|0);
   $35=((HEAP32[(($34)>>2)])|0);
   $36=($32|0)>=($35|0);
   if (!($36)) {
    $38=$2;
    $39=(($38)|0);
    $40=(($39+12)|0);
    $41=((HEAP32[(($40)>>2)])|0);
    $42=$3;
    $43=(($42+4)|0);
    $44=((HEAP32[(($43)>>2)])|0);
    $45=($41|0)<=($44|0);
    if (!($45)) {
     $47=$2;
     $48=(($47)|0);
     $49=(($48+4)|0);
     $50=((HEAP32[(($49)>>2)])|0);
     $51=$3;
     $52=(($51+12)|0);
     $53=((HEAP32[(($52)>>2)])|0);
     $54=($50|0)>=($53|0);
     if (!($54)) {
      $57=$numRects;
      $58=($57|0)==1;
      if ($58) {
       $60=$2;
       $61=(($60)|0);
       $62=(($61)|0);
       $63=((HEAP32[(($62)>>2)])|0);
       $64=$3;
       $65=(($64)|0);
       $66=((HEAP32[(($65)>>2)])|0);
       $67=($63|0)<=($66|0);
       if ($67) {
        $69=$2;
        $70=(($69)|0);
        $71=(($70+8)|0);
        $72=((HEAP32[(($71)>>2)])|0);
        $73=$3;
        $74=(($73+8)|0);
        $75=((HEAP32[(($74)>>2)])|0);
        $76=($72|0)>=($75|0);
        if ($76) {
         $78=$2;
         $79=(($78)|0);
         $80=(($79+4)|0);
         $81=((HEAP32[(($80)>>2)])|0);
         $82=$3;
         $83=(($82+4)|0);
         $84=((HEAP32[(($83)>>2)])|0);
         $85=($81|0)<=($84|0);
         if ($85) {
          $87=$2;
          $88=(($87)|0);
          $89=(($88+12)|0);
          $90=((HEAP32[(($89)>>2)])|0);
          $91=$3;
          $92=(($91+12)|0);
          $93=((HEAP32[(($92)>>2)])|0);
          $94=($90|0)>=($93|0);
          if ($94) {
           $1=1;
           $224=$1;
           STACKTOP=sp;return (($224)|0);
          }
         }
        }
       }
       $1=2;
       $224=$1;
       STACKTOP=sp;return (($224)|0);
      }
      $part_out=0;
      $part_in=0;
      $98=$3;
      $99=(($98)|0);
      $100=((HEAP32[(($99)>>2)])|0);
      $x=$100;
      $101=$3;
      $102=(($101+4)|0);
      $103=((HEAP32[(($102)>>2)])|0);
      $y=$103;
      $104=$2;
      $105=(($104+16)|0);
      $106=((HEAP32[(($105)>>2)])|0);
      $107=(($106+8)|0);
      $108=$107;
      $pbox=$108;
      $109=$pbox;
      $110=$numRects;
      $111=(($109+($110<<4))|0);
      $pbox_end=$111;
      while(1) {
       $113=$pbox;
       $114=$pbox_end;
       $115=($113|0)!=($114|0);
       if (!($115)) {
        break;
       }
       $117=$pbox;
       $118=(($117+12)|0);
       $119=((HEAP32[(($118)>>2)])|0);
       $120=$y;
       $121=($119|0)<=($120|0);
       if ($121) {
        $123=$pbox;
        $124=$pbox_end;
        $125=$y;
        $126=((_find_box_for_y($123,$124,$125))|0);
        $pbox=$126;
        $127=$pbox_end;
        $128=($126|0)==($127|0);
        if ($128) {
         label = 21;
         break;
        }
       }
       $132=$pbox;
       $133=(($132+4)|0);
       $134=((HEAP32[(($133)>>2)])|0);
       $135=$y;
       $136=($134|0)>($135|0);
       if ($136) {
        $part_out=1;
        $138=$part_in;
        $139=($138|0)!=0;
        if ($139) {
         label = 26;
         break;
        }
        $141=$pbox;
        $142=(($141+4)|0);
        $143=((HEAP32[(($142)>>2)])|0);
        $144=$3;
        $145=(($144+12)|0);
        $146=((HEAP32[(($145)>>2)])|0);
        $147=($143|0)>=($146|0);
        if ($147) {
         label = 26;
         break;
        }
        $150=$pbox;
        $151=(($150+4)|0);
        $152=((HEAP32[(($151)>>2)])|0);
        $y=$152;
       }
       $154=$pbox;
       $155=(($154+8)|0);
       $156=((HEAP32[(($155)>>2)])|0);
       $157=$x;
       $158=($156|0)<=($157|0);
       if ($158) {
       } else {
        $161=$pbox;
        $162=(($161)|0);
        $163=((HEAP32[(($162)>>2)])|0);
        $164=$x;
        $165=($163|0)>($164|0);
        if ($165) {
         $part_out=1;
         $167=$part_in;
         $168=($167|0)!=0;
         if ($168) {
          label = 32;
          break;
         }
        }
        $172=$pbox;
        $173=(($172)|0);
        $174=((HEAP32[(($173)>>2)])|0);
        $175=$3;
        $176=(($175+8)|0);
        $177=((HEAP32[(($176)>>2)])|0);
        $178=($174|0)<($177|0);
        if ($178) {
         $part_in=1;
         $180=$part_out;
         $181=($180|0)!=0;
         if ($181) {
          label = 36;
          break;
         }
        }
        $185=$pbox;
        $186=(($185+8)|0);
        $187=((HEAP32[(($186)>>2)])|0);
        $188=$3;
        $189=(($188+8)|0);
        $190=((HEAP32[(($189)>>2)])|0);
        $191=($187|0)>=($190|0);
        if (!($191)) {
         label = 42;
         break;
        }
        $193=$pbox;
        $194=(($193+12)|0);
        $195=((HEAP32[(($194)>>2)])|0);
        $y=$195;
        $196=$y;
        $197=$3;
        $198=(($197+12)|0);
        $199=((HEAP32[(($198)>>2)])|0);
        $200=($196|0)>=($199|0);
        if ($200) {
         label = 40;
         break;
        }
        $203=$3;
        $204=(($203)|0);
        $205=((HEAP32[(($204)>>2)])|0);
        $x=$205;
       }
       $209=$pbox;
       $210=(($209+16)|0);
       $pbox=$210;
      }
      if ((label|0) == 21) {
      }
      else if ((label|0) == 26) {
      }
      else if ((label|0) == 32) {
      }
      else if ((label|0) == 36) {
      }
      else if ((label|0) == 40) {
      }
      else if ((label|0) == 42) {
       $part_out=1;
      }
      $212=$part_in;
      $213=($212|0)!=0;
      if (!($213)) {
       $1=0;
       $224=$1;
       STACKTOP=sp;return (($224)|0);
      }
      $215=$y;
      $216=$3;
      $217=(($216+12)|0);
      $218=((HEAP32[(($217)>>2)])|0);
      $219=($215|0)<($218|0);
      if ($219) {
       $1=2;
       $224=$1;
       STACKTOP=sp;return (($224)|0);
      } else {
       $1=1;
       $224=$1;
       STACKTOP=sp;return (($224)|0);
      }
     }
    }
   }
  }
 }
 $1=0;
 $224=$1;
 STACKTOP=sp;return (($224)|0);
}


function _find_box_for_y($begin,$end,$y){
 $begin=($begin)|0;
 $end=($end)|0;
 $y=($y)|0;
 var $1=0,$2=0,$3=0,$4=0,$mid=0,$5=0,$6=0,$7=0,$9=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$19=0,$20=0,$21=0,$22=0;
 var $23=0,$25=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$44=0,$45=0,$46=0;
 var $47=0,$49=0,$50=0,$51=0,$52=0,$54=0,label=0;
 var sp=0;sp=STACKTOP;





 $2=$begin;
 $3=$end;
 $4=$y;
 $5=$3;
 $6=$2;
 $7=($5|0)==($6|0);
 do {
  if ($7) {
   $9=$3;
   $1=$9;
  } else {
   $11=$3;
   $12=$2;
   $13=$11;
   $14=$12;
   $15=((($13)-($14))|0);
   $16=(((($15|0))/(16))&-1);
   $17=($16|0)==1;
   if ($17) {
    $19=$2;
    $20=(($19+12)|0);
    $21=((HEAP32[(($20)>>2)])|0);
    $22=$4;
    $23=($21|0)>($22|0);
    if ($23) {
     $25=$2;
     $1=$25;
     break;
    } else {
     $27=$3;
     $1=$27;
     break;
    }
   } else {
    $29=$2;
    $30=$3;
    $31=$2;
    $32=$30;
    $33=$31;
    $34=((($32)-($33))|0);
    $35=(((($34|0))/(16))&-1);
    $36=(((($35|0))/(2))&-1);
    $37=(($29+($36<<4))|0);
    $mid=$37;
    $38=$mid;
    $39=(($38+12)|0);
    $40=((HEAP32[(($39)>>2)])|0);
    $41=$4;
    $42=($40|0)>($41|0);
    if ($42) {
     $44=$2;
     $45=$mid;
     $46=$4;
     $47=((_find_box_for_y($44,$45,$46))|0);
     $1=$47;
     break;
    } else {
     $49=$mid;
     $50=$3;
     $51=$4;
     $52=((_find_box_for_y($49,$50,$51))|0);
     $1=$52;
     break;
    }
   }
  }
 } while(0);
 $54=$1;
 STACKTOP=sp;return (($54)|0);
}


function _pixman_region32_translate($region,$x,$y){
 $region=($region)|0;
 $x=($x)|0;
 $y=($y)|0;
 var $1=0,$2=0,$3=0,$x1=0,$x2=0,$y1=0,$y2=0,$nbox=0,$pbox=0,$pbox_out=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10$0=0,$10$1=0,$st$0$0=0,$st$1$1=0;
 var $11$0=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0,$21$0=0,$21$1=0,$st$2$0=0,$st$3$1=0,$22$0=0,$22=0,$23=0,$24=0,$25=0;
 var $26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32$0=0,$32$1=0,$st$4$0=0,$st$5$1=0,$33$0=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0;
 var $42=0,$43$0=0,$43$1=0,$st$6$0=0,$st$7$1=0,$44$0=0,$44=0,$45=0,$46=0,$47=0,$ld$8$0=0,$48$0=0,$ld$9$1=0,$48$1=0,$$etemp$10$0=0,$$etemp$10$1=0,$ld$11$0=0,$50$0=0,$ld$12$1=0,$50$1=0;
 var $$etemp$13$0=0,$$etemp$13$1=0,$52$0=0,$52$1=0,$ld$14$0=0,$53$0=0,$ld$15$1=0,$53$1=0,$$etemp$16$0=0,$$etemp$16$1=0,$55$0=0,$55$1=0,$ld$17$0=0,$56$0=0,$ld$18$1=0,$56$1=0,$$etemp$19$0=0,$$etemp$19$1=0,$58$0=0,$58$1=0;
 var $$etemp$20$0=0,$$etemp$20$1=0,$59=0,$61=0,$62=0,$63=0,$64=0,$66=0,$67=0,$68=0,$69=0,$70=0,$71=0,$73=0,$74=0,$75=0,$76=0,$77=0,$79=0,$80=0;
 var $81=0,$83=0,$84=0,$85=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0,$92=0,$93=0,$94=0,$95=0,$96=0,$97=0,$98=0,$99=0,$100=0,$101=0;
 var $102=0,$104=0,$105=0,$ld$21$0=0,$109$0=0,$ld$22$1=0,$109$1=0,$$etemp$23$0=0,$$etemp$23$1=0,$ld$24$0=0,$111$0=0,$ld$25$1=0,$111$1=0,$$etemp$26$0=0,$$etemp$26$1=0,$113$0=0,$113$1=0,$ld$27$0=0,$114$0=0,$ld$28$1=0;
 var $114$1=0,$$etemp$29$0=0,$$etemp$29$1=0,$116$0=0,$116$1=0,$ld$30$0=0,$117$0=0,$ld$31$1=0,$117$1=0,$$etemp$32$0=0,$$etemp$32$1=0,$119$0=0,$119$1=0,$$etemp$33$0=0,$$etemp$33$1=0,$120=0,$122=0,$123=0,$124=0,$125=0;
 var $126=0,$127=0,$128=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$135=0,$136=0,$137=0,$138=0,$139=0,$141=0,$142=0,$143=0,$144=0,$145=0,$146=0;
 var $148=0,$149=0,$150=0,$151=0,$153=0,$154=0,$155=0,$ld$34$0=0,$157$0=0,$ld$35$1=0,$157$1=0,$$etemp$36$0=0,$$etemp$36$1=0,$158=0,$160=0,$161=0,$162=0,$ld$37$0=0,$164$0=0,$ld$38$1=0;
 var $164$1=0,$$etemp$39$0=0,$$etemp$39$1=0,$165=0,$167=0,$168=0,$169=0,$ld$40$0=0,$172$0=0,$ld$41$1=0,$172$1=0,$$etemp$42$0=0,$$etemp$42$1=0,$173=0,$175=0,$176=0,$177=0,$ld$43$0=0,$179$0=0,$ld$44$1=0;
 var $179$1=0,$$etemp$45$0=0,$$etemp$45$1=0,$180=0,$182=0,$183=0,$184=0,$187=0,$188=0,$189=0,$190=0,$192=0,$193=0,$194=0,$195=0,$196=0,$197=0,$199=0,$200=0,$201=0;
 var $202=0,$203=0,$205=0,$206=0,$207=0,$209=0,$210=0,$211=0,$212=0,$213=0,$214$0=0,$214$1=0,$st$46$0=0,$st$47$1=0,$215$0=0,$215=0,$216=0,$217=0,$218=0,$219=0;
 var $220=0,$221=0,$222=0,$223$0=0,$223$1=0,$st$48$0=0,$st$49$1=0,$224$0=0,$224=0,$225=0,$226=0,$227=0,$228=0,$229=0,$230=0,$231=0,$232$0=0,$232$1=0,$st$50$0=0,$st$51$1=0;
 var $233$0=0,$233=0,$234=0,$235=0,$236=0,$237=0,$238=0,$239=0,$240=0,$241$0=0,$241$1=0,$st$52$0=0,$st$53$1=0,$242$0=0,$242=0,$243=0,$244=0,$ld$54$0=0,$245$0=0,$ld$55$1=0;
 var $245$1=0,$$etemp$56$0=0,$$etemp$56$1=0,$ld$57$0=0,$247$0=0,$ld$58$1=0,$247$1=0,$$etemp$59$0=0,$$etemp$59$1=0,$249$0=0,$249$1=0,$ld$60$0=0,$250$0=0,$ld$61$1=0,$250$1=0,$$etemp$62$0=0,$$etemp$62$1=0,$252$0=0,$252$1=0,$ld$63$0=0;
 var $253$0=0,$ld$64$1=0,$253$1=0,$$etemp$65$0=0,$$etemp$65$1=0,$255$0=0,$255$1=0,$$etemp$66$0=0,$$etemp$66$1=0,$256=0,$258=0,$259=0,$260=0,$261=0,$262=0,$263=0,$ld$67$0=0,$265$0=0,$ld$68$1=0,$265$1=0;
 var $$etemp$69$0=0,$$etemp$69$1=0,$266=0,$268=0,$269=0,$ld$70$0=0,$271$0=0,$ld$71$1=0,$271$1=0,$$etemp$72$0=0,$$etemp$72$1=0,$272=0,$274=0,$275=0,$ld$73$0=0,$278$0=0,$ld$74$1=0,$278$1=0,$$etemp$75$0=0,$$etemp$75$1=0;
 var $279=0,$281=0,$282=0,$ld$76$0=0,$284$0=0,$ld$77$1=0,$284$1=0,$$etemp$78$0=0,$$etemp$78$1=0,$285=0,$287=0,$288=0,$291=0,$292=0,$294=0,$295=0,$297=0,$298=0,$299=0,$301=0;
 var $302=0,$303=0,$304=0,$305=0,$306=0,$308=0,$309=0,$310=0,$311=0,$312=0,$313=0,$314=0,$315=0,$316=0,$317=0,$318=0,$319=0,$320=0,$322=0,$323=0;
 var $324=0,$325=0,$326=0,$327=0,$329=0,$330=0,$331=0,$332=0,$334=0,$335=0,$337=0,$49$0=0,$49$1=0,$51$0=0,$51$1=0,$54$0=0,$54$1=0,$57$0=0,$57$1=0,$110$0=0;
 var $110$1=0,$112$0=0,$112$1=0,$115$0=0,$115$1=0,$118$0=0,$118$1=0,$246$0=0,$246$1=0,$248$0=0,$248$1=0,$251$0=0,$251$1=0,$254$0=0,$254$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+32)|0;



 $x1=((sp)|0);
 $x2=(((sp)+(8))|0);
 $y1=(((sp)+(16))|0);
 $y2=(((sp)+(24))|0);



 $1=$region;
 $2=$x;
 $3=$y;
 $4=$1;
 $5=(($4)|0);
 $6=(($5)|0);
 $7=((HEAP32[(($6)>>2)])|0);
 $8=$2;
 $9=((($7)+($8))|0);
 $10$0=$9;
 $10$1=((((($9|0)<0))|0)?-1:0);
 $st$0$0=(($x1)|0);
 HEAP32[(($st$0$0)>>2)]=$10$0;
 $st$1$1=(($x1+4)|0);
 HEAP32[(($st$1$1)>>2)]=$10$1;
 $11$0=$10$0;
 $11=$11$0;
 $12=$1;
 $13=(($12)|0);
 $14=(($13)|0);
 HEAP32[(($14)>>2)]=$11;
 $15=$1;
 $16=(($15)|0);
 $17=(($16+4)|0);
 $18=((HEAP32[(($17)>>2)])|0);
 $19=$3;
 $20=((($18)+($19))|0);
 $21$0=$20;
 $21$1=((((($20|0)<0))|0)?-1:0);
 $st$2$0=(($y1)|0);
 HEAP32[(($st$2$0)>>2)]=$21$0;
 $st$3$1=(($y1+4)|0);
 HEAP32[(($st$3$1)>>2)]=$21$1;
 $22$0=$21$0;
 $22=$22$0;
 $23=$1;
 $24=(($23)|0);
 $25=(($24+4)|0);
 HEAP32[(($25)>>2)]=$22;
 $26=$1;
 $27=(($26)|0);
 $28=(($27+8)|0);
 $29=((HEAP32[(($28)>>2)])|0);
 $30=$2;
 $31=((($29)+($30))|0);
 $32$0=$31;
 $32$1=((((($31|0)<0))|0)?-1:0);
 $st$4$0=(($x2)|0);
 HEAP32[(($st$4$0)>>2)]=$32$0;
 $st$5$1=(($x2+4)|0);
 HEAP32[(($st$5$1)>>2)]=$32$1;
 $33$0=$32$0;
 $33=$33$0;
 $34=$1;
 $35=(($34)|0);
 $36=(($35+8)|0);
 HEAP32[(($36)>>2)]=$33;
 $37=$1;
 $38=(($37)|0);
 $39=(($38+12)|0);
 $40=((HEAP32[(($39)>>2)])|0);
 $41=$3;
 $42=((($40)+($41))|0);
 $43$0=$42;
 $43$1=((((($42|0)<0))|0)?-1:0);
 $st$6$0=(($y2)|0);
 HEAP32[(($st$6$0)>>2)]=$43$0;
 $st$7$1=(($y2+4)|0);
 HEAP32[(($st$7$1)>>2)]=$43$1;
 $44$0=$43$0;
 $44=$44$0;
 $45=$1;
 $46=(($45)|0);
 $47=(($46+12)|0);
 HEAP32[(($47)>>2)]=$44;
 $ld$8$0=(($x1)|0);
 $48$0=((HEAP32[(($ld$8$0)>>2)])|0);
 $ld$9$1=(($x1+4)|0);
 $48$1=((HEAP32[(($ld$9$1)>>2)])|0);
 $$etemp$10$0=-2147483648;
 $$etemp$10$1=-1;
 $49$0=((_i64Subtract($48$0,$48$1,$$etemp$10$0,$$etemp$10$1))|0);$49$1=tempRet0;
 $ld$11$0=(($y1)|0);
 $50$0=((HEAP32[(($ld$11$0)>>2)])|0);
 $ld$12$1=(($y1+4)|0);
 $50$1=((HEAP32[(($ld$12$1)>>2)])|0);
 $$etemp$13$0=-2147483648;
 $$etemp$13$1=-1;
 $51$0=((_i64Subtract($50$0,$50$1,$$etemp$13$0,$$etemp$13$1))|0);$51$1=tempRet0;
 $52$0=$49$0|$51$0;
 $52$1=$49$1|$51$1;
 $ld$14$0=(($x2)|0);
 $53$0=((HEAP32[(($ld$14$0)>>2)])|0);
 $ld$15$1=(($x2+4)|0);
 $53$1=((HEAP32[(($ld$15$1)>>2)])|0);
 $$etemp$16$0=2147483647;
 $$etemp$16$1=0;
 $54$0=((_i64Subtract($$etemp$16$0,$$etemp$16$1,$53$0,$53$1))|0);$54$1=tempRet0;
 $55$0=$52$0|$54$0;
 $55$1=$52$1|$54$1;
 $ld$17$0=(($y2)|0);
 $56$0=((HEAP32[(($ld$17$0)>>2)])|0);
 $ld$18$1=(($y2+4)|0);
 $56$1=((HEAP32[(($ld$18$1)>>2)])|0);
 $$etemp$19$0=2147483647;
 $$etemp$19$1=0;
 $57$0=((_i64Subtract($$etemp$19$0,$$etemp$19$1,$56$0,$56$1))|0);$57$1=tempRet0;
 $58$0=$55$0|$57$0;
 $58$1=$55$1|$57$1;
 $$etemp$20$0=0;
 $$etemp$20$1=0;
 $59=(($58$1|0) >= ($$etemp$20$1|0)) & (((($58$1|0) >  ($$etemp$20$1|0)) | ($58$0>>>0) >= ($$etemp$20$0>>>0)));
 if ($59) {
  $61=$1;
  $62=(($61+16)|0);
  $63=((HEAP32[(($62)>>2)])|0);
  $64=($63|0)!=0;
  if ($64) {
   $66=$1;
   $67=(($66+16)|0);
   $68=((HEAP32[(($67)>>2)])|0);
   $69=(($68+4)|0);
   $70=((HEAP32[(($69)>>2)])|0);
   $nbox=$70;
   $71=($70|0)!=0;
   if ($71) {
    $73=$1;
    $74=(($73+16)|0);
    $75=((HEAP32[(($74)>>2)])|0);
    $76=(($75+8)|0);
    $77=$76;
    $pbox=$77;
    while(1) {
     $79=$nbox;
     $80=((($79)-(1))|0);
     $nbox=$80;
     $81=($79|0)!=0;
     if (!($81)) {
      break;
     }
     $83=$2;
     $84=$pbox;
     $85=(($84)|0);
     $86=((HEAP32[(($85)>>2)])|0);
     $87=((($86)+($83))|0);
     HEAP32[(($85)>>2)]=$87;
     $88=$3;
     $89=$pbox;
     $90=(($89+4)|0);
     $91=((HEAP32[(($90)>>2)])|0);
     $92=((($91)+($88))|0);
     HEAP32[(($90)>>2)]=$92;
     $93=$2;
     $94=$pbox;
     $95=(($94+8)|0);
     $96=((HEAP32[(($95)>>2)])|0);
     $97=((($96)+($93))|0);
     HEAP32[(($95)>>2)]=$97;
     $98=$3;
     $99=$pbox;
     $100=(($99+12)|0);
     $101=((HEAP32[(($100)>>2)])|0);
     $102=((($101)+($98))|0);
     HEAP32[(($100)>>2)]=$102;
     $104=$pbox;
     $105=(($104+16)|0);
     $pbox=$105;
    }
   }
  }
  STACKTOP=sp;return;
 }
 $ld$21$0=(($x2)|0);
 $109$0=((HEAP32[(($ld$21$0)>>2)])|0);
 $ld$22$1=(($x2+4)|0);
 $109$1=((HEAP32[(($ld$22$1)>>2)])|0);
 $$etemp$23$0=-2147483648;
 $$etemp$23$1=-1;
 $110$0=((_i64Subtract($109$0,$109$1,$$etemp$23$0,$$etemp$23$1))|0);$110$1=tempRet0;
 $ld$24$0=(($y2)|0);
 $111$0=((HEAP32[(($ld$24$0)>>2)])|0);
 $ld$25$1=(($y2+4)|0);
 $111$1=((HEAP32[(($ld$25$1)>>2)])|0);
 $$etemp$26$0=-2147483648;
 $$etemp$26$1=-1;
 $112$0=((_i64Subtract($111$0,$111$1,$$etemp$26$0,$$etemp$26$1))|0);$112$1=tempRet0;
 $113$0=$110$0|$112$0;
 $113$1=$110$1|$112$1;
 $ld$27$0=(($x1)|0);
 $114$0=((HEAP32[(($ld$27$0)>>2)])|0);
 $ld$28$1=(($x1+4)|0);
 $114$1=((HEAP32[(($ld$28$1)>>2)])|0);
 $$etemp$29$0=2147483647;
 $$etemp$29$1=0;
 $115$0=((_i64Subtract($$etemp$29$0,$$etemp$29$1,$114$0,$114$1))|0);$115$1=tempRet0;
 $116$0=$113$0|$115$0;
 $116$1=$113$1|$115$1;
 $ld$30$0=(($y1)|0);
 $117$0=((HEAP32[(($ld$30$0)>>2)])|0);
 $ld$31$1=(($y1+4)|0);
 $117$1=((HEAP32[(($ld$31$1)>>2)])|0);
 $$etemp$32$0=2147483647;
 $$etemp$32$1=0;
 $118$0=((_i64Subtract($$etemp$32$0,$$etemp$32$1,$117$0,$117$1))|0);$118$1=tempRet0;
 $119$0=$116$0|$118$0;
 $119$1=$116$1|$118$1;
 $$etemp$33$0=0;
 $$etemp$33$1=0;
 $120=(($119$1|0) <= ($$etemp$33$1|0)) & (((($119$1|0) <  ($$etemp$33$1|0)) | ($119$0>>>0) <= ($$etemp$33$0>>>0)));
 if ($120) {
  $122=$1;
  $123=(($122)|0);
  $124=(($123)|0);
  $125=((HEAP32[(($124)>>2)])|0);
  $126=$1;
  $127=(($126)|0);
  $128=(($127+8)|0);
  HEAP32[(($128)>>2)]=$125;
  $129=$1;
  $130=(($129)|0);
  $131=(($130+4)|0);
  $132=((HEAP32[(($131)>>2)])|0);
  $133=$1;
  $134=(($133)|0);
  $135=(($134+12)|0);
  HEAP32[(($135)>>2)]=$132;
  $136=$1;
  $137=(($136+16)|0);
  $138=((HEAP32[(($137)>>2)])|0);
  $139=($138|0)!=0;
  if ($139) {
   $141=$1;
   $142=(($141+16)|0);
   $143=((HEAP32[(($142)>>2)])|0);
   $144=(($143)|0);
   $145=((HEAP32[(($144)>>2)])|0);
   $146=($145|0)!=0;
   if ($146) {
    $148=$1;
    $149=(($148+16)|0);
    $150=((HEAP32[(($149)>>2)])|0);
    $151=$150;
    _free($151);
   }
  }
  $153=((HEAP32[((8)>>2)])|0);
  $154=$1;
  $155=(($154+16)|0);
  HEAP32[(($155)>>2)]=$153;
  STACKTOP=sp;return;
 }
 $ld$34$0=(($x1)|0);
 $157$0=((HEAP32[(($ld$34$0)>>2)])|0);
 $ld$35$1=(($x1+4)|0);
 $157$1=((HEAP32[(($ld$35$1)>>2)])|0);
 $$etemp$36$0=-2147483648;
 $$etemp$36$1=-1;
 $158=(($157$1|0) < ($$etemp$36$1|0)) | (((($157$1|0) == ($$etemp$36$1|0) & ($157$0>>>0) <  ($$etemp$36$0>>>0))));
 if ($158) {
  $160=$1;
  $161=(($160)|0);
  $162=(($161)|0);
  HEAP32[(($162)>>2)]=-2147483648;
 } else {
  $ld$37$0=(($x2)|0);
  $164$0=((HEAP32[(($ld$37$0)>>2)])|0);
  $ld$38$1=(($x2+4)|0);
  $164$1=((HEAP32[(($ld$38$1)>>2)])|0);
  $$etemp$39$0=2147483647;
  $$etemp$39$1=0;
  $165=(($164$1|0) > ($$etemp$39$1|0)) | (((($164$1|0) == ($$etemp$39$1|0) & ($164$0>>>0) >  ($$etemp$39$0>>>0))));
  if ($165) {
   $167=$1;
   $168=(($167)|0);
   $169=(($168+8)|0);
   HEAP32[(($169)>>2)]=2147483647;
  }
 }
 $ld$40$0=(($y1)|0);
 $172$0=((HEAP32[(($ld$40$0)>>2)])|0);
 $ld$41$1=(($y1+4)|0);
 $172$1=((HEAP32[(($ld$41$1)>>2)])|0);
 $$etemp$42$0=-2147483648;
 $$etemp$42$1=-1;
 $173=(($172$1|0) < ($$etemp$42$1|0)) | (((($172$1|0) == ($$etemp$42$1|0) & ($172$0>>>0) <  ($$etemp$42$0>>>0))));
 if ($173) {
  $175=$1;
  $176=(($175)|0);
  $177=(($176+4)|0);
  HEAP32[(($177)>>2)]=-2147483648;
 } else {
  $ld$43$0=(($y2)|0);
  $179$0=((HEAP32[(($ld$43$0)>>2)])|0);
  $ld$44$1=(($y2+4)|0);
  $179$1=((HEAP32[(($ld$44$1)>>2)])|0);
  $$etemp$45$0=2147483647;
  $$etemp$45$1=0;
  $180=(($179$1|0) > ($$etemp$45$1|0)) | (((($179$1|0) == ($$etemp$45$1|0) & ($179$0>>>0) >  ($$etemp$45$0>>>0))));
  if ($180) {
   $182=$1;
   $183=(($182)|0);
   $184=(($183+12)|0);
   HEAP32[(($184)>>2)]=2147483647;
  }
 }
 $187=$1;
 $188=(($187+16)|0);
 $189=((HEAP32[(($188)>>2)])|0);
 $190=($189|0)!=0;
 if (!($190)) {
  STACKTOP=sp;return;
 }
 $192=$1;
 $193=(($192+16)|0);
 $194=((HEAP32[(($193)>>2)])|0);
 $195=(($194+4)|0);
 $196=((HEAP32[(($195)>>2)])|0);
 $nbox=$196;
 $197=($196|0)!=0;
 if (!($197)) {
  STACKTOP=sp;return;
 }
 $199=$1;
 $200=(($199+16)|0);
 $201=((HEAP32[(($200)>>2)])|0);
 $202=(($201+8)|0);
 $203=$202;
 $pbox=$203;
 $pbox_out=$203;
 while(1) {
  $205=$nbox;
  $206=((($205)-(1))|0);
  $nbox=$206;
  $207=($205|0)!=0;
  if (!($207)) {
   break;
  }
  $209=$pbox;
  $210=(($209)|0);
  $211=((HEAP32[(($210)>>2)])|0);
  $212=$2;
  $213=((($211)+($212))|0);
  $214$0=$213;
  $214$1=((((($213|0)<0))|0)?-1:0);
  $st$46$0=(($x1)|0);
  HEAP32[(($st$46$0)>>2)]=$214$0;
  $st$47$1=(($x1+4)|0);
  HEAP32[(($st$47$1)>>2)]=$214$1;
  $215$0=$214$0;
  $215=$215$0;
  $216=$pbox_out;
  $217=(($216)|0);
  HEAP32[(($217)>>2)]=$215;
  $218=$pbox;
  $219=(($218+4)|0);
  $220=((HEAP32[(($219)>>2)])|0);
  $221=$3;
  $222=((($220)+($221))|0);
  $223$0=$222;
  $223$1=((((($222|0)<0))|0)?-1:0);
  $st$48$0=(($y1)|0);
  HEAP32[(($st$48$0)>>2)]=$223$0;
  $st$49$1=(($y1+4)|0);
  HEAP32[(($st$49$1)>>2)]=$223$1;
  $224$0=$223$0;
  $224=$224$0;
  $225=$pbox_out;
  $226=(($225+4)|0);
  HEAP32[(($226)>>2)]=$224;
  $227=$pbox;
  $228=(($227+8)|0);
  $229=((HEAP32[(($228)>>2)])|0);
  $230=$2;
  $231=((($229)+($230))|0);
  $232$0=$231;
  $232$1=((((($231|0)<0))|0)?-1:0);
  $st$50$0=(($x2)|0);
  HEAP32[(($st$50$0)>>2)]=$232$0;
  $st$51$1=(($x2+4)|0);
  HEAP32[(($st$51$1)>>2)]=$232$1;
  $233$0=$232$0;
  $233=$233$0;
  $234=$pbox_out;
  $235=(($234+8)|0);
  HEAP32[(($235)>>2)]=$233;
  $236=$pbox;
  $237=(($236+12)|0);
  $238=((HEAP32[(($237)>>2)])|0);
  $239=$3;
  $240=((($238)+($239))|0);
  $241$0=$240;
  $241$1=((((($240|0)<0))|0)?-1:0);
  $st$52$0=(($y2)|0);
  HEAP32[(($st$52$0)>>2)]=$241$0;
  $st$53$1=(($y2+4)|0);
  HEAP32[(($st$53$1)>>2)]=$241$1;
  $242$0=$241$0;
  $242=$242$0;
  $243=$pbox_out;
  $244=(($243+12)|0);
  HEAP32[(($244)>>2)]=$242;
  $ld$54$0=(($x2)|0);
  $245$0=((HEAP32[(($ld$54$0)>>2)])|0);
  $ld$55$1=(($x2+4)|0);
  $245$1=((HEAP32[(($ld$55$1)>>2)])|0);
  $$etemp$56$0=-2147483648;
  $$etemp$56$1=-1;
  $246$0=((_i64Subtract($245$0,$245$1,$$etemp$56$0,$$etemp$56$1))|0);$246$1=tempRet0;
  $ld$57$0=(($y2)|0);
  $247$0=((HEAP32[(($ld$57$0)>>2)])|0);
  $ld$58$1=(($y2+4)|0);
  $247$1=((HEAP32[(($ld$58$1)>>2)])|0);
  $$etemp$59$0=-2147483648;
  $$etemp$59$1=-1;
  $248$0=((_i64Subtract($247$0,$247$1,$$etemp$59$0,$$etemp$59$1))|0);$248$1=tempRet0;
  $249$0=$246$0|$248$0;
  $249$1=$246$1|$248$1;
  $ld$60$0=(($x1)|0);
  $250$0=((HEAP32[(($ld$60$0)>>2)])|0);
  $ld$61$1=(($x1+4)|0);
  $250$1=((HEAP32[(($ld$61$1)>>2)])|0);
  $$etemp$62$0=2147483647;
  $$etemp$62$1=0;
  $251$0=((_i64Subtract($$etemp$62$0,$$etemp$62$1,$250$0,$250$1))|0);$251$1=tempRet0;
  $252$0=$249$0|$251$0;
  $252$1=$249$1|$251$1;
  $ld$63$0=(($y1)|0);
  $253$0=((HEAP32[(($ld$63$0)>>2)])|0);
  $ld$64$1=(($y1+4)|0);
  $253$1=((HEAP32[(($ld$64$1)>>2)])|0);
  $$etemp$65$0=2147483647;
  $$etemp$65$1=0;
  $254$0=((_i64Subtract($$etemp$65$0,$$etemp$65$1,$253$0,$253$1))|0);$254$1=tempRet0;
  $255$0=$252$0|$254$0;
  $255$1=$252$1|$254$1;
  $$etemp$66$0=0;
  $$etemp$66$1=0;
  $256=(($255$1|0) <= ($$etemp$66$1|0)) & (((($255$1|0) <  ($$etemp$66$1|0)) | ($255$0>>>0) <= ($$etemp$66$0>>>0)));
  if ($256) {
   $258=$1;
   $259=(($258+16)|0);
   $260=((HEAP32[(($259)>>2)])|0);
   $261=(($260+4)|0);
   $262=((HEAP32[(($261)>>2)])|0);
   $263=((($262)-(1))|0);
   HEAP32[(($261)>>2)]=$263;
  } else {
   $ld$67$0=(($x1)|0);
   $265$0=((HEAP32[(($ld$67$0)>>2)])|0);
   $ld$68$1=(($x1+4)|0);
   $265$1=((HEAP32[(($ld$68$1)>>2)])|0);
   $$etemp$69$0=-2147483648;
   $$etemp$69$1=-1;
   $266=(($265$1|0) < ($$etemp$69$1|0)) | (((($265$1|0) == ($$etemp$69$1|0) & ($265$0>>>0) <  ($$etemp$69$0>>>0))));
   if ($266) {
    $268=$pbox_out;
    $269=(($268)|0);
    HEAP32[(($269)>>2)]=-2147483648;
   } else {
    $ld$70$0=(($x2)|0);
    $271$0=((HEAP32[(($ld$70$0)>>2)])|0);
    $ld$71$1=(($x2+4)|0);
    $271$1=((HEAP32[(($ld$71$1)>>2)])|0);
    $$etemp$72$0=2147483647;
    $$etemp$72$1=0;
    $272=(($271$1|0) > ($$etemp$72$1|0)) | (((($271$1|0) == ($$etemp$72$1|0) & ($271$0>>>0) >  ($$etemp$72$0>>>0))));
    if ($272) {
     $274=$pbox_out;
     $275=(($274+8)|0);
     HEAP32[(($275)>>2)]=2147483647;
    }
   }
   $ld$73$0=(($y1)|0);
   $278$0=((HEAP32[(($ld$73$0)>>2)])|0);
   $ld$74$1=(($y1+4)|0);
   $278$1=((HEAP32[(($ld$74$1)>>2)])|0);
   $$etemp$75$0=-2147483648;
   $$etemp$75$1=-1;
   $279=(($278$1|0) < ($$etemp$75$1|0)) | (((($278$1|0) == ($$etemp$75$1|0) & ($278$0>>>0) <  ($$etemp$75$0>>>0))));
   if ($279) {
    $281=$pbox_out;
    $282=(($281+4)|0);
    HEAP32[(($282)>>2)]=-2147483648;
   } else {
    $ld$76$0=(($y2)|0);
    $284$0=((HEAP32[(($ld$76$0)>>2)])|0);
    $ld$77$1=(($y2+4)|0);
    $284$1=((HEAP32[(($ld$77$1)>>2)])|0);
    $$etemp$78$0=2147483647;
    $$etemp$78$1=0;
    $285=(($284$1|0) > ($$etemp$78$1|0)) | (((($284$1|0) == ($$etemp$78$1|0) & ($284$0>>>0) >  ($$etemp$78$0>>>0))));
    if ($285) {
     $287=$pbox_out;
     $288=(($287+12)|0);
     HEAP32[(($288)>>2)]=2147483647;
    }
   }
   $291=$pbox_out;
   $292=(($291+16)|0);
   $pbox_out=$292;
  }
  $294=$pbox;
  $295=(($294+16)|0);
  $pbox=$295;
 }
 $297=$pbox_out;
 $298=$pbox;
 $299=($297|0)!=($298|0);
 if ($299) {
  $301=$1;
  $302=(($301+16)|0);
  $303=((HEAP32[(($302)>>2)])|0);
  $304=(($303+4)|0);
  $305=((HEAP32[(($304)>>2)])|0);
  $306=($305|0)==1;
  if ($306) {
   $308=$1;
   $309=(($308)|0);
   $310=$1;
   $311=(($310+16)|0);
   $312=((HEAP32[(($311)>>2)])|0);
   $313=(($312+8)|0);
   $314=$313;
   $315=$309;
   $316=$314;
   HEAP32[(($315)>>2)]=((HEAP32[(($316)>>2)])|0);HEAP32[((($315)+(4))>>2)]=((HEAP32[((($316)+(4))>>2)])|0);HEAP32[((($315)+(8))>>2)]=((HEAP32[((($316)+(8))>>2)])|0);HEAP32[((($315)+(12))>>2)]=((HEAP32[((($316)+(12))>>2)])|0);
   $317=$1;
   $318=(($317+16)|0);
   $319=((HEAP32[(($318)>>2)])|0);
   $320=($319|0)!=0;
   if ($320) {
    $322=$1;
    $323=(($322+16)|0);
    $324=((HEAP32[(($323)>>2)])|0);
    $325=(($324)|0);
    $326=((HEAP32[(($325)>>2)])|0);
    $327=($326|0)!=0;
    if ($327) {
     $329=$1;
     $330=(($329+16)|0);
     $331=((HEAP32[(($330)>>2)])|0);
     $332=$331;
     _free($332);
    }
   }
   $334=$1;
   $335=(($334+16)|0);
   HEAP32[(($335)>>2)]=0;
  } else {
   $337=$1;
   _pixman_set_extents($337);
  }
 }
 STACKTOP=sp;return;
}


function _pixman_region32_reset($region,$box){
 $region=($region)|0;
 $box=($box)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0,$22=0,$23=0;
 var $24=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$45=0,$46=0,$47=0,$48=0;
 var $50=0,$51=0,label=0;
 var sp=0;sp=STACKTOP;


 $1=$region;
 $2=$box;
 $4=$2;
 $5=(($4)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=$2;
 $8=(($7+8)|0);
 $9=((HEAP32[(($8)>>2)])|0);
 $10=($6|0)<($9|0);
 if ($10) {
  $12=$2;
  $13=(($12+4)|0);
  $14=((HEAP32[(($13)>>2)])|0);
  $15=$2;
  $16=(($15+12)|0);
  $17=((HEAP32[(($16)>>2)])|0);
  $18=($14|0)<($17|0);
  $20=$18;
 } else {
  $20=0;
 }

 $21=$20^1;
 $22=($21&1);
 $23=($22);
 $24=($23|0)!=0;
 if ($24) {
  __pixman_log_error(1752,296);
 }
 $28=$1;
 $29=(($28)|0);
 $30=$2;
 $31=$29;
 $32=$30;
 HEAP32[(($31)>>2)]=((HEAP32[(($32)>>2)])|0);HEAP32[((($31)+(4))>>2)]=((HEAP32[((($32)+(4))>>2)])|0);HEAP32[((($31)+(8))>>2)]=((HEAP32[((($32)+(8))>>2)])|0);HEAP32[((($31)+(12))>>2)]=((HEAP32[((($32)+(12))>>2)])|0);
 $33=$1;
 $34=(($33+16)|0);
 $35=((HEAP32[(($34)>>2)])|0);
 $36=($35|0)!=0;
 if (!($36)) {
  $50=$1;
  $51=(($50+16)|0);
  HEAP32[(($51)>>2)]=0;
  STACKTOP=sp;return;
 }
 $38=$1;
 $39=(($38+16)|0);
 $40=((HEAP32[(($39)>>2)])|0);
 $41=(($40)|0);
 $42=((HEAP32[(($41)>>2)])|0);
 $43=($42|0)!=0;
 if (!($43)) {
  $50=$1;
  $51=(($50+16)|0);
  HEAP32[(($51)>>2)]=0;
  STACKTOP=sp;return;
 }
 $45=$1;
 $46=(($45+16)|0);
 $47=((HEAP32[(($46)>>2)])|0);
 $48=$47;
 _free($48);
 $50=$1;
 $51=(($50+16)|0);
 HEAP32[(($51)>>2)]=0;
 STACKTOP=sp;return;
}


function _pixman_region32_clear($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$19=0,$20=0,$21=0,$22=0,$23=0;
 var $24=0,$25=0,$26=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if ($5) {
  $7=$1;
  $8=(($7+16)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=(($9)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $12=($11|0)!=0;
  if ($12) {
   $14=$1;
   $15=(($14+16)|0);
   $16=((HEAP32[(($15)>>2)])|0);
   $17=$16;
   _free($17);
  }
 }
 $19=$1;
 $20=(($19)|0);
 $21=((HEAP32[((16)>>2)])|0);
 $22=$20;
 $23=$21;
 HEAP32[(($22)>>2)]=((HEAP32[(($23)>>2)])|0);HEAP32[((($22)+(4))>>2)]=((HEAP32[((($23)+(4))>>2)])|0);HEAP32[((($22)+(8))>>2)]=((HEAP32[((($23)+(8))>>2)])|0);HEAP32[((($22)+(12))>>2)]=((HEAP32[((($23)+(12))>>2)])|0);
 $24=((HEAP32[((8)>>2)])|0);
 $25=$1;
 $26=(($25+16)|0);
 HEAP32[(($26)>>2)]=$24;
 STACKTOP=sp;return;
}


function _pixman_region32_contains_point($region,$x,$y,$box){
 $region=($region)|0;
 $x=($x)|0;
 $y=($y)|0;
 $box=($box)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$pbox=0,$pbox_end=0,$numRects=0,$6=0,$7=0,$8=0,$9=0,$11=0,$12=0,$13=0,$14=0,$15=0,$18=0,$19=0,$20=0;
 var $22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$43=0,$44=0;
 var $45=0,$46=0,$47=0,$48=0,$51=0,$52=0,$54=0,$55=0,$57=0,$58=0,$59=0,$60=0,$61=0,$64=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0;
 var $71=0,$72=0,$73=0,$74=0,$75=0,$77=0,$78=0,$79=0,$81=0,$82=0,$83=0,$84=0,$85=0,$87=0,$88=0,$89=0,$90=0,$91=0,$94=0,$95=0;
 var $96=0,$97=0,$98=0,$101=0,$102=0,$104=0,$105=0,$106=0,$107=0,$110=0,$111=0,$114=0,label=0;
 var sp=0;sp=STACKTOP;








 $2=$region;
 $3=$x;
 $4=$y;
 $5=$box;
 $6=$2;
 $7=(($6+16)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=($8|0)!=0;
 if ($9) {
  $11=$2;
  $12=(($11+16)|0);
  $13=((HEAP32[(($12)>>2)])|0);
  $14=(($13+4)|0);
  $15=((HEAP32[(($14)>>2)])|0);
  $18=$15;
 } else {
  $18=1;
 }

 $numRects=$18;
 $19=$numRects;
 $20=($19|0)!=0;
 if ($20) {
  $22=$2;
  $23=(($22)|0);
  $24=(($23+8)|0);
  $25=((HEAP32[(($24)>>2)])|0);
  $26=$3;
  $27=($25|0)>($26|0);
  if ($27) {
   $29=$2;
   $30=(($29)|0);
   $31=(($30)|0);
   $32=((HEAP32[(($31)>>2)])|0);
   $33=$3;
   $34=($32|0)<=($33|0);
   if ($34) {
    $36=$2;
    $37=(($36)|0);
    $38=(($37+12)|0);
    $39=((HEAP32[(($38)>>2)])|0);
    $40=$4;
    $41=($39|0)>($40|0);
    if ($41) {
     $43=$2;
     $44=(($43)|0);
     $45=(($44+4)|0);
     $46=((HEAP32[(($45)>>2)])|0);
     $47=$4;
     $48=($46|0)<=($47|0);
     if ($48) {
      $51=$numRects;
      $52=($51|0)==1;
      if ($52) {
       $54=$5;
       $55=($54|0)!=0;
       if ($55) {
        $57=$5;
        $58=$2;
        $59=(($58)|0);
        $60=$57;
        $61=$59;
        HEAP32[(($60)>>2)]=((HEAP32[(($61)>>2)])|0);HEAP32[((($60)+(4))>>2)]=((HEAP32[((($61)+(4))>>2)])|0);HEAP32[((($60)+(8))>>2)]=((HEAP32[((($61)+(8))>>2)])|0);HEAP32[((($60)+(12))>>2)]=((HEAP32[((($61)+(12))>>2)])|0);
       }
       $1=1;
       $114=$1;
       STACKTOP=sp;return (($114)|0);
      }
      $64=$2;
      $65=(($64+16)|0);
      $66=((HEAP32[(($65)>>2)])|0);
      $67=(($66+8)|0);
      $68=$67;
      $pbox=$68;
      $69=$pbox;
      $70=$numRects;
      $71=(($69+($70<<4))|0);
      $pbox_end=$71;
      $72=$pbox;
      $73=$pbox_end;
      $74=$4;
      $75=((_find_box_for_y($72,$73,$74))|0);
      $pbox=$75;
      while(1) {
       $77=$pbox;
       $78=$pbox_end;
       $79=($77|0)!=($78|0);
       if (!($79)) {
        break;
       }
       $81=$4;
       $82=$pbox;
       $83=(($82+4)|0);
       $84=((HEAP32[(($83)>>2)])|0);
       $85=($81|0)<($84|0);
       if ($85) {
        label = 18;
        break;
       }
       $87=$3;
       $88=$pbox;
       $89=(($88)|0);
       $90=((HEAP32[(($89)>>2)])|0);
       $91=($87|0)<($90|0);
       if ($91) {
        label = 18;
        break;
       }
       $94=$3;
       $95=$pbox;
       $96=(($95+8)|0);
       $97=((HEAP32[(($96)>>2)])|0);
       $98=($94|0)>=($97|0);
       if (!($98)) {
        label = 21;
        break;
       }
       $110=$pbox;
       $111=(($110+16)|0);
       $pbox=$111;
      }
      if ((label|0) == 18) {
      }
      else if ((label|0) == 21) {
       $101=$5;
       $102=($101|0)!=0;
       if ($102) {
        $104=$5;
        $105=$pbox;
        $106=$104;
        $107=$105;
        HEAP32[(($106)>>2)]=((HEAP32[(($107)>>2)])|0);HEAP32[((($106)+(4))>>2)]=((HEAP32[((($107)+(4))>>2)])|0);HEAP32[((($106)+(8))>>2)]=((HEAP32[((($107)+(8))>>2)])|0);HEAP32[((($106)+(12))>>2)]=((HEAP32[((($107)+(12))>>2)])|0);
       }
       $1=1;
       $114=$1;
       STACKTOP=sp;return (($114)|0);
      }
      $1=0;
      $114=$1;
      STACKTOP=sp;return (($114)|0);
     }
    }
   }
  }
 }
 $1=0;
 $114=$1;
 STACKTOP=sp;return (($114)|0);
}


function _pixman_region32_not_empty($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$15=0,$16=0,$17=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2+16)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($4|0)!=0;
 if ($5) {
  $7=$1;
  $8=(($7+16)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=(($9+4)|0);
  $11=((HEAP32[(($10)>>2)])|0);
  $12=($11|0)!=0;
  $13=$12^1;
  $15=$13;
 } else {
  $15=0;
 }

 $16=$15^1;
 $17=($16&1);
 STACKTOP=sp;return (($17)|0);
}


function _pixman_region32_extents($region){
 $region=($region)|0;
 var $1=0,$2=0,$3=0,label=0;
 var sp=0;sp=STACKTOP;

 $1=$region;
 $2=$1;
 $3=(($2)|0);
 STACKTOP=sp;return (($3)|0);
}


function _pixman_region32_selfcheck($reg){
 $reg=($reg)|0;
 var $1=0,$2=0,$i=0,$numRects=0,$pbox_p=0,$pbox_n=0,$box=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$13=0,$14=0,$15=0,$16=0;
 var $17=0,$18=0,$19=0,$20=0,$21=0,$24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$31=0,$32=0,$33=0,$36=0,$37=0,$38=0,$40=0,$41=0,$42=0;
 var $43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$50=0,$51=0,$52=0,$53=0,$54=0,$55=0,$56=0,$57=0,$58=0,$60=0,$61=0,$62=0,$63=0,$64=0;
 var $65=0,$67=0,$68=0,$69=0,$70=0,$71=0,$73=0,$75=0,$76=0,$78=0,$79=0,$81=0,$82=0,$83=0,$84=0,$85=0,$86=0,$88=0,$89=0,$90=0;
 var $91=0,$93=0,$94=0,$95=0,$96=0,$97=0,$99=0,$100=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$109=0,$110=0,$111=0,$112=0,$113=0;
 var $114=0,$115=0,$117=0,$118=0,$119=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0,$127=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$135=0,$138=0;
 var $139=0,$140=0,$141=0,$142=0,$143=0,$145=0,$146=0,$147=0,$148=0,$150=0,$151=0,$152=0,$153=0,$154=0,$155=0,$157=0,$158=0,$159=0,$160=0,$162=0;
 var $163=0,$164=0,$165=0,$166=0,$167=0,$168=0,$170=0,$171=0,$172=0,$173=0,$174=0,$175=0,$176=0,$178=0,$179=0,$180=0,$181=0,$182=0,$183=0,$184=0;
 var $186=0,$187=0,$188=0,$189=0,$190=0,$191=0,$192=0,$196=0,$197=0,$198=0,$199=0,$201=0,$202=0,$203=0,$204=0,$205=0,$206=0,$207=0,$209=0,$210=0;
 var $211=0,$212=0,$213=0,$214=0,$215=0,$217=0,$218=0,$219=0,$220=0,$221=0,$222=0,$223=0,$225=0,$226=0,$227=0,$228=0,$229=0,$230=0,$231=0,$233=0;
 var $234=0,$236=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+16)|0;






 $box=((sp)|0);
 $2=$reg;
 $3=$2;
 $4=(($3)|0);
 $5=(($4)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=$2;
 $8=(($7)|0);
 $9=(($8+8)|0);
 $10=((HEAP32[(($9)>>2)])|0);
 $11=($6|0)>($10|0);
 if (!($11)) {
  $13=$2;
  $14=(($13)|0);
  $15=(($14+4)|0);
  $16=((HEAP32[(($15)>>2)])|0);
  $17=$2;
  $18=(($17)|0);
  $19=(($18+12)|0);
  $20=((HEAP32[(($19)>>2)])|0);
  $21=($16|0)>($20|0);
  if (!($21)) {
   $24=$2;
   $25=(($24+16)|0);
   $26=((HEAP32[(($25)>>2)])|0);
   $27=($26|0)!=0;
   if ($27) {
    $29=$2;
    $30=(($29+16)|0);
    $31=((HEAP32[(($30)>>2)])|0);
    $32=(($31+4)|0);
    $33=((HEAP32[(($32)>>2)])|0);
    $36=$33;
   } else {
    $36=1;
   }

   $numRects=$36;
   $37=$numRects;
   $38=($37|0)!=0;
   if (!($38)) {
    $40=$2;
    $41=(($40)|0);
    $42=(($41)|0);
    $43=((HEAP32[(($42)>>2)])|0);
    $44=$2;
    $45=(($44)|0);
    $46=(($45+8)|0);
    $47=((HEAP32[(($46)>>2)])|0);
    $48=($43|0)==($47|0);
    if ($48) {
     $50=$2;
     $51=(($50)|0);
     $52=(($51+4)|0);
     $53=((HEAP32[(($52)>>2)])|0);
     $54=$2;
     $55=(($54)|0);
     $56=(($55+12)|0);
     $57=((HEAP32[(($56)>>2)])|0);
     $58=($53|0)==($57|0);
     if ($58) {
      $60=$2;
      $61=(($60+16)|0);
      $62=((HEAP32[(($61)>>2)])|0);
      $63=(($62)|0);
      $64=((HEAP32[(($63)>>2)])|0);
      $65=($64|0)!=0;
      if ($65) {
       $73=1;
      } else {
       $67=$2;
       $68=(($67+16)|0);
       $69=((HEAP32[(($68)>>2)])|0);
       $70=((HEAP32[((8)>>2)])|0);
       $71=($69|0)==($70|0);
       $73=$71;
      }

      $75=$73;
     } else {
      $75=0;
     }
    } else {
     $75=0;
    }

    $76=($75&1);
    $1=$76;
    $236=$1;
    STACKTOP=sp;return (($236)|0);
   }
   $78=$numRects;
   $79=($78|0)==1;
   if ($79) {
    $81=$2;
    $82=(($81+16)|0);
    $83=((HEAP32[(($82)>>2)])|0);
    $84=($83|0)!=0;
    $85=$84^1;
    $86=($85&1);
    $1=$86;
    $236=$1;
    STACKTOP=sp;return (($236)|0);
   }
   $88=$2;
   $89=(($88+16)|0);
   $90=((HEAP32[(($89)>>2)])|0);
   $91=($90|0)!=0;
   if ($91) {
    $93=$2;
    $94=(($93+16)|0);
    $95=((HEAP32[(($94)>>2)])|0);
    $96=(($95+8)|0);
    $97=$96;
    $102=$97;
   } else {
    $99=$2;
    $100=(($99)|0);
    $102=$100;
   }

   $pbox_p=$102;
   $103=$pbox_p;
   $104=$box;
   $105=$103;
   HEAP32[(($104)>>2)]=((HEAP32[(($105)>>2)])|0);HEAP32[((($104)+(4))>>2)]=((HEAP32[((($105)+(4))>>2)])|0);HEAP32[((($104)+(8))>>2)]=((HEAP32[((($105)+(8))>>2)])|0);HEAP32[((($104)+(12))>>2)]=((HEAP32[((($105)+(12))>>2)])|0);
   $106=$numRects;
   $107=((($106)-(1))|0);
   $108=$pbox_p;
   $109=(($108+($107<<4))|0);
   $110=(($109+12)|0);
   $111=((HEAP32[(($110)>>2)])|0);
   $112=(($box+12)|0);
   HEAP32[(($112)>>2)]=$111;
   $113=$pbox_p;
   $114=(($113+16)|0);
   $pbox_n=$114;
   $115=$numRects;
   $i=$115;
   while(1) {
    $117=$i;
    $118=((($117)-(1))|0);
    $i=$118;
    $119=($118|0)>0;
    if (!($119)) {
     label = 35;
     break;
    }
    $121=$pbox_n;
    $122=(($121)|0);
    $123=((HEAP32[(($122)>>2)])|0);
    $124=$pbox_n;
    $125=(($124+8)|0);
    $126=((HEAP32[(($125)>>2)])|0);
    $127=($123|0)>=($126|0);
    if ($127) {
     label = 23;
     break;
    }
    $129=$pbox_n;
    $130=(($129+4)|0);
    $131=((HEAP32[(($130)>>2)])|0);
    $132=$pbox_n;
    $133=(($132+12)|0);
    $134=((HEAP32[(($133)>>2)])|0);
    $135=($131|0)>=($134|0);
    if ($135) {
     label = 23;
     break;
    }
    $138=$pbox_n;
    $139=(($138)|0);
    $140=((HEAP32[(($139)>>2)])|0);
    $141=(($box)|0);
    $142=((HEAP32[(($141)>>2)])|0);
    $143=($140|0)<($142|0);
    if ($143) {
     $145=$pbox_n;
     $146=(($145)|0);
     $147=((HEAP32[(($146)>>2)])|0);
     $148=(($box)|0);
     HEAP32[(($148)>>2)]=$147;
    }
    $150=$pbox_n;
    $151=(($150+8)|0);
    $152=((HEAP32[(($151)>>2)])|0);
    $153=(($box+8)|0);
    $154=((HEAP32[(($153)>>2)])|0);
    $155=($152|0)>($154|0);
    if ($155) {
     $157=$pbox_n;
     $158=(($157+8)|0);
     $159=((HEAP32[(($158)>>2)])|0);
     $160=(($box+8)|0);
     HEAP32[(($160)>>2)]=$159;
    }
    $162=$pbox_n;
    $163=(($162+4)|0);
    $164=((HEAP32[(($163)>>2)])|0);
    $165=$pbox_p;
    $166=(($165+4)|0);
    $167=((HEAP32[(($166)>>2)])|0);
    $168=($164|0)<($167|0);
    if ($168) {
     label = 32;
     break;
    }
    $170=$pbox_n;
    $171=(($170+4)|0);
    $172=((HEAP32[(($171)>>2)])|0);
    $173=$pbox_p;
    $174=(($173+4)|0);
    $175=((HEAP32[(($174)>>2)])|0);
    $176=($172|0)==($175|0);
    if ($176) {
     $178=$pbox_n;
     $179=(($178)|0);
     $180=((HEAP32[(($179)>>2)])|0);
     $181=$pbox_p;
     $182=(($181+8)|0);
     $183=((HEAP32[(($182)>>2)])|0);
     $184=($180|0)<($183|0);
     if ($184) {
      label = 32;
      break;
     }
     $186=$pbox_n;
     $187=(($186+12)|0);
     $188=((HEAP32[(($187)>>2)])|0);
     $189=$pbox_p;
     $190=(($189+12)|0);
     $191=((HEAP32[(($190)>>2)])|0);
     $192=($188|0)!=($191|0);
     if ($192) {
      label = 32;
      break;
     }
    }
    $196=$pbox_p;
    $197=(($196+16)|0);
    $pbox_p=$197;
    $198=$pbox_n;
    $199=(($198+16)|0);
    $pbox_n=$199;
   }
   if ((label|0) == 23) {
    $1=0;
    $236=$1;
    STACKTOP=sp;return (($236)|0);
   }
   else if ((label|0) == 32) {
    $1=0;
    $236=$1;
    STACKTOP=sp;return (($236)|0);
   }
   else if ((label|0) == 35) {
    $201=(($box)|0);
    $202=((HEAP32[(($201)>>2)])|0);
    $203=$2;
    $204=(($203)|0);
    $205=(($204)|0);
    $206=((HEAP32[(($205)>>2)])|0);
    $207=($202|0)==($206|0);
    if ($207) {
     $209=(($box+8)|0);
     $210=((HEAP32[(($209)>>2)])|0);
     $211=$2;
     $212=(($211)|0);
     $213=(($212+8)|0);
     $214=((HEAP32[(($213)>>2)])|0);
     $215=($210|0)==($214|0);
     if ($215) {
      $217=(($box+4)|0);
      $218=((HEAP32[(($217)>>2)])|0);
      $219=$2;
      $220=(($219)|0);
      $221=(($220+4)|0);
      $222=((HEAP32[(($221)>>2)])|0);
      $223=($218|0)==($222|0);
      if ($223) {
       $225=(($box+12)|0);
       $226=((HEAP32[(($225)>>2)])|0);
       $227=$2;
       $228=(($227)|0);
       $229=(($228+12)|0);
       $230=((HEAP32[(($229)>>2)])|0);
       $231=($226|0)==($230|0);
       $233=$231;
      } else {
       $233=0;
      }
     } else {
      $233=0;
     }
    } else {
     $233=0;
    }

    $234=($233&1);
    $1=$234;
    $236=$1;
    STACKTOP=sp;return (($236)|0);
   }
  }
 }
 $1=0;
 $236=$1;
 STACKTOP=sp;return (($236)|0);
}


function _pixman_region32_init_rects($region,$boxes,$count){
 $region=($region)|0;
 $boxes=($boxes)|0;
 $count=($count)|0;
 var $1=0,$2=0,$3=0,$4=0,$rects=0,$displacement=0,$i=0,$box=0,$5=0,$6=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0;
 var $18=0,$19=0,$20=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$36=0,$37=0,$38=0;
 var $41=0,$42=0,$43=0,$44=0,$47=0,$48=0,$49=0,$50=0,$52=0,$53=0,$54=0,$55=0,$56=0,$58=0,$59=0,$61=0,$62=0,$63=0,$64=0,$65=0;
 var $66=0,$67=0,$68=0,$69=0,$70=0,$71=0,$72=0,$74=0,$75=0,$76=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$85=0,$86=0,$87=0;
 var $89=0,$90=0,$91=0,$92=0,$93=0,$94=0,$95=0,$97=0,$98=0,$100=0,$101=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$109=0,$110=0,$111=0;
 var $112=0,$116=0,$117=0,$119=0,$120=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0,$127=0,$128=0,$129=0,$130=0,$131=0,$133=0,$134=0,$135=0,$136=0;
 var $138=0,$139=0,$140=0,$141=0,$142=0,$143=0,$145=0,$146=0,$147=0,$148=0,$150=0,$152=0,$153=0,$154=0,$155=0,$156=0,$157=0,$159=0,$160=0,$161=0;
 var $162=0,$163=0,$164=0,$165=0,$166=0,$167=0,$168=0,$170=0,$171=0,$172=0,$173=0,$174=0,$175=0,$177=0,$178=0,$179=0,$180=0,$182=0,$183=0,$185=0;
 var $186=0,$187=0,$188=0,$189=0,$190=0,$191=0,$192=0,$194=0,label=0;
 var sp=0;sp=STACKTOP;








 $2=$region;
 $3=$boxes;
 $4=$count;
 $5=$4;
 $6=($5|0)==1;
 if ($6) {
  $8=$2;
  $9=$3;
  $10=(($9)|0);
  $11=(($10)|0);
  $12=((HEAP32[(($11)>>2)])|0);
  $13=$3;
  $14=(($13)|0);
  $15=(($14+4)|0);
  $16=((HEAP32[(($15)>>2)])|0);
  $17=$3;
  $18=(($17)|0);
  $19=(($18+8)|0);
  $20=((HEAP32[(($19)>>2)])|0);
  $21=$3;
  $22=(($21)|0);
  $23=(($22)|0);
  $24=((HEAP32[(($23)>>2)])|0);
  $25=((($20)-($24))|0);
  $26=$3;
  $27=(($26)|0);
  $28=(($27+12)|0);
  $29=((HEAP32[(($28)>>2)])|0);
  $30=$3;
  $31=(($30)|0);
  $32=(($31+4)|0);
  $33=((HEAP32[(($32)>>2)])|0);
  $34=((($29)-($33))|0);
  _pixman_region32_init_rect($8,$12,$16,$25,$34);
  $1=1;
  $194=$1;
  STACKTOP=sp;return (($194)|0);
 }
 $36=$2;
 _pixman_region32_init($36);
 $37=$4;
 $38=($37|0)==0;
 if ($38) {
  $1=1;
  $194=$1;
  STACKTOP=sp;return (($194)|0);
 }
 $41=$2;
 $42=$4;
 $43=((_pixman_rect_alloc($41,$42))|0);
 $44=($43|0)!=0;
 if (!($44)) {
  $1=0;
  $194=$1;
  STACKTOP=sp;return (($194)|0);
 }
 $47=$2;
 $48=(($47+16)|0);
 $49=((HEAP32[(($48)>>2)])|0);
 $50=($49|0)!=0;
 if ($50) {
  $52=$2;
  $53=(($52+16)|0);
  $54=((HEAP32[(($53)>>2)])|0);
  $55=(($54+8)|0);
  $56=$55;
  $61=$56;
 } else {
  $58=$2;
  $59=(($58)|0);
  $61=$59;
 }

 $rects=$61;
 $62=$rects;
 $63=$62;
 $64=$3;
 $65=$64;
 $66=$4;
 $67=($66<<4);
 (_memcpy((($63)|0), (($65)|0), $67)|0);
 $68=$4;
 $69=$2;
 $70=(($69+16)|0);
 $71=((HEAP32[(($70)>>2)])|0);
 $72=(($71+4)|0);
 HEAP32[(($72)>>2)]=$68;
 $displacement=0;
 $i=0;
 while(1) {
  $74=$i;
  $75=$4;
  $76=($74|0)<($75|0);
  if (!($76)) {
   break;
  }
  $78=$i;
  $79=$rects;
  $80=(($79+($78<<4))|0);
  $box=$80;
  $81=$box;
  $82=(($81)|0);
  $83=((HEAP32[(($82)>>2)])|0);
  $84=$box;
  $85=(($84+8)|0);
  $86=((HEAP32[(($85)>>2)])|0);
  $87=($83|0)>=($86|0);
  if ($87) {
   label = 14;
  } else {
   $89=$box;
   $90=(($89+4)|0);
   $91=((HEAP32[(($90)>>2)])|0);
   $92=$box;
   $93=(($92+12)|0);
   $94=((HEAP32[(($93)>>2)])|0);
   $95=($91|0)>=($94|0);
   if ($95) {
    label = 14;
   } else {
    $100=$displacement;
    $101=($100|0)!=0;
    if ($101) {
     $103=$i;
     $104=$displacement;
     $105=((($103)-($104))|0);
     $106=$rects;
     $107=(($106+($105<<4))|0);
     $108=$i;
     $109=$rects;
     $110=(($109+($108<<4))|0);
     $111=$107;
     $112=$110;
     HEAP32[(($111)>>2)]=((HEAP32[(($112)>>2)])|0);HEAP32[((($111)+(4))>>2)]=((HEAP32[((($112)+(4))>>2)])|0);HEAP32[((($111)+(8))>>2)]=((HEAP32[((($112)+(8))>>2)])|0);HEAP32[((($111)+(12))>>2)]=((HEAP32[((($112)+(12))>>2)])|0);
    }
   }
  }
  if ((label|0) == 14) {
   label = 0;
   $97=$displacement;
   $98=((($97)+(1))|0);
   $displacement=$98;
  }
  $116=$i;
  $117=((($116)+(1))|0);
  $i=$117;
 }
 $119=$displacement;
 $120=$2;
 $121=(($120+16)|0);
 $122=((HEAP32[(($121)>>2)])|0);
 $123=(($122+4)|0);
 $124=((HEAP32[(($123)>>2)])|0);
 $125=((($124)-($119))|0);
 HEAP32[(($123)>>2)]=$125;
 $126=$2;
 $127=(($126+16)|0);
 $128=((HEAP32[(($127)>>2)])|0);
 $129=(($128+4)|0);
 $130=((HEAP32[(($129)>>2)])|0);
 $131=($130|0)==0;
 if ($131) {
  $133=$2;
  $134=(($133+16)|0);
  $135=((HEAP32[(($134)>>2)])|0);
  $136=($135|0)!=0;
  if ($136) {
   $138=$2;
   $139=(($138+16)|0);
   $140=((HEAP32[(($139)>>2)])|0);
   $141=(($140)|0);
   $142=((HEAP32[(($141)>>2)])|0);
   $143=($142|0)!=0;
   if ($143) {
    $145=$2;
    $146=(($145+16)|0);
    $147=((HEAP32[(($146)>>2)])|0);
    $148=$147;
    _free($148);
   }
  }
  $150=$2;
  _pixman_region32_init($150);
  $1=1;
  $194=$1;
  STACKTOP=sp;return (($194)|0);
 }
 $152=$2;
 $153=(($152+16)|0);
 $154=((HEAP32[(($153)>>2)])|0);
 $155=(($154+4)|0);
 $156=((HEAP32[(($155)>>2)])|0);
 $157=($156|0)==1;
 if (!($157)) {
  $185=$2;
  $186=(($185)|0);
  $187=(($186+8)|0);
  HEAP32[(($187)>>2)]=0;
  $188=$2;
  $189=(($188)|0);
  $190=(($189)|0);
  HEAP32[(($190)>>2)]=0;
  $191=$2;
  $192=((_validate($191))|0);
  $1=$192;
  $194=$1;
  STACKTOP=sp;return (($194)|0);
 }
 $159=$2;
 $160=(($159)|0);
 $161=$rects;
 $162=(($161)|0);
 $163=$160;
 $164=$162;
 HEAP32[(($163)>>2)]=((HEAP32[(($164)>>2)])|0);HEAP32[((($163)+(4))>>2)]=((HEAP32[((($164)+(4))>>2)])|0);HEAP32[((($163)+(8))>>2)]=((HEAP32[((($164)+(8))>>2)])|0);HEAP32[((($163)+(12))>>2)]=((HEAP32[((($164)+(12))>>2)])|0);
 $165=$2;
 $166=(($165+16)|0);
 $167=((HEAP32[(($166)>>2)])|0);
 $168=($167|0)!=0;
 if ($168) {
  $170=$2;
  $171=(($170+16)|0);
  $172=((HEAP32[(($171)>>2)])|0);
  $173=(($172)|0);
  $174=((HEAP32[(($173)>>2)])|0);
  $175=($174|0)!=0;
  if ($175) {
   $177=$2;
   $178=(($177+16)|0);
   $179=((HEAP32[(($178)>>2)])|0);
   $180=$179;
   _free($180);
  }
 }
 $182=$2;
 $183=(($182+16)|0);
 HEAP32[(($183)>>2)]=0;
 $1=1;
 $194=$1;
 STACKTOP=sp;return (($194)|0);
}


function _pixman_rect_alloc($region,$n){
 $region=($region)|0;
 $n=($n)|0;
 var $1=0,$2=0,$3=0,$data=0,$data_size=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0;
 var $21=0,$23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0;
 var $44=0,$45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$53=0,$54=0,$56=0,$57=0,$58=0,$59=0,$61=0,$62=0,$64=0,$65=0,$66=0,$67=0;
 var $68=0,$69=0,$70=0,$74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$87=0,$88=0,$89=0,$90=0,$91=0,$92=0;
 var $93=0,$94=0,$96=0,$97=0,$99=0,$100=0,$102=0,$103=0,$104=0,$107=0,$108=0,$109=0,$110=0,$111=0,$113=0,label=0;
 var sp=0;sp=STACKTOP;





 $2=$region;
 $3=$n;
 $4=$2;
 $5=(($4+16)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=($6|0)!=0;
 do {
  if ($7) {
   $37=$2;
   $38=(($37+16)|0);
   $39=((HEAP32[(($38)>>2)])|0);
   $40=(($39)|0);
   $41=((HEAP32[(($40)>>2)])|0);
   $42=($41|0)!=0;
   do {
    if ($42) {
     $61=$3;
     $62=($61|0)==1;
     if ($62) {
      $64=$2;
      $65=(($64+16)|0);
      $66=((HEAP32[(($65)>>2)])|0);
      $67=(($66+4)|0);
      $68=((HEAP32[(($67)>>2)])|0);
      $3=$68;
      $69=$3;
      $70=($69|0)>500;
      if ($70) {
       $3=250;
      }
     }
     $74=$2;
     $75=(($74+16)|0);
     $76=((HEAP32[(($75)>>2)])|0);
     $77=(($76+4)|0);
     $78=((HEAP32[(($77)>>2)])|0);
     $79=$3;
     $80=((($79)+($78))|0);
     $3=$80;
     $81=$3;
     $82=((_PIXREGION_SZOF($81))|0);
     $data_size=$82;
     $83=$data_size;
     $84=($83|0)!=0;
     if ($84) {
      $87=$2;
      $88=(($87+16)|0);
      $89=((HEAP32[(($88)>>2)])|0);
      $90=$89;
      $91=$3;
      $92=((_PIXREGION_SZOF($91))|0);
      $93=((_realloc($90,$92))|0);
      $94=$93;
      $data=$94;
     } else {
      $data=0;
     }
     $96=$data;
     $97=($96|0)!=0;
     if ($97) {
      $102=$data;
      $103=$2;
      $104=(($103+16)|0);
      HEAP32[(($104)>>2)]=$102;
      break;
     }
     $99=$2;
     $100=((_pixman_break($99))|0);
     $1=$100;
     $113=$1;
     STACKTOP=sp;return (($113)|0);
    } else {
     $44=$3;
     $45=((_alloc_data($44))|0);
     $46=$2;
     $47=(($46+16)|0);
     HEAP32[(($47)>>2)]=$45;
     $48=$2;
     $49=(($48+16)|0);
     $50=((HEAP32[(($49)>>2)])|0);
     $51=($50|0)!=0;
     if ($51) {
      $56=$2;
      $57=(($56+16)|0);
      $58=((HEAP32[(($57)>>2)])|0);
      $59=(($58+4)|0);
      HEAP32[(($59)>>2)]=0;
      break;
     }
     $53=$2;
     $54=((_pixman_break($53))|0);
     $1=$54;
     $113=$1;
     STACKTOP=sp;return (($113)|0);
    }
   } while(0);
  } else {
   $9=$3;
   $10=((($9)+(1))|0);
   $3=$10;
   $11=$3;
   $12=((_alloc_data($11))|0);
   $13=$2;
   $14=(($13+16)|0);
   HEAP32[(($14)>>2)]=$12;
   $15=$2;
   $16=(($15+16)|0);
   $17=((HEAP32[(($16)>>2)])|0);
   $18=($17|0)!=0;
   if ($18) {
    $23=$2;
    $24=(($23+16)|0);
    $25=((HEAP32[(($24)>>2)])|0);
    $26=(($25+4)|0);
    HEAP32[(($26)>>2)]=1;
    $27=$2;
    $28=(($27+16)|0);
    $29=((HEAP32[(($28)>>2)])|0);
    $30=(($29+8)|0);
    $31=$30;
    $32=$2;
    $33=(($32)|0);
    $34=$31;
    $35=$33;
    HEAP32[(($34)>>2)]=((HEAP32[(($35)>>2)])|0);HEAP32[((($34)+(4))>>2)]=((HEAP32[((($35)+(4))>>2)])|0);HEAP32[((($34)+(8))>>2)]=((HEAP32[((($35)+(8))>>2)])|0);HEAP32[((($34)+(12))>>2)]=((HEAP32[((($35)+(12))>>2)])|0);
    break;
   }
   $20=$2;
   $21=((_pixman_break($20))|0);
   $1=$21;
   $113=$1;
   STACKTOP=sp;return (($113)|0);
  }
 } while(0);
 $107=$3;
 $108=$2;
 $109=(($108+16)|0);
 $110=((HEAP32[(($109)>>2)])|0);
 $111=(($110)|0);
 HEAP32[(($111)>>2)]=$107;
 $1=1;
 $113=$1;
 STACKTOP=sp;return (($113)|0);
}


function _validate($badreg){
 $badreg=($badreg)|0;
 var $1=0,$2=0,$stack_regions=0,$numRects=0,$ri=0,$num_ri=0,$size_ri=0,$i=0,$j=0,$rit=0,$reg=0,$box=0,$ri_box=0,$hreg=0,$ret=0,$new_data=0,$data_size=0,$data_size1=0,$half=0,$3=0;
 var $4=0,$5=0,$6=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$21=0,$25=0,$26=0,$27=0,$28=0,$29=0;
 var $30=0,$31=0,$32=0,$33=0,$35=0,$36=0,$38=0,$39=0,$40=0,$41=0,$43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$50=0,$51=0,$52=0,$53=0;
 var $55=0,$56=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$66=0,$68=0,$69=0,$70=0,$71=0,$72=0,$73=0,$75=0,$76=0,$77=0,$78=0;
 var $81=0,$82=0,$83=0,$84=0,$85=0,$86=0,$87=0,$89=0,$90=0,$92=0,$93=0,$94=0,$95=0,$96=0,$97=0,$103=0,$104=0,$105=0,$106=0,$107=0;
 var $108=0,$109=0,$110=0,$111=0,$112=0,$113=0,$114=0,$115=0,$116=0,$117=0,$118=0,$119=0,$120=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0,$127=0;
 var $128=0,$129=0,$130=0,$131=0,$132=0,$133=0,$134=0,$135=0,$136=0,$137=0,$138=0,$139=0,$140=0,$141=0,$142=0,$143=0,$144=0,$145=0,$146=0,$147=0;
 var $148=0,$149=0,$150=0,$152=0,$153=0,$154=0,$156=0,$157=0,$158=0,$159=0,$161=0,$162=0,$163=0,$165=0,$166=0,$167=0,$168=0,$169=0,$170=0,$171=0;
 var $172=0,$173=0,$174=0,$175=0,$176=0,$177=0,$178=0,$179=0,$180=0,$181=0,$182=0,$183=0,$184=0,$185=0,$187=0,$188=0,$189=0,$190=0,$191=0,$192=0;
 var $193=0,$195=0,$196=0,$197=0,$198=0,$199=0,$200=0,$201=0,$203=0,$204=0,$205=0,$206=0,$207=0,$208=0,$209=0,$211=0,$212=0,$213=0,$214=0,$215=0;
 var $219=0,$220=0,$221=0,$222=0,$224=0,$225=0,$226=0,$227=0,$228=0,$229=0,$230=0,$231=0,$232=0,$233=0,$234=0,$235=0,$237=0,$238=0,$239=0,$244=0;
 var $245=0,$246=0,$247=0,$248=0,$249=0,$250=0,$251=0,$252=0,$253=0,$254=0,$255=0,$256=0,$257=0,$258=0,$259=0,$260=0,$261=0,$262=0,$263=0,$266=0;
 var $267=0,$268=0,$269=0,$270=0,$271=0,$272=0,$274=0,$275=0,$276=0,$277=0,$278=0,$279=0,$280=0,$281=0,$283=0,$284=0,$285=0,$286=0,$287=0,$288=0;
 var $290=0,$291=0,$292=0,$293=0,$294=0,$295=0,$296=0,$297=0,$299=0,$300=0,$301=0,$302=0,$303=0,$304=0,$307=0,$308=0,$309=0,$310=0,$311=0,$312=0;
 var $313=0,$314=0,$315=0,$316=0,$317=0,$318=0,$319=0,$320=0,$321=0,$322=0,$323=0,$325=0,$326=0,$327=0,$328=0,$329=0,$330=0,$331=0,$332=0,$333=0;
 var $334=0,$336=0,$337=0,$338=0,$339=0,$340=0,$343=0,$344=0,$345=0,$346=0,$347=0,$348=0,$349=0,$351=0,$352=0,$353=0,$354=0,$356=0,$357=0,$358=0;
 var $359=0,$360=0,$361=0,$362=0,$363=0,$364=0,$365=0,$366=0,$367=0,$369=0,$370=0,$371=0,$376=0,$377=0,$378=0,$379=0,$380=0,$381=0,$382=0,$383=0;
 var $384=0,$385=0,$386=0,$387=0,$388=0,$389=0,$390=0,$391=0,$392=0,$393=0,$394=0,$395=0,$399=0,$400=0,$402=0,$403=0,$404=0,$406=0,$407=0,$408=0;
 var $409=0,$410=0,$411=0,$412=0,$413=0,$416=0,$417=0,$418=0,$420=0,$421=0,$422=0,$423=0,$424=0,$427=0,$428=0,$429=0,$430=0,$431=0,$432=0,$434=0;
 var $435=0,$436=0,$437=0,$438=0,$439=0,$440=0,$444=0,$445=0,$446=0,$447=0,$449=0,$450=0,$451=0,$452=0,$453=0,$454=0,$455=0,$456=0,$457=0,$458=0;
 var $459=0,$460=0,$461=0,$462=0,$463=0,$464=0,$465=0,$466=0,$467=0,$468=0,$469=0,$470=0,$471=0,$472=0,$477=0,$478=0,$480=0,$481=0,$482=0,$484=0;
 var $485=0,$486=0,$487=0,$488=0,$489=0,$490=0,$491=0,$492=0,$493=0,$494=0,$495=0,$496=0,$497=0,$498=0,$499=0,$500=0,$501=0,$502=0,$503=0,$504=0;
 var $505=0,$506=0,$507=0,$508=0,$509=0,$510=0,$511=0,$513=0,$514=0,$515=0,$516=0,$517=0,$518=0,$521=0,$522=0,$523=0,$524=0,$525=0,$526=0,$527=0;
 var $528=0,$529=0,$530=0,$531=0,$532=0,$533=0,$534=0,$535=0,$536=0,$537=0,$539=0,$540=0,$541=0,$542=0,$543=0,$544=0,$545=0,$546=0,$547=0,$548=0;
 var $550=0,$551=0,$552=0,$553=0,$554=0,$557=0,$558=0,$559=0,$560=0,$561=0,$562=0,$564=0,$565=0,$566=0,$567=0,$569=0,$570=0,$571=0,$572=0,$573=0;
 var $574=0,$576=0,$577=0,$578=0,$579=0,$581=0,$582=0,$585=0,$586=0,$589=0,$590=0,$592=0,$593=0,$594=0,$595=0,$597=0,$598=0,$599=0,$600=0,$601=0;
 var $602=0,$604=0,$605=0,$606=0,$607=0,$608=0,$609=0,$610=0,$611=0,$612=0,$613=0,$614=0,$615=0,$616=0,$617=0,$618=0,$621=0,$622=0,$623=0,$624=0;
 var $625=0,$626=0,$627=0,$628=0,$629=0,$631=0,$632=0,$633=0,$634=0,$635=0,$636=0,$637=0,$639=0,$640=0,$641=0,$642=0,$643=0,$644=0,$645=0,$646=0;
 var $647=0,$649=0,$650=0,$651=0,$652=0,$653=0,$654=0,$655=0,$657=0,$658=0,$659=0,$660=0,$661=0,$662=0,$663=0,$664=0,$665=0,$667=0,$668=0,$669=0;
 var $670=0,$671=0,$672=0,$673=0,$675=0,$676=0,$677=0,$678=0,$679=0,$680=0,$681=0,$682=0,$683=0,$685=0,$686=0,$687=0,$688=0,$689=0,$690=0,$691=0;
 var $693=0,$694=0,$695=0,$696=0,$698=0,$699=0,$700=0,$701=0,$702=0,$703=0,$705=0,$706=0,$707=0,$708=0,$711=0,$712=0,$714=0,$715=0,$716=0,$717=0;
 var $718=0,$722=0,$723=0,$724=0,$725=0,$726=0,$727=0,$728=0,$729=0,$730=0,$732=0,$733=0,$735=0,$738=0,$739=0,$740=0,$742=0,$743=0,$744=0,$745=0;
 var $746=0,$747=0,$748=0,$750=0,$751=0,$752=0,$753=0,$754=0,$755=0,$756=0,$757=0,$758=0,$760=0,$761=0,$762=0,$763=0,$764=0,$765=0,$766=0,$769=0;
 var $770=0,$772=0,$773=0,$774=0,$776=0,$777=0,$779=0,$780=0,$782=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+1792)|0;


 $stack_regions=((sp)|0);
















 $2=$badreg;
 $ret=1;
 $3=$2;
 $4=(($3+16)|0);
 $5=((HEAP32[(($4)>>2)])|0);
 $6=($5|0)!=0;
 if (!($6)) {
  $1=1;
  $782=$1;
  STACKTOP=sp;return (($782)|0);
 }
 $9=$2;
 $10=(($9+16)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $12=(($11+4)|0);
 $13=((HEAP32[(($12)>>2)])|0);
 $numRects=$13;
 $14=$numRects;
 $15=($14|0)!=0;
 if (!($15)) {
  $17=$2;
  $18=(($17+16)|0);
  $19=((HEAP32[(($18)>>2)])|0);
  $20=((HEAP32[((24)>>2)])|0);
  $21=($19|0)==($20|0);
  if ($21) {
   $1=0;
   $782=$1;
   STACKTOP=sp;return (($782)|0);
  } else {
   $1=1;
   $782=$1;
   STACKTOP=sp;return (($782)|0);
  }
 }
 $25=$2;
 $26=(($25)|0);
 $27=(($26)|0);
 $28=((HEAP32[(($27)>>2)])|0);
 $29=$2;
 $30=(($29)|0);
 $31=(($30+8)|0);
 $32=((HEAP32[(($31)>>2)])|0);
 $33=($28|0)<($32|0);
 if ($33) {
  $35=$numRects;
  $36=($35|0)==1;
  if ($36) {
   $38=$2;
   $39=(($38+16)|0);
   $40=((HEAP32[(($39)>>2)])|0);
   $41=($40|0)!=0;
   if ($41) {
    $43=$2;
    $44=(($43+16)|0);
    $45=((HEAP32[(($44)>>2)])|0);
    $46=(($45)|0);
    $47=((HEAP32[(($46)>>2)])|0);
    $48=($47|0)!=0;
    if ($48) {
     $50=$2;
     $51=(($50+16)|0);
     $52=((HEAP32[(($51)>>2)])|0);
     $53=$52;
     _free($53);
    }
   }
   $55=$2;
   $56=(($55+16)|0);
   HEAP32[(($56)>>2)]=0;
  } else {
   $59=$numRects;
   $60=$2;
   $61=(($60+16)|0);
   $62=((HEAP32[(($61)>>2)])|0);
   $63=(($62)|0);
   $64=((HEAP32[(($63)>>2)])|0);
   $65=$64>>1;
   $66=($59|0)<($65|0);
   if ($66) {
    $68=$2;
    $69=(($68+16)|0);
    $70=((HEAP32[(($69)>>2)])|0);
    $71=(($70)|0);
    $72=((HEAP32[(($71)>>2)])|0);
    $73=($72|0)>50;
    if ($73) {
     $75=$numRects;
     $76=((_PIXREGION_SZOF($75))|0);
     $data_size=$76;
     $77=$data_size;
     $78=($77|0)!=0;
     if ($78) {
      $81=$2;
      $82=(($81+16)|0);
      $83=((HEAP32[(($82)>>2)])|0);
      $84=$83;
      $85=$data_size;
      $86=((_realloc($84,$85))|0);
      $87=$86;
      $new_data=$87;
     } else {
      $new_data=0;
     }
     $89=$new_data;
     $90=($89|0)!=0;
     if ($90) {
      $92=$numRects;
      $93=$new_data;
      $94=(($93)|0);
      HEAP32[(($94)>>2)]=$92;
      $95=$new_data;
      $96=$2;
      $97=(($96+16)|0);
      HEAP32[(($97)>>2)]=$95;
     }
    }
   }
  }
  $1=1;
  $782=$1;
  STACKTOP=sp;return (($782)|0);
 }
 $103=$2;
 $104=(($103+16)|0);
 $105=((HEAP32[(($104)>>2)])|0);
 $106=(($105+8)|0);
 $107=$106;
 $108=$numRects;
 _quick_sort_rects($107,$108);
 $109=(($stack_regions)|0);
 $ri=$109;
 $size_ri=64;
 $num_ri=1;
 $110=$ri;
 $111=(($110)|0);
 $112=(($111+20)|0);
 HEAP32[(($112)>>2)]=0;
 $113=$ri;
 $114=(($113)|0);
 $115=(($114+24)|0);
 HEAP32[(($115)>>2)]=0;
 $116=$ri;
 $117=(($116)|0);
 $118=(($117)|0);
 $119=$2;
 $120=$118;
 $121=$119;
 HEAP32[(($120)>>2)]=((HEAP32[(($121)>>2)])|0);HEAP32[((($120)+(4))>>2)]=((HEAP32[((($121)+(4))>>2)])|0);HEAP32[((($120)+(8))>>2)]=((HEAP32[((($121)+(8))>>2)])|0);HEAP32[((($120)+(12))>>2)]=((HEAP32[((($121)+(12))>>2)])|0);HEAP32[((($120)+(16))>>2)]=((HEAP32[((($121)+(16))>>2)])|0);
 $122=$ri;
 $123=(($122)|0);
 $124=(($123)|0);
 $125=(($124+16)|0);
 $126=((HEAP32[(($125)>>2)])|0);
 $127=(($126+8)|0);
 $128=$127;
 $box=$128;
 $129=$ri;
 $130=(($129)|0);
 $131=(($130)|0);
 $132=(($131)|0);
 $133=$box;
 $134=$132;
 $135=$133;
 HEAP32[(($134)>>2)]=((HEAP32[(($135)>>2)])|0);HEAP32[((($134)+(4))>>2)]=((HEAP32[((($135)+(4))>>2)])|0);HEAP32[((($134)+(8))>>2)]=((HEAP32[((($135)+(8))>>2)])|0);HEAP32[((($134)+(12))>>2)]=((HEAP32[((($135)+(12))>>2)])|0);
 $136=$ri;
 $137=(($136)|0);
 $138=(($137)|0);
 $139=(($138+16)|0);
 $140=((HEAP32[(($139)>>2)])|0);
 $141=(($140+4)|0);
 HEAP32[(($141)>>2)]=1;
 $142=$2;
 $143=(($142)|0);
 $144=((HEAP32[((16)>>2)])|0);
 $145=$143;
 $146=$144;
 HEAP32[(($145)>>2)]=((HEAP32[(($146)>>2)])|0);HEAP32[((($145)+(4))>>2)]=((HEAP32[((($146)+(4))>>2)])|0);HEAP32[((($145)+(8))>>2)]=((HEAP32[((($146)+(8))>>2)])|0);HEAP32[((($145)+(12))>>2)]=((HEAP32[((($146)+(12))>>2)])|0);
 $147=((HEAP32[((8)>>2)])|0);
 $148=$2;
 $149=(($148+16)|0);
 HEAP32[(($149)>>2)]=$147;
 $150=$numRects;
 $i=$150;
 while(1) {
  $152=$i;
  $153=((($152)-(1))|0);
  $i=$153;
  $154=($153|0)>0;
  if (!($154)) {
   label = 80;
   break;
  }
  $156=$box;
  $157=(($156+16)|0);
  $box=$157;
  $158=$num_ri;
  $j=$158;
  $159=$ri;
  $rit=$159;
  while(1) {
   $161=$j;
   $162=((($161)-(1))|0);
   $j=$162;
   $163=($162|0)>=0;
   if (!($163)) {
    label = 65;
    break;
   }
   $165=$rit;
   $166=(($165)|0);
   $reg=$166;
   $167=$reg;
   $168=(($167+16)|0);
   $169=((HEAP32[(($168)>>2)])|0);
   $170=(($169+4)|0);
   $171=((HEAP32[(($170)>>2)])|0);
   $172=((($171)-(1))|0);
   $173=$reg;
   $174=(($173+16)|0);
   $175=((HEAP32[(($174)>>2)])|0);
   $176=(($175+8)|0);
   $177=$176;
   $178=(($177+($172<<4))|0);
   $ri_box=$178;
   $179=$box;
   $180=(($179+4)|0);
   $181=((HEAP32[(($180)>>2)])|0);
   $182=$ri_box;
   $183=(($182+4)|0);
   $184=((HEAP32[(($183)>>2)])|0);
   $185=($181|0)==($184|0);
   if ($185) {
    $187=$box;
    $188=(($187+12)|0);
    $189=((HEAP32[(($188)>>2)])|0);
    $190=$ri_box;
    $191=(($190+12)|0);
    $192=((HEAP32[(($191)>>2)])|0);
    $193=($189|0)==($192|0);
    if ($193) {
     label = 31;
     break;
    }
   }
   $266=$box;
   $267=(($266+4)|0);
   $268=((HEAP32[(($267)>>2)])|0);
   $269=$ri_box;
   $270=(($269+12)|0);
   $271=((HEAP32[(($270)>>2)])|0);
   $272=($268|0)>=($271|0);
   if ($272) {
    label = 45;
    break;
   }
   $399=$rit;
   $400=(($399+28)|0);
   $rit=$400;
  }
  if ((label|0) == 31) {
   label = 0;
   $195=$box;
   $196=(($195)|0);
   $197=((HEAP32[(($196)>>2)])|0);
   $198=$ri_box;
   $199=(($198+8)|0);
   $200=((HEAP32[(($199)>>2)])|0);
   $201=($197|0)<=($200|0);
   if ($201) {
    $203=$box;
    $204=(($203+8)|0);
    $205=((HEAP32[(($204)>>2)])|0);
    $206=$ri_box;
    $207=(($206+8)|0);
    $208=((HEAP32[(($207)>>2)])|0);
    $209=($205|0)>($208|0);
    if ($209) {
     $211=$box;
     $212=(($211+8)|0);
     $213=((HEAP32[(($212)>>2)])|0);
     $214=$ri_box;
     $215=(($214+8)|0);
     HEAP32[(($215)>>2)]=$213;
    }
   } else {
    $219=$reg;
    $220=(($219+16)|0);
    $221=((HEAP32[(($220)>>2)])|0);
    $222=($221|0)!=0;
    if ($222) {
     $224=$reg;
     $225=(($224+16)|0);
     $226=((HEAP32[(($225)>>2)])|0);
     $227=(($226+4)|0);
     $228=((HEAP32[(($227)>>2)])|0);
     $229=((($228)+(1))|0);
     $230=$reg;
     $231=(($230+16)|0);
     $232=((HEAP32[(($231)>>2)])|0);
     $233=(($232)|0);
     $234=((HEAP32[(($233)>>2)])|0);
     $235=($229|0)>($234|0);
     if ($235) {
      label = 38;
     }
    } else {
     label = 38;
    }
    if ((label|0) == 38) {
     label = 0;
     $237=$reg;
     $238=((_pixman_rect_alloc($237,1))|0);
     $239=($238|0)!=0;
     if (!($239)) {
      label = 39;
      break;
     }
    }
    $244=$reg;
    $245=(($244+16)|0);
    $246=((HEAP32[(($245)>>2)])|0);
    $247=(($246+4)|0);
    $248=((HEAP32[(($247)>>2)])|0);
    $249=$reg;
    $250=(($249+16)|0);
    $251=((HEAP32[(($250)>>2)])|0);
    $252=(($251+8)|0);
    $253=$252;
    $254=(($253+($248<<4))|0);
    $255=$box;
    $256=$254;
    $257=$255;
    HEAP32[(($256)>>2)]=((HEAP32[(($257)>>2)])|0);HEAP32[((($256)+(4))>>2)]=((HEAP32[((($257)+(4))>>2)])|0);HEAP32[((($256)+(8))>>2)]=((HEAP32[((($257)+(8))>>2)])|0);HEAP32[((($256)+(12))>>2)]=((HEAP32[((($257)+(12))>>2)])|0);
    $258=$reg;
    $259=(($258+16)|0);
    $260=((HEAP32[(($259)>>2)])|0);
    $261=(($260+4)|0);
    $262=((HEAP32[(($261)>>2)])|0);
    $263=((($262)+(1))|0);
    HEAP32[(($261)>>2)]=$263;
   }
  }
  else if ((label|0) == 45) {
   label = 0;
   $274=$reg;
   $275=(($274)|0);
   $276=(($275+8)|0);
   $277=((HEAP32[(($276)>>2)])|0);
   $278=$ri_box;
   $279=(($278+8)|0);
   $280=((HEAP32[(($279)>>2)])|0);
   $281=($277|0)<($280|0);
   if ($281) {
    $283=$ri_box;
    $284=(($283+8)|0);
    $285=((HEAP32[(($284)>>2)])|0);
    $286=$reg;
    $287=(($286)|0);
    $288=(($287+8)|0);
    HEAP32[(($288)>>2)]=$285;
   }
   $290=$reg;
   $291=(($290)|0);
   $292=(($291)|0);
   $293=((HEAP32[(($292)>>2)])|0);
   $294=$box;
   $295=(($294)|0);
   $296=((HEAP32[(($295)>>2)])|0);
   $297=($293|0)>($296|0);
   if ($297) {
    $299=$box;
    $300=(($299)|0);
    $301=((HEAP32[(($300)>>2)])|0);
    $302=$reg;
    $303=(($302)|0);
    $304=(($303)|0);
    HEAP32[(($304)>>2)]=$301;
   }
   $307=$rit;
   $308=(($307+24)|0);
   $309=((HEAP32[(($308)>>2)])|0);
   $310=$rit;
   $311=(($310+20)|0);
   $312=((HEAP32[(($311)>>2)])|0);
   $313=((($309)-($312))|0);
   $314=$reg;
   $315=(($314+16)|0);
   $316=((HEAP32[(($315)>>2)])|0);
   $317=(($316+4)|0);
   $318=((HEAP32[(($317)>>2)])|0);
   $319=$rit;
   $320=(($319+24)|0);
   $321=((HEAP32[(($320)>>2)])|0);
   $322=((($318)-($321))|0);
   $323=($313|0)==($322|0);
   if ($323) {
    $325=$reg;
    $326=$rit;
    $327=(($326+20)|0);
    $328=((HEAP32[(($327)>>2)])|0);
    $329=$rit;
    $330=(($329+24)|0);
    $331=((HEAP32[(($330)>>2)])|0);
    $332=((_pixman_coalesce($325,$328,$331))|0);
    $333=$rit;
    $334=(($333+20)|0);
    HEAP32[(($334)>>2)]=$332;
   } else {
    $336=$rit;
    $337=(($336+24)|0);
    $338=((HEAP32[(($337)>>2)])|0);
    $339=$rit;
    $340=(($339+20)|0);
    HEAP32[(($340)>>2)]=$338;
   }
   $343=$reg;
   $344=(($343+16)|0);
   $345=((HEAP32[(($344)>>2)])|0);
   $346=(($345+4)|0);
   $347=((HEAP32[(($346)>>2)])|0);
   $348=$rit;
   $349=(($348+24)|0);
   HEAP32[(($349)>>2)]=$347;
   $351=$reg;
   $352=(($351+16)|0);
   $353=((HEAP32[(($352)>>2)])|0);
   $354=($353|0)!=0;
   if ($354) {
    $356=$reg;
    $357=(($356+16)|0);
    $358=((HEAP32[(($357)>>2)])|0);
    $359=(($358+4)|0);
    $360=((HEAP32[(($359)>>2)])|0);
    $361=((($360)+(1))|0);
    $362=$reg;
    $363=(($362+16)|0);
    $364=((HEAP32[(($363)>>2)])|0);
    $365=(($364)|0);
    $366=((HEAP32[(($365)>>2)])|0);
    $367=($361|0)>($366|0);
    if ($367) {
     label = 57;
    }
   } else {
    label = 57;
   }
   if ((label|0) == 57) {
    label = 0;
    $369=$reg;
    $370=((_pixman_rect_alloc($369,1))|0);
    $371=($370|0)!=0;
    if (!($371)) {
     label = 58;
     break;
    }
   }
   $376=$reg;
   $377=(($376+16)|0);
   $378=((HEAP32[(($377)>>2)])|0);
   $379=(($378+4)|0);
   $380=((HEAP32[(($379)>>2)])|0);
   $381=$reg;
   $382=(($381+16)|0);
   $383=((HEAP32[(($382)>>2)])|0);
   $384=(($383+8)|0);
   $385=$384;
   $386=(($385+($380<<4))|0);
   $387=$box;
   $388=$386;
   $389=$387;
   HEAP32[(($388)>>2)]=((HEAP32[(($389)>>2)])|0);HEAP32[((($388)+(4))>>2)]=((HEAP32[((($389)+(4))>>2)])|0);HEAP32[((($388)+(8))>>2)]=((HEAP32[((($389)+(8))>>2)])|0);HEAP32[((($388)+(12))>>2)]=((HEAP32[((($389)+(12))>>2)])|0);
   $390=$reg;
   $391=(($390+16)|0);
   $392=((HEAP32[(($391)>>2)])|0);
   $393=(($392+4)|0);
   $394=((HEAP32[(($393)>>2)])|0);
   $395=((($394)+(1))|0);
   HEAP32[(($393)>>2)]=$395;
  }
  else if ((label|0) == 65) {
   label = 0;
   $402=$size_ri;
   $403=$num_ri;
   $404=($402|0)==($403|0);
   if ($404) {
    $406=$size_ri;
    $407=$406<<1;
    $size_ri=$407;
    $408=$size_ri;
    $409=((($408)*(28))&-1);
    $data_size1=$409;
    $410=$data_size1;
    $411=$size_ri;
    $412=(((($410>>>0))/(($411>>>0)))&-1);
    $413=($412|0)!=28;
    if ($413) {
     label = 67;
     break;
    }
    $416=$ri;
    $417=(($stack_regions)|0);
    $418=($416|0)==($417|0);
    if ($418) {
     $420=$data_size1;
     $421=((_malloc($420))|0);
     $422=$421;
     $rit=$422;
     $423=$rit;
     $424=($423|0)!=0;
     if (!($424)) {
      label = 70;
      break;
     }
     $427=$rit;
     $428=$427;
     $429=$ri;
     $430=$429;
     $431=$num_ri;
     $432=((($431)*(28))&-1);
     (_memcpy((($428)|0), (($430)|0), $432)|0);
    } else {
     $434=$ri;
     $435=$434;
     $436=$data_size1;
     $437=((_realloc($435,$436))|0);
     $438=$437;
     $rit=$438;
     $439=$rit;
     $440=($439|0)!=0;
     if (!($440)) {
      label = 73;
      break;
     }
    }
    $444=$rit;
    $ri=$444;
    $445=$num_ri;
    $446=$ri;
    $447=(($446+((($445)*(28))&-1))|0);
    $rit=$447;
   }
   $449=$num_ri;
   $450=((($449)+(1))|0);
   $num_ri=$450;
   $451=$rit;
   $452=(($451+20)|0);
   HEAP32[(($452)>>2)]=0;
   $453=$rit;
   $454=(($453+24)|0);
   HEAP32[(($454)>>2)]=0;
   $455=$rit;
   $456=(($455)|0);
   $457=(($456)|0);
   $458=$box;
   $459=$457;
   $460=$458;
   HEAP32[(($459)>>2)]=((HEAP32[(($460)>>2)])|0);HEAP32[((($459)+(4))>>2)]=((HEAP32[((($460)+(4))>>2)])|0);HEAP32[((($459)+(8))>>2)]=((HEAP32[((($460)+(8))>>2)])|0);HEAP32[((($459)+(12))>>2)]=((HEAP32[((($460)+(12))>>2)])|0);
   $461=$rit;
   $462=(($461)|0);
   $463=(($462+16)|0);
   HEAP32[(($463)>>2)]=0;
   $464=$rit;
   $465=(($464)|0);
   $466=$i;
   $467=$num_ri;
   $468=((($466)+($467))|0);
   $469=$num_ri;
   $470=(((($468|0))/(($469|0)))&-1);
   $471=((_pixman_rect_alloc($465,$470))|0);
   $472=($471|0)!=0;
   if (!($472)) {
    label = 77;
    break;
   }
  }
 }
 do {
  if ((label|0) == 39) {
  }
  else if ((label|0) == 58) {
  }
  else if ((label|0) == 67) {
  }
  else if ((label|0) == 70) {
  }
  else if ((label|0) == 73) {
  }
  else if ((label|0) == 77) {
  }
  else if ((label|0) == 80) {
   $477=$num_ri;
   $j=$477;
   $478=$ri;
   $rit=$478;
   while(1) {
    $480=$j;
    $481=((($480)-(1))|0);
    $j=$481;
    $482=($481|0)>=0;
    if (!($482)) {
     break;
    }
    $484=$rit;
    $485=(($484)|0);
    $reg=$485;
    $486=$reg;
    $487=(($486+16)|0);
    $488=((HEAP32[(($487)>>2)])|0);
    $489=(($488+4)|0);
    $490=((HEAP32[(($489)>>2)])|0);
    $491=((($490)-(1))|0);
    $492=$reg;
    $493=(($492+16)|0);
    $494=((HEAP32[(($493)>>2)])|0);
    $495=(($494+8)|0);
    $496=$495;
    $497=(($496+($491<<4))|0);
    $ri_box=$497;
    $498=$ri_box;
    $499=(($498+12)|0);
    $500=((HEAP32[(($499)>>2)])|0);
    $501=$reg;
    $502=(($501)|0);
    $503=(($502+12)|0);
    HEAP32[(($503)>>2)]=$500;
    $504=$reg;
    $505=(($504)|0);
    $506=(($505+8)|0);
    $507=((HEAP32[(($506)>>2)])|0);
    $508=$ri_box;
    $509=(($508+8)|0);
    $510=((HEAP32[(($509)>>2)])|0);
    $511=($507|0)<($510|0);
    if ($511) {
     $513=$ri_box;
     $514=(($513+8)|0);
     $515=((HEAP32[(($514)>>2)])|0);
     $516=$reg;
     $517=(($516)|0);
     $518=(($517+8)|0);
     HEAP32[(($518)>>2)]=$515;
    }
    $521=$rit;
    $522=(($521+24)|0);
    $523=((HEAP32[(($522)>>2)])|0);
    $524=$rit;
    $525=(($524+20)|0);
    $526=((HEAP32[(($525)>>2)])|0);
    $527=((($523)-($526))|0);
    $528=$reg;
    $529=(($528+16)|0);
    $530=((HEAP32[(($529)>>2)])|0);
    $531=(($530+4)|0);
    $532=((HEAP32[(($531)>>2)])|0);
    $533=$rit;
    $534=(($533+24)|0);
    $535=((HEAP32[(($534)>>2)])|0);
    $536=((($532)-($535))|0);
    $537=($527|0)==($536|0);
    if ($537) {
     $539=$reg;
     $540=$rit;
     $541=(($540+20)|0);
     $542=((HEAP32[(($541)>>2)])|0);
     $543=$rit;
     $544=(($543+24)|0);
     $545=((HEAP32[(($544)>>2)])|0);
     $546=((_pixman_coalesce($539,$542,$545))|0);
     $547=$rit;
     $548=(($547+20)|0);
     HEAP32[(($548)>>2)]=$546;
    } else {
     $550=$rit;
     $551=(($550+24)|0);
     $552=((HEAP32[(($551)>>2)])|0);
     $553=$rit;
     $554=(($553+20)|0);
     HEAP32[(($554)>>2)]=$552;
    }
    $557=$reg;
    $558=(($557+16)|0);
    $559=((HEAP32[(($558)>>2)])|0);
    $560=(($559+4)|0);
    $561=((HEAP32[(($560)>>2)])|0);
    $562=($561|0)==1;
    if ($562) {
     $564=$reg;
     $565=(($564+16)|0);
     $566=((HEAP32[(($565)>>2)])|0);
     $567=($566|0)!=0;
     if ($567) {
      $569=$reg;
      $570=(($569+16)|0);
      $571=((HEAP32[(($570)>>2)])|0);
      $572=(($571)|0);
      $573=((HEAP32[(($572)>>2)])|0);
      $574=($573|0)!=0;
      if ($574) {
       $576=$reg;
       $577=(($576+16)|0);
       $578=((HEAP32[(($577)>>2)])|0);
       $579=$578;
       _free($579);
      }
     }
     $581=$reg;
     $582=(($581+16)|0);
     HEAP32[(($582)>>2)]=0;
    }
    $585=$rit;
    $586=(($585+28)|0);
    $rit=$586;
   }
   while(1) {
    $589=$num_ri;
    $590=($589|0)>1;
    if (!($590)) {
     break;
    }
    $592=$num_ri;
    $593=(((($592|0))/(2))&-1);
    $half=$593;
    $594=$num_ri;
    $595=$594&1;
    $j=$595;
    while(1) {
     $597=$j;
     $598=$half;
     $599=$num_ri;
     $600=$599&1;
     $601=((($598)+($600))|0);
     $602=($597|0)<($601|0);
     if (!($602)) {
      break;
     }
     $604=$j;
     $605=$ri;
     $606=(($605+((($604)*(28))&-1))|0);
     $607=(($606)|0);
     $reg=$607;
     $608=$j;
     $609=$half;
     $610=((($608)+($609))|0);
     $611=$ri;
     $612=(($611+((($610)*(28))&-1))|0);
     $613=(($612)|0);
     $hreg=$613;
     $614=$reg;
     $615=$reg;
     $616=$hreg;
     $617=((_pixman_op($614,$615,$616,6,1,1))|0);
     $618=($617|0)!=0;
     if (!($618)) {
      $ret=0;
     }
     $621=$hreg;
     $622=(($621)|0);
     $623=(($622)|0);
     $624=((HEAP32[(($623)>>2)])|0);
     $625=$reg;
     $626=(($625)|0);
     $627=(($626)|0);
     $628=((HEAP32[(($627)>>2)])|0);
     $629=($624|0)<($628|0);
     if ($629) {
      $631=$hreg;
      $632=(($631)|0);
      $633=(($632)|0);
      $634=((HEAP32[(($633)>>2)])|0);
      $635=$reg;
      $636=(($635)|0);
      $637=(($636)|0);
      HEAP32[(($637)>>2)]=$634;
     }
     $639=$hreg;
     $640=(($639)|0);
     $641=(($640+4)|0);
     $642=((HEAP32[(($641)>>2)])|0);
     $643=$reg;
     $644=(($643)|0);
     $645=(($644+4)|0);
     $646=((HEAP32[(($645)>>2)])|0);
     $647=($642|0)<($646|0);
     if ($647) {
      $649=$hreg;
      $650=(($649)|0);
      $651=(($650+4)|0);
      $652=((HEAP32[(($651)>>2)])|0);
      $653=$reg;
      $654=(($653)|0);
      $655=(($654+4)|0);
      HEAP32[(($655)>>2)]=$652;
     }
     $657=$hreg;
     $658=(($657)|0);
     $659=(($658+8)|0);
     $660=((HEAP32[(($659)>>2)])|0);
     $661=$reg;
     $662=(($661)|0);
     $663=(($662+8)|0);
     $664=((HEAP32[(($663)>>2)])|0);
     $665=($660|0)>($664|0);
     if ($665) {
      $667=$hreg;
      $668=(($667)|0);
      $669=(($668+8)|0);
      $670=((HEAP32[(($669)>>2)])|0);
      $671=$reg;
      $672=(($671)|0);
      $673=(($672+8)|0);
      HEAP32[(($673)>>2)]=$670;
     }
     $675=$hreg;
     $676=(($675)|0);
     $677=(($676+12)|0);
     $678=((HEAP32[(($677)>>2)])|0);
     $679=$reg;
     $680=(($679)|0);
     $681=(($680+12)|0);
     $682=((HEAP32[(($681)>>2)])|0);
     $683=($678|0)>($682|0);
     if ($683) {
      $685=$hreg;
      $686=(($685)|0);
      $687=(($686+12)|0);
      $688=((HEAP32[(($687)>>2)])|0);
      $689=$reg;
      $690=(($689)|0);
      $691=(($690+12)|0);
      HEAP32[(($691)>>2)]=$688;
     }
     $693=$hreg;
     $694=(($693+16)|0);
     $695=((HEAP32[(($694)>>2)])|0);
     $696=($695|0)!=0;
     if ($696) {
      $698=$hreg;
      $699=(($698+16)|0);
      $700=((HEAP32[(($699)>>2)])|0);
      $701=(($700)|0);
      $702=((HEAP32[(($701)>>2)])|0);
      $703=($702|0)!=0;
      if ($703) {
       $705=$hreg;
       $706=(($705+16)|0);
       $707=((HEAP32[(($706)>>2)])|0);
       $708=$707;
       _free($708);
      }
     }
     $711=$j;
     $712=((($711)+(1))|0);
     $j=$712;
    }
    $714=$half;
    $715=$num_ri;
    $716=((($715)-($714))|0);
    $num_ri=$716;
    $717=$ret;
    $718=($717|0)!=0;
    if (!($718)) {
     label = 116;
     break;
    }
   }
   if ((label|0) == 116) {
    break;
   }
   $722=$2;
   $723=$ri;
   $724=(($723)|0);
   $725=(($724)|0);
   $726=$722;
   $727=$725;
   HEAP32[(($726)>>2)]=((HEAP32[(($727)>>2)])|0);HEAP32[((($726)+(4))>>2)]=((HEAP32[((($727)+(4))>>2)])|0);HEAP32[((($726)+(8))>>2)]=((HEAP32[((($727)+(8))>>2)])|0);HEAP32[((($726)+(12))>>2)]=((HEAP32[((($727)+(12))>>2)])|0);HEAP32[((($726)+(16))>>2)]=((HEAP32[((($727)+(16))>>2)])|0);
   $728=$ri;
   $729=(($stack_regions)|0);
   $730=($728|0)!=($729|0);
   if ($730) {
    $732=$ri;
    $733=$732;
    _free($733);
   }
   $735=$ret;
   $1=$735;
   $782=$1;
   STACKTOP=sp;return (($782)|0);
  }
 } while(0);
 $i=0;
 while(1) {
  $738=$i;
  $739=$num_ri;
  $740=($738|0)<($739|0);
  if (!($740)) {
   break;
  }
  $742=$i;
  $743=$ri;
  $744=(($743+((($742)*(28))&-1))|0);
  $745=(($744)|0);
  $746=(($745+16)|0);
  $747=((HEAP32[(($746)>>2)])|0);
  $748=($747|0)!=0;
  if ($748) {
   $750=$i;
   $751=$ri;
   $752=(($751+((($750)*(28))&-1))|0);
   $753=(($752)|0);
   $754=(($753+16)|0);
   $755=((HEAP32[(($754)>>2)])|0);
   $756=(($755)|0);
   $757=((HEAP32[(($756)>>2)])|0);
   $758=($757|0)!=0;
   if ($758) {
    $760=$i;
    $761=$ri;
    $762=(($761+((($760)*(28))&-1))|0);
    $763=(($762)|0);
    $764=(($763+16)|0);
    $765=((HEAP32[(($764)>>2)])|0);
    $766=$765;
    _free($766);
   }
  }
  $769=$i;
  $770=((($769)+(1))|0);
  $i=$770;
 }
 $772=$ri;
 $773=(($stack_regions)|0);
 $774=($772|0)!=($773|0);
 if ($774) {
  $776=$ri;
  $777=$776;
  _free($777);
 }
 $779=$2;
 $780=((_pixman_break($779))|0);
 $1=$780;
 $782=$1;
 STACKTOP=sp;return (($782)|0);
}


function _PIXREGION_SZOF($n){
 $n=($n)|0;
 var $1=0,$2=0,$size=0,$3=0,$4=0,$5=0,$6=0,$9=0,$10=0,$11=0,$14=0,$15=0,$17=0,label=0;
 var sp=0;sp=STACKTOP;



 $2=$n;
 $3=$2;
 $4=($3<<4);
 $size=$4;
 $5=$2;
 $6=($5>>>0)>((268435455)>>>0);
 do {
  if ($6) {
   $1=0;
  } else {
   $9=$size;
   $10=(((-1)-($9))|0);
   $11=((8)>>>0)>($10>>>0);
   if ($11) {
    $1=0;
    break;
   } else {
    $14=$size;
    $15=((($14)+(8))|0);
    $1=$15;
    break;
   }
  }
 } while(0);
 $17=$1;
 STACKTOP=sp;return (($17)|0);
}


function _quick_sort_rects($rects,$numRects){
 $rects=($rects)|0;
 $numRects=($numRects)|0;
 var $1=0,$2=0,$y1=0,$x1=0,$i=0,$j=0,$r=0,$t=0,$t1=0,$t2=0,$t3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0;
 var $14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$21=0,$22=0,$23=0,$24=0,$25=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0;
 var $37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$53=0,$54=0,$55=0,$56=0,$57=0,$58=0;
 var $59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0,$71=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$78=0;
 var $79=0,$81=0,$82=0,$83=0,$85=0,$86=0,$87=0,$88=0,$90=0,$91=0,$92=0,$94=0,$95=0,$96=0,$97=0,$98=0,$100=0,$101=0,$102=0,$103=0;
 var $104=0,$106=0,$107=0,$108=0,$109=0,$110=0,$112=0,$114=0,$116=0,$118=0,$119=0,$120=0,$122=0,$123=0,$124=0,$125=0,$127=0,$128=0,$129=0,$130=0;
 var $131=0,$133=0,$134=0,$135=0,$136=0,$137=0,$139=0,$140=0,$141=0,$142=0,$143=0,$145=0,$147=0,$149=0,$150=0,$151=0,$153=0,$154=0,$155=0,$156=0;
 var $157=0,$158=0,$159=0,$160=0,$161=0,$162=0,$163=0,$164=0,$165=0,$166=0,$167=0,$168=0,$169=0,$170=0,$173=0,$174=0,$175=0,$177=0,$178=0,$179=0;
 var $180=0,$181=0,$182=0,$183=0,$184=0,$185=0,$186=0,$187=0,$188=0,$189=0,$190=0,$191=0,$192=0,$193=0,$194=0,$195=0,$196=0,$197=0,$199=0,$200=0;
 var $201=0,$202=0,$203=0,$204=0,$205=0,$206=0,$208=0,$210=0,$211=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+64)|0;







 $t=((sp)|0);
 $t1=(((sp)+(16))|0);
 $t2=(((sp)+(32))|0);
 $t3=(((sp)+(48))|0);
 $1=$rects;
 $2=$numRects;
 while(1) {
  $4=$2;
  $5=($4|0)==2;
  if ($5) {
   break;
  }
  $53=$1;
  $54=(($53)|0);
  $55=$t1;
  $56=$54;
  HEAP32[(($55)>>2)]=((HEAP32[(($56)>>2)])|0);HEAP32[((($55)+(4))>>2)]=((HEAP32[((($56)+(4))>>2)])|0);HEAP32[((($55)+(8))>>2)]=((HEAP32[((($56)+(8))>>2)])|0);HEAP32[((($55)+(12))>>2)]=((HEAP32[((($56)+(12))>>2)])|0);
  $57=$1;
  $58=(($57)|0);
  $59=$2;
  $60=$59>>1;
  $61=$1;
  $62=(($61+($60<<4))|0);
  $63=$58;
  $64=$62;
  HEAP32[(($63)>>2)]=((HEAP32[(($64)>>2)])|0);HEAP32[((($63)+(4))>>2)]=((HEAP32[((($64)+(4))>>2)])|0);HEAP32[((($63)+(8))>>2)]=((HEAP32[((($64)+(8))>>2)])|0);HEAP32[((($63)+(12))>>2)]=((HEAP32[((($64)+(12))>>2)])|0);
  $65=$2;
  $66=$65>>1;
  $67=$1;
  $68=(($67+($66<<4))|0);
  $69=$68;
  $70=$t1;
  HEAP32[(($69)>>2)]=((HEAP32[(($70)>>2)])|0);HEAP32[((($69)+(4))>>2)]=((HEAP32[((($70)+(4))>>2)])|0);HEAP32[((($69)+(8))>>2)]=((HEAP32[((($70)+(8))>>2)])|0);HEAP32[((($69)+(12))>>2)]=((HEAP32[((($70)+(12))>>2)])|0);
  $71=$1;
  $72=(($71)|0);
  $73=(($72+4)|0);
  $74=((HEAP32[(($73)>>2)])|0);
  $y1=$74;
  $75=$1;
  $76=(($75)|0);
  $77=(($76)|0);
  $78=((HEAP32[(($77)>>2)])|0);
  $x1=$78;
  $i=0;
  $79=$2;
  $j=$79;
  while(1) {
   $81=$i;
   $82=$1;
   $83=(($82+($81<<4))|0);
   $r=$83;
   while(1) {
    $85=$r;
    $86=(($85+16)|0);
    $r=$86;
    $87=$i;
    $88=((($87)+(1))|0);
    $i=$88;
    $90=$i;
    $91=$2;
    $92=($90|0)!=($91|0);
    if ($92) {
     $94=$r;
     $95=(($94+4)|0);
     $96=((HEAP32[(($95)>>2)])|0);
     $97=$y1;
     $98=($96|0)<($97|0);
     if ($98) {
      $114=1;
     } else {
      $100=$r;
      $101=(($100+4)|0);
      $102=((HEAP32[(($101)>>2)])|0);
      $103=$y1;
      $104=($102|0)==($103|0);
      if ($104) {
       $106=$r;
       $107=(($106)|0);
       $108=((HEAP32[(($107)>>2)])|0);
       $109=$x1;
       $110=($108|0)<($109|0);
       $112=$110;
      } else {
       $112=0;
      }

      $114=$112;
     }

     $116=$114;
    } else {
     $116=0;
    }

    if (!($116)) {
     break;
    }
   }
   $118=$j;
   $119=$1;
   $120=(($119+($118<<4))|0);
   $r=$120;
   while(1) {
    $122=$r;
    $123=((($122)-(16))|0);
    $r=$123;
    $124=$j;
    $125=((($124)-(1))|0);
    $j=$125;
    $127=$y1;
    $128=$r;
    $129=(($128+4)|0);
    $130=((HEAP32[(($129)>>2)])|0);
    $131=($127|0)<($130|0);
    if ($131) {
     $147=1;
    } else {
     $133=$y1;
     $134=$r;
     $135=(($134+4)|0);
     $136=((HEAP32[(($135)>>2)])|0);
     $137=($133|0)==($136|0);
     if ($137) {
      $139=$x1;
      $140=$r;
      $141=(($140)|0);
      $142=((HEAP32[(($141)>>2)])|0);
      $143=($139|0)<($142|0);
      $145=$143;
     } else {
      $145=0;
     }

     $147=$145;
    }

    if (!($147)) {
     break;
    }
   }
   $149=$i;
   $150=$j;
   $151=($149|0)<($150|0);
   if ($151) {
    $153=$i;
    $154=$1;
    $155=(($154+($153<<4))|0);
    $156=$t2;
    $157=$155;
    HEAP32[(($156)>>2)]=((HEAP32[(($157)>>2)])|0);HEAP32[((($156)+(4))>>2)]=((HEAP32[((($157)+(4))>>2)])|0);HEAP32[((($156)+(8))>>2)]=((HEAP32[((($157)+(8))>>2)])|0);HEAP32[((($156)+(12))>>2)]=((HEAP32[((($157)+(12))>>2)])|0);
    $158=$i;
    $159=$1;
    $160=(($159+($158<<4))|0);
    $161=$j;
    $162=$1;
    $163=(($162+($161<<4))|0);
    $164=$160;
    $165=$163;
    HEAP32[(($164)>>2)]=((HEAP32[(($165)>>2)])|0);HEAP32[((($164)+(4))>>2)]=((HEAP32[((($165)+(4))>>2)])|0);HEAP32[((($164)+(8))>>2)]=((HEAP32[((($165)+(8))>>2)])|0);HEAP32[((($164)+(12))>>2)]=((HEAP32[((($165)+(12))>>2)])|0);
    $166=$j;
    $167=$1;
    $168=(($167+($166<<4))|0);
    $169=$168;
    $170=$t2;
    HEAP32[(($169)>>2)]=((HEAP32[(($170)>>2)])|0);HEAP32[((($169)+(4))>>2)]=((HEAP32[((($170)+(4))>>2)])|0);HEAP32[((($169)+(8))>>2)]=((HEAP32[((($170)+(8))>>2)])|0);HEAP32[((($169)+(12))>>2)]=((HEAP32[((($170)+(12))>>2)])|0);
   }
   $173=$i;
   $174=$j;
   $175=($173|0)<($174|0);
   if (!($175)) {
    break;
   }
  }
  $177=$1;
  $178=(($177)|0);
  $179=$t3;
  $180=$178;
  HEAP32[(($179)>>2)]=((HEAP32[(($180)>>2)])|0);HEAP32[((($179)+(4))>>2)]=((HEAP32[((($180)+(4))>>2)])|0);HEAP32[((($179)+(8))>>2)]=((HEAP32[((($180)+(8))>>2)])|0);HEAP32[((($179)+(12))>>2)]=((HEAP32[((($180)+(12))>>2)])|0);
  $181=$1;
  $182=(($181)|0);
  $183=$j;
  $184=$1;
  $185=(($184+($183<<4))|0);
  $186=$182;
  $187=$185;
  HEAP32[(($186)>>2)]=((HEAP32[(($187)>>2)])|0);HEAP32[((($186)+(4))>>2)]=((HEAP32[((($187)+(4))>>2)])|0);HEAP32[((($186)+(8))>>2)]=((HEAP32[((($187)+(8))>>2)])|0);HEAP32[((($186)+(12))>>2)]=((HEAP32[((($187)+(12))>>2)])|0);
  $188=$j;
  $189=$1;
  $190=(($189+($188<<4))|0);
  $191=$190;
  $192=$t3;
  HEAP32[(($191)>>2)]=((HEAP32[(($192)>>2)])|0);HEAP32[((($191)+(4))>>2)]=((HEAP32[((($192)+(4))>>2)])|0);HEAP32[((($191)+(8))>>2)]=((HEAP32[((($192)+(8))>>2)])|0);HEAP32[((($191)+(12))>>2)]=((HEAP32[((($192)+(12))>>2)])|0);
  $193=$2;
  $194=$j;
  $195=((($193)-($194))|0);
  $196=((($195)-(1))|0);
  $197=($196|0)>1;
  if ($197) {
   $199=$j;
   $200=((($199)+(1))|0);
   $201=$1;
   $202=(($201+($200<<4))|0);
   $203=$2;
   $204=$j;
   $205=((($203)-($204))|0);
   $206=((($205)-(1))|0);
   _quick_sort_rects($202,$206);
  }
  $208=$j;
  $2=$208;
  $210=$2;
  $211=($210|0)>1;
  if (!($211)) {
   label = 33;
   break;
  }
 }
 if ((label|0) == 33) {
  STACKTOP=sp;return;
 }
 $7=$1;
 $8=(($7)|0);
 $9=(($8+4)|0);
 $10=((HEAP32[(($9)>>2)])|0);
 $11=$1;
 $12=(($11+16)|0);
 $13=(($12+4)|0);
 $14=((HEAP32[(($13)>>2)])|0);
 $15=($10|0)>($14|0);
 if ($15) {
  label = 6;
 } else {
  $17=$1;
  $18=(($17)|0);
  $19=(($18+4)|0);
  $20=((HEAP32[(($19)>>2)])|0);
  $21=$1;
  $22=(($21+16)|0);
  $23=(($22+4)|0);
  $24=((HEAP32[(($23)>>2)])|0);
  $25=($20|0)==($24|0);
  if ($25) {
   $27=$1;
   $28=(($27)|0);
   $29=(($28)|0);
   $30=((HEAP32[(($29)>>2)])|0);
   $31=$1;
   $32=(($31+16)|0);
   $33=(($32)|0);
   $34=((HEAP32[(($33)>>2)])|0);
   $35=($30|0)>($34|0);
   if ($35) {
    label = 6;
   }
  }
 }
 if ((label|0) == 6) {
  $37=$1;
  $38=(($37)|0);
  $39=$t;
  $40=$38;
  HEAP32[(($39)>>2)]=((HEAP32[(($40)>>2)])|0);HEAP32[((($39)+(4))>>2)]=((HEAP32[((($40)+(4))>>2)])|0);HEAP32[((($39)+(8))>>2)]=((HEAP32[((($40)+(8))>>2)])|0);HEAP32[((($39)+(12))>>2)]=((HEAP32[((($40)+(12))>>2)])|0);
  $41=$1;
  $42=(($41)|0);
  $43=$1;
  $44=(($43+16)|0);
  $45=$42;
  $46=$44;
  HEAP32[(($45)>>2)]=((HEAP32[(($46)>>2)])|0);HEAP32[((($45)+(4))>>2)]=((HEAP32[((($46)+(4))>>2)])|0);HEAP32[((($45)+(8))>>2)]=((HEAP32[((($46)+(8))>>2)])|0);HEAP32[((($45)+(12))>>2)]=((HEAP32[((($46)+(12))>>2)])|0);
  $47=$1;
  $48=(($47+16)|0);
  $49=$48;
  $50=$t;
  HEAP32[(($49)>>2)]=((HEAP32[(($50)>>2)])|0);HEAP32[((($49)+(4))>>2)]=((HEAP32[((($50)+(4))>>2)])|0);HEAP32[((($49)+(8))>>2)]=((HEAP32[((($50)+(8))>>2)])|0);HEAP32[((($49)+(12))>>2)]=((HEAP32[((($50)+(12))>>2)])|0);
 }
 STACKTOP=sp;return;
}


function _pixman_coalesce($region,$prev_start,$cur_start){
 $region=($region)|0;
 $prev_start=($prev_start)|0;
 $cur_start=($cur_start)|0;
 var $1=0,$2=0,$3=0,$4=0,$prev_box=0,$cur_box=0,$numRects=0,$y2=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0;
 var $18=0,$19=0,$20=0,$21=0,$25=0,$26=0,$28=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0;
 var $43=0,$44=0,$45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$52=0,$54=0,$55=0,$56=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$66=0;
 var $67=0,$68=0,$69=0,$70=0,$71=0,$72=0,$74=0,$76=0,$77=0,$78=0,$79=0,$80=0,$81=0,$83=0,$84=0,$86=0,$87=0,$88=0,$89=0,$90=0;
 var $91=0,$92=0,$93=0,$94=0,$95=0,$97=0,$98=0,$99=0,$100=0,$101=0,$102=0,$103=0,$105=0,$106=0,$108=0,$110=0,label=0;
 var sp=0;sp=STACKTOP;








 $2=$region;
 $3=$prev_start;
 $4=$cur_start;
 $5=$4;
 $6=$3;
 $7=((($5)-($6))|0);
 $numRects=$7;
 $9=$numRects;
 $10=$2;
 $11=(($10+16)|0);
 $12=((HEAP32[(($11)>>2)])|0);
 $13=(($12+4)|0);
 $14=((HEAP32[(($13)>>2)])|0);
 $15=$4;
 $16=((($14)-($15))|0);
 $17=($9|0)==($16|0);
 $18=$17^1;
 $19=($18&1);
 $20=($19);
 $21=($20|0)!=0;
 if ($21) {
  __pixman_log_error(2080,224);
 }
 $25=$numRects;
 $26=($25|0)!=0;
 if (!($26)) {
  $28=$4;
  $1=$28;
  $110=$1;
  STACKTOP=sp;return (($110)|0);
 }
 $30=$3;
 $31=$2;
 $32=(($31+16)|0);
 $33=((HEAP32[(($32)>>2)])|0);
 $34=(($33+8)|0);
 $35=$34;
 $36=(($35+($30<<4))|0);
 $prev_box=$36;
 $37=$4;
 $38=$2;
 $39=(($38+16)|0);
 $40=((HEAP32[(($39)>>2)])|0);
 $41=(($40+8)|0);
 $42=$41;
 $43=(($42+($37<<4))|0);
 $cur_box=$43;
 $44=$prev_box;
 $45=(($44+12)|0);
 $46=((HEAP32[(($45)>>2)])|0);
 $47=$cur_box;
 $48=(($47+4)|0);
 $49=((HEAP32[(($48)>>2)])|0);
 $50=($46|0)!=($49|0);
 if ($50) {
  $52=$4;
  $1=$52;
  $110=$1;
  STACKTOP=sp;return (($110)|0);
 }
 $54=$cur_box;
 $55=(($54+12)|0);
 $56=((HEAP32[(($55)>>2)])|0);
 $y2=$56;
 while(1) {
  $58=$prev_box;
  $59=(($58)|0);
  $60=((HEAP32[(($59)>>2)])|0);
  $61=$cur_box;
  $62=(($61)|0);
  $63=((HEAP32[(($62)>>2)])|0);
  $64=($60|0)!=($63|0);
  if ($64) {
   label = 12;
   break;
  }
  $66=$prev_box;
  $67=(($66+8)|0);
  $68=((HEAP32[(($67)>>2)])|0);
  $69=$cur_box;
  $70=(($69+8)|0);
  $71=((HEAP32[(($70)>>2)])|0);
  $72=($68|0)!=($71|0);
  if ($72) {
   label = 12;
   break;
  }
  $76=$prev_box;
  $77=(($76+16)|0);
  $prev_box=$77;
  $78=$cur_box;
  $79=(($78+16)|0);
  $cur_box=$79;
  $80=$numRects;
  $81=((($80)-(1))|0);
  $numRects=$81;
  $83=$numRects;
  $84=($83|0)!=0;
  if (!($84)) {
   break;
  }
 }
 if ((label|0) == 12) {
  $74=$4;
  $1=$74;
  $110=$1;
  STACKTOP=sp;return (($110)|0);
 }
 $86=$4;
 $87=$3;
 $88=((($86)-($87))|0);
 $numRects=$88;
 $89=$numRects;
 $90=$2;
 $91=(($90+16)|0);
 $92=((HEAP32[(($91)>>2)])|0);
 $93=(($92+4)|0);
 $94=((HEAP32[(($93)>>2)])|0);
 $95=((($94)-($89))|0);
 HEAP32[(($93)>>2)]=$95;
 while(1) {
  $97=$prev_box;
  $98=((($97)-(16))|0);
  $prev_box=$98;
  $99=$y2;
  $100=$prev_box;
  $101=(($100+12)|0);
  HEAP32[(($101)>>2)]=$99;
  $102=$numRects;
  $103=((($102)-(1))|0);
  $numRects=$103;
  $105=$numRects;
  $106=($105|0)!=0;
  if (!($106)) {
   break;
  }
 }
 $108=$3;
 $1=$108;
 $110=$1;
 STACKTOP=sp;return (($110)|0);
}


function _pixman_region_append_non_o($region,$r,$r_end,$y1,$y2){
 $region=($region)|0;
 $r=($r)|0;
 $r_end=($r_end)|0;
 $y1=($y1)|0;
 $y2=($y2)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$next_rect=0,$new_rects=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0;
 var $20=0,$25=0,$26=0,$27=0,$28=0,$29=0,$30=0,$35=0,$36=0,$37=0,$38=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$46=0,$47=0,$48=0;
 var $49=0,$50=0,$51=0,$52=0,$54=0,$55=0,$56=0,$57=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0,$71=0,$72=0,$73=0;
 var $74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$82=0,$83=0,$84=0,$85=0,$86=0,$87=0,$88=0,$89=0,$90=0,$91=0,$92=0,$97=0,$98=0,$99=0;
 var $100=0,$101=0,$102=0,$103=0,$104=0,$105=0,$106=0,$107=0,$108=0,$109=0,$110=0,$111=0,$112=0,$113=0,$114=0,$116=0,$117=0,$119=0,$120=0,$121=0;
 var $124=0,label=0;
 var sp=0;sp=STACKTOP;








 $2=$region;
 $3=$r;
 $4=$r_end;
 $5=$y1;
 $6=$y2;
 $7=$4;
 $8=$3;
 $9=$7;
 $10=$8;
 $11=((($9)-($10))|0);
 $12=(((($11|0))/(16))&-1);
 $new_rects=$12;
 $14=$5;
 $15=$6;
 $16=($14|0)<($15|0);
 $17=$16^1;
 $18=($17&1);
 $19=($18);
 $20=($19|0)!=0;
 if ($20) {
  __pixman_log_error(1536,168);
 }
 $25=$new_rects;
 $26=($25|0)!=0;
 $27=$26^1;
 $28=($27&1);
 $29=($28);
 $30=($29|0)!=0;
 if ($30) {
  __pixman_log_error(1536,632);
 }
 $35=$2;
 $36=(($35+16)|0);
 $37=((HEAP32[(($36)>>2)])|0);
 $38=($37|0)!=0;
 if ($38) {
  $40=$2;
  $41=(($40+16)|0);
  $42=((HEAP32[(($41)>>2)])|0);
  $43=(($42+4)|0);
  $44=((HEAP32[(($43)>>2)])|0);
  $45=$new_rects;
  $46=((($44)+($45))|0);
  $47=$2;
  $48=(($47+16)|0);
  $49=((HEAP32[(($48)>>2)])|0);
  $50=(($49)|0);
  $51=((HEAP32[(($50)>>2)])|0);
  $52=($46|0)>($51|0);
  if ($52) {
   label = 12;
  }
 } else {
  label = 12;
 }
 do {
  if ((label|0) == 12) {
   $54=$2;
   $55=$new_rects;
   $56=((_pixman_rect_alloc($54,$55))|0);
   $57=($56|0)!=0;
   if ($57) {
    break;
   }
   $1=0;
   $124=$1;
   STACKTOP=sp;return (($124)|0);
  }
 } while(0);
 $62=$2;
 $63=(($62+16)|0);
 $64=((HEAP32[(($63)>>2)])|0);
 $65=(($64+4)|0);
 $66=((HEAP32[(($65)>>2)])|0);
 $67=$2;
 $68=(($67+16)|0);
 $69=((HEAP32[(($68)>>2)])|0);
 $70=(($69+8)|0);
 $71=$70;
 $72=(($71+($66<<4))|0);
 $next_rect=$72;
 $73=$new_rects;
 $74=$2;
 $75=(($74+16)|0);
 $76=((HEAP32[(($75)>>2)])|0);
 $77=(($76+4)|0);
 $78=((HEAP32[(($77)>>2)])|0);
 $79=((($78)+($73))|0);
 HEAP32[(($77)>>2)]=$79;
 while(1) {
  $82=$3;
  $83=(($82)|0);
  $84=((HEAP32[(($83)>>2)])|0);
  $85=$3;
  $86=(($85+8)|0);
  $87=((HEAP32[(($86)>>2)])|0);
  $88=($84|0)<($87|0);
  $89=$88^1;
  $90=($89&1);
  $91=($90);
  $92=($91|0)!=0;
  if ($92) {
   __pixman_log_error(1536,592);
  }
  $97=$3;
  $98=(($97)|0);
  $99=((HEAP32[(($98)>>2)])|0);
  $100=$next_rect;
  $101=(($100)|0);
  HEAP32[(($101)>>2)]=$99;
  $102=$5;
  $103=$next_rect;
  $104=(($103+4)|0);
  HEAP32[(($104)>>2)]=$102;
  $105=$3;
  $106=(($105+8)|0);
  $107=((HEAP32[(($106)>>2)])|0);
  $108=$next_rect;
  $109=(($108+8)|0);
  HEAP32[(($109)>>2)]=$107;
  $110=$6;
  $111=$next_rect;
  $112=(($111+12)|0);
  HEAP32[(($112)>>2)]=$110;
  $113=$next_rect;
  $114=(($113+16)|0);
  $next_rect=$114;
  $116=$3;
  $117=(($116+16)|0);
  $3=$117;
  $119=$3;
  $120=$4;
  $121=($119|0)!=($120|0);
  if (!($121)) {
   break;
  }
 }
 $1=1;
 $124=$1;
 STACKTOP=sp;return (($124)|0);
}


function __pixman_log_error($function,$message){
 $function=($function)|0;
 $message=($message)|0;
 var $1=0,$2=0,$3=0,$4=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,label=0;
 var tempVarArgs=0;
 var sp=0;sp=STACKTOP;


 $1=$function;
 $2=$message;
 $3=((HEAP32[((2400)>>2)])|0);
 $4=($3|0)<10;
 if (!($4)) {
  STACKTOP=sp;return;
 }
 $6=((HEAP32[((_stderr)>>2)])|0);
 $7=$1;
 $8=$2;
 $9=((_fprintf((($6)|0),((504)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 16)|0,HEAP32[((tempVarArgs)>>2)]=$7,HEAP32[(((tempVarArgs)+(8))>>2)]=$8,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $10=((HEAP32[((2400)>>2)])|0);
 $11=((($10)+(1))|0);
 HEAP32[((2400)>>2)]=$11;
 STACKTOP=sp;return;
}


function _malloc($bytes){
 $bytes=($bytes)|0;
 var $1=0,$3=0,$5=0,$6=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0,$_sum11=0,$21=0,$22=0,$23=0;
 var $24=0,$25=0,$27=0,$28=0,$29=0,$31=0,$32=0,$33=0,$35=0,$36=0,$37=0,$40=0,$41=0,$42=0,$43=0,$_sum1314=0,$44=0,$45=0,$46=0,$47=0;
 var $48=0,$50=0,$51=0,$53=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$61=0,$62=0,$63=0,$64=0,$65=0,$66=0,$67=0,$68=0,$69=0,$70=0;
 var $71=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$78=0,$79=0,$80=0,$81=0,$82=0,$83=0,$84=0,$85=0,$_sum4=0,$86=0,$87=0,$88=0,$89=0;
 var $90=0,$92=0,$93=0,$94=0,$96=0,$97=0,$98=0,$100=0,$101=0,$102=0,$105=0,$106=0,$107=0,$108=0,$109=0,$110=0,$111=0,$112=0,$_sum67=0,$113=0;
 var $114=0,$115=0,$116=0,$117=0,$118=0,$120=0,$121=0,$122=0,$123=0,$124=0,$125=0,$126=0,$127=0,$128=0,$130=0,$_sum9_pre=0,$_pre=0,$_sum10=0,$132=0,$133=0;
 var $134=0,$135=0,$136=0,$_pre_phi=0,$F4_0=0,$139=0,$140=0,$141=0,$143=0,$145=0,$146=0,$148=0,$149=0,$150=0,$151=0,$152=0,$153=0,$154=0,$155=0,$156=0;
 var $157=0,$158=0,$159=0,$160=0,$161=0,$162=0,$163=0,$164=0,$165=0,$166=0,$167=0,$168=0,$169=0,$170=0,$171=0,$172=0,$173=0,$174=0,$175=0,$176=0;
 var $rsize_0_i=0,$v_0_i=0,$t_0_i=0,$178=0,$179=0,$180=0,$182=0,$183=0,$184=0,$185=0,$186=0,$187=0,$188=0,$189=0,$190=0,$_rsize_0_i=0,$_v_0_i=0,$192=0,$193=0,$194=0;
 var $196=0,$197=0,$198=0,$200=0,$201=0,$202=0,$203=0,$204=0,$206=0,$207=0,$208=0,$209=0,$211=0,$212=0,$213=0,$215=0,$216=0,$217=0,$220=0,$221=0;
 var $222=0,$224=0,$225=0,$226=0,$RP_0_i=0,$R_0_i=0,$227=0,$228=0,$229=0,$231=0,$232=0,$233=0,$235=0,$236=0,$R_1_i=0,$240=0,$242=0,$243=0,$244=0,$245=0;
 var $246=0,$cond_i=0,$248=0,$249=0,$250=0,$251=0,$253=0,$254=0,$255=0,$257=0,$258=0,$259=0,$262=0,$265=0,$267=0,$268=0,$269=0,$271=0,$272=0,$273=0;
 var $274=0,$276=0,$277=0,$278=0,$280=0,$281=0,$284=0,$285=0,$286=0,$288=0,$289=0,$290=0,$292=0,$293=0,$297=0,$299=0,$300=0,$301=0,$_sum4_i=0,$302=0;
 var $303=0,$304=0,$305=0,$307=0,$308=0,$309=0,$_sum_i37=0,$310=0,$311=0,$_sum1_i=0,$312=0,$313=0,$314=0,$315=0,$317=0,$318=0,$319=0,$320=0,$321=0,$322=0;
 var $323=0,$324=0,$325=0,$327=0,$_sum2_pre_i=0,$_pre_i=0,$_sum3_i=0,$329=0,$330=0,$331=0,$332=0,$333=0,$_pre_phi_i=0,$F1_0_i=0,$336=0,$337=0,$338=0,$341=0,$342=0,$344=0;
 var $346=0,$347=0,$348=0,$349=0,$351=0,$352=0,$353=0,$355=0,$357=0,$358=0,$359=0,$360=0,$361=0,$362=0,$363=0,$364=0,$365=0,$366=0,$367=0,$368=0;
 var $369=0,$370=0,$371=0,$372=0,$373=0,$374=0,$375=0,$376=0,$377=0,$378=0,$idx_0_i=0,$380=0,$381=0,$382=0,$384=0,$386=0,$387=0,$389=0,$390=0,$rst_0_i=0;
 var $sizebits_0_i=0,$t_0_i16=0,$rsize_0_i17=0,$v_0_i18=0,$392=0,$393=0,$394=0,$395=0,$396=0,$398=0,$rsize_1_i=0,$v_1_i=0,$400=0,$401=0,$402=0,$403=0,$404=0,$405=0,$406=0,$or_cond_i=0;
 var $rst_1_i=0,$407=0,$408=0,$t_1_i=0,$rsize_2_i=0,$v_2_i=0,$409=0,$410=0,$or_cond21_i=0,$412=0,$413=0,$414=0,$415=0,$416=0,$418=0,$419=0,$420=0,$421=0,$422=0,$423=0;
 var $424=0,$425=0,$426=0,$427=0,$428=0,$429=0,$430=0,$431=0,$432=0,$433=0,$434=0,$435=0,$436=0,$437=0,$438=0,$439=0,$440=0,$441=0,$442=0,$t_2_ph_i=0;
 var $443=0,$v_332_i=0,$rsize_331_i=0,$t_230_i=0,$444=0,$445=0,$446=0,$447=0,$448=0,$_rsize_3_i=0,$t_2_v_3_i=0,$449=0,$450=0,$451=0,$452=0,$453=0,$454=0,$v_3_lcssa_i=0,$rsize_3_lcssa_i=0,$455=0;
 var $457=0,$458=0,$459=0,$461=0,$462=0,$463=0,$465=0,$466=0,$467=0,$469=0,$470=0,$471=0,$472=0,$473=0,$475=0,$476=0,$477=0,$478=0,$480=0,$481=0;
 var $482=0,$484=0,$485=0,$486=0,$489=0,$490=0,$491=0,$493=0,$494=0,$495=0,$RP_0_i19=0,$R_0_i20=0,$496=0,$497=0,$498=0,$500=0,$501=0,$502=0,$504=0,$505=0;
 var $R_1_i22=0,$509=0,$511=0,$512=0,$513=0,$514=0,$515=0,$cond_i23=0,$517=0,$518=0,$519=0,$520=0,$522=0,$523=0,$524=0,$526=0,$527=0,$528=0,$531=0,$534=0;
 var $536=0,$537=0,$538=0,$540=0,$541=0,$542=0,$543=0,$545=0,$546=0,$547=0,$549=0,$550=0,$553=0,$554=0,$555=0,$557=0,$558=0,$559=0,$561=0,$562=0;
 var $566=0,$568=0,$569=0,$570=0,$_sum19_i=0,$571=0,$572=0,$573=0,$574=0,$576=0,$577=0,$578=0,$_sum_i2536=0,$579=0,$580=0,$_sum1_i26=0,$581=0,$582=0,$583=0,$584=0;
 var $586=0,$587=0,$588=0,$589=0,$590=0,$591=0,$592=0,$594=0,$_sum15_pre_i=0,$_pre_i27=0,$_sum18_i=0,$596=0,$597=0,$598=0,$599=0,$600=0,$_pre_phi_i28=0,$F5_0_i=0,$603=0,$_sum16_i=0;
 var $604=0,$605=0,$_sum17_i=0,$606=0,$607=0,$609=0,$610=0,$611=0,$613=0,$615=0,$616=0,$617=0,$618=0,$619=0,$620=0,$621=0,$622=0,$623=0,$624=0,$625=0;
 var $626=0,$627=0,$628=0,$629=0,$630=0,$631=0,$632=0,$633=0,$634=0,$635=0,$636=0,$I7_0_i=0,$638=0,$_sum2_i=0,$639=0,$640=0,$_sum3_i29=0,$641=0,$_sum4_i30=0,$642=0;
 var $643=0,$644=0,$645=0,$646=0,$647=0,$648=0,$650=0,$651=0,$_sum5_i=0,$652=0,$653=0,$_sum6_i=0,$654=0,$655=0,$_sum7_i=0,$656=0,$657=0,$659=0,$660=0,$662=0;
 var $663=0,$665=0,$666=0,$667=0,$668=0,$669=0,$670=0,$672=0,$673=0,$674=0,$675=0,$676=0,$K12_027_i=0,$T_026_i=0,$678=0,$679=0,$680=0,$681=0,$683=0,$684=0;
 var $685=0,$_sum12_i=0,$687=0,$688=0,$_sum13_i=0,$689=0,$690=0,$_sum14_i=0,$691=0,$692=0,$T_0_lcssa_i=0,$694=0,$695=0,$696=0,$697=0,$698=0,$700=0,$701=0,$703=0,$_sum9_i=0;
 var $704=0,$705=0,$_sum10_i=0,$706=0,$707=0,$_sum11_i=0,$708=0,$709=0,$711=0,$712=0,$nb_0=0,$713=0,$714=0,$716=0,$717=0,$718=0,$720=0,$721=0,$722=0,$723=0;
 var $_sum2=0,$724=0,$725=0,$726=0,$727=0,$728=0,$729=0,$731=0,$732=0,$733=0,$_sum1=0,$734=0,$735=0,$736=0,$737=0,$739=0,$740=0,$742=0,$743=0,$745=0;
 var $746=0,$747=0,$748=0,$749=0,$750=0,$_sum=0,$751=0,$752=0,$753=0,$754=0,$755=0,$756=0,$758=0,$759=0,$761=0,$762=0,$763=0,$764=0,$766=0,$767=0;
 var $768=0,$770=0,$771=0,$772=0,$773=0,$774=0,$775=0,$776=0,$778=0,$779=0,$781=0,$782=0,$783=0,$784=0,$or_cond1_i=0,$786=0,$787=0,$788=0,$790=0,$791=0;
 var $793=0,$sp_0_i_i=0,$795=0,$796=0,$797=0,$799=0,$800=0,$801=0,$802=0,$804=0,$805=0,$806=0,$807=0,$808=0,$809=0,$811=0,$812=0,$813=0,$814=0,$815=0;
 var $817=0,$818=0,$819=0,$820=0,$821=0,$ssize_0_i=0,$823=0,$824=0,$825=0,$826=0,$or_cond_i31=0,$828=0,$829=0,$831=0,$832=0,$or_cond2_i=0,$834=0,$835=0,$ssize_0__i=0,$__i=0;
 var $837=0,$838=0,$839=0,$840=0,$842=0,$843=0,$844=0,$845=0,$846=0,$_3_i=0,$_4_i=0,$ssize_1_i=0,$br_0_i=0,$tsize_0_i=0,$tbase_0_i=0,$848=0,$849=0,$851=0,$852=0,$or_cond5_i=0;
 var $853=0,$or_cond6_i=0,$855=0,$856=0,$857=0,$858=0,$859=0,$860=0,$862=0,$863=0,$865=0,$867=0,$ssize_2_i=0,$869=0,$tsize_0323841_i=0,$870=0,$871=0,$tsize_1_i=0,$873=0,$875=0;
 var $876=0,$notlhs_i=0,$notrhs_i=0,$or_cond8_not_i=0,$877=0,$or_cond9_i=0,$878=0,$879=0,$880=0,$881=0,$882=0,$_tsize_1_i=0,$tbase_247_i=0,$tsize_246_i=0,$883=0,$884=0,$885=0,$886=0,$888=0,$889=0;
 var $891=0,$892=0,$893=0,$or_cond10_i=0,$895=0,$i_02_i_i=0,$897=0,$898=0,$899=0,$_sum_i_i=0,$900=0,$_sum1_i_i=0,$901=0,$902=0,$903=0,$904=0,$905=0,$906=0,$907=0,$908=0;
 var $910=0,$911=0,$912=0,$913=0,$914=0,$915=0,$916=0,$_sum_i14_i=0,$917=0,$918=0,$_sum2_i_i=0,$919=0,$920=0,$921=0,$sp_075_i=0,$922=0,$923=0,$924=0,$925=0,$926=0;
 var $927=0,$929=0,$930=0,$931=0,$932=0,$933=0,$934=0,$935=0,$937=0,$938=0,$939=0,$or_cond49_i=0,$941=0,$942=0,$943=0,$944=0,$945=0,$946=0,$947=0,$949=0;
 var $950=0,$951=0,$952=0,$953=0,$954=0,$955=0,$_sum_i18_i=0,$956=0,$957=0,$_sum2_i19_i=0,$958=0,$959=0,$960=0,$961=0,$962=0,$964=0,$sp_168_i=0,$966=0,$967=0,$968=0;
 var $970=0,$971=0,$972=0,$973=0,$974=0,$975=0,$976=0,$978=0,$979=0,$980=0,$981=0,$982=0,$983=0,$984=0,$986=0,$987=0,$989=0,$990=0,$_sum107_i=0,$991=0;
 var $992=0,$993=0,$994=0,$996=0,$997=0,$999=0,$_sum108_i=0,$1000=0,$1001=0,$1002=0,$1003=0,$1004=0,$_sum_i21_i=0,$1005=0,$1006=0,$1007=0,$1008=0,$_sum1_i22_i=0,$1009=0,$1010=0;
 var $1011=0,$1012=0,$1014=0,$1015=0,$1016=0,$_sum46_i_i=0,$1017=0,$1018=0,$1020=0,$1021=0,$1023=0,$1024=0,$1025=0,$_sum44_i_i=0,$1026=0,$1027=0,$_sum45_i_i=0,$1028=0,$1029=0,$_sum2_i23_i=0;
 var $_sum109_i=0,$1031=0,$1032=0,$1033=0,$1034=0,$1035=0,$1037=0,$1038=0,$1039=0,$_sum3940_i_i=0,$_sum119_i=0,$1041=0,$1042=0,$1043=0,$_sum41_i_i=0,$_sum120_i=0,$1044=0,$1045=0,$1046=0,$1047=0;
 var $1048=0,$1049=0,$1050=0,$1052=0,$1053=0,$1054=0,$1056=0,$1057=0,$1058=0,$1059=0,$1061=0,$1062=0,$1063=0,$1064=0,$1066=0,$_pre61_i_i=0,$1068=0,$1069=0,$1070=0,$1072=0;
 var $1073=0,$1074=0,$_pre_phi62_i_i=0,$1075=0,$1077=0,$_sum34_i_i=0,$_sum110_i=0,$1078=0,$1079=0,$1080=0,$_sum5_i_i=0,$_sum111_i=0,$1081=0,$1082=0,$1083=0,$1084=0,$_sum3637_i_i=0,$_sum112_i=0,$1086=0,$1087=0;
 var $1088=0,$1089=0,$1090=0,$1091=0,$1093=0,$1094=0,$1095=0,$1097=0,$1098=0,$1099=0,$_sum67_i_i=0,$_sum117_i=0,$1102=0,$1103=0,$1104=0,$1105=0,$_sum118_i=0,$1107=0,$1108=0,$1109=0;
 var $1110=0,$RP_0_i_i=0,$R_0_i_i=0,$1111=0,$1112=0,$1113=0,$1115=0,$1116=0,$1117=0,$1119=0,$1120=0,$1121=0,$R_1_i_i=0,$1125=0,$_sum31_i_i=0,$_sum113_i=0,$1127=0,$1128=0,$1129=0,$1130=0;
 var $1131=0,$1132=0,$cond_i_i=0,$1134=0,$1135=0,$1136=0,$1137=0,$1139=0,$1140=0,$1141=0,$1143=0,$1144=0,$1145=0,$1148=0,$1151=0,$1153=0,$1154=0,$1155=0,$1157=0,$_sum3233_i_i=0;
 var $_sum114_i=0,$1158=0,$1159=0,$1160=0,$1161=0,$1163=0,$1164=0,$1165=0,$1167=0,$1168=0,$_sum115_i=0,$1171=0,$1172=0,$1173=0,$1174=0,$1176=0,$1177=0,$1178=0,$1180=0,$1181=0;
 var $_sum9_i_i=0,$_sum116_i=0,$1185=0,$1186=0,$1187=0,$qsize_0_i_i=0,$oldfirst_0_i_i=0,$1189=0,$1190=0,$1191=0,$1192=0,$_sum10_i_i=0,$1193=0,$1194=0,$_sum11_i_i=0,$1195=0,$1196=0,$1197=0,$1198=0,$1200=0;
 var $1201=0,$1202=0,$1203=0,$1204=0,$1205=0,$1206=0,$1208=0,$_sum27_pre_i_i=0,$_pre_i24_i=0,$_sum30_i_i=0,$1210=0,$1211=0,$1212=0,$1213=0,$1214=0,$_pre_phi_i25_i=0,$F4_0_i_i=0,$1217=0,$_sum28_i_i=0,$1218=0;
 var $1219=0,$_sum29_i_i=0,$1220=0,$1221=0,$1223=0,$1224=0,$1225=0,$1227=0,$1229=0,$1230=0,$1231=0,$1232=0,$1233=0,$1234=0,$1235=0,$1236=0,$1237=0,$1238=0,$1239=0,$1240=0;
 var $1241=0,$1242=0,$1243=0,$1244=0,$1245=0,$1246=0,$1247=0,$1248=0,$1249=0,$1250=0,$I7_0_i_i=0,$1252=0,$_sum12_i26_i=0,$1253=0,$1254=0,$_sum13_i_i=0,$1255=0,$_sum14_i_i=0,$1256=0,$1257=0;
 var $1258=0,$1259=0,$1260=0,$1261=0,$1262=0,$1264=0,$1265=0,$_sum15_i_i=0,$1266=0,$1267=0,$_sum16_i_i=0,$1268=0,$1269=0,$_sum17_i_i=0,$1270=0,$1271=0,$1273=0,$1274=0,$1276=0,$1277=0;
 var $1279=0,$1280=0,$1281=0,$1282=0,$1283=0,$1284=0,$1286=0,$1287=0,$1288=0,$1289=0,$1290=0,$K8_056_i_i=0,$T_055_i_i=0,$1292=0,$1293=0,$1294=0,$1295=0,$1297=0,$1298=0,$1299=0;
 var $_sum24_i_i=0,$1301=0,$1302=0,$_sum25_i_i=0,$1303=0,$1304=0,$_sum26_i_i=0,$1305=0,$1306=0,$T_0_lcssa_i28_i=0,$1308=0,$1309=0,$1310=0,$1311=0,$1312=0,$1314=0,$1315=0,$1317=0,$_sum21_i_i=0,$1318=0;
 var $1319=0,$_sum22_i_i=0,$1320=0,$1321=0,$_sum23_i_i=0,$1322=0,$1323=0,$_sum1819_i_i=0,$1324=0,$1325=0,$sp_0_i_i_i=0,$1327=0,$1328=0,$1329=0,$1331=0,$1332=0,$1333=0,$1334=0,$1336=0,$1337=0;
 var $_sum_i15_i=0,$_sum1_i16_i=0,$1338=0,$1339=0,$1340=0,$1341=0,$1343=0,$1344=0,$1346=0,$_sum2_i17_i=0,$1347=0,$1348=0,$1349=0,$1350=0,$1351=0,$1352=0,$1353=0,$1354=0,$1355=0,$1356=0;
 var $1357=0,$1358=0,$1360=0,$1361=0,$1362=0,$1363=0,$1364=0,$1365=0,$1366=0,$_sum_i_i_i=0,$1367=0,$1368=0,$_sum2_i_i_i=0,$1369=0,$1370=0,$1371=0,$1372=0,$1373=0,$1374=0,$1375=0;
 var $1376=0,$1377=0,$1378=0,$1379=0,$1380=0,$1381=0,$1382=0,$1383=0,$1385=0,$1386=0,$1387=0,$1388=0,$_sum3_i_i=0,$1389=0,$1390=0,$1391=0,$1392=0,$1393=0,$1394=0,$1395=0;
 var $1396=0,$1397=0,$1399=0,$1400=0,$1401=0,$1402=0,$1403=0,$1404=0,$1405=0,$1407=0,$_sum11_pre_i_i=0,$_pre_i_i=0,$_sum12_i_i=0,$1409=0,$1410=0,$1411=0,$1412=0,$1413=0,$_pre_phi_i_i=0,$F_0_i_i=0;
 var $1416=0,$1417=0,$1418=0,$1420=0,$1421=0,$1422=0,$1424=0,$1426=0,$1427=0,$1428=0,$1429=0,$1430=0,$1431=0,$1432=0,$1433=0,$1434=0,$1435=0,$1436=0,$1437=0,$1438=0;
 var $1439=0,$1440=0,$1441=0,$1442=0,$1443=0,$1444=0,$1445=0,$1446=0,$1447=0,$I1_0_i_i=0,$1449=0,$1450=0,$I1_0_c_i_i=0,$1451=0,$1452=0,$1453=0,$1454=0,$1455=0,$1456=0,$1458=0;
 var $1459=0,$_c_i_i=0,$1460=0,$1461=0,$1463=0,$1464=0,$1466=0,$1467=0,$1469=0,$1470=0,$1471=0,$1472=0,$1473=0,$1474=0,$1476=0,$1477=0,$1478=0,$1479=0,$1480=0,$K2_015_i_i=0;
 var $T_014_i_i=0,$1482=0,$1483=0,$1484=0,$1485=0,$1487=0,$1488=0,$1489=0,$1491=0,$T_0_c8_i_i=0,$1492=0,$1493=0,$T_0_lcssa_i_i=0,$1495=0,$1496=0,$1497=0,$1498=0,$1499=0,$1501=0,$1502=0;
 var $1504=0,$1505=0,$_c7_i_i=0,$1506=0,$T_0_c_i_i=0,$1507=0,$1508=0,$1509=0,$1511=0,$1512=0,$1513=0,$1514=0,$1515=0,$1516=0,$_sum_i34=0,$1517=0,$1518=0,$1519=0,$1520=0,$1521=0;
 var $1522=0,$1523=0,$mem_0=0,label=0;

 $1=($bytes>>>0)<((245)>>>0);
 do {
  if ($1) {
   $3=($bytes>>>0)<((11)>>>0);
   if ($3) {
    $8=16;
   } else {
    $5=((($bytes)+(11))|0);
    $6=$5&-8;
    $8=$6;
   }

   $9=$8>>>3;
   $10=((HEAP32[((2408)>>2)])|0);
   $11=$10>>>($9>>>0);
   $12=$11&3;
   $13=($12|0)==0;
   if (!($13)) {
    $15=$11&1;
    $16=$15^1;
    $17=((($16)+($9))|0);
    $18=$17<<1;
    $19=((2448+($18<<2))|0);
    $20=$19;
    $_sum11=((($18)+(2))|0);
    $21=((2448+($_sum11<<2))|0);
    $22=((HEAP32[(($21)>>2)])|0);
    $23=(($22+8)|0);
    $24=((HEAP32[(($23)>>2)])|0);
    $25=($20|0)==($24|0);
    do {
     if ($25) {
      $27=1<<$17;
      $28=$27^-1;
      $29=$10&$28;
      HEAP32[((2408)>>2)]=$29;
     } else {
      $31=$24;
      $32=((HEAP32[((2424)>>2)])|0);
      $33=($31>>>0)<($32>>>0);
      if ($33) {
       _abort(); return ((0)|0);
       return ((0)|0);
      }
      $35=(($24+12)|0);
      $36=((HEAP32[(($35)>>2)])|0);
      $37=($36|0)==($22|0);
      if ($37) {
       HEAP32[(($35)>>2)]=$20;
       HEAP32[(($21)>>2)]=$24;
       break;
      } else {
       _abort(); return ((0)|0);
       return ((0)|0);
      }
     }
    } while(0);
    $40=$17<<3;
    $41=$40|3;
    $42=(($22+4)|0);
    HEAP32[(($42)>>2)]=$41;
    $43=$22;
    $_sum1314=$40|4;
    $44=(($43+$_sum1314)|0);
    $45=$44;
    $46=((HEAP32[(($45)>>2)])|0);
    $47=$46|1;
    HEAP32[(($45)>>2)]=$47;
    $48=$23;
    $mem_0=$48;

    return (($mem_0)|0);
   }
   $50=((HEAP32[((2416)>>2)])|0);
   $51=($8>>>0)>($50>>>0);
   if ($51) {
    $53=($11|0)==0;
    if (!($53)) {
     $55=$11<<$9;
     $56=2<<$9;
     $57=(((-$56))|0);
     $58=$56|$57;
     $59=$55&$58;
     $60=(((-$59))|0);
     $61=$59&$60;
     $62=((($61)-(1))|0);
     $63=$62>>>12;
     $64=$63&16;
     $65=$62>>>($64>>>0);
     $66=$65>>>5;
     $67=$66&8;
     $68=$67|$64;
     $69=$65>>>($67>>>0);
     $70=$69>>>2;
     $71=$70&4;
     $72=$68|$71;
     $73=$69>>>($71>>>0);
     $74=$73>>>1;
     $75=$74&2;
     $76=$72|$75;
     $77=$73>>>($75>>>0);
     $78=$77>>>1;
     $79=$78&1;
     $80=$76|$79;
     $81=$77>>>($79>>>0);
     $82=((($80)+($81))|0);
     $83=$82<<1;
     $84=((2448+($83<<2))|0);
     $85=$84;
     $_sum4=((($83)+(2))|0);
     $86=((2448+($_sum4<<2))|0);
     $87=((HEAP32[(($86)>>2)])|0);
     $88=(($87+8)|0);
     $89=((HEAP32[(($88)>>2)])|0);
     $90=($85|0)==($89|0);
     do {
      if ($90) {
       $92=1<<$82;
       $93=$92^-1;
       $94=$10&$93;
       HEAP32[((2408)>>2)]=$94;
      } else {
       $96=$89;
       $97=((HEAP32[((2424)>>2)])|0);
       $98=($96>>>0)<($97>>>0);
       if ($98) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $100=(($89+12)|0);
       $101=((HEAP32[(($100)>>2)])|0);
       $102=($101|0)==($87|0);
       if ($102) {
        HEAP32[(($100)>>2)]=$85;
        HEAP32[(($86)>>2)]=$89;
        break;
       } else {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
      }
     } while(0);
     $105=$82<<3;
     $106=((($105)-($8))|0);
     $107=$8|3;
     $108=(($87+4)|0);
     HEAP32[(($108)>>2)]=$107;
     $109=$87;
     $110=(($109+$8)|0);
     $111=$110;
     $112=$106|1;
     $_sum67=$8|4;
     $113=(($109+$_sum67)|0);
     $114=$113;
     HEAP32[(($114)>>2)]=$112;
     $115=(($109+$105)|0);
     $116=$115;
     HEAP32[(($116)>>2)]=$106;
     $117=((HEAP32[((2416)>>2)])|0);
     $118=($117|0)==0;
     if (!($118)) {
      $120=((HEAP32[((2428)>>2)])|0);
      $121=$117>>>3;
      $122=$121<<1;
      $123=((2448+($122<<2))|0);
      $124=$123;
      $125=((HEAP32[((2408)>>2)])|0);
      $126=1<<$121;
      $127=$125&$126;
      $128=($127|0)==0;
      if ($128) {
       $130=$125|$126;
       HEAP32[((2408)>>2)]=$130;
       $_sum9_pre=((($122)+(2))|0);
       $_pre=((2448+($_sum9_pre<<2))|0);
       $F4_0=$124;$_pre_phi=$_pre;
      } else {
       $_sum10=((($122)+(2))|0);
       $132=((2448+($_sum10<<2))|0);
       $133=((HEAP32[(($132)>>2)])|0);
       $134=$133;
       $135=((HEAP32[((2424)>>2)])|0);
       $136=($134>>>0)<($135>>>0);
       if ($136) {
        _abort(); return ((0)|0);
        return ((0)|0);
       } else {
        $F4_0=$133;$_pre_phi=$132;
       }
      }


      HEAP32[(($_pre_phi)>>2)]=$120;
      $139=(($F4_0+12)|0);
      HEAP32[(($139)>>2)]=$120;
      $140=(($120+8)|0);
      HEAP32[(($140)>>2)]=$F4_0;
      $141=(($120+12)|0);
      HEAP32[(($141)>>2)]=$124;
     }
     HEAP32[((2416)>>2)]=$106;
     HEAP32[((2428)>>2)]=$111;
     $143=$88;
     $mem_0=$143;

     return (($mem_0)|0);
    }
    $145=((HEAP32[((2412)>>2)])|0);
    $146=($145|0)==0;
    if ($146) {
     $nb_0=$8;
    } else {
     $148=(((-$145))|0);
     $149=$145&$148;
     $150=((($149)-(1))|0);
     $151=$150>>>12;
     $152=$151&16;
     $153=$150>>>($152>>>0);
     $154=$153>>>5;
     $155=$154&8;
     $156=$155|$152;
     $157=$153>>>($155>>>0);
     $158=$157>>>2;
     $159=$158&4;
     $160=$156|$159;
     $161=$157>>>($159>>>0);
     $162=$161>>>1;
     $163=$162&2;
     $164=$160|$163;
     $165=$161>>>($163>>>0);
     $166=$165>>>1;
     $167=$166&1;
     $168=$164|$167;
     $169=$165>>>($167>>>0);
     $170=((($168)+($169))|0);
     $171=((2712+($170<<2))|0);
     $172=((HEAP32[(($171)>>2)])|0);
     $173=(($172+4)|0);
     $174=((HEAP32[(($173)>>2)])|0);
     $175=$174&-8;
     $176=((($175)-($8))|0);
     $t_0_i=$172;$v_0_i=$172;$rsize_0_i=$176;
     while(1) {



      $178=(($t_0_i+16)|0);
      $179=((HEAP32[(($178)>>2)])|0);
      $180=($179|0)==0;
      if ($180) {
       $182=(($t_0_i+20)|0);
       $183=((HEAP32[(($182)>>2)])|0);
       $184=($183|0)==0;
       if ($184) {
        break;
       } else {
        $185=$183;
       }
      } else {
       $185=$179;
      }

      $186=(($185+4)|0);
      $187=((HEAP32[(($186)>>2)])|0);
      $188=$187&-8;
      $189=((($188)-($8))|0);
      $190=($189>>>0)<($rsize_0_i>>>0);
      $_rsize_0_i=($190?$189:$rsize_0_i);
      $_v_0_i=($190?$185:$v_0_i);
      $t_0_i=$185;$v_0_i=$_v_0_i;$rsize_0_i=$_rsize_0_i;
     }
     $192=$v_0_i;
     $193=((HEAP32[((2424)>>2)])|0);
     $194=($192>>>0)<($193>>>0);
     if ($194) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $196=(($192+$8)|0);
     $197=$196;
     $198=($192>>>0)<($196>>>0);
     if (!($198)) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $200=(($v_0_i+24)|0);
     $201=((HEAP32[(($200)>>2)])|0);
     $202=(($v_0_i+12)|0);
     $203=((HEAP32[(($202)>>2)])|0);
     $204=($203|0)==($v_0_i|0);
     do {
      if ($204) {
       $220=(($v_0_i+20)|0);
       $221=((HEAP32[(($220)>>2)])|0);
       $222=($221|0)==0;
       if ($222) {
        $224=(($v_0_i+16)|0);
        $225=((HEAP32[(($224)>>2)])|0);
        $226=($225|0)==0;
        if ($226) {
         $R_1_i=0;
         break;
        } else {
         $R_0_i=$225;$RP_0_i=$224;
        }
       } else {
        $R_0_i=$221;$RP_0_i=$220;
       }
       while(1) {


        $227=(($R_0_i+20)|0);
        $228=((HEAP32[(($227)>>2)])|0);
        $229=($228|0)==0;
        if (!($229)) {
         $R_0_i=$228;$RP_0_i=$227;
         continue;
        }
        $231=(($R_0_i+16)|0);
        $232=((HEAP32[(($231)>>2)])|0);
        $233=($232|0)==0;
        if ($233) {
         break;
        } else {
         $R_0_i=$232;$RP_0_i=$231;
        }
       }
       $235=$RP_0_i;
       $236=($235>>>0)<($193>>>0);
       if ($236) {
        _abort(); return ((0)|0);
        return ((0)|0);
       } else {
        HEAP32[(($RP_0_i)>>2)]=0;
        $R_1_i=$R_0_i;
        break;
       }
      } else {
       $206=(($v_0_i+8)|0);
       $207=((HEAP32[(($206)>>2)])|0);
       $208=$207;
       $209=($208>>>0)<($193>>>0);
       if ($209) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $211=(($207+12)|0);
       $212=((HEAP32[(($211)>>2)])|0);
       $213=($212|0)==($v_0_i|0);
       if (!($213)) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $215=(($203+8)|0);
       $216=((HEAP32[(($215)>>2)])|0);
       $217=($216|0)==($v_0_i|0);
       if ($217) {
        HEAP32[(($211)>>2)]=$203;
        HEAP32[(($215)>>2)]=$207;
        $R_1_i=$203;
        break;
       } else {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
      }
     } while(0);

     $240=($201|0)==0;
     do {
      if (!($240)) {
       $242=(($v_0_i+28)|0);
       $243=((HEAP32[(($242)>>2)])|0);
       $244=((2712+($243<<2))|0);
       $245=((HEAP32[(($244)>>2)])|0);
       $246=($v_0_i|0)==($245|0);
       if ($246) {
        HEAP32[(($244)>>2)]=$R_1_i;
        $cond_i=($R_1_i|0)==0;
        if ($cond_i) {
         $248=1<<$243;
         $249=$248^-1;
         $250=((HEAP32[((2412)>>2)])|0);
         $251=$250&$249;
         HEAP32[((2412)>>2)]=$251;
         break;
        }
       } else {
        $253=$201;
        $254=((HEAP32[((2424)>>2)])|0);
        $255=($253>>>0)<($254>>>0);
        if ($255) {
         _abort(); return ((0)|0);
         return ((0)|0);
        }
        $257=(($201+16)|0);
        $258=((HEAP32[(($257)>>2)])|0);
        $259=($258|0)==($v_0_i|0);
        if ($259) {
         HEAP32[(($257)>>2)]=$R_1_i;
        } else {
         $262=(($201+20)|0);
         HEAP32[(($262)>>2)]=$R_1_i;
        }
        $265=($R_1_i|0)==0;
        if ($265) {
         break;
        }
       }
       $267=$R_1_i;
       $268=((HEAP32[((2424)>>2)])|0);
       $269=($267>>>0)<($268>>>0);
       if ($269) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $271=(($R_1_i+24)|0);
       HEAP32[(($271)>>2)]=$201;
       $272=(($v_0_i+16)|0);
       $273=((HEAP32[(($272)>>2)])|0);
       $274=($273|0)==0;
       do {
        if (!($274)) {
         $276=$273;
         $277=((HEAP32[((2424)>>2)])|0);
         $278=($276>>>0)<($277>>>0);
         if ($278) {
          _abort(); return ((0)|0);
          return ((0)|0);
         } else {
          $280=(($R_1_i+16)|0);
          HEAP32[(($280)>>2)]=$273;
          $281=(($273+24)|0);
          HEAP32[(($281)>>2)]=$R_1_i;
          break;
         }
        }
       } while(0);
       $284=(($v_0_i+20)|0);
       $285=((HEAP32[(($284)>>2)])|0);
       $286=($285|0)==0;
       if (!($286)) {
        $288=$285;
        $289=((HEAP32[((2424)>>2)])|0);
        $290=($288>>>0)<($289>>>0);
        if ($290) {
         _abort(); return ((0)|0);
         return ((0)|0);
        } else {
         $292=(($R_1_i+20)|0);
         HEAP32[(($292)>>2)]=$285;
         $293=(($285+24)|0);
         HEAP32[(($293)>>2)]=$R_1_i;
         break;
        }
       }
      }
     } while(0);
     $297=($rsize_0_i>>>0)<((16)>>>0);
     if ($297) {
      $299=((($rsize_0_i)+($8))|0);
      $300=$299|3;
      $301=(($v_0_i+4)|0);
      HEAP32[(($301)>>2)]=$300;
      $_sum4_i=((($299)+(4))|0);
      $302=(($192+$_sum4_i)|0);
      $303=$302;
      $304=((HEAP32[(($303)>>2)])|0);
      $305=$304|1;
      HEAP32[(($303)>>2)]=$305;
     } else {
      $307=$8|3;
      $308=(($v_0_i+4)|0);
      HEAP32[(($308)>>2)]=$307;
      $309=$rsize_0_i|1;
      $_sum_i37=$8|4;
      $310=(($192+$_sum_i37)|0);
      $311=$310;
      HEAP32[(($311)>>2)]=$309;
      $_sum1_i=((($rsize_0_i)+($8))|0);
      $312=(($192+$_sum1_i)|0);
      $313=$312;
      HEAP32[(($313)>>2)]=$rsize_0_i;
      $314=((HEAP32[((2416)>>2)])|0);
      $315=($314|0)==0;
      if (!($315)) {
       $317=((HEAP32[((2428)>>2)])|0);
       $318=$314>>>3;
       $319=$318<<1;
       $320=((2448+($319<<2))|0);
       $321=$320;
       $322=((HEAP32[((2408)>>2)])|0);
       $323=1<<$318;
       $324=$322&$323;
       $325=($324|0)==0;
       if ($325) {
        $327=$322|$323;
        HEAP32[((2408)>>2)]=$327;
        $_sum2_pre_i=((($319)+(2))|0);
        $_pre_i=((2448+($_sum2_pre_i<<2))|0);
        $F1_0_i=$321;$_pre_phi_i=$_pre_i;
       } else {
        $_sum3_i=((($319)+(2))|0);
        $329=((2448+($_sum3_i<<2))|0);
        $330=((HEAP32[(($329)>>2)])|0);
        $331=$330;
        $332=((HEAP32[((2424)>>2)])|0);
        $333=($331>>>0)<($332>>>0);
        if ($333) {
         _abort(); return ((0)|0);
         return ((0)|0);
        } else {
         $F1_0_i=$330;$_pre_phi_i=$329;
        }
       }


       HEAP32[(($_pre_phi_i)>>2)]=$317;
       $336=(($F1_0_i+12)|0);
       HEAP32[(($336)>>2)]=$317;
       $337=(($317+8)|0);
       HEAP32[(($337)>>2)]=$F1_0_i;
       $338=(($317+12)|0);
       HEAP32[(($338)>>2)]=$321;
      }
      HEAP32[((2416)>>2)]=$rsize_0_i;
      HEAP32[((2428)>>2)]=$197;
     }
     $341=(($v_0_i+8)|0);
     $342=$341;
     $mem_0=$342;

     return (($mem_0)|0);
    }
   } else {
    $nb_0=$8;
   }
  } else {
   $344=($bytes>>>0)>((4294967231)>>>0);
   if ($344) {
    $nb_0=-1;
   } else {
    $346=((($bytes)+(11))|0);
    $347=$346&-8;
    $348=((HEAP32[((2412)>>2)])|0);
    $349=($348|0)==0;
    if ($349) {
     $nb_0=$347;
    } else {
     $351=(((-$347))|0);
     $352=$346>>>8;
     $353=($352|0)==0;
     if ($353) {
      $idx_0_i=0;
     } else {
      $355=($347>>>0)>((16777215)>>>0);
      if ($355) {
       $idx_0_i=31;
      } else {
       $357=((($352)+(1048320))|0);
       $358=$357>>>16;
       $359=$358&8;
       $360=$352<<$359;
       $361=((($360)+(520192))|0);
       $362=$361>>>16;
       $363=$362&4;
       $364=$363|$359;
       $365=$360<<$363;
       $366=((($365)+(245760))|0);
       $367=$366>>>16;
       $368=$367&2;
       $369=$364|$368;
       $370=(((14)-($369))|0);
       $371=$365<<$368;
       $372=$371>>>15;
       $373=((($370)+($372))|0);
       $374=$373<<1;
       $375=((($373)+(7))|0);
       $376=$347>>>($375>>>0);
       $377=$376&1;
       $378=$377|$374;
       $idx_0_i=$378;
      }
     }

     $380=((2712+($idx_0_i<<2))|0);
     $381=((HEAP32[(($380)>>2)])|0);
     $382=($381|0)==0;
     L9: do {
      if ($382) {
       $v_2_i=0;$rsize_2_i=$351;$t_1_i=0;
      } else {
       $384=($idx_0_i|0)==31;
       if ($384) {
        $389=0;
       } else {
        $386=$idx_0_i>>>1;
        $387=(((25)-($386))|0);
        $389=$387;
       }

       $390=$347<<$389;
       $v_0_i18=0;$rsize_0_i17=$351;$t_0_i16=$381;$sizebits_0_i=$390;$rst_0_i=0;
       while(1) {





        $392=(($t_0_i16+4)|0);
        $393=((HEAP32[(($392)>>2)])|0);
        $394=$393&-8;
        $395=((($394)-($347))|0);
        $396=($395>>>0)<($rsize_0_i17>>>0);
        if ($396) {
         $398=($394|0)==($347|0);
         if ($398) {
          $v_2_i=$t_0_i16;$rsize_2_i=$395;$t_1_i=$t_0_i16;
          break L9;
         } else {
          $v_1_i=$t_0_i16;$rsize_1_i=$395;
         }
        } else {
         $v_1_i=$v_0_i18;$rsize_1_i=$rsize_0_i17;
        }


        $400=(($t_0_i16+20)|0);
        $401=((HEAP32[(($400)>>2)])|0);
        $402=$sizebits_0_i>>>31;
        $403=(($t_0_i16+16+($402<<2))|0);
        $404=((HEAP32[(($403)>>2)])|0);
        $405=($401|0)==0;
        $406=($401|0)==($404|0);
        $or_cond_i=$405|$406;
        $rst_1_i=($or_cond_i?$rst_0_i:$401);
        $407=($404|0)==0;
        $408=$sizebits_0_i<<1;
        if ($407) {
         $v_2_i=$v_1_i;$rsize_2_i=$rsize_1_i;$t_1_i=$rst_1_i;
         break;
        } else {
         $v_0_i18=$v_1_i;$rsize_0_i17=$rsize_1_i;$t_0_i16=$404;$sizebits_0_i=$408;$rst_0_i=$rst_1_i;
        }
       }
      }
     } while(0);



     $409=($t_1_i|0)==0;
     $410=($v_2_i|0)==0;
     $or_cond21_i=$409&$410;
     if ($or_cond21_i) {
      $412=2<<$idx_0_i;
      $413=(((-$412))|0);
      $414=$412|$413;
      $415=$348&$414;
      $416=($415|0)==0;
      if ($416) {
       $nb_0=$347;
       break;
      }
      $418=(((-$415))|0);
      $419=$415&$418;
      $420=((($419)-(1))|0);
      $421=$420>>>12;
      $422=$421&16;
      $423=$420>>>($422>>>0);
      $424=$423>>>5;
      $425=$424&8;
      $426=$425|$422;
      $427=$423>>>($425>>>0);
      $428=$427>>>2;
      $429=$428&4;
      $430=$426|$429;
      $431=$427>>>($429>>>0);
      $432=$431>>>1;
      $433=$432&2;
      $434=$430|$433;
      $435=$431>>>($433>>>0);
      $436=$435>>>1;
      $437=$436&1;
      $438=$434|$437;
      $439=$435>>>($437>>>0);
      $440=((($438)+($439))|0);
      $441=((2712+($440<<2))|0);
      $442=((HEAP32[(($441)>>2)])|0);
      $t_2_ph_i=$442;
     } else {
      $t_2_ph_i=$t_1_i;
     }

     $443=($t_2_ph_i|0)==0;
     if ($443) {
      $rsize_3_lcssa_i=$rsize_2_i;$v_3_lcssa_i=$v_2_i;
     } else {
      $t_230_i=$t_2_ph_i;$rsize_331_i=$rsize_2_i;$v_332_i=$v_2_i;
      while(1) {



       $444=(($t_230_i+4)|0);
       $445=((HEAP32[(($444)>>2)])|0);
       $446=$445&-8;
       $447=((($446)-($347))|0);
       $448=($447>>>0)<($rsize_331_i>>>0);
       $_rsize_3_i=($448?$447:$rsize_331_i);
       $t_2_v_3_i=($448?$t_230_i:$v_332_i);
       $449=(($t_230_i+16)|0);
       $450=((HEAP32[(($449)>>2)])|0);
       $451=($450|0)==0;
       if (!($451)) {
        $t_230_i=$450;$rsize_331_i=$_rsize_3_i;$v_332_i=$t_2_v_3_i;
        continue;
       }
       $452=(($t_230_i+20)|0);
       $453=((HEAP32[(($452)>>2)])|0);
       $454=($453|0)==0;
       if ($454) {
        $rsize_3_lcssa_i=$_rsize_3_i;$v_3_lcssa_i=$t_2_v_3_i;
        break;
       } else {
        $t_230_i=$453;$rsize_331_i=$_rsize_3_i;$v_332_i=$t_2_v_3_i;
       }
      }
     }


     $455=($v_3_lcssa_i|0)==0;
     if ($455) {
      $nb_0=$347;
     } else {
      $457=((HEAP32[((2416)>>2)])|0);
      $458=((($457)-($347))|0);
      $459=($rsize_3_lcssa_i>>>0)<($458>>>0);
      if ($459) {
       $461=$v_3_lcssa_i;
       $462=((HEAP32[((2424)>>2)])|0);
       $463=($461>>>0)<($462>>>0);
       if ($463) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $465=(($461+$347)|0);
       $466=$465;
       $467=($461>>>0)<($465>>>0);
       if (!($467)) {
        _abort(); return ((0)|0);
        return ((0)|0);
       }
       $469=(($v_3_lcssa_i+24)|0);
       $470=((HEAP32[(($469)>>2)])|0);
       $471=(($v_3_lcssa_i+12)|0);
       $472=((HEAP32[(($471)>>2)])|0);
       $473=($472|0)==($v_3_lcssa_i|0);
       do {
        if ($473) {
         $489=(($v_3_lcssa_i+20)|0);
         $490=((HEAP32[(($489)>>2)])|0);
         $491=($490|0)==0;
         if ($491) {
          $493=(($v_3_lcssa_i+16)|0);
          $494=((HEAP32[(($493)>>2)])|0);
          $495=($494|0)==0;
          if ($495) {
           $R_1_i22=0;
           break;
          } else {
           $R_0_i20=$494;$RP_0_i19=$493;
          }
         } else {
          $R_0_i20=$490;$RP_0_i19=$489;
         }
         while(1) {


          $496=(($R_0_i20+20)|0);
          $497=((HEAP32[(($496)>>2)])|0);
          $498=($497|0)==0;
          if (!($498)) {
           $R_0_i20=$497;$RP_0_i19=$496;
           continue;
          }
          $500=(($R_0_i20+16)|0);
          $501=((HEAP32[(($500)>>2)])|0);
          $502=($501|0)==0;
          if ($502) {
           break;
          } else {
           $R_0_i20=$501;$RP_0_i19=$500;
          }
         }
         $504=$RP_0_i19;
         $505=($504>>>0)<($462>>>0);
         if ($505) {
          _abort(); return ((0)|0);
          return ((0)|0);
         } else {
          HEAP32[(($RP_0_i19)>>2)]=0;
          $R_1_i22=$R_0_i20;
          break;
         }
        } else {
         $475=(($v_3_lcssa_i+8)|0);
         $476=((HEAP32[(($475)>>2)])|0);
         $477=$476;
         $478=($477>>>0)<($462>>>0);
         if ($478) {
          _abort(); return ((0)|0);
          return ((0)|0);
         }
         $480=(($476+12)|0);
         $481=((HEAP32[(($480)>>2)])|0);
         $482=($481|0)==($v_3_lcssa_i|0);
         if (!($482)) {
          _abort(); return ((0)|0);
          return ((0)|0);
         }
         $484=(($472+8)|0);
         $485=((HEAP32[(($484)>>2)])|0);
         $486=($485|0)==($v_3_lcssa_i|0);
         if ($486) {
          HEAP32[(($480)>>2)]=$472;
          HEAP32[(($484)>>2)]=$476;
          $R_1_i22=$472;
          break;
         } else {
          _abort(); return ((0)|0);
          return ((0)|0);
         }
        }
       } while(0);

       $509=($470|0)==0;
       do {
        if (!($509)) {
         $511=(($v_3_lcssa_i+28)|0);
         $512=((HEAP32[(($511)>>2)])|0);
         $513=((2712+($512<<2))|0);
         $514=((HEAP32[(($513)>>2)])|0);
         $515=($v_3_lcssa_i|0)==($514|0);
         if ($515) {
          HEAP32[(($513)>>2)]=$R_1_i22;
          $cond_i23=($R_1_i22|0)==0;
          if ($cond_i23) {
           $517=1<<$512;
           $518=$517^-1;
           $519=((HEAP32[((2412)>>2)])|0);
           $520=$519&$518;
           HEAP32[((2412)>>2)]=$520;
           break;
          }
         } else {
          $522=$470;
          $523=((HEAP32[((2424)>>2)])|0);
          $524=($522>>>0)<($523>>>0);
          if ($524) {
           _abort(); return ((0)|0);
           return ((0)|0);
          }
          $526=(($470+16)|0);
          $527=((HEAP32[(($526)>>2)])|0);
          $528=($527|0)==($v_3_lcssa_i|0);
          if ($528) {
           HEAP32[(($526)>>2)]=$R_1_i22;
          } else {
           $531=(($470+20)|0);
           HEAP32[(($531)>>2)]=$R_1_i22;
          }
          $534=($R_1_i22|0)==0;
          if ($534) {
           break;
          }
         }
         $536=$R_1_i22;
         $537=((HEAP32[((2424)>>2)])|0);
         $538=($536>>>0)<($537>>>0);
         if ($538) {
          _abort(); return ((0)|0);
          return ((0)|0);
         }
         $540=(($R_1_i22+24)|0);
         HEAP32[(($540)>>2)]=$470;
         $541=(($v_3_lcssa_i+16)|0);
         $542=((HEAP32[(($541)>>2)])|0);
         $543=($542|0)==0;
         do {
          if (!($543)) {
           $545=$542;
           $546=((HEAP32[((2424)>>2)])|0);
           $547=($545>>>0)<($546>>>0);
           if ($547) {
            _abort(); return ((0)|0);
            return ((0)|0);
           } else {
            $549=(($R_1_i22+16)|0);
            HEAP32[(($549)>>2)]=$542;
            $550=(($542+24)|0);
            HEAP32[(($550)>>2)]=$R_1_i22;
            break;
           }
          }
         } while(0);
         $553=(($v_3_lcssa_i+20)|0);
         $554=((HEAP32[(($553)>>2)])|0);
         $555=($554|0)==0;
         if (!($555)) {
          $557=$554;
          $558=((HEAP32[((2424)>>2)])|0);
          $559=($557>>>0)<($558>>>0);
          if ($559) {
           _abort(); return ((0)|0);
           return ((0)|0);
          } else {
           $561=(($R_1_i22+20)|0);
           HEAP32[(($561)>>2)]=$554;
           $562=(($554+24)|0);
           HEAP32[(($562)>>2)]=$R_1_i22;
           break;
          }
         }
        }
       } while(0);
       $566=($rsize_3_lcssa_i>>>0)<((16)>>>0);
       L87: do {
        if ($566) {
         $568=((($rsize_3_lcssa_i)+($347))|0);
         $569=$568|3;
         $570=(($v_3_lcssa_i+4)|0);
         HEAP32[(($570)>>2)]=$569;
         $_sum19_i=((($568)+(4))|0);
         $571=(($461+$_sum19_i)|0);
         $572=$571;
         $573=((HEAP32[(($572)>>2)])|0);
         $574=$573|1;
         HEAP32[(($572)>>2)]=$574;
        } else {
         $576=$347|3;
         $577=(($v_3_lcssa_i+4)|0);
         HEAP32[(($577)>>2)]=$576;
         $578=$rsize_3_lcssa_i|1;
         $_sum_i2536=$347|4;
         $579=(($461+$_sum_i2536)|0);
         $580=$579;
         HEAP32[(($580)>>2)]=$578;
         $_sum1_i26=((($rsize_3_lcssa_i)+($347))|0);
         $581=(($461+$_sum1_i26)|0);
         $582=$581;
         HEAP32[(($582)>>2)]=$rsize_3_lcssa_i;
         $583=$rsize_3_lcssa_i>>>3;
         $584=($rsize_3_lcssa_i>>>0)<((256)>>>0);
         if ($584) {
          $586=$583<<1;
          $587=((2448+($586<<2))|0);
          $588=$587;
          $589=((HEAP32[((2408)>>2)])|0);
          $590=1<<$583;
          $591=$589&$590;
          $592=($591|0)==0;
          if ($592) {
           $594=$589|$590;
           HEAP32[((2408)>>2)]=$594;
           $_sum15_pre_i=((($586)+(2))|0);
           $_pre_i27=((2448+($_sum15_pre_i<<2))|0);
           $F5_0_i=$588;$_pre_phi_i28=$_pre_i27;
          } else {
           $_sum18_i=((($586)+(2))|0);
           $596=((2448+($_sum18_i<<2))|0);
           $597=((HEAP32[(($596)>>2)])|0);
           $598=$597;
           $599=((HEAP32[((2424)>>2)])|0);
           $600=($598>>>0)<($599>>>0);
           if ($600) {
            _abort(); return ((0)|0);
            return ((0)|0);
           } else {
            $F5_0_i=$597;$_pre_phi_i28=$596;
           }
          }


          HEAP32[(($_pre_phi_i28)>>2)]=$466;
          $603=(($F5_0_i+12)|0);
          HEAP32[(($603)>>2)]=$466;
          $_sum16_i=((($347)+(8))|0);
          $604=(($461+$_sum16_i)|0);
          $605=$604;
          HEAP32[(($605)>>2)]=$F5_0_i;
          $_sum17_i=((($347)+(12))|0);
          $606=(($461+$_sum17_i)|0);
          $607=$606;
          HEAP32[(($607)>>2)]=$588;
          break;
         }
         $609=$465;
         $610=$rsize_3_lcssa_i>>>8;
         $611=($610|0)==0;
         if ($611) {
          $I7_0_i=0;
         } else {
          $613=($rsize_3_lcssa_i>>>0)>((16777215)>>>0);
          if ($613) {
           $I7_0_i=31;
          } else {
           $615=((($610)+(1048320))|0);
           $616=$615>>>16;
           $617=$616&8;
           $618=$610<<$617;
           $619=((($618)+(520192))|0);
           $620=$619>>>16;
           $621=$620&4;
           $622=$621|$617;
           $623=$618<<$621;
           $624=((($623)+(245760))|0);
           $625=$624>>>16;
           $626=$625&2;
           $627=$622|$626;
           $628=(((14)-($627))|0);
           $629=$623<<$626;
           $630=$629>>>15;
           $631=((($628)+($630))|0);
           $632=$631<<1;
           $633=((($631)+(7))|0);
           $634=$rsize_3_lcssa_i>>>($633>>>0);
           $635=$634&1;
           $636=$635|$632;
           $I7_0_i=$636;
          }
         }

         $638=((2712+($I7_0_i<<2))|0);
         $_sum2_i=((($347)+(28))|0);
         $639=(($461+$_sum2_i)|0);
         $640=$639;
         HEAP32[(($640)>>2)]=$I7_0_i;
         $_sum3_i29=((($347)+(16))|0);
         $641=(($461+$_sum3_i29)|0);
         $_sum4_i30=((($347)+(20))|0);
         $642=(($461+$_sum4_i30)|0);
         $643=$642;
         HEAP32[(($643)>>2)]=0;
         $644=$641;
         HEAP32[(($644)>>2)]=0;
         $645=((HEAP32[((2412)>>2)])|0);
         $646=1<<$I7_0_i;
         $647=$645&$646;
         $648=($647|0)==0;
         if ($648) {
          $650=$645|$646;
          HEAP32[((2412)>>2)]=$650;
          HEAP32[(($638)>>2)]=$609;
          $651=$638;
          $_sum5_i=((($347)+(24))|0);
          $652=(($461+$_sum5_i)|0);
          $653=$652;
          HEAP32[(($653)>>2)]=$651;
          $_sum6_i=((($347)+(12))|0);
          $654=(($461+$_sum6_i)|0);
          $655=$654;
          HEAP32[(($655)>>2)]=$609;
          $_sum7_i=((($347)+(8))|0);
          $656=(($461+$_sum7_i)|0);
          $657=$656;
          HEAP32[(($657)>>2)]=$609;
          break;
         }
         $659=((HEAP32[(($638)>>2)])|0);
         $660=($I7_0_i|0)==31;
         if ($660) {
          $665=0;
         } else {
          $662=$I7_0_i>>>1;
          $663=(((25)-($662))|0);
          $665=$663;
         }

         $666=(($659+4)|0);
         $667=((HEAP32[(($666)>>2)])|0);
         $668=$667&-8;
         $669=($668|0)==($rsize_3_lcssa_i|0);
         L108: do {
          if ($669) {
           $T_0_lcssa_i=$659;
          } else {
           $670=$rsize_3_lcssa_i<<$665;
           $T_026_i=$659;$K12_027_i=$670;
           while(1) {


            $678=$K12_027_i>>>31;
            $679=(($T_026_i+16+($678<<2))|0);
            $680=((HEAP32[(($679)>>2)])|0);
            $681=($680|0)==0;
            if ($681) {
             break;
            }
            $672=$K12_027_i<<1;
            $673=(($680+4)|0);
            $674=((HEAP32[(($673)>>2)])|0);
            $675=$674&-8;
            $676=($675|0)==($rsize_3_lcssa_i|0);
            if ($676) {
             $T_0_lcssa_i=$680;
             break L108;
            } else {
             $T_026_i=$680;$K12_027_i=$672;
            }
           }
           $683=$679;
           $684=((HEAP32[((2424)>>2)])|0);
           $685=($683>>>0)<($684>>>0);
           if ($685) {
            _abort(); return ((0)|0);
            return ((0)|0);
           } else {
            HEAP32[(($679)>>2)]=$609;
            $_sum12_i=((($347)+(24))|0);
            $687=(($461+$_sum12_i)|0);
            $688=$687;
            HEAP32[(($688)>>2)]=$T_026_i;
            $_sum13_i=((($347)+(12))|0);
            $689=(($461+$_sum13_i)|0);
            $690=$689;
            HEAP32[(($690)>>2)]=$609;
            $_sum14_i=((($347)+(8))|0);
            $691=(($461+$_sum14_i)|0);
            $692=$691;
            HEAP32[(($692)>>2)]=$609;
            break L87;
           }
          }
         } while(0);

         $694=(($T_0_lcssa_i+8)|0);
         $695=((HEAP32[(($694)>>2)])|0);
         $696=$T_0_lcssa_i;
         $697=((HEAP32[((2424)>>2)])|0);
         $698=($696>>>0)<($697>>>0);
         if ($698) {
          _abort(); return ((0)|0);
          return ((0)|0);
         }
         $700=$695;
         $701=($700>>>0)<($697>>>0);
         if ($701) {
          _abort(); return ((0)|0);
          return ((0)|0);
         } else {
          $703=(($695+12)|0);
          HEAP32[(($703)>>2)]=$609;
          HEAP32[(($694)>>2)]=$609;
          $_sum9_i=((($347)+(8))|0);
          $704=(($461+$_sum9_i)|0);
          $705=$704;
          HEAP32[(($705)>>2)]=$695;
          $_sum10_i=((($347)+(12))|0);
          $706=(($461+$_sum10_i)|0);
          $707=$706;
          HEAP32[(($707)>>2)]=$T_0_lcssa_i;
          $_sum11_i=((($347)+(24))|0);
          $708=(($461+$_sum11_i)|0);
          $709=$708;
          HEAP32[(($709)>>2)]=0;
          break;
         }
        }
       } while(0);
       $711=(($v_3_lcssa_i+8)|0);
       $712=$711;
       $mem_0=$712;

       return (($mem_0)|0);
      } else {
       $nb_0=$347;
      }
     }
    }
   }
  }
 } while(0);

 $713=((HEAP32[((2416)>>2)])|0);
 $714=($nb_0>>>0)>($713>>>0);
 if (!($714)) {
  $716=((($713)-($nb_0))|0);
  $717=((HEAP32[((2428)>>2)])|0);
  $718=($716>>>0)>((15)>>>0);
  if ($718) {
   $720=$717;
   $721=(($720+$nb_0)|0);
   $722=$721;
   HEAP32[((2428)>>2)]=$722;
   HEAP32[((2416)>>2)]=$716;
   $723=$716|1;
   $_sum2=((($nb_0)+(4))|0);
   $724=(($720+$_sum2)|0);
   $725=$724;
   HEAP32[(($725)>>2)]=$723;
   $726=(($720+$713)|0);
   $727=$726;
   HEAP32[(($727)>>2)]=$716;
   $728=$nb_0|3;
   $729=(($717+4)|0);
   HEAP32[(($729)>>2)]=$728;
  } else {
   HEAP32[((2416)>>2)]=0;
   HEAP32[((2428)>>2)]=0;
   $731=$713|3;
   $732=(($717+4)|0);
   HEAP32[(($732)>>2)]=$731;
   $733=$717;
   $_sum1=((($713)+(4))|0);
   $734=(($733+$_sum1)|0);
   $735=$734;
   $736=((HEAP32[(($735)>>2)])|0);
   $737=$736|1;
   HEAP32[(($735)>>2)]=$737;
  }
  $739=(($717+8)|0);
  $740=$739;
  $mem_0=$740;

  return (($mem_0)|0);
 }
 $742=((HEAP32[((2420)>>2)])|0);
 $743=($nb_0>>>0)<($742>>>0);
 if ($743) {
  $745=((($742)-($nb_0))|0);
  HEAP32[((2420)>>2)]=$745;
  $746=((HEAP32[((2432)>>2)])|0);
  $747=$746;
  $748=(($747+$nb_0)|0);
  $749=$748;
  HEAP32[((2432)>>2)]=$749;
  $750=$745|1;
  $_sum=((($nb_0)+(4))|0);
  $751=(($747+$_sum)|0);
  $752=$751;
  HEAP32[(($752)>>2)]=$750;
  $753=$nb_0|3;
  $754=(($746+4)|0);
  HEAP32[(($754)>>2)]=$753;
  $755=(($746+8)|0);
  $756=$755;
  $mem_0=$756;

  return (($mem_0)|0);
 }
 $758=((HEAP32[((2376)>>2)])|0);
 $759=($758|0)==0;
 do {
  if ($759) {
   $761=((_sysconf(((30)|0)))|0);
   $762=((($761)-(1))|0);
   $763=$762&$761;
   $764=($763|0)==0;
   if ($764) {
    HEAP32[((2384)>>2)]=$761;
    HEAP32[((2380)>>2)]=$761;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $766=((_time(((0)|0)))|0);
    $767=$766&-16;
    $768=$767^1431655768;
    HEAP32[((2376)>>2)]=$768;
    break;
   } else {
    _abort(); return ((0)|0);
    return ((0)|0);
   }
  }
 } while(0);
 $770=((($nb_0)+(48))|0);
 $771=((HEAP32[((2384)>>2)])|0);
 $772=((($nb_0)+(47))|0);
 $773=((($771)+($772))|0);
 $774=(((-$771))|0);
 $775=$773&$774;
 $776=($775>>>0)>($nb_0>>>0);
 if (!($776)) {
  $mem_0=0;

  return (($mem_0)|0);
 }
 $778=((HEAP32[((2848)>>2)])|0);
 $779=($778|0)==0;
 if (!($779)) {
  $781=((HEAP32[((2840)>>2)])|0);
  $782=((($781)+($775))|0);
  $783=($782>>>0)<=($781>>>0);
  $784=($782>>>0)>($778>>>0);
  $or_cond1_i=$783|$784;
  if ($or_cond1_i) {
   $mem_0=0;

   return (($mem_0)|0);
  }
 }
 $786=((HEAP32[((2852)>>2)])|0);
 $787=$786&4;
 $788=($787|0)==0;
 L269: do {
  if ($788) {
   $790=((HEAP32[((2432)>>2)])|0);
   $791=($790|0)==0;
   L271: do {
    if ($791) {
     label = 182;
    } else {
     $793=$790;
     $sp_0_i_i=2856;
     while(1) {

      $795=(($sp_0_i_i)|0);
      $796=((HEAP32[(($795)>>2)])|0);
      $797=($796>>>0)>($793>>>0);
      if (!($797)) {
       $799=(($sp_0_i_i+4)|0);
       $800=((HEAP32[(($799)>>2)])|0);
       $801=(($796+$800)|0);
       $802=($801>>>0)>($793>>>0);
       if ($802) {
        break;
       }
      }
      $804=(($sp_0_i_i+8)|0);
      $805=((HEAP32[(($804)>>2)])|0);
      $806=($805|0)==0;
      if ($806) {
       label = 182;
       break L271;
      } else {
       $sp_0_i_i=$805;
      }
     }
     $807=($sp_0_i_i|0)==0;
     if ($807) {
      label = 182;
     } else {
      $837=((HEAP32[((2420)>>2)])|0);
      $838=((($773)-($837))|0);
      $839=$838&$774;
      $840=($839>>>0)<((2147483647)>>>0);
      if ($840) {
       $842=((_sbrk((($839)|0)))|0);
       $843=((HEAP32[(($795)>>2)])|0);
       $844=((HEAP32[(($799)>>2)])|0);
       $845=(($843+$844)|0);
       $846=($842|0)==($845|0);
       $_3_i=($846?$839:0);
       $_4_i=($846?$842:-1);
       $tbase_0_i=$_4_i;$tsize_0_i=$_3_i;$br_0_i=$842;$ssize_1_i=$839;
       label = 191;
      } else {
       $tsize_0323841_i=0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 182) {
     $808=((_sbrk(((0)|0)))|0);
     $809=($808|0)==-1;
     if ($809) {
      $tsize_0323841_i=0;
     } else {
      $811=$808;
      $812=((HEAP32[((2380)>>2)])|0);
      $813=((($812)-(1))|0);
      $814=$813&$811;
      $815=($814|0)==0;
      if ($815) {
       $ssize_0_i=$775;
      } else {
       $817=((($813)+($811))|0);
       $818=(((-$812))|0);
       $819=$817&$818;
       $820=((($775)-($811))|0);
       $821=((($820)+($819))|0);
       $ssize_0_i=$821;
      }

      $823=((HEAP32[((2840)>>2)])|0);
      $824=((($823)+($ssize_0_i))|0);
      $825=($ssize_0_i>>>0)>($nb_0>>>0);
      $826=($ssize_0_i>>>0)<((2147483647)>>>0);
      $or_cond_i31=$825&$826;
      if ($or_cond_i31) {
       $828=((HEAP32[((2848)>>2)])|0);
       $829=($828|0)==0;
       if (!($829)) {
        $831=($824>>>0)<=($823>>>0);
        $832=($824>>>0)>($828>>>0);
        $or_cond2_i=$831|$832;
        if ($or_cond2_i) {
         $tsize_0323841_i=0;
         break;
        }
       }
       $834=((_sbrk((($ssize_0_i)|0)))|0);
       $835=($834|0)==($808|0);
       $ssize_0__i=($835?$ssize_0_i:0);
       $__i=($835?$808:-1);
       $tbase_0_i=$__i;$tsize_0_i=$ssize_0__i;$br_0_i=$834;$ssize_1_i=$ssize_0_i;
       label = 191;
      } else {
       $tsize_0323841_i=0;
      }
     }
    }
   } while(0);
   L291: do {
    if ((label|0) == 191) {




     $848=(((-$ssize_1_i))|0);
     $849=($tbase_0_i|0)==-1;
     if (!($849)) {
      $tsize_246_i=$tsize_0_i;$tbase_247_i=$tbase_0_i;
      label = 202;
      break L269;
     }
     $851=($br_0_i|0)!=-1;
     $852=($ssize_1_i>>>0)<((2147483647)>>>0);
     $or_cond5_i=$851&$852;
     $853=($ssize_1_i>>>0)<($770>>>0);
     $or_cond6_i=$or_cond5_i&$853;
     do {
      if ($or_cond6_i) {
       $855=((HEAP32[((2384)>>2)])|0);
       $856=((($772)-($ssize_1_i))|0);
       $857=((($856)+($855))|0);
       $858=(((-$855))|0);
       $859=$857&$858;
       $860=($859>>>0)<((2147483647)>>>0);
       if ($860) {
        $862=((_sbrk((($859)|0)))|0);
        $863=($862|0)==-1;
        if ($863) {
         $867=((_sbrk((($848)|0)))|0);
         $tsize_0323841_i=$tsize_0_i;
         break L291;
        } else {
         $865=((($859)+($ssize_1_i))|0);
         $ssize_2_i=$865;
         break;
        }
       } else {
        $ssize_2_i=$ssize_1_i;
       }
      } else {
       $ssize_2_i=$ssize_1_i;
      }
     } while(0);

     $869=($br_0_i|0)==-1;
     if ($869) {
      $tsize_0323841_i=$tsize_0_i;
     } else {
      $tsize_246_i=$ssize_2_i;$tbase_247_i=$br_0_i;
      label = 202;
      break L269;
     }
    }
   } while(0);

   $870=((HEAP32[((2852)>>2)])|0);
   $871=$870|4;
   HEAP32[((2852)>>2)]=$871;
   $tsize_1_i=$tsize_0323841_i;
   label = 199;
  } else {
   $tsize_1_i=0;
   label = 199;
  }
 } while(0);
 if ((label|0) == 199) {

  $873=($775>>>0)<((2147483647)>>>0);
  if ($873) {
   $875=((_sbrk((($775)|0)))|0);
   $876=((_sbrk(((0)|0)))|0);
   $notlhs_i=($875|0)!=-1;
   $notrhs_i=($876|0)!=-1;
   $or_cond8_not_i=$notrhs_i&$notlhs_i;
   $877=($875>>>0)<($876>>>0);
   $or_cond9_i=$or_cond8_not_i&$877;
   if ($or_cond9_i) {
    $878=$876;
    $879=$875;
    $880=((($878)-($879))|0);
    $881=((($nb_0)+(40))|0);
    $882=($880>>>0)>($881>>>0);
    $_tsize_1_i=($882?$880:$tsize_1_i);
    if ($882) {
     $tsize_246_i=$_tsize_1_i;$tbase_247_i=$875;
     label = 202;
    }
   }
  }
 }
 if ((label|0) == 202) {


  $883=((HEAP32[((2840)>>2)])|0);
  $884=((($883)+($tsize_246_i))|0);
  HEAP32[((2840)>>2)]=$884;
  $885=((HEAP32[((2844)>>2)])|0);
  $886=($884>>>0)>($885>>>0);
  if ($886) {
   HEAP32[((2844)>>2)]=$884;
  }
  $888=((HEAP32[((2432)>>2)])|0);
  $889=($888|0)==0;
  L311: do {
   if ($889) {
    $891=((HEAP32[((2424)>>2)])|0);
    $892=($891|0)==0;
    $893=($tbase_247_i>>>0)<($891>>>0);
    $or_cond10_i=$892|$893;
    if ($or_cond10_i) {
     HEAP32[((2424)>>2)]=$tbase_247_i;
    }
    HEAP32[((2856)>>2)]=$tbase_247_i;
    HEAP32[((2860)>>2)]=$tsize_246_i;
    HEAP32[((2868)>>2)]=0;
    $895=((HEAP32[((2376)>>2)])|0);
    HEAP32[((2444)>>2)]=$895;
    HEAP32[((2440)>>2)]=-1;
    $i_02_i_i=0;
    while(1) {

     $897=$i_02_i_i<<1;
     $898=((2448+($897<<2))|0);
     $899=$898;
     $_sum_i_i=((($897)+(3))|0);
     $900=((2448+($_sum_i_i<<2))|0);
     HEAP32[(($900)>>2)]=$899;
     $_sum1_i_i=((($897)+(2))|0);
     $901=((2448+($_sum1_i_i<<2))|0);
     HEAP32[(($901)>>2)]=$899;
     $902=((($i_02_i_i)+(1))|0);
     $903=($902>>>0)<((32)>>>0);
     if ($903) {
      $i_02_i_i=$902;
     } else {
      break;
     }
    }
    $904=((($tsize_246_i)-(40))|0);
    $905=(($tbase_247_i+8)|0);
    $906=$905;
    $907=$906&7;
    $908=($907|0)==0;
    if ($908) {
     $912=0;
    } else {
     $910=(((-$906))|0);
     $911=$910&7;
     $912=$911;
    }

    $913=(($tbase_247_i+$912)|0);
    $914=$913;
    $915=((($904)-($912))|0);
    HEAP32[((2432)>>2)]=$914;
    HEAP32[((2420)>>2)]=$915;
    $916=$915|1;
    $_sum_i14_i=((($912)+(4))|0);
    $917=(($tbase_247_i+$_sum_i14_i)|0);
    $918=$917;
    HEAP32[(($918)>>2)]=$916;
    $_sum2_i_i=((($tsize_246_i)-(36))|0);
    $919=(($tbase_247_i+$_sum2_i_i)|0);
    $920=$919;
    HEAP32[(($920)>>2)]=40;
    $921=((HEAP32[((2392)>>2)])|0);
    HEAP32[((2436)>>2)]=$921;
   } else {
    $sp_075_i=2856;
    while(1) {

     $922=(($sp_075_i)|0);
     $923=((HEAP32[(($922)>>2)])|0);
     $924=(($sp_075_i+4)|0);
     $925=((HEAP32[(($924)>>2)])|0);
     $926=(($923+$925)|0);
     $927=($tbase_247_i|0)==($926|0);
     if ($927) {
      label = 214;
      break;
     }
     $929=(($sp_075_i+8)|0);
     $930=((HEAP32[(($929)>>2)])|0);
     $931=($930|0)==0;
     if ($931) {
      break;
     } else {
      $sp_075_i=$930;
     }
    }
    if ((label|0) == 214) {
     $932=(($sp_075_i+12)|0);
     $933=((HEAP32[(($932)>>2)])|0);
     $934=$933&8;
     $935=($934|0)==0;
     if ($935) {
      $937=$888;
      $938=($937>>>0)>=($923>>>0);
      $939=($937>>>0)<($tbase_247_i>>>0);
      $or_cond49_i=$938&$939;
      if ($or_cond49_i) {
       $941=((($925)+($tsize_246_i))|0);
       HEAP32[(($924)>>2)]=$941;
       $942=((HEAP32[((2420)>>2)])|0);
       $943=((($942)+($tsize_246_i))|0);
       $944=(($888+8)|0);
       $945=$944;
       $946=$945&7;
       $947=($946|0)==0;
       if ($947) {
        $951=0;
       } else {
        $949=(((-$945))|0);
        $950=$949&7;
        $951=$950;
       }

       $952=(($937+$951)|0);
       $953=$952;
       $954=((($943)-($951))|0);
       HEAP32[((2432)>>2)]=$953;
       HEAP32[((2420)>>2)]=$954;
       $955=$954|1;
       $_sum_i18_i=((($951)+(4))|0);
       $956=(($937+$_sum_i18_i)|0);
       $957=$956;
       HEAP32[(($957)>>2)]=$955;
       $_sum2_i19_i=((($943)+(4))|0);
       $958=(($937+$_sum2_i19_i)|0);
       $959=$958;
       HEAP32[(($959)>>2)]=40;
       $960=((HEAP32[((2392)>>2)])|0);
       HEAP32[((2436)>>2)]=$960;
       break;
      }
     }
    }
    $961=((HEAP32[((2424)>>2)])|0);
    $962=($tbase_247_i>>>0)<($961>>>0);
    if ($962) {
     HEAP32[((2424)>>2)]=$tbase_247_i;
    }
    $964=(($tbase_247_i+$tsize_246_i)|0);
    $sp_168_i=2856;
    while(1) {

     $966=(($sp_168_i)|0);
     $967=((HEAP32[(($966)>>2)])|0);
     $968=($967|0)==($964|0);
     if ($968) {
      label = 224;
      break;
     }
     $970=(($sp_168_i+8)|0);
     $971=((HEAP32[(($970)>>2)])|0);
     $972=($971|0)==0;
     if ($972) {
      break;
     } else {
      $sp_168_i=$971;
     }
    }
    if ((label|0) == 224) {
     $973=(($sp_168_i+12)|0);
     $974=((HEAP32[(($973)>>2)])|0);
     $975=$974&8;
     $976=($975|0)==0;
     if ($976) {
      HEAP32[(($966)>>2)]=$tbase_247_i;
      $978=(($sp_168_i+4)|0);
      $979=((HEAP32[(($978)>>2)])|0);
      $980=((($979)+($tsize_246_i))|0);
      HEAP32[(($978)>>2)]=$980;
      $981=(($tbase_247_i+8)|0);
      $982=$981;
      $983=$982&7;
      $984=($983|0)==0;
      if ($984) {
       $989=0;
      } else {
       $986=(((-$982))|0);
       $987=$986&7;
       $989=$987;
      }

      $990=(($tbase_247_i+$989)|0);
      $_sum107_i=((($tsize_246_i)+(8))|0);
      $991=(($tbase_247_i+$_sum107_i)|0);
      $992=$991;
      $993=$992&7;
      $994=($993|0)==0;
      if ($994) {
       $999=0;
      } else {
       $996=(((-$992))|0);
       $997=$996&7;
       $999=$997;
      }

      $_sum108_i=((($999)+($tsize_246_i))|0);
      $1000=(($tbase_247_i+$_sum108_i)|0);
      $1001=$1000;
      $1002=$1000;
      $1003=$990;
      $1004=((($1002)-($1003))|0);
      $_sum_i21_i=((($989)+($nb_0))|0);
      $1005=(($tbase_247_i+$_sum_i21_i)|0);
      $1006=$1005;
      $1007=((($1004)-($nb_0))|0);
      $1008=$nb_0|3;
      $_sum1_i22_i=((($989)+(4))|0);
      $1009=(($tbase_247_i+$_sum1_i22_i)|0);
      $1010=$1009;
      HEAP32[(($1010)>>2)]=$1008;
      $1011=((HEAP32[((2432)>>2)])|0);
      $1012=($1001|0)==($1011|0);
      L348: do {
       if ($1012) {
        $1014=((HEAP32[((2420)>>2)])|0);
        $1015=((($1014)+($1007))|0);
        HEAP32[((2420)>>2)]=$1015;
        HEAP32[((2432)>>2)]=$1006;
        $1016=$1015|1;
        $_sum46_i_i=((($_sum_i21_i)+(4))|0);
        $1017=(($tbase_247_i+$_sum46_i_i)|0);
        $1018=$1017;
        HEAP32[(($1018)>>2)]=$1016;
       } else {
        $1020=((HEAP32[((2428)>>2)])|0);
        $1021=($1001|0)==($1020|0);
        if ($1021) {
         $1023=((HEAP32[((2416)>>2)])|0);
         $1024=((($1023)+($1007))|0);
         HEAP32[((2416)>>2)]=$1024;
         HEAP32[((2428)>>2)]=$1006;
         $1025=$1024|1;
         $_sum44_i_i=((($_sum_i21_i)+(4))|0);
         $1026=(($tbase_247_i+$_sum44_i_i)|0);
         $1027=$1026;
         HEAP32[(($1027)>>2)]=$1025;
         $_sum45_i_i=((($1024)+($_sum_i21_i))|0);
         $1028=(($tbase_247_i+$_sum45_i_i)|0);
         $1029=$1028;
         HEAP32[(($1029)>>2)]=$1024;
         break;
        }
        $_sum2_i23_i=((($tsize_246_i)+(4))|0);
        $_sum109_i=((($_sum2_i23_i)+($999))|0);
        $1031=(($tbase_247_i+$_sum109_i)|0);
        $1032=$1031;
        $1033=((HEAP32[(($1032)>>2)])|0);
        $1034=$1033&3;
        $1035=($1034|0)==1;
        if ($1035) {
         $1037=$1033&-8;
         $1038=$1033>>>3;
         $1039=($1033>>>0)<((256)>>>0);
         do {
          if ($1039) {
           $_sum3940_i_i=$999|8;
           $_sum119_i=((($_sum3940_i_i)+($tsize_246_i))|0);
           $1041=(($tbase_247_i+$_sum119_i)|0);
           $1042=$1041;
           $1043=((HEAP32[(($1042)>>2)])|0);
           $_sum41_i_i=((($tsize_246_i)+(12))|0);
           $_sum120_i=((($_sum41_i_i)+($999))|0);
           $1044=(($tbase_247_i+$_sum120_i)|0);
           $1045=$1044;
           $1046=((HEAP32[(($1045)>>2)])|0);
           $1047=$1038<<1;
           $1048=((2448+($1047<<2))|0);
           $1049=$1048;
           $1050=($1043|0)==($1049|0);
           if (!($1050)) {
            $1052=$1043;
            $1053=((HEAP32[((2424)>>2)])|0);
            $1054=($1052>>>0)<($1053>>>0);
            if ($1054) {
             _abort(); return ((0)|0);
             return ((0)|0);
            }
            $1056=(($1043+12)|0);
            $1057=((HEAP32[(($1056)>>2)])|0);
            $1058=($1057|0)==($1001|0);
            if (!($1058)) {
             _abort(); return ((0)|0);
             return ((0)|0);
            }
           }
           $1059=($1046|0)==($1043|0);
           if ($1059) {
            $1061=1<<$1038;
            $1062=$1061^-1;
            $1063=((HEAP32[((2408)>>2)])|0);
            $1064=$1063&$1062;
            HEAP32[((2408)>>2)]=$1064;
            break;
           }
           $1066=($1046|0)==($1049|0);
           if ($1066) {
            $_pre61_i_i=(($1046+8)|0);
            $_pre_phi62_i_i=$_pre61_i_i;
           } else {
            $1068=$1046;
            $1069=((HEAP32[((2424)>>2)])|0);
            $1070=($1068>>>0)<($1069>>>0);
            if ($1070) {
             _abort(); return ((0)|0);
             return ((0)|0);
            }
            $1072=(($1046+8)|0);
            $1073=((HEAP32[(($1072)>>2)])|0);
            $1074=($1073|0)==($1001|0);
            if ($1074) {
             $_pre_phi62_i_i=$1072;
            } else {
             _abort(); return ((0)|0);
             return ((0)|0);
            }
           }

           $1075=(($1043+12)|0);
           HEAP32[(($1075)>>2)]=$1046;
           HEAP32[(($_pre_phi62_i_i)>>2)]=$1043;
          } else {
           $1077=$1000;
           $_sum34_i_i=$999|24;
           $_sum110_i=((($_sum34_i_i)+($tsize_246_i))|0);
           $1078=(($tbase_247_i+$_sum110_i)|0);
           $1079=$1078;
           $1080=((HEAP32[(($1079)>>2)])|0);
           $_sum5_i_i=((($tsize_246_i)+(12))|0);
           $_sum111_i=((($_sum5_i_i)+($999))|0);
           $1081=(($tbase_247_i+$_sum111_i)|0);
           $1082=$1081;
           $1083=((HEAP32[(($1082)>>2)])|0);
           $1084=($1083|0)==($1077|0);
           do {
            if ($1084) {
             $_sum67_i_i=$999|16;
             $_sum117_i=((($_sum2_i23_i)+($_sum67_i_i))|0);
             $1102=(($tbase_247_i+$_sum117_i)|0);
             $1103=$1102;
             $1104=((HEAP32[(($1103)>>2)])|0);
             $1105=($1104|0)==0;
             if ($1105) {
              $_sum118_i=((($_sum67_i_i)+($tsize_246_i))|0);
              $1107=(($tbase_247_i+$_sum118_i)|0);
              $1108=$1107;
              $1109=((HEAP32[(($1108)>>2)])|0);
              $1110=($1109|0)==0;
              if ($1110) {
               $R_1_i_i=0;
               break;
              } else {
               $R_0_i_i=$1109;$RP_0_i_i=$1108;
              }
             } else {
              $R_0_i_i=$1104;$RP_0_i_i=$1103;
             }
             while(1) {


              $1111=(($R_0_i_i+20)|0);
              $1112=((HEAP32[(($1111)>>2)])|0);
              $1113=($1112|0)==0;
              if (!($1113)) {
               $R_0_i_i=$1112;$RP_0_i_i=$1111;
               continue;
              }
              $1115=(($R_0_i_i+16)|0);
              $1116=((HEAP32[(($1115)>>2)])|0);
              $1117=($1116|0)==0;
              if ($1117) {
               break;
              } else {
               $R_0_i_i=$1116;$RP_0_i_i=$1115;
              }
             }
             $1119=$RP_0_i_i;
             $1120=((HEAP32[((2424)>>2)])|0);
             $1121=($1119>>>0)<($1120>>>0);
             if ($1121) {
              _abort(); return ((0)|0);
              return ((0)|0);
             } else {
              HEAP32[(($RP_0_i_i)>>2)]=0;
              $R_1_i_i=$R_0_i_i;
              break;
             }
            } else {
             $_sum3637_i_i=$999|8;
             $_sum112_i=((($_sum3637_i_i)+($tsize_246_i))|0);
             $1086=(($tbase_247_i+$_sum112_i)|0);
             $1087=$1086;
             $1088=((HEAP32[(($1087)>>2)])|0);
             $1089=$1088;
             $1090=((HEAP32[((2424)>>2)])|0);
             $1091=($1089>>>0)<($1090>>>0);
             if ($1091) {
              _abort(); return ((0)|0);
              return ((0)|0);
             }
             $1093=(($1088+12)|0);
             $1094=((HEAP32[(($1093)>>2)])|0);
             $1095=($1094|0)==($1077|0);
             if (!($1095)) {
              _abort(); return ((0)|0);
              return ((0)|0);
             }
             $1097=(($1083+8)|0);
             $1098=((HEAP32[(($1097)>>2)])|0);
             $1099=($1098|0)==($1077|0);
             if ($1099) {
              HEAP32[(($1093)>>2)]=$1083;
              HEAP32[(($1097)>>2)]=$1088;
              $R_1_i_i=$1083;
              break;
             } else {
              _abort(); return ((0)|0);
              return ((0)|0);
             }
            }
           } while(0);

           $1125=($1080|0)==0;
           if (!($1125)) {
            $_sum31_i_i=((($tsize_246_i)+(28))|0);
            $_sum113_i=((($_sum31_i_i)+($999))|0);
            $1127=(($tbase_247_i+$_sum113_i)|0);
            $1128=$1127;
            $1129=((HEAP32[(($1128)>>2)])|0);
            $1130=((2712+($1129<<2))|0);
            $1131=((HEAP32[(($1130)>>2)])|0);
            $1132=($1077|0)==($1131|0);
            if ($1132) {
             HEAP32[(($1130)>>2)]=$R_1_i_i;
             $cond_i_i=($R_1_i_i|0)==0;
             if ($cond_i_i) {
              $1134=1<<$1129;
              $1135=$1134^-1;
              $1136=((HEAP32[((2412)>>2)])|0);
              $1137=$1136&$1135;
              HEAP32[((2412)>>2)]=$1137;
              break;
             }
            } else {
             $1139=$1080;
             $1140=((HEAP32[((2424)>>2)])|0);
             $1141=($1139>>>0)<($1140>>>0);
             if ($1141) {
              _abort(); return ((0)|0);
              return ((0)|0);
             }
             $1143=(($1080+16)|0);
             $1144=((HEAP32[(($1143)>>2)])|0);
             $1145=($1144|0)==($1077|0);
             if ($1145) {
              HEAP32[(($1143)>>2)]=$R_1_i_i;
             } else {
              $1148=(($1080+20)|0);
              HEAP32[(($1148)>>2)]=$R_1_i_i;
             }
             $1151=($R_1_i_i|0)==0;
             if ($1151) {
              break;
             }
            }
            $1153=$R_1_i_i;
            $1154=((HEAP32[((2424)>>2)])|0);
            $1155=($1153>>>0)<($1154>>>0);
            if ($1155) {
             _abort(); return ((0)|0);
             return ((0)|0);
            }
            $1157=(($R_1_i_i+24)|0);
            HEAP32[(($1157)>>2)]=$1080;
            $_sum3233_i_i=$999|16;
            $_sum114_i=((($_sum3233_i_i)+($tsize_246_i))|0);
            $1158=(($tbase_247_i+$_sum114_i)|0);
            $1159=$1158;
            $1160=((HEAP32[(($1159)>>2)])|0);
            $1161=($1160|0)==0;
            do {
             if (!($1161)) {
              $1163=$1160;
              $1164=((HEAP32[((2424)>>2)])|0);
              $1165=($1163>>>0)<($1164>>>0);
              if ($1165) {
               _abort(); return ((0)|0);
               return ((0)|0);
              } else {
               $1167=(($R_1_i_i+16)|0);
               HEAP32[(($1167)>>2)]=$1160;
               $1168=(($1160+24)|0);
               HEAP32[(($1168)>>2)]=$R_1_i_i;
               break;
              }
             }
            } while(0);
            $_sum115_i=((($_sum2_i23_i)+($_sum3233_i_i))|0);
            $1171=(($tbase_247_i+$_sum115_i)|0);
            $1172=$1171;
            $1173=((HEAP32[(($1172)>>2)])|0);
            $1174=($1173|0)==0;
            if (!($1174)) {
             $1176=$1173;
             $1177=((HEAP32[((2424)>>2)])|0);
             $1178=($1176>>>0)<($1177>>>0);
             if ($1178) {
              _abort(); return ((0)|0);
              return ((0)|0);
             } else {
              $1180=(($R_1_i_i+20)|0);
              HEAP32[(($1180)>>2)]=$1173;
              $1181=(($1173+24)|0);
              HEAP32[(($1181)>>2)]=$R_1_i_i;
              break;
             }
            }
           }
          }
         } while(0);
         $_sum9_i_i=$1037|$999;
         $_sum116_i=((($_sum9_i_i)+($tsize_246_i))|0);
         $1185=(($tbase_247_i+$_sum116_i)|0);
         $1186=$1185;
         $1187=((($1037)+($1007))|0);
         $oldfirst_0_i_i=$1186;$qsize_0_i_i=$1187;
        } else {
         $oldfirst_0_i_i=$1001;$qsize_0_i_i=$1007;
        }


        $1189=(($oldfirst_0_i_i+4)|0);
        $1190=((HEAP32[(($1189)>>2)])|0);
        $1191=$1190&-2;
        HEAP32[(($1189)>>2)]=$1191;
        $1192=$qsize_0_i_i|1;
        $_sum10_i_i=((($_sum_i21_i)+(4))|0);
        $1193=(($tbase_247_i+$_sum10_i_i)|0);
        $1194=$1193;
        HEAP32[(($1194)>>2)]=$1192;
        $_sum11_i_i=((($qsize_0_i_i)+($_sum_i21_i))|0);
        $1195=(($tbase_247_i+$_sum11_i_i)|0);
        $1196=$1195;
        HEAP32[(($1196)>>2)]=$qsize_0_i_i;
        $1197=$qsize_0_i_i>>>3;
        $1198=($qsize_0_i_i>>>0)<((256)>>>0);
        if ($1198) {
         $1200=$1197<<1;
         $1201=((2448+($1200<<2))|0);
         $1202=$1201;
         $1203=((HEAP32[((2408)>>2)])|0);
         $1204=1<<$1197;
         $1205=$1203&$1204;
         $1206=($1205|0)==0;
         if ($1206) {
          $1208=$1203|$1204;
          HEAP32[((2408)>>2)]=$1208;
          $_sum27_pre_i_i=((($1200)+(2))|0);
          $_pre_i24_i=((2448+($_sum27_pre_i_i<<2))|0);
          $F4_0_i_i=$1202;$_pre_phi_i25_i=$_pre_i24_i;
         } else {
          $_sum30_i_i=((($1200)+(2))|0);
          $1210=((2448+($_sum30_i_i<<2))|0);
          $1211=((HEAP32[(($1210)>>2)])|0);
          $1212=$1211;
          $1213=((HEAP32[((2424)>>2)])|0);
          $1214=($1212>>>0)<($1213>>>0);
          if ($1214) {
           _abort(); return ((0)|0);
           return ((0)|0);
          } else {
           $F4_0_i_i=$1211;$_pre_phi_i25_i=$1210;
          }
         }


         HEAP32[(($_pre_phi_i25_i)>>2)]=$1006;
         $1217=(($F4_0_i_i+12)|0);
         HEAP32[(($1217)>>2)]=$1006;
         $_sum28_i_i=((($_sum_i21_i)+(8))|0);
         $1218=(($tbase_247_i+$_sum28_i_i)|0);
         $1219=$1218;
         HEAP32[(($1219)>>2)]=$F4_0_i_i;
         $_sum29_i_i=((($_sum_i21_i)+(12))|0);
         $1220=(($tbase_247_i+$_sum29_i_i)|0);
         $1221=$1220;
         HEAP32[(($1221)>>2)]=$1202;
         break;
        }
        $1223=$1005;
        $1224=$qsize_0_i_i>>>8;
        $1225=($1224|0)==0;
        if ($1225) {
         $I7_0_i_i=0;
        } else {
         $1227=($qsize_0_i_i>>>0)>((16777215)>>>0);
         if ($1227) {
          $I7_0_i_i=31;
         } else {
          $1229=((($1224)+(1048320))|0);
          $1230=$1229>>>16;
          $1231=$1230&8;
          $1232=$1224<<$1231;
          $1233=((($1232)+(520192))|0);
          $1234=$1233>>>16;
          $1235=$1234&4;
          $1236=$1235|$1231;
          $1237=$1232<<$1235;
          $1238=((($1237)+(245760))|0);
          $1239=$1238>>>16;
          $1240=$1239&2;
          $1241=$1236|$1240;
          $1242=(((14)-($1241))|0);
          $1243=$1237<<$1240;
          $1244=$1243>>>15;
          $1245=((($1242)+($1244))|0);
          $1246=$1245<<1;
          $1247=((($1245)+(7))|0);
          $1248=$qsize_0_i_i>>>($1247>>>0);
          $1249=$1248&1;
          $1250=$1249|$1246;
          $I7_0_i_i=$1250;
         }
        }

        $1252=((2712+($I7_0_i_i<<2))|0);
        $_sum12_i26_i=((($_sum_i21_i)+(28))|0);
        $1253=(($tbase_247_i+$_sum12_i26_i)|0);
        $1254=$1253;
        HEAP32[(($1254)>>2)]=$I7_0_i_i;
        $_sum13_i_i=((($_sum_i21_i)+(16))|0);
        $1255=(($tbase_247_i+$_sum13_i_i)|0);
        $_sum14_i_i=((($_sum_i21_i)+(20))|0);
        $1256=(($tbase_247_i+$_sum14_i_i)|0);
        $1257=$1256;
        HEAP32[(($1257)>>2)]=0;
        $1258=$1255;
        HEAP32[(($1258)>>2)]=0;
        $1259=((HEAP32[((2412)>>2)])|0);
        $1260=1<<$I7_0_i_i;
        $1261=$1259&$1260;
        $1262=($1261|0)==0;
        if ($1262) {
         $1264=$1259|$1260;
         HEAP32[((2412)>>2)]=$1264;
         HEAP32[(($1252)>>2)]=$1223;
         $1265=$1252;
         $_sum15_i_i=((($_sum_i21_i)+(24))|0);
         $1266=(($tbase_247_i+$_sum15_i_i)|0);
         $1267=$1266;
         HEAP32[(($1267)>>2)]=$1265;
         $_sum16_i_i=((($_sum_i21_i)+(12))|0);
         $1268=(($tbase_247_i+$_sum16_i_i)|0);
         $1269=$1268;
         HEAP32[(($1269)>>2)]=$1223;
         $_sum17_i_i=((($_sum_i21_i)+(8))|0);
         $1270=(($tbase_247_i+$_sum17_i_i)|0);
         $1271=$1270;
         HEAP32[(($1271)>>2)]=$1223;
         break;
        }
        $1273=((HEAP32[(($1252)>>2)])|0);
        $1274=($I7_0_i_i|0)==31;
        if ($1274) {
         $1279=0;
        } else {
         $1276=$I7_0_i_i>>>1;
         $1277=(((25)-($1276))|0);
         $1279=$1277;
        }

        $1280=(($1273+4)|0);
        $1281=((HEAP32[(($1280)>>2)])|0);
        $1282=$1281&-8;
        $1283=($1282|0)==($qsize_0_i_i|0);
        L445: do {
         if ($1283) {
          $T_0_lcssa_i28_i=$1273;
         } else {
          $1284=$qsize_0_i_i<<$1279;
          $T_055_i_i=$1273;$K8_056_i_i=$1284;
          while(1) {


           $1292=$K8_056_i_i>>>31;
           $1293=(($T_055_i_i+16+($1292<<2))|0);
           $1294=((HEAP32[(($1293)>>2)])|0);
           $1295=($1294|0)==0;
           if ($1295) {
            break;
           }
           $1286=$K8_056_i_i<<1;
           $1287=(($1294+4)|0);
           $1288=((HEAP32[(($1287)>>2)])|0);
           $1289=$1288&-8;
           $1290=($1289|0)==($qsize_0_i_i|0);
           if ($1290) {
            $T_0_lcssa_i28_i=$1294;
            break L445;
           } else {
            $T_055_i_i=$1294;$K8_056_i_i=$1286;
           }
          }
          $1297=$1293;
          $1298=((HEAP32[((2424)>>2)])|0);
          $1299=($1297>>>0)<($1298>>>0);
          if ($1299) {
           _abort(); return ((0)|0);
           return ((0)|0);
          } else {
           HEAP32[(($1293)>>2)]=$1223;
           $_sum24_i_i=((($_sum_i21_i)+(24))|0);
           $1301=(($tbase_247_i+$_sum24_i_i)|0);
           $1302=$1301;
           HEAP32[(($1302)>>2)]=$T_055_i_i;
           $_sum25_i_i=((($_sum_i21_i)+(12))|0);
           $1303=(($tbase_247_i+$_sum25_i_i)|0);
           $1304=$1303;
           HEAP32[(($1304)>>2)]=$1223;
           $_sum26_i_i=((($_sum_i21_i)+(8))|0);
           $1305=(($tbase_247_i+$_sum26_i_i)|0);
           $1306=$1305;
           HEAP32[(($1306)>>2)]=$1223;
           break L348;
          }
         }
        } while(0);

        $1308=(($T_0_lcssa_i28_i+8)|0);
        $1309=((HEAP32[(($1308)>>2)])|0);
        $1310=$T_0_lcssa_i28_i;
        $1311=((HEAP32[((2424)>>2)])|0);
        $1312=($1310>>>0)<($1311>>>0);
        if ($1312) {
         _abort(); return ((0)|0);
         return ((0)|0);
        }
        $1314=$1309;
        $1315=($1314>>>0)<($1311>>>0);
        if ($1315) {
         _abort(); return ((0)|0);
         return ((0)|0);
        } else {
         $1317=(($1309+12)|0);
         HEAP32[(($1317)>>2)]=$1223;
         HEAP32[(($1308)>>2)]=$1223;
         $_sum21_i_i=((($_sum_i21_i)+(8))|0);
         $1318=(($tbase_247_i+$_sum21_i_i)|0);
         $1319=$1318;
         HEAP32[(($1319)>>2)]=$1309;
         $_sum22_i_i=((($_sum_i21_i)+(12))|0);
         $1320=(($tbase_247_i+$_sum22_i_i)|0);
         $1321=$1320;
         HEAP32[(($1321)>>2)]=$T_0_lcssa_i28_i;
         $_sum23_i_i=((($_sum_i21_i)+(24))|0);
         $1322=(($tbase_247_i+$_sum23_i_i)|0);
         $1323=$1322;
         HEAP32[(($1323)>>2)]=0;
         break;
        }
       }
      } while(0);
      $_sum1819_i_i=$989|8;
      $1324=(($tbase_247_i+$_sum1819_i_i)|0);
      $mem_0=$1324;

      return (($mem_0)|0);
     }
    }
    $1325=$888;
    $sp_0_i_i_i=2856;
    while(1) {

     $1327=(($sp_0_i_i_i)|0);
     $1328=((HEAP32[(($1327)>>2)])|0);
     $1329=($1328>>>0)>($1325>>>0);
     if (!($1329)) {
      $1331=(($sp_0_i_i_i+4)|0);
      $1332=((HEAP32[(($1331)>>2)])|0);
      $1333=(($1328+$1332)|0);
      $1334=($1333>>>0)>($1325>>>0);
      if ($1334) {
       break;
      }
     }
     $1336=(($sp_0_i_i_i+8)|0);
     $1337=((HEAP32[(($1336)>>2)])|0);
     $sp_0_i_i_i=$1337;
    }
    $_sum_i15_i=((($1332)-(47))|0);
    $_sum1_i16_i=((($1332)-(39))|0);
    $1338=(($1328+$_sum1_i16_i)|0);
    $1339=$1338;
    $1340=$1339&7;
    $1341=($1340|0)==0;
    if ($1341) {
     $1346=0;
    } else {
     $1343=(((-$1339))|0);
     $1344=$1343&7;
     $1346=$1344;
    }

    $_sum2_i17_i=((($_sum_i15_i)+($1346))|0);
    $1347=(($1328+$_sum2_i17_i)|0);
    $1348=(($888+16)|0);
    $1349=$1348;
    $1350=($1347>>>0)<($1349>>>0);
    $1351=($1350?$1325:$1347);
    $1352=(($1351+8)|0);
    $1353=$1352;
    $1354=((($tsize_246_i)-(40))|0);
    $1355=(($tbase_247_i+8)|0);
    $1356=$1355;
    $1357=$1356&7;
    $1358=($1357|0)==0;
    if ($1358) {
     $1362=0;
    } else {
     $1360=(((-$1356))|0);
     $1361=$1360&7;
     $1362=$1361;
    }

    $1363=(($tbase_247_i+$1362)|0);
    $1364=$1363;
    $1365=((($1354)-($1362))|0);
    HEAP32[((2432)>>2)]=$1364;
    HEAP32[((2420)>>2)]=$1365;
    $1366=$1365|1;
    $_sum_i_i_i=((($1362)+(4))|0);
    $1367=(($tbase_247_i+$_sum_i_i_i)|0);
    $1368=$1367;
    HEAP32[(($1368)>>2)]=$1366;
    $_sum2_i_i_i=((($tsize_246_i)-(36))|0);
    $1369=(($tbase_247_i+$_sum2_i_i_i)|0);
    $1370=$1369;
    HEAP32[(($1370)>>2)]=40;
    $1371=((HEAP32[((2392)>>2)])|0);
    HEAP32[((2436)>>2)]=$1371;
    $1372=(($1351+4)|0);
    $1373=$1372;
    HEAP32[(($1373)>>2)]=27;
    HEAP32[(($1352)>>2)]=((HEAP32[((2856)>>2)])|0);HEAP32[((($1352)+(4))>>2)]=((HEAP32[((2860)>>2)])|0);HEAP32[((($1352)+(8))>>2)]=((HEAP32[((2864)>>2)])|0);HEAP32[((($1352)+(12))>>2)]=((HEAP32[((2868)>>2)])|0);
    HEAP32[((2856)>>2)]=$tbase_247_i;
    HEAP32[((2860)>>2)]=$tsize_246_i;
    HEAP32[((2868)>>2)]=0;
    HEAP32[((2864)>>2)]=$1353;
    $1374=(($1351+28)|0);
    $1375=$1374;
    HEAP32[(($1375)>>2)]=7;
    $1376=(($1351+32)|0);
    $1377=($1376>>>0)<($1333>>>0);
    if ($1377) {
     $1378=$1375;
     while(1) {

      $1379=(($1378+4)|0);
      HEAP32[(($1379)>>2)]=7;
      $1380=(($1378+8)|0);
      $1381=$1380;
      $1382=($1381>>>0)<($1333>>>0);
      if ($1382) {
       $1378=$1379;
      } else {
       break;
      }
     }
    }
    $1383=($1351|0)==($1325|0);
    if (!($1383)) {
     $1385=$1351;
     $1386=$888;
     $1387=((($1385)-($1386))|0);
     $1388=(($1325+$1387)|0);
     $_sum3_i_i=((($1387)+(4))|0);
     $1389=(($1325+$_sum3_i_i)|0);
     $1390=$1389;
     $1391=((HEAP32[(($1390)>>2)])|0);
     $1392=$1391&-2;
     HEAP32[(($1390)>>2)]=$1392;
     $1393=$1387|1;
     $1394=(($888+4)|0);
     HEAP32[(($1394)>>2)]=$1393;
     $1395=$1388;
     HEAP32[(($1395)>>2)]=$1387;
     $1396=$1387>>>3;
     $1397=($1387>>>0)<((256)>>>0);
     if ($1397) {
      $1399=$1396<<1;
      $1400=((2448+($1399<<2))|0);
      $1401=$1400;
      $1402=((HEAP32[((2408)>>2)])|0);
      $1403=1<<$1396;
      $1404=$1402&$1403;
      $1405=($1404|0)==0;
      if ($1405) {
       $1407=$1402|$1403;
       HEAP32[((2408)>>2)]=$1407;
       $_sum11_pre_i_i=((($1399)+(2))|0);
       $_pre_i_i=((2448+($_sum11_pre_i_i<<2))|0);
       $F_0_i_i=$1401;$_pre_phi_i_i=$_pre_i_i;
      } else {
       $_sum12_i_i=((($1399)+(2))|0);
       $1409=((2448+($_sum12_i_i<<2))|0);
       $1410=((HEAP32[(($1409)>>2)])|0);
       $1411=$1410;
       $1412=((HEAP32[((2424)>>2)])|0);
       $1413=($1411>>>0)<($1412>>>0);
       if ($1413) {
        _abort(); return ((0)|0);
        return ((0)|0);
       } else {
        $F_0_i_i=$1410;$_pre_phi_i_i=$1409;
       }
      }


      HEAP32[(($_pre_phi_i_i)>>2)]=$888;
      $1416=(($F_0_i_i+12)|0);
      HEAP32[(($1416)>>2)]=$888;
      $1417=(($888+8)|0);
      HEAP32[(($1417)>>2)]=$F_0_i_i;
      $1418=(($888+12)|0);
      HEAP32[(($1418)>>2)]=$1401;
      break;
     }
     $1420=$888;
     $1421=$1387>>>8;
     $1422=($1421|0)==0;
     if ($1422) {
      $I1_0_i_i=0;
     } else {
      $1424=($1387>>>0)>((16777215)>>>0);
      if ($1424) {
       $I1_0_i_i=31;
      } else {
       $1426=((($1421)+(1048320))|0);
       $1427=$1426>>>16;
       $1428=$1427&8;
       $1429=$1421<<$1428;
       $1430=((($1429)+(520192))|0);
       $1431=$1430>>>16;
       $1432=$1431&4;
       $1433=$1432|$1428;
       $1434=$1429<<$1432;
       $1435=((($1434)+(245760))|0);
       $1436=$1435>>>16;
       $1437=$1436&2;
       $1438=$1433|$1437;
       $1439=(((14)-($1438))|0);
       $1440=$1434<<$1437;
       $1441=$1440>>>15;
       $1442=((($1439)+($1441))|0);
       $1443=$1442<<1;
       $1444=((($1442)+(7))|0);
       $1445=$1387>>>($1444>>>0);
       $1446=$1445&1;
       $1447=$1446|$1443;
       $I1_0_i_i=$1447;
      }
     }

     $1449=((2712+($I1_0_i_i<<2))|0);
     $1450=(($888+28)|0);
     $I1_0_c_i_i=$I1_0_i_i;
     HEAP32[(($1450)>>2)]=$I1_0_c_i_i;
     $1451=(($888+20)|0);
     HEAP32[(($1451)>>2)]=0;
     $1452=(($888+16)|0);
     HEAP32[(($1452)>>2)]=0;
     $1453=((HEAP32[((2412)>>2)])|0);
     $1454=1<<$I1_0_i_i;
     $1455=$1453&$1454;
     $1456=($1455|0)==0;
     if ($1456) {
      $1458=$1453|$1454;
      HEAP32[((2412)>>2)]=$1458;
      HEAP32[(($1449)>>2)]=$1420;
      $1459=(($888+24)|0);
      $_c_i_i=$1449;
      HEAP32[(($1459)>>2)]=$_c_i_i;
      $1460=(($888+12)|0);
      HEAP32[(($1460)>>2)]=$888;
      $1461=(($888+8)|0);
      HEAP32[(($1461)>>2)]=$888;
      break;
     }
     $1463=((HEAP32[(($1449)>>2)])|0);
     $1464=($I1_0_i_i|0)==31;
     if ($1464) {
      $1469=0;
     } else {
      $1466=$I1_0_i_i>>>1;
      $1467=(((25)-($1466))|0);
      $1469=$1467;
     }

     $1470=(($1463+4)|0);
     $1471=((HEAP32[(($1470)>>2)])|0);
     $1472=$1471&-8;
     $1473=($1472|0)==($1387|0);
     L499: do {
      if ($1473) {
       $T_0_lcssa_i_i=$1463;
      } else {
       $1474=$1387<<$1469;
       $T_014_i_i=$1463;$K2_015_i_i=$1474;
       while(1) {


        $1482=$K2_015_i_i>>>31;
        $1483=(($T_014_i_i+16+($1482<<2))|0);
        $1484=((HEAP32[(($1483)>>2)])|0);
        $1485=($1484|0)==0;
        if ($1485) {
         break;
        }
        $1476=$K2_015_i_i<<1;
        $1477=(($1484+4)|0);
        $1478=((HEAP32[(($1477)>>2)])|0);
        $1479=$1478&-8;
        $1480=($1479|0)==($1387|0);
        if ($1480) {
         $T_0_lcssa_i_i=$1484;
         break L499;
        } else {
         $T_014_i_i=$1484;$K2_015_i_i=$1476;
        }
       }
       $1487=$1483;
       $1488=((HEAP32[((2424)>>2)])|0);
       $1489=($1487>>>0)<($1488>>>0);
       if ($1489) {
        _abort(); return ((0)|0);
        return ((0)|0);
       } else {
        HEAP32[(($1483)>>2)]=$1420;
        $1491=(($888+24)|0);
        $T_0_c8_i_i=$T_014_i_i;
        HEAP32[(($1491)>>2)]=$T_0_c8_i_i;
        $1492=(($888+12)|0);
        HEAP32[(($1492)>>2)]=$888;
        $1493=(($888+8)|0);
        HEAP32[(($1493)>>2)]=$888;
        break L311;
       }
      }
     } while(0);

     $1495=(($T_0_lcssa_i_i+8)|0);
     $1496=((HEAP32[(($1495)>>2)])|0);
     $1497=$T_0_lcssa_i_i;
     $1498=((HEAP32[((2424)>>2)])|0);
     $1499=($1497>>>0)<($1498>>>0);
     if ($1499) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $1501=$1496;
     $1502=($1501>>>0)<($1498>>>0);
     if ($1502) {
      _abort(); return ((0)|0);
      return ((0)|0);
     } else {
      $1504=(($1496+12)|0);
      HEAP32[(($1504)>>2)]=$1420;
      HEAP32[(($1495)>>2)]=$1420;
      $1505=(($888+8)|0);
      $_c7_i_i=$1496;
      HEAP32[(($1505)>>2)]=$_c7_i_i;
      $1506=(($888+12)|0);
      $T_0_c_i_i=$T_0_lcssa_i_i;
      HEAP32[(($1506)>>2)]=$T_0_c_i_i;
      $1507=(($888+24)|0);
      HEAP32[(($1507)>>2)]=0;
      break;
     }
    }
   }
  } while(0);
  $1508=((HEAP32[((2420)>>2)])|0);
  $1509=($1508>>>0)>($nb_0>>>0);
  if ($1509) {
   $1511=((($1508)-($nb_0))|0);
   HEAP32[((2420)>>2)]=$1511;
   $1512=((HEAP32[((2432)>>2)])|0);
   $1513=$1512;
   $1514=(($1513+$nb_0)|0);
   $1515=$1514;
   HEAP32[((2432)>>2)]=$1515;
   $1516=$1511|1;
   $_sum_i34=((($nb_0)+(4))|0);
   $1517=(($1513+$_sum_i34)|0);
   $1518=$1517;
   HEAP32[(($1518)>>2)]=$1516;
   $1519=$nb_0|3;
   $1520=(($1512+4)|0);
   HEAP32[(($1520)>>2)]=$1519;
   $1521=(($1512+8)|0);
   $1522=$1521;
   $mem_0=$1522;

   return (($mem_0)|0);
  }
 }
 $1523=((___errno_location())|0);
 HEAP32[(($1523)>>2)]=12;
 $mem_0=0;

 return (($mem_0)|0);
}


function _free($mem){
 $mem=($mem)|0;
 var $1=0,$3=0,$4=0,$5=0,$6=0,$8=0,$9=0,$10=0,$11=0,$12=0,$14=0,$_sum=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0,$22=0,$_sum3=0;
 var $24=0,$25=0,$26=0,$27=0,$29=0,$30=0,$32=0,$33=0,$_sum47=0,$35=0,$36=0,$37=0,$_sum48=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0;
 var $46=0,$47=0,$49=0,$50=0,$51=0,$52=0,$54=0,$55=0,$56=0,$57=0,$59=0,$_pre84=0,$61=0,$62=0,$64=0,$65=0,$66=0,$_pre_phi85=0,$67=0,$69=0;
 var $_sum37=0,$70=0,$71=0,$72=0,$_sum38=0,$73=0,$74=0,$75=0,$76=0,$_sum44=0,$78=0,$79=0,$80=0,$81=0,$82=0,$84=0,$85=0,$86=0,$88=0,$89=0;
 var $90=0,$_sum40=0,$93=0,$94=0,$95=0,$96=0,$_sum39=0,$98=0,$99=0,$100=0,$101=0,$RP_0=0,$R_0=0,$102=0,$103=0,$104=0,$106=0,$107=0,$108=0,$110=0;
 var $111=0,$R_1=0,$115=0,$_sum41=0,$117=0,$118=0,$119=0,$120=0,$121=0,$122=0,$cond=0,$124=0,$125=0,$126=0,$127=0,$129=0,$130=0,$131=0,$133=0,$134=0;
 var $135=0,$138=0,$141=0,$143=0,$144=0,$145=0,$147=0,$_sum42=0,$148=0,$149=0,$150=0,$151=0,$153=0,$154=0,$155=0,$157=0,$158=0,$_sum43=0,$161=0,$162=0;
 var $163=0,$164=0,$166=0,$167=0,$168=0,$170=0,$171=0,$_sum4=0,$175=0,$176=0,$177=0,$178=0,$179=0,$181=0,$182=0,$183=0,$_sum35=0,$184=0,$185=0,$186=0;
 var $psize_0=0,$p_0=0,$188=0,$189=0,$_sum34=0,$191=0,$192=0,$193=0,$194=0,$phitmp=0,$196=0,$197=0,$199=0,$200=0,$202=0,$203=0,$204=0,$205=0,$206=0,$207=0;
 var $210=0,$211=0,$213=0,$214=0,$215=0,$216=0,$217=0,$218=0,$220=0,$221=0,$222=0,$223=0,$225=0,$226=0,$227=0,$_sum2829=0,$228=0,$229=0,$230=0,$231=0;
 var $232=0,$233=0,$234=0,$236=0,$237=0,$238=0,$240=0,$241=0,$242=0,$243=0,$245=0,$246=0,$247=0,$248=0,$250=0,$_pre82=0,$252=0,$253=0,$254=0,$256=0;
 var $257=0,$258=0,$_pre_phi83=0,$259=0,$261=0,$_sum6=0,$262=0,$263=0,$264=0,$_sum78=0,$265=0,$266=0,$267=0,$268=0,$270=0,$271=0,$272=0,$273=0,$274=0,$275=0;
 var $277=0,$278=0,$279=0,$281=0,$282=0,$283=0,$_sum10=0,$286=0,$287=0,$288=0,$289=0,$_sum9=0,$291=0,$292=0,$293=0,$294=0,$RP9_0=0,$R7_0=0,$295=0,$296=0;
 var $297=0,$299=0,$300=0,$301=0,$303=0,$304=0,$305=0,$R7_1=0,$309=0,$_sum21=0,$311=0,$312=0,$313=0,$314=0,$315=0,$316=0,$cond69=0,$318=0,$319=0,$320=0;
 var $321=0,$323=0,$324=0,$325=0,$327=0,$328=0,$329=0,$332=0,$335=0,$337=0,$338=0,$339=0,$341=0,$_sum22=0,$342=0,$343=0,$344=0,$345=0,$347=0,$348=0;
 var $349=0,$351=0,$352=0,$_sum23=0,$355=0,$356=0,$357=0,$358=0,$360=0,$361=0,$362=0,$364=0,$365=0,$368=0,$369=0,$370=0,$371=0,$372=0,$373=0,$376=0;
 var $377=0,$378=0,$379=0,$380=0,$psize_1=0,$382=0,$383=0,$385=0,$386=0,$387=0,$388=0,$389=0,$390=0,$391=0,$393=0,$_sum19_pre=0,$_pre=0,$_sum20=0,$395=0,$396=0;
 var $397=0,$398=0,$399=0,$_pre_phi=0,$F16_0=0,$402=0,$403=0,$404=0,$406=0,$407=0,$408=0,$410=0,$412=0,$413=0,$414=0,$415=0,$416=0,$417=0,$418=0,$419=0;
 var $420=0,$421=0,$422=0,$423=0,$424=0,$425=0,$426=0,$427=0,$428=0,$429=0,$430=0,$431=0,$432=0,$433=0,$I18_0=0,$435=0,$436=0,$I18_0_c=0,$437=0,$438=0;
 var $439=0,$440=0,$441=0,$442=0,$444=0,$445=0,$_c=0,$446=0,$447=0,$449=0,$450=0,$452=0,$453=0,$455=0,$456=0,$457=0,$458=0,$459=0,$460=0,$462=0;
 var $463=0,$464=0,$465=0,$466=0,$K19_072=0,$T_071=0,$468=0,$469=0,$470=0,$471=0,$473=0,$474=0,$475=0,$477=0,$T_0_c16=0,$478=0,$479=0,$T_0_lcssa=0,$481=0,$482=0;
 var $483=0,$484=0,$485=0,$487=0,$488=0,$490=0,$491=0,$_c15=0,$492=0,$T_0_c=0,$493=0,$495=0,$496=0,$497=0,$sp_0_in_i=0,$sp_0_i=0,$498=0,$499=0,label=0;

 $1=($mem|0)==0;
 if ($1) {
  return;
 }
 $3=((($mem)-(8))|0);
 $4=$3;
 $5=((HEAP32[((2424)>>2)])|0);
 $6=($3>>>0)<($5>>>0);
 if ($6) {
  _abort();

 }
 $8=((($mem)-(4))|0);
 $9=$8;
 $10=((HEAP32[(($9)>>2)])|0);
 $11=$10&3;
 $12=($11|0)==1;
 if ($12) {
  _abort();

 }
 $14=$10&-8;
 $_sum=((($14)-(8))|0);
 $15=(($mem+$_sum)|0);
 $16=$15;
 $17=$10&1;
 $18=($17|0)==0;
 do {
  if ($18) {
   $20=$3;
   $21=((HEAP32[(($20)>>2)])|0);
   $22=($11|0)==0;
   if ($22) {
    return;
   }
   $_sum3=(((-8)-($21))|0);
   $24=(($mem+$_sum3)|0);
   $25=$24;
   $26=((($21)+($14))|0);
   $27=($24>>>0)<($5>>>0);
   if ($27) {
    _abort();

   }
   $29=((HEAP32[((2428)>>2)])|0);
   $30=($25|0)==($29|0);
   if ($30) {
    $_sum4=((($14)-(4))|0);
    $175=(($mem+$_sum4)|0);
    $176=$175;
    $177=((HEAP32[(($176)>>2)])|0);
    $178=$177&3;
    $179=($178|0)==3;
    if (!($179)) {
     $p_0=$25;$psize_0=$26;
     break;
    }
    HEAP32[((2416)>>2)]=$26;
    $181=((HEAP32[(($176)>>2)])|0);
    $182=$181&-2;
    HEAP32[(($176)>>2)]=$182;
    $183=$26|1;
    $_sum35=((($_sum3)+(4))|0);
    $184=(($mem+$_sum35)|0);
    $185=$184;
    HEAP32[(($185)>>2)]=$183;
    $186=$15;
    HEAP32[(($186)>>2)]=$26;
    return;
   }
   $32=$21>>>3;
   $33=($21>>>0)<((256)>>>0);
   if ($33) {
    $_sum47=((($_sum3)+(8))|0);
    $35=(($mem+$_sum47)|0);
    $36=$35;
    $37=((HEAP32[(($36)>>2)])|0);
    $_sum48=((($_sum3)+(12))|0);
    $38=(($mem+$_sum48)|0);
    $39=$38;
    $40=((HEAP32[(($39)>>2)])|0);
    $41=$32<<1;
    $42=((2448+($41<<2))|0);
    $43=$42;
    $44=($37|0)==($43|0);
    if (!($44)) {
     $46=$37;
     $47=($46>>>0)<($5>>>0);
     if ($47) {
      _abort();

     }
     $49=(($37+12)|0);
     $50=((HEAP32[(($49)>>2)])|0);
     $51=($50|0)==($25|0);
     if (!($51)) {
      _abort();

     }
    }
    $52=($40|0)==($37|0);
    if ($52) {
     $54=1<<$32;
     $55=$54^-1;
     $56=((HEAP32[((2408)>>2)])|0);
     $57=$56&$55;
     HEAP32[((2408)>>2)]=$57;
     $p_0=$25;$psize_0=$26;
     break;
    }
    $59=($40|0)==($43|0);
    if ($59) {
     $_pre84=(($40+8)|0);
     $_pre_phi85=$_pre84;
    } else {
     $61=$40;
     $62=($61>>>0)<($5>>>0);
     if ($62) {
      _abort();

     }
     $64=(($40+8)|0);
     $65=((HEAP32[(($64)>>2)])|0);
     $66=($65|0)==($25|0);
     if ($66) {
      $_pre_phi85=$64;
     } else {
      _abort();

     }
    }

    $67=(($37+12)|0);
    HEAP32[(($67)>>2)]=$40;
    HEAP32[(($_pre_phi85)>>2)]=$37;
    $p_0=$25;$psize_0=$26;
    break;
   }
   $69=$24;
   $_sum37=((($_sum3)+(24))|0);
   $70=(($mem+$_sum37)|0);
   $71=$70;
   $72=((HEAP32[(($71)>>2)])|0);
   $_sum38=((($_sum3)+(12))|0);
   $73=(($mem+$_sum38)|0);
   $74=$73;
   $75=((HEAP32[(($74)>>2)])|0);
   $76=($75|0)==($69|0);
   do {
    if ($76) {
     $_sum40=((($_sum3)+(20))|0);
     $93=(($mem+$_sum40)|0);
     $94=$93;
     $95=((HEAP32[(($94)>>2)])|0);
     $96=($95|0)==0;
     if ($96) {
      $_sum39=((($_sum3)+(16))|0);
      $98=(($mem+$_sum39)|0);
      $99=$98;
      $100=((HEAP32[(($99)>>2)])|0);
      $101=($100|0)==0;
      if ($101) {
       $R_1=0;
       break;
      } else {
       $R_0=$100;$RP_0=$99;
      }
     } else {
      $R_0=$95;$RP_0=$94;
     }
     while(1) {


      $102=(($R_0+20)|0);
      $103=((HEAP32[(($102)>>2)])|0);
      $104=($103|0)==0;
      if (!($104)) {
       $R_0=$103;$RP_0=$102;
       continue;
      }
      $106=(($R_0+16)|0);
      $107=((HEAP32[(($106)>>2)])|0);
      $108=($107|0)==0;
      if ($108) {
       break;
      } else {
       $R_0=$107;$RP_0=$106;
      }
     }
     $110=$RP_0;
     $111=($110>>>0)<($5>>>0);
     if ($111) {
      _abort();

     } else {
      HEAP32[(($RP_0)>>2)]=0;
      $R_1=$R_0;
      break;
     }
    } else {
     $_sum44=((($_sum3)+(8))|0);
     $78=(($mem+$_sum44)|0);
     $79=$78;
     $80=((HEAP32[(($79)>>2)])|0);
     $81=$80;
     $82=($81>>>0)<($5>>>0);
     if ($82) {
      _abort();

     }
     $84=(($80+12)|0);
     $85=((HEAP32[(($84)>>2)])|0);
     $86=($85|0)==($69|0);
     if (!($86)) {
      _abort();

     }
     $88=(($75+8)|0);
     $89=((HEAP32[(($88)>>2)])|0);
     $90=($89|0)==($69|0);
     if ($90) {
      HEAP32[(($84)>>2)]=$75;
      HEAP32[(($88)>>2)]=$80;
      $R_1=$75;
      break;
     } else {
      _abort();

     }
    }
   } while(0);

   $115=($72|0)==0;
   if ($115) {
    $p_0=$25;$psize_0=$26;
   } else {
    $_sum41=((($_sum3)+(28))|0);
    $117=(($mem+$_sum41)|0);
    $118=$117;
    $119=((HEAP32[(($118)>>2)])|0);
    $120=((2712+($119<<2))|0);
    $121=((HEAP32[(($120)>>2)])|0);
    $122=($69|0)==($121|0);
    if ($122) {
     HEAP32[(($120)>>2)]=$R_1;
     $cond=($R_1|0)==0;
     if ($cond) {
      $124=1<<$119;
      $125=$124^-1;
      $126=((HEAP32[((2412)>>2)])|0);
      $127=$126&$125;
      HEAP32[((2412)>>2)]=$127;
      $p_0=$25;$psize_0=$26;
      break;
     }
    } else {
     $129=$72;
     $130=((HEAP32[((2424)>>2)])|0);
     $131=($129>>>0)<($130>>>0);
     if ($131) {
      _abort();

     }
     $133=(($72+16)|0);
     $134=((HEAP32[(($133)>>2)])|0);
     $135=($134|0)==($69|0);
     if ($135) {
      HEAP32[(($133)>>2)]=$R_1;
     } else {
      $138=(($72+20)|0);
      HEAP32[(($138)>>2)]=$R_1;
     }
     $141=($R_1|0)==0;
     if ($141) {
      $p_0=$25;$psize_0=$26;
      break;
     }
    }
    $143=$R_1;
    $144=((HEAP32[((2424)>>2)])|0);
    $145=($143>>>0)<($144>>>0);
    if ($145) {
     _abort();

    }
    $147=(($R_1+24)|0);
    HEAP32[(($147)>>2)]=$72;
    $_sum42=((($_sum3)+(16))|0);
    $148=(($mem+$_sum42)|0);
    $149=$148;
    $150=((HEAP32[(($149)>>2)])|0);
    $151=($150|0)==0;
    do {
     if (!($151)) {
      $153=$150;
      $154=((HEAP32[((2424)>>2)])|0);
      $155=($153>>>0)<($154>>>0);
      if ($155) {
       _abort();

      } else {
       $157=(($R_1+16)|0);
       HEAP32[(($157)>>2)]=$150;
       $158=(($150+24)|0);
       HEAP32[(($158)>>2)]=$R_1;
       break;
      }
     }
    } while(0);
    $_sum43=((($_sum3)+(20))|0);
    $161=(($mem+$_sum43)|0);
    $162=$161;
    $163=((HEAP32[(($162)>>2)])|0);
    $164=($163|0)==0;
    if ($164) {
     $p_0=$25;$psize_0=$26;
    } else {
     $166=$163;
     $167=((HEAP32[((2424)>>2)])|0);
     $168=($166>>>0)<($167>>>0);
     if ($168) {
      _abort();

     } else {
      $170=(($R_1+20)|0);
      HEAP32[(($170)>>2)]=$163;
      $171=(($163+24)|0);
      HEAP32[(($171)>>2)]=$R_1;
      $p_0=$25;$psize_0=$26;
      break;
     }
    }
   }
  } else {
   $p_0=$4;$psize_0=$14;
  }
 } while(0);


 $188=$p_0;
 $189=($188>>>0)<($15>>>0);
 if (!($189)) {
  _abort();

 }
 $_sum34=((($14)-(4))|0);
 $191=(($mem+$_sum34)|0);
 $192=$191;
 $193=((HEAP32[(($192)>>2)])|0);
 $194=$193&1;
 $phitmp=($194|0)==0;
 if ($phitmp) {
  _abort();

 }
 $196=$193&2;
 $197=($196|0)==0;
 if ($197) {
  $199=((HEAP32[((2432)>>2)])|0);
  $200=($16|0)==($199|0);
  if ($200) {
   $202=((HEAP32[((2420)>>2)])|0);
   $203=((($202)+($psize_0))|0);
   HEAP32[((2420)>>2)]=$203;
   HEAP32[((2432)>>2)]=$p_0;
   $204=$203|1;
   $205=(($p_0+4)|0);
   HEAP32[(($205)>>2)]=$204;
   $206=((HEAP32[((2428)>>2)])|0);
   $207=($p_0|0)==($206|0);
   if (!($207)) {
    return;
   }
   HEAP32[((2428)>>2)]=0;
   HEAP32[((2416)>>2)]=0;
   return;
  }
  $210=((HEAP32[((2428)>>2)])|0);
  $211=($16|0)==($210|0);
  if ($211) {
   $213=((HEAP32[((2416)>>2)])|0);
   $214=((($213)+($psize_0))|0);
   HEAP32[((2416)>>2)]=$214;
   HEAP32[((2428)>>2)]=$p_0;
   $215=$214|1;
   $216=(($p_0+4)|0);
   HEAP32[(($216)>>2)]=$215;
   $217=(($188+$214)|0);
   $218=$217;
   HEAP32[(($218)>>2)]=$214;
   return;
  }
  $220=$193&-8;
  $221=((($220)+($psize_0))|0);
  $222=$193>>>3;
  $223=($193>>>0)<((256)>>>0);
  do {
   if ($223) {
    $225=(($mem+$14)|0);
    $226=$225;
    $227=((HEAP32[(($226)>>2)])|0);
    $_sum2829=$14|4;
    $228=(($mem+$_sum2829)|0);
    $229=$228;
    $230=((HEAP32[(($229)>>2)])|0);
    $231=$222<<1;
    $232=((2448+($231<<2))|0);
    $233=$232;
    $234=($227|0)==($233|0);
    if (!($234)) {
     $236=$227;
     $237=((HEAP32[((2424)>>2)])|0);
     $238=($236>>>0)<($237>>>0);
     if ($238) {
      _abort();

     }
     $240=(($227+12)|0);
     $241=((HEAP32[(($240)>>2)])|0);
     $242=($241|0)==($16|0);
     if (!($242)) {
      _abort();

     }
    }
    $243=($230|0)==($227|0);
    if ($243) {
     $245=1<<$222;
     $246=$245^-1;
     $247=((HEAP32[((2408)>>2)])|0);
     $248=$247&$246;
     HEAP32[((2408)>>2)]=$248;
     break;
    }
    $250=($230|0)==($233|0);
    if ($250) {
     $_pre82=(($230+8)|0);
     $_pre_phi83=$_pre82;
    } else {
     $252=$230;
     $253=((HEAP32[((2424)>>2)])|0);
     $254=($252>>>0)<($253>>>0);
     if ($254) {
      _abort();

     }
     $256=(($230+8)|0);
     $257=((HEAP32[(($256)>>2)])|0);
     $258=($257|0)==($16|0);
     if ($258) {
      $_pre_phi83=$256;
     } else {
      _abort();

     }
    }

    $259=(($227+12)|0);
    HEAP32[(($259)>>2)]=$230;
    HEAP32[(($_pre_phi83)>>2)]=$227;
   } else {
    $261=$15;
    $_sum6=((($14)+(16))|0);
    $262=(($mem+$_sum6)|0);
    $263=$262;
    $264=((HEAP32[(($263)>>2)])|0);
    $_sum78=$14|4;
    $265=(($mem+$_sum78)|0);
    $266=$265;
    $267=((HEAP32[(($266)>>2)])|0);
    $268=($267|0)==($261|0);
    do {
     if ($268) {
      $_sum10=((($14)+(12))|0);
      $286=(($mem+$_sum10)|0);
      $287=$286;
      $288=((HEAP32[(($287)>>2)])|0);
      $289=($288|0)==0;
      if ($289) {
       $_sum9=((($14)+(8))|0);
       $291=(($mem+$_sum9)|0);
       $292=$291;
       $293=((HEAP32[(($292)>>2)])|0);
       $294=($293|0)==0;
       if ($294) {
        $R7_1=0;
        break;
       } else {
        $R7_0=$293;$RP9_0=$292;
       }
      } else {
       $R7_0=$288;$RP9_0=$287;
      }
      while(1) {


       $295=(($R7_0+20)|0);
       $296=((HEAP32[(($295)>>2)])|0);
       $297=($296|0)==0;
       if (!($297)) {
        $R7_0=$296;$RP9_0=$295;
        continue;
       }
       $299=(($R7_0+16)|0);
       $300=((HEAP32[(($299)>>2)])|0);
       $301=($300|0)==0;
       if ($301) {
        break;
       } else {
        $R7_0=$300;$RP9_0=$299;
       }
      }
      $303=$RP9_0;
      $304=((HEAP32[((2424)>>2)])|0);
      $305=($303>>>0)<($304>>>0);
      if ($305) {
       _abort();

      } else {
       HEAP32[(($RP9_0)>>2)]=0;
       $R7_1=$R7_0;
       break;
      }
     } else {
      $270=(($mem+$14)|0);
      $271=$270;
      $272=((HEAP32[(($271)>>2)])|0);
      $273=$272;
      $274=((HEAP32[((2424)>>2)])|0);
      $275=($273>>>0)<($274>>>0);
      if ($275) {
       _abort();

      }
      $277=(($272+12)|0);
      $278=((HEAP32[(($277)>>2)])|0);
      $279=($278|0)==($261|0);
      if (!($279)) {
       _abort();

      }
      $281=(($267+8)|0);
      $282=((HEAP32[(($281)>>2)])|0);
      $283=($282|0)==($261|0);
      if ($283) {
       HEAP32[(($277)>>2)]=$267;
       HEAP32[(($281)>>2)]=$272;
       $R7_1=$267;
       break;
      } else {
       _abort();

      }
     }
    } while(0);

    $309=($264|0)==0;
    if (!($309)) {
     $_sum21=((($14)+(20))|0);
     $311=(($mem+$_sum21)|0);
     $312=$311;
     $313=((HEAP32[(($312)>>2)])|0);
     $314=((2712+($313<<2))|0);
     $315=((HEAP32[(($314)>>2)])|0);
     $316=($261|0)==($315|0);
     if ($316) {
      HEAP32[(($314)>>2)]=$R7_1;
      $cond69=($R7_1|0)==0;
      if ($cond69) {
       $318=1<<$313;
       $319=$318^-1;
       $320=((HEAP32[((2412)>>2)])|0);
       $321=$320&$319;
       HEAP32[((2412)>>2)]=$321;
       break;
      }
     } else {
      $323=$264;
      $324=((HEAP32[((2424)>>2)])|0);
      $325=($323>>>0)<($324>>>0);
      if ($325) {
       _abort();

      }
      $327=(($264+16)|0);
      $328=((HEAP32[(($327)>>2)])|0);
      $329=($328|0)==($261|0);
      if ($329) {
       HEAP32[(($327)>>2)]=$R7_1;
      } else {
       $332=(($264+20)|0);
       HEAP32[(($332)>>2)]=$R7_1;
      }
      $335=($R7_1|0)==0;
      if ($335) {
       break;
      }
     }
     $337=$R7_1;
     $338=((HEAP32[((2424)>>2)])|0);
     $339=($337>>>0)<($338>>>0);
     if ($339) {
      _abort();

     }
     $341=(($R7_1+24)|0);
     HEAP32[(($341)>>2)]=$264;
     $_sum22=((($14)+(8))|0);
     $342=(($mem+$_sum22)|0);
     $343=$342;
     $344=((HEAP32[(($343)>>2)])|0);
     $345=($344|0)==0;
     do {
      if (!($345)) {
       $347=$344;
       $348=((HEAP32[((2424)>>2)])|0);
       $349=($347>>>0)<($348>>>0);
       if ($349) {
        _abort();

       } else {
        $351=(($R7_1+16)|0);
        HEAP32[(($351)>>2)]=$344;
        $352=(($344+24)|0);
        HEAP32[(($352)>>2)]=$R7_1;
        break;
       }
      }
     } while(0);
     $_sum23=((($14)+(12))|0);
     $355=(($mem+$_sum23)|0);
     $356=$355;
     $357=((HEAP32[(($356)>>2)])|0);
     $358=($357|0)==0;
     if (!($358)) {
      $360=$357;
      $361=((HEAP32[((2424)>>2)])|0);
      $362=($360>>>0)<($361>>>0);
      if ($362) {
       _abort();

      } else {
       $364=(($R7_1+20)|0);
       HEAP32[(($364)>>2)]=$357;
       $365=(($357+24)|0);
       HEAP32[(($365)>>2)]=$R7_1;
       break;
      }
     }
    }
   }
  } while(0);
  $368=$221|1;
  $369=(($p_0+4)|0);
  HEAP32[(($369)>>2)]=$368;
  $370=(($188+$221)|0);
  $371=$370;
  HEAP32[(($371)>>2)]=$221;
  $372=((HEAP32[((2428)>>2)])|0);
  $373=($p_0|0)==($372|0);
  if ($373) {
   HEAP32[((2416)>>2)]=$221;
   return;
  } else {
   $psize_1=$221;
  }
 } else {
  $376=$193&-2;
  HEAP32[(($192)>>2)]=$376;
  $377=$psize_0|1;
  $378=(($p_0+4)|0);
  HEAP32[(($378)>>2)]=$377;
  $379=(($188+$psize_0)|0);
  $380=$379;
  HEAP32[(($380)>>2)]=$psize_0;
  $psize_1=$psize_0;
 }

 $382=$psize_1>>>3;
 $383=($psize_1>>>0)<((256)>>>0);
 if ($383) {
  $385=$382<<1;
  $386=((2448+($385<<2))|0);
  $387=$386;
  $388=((HEAP32[((2408)>>2)])|0);
  $389=1<<$382;
  $390=$388&$389;
  $391=($390|0)==0;
  if ($391) {
   $393=$388|$389;
   HEAP32[((2408)>>2)]=$393;
   $_sum19_pre=((($385)+(2))|0);
   $_pre=((2448+($_sum19_pre<<2))|0);
   $F16_0=$387;$_pre_phi=$_pre;
  } else {
   $_sum20=((($385)+(2))|0);
   $395=((2448+($_sum20<<2))|0);
   $396=((HEAP32[(($395)>>2)])|0);
   $397=$396;
   $398=((HEAP32[((2424)>>2)])|0);
   $399=($397>>>0)<($398>>>0);
   if ($399) {
    _abort();

   } else {
    $F16_0=$396;$_pre_phi=$395;
   }
  }


  HEAP32[(($_pre_phi)>>2)]=$p_0;
  $402=(($F16_0+12)|0);
  HEAP32[(($402)>>2)]=$p_0;
  $403=(($p_0+8)|0);
  HEAP32[(($403)>>2)]=$F16_0;
  $404=(($p_0+12)|0);
  HEAP32[(($404)>>2)]=$387;
  return;
 }
 $406=$p_0;
 $407=$psize_1>>>8;
 $408=($407|0)==0;
 if ($408) {
  $I18_0=0;
 } else {
  $410=($psize_1>>>0)>((16777215)>>>0);
  if ($410) {
   $I18_0=31;
  } else {
   $412=((($407)+(1048320))|0);
   $413=$412>>>16;
   $414=$413&8;
   $415=$407<<$414;
   $416=((($415)+(520192))|0);
   $417=$416>>>16;
   $418=$417&4;
   $419=$418|$414;
   $420=$415<<$418;
   $421=((($420)+(245760))|0);
   $422=$421>>>16;
   $423=$422&2;
   $424=$419|$423;
   $425=(((14)-($424))|0);
   $426=$420<<$423;
   $427=$426>>>15;
   $428=((($425)+($427))|0);
   $429=$428<<1;
   $430=((($428)+(7))|0);
   $431=$psize_1>>>($430>>>0);
   $432=$431&1;
   $433=$432|$429;
   $I18_0=$433;
  }
 }

 $435=((2712+($I18_0<<2))|0);
 $436=(($p_0+28)|0);
 $I18_0_c=$I18_0;
 HEAP32[(($436)>>2)]=$I18_0_c;
 $437=(($p_0+20)|0);
 HEAP32[(($437)>>2)]=0;
 $438=(($p_0+16)|0);
 HEAP32[(($438)>>2)]=0;
 $439=((HEAP32[((2412)>>2)])|0);
 $440=1<<$I18_0;
 $441=$439&$440;
 $442=($441|0)==0;
 L199: do {
  if ($442) {
   $444=$439|$440;
   HEAP32[((2412)>>2)]=$444;
   HEAP32[(($435)>>2)]=$406;
   $445=(($p_0+24)|0);
   $_c=$435;
   HEAP32[(($445)>>2)]=$_c;
   $446=(($p_0+12)|0);
   HEAP32[(($446)>>2)]=$p_0;
   $447=(($p_0+8)|0);
   HEAP32[(($447)>>2)]=$p_0;
  } else {
   $449=((HEAP32[(($435)>>2)])|0);
   $450=($I18_0|0)==31;
   if ($450) {
    $455=0;
   } else {
    $452=$I18_0>>>1;
    $453=(((25)-($452))|0);
    $455=$453;
   }

   $456=(($449+4)|0);
   $457=((HEAP32[(($456)>>2)])|0);
   $458=$457&-8;
   $459=($458|0)==($psize_1|0);
   L204: do {
    if ($459) {
     $T_0_lcssa=$449;
    } else {
     $460=$psize_1<<$455;
     $T_071=$449;$K19_072=$460;
     while(1) {


      $468=$K19_072>>>31;
      $469=(($T_071+16+($468<<2))|0);
      $470=((HEAP32[(($469)>>2)])|0);
      $471=($470|0)==0;
      if ($471) {
       break;
      }
      $462=$K19_072<<1;
      $463=(($470+4)|0);
      $464=((HEAP32[(($463)>>2)])|0);
      $465=$464&-8;
      $466=($465|0)==($psize_1|0);
      if ($466) {
       $T_0_lcssa=$470;
       break L204;
      } else {
       $T_071=$470;$K19_072=$462;
      }
     }
     $473=$469;
     $474=((HEAP32[((2424)>>2)])|0);
     $475=($473>>>0)<($474>>>0);
     if ($475) {
      _abort();

     } else {
      HEAP32[(($469)>>2)]=$406;
      $477=(($p_0+24)|0);
      $T_0_c16=$T_071;
      HEAP32[(($477)>>2)]=$T_0_c16;
      $478=(($p_0+12)|0);
      HEAP32[(($478)>>2)]=$p_0;
      $479=(($p_0+8)|0);
      HEAP32[(($479)>>2)]=$p_0;
      break L199;
     }
    }
   } while(0);

   $481=(($T_0_lcssa+8)|0);
   $482=((HEAP32[(($481)>>2)])|0);
   $483=$T_0_lcssa;
   $484=((HEAP32[((2424)>>2)])|0);
   $485=($483>>>0)<($484>>>0);
   if ($485) {
    _abort();

   }
   $487=$482;
   $488=($487>>>0)<($484>>>0);
   if ($488) {
    _abort();

   } else {
    $490=(($482+12)|0);
    HEAP32[(($490)>>2)]=$406;
    HEAP32[(($481)>>2)]=$406;
    $491=(($p_0+8)|0);
    $_c15=$482;
    HEAP32[(($491)>>2)]=$_c15;
    $492=(($p_0+12)|0);
    $T_0_c=$T_0_lcssa;
    HEAP32[(($492)>>2)]=$T_0_c;
    $493=(($p_0+24)|0);
    HEAP32[(($493)>>2)]=0;
    break;
   }
  }
 } while(0);
 $495=((HEAP32[((2440)>>2)])|0);
 $496=((($495)-(1))|0);
 HEAP32[((2440)>>2)]=$496;
 $497=($496|0)==0;
 if ($497) {
  $sp_0_in_i=2864;
 } else {
  return;
 }
 while(1) {

  $sp_0_i=((HEAP32[(($sp_0_in_i)>>2)])|0);
  $498=($sp_0_i|0)==0;
  $499=(($sp_0_i+8)|0);
  if ($498) {
   break;
  } else {
   $sp_0_in_i=$499;
  }
 }
 HEAP32[((2440)>>2)]=-1;
 return;
}


function _calloc($n_elements,$elem_size){
 $n_elements=($n_elements)|0;
 $elem_size=($elem_size)|0;
 var $1=0,$3=0,$4=0,$5=0,$7=0,$8=0,$_=0,$req_0=0,$10=0,$11=0,$13=0,$14=0,$15=0,$16=0,$17=0,label=0;

 $1=($n_elements|0)==0;
 if ($1) {
  $req_0=0;
 } else {
  $3=(Math_imul($elem_size,$n_elements)|0);
  $4=$elem_size|$n_elements;
  $5=($4>>>0)>((65535)>>>0);
  if ($5) {
   $7=(((($3>>>0))/(($n_elements>>>0)))&-1);
   $8=($7|0)==($elem_size|0);
   $_=($8?$3:-1);
   $req_0=$_;
  } else {
   $req_0=$3;
  }
 }

 $10=((_malloc($req_0))|0);
 $11=($10|0)==0;
 if ($11) {
  return (($10)|0);
 }
 $13=((($10)-(4))|0);
 $14=$13;
 $15=((HEAP32[(($14)>>2)])|0);
 $16=$15&3;
 $17=($16|0)==0;
 if ($17) {
  return (($10)|0);
 }
 _memset((((($10)|0))|0), ((((0)|0))|0), (((($req_0)|0))|0))|0;
 return (($10)|0);
}


function _realloc($oldmem,$bytes){
 $oldmem=($oldmem)|0;
 $bytes=($bytes)|0;
 var $1=0,$3=0,$5=0,$7=0,$9=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0,$23=0,$24=0,$26=0,$27=0,$28=0,$29=0;
 var $30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$mem_0=0,label=0;

 $1=($oldmem|0)==0;
 if ($1) {
  $3=((_malloc($bytes))|0);
  $mem_0=$3;

  return (($mem_0)|0);
 }
 $5=($bytes>>>0)>((4294967231)>>>0);
 if ($5) {
  $7=((___errno_location())|0);
  HEAP32[(($7)>>2)]=12;
  $mem_0=0;

  return (($mem_0)|0);
 }
 $9=($bytes>>>0)<((11)>>>0);
 if ($9) {
  $14=16;
 } else {
  $11=((($bytes)+(11))|0);
  $12=$11&-8;
  $14=$12;
 }

 $15=((($oldmem)-(8))|0);
 $16=$15;
 $17=((_try_realloc_chunk($16,$14))|0);
 $18=($17|0)==0;
 if (!($18)) {
  $20=(($17+8)|0);
  $21=$20;
  $mem_0=$21;

  return (($mem_0)|0);
 }
 $23=((_malloc($bytes))|0);
 $24=($23|0)==0;
 if ($24) {
  $mem_0=0;

  return (($mem_0)|0);
 }
 $26=((($oldmem)-(4))|0);
 $27=$26;
 $28=((HEAP32[(($27)>>2)])|0);
 $29=$28&-8;
 $30=$28&3;
 $31=($30|0)==0;
 $32=($31?8:4);
 $33=((($29)-($32))|0);
 $34=($33>>>0)<($bytes>>>0);
 $35=($34?$33:$bytes);
 (_memcpy((($23)|0), (($oldmem)|0), $35)|0);
 _free($oldmem);
 $mem_0=$23;

 return (($mem_0)|0);
}


function _try_realloc_chunk($p,$nb){
 $p=($p)|0;
 $nb=($nb)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$10=0,$11=0,$12=0,$or_cond=0,$_sum3334=0,$14=0,$15=0,$16=0,$17=0,$phitmp=0,$19=0,$21=0;
 var $23=0,$24=0,$26=0,$27=0,$28=0,$29=0,$32=0,$34=0,$35=0,$37=0,$38=0,$39=0,$40=0,$41=0,$_sum29=0,$42=0,$43=0,$44=0,$45=0,$46=0;
 var $48=0,$49=0,$51=0,$52=0,$53=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$_sum28=0,$61=0,$62=0,$63=0,$65=0,$66=0,$68=0,$69=0,$70=0;
 var $72=0,$73=0,$75=0,$76=0,$77=0,$78=0,$79=0,$80=0,$_sum25=0,$81=0,$82=0,$83=0,$84=0,$_sum26=0,$85=0,$86=0,$87=0,$88=0,$90=0,$91=0;
 var $92=0,$_sum23=0,$93=0,$94=0,$95=0,$96=0,$storemerge27=0,$storemerge=0,$99=0,$100=0,$102=0,$103=0,$104=0,$106=0,$107=0,$108=0,$_sum17=0,$110=0,$111=0,$112=0;
 var $_sum18=0,$113=0,$114=0,$115=0,$116=0,$117=0,$118=0,$119=0,$121=0,$122=0,$124=0,$125=0,$126=0,$127=0,$129=0,$130=0,$131=0,$132=0,$134=0,$_pre=0;
 var $136=0,$137=0,$139=0,$140=0,$141=0,$_pre_phi=0,$142=0,$144=0,$_sum=0,$145=0,$146=0,$147=0,$_sum2=0,$148=0,$149=0,$150=0,$151=0,$_sum14=0,$153=0,$154=0;
 var $155=0,$156=0,$157=0,$159=0,$160=0,$161=0,$163=0,$164=0,$165=0,$_sum4=0,$168=0,$169=0,$170=0,$171=0,$_sum3=0,$173=0,$174=0,$175=0,$176=0,$RP_0=0;
 var $R_0=0,$177=0,$178=0,$179=0,$181=0,$182=0,$183=0,$185=0,$186=0,$R_1=0,$190=0,$_sum11=0,$192=0,$193=0,$194=0,$195=0,$196=0,$197=0,$cond=0,$199=0;
 var $200=0,$201=0,$202=0,$204=0,$205=0,$206=0,$208=0,$209=0,$210=0,$213=0,$216=0,$218=0,$219=0,$220=0,$222=0,$_sum12=0,$223=0,$224=0,$225=0,$226=0;
 var $228=0,$229=0,$230=0,$232=0,$233=0,$_sum13=0,$236=0,$237=0,$238=0,$239=0,$241=0,$242=0,$243=0,$245=0,$246=0,$250=0,$252=0,$253=0,$254=0,$255=0;
 var $_sum910=0,$256=0,$257=0,$258=0,$259=0,$261=0,$262=0,$263=0,$264=0,$265=0,$266=0,$_sum5=0,$267=0,$268=0,$269=0,$_sum78=0,$270=0,$271=0,$272=0,$273=0;
 var $newp_0=0,label=0;

 $1=(($p+4)|0);
 $2=((HEAP32[(($1)>>2)])|0);
 $3=$2&-8;
 $4=$p;
 $5=(($4+$3)|0);
 $6=$5;
 $7=((HEAP32[((2424)>>2)])|0);
 $8=($4>>>0)<($7>>>0);
 if ($8) {
  _abort(); return ((0)|0);
  return ((0)|0);
 }
 $10=$2&3;
 $11=($10|0)!=1;
 $12=($4>>>0)<($5>>>0);
 $or_cond=$11&$12;
 if (!($or_cond)) {
  _abort(); return ((0)|0);
  return ((0)|0);
 }
 $_sum3334=$3|4;
 $14=(($4+$_sum3334)|0);
 $15=$14;
 $16=((HEAP32[(($15)>>2)])|0);
 $17=$16&1;
 $phitmp=($17|0)==0;
 if ($phitmp) {
  _abort(); return ((0)|0);
  return ((0)|0);
 }
 $19=($10|0)==0;
 if ($19) {
  $21=($nb>>>0)<((256)>>>0);
  if ($21) {
   $newp_0=0;

   return (($newp_0)|0);
  }
  $23=((($nb)+(4))|0);
  $24=($3>>>0)<($23>>>0);
  if (!($24)) {
   $26=((($3)-($nb))|0);
   $27=((HEAP32[((2384)>>2)])|0);
   $28=$27<<1;
   $29=($26>>>0)>($28>>>0);
   if (!($29)) {
    $newp_0=$p;

    return (($newp_0)|0);
   }
  }
  $newp_0=0;

  return (($newp_0)|0);
 }
 $32=($3>>>0)<($nb>>>0);
 if (!($32)) {
  $34=((($3)-($nb))|0);
  $35=($34>>>0)>((15)>>>0);
  if (!($35)) {
   $newp_0=$p;

   return (($newp_0)|0);
  }
  $37=(($4+$nb)|0);
  $38=$37;
  $39=$2&1;
  $40=$39|$nb;
  $41=$40|2;
  HEAP32[(($1)>>2)]=$41;
  $_sum29=((($nb)+(4))|0);
  $42=(($4+$_sum29)|0);
  $43=$42;
  $44=$34|3;
  HEAP32[(($43)>>2)]=$44;
  $45=((HEAP32[(($15)>>2)])|0);
  $46=$45|1;
  HEAP32[(($15)>>2)]=$46;
  _dispose_chunk($38,$34);
  $newp_0=$p;

  return (($newp_0)|0);
 }
 $48=((HEAP32[((2432)>>2)])|0);
 $49=($6|0)==($48|0);
 if ($49) {
  $51=((HEAP32[((2420)>>2)])|0);
  $52=((($51)+($3))|0);
  $53=($52>>>0)>($nb>>>0);
  if (!($53)) {
   $newp_0=0;

   return (($newp_0)|0);
  }
  $55=((($52)-($nb))|0);
  $56=(($4+$nb)|0);
  $57=$56;
  $58=$2&1;
  $59=$58|$nb;
  $60=$59|2;
  HEAP32[(($1)>>2)]=$60;
  $_sum28=((($nb)+(4))|0);
  $61=(($4+$_sum28)|0);
  $62=$61;
  $63=$55|1;
  HEAP32[(($62)>>2)]=$63;
  HEAP32[((2432)>>2)]=$57;
  HEAP32[((2420)>>2)]=$55;
  $newp_0=$p;

  return (($newp_0)|0);
 }
 $65=((HEAP32[((2428)>>2)])|0);
 $66=($6|0)==($65|0);
 if ($66) {
  $68=((HEAP32[((2416)>>2)])|0);
  $69=((($68)+($3))|0);
  $70=($69>>>0)<($nb>>>0);
  if ($70) {
   $newp_0=0;

   return (($newp_0)|0);
  }
  $72=((($69)-($nb))|0);
  $73=($72>>>0)>((15)>>>0);
  if ($73) {
   $75=(($4+$nb)|0);
   $76=$75;
   $77=(($4+$69)|0);
   $78=$2&1;
   $79=$78|$nb;
   $80=$79|2;
   HEAP32[(($1)>>2)]=$80;
   $_sum25=((($nb)+(4))|0);
   $81=(($4+$_sum25)|0);
   $82=$81;
   $83=$72|1;
   HEAP32[(($82)>>2)]=$83;
   $84=$77;
   HEAP32[(($84)>>2)]=$72;
   $_sum26=((($69)+(4))|0);
   $85=(($4+$_sum26)|0);
   $86=$85;
   $87=((HEAP32[(($86)>>2)])|0);
   $88=$87&-2;
   HEAP32[(($86)>>2)]=$88;
   $storemerge=$76;$storemerge27=$72;
  } else {
   $90=$2&1;
   $91=$90|$69;
   $92=$91|2;
   HEAP32[(($1)>>2)]=$92;
   $_sum23=((($69)+(4))|0);
   $93=(($4+$_sum23)|0);
   $94=$93;
   $95=((HEAP32[(($94)>>2)])|0);
   $96=$95|1;
   HEAP32[(($94)>>2)]=$96;
   $storemerge=0;$storemerge27=0;
  }


  HEAP32[((2416)>>2)]=$storemerge27;
  HEAP32[((2428)>>2)]=$storemerge;
  $newp_0=$p;

  return (($newp_0)|0);
 }
 $99=$16&2;
 $100=($99|0)==0;
 if (!($100)) {
  $newp_0=0;

  return (($newp_0)|0);
 }
 $102=$16&-8;
 $103=((($102)+($3))|0);
 $104=($103>>>0)<($nb>>>0);
 if ($104) {
  $newp_0=0;

  return (($newp_0)|0);
 }
 $106=((($103)-($nb))|0);
 $107=$16>>>3;
 $108=($16>>>0)<((256)>>>0);
 do {
  if ($108) {
   $_sum17=((($3)+(8))|0);
   $110=(($4+$_sum17)|0);
   $111=$110;
   $112=((HEAP32[(($111)>>2)])|0);
   $_sum18=((($3)+(12))|0);
   $113=(($4+$_sum18)|0);
   $114=$113;
   $115=((HEAP32[(($114)>>2)])|0);
   $116=$107<<1;
   $117=((2448+($116<<2))|0);
   $118=$117;
   $119=($112|0)==($118|0);
   if (!($119)) {
    $121=$112;
    $122=($121>>>0)<($7>>>0);
    if ($122) {
     _abort(); return ((0)|0);
     return ((0)|0);
    }
    $124=(($112+12)|0);
    $125=((HEAP32[(($124)>>2)])|0);
    $126=($125|0)==($6|0);
    if (!($126)) {
     _abort(); return ((0)|0);
     return ((0)|0);
    }
   }
   $127=($115|0)==($112|0);
   if ($127) {
    $129=1<<$107;
    $130=$129^-1;
    $131=((HEAP32[((2408)>>2)])|0);
    $132=$131&$130;
    HEAP32[((2408)>>2)]=$132;
    break;
   }
   $134=($115|0)==($118|0);
   if ($134) {
    $_pre=(($115+8)|0);
    $_pre_phi=$_pre;
   } else {
    $136=$115;
    $137=($136>>>0)<($7>>>0);
    if ($137) {
     _abort(); return ((0)|0);
     return ((0)|0);
    }
    $139=(($115+8)|0);
    $140=((HEAP32[(($139)>>2)])|0);
    $141=($140|0)==($6|0);
    if ($141) {
     $_pre_phi=$139;
    } else {
     _abort(); return ((0)|0);
     return ((0)|0);
    }
   }

   $142=(($112+12)|0);
   HEAP32[(($142)>>2)]=$115;
   HEAP32[(($_pre_phi)>>2)]=$112;
  } else {
   $144=$5;
   $_sum=((($3)+(24))|0);
   $145=(($4+$_sum)|0);
   $146=$145;
   $147=((HEAP32[(($146)>>2)])|0);
   $_sum2=((($3)+(12))|0);
   $148=(($4+$_sum2)|0);
   $149=$148;
   $150=((HEAP32[(($149)>>2)])|0);
   $151=($150|0)==($144|0);
   do {
    if ($151) {
     $_sum4=((($3)+(20))|0);
     $168=(($4+$_sum4)|0);
     $169=$168;
     $170=((HEAP32[(($169)>>2)])|0);
     $171=($170|0)==0;
     if ($171) {
      $_sum3=((($3)+(16))|0);
      $173=(($4+$_sum3)|0);
      $174=$173;
      $175=((HEAP32[(($174)>>2)])|0);
      $176=($175|0)==0;
      if ($176) {
       $R_1=0;
       break;
      } else {
       $R_0=$175;$RP_0=$174;
      }
     } else {
      $R_0=$170;$RP_0=$169;
     }
     while(1) {


      $177=(($R_0+20)|0);
      $178=((HEAP32[(($177)>>2)])|0);
      $179=($178|0)==0;
      if (!($179)) {
       $R_0=$178;$RP_0=$177;
       continue;
      }
      $181=(($R_0+16)|0);
      $182=((HEAP32[(($181)>>2)])|0);
      $183=($182|0)==0;
      if ($183) {
       break;
      } else {
       $R_0=$182;$RP_0=$181;
      }
     }
     $185=$RP_0;
     $186=($185>>>0)<($7>>>0);
     if ($186) {
      _abort(); return ((0)|0);
      return ((0)|0);
     } else {
      HEAP32[(($RP_0)>>2)]=0;
      $R_1=$R_0;
      break;
     }
    } else {
     $_sum14=((($3)+(8))|0);
     $153=(($4+$_sum14)|0);
     $154=$153;
     $155=((HEAP32[(($154)>>2)])|0);
     $156=$155;
     $157=($156>>>0)<($7>>>0);
     if ($157) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $159=(($155+12)|0);
     $160=((HEAP32[(($159)>>2)])|0);
     $161=($160|0)==($144|0);
     if (!($161)) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $163=(($150+8)|0);
     $164=((HEAP32[(($163)>>2)])|0);
     $165=($164|0)==($144|0);
     if ($165) {
      HEAP32[(($159)>>2)]=$150;
      HEAP32[(($163)>>2)]=$155;
      $R_1=$150;
      break;
     } else {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
    }
   } while(0);

   $190=($147|0)==0;
   if (!($190)) {
    $_sum11=((($3)+(28))|0);
    $192=(($4+$_sum11)|0);
    $193=$192;
    $194=((HEAP32[(($193)>>2)])|0);
    $195=((2712+($194<<2))|0);
    $196=((HEAP32[(($195)>>2)])|0);
    $197=($144|0)==($196|0);
    if ($197) {
     HEAP32[(($195)>>2)]=$R_1;
     $cond=($R_1|0)==0;
     if ($cond) {
      $199=1<<$194;
      $200=$199^-1;
      $201=((HEAP32[((2412)>>2)])|0);
      $202=$201&$200;
      HEAP32[((2412)>>2)]=$202;
      break;
     }
    } else {
     $204=$147;
     $205=((HEAP32[((2424)>>2)])|0);
     $206=($204>>>0)<($205>>>0);
     if ($206) {
      _abort(); return ((0)|0);
      return ((0)|0);
     }
     $208=(($147+16)|0);
     $209=((HEAP32[(($208)>>2)])|0);
     $210=($209|0)==($144|0);
     if ($210) {
      HEAP32[(($208)>>2)]=$R_1;
     } else {
      $213=(($147+20)|0);
      HEAP32[(($213)>>2)]=$R_1;
     }
     $216=($R_1|0)==0;
     if ($216) {
      break;
     }
    }
    $218=$R_1;
    $219=((HEAP32[((2424)>>2)])|0);
    $220=($218>>>0)<($219>>>0);
    if ($220) {
     _abort(); return ((0)|0);
     return ((0)|0);
    }
    $222=(($R_1+24)|0);
    HEAP32[(($222)>>2)]=$147;
    $_sum12=((($3)+(16))|0);
    $223=(($4+$_sum12)|0);
    $224=$223;
    $225=((HEAP32[(($224)>>2)])|0);
    $226=($225|0)==0;
    do {
     if (!($226)) {
      $228=$225;
      $229=((HEAP32[((2424)>>2)])|0);
      $230=($228>>>0)<($229>>>0);
      if ($230) {
       _abort(); return ((0)|0);
       return ((0)|0);
      } else {
       $232=(($R_1+16)|0);
       HEAP32[(($232)>>2)]=$225;
       $233=(($225+24)|0);
       HEAP32[(($233)>>2)]=$R_1;
       break;
      }
     }
    } while(0);
    $_sum13=((($3)+(20))|0);
    $236=(($4+$_sum13)|0);
    $237=$236;
    $238=((HEAP32[(($237)>>2)])|0);
    $239=($238|0)==0;
    if (!($239)) {
     $241=$238;
     $242=((HEAP32[((2424)>>2)])|0);
     $243=($241>>>0)<($242>>>0);
     if ($243) {
      _abort(); return ((0)|0);
      return ((0)|0);
     } else {
      $245=(($R_1+20)|0);
      HEAP32[(($245)>>2)]=$238;
      $246=(($238+24)|0);
      HEAP32[(($246)>>2)]=$R_1;
      break;
     }
    }
   }
  }
 } while(0);
 $250=($106>>>0)<((16)>>>0);
 if ($250) {
  $252=((HEAP32[(($1)>>2)])|0);
  $253=$252&1;
  $254=$103|$253;
  $255=$254|2;
  HEAP32[(($1)>>2)]=$255;
  $_sum910=$103|4;
  $256=(($4+$_sum910)|0);
  $257=$256;
  $258=((HEAP32[(($257)>>2)])|0);
  $259=$258|1;
  HEAP32[(($257)>>2)]=$259;
  $newp_0=$p;

  return (($newp_0)|0);
 } else {
  $261=(($4+$nb)|0);
  $262=$261;
  $263=((HEAP32[(($1)>>2)])|0);
  $264=$263&1;
  $265=$264|$nb;
  $266=$265|2;
  HEAP32[(($1)>>2)]=$266;
  $_sum5=((($nb)+(4))|0);
  $267=(($4+$_sum5)|0);
  $268=$267;
  $269=$106|3;
  HEAP32[(($268)>>2)]=$269;
  $_sum78=$103|4;
  $270=(($4+$_sum78)|0);
  $271=$270;
  $272=((HEAP32[(($271)>>2)])|0);
  $273=$272|1;
  HEAP32[(($271)>>2)]=$273;
  _dispose_chunk($262,$106);
  $newp_0=$p;

  return (($newp_0)|0);
 }
  return 0;
}


function _realloc_in_place($oldmem,$bytes){
 $oldmem=($oldmem)|0;
 $bytes=($bytes)|0;
 var $1=0,$3=0,$5=0,$7=0,$9=0,$10=0,$12=0,$13=0,$14=0,$15=0,$16=0,$oldmem_=0,label=0;

 $1=($oldmem|0)==0;
 if ($1) {
  return ((0)|0);
 }
 $3=($bytes>>>0)>((4294967231)>>>0);
 if ($3) {
  $5=((___errno_location())|0);
  HEAP32[(($5)>>2)]=12;
  return ((0)|0);
 }
 $7=($bytes>>>0)<((11)>>>0);
 if ($7) {
  $12=16;
 } else {
  $9=((($bytes)+(11))|0);
  $10=$9&-8;
  $12=$10;
 }

 $13=((($oldmem)-(8))|0);
 $14=$13;
 $15=((_try_realloc_chunk($14,$12))|0);
 $16=($15|0)==($14|0);
 $oldmem_=($16?$oldmem:0);
 return (($oldmem_)|0);
}


function _memalign($alignment,$bytes){
 $alignment=($alignment)|0;
 $bytes=($bytes)|0;
 var $1=0,$3=0,$5=0,$_0=0,label=0;

 $1=($alignment>>>0)<((9)>>>0);
 if ($1) {
  $3=((_malloc($bytes))|0);
  $_0=$3;

  return (($_0)|0);
 } else {
  $5=((_internal_memalign($alignment,$bytes))|0);
  $_0=$5;

  return (($_0)|0);
 }
  return 0;
}


function _internal_memalign($alignment,$bytes){
 $alignment=($alignment)|0;
 $bytes=($bytes)|0;
 var $1=0,$_alignment=0,$2=0,$3=0,$4=0,$a_0=0,$5=0,$6=0,$_1=0,$7=0,$8=0,$10=0,$12=0,$14=0,$15=0,$17=0,$18=0,$19=0,$20=0,$21=0;
 var $23=0,$24=0,$25=0,$26=0,$27=0,$28=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$_sum3=0,$41=0,$43=0,$44=0;
 var $45=0,$46=0,$47=0,$48=0,$49=0,$50=0,$51=0,$52=0,$53=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$62=0,$63=0,$64=0,$65=0,$66=0;
 var $67=0,$_sum4=0,$68=0,$69=0,$70=0,$71=0,$72=0,$73=0,$74=0,$75=0,$_sum6=0,$76=0,$77=0,$78=0,$79=0,$p_0=0,$81=0,$82=0,$83=0,$84=0;
 var $86=0,$87=0,$88=0,$90=0,$91=0,$92=0,$93=0,$94=0,$95=0,$96=0,$_sum1=0,$97=0,$98=0,$99=0,$_sum2=0,$100=0,$101=0,$102=0,$103=0,$105=0;
 var $106=0,$mem_0=0,label=0;

 $1=($alignment>>>0)<((16)>>>0);
 $_alignment=($1?16:$alignment);
 $2=((($_alignment)-(1))|0);
 $3=$2&$_alignment;
 $4=($3|0)==0;
 if ($4) {
  $_1=$_alignment;
 } else {
  $a_0=16;
  while(1) {

   $5=($a_0>>>0)<($_alignment>>>0);
   $6=$a_0<<1;
   if ($5) {
    $a_0=$6;
   } else {
    $_1=$a_0;
    break;
   }
  }
 }

 $7=(((-64)-($_1))|0);
 $8=($7>>>0)>($bytes>>>0);
 if (!($8)) {
  $10=((___errno_location())|0);
  HEAP32[(($10)>>2)]=12;
  $mem_0=0;

  return (($mem_0)|0);
 }
 $12=($bytes>>>0)<((11)>>>0);
 if ($12) {
  $17=16;
 } else {
  $14=((($bytes)+(11))|0);
  $15=$14&-8;
  $17=$15;
 }

 $18=((($_1)+(12))|0);
 $19=((($18)+($17))|0);
 $20=((_malloc($19))|0);
 $21=($20|0)==0;
 if ($21) {
  $mem_0=0;

  return (($mem_0)|0);
 }
 $23=((($20)-(8))|0);
 $24=$23;
 $25=$20;
 $26=((($_1)-(1))|0);
 $27=$25&$26;
 $28=($27|0)==0;
 do {
  if ($28) {
   $p_0=$24;
  } else {
   $30=(($20+$26)|0);
   $31=$30;
   $32=(((-$_1))|0);
   $33=$31&$32;
   $34=$33;
   $35=((($34)-(8))|0);
   $36=$35;
   $37=$23;
   $38=((($36)-($37))|0);
   $39=($38>>>0)>((15)>>>0);
   if ($39) {
    $43=$35;
   } else {
    $_sum3=((($_1)-(8))|0);
    $41=(($34+$_sum3)|0);
    $43=$41;
   }

   $44=$43;
   $45=$43;
   $46=((($45)-($37))|0);
   $47=((($20)-(4))|0);
   $48=$47;
   $49=((HEAP32[(($48)>>2)])|0);
   $50=$49&-8;
   $51=((($50)-($46))|0);
   $52=$49&3;
   $53=($52|0)==0;
   if ($53) {
    $55=$23;
    $56=((HEAP32[(($55)>>2)])|0);
    $57=((($56)+($46))|0);
    $58=$43;
    HEAP32[(($58)>>2)]=$57;
    $59=(($43+4)|0);
    $60=$59;
    HEAP32[(($60)>>2)]=$51;
    $p_0=$44;
    break;
   } else {
    $62=(($43+4)|0);
    $63=$62;
    $64=((HEAP32[(($63)>>2)])|0);
    $65=$64&1;
    $66=$51|$65;
    $67=$66|2;
    HEAP32[(($63)>>2)]=$67;
    $_sum4=((($51)+(4))|0);
    $68=(($43+$_sum4)|0);
    $69=$68;
    $70=((HEAP32[(($69)>>2)])|0);
    $71=$70|1;
    HEAP32[(($69)>>2)]=$71;
    $72=((HEAP32[(($48)>>2)])|0);
    $73=$72&1;
    $74=$46|$73;
    $75=$74|2;
    HEAP32[(($48)>>2)]=$75;
    $_sum6=((($46)-(4))|0);
    $76=(($20+$_sum6)|0);
    $77=$76;
    $78=((HEAP32[(($77)>>2)])|0);
    $79=$78|1;
    HEAP32[(($77)>>2)]=$79;
    _dispose_chunk($24,$46);
    $p_0=$44;
    break;
   }
  }
 } while(0);

 $81=(($p_0+4)|0);
 $82=((HEAP32[(($81)>>2)])|0);
 $83=$82&3;
 $84=($83|0)==0;
 if (!($84)) {
  $86=$82&-8;
  $87=((($17)+(16))|0);
  $88=($86>>>0)>($87>>>0);
  if ($88) {
   $90=((($86)-($17))|0);
   $91=$p_0;
   $92=(($91+$17)|0);
   $93=$92;
   $94=$82&1;
   $95=$17|$94;
   $96=$95|2;
   HEAP32[(($81)>>2)]=$96;
   $_sum1=$17|4;
   $97=(($91+$_sum1)|0);
   $98=$97;
   $99=$90|3;
   HEAP32[(($98)>>2)]=$99;
   $_sum2=$86|4;
   $100=(($91+$_sum2)|0);
   $101=$100;
   $102=((HEAP32[(($101)>>2)])|0);
   $103=$102|1;
   HEAP32[(($101)>>2)]=$103;
   _dispose_chunk($93,$90);
  }
 }
 $105=(($p_0+8)|0);
 $106=$105;
 $mem_0=$106;

 return (($mem_0)|0);
}


function _posix_memalign($pp,$alignment,$bytes){
 $pp=($pp)|0;
 $alignment=($alignment)|0;
 $bytes=($bytes)|0;
 var $1=0,$3=0,$5=0,$6=0,$7=0,$8=0,$or_cond=0,$10=0,$11=0,$12=0,$14=0,$15=0,$17=0,$_alignment=0,$18=0,$mem_0=0,$20=0,$_0=0,label=0;

 $1=($alignment|0)==8;
 do {
  if ($1) {
   $3=((_malloc($bytes))|0);
   $mem_0=$3;
  } else {
   $5=$alignment>>>2;
   $6=$alignment&3;
   $7=($6|0)!=0;
   $8=($5|0)==0;
   $or_cond=$7|$8;
   if ($or_cond) {
    $_0=22;

    return (($_0)|0);
   }
   $10=((($5)+(1073741823))|0);
   $11=$10&$5;
   $12=($11|0)==0;
   if (!($12)) {
    $_0=22;

    return (($_0)|0);
   }
   $14=(((-64)-($alignment))|0);
   $15=($14>>>0)<($bytes>>>0);
   if ($15) {
    $_0=12;

    return (($_0)|0);
   } else {
    $17=($alignment>>>0)<((16)>>>0);
    $_alignment=($17?16:$alignment);
    $18=((_internal_memalign($_alignment,$bytes))|0);
    $mem_0=$18;
    break;
   }
  }
 } while(0);

 $20=($mem_0|0)==0;
 if ($20) {
  $_0=12;

  return (($_0)|0);
 }
 HEAP32[(($pp)>>2)]=$mem_0;
 $_0=0;

 return (($_0)|0);
}


function _valloc($bytes){
 $bytes=($bytes)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 if (!($2)) {
  $13=((HEAP32[((2380)>>2)])|0);
  $14=((_memalign($13,$bytes))|0);
  return (($14)|0);
 }
 $4=((_sysconf(((30)|0)))|0);
 $5=((($4)-(1))|0);
 $6=$5&$4;
 $7=($6|0)==0;
 if (!($7)) {
  _abort(); return ((0)|0);
  return ((0)|0);
 }
 HEAP32[((2384)>>2)]=$4;
 HEAP32[((2380)>>2)]=$4;
 HEAP32[((2388)>>2)]=-1;
 HEAP32[((2392)>>2)]=-1;
 HEAP32[((2396)>>2)]=0;
 HEAP32[((2852)>>2)]=0;
 $9=((_time(((0)|0)))|0);
 $10=$9&-16;
 $11=$10^1431655768;
 HEAP32[((2376)>>2)]=$11;
 $13=((HEAP32[((2380)>>2)])|0);
 $14=((_memalign($13,$bytes))|0);
 return (($14)|0);
}


function _pvalloc($bytes){
 $bytes=($bytes)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort(); return ((0)|0);
    return ((0)|0);
   }
  }
 } while(0);
 $13=((HEAP32[((2380)>>2)])|0);
 $14=((($bytes)-(1))|0);
 $15=((($14)+($13))|0);
 $16=(((-$13))|0);
 $17=$15&$16;
 $18=((_memalign($13,$17))|0);
 return (($18)|0);
}


function _independent_calloc($n_elements,$elem_size,$chunks){
 $n_elements=($n_elements)|0;
 $elem_size=($elem_size)|0;
 $chunks=($chunks)|0;
 var $sz=0,$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+8)|0;
 $sz=((sp)|0);
 HEAP32[(($sz)>>2)]=$elem_size;
 $1=((_ialloc($n_elements,$sz,3,$chunks))|0);
 STACKTOP=sp;return (($1)|0);
}


function _ialloc($n_elements,$sizes,$opts,$chunks){
 $n_elements=($n_elements)|0;
 $sizes=($sizes)|0;
 $opts=($opts)|0;
 $chunks=($chunks)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,$18=0,$19=0,$21=0,$22=0,$24=0,$25=0,$array_size_0=0,$marray_0=0,$27=0;
 var $28=0,$30=0,$31=0,$33=0,$34=0,$36=0,$37=0,$i_08=0,$contents_size_07=0,$38=0,$39=0,$40=0,$42=0,$43=0,$45=0,$46=0,$47=0,$48=0,$contents_size_1=0,$element_size_0=0;
 var $49=0,$50=0,$51=0,$52=0,$54=0,$55=0,$56=0,$57=0,$58=0,$59=0,$60=0,$62=0,$63=0,$65=0,$67=0,$68=0,$69=0,$70=0,$_sum2=0,$71=0;
 var $72=0,$remainder_size_0=0,$marray_1=0,$74=0,$75=0,$76=0,$i_15_us=0,$remainder_size_14_us=0,$p_0_in3_us=0,$77=0,$78=0,$79=0,$81=0,$82=0,$size_0_us=0,$84=0,$85=0,$86=0,$87=0,$88=0;
 var $89=0,$_sum11=0,$90=0,$91=0,$92=0,$i_15=0,$remainder_size_14=0,$p_0_in3=0,$94=0,$95=0,$96=0,$97=0,$98=0,$99=0,$_sum=0,$100=0,$101=0,$102=0,$remainder_size_1_lcssa=0,$p_0_in_lcssa=0;
 var $103=0,$104=0,$105=0,$_0=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort(); return ((0)|0);
    return ((0)|0);
   }
  }
 } while(0);
 $13=($chunks|0)==0;
 $14=($n_elements|0)==0;
 do {
  if ($13) {
   if ($14) {
    $18=((_malloc(0))|0);
    $19=$18;
    $_0=$19;

    return (($_0)|0);
   } else {
    $21=$n_elements<<2;
    $22=($21>>>0)<((11)>>>0);
    if ($22) {
     $marray_0=0;$array_size_0=16;
     break;
    }
    $24=((($21)+(11))|0);
    $25=$24&-8;
    $marray_0=0;$array_size_0=$25;
    break;
   }
  } else {
   if ($14) {
    $_0=$chunks;

    return (($_0)|0);
   } else {
    $marray_0=$chunks;$array_size_0=0;
   }
  }
 } while(0);


 $27=$opts&1;
 $28=($27|0)==0;
 if ($28) {
  if ($14) {
   $element_size_0=0;$contents_size_1=0;
  } else {
   $contents_size_07=0;$i_08=0;
   while(1) {


    $38=(($sizes+($i_08<<2))|0);
    $39=((HEAP32[(($38)>>2)])|0);
    $40=($39>>>0)<((11)>>>0);
    if ($40) {
     $45=16;
    } else {
     $42=((($39)+(11))|0);
     $43=$42&-8;
     $45=$43;
    }

    $46=((($45)+($contents_size_07))|0);
    $47=((($i_08)+(1))|0);
    $48=($47|0)==($n_elements|0);
    if ($48) {
     $element_size_0=0;$contents_size_1=$46;
     break;
    } else {
     $contents_size_07=$46;$i_08=$47;
    }
   }
  }
 } else {
  $30=((HEAP32[(($sizes)>>2)])|0);
  $31=($30>>>0)<((11)>>>0);
  if ($31) {
   $36=16;
  } else {
   $33=((($30)+(11))|0);
   $34=$33&-8;
   $36=$34;
  }

  $37=(Math_imul($36,$n_elements)|0);
  $element_size_0=$36;$contents_size_1=$37;
 }


 $49=((($array_size_0)-(4))|0);
 $50=((($49)+($contents_size_1))|0);
 $51=((_malloc($50))|0);
 $52=($51|0)==0;
 if ($52) {
  $_0=0;

  return (($_0)|0);
 }
 $54=((($51)-(8))|0);
 $55=((($51)-(4))|0);
 $56=$55;
 $57=((HEAP32[(($56)>>2)])|0);
 $58=$57&-8;
 $59=$opts&2;
 $60=($59|0)==0;
 if (!($60)) {
  $62=(((-4)-($array_size_0))|0);
  $63=((($62)+($58))|0);
  _memset((((($51)|0))|0), ((((0)|0))|0), (((($63)|0))|0))|0;
 }
 $65=($marray_0|0)==0;
 if ($65) {
  $67=((($58)-($contents_size_1))|0);
  $68=(($51+$contents_size_1)|0);
  $69=$68;
  $70=$67|3;
  $_sum2=((($contents_size_1)-(4))|0);
  $71=(($51+$_sum2)|0);
  $72=$71;
  HEAP32[(($72)>>2)]=$70;
  $marray_1=$69;$remainder_size_0=$contents_size_1;
 } else {
  $marray_1=$marray_0;$remainder_size_0=$58;
 }


 HEAP32[(($marray_1)>>2)]=$51;
 $74=((($n_elements)-(1))|0);
 $75=($74|0)==0;
 L38: do {
  if ($75) {
   $p_0_in_lcssa=$54;$remainder_size_1_lcssa=$remainder_size_0;
  } else {
   $76=($element_size_0|0)==0;
   if ($76) {
    $p_0_in3_us=$54;$remainder_size_14_us=$remainder_size_0;$i_15_us=0;
   } else {
    $p_0_in3=$54;$remainder_size_14=$remainder_size_0;$i_15=0;
    while(1) {



     $94=((($remainder_size_14)-($element_size_0))|0);
     $95=$element_size_0|3;
     $96=(($p_0_in3+4)|0);
     $97=$96;
     HEAP32[(($97)>>2)]=$95;
     $98=(($p_0_in3+$element_size_0)|0);
     $99=((($i_15)+(1))|0);
     $_sum=((($element_size_0)+(8))|0);
     $100=(($p_0_in3+$_sum)|0);
     $101=(($marray_1+($99<<2))|0);
     HEAP32[(($101)>>2)]=$100;
     $102=($99|0)==($74|0);
     if ($102) {
      $p_0_in_lcssa=$98;$remainder_size_1_lcssa=$94;
      break L38;
     } else {
      $p_0_in3=$98;$remainder_size_14=$94;$i_15=$99;
     }
    }
   }
   while(1) {



    $77=(($sizes+($i_15_us<<2))|0);
    $78=((HEAP32[(($77)>>2)])|0);
    $79=($78>>>0)<((11)>>>0);
    if ($79) {
     $size_0_us=16;
    } else {
     $81=((($78)+(11))|0);
     $82=$81&-8;
     $size_0_us=$82;
    }

    $84=((($remainder_size_14_us)-($size_0_us))|0);
    $85=$size_0_us|3;
    $86=(($p_0_in3_us+4)|0);
    $87=$86;
    HEAP32[(($87)>>2)]=$85;
    $88=(($p_0_in3_us+$size_0_us)|0);
    $89=((($i_15_us)+(1))|0);
    $_sum11=((($size_0_us)+(8))|0);
    $90=(($p_0_in3_us+$_sum11)|0);
    $91=(($marray_1+($89<<2))|0);
    HEAP32[(($91)>>2)]=$90;
    $92=($89|0)==($74|0);
    if ($92) {
     $p_0_in_lcssa=$88;$remainder_size_1_lcssa=$84;
     break;
    } else {
     $p_0_in3_us=$88;$remainder_size_14_us=$84;$i_15_us=$89;
    }
   }
  }
 } while(0);


 $103=$remainder_size_1_lcssa|3;
 $104=(($p_0_in_lcssa+4)|0);
 $105=$104;
 HEAP32[(($105)>>2)]=$103;
 $_0=$marray_1;

 return (($_0)|0);
}


function _independent_comalloc($n_elements,$sizes,$chunks){
 $n_elements=($n_elements)|0;
 $sizes=($sizes)|0;
 $chunks=($chunks)|0;
 var $1=0,label=0;

 $1=((_ialloc($n_elements,$sizes,0,$chunks))|0);
 return (($1)|0);
}


function _bulk_free($array,$nelem){
 $array=($array)|0;
 $nelem=($nelem)|0;
 var $1=0,$2=0,$a_07_i=0,$3=0,$4=0,$_pre_i=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$15=0,$16=0,$18=0,$19=0,$_sum_i=0,$20=0;
 var $22=0,$_sum2_i=0,$23=0,$24=0,$_sum34_i=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$_sum6_i=0,$34=0,$35=0,$36=0,$37=0,$_pre_phi_i=0,$40=0;
 var label=0;

 $1=(($array+($nelem<<2))|0);
 $2=($nelem|0)==0;
 if ($2) {
  return ((0)|0);
 } else {
  $a_07_i=$array;
 }
 L3: while(1) {

  $3=((HEAP32[(($a_07_i)>>2)])|0);
  $4=($3|0)==0;
  do {
   if ($4) {
    $_pre_i=(($a_07_i+4)|0);
    $_pre_phi_i=$_pre_i;
   } else {
    $6=((($3)-(8))|0);
    $7=$6;
    $8=((($3)-(4))|0);
    $9=$8;
    $10=((HEAP32[(($9)>>2)])|0);
    $11=$10&-8;
    HEAP32[(($a_07_i)>>2)]=0;
    $12=((HEAP32[((2424)>>2)])|0);
    $13=($6>>>0)<($12>>>0);
    if ($13) {
     label = 10;
     break L3;
    }
    $15=$10&3;
    $16=($15|0)==1;
    if ($16) {
     label = 10;
     break L3;
    }
    $18=(($a_07_i+4)|0);
    $19=((($10)-(8))|0);
    $_sum_i=$19&-8;
    $20=($18|0)==($1|0);
    if (!($20)) {
     $22=((HEAP32[(($18)>>2)])|0);
     $_sum2_i=((($_sum_i)+(8))|0);
     $23=(($3+$_sum2_i)|0);
     $24=($22|0)==($23|0);
     if ($24) {
      $_sum34_i=$_sum_i|4;
      $26=(($3+$_sum34_i)|0);
      $27=$26;
      $28=((HEAP32[(($27)>>2)])|0);
      $29=$28&-8;
      $30=((($29)+($11))|0);
      $31=$10&1;
      $32=$31|$30;
      $33=$32|2;
      HEAP32[(($9)>>2)]=$33;
      $_sum6_i=((($30)-(4))|0);
      $34=(($3+$_sum6_i)|0);
      $35=$34;
      $36=((HEAP32[(($35)>>2)])|0);
      $37=$36|1;
      HEAP32[(($35)>>2)]=$37;
      HEAP32[(($18)>>2)]=$3;
      $_pre_phi_i=$18;
      break;
     }
    }
    _dispose_chunk($7,$11);
    $_pre_phi_i=$18;
   }
  } while(0);

  $40=($_pre_phi_i|0)==($1|0);
  if ($40) {
   label = 12;
   break;
  } else {
   $a_07_i=$_pre_phi_i;
  }
 }
 if ((label|0) == 10) {
  _abort(); return ((0)|0);
  return ((0)|0);
 }
 else if ((label|0) == 12) {
  return ((0)|0);
 }
  return 0;
}


function _malloc_trim($pad){
 $pad=($pad)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$15=0,$16=0,$18=0,$19=0,$20=0,$22=0,$23=0,$24=0,$25=0,$26=0;
 var $27=0,$sp_0_i_i=0,$29=0,$30=0,$31=0,$33=0,$34=0,$35=0,$36=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0,$45=0,$47=0,$48=0,$49=0;
 var $50=0,$51=0,$53=0,$54=0,$__i=0,$55=0,$56=0,$57=0,$58=0,$59=0,$or_cond_i=0,$61=0,$62=0,$63=0,$64=0,$66=0,$67=0,$68=0,$69=0,$70=0;
 var $71=0,$72=0,$73=0,$74=0,$75=0,$76=0,$77=0,$79=0,$80=0,$82=0,$83=0,$84=0,$85=0,$86=0,$_sum_i_i=0,$87=0,$88=0,$_sum2_i_i=0,$89=0,$90=0;
 var $91=0,$92=0,$93=0,$94=0,$released_2_i=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort(); return ((0)|0);
    return ((0)|0);
   }
  }
 } while(0);
 $13=($pad>>>0)<((4294967232)>>>0);
 if (!($13)) {
  $released_2_i=0;

  return (($released_2_i)|0);
 }
 $15=((HEAP32[((2432)>>2)])|0);
 $16=($15|0)==0;
 if ($16) {
  $released_2_i=0;

  return (($released_2_i)|0);
 }
 $18=((($pad)+(40))|0);
 $19=((HEAP32[((2420)>>2)])|0);
 $20=($19>>>0)>($18>>>0);
 if ($20) {
  $22=((HEAP32[((2384)>>2)])|0);
  $23=(((-41)-($pad))|0);
  $24=((($23)+($19))|0);
  $25=((($24)+($22))|0);
  $26=(((($25>>>0))/(($22>>>0)))&-1);
  $27=$15;
  $sp_0_i_i=2856;
  while(1) {

   $29=(($sp_0_i_i)|0);
   $30=((HEAP32[(($29)>>2)])|0);
   $31=($30>>>0)>($27>>>0);
   if (!($31)) {
    $33=(($sp_0_i_i+4)|0);
    $34=((HEAP32[(($33)>>2)])|0);
    $35=(($30+$34)|0);
    $36=($35>>>0)>($27>>>0);
    if ($36) {
     break;
    }
   }
   $38=(($sp_0_i_i+8)|0);
   $39=((HEAP32[(($38)>>2)])|0);
   $sp_0_i_i=$39;
  }
  $40=((($26)-(1))|0);
  $41=(Math_imul($40,$22)|0);
  $42=(($sp_0_i_i+12)|0);
  $43=((HEAP32[(($42)>>2)])|0);
  $44=$43&8;
  $45=($44|0)==0;
  if ($45) {
   $47=((_sbrk(((0)|0)))|0);
   $48=((HEAP32[(($29)>>2)])|0);
   $49=((HEAP32[(($33)>>2)])|0);
   $50=(($48+$49)|0);
   $51=($47|0)==($50|0);
   if ($51) {
    $53=(((-2147483648)-($22))|0);
    $54=($41>>>0)>((2147483646)>>>0);
    $__i=($54?$53:$41);
    $55=(((-$__i))|0);
    $56=((_sbrk((($55)|0)))|0);
    $57=((_sbrk(((0)|0)))|0);
    $58=($56|0)!=-1;
    $59=($57>>>0)<($47>>>0);
    $or_cond_i=$58&$59;
    if ($or_cond_i) {
     $61=$47;
     $62=$57;
     $63=((($61)-($62))|0);
     $64=($47|0)==($57|0);
     if (!($64)) {
      $66=((HEAP32[(($33)>>2)])|0);
      $67=((($66)-($63))|0);
      HEAP32[(($33)>>2)]=$67;
      $68=((HEAP32[((2840)>>2)])|0);
      $69=((($68)-($63))|0);
      HEAP32[((2840)>>2)]=$69;
      $70=((HEAP32[((2432)>>2)])|0);
      $71=((HEAP32[((2420)>>2)])|0);
      $72=((($71)-($63))|0);
      $73=$70;
      $74=(($70+8)|0);
      $75=$74;
      $76=$75&7;
      $77=($76|0)==0;
      if ($77) {
       $82=0;
      } else {
       $79=(((-$75))|0);
       $80=$79&7;
       $82=$80;
      }

      $83=(($73+$82)|0);
      $84=$83;
      $85=((($72)-($82))|0);
      HEAP32[((2432)>>2)]=$84;
      HEAP32[((2420)>>2)]=$85;
      $86=$85|1;
      $_sum_i_i=((($82)+(4))|0);
      $87=(($73+$_sum_i_i)|0);
      $88=$87;
      HEAP32[(($88)>>2)]=$86;
      $_sum2_i_i=((($72)+(4))|0);
      $89=(($73+$_sum2_i_i)|0);
      $90=$89;
      HEAP32[(($90)>>2)]=40;
      $91=((HEAP32[((2392)>>2)])|0);
      HEAP32[((2436)>>2)]=$91;
      $released_2_i=1;

      return (($released_2_i)|0);
     }
    }
   }
  }
 }
 $92=((HEAP32[((2420)>>2)])|0);
 $93=((HEAP32[((2436)>>2)])|0);
 $94=($92>>>0)>($93>>>0);
 if (!($94)) {
  $released_2_i=0;

  return (($released_2_i)|0);
 }
 HEAP32[((2436)>>2)]=-1;
 $released_2_i=0;

 return (($released_2_i)|0);
}


function _malloc_footprint(){
 var $1=0,label=0;

 $1=((HEAP32[((2840)>>2)])|0);
 return (($1)|0);
}


function _malloc_max_footprint(){
 var $1=0,label=0;

 $1=((HEAP32[((2844)>>2)])|0);
 return (($1)|0);
}


function _malloc_footprint_limit(){
 var $1=0,$2=0,$3=0,label=0;

 $1=((HEAP32[((2848)>>2)])|0);
 $2=($1|0)==0;
 $3=($2?-1:$1);
 return (($3)|0);
}


function _malloc_set_footprint_limit($bytes){
 $bytes=($bytes)|0;
 var $1=0,$3=0,$4=0,$5=0,$6=0,$7=0,$result_0=0,label=0;

 $1=($bytes|0)==-1;
 if ($1) {
  $result_0=0;
 } else {
  $3=((HEAP32[((2384)>>2)])|0);
  $4=((($bytes)-(1))|0);
  $5=((($4)+($3))|0);
  $6=(((-$3))|0);
  $7=$5&$6;
  $result_0=$7;
 }

 HEAP32[((2848)>>2)]=$result_0;
 return (($result_0)|0);
}


function _mallinfo($agg_result){
 $agg_result=($agg_result)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,$16=0,$17=0,$s_011_i=0,$sum_010_i=0,$mfree_09_i=0,$nfree_08_i=0,$19=0,$20=0,$21=0;
 var $22=0,$23=0,$24=0,$26=0,$27=0,$28=0,$29=0,$30=0,$31=0,$32=0,$q_0_in5_i=0,$sum_14_i=0,$mfree_13_i=0,$nfree_12_i=0,$q_0_i=0,$34=0,$35=0,$or_cond_i=0,$37=0,$38=0;
 var $39=0,$40=0,$42=0,$43=0,$44=0,$45=0,$47=0,$48=0,$nfree_2_i=0,$mfree_2_i=0,$50=0,$51=0,$sum_1_lcssa_i=0,$mfree_1_lcssa_i=0,$nfree_1_lcssa_i=0,$52=0,$53=0,$54=0,$56=0,$57=0;
 var $58=0,$59=0,$nm_sroa_6_0_i=0,$nm_sroa_4_0_i=0,$nm_sroa_3_0_i=0,$nm_sroa_1_0_i=0,$nm_sroa_0_0_i=0,$nm_sroa_7_0_i=0,$nm_sroa_8_0_i=0,$60=0,$61=0,$62=0,$63=0,$$etemp$0$0=0,$$etemp$0$1=0,$st$1$0=0,$st$2$1=0,$64=0,$65=0,$66=0;
 var $67=0,$68=0,$69=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort();

   }
  }
 } while(0);
 $13=((HEAP32[((2432)>>2)])|0);
 $14=($13|0)==0;
 if ($14) {
  $nm_sroa_8_0_i=0;$nm_sroa_7_0_i=0;$nm_sroa_0_0_i=0;$nm_sroa_1_0_i=0;$nm_sroa_3_0_i=0;$nm_sroa_4_0_i=0;$nm_sroa_6_0_i=0;
 } else {
  $16=((HEAP32[((2420)>>2)])|0);
  $17=((($16)+(40))|0);
  $nfree_08_i=1;$mfree_09_i=$17;$sum_010_i=$17;$s_011_i=2856;
  while(1) {




   $19=(($s_011_i)|0);
   $20=((HEAP32[(($19)>>2)])|0);
   $21=(($20+8)|0);
   $22=$21;
   $23=$22&7;
   $24=($23|0)==0;
   if ($24) {
    $28=0;
   } else {
    $26=(((-$22))|0);
    $27=$26&7;
    $28=$27;
   }

   $29=(($20+$28)|0);
   $30=(($s_011_i+4)|0);
   $31=((HEAP32[(($30)>>2)])|0);
   $32=(($20+$31)|0);
   $nfree_12_i=$nfree_08_i;$mfree_13_i=$mfree_09_i;$sum_14_i=$sum_010_i;$q_0_in5_i=$29;
   while(1) {




    $q_0_i=$q_0_in5_i;
    $34=($q_0_in5_i>>>0)>=($32>>>0);
    $35=($q_0_i|0)==($13|0);
    $or_cond_i=$34|$35;
    if ($or_cond_i) {
     $nfree_1_lcssa_i=$nfree_12_i;$mfree_1_lcssa_i=$mfree_13_i;$sum_1_lcssa_i=$sum_14_i;
     break;
    }
    $37=(($q_0_in5_i+4)|0);
    $38=$37;
    $39=((HEAP32[(($38)>>2)])|0);
    $40=($39|0)==7;
    if ($40) {
     $nfree_1_lcssa_i=$nfree_12_i;$mfree_1_lcssa_i=$mfree_13_i;$sum_1_lcssa_i=$sum_14_i;
     break;
    }
    $42=$39&-8;
    $43=((($42)+($sum_14_i))|0);
    $44=$39&3;
    $45=($44|0)==1;
    if ($45) {
     $47=((($42)+($mfree_13_i))|0);
     $48=((($nfree_12_i)+(1))|0);
     $mfree_2_i=$47;$nfree_2_i=$48;
    } else {
     $mfree_2_i=$mfree_13_i;$nfree_2_i=$nfree_12_i;
    }


    $50=(($q_0_in5_i+$42)|0);
    $51=($50>>>0)<($20>>>0);
    if ($51) {
     $nfree_1_lcssa_i=$nfree_2_i;$mfree_1_lcssa_i=$mfree_2_i;$sum_1_lcssa_i=$43;
     break;
    } else {
     $nfree_12_i=$nfree_2_i;$mfree_13_i=$mfree_2_i;$sum_14_i=$43;$q_0_in5_i=$50;
    }
   }



   $52=(($s_011_i+8)|0);
   $53=((HEAP32[(($52)>>2)])|0);
   $54=($53|0)==0;
   if ($54) {
    break;
   } else {
    $nfree_08_i=$nfree_1_lcssa_i;$mfree_09_i=$mfree_1_lcssa_i;$sum_010_i=$sum_1_lcssa_i;$s_011_i=$53;
   }
  }
  $56=((HEAP32[((2840)>>2)])|0);
  $57=((($56)-($sum_1_lcssa_i))|0);
  $58=((HEAP32[((2844)>>2)])|0);
  $59=((($56)-($mfree_1_lcssa_i))|0);
  $nm_sroa_8_0_i=$16;$nm_sroa_7_0_i=$mfree_1_lcssa_i;$nm_sroa_0_0_i=$sum_1_lcssa_i;$nm_sroa_1_0_i=$nfree_1_lcssa_i;$nm_sroa_3_0_i=$57;$nm_sroa_4_0_i=$58;$nm_sroa_6_0_i=$59;
 }







 $60=(($agg_result)|0);
 HEAP32[(($60)>>2)]=$nm_sroa_0_0_i;
 $61=(($agg_result+4)|0);
 HEAP32[(($61)>>2)]=$nm_sroa_1_0_i;
 $62=(($agg_result+8)|0);
 $63=$62;
 $$etemp$0$0=0;
 $$etemp$0$1=0;
 $st$1$0=(($63)|0);
 HEAP32[(($st$1$0)>>2)]=$$etemp$0$0;
 $st$2$1=(($63+4)|0);
 HEAP32[(($st$2$1)>>2)]=$$etemp$0$1;
 $64=(($agg_result+16)|0);
 HEAP32[(($64)>>2)]=$nm_sroa_3_0_i;
 $65=(($agg_result+20)|0);
 HEAP32[(($65)>>2)]=$nm_sroa_4_0_i;
 $66=(($agg_result+24)|0);
 HEAP32[(($66)>>2)]=0;
 $67=(($agg_result+28)|0);
 HEAP32[(($67)>>2)]=$nm_sroa_6_0_i;
 $68=(($agg_result+32)|0);
 HEAP32[(($68)>>2)]=$nm_sroa_7_0_i;
 $69=(($agg_result+36)|0);
 HEAP32[(($69)>>2)]=$nm_sroa_8_0_i;
 return;
}


function _malloc_stats(){
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$13=0,$14=0,$16=0,$17=0,$18=0,$_neg2_i=0,$19=0,$s_06_i=0,$used_05_i=0,$21=0,$22=0;
 var $23=0,$24=0,$25=0,$26=0,$28=0,$29=0,$30=0,$31=0,$32=0,$33=0,$34=0,$q_0_in4_i=0,$used_13_i=0,$q_0_i=0,$36=0,$37=0,$or_cond_i=0,$39=0,$40=0,$41=0;
 var $42=0,$43=0,$44=0,$45=0,$46=0,$used_2_i=0,$47=0,$48=0,$used_1_lcssa_i=0,$49=0,$50=0,$51=0,$maxfp_0_i=0,$fp_0_i=0,$used_3_i=0,$52=0,$53=0,$54=0,$55=0,label=0;
 var tempVarArgs=0;
 var sp=0;sp=STACKTOP;
 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort();

   }
  }
 } while(0);
 $13=((HEAP32[((2432)>>2)])|0);
 $14=($13|0)==0;
 if ($14) {
  $used_3_i=0;$fp_0_i=0;$maxfp_0_i=0;
 } else {
  $16=((HEAP32[((2844)>>2)])|0);
  $17=((HEAP32[((2840)>>2)])|0);
  $18=((HEAP32[((2420)>>2)])|0);
  $_neg2_i=((($17)-(40))|0);
  $19=((($_neg2_i)-($18))|0);
  $used_05_i=$19;$s_06_i=2856;
  while(1) {


   $21=(($s_06_i)|0);
   $22=((HEAP32[(($21)>>2)])|0);
   $23=(($22+8)|0);
   $24=$23;
   $25=$24&7;
   $26=($25|0)==0;
   if ($26) {
    $30=0;
   } else {
    $28=(((-$24))|0);
    $29=$28&7;
    $30=$29;
   }

   $31=(($22+$30)|0);
   $32=(($s_06_i+4)|0);
   $33=((HEAP32[(($32)>>2)])|0);
   $34=(($22+$33)|0);
   $used_13_i=$used_05_i;$q_0_in4_i=$31;
   while(1) {


    $q_0_i=$q_0_in4_i;
    $36=($q_0_in4_i>>>0)>=($34>>>0);
    $37=($q_0_i|0)==($13|0);
    $or_cond_i=$36|$37;
    if ($or_cond_i) {
     $used_1_lcssa_i=$used_13_i;
     break;
    }
    $39=(($q_0_in4_i+4)|0);
    $40=$39;
    $41=((HEAP32[(($40)>>2)])|0);
    $42=($41|0)==7;
    if ($42) {
     $used_1_lcssa_i=$used_13_i;
     break;
    }
    $43=$41&3;
    $44=($43|0)==1;
    $45=$41&-8;
    $46=($44?$45:0);
    $used_2_i=((($used_13_i)-($46))|0);
    $47=(($q_0_in4_i+$45)|0);
    $48=($47>>>0)<($22>>>0);
    if ($48) {
     $used_1_lcssa_i=$used_2_i;
     break;
    } else {
     $used_13_i=$used_2_i;$q_0_in4_i=$47;
    }
   }

   $49=(($s_06_i+8)|0);
   $50=((HEAP32[(($49)>>2)])|0);
   $51=($50|0)==0;
   if ($51) {
    $used_3_i=$used_1_lcssa_i;$fp_0_i=$17;$maxfp_0_i=$16;
    break;
   } else {
    $used_05_i=$used_1_lcssa_i;$s_06_i=$50;
   }
  }
 }



 $52=((HEAP32[((_stderr)>>2)])|0);
 $53=((_fprintf((($52)|0),((456)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,HEAP32[((tempVarArgs)>>2)]=$maxfp_0_i,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $54=((_fprintf((($52)|0),((848)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,HEAP32[((tempVarArgs)>>2)]=$fp_0_i,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 $55=((_fprintf((($52)|0),((424)|0),(((tempVarArgs=STACKTOP,STACKTOP = (STACKTOP + 8)|0,HEAP32[((tempVarArgs)>>2)]=$used_3_i,tempVarArgs))|0)))|0); STACKTOP=tempVarArgs;
 STACKTOP=sp;return;
}


function _mallopt($param_number,$value){
 $param_number=($param_number)|0;
 $value=($value)|0;
 var $1=0,$2=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$15=0,$16=0,$18=0,$19=0,$20=0,$_0_i=0,label=0;

 $1=((HEAP32[((2376)>>2)])|0);
 $2=($1|0)==0;
 do {
  if ($2) {
   $4=((_sysconf(((30)|0)))|0);
   $5=((($4)-(1))|0);
   $6=$5&$4;
   $7=($6|0)==0;
   if ($7) {
    HEAP32[((2384)>>2)]=$4;
    HEAP32[((2380)>>2)]=$4;
    HEAP32[((2388)>>2)]=-1;
    HEAP32[((2392)>>2)]=-1;
    HEAP32[((2396)>>2)]=0;
    HEAP32[((2852)>>2)]=0;
    $9=((_time(((0)|0)))|0);
    $10=$9&-16;
    $11=$10^1431655768;
    HEAP32[((2376)>>2)]=$11;
    break;
   } else {
    _abort(); return ((0)|0);
    return ((0)|0);
   }
  }
 } while(0);
 if (((($param_number|0))|0)==((-1)|0)) {
  HEAP32[((2392)>>2)]=$value;
  $_0_i=1;

  return (($_0_i)|0);
 } else if (((($param_number|0))|0)==((-2)|0)) {
  $15=((HEAP32[((2380)>>2)])|0);
  $16=($15>>>0)>($value>>>0);
  if ($16) {
   $_0_i=0;

   return (($_0_i)|0);
  }
  $18=((($value)-(1))|0);
  $19=$18&$value;
  $20=($19|0)==0;
  if (!($20)) {
   $_0_i=0;

   return (($_0_i)|0);
  }
  HEAP32[((2384)>>2)]=$value;
  $_0_i=1;

  return (($_0_i)|0);
 } else if (((($param_number|0))|0)==((-3)|0)) {
  HEAP32[((2388)>>2)]=$value;
  $_0_i=1;

  return (($_0_i)|0);
 } else {
  $_0_i=0;

  return (($_0_i)|0);
 }
  return 0;
}


function _malloc_usable_size($mem){
 $mem=($mem)|0;
 var $1=0,$3=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$12=0,$_0=0,label=0;

 $1=($mem|0)==0;
 if ($1) {
  $_0=0;
 } else {
  $3=((($mem)-(4))|0);
  $4=$3;
  $5=((HEAP32[(($4)>>2)])|0);
  $6=$5&3;
  $7=($6|0)==1;
  if ($7) {
   $_0=0;
  } else {
   $9=$5&-8;
   $10=($6|0)==0;
   $11=($10?8:4);
   $12=((($9)-($11))|0);
   $_0=$12;
  }
 }

 return (($_0)|0);
}


function _dispose_chunk($p,$psize){
 $p=($p)|0;
 $psize=($psize)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$21=0,$22=0,$24=0;
 var $25=0,$_sum35=0,$27=0,$28=0,$29=0,$_sum36=0,$30=0,$31=0,$32=0,$33=0,$34=0,$35=0,$36=0,$38=0,$39=0,$41=0,$42=0,$43=0,$44=0,$46=0;
 var $47=0,$48=0,$49=0,$51=0,$_pre71=0,$53=0,$54=0,$56=0,$57=0,$58=0,$_pre_phi72=0,$59=0,$61=0,$_sum26=0,$62=0,$63=0,$64=0,$_sum27=0,$65=0,$66=0;
 var $67=0,$68=0,$_sum33=0,$70=0,$71=0,$72=0,$73=0,$74=0,$76=0,$77=0,$78=0,$80=0,$81=0,$82=0,$_sum28=0,$_sum29=0,$85=0,$86=0,$87=0,$88=0;
 var $90=0,$91=0,$92=0,$93=0,$RP_0=0,$R_0=0,$94=0,$95=0,$96=0,$98=0,$99=0,$100=0,$102=0,$103=0,$R_1=0,$107=0,$_sum30=0,$109=0,$110=0,$111=0;
 var $112=0,$113=0,$114=0,$cond=0,$116=0,$117=0,$118=0,$119=0,$121=0,$122=0,$123=0,$125=0,$126=0,$127=0,$130=0,$133=0,$135=0,$136=0,$137=0,$139=0;
 var $_sum31=0,$140=0,$141=0,$142=0,$143=0,$145=0,$146=0,$147=0,$149=0,$150=0,$_sum32=0,$153=0,$154=0,$155=0,$156=0,$158=0,$159=0,$160=0,$162=0,$163=0;
 var $_sum=0,$167=0,$168=0,$169=0,$170=0,$171=0,$173=0,$174=0,$175=0,$_sum24=0,$176=0,$177=0,$178=0,$_02=0,$_0=0,$180=0,$181=0,$_sum1=0,$183=0,$184=0;
 var $185=0,$186=0,$187=0,$189=0,$190=0,$192=0,$193=0,$194=0,$195=0,$196=0,$197=0,$200=0,$201=0,$203=0,$204=0,$205=0,$206=0,$207=0,$208=0,$209=0;
 var $211=0,$212=0,$213=0,$214=0,$_sum20=0,$216=0,$217=0,$218=0,$_sum21=0,$219=0,$220=0,$221=0,$222=0,$223=0,$224=0,$225=0,$227=0,$228=0,$230=0,$231=0;
 var $232=0,$233=0,$235=0,$236=0,$237=0,$238=0,$240=0,$_pre69=0,$242=0,$243=0,$245=0,$246=0,$247=0,$_pre_phi70=0,$248=0,$250=0,$_sum2=0,$251=0,$252=0,$253=0;
 var $_sum3=0,$254=0,$255=0,$256=0,$257=0,$_sum18=0,$259=0,$260=0,$261=0,$262=0,$263=0,$265=0,$266=0,$267=0,$269=0,$270=0,$271=0,$_sum5=0,$274=0,$275=0;
 var $276=0,$277=0,$_sum4=0,$279=0,$280=0,$281=0,$282=0,$RP9_0=0,$R7_0=0,$283=0,$284=0,$285=0,$287=0,$288=0,$289=0,$291=0,$292=0,$R7_1=0,$296=0,$_sum15=0;
 var $298=0,$299=0,$300=0,$301=0,$302=0,$303=0,$cond53=0,$305=0,$306=0,$307=0,$308=0,$310=0,$311=0,$312=0,$314=0,$315=0,$316=0,$319=0,$322=0,$324=0;
 var $325=0,$326=0,$328=0,$_sum16=0,$329=0,$330=0,$331=0,$332=0,$334=0,$335=0,$336=0,$338=0,$339=0,$_sum17=0,$342=0,$343=0,$344=0,$345=0,$347=0,$348=0;
 var $349=0,$351=0,$352=0,$355=0,$356=0,$357=0,$358=0,$359=0,$360=0,$361=0,$364=0,$365=0,$366=0,$367=0,$368=0,$369=0,$_1=0,$371=0,$372=0,$374=0;
 var $375=0,$376=0,$377=0,$378=0,$379=0,$380=0,$382=0,$_sum13_pre=0,$_pre=0,$_sum14=0,$384=0,$385=0,$386=0,$387=0,$388=0,$_pre_phi=0,$F16_0=0,$391=0,$392=0,$393=0;
 var $395=0,$396=0,$397=0,$399=0,$401=0,$402=0,$403=0,$404=0,$405=0,$406=0,$407=0,$408=0,$409=0,$410=0,$411=0,$412=0,$413=0,$414=0,$415=0,$416=0;
 var $417=0,$418=0,$419=0,$420=0,$421=0,$422=0,$I19_0=0,$424=0,$425=0,$I19_0_c=0,$426=0,$427=0,$428=0,$429=0,$430=0,$431=0,$433=0,$434=0,$_c=0,$435=0;
 var $436=0,$438=0,$439=0,$441=0,$442=0,$444=0,$445=0,$446=0,$447=0,$448=0,$449=0,$451=0,$452=0,$453=0,$454=0,$455=0,$K20_056=0,$T_055=0,$457=0,$458=0;
 var $459=0,$460=0,$462=0,$463=0,$464=0,$466=0,$T_0_c10=0,$467=0,$468=0,$T_0_lcssa=0,$470=0,$471=0,$472=0,$473=0,$474=0,$476=0,$477=0,$479=0,$480=0,$_c9=0;
 var $481=0,$T_0_c=0,$482=0,label=0;

 $1=$p;
 $2=(($1+$psize)|0);
 $3=$2;
 $4=(($p+4)|0);
 $5=((HEAP32[(($4)>>2)])|0);
 $6=$5&1;
 $7=($6|0)==0;
 do {
  if ($7) {
   $9=(($p)|0);
   $10=((HEAP32[(($9)>>2)])|0);
   $11=$5&3;
   $12=($11|0)==0;
   if ($12) {
    return;
   }
   $14=(((-$10))|0);
   $15=(($1+$14)|0);
   $16=$15;
   $17=((($10)+($psize))|0);
   $18=((HEAP32[((2424)>>2)])|0);
   $19=($15>>>0)<($18>>>0);
   if ($19) {
    _abort();

   }
   $21=((HEAP32[((2428)>>2)])|0);
   $22=($16|0)==($21|0);
   if ($22) {
    $_sum=((($psize)+(4))|0);
    $167=(($1+$_sum)|0);
    $168=$167;
    $169=((HEAP32[(($168)>>2)])|0);
    $170=$169&3;
    $171=($170|0)==3;
    if (!($171)) {
     $_0=$16;$_02=$17;
     break;
    }
    HEAP32[((2416)>>2)]=$17;
    $173=((HEAP32[(($168)>>2)])|0);
    $174=$173&-2;
    HEAP32[(($168)>>2)]=$174;
    $175=$17|1;
    $_sum24=(((4)-($10))|0);
    $176=(($1+$_sum24)|0);
    $177=$176;
    HEAP32[(($177)>>2)]=$175;
    $178=$2;
    HEAP32[(($178)>>2)]=$17;
    return;
   }
   $24=$10>>>3;
   $25=($10>>>0)<((256)>>>0);
   if ($25) {
    $_sum35=(((8)-($10))|0);
    $27=(($1+$_sum35)|0);
    $28=$27;
    $29=((HEAP32[(($28)>>2)])|0);
    $_sum36=(((12)-($10))|0);
    $30=(($1+$_sum36)|0);
    $31=$30;
    $32=((HEAP32[(($31)>>2)])|0);
    $33=$24<<1;
    $34=((2448+($33<<2))|0);
    $35=$34;
    $36=($29|0)==($35|0);
    if (!($36)) {
     $38=$29;
     $39=($38>>>0)<($18>>>0);
     if ($39) {
      _abort();

     }
     $41=(($29+12)|0);
     $42=((HEAP32[(($41)>>2)])|0);
     $43=($42|0)==($16|0);
     if (!($43)) {
      _abort();

     }
    }
    $44=($32|0)==($29|0);
    if ($44) {
     $46=1<<$24;
     $47=$46^-1;
     $48=((HEAP32[((2408)>>2)])|0);
     $49=$48&$47;
     HEAP32[((2408)>>2)]=$49;
     $_0=$16;$_02=$17;
     break;
    }
    $51=($32|0)==($35|0);
    if ($51) {
     $_pre71=(($32+8)|0);
     $_pre_phi72=$_pre71;
    } else {
     $53=$32;
     $54=($53>>>0)<($18>>>0);
     if ($54) {
      _abort();

     }
     $56=(($32+8)|0);
     $57=((HEAP32[(($56)>>2)])|0);
     $58=($57|0)==($16|0);
     if ($58) {
      $_pre_phi72=$56;
     } else {
      _abort();

     }
    }

    $59=(($29+12)|0);
    HEAP32[(($59)>>2)]=$32;
    HEAP32[(($_pre_phi72)>>2)]=$29;
    $_0=$16;$_02=$17;
    break;
   }
   $61=$15;
   $_sum26=(((24)-($10))|0);
   $62=(($1+$_sum26)|0);
   $63=$62;
   $64=((HEAP32[(($63)>>2)])|0);
   $_sum27=(((12)-($10))|0);
   $65=(($1+$_sum27)|0);
   $66=$65;
   $67=((HEAP32[(($66)>>2)])|0);
   $68=($67|0)==($61|0);
   do {
    if ($68) {
     $_sum28=(((16)-($10))|0);
     $_sum29=((($_sum28)+(4))|0);
     $85=(($1+$_sum29)|0);
     $86=$85;
     $87=((HEAP32[(($86)>>2)])|0);
     $88=($87|0)==0;
     if ($88) {
      $90=(($1+$_sum28)|0);
      $91=$90;
      $92=((HEAP32[(($91)>>2)])|0);
      $93=($92|0)==0;
      if ($93) {
       $R_1=0;
       break;
      } else {
       $R_0=$92;$RP_0=$91;
      }
     } else {
      $R_0=$87;$RP_0=$86;
     }
     while(1) {


      $94=(($R_0+20)|0);
      $95=((HEAP32[(($94)>>2)])|0);
      $96=($95|0)==0;
      if (!($96)) {
       $R_0=$95;$RP_0=$94;
       continue;
      }
      $98=(($R_0+16)|0);
      $99=((HEAP32[(($98)>>2)])|0);
      $100=($99|0)==0;
      if ($100) {
       break;
      } else {
       $R_0=$99;$RP_0=$98;
      }
     }
     $102=$RP_0;
     $103=($102>>>0)<($18>>>0);
     if ($103) {
      _abort();

     } else {
      HEAP32[(($RP_0)>>2)]=0;
      $R_1=$R_0;
      break;
     }
    } else {
     $_sum33=(((8)-($10))|0);
     $70=(($1+$_sum33)|0);
     $71=$70;
     $72=((HEAP32[(($71)>>2)])|0);
     $73=$72;
     $74=($73>>>0)<($18>>>0);
     if ($74) {
      _abort();

     }
     $76=(($72+12)|0);
     $77=((HEAP32[(($76)>>2)])|0);
     $78=($77|0)==($61|0);
     if (!($78)) {
      _abort();

     }
     $80=(($67+8)|0);
     $81=((HEAP32[(($80)>>2)])|0);
     $82=($81|0)==($61|0);
     if ($82) {
      HEAP32[(($76)>>2)]=$67;
      HEAP32[(($80)>>2)]=$72;
      $R_1=$67;
      break;
     } else {
      _abort();

     }
    }
   } while(0);

   $107=($64|0)==0;
   if ($107) {
    $_0=$16;$_02=$17;
   } else {
    $_sum30=(((28)-($10))|0);
    $109=(($1+$_sum30)|0);
    $110=$109;
    $111=((HEAP32[(($110)>>2)])|0);
    $112=((2712+($111<<2))|0);
    $113=((HEAP32[(($112)>>2)])|0);
    $114=($61|0)==($113|0);
    if ($114) {
     HEAP32[(($112)>>2)]=$R_1;
     $cond=($R_1|0)==0;
     if ($cond) {
      $116=1<<$111;
      $117=$116^-1;
      $118=((HEAP32[((2412)>>2)])|0);
      $119=$118&$117;
      HEAP32[((2412)>>2)]=$119;
      $_0=$16;$_02=$17;
      break;
     }
    } else {
     $121=$64;
     $122=((HEAP32[((2424)>>2)])|0);
     $123=($121>>>0)<($122>>>0);
     if ($123) {
      _abort();

     }
     $125=(($64+16)|0);
     $126=((HEAP32[(($125)>>2)])|0);
     $127=($126|0)==($61|0);
     if ($127) {
      HEAP32[(($125)>>2)]=$R_1;
     } else {
      $130=(($64+20)|0);
      HEAP32[(($130)>>2)]=$R_1;
     }
     $133=($R_1|0)==0;
     if ($133) {
      $_0=$16;$_02=$17;
      break;
     }
    }
    $135=$R_1;
    $136=((HEAP32[((2424)>>2)])|0);
    $137=($135>>>0)<($136>>>0);
    if ($137) {
     _abort();

    }
    $139=(($R_1+24)|0);
    HEAP32[(($139)>>2)]=$64;
    $_sum31=(((16)-($10))|0);
    $140=(($1+$_sum31)|0);
    $141=$140;
    $142=((HEAP32[(($141)>>2)])|0);
    $143=($142|0)==0;
    do {
     if (!($143)) {
      $145=$142;
      $146=((HEAP32[((2424)>>2)])|0);
      $147=($145>>>0)<($146>>>0);
      if ($147) {
       _abort();

      } else {
       $149=(($R_1+16)|0);
       HEAP32[(($149)>>2)]=$142;
       $150=(($142+24)|0);
       HEAP32[(($150)>>2)]=$R_1;
       break;
      }
     }
    } while(0);
    $_sum32=((($_sum31)+(4))|0);
    $153=(($1+$_sum32)|0);
    $154=$153;
    $155=((HEAP32[(($154)>>2)])|0);
    $156=($155|0)==0;
    if ($156) {
     $_0=$16;$_02=$17;
    } else {
     $158=$155;
     $159=((HEAP32[((2424)>>2)])|0);
     $160=($158>>>0)<($159>>>0);
     if ($160) {
      _abort();

     } else {
      $162=(($R_1+20)|0);
      HEAP32[(($162)>>2)]=$155;
      $163=(($155+24)|0);
      HEAP32[(($163)>>2)]=$R_1;
      $_0=$16;$_02=$17;
      break;
     }
    }
   }
  } else {
   $_0=$p;$_02=$psize;
  }
 } while(0);


 $180=((HEAP32[((2424)>>2)])|0);
 $181=($2>>>0)<($180>>>0);
 if ($181) {
  _abort();

 }
 $_sum1=((($psize)+(4))|0);
 $183=(($1+$_sum1)|0);
 $184=$183;
 $185=((HEAP32[(($184)>>2)])|0);
 $186=$185&2;
 $187=($186|0)==0;
 if ($187) {
  $189=((HEAP32[((2432)>>2)])|0);
  $190=($3|0)==($189|0);
  if ($190) {
   $192=((HEAP32[((2420)>>2)])|0);
   $193=((($192)+($_02))|0);
   HEAP32[((2420)>>2)]=$193;
   HEAP32[((2432)>>2)]=$_0;
   $194=$193|1;
   $195=(($_0+4)|0);
   HEAP32[(($195)>>2)]=$194;
   $196=((HEAP32[((2428)>>2)])|0);
   $197=($_0|0)==($196|0);
   if (!($197)) {
    return;
   }
   HEAP32[((2428)>>2)]=0;
   HEAP32[((2416)>>2)]=0;
   return;
  }
  $200=((HEAP32[((2428)>>2)])|0);
  $201=($3|0)==($200|0);
  if ($201) {
   $203=((HEAP32[((2416)>>2)])|0);
   $204=((($203)+($_02))|0);
   HEAP32[((2416)>>2)]=$204;
   HEAP32[((2428)>>2)]=$_0;
   $205=$204|1;
   $206=(($_0+4)|0);
   HEAP32[(($206)>>2)]=$205;
   $207=$_0;
   $208=(($207+$204)|0);
   $209=$208;
   HEAP32[(($209)>>2)]=$204;
   return;
  }
  $211=$185&-8;
  $212=((($211)+($_02))|0);
  $213=$185>>>3;
  $214=($185>>>0)<((256)>>>0);
  do {
   if ($214) {
    $_sum20=((($psize)+(8))|0);
    $216=(($1+$_sum20)|0);
    $217=$216;
    $218=((HEAP32[(($217)>>2)])|0);
    $_sum21=((($psize)+(12))|0);
    $219=(($1+$_sum21)|0);
    $220=$219;
    $221=((HEAP32[(($220)>>2)])|0);
    $222=$213<<1;
    $223=((2448+($222<<2))|0);
    $224=$223;
    $225=($218|0)==($224|0);
    if (!($225)) {
     $227=$218;
     $228=($227>>>0)<($180>>>0);
     if ($228) {
      _abort();

     }
     $230=(($218+12)|0);
     $231=((HEAP32[(($230)>>2)])|0);
     $232=($231|0)==($3|0);
     if (!($232)) {
      _abort();

     }
    }
    $233=($221|0)==($218|0);
    if ($233) {
     $235=1<<$213;
     $236=$235^-1;
     $237=((HEAP32[((2408)>>2)])|0);
     $238=$237&$236;
     HEAP32[((2408)>>2)]=$238;
     break;
    }
    $240=($221|0)==($224|0);
    if ($240) {
     $_pre69=(($221+8)|0);
     $_pre_phi70=$_pre69;
    } else {
     $242=$221;
     $243=($242>>>0)<($180>>>0);
     if ($243) {
      _abort();

     }
     $245=(($221+8)|0);
     $246=((HEAP32[(($245)>>2)])|0);
     $247=($246|0)==($3|0);
     if ($247) {
      $_pre_phi70=$245;
     } else {
      _abort();

     }
    }

    $248=(($218+12)|0);
    HEAP32[(($248)>>2)]=$221;
    HEAP32[(($_pre_phi70)>>2)]=$218;
   } else {
    $250=$2;
    $_sum2=((($psize)+(24))|0);
    $251=(($1+$_sum2)|0);
    $252=$251;
    $253=((HEAP32[(($252)>>2)])|0);
    $_sum3=((($psize)+(12))|0);
    $254=(($1+$_sum3)|0);
    $255=$254;
    $256=((HEAP32[(($255)>>2)])|0);
    $257=($256|0)==($250|0);
    do {
     if ($257) {
      $_sum5=((($psize)+(20))|0);
      $274=(($1+$_sum5)|0);
      $275=$274;
      $276=((HEAP32[(($275)>>2)])|0);
      $277=($276|0)==0;
      if ($277) {
       $_sum4=((($psize)+(16))|0);
       $279=(($1+$_sum4)|0);
       $280=$279;
       $281=((HEAP32[(($280)>>2)])|0);
       $282=($281|0)==0;
       if ($282) {
        $R7_1=0;
        break;
       } else {
        $R7_0=$281;$RP9_0=$280;
       }
      } else {
       $R7_0=$276;$RP9_0=$275;
      }
      while(1) {


       $283=(($R7_0+20)|0);
       $284=((HEAP32[(($283)>>2)])|0);
       $285=($284|0)==0;
       if (!($285)) {
        $R7_0=$284;$RP9_0=$283;
        continue;
       }
       $287=(($R7_0+16)|0);
       $288=((HEAP32[(($287)>>2)])|0);
       $289=($288|0)==0;
       if ($289) {
        break;
       } else {
        $R7_0=$288;$RP9_0=$287;
       }
      }
      $291=$RP9_0;
      $292=($291>>>0)<($180>>>0);
      if ($292) {
       _abort();

      } else {
       HEAP32[(($RP9_0)>>2)]=0;
       $R7_1=$R7_0;
       break;
      }
     } else {
      $_sum18=((($psize)+(8))|0);
      $259=(($1+$_sum18)|0);
      $260=$259;
      $261=((HEAP32[(($260)>>2)])|0);
      $262=$261;
      $263=($262>>>0)<($180>>>0);
      if ($263) {
       _abort();

      }
      $265=(($261+12)|0);
      $266=((HEAP32[(($265)>>2)])|0);
      $267=($266|0)==($250|0);
      if (!($267)) {
       _abort();

      }
      $269=(($256+8)|0);
      $270=((HEAP32[(($269)>>2)])|0);
      $271=($270|0)==($250|0);
      if ($271) {
       HEAP32[(($265)>>2)]=$256;
       HEAP32[(($269)>>2)]=$261;
       $R7_1=$256;
       break;
      } else {
       _abort();

      }
     }
    } while(0);

    $296=($253|0)==0;
    if (!($296)) {
     $_sum15=((($psize)+(28))|0);
     $298=(($1+$_sum15)|0);
     $299=$298;
     $300=((HEAP32[(($299)>>2)])|0);
     $301=((2712+($300<<2))|0);
     $302=((HEAP32[(($301)>>2)])|0);
     $303=($250|0)==($302|0);
     if ($303) {
      HEAP32[(($301)>>2)]=$R7_1;
      $cond53=($R7_1|0)==0;
      if ($cond53) {
       $305=1<<$300;
       $306=$305^-1;
       $307=((HEAP32[((2412)>>2)])|0);
       $308=$307&$306;
       HEAP32[((2412)>>2)]=$308;
       break;
      }
     } else {
      $310=$253;
      $311=((HEAP32[((2424)>>2)])|0);
      $312=($310>>>0)<($311>>>0);
      if ($312) {
       _abort();

      }
      $314=(($253+16)|0);
      $315=((HEAP32[(($314)>>2)])|0);
      $316=($315|0)==($250|0);
      if ($316) {
       HEAP32[(($314)>>2)]=$R7_1;
      } else {
       $319=(($253+20)|0);
       HEAP32[(($319)>>2)]=$R7_1;
      }
      $322=($R7_1|0)==0;
      if ($322) {
       break;
      }
     }
     $324=$R7_1;
     $325=((HEAP32[((2424)>>2)])|0);
     $326=($324>>>0)<($325>>>0);
     if ($326) {
      _abort();

     }
     $328=(($R7_1+24)|0);
     HEAP32[(($328)>>2)]=$253;
     $_sum16=((($psize)+(16))|0);
     $329=(($1+$_sum16)|0);
     $330=$329;
     $331=((HEAP32[(($330)>>2)])|0);
     $332=($331|0)==0;
     do {
      if (!($332)) {
       $334=$331;
       $335=((HEAP32[((2424)>>2)])|0);
       $336=($334>>>0)<($335>>>0);
       if ($336) {
        _abort();

       } else {
        $338=(($R7_1+16)|0);
        HEAP32[(($338)>>2)]=$331;
        $339=(($331+24)|0);
        HEAP32[(($339)>>2)]=$R7_1;
        break;
       }
      }
     } while(0);
     $_sum17=((($psize)+(20))|0);
     $342=(($1+$_sum17)|0);
     $343=$342;
     $344=((HEAP32[(($343)>>2)])|0);
     $345=($344|0)==0;
     if (!($345)) {
      $347=$344;
      $348=((HEAP32[((2424)>>2)])|0);
      $349=($347>>>0)<($348>>>0);
      if ($349) {
       _abort();

      } else {
       $351=(($R7_1+20)|0);
       HEAP32[(($351)>>2)]=$344;
       $352=(($344+24)|0);
       HEAP32[(($352)>>2)]=$R7_1;
       break;
      }
     }
    }
   }
  } while(0);
  $355=$212|1;
  $356=(($_0+4)|0);
  HEAP32[(($356)>>2)]=$355;
  $357=$_0;
  $358=(($357+$212)|0);
  $359=$358;
  HEAP32[(($359)>>2)]=$212;
  $360=((HEAP32[((2428)>>2)])|0);
  $361=($_0|0)==($360|0);
  if ($361) {
   HEAP32[((2416)>>2)]=$212;
   return;
  } else {
   $_1=$212;
  }
 } else {
  $364=$185&-2;
  HEAP32[(($184)>>2)]=$364;
  $365=$_02|1;
  $366=(($_0+4)|0);
  HEAP32[(($366)>>2)]=$365;
  $367=$_0;
  $368=(($367+$_02)|0);
  $369=$368;
  HEAP32[(($369)>>2)]=$_02;
  $_1=$_02;
 }

 $371=$_1>>>3;
 $372=($_1>>>0)<((256)>>>0);
 if ($372) {
  $374=$371<<1;
  $375=((2448+($374<<2))|0);
  $376=$375;
  $377=((HEAP32[((2408)>>2)])|0);
  $378=1<<$371;
  $379=$377&$378;
  $380=($379|0)==0;
  if ($380) {
   $382=$377|$378;
   HEAP32[((2408)>>2)]=$382;
   $_sum13_pre=((($374)+(2))|0);
   $_pre=((2448+($_sum13_pre<<2))|0);
   $F16_0=$376;$_pre_phi=$_pre;
  } else {
   $_sum14=((($374)+(2))|0);
   $384=((2448+($_sum14<<2))|0);
   $385=((HEAP32[(($384)>>2)])|0);
   $386=$385;
   $387=((HEAP32[((2424)>>2)])|0);
   $388=($386>>>0)<($387>>>0);
   if ($388) {
    _abort();

   } else {
    $F16_0=$385;$_pre_phi=$384;
   }
  }


  HEAP32[(($_pre_phi)>>2)]=$_0;
  $391=(($F16_0+12)|0);
  HEAP32[(($391)>>2)]=$_0;
  $392=(($_0+8)|0);
  HEAP32[(($392)>>2)]=$F16_0;
  $393=(($_0+12)|0);
  HEAP32[(($393)>>2)]=$376;
  return;
 }
 $395=$_0;
 $396=$_1>>>8;
 $397=($396|0)==0;
 if ($397) {
  $I19_0=0;
 } else {
  $399=($_1>>>0)>((16777215)>>>0);
  if ($399) {
   $I19_0=31;
  } else {
   $401=((($396)+(1048320))|0);
   $402=$401>>>16;
   $403=$402&8;
   $404=$396<<$403;
   $405=((($404)+(520192))|0);
   $406=$405>>>16;
   $407=$406&4;
   $408=$407|$403;
   $409=$404<<$407;
   $410=((($409)+(245760))|0);
   $411=$410>>>16;
   $412=$411&2;
   $413=$408|$412;
   $414=(((14)-($413))|0);
   $415=$409<<$412;
   $416=$415>>>15;
   $417=((($414)+($416))|0);
   $418=$417<<1;
   $419=((($417)+(7))|0);
   $420=$_1>>>($419>>>0);
   $421=$420&1;
   $422=$421|$418;
   $I19_0=$422;
  }
 }

 $424=((2712+($I19_0<<2))|0);
 $425=(($_0+28)|0);
 $I19_0_c=$I19_0;
 HEAP32[(($425)>>2)]=$I19_0_c;
 $426=(($_0+20)|0);
 HEAP32[(($426)>>2)]=0;
 $427=(($_0+16)|0);
 HEAP32[(($427)>>2)]=0;
 $428=((HEAP32[((2412)>>2)])|0);
 $429=1<<$I19_0;
 $430=$428&$429;
 $431=($430|0)==0;
 if ($431) {
  $433=$428|$429;
  HEAP32[((2412)>>2)]=$433;
  HEAP32[(($424)>>2)]=$395;
  $434=(($_0+24)|0);
  $_c=$424;
  HEAP32[(($434)>>2)]=$_c;
  $435=(($_0+12)|0);
  HEAP32[(($435)>>2)]=$_0;
  $436=(($_0+8)|0);
  HEAP32[(($436)>>2)]=$_0;
  return;
 }
 $438=((HEAP32[(($424)>>2)])|0);
 $439=($I19_0|0)==31;
 if ($439) {
  $444=0;
 } else {
  $441=$I19_0>>>1;
  $442=(((25)-($441))|0);
  $444=$442;
 }

 $445=(($438+4)|0);
 $446=((HEAP32[(($445)>>2)])|0);
 $447=$446&-8;
 $448=($447|0)==($_1|0);
 L194: do {
  if ($448) {
   $T_0_lcssa=$438;
  } else {
   $449=$_1<<$444;
   $T_055=$438;$K20_056=$449;
   while(1) {


    $457=$K20_056>>>31;
    $458=(($T_055+16+($457<<2))|0);
    $459=((HEAP32[(($458)>>2)])|0);
    $460=($459|0)==0;
    if ($460) {
     break;
    }
    $451=$K20_056<<1;
    $452=(($459+4)|0);
    $453=((HEAP32[(($452)>>2)])|0);
    $454=$453&-8;
    $455=($454|0)==($_1|0);
    if ($455) {
     $T_0_lcssa=$459;
     break L194;
    } else {
     $T_055=$459;$K20_056=$451;
    }
   }
   $462=$458;
   $463=((HEAP32[((2424)>>2)])|0);
   $464=($462>>>0)<($463>>>0);
   if ($464) {
    _abort();

   }
   HEAP32[(($458)>>2)]=$395;
   $466=(($_0+24)|0);
   $T_0_c10=$T_055;
   HEAP32[(($466)>>2)]=$T_0_c10;
   $467=(($_0+12)|0);
   HEAP32[(($467)>>2)]=$_0;
   $468=(($_0+8)|0);
   HEAP32[(($468)>>2)]=$_0;
   return;
  }
 } while(0);

 $470=(($T_0_lcssa+8)|0);
 $471=((HEAP32[(($470)>>2)])|0);
 $472=$T_0_lcssa;
 $473=((HEAP32[((2424)>>2)])|0);
 $474=($472>>>0)<($473>>>0);
 if ($474) {
  _abort();

 }
 $476=$471;
 $477=($476>>>0)<($473>>>0);
 if ($477) {
  _abort();

 }
 $479=(($471+12)|0);
 HEAP32[(($479)>>2)]=$395;
 HEAP32[(($470)>>2)]=$395;
 $480=(($_0+8)|0);
 $_c9=$471;
 HEAP32[(($480)>>2)]=$_c9;
 $481=(($_0+12)|0);
 $T_0_c=$T_0_lcssa;
 HEAP32[(($481)>>2)]=$T_0_c;
 $482=(($_0+24)|0);
 HEAP32[(($482)>>2)]=0;
 return;
}


function __Znwj($size){
 $size=($size)|0;
 var $1=0,$_size=0,$3=0,$4=0,$6=0,$7=0,$9=0,$lpad_phi$0=0,$lpad_phi$1=0,$11=0,$12=0,$14=0,$16=0,$17=0,$lpad_loopexit$0=0,$lpad_loopexit$1=0,$lpad_nonloopexit$0=0,$lpad_nonloopexit$1=0,label=0;

 $1=($size|0)==0;
 $_size=($1?1:$size);
 while(1) {
  $3=((_malloc($_size))|0);
  $4=($3|0)==0;
  if (!($4)) {
   label = 10;
   break;
  }
  $6=(tempValue=((HEAP32[((2888)>>2)])|0),HEAP32[((2888)>>2)]=((tempValue+0)|0),tempValue);
  $7=($6|0)==0;
  if ($7) {
   break;
  }
  $9=$6;
  FUNCTION_TABLE_v[($9)&1]();
 }
 if ((label|0) == 10) {
  return (($3)|0);
 }
 $16=((___cxa_allocate_exception(((4)|0)))|0);
 $17=$16;
 HEAP32[(($17)>>2)]=2136;
 ___cxa_throw((($16)|0),((2296)|0),(((12))|0));
 return ((0)|0);
}


function __ZSt15get_new_handlerv(){
 var $1=0,$2=0,label=0;

 $1=(tempValue=((HEAP32[((2888)>>2)])|0),HEAP32[((2888)>>2)]=((tempValue+0)|0),tempValue);
 $2=$1;
 return (($2)|0);
}


function __ZnwjRKSt9nothrow_t($size,$0){
 $size=($size)|0;
 $0=($0)|0;
 var $2=0,$5=0,$6=0,$p_0=0,$10=0,$4$0=0,$4$1=0,$9$0=0,$9$1=0,label=0;

 $2=((__Znwj($size))|0);
 $p_0=$2;

 return (($p_0)|0);
}


function __Znaj($size){
 $size=($size)|0;
 var $1=0,$5=0,$6=0,$8=0,$4$0=0,$4$1=0,label=0;

 $1=((__Znwj($size))|0);
 return (($1)|0);
}


function __ZnajRKSt9nothrow_t($size,$0){
 $size=($size)|0;
 $0=($0)|0;
 var $2=0,$5=0,$6=0,$p_0=0,$10=0,$4$0=0,$4$1=0,$9$0=0,$9$1=0,label=0;

 $2=((__Znaj($size))|0);
 $p_0=$2;

 return (($p_0)|0);
}


function __ZdlPv($ptr){
 $ptr=($ptr)|0;
 var $1=0,label=0;

 $1=($ptr|0)==0;
 if ($1) {
  return;
 }
 _free($ptr);
 return;
}


function __ZdlPvRKSt9nothrow_t($ptr,$0){
 $ptr=($ptr)|0;
 $0=($0)|0;
 var label=0;

 __ZdlPv($ptr);
 return;
}


function __ZdaPv($ptr){
 $ptr=($ptr)|0;
 var label=0;

 __ZdlPv($ptr);
 return;
}


function __ZdaPvRKSt9nothrow_t($ptr,$0){
 $ptr=($ptr)|0;
 $0=($0)|0;
 var label=0;

 __ZdaPv($ptr);
 return;
}


function __ZSt15set_new_handlerPFvvE($handler){
 $handler=($handler)|0;
 var $1=0,$2=0,$3=0,label=0;

 $1=$handler;
 $2=(tempValue=((HEAP32[((2888)>>2)])|0),HEAP32[((2888)>>2)]=$1,tempValue);
 $3=$2;
 return (($3)|0);
}


function __ZNSt9bad_allocC2Ev($this){
 $this=($this)|0;
 var $1=0,label=0;

 $1=(($this)|0);
 HEAP32[(($1)>>2)]=2136;
 return;
}


function __ZNSt9bad_allocD0Ev($this){
 $this=($this)|0;
 var $1=0,$2=0,label=0;

 $1=(($this)|0);

 $2=$this;
 __ZdlPv($2);
 return;
}


function __ZNSt9bad_allocD2Ev($this){
 $this=($this)|0;
 var $1=0,label=0;

 $1=(($this)|0);

 return;
}


function __ZNKSt9bad_alloc4whatEv($this){
 $this=($this)|0;
 var label=0;

 return ((376)|0);
}


function __ZNSt20bad_array_new_lengthC2Ev($this){
 $this=($this)|0;
 var $1=0,label=0;

 $1=(($this)|0);
 HEAP32[(($1)>>2)]=2168;
 return;
}


function __ZNSt20bad_array_new_lengthD0Ev($this){
 $this=($this)|0;
 var $1=0,$2=0,label=0;

 $1=(($this)|0);

 $2=$this;
 __ZdlPv($2);
 return;
}


function __ZNKSt16bad_array_length4whatEv($this){
 $this=($this)|0;
 var label=0;

 return ((712)|0);
}


function __ZNSt16bad_array_lengthC2Ev($this){
 $this=($this)|0;
 var $1=0,label=0;

 $1=(($this)|0);
 HEAP32[(($1)>>2)]=2200;
 return;
}


function __ZNSt16bad_array_lengthD0Ev($this){
 $this=($this)|0;
 var $1=0,$2=0,label=0;

 $1=(($this)|0);

 $2=$this;
 __ZdlPv($2);
 return;
}


function __ZNKSt20bad_array_new_length4whatEv($this){
 $this=($this)|0;
 var label=0;

 return ((400)|0);
}


function __ZSt17__throw_bad_allocv(){
 var $1=0,$2=0,label=0;

 $1=((___cxa_allocate_exception(((4)|0)))|0);
 $2=$1;
 HEAP32[(($2)>>2)]=2136;
 ___cxa_throw((($1)|0),((2296)|0),(((12))|0));

}


function ___floatscan($f,$prec,$pok){
 $f=($f)|0;
 $prec=($prec)|0;
 $pok=($pok)|0;
 var $x_i=0,$bits_0_ph=0,$emin_0_ph=0,$3=0,$4=0,$6=0,$7=0,$8=0,$10=0,$11=0,$12=0,$14=0,$16=0,$17=0,$18=0,$20=0,$22=0,$23=0,$24=0,$25=0;
 var $26=0,$27=0,$29=0,$30=0,$31=0,$33=0,$sign_0=0,$c_0=0,$c_169=0,$i_068=0,$36=0,$37=0,$38=0,$39=0,$40=0,$42=0,$44=0,$45=0,$46=0,$48=0;
 var $49=0,$50=0,$52=0,$c_2=0,$54=0,$55=0,$c_1_lcssa=0,$i_0_lcssa=0,$57=0,$58=0,$or_cond=0,$60=0,$61=0,$62=0,$64=0,$65=0,$notlhs=0,$notrhs=0,$or_cond106_not=0,$brmerge=0;
 var $i_166=0,$68=0,$69=0,$70=0,$71=0,$72=.0,$73=.0,$74=.0,$76=0,$c_364=0,$i_263=0,$77=0,$78=0,$79=0,$80=0,$81=0,$83=0,$85=0,$86=0,$87=0;
 var $89=0,$90=0,$91=0,$93=0,$c_4=0,$95=0,$96=0,$i_3=0,$c_5=0,$98=0,$99=0,$100=0,$102=0,$103=0,$104=0,$106=0,$108=0,$109=0,$111=0,$112=0;
 var $114=0,$115=0,$i_4=0,$116=0,$117=0,$118=0,$120=0,$121=0,$122=0,$124=0,$126=0,$127=0,$128=0,$129=0,$130=0,$or_cond8=0,$132=0,$133=0,$134=0,$or_cond5=0;
 var $136=0,$138=0,$139=0,$141=0,$142=0,$144=0,$brmerge107=0,$146=0,$_in=0,$147=0,$148=0,$149=0,$150=0,$152=0,$154=0,$155=0,$157=0,$158=0,$160=0,$162=0;
 var $164=0,$165=0,$166=0,$168=0,$169=0,$170=0,$172=0,$174=0,$175=0,$176=0,$178=0,$179=0,$180=0,$182=0,$183=0,$184=0,$186=0,$gotdig_0_i=0,$c_0_i=0,$188=0;
 var $189=0,$190=0,$192=0,$193=0,$194=0,$196=0,$198=0,$199=0,$200=0,$202=0,$203=0,$204=0,$206=0,$c_1_ph_i=0,$207=0,$rp_021_i$0=0,$rp_021_i$1=0,$208=0,$209=0,$210=0;
 var $212=0,$213=0,$214=0,$216=0,$218=0,$219=0,$$etemp$0$0=0,$$etemp$0$1=0,$x_0_i=0,$y_0_i=.0,$scale_0_i=.0,$gottail_0_i=0,$gotrad_0_i=0,$gotdig_2_i=0,$rp_1_i$0=0,$rp_1_i$1=0,$dc_0_i$0=0,$dc_0_i$1=0,$c_2_i=0,$220=0;
 var $221=0,$223=0,$224=0,$225=0,$226=0,$or_cond_i=0,$228=0,$230=0,$231=0,$_38_i=0,$d_0_i=0,$$etemp$1$0=0,$$etemp$1$1=0,$232=0,$234=0,$235=0,$$etemp$2$0=0,$$etemp$2$1=0,$237=0,$239=.0;
 var $240=.0,$241=.0,$242=.0,$244=0,$245=0,$or_cond3_i=0,$247=.0,$248=.0,$x_1_i=0,$y_1_i=.0,$scale_1_i=.0,$gottail_1_i=0,$$etemp$3$0=0,$$etemp$3$1=0,$x_2_i=0,$y_2_i=.0,$scale_2_i=.0,$gottail_2_i=0,$gotrad_1_i=0,$gotdig_3_i=0;
 var $rp_2_i$0=0,$rp_2_i$1=0,$dc_1_i$0=0,$dc_1_i$1=0,$251=0,$252=0,$253=0,$255=0,$256=0,$257=0,$259=0,$c_2_lcssa_i=0,$261=0,$263=0,$264=0,$266=0,$267=0,$271=0,$272=0,$273=0;
 var $275=0,$277=.0,$278=.0,$280=0,$dc_0_rp_1_i$0=0,$dc_0_rp_1_i$1=0,$$etemp$4$0=0,$$etemp$4$1=0,$281=0,$dc_214_i$0=0,$dc_214_i$1=0,$x_313_i=0,$282=0,$$etemp$5$0=0,$$etemp$5$1=0,$$etemp$6$0=0,$$etemp$6$1=0,$284=0,$x_3_lcssa_i=0,$285=0;
 var $286=0,$288$0=0,$288$1=0,$$etemp$7$0=0,$$etemp$7$1=0,$289=0,$292=0,$293=0,$295=0,$296=0,$299=0,$300=0,$302=0,$303=0,$e2_0_i$0=0,$e2_0_i$1=0,$305$0=0,$305$1=0,$$etemp$8$0=0,$$etemp$8$1=0;
 var $308=0,$310=.0,$311=.0,$313=0,$314$0=0,$314$1=0,$315=0,$317=0,$318=.0,$319=.0,$320=.0,$322=0,$323$0=0,$323$1=0,$324=0,$325=0,$327=0,$328=.0,$329=.0,$330=.0;
 var $e2_110_i$0=0,$e2_110_i$1=0,$y_39_i=.0,$x_48_i=0,$331=0,$332=0,$334=0,$335=.0,$x_5_i=0,$_pn_i=.0,$y_4_i=.0,$$etemp$9$0=0,$$etemp$9$1=0,$338=0,$e2_1_lcssa_i$0=0,$e2_1_lcssa_i$1=0,$y_3_lcssa_i=.0,$x_4_lcssa_i=0,$339$0=0,$339$1=0;
 var $340$0=0,$340$1=0,$$etemp$10$0=0,$$etemp$10$1=0,$343=0,$345$0=0,$345=0,$346=0,$__i=0,$_02_i=0,$348=0,$_pre_i=.0,$350=0,$351=.0,$352=.0,$353=.0,$354=0,$355=0,$or_cond4_i=0,$357=0;
 var $358=0,$359=0,$_x_4_i=0,$_y_3_i=.0,$_pre_phi_i=.0,$bias_07_i=.0,$x_6_i=0,$y_5_i=.0,$360=.0,$361=.0,$362=.0,$363=.0,$364=.0,$365=.0,$366=0,$368=0,$370$0=0,$370=0,$371=.0,$373=0;
 var $374=0,$376=0,$377=0,$c_6=0,$379=0,$$etemp$11$0=0,$$etemp$11$1=0,$sum_i=0,$380=0,$gotdig_0_i9=0,$_08_i=0,$382=0,$383=0,$384=0,$386=0,$387=0,$388=0,$390=0,$392=0,$393=0;
 var $394=0,$396=0,$397=0,$398=0,$400=0,$_1_ph_i=0,$401=0,$lrp_0110_i$0=0,$lrp_0110_i$1=0,$402=0,$403=0,$404=0,$406=0,$407=0,$408=0,$410=0,$_1_be_i=0,$411=0,$$etemp$12$0=0,$$etemp$12$1=0;
 var $lrp_1_i$0=0,$lrp_1_i$1=0,$gotdig_2_i11=0,$gotrad_0_i12=0,$_2_i=0,$412=0,$413=0,$414=0,$415=0,$or_cond789_i=0,$416=0,$417=0,$418=0,$_397_i=0,$j_096_i=0,$k_095_i=0,$gotrad_194_i=0,$gotdig_393_i=0,$lnz_092_i=0,$dc_091_i$0=0;
 var $dc_091_i$1=0,$lrp_290_i$0=0,$lrp_290_i$1=0,$cond_i=0,$421=0,$$etemp$13$0=0,$$etemp$13$1=0,$423=0,$425$0=0,$425=0,$_lnz_0_i=0,$426=0,$427=0,$429=0,$430=0,$431=0,$432=0,$storemerge_i=0,$434=0,$435=0;
 var $436=0,$_k_0_i=0,$_10_i=0,$439=0,$440=0,$lrp_3_i$0=0,$lrp_3_i$1=0,$dc_1_i14$0=0,$dc_1_i14$1=0,$lnz_2_i=0,$gotdig_4_i=0,$gotrad_2_i=0,$k_2_i=0,$j_2_i=0,$441=0,$442=0,$443=0,$445=0,$446=0,$447=0;
 var $449=0,$_3_be_i=0,$450=0,$451=0,$452=0,$or_cond7_i=0,$_3_lcssa_i=0,$j_0_lcssa_i=0,$k_0_lcssa_i=0,$gotrad_1_lcssa_i=0,$gotdig_3_lcssa_i=0,$lnz_0_lcssa_i=0,$dc_0_lcssa_i$0=0,$dc_0_lcssa_i$1=0,$lrp_2_lcssa_i$0=0,$lrp_2_lcssa_i$1=0,$453=0,$dc_0_lrp_2_i$0=0,$dc_0_lrp_2_i$1=0,$_388_i=0;
 var $j_086_i=0,$k_084_i=0,$gotdig_381_i=0,$lnz_079_i=0,$dc_077_i$0=0,$dc_077_i$1=0,$lrp_4_i$0=0,$lrp_4_i$1=0,$454=0,$456=0,$457=0,$459$0=0,$459$1=0,$$etemp$14$0=0,$$etemp$14$1=0,$460=0,$463=0,$464=0,$466=0,$467=0;
 var $e10_0_i$0=0,$e10_0_i$1=0,$472=0,$474=0,$475=0,$477=0,$478=0,$lrp_5_i$0=0,$lrp_5_i$1=0,$481=0,$483=0,$484=0,$486=.0,$487=.0,$489=0,$$etemp$15$0=0,$$etemp$15$1=0,$490=0,$or_cond_i15=0,$492=0;
 var $494=0,$495=0,$497=.0,$498=.0,$499=.0,$501=0,$502$0=0,$502$1=0,$503=0,$505=0,$506=.0,$507=.0,$508=.0,$510=0,$511$0=0,$511$1=0,$512=0,$514=0,$515=.0,$516=.0;
 var $517=.0,$519=0,$520=0,$521=0,$_promoted_i=0,$523=0,$j_371_i=0,$524=0,$525=0,$526=0,$528=0,$k_3_i=0,$530$0=0,$530=0,$531=0,$533=0,$534=0,$or_cond3_i16=0,$536=0,$538=.0;
 var $539=0,$540=.0,$541=.0,$543=0,$545=.0,$546=0,$547=.0,$548=.0,$549=0,$550=0,$551=0,$552=.0,$553=.0,$555=0,$_neg20_i=0,$556=0,$557=0,$_pre_i17=0,$559=0,$560=0;
 var $561=.0,$562=.0,$563=.0,$564=0,$565=0,$566=0,$567=.0,$568=.0,$570=0,$571=0,$573=0,$574=0,$575=0,$576=0,$577=0,$578=0,$579=0,$580=0,$carry_063_i=0,$k_462_i=0;
 var $a_061_i=0,$rp_060_i=0,$581=0,$582=0,$583=0,$584=0,$585=0,$586=0,$587=0,$588=0,$or_cond11_i=0,$589=0,$591=0,$592=0,$rp_1_i18=0,$a_1_i=0,$593=0,$594=0,$596=0,$597=0;
 var $rp_0_lcssa162_i=0,$a_0_lcssa161_i=0,$z_0_i=0,$598=0,$599=0,$rp_2_ph38_i=0,$e2_0_ph_i=0,$z_1_ph39_i=0,$a_2_ph40_i=0,$600=0,$601=0,$602=0,$e2_0_us_i=0,$z_1_us_i=0,$603=0,$z_2_us_i=0,$k_5_in_us_i=0,$carry1_0_us_i=0,$k_5_us_i=0,$605=0;
 var $606=0,$607$0=0,$607$1=0,$608$0=0,$608$1=0,$609$0=0,$609$1=0,$$etemp$16$0=0,$$etemp$16$1=0,$611=0,$extract_t19_us_i$0=0,$extract_t19_us_i=0,$$etemp$17$0=0,$$etemp$17$1=0,$614$0=0,$614=0,$$etemp$18$0=0,$$etemp$18$1=0,$extract_t_us_i$0=0,$extract_t_us_i=0;
 var $_sink_off0_us_i=0,$carry1_1_us_i=0,$617=0,$618=0,$619=0,$620=0,$or_cond12_us_i=0,$622=0,$k_5_z_2_us_i=0,$z_3_us_i=0,$624=0,$626=0,$627=0,$e2_0_us44_i=0,$z_1_us45_i=0,$628=0,$629=0,$630=0,$z_2_us47_i=0,$k_5_in_us48_i=0;
 var $carry1_0_us49_i=0,$k_5_us50_i=0,$632=0,$633=0,$634$0=0,$634$1=0,$635$0=0,$635$1=0,$636$0=0,$636$1=0,$$etemp$19$0=0,$$etemp$19$1=0,$638=0,$extract_t19_us51_i$0=0,$extract_t19_us51_i=0,$$etemp$20$0=0,$$etemp$20$1=0,$641$0=0,$641=0,$$etemp$21$0=0;
 var $$etemp$21$1=0,$extract_t_us52_i$0=0,$extract_t_us52_i=0,$_sink_off0_us53_i=0,$carry1_1_us54_i=0,$644=0,$645=0,$646=0,$647=0,$or_cond12_us55_i=0,$649=0,$k_5_z_2_us56_i=0,$z_3_us57_i=0,$651=0,$653=0,$654=0,$carry1_1_lcssa_lcssa_i=0,$z_3_lcssa_lcssa_i=0,$_lcssa43_i=0,$655=0;
 var $656=0,$657=0,$658=0,$660=0,$661=0,$662=0,$663=0,$664=0,$665=0,$666=0,$667=0,$668=0,$z_4_i=0,$670=0,$e2_1_i=0,$a_3_i=0,$672=0,$i_025_i=0,$674=0,$675=0;
 var $676=0,$678=0,$679=0,$680=0,$681=0,$682=0,$684=0,$685=0,$i_1_i=0,$687=0,$or_cond13_i=0,$688=0,$689=0,$691=0,$692=0,$693=0,$694=0,$695=0,$carry3_030_i=0,$k_628_i=0;
 var $a_427_i=0,$rp_426_i=0,$696=0,$697=0,$698=0,$699=0,$700=0,$701=0,$702=0,$703=0,$or_cond15_i=0,$704=0,$705=0,$706=0,$rp_5_i=0,$a_5_i=0,$707=0,$708=0,$710=0,$712=0;
 var $rp_3_ph33_i=0,$e2_1_ph_i=0,$z_5_ph_i=0,$a_3_ph_i=0,$713=0,$714=0,$715=0,$716=0,$717=0,$rp_3_i_ph=0,$e2_1_i_ph=0,$a_3_i_ph=0,$718=0,$719=0,$_14_i=0,$721=0,$722=0,$724=0,$725=0,$z_7_i=0;
 var $727=0,$728=0,$729=.0,$730=0,$731=0,$732=0,$734=0,$__i22=0,$denormal_0_i=0,$_09_i=0,$736=0,$738=0,$739=.0,$740=.0,$741=0,$742=.0,$743=.0,$744=.0,$745=.0,$y_1_i23=.0;
 var $frac_0_i=.0,$bias_0_i=.0,$747=0,$748=0,$749=0,$751=0,$752=0,$753=0,$755=0,$757=0,$758=0,$759=0,$761=.0,$762=.0,$764=0,$766=.0,$767=.0,$769=0,$770=0,$771=0;
 var $773=.0,$774=.0,$776=.0,$777=.0,$frac_1_i=.0,$779=0,$780=0,$782=.0,$783=0,$785=.0,$frac_2_i=.0,$787=.0,$788=.0,$789=0,$790=0,$791=0,$793=.0,$794=0,$796=0,$797=0;
 var $or_cond16_i=0,$denormal_1_i=0,$798=.0,$799=0,$e2_2_i=0,$denormal_2_i=0,$y_2_i24=.0,$801=0,$802=0,$804=0,$805=0,$or_cond17_i=0,$807=0,$e2_3_i=0,$y_3_i=.0,$809=.0,$811=0,$812=0,$813=0,$814=0;
 var $z_7_1_i=0,$816=.0,$817=0,$818=0,$819=.0,$820=.0,$821=.0,$822=.0,$823=0,$824=0,$825=0,$_0=.0,$phitmp_i$0=0,$phitmp_i$1=0,$250$0=0,$250$1=0,$283$0=0,$283$1=0,$306$0=0,$306$1=0;
 var $307$0=0,$307$1=0,$337$0=0,$337$1=0,$341$0=0,$341$1=0,$342$0=0,$342$1=0,$phitmp_i10$0=0,$phitmp_i10$1=0,$422$0=0,$422$1=0,$470$0=0,$470$1=0,$610$0=0,$610$1=0,$613$0=0,$613$1=0,$615$0=0,$615$1=0;
 var $637$0=0,$637$1=0,$640$0=0,$640$1=0,$642$0=0,$642$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+512)|0;
 $x_i=((sp)|0);
 if (((($prec|0))|0)==((0)|0)) {
  $emin_0_ph=-149;$bits_0_ph=24;
 } else if (((($prec|0))|0)==((1)|0)) {
  $emin_0_ph=-1074;$bits_0_ph=53;
 } else if (((($prec|0))|0)==((2)|0)) {
  $emin_0_ph=-1074;$bits_0_ph=53;
 } else {
  $_0=0.0;

  STACKTOP=sp;return (+($_0));
 }


 $3=(($f+4)|0);
 $4=(($f+100)|0);
 while(1) {
  $6=((HEAP32[(($3)>>2)])|0);
  $7=((HEAP32[(($4)>>2)])|0);
  $8=($6>>>0)<($7>>>0);
  if ($8) {
   $10=(($6+1)|0);
   HEAP32[(($3)>>2)]=$10;
   $11=((HEAP8[($6)])|0);
   $12=($11&255);
   $16=$12;
  } else {
   $14=((___shgetc($f))|0);
   $16=$14;
  }

  $17=((_isspace((($16)|0)))|0);
  $18=($17|0)==0;
  if ($18) {
   break;
  }
 }
 $20=($16|0)==45;
 do {
  if (((($16|0))|0)==((45)|0)|((($16|0))|0)==((43)|0)) {
   $22=($20&1);
   $23=$22<<1;
   $24=(((1)-($23))|0);
   $25=((HEAP32[(($3)>>2)])|0);
   $26=((HEAP32[(($4)>>2)])|0);
   $27=($25>>>0)<($26>>>0);
   if ($27) {
    $29=(($25+1)|0);
    HEAP32[(($3)>>2)]=$29;
    $30=((HEAP8[($25)])|0);
    $31=($30&255);
    $c_0=$31;$sign_0=$24;
    break;
   } else {
    $33=((___shgetc($f))|0);
    $c_0=$33;$sign_0=$24;
    break;
   }
  } else {
   $c_0=$16;$sign_0=1;
  }
 } while(0);


 $i_068=0;$c_169=$c_0;
 while(1) {


  $36=$c_169|32;
  $37=((208+$i_068)|0);
  $38=((HEAP8[($37)])|0);
  $39=(($38<<24)>>24);
  $40=($36|0)==($39|0);
  if (!($40)) {
   $i_0_lcssa=$i_068;$c_1_lcssa=$c_169;
   break;
  }
  $42=($i_068>>>0)<((7)>>>0);
  do {
   if ($42) {
    $44=((HEAP32[(($3)>>2)])|0);
    $45=((HEAP32[(($4)>>2)])|0);
    $46=($44>>>0)<($45>>>0);
    if ($46) {
     $48=(($44+1)|0);
     HEAP32[(($3)>>2)]=$48;
     $49=((HEAP8[($44)])|0);
     $50=($49&255);
     $c_2=$50;
     break;
    } else {
     $52=((___shgetc($f))|0);
     $c_2=$52;
     break;
    }
   } else {
    $c_2=$c_169;
   }
  } while(0);

  $54=((($i_068)+(1))|0);
  $55=($54>>>0)<((8)>>>0);
  if ($55) {
   $i_068=$54;$c_169=$c_2;
  } else {
   $i_0_lcssa=$54;$c_1_lcssa=$c_2;
   break;
  }
 }


 do {
  if (((($i_0_lcssa|0))|0)==((3)|0)) {
   label = 23;
  } else if (!(((($i_0_lcssa|0))|0)==((8)|0))) {
   $57=($i_0_lcssa>>>0)<((4)>>>0);
   $58=($pok|0)==0;
   $or_cond=$57|$58;
   if (!($or_cond)) {
    $60=($i_0_lcssa|0)==8;
    if ($60) {
     break;
    } else {
     label = 23;
     break;
    }
   }
   $76=($i_0_lcssa|0)==0;
   L34: do {
    if ($76) {
     $i_263=0;$c_364=$c_1_lcssa;
     while(1) {


      $77=$c_364|32;
      $78=((584+$i_263)|0);
      $79=((HEAP8[($78)])|0);
      $80=(($79<<24)>>24);
      $81=($77|0)==($80|0);
      if (!($81)) {
       $c_5=$c_364;$i_3=$i_263;
       break L34;
      }
      $83=($i_263>>>0)<((2)>>>0);
      do {
       if ($83) {
        $85=((HEAP32[(($3)>>2)])|0);
        $86=((HEAP32[(($4)>>2)])|0);
        $87=($85>>>0)<($86>>>0);
        if ($87) {
         $89=(($85+1)|0);
         HEAP32[(($3)>>2)]=$89;
         $90=((HEAP8[($85)])|0);
         $91=($90&255);
         $c_4=$91;
         break;
        } else {
         $93=((___shgetc($f))|0);
         $c_4=$93;
         break;
        }
       } else {
        $c_4=$c_364;
       }
      } while(0);

      $95=((($i_263)+(1))|0);
      $96=($95>>>0)<((3)>>>0);
      if ($96) {
       $i_263=$95;$c_364=$c_4;
      } else {
       $c_5=$c_4;$i_3=$95;
       break;
      }
     }
    } else {
     $c_5=$c_1_lcssa;$i_3=$i_0_lcssa;
    }
   } while(0);


   if (((($i_3|0))|0)==((0)|0)) {
    $162=($c_5|0)==48;
    do {
     if ($162) {
      $164=((HEAP32[(($3)>>2)])|0);
      $165=((HEAP32[(($4)>>2)])|0);
      $166=($164>>>0)<($165>>>0);
      if ($166) {
       $168=(($164+1)|0);
       HEAP32[(($3)>>2)]=$168;
       $169=((HEAP8[($164)])|0);
       $170=($169&255);
       $174=$170;
      } else {
       $172=((___shgetc($f))|0);
       $174=$172;
      }

      $175=$174|32;
      $176=($175|0)==120;
      if (!($176)) {
       $373=((HEAP32[(($4)>>2)])|0);
       $374=($373|0)==0;
       if ($374) {
        $c_6=48;
        break;
       }
       $376=((HEAP32[(($3)>>2)])|0);
       $377=((($376)-(1))|0);
       HEAP32[(($3)>>2)]=$377;
       $c_6=48;
       break;
      }
      $178=((HEAP32[(($3)>>2)])|0);
      $179=((HEAP32[(($4)>>2)])|0);
      $180=($178>>>0)<($179>>>0);
      if ($180) {
       $182=(($178+1)|0);
       HEAP32[(($3)>>2)]=$182;
       $183=((HEAP8[($178)])|0);
       $184=($183&255);
       $c_0_i=$184;$gotdig_0_i=0;
      } else {
       $186=((___shgetc($f))|0);
       $c_0_i=$186;$gotdig_0_i=0;
      }
      while(1) {


       if (((($c_0_i|0))|0)==((46)|0)) {
        label = 70;
        break;
       } else if (!(((($c_0_i|0))|0)==((48)|0))) {
        $c_2_i=$c_0_i;$dc_0_i$1=0;$dc_0_i$0=0;$rp_1_i$1=0;$rp_1_i$0=0;$gotdig_2_i=$gotdig_0_i;$gotrad_0_i=0;$gottail_0_i=0;$scale_0_i=1.0;$y_0_i=0.0;$x_0_i=0;
        break;
       }
       $188=((HEAP32[(($3)>>2)])|0);
       $189=((HEAP32[(($4)>>2)])|0);
       $190=($188>>>0)<($189>>>0);
       if ($190) {
        $192=(($188+1)|0);
        HEAP32[(($3)>>2)]=$192;
        $193=((HEAP8[($188)])|0);
        $194=($193&255);
        $c_0_i=$194;$gotdig_0_i=1;
        continue;
       } else {
        $196=((___shgetc($f))|0);
        $c_0_i=$196;$gotdig_0_i=1;
        continue;
       }
      }
      L66: do {
       if ((label|0) == 70) {
        $198=((HEAP32[(($3)>>2)])|0);
        $199=((HEAP32[(($4)>>2)])|0);
        $200=($198>>>0)<($199>>>0);
        if ($200) {
         $202=(($198+1)|0);
         HEAP32[(($3)>>2)]=$202;
         $203=((HEAP8[($198)])|0);
         $204=($203&255);
         $c_1_ph_i=$204;
        } else {
         $206=((___shgetc($f))|0);
         $c_1_ph_i=$206;
        }

        $207=($c_1_ph_i|0)==48;
        if ($207) {
         $rp_021_i$1=-1;$rp_021_i$0=-1;
         while(1) {


          $208=((HEAP32[(($3)>>2)])|0);
          $209=((HEAP32[(($4)>>2)])|0);
          $210=($208>>>0)<($209>>>0);
          if ($210) {
           $212=(($208+1)|0);
           HEAP32[(($3)>>2)]=$212;
           $213=((HEAP8[($208)])|0);
           $214=($213&255);
           $218=$214;
          } else {
           $216=((___shgetc($f))|0);
           $218=$216;
          }

          $219=($218|0)==48;
          if (!($219)) {
           $c_2_i=$218;$dc_0_i$1=0;$dc_0_i$0=0;$rp_1_i$1=$rp_021_i$1;$rp_1_i$0=$rp_021_i$0;$gotdig_2_i=1;$gotrad_0_i=1;$gottail_0_i=0;$scale_0_i=1.0;$y_0_i=0.0;$x_0_i=0;
           break L66;
          }
          $$etemp$0$0=-1;
          $$etemp$0$1=-1;
          $phitmp_i$0=((_i64Add($rp_021_i$0,$rp_021_i$1,$$etemp$0$0,$$etemp$0$1))|0);$phitmp_i$1=tempRet0;
          $rp_021_i$1=$phitmp_i$1;$rp_021_i$0=$phitmp_i$0;
         }
        } else {
         $c_2_i=$c_1_ph_i;$dc_0_i$1=0;$dc_0_i$0=0;$rp_1_i$1=0;$rp_1_i$0=0;$gotdig_2_i=$gotdig_0_i;$gotrad_0_i=1;$gottail_0_i=0;$scale_0_i=1.0;$y_0_i=0.0;$x_0_i=0;
        }
       }
      } while(0);
      L79: while(1) {











       $220=((($c_2_i)-(48))|0);
       $221=($220>>>0)<((10)>>>0);
       do {
        if ($221) {
         $d_0_i=$220;
         label = 84;
        } else {
         $223=$c_2_i|32;
         $224=((($223)-(97))|0);
         $225=($224>>>0)<((6)>>>0);
         $226=($c_2_i|0)==46;
         $or_cond_i=$225|$226;
         if (!($or_cond_i)) {
          $c_2_lcssa_i=$c_2_i;
          break L79;
         }
         if ($226) {
          $228=($gotrad_0_i|0)==0;
          if ($228) {
           $dc_1_i$1=$dc_0_i$1;$dc_1_i$0=$dc_0_i$0;$rp_2_i$1=$dc_0_i$1;$rp_2_i$0=$dc_0_i$0;$gotdig_3_i=$gotdig_2_i;$gotrad_1_i=1;$gottail_2_i=$gottail_0_i;$scale_2_i=$scale_0_i;$y_2_i=$y_0_i;$x_2_i=$x_0_i;
           break;
          } else {
           $c_2_lcssa_i=46;
           break L79;
          }
         } else {
          $230=($c_2_i|0)>57;
          $231=((($223)-(87))|0);
          $_38_i=($230?$231:$220);
          $d_0_i=$_38_i;
          label = 84;
          break;
         }
        }
       } while(0);
       if ((label|0) == 84) {
        label = 0;

        $$etemp$1$0=8;
        $$etemp$1$1=0;
        $232=(($dc_0_i$1|0) < ($$etemp$1$1|0)) | (((($dc_0_i$1|0) == ($$etemp$1$1|0) & ($dc_0_i$0>>>0) <  ($$etemp$1$0>>>0))));
        do {
         if ($232) {
          $234=$x_0_i<<4;
          $235=((($d_0_i)+($234))|0);
          $gottail_1_i=$gottail_0_i;$scale_1_i=$scale_0_i;$y_1_i=$y_0_i;$x_1_i=$235;
         } else {
          $$etemp$2$0=14;
          $$etemp$2$1=0;
          $237=(($dc_0_i$1|0) < ($$etemp$2$1|0)) | (((($dc_0_i$1|0) == ($$etemp$2$1|0) & ($dc_0_i$0>>>0) <  ($$etemp$2$0>>>0))));
          if ($237) {
           $239=(+((($d_0_i|0))|0));
           $240=($scale_0_i)*((0.0625));
           $241=($240)*($239);
           $242=($y_0_i)+($241);
           $gottail_1_i=$gottail_0_i;$scale_1_i=$240;$y_1_i=$242;$x_1_i=$x_0_i;
           break;
          }
          $244=($d_0_i|0)!=0;
          $245=($gottail_0_i|0)==0;
          $or_cond3_i=$244&$245;
          if ($or_cond3_i) {
           $247=($scale_0_i)*((0.5));
           $248=($y_0_i)+($247);
           $gottail_1_i=1;$scale_1_i=$scale_0_i;$y_1_i=$248;$x_1_i=$x_0_i;
          } else {
           $gottail_1_i=$gottail_0_i;$scale_1_i=$scale_0_i;$y_1_i=$y_0_i;$x_1_i=$x_0_i;
          }
         }
        } while(0);




        $$etemp$3$0=1;
        $$etemp$3$1=0;
        $250$0=((_i64Add($dc_0_i$0,$dc_0_i$1,$$etemp$3$0,$$etemp$3$1))|0);$250$1=tempRet0;
        $dc_1_i$1=$250$1;$dc_1_i$0=$250$0;$rp_2_i$1=$rp_1_i$1;$rp_2_i$0=$rp_1_i$0;$gotdig_3_i=1;$gotrad_1_i=$gotrad_0_i;$gottail_2_i=$gottail_1_i;$scale_2_i=$scale_1_i;$y_2_i=$y_1_i;$x_2_i=$x_1_i;
       }










       $251=((HEAP32[(($3)>>2)])|0);
       $252=((HEAP32[(($4)>>2)])|0);
       $253=($251>>>0)<($252>>>0);
       if ($253) {
        $255=(($251+1)|0);
        HEAP32[(($3)>>2)]=$255;
        $256=((HEAP8[($251)])|0);
        $257=($256&255);
        $c_2_i=$257;$dc_0_i$1=$dc_1_i$1;$dc_0_i$0=$dc_1_i$0;$rp_1_i$1=$rp_2_i$1;$rp_1_i$0=$rp_2_i$0;$gotdig_2_i=$gotdig_3_i;$gotrad_0_i=$gotrad_1_i;$gottail_0_i=$gottail_2_i;$scale_0_i=$scale_2_i;$y_0_i=$y_2_i;$x_0_i=$x_2_i;
        continue;
       } else {
        $259=((___shgetc($f))|0);
        $c_2_i=$259;$dc_0_i$1=$dc_1_i$1;$dc_0_i$0=$dc_1_i$0;$rp_1_i$1=$rp_2_i$1;$rp_1_i$0=$rp_2_i$0;$gotdig_2_i=$gotdig_3_i;$gotrad_0_i=$gotrad_1_i;$gottail_0_i=$gottail_2_i;$scale_0_i=$scale_2_i;$y_0_i=$y_2_i;$x_0_i=$x_2_i;
        continue;
       }
      }

      $261=($gotdig_2_i|0)==0;
      if ($261) {
       $263=((HEAP32[(($4)>>2)])|0);
       $264=($263|0)==0;
       if (!($264)) {
        $266=((HEAP32[(($3)>>2)])|0);
        $267=((($266)-(1))|0);
        HEAP32[(($3)>>2)]=$267;
       }
       if ($58) {
        ___shlim($f,0);
       } else {
        if (!($264)) {
         $271=((HEAP32[(($3)>>2)])|0);
         $272=((($271)-(1))|0);
         HEAP32[(($3)>>2)]=$272;
         $273=($gotrad_0_i|0)==0;
         if (!($273)) {
          $275=((($271)-(2))|0);
          HEAP32[(($3)>>2)]=$275;
         }
        }
       }
       $277=(+((($sign_0|0))|0));
       $278=($277)*((0.0));
       $_0=$278;

       STACKTOP=sp;return (+($_0));
      }
      $280=($gotrad_0_i|0)==0;
      $dc_0_rp_1_i$0=($280?$dc_0_i$0:$rp_1_i$0);
      $dc_0_rp_1_i$1=($280?$dc_0_i$1:$rp_1_i$1);
      $$etemp$4$0=8;
      $$etemp$4$1=0;
      $281=(($dc_0_i$1|0) < ($$etemp$4$1|0)) | (((($dc_0_i$1|0) == ($$etemp$4$1|0) & ($dc_0_i$0>>>0) <  ($$etemp$4$0>>>0))));
      if ($281) {
       $x_313_i=$x_0_i;$dc_214_i$1=$dc_0_i$1;$dc_214_i$0=$dc_0_i$0;
       while(1) {



        $282=$x_313_i<<4;
        $$etemp$5$0=1;
        $$etemp$5$1=0;
        $283$0=((_i64Add($dc_214_i$0,$dc_214_i$1,$$etemp$5$0,$$etemp$5$1))|0);$283$1=tempRet0;
        $$etemp$6$0=8;
        $$etemp$6$1=0;
        $284=(($283$1|0) < ($$etemp$6$1|0)) | (((($283$1|0) == ($$etemp$6$1|0) & ($283$0>>>0) <  ($$etemp$6$0>>>0))));
        if ($284) {
         $x_313_i=$282;$dc_214_i$1=$283$1;$dc_214_i$0=$283$0;
        } else {
         $x_3_lcssa_i=$282;
         break;
        }
       }
      } else {
       $x_3_lcssa_i=$x_0_i;
      }

      $285=$c_2_lcssa_i|32;
      $286=($285|0)==112;
      do {
       if ($286) {
        $288$0=((_scanexp($f,$pok))|0);
        $288$1=tempRet0;
        $$etemp$7$0=0;
        $$etemp$7$1=-2147483648;
        $289=(($288$0|0) == ($$etemp$7$0|0)) & (($288$1|0) == ($$etemp$7$1|0));
        if ($289) {
         if ($58) {
          ___shlim($f,0);
          $_0=0.0;

          STACKTOP=sp;return (+($_0));
         } else {
          $292=((HEAP32[(($4)>>2)])|0);
          $293=($292|0)==0;
          if ($293) {
           $e2_0_i$1=0;$e2_0_i$0=0;
           break;
          }
          $295=((HEAP32[(($3)>>2)])|0);
          $296=((($295)-(1))|0);
          HEAP32[(($3)>>2)]=$296;
          $e2_0_i$1=0;$e2_0_i$0=0;
          break;
         }
        } else {
         $e2_0_i$1=$288$1;$e2_0_i$0=$288$0;
        }
       } else {
        $299=((HEAP32[(($4)>>2)])|0);
        $300=($299|0)==0;
        if ($300) {
         $e2_0_i$1=0;$e2_0_i$0=0;
        } else {
         $302=((HEAP32[(($3)>>2)])|0);
         $303=((($302)-(1))|0);
         HEAP32[(($3)>>2)]=$303;
         $e2_0_i$1=0;$e2_0_i$0=0;
        }
       }
      } while(0);


      $305$0=($dc_0_rp_1_i$0<<2)|(0>>>30);
      $305$1=($dc_0_rp_1_i$1<<2)|($dc_0_rp_1_i$0>>>30);
      $$etemp$8$0=-32;
      $$etemp$8$1=-1;
      $306$0=((_i64Add($305$0,$305$1,$$etemp$8$0,$$etemp$8$1))|0);$306$1=tempRet0;
      $307$0=((_i64Add($306$0,$306$1,$e2_0_i$0,$e2_0_i$1))|0);$307$1=tempRet0;
      $308=($x_3_lcssa_i|0)==0;
      if ($308) {
       $310=(+((($sign_0|0))|0));
       $311=($310)*((0.0));
       $_0=$311;

       STACKTOP=sp;return (+($_0));
      }
      $313=(((-$emin_0_ph))|0);
      $314$0=$313;
      $314$1=0;
      $315=(($307$1|0) > ($314$1|0)) | (((($307$1|0) == ($314$1|0) & ($307$0>>>0) >  ($314$0>>>0))));
      if ($315) {
       $317=((___errno_location())|0);
       HEAP32[(($317)>>2)]=34;
       $318=(+((($sign_0|0))|0));
       $319=($318)*((1.7976931348623157e+308));
       $320=($319)*((1.7976931348623157e+308));
       $_0=$320;

       STACKTOP=sp;return (+($_0));
      }
      $322=((($emin_0_ph)-(106))|0);
      $323$0=$322;
      $323$1=((((($322|0)<0))|0)?-1:0);
      $324=(($307$1|0) < ($323$1|0)) | (((($307$1|0) == ($323$1|0) & ($307$0>>>0) <  ($323$0>>>0))));
      if ($324) {
       $327=((___errno_location())|0);
       HEAP32[(($327)>>2)]=34;
       $328=(+((($sign_0|0))|0));
       $329=($328)*((2.2250738585072014e-308));
       $330=($329)*((2.2250738585072014e-308));
       $_0=$330;

       STACKTOP=sp;return (+($_0));
      }
      $325=($x_3_lcssa_i|0)>-1;
      if ($325) {
       $x_48_i=$x_3_lcssa_i;$y_39_i=$y_0_i;$e2_110_i$1=$307$1;$e2_110_i$0=$307$0;
       while(1) {




        $331=$y_39_i<(0.5);
        $332=$x_48_i<<1;
        if ($331) {
         $_pn_i=$y_39_i;$x_5_i=$332;
        } else {
         $334=$332|1;
         $335=($y_39_i)+((-1.0));
         $_pn_i=$335;$x_5_i=$334;
        }


        $y_4_i=($y_39_i)+($_pn_i);
        $$etemp$9$0=-1;
        $$etemp$9$1=-1;
        $337$0=((_i64Add($e2_110_i$0,$e2_110_i$1,$$etemp$9$0,$$etemp$9$1))|0);$337$1=tempRet0;
        $338=($x_5_i|0)>-1;
        if ($338) {
         $x_48_i=$x_5_i;$y_39_i=$y_4_i;$e2_110_i$1=$337$1;$e2_110_i$0=$337$0;
        } else {
         $x_4_lcssa_i=$x_5_i;$y_3_lcssa_i=$y_4_i;$e2_1_lcssa_i$1=$337$1;$e2_1_lcssa_i$0=$337$0;
         break;
        }
       }
      } else {
       $x_4_lcssa_i=$x_3_lcssa_i;$y_3_lcssa_i=$y_0_i;$e2_1_lcssa_i$1=$307$1;$e2_1_lcssa_i$0=$307$0;
      }




      $339$0=$bits_0_ph;
      $339$1=0;
      $340$0=$emin_0_ph;
      $340$1=((((($emin_0_ph|0)<0))|0)?-1:0);
      $$etemp$10$0=32;
      $$etemp$10$1=0;
      $341$0=((_i64Subtract($$etemp$10$0,$$etemp$10$1,$340$0,$340$1))|0);$341$1=tempRet0;
      $342$0=((_i64Add($e2_1_lcssa_i$0,$e2_1_lcssa_i$1,$341$0,$341$1))|0);$342$1=tempRet0;
      $343=(($339$1|0) > ($342$1|0)) | (((($339$1|0) == ($342$1|0) & ($339$0>>>0) >  ($342$0>>>0))));
      if ($343) {
       $345$0=$342$0;
       $345=$345$0;
       $346=($345|0)<0;
       $__i=($346?0:$345);
       $_02_i=$__i;
      } else {
       $_02_i=$bits_0_ph;
      }

      $348=($_02_i|0)<53;
      if ($348) {
       $350=(((84)-($_02_i))|0);
       $351=(+(_scalbn(1.0,$350)));
       $352=(+((($sign_0|0))|0));
       $353=(+(_copysign((+($351)),(+($352)))));
       $354=($_02_i|0)<32;
       $355=$y_3_lcssa_i!=(0.0);
       $or_cond4_i=$354&$355;
       if ($or_cond4_i) {
        $357=$x_4_lcssa_i&1;
        $358=($357|0)==0;
        $359=$357^1;
        $_x_4_i=((($359)+($x_4_lcssa_i))|0);
        $_y_3_i=($358?(0.0):$y_3_lcssa_i);
        $y_5_i=$_y_3_i;$x_6_i=$_x_4_i;$bias_07_i=$353;$_pre_phi_i=$352;
       } else {
        $y_5_i=$y_3_lcssa_i;$x_6_i=$x_4_lcssa_i;$bias_07_i=$353;$_pre_phi_i=$352;
       }
      } else {
       $_pre_i=(+((($sign_0|0))|0));
       $y_5_i=$y_3_lcssa_i;$x_6_i=$x_4_lcssa_i;$bias_07_i=0.0;$_pre_phi_i=$_pre_i;
      }




      $360=(+((($x_6_i>>>0))>>>0));
      $361=($_pre_phi_i)*($360);
      $362=($bias_07_i)+($361);
      $363=($_pre_phi_i)*($y_5_i);
      $364=($363)+($362);
      $365=($364)-($bias_07_i);
      $366=$365!=(0.0);
      if (!($366)) {
       $368=((___errno_location())|0);
       HEAP32[(($368)>>2)]=34;
      }
      $370$0=$e2_1_lcssa_i$0;
      $370=$370$0;
      $371=(+(_scalbnl($365,$370)));
      $_0=$371;

      STACKTOP=sp;return (+($_0));
     } else {
      $c_6=$c_5;
     }
    } while(0);

    $379=$x_i;
    $$etemp$11$0=512;
    $$etemp$11$1=0;

    $sum_i=((($emin_0_ph)+($bits_0_ph))|0);
    $380=(((-$sum_i))|0);
    $_08_i=$c_6;$gotdig_0_i9=0;
    while(1) {


     if (((($_08_i|0))|0)==((46)|0)) {
      label = 139;
      break;
     } else if (!(((($_08_i|0))|0)==((48)|0))) {
      $_2_i=$_08_i;$gotrad_0_i12=0;$gotdig_2_i11=$gotdig_0_i9;$lrp_1_i$1=0;$lrp_1_i$0=0;
      break;
     }
     $382=((HEAP32[(($3)>>2)])|0);
     $383=((HEAP32[(($4)>>2)])|0);
     $384=($382>>>0)<($383>>>0);
     if ($384) {
      $386=(($382+1)|0);
      HEAP32[(($3)>>2)]=$386;
      $387=((HEAP8[($382)])|0);
      $388=($387&255);
      $_08_i=$388;$gotdig_0_i9=1;
      continue;
     } else {
      $390=((___shgetc($f))|0);
      $_08_i=$390;$gotdig_0_i9=1;
      continue;
     }
    }
    L168: do {
     if ((label|0) == 139) {
      $392=((HEAP32[(($3)>>2)])|0);
      $393=((HEAP32[(($4)>>2)])|0);
      $394=($392>>>0)<($393>>>0);
      if ($394) {
       $396=(($392+1)|0);
       HEAP32[(($3)>>2)]=$396;
       $397=((HEAP8[($392)])|0);
       $398=($397&255);
       $_1_ph_i=$398;
      } else {
       $400=((___shgetc($f))|0);
       $_1_ph_i=$400;
      }

      $401=($_1_ph_i|0)==48;
      if ($401) {
       $lrp_0110_i$1=-1;$lrp_0110_i$0=-1;
       while(1) {


        $402=((HEAP32[(($3)>>2)])|0);
        $403=((HEAP32[(($4)>>2)])|0);
        $404=($402>>>0)<($403>>>0);
        if ($404) {
         $406=(($402+1)|0);
         HEAP32[(($3)>>2)]=$406;
         $407=((HEAP8[($402)])|0);
         $408=($407&255);
         $_1_be_i=$408;
        } else {
         $410=((___shgetc($f))|0);
         $_1_be_i=$410;
        }

        $411=($_1_be_i|0)==48;
        if (!($411)) {
         $_2_i=$_1_be_i;$gotrad_0_i12=1;$gotdig_2_i11=1;$lrp_1_i$1=$lrp_0110_i$1;$lrp_1_i$0=$lrp_0110_i$0;
         break L168;
        }
        $$etemp$12$0=-1;
        $$etemp$12$1=-1;
        $phitmp_i10$0=((_i64Add($lrp_0110_i$0,$lrp_0110_i$1,$$etemp$12$0,$$etemp$12$1))|0);$phitmp_i10$1=tempRet0;
        $lrp_0110_i$1=$phitmp_i10$1;$lrp_0110_i$0=$phitmp_i10$0;
       }
      } else {
       $_2_i=$_1_ph_i;$gotrad_0_i12=1;$gotdig_2_i11=$gotdig_0_i9;$lrp_1_i$1=0;$lrp_1_i$0=0;
      }
     }
    } while(0);





    $412=(($x_i)|0);
    HEAP32[(($412)>>2)]=0;
    $413=((($_2_i)-(48))|0);
    $414=($413>>>0)<((10)>>>0);
    $415=($_2_i|0)==46;
    $or_cond789_i=$414|$415;
    L182: do {
     if ($or_cond789_i) {
      $416=(($x_i+496)|0);
      $lrp_290_i$1=$lrp_1_i$1;$lrp_290_i$0=$lrp_1_i$0;$dc_091_i$1=0;$dc_091_i$0=0;$lnz_092_i=0;$gotdig_393_i=$gotdig_2_i11;$gotrad_194_i=$gotrad_0_i12;$k_095_i=0;$j_096_i=0;$_397_i=$_2_i;$418=$413;$417=$415;
      while(1) {












       do {
        if ($417) {
         $cond_i=($gotrad_194_i|0)==0;
         if ($cond_i) {
          $j_2_i=$j_096_i;$k_2_i=$k_095_i;$gotrad_2_i=1;$gotdig_4_i=$gotdig_393_i;$lnz_2_i=$lnz_092_i;$dc_1_i14$1=$dc_091_i$1;$dc_1_i14$0=$dc_091_i$0;$lrp_3_i$1=$dc_091_i$1;$lrp_3_i$0=$dc_091_i$0;
         } else {
          $lrp_4_i$1=$lrp_290_i$1;$lrp_4_i$0=$lrp_290_i$0;$dc_077_i$1=$dc_091_i$1;$dc_077_i$0=$dc_091_i$0;$lnz_079_i=$lnz_092_i;$gotdig_381_i=$gotdig_393_i;$k_084_i=$k_095_i;$j_086_i=$j_096_i;$_388_i=$_397_i;
          break L182;
         }
        } else {
         $421=($k_095_i|0)<125;
         $$etemp$13$0=1;
         $$etemp$13$1=0;
         $422$0=((_i64Add($dc_091_i$0,$dc_091_i$1,$$etemp$13$0,$$etemp$13$1))|0);$422$1=tempRet0;
         $423=($_397_i|0)!=48;
         if (!($421)) {
          if (!($423)) {
           $j_2_i=$j_096_i;$k_2_i=$k_095_i;$gotrad_2_i=$gotrad_194_i;$gotdig_4_i=$gotdig_393_i;$lnz_2_i=$lnz_092_i;$dc_1_i14$1=$422$1;$dc_1_i14$0=$422$0;$lrp_3_i$1=$lrp_290_i$1;$lrp_3_i$0=$lrp_290_i$0;
           break;
          }
          $439=((HEAP32[(($416)>>2)])|0);
          $440=$439|1;
          HEAP32[(($416)>>2)]=$440;
          $j_2_i=$j_096_i;$k_2_i=$k_095_i;$gotrad_2_i=$gotrad_194_i;$gotdig_4_i=$gotdig_393_i;$lnz_2_i=$lnz_092_i;$dc_1_i14$1=$422$1;$dc_1_i14$0=$422$0;$lrp_3_i$1=$lrp_290_i$1;$lrp_3_i$0=$lrp_290_i$0;
          break;
         }
         $425$0=$422$0;
         $425=$425$0;
         $_lnz_0_i=($423?$425:$lnz_092_i);
         $426=($j_096_i|0)==0;
         $427=(($x_i+($k_095_i<<2))|0);
         if ($426) {
          $storemerge_i=$418;
         } else {
          $429=((HEAP32[(($427)>>2)])|0);
          $430=((($429)*(10))&-1);
          $431=((($_397_i)-(48))|0);
          $432=((($431)+($430))|0);
          $storemerge_i=$432;
         }

         HEAP32[(($427)>>2)]=$storemerge_i;
         $434=((($j_096_i)+(1))|0);
         $435=($434|0)==9;
         $436=($435&1);
         $_k_0_i=((($436)+($k_095_i))|0);
         $_10_i=($435?0:$434);
         $j_2_i=$_10_i;$k_2_i=$_k_0_i;$gotrad_2_i=$gotrad_194_i;$gotdig_4_i=1;$lnz_2_i=$_lnz_0_i;$dc_1_i14$1=$422$1;$dc_1_i14$0=$422$0;$lrp_3_i$1=$lrp_290_i$1;$lrp_3_i$0=$lrp_290_i$0;
        }
       } while(0);









       $441=((HEAP32[(($3)>>2)])|0);
       $442=((HEAP32[(($4)>>2)])|0);
       $443=($441>>>0)<($442>>>0);
       if ($443) {
        $445=(($441+1)|0);
        HEAP32[(($3)>>2)]=$445;
        $446=((HEAP8[($441)])|0);
        $447=($446&255);
        $_3_be_i=$447;
       } else {
        $449=((___shgetc($f))|0);
        $_3_be_i=$449;
       }

       $450=((($_3_be_i)-(48))|0);
       $451=($450>>>0)<((10)>>>0);
       $452=($_3_be_i|0)==46;
       $or_cond7_i=$451|$452;
       if ($or_cond7_i) {
        $lrp_290_i$1=$lrp_3_i$1;$lrp_290_i$0=$lrp_3_i$0;$dc_091_i$1=$dc_1_i14$1;$dc_091_i$0=$dc_1_i14$0;$lnz_092_i=$lnz_2_i;$gotdig_393_i=$gotdig_4_i;$gotrad_194_i=$gotrad_2_i;$k_095_i=$k_2_i;$j_096_i=$j_2_i;$_397_i=$_3_be_i;$418=$450;$417=$452;
       } else {
        $lrp_2_lcssa_i$1=$lrp_3_i$1;$lrp_2_lcssa_i$0=$lrp_3_i$0;$dc_0_lcssa_i$1=$dc_1_i14$1;$dc_0_lcssa_i$0=$dc_1_i14$0;$lnz_0_lcssa_i=$lnz_2_i;$gotdig_3_lcssa_i=$gotdig_4_i;$gotrad_1_lcssa_i=$gotrad_2_i;$k_0_lcssa_i=$k_2_i;$j_0_lcssa_i=$j_2_i;$_3_lcssa_i=$_3_be_i;
        label = 162;
        break;
       }
      }
     } else {
      $lrp_2_lcssa_i$1=$lrp_1_i$1;$lrp_2_lcssa_i$0=$lrp_1_i$0;$dc_0_lcssa_i$1=0;$dc_0_lcssa_i$0=0;$lnz_0_lcssa_i=0;$gotdig_3_lcssa_i=$gotdig_2_i11;$gotrad_1_lcssa_i=$gotrad_0_i12;$k_0_lcssa_i=0;$j_0_lcssa_i=0;$_3_lcssa_i=$_2_i;
      label = 162;
     }
    } while(0);
    if ((label|0) == 162) {










     $453=($gotrad_1_lcssa_i|0)==0;
     $dc_0_lrp_2_i$0=($453?$dc_0_lcssa_i$0:$lrp_2_lcssa_i$0);
     $dc_0_lrp_2_i$1=($453?$dc_0_lcssa_i$1:$lrp_2_lcssa_i$1);
     $lrp_4_i$1=$dc_0_lrp_2_i$1;$lrp_4_i$0=$dc_0_lrp_2_i$0;$dc_077_i$1=$dc_0_lcssa_i$1;$dc_077_i$0=$dc_0_lcssa_i$0;$lnz_079_i=$lnz_0_lcssa_i;$gotdig_381_i=$gotdig_3_lcssa_i;$k_084_i=$k_0_lcssa_i;$j_086_i=$j_0_lcssa_i;$_388_i=$_3_lcssa_i;
    }









    $454=($gotdig_381_i|0)!=0;
    if ($454) {
     $456=$_388_i|32;
     $457=($456|0)==101;
     if ($457) {
      $459$0=((_scanexp($f,$pok))|0);
      $459$1=tempRet0;
      $$etemp$14$0=0;
      $$etemp$14$1=-2147483648;
      $460=(($459$0|0) == ($$etemp$14$0|0)) & (($459$1|0) == ($$etemp$14$1|0));
      do {
       if ($460) {
        if ($58) {
         ___shlim($f,0);
         $_0=0.0;

         STACKTOP=sp;return (+($_0));
        } else {
         $463=((HEAP32[(($4)>>2)])|0);
         $464=($463|0)==0;
         if ($464) {
          $e10_0_i$1=0;$e10_0_i$0=0;
          break;
         }
         $466=((HEAP32[(($3)>>2)])|0);
         $467=((($466)-(1))|0);
         HEAP32[(($3)>>2)]=$467;
         $e10_0_i$1=0;$e10_0_i$0=0;
         break;
        }
       } else {
        $e10_0_i$1=$459$1;$e10_0_i$0=$459$0;
       }
      } while(0);


      $470$0=((_i64Add($e10_0_i$0,$e10_0_i$1,$lrp_4_i$0,$lrp_4_i$1))|0);$470$1=tempRet0;
      $lrp_5_i$1=$470$1;$lrp_5_i$0=$470$0;
     } else {
      label = 171;
     }
    } else {
     label = 171;
    }
    if ((label|0) == 171) {
     $472=($_388_i|0)>-1;
     if ($472) {
      $474=((HEAP32[(($4)>>2)])|0);
      $475=($474|0)==0;
      if ($475) {
       $lrp_5_i$1=$lrp_4_i$1;$lrp_5_i$0=$lrp_4_i$0;
      } else {
       $477=((HEAP32[(($3)>>2)])|0);
       $478=((($477)-(1))|0);
       HEAP32[(($3)>>2)]=$478;
       $lrp_5_i$1=$lrp_4_i$1;$lrp_5_i$0=$lrp_4_i$0;
      }
     } else {
      $lrp_5_i$1=$lrp_4_i$1;$lrp_5_i$0=$lrp_4_i$0;
     }
    }


    if (!($454)) {
     $481=((___errno_location())|0);
     HEAP32[(($481)>>2)]=22;
     ___shlim($f,0);
     $_0=0.0;

     STACKTOP=sp;return (+($_0));
    }
    $483=((HEAP32[(($412)>>2)])|0);
    $484=($483|0)==0;
    if ($484) {
     $486=(+((($sign_0|0))|0));
     $487=($486)*((0.0));
     $_0=$487;

     STACKTOP=sp;return (+($_0));
    }
    $489=(($lrp_5_i$0|0) == ($dc_077_i$0|0)) & (($lrp_5_i$1|0) == ($dc_077_i$1|0));
    $$etemp$15$0=10;
    $$etemp$15$1=0;
    $490=(($dc_077_i$1|0) < ($$etemp$15$1|0)) | (((($dc_077_i$1|0) == ($$etemp$15$1|0) & ($dc_077_i$0>>>0) <  ($$etemp$15$0>>>0))));
    $or_cond_i15=$489&$490;
    do {
     if ($or_cond_i15) {
      $492=($bits_0_ph>>>0)>((30)>>>0);
      if (!($492)) {
       $494=$483>>>($bits_0_ph>>>0);
       $495=($494|0)==0;
       if (!($495)) {
        break;
       }
      }
      $497=(+((($sign_0|0))|0));
      $498=(+((($483>>>0))>>>0));
      $499=($497)*($498);
      $_0=$499;

      STACKTOP=sp;return (+($_0));
     }
    } while(0);
    $501=(((($emin_0_ph|0))/(-2))&-1);
    $502$0=$501;
    $502$1=((((($501|0)<0))|0)?-1:0);
    $503=(($lrp_5_i$1|0) > ($502$1|0)) | (((($lrp_5_i$1|0) == ($502$1|0) & ($lrp_5_i$0>>>0) >  ($502$0>>>0))));
    if ($503) {
     $505=((___errno_location())|0);
     HEAP32[(($505)>>2)]=34;
     $506=(+((($sign_0|0))|0));
     $507=($506)*((1.7976931348623157e+308));
     $508=($507)*((1.7976931348623157e+308));
     $_0=$508;

     STACKTOP=sp;return (+($_0));
    }
    $510=((($emin_0_ph)-(106))|0);
    $511$0=$510;
    $511$1=((((($510|0)<0))|0)?-1:0);
    $512=(($lrp_5_i$1|0) < ($511$1|0)) | (((($lrp_5_i$1|0) == ($511$1|0) & ($lrp_5_i$0>>>0) <  ($511$0>>>0))));
    if ($512) {
     $514=((___errno_location())|0);
     HEAP32[(($514)>>2)]=34;
     $515=(+((($sign_0|0))|0));
     $516=($515)*((2.2250738585072014e-308));
     $517=($516)*((2.2250738585072014e-308));
     $_0=$517;

     STACKTOP=sp;return (+($_0));
    }
    $519=($j_086_i|0)==0;
    if ($519) {
     $k_3_i=$k_084_i;
    } else {
     $520=($j_086_i|0)<9;
     if ($520) {
      $521=(($x_i+($k_084_i<<2))|0);
      $_promoted_i=((HEAP32[(($521)>>2)])|0);
      $j_371_i=$j_086_i;$523=$_promoted_i;
      while(1) {


       $524=((($523)*(10))&-1);
       $525=((($j_371_i)+(1))|0);
       $526=($525|0)<9;
       if ($526) {
        $j_371_i=$525;$523=$524;
       } else {
        break;
       }
      }
      HEAP32[(($521)>>2)]=$524;
     }
     $528=((($k_084_i)+(1))|0);
     $k_3_i=$528;
    }

    $530$0=$lrp_5_i$0;
    $530=$530$0;
    $531=($lnz_079_i|0)<9;
    do {
     if ($531) {
      $533=($lnz_079_i|0)<=($530|0);
      $534=($530|0)<18;
      $or_cond3_i16=$533&$534;
      if ($or_cond3_i16) {
       $536=($530|0)==9;
       if ($536) {
        $538=(+((($sign_0|0))|0));
        $539=((HEAP32[(($412)>>2)])|0);
        $540=(+((($539>>>0))>>>0));
        $541=($538)*($540);
        $_0=$541;

        STACKTOP=sp;return (+($_0));
       }
       $543=($530|0)<9;
       if ($543) {
        $545=(+((($sign_0|0))|0));
        $546=((HEAP32[(($412)>>2)])|0);
        $547=(+((($546>>>0))>>>0));
        $548=($545)*($547);
        $549=(((8)-($530))|0);
        $550=((40+($549<<2))|0);
        $551=((HEAP32[(($550)>>2)])|0);
        $552=(+((($551|0))|0));
        $553=($548)/($552);
        $_0=$553;

        STACKTOP=sp;return (+($_0));
       }
       $555=((($530)*(-3))&-1);
       $_neg20_i=((($bits_0_ph)+(27))|0);
       $556=((($_neg20_i)+($555))|0);
       $557=($556|0)>30;
       $_pre_i17=((HEAP32[(($412)>>2)])|0);
       if (!($557)) {
        $559=$_pre_i17>>>($556>>>0);
        $560=($559|0)==0;
        if (!($560)) {
         break;
        }
       }
       $561=(+((($sign_0|0))|0));
       $562=(+((($_pre_i17>>>0))>>>0));
       $563=($561)*($562);
       $564=((($530)-(10))|0);
       $565=((40+($564<<2))|0);
       $566=((HEAP32[(($565)>>2)])|0);
       $567=(+((($566|0))|0));
       $568=($563)*($567);
       $_0=$568;

       STACKTOP=sp;return (+($_0));
      }
     }
    } while(0);
    $570=(((($530|0))%(9))&-1);
    $571=($570|0)==0;
    if ($571) {
     $a_2_ph40_i=0;$z_1_ph39_i=$k_3_i;$e2_0_ph_i=0;$rp_2_ph38_i=$530;
    } else {
     $573=($530|0)>-1;
     $574=((($570)+(9))|0);
     $575=($573?$570:$574);
     $576=(((8)-($575))|0);
     $577=((40+($576<<2))|0);
     $578=((HEAP32[(($577)>>2)])|0);
     $579=($k_3_i|0)==0;
     if ($579) {
      $z_0_i=0;$a_0_lcssa161_i=0;$rp_0_lcssa162_i=$530;
     } else {
      $580=(((1000000000)/(($578|0)))&-1);
      $rp_060_i=$530;$a_061_i=0;$k_462_i=0;$carry_063_i=0;
      while(1) {




       $581=(($x_i+($k_462_i<<2))|0);
       $582=((HEAP32[(($581)>>2)])|0);
       $583=(((($582>>>0))%(($578>>>0)))&-1);
       $584=(((($582>>>0))/(($578>>>0)))&-1);
       $585=((($584)+($carry_063_i))|0);
       HEAP32[(($581)>>2)]=$585;
       $586=(Math_imul($583,$580)|0);
       $587=($k_462_i|0)==($a_061_i|0);
       $588=($585|0)==0;
       $or_cond11_i=$587&$588;
       $589=((($k_462_i)+(1))|0);
       if ($or_cond11_i) {
        $591=$589&127;
        $592=((($rp_060_i)-(9))|0);
        $a_1_i=$591;$rp_1_i18=$592;
       } else {
        $a_1_i=$a_061_i;$rp_1_i18=$rp_060_i;
       }


       $593=($589|0)==($k_3_i|0);
       if ($593) {
        break;
       } else {
        $rp_060_i=$rp_1_i18;$a_061_i=$a_1_i;$k_462_i=$589;$carry_063_i=$586;
       }
      }
      $594=($586|0)==0;
      if ($594) {
       $z_0_i=$k_3_i;$a_0_lcssa161_i=$a_1_i;$rp_0_lcssa162_i=$rp_1_i18;
      } else {
       $596=((($k_3_i)+(1))|0);
       $597=(($x_i+($k_3_i<<2))|0);
       HEAP32[(($597)>>2)]=$586;
       $z_0_i=$596;$a_0_lcssa161_i=$a_1_i;$rp_0_lcssa162_i=$rp_1_i18;
      }
     }



     $598=(((9)-($575))|0);
     $599=((($598)+($rp_0_lcssa162_i))|0);
     $a_2_ph40_i=$a_0_lcssa161_i;$z_1_ph39_i=$z_0_i;$e2_0_ph_i=0;$rp_2_ph38_i=$599;
    }
    L280: while(1) {




     $600=($rp_2_ph38_i|0)<18;
     $601=(($x_i+($a_2_ph40_i<<2))|0);
     if ($600) {
      $z_1_us_i=$z_1_ph39_i;$e2_0_us_i=$e2_0_ph_i;
      while(1) {


       $603=((($z_1_us_i)+(127))|0);
       $carry1_0_us_i=0;$k_5_in_us_i=$603;$z_2_us_i=$z_1_us_i;
       while(1) {



        $k_5_us_i=$k_5_in_us_i&127;
        $605=(($x_i+($k_5_us_i<<2))|0);
        $606=((HEAP32[(($605)>>2)])|0);
        $607$0=$606;
        $607$1=0;
        $608$0=($607$0<<29)|(0>>>3);
        $608$1=($607$1<<29)|($607$0>>>3);
        $609$0=$carry1_0_us_i;
        $609$1=0;
        $610$0=((_i64Add($608$0,$608$1,$609$0,$609$1))|0);$610$1=tempRet0;
        $$etemp$16$0=1000000000;
        $$etemp$16$1=0;
        $611=(($610$1>>>0) > ($$etemp$16$1>>>0)) | (((($610$1>>>0) == ($$etemp$16$1>>>0) & ($610$0>>>0) >  ($$etemp$16$0>>>0))));
        $extract_t19_us_i$0=$610$0;
        $extract_t19_us_i=$extract_t19_us_i$0;
        if ($611) {
         $$etemp$17$0=1000000000;
         $$etemp$17$1=0;
         $613$0=((___udivdi3($610$0,$610$1,$$etemp$17$0,$$etemp$17$1))|0);$613$1=tempRet0;
         $614$0=$613$0;
         $614=$614$0;
         $$etemp$18$0=1000000000;
         $$etemp$18$1=0;
         $615$0=((___uremdi3($610$0,$610$1,$$etemp$18$0,$$etemp$18$1))|0);$615$1=tempRet0;
         $extract_t_us_i$0=$615$0;
         $extract_t_us_i=$extract_t_us_i$0;
         $carry1_1_us_i=$614;$_sink_off0_us_i=$extract_t_us_i;
        } else {
         $carry1_1_us_i=0;$_sink_off0_us_i=$extract_t19_us_i;
        }


        HEAP32[(($605)>>2)]=$_sink_off0_us_i;
        $617=((($z_2_us_i)+(127))|0);
        $618=$617&127;
        $619=($k_5_us_i|0)!=($618|0);
        $620=($k_5_us_i|0)==($a_2_ph40_i|0);
        $or_cond12_us_i=$619|$620;
        if ($or_cond12_us_i) {
         $z_3_us_i=$z_2_us_i;
        } else {
         $622=($_sink_off0_us_i|0)==0;
         $k_5_z_2_us_i=($622?$k_5_us_i:$z_2_us_i);
         $z_3_us_i=$k_5_z_2_us_i;
        }

        $624=((($k_5_us_i)-(1))|0);
        if ($620) {
         break;
        } else {
         $carry1_0_us_i=$carry1_1_us_i;$k_5_in_us_i=$624;$z_2_us_i=$z_3_us_i;
        }
       }
       $626=((($e2_0_us_i)-(29))|0);
       $627=($carry1_1_us_i|0)==0;
       if ($627) {
        $z_1_us_i=$z_3_us_i;$e2_0_us_i=$626;
       } else {
        $_lcssa43_i=$626;$z_3_lcssa_lcssa_i=$z_3_us_i;$carry1_1_lcssa_lcssa_i=$carry1_1_us_i;
        break;
       }
      }
     } else {
      $602=($rp_2_ph38_i|0)==18;
      if ($602) {
       $z_1_us45_i=$z_1_ph39_i;$e2_0_us44_i=$e2_0_ph_i;
      } else {
       $a_3_ph_i=$a_2_ph40_i;$z_5_ph_i=$z_1_ph39_i;$e2_1_ph_i=$e2_0_ph_i;$rp_3_ph33_i=$rp_2_ph38_i;
       break;
      }
      while(1) {


       $628=((HEAP32[(($601)>>2)])|0);
       $629=($628>>>0)<((9007199)>>>0);
       if (!($629)) {
        $a_3_ph_i=$a_2_ph40_i;$z_5_ph_i=$z_1_us45_i;$e2_1_ph_i=$e2_0_us44_i;$rp_3_ph33_i=18;
        break L280;
       }
       $630=((($z_1_us45_i)+(127))|0);
       $carry1_0_us49_i=0;$k_5_in_us48_i=$630;$z_2_us47_i=$z_1_us45_i;
       while(1) {



        $k_5_us50_i=$k_5_in_us48_i&127;
        $632=(($x_i+($k_5_us50_i<<2))|0);
        $633=((HEAP32[(($632)>>2)])|0);
        $634$0=$633;
        $634$1=0;
        $635$0=($634$0<<29)|(0>>>3);
        $635$1=($634$1<<29)|($634$0>>>3);
        $636$0=$carry1_0_us49_i;
        $636$1=0;
        $637$0=((_i64Add($635$0,$635$1,$636$0,$636$1))|0);$637$1=tempRet0;
        $$etemp$19$0=1000000000;
        $$etemp$19$1=0;
        $638=(($637$1>>>0) > ($$etemp$19$1>>>0)) | (((($637$1>>>0) == ($$etemp$19$1>>>0) & ($637$0>>>0) >  ($$etemp$19$0>>>0))));
        $extract_t19_us51_i$0=$637$0;
        $extract_t19_us51_i=$extract_t19_us51_i$0;
        if ($638) {
         $$etemp$20$0=1000000000;
         $$etemp$20$1=0;
         $640$0=((___udivdi3($637$0,$637$1,$$etemp$20$0,$$etemp$20$1))|0);$640$1=tempRet0;
         $641$0=$640$0;
         $641=$641$0;
         $$etemp$21$0=1000000000;
         $$etemp$21$1=0;
         $642$0=((___uremdi3($637$0,$637$1,$$etemp$21$0,$$etemp$21$1))|0);$642$1=tempRet0;
         $extract_t_us52_i$0=$642$0;
         $extract_t_us52_i=$extract_t_us52_i$0;
         $carry1_1_us54_i=$641;$_sink_off0_us53_i=$extract_t_us52_i;
        } else {
         $carry1_1_us54_i=0;$_sink_off0_us53_i=$extract_t19_us51_i;
        }


        HEAP32[(($632)>>2)]=$_sink_off0_us53_i;
        $644=((($z_2_us47_i)+(127))|0);
        $645=$644&127;
        $646=($k_5_us50_i|0)!=($645|0);
        $647=($k_5_us50_i|0)==($a_2_ph40_i|0);
        $or_cond12_us55_i=$646|$647;
        if ($or_cond12_us55_i) {
         $z_3_us57_i=$z_2_us47_i;
        } else {
         $649=($_sink_off0_us53_i|0)==0;
         $k_5_z_2_us56_i=($649?$k_5_us50_i:$z_2_us47_i);
         $z_3_us57_i=$k_5_z_2_us56_i;
        }

        $651=((($k_5_us50_i)-(1))|0);
        if ($647) {
         break;
        } else {
         $carry1_0_us49_i=$carry1_1_us54_i;$k_5_in_us48_i=$651;$z_2_us47_i=$z_3_us57_i;
        }
       }
       $653=((($e2_0_us44_i)-(29))|0);
       $654=($carry1_1_us54_i|0)==0;
       if ($654) {
        $z_1_us45_i=$z_3_us57_i;$e2_0_us44_i=$653;
       } else {
        $_lcssa43_i=$653;$z_3_lcssa_lcssa_i=$z_3_us57_i;$carry1_1_lcssa_lcssa_i=$carry1_1_us54_i;
        break;
       }
      }
     }



     $655=((($rp_2_ph38_i)+(9))|0);
     $656=((($a_2_ph40_i)+(127))|0);
     $657=$656&127;
     $658=($657|0)==($z_3_lcssa_lcssa_i|0);
     if ($658) {
      $660=((($z_3_lcssa_lcssa_i)+(127))|0);
      $661=$660&127;
      $662=(($x_i+($661<<2))|0);
      $663=((HEAP32[(($662)>>2)])|0);
      $664=((($z_3_lcssa_lcssa_i)+(126))|0);
      $665=$664&127;
      $666=(($x_i+($665<<2))|0);
      $667=((HEAP32[(($666)>>2)])|0);
      $668=$667|$663;
      HEAP32[(($666)>>2)]=$668;
      $z_4_i=$661;
     } else {
      $z_4_i=$z_3_lcssa_lcssa_i;
     }

     $670=(($x_i+($657<<2))|0);
     HEAP32[(($670)>>2)]=$carry1_1_lcssa_lcssa_i;
     $a_2_ph40_i=$657;$z_1_ph39_i=$z_4_i;$e2_0_ph_i=$_lcssa43_i;$rp_2_ph38_i=$655;
    }
    L311: while(1) {




     $713=((($z_5_ph_i)+(1))|0);
     $714=$713&127;
     $715=((($z_5_ph_i)+(127))|0);
     $716=$715&127;
     $717=(($x_i+($716<<2))|0);
     $a_3_i_ph=$a_3_ph_i;$e2_1_i_ph=$e2_1_ph_i;$rp_3_i_ph=$rp_3_ph33_i;
     while(1) {



      $718=($rp_3_i_ph|0)==18;
      $719=($rp_3_i_ph|0)>27;
      $_14_i=($719?9:1);
      $a_3_i=$a_3_i_ph;$e2_1_i=$e2_1_i_ph;
      while(1) {


       $i_025_i=0;
       while(1) {

        $674=((($i_025_i)+($a_3_i))|0);
        $675=$674&127;
        $676=($675|0)==($z_5_ph_i|0);
        if ($676) {
         $i_1_i=2;
         break;
        }
        $678=(($x_i+($675<<2))|0);
        $679=((HEAP32[(($678)>>2)])|0);
        $680=((32+($i_025_i<<2))|0);
        $681=((HEAP32[(($680)>>2)])|0);
        $682=($679>>>0)<($681>>>0);
        if ($682) {
         $i_1_i=2;
         break;
        }
        $684=($679>>>0)>($681>>>0);
        $685=((($i_025_i)+(1))|0);
        if ($684) {
         $i_1_i=$i_025_i;
         break;
        }
        $672=($685|0)<2;
        if ($672) {
         $i_025_i=$685;
        } else {
         $i_1_i=$685;
         break;
        }
       }

       $687=($i_1_i|0)==2;
       $or_cond13_i=$687&$718;
       if ($or_cond13_i) {
        break L311;
       }
       $691=((($_14_i)+($e2_1_i))|0);
       $692=($a_3_i|0)==($z_5_ph_i|0);
       if ($692) {
        $a_3_i=$z_5_ph_i;$e2_1_i=$691;
       } else {
        break;
       }
      }
      $693=1<<$_14_i;
      $694=((($693)-(1))|0);
      $695=1000000000>>>($_14_i>>>0);
      $rp_426_i=$rp_3_i_ph;$a_427_i=$a_3_i;$k_628_i=$a_3_i;$carry3_030_i=0;
      while(1) {




       $696=(($x_i+($k_628_i<<2))|0);
       $697=((HEAP32[(($696)>>2)])|0);
       $698=$697&$694;
       $699=$697>>>($_14_i>>>0);
       $700=((($699)+($carry3_030_i))|0);
       HEAP32[(($696)>>2)]=$700;
       $701=(Math_imul($698,$695)|0);
       $702=($k_628_i|0)==($a_427_i|0);
       $703=($700|0)==0;
       $or_cond15_i=$702&$703;
       $704=((($k_628_i)+(1))|0);
       $705=$704&127;
       $706=((($rp_426_i)-(9))|0);
       $rp_5_i=($or_cond15_i?$706:$rp_426_i);
       $a_5_i=($or_cond15_i?$705:$a_427_i);
       $707=($705|0)==($z_5_ph_i|0);
       if ($707) {
        break;
       } else {
        $rp_426_i=$rp_5_i;$a_427_i=$a_5_i;$k_628_i=$705;$carry3_030_i=$701;
       }
      }
      $708=($701|0)==0;
      if ($708) {
       $a_3_i_ph=$a_5_i;$e2_1_i_ph=$691;$rp_3_i_ph=$rp_5_i;
       continue;
      }
      $710=($714|0)==($a_5_i|0);
      if (!($710)) {
       break;
      }
      $721=((HEAP32[(($717)>>2)])|0);
      $722=$721|1;
      HEAP32[(($717)>>2)]=$722;
      $a_3_i_ph=$a_5_i;$e2_1_i_ph=$691;$rp_3_i_ph=$rp_5_i;
     }
     $712=(($x_i+($z_5_ph_i<<2))|0);
     HEAP32[(($712)>>2)]=$701;
     $a_3_ph_i=$a_5_i;$z_5_ph_i=$714;$e2_1_ph_i=$691;$rp_3_ph33_i=$rp_5_i;
    }
    $688=$a_3_i&127;
    $689=($688|0)==($z_5_ph_i|0);
    if ($689) {
     $724=((($714)-(1))|0);
     $725=(($x_i+($724<<2))|0);
     HEAP32[(($725)>>2)]=0;
     $z_7_i=$714;
    } else {
     $z_7_i=$z_5_ph_i;
    }

    $727=(($x_i+($688<<2))|0);
    $728=((HEAP32[(($727)>>2)])|0);
    $729=(+((($728>>>0))>>>0));
    $730=((($a_3_i)+(1))|0);
    $731=$730&127;
    $732=($731|0)==($z_7_i|0);
    if ($732) {
     $811=((($z_7_i)+(1))|0);
     $812=$811&127;
     $813=((($812)-(1))|0);
     $814=(($x_i+($813<<2))|0);
     HEAP32[(($814)>>2)]=0;
     $z_7_1_i=$812;
    } else {
     $z_7_1_i=$z_7_i;
    }

    $816=($729)*((1000000000.0));
    $817=(($x_i+($731<<2))|0);
    $818=((HEAP32[(($817)>>2)])|0);
    $819=(+((($818>>>0))>>>0));
    $820=($816)+($819);
    $821=(+((($sign_0|0))|0));
    $822=($821)*($820);
    $823=((($e2_1_i)+(53))|0);
    $824=((($823)-($emin_0_ph))|0);
    $825=($824|0)<($bits_0_ph|0);
    if ($825) {
     $734=($824|0)<0;
     $__i22=($734?0:$824);
     $_09_i=$__i22;$denormal_0_i=1;
    } else {
     $_09_i=$bits_0_ph;$denormal_0_i=0;
    }


    $736=($_09_i|0)<53;
    if ($736) {
     $738=(((105)-($_09_i))|0);
     $739=(+(_scalbn(1.0,$738)));
     $740=(+(_copysign((+($739)),(+($822)))));
     $741=(((53)-($_09_i))|0);
     $742=(+(_scalbn(1.0,$741)));
     $743=(+(_fmod((+($822)),(+($742)))));
     $744=($822)-($743);
     $745=($740)+($744);
     $bias_0_i=$740;$frac_0_i=$743;$y_1_i23=$745;
    } else {
     $bias_0_i=0.0;$frac_0_i=0.0;$y_1_i23=$822;
    }



    $747=((($a_3_i)+(2))|0);
    $748=$747&127;
    $749=($748|0)==($z_7_1_i|0);
    if ($749) {
     $frac_2_i=$frac_0_i;
    } else {
     $751=(($x_i+($748<<2))|0);
     $752=((HEAP32[(($751)>>2)])|0);
     $753=($752>>>0)<((500000000)>>>0);
     do {
      if ($753) {
       $755=($752|0)==0;
       if ($755) {
        $757=((($a_3_i)+(3))|0);
        $758=$757&127;
        $759=($758|0)==($z_7_1_i|0);
        if ($759) {
         $frac_1_i=$frac_0_i;
         break;
        }
       }
       $761=($821)*((0.25));
       $762=($761)+($frac_0_i);
       $frac_1_i=$762;
      } else {
       $764=($752>>>0)>((500000000)>>>0);
       if ($764) {
        $766=($821)*((0.75));
        $767=($766)+($frac_0_i);
        $frac_1_i=$767;
        break;
       }
       $769=((($a_3_i)+(3))|0);
       $770=$769&127;
       $771=($770|0)==($z_7_1_i|0);
       if ($771) {
        $773=($821)*((0.5));
        $774=($773)+($frac_0_i);
        $frac_1_i=$774;
        break;
       } else {
        $776=($821)*((0.75));
        $777=($776)+($frac_0_i);
        $frac_1_i=$777;
        break;
       }
      }
     } while(0);

     $779=(((53)-($_09_i))|0);
     $780=($779|0)>1;
     if ($780) {
      $782=(+(_fmod((+($frac_1_i)),1.0)));
      $783=$782!=(0.0);
      if ($783) {
       $frac_2_i=$frac_1_i;
      } else {
       $785=($frac_1_i)+((1.0));
       $frac_2_i=$785;
      }
     } else {
      $frac_2_i=$frac_1_i;
     }
    }

    $787=($y_1_i23)+($frac_2_i);
    $788=($787)-($bias_0_i);
    $789=$823&2147483647;
    $790=(((-2)-($sum_i))|0);
    $791=($789|0)>($790|0);
    do {
     if ($791) {
      $793=(+(Math_abs((+($788)))));
      $794=$793<(9007199254740992.0);
      if ($794) {
       $y_2_i24=$788;$denormal_2_i=$denormal_0_i;$e2_2_i=$e2_1_i;
      } else {
       $796=($denormal_0_i|0)!=0;
       $797=($_09_i|0)==($824|0);
       $or_cond16_i=$796&$797;
       $denormal_1_i=($or_cond16_i?0:$denormal_0_i);
       $798=($788)*((0.5));
       $799=((($e2_1_i)+(1))|0);
       $y_2_i24=$798;$denormal_2_i=$denormal_1_i;$e2_2_i=$799;
      }



      $801=((($e2_2_i)+(50))|0);
      $802=($801|0)>($380|0);
      if (!($802)) {
       $804=($denormal_2_i|0)!=0;
       $805=$frac_2_i!=(0.0);
       $or_cond17_i=$804&$805;
       if (!($or_cond17_i)) {
        $y_3_i=$y_2_i24;$e2_3_i=$e2_2_i;
        break;
       }
      }
      $807=((___errno_location())|0);
      HEAP32[(($807)>>2)]=34;
      $y_3_i=$y_2_i24;$e2_3_i=$e2_2_i;
     } else {
      $y_3_i=$788;$e2_3_i=$e2_1_i;
     }
    } while(0);


    $809=(+(_scalbnl($y_3_i,$e2_3_i)));
    $_0=$809;

    STACKTOP=sp;return (+($_0));
   } else if (((($i_3|0))|0)==((3)|0)) {
    $98=((HEAP32[(($3)>>2)])|0);
    $99=((HEAP32[(($4)>>2)])|0);
    $100=($98>>>0)<($99>>>0);
    if ($100) {
     $102=(($98+1)|0);
     HEAP32[(($3)>>2)]=$102;
     $103=((HEAP8[($98)])|0);
     $104=($103&255);
     $108=$104;
    } else {
     $106=((___shgetc($f))|0);
     $108=$106;
    }

    $109=($108|0)==40;
    if ($109) {
     $i_4=1;
    } else {
     $111=((HEAP32[(($4)>>2)])|0);
     $112=($111|0)==0;
     if ($112) {
      $_0=NaN;

      STACKTOP=sp;return (+($_0));
     }
     $114=((HEAP32[(($3)>>2)])|0);
     $115=((($114)-(1))|0);
     HEAP32[(($3)>>2)]=$115;
     $_0=NaN;

     STACKTOP=sp;return (+($_0));
    }
    while(1) {

     $116=((HEAP32[(($3)>>2)])|0);
     $117=((HEAP32[(($4)>>2)])|0);
     $118=($116>>>0)<($117>>>0);
     if ($118) {
      $120=(($116+1)|0);
      HEAP32[(($3)>>2)]=$120;
      $121=((HEAP8[($116)])|0);
      $122=($121&255);
      $126=$122;
     } else {
      $124=((___shgetc($f))|0);
      $126=$124;
     }

     $127=((($126)-(48))|0);
     $128=($127>>>0)<((10)>>>0);
     $129=((($126)-(65))|0);
     $130=($129>>>0)<((26)>>>0);
     $or_cond8=$128|$130;
     if (!($or_cond8)) {
      $132=((($126)-(97))|0);
      $133=($132>>>0)<((26)>>>0);
      $134=($126|0)==95;
      $or_cond5=$133|$134;
      if (!($or_cond5)) {
       break;
      }
     }
     $152=((($i_4)+(1))|0);
     $i_4=$152;
    }
    $136=($126|0)==41;
    if ($136) {
     $_0=NaN;

     STACKTOP=sp;return (+($_0));
    }
    $138=((HEAP32[(($4)>>2)])|0);
    $139=($138|0)==0;
    if (!($139)) {
     $141=((HEAP32[(($3)>>2)])|0);
     $142=((($141)-(1))|0);
     HEAP32[(($3)>>2)]=$142;
    }
    if ($58) {
     $146=((___errno_location())|0);
     HEAP32[(($146)>>2)]=22;
     ___shlim($f,0);
     $_0=0.0;

     STACKTOP=sp;return (+($_0));
    }
    $144=($i_4|0)==0;
    $brmerge107=$144|$139;
    if ($brmerge107) {
     $_0=NaN;

     STACKTOP=sp;return (+($_0));
    } else {
     $_in=$i_4;
    }
    while(1) {

     $147=((($_in)-(1))|0);
     $148=((HEAP32[(($3)>>2)])|0);
     $149=((($148)-(1))|0);
     HEAP32[(($3)>>2)]=$149;
     $150=($147|0)==0;
     if ($150) {
      $_0=NaN;
      break;
     } else {
      $_in=$147;
     }
    }

    STACKTOP=sp;return (+($_0));
   } else {
    $154=((HEAP32[(($4)>>2)])|0);
    $155=($154|0)==0;
    if (!($155)) {
     $157=((HEAP32[(($3)>>2)])|0);
     $158=((($157)-(1))|0);
     HEAP32[(($3)>>2)]=$158;
    }
    $160=((___errno_location())|0);
    HEAP32[(($160)>>2)]=22;
    ___shlim($f,0);
    $_0=0.0;

    STACKTOP=sp;return (+($_0));
   }
  }
 } while(0);
 if ((label|0) == 23) {
  $61=((HEAP32[(($4)>>2)])|0);
  $62=($61|0)==0;
  if (!($62)) {
   $64=((HEAP32[(($3)>>2)])|0);
   $65=((($64)-(1))|0);
   HEAP32[(($3)>>2)]=$65;
  }
  $notlhs=($pok|0)==0;
  $notrhs=($i_0_lcssa>>>0)<((4)>>>0);
  $or_cond106_not=$notrhs|$notlhs;
  $brmerge=$or_cond106_not|$62;
  if (!($brmerge)) {
   $i_166=$i_0_lcssa;
   while(1) {

    $68=((HEAP32[(($3)>>2)])|0);
    $69=((($68)-(1))|0);
    HEAP32[(($3)>>2)]=$69;
    $70=((($i_166)-(1))|0);
    $71=($70>>>0)>((3)>>>0);
    if ($71) {
     $i_166=$70;
    } else {
     break;
    }
   }
  }
 }
 $72=(+((($sign_0|0))|0));
 $73=($72)*(Infinity);
 $74=$73;
 $_0=$74;

 STACKTOP=sp;return (+($_0));
}


function _scanexp($f,$pok){
 $f=($f)|0;
 $pok=($pok)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$7=0,$8=0,$9=0,$11=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$20=0,$21=0,$22=0,$24=0,$26=0;
 var $27=0,$28=0,$29=0,$or_cond=0,$31=0,$32=0,$34=0,$35=0,$c_0=0,$neg_0=0,$37=0,$38=0,$40=0,$41=0,$43=0,$44=0,$x_09=0,$c_18=0,$45=0,$46=0;
 var $47=0,$48=0,$49=0,$51=0,$52=0,$53=0,$55=0,$c_1_be=0,$56=0,$57=0,$58=0,$_=0,$phitmp16=0,$phitmp$0=0,$phitmp$1=0,$60=0,$61=0,$y_0_lcssa$0=0,$y_0_lcssa$1=0,$c_2_lcssa=0;
 var $62=0,$63=0,$y_04$0=0,$y_04$1=0,$c_23=0,$$etemp$0$0=0,$$etemp$0$1=0,$65$0=0,$65$1=0,$$etemp$1$0=0,$$etemp$1$1=0,$68=0,$69=0,$70=0,$72=0,$73=0,$74=0,$76=0,$c_2_be=0,$77=0;
 var $78=0,$$etemp$2$0=0,$$etemp$2$1=0,$79=0,$or_cond2=0,$80=0,$81=0,$82=0,$84=0,$85=0,$86=0,$88=0,$c_3_be=0,$89=0,$90=0,$91=0,$92=0,$94=0,$95=0,$97=0;
 var $$etemp$3$0=0,$$etemp$3$1=0,$99$0=0,$99$1=0,$_0$0=0,$_0$1=0,$64$0=0,$64$1=0,$66$0=0,$66$1=0,$67$0=0,$67$1=0,$98$0=0,$98$1=0,label=0;

 $1=(($f+4)|0);
 $2=((HEAP32[(($1)>>2)])|0);
 $3=(($f+100)|0);
 $4=((HEAP32[(($3)>>2)])|0);
 $5=($2>>>0)<($4>>>0);
 if ($5) {
  $7=(($2+1)|0);
  HEAP32[(($1)>>2)]=$7;
  $8=((HEAP8[($2)])|0);
  $9=($8&255);
  $13=$9;
 } else {
  $11=((___shgetc($f))|0);
  $13=$11;
 }

 $14=($13|0)==45;
 if (((($13|0))|0)==((45)|0)|((($13|0))|0)==((43)|0)) {
  $15=($14&1);
  $16=((HEAP32[(($1)>>2)])|0);
  $17=((HEAP32[(($3)>>2)])|0);
  $18=($16>>>0)<($17>>>0);
  if ($18) {
   $20=(($16+1)|0);
   HEAP32[(($1)>>2)]=$20;
   $21=((HEAP8[($16)])|0);
   $22=($21&255);
   $26=$22;
  } else {
   $24=((___shgetc($f))|0);
   $26=$24;
  }

  $27=((($26)-(48))|0);
  $28=($27>>>0)<((10)>>>0);
  $29=($pok|0)==0;
  $or_cond=$28|$29;
  if ($or_cond) {
   $neg_0=$15;$c_0=$26;
  } else {
   $31=((HEAP32[(($3)>>2)])|0);
   $32=($31|0)==0;
   if ($32) {
    $neg_0=$15;$c_0=$26;
   } else {
    $34=((HEAP32[(($1)>>2)])|0);
    $35=((($34)-(1))|0);
    HEAP32[(($1)>>2)]=$35;
    $neg_0=$15;$c_0=$26;
   }
  }
 } else {
  $neg_0=0;$c_0=$13;
 }


 $37=((($c_0)-(48))|0);
 $38=($37>>>0)>((9)>>>0);
 if ($38) {
  $40=((HEAP32[(($3)>>2)])|0);
  $41=($40|0)==0;
  if ($41) {
   $_0$1=-2147483648;$_0$0=0;


   return (((tempRet0=$_0$1,$_0$0))|0);
  }
  $43=((HEAP32[(($1)>>2)])|0);
  $44=((($43)-(1))|0);
  HEAP32[(($1)>>2)]=$44;
  $_0$1=-2147483648;$_0$0=0;


  return (((tempRet0=$_0$1,$_0$0))|0);
 } else {
  $c_18=$c_0;$x_09=0;
 }
 while(1) {


  $45=((($c_18)-(48))|0);
  $46=((($45)+($x_09))|0);
  $47=((HEAP32[(($1)>>2)])|0);
  $48=((HEAP32[(($3)>>2)])|0);
  $49=($47>>>0)<($48>>>0);
  if ($49) {
   $51=(($47+1)|0);
   HEAP32[(($1)>>2)]=$51;
   $52=((HEAP8[($47)])|0);
   $53=($52&255);
   $c_1_be=$53;
  } else {
   $55=((___shgetc($f))|0);
   $c_1_be=$55;
  }

  $56=((($c_1_be)-(48))|0);
  $57=($56>>>0)<((10)>>>0);
  $58=($46|0)<214748364;
  $_=$57&$58;
  if (!($_)) {
   break;
  }
  $phitmp16=((($46)*(10))&-1);
  $c_18=$c_1_be;$x_09=$phitmp16;
 }
 $phitmp$0=$46;
 $phitmp$1=((((($46|0)<0))|0)?-1:0);
 $60=((($c_1_be)-(48))|0);
 $61=($60>>>0)<((10)>>>0);
 if ($61) {
  $c_23=$c_1_be;$y_04$1=$phitmp$1;$y_04$0=$phitmp$0;
  while(1) {



   $$etemp$0$0=10;
   $$etemp$0$1=0;
   $64$0=((___muldi3($y_04$0,$y_04$1,$$etemp$0$0,$$etemp$0$1))|0);$64$1=tempRet0;
   $65$0=$c_23;
   $65$1=((((($c_23|0)<0))|0)?-1:0);
   $$etemp$1$0=-48;
   $$etemp$1$1=-1;
   $66$0=((_i64Add($65$0,$65$1,$$etemp$1$0,$$etemp$1$1))|0);$66$1=tempRet0;
   $67$0=((_i64Add($66$0,$66$1,$64$0,$64$1))|0);$67$1=tempRet0;
   $68=((HEAP32[(($1)>>2)])|0);
   $69=((HEAP32[(($3)>>2)])|0);
   $70=($68>>>0)<($69>>>0);
   if ($70) {
    $72=(($68+1)|0);
    HEAP32[(($1)>>2)]=$72;
    $73=((HEAP8[($68)])|0);
    $74=($73&255);
    $c_2_be=$74;
   } else {
    $76=((___shgetc($f))|0);
    $c_2_be=$76;
   }

   $77=((($c_2_be)-(48))|0);
   $78=($77>>>0)<((10)>>>0);
   $$etemp$2$0=2061584302;
   $$etemp$2$1=21474836;
   $79=(($67$1|0) < ($$etemp$2$1|0)) | (((($67$1|0) == ($$etemp$2$1|0) & ($67$0>>>0) <  ($$etemp$2$0>>>0))));
   $or_cond2=$78&$79;
   if ($or_cond2) {
    $c_23=$c_2_be;$y_04$1=$67$1;$y_04$0=$67$0;
   } else {
    $c_2_lcssa=$c_2_be;$y_0_lcssa$1=$67$1;$y_0_lcssa$0=$67$0;
    break;
   }
  }
 } else {
  $c_2_lcssa=$c_1_be;$y_0_lcssa$1=$phitmp$1;$y_0_lcssa$0=$phitmp$0;
 }



 $62=((($c_2_lcssa)-(48))|0);
 $63=($62>>>0)<((10)>>>0);
 if ($63) {
  while(1) {
   $80=((HEAP32[(($1)>>2)])|0);
   $81=((HEAP32[(($3)>>2)])|0);
   $82=($80>>>0)<($81>>>0);
   if ($82) {
    $84=(($80+1)|0);
    HEAP32[(($1)>>2)]=$84;
    $85=((HEAP8[($80)])|0);
    $86=($85&255);
    $c_3_be=$86;
   } else {
    $88=((___shgetc($f))|0);
    $c_3_be=$88;
   }

   $89=((($c_3_be)-(48))|0);
   $90=($89>>>0)<((10)>>>0);
   if (!($90)) {
    break;
   }
  }
 }
 $91=((HEAP32[(($3)>>2)])|0);
 $92=($91|0)==0;
 if (!($92)) {
  $94=((HEAP32[(($1)>>2)])|0);
  $95=((($94)-(1))|0);
  HEAP32[(($1)>>2)]=$95;
 }
 $97=($neg_0|0)!=0;
 $$etemp$3$0=0;
 $$etemp$3$1=0;
 $98$0=((_i64Subtract($$etemp$3$0,$$etemp$3$1,$y_0_lcssa$0,$y_0_lcssa$1))|0);$98$1=tempRet0;
 $99$0=($97?$98$0:$y_0_lcssa$0);
 $99$1=($97?$98$1:$y_0_lcssa$1);
 $_0$1=$99$1;$_0$0=$99$0;


 return (((tempRet0=$_0$1,$_0$0))|0);
}


function ___shlim($f,$lim){
 $f=($f)|0;
 $lim=($lim)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$or_cond=0,$13=0,$14=0,$16=0,label=0;

 $1=(($f+104)|0);
 HEAP32[(($1)>>2)]=$lim;
 $2=(($f+8)|0);
 $3=((HEAP32[(($2)>>2)])|0);
 $4=(($f+4)|0);
 $5=((HEAP32[(($4)>>2)])|0);
 $6=$3;
 $7=$5;
 $8=((($6)-($7))|0);
 $9=(($f+108)|0);
 HEAP32[(($9)>>2)]=$8;
 $10=($lim|0)!=0;
 $11=($8|0)>($lim|0);
 $or_cond=$10&$11;
 if ($or_cond) {
  $13=(($5+$lim)|0);
  $14=(($f+100)|0);
  HEAP32[(($14)>>2)]=$13;
  return;
 } else {
  $16=(($f+100)|0);
  HEAP32[(($16)>>2)]=$3;
  return;
 }
}


function ___shgetc($f){
 $f=($f)|0;
 var $1=0,$2=0,$3=0,$5=0,$6=0,$7=0,$9=0,$10=0,$12=0,$14=0,$15=0,$_phi_trans_insert=0,$_pre=0,$17=0,$18=0,$19=0,$20=0,$21=0,$22=0,$23=0;
 var $24=0,$25=0,$26=0,$28=0,$29=0,$30=0,$32=0,$_phi_trans_insert2=0,$_pre3=0,$34=0,$35=0,$36=0,$37=0,$38=0,$39=0,$40=0,$41=0,$42=0,$43=0,$44=0;
 var $46=0,$_0=0,label=0;

 $1=(($f+104)|0);
 $2=((HEAP32[(($1)>>2)])|0);
 $3=($2|0)==0;
 if ($3) {
  label = 3;
 } else {
  $5=(($f+108)|0);
  $6=((HEAP32[(($5)>>2)])|0);
  $7=($6|0)<($2|0);
  if ($7) {
   label = 3;
  }
 }
 if ((label|0) == 3) {
  $9=((___uflow($f))|0);
  $10=($9|0)<0;
  if (!($10)) {
   $14=((HEAP32[(($1)>>2)])|0);
   $15=($14|0)==0;
   $_phi_trans_insert=(($f+8)|0);
   $_pre=((HEAP32[(($_phi_trans_insert)>>2)])|0);
   if ($15) {
    label = 8;
   } else {
    $17=(($f+4)|0);
    $18=((HEAP32[(($17)>>2)])|0);
    $19=$_pre;
    $20=$18;
    $21=((($19)-($20))|0);
    $22=(($f+108)|0);
    $23=((HEAP32[(($22)>>2)])|0);
    $24=((($14)-($23))|0);
    $25=((($24)-(1))|0);
    $26=($21|0)>($25|0);
    if ($26) {
     $28=(($18+$25)|0);
     $29=(($f+100)|0);
     HEAP32[(($29)>>2)]=$28;
    } else {
     label = 8;
    }
   }
   if ((label|0) == 8) {
    $30=(($f+100)|0);
    HEAP32[(($30)>>2)]=$_pre;
   }
   $32=($_pre|0)==0;
   $_phi_trans_insert2=(($f+4)|0);
   $_pre3=((HEAP32[(($_phi_trans_insert2)>>2)])|0);
   if (!($32)) {
    $34=$_pre;
    $35=$_pre3;
    $36=(($f+108)|0);
    $37=((HEAP32[(($36)>>2)])|0);
    $38=((($34)+(1))|0);
    $39=((($38)-($35))|0);
    $40=((($39)+($37))|0);
    HEAP32[(($36)>>2)]=$40;
   }
   $41=((($_pre3)-(1))|0);
   $42=((HEAP8[($41)])|0);
   $43=($42&255);
   $44=($43|0)==($9|0);
   if ($44) {
    $_0=$9;

    return (($_0)|0);
   }
   $46=(($9)&255);
   HEAP8[($41)]=$46;
   $_0=$9;

   return (($_0)|0);
  }
 }
 $12=(($f+100)|0);
 HEAP32[(($12)>>2)]=0;
 $_0=-1;

 return (($_0)|0);
}


function _scalbn($x,$n){
 $x=+($x);
 $n=($n)|0;
 var $1=0,$3=.0,$4=0,$5=0,$7=.0,$8=0,$9=0,$_=0,$11=0,$13=.0,$14=0,$15=0,$17=.0,$18=0,$19=0,$_1=0,$_0=0,$y_0=.0,$21=0,$22$0=0;
 var $22$1=0,$23$0=0,$23$1=0,$24=.0,$25=.0,label=0;

 $1=($n|0)>1023;
 if ($1) {
  $3=($x)*((8.98846567431158e+307));
  $4=((($n)-(1023))|0);
  $5=($4|0)>1023;
  if ($5) {
   $7=($3)*((8.98846567431158e+307));
   $8=((($n)-(2046))|0);
   $9=($8|0)>1023;
   $_=($9?1023:$8);
   $y_0=$7;$_0=$_;
  } else {
   $y_0=$3;$_0=$4;
  }
 } else {
  $11=($n|0)<-1022;
  if ($11) {
   $13=($x)*((2.2250738585072014e-308));
   $14=((($n)+(1022))|0);
   $15=($14|0)<-1022;
   if ($15) {
    $17=($13)*((2.2250738585072014e-308));
    $18=((($n)+(2044))|0);
    $19=($18|0)<-1022;
    $_1=($19?-1022:$18);
    $y_0=$17;$_0=$_1;
   } else {
    $y_0=$13;$_0=$14;
   }
  } else {
   $y_0=$x;$_0=$n;
  }
 }


 $21=((($_0)+(1023))|0);
 $22$0=$21;
 $22$1=0;
 $23$0=(0<<20)|(0>>>12);
 $23$1=($22$0<<20)|(0>>>12);
 $24=(HEAP32[((tempDoublePtr)>>2)]=$23$0, HEAP32[(((tempDoublePtr)+(4))>>2)]=$23$1, (+(HEAPF64[(tempDoublePtr)>>3])));
 $25=($y_0)*($24);
 return (+($25));
}


function _scalbnl($x,$n){
 $x=+($x);
 $n=($n)|0;
 var $1=.0,label=0;

 $1=(+(_scalbn($x,$n)));
 return (+($1));
}


function ___overflow($f,$_c){
 $f=($f)|0;
 $_c=($_c)|0;
 var $c=0,$1=0,$2=0,$3=0,$4=0,$6=0,$7=0,$_pre=0,$9=0,$10=0,$11=0,$12=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$21=0,$23=0;
 var $24=0,$25=0,$26=0,$28=0,$29=0,$_0=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+8)|0;
 $c=((sp)|0);
 $1=(($_c)&255);
 HEAP8[($c)]=$1;
 $2=(($f+16)|0);
 $3=((HEAP32[(($2)>>2)])|0);
 $4=($3|0)==0;
 do {
  if ($4) {
   $6=((___towrite($f))|0);
   $7=($6|0)==0;
   if ($7) {
    $_pre=((HEAP32[(($2)>>2)])|0);
    $9=$_pre;
    break;
   } else {
    $_0=-1;

    STACKTOP=sp;return (($_0)|0);
   }
  } else {
   $9=$3;
  }
 } while(0);

 $10=(($f+20)|0);
 $11=((HEAP32[(($10)>>2)])|0);
 $12=($11>>>0)<($9>>>0);
 if ($12) {
  $14=((HEAP8[($c)])|0);
  $15=($14&255);
  $16=(($f+75)|0);
  $17=((HEAP8[($16)])|0);
  $18=(($17<<24)>>24);
  $19=($15|0)==($18|0);
  if (!($19)) {
   $21=(($11+1)|0);
   HEAP32[(($10)>>2)]=$21;
   HEAP8[($11)]=$14;
   $_0=$15;

   STACKTOP=sp;return (($_0)|0);
  }
 }
 $23=(($f+36)|0);
 $24=((HEAP32[(($23)>>2)])|0);
 $25=((FUNCTION_TABLE_iiii[($24)&1]($f,$c,1))|0);
 $26=($25|0)==1;
 if (!($26)) {
  $_0=-1;

  STACKTOP=sp;return (($_0)|0);
 }
 $28=((HEAP8[($c)])|0);
 $29=($28&255);
 $_0=$29;

 STACKTOP=sp;return (($_0)|0);
}


function ___toread($f){
 $f=($f)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$9=0,$11=0,$12=0,$13=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0,$22=0,$23=0;
 var $25=0,$27=0,$28=0,$29=0,$_0=0,label=0;

 $1=(($f+74)|0);
 $2=((HEAP8[($1)])|0);
 $3=((($2)-(1))&255);
 $4=$3|$2;
 HEAP8[($1)]=$4;
 $5=(($f+20)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=(($f+44)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=($6>>>0)>($8>>>0);
 if ($9) {
  $11=(($f+36)|0);
  $12=((HEAP32[(($11)>>2)])|0);
  $13=((FUNCTION_TABLE_iiii[($12)&1]($f,0,0))|0);
 }
 $15=(($f+16)|0);
 HEAP32[(($15)>>2)]=0;
 $16=(($f+28)|0);
 HEAP32[(($16)>>2)]=0;
 HEAP32[(($5)>>2)]=0;
 $17=(($f)|0);
 $18=((HEAP32[(($17)>>2)])|0);
 $19=$18&20;
 $20=($19|0)==0;
 if ($20) {
  $27=((HEAP32[(($7)>>2)])|0);
  $28=(($f+8)|0);
  HEAP32[(($28)>>2)]=$27;
  $29=(($f+4)|0);
  HEAP32[(($29)>>2)]=$27;
  $_0=0;

  return (($_0)|0);
 }
 $22=$18&4;
 $23=($22|0)==0;
 if ($23) {
  $_0=-1;

  return (($_0)|0);
 }
 $25=$18|32;
 HEAP32[(($17)>>2)]=$25;
 $_0=-1;

 return (($_0)|0);
}


function ___towrite($f){
 $f=($f)|0;
 var $1=0,$2=0,$3=0,$4=0,$5=0,$6=0,$7=0,$8=0,$10=0,$12=0,$13=0,$14=0,$15=0,$16=0,$17=0,$18=0,$19=0,$20=0,$21=0,$_0=0;
 var label=0;

 $1=(($f+74)|0);
 $2=((HEAP8[($1)])|0);
 $3=((($2)-(1))&255);
 $4=$3|$2;
 HEAP8[($1)]=$4;
 $5=(($f)|0);
 $6=((HEAP32[(($5)>>2)])|0);
 $7=$6&8;
 $8=($7|0)==0;
 if ($8) {
  $12=(($f+8)|0);
  HEAP32[(($12)>>2)]=0;
  $13=(($f+4)|0);
  HEAP32[(($13)>>2)]=0;
  $14=(($f+44)|0);
  $15=((HEAP32[(($14)>>2)])|0);
  $16=(($f+28)|0);
  HEAP32[(($16)>>2)]=$15;
  $17=(($f+20)|0);
  HEAP32[(($17)>>2)]=$15;
  $18=(($f+48)|0);
  $19=((HEAP32[(($18)>>2)])|0);
  $20=(($15+$19)|0);
  $21=(($f+16)|0);
  HEAP32[(($21)>>2)]=$20;
  $_0=0;

  return (($_0)|0);
 } else {
  $10=$6|32;
  HEAP32[(($5)>>2)]=$10;
  $_0=-1;

  return (($_0)|0);
 }
  return 0;
}


function ___uflow($f){
 $f=($f)|0;
 var $c=0,$1=0,$2=0,$3=0,$5=0,$6=0,$8=0,$9=0,$10=0,$11=0,$13=0,$14=0,$_0=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+8)|0;
 $c=((sp)|0);
 $1=(($f+8)|0);
 $2=((HEAP32[(($1)>>2)])|0);
 $3=($2|0)==0;
 if ($3) {
  $5=((___toread($f))|0);
  $6=($5|0)==0;
  if ($6) {
   label = 3;
  } else {
   $_0=-1;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $8=(($f+32)|0);
  $9=((HEAP32[(($8)>>2)])|0);
  $10=((FUNCTION_TABLE_iiii[($9)&1]($f,$c,1))|0);
  $11=($10|0)==1;
  if ($11) {
   $13=((HEAP8[($c)])|0);
   $14=($13&255);
   $_0=$14;
  } else {
   $_0=-1;
  }
 }

 STACKTOP=sp;return (($_0)|0);
}


function _atof($s){
 $s=($s)|0;
 var $1=.0,label=0;

 $1=(+(_strtod($s,0)));
 return (+($1));
}


function _atoi($s){
 $s=($s)|0;
 var $_0=0,$2=0,$3=0,$4=0,$5=0,$6=0,$8=0,$9=0,$neg_0=0,$_pre=0,$12=0,$_1_ph=0,$neg_1_ph=0,$13=0,$14=0,$15=0,$n_03=0,$_12=0,$16=0,$17=0;
 var $18=0,$19=0,$_neg1=0,$20=0,$21=0,$22=0,$23=0,$24=0,$n_0_lcssa=0,$25=0,$26=0,$27=0,label=0;

 $_0=$s;
 while(1) {

  $2=((HEAP8[($_0)])|0);
  $3=(($2<<24)>>24);
  $4=((_isspace((($3)|0)))|0);
  $5=($4|0)==0;
  $6=(($_0+1)|0);
  if ($5) {
   break;
  } else {
   $_0=$6;
  }
 }
 $8=((HEAP8[($_0)])|0);
 $9=(($8<<24)>>24);
 if (((($9|0))|0)==((43)|0)) {
  $neg_0=0;
  label = 5;
 } else if (((($9|0))|0)==((45)|0)) {
  $neg_0=1;
  label = 5;
 } else {
  $neg_1_ph=0;$_1_ph=$_0;$12=$8;
 }
 if ((label|0) == 5) {

  $_pre=((HEAP8[($6)])|0);
  $neg_1_ph=$neg_0;$_1_ph=$6;$12=$_pre;
 }



 $13=(($12<<24)>>24);
 $14=((_isdigit((($13)|0)))|0);
 $15=($14|0)==0;
 if ($15) {
  $n_0_lcssa=0;

  $25=($neg_1_ph|0)!=0;
  $26=(((-$n_0_lcssa))|0);
  $27=($25?$n_0_lcssa:$26);
  return (($27)|0);
 } else {
  $_12=$_1_ph;$n_03=0;
 }
 while(1) {


  $16=((($n_03)*(10))&-1);
  $17=(($_12+1)|0);
  $18=((HEAP8[($_12)])|0);
  $19=(($18<<24)>>24);
  $_neg1=((($16)+(48))|0);
  $20=((($_neg1)-($19))|0);
  $21=((HEAP8[($17)])|0);
  $22=(($21<<24)>>24);
  $23=((_isdigit((($22)|0)))|0);
  $24=($23|0)==0;
  if ($24) {
   $n_0_lcssa=$20;
   break;
  } else {
   $_12=$17;$n_03=$20;
  }
 }

 $25=($neg_1_ph|0)!=0;
 $26=(((-$n_0_lcssa))|0);
 $27=($25?$n_0_lcssa:$26);
 return (($27)|0);
}


function _atol($s){
 $s=($s)|0;
 var $_0=0,$2=0,$3=0,$4=0,$5=0,$6=0,$8=0,$9=0,$neg_0=0,$_pre=0,$12=0,$_1_ph=0,$neg_1_ph=0,$13=0,$14=0,$15=0,$n_03=0,$_12=0,$16=0,$17=0;
 var $18=0,$19=0,$_neg1=0,$20=0,$21=0,$22=0,$23=0,$24=0,$n_0_lcssa=0,$25=0,$26=0,$27=0,label=0;

 $_0=$s;
 while(1) {

  $2=((HEAP8[($_0)])|0);
  $3=(($2<<24)>>24);
  $4=((_isspace((($3)|0)))|0);
  $5=($4|0)==0;
  $6=(($_0+1)|0);
  if ($5) {
   break;
  } else {
   $_0=$6;
  }
 }
 $8=((HEAP8[($_0)])|0);
 $9=(($8<<24)>>24);
 if (((($9|0))|0)==((45)|0)) {
  $neg_0=1;
  label = 5;
 } else if (((($9|0))|0)==((43)|0)) {
  $neg_0=0;
  label = 5;
 } else {
  $neg_1_ph=0;$_1_ph=$_0;$12=$8;
 }
 if ((label|0) == 5) {

  $_pre=((HEAP8[($6)])|0);
  $neg_1_ph=$neg_0;$_1_ph=$6;$12=$_pre;
 }



 $13=(($12<<24)>>24);
 $14=((_isdigit((($13)|0)))|0);
 $15=($14|0)==0;
 if ($15) {
  $n_0_lcssa=0;

  $25=($neg_1_ph|0)!=0;
  $26=(((-$n_0_lcssa))|0);
  $27=($25?$n_0_lcssa:$26);
  return (($27)|0);
 } else {
  $_12=$_1_ph;$n_03=0;
 }
 while(1) {


  $16=((($n_03)*(10))&-1);
  $17=(($_12+1)|0);
  $18=((HEAP8[($_12)])|0);
  $19=(($18<<24)>>24);
  $_neg1=((($16)+(48))|0);
  $20=((($_neg1)-($19))|0);
  $21=((HEAP8[($17)])|0);
  $22=(($21<<24)>>24);
  $23=((_isdigit((($22)|0)))|0);
  $24=($23|0)==0;
  if ($24) {
   $n_0_lcssa=$20;
   break;
  } else {
   $_12=$17;$n_03=$20;
  }
 }

 $25=($neg_1_ph|0)!=0;
 $26=(((-$n_0_lcssa))|0);
 $27=($25?$n_0_lcssa:$26);
 return (($27)|0);
}


function _strtof($s,$p){
 $s=($s)|0;
 $p=($p)|0;
 var $f_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,$22=.0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i=((sp)|0);
 $1=$f_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i,0);
 $6=(+(___floatscan($f_i,0,1)));
 $7=(($f_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  $22=$6;
  STACKTOP=sp;return (+($22));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 $22=$6;
 STACKTOP=sp;return (+($22));
}


function _strtod($s,$p){
 $s=($s)|0;
 $p=($p)|0;
 var $f_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i=((sp)|0);
 $1=$f_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i,0);
 $6=(+(___floatscan($f_i,1,1)));
 $7=(($f_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  STACKTOP=sp;return (+($6));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 STACKTOP=sp;return (+($6));
}


function _strtold($s,$p){
 $s=($s)|0;
 $p=($p)|0;
 var $f_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i=((sp)|0);
 $1=$f_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i,0);
 $6=(+(___floatscan($f_i,2,1)));
 $7=(($f_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  STACKTOP=sp;return (+($6));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 STACKTOP=sp;return (+($6));
}


function _strtof_l($s,$p,$loc){
 $s=($s)|0;
 $p=($p)|0;
 $loc=($loc)|0;
 var $f_i_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,$22=.0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i_i=((sp)|0);
 $1=$f_i_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i_i,0);
 $6=(+(___floatscan($f_i_i,0,1)));
 $7=(($f_i_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  $22=$6;
  STACKTOP=sp;return (+($22));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 $22=$6;
 STACKTOP=sp;return (+($22));
}


function _strtod_l($s,$p,$loc){
 $s=($s)|0;
 $p=($p)|0;
 $loc=($loc)|0;
 var $f_i_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i_i=((sp)|0);
 $1=$f_i_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i_i,0);
 $6=(+(___floatscan($f_i_i,1,1)));
 $7=(($f_i_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  STACKTOP=sp;return (+($6));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 STACKTOP=sp;return (+($6));
}


function _strtold_l($s,$p,$loc){
 $s=($s)|0;
 $p=($p)|0;
 $loc=($loc)|0;
 var $f_i_i=0,$1=0,$$etemp$0$0=0,$$etemp$0$1=0,$2=0,$3=0,$4=0,$5=0,$6=.0,$7=0,$8=0,$9=0,$10=0,$11=0,$12=0,$13=0,$14=0,$15=0,$17=0,$19=0;
 var $21=0,$$etemp$1$0=0,$$etemp$1$1=0,label=0;
 var sp=0;sp=STACKTOP;STACKTOP=(STACKTOP+112)|0;
 $f_i_i=((sp)|0);
 $1=$f_i_i;
 $$etemp$0$0=112;
 $$etemp$0$1=0;

 _memset((((($1)|0))|0), ((((0)|0))|0), ((((112)|0))|0))|0;
 $2=(($f_i_i+4)|0);
 HEAP32[(($2)>>2)]=$s;
 $3=(($f_i_i+8)|0);
 HEAP32[(($3)>>2)]=-1;
 $4=(($f_i_i+44)|0);
 HEAP32[(($4)>>2)]=$s;
 $5=(($f_i_i+76)|0);
 HEAP32[(($5)>>2)]=-1;
 ___shlim($f_i_i,0);
 $6=(+(___floatscan($f_i_i,2,1)));
 $7=(($f_i_i+108)|0);
 $8=((HEAP32[(($7)>>2)])|0);
 $9=((HEAP32[(($2)>>2)])|0);
 $10=((HEAP32[(($3)>>2)])|0);
 $11=$9;
 $12=$10;
 $13=((($11)-($12))|0);
 $14=((($13)+($8))|0);
 $15=($p|0)==0;
 if ($15) {
  $$etemp$1$0=112;
  $$etemp$1$1=0;

  STACKTOP=sp;return (+($6));
 }
 $17=($14|0)==0;
 if ($17) {
  $21=$s;
 } else {
  $19=(($s+$14)|0);
  $21=$19;
 }

 HEAP32[(($p)>>2)]=$21;
 $$etemp$1$0=112;
 $$etemp$1$1=0;

 STACKTOP=sp;return (+($6));
}


function _memcmp($vl,$vr,$n){
 $vl=($vl)|0;
 $vr=($vr)|0;
 $n=($n)|0;
 var $1=0,$r_05=0,$l_04=0,$_03=0,$2=0,$3=0,$4=0,$6=0,$7=0,$8=0,$9=0,$11=0,$12=0,$13=0,$14=0,label=0;

 $1=($n|0)==0;
 if ($1) {
  $14=0;

  return (($14)|0);
 } else {
  $_03=$n;$l_04=$vl;$r_05=$vr;
 }
 while(1) {



  $2=((HEAP8[($l_04)])|0);
  $3=((HEAP8[($r_05)])|0);
  $4=(($2<<24)>>24)==(($3<<24)>>24);
  if (!($4)) {
   break;
  }
  $6=((($_03)-(1))|0);
  $7=(($l_04+1)|0);
  $8=(($r_05+1)|0);
  $9=($6|0)==0;
  if ($9) {
   $14=0;
   label = 5;
   break;
  } else {
   $_03=$6;$l_04=$7;$r_05=$8;
  }
 }
 if ((label|0) == 5) {

  return (($14)|0);
 }
 $11=($2&255);
 $12=($3&255);
 $13=((($11)-($12))|0);
 $14=$13;

 return (($14)|0);
}


function _strcasecmp($_l,$_r){
 $_l=($_l)|0;
 $_r=($_r)|0;
 var $1=0,$2=0,$_in=0,$r_04=0,$l_03=0,$3=0,$4=0,$5=0,$7=0,$9=0,$10=0,$11=0,$12=0,$13=0,$_pre_pre=0,$14=0,$15=0,$16=0,$17=0,$18=0;
 var $r_0_lcssa=0,$19=0,$20=0,$21=0,$22=0,$23=0,$24=0,label=0;

 $1=((HEAP8[($_l)])|0);
 $2=(($1<<24)>>24)==0;
 L1: do {
  if ($2) {
   $r_0_lcssa=$_r;$18=0;
  } else {
   $l_03=$_l;$r_04=$_r;$_in=$1;
   while(1) {



    $3=($_in&255);
    $4=((HEAP8[($r_04)])|0);
    $5=(($4<<24)>>24)==0;
    if ($5) {
     $r_0_lcssa=$r_04;$18=$_in;
     break L1;
    }
    $7=(($_in<<24)>>24)==(($4<<24)>>24);
    if (!($7)) {
     $9=((_tolower((($3)|0)))|0);
     $10=((HEAP8[($r_04)])|0);
     $11=($10&255);
     $12=((_tolower((($11)|0)))|0);
     $13=($9|0)==($12|0);
     if (!($13)) {
      break;
     }
    }
    $14=(($l_03+1)|0);
    $15=(($r_04+1)|0);
    $16=((HEAP8[($14)])|0);
    $17=(($16<<24)>>24)==0;
    if ($17) {
     $r_0_lcssa=$15;$18=0;
     break L1;
    } else {
     $l_03=$14;$r_04=$15;$_in=$16;
    }
   }
   $_pre_pre=((HEAP8[($l_03)])|0);
   $r_0_lcssa=$r_04;$18=$_pre_pre;
  }
 } while(0);


 $19=($18&255);
 $20=((_tolower((($19)|0)))|0);
 $21=((HEAP8[($r_0_lcssa)])|0);
 $22=($21&255);
 $23=((_tolower((($22)|0)))|0);
 $24=((($20)-($23))|0);
 return (($24)|0);
}


function _strcmp($l,$r){
 $l=($l)|0;
 $r=($r)|0;
 var $1=0,$2=0,$3=0,$4=0,$or_cond5=0,$5=0,$or_cond36=0,$_08=0,$_027=0,$6=0,$7=0,$8=0,$9=0,$10=0,$11=0,$or_cond=0,$12=0,$or_cond3=0,$_lcssa4=0,$_lcssa=0;
 var $13=0,$14=0,$15=0,label=0;

 $1=((HEAP8[($l)])|0);
 $2=((HEAP8[($r)])|0);
 $3=(($1<<24)>>24)!=(($2<<24)>>24);
 $4=(($1<<24)>>24)==0;
 $or_cond5=$3|$4;
 $5=(($2<<24)>>24)==0;
 $or_cond36=$or_cond5|$5;
 if ($or_cond36) {
  $_lcssa=$1;$_lcssa4=$2;


  $13=($_lcssa&255);
  $14=($_lcssa4&255);
  $15=((($13)-($14))|0);
  return (($15)|0);
 } else {
  $_027=$l;$_08=$r;
 }
 while(1) {


  $6=(($_027+1)|0);
  $7=(($_08+1)|0);
  $8=((HEAP8[($6)])|0);
  $9=((HEAP8[($7)])|0);
  $10=(($8<<24)>>24)!=(($9<<24)>>24);
  $11=(($8<<24)>>24)==0;
  $or_cond=$10|$11;
  $12=(($9<<24)>>24)==0;
  $or_cond3=$or_cond|$12;
  if ($or_cond3) {
   $_lcssa=$8;$_lcssa4=$9;
   break;
  } else {
   $_027=$6;$_08=$7;
  }
 }


 $13=($_lcssa&255);
 $14=($_lcssa4&255);
 $15=((($13)-($14))|0);
 return (($15)|0);
}


function _strncasecmp($_l,$_r,$n){
 $_l=($_l)|0;
 $_r=($_r)|0;
 $n=($n)|0;
 var $1=0,$2=0,$3=0,$_in=0,$_08_in=0,$r_07=0,$l_06=0,$_08=0,$4=0,$5=0,$6=0,$7=0,$or_cond=0,$9=0,$11=0,$12=0,$13=0,$14=0,$15=0,$_pre_pre=0;
 var $16=0,$17=0,$18=0,$19=0,$20=0,$r_0_lcssa=0,$21=0,$22=0,$23=0,$24=0,$25=0,$26=0,$_04=0,label=0;

 $1=($n|0)==0;
 if ($1) {
  $_04=0;

  return (($_04)|0);
 }
 $2=((HEAP8[($_l)])|0);
 $3=(($2<<24)>>24)==0;
 L4: do {
  if ($3) {
   $r_0_lcssa=$_r;$20=0;
  } else {
   $l_06=$_l;$r_07=$_r;$_08_in=$n;$_in=$2;
   while(1) {




    $_08=((($_08_in)-(1))|0);
    $4=($_in&255);
    $5=((HEAP8[($r_07)])|0);
    $6=(($5<<24)>>24)==0;
    $7=($_08|0)==0;
    $or_cond=$6|$7;
    if ($or_cond) {
     $r_0_lcssa=$r_07;$20=$_in;
     break L4;
    }
    $9=(($_in<<24)>>24)==(($5<<24)>>24);
    if (!($9)) {
     $11=((_tolower((($4)|0)))|0);
     $12=((HEAP8[($r_07)])|0);
     $13=($12&255);
     $14=((_tolower((($13)|0)))|0);
     $15=($11|0)==($14|0);
     if (!($15)) {
      break;
     }
    }
    $16=(($l_06+1)|0);
    $17=(($r_07+1)|0);
    $18=((HEAP8[($16)])|0);
    $19=(($18<<24)>>24)==0;
    if ($19) {
     $r_0_lcssa=$17;$20=0;
     break L4;
    } else {
     $l_06=$16;$r_07=$17;$_08_in=$_08;$_in=$18;
    }
   }
   $_pre_pre=((HEAP8[($l_06)])|0);
   $r_0_lcssa=$r_07;$20=$_pre_pre;
  }
 } while(0);


 $21=($20&255);
 $22=((_tolower((($21)|0)))|0);
 $23=((HEAP8[($r_0_lcssa)])|0);
 $24=($23&255);
 $25=((_tolower((($24)|0)))|0);
 $26=((($22)-($25))|0);
 $_04=$26;

 return (($_04)|0);
}


function _strncmp($_l,$_r,$n){
 $_l=($_l)|0;
 $_r=($_r)|0;
 $n=($n)|0;
 var $1=0,$2=0,$3=0,$4=0,$_08_in=0,$r_07=0,$l_06=0,$_08=0,$5=0,$notlhs=0,$notrhs=0,$or_cond_not=0,$6=0,$or_cond4=0,$8=0,$9=0,$10=0,$11=0,$12=0,$r_0_lcssa=0;
 var $13=0,$14=0,$15=0,$16=0,$_03=0,label=0;

 $1=($n|0)==0;
 if ($1) {
  $_03=0;

  return (($_03)|0);
 }
 $2=((HEAP8[($_l)])|0);
 $3=(($2<<24)>>24)==0;
 L4: do {
  if ($3) {
   $r_0_lcssa=$_r;$12=0;
  } else {
   $l_06=$_l;$r_07=$_r;$_08_in=$n;$4=$2;
   while(1) {




    $_08=((($_08_in)-(1))|0);
    $5=((HEAP8[($r_07)])|0);
    $notlhs=(($5<<24)>>24)!=0;
    $notrhs=($_08|0)!=0;
    $or_cond_not=$notrhs&$notlhs;
    $6=(($4<<24)>>24)==(($5<<24)>>24);
    $or_cond4=$or_cond_not&$6;
    if (!($or_cond4)) {
     $r_0_lcssa=$r_07;$12=$4;
     break L4;
    }
    $8=(($l_06+1)|0);
    $9=(($r_07+1)|0);
    $10=((HEAP8[($8)])|0);
    $11=(($10<<24)>>24)==0;
    if ($11) {
     $r_0_lcssa=$9;$12=0;
     break;
    } else {
     $l_06=$8;$r_07=$9;$_08_in=$_08;$4=$10;
    }
   }
  }
 } while(0);


 $13=($12&255);
 $14=((HEAP8[($r_0_lcssa)])|0);
 $15=($14&255);
 $16=((($13)-($15))|0);
 $_03=$16;

 return (($_03)|0);
}


function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[(curr)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[(dest)]=((HEAP8[(src)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[(dest)]=((HEAP8[(src)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _memmove(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
      // Unlikely case: Copy backwards in a safe manner
      ret = dest;
      src = (src + num)|0;
      dest = (dest + num)|0;
      while ((num|0) > 0) {
        dest = (dest - 1)|0;
        src = (src - 1)|0;
        num = (num - 1)|0;
        HEAP8[(dest)]=((HEAP8[(src)])|0);
      }
      dest = ret;
    } else {
      _memcpy(dest, src, num) | 0;
    }
    return dest | 0;
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
    return (ptr-num)|0;
}
function _tolower(chr) {
    chr = chr|0;
    if ((chr|0) < 65) return chr|0;
    if ((chr|0) > 90) return chr|0;
    return (chr - 65 + 97)|0;
}


function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
  }
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
  }
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
  }
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
  }
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_ctlz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((ctlz_i8)+(x >>> 24))|0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((ctlz_i8)+((x >> 16)&0xff))|0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((ctlz_i8)+((x >> 8)&0xff))|0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((ctlz_i8)+(x&0xff))|0)])|0) + 24)|0;
  }

function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))|0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))|0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))|0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))|0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
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
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
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
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
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
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
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
      HEAP32[$rem >> 2] = $a$0 & -1;
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
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
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
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = _llvm_ctlz_i32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
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
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (_llvm_ctlz_i32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (_llvm_ctlz_i32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
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
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
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
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
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
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
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
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================


// EMSCRIPTEN_END_FUNCS

  
  function dynCall_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
    index = index|0;
    a1=a1|0; a2=a2|0; a3=a3|0; a4=a4|0; a5=a5|0; a6=a6|0; a7=a7|0;
    return FUNCTION_TABLE_iiiiiiii[index&7](a1|0,a2|0,a3|0,a4|0,a5|0,a6|0,a7|0)|0;
  }


  function dynCall_fiii(index,a1,a2,a3) {
    index = index|0;
    a1=a1|0; a2=a2|0; a3=a3|0;
    return +FUNCTION_TABLE_fiii[index&3](a1|0,a2|0,a3|0);
  }


  function dynCall_vi(index,a1) {
    index = index|0;
    a1=a1|0;
    FUNCTION_TABLE_vi[index&15](a1|0);
  }


  function dynCall_ii(index,a1) {
    index = index|0;
    a1=a1|0;
    return FUNCTION_TABLE_ii[index&7](a1|0)|0;
  }


  function dynCall_iiii(index,a1,a2,a3) {
    index = index|0;
    a1=a1|0; a2=a2|0; a3=a3|0;
    return FUNCTION_TABLE_iiii[index&1](a1|0,a2|0,a3|0)|0;
  }


  function dynCall_v(index) {
    index = index|0;
    
    FUNCTION_TABLE_v[index&1]();
  }


  function dynCall_iii(index,a1,a2) {
    index = index|0;
    a1=a1|0; a2=a2|0;
    return FUNCTION_TABLE_iii[index&1](a1|0,a2|0)|0;
  }


  function dynCall_diii(index,a1,a2,a3) {
    index = index|0;
    a1=a1|0; a2=a2|0; a3=a3|0;
    return +FUNCTION_TABLE_diii[index&7](a1|0,a2|0,a3|0);
  }

function b0(p0,p1,p2,p3,p4,p5,p6) { p0 = p0|0;p1 = p1|0;p2 = p2|0;p3 = p3|0;p4 = p4|0;p5 = p5|0;p6 = p6|0; abort(0); return 0 }
  function b1(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; abort(1); return +0 }
  function b2(p0) { p0 = p0|0; abort(2);  }
  function b3(p0) { p0 = p0|0; abort(3); return 0 }
  function b4(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; abort(4); return 0 }
  function b5() { ; abort(5);  }
  function b6(p0,p1) { p0 = p0|0;p1 = p1|0; abort(6); return 0 }
  function b7(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; abort(7); return +0 }
  // EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_iiiiiiii = [b0,b0,_pixman_region_intersect_o,b0,_pixman_region_subtract_o,b0,_pixman_region_union_o,b0];
  
  var FUNCTION_TABLE_fiii = [b1,b1,_strtof_l,b1];
  
  var FUNCTION_TABLE_vi = [b2,b2,__ZNSt20bad_array_new_lengthC2Ev,b2,__ZNSt16bad_array_lengthC2Ev,b2,__ZNSt20bad_array_new_lengthD0Ev,b2,__ZNSt9bad_allocC2Ev,b2,__ZNSt9bad_allocD0Ev,b2,__ZNSt9bad_allocD2Ev,b2,__ZNSt16bad_array_lengthD0Ev,b2];
  
  var FUNCTION_TABLE_ii = [b3,b3,__ZNKSt9bad_alloc4whatEv,b3,__ZNKSt20bad_array_new_length4whatEv,b3,__ZNKSt16bad_array_length4whatEv,b3];
  
  var FUNCTION_TABLE_iiii = [b4,b4];
  
  var FUNCTION_TABLE_v = [b5,b5];
  
  var FUNCTION_TABLE_iii = [b6,b6];
  
  var FUNCTION_TABLE_diii = [b7,b7,_strtold_l,b7,_strtod_l,b7,b7,b7];
  

  return { _strncasecmp: _strncasecmp, _validate: _validate, _pixman_region32_init_rect: _pixman_region32_init_rect, _pixman_rect_alloc: _pixman_rect_alloc, _strlen: _strlen, _pixman_region32_contains_point: _pixman_region32_contains_point, _pixman_region32_copy: _pixman_region32_copy, _pvalloc: _pvalloc, __ZNSt9bad_allocC2Ev: __ZNSt9bad_allocC2Ev, _pixman_region32_intersect: _pixman_region32_intersect, __ZNKSt9bad_alloc4whatEv: __ZNKSt9bad_alloc4whatEv, __ZdlPvRKSt9nothrow_t: __ZdlPvRKSt9nothrow_t, _pixman_region32_contains_rectangle: _pixman_region32_contains_rectangle, _strtod_l: _strtod_l, _mallinfo: _mallinfo, _pixman_region32_selfcheck: _pixman_region32_selfcheck, _PIXREGION_SZOF: _PIXREGION_SZOF, _pixman_region32_inverse: _pixman_region32_inverse, _malloc_usable_size: _malloc_usable_size, _pixman_region32_init_rects: _pixman_region32_init_rects, _strtof_l: _strtof_l, __ZdlPv: __ZdlPv, _free: _free, _scalbn: _scalbn, ___shgetc: ___shgetc, _tolower: _tolower, _memalign: _memalign, _try_realloc_chunk: _try_realloc_chunk, _bulk_free: _bulk_free, _independent_calloc: _independent_calloc, _pixman_region32_fini: _pixman_region32_fini, _pixman_region32_clear: _pixman_region32_clear, _pixman_region_subtract_o: _pixman_region_subtract_o, _pixman_region32_n_rects: _pixman_region32_n_rects, __ZNSt16bad_array_lengthC2Ev: __ZNSt16bad_array_lengthC2Ev, _pixman_region32_translate: _pixman_region32_translate, _pixman_region32_subtract: _pixman_region32_subtract, _pixman_region32_init_with_extents: _pixman_region32_init_with_extents, _find_box_for_y: _find_box_for_y, _strtof: _strtof, ___towrite: ___towrite, _strtod: _strtod, __ZSt15get_new_handlerv: __ZSt15get_new_handlerv, _pixman_region32_equal: _pixman_region32_equal, _strcasecmp: _strcasecmp, _pixman_region32_rectangles: _pixman_region32_rectangles, __ZNSt9bad_allocD2Ev: __ZNSt9bad_allocD2Ev, _alloc_data: _alloc_data, _pixman_region32_union: _pixman_region32_union, _quick_sort_rects: _quick_sort_rects, _pixman_region32_intersect_rect: _pixman_region32_intersect_rect, __ZNSt20bad_array_new_lengthC2Ev: __ZNSt20bad_array_new_lengthC2Ev, _pixman_region32_extents: _pixman_region32_extents, __Znwj: __Znwj, __ZSt17__throw_bad_allocv: __ZSt17__throw_bad_allocv, __ZNKSt20bad_array_new_length4whatEv: __ZNKSt20bad_array_new_length4whatEv, _pixman_region32_not_empty: _pixman_region32_not_empty, _independent_comalloc: _independent_comalloc, _pixman_region_append_non_o: _pixman_region_append_non_o, _valloc: _valloc, __ZnwjRKSt9nothrow_t: __ZnwjRKSt9nothrow_t, _malloc_set_footprint_limit: _malloc_set_footprint_limit, _posix_memalign: _posix_memalign, _strtold_l: _strtold_l, ___floatscan: ___floatscan, _atoi: _atoi, _atol: _atol, __pixman_log_error: __pixman_log_error, ___overflow: ___overflow, ___uflow: ___uflow, _strtold: _strtold, _ialloc: _ialloc, _memset: _memset, _atof: _atof, _memcpy: _memcpy, _internal_memalign: _internal_memalign, __ZNSt16bad_array_lengthD0Ev: __ZNSt16bad_array_lengthD0Ev, _realloc_in_place: _realloc_in_place, _mallopt: _mallopt, ___toread: ___toread, _pixman_region32_print: _pixman_region32_print, _memcmp: _memcmp, _dispose_chunk: _dispose_chunk, _malloc: _malloc, _malloc_max_footprint: _malloc_max_footprint, _strncmp: _strncmp, _malloc_footprint_limit: _malloc_footprint_limit, __Znaj: __Znaj, _malloc_footprint: _malloc_footprint, __ZNSt20bad_array_new_lengthD0Ev: __ZNSt20bad_array_new_lengthD0Ev, _pixman_region32_reset: _pixman_region32_reset, _pixman_break: _pixman_break, __ZNSt9bad_allocD0Ev: __ZNSt9bad_allocD0Ev, _pixman_set_extents: _pixman_set_extents, _scanexp: _scanexp, _calloc: _calloc, _pixman_coalesce: _pixman_coalesce, __ZSt15set_new_handlerPFvvE: __ZSt15set_new_handlerPFvvE, _pixman_region32_union_rect: _pixman_region32_union_rect, __ZNKSt16bad_array_length4whatEv: __ZNKSt16bad_array_length4whatEv, _malloc_trim: _malloc_trim, __ZdaPv: __ZdaPv, _malloc_stats: _malloc_stats, _scalbnl: _scalbnl, _pixman_region32_init: _pixman_region32_init, _realloc: _realloc, _pixman_region_intersect_o: _pixman_region_intersect_o, _pixman_region_union_o: _pixman_region_union_o, _pixman_op: _pixman_op, ___shlim: ___shlim, _strcmp: _strcmp, _memmove: _memmove, __ZnajRKSt9nothrow_t: __ZnajRKSt9nothrow_t, __ZdaPvRKSt9nothrow_t: __ZdaPvRKSt9nothrow_t, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_iiiiiiii: dynCall_iiiiiiii, dynCall_fiii: dynCall_fiii, dynCall_vi: dynCall_vi, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_v: dynCall_v, dynCall_iii: dynCall_iii, dynCall_diii: dynCall_diii };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiiiiii": invoke_iiiiiiii, "invoke_fiii": invoke_fiii, "invoke_vi": invoke_vi, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_diii": invoke_diii, "_llvm_lifetime_end": _llvm_lifetime_end, "_sysconf": _sysconf, "___cxa_throw": ___cxa_throw, "_abort": _abort, "_fprintf": _fprintf, "___cxa_end_catch": ___cxa_end_catch, "___cxa_free_exception": ___cxa_free_exception, "_isdigit": _isdigit, "_fflush": _fflush, "__reallyNegative": __reallyNegative, "_fabs": _fabs, "_llvm_lifetime_start": _llvm_lifetime_start, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___cxa_allocate_exception": ___cxa_allocate_exception, "_isspace": _isspace, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_is_number_type": ___cxa_is_number_type, "___resumeException": ___resumeException, "__formatString": __formatString, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fileno": _fileno, "_pwrite": _pwrite, "___cxa_call_unexpected": ___cxa_call_unexpected, "_sbrk": _sbrk, "___errno_location": ___errno_location, "___gxx_personality_v0": ___gxx_personality_v0, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "_mkport": _mkport, "_copysign": _copysign, "_fmod": _fmod, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "__ZTISt9exception": __ZTISt9exception, "_stderr": _stderr, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE }, buffer);
var _strncasecmp = Module["_strncasecmp"] = asm["_strncasecmp"];
var _validate = Module["_validate"] = asm["_validate"];
var _pixman_region32_init_rect = Module["_pixman_region32_init_rect"] = asm["_pixman_region32_init_rect"];
var _pixman_rect_alloc = Module["_pixman_rect_alloc"] = asm["_pixman_rect_alloc"];
var _strlen = Module["_strlen"] = asm["_strlen"];
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
var _PIXREGION_SZOF = Module["_PIXREGION_SZOF"] = asm["_PIXREGION_SZOF"];
var _pixman_region32_inverse = Module["_pixman_region32_inverse"] = asm["_pixman_region32_inverse"];
var _malloc_usable_size = Module["_malloc_usable_size"] = asm["_malloc_usable_size"];
var _pixman_region32_init_rects = Module["_pixman_region32_init_rects"] = asm["_pixman_region32_init_rects"];
var _strtof_l = Module["_strtof_l"] = asm["_strtof_l"];
var __ZdlPv = Module["__ZdlPv"] = asm["__ZdlPv"];
var _free = Module["_free"] = asm["_free"];
var _scalbn = Module["_scalbn"] = asm["_scalbn"];
var ___shgetc = Module["___shgetc"] = asm["___shgetc"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _memalign = Module["_memalign"] = asm["_memalign"];
var _try_realloc_chunk = Module["_try_realloc_chunk"] = asm["_try_realloc_chunk"];
var _bulk_free = Module["_bulk_free"] = asm["_bulk_free"];
var _independent_calloc = Module["_independent_calloc"] = asm["_independent_calloc"];
var _pixman_region32_fini = Module["_pixman_region32_fini"] = asm["_pixman_region32_fini"];
var _pixman_region32_clear = Module["_pixman_region32_clear"] = asm["_pixman_region32_clear"];
var _pixman_region_subtract_o = Module["_pixman_region_subtract_o"] = asm["_pixman_region_subtract_o"];
var _pixman_region32_n_rects = Module["_pixman_region32_n_rects"] = asm["_pixman_region32_n_rects"];
var __ZNSt16bad_array_lengthC2Ev = Module["__ZNSt16bad_array_lengthC2Ev"] = asm["__ZNSt16bad_array_lengthC2Ev"];
var _pixman_region32_translate = Module["_pixman_region32_translate"] = asm["_pixman_region32_translate"];
var _pixman_region32_subtract = Module["_pixman_region32_subtract"] = asm["_pixman_region32_subtract"];
var _pixman_region32_init_with_extents = Module["_pixman_region32_init_with_extents"] = asm["_pixman_region32_init_with_extents"];
var _find_box_for_y = Module["_find_box_for_y"] = asm["_find_box_for_y"];
var _strtof = Module["_strtof"] = asm["_strtof"];
var ___towrite = Module["___towrite"] = asm["___towrite"];
var _strtod = Module["_strtod"] = asm["_strtod"];
var __ZSt15get_new_handlerv = Module["__ZSt15get_new_handlerv"] = asm["__ZSt15get_new_handlerv"];
var _pixman_region32_equal = Module["_pixman_region32_equal"] = asm["_pixman_region32_equal"];
var _strcasecmp = Module["_strcasecmp"] = asm["_strcasecmp"];
var _pixman_region32_rectangles = Module["_pixman_region32_rectangles"] = asm["_pixman_region32_rectangles"];
var __ZNSt9bad_allocD2Ev = Module["__ZNSt9bad_allocD2Ev"] = asm["__ZNSt9bad_allocD2Ev"];
var _alloc_data = Module["_alloc_data"] = asm["_alloc_data"];
var _pixman_region32_union = Module["_pixman_region32_union"] = asm["_pixman_region32_union"];
var _quick_sort_rects = Module["_quick_sort_rects"] = asm["_quick_sort_rects"];
var _pixman_region32_intersect_rect = Module["_pixman_region32_intersect_rect"] = asm["_pixman_region32_intersect_rect"];
var __ZNSt20bad_array_new_lengthC2Ev = Module["__ZNSt20bad_array_new_lengthC2Ev"] = asm["__ZNSt20bad_array_new_lengthC2Ev"];
var _pixman_region32_extents = Module["_pixman_region32_extents"] = asm["_pixman_region32_extents"];
var __Znwj = Module["__Znwj"] = asm["__Znwj"];
var __ZSt17__throw_bad_allocv = Module["__ZSt17__throw_bad_allocv"] = asm["__ZSt17__throw_bad_allocv"];
var __ZNKSt20bad_array_new_length4whatEv = Module["__ZNKSt20bad_array_new_length4whatEv"] = asm["__ZNKSt20bad_array_new_length4whatEv"];
var _pixman_region32_not_empty = Module["_pixman_region32_not_empty"] = asm["_pixman_region32_not_empty"];
var _independent_comalloc = Module["_independent_comalloc"] = asm["_independent_comalloc"];
var _pixman_region_append_non_o = Module["_pixman_region_append_non_o"] = asm["_pixman_region_append_non_o"];
var _valloc = Module["_valloc"] = asm["_valloc"];
var __ZnwjRKSt9nothrow_t = Module["__ZnwjRKSt9nothrow_t"] = asm["__ZnwjRKSt9nothrow_t"];
var _malloc_set_footprint_limit = Module["_malloc_set_footprint_limit"] = asm["_malloc_set_footprint_limit"];
var _posix_memalign = Module["_posix_memalign"] = asm["_posix_memalign"];
var _strtold_l = Module["_strtold_l"] = asm["_strtold_l"];
var ___floatscan = Module["___floatscan"] = asm["___floatscan"];
var _atoi = Module["_atoi"] = asm["_atoi"];
var _atol = Module["_atol"] = asm["_atol"];
var __pixman_log_error = Module["__pixman_log_error"] = asm["__pixman_log_error"];
var ___overflow = Module["___overflow"] = asm["___overflow"];
var ___uflow = Module["___uflow"] = asm["___uflow"];
var _strtold = Module["_strtold"] = asm["_strtold"];
var _ialloc = Module["_ialloc"] = asm["_ialloc"];
var _memset = Module["_memset"] = asm["_memset"];
var _atof = Module["_atof"] = asm["_atof"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _internal_memalign = Module["_internal_memalign"] = asm["_internal_memalign"];
var __ZNSt16bad_array_lengthD0Ev = Module["__ZNSt16bad_array_lengthD0Ev"] = asm["__ZNSt16bad_array_lengthD0Ev"];
var _realloc_in_place = Module["_realloc_in_place"] = asm["_realloc_in_place"];
var _mallopt = Module["_mallopt"] = asm["_mallopt"];
var ___toread = Module["___toread"] = asm["___toread"];
var _pixman_region32_print = Module["_pixman_region32_print"] = asm["_pixman_region32_print"];
var _memcmp = Module["_memcmp"] = asm["_memcmp"];
var _dispose_chunk = Module["_dispose_chunk"] = asm["_dispose_chunk"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _malloc_max_footprint = Module["_malloc_max_footprint"] = asm["_malloc_max_footprint"];
var _strncmp = Module["_strncmp"] = asm["_strncmp"];
var _malloc_footprint_limit = Module["_malloc_footprint_limit"] = asm["_malloc_footprint_limit"];
var __Znaj = Module["__Znaj"] = asm["__Znaj"];
var _malloc_footprint = Module["_malloc_footprint"] = asm["_malloc_footprint"];
var __ZNSt20bad_array_new_lengthD0Ev = Module["__ZNSt20bad_array_new_lengthD0Ev"] = asm["__ZNSt20bad_array_new_lengthD0Ev"];
var _pixman_region32_reset = Module["_pixman_region32_reset"] = asm["_pixman_region32_reset"];
var _pixman_break = Module["_pixman_break"] = asm["_pixman_break"];
var __ZNSt9bad_allocD0Ev = Module["__ZNSt9bad_allocD0Ev"] = asm["__ZNSt9bad_allocD0Ev"];
var _pixman_set_extents = Module["_pixman_set_extents"] = asm["_pixman_set_extents"];
var _scanexp = Module["_scanexp"] = asm["_scanexp"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _pixman_coalesce = Module["_pixman_coalesce"] = asm["_pixman_coalesce"];
var __ZSt15set_new_handlerPFvvE = Module["__ZSt15set_new_handlerPFvvE"] = asm["__ZSt15set_new_handlerPFvvE"];
var _pixman_region32_union_rect = Module["_pixman_region32_union_rect"] = asm["_pixman_region32_union_rect"];
var __ZNKSt16bad_array_length4whatEv = Module["__ZNKSt16bad_array_length4whatEv"] = asm["__ZNKSt16bad_array_length4whatEv"];
var _malloc_trim = Module["_malloc_trim"] = asm["_malloc_trim"];
var __ZdaPv = Module["__ZdaPv"] = asm["__ZdaPv"];
var _malloc_stats = Module["_malloc_stats"] = asm["_malloc_stats"];
var _scalbnl = Module["_scalbnl"] = asm["_scalbnl"];
var _pixman_region32_init = Module["_pixman_region32_init"] = asm["_pixman_region32_init"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _pixman_region_intersect_o = Module["_pixman_region_intersect_o"] = asm["_pixman_region_intersect_o"];
var _pixman_region_union_o = Module["_pixman_region_union_o"] = asm["_pixman_region_union_o"];
var _pixman_op = Module["_pixman_op"] = asm["_pixman_op"];
var ___shlim = Module["___shlim"] = asm["___shlim"];
var _strcmp = Module["_strcmp"] = asm["_strcmp"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __ZnajRKSt9nothrow_t = Module["__ZnajRKSt9nothrow_t"] = asm["__ZnajRKSt9nothrow_t"];
var __ZdaPvRKSt9nothrow_t = Module["__ZdaPvRKSt9nothrow_t"] = asm["__ZdaPvRKSt9nothrow_t"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = asm["dynCall_iiiiiiii"];
var dynCall_fiii = Module["dynCall_fiii"] = asm["dynCall_fiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_diii = Module["dynCall_diii"] = asm["dynCall_diii"];

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


Runtime.typeInfo = {"[0 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":0,"flatFactor":4},"[41 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":41,"flatFactor":1},"[73 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":73,"flatFactor":1},"%struct.malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[2 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4},"[13 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":13,"flatFactor":1},"%\"class.std::bad_alloc\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::exception\""],"flatSize":4,"flatFactor":4,"packed":false},"[70 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":70,"flatFactor":1},"%struct._IO_FILE.4":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","{}*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE.4*, i8*, i32)*","i32 (%struct._IO_FILE.4*, i8*, i32)*","i32 (%struct._IO_FILE.4*, i32, i32)*","i8*","i32","%struct._IO_FILE.4*","%struct._IO_FILE.4*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false},"%\"class.std::exception\"":{"alignSize":4,"flatIndexes":[0],"fields":["i32 (...)**"],"flatSize":4,"flatFactor":4,"packed":false},"[58 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":58,"flatFactor":1},"[26 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":26,"flatFactor":1},"%struct.malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"%struct._IO_FILE.3":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","{}*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE.3*, i8*, i32)*","i32 (%struct._IO_FILE.3*, i8*, i32)*","i32 (%struct._IO_FILE.3*, i32, i32)*","i8*","i32","%struct._IO_FILE.3*","%struct._IO_FILE.3*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false},"%struct.malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"[39 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":39,"flatFactor":1},"[14 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":14,"flatFactor":1},"[17 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":17,"flatFactor":1},"[38 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":38,"flatFactor":1},"[9 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":9,"flatFactor":1},"[0 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":0,"flatFactor":1},"%struct.mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"[15 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":15,"flatFactor":1},"%struct.pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[0 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":0,"flatFactor":4},"[72 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":72,"flatFactor":1},"[5 x i8*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i8*","i8*"],"flatSize":20,"flatFactor":4},"[2 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":2,"flatFactor":1},"[37 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":37,"flatFactor":1},"[47 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":47,"flatFactor":1},"[66 x %struct.malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"[122 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":122,"flatFactor":1},"{ i8*, i8*, i8* }":{"alignSize":4,"flatIndexes":[0,4,8],"fields":["i8*","i8*","i8*"],"flatSize":12,"flatFactor":4,"packed":false},"[33 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":33,"flatFactor":1},"[25 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":25,"flatFactor":1},"%struct.malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"[40 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":40,"flatFactor":1},"[103 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":103,"flatFactor":1},"%struct.region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"%\"class.std::bad_array_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"[8 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":32,"flatFactor":4},"%struct.__locale_struct":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"%struct.malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"[123 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":123,"flatFactor":1},"%struct.pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"[86 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":86,"flatFactor":1},"%struct.__locale_struct.1":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"%struct.__locale_struct.0":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"%struct.pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[22 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":22,"flatFactor":1},"%\"class.std::bad_array_new_length\"":{"alignSize":4,"flatIndexes":[0],"fields":["%\"class.std::bad_alloc\""],"flatSize":4,"flatFactor":4,"packed":false},"[32 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[119 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":119,"flatFactor":1},"[54 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":54,"flatFactor":1},"[2 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[21 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":21,"flatFactor":1},"[0 x %struct.malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":0,"flatFactor":4},"[96 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":96,"flatFactor":1},"[65 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":65,"flatFactor":1},"[113 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":113,"flatFactor":1},"%\"struct.std::nothrow_t\"":{"alignSize":1,"flatIndexes":[0],"fields":["i8"],"flatSize":1,"flatFactor":1,"packed":false},"[4 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":4,"flatFactor":1},"%struct._IO_FILE":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","i32 (%struct._IO_FILE*)*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE*, i8*, i32)*","i32 (%struct._IO_FILE*, i8*, i32)*","i32 (%struct._IO_FILE*, i32, i32)*","i8*","i32","%struct._IO_FILE*","%struct._IO_FILE*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false},"[18 x i8]":{"alignSize":1,"flatIndexes":[0,1],"fields":["i8","i8"],"flatSize":18,"flatFactor":1},"[0 x i32]":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":0,"flatFactor":4},"[0 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":0,"flatFactor":4},"malloc_segment":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i8*","i32","%struct.malloc_segment*","i32"],"flatSize":16,"flatFactor":4,"packed":false},"_IO_FILE.4":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","{}*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE.4*, i8*, i32)*","i32 (%struct._IO_FILE.4*, i8*, i32)*","i32 (%struct._IO_FILE.4*, i32, i32)*","i8*","i32","%struct._IO_FILE.4*","%struct._IO_FILE.4*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false},"malloc_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":16,"flatFactor":4,"packed":false},"_IO_FILE.3":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","{}*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE.3*, i8*, i32)*","i32 (%struct._IO_FILE.3*, i8*, i32)*","i32 (%struct._IO_FILE.3*, i32, i32)*","i8*","i32","%struct._IO_FILE.3*","%struct._IO_FILE.3*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false},"malloc_params":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20],"fields":["i32","i32","i32","i32","i32","i32"],"flatSize":24,"flatFactor":4,"packed":false},"mallinfo":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36],"fields":["i32","i32","i32","i32","i32","i32","i32","i32","i32","i32"],"flatSize":40,"flatFactor":4,"packed":false},"pixman_region32_data":{"alignSize":4,"flatIndexes":[0,4],"fields":["i32","i32"],"flatSize":8,"flatFactor":4,"packed":false},"[66 x malloc_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_chunk*","%struct.malloc_chunk*"],"flatSize":264,"flatFactor":4},"malloc_tree_chunk":{"alignSize":4,"flatIndexes":[0,4,8,12,16,24,28],"fields":["i32","i32","%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*","[2 x %struct.malloc_tree_chunk*]","%struct.malloc_tree_chunk*","i32"],"flatSize":32,"packed":false},"region_info_t":{"alignSize":4,"flatIndexes":[0,20,24],"fields":["%struct.pixman_region32","i32","i32"],"flatSize":28,"packed":false},"__locale_struct":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"malloc_state":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,304,432,436,440,444,448,464,468],"fields":["i32","i32","i32","i32","i8*","%struct.malloc_chunk*","%struct.malloc_chunk*","i32","i32","i32","[66 x %struct.malloc_chunk*]","[32 x %struct.malloc_tree_chunk*]","i32","i32","i32","i32","%struct.malloc_segment","i8*","i32"],"flatSize":472,"packed":false},"pixman_region32":{"alignSize":4,"flatIndexes":[0,16],"fields":["%struct.pixman_box32","%struct.pixman_region32_data*"],"flatSize":20,"flatFactor":16,"packed":false},"__locale_struct.1":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"__locale_struct.0":{"alignSize":0,"flatIndexes":[],"fields":[],"flatSize":0,"flatFactor":0,"packed":false},"pixman_box32":{"alignSize":4,"flatIndexes":[0,4,8,12],"fields":["i32","i32","i32","i32"],"flatSize":16,"flatFactor":4,"packed":false},"[32 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":128,"flatFactor":4},"[2 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":8,"flatFactor":4},"[0 x malloc_tree_chunk*]":{"alignSize":4,"flatIndexes":[0,4],"fields":["%struct.malloc_tree_chunk*","%struct.malloc_tree_chunk*"],"flatSize":0,"flatFactor":4},"_IO_FILE":{"alignSize":4,"flatIndexes":[0,4,8,12,16,20,24,28,32,36,40,44,48,52,56,60,64,68,72,74,75,76,80,84,88,92,96,100,104,108],"fields":["i32","i8*","i8*","i32 (%struct._IO_FILE*)*","i8*","i8*","i8*","i8*","i32 (%struct._IO_FILE*, i8*, i32)*","i32 (%struct._IO_FILE*, i8*, i32)*","i32 (%struct._IO_FILE*, i32, i32)*","i8*","i32","%struct._IO_FILE*","%struct._IO_FILE*","i32","i32","i32","i16","i8","i8","i32","i32","i8*","i32","i8*","i8*","i8*","i32","i32"],"flatSize":112,"packed":false}}
Runtime.structMetadata = {}

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

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

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

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



