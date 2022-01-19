import { nextTick } from '../util/index'
import { pushTarget, popTarget } from './dep'

let id = 0
class Watcher {
    // vm 实例
    // exprOrFn =>  vm._update(vm._render())
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm
        this.exprOrFn = exprOrFn
        if (typeof exprOrFn === "function") {
            this.getter = exprOrFn  // 将内部传过来的回调函数 放到getter属性上
        }
        this.cb = cb
        this.options = options
        this.id = id++  //watcher的唯一标识
        this.deps = []; //watcher记录有多少dep依赖它 
        this.depId = new Set(); //对页面上重复取值的属性的dep做去重 如页面上多次调用{{msg}}对应的watcher应该只保存一个dep而不是存进多个相同的dep
        this.get()  //当new Watcher的时候就会执行这个方法 
    }
    addDep(dep) {    // watcher 里不能放重复的dep  dep里不能放重复的watcher
        let id = dep.id
        // 不是同一个dep就存起来 去重
        if (!this.depId.has(id)) {
            this.deps.push(dep)
            this.depId.add(id)
            // dep依赖收集 将对应的watcher存起来
            dep.addSub(this)
        }

    }
    get() {
        pushTarget(this);   // this是当前watcher实例 把watcher存起来  Dep.target = this

        // 调用this.getter()时会触发对应属性的取值 如触发vm.msg属性取它对应的值 会走Object.defineProperty里msg的get()方法 进行依赖收集 此时Dep.target有值就会在dep里把对应的watcher收集起来
        this.getter();   //调用exprOrFn 也就是执行vm._update(vm._render())  渲染页面 render方法 类似with(vm){_v(msg)}

        // 为什么需要移除watcher 因为有些属性没有在页面上渲染 不需要收集当前的watcher 如页面上没有{{msg}}但在代码里调用vm.msg时会走Object.defineProperty里msg的get()方法 此时的Dep.target没有值 就不会收集这个watcher msg没有依赖watcher 
        // 更改msg的值后页面不会重新渲染因为msg本身就不在渲染页面上  如果不移除watcher 当msg取值时会走Object.defineProperty里msg的get()方法 此时的Dep.target有值 会收集这个watcher 一旦msg的值发生改变就会触发依赖更新 重新渲染页面 造成不必要的渲染 msg本身就不需要在页面上渲染
        popTarget();    // 移除watcher Dep.target = null 
    }
    update() {
        // 这里不要每次都调用get方法 get方法会出现渲染页面
        queueWatcher(this);    //暂存的概念 等待着 一起来更新 因为每次调用update的时候 都放入了watcher
        // this.get(); //重新渲染
    }
    run() {
        this.get();
    }
}

let queue = []  // 将需要批量更新的watcher 存到一个队列里 稍后让watcher执行
let has = {} // 这里用对象进行去重
let pending = false //false表示运行状态 true为等待状态(等待watcher进队列)

// 刷新队列 即清空队列
function flushScheduleQueue() {
    queue.forEach(watcher => {
        watcher.run();
        watcher.cb();
    })
    queue = []  // 清空watcher队列为了下次使用
    has = {}    //  清空标识的id
    pending = false // 重置为运行状态
}

function queueWatcher(watcher) {
    let id = watcher.id //对watcher进行去重
    if (has[id] == null) {
        queue.push(watcher) //并且将id不同的watcher存进队列
        has[id] = true
        // 等待所有同步代码执行完毕后再执行  
        if (!pending) {   // pending为true等待状态不会走以下逻辑 表示还没清空队列 就不要再开定时器了 防抖处理 
            // 异步代码 先调用默认的页面渲染再调用用户自定义传进来的nextTick回调函数
            nextTick(flushScheduleQueue)
            // 置为等待状态
            pending = true
        }
    }
}
export default Watcher


// 在数据劫持的时候 定义defineProperty的时候 已经给每个属性都添加了一个dep
// 1.把这个渲染watcher放在Dep.target属性上
// 2.开始渲染 取值会调用get方法 需要让这个属性的dep 存储当前的watcher
// 3.页面上所有需要渲染的属性都会将这个watcher存在自己的dep中 其他不需要渲染在页面上的属性就不会在自己的dep中存储这个watcher
// 4.等会属性更新了 就重新调用渲染逻辑 通知自己存储的watcher来更新 就是重新调用get方法

// 在模板中取值时 会进行依赖收集 在更改数据是会进行 对应的watcher调用更新操作
// dep 和 watcher 是一个多对多的关系  dep里存放着相关的watcher 是一个观察者模式