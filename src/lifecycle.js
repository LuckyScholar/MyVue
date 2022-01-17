import Watcher from './observer/watcher';
import {patch} from './vdom/patch'

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm  = this;
        console.log('vm.$el',vm.$el);
        vm.$el = patch(vm.$el,vnode); // 需要用虚拟节点创建出真实节点 替换掉 真实的$el
       
        // 我要通过虚拟节点 渲染出真实的dom
      
    }
}

export function mountComponent(vm,el){
    const options = vm.$options; // render
    vm.$el = el; // 给vm实例上添加$el属性并赋值 值是 真实的dom元素  如<div id="app">hello</div>

    // Watcher 就是用来渲染的
    // vm._render 通过解析的render方法 渲染出虚拟dom _c _v _s
    // vm._update 通过虚拟dom 创建真实的dom  

    // 渲染页面
    let updateComponent = () =>{ // 无论是渲染还是更新都会调用此方法
        // 返回的是虚拟dom  vm._render()就是虚拟dom vnode
        vm._update(vm._render());
    }
    // 渲染watcher 每个组件都有一个watcher   
    new Watcher(vm,updateComponent,()=>{},true); // true表示他是一个渲染watcher
}