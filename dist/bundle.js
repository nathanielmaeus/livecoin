
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
'use strict';

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function to_number(value) {
    return value === '' ? null : +value;
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
}
function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
    else
        dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data)
        return;
    dispatch_dev('SvelteDOMSetData', { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error("'target' is a required option");
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
}

function round(value, withK) {
    if (withK) {
        return `${Math.round(value / 1000 / 23)}k`;
    }
    return Math.round(value * 100 / 23) / 100;
}
function parseDate() {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, "0");
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const year = currentDate.getFullYear();
    return `${day}-${month}-${year}`;
}
function getCurrencySymbol(currency) {
    return {
        EUR: "€",
        USD: "$",
        RUB: "₽",
    }[currency || "RUB"];
}

function e({node:e=[],from:t,source:r,parent:a=t||r,to:n,target:o,child:s=n||o,scope:l={},meta:f={},family:i={type:'regular'}}={}){let c=be(a),u=be(i.links),p=be(i.owners),d=[],m={};for(let t=0;t<e.length;t++){let r=e[t];r&&(d.push(r),ve(r,m));}let h={id:B(),seq:d,next:be(s),meta:f,scope:l,family:{type:i.type||'crosslink',links:u,owners:p},reg:m};for(let e=0;e<u.length;e++)ce(u[e]).push(h);for(let e=0;e<p.length;e++)ue(p[e]).push(h);for(let e=0;e<c.length;e++)c[e].next.push(h);return h}function t(e,t="combine"){let r=t+'(',a='',n=0;for(let t in e){let o=e[t];if(null!=o&&(r+=a,r+=D(o)?o.compositeName.fullName:o.toString()),n+=1,25===n)break;a=', ';}return r+=')',r}function a(e,t){let r,a,n,o=e;return t?(n=t.compositeName,0===e.length?(r=n.path,a=n.fullName):(r=n.path.concat([e]),a=0===n.fullName.length?e:n.fullName+'/'+e)):(r=0===e.length?[]:[e],a=e),{shortName:o,fullName:a,path:r}}function s(t,r){let a=(e,...t)=>Re?((e,t,r,a)=>{let n=Re,o=null;if(t)for(o=Re;o&&o.template!==t;)o=ye(o);Ie(o);let s=e.create(r,a);return Ie(n),s})(a,n,e,t):a.create(e,t);a.graphite=e({meta:st('event',a,r,t)}),a.create=e=>{let t=Oe?Oe.find(a):a;return Me(t,e),e},a.watch=J(rt,a),a.map=e=>{let t,r;T(e)&&(t=e,r=e.name,e=e.fn);let n=s(ze(a,r),t);return ft(a,n,'map',e),n},a.filter=e=>ct(a,'filter',e.fn?e:e.fn,[ee({fn:fe})]),a.filterMap=e=>ct(a,'filterMap',e,[Z({fn:fe}),Y.defined()]),a.prepend=e=>{let t=s('* → '+a.shortName,{parent:ye(a)});return ft(t,a,'prepend',e),ot(a,t),t};let n=Xe();return Qe(a)}function l(t,r){function a(e,t){c.off(e),ge(c).set(e,Le(ut(e,c,'on',1,t)));}let n=ne(t),o=ne(t),s=lt('updates'),f=Xe();n.after=[{type:'copy',to:o}],f;let i=n.id,c={subscribers:new Map,updates:s,defaultState:t,stateRef:n,getState(){let e,t=n;if(Re){let t=Re;for(;t&&!t.reg[i];)t=ye(t);t&&(e=t);}return !e&&Oe&&Oe.reg[i]&&(e=Oe),e&&(t=e.reg[i]),oe(t)},setState(e){let t;Oe&&(t=Oe.nodeMap[ie(c).id]),t||(t=c),Me({target:t,params:e,defer:1});},reset(...e){for(let t of e)c.on(t,(()=>c.defaultState));return c},on(e,t){if(Array.isArray(e))for(let r of e)a(r,t);else a(e,t);return c},off(e){let t=ge(c).get(e);return t&&(t(),ge(c).delete(e)),c},map(e,t){let r,a,o;T(e)&&(r=e,a=e.name,t=e.firstState,e=e.fn);let s=c.getState();void 0!==s&&(o=e(s,t));let i=l(o,{name:ze(c,a),config:r,strict:0}),u=ut(c,i,'map',0,e);return pe(i).before=[{type:'map',fn:e,from:n}],i},watch(e,t){if(!t||!D(e)){let t=rt(c,e);return e(c.getState()),t}return W(t)||z('second argument should be a function'),e.watch((e=>t(c.getState(),e)))}};return c.graphite=e({scope:{state:n},node:[Y.defined(),re({store:n}),Y.changed({store:o}),re({store:o})],child:s,meta:st('store',c,r)}),nt&&void 0===t&&z("current state can't be undefined, use null instead"),ke(c,[s]),Qe(c)}function f(...e){let t,r,a;Te(e[0],((t,r)=>{a=t,e=r;}));let n,o,s=e[e.length-1];if(W(s)?(r=e.slice(0,-1),t=s):r=e,1===r.length){let e=r[0];F(e)||(n=e,o=1);}return o||(n=r,t&&(t=pt(t))),T(n)||z('shape should be an object'),dt(Array.isArray(n),n,a,t)}function i(){let e={};return e.req=new Promise(((t,r)=>{e.rs=t,e.rj=r;})),e.req.catch((()=>{})),e}function c(t,r){let a=s(t,r),n=a.defaultConfig.handler||(()=>z("no handler used in "+a.getType())),o=ie(a);o.meta.onCopy=['runner'],o.meta.unit=a.kind='effect',a.use=e=>(W(e)||z('.use argument should be a function'),n=e,a);let f=a.finally=lt('finally'),c=a.done=f.filterMap({named:'done',fn({status:e,params:t,result:r}){if('done'===e)return {params:t,result:r}}}),u=a.fail=f.filterMap({named:'fail',fn({status:e,params:t,error:r}){if('fail'===e)return {params:t,error:r}}}),p=a.doneData=c.map({named:'doneData',fn:({result:e})=>e}),d=a.failData=u.map({named:'failData',fn:({error:e})=>e}),m=e({scope:{getHandler:a.use.getCurrent=()=>n,finally:f},node:[te({fn({params:e,req:t},{finally:r,getHandler:a},{page:n,forkPage:o}){let s,l=mt({params:e,req:t,ok:1,anyway:r,page:n,forkPage:o}),f=mt({params:e,req:t,ok:0,anyway:r,page:n,forkPage:o});try{s=a()(e);}catch(e){return void f(e)}T(s)&&W(s.then)?s.then(l,f):l(s);}})],meta:{op:'fx',fx:'runner',onCopy:['finally']}});o.scope.runner=m,o.seq.push(Z({fn:(e,t,r)=>ye(r)?{params:e,req:{rs(e){},rj(e){}}}:e}),te({fn:(e,{runner:t},{forkPage:r})=>(Me({target:t,params:e,defer:1,forkPage:r}),e.params)})),a.create=e=>{let t=i(),r={params:e,req:t};if(Oe){let e=Oe;t.req.finally((()=>{Fe(e);})),Me(Oe.find(a),r);}else Me(a,r);return t.req};let h=a.inFlight=l(0,{named:'inFlight'}).on(a,(e=>e+1)).on(f,(e=>e-1)),g=a.pending=h.map({fn:e=>e>0,named:'pending'});return ke(a,[f,c,u,p,d,g,h,m]),a}let O='undefined'!=typeof Symbol&&Symbol.observable||'@@observable',D=e=>(W(e)||T(e))&&'kind'in e;const R=e=>t=>D(t)&&t.kind===e;let F=R('store'),_=R('domain');let z=e=>{throw Error(e)},T=e=>'object'==typeof e&&null!==e,W=e=>'function'==typeof e,$=e=>{T(e)||W(e)||z('expect first argument be an object');};const H=()=>{let e=0;return ()=>(++e).toString(36)};let G=H(),U=H(),B=H(),J=(e,t)=>e.bind(null,t),K=(e,t,r)=>e.bind(null,t,r);const L=(e,t,r)=>({id:U(),type:e,data:r,hasRef:t});let Q=0,V=({priority:e="barrier"})=>L('barrier',0,{barrierID:++Q,priority:e}),X=({from:e="store",store:t,target:r,to:a=(r?'store':'stack')})=>L('mov','store'===e,{from:e,store:t,to:a,target:r}),Y={defined:()=>L('check',0,{type:'defined'}),changed:({store:e})=>L('check',1,{type:'changed',store:e})},Z=K(L,'compute',0),ee=K(L,'filter',0),te=K(L,'run',0),re=({store:e})=>X({from:'stack',target:e});let ne=e=>({id:U(),current:e}),oe=({current:e})=>e,se=(e,{fn:t},{a:r})=>t(e,r),le=(e,{fn:t},{a:r})=>t(r,e),fe=(e,{fn:t})=>t(e),ie=e=>e.graphite||e,ce=e=>e.family.owners,ue=e=>e.family.links,pe=e=>e.stateRef,de=e=>e.config,me=e=>e.ɔ,he=e=>e.value,ge=e=>e.subscribers,ye=e=>e.parent,ke=(e,t)=>{let r=ie(e);for(let e=0;e<t.length;e++){let a=ie(t[e]);'domain'!==r.family.type&&(a.family.type='crosslink'),ce(a).push(r),ue(r).push(a);}};const be=(e=[])=>{let t=[];if(Array.isArray(e))for(let r=0;r<e.length;r++)Array.isArray(e[r])?t.push(...e[r]):t.push(e[r]);else t.push(e);return t.map(ie)};let ve=({hasRef:e,type:t,data:r},a)=>{let n;e&&(n=r.store,a[n.id]=n),'mov'===t&&'store'===r.to&&(n=r.target,a[n.id]=n);},we=null;const Se=(e,t)=>{if(!e)return t;if(!t)return e;let r,a=e.v.type===t.v.type;return (a&&e.v.id>t.v.id||!a&&'sampler'===e.v.type)&&(r=e,e=t,t=r),r=Se(e.r,t),e.r=e.l,e.l=r,e},qe=[];let xe=0;for(;xe<5;)qe.push({first:null,last:null,size:0}),xe+=1;const Ne=()=>{for(let e=0;e<5;e++){let t=qe[e];if(t.size>0){if(2===e||3===e){t.size-=1;let e=we.v;return we=Se(we.l,we.r),e}1===t.size&&(t.last=null);let r=t.first;return t.first=r.r,t.size-=1,r.v}}},Pe=(e,t,r,a,n,o)=>je(0,{a:null,b:null,node:r,parent:a,value:n,page:t,forkPage:o},e),je=(e,t,r,a=0)=>{let n=Ae(r),o=qe[n],s={v:{idx:e,stack:t,type:r,id:a},l:0,r:0};2===n||3===n?we=Se(we,s):(0===o.size?o.first=s:o.last.r=s,o.last=s),o.size+=1;},Ae=e=>{switch(e){case'child':return 0;case'pure':return 1;case'barrier':return 2;case'sampler':return 3;case'effect':return 4;default:return -1}},Ce=new Set;let Oe,De=0,Re=null,Fe=e=>{Oe=e;},Ie=e=>{Re=e;},Me=(e,t,r)=>{let a=Re,n=null,o=Oe;if(e.target&&(t=e.params,r=e.defer,a='page'in e?e.page:a,e.stack&&(n=e.stack),o=e.forkPage||o,e=e.target),Array.isArray(e))for(let r=0;r<e.length;r++)Pe('pure',a,ie(e[r]),n,t[r],o);else Pe('pure',a,ie(e),n,t,o);r&&De||(()=>{let e,t,r,a,n,o,s={alreadyStarted:De,currentPage:Re,forkPage:Oe};De=1;e:for(;a=Ne();){let{idx:s,stack:l,type:f}=a;r=l.node,Re=n=l.page,Oe=l.forkPage,o=(n||r).reg;let i={fail:0,scope:r.scope};e=t=0;for(let a=s;a<r.seq.length&&!e;a++){let c=r.seq[a],u=c.data;switch(c.type){case'barrier':{let e=u.barrierID;n&&(e=`${n.fullID}_${e}`);let t=u.priority;if(a!==s||f!==t){Ce.has(e)||(Ce.add(e),je(a,l,t,e));continue e}Ce.delete(e);break}case'mov':{let e;switch(u.from){case'stack':e=he(l);break;case'a':e=l.a;break;case'b':e=l.b;break;case'value':e=u.store;break;case'store':o[u.store.id]||(l.page=n=null,o=r.reg),e=oe(o[u.store.id]);}switch(u.to){case'stack':l.value=e;break;case'a':l.a=e;break;case'b':l.b=e;break;case'store':o[u.target.id].current=e;}break}case'check':switch(u.type){case'defined':t=void 0===he(l);break;case'changed':t=he(l)===oe(o[u.store.id]);}break;case'filter':t=!_e(i,u,l);break;case'run':if(a!==s||'effect'!==f){je(a,l,'effect');continue e}case'compute':l.value=_e(i,u,l);}e=i.fail||t;}if(!e)for(let e=0;e<r.next.length;e++)Pe('child',n,r.next[e],l,he(l),l.forkPage);}De=s.alreadyStarted,Re=s.currentPage,Oe=s.forkPage;})();};const _e=(e,{fn:t},r)=>{try{return t(he(r),e.scope,r)}catch(t){console.error(t),e.fail=1;}};let Ee=(e,t)=>''+e.shortName+t,ze=(e,t)=>null==t?Ee(e,' → *'):t,Te=(e,t)=>{$(e),me(e)&&t(de(e),me(e));},$e=(e,t)=>{for(let r in e)t(e[r],r);},Ge=(e,t)=>{let r=e.indexOf(t);-1!==r&&e.splice(r,1);};const Ue=(e,t)=>{Ge(e.next,t),Ge(ce(e),t),Ge(ue(e),t);},Be=(e,t,r)=>{let a;e.next.length=0,e.seq.length=0,e.scope=null;let n=ue(e);for(;a=n.pop();)Ue(a,e),(t||r&&!e.meta.sample||'crosslink'===a.family.type)&&Be(a,t,r);for(n=ce(e);a=n.pop();)Ue(a,e),r&&'crosslink'===a.family.type&&Be(a,t,r);},Je=e=>e.clear();let Ke=(e,{deep:t}={})=>{let r=0;if(e.ownerSet&&e.ownerSet.delete(e),F(e))Je(ge(e));else if(_(e)){r=1;let t=e.history;Je(t.events),Je(t.effects),Je(t.stores),Je(t.domains);}Be(ie(e),!!t,r);},Le=e=>{let t=K(Ke,e,void 0);return t.unsubscribe=t,t},Qe=e=>(e),Ve=null,Xe=()=>Ve,Ye=e=>(e&&Ve&&Ve.sidRoot&&(e=`${Ve.sidRoot}ɔ${e}`),e),et=(t,r,{node:a,scope:n,meta:o})=>Qe(e({node:a,parent:t,child:r,scope:n,meta:o,family:{owners:[t,r],links:r}})),tt=t=>{let r;Te(t,((e,a)=>{r=e,t=a;}));let{from:a,to:n,meta:o={op:'forward'}}=t;return a&&n||z('from and to fields should be defined'),r&&(o.config=r),Le(Qe(e({parent:a,child:n,meta:o,family:{}})))},rt=(t,r)=>{if(W(r)||z('.watch argument should be a function'),Oe){let e=Oe.nodeMap[ie(t).id];e&&(t=e);}return Le(Qe(e({scope:{fn:r},node:[te({fn:fe})],parent:t,meta:{op:'watch'},family:{owners:t}})))};const at=(e,t)=>(T(e)&&(at(de(e),t),null!=e.name&&(T(e.name)?at(e.name,t):W(e.name)?t.handler=e.name:t.name=e.name),e.loc&&(t.loc=e.loc),(e.sid||null===e.sid)&&(t.sid=e.sid),e.handler&&(t.handler=e.handler),ye(e)&&(t.parent=ye(e)),'strict'in e&&(t.strict=e.strict),e.named&&(t.named=e.named),at(me(e),t)),t);let nt,ot=(e,t,r="event")=>{ye(e)&&ye(e).hooks[r](t);},st=(e,t,r,n)=>{let o=at({name:n,config:r},{}),s=G(),{parent:l=null,sid:f=null,strict:i=1,named:c=null}=o,u=c||o.name||('domain'===e?'':s),p=a(u,l);return f=Ye(f),t.kind=e,t.id=s,t.sid=f,t.shortName=u,t.parent=l,t.compositeName=p,t.defaultConfig=o,t.thru=e=>e(t),t.getType=()=>p.fullName,'domain'!==e&&(t.subscribe=e=>($(e),t.watch(W(e)?e:t=>{e.next&&e.next(t);})),t[O]=()=>t),nt=i,{unit:e,name:u,sid:f,named:c}},lt=e=>s({named:e});const ft=(e,t,r,a)=>et(e,t,{scope:{fn:a},node:[Z({fn:fe})],meta:{op:r}}),ct=(e,t,r,a)=>{let n;T(r)&&(n=r,r=r.fn);let o=s(Ee(e,' →? *'),n);return et(e,o,{scope:{fn:r},node:a,meta:{op:t}}),o},ut=(e,t,r,a,n)=>{let o=pe(t),s=[X({store:o,to:'a'}),Z({fn:a?le:se}),Y.defined(),Y.changed({store:o}),re({store:o})];return et(e,t,{scope:{fn:n},node:s,meta:{op:r}})},pt=e=>t=>e(...t),dt=(e,r,a,n)=>{let o=e?e=>e.slice():e=>Object.assign({},e),s=e?[]:{},f=Xe(),i=o(s),c=ne(i),u=ne(1);c.type=e?'list':'shape',f;let p=l(i,{name:a||t(r)}),d=[Y.defined(),X({store:c,to:'a'}),ee({fn:(e,{key:t},{a:r})=>e!==r[t]}),X({store:u,to:'b'}),Z({fn(e,{clone:t,key:r},a){a.b&&(a.a=t(a.a)),a.a[r]=e;}}),X({from:'a',target:c}),X({from:'value',store:0,target:u}),V({priority:'barrier'}),X({from:'value',store:1,target:u}),X({store:c}),n&&Z({fn:n}),Y.changed({store:pe(p)})],m=c.before=[];return $e(r,((e,t)=>{if(!F(e))return void(i[t]=s[t]=e);s[t]=e.defaultState,i[t]=e.getState();let r=et(e,p,{scope:{key:t,clone:o},node:d,meta:{op:'combine'}}),a=pe(e);m.push({type:'field',field:t,from:a}),f;})),p.defaultShape=r,c.after=[n?{type:'map',to:pe(p),fn:n}:{type:'copy',to:pe(p)}],(p.defaultState=n?pe(p).current=n(i):s),p};let mt=({params:e,req:t,ok:r,anyway:a,page:n,forkPage:o})=>s=>Me({target:[a,ht],params:[r?{status:'done',params:e,result:s}:{status:'fail',params:e,error:s},{fn:r?t.rs:t.rj,value:s}],defer:1,page:n,forkPage:o});const ht=e({node:[te({fn({fn:e,value:t}){e(t);}})],meta:{op:'fx',fx:'sidechain'}});

var STATUS;
(function (STATUS) {
    STATUS["initial"] = "initial";
    STATUS["loading"] = "loading";
    STATUS["loaded"] = "loaded";
    STATUS["failed"] = "failed";
})(STATUS || (STATUS = {}));
const INITIAL = {
    1: {
        id: 1,
        name: "",
        amount: 0,
        currency: "USD",
    },
};
const status = l(STATUS.initial);
const error = l(null);
const rates = l({ USD: 0, EUR: 0, RUB: 0 });
const historyRates = l([]);
const date = l(null);
const savingsHistory = l([]);
const finance = l(INITIAL);
const totalSaving = f(finance, rates, (finance, rates) => {
    const initial = {
        USD: 0,
        EUR: 0,
        RUB: 0,
    };
    if (!finance || !rates["EUR"]) {
        return initial;
    }
    const totalOnlyWithRUB = Object.keys(finance).reduce((acc, key) => {
        const { currency, amount } = finance[key];
        if (!amount) {
            return acc;
        }
        acc["RUB"] += amount * rates[currency];
        return acc;
    }, initial);
    totalOnlyWithRUB["EUR"] = totalOnlyWithRUB.RUB / rates["EUR"];
    totalOnlyWithRUB["USD"] = totalOnlyWithRUB.RUB / rates["USD"];
    return totalOnlyWithRUB;
});
const totalRation = f(totalSaving, finance, (totalSaving, finance) => {
    const initial = {
        USD: 0,
        EUR: 0,
        RUB: 0,
    };
    if (!finance) {
        return initial;
    }
    const separateCurrencyTotal = Object.keys(finance).reduce((acc, key) => {
        const { currency, amount } = finance[key];
        if (!amount) {
            return acc;
        }
        acc[currency] += amount;
        return acc;
    }, initial);
    const separateCurrencyTotalKeys = Object.keys(separateCurrencyTotal);
    const ratioTotal = separateCurrencyTotalKeys.reduce((acc, key) => {
        acc[key] += Math.round(separateCurrencyTotal[key] / totalSaving[key] * 100);
        return acc;
    }, {
        USD: 0,
        EUR: 0,
        RUB: 0,
    });
    return ratioTotal;
});
const createAccount = s();
const updateAccount = s();
const deleteAccount = s();
const initializeSavings = s();
const getAllCurrency = c();
const saveTotal = c();

/* src/components/path.svelte generated by Svelte v3.29.4 */
const file = "src/components/path.svelte";

function create_fragment(ctx) {
	let path;
	let path_style_value;
	let path_d_value;

	const block = {
		c: function create() {
			path = svg_element("path");
			attr_dev(path, "style", path_style_value = `fill: ${/*fill*/ ctx[0]}; transform: ${/*transform*/ ctx[1]}; transform-origin: ${/*transformOrigin*/ ctx[2]};`);
			attr_dev(path, "d", path_d_value = `M${/*r*/ ctx[3]} ${/*r*/ ctx[3]}V0a${/*r*/ ctx[3]} ${/*r*/ ctx[3]} 0 0 1 ${/*dx*/ ctx[4]} ${/*dy*/ ctx[5]}z`);
			add_location(path, file, 19, 0, 437);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, path, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(path);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Path", slots, []);

	let { radius } = $$props,
		{ rotate } = $$props,
		{ value } = $$props,
		{ total } = $$props,
		{ i } = $$props;

	const angle = 2 * Math.PI * value / total;
	const fill = `hsl(${70 * i}, 100%, 50%)`;
	const transform = `rotate(${round(rotate)}rad)`;
	const transformOrigin = `${radius}px ${radius}px`;

	//rotate += angle;
	const r = radius; // for brevity

	const dx = r * Math.sin(angle);
	const dy = r * (1 - Math.cos(angle));
	const writable_props = ["radius", "rotate", "value", "total", "i"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Path> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("radius" in $$props) $$invalidate(6, radius = $$props.radius);
		if ("rotate" in $$props) $$invalidate(7, rotate = $$props.rotate);
		if ("value" in $$props) $$invalidate(8, value = $$props.value);
		if ("total" in $$props) $$invalidate(9, total = $$props.total);
		if ("i" in $$props) $$invalidate(10, i = $$props.i);
	};

	$$self.$capture_state = () => ({
		round,
		radius,
		rotate,
		value,
		total,
		i,
		angle,
		fill,
		transform,
		transformOrigin,
		r,
		dx,
		dy
	});

	$$self.$inject_state = $$props => {
		if ("radius" in $$props) $$invalidate(6, radius = $$props.radius);
		if ("rotate" in $$props) $$invalidate(7, rotate = $$props.rotate);
		if ("value" in $$props) $$invalidate(8, value = $$props.value);
		if ("total" in $$props) $$invalidate(9, total = $$props.total);
		if ("i" in $$props) $$invalidate(10, i = $$props.i);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [fill, transform, transformOrigin, r, dx, dy, radius, rotate, value, total, i];
}

class Path extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance, create_fragment, safe_not_equal, {
			radius: 6,
			rotate: 7,
			value: 8,
			total: 9,
			i: 10
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Path",
			options,
			id: create_fragment.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*radius*/ ctx[6] === undefined && !("radius" in props)) {
			console.warn("<Path> was created without expected prop 'radius'");
		}

		if (/*rotate*/ ctx[7] === undefined && !("rotate" in props)) {
			console.warn("<Path> was created without expected prop 'rotate'");
		}

		if (/*value*/ ctx[8] === undefined && !("value" in props)) {
			console.warn("<Path> was created without expected prop 'value'");
		}

		if (/*total*/ ctx[9] === undefined && !("total" in props)) {
			console.warn("<Path> was created without expected prop 'total'");
		}

		if (/*i*/ ctx[10] === undefined && !("i" in props)) {
			console.warn("<Path> was created without expected prop 'i'");
		}
	}

	get radius() {
		throw new Error("<Path>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set radius(value) {
		throw new Error("<Path>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rotate() {
		throw new Error("<Path>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rotate(value) {
		throw new Error("<Path>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get value() {
		throw new Error("<Path>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set value(value) {
		throw new Error("<Path>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get total() {
		throw new Error("<Path>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set total(value) {
		throw new Error("<Path>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get i() {
		throw new Error("<Path>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set i(value) {
		throw new Error("<Path>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/pieChart.svelte generated by Svelte v3.29.4 */
const file$1 = "src/components/pieChart.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	child_ctx[6] = i;
	return child_ctx;
}

// (21:2) {#each data as value, i}
function create_each_block(ctx) {
	let t_value = (/*rotate*/ ctx[0] += 2 * Math.PI * /*value*/ ctx[4] / /*total*/ ctx[2]) + "";
	let t;
	let path;
	let current;

	path = new Path({
			props: {
				value: /*value*/ ctx[4],
				i: /*i*/ ctx[6],
				total: /*total*/ ctx[2],
				radius,
				rotate: /*rotate*/ ctx[0]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			t = text(t_value);
			create_component(path.$$.fragment);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
			mount_component(path, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			if ((!current || dirty & /*rotate*/ 1) && t_value !== (t_value = (/*rotate*/ ctx[0] += 2 * Math.PI * /*value*/ ctx[4] / /*total*/ ctx[2]) + "")) set_data_dev(t, t_value);
			const path_changes = {};
			if (dirty & /*rotate*/ 1) path_changes.rotate = /*rotate*/ ctx[0];
			path.$set(path_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(path.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(path.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
			destroy_component(path, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(21:2) {#each data as value, i}",
		ctx
	});

	return block;
}

function create_fragment$1(ctx) {
	let svg;
	let svg_viewBox_value;
	let current;
	let each_value = /*data*/ ctx[1];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			svg = svg_element("svg");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(svg, "width", /*diameter*/ ctx[3]);
			attr_dev(svg, "height", /*diameter*/ ctx[3]);
			attr_dev(svg, "viewBox", svg_viewBox_value = `0 0 ${/*diameter*/ ctx[3]} ${/*diameter*/ ctx[3]}`);
			attr_dev(svg, "class", "svelte-x9y65l");
			add_location(svg, file$1, 19, 0, 362);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, svg, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(svg, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*data, total, radius, rotate, Math*/ 7) {
				each_value = /*data*/ ctx[1];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(svg, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(svg);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

const radius = 100;

function instance$1($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("PieChart", slots, []);
	const data = [6, 2, 1, 8, 10, 4, 5, 2, 7, 8, 12];
	const total = data.reduce((a, b) => a + b, 0);
	const diameter = 2 * radius;
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PieChart> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		Path,
		data,
		radius,
		total,
		diameter,
		rotate
	});

	$$self.$inject_state = $$props => {
		if ("rotate" in $$props) $$invalidate(0, rotate = $$props.rotate);
	};

	let rotate;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	 $$invalidate(0, rotate = 0.5 * Math.PI);
	return [rotate, data, total, diameter];
}

class PieChart extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "PieChart",
			options,
			id: create_fragment$1.name
		});
	}
}

/* src/components/button.svelte generated by Svelte v3.29.4 */

const file$2 = "src/components/button.svelte";

function create_fragment$2(ctx) {
	let button;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[1].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

	const block = {
		c: function create() {
			button = element("button");
			if (default_slot) default_slot.c();
			attr_dev(button, "class", "button svelte-13mxyg0");
			add_location(button, file$2, 30, 0, 552);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);

			if (default_slot) {
				default_slot.m(button, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 1) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
				}
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(button);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Button", slots, ['default']);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
	});

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
	};

	return [$$scope, slots, click_handler];
}

class Button extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Button",
			options,
			id: create_fragment$2.name
		});
	}
}

/* src/Input.svelte generated by Svelte v3.29.4 */
const file$3 = "src/Input.svelte";

// (103:2) {:else}
function create_else_block(ctx) {
	let div;
	let t_value = (/*accountName*/ ctx[3] || "") + "";
	let t;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			t = text(t_value);
			attr_dev(div, "class", "accountName svelte-17f3dl6");
			add_location(div, file$3, 103, 4, 2041);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t);

			if (!mounted) {
				dispose = listen_dev(div, "click", /*handleClickOnName*/ ctx[7], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*accountName*/ 8 && t_value !== (t_value = (/*accountName*/ ctx[3] || "") + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(103:2) {:else}",
		ctx
	});

	return block;
}

// (92:2) {#if isInputNameVisible}
function create_if_block(ctx) {
	let div;
	let input;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			input = element("input");
			attr_dev(input, "class", "input accountName svelte-17f3dl6");
			attr_dev(input, "type", "text");
			attr_dev(input, "placeholder", "название");
			attr_dev(input, "name", "accountName");
			add_location(input, file$3, 93, 6, 1765);
			attr_dev(div, "class", "field svelte-17f3dl6");
			add_location(div, file$3, 92, 4, 1739);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, input);
			/*input_binding*/ ctx[11](input);
			set_input_value(input, /*accountName*/ ctx[3]);

			if (!mounted) {
				dispose = [
					listen_dev(input, "input", /*input_input_handler*/ ctx[12]),
					listen_dev(input, "blur", /*blur_handler*/ ctx[13], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*accountName*/ 8 && input.value !== /*accountName*/ ctx[3]) {
				set_input_value(input, /*accountName*/ ctx[3]);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			/*input_binding*/ ctx[11](null);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(92:2) {#if isInputNameVisible}",
		ctx
	});

	return block;
}

// (121:2) <Button on:click={handleDelete}>
function create_default_slot(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Удалить");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot.name,
		type: "slot",
		source: "(121:2) <Button on:click={handleDelete}>",
		ctx
	});

	return block;
}

function create_fragment$3(ctx) {
	let div1;
	let t0;
	let div0;
	let input;
	let input_name_value;
	let t1;
	let select;
	let option0;
	let option1;
	let option2;
	let select_name_value;
	let t5;
	let button;
	let current;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*isInputNameVisible*/ ctx[2]) return create_if_block;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	button = new Button({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button.$on("click", /*handleDelete*/ ctx[6]);

	const block = {
		c: function create() {
			div1 = element("div");
			if_block.c();
			t0 = space();
			div0 = element("div");
			input = element("input");
			t1 = space();
			select = element("select");
			option0 = element("option");
			option0.textContent = "Доллар";
			option1 = element("option");
			option1.textContent = "Евро";
			option2 = element("option");
			option2.textContent = "Рубли";
			t5 = space();
			create_component(button.$$.fragment);
			attr_dev(input, "class", "input svelte-17f3dl6");
			attr_dev(input, "type", "number");
			attr_dev(input, "placeholder", "cумма");
			attr_dev(input, "name", input_name_value = `${/*id*/ ctx[0]}Amount`);
			add_location(input, file$3, 108, 4, 2167);
			option0.__value = "USD";
			option0.value = option0.__value;
			add_location(option0, file$3, 115, 6, 2385);
			option1.__value = "EUR";
			option1.value = option1.__value;
			add_location(option1, file$3, 116, 6, 2427);
			option2.__value = "RUB";
			option2.value = option2.__value;
			add_location(option2, file$3, 117, 6, 2467);
			attr_dev(select, "class", "select svelte-17f3dl6");
			attr_dev(select, "name", select_name_value = `${/*id*/ ctx[0]}Currency`);
			if (/*currencyValue*/ ctx[5] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[15].call(select));
			add_location(select, file$3, 114, 4, 2305);
			attr_dev(div0, "class", "field svelte-17f3dl6");
			add_location(div0, file$3, 107, 2, 2143);
			attr_dev(div1, "class", "container svelte-17f3dl6");
			add_location(div1, file$3, 90, 0, 1684);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			if_block.m(div1, null);
			append_dev(div1, t0);
			append_dev(div1, div0);
			append_dev(div0, input);
			set_input_value(input, /*amountValue*/ ctx[4]);
			append_dev(div0, t1);
			append_dev(div0, select);
			append_dev(select, option0);
			append_dev(select, option1);
			append_dev(select, option2);
			select_option(select, /*currencyValue*/ ctx[5]);
			append_dev(div1, t5);
			mount_component(button, div1, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen_dev(input, "input", /*input_input_handler_1*/ ctx[14]),
					listen_dev(select, "change", /*select_change_handler*/ ctx[15])
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div1, t0);
				}
			}

			if (!current || dirty & /*id*/ 1 && input_name_value !== (input_name_value = `${/*id*/ ctx[0]}Amount`)) {
				attr_dev(input, "name", input_name_value);
			}

			if (dirty & /*amountValue*/ 16 && to_number(input.value) !== /*amountValue*/ ctx[4]) {
				set_input_value(input, /*amountValue*/ ctx[4]);
			}

			if (!current || dirty & /*id*/ 1 && select_name_value !== (select_name_value = `${/*id*/ ctx[0]}Currency`)) {
				attr_dev(select, "name", select_name_value);
			}

			if (dirty & /*currencyValue*/ 32) {
				select_option(select, /*currencyValue*/ ctx[5]);
			}

			const button_changes = {};

			if (dirty & /*$$scope*/ 131072) {
				button_changes.$$scope = { dirty, ctx };
			}

			button.$set(button_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(button.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(button.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			if_block.d();
			destroy_component(button);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Input", slots, []);
	let { name } = $$props;
	let { amount } = $$props;
	let { currency } = $$props;
	let { id = "" } = $$props;
	let inputRef = null;
	const dispatch = createEventDispatcher();

	function handleDelete(e) {
		e.preventDefault();
		dispatch("delete", id);
	}

	async function handleClickOnName() {
		$$invalidate(2, isInputNameVisible = !isInputNameVisible);
		await tick();
		inputRef.focus();
	}

	const writable_props = ["name", "amount", "currency", "id"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
	});

	function input_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			inputRef = $$value;
			$$invalidate(1, inputRef);
		});
	}

	function input_input_handler() {
		accountName = this.value;
		($$invalidate(3, accountName), $$invalidate(8, name));
	}

	const blur_handler = () => $$invalidate(2, isInputNameVisible = !isInputNameVisible);

	function input_input_handler_1() {
		amountValue = to_number(this.value);
		($$invalidate(4, amountValue), $$invalidate(9, amount));
	}

	function select_change_handler() {
		currencyValue = select_value(this);
		($$invalidate(5, currencyValue), $$invalidate(10, currency));
	}

	$$self.$$set = $$props => {
		if ("name" in $$props) $$invalidate(8, name = $$props.name);
		if ("amount" in $$props) $$invalidate(9, amount = $$props.amount);
		if ("currency" in $$props) $$invalidate(10, currency = $$props.currency);
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		tick,
		Button,
		name,
		amount,
		currency,
		id,
		inputRef,
		dispatch,
		handleDelete,
		handleClickOnName,
		isInputNameVisible,
		accountName,
		amountValue,
		currencyValue
	});

	$$self.$inject_state = $$props => {
		if ("name" in $$props) $$invalidate(8, name = $$props.name);
		if ("amount" in $$props) $$invalidate(9, amount = $$props.amount);
		if ("currency" in $$props) $$invalidate(10, currency = $$props.currency);
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("inputRef" in $$props) $$invalidate(1, inputRef = $$props.inputRef);
		if ("isInputNameVisible" in $$props) $$invalidate(2, isInputNameVisible = $$props.isInputNameVisible);
		if ("accountName" in $$props) $$invalidate(3, accountName = $$props.accountName);
		if ("amountValue" in $$props) $$invalidate(4, amountValue = $$props.amountValue);
		if ("currencyValue" in $$props) $$invalidate(5, currencyValue = $$props.currencyValue);
	};

	let isInputNameVisible;
	let accountName;
	let amountValue;
	let currencyValue;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*name*/ 256) {
			 $$invalidate(2, isInputNameVisible = !name);
		}

		if ($$self.$$.dirty & /*name*/ 256) {
			 $$invalidate(3, accountName = name || "");
		}

		if ($$self.$$.dirty & /*amount*/ 512) {
			 $$invalidate(4, amountValue = amount || "");
		}

		if ($$self.$$.dirty & /*currency*/ 1024) {
			 $$invalidate(5, currencyValue = currency || "USD");
		}

		if ($$self.$$.dirty & /*accountName, amountValue, currencyValue, id*/ 57) {
			 {
				if (accountName && amountValue && currencyValue) {
					dispatch("message", {
						id,
						name: accountName,
						amount: amountValue,
						currency: currencyValue
					});
				}
			}
		}
	};

	return [
		id,
		inputRef,
		isInputNameVisible,
		accountName,
		amountValue,
		currencyValue,
		handleDelete,
		handleClickOnName,
		name,
		amount,
		currency,
		input_binding,
		input_input_handler,
		blur_handler,
		input_input_handler_1,
		select_change_handler
	];
}

class Input extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 8, amount: 9, currency: 10, id: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Input",
			options,
			id: create_fragment$3.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*name*/ ctx[8] === undefined && !("name" in props)) {
			console.warn("<Input> was created without expected prop 'name'");
		}

		if (/*amount*/ ctx[9] === undefined && !("amount" in props)) {
			console.warn("<Input> was created without expected prop 'amount'");
		}

		if (/*currency*/ ctx[10] === undefined && !("currency" in props)) {
			console.warn("<Input> was created without expected prop 'currency'");
		}
	}

	get name() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get amount() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set amount(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get currency() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set currency(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/money.svelte generated by Svelte v3.29.4 */
const file$4 = "src/components/money.svelte";

function create_fragment$4(ctx) {
	let span;
	let t0_value = round(/*amount*/ ctx[0], /*withK*/ ctx[2]) + "";
	let t0;
	let t1;
	let t2_value = getCurrencySymbol(/*currency*/ ctx[1]) + "";
	let t2;

	const block = {
		c: function create() {
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			t2 = text(t2_value);
			attr_dev(span, "class", "sum svelte-pc0dcg");
			add_location(span, file$4, 14, 0, 215);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t0);
			append_dev(span, t1);
			append_dev(span, t2);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*amount, withK*/ 5 && t0_value !== (t0_value = round(/*amount*/ ctx[0], /*withK*/ ctx[2]) + "")) set_data_dev(t0, t0_value);
			if (dirty & /*currency*/ 2 && t2_value !== (t2_value = getCurrencySymbol(/*currency*/ ctx[1]) + "")) set_data_dev(t2, t2_value);
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Money", slots, []);
	let { amount = "Mistake" } = $$props;
	let { currency } = $$props;
	let { withK = false } = $$props;
	const writable_props = ["amount", "currency", "withK"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Money> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("amount" in $$props) $$invalidate(0, amount = $$props.amount);
		if ("currency" in $$props) $$invalidate(1, currency = $$props.currency);
		if ("withK" in $$props) $$invalidate(2, withK = $$props.withK);
	};

	$$self.$capture_state = () => ({
		round,
		getCurrencySymbol,
		amount,
		currency,
		withK
	});

	$$self.$inject_state = $$props => {
		if ("amount" in $$props) $$invalidate(0, amount = $$props.amount);
		if ("currency" in $$props) $$invalidate(1, currency = $$props.currency);
		if ("withK" in $$props) $$invalidate(2, withK = $$props.withK);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [amount, currency, withK];
}

class Money extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { amount: 0, currency: 1, withK: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Money",
			options,
			id: create_fragment$4.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*currency*/ ctx[1] === undefined && !("currency" in props)) {
			console.warn("<Money> was created without expected prop 'currency'");
		}
	}

	get amount() {
		throw new Error("<Money>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set amount(value) {
		throw new Error("<Money>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get currency() {
		throw new Error("<Money>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set currency(value) {
		throw new Error("<Money>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get withK() {
		throw new Error("<Money>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set withK(value) {
		throw new Error("<Money>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/savingHistory/savingHistoryItem.svelte generated by Svelte v3.29.4 */
const file$5 = "src/components/savingHistory/savingHistoryItem.svelte";

function create_fragment$5(ctx) {
	let div;
	let span0;
	let t0_value = /*item*/ ctx[0].date + "";
	let t0;
	let t1;
	let money0;
	let t2;
	let span1;
	let money1;
	let current;

	money0 = new Money({
			props: {
				amount: /*item*/ ctx[0].RUB,
				currency: "RUB"
			},
			$$inline: true
		});

	money1 = new Money({
			props: {
				amount: /*diffAmount*/ ctx[1],
				currency: "RUB",
				withK: true
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = text(":\n    ");
			create_component(money0.$$.fragment);
			t2 = space();
			span1 = element("span");
			create_component(money1.$$.fragment);
			add_location(span0, file$5, 35, 2, 713);
			attr_dev(span1, "class", "diff svelte-1kaa4u7");
			toggle_class(span1, "green", /*diffAmount*/ ctx[1] >= 0);
			toggle_class(span1, "red", /*diffAmount*/ ctx[1] < 0);
			add_location(span1, file$5, 39, 2, 796);
			attr_dev(div, "class", "sum svelte-1kaa4u7");
			add_location(div, file$5, 34, 0, 693);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, span0);
			append_dev(span0, t0);
			append_dev(span0, t1);
			mount_component(money0, span0, null);
			append_dev(div, t2);
			append_dev(div, span1);
			mount_component(money1, span1, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if ((!current || dirty & /*item*/ 1) && t0_value !== (t0_value = /*item*/ ctx[0].date + "")) set_data_dev(t0, t0_value);
			const money0_changes = {};
			if (dirty & /*item*/ 1) money0_changes.amount = /*item*/ ctx[0].RUB;
			money0.$set(money0_changes);
			const money1_changes = {};
			if (dirty & /*diffAmount*/ 2) money1_changes.amount = /*diffAmount*/ ctx[1];
			money1.$set(money1_changes);

			if (dirty & /*diffAmount*/ 2) {
				toggle_class(span1, "green", /*diffAmount*/ ctx[1] >= 0);
			}

			if (dirty & /*diffAmount*/ 2) {
				toggle_class(span1, "red", /*diffAmount*/ ctx[1] < 0);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(money0.$$.fragment, local);
			transition_in(money1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(money0.$$.fragment, local);
			transition_out(money1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(money0);
			destroy_component(money1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$5.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SavingHistoryItem", slots, []);
	let { item } = $$props;
	let { prevItem } = $$props;
	const prevAmount = prevItem ? prevItem.RUB : 0;
	const writable_props = ["item", "prevItem"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SavingHistoryItem> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("item" in $$props) $$invalidate(0, item = $$props.item);
		if ("prevItem" in $$props) $$invalidate(2, prevItem = $$props.prevItem);
	};

	$$self.$capture_state = () => ({
		round,
		Money,
		item,
		prevItem,
		prevAmount,
		diffAmount
	});

	$$self.$inject_state = $$props => {
		if ("item" in $$props) $$invalidate(0, item = $$props.item);
		if ("prevItem" in $$props) $$invalidate(2, prevItem = $$props.prevItem);
		if ("diffAmount" in $$props) $$invalidate(1, diffAmount = $$props.diffAmount);
	};

	let diffAmount;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*prevItem, item*/ 5) {
			 $$invalidate(1, diffAmount = prevItem ? round(item.RUB - prevAmount) : 0);
		}
	};

	return [item, diffAmount, prevItem];
}

class SavingHistoryItem extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { item: 0, prevItem: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SavingHistoryItem",
			options,
			id: create_fragment$5.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
			console.warn("<SavingHistoryItem> was created without expected prop 'item'");
		}

		if (/*prevItem*/ ctx[2] === undefined && !("prevItem" in props)) {
			console.warn("<SavingHistoryItem> was created without expected prop 'prevItem'");
		}
	}

	get item() {
		throw new Error("<SavingHistoryItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set item(value) {
		throw new Error("<SavingHistoryItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get prevItem() {
		throw new Error("<SavingHistoryItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set prevItem(value) {
		throw new Error("<SavingHistoryItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/components/savingHistory/savingHistory.svelte generated by Svelte v3.29.4 */
const file$6 = "src/components/savingHistory/savingHistory.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[1] = list[i];
	child_ctx[3] = i;
	return child_ctx;
}

// (14:2) {#each $savingsHistory as item, index}
function create_each_block$1(ctx) {
	let item;
	let current;

	item = new SavingHistoryItem({
			props: {
				item: /*item*/ ctx[1],
				prevItem: /*$savingsHistory*/ ctx[0][/*index*/ ctx[3] - 1]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(item.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(item, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const item_changes = {};
			if (dirty & /*$savingsHistory*/ 1) item_changes.item = /*item*/ ctx[1];
			if (dirty & /*$savingsHistory*/ 1) item_changes.prevItem = /*$savingsHistory*/ ctx[0][/*index*/ ctx[3] - 1];
			item.$set(item_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(item.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(item.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(item, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(14:2) {#each $savingsHistory as item, index}",
		ctx
	});

	return block;
}

function create_fragment$6(ctx) {
	let div;
	let current;
	let each_value = /*$savingsHistory*/ ctx[0];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "container svelte-fcdr2j");
			add_location(div, file$6, 12, 0, 199);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*$savingsHistory*/ 1) {
				each_value = /*$savingsHistory*/ ctx[0];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	let $savingsHistory;
	validate_store(savingsHistory, "savingsHistory");
	component_subscribe($$self, savingsHistory, $$value => $$invalidate(0, $savingsHistory = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SavingHistory", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SavingHistory> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({ savingsHistory, Item: SavingHistoryItem, $savingsHistory });
	return [$savingsHistory];
}

class SavingHistory extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SavingHistory",
			options,
			id: create_fragment$6.name
		});
	}
}

const data = {
  columns: [
    [
      1542412800000,
      1542499200000,
      1542412800000,
      1542499200000,
      1542412800000,
      154249920000,
    ],
    [1467352.93, 1567352.93, 1367352.93, 1067352.93, 1367352.93, 1067352.93],
  ],
  types: { y0: "line", y1: "line", x: "x" },
  names: { y0: "#0", y1: "#1" },
  colors: { y0: "#64aded", y1: "#9ed448", y2: "#f79e39" },
};

function formateDate(value, type) {
    const day = new Date(value).getDate();
    const month = new Date(value).toLocaleString("en", {
      month: type
    });

    return `${day} ${month}`;
  }

/* src/components/diagram.svelte generated by Svelte v3.29.4 */

const { Object: Object_1 } = globals;
const file$7 = "src/components/diagram.svelte";

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[47] = list[i];
	child_ctx[49] = i;
	return child_ctx;
}

// (313:4) {#if tooltip}
function create_if_block$1(ctx) {
	let div;
	let p;
	let t0_value = /*tooltip*/ ctx[4].date + "";
	let t0;
	let t1;
	let section;
	let each_value = /*tooltip*/ ctx[4].views;
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			div = element("div");
			p = element("p");
			t0 = text(t0_value);
			t1 = space();
			section = element("section");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(p, "class", "date svelte-vkvvsm");
			add_location(p, file$7, 316, 8, 7016);
			attr_dev(section, "class", "info");
			add_location(section, file$7, 317, 8, 7059);
			attr_dev(div, "class", "tooltip tooltip--light svelte-vkvvsm");
			set_style(div, "top", "10px");
			set_style(div, "left", /*tooltip*/ ctx[4].x - 65 + "px");
			add_location(div, file$7, 313, 6, 6911);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, p);
			append_dev(p, t0);
			append_dev(div, t1);
			append_dev(div, section);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(section, null);
			}
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*tooltip*/ 16 && t0_value !== (t0_value = /*tooltip*/ ctx[4].date + "")) set_data_dev(t0, t0_value);

			if (dirty[0] & /*colors, tooltip, yData*/ 19) {
				each_value = /*tooltip*/ ctx[4].views;
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(section, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*tooltip*/ 16) {
				set_style(div, "left", /*tooltip*/ ctx[4].x - 65 + "px");
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(313:4) {#if tooltip}",
		ctx
	});

	return block;
}

// (319:10) {#each tooltip.views as views, i}
function create_each_block$2(ctx) {
	let div;
	let t0_value = Object.keys(/*yData*/ ctx[0])[/*i*/ ctx[49]] + "";
	let t0;
	let t1;
	let span;
	let t2_value = /*views*/ ctx[47] + "";
	let t2;
	let t3;

	const block = {
		c: function create() {
			div = element("div");
			t0 = text(t0_value);
			t1 = text(":\n              ");
			span = element("span");
			t2 = text(t2_value);
			t3 = space();
			add_location(span, file$7, 321, 14, 7238);
			attr_dev(div, "class", "views svelte-vkvvsm");
			set_style(div, "color", /*colors*/ ctx[1][/*i*/ ctx[49]]);
			add_location(div, file$7, 319, 12, 7138);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t0);
			append_dev(div, t1);
			append_dev(div, span);
			append_dev(span, t2);
			append_dev(div, t3);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*yData*/ 1 && t0_value !== (t0_value = Object.keys(/*yData*/ ctx[0])[/*i*/ ctx[49]] + "")) set_data_dev(t0, t0_value);
			if (dirty[0] & /*tooltip*/ 16 && t2_value !== (t2_value = /*views*/ ctx[47] + "")) set_data_dev(t2, t2_value);

			if (dirty[0] & /*colors*/ 2) {
				set_style(div, "color", /*colors*/ ctx[1][/*i*/ ctx[49]]);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$2.name,
		type: "each",
		source: "(319:10) {#each tooltip.views as views, i}",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let div1;
	let div0;
	let canvas;
	let t;
	let div0_style_value;
	let mounted;
	let dispose;
	let if_block = /*tooltip*/ ctx[4] && create_if_block$1(ctx);

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			canvas = element("canvas");
			t = space();
			if (if_block) if_block.c();
			attr_dev(canvas, "class", "cnvs svelte-vkvvsm");
			attr_dev(canvas, "width", /*widthCanvas*/ ctx[7]);
			attr_dev(canvas, "height", "504px");
			set_style(canvas, "transform", "translateX(" + /*currentPositionX*/ ctx[5] + "px)");
			add_location(canvas, file$7, 304, 4, 6684);
			attr_dev(div0, "class", "chart svelte-vkvvsm");

			attr_dev(div0, "style", div0_style_value = /*isMouseDown*/ ctx[6]
			? "cursor: grabbing"
			: "cursor: grab");

			add_location(div0, file$7, 296, 2, 6417);
			attr_dev(div1, "class", "chart-two svelte-vkvvsm");
			add_location(div1, file$7, 295, 0, 6391);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, canvas);
			/*canvas_binding*/ ctx[13](canvas);
			append_dev(div0, t);
			if (if_block) if_block.m(div0, null);
			/*div0_binding*/ ctx[14](div0);

			if (!mounted) {
				dispose = [
					listen_dev(canvas, "mouseover", /*handleMouseEnter*/ ctx[11], false, false, false),
					listen_dev(div0, "mousemove", /*handleMouseMove*/ ctx[8], false, false, false),
					listen_dev(div0, "mousedown", /*handleMouseDown*/ ctx[9], false, false, false),
					listen_dev(div0, "mouseleave", /*handleMouseLeave*/ ctx[10], false, false, false),
					listen_dev(div0, "mouseup", /*mouseup_handler*/ ctx[15], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*currentPositionX*/ 32) {
				set_style(canvas, "transform", "translateX(" + /*currentPositionX*/ ctx[5] + "px)");
			}

			if (/*tooltip*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(div0, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*isMouseDown*/ 64 && div0_style_value !== (div0_style_value = /*isMouseDown*/ ctx[6]
			? "cursor: grabbing"
			: "cursor: grab")) {
				attr_dev(div0, "style", div0_style_value);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			/*canvas_binding*/ ctx[13](null);
			if (if_block) if_block.d();
			/*div0_binding*/ ctx[14](null);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$7.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Diagram", slots, []);
	let canvasRef;
	let chartRef;
	let ratio = 0;
	let ctx;
	let { xData } = $$props;
	let { yData } = $$props;
	let { colors } = $$props;
	let widthColumn = 50;
	let tooltip;
	let limit = 0;
	let currentPositionX = 0;
	let initialPositionX = 0;
	let isMouseDown = false;
	let positionXMap = 0;
	let offset = 0;
	let previousIndex;
	let currentColumn;
	let rightBorderMap;
	let leftBorderMap;
	const widthCanvas = xData.length * widthColumn;
	const dataArray = xData.map((val, i) => i * widthColumn);
	const dataKeys = Object.keys(yData);
	let endDay;
	let startDay;

	onMount(() => {
		if (canvasRef.getContext) {
			ctx = canvasRef.getContext("2d");
			draw();
		}
	});

	afterUpdate(() => {
		offset = chartRef.offsetLeft;
	});

	const draw = () => {
		drawRectangle(ctx, 5);
		drawAxis(ctx);
		drawTextX(ctx);
		drawTextY(ctx);
	};

	const drawRectangle = (ctx, h) => {
		const width = h === 5 ? widthColumn : 1000 / xData.length;
		const devider = (Math.max(...yData) + 50) / 100;

		for (let i = 0; i < xData.length; i++) {
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(i * width + width, h * 100 - yData[i] * h / devider);
			ctx.lineTo((i + 1) * width + width, h * 100 - yData[i + 1] * h / devider);
			ctx.strokeStyle = colors[0];
			ctx.stroke();
		}
	};

	const drawAxis = ctx => {
		for (let i = 0; i < 5; i++) {
			ctx.fillStyle = "#eee";
			ctx.lineWidth = 0.2;
			ctx.beginPath();
			ctx.moveTo(widthColumn, 92 * i);
			ctx.lineTo(widthCanvas * 3, 92 * i);
			ctx.strokeStyle = "#000";
			ctx.stroke();
		}
	};

	const drawTextX = ctx => {
		ctx.fillStyle = "#a6a6a6";

		for (let i = 0; i < xData.length; i++) {
			if (i % 5 === 0) {
				const date = formateDate(xData[i], "short");
				ctx.font = "14px Roboto";
				ctx.fillText(date, widthColumn * (i + 1), 480);
			}
		}
	};

	const drawTextY = (ctx, y = 15) => {
		const devider = (Math.max(...yData) + 50) / 100;
		ctx.fillStyle = "#737373";

		for (let i = 0; i < 5; i++) {
			ctx.font = "14px Roboto";
			ctx.fillText(round(100 * devider - i * 20 * devider, true), y, i * 92 - 5);
		}
	};

	const drawLine = index => {
		ctx.beginPath();
		ctx.moveTo(index * widthColumn + widthColumn, 0);
		ctx.lineTo(index * widthColumn + widthColumn, 504);
		ctx.lineWidth = 0.3;
		ctx.strokeStyle = "#000";
		ctx.stroke();
	};

	const drawPoint = index => {
		const devider = (Math.max(...yData) + 50) / 100;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(index * widthColumn + widthColumn, 500 - yData[index] / devider * 5, 5, 0, Math.PI * 2);
		ctx.strokeStyle = "#C9AF4F";
		ctx.stroke();
	};

	const getLimitBorder = x => {
		if (!currentColumn || !isMouseDown) {
			currentColumn = findColumnIndex(x);
		}

		limit = currentColumn * widthColumn + widthColumn + currentPositionX;
	};

	const findColumnIndex = (x, dataArray = columns) => {
		const position = x - offset;
		return dataArray.findIndex((column, i) => column <= position && position <= dataArray[i + 1]);
	};

	const checkTooltipBorders = x => {
		let rightX = x - offset;

		if (rightX < 100) {
			rightX = 100;
		}

		if (rightX > 940) {
			rightX = 940;
		}

		return rightX;
	};

	const updateDataTooltip = e => {
		const index = findColumnIndex(e.clientX);
		const dateColumn = formateDate(xData[index], "long");

		$$invalidate(4, tooltip = {
			...tooltip,
			date: dateColumn,
			views: [yData[index]]
		});
	};

	const updatePositionTooltip = e => {
		$$invalidate(4, tooltip = {
			...tooltip,
			x: checkTooltipBorders(e.clientX),
			y: e.clientY
		});
	};

	const renderTooltip = e => {
		if (!chartRef.contains(e.target)) {
			$$invalidate(4, tooltip = null);
			return;
		}

		updateDataTooltip(e);
		updatePositionTooltip(e);
	};

	const checkChartBorders = (x, translate, widthChart) => {
		let position = translate;
		const currentWidth = xData.length * widthColumn - 1000;

		if (translate >= currentWidth) {
			return -currentWidth + 10;
		}

		if (translate <= 0) {
			position = 0;
		} else {
			position = -translate;
		}

		return position;
	};

	const drawCurrenValue = e => {
		const index = findColumnIndex(e.clientX);

		if (previousIndex === index) {
			return;
		}

		previousIndex = index;
		ctx.clearRect(0, 0, widthCanvas * 3, 504);
		draw();
		drawPoint(index);
		drawLine(index);
	};

	const handleMouseMove = e => {
		if (isMouseDown) {
			const translate = -1 * (e.clientX - initialPositionX);
			$$invalidate(5, currentPositionX = checkChartBorders(e.clientX, translate));
			positionXMap = currentPositionX / ratio;
			leftBorderMap = -currentPositionX / ratio;
			rightBorderMap = (-currentPositionX + 1000) / ratio;
			updatePositionTooltip(e);
		} else {
			renderTooltip(e);
		}

		drawCurrenValue(e);
		getLimitBorder(e.clientX);
	};

	const handleMouseDown = e => {
		initialPositionX = e.pageX + -1 * currentPositionX;
		$$invalidate(6, isMouseDown = true);
	};

	const handleMouseLeave = () => {
		$$invalidate(6, isMouseDown = false);
		$$invalidate(4, tooltip = null);
	};

	const handleMouseEnter = e => {
		renderTooltip(e);
	};

	const writable_props = ["xData", "yData", "colors"];

	Object_1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Diagram> was created with unknown prop '${key}'`);
	});

	function canvas_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			canvasRef = $$value;
			$$invalidate(2, canvasRef);
		});
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			chartRef = $$value;
			$$invalidate(3, chartRef);
		});
	}

	const mouseup_handler = () => $$invalidate(6, isMouseDown = false);

	$$self.$$set = $$props => {
		if ("xData" in $$props) $$invalidate(12, xData = $$props.xData);
		if ("yData" in $$props) $$invalidate(0, yData = $$props.yData);
		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
	};

	$$self.$capture_state = () => ({
		onMount,
		afterUpdate,
		data,
		formateDate,
		round,
		canvasRef,
		chartRef,
		ratio,
		ctx,
		xData,
		yData,
		colors,
		widthColumn,
		tooltip,
		limit,
		currentPositionX,
		initialPositionX,
		isMouseDown,
		positionXMap,
		offset,
		previousIndex,
		currentColumn,
		rightBorderMap,
		leftBorderMap,
		widthCanvas,
		dataArray,
		dataKeys,
		endDay,
		startDay,
		draw,
		drawRectangle,
		drawAxis,
		drawTextX,
		drawTextY,
		drawLine,
		drawPoint,
		getLimitBorder,
		findColumnIndex,
		checkTooltipBorders,
		updateDataTooltip,
		updatePositionTooltip,
		renderTooltip,
		checkChartBorders,
		drawCurrenValue,
		handleMouseMove,
		handleMouseDown,
		handleMouseLeave,
		handleMouseEnter,
		columns
	});

	$$self.$inject_state = $$props => {
		if ("canvasRef" in $$props) $$invalidate(2, canvasRef = $$props.canvasRef);
		if ("chartRef" in $$props) $$invalidate(3, chartRef = $$props.chartRef);
		if ("ratio" in $$props) ratio = $$props.ratio;
		if ("ctx" in $$props) ctx = $$props.ctx;
		if ("xData" in $$props) $$invalidate(12, xData = $$props.xData);
		if ("yData" in $$props) $$invalidate(0, yData = $$props.yData);
		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
		if ("widthColumn" in $$props) $$invalidate(29, widthColumn = $$props.widthColumn);
		if ("tooltip" in $$props) $$invalidate(4, tooltip = $$props.tooltip);
		if ("limit" in $$props) limit = $$props.limit;
		if ("currentPositionX" in $$props) $$invalidate(5, currentPositionX = $$props.currentPositionX);
		if ("initialPositionX" in $$props) initialPositionX = $$props.initialPositionX;
		if ("isMouseDown" in $$props) $$invalidate(6, isMouseDown = $$props.isMouseDown);
		if ("positionXMap" in $$props) positionXMap = $$props.positionXMap;
		if ("offset" in $$props) offset = $$props.offset;
		if ("previousIndex" in $$props) previousIndex = $$props.previousIndex;
		if ("currentColumn" in $$props) currentColumn = $$props.currentColumn;
		if ("rightBorderMap" in $$props) rightBorderMap = $$props.rightBorderMap;
		if ("leftBorderMap" in $$props) leftBorderMap = $$props.leftBorderMap;
		if ("endDay" in $$props) endDay = $$props.endDay;
		if ("startDay" in $$props) $$invalidate(26, startDay = $$props.startDay);
		if ("columns" in $$props) columns = $$props.columns;
	};

	let columns;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*xData, currentPositionX*/ 4128) {
			 columns = xData.map((val, i) => i * widthColumn + currentPositionX);
		}

		if ($$self.$$.dirty[0] & /*currentPositionX, startDay*/ 67108896) {
			 {
				$$invalidate(26, startDay = Math.round(-currentPositionX / widthColumn));
				endDay = startDay + Math.round(1000 / widthColumn);
			}
		}
	};

	return [
		yData,
		colors,
		canvasRef,
		chartRef,
		tooltip,
		currentPositionX,
		isMouseDown,
		widthCanvas,
		handleMouseMove,
		handleMouseDown,
		handleMouseLeave,
		handleMouseEnter,
		xData,
		canvas_binding,
		div0_binding,
		mouseup_handler
	];
}

class Diagram extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { xData: 12, yData: 0, colors: 1 }, [-1, -1]);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Diagram",
			options,
			id: create_fragment$7.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*xData*/ ctx[12] === undefined && !("xData" in props)) {
			console.warn("<Diagram> was created without expected prop 'xData'");
		}

		if (/*yData*/ ctx[0] === undefined && !("yData" in props)) {
			console.warn("<Diagram> was created without expected prop 'yData'");
		}

		if (/*colors*/ ctx[1] === undefined && !("colors" in props)) {
			console.warn("<Diagram> was created without expected prop 'colors'");
		}
	}

	get xData() {
		throw new Error("<Diagram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set xData(value) {
		throw new Error("<Diagram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get yData() {
		throw new Error("<Diagram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set yData(value) {
		throw new Error("<Diagram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get colors() {
		throw new Error("<Diagram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set colors(value) {
		throw new Error("<Diagram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/App.svelte generated by Svelte v3.29.4 */

const { Object: Object_1$1, console: console_1 } = globals;
const file$8 = "src/App.svelte";

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i];
	return child_ctx;
}

// (78:2) {#if $status === STATUS.loading}
function create_if_block_2(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Загрузка");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(78:2) {#if $status === STATUS.loading}",
		ctx
	});

	return block;
}

// (79:2) {#if $status === STATUS.failed}
function create_if_block_1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text(/*$error*/ ctx[3]);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*$error*/ 8) set_data_dev(t, /*$error*/ ctx[3]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(79:2) {#if $status === STATUS.failed}",
		ctx
	});

	return block;
}

// (80:2) {#if $status === STATUS.loaded}
function create_if_block$2(ctx) {
	let div;
	let t0;
	let money0;
	let t1;
	let money1;
	let current;

	money0 = new Money({
			props: {
				amount: /*$rates*/ ctx[4].USD,
				currency: "USD"
			},
			$$inline: true
		});

	money1 = new Money({
			props: {
				amount: /*$rates*/ ctx[4].EUR,
				currency: "EUR"
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			t0 = text("Доллар:\n      ");
			create_component(money0.$$.fragment);
			t1 = text("\n      Евро:\n      ");
			create_component(money1.$$.fragment);
			attr_dev(div, "class", "currentRates svelte-1520mhv");
			add_location(div, file$8, 80, 4, 1606);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t0);
			mount_component(money0, div, null);
			append_dev(div, t1);
			mount_component(money1, div, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const money0_changes = {};
			if (dirty & /*$rates*/ 16) money0_changes.amount = /*$rates*/ ctx[4].USD;
			money0.$set(money0_changes);
			const money1_changes = {};
			if (dirty & /*$rates*/ 16) money1_changes.amount = /*$rates*/ ctx[4].EUR;
			money1.$set(money1_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(money0.$$.fragment, local);
			transition_in(money1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(money0.$$.fragment, local);
			transition_out(money1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(money0);
			destroy_component(money1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(80:2) {#if $status === STATUS.loaded}",
		ctx
	});

	return block;
}

// (90:6) {#each financeKeys as key}
function create_each_block$3(ctx) {
	let input;
	let current;

	input = new Input({
			props: {
				id: /*key*/ ctx[11],
				name: /*$finance*/ ctx[1][/*key*/ ctx[11]].name,
				amount: /*$finance*/ ctx[1][/*key*/ ctx[11]].amount,
				currency: /*$finance*/ ctx[1][/*key*/ ctx[11]].currency
			},
			$$inline: true
		});

	input.$on("message", /*handleChange*/ ctx[7]);
	input.$on("delete", /*handleDelete*/ ctx[8]);

	const block = {
		c: function create() {
			create_component(input.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(input, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const input_changes = {};
			if (dirty & /*financeKeys*/ 1) input_changes.id = /*key*/ ctx[11];
			if (dirty & /*$finance, financeKeys*/ 3) input_changes.name = /*$finance*/ ctx[1][/*key*/ ctx[11]].name;
			if (dirty & /*$finance, financeKeys*/ 3) input_changes.amount = /*$finance*/ ctx[1][/*key*/ ctx[11]].amount;
			if (dirty & /*$finance, financeKeys*/ 3) input_changes.currency = /*$finance*/ ctx[1][/*key*/ ctx[11]].currency;
			input.$set(input_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(input.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(input.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(input, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$3.name,
		type: "each",
		source: "(90:6) {#each financeKeys as key}",
		ctx
	});

	return block;
}

// (99:6) <Button on:click={add}>
function create_default_slot$1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Добавить");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$1.name,
		type: "slot",
		source: "(99:6) <Button on:click={add}>",
		ctx
	});

	return block;
}

function create_fragment$8(ctx) {
	let div6;
	let t0;
	let t1;
	let t2;
	let div0;
	let form;
	let t3;
	let button;
	let t4;
	let savinghistory;
	let t5;
	let div5;
	let t6;
	let div1;
	let money0;
	let t7;
	let div2;
	let money1;
	let t8;
	let div3;
	let money2;
	let t9;
	let div4;
	let t10_value = getCurrencySymbol("RUB") + "";
	let t10;
	let t11;
	let t12_value = /*$totalRation*/ ctx[6].RUB + "";
	let t12;
	let t13;
	let t14_value = getCurrencySymbol("EUR") + "";
	let t14;
	let t15;
	let t16_value = /*$totalRation*/ ctx[6].EUR + "";
	let t16;
	let t17;
	let t18_value = getCurrencySymbol("USD") + "";
	let t18;
	let t19;
	let t20_value = /*$totalRation*/ ctx[6].USD + "";
	let t20;
	let t21;
	let t22;
	let piechart;
	let current;
	let if_block0 = /*$status*/ ctx[2] === STATUS.loading && create_if_block_2(ctx);
	let if_block1 = /*$status*/ ctx[2] === STATUS.failed && create_if_block_1(ctx);
	let if_block2 = /*$status*/ ctx[2] === STATUS.loaded && create_if_block$2(ctx);
	let each_value = /*financeKeys*/ ctx[0];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	button = new Button({
			props: {
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	button.$on("click", /*add*/ ctx[9]);
	savinghistory = new SavingHistory({ $$inline: true });

	money0 = new Money({
			props: {
				amount: /*$totalSaving*/ ctx[5].RUB,
				currency: "RUB"
			},
			$$inline: true
		});

	money1 = new Money({
			props: {
				amount: /*$totalSaving*/ ctx[5].USD,
				currency: "USD"
			},
			$$inline: true
		});

	money2 = new Money({
			props: {
				amount: /*$totalSaving*/ ctx[5].EUR,
				currency: "EUR"
			},
			$$inline: true
		});

	piechart = new PieChart({ $$inline: true });

	const block = {
		c: function create() {
			div6 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			div0 = element("div");
			form = element("form");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			create_component(button.$$.fragment);
			t4 = space();
			create_component(savinghistory.$$.fragment);
			t5 = space();
			div5 = element("div");
			t6 = text("Общая сумма:\n    ");
			div1 = element("div");
			create_component(money0.$$.fragment);
			t7 = space();
			div2 = element("div");
			create_component(money1.$$.fragment);
			t8 = space();
			div3 = element("div");
			create_component(money2.$$.fragment);
			t9 = space();
			div4 = element("div");
			t10 = text(t10_value);
			t11 = text(":\n      ");
			t12 = text(t12_value);
			t13 = text("%\n      ");
			t14 = text(t14_value);
			t15 = text(":\n      ");
			t16 = text(t16_value);
			t17 = text("%\n      ");
			t18 = text(t18_value);
			t19 = text(":\n      ");
			t20 = text(t20_value);
			t21 = text("%");
			t22 = space();
			create_component(piechart.$$.fragment);
			attr_dev(form, "class", "form");
			add_location(form, file$8, 88, 4, 1806);
			attr_dev(div0, "class", "stats svelte-1520mhv");
			add_location(div0, file$8, 87, 2, 1782);
			attr_dev(div1, "class", "sum svelte-1520mhv");
			add_location(div1, file$8, 105, 4, 2237);
			attr_dev(div2, "class", "sum svelte-1520mhv");
			add_location(div2, file$8, 108, 4, 2327);
			attr_dev(div3, "class", "sum svelte-1520mhv");
			add_location(div3, file$8, 111, 4, 2417);
			attr_dev(div4, "class", "results sum svelte-1520mhv");
			add_location(div4, file$8, 114, 4, 2507);
			attr_dev(div5, "class", "results svelte-1520mhv");
			add_location(div5, file$8, 103, 2, 2194);
			attr_dev(div6, "class", "app svelte-1520mhv");
			add_location(div6, file$8, 76, 0, 1455);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div6, anchor);
			if (if_block0) if_block0.m(div6, null);
			append_dev(div6, t0);
			if (if_block1) if_block1.m(div6, null);
			append_dev(div6, t1);
			if (if_block2) if_block2.m(div6, null);
			append_dev(div6, t2);
			append_dev(div6, div0);
			append_dev(div0, form);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(form, null);
			}

			append_dev(form, t3);
			mount_component(button, form, null);
			append_dev(div0, t4);
			mount_component(savinghistory, div0, null);
			append_dev(div6, t5);
			append_dev(div6, div5);
			append_dev(div5, t6);
			append_dev(div5, div1);
			mount_component(money0, div1, null);
			append_dev(div5, t7);
			append_dev(div5, div2);
			mount_component(money1, div2, null);
			append_dev(div5, t8);
			append_dev(div5, div3);
			mount_component(money2, div3, null);
			append_dev(div5, t9);
			append_dev(div5, div4);
			append_dev(div4, t10);
			append_dev(div4, t11);
			append_dev(div4, t12);
			append_dev(div4, t13);
			append_dev(div4, t14);
			append_dev(div4, t15);
			append_dev(div4, t16);
			append_dev(div4, t17);
			append_dev(div4, t18);
			append_dev(div4, t19);
			append_dev(div4, t20);
			append_dev(div4, t21);
			append_dev(div6, t22);
			mount_component(piechart, div6, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*$status*/ ctx[2] === STATUS.loading) {
				if (if_block0) ; else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(div6, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*$status*/ ctx[2] === STATUS.failed) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(div6, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*$status*/ ctx[2] === STATUS.loaded) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*$status*/ 4) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$2(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div6, t2);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (dirty & /*financeKeys, $finance, handleChange, handleDelete*/ 387) {
				each_value = /*financeKeys*/ ctx[0];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(form, t3);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			const button_changes = {};

			if (dirty & /*$$scope*/ 16384) {
				button_changes.$$scope = { dirty, ctx };
			}

			button.$set(button_changes);
			const money0_changes = {};
			if (dirty & /*$totalSaving*/ 32) money0_changes.amount = /*$totalSaving*/ ctx[5].RUB;
			money0.$set(money0_changes);
			const money1_changes = {};
			if (dirty & /*$totalSaving*/ 32) money1_changes.amount = /*$totalSaving*/ ctx[5].USD;
			money1.$set(money1_changes);
			const money2_changes = {};
			if (dirty & /*$totalSaving*/ 32) money2_changes.amount = /*$totalSaving*/ ctx[5].EUR;
			money2.$set(money2_changes);
			if ((!current || dirty & /*$totalRation*/ 64) && t12_value !== (t12_value = /*$totalRation*/ ctx[6].RUB + "")) set_data_dev(t12, t12_value);
			if ((!current || dirty & /*$totalRation*/ 64) && t16_value !== (t16_value = /*$totalRation*/ ctx[6].EUR + "")) set_data_dev(t16, t16_value);
			if ((!current || dirty & /*$totalRation*/ 64) && t20_value !== (t20_value = /*$totalRation*/ ctx[6].USD + "")) set_data_dev(t20, t20_value);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block2);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(button.$$.fragment, local);
			transition_in(savinghistory.$$.fragment, local);
			transition_in(money0.$$.fragment, local);
			transition_in(money1.$$.fragment, local);
			transition_in(money2.$$.fragment, local);
			transition_in(piechart.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block2);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(button.$$.fragment, local);
			transition_out(savinghistory.$$.fragment, local);
			transition_out(money0.$$.fragment, local);
			transition_out(money1.$$.fragment, local);
			transition_out(money2.$$.fragment, local);
			transition_out(piechart.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div6);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			destroy_each(each_blocks, detaching);
			destroy_component(button);
			destroy_component(savinghistory);
			destroy_component(money0);
			destroy_component(money1);
			destroy_component(money2);
			destroy_component(piechart);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$8.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	let $finance;
	let $status;
	let $error;
	let $rates;
	let $totalSaving;
	let $totalRation;
	validate_store(finance, "finance");
	component_subscribe($$self, finance, $$value => $$invalidate(1, $finance = $$value));
	validate_store(status, "status");
	component_subscribe($$self, status, $$value => $$invalidate(2, $status = $$value));
	validate_store(error, "error");
	component_subscribe($$self, error, $$value => $$invalidate(3, $error = $$value));
	validate_store(rates, "rates");
	component_subscribe($$self, rates, $$value => $$invalidate(4, $rates = $$value));
	validate_store(totalSaving, "totalSaving");
	component_subscribe($$self, totalSaving, $$value => $$invalidate(5, $totalSaving = $$value));
	validate_store(totalRation, "totalRation");
	component_subscribe($$self, totalRation, $$value => $$invalidate(6, $totalRation = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("App", slots, []);

	onMount(() => {
		initializeSavings();
		getAllCurrency();
	});

	function handleChange({ detail }) {
		console.log(detail);
		updateAccount(detail);
	}

	function handleDelete({ detail }) {
		deleteAccount(detail);
	}

	function add(e) {
		e.preventDefault();
		createAccount();
	}

	const product = { banans: data.columns[1] };
	const writable_props = [];

	Object_1$1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		onMount,
		round,
		getCurrencySymbol,
		initializeSavings,
		getAllCurrency,
		updateAccount,
		createAccount,
		deleteAccount,
		rates,
		status,
		error,
		finance,
		STATUS,
		totalSaving,
		savingsHistory,
		totalRation,
		PieChart,
		Input,
		Button,
		SavingHistory,
		Money,
		Diagram,
		data,
		handleChange,
		handleDelete,
		add,
		product,
		financeKeys,
		$finance,
		$status,
		$error,
		$rates,
		$totalSaving,
		$totalRation
	});

	$$self.$inject_state = $$props => {
		if ("financeKeys" in $$props) $$invalidate(0, financeKeys = $$props.financeKeys);
	};

	let financeKeys;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$finance*/ 2) {
			 $$invalidate(0, financeKeys = $finance ? Object.keys($finance) : []);
		}
	};

	return [
		financeKeys,
		$finance,
		$status,
		$error,
		$rates,
		$totalSaving,
		$totalRation,
		handleChange,
		handleDelete,
		add
	];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment$8.name
		});
	}
}

async function getCurrencyApi(currency) {
    try {
        const result = await fetch(`https://api.exchangeratesapi.io/latest?base=${currency}`);
        const data = await result.json();
        if (!result.ok) {
            throw new Error(data.error);
        }
        return data;
    }
    catch (err) {
        throw err;
    }
}
async function getAllCurrencyApi() {
    try {
        const data = await Promise.all([
            getCurrencyApi("USD"),
            getCurrencyApi("EUR"),
        ]);
        const [{ rates: ratesUSD, date }, { rates: ratesEUR }] = data;
        return {
            ratesUSD,
            ratesEUR,
            date,
        };
    }
    catch (err) {
        throw new Error(err);
    }
}

getAllCurrency.use(getAllCurrencyApi);
status
    .on(getAllCurrency, () => STATUS.loading)
    .on(getAllCurrency.done, () => STATUS.loaded)
    .on(getAllCurrency.fail, () => STATUS.failed);
rates.on(getAllCurrency.doneData, (_, { ratesUSD, ratesEUR }) => ({
    USD: ratesUSD["RUB"],
    EUR: ratesEUR["RUB"],
    RUB: 1,
}));
historyRates.on(getAllCurrency.doneData, (_, { ratesUSD, ratesEUR }) => {
    const oldRatesItemsLS = localStorage.getItem("rates");
    const oldRatesItems = oldRatesItemsLS ? JSON.parse(oldRatesItemsLS) : [];
    const ratesItem = {
        USD: ratesUSD["RUB"],
        EUR: ratesEUR["RUB"],
        RUB: 1,
    };
    if (oldRatesItems.length > 0 && ratesUSD.RUB === oldRatesItems[oldRatesItems.length - 1].USD) {
        return oldRatesItems;
    }
    const allHistory = [...oldRatesItems, ratesItem];
    localStorage.setItem("rates", JSON.stringify(allHistory));
    return allHistory;
});
error.on(getAllCurrency.failData, (_, error) => error);
date.on(getAllCurrency.doneData, (_, { date }) => date);
finance.on(updateAccount, (state, { id, name, amount, currency }) => {
    const newState = {
        ...state,
        [id]: {
            name,
            amount,
            currency,
        },
    };
    localStorage.setItem("data", JSON.stringify(newState));
    return newState;
});
totalSaving.on(updateAccount, (state, { id, name, amount, currency }) => {
    const newState = {
        ...state,
        [id]: {
            name,
            amount,
            currency,
        },
    };
    return newState;
});
finance.on(initializeSavings, (state) => {
    try {
        const data = localStorage.getItem("data");
        return data ? JSON.parse(data) : state;
    }
    catch (err) {
        return state;
    }
});
savingsHistory.on(initializeSavings, (state) => {
    try {
        const data = localStorage.getItem("total");
        const history = data ? JSON.parse(data) : state;
        return history;
    }
    catch (err) {
        return state;
    }
});
saveTotal.use((savingHistory) => {
    return saveTotalToLS(savingHistory);
});
savingsHistory.on(saveTotal.doneData, (_, newHistory) => newHistory);
finance.on(createAccount, (state) => {
    const currentId = Date.now().valueOf();
    return {
        ...state,
        [currentId]: {
            name: "",
            amount: "",
            currency: "USD",
        },
    };
});
finance.on(deleteAccount, (state, id) => {
    const currentState = { ...state };
    delete currentState[id];
    localStorage.setItem("data", JSON.stringify(currentState));
    return currentState;
});
tt({
    from: totalSaving,
    to: saveTotal,
});
function saveTotalToLS(total) {
    const dataFromLS = localStorage.getItem("total");
    const prevHistory = dataFromLS ? JSON.parse(dataFromLS) : [];
    const currentDate = parseDate();
    if (total.EUR === 0 && total.RUB === 0 && total.USD === 0) {
        return prevHistory;
    }
    const newHistoryItem = { ...total, date: currentDate };
    let newHistory = [...prevHistory, newHistoryItem];
    if (prevHistory.map((item) => item.date).includes(currentDate)) {
        newHistory = [...prevHistory.slice(0, -1), newHistoryItem];
    }
    localStorage.setItem("total", JSON.stringify(newHistory));
    return newHistory;
}

const app = new App({
    target: document.body,
});

module.exports = app;
//# sourceMappingURL=bundle.js.map
