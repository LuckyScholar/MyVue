export function patch(oldVnode, vnode) {

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
    //                     "el": {} // 存的是真实dom
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
    if (!oldVnode) { // 渲染
        // 通过当前的虚拟节点 创建元素并返回
        return createElm(vnode)
    } else { // 更新
        const isRealElement = oldVnode.nodeType
        if (isRealElement) {
            const oldElm = oldVnode
            const parentElm = oldVnode.parentNode

            let el = createElm(vnode)
            // insertBefore(a,b) 把a节点放在b节点前面  nextSibling 属性可返回紧跟某个元素之后的节点没有的话就是null
            parentElm.insertBefore(el, oldElm.nextSibling)
            parentElm.removeChild(oldElm)

            // 需要将渲染好的结果返回
            return el;
        } else {
            //  1.标签不一致直接替换即可
            if (oldVnode.tag !== vnode.tag) {
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
            updateProperties(vnode, oldVnode.data)

            // 比较孩子
            let oldChildren = oldVnode.children || []
            let newChildren = vnode.child || []

            if (oldChildren.length > 0 && newChildren.length > 0) {
                // 老的有儿子 新的也有儿子 diff算法
                updateChildren(oldChildren, newChildren, el)
            } else if (oldChildren.length > 0) {
                // 老的有儿子 新的没有儿子
                el.innerHTML = ''

            } else if (newChildren.length > 0) {
                // 老的没有儿子 新的有儿子
                for (let i = 0; i < newChildren.length; ++i) {
                    let child = newChildren[i]
                    // 浏览器有性能优化 不需要自己再搞文档碎片
                    el.appendChild(createElm(child))
                }
            }
        }
        // 递归创建真实节点 替换掉老的节点
    }


}

// 是否是同一节点
function isSameVnode(oldVnode, newVnode) {
    return (oldVnode.tag === newVnode.tag) && (oldVnode.key === newVnode.key)
}

// 儿子间的比较 diff算法
function updateChildren(oldChildren, newChildren, parent) {
    // vue采用的是双指针的方式

    let oldStartIndex = 0;   // 老的开头索引
    let oldStartVnode = oldChildren[oldStartIndex]   // 老的开头索引指向的节点
    let oldEndIndex = oldChildren.length - 1  // 老的结束索引
    let oldEndVnode = oldChildren[oldEndIndex]  // 老的结束索引指向的节点


    let newStartIndex = 0;   // 新的开头索引
    let newStartVnode = newChildren[newStartIndex]   // 新的开头索引指向的节点
    let newEndIndex = newChildren.length - 1  // 新的结束索引
    let newEndVnode = newChildren[newEndIndex]  // 新的结束索引指向的节点

    // 为什么要有key 循环的时候为什么不能用index作为key
    // 静态数据渲染时没问题 但是动态数据渲染就不行
    // <li key='0'>包子</li>   <li key='0'>米饭</li>
    // <li key='1'>饺子</li>   <li key='1'>包子</li>
    // <li key='2'>米饭</li>   <li key='2'>饺子</li>
    // 没有key vue会采用就地复用策略 index相当于没有key 按顺序排列
    // <li key='0'>包子</li> 变成  <li key='0'>米饭</li> 
    // 复用li标签 创建米饭这个儿子节点替换包子这个儿子节点
    // 但实际上不需要创建节点 只需要移动元素就好了
    // 移动的性能要比创建节点的性能高得多

    // 先根据老节点的key 做一个映射表，拿新的虚拟节点去映射表中查找
    // 如果可以查找到，则头指针移动到下一位  如果找不到则直接将元素插入到头指针的前面位置
    const makeIndexByKey = (children) => {
        let map = {}
        children.forEach((item, index) => {
            if (item.key) {
                map[item.key] = index  // 根据key 创建一个映射表{A:0, B:1, C:2}
            }
        })
        return map;
    }
    let map = makeIndexByKey(oldChildren);

    // diff算法通过头头 尾尾 头尾 尾头双指针 以及标签和key判断是否是同一节点 
    // 步骤一:是同一节点的话比较属性和递归比较儿子  然后头指针自加 尾指针自减 继续循环
    // 步骤二:不是同一节点的话 进入暴力对比 先根据老节点的key 做一个映射表，拿新的虚拟节点去映射表中查找 有的话复用移动 无的话新增插入
    // 复用移动老节点的后 将之前复用节点位置设为null 占位防止塌陷  头指针自加 尾指针自减
    // 继续步骤一或者步骤二的判断 循环 直到老节点循环结束 或者 新节点循环结束


    // 循环老的和新的 哪个先结束 循环就停止 将多余的删除或者添加进去 &&两个都得true才能继续循环
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        if (!oldStartVnode) {
            // 开头指针指向了null 需要跳过这次处理 因为当前节点是null没必要比较
            // C E D M
            // A D E Q F
            // 新节点的A插入到老节点C的前面 然后新节点的D在老节点中有 则进行移动 将老节点的D移动到当前开始指针节点C的前面 并将老节点中的D置为null 
            // 此时oldChildren变为 C E null M 但是oldChildren的parent变为 A D C E null M 也就是 A D C E M
            // 更新开头节点 然后继续循环比较
            oldStartVnode = oldChildren[++oldStartIndex]

        } else if (!oldEndVnode) {
            // 同理如果尾指针指向了null 也需要跳过这次处理 因为当前节点是null没必要比较 更新尾结点
            oldEndVnode = oldChildren[--oldEndIndex]

        } else if (isSameVnode(oldStartVnode, newStartVnode)) { // 同一个元素 头头比较 方法一
            patch(oldStartVnode, newStartVnode) // 更新改元素的属性和递归去更新子节点
            oldStartVnode = oldChildren[++oldStartIndex]
            newStartVnode = newChildren[++newStartIndex]

        } else if (isSameVnode(oldEndVnode, newEndVnode)) { // 尾尾比较 方法二
            patch(oldEndVnode, newEndVnode)
            oldEndVnode = oldChildren[--oldEndIndex]
            newEndVnode = newChildren[--newEndIndex]

        } else if (isSameVnode(oldStartVnode, newEndVnode)) { // (头尾)老节点的头指针与新节点的尾指针是同一个元素 方法三
            // A B C D
            // B C D A
            // 头尾比较后 老节点的A应该放在D后面 继续while循环走方法一头头比较

            // A B C D
            // D C B A 复杂的情况 正序变成倒序
            // 头尾比较后 老节点的A应该放在D后面 继续while循环走方法一头头比较B和D不等 走方法二尾尾比较D和B不等 走方法三头尾比较相等 依次循环

            patch(oldStartVnode, newEndVnode)
            // 将老节点当前元素插入到 尾部的下一个元素 前面
            parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
            // 更新老节点的头结点
            oldStartVnode = oldChildren[++oldStartIndex]
            // 更新新节点的尾结点
            newEndVnode = newChildren[--newEndIndex]

        } else if (isSameVnode(oldEndVnode, newStartVnode)) { // (尾头)老节点的尾指针与新节点的头指针是同一个元素 方法四
            // A B C D
            // D A B C
            // 尾头比较后 老节点的D应该放在A前面 继续while循环走方法一头头比较

            patch(oldEndVnode, newStartVnode)
            // 将老节点当前元素插入到 头部的 前面
            parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
            // 更新老节点的尾结点
            oldEndVnode = oldChildren[--oldEndIndex]
            // 更新新节点的头结点
            newStartVnode = [++newStartIndex]
        } else {
            // 暴力比对  乱序 方法五
            // 根据老节点的key 结合数据的索引 做一个映射表
            // <li key='A'>A</li>   
            // <li key='B'>B</li>   
            // <li key='C'>C</li>   
            // <li >D</li>  
            // 生成的映射表为 {A:0, B:1, C:2, undefined:3}

            // 新节点
            // <li key='B'>B</li>  
            // <li key='E'>E</li>   
            // <li key='C'>C</li>   
            // <li key='D'>D</li>  
            // <li key='F'>F</li>  
            // 新节点的key B E C D F 在映射表中查找看是否有对应的key 
            // 如都有B这个key就可以查到key为B的节点在老节点中索引为1  map[item.key]就是map[B] = 1
            // 只需要移动老节点中key为B的节点就好了 不需要重新创建 根据索引找出对应的节点oldChildren[moveIndex] 移动到老节点当前开始节点的前面
            // 新节点的key C D F 在映射表中没有 创建新节点插入到老节点的对应位置


            let moveIndex = map[newStartVnode.key]  // 拿到开头的虚拟节点的key 去老的中找
            if (moveIndex == undefined) { // 映射表中没有可以复用的key 新建并插入
                parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
            } else {
                let moveVnode = oldChildren[moveIndex]  // 我要移动的那个元素
                oldChildren[moveIndex] = undefined; // 占位防止塌陷
                parent.insertBefore(moveVnode.el, oldStartVnode.el) // 需要移动的元素移动到老节点当前开始节点的前面
                patch(moveVnode, oldStartVnode) // 比较属性和儿子
            }
            newStartVnode = newChildren[++newStartIndex] // 用新的节点不停的去老节点中找
        }
    }
    // 老的循环结束 剩下新的多余的节点 就是新增的节点
    // 老节点      A B C D
    // 新节点      A B C D E 情况一在老节点后面插入E    头头比较 AA 最后newEndIndex指向E  newEndIndex+1的值指向null => 等价于老节点的null
    // 新节点    E A B C D   情况二在老节点前面插入E    尾尾比较 DD 最后newEndIndex指向E  newEndIndex+1的值指向A  =>   等价于老节点的A
    if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; ++i) {
            // parent.insertBefor(newNode,null) 写null就等价于appendChild
            // newChildren[newEndIndex+1] 新节点的结束索引+1对应的值  等价于于老节点的头节点或者最后面的null
            // 判断newChildren[newEndIndex+1] 指向的节点是否为null 为null相当于往后插入新节点 不为null相当于在前面插入新节点
            let el = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el
            // 在父元素上调用insertBefore 将新增的节点添加到 老节点的前面或者后面
            parent.insertBefore(createElm(newChildren[i]), el)
        }
    }
    // 新的循环结束 剩下老的多余的节点 说明这些老节点是不需要的节点 如果这里面有null说明这个节点已经处理过了跳过即可
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; ++i) {
            let child = oldChildren[i]
            if (child != undefined) {
                parent.removeChild(child.el)    //删除不需要的多余的及元素
            }
        }
    }

}

// 根据虚拟节点创建真实的节点
export function createElm(vnode) {
    let { tag, children, key, data, text } = vnode
    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag)
        updateProperties(vnode)
        children.forEach(child => {
            // 递归创建儿子节点，将儿子节点扔到父节点中
            return vnode.el.appendChild(createElm(child))
        })
    } else {
        // 虚拟dom上映射着真实dom  方便后续更新操作
        vnode.el = document.createTextNode(text)
    }
    // 如果不是标签就是文本
    return vnode.el
}

// 更新属性
function updateProperties(vnode, oldProps = {}) {
    let newProps = vnode.data || {} //新的属性
    let el = vnode.el

    // 老的有新的没有 需要删除老的属性
    for (let key in oldProps) {
        if (!newProps[key]) {
            el.removeAttribute(key) // 移除真实dom的属性
        }
    }

    // 样式处理 老的 style ={color:red}  新的 style={background:red}
    let newStyle = newProps.style || {}
    let oldStyle = oldProps.style || {}
    // 老的样式中有 新的没有 删除老的样式
    for (let key in oldStyle) {
        if (!newStyle[key]) {
            el.style[key] = ''
        }
    }

    // 新的有 直接用新的去更新属性
    for (let key in newProps) {
        if (key === 'style') {
            for (let styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName]
            }
        } else if (key === 'class') {
            el.className = newProps.class
        } else {
            el.setAttribute(key, newProps[key])
        }
    }
}

