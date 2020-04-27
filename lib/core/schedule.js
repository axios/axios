
var CancelToken = require('../cancel/CancelToken')
var filter = function (item) {
    return true
}
module.exports = {
    cancelText: "CANCELED",
    pending: [],
    getKey: function (config) {
        return config.url + "&" + config.method
    },
    add: function (config) {
        !config.allowDuplicate && this.removePending(config)
        var self = this
        config.cancelToken = new CancelToken(function (c) {
            self.pending.push({
                key: self.getKey(config),
                cancel: c,
                config
            })
        })
    },
    removePending: function (config) {
        const k = typeof config === "string" ? config : this.getKey(config)
        var index = this.pending.findIndex(item => item.key === k)
        if (index > -1) {
            this.pending[index].cancel(this.cancelText)
            this.pending.splice(index, 1)
            delete config.cancelToken
        }
    },
    abort: function (f) {
        this.removePending(f.key)
    },
    removeAll: function (f) {
        f = f || filter;
        this.pending.filter(item => f(item.config)).forEach(item => this.removePending(item.config));
    }
}
