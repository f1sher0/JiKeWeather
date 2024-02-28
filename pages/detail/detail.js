// pages/detail/detail.js
import { formatTime } from '../../utils/util.js';
const QQ_MAP_KEY = 'QACBZ-M2LK4-QGZUJ-D2KMH-YILMF-ORB6K'
const WEATHER_KEY = '520c13e9470b4895855ea609a76ddd11'
Page({
  data: {
    cur_lat: 30,//用户所处位置
    cur_lng: 120,
    id: 0,//当前兴趣点的id
    address: '',//当前兴趣点的地址
    title: '',//兴趣点名称
    category: '',//兴趣点类型
    lat: 0,//兴趣点经纬度
    lng: 0,
    map_lat: 30,//地图中心
    map_lng: 120,
    image_src: "",
    markers: [],//兴趣点标记
    polylines: [],//路线
    scale: 16,
    time_begin: "0:00",//初始时间
    weather: [{
      time: "19:00",
      kind: "多云",
      temperature: "4°",
      air: "优",
      src: "duoyun"
    }],
    weather_info: [],
    type_sel: ["white", "white", "white"],
    type_color: ["black", "black", "black"],
    route_info: false,
    route_distance: "",
    route_duration: "",
    suggestion:"",
    time_gap: 0,//时间间隔
    array:['5分钟','10分钟','15分钟','30分钟','一小时','两小时'],
  },
  onLoad(options) {
    this.setData({ id: options.id, cur_lat: options.lat, cur_lng: options.lng })
    this.get_time();
    wx.request({
      url: 'https://apis.map.qq.com/ws/place/v1/detail',
      data: {
        id: this.data.id,
        key: QQ_MAP_KEY,
      },
      success: (res) => {
        let list = res.data.data[0];
        let loc = list.location;
        let temp = this.data.markers;
        let ad = list.ad_info.city + list.ad_info.district + list.address;
        list.address = ad;
        console.log(list);
        temp.push({
          id: 0, latitude: loc.lat, longitude: loc.lng, iconPath: "../../images/detail/location.png", width: 35, height: 35,
        })
        let src = "../../images/choice/";
        let name = this.category_process(list.category.split(':')[0]);
        src = src + name + ".png";
        this.setData({ address: list.address, category: list.category, title: list.title, lat: loc.lat, lng: loc.lng, image_src: src, markers: temp, map_lat: loc.lat, map_lng: loc.lng });
        this.get_weather(loc.lng, loc.lat)
        this.set_suggestion(list.category.split(':')[0]);
      },
      fail: (e) => {
        wx.showToast({
          title: '查询附近地点失败',
          icon: 'error'
        })
      }
    })
  },
  category_process(s) {
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
  // 返回天气类型
  weather_process(s) {
    let kind = "";
    let text = s;
    if (text == "晴" || text == "少云" || text == "热") {
      kind = "晴";
    } else if (text == "多云" || text == "晴间多云") {
      kind = "多云"
    } else if (text == "阴") {
      kind = "阴"
    } else if (text == "雾" || text == "浓雾" || text == "强浓雾" || text == "薄雾" || text == "特强浓雾") {
      kind = "雾"
    } else if (text == "霾" || text == "中度霾" || text == "重度霾" || text == "严重霾") {
      kind = "霾"
    } else if (text == "暴雨" || text == "大暴雨" || text == "特大暴雨" || text == "暴雨到大暴雨" || text == "大暴雨到特大暴雨" || text == "极端降雨") {
      kind = "大雨"
    } else if (text == "暴雪" || text == "大到暴雪") {
      kind = "大雪"
    } else if (text == "小雨" || text == "雨" || text == "细雨" || text == "冻雨") {
      kind = "小雨"
    } else if (text == "小雪" || text == "雪" || text == "阵雪") {
      kind = "小雪"
    } else if (text == "中雨" || text == "小到中雨") {
      kind = "中雨"
    } else if (text == "中雪" || text == "小到中雪") {
      kind = "中雪"
    } else if (text == "大雨" || text == "中到大雨") {
      kind = "大雨"
    } else if (text == "大雪" || text == "中到大雪") {
      kind = "大雪"
    } else if (text == "雷阵雨" || text == "强雷阵雨") {
      kind = "雷阵雨"
    } else if (text == "阵雨" || text == "强阵雨") {
      kind = "阵雨"
    } else if (text == "雷阵雨伴有冰雹") {
      kind = "冰雹"
    } else if (text == "沙尘暴" || text == "强沙尘暴") {
      kind = "沙尘暴"
    } else if (text == "扬沙" || text == "浮尘") {
      kind = "扬沙"
    } else if (text == "雨夹雪" || text == "雨雪天气" || text == "阵雨夹雪") {
      kind = "雨夹雪"
    } else kind = "小雨"
    return kind;
  },
  weather_src(s) {
    if (s == "晴") return "qing";
    if (s == "多云") return "duoyun";
    if (s == "阴") return "yin";
    if (s == "雾") return "wu";
    if (s == "霾") return "mai";
    if (s == "暴雨") return "baoyu";
    if (s == "暴雪") return "baoxue";
    if (s == "小雨") return "xiaoyu";
    if (s == "小雪") return "xiaoxue";
    if (s == "中雨") return "zhongyu";
    if (s == "中雪") return "zhongxue";
    if (s == "大雨") return "dayu";
    if (s == "大雪") return "daxue";
    if (s == "雷阵雨") return "leizhenyu";
    if (s == "阵雨") return "zhenyu";
    if (s == "冰雹") return "bingbao";
    if (s == "沙尘暴") return "shachenbao";
    if (s == "扬沙") return "yangsha";
    if (s == "雨夹雪") return "yujiaxue";
  },
  get_time() {
    const time = new Date();
    let hour = formatTime(time).split(' ')[1];
    hour = hour.split(':');
    hour.pop();
    hour = hour.join(':');
    this.setData({ time_begin: hour });
  },
  get_weather(lng, lat) {
    wx.request({
      url: 'https://devapi.qweather.com/v7/weather/24h?',
      data: {
        key: WEATHER_KEY,
        location: lng + "," + lat,
      },
      success: (res) => {
        let arr = res.data.hourly;
        let temp = [];
        let time = this.data.time_begin;
        let num = parseInt(time.split(':')[0]);
        for (let i = 0; i < 12; i++) {
          let t = num + ":" + time.split(':')[1];
          num = (num + 1) % 24;
          let kind = this.weather_process(arr[i].text);
          let src = this.weather_src(kind)
          temp.push({ time: t, kind: kind, temperature: arr[i].temp, wind: arr[i].windDir, winds: arr[i].windScale, src: src });
        }
        this.setData({ weather_info: temp });
      }
    })
  },
  formatTime(minutes) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}小时${remainingMinutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  },
  formatDistance(meters) {
    if (meters < 1000) return `${meters}米`
    const t = meters / 1000;
    const kilometers = t.toFixed(1);
    return `${kilometers}千米`;
  },
  routePlanWalking() {
    let arr = ["rgb(78, 95, 139)", "white", "white"];
    let arr1 = ["white", "black", "black"]
    this.setData({ type_sel: arr, type_color: arr1 });
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/walking',
      data: {
        to: this.data.lat + "," + this.data.lng,
        to_poi: this.data.id,
        key: QQ_MAP_KEY,
        from: this.data.cur_lat + "," + this.data.cur_lng,
      },
      success: (res) => {
        let p_list = res.data.result.routes[0].polyline;
        let distance = this.formatDistance(res.data.result.routes[0].distance);
        let duration = this.formatTime(res.data.result.routes[0].duration);
        for (let i = 2; i < p_list.length; i++) {
          p_list[i] = p_list[i - 2] + p_list[i] / 1000000;
        }
        let points = [];
        for (let i = 0; i < p_list.length; i += 2) {
          points.push({
            latitude: p_list[i],
            longitude: p_list[i + 1]
          })
        }
        let pl = [{
          points: points,
          color: "#51B178",
          width: 10,
          arrowLine: true
        }]
        this.setData({ polylines: pl, map_lat: this.data.cur_lat, map_lng: this.data.cur_lng, scale: 17, route_distance: distance, route_duration: duration, route_info: true })
      }
    })
  },
  routePlanDriving() {
    let arr = ["white", "rgb(78, 95, 139)", "white"];
    let arr1 = ["black", "white", "black"]
    this.setData({ type_sel: arr, type_color: arr1 });
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/driving',
      data: {
        to: this.data.lat + "," + this.data.lng,
        to_poi: this.data.id,
        key: QQ_MAP_KEY,
        from: this.data.cur_lat + "," + this.data.cur_lng,
      },
      success: (res) => {
        let p_list = res.data.result.routes[0].polyline;
        let distance = this.formatDistance(res.data.result.routes[0].distance);
        let duration = this.formatTime(res.data.result.routes[0].duration);
        for (let i = 2; i < p_list.length; i++) {
          p_list[i] = p_list[i - 2] + p_list[i] / 1000000;
        }
        let points = [];
        for (let i = 0; i < p_list.length; i += 2) {
          points.push({
            latitude: p_list[i],
            longitude: p_list[i + 1]
          })
        }
        let pl = [{
          points: points,
          color: "#51B178",
          width: 10,
          arrowLine: true
        }]
        this.setData({ polylines: pl, map_lat: this.data.cur_lat, map_lng: this.data.cur_lng, scale: 17, route_distance: distance, route_duration: duration, route_info: true })
      }
    })
  },
  routePlanBicycling() {
    let arr = ["white", "white", "rgb(78, 95, 139)"];
    let arr1 = ["black", "black", "white"]
    this.setData({ type_sel: arr, type_color: arr1 });
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/bicycling',
      data: {
        to: this.data.lat + "," + this.data.lng,
        to_poi: this.data.id,
        key: QQ_MAP_KEY,
        from: this.data.cur_lat + "," + this.data.cur_lng,
      },
      success: (res) => {
        let p_list = res.data.result.routes[0].polyline;
        let distance = this.formatDistance(res.data.result.routes[0].distance);
        let duration = this.formatTime(res.data.result.routes[0].duration);
        for (let i = 2; i < p_list.length; i++) {
          p_list[i] = p_list[i - 2] + p_list[i] / 1000000;
        }
        let points = [];
        for (let i = 0; i < p_list.length; i += 2) {
          points.push({
            latitude: p_list[i],
            longitude: p_list[i + 1]
          })
        }
        let pl = [{
          points: points,
          color: "#51B178",
          width: 10,
          arrowLine: true
        }]
        this.setData({ polylines: pl, map_lat: this.data.cur_lat, map_lng: this.data.cur_lng, scale: 17, route_distance: distance, route_duration: duration, route_info: true })
      }
    })
  },
  set_suggestion(kind) {
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
    this.setData({suggestion:s});
  },
  hide() {
    this.setData({
      isShow: false
    });
  },
  bindPickerChange: function (e) {
    let arr = this.data.weather_info;
    let time_start = arr[0].time;
    let times = [5, 10, 15, 30, 60, 120];
    let temp = times[e.detail.value];
    let hour = parseInt(time_start.split(':')[0]);
    let min = parseInt(time_start.split(':')[1]);
    for (let i = 1; i < 12; i++) {
       min = min + temp;
       if (min >= 60) {
         hour += Math.floor(min / 60);
         min %= 60;
         if (hour >= 24 ) {
           hour %= 24;
         }
       }
       let str = min >= 10 ? `${hour}:${min}` : `${hour}:0${min}`;
       arr[i].time = str;
    }
    this.setData({time_gap:this.data.array[e.detail.value], weather_info:arr});
  },                                                         
})