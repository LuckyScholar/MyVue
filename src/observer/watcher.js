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
    addDep(dep){
        let id = dep.id
        // 不是同一个dep就存起来 去重
        if(!this.depId.has(id)){
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
        this.get(); //重新渲染
    }
}
export default Watcher


// 在数据劫持的时候 定义defineProperty的时候 已经给每个属性都添加了一个dep
// 1.把这个渲染watcher放在Dep.target属性上
// 2.开始渲染 取值会调用get方法 需要让这个属性的dep 存储当前的watcher
// 3.页面上所有需要渲染的属性都会将这个watcher存在自己的dep中 其他不需要渲染在页面上的属性就不会在自己的dep中存储这个watcher
// 4.等会属性更新了 就重新调用渲染逻辑 通知自己存储的watcher来更新 就是重新调用get方法