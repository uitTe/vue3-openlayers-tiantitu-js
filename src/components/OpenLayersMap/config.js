// src/components/OpenLayersMap/config.js
// 天地图TK - 从环境变量获取
export const TDT_TK = import.meta.env.VITE_TIAN_DI_TU_TK || '你的天地图tk'

// 默认地图配置
export const DEFAULT_CONFIG = {
    center: [116.404, 39.915], // 北京 [经度, 纬度]
    zoom: 12,
    minZoom: 3,
    maxZoom: 18,
    projection: 'EPSG:3857' // 使用Web墨卡托投影
}

// 地图类型配置
export const MAP_TYPES = {
    vector: {
        label: '矢量地图',
        layerType: 'vec',
        labelType: 'cva'
    },
    image: {
        label: '影像地图',
        layerType: 'img',
        labelType: 'cia'
    },
    terrain: {
        label: '地形地图',
        layerType: 'ter',
        labelType: 'cta'
    }
}

// 常用城市坐标 [经度, 纬度]
export const CITY_COORDINATES = {
    BEIJING: [116.404, 39.915],
    SHANGHAI: [121.4737, 31.2304],
    GUANGZHOU: [113.2644, 23.1291],
    SHENZHEN: [114.0579, 22.5431],
    HANGZHOU: [120.1551, 30.2741],
    CHENGDU: [104.0668, 30.5728],
    WUHAN: [114.3052, 30.5928],
    XI_AN: [108.9422, 34.2644]
}

// 天地图服务器列表
export const TDT_SERVERS = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7']

// 天地图瓦片服务URL模板（DataServer接口，支持EPSG:4326）
export const TILE_URL_TEMPLATES = {
    // 矢量底图
    vec: 'https://{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk={tk}',
    // 矢量注记
    cva: 'https://{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk={tk}',
    // 影像底图
    img: 'https://{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk={tk}',
    // 影像注记
    cia: 'https://{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk={tk}',
    // 地形底图
    ter: 'https://{s}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk={tk}',
    // 地形注记
    cta: 'https://{s}.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk={tk}'
}