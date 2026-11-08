// three's Basis Universal transcoder (node_modules/three/examples/jsm/libs/basis/basis_transcoder.js, an Emscripten
// build with embind) made fit for the island's KTX2 worker (ktx2.worker.ts; vite.config.ts basisModule applies it):
// - an ES module: its CommonJS/AMD tail swapped for `export default BASIS`;
// - no Node branch's fs and path (never taken in a browser; not bundled as stubs);
// - no eval: embind builds each bound method's JS wrapper, and emval each JS method C++ calls (KTX2File's constructor
//   reads its Uint8Array so), with `new Function`, which the CSP forbids (script-src has no 'unsafe-eval', and a
//   worker keeps the page's). The same wrappers as closures take their place (Emscripten's DYNAMIC_EXECUTION=0 forms).
//   ktx2.test.ts runs the result with code generation off and transcodes a texture.
// Anything not where it's expected throws (the build stops): a three upgrade gets rechecked.
const TAIL = "if (typeof exports === 'object' && typeof module === 'object')";
const CRAFT = 'function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){';
const NO_EVAL_CRAFT = `function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){
var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")}
var isClassMethodFunc=argTypes[1]!==null&&classType!==null,needsDestructorStack=usesDestructorStack(argTypes),returns=argTypes[0].name!=="void";
return createNamedFunction(humanName,function(...args){
if(args.length!==argCount-2){throwBindingError("function "+humanName+" called with "+args.length+" arguments, expected "+(argCount-2))}
var destructors=needsDestructorStack?[]:null,wired=[];
if(isClassMethodFunc){wired.push(argTypes[1].toWireType(destructors,this))}
for(var i=0;i<argCount-2;++i){wired.push(argTypes[i+2].toWireType(destructors,args[i]))}
var rv=cppInvokerFunc(cppTargetFunc,...wired);
if(needsDestructorStack){runDestructors(destructors)}else{for(var i=isClassMethodFunc?1:2;i<argCount;++i){if(argTypes[i].destructorFunction!==null){argTypes[i].destructorFunction(wired[i-2+(isClassMethodFunc?1:0)])}}}
if(returns){return argTypes[0].fromWireType(rv)}})}
function craftInvokerFunctionEval(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){`;
const CALLER = 'var invokerFunction=newFunc(Function,params)(...args);';
const NO_EVAL_CALLER = `var invokerFunction=function(obj,func,destructorsRef,argsPtr){var a=kind===0?[obj]:[],at=0;
for(var i=0;i<argCount;++i){a.push(types[i].readValueFromPointer(argsPtr+at));at+=types[i]["argPackAdvance"]}
var rv=kind===1?new func(...a):func.call(...a);return retType.isVoid?undefined:emval_returnValue(retType,destructorsRef,rv)};`;

export function basisModuleCode(code: string): string {
  const tail = code.lastIndexOf(TAIL);
  const once = (s: string) => code.split(s).length === 2;
  if (tail < 0 || ![CRAFT, CALLER, 'require("fs")', 'require("path")'].every(once)) throw new Error("basisModule: three's Basis transcoder changed; recheck world3d/basisModule.ts");
  return `${code.slice(0, tail).replace(CRAFT, NO_EVAL_CRAFT).replace(CALLER, NO_EVAL_CALLER).replace('require("fs")', 'null').replace('require("path")', 'null')}export default BASIS;\n`;
}
