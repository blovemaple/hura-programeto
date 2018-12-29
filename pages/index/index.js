// pages/index/index.js
const common = require('../../lib/common.js')

var fieldVortaroSections = 'vortaroSections'

Page({

  data: {
    inputVersion: 0,
    submitVersion: 0,
    inputQuery: "",
    largeInput: false,
    submitQuery: ""
  },

  // onLoad:function(){
  //   // 验证登录
  //   common.loginRequired({
  //     success: function () {
  //       console.log("onLaunch: logined. loginKey=" + wx.getStorageSync("loginKey"))
  //     }
  //   },true)
  // },

  onShow: function() {
    // 验证登录
    common.loginRequired({
      success: function() {
        console.log("onLaunch: logined. loginKey=" + wx.getStorageSync("loginKey"))
      }
    }, true)
  },

  /**
   * 输入内容，延迟0.5秒开始查询
   */
  inputTyping: function(e) {
    console.log("typing: " + e.detail.value)

    var query = e.detail.value
    this.setData({
      inputQuery: query
    });

    var largeInput = (query.length > 20)
    if (largeInput != this.data.largeInput) {
      this.setData({
        largeInput: largeInput
      });
    }

    var that = this;
    this.data.inputVersion++;
    var inputVersion = this.data.inputVersion;

    if (e.detail.value.length == 0) {
      return
    }

    setTimeout(function() {
      if (that.data.inputVersion != inputVersion)
        return
      if (that.data.submitQuery.trim() == query.trim())
        return
      var submitVersion = inputVersion
      that.setData({
        submitQuery: query,
        submitVersion: submitVersion
      })
      that.sendQuery(query, submitVersion)

    }, 500)

  },

  /**
   * 进行查询，每个section发一个请求
   */
  sendQuery: function(query, version) {
    console.log("query: " + query)
    console.log("version: " + version)

    this.setData({
      sections: {},
      results: {},
      resultCount: 0,
      successCount: 0
    })

    var that = this

    common.doWithUserConf({
      success: function(conf) {
        if (that.data.submitVersion != version)
          return

        var sections = conf[fieldVortaroSections];

        that.setData({
          sections: sections
        })

        for (var i in sections) {
          that.sendQueryOneSection(sections[i], query, version)
        }
        that.setData({
          success: true
        })
      },

      fail: function() {
        if (that.data.submitVersion != version)
          return
        that.setData({
          success: false
        });
      }
    })

  },

  /**
   * 查询单个section
   */
  sendQueryOneSection: function(section, query, version) {
    var that = this
    common.request({
      path: 'hura-programeto/query',
      data: {
        query: query,
        sectionkey: section.key
      },

      success: function(data) {
        if (that.data.submitVersion != version)
          return

        if (data.results.length > 0) {
          var keyName = "results." + section.key + ".result"
          that.setData({
            [keyName]: data.results
          })
          var keyName = "results." + section.key + ".success"
          that.setData({
            [keyName]: true
          })

          that.setData({
            successCount: that.data.successCount + 1
          })

        } else {
          var keyName = "results." + section.key + ".success"
          that.setData({
            [keyName]: false
          })
        }
      },

      fail: function(res) {
        if (that.data.submitVersion != version)
          return
        var keyName = "results." + section.key + ".success"
        that.setData({
          [keyName]: false
        })
      },

      complete: function(res) {
        if (that.data.submitVersion != version)
          return
        that.setData({
          resultCount: that.data.resultCount + 1
        })
      }
    })
  },

  /**
   * 点击清空按钮
   */
  clearInput: function() {
    this.setData({
      inputQuery: ""
    });
  },
})