<!-- src/components/OpenLayersMap/OpenLayersMap.vue -->
<template>
    <div class="openlayers-map-container">
        <!-- 地图容器 -->
        <div ref="mapContainer" class="map-container"></div>

        <!-- 简化版比例尺 -->
        <div v-if="showScale && isMapReady" class="scale-simple">
            <!-- 比例尺条 - 只需要一段 -->
            <div class="scale-line"></div>
            <!-- 比例尺标签 -->
            <div class="scale-text">{{ scaleValue }} {{ scaleUnit }}</div>
        </div>

        <!-- 地图类型切换 -->
        <div class="map-type-control" v-if="isMapReady">
            <el-button-group>
                <el-button
                    v-for="type in mapTypeList"
                    :key="type.value"
                    :type="currentMapType === type.value ? 'primary' : 'default'"
                    size="small"
                    @click="handleMapTypeClick(type.value)"
                >
                    {{ type.label }}
                </el-button>
            </el-button-group>
        </div>

        <!-- 地图控件 -->
        <div class="map-controls" v-if="isMapReady && showControls">
            <el-button-group>
                <el-button
                    type="primary"
                    size="small"
                    @click="zoomIn"
                    :disabled="currentZoom >= maxZoom"
                >
                    <el-icon><ZoomIn /></el-icon>
                </el-button>
                <el-button
                    type="primary"
                    size="small"
                    @click="zoomOut"
                    :disabled="currentZoom <= minZoom"
                >
                    <el-icon><ZoomOut /></el-icon>
                </el-button>
            </el-button-group>

            <el-button type="primary" size="small" @click="centerMap()" class="center-btn">
                <el-icon><Position /></el-icon>
                回到中心
            </el-button>

            <el-button type="info" size="small" @click="showCurrentLocation" class="location-btn">
                <el-icon><Location /></el-icon>
                当前位置
            </el-button>
        </div>

        <!-- 坐标显示 -->
        <div class="coordinate-display" v-if="showCoordinate && isMapReady">
            <div class="coordinate-item">
                <span class="label">经度:</span>
                <span class="value">{{ formatLngLat[0] }}</span>
            </div>
            <div class="coordinate-item">
                <span class="label">纬度:</span>
                <span class="value">{{ formatLngLat[1] }}</span>
            </div>
            <div class="coordinate-item">
                <span class="label">级别:</span>
                <span class="value">{{ currentZoom.toFixed(1) }}</span>
            </div>
            <div class="coordinate-item">
                <span class="label">位置:</span>
                <span class="value">{{ currentLocation }}</span>
            </div>
        </div>

        <!-- 点击坐标显示 -->
        <div class="click-coordinate" v-if="lastClickPoint && isMapReady">
            点击位置: 经度 {{ lastClickPoint[0].toFixed(6) }}, 纬度
            {{ lastClickPoint[1].toFixed(6) }}
        </div>

        <!-- 加载状态 -->
        <div class="loading-overlay" v-if="loading">
            <div class="loading-content">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span>地图加载中...</span>
            </div>
        </div>

        <!-- 错误提示 -->
        <div class="error-overlay" v-if="error">
            <el-alert :title="error" type="error" :closable="true" @close="error = ''" show-icon />
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
    import { ElMessage } from 'element-plus';
    import { ZoomIn, ZoomOut, Position, Location, Loading } from '@element-plus/icons-vue';

    // OpenLayers 相关导入
    import Map from 'ol/Map';
    import View from 'ol/View';
    import { fromLonLat, toLonLat } from 'ol/proj';
    import { defaults as defaultControls } from 'ol/control';

    // 导入工具函数和图层工具
    import { getTKError, getLocationInfo } from './utils.js';
    import { createMapLayerPair, setupMapClickHandler, setupMapMoveHandler } from './layers.js';

    // 导入配置
    import { DEFAULT_CONFIG, MAP_TYPES } from './config.js';

    // 组件props定义
    const props = defineProps({
        center: {
            type: Array,
            default: () => DEFAULT_CONFIG.center,
        },
        zoom: {
            type: Number,
            default: DEFAULT_CONFIG.zoom,
        },
        minZoom: {
            type: Number,
            default: DEFAULT_CONFIG.minZoom,
        },
        maxZoom: {
            type: Number,
            default: DEFAULT_CONFIG.maxZoom,
        },
        showCoordinate: {
            type: Boolean,
            default: true,
        },
        defaultMapType: {
            type: String,
            default: 'vector',
            validator: (value) => ['vector', 'image', 'terrain'].includes(value),
        },
        showControls: {
            type: Boolean,
            default: true,
        },
        showScale: {
            type: Boolean,
            default: true,
        },
    });

    // 响应式变量
    const mapContainer = ref(null);
    const mapInstance = ref(null);
    const currentZoom = ref(props.zoom);
    const currentMapType = ref(props.defaultMapType);
    const currentCenter = ref(props.center);
    const mousePosition = ref([0, 0]);
    const lastClickPoint = ref(null);
    const isMapReady = ref(false);
    const loading = ref(false);
    const error = ref('');
    const currentLocation = ref('');
    const resizeObserver = ref(null);
    const scaleValue = ref(0);
    const scaleUnit = ref('m');

    // 内部变量，用于记录地图的初始中心点
    const initialCenter = ref(props.center);
    const initialZoom = ref(props.zoom);

    // 定义emit事件
    const emit = defineEmits(['move-end', 'loading-change']);

    // 计算属性
    const currentMapTypeLabel = computed(() => {
        return MAP_TYPES[currentMapType.value]?.label || '未知';
    });

    const mapTypeList = computed(() => {
        return Object.keys(MAP_TYPES).map((value) => ({
            value,
            label: MAP_TYPES[value].label,
        }));
    });

    const formatLngLat = computed(() => {
        if (!mousePosition.value || mousePosition.value.length < 2) {
            return ['--', '--'];
        }
        return [mousePosition.value[0].toFixed(6), mousePosition.value[1].toFixed(6)];
    });

    // 验证是否为有效的地图类型
    const isValidMapType = (type) => {
        return ['vector', 'image', 'terrain'].includes(type);
    };

    // 地图类型点击处理
    const handleMapTypeClick = (type) => {
        if (isValidMapType(type)) {
            switchMapType(type);
        }
    };

    // 等待容器有尺寸
    const waitForContainerSize = () => {
        return new Promise((resolve) => {
            const checkSize = () => {
                if (
                    mapContainer.value &&
                    mapContainer.value.offsetWidth > 0 &&
                    mapContainer.value.offsetHeight > 0
                ) {
                    resolve();
                } else {
                    setTimeout(checkSize, 50);
                }
            };
            checkSize();
        });
    };

    // 更新比例尺显示
    const updateScale = () => {
        if (!mapInstance.value) return;

        const view = mapInstance.value.getView();
        if (!view) return;

        const resolution = view.getResolution();
        if (!resolution || !isFinite(resolution)) return;

        // 在墨卡托投影中，resolution是米/像素
        // 假设我们的比例尺条宽度是100像素
        const scaleBarWidthPixels = 100;
        const groundDistanceMeters = resolution * scaleBarWidthPixels;

        // 格式化显示
        let displayValue;
        let unit;

        if (groundDistanceMeters >= 1000) {
            displayValue = (groundDistanceMeters / 1000).toFixed(
                groundDistanceMeters >= 10000 ? 0 : 1
            );
            unit = 'km';
        } else if (groundDistanceMeters >= 1) {
            displayValue = Math.round(groundDistanceMeters);
            unit = 'm';
        } else {
            displayValue = groundDistanceMeters.toFixed(1);
            unit = 'm';
        }

        // 如果值小于0.1，显示cm
        if (groundDistanceMeters < 0.1) {
            displayValue = (groundDistanceMeters * 100).toFixed(0);
            unit = 'cm';
        }

        scaleValue.value = displayValue;
        scaleUnit.value = unit;
    };

    // 初始化地图
    const initMap = async () => {
        if (!mapContainer.value) return;

        loading.value = true;
        isMapReady.value = false;
        emit('loading-change', true);

        error.value = '';

        await nextTick();

        // 检查TK
        const tkError = getTKError();
        if (tkError) {
            error.value = tkError;
            loading.value = false;
            isMapReady.value = false;
            emit('loading-change', false);
            return;
        }

        try {
            // 等待容器有尺寸
            await waitForContainerSize();

            console.log(
                '地图容器尺寸:',
                mapContainer.value.offsetWidth,
                mapContainer.value.offsetHeight
            );

            // 创建地图控件
            const controls = defaultControls({
                // zoom: props.showControls,
                zoom: false,
                rotate: false,
            });

            // 创建地图视图 - 使用EPSG:3857投影
            const view = new View({
                center: fromLonLat(props.center), // 转换为墨卡托坐标
                zoom: props.zoom,
                minZoom: props.minZoom,
                maxZoom: props.maxZoom,
                projection: 'EPSG:3857', // 使用墨卡托投影
            });

            // 保存初始中心点和缩放级别
            initialCenter.value = props.center;
            initialZoom.value = props.zoom;

            // 创建地图实例
            mapInstance.value = new Map({
                target: mapContainer.value,
                controls: controls,
                view: view,
                layers: [],
            });

            // 添加初始图层
            switchMapType(currentMapType.value);

            // 添加事件监听
            addMapEventListeners();

            // 初始化比例尺
            updateScale();

            isMapReady.value = true;
            loading.value = false;
            emit('loading-change', false);

            console.log('OpenLayers地图初始化成功（使用EPSG:3857投影）');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '地图加载失败';
            console.error('地图初始化失败:', err);
            error.value = errorMessage;
            loading.value = false;
            isMapReady.value = false;
            emit('loading-change', false);
        }
    };

    // 切换地图类型
    const switchMapType = (type) => {
        if (!isValidMapType(type) || !mapInstance.value) return;

        if (currentMapType.value === type && isMapReady.value) return;

        // 设置加载状态
        loading.value = true;
        isMapReady.value = false;
        emit('loading-change', true);

        try {
            // 清除现有图层
            mapInstance.value.getLayers().clear();

            // 创建新的图层
            const mapTypeConfig = MAP_TYPES[type];
            if (!mapTypeConfig) {
                throw new Error('地图类型配置无效');
            }

            const { baseLayer, labelLayer } = createMapLayerPair(mapTypeConfig, {
                minZoom: props.minZoom,
                maxZoom: props.maxZoom,
            });

            if (baseLayer && labelLayer) {
                mapInstance.value.addLayer(baseLayer);
                mapInstance.value.addLayer(labelLayer);
                currentMapType.value = type;

                // 设置延时确保图层加载完成
                setTimeout(() => {
                    loading.value = false;
                    isMapReady.value = true;
                    emit('loading-change', false);
                }, 500);
            } else {
                throw new Error('图层创建失败');
            }
        } catch (err) {
            console.error('切换地图类型失败:', err);
            error.value = '地图类型切换失败';
            loading.value = false;
            isMapReady.value = true;
            emit('loading-change', false);
        }
    };

    // 添加地图事件监听
    const addMapEventListeners = () => {
        if (!mapInstance.value) return;

        // 地图移动结束事件
        mapInstance.value.on('moveend', (event) => {
            if (event.dragging) return; // 如果是拖动操作，不触发

            const view = mapInstance.value.getView();
            if (view) {
                currentZoom.value = view.getZoom();
                const center = view.getCenter();
                if (center) {
                    // 转换为经纬度
                    const lonLat = toLonLat(center);
                    currentCenter.value = lonLat;
                    currentLocation.value = getLocationInfo(lonLat);
                }

                // 更新比例尺
                updateScale();

                // 触发move-end事件
                emit('move-end');
            }
        });

        // 地图点击事件
        setupMapClickHandler(mapInstance.value, (lonLat) => {
            lastClickPoint.value = lonLat;
            console.log('点击坐标:', lonLat);
        });

        // 鼠标移动事件
        setupMapMoveHandler(mapInstance.value, (lonLat) => {
            mousePosition.value = lonLat;
        });

        // 初始更新
        const view = mapInstance.value.getView();
        if (view) {
            currentZoom.value = view.getZoom();
            const center = view.getCenter();
            if (center) {
                const lonLat = toLonLat(center);
                currentLocation.value = getLocationInfo(lonLat);
            }
        }
    };

    // 地图控制方法
    const zoomIn = () => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            if (view) {
                const currentZoom = view.getZoom();
                if (currentZoom < props.maxZoom) {
                    view.animate({
                        zoom: currentZoom + 1,
                        duration: 250,
                    });
                }
            }
        }
    };

    const zoomOut = () => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            if (view) {
                const currentZoom = view.getZoom();
                if (currentZoom > props.minZoom) {
                    view.animate({
                        zoom: currentZoom - 1,
                        duration: 250,
                    });
                }
            }
        }
    };

    // 回到中心点
    const centerMap = (center, zoom) => {
        if (mapInstance.value) {
            const view = mapInstance.value.getView();
            if (view) {
                // 如果指定了中心点和缩放级别，使用指定的
                // 否则使用组件的初始中心点和缩放级别
                const targetCenter = center ? fromLonLat(center) : fromLonLat(initialCenter.value);
                const targetZoom = zoom !== undefined ? zoom : initialZoom.value;

                view.animate({
                    center: targetCenter,
                    zoom: targetZoom,
                    duration: 500,
                });

                return new Promise((resolve) => {
                    const moveEndHandler = () => {
                        mapInstance.value.un('moveend', moveEndHandler);
                        resolve();
                    };
                    mapInstance.value.on('moveend', moveEndHandler);
                });
            }
        }
        return Promise.resolve();
    };

    // 显示当前位置信息
    const showCurrentLocation = () => {
        if (!mapInstance.value) return;

        const view = mapInstance.value.getView();
        if (view) {
            const center = view.getCenter();
            const zoom = view.getZoom();
            const lonLat = center ? toLonLat(center) : [0, 0];
            const location = getLocationInfo(lonLat);

            alert(`当前位置:
    经度: ${lonLat[0].toFixed(6)}
    纬度: ${lonLat[1].toFixed(6)}
    缩放级别: ${zoom.toFixed(1)}
    地图类型: ${currentMapTypeLabel.value}
    地区: ${location}`);
        }
    };

    // 重新加载地图
    const reloadMap = () => {
        if (mapInstance.value) {
            mapInstance.value.setTarget(null);
            mapInstance.value = null;
        }

        isMapReady.value = false;
        loading.value = false;
        error.value = '';
        lastClickPoint.value = null;
        scaleValue.value = 0;
        scaleUnit.value = 'm';

        // 移除旧的 resizeObserver
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
            resizeObserver.value = null;
        }

        initMap();
    };

    // 更新地图尺寸
    const updateMapSize = () => {
        if (mapInstance.value) {
            setTimeout(() => {
                mapInstance.value.updateSize();
            }, 100);
        }
    };

    // 组件挂载时初始化地图
    onMounted(() => {
        // 延迟初始化，确保DOM完全渲染
        setTimeout(() => {
            initMap();
        }, 100);

        // 监听容器尺寸变化
        if ('ResizeObserver' in window) {
            resizeObserver.value = new ResizeObserver(() => {
                if (mapInstance.value) {
                    updateMapSize();
                }
            });

            if (mapContainer.value) {
                resizeObserver.value.observe(mapContainer.value);
            }
        }
    });

    // 组件卸载时销毁地图
    onUnmounted(() => {
        if (mapInstance.value) {
            mapInstance.value.setTarget(null);
            mapInstance.value = null;
        }

        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
    });

    // 监听props变化
    watch(
        () => props.center,
        (newCenter) => {
            if (mapInstance.value && newCenter) {
                const view = mapInstance.value.getView();
                if (view) {
                    view.animate({
                        center: fromLonLat(newCenter),
                        duration: 500,
                    });
                }
            }
        }
    );

    watch(
        () => props.zoom,
        (newZoom) => {
            if (mapInstance.value && newZoom) {
                const view = mapInstance.value.getView();
                if (view) {
                    view.animate({
                        zoom: newZoom,
                        duration: 250,
                    });
                }
            }
        }
    );

    // 暴露方法给父组件
    defineExpose({
        switchMapType,
        centerMap,
        zoomIn,
        zoomOut,
        showCurrentLocation,
        reloadMap,
        getCurrentCenter: () => currentCenter.value,
        getCurrentZoom: () => currentZoom.value,
        getCurrentMapType: () => currentMapType.value,
        getMapInstance: () => mapInstance.value,
        isLoading: () => loading.value,
        isReady: () => isMapReady.value,
    });
</script>

<style lang="scss" scoped>
    .openlayers-map-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: block;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .map-container {
        width: 100%;
        height: 100%;
        border-radius: 4px;
        background: #f5f7fa;
        display: block;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        position: relative;
    }

    /* 简化版比例尺 */
    .scale-simple {
        position: absolute;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        min-width: 100px;

        .scale-line {
            width: 100px;
            height: 2px;
            background: #000;
            position: relative;

            /* 两端的竖线 */
            &::before,
            &::after {
                content: '';
                position: absolute;
                top: -4px;
                width: 2px;
                height: 8px;
                background: #000;
            }

            &::before {
                left: 0;
            }

            &::after {
                right: 0;
            }
        }

        .scale-text {
            font-family: Arial, sans-serif;
            font-size: 12px;
            font-weight: bold;
            color: #000;
            margin-top: 4px;
            text-shadow: 0 0 2px #fff, 0 0 2px #fff; /* 白色描边确保在任何背景上可见 */
        }
    }

    .map-type-control {
        position: absolute;
        top: 10px;
        left: 20px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px;
        border-radius: 6px;
        border: 1px solid #dcdfe6;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;

        .el-button-group {
            display: flex;
            gap: 2px;
            box-sizing: border-box;
        }
    }

    .map-controls {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        padding: 8px;
        border-radius: 6px;
        border: 1px solid #dcdfe6;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;

        .center-btn,
        .location-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            box-sizing: border-box;
        }
        :deep(.el-button) {
            margin-left: 0;
        }
    }

    .coordinate-display {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        padding: 10px 16px;
        border-radius: 6px;
        border: 1px solid #dcdfe6;
        font-size: 12px;
        color: #606266;
        z-index: 1000;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-width: 320px;
        box-sizing: border-box;

        .coordinate-item {
            display: flex;
            align-items: center;
            gap: 8px;
            box-sizing: border-box;

            .label {
                color: #909399;
                min-width: 40px;
                box-sizing: border-box;
            }

            .value {
                color: #303133;
                font-weight: 500;
                font-family: 'Monaco', 'Consolas', monospace;
                flex: 1;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                box-sizing: border-box;
            }
        }
    }

    .click-coordinate {
        position: absolute;
        bottom: 60px;
        left: 20px;
        background: rgba(103, 194, 58, 0.95);
        padding: 8px 16px;
        border-radius: 6px;
        border: 1px solid #67c23a;
        font-size: 12px;
        color: white;
        z-index: 1000;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        max-width: calc(100% - 40px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        box-sizing: border-box;

        .loading-content {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #dcdfe6;
            box-sizing: border-box;

            .loading-icon {
                font-size: 40px;
                color: #409eff;
                margin-bottom: 16px;
                animation: rotate 2s linear infinite;
                box-sizing: border-box;
            }

            span {
                display: block;
                color: #606266;
                font-size: 16px;
                box-sizing: border-box;
            }
        }
    }

    .error-overlay {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1001;
        width: 90%;
        max-width: 600px;
        box-sizing: border-box;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>
