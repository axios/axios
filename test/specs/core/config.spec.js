var defaults = require('../../../lib/defaults');
var mergeConfig = require('../../../lib/core/mergeConfig');

describe('core::setConfig', function() {
  it('should patch instance config', function(){
    const root = axios.create({
      headers: {
        myHeader1: 'foo',
        myHeader2: 'bar'
      }
    });

    root.setConfig({
      headers: {
        myHeader2: 'baz',
        myHeader3: 'foo'
      }
    });

    expect(root.defaults.headers).toEqual({
      ...defaults.headers,
      myHeader1: 'foo',
      myHeader2: 'baz',
      myHeader3: 'foo'
    });
  });

  describe("setting config of the root axios instance", function (){
    it('should not affect default config object', function(){
      const snapshot= mergeConfig({}, defaults);

      axios.setConfig({
        headers: {
          myHeader: 'baz'
        }
      });

      expect(defaults).toEqual(snapshot);

      delete axios.defaults.headers.myHeader;
    });
  });
});

describe('core::getConfig', function() {
  it('should support getting the config of "static" instances', function(){
    const root = axios.create({
      headers: {
        myHeader1: 'foo',
        myHeader2: 'bar'
      }
    });

    const child = root.create({
      headers: {
        myHeader3: 'def'
      }
    });

    root.setConfig({
      headers: {
        myHeader2: 'baz'
      }
    });

    expect(child.getConfig().headers).toEqual({
      ...defaults.headers,
      myHeader1: 'foo',
      myHeader2: 'bar',
      myHeader3: 'def'
    });
  });

  it('should support getting the config of "live" instances', function(){
    const root = axios.create({
      headers: {
        myHeader1: 'foo',
        myHeader2: 'bar'
      }
    });

    const child = root.create({
      headers: {
        myHeader3: 'def'
      }
    }, true);

    root.setConfig({
      headers: {
        myHeader2: 'baz'
      }
    });

    expect(child.getConfig().headers).toEqual({
      ...defaults.headers,
      myHeader1: 'foo',
      myHeader2: 'baz',
      myHeader3: 'def'
    });
  });
});
