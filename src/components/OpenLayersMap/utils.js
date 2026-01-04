// src/components/OpenLayersMap/utils.js
import { TDT_TK, TILE_URL_TEMPLATES, TDT_SERVERS } from './config.js'

// 定义默认TK常量
const DEFAULT_TK = '你的天地图tk'

// 验证TK有效性
export const validateTK = () => {
    return !!TDT_TK && TDT_TK.length > 20 && TDT_TK !== DEFAULT_TK
}

// 获取TK错误信息
export const getTKError = () => {
    if (!TDT_TK) {
        return '天地图TK未配置，请设置VITE_TIAN_DI_TU_TK环境变量'
    }
    if (TDT_TK === DEFAULT_TK) {
        return '请设置天地图TK，创建.env文件并添加VITE_TIAN_DI_TU_TK=你的实际tk'
    }
    if (TDT_TK.length <= 20) {
        return '天地图TK格式不正确，长度应大于20位'
    }
    return ''
}

// 获取天地图瓦片URL数组
export const getTileUrls = (layerType) => {
    if (!TDT_TK || TDT_TK === DEFAULT_TK) {
        console.error('天地图TK未配置')
        return []
    }

    const template = TILE_URL_TEMPLATES[layerType]
    if (!template) {
        console.error('未找到对应的瓦片URL模板:', layerType)
        return []
    }

    // 为每个服务器生成URL
    return TDT_SERVERS.map(server =>
        template
            .replace('{tk}', TDT_TK)
            .replace('{s}', server)
    )
}

// 格式化坐标显示
export const formatCoordinate = (coord, decimalPlaces = 6) => {
    if (!coord || !Array.isArray(coord) || coord.length < 2) {
        return '--'
    }
    return `${coord[0].toFixed(decimalPlaces)}, ${coord[1].toFixed(decimalPlaces)}`
}

// 判断位置信息
export const getLocationInfo = (coord) => {
    if (!coord || !Array.isArray(coord) || coord.length < 2) {
        return '未知位置'
    }

    const [lng, lat] = coord

    if (lng > 73 && lng < 135 && lat > 18 && lat < 54) {
        // 中国范围内
        if (lng > 116.3 && lng < 116.5 && lat > 39.8 && lat < 40) {
            return '北京市区'
        } else if (lng > 121.4 && lng < 121.5 && lat > 31.2 && lat < 31.3) {
            return '上海市中心'
        } else if (lng > 113 && lng < 114 && lat > 22.5 && lat < 23.5) {
            return '广州/深圳地区'
        } else {
            return '中国地区'
        }
    } else {
        return '其他地区'
    }
}

// 计算两点之间的距离（Haversine公式）
export const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2 || coord1.length < 2 || coord2.length < 2) {
        return 0
    }

    const [lng1, lat1] = coord1
    const [lng2, lat2] = coord2

    const R = 6371 // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
}