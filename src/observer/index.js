// 把data中的数据 都使用Object.defineProperty重新定义 es5
// Object.defineProperty 不能兼容ie8 及以下  vue2 无法兼容ie8版本

import { isObject, def } from "../util/index"
import {arrayMethods} from './array'

class Observer{
    constructor(value){  // 仅仅是初始化的操作
        // vue如果数据的层次过多 需要递归的去解析对象中的属性，依次增加set和get方法
        // value.__ob__ = this; // 我给每一个监控过的对象都增加一个__ob__属性 给所有响应式数据增加__ob__标识，并且可以在响应式上获取`Observer`实例上的方法
        def(value,'__ob__',this);
        if(Array.isArray(value)){
            // 如果是数组的话并不会对索引进行观测 因为会导致性能问题
            // 前端开发中很少很少 去操作索引 push shift unshift 
            value.__proto__ = arrayMethods;
            // 如果数组里放的是对象我再监控
            this.observerArray(value);
        }else{
             // 对数组监控
            this.walk(value); // 对对象进行观测
        }
    }
    // 监控数组里的每一项是否是对象
    observerArray(data){
        for(let i=0; i< data.length; ++i){
            observe(data[i])
        }
    }
    walk(data){
        let keys = Object.keys(data)
        //劫持对象的每一项设置getter和setter
        keys.forEach(key =>{
            this.defineReactive(data,key,data[key])
        })
    }
    defineReactive(data,key,value){
        // 递归实现深度检测 传进来的value可能是对象
        observe(value)
        Object.defineProperty(data,key,{
            get(){
                // 获取值的时候做一些操作
                return value
            },
            set(newValue){
                console.log('更新数据')
                if(newValue == value) return
                // 继续劫持用户设置的值，因为有可能用户设置的值是一个对象
                observe(newValue)
                data[key] = newValue
                console.log('数据更新为',newValue);
            }
        })
    }

}
export function observe(data){
    let isObj = isObject(data)
    //不是对象的话直接返回
    if(!isObj){
        return
    }
    // 用来观测数据
    return new Observer(data)
}
