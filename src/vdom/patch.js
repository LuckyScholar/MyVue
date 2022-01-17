export function patch(oldVnode,vnode){
    console.log('oldVnode',oldVnode);
    console.log('vnode',vnode);

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
            
            //console.log(oldVnode,vnode);
            // 比对两个虚拟节点 操作真实的dom

            // 2.如果文本呢？ 文本都没有tag 
            if (!oldVnode.tag) { // 这个就是文本的情况, 如果内容不一致直接 替换掉文本
                if (oldVnode.text !== vnode.text) {
                    oldVnode.el.textContent = vnode.text;
                }
            }
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
function updateProperties(vnode){
    let newProps = vnode.data
    let el = vnode.el
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

