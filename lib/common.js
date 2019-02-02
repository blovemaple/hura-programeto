var server = 'https://alhk.chentong.ren/'
//var server = 'http://alhk.chentong.ren:8081/'
var pathLogin = 'hura-programeto/login'
var pathValidateLogin = 'hura-programeto/validatelogin'
var fieldLoginCode = 'loginCode'
var fieldLoginKey = 'loginKey'
var fieldUserInfo = 'userInfo'
var fieldUserConf = 'userConf'

var loginActions

//需要登录的操作
function loginRequired(actions, forceValidate) {
  //有loginkey就成功，没有就调用登录逻辑
  var loginKey = wx.getStorageSync(fieldLoginKey)
  if (!loginKey) {
    console.log("loginRequired: not login")
    doLogin(actions)
  } else {
    if (forceValidate) {
      console.log("loginRequired: loginKey exists, force validate")
      request({
        path: pathValidateLogin,
        success: function(res) {
          if (res.success) {
            console.log("loginRequired: login validate success")
            actions && actions.success && actions.success()
            actions && actions.complete && actions.complete()
          } else {
            console.log("loginRequired: login validate failed, success false")
            doLogin(actions)
          }
        },
        fail: function() {
          console.log("loginRequired: login validate failed, request backend failed")
          actions && actions.fail && actions.fail()
          actions && actions.complete && actions.complete()
        }
      })
    } else {
      console.log("loginRequired: loginKey exists, logined")
      actions && actions.success && actions.success()
      actions && actions.complete && actions.complete()
    }

  }
}

//登录逻辑
function doLogin(actions) {
  var that = this
  //判断是否授权userinfo
  wx.getSetting({
    success: function(res) {
      if (res.authSetting['scope.userInfo']) {
        //已经授权userinfo
        console.log("doLogin: userInfo already authed")
        //获取userinfo
        wx.getUserInfo({
          success: function(res) {
            //获取userinfo成功，继续登录逻辑
            console.log("doLogin: get userInfo success")
            doLoginWithUserInfo(res.userInfo, actions)
          },
          fail: function() {
            //获取userinfo失败
            actions && actions.fail && actions.fail()
            actions && actions.complete && actions.complete()
          }
        });
      } else {
        //未授权userinfo
        //暂存回调函数
        loginActions = undefined
        //导航到授权页面进行授权
        wx.navigateTo({
          url: '/pages/login/login'
        })
      }
    }
  })
}

//有userInfo后继续登录逻辑
function doLoginWithUserInfo(userInfo, actions) {
  console.log(userInfo)

  //loading
  wx.showLoading({
    title: '正在登录',
  })
  var actionsMod = {
    success: actions && actions.success,
    fail: actions && actions.fail,
    complete: function() {
      wx.hideLoading()
      actions && actions.complete && actions.complete()
    }
  }

  //存储userinfo
  wx.setStorageSync(fieldUserInfo, userInfo)
  //获取登录code
  wx.login({
    success(res) {
      //获取登录code成功
      console.log("doLoginWithUserInfo: wx login success")
      //存储logincode
      wx.setStorageSync(fieldLoginCode, res.code)

      //请求服务登录，传userinfo、code，获取loginkey和userconf
      var loginParam = {}
      loginParam[fieldLoginCode] = res.code
      loginParam['userInfo'] = userInfo
      wx.request({
        url: server + pathLogin,
        method: 'POST',
        data: loginParam,
        success: function(res) {
          if (res.statusCode == 200) {
            if (res.data.success) {
              //请求登录成功
              //存储loginkey和userconf
              wx.setStorageSync(fieldLoginKey, res.data.loginKey)
              wx.setStorageSync(fieldUserConf, res.data.conf)
              actionsMod && actionsMod.success && actionsMod.success()
              actionsMod && actionsMod.complete && actionsMod.complete()
              console.log("doLoginWithUserInfo: backend login success")
            } else {
              //请求登录失败，success=false
              console.log("doLoginWithUserInfo: login failed, response success false")
              actionsMod && actionsMod.fail && actionsMod.fail()
              actionsMod && actionsMod.complete && actionsMod.complete()
            }
          } else {
            //请求登录失败，status
            console.log("doLoginWithUserInfo: login failed, response http status " + res.statusCode)
            actionsMod && actionsMod.fail && actionsMod.fail()
            actionsMod && actionsMod.complete && actionsMod.complete()
          }
        },
        fail: function() {
          //请求登录失败
          console.log("doLoginWithUserInfo: login failed, wx.request failed")
          actionsMod && actionsMod.fail && actionsMod.fail()
          actionsMod && actionsMod.complete && actionsMod.complete()
        }
      })

    },
    fail() {
      //获取登录code失败
      console.log("doLoginWithUserInfo: login failed, wx.login failed")
      actionsMod && actionsMod.fail && actionsMod.fail()
      actionsMod && actionsMod.complete && actionsMod.complete()
    }
  })
}

//发起后端请求
function request(param) {
  if (!param.data) {
    param.data = {}
  }
  param.data["loginkey"] = wx.getStorageSync(fieldLoginKey)

  var that = this
  var wxRequest = function() {
    wx.request({
      url: (param.url) ? param.url : server + param.path,
      data: param.data,
      success: function(res) {
        if (res.statusCode == 200) {
          // 200 - success
          console.log("request: success")
          param.success && param.success(res.data)
          param.complete && param.complete()

        } else if (res.statusCode == 401) {
          // 401 - login again
          console.log("request: http status 401, login again")
          //重新登录
          that.doLogin({
            success: function() {
              //重新登录成功，再次调用请求服务
              that.request(param)
            },
            failed: function() {
              //重新登录失败
              param.fail && param.fail()
              param.complete && param.complete()
            }
          })

        } else {
          // other status - failed
          console.error('request: request failed, http status unknown ' + res.statusCode + " " + res.data)
          param.fail && param.fail()
          param.complete && param.complete()

        }
      },
      fail: function() {
        // request failed
        console.error('request: request failed, wx.request failed')
        param.fail && param.fail()
        param.complete && param.complete()
      }
    })
  }

  loginRequired({
    success: function() {
      wxRequest()
    },
    fail: function() {
      param.fail && param.fail()
      param.complete && param.complete()
    }
  })
}

function doWithUserConf(actions) {
  loginRequired({
    success: function() {
      var conf = wx.getStorageSync(fieldUserConf)
      actions.success(conf)
    },
    fail: actions.fail
  })
}


module.exports.loginRequired = loginRequired
module.exports.doLogin = doLogin
module.exports.doLoginWithUserInfo = doLoginWithUserInfo
module.exports.request = request
module.exports.doWithUserConf = doWithUserConf
module.exports.loginActions = loginActions