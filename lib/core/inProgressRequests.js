'use strict';

/**
 * An small api to handle in progress requests
 */

var inProgressRequests = {};
module.exports = {
    getRequest: function(requestId) {
        if (!requestId) {
            return;
        }
        return inProgressRequests[requestId];
    },
    queueRequest: function(requestId, request) {
        if (!requestId || !request) {
            return;
        }
        inProgressRequests[requestId] = request;
    },
    removeRequest: function(requestId) {
        if (!requestId) {
            return;
        }
        inProgressRequests[requestId] = null;
    },
    abortRequest: function(requestId) {
        if (!requestId) {
            return;
        }
        var inProgressRequest = inProgressRequests[requestId];
        if (inProgressRequest) {
            inProgressRequest.abort();
            this.removeRequest(requestId);
        }
    }
};