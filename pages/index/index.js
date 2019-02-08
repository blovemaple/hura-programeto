// pages/index/index.js
const common = require('../../lib/common.js')

var fieldVortaroSections = 'vortaroSections'
var fieldQueryHistory = "queryHistory"

Page({

  data: {
    inputVersion: 0,
    submitVersion: 0,
    inputQuery: "",
    largeInput: false,
    submitQuery: "",
    showHistory: false,
    queryHistory: []
  },

  onLoad: function() {
    // 取查询历史
    let history = wx.getStorageSync(fieldQueryHistory)
    if (history instanceof Array) {
      this.setData({
        queryHistory: history
      });
    }
  },

  onShow: function() {
    // 验证登录
    common.loginRequired({
      success: function() {
        console.log("onLaunch: logined. loginKey=" + wx.getStorageSync("loginKey"))
      }
    }, true)
  },



  /** 输入内容 */
  inputTyping: function(e) {
    this.inputChanged(e.detail.value)
  },

  /**
   * 延迟0.5秒开始查询
   */
  inputChanged: function(value, noDelay) {
    console.log("typing: " + value)

    if (value.length == 0)
      this.showHistory()
    else
      this.hideHistory()

    var query = value
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

    if (value.length == 0) {
      return
    }

    let waitTime = 500
    if (noDelay)
      waitTime = 0

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

    }, waitTime)

  },

  /**
   * 进行查询，每个section发一个请求
   */
  sendQuery: function(query, version) {
    console.log("query: " + query)
    console.log("version: " + version)

    this.recordHistory(query)

    this.setData({
      sections: {},
      results: {},
      completeCount: 0,
      hasResultsCount: 0,
      errorCount: 0,
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

        var keyName = "results." + section.key + ".result"
        that.setData({
          [keyName]: data.results
        })
        var keyName = "results." + section.key + ".success"
        that.setData({
          [keyName]: true
        })

        if (data.results.length > 0) {
          that.setData({
            hasResultsCount: that.data.hasResultsCount + 1
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
        that.setData({
          errorCount: that.data.errorCount + 1
        })
      },

      complete: function(res) {
        if (that.data.submitVersion != version)
          return
        that.setData({
          completeCount: that.data.completeCount + 1
        })
      }
    })
  },

  /**
   * 记录查询历史
   */
  recordHistory: function(query) {
    let history = this.data.queryHistory
    if (history.length > 0) {
      if (query.startsWith(history[0])) {
        //
        if (history.indexOf(query) >= 0) {
          history.splice(history.indexOf(query), 1)
        }
        history[0] = query
      } else if (history.indexOf(query) >= 0) {
        history.splice(history.indexOf(query), 1)
        history.splice(0, 0, query)
      } else if (history.length >= 10) {
        history.splice(9, history.length - 9)
        history.splice(0, 0, query)
      } else {
        history.splice(0, 0, query)
      }
    } else {
      history.splice(0, 0, query)
    }

    this.setData({
      queryHistory: history
    })
    wx.setStorageSync(fieldQueryHistory, history)
  },

  /**
   * 显示查询历史
   */
  showHistory: function() {
    this.setData({
      showHistory: true
    })
  },

  /**
   * 隐藏查询历史
   */
  hideHistory: function() {
    this.setData({
      showHistory: false
    })
  },

  /**
   * 点击清空按钮
   */
  clearInput: function() {
    this.setData({
      inputQuery: ""
    })
    this.inputChanged("")
  },

  /** 点击复制 */
  copyTapped: function(event) {
    wx.setClipboardData({
      data: event.target.dataset.content
    })
  },

  /** 点击反查 */
  lookupTapped: function(event) {
    let query = event.target.dataset.content
    this.setData({
      inputQuery: query
    })
    this.inputChanged(query, true)
  },

  /** 点击查询历史 */
  historyTapped: function(event) {
    let query = event.currentTarget.dataset.content
    this.setData({
      inputQuery: query
    })
    this.inputChanged(query, true)
  },

  /** 点击重新查询异常部分 */
  retryTapped: function(event) {
    let sections = this.data.sections
    for (var i in sections) {
      let section = sections[i]
      if (!this.data.results[section.key].success) {
        this.setData({
          errorCount: this.data.errorCount - 1,
          completeCount: this.data.completeCount - 1
        })
        this.sendQueryOneSection(section, this.data.submitQuery, this.data.submitVersion)
      }
    }
  },
})