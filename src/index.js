// Vue的核心代码 只是Vue的一个声明
import { initMixin } from "./init"
import { renderMixin } from "./render"
import { lifecycleMixin } from "./lifecycle"

function Vue(options) {
    // 进行Vue的初始化操作
    this._init(options)
}

// 通过引入文件的方式 给Vue原型上添加方法

// 给Vue原型上添加一个_init方法
initMixin(Vue)
renderMixin(Vue)
lifecycleMixin(Vue)
export default Vue
