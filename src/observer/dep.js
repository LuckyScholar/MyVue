let id = 0;
class Dep {
    constructor() {
        this.subs = [];
        this.id = id++; //dep的唯一标识
    }
    depend() {
        // 我们希望watcher可以存放dep  Dep.target对应的值就是watcher
        // 实现双向记忆 让watcher记住dep的同时 让dep也记住watcher 为后面的computed计算属性做准备
        Dep.target.addDep(this);

        // this.subs.push(Dep.target)
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}
Dep.target = null; //静态属性 就一份

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