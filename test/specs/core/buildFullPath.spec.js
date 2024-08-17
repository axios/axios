import buildFullPath from '../../../lib/core/buildFullPath';

describe('helpers::buildFullPath', function () {
  it('should combine URLs when the requestedURL is relative', function () {
    expect(buildFullPath('https://api.github.com', '/users')).toBe('https://api.github.com/users');
  });

  it('should return the requestedURL when it is absolute', function () {
    expect(buildFullPath('https://api.github.com', 'https://api.example.com/users')).toBe('https://api.example.com/users');
  });

  it('should not combine URLs when the baseURL is not configured', function () {
    expect(buildFullPath(undefined, '/users')).toBe('/users');
  });

  it('should combine URLs when the baseURL and requestedURL are relative', function () {
    expect(buildFullPath('/api', '/users')).toBe('/api/users');
  });

});
