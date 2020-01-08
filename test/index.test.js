const { PromiseSerializer, createRequsetSerializerInstance } = require('../lib');

function job(payload, cost) {
  return new Promise(r => {
    setTimeout(() => {
      r(payload);
    }, cost);
  });
}

test('测试后先执行得 promise 后完成，是否使用最新数据', done => {
  const serializedJob = new PromiseSerializer(job);
  serializedJob.active(1, 2000).then(res => {
    expect(res).toBe(2);
    done();
  });
  serializedJob.active(2, 1000);
});


test('测试序列化功能关闭开关', done => {
  const serializedJob = new PromiseSerializer(job);
  serializedJob.toggle();

  serializedJob.active(1, 2000).then(res => {
    expect(res).toBe(1);
    done();
  });

  serializedJob.active(2, 1000);

});