// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != 'undefined';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string' && process.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {

}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == 'undefined' || !process.release || process.release.name !== 'node') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split('.').slice(0, 3);
  numericVersion = (numericVersion[0] * 10000) + (numericVersion[1] * 100) + (numericVersion[2].split('-')[0] * 1);
  var minVersion = 160000;
  if (numericVersion < 160000) {
    throw new Error('This emscripten-generated code requires node v16.0.0 (detected v' + nodeVersion + ')');
  }

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('fs');
  var nodePath = require('path');

  scriptDirectory = __dirname + '/';

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  assert(Buffer.isBuffer(ret));
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  assert(binary ? Buffer.isBuffer(ret) : typeof ret == 'string');
  return ret;
};
// end include: node_shell_read.js
  if (!Module['thisProgram'] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  arguments_ = process.argv.slice(2);

  if (typeof module != 'undefined') {
    module['exports'] = Module;
  }

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else
if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof WorkerGlobalScope != 'undefined') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith('blob:')) {
    scriptDirectory = '';
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, '').lastIndexOf('/')+1);
  }

  if (!(typeof window == 'object' || typeof WorkerGlobalScope != 'undefined')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('asm', 'wasmExports');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');

if (typeof WebAssembly != 'object') {
  err('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/* BigInt64Array type is not correctly defined in closure
/** not-@type {!BigInt64Array} */
  HEAP64,
/* BigUint64Array type is not correctly defined in closure
/** not-t@type {!BigUint64Array} */
  HEAPU64,
/** @type {!Float64Array} */
  HEAPF64;

var runtimeInitialized = false;

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');
// end include: URIUtils.js
// include: runtime_shared.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// end include: runtime_exceptions.js
// include: runtime_debug.js
// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

function legacyModuleProp(prop, newName, incoming=true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)' : '';
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);

      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

/**
 * Intercept access to a global symbol.  This enables us to give informative
 * warnings/errors when folks attempt to use symbols they did not include in
 * their build, or no symbols that no longer exist.
 */
function hookGlobalSymbolAccess(sym, func) {
  if (typeof globalThis != 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    var librarySymbol = sym;
    if (!librarySymbol.startsWith('_')) {
      librarySymbol = '$' + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
    }
    warnOnce(msg);
  });

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}
// end include: runtime_debug.js
// include: memoryprofiler.js
// end include: memoryprofiler.js


function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
  Module['HEAP64'] = HEAP64 = new BigInt64Array(b);
  Module['HEAPU64'] = HEAPU64 = new BigUint64Array(b);
}

// end include: runtime_shared.js
assert(!Module['STACK_SIZE'], 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')

assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(!Module['INITIAL_MEMORY'], 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
if (!Module['noFSInit'] && !FS.initialized)
  FS.init();
FS.ignorePermissions = false;

TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

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

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};
var runDependencyWatcher = null;

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  Module['monitorRunDependencies']?.(runDependencies);

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
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

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;
function findWasmBinary() {
    var f = 'OpenB3D.wasm';
    if (!isDataURI(f)) {
      return locateFile(f);
    }
    return f;
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary
      ) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary &&
      typeof WebAssembly.instantiateStreaming == 'function' &&
      !isDataURI(binaryFile)
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid instantiateStreaming() on Node.js environment for now, as while
      // Node.js v18.1.0 implements it, it does not have a full fetch()
      // implementation yet.
      //
      // Reference:
      //   https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  return {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  }
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    

    wasmMemory = wasmExports['memory'];
    
    assert(wasmMemory, 'memory not found in wasm exports');
    updateMemoryViews();

    wasmTable = wasmExports['__indirect_function_table'];
    
    assert(wasmTable, 'table not found in wasm exports');

    addOnInit(wasmExports['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
    return wasmExports;
  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    try {
      return Module['instantiateWasm'](info, receiveInstance);
    } catch(e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
        return false;
    }
  }

  wasmBinaryFile ??= findWasmBinary();

    var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
    var exports = receiveInstantiationResult(result);
    return exports;
}

// === Body ===
// end include: preamble.js


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }
  Module['ExitStatus'] = ExitStatus;

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  Module['callRuntimeCallbacks'] = callRuntimeCallbacks;

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP64[((ptr)>>3)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }
  Module['getValue'] = getValue;

  var noExitRuntime = Module['noExitRuntime'] || true;
  Module['noExitRuntime'] = noExitRuntime;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number');
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };
  Module['ptrToString'] = ptrToString;

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': HEAP64[((ptr)>>3)] = BigInt(value); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }
  Module['setValue'] = setValue;

  var stackRestore = (val) => __emscripten_stack_restore(val);
  Module['stackRestore'] = stackRestore;

  var stackSave = () => _emscripten_stack_get_current();
  Module['stackSave'] = stackSave;

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };
  Module['warnOnce'] = warnOnce;

  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder() : undefined;
  Module['UTF8Decoder'] = UTF8Decoder;
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.  Also, use the length info to avoid running tiny
      // strings through TextDecoder, since .subarray() allocates garbage.
      // (As a tiny code save trick, compare endPtr against endIdx using a negation,
      // so that undefined/NaN means Infinity)
      while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      // If building with TextDecoder, we have already computed the string length
      // above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  Module['UTF8ArrayToString'] = UTF8ArrayToString;
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
    };
  Module['UTF8ToString'] = UTF8ToString;
  var ___assert_fail = (condition, filename, line, func) =>
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);
  Module['___assert_fail'] = ___assert_fail;

  var wasmTableMirror = [];
  Module['wasmTableMirror'] = wasmTableMirror;
  
  /** @type {WebAssembly.Table} */
  var wasmTable;
  Module['wasmTable'] = wasmTable;
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(funcPtr) == func, 'JavaScript-side Wasm function table mirror is out of date!');
      return func;
    };
  Module['getWasmTableEntry'] = getWasmTableEntry;
  var ___call_sighandler = (fp, sig) => getWasmTableEntry(fp)(sig);
  Module['___call_sighandler'] = ___call_sighandler;

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  Module['ExceptionInfo'] = ExceptionInfo;
  
  var exceptionLast = 0;
  Module['exceptionLast'] = exceptionLast;
  
  var uncaughtExceptionCount = 0;
  Module['uncaughtExceptionCount'] = uncaughtExceptionCount;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };
  Module['___cxa_throw'] = ___cxa_throw;

  /** @suppress {duplicate } */
  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  Module['syscallGetVarargI'] = syscallGetVarargI;
  var syscallGetVarargP = syscallGetVarargI;
  Module['syscallGetVarargP'] = syscallGetVarargP;
  
  
  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
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
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
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
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join:(...paths) => PATH.normalize(paths.join('/')),
  join2:(l, r) => PATH.normalize(l + '/' + r),
  };
  Module['PATH'] = PATH;
  
  var initRandomFill = () => {
      // This block is not needed on v19+ since crypto.getRandomValues is builtin
      if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require('crypto');
        return (view) => nodeCrypto.randomFillSync(view);
      }
  
      return (view) => crypto.getRandomValues(view);
    };
  Module['initRandomFill'] = initRandomFill;
  var randomFill = (view) => {
      // Lazily init on the first invocation.
      (randomFill = initRandomFill())(view);
    };
  Module['randomFill'] = randomFill;
  
  
  
  var PATH_FS = {
  resolve:(...args) => {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? args[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },
  relative:(from, to) => {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
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
      },
  };
  Module['PATH_FS'] = PATH_FS;
  
  
  
  var FS_stdin_getChar_buffer = [];
  Module['FS_stdin_getChar_buffer'] = FS_stdin_getChar_buffer;
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  Module['lengthBytesUTF8'] = lengthBytesUTF8;
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
          var u1 = str.charCodeAt(++i);
          u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  Module['stringToUTF8Array'] = stringToUTF8Array;
  /** @type {function(string, boolean=, number=)} */
  function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
  }
  Module['intArrayFromString'] = intArrayFromString;
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          // we will read data by chunks of BUFSIZE
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
  
          // For some reason we must suppress a closure warning here, even though
          // fd definitely exists on process.stdin, and is even the proper way to
          // get the fd of stdin,
          // https://github.com/nodejs/help/issues/2136#issuecomment-523649904
          // This started to happen after moving this logic out of library_tty.js,
          // so it is related to the surrounding code in some unclear manner.
          /** @suppress {missingProperties} */
          var fd = process.stdin.fd;
  
          try {
            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
          } catch(e) {
            // Cross-platform differences: on Windows, reading EOF throws an
            // exception, but on other OSes, reading EOF returns 0. Uniformize
            // behavior by treating the EOF exception to return 0.
            if (e.toString().includes('EOF')) bytesRead = 0;
            else throw e;
          }
  
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString('utf-8');
          }
        } else
        if (typeof window != 'undefined' &&
          typeof window.prompt == 'function') {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  Module['FS_stdin_getChar'] = FS_stdin_getChar;
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  Module['TTY'] = TTY;
  
  
  var zeroMemory = (address, size) => {
      HEAPU8.fill(0, address, address + size);
    };
  Module['zeroMemory'] = zeroMemory;
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  Module['alignMemory'] = alignMemory;
  var mmapAlloc = (size) => {
      size = alignMemory(size, 65536);
      var ptr = _emscripten_builtin_memalign(65536, size);
      if (ptr) zeroMemory(ptr, size);
      return ptr;
    };
  Module['mmapAlloc'] = mmapAlloc;
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
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
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
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
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },
  node_ops:{
  getattr(node) {
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
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ["mode", "atime", "mtime", "ctime"]) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to do copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  allocate(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  Module['MEMFS'] = MEMFS;
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
      return new Uint8Array(arrayBuffer);
    };
  Module['asyncLoad'] = asyncLoad;
  
  
  var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
      FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
    };
  Module['FS_createDataFile'] = FS_createDataFile;
  
  var preloadPlugins = Module['preloadPlugins'] || [];
  Module['preloadPlugins'] = preloadPlugins;
  var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      var handled = false;
      preloadPlugins.forEach((plugin) => {
        if (handled) return;
        if (plugin['canHandle'](fullname)) {
          plugin['handle'](byteArray, fullname, finish, onerror);
          handled = true;
        }
      });
      return handled;
    };
  Module['FS_handledByPreloadPlugin'] = FS_handledByPreloadPlugin;
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      function processData(byteArray) {
        function finish(byteArray) {
          preFinish?.();
          if (!dontCreateFile) {
            FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
          }
          onload?.();
          removeRunDependency(dep);
        }
        if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
          onerror?.();
          removeRunDependency(dep);
        })) {
          return;
        }
        finish(byteArray);
      }
      addRunDependency(dep);
      if (typeof url == 'string') {
        asyncLoad(url).then(processData, onerror);
      } else {
        processData(url);
      }
    };
  Module['FS_createPreloadedFile'] = FS_createPreloadedFile;
  
  var FS_modeStringToFlags = (str) => {
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  Module['FS_modeStringToFlags'] = FS_modeStringToFlags;
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  Module['FS_getMode'] = FS_getMode;
  
  
  
  
  
  
  var strError = (errno) => UTF8ToString(_strerror(errno));
  Module['strError'] = strError;
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  Module['ERRNO_CODES'] = ERRNO_CODES;
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  filesystems:null,
  syncFSRequests:0,
  readFiles:{
  },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              current = current.parent;
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
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
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
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
      },
  createNode(parent, name, mode, rdev) {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' // opening for write
              || (flags & (512 | 64))) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
  mount(type, opts, mountpoint) {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
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
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
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
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1e6,
          bfree: 5e5,
          bavail: 5e5,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
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
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
  utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          atime: atime,
          mtime: mtime
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith("/");
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below the apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },
  init(input, output, error) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
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
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
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
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText || '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (typeof XMLHttpRequest != 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
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
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
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
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  absolutePath() {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },
  createFolder() {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },
  createLink() {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },
  joinPath() {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },
  mmapAlloc() {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },
  standardizePath() {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      },
  };
  Module['FS'] = FS;
  
  var SYSCALLS = {
  DEFAULT_POLLMASK:5,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAP32[(((buf)+(12))>>2)] = stat.uid;
        HEAP32[(((buf)+(16))>>2)] = stat.gid;
        HEAP32[(((buf)+(20))>>2)] = stat.rdev;
        HEAP64[(((buf)+(24))>>3)] = BigInt(stat.size);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(40))>>3)] = BigInt(Math.floor(atime / 1000));
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(56))>>3)] = BigInt(Math.floor(mtime / 1000));
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(72))>>3)] = BigInt(Math.floor(ctime / 1000));
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(88))>>3)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAP32[(((buf)+(4))>>2)] = stats.bsize;
        HEAP32[(((buf)+(40))>>2)] = stats.bsize;
        HEAP32[(((buf)+(8))>>2)] = stats.blocks;
        HEAP32[(((buf)+(12))>>2)] = stats.bfree;
        HEAP32[(((buf)+(16))>>2)] = stats.bavail;
        HEAP32[(((buf)+(20))>>2)] = stats.files;
        HEAP32[(((buf)+(24))>>2)] = stats.ffree;
        HEAP32[(((buf)+(28))>>2)] = stats.fsid;
        HEAP32[(((buf)+(44))>>2)] = stats.flags;  // ST_NOSUID
        HEAP32[(((buf)+(36))>>2)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  Module['SYSCALLS'] = SYSCALLS;
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          stream.flags |= arg;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
      }
      return -28;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  Module['___syscall_fcntl64'] = ___syscall_fcntl64;

  
  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)>>2)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))>>2)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))>>2)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))>>2)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)>>2)];
            var c_oflag = HEAP32[(((argp)+(4))>>2)];
            var c_cflag = HEAP32[(((argp)+(8))>>2)];
            var c_lflag = HEAP32[(((argp)+(12))>>2)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)>>1)] = winsize[0];
            HEAP16[(((argp)+(2))>>1)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  Module['___syscall_ioctl'] = ___syscall_ioctl;

  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  Module['___syscall_openat'] = ___syscall_openat;

  var __abort_js = () =>
      abort('native code called abort()');
  Module['__abort_js'] = __abort_js;

  var getExecutableName = () => thisProgram || './this.program';
  Module['getExecutableName'] = getExecutableName;
  
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  Module['stringToUTF8'] = stringToUTF8;
  var __emscripten_get_progname = (str, len) => stringToUTF8(getExecutableName(), str, len);
  Module['__emscripten_get_progname'] = __emscripten_get_progname;

  var runtimeKeepaliveCounter = 0;
  Module['runtimeKeepaliveCounter'] = runtimeKeepaliveCounter;
  var __emscripten_runtime_keepalive_clear = () => {
      noExitRuntime = false;
      runtimeKeepaliveCounter = 0;
    };
  Module['__emscripten_runtime_keepalive_clear'] = __emscripten_runtime_keepalive_clear;

  var timers = {
  };
  Module['timers'] = timers;
  
  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)');
        }
      }
      quit_(1, e);
    };
  Module['handleException'] = handleException;
  
  
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  Module['keepRuntimeAlive'] = keepRuntimeAlive;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  Module['_proc_exit'] = _proc_exit;
  
  
  /** @suppress {duplicate } */
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  Module['exitJS'] = exitJS;
  var _exit = exitJS;
  Module['_exit'] = _exit;
  
  
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  Module['maybeExit'] = maybeExit;
  var callUserCallback = (func) => {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        func();
        maybeExit();
      } catch (e) {
        handleException(e);
      }
    };
  Module['callUserCallback'] = callUserCallback;
  
  
  var _emscripten_get_now = () => performance.now();
  Module['_emscripten_get_now'] = _emscripten_get_now;
  var __setitimer_js = (which, timeout_ms) => {
      // First, clear any existing timer.
      if (timers[which]) {
        clearTimeout(timers[which].id);
        delete timers[which];
      }
  
      // A timeout of zero simply cancels the current timeout so we have nothing
      // more to do.
      if (!timeout_ms) return 0;
  
      var id = setTimeout(() => {
        assert(which in timers);
        delete timers[which];
        callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
      }, timeout_ms);
      timers[which] = { id, timeout_ms };
      return 0;
    };
  Module['__setitimer_js'] = __setitimer_js;

  
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? "-" : "+";
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    };
  Module['__tzset_js'] = __tzset_js;

  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  Module['getHeapMax'] = getHeapMax;
  
  
  var growMemory = (size) => {
      var b = wasmMemory.buffer;
      var pages = ((size - b.byteLength + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${b.byteLength} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    };
  Module['growMemory'] = growMemory;
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };
  Module['_emscripten_resize_heap'] = _emscripten_resize_heap;

  var ENV = {
  };
  Module['ENV'] = ENV;
  
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  Module['getEnvStrings'] = getEnvStrings;
  
  var stringToAscii = (str, buffer) => {
      for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
        HEAP8[buffer++] = str.charCodeAt(i);
      }
      // Null-terminate the string
      HEAP8[buffer] = 0;
    };
  Module['stringToAscii'] = stringToAscii;
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      getEnvStrings().forEach((string, i) => {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(i*4))>>2)] = ptr;
        stringToAscii(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    };
  Module['_environ_get'] = _environ_get;

  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      strings.forEach((string) => bufSize += string.length + 1);
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };
  Module['_environ_sizes_get'] = _environ_sizes_get;

  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  Module['_fd_close'] = _fd_close;

  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  Module['doReadv'] = doReadv;
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  Module['_fd_read'] = _fd_read;

  
  var INT53_MAX = 9007199254740992;
  Module['INT53_MAX'] = INT53_MAX;
  
  var INT53_MIN = -9007199254740992;
  Module['INT53_MIN'] = INT53_MIN;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  Module['bigintToI53Checked'] = bigintToI53Checked;
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
    
  try {
  
      if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)>>3)] = BigInt(stream.position);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }
  Module['_fd_seek'] = _fd_seek;

  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
          // No more space to write.
          break;
        }
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  Module['doWritev'] = doWritev;
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  Module['_fd_write'] = _fd_write;

  var GLctx;
  Module['GLctx'] = GLctx;
  
  var webgl_enable_ANGLE_instanced_arrays = (ctx) => {
      // Extension available in WebGL 1 from Firefox 26 and Google Chrome 30 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('ANGLE_instanced_arrays');
      // Because this extension is a core function in WebGL 2, assign the extension entry points in place of
      // where the core functions will reside in WebGL 2. This way the calling code can call these without
      // having to dynamically branch depending if running against WebGL 1 or WebGL 2.
      if (ext) {
        ctx['vertexAttribDivisor'] = (index, divisor) => ext['vertexAttribDivisorANGLE'](index, divisor);
        ctx['drawArraysInstanced'] = (mode, first, count, primcount) => ext['drawArraysInstancedANGLE'](mode, first, count, primcount);
        ctx['drawElementsInstanced'] = (mode, count, type, indices, primcount) => ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount);
        return 1;
      }
    };
  Module['webgl_enable_ANGLE_instanced_arrays'] = webgl_enable_ANGLE_instanced_arrays;
  
  var webgl_enable_OES_vertex_array_object = (ctx) => {
      // Extension available in WebGL 1 from Firefox 25 and WebKit 536.28/desktop Safari 6.0.3 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('OES_vertex_array_object');
      if (ext) {
        ctx['createVertexArray'] = () => ext['createVertexArrayOES']();
        ctx['deleteVertexArray'] = (vao) => ext['deleteVertexArrayOES'](vao);
        ctx['bindVertexArray'] = (vao) => ext['bindVertexArrayOES'](vao);
        ctx['isVertexArray'] = (vao) => ext['isVertexArrayOES'](vao);
        return 1;
      }
    };
  Module['webgl_enable_OES_vertex_array_object'] = webgl_enable_OES_vertex_array_object;
  
  var webgl_enable_WEBGL_draw_buffers = (ctx) => {
      // Extension available in WebGL 1 from Firefox 28 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('WEBGL_draw_buffers');
      if (ext) {
        ctx['drawBuffers'] = (n, bufs) => ext['drawBuffersWEBGL'](n, bufs);
        return 1;
      }
    };
  Module['webgl_enable_WEBGL_draw_buffers'] = webgl_enable_WEBGL_draw_buffers;
  
  var webgl_enable_EXT_polygon_offset_clamp = (ctx) =>
      !!(ctx.extPolygonOffsetClamp = ctx.getExtension('EXT_polygon_offset_clamp'));
  Module['webgl_enable_EXT_polygon_offset_clamp'] = webgl_enable_EXT_polygon_offset_clamp;
  
  var webgl_enable_EXT_clip_control = (ctx) =>
      !!(ctx.extClipControl = ctx.getExtension('EXT_clip_control'));
  Module['webgl_enable_EXT_clip_control'] = webgl_enable_EXT_clip_control;
  
  var webgl_enable_WEBGL_polygon_mode = (ctx) =>
      !!(ctx.webglPolygonMode = ctx.getExtension('WEBGL_polygon_mode'));
  Module['webgl_enable_WEBGL_polygon_mode'] = webgl_enable_WEBGL_polygon_mode;
  
  var webgl_enable_WEBGL_multi_draw = (ctx) =>
      // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
      !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
  Module['webgl_enable_WEBGL_multi_draw'] = webgl_enable_WEBGL_multi_draw;
  
  var getEmscriptenSupportedExtensions = (ctx) => {
      // Restrict the list of advertised extensions to those that we actually
      // support.
      var supportedExtensions = [
        // WebGL 1 extensions
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_disjoint_timer_query',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_sRGB',
        'OES_element_index_uint',
        'OES_fbo_render_mipmap',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        // WebGL 1 and WebGL 2 extensions
        'EXT_clip_control',
        'EXT_color_buffer_half_float',
        'EXT_depth_clamp',
        'EXT_float_blend',
        'EXT_polygon_offset_clamp',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'KHR_parallel_shader_compile',
        'OES_texture_float_linear',
        'WEBGL_blend_func_extended',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_lose_context',
        'WEBGL_multi_draw',
        'WEBGL_polygon_mode'
      ];
      // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
      return (ctx.getSupportedExtensions() || []).filter(ext => supportedExtensions.includes(ext));
    };
  Module['getEmscriptenSupportedExtensions'] = getEmscriptenSupportedExtensions;
  
  
  var GL = {
  counter:1,
  buffers:[],
  programs:[],
  framebuffers:[],
  renderbuffers:[],
  textures:[],
  shaders:[],
  vaos:[],
  contexts:[],
  offscreenCanvases:{
  },
  queries:[],
  stringCache:{
  },
  unpackAlignment:4,
  unpackRowLength:0,
  recordError:(errorCode) => {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
  getNewId:(table) => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },
  genObject:(n, buffers, createFunction, objectTable
        ) => {
        for (var i = 0; i < n; i++) {
          var buffer = GLctx[createFunction]();
          var id = buffer && GL.getNewId(objectTable);
          if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
          } else {
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          }
          HEAP32[(((buffers)+(i*4))>>2)] = id;
        }
      },
  getSource:(shader, count, string, length) => {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var len = length ? HEAPU32[(((length)+(i*4))>>2)] : undefined;
          source += UTF8ToString(HEAPU32[(((string)+(i*4))>>2)], len);
        }
        return source;
      },
  createContext:(/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  
        // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL
        // context on a canvas, calling .getContext() will always return that
        // context independent of which 'webgl' or 'webgl2'
        // context version was passed. See:
        //   https://bugs.webkit.org/show_bug.cgi?id=222758
        // and:
        //   https://github.com/emscripten-core/emscripten/issues/13295.
        // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari
        // version field in above check.
        if (!canvas.getContextSafariWebGL2Fixed) {
          canvas.getContextSafariWebGL2Fixed = canvas.getContext;
          /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (Object|null)} */
          function fixedGetContext(ver, attrs) {
            var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
            return ((ver == 'webgl') == (gl instanceof WebGLRenderingContext)) ? gl : null;
          }
          canvas.getContext = fixedGetContext;
        }
  
        var ctx =
          (canvas.getContext("webgl", webGLContextAttributes)
            // https://caniuse.com/#feat=webgl
            );
  
        if (!ctx) return 0;
  
        var handle = GL.registerContext(ctx, webGLContextAttributes);
  
        return handle;
      },
  registerContext:(ctx, webGLContextAttributes) => {
        // without pthreads a context is just an integer ID
        var handle = GL.getNewId(GL.contexts);
  
        var context = {
          handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
  
        // Store the created context object so that we can access the context
        // given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }
  
        return handle;
      },
  makeContextCurrent:(contextHandle) => {
  
        // Active Emscripten GL layer context object.
        GL.currentContext = GL.contexts[contextHandle];
        // Active WebGL context object.
        Module['ctx'] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx);
      },
  getContext:(contextHandle) => {
        return GL.contexts[contextHandle];
      },
  deleteContext:(contextHandle) => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
          GL.currentContext = null;
        }
        if (typeof JSEvents == 'object') {
          // Release all JS event handlers on the DOM element that the GL context is
          // associated with since the context is now deleted.
          JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        }
        // Make sure the canvas object no longer refers to the context object so
        // there are no GC surprises.
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) {
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        }
        GL.contexts[contextHandle] = null;
      },
  initExtensions:(context) => {
        // If this function is called without a specific context object, init the
        // extensions of the currently active context.
        context ||= GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        // Detect the presence of a few extensions manually, ction GL interop
        // layer itself will need to know if they exist.
  
        // Extensions that are available in both WebGL 1 and WebGL 2
        webgl_enable_WEBGL_multi_draw(GLctx);
        webgl_enable_EXT_polygon_offset_clamp(GLctx);
        webgl_enable_EXT_clip_control(GLctx);
        webgl_enable_WEBGL_polygon_mode(GLctx);
        // Extensions that are only available in WebGL 1 (the calls will be no-ops
        // if called on a WebGL 2 context active)
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        {
          GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        }
  
        getEmscriptenSupportedExtensions(GLctx).forEach((ext) => {
          // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
          // are not enabled by default.
          if (!ext.includes('lose_context') && !ext.includes('debug')) {
            // Call .getExtension() to enable that extension permanently.
            GLctx.getExtension(ext);
          }
        });
      },
  };
  Module['GL'] = GL;
  var _glActiveTexture = (x0) => GLctx.activeTexture(x0);
  Module['_glActiveTexture'] = _glActiveTexture;

  var _glAttachShader = (program, shader) => {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    };
  Module['_glAttachShader'] = _glAttachShader;

  
  var _glBindAttribLocation = (program, index, name) => {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    };
  Module['_glBindAttribLocation'] = _glBindAttribLocation;

  var _glBindBuffer = (target, buffer) => {
  
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    };
  Module['_glBindBuffer'] = _glBindBuffer;

  var _glBindFramebuffer = (target, framebuffer) => {
  
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
  
    };
  Module['_glBindFramebuffer'] = _glBindFramebuffer;

  var _glBindRenderbuffer = (target, renderbuffer) => {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    };
  Module['_glBindRenderbuffer'] = _glBindRenderbuffer;

  var _glBindTexture = (target, texture) => {
      GLctx.bindTexture(target, GL.textures[texture]);
    };
  Module['_glBindTexture'] = _glBindTexture;

  var _glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);
  Module['_glBlendFunc'] = _glBlendFunc;

  var _glBufferData = (target, size, data, usage) => {
  
      // N.b. here first form specifies a heap subarray, second form an integer
      // size, so the ?: code here is polymorphic. It is advised to avoid
      // randomly mixing both uses in calling code, to avoid any potential JS
      // engine JIT issues.
      GLctx.bufferData(target, data ? HEAPU8.subarray(data, data+size) : size, usage);
    };
  Module['_glBufferData'] = _glBufferData;

  var _glClear = (x0) => GLctx.clear(x0);
  Module['_glClear'] = _glClear;

  var _glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);
  Module['_glClearColor'] = _glClearColor;

  var _glClearDepthf = (x0) => GLctx.clearDepth(x0);
  Module['_glClearDepthf'] = _glClearDepthf;

  var _glClearStencil = (x0) => GLctx.clearStencil(x0);
  Module['_glClearStencil'] = _glClearStencil;

  var _glColorMask = (red, green, blue, alpha) => {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    };
  Module['_glColorMask'] = _glColorMask;

  var _glCompileShader = (shader) => {
      GLctx.compileShader(GL.shaders[shader]);
    };
  Module['_glCompileShader'] = _glCompileShader;

  var _glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
  Module['_glCopyTexImage2D'] = _glCopyTexImage2D;

  var _glCreateProgram = () => {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      // Store additional information needed for each shader program:
      program.name = id;
      // Lazy cache results of
      // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
      program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
      program.uniformIdCounter = 1;
      GL.programs[id] = program;
      return id;
    };
  Module['_glCreateProgram'] = _glCreateProgram;

  var _glCreateShader = (shaderType) => {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
  
      return id;
    };
  Module['_glCreateShader'] = _glCreateShader;

  var _glCullFace = (x0) => GLctx.cullFace(x0);
  Module['_glCullFace'] = _glCullFace;

  var _glDeleteBuffers = (n, buffers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
      }
    };
  Module['_glDeleteBuffers'] = _glDeleteBuffers;

  var _glDeleteProgram = (id) => {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        // glDeleteProgram actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
    };
  Module['_glDeleteProgram'] = _glDeleteProgram;

  var _glDeleteShader = (id) => {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        // glDeleteShader actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    };
  Module['_glDeleteShader'] = _glDeleteShader;

  var _glDepthFunc = (x0) => GLctx.depthFunc(x0);
  Module['_glDepthFunc'] = _glDepthFunc;

  var _glDepthMask = (flag) => {
      GLctx.depthMask(!!flag);
    };
  Module['_glDepthMask'] = _glDepthMask;

  var _glDetachShader = (program, shader) => {
      GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
    };
  Module['_glDetachShader'] = _glDetachShader;

  var _glDisable = (x0) => GLctx.disable(x0);
  Module['_glDisable'] = _glDisable;

  var _glDisableVertexAttribArray = (index) => {
      GLctx.disableVertexAttribArray(index);
    };
  Module['_glDisableVertexAttribArray'] = _glDisableVertexAttribArray;

  var _glDrawArrays = (mode, first, count) => {
  
      GLctx.drawArrays(mode, first, count);
  
    };
  Module['_glDrawArrays'] = _glDrawArrays;

  var tempFixedLengthArray = [];
  Module['tempFixedLengthArray'] = tempFixedLengthArray;
  
  var _glDrawBuffers = (n, bufs) => {
  
      var bufArray = tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))>>2)];
      }
  
      GLctx.drawBuffers(bufArray);
    };
  Module['_glDrawBuffers'] = _glDrawBuffers;

  var _glDrawElements = (mode, count, type, indices) => {
  
      GLctx.drawElements(mode, count, type, indices);
  
    };
  Module['_glDrawElements'] = _glDrawElements;

  var _glEnable = (x0) => GLctx.enable(x0);
  Module['_glEnable'] = _glEnable;

  var _glEnableVertexAttribArray = (index) => {
      GLctx.enableVertexAttribArray(index);
    };
  Module['_glEnableVertexAttribArray'] = _glEnableVertexAttribArray;

  var _glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    };
  Module['_glFramebufferRenderbuffer'] = _glFramebufferRenderbuffer;

  var _glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    };
  Module['_glFramebufferTexture2D'] = _glFramebufferTexture2D;

  var _glGenBuffers = (n, buffers) => {
      GL.genObject(n, buffers, 'createBuffer', GL.buffers
        );
    };
  Module['_glGenBuffers'] = _glGenBuffers;

  var _glGenFramebuffers = (n, ids) => {
      GL.genObject(n, ids, 'createFramebuffer', GL.framebuffers
        );
    };
  Module['_glGenFramebuffers'] = _glGenFramebuffers;

  var _glGenRenderbuffers = (n, renderbuffers) => {
      GL.genObject(n, renderbuffers, 'createRenderbuffer', GL.renderbuffers
        );
    };
  Module['_glGenRenderbuffers'] = _glGenRenderbuffers;

  var _glGenTextures = (n, textures) => {
      GL.genObject(n, textures, 'createTexture', GL.textures
        );
    };
  Module['_glGenTextures'] = _glGenTextures;

  var _glGenerateMipmap = (x0) => GLctx.generateMipmap(x0);
  Module['_glGenerateMipmap'] = _glGenerateMipmap;

  
  var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
      program = GL.programs[program];
      var info = GLctx[funcName](program, index);
      if (info) {
        // If an error occurs, nothing will be written to length, size and type and name.
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
        if (size) HEAP32[((size)>>2)] = info.size;
        if (type) HEAP32[((type)>>2)] = info.type;
      }
    };
  Module['__glGetActiveAttribOrUniform'] = __glGetActiveAttribOrUniform;
  
  var _glGetActiveAttrib = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveAttrib', program, index, bufSize, length, size, type, name);
  Module['_glGetActiveAttrib'] = _glGetActiveAttrib;

  
  var _glGetActiveUniform = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveUniform', program, index, bufSize, length, size, type, name);
  Module['_glGetActiveUniform'] = _glGetActiveUniform;

  
  var _glGetAttribLocation = (program, name) =>
      GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
  Module['_glGetAttribLocation'] = _glGetAttribLocation;

  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAP32[(((ptr)+(4))>>2)] * 4294967296;
    };
  Module['readI53FromI64'] = readI53FromI64;
  
  var readI53FromU64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAPU32[(((ptr)+(4))>>2)] * 4294967296;
    };
  Module['readI53FromU64'] = readI53FromU64;
  var writeI53ToI64 = (ptr, num) => {
      HEAPU32[((ptr)>>2)] = num;
      var lower = HEAPU32[((ptr)>>2)];
      HEAPU32[(((ptr)+(4))>>2)] = (num - lower)/4294967296;
      var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
      var offset = ((ptr)>>2);
      if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString(HEAPU32[offset])}, hi=${ptrToString(HEAPU32[offset+1])}, which deserializes back to ${deserialized} instead!`);
    };
  Module['writeI53ToI64'] = writeI53ToI64;
  
  var emscriptenWebGLGet = (name_, p, type) => {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null
      // pointer should be treated.  Testing on desktop core GL 3, the application
      // crashes on glGetIntegerv to a null pointer, but better to report an error
      // instead of doing anything random.
      if (!p) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch (name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type != 0 && type != 1) {
            GL.recordError(0x500); // GL_INVALID_ENUM
          }
          // Do not write anything to the out pointer, since no binary formats are
          // supported.
          return;
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
          // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
          // queried for length), so implement it ourselves to allow C++ GLES2
          // code get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats ? formats.length : 0;
          break;
  
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          case "object":
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound -
              // perhaps nothing is bound), but otherwise can mean an invalid
              // name_, which we need to report as an error
              switch (name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x85B5: // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0: HEAP32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 2: HEAPF32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 4: HEAP8[(p)+(i)] = result[i] ? 1 : 0; break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch(e) {
                GL.recordError(0x500); // GL_INVALID_ENUM
                err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                return;
              }
            }
            break;
          default:
            GL.recordError(0x500); // GL_INVALID_ENUM
            err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof(result)}!`);
            return;
        }
      }
  
      switch (type) {
        case 1: writeI53ToI64(p, ret); break;
        case 0: HEAP32[((p)>>2)] = ret; break;
        case 2:   HEAPF32[((p)>>2)] = ret; break;
        case 4: HEAP8[p] = ret ? 1 : 0; break;
      }
    };
  Module['emscriptenWebGLGet'] = emscriptenWebGLGet;
  
  var _glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
  Module['_glGetIntegerv'] = _glGetIntegerv;

  var _glGetProgramiv = (program, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      program = GL.programs[program];
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)] = log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        if (!program.maxUniformLength) {
          var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
          for (var i = 0; i < numActiveUniforms; ++i) {
            program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (!program.maxAttributeLength) {
          var numActiveAttributes = GLctx.getProgramParameter(program, 0x8B89/*GL_ACTIVE_ATTRIBUTES*/);
          for (var i = 0; i < numActiveAttributes; ++i) {
            program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (!program.maxUniformBlockNameLength) {
          var numActiveUniformBlocks = GLctx.getProgramParameter(program, 0x8A36/*GL_ACTIVE_UNIFORM_BLOCKS*/);
          for (var i = 0; i < numActiveUniformBlocks; ++i) {
            program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getProgramParameter(program, pname);
      }
    };
  Module['_glGetProgramiv'] = _glGetProgramiv;

  var _glGetShaderiv = (shader, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        // The GLES2 specification says that if the shader has an empty info log,
        // a value of 0 is returned. Otherwise the log has a null char appended.
        // (An empty string is falsey, so we can just check that instead of
        // looking at log.length.)
        var logLength = log ? log.length + 1 : 0;
        HEAP32[((p)>>2)] = logLength;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        // source may be a null, or the empty string, both of which are falsey
        // values that we report a 0 length for.
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[((p)>>2)] = sourceLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    };
  Module['_glGetShaderiv'] = _glGetShaderiv;

  /** @suppress {checkTypes} */
  var jstoi_q = (str) => parseInt(str);
  Module['jstoi_q'] = jstoi_q;
  
  /** @noinline */
  var webglGetLeftBracePos = (name) => name.slice(-1) == ']' && name.lastIndexOf('[');
  Module['webglGetLeftBracePos'] = webglGetLeftBracePos;
  
  var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
      var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
        i, j;
  
      // On the first time invocation of glGetUniformLocation on this shader program:
      // initialize cache data structures and discover which uniforms are arrays.
      if (!uniformLocsById) {
        // maps GLint integer locations to WebGLUniformLocations
        program.uniformLocsById = uniformLocsById = {};
        // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
        program.uniformArrayNamesById = {};
  
        var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
        for (i = 0; i < numActiveUniforms; ++i) {
          var u = GLctx.getActiveUniform(program, i);
          var nm = u.name;
          var sz = u.size;
          var lb = webglGetLeftBracePos(nm);
          var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
  
          // Assign a new location.
          var id = program.uniformIdCounter;
          program.uniformIdCounter += sz;
          // Eagerly get the location of the uniformArray[0] base element.
          // The remaining indices >0 will be left for lazy evaluation to
          // improve performance. Those may never be needed to fetch, if the
          // application fills arrays always in full starting from the first
          // element of the array.
          uniformSizeAndIdsByName[arrayName] = [sz, id];
  
          // Store placeholder integers in place that highlight that these
          // >0 index locations are array indices pending population.
          for (j = 0; j < sz; ++j) {
            uniformLocsById[id] = j;
            program.uniformArrayNamesById[id++] = arrayName;
          }
        }
      }
    };
  Module['webglPrepareUniformLocationsBeforeFirstUse'] = webglPrepareUniformLocationsBeforeFirstUse;
  
  
  
  var _glGetUniformLocation = (program, name) => {
  
      name = UTF8ToString(name);
  
      if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById; // Maps GLuint -> WebGLUniformLocation
        var arrayIndex = 0;
        var uniformBaseName = name;
  
        // Invariant: when populating integer IDs for uniform locations, we must
        // maintain the precondition that arrays reside in contiguous addresses,
        // i.e. for a 'vec4 colors[10];', colors[4] must be at location
        // colors[0]+4.  However, user might call glGetUniformLocation(program,
        // "colors") for an array, so we cannot discover based on the user input
        // arguments whether the uniform we are dealing with is an array. The only
        // way to discover which uniforms are arrays is to enumerate over all the
        // active uniforms in the program.
        var leftBrace = webglGetLeftBracePos(name);
  
        // If user passed an array accessor "[index]", parse the array index off the accessor.
        if (leftBrace > 0) {
          arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0; // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
          uniformBaseName = name.slice(0, leftBrace);
        }
  
        // Have we cached the location of this uniform before?
        // A pair [array length, GLint of the uniform location]
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  
        // If an uniform with this name exists, and if its index is within the
        // array limits (if it's even an array), query the WebGLlocation, or
        // return an existing cached location.
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
          arrayIndex += sizeAndId[1]; // Add the base location of the uniform to the array index offset.
          if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
            return arrayIndex;
          }
        }
      }
      else {
        // N.b. we are currently unable to distinguish between GL program IDs that
        // never existed vs GL program IDs that have been deleted, so report
        // GL_INVALID_VALUE in both cases.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
      }
      return -1;
    };
  Module['_glGetUniformLocation'] = _glGetUniformLocation;

  var _glLinkProgram = (program) => {
      program = GL.programs[program];
      GLctx.linkProgram(program);
      // Invalidate earlier computed uniform->ID mappings, those have now become stale
      program.uniformLocsById = 0; // Mark as null-like so that glGetUniformLocation() knows to populate this again.
      program.uniformSizeAndIdsByName = {};
  
    };
  Module['_glLinkProgram'] = _glLinkProgram;

  var _glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);
  Module['_glPolygonOffset'] = _glPolygonOffset;

  var _glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);
  Module['_glRenderbufferStorage'] = _glRenderbufferStorage;

  var _glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
  Module['_glScissor'] = _glScissor;

  var _glShaderSource = (shader, count, string, length) => {
      var source = GL.getSource(shader, count, string, length);
  
      GLctx.shaderSource(GL.shaders[shader], source);
    };
  Module['_glShaderSource'] = _glShaderSource;

  var _glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);
  Module['_glStencilFunc'] = _glStencilFunc;

  var _glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);
  Module['_glStencilOp'] = _glStencilOp;

  var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
      function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
      }
      var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
      return height * alignedRowSize;
    };
  Module['computeUnpackAlignedImageSize'] = computeUnpackAlignedImageSize;
  
  var colorChannelsInGlTextureFormat = (format) => {
      // Micro-optimizations for size: map format to size by subtracting smallest
      // enum value (0x1902) from all values first.  Also omit the most common
      // size value (1) from the list, which is assumed by formats not on the
      // list.
      var colorChannels = {
        // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
        // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
        5: 3,
        6: 4,
        // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
        8: 2,
        29502: 3,
        29504: 4,
      };
      return colorChannels[format - 0x1902]||1;
    };
  Module['colorChannelsInGlTextureFormat'] = colorChannelsInGlTextureFormat;
  
  var heapObjectForWebGLType = (type) => {
      // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
      // smaller values for the heap, for shorter generated code size.
      // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
      // (since most types are HEAPU16)
      type -= 0x1400;
  
      if (type == 1) return HEAPU8;
  
      if (type == 4) return HEAP32;
  
      if (type == 6) return HEAPF32;
  
      if (type == 5
        || type == 28922
        )
        return HEAPU32;
  
      return HEAPU16;
    };
  Module['heapObjectForWebGLType'] = heapObjectForWebGLType;
  
  var toTypedArrayIndex = (pointer, heap) =>
      pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));
  Module['toTypedArrayIndex'] = toTypedArrayIndex;
  
  var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
      var heap = heapObjectForWebGLType(type);
      var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
      var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
      return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
    };
  Module['emscriptenWebGLGetTexPixelData'] = emscriptenWebGLGetTexPixelData;
  
  var _glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    };
  Module['_glTexImage2D'] = _glTexImage2D;

  var _glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
  Module['_glTexParameteri'] = _glTexParameteri;

  var webglGetUniformLocation = (location) => {
      var p = GLctx.currentProgram;
  
      if (p) {
        var webglLoc = p.uniformLocsById[location];
        // p.uniformLocsById[location] stores either an integer, or a
        // WebGLUniformLocation.
        // If an integer, we have not yet bound the location, so do it now. The
        // integer value specifies the array index we should bind to.
        if (typeof webglLoc == 'number') {
          p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ''));
        }
        // Else an already cached WebGLUniformLocation, return it.
        return webglLoc;
      } else {
        GL.recordError(0x502/*GL_INVALID_OPERATION*/);
      }
    };
  Module['webglGetUniformLocation'] = webglGetUniformLocation;
  
  var _glUniform1f = (location, v0) => {
      GLctx.uniform1f(webglGetUniformLocation(location), v0);
    };
  Module['_glUniform1f'] = _glUniform1f;

  
  var miniTempWebGLFloatBuffers = [];
  Module['miniTempWebGLFloatBuffers'] = miniTempWebGLFloatBuffers;
  
  var _glUniform1fv = (location, count, value) => {
  
      if (count <= 288) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*4)>>2));
      }
      GLctx.uniform1fv(webglGetUniformLocation(location), view);
    };
  Module['_glUniform1fv'] = _glUniform1fv;

  
  var _glUniform1i = (location, v0) => {
      GLctx.uniform1i(webglGetUniformLocation(location), v0);
    };
  Module['_glUniform1i'] = _glUniform1i;

  
  var _glUniform2f = (location, v0, v1) => {
      GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
    };
  Module['_glUniform2f'] = _glUniform2f;

  
  var _glUniform2i = (location, v0, v1) => {
      GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
    };
  Module['_glUniform2i'] = _glUniform2i;

  
  var miniTempWebGLIntBuffers = [];
  Module['miniTempWebGLIntBuffers'] = miniTempWebGLIntBuffers;
  
  var _glUniform2iv = (location, count, value) => {
  
      if (count <= 144) {
        // avoid allocation when uploading few enough uniforms
        count *= 2;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 2) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*8)>>2));
      }
      GLctx.uniform2iv(webglGetUniformLocation(location), view);
    };
  Module['_glUniform2iv'] = _glUniform2iv;

  
  var _glUniform3f = (location, v0, v1, v2) => {
      GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
    };
  Module['_glUniform3f'] = _glUniform3f;

  
  
  var _glUniform3fv = (location, count, value) => {
  
      if (count <= 96) {
        // avoid allocation when uploading few enough uniforms
        count *= 3;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 3) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*12)>>2));
      }
      GLctx.uniform3fv(webglGetUniformLocation(location), view);
    };
  Module['_glUniform3fv'] = _glUniform3fv;

  
  var _glUniform3i = (location, v0, v1, v2) => {
      GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
    };
  Module['_glUniform3i'] = _glUniform3i;

  
  var _glUniform4f = (location, v0, v1, v2, v3) => {
      GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
    };
  Module['_glUniform4f'] = _glUniform4f;

  
  var _glUniform4i = (location, v0, v1, v2, v3) => {
      GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
    };
  Module['_glUniform4i'] = _glUniform4i;

  
  
  var _glUniformMatrix3fv = (location, count, transpose, value) => {
  
      if (count <= 32) {
        // avoid allocation when uploading few enough uniforms
        count *= 9;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 9) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*36)>>2));
      }
      GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
    };
  Module['_glUniformMatrix3fv'] = _glUniformMatrix3fv;

  
  
  var _glUniformMatrix4fv = (location, count, transpose, value) => {
  
      if (count <= 18) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[16*count];
        // hoist the heap out of the loop for size and for pthreads+growth.
        var heap = HEAPF32;
        value = ((value)>>2);
        count *= 16;
        for (var i = 0; i < count; i += 16) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
          view[i + 4] = heap[dst + 4];
          view[i + 5] = heap[dst + 5];
          view[i + 6] = heap[dst + 6];
          view[i + 7] = heap[dst + 7];
          view[i + 8] = heap[dst + 8];
          view[i + 9] = heap[dst + 9];
          view[i + 10] = heap[dst + 10];
          view[i + 11] = heap[dst + 11];
          view[i + 12] = heap[dst + 12];
          view[i + 13] = heap[dst + 13];
          view[i + 14] = heap[dst + 14];
          view[i + 15] = heap[dst + 15];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*64)>>2));
      }
      GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
    };
  Module['_glUniformMatrix4fv'] = _glUniformMatrix4fv;

  var _glUseProgram = (program) => {
      program = GL.programs[program];
      GLctx.useProgram(program);
      // Record the currently active program so that we can access the uniform
      // mapping table of that program.
      GLctx.currentProgram = program;
    };
  Module['_glUseProgram'] = _glUseProgram;

  var _glValidateProgram = (program) => {
      GLctx.validateProgram(GL.programs[program]);
    };
  Module['_glValidateProgram'] = _glValidateProgram;

  var _glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);
  Module['_glVertexAttrib1f'] = _glVertexAttrib1f;

  var _glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);
  Module['_glVertexAttrib2f'] = _glVertexAttrib2f;

  var _glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);
  Module['_glVertexAttrib3f'] = _glVertexAttrib3f;

  var _glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
  Module['_glVertexAttrib4f'] = _glVertexAttrib4f;

  var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    };
  Module['_glVertexAttribPointer'] = _glVertexAttribPointer;

  var _glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);
  Module['_glViewport'] = _glViewport;


  var getCFunc = (ident) => {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    };
  Module['getCFunc'] = getCFunc;
  
  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };
  Module['writeArrayToMemory'] = writeArrayToMemory;
  
  
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  Module['stackAlloc'] = stackAlloc;
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  Module['stringToUTF8OnStack'] = stringToUTF8OnStack;
  
  
  
  
  
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Arguments|Array=} args
     * @param {Object=} opts
     */
  var ccall = (ident, returnType, argTypes, args, opts) => {
      // For fast lookup of conversion functions
      var toC = {
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            ret = stringToUTF8OnStack(str);
          }
          return ret;
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          return UTF8ToString(ret);
        }
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func(...cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
  
      ret = onDone(ret);
      return ret;
    };
  Module['ccall'] = ccall;

  
  
    /**
     * @param {string=} returnType
     * @param {Array=} argTypes
     * @param {Object=} opts
     */
  var cwrap = (ident, returnType, argTypes, opts) => {
      return (...args) => ccall(ident, returnType, argTypes, args, opts);
    };
  Module['cwrap'] = cwrap;






  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.staticInit();
  // Set module methods based on EXPORTED_RUNTIME_METHODS
  ;
for (var i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (/**@suppress{duplicate}*/var i = 0; i <= 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i);
  };
var miniTempWebGLIntBuffersStorage = new Int32Array(288);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (/**@suppress{duplicate}*/var i = 0; i <= 288; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i);
  };
function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var wasmImports = {
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __call_sighandler: ___call_sighandler,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _emscripten_get_progname: __emscripten_get_progname,
  /** @export */
  _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
  /** @export */
  _setitimer_js: __setitimer_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  glActiveTexture: _glActiveTexture,
  /** @export */
  glAttachShader: _glAttachShader,
  /** @export */
  glBindAttribLocation: _glBindAttribLocation,
  /** @export */
  glBindBuffer: _glBindBuffer,
  /** @export */
  glBindFramebuffer: _glBindFramebuffer,
  /** @export */
  glBindRenderbuffer: _glBindRenderbuffer,
  /** @export */
  glBindTexture: _glBindTexture,
  /** @export */
  glBlendFunc: _glBlendFunc,
  /** @export */
  glBufferData: _glBufferData,
  /** @export */
  glClear: _glClear,
  /** @export */
  glClearColor: _glClearColor,
  /** @export */
  glClearDepthf: _glClearDepthf,
  /** @export */
  glClearStencil: _glClearStencil,
  /** @export */
  glColorMask: _glColorMask,
  /** @export */
  glCompileShader: _glCompileShader,
  /** @export */
  glCopyTexImage2D: _glCopyTexImage2D,
  /** @export */
  glCreateProgram: _glCreateProgram,
  /** @export */
  glCreateShader: _glCreateShader,
  /** @export */
  glCullFace: _glCullFace,
  /** @export */
  glDeleteBuffers: _glDeleteBuffers,
  /** @export */
  glDeleteProgram: _glDeleteProgram,
  /** @export */
  glDeleteShader: _glDeleteShader,
  /** @export */
  glDepthFunc: _glDepthFunc,
  /** @export */
  glDepthMask: _glDepthMask,
  /** @export */
  glDetachShader: _glDetachShader,
  /** @export */
  glDisable: _glDisable,
  /** @export */
  glDisableVertexAttribArray: _glDisableVertexAttribArray,
  /** @export */
  glDrawArrays: _glDrawArrays,
  /** @export */
  glDrawBuffers: _glDrawBuffers,
  /** @export */
  glDrawElements: _glDrawElements,
  /** @export */
  glEnable: _glEnable,
  /** @export */
  glEnableVertexAttribArray: _glEnableVertexAttribArray,
  /** @export */
  glFramebufferRenderbuffer: _glFramebufferRenderbuffer,
  /** @export */
  glFramebufferTexture2D: _glFramebufferTexture2D,
  /** @export */
  glGenBuffers: _glGenBuffers,
  /** @export */
  glGenFramebuffers: _glGenFramebuffers,
  /** @export */
  glGenRenderbuffers: _glGenRenderbuffers,
  /** @export */
  glGenTextures: _glGenTextures,
  /** @export */
  glGenerateMipmap: _glGenerateMipmap,
  /** @export */
  glGetActiveAttrib: _glGetActiveAttrib,
  /** @export */
  glGetActiveUniform: _glGetActiveUniform,
  /** @export */
  glGetAttribLocation: _glGetAttribLocation,
  /** @export */
  glGetIntegerv: _glGetIntegerv,
  /** @export */
  glGetProgramiv: _glGetProgramiv,
  /** @export */
  glGetShaderiv: _glGetShaderiv,
  /** @export */
  glGetUniformLocation: _glGetUniformLocation,
  /** @export */
  glLinkProgram: _glLinkProgram,
  /** @export */
  glPolygonOffset: _glPolygonOffset,
  /** @export */
  glRenderbufferStorage: _glRenderbufferStorage,
  /** @export */
  glScissor: _glScissor,
  /** @export */
  glShaderSource: _glShaderSource,
  /** @export */
  glStencilFunc: _glStencilFunc,
  /** @export */
  glStencilOp: _glStencilOp,
  /** @export */
  glTexImage2D: _glTexImage2D,
  /** @export */
  glTexParameteri: _glTexParameteri,
  /** @export */
  glUniform1f: _glUniform1f,
  /** @export */
  glUniform1fv: _glUniform1fv,
  /** @export */
  glUniform1i: _glUniform1i,
  /** @export */
  glUniform2f: _glUniform2f,
  /** @export */
  glUniform2i: _glUniform2i,
  /** @export */
  glUniform2iv: _glUniform2iv,
  /** @export */
  glUniform3f: _glUniform3f,
  /** @export */
  glUniform3fv: _glUniform3fv,
  /** @export */
  glUniform3i: _glUniform3i,
  /** @export */
  glUniform4f: _glUniform4f,
  /** @export */
  glUniform4i: _glUniform4i,
  /** @export */
  glUniformMatrix3fv: _glUniformMatrix3fv,
  /** @export */
  glUniformMatrix4fv: _glUniformMatrix4fv,
  /** @export */
  glUseProgram: _glUseProgram,
  /** @export */
  glValidateProgram: _glValidateProgram,
  /** @export */
  glVertexAttrib1f: _glVertexAttrib1f,
  /** @export */
  glVertexAttrib2f: _glVertexAttrib2f,
  /** @export */
  glVertexAttrib3f: _glVertexAttrib3f,
  /** @export */
  glVertexAttrib4f: _glVertexAttrib4f,
  /** @export */
  glVertexAttribPointer: _glVertexAttribPointer,
  /** @export */
  glViewport: _glViewport,
  /** @export */
  proc_exit: _proc_exit
};
var wasmExports;
createWasm();
var ___wasm_call_ctors = createExportWrapper('__wasm_call_ctors', 0);
var __Z11LoadAnimB3DNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEP6Entity = Module['__Z11LoadAnimB3DNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEP6Entity'] = createExportWrapper('_Z11LoadAnimB3DNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEP6Entity', 2);
var __ZN4File16ReadResourceFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN4File16ReadResourceFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN4File16ReadResourceFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 1);
var __ZdlPvm = Module['__ZdlPvm'] = createExportWrapper('_ZdlPvm', 2);
var __Z7ReadTagP4File = Module['__Z7ReadTagP4File'] = createExportWrapper('_Z7ReadTagP4File', 2);
var __ZN4File7ReadIntEv = Module['__ZN4File7ReadIntEv'] = createExportWrapper('_ZN4File7ReadIntEv', 1);
var __Z6NewTagNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z6NewTagNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z6NewTagNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 1);
var __ZN4File7FilePosEv = Module['__ZN4File7FilePosEv'] = createExportWrapper('_ZN4File7FilePosEv', 1);
var __ZN6Entity13CountChildrenEv = Module['__ZN6Entity13CountChildrenEv'] = createExportWrapper('_ZN6Entity13CountChildrenEv', 1);
var __ZN6Entity8GetChildEi = Module['__ZN6Entity8GetChildEi'] = createExportWrapper('_ZN6Entity8GetChildEi', 2);
var __Znwm = Module['__Znwm'] = createExportWrapper('_Znwm', 1);
var __Z5TagIDNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z5TagIDNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z5TagIDNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 1);
var __ZN4File3EofEv = Module['__ZN4File3EofEv'] = createExportWrapper('_ZN4File3EofEv', 1);
var __Z13b3dReadStringP4File = Module['__Z13b3dReadStringP4File'] = createExportWrapper('_Z13b3dReadStringP4File', 2);
var __ZN4File9ReadFloatEv = Module['__ZN4File9ReadFloatEv'] = createExportWrapper('_ZN4File9ReadFloatEv', 1);
var __ZN7Texture11LoadTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN7Texture11LoadTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN7Texture11LoadTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 2);
var __ZN5Brush11CreateBrushEfff = Module['__ZN5Brush11CreateBrushEfff'] = createExportWrapper('_ZN5Brush11CreateBrushEfff', 3);
var __ZN4File8ReadByteEv = Module['__ZN4File8ReadByteEv'] = createExportWrapper('_ZN4File8ReadByteEv', 1);
var __ZN6EntityC2Ev = Module['__ZN6EntityC2Ev'] = createExportWrapper('_ZN6EntityC2Ev', 1);
var __ZN6Entity9AddParentEPS_ = Module['__ZN6Entity9AddParentEPS_'] = createExportWrapper('_ZN6Entity9AddParentEPS_', 2);
var ___dynamic_cast = Module['___dynamic_cast'] = createExportWrapper('__dynamic_cast', 4);
var __ZN6Matrix9Multiply2ERS_ = Module['__ZN6Matrix9Multiply2ERS_'] = createExportWrapper('_ZN6Matrix9Multiply2ERS_', 2);
var __ZN7SurfaceC1Ev = Module['__ZN7SurfaceC1Ev'] = createExportWrapper('_ZN7SurfaceC1Ev', 1);
var __ZNSt3__26vectorIfNS_9allocatorIfEEE18__assign_with_sizeB8ne190106IPfS5_EEvT_T0_l = Module['__ZNSt3__26vectorIfNS_9allocatorIfEEE18__assign_with_sizeB8ne190106IPfS5_EEvT_T0_l'] = createExportWrapper('_ZNSt3__26vectorIfNS_9allocatorIfEEE18__assign_with_sizeB8ne190106IPfS5_EEvT_T0_l', 4);
var __Z9TrimVertsP7Surface = Module['__Z9TrimVertsP7Surface'] = createExportWrapper('_Z9TrimVertsP7Surface', 1);
var __ZN4Mesh13CreateSurfaceEP5Brush = Module['__ZN4Mesh13CreateSurfaceEP5Brush'] = createExportWrapper('_ZN4Mesh13CreateSurfaceEP5Brush', 2);
var __ZN7Surface11AddTriangleEttt = Module['__ZN7Surface11AddTriangleEttt'] = createExportWrapper('_ZN7Surface11AddTriangleEttt', 4);
var __ZN6Entity11PaintEntityER5Brushi = Module['__ZN6Entity11PaintEntityER5Brushi'] = createExportWrapper('_ZN6Entity11PaintEntityER5Brushi', 3);
var __ZN7Surface12PaintSurfaceEP5Brush = Module['__ZN7Surface12PaintSurfaceEP5Brush'] = createExportWrapper('_ZN7Surface12PaintSurfaceEP5Brush', 2);
var __ZN4Mesh13UpdateNormalsEv = Module['__ZN4Mesh13UpdateNormalsEv'] = createExportWrapper('_ZN4Mesh13UpdateNormalsEv', 1);
var __ZN7Surface9AddVertexEffffff = Module['__ZN7Surface9AddVertexEffffff'] = createExportWrapper('_ZN7Surface9AddVertexEffffff', 7);
var __ZN7Surface11VertexColorEiffff = Module['__ZN7Surface11VertexColorEiffff'] = createExportWrapper('_ZN7Surface11VertexColorEiffff', 6);
var __ZN7Surface12VertexNormalEifff = Module['__ZN7Surface12VertexNormalEifff'] = createExportWrapper('_ZN7Surface12VertexNormalEifff', 5);
var __ZN7Surface15VertexTexCoordsEifffi = Module['__ZN7Surface15VertexTexCoordsEifffi'] = createExportWrapper('_ZN7Surface15VertexTexCoordsEifffi', 6);
var __ZN4File9CloseFileEv = Module['__ZN4File9CloseFileEv'] = createExportWrapper('_ZN4File9CloseFileEv', 1);
var __ZN5Brush9FreeBrushEv = Module['__ZN5Brush9FreeBrushEv'] = createExportWrapper('_ZN5Brush9FreeBrushEv', 1);
var __ZN6Entity9MQ_UpdateEv = Module['__ZN6Entity9MQ_UpdateEv'] = createExportWrapper('_ZN6Entity9MQ_UpdateEv', 1);
var __ZN4File8SeekFileEi = Module['__ZN4File8SeekFileEi'] = createExportWrapper('_ZN4File8SeekFileEi', 2);
var _memcmp = createExportWrapper('memcmp', 3);
var __ZNSt12length_errorD1Ev = Module['__ZNSt12length_errorD1Ev'] = createExportWrapper('_ZNSt12length_errorD1Ev', 1);
var ___cxa_allocate_exception = Module['___cxa_allocate_exception'] = createExportWrapper('__cxa_allocate_exception', 1);
var __ZNSt20bad_array_new_lengthD1Ev = Module['__ZNSt20bad_array_new_lengthD1Ev'] = createExportWrapper('_ZNSt20bad_array_new_lengthD1Ev', 1);
var __ZNSt20bad_array_new_lengthC1Ev = Module['__ZNSt20bad_array_new_lengthC1Ev'] = createExportWrapper('_ZNSt20bad_array_new_lengthC1Ev', 1);
var __ZNSt12out_of_rangeD1Ev = Module['__ZNSt12out_of_rangeD1Ev'] = createExportWrapper('_ZNSt12out_of_rangeD1Ev', 1);
var __Z4LeftNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi = Module['__Z4LeftNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi'] = createExportWrapper('_Z4LeftNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi', 3);
var __Z5RightNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj = Module['__Z5RightNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj'] = createExportWrapper('_Z5RightNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj', 3);
var __Z3MidNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEii = Module['__Z3MidNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEii'] = createExportWrapper('_Z3MidNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEii', 4);
var __Z3LenNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z3LenNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z3LenNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 1);
var __Z7ReplaceNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_S5_ = Module['__Z7ReplaceNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_S5_'] = createExportWrapper('_Z7ReplaceNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_S5_', 4);
var __Z5InstrNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i = Module['__Z5InstrNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i'] = createExportWrapper('_Z5InstrNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i', 3);
var __Z5UpperNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z5UpperNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z5UpperNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 2);
var __Z5LowerNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z5LowerNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z5LowerNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 2);
var __Z4TrimNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z4TrimNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z4TrimNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 2);
var __Z3Chri = Module['__Z3Chri'] = createExportWrapper('_Z3Chri', 2);
var __Z3AscNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE = Module['__Z3AscNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'] = createExportWrapper('_Z3AscNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE', 1);
var __Z5SplitNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i = Module['__Z5SplitNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i'] = createExportWrapper('_Z5SplitNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEES5_i', 4);
var __ZN7SurfaceC2Ev = Module['__ZN7SurfaceC2Ev'] = createExportWrapper('_ZN7SurfaceC2Ev', 1);
var __ZN7SurfaceD2Ev = Module['__ZN7SurfaceD2Ev'] = createExportWrapper('_ZN7SurfaceD2Ev', 1);
var __ZN7Surface7FreeVBOEv = Module['__ZN7Surface7FreeVBOEv'] = createExportWrapper('_ZN7Surface7FreeVBOEv', 1);
var __ZN7Surface4CopyEv = Module['__ZN7Surface4CopyEv'] = createExportWrapper('_ZN7Surface4CopyEv', 1);
var __ZNSt3__26vectorItNS_9allocatorItEEE18__assign_with_sizeB8ne190106IPtS5_EEvT_T0_l = Module['__ZNSt3__26vectorItNS_9allocatorItEEE18__assign_with_sizeB8ne190106IPtS5_EEvT_T0_l'] = createExportWrapper('_ZNSt3__26vectorItNS_9allocatorItEEE18__assign_with_sizeB8ne190106IPtS5_EEvT_T0_l', 4);
var __ZNSt3__26vectorIiNS_9allocatorIiEEE18__assign_with_sizeB8ne190106IPiS5_EEvT_T0_l = Module['__ZNSt3__26vectorIiNS_9allocatorIiEEE18__assign_with_sizeB8ne190106IPiS5_EEvT_T0_l'] = createExportWrapper('_ZNSt3__26vectorIiNS_9allocatorIiEEE18__assign_with_sizeB8ne190106IPiS5_EEvT_T0_l', 4);
var __ZN7Surface12ClearSurfaceEii = Module['__ZN7Surface12ClearSurfaceEii'] = createExportWrapper('_ZN7Surface12ClearSurfaceEii', 3);
var __ZN7Surface13CountVerticesEv = Module['__ZN7Surface13CountVerticesEv'] = createExportWrapper('_ZN7Surface13CountVerticesEv', 1);
var __ZN7Surface14CountTrianglesEv = Module['__ZN7Surface14CountTrianglesEv'] = createExportWrapper('_ZN7Surface14CountTrianglesEv', 1);
var __ZN7Surface12VertexCoordsEifff = Module['__ZN7Surface12VertexCoordsEifff'] = createExportWrapper('_ZN7Surface12VertexCoordsEifff', 5);
var __ZN7Surface7VertexXEi = Module['__ZN7Surface7VertexXEi'] = createExportWrapper('_ZN7Surface7VertexXEi', 2);
var __ZN7Surface7VertexYEi = Module['__ZN7Surface7VertexYEi'] = createExportWrapper('_ZN7Surface7VertexYEi', 2);
var __ZN7Surface7VertexZEi = Module['__ZN7Surface7VertexZEi'] = createExportWrapper('_ZN7Surface7VertexZEi', 2);
var __ZN7Surface9VertexRedEi = Module['__ZN7Surface9VertexRedEi'] = createExportWrapper('_ZN7Surface9VertexRedEi', 2);
var __ZN7Surface11VertexGreenEi = Module['__ZN7Surface11VertexGreenEi'] = createExportWrapper('_ZN7Surface11VertexGreenEi', 2);
var __ZN7Surface10VertexBlueEi = Module['__ZN7Surface10VertexBlueEi'] = createExportWrapper('_ZN7Surface10VertexBlueEi', 2);
var __ZN7Surface11VertexAlphaEi = Module['__ZN7Surface11VertexAlphaEi'] = createExportWrapper('_ZN7Surface11VertexAlphaEi', 2);
var __ZN7Surface8VertexNXEi = Module['__ZN7Surface8VertexNXEi'] = createExportWrapper('_ZN7Surface8VertexNXEi', 2);
var __ZN7Surface8VertexNYEi = Module['__ZN7Surface8VertexNYEi'] = createExportWrapper('_ZN7Surface8VertexNYEi', 2);
var __ZN7Surface8VertexNZEi = Module['__ZN7Surface8VertexNZEi'] = createExportWrapper('_ZN7Surface8VertexNZEi', 2);
var __ZN7Surface7VertexUEii = Module['__ZN7Surface7VertexUEii'] = createExportWrapper('_ZN7Surface7VertexUEii', 3);
var __ZN7Surface7VertexVEii = Module['__ZN7Surface7VertexVEii'] = createExportWrapper('_ZN7Surface7VertexVEii', 3);
var __ZN7Surface7VertexWEii = Module['__ZN7Surface7VertexWEii'] = createExportWrapper('_ZN7Surface7VertexWEii', 3);
var __ZN7Surface15GetSurfaceBrushEv = Module['__ZN7Surface15GetSurfaceBrushEv'] = createExportWrapper('_ZN7Surface15GetSurfaceBrushEv', 1);
var __ZN5Brush4CopyEv = Module['__ZN5Brush4CopyEv'] = createExportWrapper('_ZN5Brush4CopyEv', 1);
var __ZN7Surface12SurfaceColorEffff = Module['__ZN7Surface12SurfaceColorEffff'] = createExportWrapper('_ZN7Surface12SurfaceColorEffff', 5);
var __ZN7Surface12SurfaceColorEfff = Module['__ZN7Surface12SurfaceColorEfff'] = createExportWrapper('_ZN7Surface12SurfaceColorEfff', 4);
var __ZN7Surface10SurfaceRedEf = Module['__ZN7Surface10SurfaceRedEf'] = createExportWrapper('_ZN7Surface10SurfaceRedEf', 2);
var __ZN7Surface12SurfaceGreenEf = Module['__ZN7Surface12SurfaceGreenEf'] = createExportWrapper('_ZN7Surface12SurfaceGreenEf', 2);
var __ZN7Surface11SurfaceBlueEf = Module['__ZN7Surface11SurfaceBlueEf'] = createExportWrapper('_ZN7Surface11SurfaceBlueEf', 2);
var __ZN7Surface12SurfaceAlphaEf = Module['__ZN7Surface12SurfaceAlphaEf'] = createExportWrapper('_ZN7Surface12SurfaceAlphaEf', 2);
var __ZN7Surface13UpdateNormalsEv = Module['__ZN7Surface13UpdateNormalsEv'] = createExportWrapper('_ZN7Surface13UpdateNormalsEv', 1);
var __ZNSt3__26__treeINS_12__value_typeI6VectorS2_EENS_19__map_value_compareIS2_S3_NS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE25__emplace_unique_key_argsIS2_JRKNS_21piecewise_construct_tENS_5tupleIJRKS2_EEENSF_IJEEEEEENS_4pairINS_15__tree_iteratorIS3_PNS_11__tree_nodeIS3_PvEElEEbEERKT_DpOT0_ = Module['__ZNSt3__26__treeINS_12__value_typeI6VectorS2_EENS_19__map_value_compareIS2_S3_NS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE25__emplace_unique_key_argsIS2_JRKNS_21piecewise_construct_tENS_5tupleIJRKS2_EEENSF_IJEEEEEENS_4pairINS_15__tree_iteratorIS3_PNS_11__tree_nodeIS3_PvEElEEbEERKT_DpOT0_'] = createExportWrapper('_ZNSt3__26__treeINS_12__value_typeI6VectorS2_EENS_19__map_value_compareIS2_S3_NS_4lessIS2_EELb1EEENS_9allocatorIS3_EEE25__emplace_unique_key_argsIS2_JRKNS_21piecewise_construct_tENS_5tupleIJRKS2_EEENSF_IJEEEEEENS_4pairINS_15__tree_iteratorIS3_PNS_11__tree_nodeIS3_PvEElEEbEERKT_DpOT0_', 6);
var __ZN7Surface14TriangleVertexEii = Module['__ZN7Surface14TriangleVertexEii'] = createExportWrapper('_ZN7Surface14TriangleVertexEii', 3);
var __ZN7Surface10TriangleNXEi = Module['__ZN7Surface10TriangleNXEi'] = createExportWrapper('_ZN7Surface10TriangleNXEi', 2);
var __ZN7Surface10TriangleNYEi = Module['__ZN7Surface10TriangleNYEi'] = createExportWrapper('_ZN7Surface10TriangleNYEi', 2);
var __ZN7Surface10TriangleNZEi = Module['__ZN7Surface10TriangleNZEi'] = createExportWrapper('_ZN7Surface10TriangleNZEi', 2);
var __ZN7Surface9UpdateVBOEv = Module['__ZN7Surface9UpdateVBOEv'] = createExportWrapper('_ZN7Surface9UpdateVBOEv', 1);
var __ZN7Surface9RemoveTriEi = Module['__ZN7Surface9RemoveTriEi'] = createExportWrapper('_ZN7Surface9RemoveTriEi', 2);
var __Znam = Module['__Znam'] = createExportWrapper('_Znam', 1);
var __ZdaPv = Module['__ZdaPv'] = createExportWrapper('_ZdaPv', 1);
var __ZN7Surface15UpdateTexCoordsEv = Module['__ZN7Surface15UpdateTexCoordsEv'] = createExportWrapper('_ZN7Surface15UpdateTexCoordsEv', 1);
var __ZN7SurfaceD1Ev = Module['__ZN7SurfaceD1Ev'] = createExportWrapper('_ZN7SurfaceD1Ev', 1);
var __ZN4Bone10CopyEntityEP6Entity = Module['__ZN4Bone10CopyEntityEP6Entity'] = createExportWrapper('_ZN4Bone10CopyEntityEP6Entity', 2);
var __ZN6Matrix8MultiplyERS_ = Module['__ZN6Matrix8MultiplyERS_'] = createExportWrapper('_ZN6Matrix8MultiplyERS_', 2);
var __ZN13AnimationKeys4CopyEv = Module['__ZN13AnimationKeys4CopyEv'] = createExportWrapper('_ZN13AnimationKeys4CopyEv', 1);
var __ZN4Bone10FreeEntityEv = Module['__ZN4Bone10FreeEntityEv'] = createExportWrapper('_ZN4Bone10FreeEntityEv', 1);
var __ZN13AnimationKeysD2Ev = Module['__ZN13AnimationKeysD2Ev'] = createExportWrapper('_ZN13AnimationKeysD2Ev', 1);
var __ZN6Entity10FreeEntityEv = Module['__ZN6Entity10FreeEntityEv'] = createExportWrapper('_ZN6Entity10FreeEntityEv', 1);
var __ZN4Bone10RotateBoneEfff = Module['__ZN4Bone10RotateBoneEfff'] = createExportWrapper('_ZN4Bone10RotateBoneEfff', 4);
var __ZN6Matrix6RotateEfff = Module['__ZN6Matrix6RotateEfff'] = createExportWrapper('_ZN6Matrix6RotateEfff', 4);
var __Z6cosdegd = Module['__Z6cosdegd'] = createExportWrapper('_Z6cosdegd', 1);
var __Z6sindegd = Module['__Z6sindegd'] = createExportWrapper('_Z6sindegd', 1);
var __ZN4Bone12PositionBoneEfff = Module['__ZN4Bone12PositionBoneEfff'] = createExportWrapper('_ZN4Bone12PositionBoneEfff', 4);
var __ZN4Bone8MoveBoneEfffi = Module['__ZN4Bone8MoveBoneEfffi'] = createExportWrapper('_ZN4Bone8MoveBoneEfffi', 5);
var __Z8atan2degdd = Module['__Z8atan2degdd'] = createExportWrapper('_Z8atan2degdd', 2);
var __ZN6Entity7MQ_TurnEffffi = Module['__ZN6Entity7MQ_TurnEffffi'] = createExportWrapper('_ZN6Entity7MQ_TurnEffffi', 6);
var __ZN6EntityD2Ev = Module['__ZN6EntityD2Ev'] = createExportWrapper('_ZN6EntityD2Ev', 1);
var __ZN4BoneD0Ev = Module['__ZN4BoneD0Ev'] = createExportWrapper('_ZN4BoneD0Ev', 1);
var __ZN6Entity6UpdateEv = Module['__ZN6Entity6UpdateEv'] = createExportWrapper('_ZN6Entity6UpdateEv', 1);
var __ZN6Entity6RenderEv = Module['__ZN6Entity6RenderEv'] = createExportWrapper('_ZN6Entity6RenderEv', 1);
var __ZN5Brush9LoadBrushENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiff = Module['__ZN5Brush9LoadBrushENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiff'] = createExportWrapper('_ZN5Brush9LoadBrushENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiff', 4);
var __ZN5Brush10BrushColorEfff = Module['__ZN5Brush10BrushColorEfff'] = createExportWrapper('_ZN5Brush10BrushColorEfff', 4);
var __ZN5Brush10BrushAlphaEf = Module['__ZN5Brush10BrushAlphaEf'] = createExportWrapper('_ZN5Brush10BrushAlphaEf', 2);
var __ZN5Brush14BrushShininessEf = Module['__ZN5Brush14BrushShininessEf'] = createExportWrapper('_ZN5Brush14BrushShininessEf', 2);
var __ZN5Brush12BrushTextureEP7Textureii = Module['__ZN5Brush12BrushTextureEP7Textureii'] = createExportWrapper('_ZN5Brush12BrushTextureEP7Textureii', 4);
var __ZN5Brush10BrushBlendEi = Module['__ZN5Brush10BrushBlendEi'] = createExportWrapper('_ZN5Brush10BrushBlendEi', 2);
var __ZN5Brush7BrushFXEi = Module['__ZN5Brush7BrushFXEi'] = createExportWrapper('_ZN5Brush7BrushFXEi', 2);
var __ZN5Brush15GetBrushTextureEi = Module['__ZN5Brush15GetBrushTextureEi'] = createExportWrapper('_ZN5Brush15GetBrushTextureEi', 2);
var __ZN5Brush14CompareBrushesEPS_S0_ = Module['__ZN5Brush14CompareBrushesEPS_S0_'] = createExportWrapper('_ZN5Brush14CompareBrushesEPS_S0_', 2);
var __ZN9Collision6updateERK4LinefRK6Vector = Module['__ZN9Collision6updateERK4LinefRK6Vector'] = createExportWrapper('_ZN9Collision6updateERK4LinefRK6Vector', 4);
var __ZN9Collision13sphereCollideERK4LinefRK6Vectorf = Module['__ZN9Collision13sphereCollideERK4LinefRK6Vectorf'] = createExportWrapper('_ZN9Collision13sphereCollideERK4LinefRK6Vectorf', 5);
var __ZN9Collision15triangleCollideERK4LinefRK6VectorS5_S5_ = Module['__ZN9Collision15triangleCollideERK4LinefRK6VectorS5_S5_'] = createExportWrapper('_ZN9Collision15triangleCollideERK4LinefRK6VectorS5_S5_', 6);
var __ZN9Collision10boxCollideERK4LinefRK3Box = Module['__ZN9Collision10boxCollideERK4LinefRK3Box'] = createExportWrapper('_ZN9Collision10boxCollideERK4LinefRK3Box', 4);
var __Z23C_CreateCollisionObjectv = Module['__Z23C_CreateCollisionObjectv'] = createExportWrapper('_Z23C_CreateCollisionObjectv', 0);
var __Z23C_DeleteCollisionObjectP9Collision = Module['__Z23C_DeleteCollisionObjectP9Collision'] = createExportWrapper('_Z23C_DeleteCollisionObjectP9Collision', 1);
var __Z27C_CreateCollisionInfoObjectP6VectorS0_S0_ = Module['__Z27C_CreateCollisionInfoObjectP6VectorS0_S0_'] = createExportWrapper('_Z27C_CreateCollisionInfoObjectP6VectorS0_S0_', 3);
var __Z28C_UpdateCollisionInfoObject2P13CollisionInfoP6VectorS2_S2_ = Module['__Z28C_UpdateCollisionInfoObject2P13CollisionInfoP6VectorS2_S2_'] = createExportWrapper('_Z28C_UpdateCollisionInfoObject2P13CollisionInfoP6VectorS2_S2_', 4);
var __Z27C_UpdateCollisionInfoObjectP13CollisionInfofffffff = Module['__Z27C_UpdateCollisionInfoObjectP13CollisionInfofffffff'] = createExportWrapper('_Z27C_UpdateCollisionInfoObjectP13CollisionInfofffffff', 8);
var __Z27C_DeleteCollisionInfoObjectP13CollisionInfo = Module['__Z27C_DeleteCollisionInfoObjectP13CollisionInfo'] = createExportWrapper('_Z27C_DeleteCollisionInfoObjectP13CollisionInfo', 1);
var __Z7hitTestRK4LinefRK9TransformP12MeshCollideriP9CollisionR13CollisionInfo = Module['__Z7hitTestRK4LinefRK9TransformP12MeshCollideriP9CollisionR13CollisionInfo'] = createExportWrapper('_Z7hitTestRK4LinefRK9TransformP12MeshCollideriP9CollisionR13CollisionInfo', 7);
var __ZN12MeshCollider7collideERK4LinefRK9TransformP9Collision = Module['__ZN12MeshCollider7collideERK4LinefRK9TransformP9Collision'] = createExportWrapper('_ZN12MeshCollider7collideERK4LinefRK9TransformP9Collision', 5);
var __Z17C_CollisionDetectP13CollisionInfoP9CollisionP9TransformP12MeshCollideri = Module['__Z17C_CollisionDetectP13CollisionInfoP9CollisionP9TransformP12MeshCollideri'] = createExportWrapper('_Z17C_CollisionDetectP13CollisionInfoP9CollisionP9TransformP12MeshCollideri', 5);
var __ZNK9TransformmlERKS_ = Module['__ZNK9TransformmlERKS_'] = createExportWrapper('_ZNK9TransformmlERKS_', 2);
var __Z19C_CollisionResponseP13CollisionInfoP9Collisioni = Module['__Z19C_CollisionResponseP13CollisionInfoP9Collisioni'] = createExportWrapper('_Z19C_CollisionResponseP13CollisionInfoP9Collisioni', 3);
var __Z16C_CollisionFinalP13CollisionInfo = Module['__Z16C_CollisionFinalP13CollisionInfo'] = createExportWrapper('_Z16C_CollisionFinalP13CollisionInfo', 1);
var __Z6C_PickP13CollisionInfoPK4LinefP9CollisionP9TransformP12MeshCollideri = Module['__Z6C_PickP13CollisionInfoPK4LinefP9CollisionP9TransformP12MeshCollideri'] = createExportWrapper('_Z6C_PickP13CollisionInfoPK4LinefP9CollisionP9TransformP12MeshCollideri', 7);
var __Z15C_CollisionPosXv = Module['__Z15C_CollisionPosXv'] = createExportWrapper('_Z15C_CollisionPosXv', 0);
var __Z15C_CollisionPosYv = Module['__Z15C_CollisionPosYv'] = createExportWrapper('_Z15C_CollisionPosYv', 0);
var __Z15C_CollisionPosZv = Module['__Z15C_CollisionPosZv'] = createExportWrapper('_Z15C_CollisionPosZv', 0);
var __Z12C_CollisionXv = Module['__Z12C_CollisionXv'] = createExportWrapper('_Z12C_CollisionXv', 0);
var __Z12C_CollisionYv = Module['__Z12C_CollisionYv'] = createExportWrapper('_Z12C_CollisionYv', 0);
var __Z12C_CollisionZv = Module['__Z12C_CollisionZv'] = createExportWrapper('_Z12C_CollisionZv', 0);
var __Z13C_CollisionNXv = Module['__Z13C_CollisionNXv'] = createExportWrapper('_Z13C_CollisionNXv', 0);
var __Z13C_CollisionNYv = Module['__Z13C_CollisionNYv'] = createExportWrapper('_Z13C_CollisionNYv', 0);
var __Z13C_CollisionNZv = Module['__Z13C_CollisionNZv'] = createExportWrapper('_Z13C_CollisionNZv', 0);
var __Z15C_CollisionTimev = Module['__Z15C_CollisionTimev'] = createExportWrapper('_Z15C_CollisionTimev', 0);
var __Z18C_CollisionSurfacev = Module['__Z18C_CollisionSurfacev'] = createExportWrapper('_Z18C_CollisionSurfacev', 0);
var __Z19C_CollisionTrianglev = Module['__Z19C_CollisionTrianglev'] = createExportWrapper('_Z19C_CollisionTrianglev', 0);
var __Z17C_CreateVecObjectfff = Module['__Z17C_CreateVecObjectfff'] = createExportWrapper('_Z17C_CreateVecObjectfff', 3);
var __Z17C_DeleteVecObjectP6Vector = Module['__Z17C_DeleteVecObjectP6Vector'] = createExportWrapper('_Z17C_DeleteVecObjectP6Vector', 1);
var __Z17C_UpdateVecObjectP6Vectorfff = Module['__Z17C_UpdateVecObjectP6Vectorfff'] = createExportWrapper('_Z17C_UpdateVecObjectP6Vectorfff', 4);
var __Z6C_VecXP6Vector = Module['__Z6C_VecXP6Vector'] = createExportWrapper('_Z6C_VecXP6Vector', 1);
var __Z6C_VecYP6Vector = Module['__Z6C_VecYP6Vector'] = createExportWrapper('_Z6C_VecYP6Vector', 1);
var __Z6C_VecZP6Vector = Module['__Z6C_VecZP6Vector'] = createExportWrapper('_Z6C_VecZP6Vector', 1);
var __Z18C_CreateLineObjectffffff = Module['__Z18C_CreateLineObjectffffff'] = createExportWrapper('_Z18C_CreateLineObjectffffff', 6);
var __Z18C_DeleteLineObjectP4Line = Module['__Z18C_DeleteLineObjectP4Line'] = createExportWrapper('_Z18C_DeleteLineObjectP4Line', 1);
var __Z18C_UpdateLineObjectP4Lineffffff = Module['__Z18C_UpdateLineObjectP4Lineffffff'] = createExportWrapper('_Z18C_UpdateLineObjectP4Lineffffff', 7);
var __Z20C_CreateMatrixObjectP6VectorS0_S0_ = Module['__Z20C_CreateMatrixObjectP6VectorS0_S0_'] = createExportWrapper('_Z20C_CreateMatrixObjectP6VectorS0_S0_', 3);
var __Z20C_UpdateMatrixObjectP7MMatrixP6VectorS2_S2_ = Module['__Z20C_UpdateMatrixObjectP7MMatrixP6VectorS2_S2_'] = createExportWrapper('_Z20C_UpdateMatrixObjectP7MMatrixP6VectorS2_S2_', 4);
var __Z20C_DeleteMatrixObjectP7MMatrix = Module['__Z20C_DeleteMatrixObjectP7MMatrix'] = createExportWrapper('_Z20C_DeleteMatrixObjectP7MMatrix', 1);
var __Z19C_CreateTFormObjectP7MMatrixP6Vector = Module['__Z19C_CreateTFormObjectP7MMatrixP6Vector'] = createExportWrapper('_Z19C_CreateTFormObjectP7MMatrixP6Vector', 2);
var __Z19C_UpdateTFormObjectP9TransformP7MMatrixP6Vector = Module['__Z19C_UpdateTFormObjectP9TransformP7MMatrixP6Vector'] = createExportWrapper('_Z19C_UpdateTFormObjectP9TransformP7MMatrixP6Vector', 3);
var __Z19C_DeleteTFormObjectP9Transform = Module['__Z19C_DeleteTFormObjectP9Transform'] = createExportWrapper('_Z19C_DeleteTFormObjectP9Transform', 1);
var __ZN6Entity12EntityParentEPS_i = Module['__ZN6Entity12EntityParentEPS_i'] = createExportWrapper('_ZN6Entity12EntityParentEPS_i', 3);
var __ZN6Entity12MQ_GetMatrixER6Matrix = Module['__ZN6Entity12MQ_GetMatrixER6Matrix'] = createExportWrapper('_ZN6Entity12MQ_GetMatrixER6Matrix', 2);
var __ZN6Entity14MQ_GetScaleXYZERfS0_S0_ = Module['__ZN6Entity14MQ_GetScaleXYZERfS0_S0_'] = createExportWrapper('_ZN6Entity14MQ_GetScaleXYZERfS0_S0_', 4);
var __ZN6Entity15MQ_GetInvMatrixER6Matrix = Module['__ZN6Entity15MQ_GetInvMatrixER6Matrix'] = createExportWrapper('_ZN6Entity15MQ_GetInvMatrixER6Matrix', 2);
var __ZN6Entity10TFormPointEfffPS_S0_ = Module['__ZN6Entity10TFormPointEfffPS_S0_'] = createExportWrapper('_ZN6Entity10TFormPointEfffPS_S0_', 5);
var __ZN6Entity9GetParentEv = Module['__ZN6Entity9GetParentEv'] = createExportWrapper('_ZN6Entity9GetParentEv', 1);
var __ZN6Entity9FindChildENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN6Entity9FindChildENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN6Entity9FindChildENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN6Entity10EntityNameEv = Module['__ZN6Entity10EntityNameEv'] = createExportWrapper('_ZN6Entity10EntityNameEv', 2);
var __ZN6Entity16CountAllChildrenEi = Module['__ZN6Entity16CountAllChildrenEi'] = createExportWrapper('_ZN6Entity16CountAllChildrenEi', 2);
var __ZN6Entity15GetChildFromAllEiRiPS_ = Module['__ZN6Entity15GetChildFromAllEiRiPS_'] = createExportWrapper('_ZN6Entity15GetChildFromAllEiRiPS_', 4);
var __ZN6Entity17UpdateAllEntitiesEPFvPS_S0_ES0_ = Module['__ZN6Entity17UpdateAllEntitiesEPFvPS_S0_ES0_'] = createExportWrapper('_ZN6Entity17UpdateAllEntitiesEPFvPS_S0_ES0_', 3);
var __ZN6Entity6HiddenEv = Module['__ZN6Entity6HiddenEv'] = createExportWrapper('_ZN6Entity6HiddenEv', 1);
var __ZN6Entity14PositionEntityEfffi = Module['__ZN6Entity14PositionEntityEfffi'] = createExportWrapper('_ZN6Entity14PositionEntityEfffi', 5);
var __ZN6Entity10MoveEntityEfff = Module['__ZN6Entity10MoveEntityEfff'] = createExportWrapper('_ZN6Entity10MoveEntityEfff', 4);
var __ZN6Entity15TranslateEntityEfffi = Module['__ZN6Entity15TranslateEntityEfffi'] = createExportWrapper('_ZN6Entity15TranslateEntityEfffi', 5);
var __ZN6Entity11TFormVectorEfffPS_S0_ = Module['__ZN6Entity11TFormVectorEfffPS_S0_'] = createExportWrapper('_ZN6Entity11TFormVectorEfffPS_S0_', 5);
var __ZN6Entity11ScaleEntityEfffi = Module['__ZN6Entity11ScaleEntityEfffi'] = createExportWrapper('_ZN6Entity11ScaleEntityEfffi', 5);
var __ZN6Entity12EntityScaleXEi = Module['__ZN6Entity12EntityScaleXEi'] = createExportWrapper('_ZN6Entity12EntityScaleXEi', 2);
var __ZN6Entity12EntityScaleYEi = Module['__ZN6Entity12EntityScaleYEi'] = createExportWrapper('_ZN6Entity12EntityScaleYEi', 2);
var __ZN6Entity12EntityScaleZEi = Module['__ZN6Entity12EntityScaleZEi'] = createExportWrapper('_ZN6Entity12EntityScaleZEi', 2);
var __ZN6Entity12RotateEntityEfffi = Module['__ZN6Entity12RotateEntityEfffi'] = createExportWrapper('_ZN6Entity12RotateEntityEfffi', 5);
var __ZN6Entity10TurnEntityEfffi = Module['__ZN6Entity10TurnEntityEfffi'] = createExportWrapper('_ZN6Entity10TurnEntityEfffi', 5);
var __Z24Quaternion_FromAngleAxisffffRfS_S_S_ = Module['__Z24Quaternion_FromAngleAxisffffRfS_S_S_'] = createExportWrapper('_Z24Quaternion_FromAngleAxisffffRfS_S_S_', 8);
var __ZN6Entity11PointEntityEPS_f = Module['__ZN6Entity11PointEntityEPS_f'] = createExportWrapper('_ZN6Entity11PointEntityEPS_f', 3);
var __ZN6Entity7EntityXEi = Module['__ZN6Entity7EntityXEi'] = createExportWrapper('_ZN6Entity7EntityXEi', 2);
var __ZN6Entity7EntityYEi = Module['__ZN6Entity7EntityYEi'] = createExportWrapper('_ZN6Entity7EntityYEi', 2);
var __ZN6Entity7EntityZEi = Module['__ZN6Entity7EntityZEi'] = createExportWrapper('_ZN6Entity7EntityZEi', 2);
var __ZN6Entity11EntityPitchEi = Module['__ZN6Entity11EntityPitchEi'] = createExportWrapper('_ZN6Entity11EntityPitchEi', 2);
var __ZN6Entity9EntityYawEi = Module['__ZN6Entity9EntityYawEi'] = createExportWrapper('_ZN6Entity9EntityYawEi', 2);
var __ZN6Entity10EntityRollEi = Module['__ZN6Entity10EntityRollEi'] = createExportWrapper('_ZN6Entity10EntityRollEi', 2);
var __ZN6Entity11EntityColorEffffi = Module['__ZN6Entity11EntityColorEffffi'] = createExportWrapper('_ZN6Entity11EntityColorEffffi', 6);
var __ZN6Entity11EntityColorEfffi = Module['__ZN6Entity11EntityColorEfffi'] = createExportWrapper('_ZN6Entity11EntityColorEfffi', 5);
var __ZN6Entity9EntityRedEfi = Module['__ZN6Entity9EntityRedEfi'] = createExportWrapper('_ZN6Entity9EntityRedEfi', 3);
var __ZN6Entity11EntityGreenEfi = Module['__ZN6Entity11EntityGreenEfi'] = createExportWrapper('_ZN6Entity11EntityGreenEfi', 3);
var __ZN6Entity10EntityBlueEfi = Module['__ZN6Entity10EntityBlueEfi'] = createExportWrapper('_ZN6Entity10EntityBlueEfi', 3);
var __ZN6Entity11EntityAlphaEfi = Module['__ZN6Entity11EntityAlphaEfi'] = createExportWrapper('_ZN6Entity11EntityAlphaEfi', 3);
var __ZN6Entity15EntityShininessEfi = Module['__ZN6Entity15EntityShininessEfi'] = createExportWrapper('_ZN6Entity15EntityShininessEfi', 3);
var __ZN6Entity11EntityBlendEii = Module['__ZN6Entity11EntityBlendEii'] = createExportWrapper('_ZN6Entity11EntityBlendEii', 3);
var __ZN6Entity8EntityFXEii = Module['__ZN6Entity8EntityFXEii'] = createExportWrapper('_ZN6Entity8EntityFXEii', 3);
var __ZN6Entity13EntityTextureEP7Textureiii = Module['__ZN6Entity13EntityTextureEP7Textureiii'] = createExportWrapper('_ZN6Entity13EntityTextureEP7Textureiii', 5);
var __ZN6Entity14GetEntityBrushEv = Module['__ZN6Entity14GetEntityBrushEv'] = createExportWrapper('_ZN6Entity14GetEntityBrushEv', 1);
var __ZN6Entity11EntityOrderEii = Module['__ZN6Entity11EntityOrderEii'] = createExportWrapper('_ZN6Entity11EntityOrderEii', 3);
var __ZN6Entity10ShowEntityEv = Module['__ZN6Entity10ShowEntityEv'] = createExportWrapper('_ZN6Entity10ShowEntityEv', 1);
var __ZN6Entity10HideEntityEv = Module['__ZN6Entity10HideEntityEv'] = createExportWrapper('_ZN6Entity10HideEntityEv', 1);
var __ZN6Entity10NameEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN6Entity10NameEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN6Entity10NameEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN6Entity11EntityClassEv = Module['__ZN6Entity11EntityClassEv'] = createExportWrapper('_ZN6Entity11EntityClassEv', 2);
var __ZN6Entity7AnimateEifii = Module['__ZN6Entity7AnimateEifii'] = createExportWrapper('_ZN6Entity7AnimateEifii', 5);
var __ZN6Entity11SetAnimTimeEfi = Module['__ZN6Entity11SetAnimTimeEfi'] = createExportWrapper('_ZN6Entity11SetAnimTimeEfi', 3);
var __ZN9Animation11AnimateMeshEP4Meshfii = Module['__ZN9Animation11AnimateMeshEP4Meshfii'] = createExportWrapper('_ZN9Animation11AnimateMeshEP4Meshfii', 4);
var __ZN6Entity10AnimLengthEv = Module['__ZN6Entity10AnimLengthEv'] = createExportWrapper('_ZN6Entity10AnimLengthEv', 1);
var __ZN6Entity8AnimTimeEv = Module['__ZN6Entity8AnimTimeEv'] = createExportWrapper('_ZN6Entity8AnimTimeEv', 1);
var __ZN6Entity14ExtractAnimSeqEiii = Module['__ZN6Entity14ExtractAnimSeqEiii'] = createExportWrapper('_ZN6Entity14ExtractAnimSeqEiii', 4);
var __ZN6Entity11LoadAnimSeqENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN6Entity11LoadAnimSeqENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN6Entity11LoadAnimSeqENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZNSt3__26vectorIiNS_9allocatorIiEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPiEES7_EES7_NS5_IPKiEET_T0_l = Module['__ZNSt3__26vectorIiNS_9allocatorIiEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPiEES7_EES7_NS5_IPKiEET_T0_l'] = createExportWrapper('_ZNSt3__26vectorIiNS_9allocatorIiEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPiEES7_EES7_NS5_IPKiEET_T0_l', 5);
var __ZNSt3__26vectorIfNS_9allocatorIfEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPfEES7_EES7_NS5_IPKfEET_T0_l = Module['__ZNSt3__26vectorIfNS_9allocatorIfEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPfEES7_EES7_NS5_IPKfEET_T0_l'] = createExportWrapper('_ZNSt3__26vectorIfNS_9allocatorIfEEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPfEES7_EES7_NS5_IPKfEET_T0_l', 5);
var __ZN6Entity10SetAnimKeyEfiii = Module['__ZN6Entity10SetAnimKeyEfiii'] = createExportWrapper('_ZN6Entity10SetAnimKeyEfiii', 5);
var __ZN6Matrix6ToQuatERfS0_S0_S0_ = Module['__ZN6Matrix6ToQuatERfS0_S0_S0_'] = createExportWrapper('_ZN6Matrix6ToQuatERfS0_S0_S0_', 5);
var __ZN6Entity10AddAnimSeqEi = Module['__ZN6Entity10AddAnimSeqEi'] = createExportWrapper('_ZN6Entity10AddAnimSeqEi', 2);
var __ZN6Entity10EntityTypeEii = Module['__ZN6Entity10EntityTypeEii'] = createExportWrapper('_ZN6Entity10EntityTypeEii', 3);
var __ZN6Entity13GetEntityTypeEv = Module['__ZN6Entity13GetEntityTypeEv'] = createExportWrapper('_ZN6Entity13GetEntityTypeEv', 1);
var __ZN6Entity12EntityRadiusEff = Module['__ZN6Entity12EntityRadiusEff'] = createExportWrapper('_ZN6Entity12EntityRadiusEff', 3);
var __ZN6Entity9EntityBoxEffffff = Module['__ZN6Entity9EntityBoxEffffff'] = createExportWrapper('_ZN6Entity9EntityBoxEffffff', 7);
var __ZN6Entity11ResetEntityEv = Module['__ZN6Entity11ResetEntityEv'] = createExportWrapper('_ZN6Entity11ResetEntityEv', 1);
var __ZN6Entity14EntityCollidedEi = Module['__ZN6Entity14EntityCollidedEi'] = createExportWrapper('_ZN6Entity14EntityCollidedEi', 2);
var __ZN6Entity15CountCollisionsEv = Module['__ZN6Entity15CountCollisionsEv'] = createExportWrapper('_ZN6Entity15CountCollisionsEv', 1);
var __ZN6Entity15CollisionEntityEi = Module['__ZN6Entity15CollisionEntityEi'] = createExportWrapper('_ZN6Entity15CollisionEntityEi', 2);
var __ZN6Entity10CollisionXEi = Module['__ZN6Entity10CollisionXEi'] = createExportWrapper('_ZN6Entity10CollisionXEi', 2);
var __ZN6Entity10CollisionYEi = Module['__ZN6Entity10CollisionYEi'] = createExportWrapper('_ZN6Entity10CollisionYEi', 2);
var __ZN6Entity10CollisionZEi = Module['__ZN6Entity10CollisionZEi'] = createExportWrapper('_ZN6Entity10CollisionZEi', 2);
var __ZN6Entity11CollisionNXEi = Module['__ZN6Entity11CollisionNXEi'] = createExportWrapper('_ZN6Entity11CollisionNXEi', 2);
var __ZN6Entity11CollisionNYEi = Module['__ZN6Entity11CollisionNYEi'] = createExportWrapper('_ZN6Entity11CollisionNYEi', 2);
var __ZN6Entity11CollisionNZEi = Module['__ZN6Entity11CollisionNZEi'] = createExportWrapper('_ZN6Entity11CollisionNZEi', 2);
var __ZN6Entity13CollisionTimeEi = Module['__ZN6Entity13CollisionTimeEi'] = createExportWrapper('_ZN6Entity13CollisionTimeEi', 2);
var __ZN6Entity16CollisionSurfaceEi = Module['__ZN6Entity16CollisionSurfaceEi'] = createExportWrapper('_ZN6Entity16CollisionSurfaceEi', 2);
var __ZN6Entity17CollisionTriangleEi = Module['__ZN6Entity17CollisionTriangleEi'] = createExportWrapper('_ZN6Entity17CollisionTriangleEi', 2);
var __ZN6Entity14EntityPickModeEii = Module['__ZN6Entity14EntityPickModeEii'] = createExportWrapper('_ZN6Entity14EntityPickModeEii', 3);
var __ZN6Entity14EntityDistanceEPS_ = Module['__ZN6Entity14EntityDistanceEPS_'] = createExportWrapper('_ZN6Entity14EntityDistanceEPS_', 2);
var __ZN6Entity21EntityDistanceSquaredEPS_ = Module['__ZN6Entity21EntityDistanceSquaredEPS_'] = createExportWrapper('_ZN6Entity21EntityDistanceSquaredEPS_', 2);
var __ZN6Entity8DeltaYawEPS_ = Module['__ZN6Entity8DeltaYawEPS_'] = createExportWrapper('_ZN6Entity8DeltaYawEPS_', 2);
var __ZN6Entity10DeltaPitchEPS_ = Module['__ZN6Entity10DeltaPitchEPS_'] = createExportWrapper('_ZN6Entity10DeltaPitchEPS_', 2);
var __ZN6Entity13AlignToVectorEfffif = Module['__ZN6Entity13AlignToVectorEfffif'] = createExportWrapper('_ZN6Entity13AlignToVectorEfffif', 6);
var __ZN6Matrix14FromToRotationEffffff = Module['__ZN6Matrix14FromToRotationEffffff'] = createExportWrapper('_ZN6Matrix14FromToRotationEffffff', 7);
var __Z17InterpolateMatrixR6MatrixS0_f = Module['__Z17InterpolateMatrixR6MatrixS0_f'] = createExportWrapper('_Z17InterpolateMatrixR6MatrixS0_f', 3);
var __ZN6Entity11TFormNormalEfffPS_S0_ = Module['__ZN6Entity11TFormNormalEfffPS_S0_'] = createExportWrapper('_ZN6Entity11TFormNormalEfffPS_S0_', 5);
var __ZN6Entity8TFormedXEv = Module['__ZN6Entity8TFormedXEv'] = createExportWrapper('_ZN6Entity8TFormedXEv', 0);
var __ZN6Entity8TFormedYEv = Module['__ZN6Entity8TFormedYEv'] = createExportWrapper('_ZN6Entity8TFormedYEv', 0);
var __ZN6Entity8TFormedZEv = Module['__ZN6Entity8TFormedZEv'] = createExportWrapper('_ZN6Entity8TFormedZEv', 0);
var __ZN6Entity14UpdateChildrenEPS_ = Module['__ZN6Entity14UpdateChildrenEPS_'] = createExportWrapper('_ZN6Entity14UpdateChildrenEPS_', 1);
var __ZN6Entity12EntityMatrixEv = Module['__ZN6Entity12EntityMatrixEv'] = createExportWrapper('_ZN6Entity12EntityMatrixEv', 1);
var __ZN6EntityD0Ev = Module['__ZN6EntityD0Ev'] = createExportWrapper('_ZN6EntityD0Ev', 1);
var ___cxa_pure_virtual = Module['___cxa_pure_virtual'] = createExportWrapper('__cxa_pure_virtual', 0);
var _BufferToTex = Module['_BufferToTex'] = createExportWrapper('BufferToTex', 3);
var __ZN7Texture11BufferToTexEPhi = Module['__ZN7Texture11BufferToTexEPhi'] = createExportWrapper('_ZN7Texture11BufferToTexEPhi', 3);
var _BackBufferToTex = Module['_BackBufferToTex'] = createExportWrapper('BackBufferToTex', 2);
var __ZN7Texture15BackBufferToTexEi = Module['__ZN7Texture15BackBufferToTexEi'] = createExportWrapper('_ZN7Texture15BackBufferToTexEi', 2);
var _CameraToTex = Module['_CameraToTex'] = createExportWrapper('CameraToTex', 3);
var __ZN7Texture11CameraToTexEP6Camerai = Module['__ZN7Texture11CameraToTexEP6Camerai'] = createExportWrapper('_ZN7Texture11CameraToTexEP6Camerai', 3);
var _TexToBuffer = Module['_TexToBuffer'] = createExportWrapper('TexToBuffer', 3);
var __ZN7Texture11TexToBufferEPhi = Module['__ZN7Texture11TexToBufferEPhi'] = createExportWrapper('_ZN7Texture11TexToBufferEPhi', 3);
var _MeshCullRadius = Module['_MeshCullRadius'] = createExportWrapper('MeshCullRadius', 2);
var _AddAnimSeq = Module['_AddAnimSeq'] = createExportWrapper('AddAnimSeq', 2);
var _AddMesh = Module['_AddMesh'] = createExportWrapper('AddMesh', 2);
var __ZN4Mesh7AddMeshEPS_ = Module['__ZN4Mesh7AddMeshEPS_'] = createExportWrapper('_ZN4Mesh7AddMeshEPS_', 2);
var _AddTriangle = Module['_AddTriangle'] = createExportWrapper('AddTriangle', 4);
var _AddVertex = Module['_AddVertex'] = createExportWrapper('AddVertex', 7);
var _AmbientLight = Module['_AmbientLight'] = createExportWrapper('AmbientLight', 3);
var __ZN6Global12AmbientLightEfff = Module['__ZN6Global12AmbientLightEfff'] = createExportWrapper('_ZN6Global12AmbientLightEfff', 3);
var _AntiAlias = Module['_AntiAlias'] = createExportWrapper('AntiAlias', 1);
var _Animate = Module['_Animate'] = createExportWrapper('Animate', 5);
var _Animating = Module['_Animating'] = createExportWrapper('Animating', 1);
var _AnimLength = Module['_AnimLength'] = createExportWrapper('AnimLength', 1);
var _AnimSeq = Module['_AnimSeq'] = createExportWrapper('AnimSeq', 1);
var _AnimTime = Module['_AnimTime'] = createExportWrapper('AnimTime', 1);
var _BrushAlpha = Module['_BrushAlpha'] = createExportWrapper('BrushAlpha', 2);
var _BrushBlend = Module['_BrushBlend'] = createExportWrapper('BrushBlend', 2);
var _BrushColor = Module['_BrushColor'] = createExportWrapper('BrushColor', 4);
var _BrushFX = Module['_BrushFX'] = createExportWrapper('BrushFX', 2);
var _BrushShininess = Module['_BrushShininess'] = createExportWrapper('BrushShininess', 2);
var _BrushTexture = Module['_BrushTexture'] = createExportWrapper('BrushTexture', 4);
var _CameraClsColor = Module['_CameraClsColor'] = createExportWrapper('CameraClsColor', 4);
var __ZN6Camera14CameraClsColorEfff = Module['__ZN6Camera14CameraClsColorEfff'] = createExportWrapper('_ZN6Camera14CameraClsColorEfff', 4);
var _CameraClsMode = Module['_CameraClsMode'] = createExportWrapper('CameraClsMode', 3);
var __ZN6Camera13CameraClsModeEii = Module['__ZN6Camera13CameraClsModeEii'] = createExportWrapper('_ZN6Camera13CameraClsModeEii', 3);
var _CameraFogColor = Module['_CameraFogColor'] = createExportWrapper('CameraFogColor', 4);
var __ZN6Camera14CameraFogColorEfff = Module['__ZN6Camera14CameraFogColorEfff'] = createExportWrapper('_ZN6Camera14CameraFogColorEfff', 4);
var _CameraFogMode = Module['_CameraFogMode'] = createExportWrapper('CameraFogMode', 2);
var __ZN6Camera13CameraFogModeEi = Module['__ZN6Camera13CameraFogModeEi'] = createExportWrapper('_ZN6Camera13CameraFogModeEi', 2);
var _CameraFogRange = Module['_CameraFogRange'] = createExportWrapper('CameraFogRange', 3);
var __ZN6Camera14CameraFogRangeEff = Module['__ZN6Camera14CameraFogRangeEff'] = createExportWrapper('_ZN6Camera14CameraFogRangeEff', 3);
var _CameraPick = Module['_CameraPick'] = createExportWrapper('CameraPick', 3);
var __ZN4Pick10CameraPickEP6Cameraff = Module['__ZN4Pick10CameraPickEP6Cameraff'] = createExportWrapper('_ZN4Pick10CameraPickEP6Cameraff', 3);
var _CameraProject = Module['_CameraProject'] = createExportWrapper('CameraProject', 4);
var __ZN6Camera13CameraProjectEfff = Module['__ZN6Camera13CameraProjectEfff'] = createExportWrapper('_ZN6Camera13CameraProjectEfff', 4);
var _CameraProjMode = Module['_CameraProjMode'] = createExportWrapper('CameraProjMode', 2);
var __ZN6Camera14CameraProjModeEi = Module['__ZN6Camera14CameraProjModeEi'] = createExportWrapper('_ZN6Camera14CameraProjModeEi', 2);
var _CameraRange = Module['_CameraRange'] = createExportWrapper('CameraRange', 3);
var __ZN6Camera11CameraRangeEff = Module['__ZN6Camera11CameraRangeEff'] = createExportWrapper('_ZN6Camera11CameraRangeEff', 3);
var _CameraViewport = Module['_CameraViewport'] = createExportWrapper('CameraViewport', 5);
var __ZN6Camera14CameraViewportEiiii = Module['__ZN6Camera14CameraViewportEiiii'] = createExportWrapper('_ZN6Camera14CameraViewportEiiii', 5);
var _CameraZoom = Module['_CameraZoom'] = createExportWrapper('CameraZoom', 2);
var __ZN6Camera10CameraZoomEf = Module['__ZN6Camera10CameraZoomEf'] = createExportWrapper('_ZN6Camera10CameraZoomEf', 2);
var _ClearCollisions = Module['_ClearCollisions'] = createExportWrapper('ClearCollisions', 0);
var __ZN6Global15ClearCollisionsEv = Module['__ZN6Global15ClearCollisionsEv'] = createExportWrapper('_ZN6Global15ClearCollisionsEv', 0);
var _ClearSurface = Module['_ClearSurface'] = createExportWrapper('ClearSurface', 3);
var _ClearTextureFilters = Module['_ClearTextureFilters'] = createExportWrapper('ClearTextureFilters', 0);
var __ZN7Texture19ClearTextureFiltersEv = Module['__ZN7Texture19ClearTextureFiltersEv'] = createExportWrapper('_ZN7Texture19ClearTextureFiltersEv', 0);
var _ClearWorld = Module['_ClearWorld'] = createExportWrapper('ClearWorld', 3);
var __ZN6Global10ClearWorldEiii = Module['__ZN6Global10ClearWorldEiii'] = createExportWrapper('_ZN6Global10ClearWorldEiii', 3);
var _CollisionEntity = Module['_CollisionEntity'] = createExportWrapper('CollisionEntity', 2);
var _Collisions = Module['_Collisions'] = createExportWrapper('Collisions', 4);
var __ZN6Global10CollisionsEiiii = Module['__ZN6Global10CollisionsEiiii'] = createExportWrapper('_ZN6Global10CollisionsEiiii', 4);
var _CollisionNX = Module['_CollisionNX'] = createExportWrapper('CollisionNX', 2);
var _CollisionNY = Module['_CollisionNY'] = createExportWrapper('CollisionNY', 2);
var _CollisionNZ = Module['_CollisionNZ'] = createExportWrapper('CollisionNZ', 2);
var _CollisionSurface = Module['_CollisionSurface'] = createExportWrapper('CollisionSurface', 2);
var _CollisionTime = Module['_CollisionTime'] = createExportWrapper('CollisionTime', 2);
var _CollisionTriangle = Module['_CollisionTriangle'] = createExportWrapper('CollisionTriangle', 2);
var _CollisionX = Module['_CollisionX'] = createExportWrapper('CollisionX', 2);
var _CollisionY = Module['_CollisionY'] = createExportWrapper('CollisionY', 2);
var _CollisionZ = Module['_CollisionZ'] = createExportWrapper('CollisionZ', 2);
var _CountChildren = Module['_CountChildren'] = createExportWrapper('CountChildren', 1);
var _CountCollisions = Module['_CountCollisions'] = createExportWrapper('CountCollisions', 1);
var _CopyEntity = Module['_CopyEntity'] = createExportWrapper('CopyEntity', 2);
var _CopyMesh = Module['_CopyMesh'] = createExportWrapper('CopyMesh', 2);
var __ZN4Mesh8CopyMeshEP6Entity = Module['__ZN4Mesh8CopyMeshEP6Entity'] = createExportWrapper('_ZN4Mesh8CopyMeshEP6Entity', 2);
var _CountBones = Module['_CountBones'] = createExportWrapper('CountBones', 1);
var _CountSurfaces = Module['_CountSurfaces'] = createExportWrapper('CountSurfaces', 1);
var __ZN4Mesh13CountSurfacesEv = Module['__ZN4Mesh13CountSurfacesEv'] = createExportWrapper('_ZN4Mesh13CountSurfacesEv', 1);
var _CountTriangles = Module['_CountTriangles'] = createExportWrapper('CountTriangles', 1);
var _CountVertices = Module['_CountVertices'] = createExportWrapper('CountVertices', 1);
var _CreateBlob = Module['_CreateBlob'] = createExportWrapper('CreateBlob', 3);
var __ZN4Blob10CreateBlobEP5FluidfP6Entity = Module['__ZN4Blob10CreateBlobEP5FluidfP6Entity'] = createExportWrapper('_ZN4Blob10CreateBlobEP5FluidfP6Entity', 3);
var _CreateBone = Module['_CreateBone'] = createExportWrapper('CreateBone', 2);
var __ZN4Mesh10CreateBoneEP6Entity = Module['__ZN4Mesh10CreateBoneEP6Entity'] = createExportWrapper('_ZN4Mesh10CreateBoneEP6Entity', 2);
var _CreateBrush = Module['_CreateBrush'] = createExportWrapper('CreateBrush', 3);
var _CreateCamera = Module['_CreateCamera'] = createExportWrapper('CreateCamera', 1);
var __ZN6Camera12CreateCameraEP6Entity = Module['__ZN6Camera12CreateCameraEP6Entity'] = createExportWrapper('_ZN6Camera12CreateCameraEP6Entity', 1);
var _CreateConstraint = Module['_CreateConstraint'] = createExportWrapper('CreateConstraint', 3);
var __ZN10Constraint16CreateConstraintEP6EntityS1_f = Module['__ZN10Constraint16CreateConstraintEP6EntityS1_f'] = createExportWrapper('_ZN10Constraint16CreateConstraintEP6EntityS1_f', 3);
var _CreateCone = Module['_CreateCone'] = createExportWrapper('CreateCone', 3);
var __ZN4Mesh10CreateConeEiiP6Entity = Module['__ZN4Mesh10CreateConeEiiP6Entity'] = createExportWrapper('_ZN4Mesh10CreateConeEiiP6Entity', 3);
var _CreateCylinder = Module['_CreateCylinder'] = createExportWrapper('CreateCylinder', 3);
var __ZN4Mesh14CreateCylinderEiiP6Entity = Module['__ZN4Mesh14CreateCylinderEiiP6Entity'] = createExportWrapper('_ZN4Mesh14CreateCylinderEiiP6Entity', 3);
var _CreateCube = Module['_CreateCube'] = createExportWrapper('CreateCube', 1);
var __ZN4Mesh10CreateCubeEP6Entity = Module['__ZN4Mesh10CreateCubeEP6Entity'] = createExportWrapper('_ZN4Mesh10CreateCubeEP6Entity', 1);
var _CreateGeosphere = Module['_CreateGeosphere'] = createExportWrapper('CreateGeosphere', 2);
var __ZN9Geosphere15CreateGeosphereEiP6Entity = Module['__ZN9Geosphere15CreateGeosphereEiP6Entity'] = createExportWrapper('_ZN9Geosphere15CreateGeosphereEiP6Entity', 2);
var _CreateMesh = Module['_CreateMesh'] = createExportWrapper('CreateMesh', 1);
var __ZN4Mesh10CreateMeshEP6Entity = Module['__ZN4Mesh10CreateMeshEP6Entity'] = createExportWrapper('_ZN4Mesh10CreateMeshEP6Entity', 1);
var _CreateLight = Module['_CreateLight'] = createExportWrapper('CreateLight', 2);
var __ZN5Light11CreateLightEiP6Entity = Module['__ZN5Light11CreateLightEiP6Entity'] = createExportWrapper('_ZN5Light11CreateLightEiP6Entity', 2);
var _CreatePivot = Module['_CreatePivot'] = createExportWrapper('CreatePivot', 1);
var __ZN5Pivot11CreatePivotEP6Entity = Module['__ZN5Pivot11CreatePivotEP6Entity'] = createExportWrapper('_ZN5Pivot11CreatePivotEP6Entity', 1);
var _CreatePlane = Module['_CreatePlane'] = createExportWrapper('CreatePlane', 2);
var __ZN4Mesh11CreatePlaneEiP6Entity = Module['__ZN4Mesh11CreatePlaneEiP6Entity'] = createExportWrapper('_ZN4Mesh11CreatePlaneEiP6Entity', 2);
var _CreateQuad = Module['_CreateQuad'] = createExportWrapper('CreateQuad', 1);
var __ZN4Mesh10CreateQuadEP6Entity = Module['__ZN4Mesh10CreateQuadEP6Entity'] = createExportWrapper('_ZN4Mesh10CreateQuadEP6Entity', 1);
var _CreateRigidBody = Module['_CreateRigidBody'] = createExportWrapper('CreateRigidBody', 5);
var __ZN9RigidBody15CreateRigidBodyEP6EntityS1_S1_S1_S1_ = Module['__ZN9RigidBody15CreateRigidBodyEP6EntityS1_S1_S1_S1_'] = createExportWrapper('_ZN9RigidBody15CreateRigidBodyEP6EntityS1_S1_S1_S1_', 5);
var _CreateShadow = Module['_CreateShadow'] = createExportWrapper('CreateShadow', 2);
var __ZN12ShadowObject6CreateEP4Meshc = Module['__ZN12ShadowObject6CreateEP4Meshc'] = createExportWrapper('_ZN12ShadowObject6CreateEP4Meshc', 2);
var _CreateSphere = Module['_CreateSphere'] = createExportWrapper('CreateSphere', 2);
var __ZN4Mesh12CreateSphereEiP6Entity = Module['__ZN4Mesh12CreateSphereEiP6Entity'] = createExportWrapper('_ZN4Mesh12CreateSphereEiP6Entity', 2);
var _CreateSprite = Module['_CreateSprite'] = createExportWrapper('CreateSprite', 1);
var __ZN6Sprite12CreateSpriteEP6Entity = Module['__ZN6Sprite12CreateSpriteEP6Entity'] = createExportWrapper('_ZN6Sprite12CreateSpriteEP6Entity', 1);
var _CreateSurface = Module['_CreateSurface'] = createExportWrapper('CreateSurface', 2);
var _CreateStencil = Module['_CreateStencil'] = createExportWrapper('CreateStencil', 0);
var __ZN7Stencil13CreateStencilEv = Module['__ZN7Stencil13CreateStencilEv'] = createExportWrapper('_ZN7Stencil13CreateStencilEv', 0);
var _CreateTerrain = Module['_CreateTerrain'] = createExportWrapper('CreateTerrain', 2);
var __ZN7Terrain13CreateTerrainEiP6Entity = Module['__ZN7Terrain13CreateTerrainEiP6Entity'] = createExportWrapper('_ZN7Terrain13CreateTerrainEiP6Entity', 2);
var _CreateTexture = Module['_CreateTexture'] = createExportWrapper('CreateTexture', 4);
var __ZN7Texture13CreateTextureEiiii = Module['__ZN7Texture13CreateTextureEiiii'] = createExportWrapper('_ZN7Texture13CreateTextureEiiii', 4);
var _CreateVoxelSprite = Module['_CreateVoxelSprite'] = createExportWrapper('CreateVoxelSprite', 2);
var __ZN11VoxelSprite17CreateVoxelSpriteEiP6Entity = Module['__ZN11VoxelSprite17CreateVoxelSpriteEiP6Entity'] = createExportWrapper('_ZN11VoxelSprite17CreateVoxelSpriteEiP6Entity', 2);
var _DeltaPitch = Module['_DeltaPitch'] = createExportWrapper('DeltaPitch', 2);
var _DeltaYaw = Module['_DeltaYaw'] = createExportWrapper('DeltaYaw', 2);
var _EmitterVector = Module['_EmitterVector'] = createExportWrapper('EmitterVector', 4);
var __ZN15ParticleEmitter13EmitterVectorEfff = Module['__ZN15ParticleEmitter13EmitterVectorEfff'] = createExportWrapper('_ZN15ParticleEmitter13EmitterVectorEfff', 4);
var _EmitterRate = Module['_EmitterRate'] = createExportWrapper('EmitterRate', 2);
var __ZN15ParticleEmitter11EmitterRateEf = Module['__ZN15ParticleEmitter11EmitterRateEf'] = createExportWrapper('_ZN15ParticleEmitter11EmitterRateEf', 2);
var _EmitterParticleLife = Module['_EmitterParticleLife'] = createExportWrapper('EmitterParticleLife', 2);
var __ZN15ParticleEmitter19EmitterParticleLifeEi = Module['__ZN15ParticleEmitter19EmitterParticleLifeEi'] = createExportWrapper('_ZN15ParticleEmitter19EmitterParticleLifeEi', 2);
var _EmitterParticleFunction = Module['_EmitterParticleFunction'] = createExportWrapper('EmitterParticleFunction', 2);
var __ZN15ParticleEmitter23EmitterParticleFunctionEPFvP6EntityiE = Module['__ZN15ParticleEmitter23EmitterParticleFunctionEPFvP6EntityiE'] = createExportWrapper('_ZN15ParticleEmitter23EmitterParticleFunctionEPFvP6EntityiE', 2);
var _EmitterParticleSpeed = Module['_EmitterParticleSpeed'] = createExportWrapper('EmitterParticleSpeed', 2);
var __ZN15ParticleEmitter20EmitterParticleSpeedEf = Module['__ZN15ParticleEmitter20EmitterParticleSpeedEf'] = createExportWrapper('_ZN15ParticleEmitter20EmitterParticleSpeedEf', 2);
var _EmitterVariance = Module['_EmitterVariance'] = createExportWrapper('EmitterVariance', 2);
var __ZN15ParticleEmitter15EmitterVarianceEf = Module['__ZN15ParticleEmitter15EmitterVarianceEf'] = createExportWrapper('_ZN15ParticleEmitter15EmitterVarianceEf', 2);
var _EntityAlpha = Module['_EntityAlpha'] = createExportWrapper('EntityAlpha', 2);
var _EntityAutoFade = Module['_EntityAutoFade'] = createExportWrapper('EntityAutoFade', 3);
var _EntityBlend = Module['_EntityBlend'] = createExportWrapper('EntityBlend', 2);
var _EntityBox = Module['_EntityBox'] = createExportWrapper('EntityBox', 7);
var _EntityClass = Module['_EntityClass'] = createExportWrapper('EntityClass', 1);
var _EntityCollided = Module['_EntityCollided'] = createExportWrapper('EntityCollided', 2);
var _EntityColor = Module['_EntityColor'] = createExportWrapper('EntityColor', 4);
var _EntityDistance = Module['_EntityDistance'] = createExportWrapper('EntityDistance', 2);
var _EntityFX = Module['_EntityFX'] = createExportWrapper('EntityFX', 2);
var _EntityInView = Module['_EntityInView'] = createExportWrapper('EntityInView', 2);
var __ZN6Camera12EntityInViewEP6Entity = Module['__ZN6Camera12EntityInViewEP6Entity'] = createExportWrapper('_ZN6Camera12EntityInViewEP6Entity', 2);
var _EntityName = Module['_EntityName'] = createExportWrapper('EntityName', 1);
var _EntityOrder = Module['_EntityOrder'] = createExportWrapper('EntityOrder', 2);
var _EntityParent = Module['_EntityParent'] = createExportWrapper('EntityParent', 3);
var _EntityPick = Module['_EntityPick'] = createExportWrapper('EntityPick', 2);
var __ZN4Pick10EntityPickEP6Entityf = Module['__ZN4Pick10EntityPickEP6Entityf'] = createExportWrapper('_ZN4Pick10EntityPickEP6Entityf', 2);
var _EntityPickMode = Module['_EntityPickMode'] = createExportWrapper('EntityPickMode', 3);
var _EntityPitch = Module['_EntityPitch'] = createExportWrapper('EntityPitch', 2);
var _EntityRadius = Module['_EntityRadius'] = createExportWrapper('EntityRadius', 3);
var _EntityRoll = Module['_EntityRoll'] = createExportWrapper('EntityRoll', 2);
var _EntityShininess = Module['_EntityShininess'] = createExportWrapper('EntityShininess', 2);
var _EntityTexture = Module['_EntityTexture'] = createExportWrapper('EntityTexture', 4);
var _EntityType = Module['_EntityType'] = createExportWrapper('EntityType', 3);
var _EntityVisible = Module['_EntityVisible'] = createExportWrapper('EntityVisible', 2);
var __ZN4Pick13EntityVisibleEP6EntityS1_ = Module['__ZN4Pick13EntityVisibleEP6EntityS1_'] = createExportWrapper('_ZN4Pick13EntityVisibleEP6EntityS1_', 2);
var _EntityX = Module['_EntityX'] = createExportWrapper('EntityX', 2);
var _EntityY = Module['_EntityY'] = createExportWrapper('EntityY', 2);
var _EntityYaw = Module['_EntityYaw'] = createExportWrapper('EntityYaw', 2);
var _EntityZ = Module['_EntityZ'] = createExportWrapper('EntityZ', 2);
var _ExtractAnimSeq = Module['_ExtractAnimSeq'] = createExportWrapper('ExtractAnimSeq', 4);
var _FindChild = Module['_FindChild'] = createExportWrapper('FindChild', 2);
var _FindSurface = Module['_FindSurface'] = createExportWrapper('FindSurface', 2);
var _FitMesh = Module['_FitMesh'] = createExportWrapper('FitMesh', 8);
var __ZN4Mesh7FitMeshEffffffi = Module['__ZN4Mesh7FitMeshEffffffi'] = createExportWrapper('_ZN4Mesh7FitMeshEffffffi', 8);
var _FlipMesh = Module['_FlipMesh'] = createExportWrapper('FlipMesh', 1);
var __ZN4Mesh8FlipMeshEv = Module['__ZN4Mesh8FlipMeshEv'] = createExportWrapper('_ZN4Mesh8FlipMeshEv', 1);
var _FluidArray = Module['_FluidArray'] = createExportWrapper('FluidArray', 5);
var __ZN5Fluid10FluidArrayEPfiii = Module['__ZN5Fluid10FluidArrayEPfiii'] = createExportWrapper('_ZN5Fluid10FluidArrayEPfiii', 5);
var _FluidFunction = Module['_FluidFunction'] = createExportWrapper('FluidFunction', 2);
var __ZN5Fluid13FluidFunctionEPFffffE = Module['__ZN5Fluid13FluidFunctionEPFffffE'] = createExportWrapper('_ZN5Fluid13FluidFunctionEPFffffE', 2);
var _FluidThreshold = Module['_FluidThreshold'] = createExportWrapper('FluidThreshold', 2);
var _FreeBrush = Module['_FreeBrush'] = createExportWrapper('FreeBrush', 1);
var _FreeConstraint = Module['_FreeConstraint'] = createExportWrapper('FreeConstraint', 1);
var __ZN10Constraint14FreeConstraintEv = Module['__ZN10Constraint14FreeConstraintEv'] = createExportWrapper('_ZN10Constraint14FreeConstraintEv', 1);
var _FreeEntity = Module['_FreeEntity'] = createExportWrapper('FreeEntity', 1);
var _FreePostFX = Module['_FreePostFX'] = createExportWrapper('FreePostFX', 1);
var __ZN6PostFX10FreePostFXEv = Module['__ZN6PostFX10FreePostFXEv'] = createExportWrapper('_ZN6PostFX10FreePostFXEv', 1);
var _FreeRigidBody = Module['_FreeRigidBody'] = createExportWrapper('FreeRigidBody', 1);
var __ZN9RigidBody13FreeRigidBodyEv = Module['__ZN9RigidBody13FreeRigidBodyEv'] = createExportWrapper('_ZN9RigidBody13FreeRigidBodyEv', 1);
var _FreeShader = Module['_FreeShader'] = createExportWrapper('FreeShader', 1);
var __ZN6Shader10FreeShaderEv = Module['__ZN6Shader10FreeShaderEv'] = createExportWrapper('_ZN6Shader10FreeShaderEv', 1);
var _FreeShadow = Module['_FreeShadow'] = createExportWrapper('FreeShadow', 1);
var __ZN12ShadowObject10FreeShadowEv = Module['__ZN12ShadowObject10FreeShadowEv'] = createExportWrapper('_ZN12ShadowObject10FreeShadowEv', 1);
var _FreeTexture = Module['_FreeTexture'] = createExportWrapper('FreeTexture', 1);
var __ZN7Texture11FreeTextureEv = Module['__ZN7Texture11FreeTextureEv'] = createExportWrapper('_ZN7Texture11FreeTextureEv', 1);
var _GeosphereHeight = Module['_GeosphereHeight'] = createExportWrapper('GeosphereHeight', 2);
var _GetBone = Module['_GetBone'] = createExportWrapper('GetBone', 2);
var _GetBrushTexture = Module['_GetBrushTexture'] = createExportWrapper('GetBrushTexture', 2);
var _GetChild = Module['_GetChild'] = createExportWrapper('GetChild', 2);
var _GetEntityBrush = Module['_GetEntityBrush'] = createExportWrapper('GetEntityBrush', 1);
var _GetEntityType = Module['_GetEntityType'] = createExportWrapper('GetEntityType', 1);
var _GetMatElement = Module['_GetMatElement'] = createExportWrapper('GetMatElement', 3);
var _GetParentEntity = Module['_GetParentEntity'] = createExportWrapper('GetParentEntity', 1);
var _GetSurface = Module['_GetSurface'] = createExportWrapper('GetSurface', 2);
var __ZN4Mesh10GetSurfaceEi = Module['__ZN4Mesh10GetSurfaceEi'] = createExportWrapper('_ZN4Mesh10GetSurfaceEi', 2);
var _GetSurfaceBrush = Module['_GetSurfaceBrush'] = createExportWrapper('GetSurfaceBrush', 1);
var _Graphics3D = Module['_Graphics3D'] = createExportWrapper('Graphics3D', 5);
var __ZN6Global8GraphicsEv = Module['__ZN6Global8GraphicsEv'] = createExportWrapper('_ZN6Global8GraphicsEv', 0);
var _HandleSprite = Module['_HandleSprite'] = createExportWrapper('HandleSprite', 3);
var __ZN6Sprite12HandleSpriteEff = Module['__ZN6Sprite12HandleSpriteEff'] = createExportWrapper('_ZN6Sprite12HandleSpriteEff', 3);
var _HideEntity = Module['_HideEntity'] = createExportWrapper('HideEntity', 1);
var _LightColor = Module['_LightColor'] = createExportWrapper('LightColor', 4);
var __ZN5Light10LightColorEfff = Module['__ZN5Light10LightColorEfff'] = createExportWrapper('_ZN5Light10LightColorEfff', 4);
var _LightConeAngles = Module['_LightConeAngles'] = createExportWrapper('LightConeAngles', 3);
var __ZN5Light15LightConeAnglesEff = Module['__ZN5Light15LightConeAnglesEff'] = createExportWrapper('_ZN5Light15LightConeAnglesEff', 3);
var _LightRange = Module['_LightRange'] = createExportWrapper('LightRange', 2);
var __ZN5Light10LightRangeEf = Module['__ZN5Light10LightRangeEf'] = createExportWrapper('_ZN5Light10LightRangeEf', 2);
var _LinePick = Module['_LinePick'] = createExportWrapper('LinePick', 7);
var __ZN4Pick8LinePickEfffffff = Module['__ZN4Pick8LinePickEfffffff'] = createExportWrapper('_ZN4Pick8LinePickEfffffff', 7);
var _LoadAnimMesh = Module['_LoadAnimMesh'] = createExportWrapper('LoadAnimMesh', 2);
var __ZN4Mesh12LoadAnimMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN4Mesh12LoadAnimMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN4Mesh12LoadAnimMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var _LoadAnimSeq = Module['_LoadAnimSeq'] = createExportWrapper('LoadAnimSeq', 2);
var _LoadAnimTexture = Module['_LoadAnimTexture'] = createExportWrapper('LoadAnimTexture', 6);
var __ZN7Texture15LoadAnimTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii = Module['__ZN7Texture15LoadAnimTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii'] = createExportWrapper('_ZN7Texture15LoadAnimTextureENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii', 6);
var _LoadBrush = Module['_LoadBrush'] = createExportWrapper('LoadBrush', 4);
var _LoadGeosphere = Module['_LoadGeosphere'] = createExportWrapper('LoadGeosphere', 2);
var __ZN9Geosphere13LoadGeosphereENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN9Geosphere13LoadGeosphereENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN9Geosphere13LoadGeosphereENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var _LoadMesh = Module['_LoadMesh'] = createExportWrapper('LoadMesh', 2);
var __ZN4Mesh8LoadMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN4Mesh8LoadMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN4Mesh8LoadMeshENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var _LoadTerrain = Module['_LoadTerrain'] = createExportWrapper('LoadTerrain', 2);
var __ZN7Terrain11LoadTerrainENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN7Terrain11LoadTerrainENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN7Terrain11LoadTerrainENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var _LoadTexture = Module['_LoadTexture'] = createExportWrapper('LoadTexture', 2);
var _LoadSprite = Module['_LoadSprite'] = createExportWrapper('LoadSprite', 3);
var __ZN6Sprite10LoadSpriteENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP6Entity = Module['__ZN6Sprite10LoadSpriteENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP6Entity'] = createExportWrapper('_ZN6Sprite10LoadSpriteENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP6Entity', 3);
var _MeshCSG = Module['_MeshCSG'] = createExportWrapper('MeshCSG', 3);
var __ZN3CSG7MeshCSGEP4MeshS1_i = Module['__ZN3CSG7MeshCSGEP4MeshS1_i'] = createExportWrapper('_ZN3CSG7MeshCSGEP4MeshS1_i', 3);
var _MeshDepth = Module['_MeshDepth'] = createExportWrapper('MeshDepth', 1);
var __ZN4Mesh9MeshDepthEv = Module['__ZN4Mesh9MeshDepthEv'] = createExportWrapper('_ZN4Mesh9MeshDepthEv', 1);
var _MeshesIntersect = Module['_MeshesIntersect'] = createExportWrapper('MeshesIntersect', 2);
var __ZN4Mesh15MeshesIntersectEPS_ = Module['__ZN4Mesh15MeshesIntersectEPS_'] = createExportWrapper('_ZN4Mesh15MeshesIntersectEPS_', 2);
var _MeshHeight = Module['_MeshHeight'] = createExportWrapper('MeshHeight', 1);
var __ZN4Mesh10MeshHeightEv = Module['__ZN4Mesh10MeshHeightEv'] = createExportWrapper('_ZN4Mesh10MeshHeightEv', 1);
var _MeshWidth = Module['_MeshWidth'] = createExportWrapper('MeshWidth', 1);
var __ZN4Mesh9MeshWidthEv = Module['__ZN4Mesh9MeshWidthEv'] = createExportWrapper('_ZN4Mesh9MeshWidthEv', 1);
var _ModifyGeosphere = Module['_ModifyGeosphere'] = createExportWrapper('ModifyGeosphere', 4);
var __ZN9Geosphere15ModifyGeosphereEiif = Module['__ZN9Geosphere15ModifyGeosphereEiif'] = createExportWrapper('_ZN9Geosphere15ModifyGeosphereEiif', 4);
var _ModifyTerrain = Module['_ModifyTerrain'] = createExportWrapper('ModifyTerrain', 4);
var __ZN7Terrain13ModifyTerrainEiif = Module['__ZN7Terrain13ModifyTerrainEiif'] = createExportWrapper('_ZN7Terrain13ModifyTerrainEiif', 4);
var _MoveBone = Module['_MoveBone'] = createExportWrapper('MoveBone', 5);
var _MoveEntity = Module['_MoveEntity'] = createExportWrapper('MoveEntity', 4);
var _NameEntity = Module['_NameEntity'] = createExportWrapper('NameEntity', 2);
var _NameTexture = Module['_NameTexture'] = createExportWrapper('NameTexture', 2);
var _PaintEntity = Module['_PaintEntity'] = createExportWrapper('PaintEntity', 2);
var _PaintMesh = Module['_PaintMesh'] = createExportWrapper('PaintMesh', 2);
var __ZN4Mesh9PaintMeshEP5Brush = Module['__ZN4Mesh9PaintMeshEP5Brush'] = createExportWrapper('_ZN4Mesh9PaintMeshEP5Brush', 2);
var _PaintSurface = Module['_PaintSurface'] = createExportWrapper('PaintSurface', 2);
var _ParticleColor = Module['_ParticleColor'] = createExportWrapper('ParticleColor', 5);
var __ZN13ParticleBatch16GetParticleBatchEP7Textureii = Module['__ZN13ParticleBatch16GetParticleBatchEP7Textureii'] = createExportWrapper('_ZN13ParticleBatch16GetParticleBatchEP7Textureii', 3);
var _ParticleVector = Module['_ParticleVector'] = createExportWrapper('ParticleVector', 4);
var _ParticleTrail = Module['_ParticleTrail'] = createExportWrapper('ParticleTrail', 2);
var _PickedEntity = Module['_PickedEntity'] = createExportWrapper('PickedEntity', 0);
var __ZN4Pick12PickedEntityEv = Module['__ZN4Pick12PickedEntityEv'] = createExportWrapper('_ZN4Pick12PickedEntityEv', 0);
var _PickedNX = Module['_PickedNX'] = createExportWrapper('PickedNX', 0);
var __ZN4Pick8PickedNXEv = Module['__ZN4Pick8PickedNXEv'] = createExportWrapper('_ZN4Pick8PickedNXEv', 0);
var _PickedNY = Module['_PickedNY'] = createExportWrapper('PickedNY', 0);
var __ZN4Pick8PickedNYEv = Module['__ZN4Pick8PickedNYEv'] = createExportWrapper('_ZN4Pick8PickedNYEv', 0);
var _PickedNZ = Module['_PickedNZ'] = createExportWrapper('PickedNZ', 0);
var __ZN4Pick8PickedNZEv = Module['__ZN4Pick8PickedNZEv'] = createExportWrapper('_ZN4Pick8PickedNZEv', 0);
var _PickedSurface = Module['_PickedSurface'] = createExportWrapper('PickedSurface', 0);
var __ZN4Pick13PickedSurfaceEv = Module['__ZN4Pick13PickedSurfaceEv'] = createExportWrapper('_ZN4Pick13PickedSurfaceEv', 0);
var _PickedTime = Module['_PickedTime'] = createExportWrapper('PickedTime', 0);
var __ZN4Pick10PickedTimeEv = Module['__ZN4Pick10PickedTimeEv'] = createExportWrapper('_ZN4Pick10PickedTimeEv', 0);
var _PickedTriangle = Module['_PickedTriangle'] = createExportWrapper('PickedTriangle', 0);
var __ZN4Pick14PickedTriangleEv = Module['__ZN4Pick14PickedTriangleEv'] = createExportWrapper('_ZN4Pick14PickedTriangleEv', 0);
var _PickedX = Module['_PickedX'] = createExportWrapper('PickedX', 0);
var __ZN4Pick7PickedXEv = Module['__ZN4Pick7PickedXEv'] = createExportWrapper('_ZN4Pick7PickedXEv', 0);
var _PickedY = Module['_PickedY'] = createExportWrapper('PickedY', 0);
var __ZN4Pick7PickedYEv = Module['__ZN4Pick7PickedYEv'] = createExportWrapper('_ZN4Pick7PickedYEv', 0);
var _PickedZ = Module['_PickedZ'] = createExportWrapper('PickedZ', 0);
var __ZN4Pick7PickedZEv = Module['__ZN4Pick7PickedZEv'] = createExportWrapper('_ZN4Pick7PickedZEv', 0);
var _PointEntity = Module['_PointEntity'] = createExportWrapper('PointEntity', 3);
var _PositionBone = Module['_PositionBone'] = createExportWrapper('PositionBone', 4);
var _PositionEntity = Module['_PositionEntity'] = createExportWrapper('PositionEntity', 5);
var _PositionMesh = Module['_PositionMesh'] = createExportWrapper('PositionMesh', 4);
var __ZN4Mesh12PositionMeshEfff = Module['__ZN4Mesh12PositionMeshEfff'] = createExportWrapper('_ZN4Mesh12PositionMeshEfff', 4);
var _PositionTexture = Module['_PositionTexture'] = createExportWrapper('PositionTexture', 3);
var __ZN7Texture15PositionTextureEff = Module['__ZN7Texture15PositionTextureEff'] = createExportWrapper('_ZN7Texture15PositionTextureEff', 3);
var _ProjectedX = Module['_ProjectedX'] = createExportWrapper('ProjectedX', 0);
var _ProjectedY = Module['_ProjectedY'] = createExportWrapper('ProjectedY', 0);
var _ProjectedZ = Module['_ProjectedZ'] = createExportWrapper('ProjectedZ', 0);
var _RenderWorld = Module['_RenderWorld'] = createExportWrapper('RenderWorld', 0);
var __ZN6Global11RenderWorldEv = Module['__ZN6Global11RenderWorldEv'] = createExportWrapper('_ZN6Global11RenderWorldEv', 0);
var _RepeatMesh = Module['_RepeatMesh'] = createExportWrapper('RepeatMesh', 2);
var __ZN4Mesh10RepeatMeshEP6Entity = Module['__ZN4Mesh10RepeatMeshEP6Entity'] = createExportWrapper('_ZN4Mesh10RepeatMeshEP6Entity', 2);
var _ResetEntity = Module['_ResetEntity'] = createExportWrapper('ResetEntity', 1);
var _ResetShadow = Module['_ResetShadow'] = createExportWrapper('ResetShadow', 1);
var _RotateBone = Module['_RotateBone'] = createExportWrapper('RotateBone', 4);
var _RotateEntity = Module['_RotateEntity'] = createExportWrapper('RotateEntity', 5);
var _RotateMesh = Module['_RotateMesh'] = createExportWrapper('RotateMesh', 4);
var __ZN4Mesh10RotateMeshEfff = Module['__ZN4Mesh10RotateMeshEfff'] = createExportWrapper('_ZN4Mesh10RotateMeshEfff', 4);
var _RotateSprite = Module['_RotateSprite'] = createExportWrapper('RotateSprite', 2);
var __ZN6Sprite12RotateSpriteEf = Module['__ZN6Sprite12RotateSpriteEf'] = createExportWrapper('_ZN6Sprite12RotateSpriteEf', 2);
var _RotateTexture = Module['_RotateTexture'] = createExportWrapper('RotateTexture', 2);
var __ZN7Texture13RotateTextureEf = Module['__ZN7Texture13RotateTextureEf'] = createExportWrapper('_ZN7Texture13RotateTextureEf', 2);
var _ScaleEntity = Module['_ScaleEntity'] = createExportWrapper('ScaleEntity', 5);
var _ScaleMesh = Module['_ScaleMesh'] = createExportWrapper('ScaleMesh', 4);
var __ZN4Mesh9ScaleMeshEfff = Module['__ZN4Mesh9ScaleMeshEfff'] = createExportWrapper('_ZN4Mesh9ScaleMeshEfff', 4);
var _ScaleSprite = Module['_ScaleSprite'] = createExportWrapper('ScaleSprite', 3);
var __ZN6Sprite11ScaleSpriteEff = Module['__ZN6Sprite11ScaleSpriteEff'] = createExportWrapper('_ZN6Sprite11ScaleSpriteEff', 3);
var _ScaleTexture = Module['_ScaleTexture'] = createExportWrapper('ScaleTexture', 3);
var __ZN7Texture12ScaleTextureEff = Module['__ZN7Texture12ScaleTextureEff'] = createExportWrapper('_ZN7Texture12ScaleTextureEff', 3);
var _SetAnimKey = Module['_SetAnimKey'] = createExportWrapper('SetAnimKey', 5);
var _SetAnimTime = Module['_SetAnimTime'] = createExportWrapper('SetAnimTime', 3);
var _SetCubeFace = Module['_SetCubeFace'] = createExportWrapper('SetCubeFace', 2);
var _SetCubeMode = Module['_SetCubeMode'] = createExportWrapper('SetCubeMode', 2);
var _ShowEntity = Module['_ShowEntity'] = createExportWrapper('ShowEntity', 1);
var _SkinMesh = Module['_SkinMesh'] = createExportWrapper('SkinMesh', 11);
var __ZN4Mesh8SkinMeshEiiifififif = Module['__ZN4Mesh8SkinMeshEiiifififif'] = createExportWrapper('_ZN4Mesh8SkinMeshEiiifififif', 11);
var _SpriteRenderMode = Module['_SpriteRenderMode'] = createExportWrapper('SpriteRenderMode', 2);
var __ZN6Sprite16SpriteRenderModeEi = Module['__ZN6Sprite16SpriteRenderModeEi'] = createExportWrapper('_ZN6Sprite16SpriteRenderModeEi', 2);
var _SpriteViewMode = Module['_SpriteViewMode'] = createExportWrapper('SpriteViewMode', 2);
var __ZN6Sprite14SpriteViewModeEi = Module['__ZN6Sprite14SpriteViewModeEi'] = createExportWrapper('_ZN6Sprite14SpriteViewModeEi', 2);
var _StencilAlpha = Module['_StencilAlpha'] = createExportWrapper('StencilAlpha', 2);
var __ZN7Stencil12StencilAlphaEf = Module['__ZN7Stencil12StencilAlphaEf'] = createExportWrapper('_ZN7Stencil12StencilAlphaEf', 2);
var _StencilClsColor = Module['_StencilClsColor'] = createExportWrapper('StencilClsColor', 4);
var __ZN7Stencil15StencilClsColorEfff = Module['__ZN7Stencil15StencilClsColorEfff'] = createExportWrapper('_ZN7Stencil15StencilClsColorEfff', 4);
var _StencilClsMode = Module['_StencilClsMode'] = createExportWrapper('StencilClsMode', 3);
var __ZN7Stencil14StencilClsModeEii = Module['__ZN7Stencil14StencilClsModeEii'] = createExportWrapper('_ZN7Stencil14StencilClsModeEii', 3);
var _StencilMesh = Module['_StencilMesh'] = createExportWrapper('StencilMesh', 3);
var __ZN7Stencil11StencilMeshEP4Meshi = Module['__ZN7Stencil11StencilMeshEP4Meshi'] = createExportWrapper('_ZN7Stencil11StencilMeshEP4Meshi', 3);
var _StencilMode = Module['_StencilMode'] = createExportWrapper('StencilMode', 3);
var __ZN7Stencil11StencilModeEii = Module['__ZN7Stencil11StencilModeEii'] = createExportWrapper('_ZN7Stencil11StencilModeEii', 3);
var _TerrainHeight = Module['_TerrainHeight'] = createExportWrapper('TerrainHeight', 3);
var __ZN7Terrain13TerrainHeightEii = Module['__ZN7Terrain13TerrainHeightEii'] = createExportWrapper('_ZN7Terrain13TerrainHeightEii', 3);
var _TerrainX = Module['_TerrainX'] = createExportWrapper('TerrainX', 4);
var __ZN7Terrain8TerrainXEfff = Module['__ZN7Terrain8TerrainXEfff'] = createExportWrapper('_ZN7Terrain8TerrainXEfff', 4);
var _TerrainY = Module['_TerrainY'] = createExportWrapper('TerrainY', 4);
var __ZN7Terrain8TerrainYEfff = Module['__ZN7Terrain8TerrainYEfff'] = createExportWrapper('_ZN7Terrain8TerrainYEfff', 4);
var _TerrainZ = Module['_TerrainZ'] = createExportWrapper('TerrainZ', 4);
var __ZN7Terrain8TerrainZEfff = Module['__ZN7Terrain8TerrainZEfff'] = createExportWrapper('_ZN7Terrain8TerrainZEfff', 4);
var _TextureBlend = Module['_TextureBlend'] = createExportWrapper('TextureBlend', 2);
var __ZN7Texture12TextureBlendEi = Module['__ZN7Texture12TextureBlendEi'] = createExportWrapper('_ZN7Texture12TextureBlendEi', 2);
var _TextureCoords = Module['_TextureCoords'] = createExportWrapper('TextureCoords', 2);
var __ZN7Texture13TextureCoordsEi = Module['__ZN7Texture13TextureCoordsEi'] = createExportWrapper('_ZN7Texture13TextureCoordsEi', 2);
var _TextureHeight = Module['_TextureHeight'] = createExportWrapper('TextureHeight', 1);
var _TextureFilter = Module['_TextureFilter'] = createExportWrapper('TextureFilter', 2);
var __ZN7Texture16AddTextureFilterENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN7Texture16AddTextureFilterENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN7Texture16AddTextureFilterENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 2);
var _TextureName = Module['_TextureName'] = createExportWrapper('TextureName', 1);
var _TextureWidth = Module['_TextureWidth'] = createExportWrapper('TextureWidth', 1);
var _TFormedX = Module['_TFormedX'] = createExportWrapper('TFormedX', 0);
var _TFormedY = Module['_TFormedY'] = createExportWrapper('TFormedY', 0);
var _TFormedZ = Module['_TFormedZ'] = createExportWrapper('TFormedZ', 0);
var _TFormNormal = Module['_TFormNormal'] = createExportWrapper('TFormNormal', 5);
var _TFormPoint = Module['_TFormPoint'] = createExportWrapper('TFormPoint', 5);
var _TFormVector = Module['_TFormVector'] = createExportWrapper('TFormVector', 5);
var _TranslateEntity = Module['_TranslateEntity'] = createExportWrapper('TranslateEntity', 5);
var _TriangleVertex = Module['_TriangleVertex'] = createExportWrapper('TriangleVertex', 3);
var _TurnEntity = Module['_TurnEntity'] = createExportWrapper('TurnEntity', 5);
var _UpdateNormals = Module['_UpdateNormals'] = createExportWrapper('UpdateNormals', 1);
var __ZN9Geosphere13UpdateNormalsEi = Module['__ZN9Geosphere13UpdateNormalsEi'] = createExportWrapper('_ZN9Geosphere13UpdateNormalsEi', 2);
var __ZN7Terrain13UpdateNormalsEv = Module['__ZN7Terrain13UpdateNormalsEv'] = createExportWrapper('_ZN7Terrain13UpdateNormalsEv', 1);
var _UpdateTexCoords = Module['_UpdateTexCoords'] = createExportWrapper('UpdateTexCoords', 1);
var _UpdateWorld = Module['_UpdateWorld'] = createExportWrapper('UpdateWorld', 1);
var __ZN6Global11UpdateWorldEf = Module['__ZN6Global11UpdateWorldEf'] = createExportWrapper('_ZN6Global11UpdateWorldEf', 1);
var _UseStencil = Module['_UseStencil'] = createExportWrapper('UseStencil', 1);
var __ZN7Stencil10UseStencilEv = Module['__ZN7Stencil10UseStencilEv'] = createExportWrapper('_ZN7Stencil10UseStencilEv', 1);
var _VectorPitch = Module['_VectorPitch'] = createExportWrapper('VectorPitch', 3);
var _VectorYaw = Module['_VectorYaw'] = createExportWrapper('VectorYaw', 3);
var _VertexAlpha = Module['_VertexAlpha'] = createExportWrapper('VertexAlpha', 2);
var _VertexBlue = Module['_VertexBlue'] = createExportWrapper('VertexBlue', 2);
var _VertexColor = Module['_VertexColor'] = createExportWrapper('VertexColor', 6);
var _VertexCoords = Module['_VertexCoords'] = createExportWrapper('VertexCoords', 5);
var _VertexGreen = Module['_VertexGreen'] = createExportWrapper('VertexGreen', 2);
var _VertexNormal = Module['_VertexNormal'] = createExportWrapper('VertexNormal', 5);
var _VertexNX = Module['_VertexNX'] = createExportWrapper('VertexNX', 2);
var _VertexNY = Module['_VertexNY'] = createExportWrapper('VertexNY', 2);
var _VertexNZ = Module['_VertexNZ'] = createExportWrapper('VertexNZ', 2);
var _VertexRed = Module['_VertexRed'] = createExportWrapper('VertexRed', 2);
var _VertexTexCoords = Module['_VertexTexCoords'] = createExportWrapper('VertexTexCoords', 6);
var _VertexU = Module['_VertexU'] = createExportWrapper('VertexU', 3);
var _VertexV = Module['_VertexV'] = createExportWrapper('VertexV', 3);
var _VertexW = Module['_VertexW'] = createExportWrapper('VertexW', 3);
var _VertexX = Module['_VertexX'] = createExportWrapper('VertexX', 2);
var _VertexY = Module['_VertexY'] = createExportWrapper('VertexY', 2);
var _VertexZ = Module['_VertexZ'] = createExportWrapper('VertexZ', 2);
var _VoxelSpriteMaterial = Module['_VoxelSpriteMaterial'] = createExportWrapper('VoxelSpriteMaterial', 2);
var __ZN11VoxelSprite19VoxelSpriteMaterialEP8Material = Module['__ZN11VoxelSprite19VoxelSpriteMaterialEP8Material'] = createExportWrapper('_ZN11VoxelSprite19VoxelSpriteMaterialEP8Material', 2);
var _Wireframe = Module['_Wireframe'] = createExportWrapper('Wireframe', 1);
var _EntityScaleX = Module['_EntityScaleX'] = createExportWrapper('EntityScaleX', 2);
var _EntityScaleY = Module['_EntityScaleY'] = createExportWrapper('EntityScaleY', 2);
var _EntityScaleZ = Module['_EntityScaleZ'] = createExportWrapper('EntityScaleZ', 2);
var _LoadShader = Module['_LoadShader'] = createExportWrapper('LoadShader', 3);
var __ZN6Shader20CreateShaderMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN6Shader20CreateShaderMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN6Shader20CreateShaderMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 1);
var __ZN6Shader9AddShaderENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN6Shader9AddShaderENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN6Shader9AddShaderENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 3);
var _CreateShader = Module['_CreateShader'] = createExportWrapper('CreateShader', 3);
var __ZN6Shader19AddShaderFromStringENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN6Shader19AddShaderFromStringENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN6Shader19AddShaderFromStringENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 3);
var _LoadShaderVGF = Module['_LoadShaderVGF'] = createExportWrapper('LoadShaderVGF', 4);
var _CreateShaderVGF = Module['_CreateShaderVGF'] = createExportWrapper('CreateShaderVGF', 4);
var _ShadeSurface = Module['_ShadeSurface'] = createExportWrapper('ShadeSurface', 2);
var _ShadeMesh = Module['_ShadeMesh'] = createExportWrapper('ShadeMesh', 2);
var _ShadeEntity = Module['_ShadeEntity'] = createExportWrapper('ShadeEntity', 2);
var _ShaderTexture = Module['_ShaderTexture'] = createExportWrapper('ShaderTexture', 4);
var __ZN6Shader10AddSamplerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP7Texturei = Module['__ZN6Shader10AddSamplerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP7Texturei'] = createExportWrapper('_ZN6Shader10AddSamplerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiP7Texturei', 5);
var _SetFloat = Module['_SetFloat'] = createExportWrapper('SetFloat', 3);
var __ZN6Shader8SetFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEf = Module['__ZN6Shader8SetFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEf'] = createExportWrapper('_ZN6Shader8SetFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEf', 3);
var _SetFloat2 = Module['_SetFloat2'] = createExportWrapper('SetFloat2', 4);
var __ZN6Shader9SetFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEff = Module['__ZN6Shader9SetFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEff'] = createExportWrapper('_ZN6Shader9SetFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEff', 4);
var _SetFloat3 = Module['_SetFloat3'] = createExportWrapper('SetFloat3', 5);
var __ZN6Shader9SetFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEfff = Module['__ZN6Shader9SetFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEfff'] = createExportWrapper('_ZN6Shader9SetFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEfff', 5);
var _SetFloat4 = Module['_SetFloat4'] = createExportWrapper('SetFloat4', 6);
var __ZN6Shader9SetFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEffff = Module['__ZN6Shader9SetFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEffff'] = createExportWrapper('_ZN6Shader9SetFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEffff', 6);
var _UseFloat = Module['_UseFloat'] = createExportWrapper('UseFloat', 3);
var __ZN6Shader8UseFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPf = Module['__ZN6Shader8UseFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPf'] = createExportWrapper('_ZN6Shader8UseFloatENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPf', 3);
var _UseFloat2 = Module['_UseFloat2'] = createExportWrapper('UseFloat2', 4);
var __ZN6Shader9UseFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_ = Module['__ZN6Shader9UseFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_'] = createExportWrapper('_ZN6Shader9UseFloat2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_', 4);
var _UseFloat3 = Module['_UseFloat3'] = createExportWrapper('UseFloat3', 5);
var __ZN6Shader9UseFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_ = Module['__ZN6Shader9UseFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_'] = createExportWrapper('_ZN6Shader9UseFloat3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_', 5);
var _UseFloat4 = Module['_UseFloat4'] = createExportWrapper('UseFloat4', 6);
var __ZN6Shader9UseFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_S7_ = Module['__ZN6Shader9UseFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_S7_'] = createExportWrapper('_ZN6Shader9UseFloat4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPfS7_S7_S7_', 6);
var _SetInteger = Module['_SetInteger'] = createExportWrapper('SetInteger', 3);
var __ZN6Shader10SetIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN6Shader10SetIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN6Shader10SetIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 3);
var _SetInteger2 = Module['_SetInteger2'] = createExportWrapper('SetInteger2', 4);
var __ZN6Shader11SetInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEii = Module['__ZN6Shader11SetInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEii'] = createExportWrapper('_ZN6Shader11SetInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEii', 4);
var _SetInteger3 = Module['_SetInteger3'] = createExportWrapper('SetInteger3', 5);
var __ZN6Shader11SetInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiii = Module['__ZN6Shader11SetInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiii'] = createExportWrapper('_ZN6Shader11SetInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiii', 5);
var _SetInteger4 = Module['_SetInteger4'] = createExportWrapper('SetInteger4', 6);
var __ZN6Shader11SetInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiii = Module['__ZN6Shader11SetInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiii'] = createExportWrapper('_ZN6Shader11SetInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiii', 6);
var _UseInteger = Module['_UseInteger'] = createExportWrapper('UseInteger', 3);
var __ZN6Shader10UseIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPi = Module['__ZN6Shader10UseIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPi'] = createExportWrapper('_ZN6Shader10UseIntegerENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPi', 3);
var _UseInteger2 = Module['_UseInteger2'] = createExportWrapper('UseInteger2', 4);
var __ZN6Shader11UseInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_ = Module['__ZN6Shader11UseInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_'] = createExportWrapper('_ZN6Shader11UseInteger2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_', 4);
var _UseInteger3 = Module['_UseInteger3'] = createExportWrapper('UseInteger3', 5);
var __ZN6Shader11UseInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_ = Module['__ZN6Shader11UseInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_'] = createExportWrapper('_ZN6Shader11UseInteger3ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_', 5);
var _UseInteger4 = Module['_UseInteger4'] = createExportWrapper('UseInteger4', 6);
var __ZN6Shader11UseInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_S7_ = Module['__ZN6Shader11UseInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_S7_'] = createExportWrapper('_ZN6Shader11UseInteger4ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEPiS7_S7_S7_', 6);
var _UseSurface = Module['_UseSurface'] = createExportWrapper('UseSurface', 4);
var __ZN6Shader10UseSurfaceENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP7Surfacei = Module['__ZN6Shader10UseSurfaceENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP7Surfacei'] = createExportWrapper('_ZN6Shader10UseSurfaceENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP7Surfacei', 4);
var _UseMatrix = Module['_UseMatrix'] = createExportWrapper('UseMatrix', 3);
var __ZN6Shader9UseMatrixENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN6Shader9UseMatrixENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN6Shader9UseMatrixENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 3);
var _UseEntity = Module['_UseEntity'] = createExportWrapper('UseEntity', 4);
var __ZN6Shader9UseEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entityi = Module['__ZN6Shader9UseEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entityi'] = createExportWrapper('_ZN6Shader9UseEntityENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entityi', 4);
var _ShaderFunction = Module['_ShaderFunction'] = createExportWrapper('ShaderFunction', 3);
var __ZN6Shader11UseFunctionEPFvvES1_ = Module['__ZN6Shader11UseFunctionEPFvvES1_'] = createExportWrapper('_ZN6Shader11UseFunctionEPFvvES1_', 3);
var _LoadMaterial = Module['_LoadMaterial'] = createExportWrapper('LoadMaterial', 6);
var __ZN8Material12LoadMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii = Module['__ZN8Material12LoadMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii'] = createExportWrapper('_ZN8Material12LoadMaterialENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEiiiii', 6);
var _ShaderMaterial = Module['_ShaderMaterial'] = createExportWrapper('ShaderMaterial', 4);
var _AmbientShader = Module['_AmbientShader'] = createExportWrapper('AmbientShader', 1);
var _GetShaderProgram = Module['_GetShaderProgram'] = createExportWrapper('GetShaderProgram', 1);
var _CreateOcTree = Module['_CreateOcTree'] = createExportWrapper('CreateOcTree', 4);
var __ZN6OcTree12CreateOcTreeEfffP6Entity = Module['__ZN6OcTree12CreateOcTreeEfffP6Entity'] = createExportWrapper('_ZN6OcTree12CreateOcTreeEfffP6Entity', 4);
var _OctreeBlock = Module['_OctreeBlock'] = createExportWrapper('OctreeBlock', 9);
var __ZN6OcTree11OctreeBlockEP4Meshifffffi = Module['__ZN6OcTree11OctreeBlockEP4Meshifffffi'] = createExportWrapper('_ZN6OcTree11OctreeBlockEP4Meshifffffi', 9);
var _OctreeMesh = Module['_OctreeMesh'] = createExportWrapper('OctreeMesh', 8);
var __ZN6OcTree10OctreeMeshEP4Meshifffff = Module['__ZN6OcTree10OctreeMeshEP4Meshifffff'] = createExportWrapper('_ZN6OcTree10OctreeMeshEP4Meshifffff', 8);
var _CreateFluid = Module['_CreateFluid'] = createExportWrapper('CreateFluid', 0);
var __ZN5Fluid11CreateFluidEv = Module['__ZN5Fluid11CreateFluidEv'] = createExportWrapper('_ZN5Fluid11CreateFluidEv', 0);
var _CreateParticleEmitter = Module['_CreateParticleEmitter'] = createExportWrapper('CreateParticleEmitter', 2);
var __ZN15ParticleEmitter21CreateParticleEmitterEP6EntityS1_ = Module['__ZN15ParticleEmitter21CreateParticleEmitterEP6EntityS1_'] = createExportWrapper('_ZN15ParticleEmitter21CreateParticleEmitterEP6EntityS1_', 2);
var _ActStop = Module['_ActStop'] = createExportWrapper('ActStop', 1);
var __ZN6Action9AddActionEP6EntityiS1_ffff = Module['__ZN6Action9AddActionEP6EntityiS1_ffff'] = createExportWrapper('_ZN6Action9AddActionEP6EntityiS1_ffff', 7);
var _ActWait = Module['_ActWait'] = createExportWrapper('ActWait', 1);
var _ActMoveBy = Module['_ActMoveBy'] = createExportWrapper('ActMoveBy', 5);
var _ActTurnBy = Module['_ActTurnBy'] = createExportWrapper('ActTurnBy', 5);
var _ActVector = Module['_ActVector'] = createExportWrapper('ActVector', 4);
var _ActMoveTo = Module['_ActMoveTo'] = createExportWrapper('ActMoveTo', 5);
var _ActTurnTo = Module['_ActTurnTo'] = createExportWrapper('ActTurnTo', 5);
var _ActScaleTo = Module['_ActScaleTo'] = createExportWrapper('ActScaleTo', 5);
var _ActFadeTo = Module['_ActFadeTo'] = createExportWrapper('ActFadeTo', 3);
var _ActTintTo = Module['_ActTintTo'] = createExportWrapper('ActTintTo', 5);
var _ActTrackByPoint = Module['_ActTrackByPoint'] = createExportWrapper('ActTrackByPoint', 6);
var _ActTrackByDistance = Module['_ActTrackByDistance'] = createExportWrapper('ActTrackByDistance', 4);
var _ActNewtonian = Module['_ActNewtonian'] = createExportWrapper('ActNewtonian', 2);
var _ActExecute = Module['_ActExecute'] = createExportWrapper('ActExecute', 1);
var _TriggerCloseTo = Module['_TriggerCloseTo'] = createExportWrapper('TriggerCloseTo', 5);
var _TriggerDistance = Module['_TriggerDistance'] = createExportWrapper('TriggerDistance', 3);
var _TriggerCollision = Module['_TriggerCollision'] = createExportWrapper('TriggerCollision', 2);
var _ActIterator = Module['_ActIterator'] = createExportWrapper('ActIterator', 0);
var _AppendAction = Module['_AppendAction'] = createExportWrapper('AppendAction', 2);
var __ZN6Action12AppendActionEPS_ = Module['__ZN6Action12AppendActionEPS_'] = createExportWrapper('_ZN6Action12AppendActionEPS_', 2);
var _FreeAction = Module['_FreeAction'] = createExportWrapper('FreeAction', 2);
var __ZN6Action10FreeActionEi = Module['__ZN6Action10FreeActionEi'] = createExportWrapper('_ZN6Action10FreeActionEi', 2);
var _DepthBufferToTex = Module['_DepthBufferToTex'] = createExportWrapper('DepthBufferToTex', 2);
var __ZN7Texture16DepthBufferToTexEP6Camera = Module['__ZN7Texture16DepthBufferToTexEP6Camera'] = createExportWrapper('_ZN7Texture16DepthBufferToTexEP6Camera', 2);
var _CreatePostFX = Module['_CreatePostFX'] = createExportWrapper('CreatePostFX', 2);
var __ZN6PostFX12CreatePostFXEP6Camerai = Module['__ZN6PostFX12CreatePostFXEP6Camerai'] = createExportWrapper('_ZN6PostFX12CreatePostFXEP6Camerai', 2);
var _AddRenderTarget = Module['_AddRenderTarget'] = createExportWrapper('AddRenderTarget', 6);
var __ZN6PostFX15AddRenderTargetEiibif = Module['__ZN6PostFX15AddRenderTargetEiibif'] = createExportWrapper('_ZN6PostFX15AddRenderTargetEiibif', 6);
var _PostFXShader = Module['_PostFXShader'] = createExportWrapper('PostFXShader', 3);
var __ZN6PostFX12PostFXShaderEiP6Shader = Module['__ZN6PostFX12PostFXShaderEiP6Shader'] = createExportWrapper('_ZN6PostFX12PostFXShaderEiP6Shader', 3);
var _PostFXShaderPass = Module['_PostFXShaderPass'] = createExportWrapper('PostFXShaderPass', 4);
var __ZN6PostFX16PostFXShaderPassEiNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi = Module['__ZN6PostFX16PostFXShaderPassEiNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi'] = createExportWrapper('_ZN6PostFX16PostFXShaderPassEiNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEi', 4);
var _PostFXBuffer = Module['_PostFXBuffer'] = createExportWrapper('PostFXBuffer', 5);
var __ZN6PostFX12PostFXBufferEiiii = Module['__ZN6PostFX12PostFXBufferEiiii'] = createExportWrapper('_ZN6PostFX12PostFXBufferEiiii', 5);
var _PostFXTexture = Module['_PostFXTexture'] = createExportWrapper('PostFXTexture', 5);
var __ZN6PostFX13PostFXTextureEiP7Textureii = Module['__ZN6PostFX13PostFXTextureEiP7Textureii'] = createExportWrapper('_ZN6PostFX13PostFXTextureEiP7Textureii', 5);
var _PostFXFunction = Module['_PostFXFunction'] = createExportWrapper('PostFXFunction', 3);
var __ZN6PostFX14PostFXFunctionEiPFvvE = Module['__ZN6PostFX14PostFXFunctionEiPFvvE'] = createExportWrapper('_ZN6PostFX14PostFXFunctionEiPFvvE', 3);
var _CameraProjMatrix = Module['_CameraProjMatrix'] = createExportWrapper('CameraProjMatrix', 1);
var __ZN6Camera16CameraProjMatrixEv = Module['__ZN6Camera16CameraProjMatrixEv'] = createExportWrapper('_ZN6Camera16CameraProjMatrixEv', 1);
var _EntityMatrix = Module['_EntityMatrix'] = createExportWrapper('EntityMatrix', 1);
var __Z12rotationQuatfff = Module['__Z12rotationQuatfff'] = createExportWrapper('_Z12rotationQuatfff', 4);
var __ZN6Action6UpdateEv = Module['__ZN6Action6UpdateEv'] = createExportWrapper('_ZN6Action6UpdateEv', 0);
var __ZN6Global16UpdateEntityAnimER4Mesh = Module['__ZN6Global16UpdateEntityAnimER4Mesh'] = createExportWrapper('_ZN6Global16UpdateEntityAnimER4Mesh', 1);
var __ZN10Constraint6UpdateEv = Module['__ZN10Constraint6UpdateEv'] = createExportWrapper('_ZN10Constraint6UpdateEv', 0);
var __ZN9RigidBody6UpdateEv = Module['__ZN9RigidBody6UpdateEv'] = createExportWrapper('_ZN9RigidBody6UpdateEv', 0);
var __Z16UpdateCollisionsv = Module['__Z16UpdateCollisionsv'] = createExportWrapper('_Z16UpdateCollisionsv', 0);
var __ZN9Animation12AnimateMesh2EP4Meshfii = Module['__ZN9Animation12AnimateMesh2EP4Meshfii'] = createExportWrapper('_ZN9Animation12AnimateMesh2EP4Meshfii', 4);
var __Z18CompareEntityOrderP6EntityS0_ = Module['__Z18CompareEntityOrderP6EntityS0_'] = createExportWrapper('_Z18CompareEntityOrderP6EntityS0_', 2);
var __ZNSt3__24listIP6CameraNS_9allocatorIS2_EEE6__sortIPFbP6EntityS8_EEENS_15__list_iteratorIS2_PvEESD_SD_mRT_ = Module['__ZNSt3__24listIP6CameraNS_9allocatorIS2_EEE6__sortIPFbP6EntityS8_EEENS_15__list_iteratorIS2_PvEESD_SD_mRT_'] = createExportWrapper('_ZNSt3__24listIP6CameraNS_9allocatorIS2_EEE6__sortIPFbP6EntityS8_EEENS_15__list_iteratorIS2_PvEESD_SD_mRT_', 4);
var __ZN12ShadowObject6UpdateEP6Camera = Module['__ZN12ShadowObject6UpdateEP6Camera'] = createExportWrapper('_ZN12ShadowObject6UpdateEP6Camera', 1);
var __ZN6PostFX6RenderEv = Module['__ZN6PostFX6RenderEv'] = createExportWrapper('_ZN6PostFX6RenderEv', 1);
var __ZN5Light10CopyEntityEP6Entity = Module['__ZN5Light10CopyEntityEP6Entity'] = createExportWrapper('_ZN5Light10CopyEntityEP6Entity', 2);
var __ZN5Light10FreeEntityEv = Module['__ZN5Light10FreeEntityEv'] = createExportWrapper('_ZN5Light10FreeEntityEv', 1);
var __ZN5Light6UpdateEv = Module['__ZN5Light6UpdateEv'] = createExportWrapper('_ZN5Light6UpdateEv', 1);
var __ZN5LightD0Ev = Module['__ZN5LightD0Ev'] = createExportWrapper('_ZN5LightD0Ev', 1);
var __Z9Magnitudefff = Module['__Z9Magnitudefff'] = createExportWrapper('_Z9Magnitudefff', 3);
var __Z23Quaternion_MultiplyQuatffffffffRfS_S_S_ = Module['__Z23Quaternion_MultiplyQuatffffffffRfS_S_S_'] = createExportWrapper('_Z23Quaternion_MultiplyQuatffffffffRfS_S_S_', 12);
var __Z7acosdegd = Module['__Z7acosdegd'] = createExportWrapper('_Z7acosdegd', 1);
var __Z12gluUnProjectfffPKfS0_PKiPfS3_S3_ = Module['__Z12gluUnProjectfffPKfS0_PKiPfS3_S3_'] = createExportWrapper('_Z12gluUnProjectfffPKfS0_PKiPfS3_S3_', 9);
var __ZN4Pick8PickMainEfffffff = Module['__ZN4Pick8PickMainEfffffff'] = createExportWrapper('_ZN4Pick8PickMainEfffffff', 7);
var __ZN4Mesh9TreeCheckEv = Module['__ZN4Mesh9TreeCheckEv'] = createExportWrapper('_ZN4Mesh9TreeCheckEv', 1);
var __ZN5Pivot10CopyEntityEP6Entity = Module['__ZN5Pivot10CopyEntityEP6Entity'] = createExportWrapper('_ZN5Pivot10CopyEntityEP6Entity', 2);
var __ZN5Pivot10FreeEntityEv = Module['__ZN5Pivot10FreeEntityEv'] = createExportWrapper('_ZN5Pivot10FreeEntityEv', 1);
var __ZN5Pivot6UpdateEv = Module['__ZN5Pivot6UpdateEv'] = createExportWrapper('_ZN5Pivot6UpdateEv', 1);
var __ZN5PivotD0Ev = Module['__ZN5PivotD0Ev'] = createExportWrapper('_ZN5PivotD0Ev', 1);
var __Z10gluProjectfffPKfS0_PKiPfS3_S3_ = Module['__Z10gluProjectfffPKfS0_PKiPfS3_S3_'] = createExportWrapper('_Z10gluProjectfffPKfS0_PKiPfS3_S3_', 9);
var __ZN6Sprite10CopyEntityEP6Entity = Module['__ZN6Sprite10CopyEntityEP6Entity'] = createExportWrapper('_ZN6Sprite10CopyEntityEP6Entity', 2);
var __ZNSt3__24listIP7SurfaceNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_ = Module['__ZNSt3__24listIP7SurfaceNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_'] = createExportWrapper('_ZNSt3__24listIP7SurfaceNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_', 3);
var __ZN6Sprite10FreeEntityEv = Module['__ZN6Sprite10FreeEntityEv'] = createExportWrapper('_ZN6Sprite10FreeEntityEv', 1);
var __ZN6Sprite15SpriteTexCoordsEiiiiiii = Module['__ZN6Sprite15SpriteTexCoordsEiiiiiii'] = createExportWrapper('_ZN6Sprite15SpriteTexCoordsEiiiiiii', 8);
var __ZN6Sprite17SpriteVertexColorEifff = Module['__ZN6Sprite17SpriteVertexColorEifff'] = createExportWrapper('_ZN6Sprite17SpriteVertexColorEifff', 5);
var __ZN4MeshD2Ev = Module['__ZN4MeshD2Ev'] = createExportWrapper('_ZN4MeshD2Ev', 1);
var __ZN6SpriteD0Ev = Module['__ZN6SpriteD0Ev'] = createExportWrapper('_ZN6SpriteD0Ev', 1);
var __ZN4Mesh6UpdateEv = Module['__ZN4Mesh6UpdateEv'] = createExportWrapper('_ZN4Mesh6UpdateEv', 1);
var __ZN4Mesh6RenderEv = Module['__ZN4Mesh6RenderEv'] = createExportWrapper('_ZN4Mesh6RenderEv', 1);
var __ZN12MeshColliderC2ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE = Module['__ZN12MeshColliderC2ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE'] = createExportWrapper('_ZN12MeshColliderC2ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE', 3);
var __ZN12MeshCollider10createNodeERKNSt3__26vectorIiNS0_9allocatorIiEEEE = Module['__ZN12MeshCollider10createNodeERKNSt3__26vectorIiNS0_9allocatorIiEEEE'] = createExportWrapper('_ZN12MeshCollider10createNodeERKNSt3__26vectorIiNS0_9allocatorIiEEEE', 2);
var __ZN12MeshCollider10createLeafERKNSt3__26vectorIiNS0_9allocatorIiEEEE = Module['__ZN12MeshCollider10createLeafERKNSt3__26vectorIiNS0_9allocatorIiEEEE'] = createExportWrapper('_ZN12MeshCollider10createLeafERKNSt3__26vectorIiNS0_9allocatorIiEEEE', 2);
var __ZN12MeshCollider7nodeBoxERKNSt3__26vectorIiNS0_9allocatorIiEEEE = Module['__ZN12MeshCollider7nodeBoxERKNSt3__26vectorIiNS0_9allocatorIiEEEE'] = createExportWrapper('_ZN12MeshCollider7nodeBoxERKNSt3__26vectorIiNS0_9allocatorIiEEEE', 3);
var __ZN12MeshColliderD2Ev = Module['__ZN12MeshColliderD2Ev'] = createExportWrapper('_ZN12MeshColliderD2Ev', 1);
var __ZN12MeshCollider4NodeD2Ev = Module['__ZN12MeshCollider4NodeD2Ev'] = createExportWrapper('_ZN12MeshCollider4NodeD2Ev', 1);
var __ZNK9TransformngEv = Module['__ZNK9TransformngEv'] = createExportWrapper('_ZNK9TransformngEv', 1);
var __ZNK9TransformmlERK3Box = Module['__ZNK9TransformmlERK3Box'] = createExportWrapper('_ZNK9TransformmlERK3Box', 3);
var __ZN12MeshCollider7collideERK3BoxRK4LinefRK9TransformP9CollisionPNS_4NodeE = Module['__ZN12MeshCollider7collideERK3BoxRK4LinefRK9TransformP9CollisionPNS_4NodeE'] = createExportWrapper('_ZN12MeshCollider7collideERK3BoxRK4LinefRK9TransformP9CollisionPNS_4NodeE', 7);
var __ZNK12MeshCollider10intersectsERKS_RK9Transform = Module['__ZNK12MeshCollider10intersectsERKS_RK9Transform'] = createExportWrapper('_ZNK12MeshCollider10intersectsERKS_RK9Transform', 3);
var __Z13C_NewMeshInfov = Module['__Z13C_NewMeshInfov'] = createExportWrapper('_Z13C_NewMeshInfov', 0);
var __Z16C_DeleteMeshInfoP8MeshInfo = Module['__Z16C_DeleteMeshInfoP8MeshInfo'] = createExportWrapper('_Z16C_DeleteMeshInfoP8MeshInfo', 1);
var __Z13C_AddTriangleP8MeshInfoisssi = Module['__Z13C_AddTriangleP8MeshInfoisssi'] = createExportWrapper('_Z13C_AddTriangleP8MeshInfoisssi', 6);
var __Z11C_AddVertexP8MeshInfofffi = Module['__Z11C_AddVertexP8MeshInfofffi'] = createExportWrapper('_Z11C_AddVertexP8MeshInfofffi', 5);
var __Z12C_AddSurfaceP8MeshInfoiiPsPfi = Module['__Z12C_AddSurfaceP8MeshInfoiiPsPfi'] = createExportWrapper('_Z12C_AddSurfaceP8MeshInfoiiPsPfi', 6);
var __Z15C_CreateColTreeP8MeshInfo = Module['__Z15C_CreateColTreeP8MeshInfo'] = createExportWrapper('_Z15C_CreateColTreeP8MeshInfo', 1);
var __ZN12MeshColliderC1ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE = Module['__ZN12MeshColliderC1ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE'] = createExportWrapper('_ZN12MeshColliderC1ERKNSt3__26vectorINS_6VertexENS0_9allocatorIS2_EEEERKNS1_INS_8TriangleENS3_IS8_EEEE', 3);
var __Z15C_DeleteColTreeP12MeshCollider = Module['__Z15C_DeleteColTreeP12MeshCollider'] = createExportWrapper('_Z15C_DeleteColTreeP12MeshCollider', 1);
var __ZN12MeshColliderD1Ev = Module['__ZN12MeshColliderD1Ev'] = createExportWrapper('_ZN12MeshColliderD1Ev', 1);
var __Z5SlerpffffffffRfS_S_S_f = Module['__Z5SlerpffffffffRfS_S_S_f'] = createExportWrapper('_Z5SlerpffffffffRfS_S_S_f', 13);
var __ZN9Animation12VertexDeformEP4Mesh = Module['__ZN9Animation12VertexDeformEP4Mesh'] = createExportWrapper('_ZN9Animation12VertexDeformEP4Mesh', 1);
var __Z22UpdateStaticCollisionsv = Module['__Z22UpdateStaticCollisionsv'] = createExportWrapper('_Z22UpdateStaticCollisionsv', 0);
var __Z23UpdateDynamicCollisionsv = Module['__Z23UpdateDynamicCollisionsv'] = createExportWrapper('_Z23UpdateDynamicCollisionsv', 0);
var __Z16PositionEntitiesii = Module['__Z16PositionEntitiesii'] = createExportWrapper('_Z16PositionEntitiesii', 2);
var __Z15clearCollisionsv = Module['__Z15clearCollisionsv'] = createExportWrapper('_Z15clearCollisionsv', 0);
var __Z10QuickCheckR6EntityS0_ = Module['__Z10QuickCheckR6EntityS0_'] = createExportWrapper('_Z10QuickCheckR6EntityS0_', 2);
var __Z6tandegd = Module['__Z6tandegd'] = createExportWrapper('_Z6tandegd', 1);
var __Z7asindegd = Module['__Z7asindegd'] = createExportWrapper('_Z7asindegd', 1);
var __Z7atandegd = Module['__Z7atandegd'] = createExportWrapper('_Z7atandegd', 1);
var __ZN6Camera10CopyEntityEP6Entity = Module['__ZN6Camera10CopyEntityEP6Entity'] = createExportWrapper('_ZN6Camera10CopyEntityEP6Entity', 2);
var __ZN6Camera16UpdateProjMatrixEv = Module['__ZN6Camera16UpdateProjMatrixEv'] = createExportWrapper('_ZN6Camera16UpdateProjMatrixEv', 1);
var __ZN6Camera10FreeEntityEv = Module['__ZN6Camera10FreeEntityEv'] = createExportWrapper('_ZN6Camera10FreeEntityEv', 1);
var __ZN6Camera10ProjectedXEv = Module['__ZN6Camera10ProjectedXEv'] = createExportWrapper('_ZN6Camera10ProjectedXEv', 0);
var __ZN6Camera10ProjectedYEv = Module['__ZN6Camera10ProjectedYEv'] = createExportWrapper('_ZN6Camera10ProjectedYEv', 0);
var __ZN6Camera10ProjectedZEv = Module['__ZN6Camera10ProjectedZEv'] = createExportWrapper('_ZN6Camera10ProjectedZEv', 0);
var __ZN4Mesh9GetBoundsEv = Module['__ZN4Mesh9GetBoundsEv'] = createExportWrapper('_ZN4Mesh9GetBoundsEv', 1);
var __ZN6Camera15EntityInFrustumEP6Entity = Module['__ZN6Camera15EntityInFrustumEP6Entity'] = createExportWrapper('_ZN6Camera15EntityInFrustumEP6Entity', 2);
var __ZN6Camera14ExtractFrustumEv = Module['__ZN6Camera14ExtractFrustumEv'] = createExportWrapper('_ZN6Camera14ExtractFrustumEv', 1);
var __ZN6Camera6UpdateEv = Module['__ZN6Camera6UpdateEv'] = createExportWrapper('_ZN6Camera6UpdateEv', 1);
var __ZN6Camera14accPerspectiveEfffffffff = Module['__ZN6Camera14accPerspectiveEfffffffff'] = createExportWrapper('_ZN6Camera14accPerspectiveEfffffffff', 10);
var __ZN6Camera6RenderEv = Module['__ZN6Camera6RenderEv'] = createExportWrapper('_ZN6Camera6RenderEv', 1);
var __Z18UpdateEntityRenderP6EntityS0_ = Module['__Z18UpdateEntityRenderP6EntityS0_'] = createExportWrapper('_Z18UpdateEntityRenderP6EntityS0_', 2);
var __ZN4Mesh5AlphaEv = Module['__ZN4Mesh5AlphaEv'] = createExportWrapper('_ZN4Mesh5AlphaEv', 1);
var __ZN6Camera13RenderListAddEP4Mesh = Module['__ZN6Camera13RenderListAddEP4Mesh'] = createExportWrapper('_ZN6Camera13RenderListAddEP4Mesh', 2);
var __ZN11SpriteBatch5ClearEv = Module['__ZN11SpriteBatch5ClearEv'] = createExportWrapper('_ZN11SpriteBatch5ClearEv', 0);
var __ZN6Camera12UpdateSpriteER6Sprite = Module['__ZN6Camera12UpdateSpriteER6Sprite'] = createExportWrapper('_ZN6Camera12UpdateSpriteER6Sprite', 2);
var __ZN11SpriteBatch21GetSpriteBatchSurfaceEP7Textureii = Module['__ZN11SpriteBatch21GetSpriteBatchSurfaceEP7Textureii'] = createExportWrapper('_ZN11SpriteBatch21GetSpriteBatchSurfaceEP7Textureii', 3);
var __ZN6Camera29AddTransformedSpriteToSurfaceER6SpriteP7Surface = Module['__ZN6Camera29AddTransformedSpriteToSurfaceER6SpriteP7Surface'] = createExportWrapper('_ZN6Camera29AddTransformedSpriteToSurfaceER6SpriteP7Surface', 3);
var __ZN6Camera10accFrustumEfffffffffff = Module['__ZN6Camera10accFrustumEfffffffffff'] = createExportWrapper('_ZN6Camera10accFrustumEfffffffffff', 12);
var __ZN6CameraD0Ev = Module['__ZN6CameraD0Ev'] = createExportWrapper('_ZN6CameraD0Ev', 1);
var __ZN4File16ResourceFilePathENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN4File16ResourceFilePathENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN4File16ResourceFilePathENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN4File8ReadFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN4File8ReadFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN4File8ReadFileENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 1);
var __ZN4File9ReadShortEv = Module['__ZN4File9ReadShortEv'] = createExportWrapper('_ZN4File9ReadShortEv', 1);
var __ZN4File8ReadLongEv = Module['__ZN4File8ReadLongEv'] = createExportWrapper('_ZN4File8ReadLongEv', 1);
var __ZN4File10ReadStringEv = Module['__ZN4File10ReadStringEv'] = createExportWrapper('_ZN4File10ReadStringEv', 2);
var __ZN4File8ReadLineEv = Module['__ZN4File8ReadLineEv'] = createExportWrapper('_ZN4File8ReadLineEv', 2);
var __ZN4Mesh10CopyEntityEP6Entity = Module['__ZN4Mesh10CopyEntityEP6Entity'] = createExportWrapper('_ZN4Mesh10CopyEntityEP6Entity', 2);
var __ZN4Mesh13CopyBonesListEP6EntityRNSt3__26vectorIP4BoneNS2_9allocatorIS5_EEEE = Module['__ZN4Mesh13CopyBonesListEP6EntityRNSt3__26vectorIP4BoneNS2_9allocatorIS5_EEEE'] = createExportWrapper('_ZN4Mesh13CopyBonesListEP6EntityRNSt3__26vectorIP4BoneNS2_9allocatorIS5_EEEE', 2);
var __ZN4Mesh10FreeEntityEv = Module['__ZN4Mesh10FreeEntityEv'] = createExportWrapper('_ZN4Mesh10FreeEntityEv', 1);
var __ZN7load3ds7Load3dsENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN7load3ds7Load3dsENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN7load3ds7Load3dsENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var __ZN4Mesh13TransformMeshER6Matrix = Module['__ZN4Mesh13TransformMeshER6Matrix'] = createExportWrapper('_ZN4Mesh13TransformMeshER6Matrix', 2);
var __ZN4Mesh16CollapseChildrenEP6EntityPS_ = Module['__ZN4Mesh16CollapseChildrenEP6EntityPS_'] = createExportWrapper('_ZN4Mesh16CollapseChildrenEP6EntityPS_', 3);
var __ZN8loadGLtf8LoadGLtfENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN8loadGLtf8LoadGLtfENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN8loadGLtf8LoadGLtfENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var __ZN7loadMD27LoadMD2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN7loadMD27LoadMD2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN7loadMD27LoadMD2ENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var __ZN7LoadOBJ7LoadOBJENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity = Module['__ZN7LoadOBJ7LoadOBJENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity'] = createExportWrapper('_ZN7LoadOBJ7LoadOBJENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEP6Entity', 2);
var __ZN4Mesh16CollapseAnimMeshEv = Module['__ZN4Mesh16CollapseAnimMeshEv'] = createExportWrapper('_ZN4Mesh16CollapseAnimMeshEv', 1);
var __ZN4Mesh9MeshColorEffff = Module['__ZN4Mesh9MeshColorEffff'] = createExportWrapper('_ZN4Mesh9MeshColorEffff', 5);
var __ZN4Mesh9MeshColorEfff = Module['__ZN4Mesh9MeshColorEfff'] = createExportWrapper('_ZN4Mesh9MeshColorEfff', 4);
var __ZN4Mesh7MeshRedEf = Module['__ZN4Mesh7MeshRedEf'] = createExportWrapper('_ZN4Mesh7MeshRedEf', 2);
var __ZN4Mesh9MeshGreenEf = Module['__ZN4Mesh9MeshGreenEf'] = createExportWrapper('_ZN4Mesh9MeshGreenEf', 2);
var __ZN4Mesh8MeshBlueEf = Module['__ZN4Mesh8MeshBlueEf'] = createExportWrapper('_ZN4Mesh8MeshBlueEf', 2);
var __ZN4Mesh9MeshAlphaEf = Module['__ZN4Mesh9MeshAlphaEf'] = createExportWrapper('_ZN4Mesh9MeshAlphaEf', 2);
var _tri_tri_intersect = Module['_tri_tri_intersect'] = createExportWrapper('tri_tri_intersect', 6);
var __ZN4Mesh7MeshCSGEPS_i = Module['__ZN4Mesh7MeshCSGEPS_i'] = createExportWrapper('_ZN4Mesh7MeshCSGEPS_i', 3);
var __ZN6Shader6TurnOnER6MatrixP5Brush = Module['__ZN6Shader6TurnOnER6MatrixP5Brush'] = createExportWrapper('_ZN6Shader6TurnOnER6MatrixP5Brush', 3);
var __ZN6Shader7TurnOffEv = Module['__ZN6Shader7TurnOffEv'] = createExportWrapper('_ZN6Shader7TurnOffEv', 1);
var __ZN4Mesh12UpdateShadowEv = Module['__ZN4Mesh12UpdateShadowEv'] = createExportWrapper('_ZN4Mesh12UpdateShadowEv', 1);
var __ZN4MeshD0Ev = Module['__ZN4MeshD0Ev'] = createExportWrapper('_ZN4MeshD0Ev', 1);
var __ZN7Texture11FilterFlagsEv = Module['__ZN7Texture11FilterFlagsEv'] = createExportWrapper('_ZN7Texture11FilterFlagsEv', 1);
var _stbi_load = Module['_stbi_load'] = createExportWrapper('stbi_load', 5);
var _stbi_image_free = Module['_stbi_image_free'] = createExportWrapper('stbi_image_free', 1);
var __ZN7Texture9TexInListEv = Module['__ZN7Texture9TexInListEv'] = createExportWrapper('_ZN7Texture9TexInListEv', 1);
var __Z10CopyPixelsPhjjjjS_jjj = Module['__Z10CopyPixelsPhjjjjS_jjj'] = createExportWrapper('_Z10CopyPixelsPhjjjjS_jjj', 9);
var __ZN7Texture11DrawTextureEii = Module['__ZN7Texture11DrawTextureEii'] = createExportWrapper('_ZN7Texture11DrawTextureEii', 3);
var __ZN7Texture11TextureNameEv = Module['__ZN7Texture11TextureNameEv'] = createExportWrapper('_ZN7Texture11TextureNameEv', 2);
var __ZN7Terrain10CopyEntityEP6Entity = Module['__ZN7Terrain10CopyEntityEP6Entity'] = createExportWrapper('_ZN7Terrain10CopyEntityEP6Entity', 2);
var __ZN7Terrain13UpdateTerrainEv = Module['__ZN7Terrain13UpdateTerrainEv'] = createExportWrapper('_ZN7Terrain13UpdateTerrainEv', 1);
var __ZN7Terrain12RecreateROAMEv = Module['__ZN7Terrain12RecreateROAMEv'] = createExportWrapper('_ZN7Terrain12RecreateROAMEv', 1);
var __ZN7Terrain7drawsubEiPfS0_S0_ = Module['__ZN7Terrain7drawsubEiPfS0_S0_'] = createExportWrapper('_ZN7Terrain7drawsubEiPfS0_S0_', 5);
var __ZN7Terrain9TreeCheckEP13CollisionInfo = Module['__ZN7Terrain9TreeCheckEP13CollisionInfo'] = createExportWrapper('_ZN7Terrain9TreeCheckEP13CollisionInfo', 2);
var __ZN7Terrain12col_tree_subEiPfS0_S0_ = Module['__ZN7Terrain12col_tree_subEiPfS0_S0_'] = createExportWrapper('_ZN7Terrain12col_tree_subEiPfS0_S0_', 5);
var __ZN7Terrain10FreeEntityEv = Module['__ZN7Terrain10FreeEntityEv'] = createExportWrapper('_ZN7Terrain10FreeEntityEv', 1);
var __ZN7TerrainD0Ev = Module['__ZN7TerrainD0Ev'] = createExportWrapper('_ZN7TerrainD0Ev', 1);
var _stbi_failure_reason = Module['_stbi_failure_reason'] = createExportWrapper('stbi_failure_reason', 0);
var _free = createExportWrapper('free', 1);
var _stbi_set_flip_vertically_on_load = Module['_stbi_set_flip_vertically_on_load'] = createExportWrapper('stbi_set_flip_vertically_on_load', 1);
var _stbi_set_flip_vertically_on_load_thread = Module['_stbi_set_flip_vertically_on_load_thread'] = createExportWrapper('stbi_set_flip_vertically_on_load_thread', 1);
var _stbi_load_from_file = Module['_stbi_load_from_file'] = createExportWrapper('stbi_load_from_file', 5);
var _malloc = createExportWrapper('malloc', 1);
var _stbi_load_from_file_16 = Module['_stbi_load_from_file_16'] = createExportWrapper('stbi_load_from_file_16', 5);
var _stbi_load_16 = Module['_stbi_load_16'] = createExportWrapper('stbi_load_16', 5);
var _stbi_load_16_from_memory = Module['_stbi_load_16_from_memory'] = createExportWrapper('stbi_load_16_from_memory', 6);
var _stbi_load_16_from_callbacks = Module['_stbi_load_16_from_callbacks'] = createExportWrapper('stbi_load_16_from_callbacks', 6);
var _stbi_load_from_memory = Module['_stbi_load_from_memory'] = createExportWrapper('stbi_load_from_memory', 6);
var _stbi_load_from_callbacks = Module['_stbi_load_from_callbacks'] = createExportWrapper('stbi_load_from_callbacks', 6);
var _stbi_load_gif_from_memory = Module['_stbi_load_gif_from_memory'] = createExportWrapper('stbi_load_gif_from_memory', 8);
var _realloc = createExportWrapper('realloc', 2);
var _stbi_loadf_from_memory = Module['_stbi_loadf_from_memory'] = createExportWrapper('stbi_loadf_from_memory', 6);
var _stbi_loadf_from_callbacks = Module['_stbi_loadf_from_callbacks'] = createExportWrapper('stbi_loadf_from_callbacks', 6);
var _stbi_loadf = Module['_stbi_loadf'] = createExportWrapper('stbi_loadf', 5);
var _stbi_loadf_from_file = Module['_stbi_loadf_from_file'] = createExportWrapper('stbi_loadf_from_file', 5);
var _stbi_is_hdr_from_memory = Module['_stbi_is_hdr_from_memory'] = createExportWrapper('stbi_is_hdr_from_memory', 2);
var _stbi_is_hdr = Module['_stbi_is_hdr'] = createExportWrapper('stbi_is_hdr', 1);
var _stbi_is_hdr_from_file = Module['_stbi_is_hdr_from_file'] = createExportWrapper('stbi_is_hdr_from_file', 1);
var _stbi_is_hdr_from_callbacks = Module['_stbi_is_hdr_from_callbacks'] = createExportWrapper('stbi_is_hdr_from_callbacks', 2);
var _stbi_ldr_to_hdr_gamma = Module['_stbi_ldr_to_hdr_gamma'] = createExportWrapper('stbi_ldr_to_hdr_gamma', 1);
var _stbi_ldr_to_hdr_scale = Module['_stbi_ldr_to_hdr_scale'] = createExportWrapper('stbi_ldr_to_hdr_scale', 1);
var _stbi_hdr_to_ldr_gamma = Module['_stbi_hdr_to_ldr_gamma'] = createExportWrapper('stbi_hdr_to_ldr_gamma', 1);
var _stbi_hdr_to_ldr_scale = Module['_stbi_hdr_to_ldr_scale'] = createExportWrapper('stbi_hdr_to_ldr_scale', 1);
var _stbi_zlib_decode_malloc_guesssize = Module['_stbi_zlib_decode_malloc_guesssize'] = createExportWrapper('stbi_zlib_decode_malloc_guesssize', 4);
var _stbi_zlib_decode_malloc = Module['_stbi_zlib_decode_malloc'] = createExportWrapper('stbi_zlib_decode_malloc', 3);
var _stbi_zlib_decode_malloc_guesssize_headerflag = Module['_stbi_zlib_decode_malloc_guesssize_headerflag'] = createExportWrapper('stbi_zlib_decode_malloc_guesssize_headerflag', 5);
var _stbi_zlib_decode_buffer = Module['_stbi_zlib_decode_buffer'] = createExportWrapper('stbi_zlib_decode_buffer', 4);
var _stbi_zlib_decode_noheader_malloc = Module['_stbi_zlib_decode_noheader_malloc'] = createExportWrapper('stbi_zlib_decode_noheader_malloc', 3);
var _stbi_zlib_decode_noheader_buffer = Module['_stbi_zlib_decode_noheader_buffer'] = createExportWrapper('stbi_zlib_decode_noheader_buffer', 4);
var _stbi_set_unpremultiply_on_load = Module['_stbi_set_unpremultiply_on_load'] = createExportWrapper('stbi_set_unpremultiply_on_load', 1);
var _stbi_convert_iphone_png_to_rgb = Module['_stbi_convert_iphone_png_to_rgb'] = createExportWrapper('stbi_convert_iphone_png_to_rgb', 1);
var _stbi_set_unpremultiply_on_load_thread = Module['_stbi_set_unpremultiply_on_load_thread'] = createExportWrapper('stbi_set_unpremultiply_on_load_thread', 1);
var _stbi_convert_iphone_png_to_rgb_thread = Module['_stbi_convert_iphone_png_to_rgb_thread'] = createExportWrapper('stbi_convert_iphone_png_to_rgb_thread', 1);
var _stbi_info = Module['_stbi_info'] = createExportWrapper('stbi_info', 4);
var _stbi_info_from_file = Module['_stbi_info_from_file'] = createExportWrapper('stbi_info_from_file', 4);
var _calloc = createExportWrapper('calloc', 2);
var _stbi_is_16_bit = Module['_stbi_is_16_bit'] = createExportWrapper('stbi_is_16_bit', 1);
var _stbi_is_16_bit_from_file = Module['_stbi_is_16_bit_from_file'] = createExportWrapper('stbi_is_16_bit_from_file', 1);
var _stbi_info_from_memory = Module['_stbi_info_from_memory'] = createExportWrapper('stbi_info_from_memory', 5);
var _stbi_info_from_callbacks = Module['_stbi_info_from_callbacks'] = createExportWrapper('stbi_info_from_callbacks', 5);
var _stbi_is_16_bit_from_memory = Module['_stbi_is_16_bit_from_memory'] = createExportWrapper('stbi_is_16_bit_from_memory', 2);
var _stbi_is_16_bit_from_callbacks = Module['_stbi_is_16_bit_from_callbacks'] = createExportWrapper('stbi_is_16_bit_from_callbacks', 2);
var __ZN7load3ds9ReadChunkEv = Module['__ZN7load3ds9ReadChunkEv'] = createExportWrapper('_ZN7load3ds9ReadChunkEv', 0);
var __ZN7load3ds9SkipChunkEv = Module['__ZN7load3ds9SkipChunkEv'] = createExportWrapper('_ZN7load3ds9SkipChunkEv', 0);
var __ZN7load3ds11ReadCStringEv = Module['__ZN7load3ds11ReadCStringEv'] = createExportWrapper('_ZN7load3ds11ReadCStringEv', 1);
var __ZN7load3ds7ReadRGBEiRhS0_S0_ = Module['__ZN7load3ds7ReadRGBEiRhS0_S0_'] = createExportWrapper('_ZN7load3ds7ReadRGBEiRhS0_S0_', 4);
var __ZN7load3ds11ReadPercentEi = Module['__ZN7load3ds11ReadPercentEi'] = createExportWrapper('_ZN7load3ds11ReadPercentEi', 1);
var __ZN7load3ds14ReadVertexListEv = Module['__ZN7load3ds14ReadVertexListEv'] = createExportWrapper('_ZN7load3ds14ReadVertexListEv', 0);
var __ZN7load3ds12ReadFaceListEv = Module['__ZN7load3ds12ReadFaceListEv'] = createExportWrapper('_ZN7load3ds12ReadFaceListEv', 0);
var __ZN7load3ds15ReadFaceMatListEv = Module['__ZN7load3ds15ReadFaceMatListEv'] = createExportWrapper('_ZN7load3ds15ReadFaceMatListEv', 0);
var __ZN7load3ds13ReadTexCoordsEv = Module['__ZN7load3ds13ReadTexCoordsEv'] = createExportWrapper('_ZN7load3ds13ReadTexCoordsEv', 0);
var __ZN7load3ds7LoadMapEv = Module['__ZN7load3ds7LoadMapEv'] = createExportWrapper('_ZN7load3ds7LoadMapEv', 0);
var __ZN7load3ds7ReadMapEi = Module['__ZN7load3ds7ReadMapEi'] = createExportWrapper('_ZN7load3ds7ReadMapEi', 1);
var __ZN7load3ds11ReadTriMeshEv = Module['__ZN7load3ds11ReadTriMeshEv'] = createExportWrapper('_ZN7load3ds11ReadTriMeshEv', 0);
var __ZNSt3__24listIiNS_9allocatorIiEEE6__sortINS_6__lessIvvEEEENS_15__list_iteratorIiPvEES9_S9_mRT_ = Module['__ZNSt3__24listIiNS_9allocatorIiEEE6__sortINS_6__lessIvvEEEENS_15__list_iteratorIiPvEES9_S9_mRT_'] = createExportWrapper('_ZNSt3__24listIiNS_9allocatorIiEEE6__sortINS_6__lessIvvEEEENS_15__list_iteratorIiPvEES9_S9_mRT_', 4);
var __ZN7load3ds14ReadBrushBlockEv = Module['__ZN7load3ds14ReadBrushBlockEv'] = createExportWrapper('_ZN7load3ds14ReadBrushBlockEv', 0);
var __ZN7load3ds6New3dsEv = Module['__ZN7load3ds6New3dsEv'] = createExportWrapper('_ZN7load3ds6New3dsEv', 0);
var _coplanar_tri_tri = Module['_coplanar_tri_tri'] = createExportWrapper('coplanar_tri_tri', 7);
var __ZN12ShadowObject14SetShadowColorEiiii = Module['__ZN12ShadowObject14SetShadowColorEiiii'] = createExportWrapper('_ZN12ShadowObject14SetShadowColorEiiii', 5);
var __ZN12ShadowObject10ShadowInitEv = Module['__ZN12ShadowObject10ShadowInitEv'] = createExportWrapper('_ZN12ShadowObject10ShadowInitEv', 0);
var __ZN12ShadowObject4InitEv = Module['__ZN12ShadowObject4InitEv'] = createExportWrapper('_ZN12ShadowObject4InitEv', 1);
var __ZN12ShadowObject12UpdateCasterEv = Module['__ZN12ShadowObject12UpdateCasterEv'] = createExportWrapper('_ZN12ShadowObject12UpdateCasterEv', 1);
var __ZN12ShadowObject22ShadowRenderWorldZFailEv = Module['__ZN12ShadowObject22ShadowRenderWorldZFailEv'] = createExportWrapper('_ZN12ShadowObject22ShadowRenderWorldZFailEv', 0);
var __ZN12ShadowObject10UpdateAnimEv = Module['__ZN12ShadowObject10UpdateAnimEv'] = createExportWrapper('_ZN12ShadowObject10UpdateAnimEv', 1);
var __ZN12ShadowObject12RenderVolumeEv = Module['__ZN12ShadowObject12RenderVolumeEv'] = createExportWrapper('_ZN12ShadowObject12RenderVolumeEv', 0);
var __ZN12ShadowObject10InitShadowEv = Module['__ZN12ShadowObject10InitShadowEv'] = createExportWrapper('_ZN12ShadowObject10InitShadowEv', 1);
var __ZN13ProgramObject10DeActivateEv = Module['__ZN13ProgramObject10DeActivateEv'] = createExportWrapper('_ZN13ProgramObject10DeActivateEv', 1);
var __Z12CreateShaderNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj = Module['__Z12CreateShaderNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj'] = createExportWrapper('_Z12CreateShaderNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj', 2);
var __Z22CreateShaderFromStringNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj = Module['__Z22CreateShaderFromStringNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj'] = createExportWrapper('_Z22CreateShaderFromStringNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEj', 2);
var __ZN7Sampler6CreateEiP7Texture = Module['__ZN7Sampler6CreateEiP7Texture'] = createExportWrapper('_ZN7Sampler6CreateEiP7Texture', 2);
var __ZN13ProgramObject6CreateEv = Module['__ZN13ProgramObject6CreateEv'] = createExportWrapper('_ZN13ProgramObject6CreateEv', 0);
var __ZN6Shader17ProgramAttriBeginEv = Module['__ZN6Shader17ProgramAttriBeginEv'] = createExportWrapper('_ZN6Shader17ProgramAttriBeginEv', 1);
var __ZN6Shader15ProgramAttriEndEv = Module['__ZN6Shader15ProgramAttriEndEv'] = createExportWrapper('_ZN6Shader15ProgramAttriEndEv', 1);
var __ZN6Shader4LinkEv = Module['__ZN6Shader4LinkEv'] = createExportWrapper('_ZN6Shader4LinkEv', 1);
var __ZN13ProgramObject14RefreshTypeMapEv = Module['__ZN13ProgramObject14RefreshTypeMapEv'] = createExportWrapper('_ZN13ProgramObject14RefreshTypeMapEv', 1);
var __ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE25__emplace_unique_key_argsIS7_JRKNS_21piecewise_construct_tENS_5tupleIJOS7_EEENSJ_IJEEEEEENS_4pairINS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEEbEERKT_DpOT0_ = Module['__ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE25__emplace_unique_key_argsIS7_JRKNS_21piecewise_construct_tENS_5tupleIJOS7_EEENSJ_IJEEEEEENS_4pairINS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEEbEERKT_DpOT0_'] = createExportWrapper('_ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE25__emplace_unique_key_argsIS7_JRKNS_21piecewise_construct_tENS_5tupleIJOS7_EEENSJ_IJEEEEEENS_4pairINS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEEbEERKT_DpOT0_', 6);
var __ZN13ProgramObject8ActivateEv = Module['__ZN13ProgramObject8ActivateEv'] = createExportWrapper('_ZN13ProgramObject8ActivateEv', 1);
var __ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE4findIS7_EENS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEERKT_ = Module['__ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE4findIS7_EENS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEERKT_'] = createExportWrapper('_ZNSt3__26__treeINS_12__value_typeINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEiEENS_19__map_value_compareIS7_S8_NS_4lessIS7_EELb1EEENS5_IS8_EEE4findIS7_EENS_15__tree_iteratorIS8_PNS_11__tree_nodeIS8_PvEElEERKT_', 2);
var __ZN13ProgramObject9GetUniLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN13ProgramObject9GetUniLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN13ProgramObject9GetUniLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN13ProgramObject12GetAttribLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN13ProgramObject12GetAttribLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN13ProgramObject12GetAttribLocENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN3CSG4distEffffff = Module['__ZN3CSG4distEffffff'] = createExportWrapper('_ZN3CSG4distEffffff', 6);
var __ZN3CSG19PointDistanceToLineEfffffffff = Module['__ZN3CSG19PointDistanceToLineEfffffffff'] = createExportWrapper('_ZN3CSG19PointDistanceToLineEfffffffff', 9);
var __ZN3CSG12MakeTriangleEP4MeshP7SurfacefffffffffffffffiP11CSGTriangle = Module['__ZN3CSG12MakeTriangleEP4MeshP7SurfacefffffffffffffffiP11CSGTriangle'] = createExportWrapper('_ZN3CSG12MakeTriangleEP4MeshP7SurfacefffffffffffffffiP11CSGTriangle', 19);
var __ZN3CSG10ScanObjectEP4Mesh = Module['__ZN3CSG10ScanObjectEP4Mesh'] = createExportWrapper('_ZN3CSG10ScanObjectEP4Mesh', 1);
var __ZN3CSG9ray_planeEffffffffff = Module['__ZN3CSG9ray_planeEffffffffff'] = createExportWrapper('_ZN3CSG9ray_planeEffffffffff', 10);
var __ZN3CSG13SplitTriangleEP11CSGTriangleS1_ii = Module['__ZN3CSG13SplitTriangleEP11CSGTriangleS1_ii'] = createExportWrapper('_ZN3CSG13SplitTriangleEP11CSGTriangleS1_ii', 4);
var __ZN3CSG7findminEfff = Module['__ZN3CSG7findminEfff'] = createExportWrapper('_ZN3CSG7findminEfff', 3);
var __ZN3CSG7findmaxEfff = Module['__ZN3CSG7findmaxEfff'] = createExportWrapper('_ZN3CSG7findmaxEfff', 3);
var __ZN3CSG12BoxesOverlapEffffffffffff = Module['__ZN3CSG12BoxesOverlapEffffffffffff'] = createExportWrapper('_ZN3CSG12BoxesOverlapEffffffffffff', 12);
var __ZN3CSG16CSGTrisIntersectEP11CSGTriangleS1_ = Module['__ZN3CSG16CSGTrisIntersectEP11CSGTriangleS1_'] = createExportWrapper('_ZN3CSG16CSGTrisIntersectEP11CSGTriangleS1_', 2);
var __ZN3CSG14SplitTrianglesEP4Mesh = Module['__ZN3CSG14SplitTrianglesEP4Mesh'] = createExportWrapper('_ZN3CSG14SplitTrianglesEP4Mesh', 1);
var __ZN3CSG10CopyMeshAtEP4Mesh = Module['__ZN3CSG10CopyMeshAtEP4Mesh'] = createExportWrapper('_ZN3CSG10CopyMeshAtEP4Mesh', 1);
var __ZN3CSG22Ray_Intersect_TriangleEfffffffffffffffiii = Module['__ZN3CSG22Ray_Intersect_TriangleEfffffffffffffffiii'] = createExportWrapper('_ZN3CSG22Ray_Intersect_TriangleEfffffffffffffffiii', 18);
var __ZN3CSG22Ray_Intersect_Mesh_MaxEP4Meshffffffbbbb = Module['__ZN3CSG22Ray_Intersect_Mesh_MaxEP4Meshffffffbbbb'] = createExportWrapper('_ZN3CSG22Ray_Intersect_Mesh_MaxEP4Meshffffffbbbb', 11);
var __ZN3CSG11RebuildMeshEP4MeshS1_ii = Module['__ZN3CSG11RebuildMeshEP4MeshS1_ii'] = createExportWrapper('_ZN3CSG11RebuildMeshEP4MeshS1_ii', 4);
var __Z11Add3DVertexP7Surfaceffffff = Module['__Z11Add3DVertexP7Surfaceffffff'] = createExportWrapper('_Z11Add3DVertexP7Surfaceffffff', 7);
var __ZN11VoxelSprite10CopyEntityEP6Entity = Module['__ZN11VoxelSprite10CopyEntityEP6Entity'] = createExportWrapper('_ZN11VoxelSprite10CopyEntityEP6Entity', 2);
var __ZN11VoxelSprite6RenderEv = Module['__ZN11VoxelSprite6RenderEv'] = createExportWrapper('_ZN11VoxelSprite6RenderEv', 1);
var __ZN11VoxelSprite10FreeEntityEv = Module['__ZN11VoxelSprite10FreeEntityEv'] = createExportWrapper('_ZN11VoxelSprite10FreeEntityEv', 1);
var __ZN11VoxelSpriteD0Ev = Module['__ZN11VoxelSpriteD0Ev'] = createExportWrapper('_ZN11VoxelSpriteD0Ev', 1);
var __ZN11OcTreeChild11AddToOctreeEP4Meshifffffi = Module['__ZN11OcTreeChild11AddToOctreeEP4Meshifffffi'] = createExportWrapper('_ZN11OcTreeChild11AddToOctreeEP4Meshifffffi', 9);
var __ZN11OcTreeChild9CopyChildEv = Module['__ZN11OcTreeChild9CopyChildEv'] = createExportWrapper('_ZN11OcTreeChild9CopyChildEv', 1);
var __ZN11OcTreeChild9FreeChildEv = Module['__ZN11OcTreeChild9FreeChildEv'] = createExportWrapper('_ZN11OcTreeChild9FreeChildEv', 1);
var __ZN6OcTree13UpdateTerrainEv = Module['__ZN6OcTree13UpdateTerrainEv'] = createExportWrapper('_ZN6OcTree13UpdateTerrainEv', 1);
var __ZN11OcTreeChild11RenderChildEv = Module['__ZN11OcTreeChild11RenderChildEv'] = createExportWrapper('_ZN11OcTreeChild11RenderChildEv', 1);
var __ZN6OcTree9TreeCheckEP13CollisionInfo = Module['__ZN6OcTree9TreeCheckEP13CollisionInfo'] = createExportWrapper('_ZN6OcTree9TreeCheckEP13CollisionInfo', 2);
var __ZN11OcTreeChild10Coll_ChildEv = Module['__ZN11OcTreeChild10Coll_ChildEv'] = createExportWrapper('_ZN11OcTreeChild10Coll_ChildEv', 1);
var __ZN6OcTree10FreeEntityEv = Module['__ZN6OcTree10FreeEntityEv'] = createExportWrapper('_ZN6OcTree10FreeEntityEv', 1);
var __ZN6OcTree10CopyEntityEP6Entity = Module['__ZN6OcTree10CopyEntityEP6Entity'] = createExportWrapper('_ZN6OcTree10CopyEntityEP6Entity', 2);
var __ZN6OcTreeD2Ev = Module['__ZN6OcTreeD2Ev'] = createExportWrapper('_ZN6OcTreeD2Ev', 1);
var __ZN6OcTreeD0Ev = Module['__ZN6OcTreeD0Ev'] = createExportWrapper('_ZN6OcTreeD0Ev', 1);
var __ZN9Geosphere10CopyEntityEP6Entity = Module['__ZN9Geosphere10CopyEntityEP6Entity'] = createExportWrapper('_ZN9Geosphere10CopyEntityEP6Entity', 2);
var __ZN9Geosphere22EquirectangularToTOASTEv = Module['__ZN9Geosphere22EquirectangularToTOASTEv'] = createExportWrapper('_ZN9Geosphere22EquirectangularToTOASTEv', 1);
var __ZN9Geosphere8TOASTsubEiPfS0_S0_ = Module['__ZN9Geosphere8TOASTsubEiPfS0_S0_'] = createExportWrapper('_ZN9Geosphere8TOASTsubEiPfS0_S0_', 5);
var __ZN9Geosphere13UpdateTerrainEv = Module['__ZN9Geosphere13UpdateTerrainEv'] = createExportWrapper('_ZN9Geosphere13UpdateTerrainEv', 1);
var __ZN9Geosphere15RecreateGeoROAMEv = Module['__ZN9Geosphere15RecreateGeoROAMEv'] = createExportWrapper('_ZN9Geosphere15RecreateGeoROAMEv', 1);
var __ZN9Geosphere6geosubEiPfS0_S0_ = Module['__ZN9Geosphere6geosubEiPfS0_S0_'] = createExportWrapper('_ZN9Geosphere6geosubEiPfS0_S0_', 5);
var __ZN9Geosphere9TreeCheckEP13CollisionInfo = Module['__ZN9Geosphere9TreeCheckEP13CollisionInfo'] = createExportWrapper('_ZN9Geosphere9TreeCheckEP13CollisionInfo', 2);
var __ZN9Geosphere17c_col_tree_geosubEiPfS0_S0_ = Module['__ZN9Geosphere17c_col_tree_geosubEiPfS0_S0_'] = createExportWrapper('_ZN9Geosphere17c_col_tree_geosubEiPfS0_S0_', 5);
var __ZN9Geosphere10FreeEntityEv = Module['__ZN9Geosphere10FreeEntityEv'] = createExportWrapper('_ZN9Geosphere10FreeEntityEv', 1);
var __ZN9GeosphereD0Ev = Module['__ZN9GeosphereD0Ev'] = createExportWrapper('_ZN9GeosphereD0Ev', 1);
var __Z14MetaballsFieldfff = Module['__Z14MetaballsFieldfff'] = createExportWrapper('_Z14MetaballsFieldfff', 3);
var __Z11ArraysFieldfff = Module['__Z11ArraysFieldfff'] = createExportWrapper('_Z11ArraysFieldfff', 3);
var __ZN5Fluid12ResetBuffersEv = Module['__ZN5Fluid12ResetBuffersEv'] = createExportWrapper('_ZN5Fluid12ResetBuffersEv', 1);
var __ZN5Fluid10FreeEntityEv = Module['__ZN5Fluid10FreeEntityEv'] = createExportWrapper('_ZN5Fluid10FreeEntityEv', 1);
var __ZN5Fluid12MarchingCubeEffffffPf = Module['__ZN5Fluid12MarchingCubeEffffffPf'] = createExportWrapper('_ZN5Fluid12MarchingCubeEffffffPf', 8);
var __ZN5Fluid11MiddlePointEffff = Module['__ZN5Fluid11MiddlePointEffff'] = createExportWrapper('_ZN5Fluid11MiddlePointEffff', 5);
var __ZN5Fluid13BuildCubeGridEffffffffffff = Module['__ZN5Fluid13BuildCubeGridEffffffffffff'] = createExportWrapper('_ZN5Fluid13BuildCubeGridEffffffffffff', 13);
var __ZN5Fluid6RenderEv = Module['__ZN5Fluid6RenderEv'] = createExportWrapper('_ZN5Fluid6RenderEv', 1);
var __ZNSt3__24listIP4BlobNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_ = Module['__ZNSt3__24listIP4BlobNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_'] = createExportWrapper('_ZNSt3__24listIP4BlobNS_9allocatorIS2_EEE22__assign_with_sentinelB8ne190106INS_21__list_const_iteratorIS2_PvEES9_EEvT_T0_', 3);
var __ZN4Blob10FreeEntityEv = Module['__ZN4Blob10FreeEntityEv'] = createExportWrapper('_ZN4Blob10FreeEntityEv', 1);
var __ZN4Blob10CopyEntityEP6Entity = Module['__ZN4Blob10CopyEntityEP6Entity'] = createExportWrapper('_ZN4Blob10CopyEntityEP6Entity', 2);
var __ZN10FieldArray10FreeEntityEv = Module['__ZN10FieldArray10FreeEntityEv'] = createExportWrapper('_ZN10FieldArray10FreeEntityEv', 1);
var __ZN10FieldArray10CopyEntityEP6Entity = Module['__ZN10FieldArray10CopyEntityEP6Entity'] = createExportWrapper('_ZN10FieldArray10CopyEntityEP6Entity', 2);
var __ZN4BlobD0Ev = Module['__ZN4BlobD0Ev'] = createExportWrapper('_ZN4BlobD0Ev', 1);
var __ZN4Blob6UpdateEv = Module['__ZN4Blob6UpdateEv'] = createExportWrapper('_ZN4Blob6UpdateEv', 1);
var __ZN10FieldArrayD0Ev = Module['__ZN10FieldArrayD0Ev'] = createExportWrapper('_ZN10FieldArrayD0Ev', 1);
var __ZN10FieldArray6UpdateEv = Module['__ZN10FieldArray6UpdateEv'] = createExportWrapper('_ZN10FieldArray6UpdateEv', 1);
var __ZN5FluidD2Ev = Module['__ZN5FluidD2Ev'] = createExportWrapper('_ZN5FluidD2Ev', 1);
var __ZN5FluidD0Ev = Module['__ZN5FluidD0Ev'] = createExportWrapper('_ZN5FluidD0Ev', 1);
var __ZN13ParticleBatch6RenderEv = Module['__ZN13ParticleBatch6RenderEv'] = createExportWrapper('_ZN13ParticleBatch6RenderEv', 1);
var __ZN15ParticleEmitter6UpdateEv = Module['__ZN15ParticleEmitter6UpdateEv'] = createExportWrapper('_ZN15ParticleEmitter6UpdateEv', 1);
var __ZN15ParticleEmitter10CopyEntityEP6Entity = Module['__ZN15ParticleEmitter10CopyEntityEP6Entity'] = createExportWrapper('_ZN15ParticleEmitter10CopyEntityEP6Entity', 2);
var __ZN15ParticleEmitter10FreeEntityEv = Module['__ZN15ParticleEmitter10FreeEntityEv'] = createExportWrapper('_ZN15ParticleEmitter10FreeEntityEv', 1);
var __ZN13ParticleBatchD0Ev = Module['__ZN13ParticleBatchD0Ev'] = createExportWrapper('_ZN13ParticleBatchD0Ev', 1);
var __ZN15ParticleEmitterD2Ev = Module['__ZN15ParticleEmitterD2Ev'] = createExportWrapper('_ZN15ParticleEmitterD2Ev', 1);
var __ZN15ParticleEmitterD0Ev = Module['__ZN15ParticleEmitterD0Ev'] = createExportWrapper('_ZN15ParticleEmitterD0Ev', 1);
var __ZdaPvm = Module['__ZdaPvm'] = createExportWrapper('_ZdaPvm', 2);
var __ZN7LoadOBJ10ParseFacesENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN7LoadOBJ10ParseFacesENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN7LoadOBJ10ParseFacesENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN7LoadOBJ5splitERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEc = Module['__ZN7LoadOBJ5splitERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEc'] = createExportWrapper('_ZN7LoadOBJ5splitERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEEc', 3);
var __ZN7LoadOBJ11ParseMTLLibENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module['__ZN7LoadOBJ11ParseMTLLibENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE'] = createExportWrapper('_ZN7LoadOBJ11ParseMTLLibENSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE', 2);
var __ZN7LoadOBJ9VertCacheC2ERKS0_ = Module['__ZN7LoadOBJ9VertCacheC2ERKS0_'] = createExportWrapper('_ZN7LoadOBJ9VertCacheC2ERKS0_', 2);
var __ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEPS2_OT_ = Module['__ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEPS2_OT_'] = createExportWrapper('_ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE21__push_back_slow_pathIRKS2_EEPS2_OT_', 2);
var __ZN7LoadOBJ9ObjVertex9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module['__ZN7LoadOBJ9ObjVertex9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE'] = createExportWrapper('_ZN7LoadOBJ9ObjVertex9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE', 2);
var __ZN7LoadOBJ9VertCache8SetCacheEiiii = Module['__ZN7LoadOBJ9VertCache8SetCacheEiiii'] = createExportWrapper('_ZN7LoadOBJ9VertCache8SetCacheEiiii', 5);
var __ZN7LoadOBJ9ObjNormal9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module['__ZN7LoadOBJ9ObjNormal9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE'] = createExportWrapper('_ZN7LoadOBJ9ObjNormal9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE', 2);
var __ZN7LoadOBJ11ObjTexCoord9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module['__ZN7LoadOBJ11ObjTexCoord9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE'] = createExportWrapper('_ZN7LoadOBJ11ObjTexCoord9GetValuesENSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE', 2);
var __ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPS2_EES9_EES9_NS7_IPKS2_EET_T0_l = Module['__ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPS2_EES9_EES9_NS7_IPKS2_EET_T0_l'] = createExportWrapper('_ZNSt3__26vectorIN7LoadOBJ6ObjMtlENS_9allocatorIS2_EEE18__insert_with_sizeB8ne190106INS_11__wrap_iterIPS2_EES9_EES9_NS7_IPKS2_EET_T0_l', 5);
var __ZN7LoadOBJ6ObjMtlaSERKS0_ = Module['__ZN7LoadOBJ6ObjMtlaSERKS0_'] = createExportWrapper('_ZN7LoadOBJ6ObjMtlaSERKS0_', 2);
var __ZN7LoadOBJ9VertCacheaSEOS0_ = Module['__ZN7LoadOBJ9VertCacheaSEOS0_'] = createExportWrapper('_ZN7LoadOBJ9VertCacheaSEOS0_', 2);
var _cgltf_parse = Module['_cgltf_parse'] = createExportWrapper('cgltf_parse', 4);
var _cgltf_free = Module['_cgltf_free'] = createExportWrapper('cgltf_free', 1);
var _cgltf_parse_file = Module['_cgltf_parse_file'] = createExportWrapper('cgltf_parse_file', 3);
var _cgltf_load_buffer_base64 = Module['_cgltf_load_buffer_base64'] = createExportWrapper('cgltf_load_buffer_base64', 4);
var _cgltf_decode_string = Module['_cgltf_decode_string'] = createExportWrapper('cgltf_decode_string', 1);
var _cgltf_decode_uri = Module['_cgltf_decode_uri'] = createExportWrapper('cgltf_decode_uri', 1);
var _cgltf_load_buffers = Module['_cgltf_load_buffers'] = createExportWrapper('cgltf_load_buffers', 3);
var _cgltf_validate = Module['_cgltf_validate'] = createExportWrapper('cgltf_validate', 1);
var _cgltf_calc_size = Module['_cgltf_calc_size'] = createExportWrapper('cgltf_calc_size', 2);
var _cgltf_component_size = Module['_cgltf_component_size'] = createExportWrapper('cgltf_component_size', 1);
var _cgltf_copy_extras_json = Module['_cgltf_copy_extras_json'] = createExportWrapper('cgltf_copy_extras_json', 4);
var _cgltf_node_transform_local = Module['_cgltf_node_transform_local'] = createExportWrapper('cgltf_node_transform_local', 2);
var _cgltf_node_transform_world = Module['_cgltf_node_transform_world'] = createExportWrapper('cgltf_node_transform_world', 2);
var _cgltf_buffer_view_data = Module['_cgltf_buffer_view_data'] = createExportWrapper('cgltf_buffer_view_data', 1);
var _cgltf_find_accessor = Module['_cgltf_find_accessor'] = createExportWrapper('cgltf_find_accessor', 3);
var _cgltf_accessor_read_float = Module['_cgltf_accessor_read_float'] = createExportWrapper('cgltf_accessor_read_float', 4);
var _cgltf_accessor_unpack_floats = Module['_cgltf_accessor_unpack_floats'] = createExportWrapper('cgltf_accessor_unpack_floats', 3);
var _cgltf_num_components = Module['_cgltf_num_components'] = createExportWrapper('cgltf_num_components', 1);
var _cgltf_accessor_read_uint = Module['_cgltf_accessor_read_uint'] = createExportWrapper('cgltf_accessor_read_uint', 4);
var _cgltf_accessor_read_index = Module['_cgltf_accessor_read_index'] = createExportWrapper('cgltf_accessor_read_index', 2);
var _cgltf_mesh_index = Module['_cgltf_mesh_index'] = createExportWrapper('cgltf_mesh_index', 2);
var _cgltf_material_index = Module['_cgltf_material_index'] = createExportWrapper('cgltf_material_index', 2);
var _cgltf_accessor_index = Module['_cgltf_accessor_index'] = createExportWrapper('cgltf_accessor_index', 2);
var _cgltf_buffer_view_index = Module['_cgltf_buffer_view_index'] = createExportWrapper('cgltf_buffer_view_index', 2);
var _cgltf_buffer_index = Module['_cgltf_buffer_index'] = createExportWrapper('cgltf_buffer_index', 2);
var _cgltf_image_index = Module['_cgltf_image_index'] = createExportWrapper('cgltf_image_index', 2);
var _cgltf_texture_index = Module['_cgltf_texture_index'] = createExportWrapper('cgltf_texture_index', 2);
var _cgltf_sampler_index = Module['_cgltf_sampler_index'] = createExportWrapper('cgltf_sampler_index', 2);
var _cgltf_skin_index = Module['_cgltf_skin_index'] = createExportWrapper('cgltf_skin_index', 2);
var _cgltf_camera_index = Module['_cgltf_camera_index'] = createExportWrapper('cgltf_camera_index', 2);
var _cgltf_light_index = Module['_cgltf_light_index'] = createExportWrapper('cgltf_light_index', 2);
var _cgltf_node_index = Module['_cgltf_node_index'] = createExportWrapper('cgltf_node_index', 2);
var _cgltf_scene_index = Module['_cgltf_scene_index'] = createExportWrapper('cgltf_scene_index', 2);
var _cgltf_animation_index = Module['_cgltf_animation_index'] = createExportWrapper('cgltf_animation_index', 2);
var _cgltf_animation_sampler_index = Module['_cgltf_animation_sampler_index'] = createExportWrapper('cgltf_animation_sampler_index', 2);
var _cgltf_animation_channel_index = Module['_cgltf_animation_channel_index'] = createExportWrapper('cgltf_animation_channel_index', 2);
var _cgltf_accessor_unpack_indices = Module['_cgltf_accessor_unpack_indices'] = createExportWrapper('cgltf_accessor_unpack_indices', 4);
var ___errno_location = createExportWrapper('__errno_location', 0);
var _memcpy = createExportWrapper('memcpy', 3);
var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'])();
var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'])();
var __emscripten_memcpy_bulkmem = Module['__emscripten_memcpy_bulkmem'] = createExportWrapper('_emscripten_memcpy_bulkmem', 3);
var __emscripten_memset_bulkmem = Module['__emscripten_memset_bulkmem'] = createExportWrapper('_emscripten_memset_bulkmem', 3);
var _emscripten_builtin_memalign = createExportWrapper('emscripten_builtin_memalign', 2);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'])();
var _fflush = createExportWrapper('fflush', 1);
var _fileno = createExportWrapper('fileno', 1);
var _htons = createExportWrapper('htons', 1);
var _ntohs = createExportWrapper('ntohs', 1);
var _htonl = createExportWrapper('htonl', 1);
var _strerror = createExportWrapper('strerror', 1);
var __emscripten_timeout = createExportWrapper('_emscripten_timeout', 2);
var _setThrew = createExportWrapper('setThrew', 2);
var __emscripten_tempret_set = createExportWrapper('_emscripten_tempret_set', 1);
var __emscripten_tempret_get = createExportWrapper('_emscripten_tempret_get', 0);
var ___get_temp_ret = Module['___get_temp_ret'] = createExportWrapper('__get_temp_ret', 0);
var ___set_temp_ret = Module['___set_temp_ret'] = createExportWrapper('__set_temp_ret', 1);
var _getTempRet0 = Module['_getTempRet0'] = createExportWrapper('getTempRet0', 0);
var _setTempRet0 = Module['_setTempRet0'] = createExportWrapper('setTempRet0', 1);
var ___emutls_get_address = Module['___emutls_get_address'] = createExportWrapper('__emutls_get_address', 1);
var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports['emscripten_stack_init'])();
var _emscripten_stack_set_limits = Module['_emscripten_stack_set_limits'] = (a0, a1) => (_emscripten_stack_set_limits = Module['_emscripten_stack_set_limits'] = wasmExports['emscripten_stack_set_limits'])(a0, a1);
var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'])();
var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports['_emscripten_stack_restore'])(a0);
var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'])(a0);
var __ZNSt8bad_castD2Ev = Module['__ZNSt8bad_castD2Ev'] = createExportWrapper('_ZNSt8bad_castD2Ev', 1);
var __ZnamSt11align_val_t = Module['__ZnamSt11align_val_t'] = createExportWrapper('_ZnamSt11align_val_t', 2);
var __ZdaPvSt11align_val_t = Module['__ZdaPvSt11align_val_t'] = createExportWrapper('_ZdaPvSt11align_val_t', 2);
var __ZNSt13runtime_errorD2Ev = Module['__ZNSt13runtime_errorD2Ev'] = createExportWrapper('_ZNSt13runtime_errorD2Ev', 1);
var __ZNKSt13runtime_error4whatEv = Module['__ZNKSt13runtime_error4whatEv'] = createExportWrapper('_ZNKSt13runtime_error4whatEv', 1);
var __ZnwmSt11align_val_t = Module['__ZnwmSt11align_val_t'] = createExportWrapper('_ZnwmSt11align_val_t', 2);
var __ZdlPvmSt11align_val_t = Module['__ZdlPvmSt11align_val_t'] = createExportWrapper('_ZdlPvmSt11align_val_t', 3);
var ___cxa_uncaught_exceptions = Module['___cxa_uncaught_exceptions'] = createExportWrapper('__cxa_uncaught_exceptions', 0);
var ___cxa_decrement_exception_refcount = createExportWrapper('__cxa_decrement_exception_refcount', 1);
var ___cxa_increment_exception_refcount = createExportWrapper('__cxa_increment_exception_refcount', 1);
var ___cxa_current_primary_exception = Module['___cxa_current_primary_exception'] = createExportWrapper('__cxa_current_primary_exception', 0);
var __ZSt9terminatev = Module['__ZSt9terminatev'] = createExportWrapper('_ZSt9terminatev', 0);
var ___cxa_rethrow_primary_exception = Module['___cxa_rethrow_primary_exception'] = createExportWrapper('__cxa_rethrow_primary_exception', 1);
var __ZNSt9exceptionD2Ev = Module['__ZNSt9exceptionD2Ev'] = createExportWrapper('_ZNSt9exceptionD2Ev', 1);
var __ZNSt11logic_errorD2Ev = Module['__ZNSt11logic_errorD2Ev'] = createExportWrapper('_ZNSt11logic_errorD2Ev', 1);
var __ZNKSt11logic_error4whatEv = Module['__ZNKSt11logic_error4whatEv'] = createExportWrapper('_ZNKSt11logic_error4whatEv', 1);
var __ZSt15get_new_handlerv = Module['__ZSt15get_new_handlerv'] = createExportWrapper('_ZSt15get_new_handlerv', 0);
var __ZdlPv = Module['__ZdlPv'] = createExportWrapper('_ZdlPv', 1);
var __ZdlPvSt11align_val_t = Module['__ZdlPvSt11align_val_t'] = createExportWrapper('_ZdlPvSt11align_val_t', 2);
var __ZdaPvmSt11align_val_t = Module['__ZdaPvmSt11align_val_t'] = createExportWrapper('_ZdaPvmSt11align_val_t', 3);
var ___cxa_bad_cast = Module['___cxa_bad_cast'] = createExportWrapper('__cxa_bad_cast', 0);
var ___cxa_bad_typeid = Module['___cxa_bad_typeid'] = createExportWrapper('__cxa_bad_typeid', 0);
var ___cxa_throw_bad_array_new_length = Module['___cxa_throw_bad_array_new_length'] = createExportWrapper('__cxa_throw_bad_array_new_length', 0);
var __ZSt14set_unexpectedPFvvE = Module['__ZSt14set_unexpectedPFvvE'] = createExportWrapper('_ZSt14set_unexpectedPFvvE', 1);
var __ZSt13set_terminatePFvvE = Module['__ZSt13set_terminatePFvvE'] = createExportWrapper('_ZSt13set_terminatePFvvE', 1);
var __ZSt15set_new_handlerPFvvE = Module['__ZSt15set_new_handlerPFvvE'] = createExportWrapper('_ZSt15set_new_handlerPFvvE', 1);
var ___cxa_demangle = createExportWrapper('__cxa_demangle', 4);
var ___cxa_guard_acquire = Module['___cxa_guard_acquire'] = createExportWrapper('__cxa_guard_acquire', 1);
var ___cxa_guard_release = Module['___cxa_guard_release'] = createExportWrapper('__cxa_guard_release', 1);
var ___cxa_guard_abort = Module['___cxa_guard_abort'] = createExportWrapper('__cxa_guard_abort', 1);
var __ZSt14get_unexpectedv = Module['__ZSt14get_unexpectedv'] = createExportWrapper('_ZSt14get_unexpectedv', 0);
var __ZSt10unexpectedv = Module['__ZSt10unexpectedv'] = createExportWrapper('_ZSt10unexpectedv', 0);
var __ZSt13get_terminatev = Module['__ZSt13get_terminatev'] = createExportWrapper('_ZSt13get_terminatev', 0);
var ___cxa_uncaught_exception = Module['___cxa_uncaught_exception'] = createExportWrapper('__cxa_uncaught_exception', 0);
var ___cxa_free_exception = Module['___cxa_free_exception'] = createExportWrapper('__cxa_free_exception', 1);
var ___cxa_init_primary_exception = Module['___cxa_init_primary_exception'] = createExportWrapper('__cxa_init_primary_exception', 3);
var ___cxa_thread_atexit = Module['___cxa_thread_atexit'] = createExportWrapper('__cxa_thread_atexit', 3);
var ___cxa_deleted_virtual = Module['___cxa_deleted_virtual'] = createExportWrapper('__cxa_deleted_virtual', 0);
var __ZNSt9type_infoD2Ev = Module['__ZNSt9type_infoD2Ev'] = createExportWrapper('_ZNSt9type_infoD2Ev', 1);
var ___cxa_can_catch = createExportWrapper('__cxa_can_catch', 3);
var ___cxa_get_exception_ptr = createExportWrapper('__cxa_get_exception_ptr', 1);
var __ZNSt9exceptionD0Ev = Module['__ZNSt9exceptionD0Ev'] = createExportWrapper('_ZNSt9exceptionD0Ev', 1);
var __ZNSt9exceptionD1Ev = Module['__ZNSt9exceptionD1Ev'] = createExportWrapper('_ZNSt9exceptionD1Ev', 1);
var __ZNKSt9exception4whatEv = Module['__ZNKSt9exception4whatEv'] = createExportWrapper('_ZNKSt9exception4whatEv', 1);
var __ZNSt13bad_exceptionD0Ev = Module['__ZNSt13bad_exceptionD0Ev'] = createExportWrapper('_ZNSt13bad_exceptionD0Ev', 1);
var __ZNSt13bad_exceptionD1Ev = Module['__ZNSt13bad_exceptionD1Ev'] = createExportWrapper('_ZNSt13bad_exceptionD1Ev', 1);
var __ZNKSt13bad_exception4whatEv = Module['__ZNKSt13bad_exception4whatEv'] = createExportWrapper('_ZNKSt13bad_exception4whatEv', 1);
var __ZNSt9bad_allocC2Ev = Module['__ZNSt9bad_allocC2Ev'] = createExportWrapper('_ZNSt9bad_allocC2Ev', 1);
var __ZNSt9bad_allocD0Ev = Module['__ZNSt9bad_allocD0Ev'] = createExportWrapper('_ZNSt9bad_allocD0Ev', 1);
var __ZNSt9bad_allocD1Ev = Module['__ZNSt9bad_allocD1Ev'] = createExportWrapper('_ZNSt9bad_allocD1Ev', 1);
var __ZNKSt9bad_alloc4whatEv = Module['__ZNKSt9bad_alloc4whatEv'] = createExportWrapper('_ZNKSt9bad_alloc4whatEv', 1);
var __ZNSt20bad_array_new_lengthC2Ev = Module['__ZNSt20bad_array_new_lengthC2Ev'] = createExportWrapper('_ZNSt20bad_array_new_lengthC2Ev', 1);
var __ZNSt20bad_array_new_lengthD0Ev = Module['__ZNSt20bad_array_new_lengthD0Ev'] = createExportWrapper('_ZNSt20bad_array_new_lengthD0Ev', 1);
var __ZNKSt20bad_array_new_length4whatEv = Module['__ZNKSt20bad_array_new_length4whatEv'] = createExportWrapper('_ZNKSt20bad_array_new_length4whatEv', 1);
var __ZNSt13bad_exceptionD2Ev = Module['__ZNSt13bad_exceptionD2Ev'] = createExportWrapper('_ZNSt13bad_exceptionD2Ev', 1);
var __ZNSt9bad_allocC1Ev = Module['__ZNSt9bad_allocC1Ev'] = createExportWrapper('_ZNSt9bad_allocC1Ev', 1);
var __ZNSt9bad_allocD2Ev = Module['__ZNSt9bad_allocD2Ev'] = createExportWrapper('_ZNSt9bad_allocD2Ev', 1);
var __ZNSt20bad_array_new_lengthD2Ev = Module['__ZNSt20bad_array_new_lengthD2Ev'] = createExportWrapper('_ZNSt20bad_array_new_lengthD2Ev', 1);
var __ZNSt11logic_errorD0Ev = Module['__ZNSt11logic_errorD0Ev'] = createExportWrapper('_ZNSt11logic_errorD0Ev', 1);
var __ZNSt11logic_errorD1Ev = Module['__ZNSt11logic_errorD1Ev'] = createExportWrapper('_ZNSt11logic_errorD1Ev', 1);
var __ZNSt13runtime_errorD0Ev = Module['__ZNSt13runtime_errorD0Ev'] = createExportWrapper('_ZNSt13runtime_errorD0Ev', 1);
var __ZNSt13runtime_errorD1Ev = Module['__ZNSt13runtime_errorD1Ev'] = createExportWrapper('_ZNSt13runtime_errorD1Ev', 1);
var __ZNSt12domain_errorD0Ev = Module['__ZNSt12domain_errorD0Ev'] = createExportWrapper('_ZNSt12domain_errorD0Ev', 1);
var __ZNSt12domain_errorD1Ev = Module['__ZNSt12domain_errorD1Ev'] = createExportWrapper('_ZNSt12domain_errorD1Ev', 1);
var __ZNSt16invalid_argumentD0Ev = Module['__ZNSt16invalid_argumentD0Ev'] = createExportWrapper('_ZNSt16invalid_argumentD0Ev', 1);
var __ZNSt16invalid_argumentD1Ev = Module['__ZNSt16invalid_argumentD1Ev'] = createExportWrapper('_ZNSt16invalid_argumentD1Ev', 1);
var __ZNSt12length_errorD0Ev = Module['__ZNSt12length_errorD0Ev'] = createExportWrapper('_ZNSt12length_errorD0Ev', 1);
var __ZNSt12out_of_rangeD0Ev = Module['__ZNSt12out_of_rangeD0Ev'] = createExportWrapper('_ZNSt12out_of_rangeD0Ev', 1);
var __ZNSt11range_errorD0Ev = Module['__ZNSt11range_errorD0Ev'] = createExportWrapper('_ZNSt11range_errorD0Ev', 1);
var __ZNSt11range_errorD1Ev = Module['__ZNSt11range_errorD1Ev'] = createExportWrapper('_ZNSt11range_errorD1Ev', 1);
var __ZNSt14overflow_errorD0Ev = Module['__ZNSt14overflow_errorD0Ev'] = createExportWrapper('_ZNSt14overflow_errorD0Ev', 1);
var __ZNSt14overflow_errorD1Ev = Module['__ZNSt14overflow_errorD1Ev'] = createExportWrapper('_ZNSt14overflow_errorD1Ev', 1);
var __ZNSt15underflow_errorD0Ev = Module['__ZNSt15underflow_errorD0Ev'] = createExportWrapper('_ZNSt15underflow_errorD0Ev', 1);
var __ZNSt15underflow_errorD1Ev = Module['__ZNSt15underflow_errorD1Ev'] = createExportWrapper('_ZNSt15underflow_errorD1Ev', 1);
var __ZNSt12domain_errorD2Ev = Module['__ZNSt12domain_errorD2Ev'] = createExportWrapper('_ZNSt12domain_errorD2Ev', 1);
var __ZNSt16invalid_argumentD2Ev = Module['__ZNSt16invalid_argumentD2Ev'] = createExportWrapper('_ZNSt16invalid_argumentD2Ev', 1);
var __ZNSt12length_errorD2Ev = Module['__ZNSt12length_errorD2Ev'] = createExportWrapper('_ZNSt12length_errorD2Ev', 1);
var __ZNSt12out_of_rangeD2Ev = Module['__ZNSt12out_of_rangeD2Ev'] = createExportWrapper('_ZNSt12out_of_rangeD2Ev', 1);
var __ZNSt11range_errorD2Ev = Module['__ZNSt11range_errorD2Ev'] = createExportWrapper('_ZNSt11range_errorD2Ev', 1);
var __ZNSt14overflow_errorD2Ev = Module['__ZNSt14overflow_errorD2Ev'] = createExportWrapper('_ZNSt14overflow_errorD2Ev', 1);
var __ZNSt15underflow_errorD2Ev = Module['__ZNSt15underflow_errorD2Ev'] = createExportWrapper('_ZNSt15underflow_errorD2Ev', 1);
var __ZNSt9type_infoD0Ev = Module['__ZNSt9type_infoD0Ev'] = createExportWrapper('_ZNSt9type_infoD0Ev', 1);
var __ZNSt9type_infoD1Ev = Module['__ZNSt9type_infoD1Ev'] = createExportWrapper('_ZNSt9type_infoD1Ev', 1);
var __ZNSt8bad_castC2Ev = Module['__ZNSt8bad_castC2Ev'] = createExportWrapper('_ZNSt8bad_castC2Ev', 1);
var __ZNSt8bad_castD0Ev = Module['__ZNSt8bad_castD0Ev'] = createExportWrapper('_ZNSt8bad_castD0Ev', 1);
var __ZNSt8bad_castD1Ev = Module['__ZNSt8bad_castD1Ev'] = createExportWrapper('_ZNSt8bad_castD1Ev', 1);
var __ZNKSt8bad_cast4whatEv = Module['__ZNKSt8bad_cast4whatEv'] = createExportWrapper('_ZNKSt8bad_cast4whatEv', 1);
var __ZNSt10bad_typeidC2Ev = Module['__ZNSt10bad_typeidC2Ev'] = createExportWrapper('_ZNSt10bad_typeidC2Ev', 1);
var __ZNSt10bad_typeidD2Ev = Module['__ZNSt10bad_typeidD2Ev'] = createExportWrapper('_ZNSt10bad_typeidD2Ev', 1);
var __ZNSt10bad_typeidD0Ev = Module['__ZNSt10bad_typeidD0Ev'] = createExportWrapper('_ZNSt10bad_typeidD0Ev', 1);
var __ZNSt10bad_typeidD1Ev = Module['__ZNSt10bad_typeidD1Ev'] = createExportWrapper('_ZNSt10bad_typeidD1Ev', 1);
var __ZNKSt10bad_typeid4whatEv = Module['__ZNKSt10bad_typeid4whatEv'] = createExportWrapper('_ZNKSt10bad_typeid4whatEv', 1);
var __ZNSt8bad_castC1Ev = Module['__ZNSt8bad_castC1Ev'] = createExportWrapper('_ZNSt8bad_castC1Ev', 1);
var __ZNSt10bad_typeidC1Ev = Module['__ZNSt10bad_typeidC1Ev'] = createExportWrapper('_ZNSt10bad_typeidC1Ev', 1);
var __ZN6Entity11entity_listE = Module['__ZN6Entity11entity_listE'] = 153524;
var __ZTV4Bone = Module['__ZTV4Bone'] = 152028;
var __ZTI4Bone = Module['__ZTI4Bone'] = 152016;
var __ZTI6Entity = Module['__ZTI6Entity'] = 152060;
var __ZTV4Mesh = Module['__ZTV4Mesh'] = 152336;
var __ZTI4Mesh = Module['__ZTI4Mesh'] = 152324;
var __ZTV6Entity = Module['__ZTV6Entity'] = 152068;
var __ZTISt12length_error = Module['__ZTISt12length_error'] = 151604;
var __ZTVSt12length_error = Module['__ZTVSt12length_error'] = 151584;
var __ZTISt20bad_array_new_length = Module['__ZTISt20bad_array_new_length'] = 151368;
var __ZTISt12out_of_range = Module['__ZTISt12out_of_range'] = 151656;
var __ZTVSt12out_of_range = Module['__ZTVSt12out_of_range'] = 151636;
var __ZN6Global11vbo_enabledE = Module['__ZN6Global11vbo_enabledE'] = 152112;
var __ZN6Global14ambient_shaderE = Module['__ZN6Global14ambient_shaderE'] = 158944;
var __ZNSt3__219piecewise_constructE = Module['__ZNSt3__219piecewise_constructE'] = 70567;
var __ZTVN10__cxxabiv120__si_class_type_infoE = Module['__ZTVN10__cxxabiv120__si_class_type_infoE'] = 150936;
var __ZTS4Bone = Module['__ZTS4Bone'] = 70568;
var __ZN5Brush10brush_listE = Module['__ZN5Brush10brush_listE'] = 153456;
var __ZZN7MMatrix9alloc_tmpEvE3tmp = Module['__ZZN7MMatrix9alloc_tmpEvE3tmp'] = 153516;
var __ZN7MMatrix4tmpsE = Module['__ZN7MMatrix4tmpsE'] = 153568;
var __ZZN9Transform9alloc_tmpEvE3tmp = Module['__ZZN9Transform9alloc_tmpEvE3tmp'] = 153520;
var __ZN9Transform4tmpsE = Module['__ZN9Transform4tmpsE'] = 155872;
var _col_normal = Module['_col_normal'] = 153480;
var _col_time = Module['_col_time'] = 153492;
var _col_surface = Module['_col_surface'] = 153496;
var _col_index = Module['_col_index'] = 153500;
var _col_coords = Module['_col_coords'] = 153468;
var _col_pos = Module['_col_pos'] = 153504;
var __ZN6Entity12animate_listE = Module['__ZN6Entity12animate_listE'] = 153536;
var __ZN13CollisionPair9ent_listsE = Module['__ZN13CollisionPair9ent_listsE'] = 170416;
var __ZN4Pick8ent_listE = Module['__ZN4Pick8ent_listE'] = 169580;
var __ZN6Global8root_entE = Module['__ZN6Global8root_entE'] = 168868;
var __ZN6Entity9tformed_yE = Module['__ZN6Entity9tformed_yE'] = 153552;
var __ZN6Entity9tformed_xE = Module['__ZN6Entity9tformed_xE'] = 153548;
var __ZN6Entity9tformed_zE = Module['__ZN6Entity9tformed_zE'] = 153556;
var __ZTVN10__cxxabiv117__class_type_infoE = Module['__ZTVN10__cxxabiv117__class_type_infoE'] = 150896;
var __ZTS6Entity = Module['__ZTS6Entity'] = 70574;
var __ZN6Global6heightE = Module['__ZN6Global6heightE'] = 152124;
var __ZN6Global5widthE = Module['__ZN6Global5widthE'] = 152120;
var __ZN13ParticleBatch19particle_batch_listE = Module['__ZN13ParticleBatch19particle_batch_listE'] = 172124;
var __ZTV13ParticleBatch = Module['__ZTV13ParticleBatch'] = 152768;
var __ZN6Camera11projected_xE = Module['__ZN6Camera11projected_xE'] = 171700;
var __ZN6Camera11projected_yE = Module['__ZN6Camera11projected_yE'] = 171704;
var __ZN6Camera11projected_zE = Module['__ZN6Camera11projected_zE'] = 171708;
var __ZTI7Terrain = Module['__ZTI7Terrain'] = 152408;
var __ZTI9Geosphere = Module['__ZTI9Geosphere'] = 152624;
var __ZN6Global7shadersE = Module['__ZN6Global7shadersE'] = 158960;
var __ZN12GLES2_Shader7versionE = Module['__ZN12GLES2_Shader7versionE'] = 152856;
var __ZN12GLES2_Shader10vert_flagsE = Module['__ZN12GLES2_Shader10vert_flagsE'] = 152864;
var __ZN12GLES2_Shader9fog_flagsE = Module['__ZN12GLES2_Shader9fog_flagsE'] = 152900;
var __ZN12GLES2_Shader11vert_shaderE = Module['__ZN12GLES2_Shader11vert_shaderE'] = 152908;
var __ZN12GLES2_Shader10frag_flagsE = Module['__ZN12GLES2_Shader10frag_flagsE'] = 152912;
var __ZN12GLES2_Shader11frag_shaderE = Module['__ZN12GLES2_Shader11frag_shaderE'] = 152948;
var __ZN6Global6shaderE = Module['__ZN6Global6shaderE'] = 168680;
var __ZN12GLES2_Shader13vert_particleE = Module['__ZN12GLES2_Shader13vert_particleE'] = 152960;
var __ZN12GLES2_Shader13frag_particleE = Module['__ZN12GLES2_Shader13frag_particleE'] = 152964;
var __ZN6Global15shader_particleE = Module['__ZN6Global15shader_particleE'] = 168744;
var __ZN12GLES2_Shader10vert_voxelE = Module['__ZN12GLES2_Shader10vert_voxelE'] = 152968;
var __ZN12GLES2_Shader10frag_voxelE = Module['__ZN12GLES2_Shader10frag_voxelE'] = 152972;
var __ZN6Global12shader_voxelE = Module['__ZN6Global12shader_voxelE'] = 168804;
var __ZN12GLES2_Shader12vert_stencilE = Module['__ZN12GLES2_Shader12vert_stencilE'] = 152952;
var __ZN12GLES2_Shader12frag_stencilE = Module['__ZN12GLES2_Shader12frag_stencilE'] = 152956;
var __ZN6Global14shader_stencilE = Module['__ZN6Global14shader_stencilE'] = 168684;
var __ZN6Global11stencil_vboE = Module['__ZN6Global11stencil_vboE'] = 168864;
var __ZN6Global13ambient_greenE = Module['__ZN6Global13ambient_greenE'] = 152104;
var __ZN6Global11ambient_redE = Module['__ZN6Global11ambient_redE'] = 152100;
var __ZN6Global12ambient_blueE = Module['__ZN6Global12ambient_blueE'] = 152108;
var __ZN6Global11fog_enabledE = Module['__ZN6Global11fog_enabledE'] = 158952;
var __ZN6Global15Shadows_enabledE = Module['__ZN6Global15Shadows_enabledE'] = 158956;
var __ZN6Global12alpha_enableE = Module['__ZN6Global12alpha_enableE'] = 152128;
var __ZN6Global10blend_modeE = Module['__ZN6Global10blend_modeE'] = 152132;
var __ZN6Global3fx1E = Module['__ZN6Global3fx1E'] = 152136;
var __ZN6Global3fx2E = Module['__ZN6Global3fx2E'] = 152140;
var __ZN13CollisionPair7cp_listE = Module['__ZN13CollisionPair7cp_listE'] = 170392;
var __ZN12ShadowObject11shadow_listE = Module['__ZN12ShadowObject11shadow_listE'] = 171968;
var __ZN6Camera8cam_listE = Module['__ZN6Camera8cam_listE'] = 171676;
var __ZN10Constraint15constraint_listE = Module['__ZN10Constraint15constraint_listE'] = 172148;
var __ZN9RigidBody14rigidBody_listE = Module['__ZN9RigidBody14rigidBody_listE'] = 172160;
var __ZN6Action11action_listE = Module['__ZN6Action11action_listE'] = 172172;
var __ZN6PostFX7fx_listE = Module['__ZN6PostFX7fx_listE'] = 172184;
var __ZN6Shader11shader_listE = Module['__ZN6Shader11shader_listE'] = 172000;
var __ZN7Texture8tex_listE = Module['__ZN7Texture8tex_listE'] = 171724;
var __ZN6Global10anim_speedE = Module['__ZN6Global10anim_speedE'] = 152116;
var __ZN15ParticleEmitter12emitter_listE = Module['__ZN15ParticleEmitter12emitter_listE'] = 172136;
var __ZN6Global13camera_in_useE = Module['__ZN6Global13camera_in_useE'] = 168872;
var __ZTV5Pivot = Module['__ZTV5Pivot'] = 152192;
var __ZN6Global12vbo_min_trisE = Module['__ZN6Global12vbo_min_trisE'] = 158948;
var __ZN5Light10light_listE = Module['__ZN5Light10light_listE'] = 169568;
var __ZTV5Light = Module['__ZTV5Light'] = 152148;
var __ZN5Light9no_lightsE = Module['__ZN5Light9no_lightsE'] = 168880;
var __ZN5Light10max_lightsE = Module['__ZN5Light10max_lightsE'] = 152144;
var __ZN5Light8light_noE = Module['__ZN5Light8light_noE'] = 168876;
var __ZN5Light11light_colorE = Module['__ZN5Light11light_colorE'] = 169472;
var __ZN5Light14light_matricesE = Module['__ZN5Light14light_matricesE'] = 168928;
var __ZN5Light15light_outerconeE = Module['__ZN5Light15light_outerconeE'] = 169440;
var __ZN5Light11light_typesE = Module['__ZN5Light11light_typesE'] = 168896;
var __ZTI5Light = Module['__ZTI5Light'] = 152180;
var __ZTS5Light = Module['__ZTS5Light'] = 80409;
var __ZN4Pick11picked_timeE = Module['__ZN4Pick11picked_timeE'] = 169616;
var __ZN4Pick10picked_entE = Module['__ZN4Pick10picked_entE'] = 169620;
var __ZN4Pick8picked_xE = Module['__ZN4Pick8picked_xE'] = 169592;
var __ZN4Pick8picked_yE = Module['__ZN4Pick8picked_yE'] = 169596;
var __ZN4Pick8picked_zE = Module['__ZN4Pick8picked_zE'] = 169600;
var __ZN4Pick9picked_nxE = Module['__ZN4Pick9picked_nxE'] = 169604;
var __ZN4Pick9picked_nyE = Module['__ZN4Pick9picked_nyE'] = 169608;
var __ZN4Pick9picked_nzE = Module['__ZN4Pick9picked_nzE'] = 169612;
var __ZN4Pick14picked_surfaceE = Module['__ZN4Pick14picked_surfaceE'] = 169624;
var __ZN4Pick15picked_triangleE = Module['__ZN4Pick15picked_triangleE'] = 169628;
var __ZTI5Pivot = Module['__ZTI5Pivot'] = 152224;
var __ZTS5Pivot = Module['__ZTS5Pivot'] = 80416;
var __ZTV6Sprite = Module['__ZTV6Sprite'] = 152236;
var __ZN6Sprite4surfE = Module['__ZN6Sprite4surfE'] = 169720;
var __ZTI6Sprite = Module['__ZTI6Sprite'] = 152268;
var __ZTS6Sprite = Module['__ZTS6Sprite'] = 80423;
var __ZN13TextureFilter15tex_filter_listE = Module['__ZN13TextureFilter15tex_filter_listE'] = 169724;
var __ZN11SpriteBatch17sprite_batch_listE = Module['__ZN11SpriteBatch17sprite_batch_listE'] = 171664;
var __ZN6Camera11render_listE = Module['__ZN6Camera11render_listE'] = 171688;
var __ZTV6Camera = Module['__ZTV6Camera'] = 152292;
var __ZTI6Camera = Module['__ZTI6Camera'] = 152280;
var __ZTS6Camera = Module['__ZTS6Camera'] = 80431;
var __ZTS4Mesh = Module['__ZTS4Mesh'] = 80439;
var __ZN7Terrain12terrain_listE = Module['__ZN7Terrain12terrain_listE'] = 171840;
var __ZTV7Terrain = Module['__ZTV7Terrain'] = 152368;
var __ZN7Terrain9mesh_infoE = Module['__ZN7Terrain9mesh_infoE'] = 171836;
var __ZN7Terrain13triangleindexE = Module['__ZN7Terrain13triangleindexE'] = 171736;
var __ZTS7Terrain = Module['__ZTS7Terrain'] = 80496;
var __ZN7load3ds6BrushsE = Module['__ZN7load3ds6BrushsE'] = 171920;
var __ZN7load3ds9MovedTrisE = Module['__ZN7load3ds9MovedTrisE'] = 171944;
var __ZN7load3ds6StreamE = Module['__ZN7load3ds6StreamE'] = 171892;
var __ZN7load3ds7ChunkIDE = Module['__ZN7load3ds7ChunkIDE'] = 171896;
var __ZN7load3ds9ChunkSizeE = Module['__ZN7load3ds9ChunkSizeE'] = 171900;
var __ZN7load3ds11VertexCountE = Module['__ZN7load3ds11VertexCountE'] = 171908;
var __ZN7load3ds7surfaceE = Module['__ZN7load3ds7surfaceE'] = 171904;
var __ZN7load3ds13TriangleCountE = Module['__ZN7load3ds13TriangleCountE'] = 171912;
var __ZN7load3ds4meshE = Module['__ZN7load3ds4meshE'] = 171916;
var __ZN7load3ds7textureE = Module['__ZN7load3ds7textureE'] = 171940;
var __ZN7load3ds12TextureLayerE = Module['__ZN7load3ds12TextureLayerE'] = 171936;
var __ZN7load3ds5brushE = Module['__ZN7load3ds5brushE'] = 171932;
var __ZN12ShadowObject11ShadowAlphaE = Module['__ZN12ShadowObject11ShadowAlphaE'] = 152476;
var __ZN12ShadowObject11ShadowGreenE = Module['__ZN12ShadowObject11ShadowGreenE'] = 171960;
var __ZN12ShadowObject9ShadowRedE = Module['__ZN12ShadowObject9ShadowRedE'] = 171956;
var __ZN12ShadowObject10ShadowBlueE = Module['__ZN12ShadowObject10ShadowBlueE'] = 171964;
var __ZN12ShadowObject13midStencilValE = Module['__ZN12ShadowObject13midStencilValE'] = 171996;
var __ZN12ShadowObject8parallelE = Module['__ZN12ShadowObject8parallelE'] = 171992;
var __ZN12ShadowObject7light_xE = Module['__ZN12ShadowObject7light_xE'] = 171980;
var __ZN12ShadowObject7light_yE = Module['__ZN12ShadowObject7light_yE'] = 171984;
var __ZN12ShadowObject7light_zE = Module['__ZN12ShadowObject7light_zE'] = 171988;
var __ZN12ShadowObject12VolumeLengthE = Module['__ZN12ShadowObject12VolumeLengthE'] = 152484;
var __ZN12ShadowObject8top_capsE = Module['__ZN12ShadowObject8top_capsE'] = 152480;
var __ZN7Stencil13midStencilValE = Module['__ZN7Stencil13midStencilValE'] = 172016;
var __ZN11CSGTriangle16CSGTriangle_listE = Module['__ZN11CSGTriangle16CSGTriangle_listE'] = 172020;
var __ZN3CSG7npickedE = Module['__ZN3CSG7npickedE'] = 172032;
var __ZN3CSG7tpickedE = Module['__ZN3CSG7tpickedE'] = 172044;
var __ZTV11VoxelSprite = Module['__ZTV11VoxelSprite'] = 152488;
var __ZTI11VoxelSprite = Module['__ZTI11VoxelSprite'] = 152520;
var __ZTS11VoxelSprite = Module['__ZTS11VoxelSprite'] = 84288;
var __ZTV6OcTree = Module['__ZTV6OcTree'] = 152532;
var __ZTI6OcTree = Module['__ZTI6OcTree'] = 152572;
var __ZTS6OcTree = Module['__ZTS6OcTree'] = 84302;
var __ZTV9Geosphere = Module['__ZTV9Geosphere'] = 152584;
var __ZTS9Geosphere = Module['__ZTS9Geosphere'] = 84420;
var __ZTV5Fluid = Module['__ZTV5Fluid'] = 152724;
var __ZTV10FieldArray = Module['__ZTV10FieldArray'] = 152680;
var _triTable = Module['_triTable'] = 86384;
var __ZTV4Blob = Module['__ZTV4Blob'] = 152636;
var __ZTI4Blob = Module['__ZTI4Blob'] = 152668;
var __ZTS4Blob = Module['__ZTS4Blob'] = 103792;
var __ZTI10FieldArray = Module['__ZTI10FieldArray'] = 152712;
var __ZTS10FieldArray = Module['__ZTS10FieldArray'] = 103798;
var __ZTI5Fluid = Module['__ZTI5Fluid'] = 152756;
var __ZTS5Fluid = Module['__ZTS5Fluid'] = 103811;
var __ZTV15ParticleEmitter = Module['__ZTV15ParticleEmitter'] = 152812;
var __ZTI13ParticleBatch = Module['__ZTI13ParticleBatch'] = 152800;
var __ZTS13ParticleBatch = Module['__ZTS13ParticleBatch'] = 103818;
var __ZTI15ParticleEmitter = Module['__ZTI15ParticleEmitter'] = 152844;
var __ZTS15ParticleEmitter = Module['__ZTS15ParticleEmitter'] = 103834;
var __ZTISt8bad_cast = Module['__ZTISt8bad_cast'] = 151952;
var __ZTISt13runtime_error = Module['__ZTISt13runtime_error'] = 151736;
var __ZTISt9exception = Module['__ZTISt9exception'] = 151264;
var __ZTISt11logic_error = Module['__ZTISt11logic_error'] = 151500;
var __ZTVN10__cxxabiv121__vmi_class_type_infoE = Module['__ZTVN10__cxxabiv121__vmi_class_type_infoE'] = 151028;
var __ZTVSt11logic_error = Module['__ZTVSt11logic_error'] = 151408;
var __ZTVSt9exception = Module['__ZTVSt9exception'] = 151244;
var __ZTVSt13runtime_error = Module['__ZTVSt13runtime_error'] = 151428;
var ___cxa_unexpected_handler = Module['___cxa_unexpected_handler'] = 153452;
var ___cxa_terminate_handler = Module['___cxa_terminate_handler'] = 153448;
var ___cxa_new_handler = Module['___cxa_new_handler'] = 192460;
var __ZTIN10__cxxabiv116__shim_type_infoE = Module['__ZTIN10__cxxabiv116__shim_type_infoE'] = 148972;
var __ZTIN10__cxxabiv117__class_type_infoE = Module['__ZTIN10__cxxabiv117__class_type_infoE'] = 149020;
var __ZTIN10__cxxabiv117__pbase_type_infoE = Module['__ZTIN10__cxxabiv117__pbase_type_infoE'] = 149068;
var __ZTIDn = Module['__ZTIDn'] = 149448;
var __ZTIN10__cxxabiv119__pointer_type_infoE = Module['__ZTIN10__cxxabiv119__pointer_type_infoE'] = 149116;
var __ZTIv = Module['__ZTIv'] = 149396;
var __ZTIN10__cxxabiv120__function_type_infoE = Module['__ZTIN10__cxxabiv120__function_type_infoE'] = 149164;
var __ZTIN10__cxxabiv129__pointer_to_member_type_infoE = Module['__ZTIN10__cxxabiv129__pointer_to_member_type_infoE'] = 149216;
var __ZTISt9type_info = Module['__ZTISt9type_info'] = 151928;
var __ZTSN10__cxxabiv116__shim_type_infoE = Module['__ZTSN10__cxxabiv116__shim_type_infoE'] = 148984;
var __ZTSN10__cxxabiv117__class_type_infoE = Module['__ZTSN10__cxxabiv117__class_type_infoE'] = 149032;
var __ZTSN10__cxxabiv117__pbase_type_infoE = Module['__ZTSN10__cxxabiv117__pbase_type_infoE'] = 149080;
var __ZTSN10__cxxabiv119__pointer_type_infoE = Module['__ZTSN10__cxxabiv119__pointer_type_infoE'] = 149128;
var __ZTSN10__cxxabiv120__function_type_infoE = Module['__ZTSN10__cxxabiv120__function_type_infoE'] = 149176;
var __ZTSN10__cxxabiv129__pointer_to_member_type_infoE = Module['__ZTSN10__cxxabiv129__pointer_to_member_type_infoE'] = 149228;
var __ZTVN10__cxxabiv116__shim_type_infoE = Module['__ZTVN10__cxxabiv116__shim_type_infoE'] = 149288;
var __ZTVN10__cxxabiv123__fundamental_type_infoE = Module['__ZTVN10__cxxabiv123__fundamental_type_infoE'] = 149316;
var __ZTIN10__cxxabiv123__fundamental_type_infoE = Module['__ZTIN10__cxxabiv123__fundamental_type_infoE'] = 149344;
var __ZTSN10__cxxabiv123__fundamental_type_infoE = Module['__ZTSN10__cxxabiv123__fundamental_type_infoE'] = 149356;
var __ZTSv = Module['__ZTSv'] = 149404;
var __ZTIPv = Module['__ZTIPv'] = 149408;
var __ZTVN10__cxxabiv119__pointer_type_infoE = Module['__ZTVN10__cxxabiv119__pointer_type_infoE'] = 151148;
var __ZTSPv = Module['__ZTSPv'] = 149424;
var __ZTIPKv = Module['__ZTIPKv'] = 149428;
var __ZTSPKv = Module['__ZTSPKv'] = 149444;
var __ZTSDn = Module['__ZTSDn'] = 149456;
var __ZTIPDn = Module['__ZTIPDn'] = 149460;
var __ZTSPDn = Module['__ZTSPDn'] = 149476;
var __ZTIPKDn = Module['__ZTIPKDn'] = 149480;
var __ZTSPKDn = Module['__ZTSPKDn'] = 149496;
var __ZTIb = Module['__ZTIb'] = 149504;
var __ZTSb = Module['__ZTSb'] = 149512;
var __ZTIPb = Module['__ZTIPb'] = 149516;
var __ZTSPb = Module['__ZTSPb'] = 149532;
var __ZTIPKb = Module['__ZTIPKb'] = 149536;
var __ZTSPKb = Module['__ZTSPKb'] = 149552;
var __ZTIw = Module['__ZTIw'] = 149556;
var __ZTSw = Module['__ZTSw'] = 149564;
var __ZTIPw = Module['__ZTIPw'] = 149568;
var __ZTSPw = Module['__ZTSPw'] = 149584;
var __ZTIPKw = Module['__ZTIPKw'] = 149588;
var __ZTSPKw = Module['__ZTSPKw'] = 149604;
var __ZTIc = Module['__ZTIc'] = 149608;
var __ZTSc = Module['__ZTSc'] = 149616;
var __ZTIPc = Module['__ZTIPc'] = 149620;
var __ZTSPc = Module['__ZTSPc'] = 149636;
var __ZTIPKc = Module['__ZTIPKc'] = 149640;
var __ZTSPKc = Module['__ZTSPKc'] = 149656;
var __ZTIh = Module['__ZTIh'] = 149660;
var __ZTSh = Module['__ZTSh'] = 149668;
var __ZTIPh = Module['__ZTIPh'] = 149672;
var __ZTSPh = Module['__ZTSPh'] = 149688;
var __ZTIPKh = Module['__ZTIPKh'] = 149692;
var __ZTSPKh = Module['__ZTSPKh'] = 149708;
var __ZTIa = Module['__ZTIa'] = 149712;
var __ZTSa = Module['__ZTSa'] = 149720;
var __ZTIPa = Module['__ZTIPa'] = 149724;
var __ZTSPa = Module['__ZTSPa'] = 149740;
var __ZTIPKa = Module['__ZTIPKa'] = 149744;
var __ZTSPKa = Module['__ZTSPKa'] = 149760;
var __ZTIs = Module['__ZTIs'] = 149764;
var __ZTSs = Module['__ZTSs'] = 149772;
var __ZTIPs = Module['__ZTIPs'] = 149776;
var __ZTSPs = Module['__ZTSPs'] = 149792;
var __ZTIPKs = Module['__ZTIPKs'] = 149796;
var __ZTSPKs = Module['__ZTSPKs'] = 149812;
var __ZTIt = Module['__ZTIt'] = 149816;
var __ZTSt = Module['__ZTSt'] = 149824;
var __ZTIPt = Module['__ZTIPt'] = 149828;
var __ZTSPt = Module['__ZTSPt'] = 149844;
var __ZTIPKt = Module['__ZTIPKt'] = 149848;
var __ZTSPKt = Module['__ZTSPKt'] = 149864;
var __ZTIi = Module['__ZTIi'] = 149868;
var __ZTSi = Module['__ZTSi'] = 149876;
var __ZTIPi = Module['__ZTIPi'] = 149880;
var __ZTSPi = Module['__ZTSPi'] = 149896;
var __ZTIPKi = Module['__ZTIPKi'] = 149900;
var __ZTSPKi = Module['__ZTSPKi'] = 149916;
var __ZTIj = Module['__ZTIj'] = 149920;
var __ZTSj = Module['__ZTSj'] = 149928;
var __ZTIPj = Module['__ZTIPj'] = 149932;
var __ZTSPj = Module['__ZTSPj'] = 149948;
var __ZTIPKj = Module['__ZTIPKj'] = 149952;
var __ZTSPKj = Module['__ZTSPKj'] = 149968;
var __ZTIl = Module['__ZTIl'] = 149972;
var __ZTSl = Module['__ZTSl'] = 149980;
var __ZTIPl = Module['__ZTIPl'] = 149984;
var __ZTSPl = Module['__ZTSPl'] = 150000;
var __ZTIPKl = Module['__ZTIPKl'] = 150004;
var __ZTSPKl = Module['__ZTSPKl'] = 150020;
var __ZTIm = Module['__ZTIm'] = 150024;
var __ZTSm = Module['__ZTSm'] = 150032;
var __ZTIPm = Module['__ZTIPm'] = 150036;
var __ZTSPm = Module['__ZTSPm'] = 150052;
var __ZTIPKm = Module['__ZTIPKm'] = 150056;
var __ZTSPKm = Module['__ZTSPKm'] = 150072;
var __ZTIx = Module['__ZTIx'] = 150076;
var __ZTSx = Module['__ZTSx'] = 150084;
var __ZTIPx = Module['__ZTIPx'] = 150088;
var __ZTSPx = Module['__ZTSPx'] = 150104;
var __ZTIPKx = Module['__ZTIPKx'] = 150108;
var __ZTSPKx = Module['__ZTSPKx'] = 150124;
var __ZTIy = Module['__ZTIy'] = 150128;
var __ZTSy = Module['__ZTSy'] = 150136;
var __ZTIPy = Module['__ZTIPy'] = 150140;
var __ZTSPy = Module['__ZTSPy'] = 150156;
var __ZTIPKy = Module['__ZTIPKy'] = 150160;
var __ZTSPKy = Module['__ZTSPKy'] = 150176;
var __ZTIn = Module['__ZTIn'] = 150180;
var __ZTSn = Module['__ZTSn'] = 150188;
var __ZTIPn = Module['__ZTIPn'] = 150192;
var __ZTSPn = Module['__ZTSPn'] = 150208;
var __ZTIPKn = Module['__ZTIPKn'] = 150212;
var __ZTSPKn = Module['__ZTSPKn'] = 150228;
var __ZTIo = Module['__ZTIo'] = 150232;
var __ZTSo = Module['__ZTSo'] = 150240;
var __ZTIPo = Module['__ZTIPo'] = 150244;
var __ZTSPo = Module['__ZTSPo'] = 150260;
var __ZTIPKo = Module['__ZTIPKo'] = 150264;
var __ZTSPKo = Module['__ZTSPKo'] = 150280;
var __ZTIDh = Module['__ZTIDh'] = 150284;
var __ZTSDh = Module['__ZTSDh'] = 150292;
var __ZTIPDh = Module['__ZTIPDh'] = 150296;
var __ZTSPDh = Module['__ZTSPDh'] = 150312;
var __ZTIPKDh = Module['__ZTIPKDh'] = 150316;
var __ZTSPKDh = Module['__ZTSPKDh'] = 150332;
var __ZTIf = Module['__ZTIf'] = 150340;
var __ZTSf = Module['__ZTSf'] = 150348;
var __ZTIPf = Module['__ZTIPf'] = 150352;
var __ZTSPf = Module['__ZTSPf'] = 150368;
var __ZTIPKf = Module['__ZTIPKf'] = 150372;
var __ZTSPKf = Module['__ZTSPKf'] = 150388;
var __ZTId = Module['__ZTId'] = 150392;
var __ZTSd = Module['__ZTSd'] = 150400;
var __ZTIPd = Module['__ZTIPd'] = 150404;
var __ZTSPd = Module['__ZTSPd'] = 150420;
var __ZTIPKd = Module['__ZTIPKd'] = 150424;
var __ZTSPKd = Module['__ZTSPKd'] = 150440;
var __ZTIe = Module['__ZTIe'] = 150444;
var __ZTSe = Module['__ZTSe'] = 150452;
var __ZTIPe = Module['__ZTIPe'] = 150456;
var __ZTSPe = Module['__ZTSPe'] = 150472;
var __ZTIPKe = Module['__ZTIPKe'] = 150476;
var __ZTSPKe = Module['__ZTSPKe'] = 150492;
var __ZTIg = Module['__ZTIg'] = 150496;
var __ZTSg = Module['__ZTSg'] = 150504;
var __ZTIPg = Module['__ZTIPg'] = 150508;
var __ZTSPg = Module['__ZTSPg'] = 150524;
var __ZTIPKg = Module['__ZTIPKg'] = 150528;
var __ZTSPKg = Module['__ZTSPKg'] = 150544;
var __ZTIDu = Module['__ZTIDu'] = 150548;
var __ZTSDu = Module['__ZTSDu'] = 150556;
var __ZTIPDu = Module['__ZTIPDu'] = 150560;
var __ZTSPDu = Module['__ZTSPDu'] = 150576;
var __ZTIPKDu = Module['__ZTIPKDu'] = 150580;
var __ZTSPKDu = Module['__ZTSPKDu'] = 150596;
var __ZTIDs = Module['__ZTIDs'] = 150604;
var __ZTSDs = Module['__ZTSDs'] = 150612;
var __ZTIPDs = Module['__ZTIPDs'] = 150616;
var __ZTSPDs = Module['__ZTSPDs'] = 150632;
var __ZTIPKDs = Module['__ZTIPKDs'] = 150636;
var __ZTSPKDs = Module['__ZTSPKDs'] = 150652;
var __ZTIDi = Module['__ZTIDi'] = 150660;
var __ZTSDi = Module['__ZTSDi'] = 150668;
var __ZTIPDi = Module['__ZTIPDi'] = 150672;
var __ZTSPDi = Module['__ZTSPDi'] = 150688;
var __ZTIPKDi = Module['__ZTIPKDi'] = 150692;
var __ZTSPKDi = Module['__ZTSPKDi'] = 150708;
var __ZTVN10__cxxabiv117__array_type_infoE = Module['__ZTVN10__cxxabiv117__array_type_infoE'] = 150716;
var __ZTIN10__cxxabiv117__array_type_infoE = Module['__ZTIN10__cxxabiv117__array_type_infoE'] = 150744;
var __ZTSN10__cxxabiv117__array_type_infoE = Module['__ZTSN10__cxxabiv117__array_type_infoE'] = 150756;
var __ZTVN10__cxxabiv120__function_type_infoE = Module['__ZTVN10__cxxabiv120__function_type_infoE'] = 150792;
var __ZTVN10__cxxabiv116__enum_type_infoE = Module['__ZTVN10__cxxabiv116__enum_type_infoE'] = 150820;
var __ZTIN10__cxxabiv116__enum_type_infoE = Module['__ZTIN10__cxxabiv116__enum_type_infoE'] = 150848;
var __ZTSN10__cxxabiv116__enum_type_infoE = Module['__ZTSN10__cxxabiv116__enum_type_infoE'] = 150860;
var __ZTIN10__cxxabiv120__si_class_type_infoE = Module['__ZTIN10__cxxabiv120__si_class_type_infoE'] = 150976;
var __ZTSN10__cxxabiv120__si_class_type_infoE = Module['__ZTSN10__cxxabiv120__si_class_type_infoE'] = 150988;
var __ZTIN10__cxxabiv121__vmi_class_type_infoE = Module['__ZTIN10__cxxabiv121__vmi_class_type_infoE'] = 151068;
var __ZTSN10__cxxabiv121__vmi_class_type_infoE = Module['__ZTSN10__cxxabiv121__vmi_class_type_infoE'] = 151080;
var __ZTVN10__cxxabiv117__pbase_type_infoE = Module['__ZTVN10__cxxabiv117__pbase_type_infoE'] = 151120;
var __ZTVN10__cxxabiv129__pointer_to_member_type_infoE = Module['__ZTVN10__cxxabiv129__pointer_to_member_type_infoE'] = 151176;
var __ZTVSt9bad_alloc = Module['__ZTVSt9bad_alloc'] = 151204;
var __ZTVSt20bad_array_new_length = Module['__ZTVSt20bad_array_new_length'] = 151224;
var __ZTISt9bad_alloc = Module['__ZTISt9bad_alloc'] = 151340;
var __ZTSSt9exception = Module['__ZTSSt9exception'] = 151272;
var __ZTVSt13bad_exception = Module['__ZTVSt13bad_exception'] = 151288;
var __ZTISt13bad_exception = Module['__ZTISt13bad_exception'] = 151308;
var __ZTSSt13bad_exception = Module['__ZTSSt13bad_exception'] = 151320;
var __ZTSSt9bad_alloc = Module['__ZTSSt9bad_alloc'] = 151352;
var __ZTSSt20bad_array_new_length = Module['__ZTSSt20bad_array_new_length'] = 151380;
var __ZTVSt12domain_error = Module['__ZTVSt12domain_error'] = 151448;
var __ZTISt12domain_error = Module['__ZTISt12domain_error'] = 151468;
var __ZTSSt12domain_error = Module['__ZTSSt12domain_error'] = 151480;
var __ZTSSt11logic_error = Module['__ZTSSt11logic_error'] = 151512;
var __ZTVSt16invalid_argument = Module['__ZTVSt16invalid_argument'] = 151528;
var __ZTISt16invalid_argument = Module['__ZTISt16invalid_argument'] = 151548;
var __ZTSSt16invalid_argument = Module['__ZTSSt16invalid_argument'] = 151560;
var __ZTSSt12length_error = Module['__ZTSSt12length_error'] = 151616;
var __ZTSSt12out_of_range = Module['__ZTSSt12out_of_range'] = 151668;
var __ZTVSt11range_error = Module['__ZTVSt11range_error'] = 151688;
var __ZTISt11range_error = Module['__ZTISt11range_error'] = 151708;
var __ZTSSt11range_error = Module['__ZTSSt11range_error'] = 151720;
var __ZTSSt13runtime_error = Module['__ZTSSt13runtime_error'] = 151748;
var __ZTVSt14overflow_error = Module['__ZTVSt14overflow_error'] = 151768;
var __ZTISt14overflow_error = Module['__ZTISt14overflow_error'] = 151788;
var __ZTSSt14overflow_error = Module['__ZTSSt14overflow_error'] = 151800;
var __ZTVSt15underflow_error = Module['__ZTVSt15underflow_error'] = 151820;
var __ZTISt15underflow_error = Module['__ZTISt15underflow_error'] = 151840;
var __ZTSSt15underflow_error = Module['__ZTSSt15underflow_error'] = 151852;
var __ZTVSt8bad_cast = Module['__ZTVSt8bad_cast'] = 151872;
var __ZTVSt10bad_typeid = Module['__ZTVSt10bad_typeid'] = 151892;
var __ZTISt10bad_typeid = Module['__ZTISt10bad_typeid'] = 151976;
var __ZTVSt9type_info = Module['__ZTVSt9type_info'] = 151912;
var __ZTSSt9type_info = Module['__ZTSSt9type_info'] = 151936;
var __ZTSSt8bad_cast = Module['__ZTSSt8bad_cast'] = 151964;
var __ZTSSt10bad_typeid = Module['__ZTSSt10bad_typeid'] = 151988;

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

Module['ccall'] = ccall;
Module['cwrap'] = cwrap;


var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    Module['onRuntimeInitialized']?.();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    ['stdout', 'stderr'].forEach((name) => {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    });
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();

// end include: postamble.js

