var utils = require('../../../lib/utils');
var defaults = require('../../../lib/defaults');
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

  it('unwraps native FileList values through direct and default multipart serialization', function() {
    if (typeof DataTransfer !== 'function' || typeof File !== 'function') {
      pending('Populating a FileList requires DataTransfer and File constructors');
      return;
    }
    var transfer = new DataTransfer();
    transfer.items.add(new File(['one'], 'first.txt', {type: 'text/plain'}));
    transfer.items.add(new File(['two!'], 'second.txt', {type: 'text/plain'}));
    var files = transfer.files;

    expect(utils.toArray(files)).toEqual([files[0], files[1]]);
    var form = toFormData({attachments: files}, new FormData());
    var attachments = form.getAll('attachments[]');
    expect(attachments.length).toBe(2);
    expect(attachments[0].name).toBe('first.txt');
    expect(attachments[0].size).toBe(3);
    expect(attachments[1].name).toBe('second.txt');
    expect(attachments[1].size).toBe(4);

    var transformed = defaults.transformRequest[0].call({env: {FormData: FormData}}, files, {});
    var uploads = transformed.getAll('files[]');
    expect(uploads.length).toBe(2);
    expect(uploads[0].name).toBe('first.txt');
    expect(uploads[1].name).toBe('second.txt');
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
