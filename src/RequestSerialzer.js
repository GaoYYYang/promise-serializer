/*
 * @file: 请求时序控制，多次先后发起的相同请求，当先发起的请求后到达时，认为该次请求过期，会抛弃当次请求，以最近一次请求返回的内容为准。
 * @author: gaoyang.lamb
 * @date: 11 20 2019 1:22:34
 */
import PromiseSerializer from './PromiseSerializer';
const HTTP_METHODS = ['delete', 'get', 'head', 'options', 'post', 'put', 'patch'];

export default class RequestSerializer {

  constructor(requestInstance) {
    this.requestInstance = requestInstance;
    // 存储请求计数和最新返回的结果
    this.promiseSerializers = {};
  }

  // 根据请求参数，生成标识，相同入参视（url, params）为同一请求的多次调用，这种情况下 digest 唯一。
  digest(...params) {
    let str = '';
    if (params && typeof params === 'object') {
      str += JSON.stringify(params);
    }
    let init = 0x811c9dc5;
    let hval = init;
    for (let i = 0; i < str.length; ++i) {
      hval ^= str.charCodeAt(i);
      hval +=
        (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
  }

  cloneData(data) {
    try {
      data = JSON.parse(JSON.stringify(data));
    } catch (e) {
      console.warn('Requset serialization failed!');
    }
    return data;
  }

  request(method, ...params) {
    const that = this;
    let requestFn;
    if (~HTTP_METHODS.indexOf(method)) {
      requestFn = this.requestInstance[method];
    } else {
      requestFn = this.requestInstance;
      params = [method, ...params];
    }
    let digest = 'default';
    try {
      digest = this.digest([method, ...params]);
    } catch {
      // 发生错误时，降级到 service 原生方法。
      console.warn('Requset serialization failed!');
      return requestFn(params);
    }

    if (!this.promiseSerializers[digest]) {
      this.promiseSerializers[digest] = new PromiseSerializer(requestFn);
    }

    return this.promiseSerializers[digest].active(...params);
  }

  get(...args) {
    return this.request('get', ...args);
  }

  post(...args) {
    return this.request('post', ...args);
  }

  delete(...args) {
    return this.request('delete', ...args);
  }

  put(...args) {
    return this.request('put', ...args);
  }

  options(...args) {
    return this.request('options', ...args);
  }

  patch(...args) {
    return this.request('patch', ...args);
  }

  head(...args) {
    return this.request('head', ...args);
  }

}

function createRequsetSerializerInstance(requestInstance) {
  const requestSerializer = new RequestSerializer(requestInstance);
  const { request } = requestSerializer;
  HTTP_METHODS.forEach(method => {
    request[method] = requestSerializer[method].bind(requestSerializer);
  });
  return request;
}

export { createRequsetSerializerInstance };