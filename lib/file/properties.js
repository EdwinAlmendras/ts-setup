"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("../crypto");
const mime_types_1 = __importDefault(require("mime-types"));
class Properties {
    /**
     * Load metadata from logged cloudDruve
     * @param param
     * @param aes
     */
    static loadMetadata(meta, aes) {
        let { a, s, ts, t, k, u } = meta;
        /* HANDLING FILE INFO */
        let metadata = {
            size: s || 0,
            createdTime: ts || 0,
            type: Number(t),
            isDir: !!t,
            owner: u,
        };
        let parts = k.split(":");
        let key = crypto_1.formatKey(parts[parts.length - 1]);
        /* DECRYPTING KEY WITH AES */
        metadata.key = aes.decryptECB(key);
        if (a) {
            let properties = Properties.decrypt(a, key);
            metadata = Object.assign(Object.assign({}, metadata), { properties });
        }
        return metadata;
    }
    static decrypt(attrsEnc, key) {
        let decAttrs = crypto_1.getCipher(key).decryptCBC(crypto_1.d64(attrsEnc));
        let unpackAttrs = Properties.unpack(decAttrs);
        if (unpackAttrs) {
            return Properties.parse(unpackAttrs);
        }
    }
    static parse(attrs) {
        let { n, lbl, fav, folderColorRgb, target, videoMediaMetadata } = attrs, props = __rest(attrs, ["n", "lbl", "fav", "folderColorRgb", "target", "videoMediaMetadata"]);
        let properties = Object.assign({ name: n, label: LABEL_NAMES[lbl || 0], starred: !!fav, folderColorRgb: folderColorRgb || "white" }, props);
        target && (properties.target = target);
        properties.mimeType = target ? "application/shortcut" : mime_types_1.default.lookup(n);
        videoMediaMetadata && (properties.videoMediaMetadata = JSON.parse(videoMediaMetadata));
        return properties;
    }
    static unpack(attrs) {
        let end = 0;
        while (end < attrs.length && attrs.readUInt8(end))
            end++;
        attrs = attrs.slice(0, end).toString();
        try {
            return JSON.parse(attrs.substr(4));
        }
        catch (error) {
            console.log("error parsing JSON");
        }
    }
    static unparse(attrs) {
        let { name, label, starred, folderColorRgb, mimeType } = attrs, props = __rest(attrs, ["name", "label", "starred", "folderColorRgb", "mimeType"]);
        return Object.assign({ n: name, lbl: label, fav: starred ? 1 : 0 }, props);
    }
    static pack(attrs) {
        let at = Buffer.from(`MEGA${JSON.stringify(attrs)}`);
        const ret = Buffer.alloc(Math.ceil(at.length / 16) * 16);
        at.copy(ret);
        return ret;
    }
}
exports.default = Properties;
const LABEL_NAMES = [
    "",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "grey",
];
