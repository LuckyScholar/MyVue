export function patch(oldVnode,vnode){

    // 1.el是id为app的div真实节点 将这个el赋值给vm.$el上 vm.$el = el    注意vm.$el上挂载的是真实节点
    // 2.将传入的模板通过compileToFunction方法生成render函数 
    // 3.render函数生成虚拟dom vnode 
    // 4.vm._update方法 将虚拟dom vnode 创建成真实的dom  真实节点挂载在vnode的el属性上  vnode.el = 真实节点
    // 5.一开始oldVnode就是id为app的div真实节点  vnode 是我们模板产生的虚拟节点
    // 默认初始化的时候 直接用虚拟节点创建出真实节点 替换老节点 即用vnode.el这个真实节点替换vm.$el的真实节点
    // 在更新时 拿老的虚拟节点 和 新的虚拟节点作对比 将不同的地方更新真实的dom  diff算法是同级比较 时间复杂度O(n)
    
    // 举例vnode = {
    //     "tag": "div",
    //     "data": {
    //         "id": "app"
    //     },
    //     "children": [
    //         {
    //             "tag": "p",
    //             "data": {},
    //             "children": [
    //                 {
    //                     "text": "hellojw",
    //                     "el": {}
    //                 }
    //             ],
    //             "el": {}
    //         },
    //         {
    //             "text": "hello",
    //             "el": {}
    //         }
    //     ],
    //     "el": {}
    // }

    // 1.判断是更新还是要渲染
    if(!oldVnode){ // 渲染
        // 通过当前的虚拟节点 创建元素并返回
        return createElm(vnode)
    }else{ // 更新
        const isRealElement = oldVnode.nodeType
        if(isRealElement){
            const oldElm = oldVnode
            const parentElm = oldVnode.parentNode

            let el = createElm(vnode)
            // insertBefore(a,b) 把a节点放在b节点前面  nextSibling 属性可返回紧跟某个元素之后的节点没有的话就是null
            parentElm.insertBefore(el,oldElm.nextSibling)
            parentElm.removeChild(oldElm)

            // 需要将渲染好的结果返回
            return el;
        }else{
            //  1.标签不一致直接替换即可
            if(oldVnode.tag !== vnode.tag){
                // 标签不一致   node.replaceChild(newnode,oldnode) 用新节点替换掉老节点
                oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el)
            }

            // 2.标签一样oldVnode.tag = undefined 就是文本 文本都没有tag 
            if (!oldVnode.tag) { // 这个就是文本的情况, 如果内容不一致直接 替换掉文本
                if (oldVnode.text !== vnode.text) {
                    oldVnode.el.textContent = vnode.text;
                }
            }

            // 3.标签一样 需要开始对比标签的属性和儿子节点
            // 标签一样直接复用即可
            let el = vnode.el = oldVnode.el; //复用老节点

            // 更新属性 用新的虚拟节点的属性和老的比较 去更新节点

            // 新老属性做对比
            updateProperties(vnode,oldVnode.data)

            
        }
        // 递归创建真实节点 替换掉老的节点
    }
    

}

// 根据虚拟节点创建真实的节点
function createElm(vnode){
    let {tag,children,key,data,text} = vnode
    if(typeof tag === 'string'){
        vnode.el = document.createElement(tag)
        updateProperties(vnode)
        children.forEach(child =>{
            // 递归创建儿子节点，将儿子节点扔到父节点中
            return vnode.el.appendChild(createElm(child))
        })
    }else{
        // 虚拟dom上映射着真实dom  方便后续更新操作
        vnode.el = document.createTextNode(text)
    }
    // 如果不是标签就是文本
    return vnode.el
}

// 更新属性
function updateProperties(vnode,oldProps ={}){
    let newProps = vnode.data || {} //新的属性
    let el = vnode.el

    // 老的有新的没有 需要删除老的属性
    for(let key in oldProps){
        if(!newProps[key]){
            el.removeAttribute(key) // 移除真实dom的属性
        }
    }

    // 样式处理 老的 style ={color:red}  新的 style={background:red}
    let newStyle = newProps.style || {}
    let oldStyle = oldProps.style || {}
    // 老的样式中有 新的没有 删除老的样式
    for(let key in oldStyle){
        if(!newStyle[key]){
            el.style[key] = '' 
        }
    }

    // 新的有 直接用新的去更新属性
    for(let key in newProps){
        if(key === 'style'){
            for(let styleName in newProps.style){
                el.style[styleName] = newProps.style[styleName]
            }
        }else if(key === 'class'){
            el.className = newProps.class
        }else{
            el.setAttribute(key,newProps[key])
        }
    }
}

