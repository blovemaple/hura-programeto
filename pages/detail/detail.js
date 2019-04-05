// pages/detail/detail.js
const common = require('../../lib/common.js')
var WxParse = require('../../lib/wxParse/wxParse.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    query: "",
    sectionkey: "",
    requesting: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      query: options.query,
      sectionkey: options.sectionkey,
      requesting: true
    })
    var that = this
    this.queryDetail(this.data.query, this.data.sectionkey, {
      success: function() {
        WxParse.wxParse('article', 'html', that.data.detail, that, 5);
        that.setData({
          requesting: false
        })
      },
      fail: function() {
        wx.showModal({
          title: '查询失败',
          content: '对不起，详细内容查询失败，请重试。',
          showCancel: false,
          confirmText: '返回',
          complete: function() {
            wx.navigateBack({
              delta: 1
            })
          }
        })
      }
    })
  },

  queryDetail: function(query, sectionkey, params) {
    var that = this
    common.request({
      path: 'hura-programeto/query',
      data: {
        query: query,
        sectionkey: sectionkey,
        isdetail: true
      },

      success: function(data) {
        if (data.results.length > 0) {
          that.setData({
            detail: data.results[0].content
          })
        }
        params && params.success && params.success()
      },

      fail: params.fail,
      complete: params.complete
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})