(function (exports) {
    var Chain = function (parent) {
        var chain = this;

        chain._parent = parent || chain;
        chain._emitter = new EventEmitter();
        chain._size = 0;
        chain._completedCount = 0;

        chain._emitter.on("newListener", function (state, work) {
            if (state === chain._state) {
                work();
            }
        });
    };

    Chain.prototype.states = {
        DONE: "done",
        FAIL: "fail"
    };

    /**
     * Adds a function in the chain.
     * @param  {Function} callback callback function
     * @param  {Array}    args     arguments array
     * @return {Chain}
     */
    Chain.prototype.call = function (callback, args, state) {
        var chain = this,
            subChain = new Chain(chain);

        chain.position = subChain;
        chain._size++;

        chain._emitter.once(state || chain._readyState || Chain.prototype.states.DONE, function (data) {
            subChain.data = data;

            setTimeout(function () {
                callback.apply(subChain, args);
            }, 0);
        });

        return chain;
    };

    /**
     * Adds a function or a new subchain to be 
     * executed after the previous call will be done.
     *
     * @param {function} callback  callback function
     * @param {Array}    args      arguments array
     *
     * @example
     *   .whenDone(foo, argsArray)
     *
     * @example
     *   .whenDone()
     *     .call(foo, argsArray)
     *     .call(foo, argsArray)
     *   .end 
     *
     * @return Chain
     */
    Chain.prototype.when = function (state, callback, args) {
        var subChain;

        if (arguments.length === 3) {
            // single call
            return this.position.call(callback, args, state).end();
        } else {
            // multiple calls
            subChain = this.position;
            subChain._readyState = state;

            return subChain;
        }
    };

    /**
     * Returns parent chain.
     * @return {Chain}
     */
    Chain.prototype.end = function () {
        return this._parent;
    };

    Chain.prototype._set = function (state, data) {
        this._state = state;
        this._parent._completedCount++;
        this._emitter.emit(state, data);

        if (this._parent._completedCount === this._parent._size) {
            this._parent._emitter.emit("allDone");
        }

        return this;
    };

    /**
     * Announces the successful completion of an asynchronous function
     * 
     * @param  {misc}   data data to be sent to success callbacks
     * @return {Chain}
     */
    Chain.prototype.next = Chain.prototype.done = function (data) {
        return this._set(Chain.prototype.states.DONE, data);
    };

    Chain.prototype.fail = function (data) {
        return this._set(Chain.prototype.states.FAIL, data);
    };

    /**
     * Creates a callback block as a single callback that will be
     * successfully completed when all callbacks will be completed.
     *
     * @example
     * .together()
     *    .call(foo1, argsArray)
     *    .call(foo2, argsArray)
     * .end()
     * 
     * @return {Chain} [description]
     */
    Chain.prototype.together = function () {
        var chain = this,
            chainBlock = new Chain(),
            result;

        result = this.call(function () {
            var self = this;

            chainBlock.done()._emitter.on("allDone", function () {
                self.done();
            });
        });

        chainBlock._parent = result;

        return chainBlock;
    };

    exports.chainy = function () {
        return new Chain().done();
    };
}(typeof module === "object" ? module.exports : window));