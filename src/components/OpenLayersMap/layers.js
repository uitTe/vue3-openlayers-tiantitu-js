// src/components/OpenLayersMap/layers.js
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat } from 'ol/proj'
import { getTileUrls } from './utils.js'

// 创建天地图图层
export const createTianDiTuLayer = (layerType, options = {}) => {
    const urls = getTileUrls(layerType)
    if (!urls || urls.length === 0) {
        console.error('无法创建天地图图层，瓦片URL无效:', layerType)
        return null
    }

    console.log(`创建 ${layerType} 图层，URL数量: ${urls.length}`)

    return new TileLayer({
        source: new XYZ({
            urls: urls,
            crossOrigin: 'anonymous',
            maxZoom: options.maxZoom || 18,
            minZoom: options.minZoom || 3,
            tileSize: 256,
            ...options
        }),
        zIndex: options.zIndex || 0,
        opacity: options.opacity || 1
    })
}

// 创建天地图底图和注记图层对
export const createMapLayerPair = (mapType, options = {}) => {
    const baseLayer = createTianDiTuLayer(mapType.layerType, {
        ...options,
        zIndex: 0
    })

    const labelLayer = createTianDiTuLayer(mapType.labelType, {
        ...options,
        zIndex: 1
    })

    return { baseLayer, labelLayer }
}

// 添加点击事件获取坐标
export const setupMapClickHandler = (map, callback) => {
    if (!map) return

    map.on('click', (event) => {
        const coordinate = event.coordinate
        const lonLat = toLonLat(coordinate)

        if (callback && typeof callback === 'function') {
            callback(lonLat, coordinate)
        }
    })
}

// 添加鼠标移动事件获取坐标
export const setupMapMoveHandler = (map, callback) => {
    if (!map) return

    map.on('pointermove', (event) => {
        if (event.dragging) return

        const coordinate = event.coordinate
        const lonLat = toLonLat(coordinate)

        if (callback && typeof callback === 'function') {
            callback(lonLat, coordinate)
        }
    })
}