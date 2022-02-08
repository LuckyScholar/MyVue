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
let stack = []  //弄个栈存储对应的watcher

// 页面上有fullName这个变量 它是计算属性 在初始化状态initState里面initComputed的时候发现有计算属性 生成计算属性的watcher  
// vm._computedWatchers用来存放计算属性的watcher 计算属性watcher将对应属性的dep也收集起来 如firstName 和lastName的dep

// 页面挂载mount阶段生成渲染watcher 解析到fullName这个变量就会在fullName对应的dep里把对应的渲染watcher存起来
// 栈里面把渲染watcher存起来  此时第一个入栈的就是渲染watcher
// 之前已经知道fullName是计算属性  通过计算属性的watcher找到对应的所有dep(如firstName 和lastName) 让所有的dep 都记住对应的渲染watcher

// 页面渲染的时候需要对fullName取值 就会走watcher里面的get方法 因为它是计算属性 就会把Dep.target = 计算属性的watcher pushTarget方法同时计算属性的watcher入栈 此时栈顶就是计算属性的watcher
// 调用Watch类里面getter方法获取计算属性对应的值  获取到结果后 popTarget 计算属性的watcher出栈 此时栈中只剩渲染watcher了

// 如果页面需要渲染计算属性对应的值 通过渲染watcher渲染新数据 接着渲染watcher也出栈 最后栈为空

export function pushTarget(watcher) {   
    Dep.target = watcher; //保留watcher
    stack.push(watcher) //有渲染watcher 还有其他的watcher如计算属性watcher 第一个入栈的是渲染watcher然后才是其他的watcher
}
export function popTarget() {
    // Dep.target = null;  //将watcher删掉 不能这么简单粗暴 除了渲染watcher如果还有其他的watcher呢
    stack.pop() //将最外层的watcher删掉
    Dep.target = stack[stack.length-1] // 如果还有其他的watcher存在(如最里层的渲染watcher)就需要记住这个渲染watcher 如果没有就置为null
}
export default Dep

// 多对多的关系 一个属性有一个dep用来收集watcher
// dep可以存多个 watcher
// 一个watcher可以对应多个dep