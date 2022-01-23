// Vue的核心代码 只是Vue的一个声明
import { initMixin } from "./init"
import { renderMixin } from "./render"
import { lifecycleMixin } from "./lifecycle"
import { initGlobalAPI } from "./initGlobalAPI/index"
import { stateMixin } from "./state"

function Vue(options) {
    // 进行Vue的初始化操作
    this._init(options)
}

// 通过引入文件的方式 给Vue原型上添加方法

// 给Vue原型上添加一个_init方法
initMixin(Vue)
renderMixin(Vue)
lifecycleMixin(Vue)
stateMixin(Vue)

// 初始化全集的api
initGlobalAPI(Vue)

// 产生两个虚拟节点进行比对 diff算法测试 
// diff算法的特点是 平级比对O(n),我们正常操作dom元素，很少涉及到父变成子 子变成父 O(n3)

// template => render方法 => vnode
// import { compileToFunction } from './compiler/index';
// import { createElm, patch } from './vdom/patch'
// let vm1 = new Vue({
//     data: {
//         name: 'hello'
//     }
// });
// let render1 = compileToFunction(`<div id="app" a="1" style="background:red">
//     <div style="background:red" key="A">A</div>
//     <div style="background:yellow" key="B">B</div>
//     <div style="background:blue" key="C">C</div>
// </div>`);
// let vnode = render1.call(vm1);

// let el = createElm(vnode);
// document.body.appendChild(el);


// let vm2 = new Vue({
//     data: {
//         name: 'zf',
//         age: 11
//     }
// });
// let render2 = compileToFunction(`<div id="aaa" b="2" style="color:blue">
// <div style="background:green" key="Q">Q</div>
//     <div style="background:red" key="A">A</div>
//     <div style="background:yellow" key="F">F</div>
//     <div style="background:blue" key="C">C</div>
//     <div style="background:blue" key="N">N</div>
// </div>`);
// let newVnode = render2.call(vm2);

// setTimeout(() => {
//     patch(vnode, newVnode); // 传入两个虚拟节点 会在内部进行比对
// }, 3000);

export default Vue

// vue的渲染流程 => 先初始化数据 => 将模板进行编译 => render函数 => 生成虚拟dom => 生成真实dom => 挂载在页面上
