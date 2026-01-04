# OpenLayers + 天地图项目文档

# 项目概述

这是一个基于 Vue3 + Element Plus + OpenLayers 的地图应用，集成了天地图瓦片服务，提供矢量地图、影像地图和地形地图的显示与交互功能。

# 功能列表

1. 地图功能
   ✅ 矢量地图显示
   ✅ 影像地图显示
   ✅ 地形地图显示
   ✅ 地图缩放控制
   ✅ 地图拖拽移动
   ✅ 比例尺显示
   ✅ 坐标实时显示
   ✅ 点击获取坐标
2. 控制面板
   ✅ 地图类型快速切换
   ✅ 主要城市快速定位
   ✅ 地图缩放控制
   ✅ 回到中心功能
   ✅ 显示当前位置信息
   ✅ 自定义坐标定位
   ✅ 地图信息显示
3. 用户体验
   ✅ 按钮加载状态管理
   ✅ 操作防重复点击
   ✅ 地图加载状态提示
   ✅ 错误处理与提示
   ✅ 响应式布局

# 技术栈

    前端框架: Vue3 + Composition API
    UI 框架: Element Plus
    地图引擎: OpenLayers 6.15
    构建工具: Vite
    样式预处理器: SCSS
    图标库: Element Plus Icons
    安装与运行

4. 环境要求
   Node.js 16.x 或更高版本
   npm 或 yarn 包管理器
5. 安装依赖

# 克隆项目

git clone <repository-url>
cd openlayers-tianditu

# 安装依赖

npm install

# 或

yarn install 3. 配置天地图 TK
复制 .env.example 文件为 .env
cp .env.example .env
编辑 .env 文件，设置你的天地图 TK
VITE_TIAN_DI_TU_TK=你的天地图实际 TK
获取天地图 TK
访问 天地图官网
注册账号并申请开发者密钥
将获取到的 TK 填入 .env 文件 4. 运行项目

# 开发环境

npm run dev

# 或

yarn dev

# 生产环境构建

npm run build

# 或

yarn build

# 预览生产构建

npm run preview

# 或

yarn preview

# 项目结构

openlayers-tianditu/
├── src/
│ ├── components/
│ │ └── OpenLayersMap/
│ │ ├── config.js # 地图配置
│ │ ├── utils.js # 工具函数
│ │ ├── layers.js # 图层管理
│ │ └── OpenLayersMap.vue # 地图组件
│ ├── views/
│ │ └── MapDemo.vue # 主页面
│ ├── router/
│ │ └── index.js # 路由配置
│ ├── App.vue # 根组件
│ └── main.js # 入口文件
├── public/ # 静态资源
├── index.html # HTML 模板
├── .env # 环境变量
├── .env.example # 环境变量示例
├── vite.config.js # Vite 配置
├── package.json # 项目配置
└── README.md # 项目文档

# 核心组件说明

1. OpenLayersMap 组件
   主地图组件，负责地图的初始化、渲染和交互。
   主要功能：
   地图初始化与销毁
   地图图层管理
   地图事件处理
   坐标转换
   比例尺计算
   地图控制
   关键方法：
   // 切换地图类型
   switchMapType(type)

// 回到中心
centerMap(center, zoom)

// 缩放控制
zoomIn()
zoomOut()

// 获取地图信息
getCurrentCenter()
getCurrentZoom()
getCurrentMapType()

2. MapDemo 页面
   主应用页面，集成地图组件和所有控制功能。
   控制面板模块：
   地图类型切换
   快速城市定位
   地图控制按钮
   地图信息显示
   坐标定位工具

# 配置文件说明

1. config.js
   地图配置文件，包含所有与地图相关的配置。
   // 天地图 TK 配置
   export const TDT_TK = import.meta.env.VITE_TIAN_DI_TU_TK

// 默认地图配置
export const DEFAULT_CONFIG = {
center: [116.404, 39.915], // 默认中心点（北京）
zoom: 12, // 默认缩放级别
minZoom: 3, // 最小缩放级别
maxZoom: 18, // 最大缩放级别
projection: 'EPSG:3857' // 投影坐标系
}

// 地图类型配置
export const MAP_TYPES = {
vector: { // 矢量地图
label: '矢量地图',
layerType: 'vec',
labelType: 'cva'
},
image: { // 影像地图
label: '影像地图',
layerType: 'img',
labelType: 'cia'
},
terrain: { // 地形地图
label: '地形地图',
layerType: 'ter',
labelType: 'cta'
}
} 2. 天地图瓦片 URL 模板
使用 DataServer 接口，支持 EPSG:4326 坐标系：
// 天地图瓦片服务 URL 模板
export const TILE_URL_TEMPLATES = {
vec: 'https://{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk={tk}',
cva: 'https://{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk={tk}',
img: 'https://{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk={tk}',
cia: 'https://{s}.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk={tk}',
ter: 'https://{s}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk={tk}',
cta: 'https://{s}.tianditu.gov.cn/DataServer?T=cta_w&x={x}&y={y}&l={z}&tk={tk}'
}

# 使用说明

1. 基本地图操作
   拖拽移动: 鼠标拖拽地图
   缩放: 鼠标滚轮或点击缩放按钮
   切换地图类型: 点击地图左上角的按钮
   快速定位: 点击右侧控制面板的城市按钮
   坐标显示: 鼠标移动时显示当前坐标
2. 控制面板功能
   地图类型: 切换矢量、影像、地形地图
   快速定位: 快速跳转到预设城市
   地图控制: 放大、缩小、回到中心、显示位置
   地图信息: 显示当前地图状态
   坐标工具: 输入经纬度定位到指定坐标
3. 比例尺说明
   地图左下角显示当前视图的比例尺，单位会根据缩放级别自动切换：
   大范围显示时：km（公里）
   中范围显示时：m（米）
   小范围显示时：cm（厘米）
   常见问题
4. 地图加载失败
   检查 .env 文件中的 TK 是否正确
   确认网络连接正常
   检查浏览器控制台是否有错误信息
5. 按钮点击无响应
   确认当前没有其他加载操作
   检查浏览器控制台是否有错误
   刷新页面重试
6. 坐标显示不准确
   确认使用的是 EPSG:3857 投影
   检查坐标转换逻辑是否正确
   验证天地图服务是否正常工作
   开发指南
7. 添加新城市
   在 config.js 文件的 CITY_COORDINATES 对象中添加新的城市坐标：
   export const CITY_COORDINATES = {
   // ... 现有城市
   NEW_CITY: [经度, 纬度]
   }
   在 MapDemo.vue 的 cities 数组中添加新城市：
   const cities = [
   // ... 现有城市
   { id: 'new_city', name: '新城市' }
   ]
8. 自定义比例尺样式
   修改 OpenLayersMap.vue 中的 .scale-simple 样式类来自定义比例尺外观。
9. 添加新地图类型
   在 config.js 文件的 MAP_TYPES 对象中添加新类型：
   export const MAP_TYPES = {
   // ... 现有类型
   new_type: {
   label: '新地图类型',
   layerType: 'new_layer',
   labelType: 'new_label'
   }
   }

# 注意事项

天地图 TK 限制: 免费 TK 有调用次数限制，请合理使用
投影坐标系: 使用 EPSG:3857（Web 墨卡托）投影
浏览器兼容: 支持现代浏览器，建议使用 Chrome 90+ 或 Firefox 88+
移动端: 适配移动端，但建议在桌面端使用以获得最佳体验
性能: 地图瓦片加载可能受网络影响，请确保良好的网络环境

# 更新日志

v1.0.0 (2026-01-04)
✅ 初始版本发布
✅ 支持矢量、影像、地形地图
✅ 完整的控制面板功能
✅ 坐标定位工具
✅ 加载状态管理
✅ 响应式设计

# 许可证

本项目基于 MIT 许可证开源。

# 贡献指南

Fork 本仓库
创建功能分支 (git checkout -b feature/AmazingFeature)
提交更改 (git commit -m 'Add some AmazingFeature')
推送到分支 (git push origin feature/AmazingFeature)
开启 Pull Request

# 支持

如遇问题，请：
查看 常见问题部分
检查浏览器控制台错误
查阅 OpenLayers 官方文档

最后更新: 2026-01-04
