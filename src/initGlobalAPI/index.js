import { mergeOptions } from '../util/index'
import initExtend from './extend'
export function initGlobalAPI(Vue) {
    // 整合了所有的全局相关的内容 Vue.components Vue.directive 
    Vue.options = {}
    Vue.mixin = function (mixin) {
        // 如何实现两个对象的合并   全局的options = {}是父 传入的mixin是子 (先考虑生命周期)
        this.options = mergeOptions(this.options, mixin)
    }
    // 生命周期的合并策略  [beforeCreate]
    Vue.options._base = Vue // _base 是Vue的构造函数 最终的vue构造函数保留在options对象中
    Vue.options.components = {}

    // 注册extend方法
    initExtend(Vue)

    Vue.component = function (id, definition) {
        // Vue.extend
        definition.name = definition.name || id //默认会以name属性为准 
        // 根据当前组件对象 生成一个子类构造函数
        // 用的时候得 new definition().$mount()

        // 注册全局组件
        // 使用extend 方法 将对象变成构造函数 this.options._base就是Vue的构造函数
        // 子组件可能也有这个VueComponent.component方法
        definition = this.options._base.extend(definition) //  永远是父类

        // Vue.component 注册组件 等价于 Vue.options.components[id] = definition
        Vue.options.components[id] = definition
    }
}
