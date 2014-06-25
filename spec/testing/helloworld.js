describe("a suite", function() {
  it("contains spec", function() {
    expect(true).toBe(true);
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
