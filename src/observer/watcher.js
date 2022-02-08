import { nextTick } from '../util/index'
import { pushTarget, popTarget } from './dep'

let id = 0
class Watcher { //渲染watcher 用户watcher 计算属性watcher
    // vm 实例
    // expOrFn =>  vm._update(vm._render())
    constructor(vm, expOrFn, cb, options={}) {
        this.vm = vm
        this.expOrFn = expOrFn
        this.cb = cb
        this.options = options
        this.lazy = options.lazy // 如果watcher上有lazy属性 说明这是一个计算属性的watcher 一旦标识了是计算属性watcher这个lazy就永远是true了不会再改变
        this.dirty = this.lazy  // dirty代表取值时是否执行用户提供的方法 为true说明数据变化了才执行
        this.user = options.user // 标识是否是用户watcher   默认是渲染watcher
        this.id = id++  //watcher的唯一标识
        this.deps = []; //watcher记录有多少dep依赖它 
        this.depId = new Set(); //对页面上重复取值的属性的dep做去重 如页面上多次调用{{msg}}对应的watcher应该只保存一个dep而不是存进多个相同的dep
        if (typeof expOrFn === "function") {   //用户自定义的watch对象上可能是字符串或者函数 
            this.getter = expOrFn  // 将内部传过来的回调函数 放到getter属性上
        }else{
            this.getter = function(){   // expOrFn传递过来的可能是个字符串如 'a.a.a' 
                // 只有去当前实例上取值时 才会触发依赖收集
                let path = expOrFn.split('.') //['a','a','a']
                let obj = vm
                for(let i =0; i<path.length; ++i){     // vm上 有 a:{ a:{ a:1 } }这个对象 想要监听'a.a.a'值的变化 vm.a.a.a
                    // 第一次从vm上取a这个属性的值并让obj变成vm.a对应的值  此时obj= {a:{a:1}}
                    // 第二次从obj上继续取它a这个属性的值并让obj变成obj.a对应的值 此时obj= {a:1}
                    // 第三次从obj上继续取它a这个属性的值并让obj变成obj.a对应的值 此时obj= 1 
                    // 获取到最终的结果把它保存起来 进行监测
                    obj = obj[path[i]]  
                }
                return obj
            } 
        }
        // 默认会调用一次get方法进行取值 将结果保留起来 这是oldValue
        // 如果是计算属性的话 默认不执行getter方法
        this.value = this.lazy? void 0 : this.get()  //当new Watcher的时候就会执行这个方法  默认会调用get()方法
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
        // 这里的this是Watched的实例 需要改变this指向到当前实例上
        let result = this.getter.call(this.vm);   //调用exprOrFn 也就是执行vm._update(vm._render())  渲染页面 render方法 类似with(vm){_v(msg)}

        // 为什么需要移除watcher 因为有些属性没有在页面上渲染 不需要收集当前的watcher 如页面上没有{{msg}}但在代码里调用vm.msg时会走Object.defineProperty里msg的get()方法 此时的Dep.target没有值 就不会收集这个watcher msg没有依赖watcher 
        // 更改msg的值后页面不会重新渲染因为msg本身就不在渲染页面上  如果不移除watcher 当msg取值时会走Object.defineProperty里msg的get()方法 此时的Dep.target有值 会收集这个watcher 一旦msg的值发生改变就会触发依赖更新 重新渲染页面 造成不必要的渲染 msg本身就不需要在页面上渲染
        popTarget();    // 移除watcher Dep.target = null 
        return result
    }
    // 数据变化需要更新
    update() {
        if(this.lazy){  //是计算属性
            this.dirty = true   //计算属性依赖的数据发生变化 当你取值或页面重新渲染就可以获取到最新的值
        }else{
            // 这里不要每次都调用get方法 get方法会出现渲染页面
            queueWatcher(this);    //暂存的概念 等待着 一起来更新 因为每次调用update的时候 都放入了watcher
            // this.get(); //重新渲染
        }
    }
    // 计算属性求值
    evaluate(){
        this.value = this.get()  //取到计算属性里计算的值
        this.dirty = false  // 取过一次值后置为false表示已经取过值了 依赖的数据没有发生变化就不会再调用计算属性里的方法 这就是计算属性的缓存
    }
    depend(){
        // 计算属性watcher 会存储dep dep会存储watcher 双向记忆
        // 通过计算属性的watcher找到对应的所有dep 让所有的dep 都记住对应的渲染watcher
        let i = this.deps.length
        while(i--){
            this.deps[i].depend()   //让dep去存储渲染watcher
        }
    }
    run() {
        let newValue = this.get();  //新值
        let oldValue = this.value   //老值
        this.value = newValue   //更新当前的值
        if(this.user){  // 如果是用户watcher
            this.cb.call(this.vm,newValue,oldValue)
        }
    }
}

let queue = []  // 将需要批量更新的watcher 存到一个队列里 稍后让watcher执行
let has = {} // 这里用对象进行去重
let pending = false //false表示运行状态 true为等待状态(等待watcher进队列)

// 刷新队列 即清空队列
function flushScheduleQueue() {
    queue.forEach(watcher => {
        watcher.run();
        // 如果是渲染watcher才能执行cb重新渲染页面 如果是用户watcher它会走更新逻辑而不是默认渲染逻辑
        if(!watcher.user){
            watcher.cb();
        }
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