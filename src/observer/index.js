// 把data中的数据 都使用Object.defineProperty重新定义 es5
// Object.defineProperty 不能兼容ie8 及以下  vue2 无法兼容ie8版本

import { isObject, def } from "../util/index"
import { arrayMethods } from './array'
import Dep from "./dep";

// 后续我可以根据__ob__知道它是不是一个已经观察了的数据 
class Observer {
    constructor(value) {  // 仅仅是初始化的操作

        this.dep = new Dep(); //value={} || value=[] 如果value是对象或数组话在它最外层 整个添加一个dep 
        // 例如子组件里的data是个函数,返回一个对象，对象{obj:{a:1},arr:[1,2,3]}中的obj和arr都添加一个dep 
        // data(){
        //     return {
        //         obj:{},   //obj由{}变成了{a:1}怎么知道呢 或者obj={a:1}通过this.$set(obj,b,1)新增一个属性变成obj{a:1,b:2} 就需要对这个整体对象添加一个dep 收集对应的watcher当数据变化时触发更新渲染
        //         arr:[1,2,3]  //给数组添加一个dep 收集watcher当数组调用那7个方法的时候触发更新
        //     }
        // }

        // vue如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法
        // value.__ob__ = this; // 我给每一个监控过的对象都增加一个__ob__属性 给所有响应式数据增加__ob__标识，并且可以在响应式上获取`Observer`实例上的方法
        def(value, '__ob__', this);
        if (Array.isArray(value)) {
            // 如果是数组的话并不会对索引进行观测 因为会导致性能问题
            // 前端开发中很少很少 去操作索引 push shift unshift 
            value.__proto__ = arrayMethods;
            // 如果数组里放的是对象我再监控
            this.observerArray(value);
        } else {
            // 对对象进行观测
            this.walk(value);
        }
    }
    // 监控数组里的每一项是否是对象
    observerArray(data) {
        for (let i = 0; i < data.length; ++i) {
            observe(data[i])
        }
    }
    walk(data) {
        let keys = Object.keys(data)
        //劫持对象的每一项设置getter和setter
        keys.forEach(key => {
            defineReactive(data, key, data[key])
        })
    }
}

function defineReactive(data, key, value) {
    // 递归实现深度检测 传进来的value可能是对象
    let childOb = observe(value)    // 这里这个value可能是数组 也可能是对象 ，返回的结果是Observer的实例，当前这个value对应的Observer

    let dep = new Dep(); //每个属性都有一个dep
    // 当页面取值时说明这个值用来渲染了 将这个watcher和这个属性对应起来
    Object.defineProperty(data, key, {
        // 页面渲染或者代码使用到相关属性 都会走get方法 取值
        get() { //依赖收集
            if (Dep.target) {
                dep.depend();   //让这个属性记住这个watcher
                if (childOb) {    // 最外层对象或数组的依赖收集 如let arr:[{b:1},2,3] arr对应的这个dep 当对这个对象取值时
                    childOb.dep.depend(); // 收集了最外层对象或数组的相关依赖 将watcher存起来
                }
            }
            return value
        },
        set(newValue) { //依赖更新
            // console.log('更新数据')
            if (newValue === value) return
            // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象
            observe(newValue)
            value = newValue
            // console.log('数据更新为', newValue);

            dep.notify(); //异步更新 防止频繁操作
        }
    })
}

export function observe(data) {
    let isObj = isObject(data)
    //不是对象的话直接返回 不需要return data  observe(data)方法需要返回的是Observer类的实例 如果返回基本数据类型的话就获取不到这个实例里面的dep依赖
    if (!isObj) {
        return
    }
    // 用来观测数据
    return new Observer(data)
}
