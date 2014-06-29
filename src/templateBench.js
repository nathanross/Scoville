
//%BENCH_START%
var heap = new ArrayBuffer(4096 * 4096 * 32);
var l_ = _ASM_Bench(stdlib, {}, heap);

l_._heap = heap;
l_.whateverFunc = function() {
  
};
//%BENCH_ASM_BEGIN%
//%ARRAY_BPLATE%
//%MALLOC%

f _someFunc(i: offset) {
  int length;
  length = 40;
  return length`;
}
  
return { 
_someFunc : _someFunc
};

//%BENCH_ASM_END%

l_.name = "returningArrays";
l_.bench = [
  //necessary to have dedicated functions 
  //because destructuring for every call can greatly
  //affect performance, and thus comparison.
  ['benchname',
    ['impl1', function () {
      l_.rangeSplit(50, 6000, 17);
    }],
    ['impl2', function () {
     l_.rangeHeapview(50, 6000, 17);
    }]
  ]
];
l_.test = {
  'control': function(a,b) { 
    return someval;
  },
  'cmp' : 'arrayEq',
  'funcs' : [
      ['impl1', l_.impl1], 
      ['impl2', l_.impl2]
  'testcases': [
      ["some case", [1,1,1]], //no distance
      ["other case", [2,3,1]] //0 step
    ]
};

//%BENCH_END%
