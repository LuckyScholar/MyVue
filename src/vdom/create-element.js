import { isObject, isReservedTag } from "../util/index";
export function createElement(vm, tag, data = {}, ...children) {
    // ast -> render -> 调用
    let key = data.key;
    if (key) {
        delete data.key;
    }

    // 如果是组件 产生虚拟节点时需要把组件的构造函数传进来
    // new Ctor().$mount()
    // 根据tag名字判断是否是组件

    // 表示的是标签 
    if (isReservedTag(tag)) {
        return vnode(tag, data, key, children, undefined);
    } else {
        // 组件  找到组件的定义
        let Ctor = vm.$options.components[tag];
        // 创建组件的虚拟节点 children就是组件的插槽
        return createComponent(vm, tag, data, key, children, Ctor)
    }
}
function createComponent(vm, tag, data, key, children, Ctor) {
    const baseCtor = vm.$options._base; //指的是Vue
    if (isObject(Ctor)) {
        Ctor = baseCtor.extend(Ctor);
    }
    // 给组件增加生命周期
    data.hook = {
        // 初始化组件的时候会调用init方法
        init(vnode) {
            // 当前组件的实例 就是componentInstance
            let child = vnode.componentInstance = new Ctor({ _isComponent: true }); // child就是vm.$el
            // 组件的挂载  组件的$mount方法中是不传递参数的
            child.$mount(); // vm.$el = vnode.componentInstance.$el 指的是当前组件的真是dom
        }
    }

    // vue-component-0-app 组件不写名字的话会默认变成此类型的命名
    return vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, undefined, { Ctor, children })
}


export function createTextNode(vm, text) {
    return vnode(undefined, undefined, undefined, undefined, text);
}

function vnode(tag, data, key, children, text, componentOptions) {
    return {
        tag,
        data,
        key,
        children,
        text,
        componentOptions
    }
}
// 虚拟节点 就是通过_c _v 实现用对象来描述dom的操作 （对象）

// 1) 将template转换成ast语法树-> 生成render方法 -> 生成虚拟dom -> 真实的dom
//  重新生成虚拟dom -> 更新dom

