import { initState } from "./state"
import { compileToFunction } from "./compiler/index.js"
import { mountComponent } from "./lifecycle"

// 在原型上添加一个init方法
export function initMixin(Vue) {
    // 初始化流程
    Vue.prototype._init = function (options) {
        // 数据的劫持
        const vm = this
        // vue中使用 this.$options 指代的就是用户传递的属性
        vm.$options = options

        // 初始化状态
        initState(vm)

        // 如果用户传入了el属性 需要将页面渲染出来
        // 如果用户传入了el 就要实现挂载流程
        if (vm.$options.el) {
            vm.$mount(vm.$options.el)
        }
    }
    Vue.prototype.$mount = function (el) {
        const vm = this
        const options = vm.$options
        // 获取用户传进来的指定挂载的元素节点
        el = document.querySelector(el)
        // 默认先会查找有没有render方法，没有render 会 采用template template也没有就用el中的内容
        if (!options.render) {
            // 对模板进行编译
            let template = options.template // 取出模板
            // 没有模板的话 元素的outerHTML就是模板
            if (!template && el) {
                // innerHTML:从对象的起始位置到终止位置的全部内容, 不包括HTML标签。
                // outerHTML:除了包含innerHTML的全部内容外, 还包含对象标签本身。
                template = el.outerHTML
            }
            // 我们需要将template 转化成render方法 vue1.0 2.0虚拟dom
            const render = compileToFunction(template)
            options.render = render

            // console.log(render);
        }

        // 渲染当前的组件 挂载这个组件 到用户传进来的指定元素节点上
        mountComponent(vm, el)
    }
}
