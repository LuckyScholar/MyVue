// 重写数组的方法 7个 push pop shift unshift sort reverse splice 会导致数组本身发生变化

// 先把数组的原型保存起来
let oldArrayMethods = Array.prototype
// value.__proto__ = arrayMethods 原型链查找的问题， 会向上查找，先查找我重写的，重写的没有会继续向上查找
// arrayMethods.__proto__ = oldArrayMethods
export const arrayMethods = Object.create(oldArrayMethods)

const methods = ["push", "shift", "unshift", "pop", "sort", "splice", "reverse"]

methods.forEach(method => {
    // 给arrayMethods添加对应的方法
    arrayMethods[method] = function (...args) {
        const result = oldArrayMethods[method].apply(this, args) // 调用原生的数组方法
        // push unshift 添加的元素可能还是一个对象
        let inserted // 当前用户插入的元素
        // def(value, '__ob__', this) this.__ob__的值是Observer类的实例 可以调用它里面对应的的方法
        let ob = this.__ob__
        switch (method) {
            case "push":
            case "unshift":
                inserted = args
                break
            case "splice": // splice有新增的功能,参数为3个及以上  如arr.splice(0,1,{name:1}) 从下标2开始取值判断是否是调用新增功能 删除的话下标从2开始为undefined
                inserted = args.slice(2)
            default:
                break
        }
        if (inserted) ob.observerArray(inserted) // 将新增属性继续观测
        // 如果用户调用了 如push方法 当前Observer类的实例上有dep属性 我会通知当前这个dep去更新 
        ob.dep.notify(); 
        return result
    }
})
