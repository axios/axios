import assert from 'assert';
import utils from '../../../lib/utils.js';
import parseProtocol from '../../../lib/helpers/parseProtocol.js';

describe('helpers::parseProtocol', function () {
  it('should parse protocol part if it exists', function () {
    utils.forEach({
      'http://username:password@example.com/': 'http',
      'ftp:google.com': 'ftp',
      'sms:+15105550101?body=hello%20there': 'sms',
      'tel:0123456789' : 'tel',
      '//google.com': '',
      'google.com': '',
      'admin://etc/default/grub' : 'admin',
      'stratum+tcp://server:port': 'stratum+tcp',
      '/api/resource:customVerb': '',
      'https://stackoverflow.com/questions/': 'https',
      'mailto:jsmith@example.com' : 'mailto',
      'chrome-extension://1234/<pageName>.html' : 'chrome-extension'
    }, (expectedProtocol, url) => {
      assert.strictEqual(parseProtocol(url), expectedProtocol);
    });
  });
});
