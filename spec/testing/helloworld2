define(["gen/spec/2.2.returningArrays"],function(l) {

describe("a suite", function() {
  it("contains spec", function() {
    expect(l.inst).toBeDefined();
  });
});


for (var i=4;i>=0;i--) {
  describe("a suite of i " + i.toString(), function() {
    for (var j=0;j<3;j++) {
      var multipack = function(a,b) {
        return function() { 
          expect((a*b) <4).toBe(true);
        }
      }
      it("i " + i.toString() + " * j (" + j.toString() + ") < 4", multipack(i,j));
    }
  });
} 

});
