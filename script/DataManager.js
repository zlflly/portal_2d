class DataManager {
    constructor() {
        // 存储预加载的瓦片图片
        this.tileImages = new Map();
    }
    async loadJSON(src) {
        let jsonp = document.createElement('script');
        jsonp.src = src;
        let json = await new Promise((resolve) => {
            // 为JSONP提供回调函数
            this.resolve = resolve;

            // 挂在在DOM上, 开始加载
            document.getElementById('resource').appendChild(jsonp);
        });
        // document.getElementById('resource').removeChild(jsonp);
        return json;
    }
    async loadImg(src) {
        let img = await new Promise(resolve => {
            let img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
        });
        return img;
    }
    async loadSpritesheet(src) {
        let json = await this.loadJSON(src);
        let imgsrc = src.split('/');
        imgsrc[imgsrc.length - 1] = json.meta.image;
        imgsrc = imgsrc.join('/');
        let img = await this.loadImg(imgsrc);

        return new Spritesheet(json, img);;
    }

    /**
     * 预加载所有瓦片图片
     * @param {string[]} letters 需要加载的字母数组
     */
    async preloadTileImages(letters = []) {
        // 如果没有传入字母数组，默认加载a-z的所有图片
        if (letters.length === 0) {
            for (let i = 97; i <= 122; i++) { // a-z的ASCII码
                letters.push(String.fromCharCode(i));
            }
        }

        const loadPromises = letters.map(async (letter) => {
            const lowercaseLetter = letter.toLowerCase();
            try {
                const img = await this.loadImg(`./tiles/${lowercaseLetter}.png`);
                this.tileImages.set(lowercaseLetter, img);
                console.log(`已加载瓦片图片: ${lowercaseLetter}.png`);
            } catch (error) {
                console.warn(`无法加载瓦片图片: ${lowercaseLetter}.png`, error);
            }
        });

        await Promise.all(loadPromises);
        console.log('所有瓦片图片预加载完成');
    }

    /**
     * 获取瓦片图片
     * @param {string} letter 字母标识
     * @returns {Image|null} 对应的图片对象
     */
    getTileImage(letter) {
        const lowercaseLetter = letter.toLowerCase();
        return this.tileImages.get(lowercaseLetter) || null;
    }
}
