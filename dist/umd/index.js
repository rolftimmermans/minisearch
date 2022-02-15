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

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

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

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
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

    var _a;
    var OR = 'or';
    var AND = 'and';
    var AND_NOT = 'and_not';
    /**
     * [[MiniSearch]] is the main entrypoint class, implementing a full-text search
     * engine in memory.
     *
     * @typeParam T  The type of the documents being indexed.
     *
     * ### Basic example:
     *
     * ```javascript
     * const documents = [
     *   {
     *     id: 1,
     *     title: 'Moby Dick',
     *     text: 'Call me Ishmael. Some years ago...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 2,
     *     title: 'Zen and the Art of Motorcycle Maintenance',
     *     text: 'I can see by my watch...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 3,
     *     title: 'Neuromancer',
     *     text: 'The sky above the port was...',
     *     category: 'fiction'
     *   },
     *   {
     *     id: 4,
     *     title: 'Zen and the Art of Archery',
     *     text: 'At first sight it must seem...',
     *     category: 'non-fiction'
     *   },
     *   // ...and more
     * ]
     *
     * // Create a search engine that indexes the 'title' and 'text' fields for
     * // full-text search. Search results will include 'title' and 'category' (plus the
     * // id field, that is always stored and returned)
     * const miniSearch = new MiniSearch({
     *   fields: ['title', 'text'],
     *   storeFields: ['title', 'category']
     * })
     *
     * // Add documents to the index
     * miniSearch.addAll(documents)
     *
     * // Search for documents:
     * let results = miniSearch.search('zen art motorcycle')
     * // => [
     * //   { id: 2, title: 'Zen and the Art of Motorcycle Maintenance', category: 'fiction', score: 2.77258 },
     * //   { id: 4, title: 'Zen and the Art of Archery', category: 'non-fiction', score: 1.38629 }
     * // ]
     * ```
     */
    var MiniSearch = /** @class */ (function () {
        /**
         * @param options  Configuration options
         *
         * ### Examples:
         *
         * ```javascript
         * // Create a search engine that indexes the 'title' and 'text' fields of your
         * // documents:
         * const miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * ```
         *
         * ### ID Field:
         *
         * ```javascript
         * // Your documents are assumed to include a unique 'id' field, but if you want
         * // to use a different field for document identification, you can set the
         * // 'idField' option:
         * const miniSearch = new MiniSearch({ idField: 'key', fields: ['title', 'text'] })
         * ```
         *
         * ### Options and defaults:
         *
         * ```javascript
         * // The full set of options (here with their default value) is:
         * const miniSearch = new MiniSearch({
         *   // idField: field that uniquely identifies a document
         *   idField: 'id',
         *
         *   // extractField: function used to get the value of a field in a document.
         *   // By default, it assumes the document is a flat object with field names as
         *   // property keys and field values as string property values, but custom logic
         *   // can be implemented by setting this option to a custom extractor function.
         *   extractField: (document, fieldName) => document[fieldName],
         *
         *   // tokenize: function used to split fields into individual terms. By
         *   // default, it is also used to tokenize search queries, unless a specific
         *   // `tokenize` search option is supplied. When tokenizing an indexed field,
         *   // the field name is passed as the second argument.
         *   tokenize: (string, _fieldName) => string.split(SPACE_OR_PUNCTUATION),
         *
         *   // processTerm: function used to process each tokenized term before
         *   // indexing. It can be used for stemming and normalization. Return a falsy
         *   // value in order to discard a term. By default, it is also used to process
         *   // search queries, unless a specific `processTerm` option is supplied as a
         *   // search option. When processing a term from a indexed field, the field
         *   // name is passed as the second argument.
         *   processTerm: (term, _fieldName) => term.toLowerCase(),
         *
         *   // searchOptions: default search options, see the `search` method for
         *   // details
         *   searchOptions: undefined,
         *
         *   // fields: document fields to be indexed. Mandatory, but not set by default
         *   fields: undefined
         *
         *   // storeFields: document fields to be stored and returned as part of the
         *   // search results.
         *   storeFields: []
         * })
         * ```
         */
        function MiniSearch(options) {
            if ((options === null || options === void 0 ? void 0 : options.fields) == null) {
                throw new Error('MiniSearch: option "fields" must be provided');
            }
            this._options = __assign(__assign(__assign({}, defaultOptions), options), { searchOptions: __assign(__assign({}, defaultSearchOptions), (options.searchOptions || {})) });
            this._index = new SearchableMap();
            this._documentCount = 0;
            this._documentIds = new Map();
            // Fields are defined during initialization, don't change, are few in
            // number, rarely need iterating over, and have string keys. Therefore in
            // this case an object is a better candidate than a Map to store the mapping
            // from field key to ID.
            this._fieldIds = {};
            this._fieldLength = new Map();
            this._averageFieldLength = [];
            this._nextId = 0;
            this._storedFields = new Map();
            this.addFields(this._options.fields);
        }
        /**
         * Adds a document to the index
         *
         * @param document  The document to be indexed
         */
        MiniSearch.prototype.add = function (document) {
            var e_1, _a, e_2, _b;
            var _c = this._options, extractField = _c.extractField, tokenize = _c.tokenize, processTerm = _c.processTerm, fields = _c.fields, idField = _c.idField;
            var id = extractField(document, idField);
            if (id == null) {
                throw new Error("MiniSearch: document does not have ID field \"".concat(idField, "\""));
            }
            var shortDocumentId = this.addDocumentId(id);
            this.saveStoredFields(shortDocumentId, document);
            try {
                for (var fields_1 = __values(fields), fields_1_1 = fields_1.next(); !fields_1_1.done; fields_1_1 = fields_1.next()) {
                    var field = fields_1_1.value;
                    var fieldValue = extractField(document, field);
                    if (fieldValue == null)
                        continue;
                    var tokens = tokenize(fieldValue.toString(), field);
                    var fieldId = this._fieldIds[field];
                    this.addFieldLength(shortDocumentId, fieldId, this.documentCount - 1, tokens.length);
                    try {
                        for (var tokens_1 = (e_2 = void 0, __values(tokens)), tokens_1_1 = tokens_1.next(); !tokens_1_1.done; tokens_1_1 = tokens_1.next()) {
                            var term = tokens_1_1.value;
                            var processedTerm = processTerm(term, field);
                            if (processedTerm) {
                                this.addTerm(fieldId, shortDocumentId, processedTerm);
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (tokens_1_1 && !tokens_1_1.done && (_b = tokens_1.return)) _b.call(tokens_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (fields_1_1 && !fields_1_1.done && (_a = fields_1.return)) _a.call(fields_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        /**
         * Adds all the given documents to the index
         *
         * @param documents  An array of documents to be indexed
         */
        MiniSearch.prototype.addAll = function (documents) {
            var e_3, _a;
            try {
                for (var documents_1 = __values(documents), documents_1_1 = documents_1.next(); !documents_1_1.done; documents_1_1 = documents_1.next()) {
                    var document_1 = documents_1_1.value;
                    this.add(document_1);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (documents_1_1 && !documents_1_1.done && (_a = documents_1.return)) _a.call(documents_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
        };
        /**
         * Adds all the given documents to the index asynchronously.
         *
         * Returns a promise that resolves (to `undefined`) when the indexing is done.
         * This method is useful when index many documents, to avoid blocking the main
         * thread. The indexing is performed asynchronously and in chunks.
         *
         * @param documents  An array of documents to be indexed
         * @param options  Configuration options
         * @return A promise resolving to `undefined` when the indexing is done
         */
        MiniSearch.prototype.addAllAsync = function (documents, options) {
            var _this = this;
            if (options === void 0) { options = {}; }
            var _a = options.chunkSize, chunkSize = _a === void 0 ? 10 : _a;
            var acc = { chunk: [], promise: Promise.resolve() };
            var _b = documents.reduce(function (_a, document, i) {
                var chunk = _a.chunk, promise = _a.promise;
                chunk.push(document);
                if ((i + 1) % chunkSize === 0) {
                    return {
                        chunk: [],
                        promise: promise
                            .then(function () { return new Promise(function (resolve) { return setTimeout(resolve, 0); }); })
                            .then(function () { return _this.addAll(chunk); })
                    };
                }
                else {
                    return { chunk: chunk, promise: promise };
                }
            }, acc), chunk = _b.chunk, promise = _b.promise;
            return promise.then(function () { return _this.addAll(chunk); });
        };
        /**
         * Removes the given document from the index.
         *
         * The document to delete must NOT have changed between indexing and deletion,
         * otherwise the index will be corrupted. Therefore, when reindexing a document
         * after a change, the correct order of operations is:
         *
         *   1. remove old version
         *   2. apply changes
         *   3. index new version
         *
         * @param document  The document to be removed
         */
        MiniSearch.prototype.remove = function (document) {
            var e_4, _a, e_5, _b, e_6, _c;
            var _d = this._options, tokenize = _d.tokenize, processTerm = _d.processTerm, extractField = _d.extractField, fields = _d.fields, idField = _d.idField;
            var id = extractField(document, idField);
            if (id == null) {
                throw new Error("MiniSearch: document does not have ID field \"".concat(idField, "\""));
            }
            try {
                for (var _e = __values(this._documentIds), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var _g = __read(_f.value, 2), shortId = _g[0], longId = _g[1];
                    if (id === longId) {
                        try {
                            for (var fields_2 = (e_5 = void 0, __values(fields)), fields_2_1 = fields_2.next(); !fields_2_1.done; fields_2_1 = fields_2.next()) {
                                var field = fields_2_1.value;
                                var fieldValue = extractField(document, field);
                                if (fieldValue == null)
                                    continue;
                                var tokens = tokenize(fieldValue.toString(), field);
                                var fieldId = this._fieldIds[field];
                                try {
                                    for (var tokens_2 = (e_6 = void 0, __values(tokens)), tokens_2_1 = tokens_2.next(); !tokens_2_1.done; tokens_2_1 = tokens_2.next()) {
                                        var term = tokens_2_1.value;
                                        var processedTerm = processTerm(term, field);
                                        if (processedTerm) {
                                            this.removeTerm(fieldId, shortId, processedTerm);
                                        }
                                    }
                                }
                                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                                finally {
                                    try {
                                        if (tokens_2_1 && !tokens_2_1.done && (_c = tokens_2.return)) _c.call(tokens_2);
                                    }
                                    finally { if (e_6) throw e_6.error; }
                                }
                                this.removeFieldLength(shortId, fieldId, this.documentCount, tokens.length);
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (fields_2_1 && !fields_2_1.done && (_b = fields_2.return)) _b.call(fields_2);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        this._storedFields.delete(shortId);
                        this._documentIds.delete(shortId);
                        this._fieldLength.delete(shortId);
                        this._documentCount -= 1;
                        return;
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                }
                finally { if (e_4) throw e_4.error; }
            }
            throw new Error("MiniSearch: cannot remove document with ID ".concat(id, ": it is not in the index"));
        };
        /**
         * Removes all the given documents from the index. If called with no arguments,
         * it removes _all_ documents from the index.
         *
         * @param documents  The documents to be removed. If this argument is omitted,
         * all documents are removed. Note that, for removing all documents, it is
         * more efficient to call this method with no arguments than to pass all
         * documents.
         */
        MiniSearch.prototype.removeAll = function (documents) {
            var e_7, _a;
            if (documents) {
                try {
                    for (var documents_2 = __values(documents), documents_2_1 = documents_2.next(); !documents_2_1.done; documents_2_1 = documents_2.next()) {
                        var document_2 = documents_2_1.value;
                        this.remove(document_2);
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (documents_2_1 && !documents_2_1.done && (_a = documents_2.return)) _a.call(documents_2);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
            else if (arguments.length > 0) {
                throw new Error('Expected documents to be present. Omit the argument to remove all documents.');
            }
            else {
                this._index = new SearchableMap();
                this._documentCount = 0;
                this._documentIds = new Map();
                this._fieldLength = new Map();
                this._averageFieldLength = [];
                this._storedFields = new Map();
                this._nextId = 0;
            }
        };
        /**
         * Search for documents matching the given search query.
         *
         * The result is a list of scored document IDs matching the query, sorted by
         * descending score, and each including data about which terms were matched and
         * in which fields.
         *
         * ### Basic usage:
         *
         * ```javascript
         * // Search for "zen art motorcycle" with default options: terms have to match
         * // exactly, and individual terms are joined with OR
         * miniSearch.search('zen art motorcycle')
         * // => [ { id: 2, score: 2.77258, match: { ... } }, { id: 4, score: 1.38629, match: { ... } } ]
         * ```
         *
         * ### Restrict search to specific fields:
         *
         * ```javascript
         * // Search only in the 'title' field
         * miniSearch.search('zen', { fields: ['title'] })
         * ```
         *
         * ### Field boosting:
         *
         * ```javascript
         * // Boost a field
         * miniSearch.search('zen', { boost: { title: 2 } })
         * ```
         *
         * ### Prefix search:
         *
         * ```javascript
         * // Search for "moto" with prefix search (it will match documents
         * // containing terms that start with "moto" or "neuro")
         * miniSearch.search('moto neuro', { prefix: true })
         * ```
         *
         * ### Fuzzy search:
         *
         * ```javascript
         * // Search for "ismael" with fuzzy search (it will match documents containing
         * // terms similar to "ismael", with a maximum edit distance of 0.2 term.length
         * // (rounded to nearest integer)
         * miniSearch.search('ismael', { fuzzy: 0.2 })
         * ```
         *
         * ### Combining strategies:
         *
         * ```javascript
         * // Mix of exact match, prefix search, and fuzzy search
         * miniSearch.search('ismael mob', {
         *  prefix: true,
         *  fuzzy: 0.2
         * })
         * ```
         *
         * ### Advanced prefix and fuzzy search:
         *
         * ```javascript
         * // Perform fuzzy and prefix search depending on the search term. Here
         * // performing prefix and fuzzy search only on terms longer than 3 characters
         * miniSearch.search('ismael mob', {
         *  prefix: term => term.length > 3
         *  fuzzy: term => term.length > 3 ? 0.2 : null
         * })
         * ```
         *
         * ### Combine with AND:
         *
         * ```javascript
         * // Combine search terms with AND (to match only documents that contain both
         * // "motorcycle" and "art")
         * miniSearch.search('motorcycle art', { combineWith: 'AND' })
         * ```
         *
         * ### Combine with AND_NOT:
         *
         * There is also an AND_NOT combinator, that finds documents that match the
         * first term, but do not match any of the other terms. This combinator is
         * rarely useful with simple queries, and is meant to be used with advanced
         * query combinations (see later for more details).
         *
         * ### Filtering results:
         *
         * ```javascript
         * // Filter only results in the 'fiction' category (assuming that 'category'
         * // is a stored field)
         * miniSearch.search('motorcycle art', {
         *   filter: (result) => result.category === 'fiction'
         * })
         * ```
         *
         * ### Advanced combination of queries:
         *
         * It is possible to combine different subqueries with OR, AND, and AND_NOT,
         * and even with different search options, by passing a query expression
         * tree object as the first argument, instead of a string.
         *
         * ```javascript
         * // Search for documents that contain "zen" and ("motorcycle" or "archery")
         * miniSearch.search({
         *   combineWith: 'AND',
         *   queries: [
         *     'zen',
         *     {
         *       combineWith: 'OR',
         *       queries: ['motorcycle', 'archery']
         *     }
         *   ]
         * })
         *
         * // Search for documents that contain ("apple" or "pear") but not "juice" and
         * // not "tree"
         * miniSearch.search({
         *   combineWith: 'AND_NOT',
         *   queries: [
         *     {
         *       combineWith: 'OR',
         *       queries: ['apple', 'pear']
         *     },
         *     'juice',
         *     'tree'
         *   ]
         * })
         * ```
         *
         * Each node in the expression tree can be either a string, or an object that
         * supports all `SearchOptions` fields, plus a `queries` array field for
         * subqueries.
         *
         * Note that, while this can become complicated to do by hand for complex or
         * deeply nested queries, it provides a formalized expression tree API for
         * external libraries that implement a parser for custom query languages.
         *
         * @param query  Search query
         * @param options  Search options. Each option, if not given, defaults to the corresponding value of `searchOptions` given to the constructor, or to the library default.
         */
        MiniSearch.prototype.search = function (query, searchOptions) {
            var e_8, _a;
            if (searchOptions === void 0) { searchOptions = {}; }
            var combinedResults = this.executeQuery(query, searchOptions);
            var results = [];
            try {
                for (var combinedResults_1 = __values(combinedResults), combinedResults_1_1 = combinedResults_1.next(); !combinedResults_1_1.done; combinedResults_1_1 = combinedResults_1.next()) {
                    var _b = __read(combinedResults_1_1.value, 2), docId = _b[0], _c = _b[1], score_1 = _c.score, match = _c.match, terms = _c.terms;
                    var result = {
                        id: this._documentIds.get(docId),
                        terms: uniq(terms),
                        score: score_1,
                        match: match
                    };
                    Object.assign(result, this._storedFields.get(docId));
                    if (searchOptions.filter == null || searchOptions.filter(result)) {
                        results.push(result);
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (combinedResults_1_1 && !combinedResults_1_1.done && (_a = combinedResults_1.return)) _a.call(combinedResults_1);
                }
                finally { if (e_8) throw e_8.error; }
            }
            results.sort(function (_a, _b) {
                var a = _a.score;
                var b = _b.score;
                return a < b ? 1 : -1;
            });
            return results;
        };
        /**
         * Provide suggestions for the given search query
         *
         * The result is a list of suggested modified search queries, derived from the
         * given search query, each with a relevance score, sorted by descending score.
         *
         * ### Basic usage:
         *
         * ```javascript
         * // Get suggestions for 'neuro':
         * miniSearch.autoSuggest('neuro')
         * // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 0.46240 } ]
         * ```
         *
         * ### Multiple words:
         *
         * ```javascript
         * // Get suggestions for 'zen ar':
         * miniSearch.autoSuggest('zen ar')
         * // => [
         * //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
         * //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
         * // ]
         * ```
         *
         * ### Fuzzy suggestions:
         *
         * ```javascript
         * // Correct spelling mistakes using fuzzy search:
         * miniSearch.autoSuggest('neromancer', { fuzzy: 0.2 })
         * // => [ { suggestion: 'neuromancer', terms: [ 'neuromancer' ], score: 1.03998 } ]
         * ```
         *
         * ### Filtering:
         *
         * ```javascript
         * // Get suggestions for 'zen ar', but only within the 'fiction' category
         * // (assuming that 'category' is a stored field):
         * miniSearch.autoSuggest('zen ar', {
         *   filter: (result) => result.category === 'fiction'
         * })
         * // => [
         * //  { suggestion: 'zen archery art', terms: [ 'zen', 'archery', 'art' ], score: 1.73332 },
         * //  { suggestion: 'zen art', terms: [ 'zen', 'art' ], score: 1.21313 }
         * // ]
         * ```
         *
         * @param queryString  Query string to be expanded into suggestions
         * @param options  Search options. The supported options and default values
         * are the same as for the `search` method, except that by default prefix
         * search is performed on the last term in the query.
         * @return  A sorted array of suggestions sorted by relevance score.
         */
        MiniSearch.prototype.autoSuggest = function (queryString, options) {
            var e_9, _a, e_10, _b;
            if (options === void 0) { options = {}; }
            options = __assign(__assign({}, defaultAutoSuggestOptions), options);
            var suggestions = new Map();
            try {
                for (var _c = __values(this.search(queryString, options)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var _e = _d.value, score_2 = _e.score, terms = _e.terms;
                    var phrase = terms.join(' ');
                    var suggestion = suggestions.get(phrase);
                    if (suggestion != null) {
                        suggestion.score += score_2;
                        suggestion.count += 1;
                    }
                    else {
                        suggestions.set(phrase, { score: score_2, terms: terms, count: 1 });
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_9) throw e_9.error; }
            }
            var results = [];
            try {
                for (var suggestions_1 = __values(suggestions), suggestions_1_1 = suggestions_1.next(); !suggestions_1_1.done; suggestions_1_1 = suggestions_1.next()) {
                    var _f = __read(suggestions_1_1.value, 2), suggestion = _f[0], _g = _f[1], score_3 = _g.score, terms = _g.terms, count = _g.count;
                    results.push({ suggestion: suggestion, terms: terms, score: score_3 / count });
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (suggestions_1_1 && !suggestions_1_1.done && (_b = suggestions_1.return)) _b.call(suggestions_1);
                }
                finally { if (e_10) throw e_10.error; }
            }
            results.sort(function (_a, _b) {
                var a = _a.score;
                var b = _b.score;
                return a < b ? 1 : -1;
            });
            return results;
        };
        Object.defineProperty(MiniSearch.prototype, "documentCount", {
            /**
             * Number of documents in the index
             */
            get: function () {
                return this._documentCount;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Deserializes a JSON index (serialized with `miniSearch.toJSON()`) and
         * instantiates a MiniSearch instance. It should be given the same options
         * originally used when serializing the index.
         *
         * ### Usage:
         *
         * ```javascript
         * // If the index was serialized with:
         * let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * miniSearch.addAll(documents)
         *
         * const json = JSON.stringify(miniSearch)
         * // It can later be deserialized like this:
         * miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
         * ```
         *
         * @param json  JSON-serialized index
         * @param options  configuration options, same as the constructor
         * @return An instance of MiniSearch deserialized from the given JSON.
         */
        MiniSearch.loadJSON = function (json, options) {
            if (options == null) {
                throw new Error('MiniSearch: loadJSON should be given the same options used when serializing the index');
            }
            return MiniSearch.loadJS(JSON.parse(json), options);
        };
        /**
         * Returns the default value of an option. It will throw an error if no option
         * with the given name exists.
         *
         * @param optionName  Name of the option
         * @return The default value of the given option
         *
         * ### Usage:
         *
         * ```javascript
         * // Get default tokenizer
         * MiniSearch.getDefault('tokenize')
         *
         * // Get default term processor
         * MiniSearch.getDefault('processTerm')
         *
         * // Unknown options will throw an error
         * MiniSearch.getDefault('notExisting')
         * // => throws 'MiniSearch: unknown option "notExisting"'
         * ```
         */
        MiniSearch.getDefault = function (optionName) {
            if (defaultOptions.hasOwnProperty(optionName)) {
                return getOwnProperty(defaultOptions, optionName);
            }
            else {
                throw new Error("MiniSearch: unknown option \"".concat(optionName, "\""));
            }
        };
        /**
         * @ignore
         */
        MiniSearch.loadJS = function (js, options) {
            var index = js.index, documentCount = js.documentCount, nextId = js.nextId, documentIds = js.documentIds, fieldIds = js.fieldIds, fieldLength = js.fieldLength, averageFieldLength = js.averageFieldLength, storedFields = js.storedFields;
            var miniSearch = new MiniSearch(options);
            miniSearch._index = new SearchableMap(objectToTree(index._tree), index._prefix);
            miniSearch._documentCount = documentCount;
            miniSearch._nextId = nextId;
            miniSearch._documentIds = objectToNumericMap(documentIds);
            miniSearch._fieldIds = fieldIds;
            miniSearch._fieldLength = objectToNumericMap(fieldLength);
            miniSearch._averageFieldLength = averageFieldLength;
            miniSearch._storedFields = objectToNumericMap(storedFields);
            return miniSearch;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.executeQuery = function (query, searchOptions) {
            var _this = this;
            if (searchOptions === void 0) { searchOptions = {}; }
            if (typeof query === 'string') {
                return this.executeSearch(query, searchOptions);
            }
            else {
                var results = query.queries.map(function (subquery) {
                    var options = __assign(__assign(__assign({}, searchOptions), query), { queries: undefined });
                    return _this.executeQuery(subquery, options);
                });
                return this.combineResults(results, query.combineWith);
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.executeSearch = function (queryString, searchOptions) {
            var _this = this;
            if (searchOptions === void 0) { searchOptions = {}; }
            var _a = this._options, tokenize = _a.tokenize, processTerm = _a.processTerm, globalSearchOptions = _a.searchOptions;
            var options = __assign(__assign({ tokenize: tokenize, processTerm: processTerm }, globalSearchOptions), searchOptions);
            var searchTokenize = options.tokenize, searchProcessTerm = options.processTerm;
            var terms = searchTokenize(queryString)
                .map(function (term) { return searchProcessTerm(term); })
                .filter(function (term) { return !!term; });
            var queries = terms.map(termToQuerySpec(options));
            var results = queries.map(function (query) { return _this.executeQuerySpec(query, options); });
            return this.combineResults(results, options.combineWith);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.executeQuerySpec = function (query, searchOptions) {
            var e_11, _a, e_12, _b;
            var options = __assign(__assign({}, this._options.searchOptions), searchOptions);
            var boosts = (options.fields || this._options.fields).reduce(function (boosts, field) {
                var _a;
                return (__assign(__assign({}, boosts), (_a = {}, _a[field] = getOwnProperty(boosts, field) || 1, _a)));
            }, options.boost || {});
            var boostDocument = options.boostDocument, weights = options.weights;
            var _c = __assign(__assign({}, defaultSearchOptions.weights), weights), fuzzyWeight = _c.fuzzy, prefixWeight = _c.prefix;
            var exactMatch = this.termResults(query.term, boosts, boostDocument, this._index.get(query.term));
            if (!query.fuzzy && !query.prefix) {
                return exactMatch;
            }
            var results = [exactMatch];
            if (query.prefix) {
                try {
                    for (var _d = __values(this._index.atPrefix(query.term)), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var _f = __read(_e.value, 2), term = _f[0], data = _f[1];
                        var weightedDistance = (0.3 * (term.length - query.term.length)) / term.length;
                        results.push(this.termResults(term, boosts, boostDocument, data, prefixWeight, weightedDistance));
                    }
                }
                catch (e_11_1) { e_11 = { error: e_11_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                    }
                    finally { if (e_11) throw e_11.error; }
                }
            }
            if (query.fuzzy) {
                var fuzzy = (query.fuzzy === true) ? 0.2 : query.fuzzy;
                var maxDistance = fuzzy < 1 ? Math.round(query.term.length * fuzzy) : fuzzy;
                var fuzzyResults = this._index.fuzzyGet(query.term, maxDistance);
                try {
                    for (var _g = __values(Object.keys(fuzzyResults)), _h = _g.next(); !_h.done; _h = _g.next()) {
                        var term = _h.value;
                        var _j = __read(fuzzyResults[term], 2), data = _j[0], distance = _j[1];
                        var weightedDistance = distance / term.length;
                        results.push(this.termResults(term, boosts, boostDocument, data, fuzzyWeight, weightedDistance));
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
            }
            return results.reduce(combinators[OR]);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.combineResults = function (results, combineWith) {
            if (combineWith === void 0) { combineWith = OR; }
            if (results.length === 0) {
                return new Map();
            }
            var operator = combineWith.toLowerCase();
            return results.reduce(combinators[operator]) || new Map();
        };
        /**
         * Allows serialization of the index to JSON, to possibly store it and later
         * deserialize it with `MiniSearch.loadJSON`.
         *
         * Normally one does not directly call this method, but rather call the
         * standard JavaScript `JSON.stringify()` passing the `MiniSearch` instance,
         * and JavaScript will internally call this method. Upon deserialization, one
         * must pass to `loadJSON` the same options used to create the original
         * instance that was serialized.
         *
         * ### Usage:
         *
         * ```javascript
         * // Serialize the index:
         * let miniSearch = new MiniSearch({ fields: ['title', 'text'] })
         * miniSearch.addAll(documents)
         * const json = JSON.stringify(miniSearch)
         *
         * // Later, to deserialize it:
         * miniSearch = MiniSearch.loadJSON(json, { fields: ['title', 'text'] })
         * ```
         *
         * @return A plain-object serializeable representation of the search index.
         */
        MiniSearch.prototype.toJSON = function () {
            return {
                index: { _tree: treeToObject(this._index._tree), _prefix: this._index._prefix },
                documentCount: this._documentCount,
                nextId: this._nextId,
                documentIds: Object.fromEntries(this._documentIds),
                fieldIds: this._fieldIds,
                fieldLength: Object.fromEntries(this._fieldLength),
                averageFieldLength: this._averageFieldLength,
                storedFields: Object.fromEntries(this._storedFields)
            };
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.termResults = function (term, boosts, boostDocument, indexData, weight, editDistance) {
            var e_13, _a, e_14, _b;
            if (editDistance === void 0) { editDistance = 0; }
            if (indexData == null) {
                return new Map();
            }
            var results = new Map();
            try {
                for (var _c = __values(Object.keys(boosts)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var field = _d.value;
                    var boost = boosts[field];
                    var fieldId = this._fieldIds[field];
                    var entry = indexData.get(fieldId);
                    if (entry == null)
                        continue;
                    try {
                        for (var _e = (e_14 = void 0, __values(entry.ds)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var _g = __read(_f.value, 2), documentId = _g[0], tf = _g[1];
                            var docBoost = boostDocument ? boostDocument(this._documentIds.get(documentId), term) : 1;
                            if (!docBoost)
                                continue;
                            var normalizedLength = this._fieldLength.get(documentId)[fieldId] / this._averageFieldLength[fieldId];
                            var result = results.get(documentId);
                            if (!result) {
                                result = { score: 0, match: {}, terms: [] };
                                results.set(documentId, result);
                            }
                            result.terms.push(term);
                            result.match[term] = getOwnProperty(results.get(documentId).match, term) || [];
                            result.score += docBoost * score(tf, entry.df, this._documentCount, normalizedLength, boost, editDistance);
                            result.match[term].push(field);
                        }
                    }
                    catch (e_14_1) { e_14 = { error: e_14_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_14) throw e_14.error; }
                    }
                }
            }
            catch (e_13_1) { e_13 = { error: e_13_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_13) throw e_13.error; }
            }
            return results;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addTerm = function (fieldId, documentId, term) {
            var indexData = this._index.fetch(term, createMap);
            var fieldIndex = indexData.get(fieldId);
            if (fieldIndex == null) {
                fieldIndex = { df: 1, ds: new Map() };
                fieldIndex.ds.set(documentId, 1);
                indexData.set(fieldId, fieldIndex);
            }
            else {
                var docs = fieldIndex.ds.get(documentId);
                if (docs == null) {
                    fieldIndex.df += 1;
                }
                fieldIndex.ds.set(documentId, (docs || 0) + 1);
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.removeTerm = function (fieldId, documentId, term) {
            var _this = this;
            if (!this._index.has(term)) {
                this.warnDocumentChanged(documentId, fieldId, term);
                return;
            }
            this._index.update(term, function (indexData) {
                var fieldIndex = indexData.get(fieldId);
                if (fieldIndex == null || fieldIndex.ds.get(documentId) == null) {
                    _this.warnDocumentChanged(documentId, fieldId, term);
                    return indexData;
                }
                if (fieldIndex.ds.get(documentId) <= 1) {
                    if (fieldIndex.df <= 1) {
                        indexData.delete(fieldId);
                        return indexData;
                    }
                    fieldIndex.df -= 1;
                }
                if (fieldIndex.ds.get(documentId) <= 1) {
                    fieldIndex.ds.delete(documentId);
                    return indexData;
                }
                fieldIndex.ds.set(documentId, fieldIndex.ds.get(documentId) - 1);
                indexData.set(fieldId, fieldIndex);
                return indexData;
            });
            if (this._index.get(term).size === 0) {
                this._index.delete(term);
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.warnDocumentChanged = function (shortDocumentId, fieldId, term) {
            var e_15, _a;
            if (console == null || console.warn == null) {
                return;
            }
            try {
                for (var _b = __values(Object.keys(this._fieldIds)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var fieldName = _c.value;
                    if (this._fieldIds[fieldName] === fieldId) {
                        console.warn("MiniSearch: document with ID ".concat(this._documentIds.get(shortDocumentId), " has changed before removal: term \"").concat(term, "\" was not present in field \"").concat(fieldName, "\". Removing a document after it has changed can corrupt the index!"));
                        return;
                    }
                }
            }
            catch (e_15_1) { e_15 = { error: e_15_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_15) throw e_15.error; }
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addDocumentId = function (documentId) {
            var shortDocumentId = this._nextId;
            this._documentIds.set(shortDocumentId, documentId);
            this._documentCount += 1;
            this._nextId += 1;
            return shortDocumentId;
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addFields = function (fields) {
            for (var i = 0; i < fields.length; i++) {
                this._fieldIds[fields[i]] = i;
            }
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.addFieldLength = function (documentId, fieldId, count, length) {
            var fieldLengths = this._fieldLength.get(documentId);
            if (fieldLengths == null)
                this._fieldLength.set(documentId, fieldLengths = []);
            fieldLengths[fieldId] = length;
            var averageFieldLength = this._averageFieldLength[fieldId] || 0;
            var totalLength = (averageFieldLength * count) + length;
            this._averageFieldLength[fieldId] = totalLength / (count + 1);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.removeFieldLength = function (documentId, fieldId, count, length) {
            var totalLength = (this._averageFieldLength[fieldId] * count) - length;
            this._averageFieldLength[fieldId] = totalLength / (count - 1);
        };
        /**
         * @ignore
         */
        MiniSearch.prototype.saveStoredFields = function (documentId, doc) {
            var e_16, _a;
            var _b = this._options, storeFields = _b.storeFields, extractField = _b.extractField;
            if (storeFields == null || storeFields.length === 0) {
                return;
            }
            var documentFields = this._storedFields.get(documentId);
            if (documentFields == null)
                this._storedFields.set(documentId, documentFields = {});
            try {
                for (var storeFields_1 = __values(storeFields), storeFields_1_1 = storeFields_1.next(); !storeFields_1_1.done; storeFields_1_1 = storeFields_1.next()) {
                    var fieldName = storeFields_1_1.value;
                    var fieldValue = extractField(doc, fieldName);
                    if (fieldValue === undefined) {
                        return;
                    }
                    documentFields[fieldName] = fieldValue;
                }
            }
            catch (e_16_1) { e_16 = { error: e_16_1 }; }
            finally {
                try {
                    if (storeFields_1_1 && !storeFields_1_1.done && (_a = storeFields_1.return)) _a.call(storeFields_1);
                }
                finally { if (e_16) throw e_16.error; }
            }
        };
        return MiniSearch;
    }());
    var getOwnProperty = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property) ? object[property] : undefined;
    };
    var combinators = (_a = {},
        _a[OR] = function (a, b) {
            var e_17, _a, _b;
            try {
                for (var b_1 = __values(b), b_1_1 = b_1.next(); !b_1_1.done; b_1_1 = b_1.next()) {
                    var _c = __read(b_1_1.value, 2), documentId = _c[0], _d = _c[1], score_4 = _d.score, match = _d.match, terms = _d.terms;
                    var existing = a.get(documentId);
                    if (existing == null) {
                        a.set(documentId, { score: score_4, match: match, terms: terms });
                    }
                    else {
                        existing.score = (existing.score + score_4) * 1.5;
                        existing.match = Object.assign(existing.match, match);
                        (_b = existing.terms).push.apply(_b, __spreadArray([], __read(terms), false));
                    }
                }
            }
            catch (e_17_1) { e_17 = { error: e_17_1 }; }
            finally {
                try {
                    if (b_1_1 && !b_1_1.done && (_a = b_1.return)) _a.call(b_1);
                }
                finally { if (e_17) throw e_17.error; }
            }
            return a;
        },
        _a[AND] = function (a, b) {
            var e_18, _a;
            var combined = new Map();
            try {
                for (var b_2 = __values(b), b_2_1 = b_2.next(); !b_2_1.done; b_2_1 = b_2.next()) {
                    var _b = __read(b_2_1.value, 2), documentId = _b[0], _c = _b[1], score_5 = _c.score, match = _c.match, terms = _c.terms;
                    var doc = a.get(documentId);
                    if (doc == null)
                        continue;
                    combined.set(documentId, {
                        score: doc.score + score_5,
                        match: Object.assign(doc.match, match),
                        terms: __spreadArray(__spreadArray([], __read(doc.terms), false), __read(terms), false)
                    });
                }
            }
            catch (e_18_1) { e_18 = { error: e_18_1 }; }
            finally {
                try {
                    if (b_2_1 && !b_2_1.done && (_a = b_2.return)) _a.call(b_2);
                }
                finally { if (e_18) throw e_18.error; }
            }
            return combined;
        },
        _a[AND_NOT] = function (a, b) {
            var e_19, _a;
            try {
                for (var _b = __values(b.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var documentId = _c.value;
                    a.delete(documentId);
                }
            }
            catch (e_19_1) { e_19 = { error: e_19_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_19) throw e_19.error; }
            }
            return a;
        },
        _a);
    var tfIdf = function (tf, df, n) { return tf * Math.log(n / df); };
    var score = function (termFrequency, documentFrequency, documentCount, normalizedLength, boost, editDistance) {
        var weight = boost / (1 + (0.333 * boost * editDistance));
        return weight * tfIdf(termFrequency, documentFrequency, documentCount) / normalizedLength;
    };
    var termToQuerySpec = function (options) { return function (term, i, terms) {
        var fuzzy = (typeof options.fuzzy === 'function')
            ? options.fuzzy(term, i, terms)
            : (options.fuzzy || false);
        var prefix = (typeof options.prefix === 'function')
            ? options.prefix(term, i, terms)
            : (options.prefix === true);
        return { term: term, fuzzy: fuzzy, prefix: prefix };
    }; };
    var uniq = function (array) {
        return array.filter(function (element, i, array) { return array.indexOf(element) === i; });
    };
    var defaultOptions = {
        idField: 'id',
        extractField: function (document, fieldName) { return document[fieldName]; },
        tokenize: function (text, fieldName) { return text.split(SPACE_OR_PUNCTUATION); },
        processTerm: function (term, fieldName) { return term.toLowerCase(); },
        fields: undefined,
        searchOptions: undefined,
        storeFields: []
    };
    var defaultSearchOptions = {
        combineWith: OR,
        prefix: false,
        fuzzy: false,
        boost: {},
        weights: { fuzzy: 0.9, prefix: 0.75 }
    };
    var defaultAutoSuggestOptions = {
        prefix: function (term, i, terms) {
            return i === terms.length - 1;
        }
    };
    var createMap = function () { return new Map(); };
    var objectToTree = function (object) {
        var e_20, _a, e_21, _b;
        var map = new Map();
        try {
            for (var _c = __values(Object.keys(object)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var key = _d.value;
                var value = object[key];
                if (key === LEAF) {
                    var data = new Map();
                    try {
                        for (var _e = (e_21 = void 0, __values(Object.keys(value))), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var key_1 = _f.value;
                            var _g = value[key_1], df = _g.df, ds = _g.ds;
                            data.set(parseInt(key_1, 10), {
                                df: df,
                                ds: objectToNumericMap(ds)
                            });
                        }
                    }
                    catch (e_21_1) { e_21 = { error: e_21_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_21) throw e_21.error; }
                    }
                    map.set(key, data);
                }
                else {
                    map.set(key, objectToTree(value));
                }
            }
        }
        catch (e_20_1) { e_20 = { error: e_20_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_20) throw e_20.error; }
        }
        return map;
    };
    var objectToNumericMap = function (object) {
        var e_22, _a;
        var map = new Map();
        try {
            for (var _b = __values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                map.set(parseInt(key, 10), object[key]);
            }
        }
        catch (e_22_1) { e_22 = { error: e_22_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_22) throw e_22.error; }
        }
        return map;
    };
    var treeToObject = function (tree) {
        var e_23, _a, e_24, _b;
        var obj = {};
        try {
            for (var tree_1 = __values(tree), tree_1_1 = tree_1.next(); !tree_1_1.done; tree_1_1 = tree_1.next()) {
                var _c = __read(tree_1_1.value, 2), key = _c[0], value = _c[1];
                if (key === LEAF) {
                    var data = {};
                    try {
                        for (var _d = (e_24 = void 0, __values(value.entries())), _e = _d.next(); !_e.done; _e = _d.next()) {
                            var _f = __read(_e.value, 2), key_2 = _f[0], _g = _f[1], df = _g.df, ds = _g.ds;
                            data[key_2] = {
                                df: df,
                                ds: Object.fromEntries(ds)
                            };
                        }
                    }
                    catch (e_24_1) { e_24 = { error: e_24_1 }; }
                    finally {
                        try {
                            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                        }
                        finally { if (e_24) throw e_24.error; }
                    }
                    obj[key] = data;
                }
                else {
                    obj[key] = treeToObject(value);
                }
            }
        }
        catch (e_23_1) { e_23 = { error: e_23_1 }; }
        finally {
            try {
                if (tree_1_1 && !tree_1_1.done && (_a = tree_1.return)) _a.call(tree_1);
            }
            finally { if (e_23) throw e_23.error; }
        }
        return obj;
    };
    // This regular expression matches any Unicode space or punctuation character
    // Adapted from https://unicode.org/cldr/utility/list-unicodeset.jsp?a=%5Cp%7BZ%7D%5Cp%7BP%7D&abb=on&c=on&esc=on
    var SPACE_OR_PUNCTUATION = /[\n\r -#%-*,-/:;?@[-\]_{}\u00A0\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u1680\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2000-\u200A\u2010-\u2029\u202F-\u2043\u2045-\u2051\u2053-\u205F\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u3000-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/u;

    return MiniSearch;

}));
//# sourceMappingURL=index.js.map
