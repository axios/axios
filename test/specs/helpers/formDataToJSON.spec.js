import formDataToJSON from '../../../lib/helpers/formDataToJSON';

describe('formDataToJSON', function () {
  it('should convert a FormData Object to JSON Object', function () {
    const formData = new FormData();

    formData.append('foo[bar][baz]', '123');

    expect(formDataToJSON(formData)).toEqual({
      foo: {
        bar: {
          baz: '123',
        },
      },
    });
  });

  it('should convert repeatable values as an array', function () {
    const formData = new FormData();

    formData.append('foo', '1');
    formData.append('foo', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should convert props with empty brackets to arrays', function () {
    const formData = new FormData();

    formData.append('foo[]', '1');
    formData.append('foo[]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should supported indexed arrays', function () {
    const formData = new FormData();

    formData.append('foo[0]', '1');
    formData.append('foo[1]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
    });
  });

  it('should resist prototype pollution CVE', () => {
    const formData = new FormData();

    formData.append('foo[0]', '1');
    formData.append('foo[1]', '2');
    formData.append('__proto__.x', 'hack');
    formData.append('constructor.prototype.y', 'value');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2'],
      constructor: {
        prototype: {
          y: 'value',
        },
      },
    });

    expect({}.x).toEqual(undefined);
    expect({}.y).toEqual(undefined);
  });

  it('should not traverse inherited properties when building paths', () => {
    const formData = new FormData();

    formData.append('constructor.prototype.polluted', 'true');
    formData.append('safe', 'data');

    const result = formDataToJSON(formData);

    // constructor.prototype.polluted should be stored as data, not pollute Object.prototype
    expect(result.safe).toEqual('data');
    expect(result.constructor.prototype.polluted).toEqual('true');
    expect({}.polluted).toEqual(undefined);
    expect(Object.prototype.polluted).toEqual(undefined);
  });
});
