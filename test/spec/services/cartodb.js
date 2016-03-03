'use strict';

describe('Service: cartoDB', function () {

  // load the service's module
  beforeEach(module('localResourcesApp'));

  // instantiate service
  var cartoDB;
  beforeEach(inject(function (_cartoDB_) {
    cartoDB = _cartoDB_;
  }));

  it('should do something', function () {
    expect(!!cartoDB).toBe(true);
  });

});
