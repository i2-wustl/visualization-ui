density = () => {
    var x,
        y,
        weight = defaultWeight,
        numThresholds = 20, // default number of thresholds
        isLogScale = true, // default scale type. Log vs linear
        maxThresholdValue = "relative", // default is the max of the data. Alternatively a specific number.
        dx = 960,
        dy = 500,
        r = 20, // blur radius
        k = 2, // log2(grid cell size)
        o = r * 3, // grid offset, to pad for blur
        n = (dx + o * 2) >> k, // grid width
        m = (dy + o * 2) >> k; // grid height

    function density(data) {
        var values0 = new Float32Array(n * m),
            values1 = new Float32Array(n * m);

        data.forEach(function(d, i, data) {
            var xi = (+x(d, i, data) + o) >> k,
                yi = (+y(d, i, data) + o) >> k,
                wi = +weight(d, i, data);
            if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
                values0[xi + yi * n] += wi
            }
        });

        blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
        blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
        blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
        blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
        blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
        blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);

        return d3.contours()
            .thresholds(getDensityThresholds(max(values0), numThresholds, isLogScale))
            .size([n, m])
            (values0)
            .map(transform);
    }

    function max(values, valueof) {
        var n = values.length,
            i = -1,
            value,
            max;

        if (valueof == null) {
            while (++i < n) { // Find the first comparable value.
                if ((value = values[i]) != null && value >= value) {
                    max = value;
                    while (++i < n) { // Compare the remaining values.
                        if ((value = values[i]) != null && value > max) {
                            max = value;
                        }
                    }
                }
            }
        }

        else {
            while (++i < n) { // Find the first comparable value.
                if ((value = valueof(values[i], i, values)) != null && value >= value) {
                    max = value;
                    while (++i < n) { // Compare the remaining values.
                        if ((value = valueof(values[i], i, values)) != null && value > max) {
                            max = value;
                        }
                    }
                }
            }
        }

        return max;
    }

    function blurX(source, target, r) {
        var n = source.width,
            m = source.height,
            w = (r << 1) + 1;
        for (var j = 0; j < m; ++j) {
            for (var i = 0, sr = 0; i < n + r; ++i) {
                if (i < n) {
                    sr += source.data[i + j * n];
                }
                if (i >= r) {
                    if (i >= w) {
                        sr -= source.data[i - w + j * n];
                    }
                    target.data[i - r + j * n] = sr / Math.min(i + 1, n - 1 + w - i, w);
                }
            }
        }
    }

    function blurY(source, target, r) {
        var n = source.width,
            m = source.height,
            w = (r << 1) + 1;
        for (var i = 0; i < n; ++i) {
            for (var j = 0, sr = 0; j < m + r; ++j) {
                if (j < m) {
                    sr += source.data[i + j * n];
                }
                if (j >= r) {
                    if (j >= w) {
                        sr -= source.data[i + (j - w) * n];
                    }
                    target.data[i + (j - r) * n] = sr / Math.min(j + 1, m - 1 + w - j, w);
                }
            }
        }
    }

    function getDensityThresholds(maxDensity, numThresholds, isLog) {

        let minThreshold = 0.01;
        let maxThreshold = maxThresholdValue === "relative" ? maxDensity : maxThresholdValue;

        if (isLog) {
            let stepSize = Math.log2(maxThreshold / minThreshold) / numThresholds;
            return Array.from(Array(numThresholds).keys()).map(x => Math.pow(2,Math.log2(minThreshold) + (x * stepSize)));
        } else {
            let stepSize = maxThreshold / numThresholds;
            return Array.from(Array(numThresholds).keys()).map(x => minThreshold + (x * stepSize));
        }
    }

    function defaultWeight() {
        return 1;
    }

    function transform(geometry) {
        geometry.value *= Math.pow(2, -2 * k); // Density in points per square pixel.
        geometry.coordinates.forEach(transformPolygon);
        return geometry;
    }

    function transformPolygon(coordinates) {
        coordinates.forEach(transformRing);
    }

    function transformRing(coordinates) {
        coordinates.forEach(transformPoint);
    }

    function transformPoint(coordinates) {
        coordinates[0] = coordinates[0] * Math.pow(2, k) - o;
        coordinates[1] = coordinates[1] * Math.pow(2, k) - o;
    }

    function resize() {
        o = r * 3;
        n = (dx + o * 2) >> k;
        m = (dy + o * 2) >> k;
        return density;
    }

    density.x = function(_) {
        return arguments.length ? (x = typeof _ === "function" ? _ : 0, density) : x;
    };

    density.y = function(_) {
        return arguments.length ? (y = typeof _ === "function" ? _ : 0, density) : y;
    };

    density.weight = function(_) {
        return arguments.length ? (weight = typeof _ === "function" ? _ : 1, density) : weight;
    };

    density.isLogScale = function(_) {
        return arguments.length ? (isLogScale = _, density) : isLogScale;
    };

    density.numThresholds = function(_) {
        return arguments.length ? (numThresholds = _, density) : numThresholds;
    };

    density.maxThresholdValue = function(_) {
        return arguments.length ? (maxThresholdValue = _, density) : maxThresholdValue;
    };

    density.size = function(_) {
        if (!arguments.length) return [dx, dy];
        var _0 = Math.ceil(_[0]), _1 = Math.ceil(_[1]);
        if (!(_0 >= 0) && !(_0 >= 0)) throw new Error("invalid size");
        return dx = _0, dy = _1, resize();
    };

    density.cellSize = function(_) {
        if (!arguments.length) return 1 << k;
        if (!((_ = +_) >= 1)) throw new Error("invalid cell size");
        return k = Math.floor(Math.log(_) / Math.LN2), resize();
    };

    density.bandwidth = function(_) {
        if (!arguments.length) return Math.sqrt(r * (r + 1));
        if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth");
        return r = Math.round((Math.sqrt(4 * _ * _ + 1) - 1) / 2), resize();
    };

    return density;
}