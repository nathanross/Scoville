
//%BENCH_START%
var heap = new ArrayBuffer(4096 * 4096 * 32);
var l_ = _ASM_Bench(stdlib, {}, heap);
l_._heap = heap;

//%BENCH_ASM_BEGIN%
//%ARRAY_BPLATE%
//%MALLOC%
  
f _memcpyEmsc(i: dest,i: src,i: num) {
  // emcc v 1.10 ubuntu. Same from noOpt -> O3
  int ret;
  ret = dest`;
  if ((dest&3) == (src&3)) {
    while (dest & 3) {
      if ((num`) == 0) return ret`;
      i8[(dest)]=i8[(src)];
      dest = (dest+1)`;
      src = (src+1)`;
      num = (num-1)`;
    }
    while ((num`) >= 4) {
      i32[((dest)>>2)]=i32[((src)>>2)];
      dest = (dest+4)`;
      src = (src+4)`;
      num = (num-4)`;
    }
  }
  while ((num`) > 0) {
    i8[(dest)]=i8[(src)];
    dest = (dest+1)`;
    src = (src+1)`;
    num = (num-1)`;
  }
  return ret|0;
}
  
f _memcpyEmscExp(i: dest,i: src,i: num) {
  // emcc v 1.10 ubuntu. Same from noOpt -> O3
  int ret;
  int diff = 0;
  ret = dest`;
  if (!(dest&3) && !(src&3)) {
    while (dest & 3) { 
      if ((num`) == (diff`)) return ret`;
      i8[((diff`) + (dest`))]=i8[((diff`) + (src`))];
      diff = (diff+1)`;
    }
    while ((diff`) <= ((num`) - 4)) {
      i32[(((diff`) + (dest`))>>2)]=i32[(((diff`) + (src`))>>2)];
      diff = (diff+4)`;
    }
  }
  while ((diff`) < (num`)) {
    i8[((diff`) + (dest`))]=i8[((diff`) + (src`))];
    diff = (diff+1)`;
  }
  return ret|0;
}

f _seti32(i: pos, i: val) {
  i32[((pos`) >> 2)] = val`;
}

f _geti32(i: pos) {
  int result;
  result = i32[((pos`) >> 2)];
  return result`;
}

f _seti8(i: pos, i: val) {
  i8[(pos)] = val`;
}

f _geti8(i: pos) {
  int result;
  result = i8[(pos)];
  return result`;
}

return { 
memcpyEmsc : _memcpyEmsc,
memcpyEmscExp : _memcpyEmscExp,
geti32 : _geti32,
seti32 : _seti32,
geti8 : _geti8,
seti8 : _seti8
};

//%BENCH_ASM_END%

l_.name = "1.x - memcpy";
l_.bench = [
  //necessary to have dedicated functions 
  //because destructuring for every call can greatly
  //affect performance, and thus comparison.
  ['non-overlapping',
    ['impl1', function () {
      l_.memcpyEmsc(5000, 0, 4999);
      l_.memcpyEmsc(20000, 10000, 9999);
      l_.memcpyEmsc(50000, 30000, 19999); 
    }],
    ['impl2', function () {
      l_.memcpyEmscExp(5000, 0, 4999);
      l_.memcpyEmscExp(20000, 10000, 9999);
      l_.memcpyEmscExp(50000, 30000, 19999); 
    }]
  ]
];
l_.test = {
  'control': 1,
  'cmp' : 'Eq',
  'funcs' : [
      ['memcpyEmsc', l_.memcpyEmsc],
      ['memcpyEmscExp', l_.memcpyEmscExp]],
  'testcases': [
      [" src and dest are multiple of 4", 
       function(impl) { 
         l_.seti32(504,0);
         l_.seti32(4,1);
         impl(500, 0, 499);
         return l_.geti32(504);
       }],
      ["only one is multiple of 4", 
       function(impl) { 
         l_.seti8(1503,0);
         l_.seti8(1004,1);
         impl(1499, 1000, 498);
         return l_.geti8(1503);
       }],
      ["src and dest are not multiples of 4",
       function(impl) { 
         l_.seti8(2502,0);
         l_.seti8(2002,1);
         impl(2501, 2001, 498);
         return l_.geti8(2502);
       }] //0 step
    ]
};

//%BENCH_END%
