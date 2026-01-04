<!-- src/views/MapDemo.vue -->
<template>
    <div class="map-demo">
        <!-- 顶部导航栏 -->
        <header class="header">
            <div class="header-content">
                <div class="logo">
                    <h1>
                        <el-icon><Location /></el-icon>
                        OpenLayers天地图
                    </h1>
                    <p class="subtitle">基于Vue3 + OpenLayers + 天地图</p>
                </div>

                <div class="header-controls">
                    <el-button
                        v-if="showRefreshBtn"
                        @click="reloadMap"
                        type="warning"
                        size="small"
                        plain
                        :loading="isLoading"
                        :disabled="isLoading"
                    >
                        <el-icon><Refresh /></el-icon>
                        重载地图
                    </el-button>

                    <el-button
                        @click="showAbout"
                        type="info"
                        size="small"
                        plain
                        :disabled="isLoading"
                    >
                        <el-icon><InfoFilled /></el-icon>
                        关于
                    </el-button>
                </div>
            </div>
        </header>

        <!-- 主要内容区域 -->
        <main class="main-content">
            <div class="content-wrapper">
                <!-- 地图容器 -->
                <div class="map-section">
                    <OpenLayersMap
                        ref="mapRef"
                        :center="currentCenter"
                        :zoom="currentZoom"
                        :default-map-type="currentMapType"
                        :show-scale="true"
                        @move-end="onMapMoveEnd"
                        @loading-change="onMapLoadingChange"
                        style="height: 100%"
                    />
                </div>

                <!-- 控制面板 -->
                <div class="control-panel">
                    <!-- 地图类型切换 -->
                    <div class="control-group">
                        <h3>
                            <el-icon><Compass /></el-icon> 地图类型
                        </h3>
                        <div class="button-group">
                            <el-button
                                v-for="type in mapTypes"
                                :key="type.value"
                                :type="currentMapType === type.value ? 'primary' : 'default'"
                                @click="switchMap(type.value)"
                                class="type-button"
                                :loading="isLoading && currentMapType === type.value"
                                :disabled="isLoading"
                            >
                                <el-icon v-if="type.value === 'vector'"><Location /></el-icon>
                                <el-icon v-if="type.value === 'image'"><Picture /></el-icon>
                                <el-icon v-if="type.value === 'terrain'"><TrendCharts /></el-icon>
                                {{ type.label }}
                            </el-button>
                        </div>
                    </div>

                    <!-- 快速定位 -->
                    <div class="control-group">
                        <h3>
                            <el-icon><Position /></el-icon> 快速定位
                        </h3>
                        <div class="city-grid">
                            <el-button
                                v-for="city in cities"
                                :key="city.id"
                                @click="gotoCity(city.id)"
                                size="small"
                                class="city-button"
                                :loading="loadingCityId === city.id"
                                :disabled="isLoading || loadingCityId === city.id"
                            >
                                <el-icon v-if="loadingCityId === city.id"><Loading /></el-icon>
                                <span>{{ city.name }}</span>
                            </el-button>
                        </div>
                    </div>

                    <!-- 地图控制 -->
                    <div class="control-group">
                        <h3>
                            <el-icon><Setting /></el-icon> 地图控制
                        </h3>
                        <div class="control-grid">
                            <el-button @click="zoomIn" type="primary" plain :disabled="isLoading">
                                <el-icon><ZoomIn /></el-icon>
                                放大
                            </el-button>
                            <el-button @click="zoomOut" type="primary" plain :disabled="isLoading">
                                <el-icon><ZoomOut /></el-icon>
                                缩小
                            </el-button>
                            <el-button
                                @click="centerMap"
                                type="success"
                                plain
                                :disabled="isLoading"
                            >
                                <el-icon><Position /></el-icon>
                                回中心
                            </el-button>
                            <el-button
                                @click="showCurrentLocation"
                                type="info"
                                plain
                                :disabled="isLoading"
                            >
                                <el-icon><Monitor /></el-icon>
                                当前位置
                            </el-button>
                        </div>
                    </div>

                    <!-- 地图信息 -->
                    <div class="control-group">
                        <h3>
                            <el-icon><DataAnalysis /></el-icon> 地图信息
                        </h3>
                        <div class="info-display">
                            <div class="info-row">
                                <span class="label">中心坐标：</span>
                                <span class="value">{{ mapInfo.center || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">缩放级别：</span>
                                <span class="value">{{ mapInfo.zoom || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">地图类型：</span>
                                <span class="value">{{ mapInfo.type || '--' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">状态：</span>
                                <span class="value" :class="mapInfo.ready ? 'success' : 'error'">
                                    {{
                                        mapInfo.ready
                                            ? isLoading
                                                ? '加载中...'
                                                : '就绪'
                                            : '加载中'
                                    }}
                                </span>
                            </div>
                        </div>
                        <el-button
                            @click="updateMapInfo"
                            type="info"
                            size="small"
                            class="refresh-btn"
                            :loading="isLoading"
                            :disabled="isLoading"
                        >
                            <el-icon><Refresh /></el-icon>
                            刷新信息
                        </el-button>
                    </div>

                    <!-- 坐标工具 -->
                    <div class="control-group">
                        <h3>
                            <el-icon><Coordinate /></el-icon> 坐标工具
                        </h3>
                        <div class="coordinate-tools">
                            <div class="tool-input">
                                <el-input
                                    v-model="customLng"
                                    placeholder="经度"
                                    size="small"
                                    @keyup.enter="gotoCoordinate"
                                    :disabled="isLoading"
                                >
                                    <template #prepend>经度</template>
                                </el-input>
                                <el-input
                                    v-model="customLat"
                                    placeholder="纬度"
                                    size="small"
                                    @keyup.enter="gotoCoordinate"
                                    :disabled="isLoading"
                                >
                                    <template #prepend>纬度</template>
                                </el-input>
                            </div>
                            <el-button
                                @click="gotoCoordinate"
                                type="primary"
                                size="small"
                                class="goto-btn"
                                :loading="isLoading && customCoordinateLoading"
                                :disabled="isLoading || customCoordinateLoading"
                            >
                                定位到坐标
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部信息 -->
        <footer class="footer">
            <div class="footer-content">
                <p>
                    © 2026 OpenLayers + 天地图演示项目 | 基于 Vue3 + Element Plus + OpenLayers 开发
                </p>
                <p>版本: 1.0.0 | 天地图TK: {{ maskedTK }}</p>
            </div>
        </footer>
    </div>
</template>

<script setup>
    import { ref, onMounted, computed, onUnmounted, nextTick } from 'vue';
    // 只需要引入 ElMessage
    import { ElMessage } from 'element-plus';
    import {
        Location,
        Picture,
        TrendCharts,
        Position,
        Setting,
        ZoomIn,
        ZoomOut,
        Refresh,
        Monitor,
        InfoFilled,
        DataAnalysis,
        Compass,
        Coordinate,
        Loading,
    } from '@element-plus/icons-vue';
    import OpenLayersMap from '@/components/OpenLayersMap/OpenLayersMap.vue';
    import { CITY_COORDINATES, TDT_TK } from '@/components/OpenLayersMap/config.js';
    import { formatCoordinate } from '@/components/OpenLayersMap/utils.js';

    // 响应式变量
    const mapRef = ref();
    const currentCenter = ref(CITY_COORDINATES.BEIJING);
    const currentZoom = ref(12);
    const currentMapType = ref('vector');
    const mapInfo = ref({
        center: '',
        zoom: '',
        type: '',
        ready: false,
    });
    const customLng = ref('');
    const customLat = ref('');
    const showRefreshBtn = ref(false);
    const resizeObserver = ref(null);
    const isLoading = ref(false);
    const loadingCityId = ref('');
    const customCoordinateLoading = ref(false);

    const mapTypes = [
        { value: 'vector', label: '矢量地图' },
        { value: 'image', label: '影像地图' },
        { value: 'terrain', label: '地形地图' },
    ];

    const cities = [
        { id: 'beijing', name: '北京' },
        { id: 'shanghai', name: '上海' },
        { id: 'guangzhou', name: '广州' },
        { id: 'shenzhen', name: '深圳' },
        { id: 'hangzhou', name: '杭州' },
        { id: 'chengdu', name: '成都' },
        { id: 'wuhan', name: '武汉' },
        { id: 'xian', name: '西安' },
    ];

    // 计算属性
    const maskedTK = computed(() => {
        if (!TDT_TK) return '未设置';
        if (TDT_TK === '你的天地图tk') return '未设置';
        return TDT_TK.length > 10
            ? `${TDT_TK.substring(0, 4)}...${TDT_TK.substring(TDT_TK.length - 4)}`
            : TDT_TK;
    });

    // 地图加载状态变化
    const onMapLoadingChange = (loading) => {
        isLoading.value = loading;
        if (!loading) {
            // 重置其他加载状态
            loadingCityId.value = '';
            customCoordinateLoading.value = false;
        }
    };

    // 地图移动结束
    const onMapMoveEnd = () => {
        // 地图移动完成后，确保加载状态结束
        isLoading.value = false;
        loadingCityId.value = '';
        customCoordinateLoading.value = false;
        updateMapInfo();
    };

    // 切换地图类型
    const switchMap = async (type) => {
        if (isLoading.value) return;

        if (mapRef.value) {
            isLoading.value = true;
            currentMapType.value = type;
            await mapRef.value.switchMapType(type);

            const typeLabels = { vector: '矢量', image: '影像', terrain: '地形' };
            ElMessage.success(`已切换到${typeLabels[type]}地图`);
        }
    };

    // 定位到城市
    const gotoCity = async (cityId) => {
        if (isLoading.value) return;

        const cityConfig = {
            beijing: { center: CITY_COORDINATES.BEIJING, zoom: 12, name: '北京' },
            shanghai: { center: CITY_COORDINATES.SHANGHAI, zoom: 13, name: '上海' },
            guangzhou: { center: CITY_COORDINATES.GUANGZHOU, zoom: 12, name: '广州' },
            shenzhen: { center: CITY_COORDINATES.SHENZHEN, zoom: 12, name: '深圳' },
            hangzhou: { center: CITY_COORDINATES.HANGZHOU, zoom: 12, name: '杭州' },
            chengdu: { center: CITY_COORDINATES.CHENGDU, zoom: 12, name: '成都' },
            wuhan: { center: CITY_COORDINATES.WUHAN, zoom: 12, name: '武汉' },
            xian: { center: CITY_COORDINATES.XI_AN, zoom: 12, name: '西安' },
        };

        const city = cityConfig[cityId];
        if (city) {
            isLoading.value = true;
            loadingCityId.value = cityId;

            try {
                currentCenter.value = city.center;
                currentZoom.value = city.zoom;

                if (mapRef.value) {
                    // 等待地图移动完成
                    await mapRef.value.centerMap(city.center, city.zoom);
                    ElMessage.success(`已定位到${city.name}`);
                }
            } catch (error) {
                console.error('定位到城市失败:', error);
                ElMessage.error(`定位到${city.name}失败`);
            } finally {
                loadingCityId.value = '';
                isLoading.value = false;
            }
        }
    };

    // 地图控制
    const zoomIn = () => {
        if (isLoading.value) return;
        if (mapRef.value) {
            mapRef.value.zoomIn();
        }
    };

    const zoomOut = () => {
        if (isLoading.value) return;
        if (mapRef.value) {
            mapRef.value.zoomOut();
        }
    };

    // 修复：回到中心点 - 使用当前中心点
    const centerMap = async () => {
        if (isLoading.value) return;
        if (mapRef.value) {
            isLoading.value = true;
            try {
                // 使用当前的中心点
                await mapRef.value.centerMap(currentCenter.value, currentZoom.value);
            } finally {
                isLoading.value = false;
            }
        }
    };

    const reloadMap = () => {
        if (isLoading.value) return;
        if (mapRef.value) {
            isLoading.value = true;
            mapRef.value.reloadMap();
            ElMessage.info('正在重新加载地图...');
        }
    };

    const showCurrentLocation = () => {
        if (isLoading.value) return;
        if (mapRef.value) {
            mapRef.value.showCurrentLocation();
        }
    };

    // 更新地图信息
    const updateMapInfo = () => {
        if (mapRef.value) {
            const center = mapRef.value.getCurrentCenter();
            const zoom = mapRef.value.getCurrentZoom();
            const type = mapRef.value.getCurrentMapType();

            mapInfo.value = {
                center: formatCoordinate(center, 4),
                zoom: zoom.toFixed(1),
                type: type === 'vector' ? '矢量地图' : type === 'image' ? '影像地图' : '地形地图',
                ready: true,
            };

            if (!isLoading.value) {
                // ElMessage.success('地图信息已更新');
            }
        }
    };

    // 定位到自定义坐标
    const gotoCoordinate = async () => {
        if (isLoading.value) return;

        const lng = parseFloat(customLng.value);
        const lat = parseFloat(customLat.value);

        if (isNaN(lng) || isNaN(lat)) {
            ElMessage.error('请输入有效的经纬度坐标');
            return;
        }

        if (lng < -180 || lng > 180) {
            ElMessage.error('经度范围应在 -180 到 180 之间');
            return;
        }

        if (lat < -90 || lat > 90) {
            ElMessage.error('纬度范围应在 -90 到 90 之间');
            return;
        }

        isLoading.value = true;
        customCoordinateLoading.value = true;

        try {
            currentCenter.value = [lng, lat];
            currentZoom.value = 12;

            if (mapRef.value) {
                await mapRef.value.centerMap([lng, lat], 12);
                ElMessage.success(`已定位到坐标: ${lng.toFixed(4)}, ${lat.toFixed(4)}`);
            }
        } catch (error) {
            console.error('定位到坐标失败:', error);
            ElMessage.error('定位到坐标失败');
        } finally {
            customCoordinateLoading.value = false;
            isLoading.value = false;
        }
    };

    // 显示关于信息
    const showAbout = () => {
        if (isLoading.value) return;

        ElMessage.info({
            message:
                'OpenLayers + 天地图项目\n基于 Vue3 + Element Plus 开发\n使用 OpenLayers 6 地图引擎\n集成天地图瓦片服务',
            duration: 5000,
            showClose: true,
        });
    };

    // 处理窗口大小变化
    const handleResize = () => {
        if (mapRef.value && mapRef.value.getMapInstance) {
            const map = mapRef.value.getMapInstance();
            if (map) {
                setTimeout(() => {
                    map.updateSize();
                }, 100);
            }
        }
    };

    // 初始化
    onMounted(() => {
        setTimeout(updateMapInfo, 1500);
        // 检查TK是否已配置
        if (TDT_TK && TDT_TK !== '你的天地图tk') {
            showRefreshBtn.value = true;
        }

        // 添加窗口大小变化监听
        window.addEventListener('resize', handleResize);

        // 延迟触发一次尺寸更新，确保地图容器有尺寸
        setTimeout(() => {
            handleResize();
        }, 200);

        // 使用 ResizeObserver 监听地图容器尺寸变化
        if ('ResizeObserver' in window) {
            const mapElement = document.querySelector('.map-section');
            if (mapElement) {
                resizeObserver.value = new ResizeObserver(() => {
                    handleResize();
                });
                resizeObserver.value.observe(mapElement);
            }
        }
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        if (resizeObserver.value) {
            resizeObserver.value.disconnect();
        }
    });
</script>

<style lang="scss" scoped>
    .map-demo {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #f8f9fa;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    /* 头部样式 */
    .header {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid #e4e7ed;
        padding: 10px 0;
        flex-shrink: 0;
        z-index: 1000;
        box-sizing: border-box;
        height: 60px; /* 固定高度 */
        min-height: 60px;
        max-height: 60px;
    }

    .header-content {
        // max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        height: 100%;
    }

    .logo h1 {
        margin: 0;
        font-size: 20px;
        color: #2c3e50;
        display: flex;
        align-items: center;
        gap: 10px;
        line-height: 1;
    }

    .subtitle {
        margin: 5px 0 0 0;
        font-size: 12px;
        color: #7f8c8d;
        line-height: 1;
    }

    .header-controls {
        display: flex;
        gap: 10px;
        box-sizing: border-box;
    }

    /* 主要内容区域 */
    .main-content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0; /* 关键：防止flex溢出 */
        box-sizing: border-box;
        position: relative;
    }

    .content-wrapper {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 20px;
        padding: 20px;
        // max-width: 1400px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
        min-height: 0; /* 关键：防止网格溢出 */
        height: calc(100% - 20px); /* 减去padding */
    }

    @media (max-width: 1200px) {
        .content-wrapper {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            height: auto;
        }
    }

    /* 地图区域 */
    .map-section {
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        background: white;
        border: 1px solid #e0e6ed;
        border-radius: 12px;
        box-sizing: border-box;
        width: 100%;
        height: 100%; /* 确保高度为100% */
        min-height: 300px; /* 最小高度 */
        display: block; /* 确保是块级元素 */
    }

    /* 控制面板 */
    .control-panel {
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
        max-height: 100%;
        padding-right: 5px;
        box-sizing: border-box;
        min-width: 0; /* 防止flex溢出 */
        :deep(.el-button) {
            margin-left: 0;
        }
    }

    .control-panel::-webkit-scrollbar {
        width: 6px;
    }

    .control-panel::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }

    .control-panel::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }

    .control-panel::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }

    .control-group {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #e0e6ed;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .control-group h3 {
        margin: 0 0 20px 0;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        line-height: 1;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
    }

    .type-button {
        width: 100%;
        justify-content: flex-start;
        padding: 12px 20px;
        font-size: 14px;
        box-sizing: border-box;
    }

    .city-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        box-sizing: border-box;
    }

    .city-button {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .control-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        box-sizing: border-box;
    }

    .info-display {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        border: 1px solid #e9ecef;
        box-sizing: border-box;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px dashed #dee2e6;
        box-sizing: border-box;
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .info-row .label {
        color: #6c757d;
        font-size: 13px;
        white-space: nowrap;
        line-height: 1.5;
    }

    .info-row .value {
        color: #495057;
        font-weight: 500;
        font-size: 13px;
        font-family: 'Monaco', 'Consolas', monospace;
        text-align: right;
        max-width: 60%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.5;
    }

    .info-row .value.success {
        color: #67c23a;
    }

    .info-row .value.error {
        color: #f56c6c;
    }

    .refresh-btn {
        width: 100%;
        box-sizing: border-box;
    }

    /* 坐标工具 */
    .coordinate-tools {
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
    }

    .tool-input {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        box-sizing: border-box;
    }

    .goto-btn {
        width: 100%;
        box-sizing: border-box;
    }

    /* 底部样式 */
    .footer {
        background: #2c3e50;
        color: white;
        padding: 10px 0;
        flex-shrink: 0;
        margin-top: auto;
        box-sizing: border-box;
        height: 60px; /* 固定高度 */
        min-height: 60px;
        max-height: 60px;
    }

    .footer-content {
        // max-width: 1400px;
        width: 100%;
        margin: 0 auto;
        padding: 0 20px;
        text-align: center;
        box-sizing: border-box;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .footer-content p {
        margin: 2px 0;
        font-size: 12px;
        color: #bdc3c7;
        line-height: 1.2;
    }

    .footer-content p:first-child {
        font-size: 13px;
        color: white;
        font-weight: 500;
        margin-bottom: 3px;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            gap: 10px;
            text-align: center;
        }

        .content-wrapper {
            padding: 10px;
            grid-template-columns: 1fr;
            grid-template-rows: 300px auto;
        }

        .control-group {
            padding: 15px;
        }

        .city-grid {
            grid-template-columns: 1fr;
        }

        .tool-input {
            grid-template-columns: 1fr;
        }

        .control-panel {
            padding-right: 0;
        }

        .map-section {
            min-height: 300px;
        }
    }
</style>
