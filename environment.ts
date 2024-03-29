const ENV = process.env.NODE_ENV;

interface ENV_CONFIG {
    currentMode: String,
    baseUrl: String,
    database: any,
}

export default {
    test: {
        currentMode: '测试模式',
        baseUrl: 'http://localhost',
      },
    development: {
      currentMode: '开发模式',
      baseUrl: 'http://localhost',
    },
    production: {
      currentMode: '生产模式',
      baseUrl: 'http://localhost',
    },
    currentEnv:function(){
      let ret: ENV_CONFIG;
      if (ENV) {
        ret = module.exports.default[ENV];
      } else {
        ret = module.exports.default.production;
      }
      console.log("环境变量",ret)
      return ret;
    }
  };
  
  