const ASSET_DIR = '/dest';
const ASSET_PATH = (/localhost|127\.0\.0\.1/.test(location.host) ? '' : 'https://raw.githubusercontent.com/DemChing/make-avatars/master') + ASSET_DIR;
const Config = {};

$(function () {
    const Canvas = $('#avatar').get(0);
    const $input = $('#input');
    const $dlStatus = $('#download-status');
    const $shareCopy = $('#share-copy');
    const Ctx = Canvas.getContext('2d');

    let assetCount = 0,
        assetDownloaded = 0;

    function readJSON(url) {
        return new Promise((resolve, reject) => {
            $.getJSON(url)
                .done(resolve)
                .fail(reject)
        })
    }

    const pad = num => `000${num}`.slice(-3);

    const updateDownloadStatus = () => $dlStatus.text(`( ${assetDownloaded} / ${assetCount} )`);

    async function getData() {
        let _base = await readJSON(`${ASSET_PATH}/index.json`),
            promises = [];

        for (let type in _base) {
            Config[type] = {};
            for (let set in _base[type]) {
                Config[type][set] = {};
                for (let i = 0; i < _base[type][set]; i++) {
                    assetCount++;
                    updateDownloadStatus();

                    let id = pad(i);
                    Config[type][set][id] = await readJSON(`${ASSET_PATH}/${type}/${set}/${id}.json`);
                    Config[type][set][id].image = new Image();
                    Config[type][set][id].image.src = `${ASSET_PATH}/${type}/${set}/${id}.png`;
                    promises.push(new Promise(resolve => {
                        Config[type][set][id].image.onload = () => {
                            assetDownloaded++;
                            updateDownloadStatus();
                            resolve();
                        }
                    }))
                }
            }
        }
        await Promise.all(promises)
    }

    function drawItem(src, hash) {
        for (let key in src) {
            drawLayer(src[key].frames[randomArray(Object.keys(src[key].frames), hash)], src[key].image)
        }
    }

    function drawLayer(frame, image) {
        let {
            sx,
            sy,
            w,
            h,
            dx,
            dy,
            rotated
        } = frame;
        if (rotated) {
            Ctx.setTransform(1, 0, 0, 1, 0, 2 * dy + h);
            Ctx.rotate(-90 * Math.PI / 180);
            Ctx.drawImage(image, sx, sy, h, w, dy, dx, h, w);
            Ctx.setTransform(1, 0, 0, 1, 0, 0)
        } else {
            Ctx.drawImage(image, sx, sy, w, h, dx, dy, w, h);
        }
    }

    function simpleHash(str) {
        if (typeof str !== 'string') str = str.toString();
        for (var i = 0, h = 0xdeadbeef; i < str.length; i++)
            h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
        return ((h ^ h >>> 16) >>> 0).toString();
    }

    function randomArray(array, hash) {
        let c = 0,
            len = array.length.toString().length;
        for (let i = 0; i < hash.length; i += len) {
            c += parseInt(hash.substring(i, i + len))
        }
        return array[c % array.length]
    }

    function generate(avatar, background, hash) {
        hash = simpleHash(hash || $input.val() || '');
        avatar = avatar || $('[name="avatars-options"]:checked').val() || 'any';
        background = background || $('[name="backgrounds-options"]:checked').val() || 'none';

        let avatarSets = Object.keys(Config.avatars),
            backgroundSets = Object.keys(Config.backgrounds);

        Ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        if (background != 'none') {
            if (background != 'any' && backgroundSets.indexOf(background) == -1) background = 'any';
            if (background == 'any') background = randomArray(backgroundSets, hash);

            drawItem(Config.backgrounds[background], hash);
        }

        if (avatar != 'any' && avatarSets.indexOf(avatar) == -1) avatar = 'any';
        if (avatar == 'any') avatar = randomArray(avatarSets, hash);

        drawItem(Config.avatars[avatar], hash);
    }

    function randomHash() {
        const _hash = () => Math.random().toString().slice(2)
        return _hash() + _hash();
    }

    function capitalize(str) {
        return str[0].toUpperCase() + str.slice(1)
    }

    function setInputVal(val) {
        $input.val(val)
        $input.trigger('input')
        $('#share-input').val(`${location.origin}${location.pathname}#${encodeURIComponent(val)}`)
    }

    getData()
        .then(() => {
            $('#content').removeClass('d-none');
            $('#loading').toggleClass('show d-none');

            for (let key in Config) {
                let opts = ['any'].concat(Object.keys(Config[key])),
                    $div = $(`<div class='mb-3'></div>`),
                    $btnGroup = $(`<div class='btn-group'></div>`);
                if (key === 'backgrounds') opts.unshift('none');
                $div.append(`<div>${capitalize(key)}</div>`);
                opts.map((v, i) => {
                    let id = `${key}-${v}`;
                    $btnGroup.append(`<input type='radio' class='btn-check' name='${key}-options' id='${id}' value='${v}'${i == 0 ? ' checked' : ''}><label class='btn btn-outline-primary' for='${id}'>${capitalize(v)}</div>`);
                })
                $div.append($btnGroup);
                $('#options').append($div);

                $(`input[name=${key}-options]`).on('change', () => {
                    generate()
                })
            }

            if (location.hash) {
                setInputVal(decodeURIComponent(location.hash.slice(1)))
            }

            $('[data-bs-toggle="tooltip"]').tooltip();

            $input.on('input', () => generate())
            $('#shuffle').on('click', () => {
                setInputVal(randomHash())
            })
            $('#share').on('click', () => {
                $('#share-link').toggleClass('d-none');
                $('[data-bs-toggle="tooltip"]').tooltip('hide');
                $shareCopy.attr('data-bs-original-title', 'Copy').tooltip('show')
            })
            $('#download').on('click', () => {
                let link = $('#downlaod-link').get(0);
                link.href = Canvas.toDataURL();
                link.click();
            })
            $shareCopy.on('click', () => {
                copy($('#share-input').get(0))
                    .then(_ => {
                        $shareCopy.attr('data-bs-original-title', 'Copied').tooltip('show')
                    })
                    .catch(console.log)
            })
            generate()
        })
        .catch(console.log)
})