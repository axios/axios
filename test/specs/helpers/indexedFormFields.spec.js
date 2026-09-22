var toFormData = require('../../../lib/helpers/toFormData');
var formDataToJSON = require('../../../lib/helpers/formDataToJSON');

describe('indexed multipart fields', function() {
  it('unwraps hidden indexes without modern Number methods', function() {
    var methods = ['isSafeInteger', 'isInteger', 'isFinite'];
    var descriptors = {};
    var values = {length: 2};
    Object.defineProperties(values, {
      0: {value: 'first'},
      1: {value: 'second'}
    });
    var form;
    try {
      methods.forEach(function(name) {
        descriptors[name] = Object.getOwnPropertyDescriptor(Number, name);
        Number[name] = undefined;
      });
      form = toFormData({'items[]': values}, new FormData());
    } finally {
      methods.forEach(function(name) {
        if (descriptors[name]) {
          Object.defineProperty(Number, name, descriptors[name]);
        } else {
          delete Number[name];
        }
      });
    }
    expect(form.getAll('items[]')).toEqual(['first', 'second']);
  });

  it('unwraps hidden indexes across a null-prototype chain', function() {
    var terminal = Object.create(null);
    Object.defineProperty(terminal, '2', {value: 'third'});
    var middle = Object.create(terminal);
    Object.defineProperty(middle, '1', {value: 'second'});
    var values = Object.create(middle);
    values[0] = 'first';
    values.length = 3;

    var form = toFormData({'items[]': values}, new FormData());
    expect(form.getAll('items[]')).toEqual(['first', 'second', 'third']);
  });

  it('keeps unrelated fields instead of treating them as indexes', function() {
    var form = toFormData({'items[]': {length: 1, label: 'x'}}, new FormData());
    expect(form.get('items[length]')).toBe('1');
    expect(form.get('items[label]')).toBe('x');
    expect(form.has('items[]')).toBe(false);
  });

  it('preserves noncanonical numeric JSON keys', function() {
    var form = new FormData();
    form.append('items[1]', 'second');
    form.append('items[01]', 'named');
    form.append('large[4294967295]', 'value');

    expect(JSON.parse(JSON.stringify(formDataToJSON(form)))).toEqual({
      items: {1: 'second', '01': 'named'},
      large: {'4294967295': 'value'}
    });
  });
});
