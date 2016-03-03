'use strict';

describe('Filter: tel', function () {

  // load the filter's module
  beforeEach(module('localResourcesApp'));

  // initialize a new instance of the filter before each test
  var tel;
  beforeEach(inject(function ($filter) {
    tel = $filter('tel');
  }));

  it('should return the input prefixed with "tel filter:"', function () {
    var text = 'angularjs';
    expect(tel(text)).toBe('tel filter: ' + text);
  });

});
