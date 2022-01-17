import Watcher from './observer/watcher';
import {patch} from './vdom/patch'

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm  = this;
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

    // 挂载前执行beforeMount钩子
    callHook(vm,'beforeMount');
    // 渲染页面
    let updateComponent = () =>{ // 无论是渲染还是更新都会调用此方法
        // 返回的是虚拟dom  vm._render()就是虚拟dom vnode
        vm._update(vm._render());
    }
    // 渲染watcher 每个组件都有一个watcher   
    new Watcher(vm,updateComponent,()=>{},true); // true表示他是一个渲染watcher

    // 挂载后执行mounted钩子
    callHook(vm,'mounted');
}

// 调用生命周期
export function callHook(vm,hook){
    const handlers = vm.$options[hook]; // [fn,fn,fn]
    if(handlers){   // 找到对应的钩子依次执行
        for(let i=0; i< handlers.length; ++i){
            handlers[i].call(vm)    //更改生命周期上的this指向当前的实例
        }
    }
}

// 生命周期怎么实现的:内部每次混合的时候把这些方法做成一个队列存好