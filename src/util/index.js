export function isObject(data) {
    return typeof data === "object" && data != null
}

// 给所有响应式数据增加__ob__标识 并设置不可被配置不可被枚举 否则会无限触发监听新增属性停不下来
// Object.defineProperty可以新增属性并给属性赋值的 但无法检测到对象属性的新增或删除
export function def(data, key, value) {
    Object.defineProperty(data, key, {
        configurable: false,
        enumerable: false,
        value,
    })
}

// 取值时实现代理效果
export function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key]
        },
        set(newValue) {
            vm[source][key] = newValue
        },
    })
}

const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed'
];

// 策略对象 里面的每个key对应的都是函数
let strats ={}
// strats.data = function(){

// }
// strats.computer = function(){

// }
// strats.watch = function(){

// }

// 类似这个
// {
//     'created':[fn1,fn2]
// }

// 生命周期的合并
function mergrHook(parentVal,childVal){
    if(childVal){
        if(parentVal){
            return parentVal.concat(childVal);  //父亲和儿子进行拼接返回数组  
        }else{
            return [childVal]   //儿子需要转化为数组 {created:function}需要转换成 [created]
        }
    }else{
        return parentVal    //儿子没值 不合并了直接采用父亲的
    }
}

LIFECYCLE_HOOKS.forEach(hook =>{
    strats[hook] = mergrHook
})

// 全局的Vue.options = {}是父 传入的mixin是子 第一次的时候parent为undefined
export function mergeOptions(parent,child){
    // 遍历父亲 可能是父亲有 儿子没有
    const options ={}
    // 父亲和儿子都有在这里处理
    for(let key in parent){
        mergrFiled(key)
    }
    // 儿子有父亲没有在这里处理
    for(let key in child){  //  如果已经合并过了就不需要再次合并了 将儿子多的赋到父亲上
        if(!parent.hasOwnProperty(key)){
            mergrFiled(key)
        }
    }
    // 默认的合并策略 但是有些属性 需要有特殊的合并方式 
    function mergrFiled(key){
        // 根据key 不同的策略进行合并
        if(strats[key]){
            // 找到对应的key的函数 进行合并并把结果赋给options 类似 options[created] = [created] 策略对象中created这个key对应所有的created函数
            return options[key] = strats[key](parent[key],child[key])
        }
        if(typeof parent[key] === 'object' && typeof child[key] === 'object'){
            options[key] = {
                ...parent[key],
                ...child[key]
            }
        }else if(child[key] == null){
            options[key] = parent[key]
        }else{
            options[key] = child[key]
        }
    }
    return options
}

const callbacks = []
let pending = false
function flushCallbacks(){
    // 方法一
    // callbacks.forEach(cb=>cb()) //让nextTick中传入的方法依次执行
    // callbacks=[]

    //方法二
    while(callbacks.length){
        //让nextTick中传入的方法依次执行
        let cb = callbacks.pop()
        cb();
    }
    pending = false //标识已经执行完毕
}
// 异步方法
let timeFunc;
// 兼容处理异步方法
if(Promise){
    timeFunc = ()=>{
        Promise.resolve().then(flushCallbacks); // 异步处理更新
    }
}else if(MutationObserver){ //可以监测dom变化 dom变化后是异步更新
    let observe = new MutationObserver(flushCallbacks)
    let textNode = document.createTextNode(1)   //先创建一个文本节点
    observe.observe(textNode,{characterData:true})  //监测文本节点中的内容
    timeFunc = ()=>{
        textNode.textContent =2 //文本的内容改为2
    }
}else if(setImmediate){
    timeFunc = ()=>{
        setImmediate(flushCallbacks)
    }
}


// 多次调用nextTick 只会批处理执行一次nextTick
export function nextTick(cb){   // 因为内部会调用nextTick触发依赖更新 用户也会调用自定义的nextTick 但是异步只需要一次
    callbacks.push(cb)
    // pending为true等待状态不会走以下逻辑 表示还没清空队列 就不要再开定时器了 防抖处理
    if(!pending){
        // Vue3里的nextTick原理就是Promise.then() 没有做兼容处理了
        timeFunc()  // 这个方法是异步方法 做了兼容处理
        pending = true
    }
}