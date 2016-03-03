'use strict';

describe('Directive: cartoList', function () {

  // load the directive's module
  beforeEach(module('localResourcesApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<carto-list></carto-list>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the cartoList directive');
  }));
});
