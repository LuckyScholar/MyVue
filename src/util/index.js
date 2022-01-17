export function isObject(data) {
    return typeof data === "object" && data != null
}

// 给所有响应式数据增加__ob__标识 并设置不可被配置不可被枚举 否则会无限触发监听新增属性停不下来
// Object.defineProperty可以新增属性并给属性赋值的 但无法检测到对象属性的新增或删除
export function def(data, key, value) {
    Object.defineProperty(data, key, {
        configurable: false,
        enumerable: false,
        value,
    })
}

// 取值时实现代理效果
export function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key]
        },
        set(newValue) {
            vm[source][key] = newValue
        },
    })
}
