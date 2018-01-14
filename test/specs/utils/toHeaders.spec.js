var toHeaders = require('../../../lib/utils').toHeaders;

describe('utils::toHeaders', function () {
  beforeEach(function () {
    this.headers = toHeaders({
      headerA: 'valueA',
      headerB: 'valueB'
    });
  });

  it('should transform JS hash to headers object', function () {
    expect(this.headers.has('headerA')).toBeTruthy();
    expect(this.headers.has('headerB')).toBeTruthy();
  });

  it('should ignore header name case', function () {
    expect(this.headers.has('HEADERa')).toBeTruthy();
  });

  it('should support basic operations', function () {
    expect(this.headers.has('header')).toBeFalsy();

    this.headers.set('header', 'value');
    expect(this.headers.has('header')).toBeTruthy();
    expect(this.headers.get('header')).toBe('value');
    expect(this.headers.toJson()).toEqual(jasmine.objectContaining({
      header: 'value'
    }));

    this.headers.unset('header', 'value');
    expect(this.headers.has('header')).toBeFalsy();
  });

  it('should use case from first header set', function () {
    this.headers.set('HEader', 'value');
    this.headers.set('header', 'new value');
    expect(this.headers.toJson()).toEqual(jasmine.objectContaining({
      HEader: 'new value'
    }));

    this.headers.unset('HEADER');
    this.headers.set('header', 'value');
    this.headers.set('HEader', 'new value');
    expect(this.headers.toJson()).toEqual(jasmine.objectContaining({
      header: 'new value'
    }));
  });
});
