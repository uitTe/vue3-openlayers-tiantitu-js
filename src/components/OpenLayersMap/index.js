import OpenLayersMap from './OpenLayersMap.vue'

export default OpenLayersMap

// 导出配置
export {
    MAP_TYPES,
    DEFAULT_CONFIG,
    CITY_COORDINATES,
    TDT_TK
} from './config.js'

// 导出工具函数
export {
    validateTK,
    getTKError,
    formatCoordinate,
    getLocationInfo,
    calculateDistance
} from './utils.js'