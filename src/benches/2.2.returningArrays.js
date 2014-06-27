
// Initiating an ASM module with a new heap is costly, so a common ASM pattern is to allocate
//	a large amount of heap to a module on initialization, and then on demand within ASM dynamically
//	"allocate" areas of that heap to functions which require a variable amount of heap.
// when using a shared heap, getting array output from a function requires getting both the 
// length and offset of the array. Because ASM functions can only return numeric values,
// the question arises of how to best retrieve this two-element array of values necessary for accessing
// the longer array.
// Three methods are compared here for returning array length and offset from ASM:
// 1. "heapView": 	allocate a separate two-element INT32 array and return its offset; 
//					the caller (vanilla js) function by convention creates an INT32 two-element view at
//					that offset and retrieves the two values.
//						performance: about 50% slower than fcall. 
//						setting up an arrayview takes a long time.
//
// 2. "split"	: 	break up the ASM function into two parts, the first to determine the eventual
//					byte length of the array and return it, the second to create the array annd
//					return the offset.					
//						drawback:
//						only makes sense in situations where length can be easily calculated,
//						or there will never be more than one simultaneous call of this function
//						and named module variables can be used for storing length and offset)
//
// 3. "f(heap)" : 	allocate two-bytes of arrayInfo and return its offset as in heapView 
//					but instead of creating a new array view over a large arrayBuffer
//					pass the ArrayInfo offset to a getLength and getOffset func, which
//					will return the respective values through direct memory access.
//
// 4. "typeless" : 	functions creating the array secretly pad an 8-byte header 
//					to the array (8-bytes because we can anticipate 64-bit types being
//					added to asm.js. obviously you could manage type and length in 
//					2 or 4 bytes if your use cases won't exceed those needs)
//					regardless of array type. The first byte is an int of array element size
//					the second byte is an int of array bytelength
//					the function returns the offset of the first actual array element
//					user gets length by calling a generalized function for getting length
//					of padded array given offset of first element.
//

// performance results : for small arrays of about 10 items, where the difference
//	is among the most pronounced, typeless wins in performance by about 10-12%
//	over heapview and fheap, with split generally coming in a few points slower
//	than typeless. In general, I recommend typeless.

//requirements to build:
// scoville preprocessor to add malloc (and uncomment for different modes)
// minimalasm sweet.js macros
//	sweet.js (obviously)
// require
if (window.benches === undefined) {
  window.benches = [];
}

window.benches.push(["",(function(std) {

'use strict';
function Bench(stdlib) {
    var heap = new ArrayBuffer(4096 * 4096 * 32);
    var l_ = _ASM_LScore(stdlib, {}, heap);
    //l_._initRandom(stdlib);
    l_._heap = heap;
  l_._getRange = function(offset, length) {
    var swe = new Int32Array(l_._heap,offset,length);
    var out = Array.apply([],swe);
    return out;
  };
  l_.rangeHeapview = function (start, stop, step) {
    var infoLoc = l_._rangeEnvelope(stop === undefined, start, stop, step);
    var arrInfo = new Int32Array(l_._heap, infoLoc, 2);
    var swe = new Int32Array(l_._heap,arrInfo[0],arrInfo[1]);
    //=SPEC var out= (swe.length !== 1)? Array.apply([], swe) : [swe[0]];
    l_._deAllocInfoloc(infoLoc);
    //=SPEC return out;
  };
  l_.rangeSplit = function (start, stop, step) {
    var length = l_._rangeSplitLength(stop === undefined, start, stop, step);
    var offset = l_._rangeSplit(length, stop === undefined, start, stop, step);
    var swe = new Int32Array(l_._heap,offset,length); 
    //=SPEC var out= (swe.length !== 1)? Array.apply([], swe) : [swe[0]];
    l_._deAllocArr(offset, 4);
    //=SPEC return out;
  };
  l_.rangeFheap = function (start, stop, step) {
    var infoLoc = l_._rangeEnvelope(stop === undefined, start, stop, step);
    var length = l_._getLength(infoLoc);
    var offset = l_._getOffset(infoLoc);
    var swe = new Int32Array(l_._heap,offset,length); 
    //=SPEC var out= (swe.length !== 1)? Array.apply([], swe) : [swe[0]];
    l_._deAllocInfoloc(infoLoc);
    //=SPEC return out;		
  };
  l_.rangeTypeless = function (start, stop, step) {
    var offset = l_._rangeTypeless(stop === undefined, start, stop, step);
    var length = l_._getLengthTypeless(offset);
    var swe = new Int32Array(l_._heap,offset,length);
    //=SPEC var out= (swe.length !== 1)? Array.apply([], swe) : [swe[0]];
    l_._deAllocTypeless(offset); 
    //=SPEC return out;
  };
  return l_;
};

function _ASM_LScore(stdlib, foreign, heap) {
  'use asm';
  var imul = stdlib.Math.imul;
  var memInt8 = new stdlib.Int8Array(heap);
  var memInt16 = new stdlib.Int16Array(heap);
  var memInt32 = new stdlib.Int32Array(heap);
  var memFloat32 = new stdlib.Float32Array(heap);
  var cursor = 0;
  var INT32 = 4;
  var INT16 = 2;
  var INI8 = 1;
  var UINT16 = 2;
  var UINT8 = 1;
  var FLOAT32 = 4;
  var EXTRA_INT32 =2;	//every array gets eight xtra bytes
  //1st is an i32 of type, 2nd is an i32 of length.
  //for now, pretend infinite memory.
//%MALLOC%
  f _malloc(i: length, i: type) {
    int newPos, oldPos;
    newPos = (cursor | 0) + (imul(length | 0, 4) | 0) | 0;
    oldPos = cursor | 0;
    cursor = newPos | 0;
    return oldPos | 0;
  }
  f _free(i: offset,i: type) {
    return 1;
  }

    /*
  function _rndDbl() {
var rMaxDbl = 4294967295.0;  
var ratio = 0.4;
// move back to unsigned before converting to double
ratio = +((int32()|0) >>> 0) / +rMaxDbl; 
return +ratio;
  }


  function random(min, max) {
//TODO fix rndval==RANDMAX bug.
min = min|0;
max = max|0;
var rndint = 0;
if ((max|0) == 0) { max = min; min = 0; }
// rndint = min + _floorD(_rndDbl() * ((max+1)-min))
rndint = (min|0) + (_floorD(+_rndDbl() * +((max|0 + 1) - min|0))|0)|0;    
//rndint = (min|0) + (_floorD(+rndval * +((max|0 + 1) - min|0))|0)|0;
return rndint|0;
  }
*/
    //start is optional, step is optional
    //start defaults to 0, step to 1

  f _floorD(d: dbl) {
    var cInt = 1;
    cInt = ~~+dbl | 0;
    if (+(cInt | 0) > +dbl) {
      cInt = cInt|0 - 1;
    }
//    return 1;
    return cInt | 0;
  }
  f _arrayEnvelope(i: offset, i: length, i: type) {
    int thisOffset;
    thisOffset = _malloc(3, INT32) | 0;
    memInt32[(thisOffset | 0) >> 2] = offset | 0;
    memInt32[(thisOffset | 0) + 4 >> 2] = length | 0;
    memInt32[(thisOffset | 0) + 8 >> 2] = type | 0;
    return thisOffset | 0;
  }
  f _deAllocArr(i: offset,i: type) {
  int sponge;
    sponge = _free(offset | 0, type | 0) | 0;
  }
  f _deAllocInfoloc(i: infoloc) {
    int sponge;
    sponge = _free(memInt32[(infoloc | 0) >> 2] | 0, memInt32[(infoloc | 0) + 8 >> 2] | 0) | 0;
    sponge = _free(infoloc | 0, 4) | 0;
  }
  f _deAllocTypeless(i: offset) {
    int type, sponge; 
    offset = ((offset|0) - 8)|0;
    type = (memInt32[(offset|0) >> 2])|0;
    sponge = _free(offset | 0, type | 0) | 0;
  }
  
  //begin fcall
  f _rangeSplitLength(i: nargstop,i: start,i: stop,i: step) {
    int length, bytelength;
    if ((step | 0) == 0) {
      step = 1;
      if ((nargstop | 0) == 1) {
        stop = start | 0;
        start = 0;
      }
    }
    length = _floorD(+((stop | 0) - start | 0) / +(step | 0)) | 0;
    if (((length | 0) & 0x80000000) != 0)
    // positive numInts only
    {
      length = 0;
    }
    //bytelength = imul(length | 0, 4) | 0;
    return length | 0;
  }
  f _rangeSplit(i: length,i: nargstop,i: start,i: stop,i: step) {
    int pos=0, val, byteoffset, bytelength;
    bytelength = imul((length|0),4)|0;
    if ((step | 0) == 0) {
      step = 1;
      if ((nargstop | 0) == 1) {
        stop = start | 0;
        start = 0;
      }
    }
    val = start|0;
    byteoffset = _malloc((bytelength | 0) >> 2, INT32) | 0;
    while ((pos | 0) < (bytelength | 0)) {
      memInt32[((byteoffset | 0) + pos | 0) >> 2] = val | 0;
      val = (val | 0) + step | 0 | 0;
      pos = (pos | 0) + 4 | 0;
    }
    //return val | 0;
    return byteoffset | 0;
  }
  // end fcall
  //begin heapview and fheap
  f _rangeEnvelope(i: nargstop,i: start,i: stop,i: step) {
    int pos = 0, val, length, bytelength, byteoffset, envelopeByteOffset;
    if ((step | 0) == 0) {
      step = 1;
      if ((nargstop | 0) == 1) {
        stop = start | 0;
        start = 0;
      }
    }
    val = start | 0;
    length = _floorD(+((stop | 0) - start | 0) / +(step | 0)) | 0;
    if (((length | 0) & 0x80000000) != 0)
    // positive numInts only
    {
      length = 0;
    }
    bytelength = imul(length | 0, 4) | 0;
    byteoffset = _malloc(length | 0, INT32) | 0;
    while ((pos | 0) < (bytelength | 0)) {
      memInt32[((byteoffset | 0) + pos | 0) >> 2] = val | 0;
      val = (val | 0) + step | 0 | 0;
      pos = (pos | 0) + 4 | 0;
    }
    envelopeByteOffset = _arrayEnvelope(byteoffset | 0, length | 0, 4) | 0;
    return envelopeByteOffset | 0;
  }
  f _getLength(i: infoloc) {
    int length = 0;
    length = (memInt32[((infoloc|0) + 4) >> 2])|0;
    return length|0;
  }
  
  f _getOffset(i: infoloc) {
    int offset;
    offset = (memInt32[(infoloc|0) >> 2])|0;
    return offset|0;
  }
  
  //begin f64
  f _32Malloc(i: length) {
    int byteOffset;
    byteOffset = _malloc(((length | 0) + 2)|0, 4) | 0;
    memInt32[(byteOffset|0) >> 2] = 4;
    memInt32[((byteOffset|0) + 4) >> 2] = length|0;
    byteOffset = ((byteOffset|0) + 8)|0;
    return byteOffset|0;
  }
  
  f _rangeTypeless(i: nargstop, i: start, i: stop, i: step) {
    int pos=0, val, length, bytelength, byteOffset;
    
    //var envelopeByteOffset = 0;
    if ((step | 0) == 0) {
      step = 1;
      if ((nargstop | 0) == 1) {
        stop = start | 0;
        start = 0;
      }
    }
    val = start | 0;
    length = _floorD(+((stop | 0) - start | 0) / +(step | 0)) | 0;
    if (((length | 0) & 0x80000000) != 0)
    // positive numInts only
    {
      length = 0;
    }
    bytelength = imul(length | 0, 4) | 0;
    byteOffset = _32Malloc(length|0) | 0; 
    while ((pos | 0) < (bytelength | 0)) {
      memInt32[((byteOffset | 0) + pos | 0) >> 2] = val | 0;
      val = (val | 0) + step | 0 | 0;
      pos = (pos | 0) + 4 | 0;
    }
    return byteOffset | 0;
  }
  
f _getLengthTypeless(i: offset) {
  int length;
  length = (memInt32[((offset|0)-4) >> 2])|0;
  return length|0;
}
  
  return {
    _rangeSplitLength: _rangeSplitLength,//fcall
    _rangeSplit: _rangeSplit,//fcall
    _deAllocArr: _deAllocArr,//fcall, fheap
    _deAllocInfoloc : _deAllocInfoloc,//heapview
    _floorD: _floorD,
    _rangeEnvelope: _rangeEnvelope,//heapview, fheap
    _getOffset : _getOffset,//fheap
    _getLength : _getLength,//fheap
    _rangeTypeless : _rangeTypeless,//typeless
    _getLengthTypeless : _getLengthTypeless,//typeless
    _deAllocTypeless : _deAllocTypeless //typeless
  };
};

var l_ = Bench(std);
l_.name = "returningArrays";
l_.bench = [
  //necessary to have dedicated functions 
  //because destructuring for every call can greatly
  //affect performance, and thus comparison.
  ['350 elements',
    ['split', function () {
      l_.rangeSplit(50, 6000, 17);
    }],
    ['heapview', function () {
     l_.rangeHeapview(50, 6000, 17);
    }],
    ['fheap', function() {
      l_.rangeFheap(50,6000,17);
    }],
    ['typeless', function() {
      l_.rangeTypeless(50,6000,17);
    }]]
];
l_.test = {
  'require': "underscore",
  'control': function(start, stop, step) { 
    //like underscores range(), but no arguments length check
    //which allows it to be called generically.
    // also no float support. for simplicity we're demonstrating this with ints.
    if (stop === undefined) {
      stop = start || 0;
      start = 0;
    }
    step = Math.floor(arguments[2]) || 1;
 
    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  },
  'cmp' : 'arrayEq',
  'funcs' : [
      ['split', l_.rangeSplit], 
      ['heapview', l_.rangeHeapview ],
      ['fheap', l_.rangeFheap],
      ['typeless', l_.rangeTypeless ]],
  'testcases': [
      ["no distance", [1,1,1]], //no distance
      ["zero step", [2,3,1]], //0 step
      ["decimal step", [1,12,1.8]],
      ["def.step, rpos. incr.", [1,10]],
      ["def.step, rpos. decr.", [10,1]],
      ["def.step, rneg. decr.", [-1,-10]],
      ["def.step, rneg. incr.", [-10,-1]],
      ["decr. step vs incr.", [1,10,-1]],
      ["incr. step vs decr.", [10,1,1]], 
      [">|1| step", [1,11,2]],
      [">|1| step, miss end", [1,11,2]],
      ["no stop arg", [40]],
      ["up to ~int32 range", [0,2000000,100000]],
      ["up to ~int32 range, 2k elements", [0,2000000,1000]]
    ]
};

return l_  })(this) //end anonymous function

]); //end window.benches.add()

window.benches[window.benches.length-1][0] = window.benches[window.benches.length-1][1].name;
