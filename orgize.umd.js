(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.orgize = {}));
}(this, (function (exports) { 'use strict';

    let wasm;

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    function getObject(idx) { return heap[idx]; }

    let heap_next = heap.length;

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    const cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachedUint8Memory0 = new Uint8Array();

    function getUint8Memory0() {
        if (cachedUint8Memory0.byteLength === 0) {
            cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    let WASM_VECTOR_LEN = 0;

    const cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachedInt32Memory0 = new Int32Array();

    function getInt32Memory0() {
        if (cachedInt32Memory0.byteLength === 0) {
            cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachedInt32Memory0;
    }

    function _assertClass(instance, klass) {
        if (!(instance instanceof klass)) {
            throw new Error(`expected instance of ${klass.name}`);
        }
        return instance.ptr;
    }
    /**
    * @param {Org} org
    * @param {any} handler
    */
    function handle$1(org, handler) {
        _assertClass(org, Org);
        wasm.handle(org.ptr, addHeapObject(handler));
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    }
    /**
    */
    class Org {

        static __wrap(ptr) {
            const obj = Object.create(Org.prototype);
            obj.ptr = ptr;

            return obj;
        }

        __destroy_into_raw() {
            const ptr = this.ptr;
            this.ptr = 0;

            return ptr;
        }

        free() {
            const ptr = this.__destroy_into_raw();
            wasm.__wbg_org_free(ptr);
        }
        /**
        * @param {string} input
        * @returns {Org}
        */
        static parse(input) {
            const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.org_parse(ptr0, len0);
            return Org.__wrap(ret);
        }
        /**
        * @returns {any}
        */
        toJson() {
            const ret = wasm.org_toJson(this.ptr);
            return takeObject(ret);
        }
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    function getImports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbg_text_9d7be88cb9d0e993 = function(arg0, arg1) {
            getObject(arg0).text(takeObject(arg1));
        };
        imports.wbg.__wbg_code_bb5df0e20028d1b4 = function(arg0, arg1) {
            getObject(arg0).code(takeObject(arg1));
        };
        imports.wbg.__wbg_cookie_c40e503c71995ccf = function(arg0, arg1) {
            getObject(arg0).cookie(takeObject(arg1));
        };
        imports.wbg.__wbg_rule_c48ea58e05284f0a = function(arg0) {
            getObject(arg0).rule();
        };
        imports.wbg.__wbg_exampleBlock_79db13bf5ce41758 = function(arg0, arg1) {
            getObject(arg0).exampleBlock(takeObject(arg1));
        };
        imports.wbg.__wbg_exportBlock_f4da62ce962cdc72 = function(arg0, arg1) {
            getObject(arg0).exportBlock(takeObject(arg1));
        };
        imports.wbg.__wbg_sourceBlock_d66de695a8ba6a28 = function(arg0, arg1) {
            getObject(arg0).sourceBlock(takeObject(arg1));
        };
        imports.wbg.__wbg_inlineSrc_612eb06e9a588764 = function(arg0, arg1) {
            getObject(arg0).inlineSrc(takeObject(arg1));
        };
        imports.wbg.__wbg_link_aea6fc46604ae21a = function(arg0, arg1) {
            getObject(arg0).link(takeObject(arg1));
        };
        imports.wbg.__wbg_snippet_051b7a269fe830d3 = function(arg0, arg1) {
            getObject(arg0).snippet(takeObject(arg1));
        };
        imports.wbg.__wbg_timestamp_0be7b46dee608dc7 = function(arg0, arg1) {
            getObject(arg0).timestamp(takeObject(arg1));
        };
        imports.wbg.__wbg_verbatim_5fa7a8bf6797d799 = function(arg0, arg1) {
            getObject(arg0).verbatim(takeObject(arg1));
        };
        imports.wbg.__wbg_fixedWidth_7cfbc61dd4893d59 = function(arg0, arg1) {
            getObject(arg0).fixedWidth(takeObject(arg1));
        };
        imports.wbg.__wbg_keyword_9880bffc52b1f72e = function(arg0, arg1) {
            getObject(arg0).keyword(takeObject(arg1));
        };
        imports.wbg.__wbg_listStart_4fc5893ef927c6af = function(arg0, arg1) {
            getObject(arg0).listStart(takeObject(arg1));
        };
        imports.wbg.__wbg_listEnd_56585dd32218ccac = function(arg0, arg1) {
            getObject(arg0).listEnd(takeObject(arg1));
        };
        imports.wbg.__wbg_tableStart_ecb632f749e1843a = function(arg0, arg1) {
            getObject(arg0).tableStart(takeObject(arg1));
        };
        imports.wbg.__wbg_tableRowStart_07c7f9e025d8d435 = function(arg0, arg1) {
            getObject(arg0).tableRowStart(takeObject(arg1));
        };
        imports.wbg.__wbg_tableCellStart_c60848b19baf111d = function(arg0, arg1) {
            getObject(arg0).tableCellStart(takeObject(arg1));
        };
        imports.wbg.__wbg_titleStart_7ae650910466668c = function(arg0, arg1) {
            getObject(arg0).titleStart(takeObject(arg1));
        };
        imports.wbg.__wbg_titleEnd_8e7c66a7cd410da6 = function(arg0, arg1) {
            getObject(arg0).titleEnd(takeObject(arg1));
        };
        imports.wbg.__wbg_boldStart_a570a541eee54a04 = function(arg0) {
            getObject(arg0).boldStart();
        };
        imports.wbg.__wbg_boldEnd_e9de72bd9d6d67aa = function(arg0) {
            getObject(arg0).boldEnd();
        };
        imports.wbg.__wbg_centerBlockStart_f3b607811bf7c15a = function(arg0, arg1) {
            getObject(arg0).centerBlockStart(takeObject(arg1));
        };
        imports.wbg.__wbg_centerBlockEnd_c28d268ed13c8d99 = function(arg0, arg1) {
            getObject(arg0).centerBlockEnd(takeObject(arg1));
        };
        imports.wbg.__wbg_documentStart_ead3479098bdf3cd = function(arg0) {
            getObject(arg0).documentStart();
        };
        imports.wbg.__wbg_documentEnd_835258edd09a2073 = function(arg0) {
            getObject(arg0).documentEnd();
        };
        imports.wbg.__wbg_italicStart_098d845d576cfe4d = function(arg0) {
            getObject(arg0).italicStart();
        };
        imports.wbg.__wbg_italicEnd_a26a9f1a03504572 = function(arg0) {
            getObject(arg0).italicEnd();
        };
        imports.wbg.__wbg_listItemStart_f7e3e45d4064122a = function(arg0) {
            getObject(arg0).listItemStart();
        };
        imports.wbg.__wbg_listItemEnd_e5d5d202169afbc4 = function(arg0) {
            getObject(arg0).listItemEnd();
        };
        imports.wbg.__wbg_paragraphStart_0911d346fe2f0aa8 = function(arg0) {
            getObject(arg0).paragraphStart();
        };
        imports.wbg.__wbg_paragraphEnd_7e3be6d14519b8f9 = function(arg0) {
            getObject(arg0).paragraphEnd();
        };
        imports.wbg.__wbg_quoteBlockStart_a85d3fbaae8ddcab = function(arg0, arg1) {
            getObject(arg0).quoteBlockStart(takeObject(arg1));
        };
        imports.wbg.__wbg_quoteBlockEnd_924f13342cf61145 = function(arg0, arg1) {
            getObject(arg0).quoteBlockEnd(takeObject(arg1));
        };
        imports.wbg.__wbg_sectionStart_21c356e55c1979de = function(arg0) {
            getObject(arg0).sectionStart();
        };
        imports.wbg.__wbg_sectionEnd_ebd85494219048b3 = function(arg0) {
            getObject(arg0).sectionEnd();
        };
        imports.wbg.__wbg_strikeStart_bb876a13c23ae4a0 = function(arg0) {
            getObject(arg0).strikeStart();
        };
        imports.wbg.__wbg_strikeEnd_b27d2e51423382b0 = function(arg0) {
            getObject(arg0).strikeEnd();
        };
        imports.wbg.__wbg_underlineStart_061a7650f74f999d = function(arg0) {
            getObject(arg0).underlineStart();
        };
        imports.wbg.__wbg_underlineEnd_9d755ffb65c1f633 = function(arg0) {
            getObject(arg0).underlineEnd();
        };
        imports.wbg.__wbg_verseBlockStart_5810dffbfb567d87 = function(arg0, arg1) {
            getObject(arg0).verseBlockStart(takeObject(arg1));
        };
        imports.wbg.__wbg_verseBlockEnd_750d8dfa93c5b0ab = function(arg0, arg1) {
            getObject(arg0).verseBlockEnd(takeObject(arg1));
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_number_new = function(arg0) {
            const ret = arg0;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            const ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_f1a4ac8f3a605b11 = function(arg0, arg1, arg2) {
            getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
        };
        imports.wbg.__wbg_new_ee1a3da85465d621 = function() {
            const ret = new Array();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_ac586205e4424583 = function() {
            const ret = new Map();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_e6a9fecc2bf26696 = function() {
            const ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_string = function(arg0) {
            const ret = typeof(getObject(arg0)) === 'string';
            return ret;
        };
        imports.wbg.__wbg_push_0bc7fce4a139a883 = function(arg0, arg1) {
            const ret = getObject(arg0).push(getObject(arg1));
            return ret;
        };
        imports.wbg.__wbg_new_3ee7ebe9952c1fbd = function(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_a55cff623a9eaa21 = function(arg0, arg1, arg2) {
            const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_fromCodePoint_721be91df0158faf = function() { return handleError(function (arg0) {
            const ret = String.fromCodePoint(arg0 >>> 0);
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            const ret = debugString(getObject(arg1));
            const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };

        return imports;
    }

    function finalizeInit(instance, module) {
        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;
        cachedInt32Memory0 = new Int32Array();
        cachedUint8Memory0 = new Uint8Array();


        return wasm;
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            input = new URL('orgize_bg.wasm', (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('orgize.umd.js', document.baseURI).href)));
        }
        const imports = getImports();

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }

        const { instance, module } = await load(await input, imports);

        return finalizeInit(instance, module);
    }

    class Handler {
        text(_text) { }
        code(_item) { }
        cookie(_item) { }
        rule() { }
        exampleBlock(_item) { }
        exportBlock(_item) { }
        sourceBlock(_item) { }
        inlineSrc(_item) { }
        link(_item) { }
        snippet(_item) { }
        timestamp(_item) { }
        verbatim(_item) { }
        fixedWidth(_item) { }
        listStart(_item) { }
        listEnd(_item) { }
        tableStart(_item) { }
        tableEnd(_item) { }
        tableRowStart(_item) { }
        tableRowEnd(_item) { }
        tableCellStart(_item) { }
        tableCellEnd(_item) { }
        titleStart(_item) { }
        titleEnd(_item) { }
        boldStart() { }
        boldEnd() { }
        centerBlockStart(_item) { }
        centerBlockEnd(_item) { }
        documentStart() { }
        documentEnd() { }
        italicStart() { }
        italicEnd() { }
        listItemStart() { }
        listItemEnd() { }
        paragraphStart() { }
        paragraphEnd() { }
        quoteBlockStart(_item) { }
        quoteBlockEnd(_item) { }
        sectionStart() { }
        sectionEnd() { }
        strikeStart() { }
        strikeEnd() { }
        underlineStart() { }
        underlineEnd() { }
        verseBlockStart(_item) { }
        verseBlockEnd(_item) { }
        keyword(_item) { }
    }

    const tags = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
    };
    const replaceTags = (tag) => tags[tag];
    const escapeHtml = (str) => str.replace(/[&<>"']/g, replaceTags);
    class HtmlHandler extends Handler {
        result;
        constructor(result = "") {
            super();
            this.result = result;
        }
        static escape() {
            return "";
        }
        quoteBlockStart() {
            this.result += "<blockquote>";
        }
        quoteBlockEnd() {
            this.result += "</blockquote>";
        }
        centerBlockStart() {
            this.result += '<div class="center">';
        }
        centerBlockEnd() {
            this.result += "</div>";
        }
        verseBlockStart() {
            this.result += '<p class="verse">';
        }
        verseBlockEnd() {
            this.result += "</p>";
        }
        boldStart() {
            this.result += "<b>";
        }
        boldEnd() {
            this.result += "</b>";
        }
        documentStart() {
            this.result += "<main>";
        }
        documentEnd() {
            this.result += "</main>";
        }
        listStart(list) {
            this.result += `<${list.ordered ? "o" : "u"}l>`;
        }
        listEnd(list) {
            this.result += `</${list.ordered ? "o" : "u"}l>`;
        }
        italicStart() {
            this.result += "<i>";
        }
        italicEnd() {
            this.result += "</i>";
        }
        listItemStart() {
            this.result += "<li>";
        }
        listItemEnd() {
            this.result += "</li>";
        }
        paragraphStart() {
            this.result += "<p>";
        }
        paragraphEnd() {
            this.result += "</p>";
        }
        sectionStart() {
            this.result += "<section>";
        }
        sectionEnd() {
            this.result += "</section>";
        }
        strikeStart() {
            this.result += "<s>";
        }
        strikeEnd() {
            this.result += "</s>";
        }
        underlineStart() {
            this.result += "<u>";
        }
        underlineEnd() {
            this.result += "</u>";
        }
        exampleBlock(block) {
            this.result += `<pre class="example">${escapeHtml(block.contents)}</pre>`;
        }
        sourceBlock(block) {
            this.result += `<pre class="example">${escapeHtml(block.contents)}</pre>`;
        }
        inlineSrc(src) {
            this.result += `<code class="src src-${src.lang}">${escapeHtml(src.body)}</code>`;
        }
        code(value) {
            this.result += `<code>${escapeHtml(value)}</code>`;
        }
        link(link) {
            this.result += `<a href="${link.path}">${escapeHtml(link.desc || link.path)}</a>`;
        }
        snippet(snippet) {
            if (snippet.name.toLowerCase() === "html") {
                this.result += snippet.value;
            }
        }
        text(value) {
            this.result += escapeHtml(value);
        }
        verbatim(value) {
            this.result += `<code>${escapeHtml(value)}</code>`;
        }
        fixedWidth(item) {
            this.result += `<pre class="example">${escapeHtml(item.value)}</pre>`;
        }
        rule() {
            this.result += "<hr>";
        }
        cookie(cookie) {
            this.result += `<code>${escapeHtml(cookie.value)}</code>`;
        }
        titleStart(title) {
            this.result += `<h${Math.min(title.level, 6)}>`;
        }
        titleEnd(title) {
            this.result += `</h${Math.min(title.level, 6)}>`;
        }
    }

    class CollectKeywords extends Handler {
        keywords = {};
        keyword(keyword) {
            this.keywords[keyword.key] = this.keywords[keyword.key] || [];
            this.keywords[keyword.key].push(keyword.value);
        }
    }

    const handle = (org, handler) => {
        if (typeof org === "string") {
            org = Org.parse(org);
        }
        handle$1(org, handler);
    };
    const renderHtml = (org, handler = new HtmlHandler()) => {
        handle(org, handler);
        return handler.result;
    };
    const keywords = (org) => {
        const handler = new CollectKeywords();
        handle(org, handler);
        return handler.keywords;
    };

    exports.Handler = Handler;
    exports.HtmlHandler = HtmlHandler;
    exports.Org = Org;
    exports.escapeHtml = escapeHtml;
    exports.handle = handle;
    exports.init = init;
    exports.keywords = keywords;
    exports.renderHtml = renderHtml;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
