// noinspection DuplicatedCode

import { axios, expect } from "#testing";

describe('static api', function () {
    it('should have request method helpers', function () {
        expect(typeof axios.request).to.equal('function');
        expect(typeof axios.get).to.equal('function');
        expect(typeof axios.head).to.equal('function');
        expect(typeof axios.options).to.equal('function');
        expect(typeof axios.delete).to.equal('function');
        expect(typeof axios.post).to.equal('function');
        expect(typeof axios.put).to.equal('function');
        expect(typeof axios.patch).to.equal('function');
    });

    it('should have promise method helpers', function () {
        const promise = axios('/test');

        expect(typeof promise.then).to.equal('function');
        expect(typeof promise.catch).to.equal('function');
    });

    it('should have defaults', function () {
        expect(typeof axios.defaults).to.equal('object');
        expect(typeof axios.defaults.headers).to.equal('object');
    });

    it('should have interceptors', function () {
        expect(typeof axios.interceptors.request).to.equal('object');
        expect(typeof axios.interceptors.response).to.equal('object');
    });

    it('should have all/spread helpers', function () {
        expect(typeof axios.all).to.equal('function');
        expect(typeof axios.spread).to.equal('function');
    });

    it('should have factory method', function () {
        expect(typeof axios.create).to.equal('function');
    });

    it('should have CanceledError, CancelToken, and isCancel properties', function () {
        expect(typeof axios.Cancel).to.equal('function');
        expect(typeof axios.CancelToken).to.equal('function');
        expect(typeof axios.isCancel).to.equal('function');
    });

    it('should have getUri method', function() {
        expect(typeof axios.getUri).to.equal('function');
    });

    it('should have isAxiosError properties', function () {
        expect(typeof axios.isAxiosError).to.equal('function');
    });

    it('should have mergeConfig properties', function () {
        expect(typeof axios.mergeConfig).to.equal('function');
    });
});

describe('instance api', function () {
    const instance = axios.create();

    it('should have request methods', function () {
        expect(typeof instance.request).to.equal('function');
        expect(typeof instance.get).to.equal('function');
        expect(typeof instance.options).to.equal('function');
        expect(typeof instance.head).to.equal('function');
        expect(typeof instance.delete).to.equal('function');
        expect(typeof instance.post).to.equal('function');
        expect(typeof instance.put).to.equal('function');
        expect(typeof instance.patch).to.equal('function');
    });

    it('should have interceptors', function () {
        expect(typeof instance.interceptors.request).to.equal('object');
        expect(typeof instance.interceptors.response).to.equal('object');
    });
});
