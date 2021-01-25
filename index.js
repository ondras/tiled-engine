(() => {
  // src/engine/test.ts
  var tests = [];
  var stats = {
    passed: 0,
    failed: 0,
    assertions: 0
  };
  function register(test5) {
    tests.push(test5);
  }
  function assert(x, msg) {
    stats.assertions++;
    if (x) {
      return;
    }
    throw new Error(`Assertion failed: ${msg}`);
  }
  function assertEquals(x, y, msg) {
    let cx = x instanceof Array ? x.join(",") : x;
    let cy = y instanceof Array ? y.join(",") : y;
    return assert(cx == cy, `${msg} (${cx} should equal ${cy})`);
  }
  async function run() {
    let todo = tests.slice();
    stats.passed = 0;
    stats.failed = 0;
    stats.assertions = 0;
    while (todo.length) {
      try {
        let result = todo.shift()();
        if (result && result.then) {
          await result;
        }
        stats.passed++;
      } catch (e) {
        stats.failed++;
        console.warn(e);
      }
    }
    return stats;
  }
  async function runAndLog() {
    let r = await run();
    console.log(r);
  }

  // node_modules/fastiles/js/utils.js
  var QUAD = [
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1
  ];
  function createProgram(gl, ...sources) {
    const p = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sources[index]);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      gl.attachShader(p, shader);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p));
    }
    return p;
  }
  function createTexture(gl) {
    let t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return t;
  }

  // node_modules/fastiles/js/shaders.js
  var VS = `
#version 300 es

in uvec2 position;
in uvec2 uv;
in uint glyph;
in uint style;

out vec2 fsUv;
flat out uint fsStyle;
flat out uint fsGlyph;

uniform highp uvec2 tileSize;
uniform uvec2 viewportSize;

void main() {
	ivec2 positionPx = ivec2(position * tileSize);
	vec2 positionNdc = (vec2(positionPx * 2) / vec2(viewportSize))-1.0;
	positionNdc.y *= -1.0;
	gl_Position = vec4(positionNdc, 0.0, 1.0);

	fsUv = vec2(uv);
	fsStyle = style;
	fsGlyph = glyph;
}`.trim();
  var FS = `
#version 300 es
precision highp float;

in vec2 fsUv;
flat in uint fsStyle;
flat in uint fsGlyph;

out vec4 fragColor;
uniform sampler2D font;
uniform sampler2D palette;
uniform highp uvec2 tileSize;

void main() {
	uvec2 fontTiles = uvec2(textureSize(font, 0)) / tileSize;
	uvec2 fontPosition = uvec2(fsGlyph % fontTiles.x, fsGlyph / fontTiles.x);
	uvec2 fontPx = (tileSize * fontPosition) + uvec2(vec2(tileSize) * fsUv);

	vec3 texel = texelFetch(font, ivec2(fontPx), 0).rgb;
	vec3 fg = texelFetch(palette, ivec2(fsStyle & uint(0xFF), 0), 0).rgb;
	vec3 bg = texelFetch(palette, ivec2(fsStyle >> 8, 0), 0).rgb;

	fragColor = vec4(mix(bg, fg, texel), 1.0);
}`.trim();

  // node_modules/fastiles/js/palette.js
  var Palette = class {
    constructor() {
      this._length = 0;
      this._scene = null;
      let canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 1;
      this._ctx = canvas.getContext("2d");
    }
    static default() {
      return this.fromArray(["black", "white"]);
    }
    static windows16() {
      return this.fromArray(WINDOWS_16);
    }
    static xterm256() {
      return this.fromArray(XTERM_256);
    }
    static rexpaint() {
      return this.fromArray(REXPAINT);
    }
    static rexpaint8() {
      return this.fromArray(REXPAINT_8);
    }
    static fromArray(data) {
      let p = new this();
      data.forEach((c) => p.add(c));
      return p;
    }
    set scene(scene) {
      this._scene = scene;
      scene && scene.uploadPaletteData(this._ctx.canvas);
    }
    get length() {
      return this._length;
    }
    set(index, color) {
      const ctx = this._ctx;
      ctx.fillStyle = color;
      ctx.fillRect(index, 0, 1, 1);
      this._scene && this._scene.uploadPaletteData(ctx.canvas);
      return index;
    }
    add(color) {
      return this.set(this._length++, color);
    }
    clear() {
      const ctx = this._ctx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      this._length = 0;
    }
  };
  var palette_default = Palette;
  var WINDOWS_16 = ["black", "gray", "maroon", "red", "green", "lime", "olive", "yellow", "navy", "blue", "purple", "fuchsia", "teal", "aqua", "silver", "white"];
  var XTERM_256 = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#c0c0c0", "#808080", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff", "#000000", "#00005f", "#000087", "#0000af", "#0000d7", "#0000ff", "#005f00", "#005f5f", "#005f87", "#005faf", "#005fd7", "#005fff", "#008700", "#00875f", "#008787", "#0087af", "#0087d7", "#0087ff", "#00af00", "#00af5f", "#00af87", "#00afaf", "#00afd7", "#00afff", "#00d700", "#00d75f", "#00d787", "#00d7af", "#00d7d7", "#00d7ff", "#00ff00", "#00ff5f", "#00ff87", "#00ffaf", "#00ffd7", "#00ffff", "#5f0000", "#5f005f", "#5f0087", "#5f00af", "#5f00d7", "#5f00ff", "#5f5f00", "#5f5f5f", "#5f5f87", "#5f5faf", "#5f5fd7", "#5f5fff", "#5f8700", "#5f875f", "#5f8787", "#5f87af", "#5f87d7", "#5f87ff", "#5faf00", "#5faf5f", "#5faf87", "#5fafaf", "#5fafd7", "#5fafff", "#5fd700", "#5fd75f", "#5fd787", "#5fd7af", "#5fd7d7", "#5fd7ff", "#5fff00", "#5fff5f", "#5fff87", "#5fffaf", "#5fffd7", "#5fffff", "#870000", "#87005f", "#870087", "#8700af", "#8700d7", "#8700ff", "#875f00", "#875f5f", "#875f87", "#875faf", "#875fd7", "#875fff", "#878700", "#87875f", "#878787", "#8787af", "#8787d7", "#8787ff", "#87af00", "#87af5f", "#87af87", "#87afaf", "#87afd7", "#87afff", "#87d700", "#87d75f", "#87d787", "#87d7af", "#87d7d7", "#87d7ff", "#87ff00", "#87ff5f", "#87ff87", "#87ffaf", "#87ffd7", "#87ffff", "#af0000", "#af005f", "#af0087", "#af00af", "#af00d7", "#af00ff", "#af5f00", "#af5f5f", "#af5f87", "#af5faf", "#af5fd7", "#af5fff", "#af8700", "#af875f", "#af8787", "#af87af", "#af87d7", "#af87ff", "#afaf00", "#afaf5f", "#afaf87", "#afafaf", "#afafd7", "#afafff", "#afd700", "#afd75f", "#afd787", "#afd7af", "#afd7d7", "#afd7ff", "#afff00", "#afff5f", "#afff87", "#afffaf", "#afffd7", "#afffff", "#d70000", "#d7005f", "#d70087", "#d700af", "#d700d7", "#d700ff", "#d75f00", "#d75f5f", "#d75f87", "#d75faf", "#d75fd7", "#d75fff", "#d78700", "#d7875f", "#d78787", "#d787af", "#d787d7", "#d787ff", "#d7af00", "#d7af5f", "#d7af87", "#d7afaf", "#d7afd7", "#d7afff", "#d7d700", "#d7d75f", "#d7d787", "#d7d7af", "#d7d7d7", "#d7d7ff", "#d7ff00", "#d7ff5f", "#d7ff87", "#d7ffaf", "#d7ffd7", "#d7ffff", "#ff0000", "#ff005f", "#ff0087", "#ff00af", "#ff00d7", "#ff00ff", "#ff5f00", "#ff5f5f", "#ff5f87", "#ff5faf", "#ff5fd7", "#ff5fff", "#ff8700", "#ff875f", "#ff8787", "#ff87af", "#ff87d7", "#ff87ff", "#ffaf00", "#ffaf5f", "#ffaf87", "#ffafaf", "#ffafd7", "#ffafff", "#ffd700", "#ffd75f", "#ffd787", "#ffd7af", "#ffd7d7", "#ffd7ff", "#ffff00", "#ffff5f", "#ffff87", "#ffffaf", "#ffffd7", "#ffffff", "#080808", "#121212", "#1c1c1c", "#262626", "#303030", "#3a3a3a", "#444444", "#4e4e4e", "#585858", "#626262", "#6c6c6c", "#767676", "#808080", "#8a8a8a", "#949494", "#9e9e9e", "#a8a8a8", "#b2b2b2", "#bcbcbc", "#c6c6c6", "#d0d0d0", "#dadada", "#e4e4e4", "#eeeeee"];
  var REXPAINT = [
    [64, 0, 0],
    [102, 0, 0],
    [140, 0, 0],
    [178, 0, 0],
    [217, 0, 0],
    [255, 0, 0],
    [255, 51, 51],
    [255, 102, 102],
    [0, 32, 64],
    [0, 51, 102],
    [0, 70, 140],
    [0, 89, 178],
    [0, 108, 217],
    [0, 128, 255],
    [51, 153, 255],
    [102, 178, 255],
    [64, 16, 0],
    [102, 26, 0],
    [140, 35, 0],
    [178, 45, 0],
    [217, 54, 0],
    [255, 64, 0],
    [255, 102, 51],
    [255, 140, 102],
    [0, 0, 64],
    [0, 0, 102],
    [0, 0, 140],
    [0, 0, 178],
    [0, 0, 217],
    [0, 0, 255],
    [51, 51, 255],
    [102, 102, 255],
    [64, 32, 0],
    [102, 51, 0],
    [140, 70, 0],
    [178, 89, 0],
    [217, 108, 0],
    [255, 128, 0],
    [255, 153, 51],
    [255, 178, 102],
    [16, 0, 64],
    [26, 0, 102],
    [35, 0, 140],
    [45, 0, 178],
    [54, 0, 217],
    [64, 0, 255],
    [102, 51, 255],
    [140, 102, 255],
    [64, 48, 0],
    [102, 77, 0],
    [140, 105, 0],
    [178, 134, 0],
    [217, 163, 0],
    [255, 191, 0],
    [255, 204, 51],
    [255, 217, 102],
    [32, 0, 64],
    [51, 0, 102],
    [70, 0, 140],
    [89, 0, 178],
    [108, 0, 217],
    [128, 0, 255],
    [153, 51, 255],
    [178, 102, 255],
    [64, 64, 0],
    [102, 102, 0],
    [140, 140, 0],
    [178, 178, 0],
    [217, 217, 0],
    [255, 255, 0],
    [255, 255, 51],
    [255, 255, 102],
    [48, 0, 64],
    [77, 0, 102],
    [105, 0, 140],
    [134, 0, 178],
    [163, 0, 217],
    [191, 0, 255],
    [204, 51, 255],
    [217, 102, 255],
    [48, 64, 0],
    [77, 102, 0],
    [105, 140, 0],
    [134, 178, 0],
    [163, 217, 0],
    [191, 255, 0],
    [204, 255, 51],
    [217, 255, 102],
    [64, 0, 64],
    [102, 0, 102],
    [140, 0, 140],
    [178, 0, 178],
    [217, 0, 217],
    [255, 0, 255],
    [255, 51, 255],
    [255, 102, 255],
    [32, 64, 0],
    [51, 102, 0],
    [70, 140, 0],
    [89, 178, 0],
    [108, 217, 0],
    [128, 255, 0],
    [153, 255, 51],
    [178, 255, 102],
    [64, 0, 48],
    [102, 0, 77],
    [140, 0, 105],
    [178, 0, 134],
    [217, 0, 163],
    [255, 0, 191],
    [255, 51, 204],
    [255, 102, 217],
    [0, 64, 0],
    [0, 102, 0],
    [0, 140, 0],
    [0, 178, 0],
    [0, 217, 0],
    [0, 255, 0],
    [51, 255, 51],
    [102, 255, 102],
    [64, 0, 32],
    [102, 0, 51],
    [140, 0, 70],
    [178, 0, 89],
    [217, 0, 108],
    [255, 0, 128],
    [255, 51, 153],
    [255, 102, 178],
    [0, 64, 32],
    [0, 102, 51],
    [0, 140, 70],
    [0, 178, 89],
    [0, 217, 108],
    [0, 255, 128],
    [51, 255, 153],
    [102, 255, 178],
    [64, 0, 16],
    [102, 0, 26],
    [140, 0, 35],
    [178, 0, 45],
    [217, 0, 54],
    [255, 0, 64],
    [255, 51, 102],
    [255, 102, 140],
    [0, 64, 48],
    [0, 102, 77],
    [0, 140, 105],
    [0, 178, 134],
    [0, 217, 163],
    [0, 255, 191],
    [51, 255, 204],
    [102, 255, 217],
    [26, 26, 26],
    [51, 51, 51],
    [77, 77, 77],
    [102, 102, 102],
    [128, 128, 128],
    [158, 158, 158],
    [191, 191, 191],
    [222, 222, 222],
    [0, 64, 64],
    [0, 102, 102],
    [0, 140, 140],
    [0, 178, 178],
    [0, 217, 217],
    [0, 255, 255],
    [51, 255, 255],
    [102, 255, 255],
    [26, 20, 13],
    [51, 41, 26],
    [77, 61, 38],
    [102, 82, 51],
    [128, 102, 64],
    [158, 134, 100],
    [191, 171, 143],
    [222, 211, 195],
    [0, 48, 64],
    [0, 77, 102],
    [0, 105, 140],
    [0, 134, 178],
    [0, 163, 217],
    [0, 191, 255],
    [51, 204, 255],
    [102, 217, 255],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255]
  ].map((color) => `rgb(${color.join(",")})`);
  var REXPAINT_8 = REXPAINT.map((_, index, all) => {
    let remainder = index % 8;
    let set = index >> 3;
    set = index < 96 ? 2 * set : (set - 12) * 2 + 1;
    return all[8 * set + remainder];
  });

  // node_modules/fastiles/js/scene.js
  var VERTICES_PER_TILE = 6;
  var Scene = class {
    constructor(options, palette4 = palette_default.default()) {
      this._data = {
        glyph: new Uint16Array(),
        style: new Uint16Array()
      };
      this._buffers = {};
      this._attribs = {};
      this._uniforms = {};
      this._drawRequested = false;
      this._gl = this._initGL();
      this.configure(options);
      this.palette = palette4;
    }
    get node() {
      return this._gl.canvas;
    }
    configure(options) {
      const gl = this._gl;
      const uniforms = this._uniforms;
      if (options.tileCount || options.tileSize) {
        const node = this.node;
        let tileSize = options.tileSize || [node.width / this._tileCount[0], node.height / this._tileCount[1]];
        let tileCount = options.tileCount || this._tileCount;
        node.width = tileCount[0] * tileSize[0];
        node.height = tileCount[1] * tileSize[1];
        gl.viewport(0, 0, node.width, node.height);
        gl.uniform2ui(uniforms["viewportSize"], node.width, node.height);
      }
      if (options.tileCount) {
        this._tileCount = options.tileCount;
        this._createGeometry(this._tileCount);
        this._createData(this._tileCount[0] * this._tileCount[1]);
      }
      options.tileSize && gl.uniform2uiv(uniforms["tileSize"], options.tileSize);
      options.font && this._uploadFont(options.font);
    }
    get palette() {
      return this._palette;
    }
    set palette(palette4) {
      if (this._palette) {
        this._palette.scene = null;
      }
      this._palette = palette4;
      this._palette.scene = this;
    }
    draw(position, glyph, fg, bg) {
      let index = position[1] * this._tileCount[0] + position[0];
      index *= VERTICES_PER_TILE;
      this._data.glyph[index + 2] = glyph;
      this._data.glyph[index + 5] = glyph;
      let style = (bg << 8) + fg;
      this._data.style[index + 2] = style;
      this._data.style[index + 5] = style;
      this._requestDraw();
    }
    uploadPaletteData(data) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._textures["palette"]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      this._requestDraw();
    }
    _initGL() {
      let node = document.createElement("canvas");
      let gl = node.getContext("webgl2");
      if (!gl) {
        throw new Error("WebGL 2 not supported");
      }
      const p = createProgram(gl, VS, FS);
      gl.useProgram(p);
      const attributeCount = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < attributeCount; i++) {
        gl.enableVertexAttribArray(i);
        let info = gl.getActiveAttrib(p, i);
        this._attribs[info.name] = i;
      }
      const uniformCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let info = gl.getActiveUniform(p, i);
        this._uniforms[info.name] = gl.getUniformLocation(p, info.name);
      }
      gl.uniform1i(this._uniforms["font"], 0);
      gl.uniform1i(this._uniforms["palette"], 1);
      this._textures = {
        font: createTexture(gl),
        palette: createTexture(gl)
      };
      return gl;
    }
    _createGeometry(size) {
      const gl = this._gl;
      this._buffers.position && gl.deleteBuffer(this._buffers.position);
      this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
      let buffers = createGeometry(gl, this._attribs, size);
      Object.assign(this._buffers, buffers);
    }
    _createData(tileCount) {
      const gl = this._gl;
      const attribs = this._attribs;
      this._buffers.glyph && gl.deleteBuffer(this._buffers.glyph);
      this._buffers.style && gl.deleteBuffer(this._buffers.style);
      this._data.glyph = new Uint16Array(tileCount * VERTICES_PER_TILE);
      this._data.style = new Uint16Array(tileCount * VERTICES_PER_TILE);
      const glyph = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, glyph);
      gl.vertexAttribIPointer(attribs["glyph"], 1, gl.UNSIGNED_SHORT, 0, 0);
      const style = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, style);
      gl.vertexAttribIPointer(attribs["style"], 1, gl.UNSIGNED_SHORT, 0, 0);
      Object.assign(this._buffers, {glyph, style});
    }
    _requestDraw() {
      if (this._drawRequested) {
        return;
      }
      this._drawRequested = true;
      requestAnimationFrame(() => this._draw());
    }
    _draw() {
      const gl = this._gl;
      this._drawRequested = false;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.glyph);
      gl.bufferData(gl.ARRAY_BUFFER, this._data.glyph, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style);
      gl.bufferData(gl.ARRAY_BUFFER, this._data.style, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this._tileCount[0] * this._tileCount[1] * VERTICES_PER_TILE);
    }
    _uploadFont(pixels) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._textures["font"]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      this._requestDraw();
    }
  };
  var scene_default = Scene;
  function createGeometry(gl, attribs, size) {
    let tileCount = size[0] * size[1];
    let positionData = new Uint16Array(tileCount * QUAD.length);
    let uvData = new Uint8Array(tileCount * QUAD.length);
    let i = 0;
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[0]; x++) {
        QUAD.forEach((value) => {
          positionData[i] = (i % 2 ? y : x) + value;
          uvData[i] = value;
          i++;
        });
      }
    }
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.vertexAttribIPointer(attribs["position"], 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    const uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.vertexAttribIPointer(attribs["uv"], 2, gl.UNSIGNED_BYTE, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
    return {position, uv};
  }

  // src/engine/renderer.ts
  var Renderer = class {
    constructor(options, palette4) {
      this.layers = [];
      this.tileCount = options.tileCount;
      let scene = new scene_default(options, palette4);
      document.body.appendChild(scene.node);
      this.scene = scene;
      this.center = [0, 0];
    }
    configure(options) {
      this.scene.configure(options);
      if (options.tileCount) {
        let center = this.center;
        this.tileCount = options.tileCount;
        this.center = center;
      }
    }
    get node() {
      return this.scene.node;
    }
    set center(center) {
      this.offset = [
        center[0] - (this.tileCount[0] >> 1),
        center[1] - (this.tileCount[1] >> 1)
      ];
      this.drawAll();
    }
    get center() {
      return [
        this.offset[0] + (this.tileCount[0] >> 1),
        this.offset[1] + (this.tileCount[1] >> 1)
      ];
    }
    get leftTop() {
      return [
        this.offset[0],
        this.offset[1]
      ];
    }
    get rightBottom() {
      return [
        this.offset[0] + this.tileCount[0],
        this.offset[1] + this.tileCount[1]
      ];
    }
    add(item, layer) {
      const record = {item, footprint: []};
      while (this.layers.length <= layer) {
        this.layers.push([]);
      }
      this.layers[layer].push(record);
      this.drawRecord(record, {hitTest: true});
    }
    remove(item) {
      let record;
      this.layers.forEach((layer) => {
        let index = layer.findIndex((record2) => record2.item == item);
        if (index > -1) {
          record = layer[index];
          layer.splice(index, 1);
        }
      });
      if (!record) {
        throw new Error("Cannot remove item; item not found");
      }
      this.drawFootprint(record);
    }
    dirty(item) {
      let record;
      this.layers.forEach((layer) => {
        let r = layer.find((record2) => record2.item == item);
        if (r) {
          record = r;
        }
      });
      if (!record) {
        throw new Error("Cannot mark dirty; item not found");
      }
      this.drawFootprint(record);
      this.drawRecord(record, {hitTest: true});
    }
    hitTest(point2) {
      let i = this.layers.length;
      while (i-- > 0) {
        let layer = this.layers[i];
        let j = layer.length;
        while (j-- > 0) {
          let record = layer[j];
          let data = record.item.query(point2);
          if (data) {
            return data;
          }
        }
      }
      throw new Error("Hit test fail");
    }
    drawAll() {
      this.layers.forEach((layer) => layer.forEach((record) => {
        this.drawRecord(record, {hitTest: false});
      }));
    }
    drawFootprint(record) {
      record.footprint.forEach((point2) => {
        this.drawData(point2, this.hitTest(point2));
      });
    }
    drawRecord(record, options) {
      record.footprint = [];
      record.item.footprint((point2, data) => {
        record.footprint.push(point2);
        this.drawData(point2, options.hitTest ? null : data);
      });
    }
    drawData(point2, data) {
      let scenePoint = [
        point2[0] - this.offset[0],
        point2[1] - this.offset[1]
      ];
      if (scenePoint[0] < 0 || scenePoint[1] < 0 || scenePoint[0] >= this.tileCount[0] || scenePoint[1] >= this.tileCount[1]) {
        return;
      }
      if (!data) {
        data = this.hitTest(point2);
      }
      this.scene.draw(scenePoint, data.ch, data.fg, data.bg);
    }
  };
  var renderer_default = Renderer;

  // src/engine/port.ts
  var FONT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20];
  var DPR = window.devicePixelRatio;
  var FONTS = {};
  async function loadImage(src) {
    let img = new Image();
    img.src = src;
    await img.decode();
    return img;
  }
  function adjustByDPR(size) {
    let adjusted = Math.round(size * DPR);
    if (!(adjusted in FONTS)) {
      const source = FONTS[size];
      let canvas = document.createElement("canvas");
      canvas.width = source.width * DPR;
      canvas.height = source.height * DPR;
      let ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      FONTS[adjusted] = canvas;
    }
    return adjusted;
  }
  function computeSceneOptions(node, tileSize) {
    let adjustedTileSize = adjustByDPR(tileSize);
    let tileCount = computeTileCount(node, tileSize);
    console.log("setTileSize", tileSize, adjustedTileSize);
    console.log("tileCount", tileCount);
    return {
      tileCount,
      tileSize: [adjustedTileSize, adjustedTileSize],
      font: FONTS[adjustedTileSize]
    };
  }
  function computeTileCount(node, tileSize) {
    return [node.offsetWidth, node.offsetHeight].map((size) => {
      let tiles = Math.ceil(size / tileSize);
      if (tiles % 2 == 0) {
        tiles++;
      }
      return tiles;
    });
  }
  async function init() {
    let promises = FONT_SIZES.map((size) => loadImage(`font/${size}.png`));
    let images = await Promise.all(promises);
    images.forEach((image, i) => FONTS[FONT_SIZES[i]] = image);
  }
  var Port = class {
    constructor(parent, tileSize, palette4) {
      this.parent = parent;
      this.tileSize = tileSize;
      let options = computeSceneOptions(parent, tileSize);
      this.renderer = new renderer_default(options, palette4);
      parent.appendChild(this.renderer.node);
      this.updateSceneSize(options.tileCount);
      window.addEventListener("resize", (_) => {
        let tileCount = computeTileCount(this.parent, this.tileSize);
        this.renderer.configure({tileCount});
        this.updateSceneSize(tileCount);
      });
    }
    static bestSize(parent, tileCountHorizontal, palette4) {
      const idealSize = parent.offsetWidth / tileCountHorizontal;
      const bts = FONT_SIZES.slice().sort((a, b) => Math.abs(a - idealSize) - Math.abs(b - idealSize))[0];
      console.log("bestTileSize for", tileCountHorizontal, "is", bts);
      return new this(parent, bts, palette4);
    }
    setTileSize(tileSize) {
      this.tileSize = tileSize;
      let options = computeSceneOptions(this.parent, tileSize);
      this.renderer.configure(options);
      this.updateSceneSize(options.tileCount);
    }
    updateSceneSize(tileCount) {
      const node = this.renderer.node;
      const width = tileCount[0] * this.tileSize;
      const height = tileCount[1] * this.tileSize;
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
      node.style.left = `${(this.parent.offsetWidth - width) / 2}px`;
      node.style.top = `${(this.parent.offsetHeight - height) / 2}px`;
    }
  };
  var port_default = Port;

  // src/engine/utils.ts
  var DIRS = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];
  var CHAR_PAIRS = `-|\\/`;
  function ensure(arr, x, y) {
    while (arr.length <= y) {
      arr.push([]);
    }
    let row = arr[y];
    while (row.length <= x) {
      row.push(null);
    }
  }
  function stringToCharArray(s) {
    let ca = [];
    while (s.startsWith("\n")) {
      s = s.substring(1);
    }
    while (s.endsWith("\n")) {
      s = s.substring(0, s.length - 1);
    }
    s.split("\n").forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        ensure(ca, x, y);
        ca[y][x] = ch;
      });
    });
    return ca;
  }
  function switchChar(ch) {
    let index = CHAR_PAIRS.indexOf(ch);
    if (index == -1) {
      return ch;
    }
    let mod = index % 2;
    let base = Math.floor(index / 2) * 2;
    index = base + (mod + 1) % 2;
    return CHAR_PAIRS.charAt(index);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  register(() => {
    assertEquals(switchChar("a"), "a", "switch extra char");
    assertEquals(switchChar("-"), "|", "switch 0 char");
    assertEquals(switchChar("|"), "-", "switch 1 char");
    assertEquals(switchChar("/"), "\\", "switch 2 char");
  });

  // src/engine/world.ts
  var World = class {
    constructor(renderer, bg) {
      this.renderer = renderer;
      renderer.add(bg, 0);
    }
  };
  var world_default = World;

  // src/engine/entity.ts
  var Entity = class {
    constructor(bitmaps) {
      this.bitmaps = bitmaps;
      this._position = [0, 0];
      this._orientation = 1;
    }
    get position() {
      return this._position;
    }
    set position(position) {
      this._position = position;
      this.renderer && this.renderer.dirty(this);
    }
    get orientation() {
      return this._orientation;
    }
    set orientation(o) {
      this._orientation = o;
      this.renderer && this.renderer.dirty(this);
    }
    query(point2, position = this._position, orientation = this._orientation) {
      const bitmap2 = this.bitmaps[orientation];
      let sx = point2[0] - position[0] + bitmap2.origin[0];
      let sy = point2[1] - position[1] + bitmap2.origin[1];
      let row = bitmap2.data[sy];
      if (!row) {
        return null;
      }
      let item = row[sx];
      return item && item.renderData;
    }
    footprint(cb, position = this._position, orientation = this._orientation) {
      const bitmap2 = this.bitmaps[orientation];
      const [px, py] = [
        position[0] - bitmap2.origin[0],
        position[1] - bitmap2.origin[1]
      ];
      bitmap2.data.forEach((row, sy) => {
        row.forEach((item, sx) => {
          if (!item) {
            return;
          }
          cb([sx + px, sy + py], item.renderData);
        });
      });
    }
    fits(world, position, orientation) {
      let points = [];
      let isInSea = world.has(this);
      this.footprint((point2) => {
        if (isInSea && this.query(point2)) {
          return;
        }
        points.push(point2);
      }, position, orientation);
      return points.every((point2) => !world.query(point2));
    }
  };
  var entity_default = Entity;

  // src/engine/point.ts
  function rotate(point2, origin, amount) {
    let delta = [point2[0] - origin[0], point2[1] - origin[1]];
    let sign = Math.sign(amount);
    while (amount) {
      delta.reverse();
      if (sign == 1) {
        delta[0] *= -1;
      }
      if (sign == -1) {
        delta[1] *= -1;
      }
      amount -= sign;
    }
    return [delta[0] + origin[0], delta[1] + origin[1]];
  }
  register(() => {
    assertEquals(rotate([2, -1], [0, 0], 1), [1, 2], "rotatePoint cw");
    assertEquals(rotate([2, -1], [0, 0], -1), [-1, -2], "rotatePoint ccw");
    assertEquals(rotate([2, -1], [0, 0], 2), [-2, 1], "rotatePoint multiple cw");
    assertEquals(rotate([2, -1], [0, 0], -2), [-2, 1], "rotatePoint multiple ccw");
    assertEquals(rotate([0, 0], [2, 2], 1), [4, 0], "rotatePoint nonzero cw");
    assertEquals(rotate([1, 2], [2, 2], 1), [2, 1], "rotatePoint cw");
  });

  // src/engine/bitmap.ts
  function clone(s) {
    return JSON.parse(JSON.stringify(s));
  }
  function rotate2(bitmap2, amount) {
    let offset = [Infinity, Infinity];
    let rotated = [];
    bitmap2.data.forEach((row, y) => {
      row.forEach((t, x) => {
        let [rx, ry] = rotate([x, y], bitmap2.origin, amount);
        offset[0] = Math.min(offset[0], rx);
        offset[1] = Math.min(offset[1], ry);
        rotated.push({rx, ry, t});
      });
    });
    let data = [];
    rotated.forEach((item) => {
      item.rx -= offset[0];
      item.ry -= offset[1];
      ensure(data, item.rx, item.ry);
      data[item.ry][item.rx] = JSON.parse(JSON.stringify(item.t));
    });
    let origin = [
      bitmap2.origin[0] - offset[0],
      bitmap2.origin[1] - offset[1]
    ];
    return {data, origin};
  }
  register(() => {
    function str(s) {
      return s.data.map((r) => r.join("")).join("\n");
    }
    let source1 = {
      data: [["x", "o", "o"]],
      origin: [0, 0]
    };
    let rotated1 = rotate2(source1, 1);
    assertEquals(str(rotated1), "x\no\no", "rotate data");
    assertEquals(rotated1.origin, [0, 0], "rotate origin");
    let source2 = {
      data: [["x", "o", "o"]],
      origin: [1, 0]
    };
    let rotated2 = rotate2(source2, 1);
    assertEquals(str(rotated2), "x\no\no", "rotate data");
    assertEquals(rotated2.origin, [0, 1], "rotate origin");
  });

  // src/demo/palette.ts
  var palette = palette_default.rexpaint8();
  var BLUE = 99;
  var BROWN_LIGHT = 179;

  // src/demo/ship.ts
  var BITMAPS = [{
    chars: String.raw`
111
1111
11111
 1111
  11
`,
    origin: [2, 2]
  }, {
    chars: String.raw`
  1
 111
 111
11111
 111
 111
`,
    origin: [2, 3]
  }].map(toBitmap);
  var Ship = class extends entity_default {
    constructor() {
      let bitmaps = [];
      for (let i = 0; i < 8; i++) {
        if (i < BITMAPS.length) {
          bitmaps.push(clone(BITMAPS[i]));
        } else {
          let defaultIndex = i % 2;
          let defaultBitmap = BITMAPS[defaultIndex];
          let amount = (i - defaultIndex) / 2;
          let rotated = rotate2(defaultBitmap, amount);
          bitmaps.push(rotated);
        }
      }
      super(bitmaps);
    }
    forward(sea) {
      const dir = DIRS[this.orientation];
      let newPosition = [
        this.position[0] + dir[0],
        this.position[1] + dir[1]
      ];
      if (this.fits(sea, newPosition, this._orientation)) {
        this.position = newPosition;
      }
    }
    rotate(diff) {
      this.orientation = (this.orientation + diff + 8) % 8;
    }
  };
  var ship_default = Ship;
  function toBitmap(template) {
    let data = [];
    stringToCharArray(template.chars).forEach((row, y) => {
      row.forEach((ch, x) => {
        ensure(data, x, y);
        if (ch == " ") {
          data[y][x] = null;
        } else {
          data[y][x] = {
            type: ch,
            renderData: {
              ch: 0,
              fg: 0,
              bg: BROWN_LIGHT
            }
          };
        }
      });
    });
    return {data, origin: template.origin};
  }

  // src/engine/background.ts
  var Background = class {
    constructor(renderer) {
      this.renderer = renderer;
    }
    footprint(cb) {
      const lt = this.renderer.leftTop;
      const rb = this.renderer.rightBottom;
      for (let x = lt[0]; x < rb[0]; x++) {
        for (let y = lt[1]; y < rb[1]; y++) {
          let point2 = [x, y];
          cb(point2, this.query(point2));
        }
      }
    }
  };
  var background_default = Background;

  // src/demo/water.ts
  var Water = class extends background_default {
    query() {
      return {ch: 0, fg: 0, bg: BLUE};
    }
  };
  var water_default = Water;

  // src/demo/sea.ts
  var Sea = class extends world_default {
    constructor(renderer) {
      super(renderer, new water_default(renderer));
      this.ships = [];
    }
    add(entity) {
      switch (true) {
        case entity instanceof ship_default:
          let ship = entity;
          this.ships.push(ship);
          this.renderer.add(ship, 1);
          ship.renderer = this.renderer;
          break;
      }
    }
    remove(entity) {
      switch (true) {
        case entity instanceof ship_default:
          let ship = entity;
          ship.renderer = void 0;
          this.renderer.remove(ship);
          let index = this.ships.indexOf(ship);
          this.ships.splice(index, 1);
          break;
      }
    }
    has(ship) {
      return this.ships.includes(ship);
    }
    query(point2) {
      return this.ships.find((ship) => ship.query(point2));
    }
  };
  var sea_default = Sea;

  // src/engine/timeloop.ts
  var TimeLoop = class {
    constructor() {
      this.queue = [];
    }
    next() {
      let first = this.queue.shift();
      this.queue.forEach((record) => record.remaining -= first.remaining);
      return first.actor;
    }
    add(actor, remaining = 0) {
      let record = {actor, remaining};
      let index = 0;
      while (index < this.queue.length && this.queue[index].remaining <= remaining) {
        index++;
      }
      this.queue.splice(index, 0, record);
    }
    remove(actor) {
      let index = this.queue.findIndex((record) => record.actor == actor);
      if (index == -1) {
        throw new Error("Cannot find actor to be removed");
      }
      this.queue.splice(index, 1);
    }
    async start(world) {
      while (1) {
        let actor = this.next();
        let duration = await actor.act(world);
        this.add(actor, duration);
      }
    }
  };
  var timeloop_default = TimeLoop;

  // src/demo/index.ts
  var Captain = class {
    constructor(ship) {
      this.ship = ship;
    }
    async act(sea) {
      let ship = this.ship;
      let position = ship.position;
      let orientation = ship.orientation;
      if (Math.random() > 0.3) {
        const dir = DIRS[orientation];
        position = [
          position[0] + dir[0],
          position[1] + dir[1]
        ];
      } else {
        orientation = (orientation + (Math.random() > 0.5 ? 1 : -1) + 8) % 8;
      }
      if (ship.fits(sea, position, orientation)) {
        ship.position = position;
        ship.orientation = orientation;
      }
      await sleep(10);
      return 100;
    }
  };
  function randomOrientation() {
    return Math.floor(Math.random() * 8);
  }
  function initShips(sea, loop) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!i || !j)
          continue;
        let ship = new ship_default();
        ship.position = [i * 15, j * 15];
        ship.orientation = randomOrientation();
        sea.add(ship);
        loop.add(new Captain(ship));
      }
    }
  }
  async function init2() {
    await init();
    let port = port_default.bestSize(document.body, 200, palette);
    let sea = new sea_default(port.renderer);
    let loop = new timeloop_default();
    initShips(sea, loop);
    loop.start(sea);
  }
  init2();
  runAndLog();
})();
