//index.js
//获取应用实例
const app = getApp();
import axios from '../../utils/axios.min.js';
// 局部引用

Page({
  data: {
    sendName: ''
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  testPostMethod() {
    app.axios()({
      url: 'https://httpbin.org/post',
      method: 'post',
      data: {
        testname: 'soloJiang'
      }
    }).then(res => {
      return this.setData({
        sendName: JSON.parse(res.data.data).testname
      })
    }).catch(err => {
      console.log(err);
    }).then(() => {
      console.log('post request complete');
    })
    // post
  },
  onLoad: function () {
    app.axios().get('https://httpbin.org/get', {
      params: {
        name: 'Bosspwn'
      }
    }).then(res => {
      return this.setData({
        sendName: res.data.args.name
      })
    })
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        console.log('get request complete');
      });
      // get
  },
})
