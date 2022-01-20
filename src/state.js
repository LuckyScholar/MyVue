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

function initProps() {}
function initMethod() {}

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
function initComputed() {}
function initWatch(vm) {
    let watch = vm.$options.watch   //watch是个对象
    for(let key in watch){
        const handler = watch[key]  //handler可能是数组 字符串 对象 函数
        // 是数组
        if(Array.isArray(handler)){
            handler.forEach(handle =>{
                createWatcher(vm,key,handle)
            })
        }else{
            // 字符串 对象 函数情况
            createWatcher(vm,key,handler)
        }
    }
}
// options是用户传过来的选项
// 如
// {
//     deep: true, //深层次遍历监测
//     immediate: true //立即以表达式expOrFn的当前值触发回调
// }
function createWatcher(vm,expOrFn,handler,options){
    if(typeof handler == 'object'){
        // 例如handler为 'a': {
        //     handler(newVal, oldVal) {
        //         console.log('newVal',newVal);
        //     }
        // }
        options = handler
        handler = handler.handler   
    }
    if(typeof handler == 'string'){
        // 例如handler为'a':'aa' 'aa'是函数名
        handler = vm[handler]   //将实例的方法作为handler
    }
    return vm.$watch(expOrFn,handler,options)
}

export function stateMixin(Vue){
    // 在Vue的原型上挂载$nextTick方法
    Vue.prototype.$nextTick = function(cb){
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
    Vue.prototype.$watch = function(expOrFn,cb,options){
        // console.log(expOrFn,handler,options);
        new Watcher(vm,expOrFn,cb,options)
        // 如果是immediate应该立即执行
        if(options.immediate){
            cb()
        }
    }
}


