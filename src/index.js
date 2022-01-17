// Vue的核心代码 只是Vue的一个声明
import { initMixin } from "./init"
import { renderMixin } from "./render"
import { lifecycleMixin } from "./lifecycle"
import { initGlobalAPI } from "./initGlobalAPI/index"

function Vue(options) {
    // 进行Vue的初始化操作
    this._init(options)
}

// 通过引入文件的方式 给Vue原型上添加方法

// 给Vue原型上添加一个_init方法
initMixin(Vue)
renderMixin(Vue)
lifecycleMixin(Vue)

// 初始化全集的api
initGlobalAPI(Vue)
export default Vue

// vue的渲染流程 => 先初始化数据 => 将模板进行编译 => render函数 => 生成虚拟dom => 生成真实dom => 挂载在页面上