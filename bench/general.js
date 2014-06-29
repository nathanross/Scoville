

function runBench(bench) {  
  var cases = bench.bench;
  var c,i;
  for (c=0; c<cases.length; c++) {
    suite(cases[i][0], function(){
      for (i=0; i<cases[c][1].length; i++) {
        impl = cases[c][1][i];
        benchmark(impl[0], impl[1]); 
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
    runBench(benchSet[indexes[names[i]]][1]);
  }
};

if (!(window.benches === undefined)) {
  loopOverBenches(window.benches);
}
