var Chain = function (parent, state) {
    var self = this;

    self._state = state || self._states.PROCESS;

    self._stateData = [];
    self._emitter = new EventEmitter();
    self._parent = parent;

    self._emitter.on("newListener", function (type, listener) {
        if (self._state === type) {
            listener.apply(self.stateData);
        }
    });
};

Chain.prototype._states = {
    PROCESS: "process",
    DONE:    "done",
    FAIL:    "fail" 
};

Chain.prototype._set = function (state, result) {
    this._state = state;
    this._emitter.emit(state, result);
};

Chain.prototype.do = function (callback, args) {
    var chain = new Chain(this);

    callback.apply(chain, args);
    return chain;
};

Chain.prototype.then = function (callback, args) {
    var chain = new Chain(this);

    this._emitter.on(this._states.DONE, function (result) {
        chain.result = result;
        callback.apply(chain, args);
    });

    return chain;
};

Chain.prototype.and = function () {
    if (this._parent) {
        return this._parent.then.apply(this._parent, arguments);
    }
};

Chain.prototype.end = function () {
    if (this._parent) {
        return this._parent;
    }
};

Chain.prototype.fail = function (result) {
    this._set(this._states.FAIL, result);
};

Chain.prototype.done = Chain.prototype.next = function (result) {
    this._set(this._states.DONE, result);
};

var chain = function () {
    return new Chain(null, Chain.prototype._states.DONE);
};

var foo = function (num) {
    var chain = this;

    setTimeout(function () {
        var result = num + (chain.result || 0);
        console.log(num, result);
        chain.next(result);
    }, 1000);
};


chain()
    .do(foo, [1])
        .then(foo, [2])
        .end()
    .and(foo, [3]);