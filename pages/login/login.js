const common = require('../../lib/common.js')

Page({
  data: {
    //判断小程序的API，回调，参数，组件等是否在当前版本可用。
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },
  bindGetUserInfo: function(e) {
    if (e.detail.userInfo) {
      //用户点了允许授权按钮
      console.log("bindGetUserInfo: allow auth pressed")
      var that = this;
      //调用继续登录逻辑，传入暂存的回调函数
      var loginActions = common.loginActions
      common.doLoginWithUserInfo(e.detail.userInfo, {
        success: function() {
          loginActions && loginActions.success && loginActions.success()
        },
        fail: function() {
          loginActions && loginActions.fail && loginActions.fail()
        },
        complete: function() {
          loginActions && loginActions.complete && loginActions.complete()
          wx.navigateBack({
            delta: 1
          })
        }
      })
    } else {
      //用户点了拒绝按钮
      console.log("bindGetUserInfo: reject auth pressed")
      //弹出提示
      wx.showModal({
        content: '您点击了拒绝授权，将无法进入小程序，允许授权即可进入。',
        showCancel: false,
        confirmText: '返回授权',
        success: function(res) {
          if (res.confirm) {
            console.log('bindGetUserInfo: return to auth pressed')
          }
        }
      })
    }
  }

})