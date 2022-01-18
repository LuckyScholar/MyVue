class Dep {
    constructor() {
        this.subs = []
    }
    depend() {
        this.subs.push(Dep.target)
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}
Dep.targrt = null; //静态属性 就一分

export function pushTarget(watcher) {
    Dep.target = watcher; //保留watcher
}
export function popTarget() {
    Dep.target = null;  //将watcher删掉
}
export default Dep

// 多对多的关系 一个属性有一个dep用来收集watcher
// dep可以存多个 watcher
// 一个watcher可以对应多个dep