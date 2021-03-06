import Dep from "./observer/dep.js"
import { observe } from "./observer/index.js"
import Watcher from "./observer/watcher.js"
import { proxy, nextTick } from "./util/index"

export function initState(vm) {
    const opt = vm.$options
    // vue的数据来源 属性 方法 数据 计算属性 watch  先props再data如果属性名重复就会被覆盖
    if (opt.props) {
        initProps(vm)
    }
    if (opt.methods) {
        initMethod(vm)
    }
    if (opt.data) {
        initData(vm)
    }
    if (opt.computed) {
        initComputed(vm)
    }
    if (opt.watch) {
        initWatch(vm)
    }
}

function initProps() { }
function initMethod() { }

// 数据初始化工作
function initData(vm) {
    // 用户传递的data   
    let data = vm.$options.data
    // 判断data是否是函数(函数可以保证组件复用的时候数据不会共用同一个引用) 是的话直接执行获取到返回值返回的是对象 不是函数的话就是对象  并将data定义在vm._data这个属性上 
    data = vm._data = typeof data === "function" ? data.call(vm) : data
    // 对象劫持 用户改变了数据 我希望可以得到通知 => 刷新页面
    // MVVM模式 数据变化可以驱动视图变化 

    // Object.defineProperty () 给属性增加get方法和set方法
    // 为了让用户更好的使用 我希望可以直接vm.xxx 直接调用this.xxx而不是this._data.xxx所以要代理一下
    for (let key in data) {
        proxy(vm, "_data", key)
    }
    //观察数据 observe观察 observer观察者
    observe(data)
}

// 计算属性
function initComputed(vm) {
    let computed = vm.$options.computed
    // 1.需要有watcher 2.还需要有definedProperty 3.dirty
    const watchers = vm._computedWatchers = {} // 用来存放计算属性的watcher
    for (let key in computed) {
        const useDef = computed[key] //取出对应的值来
        // 获取get方法
        const getter = typeof useDef === 'function'? useDef : useDef.get; //watcher使用的
        // 给计算属性里的每个属性都增加了一个watcher
        watchers[key] = new Watcher(vm,getter,()=>{},{lazy:true})   // lazy:true表示是计算属性watcher 默认不执行Watch里面的getter方法
        // definedReactive()需要定义成响应式的数据
        definedComputed(vm, key, useDef)
    }
}

function definedComputed(target, key, useDef) {    //这样写是没有缓存的
    // console.log(target, key, useDef)
    const sharePropertyDefinition = {
        enumerable:true,
        configurable:true,
        get:()=>{},
        set:()=>{}
    }
    if (typeof useDef === 'function') {
        // sharePropertyDefinition.get = useDef    // dirty来控制是否调用 封装成高阶函数
        sharePropertyDefinition.get = createComputedGetter(key)

    } else {
        // sharePropertyDefinition.get = useDef.get    // 需要加缓存
        sharePropertyDefinition.get = createComputedGetter(key)
        sharePropertyDefinition.set = useDef.set
    }
    Object.defineProperty(target, key, sharePropertyDefinition)
}

function createComputedGetter(key){
    return function(){  // 此方法是我们包装的方法 每次取值会调用此方法
        const watcher = this._computedWatchers[key] // 在当前实例上拿到这个属性对应的计算属性watcher
        if(watcher.dirty){  //判断到底要不要执行用户传递的方法 依赖的数据发送变化了变脏了才执行 默认是脏的
            watcher.evaluate()  // 对当前的watcher求值
        }
        if(Dep.target){ // 说明还有渲染watcher 也应该一并的收集起来
            watcher.depend()
        }
        return watcher.value    // 默认返回watcher上存的值
    }

}

function initWatch(vm) {
    let watch = vm.$options.watch   //watch是个对象
    for (let key in watch) {
        const handler = watch[key]  //handler可能是数组 字符串 对象 函数
        // 是数组
        if (Array.isArray(handler)) {
            handler.forEach(handle => {
                createWatcher(vm, key, handle)
            })
        } else {
            // 字符串 对象 函数情况
            createWatcher(vm, key, handler)
        }
    }
}
// options是用户传过来的选项
// 如
// {
//     deep: true, //深层次遍历监测
//     immediate: true //立即以表达式expOrFn的当前值触发回调
// }
function createWatcher(vm, expOrFn, handler, options) {
    if (typeof handler == 'object') {
        // 例如handler为 'a': {
        //     handler(newVal, oldVal) {
        //         console.log('newVal',newVal);
        //     }
        // }
        options = handler
        handler = handler.handler
    }
    if (typeof handler == 'string') {
        // 例如handler为'a':'aa' 'aa'是函数名
        handler = vm[handler]   //将实例的方法作为handler
    }
    return vm.$watch(expOrFn, handler, options)
}

export function stateMixin(Vue) {
    // 在Vue的原型上挂载$nextTick方法
    Vue.prototype.$nextTick = function (cb) {
        nextTick(cb);
    }

    // expOrFn表示字符串或者函数  
    // 如vm.$watch('a.b.c', function (newVal, oldVal) {
    //     // 做点什么
    // })
    // vm.$watch(
    //     function () {
    //       // 表达式 `this.a + this.b` 每次得出一个不同的结果时
    //       // 处理函数都会被调用。
    //       // 这就像监听一个未被定义的计算属性
    //       return this.a + this.b
    //     },
    //     function (newVal, oldVal) {
    //       // 做点什么
    //     }
    // )
    Vue.prototype.$watch = function (expOrFn, cb, options) {
        // 数据应该依赖这个watcher 数据变化后应该让watcher重新执行 这里的options做个合并并标记是用户watcher
        let watcher = new Watcher(this, expOrFn, cb, { ...options, user: true })
        // 如果是immediate应该立即执行
        if (options.immediate) {
            cb()
        }
    }
}


