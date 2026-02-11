const { addDays, formatDate, parseDate, toWeekdayLabel } = require('./date');

const homeBanners = [
  {
    id: 'banner-1',
    title: '湖景连住优惠',
    subtitle: '连住 2 晚立减 120 元',
    cta: '立即预订',
  },
  {
    id: 'banner-2',
    title: '机场接驳服务',
    subtitle: '提前一天预约，专车直达民宿',
    cta: '查看服务',
  },
];

const roomList = [
  {
    id: 'room-lake-101',
    name: '湖景大床房',
    subtitle: '推窗见湖 | 亲子友好 | 含双早',
    cover: '/assets/TDesign-logo_light.png',
    capacity: 2,
    area: 32,
    bedType: '1.8m 大床',
    scenicType: '湖景',
    tags: ['热门', '私域专属价'],
    basePrice: 468,
    breakfast: '含早餐',
    intro:
      '房间位于二楼，正对泸沽湖东岸，配备观景阳台与独立卫浴，适合情侣与小家庭。',
    amenities: ['空调', '地暖', '免费 Wi-Fi', '智能门锁', '观景阳台'],
    rules: ['14:00 后入住', '12:00 前退房', '不可加床', '支持宠物入住（需提前沟通）'],
    canCancelBeforeHours: 24,
  },
  {
    id: 'room-loft-301',
    name: '湖景 Loft 亲子房',
    subtitle: '复式空间 | 可住 3 人 | 含双早',
    cover: '/assets/TDesign-logo_light.png',
    capacity: 3,
    area: 45,
    bedType: '1.8m 大床 + 1.2m 单床',
    scenicType: '湖景',
    tags: ['亲子推荐', '含接驳'],
    basePrice: 598,
    breakfast: '含早餐',
    intro:
      '复式结构，楼上休憩区可看湖。适合亲子出行或好友结伴入住，房内含儿童用品包。',
    amenities: ['空调', '地暖', '免费 Wi-Fi', '浴缸', '儿童洗漱包'],
    rules: ['14:00 后入住', '12:00 前退房', '可加床（收费）', '支持宠物入住（需提前沟通）'],
    canCancelBeforeHours: 48,
  },
  {
    id: 'room-mountain-203',
    name: '静谧山景双床房',
    subtitle: '高性价比 | 安静好睡 | 含双早',
    cover: '/assets/TDesign-logo_light.png',
    capacity: 2,
    area: 28,
    bedType: '1.2m 双床',
    scenicType: '山景',
    tags: ['性价比', '可改期'],
    basePrice: 388,
    breakfast: '含早餐',
    intro:
      '背湖一侧，安静舒适，适合自驾游客与轻旅居用户。靠近停车区与餐饮合作门店。',
    amenities: ['空调', '地暖', '免费 Wi-Fi', '智能电视', '遮光窗帘'],
    rules: ['14:00 后入住', '12:00 前退房', '不可加床', '支持宠物入住（需提前沟通）'],
    canCancelBeforeHours: 24,
  },
];

const serviceEntries = [
  {
    id: 'service-transfer',
    name: '机场接驳',
    desc: '丽江机场往返，提前一天预约',
    icon: 'car',
  },
  {
    id: 'service-boat',
    name: '猪槽船预订',
    desc: '合作船队，住客折扣价',
    icon: 'map-information-2',
  },
  {
    id: 'service-food',
    name: '特色餐饮',
    desc: '柴火鸡/石锅鱼到店福利',
    icon: 'shop',
  },
];

const poiList = [
  {
    id: 'poi-lvjiawan',
    name: '吕家湾码头',
    category: '码头',
    distanceKm: 0.2,
    summary: '步行 5 分钟可达，日出观景点。',
    latitude: 27.7326,
    longitude: 100.7762,
  },
  {
    id: 'poi-goddess-bay',
    name: '女神湾观景台',
    category: '景点',
    distanceKm: 8.6,
    summary: '热门日落点，适合拍照打卡。',
    latitude: 27.7781,
    longitude: 100.7365,
  },
  {
    id: 'poi-caohai-bridge',
    name: '草海走婚桥',
    category: '文化景点',
    distanceKm: 11.4,
    summary: '摩梭文化体验必去路线。',
    latitude: 27.7758,
    longitude: 100.7879,
  },
];

const travelNotes = [
  {
    id: 'note-1',
    title: '两天一晚泸沽湖亲子慢游路线',
    author: '向日葵住客',
    likes: 126,
    tags: ['亲子', '路线'],
    summary: '包含到达、环湖、晚餐与日出行程安排，适合带娃家庭。',
  },
  {
    id: 'note-2',
    title: '冬季来泸沽湖怎么穿？住客避坑清单',
    author: '前台管家',
    likes: 89,
    tags: ['攻略', '避坑'],
    summary: '从温差、道路到保暖装备，一次说清淡季出行注意事项。',
  },
];

const memberBenefits = [
  '首单立减券（下单可用）',
  '复购券（退房后自动发放）',
  '接驳服务优先预约',
];

function getRoomById(roomId) {
  return roomList.find((room) => room.id === roomId) || null;
}

function getPriceCalendar(roomId, checkInDate) {
  const room = getRoomById(roomId);
  if (!room) {
    return [];
  }

  const startDate = checkInDate ? parseDate(checkInDate) : addDays(new Date(), 1);
  return Array.from({ length: 14 }).map((_, index) => {
    const date = addDays(startDate, index);
    const weekday = date.getDay();
    const isWeekend = weekday === 5 || weekday === 6;
    const isHighSeason = date.getMonth() >= 6 && date.getMonth() <= 8;
    let price = room.basePrice;

    if (isWeekend) {
      price += 80;
    }

    if (isHighSeason) {
      price += 120;
    }

    return {
      date: formatDate(date),
      weekdayLabel: toWeekdayLabel(date),
      price,
      stock: index % 5 === 0 ? 1 : 3,
    };
  });
}

module.exports = {
  homeBanners,
  memberBenefits,
  poiList,
  roomList,
  serviceEntries,
  travelNotes,
  getPriceCalendar,
  getRoomById,
};
