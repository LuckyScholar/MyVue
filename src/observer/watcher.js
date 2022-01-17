let id = 0
class Watcher {
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm
        this.exprOrFn = exprOrFn
        if (typeof exprOrFn === "function") {
            this.getter = exprOrFn  // 将内部传过来的回调函数 放到getter属性上
        }
        this.cb = cb
        this.options = options
        this.id = id++
        this.get()
    }
    get() {
        this.getter()
    }
}
export default Watcher
