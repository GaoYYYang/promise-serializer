/*
 * @file: promise 时序控制，先后执行的相同异步过程，当先开始的过程结果后到达时，抛弃该次过程，以最近一次返回的内容为准。
 * @author: gaoyang.lamb
 * @date: 11 20 2019 1:22:34
 */

const MODE = {
  // 不进行时序控制，保持自然状态
  NATURAL: 0,
  // 进行时序控制
  SERIALIZED: 1
};

export default class PromiseSerializer {
  constructor(promiseGenerator) {
    this.promiseGenerator = promiseGenerator;
    this.mode = MODE.SERIALIZED;
    // 存储计数和最新返回的结果
    this.state = {
      count: 0,
      data: null
    };
  }

  __cloneJSON(data) {
    try {
      // 暂不支持循环引用的 JSON
      data = JSON.parse(JSON.stringify(data));
    } catch (e) {
      console.error('Serialization failed!');
      console.error(e);
    }
    return data;
  }

  toggle() {
    this.mode = MODE.NATURAL === this.mode ? MODE.SERIALIZED : MODE.NATURAL;
  }

  active(...args) {
    const that = this;
    const { promiseGenerator, state, mode } = this;
    if (mode === MODE.NATURAL) {
      return promiseGenerator(...args);
    }
    
    const count = ++state.count;
    // 记录当前异步过程顺序
    return new Promise((resolve, reject) => {
      promiseGenerator(...args)
        .then(data => {
          // 当前是最新的异步过程，缓存并返回当次异步过程结果
          if (count === state.count) {
            state.catch = false;
            state.data = data;
            resolve(that.__cloneJSON(data));
          } else {
            // 当前异步过程已经过期，直接忽视本次返回的结果，采用缓存中最新数据
            if (!state.catch) {
              resolve(that.__cloneJSON(state.data));
            } else {
              reject(that.__cloneJSON(state.data));
            }
          }
        })
        .catch(e => {
          // 当前是最新的异步过程
          if (count > state.count) {
            state.count = count;
            state.catch = true;
            state.data = e;
            reject(e);
          } else {
            // 当前异步过程已经过期，直接忽视本次返回的结果，采用缓存中最新数据
            if (!state.catch) {
              resolve(that.__cloneJSON(state.data));
            } else {
              reject(that.__cloneJSON(state.data));
            }
          }
        });
    });
  }
}
