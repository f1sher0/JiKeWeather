// index.js
import { formatTime } from '../../utils/util.js';
// 获取应用实例
const app = getApp()
const QQ_MAP_KEY = 'QACBZ-M2LK4-QGZUJ-D2KMH-YILMF-ORB6K'
const WEATHER_KEY = '520c13e9470b4895855ea609a76ddd11'

Page({
  data: {
    background: [
      "https://s1.ax1x.com/2023/05/19/p9hrMaF.png",//晴天
      "https://s1.ax1x.com/2023/05/19/p9hrsxI.png",//雪
      "https://s1.ax1x.com/2023/05/19/p9hrzW9.png",//雾霾
      "https://s1.ax1x.com/2023/05/19/p9hsnSA.png",//雨
      "https://s1.ax1x.com/2023/05/19/p9hsdO0.png",//多云
      "https://s1.ax1x.com/2023/05/19/p9hrMaF.png"//高温
    ],
    background_current:"",
    isShow: false,//设置弹窗
    share_isShow: false,//天气分享弹窗
    suggestion_isShow: false,//建议详情
    lat: 30,//当前经纬度位置
    lon: 120,
    location: {},
    currentLocation: '',//当前位置
    date: "",
    hour: "",
    inputContent: "",//输入框内容
    keyword: "",//用户输入内容提取的关键字
    category: "旅游景点",//POI种类
    weatherInfo: {
      kind: "晴",
      temperature: 0,
      wind: '2级',
      feel: 0,
    },//当前位置天气
    suggestion_current:'',//当前展示建议
    list: [],//POI信息
    POI_weather: [],//POI天气信息
    icon_src: [],//建议图标
    suggestion_info: [],
    suggestion_text: '',//建议弹窗的内容
    suggestion_title: '',//建议弹窗的标题
    POI_weather_src: [],
    choices: [//弹窗选项
      { id: 1, kind: "购物", src:'shopping'},
      { id: 2, kind: "教育学校", src:'school'},
      { id: 3, kind: "旅游景点", src:'attraction'},
      { id: 4, kind: "美食", src:'food'},
      { id: 5, kind: "生活服务", src:'serve'},
      { id: 6, kind: "文化场馆", src:'culture'},
      { id: 7, kind: "医疗保健", src:'medical'},
      { id: 8, kind: "娱乐休闲", src:'entertain'},
      { id: 9, kind: "运动健身", src:'sport'},
    ],
    choices_select: [
      false, false, false,
      true, false, false,
      false, false, false,
      false
    ],//控制POI类型选择
    weather_share_choice: [
      { id: 1, kind: "晴", src: "qing" },
      { id: 2, kind: "阴", src: "yin" },
      { id: 3, kind: "雨", src: "dayu" },
      { id: 4, kind: "多云", src: "duoyun" },
      { id: 5, kind: "雾", src: "wu" },
      { id: 6, kind: "雪", src: "daxue" },
    ],//天气分享选项
    weather_select: [
      false, false, false,
      false, false, false,
      false
    ],//控制天气分享选择
  },
  onLoad() {
    this.getLocation();
    this.updatetime();
  },
  // 刷新
  refresh() {
    this.updatetime();
  },
  // 清除输入内容
  clearInputContent() {
    this.setData({ inputContent: "" });
  },
  // 同步输入内容
  onInputChange(event) {
    this.setData({ inputContent: event.detail.value })
  },
  // 进行搜索
  onSearchBtnClick() {
    if (this.data.inputContent.length > 0) {
      let s = this.data.inputContent;
      this.nlp(s);
    } else {
      wx.showModal({
        title: '温馨提示',
        content: '请输入您感兴趣的地点',
        showCancel: false,
      })
    }
  },
  searchByKeyWord() {
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/suggestion',
      data: {
        key: QQ_MAP_KEY,
        keyword: this.data.keyword,
        location: this.data.lat + "," + this.data.lon,
      },
      success: (res) => {
        wx.navigateTo({
          url: "/pages/detail/detail?id=" + res.data.data[0].id + "&lat=" + this.data.lat + "&lng=" + this.data.lon,
        })
      },
      fail: () => {
        wx.showModal({
          title: '温馨提示',
          content: '没有找到合适地点',
          showCancel: false,
        })
      }
    })
  },
  //更新当前时间
  updatetime() {
    const time = new Date();
    const date = formatTime(time).split(' ')[0];
    this.data.date = date;
    let hour = formatTime(time).split(' ')[1];
    hour = hour.split(':');
    hour.pop();
    hour = hour.join(':');
    this.data.hour = hour;
    this.setData({ date: date, hour: hour });
  },
  //传入经纬度,获得具体地点
  getAddress(res) {
    wx.showLoading({
      title: '定位中',
      mask: true
    })
    let lat = res.latitude;
    let lon = res.longitude;
    let loc = { lat, lon }
    this.setData({ lon: lon, lat: lat, location: loc });
    //更新当前位置
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${lat},${lon}`,
        key: QQ_MAP_KEY,
        get_poi: '1',
        poi_options: "address_format=short;radius=5000;policy=4"
      },
      success: (res) => {
        wx.hideLoading();
        let locationInfo = res.data.result;
        this.data.currentLocation = locationInfo.formatted_addresses.recommend;
        this.setData({ currentLocation: this.data.currentLocation })
      },
      fail: (e) => {
        wx.hideLoading()
        wx.showToast({
          title: '查询位置失败',
          icon: 'error'
        })
      }
    })
    this.getPOI();
    this.set_current_weather();
    this.set_indices();
  },
  //获取当前位置附近POI
  getPOI() {
    let lat = this.data.lat;
    let lon = this.data.lon;
    let cate = this.data.category;
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/explore',
      data: {
        boundary: `nearby(${lat},${lon},1000,1)`,
        key: QQ_MAP_KEY,
        policy: '1',
        address_format: "short",
        filter: `category=${cate}`,
        page_size: 5,
      },
      success: (res) => {
        let arr = res.data.data;
        let src = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
          arr[i].category = arr[i].category.split(':')[0];
          let name = this.POI_src(arr[i].category)
          src[i] = "../../images/detail/".concat(name + ".png");
        }
        console.log(arr);
        this.setData({ list: arr, icon_src: src });
        this.set_POI_weather(arr);
      },
      fail: (e) => {
        wx.showToast({
          title: '查询附近地点失败',
          icon: 'error'
        })
      }
    })
  },
  //定位当前位置,返回经纬度
  getLocation() {
    wx.authorize({ // 发起请求用户授权
      scope: 'scope.userLocation',
      success:()=>{// 用户允许了授权
        wx.getLocation({
          type: 'gcj02',
          success: (res) => {
            this.getAddress(res);
          },
        })
      },
      fail: (e) => {
        this.openLocation()
      }
    })
  },
  // 返回天气类型
  weather_process(s) {
    let kind = "";
    let text = s;
    if (text == "晴" || text == "少云" || text == "热") {
      kind = "qing";
    } else if (text == "多云" || text == "晴间多云") {
      kind = "duoyun"
    } else if (text == "阴") {
      kind = "yin"
    } else if (text == "雾" || text == "浓雾" || text == "强浓雾" || text == "薄雾" || text == "特强浓雾") {
      kind = "wu"
    } else if (text == "霾" || text == "中度霾" || text == "重度霾" || text == "严重霾") {
      kind = "mai"
    } else if (text == "暴雨" || text == "大暴雨" || text == "特大暴雨" || text == "暴雨到大暴雨" || text == "大暴雨到特大暴雨" || text == "极端降雨") {
      kind = "baoyu"
    } else if (text == "暴雪" || text == "大到暴雪") {
      kind = "baoxue"
    } else if (text == "小雨" || text == "雨" || text == "细雨" || text == "冻雨") {
      kind = "xiaoyu"
    } else if (text == "小雪" || text == "雪" || text == "阵雪") {
      kind = "xiaoxue"
    } else if (text == "中雨" || text == "小到中雨") {
      kind = "zhongyu"
    } else if (text == "中雪" || text == "小到中雪") {
      kind = "zhongxue"
    } else if (text == "大雨" || text == "中到大雨") {
      kind = "dayu"
    } else if (text == "大雪" || text == "中到大雪") {
      kind = "daxue"
    } else if (text == "雷阵雨" || text == "强雷阵雨") {
      kind = "leizhenyu"
    } else if (text == "阵雨" || text == "强阵雨") {
      kind = "zhenyu"
    } else if (text == "雷阵雨伴有冰雹") {
      kind = "bingbao"
    } else if (text == "沙尘暴" || text == "强沙尘暴") {
      kind = "shachenbao"
    } else if (text == "扬沙" || text == "浮尘") {
      kind = "yangsha"
    } else if (text == "雨夹雪" || text == "雨雪天气" || text == "阵雨夹雪") {
      kind = "yujiaxue"
    } else kind = "xiaoyu"
    return kind;
  },
  // 天气类型的文字类型 
  weather_kind(s) {
    if (s == "qing") return "晴";
    if (s == "duoyun") return "多云";
    if (s == "yin") return "阴";
    if (s == "wu") return "雾";
    if (s == "mai") return "霾";
    if (s == "baoyu") return "暴雨";
    if (s == "baoxue") return "暴雪";
    if (s == "xiaoyu") return "小雨";
    if (s == "xiaoxue") return "小雪";
    if (s == "zhongyu") return "中雨";
    if (s == "zhongxue") return "中雪";
    if (s == "dayu") return "大雨";
    if (s == "daxue") return "大雪";
    if (s == "leizhenyu") return "雷阵雨";
    if (s == "zhenyu") return "阵雨";
    if (s == "bingbao") return "冰雹";
    if (s == "shachenbao") return "沙尘暴";
    if (s == "yangsha") return "扬沙";
    if (s == "yujiaxue") return "雨夹雪";
  },
  // POI类型的图片名
  POI_src(s) {
    if (s == '旅游景点') return 'attraction';
    if (s == '文化场馆') return 'culture';
    if (s == '美食') return 'food';
    if (s == '生活服务') return 'serve';
    if (s == '购物') return 'shopping';
    if (s == '医疗保健') return 'medical';
    if (s == '娱乐休闲') return 'entertain';
    if (s == '运动健身') return 'sport';
    if (s == '教育学校') return 'school';
  },
  //设置当前天气
  set_current_weather() {
    let lat = this.data.lat;
    let lng = this.data.lon;
    wx.request({
      url: 'https://devapi.qweather.com/v7/weather/now?',
      data: {
        key: WEATHER_KEY,
        location: lng + "," + lat,
      },
      success: (d) => {
        let op = d.data.now;
        let kind = this.weather_process(op.text);
        let name = this.weather_kind(kind);
        let tup = {
          kind: kind,
          temperature: op.temp,
          wind: op.windScale + "级",
          feel: op.feelsLike,
          kind_cn: name
        }
        let bc = 4;
        if (kind == "qing") bc = 0;
        else if (kind == "yu" || kind == "xiaoyu" || kind == "zhongyu" || kind == "dayu"|| kind == "baoyu"|| kind == "leizhenyu"|| kind == "dayu") bc = 3;
        else if (kind == "xiaoxue"|| kind == "zhongxue"|| kind == "daxue"|| kind == "yujiaxue"|| kind == "zhenxue"|| kind == "baoxue") bc = 1;
        else if (kind == "duoyun" || kind == "yin") bc = 4;
        else if (kind == "wu"||kind=="mai"||kind == "yangsha"||kind == "shachenbao") bc =2;
        this.setData({ weatherInfo: tup, background_current:this.data.background[bc]});
        this.set_suggestion();
      }
    })
  },
  //设置poi天气
  set_POI_weather(l) {
    let arr = [];
    let src = [];
    for (let i = 0; i < l.length; i++) {
      let lat = l[i].location.lat;
      let lng = l[i].location.lng;
      wx.request({
        url: 'https://devapi.qweather.com/v7/grid-weather/24h?',
        data: {
          key: WEATHER_KEY,
          location: lng + "," + lat,
        },
        success: (d) => {
          let op = d.data.hourly
          let kind = this.weather_process(op[0].text);
          let name = this.weather_kind(kind);
          let feel_temp = "";
          let feel_hum = "";
          if (op[0].humidity >= 80) {
            feel_hum = "潮湿"
          } else if (op[0].humidity >= 60) {
            feel_hum = "较潮湿" 
          } else if (op[0].humidity >= 30) {
            feel_hum = "舒适"
          } else if (op[0].humidity >= 0) {
            feel_hum = "干燥"
          }
          if (op[0].temp >= 40) {
            feel_temp = "极热"
          } else if (op[0].temp >= 30) {
            feel_temp = "炎热" 
          } else if (op[0].temp >= 20) {
            feel_temp = "温暖"
          } else if (op[0].temp >= 10) {
            feel_temp = "温凉"
          } else if (op[0].temp >= 0) {
            feel_temp = "寒冷"
          } else if (op[0].temp < 0) {
            feel_temp = "极寒"
          }
          let tup = {
            kind: kind,
            kind_cn: name,
            wind: op[0].windScale + "级",
            temp: op[0].temp,
            hum: feel_hum,
            ftemp: feel_temp
          }
          src.push("../../images/weather/" + kind + ".png");
          arr.push(tup);
          this.setData({ POI_weather: arr, POI_weather_src: src });
        }
      })
    }
  },
  //设置建议内容
  set_suggestion() {
    let kind = this.data.weatherInfo.kind_cn;
    let s = '';
    if (kind == "晴") {
      s = "涂上防晒霜，戴顶帽子，享受阳光~"
    } else if (kind == "雾" || kind == "霾") {
      s = "注意交通安全，尽量减少户外活动吧"
    } else if (kind == '阴') {
      s = "多带件外套，避免着凉哦"
    } else if (kind == '多云') {
      s = "穿上舒适的衣物，外出探险吧！"
    } else if (kind == '扬沙' || kind == "沙尘暴") {
      s = " 注意交通安全,外出时记得佩戴口罩"
    } else if (kind == '暴雨' || kind == '大雨') {
      s = '尽量不要外出，在家看场电影吧'
    } else if (kind == '中雨' || kind == '小雨') {
      s = '记得带伞，小心地滑哦'
    } else if (kind == '暴雪' || kind == '大雪') {
      s = '尽量不要外出，在家看场电影吧'
    } else if (kind == '中雪' || kind == '小雪' || kind == '雨夹雪') {
      s = '穿暖和点，堆个雪人吧，别忘了拍照'
    } else {
      s = '记得带伞，小心地滑哦'
    } 
    this.setData({suggestion_current:s});
  },
  set_indices() {
    let lat = this.data.lat;
    let lng = this.data.lon;
    wx.request({
        url: 'https://devapi.qweather.com/v7/indices/1d?',
        data: {
          key: WEATHER_KEY,
          location: lng + "," + lat,
          type: '0'
        },
        success:(res) => {
          this.setData({suggestion_info:res.data.daily})
        }
      }
    )
  },
  openLocation() {
    wx.showToast({
      title: '请打开位置权限',
      icon: "error",
      duration: 3000
    })
  },
  tiaozhuan: function (event) {
    wx.navigateTo({
      url: "/pages/detail/detail?id=" + event.currentTarget.dataset.id + "&lat=" + event.currentTarget.dataset.lat + "&lng=" + event.currentTarget.dataset.lng
    })
  },
  open() {
    this.setData({ isShow: true });
  },
  hide() {
    this.setData({
      isShow: false
    });
  },
  save() {
    let cate = "";
    for (let i = 1; i <= 10; i++) {
      if (this.data.choices_select[i] == true) {
        cate += this.data.choices[i - 1].kind;
        cate += ",";
      }
    }
    cate = cate.substr(0, cate.length - 1);
    this.setData({ category: cate })
    this.getPOI();
    this.hide();
    wx.showToast({
      title: '保存成功',
      icon: "success",
      duration: 1000
    })
  },
  select(event) {
    let index = event.currentTarget.dataset.id;
    let arr = this.data.choices_select;
    arr[index] = arr[index] == true ? false : true
    this.setData({ choices_select: arr })
  },
  select_weather(event) {
    let index = event.currentTarget.dataset.id;
    let arr = this.data.weather_select;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == true) {
        arr[i] = false;
      }
    }
    arr[index] = true;
    this.setData({ weather_select: arr })
  },
  open_share() {
    this.setData({ share_isShow: true });
  },
  share_hide() {
    this.setData({
      share_isShow: false,
      weather_select: [
        false, false, false,
        false, false, false,
        false
      ],
    });
  },
  share_save() {
    this.share_hide();
    wx.showToast({
      title: '提交成功',
      icon: "success",
      duration: 1000
    })
  },
  nlp(setence) {
    wx.request({
      url: "https://aip.baidubce.com/rpc/2.0/nlp/v1/txt_keywords_extraction?access_token=24.37f186dad9f6d26984f272fa5bcbf346.2592000.1704204755.282335-30897176",
      method: 'POST',
      data: {
        text: [setence]
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      success: (res) => {
        console.log(res.data.results);
        this.setData({ keyword: res.data.results[0].word });
        this.searchByKeyWord();
      }
    })
  },
  show_suggestion2() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[2].text,
      suggestion_title:this.data.suggestion_info[2].name
    })
  },
  show_suggestion7() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[7].text,
      suggestion_title:this.data.suggestion_info[7].name
    })
  },
  show_suggestion0() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[0].text,
      suggestion_title:this.data.suggestion_info[0].name
    })
  },
  show_suggestion15() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[15].text,
      suggestion_title:this.data.suggestion_info[15].name
    })
  },
  show_suggestion1() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[1].text,
      suggestion_title:this.data.suggestion_info[1].name
    })
  },
  show_suggestion13() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[13].text,
      suggestion_title:this.data.suggestion_info[13].name
    })
  },
  show_suggestion12() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[12].text,
      suggestion_title:this.data.suggestion_info[12].name
    })
  },
  show_suggestion8() {
    this.setData({suggestion_isShow:true,
      suggestion_text:this.data.suggestion_info[8].text,
      suggestion_title:this.data.suggestion_info[8].name
    })
  },
  hide_suggestion() {
    this.setData({suggestion_isShow:false})
  },
  onShareAppMessage:function(){
    wx.showShareMenu({
      withShareTicket:true,
      menu:['shareAppMessage']
    })
    return {
      title:"即刻气象，为您提供准确、实时、个性化的天气预报服务。"
    }
  },
  onPullDownRefresh:function(){
    this.onRefresh();
  },
  onRefresh:function(){
    //导航条加载动画
    wx.showNavigationBarLoading()
    //loading 提示框
    setTimeout(function () {
      wx.hideNavigationBarLoading();
      //停止下拉刷新
      wx.stopPullDownRefresh();
    }, 500)
  },
})
