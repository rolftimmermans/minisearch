(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MiniSearch = factory());
})(this, (function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    /** @ignore */
    var ENTRIES = 'ENTRIES';
    /** @ignore */
    var KEYS = 'KEYS';
    /** @ignore */
    var VALUES = 'VALUES';
    /** @ignore */
    var LEAF = '';
    /**
     * @private
     */
    var TreeIterator = /** @class */ (function () {
        function TreeIterator(set, type) {
            var node = set._tree;
            var keys = Array.from(node.keys());
            this.set = set;
            this._type = type;
            this._path = keys.length > 0 ? [{ node: node, keys: keys }] : [];
        }
        TreeIterator.prototype.next = function () {
            var value = this.dive();
            this.backtrack();
            return value;
        };
        TreeIterator.prototype.dive = function () {
            if (this._path.length === 0) {
                return { done: true, value: undefined };
            }
            var _a = last$1(this._path), node = _a.node, keys = _a.keys;
            if (last$1(keys) === LEAF) {
                return { done: false, value: this.result() };
            }
            this._path.push({ node: node.get(last$1(keys)), keys: Array.from(node.get(last$1(keys)).keys()) });
            return this.dive();
        };
        TreeIterator.prototype.backtrack = function () {
            if (this._path.length === 0) {
                return;
            }
            last$1(this._path).keys.pop();
            if (last$1(this._path).keys.length > 0) {
                return;
            }
            this._path.pop();
            this.backtrack();
        };
        TreeIterator.prototype.key = function () {
            return this.set._prefix + this._path
                .map(function (_a) {
                var keys = _a.keys;
                return last$1(keys);
            })
                .filter(function (key) { return key !== LEAF; })
                .join('');
        };
        TreeIterator.prototype.value = function () {
            return last$1(this._path).node.get(LEAF);
        };
        TreeIterator.prototype.result = function () {
            if (this._type === VALUES) {
                return this.value();
            }
            if (this._type === KEYS) {
                return this.key();
            }
            return [this.key(), this.value()];
        };
        TreeIterator.prototype[Symbol.iterator] = function () {
            return this;
        };
        return TreeIterator;
    }());
    var last$1 = function (array) {
        return array[array.length - 1];
    };

    var NONE = 0;
    var CHANGE = 1;
    var ADD = 2;
    var DELETE = 3;
    /**
     * @ignore
     */
    var fuzzySearch = function (node, query, maxDistance) {
        var stack = [{ distance: 0, i: 0, key: '', node: node }];
        var results = {};
        var innerStack = [];
        var _loop_1 = function () {
            var e_1, _a;
            var _b = stack.pop(), node_1 = _b.node, distance = _b.distance, key = _b.key, i = _b.i, edit = _b.edit;
            var _loop_2 = function (k) {
                if (k === LEAF) {
                    var totDistance = distance + (query.length - i);
                    var _e = __read(results[key] || [null, Infinity], 2), d = _e[1];
                    if (totDistance <= maxDistance && totDistance < d) {
                        results[key] = [node_1.get(k), totDistance];
                    }
                }
                else {
                    withinDistance(query, k, maxDistance - distance, i, edit, innerStack).forEach(function (_a) {
                        var d = _a.distance, i = _a.i, edit = _a.edit;
                        stack.push({ node: node_1.get(k), distance: distance + d, key: key + k, i: i, edit: edit });
                    });
                }
            };
            try {
                for (var _c = (e_1 = void 0, __values(node_1.keys())), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var k = _d.value;
                    _loop_2(k);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        while (stack.length > 0) {
            _loop_1();
        }
        return results;
    };
    /**
     * @ignore
     */
    var withinDistance = function (a, b, maxDistance, i, edit, stack) {
        stack.push({ distance: 0, ia: i, ib: 0, edit: edit });
        var results = [];
        while (stack.length > 0) {
            var _a = stack.pop(), distance = _a.distance, ia = _a.ia, ib = _a.ib, edit_1 = _a.edit;
            if (ib === b.length) {
                results.push({ distance: distance, i: ia, edit: edit_1 });
                continue;
            }
            if (a[ia] === b[ib]) {
                stack.push({ distance: distance, ia: ia + 1, ib: ib + 1, edit: NONE });
            }
            else {
                if (distance >= maxDistance) {
                    continue;
                }
                if (edit_1 !== ADD) {
                    stack.push({ distance: distance + 1, ia: ia, ib: ib + 1, edit: DELETE });
                }
                if (ia < a.length) {
                    if (edit_1 !== DELETE) {
                        stack.push({ distance: distance + 1, ia: ia + 1, ib: ib, edit: ADD });
                    }
                    if (edit_1 !== DELETE && edit_1 !== ADD) {
                        stack.push({ distance: distance + 1, ia: ia + 1, ib: ib + 1, edit: CHANGE });
                    }
                }
            }
        }
        return results;
    };

    /**
     * A class implementing the same interface as a standard JavaScript
     * [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
     * with string keys, but adding support for efficiently searching entries with
     * prefix or fuzzy search. This class is used internally by [[MiniSearch]] as
     * the inverted index data structure. The implementation is a radix tree
     * (compressed prefix tree).
     *
     * Since this class can be of general utility beyond _MiniSearch_, it is
     * exported by the `minisearch` package and can be imported (or required) as
     * `minisearch/SearchableMap`.
     *
     * @typeParam T  The type of the values stored in the map.
     */
    var SearchableMap = /** @class */ (function () {
        /**
         * The constructor is normally called without arguments, creating an empty
         * map. In order to create a [[SearchableMap]] from an iterable or from an
         * object, check [[SearchableMap.from]] and [[SearchableMap.fromObject]].
         *
         * The constructor arguments are for internal use, when creating derived
         * mutable views of a map at a prefix.
         */
        function SearchableMap(tree, prefix) {
            if (tree === void 0) { tree = new Map(); }
            if (prefix === void 0) { prefix = ''; }
            this._size = undefined;
            this._tree = tree;
            this._prefix = prefix;
        }
        /**
         * Creates and returns a mutable view of this [[SearchableMap]], containing only
         * entries that share the given prefix.
         *
         * ### Usage:
         *
         * ```javascript
         * let map = new SearchableMap()
         * map.set("unicorn", 1)
         * map.set("universe", 2)
         * map.set("university", 3)
         * map.set("unique", 4)
         * map.set("hello", 5)
         *
         * let uni = map.atPrefix("uni")
         * uni.get("unique") // => 4
         * uni.get("unicorn") // => 1
         * uni.get("hello") // => undefined
         *
         * let univer = map.atPrefix("univer")
         * univer.get("unique") // => undefined
         * univer.get("universe") // => 2
         * univer.get("university") // => 3
         * ```
         *
         * @param prefix  The prefix
         * @return A [[SearchableMap]] representing a mutable view of the original Map at the given prefix
         */
        SearchableMap.prototype.atPrefix = function (prefix) {
            var e_1, _a;
            if (!prefix.startsWith(this._prefix)) {
                throw new Error('Mismatched prefix');
            }
            var _b = __read(trackDown(this._tree, prefix.slice(this._prefix.length)), 2), node = _b[0], path = _b[1];
            if (node === undefined) {
                var _c = __read(last(path), 2), parentNode = _c[0], key = _c[1];
                try {
                    for (var _d = __values(parentNode.keys()), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var k = _e.value;
                        if (k !== LEAF && k.startsWith(key)) {
                            var node_1 = new Map();
                            node_1.set(k.slice(key.length), parentNode.get(k));
                            return new SearchableMap(node_1, prefix);
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            return new SearchableMap(node, prefix);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/clear
         */
        SearchableMap.prototype.clear = function () {
            this._size = undefined;
            this._tree.clear();
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/delete
         * @param key  Key to delete
         */
        SearchableMap.prototype.delete = function (key) {
            this._size = undefined;
            return remove(this._tree, key);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries
         * @return An iterator iterating through `[key, value]` entries.
         */
        SearchableMap.prototype.entries = function () {
            return new TreeIterator(this, ENTRIES);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach
         * @param fn  Iteration function
         * @deprecated Use a `for (... of ...)` loop instead.
         */
        SearchableMap.prototype.forEach = function (fn) {
            var e_2, _a;
            try {
                for (var _b = __values(this), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                    fn(key, value, this);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        /**
         * Returns a key-value object of all the entries that have a key within the
         * given edit distance from the search key. The keys of the returned object are
         * the matching keys, while the values are two-elements arrays where the first
         * element is the value associated to the key, and the second is the edit
         * distance of the key to the search key.
         *
         * ### Usage:
         *
         * ```javascript
         * let map = new SearchableMap()
         * map.set('hello', 'world')
         * map.set('hell', 'yeah')
         * map.set('ciao', 'mondo')
         *
         * // Get all entries that match the key 'hallo' with a maximum edit distance of 2
         * map.fuzzyGet('hallo', 2)
         * // => { "hello": ["world", 1], "hell": ["yeah", 2] }
         *
         * // In the example, the "hello" key has value "world" and edit distance of 1
         * // (change "e" to "a"), the key "hell" has value "yeah" and edit distance of 2
         * // (change "e" to "a", delete "o")
         * ```
         *
         * @param key  The search key
         * @param maxEditDistance  The maximum edit distance (Levenshtein)
         * @return A key-value object of the matching keys to their value and edit distance
         */
        SearchableMap.prototype.fuzzyGet = function (key, maxEditDistance) {
            return fuzzySearch(this._tree, key, maxEditDistance);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get
         * @param key  Key to get
         * @return Value associated to the key, or `undefined` if the key is not
         * found.
         */
        SearchableMap.prototype.get = function (key) {
            var node = lookup(this._tree, key);
            return node !== undefined ? node.get(LEAF) : undefined;
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has
         * @param key  Key
         * @return True if the key is in the map, false otherwise
         */
        SearchableMap.prototype.has = function (key) {
            var node = lookup(this._tree, key);
            return node !== undefined && node.has(LEAF);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys
         * @return An `Iterable` iterating through keys
         */
        SearchableMap.prototype.keys = function () {
            return new TreeIterator(this, KEYS);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/set
         * @param key  Key to set
         * @param value  Value to associate to the key
         * @return The [[SearchableMap]] itself, to allow chaining
         */
        SearchableMap.prototype.set = function (key, value) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            node.set(LEAF, value);
            return this;
        };
        Object.defineProperty(SearchableMap.prototype, "size", {
            /**
             * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/size
             */
            get: function () {
                if (this._size) {
                    return this._size;
                }
                /** @ignore */
                this._size = 0;
                var iter = this.entries();
                while (!iter.next().done)
                    this._size += 1;
                return this._size;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Updates the value at the given key using the provided function. The function
         * is called with the current value at the key, and its return value is used as
         * the new value to be set.
         *
         * ### Example:
         *
         * ```javascript
         * // Increment the current value by one
         * searchableMap.update('somekey', (currentValue) => currentValue == null ? 0 : currentValue + 1)
         * ```
         *
         * @param key  The key to update
         * @param fn  The function used to compute the new value from the current one
         * @return The [[SearchableMap]] itself, to allow chaining
         */
        SearchableMap.prototype.update = function (key, fn) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            node.set(LEAF, fn(node.get(LEAF)));
            return this;
        };
        /**
         * Fetches the value of the given key. If the value does not exist, calls the
         * given function to create a new value, which is inserted at the given key
         * and subsequently returned.
         *
         * ### Example:
         *
         * ```javascript
         * const map = searchableMap.fetch('somekey', () => new Map())
         * map.set('foo', 'bar')
         * ```
         *
         * @param key  The key to update
         * @param defaultValue  A function that creates a new value if the key does not exist
         * @return The existing or new value at the given key
         */
        SearchableMap.prototype.fetch = function (key, initial) {
            if (typeof key !== 'string') {
                throw new Error('key must be a string');
            }
            this._size = undefined;
            var node = createPath(this._tree, key);
            var value = node.get(LEAF);
            if (value === undefined) {
                node.set(LEAF, value = initial());
            }
            return value;
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values
         * @return An `Iterable` iterating through values.
         */
        SearchableMap.prototype.values = function () {
            return new TreeIterator(this, VALUES);
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/@@iterator
         */
        SearchableMap.prototype[Symbol.iterator] = function () {
            return this.entries();
        };
        /**
         * Creates a [[SearchableMap]] from an `Iterable` of entries
         *
         * @param entries  Entries to be inserted in the [[SearchableMap]]
         * @return A new [[SearchableMap]] with the given entries
         */
        SearchableMap.from = function (entries) {
            var e_3, _a;
            var tree = new SearchableMap();
            try {
                for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                    var _b = __read(entries_1_1.value, 2), key = _b[0], value = _b[1];
                    tree.set(key, value);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return tree;
        };
        /**
         * Creates a [[SearchableMap]] from the iterable properties of a JavaScript object
         *
         * @param object  Object of entries for the [[SearchableMap]]
         * @return A new [[SearchableMap]] with the given entries
         */
        SearchableMap.fromObject = function (object) {
            return SearchableMap.from(Object.entries(object));
        };
        return SearchableMap;
    }());
    var trackDown = function (tree, key, path) {
        var e_4, _a;
        if (path === void 0) { path = []; }
        if (key.length === 0 || tree == null) {
            return [tree, path];
        }
        try {
            for (var _b = __values(tree.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (k !== LEAF && key.startsWith(k)) {
                    path.push([tree, k]); // performance: update in place
                    return trackDown(tree.get(k), key.slice(k.length), path);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        path.push([tree, key]); // performance: update in place
        return trackDown(undefined, '', path);
    };
    var lookup = function (tree, key) {
        var e_5, _a;
        if (key.length === 0 || tree == null) {
            return tree;
        }
        try {
            for (var _b = __values(tree.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var k = _c.value;
                if (k !== LEAF && key.startsWith(k)) {
                    return lookup(tree.get(k), key.slice(k.length));
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    var createPath = function (tree, key) {
        var e_6, _a, e_7, _b;
        if (key.length === 0 || tree == null) {
            return tree;
        }
        try {
            for (var _c = __values(tree.keys()), _d = _c.next(); !_d.done; _d = _c.next()) {
                var k = _d.value;
                if (k !== LEAF && key.startsWith(k)) {
                    return createPath(tree.get(k), key.slice(k.length));
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_6) throw e_6.error; }
        }
        try {
            for (var _e = __values(tree.keys()), _f = _e.next(); !_f.done; _f = _e.next()) {
                var k = _f.value;
                if (k !== LEAF && k.startsWith(key[0])) {
                    var offset = commonPrefixOffset(key, k);
                    var node_2 = new Map();
                    node_2.set(k.slice(offset), tree.get(k));
                    tree.set(key.slice(0, offset), node_2);
                    tree.delete(k);
                    return createPath(node_2, key.slice(offset));
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
            }
            finally { if (e_7) throw e_7.error; }
        }
        var node = new Map();
        tree.set(key, node);
        return node;
    };
    var commonPrefixOffset = function (a, b) {
        var length = Math.min(a.length, b.length);
        for (var i = 0; i < length; i++) {
            if (a[i] !== b[i])
                return i;
        }
        return length;
    };
    var remove = function (tree, key) {
        var _a = __read(trackDown(tree, key), 2), node = _a[0], path = _a[1];
        if (node === undefined) {
            return;
        }
        node.delete(LEAF);
        if (node.size === 0) {
            cleanup(path);
        }
        else if (node.size === 1) {
            var _b = __read(node.entries().next().value, 2), key_1 = _b[0], value = _b[1];
            merge(path, key_1, value);
        }
    };
    var cleanup = function (path) {
        if (path.length === 0) {
            return;
        }
        var _a = __read(last(path), 2), node = _a[0], key = _a[1];
        node.delete(key);
        if (node.size === 0) {
            cleanup(path.slice(0, -1));
        }
        else if (node.size === 1) {
            var _b = __read(node.entries().next().value, 2), key_2 = _b[0], value = _b[1];
            if (key_2 !== LEAF) {
                merge(path.slice(0, -1), key_2, value);
            }
        }
    };
    var merge = function (path, key, value) {
        if (path.length === 0) {
            return;
        }
        var _a = __read(last(path), 2), node = _a[0], nodeKey = _a[1];
        node.set(nodeKey + key, value);
        node.delete(nodeKey);
    };
    var last = function (array) {
        return array[array.length - 1];
    };

    return SearchableMap;

}));
//# sourceMappingURL=SearchableMap.js.map
