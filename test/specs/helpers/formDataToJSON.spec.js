import formDataToJSON from '../../../lib/helpers/formDataToJSON';

describe('formDataToJSON', function () {
  it('should convert a FormData Object to JSON Object', function () {
    const formData = new FormData();

    formData.append('foo[bar][baz]', '123');

    expect(formDataToJSON(formData)).toEqual({
      foo: {
        bar: {
          baz: '123'
        }
      }
    });
  });

  it('should convert repeatable values as an array', function () {
    const formData = new FormData();

    formData.append('foo', '1');
    formData.append('foo', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2']
    });
  });

  it('should convert props with empty brackets to arrays', function () {
    const formData = new FormData();

    formData.append('foo[]', '1');
    formData.append('foo[]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2']
    });
  });

  it('should supported indexed arrays', function () {
    const formData = new FormData();

    formData.append('foo[0]', '1');
    formData.append('foo[1]', '2');

    expect(formDataToJSON(formData)).toEqual({
      foo: ['1', '2']
    });
  });
});
