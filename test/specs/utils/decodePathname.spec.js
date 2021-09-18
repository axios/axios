var decodePathname = require('../../../lib/utils').decodePathname;

describe('utils::decodePathname', function () {
  it('OData path should be decode', function () {
    var a = "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People(%27russellwhyte%27)"
    var b = "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')"
    
    expect(decodePathname(a)).toEqual(b);
  });

  it('OData path with quey string, path only should be decoded ', function () {
    var a = "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People(%27russellwhyte%27)?foo=bar"
    var b = "/TripPinRESTierService/(S(djtqmgxgkc3viudbv33lqjxb))/People('russellwhyte')?foo=bar"
    
    expect(decodePathname(a)).toEqual(b);
  });
  
  it('Regular path should stay the same ', function () {
    var a = "/customers/123/orders"
    var b = "/customers/123/orders"
    
    expect(decodePathname(a)).toEqual(b);
  });
  
  it('Regular path with query string should stay the same ', function () {
    var a = "/customers/123/orders?foo=bar"
    var b = "/customers/123/orders?foo=bar"
    
    expect(decodePathname(a)).toEqual(b);
  });
});

