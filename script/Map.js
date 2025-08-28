const basicSize = 40;
const halfSize = 20;
class Tile {
    /**
     *
     * @param {number} type
     * @param {Vector} position
     * @param {Vector} size
     */
    constructor(type, position, size) {
        this.type = type;  // 纹理
        this.hitbox = new Hitbox(position, size); // 每个 Tile 有一个 Hitbox
    }
    draw() {
        // 检查type是否是字母类型
        const isLetterType = typeof this.type === 'string' && /^[a-zA-Z]$/.test(this.type);
        
        if (isLetterType) {
            // 字母类型使用图片渲染
            const tileImage = window.$game.dataManager.getTileImage(this.type);
            if (tileImage) {
                // 按basicSize大小平铺图片
                for (let i = 0; i < this.hitbox.size.x; i += basicSize) {
                    for (let j = 0; j < this.hitbox.size.y; j += basicSize) {
                        // 将原本16x16的图片放大到40x40
                        window.$game.ctx.drawImage(
                            tileImage,
                            this.hitbox.position.x + i,
                            this.hitbox.position.y + j,
                            basicSize,
                            basicSize
                        );
                    }
                }
            } else {
                // 如果找不到图片，回退到纯色渲染
                console.warn(`未找到瓦片图片: ${this.type}`);
                this.drawColorRect();
            }
        } else {
            // 数字类型使用原有的纯色渲染
            this.drawColorRect();
        }
    }
    
    /**
     * 纯色矩形渲染方法（原有逻辑）
     */
    drawColorRect() {
        for (let i = 0; i < this.hitbox.size.x; i += basicSize)
            for (let j = 0; j < this.hitbox.size.y; j += basicSize) {
                window.$game.ctx.fillStyle = `rgba(0, ${0}, ${this.type * 100}, 1)`;
                window.$game.ctx.fillRect(this.hitbox.position.x + i, this.hitbox.position.y + j, basicSize, basicSize);
                // window.$game.ctx.drawImage(/*TODO:*/, position.x + i, position.j, basicSize,);
            }
    }
}
class Edge extends Tile {
    /**
     *
     * @param {number} type
     * @param {Vector} position
     * @param {Vector} size
     * @param {number} facing
     */
    constructor(type, position, size, facing) {
        super(type, position, size);
        this.facing = facing;
    }
    draw() {
        // 检查type是否是字母类型
        const isLetterType = typeof this.type === 'string' && /^[a-zA-Z]$/.test(this.type);
        
        if (isLetterType) {
            // 字母类型使用图片渲染
            const tileImage = window.$game.dataManager.getTileImage(this.type);
            if (tileImage) {
                // Edge使用halfSize平铺
                for (let i = 0; i < this.hitbox.size.x; i += halfSize) {
                    for (let j = 0; j < this.hitbox.size.y; j += halfSize) {
                        // 将原本16x16的图片放大到20x20
                        window.$game.ctx.drawImage(
                            tileImage,
                            this.hitbox.position.x + i,
                            this.hitbox.position.y + j,
                            halfSize,
                            halfSize
                        );
                    }
                }
            } else {
                // 如果找不到图片，回退到纯色渲染
                console.warn(`未找到Edge瓦片图片: ${this.type}`);
                this.drawColorRect();
            }
        } else {
            // 数字类型使用原有的纯色渲染
            this.drawColorRect();
        }
    }
    
    /**
     * Edge类的纯色矩形渲染方法（原有逻辑）
     */
    drawColorRect() {
        for (let i = 0; i < this.hitbox.size.x; i += halfSize)
            for (let j = 0; j < this.hitbox.size.y; j += halfSize) {
                window.$game.ctx.fillStyle = `rgba(0, ${(this.facing + 3) * 50}, ${this.type * 100}, 1)`;
                window.$game.ctx.fillRect(this.hitbox.position.x + i, this.hitbox.position.y + j, halfSize, halfSize);
                // window.$game.ctx.drawImage(/*TODO:*/, position.x + i, position.j, basicSize,);
            }
    }
}
class Layer {
    constructor() {
        /**
         * @type {Tile[]}
        */
        this.tiles = [];
        /**
         * @type {number}
         */
        this.opacity = 1;
    }
    draw() {
        for (let i of this.tiles)
            i.draw();
    }
}
class MapManager {
    constructor() {
        /**
         * @type {Layer[]}
         */
        this.layers = [];

        /**
         * @type {Tile[]}
         */
        this.blocks = [];

        /**
         * @type {Edge[]}
         */
        this.edges = [];
    }
    loadFromJSON(jsonData) {
        const data = JSON.parse(jsonData);
        this.load(data);
    }

    load(data) {
        let constructTile = tileData => {
            return new Tile(tileData.type,
                new Vector(tileData.position.x, tileData.position.y),
                new Vector(tileData.size.x, tileData.size.y));
        };
        this.layers = data.layers.map(layerData => {
            const layer = new Layer();
            layer.opacity = layerData.opacity;
            layer.tiles = layerData.tiles.map(constructTile);
            return layer;
        });
        this.blocks = data.blocks.map(blockData => {
            return constructTile(blockData);
        });
        this.edges = data.edges.map(edgeData => {
            return new Edge(edgeData.type,
                new Vector(edgeData.position.x, edgeData.position.y),
                new Vector(edgeData.size.x, edgeData.size.y), edgeData.facing);
        });
    }

    async loadFromURL(url) {
        try {
            const response = await window.$game.dataManager.loadJSON(url);
            
            // 分析地图中的所有字母类型
            const usedLetters = this.extractLettersFromMapData(response);
            
            // 预加载需要的字母图片
            if (usedLetters.length > 0) {
                console.log('地图中使用的字母类型:', usedLetters);
                await window.$game.dataManager.preloadTileImages(usedLetters);
            }
            
            this.load(response);
            console.log(this);
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }
    
    /**
     * 从地图数据中提取所有使用的字母类型
     * @param {Object} mapData 地图数据
     * @returns {string[]} 使用的字母数组
     */
    extractLettersFromMapData(mapData) {
        const letters = new Set();
        
        // 检查layers中的tiles
        if (mapData.layers) {
            mapData.layers.forEach(layer => {
                if (layer.tiles) {
                    layer.tiles.forEach(tile => {
                        if (typeof tile.type === 'string' && /^[a-zA-Z]$/.test(tile.type)) {
                            letters.add(tile.type.toLowerCase());
                        }
                    });
                }
            });
        }
        
        // 检查blocks
        if (mapData.blocks) {
            mapData.blocks.forEach(block => {
                if (typeof block.type === 'string' && /^[a-zA-Z]$/.test(block.type)) {
                    letters.add(block.type.toLowerCase());
                }
            });
        }
        
        // 检查edges
        if (mapData.edges) {
            mapData.edges.forEach(edge => {
                if (typeof edge.type === 'string' && /^[a-zA-Z]$/.test(edge.type)) {
                    letters.add(edge.type.toLowerCase());
                }
            });
        }
        
        return Array.from(letters);
    }
    draw() {
        for (let i of this.layers)
            i.draw();
        for (let i of this.blocks)
            i.draw()
        for (let i of this.edges)
            i.draw()
    }
}
