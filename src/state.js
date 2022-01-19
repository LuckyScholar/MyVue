import { observe } from "./observer/index.js"
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
function initWatch() {}

export function stateMixin(Vue){
    // 在Vue的原型上挂载$nextTick方法
    Vue.prototype.$nextTick = function(cb){
        nextTick(cb);
    }
}