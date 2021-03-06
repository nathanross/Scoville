

var cmp = {};
cmp.Eq = function(a, b) {
  return a === b;
};
cmp.arrayEq = function(a, b) {
  var maxLength = Math.max(a.length,b.length);
  for (var i=0;i<maxLength;i++) {
    if (i==a.length || i==b.length ||
        (!(a[i] === b[i]))) { 
      return false; }
  }
  return true;
};

var deStructure = function(func, args) {
  switch(args.length) {
    case 0: 
      return func();
    case 1: 
      return func(args[0]);
    case 2: 
      return func(args[0],args[1]); 
    case 3: 
      return func(args[0],args[1],args[2]); 
    case 4:
      return func(args[0],args[1],args[2],args[3]); 
  }
};

function testBench(bench) {  
  var test = bench.test;
  var c,i;
  var makeCond = function(cmpfunc, ctrl, func, args) {
    var r = function() {
      expect(
        cmpfunc(
          ctrl,
          (typeof(args) == "function")? args(func) : deStructure(func, args)
        )
      ).toBe(true);
    };
    return r;
  };
  ctrlvals = {};

  for (c=0; c<test.testcases.length; c++) {
    ctrlvals[c] = (typeof(test.control) == "function")? 
      deStructure(test.control, test.testcases[c][1]) : test.control;
  }
  for (i=0; i<test.funcs.length; i++) {
    describe(test.funcs[i][0], function(){
      for (c=0; c<test.testcases.length; c++) {
        it("matches control: " + test.testcases[c][0], 
          makeCond(cmp[test.cmp], ctrlvals[c], 
                     test.funcs[i][1], test.testcases[c][1]));
      }
    });
  }  
};

loopOverBenches = function(benchSet) {
  var names = [];
  var indexes = {};
  for (var i=0;i<benchSet.length;i++) {
    indexes[benchSet[i][0]] = i;
    names.push(benchSet[i][0]);
  }
  names.sort();
  for (var i=0;i<names.length;i++) {
    testBench(benchSet[indexes[names[i]]][1]);
  }
};

if (!(window.benches === undefined)) {
  loopOverBenches(window.benches);
}
